import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkspaceStore {
  rootPath: string | null;
  op1FolderPath: string | null;
  libraryPath: string | null;

  setWorkspacePath: (path: string) => void;
  setOp1FolderPath: (path: string) => void;
  setLibraryPath: (path: string) => void;
  clearPaths: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      rootPath: null,
      op1FolderPath: null,
      libraryPath: null,

      setWorkspacePath: (path) => set({ rootPath: path }),
      setOp1FolderPath: (path) => set({ op1FolderPath: path }),
      setLibraryPath: (path) => set({ libraryPath: path }),

      clearPaths: () =>
        set({
          rootPath: null,
          op1FolderPath: null,
          libraryPath: null,
        }),
    }),
    {
      name: 'studio-hub:workspace',
    }
  )
);
