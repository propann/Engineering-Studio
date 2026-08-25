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

describe("on ne peut pas perdre la derniere porte d'une page", () => {
  /**
   * Trois pages ne s'ouvrent que depuis ce registre : `advanced-image`,
   * `sound-patch-creator` et `rhythm-hero`, sorti du Hub le 2026-08-25.
   *
   * « Retirer » persiste dans `localStorage` et seule la DERNIERE suppression
   * s'annule : deux retraits d'affilee en scellent un. Sur une page dont ce
   * registre est le seul chemin, le retrait ne range pas — il coupe la
   * derniere porte, et le code reste sans que rien ne l'ouvre.
   */
  it("le retrait est refuse quand ce registre est le seul chemin", () => {
    expect(RECENSEMENT).toContain("const estSeulAcces =");
    const bloc = RECENSEMENT.slice(RECENSEMENT.indexOf("const removeEntry"));
    expect(bloc.slice(0, 400)).toContain("if (estSeulAcces(page))");
  });

  it("le bouton le dit avant le clic, il ne se contente pas de refuser", () => {
    expect(RECENSEMENT).toContain("disabled={estSeulAcces(page)}");
  });

  it("chaque page du registre declare par ou on y entre", () => {
    // Un lien manquant ferait passer une page atteignable pour une orpheline,
    // et une orpheline pour une page qu'on peut retirer sans risque.
    const liens = new Set([...RECENSEMENT.matchAll(/^\s*"([a-z0-9-]+)": \[/gm)].map((m) => m[1]));
    for (const id of recensees()) {
      expect(liens.has(id), `« ${id} » n'a aucune entree dans PAGE_LINKS`).toBe(true);
    }
  });

  it("les pages sans autre porte sont bien reconnues comme telles", () => {
    // Verrouille le fait, pas seulement le mecanisme : si l'une de ces trois
    // retrouve un bouton ailleurs, ce test tombe et rappelle de le declarer.
    for (const id of ["advanced-image", "sound-patch-creator", "rhythm-hero"]) {
      const m = new RegExp(`"${id}": \\[([^\\]]*)\\]`).exec(RECENSEMENT);
      expect(m, `${id} absent de PAGE_LINKS`).not.toBeNull();
      expect(m![1].trim(), `${id} n'est plus une orpheline`).toBe('"Page manager"');
    }
  });
});
