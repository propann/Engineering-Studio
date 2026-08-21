/**
 * Spécifications audio des machines.
 *
 * Regroupées ici pour que le rack sache viser une machine sans connaître les
 * détails de chacune. Elles vivaient dans les studios — `OP1_AUDIO_LIMITS` dans
 * `op1-studio/app/lib/audioOracle.ts`, les cibles EP-133 dans
 * `ep133-studio/src/core/audio/ep133Targets.ts` — donc hors de portée du rack,
 * qui fabrique pourtant le son.
 *
 * ## Aucune dépendance lourde ici, jamais
 *
 * Contrainte héritée de `ep133Targets.ts` et à conserver : ce module doit
 * rester importable statiquement. `wavConvert.ts` importe
 * `@alexanderolsen/libsamplerate-js` (~2 Mo de glue WASM) au niveau module, et
 * c'est précisément pour ne pas le tirer dans le bundle principal que les
 * cibles avaient été séparées. Y ajouter un import lourd annulerait ce
 * découpage sans que rien ne le signale, sinon la taille du bundle.
 */

// =====================================================================
// EP-133 K.O. II
// =====================================================================

/** Cibles EP-133 exposées par le firmware 2.5 (REGISTRE_IDEES.md R-03). */
export const EP133_TARGET_SAMPLE_RATES = { LO: 26250, MID: 32000, HI: 46875 } as const;
export type Ep133TargetRate = keyof typeof EP133_TARGET_SAMPLE_RATES;

/**
 * Poids exact du WAV PCM 16 bits que produirait `convertWavForEp133`, calculé
 * sans lancer le rééchantillonnage réel — 44 octets d'en-tête, plus
 * durée × fréquence cible × 2 octets × canaux.
 *
 * Le nombre de trames après rééchantillonnage vaut toujours
 * `round(durée × fréquence)`, quel que soit l'algorithme : c'est la durée qui
 * est préservée, pas le nombre de trames d'origine. Vérifié face à une vraie
 * conversion dans `tools/check-wav-convert.mjs`.
 */
export function estimateEp133ConversionBytes(
  durationSeconds: number,
  channels: 1 | 2,
  targetSampleRate: number
): number {
  const frameCount = Math.max(0, Math.round(durationSeconds * targetSampleRate));
  return 44 + frameCount * channels * 2;
}

export interface Ep133MemoryFit {
  fits: boolean;
  remainingBytes: number;
}

/**
 * Compare un poids estimé à l'espace restant sur la machine. Mo décimaux
 * (1 Mo = 1 000 000 octets), cohérent avec le reste du projet.
 *
 * Ne suppose jamais que l'espace est suffisant : une entrée non finie ou
 * négative retombe sur 0 plutôt que sur un calcul silencieusement faux — même
 * précaution que le bug « NaN son » déjà corrigé sur un calcul d'occupation
 * similaire (REGISTRE_IDEES.md Q-16).
 */
export function estimateEp133MemoryFit(
  estimatedBytes: number,
  usedBytes: number,
  capacityMb: number
): Ep133MemoryFit {
  const capacityBytes = Number.isFinite(capacityMb) && capacityMb > 0 ? capacityMb * 1e6 : 0;
  const safeUsedBytes = Number.isFinite(usedBytes) && usedBytes > 0 ? usedBytes : 0;
  const remainingBytes = Math.max(0, capacityBytes - safeUsedBytes);
  return { fits: estimatedBytes <= remainingBytes, remainingBytes };
}

// =====================================================================
// OP-1
// =====================================================================

/** Source : docs/OP1_KNOWLEDGE_BASE.md — 6 s synthé, 12 s drum. */
export const OP1_AUDIO_LIMITS = {
  synthMaxSeconds: 6,
  drumMaxSeconds: 12,
} as const;

export type Op1SampleKind = "synth" | "drum";

export function op1MaxSeconds(kind: Op1SampleKind): number {
  return kind === "synth" ? OP1_AUDIO_LIMITS.synthMaxSeconds : OP1_AUDIO_LIMITS.drumMaxSeconds;
}

// =====================================================================
// Capacité de stockage
// =====================================================================

/**
 * Capacité du support de chaque machine, en octets décimaux.
 *
 * **Ce sont des constantes, pas des mesures.** Le navigateur ne peut pas lire
 * la taille d'un volume : la File System Access API n'expose ni capacité ni
 * espace libre. `navigator.storage.estimate()` renseigne le quota de l'origine,
 * pas le disque.
 *
 * L'OP-1 présente un volume de 384 Mo — relevé sur le matériel le 2026-08-21
 * (`lsblk` : `sda 384M vfat`). L'EP-133 existe en 64 et 128 Mo selon le modèle,
 * d'où une valeur prise dans la fiche de la machine plutôt qu'ici.
 */
export const CAPACITE_OP1_OCTETS = 384 * 1e6;
export const CAPACITE_EP133_OCTETS = { 64: 64 * 1e6, 128: 128 * 1e6 } as const;

export interface Remplissage {
  utilises: number;
  capacite: number;
  /** 0 à 100, borné — un support plus rempli que sa capacité annoncée existe. */
  pourcentage: number;
  /** Au-delà de 90 % : il devient difficile d'ajouter quoi que ce soit. */
  critique: boolean;
}

/**
 * Taux de remplissage d'un support.
 *
 * Borne à 100 % plutôt que de laisser filer : une capacité sous-estimée — un
 * modèle d'EP-133 mal renseigné dans la fiche, par exemple — produirait sinon
 * une jauge à 140 %, qui ne veut rien dire à l'écran.
 */
export function calculerRemplissage(utilises: number, capacite: number): Remplissage {
  const sain = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const u = sain(utilises);
  const c = sain(capacite);
  const pourcentage = c ? Math.min(100, Math.round((u / c) * 100)) : 0;
  return { utilises: u, capacite: c, pourcentage, critique: pourcentage >= 90 };
}

// =====================================================================
// Description unifiée, pour qui fabrique un sample
// =====================================================================

export type CibleMachine = "op1_synth" | "op1_drum" | "ep133_lo" | "ep133_mid" | "ep133_hi";

export interface SpecCible {
  /** Nom lisible, pour l'interface. */
  libelle: string;
  /** Format du fichier attendu par la machine. */
  format: "aiff" | "wav";
  frequence: number;
  canaux: 1 | 2;
  /** Durée maximale acceptée, en secondes. */
  dureeMaxSecondes: number;
  /** Sous-dossier d'usage sur le support de la machine, quand il y en a un. */
  dossier?: string;
}

/**
 * L'OP-1 attend de l'AIFF — c'est le format réel de ses patches, pas le WAV.
 * L'EP-133 n'a pas de mode disque : ses sons passent par SysEx, d'où l'absence
 * de dossier. Le format WAV y reste le pivot de conversion.
 */
export const SPECS_CIBLES: Record<CibleMachine, SpecCible> = {
  op1_synth: {
    libelle: "OP-1 · synthé",
    format: "aiff",
    frequence: 44100,
    canaux: 1,
    dureeMaxSecondes: OP1_AUDIO_LIMITS.synthMaxSeconds,
    dossier: "synth/user",
  },
  op1_drum: {
    libelle: "OP-1 · drum",
    format: "aiff",
    frequence: 44100,
    canaux: 1,
    dureeMaxSecondes: OP1_AUDIO_LIMITS.drumMaxSeconds,
    dossier: "drum/user",
  },
  ep133_lo: {
    libelle: "EP-133 · LO (26,25 kHz)",
    format: "wav",
    frequence: EP133_TARGET_SAMPLE_RATES.LO,
    canaux: 1,
    dureeMaxSecondes: 60,
  },
  ep133_mid: {
    libelle: "EP-133 · MID (32 kHz)",
    format: "wav",
    frequence: EP133_TARGET_SAMPLE_RATES.MID,
    canaux: 1,
    dureeMaxSecondes: 60,
  },
  ep133_hi: {
    libelle: "EP-133 · HI (46,875 kHz)",
    format: "wav",
    frequence: EP133_TARGET_SAMPLE_RATES.HI,
    canaux: 1,
    dureeMaxSecondes: 60,
  },
};

/**
 * Ramène une durée demandée à ce que la cible accepte.
 *
 * Tronquer vaut mieux que refuser : l'utilisateur obtient un fichier utilisable
 * plutôt qu'un message. Mais jamais en silence — l'appelant compare la valeur
 * rendue à celle demandée pour le signaler.
 */
export function dureeAdmise(cible: CibleMachine, secondes: number): number {
  const max = SPECS_CIBLES[cible].dureeMaxSecondes;
  if (!Number.isFinite(secondes) || secondes <= 0) return 0;
  return Math.min(secondes, max);
}
