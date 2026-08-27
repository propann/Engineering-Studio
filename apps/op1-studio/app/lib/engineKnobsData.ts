/**
 * engineKnobsData.ts — Définition des paramètres officiels pour les 15 moteurs audio
 * de synthèse et d'échantillonnage de l'OP-1 Studio.
 *
 * Supporte :
 * - Page 1 (Principale) : T1 (Bleu), T2 (Vert), T3 (Blanc), T4 (Rouge)
 * - Page 2 (Touche SHIFT) : T1 Shift, T2 Shift, T3 Shift, T4 Shift
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

export interface EngineDualConfig {
  main: EngineKnobsConfig;
  shift: EngineKnobsConfig;
}

export const ENGINE_CONFIGS: Record<string, EngineDualConfig> = {
  mi_plaits: {
    main: {
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
    shift: {
      t1: { name: "HARMONICS", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "CUTOFF", min: 100, max: 16000, step: 50, defaultValue: 4500, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
      t3: { name: "RESONANCE", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "FM DRIVE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  mi_braids: {
    main: {
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
    shift: {
      t1: { name: "COARSE", min: -24, max: 24, step: 1, defaultValue: 0, unit: "st", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} st` },
      t2: { name: "FINE TUNE", min: -50, max: 50, step: 1, defaultValue: 0, unit: "ct", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} ct` },
      t3: { name: "CUTOFF", min: 100, max: 16000, step: 50, defaultValue: 5000, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
      t4: { name: "BITCRUSH", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  mi_rings: {
    main: {
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
    shift: {
      t1: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "EXCITE", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "POLYPHONY", min: 1, max: 4, step: 1, defaultValue: 2, formatter: (v) => `${Math.round(v)} V` },
      t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 20, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  mi_clouds: {
    main: {
      t1: { name: "DENSITY", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "PITCH", min: -24, max: 24, step: 1, defaultValue: 0, unit: "st", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} st` },
      t3: { name: "TEXTURE", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "FREEZE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "GRAIN SIZE", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "SPREAD", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "FEEDBACK", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  mi_elements: {
    main: {
      t1: { name: "GEOMETRY", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "BRIGHT", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "DAMP", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "STRIKE", min: 0, max: 100, step: 1, defaultValue: 85, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "BLOW", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "BOW", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "SPACE", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  dexed_fm: {
    main: {
      t1: { name: "ALGO", min: 1, max: 32, step: 1, defaultValue: 5, formatter: (v) => `Alg ${Math.round(v)}` },
      t2: { name: "FEEDBACK", min: 0, max: 7, step: 1, defaultValue: 4, formatter: (v) => `FB ${Math.round(v)}` },
      t3: { name: "BRIGHT", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 65, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "ATTACK", min: 0, max: 100, step: 1, defaultValue: 10, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "RELEASE", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "LFO SPD", min: 1, max: 20, step: 0.5, defaultValue: 5, unit: "Hz", formatter: (v) => `${v.toFixed(1)}Hz` },
      t4: { name: "LFO DEPTH", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  surge_xt: {
    main: {
      t1: { name: "WT POS", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 3200, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
      t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "ATTACK", min: 0, max: 100, step: 1, defaultValue: 15, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "RELEASE", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "UNISON", min: 1, max: 8, step: 1, defaultValue: 3, formatter: (v) => `${Math.round(v)} V` },
      t4: { name: "DETUNE", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  zynaddsubfx: {
    main: {
      t1: { name: "HARMONICS", min: 1, max: 64, step: 1, defaultValue: 16, formatter: (v) => `${Math.round(v)} pts` },
      t2: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DETUNE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "ENV ATK", min: 0, max: 100, step: 1, defaultValue: 10, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "ENV REL", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "CHORUS", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  helm: {
    main: {
      t1: { name: "CROSSMOD", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "CUTOFF", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "SUB LEVEL", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "FEEDBACK", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "ENV MOD", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "ATTACK", min: 0, max: 100, step: 1, defaultValue: 5, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "RELEASE", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  fluidsynth: {
    main: {
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
    shift: {
      t1: { name: "VEL SENSE", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "TREMOLO", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "EQ BASS", min: -12, max: 12, step: 1, defaultValue: 2, unit: "dB", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} dB` },
      t4: { name: "EQ TREBLE", min: -12, max: 12, step: 1, defaultValue: 3, unit: "dB", formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} dB` },
    },
  },
  amsynth: {
    main: {
      t1: { name: "OSC MIX", min: 0, max: 100, step: 1, defaultValue: 50, formatter: (v) => `${Math.round(v)}% Sqr` },
      t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 2500, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
      t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 65, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "RING MOD", min: 0, max: 100, step: 1, defaultValue: 20, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "ENV MOD", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "ATTACK", min: 0, max: 100, step: 1, defaultValue: 10, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "RELEASE", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  amy_engine: {
    main: {
      t1: { name: "PARTIALS", min: 1, max: 64, step: 1, defaultValue: 32, formatter: (v) => `${Math.round(v)} par` },
      t2: { name: "TIMBRE", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "DAMP", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "WARP", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "INHARMONIC", min: 0, max: 100, step: 1, defaultValue: 20, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "SPACE", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  pl_synth: {
    main: {
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
    shift: {
      t1: { name: "VIBRATO", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "PORTAMENTO", min: 0, max: 100, step: 1, defaultValue: 15, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "SUB BASS", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "OVERDRIVE", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  open303: {
    main: {
      t1: { name: "WAVE", min: 0, max: 1, step: 1, defaultValue: 0, formatter: (v) => (v >= 0.5 ? "Square" : "Sawtooth") },
      t2: { name: "CUTOFF", min: 200, max: 16000, step: 50, defaultValue: 1800, unit: "Hz", formatter: (v) => `${(v / 1000).toFixed(1)}k` },
      t3: { name: "RESO", min: 0, max: 100, step: 1, defaultValue: 85, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "ENV MOD", min: 0, max: 100, step: 1, defaultValue: 75, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "ACCENT", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "DECAY", min: 200, max: 2500, step: 20, defaultValue: 800, unit: "ms", formatter: (v) => `${Math.round(v)}ms` },
      t3: { name: "OVERDRIVE", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DELAY MIX", min: 0, max: 100, step: 1, defaultValue: 30, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  faust_dsp: {
    main: {
      t1: { name: "WAVEFOLD", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "FILTER", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "MIX", min: 0, max: 100, step: 1, defaultValue: 80, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "FEEDBACK", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "DAMPING", min: 0, max: 100, step: 1, defaultValue: 35, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "DELAY", min: 10, max: 1000, step: 10, defaultValue: 320, unit: "ms", formatter: (v) => `${Math.round(v)}ms` },
      t4: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
  Drum: {
    main: {
      t1: { name: "PITCH", min: -12, max: 12, step: 1, defaultValue: 0, formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)} st` },
      t2: { name: "TONE", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t3: { name: "DECAY", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "DRIVE", min: 0, max: 100, step: 1, defaultValue: 40, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
    shift: {
      t1: { name: "PUNCH", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t2: { name: "HI-PASS", min: 20, max: 2000, step: 20, defaultValue: 80, unit: "Hz", formatter: (v) => `${Math.round(v)}Hz` },
      t3: { name: "REVERB", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%", formatter: (v) => `${Math.round(v)}%` },
      t4: { name: "COMPRESS", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%", formatter: (v) => `${Math.round(v)}%` },
    },
  },
};

export const ENGINE_KNOBS_CONFIGS: Record<string, EngineKnobsConfig> = Object.fromEntries(
  Object.entries(ENGINE_CONFIGS).map(([k, v]) => [k, v.main])
);

export function getEngineKnobsConfig(engineId: string, isShift = false): EngineKnobsConfig {
  const conf = ENGINE_CONFIGS[engineId] || ENGINE_CONFIGS.mi_plaits;
  return isShift ? conf.shift : conf.main;
}

export function getEngineDualConfig(engineId: string): EngineDualConfig {
  return ENGINE_CONFIGS[engineId] || ENGINE_CONFIGS.mi_plaits;
}
