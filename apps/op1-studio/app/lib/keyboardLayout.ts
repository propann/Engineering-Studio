/**
 * Disposition du clavier construit — module partagé (13/14 août 2026) entre
 * `StudioMachinePanel` (rendu jouable), `KeyboardEditor` (peinture, mis de
 * côté pour l'instant) et `ExercisePanel` (écran « notes qui tombent »).
 *
 * Raison d'être : l'écran Exercices doit faire tomber chaque note dans la
 * colonne EXACTE de sa touche sur le clavier affiché juste en dessous — pas
 * une position recalculée séparément. Les deux doivent donc lire la même
 * disposition et utiliser le même repère horizontal (mêmes `col`/`w`), pas
 * deux calculs qui pourraient diverger.
 */
import { hasNativeStorage, readNativeKeyboard } from "./nativeStorage";
import keyboardTemplate from "../../data/keyboard/default.json";

export const KEYBOARD_STORAGE_KEY = "op1-studio-grid-v1";
// Dimensions de la grille de construction — communes à tous les lecteurs de
// la disposition, pour que le repère de colonnes ne puisse jamais diverger
// entre l'écran Exercices et le clavier joué.
export const KEYBOARD_COLS = 64;
export const KEYBOARD_ROWS = 16;

// Mêmes tableaux que StudioMachinePanel : mappage note MIDI par position
// gauche→droite, partagé pour que l'écran Exercices assigne la même note à
// la même touche que le clavier joué en dessous.
//
// Recalé le 22 août 2026 sur le journal MIDI de la machine : la première
// touche physique est le message de relâchement `80 29 40 15`. Le premier
// octet est le statut note-off et `0x29` (41) est donc le numéro de note.
// Le clavier virtuel doit partir de cette note, sinon sa première touche
// joue F3/MIDI 53 alors que la machine joue F2/MIDI 41.
// Les deux tableaux gardent les intervalles naturels/altérés de cette octave
// de départ (B-C et E-F n'ont pas de touche noire entre elles).
export const OP1_FIRST_KEY_NOTE = 0x29;
export const KEYBOARD_WHITE_NOTES = [41,43,45,47,48,50,52,53,55,57,59,60,62,64];
export const KEYBOARD_BLACK_NOTES = [42,44,46,49,51,54,56,58,61,63];

export type KeyboardBlock = { col: number; row: number; w: number; h: number; color: string; type: string };

const DEFAULT_BLOCKS: KeyboardBlock[] = keyboardTemplate.validated as KeyboardBlock[];

function colorToType(color: string): string {
  if (color === "#DFD9FF") return "white";
  if (color === "#e8a020") return "black";
  if (color === "#698EFF") return "enc";
  if (color === "#00ED95") return "fn";
  if (color === "#FF3A5D") return "trans";
  return "white";
}

function readLocalStorageState(): { validated: KeyboardBlock[] } | null {
  try {
    if (typeof window === "undefined") return null;
    if (hasNativeStorage()) return null;
    const raw = localStorage.getItem(KEYBOARD_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.validated) {
      data.validated = data.validated.map((b: KeyboardBlock & { type?: string }) => ({
        ...b,
        type: b.type ?? colorToType(b.color),
      }));
    }
    return data;
  } catch { return null; }
}

/**
 * Charge la disposition sauvegardée (async car le coffre natif l'est aussi).
 * `null` de retour dans la fonction ne veut pas dire "vide" : voir
 * `DEFAULT_BLOCKS` pour le repli utilisé par les appelants.
 */
export async function loadKeyboardLayout(): Promise<KeyboardBlock[]> {
  if (hasNativeStorage()) {
    try {
      const raw = await readNativeKeyboard();
      if (!raw) return DEFAULT_BLOCKS;
      const parsed = JSON.parse(raw) as { validated?: KeyboardBlock[] };
      return parsed.validated ?? DEFAULT_BLOCKS;
    } catch { return DEFAULT_BLOCKS; }
  }
  const state = readLocalStorageState();
  return state ? state.validated : DEFAULT_BLOCKS;
}

/** Version synchrone pour l'état initial (avant hydratation), même logique que `StudioMachinePanel`/`KeyboardEditor`. */
export function loadKeyboardLayoutSync(): KeyboardBlock[] {
  if (hasNativeStorage()) return DEFAULT_BLOCKS; // le coffre natif est toujours async
  const state = readLocalStorageState();
  return state ? state.validated : DEFAULT_BLOCKS;
}

export type SortedKeyBlocks = {
  white: KeyboardBlock[];
  black: KeyboardBlock[];
  enc: KeyboardBlock[];
  fn: KeyboardBlock[];
  trans: KeyboardBlock[];
};

/** Trie chaque famille de blocs par position x — même ordre que le mappage MIDI gauche→droite. */
export function sortKeyBlocks(validated: KeyboardBlock[]): SortedKeyBlocks {
  const byCol = (a: KeyboardBlock, b: KeyboardBlock) => a.col - b.col;
  return {
    white: validated.filter((b) => b.type === "white").sort(byCol),
    black: validated.filter((b) => b.type === "black").sort(byCol),
    enc: validated.filter((b) => b.type === "enc").sort(byCol),
    fn: validated.filter((b) => b.type === "fn").sort(byCol),
    trans: validated.filter((b) => b.type === "trans").sort(byCol),
  };
}

export type LayoutBounds = { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; viewBox: string };

/** Même calcul de cadrage que `StudioMachinePanel` : la disposition utilise toute la largeur dispo sans changer les blocs sauvegardés. */
export function layoutBounds(validated: KeyboardBlock[], cols: number, rows: number): LayoutBounds {
  const minX = validated.length ? Math.max(0, Math.min(...validated.map((b) => b.col)) - 1) : 0;
  const maxX = validated.length ? Math.min(cols, Math.max(...validated.map((b) => b.col + b.w)) + 1) : cols;
  const minY = validated.length ? Math.max(0, Math.min(...validated.map((b) => b.row)) - 1) : 0;
  const maxY = validated.length ? Math.min(rows, Math.max(...validated.map((b) => b.row + b.h)) + 1) : rows;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { minX, maxX, minY, maxY, width, height, viewBox: `${minX} ${minY} ${width} ${height}` };
}
