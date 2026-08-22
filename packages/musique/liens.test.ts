import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Aucun lien mort dans la documentation vivante.
 *
 * Vingt liens pointaient dans le vide, dont seize dans le README d'op1-studio :
 * des captures d'ecran et des documents qui n'ont jamais existe dans ce depot,
 * herites de celui d'ou le module vient. Signales pendant deux sessions sans
 * etre corriges, parce que rien ne les faisait remonter.
 *
 * `docs/archived/` est exclu : ces documents sont historiques et referencent
 * volontairement des fichiers supprimes depuis.
 */

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function documents(dossier: string, sortie: string[] = []): string[] {
  for (const entree of readdirSync(path.join(RACINE, dossier))) {
    if (entree === "node_modules" || entree === ".git" || entree === "dist") continue;
    const relatif = path.join(dossier, entree);
    const complet = path.join(RACINE, relatif);
    if (statSync(complet).isDirectory()) {
      if (relatif.includes("archived")) continue;
      documents(relatif, sortie);
    } else if (entree.endsWith(".md")) {
      sortie.push(relatif);
    }
  }
  return sortie;
}

describe("liens de la documentation", () => {
  const fichiers = documents(".");

  it("parcourt bien des documents — sinon le test ne prouve rien", () => {
    expect(fichiers.length).toBeGreaterThan(15);
    expect(fichiers).toContain("README.md");
  });

  it("aucun lien relatif ne pointe dans le vide", () => {
    const morts: string[] = [];
    for (const doc of fichiers) {
      const texte = readFileSync(path.join(RACINE, doc), "utf-8");
      for (const m of texte.matchAll(/!?\[[^\]]*\]\(([^)#\s]+?)(?:#[^)]*)?\)/g)) {
        const cible = m[1].trim();
        if (/^(https?:|mailto:|#)/.test(cible)) continue;
        const chemin = path.resolve(RACINE, path.dirname(doc), cible);
        if (!existsSync(chemin)) morts.push(`${doc} → ${cible}`);
      }
    }
    expect(morts, `liens morts :\n  ${morts.join("\n  ")}`).toEqual([]);
  });

  it("aucune image ne pointe dans le vide non plus", () => {
    // Une image cassee est plus visible qu'un lien mort, et plus genante : le
    // README du depot en montre quatre.
    const morts: string[] = [];
    for (const doc of fichiers) {
      const texte = readFileSync(path.join(RACINE, doc), "utf-8");
      for (const m of texte.matchAll(/!\[[^\]]*\]\(([^)#\s]+?)\)/g)) {
        const cible = m[1].trim();
        if (/^https?:/.test(cible)) continue;
        if (!existsSync(path.resolve(RACINE, path.dirname(doc), cible))) morts.push(`${doc} → ${cible}`);
      }
    }
    expect(morts, `images cassees :\n  ${morts.join("\n  ")}`).toEqual([]);
  });
});
