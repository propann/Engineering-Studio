import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./TopBar.tsx", import.meta.url), "utf8");

describe("TopBar — contrat d'interface", () => {
  it("expose le thème comme un bouton à état accessible", () => {
    expect(source).toContain('className="topbar-theme-toggle"');
    expect(source).toContain("aria-pressed={theme === \"studio\"}");
    expect(source).toContain("saveStudioTheme(theme)");
  });

  it("expose un vrai menu mobile referencé par le bouton", () => {
    expect(source).toContain('aria-controls="studio-mobile-menu"');
    expect(source).toContain('id="studio-mobile-menu"');
    expect(source).toContain("aria-expanded={mobileMenuOpen}");
    expect(source).toContain("setMobileMenuOpen(false)");
  });

  it("conserve les cinq portes principales sur desktop et mobile", () => {
    for (const id of ["studio-op1", "studio-ep133", "sound-library", "outils", "orphan-pages"]) {
      expect(source).toContain(`id: "${id}"`);
    }
    expect(source.match(/studioLinks\.map/g)).toHaveLength(2);
  });
});
