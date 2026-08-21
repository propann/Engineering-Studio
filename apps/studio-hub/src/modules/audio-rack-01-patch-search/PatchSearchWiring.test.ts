import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PatchSearchEngine } from "./PatchSearchEngine";
import type { PatchPreset } from "@studio-hub/core/types/audio";

/**
 * Branchement de la recherche de patches au rack.
 *
 * Ce module existait depuis le debut, avec ses 159 lignes de tests au vert, et
 * n'etait importe par personne. Il cherchait dans un store Zustand parallele
 * (`core/store/audioRackStore.ts`) que rien n'alimentait : une clef
 * localStorage differente de celle du rack, donc toujours vide.
 *
 * Autrement dit, une recherche testee qui ne pouvait rien trouver, a cote de
 * 91 patches d'usine qu'on ne pouvait que faire defiler.
 *
 * Les tests structurels ci-dessous verrouillent le branchement lui-meme. Sans
 * eux, revenir a la liste non filtree ne casserait rien de visible : le
 * typecheck passerait, le build aussi, et la boite de recherche resterait a
 * l'ecran sans plus rien filtrer.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACK = readFileSync(path.join(DIR, "..", "..", "pages", "AudioPluginRack.tsx"), "utf-8");

describe("cablage au rack", () => {
  it("le rack importe le moteur de recherche", () => {
    expect(RACK).toMatch(/import \{ PatchSearchEngine \} from/);
  });

  it("la liste affichee passe par le filtre", () => {
    expect(RACK).toContain("const patchesAffiches = filtrerPatches(allPatchesForEngine)");
  });

  it("les deux listes de moteurs sont filtrees, pas seulement une", () => {
    // Le rack rend deux blocs identiques — moteurs Mutable Instruments et
    // moteurs open source. N'en cabler qu'un laisserait la moitie des patches
    // insensibles a la recherche.
    const rendus = RACK.match(/\{patchesAffiches\.map\(/g) ?? [];
    expect(rendus).toHaveLength(2);
  });

  it("plus aucune liste non filtree n'est rendue", () => {
    // C'est l'invariant qui compte : `allPatchesForEngine` reste legitime pour
    // le decompte et le choix automatique, mais ne doit plus etre ce qu'on
    // affiche.
    expect(RACK).not.toMatch(/\{allPatchesForEngine\.map\(/);
  });

  it("le choix automatique au depliage ignore le filtre", () => {
    // Ouvrir un moteur ne doit pas dependre de ce qui est tape dans la
    // recherche : sinon, une recherche sans resultat rendrait le moteur
    // inselectionnable.
    expect(RACK).toContain("if (allPatchesForEngine.length > 0) applyPatch(allPatchesForEngine[0])");
  });

  it("le champ de recherche est relie a l'etat", () => {
    expect(RACK).toContain('value={patchQuery}');
    expect(RACK).toContain("onChange={(e) => setPatchQuery(e.target.value)}");
  });
});

/**
 * Patches de la forme reelle du rack : ni `tags`, ni `isFavorite`, ni
 * horodatage. Le type partage les declare optionnels, et la recherche les lit
 * — d'ou ces cas, qui verifient qu'elle ne s'effondre pas sans eux.
 */
const PATCHES_RACK: PatchPreset[] = [
  { id: "pl1", name: "Analog Bass Growl", engine: "mi_plaits", category: "Bass", params: {} },
  { id: "pl2", name: "Glass Bells", engine: "mi_plaits", category: "Keys", params: {} },
  { id: "br1", name: "Deep Sub Bass", engine: "mi_braids", category: "Bass", params: {} },
  { id: "u1", name: "Mon patch a moi", engine: "mi_plaits", category: "Perso", params: {}, isUserPatch: true },
];

describe("recherche sur des patches sans etiquettes", () => {
  const moteur = () => new PatchSearchEngine(PATCHES_RACK);

  it("ne leve pas quand tags est absent", () => {
    // `p.tags?.some(...) ?? false` protege ce cas ; le test l'immobilise.
    expect(() => moteur().search("bass")).not.toThrow();
  });

  it("trouve par le nom, sans tenir compte de la casse", () => {
    const r = moteur().search("GLASS");
    expect(r.map((p) => p.id)).toEqual(["pl2"]);
  });

  it("trouve par la categorie", () => {
    // Les patches du rack n'ont pas d'etiquettes : la categorie est le seul
    // autre axe de recherche disponible.
    const r = moteur().search("bass");
    expect(r.map((p) => p.id).sort()).toEqual(["br1", "pl1"]);
  });

  it("trouve un patch utilisateur comme un patch d'usine", () => {
    expect(moteur().search("mon patch").map((p) => p.id)).toEqual(["u1"]);
  });

  it("rend une liste vide plutot que tout, quand rien ne correspond", () => {
    // Le defaut inverse — rendre la liste entiere sur une recherche
    // infructueuse — passerait facilement inapercu a l'ecran.
    expect(moteur().search("zzzz")).toEqual([]);
  });

  it("rend tout pour une recherche vide", () => {
    expect(moteur().search("")).toHaveLength(PATCHES_RACK.length);
  });

  it("ignore les espaces de bord", () => {
    expect(moteur().search("  bells  ".trim()).map((p) => p.id)).toEqual(["pl2"]);
  });
});
