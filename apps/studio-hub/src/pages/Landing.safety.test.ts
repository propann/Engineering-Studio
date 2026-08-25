import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const LANDING = readFileSync(path.join(DIR, "Landing.tsx"), "utf-8");
const GLOBAL_CSS = readFileSync(path.join(DIR, "..", "styles.css"), "utf-8");
const TOOLS_CSS = readFileSync(path.join(DIR, "outils.css"), "utf-8");

describe("presentation du serveur public de test", () => {
  it("annonce le danger avant les outils", () => {
    expect(LANDING).toContain("SERVEUR PUBLIC DE TEST");
    expect(LANDING).toContain("fonctions en test et potentiellement dangereuses");
    expect(LANDING).toContain("ÉCRITURE MACHINE");
    expect(LANDING).toContain("NON VALIDÉE");
  });

  it("ne presente aucune machine comme prete", () => {
    expect(LANDING).not.toContain("READY");
    expect(LANDING).toContain('className="pill-test"');
  });

  it("charge l'habillage de l'alerte avec la page d'accueil", () => {
    expect(GLOBAL_CSS).toContain(".wip-banner");
    expect(GLOBAL_CSS).toContain(".wip-machine-state");
    expect(TOOLS_CSS).not.toContain(".wip-banner");
  });
});
