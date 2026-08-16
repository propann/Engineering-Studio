import { create } from 'zustand';

interface AudioState {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;

  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (vol: number) => void;
  clear: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  audioBuffer: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1.0,

  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  clear: () => set({
    audioBuffer: null,
    isPlaying: false,
    currentTime: 0
  }),
}));
