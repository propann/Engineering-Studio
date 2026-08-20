/**
 * Audio Rack State Management
 * Zustand store for centralized audio state management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AudioRackState,
  PatchPreset,
  AUDIO_RACK_DEFAULTS,
  EnginePluginType,
  MultiTapDelayParams,
  ParametricEQParams,
  ADSRParams,
  ArpeggiatorParams,
  ExportProgress,
  SamplePackProgress,
} from "../types/audio";

const LOG = console;

interface AudioRackStore extends AudioRackState {
  // Patch Management
  setPatch(patch: PatchPreset): void;
  addUserPatch(patch: PatchPreset): void;
  updateUserPatch(id: string, updates: Partial<PatchPreset>): void;
  deleteUserPatch(id: string): void;
  getUserPatches(): PatchPreset[];

  // Engine & Parameters
  setSelectedEngine(engine: EnginePluginType): void;
  setEngineParam(key: string, value: any): void;
  getEngineParams(): Record<string, any>;

  // Master Controls
  setMasterVolume(volume: number): void;
  setMasterDetune(cents: number): void;

  // Effects
  setDelayParams(params: Partial<MultiTapDelayParams>): void;
  setEQParams(params: Partial<ParametricEQParams>): void;

  // Modulation
  setADSR(params: Partial<ADSRParams>): void;
  setArpeggiator(params: Partial<ArpeggiatorParams>): void;

  // UI State
  setMidiConnected(connected: boolean): void;
  setActiveKeyNote(note: string | null): void;
  setToastMessage(message: string | null): void;
  setShowSaveModal(show: boolean): void;

  // Export
  setExportProgress(progress: ExportProgress): void;
  setSamplePackProgress(progress: SamplePackProgress): void;

  // Utilities
  reset(): void;
  exportState(): string;
  importState(json: string): boolean;
}

// Create Zustand store with persistence
export const useAudioRackStore = create<AudioRackStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // INITIAL STATE
      // ========================================================================
      selectedEngine: "mi_plaits" as EnginePluginType,
      selectedPatchId: "pl1",
      userPatches: [],
      masterVolume: 85,
      masterDetune: 0,
      midiConnected: false,
      activeKeyNote: null,
      toastMessage: null,
      showSaveModal: false,
      delayParams: AUDIO_RACK_DEFAULTS.delayParams!,
      eqParams: AUDIO_RACK_DEFAULTS.eqParams!,
      distortionParams: {
        type: "soft_clip",
        drive: 0,
        tone: 50,
        outputGain: 0,
      },
      adsr: AUDIO_RACK_DEFAULTS.adsr!,
      arpeggiator: AUDIO_RACK_DEFAULTS.arpeggiator!,
      lfos: [
        {
          shape: "sine",
          rate: 2.0,
          depth: 50,
          phase: 0,
          tempoSync: false,
        },
      ],
      engineParams: {},
      exportProgress: {
        status: "idle",
        progress: 0,
        message: "",
      },
      samplePackProgress: {
        status: "idle",
        progress: 0,
        currentSample: "",
        totalSamples: 0,
      },

      // ========================================================================
      // PATCH MANAGEMENT
      // ========================================================================

      setPatch(patch: PatchPreset) {
        set({
          selectedPatchId: patch.id,
          selectedEngine: patch.engine,
          engineParams: { ...patch.params },
        });
        LOG.info(`[AudioRackStore] Patch loaded: ${patch.name}`);
      },

      addUserPatch(patch: PatchPreset) {
        const state = get();
        const updated = [...state.userPatches, patch];
        set({ userPatches: updated });
        LOG.info(`[AudioRackStore] Patch saved: ${patch.name}`);
      },

      updateUserPatch(id: string, updates: Partial<PatchPreset>) {
        const state = get();
        const updated = state.userPatches.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        set({ userPatches: updated });
        LOG.info(`[AudioRackStore] Patch updated: ${id}`);
      },

      deleteUserPatch(id: string) {
        const state = get();
        const updated = state.userPatches.filter((p) => p.id !== id);
        set({ userPatches: updated });
        LOG.info(`[AudioRackStore] Patch deleted: ${id}`);
      },

      getUserPatches(): PatchPreset[] {
        return get().userPatches;
      },

      // ========================================================================
      // ENGINE & PARAMETERS
      // ========================================================================

      setSelectedEngine(engine: EnginePluginType) {
        set({ selectedEngine: engine });
        LOG.info(`[AudioRackStore] Engine selected: ${engine}`);
      },

      setEngineParam(key: string, value: any) {
        const state = get();
        set({
          engineParams: {
            ...state.engineParams,
            [key]: value,
          },
        });
      },

      getEngineParams(): Record<string, any> {
        return get().engineParams;
      },

      // ========================================================================
      // MASTER CONTROLS
      // ========================================================================

      setMasterVolume(volume: number) {
        set({ masterVolume: Math.max(0, Math.min(100, volume)) });
      },

      setMasterDetune(cents: number) {
        set({ masterDetune: Math.max(-120, Math.min(120, cents)) });
      },

      // ========================================================================
      // EFFECTS
      // ========================================================================

      setDelayParams(params: Partial<MultiTapDelayParams>) {
        const state = get();
        set({
          delayParams: {
            ...state.delayParams,
            ...params,
          },
        });
      },

      setEQParams(params: Partial<ParametricEQParams>) {
        const state = get();
        set({
          eqParams: {
            ...state.eqParams,
            ...params,
          },
        });
      },

      // ========================================================================
      // MODULATION
      // ========================================================================

      setADSR(params: Partial<ADSRParams>) {
        const state = get();
        set({
          adsr: {
            ...state.adsr,
            ...params,
          },
        });
      },

      setArpeggiator(params: Partial<ArpeggiatorParams>) {
        const state = get();
        set({
          arpeggiator: {
            ...state.arpeggiator,
            ...params,
          },
        });
      },

      // ========================================================================
      // UI STATE
      // ========================================================================

      setMidiConnected(connected: boolean) {
        set({ midiConnected: connected });
        LOG.info(`[AudioRackStore] MIDI ${connected ? "connected" : "disconnected"}`);
      },

      setActiveKeyNote(note: string | null) {
        set({ activeKeyNote: note });
      },

      setToastMessage(message: string | null) {
        set({ toastMessage: message });
      },

      setShowSaveModal(show: boolean) {
        set({ showSaveModal: show });
      },

      // ========================================================================
      // EXPORT & SAMPLES
      // ========================================================================

      setExportProgress(progress: ExportProgress) {
        set({ exportProgress: progress });
        if (progress.status === "complete") {
          LOG.info(`[AudioRackStore] Export completed`);
        } else if (progress.status === "error") {
          LOG.error(`[AudioRackStore] Export error:`, progress.error);
        }
      },

      setSamplePackProgress(progress: SamplePackProgress) {
        set({ samplePackProgress: progress });
      },

      // ========================================================================
      // UTILITIES
      // ========================================================================

      reset(): void {
        set({
          selectedEngine: "mi_plaits",
          selectedPatchId: "pl1",
          masterVolume: 85,
          masterDetune: 0,
          engineParams: {},
          userPatches: [],
          midiConnected: false,
          activeKeyNote: null,
          toastMessage: null,
          showSaveModal: false,
          delayParams: AUDIO_RACK_DEFAULTS.delayParams!,
          eqParams: AUDIO_RACK_DEFAULTS.eqParams!,
          adsr: AUDIO_RACK_DEFAULTS.adsr!,
          arpeggiator: AUDIO_RACK_DEFAULTS.arpeggiator!,
        });
        LOG.info("[AudioRackStore] State reset to defaults");
      },

      exportState(): string {
        const state = get();
        // Exclude functions and volatile state
        const exportable = {
          selectedEngine: state.selectedEngine,
          selectedPatchId: state.selectedPatchId,
          userPatches: state.userPatches,
          masterVolume: state.masterVolume,
          masterDetune: state.masterDetune,
          delayParams: state.delayParams,
          eqParams: state.eqParams,
          adsr: state.adsr,
          arpeggiator: state.arpeggiator,
          engineParams: state.engineParams,
        };
        return JSON.stringify(exportable, null, 2);
      },

      importState(json: string): boolean {
        try {
          const data = JSON.parse(json);
          set({
            selectedEngine: data.selectedEngine || "mi_plaits",
            selectedPatchId: data.selectedPatchId || "pl1",
            userPatches: data.userPatches || [],
            masterVolume: data.masterVolume || 85,
            masterDetune: data.masterDetune || 0,
            delayParams: data.delayParams || AUDIO_RACK_DEFAULTS.delayParams,
            eqParams: data.eqParams || AUDIO_RACK_DEFAULTS.eqParams,
            adsr: data.adsr || AUDIO_RACK_DEFAULTS.adsr,
            arpeggiator: data.arpeggiator || AUDIO_RACK_DEFAULTS.arpeggiator,
            engineParams: data.engineParams || {},
          });
          LOG.info("[AudioRackStore] State imported successfully");
          return true;
        } catch (error) {
          LOG.error("[AudioRackStore] Failed to import state:", error);
          return false;
        }
      },
    }),

    // ========================================================================
    // PERSISTENCE CONFIG
    // ========================================================================
    {
      name: "studio-hub-audio-rack",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations between versions
        return persistedState as AudioRackStore;
      },
      // Only persist specific keys (not functions)
      partialize: (state) => ({
        userPatches: state.userPatches,
        masterVolume: state.masterVolume,
        masterDetune: state.masterDetune,
        selectedEngine: state.selectedEngine,
        selectedPatchId: state.selectedPatchId,
        delayParams: state.delayParams,
        eqParams: state.eqParams,
        adsr: state.adsr,
        arpeggiator: state.arpeggiator,
      }),
    }
  )
);

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

export const selectSelectedEngine = (state: AudioRackStore) =>
  state.selectedEngine;

export const selectMasterVolume = (state: AudioRackStore) =>
  state.masterVolume;

export const selectUserPatches = (state: AudioRackStore) =>
  state.userPatches;

export const selectDelayParams = (state: AudioRackStore) =>
  state.delayParams;

export const selectEQParams = (state: AudioRackStore) =>
  state.eqParams;

export const selectADSR = (state: AudioRackStore) =>
  state.adsr;

export const selectArpeggiator = (state: AudioRackStore) =>
  state.arpeggiator;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

export function useAudioRackEngine() {
  return useAudioRackStore((state) => ({
    engine: state.selectedEngine,
    setEngine: state.setSelectedEngine,
    params: state.engineParams,
    setParam: state.setEngineParam,
  }));
}

export function useAudioRackMaster() {
  return useAudioRackStore((state) => ({
    volume: state.masterVolume,
    detune: state.masterDetune,
    setVolume: state.setMasterVolume,
    setDetune: state.setMasterDetune,
  }));
}

export function useAudioRackEffects() {
  return useAudioRackStore((state) => ({
    delay: state.delayParams,
    setDelay: state.setDelayParams,
    eq: state.eqParams,
    setEQ: state.setEQParams,
  }));
}

export function useAudioRackModulation() {
  return useAudioRackStore((state) => ({
    adsr: state.adsr,
    setADSR: state.setADSR,
    arpeggiator: state.arpeggiator,
    setArpeggiator: state.setArpeggiator,
  }));
}

export function useAudioRackPatches() {
  return useAudioRackStore((state) => ({
    patches: state.userPatches,
    selectedId: state.selectedPatchId,
    setPatch: state.setPatch,
    addPatch: state.addUserPatch,
    updatePatch: state.updateUserPatch,
    deletePatch: state.deleteUserPatch,
  }));
}

export function useAudioRackExport() {
  return useAudioRackStore((state) => ({
    exportProgress: state.exportProgress,
    setExportProgress: state.setExportProgress,
    samplePackProgress: state.samplePackProgress,
    setSamplePackProgress: state.setSamplePackProgress,
  }));
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

export function logAudioRackState() {
  const state = useAudioRackStore.getState();
  LOG.group("🎛️ Audio Rack State");
  LOG.table({
    engine: state.selectedEngine,
    volume: `${state.masterVolume}%`,
    detune: `${state.masterDetune} cents`,
    patches: state.userPatches.length,
    midiConnected: state.midiConnected,
  });
  LOG.groupEnd();
}

export function dumpAudioRackState() {
  const state = useAudioRackStore.getState();
  return state.exportState();
}
