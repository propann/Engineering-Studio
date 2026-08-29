/**
 * Les cinq moteurs du second rack.
 *
 * ## Pourquoi ils arrivent maintenant
 *
 * `apps/op1-studio/app/lib/soundEnginesData.ts` décrit **vingt** moteurs,
 * répartis en deux racks de dix, et toute la documentation du dépôt annonce ce
 * chiffre. Le rack du Hub n'en portait que **quinze** : `drum_machine`,
 * `vocoder_dsp`, `string_machine`, `organ_drawbars` et `phase_distortion`
 * n'existaient nulle part ailleurs que dans cette table de métadonnées — un
 * nom, une catégorie, aucune synthèse. Cinq entrées d'interface qui ne
 * produisaient aucun son.
 *
 * Ce fichier les construit pour de vrai.
 *
 * ## Pourquoi ici et non dans `AudioPluginRack.tsx`
 *
 * Les quinze premiers sont écrits en ligne dans le composant, en une chaîne de
 * `else if` de huit cents lignes. Rien n'y est vérifiable : monter un rack
 * complet dans un test pour écouter un oscillateur n'a pas de sens, et le
 * dépôt a déjà tiré cette conclusion — `core/audio/dsp.ts` existe précisément
 * pour les briques « extraites de AudioPluginRack pour être testables ».
 *
 * Chaque moteur est donc une fonction qui reçoit son contexte et rend son
 * nœud de sortie. Elle ne connecte rien à une destination et ne programme
 * aucun relâchement : l'appelant branche où il veut, exactement comme
 * `construireVoix` le fait pour les quinze autres. Un `OfflineAudioContext` ou
 * le contexte factice du dépôt suffit alors à vérifier le graphe.
 *
 * ## Ce que ces moteurs ne sont pas
 *
 * Des émulations exactes. Ce sont des synthèses *de la même famille*, bâties
 * sur des nœuds WebAudio natifs : un orgue à tirettes est bien une somme de
 * neuf sinusoïdes aux rapports harmoniques d'un Hammond, mais sans la
 * modélisation de la roue phonique ni du haut-parleur rotatif. Le dépôt a déjà
 * payé le prix d'un moteur annoncé pour ce qu'il n'était pas ; on nomme donc
 * ce qui est fait, et le commentaire de chaque moteur dit où s'arrête
 * l'imitation.
 */

import type { EnginePluginType } from "../types/audio";
import {
  attachLfo,
  buildBitcrushCurve,
  buildFeedbackLoop,
  buildPulseWave,
  buildSaturationCurve,
} from "./dsp";

/**
 * Les services que l'appelant prête au moteur.
 *
 * Ils viennent de `construireVoix` : `trk` mémorise une source pour pouvoir
 * couper la voix, `noteStop` l'arrête en tenant à jour l'horizon naturel, et
 * `holdUntil` allonge l'horizon AUDIBLE — un résonateur continue de sonner
 * après l'extinction de sa source, et caler l'enveloppe sur l'arrêt de la
 * source l'étranglerait avant qu'il ne sonne.
 */
export type AideVoix = {
  trk: <T extends AudioScheduledSourceNode>(node: T) => T;
  noteStop: (node: AudioScheduledSourceNode, when: number) => void;
  holdUntil: (t: number) => void;
};

/** Borne une valeur. Les paramètres viennent de curseurs, jamais de confiance. */
const borne = (v: number, min: number, max: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/* ======================================================================== *
 * 16. BOÎTE À RYTHMES
 * ======================================================================== */

export type ParamsDrumMachine = {
  /** Quelle voix de la boîte jouer. */
  drumVoice: "kick" | "snare" | "hat" | "tom" | "clap";
  /** Hauteur de départ de la chute, en pourcentage. */
  drumTone: number;
  /** Longueur de la décroissance, en pourcentage. */
  drumDecay: number;
  /** Part de bruit dans le mélange, en pourcentage. */
  drumNoise: number;
  /** Saturation de sortie, en pourcentage. */
  drumDrive: number;
};

/**
 * Boîte à rythmes analogique.
 *
 * Le principe des TR-808 et 909 : chaque voix est un oscillateur dont la
 * hauteur **chute** très vite, mélangé à du bruit filtré. Ce n'est pas de
 * l'échantillonnage — d'où l'intérêt ici, où aucun échantillon distant n'est
 * chargé.
 *
 * La note jouée transpose la voix au lieu de la choisir : on garde ainsi le
 * clavier utilisable pour accorder une grosse caisse, ce que fait n'importe
 * quelle boîte analogique.
 *
 * Ce qui n'est pas modélisé : le pont de diodes du charleston 808, dont le
 * timbre métallique vient de six oscillateurs carrés désaccordés. Le
 * charleston est ici du bruit passe-haut, plus proche d'une 909.
 */
export function construireDrumMachine(
  ctx: BaseAudioContext,
  p: ParamsDrumMachine,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const decroissance = 0.04 + (borne(p.drumDecay, 0, 100) / 100) * 0.9;
  const bruitMix = borne(p.drumNoise, 0, 100) / 100;
  const ton = borne(p.drumTone, 0, 100) / 100;

  // --- Corps tonal : la chute de hauteur, signature du genre --------------
  if (p.drumVoice !== "hat" && p.drumVoice !== "clap") {
    const osc = aide.trk(ctx.createOscillator());
    const corps = ctx.createGain();
    osc.type = p.drumVoice === "tom" ? "sine" : "triangle";

    // Le rapport de chute fait la différence entre une grosse caisse (chute
    // profonde, jusqu'au sub) et un tom (chute courte, qui garde sa note).
    const depart = freq * (p.drumVoice === "kick" ? 5 + ton * 6 : 1.8 + ton * 1.5);
    const arrivee = Math.max(20, freq * (p.drumVoice === "kick" ? 0.5 : 0.9));
    osc.frequency.setValueAtTime(depart, now);
    osc.frequency.exponentialRampToValueAtTime(arrivee, now + decroissance * 0.35);

    corps.gain.setValueAtTime(1 - bruitMix * 0.6, now);
    corps.gain.exponentialRampToValueAtTime(0.0001, now + decroissance);
    osc.connect(corps);
    corps.connect(sortie);
    osc.start(now);
    aide.noteStop(osc, now + decroissance + 0.05);
  }

  // --- Bruit : la peau de la caisse claire, le métal du charleston --------
  if (bruitMix > 0 || p.drumVoice === "hat" || p.drumVoice === "clap") {
    const longueur = Math.max(1, Math.floor(ctx.sampleRate * decroissance));
    const tampon = ctx.createBuffer(1, longueur, ctx.sampleRate);
    const donnees = tampon.getChannelData(0);
    for (let i = 0; i < longueur; i += 1) donnees[i] = Math.random() * 2 - 1;

    const source = aide.trk(ctx.createBufferSource());
    source.buffer = tampon;

    const filtre = ctx.createBiquadFilter();
    // Le charleston est un passe-haut haut placé ; la caisse claire une bande
    // médium. C'est ce qui les distingue à l'oreille bien avant l'enveloppe.
    filtre.type = p.drumVoice === "hat" ? "highpass" : "bandpass";
    filtre.frequency.setValueAtTime(
      p.drumVoice === "hat" ? 6000 + ton * 4000 : 1200 + ton * 2500,
      now,
    );
    filtre.Q.setValueAtTime(p.drumVoice === "clap" ? 6 : 1.2, now);

    const gainBruit = ctx.createGain();
    const dureeBruit =
      p.drumVoice === "hat" ? decroissance * 0.25 : decroissance * 0.7;
    gainBruit.gain.setValueAtTime(
      p.drumVoice === "hat" || p.drumVoice === "clap" ? 0.8 : bruitMix,
      now,
    );
    gainBruit.gain.exponentialRampToValueAtTime(0.0001, now + dureeBruit);

    source.connect(filtre);
    filtre.connect(gainBruit);
    gainBruit.connect(sortie);
    source.start(now);
    aide.noteStop(source, now + dureeBruit + 0.02);
  }

  // --- Saturation : ce qui fait « claquer » une boîte poussée -------------
  const drive = borne(p.drumDrive, 0, 100);
  if (drive > 0) {
    const sat = ctx.createWaveShaper();
    sat.curve = buildSaturationCurve(drive, "hard");
    const apres = ctx.createGain();
    sortie.connect(sat);
    sat.connect(apres);
    aide.holdUntil(now + decroissance + 0.1);
    return apres;
  }

  aide.holdUntil(now + decroissance + 0.1);
  return sortie;
}

/* ======================================================================== *
 * 17. VOCODEUR SPECTRAL
 * ======================================================================== */

export type ParamsVocoder = {
  /** Nombre de bandes du banc de filtres. */
  vocBands: number;
  /** Voyelle imitée par le gabarit de formants. */
  vocFormant: "a" | "e" | "i" | "o" | "u";
  /** Forme d'onde de la porteuse. */
  vocCarrier: OscillatorType;
  /** Inclinaison du spectre vers l'aigu, en pourcentage. */
  vocBrightness: number;
  /** Finesse des bandes. Plus c'est haut, plus la voyelle est marquée. */
  vocResonance: number;
};

/**
 * Les trois premiers formants des voyelles, en hertz.
 *
 * Valeurs de référence pour une voix d'homme adulte, telles qu'on les trouve
 * dans la littérature de phonétique acoustique. Ce sont elles qui font
 * entendre une voyelle plutôt qu'un simple filtrage : c'est le RAPPORT entre
 * F1 et F2 que l'oreille lit, pas leur valeur absolue.
 */
export const FORMANTS: Record<ParamsVocoder["vocFormant"], [number, number, number]> = {
  a: [730, 1090, 2440],
  e: [530, 1840, 2480],
  i: [270, 2290, 3010],
  o: [570, 840, 2410],
  u: [300, 870, 2240],
};

/**
 * Vocodeur, façon banc de filtres.
 *
 * Un vrai vocodeur analyse un signal modulateur — une voix — et impose son
 * enveloppe spectrale à une porteuse. Il n'y a pas de microphone ici : on
 * remplace l'analyse par un **gabarit de formants** fixe, celui de la voyelle
 * choisie. La porteuse traverse un banc de passe-bande accordés sur ces
 * formants, et l'on entend l'instrument « prononcer » la voyelle.
 *
 * C'est la moitié d'un vocodeur — celle qui produit le son. L'autre moitié,
 * l'analyse d'une entrée, demanderait `getUserMedia`, donc un microphone et
 * une permission. Ce n'est pas fait, et la fiche du moteur le dit.
 */
export function construireVocodeur(
  ctx: BaseAudioContext,
  p: ParamsVocoder,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const porteuse = aide.trk(ctx.createOscillator());
  porteuse.type = p.vocCarrier || "sawtooth";
  porteuse.frequency.setValueAtTime(freq, now);
  porteuse.start(now);
  aide.noteStop(porteuse, now + 2.2);

  const formants = FORMANTS[p.vocFormant] ?? FORMANTS.a;
  const bandes = Math.round(borne(p.vocBands, 3, 16));
  const brillance = borne(p.vocBrightness, 0, 100) / 100;
  const q = 2 + (borne(p.vocResonance, 0, 100) / 100) * 18;

  for (let i = 0; i < bandes; i += 1) {
    const filtre = ctx.createBiquadFilter();
    filtre.type = "bandpass";

    /**
     * Les trois premières bandes prennent les formants de la voyelle ; les
     * suivantes s'étalent au-dessus en progression géométrique.
     *
     * Répartir TOUTES les bandes uniformément, comme le fait un vocodeur de
     * studio, donnerait un filtrage neutre : c'est la concentration sur F1,
     * F2 et F3 qui fait entendre un « a » plutôt qu'un bourdon.
     */
    const centre =
      i < 3 ? formants[i] : formants[2] * Math.pow(1.35, i - 2);
    filtre.frequency.setValueAtTime(Math.min(centre, ctx.sampleRate / 2 - 1000), now);
    filtre.Q.setValueAtTime(q, now);

    const gain = ctx.createGain();
    // Les formants portent l'essentiel ; les bandes hautes sont dosées par
    // la brillance, sinon le timbre siffle dès qu'on monte le nombre de bandes.
    gain.gain.setValueAtTime(i < 3 ? 1 / (1 + i * 0.3) : (0.35 * brillance) / (i - 1), now);

    porteuse.connect(filtre);
    filtre.connect(gain);
    gain.connect(sortie);
  }

  aide.holdUntil(now + 2.4);
  return sortie;
}

/* ======================================================================== *
 * 18. STRING MACHINE
 * ======================================================================== */

export type ParamsStringMachine = {
  /** Nombre de voix désaccordées empilées. */
  strVoices: number;
  /** Écart de désaccord, en centièmes de demi-ton. */
  strDetune: number;
  /** Profondeur du chorus d'ensemble, en pourcentage. */
  strEnsemble: number;
  /** Coupure du passe-bas, en hertz. */
  strTone: number;
  /** Durée de l'attaque, en pourcentage. */
  strAttack: number;
};

/**
 * Ensemble à cordes, façon Solina / ARP String Ensemble.
 *
 * Le son ne vient pas d'un modèle de corde mais d'un **empilement de dents de
 * scie légèrement désaccordées**, passées dans un chorus à trois retards
 * modulés. C'est le vrai principe de ces machines des années 70 : la richesse
 * est dans le battement entre voix, pas dans la forme d'onde.
 *
 * Le désaccord est réparti symétriquement autour de la note. Empiler des voix
 * toutes décalées dans le même sens transposerait l'accord au lieu de
 * l'élargir — l'erreur classique.
 *
 * Ce qui n'est pas modélisé : le diviseur d'octave à top-octave, qui donnait à
 * ces instruments une polyphonie totale et un léger figeage de phase entre
 * notes. Ici chaque note a ses propres oscillateurs, donc des phases libres.
 */
export function construireStringMachine(
  ctx: BaseAudioContext,
  p: ParamsStringMachine,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const voix = Math.round(borne(p.strVoices, 1, 9));
  const ecart = borne(p.strDetune, 0, 50);
  const attaque = 0.02 + (borne(p.strAttack, 0, 100) / 100) * 0.9;

  const somme = ctx.createGain();
  somme.gain.setValueAtTime(1 / Math.sqrt(voix), now);

  for (let i = 0; i < voix; i += 1) {
    const osc = aide.trk(ctx.createOscillator());
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    // Réparti autour de zéro : -ecart … +ecart.
    const position = voix === 1 ? 0 : (i / (voix - 1)) * 2 - 1;
    osc.detune.setValueAtTime(position * ecart, now);
    osc.connect(somme);
    osc.start(now);
    aide.noteStop(osc, now + 3);
  }

  const filtre = ctx.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.setValueAtTime(borne(p.strTone, 200, 12000), now);
  filtre.Q.setValueAtTime(0.7, now);
  somme.connect(filtre);

  /**
   * Le chorus d'ensemble : trois retards courts, modulés par des sinusoïdes
   * de fréquences différentes.
   *
   * Trois et non un : avec un seul retard modulé on entend un vibrato, pas un
   * ensemble. Ce sont les battements entre modulations désynchronisées qui
   * donnent l'épaisseur — c'est exactement ce que faisait le circuit BBD de
   * ces machines.
   */
  const profondeur = (borne(p.strEnsemble, 0, 100) / 100) * 0.004;
  const melange = ctx.createGain();
  filtre.connect(melange);

  if (profondeur > 0) {
    const taux = [0.6, 0.85, 1.15];
    for (let i = 0; i < 3; i += 1) {
      const retard = ctx.createDelay(0.05);
      retard.delayTime.setValueAtTime(0.012 + i * 0.004, now);

      const lfo = aide.trk(ctx.createOscillator());
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(taux[i], now);
      const ampleur = ctx.createGain();
      ampleur.gain.setValueAtTime(profondeur, now);
      lfo.connect(ampleur);
      ampleur.connect(retard.delayTime);
      lfo.start(now);
      aide.noteStop(lfo, now + 3);

      const voieGain = ctx.createGain();
      voieGain.gain.setValueAtTime(0.5, now);
      filtre.connect(retard);
      retard.connect(voieGain);
      voieGain.connect(melange);
    }
  }

  // L'attaque lente est ce qui fait « cordes » plutôt que « orgue ».
  const enveloppe = ctx.createGain();
  enveloppe.gain.setValueAtTime(0.0001, now);
  enveloppe.gain.exponentialRampToValueAtTime(1, now + attaque);
  melange.connect(enveloppe);
  enveloppe.connect(sortie);

  aide.holdUntil(now + attaque + 1.2);
  return sortie;
}

/* ======================================================================== *
 * 19. ORGUE À TIRETTES
 * ======================================================================== */

export type ParamsOrganDrawbars = {
  /**
   * Les neuf tirettes, de 0 à 8 chacune.
   *
   * Notation d'organiste : « 888000000 » est le son de base, « 888800000 » le
   * réglage de jazz le plus connu.
   */
  orgDrawbars: string;
  /** Percussion à l'attaque, en pourcentage. */
  orgPercussion: number;
  /** Vitesse du haut-parleur rotatif, en hertz. */
  orgLeslie: number;
  /** Bruit de contact du clavier, en pourcentage. */
  orgKeyClick: number;
};

/**
 * Les rapports de fréquence des neuf tirettes d'un Hammond.
 *
 * Ce ne sont pas des harmoniques régulières : la deuxième tirette est le
 * troisième harmonique (quinte au-dessus), et la troisième la fondamentale.
 * Cet ordre déroutant vient des longueurs de tuyaux d'orgue à laquelle la
 * console fait référence — 16', 5⅓', 8', 4', 2⅔', 2', 1⅗', 1⅓', 1'.
 *
 * Les respecter est ce qui fait la différence entre un orgue et une somme de
 * sinusoïdes : une pile d'harmoniques 1-2-3-4 ne sonne pas Hammond.
 */
export const TIRETTES = [0.5, 1.4983, 1, 2, 2.9966, 4, 5.0397, 5.9932, 8];

/**
 * Les longueurs de tuyaux gravees sur la console, dans l'ordre des tirettes.
 *
 * C'est ainsi qu'un organiste designe un registre : « le 8 pieds » est la
 * fondamentale, « le 4 pieds » l'octave au-dessus. Les afficher evite d'avoir
 * a compter les positions dans une chaine de neuf chiffres.
 */
export const PIEDS_TIRETTES = ["16'", "5⅓'", "8'", "4'", "2⅔'", "2'", "1⅗'", "1⅓'", "1'"];

/**
 * Rend un reglage de tirettes lisible : seules celles qui sont tirees.
 *
 * « 888000000 » devient « 16' 5⅓' 8' ». Une chaine de neuf chiffres ne dit
 * rien a la lecture ; la liste des registres actifs, si.
 */
export function organDrawbarsLisible(reglage: string): string {
  const propre = (reglage || "").padEnd(9, "0").slice(0, 9);
  const actifs = PIEDS_TIRETTES.filter((_, i) => {
    const n = Number.parseInt(propre[i], 10);
    return Number.isFinite(n) && n > 0;
  });
  return actifs.length ? actifs.join(" ") : "aucune";
}

/**
 * Orgue à tirettes.
 *
 * Neuf sinusoïdes, une par tirette, dont le niveau suit le tirage. C'est
 * exactement le principe de la roue phonique : l'instrument est un
 * synthétiseur additif, et c'était déjà le cas en 1935.
 *
 * Ce qui n'est pas modélisé : la diaphonie entre roues, le repliement des
 * harmoniques hautes (« foldback ») et le haut-parleur Leslie, dont l'effet
 * réel combine rotation du pavillon et du tambour de graves avec un effet
 * Doppler. Le `orgLeslie` d'ici est un simple vibrato de fréquence — la partie
 * audible, pas le mécanisme.
 */
export function construireOrganDrawbars(
  ctx: BaseAudioContext,
  p: ParamsOrganDrawbars,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const reglage = (p.orgDrawbars || "888000000").padEnd(9, "0").slice(0, 9);

  const somme = ctx.createGain();
  somme.gain.setValueAtTime(0.22, now);

  // Le vibrato du Leslie module toutes les roues ensemble : c'est le
  // haut-parleur qui tourne, pas chaque harmonique séparément.
  const vitesse = borne(p.orgLeslie, 0, 8);
  let ampleurLeslie: GainNode | null = null;
  if (vitesse > 0) {
    const lfo = aide.trk(ctx.createOscillator());
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(vitesse, now);
    ampleurLeslie = ctx.createGain();
    // En centièmes de demi-ton : un Leslie déplace peu la hauteur, c'est son
    // battement d'amplitude qu'on entend surtout.
    ampleurLeslie.gain.setValueAtTime(6 + vitesse, now);
    lfo.connect(ampleurLeslie);
    lfo.start(now);
    aide.noteStop(lfo, now + 4);
  }

  let actives = 0;
  for (let i = 0; i < 9; i += 1) {
    const niveau = Number.parseInt(reglage[i], 10);
    if (!Number.isFinite(niveau) || niveau <= 0) continue;
    const f = freq * TIRETTES[i];
    if (f >= ctx.sampleRate / 2) continue; // au-dessus de Nyquist : repliement

    const osc = aide.trk(ctx.createOscillator());
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now);
    ampleurLeslie?.connect(osc.detune);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime((niveau / 8) ** 2 * 0.5, now);
    osc.connect(gain);
    gain.connect(somme);
    osc.start(now);
    aide.noteStop(osc, now + 4);
    actives += 1;
  }

  /**
   * La percussion : un harmonique unique, très court, ajouté à l'attaque.
   *
   * Sur un Hammond c'est un circuit à part, pas une tirette — et il ne
   * redéclenche que si toutes les touches ont été relâchées. Cette subtilité
   * n'est pas reproduite : ici chaque note l'obtient.
   */
  const perc = borne(p.orgPercussion, 0, 100);
  if (perc > 0 && actives > 0) {
    const osc = aide.trk(ctx.createOscillator());
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 2.9966, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime((perc / 100) * 0.6, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(g);
    g.connect(somme);
    osc.start(now);
    aide.noteStop(osc, now + 0.25);
  }

  // Le claquement de contact : sur un vrai Hammond, les neuf contacts d'une
  // touche ne se ferment pas au même instant. C'est un défaut devenu signature.
  const clic = borne(p.orgKeyClick, 0, 100);
  if (clic > 0) {
    const longueur = Math.max(1, Math.floor(ctx.sampleRate * 0.006));
    const tampon = ctx.createBuffer(1, longueur, ctx.sampleRate);
    const d = tampon.getChannelData(0);
    for (let i = 0; i < longueur; i += 1) d[i] = Math.random() * 2 - 1;
    const src = aide.trk(ctx.createBufferSource());
    src.buffer = tampon;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(2000, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime((clic / 100) * 0.25, now);
    src.connect(hp);
    hp.connect(g);
    g.connect(somme);
    src.start(now);
    aide.noteStop(src, now + 0.02);
  }

  somme.connect(sortie);
  aide.holdUntil(now + 4);
  return sortie;
}

/* ======================================================================== *
 * 20. PHASE DISTORTION
 * ======================================================================== */

export type ParamsPhaseDistortion = {
  /** Quantité de déformation, en pourcentage. */
  pdAmount: number;
  /** Forme visée par la déformation. */
  pdShape: "saw" | "square" | "pulse" | "resonant";
  /** Pour la forme résonante : nombre de cycles par période. */
  pdResonance: number;
  /** Réduction de résolution, en bits. Les CZ étaient des machines 8 bits. */
  pdBits: number;
};

/**
 * Phase distortion, façon Casio CZ.
 *
 * Le principe des CZ-101 et CZ-1000 : on ne déforme pas l'onde, on déforme la
 * **lecture de sa phase**. Une sinusoïde lue avec une phase qui accélère puis
 * ralentit produit un spectre proche d'une dent de scie filtrée — sans filtre.
 * C'était la réponse de Casio au brevet FM de Yamaha.
 *
 * On l'obtient ici avec un `WaveShaper` posé sur une dent de scie : la dent de
 * scie EST la rampe de phase, de -1 à 1, et la courbe du waveshaper est la
 * fonction de transfert de phase. C'est la transposition directe du principe,
 * pas une approximation.
 *
 * Ce qui n'est pas modélisé : les huit étages d'enveloppe de hauteur et de
 * DCW des CZ, et le mode à deux formes d'onde combinées.
 */
export function construirePhaseDistortion(
  ctx: BaseAudioContext,
  p: ParamsPhaseDistortion,
  freq: number,
  now: number,
  aide: AideVoix,
): AudioNode {
  const sortie = ctx.createGain();
  const quantite = borne(p.pdAmount, 0, 100) / 100;

  const phase = aide.trk(ctx.createOscillator());
  phase.type = "sawtooth";
  phase.frequency.setValueAtTime(freq, now);
  phase.start(now);
  aide.noteStop(phase, now + 2.4);

  const forme = ctx.createWaveShaper();
  forme.curve = courbePhaseDistortion(p.pdShape, quantite, borne(p.pdResonance, 1, 16));
  // `4x` : la déformation crée des harmoniques hautes, et sans suréchantillon-
  // nage elles se replient en fréquences graves parasites.
  forme.oversample = "4x";
  phase.connect(forme);

  let dernier: AudioNode = forme;

  // La réduction de résolution : les CZ sortaient en 8 bits, et ce grain fait
  // partie de leur son autant que la déformation.
  const bits = Math.round(borne(p.pdBits, 4, 16));
  if (bits < 16) {
    const crush = ctx.createWaveShaper();
    crush.curve = buildBitcrushCurve(bits);
    dernier.connect(crush);
    dernier = crush;
  }

  dernier.connect(sortie);
  aide.holdUntil(now + 2.4);
  return sortie;
}

/**
 * La fonction de transfert de phase.
 *
 * L'entrée est la rampe de phase, de -1 à 1 ; la sortie est l'amplitude. Ce
 * n'est donc pas un simple écrêtage : c'est la phase de lecture d'une
 * sinusoïde qu'on redistribue.
 *
 * Exportée pour être testée seule — c'est la seule partie du moteur qui
 * porte un calcul, et une courbe fausse s'entend sans qu'on sache dire d'où
 * elle vient.
 */
export function courbePhaseDistortion(
  forme: ParamsPhaseDistortion["pdShape"],
  quantite: number,
  resonance: number,
  points = 2048,
): Float32Array<ArrayBuffer> {
  const courbe = new Float32Array(new ArrayBuffer(points * 4));
  for (let i = 0; i < points; i += 1) {
    // x parcourt -1 → 1 ; t est la phase normalisée 0 → 1.
    const x = (i / (points - 1)) * 2 - 1;
    const t = (x + 1) / 2;
    let phase: number;

    switch (forme) {
      case "square":
        // La phase saute au milieu : deux demi-cycles rapides séparés par un
        // palier. Donne un spectre proche d'un carré filtré.
        phase = t < 0.5
          ? t * (1 + quantite)
          : 0.5 + (t - 0.5) * (1 + quantite);
        break;
      case "pulse":
        // Toute la période est comprimée au début, puis plateau : le rapport
        // cyclique devient réglable, comme une largeur d'impulsion.
        phase = Math.min(1, t / Math.max(0.02, 1 - quantite * 0.9));
        break;
      case "resonant":
        // Plusieurs cycles de sinusoïde dans une seule période, dont
        // l'amplitude décroît : c'est le mode « résonant » des CZ, qui imite
        // un filtre passe-bas balayé sans en utiliser un.
        return remplirResonant(courbe, points, quantite, resonance);
      case "saw":
      default:
        // La phase accélère au début puis ralentit : le classique.
        phase = t + quantite * t * (1 - t);
        break;
    }
    courbe[i] = Math.sin(2 * Math.PI * phase);
  }
  return courbe;
}

/** Le mode résonant, isolé : il ne suit pas la même forme que les autres. */
function remplirResonant(
  courbe: Float32Array<ArrayBuffer>,
  points: number,
  quantite: number,
  resonance: number,
): Float32Array<ArrayBuffer> {
  const cycles = Math.max(1, Math.round(resonance));
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    // L'enveloppe décroissante est ce qui fait entendre une résonance de
    // filtre : sans elle, on n'entend qu'une note à l'octave.
    const enveloppe = 1 - t;
    courbe[i] = Math.sin(2 * Math.PI * cycles * t) * enveloppe * (0.3 + quantite * 0.7);
  }
  return courbe;
}

/**
 * Les identifiants des cinq moteurs, dans l'ordre où ils complètent le rack B.
 *
 * Exporté pour que le catalogue de `AudioPluginRack` et les tests lisent la
 * même liste : deux énumérations divergentes se remarqueraient le jour où l'on
 * en ajoute un seizième.
 */
export const MOTEURS_COMPLEMENTAIRES = [
  "drum_machine",
  "vocoder_dsp",
  "string_machine",
  "organ_drawbars",
  "phase_distortion",
] as const;

export type MoteurComplementaire = (typeof MOTEURS_COMPLEMENTAIRES)[number];

/* ======================================================================== *
 * LA CHAINE DES VINGT MOTEURS
 *
 * Extraite de `AudioPluginRack.tsx` le 2026-08-29, ou elle vivait en ligne
 * dans `construireVoix` — 848 lignes de `else if` dans un composant de 4200.
 *
 * ## Pourquoi
 *
 * Tant qu'elle etait dans le composant, un seul ecran pouvait jouer ces
 * moteurs. Le clavier de l'OP-1 en mode controleur n'en atteignait que sept,
 * via une reimplementation partielle dans `op1SynthEngine.ts` ; les outils de
 * creation d'echantillon n'en avaient aucun ; et Strudel ne pouvait pas les
 * appeler du tout.
 *
 * ## Le contrat
 *
 * `construireMoteur` recoit son contexte, ses parametres et son noeud de
 * sortie. Elle ne connait ni React, ni le rack, ni la console : elle branche
 * le moteur actif sur `sortie` et rend une ligne de texte decrivant ce
 * qu'elle a fait. L'appelant en fait ce qu'il veut — un toast dans le rack,
 * rien du tout ailleurs.
 *
 * C'est ce qui la rend utilisable partout, et testable : un
 * `OfflineAudioContext` ou le contexte factice du depot suffit.
 * ======================================================================== */

/**
 * Tout ce qu'un moteur peut lire.
 *
 * Genere depuis les declarations d'etat du rack, puis fige ici. Un parametre
 * ajoute au rack sans etre ajoute ici serait signale par le typecheck a
 * l'appel — c'est voulu : les deux listes ne doivent pas diverger, et le
 * depot a deja paye ce genre de divergence sur `EnginePluginType`.
 */
export type ParamsMoteurs = ParamsDrumMachine &
  ParamsVocoder &
  ParamsStringMachine &
  ParamsOrganDrawbars &
  ParamsPhaseDistortion & {
  acidAccent: boolean;
  acidCutoff: number;
  acidDecay: number;
  acidEnvMod: number;
  acidResonance: number;
  acidTuning: number;
  acidWave: string;
  activeEngine: EnginePluginType;
  amCutoff: number;
  amDecay: number;
  amLfoDepth: number;
  amReso: number;
  amSubWave: string;
  amWave: string;
  amyFeedback: number;
  amyNoise: number;
  amyPartialCount: number;
  amySlope: number;
  amySpread: number;
  braidsBitDepth: number;
  braidsColor: number;
  braidsModel: string;
  braidsTimbre: number;
  cloudsFeedback: number;
  cloudsGranularDensity: number;
  cloudsPitchShift: number;
  cloudsPosition: number;
  cloudsReverb: number;
  cloudsTexture: number;
  drumVoice: "kick" | "snare" | "hat" | "tom" | "clap";
  dxAlgorithm: number;
  dxAttack: number;
  dxDecay: number;
  dxFeedback: number;
  dxOp1Ratio: number;
  dxOp2Ratio: number;
  elementsBrightness: number;
  elementsDamping: number;
  elementsExciter: number;
  elementsGeometry: number;
  elementsPitch: number;
  elementsStrike: number;
  faustDrive: number;
  faustFeedback: number;
  faustFilter: number;
  faustFreqMod: number;
  faustGain: number;
  fluidChorus: number;
  fluidPan: number;
  fluidPreset: string;
  fluidReverb: number;
  fluidVolume: number;
  helmCrossmod: number;
  helmCutoff: number;
  helmLfoSpeed: number;
  helmReverb: number;
  helmSubOct: number;
  orgDrawbars: string;
  pdAmount: number;
  pdShape: "saw" | "square" | "pulse" | "resonant";
  plArpSpeed: number;
  plBitcrush: number;
  plDutyCycle: number;
  plGlitch: number;
  plSampleRateDiv: number;
  plaitsDecay: number;
  plaitsEngine: "V_ANALOG" | "FM" | "WAVETABLE" | "GRAIN" | "SPEECH" | "CHORD";
  plaitsHarmonics: number;
  plaitsMorph: number;
  plaitsTimbre: number;
  ringsBrightness: number;
  ringsDamping: number;
  ringsPolyphony: number;
  ringsPosition: number;
  ringsResonatorMode: "STRING" | "TUBE" | "PLATE";
  ringsStructure: number;
  strVoices: number;
  surgeCutoff: number;
  surgeDrive: number;
  surgeMorph: number;
  surgeReso: number;
  surgeSub: number;
  surgeWavetable: string;
  vocBands: number;
  vocFormant: "a" | "e" | "i" | "o" | "u";
  zynBandwidth: number;
  zynFilterType: string;
  zynHarmonics: number;
  zynReso: number;
  zynReverbSend: number;
  zynSubBoost: number;
  };

/**
 * Les services que l'appelant prete a la chaine.
 *
 * `reverb` peut etre `null` : un appelant qui n'a pas de reverberation
 * partagee — un rendu hors ligne minimal, un studio qui n'en veut pas —
 * obtient alors le son sec plutot qu'une erreur.
 */
export type AideMoteur = AideVoix & {
  reverb: AudioNode | null;
};

/**
 * Construit le moteur actif et le branche sur `sortie`.
 *
 * Rend la description de ce qui a ete joue, ou une chaine vide si
 * `activeEngine` ne correspond a aucun moteur connu.
 */
export function construireMoteur(
  ctx: BaseAudioContext,
  p: ParamsMoteurs,
  freq: number,
  now: number,
  aide: AideVoix & { reverb: AudioNode | null },
  sortie: AudioNode,
): string {
  const { trk, noteStop, holdUntil } = aide;
  let message = "";

  /**
   * Envoi vers la reverberation. `amount` en 0-100.
   *
   * La reverberation prolonge le son : sans le `holdUntil`, l'enveloppe de
   * l'appelant couperait la queue au moment ou la source s'arrete.
   */
  const sendToReverb = (source: AudioNode, amount: number) => {
    if (!aide.reverb || amount <= 0) return;
    holdUntil(now + 1.2 + (amount / 100) * 1.4);
    const send = ctx.createGain();
    send.gain.setValueAtTime((amount / 100) * 0.5, now);
    source.connect(send);
    send.connect(aide.reverb);
  };

    if (p.activeEngine === "mi_plaits") {
      const osc1 = trk(ctx.createOscillator());
      const osc2 = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      const typeMap: Record<string, OscillatorType> = {
        V_ANALOG: "sawtooth",
        FM: "sine",
        WAVETABLE: "triangle",
        GRAIN: "square",
        SPEECH: "sawtooth",
        CHORD: "sawtooth",
      };

      osc1.type = typeMap[p.plaitsEngine] || "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * (1 + (p.plaitsHarmonics / 100) * 2), now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200 + (p.plaitsTimbre / 100) * 8000, now);

      // plaitsMorph : dosage entre les deux oscillateurs. osc2 etait
      // mixe a plein niveau quelle que soit la valeur du controle.
      const morphA = ctx.createGain();
      const morphB = ctx.createGain();
      morphA.gain.setValueAtTime(1 - (p.plaitsMorph / 100) * 0.75, now);
      morphB.gain.setValueAtTime((p.plaitsMorph / 100) * 0.85, now);

      osc1.connect(morphA);
      osc2.connect(morphB);
      morphA.connect(filter);
      morphB.connect(filter);
      filter.connect(sortie);

      const dec = 0.2 + (p.plaitsDecay / 100) * 2.0;
      osc1.start(now);
      osc2.start(now);
      noteStop(osc1, now + dec);
      noteStop(osc2, now + dec);

      message = (`🎛️ PLAITS [${p.plaitsEngine}] : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_braids") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = p.braidsModel.includes("SAW") ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400 + (p.braidsTimbre / 100) * 6000, now);
      filter.Q.setValueAtTime(1 + (p.braidsColor / 100) * 15, now);

      // braidsBitDepth : quantification. Braids est un module numerique,
      // sa resolution fait partie de son timbre.
      const crush = ctx.createWaveShaper();
      crush.curve = buildBitcrushCurve(p.braidsBitDepth);
      crush.oversample = "none";

      osc.connect(crush);
      crush.connect(filter);
      filter.connect(sortie);

      osc.start(now);
      noteStop(osc, now + 0.8);

      message = (`🎛️ BRAIDS [${p.braidsModel}] : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_rings") {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = trk(ctx.createBufferSource());
      noise.buffer = buffer;

      const delay = ctx.createDelay();
      delay.delayTime.value = 1 / (freq * Math.pow(2, (p.ringsPosition - 50) / 100));

      const feedback = ctx.createGain();
      feedback.gain.value = 0.98 - (p.ringsDamping / 100) * 0.15;

      const filter = ctx.createBiquadFilter();
      filter.type = p.ringsResonatorMode === "TUBE" ? "bandpass" : "lowpass";
      filter.frequency.setValueAtTime(500 + (p.ringsBrightness / 100) * 7000, now);

      noise.connect(delay);
      delay.connect(filter);
      filter.connect(feedback);
      feedback.connect(delay);
      // ringsStructure : inharmonicite. Un passe-tout decale la phase des
      // partiels, eloignant le resonateur du spectre harmonique.
      const disperse = ctx.createBiquadFilter();
      disperse.type = "allpass";
      disperse.frequency.setValueAtTime(200 + (p.ringsStructure / 100) * 5000, now);
      disperse.Q.setValueAtTime(0.5 + (p.ringsStructure / 100) * 6, now);
      delay.connect(disperse);

      // ringsPolyphony : cordes sympathiques accordees en quintes.
      const voiceMix = ctx.createGain();
      voiceMix.gain.setValueAtTime(1 / Math.max(1, p.ringsPolyphony), now);
      disperse.connect(voiceMix);

      for (let v = 1; v < Math.max(1, p.ringsPolyphony); v++) {
        const symDelay = ctx.createDelay(1);
        symDelay.delayTime.value = delay.delayTime.value / Math.pow(1.5, v);
        const symFb = ctx.createGain();
        symFb.gain.value = feedback.gain.value * 0.85;
        symDelay.connect(symFb);
        symFb.connect(symDelay);
        noise.connect(symDelay);
        symDelay.connect(voiceMix);
      }

      voiceMix.connect(sortie);

      // Le résonateur sonne longtemps après l'impulsion de 20 ms : la durée
      // dépend de l'amortissement, qui fixe le gain de rebouclage.
      holdUntil(now + 0.6 + (1 - p.ringsDamping / 100) * 2.6);

      noise.start(now);
      noteStop(noise, now + 0.02);

      message = (`🔔 RINGS [${p.ringsResonatorMode}] : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_clouds") {
      // Vrai moteur granulaire. Le module s'appelait "Clouds" mais
      // produisait une simple dent de scie filtrée : quatre de ses six
      // contrôles n'avaient aucun effet.
      const dur = 1.2;
      const shifted = freq * Math.pow(2, p.cloudsPitchShift / 12);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000 + (p.cloudsTexture / 100) * 4000, now);
      filter.Q.setValueAtTime(2.0, now);

      // cloudsFeedback : boucle de retour, la queue diffuse du module.
      const loop = buildFeedbackLoop(ctx, 0.09, p.cloudsFeedback, 3600);
      // La boucle prolonge le son bien après le dernier grain.
      holdUntil(now + dur + (p.cloudsFeedback / 100) * 2.2);
      filter.connect(loop.input);
      loop.output.connect(sortie);

      // cloudsReverb : envoi vers le convolveur partagé.
      sendToReverb(loop.output, p.cloudsReverb);

      // cloudsGranularDensity : nombre de grains sur la durée.
      // cloudsPosition : dispersion temporelle de leur déclenchement.
      const grains = Math.max(1, Math.round(2 + (p.cloudsGranularDensity / 100) * 22));
      const spread = (p.cloudsPosition / 100) * dur * 0.8;
      const grainLen = 0.05 + (1 - p.cloudsGranularDensity / 100) * 0.18;

      for (let g = 0; g < grains; g++) {
        const at = now + (g / grains) * (dur - grainLen) + Math.random() * spread * 0.3;
        const grain = trk(ctx.createOscillator());
        grain.type = "sawtooth";
        // Léger désaccord par grain : c'est ce qui donne la texture
        // de nuage plutôt qu'un empilement d'oscillateurs identiques.
        grain.frequency.setValueAtTime(shifted * (1 + (Math.random() - 0.5) * 0.03), at);

        // Fenêtre d'amplitude par grain. Sans elle, chaque début et fin
        // de grain produit un clic.
        const win = ctx.createGain();
        win.gain.setValueAtTime(0.0001, at);
        win.gain.exponentialRampToValueAtTime(0.9 / Math.sqrt(grains), at + grainLen * 0.35);
        win.gain.exponentialRampToValueAtTime(0.0001, at + grainLen);

        grain.connect(win);
        win.connect(filter);
        grain.start(at);
        noteStop(grain, at + grainLen);
      }

      message = (`☁️ CLOUDS ${grains} grains · fb ${p.cloudsFeedback}% : ${shifted.toFixed(1)} Hz`
      );
    } else if (p.activeEngine === "mi_elements") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * Math.pow(2, p.elementsPitch / 12), now);

      filter.type = "peaking";
      filter.frequency.setValueAtTime(300 + (p.elementsBrightness / 100) * 6000, now);
      filter.Q.setValueAtTime((p.elementsGeometry / 100) * 10 + 1, now);

      // elementsStrike : bruit d'attaque percussif. Elements est un module
      // exciteur/resonateur ; sans exciteur il ne reste que le resonateur.
      const strikeLen = 0.004 + (p.elementsStrike / 100) * 0.03;
      const nBuf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * strikeLen)), ctx.sampleRate);
      const nData = nBuf.getChannelData(0);
      for (let i = 0; i < nData.length; i++) {
        nData[i] = (Math.random() * 2 - 1) * (1 - i / nData.length);
      }
      const strike = trk(ctx.createBufferSource());
      strike.buffer = nBuf;

      // elementsExciter : dosage exciteur / corps resonant.
      const exciterGain = ctx.createGain();
      exciterGain.gain.setValueAtTime((p.elementsExciter / 100) * 0.7, now);
      strike.connect(exciterGain);
      exciterGain.connect(filter);
      strike.start(now);
      noteStop(strike, now + strikeLen);

      osc.connect(filter);
      filter.connect(sortie);

      osc.start(now);
      noteStop(osc, now + 0.8 + (100 - p.elementsDamping) / 50);

      message = (`🪘 ELEMENTS Modal : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "open303") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = (p.acidWave as OscillatorType) || "sawtooth";
      osc.frequency.setValueAtTime(freq * Math.pow(2, p.acidTuning / 12), now);

      filter.type = "lowpass";
      const envPeak = p.acidCutoff + 3500 * (p.acidAccent ? 1.5 : 0.8) * (p.acidEnvMod / 100);
      filter.frequency.setValueAtTime(envPeak, now);
      const dec = 0.12 + (p.acidDecay / 100) * 0.7;
      filter.frequency.exponentialRampToValueAtTime(p.acidCutoff * 0.18, now + dec);
      filter.Q.setValueAtTime((p.acidResonance / 100) * 22, now);

      osc.connect(filter);
      filter.connect(sortie);

      osc.start(now);
      noteStop(osc, now + dec + 0.1);

      message = (`🎛️ OPEN303 ACID BASS : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "dexed_fm") {
      const carrier = trk(ctx.createOscillator());
      const mod = trk(ctx.createOscillator());
      const modGain = ctx.createGain();

      carrier.type = "sine";
      carrier.frequency.setValueAtTime(freq * p.dxOp1Ratio, now);

      mod.type = "sine";
      mod.frequency.setValueAtTime(freq * p.dxOp2Ratio, now);

      // dxAlgorithm : sur un DX7 l'algorithme decrit le routage des
      // operateurs. Les six operateurs ne sont pas reproduits ici, mais le
      // reglage doit s'entendre : les algorithmes bas empilent les
      // operateurs (modulation profonde, timbre metallique), les hauts les
      // mettent en parallele (addition, timbre plus doux et plus riche).
      const algo = Math.max(1, Math.min(32, p.dxAlgorithm));
      const enSerie = 1 - (algo - 1) / 31; // 1 = tout empile, 0 = tout parallele

      // Part additive : un operateur non modulant, mixe directement.
      const additif = ctx.createGain();
      additif.gain.setValueAtTime((1 - enSerie) * 0.5, now);
      mod.connect(additif);
      additif.connect(sortie);
      modGain.gain.setValueAtTime(200 + p.dxFeedback * 120, now);

      // dxAttack : montee de l'indice de modulation. Sur un DX7 c'est ce
      // qui distingue une cloche d'un cuivre.
      const atk = 0.002 + (p.dxAttack / 100) * 0.6;
      const modPeak = 200 + p.dxFeedback * 120;
      modGain.gain.cancelScheduledValues(now);
      // La profondeur de modulation suit l'algorithme : empile, il module
      // fort ; parallele, il se contente d'additionner.
      modGain.gain.setValueAtTime(modPeak * enSerie * 0.05, now);
      modGain.gain.linearRampToValueAtTime(modPeak * enSerie, now + atk);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(sortie);

      const dec = 0.3 + (p.dxDecay / 100) * 1.5;
      carrier.start(now);
      mod.start(now);
      noteStop(carrier, now + dec);
      noteStop(mod, now + dec);

      message = (`🎹 DEXED FM (Algo #${p.dxAlgorithm}) : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "surge_xt") {
      const osc1 = trk(ctx.createOscillator());
      const subOsc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      // surgeWavetable : chaque table a son propre profil harmonique.
      // Le nom ne servait qu'a alimenter le toast ; il pilote maintenant la
      // forme d'onde et la richesse du spectre.
      const tables: Record<string, { type: OscillatorType; sub: OscillatorType }> = {
        "Acid-Wav": { type: "sawtooth", sub: "square" },
        "Basic Vector": { type: "triangle", sub: "sine" },
        "Digital Bell": { type: "square", sub: "triangle" },
        "Vocal Formant": { type: "sawtooth", sub: "triangle" },
      };
      const table = tables[p.surgeWavetable] ?? tables["Acid-Wav"];

      osc1.type = table.type;
      osc1.frequency.setValueAtTime(freq * (1 + (p.surgeMorph - 50) / 1000), now);

      subOsc.type = table.sub;
      subOsc.frequency.setValueAtTime(freq / 2, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(p.surgeCutoff, now);
      filter.Q.setValueAtTime((p.surgeReso / 100) * 12, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(p.surgeSub / 100, now);

      // surgeDrive : saturation douce en sortie de filtre.
      const drive = ctx.createWaveShaper();
      drive.curve = buildSaturationCurve(p.surgeDrive, "soft");
      drive.oversample = "2x";

      osc1.connect(filter);
      subOsc.connect(subGain);
      subGain.connect(filter);
      filter.connect(drive);
      drive.connect(sortie);

      osc1.start(now);
      subOsc.start(now);
      noteStop(osc1, now + 1.0);
      noteStop(subOsc, now + 1.0);

      message = (`🎛️ SURGE XT [${p.surgeWavetable}] : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "zynaddsubfx") {
      const filter = ctx.createBiquadFilter();
      filter.type = (p.zynFilterType as BiquadFilterType) || "lowpass";
      filter.frequency.setValueAtTime(1000 + (p.zynBandwidth / 100) * 5000, now);
      filter.Q.setValueAtTime((p.zynReso / 100) * 10, now);

      const harmCount = Math.min(12, p.zynHarmonics);
      for (let i = 1; i <= harmCount; i++) {
        const osc = trk(ctx.createOscillator());
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * i, now);
        gain.gain.setValueAtTime((0.35 / i) * (1 + (p.zynSubBoost / 100) * (i === 1 ? 1 : 0)), now);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        noteStop(osc, now + 0.8);
      }

      filter.connect(sortie);

      // zynReverbSend : envoi vers le convolveur partage.
      sendToReverb(filter, p.zynReverbSend);

      message = (`🎹 ZYNADDSUBFX Additive : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "helm") {
      const osc = trk(ctx.createOscillator());
      const sub = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * (1 + (p.helmCrossmod / 100) * 0.1), now);

      sub.type = "square";
      sub.frequency.setValueAtTime(freq / 2, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(p.helmCutoff, now);

      // helmSubOct : niveau du sous-oscillateur. Il était mixé à plein
      // niveau quelle que soit la valeur du contrôle.
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime((p.helmSubOct / 100) * 0.8, now);

      // helmLfoSpeed : ondulation du cutoff, le "wobble" du module.
      const lfo = trk(
        attachLfo(ctx, filter.frequency, p.helmLfoSpeed, p.helmCutoff * 0.45, now)
      );
      noteStop(lfo, now + 1.0);

      osc.connect(filter);
      sub.connect(subGain);
      subGain.connect(filter);
      filter.connect(sortie);

      // helmReverb : envoi vers le convolveur partagé.
      sendToReverb(filter, p.helmReverb);

      osc.start(now);
      sub.start(now);
      noteStop(osc, now + 1.0);
      noteStop(sub, now + 1.0);

      message = (`🎛️ HELM Crossmod Synth : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "fluidsynth") {
      const osc1 = trk(ctx.createOscillator());
      const osc2 = trk(ctx.createOscillator());
      const dur = 1.0;

      // fluidPreset : le nom du SoundFont ne servait qu'au toast. Chaque
      // preset a pourtant un profil reconnaissable — un orgue tient sans
      // decroitre, un Rhodes s'eteint vite avec une quinte marquee, un
      // piano decroit franchement. Ces trois traits suffisent a rendre le
      // choix audible sans embarquer de banque d'echantillons.
      const presets: Record<string, { base: OscillatorType; harm: OscillatorType; ratio: number; niveau: number }> = {
        "Acoustic Grand Piano": { base: "triangle", harm: "sine", ratio: 2, niveau: 0.35 },
        "Electric Piano Rhodes": { base: "sine", harm: "sine", ratio: 3, niveau: 0.5 },
        "Church Pipe Organ": { base: "square", harm: "sine", ratio: 4, niveau: 0.7 },
        "Symphonic Strings": { base: "sawtooth", harm: "triangle", ratio: 2, niveau: 0.45 },
      };
      const preset = presets[p.fluidPreset] ?? presets["Acoustic Grand Piano"];

      osc1.type = preset.base;
      osc2.type = preset.harm;

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * preset.ratio, now);

      // Dosage de l'harmonique : c'est lui qui separe un orgue riche d'un
      // piano sobre.
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(preset.niveau, now);

      // fluidChorus : deux voix légèrement désaccordées et retardées.
      // C'est ce dédoublement qui fait l'épaisseur d'un Rhodes.
      const chorusMix = ctx.createGain();
      chorusMix.gain.setValueAtTime((p.fluidChorus / 100) * 0.6, now);
      if (p.fluidChorus > 0) {
        const voice = trk(ctx.createOscillator());
        voice.type = "triangle";
        voice.frequency.setValueAtTime(freq, now);
        voice.detune.setValueAtTime(6 + (p.fluidChorus / 100) * 14, now);

        const chorusDelay = ctx.createDelay(0.05);
        chorusDelay.delayTime.setValueAtTime(0.012, now);
        // Ondulation lente du retard : sans elle le chorus est statique.
        const modLfo = trk(
          attachLfo(ctx, chorusDelay.delayTime, 0.6, 0.003 * (p.fluidChorus / 100), now)
        );
        noteStop(modLfo, now + dur);

        voice.connect(chorusDelay);
        chorusDelay.connect(chorusMix);
        voice.start(now);
        noteStop(voice, now + dur);
      }

      // fluidVolume : niveau du module.
      const level = ctx.createGain();
      level.gain.setValueAtTime((p.fluidVolume / 100) * 1.1, now);

      // fluidPan : placement stéréo, -100..+100 ramené à -1..+1.
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, (p.fluidPan - 50) / 50)), now);

      osc1.connect(level);
      osc2.connect(harmGain);
      harmGain.connect(level);
      chorusMix.connect(level);
      level.connect(panner);
      panner.connect(sortie);

      // fluidReverb : envoi vers le convolveur partagé.
      sendToReverb(panner, p.fluidReverb);

      osc1.start(now);
      osc2.start(now);
      noteStop(osc1, now + dur);
      noteStop(osc2, now + dur);

      message = (`🎹 FLUIDSYNTH [${p.fluidPreset}] rev ${p.fluidReverb}% · cho ${p.fluidChorus}%`
      );
    } else if (p.activeEngine === "amsynth") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = (p.amWave as OscillatorType) || "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(p.amCutoff, now);
      filter.Q.setValueAtTime((p.amReso / 100) * 12, now);

      const dec = 0.2 + (p.amDecay / 100) * 1.2;

      // amSubWave : le second VCO. Le module s'annonce "Dual VCO" mais
      // n'en instanciait qu'un seul.
      const sub2 = trk(ctx.createOscillator());
      sub2.type = (p.amSubWave as OscillatorType) || "square";
      sub2.frequency.setValueAtTime(freq / 2, now);
      const subLevel = ctx.createGain();
      subLevel.gain.setValueAtTime(0.45, now);
      sub2.connect(subLevel);
      subLevel.connect(filter);
      sub2.start(now);
      noteStop(sub2, now + dec);

      // amLfoDepth : vibrato sur la hauteur des deux oscillateurs.
      if (p.amLfoDepth > 0) {
        const depth = (p.amLfoDepth / 100) * freq * 0.03;
        const lfoA = trk(attachLfo(ctx, osc.frequency, 5.2, depth, now));
        const lfoB = trk(attachLfo(ctx, sub2.frequency, 5.2, depth * 0.5, now));
        noteStop(lfoA, now + dec);
        noteStop(lfoB, now + dec);
      }

      osc.connect(filter);
      filter.connect(sortie);

      osc.start(now);
      noteStop(osc, now + dec);

      message = (`🎛️ AMSYNTH Dual VCO : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "amy_engine") {
      const partials = Math.min(16, p.amyPartialCount);
      const dur = 0.8;

      // amyFeedback : boucle de retour sur la somme des partiels.
      const loop = buildFeedbackLoop(ctx, 0.011, p.amyFeedback, 6000);
      holdUntil(now + dur + (p.amyFeedback / 100) * 1.1);
      loop.output.connect(sortie);

      for (let i = 1; i <= partials; i++) {
        const osc = trk(ctx.createOscillator());
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * i * (1 + (p.amySpread / 100) * 0.05), now);
        gain.gain.setValueAtTime((0.3 / Math.pow(i, p.amySlope / 50)), now);

        osc.connect(gain);
        gain.connect(loop.input);
        osc.start(now);
        noteStop(osc, now + dur);
      }

      // amyNoise : composante bruitee, le grain "chiptune" du module.
      if (p.amyNoise > 0) {
        const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const nb = ctx.createBuffer(1, len, ctx.sampleRate);
        const nd = nb.getChannelData(0);
        for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;

        const noise = trk(ctx.createBufferSource());
        noise.buffer = nb;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime((p.amyNoise / 100) * 0.18, now);
        // Bruit filtre autour de la fondamentale, sinon il masque le spectre.
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "bandpass";
        nFilter.frequency.setValueAtTime(freq * 2, now);
        nFilter.Q.setValueAtTime(1.2, now);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(loop.input);
        noise.start(now);
        noteStop(noise, now + dur);
      }

      message = (`🎛️ AMY ${partials} partiels · fb ${p.amyFeedback}% · bruit ${p.amyNoise}%`
      );
    } else if (p.activeEngine === "pl_synth") {
      // Moteur chiptune complet. Avant : une onde carrée nue, ses cinq
      // contrôles n'avaient aucun effet.
      const osc = trk(ctx.createOscillator());

      // plDutyCycle : rapport cyclique variable via onde de Fourier.
      // Un OscillatorNode "square" est figé à 50 %.
      osc.setPeriodicWave(buildPulseWave(ctx, p.plDutyCycle));

      // plArpSpeed : arpège montant sur l'accord parfait majeur.
      // 0 = note tenue.
      const dur = 0.6;
      if (p.plArpSpeed > 0) {
        const stepSec = 1 / Math.max(1, p.plArpSpeed);
        const ratios = [1, 1.25, 1.5, 2]; // fondamentale, tierce, quinte, octave
        let t = now;
        let i = 0;
        while (t < now + dur) {
          osc.frequency.setValueAtTime(freq * ratios[i % ratios.length], t);
          t += stepSec;
          i++;
        }
      } else {
        osc.frequency.setValueAtTime(freq, now);
      }

      // plBitcrush : quantification. 16 bits ≈ transparent, 1-2 bits détruit.
      const crusher = ctx.createWaveShaper();
      crusher.curve = buildBitcrushCurve(p.plBitcrush);
      crusher.oversample = "none";

      // plSampleRateDiv : la décimation exacte demanderait un
      // AudioWorklet. Approchée ici par un passe-bas au repliement
      // équivalent — même assombrissement, sans le coût d'un worklet.
      const decimate = ctx.createBiquadFilter();
      decimate.type = "lowpass";
      const div = Math.max(1, p.plSampleRateDiv);
      decimate.frequency.setValueAtTime(
        Math.min(ctx.sampleRate / 2, 18000 / div),
        now
      );
      decimate.Q.setValueAtTime(0.7, now);

      // plGlitch : sauts de hauteur aléatoires, façon puce qui décroche.
      if (p.plGlitch > 0) {
        const count = Math.floor((p.plGlitch / 100) * 12);
        for (let g = 0; g < count; g++) {
          const at = now + Math.random() * dur;
          const jump = 1 + (Math.random() - 0.5) * (p.plGlitch / 60);
          osc.frequency.setValueAtTime(freq * jump, at);
        }
      }

      osc.connect(crusher);
      crusher.connect(decimate);
      decimate.connect(sortie);

      osc.start(now);
      noteStop(osc, now + dur);

      message = (`🕹️ PL_SYNTH ${p.plBitcrush}bit /${div} · duty ${p.plDutyCycle}% : ${freq.toFixed(1)} Hz`
      );
    } else if (p.activeEngine === "faust_dsp") {
      // Le module annonçait "Wavefolder" mais ne repliait rien : dent de
      // scie dans un passe-bas, quatre contrôles sur cinq inertes.
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();
      const dur = 0.8;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      // faustFreqMod : modulation de fréquence par LFO audio.
      const fmLfo = trk(
        attachLfo(ctx, osc.frequency, freq * 0.5, (p.faustFreqMod / 100) * freq * 0.6, now)
      );
      noteStop(fmLfo, now + dur);

      // faustDrive : repliement d'onde. L'amplitude qui dépasse ne
      // sature pas, elle se replie et génère des harmoniques.
      const folder = ctx.createWaveShaper();
      folder.curve = buildSaturationCurve(p.faustDrive, "fold");
      folder.oversample = "4x";

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(p.faustFilter, now);

      // faustFeedback : boucle de retour amortie après le repliement.
      const loop = buildFeedbackLoop(ctx, 0.018, p.faustFeedback, 4200);
      holdUntil(now + dur + (p.faustFeedback / 100) * 1.4);

      // faustGain : niveau de sortie du module.
      const outGain = ctx.createGain();
      outGain.gain.setValueAtTime(0.25 + (p.faustGain / 100) * 0.9, now);

      osc.connect(folder);
      folder.connect(filter);
      filter.connect(loop.input);
      loop.output.connect(outGain);
      outGain.connect(sortie);

      osc.start(now);
      noteStop(osc, now + dur);

      message = (`🎛️ FAUST fold ${p.faustDrive}% · fb ${p.faustFeedback}% : ${freq.toFixed(1)} Hz`
      );

    /* ─── MOTEURS 16 A 20 ──────────────────────────────────────────────────
     *
     * Ils sont construits ailleurs, dans core/audio/moteurs.ts, et chaque
     * branche tient donc en trois lignes. C'est deliberе : les quinze
     * au-dessus forment une chaine de huit cents lignes qu'aucun test ne peut
     * atteindre, et le depot a deja tire cette lecon en sortant les briques
     * partagees dans core/audio/dsp.ts.
     *
     * Le contrat est le meme pour tous : la fonction rend son noeud de sortie,
     * ne connecte rien a une destination, et signale par `holdUntil` jusqu'a
     * quand elle reste audible.
     */
    } else if (p.activeEngine === "drum_machine") {
      construireDrumMachine(ctx, p, freq, now, aide).connect(sortie);
      message = (`🥁 BOÎTE À RYTHMES ${p.drumVoice.toUpperCase()} : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "vocoder_dsp") {
      construireVocodeur(ctx, p, freq, now, aide).connect(sortie);
      message = (`🗣️ VOCODEUR « ${p.vocFormant} » · ${p.vocBands} bandes : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "string_machine") {
      construireStringMachine(ctx, p, freq, now, aide).connect(sortie);
      message = (`🎻 STRING MACHINE ${p.strVoices} voix : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "organ_drawbars") {
      construireOrganDrawbars(ctx, p, freq, now, aide).connect(sortie);
      message = (`🎹 ORGUE ${p.orgDrawbars} : ${freq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "phase_distortion") {
      construirePhaseDistortion(ctx, p, freq, now, aide).connect(sortie);
      message = (`🌀 PHASE DISTORTION ${p.pdShape} ${p.pdAmount}% : ${freq.toFixed(1)} Hz`);
    }

  return message;
}
