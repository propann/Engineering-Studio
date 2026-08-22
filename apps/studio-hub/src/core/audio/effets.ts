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
  fxModMode: "chorus" | "flanger" | "phaser";
  fxModMix: number;        // %
  fxModRate: number;       // Hz ×10 (curseur entier)
  fxModDepth: number;      // millièmes de seconde (chorus, flanger)
  fxModFeedback: number;   // % — flanger seulement
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

/**
 * Délai central du flanger, dix fois plus court que celui du chorus.
 *
 * C'est toute la différence entre les deux : au-dessus de ~10 ms l'oreille
 * entend deux sources (chorus), en dessous elle entend un filtre en peigne
 * (flanger). Le même graphe, un ordre de grandeur d'écart.
 */
export const FLANGER_BASE_SEC = 0.0012;

/** Réinjection maximale du flanger. Au-delà, le peigne devient un sifflement. */
export const FLANGER_FEEDBACK_MAX = 0.75;

/** Nombre d'étages du phaser. Quatre passe-tout = deux creux dans le spectre. */
export const PHASER_ETAGES = 4;

/** Bande balayée par le phaser, en Hz. */
export const PHASER_MIN_HZ = 300;
export const PHASER_MAX_HZ = 2600;

export function profondeurChorusSec(millisecondes: number): number {
  return profondeurModulationSec(millisecondes, "chorus");
}

/**
 * Profondeur de modulation, bornée sous le délai central du mode.
 *
 * Plus profonde, elle rendrait le temps de délai négatif — le nœud revient
 * alors à zéro et l'effet se tait par intermittence, ce qui s'entend comme un
 * défaut de son et non de réglage. Le flanger a un délai central dix fois plus
 * court : sa marge l'est aussi.
 */
export function profondeurModulationSec(
  millisecondes: number,
  mode: "chorus" | "flanger" | "phaser"
): number {
  if (!Number.isFinite(millisecondes)) return 0;
  const base = mode === "flanger" ? FLANGER_BASE_SEC : CHORUS_BASE_SEC;
  return Math.max(0, Math.min(base * 0.9, millisecondes / 1000));
}

/** Réinjection du flanger, bornée sous 1 comme celle du délai. */
export function reinjectionFlanger(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.min(FLANGER_FEEDBACK_MAX, Math.max(0, pourcent / 100));
}

/**
 * Fréquence centrale d'un étage de phaser.
 *
 * Les étages sont répartis géométriquement et non linéairement : l'oreille
 * entend les fréquences en rapports, pas en écarts. Quatre étages également
 * espacés en Hz mettraient trois creux dans les aigus et un seul en bas.
 */
export function frequenceEtagePhaser(index: number, total = PHASER_ETAGES): number {
  const n = Math.max(1, total);
  const i = Math.max(0, Math.min(n - 1, index));
  const ratio = n === 1 ? 0 : i / (n - 1);
  return PHASER_MIN_HZ * Math.pow(PHASER_MAX_HZ / PHASER_MIN_HZ, ratio);
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

  // ── Modulation : chorus, flanger ou phaser ───────────────────────────
  // Les trois partagent un LFO et une voie parallèle dosée. Ce qui les
  // sépare tient en peu de choses : le chorus et le flanger modulent un
  // délai — dix fois plus court pour le flanger, d'où le peigne au lieu du
  // dédoublement — et le phaser module des filtres passe-tout.
  const doseMod = melange(p.fxModMix);
  if (doseMod > 0) {
    const vitesse = vitesseChorusHz(p.fxModRate);
    const dose = ctx.createGain();
    dose.gain.setValueAtTime(doseMod, now);
    const somme = ctx.createGain();

    if (p.fxModMode === "phaser") {
      // Quatre passe-tout en série, balayés ensemble. Un passe-tout ne change
      // pas l'amplitude : c'est la SOMME avec le signal direct qui creuse le
      // spectre. Sans la voie directe, un phaser est inaudible.
      let etage: AudioNode = courant;
      for (let i = 0; i < PHASER_ETAGES; i++) {
        const filtre = ctx.createBiquadFilter();
        filtre.type = "allpass";
        const centre = frequenceEtagePhaser(i);
        filtre.frequency.setValueAtTime(centre, now);
        filtre.Q.setValueAtTime(0.7, now);
        // La profondeur balaie une fraction de la fréquence centrale : un
        // balayage en Hz constant serait imperceptible en haut du spectre et
        // ferait sortir les étages du bas sous zéro.
        attachLfo(ctx, filtre.frequency, vitesse, centre * 0.6, now);
        etage.connect(filtre);
        etage = filtre;
      }
      etage.connect(dose);
    } else {
      const base = p.fxModMode === "flanger" ? FLANGER_BASE_SEC : CHORUS_BASE_SEC;
      const retardMod = ctx.createDelay(0.1);
      retardMod.delayTime.setValueAtTime(base, now);
      attachLfo(ctx, retardMod.delayTime, vitesse, profondeurModulationSec(p.fxModDepth, p.fxModMode), now);

      courant.connect(retardMod);

      if (p.fxModMode === "flanger") {
        // La réinjection est ce qui donne au flanger son creusement : sans
        // elle, il n'est qu'un chorus très court.
        const retour = ctx.createGain();
        retour.gain.setValueAtTime(reinjectionFlanger(p.fxModFeedback), now);
        retardMod.connect(retour);
        retour.connect(retardMod);
      }

      retardMod.connect(dose);
    }

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
