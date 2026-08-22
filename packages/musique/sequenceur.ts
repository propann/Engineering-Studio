import { GAMMES, type Gamme } from "./gammes";
import { NOTE_MAX, NOTE_MIN, quantifier } from "./arpege";

/**
 * Séquenceur pas à pas — module 6.
 *
 * Dans le rack MIDI, pour la même raison que l'arpégiateur : il **produit des
 * notes**. Posé dans le rack de moteurs il ne jouerait que lui ; d'ici il
 * atteint tout ce qui écoute — le rack, l'OP-1, l'EP-133, et n'importe quelle
 * machine branchée.
 *
 * Tout est pur : aucune horloge, aucun envoi, aucun état. C'est le panneau qui
 * possède le tempo et les sorties.
 *
 * Différence avec l'arpégiateur, et c'est ce qui justifie les deux : l'arpège
 * déroule ce qu'on **tient**, la séquence joue ce qu'on a **écrit**. L'un suit
 * les doigts, l'autre tourne tout seul.
 */

/** Un pas. `note: null` = silence — un pas vide n'est pas un pas à zéro. */
export type Pas = {
  note: number | null;
  velocite: number;
  /** Le pas est-il joué ? Éteindre garde la note écrite, contrairement au silence. */
  actif: boolean;
};

export const PAS_MIN = 1;
export const PAS_MAX = 32;
export const VELOCITE_DEFAUT = 100;

/** Une séquence vide de `longueur` pas. */
export function sequenceVide(longueur: number): Pas[] {
  const n = Math.max(PAS_MIN, Math.min(PAS_MAX, Math.floor(longueur) || PAS_MIN));
  return Array.from({ length: n }, () => ({ note: null, velocite: VELOCITE_DEFAUT, actif: true }));
}

/**
 * Redimensionne sans perdre ce qui a été écrit.
 *
 * Raccourcir puis rallonger doit rendre les pas d'origine : quelqu'un qui
 * passe de 16 à 8 pour essayer, puis revient, ne doit pas retrouver une
 * séquence vide. Les pas au-delà de la longueur sont donc **conservés** par
 * l'appelant — cette fonction ne fait que compléter.
 */
export function redimensionner(sequence: Pas[], longueur: number): Pas[] {
  const n = Math.max(PAS_MIN, Math.min(PAS_MAX, Math.floor(longueur) || PAS_MIN));
  if (sequence.length >= n) return sequence.slice(0, n);
  return [...sequence, ...sequenceVide(n - sequence.length)];
}

export type Direction = "avant" | "arriere" | "aller-retour" | "aleatoire";

export const ORDRE_DIRECTIONS: Direction[] = ["avant", "arriere", "aller-retour", "aleatoire"];
export const NOMS_DIRECTIONS: Record<Direction, string> = {
  avant: "→ Avant",
  arriere: "← Arrière",
  "aller-retour": "↔ Aller-retour",
  aleatoire: "⚄ Aléatoire",
};

/**
 * Index du pas à jouer au tour `compteur`.
 *
 * Aller-retour fait 2n−2 pas et non 2n : sans cela les extrémités sonnent deux
 * fois de suite. Même règle que l'arpégiateur, pour la même raison.
 */
export function indexDuPas(
  longueur: number,
  direction: Direction,
  compteur: number,
  tirage: () => number = Math.random
): number {
  const n = Math.max(1, Math.floor(longueur));
  if (n === 1) return 0;
  const mod = (a: number, m: number) => ((a % m) + m) % m;
  const i = Math.floor(compteur);

  switch (direction) {
    case "avant":
      return mod(i, n);
    case "arriere":
      return n - 1 - mod(i, n);
    case "aller-retour": {
      const cycle = 2 * n - 2;
      const j = mod(i, cycle);
      return j < n ? j : cycle - j;
    }
    case "aleatoire":
      return Math.min(n - 1, Math.max(0, Math.floor(tirage() * n)));
  }
}

/**
 * Ce qu'il faut jouer à ce tour, ou `null` si rien.
 *
 * Rend `null` pour un pas éteint comme pour un silence : l'appelant n'a alors
 * rien à envoyer. Distinguer les deux ici obligerait chaque appelant à traiter
 * un cas de plus sans jamais s'en servir.
 */
export function pasAJouer(
  sequence: Pas[],
  direction: Direction,
  compteur: number,
  gamme: Gamme,
  tonique: number,
  tirage: () => number = Math.random
): { note: number; velocite: number } | null {
  if (!sequence.length) return null;
  const pas = sequence[indexDuPas(sequence.length, direction, compteur, tirage)];
  if (!pas || !pas.actif || pas.note === null) return null;
  if (!Number.isFinite(pas.note)) return null;

  const note = quantifier(pas.note, tonique, gamme);
  const velocite = Number.isFinite(pas.velocite)
    ? Math.max(1, Math.min(127, Math.round(pas.velocite)))
    : VELOCITE_DEFAUT;
  return { note, velocite };
}

/**
 * Transpose une séquence entière, en gardant les silences.
 *
 * Les notes sont bornées à la plage MIDI plutôt que repliées : transposer très
 * haut doit tasser la mélodie contre le plafond, pas la faire réapparaître
 * trois octaves plus bas.
 */
export function transposer(sequence: Pas[], demiTons: number): Pas[] {
  if (!Number.isFinite(demiTons)) return sequence;
  const d = Math.round(demiTons);
  return sequence.map((pas) =>
    pas.note === null
      ? pas
      : { ...pas, note: Math.max(NOTE_MIN, Math.min(NOTE_MAX, pas.note + d)) }
  );
}

/**
 * Écrit une note dans un pas, en respectant la gamme choisie.
 *
 * La quantification se fait à l'écriture ET à la lecture : à l'écriture pour
 * que l'utilisateur voie tout de suite la note réellement retenue, à la
 * lecture parce que changer de gamme après coup doit s'entendre.
 */
export function ecrirePas(
  sequence: Pas[],
  index: number,
  note: number | null,
  gamme: Gamme,
  tonique: number
): Pas[] {
  if (index < 0 || index >= sequence.length) return sequence;
  const suite = [...sequence];
  suite[index] = {
    ...suite[index],
    note: note === null || !Number.isFinite(note) ? null : quantifier(note, tonique, gamme),
  };
  return suite;
}

/** Allume ou éteint un pas, sans toucher à la note écrite. */
export function basculerPas(sequence: Pas[], index: number): Pas[] {
  if (index < 0 || index >= sequence.length) return sequence;
  const suite = [...sequence];
  suite[index] = { ...suite[index], actif: !suite[index].actif };
  return suite;
}

/**
 * Remplit la séquence au hasard, dans la gamme.
 *
 * Un pas sur `densite` reste silencieux : une séquence pleine sonne comme une
 * gamme montée au hasard, pas comme une phrase.
 */
export function remplirAuHasard(
  longueur: number,
  gamme: Gamme,
  tonique: number,
  densite = 0.7,
  tirage: () => number = Math.random
): Pas[] {
  const degres = GAMMES[gamme];
  return sequenceVide(longueur).map(() => {
    if (tirage() > Math.max(0, Math.min(1, densite))) {
      return { note: null, velocite: VELOCITE_DEFAUT, actif: true };
    }
    const degre = degres[Math.min(degres.length - 1, Math.floor(tirage() * degres.length))];
    const octave = Math.floor(tirage() * 2) * 12;
    return {
      note: Math.max(NOTE_MIN, Math.min(NOTE_MAX, tonique + degre + octave)),
      velocite: VELOCITE_DEFAUT,
      actif: true,
    };
  });
}
