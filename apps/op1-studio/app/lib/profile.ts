export type LocalProfileMachine = { name: string; deviceIdentityRef?: string; lastSnapshot?: string; notes?: string };
export type LocalProfile = { schema: "op1-studio-profile"; version: 1; pseudo: string; machines: LocalProfileMachine[]; localSpace: { root: string; usedBytes?: number; availableBytes?: number }; shareMarkers: string[]; preferences: { language: "fr" | "en"; keyboard: "azerty" | "qwerty"; theme: "machine" } };

export const DEFAULT_PROFILE: LocalProfile = { schema: "op1-studio-profile", version: 1, pseudo: "Mon atelier OP-1", machines: [], localSpace: { root: "backups/" }, shareMarkers: [], preferences: { language: "fr", keyboard: "azerty", theme: "machine" } };

function text(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value.trim() : fallback; }

export function normalizeProfile(value: unknown): LocalProfile {
  const input = value && typeof value === "object" ? value as Partial<LocalProfile> : {};
  const preferences = (input.preferences ?? {}) as Partial<LocalProfile["preferences"]>;
  const machines = Array.isArray(input.machines) ? input.machines : [];
  return { ...DEFAULT_PROFILE, pseudo: text(input.pseudo, DEFAULT_PROFILE.pseudo), machines: machines.filter((machine): machine is LocalProfileMachine => Boolean(machine && typeof machine === "object")).map((machine) => ({ name: text(machine.name, "OP-1"), ...(machine.deviceIdentityRef ? { deviceIdentityRef: text(machine.deviceIdentityRef, "") } : {}), ...(machine.lastSnapshot ? { lastSnapshot: text(machine.lastSnapshot, "") } : {}), ...(machine.notes ? { notes: text(machine.notes, "") } : {}) })), localSpace: { root: text(input.localSpace?.root, DEFAULT_PROFILE.localSpace.root), usedBytes: input.localSpace?.usedBytes, availableBytes: input.localSpace?.availableBytes }, shareMarkers: Array.isArray(input.shareMarkers) ? input.shareMarkers.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [], preferences: { language: preferences.language === "en" ? "en" : "fr", keyboard: preferences.keyboard === "qwerty" ? "qwerty" : "azerty", theme: "machine" } };
}

export function serializeProfile(profile: LocalProfile): string { return `${JSON.stringify(normalizeProfile(profile), null, 2)}\n`; }
export function parseProfile(serialized: string): LocalProfile { try { return normalizeProfile(JSON.parse(serialized)); } catch { return DEFAULT_PROFILE; } }
