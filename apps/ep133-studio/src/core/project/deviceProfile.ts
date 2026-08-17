/**
 * Métadonnées techniques du clone et chronologie d'instantanés, persistées
 * seulement pour l'historique local de l'interface. L'identité et le dossier
 * de travail viennent du Hub ; aucune fiche machine autonome n'est conservée.
 */
export const DEVICE_CLONE_KEY = 'ep133-rhythm-hero:device-clone:v1';

/** Identité déclarée de la machine par l'utilisateur (nom, capacité mémoire), pas lue depuis le matériel. */
export interface DeviceProfile {
  name: string;
  capacityMb: 64 | 128;
  sampleFolderName: string;
  localSampleCount: number;
  updatedAt: string;
}

/** Un point de la chronologie — un SCAN (état des lieux léger) ou un CLONE (déclenché par le bouton, pont local ou repli disque). */
export interface CloneHistoryEntry {
  createdAt: string;
  label: string;
  kind: 'scan' | 'clone';
  soundCount: number;
  usedBytes: number;
  scannedProject: number | null;
}

/**
 * Manifeste + chronologie du clone : ce que l'app sait AVANT que le pont
 * local (`tools/local_clone_bridge.py` + `tools/clone_ep133_readonly.py`)
 * n'ait réellement copié les PCM sur le disque. `audioStatus` reste
 * `'local-bridge-required'` tant que ce clone complet n'a pas tourné — l'UI
 * ne doit jamais prétendre l'avoir fait avant ce retour confirmé.
 */
export interface DeviceCloneManifest {
  createdAt: string;
  profile: DeviceProfile;
  soundCount: number;
  usedBytes: number;
  scannedProject: number | null;
  audioStatus: 'metadata-only' | 'local-bridge-required';
  history: CloneHistoryEntry[];
}

const MAX_HISTORY_ENTRIES = 50;

/** Relit le manifeste (et sa chronologie) sauvegardé ; `null` si absent ou corrompu — jamais d'exception. */
export function loadDeviceClone(storage: Pick<Storage, 'getItem'>): DeviceCloneManifest | null {
  try {
    const value = JSON.parse(storage.getItem(DEVICE_CLONE_KEY) || 'null') as Partial<DeviceCloneManifest> | null;
    if (!value || typeof value !== 'object' || !Array.isArray(value.history) || !value.profile) return null;
    return value as DeviceCloneManifest;
  } catch { return null; }
}

/**
 * « Comparaison » de la Time Machine (ROADMAP.md) — décrit ce qui a changé
 * depuis le point précédent. Comparaison de métadonnées seulement (nombre de
 * sons, mémoire occupée, projet scanné) : le diff audio réel (sons ajoutés/
 * modifiés/supprimés) que le pont local calcule pendant un clone complet
 * n'est pour l'instant affiché que le temps du dialogue, pas encore
 * persisté ici — suite possible, pas faite aujourd'hui.
 *
 * `previous` peut venir d'un manifeste écrit AVANT ce correctif (12 août) —
 * `history` existait déjà mais ses entrées n'avaient alors que
 * `{ createdAt, label }`, sans `soundCount`/`usedBytes`. Chaque champ est
 * donc comparé seulement s'il est un nombre fini chez `previous`, sinon
 * silencieusement omis — jamais un fragment « NaN son » affiché au premier
 * instantané suivant la mise à jour.
 */
export function describeCloneDelta(previous: CloneHistoryEntry | null, next: { soundCount: number; usedBytes: number; scannedProject: number | null }): string {
  if (!previous) return 'Premier instantané';
  const parts: string[] = [];
  if (Number.isFinite(previous.soundCount)) {
    const soundDelta = next.soundCount - previous.soundCount;
    if (soundDelta !== 0) parts.push(`${soundDelta > 0 ? '+' : ''}${soundDelta} son${Math.abs(soundDelta) > 1 ? 's' : ''}`);
  }
  if (Number.isFinite(previous.usedBytes)) {
    const mbDelta = (next.usedBytes - previous.usedBytes) / 1e6;
    if (Math.abs(mbDelta) >= 0.01) parts.push(`${mbDelta > 0 ? '+' : ''}${mbDelta.toFixed(2)} Mo`);
  }
  if (next.scannedProject !== previous.scannedProject) parts.push(`projet ${previous.scannedProject ?? '—'} → ${next.scannedProject ?? '—'}`);
  return parts.length ? parts.join(' · ') : 'Aucun changement détecté';
}

/**
 * Ajoute un instantané à la chronologie existante plutôt que de l'écraser à
 * chaque appel — c'était le bug : le champ `history` existait déjà
 * (documenté « pour préparer la future Time Machine incrémentale ») mais
 * n'accumulait jamais rien, chaque appel repartait d'un tableau à une seule
 * entrée « INSTANTANÉ INITIAL ». Bornée à `MAX_HISTORY_ENTRIES` points les
 * plus récents.
 */
export function createDeviceClone(storage: Pick<Storage, 'getItem' | 'setItem'>, profile: DeviceProfile, soundCount: number, usedBytes: number, scannedProject: number | null, kind: 'scan' | 'clone' = 'scan'): DeviceCloneManifest {
  const createdAt = new Date().toISOString();
  const previousManifest = loadDeviceClone(storage);
  const previousEntry = previousManifest ? previousManifest.history[previousManifest.history.length - 1] || null : null;
  const label = previousManifest
    ? `${kind === 'clone' ? 'CLONE' : 'SCAN'} · ${describeCloneDelta(previousEntry, { soundCount, usedBytes, scannedProject })}`
    : 'INSTANTANÉ INITIAL';
  const entry: CloneHistoryEntry = { createdAt, label, kind, soundCount, usedBytes, scannedProject };
  const history = [...(previousManifest?.history || []), entry].slice(-MAX_HISTORY_ENTRIES);
  const clone: DeviceCloneManifest = { createdAt, profile, soundCount, usedBytes, scannedProject, audioStatus: 'local-bridge-required', history };
  storage.setItem(DEVICE_CLONE_KEY, JSON.stringify(clone));
  return clone;
}
