'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LibraryStore {
  libraryPath: string | null;
  keyboardLayoutPath: string | null;
  patchesPath: string | null;
  samplesPath: string | null;

  setLibraryPath: (path: string) => void;
  setKeyboardLayoutPath: (path: string) => void;
  setPatchesPath: (path: string) => void;
  setSamplesPath: (path: string) => void;
  clearPaths: () => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      libraryPath: null,
      keyboardLayoutPath: null,
      patchesPath: null,
      samplesPath: null,

      setLibraryPath: (path: string) =>
        set({ libraryPath: path }),

      setKeyboardLayoutPath: (path: string) =>
        set({ keyboardLayoutPath: path }),

      setPatchesPath: (path: string) =>
        set({ patchesPath: path }),

      setSamplesPath: (path: string) =>
        set({ samplesPath: path }),

      clearPaths: () =>
        set({
          libraryPath: null,
          keyboardLayoutPath: null,
          patchesPath: null,
          samplesPath: null,
        }),
    }),
    {
      name: 'op1-library-store',
      version: 1,
    }
  )
);
