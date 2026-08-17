import { create } from 'zustand';
import type { EntityId, StudioMachine, StudioProfile, StudioWorkspace } from '@studio-hub/types';

export interface StudioStore {
  profile: StudioProfile | null;
  workspace: StudioWorkspace | null;
  machines: Record<EntityId, StudioMachine>;

  setProfile: (profile: StudioProfile | null) => void;
  updateProfile: (updates: Partial<Omit<StudioProfile, 'schema' | 'id' | 'createdAt'>>) => void;
  setWorkspace: (workspace: StudioWorkspace | null) => void;
  upsertMachine: (machine: StudioMachine) => void;
  removeMachine: (machineId: EntityId) => void;
  clearStudio: () => void;
}

export interface StudioSnapshot {
  profile: StudioProfile;
  workspace: StudioWorkspace | null;
  machines: StudioMachine[];
}

const emptyState = {
  profile: null,
  workspace: null,
  machines: {},
} satisfies Pick<StudioStore, 'profile' | 'workspace' | 'machines'>;

function now(): string {
  return new Date().toISOString();
}

export function createStudioStore() {
  return create<StudioStore>((set) => ({
    ...emptyState,

    setProfile: (profile) => set({ profile }),

    updateProfile: (updates) =>
      set((state) => state.profile
        ? { profile: { ...state.profile, ...updates, updatedAt: now() } }
        : state),

    setWorkspace: (workspace) => set({ workspace }),

    upsertMachine: (machine) =>
      set((state) => ({ machines: { ...state.machines, [machine.id]: machine } })),

    removeMachine: (machineId) =>
      set((state) => {
        const machines = { ...state.machines };
        delete machines[machineId];
        return { machines };
      }),

    clearStudio: () => set(emptyState),
  }));
}

export const useStudioStore = createStudioStore();

export function hydrateStudioStore(snapshot: StudioSnapshot | null): void {
  const store = useStudioStore.getState();
  if (!snapshot) {
    store.clearStudio();
    return;
  }

  store.setProfile(snapshot.profile);
  store.setWorkspace(snapshot.workspace);
  const activeMachineIds = new Set(snapshot.machines.map((machine) => machine.id));
  for (const machineId of Object.keys(store.machines)) {
    if (!activeMachineIds.has(machineId)) store.removeMachine(machineId);
  }
  for (const machine of snapshot.machines) store.upsertMachine(machine);
}
