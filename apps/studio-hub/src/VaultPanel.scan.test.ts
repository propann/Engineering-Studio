import { describe, expect, it, vi } from "vitest";
import { scannerSource } from "./VaultPanel";
import type { BackupCategory } from "./VaultPanel";

/**
 * Inspection du dossier source, avant sauvegarde.
 *
 * L'ancien scan additionnait toutes les categories en un seul total et
 * avalait les absentes en silence : un dossier `synth` manquant se lisait
 * exactement comme un dossier vide. Une sauvegarde amputee passait donc pour
 * complete, et on ne s'en apercevait qu'a la restauration.
 */

function fauxFichier(octets: number) {
  return { getFile: async () => ({ size: octets }) };
}

/**
 * Dossier factice. Une valeur numerique est un fichier de cette taille, un
 * objet est un sous-dossier. `null` simule un dossier dont l'ouverture echoue
 * — permission revoquee, volume debranche.
 */
function fauxDossier(contenu: Record<string, any>) {
  const enfants = new Map(Object.entries(contenu));
  return {
    async *entries(): AsyncGenerator<[string, any]> {
      for (const [nom, v] of enfants) {
        if (v === null) continue;
        yield [nom, typeof v === "number" ? { kind: "file", ...fauxFichier(v) } : { kind: "directory", ...fauxDossier(v) }];
      }
    },
    async getDirectoryHandle(nom: string) {
      const v = enfants.get(nom);
      if (v === undefined || v === null || typeof v === "number") throw new DOMException("NotFoundError");
      return fauxDossier(v);
    },
  } as any;
}

const CATS = ["tape", "album", "drum", "synth"] as BackupCategory[];

describe("scannerSource", () => {
  it("distingue presente, vide et absente", async () => {
    // Les trois etats qui etaient confondus en un seul total.
    const racine = fauxDossier({
      tape: { "a.aif": 100 },
      album: {},
      // drum et synth absents
    });
    const scan = await scannerSource(racine, CATS);
    const etats = Object.fromEntries(scan.categories.map((c) => [c.categorie, c.etat]));
    expect(etats).toEqual({ tape: "presente", album: "vide", drum: "absente", synth: "absente" });
  });

  it("compte fichiers et octets par categorie", async () => {
    const racine = fauxDossier({
      tape: { "a.aif": 100, "b.aif": 200 },
      album: { "c.aif": 50 },
      drum: {},
      synth: {},
    });
    const scan = await scannerSource(racine, CATS);
    const tape = scan.categories.find((c) => c.categorie === "tape")!;
    expect(tape.fichiers).toBe(2);
    expect(tape.octets).toBe(300);
  });

  it("descend dans les sous-dossiers", async () => {
    // Les sons de l'OP-1 sont sous synth/user/, pas a la racine de synth/.
    const racine = fauxDossier({ synth: { user: { "a.aif": 10, "b.aif": 20 } }, tape: {}, album: {}, drum: {} });
    const synth = (await scannerSource(racine, CATS)).categories.find((c) => c.categorie === "synth")!;
    expect(synth.fichiers).toBe(2);
    expect(synth.octets).toBe(30);
  });

  it("totalise sur l'ensemble des categories", async () => {
    const racine = fauxDossier({ tape: { "a.aif": 100 }, album: { "b.aif": 200 }, drum: {}, synth: {} });
    const scan = await scannerSource(racine, CATS);
    expect(scan.fichiers).toBe(2);
    expect(scan.octets).toBe(300);
  });

  it("rend un scan vide mais complet sur un espace de travail vide", async () => {
    // Cas « empty workspace » : aucune categorie, mais la liste est renseignee
    // pour que l'interface puisse dire ce qui manque.
    const scan = await scannerSource(fauxDossier({}), CATS);
    expect(scan.fichiers).toBe(0);
    expect(scan.categories).toHaveLength(4);
    expect(scan.categories.every((c) => c.etat === "absente")).toBe(true);
  });

  it("traite une categorie inaccessible comme absente, sans lever", async () => {
    // Cas « permission loss » : le dossier existe mais son ouverture echoue.
    // Interrompre tout le scan priverait l'utilisateur des categories saines.
    const racine = fauxDossier({ tape: { "a.aif": 100 }, album: null, drum: {}, synth: {} });
    const scan = await scannerSource(racine, CATS);
    expect(scan.categories.find((c) => c.categorie === "album")!.etat).toBe("absente");
    expect(scan.categories.find((c) => c.categorie === "tape")!.fichiers).toBe(1);
  });

  it("poursuit apres une categorie manquante", async () => {
    // Cas « partial scan » : une categorie absente au milieu ne doit pas
    // masquer celles qui suivent.
    const racine = fauxDossier({ tape: {}, drum: { "d.aif": 5 }, synth: { "s.aif": 7 } });
    const scan = await scannerSource(racine, CATS);
    expect(scan.categories.find((c) => c.categorie === "album")!.etat).toBe("absente");
    expect(scan.fichiers).toBe(2);
  });

  it("conserve l'ordre demande", async () => {
    // L'ordre pilote l'affichage : il ne doit pas dependre du systeme de
    // fichiers, qui n'en garantit aucun.
    const racine = fauxDossier({ synth: {}, tape: {}, drum: {}, album: {} });
    const scan = await scannerSource(racine, CATS);
    expect(scan.categories.map((c) => c.categorie)).toEqual(CATS);
  });

  it("accepte une liste de categories vide", async () => {
    const scan = await scannerSource(fauxDossier({ tape: { "a.aif": 1 } }), []);
    expect(scan.categories).toEqual([]);
    expect(scan.fichiers).toBe(0);
  });

  it("n'ecrit jamais sur la source", async () => {
    // Le scan est annonce « lecture seule » dans l'interface : aucune
    // creation de dossier ne doit etre demandee.
    const getDirectoryHandle = vi.fn(async () => fauxDossier({}));
    const racine = { getDirectoryHandle } as any;
    await scannerSource(racine, CATS);
    for (const appel of getDirectoryHandle.mock.calls) {
      expect((appel as any)[1]?.create).toBeFalsy();
    }
  });
});
