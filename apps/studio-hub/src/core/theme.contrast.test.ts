import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../themes.css", import.meta.url), "utf8");

function declarations(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) throw new Error(`Bloc CSS absent : ${selector}`);
  return Object.fromEntries([...match[1].matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6,8})/gi)].map((entry) => [entry[1], entry[2]]));
}

function luminance(hex: string) {
  const channels = hex.slice(1, 7).match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

describe("contrastes des deux thèmes", () => {
  for (const [name, selector] of [["Atelier", ':root,\n:root[data-theme="atelier"]'], ["Studio", ':root[data-theme="studio"]']] as const) {
    it(`${name} garde les textes principaux au niveau AA`, () => {
      const tokens = declarations(selector);
      expect(contrast(tokens["--ui-text"], tokens["--ui-bg"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens["--ui-text"], tokens["--ui-panel"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens["--ui-muted"], tokens["--ui-bg"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens["--ui-on-accent"], tokens["--ui-orange"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens["--ui-on-danger"], tokens["--ui-danger"])).toBeGreaterThanOrEqual(4.5);
    });
  }
});
