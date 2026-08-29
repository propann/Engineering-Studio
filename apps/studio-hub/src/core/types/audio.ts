/**
 * Audio Rack Type Definitions
 * Central location for all audio-related TypeScript interfaces
 */

// ============================================================================
// SYNTHESIS ENGINES
// ============================================================================

export type EnginePluginType =
  // Mutable Instruments Eurorack Suite
  | "mi_plaits"
  | "mi_braids"
  | "mi_rings"
  | "mi_clouds"
  | "mi_elements"
  // Open-Source Engines
  | "dexed_fm"
  | "surge_xt"
  | "zynaddsubfx"
  | "helm"
  | "fluidsynth"
  | "amsynth"
  | "amy_engine"
  | "pl_synth"
  | "open303"
  | "faust_dsp"
  // Rack B, moteurs 16 a 20. Ajoutes le 2026-08-29 : ils etaient decrits
  // dans apps/op1-studio/app/lib/soundEnginesData.ts et annonces par toute la
  // documentation, mais n'existaient nulle part en synthese. Voir
  // core/audio/moteurs.ts.
  | "drum_machine"
  | "vocoder_dsp"
  | "string_machine"
  | "organ_drawbars"
  | "phase_distortion";

// ============================================================================
// PATCH & PRESET MANAGEMENT
// ============================================================================

export interface PatchPreset {
  id: string;
  name: string;
  engine: EnginePluginType;
  category: string;
  isUserPatch?: boolean;
  params: Record<string, any>;
  tags?: string[];
  isFavorite?: boolean;
  createdAt?: number;
  lastModified?: number;
}

export interface PatchSearchFilters {
  engine?: EnginePluginType;
  category?: string;
  tags?: string[];
  favorites?: boolean;
}

// ============================================================================
// EFFECTS & PROCESSORS
// ============================================================================

// Multi-Tap Delay
export interface DelayTap {
  id: string;
  delayMs: number;      // 50-2000ms
  feedback: number;     // 0-95%
  wetLevel: number;     // 0-100%
  pan: number;          // -100 to +100
}

export interface MultiTapDelayParams {
  tapCount: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  taps: DelayTap[];
  masterMix: number;    // 0-100
  stereoWidth: number;  // 0-100
  tempoSync: boolean;
  bpm?: number;
}

// Parametric EQ
export interface EQBand {
  id: string;
  type: "lowshelf" | "peaking" | "highshelf";
  frequency: number;    // Hz (20-20000)
  gain: number;         // dB (-12 to +12)
  q: number;            // Quality factor (0.1-10)
}

export interface ParametricEQParams {
  bands: EQBand[];
  masterGain: number;   // dB (-12 to +12)
  enabled: boolean;
}

// ADSR Envelope
export type EnvelopeCurve = "linear" | "exponential" | "exponential_in" | "exponential_out";

export interface ADSRParams {
  attack: number;       // ms (0-5000)
  decay: number;        // ms (0-5000)
  sustain: number;      // % (0-100)
  release: number;      // ms (0-5000)
  curveAttack: EnvelopeCurve;
  curveDecay: EnvelopeCurve;
  curveRelease: EnvelopeCurve;
}

// Arpeggiator
export type ArpMode = "up" | "down" | "up-down" | "down-up" | "random" | "chord";

export interface ArpeggiatorParams {
  mode: ArpMode;
  speed: number;        // BPM (40-240)
  octaves: number;      // 1-4
  gateLength: number;   // 0-100%
  enabled: boolean;
}

// Distortion
export type WaveshaperType = "soft_clip" | "hard_clip" | "waveshaper" | "tanh";

export interface DistortionParams {
  type: WaveshaperType;
  drive: number;        // 0-100
  tone: number;         // 0-100 (filter)
  outputGain: number;   // dB (-12 to +12)
}

// LFO
export type LFOShape = "sine" | "triangle" | "square" | "sawtooth" | "sample_hold";

export interface LFOParams {
  shape: LFOShape;
  rate: number;         // Hz or BPM
  depth: number;        // 0-100%
  phase: number;        // 0-360 degrees
  tempoSync: boolean;
}

// ============================================================================
// AUDIO PROCESSING
// ============================================================================

export interface AudioProcessor {
  process(input: AudioNode, output: AudioNode): void;
  setParameter(key: string, value: any): void;
  getParameter(key: string): any;
}

export interface EffectsChainConfig {
  processors: AudioProcessor[];
  enabled: boolean;
  masterGain: number;
}

// ============================================================================
// AUDIO EXPORT
// ============================================================================

export interface AudioExportOptions {
  duration: number;     // seconds
  sampleRate: 44100 | 48000;
  bitDepth: 16 | 24 | 32;
  format: "wav" | "mp3";
  metadata?: {
    title?: string;
    artist?: string;
    tempo?: number;
    key?: string;
  };
}

export interface ExportProgress {
  status: "idle" | "recording" | "encoding" | "complete" | "error";
  progress: number;     // 0-100%
  message: string;
  error?: Error;
}

// ============================================================================
// SAMPLE PACK
// ============================================================================

export interface SamplePackOptions {
  name: string;
  startNote: number;    // MIDI note
  endNote: number;
  sampleRate: 44100 | 48000;
  includeMetadata: boolean;
  folderStructure: "flat" | "by-category" | "by-note";
}

export interface SamplePackProgress {
  status: "idle" | "generating" | "encoding" | "complete" | "error";
  progress: number;     // 0-100%
  currentSample: string;
  totalSamples: number;
  error?: Error;
}

// ============================================================================
// MASTER AUDIO RACK STATE
// ============================================================================

export interface AudioRackState {
  // Engine & Patch
  selectedEngine: EnginePluginType;
  selectedPatchId: string;
  userPatches: PatchPreset[];

  // Master Controls
  masterVolume: number;     // 0-100
  masterDetune: number;     // cents (-120 to +120)

  // Effects
  delayParams: MultiTapDelayParams;
  eqParams: ParametricEQParams;
  distortionParams: DistortionParams;

  // Modulation
  adsr: ADSRParams;
  arpeggiator: ArpeggiatorParams;
  lfos: LFOParams[];

  // Engine-specific params (stored dynamically)
  engineParams: Record<string, any>;

  // UI State
  midiConnected: boolean;
  activeKeyNote: string | null;
  toastMessage: string | null;
  showSaveModal: boolean;

  // Export State
  exportProgress: ExportProgress;
  samplePackProgress: SamplePackProgress;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type AudioRackAction = {
  type: string;
  payload: any;
};

export interface AudioContextInfo {
  sampleRate: number;
  latency: number;
  state: "running" | "suspended" | "closed";
}

export interface MidiNote {
  note: string;
  name: string;
  freq: number;
  isBlack: boolean;
  keyChar: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUDIO_RACK_DEFAULTS: Partial<AudioRackState> = {
  masterVolume: 85,
  masterDetune: 0,
  selectedEngine: "mi_plaits",
  midiConnected: false,
  delayParams: {
    tapCount: 4,
    taps: [
      { id: "1", delayMs: 300, feedback: 40, wetLevel: 70, pan: 0 },
      { id: "2", delayMs: 600, feedback: 35, wetLevel: 60, pan: 30 },
      { id: "3", delayMs: 900, feedback: 30, wetLevel: 50, pan: -30 },
      { id: "4", delayMs: 1200, feedback: 25, wetLevel: 40, pan: 0 },
    ],
    masterMix: 50,
    stereoWidth: 0,
    tempoSync: false,
    bpm: 120,
  },
  eqParams: {
    bands: [
      { id: "1", type: "lowshelf", frequency: 200, gain: 0, q: 0.7 },
      { id: "2", type: "peaking", frequency: 1000, gain: 0, q: 1.0 },
      { id: "3", type: "highshelf", frequency: 5000, gain: 0, q: 0.7 },
    ],
    masterGain: 0,
    enabled: true,
  },
  adsr: {
    attack: 10,
    decay: 100,
    sustain: 70,
    release: 500,
    curveAttack: "exponential",
    curveDecay: "exponential",
    curveRelease: "linear",
  },
  arpeggiator: {
    mode: "up",
    speed: 120,
    octaves: 1,
    gateLength: 100,
    enabled: false,
  },
};

// ============================================================================
// PRESETS & CATEGORIES
// ============================================================================

export const AUDIO_CATEGORIES = [
  "Lead",
  "Bass",
  "Pad",
  "Bell",
  "Pluck",
  "Perc",
  "Keys",
  "Brass",
  "Strings",
  "Vocal",
  "FX",
  "Ambient",
  "Drum",
  "Acid",
  "Retro",
  "Chiptune",
  "Custom",
] as const;

export const AUDIO_ENGINES: Record<EnginePluginType, string> = {
  mi_plaits: "Mutable Instruments Plaits",
  mi_braids: "Mutable Instruments Braids",
  mi_rings: "Mutable Instruments Rings",
  mi_clouds: "Mutable Instruments Clouds",
  mi_elements: "Mutable Instruments Elements",
  dexed_fm: "Dexed FM",
  surge_xt: "Surge XT",
  zynaddsubfx: "ZynAddSubFX",
  helm: "Helm",
  fluidsynth: "FluidSynth",
  amsynth: "AMSynth",
  amy_engine: "Amy Engine",
  pl_synth: "PL Synth (Chiptune)",
  open303: "Open303 (Acid)",
  faust_dsp: "Faust DSP",
  drum_machine: "Boîte à Rythmes",
  vocoder_dsp: "Vocodeur Spectral",
  string_machine: "String Machine",
  organ_drawbars: "Orgue à Tirettes",
  phase_distortion: "Phase Distortion",
};
