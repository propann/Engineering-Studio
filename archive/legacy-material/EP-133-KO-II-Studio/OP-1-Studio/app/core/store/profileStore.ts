'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OP1Profile {
  name: string;
  selectedPatchIndex: number;
  selectedSampleIndex: number;
  metronomeEnabled: boolean;
  masterVolume: number;
  selectedDrumKit: string;
}

interface ProfileStore {
  profile: OP1Profile;
  setProfile: (profile: Partial<OP1Profile>) => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: OP1Profile = {
  name: 'OP-1 Default',
  selectedPatchIndex: 0,
  selectedSampleIndex: 0,
  metronomeEnabled: false,
  masterVolume: 100,
  selectedDrumKit: 'OP-1 DR-1',
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,

      setProfile: (newProfile: Partial<OP1Profile>) =>
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        })),

      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: 'op1-profile-store',
      version: 1,
    }
  )
);
