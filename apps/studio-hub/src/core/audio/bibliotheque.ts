/**
 * Inventaire sonore partagé par la Bibliothèque sonore et Strudel.
 *
 * Une source unique est importante ici : les sauvegardes machine ne sont pas
 * des « exemples » et les exemples ne sont pas des fichiers. Ce module lit
 * les manifestes déjà écrits par les outils de sauvegarde, résout les fichiers
 * sur le dossier choisi par l'utilisateur et prépare les samples locaux pour
 * le sampler Strudel sans copier ni supprimer quoi que ce soit.
 */

export type SoundSourceType = "all" | "labo" | "p2p" | "personal" | "machines";
export type SoundTarget = "op1" | "ep133";
export type SoundKind = "sample" | "drum" | "synth" | "voice" | "loop" | "bass" | "fx" | "other" | "atelier";

export interface SoundLibraryAsset {
  id: string;
  name: string;
  sourceType: Exclude<SoundSourceType, "all">;
  path: string;
  size: number;
  sha256: string;
  kind: SoundKind;
  tags: string[];
  favorite: boolean;
  targets: SoundTarget[];
  addedAt: string;
  engineOrigin?: string;
  machineSlot?: string;
  author?: string;
  synthPresetParams?: Record<string, number | string>;
  durationSeconds?: number;
  /** `sounds` = shared/sounds, `workspace` = racine du dossier choisi. */
  storageRoot?: "sounds" | "workspace";
  /** Les fichiers de sauvegarde machine sont consultables, pas supprimables. */
  readOnly?: boolean;
}

type Directory = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
};

type MachineId = "op1" | "ep133";
type BackupEntry = { path?: string; file?: string; size?: number; bytes?: number; sha256?: string; category?: string };
type BackupManifest = {
  createdAt?: string;
  sourceLabel?: string;
  files?: BackupEntry[];
  projects?: BackupEntry[];
  sounds?: BackupEntry[];
};

export type SampleLibraryResult = {
  assets: SoundLibraryAsset[];
  /** Clés directement utilisables dans `s("...")`. */
  sampleMap: Record<string, string>;
  loaded: Array<{ key: string; asset: SoundLibraryAsset }>;
  release: () => void;
};

const AUDIO_EXTENSIONS = /\.(aif|aiff|wav|mp3|flac|ogg|m4a|aac|opus|pcm)$/i;
const MACHINE_AUDIO_EXTENSIONS = /\.(aif|aiff|wav|mp3|flac|ogg|m4a|aac|opus|pcm)$/i;
const SHARED_SOUND_FOLDERS = ["originals", "prepared", "packs", "quarantine"] as const;

const tryDirectory = async (root: Directory, path: string): Promise<Directory | null> => {
  let current = root;
  for (const part of path.split("/").filter(Boolean)) {
    try {
      current = await current.getDirectoryHandle(part) as Directory;
    } catch {
      return null;
    }
  }
  return current;
};

const tryFile = async (root: Directory, path: string): Promise<File | null> => {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop();
  if (!name) return null;
  const directory = await tryDirectory(root, parts.join("/"));
  if (!directory) return null;
  try {
    return await (await directory.getFileHandle(name)).getFile();
  } catch {
    return null;
  }
};

const safeSlug = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .slice(0, 34) || "son";

/** Clé stable et lisible pour le code Strudel. */
export function cleSample(asset: Pick<SoundLibraryAsset, "name" | "sourceType" | "id">): string {
  const source = asset.sourceType === "machines" ? "machine" : asset.sourceType === "personal" ? "client" : "studio";
  return `${source}_${safeSlug(asset.name)}_${safeSlug(asset.id).slice(-6)}`;
}

export function inferSoundKind(name: string): SoundKind {
  const lower = name.toLowerCase();
  if (/kick|snare|hat|clap|perc|drum|tom|cymbal/.test(lower)) return "drum";
  if (/bass|808|sub|reese|wobble/.test(lower)) return "bass";
  if (/voice|vocal|speech|vox|hook/.test(lower)) return "voice";
  if (/loop|break|beat|riff|tape|album/.test(lower)) return "loop";
  if (/synth|lead|pad|chord|keys|bell|organ|patch/.test(lower)) return "synth";
  if (/fx|riser|sweep|impact|noise/.test(lower)) return "fx";
  return "sample";
}

function manifestEntries(manifest: BackupManifest): BackupEntry[] {
  if (Array.isArray(manifest.files)) return manifest.files;
  return [...(manifest.projects ?? []), ...(manifest.sounds ?? [])];
}

function entryPath(entry: BackupEntry): string {
  return String(entry.path ?? entry.file ?? "").replace(/^\/+/, "");
}

function assetFromMachine(
  machine: MachineId,
  snapshotPath: string,
  createdAt: string,
  entry: BackupEntry,
): SoundLibraryAsset | null {
  const relative = entryPath(entry);
  if (!relative || !MACHINE_AUDIO_EXTENSIONS.test(relative)) return null;
  const basename = relative.split("/").pop() ?? relative;
  const slot = /(?:samples|slots?)\/(\d{3})\.(?:pcm|json)$/i.exec(relative)?.[1];
  const kind = inferSoundKind(`${relative} ${machine}`);
  const id = `machine_${machine}_${snapshotPath}_${relative}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    id,
    name: `${machine.toUpperCase()} · ${slot ? `Slot ${slot}` : basename.replace(/\.[^.]+$/, "")}`,
    sourceType: "machines",
    path: `${snapshotPath}/${relative}`,
    size: Number(entry.size ?? entry.bytes ?? 0),
    sha256: entry.sha256 ?? id,
    kind,
    tags: [machine.toUpperCase(), "sauvegarde", kind],
    favorite: false,
    targets: [machine],
    addedAt: createdAt || new Date(0).toISOString(),
    machineSlot: slot ? `${machine.toUpperCase()} · ${slot}` : relative,
    storageRoot: "workspace",
    readOnly: true,
  };
}

async function machineSnapshotDirectories(root: Directory, machine: MachineId): Promise<Array<{ path: string; directory: Directory }>> {
  const backups = await tryDirectory(root, `${machine}/backups`);
  if (!backups) return [];
  const result: Array<{ path: string; directory: Directory }> = [];
  for await (const [name, entry] of backups.entries()) {
    if (entry.kind !== "directory") continue;
    const directory = entry as Directory;
    if (machine === "ep133" && name === "clone") {
      for await (const [cloneName, cloneEntry] of directory.entries()) {
        if (cloneEntry.kind === "directory") result.push({ path: `${machine}/backups/clone/${cloneName}`, directory: cloneEntry as Directory });
      }
    } else {
      result.push({ path: `${machine}/backups/${name}`, directory });
    }
  }
  return result;
}

async function scanMachineBackups(root: Directory, machine: MachineId): Promise<SoundLibraryAsset[]> {
  const snapshots = await machineSnapshotDirectories(root, machine);
  // Le dernier snapshot gagne pour un même chemin : cela évite d'afficher 527
  // doublons à chaque sauvegarde tout en gardant le son le plus récent.
  const latest = new Map<string, { asset: SoundLibraryAsset; timestamp: number }>();
  for (const snapshot of snapshots) {
    let manifest: BackupManifest;
    try {
      const manifestFile = await snapshot.directory.getFileHandle("manifest.json");
      manifest = JSON.parse(await (await manifestFile.getFile()).text()) as BackupManifest;
    } catch {
      continue;
    }
    const filesRoot = await tryDirectory(snapshot.directory, "files");
    const rootPath = filesRoot ? `${snapshot.path}/files` : snapshot.path;
    for (const entry of manifestEntries(manifest)) {
      const asset = assetFromMachine(machine, rootPath, manifest.createdAt ?? "", entry);
      if (asset) {
        const key = `${machine}:${entryPath(entry)}`;
        const timestamp = Date.parse(manifest.createdAt ?? "") || 0;
        const previous = latest.get(key);
        if (!previous || timestamp >= previous.timestamp) latest.set(key, { asset, timestamp });
      }
    }
  }
  return [...latest.values()].map(({ asset }) => asset);
}

async function scanMachineBanks(root: Directory, machine: MachineId): Promise<SoundLibraryAsset[]> {
  const directory = await tryDirectory(root, `${machine}/samples`);
  if (!directory) return [];
  const assets: SoundLibraryAsset[] = [];
  const visit = async (current: Directory, prefix: string) => {
    for await (const [name, entry] of current.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (entry.kind === "directory") await visit(entry as Directory, path);
      else if (MACHINE_AUDIO_EXTENSIONS.test(name)) {
        const id = `bank_${machine}_${path}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        assets.push({
          id,
          name: `${machine.toUpperCase()} · ${name.replace(/\.[^.]+$/, "")}`,
          sourceType: "machines",
          path: `${machine}/samples/${path}`,
          size: (await (entry as FileSystemFileHandle).getFile()).size,
          sha256: id,
          kind: inferSoundKind(path),
          tags: [machine.toUpperCase(), "banque locale"],
          favorite: false,
          targets: [machine],
          addedAt: new Date(0).toISOString(),
          machineSlot: path,
          storageRoot: "workspace",
          readOnly: true,
        });
      }
    }
  };
  await visit(directory, "");
  return assets;
}

async function scanSharedFiles(sounds: Directory): Promise<SoundLibraryAsset[]> {
  const assets: SoundLibraryAsset[] = [];
  const visit = async (current: Directory, prefix: string) => {
    for await (const [name, entry] of current.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (entry.kind === "directory") {
        await visit(entry as Directory, path);
        continue;
      }
      if (!AUDIO_EXTENSIONS.test(name)) continue;
      const id = `shared_file_${path}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const file = await (entry as FileSystemFileHandle).getFile();
      assets.push({
        id,
        name: name.replace(/\.[^.]+$/, ""),
        sourceType: "personal",
        path,
        size: file.size,
        sha256: id,
        kind: inferSoundKind(path),
        tags: ["fichier présent", path.split("/")[0]],
        favorite: false,
        targets: ["op1", "ep133"],
        addedAt: new Date(file.lastModified || 0).toISOString(),
        storageRoot: "sounds",
        readOnly: false,
      });
    }
  };
  for (const folder of SHARED_SOUND_FOLDERS) {
    const directory = await tryDirectory(sounds, folder);
    if (directory) await visit(directory, folder);
  }
  return assets;
}

async function readSharedAssets(root: Directory): Promise<SoundLibraryAsset[]> {
  const sounds = await tryDirectory(root, "shared/sounds");
  if (!sounds) return [];
  let manifestAssets: SoundLibraryAsset[] = [];
  try {
    const file = await sounds.getFileHandle("manifest.json");
    const parsed = JSON.parse(await (await file.getFile()).text()) as { assets?: SoundLibraryAsset[] };
    manifestAssets = Array.isArray(parsed.assets)
      ? parsed.assets
        .filter((asset): asset is SoundLibraryAsset => Boolean(asset && typeof asset.id === "string" && typeof asset.path === "string"))
        .map((asset) => ({ ...asset, storageRoot: asset.storageRoot ?? "sounds", readOnly: false }))
      : [];
  } catch { /* Un ancien workspace peut ne pas encore avoir de manifeste. */ }
  const indexedPaths = new Set(manifestAssets.map((asset) => asset.path));
  const discovered = (await scanSharedFiles(sounds)).filter((asset) => !indexedPaths.has(asset.path));
  return [...manifestAssets, ...discovered];
}

/** Tous les sons décrits par le workspace : bibliothèque, clones et banques. */
export async function indexerBibliotheque(root: FileSystemDirectoryHandle): Promise<SoundLibraryAsset[]> {
  const workspace = root as Directory;
  const [shared, op1, ep133, op1Bank, ep133Bank] = await Promise.all([
    readSharedAssets(workspace),
    scanMachineBackups(workspace, "op1"),
    scanMachineBackups(workspace, "ep133"),
    scanMachineBanks(workspace, "op1"),
    scanMachineBanks(workspace, "ep133"),
  ]);
  const unique = new Map<string, SoundLibraryAsset>();
  for (const asset of [...shared, ...op1, ...ep133, ...op1Bank, ...ep133Bank]) unique.set(asset.id, asset);
  return [...unique.values()];
}

async function fileForAsset(root: Directory, asset: SoundLibraryAsset): Promise<File | null> {
  if (asset.storageRoot === "workspace") return tryFile(root, asset.path);
  return tryFile(root, `shared/sounds/${asset.path}`);
}

async function metadataForPcm(root: Directory, asset: SoundLibraryAsset): Promise<{ sampleRate: number; channels: number }> {
  const match = asset.path.match(/^(.*\/)(?:samples|sample)\/(\d{3})\.pcm$/i);
  if (!match) return { sampleRate: 46875, channels: 1 };
  const metadata = await tryFile(root, `${match[1]}metadata/${match[2]}.json`);
  if (!metadata) return { sampleRate: 46875, channels: 1 };
  try {
    const parsed = JSON.parse(await metadata.text()) as { samplerate?: unknown; sampleRate?: unknown; channels?: unknown };
    const sampleRate = Number(parsed.samplerate ?? parsed.sampleRate);
    const channels = Number(parsed.channels);
    return {
      sampleRate: Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 46875,
      channels: channels === 2 ? 2 : 1,
    };
  } catch {
    return { sampleRate: 46875, channels: 1 };
  }
}

async function pcmToWav(bytes: ArrayBuffer, sampleRate = 46875, channels = 1): Promise<Blob> {
  const usable = bytes.byteLength - (bytes.byteLength % (2 * channels));
  const data = new Uint8Array(bytes.slice(0, usable));
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, value: string) => Array.from(value).forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + data.byteLength, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, data.byteLength, true);
  return new Blob([header, data], { type: "audio/wav" });
}

/** Résout un son réel pour la pré-écoute et pour les autres moteurs audio. */
export async function audioBlobBibliotheque(
  root: FileSystemDirectoryHandle,
  asset: SoundLibraryAsset,
): Promise<Blob | null> {
  const workspace = root as Directory;
  const file = await fileForAsset(workspace, asset);
  if (!file) return null;
  if (!/\.pcm$/i.test(asset.path)) return file;
  const metadata = await metadataForPcm(workspace, asset);
  return pcmToWav(await file.arrayBuffer(), metadata.sampleRate, metadata.channels);
}

/** Prépare les fichiers locaux pour `samples(sampleMap)` de Strudel. */
export async function chargerSamplesBibliotheque(root: FileSystemDirectoryHandle): Promise<SampleLibraryResult> {
  const assets = await indexerBibliotheque(root);
  const sampleMap: Record<string, string> = {};
  const loaded: Array<{ key: string; asset: SoundLibraryAsset }> = [];
  const urls: string[] = [];
  for (const asset of assets) {
    if (!AUDIO_EXTENSIONS.test(asset.path)) continue;
    const source = await audioBlobBibliotheque(root, asset);
    if (!source) continue;
    const key = cleSample(asset);
    const url = URL.createObjectURL(source);
    sampleMap[key] = url;
    urls.push(url);
    loaded.push({ key, asset });
  }
  return {
    assets,
    sampleMap,
    loaded,
    release: () => urls.forEach((url) => URL.revokeObjectURL(url)),
  };
}
