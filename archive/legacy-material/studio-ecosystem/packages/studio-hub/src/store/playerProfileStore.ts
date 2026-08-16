import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  avatarEmoji?: string;
  createdAt: string;

  ownedMachines: {
    op1?: { enabled: boolean };
    ep133?: { enabled: boolean };
  };

  settings: {
    theme: 'light' | 'dark' | 'auto';
  };

  stats: {
    lastActiveAt: string;
    op1?: {
      backupsCreated: number;
      keyboardConfigs: number;
    };
    ep133?: {
      patternsEdited: number;
      trainingProgress: number;
    };
  };

  workspace?: {
    folderName: string;
  };
}

interface PlayerProfileStore {
  profile: PlayerProfile | null;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  clearProfile: () => void;
}

export const usePlayerProfileStore = create<PlayerProfileStore>()(
  persist(
    (set) => ({
      profile: null,

      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : (updates as PlayerProfile),
        }));
      },

      clearProfile: () => {
        set({ profile: null });
      },
    }),
    {
      name: 'studio-hub-profile',
    },
  ),
);
