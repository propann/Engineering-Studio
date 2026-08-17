/**
 * Shared Zustand Stores - Studio Hub Ecosystem
 * Unified state management for both studios
 */

export { usePlayerProfileStore } from './playerProfileStore';
export { useDeviceStore } from './deviceStore';
export { useWorkspaceStore } from './workspaceStore';
export { createStudioStore, hydrateStudioStore, useStudioStore } from './studioStore';
export { normalizeHubProfile } from './studioBridge';

export type { PlayerProfileStore } from './playerProfileStore';
export type { DeviceStore } from './deviceStore';
export type { WorkspaceStore } from './workspaceStore';
export type { StudioSnapshot, StudioStore } from './studioStore';
export type { HubMachineSelection } from './studioBridge';
