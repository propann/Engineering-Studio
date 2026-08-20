export const PROFILE_STORAGE_KEY = "studio-hub-profile";
export const PROFILE_VERSION = 2;
export const DEFAULT_PROFILE_NAME = "NOUVEAU MEMBRE";

export interface StudioProfile {
  version: number;
  name: string;
  bio: string;
  avatar?: string;
  workspace?: { name: string; folders?: string[] };
  machineInventory?: unknown;
  drives?: unknown;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Convertit les anciennes fiches en schéma courant sans perdre leurs champs. */
export function migrateProfile(value: unknown): StudioProfile | null {
  if (!isRecord(value)) return null;

  return {
    ...value,
    version: PROFILE_VERSION,
    name: typeof value.name === "string" ? value.name.trim() : "",
    bio: typeof value.bio === "string" ? value.bio : "",
  };
}

export function readProfile(): StudioProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const profile = migrateProfile(parsed);
    if (profile && (!isRecord(parsed) || parsed.version !== PROFILE_VERSION)) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
    return profile;
  } catch {
    clearProfile();
    return null;
  }
}

export function writeProfile(value: unknown): StudioProfile | null {
  if (typeof window === "undefined") return null;

  const profile = migrateProfile(value);
  if (!profile) return null;

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Le navigateur peut refuser le stockage privé ou saturé.
  }
}

export function readProfileName(fallback = DEFAULT_PROFILE_NAME): string {
  const profile = readProfile();
  return profile?.name || fallback;
}
