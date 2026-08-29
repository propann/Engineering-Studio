import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack Strudel — ce que le code source doit garantir.
 *
 * Ces tests lisent le fichier au lieu de l'exécuter, et c'est assumé : ils
 * verrouillent des invariants d'ORDRE et d'ABSENCE, que monter le composant ne
 * prouverait pas mieux. La logique — stockage, projets, sons, routage MIDI —
 * est exécutée pour de vrai dans les fichiers `core/strudel/*.test.ts`.
 *
 * Le parcours complet a été vérifié au navigateur : chargement de l'éditeur,
 * évaluation, surlignage des événements, arrêt, sans erreur console et sans
 * une seule requête sortante.
 *
 * ## Deux invariants ont changé le 2026-08-29, et pourquoi
 *
 * Le rack sait désormais enregistrer des projets et piloter une machine en
 * MIDI. Deux tests devenaient donc faux :
 *
 * - **« le rack n'écrit sur aucune machine »** interdisait `createWritable`,
 *   `getFileHandle` et `showDirectoryPicker`. C'étaient des APPROXIMATIONS de
 *   l'invariant réel : elles servaient à prouver qu'on ne touchait pas au
 *   dossier d'une machine. Maintenant que le rack écrit de vrais fichiers de
 *   projet, l'approximation interdit exactement ce qu'on veut. Elle est
 *   remplacée par la garantie qu'elle représentait : aucun accès aux modules
 *   qui parlent aux machines, et aucune écriture ailleurs que dans un fichier
 *   désigné par l'utilisateur.
 *
 * - **« la carte ne promet que ce que le rack fait »** exigeait que la carte
 *   du Hub ne mentionne NI machine, NI OP-1, NI EP-133. Le rack les pilote
 *   maintenant : la carte doit le dire. Ce qu'on continue de vérifier, c'est
 *   qu'elle distingue jouer d'écrire — la seule confusion qui pourrait coûter
 *   des données.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..");
const lire = (p: string) => readFileSync(path.join(SRC, p), "utf-8");

/**
 * Retire commentaires et chaînes avant d'analyser du code.
 *
 * Sans cela, un test d'ABSENCE matche le commentaire qui documente
 * l'interdiction : `StrudelRack.tsx` explique pourquoi il ne charge pas
 * d'échantillon distant, et cette phrase suffisait à le faire échouer.
 * Troisième fois que ce piège se présente dans ce dépôt — après la garde des
 * sélecteurs CSS et celle du marqueur de build.
 */
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const RACK = sansCommentaires(lire("pages/StrudelRack.tsx"));
const EDITEUR = sansCommentaires(lire("components/EditeurStrudel.tsx"));
const PROJETS = sansCommentaires(lire("core/strudel/projets.ts"));
const SORTIE = sansCommentaires(lire("core/strudel/sortieMidi.ts"));
const HUB = lire("pages/ToolsHub.tsx");
const APP = lire("App.tsx");
const REGISTRE = lire("pages/OrphanPages.tsx");

describe("le contexte audio est celui du Hub", () => {
  it("`setAudioContext` est appelé AVANT `initStrudel`", () => {
    /**
     * L'ordre est tout. `getAudioContext()` de superdough fabrique un contexte
     * au premier appel et le garde : si `initStrudel` passe en premier,
     * Strudel s'attache définitivement au sien, et le rack sort à côté du
     * mixage du Hub au lieu d'y passer.
     *
     * Rien ne le signalerait — le son sortirait, simplement pas au bon endroit.
     */
    const corps = RACK.slice(RACK.indexOf("const demarrer"), RACK.indexOf("const brancherSurLaConsole"));
    expect(corps, "la fonction demarrer est introuvable").toBeTruthy();
    const iSet = corps.indexOf("setAudioContext");
    const iInit = corps.indexOf("initStrudel");
    expect(iSet, "setAudioContext n'est plus appelé au démarrage").toBeGreaterThan(-1);
    expect(iInit, "initStrudel n'est plus appelé au démarrage").toBeGreaterThan(-1);
    expect(iSet, "initStrudel passe avant setAudioContext").toBeLessThan(iInit);
  });

  it("le contexte vient du fond de panier, pas d'un `new AudioContext`", () => {
    expect(RACK).toContain('from "@studio-hub/rack-bus"');
    expect(RACK).toContain("setAudioContext?.(contexte())");
    expect(RACK, "le rack fabrique son propre contexte").not.toContain("new AudioContext");
  });
});

describe("la sortie passe par la console du rack", () => {
  /**
   * C'est ce qui manquait jusqu'au 2026-08-29 : le rack utilisait le bon
   * contexte, mais Strudel restait câblé sur `ctx.destination`. Son volume
   * était donc le seul du Hub à ne pas répondre à la console, et son signal
   * n'atteignait ni la réverbération partagée ni l'analyseur.
   */
  it("le rack ouvre une voie avec `brancher`", () => {
    expect(RACK).toContain("brancher(\"Strudel\")");
  });

  it("la sortie de superdough est détournée vers la prise", () => {
    const corps = RACK.slice(RACK.indexOf("const brancherSurLaConsole"), RACK.indexOf("const preparerSurlignage"));
    expect(corps).toContain("destinationGain");
    expect(corps, "l'ancienne destination n'est pas débranchée").toContain("disconnect()");
    expect(corps, "la sortie n'est pas rebranchée sur la prise").toContain("connect(p.entree)");
  });

  it("la voie est rendue au démontage", () => {
    // Une voie laissée derrière garderait le graphe audio vivant et
    // encombrerait la console d'une tranche fantôme à chaque visite.
    expect(RACK).toContain("prise.current?.detacher()");
  });

  it("les réglages de console passent par le fond de panier", () => {
    for (const f of ["reglerGain", "reglerPanoramique", "reglerDepart"]) {
      expect(RACK, `${f} n'est plus utilisé`).toContain(f);
    }
  });
});

describe("rien ne part sur un serveur", () => {
  it("le rack ne charge aucun échantillon distant", () => {
    // Strudel n'en charge aucun par defaut ; l'option de pré-chargement en
    // ferait venir de github. L'atelier promet que rien ne sort du navigateur.
    expect(RACK, "le rack charge des échantillons").not.toMatch(/\bsamples\(/);
    expect(RACK, "le rack passe une option de pré-chargement").not.toContain("prebake");
    expect(RACK).not.toContain("github:");
  });

  it("l'éditeur et la documentation sont embarqués, pas cherchés en ligne", () => {
    // Une doc en iframe sur strudel.cc, ou un thème depuis un CDN, casserait
    // la promesse aussi surement qu'un echantillon.
    for (const src of [RACK, EDITEUR]) {
      expect(src).not.toMatch(/https?:\/\//);
      expect(src, "une requête sort du rack").not.toMatch(/\bfetch\(|XMLHttpRequest|new WebSocket/);
    }
  });

  it("les sons ZZFX sont enregistrés localement, pas téléchargés", () => {
    // Ce sont des generateurs : les ajouter elargit la palette hors ligne.
    expect(RACK).toContain("registerZZFXSounds");
  });
});

describe("le rack n'écrit sur aucune machine", () => {
  /**
   * L'invariant qui compte, et le seul qui puisse coûter des données.
   *
   * Le rack ENVOIE des notes MIDI — un message qui disparaît une fois joué —
   * et n'ÉCRIT jamais dans la mémoire d'une machine : ni patch, ni
   * échantillon, ni dossier. Les tests ci-dessous vérifient la frontière, pas
   * une liste d'API.
   */
  it("aucun module d'écriture machine n'est importé", () => {
    for (const src of [RACK, PROJETS, SORTIE]) {
      expect(src).not.toContain("machineWrite");
      expect(src, "un accès au coffre est importé").not.toMatch(/from ".*VaultPanel"/);
      expect(src, "un accès aux dossiers machine est importé").not.toMatch(
        /from ".*(directoryHandleStore|fs-handles)"/,
      );
    }
  });

  it("le rack ne demande jamais un DOSSIER, seulement un fichier", () => {
    /**
     * `showDirectoryPicker` donne un accès récursif en écriture à tout un
     * arbre — c'est par là qu'on abîmerait une carte SD de machine. Un
     * sélecteur de FICHIER ne peut toucher que ce que l'utilisateur a nommé.
     */
    for (const src of [RACK, PROJETS]) {
      expect(src, "le rack ouvre un sélecteur de dossier").not.toContain("showDirectoryPicker");
    }
  });

  it("l'écriture ne vise que la poignée rendue par le sélecteur", () => {
    // `createWritable` est autorise, mais UNIQUEMENT sur une poignee issue de
    // showSaveFilePicker — donc sur un fichier que l'utilisateur a designe.
    const i = PROJETS.indexOf("createWritable");
    expect(i, "plus aucune écriture de projet").toBeGreaterThan(-1);
    const avant = PROJETS.slice(0, i);
    expect(avant, "createWritable sans sélecteur en amont").toContain("showSaveFilePicker");
  });

  it("le PANIC coupe aussi les machines", () => {
    // `hush()` ne coupe que l'audio de Strudel : une note partie en MIDI
    // continuerait de sonner indefiniment sur la machine.
    const corps = RACK.slice(RACK.indexOf("const arreter"), RACK.indexOf("useEffect(() => () =>"));
    expect(corps).toContain("hush()");
    expect(corps).toContain("panicMachines()");
  });
});

describe("le chargement reste à la demande", () => {
  it("Strudel est importé dynamiquement, jamais en tête de fichier", () => {
    /**
     * Le paquet pèse environ 1,5 Mo et sort dans son propre morceau. Un import
     * statique le ferait entrer dans le bundle principal du Hub, pour une page
     * qu'on n'ouvre pas à chaque fois.
     */
    expect(RACK).toContain('await import("@strudel/web")');
    expect(RACK, "@strudel/web est importé statiquement").not.toMatch(
      /^import .* from "@strudel\/web"/m,
    );
  });

  it("CodeMirror aussi — il pèse plus lourd que Strudel", () => {
    expect(EDITEUR).toContain('await import("@strudel/codemirror")');
    expect(EDITEUR, "@strudel/codemirror est importé statiquement").not.toMatch(
      /^import .* from "@strudel\/codemirror"/m,
    );
  });

  it("la page elle-même est chargée à la demande par App.tsx", () => {
    expect(APP).toMatch(/lazy\(\(\) => import\("\.\/pages\/StrudelRack"\)\)/);
  });
});

describe("l'éditeur est celui de Strudel", () => {
  it("le surlignage des événements actifs est câblé", () => {
    /**
     * C'est la seule raison d'avoir pris CodeMirror plutôt qu'un `<textarea>`.
     * Trois pièces sont nécessaires, et l'absence d'une seule laisse un
     * éditeur muet pendant la lecture :
     *   - les positions relevées après chaque évaluation,
     *   - la boucle d'images qui interroge l'ordonnanceur,
     *   - l'appel qui illumine.
     */
    expect(RACK, "les positions ne sont plus relevées").toContain("miniLocations");
    expect(RACK, "la boucle d'images a disparu").toContain("Drawer");
    expect(EDITEUR, "l'appel de surlignage a disparu").toContain("highlightMiniLocations");
    expect(EDITEUR).toContain("updateMiniLocations");
  });

  it("un éditeur de repli existe si CodeMirror ne charge pas", () => {
    // Perdre la coloration est acceptable ; perdre l'acces au code ne l'est pas.
    expect(RACK).toContain("sr-repli");
    expect(RACK).toContain("editeurPret === false");
  });
});

describe("l'arrêt est toujours possible", () => {
  it("le bouton d'arrêt n'est jamais désactivé", () => {
    // C'est le PANIC de ce rack : il doit repondre meme pendant le chargement.
    const i = RACK.indexOf('className="sr-bouton sr-bouton--stop"');
    expect(i, "le bouton STOP de la barre a disparu").toBeGreaterThan(-1);
    const bouton = RACK.slice(i, RACK.indexOf("</button>", i));
    expect(bouton, "le bouton STOP peut être désactivé").not.toContain("disabled");
  });

  it("quitter la page coupe ce qui joue", () => {
    // Sans cela le motif continuerait par-dessus l'ecran suivant.
    expect(RACK).toContain("useEffect(() => () => api.current?.hush(), [])");
  });

  it("Échap arrête, Ctrl+Entrée joue", () => {
    expect(RACK).toContain('e.key === "Escape"');
    expect(RACK).toContain('e.key === "Enter"');
  });
});

describe("le rack est atteignable", () => {
  it("une carte du Hub y mène", () => {
    const i = HUB.indexOf('id: "strudel"');
    expect(i, "la carte Strudel a disparu du Hub").toBeGreaterThan(-1);
    expect(HUB.slice(i, HUB.indexOf("\n  },", i))).toContain('page: "strudel-rack"');
  });

  it("la route existe dans App.tsx", () => {
    expect(APP).toContain('| "strudel-rack"');
    expect(APP).toContain('case "strudel-rack":');
  });

  it("le registre des pages le recense", () => {
    // Une page absente du registre est une page qu'on perdra.
    expect(REGISTRE).toContain('id: "strudel-rack"');
    expect(REGISTRE).toContain('source: "pages/StrudelRack.tsx"');
  });

  it("la carte distingue jouer une machine d'écrire dedans", () => {
    const i = HUB.indexOf('id: "strudel"');
    const entree = HUB.slice(i, HUB.indexOf("\n  },", i));
    // Elle annonce l'absence d'echantillon distant : c'est une promesse
    // verifiee par les tests plus haut.
    expect(entree).toContain("sans aucun échantillon distant");
    /**
     * Depuis que le rack pilote les machines, la carte doit le dire — mais
     * l'ambiguïté entre « jouer » et « écrire » est précisément celle qui
     * coûterait des données. Nommer une machine oblige donc à démentir
     * l'écriture dans la même phrase.
     */
    if (/machine|OP-1|EP-133|MIDI/.test(entree)) {
      expect(
        entree,
        "la carte parle de machine sans démentir l'écriture",
      ).toMatch(/sans (jamais )?rien écrire|n'écrit|aucune écriture/);
    }
  });
});

describe("l'horloge est asservie au transport du Hub", () => {
  it("le rack s'abonne au transport partagé", () => {
    expect(RACK).toContain("sAbonnerTransport");
    expect(RACK).toContain("reglerBpm");
  });

  it("le contrôle de tempo est borné par les limites du rack-bus", () => {
    expect(RACK).toContain("min={BPM_MIN}");
    expect(RACK).toContain("max={BPM_MAX}");
  });

  it("le tempo est converti en cycles, pas passé tel quel", () => {
    /**
     * Strudel compte en cycles par seconde. Passer 120 sans conversion
     * donnerait 120 cycles par seconde — un bourdonnement, pas un tempo.
     * La conversion est exportée et testée dans `core/strudel/tempo.test.ts`.
     */
    expect(RACK).toContain("bpmVersCps");
    expect(RACK).toContain("setCps");
  });
});
