import { bpmSain, dureeMs, type Division } from "@studio-hub/musique";

/**
 * LFO global — module 7.
 *
 * Plusieurs moteurs ont déjà leur LFO interne (Helm balaie son filtre, Rings
 * fait vibrer ses oscillateurs). Celui-ci est différent : il s'applique à
 * **toutes** les voix, quel que soit le moteur, et se cale sur le tempo de
 * l'hôte comme le délai.
 *
 * Deux cibles, parce qu'elles couvrent l'essentiel de ce qu'on attend d'un
 * LFO et qu'elles s'atteignent sans toucher aux quinze moteurs :
 *
 * - **trémolo** — module le gain, juste avant l'enveloppe ;
 * - **filtre** — balaie un passe-bas inséré dans la chaîne de voix.
 *
 * Le vibrato manque volontairement : la hauteur est produite dans chaque
 * moteur, il faudrait les modifier tous les quinze. Un LFO de hauteur mal posé
 * ne moduleraient que certains d'entre eux, ce qui est pire que rien.
 */

export type CibleLfo = "aucun" | "tremolo" | "filtre";
export type FormeLfo = "sine" | "triangle" | "square" | "sawtooth";

export type ParamsLfo = {
  lfoCible: CibleLfo;
  lfoForme: FormeLfo;
  /** Hz ×10 — le curseur est un entier. Ignoré si `lfoSync`. */
  lfoRate: number;
  lfoDepth: number;    // %
  lfoSync: boolean;
  lfoDivision: Division;
};

export const LFO_DEFAUT: ParamsLfo = {
  lfoCible: "aucun",
  lfoForme: "sine",
  lfoRate: 35,
  lfoDepth: 50,
  lfoSync: false,
  lfoDivision: "1/4",
};

export const ORDRE_CIBLES: CibleLfo[] = ["aucun", "tremolo", "filtre"];
export const NOMS_CIBLES: Record<CibleLfo, string> = {
  aucun: "— Aucun —",
  tremolo: "Trémolo (volume)",
  filtre: "Filtre (balayage)",
};

export const ORDRE_FORMES: FormeLfo[] = ["sine", "triangle", "square", "sawtooth"];
export const NOMS_FORMES: Record<FormeLfo, string> = {
  sine: "∿ Sinus",
  triangle: "△ Triangle",
  square: "⊓ Carré",
  sawtooth: "◺ Dent de scie",
};

/** Bornes de vitesse. En dessous on n'entend plus de mouvement, au-dessus ce n'est plus une modulation. */
export const LFO_HZ_MIN = 0.05;
export const LFO_HZ_MAX = 20;

/** Fréquence centrale du filtre balayé, et la bande qu'il parcourt. */
export const FILTRE_CENTRE_HZ = 1200;
export const FILTRE_MIN_HZ = 80;

/**
 * Vitesse du LFO en Hz.
 *
 * Calée sur le tempo quand `lfoSync` : c'est la même notion de division que
 * le délai et l'arpège, et elle vient du même endroit — une seconde table
 * divergerait à la première division ajoutée.
 */
export function vitesseLfoHz(p: ParamsLfo, bpm: number): number {
  if (p.lfoSync) {
    const ms = dureeMs(bpmSain(bpm), p.lfoDivision);
    // Un cycle par division : 1000 / durée. Une noire à 120 donne 2 Hz.
    return Math.max(LFO_HZ_MIN, Math.min(LFO_HZ_MAX, 1000 / ms));
  }
  if (!Number.isFinite(p.lfoRate)) return LFO_HZ_MIN;
  return Math.max(LFO_HZ_MIN, Math.min(LFO_HZ_MAX, p.lfoRate / 10));
}

/**
 * Profondeur du trémolo, en variation de gain autour de sa valeur.
 *
 * Bornée à 0,45 et non à 1 : le LFO **ajoute** au gain, qui vaut au plus 1.
 * Une profondeur de 1 ferait descendre le gain sous zéro à chaque creux, et un
 * gain négatif n'atténue pas — il **inverse la phase**. Sur une superposition
 * de patches, deux voix en opposition s'annulent : le son disparaît par
 * intermittence sans qu'aucune erreur ne soit levée.
 */
export function profondeurTremolo(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.max(0, Math.min(100, pourcent)) / 100 * 0.45;
}

/**
 * Amplitude du balayage de filtre, en Hz.
 *
 * Bornée pour que le creux reste au-dessus de `FILTRE_MIN_HZ` : un filtre
 * balayé jusqu'à zéro coupe tout, et l'oreille entend un trou, pas un
 * balayage.
 */
export function amplitudeFiltre(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  const dose = Math.max(0, Math.min(100, pourcent)) / 100;
  return dose * (FILTRE_CENTRE_HZ - FILTRE_MIN_HZ);
}

/** Le LFO a-t-il un effet ? Sert à éviter de construire des nœuds pour rien. */
export function lfoActif(p: ParamsLfo): boolean {
  return p.lfoCible !== "aucun" && Number.isFinite(p.lfoDepth) && p.lfoDepth > 0;
}
