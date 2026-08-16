import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerProfile } from '@studio-hub/types';

export interface PlayerProfileStore {
  profile: PlayerProfile | null;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  clearProfile: () => void;
}

const defaultProfile: PlayerProfile = {
  name: 'Studio Player',
  settings: {
    preferredLanguage: 'en',
    theme: 'auto',
    midiChannel: 0,
    velocityDefault: 100,
  },
};

export const usePlayerProfileStore = create<PlayerProfileStore>()(
  persist(
    (set) => ({
      profile: null,

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : { ...defaultProfile, ...updates },
        })),

      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'studio-hub:player-profile',
    }
  )
);
