import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import {
  DOSSIER_ARCHIVE, construireArchivePatches, lireArchivePatches, nomFichierSur,
} from "./archivePatches";
import type { PatchPreset } from "../types/audio";

/**
 * L'archive de patches.
 *
 * Ce qui compte ici n'est pas qu'un ZIP se fabrique — fflate s'en charge —
 * mais qu'un lot ecrit se relise ENTIER, et qu'un fichier abime n'emporte pas
 * les autres. C'est la seule raison d'avoir un fichier par patch plutot qu'un
 * gros document.
 */

const CLES = ["fxDelayMix", "fxEqLow", "envAttack", "activeEngine"];

const patch = (nom: string, moteur = "mi_plaits"): PatchPreset => ({
  id: `usr_${nom}`,
  name: nom,
  engine: moteur as PatchPreset["engine"],
  category: "Custom",
  isUserPatch: true,
  params: { fxDelayMix: 40, fxEqLow: -3, envAttack: 12 },
});

describe("nom de fichier sur", () => {
  it("refuse la barre oblique, qui creuserait un sous-dossier", () => {
    expect(nomFichierSur("basses/lourdes", 0)).not.toContain("/");
  });

  it("refuse la remontee de dossier", () => {
    // `../../etc/passwd` dans une archive : un lecteur naif ecrirait hors du
    // dossier de destination. Le nom ne doit jamais pouvoir la porter.
    const n = nomFichierSur("../../etc/passwd", 0);
    expect(n).not.toContain("..");
    expect(n).not.toContain("/");
  });

  it("garde le nom lisible, accents retires", () => {
    expect(nomFichierSur("Nappe Etoilee", 0)).toBe("001_Nappe_Etoilee.json");
  });

  it("retire les accents plutot que de les remplacer", () => {
    expect(nomFichierSur("Nappe \u00c9toil\u00e9e", 0)).toBe("001_Nappe_Etoilee.json");
  });

  it("donne quand meme un nom a ce qui n'en a plus", () => {
    // Que des symboles : sans repli, le fichier s'appellerait « .json ».
    for (const nom of ["", "///", "***", "..", "   "]) {
      const n = nomFichierSur(nom, 4);
      expect(n, `pour « ${nom} »`).toBe("005_patch.json");
    }
  });

  it("distingue deux patches du meme nom", () => {
    expect(nomFichierSur("Basse", 0)).not.toBe(nomFichierSur("Basse", 1));
  });

  it("garde l'ordre d'origine au tri alphabetique", () => {
    // L'index prefixe et non suffixe : sans cela, le patch 10 se rangerait
    // entre le 1 et le 2 a la relecture.
    const noms = Array.from({ length: 12 }, (_, i) => nomFichierSur("z", i));
    expect([...noms].sort()).toEqual(noms);
  });

  it("borne la longueur", () => {
    expect(nomFichierSur("x".repeat(500), 0).length).toBeLessThan(80);
  });
});

describe("aller-retour d'une archive", () => {
  it("rend tous les patches ecrits", () => {
    const lot = [patch("Basse"), patch("Nappe", "helm"), patch("Lead", "surge_xt")];
    const { patches, echecs } = lireArchivePatches(construireArchivePatches(lot), CLES);
    expect(echecs).toEqual([]);
    expect(patches).toHaveLength(3);
    expect(patches.map((p) => p.patch.engine)).toEqual(["mi_plaits", "helm", "surge_xt"]);
  });

  it("conserve les reglages, valeur par valeur", () => {
    const { patches } = lireArchivePatches(construireArchivePatches([patch("Basse")]), CLES);
    expect(patches[0].patch.params.fxDelayMix).toBe(40);
    expect(patches[0].patch.params.fxEqLow).toBe(-3);
    expect(patches[0].patch.params.envAttack).toBe(12);
  });

  it("range les patches dans leur dossier", () => {
    const { patches } = lireArchivePatches(construireArchivePatches([patch("Basse")]), CLES);
    expect(patches[0].fichier.startsWith(`${DOSSIER_ARCHIVE}/`)).toBe(true);
  });

  it("une archive vide se relit sans echec", () => {
    expect(lireArchivePatches(construireArchivePatches([]), CLES)).toEqual({ patches: [], echecs: [] });
  });
});

describe("une archive abimee", () => {
  const bon = JSON.stringify({ engine: "helm", parameters: { fxEqLow: 5 } });

  it("un patch illisible n'emporte pas les autres", () => {
    // L'invariant central. Un unique document JSON aurait la propriete
    // inverse : une accolade de trop et tout est perdu.
    const zip = zipSync({
      "patches/001_bon.json": strToU8(bon),
      "patches/002_casse.json": strToU8("{ ceci n'est pas du json"),
      "patches/003_bon.json": strToU8(bon),
    });
    const { patches, echecs } = lireArchivePatches(zip, CLES);
    expect(patches).toHaveLength(2);
    expect(echecs).toHaveLength(1);
    expect(echecs[0].fichier).toBe("patches/002_casse.json");
  });

  it("nomme le fichier fautif", () => {
    // Sans le nom, on decouvrirait le trou plus tard, en cherchant un patch
    // qui n'a jamais ete relu.
    const zip = zipSync({ "patches/x.json": strToU8(JSON.stringify({ engine: "inconnu_9000" })) });
    const { echecs } = lireArchivePatches(zip, CLES);
    expect(echecs[0].fichier).toBe("patches/x.json");
    expect(echecs[0].raison).toContain("inconnu_9000");
  });

  it("ignore sans bruit ce qui n'est pas un patch", () => {
    // Un ZIP porte souvent des metadonnees de systeme de fichiers. Les
    // compter comme des echecs ferait crier l'interface sur une archive saine.
    const zip = zipSync({
      "patches/001_bon.json": strToU8(bon),
      "__MACOSX/._001_bon.json": strToU8("bruit"),
      "patches/.DS_Store": strToU8("bruit"),
      "lisez-moi.txt": strToU8("texte libre"),
    });
    const { patches, echecs } = lireArchivePatches(zip, CLES);
    expect(patches).toHaveLength(1);
    expect(echecs).toEqual([]);
  });

  it("un fichier qui n'est pas un ZIP donne un echec, pas une exception", () => {
    const { patches, echecs } = lireArchivePatches(strToU8("bonjour"), CLES);
    expect(patches).toEqual([]);
    expect(echecs).toHaveLength(1);
  });

  it("filtre les cles inconnues comme l'import a l'unite", () => {
    // Une archive est une entree non fiable comme une autre : sans filtre,
    // elle verse ce qu'elle veut dans les reglages du moteur.
    const zip = zipSync({
      "patches/x.json": strToU8(JSON.stringify({
        engine: "helm",
        parameters: { fxEqLow: 5, cleInventee: 42, fxDelayMix: NaN },
      })),
    });
    const { patches } = lireArchivePatches(zip, CLES);
    expect(patches[0].patch.params.fxEqLow).toBe(5);
    expect(patches[0].patch.params.cleInventee).toBeUndefined();
    // NaN traverse `setValueAtTime` sans lever et rend la voix muette.
    expect(patches[0].patch.params.fxDelayMix).toBeUndefined();
  });
});
