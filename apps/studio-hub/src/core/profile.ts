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

// =====================================================================
// FICHE ÉCRITE DANS LE DOSSIER DE TRAVAIL
//
// La fiche est enregistrée à deux endroits : le localStorage du navigateur,
// et un fichier `profile_<NOM>.json` dans le dossier choisi. La seconde copie
// était écrite mais JAMAIS relue.
//
// Conséquence pour l'utilisateur : vider les données du navigateur effaçait la
// fiche, et re-choisir le dossier retrouvait bien le fichier sans jamais
// l'ouvrir — il fallait tout ressaisir, alors que la sauvegarde était là.
// =====================================================================

/** Nom du fichier écrit dans le dossier pour une fiche donnée. */
export function nomFichierProfil(nom: string): string {
  return `profile_${nom.trim().replace(/\s+/g, "_").toUpperCase()}.json`;
}

/** Reconnaît un fichier de fiche, quelle que soit la casse de l'extension. */
export function estFichierProfil(nom: string): boolean {
  return /^profile_.+\.json$/i.test(nom);
}

/**
 * Fiches présentes dans un dossier, à partir de la liste de ses noms de
 * fichiers. Rendue triée pour que l'ordre d'affichage soit stable.
 */
export function profilsDuDossier(noms: string[]): string[] {
  return noms.filter(estFichierProfil).sort((a, b) => a.localeCompare(b));
}

/**
 * Lit une fiche depuis le contenu d'un fichier.
 *
 * Ne touche JAMAIS au localStorage, contrairement à `readProfile` qui efface
 * la fiche locale quand elle est illisible. Ici ce serait un désastre : un
 * fichier corrompu dans le dossier détruirait la fiche du navigateur, c'est-à-
 * dire la seule copie encore valable.
 */
export function lireProfilDepuisTexte(texte: string): StudioProfile | null {
  try {
    return migrateProfile(JSON.parse(texte));
  } catch {
    return null;
  }
}

/**
 * Désigne la fiche à proposer parmi plusieurs, la plus récemment enregistrée.
 *
 * `savedAt` est posé à l'enregistrement. Les fiches qui n'en ont pas — écrites
 * par une version antérieure — passent en dernier plutôt que d'être écartées.
 */
export function profilLePlusRecent(
  fiches: { fichier: string; profil: StudioProfile }[]
): { fichier: string; profil: StudioProfile } | null {
  if (!fiches.length) return null;

  const horodatage = (p: StudioProfile): number => {
    const brut = p.savedAt;
    if (typeof brut !== "string") return -Infinity;
    const t = Date.parse(brut);
    return Number.isNaN(t) ? -Infinity : t;
  };

  return [...fiches].sort((a, b) => {
    const d = horodatage(b.profil) - horodatage(a.profil);
    // Départage par le nom de fichier : sans cela, deux fiches de même
    // horodatage se classeraient au hasard de l'ordre de lecture du dossier.
    return d !== 0 ? d : a.fichier.localeCompare(b.fichier);
  })[0];
}


// =====================================================================
// MACHINES DÉCLARÉES DANS LA FICHE
// =====================================================================

export type MachineDeclaree = "op1" | "ep133";

/**
 * Machines que l'utilisateur a réellement déclarées.
 *
 * Le coffre affichait les deux colonnes quoi qu'il arrive. Quelqu'un qui ne
 * possède qu'une EP-133 voyait donc une colonne OP-1 vide, avec ses boutons
 * actifs — une invitation à sauvegarder une machine qu'il n'a pas.
 *
 * Deux sources dans la fiche, et il faut les deux :
 *  - `machineInventory` : la liste détaillée, avec modèle et mémoire.
 *  - `machines` : le résumé, avec un drapeau `enabled` par machine.
 *
 * Une fiche ancienne peut ne porter que l'un des deux. N'en lire qu'un ferait
 * disparaître une machine réellement déclarée — pire défaut que d'en afficher
 * une de trop.
 */
export function machinesDeclarees(profile: StudioProfile | null): MachineDeclaree[] {
  if (!profile) return [];
  const vues = new Set<MachineDeclaree>();

  const inventaire = profile.machineInventory;
  if (Array.isArray(inventaire)) {
    for (const item of inventaire) {
      if (!isRecord(item)) continue;
      // `active: false` reste une machine possédée, simplement débranchée : on
      // l'affiche. C'est `enabled` du résumé qui traduit un choix explicite.
      if (item.kind === "op1" || item.kind === "ep133") vues.add(item.kind);
    }
  }

  const resume = profile.machines;
  if (isRecord(resume)) {
    for (const kind of ["op1", "ep133"] as MachineDeclaree[]) {
      const entree = resume[kind];
      if (isRecord(entree) && entree.enabled === true) vues.add(kind);
    }
  }

  // Ordre stable : l'OP-1 d'abord, comme dans l'interface.
  return (["op1", "ep133"] as MachineDeclaree[]).filter((m) => vues.has(m));
}
