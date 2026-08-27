import { describe, expect, it } from "vitest";
import {
  CLE_EXTRAITS,
  EXEMPLES,
  ecrireExtraits,
  enregistrerExtrait,
  lireExtraits,
  nomSain,
  supprimerExtrait,
  trierExtraits,
  type Extrait,
  type Stockage,
} from "./extraits";

/**
 * Le stockage local des extraits Strudel.
 *
 * La logique vit hors du composant pour être exécutée ici. Écrite dans le JSX,
 * elle n'aurait été vérifiable que par la présence d'une chaîne dans un
 * fichier — ce qui ne prouve rien d'un comportement.
 */

/** Un `localStorage` en mémoire, ou qui refuse, selon ce qu'on veut éprouver. */
function stockage(refuse = false): Stockage & { contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  return {
    contenu,
    getItem: (c) => contenu.get(c) ?? null,
    setItem: (c, v) => { if (refuse) throw new Error("quota"); contenu.set(c, v); },
    removeItem: (c) => { contenu.delete(c); },
  };
}

const extrait = (nom: string, code = "note(\"c\")", modifieLe = "2026-08-27T00:00:00.000Z"): Extrait =>
  ({ id: `id-${nom}`, nom, code, modifieLe });

describe("nomSain", () => {
  it("garde un nom normal", () => {
    expect(nomSain("Ma boucle")).toBe("Ma boucle");
  });

  it("fabrique un titre plutôt que d'accepter le vide", () => {
    // Une entree sans nom rendrait la liste illisible.
    expect(nomSain("")).toBe("Sans titre");
    expect(nomSain("   ")).toBe("Sans titre");
  });

  it("resserre les espaces et borne la longueur", () => {
    expect(nomSain("  deux   mots  ")).toBe("deux mots");
    expect(nomSain("x".repeat(200))).toHaveLength(60);
  });
});

describe("lireExtraits", () => {
  it("rend une liste vide quand rien n'est stocké", () => {
    expect(lireExtraits(stockage())).toEqual([]);
  });

  it("relit ce qui a été écrit", () => {
    const s = stockage();
    const liste = [extrait("un"), extrait("deux")];
    expect(ecrireExtraits(liste, s)).toBe(true);
    expect(lireExtraits(s)).toEqual(liste);
  });

  it("rend une liste vide plutôt que de jeter sur un contenu corrompu", () => {
    /**
     * Un stockage abîmé ne doit pas empêcher l'atelier de démarrer. Perdre
     * des extraits est regrettable ; une page blanche l'est davantage.
     */
    const s = stockage();
    s.setItem(CLE_EXTRAITS, "{pas du json");
    expect(lireExtraits(s)).toEqual([]);
  });

  it("écarte les entrées abîmées sans emporter les bonnes", () => {
    // Une seule ligne corrompue ne doit pas coûter tout le carnet.
    const s = stockage();
    s.setItem(CLE_EXTRAITS, JSON.stringify({
      version: 1,
      extraits: [extrait("bon"), { id: 42 }, null, { nom: "sans code", id: "x", modifieLe: "" }],
    }));
    const lus = lireExtraits(s);
    expect(lus).toHaveLength(1);
    expect(lus[0].nom).toBe("bon");
  });

  it("rend une liste vide sans stockage du tout", () => {
    // Fenetre privee verrouillee : pas de memoire, mais l'atelier tourne.
    expect(lireExtraits(null)).toEqual([]);
  });
});

describe("ecrireExtraits", () => {
  it("dit non quand le stockage refuse, au lieu de jeter", () => {
    // Quota depasse : le composant doit pouvoir l'annoncer, pas planter.
    expect(ecrireExtraits([extrait("un")], stockage(true))).toBe(false);
  });

  it("dit non sans stockage", () => {
    expect(ecrireExtraits([extrait("un")], null)).toBe(false);
  });
});

describe("enregistrerExtrait", () => {
  const temps = () => "2026-08-27T12:00:00.000Z";

  it("ajoute un extrait absent", () => {
    const liste = enregistrerExtrait("nouveau", 'note("e")', [], temps);
    expect(liste).toHaveLength(1);
    expect(liste[0].nom).toBe("nouveau");
    expect(liste[0].code).toBe('note("e")');
  });

  it("REMPLACE celui du même nom au lieu d'en créer un second", () => {
    /**
     * On réenregistre en retapant le même titre. Deux entrées homonymes
     * rendraient la liste inutilisable, et on ne saurait plus laquelle est
     * la bonne.
     */
    const depart = [extrait("boucle", "ancien")];
    const liste = enregistrerExtrait("boucle", "nouveau", depart, temps);
    expect(liste).toHaveLength(1);
    expect(liste[0].code).toBe("nouveau");
  });

  it("garde l'identifiant en remplaçant, donc garde la place dans la liste", () => {
    const depart = [extrait("a"), extrait("b"), extrait("c")];
    const liste = enregistrerExtrait("b", "modifie", depart, temps);
    expect(liste.map((e) => e.nom)).toEqual(["a", "b", "c"]);
    expect(liste[1].id).toBe(depart[1].id);
  });

  it("horodate le remplacement", () => {
    const depart = [extrait("a", "vieux", "2020-01-01T00:00:00.000Z")];
    expect(enregistrerExtrait("a", "neuf", depart, temps)[0].modifieLe).toBe(temps());
  });

  it("assainit le nom à l'enregistrement", () => {
    expect(enregistrerExtrait("   ", "x", [], temps)[0].nom).toBe("Sans titre");
  });

  it("ne modifie pas la liste reçue", () => {
    // Muter l'etat de React en place empecherait le rendu de se declencher.
    const depart = [extrait("a")];
    const copie = [...depart];
    enregistrerExtrait("b", "x", depart, temps);
    expect(depart).toEqual(copie);
  });
});

describe("supprimerExtrait", () => {
  it("retire l'entrée visée, et elle seule", () => {
    const depart = [extrait("a"), extrait("b"), extrait("c")];
    const liste = supprimerExtrait("id-b", depart);
    expect(liste.map((e) => e.nom)).toEqual(["a", "c"]);
  });

  it("laisse la liste intacte sur un identifiant inconnu", () => {
    const depart = [extrait("a")];
    expect(supprimerExtrait("inexistant", depart)).toEqual(depart);
  });
});

describe("trierExtraits", () => {
  it("met le plus récemment modifié en tête", () => {
    // C'est celui qu'on rouvre le plus souvent.
    const liste = trierExtraits([
      extrait("vieux", "x", "2020-01-01T00:00:00.000Z"),
      extrait("neuf", "x", "2026-08-27T00:00:00.000Z"),
      extrait("moyen", "x", "2024-01-01T00:00:00.000Z"),
    ]);
    expect(liste.map((e) => e.nom)).toEqual(["neuf", "moyen", "vieux"]);
  });

  it("ne modifie pas la liste reçue", () => {
    const depart = [extrait("a", "x", "2020-01-01T00:00:00.000Z"), extrait("b", "x", "2026-01-01T00:00:00.000Z")];
    const copie = [...depart];
    trierExtraits(depart);
    expect(depart).toEqual(copie);
  });
});

describe("les exemples fournis", () => {
  it("aucun ne charge d'échantillon distant", () => {
    /**
     * Le point qui compte pour l'atelier : « aucune donnée ne part sur un
     * serveur ». Strudel ne charge par défaut aucun échantillon externe, et
     * nos exemples ne doivent pas être les premiers à en faire venir —
     * `samples('github:...')` ouvrirait une requête réseau au premier clic.
     */
    for (const e of EXEMPLES) {
      expect(e.code, `« ${e.nom} » appelle samples()`).not.toContain("samples(");
      expect(e.code, `« ${e.nom} » contient une URL`).not.toMatch(/https?:\/\//);
      expect(e.code, `« ${e.nom} » vise un dépôt distant`).not.toContain("github:");
    }
  });

  it("chacun porte un nom, du code et une explication", () => {
    expect(EXEMPLES.length).toBeGreaterThan(0);
    for (const e of EXEMPLES) {
      expect(e.nom.trim(), "exemple sans nom").toBeTruthy();
      expect(e.code.trim(), `« ${e.nom} » sans code`).toBeTruthy();
      expect(e.aide.trim(), `« ${e.nom} » sans explication`).toBeTruthy();
    }
  });

  it("les noms sont distincts", () => {
    // Deux exemples homonymes s'ecraseraient l'un l'autre a l'enregistrement,
    // puisque `enregistrerExtrait` remplace par le nom.
    const noms = EXEMPLES.map((e) => e.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });
});
