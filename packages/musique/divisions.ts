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

/**
 * Longueur de note, en pourcentage du pas.
 *
 * Sans ce réglage, une note court jusqu'au pas suivant : les pas sont liés, et
 * tout se joue legato. C'est le comportement d'origine, et il reste celui de
 * 100 %.
 */
export const GATE_MIN = 10;
export const GATE_MAX = 100;
export const GATE_DEFAUT = GATE_MAX;

/**
 * Durée minimale d'une note, en millisecondes.
 *
 * En dessous, une machine n'a pas le temps de faire sonner quoi que ce soit :
 * la note-off arrive dans la même bouffée MIDI que la note-on, et on entend un
 * clic ou rien du tout. À 200 BPM en 1/32, un pas fait déjà 37 ms — un gate de
 * 10 % y demanderait 3,7 ms.
 */
export const NOTE_MIN_MS = 15;

/**
 * Quand couper la note, en millisecondes après son départ — ou `null` si elle
 * doit tenir jusqu'au pas suivant.
 *
 * **`null` n'est pas un cas d'erreur, c'est le cas normal à 100 %.** Il dit à
 * l'appelant de ne programmer AUCUNE seconde minuterie : la note sera coupée
 * par le pas suivant, comme depuis toujours. C'est ce qui garantit qu'un gate
 * à fond se comporte exactement comme avant le réglage — pas « presque comme
 * avant, à une minuterie près ».
 *
 * `null` revient aussi quand la coupure calculée atteindrait le pas suivant :
 * programmer une note-off au moment même où la note-on suivante part, c'est
 * une course dont l'issue dépend de l'ordonnanceur. Elle couperait parfois la
 * note NEUVE.
 */
export function coupureGateMs(dureePasMs: number, gatePourcent: number): number | null {
  if (!Number.isFinite(dureePasMs) || dureePasMs <= 0) return null;
  if (!Number.isFinite(gatePourcent)) return null;

  const gate = Math.max(GATE_MIN, Math.min(GATE_MAX, gatePourcent));
  if (gate >= GATE_MAX) return null;

  const coupure = Math.max(NOTE_MIN_MS, (dureePasMs * gate) / 100);
  // La coupure rejoint le pas suivant : rien à gagner, et une course à perdre.
  return coupure >= dureePasMs ? null : coupure;
}
