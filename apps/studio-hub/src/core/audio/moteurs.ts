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

import { buildBitcrushCurve, buildSaturationCurve } from "./dsp";

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
