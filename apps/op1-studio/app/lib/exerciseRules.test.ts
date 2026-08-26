import { describe, expect, it } from "vitest";
import { GAME_SONG_THEMES } from "./gameSongsCatalog";
import { EXERCISE_RULES, validateExerciseCatalog } from "./exerciseRules";

describe("règles des exercices OP-1", () => {
  it("garde tout le catalogue sur les 24 touches et dans un ordre jouable", () => {
    expect(validateExerciseCatalog(GAME_SONG_THEMES)).toEqual([]);
  });
  it("refuse une note hors du clavier visible", () => {
    const broken = [{ ...GAME_SONG_THEMES[0], id: "test-hors-clavier", notes: [{ note: EXERCISE_RULES.playableMidiMax + 1, startSeconds: 0, durationSeconds: 0.2 }] }];
    expect(validateExerciseCatalog(broken).join(" ")).toContain("hors clavier");
  });
  it("refuse les identifiants dupliqués", () => {
    const duplicate = [{ ...GAME_SONG_THEMES[0] }, { ...GAME_SONG_THEMES[0] }];
    expect(validateExerciseCatalog(duplicate).join(" ")).toContain("dupliqué");
  });
});
