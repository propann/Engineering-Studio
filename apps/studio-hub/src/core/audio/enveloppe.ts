/**
 * Enveloppe ADSR — résolution des réglages en durées.
 *
 * L'enveloppe existait, câblée en dur : `ATTACK = 0.008` et trois sœurs, sans
 * aucun moyen d'y toucher. C'est elle qui supprime les clics — avant elle, le
 * gain restait constant puis l'oscillateur s'arrêtait net.
 *
 * Les bornes ci-dessous ne sont pas de la prudence décorative. Les rampes sont
 * **exponentielles**, et `exponentialRampToValueAtTime` rejette zéro : un
 * curseur de maintien à 0 % lèverait, et une attaque ou un relâchement nuls
 * ramèneraient le clic que l'enveloppe existe pour supprimer.
 */

export type ParamsEnveloppe = {
  envAttack: number;   // ms
  envDecay: number;    // ms
  envSustain: number;  // %
  envRelease: number;  // ms
};

/** Valeurs d'origine, câblées jusqu'ici. Elles restent les défauts. */
export const ENVELOPPE_DEFAUT: ParamsEnveloppe = {
  envAttack: 8,
  envDecay: 120,
  envSustain: 75,
  envRelease: 220,
};

/**
 * Plancher des rampes exponentielles.
 *
 * `exponentialRampToValueAtTime(0)` lève. 0,0001 est à −80 dB : inaudible,
 * mais strictement positif.
 */
export const PLANCHER = 0.0001;

/** Durée minimale d'une rampe, en secondes. Plus court s'entend comme un clic. */
export const RAMPE_MIN_SEC = 0.001;

export const BORNES = {
  attaqueMaxMs: 2000,
  declinMaxMs: 2000,
  relachementMaxMs: 4000,
} as const;

export type Enveloppe = {
  ATTACK: number;   // s
  DECAY: number;    // s
  SUSTAIN: number;  // proportion, jamais 0
  RELEASE: number;  // s
};

/**
 * Convertit les réglages en durées utilisables par les rampes.
 *
 * Toujours des valeurs sûres : un réglage aberrant — venu d'un patch corrompu
 * ou d'un import — donne le défaut plutôt qu'une exception au premier appui
 * sur une touche.
 */
export function resoudreEnveloppe(p: Partial<ParamsEnveloppe>): Enveloppe {
  const ms = (valeur: number | undefined, defaut: number, max: number) => {
    if (valeur === undefined || !Number.isFinite(valeur)) return defaut / 1000;
    return Math.max(RAMPE_MIN_SEC, Math.min(max, valeur) / 1000);
  };

  const maintien = Number.isFinite(p.envSustain as number)
    ? Math.max(0, Math.min(100, p.envSustain as number)) / 100
    : ENVELOPPE_DEFAUT.envSustain / 100;

  return {
    ATTACK: ms(p.envAttack, ENVELOPPE_DEFAUT.envAttack, BORNES.attaqueMaxMs),
    DECAY: ms(p.envDecay, ENVELOPPE_DEFAUT.envDecay, BORNES.declinMaxMs),
    // Le maintien passe par le plancher et non par un `Math.max(0, ...)` :
    // c'est la cible d'une rampe exponentielle, pas une durée.
    SUSTAIN: Math.max(PLANCHER, maintien),
    RELEASE: ms(p.envRelease, ENVELOPPE_DEFAUT.envRelease, BORNES.relachementMaxMs),
  };
}

/**
 * Durée totale de la partie tenue, pour dimensionner un rendu hors ligne.
 *
 * Le relâchement n'en fait pas partie : il démarre quand la note s'arrête, pas
 * après le déclin.
 */
export function dureeAttaqueDeclin(e: Enveloppe): number {
  return e.ATTACK + e.DECAY;
}
