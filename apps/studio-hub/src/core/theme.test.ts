import { describe, expect, it } from "vitest";
import { isStudioTheme } from "./theme";

describe("studio theme", () => {
  it("accepte uniquement les deux thèmes publics", () => {
    expect(isStudioTheme("atelier")).toBe(true);
    expect(isStudioTheme("studio")).toBe(true);
    expect(isStudioTheme("dark")).toBe(false);
    expect(isStudioTheme(null)).toBe(false);
  });
});
