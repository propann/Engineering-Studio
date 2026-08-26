import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le recensement des pages.
 *
 * `OrphanPages` liste toutes les pages du hub avec leur cible de projet.
 * C'est le seul endroit du depot qui donne cette vue — l'analyse du rack
 * principal l'a d'ailleurs notee comme la bonne idee qu'elle aurait aime
 * trouver au depart.
 *
 * Mais une liste tenue a la main prend du retard sans que rien ne le signale :
 * deux pages atteignables n'y figuraient pas, dont la page de recensement
 * elle-meme. Ce test la maintient a jour.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RECENSEMENT = readFileSync(path.join(DIR, "OrphanPages.tsx"), "utf-8");
const APP = readFileSync(path.join(DIR, "..", "App.tsx"), "utf-8");

/**
 * Le bloc `PAGE_REGISTRY`, et lui seul.
 *
 * La premiere version cherchait `{ id: "…"` dans TOUT le fichier. Elle a fini
 * par recenser un exemple de code affiche dans un message a l'utilisateur —
 * une entree fantome nommee `${page.id}`. Un test qui lit un fichier entier
 * finit toujours par lire autre chose que ce qu'il croit.
 */
const blocRegistre = () => {
  const debut = RECENSEMENT.indexOf("const PAGE_REGISTRY");
  expect(debut, "PAGE_REGISTRY introuvable").toBeGreaterThan(-1);
  const fin = RECENSEMENT.indexOf("\n];", debut);
  expect(fin, "fin de PAGE_REGISTRY introuvable").toBeGreaterThan(debut);
  return RECENSEMENT.slice(debut, fin);
};

const recensees = () => new Set([...blocRegistre().matchAll(/\{ id: "([^"]+)"/g)].map((m) => m[1]));

/** Les pages que l'application sait afficher : le type `Page` et le switch. */
const atteignables = () => {
  const parType = [...APP.matchAll(/^\s*\| "([^"]+)"/gm)].map((m) => m[1]);
  const parSwitch = [...APP.matchAll(/case "([^"]+)":/g)].map((m) => m[1]);
  return new Set([...parType, ...parSwitch]);
};

describe("le recensement suit les pages reelles", () => {
  it("lit bien les deux sources", () => {
    expect(RECENSEMENT.length).toBeGreaterThan(2000);
    expect(atteignables().size).toBeGreaterThan(15);
  });

  it("aucune page atteignable ne manque au recensement", () => {
    // Le defaut trouve : `sound-library`, ajoutee le soir meme, et
    // `orphan-pages` elle-meme n'y figuraient pas.
    const manquantes = [...atteignables()].filter((p) => !recensees().has(p)).sort();
    expect(manquantes, `pages absentes du recensement : ${manquantes.join(", ")}`).toEqual([]);
  });

  it("le recensement ne liste pas de page qui n'existe plus", () => {
    // L'inverse compte autant : une entree vers une page supprimee envoie
    // l'utilisateur dans le vide.
    const fantomes = [...recensees()].filter((p) => !atteignables().has(p)).sort();
    expect(fantomes, `pages recensees mais inatteignables : ${fantomes.join(", ")}`).toEqual([]);
  });

  it("chaque entree porte une cible, une source, une provenance et une nature", () => {
    // La cible dit a quelle machine la page appartient ; la source, ou aller
    // lire ; la provenance, ce que la page touche ; la nature, ce qu'elle est.
    // Une entree qui en manque une est une entree qu'on ne peut pas juger sans
    // l'ouvrir — et il y en a vingt et une.
    const entrees = [...blocRegistre().matchAll(
      /\{ id: "([^"]+)", label: "[^"]*", description: "[^"]*", target: "([^"]+)", source: "([^"]+)", provenance: "([^"]+)", nature: "[a-z]+" \}/g,
    )];
    expect(entrees.length, "une entree n'a pas la forme attendue").toBe(recensees().size);
    for (const [, , cible, source, provenance] of entrees) {
      expect(["OP-1", "EP-133", "Hub partagé", "Aucun projet"]).toContain(cible);
      expect(source, `source « ${source} » hors de pages/`).toMatch(/^pages\/\w[\w.-]*\.tsx$/);
      expect(["machine", "local", "profil", "demo", "non-verifie"]).toContain(provenance);
    }
  });

  it("la source declaree est le fichier que le routeur charge vraiment", () => {
    // Ecrite a la main, elle pointerait tot ou tard vers un fichier renomme —
    // et c'est un chemin qu'on affiche pour aller lire le code.
    const differes = new Map([...APP.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/pages\/([\w.-]+)"\)/g)]
      .map((m) => [m[1], m[2]]));
    const rendus = new Map([...APP.matchAll(/case "([a-z0-9-]+)":\s*\n\s*return <(\w+)/g)]
      .map((m) => [m[1], m[2]]));
    expect(differes.size, "aucun import differe lu dans App.tsx").toBeGreaterThan(10);

    for (const m of blocRegistre().matchAll(/\{ id: "([^"]+)"[^}]*source: "pages\/([\w.-]+)\.tsx"/g)) {
      const [, id, fichier] = m;
      const composant = rendus.get(id);
      // `landing` est le repli du switch, il n'a pas de `case` : on ne peut pas
      // le verifier ainsi, et l'exiger ferait echouer sur du correct.
      if (!composant) continue;
      expect(differes.get(composant), `${id} : source declaree « ${fichier} »`).toBe(fichier);
    }
  });
});

describe("on ne peut pas perdre la derniere porte d'une page", () => {
  /**
   * Quatre pages ne s'ouvrent que depuis ce registre : `advanced-image`,
   * `sound-patch-creator` et `rhythm-hero`, sorti du Hub le 2026-08-25.
   *
   * « Retirer » persiste dans `localStorage` et seule la DERNIERE suppression
   * s'annule : deux retraits d'affilee en scellent un. Sur une page dont ce
   * registre est le seul chemin, le retrait ne range pas — il coupe la
   * derniere porte, et le code reste sans que rien ne l'ouvre.
   */
  it("le retrait est refuse quand ce registre est le seul chemin", () => {
    expect(RECENSEMENT).toContain("const estSeulAcces =");
    const bloc = RECENSEMENT.slice(RECENSEMENT.indexOf("const removeEntry"));
    expect(bloc.slice(0, 400)).toContain("if (estSeulAcces(page))");
  });

  it("le bouton le dit avant le clic, il ne se contente pas de refuser", () => {
    expect(RECENSEMENT).toContain("disabled={estSeulAcces(page)}");
  });

  it("chaque page du registre declare par ou on y entre", () => {
    // Un lien manquant ferait passer une page atteignable pour une orpheline,
    // et une orpheline pour une page qu'on peut retirer sans risque.
    const liens = new Set([...RECENSEMENT.matchAll(/^\s*"([a-z0-9-]+)": \[/gm)].map((m) => m[1]));
    for (const id of recensees()) {
      expect(liens.has(id), `« ${id} » n'a aucune entree dans PAGE_LINKS`).toBe(true);
    }
  });

  it("les pages sans autre porte sont bien reconnues comme telles", () => {
    // Verrouille le fait, pas seulement le mecanisme : si l'une de ces quatre
    // retrouve un bouton ailleurs, ce test tombe et rappelle de le declarer.
    for (const id of ["advanced-image", "sound-patch-creator", "rhythm-hero", "sound-editor-hub"]) {
      const m = new RegExp(`"${id}": \\[([^\\]]*)\\]`).exec(RECENSEMENT);
      expect(m, `${id} absent de PAGE_LINKS`).not.toBeNull();
      expect(m![1].trim(), `${id} n'est plus une orpheline`).toBe('"Page manager"');
    }
  });
});

describe("les portes declarees sont les portes reelles", () => {
  /**
   * `PAGE_LINKS` dit par ou l'on entre dans chaque page. C'est lui qui decide
   * si une page est orpheline, donc s'il ment, tout le registre ment avec lui.
   *
   * Il a deja menti : `rhythm-hero` y est reste annonce « Hub · Apprendre »
   * apres etre sorti du Hub, et rien ne l'a signale. Une table tenue a la main
   * prend du retard en silence — ce test la confronte au code.
   *
   * Il ne compare pas les LIBELLES, qui sont de la prose destinee a l'humain
   * (« Hub · Apprendre »), mais le FAIT : cette page est-elle ouverte depuis
   * ailleurs, oui ou non. C'est la seule chose dont depend le classement.
   */
  const SRC = path.join(DIR, "..");

  /** Tous les sources du hub, sauf les tests et le registre lui-meme. */
  function sourcesDuHub(dossier = SRC, vus: string[] = []): string[] {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, entree.name);
      if (entree.isDirectory()) sourcesDuHub(chemin, vus);
      else if (/\.tsx?$/.test(entree.name) && !entree.name.includes(".test.")
               && !entree.name.startsWith("OrphanPages")) vus.push(chemin);
    }
    return vus;
  }

  /** Les pages qu'un fichier autre que le registre sait ouvrir. */
  function ouvertesAilleurs(): Set<string> {
    const trouvees = new Set<string>();
    for (const f of sourcesDuHub()) {
      const texte = readFileSync(f, "utf-8");
      // Les trois formes utilisees dans le depot : la table du Hub, la
      // navigation directe, et les entrees de la TopBar.
      for (const r of [/page: "([a-z0-9-]+)"/g, /navigateMaquette\("([a-z0-9-]+)"\)/g, /\{ id: "([a-z0-9-]+)", label:/g]) {
        for (const m of texte.matchAll(r)) trouvees.add(m[1]);
      }
    }
    return trouvees;
  }

  it("lit bien les sources du hub", () => {
    // Sans ce garde, une erreur de chemin rendrait un ensemble vide et
    // declarerait toutes les pages orphelines.
    expect(sourcesDuHub().length).toBeGreaterThan(20);
    expect(ouvertesAilleurs().size).toBeGreaterThan(10);
  });

  it("aucune page annoncee orpheline n'est en fait ouverte ailleurs", () => {
    // Le sens qui protege le CLASSEMENT : une page declaree orpheline alors
    // qu'un bouton l'ouvre encourage a la « rattacher » pour rien.
    const ailleurs = ouvertesAilleurs();
    const menteuses = [...recensees()].filter((id) => {
      const m = new RegExp(`"${id}": \\[([^\\]]*)\\]`).exec(RECENSEMENT);
      const seulRegistre = m && m[1].trim() === '"Page manager"';
      return seulRegistre && ailleurs.has(id);
    });
    expect(menteuses, `annoncees orphelines mais ouvertes ailleurs : ${menteuses.join(", ")}`).toEqual([]);
  });

  it("aucune page annoncee reliee n'est en fait sans porte", () => {
    // Le sens qui protege l'ACCES, et celui qui a deja echoue : `rhythm-hero`
    // annoncait « Hub · Apprendre » alors que plus rien ne l'ouvrait. Une page
    // ainsi mal classee redevient supprimable depuis l'interface.
    const ailleurs = ouvertesAilleurs();
    const menteuses = [...recensees()].filter((id) => {
      const m = new RegExp(`"${id}": \\[([^\\]]*)\\]`).exec(RECENSEMENT);
      const seulRegistre = !m || m[1].trim() === '"Page manager"';
      return !seulRegistre && !ailleurs.has(id);
    });
    expect(menteuses, `annoncees reliees mais sans aucune porte : ${menteuses.join(", ")}`).toEqual([]);
  });
});

describe("la nature declaree correspond au fichier", () => {
  /**
   * « Il y a des pages de doc a la place des vraies pages. » Mesuree sur les
   * 21, la reponse est : une seule, `rhythm-hero`.
   *
   * Le piege etait de compter les boutons. `MidiSettings` fait 28 lignes et
   * n'en a aucun — mais elle monte tout le panneau MIDI. Compter l'aurait
   * classee coquille vide. Ce qui distingue une facade d'un document, ce n'est
   * pas son activite, c'est qu'elle IMPORTE un composant qui travaille.
   *
   * Ces tests verifient donc le fait verifiable — l'import — et laissent
   * `outil` au jugement, faute d'un signe fiable.
   */
  const dossierPages = path.join(DIR);

  /** Les composants qu'une page monte, hors React, TopBar et profil. */
  function composantsMontes(fichier: string): string[] {
    const texte = readFileSync(path.join(dossierPages, fichier), "utf-8");
    return [...texte.matchAll(/^import\s+(?:\{[^}]*\}|\w+)\s+from\s+"([^"]+)"/gm)]
      .map((m) => m[1])
      .filter((cible) => !/^react$/.test(cible)
        && !/components\/TopBar/.test(cible)
        && !/core\/profile/.test(cible)
        && !/\.css$/.test(cible));
  }

  /** id de page -> fichier source, lu dans le registre. */
  function sourcesParId(): Map<string, string> {
    return new Map([...blocRegistre().matchAll(/\{ id: "([a-z0-9-]+)"[^}]*source: "pages\/([\w.-]+)"/g)]
      .map((m) => [m[1], m[2]]));
  }

  function naturesParId(): Map<string, string> {
    return new Map([...blocRegistre().matchAll(/\{ id: "([a-z0-9-]+)"[^}]*nature: "([a-z]+)"/g)]
      .map((m) => [m[1], m[2]]));
  }

  it("chaque entree declare une nature connue", () => {
    const natures = naturesParId();
    expect(natures.size).toBe(recensees().size);
    for (const [id, n] of natures) {
      expect(["outil", "facade", "document"], `« ${id} » : nature « ${n} »`).toContain(n);
    }
  });

  it("une facade monte vraiment un composant", () => {
    // Sinon c'est une coquille vide annoncee comme une porte vers un outil.
    const sources = sourcesParId();
    for (const [id, n] of naturesParId()) {
      if (n !== "facade") continue;
      const montes = composantsMontes(sources.get(id)!);
      expect(montes.length, `« ${id} » est declaree facade mais ne monte rien`).toBeGreaterThan(0);
    }
  });

  it("un document ne monte aucun composant", () => {
    // S'il en montait un, ce serait une facade — et le classer « document »
    // ferait croire qu'il n'y a rien derriere alors qu'un outil s'y trouve.
    const sources = sourcesParId();
    for (const [id, n] of naturesParId()) {
      if (n !== "document") continue;
      const montes = composantsMontes(sources.get(id)!);
      expect(montes, `« ${id} » est declaree document mais monte ${montes.join(", ")}`).toEqual([]);
    }
  });

  it("rhythm-hero reste le seul document annonce comme un entrainement", () => {
    // Verrouille le FAIT constate, pas seulement le mecanisme. Le jour ou la
    // page devient un vrai jeu — ou ou une autre tombe dans le meme cas — ce
    // test rappelle de reclasser.
    const documents = [...naturesParId()].filter(([, n]) => n === "document").map(([id]) => id).sort();
    expect(documents).toEqual(["doc-ep133", "doc-op1", "documentation", "rhythm-hero"]);
  });
});
