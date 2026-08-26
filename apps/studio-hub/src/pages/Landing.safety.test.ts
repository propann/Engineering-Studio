import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const LANDING = readFileSync(path.join(DIR, "Landing.tsx"), "utf-8");
const THEME_CSS = readFileSync(path.join(DIR, "..", "themes.css"), "utf-8");
const TOOLS_CSS = readFileSync(path.join(DIR, "outils.css"), "utf-8");

describe("presentation du serveur public de test", () => {
  it("annonce le danger avant les outils", () => {
    expect(LANDING).toContain("Serveur public de test");
    expect(LANDING).toContain("Écriture machine non validée");
    expect(LANDING).toContain("La restauration et l’écriture");
    expect(LANDING.indexOf("landing-test-alert")).toBeLessThan(LANDING.indexOf("landing-machine-grid"));
  });

  it("ne presente aucune machine comme prete", () => {
    expect(LANDING).not.toContain("READY");
    expect(LANDING).toContain('tone="test"');
  });

  it("charge l'habillage de l'alerte avec la page d'accueil", () => {
    expect(THEME_CSS).toContain(".landing-test-alert");
    expect(THEME_CSS).toContain("var(--ui-danger)");
    expect(TOOLS_CSS).not.toContain(".landing-test-alert");
  });
});
