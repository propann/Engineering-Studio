/**
 * Conversion tempo → durées, pour caler le rack sur le studio qui l'héberge.
 *
 * Le rack n'a pas de transport : ni lecture, ni arrêt, ni curseur. Il n'y a
 * donc rien à « démarrer avec le studio ». Ce qui dépend réellement du tempo,
 * c'est le temps de delay et la vitesse d'arpège — et un delay qui retombe
 * juste sur le tempo est audible immédiatement, contrairement à un transport
 * qu'on n'a pas.
 */

/** Divisions musicales, en fraction de ronde. */
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

/** Ordre d'affichage, du plus long au plus court. Les objets ne le garantissent pas. */
export const ORDRE_DIVISIONS: Division[] = [
  "1/1", "1/2", "1/4", "1/4.", "1/4T", "1/8", "1/8.", "1/8T", "1/16", "1/16T",
];

/** Bornes du curseur TEMPS du rack (AudioPluginRack.tsx:2897). */
export const DELAY_MIN_MS = 20;
export const DELAY_MAX_MS = 1200;

/**
 * Durée d'une division, en millisecondes.
 *
 * Une noire dure 60000/bpm ms ; une ronde en vaut quatre. Le résultat est
 * borné aux limites du curseur : à 60 BPM une ronde ferait 4000 ms, que le
 * nœud de delay refuserait au-delà de 2 s (`:1731` borne déjà à 2).
 */
export function dureeDivisionMs(bpm: number, division: Division): number {
  const tempoSain = Math.max(20, Math.min(300, bpm));
  const ms = (60000 / tempoSain) * 4 * DIVISIONS[division];
  return Math.round(Math.max(DELAY_MIN_MS, Math.min(DELAY_MAX_MS, ms)));
}

/**
 * Vitesse d'arpège en pas par seconde, pour `plArpSpeed`.
 *
 * Le paramètre est un entier (curseur pas de 1) : arrondir ici évite que
 * l'appelant croie à une précision que le rack ne conserve pas.
 */
export function vitesseArpege(bpm: number, division: Division): number {
  const ms = (60000 / Math.max(20, Math.min(300, bpm))) * 4 * DIVISIONS[division];
  return Math.max(1, Math.min(30, Math.round(1000 / ms)));
}
