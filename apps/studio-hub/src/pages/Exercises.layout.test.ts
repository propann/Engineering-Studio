import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const PANEL = readFileSync(
  path.join(DIR, "..", "..", "..", "op1-studio", "app", "components", "GameGuitarHeroPanel.tsx"),
  "utf-8"
);

describe("exercice OP-1 compact et aligne", () => {
  it("place ecran et clavier dans une seule scene de 24 colonnes", () => {
    const start = PANEL.indexOf('className="op1-training-stage"');
    const end = PANEL.indexOf('{activeView === "catalog"');
    const stage = PANEL.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(stage).toContain('data-key-columns="24"');
    expect(stage).toContain('className="op1-highway-screen-oled"');
    expect(stage).toContain("<GameGuitarHeroKeyboard");
    expect(stage).toContain('width: "min(100%, 1100px)"');
  });

  it("ne garde ni mode d'emploi ni mapping verbeux dans la partie", () => {
    expect(PANEL).not.toContain("Jouez au clavier virtuel");
    expect(PANEL).not.toContain("Mapping OP-1 :");
    expect(PANEL).not.toContain("{currentSong.description}</div>");
  });

  it("ne recentre jamais silencieusement une note absente", () => {
    expect(PANEL).not.toContain("bounds.minX + bounds.width / 2");
    expect(PANEL).toContain("absente du clavier OP-1");
  });
});
