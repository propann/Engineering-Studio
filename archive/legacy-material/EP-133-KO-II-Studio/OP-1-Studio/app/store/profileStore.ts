import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalDirectoryHandle } from '../core/storage/directoryHandleStore';
import { storageHelpers } from '../core/storage/webFileSystem';

export interface Op1Profile {
  deviceName: string;
  lastBackupDate?: string;
  totalBackups: number;
}

interface ProfileStore {
  profile: Op1Profile;
  profileFolderHandle: LocalDirectoryHandle | null;
  updateProfile: (updates: Partial<Op1Profile>) => void;
  setProfileFolder: (handle: LocalDirectoryHandle | null) => void;
  loadProfileFolder: () => Promise<void>;
}

/**
 * OP-1 Profile Store
 * Centralizes profile state (device name, backup history, etc.)
 * Inspired by EP-133's state management pattern but OP-1 specific
 */
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: {
        deviceName: 'My OP-1',
        totalBackups: 0,
      },
      profileFolderHandle: null,

      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },

      setProfileFolder: (handle) => {
        set({ profileFolderHandle: handle });
        if (handle) {
          void storageHelpers.saveProfileFolder(handle);
        }
      },

      loadProfileFolder: async () => {
        const handle = await storageHelpers.loadProfileFolder();
        if (handle) {
          set({ profileFolderHandle: handle });
        }
      },
    }),
    {
      name: 'op1-profile-store',
      partialize: (state) => ({
        profile: state.profile,
        // Don't persist handles; they're reloaded on startup
      }),
    },
  ),
);
