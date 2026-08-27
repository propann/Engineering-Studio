import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack Strudel — ce que le code source doit garantir.
 *
 * Ces tests lisent le fichier au lieu de l'exécuter, et c'est assumé : ils
 * verrouillent des invariants d'ORDRE et d'ABSENCE, que monter le composant ne
 * prouverait pas mieux. La logique de stockage, elle, est exécutée pour de vrai
 * dans `core/strudel/extraits.test.ts`.
 *
 * Le parcours complet — charger Strudel, évaluer, arrêter — a été vérifié au
 * navigateur : « Éteint » → « En cours » → « Prêt », sans erreur console et
 * sans une seule requête sortante.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..");
const lire = (p: string) => readFileSync(path.join(SRC, p), "utf-8");

/**
 * Retire commentaires et chaînes avant d'analyser du code.
 *
 * Sans cela, un test d'ABSENCE matche le commentaire qui documente
 * l'interdiction : `StrudelRack.tsx` explique pourquoi il n'appelle pas
 * `samples()`, et cette phrase suffisait à le faire échouer. Troisième fois
 * que ce piège se présente dans ce dépôt — après la garde des sélecteurs CSS
 * et celle du marqueur de build.
 */
const sansCommentaires = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const RACK = sansCommentaires(lire("pages/StrudelRack.tsx"));
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
    /**
     * Chercher les deux noms dans TOUT le fichier ne prouve rien : la
     * déclaration de type `ApiStrudel` les nomme aussi, et y liste
     * `initStrudel` en premier. Le test tombait donc sur du code correct.
     * On ne lit que le corps de `demarrer`, là où les appels ont lieu.
     */
    const corps = RACK.slice(RACK.indexOf("const demarrer"), RACK.indexOf("const jouer"));
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

describe("rien ne part sur un serveur", () => {
  it("le rack ne charge aucun échantillon distant", () => {
    // Strudel n'en charge aucun par defaut ; l'option `prebake` en ferait
    // venir de github. L'atelier promet que rien ne sort du navigateur.
    expect(RACK, "le rack appelle samples()").not.toMatch(/\bsamples\(/);
    expect(RACK, "le rack passe un prebake").not.toContain("prebake");
    expect(RACK).not.toContain("github:");
  });

  it("le rack n'écrit sur aucune machine", () => {
    for (const interdit of ["machineWrite", "createWritable", "getFileHandle", "showDirectoryPicker"]) {
      expect(RACK, `le rack appelle ${interdit}`).not.toContain(interdit);
    }
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

  it("la page elle-même est chargée à la demande par App.tsx", () => {
    expect(APP).toMatch(/lazy\(\(\) => import\("\.\/pages\/StrudelRack"\)\)/);
  });
});

describe("l'arrêt est toujours possible", () => {
  it("le bouton d'arrêt n'est jamais désactivé", () => {
    // C'est le PANIC de ce rack : il doit repondre meme pendant le chargement.
    const bouton = RACK.slice(RACK.indexOf('variant="danger"'));
    const fin = bouton.indexOf("</Button>");
    expect(bouton.slice(0, fin), "le bouton Arrêter peut être désactivé").not.toContain("disabled");
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

  it("la carte ne promet que ce que le rack fait", () => {
    const i = HUB.indexOf('id: "strudel"');
    const entree = HUB.slice(i, HUB.indexOf("\n  },", i));
    // Elle annonce explicitement l'absence d'echantillon distant : c'est une
    // promesse verifiee par les tests ci-dessus.
    expect(entree).toContain("sans aucun échantillon distant");
    expect(entree, "la carte promet une écriture machine").not.toMatch(/machine|OP-1|EP-133/);
  });
});
