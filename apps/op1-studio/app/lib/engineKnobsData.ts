/**
 * engineKnobsData.ts — Définition des 4 potentiomètres (T1 Bleu, T2 Vert, T3 Blanc, T4 Rouge)
 * pour l'ensemble des moteurs audio de synthèse et d'échantillonnage de l'OP-1 Studio.
 */

export interface EngineKnobDef {
  name: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  formatter?: (val: number) => string;
}

export interface EngineKnobsConfig {
  t1: EngineKnobDef; // Bleu
  t2: EngineKnobDef; // Vert
  t3: EngineKnobDef; // Blanc
  t4: EngineKnobDef; // Rouge
}

export const ENGINE_KNOBS_CONFIGS: Record<string, EngineKnobsConfig> = {
  mi_plaits: {
    t1: {
      name: "MODEL",
      min: 1,
      max: 16,
      step: 1,
      defaultValue: 1,
      formatter: (v) =>
        [
          "VA Saw", "VA Sqr", "FM 2OP", "Wavetable", "Chord", "Speech",
          "Swarm", "Noise", "Modal", "Strings", "Snare", "Hi-Hat",
          "Kick", "Grain", "Chime", "Vocal",
        ][Math.floor(v - 1)] || "VA Saw",
    },
    t2: { name: "TIMBRE", min: 0, max: 100, step: 1, defaultValue: 65, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "MORPH", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  mi_braids: {
    t1: {
      name: "SHAPE",
      min: 1,
      max: 8,
      step: 1,
      defaultValue: 1,
      formatter: (v) => ["CS-80", "WT Saw", "WT Vow", "Bell", "SubPulse", "DualSaw", "Formant", "Noise"][Math.floor(v - 1)] || "CS-80",
    },
    t2: { name: "TIMBRE", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "COLOR", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "ATTACK", min: 0, max: 100, step: 1, defaultValue: 20, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  mi_rings: {
    t1: {
      name: "STRUCT",
      min: 1,
      max: 6,
      step: 1,
      defaultValue: 1,
      formatter: (v) => ["Modal", "String", "Plate", "Chime", "Tube", "Symp"][Math.floor(v - 1)] || "Modal",
    },
    t2: { name: "BRIGHT", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "DAMP", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "POS", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  mi_clouds: {
    t1: { name: "DENSITY", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t2: { name: "PITCH", min: -24, max: 24, step: 1, defaultValue: 0, unit: "st", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} st` },
    t3: { name: "TEXTURE", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "FREEZE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  mi_elements: {
    t1: { name: "GEOMETRY", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t2: { name: "BRIGHT", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "DAMP", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "STRIKE", min: 0, max: 100, step: 1, defaultValue: 85, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  dexed_fm: {
    t1: { name: "ALGO", min: 1, max: 32, step: 1, defaultValue: 5, formatter: (v) => `Alg ${Math.round(v)}` },
    t2: { name: "FEEDBACK", min: 0, max: 7, step: 1, defaultValue: 4, formatter: (v) => `FB ${Math.round(v)}` },
    t3: { name: "BRIGHT", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 65, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  surge_xt: {
    t1: { name: "WT POS", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 3200, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
    t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  zynaddsubfx: {
    t1: { name: "HARMONICS", min: 1, max: 64, step: 1, defaultValue: 16, formatter: (v) => `${Math.round(v)} pts` },
    t2: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DETUNE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  helm: {
    t1: { name: "CROSSMOD", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t2: { name: "CUTOFF", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "SUB LEVEL", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  fluidsynth: {
    t1: {
      name: "PRESET",
      min: 1,
      max: 5,
      step: 1,
      defaultValue: 1,
      formatter: (v) => ["Grand Piano", "Rhodes EP", "Pipe Organ", "Strings", "Wide EP"][Math.floor(v - 1)] || "Piano",
    },
    t2: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 85, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "CHORUS", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  amsynth: {
    t1: { name: "OSC MIX", min: 0, max: 100, step: 1, defaultValue: 50, formatter: (v) => `${Math.round(v)}% Sqr` },
    t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 2500, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
    t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 65, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  amy_engine: {
    t1: { name: "PARTIALS", min: 1, max: 64, step: 1, defaultValue: 32, formatter: (v) => `${Math.round(v)} par` },
    t2: { name: "TIMBRE", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "DAMP", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  pl_synth: {
    t1: {
      name: "DUTY",
      min: 1,
      max: 4,
      step: 1,
      defaultValue: 3,
      formatter: (v) => ["12.5%", "25%", "50%", "75%"][Math.floor(v - 1)] || "50%",
    },
    t2: { name: "CRUSH", min: 2, max: 16, step: 1, defaultValue: 8, formatter: (v) => `${Math.round(v)} bit` },
    t3: {
      name: "ARP SPD",
      min: 1,
      max: 4,
      step: 1,
      defaultValue: 2,
      formatter: (v) => ["1/16", "1/32", "1/48", "1/64"][Math.floor(v - 1)] || "1/32",
    },
    t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  open303: {
    t1: { name: "WAVE", min: 0, max: 1, step: 1, defaultValue: 0, formatter: (v) => (v >= 0.5 ? "Square" : "Sawtooth") },
    t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 1800, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
    t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 85, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "ENV MOD", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  faust_dsp: {
    t1: { name: "WAVEFOLD", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t2: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "MIX", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
  // Moteur Drum OP-1 par défaut
  Drum: {
    t1: { name: "PITCH", min: -12, max: 12, step: 1, defaultValue: 0, formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} st` },
    t2: { name: "TONE", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t3: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
  },
};

export function getEngineKnobsConfig(engineId: string): EngineKnobsConfig {
  return ENGINE_KNOBS_CONFIGS[engineId] || ENGINE_KNOBS_CONFIGS.mi_plaits;
}
