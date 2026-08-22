/**
 * Divisions musicales et durées.
 *
 * Théorie musicale pure, donc dans ce paquet : les deux racks s'en servent —
 * le rack d'effets pour caler son délai, le rack MIDI pour la vitesse
 * d'arpège. Une seconde liste ailleurs divergerait à la première division
 * ajoutée.
 *
 * Le bornage propre au nœud de délai reste côté rack
 * (`core/audio/tempo.ts`) : ce sont ses limites à lui, pas de la musique.
 */

/** Fraction de ronde. */
export const DIVISIONS = {
  "1/1": 1,
  "1/2": 1 / 2,
  "1/4": 1 / 4,
  "1/4.": (1 / 4) * 1.5,
  "1/4T": (1 / 4) * (2 / 3),
  "1/8": 1 / 8,
  "1/8.": (1 / 8) * 1.5,
  "1/8T": (1 / 8) * (2 / 3),
  "1/16": 1 / 16,
  "1/16T": (1 / 16) * (2 / 3),
} as const;

export type Division = keyof typeof DIVISIONS;

/**
 * Ordre d'affichage, groupé par valeur de base.
 *
 * Convention des séquenceurs : 1/4, 1/4., 1/4T se suivent, même si la pointée
 * (750 ms à 120) est plus longue que la 1/2 n'est courte. Un tri strictement
 * décroissant mélangerait les familles et rendrait le menu illisible.
 */
export const ORDRE_DIVISIONS: Division[] = [
  "1/1", "1/2", "1/4", "1/4.", "1/4T", "1/8", "1/8.", "1/8T", "1/16", "1/16T",
];

/** Tempo ramené à une plage jouable. Le BPM peut venir d'une autre fenêtre. */
export function bpmSain(bpm: number): number {
  if (!Number.isFinite(bpm)) return 120;
  return Math.max(20, Math.min(300, bpm));
}

/** Durée d'une division, en millisecondes, sans bornage. */
export function dureeMs(bpm: number, division: Division): number {
  return (60000 / bpmSain(bpm)) * 4 * DIVISIONS[division];
}
