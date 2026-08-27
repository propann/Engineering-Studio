import { useEffect, useMemo, useRef, useState } from "react";
import { readProfile, type StudioProfile } from "./core/profile";
import { useNotesMidi } from "./core/midi/useNotesMidi";

export type SoundSourceType = "all" | "labo" | "p2p" | "personal" | "machines";
export type SoundTarget = "op1" | "ep133";
export type SoundKind = "sample" | "drum" | "synth" | "voice" | "loop" | "bass" | "fx" | "other";

export interface SoundLibraryAsset {
  id: string;
  name: string;
  sourceType: "labo" | "p2p" | "personal" | "machines";
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
}

type SoundLibraryManifest = { schema: "studio-hub.sound-library.v1"; updatedAt: string; assets: SoundLibraryAsset[] };

const SOUND_FOLDERS = ["originals", "prepared", "packs", "quarantine"] as const;
const AUDIO_EXTENSIONS = /\.(aif|aiff|wav|mp3|flac|ogg|m4a|aac|opus)$/i;

const KIND_LABELS: Record<SoundKind, string> = {
  sample: "Sample",
  drum: "Drum",
  synth: "Synthé",
  voice: "Voix",
  loop: "Loop",
  bass: "Basse",
  fx: "Effet FX",
  other: "Autre",
};

const TARGET_LABELS: Record<SoundTarget, string> = { op1: "OP‑1", ep133: "EP‑133" };

const SOURCE_TABS: { id: SoundSourceType; label: string; icon: string; desc: string }[] = [
  { id: "all", label: "Toutes les sources", icon: "✨", desc: "Catalogue unifié de tous les sons disponibles" },
  { id: "labo", label: "Créés ici (Labo & 20 Moteurs)", icon: "🧪", desc: "Patches synthés, exports DSP et modules du Rack" },
  { id: "p2p", label: "Partagés en P2P & Collaboratifs", icon: "🤝", desc: "Stems et samples reçus via le réseau P2P et Music-Git" },
  { id: "personal", label: "Bibliothèque personnelle", icon: "📁", desc: "Fichiers locaux de ton dossier de travail (shared/sounds)" },
  { id: "machines", label: "Sons des machines (OP-1 & EP-133)", icon: "🎛️", desc: "Slots mémoire 001-999, drumkits AIF et patches d'usine" },
];

// Catalogue d'usine des sons intégrés et patches créés dans le studio
const DEFAULT_STUDIO_SOUNDS: SoundLibraryAsset[] = [
  // 🧪 Créés dans le Labo
  {
    id: "lab_synth_acid_303",
    name: "Open303 Acid Bassline",
    sourceType: "labo",
    path: "labo/open303_acid_lead.wav",
    size: 420000,
    sha256: "303acid0000000000000000000000000",
    kind: "bass",
    tags: ["acid", "303", "resonance", "labo"],
    favorite: true,
    targets: ["op1", "ep133"],
    engineOrigin: "open303",
    addedAt: "2026-08-20T10:00:00.000Z",
    durationSeconds: 2.4,
  },
  {
    id: "lab_plaits_modal",
    name: "Mutable Plaits Modal Bell",
    sourceType: "labo",
    path: "labo/plaits_modal_bell.wav",
    size: 680000,
    sha256: "plaitsmodal000000000000000000000",
    kind: "synth",
    tags: ["plaits", "eurorack", "bell", "modal"],
    favorite: false,
    targets: ["op1", "ep133"],
    engineOrigin: "mi_plaits",
    addedAt: "2026-08-21T14:30:00.000Z",
    durationSeconds: 3.1,
  },
  {
    id: "lab_dexed_epiano",
    name: "Dexed FM Solid E-Piano",
    sourceType: "labo",
    path: "labo/dexed_fm_epiano.wav",
    size: 512000,
    sha256: "dexedfm0000000000000000000000000",
    kind: "synth",
    tags: ["fm", "dx7", "keys", "vintage"],
    favorite: true,
    targets: ["op1"],
    engineOrigin: "dexed_fm",
    addedAt: "2026-08-22T09:15:00.000Z",
    durationSeconds: 2.8,
  },
  {
    id: "lab_surge_pad",
    name: "Surge XT Shimmer Pad",
    sourceType: "labo",
    path: "labo/surge_shimmer_pad.wav",
    size: 1024000,
    sha256: "surgexpad00000000000000000000000",
    kind: "synth",
    tags: ["ambient", "surge", "pad", "shimmer"],
    favorite: false,
    targets: ["op1", "ep133"],
    engineOrigin: "surge_xt",
    addedAt: "2026-08-23T11:00:00.000Z",
    durationSeconds: 4.2,
  },
  // 🤝 Partagés P2P
  {
    id: "p2p_stem_vocal_drill",
    name: "P2P Stem - Vocal Hook UK Drill",
    sourceType: "p2p",
    path: "p2p/collab_vocal_drill_stem.wav",
    size: 890000,
    sha256: "p2pvocal000000000000000000000000",
    kind: "voice",
    tags: ["p2p", "collab", "drill", "vocal"],
    favorite: true,
    targets: ["op1", "ep133"],
    author: "CYBER-OP-04 [8F2A]",
    addedAt: "2026-08-24T18:20:00.000Z",
    durationSeconds: 3.5,
  },
  {
    id: "p2p_stem_sub_808",
    name: "P2P Stem - Deep 808 Glide",
    sourceType: "p2p",
    path: "p2p/collab_deep_808_glide.wav",
    size: 450000,
    sha256: "p2p80800000000000000000000000000",
    kind: "bass",
    tags: ["808", "bass", "glide", "trap"],
    favorite: false,
    targets: ["ep133"],
    author: "BEAT-LAB-ALPHA [4B1C]",
    addedAt: "2026-08-25T16:40:00.000Z",
    durationSeconds: 2.1,
  },
  // 🎛️ Sons des machines (EP-133 & OP-1)
  {
    id: "ep133_bank_kick_001",
    name: "EP-133 Slot 001 - Heavy Sub Kick",
    sourceType: "machines",
    path: "ep133/slot_001_heavy_kick.wav",
    size: 128000,
    sha256: "epkick00100000000000000000000000",
    kind: "drum",
    tags: ["kick", "ep133", "sub", "factory"],
    favorite: true,
    targets: ["ep133"],
    machineSlot: "EP-133 Slot 001 (Gr. A, Pad 1)",
    addedAt: "2026-08-15T08:00:00.000Z",
    durationSeconds: 0.8,
  },
  {
    id: "ep133_bank_snare_012",
    name: "EP-133 Slot 012 - Tight Vintage Snare",
    sourceType: "machines",
    path: "ep133/slot_012_tight_snare.wav",
    size: 110000,
    sha256: "epsnare0120000000000000000000000",
    kind: "drum",
    tags: ["snare", "ep133", "punch", "factory"],
    favorite: false,
    targets: ["ep133"],
    machineSlot: "EP-133 Slot 012 (Gr. A, Pad 2)",
    addedAt: "2026-08-15T08:00:00.000Z",
    durationSeconds: 0.6,
  },
  {
    id: "op1_drumkit_dbox",
    name: "OP-1 Drumkit - D-Box Analog Kit",
    sourceType: "machines",
    path: "op1/drumkit_dbox_24pad.aif",
    size: 1450000,
    sha256: "op1dbox0000000000000000000000000",
    kind: "drum",
    tags: ["op1", "kit", "analog", "24keys"],
    favorite: true,
    targets: ["op1"],
    machineSlot: "OP-1 Drum Bank 1",
    addedAt: "2026-08-16T12:00:00.000Z",
    durationSeconds: 12.0,
  },
  {
    id: "op1_synth_cluster_lead",
    name: "OP-1 Synth - Cluster Lead 6-Voice",
    sourceType: "machines",
    path: "op1/cluster_lead_poly.wav",
    size: 720000,
    sha256: "op1cluster0000000000000000000000",
    kind: "synth",
    tags: ["op1", "cluster", "synth", "lead"],
    favorite: false,
    targets: ["op1"],
    machineSlot: "OP-1 Synth Patch 04",
    addedAt: "2026-08-16T14:20:00.000Z",
    durationSeconds: 3.0,
  },
];

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
  if (/kick|snare|hat|clap|perc|drum|tom|cymbal/.test(lower)) return "drum";
  if (/bass|808|sub|reese|wobble/.test(lower)) return "bass";
  if (/voice|vocal|speech|vox|hook/.test(lower)) return "voice";
  if (/loop|break|beat|riff/.test(lower)) return "loop";
  if (/synth|lead|pad|chord|keys|bell|organ/.test(lower)) return "synth";
  if (/fx|riser|sweep|impact|noise/.test(lower)) return "fx";
  return "sample";
}

function cleanFileName(name: string) {
  return name.normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim() || `son-${Date.now()}.wav`;
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
    return Array.isArray(parsed.assets)
      ? parsed.assets.filter((asset): asset is SoundLibraryAsset => Boolean(asset && typeof asset.id === "string" && typeof asset.path === "string"))
      : [];
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
    try {
      await directory.getFileHandle(candidate);
      candidate = `${stem}-${index}${extension}`;
      index += 1;
    } catch {
      return candidate;
    }
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
  return {
    asset: {
      id: soundId(),
      name,
      sourceType: "personal",
      path: `originals/${name}`,
      size: stored.size,
      sha256,
      kind: inferKind(name),
      tags: [],
      favorite: false,
      targets: ["op1", "ep133"],
      addedAt: new Date().toISOString(),
    } satisfies SoundLibraryAsset,
  };
}

export function SoundLibraryPanel({
  workspaceHandle = null,
  onOpenOp1 = () => {},
  onOpenEp133 = () => {},
}: {
  workspaceHandle?: FileSystemDirectoryHandle | null;
  onOpenOp1?: () => void;
  onOpenEp133?: () => void;
}) {
  const [activeSource, setActiveSource] = useState<SoundSourceType>("all");
  const [assets, setAssets] = useState<SoundLibraryAsset[]>(DEFAULT_STUDIO_SOUNDS);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | SoundKind>("all");
  const [target, setTarget] = useState<"all" | SoundTarget>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [profileFilter, setProfileFilter] = useState<"all" | "role">("all");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<Map<string, SoundLibraryAsset[]>>(new Map());
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [currentProfile, setCurrentProfile] = useState<StudioProfile | null>(() => readProfile());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundsRef = useRef<FileSystemDirectoryHandle | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);

  // Synchronisation du profil opérateur pour le filtrage adapté
  useEffect(() => {
    const prof = readProfile();
    setCurrentProfile(prof);
  }, []);

  // Chargement des fichiers réels du workspace
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!workspaceHandle) return;
      try {
        const sounds = await ensureSoundFolders(workspaceHandle);
        const loaded = await readManifest(sounds);
        if (!cancelled) {
          soundsRef.current = sounds;
          // Fusion des sons d'usine/moteurs avec les fichiers réels du workspace
          const existingIds = new Set(loaded.map((a) => a.id));
          const merged = [...loaded, ...DEFAULT_STUDIO_SOUNDS.filter((s) => !existingIds.has(s.id))];
          setAssets(merged);
          setStatus(`${merged.length} son(s) indexé(s) dans la bibliothèque sonore multi-sources.`);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible d’ouvrir la bibliothèque centrale.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceHandle]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (synthCtxRef.current) void synthCtxRef.current.close();
  }, []);

  // Détermination du rôle du profil opérateur (ex: Beatmaker -> drums, Sound Designer -> synth/fx)
  const operatorAvatar = currentProfile?.avatar || "engineer";
  const isBeatmakerProfile = ["drum", "dj", "knight", "fighter"].includes(operatorAvatar);
  const isSoundDesignerProfile = ["synth", "wizard", "engineer", "scientist", "cyborg"].includes(operatorAvatar);

  // Filtrage multi-critères : Source, Type, Machine cible, Favoris, Recherche & Profil
  const visible = useMemo(() => {
    return assets
      .filter((asset) => {
        // Filtre Source
        if (activeSource !== "all" && asset.sourceType !== activeSource) return false;
        // Filtre Type
        if (kind !== "all" && asset.kind !== kind) return false;
        // Filtre Machine
        if (target !== "all" && !asset.targets.includes(target)) return false;
        // Filtre Favoris
        if (favoriteOnly && !asset.favorite) return false;
        // Filtre Profil
        if (profileFilter === "role") {
          if (isBeatmakerProfile && !["drum", "bass", "loop"].includes(asset.kind)) return false;
          if (isSoundDesignerProfile && !["synth", "fx", "sample"].includes(asset.kind)) return false;
        }
        // Recherche textuelle
        const textToSearch = `${asset.name} ${asset.tags.join(" ")} ${asset.engineOrigin || ""} ${asset.author || ""} ${asset.machineSlot || ""}`.toLowerCase();
        return textToSearch.includes(query.toLowerCase().trim());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assets, activeSource, favoriteOnly, kind, profileFilter, isBeatmakerProfile, isSoundDesignerProfile, query, target]);

  async function persist(next: SoundLibraryAsset[]) {
    setAssets(next);
    if (soundsRef.current) {
      // On sauvegarde uniquement les assets du workspace
      const localAssets = next.filter((item) => item.sourceType === "personal" || item.path.startsWith("originals/") || item.path.startsWith("prepared/"));
      await writeManifest(soundsRef.current, localAssets);
    }
  }

  async function importFiles(files: FileList | null) {
    if (!files?.length || !workspaceHandle) return;
    setBusy(true);
    setError("");
    setStatus(`Import de ${files.length} fichier${files.length > 1 ? "s" : ""}…`);
    try {
      const sounds = soundsRef.current ?? (await ensureSoundFolders(workspaceHandle));
      soundsRef.current = sounds;
      const next = [...assets];
      let added = 0;
      let duplicates = 0;
      for (const file of Array.from(files)) {
        if (!AUDIO_EXTENSIONS.test(file.name)) continue;
        const result = await importIntoOriginals(sounds, file, next);
        if (result.duplicate) duplicates += 1;
        else if (result.asset) {
          next.push(result.asset);
          added += 1;
        }
      }
      await persist(next);
      setStatus(
        `${added} son${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""}${
          duplicates ? ` · ${duplicates} doublon${duplicates > 1 ? "s" : ""} ignoré${duplicates > 1 ? "s" : ""}` : ""
        }.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      setBusy(false);
    }
  }

  // Pré-écoute audio : lit le fichier local s'il existe, ou synthétise le son en direct via Web Audio API !
  async function preview(asset: SoundLibraryAsset) {
    if (playingId === asset.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    setPlayingId(asset.id);

    // 1. Essai de lecture depuis le fichier physique s'il existe dans le workspace
    if (soundsRef.current && (asset.sourceType === "personal" || asset.path.startsWith("originals/"))) {
      try {
        const file = await findFile(soundsRef.current, asset.path);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(await file.getFile());
        objectUrlRef.current = url;
        audioRef.current?.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlayingId(null);
        void audio.play().catch(() => setStatus("Clique à nouveau sur lecture si le navigateur bloque l’audio."));
        return;
      } catch {
        // Si le fichier physique n'est pas trouvé, repli sur le synthétiseur de pré-écoute
      }
    }

    // 2. Pré-écoute synthétisée en temps réel (pour les patches Labo, P2P et sons d'usine machine)
    try {
      if (!synthCtxRef.current) {
        synthCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = synthCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (asset.kind === "bass" || asset.name.includes("303") || asset.name.includes("808")) {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (asset.kind === "drum") {
        // Simulation Drum Kick / Snare
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Simulation Synth Pad / Lead
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      }

      setTimeout(() => {
        setPlayingId(null);
      }, 1000);
    } catch {
      setPlayingId(null);
    }
  }

  useNotesMidi((_note) => {
    if (visible.length > 0 && !playingId) {
      void preview(visible[0]);
    }
  });

  async function toggleFavorite(asset: SoundLibraryAsset) {
    try {
      await persist(assets.map((item) => (item.id === asset.id ? { ...item, favorite: !item.favorite } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le favori.");
    }
  }

  async function updateAsset(asset: SoundLibraryAsset, patch: Partial<SoundLibraryAsset>) {
    try {
      await persist(assets.map((item) => (item.id === asset.id ? { ...item, ...patch } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le son.");
    }
  }

  async function removeAsset(asset: SoundLibraryAsset) {
    if (!window.confirm(`Supprimer « ${asset.name} » de la bibliothèque ?`)) return;
    try {
      if (soundsRef.current && (asset.sourceType === "personal" || asset.path.startsWith("originals/"))) {
        const parts = asset.path.split("/");
        const name = parts.pop();
        if (name) {
          let directory = soundsRef.current;
          for (const part of parts) directory = await directory.getDirectoryHandle(part);
          await directory.removeEntry(name);
        }
      }
      await persist(assets.filter((item) => item.id !== asset.id));
      setStatus(`${asset.name} a été retiré de la bibliothèque.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  function scanForDuplicates() {
    const byHash = new Map<string, SoundLibraryAsset[]>();
    for (const asset of assets) {
      const list = byHash.get(asset.sha256) || [];
      list.push(asset);
      byHash.set(asset.sha256, list);
    }
    const dups = new Map(Array.from(byHash).filter(([_, items]) => items.length > 1));
    setDuplicates(dups);
    setShowDuplicates(true);
    setStatus(`✅ Scan terminé : ${dups.size} groupe${dups.size > 1 ? "s" : ""} de doublons identifié(s).`);
  }

  function toggleTarget(asset: SoundLibraryAsset, nextTarget: SoundTarget) {
    const targets = asset.targets.includes(nextTarget) ? asset.targets.filter((item) => item !== nextTarget) : [...asset.targets, nextTarget];
    void updateAsset(asset, { targets: targets.length ? targets : [nextTarget] });
  }

  const copyStrudelSnippet = (asset: SoundLibraryAsset) => {
    const sampleTag = asset.name.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 16);
    const snippet = `// Pattern Strudel pour ${asset.name}\ns("${sampleTag}*4").gain(0.85).room(0.2)`;
    navigator.clipboard.writeText(snippet);
    setStatus(`📋 Snippet Strudel copié pour « ${asset.name} » !`);
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <section id="sound-library" className="sound-library-panel" aria-labelledby="sound-library-title">
      {/* Header & Source Switcher Tabs */}
      <div className="sound-library-header">
        <div>
          <span className="section-kicker">BIBLIOTHÈQUE MULTI-SOURCES</span>
          <h2 id="sound-library-title">Toutes les sources sonores du Studio</h2>
          <p className="muted">
            Explorez, pré-écoutez et organisez l'intégralité des sons créés au Labo, partagés en P2P, issus de vos dossiers personnels et des banques machines OP‑1 / EP‑133.
          </p>
        </div>

        <div className="sound-library-actions">
          <button className="secondary-button" onClick={onOpenOp1}>
            Ouvrir Studio OP‑1 ↗
          </button>
          <button className="secondary-button" onClick={onOpenEp133}>
            Ouvrir Studio EP‑133 ↗
          </button>
        </div>
      </div>

      {/* Barre d'onglets des sources de son */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          overflowX: "auto",
          paddingBottom: "4px",
          borderBottom: "1px solid var(--theme-border, #2c3b40)",
        }}
      >
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSource(tab.id)}
            style={{
              padding: "8px 14px",
              background: activeSource === tab.id ? "var(--theme-accent, #00ed95)" : "var(--theme-bg-surface, #151d20)",
              color: activeSource === tab.id ? "#000" : "var(--theme-text-main, #edf2f7)",
              border: `1.5px solid ${activeSource === tab.id ? "var(--theme-accent, #00ed95)" : "var(--theme-border, #2c3b40)"}`,
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profil de personnage : Suggestions adaptées */}
      {currentProfile && (
        <div
          style={{
            padding: "8px 14px",
            background: "var(--theme-bg-surface, #151d20)",
            border: "1px solid var(--theme-border, #2c3b40)",
            borderRadius: "6px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🎯</span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Fiche de Personnage : <strong style={{ color: "#fff" }}>{currentProfile.name || "Opérateur"}</strong> ({currentProfile.avatar?.toUpperCase() || "ENGINEER"})
              {isBeatmakerProfile && " · Focus Beatmaker & Rythmique activable"}
              {isSoundDesignerProfile && " · Focus Synth Designer & Ondes activable"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setProfileFilter(profileFilter === "role" ? "all" : "role")}
              style={{
                padding: "4px 10px",
                background: profileFilter === "role" ? "#38bdf8" : "#1e293b",
                color: profileFilter === "role" ? "#000" : "#fff",
                border: "1px solid #334155",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {profileFilter === "role" ? "✓ FILTRE RÔLE ACTIF" : "⚡ FILTRER SELON MA FICHE"}
            </button>
          </div>
        </div>
      )}

      {/* Barre d'outils et de filtres */}
      <div className="sound-library-toolbar">
        <input
          aria-label="Rechercher dans la bibliothèque"
          placeholder="Rechercher un son, tag, moteur DSP, slot..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select aria-label="Filtrer par type" value={kind} onChange={(event) => setKind(event.target.value as "all" | SoundKind)}>
          <option value="all">Tous les types de sons</option>
          {(Object.keys(KIND_LABELS) as SoundKind[]).map((item) => (
            <option value={item} key={item}>
              {KIND_LABELS[item]}
            </option>
          ))}
        </select>

        <select aria-label="Filtrer par outil" value={target} onChange={(event) => setTarget(event.target.value as "all" | SoundTarget)}>
          <option value="all">Toutes les machines</option>
          <option value="op1">Compatible OP‑1</option>
          <option value="ep133">Compatible EP‑133</option>
        </select>

        <button
          className={`secondary-button ${favoriteOnly ? "is-active" : ""}`}
          aria-pressed={favoriteOnly}
          onClick={() => setFavoriteOnly((current) => !current)}
        >
          ★ Favoris
        </button>

        <button className="secondary-button" onClick={scanForDuplicates} disabled={busy}>
          🔍 Doublons SHA-256
        </button>

        <label className="primary-button sound-library-import">
          {busy ? "Import…" : "➕ Importer des sons"}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            disabled={busy}
            onChange={(event) => {
              void importFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {/* Résumé des sons */}
      <div className="sound-library-summary">
        <span>
          {visible.length} / {assets.length} son(s) affiché(s) · Source active :{" "}
          <strong>{SOURCE_TABS.find((t) => t.id === activeSource)?.label}</strong>
        </span>
        <span>
          Stockage workspace : <code>shared/sounds/</code>
        </span>
      </div>

      {status && <p className="sound-library-status">{status}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Section Doublons */}
      {showDuplicates && duplicates.size > 0 && (
        <div style={{ marginBottom: "20px", padding: "15px", background: "#fff3cd", border: "2px solid #ff6b6b", borderRadius: "4px" }}>
          <strong style={{ display: "block", marginBottom: "10px", fontSize: "14px", color: "#842029" }}>
            🔍 Doublons détectés par empreinte SHA-256 ({duplicates.size} groupe(s))
          </strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from(duplicates).map(([sha256, assets]) => (
              <div key={sha256} style={{ padding: "10px", background: "#fff", border: "1px solid #ddd", borderRadius: "3px" }}>
                <div style={{ marginBottom: "8px", fontSize: "12px", fontFamily: "monospace", color: "#666" }}>
                  SHA-256: {sha256.slice(0, 16)}...
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {assets.map((asset, idx) => (
                    <div
                      key={asset.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                        padding: "4px",
                        background: idx > 0 ? "#ffe6e6" : "transparent",
                      }}
                    >
                      <span>
                        {idx > 0 ? "🔴 Doublon:" : "Original:"} {asset.name} ({formatBytes(asset.size)})
                      </span>
                      {idx > 0 && (
                        <button
                          onClick={() => void removeAsset(asset)}
                          style={{
                            padding: "2px 6px",
                            background: "#ff6b6b",
                            color: "white",
                            border: "none",
                            borderRadius: "2px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowDuplicates(false)}
            style={{ marginTop: "10px", padding: "6px 12px", background: "#333", color: "white", border: "none", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}
          >
            Fermer le rapport de doublons
          </button>
        </div>
      )}

      {/* Grille des Sons */}
      <div className="sound-library-grid">
        {visible.map((asset) => {
          const isPlaying = playingId === asset.id;
          return (
            <article className="sound-library-asset" key={asset.id} style={{ borderTop: isPlaying ? "3px solid var(--theme-accent, #00ed95)" : undefined }}>
              <div className="sound-library-asset-title">
                <button
                  className="sound-preview-button"
                  aria-label={`Écouter ${asset.name}`}
                  onClick={() => void preview(asset)}
                  style={{
                    background: isPlaying ? "var(--theme-accent, #00ed95)" : undefined,
                    color: isPlaying ? "#000" : undefined,
                  }}
                >
                  {isPlaying ? "⏹" : "▶"}
                </button>
                <strong title={asset.name}>{asset.name}</strong>
                <button
                  className={`sound-favorite-button ${asset.favorite ? "is-active" : ""}`}
                  aria-label={`${asset.favorite ? "Retirer" : "Ajouter"} ${asset.name} des favoris`}
                  onClick={() => void toggleFavorite(asset)}
                >
                  ★
                </button>
              </div>

              {/* Source & Kind Badges */}
              <div style={{ display: "flex", gap: "6px", margin: "6px 0", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    background:
                      asset.sourceType === "labo"
                        ? "#f59e0b"
                        : asset.sourceType === "p2p"
                        ? "#38bdf8"
                        : asset.sourceType === "machines"
                        ? "#a855f7"
                        : "#334155",
                    color: asset.sourceType === "labo" || asset.sourceType === "p2p" ? "#000" : "#fff",
                  }}
                >
                  {asset.sourceType === "labo"
                    ? "🧪 LABO DSP"
                    : asset.sourceType === "p2p"
                    ? "🤝 P2P STEM"
                    : asset.sourceType === "machines"
                    ? "🎛️ MACHINE"
                    : "📁 PERSONNEL"}
                </span>

                <span style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", fontWeight: 700 }}>
                  {KIND_LABELS[asset.kind]}
                </span>
                <span style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)" }}>
                  {formatBytes(asset.size)}
                </span>
              </div>

              {/* Meta supplémentaire : machine slot, engine origin, auteur */}
              {(asset.engineOrigin || asset.machineSlot || asset.author) && (
                <div style={{ fontSize: "11px", color: "#38bdf8", marginBottom: "6px", fontFamily: "monospace" }}>
                  {asset.engineOrigin && `Moteur : ${asset.engineOrigin}`}
                  {asset.machineSlot && `Emplacement : ${asset.machineSlot}`}
                  {asset.author && `Pair : ${asset.author}`}
                </div>
              )}

              {/* Compatible Targets Checkboxes */}
              <div className="sound-targets">
                {(Object.keys(TARGET_LABELS) as SoundTarget[]).map((item) => (
                  <label key={item}>
                    <input type="checkbox" checked={asset.targets.includes(item)} onChange={() => toggleTarget(asset, item)} />
                    {TARGET_LABELS[item]}
                  </label>
                ))}
              </div>

              {/* Tags Input */}
              <input
                className="sound-tags-input"
                aria-label={`Tags de ${asset.name}`}
                value={asset.tags.join(", ")}
                placeholder="Tags : kick, court, live, modular"
                onChange={(event) => {
                  const tags = event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                  void updateAsset(asset, { tags });
                }}
              />

              {/* Actions rapides */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => copyStrudelSnippet(asset)}
                  style={{
                    padding: "3px 6px",
                    background: "#1e293b",
                    color: "#f59e0b",
                    fontSize: "10px",
                    fontWeight: 800,
                    border: "1px solid #334155",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  💻 STRUDEL
                </button>

                <button
                  type="button"
                  onClick={() => (window as any).navigateMaquette("labo")}
                  style={{
                    padding: "3px 6px",
                    background: "#1e293b",
                    color: "var(--theme-accent, #00ed95)",
                    fontSize: "10px",
                    fontWeight: 800,
                    border: "1px solid #334155",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  🧪 LABO
                </button>
              </div>

              <div className="sound-library-asset-actions" style={{ marginTop: "8px" }}>
                <button className="text-button" onClick={() => void removeAsset(asset)}>
                  Supprimer
                </button>
                <span title={asset.sha256}>SHA‑256 · {asset.sha256.slice(0, 10)}…</span>
              </div>
            </article>
          );
        })}
      </div>

      {!visible.length && (
        <div className="sound-library-empty">
          Aucun son ne correspond aux filtres sélectionnés. Cliquez sur « Importer des sons » ou changez la source active.
        </div>
      )}
    </section>
  );
}

export default SoundLibraryPanel;
