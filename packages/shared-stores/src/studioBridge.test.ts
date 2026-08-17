import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeHubProfile } from './studioBridge.ts';

test('normalizes a Hub profile into the canonical studio snapshot', () => {
  const snapshot = normalizeHubProfile({
    name: 'Azoth',
    avatar: '🎛️',
    createdAt: '2026-08-17T10:00:00.000Z',
    machineInventory: [{ id: 'op1-main', kind: 'op1', name: 'Mon OP-1', enabled: true }],
    workspace: { name: 'Atelier principal' },
  });

  assert.equal(snapshot?.profile.displayName, 'Azoth');
  assert.equal(snapshot?.workspace?.name, 'Atelier principal');
  assert.equal(snapshot?.machines[0]?.id, 'op1-main');
});

test('applies the selected machine from a studio launch', () => {
  const snapshot = normalizeHubProfile({ name: 'Azoth', machineInventory: [] }, {
    id: 'ep133-live',
    kind: 'ep133',
    name: 'EP-133 de test',
    capacityMb: 128,
  });

  assert.equal(snapshot?.machines[0]?.id, 'ep133-live');
  assert.equal(snapshot?.machines[0]?.capacityMb, 128);
});
