/**
 * La courbe de réponse de l'égaliseur, calculée — pas mesurée.
 *
 * Le rack dessine ce que l'égaliseur fait au son. Deux façons de l'obtenir :
 * demander sa réponse à un `BiquadFilterNode` vivant via
 * `getFrequencyResponse`, ou la calculer. C'est la seconde qui est retenue.
 *
 * `getFrequencyResponse` exige un `AudioContext`, donc un navigateur, donc un
 * contexte ouvert avant même de pouvoir tracer un axe — et rend le calcul
 * intestable hors d'un navigateur. Les coefficients d'un biquad sont publics
 * et tiennent en quinze lignes : les écrire ici donne une fonction pure, que
 * les tests vérifient sur ses valeurs exactes.
 *
 * **Les mêmes bandes que le son.** `BANDES_EQ` est lue ici et par
 * `construireEffets`. C'est la condition pour que la courbe affichée soit
 * celle qu'on entend : deux tables divergeraient sans que rien ne le signale,
 * chacune restant cohérente de son côté.
 *
 * Les formules sont celles de l'Audio EQ Cookbook (Robert Bristow-Johnson),
 * que la spécification Web Audio reprend telles quelles pour `BiquadFilterNode`.
 */
import { BANDES_EQ, type BandeEq, type ParamsEffets } from "./effets";

/** Les cinq coefficients d'un biquad, déjà normalisés par a0. */
type Coefficients = { b0: number; b1: number; b2: number; a1: number; a2: number };

/**
 * Coefficients d'une bande, à une fréquence d'échantillonnage donnée.
 *
 * `gainDb` à 0 donne l'identité — b0 = 1, tout le reste à 0 — quelle que soit
 * la bande. C'est ce qui rend la courbe plate au repos sans cas particulier.
 */
function coefficients(bande: BandeEq, gainDb: number, echantillonnage: number): Coefficients {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * bande.frequence) / echantillonnage;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);

  if (bande.type === "peaking") {
    // La cloche est la seule à écouter Q.
    const alpha = sin / (2 * (bande.q ?? 1));
    const a0 = 1 + alpha / A;
    return {
      b0: (1 + alpha * A) / a0,
      b1: (-2 * cos) / a0,
      b2: (1 - alpha * A) / a0,
      a1: (-2 * cos) / a0,
      a2: (1 - alpha / A) / a0,
    };
  }

  // Plateaux : Web Audio ignore Q et impose la pente S = 1, ce qui réduit
  // alpha à sin(w0)/2 × √2. Le préciser ici évite de croire que Q agirait.
  const alpha = (sin / 2) * Math.SQRT2;
  const deuxRacineAalpha = 2 * Math.sqrt(A) * alpha;

  if (bande.type === "lowshelf") {
    const a0 = A + 1 + (A - 1) * cos + deuxRacineAalpha;
    return {
      b0: (A * (A + 1 - (A - 1) * cos + deuxRacineAalpha)) / a0,
      b1: (2 * A * (A - 1 - (A + 1) * cos)) / a0,
      b2: (A * (A + 1 - (A - 1) * cos - deuxRacineAalpha)) / a0,
      a1: (-2 * (A - 1 + (A + 1) * cos)) / a0,
      a2: (A + 1 + (A - 1) * cos - deuxRacineAalpha) / a0,
    };
  }

  const a0 = A + 1 - (A - 1) * cos + deuxRacineAalpha;
  return {
    b0: (A * (A + 1 + (A - 1) * cos + deuxRacineAalpha)) / a0,
    b1: (-2 * A * (A - 1 + (A + 1) * cos)) / a0,
    b2: (A * (A + 1 + (A - 1) * cos - deuxRacineAalpha)) / a0,
    a1: (2 * (A - 1 - (A + 1) * cos)) / a0,
    a2: (A + 1 - (A - 1) * cos - deuxRacineAalpha) / a0,
  };
}

/**
 * Module de la réponse d'un biquad à une fréquence, en linéaire.
 *
 * |H(e^jw)| = |b0 + b1·e^-jw + b2·e^-2jw| / |1 + a1·e^-jw + a2·e^-2jw|.
 * Les deux modules se calculent sur leurs parties réelle et imaginaire.
 */
function moduleA(c: Coefficients, w: number): number {
  const cos1 = Math.cos(w), sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w), sin2 = Math.sin(2 * w);

  const numRe = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const numIm = -(c.b1 * sin1 + c.b2 * sin2);
  const denRe = 1 + c.a1 * cos1 + c.a2 * cos2;
  const denIm = -(c.a1 * sin1 + c.a2 * sin2);

  const den = Math.hypot(denRe, denIm);
  // Un dénominateur nul signifierait un pôle sur le cercle unité : impossible
  // pour ces trois types à gain fini, mais un NaN silencieux casserait le tracé.
  if (den === 0) return 0;
  return Math.hypot(numRe, numIm) / den;
}

/**
 * Réponse de l'égaliseur complet à une fréquence, en dB.
 *
 * Les trois bandes sont en série : leurs modules se multiplient, donc leurs
 * décibels s'additionnent.
 */
export function reponseEqDb(
  params: Pick<ParamsEffets, "fxEqLow" | "fxEqMid" | "fxEqHigh">,
  frequence: number,
  echantillonnage = 44100,
): number {
  const w = (2 * Math.PI * frequence) / echantillonnage;
  let db = 0;
  for (const bande of BANDES_EQ) {
    db += 20 * Math.log10(moduleA(coefficients(bande, params[bande.reglage], echantillonnage), w));
  }
  return db;
}

/**
 * La courbe entière, échantillonnée logarithmiquement.
 *
 * L'oreille entend les fréquences en octaves : un pas linéaire donnerait
 * quelques points sous 1 kHz — là où vivent les graves et la cloche — et des
 * centaines au-dessus de 10 kHz, où la courbe ne bouge plus.
 */
export function courbeEq(
  params: Pick<ParamsEffets, "fxEqLow" | "fxEqMid" | "fxEqHigh">,
  points = 160,
  minHz = 20,
  maxHz = 20000,
  echantillonnage = 44100,
): Array<{ frequence: number; db: number }> {
  const rapport = Math.log(maxHz / minHz);
  return Array.from({ length: points }, (_, i) => {
    const frequence = minHz * Math.exp((rapport * i) / (points - 1));
    return { frequence, db: reponseEqDb(params, frequence, echantillonnage) };
  });
}
