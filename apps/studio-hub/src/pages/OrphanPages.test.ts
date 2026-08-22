import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le recensement des pages.
 *
 * `OrphanPages` liste toutes les pages du hub avec leur cible de projet.
 * C'est le seul endroit du depot qui donne cette vue — l'analyse du rack
 * principal l'a d'ailleurs notee comme la bonne idee qu'elle aurait aime
 * trouver au depart.
 *
 * Mais une liste tenue a la main prend du retard sans que rien ne le signale :
 * deux pages atteignables n'y figuraient pas, dont la page de recensement
 * elle-meme. Ce test la maintient a jour.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RECENSEMENT = readFileSync(path.join(DIR, "OrphanPages.tsx"), "utf-8");
const APP = readFileSync(path.join(DIR, "..", "App.tsx"), "utf-8");

const recensees = () => new Set([...RECENSEMENT.matchAll(/\{ id: "([^"]+)"/g)].map((m) => m[1]));

/** Les pages que l'application sait afficher : le type `Page` et le switch. */
const atteignables = () => {
  const parType = [...APP.matchAll(/^\s*\| "([^"]+)"/gm)].map((m) => m[1]);
  const parSwitch = [...APP.matchAll(/case "([^"]+)":/g)].map((m) => m[1]);
  return new Set([...parType, ...parSwitch]);
};

describe("le recensement suit les pages reelles", () => {
  it("lit bien les deux sources", () => {
    expect(RECENSEMENT.length).toBeGreaterThan(2000);
    expect(atteignables().size).toBeGreaterThan(15);
  });

  it("aucune page atteignable ne manque au recensement", () => {
    // Le defaut trouve : `sound-library`, ajoutee le soir meme, et
    // `orphan-pages` elle-meme n'y figuraient pas.
    const manquantes = [...atteignables()].filter((p) => !recensees().has(p)).sort();
    expect(manquantes, `pages absentes du recensement : ${manquantes.join(", ")}`).toEqual([]);
  });

  it("le recensement ne liste pas de page qui n'existe plus", () => {
    // L'inverse compte autant : une entree vers une page supprimee envoie
    // l'utilisateur dans le vide.
    const fantomes = [...recensees()].filter((p) => !atteignables().has(p)).sort();
    expect(fantomes, `pages recensees mais inatteignables : ${fantomes.join(", ")}`).toEqual([]);
  });

  it("chaque entree porte une cible de projet", () => {
    // C'est ce qui rend la liste utile : savoir si une page appartient a
    // l'OP-1, a l'EP-133, ou au hub.
    const entrees = [...RECENSEMENT.matchAll(/\{ id: "[^"]+", label: "[^"]*", description: "[^"]*", target: "([^"]+)" \}/g)];
    expect(entrees.length).toBe(recensees().size);
    for (const [, cible] of entrees) {
      expect(["OP-1", "EP-133", "Hub partagé", "Aucun projet"]).toContain(cible);
    }
  });
});
