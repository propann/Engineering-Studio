import { describe, expect, it } from "vitest";
import { PatchSearchEngine } from "./PatchSearchEngine";
import type { PatchPreset } from "@studio-hub/core/types/audio";

const patch = (over: Partial<PatchPreset> & Pick<PatchPreset, "id">): PatchPreset => ({
  name: "Sans nom",
  engine: "mi_plaits",
  category: "Lead",
  params: {},
  ...over,
});

const FIXTURES: PatchPreset[] = [
  patch({ id: "a", name: "Acid Lead", engine: "open303", category: "Acid", tags: ["acide", "303"], isFavorite: true, createdAt: 100, lastModified: 300 }),
  patch({ id: "b", name: "Warm Pad", engine: "mi_rings", category: "Pad", tags: ["chaud"], createdAt: 200, lastModified: 100 }),
  patch({ id: "c", name: "Glass Bell", engine: "mi_rings", category: "Bell", tags: ["chaud", "verre"], isFavorite: true, createdAt: 300, lastModified: 200 }),
];

const ids = (list: PatchPreset[]) => list.map((p) => p.id).sort().join(",");

describe("recherche textuelle", () => {
  const e = new PatchSearchEngine(FIXTURES);

  it("rend tout sans requete", () => {
    expect(e.search()).toHaveLength(3);
    expect(e.search("   ")).toHaveLength(3); // espaces seuls = pas de filtre
  });

  it("cherche dans le nom, sans tenir compte de la casse", () => {
    expect(ids(e.search("acid"))).toBe("a");
    expect(ids(e.search("ACID"))).toBe("a");
  });

  it("cherche aussi dans les etiquettes et la categorie", () => {
    expect(ids(e.search("chaud"))).toBe("b,c");
    expect(ids(e.search("bell"))).toBe("c"); // trouve par la categorie
  });

  it("rend une liste vide quand rien ne correspond", () => {
    expect(e.search("clavecin")).toEqual([]);
  });
});

describe("filtres", () => {
  const e = new PatchSearchEngine(FIXTURES);

  it("filtre par moteur", () => {
    expect(ids(e.search("", { engine: "mi_rings" }))).toBe("b,c");
  });

  it("filtre par categorie", () => {
    expect(ids(e.search("", { category: "Pad" }))).toBe("b");
  });

  it("filtre par etiquette", () => {
    expect(ids(e.search("", { tags: ["verre"] }))).toBe("c");
  });

  it("combine requete et filtre", () => {
    // Sans le filtre, "chaud" rendrait b et c.
    expect(ids(e.search("chaud", { category: "Bell" }))).toBe("c");
  });

  it("ne garde que les favoris quand on le demande", () => {
    expect(ids(e.search("", { favorites: true }))).toBe("a,c");
  });
});

describe("tris et regroupements", () => {
  const e = new PatchSearchEngine(FIXTURES);

  it("rend les favoris", () => {
    expect(ids(e.getFavorites())).toBe("a,c");
  });

  it("trie les recents par derniere modification", () => {
    expect(e.getRecent().map((p) => p.id)).toEqual(["a", "c", "b"]);
  });

  it("trie les nouveaux par date de creation", () => {
    // Ordre different du precedent : c'est bien deux criteres distincts.
    expect(e.getNewPatches().map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("respecte la limite demandee", () => {
    expect(e.getRecent(2)).toHaveLength(2);
  });

  it("rend les etiquettes et categories, dedoublonnees et triees", () => {
    expect(e.getAllTags()).toEqual(["303", "acide", "chaud", "verre"]);
    expect(e.getCategories()).toEqual(["Acid", "Bell", "Pad"]);
  });
});

describe("modification des patches", () => {
  it("ajoute une etiquette, sans doublon", () => {
    const e = new PatchSearchEngine(structuredClone(FIXTURES));
    expect(e.addTag("b", "nouveau")).toBe(true);
    expect(e.addTag("b", "nouveau")).toBe(false); // deja presente
    expect(e.getPatchById("b")?.tags).toContain("nouveau");
  });

  it("retire une etiquette", () => {
    const e = new PatchSearchEngine(structuredClone(FIXTURES));
    expect(e.removeTag("c", "verre")).toBe(true);
    expect(e.removeTag("c", "verre")).toBe(false); // deja retiree
    expect(e.getPatchById("c")?.tags).not.toContain("verre");
  });

  it("bascule le favori", () => {
    const e = new PatchSearchEngine(structuredClone(FIXTURES));
    expect(e.toggleFavorite("b")).toBe(true);
    expect(e.getPatchById("b")?.isFavorite).toBe(true);
    e.toggleFavorite("b");
    expect(e.getPatchById("b")?.isFavorite).toBe(false);
  });

  it("signale un identifiant inconnu au lieu de planter", () => {
    const e = new PatchSearchEngine(structuredClone(FIXTURES));
    expect(e.addTag("fantome", "x")).toBe(false);
    expect(e.removeTag("fantome", "x")).toBe(false);
    expect(e.toggleFavorite("fantome")).toBe(false);
    expect(e.getPatchById("fantome")).toBeUndefined();
  });
});

describe("patches similaires", () => {
  const e = new PatchSearchEngine(FIXTURES);

  it("classe par proximite : moteur, puis categorie, puis etiquettes", () => {
    // b et c partagent le moteur mi_rings et l'etiquette « chaud », donc b
    // doit devancer a, qui n'a rien en commun avec c.
    expect(e.searchSimilar("c")[0].id).toBe("b");
  });

  it("n'inclut jamais le patch de depart", () => {
    expect(e.searchSimilar("a").map((p) => p.id)).not.toContain("a");
  });

  it("rend une liste vide pour un identifiant inconnu", () => {
    expect(e.searchSimilar("fantome")).toEqual([]);
  });
});

describe("index", () => {
  it("se remplace entierement", () => {
    const e = new PatchSearchEngine(FIXTURES);
    e.setPatchesIndex([patch({ id: "z", name: "Seul" })]);
    expect(e.search()).toHaveLength(1);
    // L'ancien index ne doit rien laisser derriere lui.
    expect(e.getPatchById("a")).toBeUndefined();
  });

  it("accepte un index vide", () => {
    const e = new PatchSearchEngine();
    expect(e.search("quoi que ce soit")).toEqual([]);
    expect(e.getAllTags()).toEqual([]);
  });
});
