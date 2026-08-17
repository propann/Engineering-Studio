/**
 * Canonical product contracts shared by the Hub and instrument studios.
 *
 * These are intentionally framework-free and serializable. They describe
 * product data, not UI state or a specific storage implementation.
 */

export const STUDIO_IDS = ['hub', 'op1', 'ep133'] as const;
export type StudioId = (typeof STUDIO_IDS)[number];

export const MACHINE_KINDS = ['op1', 'ep133'] as const;
export type MachineKind = (typeof MACHINE_KINDS)[number];

export type EntityId = string;
export type IsoDateString = string;

export type MachineConnectionState =
  | 'unknown'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface StudioProfile {
  schema: 'studio.profile.v1';
  id: EntityId;
  displayName: string;
  avatar?: string;
  language: 'en' | 'fr' | 'es';
  theme: 'light' | 'dark' | 'auto';
  activeWorkspaceId?: EntityId;
  machineIds: EntityId[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface StudioWorkspace {
  schema: 'studio.workspace.v1';
  id: EntityId;
  name: string;
  rootPath?: string;
  libraryPath?: string;
  machineIds: EntityId[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export type StudioProjectKind = MachineKind | 'shared';

export interface StudioProject {
  schema: 'studio.project.v1';
  id: EntityId;
  name: string;
  kind: StudioProjectKind;
  workspaceId: EntityId;
  format: string;
  tags: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface MachineCapabilities {
  midi: boolean;
  read: boolean;
  write: boolean;
  backup: boolean;
  restore: boolean;
}

export interface StudioMachine {
  schema: 'studio.machine.v1';
  id: EntityId;
  kind: MachineKind;
  name: string;
  enabled: boolean;
  serialNumber?: string;
  firmwareVersion?: string;
  capacityMb?: 64 | 128;
  connection: MachineConnectionState;
  capabilities: MachineCapabilities;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isStudioId(value: unknown): value is StudioId {
  return typeof value === 'string' && (STUDIO_IDS as readonly string[]).includes(value);
}

export function isMachineKind(value: unknown): value is MachineKind {
  return typeof value === 'string' && (MACHINE_KINDS as readonly string[]).includes(value);
}

export function isStudioWorkspace(value: unknown): value is StudioWorkspace {
  if (!isRecord(value)) return false;
  return value.schema === 'studio.workspace.v1'
    && isNonEmptyString(value.id)
    && isNonEmptyString(value.name)
    && Array.isArray(value.machineIds)
    && value.machineIds.every(isNonEmptyString)
    && isNonEmptyString(value.createdAt)
    && isNonEmptyString(value.updatedAt);
}

export function isStudioProject(value: unknown): value is StudioProject {
  if (!isRecord(value)) return false;
  return value.schema === 'studio.project.v1'
    && isNonEmptyString(value.id)
    && isNonEmptyString(value.name)
    && (value.kind === 'shared' || isMachineKind(value.kind))
    && isNonEmptyString(value.workspaceId)
    && isNonEmptyString(value.format)
    && Array.isArray(value.tags)
    && value.tags.every(isNonEmptyString)
    && isNonEmptyString(value.createdAt)
    && isNonEmptyString(value.updatedAt);
}
