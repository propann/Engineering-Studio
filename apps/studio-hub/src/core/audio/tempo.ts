/**
 * Bornes du délai, et conversions tempo → durée pour le rack d'effets.
 *
 * Les divisions elles-mêmes vivent dans `@studio-hub/musique` : c'est de la
 * théorie musicale, et le rack MIDI s'en sert aussi. Ce qui reste ici est
 * propre au nœud de délai — ses limites à lui, pas de la musique.
 */
export { DIVISIONS, ORDRE_DIVISIONS, bpmSain, dureeMs, type Division } from "@studio-hub/musique";
import { DIVISIONS, dureeMs, type Division } from "@studio-hub/musique";

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
    const ms = dureeMs(bpm, division);
  return Math.round(Math.max(DELAY_MIN_MS, Math.min(DELAY_MAX_MS, ms)));
}

/**
 * Vitesse d'arpège en pas par seconde, pour `plArpSpeed`.
 *
 * Le paramètre est un entier (curseur pas de 1) : arrondir ici évite que
 * l'appelant croie à une précision que le rack ne conserve pas.
 */
export function vitesseArpege(bpm: number, division: Division): number {
  const ms = dureeMs(bpm, division);
  return Math.max(1, Math.min(30, Math.round(1000 / ms)));
}
