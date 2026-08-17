import { useEffect, useMemo, useRef, useState } from "react";

type SoundTarget = "op1" | "ep133";
type SoundKind = "sample" | "drum" | "synth" | "voice" | "loop" | "other";
type SoundLibraryAsset = {
  id: string;
  name: string;
  path: string;
  size: number;
  sha256: string;
  kind: SoundKind;
  tags: string[];
  favorite: boolean;
  targets: SoundTarget[];
  addedAt: string;
  durationSeconds?: number;
};
type SoundLibraryManifest = { schema: "studio-hub.sound-library.v1"; updatedAt: string; assets: SoundLibraryAsset[] };
type DirectoryHandleWithEntries = FileSystemDirectoryHandle & { entries(): AsyncIterableIterator<[string, FileSystemHandle]> };

const SOUND_FOLDERS = ["originals", "prepared", "packs", "quarantine"] as const;
const AUDIO_EXTENSIONS = /\.(aif|aiff|wav|mp3|flac|ogg|m4a|aac|opus)$/i;
const KIND_LABELS: Record<SoundKind, string> = { sample: "Sample", drum: "Drum", synth: "Synthé", voice: "Voix", loop: "Loop", other: "Autre" };
const TARGET_LABELS: Record<SoundTarget, string> = { op1: "OP‑1", ep133: "EP‑133" };

function soundId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function inferKind(name: string): SoundKind {
  const lower = name.toLowerCase();
  if (/kick|snare|hat|clap|perc|drum/.test(lower)) return "drum";
  if (/voice|vocal|speech|vox/.test(lower)) return "voice";
  if (/loop|break|beat/.test(lower)) return "loop";
  if (/synth|lead|pad|bass|chord/.test(lower)) return "synth";
  return "sample";
}

function cleanFileName(name: string) {
  const cleaned = name.normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  return cleaned || `son-${Date.now()}.wav`;
}

async function hashBuffer(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function soundsDirectory(root: FileSystemDirectoryHandle, create = false) {
  const shared = await root.getDirectoryHandle("shared", { create });
  return shared.getDirectoryHandle("sounds", { create });
}

async function ensureSoundFolders(root: FileSystemDirectoryHandle) {
  const sounds = await soundsDirectory(root, true);
  for (const folder of SOUND_FOLDERS) await sounds.getDirectoryHandle(folder, { create: true });
  return sounds;
}

async function readManifest(sounds: FileSystemDirectoryHandle): Promise<SoundLibraryAsset[]> {
  try {
    const file = await sounds.getFileHandle("manifest.json");
    const parsed = JSON.parse(await (await file.getFile()).text()) as Partial<SoundLibraryManifest>;
    return Array.isArray(parsed.assets) ? parsed.assets.filter((asset): asset is SoundLibraryAsset => Boolean(asset && typeof asset.id === "string" && typeof asset.path === "string")) : [];
  } catch {
    return [];
  }
}

async function writeManifest(sounds: FileSystemDirectoryHandle, assets: SoundLibraryAsset[]) {
  const manifest = JSON.stringify({ schema: "studio-hub.sound-library.v1", updatedAt: new Date().toISOString(), assets }, null, 2);
  const file = await sounds.getFileHandle("manifest.json", { create: true });
  const writable = await file.createWritable();
  await writable.write(manifest);
  await writable.close();
}

async function findFile(root: FileSystemDirectoryHandle, relativePath: string) {
  const parts = relativePath.split("/").filter(Boolean);
  const name = parts.pop();
  if (!name) throw new Error("Chemin audio invalide.");
  let directory = root;
  for (const part of parts) directory = await directory.getDirectoryHandle(part);
  return directory.getFileHandle(name);
}

async function uniqueName(directory: FileSystemDirectoryHandle, requested: string) {
  const dot = requested.lastIndexOf(".");
  const stem = dot > 0 ? requested.slice(0, dot) : requested;
  const extension = dot > 0 ? requested.slice(dot) : "";
  let candidate = requested;
  let index = 2;
  while (true) {
    try { await directory.getFileHandle(candidate); candidate = `${stem}-${index}${extension}`; index += 1; }
    catch { return candidate; }
  }
}

async function importIntoOriginals(sounds: FileSystemDirectoryHandle, file: File, existing: SoundLibraryAsset[]) {
  const buffer = await file.arrayBuffer();
  const sha256 = await hashBuffer(buffer);
  const duplicate = existing.find((asset) => asset.sha256 === sha256);
  if (duplicate) return { duplicate };
  const originals = await sounds.getDirectoryHandle("originals", { create: true });
  const name = await uniqueName(originals, cleanFileName(file.name));
  const destination = await originals.getFileHandle(name, { create: true });
  const writable = await destination.createWritable();
  await writable.write(buffer);
  await writable.close();
  const stored = await destination.getFile();
  const storedHash = await hashBuffer(await stored.arrayBuffer());
  if (storedHash !== sha256 || stored.size !== file.size) throw new Error(`Vérification échouée pour ${file.name}.`);
  return { asset: { id: soundId(), name, path: `originals/${name}`, size: stored.size, sha256, kind: inferKind(name), tags: [], favorite: false, targets: ["op1", "ep133"], addedAt: new Date().toISOString() } satisfies SoundLibraryAsset };
}

export function SoundLibraryPanel({ workspaceHandle, onOpenOp1, onOpenEp133 }: { workspaceHandle: FileSystemDirectoryHandle | null; onOpenOp1: () => void; onOpenEp133: () => void }) {
  const [assets, setAssets] = useState<SoundLibraryAsset[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | SoundKind>("all");
  const [target, setTarget] = useState<"all" | SoundTarget>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundsRef = useRef<FileSystemDirectoryHandle | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAssets([]);
    setStatus("");
    setError("");
    void (async () => {
      if (!workspaceHandle) return;
      try {
        const sounds = await ensureSoundFolders(workspaceHandle);
        const loaded = await readManifest(sounds);
        if (!cancelled) { soundsRef.current = sounds; setAssets(loaded); setStatus(`${loaded.length} son${loaded.length > 1 ? "s" : ""} dans la bibliothèque centrale.`); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible d’ouvrir la bibliothèque centrale.");
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceHandle]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const visible = useMemo(() => assets.filter((asset) =>
    (kind === "all" || asset.kind === kind)
    && (target === "all" || asset.targets.includes(target))
    && (!favoriteOnly || asset.favorite)
    && `${asset.name} ${asset.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim()),
  ).sort((a, b) => a.name.localeCompare(b.name)), [assets, favoriteOnly, kind, query, target]);

  async function persist(next: SoundLibraryAsset[]) {
    setAssets(next);
    if (soundsRef.current) await writeManifest(soundsRef.current, next);
  }

  async function importFiles(files: FileList | null) {
    if (!files?.length || !workspaceHandle) return;
    setBusy(true); setError(""); setStatus(`Import de ${files.length} fichier${files.length > 1 ? "s" : ""}…`);
    try {
      const sounds = soundsRef.current ?? await ensureSoundFolders(workspaceHandle);
      soundsRef.current = sounds;
      const next = [...assets];
      let added = 0;
      let duplicates = 0;
      for (const file of Array.from(files)) {
        if (!AUDIO_EXTENSIONS.test(file.name)) continue;
        const result = await importIntoOriginals(sounds, file, next);
        if (result.duplicate) duplicates += 1;
        else if (result.asset) { next.push(result.asset); added += 1; }
      }
      await persist(next);
      setStatus(`${added} son${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""}${duplicates ? ` · ${duplicates} doublon${duplicates > 1 ? "s" : ""} ignoré${duplicates > 1 ? "s" : ""}` : ""}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Import impossible."); }
    finally { setBusy(false); }
  }

  async function preview(asset: SoundLibraryAsset) {
    if (!soundsRef.current) return;
    try {
      const file = await findFile(soundsRef.current, asset.path);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(await file.getFile());
      objectUrlRef.current = url;
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      void audio.play().catch(() => setStatus("Clique à nouveau sur lecture si le navigateur bloque l’audio."));
    } catch { setError(`Le fichier ${asset.name} est introuvable dans le workspace.`); }
  }

  async function toggleFavorite(asset: SoundLibraryAsset) {
    try { await persist(assets.map((item) => item.id === asset.id ? { ...item, favorite: !item.favorite } : item)); }
    catch (err) { setError(err instanceof Error ? err.message : "Impossible de mettre à jour le favori."); }
  }

  async function updateAsset(asset: SoundLibraryAsset, patch: Partial<SoundLibraryAsset>) {
    try { await persist(assets.map((item) => item.id === asset.id ? { ...item, ...patch } : item)); }
    catch (err) { setError(err instanceof Error ? err.message : "Impossible de mettre à jour le son."); }
  }

  async function removeAsset(asset: SoundLibraryAsset) {
    if (!soundsRef.current || !window.confirm(`Supprimer « ${asset.name} » de la bibliothèque centrale ?`)) return;
    try {
      const parts = asset.path.split("/");
      const name = parts.pop();
      if (name) {
        let directory = soundsRef.current;
        for (const part of parts) directory = await directory.getDirectoryHandle(part);
        await directory.removeEntry(name);
      }
      await persist(assets.filter((item) => item.id !== asset.id));
      setStatus(`${asset.name} a été retiré de la bibliothèque.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Suppression impossible."); }
  }

  function toggleTarget(asset: SoundLibraryAsset, nextTarget: SoundTarget) {
    const targets = asset.targets.includes(nextTarget) ? asset.targets.filter((item) => item !== nextTarget) : [...asset.targets, nextTarget];
    void updateAsset(asset, { targets: targets.length ? targets : [nextTarget] });
  }

  return <section id="sound-library" className="sound-library-panel" aria-labelledby="sound-library-title">
    <div className="sound-library-header"><div><span className="section-kicker">BIBLIOTHÈQUE CENTRALE</span><h2 id="sound-library-title">Les sons de ton atelier</h2><p className="muted">Un catalogue local commun à l’OP‑1 et à l’EP‑133. Les originaux restent dans ton workspace, avec détection des doublons par empreinte.</p></div><div className="sound-library-actions"><button className="secondary-button" onClick={onOpenOp1}>Ouvrir l’éditeur OP‑1 ↗</button><button className="secondary-button" onClick={onOpenEp133}>Ouvrir Sons EP‑133 ↗</button></div></div>
    {!workspaceHandle && <div className="sound-library-empty">Connecte d’abord l’espace maître dans « Coffre de l’atelier » pour activer la bibliothèque persistante.</div>}
    {workspaceHandle && <><div className="sound-library-toolbar"><input aria-label="Rechercher dans la bibliothèque" placeholder="Rechercher un son ou un tag" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filtrer par type" value={kind} onChange={(event) => setKind(event.target.value as "all" | SoundKind)}><option value="all">Tous les types</option>{(Object.keys(KIND_LABELS) as SoundKind[]).map((item) => <option value={item} key={item}>{KIND_LABELS[item]}</option>)}</select><select aria-label="Filtrer par outil" value={target} onChange={(event) => setTarget(event.target.value as "all" | SoundTarget)}><option value="all">Tous les outils</option><option value="op1">OP‑1</option><option value="ep133">EP‑133</option></select><button className={`secondary-button ${favoriteOnly ? "is-active" : ""}`} aria-pressed={favoriteOnly} onClick={() => setFavoriteOnly((current) => !current)}>★ Favoris</button><label className="primary-button sound-library-import">{busy ? "Import…" : "Importer des sons"}<input ref={fileInputRef} type="file" accept="audio/*" multiple disabled={busy} onChange={(event) => { void importFiles(event.target.files); event.currentTarget.value = ""; }} /></label></div><div className="sound-library-summary"><span>{visible.length} / {assets.length} son{assets.length > 1 ? "s" : ""}</span><span>Stockage : <code>shared/sounds/</code></span></div>{status && <p className="sound-library-status">{status}</p>}{error && <p className="error-message">{error}</p>}<div className="sound-library-grid">{visible.map((asset) => <article className="sound-library-asset" key={asset.id}><div className="sound-library-asset-title"><button className="sound-preview-button" aria-label={`Écouter ${asset.name}`} onClick={() => void preview(asset)}>▶</button><strong title={asset.name}>{asset.name}</strong><button className={`sound-favorite-button ${asset.favorite ? "is-active" : ""}`} aria-label={`${asset.favorite ? "Retirer" : "Ajouter"} ${asset.name} des favoris`} onClick={() => void toggleFavorite(asset)}>★</button></div><div className="sound-library-asset-meta"><span>{KIND_LABELS[asset.kind]}</span><span>{formatBytes(asset.size)}</span><span>{new Date(asset.addedAt).toLocaleDateString("fr-FR")}</span></div><div className="sound-targets">{(Object.keys(TARGET_LABELS) as SoundTarget[]).map((item) => <label key={item}><input type="checkbox" checked={asset.targets.includes(item)} onChange={() => toggleTarget(asset, item)} />{TARGET_LABELS[item]}</label>)}</div><input className="sound-tags-input" aria-label={`Tags de ${asset.name}`} value={asset.tags.join(", ")} placeholder="Tags : kick, court, live" onChange={(event) => { const tags = event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean); void updateAsset(asset, { tags }); }} /><div className="sound-library-asset-actions"><button className="text-button" onClick={() => void removeAsset(asset)}>Supprimer</button><span title={asset.sha256}>SHA‑256 · {asset.sha256.slice(0, 10)}…</span></div></article>)}</div>{!visible.length && <div className="sound-library-empty">Aucun son ne correspond à ce filtre. Importe un fichier audio pour commencer.</div>}</>}
  </section>;
}
