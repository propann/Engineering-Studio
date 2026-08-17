import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isMachineKind, isStudioId, isStudioProject, isStudioWorkspace } from './contracts.ts';

test('recognizes canonical studio and machine identifiers', () => {
  assert.equal(isStudioId('hub'), true);
  assert.equal(isStudioId('unknown'), false);
  assert.equal(isMachineKind('op1'), true);
  assert.equal(isMachineKind('hub'), false);
});

test('validates a workspace contract', () => {
  assert.equal(isStudioWorkspace({
    schema: 'studio.workspace.v1',
    id: 'workspace-1',
    name: 'Mon atelier',
    machineIds: ['machine-1'],
    createdAt: '2026-08-17T10:00:00.000Z',
    updatedAt: '2026-08-17T10:00:00.000Z',
  }), true);

  assert.equal(isStudioWorkspace({ schema: 'studio.workspace.v0', id: 'old' }), false);
});

test('validates a project contract', () => {
  const project = {
    schema: 'studio.project.v1',
    id: 'project-1',
    name: 'Premier projet',
    kind: 'op1',
    workspaceId: 'workspace-1',
    format: 'op1-studio-project',
    tags: ['idee'],
    createdAt: '2026-08-17T10:00:00.000Z',
    updatedAt: '2026-08-17T10:00:00.000Z',
  };

  assert.equal(isStudioProject(project), true);
  assert.equal(isStudioProject({ ...project, tags: [''] }), false);
});
