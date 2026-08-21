import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ajouterEtiquette,
  basculerFavori,
  ecrireMetas,
  fusionnerMetas,
  lireMetas,
  normaliserMetas,
  PATCH_META_KEY,
  retirerEtiquette,
  toutesLesEtiquettes,
  type MetasPatches,
} from "./patchMeta";

/**
 * Favoris et etiquettes des patches.
 *
 * Stockes a part parce que les 91 patches d'usine sont des CONSTANTES du
 * source : on ne peut pas y ecrire, et les recopier creerait un doublon de
 * chaque patch au premier clic sur une etoile.
 *
 * La regle qui traverse tous ces tests : ne jamais muter ce qu'on recoit. Un
 * patch d'usine mute contaminerait toutes les listes qui le referencent, et le
 * defaut ne se verrait qu'apres coup, sur une autre liste.
 */

/**
 * Faux patch. Les champs optionnels sont DECLARES, comme sur le vrai type
 * partage : sans eux, `fusionnerMetas` rendrait bien les valeurs mais le type
 * ne les porterait pas, et l'assertion ne compilerait pas.
 */
type FauxPatch = { id: string; name: string; tags?: string[]; isFavorite?: boolean };
const faux = (id: string, tags?: string[]): FauxPatch => ({ id, name: id, ...(tags ? { tags } : {}) });

describe("normaliserMetas", () => {
  it("accepte un dictionnaire correct", () => {
    const m = normaliserMetas({ a: { favori: true, etiquettes: ["basse"] } });
    expect(m.a.favori).toBe(true);
    expect(m.a.etiquettes).toEqual(["basse"]);
  });

  it("ecarte ce qui n'est pas un objet", () => {
    for (const v of [null, [], "texte", 42, undefined]) {
      expect(normaliserMetas(v), String(v)).toEqual({});
    }
  });

  it("ecarte les entrees malformees sans jeter les bonnes", () => {
    // Le contenu du stockage n'est pas fiable : version anterieure, edition a
    // la main, autre onglet. Une entree cassee ne doit pas emporter le reste.
    const m = normaliserMetas({ a: { favori: true }, b: "casse", c: null, d: { etiquettes: ["x"] } });
    expect(Object.keys(m).sort()).toEqual(["a", "d"]);
  });

  it("ne garde que les etiquettes qui sont des chaines", () => {
    const m = normaliserMetas({ a: { etiquettes: ["ok", 42, null, "  ", "autre"] } });
    expect(m.a.etiquettes).toEqual(["ok", "autre"]);
  });

  it("ecarte les doublons d'etiquettes", () => {
    // Deux fois la meme s'afficherait deux fois sous le patch.
    expect(normaliserMetas({ a: { etiquettes: ["x", "x", "y"] } }).a.etiquettes).toEqual(["x", "y"]);
  });

  it("ne conserve pas une entree vide", () => {
    expect(normaliserMetas({ a: { favori: false, etiquettes: [] } })).toEqual({});
  });

  it("refuse un favori qui n'est pas exactement true", () => {
    // « truthy » ne suffit pas : une chaine relue d'un mauvais serialiseur
    // rendrait le filtre favoris incoherent.
    expect(normaliserMetas({ a: { favori: "oui" } })).toEqual({});
    expect(normaliserMetas({ a: { favori: 1 } })).toEqual({});
  });
});

describe("basculerFavori", () => {
  it("marque puis demarque", () => {
    const a = basculerFavori({}, "p1");
    expect(a.p1.favori).toBe(true);
    expect(basculerFavori(a, "p1").p1).toBeUndefined();
  });

  it("conserve les etiquettes en demarquant", () => {
    // Retirer le favori ne doit pas emporter le travail d'etiquetage.
    const avec: MetasPatches = { p1: { favori: true, etiquettes: ["basse"] } };
    expect(basculerFavori(avec, "p1").p1.etiquettes).toEqual(["basse"]);
  });

  it("ne modifie pas le dictionnaire recu", () => {
    // Il vit dans un etat React : le muter empecherait le rendu de se declencher.
    const avant: MetasPatches = {};
    basculerFavori(avant, "p1");
    expect(avant).toEqual({});
  });

  it("ignore un identifiant vide", () => {
    expect(basculerFavori({}, "")).toEqual({});
  });
});

describe("etiquettes", () => {
  it("ajoute et retire", () => {
    const a = ajouterEtiquette({}, "p1", "basse");
    expect(a.p1.etiquettes).toEqual(["basse"]);
    expect(retirerEtiquette(a, "p1", "basse").p1).toBeUndefined();
  });

  it("ignore la casse pour eviter les doublons", () => {
    // « Basse » et « basse » sont la meme etiquette pour qui les tape ; deux
    // entrees rendraient le tri inutile.
    const a = ajouterEtiquette({}, "p1", "Basse");
    expect(ajouterEtiquette(a, "p1", "basse").p1.etiquettes).toEqual(["Basse"]);
  });

  it("retire sans tenir compte de la casse", () => {
    const a = ajouterEtiquette({}, "p1", "Basse");
    expect(retirerEtiquette(a, "p1", "BASSE").p1).toBeUndefined();
  });

  it("ignore les espaces de bord", () => {
    expect(ajouterEtiquette({}, "p1", "  basse  ").p1.etiquettes).toEqual(["basse"]);
  });

  it("refuse une etiquette vide", () => {
    expect(ajouterEtiquette({}, "p1", "   ")).toEqual({});
  });

  it("conserve le favori en retirant la derniere etiquette", () => {
    const a = ajouterEtiquette({ p1: { favori: true } }, "p1", "x");
    expect(retirerEtiquette(a, "p1", "x").p1.favori).toBe(true);
  });

  it("ne modifie pas le dictionnaire recu", () => {
    const avant: MetasPatches = { p1: { etiquettes: ["a"] } };
    ajouterEtiquette(avant, "p1", "b");
    expect(avant.p1.etiquettes).toEqual(["a"]);
  });
});

describe("fusionnerMetas", () => {
  it("verse le favori et les etiquettes", () => {
    const r = fusionnerMetas([faux("p1")], { p1: { favori: true, etiquettes: ["basse"] } });
    expect(r[0].isFavorite).toBe(true);
    expect(r[0].tags).toEqual(["basse"]);
  });

  it("laisse intact un patch sans metadonnees", () => {
    const patches = [faux("p1")];
    expect(fusionnerMetas(patches, {})[0]).toBe(patches[0]);
  });

  it("NE MUTE JAMAIS les patches recus", () => {
    // Le point central. Les patches d'usine sont des constantes partagees :
    // les muter contaminerait toutes les listes qui les referencent, et le
    // defaut ne se verrait qu'ailleurs, plus tard.
    const original = faux("p1");
    fusionnerMetas([original], { p1: { favori: true, etiquettes: ["x"] } });
    expect(original).not.toHaveProperty("isFavorite");
    expect(original).not.toHaveProperty("tags");
  });

  it("ajoute aux etiquettes existantes au lieu de les remplacer", () => {
    const r = fusionnerMetas([faux("p1", ["usine"])], { p1: { etiquettes: ["mienne"] } });
    expect(r[0].tags).toEqual(["usine", "mienne"]);
  });

  it("accepte une liste vide", () => {
    expect(fusionnerMetas([], { p1: { favori: true } })).toEqual([]);
  });
});

describe("toutesLesEtiquettes", () => {
  it("rassemble sans doublon et trie", () => {
    const m: MetasPatches = { a: { etiquettes: ["zeta", "alpha"] }, b: { etiquettes: ["alpha", "beta"] } };
    expect(toutesLesEtiquettes(m)).toEqual(["alpha", "beta", "zeta"]);
  });

  it("rend une liste vide quand rien n'est etiquete", () => {
    expect(toutesLesEtiquettes({ a: { favori: true } })).toEqual([]);
  });
});

describe("persistance", () => {
  /**
   * L'environnement de test est `node` : `window` n'y existe pas. Meme faux
   * stockage que dans profile.test.ts, pour que les deux suites se lisent de
   * la meme facon.
   */
  function poserStockage() {
    const data = new Map<string, string>();
    const storage = {
      getItem: vi.fn((k: string) => data.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
      removeItem: vi.fn((k: string) => void data.delete(k)),
    };
    (globalThis as any).window = { localStorage: storage };
    return storage;
  }

  beforeEach(() => { delete (globalThis as any).window; });
  afterEach(() => { delete (globalThis as any).window; });

  it("relit ce qui a ete ecrit", () => {
    poserStockage();
    ecrireMetas({ p1: { favori: true, etiquettes: ["basse"] } });
    expect(lireMetas().p1.etiquettes).toEqual(["basse"]);
  });

  it("rend un dictionnaire vide plutot que de lever sur du contenu illisible", () => {
    // Ne JAMAIS effacer ici : les favoris ne valent pas qu'on detruise le
    // stockage de quelqu'un. C'est la difference avec readProfile, qui efface.
    const s = poserStockage();
    s.setItem(PATCH_META_KEY, "{ pas du json");
    expect(lireMetas()).toEqual({});
    expect(s.getItem(PATCH_META_KEY)).toBe("{ pas du json");
  });

  it("normalise ce qu'il relit", () => {
    const s = poserStockage();
    s.setItem(PATCH_META_KEY, JSON.stringify({ a: "casse", b: { favori: true } }));
    expect(Object.keys(lireMetas())).toEqual(["b"]);
  });

  it("ne plante pas sans window — rendu cote serveur", () => {
    expect(lireMetas()).toEqual({});
    expect(() => ecrireMetas({ p1: { favori: true } })).not.toThrow();
  });

  it("ne plante pas quand le stockage refuse d'ecrire", () => {
    // Navigation privee, quota atteint : les favoris restent en memoire pour
    // la session plutot que de casser l'application.
    const s = poserStockage();
    s.setItem = vi.fn(() => { throw new Error("QuotaExceededError"); });
    expect(() => ecrireMetas({ p1: { favori: true } })).not.toThrow();
  });
});
