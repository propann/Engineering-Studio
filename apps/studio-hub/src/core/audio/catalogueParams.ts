/**
 * Ce que chaque moteur expose comme reglages.
 *
 * ## Pourquoi une table plutot que vingt panneaux
 *
 * Les reglages etaient ecrits a la main dans `AudioPluginRack.tsx` : vingt
 * blocs de JSX, 101 controles, tous enfermes dans cette page. Une carte de
 * reglages ailleurs — dans le rack Strudel, dans un outil de creation de son,
 * dans une fenetre de superposition — aurait demande de les recopier.
 *
 * Ici, ils sont declares. Un composant lit la table et dessine la carte ; la
 * meme carte s'incruste partout, et un reglage ajoute apparait dans toutes les
 * fenetres a la fois.
 *
 * ## Genere depuis l'existant, pas invente
 *
 * Chaque entree vient des panneaux du rack : meme nom de parametre, meme
 * libelle, memes bornes. Rien n'a ete redecide au passage — une borne changee
 * en silence aurait modifie le son de patches d'usine sans qu'on le voie.
 *
 * ## L'invariant qui compte
 *
 * Un reglage declare ici doit etre LU par le moteur. `catalogueParams.test.ts`
 * croise cette table avec `moteurs.ts` : un curseur qui ne pilote rien est le
 * defaut que ce depot a mis des mois a purger, et il revient des qu'on ajoute
 * un moteur sans y penser.
 */

import type { EnginePluginType } from "../types/audio";

/** Un reglage, tel qu'une carte doit le dessiner. */
export type Reglage =
  | {
      nom: string;
      libelle: string;
      type: "curseur";
      min: number;
      max: number;
      /** Suffixe affiche apres la valeur : « % », « Hz », « bits »… */
      unite?: string;
    }
  | {
      nom: string;
      libelle: string;
      type: "liste";
      options: ReadonlyArray<{ valeur: string; libelle: string }>;
    };

export type FicheMoteur = {
  /** Nom court, pour l'entete de la carte. */
  nom: string;
  reglages: ReadonlyArray<Reglage>;
};

export const CATALOGUE: Record<EnginePluginType, FicheMoteur> = {
  mi_plaits: {
    nom: "Mutable Plaits",
    reglages: [
      { nom: "plaitsHarmonics", libelle: "HARMONICS FREQ", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "plaitsTimbre", libelle: "TIMBRE (FILTER CUTOFF)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "plaitsMorph", libelle: "MORPH (SHAPE)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "plaitsDecay", libelle: "DECAY ENVELOPE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "plaitsEngine", libelle: "SÉLECTION DUAL ENGINE", type: "liste", options: [{ valeur: "V_ANALOG", libelle: "1. VIRTUAL ANALOG (Saw/Pair)" }, { valeur: "FM", libelle: "2. FREQUENCY MODULATION (2-OP FM)" }, { valeur: "WAVETABLE", libelle: "3. WAVETABLE (Sweep 3D Grid)" }, { valeur: "GRAIN", libelle: "4. GRANULAR PULSE CLOUD" }, { valeur: "SPEECH", libelle: "5. SPEECH SYNTHESIS & FORMANT" }, { valeur: "CHORD", libelle: "6. 4-VOICE CHORD GENERATOR" }] },
    ],
  },
  mi_braids: {
    nom: "Mutable Braids",
    reglages: [
      { nom: "braidsColor", libelle: "COLOR (RESO/SPECTRUM)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "braidsTimbre", libelle: "TIMBRE (PULSE/SWEEP)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "braidsBitDepth", libelle: "BIT DEPTH", type: "curseur", min: 4, max: 16, unite: "Bits" },
      { nom: "braidsModel", libelle: "MODELE BRAIDS", type: "liste", options: [{ valeur: "CS-80 SAW", libelle: "CS-80 SAW (Brass Synth)" }, { valeur: "WT-SWEEP", libelle: "WT-SWEEP (Wavetable Scan)" }, { valeur: "VOWEL FORMANT", libelle: "VOWEL FORMANT (Voix Synthétique)" }, { valeur: "BELL HARMONIC", libelle: "BELL HARMONIC (Percussion Métallique)" }] },
    ],
  },
  mi_rings: {
    nom: "Mutable Rings",
    reglages: [
      { nom: "ringsDamping", libelle: "DAMPING (AMORTISSEMENT)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "ringsStructure", libelle: "STRUCTURE (INHARMONICS)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "ringsBrightness", libelle: "BRIGHTNESS", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "ringsPosition", libelle: "EXCITER POSITION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "ringsPolyphony", libelle: "POLYPHONY VOICES", type: "curseur", min: 1, max: 4 },
      { nom: "ringsResonatorMode", libelle: "RESONATOR MODE", type: "liste", options: [{ valeur: "STRING", libelle: "MODAL STRING (Corde Vibrante)" }, { valeur: "TUBE", libelle: "SYMPATHETIC STRINGS (Tubes & Flûtes)" }, { valeur: "PLATE", libelle: "INHARMONIC STRING (Cloches & Plaques)" }] },
    ],
  },
  mi_clouds: {
    nom: "Mutable Clouds",
    reglages: [
      { nom: "cloudsGranularDensity", libelle: "GRANULAR DENSITY", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "cloudsPitchShift", libelle: "PITCH SHIFT (DEMI-TONS)", type: "curseur", min: -12, max: 12 },
      { nom: "cloudsTexture", libelle: "TEXTURE / SMOOTHING", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "cloudsPosition", libelle: "GRAIN POSITION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "cloudsFeedback", libelle: "FEEDBACK AMOUNT", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "cloudsReverb", libelle: "REVERB DENSITY", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  mi_elements: {
    nom: "Mutable Elements",
    reglages: [
      { nom: "elementsGeometry", libelle: "GEOMETRY (RESONANCE)", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "elementsBrightness", libelle: "BRIGHTNESS", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "elementsDamping", libelle: "DAMPING", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "elementsPitch", libelle: "PITCH TUNE", type: "curseur", min: -12, max: 12, unite: "st" },
      { nom: "elementsExciter", libelle: "EXCITER CONTOUR", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "elementsStrike", libelle: "STRIKE FORCE", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  dexed_fm: {
    nom: "Dexed FM",
    reglages: [
      { nom: "dxAlgorithm", libelle: "ALGORITHME FM (1-32)", type: "curseur", min: 1, max: 32 },
      { nom: "dxFeedback", libelle: "FEEDBACK AMOUNT", type: "curseur", min: 0, max: 10 },
      { nom: "dxAttack", libelle: "ATTACK TIME", type: "curseur", min: 0, max: 20, unite: "ms" },
      { nom: "dxDecay", libelle: "DECAY TIME", type: "curseur", min: 10, max: 100, unite: "%" },
    ],
  },
  surge_xt: {
    nom: "Surge XT",
    reglages: [
      { nom: "surgeMorph", libelle: "MORPH SCAN", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "surgeCutoff", libelle: "FILTER CUTOFF", type: "curseur", min: 200, max: 8000, unite: "Hz" },
      { nom: "surgeReso", libelle: "RESONANCE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "surgeSub", libelle: "SUB OSC LEVEL", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "surgeDrive", libelle: "DRIVE BOOST", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "surgeWavetable", libelle: "WAVETABLE TABLE", type: "liste", options: [{ valeur: "Acid-Wav", libelle: "Acid-Wav Sweep" }, { valeur: "Basic Vector", libelle: "Basic Vector" }, { valeur: "Digital Bell", libelle: "Digital Bell Table" }, { valeur: "Vocal Formant", libelle: "Vocal Formant" }] },
    ],
  },
  zynaddsubfx: {
    nom: "ZynAddSubFX",
    reglages: [
      { nom: "zynHarmonics", libelle: "HARMONICS COUNT", type: "curseur", min: 1, max: 32 },
      { nom: "zynBandwidth", libelle: "BANDWIDTH", type: "curseur", min: 10, max: 100, unite: "%" },
      { nom: "zynSubBoost", libelle: "SUB BOOST", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "zynReso", libelle: "RESO PEAK", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "zynReverbSend", libelle: "REVERB SEND", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "zynFilterType", libelle: "FILTER TYPE", type: "liste", options: [{ valeur: "lowpass", libelle: "Lowpass 24dB" }, { valeur: "bandpass", libelle: "Bandpass Resonant" }, { valeur: "highpass", libelle: "Highpass Notch" }] },
    ],
  },
  helm: {
    nom: "Helm",
    reglages: [
      { nom: "helmCrossmod", libelle: "CROSSMOD", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "helmCutoff", libelle: "FILTER CUTOFF", type: "curseur", min: 200, max: 8000, unite: "Hz" },
      { nom: "helmSubOct", libelle: "SUB OCTAVE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "helmReverb", libelle: "REVERB WET", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  open303: {
    nom: "Open303 Acid",
    reglages: [
      { nom: "acidCutoff", libelle: "CUTOFF BASS", type: "curseur", min: 200, max: 6000, unite: "Hz" },
      { nom: "acidResonance", libelle: "RESONANCE SWEEP", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "acidEnvMod", libelle: "ENV MOD", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "acidDecay", libelle: "DECAY TIME", type: "curseur", min: 10, max: 100, unite: "%" },
      { nom: "acidTuning", libelle: "PITCH TUNING", type: "curseur", min: -12, max: 12, unite: "st" },
      { nom: "acidWave", libelle: "WAVEFORM", type: "liste", options: [{ valeur: "sawtooth", libelle: "Sawtooth (Salami Acid)" }, { valeur: "square", libelle: "Square (Sub Acid Punch)" }] },
    ],
  },
  amsynth: {
    nom: "amSynth",
    reglages: [
      { nom: "amCutoff", libelle: "FILTER CUTOFF", type: "curseur", min: 200, max: 8000, unite: "Hz" },
      { nom: "amReso", libelle: "RESONANCE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "amLfoDepth", libelle: "LFO DEPTH", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "amDecay", libelle: "AMP DECAY", type: "curseur", min: 10, max: 100, unite: "%" },
      { nom: "amWave", libelle: "PRIMARY OSC WAVE", type: "liste", options: [{ valeur: "sawtooth", libelle: "Sawtooth Wave" }, { valeur: "square", libelle: "Square Wave" }, { valeur: "sine", libelle: "Sine Wave" }, { valeur: "triangle", libelle: "Triangle Wave" }] },
      { nom: "amSubWave", libelle: "SUB OSC WAVE", type: "liste", options: [{ valeur: "square", libelle: "Square Sub" }, { valeur: "sine", libelle: "Sine Sub" }] },
    ],
  },
  amy_engine: {
    nom: "AMY",
    reglages: [
      { nom: "amyPartialCount", libelle: "PARTIAL COUNT", type: "curseur", min: 4, max: 64 },
      { nom: "amySlope", libelle: "SPECTRAL SLOPE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "amySpread", libelle: "PARTIAL SPREAD", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "amyFeedback", libelle: "FEEDBACK LOOP", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "amyNoise", libelle: "CHIPTUNE NOISE", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  pl_synth: {
    nom: "pl_synth",
    reglages: [
      { nom: "plBitcrush", libelle: "BITCRUSH DEPTH", type: "curseur", min: 1, max: 16, unite: "Bits" },
      { nom: "plSampleRateDiv", libelle: "SAMPLE RATE DIVIDE: /", type: "curseur", min: 1, max: 8 },
      { nom: "plArpSpeed", libelle: "ARP SPEED", type: "curseur", min: 1, max: 24 },
      { nom: "plDutyCycle", libelle: "DUTY CYCLE", type: "curseur", min: 10, max: 90, unite: "%" },
      { nom: "plGlitch", libelle: "GLITCH FX", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  fluidsynth: {
    nom: "FluidSynth",
    reglages: [
      { nom: "fluidReverb", libelle: "REVERB LEVEL", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "fluidChorus", libelle: "CHORUS DEPTH", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "fluidVolume", libelle: "MASTER VOLUME", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "fluidPan", libelle: "STEREO PAN", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "fluidPreset", libelle: "SOUNDFONT PRESET", type: "liste", options: [{ valeur: "Acoustic Grand Piano", libelle: "Acoustic Grand Piano" }, { valeur: "Electric Piano Rhodes", libelle: "Electric Piano Rhodes" }, { valeur: "Church Pipe Organ", libelle: "Church Pipe Organ" }, { valeur: "Symphonic Strings", libelle: "Symphonic Strings" }] },
    ],
  },
  faust_dsp: {
    nom: "Faust DSP",
    reglages: [
      { nom: "faustFreqMod", libelle: "FREQ MODULATION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "faustFilter", libelle: "DSP FILTER", type: "curseur", min: 200, max: 8000, unite: "Hz" },
      { nom: "faustGain", libelle: "GAIN BOOST", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "faustFeedback", libelle: "DSP FEEDBACK", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "faustDrive", libelle: "WAVEFOLDER DRIVE", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  drum_machine: {
    nom: "Dbox Drums",
    reglages: [
      { nom: "drumTone", libelle: "HAUTEUR DE CHUTE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "drumDecay", libelle: "DECROISSANCE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "drumNoise", libelle: "BRUIT", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "drumDrive", libelle: "SATURATION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "drumVoice", libelle: "VOIX", type: "liste", options: [{ valeur: "kick", libelle: "Grosse caisse" }, { valeur: "snare", libelle: "Caisse claire" }, { valeur: "hat", libelle: "Charleston" }, { valeur: "tom", libelle: "Tom" }, { valeur: "clap", libelle: "Clap" }] },
    ],
  },
  vocoder_dsp: {
    nom: "Vocodeur",
    reglages: [
      { nom: "vocBands", libelle: "BANDES", type: "curseur", min: 3, max: 16 },
      { nom: "vocBrightness", libelle: "BRILLANCE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "vocResonance", libelle: "RESONANCE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "vocFormant", libelle: "VOYELLE", type: "liste", options: [{ valeur: "a", libelle: "A — ouverte" }, { valeur: "e", libelle: "E — mi-fermee" }, { valeur: "i", libelle: "I — fermee" }, { valeur: "o", libelle: "O — arrondie" }, { valeur: "u", libelle: "U — sourde" }] },
      { nom: "vocCarrier", libelle: "PORTEUSE", type: "liste", options: [{ valeur: "sawtooth", libelle: "Dent de scie" }, { valeur: "square", libelle: "Carree" }, { valeur: "triangle", libelle: "Triangle" }, { valeur: "sine", libelle: "Sinus" }] },
    ],
  },
  string_machine: {
    nom: "Solina Strings",
    reglages: [
      { nom: "strVoices", libelle: "VOIX EMPILEES", type: "curseur", min: 1, max: 9 },
      { nom: "strDetune", libelle: "DESACCORD", type: "curseur", min: 0, max: 50, unite: "cents" },
      { nom: "strEnsemble", libelle: "ENSEMBLE", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "strTone", libelle: "COUPURE", type: "curseur", min: 200, max: 12000, unite: "Hz" },
      { nom: "strAttack", libelle: "ATTAQUE", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  organ_drawbars: {
    nom: "B3 Drawbars",
    reglages: [
      { nom: "orgPercussion", libelle: "PERCUSSION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "orgLeslie", libelle: "LESLIE", type: "curseur", min: 0, max: 8, unite: "Hz" },
      { nom: "orgKeyClick", libelle: "CLIC DE CONTACT", type: "curseur", min: 0, max: 100, unite: "%" },
    ],
  },
  phase_distortion: {
    nom: "CZ Phase Dist",
    reglages: [
      { nom: "pdAmount", libelle: "DEFORMATION", type: "curseur", min: 0, max: 100, unite: "%" },
      { nom: "pdResonance", libelle: "CYCLES (mode resonant)", type: "curseur", min: 1, max: 16 },
      { nom: "pdBits", libelle: "RESOLUTION", type: "curseur", min: 4, max: 16, unite: "bits" },
      { nom: "pdShape", libelle: "FORME VISEE", type: "liste", options: [{ valeur: "saw", libelle: "Dent de scie" }, { valeur: "square", libelle: "Carree" }, { valeur: "pulse", libelle: "Impulsion" }, { valeur: "resonant", libelle: "Resonante" }] },
    ],
  },
};

/** Les reglages d'un moteur. Liste vide pour un identifiant inconnu. */
export function reglagesDe(moteur: string): ReadonlyArray<Reglage> {
  return CATALOGUE[moteur as EnginePluginType]?.reglages ?? [];
}

/** Le nom court d'un moteur, ou son identifiant faute de mieux. */
export function nomDe(moteur: string): string {
  return CATALOGUE[moteur as EnginePluginType]?.nom ?? moteur;
}

/** Tous les noms de parametres declares, tous moteurs confondus. */
export function tousLesReglages(): string[] {
  return Object.values(CATALOGUE).flatMap((f) => f.reglages.map((r) => r.nom));
}
