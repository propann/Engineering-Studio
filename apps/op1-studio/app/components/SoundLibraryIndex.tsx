"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeWavBuffer, computeWaveformPeaks } from "../lib/audioOracle";
import {
  parseAiffFormat, computeAiffWaveformPeaks, readOp1PatchJson, isDrumPatch, drumMarkersInSeconds,
  type DrumMarker, type Op1PatchData,
} from "../lib/aiffPatchOracle";
import { WaveformMarkers } from "./WaveformMarkers";

// 5 catégories réelles de la machine (docs/OP1_KNOWLEDGE_BASE.md — album/,
// drum/, synth/, tape/, snapshot/), pas seulement synth/drum.
type SoundKind = "synth" | "drum" | "tape" | "album" | "snapshot";
const KIND_LABEL: Record<SoundKind, string> = { synth: "Synth", drum: "Drum", tape: "Tape", album: "Album", snapshot: "Snapshot" };
const MAX_SECONDS: Partial<Record<SoundKind, number>> = { synth: 6, drum: 12 };

// D'où vient le fichier : déjà sur la machine (sauvegarde relue) ou importé
// depuis l'ordinateur — deux colonnes séparées plutôt qu'une case perdue
// dans un menu déroulant.
type SoundOrigin = "MACHINE" | "ORDINATEUR";
type SoundAsset = {
  id: string; name: string; kind: SoundKind; origin: SoundOrigin; duration: number | null;
  trimStart?: number; trimEnd?: number; status: "OK" | "A VERIFIER" | "TROP LONG"; favorite: boolean;
  peaks?: number[]; url?: string;
  shared?: boolean;
  /** Patch OP-1 lu depuis le chunk APPL/op-1 (AIFF seulement) — voir app/lib/aiffPatchOracle.ts. */
  patch?: Op1PatchData | null;
  markers?: DrumMarker[] | null;
  file?: File;
};

function effectiveDuration(asset: SoundAsset): number | null {
  if (asset.duration === null) return null;
  return Math.max(0, (asset.trimEnd ?? asset.duration) - (asset.trimStart ?? 0));
}

function statusFor(kind: SoundKind, duration: number | null): SoundAsset["status"] {
  if (duration === null) return "A VERIFIER";
  const limit = MAX_SECONDS[kind];
  return limit !== undefined && duration > limit ? "TROP LONG" : "OK";
}

const initialAssets: SoundAsset[] = [
  { id: "kick", name: "Kick analog 01", kind: "drum", origin: "ORDINATEUR", duration: 0.8, status: "OK", favorite: true },
  { id: "snare", name: "Snare room 02", kind: "drum", origin: "ORDINATEUR", duration: 1.4, status: "OK", favorite: false },
  { id: "iter", name: "Iter factory A", kind: "synth", origin: "MACHINE", duration: 4.2, status: "OK", favorite: true },
  { id: "speech", name: "Speech texture", kind: "synth", origin: "MACHINE", duration: 7.1, status: "TROP LONG", favorite: false },
  { id: "track1", name: "track_1.aif", kind: "tape", origin: "MACHINE", duration: 96, status: "OK", favorite: false },
  { id: "sidea", name: "side_a.aif", kind: "album", origin: "MACHINE", duration: 210, status: "OK", favorite: false },
  { id: "snap1", name: "Snapshot presets", kind: "snapshot", origin: "MACHINE", duration: null, status: "A VERIFIER", favorite: false },
];

/**
 * Analyse déterministe (feuille de route M3.1) : AIFF d'abord (format réel
 * des patches/pistes OP-1, avec marqueurs de patch si présents), repli WAV,
 * puis repli `AudioContext.decodeAudioData` pour tout le reste (MP3, FLAC…)
 * — ce dernier reste approximatif (voir `docs/AUDIO_FILE_FORMAT_REFERENCE.md`
 * sur les limites de `decodeAudioData`), mais aucun format importable n'est
 * laissé sans aperçu.
 */
async function inspectFile(file: File): Promise<{ duration: number; peaks: number[]; patch?: Op1PatchData | null; markers?: DrumMarker[] | null }> {
  const bytes = await file.arrayBuffer();

  const aiff = parseAiffFormat(bytes);
  if (aiff) {
    const waveform = computeAiffWaveformPeaks(bytes, 48);
    const duration = aiff.frameCount / aiff.sampleRate;
    const patch = readOp1PatchJson(bytes);
    const markers = patch && isDrumPatch(patch) ? drumMarkersInSeconds(patch, duration) : null;
    return { duration, peaks: waveform ? Array.from(waveform.values) : [], patch, markers };
  }

  const wav = analyzeWavBuffer(bytes) as any;
  if (wav) {
    const waveform = computeWaveformPeaks(bytes, 48);
    return { duration: wav.durationSeconds || (wav.durationMs ? wav.durationMs / 1000 : 0), peaks: (waveform as any)?.values ? Array.from((waveform as any).values) : [] };
  }

  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const data = buffer.getChannelData(0);
    const bins = 48;
    const size = Math.max(1, Math.floor(data.length / bins));
    const peaks = Array.from({ length: bins }, (_, bin) => {
      let peak = 0;
      const start = bin * size;
      const end = Math.min(data.length, (bin + 1) * size);
      for (let index = start; index < end; index += 1) peak = Math.max(peak, Math.abs(data[index]));
      return peak;
    });
    return { duration: buffer.duration, peaks };
  } finally {
    await context.close();
  }
}

// Tri de la bibliothèque (feuille de route M3 : « tri avancé » restait
// ouvert). Un statut à corriger passe avant un statut déjà bon, pour que le
// tri par statut serve à repérer les fichiers à traiter en premier.
type SortKey = "name" | "duration" | "status";
const SORT_LABEL: Record<SortKey, string> = { name: "Nom", duration: "Durée", status: "Statut" };
const STATUS_PRIORITY: Record<SoundAsset["status"], number> = { "TROP LONG": 0, "A VERIFIER": 1, OK: 2 };

type LibraryDirectory = FileSystemDirectoryHandle & { entries(): AsyncIterableIterator<[string, FileSystemHandle]> };

async function collectSharedAudio(directory: LibraryDirectory, prefix = ""): Promise<{ name: string; path: string; file: File }[]> {
  const result: { name: string; path: string; file: File }[] = [];
  for await (const [name, entry] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === "file" && /\.(aif|aiff|wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(name)) result.push({ name, path, file: await (entry as FileSystemFileHandle).getFile() });
    if (entry.kind === "directory") result.push(...await collectSharedAudio(entry as LibraryDirectory, path));
  }
  return result;
}

export function SoundLibraryIndex({ libraryHandle, onUseSample }: { libraryHandle?: FileSystemDirectoryHandle | null; onUseSample?: (sample: { name: string; file: File; duration: number | null }) => void }) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | SoundKind>("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [sharedStatus, setSharedStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    if (!libraryHandle) {
      return () => { cancelled = true; };
    }
    void (async () => {
      try {
        const files = await collectSharedAudio(libraryHandle as LibraryDirectory);
        const sharedAssets: SoundAsset[] = [];
        for (const item of files) {
          const url = URL.createObjectURL(item.file);
          objectUrlsRef.current.add(url);
          const inspected = await inspectFile(item.file).catch(() => ({ duration: 0, peaks: [], patch: null, markers: null }));
          sharedAssets.push({ id: `hub-${item.path}`, name: item.name, kind: "synth", origin: "ORDINATEUR", duration: inspected.duration || null, status: statusFor("synth", inspected.duration || null), favorite: false, peaks: inspected.peaks, patch: inspected.patch, markers: inspected.markers, url, file: item.file, shared: true });
        }
        if (!cancelled) { setAssets([...sharedAssets, ...initialAssets]); setSharedStatus(`${sharedAssets.length} fichier${sharedAssets.length > 1 ? "s" : ""} du workspace Hub`); }
      } catch {
        if (!cancelled) { setAssets(initialAssets); setSharedStatus("Workspace Hub reçu, lecture à autoriser"); }
      }
    })();
    return () => { cancelled = true; };
  }, [libraryHandle]);

  const visible = useMemo(() => {
    const filtered = assets.filter((asset) =>
      (kind === "all" || asset.kind === kind)
      && asset.name.toLowerCase().includes(query.toLowerCase())
      && (!favoritesOnly || asset.favorite));
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "duration") return (effectiveDuration(a) ?? -1) - (effectiveDuration(b) ?? -1);
      return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    });
  }, [assets, kind, query, favoritesOnly, sortBy]);
  const machine = useMemo(() => visible.filter((asset) => asset.origin === "MACHINE"), [visible]);
  const ordinateur = useMemo(() => visible.filter((asset) => asset.origin === "ORDINATEUR"), [visible]);

  function importFiles(files: FileList | null) {
    if (!files) return;
    const imported = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      return { id: `${file.name}-${file.lastModified}`, name: file.name, kind: "synth" as const, origin: "ORDINATEUR" as const, duration: null, status: "A VERIFIER" as const, favorite: false, url, file };
    });
    setAssets((current) => [...imported, ...current]);
    imported.forEach((asset, index) => {
      const file = files.item(index);
      if (!file) return;
      void inspectFile(file).then(({ duration, peaks, patch, markers }) => {
        setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, duration, trimStart: 0, trimEnd: duration, status: statusFor(item.kind, duration), peaks, patch, markers } : item));
      }).catch(() => undefined);
    });
  }

  function preview(asset: SoundAsset) {
    if (!asset.url) return;
    audioRef.current?.pause();
    const audio = new Audio(asset.url);
    audioRef.current = audio;
    void audio.play().catch(() => undefined);
  }

  function changeKind(id: string, nextKind: SoundKind) {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, kind: nextKind, status: statusFor(nextKind, effectiveDuration(asset)) } : asset));
  }

  function toggleFavorite(id: string) {
    setAssets((current) => current.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item));
  }

  useEffect(() => () => {
    audioRef.current?.pause();
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  function column(title: string, items: SoundAsset[]) {
    return (
      <div className="sound-library-column">
        <div className="sound-library-column-head"><strong>{title}</strong><small>{items.length} fichier{items.length > 1 ? "s" : ""}</small></div>
        {items.length === 0 && <p className="tool-note">Rien ici pour ce filtre.</p>}
        {items.map((asset) => {
          const duration = effectiveDuration(asset);
          return (
            <div className="sound-library-card" key={asset.id}>
              <div className="sound-library-name-line">
                <button type="button" className="sound-preview" disabled={!asset.url} aria-label={`Écouter ${asset.name}`} onClick={() => preview(asset)}>▶</button>
                {asset.file && onUseSample && <button type="button" className="sound-use-sample" onClick={() => onUseSample({ name: asset.name, file: asset.file as File, duration: asset.duration })}>UTILISER</button>}
                <strong>{asset.name}</strong>
                {asset.patch && <small className="sound-patch-badge">{asset.patch.type}</small>}
                <button type="button" className={`sound-favorite ${asset.favorite ? "is-active" : ""}`} aria-label={`${asset.favorite ? "Retirer" : "Ajouter"} ${asset.name} des favoris`} onClick={() => toggleFavorite(asset.id)}>★</button>
              </div>
              {asset.peaks && asset.peaks.length > 0 && asset.duration ? (
                <WaveformMarkers peaks={new Float32Array(asset.peaks)} durationSeconds={asset.duration} markers={asset.markers ?? undefined} />
              ) : (
                <div className="sound-row-waveform" aria-label={`Forme d’onde de ${asset.name}`}>
                  {Array.from({ length: 32 }, () => 0).map((peak, index) => <i key={`${asset.id}-${index}`} style={{ height: `${Math.max(4, peak * 100)}%` }} />)}
                </div>
              )}
              <div className="sound-library-card-foot">
                <label className="sound-kind-select"><span className="visually-hidden">Catégorie de {asset.name}</span>
                  <select value={asset.kind} onChange={(event) => changeKind(asset.id, event.target.value as SoundKind)}>
                    {(Object.keys(KIND_LABEL) as SoundKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                  </select>
                </label>
                <span>{duration === null ? "--" : `${duration.toFixed(1)} s`}</span>
                <span className={`sound-preflight sound-preflight-${asset.status === "OK" ? "ok" : asset.status === "TROP LONG" ? "long" : "check"}`}>{asset.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <section className="sound-library-index" aria-labelledby="sound-library-index-title">
    <div className="mod-section-heading"><div><span className="section-label">INDEX LOCAL</span><strong id="sound-library-index-title">Bibliothèque et préflight</strong>{sharedStatus && <small className="hub-library-status"> · {sharedStatus}</small>}</div><small>{machine.length + ordinateur.length}/{assets.length} fichiers</small></div>
    <div className="sound-library-toolbar">
      <input aria-label="Rechercher un sample" placeholder="Rechercher un sample" value={query} onChange={(event) => setQuery(event.target.value)} />
      <label className="sound-style-select"><span className="visually-hidden">Filtrer par catégorie</span>
        <select value={kind} onChange={(event) => setKind(event.target.value as "all" | SoundKind)}>
          <option value="all">Tous les styles</option>
          {(Object.keys(KIND_LABEL) as SoundKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>
      <label className="sound-style-select"><span className="visually-hidden">Trier par</span>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
          {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => <option key={key} value={key}>Trier : {SORT_LABEL[key]}</option>)}
        </select>
      </label>
      <button type="button" className={`sound-favorite-filter${favoritesOnly ? " is-active" : ""}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((current) => !current)}>★ Favoris</button>
      <label className="sound-import-button">Importer<input type="file" accept="audio/*" multiple onChange={(event) => { importFiles(event.target.files); event.currentTarget.value = ""; }} /></label>
    </div>
    <div className="sound-library-columns">
      {column("Son machine", machine)}
      {column("Son ordinateur", ordinateur)}
    </div>
  </section>;
}
