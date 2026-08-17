import type { MachineKind, StudioMachine, StudioProfile, StudioWorkspace } from '@studio-hub/types';
import { MACHINE_KINDS } from '@studio-hub/types';
import type { StudioSnapshot } from './studioStore';

export interface HubMachineSelection {
  id?: string;
  kind?: MachineKind;
  name?: string;
  capacityMb?: 64 | 128;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function machineKind(value: unknown): MachineKind | null {
  return typeof value === 'string' && (MACHINE_KINDS as readonly string[]).includes(value)
    ? value as MachineKind
    : null;
}

function asCapacity(value: unknown): 64 | 128 | undefined {
  return value === 128 || value === '128' ? 128 : value === 64 || value === '64' ? 64 : undefined;
}

export function normalizeHubProfile(input: unknown, selection?: HubMachineSelection): StudioSnapshot | null {
  if (!isRecord(input)) return null;

  const createdAt = nonEmptyString(input.createdAt, new Date().toISOString());
  const inventory = Array.isArray(input.machineInventory) ? input.machineInventory : [];
  const legacyMachines = isRecord(input.machines) ? input.machines : {};
  const rawMachines = inventory.length
    ? inventory
    : selection
      ? [{
        id: selection.id ?? `${selection.kind ?? 'ep133'}-1`,
        kind: selection.kind ?? 'ep133',
        name: selection.name ?? (selection.kind === 'op1' ? 'OP-1' : 'EP-133 K.O. II'),
      }]
      : MACHINE_KINDS.map((kind) => ({
        id: `${kind}-1`,
        kind,
        name: kind === 'op1' ? 'OP-1' : 'EP-133 K.O. II',
        ...(isRecord(legacyMachines[kind]) ? legacyMachines[kind] : {}),
      }));

  const machines: StudioMachine[] = rawMachines.flatMap((raw, index) => {
    if (!isRecord(raw)) return [];
    const kind = machineKind(raw.kind) ?? (machineKind(raw.model) ?? null);
    if (!kind) return [];
    const id = nonEmptyString(raw.id, `${kind}-${index + 1}`);
    const selected = selection && (selection.id === id || (!selection.id && selection.kind === kind));
    const name = nonEmptyString(selected ? selection.name : raw.name, kind === 'op1' ? 'OP-1' : 'EP-133 K.O. II');
    const capacityMb = asCapacity(selected ? selection.capacityMb : raw.capacityMb) ?? asCapacity(raw.memory);
    return [{
      schema: 'studio.machine.v1',
      id,
      kind,
      name,
      enabled: raw.enabled !== false,
      capacityMb,
      connection: 'unknown',
      capabilities: { midi: true, read: true, write: true, backup: true, restore: true },
      createdAt,
      updatedAt: new Date().toISOString(),
    }];
  });

  if (selection && !machines.some((machine) => machine.id === selection.id)) {
    const kind = selection.kind ?? 'ep133';
    machines.push({
      schema: 'studio.machine.v1',
      id: selection.id ?? `${kind}-1`,
      kind,
      name: selection.name ?? (kind === 'op1' ? 'OP-1' : 'EP-133 K.O. II'),
      enabled: true,
      capacityMb: selection.capacityMb,
      connection: 'unknown',
      capabilities: { midi: true, read: true, write: true, backup: true, restore: true },
      createdAt,
      updatedAt: new Date().toISOString(),
    });
  }

  const workspaceInput = isRecord(input.workspace) ? input.workspace : null;
  const workspace: StudioWorkspace | null = workspaceInput
    ? {
      schema: 'studio.workspace.v1',
      id: 'local-workspace',
      name: nonEmptyString(workspaceInput.name, 'Espace partagé'),
      machineIds: machines.map((machine) => machine.id),
      createdAt,
      updatedAt: new Date().toISOString(),
    }
    : null;

  const settings = isRecord(input.settings) ? input.settings : {};
  const language = settings.preferredLanguage === 'en' || settings.preferredLanguage === 'es' || settings.preferredLanguage === 'fr'
    ? settings.preferredLanguage
    : 'fr';
  const theme = settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'auto'
    ? settings.theme
    : 'dark';
  const profile: StudioProfile = {
    schema: 'studio.profile.v1',
    id: 'local-player',
    displayName: nonEmptyString(input.name ?? input.displayName, 'Studio Player'),
    avatar: typeof input.avatar === 'string' ? input.avatar : undefined,
    language,
    theme,
    activeWorkspaceId: workspace?.id,
    machineIds: machines.map((machine) => machine.id),
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  return { profile, workspace, machines };
}
