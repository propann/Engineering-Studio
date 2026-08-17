/**
 * Shared Type Definitions - Studio Hub Ecosystem
 * Common types used by both OP-1 Studio and EP-133 Studio
 */

// ============================================================================
// PLAYER PROFILE
// ============================================================================

export interface PlayerSettings {
  preferredLanguage: 'en' | 'fr' | 'es';
  theme: 'light' | 'dark' | 'auto';
  midiChannel: number;
  velocityDefault: number;
}

export interface PlayerProfile {
  name: string;
  avatar?: string;
  avatarEmoji?: string;
  settings: PlayerSettings;
  workspace?: {
    rootPath: string;
    op1Folder?: string;
  };
}

// ============================================================================
// DEVICE INFO
// ============================================================================

export interface DeviceInfo {
  name: string;
  version: string;
  firmwareVersion?: string;
  serialNumber?: string;
}

export interface MidiMessage {
  status: number;
  data1: number;
  data2: number;
  channel?: number;
  timestamp?: number;
}

// ============================================================================
// STUDIO CONFIG
// ============================================================================

export interface StudioConfig {
  name: string;
  type: 'op1' | 'ep133';
  midiChannel?: number;
  autoConnect?: boolean;
  enablePWA?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface AsyncOperation<T> {
  isLoading: boolean;
  error?: string;
  data?: T;
}

export {
  MACHINE_KINDS,
  STUDIO_IDS,
  isMachineKind,
  isStudioId,
  isStudioProject,
  isStudioWorkspace,
} from './contracts.ts';

export type {
  EntityId,
  IsoDateString,
  MachineCapabilities,
  MachineConnectionState,
  MachineKind,
  StudioId,
  StudioMachine,
  StudioProfile,
  StudioProject,
  StudioProjectKind,
  StudioWorkspace,
} from './contracts.ts';
