import { attachLfo, buildSaturationCurve } from "@studio-hub/core/audio/dsp";

/**
 * Le rack d'effets — tout ce qui **traite** le son.
 *
 * Trois racks, trois métiers : le rack MIDI produit les notes, le rack de
 * moteurs en fait du son, celui-ci le traite. La chaîne vivait au milieu des
 * 3900 lignes du rack de moteurs, ce qui rendait la séparation invisible dans
 * le code — elle n'existait que dans l'interface.
 *
 * Elle ne connaît ni les moteurs, ni les patches, ni React : un contexte, des
 * réglages, un couple entrée/sortie. C'est ce qui la rend réutilisable, et
 * c'est aussi ce qui la rend testable.
 *
 * Ordre de la chaîne : **saturation → égaliseur → chorus → délai**. C'est
 * l'ordre d'un pédalier, et il n'est pas arbitraire — égaliser après la
 * saturation permet de dompter les aigus qu'elle crée ; l'inverse égaliserait
 * un signal que la saturation écraserait ensuite.
 */

export type ParamsEffets = {
  fxDriveMix: number;      // %
  fxDriveAmount: number;   // %
  fxDriveMode: "soft" | "fold";
  fxEqLow: number;         // dB
  fxEqMid: number;         // dB
  fxEqHigh: number;        // dB
  fxChorusMix: number;     // %
  fxChorusRate: number;    // Hz ×10 (curseur entier)
  fxChorusDepth: number;   // millièmes de seconde
  fxDelayMix: number;      // %
  fxDelayTime: number;     // ms
  fxDelayFeedback: number; // %
};

/** Plafond de réinjection. Au-delà, la boucle diverge et sature indéfiniment. */
export const REINJECTION_MAX = 0.85;

/** Amortissement de la boucle de délai, en Hz. */
export const AMORTI_HZ = 4800;

/** Un pourcentage de curseur en proportion [0,1]. */
export function melange(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.max(0, Math.min(100, pourcent)) / 100;
}

/**
 * Réinjection du délai, bornée.
 *
 * Un curseur à 100 % ne doit pas pouvoir produire un larsen : c'est une
 * garantie, pas un réglage.
 */
export function reinjection(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.min(REINJECTION_MAX, Math.max(0, pourcent / 100));
}

/**
 * Temps de délai en secondes, borné à ce que le nœud accepte.
 *
 * `createDelay(2)` fixe le maximum : une valeur au-delà serait silencieusement
 * ramenée, et l'affichage mentirait sur ce qu'on entend.
 */
export function tempsRetardSec(ms: number): number {
  if (!Number.isFinite(ms)) return 0.01;
  return Math.max(0.01, Math.min(2, ms / 1000));
}

/**
 * Profondeur de chorus en secondes.
 *
 * Bornée sous le délai de base : une modulation plus profonde que le retard
 * central rendrait le temps de délai négatif, ce que le nœud refuse en
 * revenant à zéro — un chorus qui se tait par intermittence.
 */
export const CHORUS_BASE_SEC = 0.012;

export function profondeurChorusSec(millisecondes: number): number {
  if (!Number.isFinite(millisecondes)) return 0;
  return Math.max(0, Math.min(CHORUS_BASE_SEC * 0.9, millisecondes / 1000));
}

/** Vitesse de chorus en Hz. Le curseur est un entier, d'où le facteur 10. */
export function vitesseChorusHz(valeurCurseur: number): number {
  if (!Number.isFinite(valeurCurseur)) return 0.1;
  return Math.max(0.1, Math.min(8, valeurCurseur / 10));
}

/**
 * Construit la chaîne. Ne se raccorde à rien : l'appelant branche `entree` et
 * `sortie` où il veut — bus principal en direct, ou contexte hors-ligne pour
 * fabriquer un échantillon. C'est ce qui garantit qu'un sample porte
 * exactement les effets qu'on entend.
 */
export function construireChaineEffets(
  ctx: BaseAudioContext,
  p: ParamsEffets,
  now: number
): { entree: AudioNode; sortie: AudioNode } {
  const entree = ctx.createGain();
  const sortie = ctx.createGain();

  // ── Saturation ────────────────────────────────────────────────────────
  // Voie directe toujours ouverte ; seule la voie saturée est dosée. Un
  // mélange à 0 laisse donc passer le signal intact.
  let tete: AudioNode = entree;
  const doseDrive = melange(p.fxDriveMix);
  if (doseDrive > 0 && p.fxDriveAmount > 0) {
    const forme = ctx.createWaveShaper();
    forme.curve = buildSaturationCurve(p.fxDriveAmount, p.fxDriveMode);
    forme.oversample = "2x";

    const sature = ctx.createGain();
    sature.gain.setValueAtTime(doseDrive, now);
    const direct = ctx.createGain();
    direct.gain.setValueAtTime(1 - doseDrive, now);

    const somme = ctx.createGain();
    entree.connect(forme);
    forme.connect(sature);
    sature.connect(somme);
    entree.connect(direct);
    direct.connect(somme);
    tete = somme;
  }

  // ── Égaliseur trois bandes ────────────────────────────────────────────
  // Un gain à 0 dB laisse passer sans rien changer : inutile de conditionner
  // la construction, le coût d'un filtre neutre est négligeable et le graphe
  // reste le même dans tous les cas.
  const grave = ctx.createBiquadFilter();
  grave.type = "lowshelf";
  grave.frequency.setValueAtTime(220, now);
  grave.gain.setValueAtTime(p.fxEqLow, now);

  const medium = ctx.createBiquadFilter();
  medium.type = "peaking";
  medium.frequency.setValueAtTime(1200, now);
  medium.Q.setValueAtTime(0.9, now);
  medium.gain.setValueAtTime(p.fxEqMid, now);

  const aigu = ctx.createBiquadFilter();
  aigu.type = "highshelf";
  aigu.frequency.setValueAtTime(5200, now);
  aigu.gain.setValueAtTime(p.fxEqHigh, now);

  tete.connect(grave);
  grave.connect(medium);
  medium.connect(aigu);
  let courant: AudioNode = aigu;

  // ── Chorus ────────────────────────────────────────────────────────────
  const doseChorus = melange(p.fxChorusMix);
  if (doseChorus > 0) {
    const retardMod = ctx.createDelay(0.1);
    retardMod.delayTime.setValueAtTime(CHORUS_BASE_SEC, now);
    attachLfo(ctx, retardMod.delayTime, vitesseChorusHz(p.fxChorusRate), profondeurChorusSec(p.fxChorusDepth), now);

    const dose = ctx.createGain();
    dose.gain.setValueAtTime(doseChorus, now);
    const somme = ctx.createGain();

    courant.connect(retardMod);
    retardMod.connect(dose);
    dose.connect(somme);
    courant.connect(somme);
    courant = somme;
  }

  // ── Délai ─────────────────────────────────────────────────────────────
  // La voie directe passe toujours ; seule la voie retardée est dosée.
  courant.connect(sortie);

  const doseDelai = melange(p.fxDelayMix);
  if (doseDelai > 0) {
    const retard = ctx.createDelay(2);
    retard.delayTime.setValueAtTime(tempsRetardSec(p.fxDelayTime), now);

    const retour = ctx.createGain();
    retour.gain.setValueAtTime(reinjection(p.fxDelayFeedback), now);

    // Amortir la réinjection évite l'accumulation d'aigus à chaque tour, qui
    // rend les répétitions stridentes.
    const amorti = ctx.createBiquadFilter();
    amorti.type = "lowpass";
    amorti.frequency.setValueAtTime(AMORTI_HZ, now);

    const dose = ctx.createGain();
    dose.gain.setValueAtTime(doseDelai, now);

    courant.connect(retard);
    retard.connect(amorti);
    amorti.connect(retour);
    retour.connect(retard);
    retard.connect(dose);
    dose.connect(sortie);
  }

  return { entree, sortie };
}
