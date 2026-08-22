import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAMILLES, GAMMES } from "./gammes";
import { ORDRE_MOTIFS } from "./arpege";

/**
 * Les chiffres annonces dans la doc.
 *
 * Ce test existe a cause d'un defaut reel : le README, MODULES_STATUS, STATUS
 * et TESTS_PHYSIQUES annoncaient tous « 29 gammes » alors qu'il y en a 30. Le
 * compte venait d'un `grep` dont le motif ratait `lydien_b7` — le chiffre dans
 * le nom. Quatre fichiers d'un coup, et rien pour le signaler.
 *
 * C'est le meme defaut que la carte du rack principal qui annonce encore les
 * moteurs d'un composant supprime : une promesse laissee derriere le code.
 */

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lire = (p: string) => readFileSync(path.join(RACINE, p), "utf-8");

const DOCS = [
  "README.md",
  "MODULES_STATUS.md",
  "docs/STATUS.md",
  "docs/TESTS_PHYSIQUES.md",
];

describe("les chiffres annonces sont exacts", () => {
  const nbGammes = Object.keys(GAMMES).length;

  it("aucun document n'annonce un autre nombre de gammes", () => {
    for (const doc of DOCS) {
      const texte = lire(doc);
      for (const m of texte.matchAll(/(\d+)\s+gammes/g)) {
        expect(Number(m[1]), `${doc} annonce « ${m[0]} » pour ${nbGammes} gammes`).toBe(nbGammes);
      }
    }
  });

  it("aucun document n'annonce un autre nombre de motifs", () => {
    for (const doc of DOCS) {
      for (const m of lire(doc).matchAll(/(\d+)\s+motifs/g)) {
        expect(Number(m[1]), `${doc} annonce « ${m[0]} »`).toBe(ORDRE_MOTIFS.length);
      }
    }
  });

  it("le compte se fait sur les cles, pas sur un motif de recherche", () => {
    // Le grep d'origine cherchait `^  [a-z_]+: \[` : il ratait `lydien_b7`,
    // dont le nom porte un chiffre. Compter les cles de l'objet ne peut pas
    // rater d'entree.
    expect(nbGammes).toBe(FAMILLES.flatMap((f) => f.gammes).length);
    expect(Object.keys(GAMMES)).toContain("lydien_b7");
  });
});
