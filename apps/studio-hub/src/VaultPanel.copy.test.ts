import { describe, expect, it, vi } from "vitest";
import { copyFile } from "./VaultPanel";

/**
 * Copie de fichier interrompue en cours d'ecriture.
 *
 * `copyFile` relit la destination et compare les empreintes apres avoir
 * ecrit. C'est cette relecture qui protege d'une ecriture tronquee : un
 * `write()` qui rend la main ne garantit pas que les octets sont sur le
 * disque — un volume amovible debranche, un quota atteint, et l'appel
 * reussit sans que le fichier soit complet.
 *
 * Sans ces tests, rien n'empeche quelqu'un de supprimer la relecture en la
 * prenant pour une precaution redondante. Elle ne l'est pas : c'est le seul
 * endroit ou une interruption est detectable.
 */

type ModeEcriture =
  | { mode: "normal" }
  | { mode: "tronque"; garde: number }        // n'ecrit que les premiers octets
  | { mode: "leve-au-write" }                 // debranchement pendant l'ecriture
  | { mode: "leve-au-close" }                 // debranchement a la fermeture
  | { mode: "corrompt" };                     // ecrit des octets differents

function fauxFichier(contenu: string, ecriture: ModeEcriture = { mode: "normal" }) {
  let octets = new TextEncoder().encode(contenu);
  return {
    getFile: async () => ({
      size: octets.byteLength,
      arrayBuffer: async () => octets.slice().buffer,
    }),
    createWritable: async () => ({
      write: vi.fn(async (data: ArrayBuffer) => {
        if (ecriture.mode === "leve-au-write") throw new DOMException("NotFoundError");
        const recus = new Uint8Array(data.slice(0));
        if (ecriture.mode === "tronque") octets = recus.slice(0, ecriture.garde);
        else if (ecriture.mode === "corrompt") {
          octets = recus.slice();
          if (octets.length) octets[0] = (octets[0] + 1) % 256;
        } else octets = recus;
      }),
      close: vi.fn(async () => {
        if (ecriture.mode === "leve-au-close") throw new DOMException("InvalidStateError");
      }),
    }),
  };
}

/** Dossier factice. `ecriture` s'applique aux fichiers qu'il cree. */
function fauxDossier(ecriture: ModeEcriture = { mode: "normal" }) {
  const enfants = new Map<string, any>();
  const dossier: any = {
    __enfants: enfants,
    async getFileHandle(nom: string, opts?: { create?: boolean }) {
      const trouve = enfants.get(nom);
      if (trouve && !trouve.__enfants) return trouve;
      if (opts?.create) {
        const f = fauxFichier("", ecriture);
        enfants.set(nom, f);
        return f;
      }
      throw new DOMException("NotFoundError");
    },
    async getDirectoryHandle(nom: string, opts?: { create?: boolean }) {
      const trouve = enfants.get(nom);
      if (trouve?.__enfants) return trouve;
      if (opts?.create) {
        const d = fauxDossier(ecriture);
        enfants.set(nom, d);
        return d;
      }
      throw new DOMException("NotFoundError");
    },
  };
  return dossier;
}

const CONTENU = "des octets qui comptent";

describe("copie normale", () => {
  it("rend la taille et l'empreinte du fichier ecrit", async () => {
    const r = await copyFile(fauxFichier(CONTENU) as any, fauxDossier(), "a.aif");
    expect(r.size).toBe(new TextEncoder().encode(CONTENU).byteLength);
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("cree l'arborescence intermediaire", async () => {
    const cible = fauxDossier();
    await copyFile(fauxFichier(CONTENU) as any, cible, "synth/user/a.aif");
    const user = cible.__enfants.get("synth").__enfants.get("user");
    expect(user.__enfants.has("a.aif")).toBe(true);
  });

  it("rend la meme empreinte pour le meme contenu", async () => {
    // Une empreinte instable rendrait toute verification inutilisable.
    const a = await copyFile(fauxFichier(CONTENU) as any, fauxDossier(), "a.aif");
    const b = await copyFile(fauxFichier(CONTENU) as any, fauxDossier(), "b.aif");
    expect(a.sha256).toBe(b.sha256);
  });

  it("rend des empreintes differentes pour des contenus differents", async () => {
    const a = await copyFile(fauxFichier("aaa") as any, fauxDossier(), "a.aif");
    const b = await copyFile(fauxFichier("bbb") as any, fauxDossier(), "b.aif");
    expect(a.sha256).not.toBe(b.sha256);
  });

  it("copie un fichier vide sans lever", async () => {
    const r = await copyFile(fauxFichier("") as any, fauxDossier(), "vide.aif");
    expect(r.size).toBe(0);
  });
});

describe("interruption en cours d'ecriture", () => {
  it("detecte une ecriture tronquee", async () => {
    // Le cas central : write() a rendu la main, mais seuls quelques octets
    // sont arrives. Sans relecture, copyFile rendrait un succes.
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "tronque", garde: 5 }), "a.aif")
    ).rejects.toThrow(/Vérification impossible/);
  });

  it("detecte une troncature d'un seul octet", async () => {
    // Comparer les tailles seules suffirait ici, mais pas au cas suivant.
    const n = new TextEncoder().encode(CONTENU).byteLength;
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "tronque", garde: n - 1 }), "a.aif")
    ).rejects.toThrow(/Vérification impossible/);
  });

  it("detecte des octets corrompus a taille identique", async () => {
    // La taille est bonne, le contenu non. Seule l'empreinte le voit — c'est
    // ce qui justifie de comparer autre chose que la longueur.
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "corrompt" }), "a.aif")
    ).rejects.toThrow(/Vérification impossible/);
  });

  it("laisse remonter un debranchement pendant l'ecriture", async () => {
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "leve-au-write" }), "a.aif")
    ).rejects.toThrow();
  });

  it("laisse remonter un echec a la fermeture", async () => {
    // close() est ce qui valide reellement l'ecriture : son echec ne doit
    // jamais etre avale.
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "leve-au-close" }), "a.aif")
    ).rejects.toThrow();
  });

  it("nomme le fichier concerne dans l'erreur", async () => {
    // Une copie interrompue au milieu de 240 fichiers doit dire lequel.
    await expect(
      copyFile(fauxFichier(CONTENU) as any, fauxDossier({ mode: "tronque", garde: 2 }), "synth/user/x.aif")
    ).rejects.toThrow(/synth\/user\/x\.aif/);
  });

  it("refuse un chemin sans nom de fichier", async () => {
    await expect(copyFile(fauxFichier(CONTENU) as any, fauxDossier(), "")).rejects.toThrow(/Chemin invalide/);
  });
});

describe("copie par lot interrompue", () => {
  it("s'arrete au fichier fautif et laisse les precedents intacts", async () => {
    // Reproduit ce que fait createBackup : une boucle de copies. Le lot
    // s'interrompt, mais ce qui precede est bien ecrit — c'est exactement ce
    // que le rapport partiel doit pouvoir inventorier.
    const cible = fauxDossier();
    const aCopier = ["a.aif", "b.aif", "c.aif"];
    const reussis: string[] = [];
    let echec: string | null = null;

    for (const [i, path] of aCopier.entries()) {
      // Le troisieme fichier arrive tronque.
      const dossier = i === 2 ? fauxDossier({ mode: "tronque", garde: 3 }) : cible;
      try {
        await copyFile(fauxFichier(CONTENU) as any, dossier, path);
        reussis.push(path);
      } catch {
        echec = path;
        break;
      }
    }

    expect(reussis).toEqual(["a.aif", "b.aif"]);
    expect(echec).toBe("c.aif");
    // Les deux premiers sont reellement sur le disque, pas seulement comptes.
    expect(cible.__enfants.has("a.aif")).toBe(true);
    expect(cible.__enfants.has("b.aif")).toBe(true);
    expect(cible.__enfants.has("c.aif")).toBe(false);
  });
});
