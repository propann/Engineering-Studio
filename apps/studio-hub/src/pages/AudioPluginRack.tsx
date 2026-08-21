import { createLogger } from "@studio-hub/audio-bridge";
const log = createLogger("AudioRack");
"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { RackDiagnostic, type DiagnosticHandle } from "../components/RackDiagnostic";
import { RackToast, type ToastHandle } from "../components/RackToast";
import "./audio-plugin-rack.css";
import {
  attachLfo,
  buildBitcrushCurve,
  buildFeedbackLoop,
  buildImpulseResponse,
  buildPulseWave,
  buildSaturationCurve,
} from "@studio-hub/core/audio/dsp";
import { PatchSearchEngine } from "../modules/audio-rack-01-patch-search/PatchSearchEngine";
import {
  ajouterEtMedianer,
  attenteFile,
  composerLatence,
  libelleLatence,
} from "@studio-hub/core/audio/latence";

type EnginePluginType =
  // MUTABLE INSTRUMENTS EURORACK SUITE
  | "mi_plaits"
  | "mi_braids"
  | "mi_rings"
  | "mi_clouds"
  | "mi_elements"
  // TOP 10 GIT OPEN SOURCE ENGINES
  | "dexed_fm"
  | "surge_xt"
  | "zynaddsubfx"
  | "helm"
  | "fluidsynth"
  | "amsynth"
  | "amy_engine"
  | "pl_synth"
  | "open303"
  | "faust_dsp";

interface PatchPreset {
  id: string;
  name: string;
  engine: EnginePluginType;
  category: string;
  isUserPatch?: boolean;
  params: Record<string, any>;
}

// COMPREHENSIVE FACTORY PATCH BANK (75+ PRESETS)
const FACTORY_PATCHES: Record<EnginePluginType, PatchPreset[]> = {
  mi_plaits: [
    { id: "pl1", name: "Virtual Analog Saw Lead", engine: "mi_plaits", category: "Lead", params: { plaitsEngine: "V_ANALOG", plaitsHarmonics: 60, plaitsTimbre: 80, plaitsMorph: 50, plaitsDecay: 70 } },
    { id: "pl2", name: "2-OP Glass FM Bell", engine: "mi_plaits", category: "Bell", params: { plaitsEngine: "FM", plaitsHarmonics: 85, plaitsTimbre: 65, plaitsMorph: 40, plaitsDecay: 85 } },
    { id: "pl3", name: "Wavetable 3D Sweep", engine: "mi_plaits", category: "Pad", params: { plaitsEngine: "WAVETABLE", plaitsHarmonics: 40, plaitsTimbre: 90, plaitsMorph: 75, plaitsDecay: 60 } },
    { id: "pl4", name: "Granular Cloud Burst", engine: "mi_plaits", category: "FX", params: { plaitsEngine: "GRAIN", plaitsHarmonics: 70, plaitsTimbre: 50, plaitsMorph: 85, plaitsDecay: 90 } },
    { id: "pl5", name: "Formant Speech Vox", engine: "mi_plaits", category: "Vocal", params: { plaitsEngine: "SPEECH", plaitsHarmonics: 95, plaitsTimbre: 70, plaitsMorph: 60, plaitsDecay: 75 } },
    { id: "pl6", name: "4-Voice Synth Chord", engine: "mi_plaits", category: "Chord", params: { plaitsEngine: "CHORD", plaitsHarmonics: 50, plaitsTimbre: 85, plaitsMorph: 30, plaitsDecay: 65 } },
  ],
  mi_braids: [
    { id: "br1", name: "CS-80 Brass Lead", engine: "mi_braids", category: "Brass", params: { braidsModel: "CS-80 SAW", braidsColor: 70, braidsTimbre: 85, braidsBitDepth: 16 } },
    { id: "br2", name: "Wavetable Scan Wav", engine: "mi_braids", category: "Synth", params: { braidsModel: "WT-SWEEP", braidsColor: 40, braidsTimbre: 90, braidsBitDepth: 12 } },
    { id: "br3", name: "Vowel Formant Choir", engine: "mi_braids", category: "Vocal", params: { braidsModel: "VOWEL FORMANT", braidsColor: 85, braidsTimbre: 60, braidsBitDepth: 16 } },
    { id: "br4", name: "Metallic Bell Strike", engine: "mi_braids", category: "Perc", params: { braidsModel: "BELL HARMONIC", braidsColor: 95, braidsTimbre: 75, braidsBitDepth: 8 } },
    { id: "br5", name: "Sub Harmonic Pulse", engine: "mi_braids", category: "Bass", params: { braidsModel: "CS-80 SAW", braidsColor: 25, braidsTimbre: 40, braidsBitDepth: 16 } },
  ],
  mi_rings: [
    { id: "ri1", name: "Modal Acoustic String", engine: "mi_rings", category: "Pluck", params: { ringsResonatorMode: "STRING", ringsDamping: 35, ringsStructure: 80, ringsBrightness: 70, ringsPosition: 40, ringsPolyphony: 2 } },
    { id: "ri2", name: "Sympathetic Tube Flute", engine: "mi_rings", category: "Wind", params: { ringsResonatorMode: "TUBE", ringsDamping: 60, ringsStructure: 45, ringsBrightness: 80, ringsPosition: 60, ringsPolyphony: 4 } },
    { id: "ri3", name: "Inharmonic Steel Plate", engine: "mi_rings", category: "Bell", params: { ringsResonatorMode: "PLATE", ringsDamping: 20, ringsStructure: 95, ringsBrightness: 85, ringsPosition: 20, ringsPolyphony: 1 } },
    { id: "ri4", name: "Damped Nylon Guitar", engine: "mi_rings", category: "Pluck", params: { ringsResonatorMode: "STRING", ringsDamping: 85, ringsStructure: 20, ringsBrightness: 45, ringsPosition: 30, ringsPolyphony: 2 } },
    { id: "ri5", name: "Resonant Glass Glocken", engine: "mi_rings", category: "Bell", params: { ringsResonatorMode: "PLATE", ringsDamping: 10, ringsStructure: 90, ringsBrightness: 95, ringsPosition: 50, ringsPolyphony: 4 } },
  ],
  mi_clouds: [
    { id: "cl1", name: "Granular Ether Cloud", engine: "mi_clouds", category: "Pad", params: { cloudsGranularDensity: 90, cloudsPitchShift: 7, cloudsTexture: 80, cloudsPosition: 50, cloudsFeedback: 65, cloudsReverb: 80 } },
    { id: "cl2", name: "Time Stretch Glitch", engine: "mi_clouds", category: "FX", params: { cloudsGranularDensity: 40, cloudsPitchShift: -12, cloudsTexture: 95, cloudsPosition: 25, cloudsFeedback: 85, cloudsReverb: 40 } },
    { id: "cl3", name: "Ambient Freeze Reverb", engine: "mi_clouds", category: "Ambient", params: { cloudsGranularDensity: 75, cloudsPitchShift: 0, cloudsTexture: 60, cloudsPosition: 80, cloudsFeedback: 90, cloudsReverb: 95 } },
    { id: "cl4", name: "Sub Pitch Shifter Drone", engine: "mi_clouds", category: "Drone", params: { cloudsGranularDensity: 85, cloudsPitchShift: -24, cloudsTexture: 40, cloudsPosition: 10, cloudsFeedback: 70, cloudsReverb: 60 } },
    { id: "cl5", name: "Shimmer Octave Up", engine: "mi_clouds", category: "Lead", params: { cloudsGranularDensity: 95, cloudsPitchShift: 12, cloudsTexture: 90, cloudsPosition: 60, cloudsFeedback: 50, cloudsReverb: 85 } },
  ],
  mi_elements: [
    { id: "el1", name: "Percussive Strike Modal", engine: "mi_elements", category: "Perc", params: { elementsGeometry: 65, elementsBrightness: 85, elementsDamping: 40, elementsPitch: 0, elementsExciter: 80, elementsStrike: 90 } },
    { id: "el2", name: "Resonant Bowed Metal", engine: "mi_elements", category: "Pluck", params: { elementsGeometry: 30, elementsBrightness: 60, elementsDamping: 80, elementsPitch: 5, elementsExciter: 40, elementsStrike: 30 } },
    { id: "el3", name: "Tribal Wood Block", engine: "mi_elements", category: "Perc", params: { elementsGeometry: 90, elementsBrightness: 30, elementsDamping: 90, elementsPitch: 12, elementsExciter: 95, elementsStrike: 85 } },
    { id: "el4", name: "Etheric Chime Choir", engine: "mi_elements", category: "Pad", params: { elementsGeometry: 40, elementsBrightness: 90, elementsDamping: 20, elementsPitch: -7, elementsExciter: 20, elementsStrike: 10 } },
    { id: "el5", name: "Sub Impact Shell", engine: "mi_elements", category: "Bass", params: { elementsGeometry: 80, elementsBrightness: 20, elementsDamping: 50, elementsPitch: -12, elementsExciter: 90, elementsStrike: 100 } },
  ],
  dexed_fm: [
    { id: "dx1", name: "80s DX7 Electric Piano", engine: "dexed_fm", category: "Keys", params: { dxAlgorithm: 5, dxOp1Ratio: 1.0, dxOp2Ratio: 2.0, dxFeedback: 6, dxAttack: 2, dxDecay: 75 } },
    { id: "dx2", name: "Solid FM Bass", engine: "dexed_fm", category: "Bass", params: { dxAlgorithm: 1, dxOp1Ratio: 0.5, dxOp2Ratio: 1.0, dxFeedback: 9, dxAttack: 0, dxDecay: 60 } },
    { id: "dx3", name: "Glass Mallet Bell", engine: "dexed_fm", category: "Bell", params: { dxAlgorithm: 8, dxOp1Ratio: 1.0, dxOp2Ratio: 3.5, dxFeedback: 4, dxAttack: 0, dxDecay: 85 } },
    { id: "dx4", name: "FM Brass Horns", engine: "dexed_fm", category: "Brass", params: { dxAlgorithm: 12, dxOp1Ratio: 1.0, dxOp2Ratio: 1.0, dxFeedback: 7, dxAttack: 10, dxDecay: 65 } },
    { id: "dx5", name: "Harpsichord FM Digital", engine: "dexed_fm", category: "Keys", params: { dxAlgorithm: 3, dxOp1Ratio: 2.0, dxOp2Ratio: 4.0, dxFeedback: 8, dxAttack: 0, dxDecay: 40 } },
  ],
  surge_xt: [
    { id: "su1", name: "Acid Wavetable Lead", engine: "surge_xt", category: "Lead", params: { surgeWavetable: "Acid-Wav", surgeMorph: 75, surgeCutoff: 4200, surgeReso: 65, surgeSub: 40, surgeDrive: 30 } },
    { id: "su2", name: "Digital Vector Pad", engine: "surge_xt", category: "Pad", params: { surgeWavetable: "Basic Vector", surgeMorph: 35, surgeCutoff: 2800, surgeReso: 25, surgeSub: 10, surgeDrive: 0 } },
    { id: "su3", name: "Digital Bell Table", engine: "surge_xt", category: "Bell", params: { surgeWavetable: "Digital Bell", surgeMorph: 85, surgeCutoff: 6500, surgeReso: 80, surgeSub: 0, surgeDrive: 20 } },
    { id: "su4", name: "Formant Vocal Choir", engine: "surge_xt", category: "Vocal", params: { surgeWavetable: "Vocal Formant", surgeMorph: 50, surgeCutoff: 3200, surgeReso: 45, surgeSub: 20, surgeDrive: 10 } },
    { id: "su5", name: "Overdriven Sub Bass", engine: "surge_xt", category: "Bass", params: { surgeWavetable: "Acid-Wav", surgeMorph: 90, surgeCutoff: 1400, surgeReso: 75, surgeSub: 90, surgeDrive: 80 } },
  ],
  zynaddsubfx: [
    { id: "zy1", name: "Celestial Organ Pad", engine: "zynaddsubfx", category: "Pad", params: { zynHarmonics: 12, zynBandwidth: 85, zynSubBoost: 40, zynReso: 45, zynFilterType: "lowpass", zynReverbSend: 60 } },
    { id: "zy2", name: "Additive Synth Solo", engine: "zynaddsubfx", category: "Lead", params: { zynHarmonics: 24, zynBandwidth: 40, zynSubBoost: 10, zynReso: 80, zynFilterType: "bandpass", zynReverbSend: 30 } },
    { id: "zy3", name: "Sub harmonic Pipe Organ", engine: "zynaddsubfx", category: "Keys", params: { zynHarmonics: 32, zynBandwidth: 95, zynSubBoost: 80, zynReso: 20, zynFilterType: "lowpass", zynReverbSend: 70 } },
    { id: "zy4", name: "Resonant Notch Sweep", engine: "zynaddsubfx", category: "FX", params: { zynHarmonics: 8, zynBandwidth: 20, zynSubBoost: 0, zynReso: 90, zynFilterType: "highpass", zynReverbSend: 50 } },
    { id: "zy5", name: "Warm Analog Brass", engine: "zynaddsubfx", category: "Brass", params: { zynHarmonics: 16, zynBandwidth: 60, zynSubBoost: 30, zynReso: 35, zynFilterType: "lowpass", zynReverbSend: 25 } },
  ],
  helm: [
    { id: "he1", name: "Crossmod Pulse Lead", engine: "helm", category: "Lead", params: { helmCrossmod: 60, helmCutoff: 2800, helmLfoSpeed: 4.5, helmSubOct: 50, helmReverb: 40 } },
    { id: "he2", name: "Deep Sub Bass", engine: "helm", category: "Bass", params: { helmCrossmod: 15, helmCutoff: 1200, helmLfoSpeed: 0.5, helmSubOct: 90, helmReverb: 10 } },
    { id: "he3", name: "LFO Wobble Synth", engine: "helm", category: "Lead", params: { helmCrossmod: 80, helmCutoff: 3500, helmLfoSpeed: 12.0, helmSubOct: 30, helmReverb: 20 } },
    { id: "he4", name: "Space Ambient Reverb", engine: "helm", category: "Pad", params: { helmCrossmod: 25, helmCutoff: 2200, helmLfoSpeed: 1.2, helmSubOct: 20, helmReverb: 90 } },
    { id: "he5", name: "Aggressive Saw Stab", engine: "helm", category: "Stab", params: { helmCrossmod: 95, helmCutoff: 5000, helmLfoSpeed: 8.0, helmSubOct: 60, helmReverb: 15 } },
  ],
  fluidsynth: [
    { id: "fl1", name: "Concert Grand Piano SF2", engine: "fluidsynth", category: "Piano", params: { fluidPreset: "Acoustic Grand Piano", fluidReverb: 60, fluidChorus: 30, fluidVolume: 90, fluidPan: 50 } },
    { id: "fl2", name: "Stage Rhodes EP SF2", engine: "fluidsynth", category: "Keys", params: { fluidPreset: "Electric Piano Rhodes", fluidReverb: 40, fluidChorus: 60, fluidVolume: 85, fluidPan: 50 } },
    { id: "fl3", name: "Cathedral Pipe Organ SF2", engine: "fluidsynth", category: "Organ", params: { fluidPreset: "Church Pipe Organ", fluidReverb: 85, fluidChorus: 10, fluidVolume: 95, fluidPan: 50 } },
    { id: "fl4", name: "Symphonic Strings SF2", engine: "fluidsynth", category: "Strings", params: { fluidPreset: "Symphonic Strings", fluidReverb: 75, fluidChorus: 45, fluidVolume: 80, fluidPan: 50 } },
    { id: "fl5", name: "Wide Stereo Rhodes SF2", engine: "fluidsynth", category: "Keys", params: { fluidPreset: "Electric Piano Rhodes", fluidReverb: 50, fluidChorus: 90, fluidVolume: 90, fluidPan: 80 } },
  ],
  amsynth: [
    { id: "am1", name: "Moog Sawtooth Lead", engine: "amsynth", category: "Lead", params: { amCutoff: 2800, amReso: 75, amWave: "sawtooth", amSubWave: "square", amLfoDepth: 30, amDecay: 60 } },
    { id: "am2", name: "Analog Square Bass", engine: "amsynth", category: "Bass", params: { amCutoff: 1400, amReso: 50, amWave: "square", amSubWave: "sine", amLfoDepth: 0, amDecay: 40 } },
    { id: "am3", name: "Vibrato Sine Solo", engine: "amsynth", category: "Lead", params: { amCutoff: 4500, amReso: 20, amWave: "sine", amSubWave: "sine", amLfoDepth: 80, amDecay: 85 } },
    { id: "am4", name: "Fat Dual VCO Pluck", engine: "amsynth", category: "Pluck", params: { amCutoff: 2200, amReso: 85, amWave: "sawtooth", amSubWave: "square", amLfoDepth: 10, amDecay: 25 } },
    { id: "am5", name: "Resonant Triangle Lead", engine: "amsynth", category: "Lead", params: { amCutoff: 3600, amReso: 90, amWave: "triangle", amSubWave: "square", amLfoDepth: 45, amDecay: 70 } },
  ],
  amy_engine: [
    { id: "amy1", name: "Additive Spectral Bell", engine: "amy_engine", category: "Bell", params: { amyPartialCount: 24, amySlope: 50, amySpread: 70, amyFeedback: 30, amyNoise: 10 } },
    { id: "amy2", name: "Subharmonic Sine Pad", engine: "amy_engine", category: "Pad", params: { amyPartialCount: 12, amySlope: 85, amySpread: 30, amyFeedback: 10, amyNoise: 0 } },
    { id: "amy3", name: "Dense 64-Partial Organ", engine: "amy_engine", category: "Organ", params: { amyPartialCount: 64, amySlope: 30, amySpread: 90, amyFeedback: 45, amyNoise: 5 } },
    { id: "amy4", name: "Chiptune Noise Pulse", engine: "amy_engine", category: "Retro", params: { amyPartialCount: 8, amySlope: 20, amySpread: 40, amyFeedback: 80, amyNoise: 85 } },
    { id: "amy5", name: "Glassy Additive Sweep", engine: "amy_engine", category: "Lead", params: { amyPartialCount: 32, amySlope: 60, amySpread: 80, amyFeedback: 20, amyNoise: 15 } },
  ],
  pl_synth: [
    { id: "pls1", name: "GameBoy 8-Bit Lead", engine: "pl_synth", category: "Retro", params: { plBitcrush: 4, plSampleRateDiv: 3, plArpSpeed: 12, plDutyCycle: 50, plGlitch: 20 } },
    { id: "pls2", name: "NES Square Chiptune", engine: "pl_synth", category: "Retro", params: { plBitcrush: 8, plSampleRateDiv: 1, plArpSpeed: 16, plDutyCycle: 25, plGlitch: 0 } },
    { id: "pls3", name: "Low-Bit Glitch Monster", engine: "pl_synth", category: "FX", params: { plBitcrush: 2, plSampleRateDiv: 6, plArpSpeed: 24, plDutyCycle: 75, plGlitch: 90 } },
    { id: "pls4", name: "Commodore 64 Arp Bass", engine: "pl_synth", category: "Bass", params: { plBitcrush: 6, plSampleRateDiv: 2, plArpSpeed: 8, plDutyCycle: 50, plGlitch: 10 } },
    { id: "pls5", name: "Retro Arcade Coin FX", engine: "pl_synth", category: "FX", params: { plBitcrush: 3, plSampleRateDiv: 4, plArpSpeed: 20, plDutyCycle: 12, plGlitch: 60 } },
  ],
  open303: [
    { id: "ac1", name: "Acid 303 Resonance Lead", engine: "open303", category: "Acid", params: { acidCutoff: 2400, acidResonance: 92, acidAccent: true, acidTuning: 0, acidEnvMod: 80, acidDecay: 65, acidWave: "sawtooth" } },
    { id: "ac2", name: "Square Acid Sub Bass", engine: "open303", category: "Acid", params: { acidCutoff: 1200, acidResonance: 75, acidAccent: false, acidTuning: -12, acidEnvMod: 50, acidDecay: 45, acidWave: "square" } },
    { id: "ac3", name: "Screaming Acid Lead", engine: "open303", category: "Acid", params: { acidCutoff: 3800, acidResonance: 98, acidAccent: true, acidTuning: 5, acidEnvMod: 95, acidDecay: 85, acidWave: "sawtooth" } },
    { id: "ac4", name: "Low-Pass Acid Pulse", engine: "open303", category: "Acid", params: { acidCutoff: 800, acidResonance: 60, acidAccent: false, acidTuning: 0, acidEnvMod: 30, acidDecay: 35, acidWave: "square" } },
    { id: "ac5", name: "High-Octane Accent Lead", engine: "open303", category: "Acid", params: { acidCutoff: 4500, acidResonance: 88, acidAccent: true, acidTuning: 12, acidEnvMod: 90, acidDecay: 70, acidWave: "sawtooth" } },
  ],
  faust_dsp: [
    { id: "fa1", name: "Faust Wavefolder Distortion", engine: "faust_dsp", category: "FX", params: { faustFreqMod: 75, faustFilter: 3200, faustGain: 80, faustFeedback: 50, faustDrive: 65 } },
    { id: "fa2", name: "Resonant DSP Ringmod", engine: "faust_dsp", category: "FX", params: { faustFreqMod: 40, faustFilter: 1800, faustGain: 50, faustFeedback: 85, faustDrive: 30 } },
    { id: "fa3", name: "Hyper Drive Wavefolder", engine: "faust_dsp", category: "Lead", params: { faustFreqMod: 90, faustFilter: 5500, faustGain: 95, faustFeedback: 75, faustDrive: 90 } },
    { id: "fa4", name: "Low-Pass DSP Sub Drive", engine: "faust_dsp", category: "Bass", params: { faustFreqMod: 20, faustFilter: 1100, faustGain: 60, faustFeedback: 20, faustDrive: 40 } },
    { id: "fa5", name: "Feedback Distortion Swarm", engine: "faust_dsp", category: "FX", params: { faustFreqMod: 85, faustFilter: 2800, faustGain: 85, faustFeedback: 95, faustDrive: 80 } },
  ],
};

// PIANO KEYS CONFIGURATION FOR VIRTUAL KEYBOARD
const VIRTUAL_PIANO_KEYS = [
  { note: "C4", name: "Do", freq: 261.63, isBlack: false, keyChar: "A" },
  { note: "C#4", name: "Do#", freq: 277.18, isBlack: true, keyChar: "W" },
  { note: "D4", name: "Ré", freq: 293.66, isBlack: false, keyChar: "S" },
  { note: "D#4", name: "Ré#", freq: 311.13, isBlack: true, keyChar: "E" },
  { note: "E4", name: "Mi", freq: 329.63, isBlack: false, keyChar: "D" },
  { note: "F4", name: "Fa", freq: 349.23, isBlack: false, keyChar: "F" },
  { note: "F#4", name: "Fa#", freq: 369.99, isBlack: true, keyChar: "T" },
  { note: "G4", name: "Sol", freq: 392.00, isBlack: false, keyChar: "G" },
  { note: "G#4", name: "Sol#", freq: 415.30, isBlack: true, keyChar: "Y" },
  { note: "A4", name: "La", freq: 440.00, isBlack: false, keyChar: "H" },
  { note: "A#4", name: "La#", freq: 466.16, isBlack: true, keyChar: "U" },
  { note: "B4", name: "Si", freq: 493.88, isBlack: false, keyChar: "J" },
  { note: "C5", name: "Do", freq: 523.25, isBlack: false, keyChar: "K" },
];
export default function AudioPluginRack({ profileName = "NOUVEAU MEMBRE", onClose }: { profileName?: string; onClose?: () => void }) {
  const [activeEngine, setActiveEngine] = useState<EnginePluginType>("mi_plaits");
  const [selectedPatchId, setSelectedPatchId] = useState<string>("pl1");
  // Filtre de la liste de patches. 91 patches d'usine repartis sur 15 moteurs,
  // qu'on ne pouvait jusqu'ici que faire defiler.
  //
  // Un rendu du rack par frappe : acceptable ici, contrairement aux valeurs
  // extraites dans RackDiagnostic/RackToast. Celles-la etaient ecrites A CHAQUE
  // NOTE, sur le fil qui programme l'audio. On ne tape pas au clavier de
  // recherche en jouant.
  const [patchQuery, setPatchQuery] = useState<string>("");
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string>("");
  // Diagnostic visible : on debuggait a l'aveugle via la console.
  // Le bandeau de diagnostic porte son propre etat et s'actualise par
  // reference. Ces quatre valeurs vivaient ici : chaque note jouee et chaque
  // message MIDI recu declenchait alors un rendu des 1160 lignes de JSX du
  // rack — sur le fil qui programme aussi les evenements Web Audio.
  const diagRef = useRef<DiagnosticHandle>(null);
  const [activeKeyNote, setActiveKeyNote] = useState<string | null>(null);

  // USER CUSTOM SAVED PATCHES PERSISTED IN LOCALSTORAGE
  const [userPatches, setUserPatches] = useState<PatchPreset[]>(() => {
    try {
      const saved = localStorage.getItem("studio_hub_user_patches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newPatchName, setNewPatchName] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  // MASTER CONTROLS
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [masterDetune, setMasterDetune] = useState<number>(0);

  // DEXED FM PARAMS
  const [dxAlgorithm, setDxAlgorithm] = useState<number>(5);
  const [dxOp1Ratio, setDxOp1Ratio] = useState<number>(1.0);
  const [dxOp2Ratio, setDxOp2Ratio] = useState<number>(2.0);
  const [dxFeedback, setDxFeedback] = useState<number>(6);
  const [dxAttack, setDxAttack] = useState<number>(2);
  const [dxDecay, setDxDecay] = useState<number>(75);

  // SURGE XT PARAMS
  const [surgeWavetable, setSurgeWavetable] = useState<string>("Acid-Wav");
  const [surgeMorph, setSurgeMorph] = useState<number>(75);
  const [surgeCutoff, setSurgeCutoff] = useState<number>(4200);
  const [surgeReso, setSurgeReso] = useState<number>(65);
  const [surgeSub, setSurgeSub] = useState<number>(40);
  const [surgeDrive, setSurgeDrive] = useState<number>(30);

  // ZYNADDSUBFX PARAMS
  const [zynHarmonics, setZynHarmonics] = useState<number>(12);
  const [zynBandwidth, setZynBandwidth] = useState<number>(85);
  const [zynSubBoost, setZynSubBoost] = useState<number>(40);
  const [zynReso, setZynReso] = useState<number>(45);
  const [zynFilterType, setZynFilterType] = useState<string>("lowpass");
  const [zynReverbSend, setZynReverbSend] = useState<number>(60);

  // HELM PARAMS
  const [helmCrossmod, setHelmCrossmod] = useState<number>(60);
  const [helmCutoff, setHelmCutoff] = useState<number>(2800);
  const [helmLfoSpeed, setHelmLfoSpeed] = useState<number>(4.5);
  const [helmSubOct, setHelmSubOct] = useState<number>(50);
  const [helmReverb, setHelmReverb] = useState<number>(40);

  // FLUIDSYNTH SF2 PARAMS
  const [fluidPreset, setFluidPreset] = useState<string>("Acoustic Grand Piano");
  const [fluidReverb, setFluidReverb] = useState<number>(60);
  const [fluidChorus, setFluidChorus] = useState<number>(30);
  const [fluidVolume, setFluidVolume] = useState<number>(90);
  const [fluidPan, setFluidPan] = useState<number>(50);

  // AMSYNTH PARAMS
  const [amCutoff, setAmCutoff] = useState<number>(2800);
  const [amReso, setAmReso] = useState<number>(75);
  const [amWave, setAmWave] = useState<string>("sawtooth");
  const [amSubWave, setAmSubWave] = useState<string>("square");
  const [amLfoDepth, setAmLfoDepth] = useState<number>(30);
  const [amDecay, setAmDecay] = useState<number>(60);

  // AMY PARAMS
  const [amyPartialCount, setAmyPartialCount] = useState<number>(24);
  const [amySlope, setAmySlope] = useState<number>(50);
  const [amySpread, setAmySpread] = useState<number>(70);
  const [amyFeedback, setAmyFeedback] = useState<number>(30);
  const [amyNoise, setAmyNoise] = useState<number>(10);

  // PL_SYNTH PARAMS
  const [plBitcrush, setPlBitcrush] = useState<number>(4);
  const [plSampleRateDiv, setPlSampleRateDiv] = useState<number>(3);
  const [plArpSpeed, setPlArpSpeed] = useState<number>(12);
  const [plDutyCycle, setPlDutyCycle] = useState<number>(50);
  const [plGlitch, setPlGlitch] = useState<number>(20);

  // OPEN303 ACID PARAMS
  const [acidCutoff, setAcidCutoff] = useState<number>(2400);
  const [acidResonance, setAcidResonance] = useState<number>(92);
  const [acidAccent, setAcidAccent] = useState<boolean>(true);
  const [acidTuning, setAcidTuning] = useState<number>(0);
  const [acidEnvMod, setAcidEnvMod] = useState<number>(80);
  const [acidDecay, setAcidDecay] = useState<number>(65);
  const [acidWave, setAcidWave] = useState<string>("sawtooth");

  // FAUST DSP PARAMS
  const [faustFreqMod, setFaustFreqMod] = useState<number>(75);
  const [faustFilter, setFaustFilter] = useState<number>(3200);
  const [faustGain, setFaustGain] = useState<number>(80);
  const [faustFeedback, setFaustFeedback] = useState<number>(50);
  const [faustDrive, setFaustDrive] = useState<number>(65);

  // MUTABLE PLAITS PARAMS
  const [plaitsEngine, setPlaitsEngine] = useState<"V_ANALOG" | "FM" | "WAVETABLE" | "GRAIN" | "SPEECH" | "CHORD">("V_ANALOG");
  const [plaitsHarmonics, setPlaitsHarmonics] = useState<number>(60);
  const [plaitsTimbre, setPlaitsTimbre] = useState<number>(80);
  const [plaitsMorph, setPlaitsMorph] = useState<number>(50);
  const [plaitsDecay, setPlaitsDecay] = useState<number>(70);

  // MUTABLE BRAIDS PARAMS
  const [braidsModel, setBraidsModel] = useState<string>("CS-80 SAW");
  const [braidsColor, setBraidsColor] = useState<number>(70);
  const [braidsTimbre, setBraidsTimbre] = useState<number>(85);
  const [braidsBitDepth, setBraidsBitDepth] = useState<number>(16);

  // MUTABLE RINGS PARAMS
  const [ringsResonatorMode, setRingsResonatorMode] = useState<"STRING" | "TUBE" | "PLATE">("STRING");
  const [ringsDamping, setRingsDamping] = useState<number>(35);
  const [ringsStructure, setRingsStructure] = useState<number>(80);
  const [ringsBrightness, setRingsBrightness] = useState<number>(70);
  const [ringsPosition, setRingsPosition] = useState<number>(40);
  const [ringsPolyphony, setRingsPolyphony] = useState<number>(2);

  // MUTABLE CLOUDS PARAMS
  const [cloudsGranularDensity, setCloudsGranularDensity] = useState<number>(90);
  const [cloudsPitchShift, setCloudsPitchShift] = useState<number>(7);
  const [cloudsTexture, setCloudsTexture] = useState<number>(80);
  const [cloudsPosition, setCloudsPosition] = useState<number>(50);
  const [cloudsFeedback, setCloudsFeedback] = useState<number>(65);
  const [cloudsReverb, setCloudsReverb] = useState<number>(80);

  // MUTABLE ELEMENTS PARAMS
  const [elementsGeometry, setElementsGeometry] = useState<number>(65);
  const [elementsBrightness, setElementsBrightness] = useState<number>(85);
  const [elementsDamping, setElementsDamping] = useState<number>(40);
  const [elementsPitch, setElementsPitch] = useState<number>(0);
  const [elementsExciter, setElementsExciter] = useState<number>(80);
  const [elementsStrike, setElementsStrike] = useState<number>(90);

  // ALWAYS-UP-TO-DATE PARAMETER REF (SYNCHRONOUS ACCESS FOR REAL-TIME AUDIO)
  const paramsRef = useRef({
    activeEngine,
    masterVolume,
    masterDetune,
    plaitsEngine, plaitsHarmonics, plaitsTimbre, plaitsMorph, plaitsDecay,
    braidsModel, braidsColor, braidsTimbre, braidsBitDepth,
    ringsResonatorMode, ringsDamping, ringsStructure, ringsBrightness, ringsPosition, ringsPolyphony,
    cloudsGranularDensity, cloudsPitchShift, cloudsTexture, cloudsPosition, cloudsFeedback, cloudsReverb,
    elementsGeometry, elementsBrightness, elementsDamping, elementsPitch, elementsExciter, elementsStrike,
    dxAlgorithm, dxOp1Ratio, dxOp2Ratio, dxFeedback, dxAttack, dxDecay,
    surgeWavetable, surgeMorph, surgeCutoff, surgeReso, surgeSub, surgeDrive,
    zynHarmonics, zynBandwidth, zynSubBoost, zynReso, zynFilterType, zynReverbSend,
    helmCrossmod, helmCutoff, helmLfoSpeed, helmSubOct, helmReverb,
    fluidPreset, fluidReverb, fluidChorus, fluidVolume, fluidPan,
    amCutoff, amReso, amWave, amSubWave, amLfoDepth, amDecay,
    amyPartialCount, amySlope, amySpread, amyFeedback, amyNoise,
    plBitcrush, plSampleRateDiv, plArpSpeed, plDutyCycle, plGlitch,
    acidCutoff, acidResonance, acidAccent, acidTuning, acidEnvMod, acidDecay, acidWave,
    faustFreqMod, faustFilter, faustGain, faustFeedback, faustDrive,
  });

  // KEEP REF SYNCED WITH STATE
  useEffect(() => {
    paramsRef.current = {
      activeEngine,
      masterVolume,
      masterDetune,
      plaitsEngine, plaitsHarmonics, plaitsTimbre, plaitsMorph, plaitsDecay,
      braidsModel, braidsColor, braidsTimbre, braidsBitDepth,
      ringsResonatorMode, ringsDamping, ringsStructure, ringsBrightness, ringsPosition, ringsPolyphony,
      cloudsGranularDensity, cloudsPitchShift, cloudsTexture, cloudsPosition, cloudsFeedback, cloudsReverb,
      elementsGeometry, elementsBrightness, elementsDamping, elementsPitch, elementsExciter, elementsStrike,
      dxAlgorithm, dxOp1Ratio, dxOp2Ratio, dxFeedback, dxAttack, dxDecay,
      surgeWavetable, surgeMorph, surgeCutoff, surgeReso, surgeSub, surgeDrive,
      zynHarmonics, zynBandwidth, zynSubBoost, zynReso, zynFilterType, zynReverbSend,
      helmCrossmod, helmCutoff, helmLfoSpeed, helmSubOct, helmReverb,
      fluidPreset, fluidReverb, fluidChorus, fluidVolume, fluidPan,
      amCutoff, amReso, amWave, amSubWave, amLfoDepth, amDecay,
      amyPartialCount, amySlope, amySpread, amyFeedback, amyNoise,
      plBitcrush, plSampleRateDiv, plArpSpeed, plDutyCycle, plGlitch,
      acidCutoff, acidResonance, acidAccent, acidTuning, acidEnvMod, acidDecay, acidWave,
      faustFreqMod, faustFilter, faustGain, faustFeedback, faustDrive,
    };
  });

  // Web Audio Context & Oscilloscope
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // ---------------------------------------------------------------------
  // CHAÎNE AUDIO PERSISTANTE
  //
  //   [moteur DSP] -> masterGain (volume) -> env (ADSR Tone) -> masterBus
  //                                                                |
  //                                                    analyser --+-> sortie
  //
  // Tout est en Web Audio natif. Une tentative d'utiliser
  // Tone.AmplitudeEnvelope a échoué : son `.input` est un objet Tone.Gain,
  // pas un AudioNode, donc `nativeNode.connect(env.input)` lève une
  // TypeError — avalée par le try/catch, d'où un silence total.
  // ---------------------------------------------------------------------
  const masterBusRef = useRef<GainNode | null>(null);
  // Réverbération partagée : un seul convolveur pour tout le rack, chaque
  // moteur y envoie via son propre gain auxiliaire. Sert fluidReverb,
  // zynReverbSend, helmReverb et cloudsReverb.
  const reverbRef = useRef<ConvolverNode | null>(null);
  const reverbReturnRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Uint8Array<ArrayBuffer> explicite : getByteTimeDomainData refuse une vue
  // adossée à un SharedArrayBuffer, que le type par défaut autorise.
  const scopeDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Voix actives, indexées par identifiant ("C4", "midi:60"). Permet la
  // polyphonie et le note-off.
  type Voice = {
    env: GainNode;
    release: number;
    sources: AudioScheduledSourceNode[];
    naturalEnd: number; // dernier arrêt de source
  };
  const voicesRef = useRef<Map<string, Voice>>(new Map());

  // Toast Overlay
  // Meme motif que le bandeau : les quinze moteurs appellent showToast a
  // chaque note, ce qui provoquait deux rendus complets du rack — un a
  // l'affichage, un a l'extinction.
  const toastRef = useRef<ToastHandle>(null);

  const showToast = (msg: string) => toastRef.current?.afficher(msg);

  // Crée le contexte au premier appel et garantit que le bus existe.
  // resume() exige un geste utilisateur : tous les appelants viennent d'un
  // clic ou d'une frappe clavier.
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    const ctx = audioCtxRef.current;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    if (!masterBusRef.current) {
      const bus = ctx.createGain();
      bus.gain.value = 1;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;

      bus.connect(analyser);
      analyser.connect(ctx.destination);

      // Retour de réverbération : convolveur -> gain de retour -> bus.
      const reverb = ctx.createConvolver();
      reverb.buffer = buildImpulseResponse(ctx, 2.6, 2.4);
      const reverbReturn = ctx.createGain();
      reverbReturn.gain.value = 1;
      reverb.connect(reverbReturn);
      reverbReturn.connect(bus);

      masterBusRef.current = bus;
      analyserRef.current = analyser;
      reverbRef.current = reverb;
      reverbReturnRef.current = reverbReturn;
      scopeDataRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      log.info("Master bus + analyser created", { sampleRate: ctx.sampleRate });
    }

    audioCtxRef.current = ctx;
    return ctx;
  };

  // Coupe une voix : déclenche le release de l'enveloppe puis arrête les
  // sources une fois la queue écoulée.
  const releaseVoice = (voiceId: string) => {
    const voice = voicesRef.current.get(voiceId);
    if (!voice) return;
    voicesRef.current.delete(voiceId);

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const t = ctx.currentTime;
    try {
      // On repart de la valeur courante : sans setValueAtTime, la rampe
      // partirait de la dernière valeur *programmée*, pas de l'audible.
      const current = Math.max(0.0001, voice.env.gain.value);
      voice.env.gain.cancelScheduledValues(t);
      voice.env.gain.setValueAtTime(current, t);
      voice.env.gain.exponentialRampToValueAtTime(0.0001, t + voice.release);
    } catch (error) {
      log.warn("release ramp failed", error);
    }

    // Marge = release + sécurité. On ne prolonge jamais au-delà de la durée
    // prévue par le moteur : appeler stop() deux fois est permis, la dernière
    // valeur l'emporte.
    const releaseSec = voice.release;
    const cutAt = Math.min(ctx.currentTime + releaseSec + 0.05, voice.naturalEnd);
    for (const src of voice.sources) {
      try {
        src.stop(cutAt);
      } catch {
        /* déjà arrêtée */
      }
    }
    window.setTimeout(() => {
      try {
        voice.env.disconnect();
      } catch {
        /* déjà détachée */
      }
    }, (releaseSec + 0.3) * 1000);
  };

  // Coupe toutes les voix (changement de moteur, démontage).
  const releaseAllVoices = () => {
    for (const id of Array.from(voicesRef.current.keys())) releaseVoice(id);
  };

  // HELPER TO UPDATE A PARAMETER SYNCHRONOUSLY IN BOTH REF AND STATE + TRIGGER AUDITION
  // Réglage d'un paramètre. Volontairement silencieux : déclencher une note
  // à chaque mouvement de curseur rendait le réglage impraticable.
  // Pour écouter, on joue une touche.
  const updateParam = (key: string, val: any, setter: (v: any) => void) => {
    (paramsRef.current as any)[key] = val;
    setter(val);
  };

  // SAVE CUSTOM USER PATCH TO LOCALSTORAGE
  const saveUserPatch = () => {
    if (!newPatchName.trim()) return;
    const p = paramsRef.current;
    const newPatch: PatchPreset = {
      id: `usr_${Date.now()}`,
      name: newPatchName.trim(),
      engine: p.activeEngine,
      category: "Custom",
      isUserPatch: true,
      params: { ...p },
    };

    const updated = [...userPatches, newPatch];
    setUserPatches(updated);
    try {
      localStorage.setItem("studio_hub_user_patches", JSON.stringify(updated));
    } catch (e) {
      log.error('Failed to save patch', e);
    }

    setNewPatchName("");
    setShowSaveModal(false);
    setSelectedPatchId(newPatch.id);
    showToast(`💾 NOUVEAU PATCH ENREGISTRÉ : ${newPatch.name.toUpperCase()}`);
  };

  // APPLY PATCH PRESET WITH SYNCHRONOUS REF UPDATE & SOUND AUDITION
  /**
   * Filtre la liste de patches d'un moteur selon la recherche courante.
   *
   * S'appuie sur PatchSearchEngine plutot que sur un `includes()` maison : il
   * cherche deja dans le nom, la categorie et les etiquettes, avec un
   * classement par pertinence, et il est couvert par ses propres tests.
   * Il etait ecrit et teste mais n'avait jamais ete branche a rien.
   *
   * Instancie a la demande : un seul moteur est deplie a la fois, et l'index
   * porte sur quelques dizaines d'entrees.
   */
  const filtrerPatches = (liste: PatchPreset[]): PatchPreset[] => {
    const q = patchQuery.trim();
    if (!q) return liste;
    return new PatchSearchEngine(liste).search(q);
  };

  /**
   * Latence d'une note MIDI, du message recu jusqu'au son.
   *
   * Trois segments distincts, qu'il faut mesurer separement parce qu'on n'agit
   * pas sur les memes choses :
   *
   *   file    — du message recu par le navigateur a l'entree du gestionnaire.
   *             C'est la file d'attente du fil principal : un rendu long la
   *             gonfle. C'est le seul segment que le code du rack peut degrader.
   *   trait.  — le temps passe dans playPluginNote, a construire le graphe et
   *             a programmer les evenements.
   *   sortie  — baseLatency + outputLatency : la memoire tampon audio, imposee
   *             par le navigateur et le peripherique. Irreductible ici.
   *
   * Le transport MIDI en amont a ete mesure hors navigateur et vaut 16,7 µs par
   * message en salve — voir docs/MESURE_LATENCE_MIDI.md. Il est negligeable, ce
   * qui rend ces trois segments-ci le budget reel.
   *
   * On affiche une MEDIANE glissante. Une valeur isolee ne dit rien : le fil
   * principal fait aussi tourner React et le ramasse-miettes, et un maximum
   * ponctuel de 30 ms ne signifie pas que le rack est lent.
   */
  const latencesRef = useRef<number[]>([]);
  const mesurerLatence = (tEntree: number, tMessage: number | undefined) => {
    try {
      const ctx = getAudioContext();
      const segments = composerLatence(
        attenteFile(tEntree, tMessage),
        performance.now() - tEntree,
        (ctx.baseLatency ?? 0) + ((ctx as any).outputLatency ?? 0)
      );
      const mediane = ajouterEtMedianer(latencesRef.current, segments.total);
      diagRef.current?.setLatence(libelleLatence(segments, mediane, latencesRef.current.length));
    } catch {
      // La mesure ne doit jamais empecher de jouer.
    }
  };

  const applyPatch = (patch: PatchPreset) => {
    setSelectedPatchId(patch.id);
    setActiveEngine(patch.engine);
    paramsRef.current.activeEngine = patch.engine;
    const p = patch.params;

    // SYNCHRONOUSLY UPDATE PARAMS REF TO PREVENT STALE PLAYBACK
    Object.keys(p).forEach((k) => {
      (paramsRef.current as any)[k] = p[k];
    });

    if (patch.engine === "dexed_fm") {
      if (p.dxAlgorithm !== undefined) setDxAlgorithm(p.dxAlgorithm);
      if (p.dxOp1Ratio !== undefined) setDxOp1Ratio(p.dxOp1Ratio);
      if (p.dxOp2Ratio !== undefined) setDxOp2Ratio(p.dxOp2Ratio);
      if (p.dxFeedback !== undefined) setDxFeedback(p.dxFeedback);
      if (p.dxAttack !== undefined) setDxAttack(p.dxAttack);
      if (p.dxDecay !== undefined) setDxDecay(p.dxDecay);
    } else if (patch.engine === "surge_xt") {
      if (p.surgeWavetable !== undefined) setSurgeWavetable(p.surgeWavetable);
      if (p.surgeMorph !== undefined) setSurgeMorph(p.surgeMorph);
      if (p.surgeCutoff !== undefined) setSurgeCutoff(p.surgeCutoff);
      if (p.surgeReso !== undefined) setSurgeReso(p.surgeReso);
      if (p.surgeSub !== undefined) setSurgeSub(p.surgeSub);
      if (p.surgeDrive !== undefined) setSurgeDrive(p.surgeDrive);
    } else if (patch.engine === "zynaddsubfx") {
      if (p.zynHarmonics !== undefined) setZynHarmonics(p.zynHarmonics);
      if (p.zynBandwidth !== undefined) setZynBandwidth(p.zynBandwidth);
      if (p.zynSubBoost !== undefined) setZynSubBoost(p.zynSubBoost);
      if (p.zynReso !== undefined) setZynReso(p.zynReso);
      if (p.zynFilterType !== undefined) setZynFilterType(p.zynFilterType);
      if (p.zynReverbSend !== undefined) setZynReverbSend(p.zynReverbSend);
    } else if (patch.engine === "helm") {
      if (p.helmCrossmod !== undefined) setHelmCrossmod(p.helmCrossmod);
      if (p.helmCutoff !== undefined) setHelmCutoff(p.helmCutoff);
      if (p.helmLfoSpeed !== undefined) setHelmLfoSpeed(p.helmLfoSpeed);
      if (p.helmSubOct !== undefined) setHelmSubOct(p.helmSubOct);
      if (p.helmReverb !== undefined) setHelmReverb(p.helmReverb);
    } else if (patch.engine === "fluidsynth") {
      if (p.fluidPreset !== undefined) setFluidPreset(p.fluidPreset);
      if (p.fluidReverb !== undefined) setFluidReverb(p.fluidReverb);
      if (p.fluidChorus !== undefined) setFluidChorus(p.fluidChorus);
      if (p.fluidVolume !== undefined) setFluidVolume(p.fluidVolume);
      if (p.fluidPan !== undefined) setFluidPan(p.fluidPan);
    } else if (patch.engine === "amsynth") {
      if (p.amCutoff !== undefined) setAmCutoff(p.amCutoff);
      if (p.amReso !== undefined) setAmReso(p.amReso);
      if (p.amWave !== undefined) setAmWave(p.amWave);
      if (p.amSubWave !== undefined) setAmSubWave(p.amSubWave);
      if (p.amLfoDepth !== undefined) setAmLfoDepth(p.amLfoDepth);
      if (p.amDecay !== undefined) setAmDecay(p.amDecay);
    } else if (patch.engine === "amy_engine") {
      if (p.amyPartialCount !== undefined) setAmyPartialCount(p.amyPartialCount);
      if (p.amySlope !== undefined) setAmySlope(p.amySlope);
      if (p.amySpread !== undefined) setAmySpread(p.amySpread);
      if (p.amyFeedback !== undefined) setAmyFeedback(p.amyFeedback);
      if (p.amyNoise !== undefined) setAmyNoise(p.amyNoise);
    } else if (patch.engine === "pl_synth") {
      if (p.plBitcrush !== undefined) setPlBitcrush(p.plBitcrush);
      if (p.plSampleRateDiv !== undefined) setPlSampleRateDiv(p.plSampleRateDiv);
      if (p.plArpSpeed !== undefined) setPlArpSpeed(p.plArpSpeed);
      if (p.plDutyCycle !== undefined) setPlDutyCycle(p.plDutyCycle);
      if (p.plGlitch !== undefined) setPlGlitch(p.plGlitch);
    } else if (patch.engine === "open303") {
      if (p.acidCutoff !== undefined) setAcidCutoff(p.acidCutoff);
      if (p.acidResonance !== undefined) setAcidResonance(p.acidResonance);
      if (p.acidAccent !== undefined) setAcidAccent(p.acidAccent);
      if (p.acidTuning !== undefined) setAcidTuning(p.acidTuning);
      if (p.acidEnvMod !== undefined) setAcidEnvMod(p.acidEnvMod);
      if (p.acidDecay !== undefined) setAcidDecay(p.acidDecay);
      if (p.acidWave !== undefined) setAcidWave(p.acidWave);
    } else if (patch.engine === "faust_dsp") {
      if (p.faustFreqMod !== undefined) setFaustFreqMod(p.faustFreqMod);
      if (p.faustFilter !== undefined) setFaustFilter(p.faustFilter);
      if (p.faustGain !== undefined) setFaustGain(p.faustGain);
      if (p.faustFeedback !== undefined) setFaustFeedback(p.faustFeedback);
      if (p.faustDrive !== undefined) setFaustDrive(p.faustDrive);
    } else if (patch.engine === "mi_plaits") {
      if (p.plaitsEngine !== undefined) setPlaitsEngine(p.plaitsEngine);
      if (p.plaitsHarmonics !== undefined) setPlaitsHarmonics(p.plaitsHarmonics);
      if (p.plaitsTimbre !== undefined) setPlaitsTimbre(p.plaitsTimbre);
      if (p.plaitsMorph !== undefined) setPlaitsMorph(p.plaitsMorph);
      if (p.plaitsDecay !== undefined) setPlaitsDecay(p.plaitsDecay);
    } else if (patch.engine === "mi_braids") {
      if (p.braidsModel !== undefined) setBraidsModel(p.braidsModel);
      if (p.braidsColor !== undefined) setBraidsColor(p.braidsColor);
      if (p.braidsTimbre !== undefined) setBraidsTimbre(p.braidsTimbre);
      if (p.braidsBitDepth !== undefined) setBraidsBitDepth(p.braidsBitDepth);
    } else if (patch.engine === "mi_rings") {
      if (p.ringsResonatorMode !== undefined) setRingsResonatorMode(p.ringsResonatorMode);
      if (p.ringsDamping !== undefined) setRingsDamping(p.ringsDamping);
      if (p.ringsStructure !== undefined) setRingsStructure(p.ringsStructure);
      if (p.ringsBrightness !== undefined) setRingsBrightness(p.ringsBrightness);
      if (p.ringsPosition !== undefined) setRingsPosition(p.ringsPosition);
      if (p.ringsPolyphony !== undefined) setRingsPolyphony(p.ringsPolyphony);
    } else if (patch.engine === "mi_clouds") {
      if (p.cloudsGranularDensity !== undefined) setCloudsGranularDensity(p.cloudsGranularDensity);
      if (p.cloudsPitchShift !== undefined) setCloudsPitchShift(p.cloudsPitchShift);
      if (p.cloudsTexture !== undefined) setCloudsTexture(p.cloudsTexture);
      if (p.cloudsPosition !== undefined) setCloudsPosition(p.cloudsPosition);
      if (p.cloudsFeedback !== undefined) setCloudsFeedback(p.cloudsFeedback);
      if (p.cloudsReverb !== undefined) setCloudsReverb(p.cloudsReverb);
    } else if (patch.engine === "mi_elements") {
      if (p.elementsGeometry !== undefined) setElementsGeometry(p.elementsGeometry);
      if (p.elementsBrightness !== undefined) setElementsBrightness(p.elementsBrightness);
      if (p.elementsDamping !== undefined) setElementsDamping(p.elementsDamping);
      if (p.elementsPitch !== undefined) setElementsPitch(p.elementsPitch);
      if (p.elementsExciter !== undefined) setElementsExciter(p.elementsExciter);
      if (p.elementsStrike !== undefined) setElementsStrike(p.elementsStrike);
    }

    showToast(`🎵 PATCH CHARGÉ : ${patch.name.toUpperCase()}`);
  };

  // REAL-TIME DSP SYNTHESIS FOR ALL 15 ENGINES
  // voiceId absent  -> note ponctuelle (attaque puis release automatique)
  // voiceId fourni  -> note tenue jusqu'à releaseVoice(voiceId)
  /**
   * Construit la voix d'une note : le graphe complet du moteur actif, jusqu'a
   * son enveloppe.
   *
   * Elle RECOIT son contexte au lieu d'aller le chercher. C'est toute la
   * difference : le meme code sert desormais un AudioContext vivant, pour
   * jouer, et un OfflineAudioContext, pour rendre un fichier plus vite que le
   * temps reel. Un pack de 60 notes se fabriquait sinon en autant de secondes
   * qu'il dure.
   *
   * Elle ne connecte RIEN a une destination et ne programme aucun relachement :
   * l'appelant branche `env` ou il veut. C'est ce qui permettra de superposer
   * plusieurs moteurs sur une meme note.
   */
  const construireVoix = (
    ctx: BaseAudioContext,
    p: typeof paramsRef.current,
    freq: number,
    now: number
  ) => {
    // Sources créées par le moteur, mémorisées pour pouvoir couper la voix.
    const sources: AudioScheduledSourceNode[] = [];
    const trk = <T extends AudioScheduledSourceNode>(node: T): T => {
      sources.push(node);
      return node;
    };
    // Deux horizons distincts, à ne pas confondre :
    //  - naturalEnd : dernier arrêt de source.
    //  - audibleEnd : fin du son perçu.
    // Ils diffèrent dès qu'un moteur continue de sonner après l'extinction
    // de sa source — résonateur de Rings excité par 20 ms de bruit, boucles
    // de retour de clouds/faust/amy. Caler l'enveloppe sur naturalEnd
    // étranglait ces moteurs avant qu'ils ne sonnent.
    let naturalEnd = now;
    let audibleEnd = now + 0.3; // plancher
    const holdUntil = (t: number) => {
      audibleEnd = Math.max(audibleEnd, t);
    };
    const noteStop = (node: AudioScheduledSourceNode, when: number) => {
      naturalEnd = Math.max(naturalEnd, when);
      holdUntil(when);
      node.stop(when);
    };

    // Enveloppe ADSR sur un GainNode natif. C'est elle qui supprime les
    // clics : avant, le gain restait constant puis l'oscillateur
    // s'arrêtait net, d'où la discontinuité.
    //
    // Les rampes sont exponentielles et ne passent jamais par zéro —
    // exponentialRampToValueAtTime rejette 0, d'où le plancher 0.0001.
    const ATTACK = 0.008;
    const DECAY = 0.12;
    const SUSTAIN = 0.75;
    const RELEASE = 0.22;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(1, now + ATTACK);
    env.gain.exponentialRampToValueAtTime(SUSTAIN, now + ATTACK + DECAY);

    const masterGain = ctx.createGain();
    const vol = (p.masterVolume / 100) * 0.45;
    masterGain.gain.setValueAtTime(vol, now);
    masterGain.connect(env);

    // Envoi vers la réverbération partagée. `amount` en 0-100.
    const sendToReverb = (source: AudioNode, amount: number) => {
      if (!reverbRef.current || amount <= 0) return;
      // La réverbération prolonge le son : sans ça l'enveloppe coupe la
      // queue au moment où la source s'arrête.
      holdUntil(now + 1.2 + (amount / 100) * 1.4);
      const send = ctx.createGain();
      send.gain.setValueAtTime((amount / 100) * 0.5, now);
      source.connect(send);
      send.connect(reverbRef.current);
    };

    // Apply Detune Cents
    const detunedFreq = freq * Math.pow(2, p.masterDetune / 1200);

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
      osc1.frequency.setValueAtTime(detunedFreq, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(detunedFreq * (1 + (p.plaitsHarmonics / 100) * 2), now);

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
      filter.connect(masterGain);

      const dec = 0.2 + (p.plaitsDecay / 100) * 2.0;
      osc1.start(now);
      osc2.start(now);
      noteStop(osc1, now + dec);
      noteStop(osc2, now + dec);

      showToast(`🎛️ PLAITS [${p.plaitsEngine}] : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_braids") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = p.braidsModel.includes("SAW") ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(detunedFreq, now);

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
      filter.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + 0.8);

      showToast(`🎛️ BRAIDS [${p.braidsModel}] : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_rings") {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = trk(ctx.createBufferSource());
      noise.buffer = buffer;

      const delay = ctx.createDelay();
      delay.delayTime.value = 1 / (detunedFreq * Math.pow(2, (p.ringsPosition - 50) / 100));

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

      voiceMix.connect(masterGain);

      // Le résonateur sonne longtemps après l'impulsion de 20 ms : la durée
      // dépend de l'amortissement, qui fixe le gain de rebouclage.
      holdUntil(now + 0.6 + (1 - p.ringsDamping / 100) * 2.6);

      noise.start(now);
      noteStop(noise, now + 0.02);

      showToast(`🔔 RINGS [${p.ringsResonatorMode}] : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "mi_clouds") {
      // Vrai moteur granulaire. Le module s'appelait "Clouds" mais
      // produisait une simple dent de scie filtrée : quatre de ses six
      // contrôles n'avaient aucun effet.
      const dur = 1.2;
      const shifted = detunedFreq * Math.pow(2, p.cloudsPitchShift / 12);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000 + (p.cloudsTexture / 100) * 4000, now);
      filter.Q.setValueAtTime(2.0, now);

      // cloudsFeedback : boucle de retour, la queue diffuse du module.
      const loop = buildFeedbackLoop(ctx, 0.09, p.cloudsFeedback, 3600);
      // La boucle prolonge le son bien après le dernier grain.
      holdUntil(now + dur + (p.cloudsFeedback / 100) * 2.2);
      filter.connect(loop.input);
      loop.output.connect(masterGain);

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

      showToast(
        `☁️ CLOUDS ${grains} grains · fb ${p.cloudsFeedback}% : ${shifted.toFixed(1)} Hz`
      );
    } else if (p.activeEngine === "mi_elements") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(detunedFreq * Math.pow(2, p.elementsPitch / 12), now);

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
      filter.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + 0.8 + (100 - p.elementsDamping) / 50);

      showToast(`🪘 ELEMENTS Modal : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "open303") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = (p.acidWave as OscillatorType) || "sawtooth";
      osc.frequency.setValueAtTime(detunedFreq * Math.pow(2, p.acidTuning / 12), now);

      filter.type = "lowpass";
      const envPeak = p.acidCutoff + 3500 * (p.acidAccent ? 1.5 : 0.8) * (p.acidEnvMod / 100);
      filter.frequency.setValueAtTime(envPeak, now);
      const dec = 0.12 + (p.acidDecay / 100) * 0.7;
      filter.frequency.exponentialRampToValueAtTime(p.acidCutoff * 0.18, now + dec);
      filter.Q.setValueAtTime((p.acidResonance / 100) * 22, now);

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + dec + 0.1);

      showToast(`🎛️ OPEN303 ACID BASS : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "dexed_fm") {
      const carrier = trk(ctx.createOscillator());
      const mod = trk(ctx.createOscillator());
      const modGain = ctx.createGain();

      carrier.type = "sine";
      carrier.frequency.setValueAtTime(detunedFreq * p.dxOp1Ratio, now);

      mod.type = "sine";
      mod.frequency.setValueAtTime(detunedFreq * p.dxOp2Ratio, now);

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
      additif.connect(masterGain);
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
      carrier.connect(masterGain);

      const dec = 0.3 + (p.dxDecay / 100) * 1.5;
      carrier.start(now);
      mod.start(now);
      noteStop(carrier, now + dec);
      noteStop(mod, now + dec);

      showToast(`🎹 DEXED FM (Algo #${p.dxAlgorithm}) : ${detunedFreq.toFixed(1)} Hz`);
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
      osc1.frequency.setValueAtTime(detunedFreq * (1 + (p.surgeMorph - 50) / 1000), now);

      subOsc.type = table.sub;
      subOsc.frequency.setValueAtTime(detunedFreq / 2, now);

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
      drive.connect(masterGain);

      osc1.start(now);
      subOsc.start(now);
      noteStop(osc1, now + 1.0);
      noteStop(subOsc, now + 1.0);

      showToast(`🎛️ SURGE XT [${p.surgeWavetable}] : ${detunedFreq.toFixed(1)} Hz`);
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
        osc.frequency.setValueAtTime(detunedFreq * i, now);
        gain.gain.setValueAtTime((0.35 / i) * (1 + (p.zynSubBoost / 100) * (i === 1 ? 1 : 0)), now);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        noteStop(osc, now + 0.8);
      }

      filter.connect(masterGain);

      // zynReverbSend : envoi vers le convolveur partage.
      sendToReverb(filter, p.zynReverbSend);

      showToast(`🎹 ZYNADDSUBFX Additive : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "helm") {
      const osc = trk(ctx.createOscillator());
      const sub = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(detunedFreq * (1 + (p.helmCrossmod / 100) * 0.1), now);

      sub.type = "square";
      sub.frequency.setValueAtTime(detunedFreq / 2, now);

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
      filter.connect(masterGain);

      // helmReverb : envoi vers le convolveur partagé.
      sendToReverb(filter, p.helmReverb);

      osc.start(now);
      sub.start(now);
      noteStop(osc, now + 1.0);
      noteStop(sub, now + 1.0);

      showToast(`🎛️ HELM Crossmod Synth : ${detunedFreq.toFixed(1)} Hz`);
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

      osc1.frequency.setValueAtTime(detunedFreq, now);
      osc2.frequency.setValueAtTime(detunedFreq * preset.ratio, now);

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
        voice.frequency.setValueAtTime(detunedFreq, now);
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
      panner.connect(masterGain);

      // fluidReverb : envoi vers le convolveur partagé.
      sendToReverb(panner, p.fluidReverb);

      osc1.start(now);
      osc2.start(now);
      noteStop(osc1, now + dur);
      noteStop(osc2, now + dur);

      showToast(
        `🎹 FLUIDSYNTH [${p.fluidPreset}] rev ${p.fluidReverb}% · cho ${p.fluidChorus}%`
      );
    } else if (p.activeEngine === "amsynth") {
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();

      osc.type = (p.amWave as OscillatorType) || "sawtooth";
      osc.frequency.setValueAtTime(detunedFreq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(p.amCutoff, now);
      filter.Q.setValueAtTime((p.amReso / 100) * 12, now);

      const dec = 0.2 + (p.amDecay / 100) * 1.2;

      // amSubWave : le second VCO. Le module s'annonce "Dual VCO" mais
      // n'en instanciait qu'un seul.
      const sub2 = trk(ctx.createOscillator());
      sub2.type = (p.amSubWave as OscillatorType) || "square";
      sub2.frequency.setValueAtTime(detunedFreq / 2, now);
      const subLevel = ctx.createGain();
      subLevel.gain.setValueAtTime(0.45, now);
      sub2.connect(subLevel);
      subLevel.connect(filter);
      sub2.start(now);
      noteStop(sub2, now + dec);

      // amLfoDepth : vibrato sur la hauteur des deux oscillateurs.
      if (p.amLfoDepth > 0) {
        const depth = (p.amLfoDepth / 100) * detunedFreq * 0.03;
        const lfoA = trk(attachLfo(ctx, osc.frequency, 5.2, depth, now));
        const lfoB = trk(attachLfo(ctx, sub2.frequency, 5.2, depth * 0.5, now));
        noteStop(lfoA, now + dec);
        noteStop(lfoB, now + dec);
      }

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + dec);

      showToast(`🎛️ AMSYNTH Dual VCO : ${detunedFreq.toFixed(1)} Hz`);
    } else if (p.activeEngine === "amy_engine") {
      const partials = Math.min(16, p.amyPartialCount);
      const dur = 0.8;

      // amyFeedback : boucle de retour sur la somme des partiels.
      const loop = buildFeedbackLoop(ctx, 0.011, p.amyFeedback, 6000);
      holdUntil(now + dur + (p.amyFeedback / 100) * 1.1);
      loop.output.connect(masterGain);

      for (let i = 1; i <= partials; i++) {
        const osc = trk(ctx.createOscillator());
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(detunedFreq * i * (1 + (p.amySpread / 100) * 0.05), now);
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
        nFilter.frequency.setValueAtTime(detunedFreq * 2, now);
        nFilter.Q.setValueAtTime(1.2, now);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(loop.input);
        noise.start(now);
        noteStop(noise, now + dur);
      }

      showToast(
        `🎛️ AMY ${partials} partiels · fb ${p.amyFeedback}% · bruit ${p.amyNoise}%`
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
          osc.frequency.setValueAtTime(detunedFreq * ratios[i % ratios.length], t);
          t += stepSec;
          i++;
        }
      } else {
        osc.frequency.setValueAtTime(detunedFreq, now);
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
          osc.frequency.setValueAtTime(detunedFreq * jump, at);
        }
      }

      osc.connect(crusher);
      crusher.connect(decimate);
      decimate.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + dur);

      showToast(
        `🕹️ PL_SYNTH ${p.plBitcrush}bit /${div} · duty ${p.plDutyCycle}% : ${detunedFreq.toFixed(1)} Hz`
      );
    } else if (p.activeEngine === "faust_dsp") {
      // Le module annonçait "Wavefolder" mais ne repliait rien : dent de
      // scie dans un passe-bas, quatre contrôles sur cinq inertes.
      const osc = trk(ctx.createOscillator());
      const filter = ctx.createBiquadFilter();
      const dur = 0.8;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(detunedFreq, now);

      // faustFreqMod : modulation de fréquence par LFO audio.
      const fmLfo = trk(
        attachLfo(ctx, osc.frequency, detunedFreq * 0.5, (p.faustFreqMod / 100) * detunedFreq * 0.6, now)
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
      outGain.connect(masterGain);

      osc.start(now);
      noteStop(osc, now + dur);

      showToast(
        `🎛️ FAUST fold ${p.faustDrive}% · fb ${p.faustFeedback}% : ${detunedFreq.toFixed(1)} Hz`
      );
    }

    return { env, sources, naturalEnd, audibleEnd, ATTACK, DECAY, SUSTAIN, RELEASE };
  };

  const playPluginNote = (freq: number = 261.63, voiceId?: string) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const p = paramsRef.current;
      diagRef.current?.setAudio(ctx.state);
      diagRef.current?.setDerniereNote(`${p.activeEngine} @ ${freq.toFixed(1)} Hz${voiceId ? ` (${voiceId})` : ""}`);

      // Une note déjà tenue sur cet identifiant est relâchée d'abord
      // (évite d'empiler des voix sur l'auto-repeat clavier).
      if (voiceId && voicesRef.current.has(voiceId)) releaseVoice(voiceId);

      const { env, sources, naturalEnd, audibleEnd, ATTACK, DECAY, SUSTAIN, RELEASE } =
        construireVoix(ctx, p, freq, now);

      // Sortie vers le bus persistant, donc vers l'analyseur.
      env.connect(masterBusRef.current!);

      if (voiceId) {
        // Note tenue : la voix reste au niveau de sustain jusqu'au
        // relâchement, qui programmera la rampe de release.
        voicesRef.current.set(voiceId, { env, release: RELEASE, sources, naturalEnd });
      } else {
        // Note ponctuelle : release calé sur la fin du son perçu, pas sur
        // l'arrêt des sources.
        const at = Math.max(now + ATTACK + DECAY + 0.01, audibleEnd - RELEASE);
        env.gain.setValueAtTime(SUSTAIN, at);
        env.gain.exponentialRampToValueAtTime(0.0001, at + RELEASE);
        window.setTimeout(() => {
          try {
            env.disconnect();
          } catch {
            /* déjà détachée */
          }
        }, (audibleEnd - now + 0.6) * 1000);
      }
    } catch (e) {
      // Cette erreur partait uniquement dans un log : deux pannes de son ont
      // ete diagnostiquees a l'aveugle a cause de ca. Elle est desormais
      // affichee dans le bandeau de diagnostic.
      log.error("Audio error:", e);
      diagRef.current?.setDerniereNote(`ERREUR : ${(e as any)?.message ?? String(e)}`);
    }
  };

  // WEB MIDI & PC KEYBOARD EVENT LISTENERS
  useEffect(() => {
    // 1. Web MIDI
    //
    // requestMIDIAccess ne liste que les appareils présents à l'instant T.
    // Sans onstatechange, brancher l'OP-1 après le chargement de la page
    // n'aurait aucun effet.
    let midiAccess: any = null;

    const bindInput = (input: any) => {
      // Ouverture explicite : un port peut etre liste mais refuser de
      // s'ouvrir (deja pris par une autre application, par exemple).
      try {
        void input.open?.();
      } catch (error) {
        log.warn("input.open a echoue", { name: input.name, error });
      }
      input.onmidimessage = (msg: any) => {
        // Tout premier geste : figer l'instant d'entree. Ce qui suit compte.
        const tEntree = performance.now();
        const [command, note, velocity] = msg.data;
        diagRef.current?.setDernierMessage(
          `[${Array.from(msg.data as Uint8Array).map((b) => "0x" + b.toString(16).padStart(2, "0")).join(" ")}] ${input.name ?? ""}`
        );
        const kind = command & 0xf0; // ignore le canal MIDI
        const voiceId = `midi:${note}`;
        if (kind === 0x90 && velocity > 0) {
          const freq = 440 * Math.pow(2, (note - 69) / 12);
          playPluginNote(freq, voiceId);
          mesurerLatence(tEntree, msg.timeStamp);
        } else if (kind === 0x80 || (kind === 0x90 && velocity === 0)) {
          // 0x80 = note-off ; 0x90 vélocité 0 = note-off déguisé, que
          // beaucoup de claviers envoient à la place.
          releaseVoice(voiceId);
        }
      };
    };

    const refreshInputs = () => {
      if (!midiAccess) return;
      const names: string[] = [];
      midiAccess.inputs.forEach((input: any) => {
        bindInput(input);
        if (input.name) names.push(input.name);
      });
      setMidiConnected(names.length > 0);
      setMidiDeviceName(names.join(" · "));
      diagRef.current?.setMidi(
        names.length > 0,
        names.length > 0
          ? `${names.length} entrée(s) : ${names.join(" · ")}`
          : "accès accordé, aucune entrée détectée"
      );
      log.info("MIDI inputs", { count: names.length, names });
    };

    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then((access) => {
          midiAccess = access;
          refreshInputs();
          // Branchement / débranchement à chaud.
          (access as any).onstatechange = (e: any) => {
            log.info("MIDI state change", { port: e?.port?.name, state: e?.port?.state });
            refreshInputs();
          };
        })
        .catch((error) => {
          diagRef.current?.setMidi(false, `accès refusé : ${(error as any)?.message ?? error}`);
          log.warn("requestMIDIAccess refuse", error);
        });
    } else {
      diagRef.current?.setMidi(false, "Web MIDI indisponible (navigateur ou contexte non sécurisé)");
      log.warn("Web MIDI indisponible sur ce navigateur");
    }

    // 2. PC Computer Keyboard Fallback (A, W, S, E, D, F, T, G, Y, H, U, J, K)
    const keyToFreq: Record<string, { freq: number; note: string }> = {
      a: { freq: 261.63, note: "C4" },
      w: { freq: 277.18, note: "C#4" },
      s: { freq: 293.66, note: "D4" },
      e: { freq: 311.13, note: "D#4" },
      d: { freq: 329.63, note: "E4" },
      f: { freq: 349.23, note: "F4" },
      t: { freq: 369.99, note: "F#4" },
      g: { freq: 392.00, note: "G4" },
      y: { freq: 415.30, note: "G#4" },
      h: { freq: 440.00, note: "A4" },
      u: { freq: 466.16, note: "A#4" },
      j: { freq: 493.88, note: "B4" },
      k: { freq: 523.25, note: "C5" },
    };

    const isTypingTarget = (t: EventTarget | null) =>
      t instanceof HTMLInputElement ||
      t instanceof HTMLSelectElement ||
      t instanceof HTMLTextAreaElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      // e.repeat : l'auto-repeat du système déclenchait une avalanche de
      // notes tant que la touche restait enfoncée.
      if (e.repeat) return;
      const entry = keyToFreq[e.key.toLowerCase()];
      if (!entry) return;
      setActiveKeyNote(entry.note);
      playPluginNote(entry.freq, entry.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const entry = keyToFreq[e.key.toLowerCase()];
      if (!entry) return;
      releaseVoice(entry.note);
      setActiveKeyNote((current) => (current === entry.note ? null : current));
    };

    // Onglet masqué : on ne recevrait jamais le keyup, la note resterait tenue.
    const handleBlur = () => {
      releaseAllVoices();
      setActiveKeyNote(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      releaseAllVoices();

      // Detacher le MIDI, sinon le rack continue de capter apres avoir
      // quitte la page. onstatechange est le plus nuisible : il survit au
      // demontage et, au prochain branchement, reattache les gestionnaires
      // du rack par-dessus ceux de la page active, qui cesse de recevoir.
      if (midiAccess) {
        midiAccess.onstatechange = null;
        midiAccess.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []);

  // ANIMATED OSCILLOSCOPE WAVEFORM
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const p = paramsRef.current;

      // Dark OLED Grid
      ctx.fillStyle = "#090b12";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(0, 237, 149, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Tracé du SIGNAL RÉEL lu sur l'analyseur.
      // Avant : des Math.sin() codés en dur par moteur, sans aucun rapport
      // avec le son produit. L'analyseur est branché sur le bus de sortie,
      // donc ce qui s'affiche est ce qui s'entend.
      const colorMap: Record<string, string> = {
        mi_plaits: "#00ed95",
        mi_braids: "#d9ff43",
        mi_rings: "#b873ff",
        mi_clouds: "#4aa7ff",
        mi_elements: "#ff3a5d",
        open303: "#ff3a5d",
        dexed_fm: "#00ed95",
        surge_xt: "#d9ff43",
      };

      ctx.strokeStyle = colorMap[p.activeEngine] || "#00ed95";
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const analyser = analyserRef.current;
      const data = scopeDataRef.current;

      if (analyser && data) {
        const n = analyser.fftSize;
        const view = data.subarray(0, n);
        analyser.getByteTimeDomainData(view);

        // 128 = silence (centre). On mesure l'amplitude pour distinguer un
        // vrai silence d'un signal, et afficher une ligne plate franche.
        let peak = 0;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(view[i] - 128);
          if (d > peak) peak = d;
        }

        if (peak < 2) {
          // Silence : ligne médiane, pas de bruit de quantification amplifié.
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
        } else {
          const step = n / width;
          for (let x = 0; x < width; x++) {
            const v = view[Math.floor(x * step)] / 128 - 1; // -1 .. +1
            const y = height / 2 - v * (height / 2 - 4);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
      } else {
        // Analyseur pas encore créé : le contexte audio attend un geste
        // utilisateur. Ligne plate plutôt qu'une animation mensongère.
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // EXPORT PRESET FOR INSTRUMENTS (OP-1 & EP-133 FORMATS)
  const exportPreset = (format: "standard" | "op1" | "ep133") => {
    const p = paramsRef.current;
    let exportData: any;
    let fileName: string;

    if (format === "op1") {
      exportData = {
        name: `OP1_${p.activeEngine.toUpperCase()}`,
        type: "synth",
        engine: p.activeEngine,
        octave: 0,
        knob1: p.plaitsHarmonics || p.dxOp1Ratio || 50,
        knob2: p.plaitsTimbre || p.surgeCutoff || 50,
        knob3: p.plaitsMorph || p.acidResonance || 50,
        knob4: p.plaitsDecay || p.dxDecay || 50,
        fx_type: "delay",
        fx_params: [50, 40, 30, 20],
      };
      fileName = `op1_synth_${p.activeEngine}_${Date.now()}.json`;
    } else if (format === "ep133") {
      exportData = {
        device: "EP-133 KO II",
        group: "A",
        sample_map: {
          engine: p.activeEngine,
          root_note: 60,
          params: { ...p },
        },
      };
      fileName = `ep133_samplemap_${p.activeEngine}_${Date.now()}.json`;
    } else {
      exportData = {
        engine: p.activeEngine,
        author: profileName,
        created: new Date().toISOString(),
        mutable: p.activeEngine.startsWith("mi_"),
        parameters: { ...p },
      };
      fileName = `rack_engine_${p.activeEngine}_${Date.now()}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    showToast(`📦 EXPORTÉ (${format.toUpperCase()}) : ${p.activeEngine.toUpperCase()}`);
  };

  const ALL_ENGINES: { id: EnginePluginType; name: string; subtitle: string; category: string; color: string }[] = [
    // MUTABLE SUITE
    { id: "mi_plaits", name: "MUTABLE PLAITS", subtitle: "16-Engine Macro Oscillator", category: "MUTABLE", color: "green" },
    { id: "mi_braids", name: "MUTABLE BRAIDS", subtitle: "33-Model Macro Synth", category: "MUTABLE", color: "yellow" },
    { id: "mi_rings", name: "MUTABLE RINGS", subtitle: "Resonator & Physical Modeling", category: "MUTABLE", color: "purple" },
    { id: "mi_clouds", name: "MUTABLE CLOUDS", subtitle: "Granular Texture Synthesizer", category: "MUTABLE", color: "blue" },
    { id: "mi_elements", name: "MUTABLE ELEMENTS", subtitle: "Modal Physical Modeling", category: "MUTABLE", color: "pink" },
    // OPEN SOURCE GIT
    { id: "dexed_fm", name: "DEXED / DX7 FM", subtitle: "6-Op FM Synthesis Engine", category: "OPEN SOURCE", color: "green" },
    { id: "surge_xt", name: "SURGE XT", subtitle: "Hybrid Wavetable Synth", category: "OPEN SOURCE", color: "yellow" },
    { id: "zynaddsubfx", name: "ZYNADDSUBFX", subtitle: "Additive & Pad Engine", category: "OPEN SOURCE", color: "purple" },
    { id: "helm", name: "HELM SYNTH", subtitle: "Polyphonic Modulation Engine", category: "OPEN SOURCE", color: "blue" },
    { id: "fluidsynth", name: "FLUIDSYNTH SF2", subtitle: "SoundFont Sample Player", category: "OPEN SOURCE", color: "pink" },
    { id: "amsynth", name: "AMSYNTH", subtitle: "Dual VCO Analog Synth", category: "OPEN SOURCE", color: "yellow" },
    { id: "amy_engine", name: "AMY C/JS", subtitle: "Fixed-Point Audio Synthesizer", category: "OPEN SOURCE", color: "green" },
    { id: "pl_synth", name: "PL_SYNTH", subtitle: "8-Bit Chiptune Tracker Engine", category: "OPEN SOURCE", color: "blue" },
    { id: "open303", name: "OPEN303 ACID", subtitle: "Roland TB-303 Acid Emulation", category: "OPEN SOURCE", color: "pink" },
    { id: "faust_dsp", name: "FAUST DSP NODE", subtitle: "Compiled DSP WebAudio Engine", category: "OPEN SOURCE", color: "purple" },
  ];

  return (
    <main className="audio-plugin-rack-page">
      <TopBar activePage="outils" profileName={profileName} />

      {/* COMPACT SINGLE-VIEWPORT WORKSPACE FRAME */}
      <div className="plugin-rack-container">
        
        {/* LEFT COLUMN: VERTICAL LIST OF ALL AUDIO ENGINES WITH UNFOLDING PATCH LISTS */}
        <aside className="rack-left-sidebar">
          <div className="sidebar-header">
            <h3>🎛️ MOTEURS AUDIO (15)</h3>
            <small>Eurorack & Open Source</small>
          </div>

          <div className="sidebar-engines-scroll">
            <div className="sidebar-category-title">🎛️ MUTABLE INSTRUMENTS</div>
            {ALL_ENGINES.filter((e) => e.category === "MUTABLE").map((e) => {
              const isSelected = activeEngine === e.id;
              const factory = FACTORY_PATCHES[e.id] || [];
              const custom = userPatches.filter((p) => p.engine === e.id);
              const allPatchesForEngine = [...factory, ...custom];
              // Liste affichee apres filtre. Le choix automatique au depliage
              // reste sur la liste complete : ouvrir un moteur ne doit pas
              // dependre de ce qui est tape dans la recherche.
              const patchesAffiches = filtrerPatches(allPatchesForEngine);

              return (
                <div key={e.id} className="engine-accordion-group">
                  <button
                    type="button"
                    className={`sidebar-engine-item color-${e.color} ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setActiveEngine(e.id);
                      if (allPatchesForEngine.length > 0) applyPatch(allPatchesForEngine[0]);
                    }}
                  >
                    <span className="engine-dot" />
                    <div className="engine-info">
                      <strong>{e.name}</strong>
                      <small>{e.subtitle}</small>
                    </div>
                    <span className="expand-arrow">{isSelected ? "▼" : "▶"}</span>
                  </button>

                  {/* EXPANDABLE PATCH LIST UNDER ACTIVE SYNTH */}
                  {isSelected && (
                    <div className="unfolded-patch-list">
                      <div className="patch-list-header-row">
                        <span className="patch-list-header">
                          🎵 PATCHES ({patchQuery.trim()
                            ? `${patchesAffiches.length}/${allPatchesForEngine.length}`
                            : allPatchesForEngine.length}) :
                        </span>
                        <button type="button" className="add-patch-btn" onClick={() => setShowSaveModal(true)}>
                          + CRÉER
                        </button>
                      </div>

                      <input
                        type="search"
                        className="patch-search-input"
                        placeholder="Chercher un patch…"
                        value={patchQuery}
                        onChange={(e) => setPatchQuery(e.target.value)}
                        aria-label="Chercher un patch"
                      />

                      {patchQuery.trim() && !patchesAffiches.length && (
                        <p className="patch-search-empty">Aucun patch ne correspond.</p>
                      )}

                      {patchesAffiches.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`unfolded-patch-btn ${selectedPatchId === p.id ? "patch-selected" : ""} ${p.isUserPatch ? "user-patch-highlight" : ""}`}
                          onClick={() => applyPatch(p)}
                        >
                          <span className="patch-cat">{p.isUserPatch ? "[PERSO]" : `[${p.category}]`}</span>
                          <span className="patch-name">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="sidebar-category-title">🎹 OPEN SOURCE ENGINES</div>
            {ALL_ENGINES.filter((e) => e.category === "OPEN SOURCE").map((e) => {
              const isSelected = activeEngine === e.id;
              const factory = FACTORY_PATCHES[e.id] || [];
              const custom = userPatches.filter((p) => p.engine === e.id);
              const allPatchesForEngine = [...factory, ...custom];
              // Liste affichee apres filtre. Le choix automatique au depliage
              // reste sur la liste complete : ouvrir un moteur ne doit pas
              // dependre de ce qui est tape dans la recherche.
              const patchesAffiches = filtrerPatches(allPatchesForEngine);

              return (
                <div key={e.id} className="engine-accordion-group">
                  <button
                    type="button"
                    className={`sidebar-engine-item color-${e.color} ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setActiveEngine(e.id);
                      if (allPatchesForEngine.length > 0) applyPatch(allPatchesForEngine[0]);
                    }}
                  >
                    <span className="engine-dot" />
                    <div className="engine-info">
                      <strong>{e.name}</strong>
                      <small>{e.subtitle}</small>
                    </div>
                    <span className="expand-arrow">{isSelected ? "▼" : "▶"}</span>
                  </button>

                  {/* EXPANDABLE PATCH LIST UNDER ACTIVE SYNTH */}
                  {isSelected && (
                    <div className="unfolded-patch-list">
                      <div className="patch-list-header-row">
                        <span className="patch-list-header">
                          🎵 PATCHES ({patchQuery.trim()
                            ? `${patchesAffiches.length}/${allPatchesForEngine.length}`
                            : allPatchesForEngine.length}) :
                        </span>
                        <button type="button" className="add-patch-btn" onClick={() => setShowSaveModal(true)}>
                          + CRÉER
                        </button>
                      </div>

                      <input
                        type="search"
                        className="patch-search-input"
                        placeholder="Chercher un patch…"
                        value={patchQuery}
                        onChange={(e) => setPatchQuery(e.target.value)}
                        aria-label="Chercher un patch"
                      />

                      {patchQuery.trim() && !patchesAffiches.length && (
                        <p className="patch-search-empty">Aucun patch ne correspond.</p>
                      )}

                      {patchesAffiches.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`unfolded-patch-btn ${selectedPatchId === p.id ? "patch-selected" : ""} ${p.isUserPatch ? "user-patch-highlight" : ""}`}
                          onClick={() => applyPatch(p)}
                        >
                          <span className="patch-cat">{p.isUserPatch ? "[PERSO]" : `[${p.category}]`}</span>
                          <span className="patch-name">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT AREA: WAVEFORM + COMPREHENSIVE ENGINE CONTROLS */}
        <section className="rack-right-workspace">
          
          {/* HEADER BAR & STATUS */}
          <header className="workspace-header">
            <div className="header-title-box">
              <h2>MOTEUR ACTIF : <span className="active-engine-title">{activeEngine.toUpperCase().replace("_", " ")}</span></h2>
              <p>Moteur Audio Temps Réel • Direct Export OP-1 & EP-133 KO II</p>
            </div>

            <div className="header-controls-row">
              <button
                type="button"
                className="test-sound-btn"
                onClick={() => playPluginNote(261.63)}
              >
                🔊 TESTER LE SON (C4)
              </button>

              {/* Bandeau de diagnostic : etat reel du moteur audio et du MIDI.
                  Ajoute apres deux pannes de son diagnostiquees a l'aveugle. */}
              <RackDiagnostic ref={diagRef} />


              <div className="input-source-badge">
                {midiConnected ? (
                  <span className="badge-connected">
                    🎹 {midiDeviceName || "MIDI"} CONNECTÉ · CLAVIER PC ACTIF
                  </span>
                ) : (
                  <span className="badge-keyboard">
                    ⌨️ CLAVIER PC (A W S E D F T G Y H U J K) · AUCUN MIDI DÉTECTÉ
                  </span>
                )}
              </div>

              <div className="export-btn-group">
                <button type="button" className="action-btn export-btn" onClick={() => exportPreset("standard")}>
                  📦 EXPORT JSON
                </button>
                <button type="button" className="action-btn export-op1-btn" onClick={() => exportPreset("op1")}>
                  🎛️ OP-1 SYNTH
                </button>
                <button type="button" className="action-btn export-ep133-btn" onClick={() => exportPreset("ep133")}>
                  🎚️ EP-133 MAP
                </button>
              </div>
            </div>
          </header>

          {/* MAIN UNIFIED FRAME: OLED WAVEFORM + MASTER + EXPANDED CONTROLS */}
          <div className="unified-waveform-controls-frame">
            
            {/* WAVEFORM / OLED OSCILLOSCOPE */}
            <div className="waveform-display-box">
              <div className="vis-info-bar">
                <span className="vis-title">📊 OSCILLOSCOPE TEMPS RÉEL (OLED)</span>
                <div className="master-quick-bar">
                  <label className="master-vol-label">VOL: {masterVolume}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={masterVolume}
                      onChange={(e) => updateParam("masterVolume", Number(e.target.value), setMasterVolume)}
                    />
                  </label>
                  <label className="master-detune-label">TUNING: {masterDetune}c
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={masterDetune}
                      onChange={(e) => updateParam("masterDetune", Number(e.target.value), setMasterDetune)}
                    />
                  </label>
                </div>
              </div>
              <canvas ref={oscCanvasRef} width={900} height={100} className="waveform-canvas" />
            </div>

            {/* EXPANDED COMPREHENSIVE PARAMETERS CONTROL PANEL FOR SELECTED ENGINE */}
            <div className="compact-parameters-panel">
              <div className="panel-header">
                <strong>🎛️ CONTRÔLE ET RÉGLAGES DU SOUND ENGINE : {activeEngine.toUpperCase().replace("_", " ")}</strong>
                <small>Modulation & Écoute Instantanée</small>
              </div>

              {/* MUTABLE PLAITS */}
              {activeEngine === "mi_plaits" && (
                <div className="controls-grid">
                  <label className="ctrl-group">SÉLECTION DUAL ENGINE :
                    <select
                      value={plaitsEngine}
                      onChange={(e) => updateParam("plaitsEngine", e.target.value, setPlaitsEngine as any)}
                    >
                      <option value="V_ANALOG">1. VIRTUAL ANALOG (Saw/Pair)</option>
                      <option value="FM">2. FREQUENCY MODULATION (2-OP FM)</option>
                      <option value="WAVETABLE">3. WAVETABLE (Sweep 3D Grid)</option>
                      <option value="GRAIN">4. GRANULAR PULSE CLOUD</option>
                      <option value="SPEECH">5. SPEECH SYNTHESIS & FORMANT</option>
                      <option value="CHORD">6. 4-VOICE CHORD GENERATOR</option>
                    </select>
                  </label>
                  <label className="ctrl-group">HARMONICS FREQ: {plaitsHarmonics}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plaitsHarmonics}
                      onChange={(e) => updateParam("plaitsHarmonics", Number(e.target.value), setPlaitsHarmonics)}
                    />
                  </label>
                  <label className="ctrl-group">TIMBRE (FILTER CUTOFF): {plaitsTimbre}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plaitsTimbre}
                      onChange={(e) => updateParam("plaitsTimbre", Number(e.target.value), setPlaitsTimbre)}
                    />
                  </label>
                  <label className="ctrl-group">MORPH (SHAPE): {plaitsMorph}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plaitsMorph}
                      onChange={(e) => updateParam("plaitsMorph", Number(e.target.value), setPlaitsMorph)}
                    />
                  </label>
                  <label className="ctrl-group">DECAY ENVELOPE: {plaitsDecay}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plaitsDecay}
                      onChange={(e) => updateParam("plaitsDecay", Number(e.target.value), setPlaitsDecay)}
                    />
                  </label>
                </div>
              )}

              {/* MUTABLE BRAIDS */}
              {activeEngine === "mi_braids" && (
                <div className="controls-grid">
                  <label className="ctrl-group">MODELE BRAIDS :
                    <select
                      value={braidsModel}
                      onChange={(e) => updateParam("braidsModel", e.target.value, setBraidsModel)}
                    >
                      <option value="CS-80 SAW">CS-80 SAW (Brass Synth)</option>
                      <option value="WT-SWEEP">WT-SWEEP (Wavetable Scan)</option>
                      <option value="VOWEL FORMANT">VOWEL FORMANT (Voix Synthétique)</option>
                      <option value="BELL HARMONIC">BELL HARMONIC (Percussion Métallique)</option>
                    </select>
                  </label>
                  <label className="ctrl-group">COLOR (RESO/SPECTRUM): {braidsColor}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={braidsColor}
                      onChange={(e) => updateParam("braidsColor", Number(e.target.value), setBraidsColor)}
                    />
                  </label>
                  <label className="ctrl-group">TIMBRE (PULSE/SWEEP): {braidsTimbre}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={braidsTimbre}
                      onChange={(e) => updateParam("braidsTimbre", Number(e.target.value), setBraidsTimbre)}
                    />
                  </label>
                  <label className="ctrl-group">BIT DEPTH: {braidsBitDepth} Bits
                    <input
                      type="range"
                      min={4}
                      max={16}
                      step={4}
                      value={braidsBitDepth}
                      onChange={(e) => updateParam("braidsBitDepth", Number(e.target.value), setBraidsBitDepth)}
                    />
                  </label>
                </div>
              )}

              {/* MUTABLE RINGS */}
              {activeEngine === "mi_rings" && (
                <div className="controls-grid">
                  <label className="ctrl-group">RESONATOR MODE :
                    <select
                      value={ringsResonatorMode}
                      onChange={(e) => updateParam("ringsResonatorMode", e.target.value, setRingsResonatorMode as any)}
                    >
                      <option value="STRING">MODAL STRING (Corde Vibrante)</option>
                      <option value="TUBE">SYMPATHETIC STRINGS (Tubes & Flûtes)</option>
                      <option value="PLATE">INHARMONIC STRING (Cloches & Plaques)</option>
                    </select>
                  </label>
                  <label className="ctrl-group">DAMPING (AMORTISSEMENT): {ringsDamping}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ringsDamping}
                      onChange={(e) => updateParam("ringsDamping", Number(e.target.value), setRingsDamping)}
                    />
                  </label>
                  <label className="ctrl-group">STRUCTURE (INHARMONICS): {ringsStructure}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ringsStructure}
                      onChange={(e) => updateParam("ringsStructure", Number(e.target.value), setRingsStructure)}
                    />
                  </label>
                  <label className="ctrl-group">BRIGHTNESS: {ringsBrightness}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ringsBrightness}
                      onChange={(e) => updateParam("ringsBrightness", Number(e.target.value), setRingsBrightness)}
                    />
                  </label>
                  <label className="ctrl-group">EXCITER POSITION: {ringsPosition}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ringsPosition}
                      onChange={(e) => updateParam("ringsPosition", Number(e.target.value), setRingsPosition)}
                    />
                  </label>
                  <label className="ctrl-group">POLYPHONY VOICES: {ringsPolyphony}
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={ringsPolyphony}
                      onChange={(e) => updateParam("ringsPolyphony", Number(e.target.value), setRingsPolyphony)}
                    />
                  </label>
                </div>
              )}

              {/* MUTABLE CLOUDS */}
              {activeEngine === "mi_clouds" && (
                <div className="controls-grid">
                  <label className="ctrl-group">GRANULAR DENSITY: {cloudsGranularDensity}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cloudsGranularDensity}
                      onChange={(e) => updateParam("cloudsGranularDensity", Number(e.target.value), setCloudsGranularDensity)}
                    />
                  </label>
                  <label className="ctrl-group">PITCH SHIFT (DEMI-TONS): {cloudsPitchShift}
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={cloudsPitchShift}
                      onChange={(e) => updateParam("cloudsPitchShift", Number(e.target.value), setCloudsPitchShift)}
                    />
                  </label>
                  <label className="ctrl-group">TEXTURE / SMOOTHING: {cloudsTexture}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cloudsTexture}
                      onChange={(e) => updateParam("cloudsTexture", Number(e.target.value), setCloudsTexture)}
                    />
                  </label>
                  <label className="ctrl-group">GRAIN POSITION: {cloudsPosition}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cloudsPosition}
                      onChange={(e) => updateParam("cloudsPosition", Number(e.target.value), setCloudsPosition)}
                    />
                  </label>
                  <label className="ctrl-group">FEEDBACK AMOUNT: {cloudsFeedback}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cloudsFeedback}
                      onChange={(e) => updateParam("cloudsFeedback", Number(e.target.value), setCloudsFeedback)}
                    />
                  </label>
                  <label className="ctrl-group">REVERB DENSITY: {cloudsReverb}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cloudsReverb}
                      onChange={(e) => updateParam("cloudsReverb", Number(e.target.value), setCloudsReverb)}
                    />
                  </label>
                </div>
              )}

              {/* MUTABLE ELEMENTS */}
              {activeEngine === "mi_elements" && (
                <div className="controls-grid">
                  <label className="ctrl-group">GEOMETRY (RESONANCE): {elementsGeometry}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={elementsGeometry}
                      onChange={(e) => updateParam("elementsGeometry", Number(e.target.value), setElementsGeometry)}
                    />
                  </label>
                  <label className="ctrl-group">BRIGHTNESS: {elementsBrightness}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={elementsBrightness}
                      onChange={(e) => updateParam("elementsBrightness", Number(e.target.value), setElementsBrightness)}
                    />
                  </label>
                  <label className="ctrl-group">DAMPING: {elementsDamping}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={elementsDamping}
                      onChange={(e) => updateParam("elementsDamping", Number(e.target.value), setElementsDamping)}
                    />
                  </label>
                  <label className="ctrl-group">PITCH TUNE: {elementsPitch} st
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={elementsPitch}
                      onChange={(e) => updateParam("elementsPitch", Number(e.target.value), setElementsPitch)}
                    />
                  </label>
                  <label className="ctrl-group">EXCITER CONTOUR: {elementsExciter}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={elementsExciter}
                      onChange={(e) => updateParam("elementsExciter", Number(e.target.value), setElementsExciter)}
                    />
                  </label>
                  <label className="ctrl-group">STRIKE FORCE: {elementsStrike}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={elementsStrike}
                      onChange={(e) => updateParam("elementsStrike", Number(e.target.value), setElementsStrike)}
                    />
                  </label>
                </div>
              )}

              {/* DEXED FM */}
              {activeEngine === "dexed_fm" && (
                <div className="controls-grid">
                  <label className="ctrl-group">ALGORITHME FM (1-32): {dxAlgorithm}
                    <input
                      type="range"
                      min={1}
                      max={32}
                      value={dxAlgorithm}
                      onChange={(e) => updateParam("dxAlgorithm", Number(e.target.value), setDxAlgorithm)}
                    />
                  </label>
                  <label className="ctrl-group">CARRIER RATIO: {dxOp1Ratio}
                    <input
                      type="range"
                      min={0.5}
                      max={4.0}
                      step={0.1}
                      value={dxOp1Ratio}
                      onChange={(e) => updateParam("dxOp1Ratio", Number(e.target.value), setDxOp1Ratio)}
                    />
                  </label>
                  <label className="ctrl-group">MODULATOR RATIO: {dxOp2Ratio}
                    <input
                      type="range"
                      min={0.5}
                      max={8.0}
                      step={0.1}
                      value={dxOp2Ratio}
                      onChange={(e) => updateParam("dxOp2Ratio", Number(e.target.value), setDxOp2Ratio)}
                    />
                  </label>
                  <label className="ctrl-group">FEEDBACK AMOUNT: {dxFeedback}
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={dxFeedback}
                      onChange={(e) => updateParam("dxFeedback", Number(e.target.value), setDxFeedback)}
                    />
                  </label>
                  <label className="ctrl-group">ATTACK TIME: {dxAttack} ms
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={dxAttack}
                      onChange={(e) => updateParam("dxAttack", Number(e.target.value), setDxAttack)}
                    />
                  </label>
                  <label className="ctrl-group">DECAY TIME: {dxDecay}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={dxDecay}
                      onChange={(e) => updateParam("dxDecay", Number(e.target.value), setDxDecay)}
                    />
                  </label>
                </div>
              )}

              {/* SURGE XT */}
              {activeEngine === "surge_xt" && (
                <div className="controls-grid">
                  <label className="ctrl-group">WAVETABLE TABLE :
                    <select
                      value={surgeWavetable}
                      onChange={(e) => updateParam("surgeWavetable", e.target.value, setSurgeWavetable)}
                    >
                      <option value="Acid-Wav">Acid-Wav Sweep</option>
                      <option value="Basic Vector">Basic Vector</option>
                      <option value="Digital Bell">Digital Bell Table</option>
                      <option value="Vocal Formant">Vocal Formant</option>
                    </select>
                  </label>
                  <label className="ctrl-group">MORPH SCAN: {surgeMorph}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={surgeMorph}
                      onChange={(e) => updateParam("surgeMorph", Number(e.target.value), setSurgeMorph)}
                    />
                  </label>
                  <label className="ctrl-group">FILTER CUTOFF: {surgeCutoff} Hz
                    <input
                      type="range"
                      min={200}
                      max={8000}
                      value={surgeCutoff}
                      onChange={(e) => updateParam("surgeCutoff", Number(e.target.value), setSurgeCutoff)}
                    />
                  </label>
                  <label className="ctrl-group">RESONANCE: {surgeReso}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={surgeReso}
                      onChange={(e) => updateParam("surgeReso", Number(e.target.value), setSurgeReso)}
                    />
                  </label>
                  <label className="ctrl-group">SUB OSC LEVEL: {surgeSub}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={surgeSub}
                      onChange={(e) => updateParam("surgeSub", Number(e.target.value), setSurgeSub)}
                    />
                  </label>
                  <label className="ctrl-group">DRIVE BOOST: {surgeDrive}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={surgeDrive}
                      onChange={(e) => updateParam("surgeDrive", Number(e.target.value), setSurgeDrive)}
                    />
                  </label>
                </div>
              )}

              {/* ZYNADDSUBFX */}
              {activeEngine === "zynaddsubfx" && (
                <div className="controls-grid">
                  <label className="ctrl-group">HARMONICS COUNT: {zynHarmonics}
                    <input
                      type="range"
                      min={1}
                      max={32}
                      value={zynHarmonics}
                      onChange={(e) => updateParam("zynHarmonics", Number(e.target.value), setZynHarmonics)}
                    />
                  </label>
                  <label className="ctrl-group">BANDWIDTH: {zynBandwidth}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={zynBandwidth}
                      onChange={(e) => updateParam("zynBandwidth", Number(e.target.value), setZynBandwidth)}
                    />
                  </label>
                  <label className="ctrl-group">SUB BOOST: {zynSubBoost}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={zynSubBoost}
                      onChange={(e) => updateParam("zynSubBoost", Number(e.target.value), setZynSubBoost)}
                    />
                  </label>
                  <label className="ctrl-group">FILTER TYPE :
                    <select
                      value={zynFilterType}
                      onChange={(e) => updateParam("zynFilterType", e.target.value, setZynFilterType)}
                    >
                      <option value="lowpass">Lowpass 24dB</option>
                      <option value="bandpass">Bandpass Resonant</option>
                      <option value="highpass">Highpass Notch</option>
                    </select>
                  </label>
                  <label className="ctrl-group">RESO PEAK: {zynReso}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={zynReso}
                      onChange={(e) => updateParam("zynReso", Number(e.target.value), setZynReso)}
                    />
                  </label>
                  <label className="ctrl-group">REVERB SEND: {zynReverbSend}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={zynReverbSend}
                      onChange={(e) => updateParam("zynReverbSend", Number(e.target.value), setZynReverbSend)}
                    />
                  </label>
                </div>
              )}

              {/* HELM */}
              {activeEngine === "helm" && (
                <div className="controls-grid">
                  <label className="ctrl-group">CROSSMOD: {helmCrossmod}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={helmCrossmod}
                      onChange={(e) => updateParam("helmCrossmod", Number(e.target.value), setHelmCrossmod)}
                    />
                  </label>
                  <label className="ctrl-group">FILTER CUTOFF: {helmCutoff} Hz
                    <input
                      type="range"
                      min={200}
                      max={8000}
                      value={helmCutoff}
                      onChange={(e) => updateParam("helmCutoff", Number(e.target.value), setHelmCutoff)}
                    />
                  </label>
                  <label className="ctrl-group">LFO SPEED: {helmLfoSpeed} Hz
                    <input
                      type="range"
                      min={0.1}
                      max={20}
                      step={0.1}
                      value={helmLfoSpeed}
                      onChange={(e) => updateParam("helmLfoSpeed", Number(e.target.value), setHelmLfoSpeed)}
                    />
                  </label>
                  <label className="ctrl-group">SUB OCTAVE: {helmSubOct}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={helmSubOct}
                      onChange={(e) => updateParam("helmSubOct", Number(e.target.value), setHelmSubOct)}
                    />
                  </label>
                  <label className="ctrl-group">REVERB WET: {helmReverb}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={helmReverb}
                      onChange={(e) => updateParam("helmReverb", Number(e.target.value), setHelmReverb)}
                    />
                  </label>
                </div>
              )}

              {/* FLUIDSYNTH SF2 */}
              {activeEngine === "fluidsynth" && (
                <div className="controls-grid">
                  <label className="ctrl-group">SOUNDFONT PRESET :
                    <select
                      value={fluidPreset}
                      onChange={(e) => updateParam("fluidPreset", e.target.value, setFluidPreset)}
                    >
                      <option value="Acoustic Grand Piano">Acoustic Grand Piano</option>
                      <option value="Electric Piano Rhodes">Electric Piano Rhodes</option>
                      <option value="Church Pipe Organ">Church Pipe Organ</option>
                      <option value="Symphonic Strings">Symphonic Strings</option>
                    </select>
                  </label>
                  <label className="ctrl-group">REVERB LEVEL: {fluidReverb}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={fluidReverb}
                      onChange={(e) => updateParam("fluidReverb", Number(e.target.value), setFluidReverb)}
                    />
                  </label>
                  <label className="ctrl-group">CHORUS DEPTH: {fluidChorus}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={fluidChorus}
                      onChange={(e) => updateParam("fluidChorus", Number(e.target.value), setFluidChorus)}
                    />
                  </label>
                  <label className="ctrl-group">MASTER VOLUME: {fluidVolume}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={fluidVolume}
                      onChange={(e) => updateParam("fluidVolume", Number(e.target.value), setFluidVolume)}
                    />
                  </label>
                  <label className="ctrl-group">STEREO PAN: {fluidPan}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={fluidPan}
                      onChange={(e) => updateParam("fluidPan", Number(e.target.value), setFluidPan)}
                    />
                  </label>
                </div>
              )}

              {/* AMSYNTH */}
              {activeEngine === "amsynth" && (
                <div className="controls-grid">
                  <label className="ctrl-group">PRIMARY OSC WAVE :
                    <select
                      value={amWave}
                      onChange={(e) => updateParam("amWave", e.target.value, setAmWave)}
                    >
                      <option value="sawtooth">Sawtooth Wave</option>
                      <option value="square">Square Wave</option>
                      <option value="sine">Sine Wave</option>
                      <option value="triangle">Triangle Wave</option>
                    </select>
                  </label>
                  <label className="ctrl-group">SUB OSC WAVE :
                    <select
                      value={amSubWave}
                      onChange={(e) => updateParam("amSubWave", e.target.value, setAmSubWave)}
                    >
                      <option value="square">Square Sub</option>
                      <option value="sine">Sine Sub</option>
                    </select>
                  </label>
                  <label className="ctrl-group">FILTER CUTOFF: {amCutoff} Hz
                    <input
                      type="range"
                      min={200}
                      max={8000}
                      value={amCutoff}
                      onChange={(e) => updateParam("amCutoff", Number(e.target.value), setAmCutoff)}
                    />
                  </label>
                  <label className="ctrl-group">RESONANCE: {amReso}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amReso}
                      onChange={(e) => updateParam("amReso", Number(e.target.value), setAmReso)}
                    />
                  </label>
                  <label className="ctrl-group">LFO DEPTH: {amLfoDepth}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amLfoDepth}
                      onChange={(e) => updateParam("amLfoDepth", Number(e.target.value), setAmLfoDepth)}
                    />
                  </label>
                  <label className="ctrl-group">AMP DECAY: {amDecay}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={amDecay}
                      onChange={(e) => updateParam("amDecay", Number(e.target.value), setAmDecay)}
                    />
                  </label>
                </div>
              )}

              {/* AMY C/JS */}
              {activeEngine === "amy_engine" && (
                <div className="controls-grid">
                  <label className="ctrl-group">PARTIAL COUNT: {amyPartialCount}
                    <input
                      type="range"
                      min={4}
                      max={64}
                      value={amyPartialCount}
                      onChange={(e) => updateParam("amyPartialCount", Number(e.target.value), setAmyPartialCount)}
                    />
                  </label>
                  <label className="ctrl-group">SPECTRAL SLOPE: {amySlope}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amySlope}
                      onChange={(e) => updateParam("amySlope", Number(e.target.value), setAmySlope)}
                    />
                  </label>
                  <label className="ctrl-group">PARTIAL SPREAD: {amySpread}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amySpread}
                      onChange={(e) => updateParam("amySpread", Number(e.target.value), setAmySpread)}
                    />
                  </label>
                  <label className="ctrl-group">FEEDBACK LOOP: {amyFeedback}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amyFeedback}
                      onChange={(e) => updateParam("amyFeedback", Number(e.target.value), setAmyFeedback)}
                    />
                  </label>
                  <label className="ctrl-group">CHIPTUNE NOISE: {amyNoise}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={amyNoise}
                      onChange={(e) => updateParam("amyNoise", Number(e.target.value), setAmyNoise)}
                    />
                  </label>
                </div>
              )}

              {/* PL_SYNTH 8-BIT */}
              {activeEngine === "pl_synth" && (
                <div className="controls-grid">
                  <label className="ctrl-group">BITCRUSH DEPTH: {plBitcrush} Bits
                    <input
                      type="range"
                      min={1}
                      max={16}
                      value={plBitcrush}
                      onChange={(e) => updateParam("plBitcrush", Number(e.target.value), setPlBitcrush)}
                    />
                  </label>
                  <label className="ctrl-group">SAMPLE RATE DIVIDE: /{plSampleRateDiv}
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={plSampleRateDiv}
                      onChange={(e) => updateParam("plSampleRateDiv", Number(e.target.value), setPlSampleRateDiv)}
                    />
                  </label>
                  <label className="ctrl-group">ARP SPEED: {plArpSpeed}
                    <input
                      type="range"
                      min={1}
                      max={24}
                      value={plArpSpeed}
                      onChange={(e) => updateParam("plArpSpeed", Number(e.target.value), setPlArpSpeed)}
                    />
                  </label>
                  <label className="ctrl-group">DUTY CYCLE: {plDutyCycle}%
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={plDutyCycle}
                      onChange={(e) => updateParam("plDutyCycle", Number(e.target.value), setPlDutyCycle)}
                    />
                  </label>
                  <label className="ctrl-group">GLITCH FX: {plGlitch}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plGlitch}
                      onChange={(e) => updateParam("plGlitch", Number(e.target.value), setPlGlitch)}
                    />
                  </label>
                </div>
              )}

              {/* OPEN303 ACID BASS */}
              {activeEngine === "open303" && (
                <div className="controls-grid">
                  <label className="ctrl-group">WAVEFORM :
                    <select
                      value={acidWave}
                      onChange={(e) => updateParam("acidWave", e.target.value, setAcidWave)}
                    >
                      <option value="sawtooth">Sawtooth (Salami Acid)</option>
                      <option value="square">Square (Sub Acid Punch)</option>
                    </select>
                  </label>
                  <label className="ctrl-group">CUTOFF BASS: {acidCutoff} Hz
                    <input
                      type="range"
                      min={200}
                      max={6000}
                      value={acidCutoff}
                      onChange={(e) => updateParam("acidCutoff", Number(e.target.value), setAcidCutoff)}
                    />
                  </label>
                  <label className="ctrl-group">RESONANCE SWEEP: {acidResonance}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={acidResonance}
                      onChange={(e) => updateParam("acidResonance", Number(e.target.value), setAcidResonance)}
                    />
                  </label>
                  <label className="ctrl-group">ENV MOD: {acidEnvMod}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={acidEnvMod}
                      onChange={(e) => updateParam("acidEnvMod", Number(e.target.value), setAcidEnvMod)}
                    />
                  </label>
                  <label className="ctrl-group">DECAY TIME: {acidDecay}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={acidDecay}
                      onChange={(e) => updateParam("acidDecay", Number(e.target.value), setAcidDecay)}
                    />
                  </label>
                  <label className="ctrl-group">PITCH TUNING: {acidTuning} st
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      value={acidTuning}
                      onChange={(e) => updateParam("acidTuning", Number(e.target.value), setAcidTuning)}
                    />
                  </label>
                  <label className="checkbox-ctrl">
                    <input
                      type="checkbox"
                      checked={acidAccent}
                      onChange={(e) => updateParam("acidAccent", e.target.checked, setAcidAccent)}
                    />
                    <span>ACCENT MODE (PUNCH)</span>
                  </label>
                </div>
              )}

              {/* FAUST DSP NODE */}
              {activeEngine === "faust_dsp" && (
                <div className="controls-grid">
                  <label className="ctrl-group">FREQ MODULATION: {faustFreqMod}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={faustFreqMod}
                      onChange={(e) => updateParam("faustFreqMod", Number(e.target.value), setFaustFreqMod)}
                    />
                  </label>
                  <label className="ctrl-group">DSP FILTER: {faustFilter} Hz
                    <input
                      type="range"
                      min={200}
                      max={8000}
                      value={faustFilter}
                      onChange={(e) => updateParam("faustFilter", Number(e.target.value), setFaustFilter)}
                    />
                  </label>
                  <label className="ctrl-group">GAIN BOOST: {faustGain}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={faustGain}
                      onChange={(e) => updateParam("faustGain", Number(e.target.value), setFaustGain)}
                    />
                  </label>
                  <label className="ctrl-group">DSP FEEDBACK: {faustFeedback}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={faustFeedback}
                      onChange={(e) => updateParam("faustFeedback", Number(e.target.value), setFaustFeedback)}
                    />
                  </label>
                  <label className="ctrl-group">WAVEFOLDER DRIVE: {faustDrive}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={faustDrive}
                      onChange={(e) => updateParam("faustDrive", Number(e.target.value), setFaustDrive)}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* VIRTUAL INTERACTIVE PIANO KEYBOARD BAR */}
            <div className="virtual-piano-bar">
              <div className="piano-bar-title">
                <span>🎹 CLAVIER INTERACTIF (CLIQUEZ UNE TOUCHE POUR TESTER LE SON) :</span>
              </div>
              <div className="piano-keys-row">
                {VIRTUAL_PIANO_KEYS.map((k) => (
                  <button
                    key={k.note}
                    type="button"
                    className={`piano-key ${k.isBlack ? "black-key" : "white-key"} ${activeKeyNote === k.note ? "key-pressed" : ""}`}
                    // Souris maintenue = note tenue, comme au clavier.
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setActiveKeyNote(k.note);
                      playPluginNote(k.freq, k.note);
                    }}
                    onPointerUp={() => {
                      releaseVoice(k.note);
                      setActiveKeyNote((c) => (c === k.note ? null : c));
                    }}
                    // Sans ça, un pointeur relâché hors du bouton laisserait
                    // la note tenue indéfiniment.
                    onPointerCancel={() => {
                      releaseVoice(k.note);
                      setActiveKeyNote((c) => (c === k.note ? null : c));
                    }}
                  >
                    <span className="key-note-label">{k.note}</span>
                    <span className="key-char-label">[{k.keyChar}]</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </section>
      </div>

      {/* SAVE CUSTOM PATCH MODAL */}
      {showSaveModal && (
        <div className="patch-modal-overlay">
          <div className="patch-modal-card">
            <h3>💾 ENREGISTRER LE PATCH</h3>
            <p>Sauvegarder la configuration sonore actuelle de <strong>{activeEngine.toUpperCase()}</strong> :</p>
            <input
              type="text"
              placeholder="Nom de votre patch (ex: Deep Sub Lead 1)..."
              value={newPatchName}
              onChange={(e) => setNewPatchName(e.target.value)}
              className="patch-name-input"
              autoFocus
            />
            <div className="modal-actions-row">
              <button type="button" className="action-btn cancel-btn" onClick={() => setShowSaveModal(false)}>
                ANNULER
              </button>
              <button type="button" className="action-btn save-btn" onClick={saveUserPatch}>
                ENREGISTRER
              </button>
            </div>
          </div>
        </div>
      )}

      <RackToast ref={toastRef} />
    </main>
  );
}
