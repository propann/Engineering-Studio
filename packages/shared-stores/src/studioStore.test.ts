import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStudioStore } from './studioStore.ts';

const profile = {
  schema: 'studio.profile.v1' as const,
  id: 'profile-1',
  displayName: 'Azoth',
  language: 'fr' as const,
  theme: 'dark' as const,
  machineIds: [],
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
};

const workspace = {
  schema: 'studio.workspace.v1' as const,
  id: 'workspace-1',
  name: 'Atelier principal',
  machineIds: [],
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
};

const machine = {
  schema: 'studio.machine.v1' as const,
  id: 'machine-1',
  kind: 'op1' as const,
  name: 'OP-1 principal',
  enabled: true,
  connection: 'disconnected' as const,
  capabilities: { midi: true, read: true, write: true, backup: true, restore: true },
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
};

test('stores the shared studio state in one place', () => {
  const store = createStudioStore();
  store.getState().setProfile(profile);
  store.getState().setWorkspace(workspace);
  store.getState().upsertMachine(machine);

  assert.equal(store.getState().profile?.displayName, 'Azoth');
  assert.equal(store.getState().workspace?.id, 'workspace-1');
  assert.equal(store.getState().machines['machine-1']?.kind, 'op1');

  store.getState().updateProfile({ displayName: 'Azoth Studio' });
  assert.equal(store.getState().profile?.displayName, 'Azoth Studio');

  store.getState().removeMachine('machine-1');
  assert.equal(store.getState().machines['machine-1'], undefined);
});

test('can clear the shared studio state', () => {
  const store = createStudioStore();
  store.getState().setWorkspace(workspace);
  store.getState().clearStudio();

  assert.equal(store.getState().profile, null);
  assert.equal(store.getState().workspace, null);
  assert.deepEqual(store.getState().machines, {});
});
