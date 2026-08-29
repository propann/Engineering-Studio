import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Branchement du delay sur le tempo du studio hote.
 *
 * Le plan annoncait ici « une victoire gratuite : le rack demarre et s'arrete
 * avec les studios ». C'etait faux : le rack n'a pas de transport — ni lecture,
 * ni arret, ni curseur. Il n'y a rien a demarrer.
 *
 * Ce qui depend reellement du tempo dans le rack, ce sont deux valeurs : le
 * temps de delay et la vitesse d'arpege. Le delay est branche ici ; l'arpege
 * attend le module 5, qui refera l'arpegiateur en entier.
 *
 * Ces tests lisent le source parce que le defaut vise n'est pas de type : un
 * abonnement retire, un recalage qui n'appelle pas `updateParam`, un curseur
 * qui reste actif — tout cela compile et se construit sans broncher.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACK = readFileSync(path.join(DIR, "AudioPluginRack.tsx"), "utf-8");
const CSS = readFileSync(path.join(DIR, "audio-plugin-rack.css"), "utf-8");
// L'interface du delai vit dans le rack d'effets : chaque rack porte la sienne.
// Ces tests lisent donc deux sources — le rack de moteurs pour l'ecoute du
// tempo, le rack d'effets pour les commandes.
const EFFETS_UI = readFileSync(path.join(DIR, "..", "racks", "RackEffets.tsx"), "utf-8");

describe("le rack ecoute le tempo de l'hote", () => {
  it("lit bien le source du rack", () => {
    expect(RACK.length).toBeGreaterThan(100000);
  });

  it("s'abonne a hub:transport", () => {
    // Le studio hote rediffuse le transport du hub sur `window` ; embarque, le
    // rack est dans le meme document. Sans cet abonnement il reste a 120 quoi
    // que fasse le studio, et le bouton SYNC calerait sur un tempo invente.
    expect(RACK).toContain('window.addEventListener("hub:transport"');
  });

  it("se desabonne au demontage", () => {
    // Le rack se monte et se demonte a chaque ouverture de tiroir. Un
    // ecouteur laisse derriere s'accumulerait a chaque cycle.
    expect(RACK).toContain('window.removeEventListener("hub:transport"');
  });

  it("refuse un BPM qui n'en est pas un", () => {
    // Le message vient d'une autre fenetre par postMessage : rien ne garantit
    // sa forme. Un NaN se propagerait jusqu'a delayTime, ou il ne leve pas —
    // il rend le delay muet, ce qui se diagnostique tres mal.
    expect(RACK).toMatch(/Number\.isFinite\(msg\.bpm\)/);
  });

  it("recalcule le temps de delay quand le tempo change", () => {
    expect(RACK).toContain("dureeDivisionMs(bpmHote, delayDivision)");
  });

  it("passe par updateParam et non par le setter nu", () => {
    // `updateParam` reporte la valeur dans le patch courant. Avec
    // `setFxDelayTime` seul, l'ecran afficherait le bon temps mais un sample
    // rendu ensuite reprendrait l'ancien — divergence silencieuse entre ce
    // qu'on entend et ce qu'on exporte.
    expect(RACK).toMatch(/updateParam\("fxDelayTime", dureeDivisionMs\(/);
  });

  it("le recalage depend des trois valeurs qui le determinent", () => {
    // Une dependance manquante fige le delay au tempo recu en premier.
    const i = RACK.indexOf("dureeDivisionMs(bpmHote, delayDivision)");
    expect(RACK.slice(i, i + 200)).toContain("[delaySync, bpmHote, delayDivision]");
  });
});

describe("l'interface du delay synchronise", () => {
  it("desactive le curseur TEMPS quand SYNC est actif", () => {
    // Sinon on peut le bouger : la valeur saute, puis revient au prochain
    // recalage. Un controle qui ne tient pas ce qu'on lui donne.
    const i = EFFETS_UI.indexOf("TEMPS {params.fxDelayTime} ms");
    expect(i).toBeGreaterThan(-1);
    expect(EFFETS_UI.slice(i, i + 300)).toContain("disabled={delaySync}");
  });

  it("verrouille le choix de division tant que SYNC est inactif", () => {
    const i = EFFETS_UI.indexOf('className="fx-sync-div"');
    expect(i).toBeGreaterThan(-1);
    expect(EFFETS_UI.slice(i, i + 200)).toContain("disabled={!delaySync}");
  });

  it("affiche le tempo sur lequel il cale", () => {
    // Un « SYNC » allume sans chiffre laisse croire que ca marche alors que le
    // rack peut etre reste sur son 120 par defaut, faute de studio hote.
    expect(EFFETS_UI).toContain("`· ${bpmHote} BPM`");
  });

  it("propose toutes les divisions, sans liste ecrite en dur", () => {
    // Une seconde liste divergerait de ORDRE_DIVISIONS a la premiere retouche.
    expect(EFFETS_UI).toContain("ORDRE_DIVISIONS.map((d) => (");
  });

  it("les classes rendues ont une regle CSS", () => {
    // Le defaut classique du fichier : une classe posee dans le JSX que
    // personne ne definit. Ni le typecheck ni le build ne le voient.
    for (const c of ["fx-sync", "fx-sync-btn", "fx-sync-div"]) {
      expect(CSS).toMatch(new RegExp(`\\.${c}[\\s,{:.]`));
    }
  });
});

describe("cycle de vie du contexte audio", () => {
  /**
   * Ce bloc verifiait l'inverse jusqu'au 2026-08-29 : que le rack FERME son
   * `AudioContext` au demontage. C'etait juste tant qu'il en etait le
   * proprietaire — il en fabriquait un par montage, et Chrome en plafonne six
   * par document ; au septieme, plus aucun son et aucune erreur.
   *
   * Le rack est depuis migre sur `@studio-hub/rack-bus`. Le probleme a disparu
   * a la racine : il n'y a plus qu'UN contexte pour tout le document. Fermer
   * ce contexte-la rendrait muet tout ce qui joue ailleurs — le rack Strudel
   * en premier, qui peut tenir une boucle pendant qu'on ne touche pas aux
   * moteurs.
   *
   * L'invariant s'inverse donc, et c'est ce qu'on verrouille ici.
   */
  const bloc = () => {
    const i = RACK.indexOf("// Rend la voie de console au demontage.");
    expect(i, "la borne de demontage a disparu").toBeGreaterThan(-1);
    return RACK.slice(i, i + 2400);
  };

  it("le contexte vient du fond de panier, il n'en fabrique plus", () => {
    expect(RACK).toContain('from "@studio-hub/rack-bus"');
    expect(RACK, "le rack fabrique encore son propre contexte").not.toMatch(
      /new\s+Ctor\(\)|new\s+AudioContext\(\)/,
    );
  });

  it("ne ferme JAMAIS le contexte partage", () => {
    // C'est le contrat de rack-bus, ecrit dans son en-tete : « il ne ferme
    // jamais le contexte ». Un rack qui le fermerait couperait tout le Hub.
    expect(RACK, "le rack ferme le contexte partage").not.toMatch(/ctx\.close\(\)/);
  });

  it("rend sa voie de console au demontage", () => {
    // Une voie laissee derriere garde le graphe vivant et ajoute une tranche
    // fantome a la console a chaque visite.
    expect(bloc()).toContain("priseRef.current?.detacher()");
  });

  it("le fait dans un effet de demontage, pas dans celui du clavier", () => {
    // Le nettoyage du clavier depend de `clavierActif` : il se rejoue a chaque
    // bascule du tiroir. Y detacher la voie couperait le rack en session.
    const i = RACK.indexOf("// Rend la voie de console au demontage.");
    const debut = RACK.indexOf("useEffect(() => {", i);
    const fin = RACK.indexOf("}, []);", debut);
    expect(debut).toBeGreaterThan(-1);
    expect(fin).toBeGreaterThan(debut);
    expect(RACK.slice(debut, fin)).not.toContain("clavierActif");
    expect(RACK.slice(fin, fin + 7)).toBe("}, []);");
    expect(RACK.slice(debut, fin)).toContain("detacher()");
  });

  it("remet les references a zero", () => {
    // En mode strict React rejoue l'effet sur la MEME instance, donc avec les
    // memes refs. Sans cette remise a zero le rack garderait un bus debranche.
    const b = bloc();
    for (const ref of ["priseRef", "audioCtxRef", "masterBusRef", "analyserRef", "reverbRef"]) {
      expect(b, `${ref} non remise a zero`).toContain(`${ref}.current = null;`);
    }
  });

  it("la sortie passe par la voie, pas par la destination", () => {
    /**
     * La moitie du chemin qui appartient au rack.
     *
     * `rack-bus` a ses propres tests pour l'autre moitie — que
     * `Prise.entree` rejoint bien le bus maitre puis la destination. Ce qu'on
     * verifie ici, c'est que le rack s'y branche au lieu de court-circuiter.
     *
     * Avant la migration, le graphe se terminait par
     * `analyser.connect(ctx.destination)` : le rack sortait a cote du mixage,
     * et son signal n'atteignait ni la reverberation partagee ni l'analyseur
     * du fond de panier.
     */
    expect(RACK).toContain('brancher("Rack DSP")');
    expect(RACK).toContain("analyser.connect(prise.entree)");
  });

  it("plus aucune sortie directe vers la destination du contexte vivant", () => {
    /**
     * Le rendu hors ligne, lui, a le droit : `offline.destination` est celle
     * d'un contexte jetable qui n'a pas de console. On distingue donc les deux
     * plutot que d'interdire le mot.
     */
    /**
     * On cherche une CONNEXION, pas une mention.
     *
     * Un premier jet cherchait `\w+\.destination` et tombait sur deux faux
     * positifs : le commentaire qui explique justement l'ancien defaut, et
     * `ctx.destination.channelCount` — une lecture de la largeur du contexte,
     * qui ne relie rien. C'est le meme piege que celui documente en tete de
     * `StrudelRack.test.ts`, et la meme parade : retirer les commentaires,
     * puis viser l'appel plutot que le nom.
     */
    const sansCommentaires = RACK
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const branchements = [...sansCommentaires.matchAll(/\.connect\(\s*(\w+)\.destination\s*\)/g)]
      .map((m) => m[1]);
    const vivantes = branchements.filter((v) => !/^offline$|^sonde$/.test(v));
    expect(
      vivantes,
      `sortie directe vers la destination du contexte vivant : ${vivantes.join(", ")}`,
    ).toEqual([]);
  });

  it("la reverberation est celle du fond de panier", () => {
    // Un convolveur par module remplirait l'atelier d'espaces distincts : deux
    // sons joues ensemble ne sonneraient pas dans la meme piece.
    expect(RACK).toContain("reverbePartagee()");
  });

  it("le rendu hors ligne a sa propre reverberation", () => {
    /**
     * Corrige un defaut anterieur a la migration : `sendToReverb` connectait
     * toujours le convolveur du contexte VIVANT, y compris pendant un rendu
     * hors ligne. Connecter deux contextes leve `InvalidAccessError` — verifie
     * au navigateur. Fabriquer un echantillon depuis Clouds, Zyn, Helm ou
     * FluidSynth, dont les envois valent 80, 60, 40 et 60 par defaut,
     * echouait donc des qu'une note avait ete jouee.
     */
    expect(RACK).toContain("const reverbPour");
    const i = RACK.indexOf("const sendToReverb");
    const corps = RACK.slice(i, RACK.indexOf("};", i));
    expect(corps, "sendToReverb vise encore un noeud fixe").toContain("reverbPour(ctx)");
  });

  it("ne suspend pas le contexte quand un autre module est branche", () => {
    /**
     * La mise en veille rendait le CPU apres 30 s d'inactivite. Sur un
     * contexte partage, elle couperait le son de tout le Hub.
     *
     * On ne suspend donc que si le rack est SEUL sur la console.
     */
    const i = RACK.indexOf("dormantTimerRef.current = setTimeout");
    expect(i, "le minuteur de veille a disparu").toBeGreaterThan(-1);
    const corps = RACK.slice(i, RACK.indexOf("}, 30000);", i));
    expect(corps, "la veille ignore les autres modules").toContain("voies()");
    expect(corps).toContain("suspend()");
  });
});
