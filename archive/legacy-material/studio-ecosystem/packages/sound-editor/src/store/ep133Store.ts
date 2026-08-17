/**
 * EP-133 State Store
 * Manages patterns, pads, and playback state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DrumSample {
  id: string;
  name: string;
  audioBuffer?: AudioBuffer;
  duration: number;
  pitch: number;
}

export interface PatternStep {
  padIndex: number;
  velocity: number; // 0-127
  enabled: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  bpm: number;
  steps: number; // 4, 8, 16, 32
  data: PatternStep[][]; // [padIndex][stepIndex]
  length: number;
  createdAt: number;
}

export interface EP133State {
  // Pads & Sounds
  drums: DrumSample[]; // 16 drum sounds
  selectedPad: number; // 0-15

  // Patterns
  patterns: Pattern[];
  currentPattern: Pattern | null;
  currentStep: number;

  // Playback
  isPlaying: boolean;
  bpm: number;
  stepCount: number; // 4, 8, 16, 32

  // UI
  selectedPattern: string | null;

  // Actions
  setSelectedPad: (pad: number) => void;
  setDrums: (drums: DrumSample[]) => void;
  updateDrumSample: (index: number, sample: DrumSample) => void;

  // Pattern Management
  createPattern: (name: string) => void;
  deletePattern: (id: string) => void;
  loadPattern: (id: string) => void;
  savePattern: (pattern: Pattern) => void;
  clearPattern: () => void;

  // Playback Control
  setIsPlaying: (playing: boolean) => void;
  setBPM: (bpm: number) => void;
  setStepCount: (steps: number) => void;
  advanceStep: () => void;
  resetStep: () => void;

  // Pattern Editing
  toggleStep: (padIndex: number, stepIndex: number) => void;
  setStepVelocity: (padIndex: number, stepIndex: number, velocity: number) => void;
  getStepData: (padIndex: number, stepIndex: number) => PatternStep | null;
}

const defaultDrums: DrumSample[] = Array.from({ length: 16 }, (_, i) => ({
  id: `drum-${i}`,
  name: ['Kick', 'Snare', 'HiHat', 'Tom High', 'Tom Mid', 'Tom Low', 'Cymbal', 'Perc', 'Bass', 'Pad', 'Lead', 'Synth', 'Bell', 'Buzz', 'Noise', 'Sine'][i],
  duration: 0.5,
  pitch: 0
}));

const createDefaultPattern = (): Pattern => ({
  id: `pattern-${Date.now()}`,
  name: 'Untitled Pattern',
  bpm: 120,
  steps: 16,
  data: Array.from({ length: 16 }, () =>
    Array.from({ length: 32 }, () => ({
      padIndex: 0,
      velocity: 0,
      enabled: false
    }))
  ),
  length: 0,
  createdAt: Date.now()
});

export const useEP133Store = create<EP133State>()(
  persist(
    (set, get) => ({
      // Initial State
      drums: defaultDrums,
      selectedPad: 0,
      patterns: [],
      currentPattern: createDefaultPattern(),
      currentStep: 0,
      isPlaying: false,
      bpm: 120,
      stepCount: 16,
      selectedPattern: null,

      // Pad Actions
      setSelectedPad: (pad: number) =>
        set({ selectedPad: Math.max(0, Math.min(15, pad)) }),

      setDrums: (drums: DrumSample[]) => set({ drums }),

      updateDrumSample: (index: number, sample: DrumSample) =>
        set((state) => ({
          drums: state.drums.map((d, i) => (i === index ? sample : d))
        })),

      // Pattern Management
      createPattern: (name: string) => {
        const newPattern = createDefaultPattern();
        newPattern.name = name;
        set((state) => ({
          patterns: [...state.patterns, newPattern],
          currentPattern: newPattern,
          selectedPattern: newPattern.id
        }));
      },

      deletePattern: (id: string) =>
        set((state) => ({
          patterns: state.patterns.filter((p) => p.id !== id),
          currentPattern: state.currentPattern?.id === id ? null : state.currentPattern,
          selectedPattern: state.selectedPattern === id ? null : state.selectedPattern
        })),

      loadPattern: (id: string) =>
        set((state) => {
          const pattern = state.patterns.find((p) => p.id === id);
          return {
            currentPattern: pattern || null,
            selectedPattern: id,
            currentStep: 0
          };
        }),

      savePattern: (pattern: Pattern) =>
        set((state) => ({
          patterns: state.patterns.map((p) => (p.id === pattern.id ? pattern : p)),
          currentPattern: pattern
        })),

      clearPattern: () => {
        const empty = createDefaultPattern();
        set({
          currentPattern: empty,
          currentStep: 0
        });
      },

      // Playback Control
      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

      setBPM: (bpm: number) =>
        set((state) => ({
          bpm: Math.max(40, Math.min(300, bpm)),
          currentPattern: state.currentPattern
            ? { ...state.currentPattern, bpm: Math.max(40, Math.min(300, bpm)) }
            : null
        })),

      setStepCount: (steps: number) => {
        const validSteps = [4, 8, 16, 32];
        if (!validSteps.includes(steps)) return;

        set((state) => ({
          stepCount: steps,
          currentPattern: state.currentPattern
            ? { ...state.currentPattern, steps }
            : null,
          currentStep: 0
        }));
      },

      advanceStep: () =>
        set((state) => ({
          currentStep: (state.currentStep + 1) % (state.currentPattern?.steps || 16)
        })),

      resetStep: () => set({ currentStep: 0 }),

      // Pattern Editing
      toggleStep: (padIndex: number, stepIndex: number) => {
        set((state) => {
          if (!state.currentPattern) return state;

          const newData = state.currentPattern.data.map((padData, i) =>
            i === padIndex
              ? padData.map((step, j) =>
                  j === stepIndex
                    ? { ...step, enabled: !step.enabled, velocity: !step.enabled ? 100 : 0 }
                    : step
                )
              : padData
          );

          return {
            currentPattern: {
              ...state.currentPattern,
              data: newData
            }
          };
        });
      },

      setStepVelocity: (padIndex: number, stepIndex: number, velocity: number) => {
        set((state) => {
          if (!state.currentPattern) return state;

          const newData = state.currentPattern.data.map((padData, i) =>
            i === padIndex
              ? padData.map((step, j) =>
                  j === stepIndex
                    ? { ...step, velocity: Math.max(0, Math.min(127, velocity)) }
                    : step
                )
              : padData
          );

          return {
            currentPattern: {
              ...state.currentPattern,
              data: newData
            }
          };
        });
      },

      getStepData: (padIndex: number, stepIndex: number) => {
        const state = get();
        return state.currentPattern?.data[padIndex][stepIndex] || null;
      }
    }),
    {
      name: 'ep133-store',
      partialize: (state) => ({
        patterns: state.patterns,
        drums: state.drums,
        bpm: state.bpm,
        stepCount: state.stepCount
      })
    }
  )
);
