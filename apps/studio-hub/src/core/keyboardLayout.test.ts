import { describe, expect, it } from "vitest";
import {
  KEYBOARD_BLACK_NOTES,
  OP1_FIRST_KEY_NOTE,
  KEYBOARD_COLS,
  KEYBOARD_ROWS,
  KEYBOARD_WHITE_NOTES,
  KEYBOARD_PLAYABLE_NOTES,
  foldNoteToPlayableKeyboard,
  isPlayableKeyboardNote,
  layoutBounds,
  sortKeyBlocks,
  type KeyboardBlock,
} from "../../../op1-studio/app/lib/keyboardLayout";
import { GAME_SONG_THEMES } from "../../../op1-studio/app/lib/gameSongsCatalog";

/**
 * La disposition du clavier est partagee par trois lecteurs : le clavier joue
 * du Studio, l'ecran Exercices et l'editeur de grille. Ils doivent tomber sur
 * le meme repere horizontal, sinon une note tombe dans la mauvaise colonne.
 *
 * Ces fonctions sont pures ; seul loadKeyboardLayout touche au stockage, et il
 * depend du coffre natif, hors de portee d'un test unitaire.
 */

const block = (over: Partial<KeyboardBlock> = {}): KeyboardBlock => ({
  col: 0,
  row: 0,
  w: 2,
  h: 4,
  color: "#fff",
  type: "white",
  ...over,
});

describe("correspondance notes / touches", () => {
  it("expose exactement 24 notes chromatiques de 53 a 76", () => {
    expect(KEYBOARD_PLAYABLE_NOTES).toEqual(Array.from({ length: 24 }, (_, i) => 53 + i));
  });

  it("replie les octaves hors clavier sans changer la hauteur", () => {
    expect(foldNoteToPlayableKeyboard(41)).toBe(53);
    expect(foldNoteToPlayableKeyboard(45)).toBe(57);
    expect(foldNoteToPlayableKeyboard(49)).toBe(61);
    expect(foldNoteToPlayableKeyboard(88)).toBe(76);
    for (let note = 0; note <= 127; note++) {
      const folded = foldNoteToPlayableKeyboard(note);
      expect(isPlayableKeyboardNote(folded)).toBe(true);
      expect((folded - note) % 12).toBe(0);
    }
  });

  it("rend chaque note des 40 exercices jouable", () => {
    expect(GAME_SONG_THEMES).toHaveLength(40);
    for (const theme of GAME_SONG_THEMES) {
      for (const note of theme.notes) expect(isPlayableKeyboardNote(note.note)).toBe(true);
    }
  });

  it("part de la première note matérielle MIDI 53", () => {
    /**
     * Deux commits se sont contredits ici, et le desaccord est consigne pour
     * qu'il ne se rejoue pas.
     *
     * `53eee1d` a mis 41 (F2) en citant une capture brute « 80 29 40 15 » dont
     * il ne reste aucune trace ailleurs dans le depot. `b6fba1a` a remis 53
     * (F3) en affirmant l'inverse, sans preuve. Les deux dispositions sont
     * valides — 24 touches, F a E — et separees d'une seule octave.
     *
     * C'est justement ce que decale le reglage d'octave de l'OP-1 : la machine
     * n'emet pas une note fixe pour sa premiere touche. Aucune des deux valeurs
     * n'est donc universellement juste ; 53 est celle retenue, tranchee par le
     * proprietaire de la machine le 2026-08-23.
     *
     * Avant de la rechanger : verifier sur le materiel, et noter le reglage
     * d'octave en meme temps que les octets.
     */
    expect(OP1_FIRST_KEY_NOTE).toBe(53);
    expect(KEYBOARD_WHITE_NOTES[0]).toBe(OP1_FIRST_KEY_NOTE);
  });

  it("n'a aucune note en commun entre blanches et noires", () => {
    const chevauchement = KEYBOARD_WHITE_NOTES.filter((n) => KEYBOARD_BLACK_NOTES.includes(n));
    expect(chevauchement).toEqual([]);
  });

  it("range les notes en ordre croissant", () => {
    // L'ordre du tableau vaut position gauche->droite : une inversion
    // ferait jouer la mauvaise touche.
    for (const notes of [KEYBOARD_WHITE_NOTES, KEYBOARD_BLACK_NOTES]) {
      for (let i = 1; i < notes.length; i++) {
        expect(notes[i]).toBeGreaterThan(notes[i - 1]);
      }
    }
  });

  it("place chaque note noire entre deux blanches", () => {
    // Une noire hors de l'etendue des blanches serait injouable.
    const min = KEYBOARD_WHITE_NOTES[0];
    const max = KEYBOARD_WHITE_NOTES[KEYBOARD_WHITE_NOTES.length - 1];
    for (const n of KEYBOARD_BLACK_NOTES) {
      expect(n).toBeGreaterThan(min);
      expect(n).toBeLessThan(max);
    }
  });

  it("respecte l'alternance du clavier tempere", () => {
    // Les demi-tons (indices 1, 3, 6, 8, 10) sont noirs, les autres blancs.
    const noirs = new Set([1, 3, 6, 8, 10]);
    for (const n of KEYBOARD_WHITE_NOTES) expect(noirs.has(n % 12)).toBe(false);
    for (const n of KEYBOARD_BLACK_NOTES) expect(noirs.has(n % 12)).toBe(true);
  });
});

describe("sortKeyBlocks", () => {
  it("separe les familles", () => {
    const out = sortKeyBlocks([
      block({ type: "white" }),
      block({ type: "black" }),
      block({ type: "enc" }),
      block({ type: "fn" }),
      block({ type: "trans" }),
    ]);
    expect(out.white).toHaveLength(1);
    expect(out.black).toHaveLength(1);
    expect(out.enc).toHaveLength(1);
    expect(out.fn).toHaveLength(1);
    expect(out.trans).toHaveLength(1);
  });

  it("trie chaque famille de gauche a droite", () => {
    // C'est ce tri qui aligne l'index du bloc sur celui de la note :
    // desordonne, la troisieme touche jouerait la note de la premiere.
    const out = sortKeyBlocks([
      block({ type: "white", col: 30 }),
      block({ type: "white", col: 4 }),
      block({ type: "white", col: 17 }),
    ]);
    expect(out.white.map((b) => b.col)).toEqual([4, 17, 30]);
  });

  it("ignore les types inconnus", () => {
    const out = sortKeyBlocks([block({ type: "inconnu" }), block({ type: "white" })]);
    expect(out.white).toHaveLength(1);
    expect(Object.values(out).flat()).toHaveLength(1);
  });

  it("accepte une grille vide", () => {
    const out = sortKeyBlocks([]);
    expect(Object.values(out).every((f) => f.length === 0)).toBe(true);
  });
});

describe("layoutBounds", () => {
  it("cadre sur le contenu avec une marge d'une unite", () => {
    const b = layoutBounds([block({ col: 10, row: 5, w: 4, h: 3 })], KEYBOARD_COLS, KEYBOARD_ROWS);
    expect(b.minX).toBe(9); // 10 - 1
    expect(b.maxX).toBe(15); // 10 + 4 + 1
    expect(b.minY).toBe(4);
    expect(b.maxY).toBe(9);
  });

  it("ne deborde jamais de la grille", () => {
    // Un bloc colle au bord ne doit pas produire un viewBox negatif ni
    // plus large que la grille : le SVG serait decale.
    const b = layoutBounds(
      [block({ col: 0, row: 0, w: KEYBOARD_COLS, h: KEYBOARD_ROWS })],
      KEYBOARD_COLS,
      KEYBOARD_ROWS
    );
    expect(b.minX).toBe(0);
    expect(b.minY).toBe(0);
    expect(b.maxX).toBe(KEYBOARD_COLS);
    expect(b.maxY).toBe(KEYBOARD_ROWS);
  });

  it("rend la grille entiere quand elle est vide", () => {
    const b = layoutBounds([], KEYBOARD_COLS, KEYBOARD_ROWS);
    expect(b.viewBox).toBe(`0 0 ${KEYBOARD_COLS} ${KEYBOARD_ROWS}`);
  });

  it("garde des dimensions strictement positives", () => {
    // Un width ou height nul rendrait le SVG invisible.
    for (const blocks of [[], [block({ col: 5, row: 5, w: 0, h: 0 })]]) {
      const b = layoutBounds(blocks, KEYBOARD_COLS, KEYBOARD_ROWS);
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    }
  });

  it("compose un viewBox coherent avec ses bornes", () => {
    const b = layoutBounds([block({ col: 8, row: 2, w: 6, h: 4 })], KEYBOARD_COLS, KEYBOARD_ROWS);
    expect(b.viewBox).toBe(`${b.minX} ${b.minY} ${b.width} ${b.height}`);
  });

  it("englobe plusieurs blocs disperses", () => {
    const b = layoutBounds(
      [block({ col: 2, row: 1, w: 2, h: 2 }), block({ col: 40, row: 9, w: 3, h: 2 })],
      KEYBOARD_COLS,
      KEYBOARD_ROWS
    );
    expect(b.minX).toBe(1);
    expect(b.maxX).toBe(44);
    expect(b.width).toBe(43);
  });
});
