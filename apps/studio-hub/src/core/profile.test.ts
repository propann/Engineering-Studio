import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProfile,
  DEFAULT_PROFILE_NAME,
  migrateProfile,
  PROFILE_STORAGE_KEY,
  PROFILE_VERSION,
  readProfile,
  readProfileName,
  writeProfile,
} from "./profile";

/**
 * Tests de la persistance de la fiche personnage.
 *
 * L'environnement de test est `node` : `window` n'y existe pas, et toutes ces
 * fonctions renvoient null sans lui. On installe donc un stockage minimal,
 * ce qui permet au passage de simuler ce qu'un vrai navigateur peut faire
 * subir — quota depasse, mode prive, contenu corrompu.
 */
function installStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
    get size() {
      return data.size;
    },
  };
  (globalThis as any).window = { localStorage: storage };
  return storage;
}

beforeEach(() => {
  delete (globalThis as any).window;
});

describe("migrateProfile", () => {
  it("refuse ce qui n'est pas une fiche", () => {
    // Un tableau ou une valeur simple relus du stockage ne doivent pas
    // produire une fiche a moitie formee.
    for (const bad of [null, undefined, 42, "texte", [], true]) {
      expect(migrateProfile(bad)).toBeNull();
    }
  });

  it("conserve les champs inconnus d'une ancienne fiche", () => {
    // C'est la raison d'etre de la migration : ajouter un schema sans
    // effacer ce que les versions precedentes avaient enregistre.
    const out = migrateProfile({ name: "Ana", couleurPreferee: "bleu", drives: [1, 2] });
    expect(out?.couleurPreferee).toBe("bleu");
    expect(out?.drives).toEqual([1, 2]);
  });

  it("estampille la version courante", () => {
    expect(migrateProfile({ name: "Ana", version: 1 })?.version).toBe(PROFILE_VERSION);
  });

  it("normalise les champs texte", () => {
    const out = migrateProfile({ name: "  Ana  ", bio: 12345 });
    expect(out?.name).toBe("Ana"); // espaces retires
    expect(out?.bio).toBe(""); // un nombre n'est pas une bio
  });
});

describe("readProfile / writeProfile", () => {
  it("renvoie null hors navigateur", () => {
    // Rendu cote serveur : pas de window, pas de plantage.
    expect(readProfile()).toBeNull();
    expect(writeProfile({ name: "Ana" })).toBeNull();
  });

  it("fait un aller-retour sans perte", () => {
    installStorage();
    writeProfile({ name: "Ana", bio: "Batteuse", avatar: "engineer" });
    const back = readProfile();
    expect(back?.name).toBe("Ana");
    expect(back?.bio).toBe("Batteuse");
    expect(back?.avatar).toBe("engineer");
  });

  it("renvoie null quand rien n'est enregistre", () => {
    installStorage();
    expect(readProfile()).toBeNull();
  });

  it("reecrit la fiche migree quand la version a change", () => {
    // Sans cette reecriture, la migration se rejouerait a chaque lecture.
    const storage = installStorage({
      [PROFILE_STORAGE_KEY]: JSON.stringify({ name: "Ana", version: 1 }),
    });
    readProfile();
    expect(storage.setItem).toHaveBeenCalled();
    const written = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(written.version).toBe(PROFILE_VERSION);
  });

  it("ne reecrit pas une fiche deja a jour", () => {
    const storage = installStorage({
      [PROFILE_STORAGE_KEY]: JSON.stringify({ name: "Ana", bio: "", version: PROFILE_VERSION }),
    });
    readProfile();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("efface la fiche si son contenu est illisible", () => {
    // Comportement volontaire mais destructif : un JSON tronque fait perdre
    // la fiche. Documente ici pour que la regression se voie si quelqu'un
    // change d'avis — ou si quelqu'un veut la conserver pour reparation.
    const storage = installStorage({ [PROFILE_STORAGE_KEY]: "{ceci n'est pas du json" });
    expect(readProfile()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(PROFILE_STORAGE_KEY);
  });

  it("ne plante pas quand le stockage refuse d'ecrire", () => {
    // Navigation privee ou quota depasse : l'application doit continuer.
    installStorage();
    (globalThis as any).window.localStorage.setItem = vi.fn(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => writeProfile({ name: "Ana" })).not.toThrow();
    expect(writeProfile({ name: "Ana" })).toBeNull();
  });

  it("refuse d'ecrire une valeur qui n'est pas une fiche", () => {
    const storage = installStorage();
    expect(writeProfile("pas une fiche")).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe("clearProfile", () => {
  it("retire la cle", () => {
    const storage = installStorage({ [PROFILE_STORAGE_KEY]: "{}" });
    clearProfile();
    expect(storage.removeItem).toHaveBeenCalledWith(PROFILE_STORAGE_KEY);
  });

  it("ne plante pas si le stockage refuse", () => {
    installStorage();
    (globalThis as any).window.localStorage.removeItem = vi.fn(() => {
      throw new Error("refus");
    });
    expect(() => clearProfile()).not.toThrow();
  });
});

describe("readProfileName", () => {
  it("rend le nom enregistre", () => {
    installStorage({ [PROFILE_STORAGE_KEY]: JSON.stringify({ name: "Ana", version: PROFILE_VERSION }) });
    expect(readProfileName()).toBe("Ana");
  });

  it("retombe sur le defaut quand le nom est vide", () => {
    // Depuis le retrait des donnees personnelles, la fiche part vide : ce
    // repli est ce qui evite d'afficher un nom blanc dans la barre du haut.
    installStorage({ [PROFILE_STORAGE_KEY]: JSON.stringify({ name: "", version: PROFILE_VERSION }) });
    expect(readProfileName()).toBe(DEFAULT_PROFILE_NAME);
  });

  it("retombe sur le defaut sans fiche du tout", () => {
    installStorage();
    expect(readProfileName()).toBe(DEFAULT_PROFILE_NAME);
  });

  it("accepte un repli sur mesure", () => {
    installStorage();
    expect(readProfileName("Invite")).toBe("Invite");
  });
});
