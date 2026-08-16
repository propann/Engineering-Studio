import { useEffect, useMemo, useState } from "react";
import { VaultPanel, type MachineId } from "./VaultPanel";

type MachineProfile = { enabled: boolean; backups: number; projects: number; samples: number };
type MachineInstance = MachineProfile & { id: string; kind: MachineId; name: string; capacityMb?: 64 | 128 };
type HubProfile = {
  version: 1;
  name: string;
  avatar: string;
  bio: string;
  machines: Record<MachineId, MachineProfile>;
  machineInventory: MachineInstance[];
  workspace?: { name: string; folders: string[] };
  createdAt: string;
};
type WorkspaceSelection = { name: string; folders: string[]; handle: FileSystemDirectoryHandle };

const PROFILE_KEY = "studio-hub-profile";
const PROFILE_DRAFT_KEY = "studio-hub-profile-draft";
const LEGACY_MIGRATION_KEY = "studio-hub-legacy-profile-v1";
const WORKSPACE_DB = "studio-hub-workspace";
const DEFAULT_PROFILE: HubProfile = {
  version: 1, name: "", avatar: "🎛️", bio: "", createdAt: "",
  machines: { op1: { enabled: true, backups: 0, projects: 0, samples: 0 }, ep133: { enabled: true, backups: 0, projects: 0, samples: 0 } },
  machineInventory: [],
};

const defaultMachineInventory = (): MachineInstance[] => [
  { id: "op1-1", kind: "op1", name: "Mon OP‑1", enabled: true, backups: 0, projects: 0, samples: 0 },
  { id: "ep133-1", kind: "ep133", name: "Mon EP‑133", capacityMb: 64, enabled: true, backups: 0, projects: 0, samples: 0 },
];

const machineCopy: Record<MachineId, { title: string; description: string; color: string; url: string }> = {
  op1: { title: "OP‑1 Studio", description: "Firmware, sauvegardes, samples, patches son et images.", color: "blue", url: import.meta.env.VITE_OP1_URL || "http://127.0.0.1:5175/" },
  ep133: { title: "EP‑133 K.O. II Studio", description: "Patterns, Songs, samples, clone et entraînement MIDI.", color: "orange", url: import.meta.env.VITE_EP133_URL || "http://127.0.0.1:5177/" },
};

function readProfile(): HubProfile | null {
  try {
    const savedRaw = localStorage.getItem(PROFILE_KEY);
    const raw = savedRaw || localStorage.getItem(PROFILE_DRAFT_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as Record<string, any>;
    const legacyName = legacy.name ?? legacy.pseudo ?? legacy.username;
    if ((!savedRaw && typeof legacyName !== "string") || !String(legacyName ?? "").trim()) return null;
    const legacyMachines = legacy.ownedMachines ?? {};
    const legacyStats = legacy.stats ?? {};
    const legacyInventory = Array.isArray(legacy.machineInventory)
      ? legacy.machineInventory
      : Array.isArray(legacy.machines)
        ? legacy.machines.map((machine: Record<string, any>) => ({
          id: machine.id,
          name: machine.name,
          kind: /ep.?133|ko.?ii/i.test(String(machine.name ?? machine.model ?? "")) ? "ep133" : "op1",
          capacityMb: String(machine.memory ?? machine.capacityMb) === "128" ? 128 : 64,
          enabled: true,
        }))
        : null;
    const machineInventory: MachineInstance[] = (legacyInventory?.length ? legacyInventory : (Object.keys(machineCopy) as MachineId[]).map((kind) => ({
      id: `${kind}-1`, kind, name: kind === "op1" ? "Mon OP‑1" : "Mon EP‑133", capacityMb: kind === "ep133" ? 64 as const : undefined,
      ...((legacy.machines?.[kind] ?? {}) as MachineProfile),
    }))).map((machine, index) => {
      const kind: MachineId = machine.kind === "ep133" ? "ep133" : "op1";
      return {
        id: typeof machine.id === "string" && machine.id ? machine.id : `${kind}-${index + 1}`,
        kind,
        name: typeof machine.name === "string" && machine.name.trim() ? machine.name.trim() : `${kind === "op1" ? "OP‑1" : "EP‑133"} ${index + 1}`,
        capacityMb: kind === "ep133" && machine.capacityMb === 128 ? 128 : kind === "ep133" ? 64 : undefined,
        enabled: machine.enabled !== false,
        backups: Number(machine.backups) || 0,
        projects: Number(machine.projects) || 0,
        samples: Number(machine.samples) || 0,
      };
    });
    return {
      ...DEFAULT_PROFILE,
      ...legacy,
      name: String(legacyName).trim(),
      avatar: legacy.avatar ?? legacy.avatarEmoji ?? ({ kick: "🥁", drum: "🥁", synth: "🎛️" } as Record<string, string>)[legacy.avatarId] ?? DEFAULT_PROFILE.avatar,
      machines: {
        op1: { ...DEFAULT_PROFILE.machines.op1, ...(legacy.machines?.op1 ?? {}), enabled: legacy.machines?.op1?.enabled ?? (Boolean(legacyMachines.op1?.enabled) || machineInventory.some((machine) => machine.kind === "op1" && machine.enabled)), backups: legacyStats.op1?.backupsCreated ?? legacy.machines?.op1?.backups ?? 0, projects: legacyStats.op1?.keyboardConfigs ?? legacy.machines?.op1?.projects ?? 0, samples: legacy.machines?.op1?.samples ?? 0 },
        ep133: { ...DEFAULT_PROFILE.machines.ep133, ...(legacy.machines?.ep133 ?? {}), enabled: legacy.machines?.ep133?.enabled ?? (Boolean(legacyMachines.ep133?.enabled) || machineInventory.some((machine) => machine.kind === "ep133" && machine.enabled)), backups: legacyStats.ep133?.patternsEdited ?? legacy.machines?.ep133?.backups ?? 0, projects: legacy.machines?.ep133?.projects ?? 0, samples: legacyStats.ep133?.trainingProgress ?? legacy.machines?.ep133?.samples ?? 0 },
      },
      workspace: legacy.workspace
        ? { name: legacy.workspace.name ?? legacy.workspace.folderName ?? "Espace partagé", folders: legacy.workspace.folders ?? [] }
        : undefined,
      machineInventory: machineInventory.length ? machineInventory : defaultMachineInventory(),
      createdAt: legacy.createdAt || new Date().toISOString(),
    };
  } catch { return null; }
}

function persistProfile(profile: HubProfile) { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }

function readProfileDraft(): Partial<HubProfile> | null {
  try {
    const raw = localStorage.getItem(PROFILE_DRAFT_KEY);
    return raw ? JSON.parse(raw) as Partial<HubProfile> : null;
  } catch { return null; }
}

function persistProfileDraft(draft: Partial<HubProfile>) {
  try { localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft)); } catch { /* sauvegarde de confort */ }
}

function clearProfileDraft() {
  try { localStorage.removeItem(PROFILE_DRAFT_KEY); } catch { /* sauvegarde principale déjà effectuée */ }
}

function saveWorkspaceHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORKSPACE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("handles");
    request.onsuccess = () => {
      const transaction = request.result.transaction("handles", "readwrite");
      transaction.objectStore("handles").put(handle, "root");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function loadWorkspaceHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(WORKSPACE_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("handles");
      request.onsuccess = () => {
        const transaction = request.result.transaction("handles", "readonly");
        const get = transaction.objectStore("handles").get("root");
        get.onsuccess = () => resolve((get.result as FileSystemDirectoryHandle | undefined) ?? null);
        get.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function chooseWorkspace(): Promise<WorkspaceSelection | null> {
  const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!picker) throw new Error("Ce navigateur ne permet pas de choisir un dossier local.");
  const root = await picker();
  const folders = ["shared", "op1/backups", "op1/samples", "op1/firmware", "ep133/backups", "ep133/projects", "ep133/samples"];
  for (const path of folders) {
    let current = root;
    for (const part of path.split("/")) current = await current.getDirectoryHandle(part, { create: true });
  }
  return { name: root.name, folders, handle: root };
}

export function App() {
  const [profile, setProfile] = useState<HubProfile | null>(() => readProfile());
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  // La porte d'entrée reste toujours le premier écran : elle décide ensuite
  // entre la fiche personnage et le Hub des outils selon la sauvegarde locale.
  const [screen, setScreen] = useState<"landing" | "profile" | "dashboard">("landing");

  useEffect(() => { if (profile) { persistProfile(profile); clearProfileDraft(); } }, [profile]);
  useEffect(() => {
    if (profile) return;
    let cancelled = false;
    void fetch("/legacy-profile.json", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Record<string, unknown>> : null).then((legacy) => {
      if (cancelled || !legacy || localStorage.getItem(LEGACY_MIGRATION_KEY)) return;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(legacy));
      localStorage.setItem(LEGACY_MIGRATION_KEY, "1");
      const migrated = readProfile();
      if (migrated) setProfile(migrated);
    }).catch(() => { /* aucune ancienne fiche disponible */ });
    return () => { cancelled = true; };
  }, [profile]);
  useEffect(() => { void loadWorkspaceHandle().then(setWorkspaceHandle); }, []);

  if (screen === "landing") return <Landing profile={profile} onStart={() => setScreen(profile ? "dashboard" : "profile")} />;
  if (screen === "profile" || !profile) return <ProfileForm initial={profile} onCancel={profile ? () => setScreen("dashboard") : undefined} onComplete={(next, handle) => { persistProfile(next); clearProfileDraft(); setProfile(next); if (handle) { setWorkspaceHandle(handle); void saveWorkspaceHandle(handle); } setScreen("dashboard"); }} />;
  return <Dashboard profile={profile} workspaceHandle={workspaceHandle} onProfile={() => setScreen("profile")} onWorkspaceSelected={(handle, name) => { setWorkspaceHandle(handle); setProfile({ ...profile, workspace: { name, folders: ["shared", "op1/backups", "op1/samples", "op1/firmware", "ep133/backups", "ep133/projects", "ep133/samples"] } }); void saveWorkspaceHandle(handle); }} onBackupRecorded={(machine) => setProfile({ ...profile, machines: { ...profile.machines, [machine]: { ...profile.machines[machine], backups: profile.machines[machine].backups + 1 } } })} />;
}

function Landing({ profile, onStart }: { profile: HubProfile | null; onStart: () => void }) {
  const hasSavedProfile = Boolean(profile);
  return <main className="landing-screen"><div className="landing-glow" /><div className="landing-content"><span className="brand-mark">STUDIO HUB</span><h1>Un atelier pour toutes tes machines.</h1><p>{hasSavedProfile ? `Bon retour ${profile?.name} ${profile?.avatar}. Ta fiche et ton atelier sont prêts.` : "Une identité, un espace de travail, des sauvegardes réunies et un accès direct aux studios OP‑1 et EP‑133."}</p><button className="primary-button" onClick={onStart}>{hasSavedProfile ? "Ouvrir mes outils" : "Créer ma fiche personnage"} <span>→</span></button><small>LOCAL · HORS COMPTE · TES FICHIERS RESTENT SUR TON ORDINATEUR</small></div></main>;
}

function ProfileForm({ initial, onCancel, onComplete }: { initial: HubProfile | null; onCancel?: () => void; onComplete: (profile: HubProfile, handle?: FileSystemDirectoryHandle) => void }) {
  const draft = readProfileDraft();
  const [name, setName] = useState(initial?.name ?? draft?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? draft?.avatar ?? "🎛️");
  const [bio, setBio] = useState(initial?.bio ?? draft?.bio ?? "");
  const [machineInventory, setMachineInventory] = useState<MachineInstance[]>(initial?.machineInventory?.length ? initial.machineInventory : draft?.machineInventory?.length ? draft.machineInventory as MachineInstance[] : defaultMachineInventory());
  const [workspace, setWorkspace] = useState(initial?.workspace ?? draft?.workspace);
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [error, setError] = useState("");
  const avatars = ["🎛️", "🥁", "🎹", "🎚️", "🪩", "🚀", "🌙", "⚡"];

  async function selectFolder() {
    setError("");
    try { const selected = await chooseWorkspace(); setWorkspace(selected ? { name: selected.name, folders: selected.folders } : undefined); setWorkspaceHandle(selected?.handle); } catch (err) { if ((err as DOMException).name !== "AbortError") setError(err instanceof Error ? err.message : "Impossible de préparer le dossier."); }
  }
  function save() {
    if (!name.trim()) { setError("Choisis un nom pour ta fiche personnage."); return; }
    const enabledMachines = machineInventory.filter((machine) => machine.enabled);
    if (!enabledMachines.length) { setError("Déclare au moins une machine active."); return; }
    const summary = (Object.keys(machineCopy) as MachineId[]).reduce((result, kind) => {
      const declared = enabledMachines.filter((machine) => machine.kind === kind);
      result[kind] = {
        enabled: declared.length > 0,
        backups: declared.reduce((total, machine) => total + machine.backups, 0),
        projects: declared.reduce((total, machine) => total + machine.projects, 0),
        samples: declared.reduce((total, machine) => total + machine.samples, 0),
      };
      return result;
    }, {} as Record<MachineId, MachineProfile>);
    onComplete({ version: 1, name: name.trim(), avatar, bio: bio.trim(), machines: summary, machineInventory, workspace, createdAt: initial?.createdAt || new Date().toISOString() }, workspaceHandle);
  }

  function updateMachine(id: string, patch: Partial<MachineInstance>) {
    setMachineInventory((current) => current.map((machine) => machine.id === id ? { ...machine, ...patch } : machine));
  }

  function addMachine(kind: MachineId) {
    const count = machineInventory.filter((machine) => machine.kind === kind).length + 1;
    setMachineInventory((current) => [...current, { id: `${kind}-${Date.now()}`, kind, name: `${kind === "op1" ? "OP‑1" : "EP‑133"} ${count}`, capacityMb: kind === "ep133" ? 64 : undefined, enabled: true, backups: 0, projects: 0, samples: 0 }]);
  }

  function removeMachine(id: string) {
    setMachineInventory((current) => current.filter((machine) => machine.id !== id));
  }

  useEffect(() => {
    persistProfileDraft({ name, avatar, bio, machineInventory, workspace });
  }, [name, avatar, bio, machineInventory, workspace]);

  return <main className="profile-screen"><section className="profile-card-large"><div className="section-kicker">FICHE PERSONNAGE · STUDIO HUB</div><h1>Construis ton atelier.</h1><p className="muted">Cette fiche reste ton identité centrale. Les studios ne demandent aucune nouvelle saisie.</p><label>Nom d’affichage<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ton nom ou nom de scène" maxLength={40} /></label><label>Présentation<textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Quelques mots sur ton atelier" maxLength={160} /></label><div className="avatar-picker"><span>Avatar</span><div>{avatars.map((item) => <button type="button" className={avatar === item ? "avatar selected" : "avatar"} key={item} onClick={() => setAvatar(item)}>{item}</button>)}</div></div><div className="machine-selection"><div><span className="section-kicker">MACHINES DÉCLARÉES</span><h2>Nommer chaque machine</h2><p className="muted">Tu peux déclarer plusieurs OP‑1 et EP‑133. Le choix 64/128 Mo est transmis automatiquement au studio.</p></div><div className="machine-inventory">{machineInventory.map((machine) => <article className={`machine-inventory-item ${machine.enabled ? "selected" : ""}`} key={machine.id}><div className="machine-inventory-fields"><label>Nom<input value={machine.name} onChange={(event) => updateMachine(machine.id, { name: event.target.value })} maxLength={40} /></label><label>Modèle<select value={machine.kind} onChange={(event) => { const kind = event.target.value as MachineId; updateMachine(machine.id, { kind, name: kind === "ep133" ? "EP‑133" : "OP‑1", capacityMb: kind === "ep133" ? machine.capacityMb ?? 64 : undefined }); }}><option value="op1">OP‑1</option><option value="ep133">EP‑133 K.O. II</option></select></label>{machine.kind === "ep133" && <label>Mémoire<select value={machine.capacityMb ?? 64} onChange={(event) => updateMachine(machine.id, { capacityMb: Number(event.target.value) as 64 | 128 })}><option value={64}>64 Mo</option><option value={128}>128 Mo</option></select></label>}</div><div className="machine-inventory-actions"><label className="machine-enabled"><input type="checkbox" checked={machine.enabled} onChange={(event) => updateMachine(machine.id, { enabled: event.target.checked })} /> Active</label><button type="button" className="text-button" onClick={() => removeMachine(machine.id)}>Supprimer</button></div></article>)}</div><div className="machine-add-actions"><button type="button" className="secondary-button" onClick={() => addMachine("op1")}>+ Ajouter un OP‑1</button><button type="button" className="secondary-button" onClick={() => addMachine("ep133")}>+ Ajouter un EP‑133</button></div></div><div className="workspace-choice"><div><span className="section-kicker">ESPACE DE TRAVAIL PARTAGÉ</span><h2>{workspace ? workspace.name : "Aucun dossier choisi"}</h2><p className="muted">Le Hub crée les dossiers communs et les zones de sauvegarde sans envoyer de fichier sur internet.</p></div><button type="button" className="secondary-button" onClick={() => void selectFolder()}>Choisir un dossier</button></div>{workspace && <div className="folder-list">{workspace.folders.map((folder) => <code key={folder}>/{folder}/</code>)}</div>}{error && <p className="error-message">{error}</p>}<div className="form-actions">{onCancel && <button className="secondary-button" onClick={onCancel}>Annuler</button>}<button className="primary-button" onClick={save}>Enregistrer la fiche <span>→</span></button></div></section></main>;
}

function Dashboard({ profile, workspaceHandle, onProfile, onWorkspaceSelected, onBackupRecorded }: { profile: HubProfile; workspaceHandle: FileSystemDirectoryHandle | null; onProfile: () => void; onWorkspaceSelected: (handle: FileSystemDirectoryHandle, name: string) => void; onBackupRecorded: (machine: MachineId) => void }) {
  const totalBackups = useMemo(() => Object.values(profile.machines).reduce((total, machine) => total + machine.backups, 0), [profile]);
  function sendWorkspace(target: Window, origin: string) {
    target.postMessage({ type: "hub:workspace", profile, workspaceHandle }, origin);
  }
  useEffect(() => {
    const onStudioReady = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== "studio:ready" || !event.source || !workspaceHandle) return;
      (event.source as Window).postMessage({ type: "hub:workspace", profile, workspaceHandle }, event.origin);
    };
    window.addEventListener("message", onStudioReady);
    return () => window.removeEventListener("message", onStudioReady);
  }, [profile, workspaceHandle]);
  function openStudio(id: MachineId, tool?: "editor" | "game") {
    persistProfile(profile);
    const launchUrl = new URL(machineCopy[id].url);
    launchUrl.searchParams.set("hubProfile", JSON.stringify(profile));
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("hubScreen", "dashboard");
    launchUrl.searchParams.set("hubReturn", returnUrl.toString());
    if (tool) launchUrl.searchParams.set("hubTool", tool);
    const declaredMachine = profile.machineInventory.find((machine) => machine.kind === id && machine.enabled);
    if (declaredMachine) {
      launchUrl.searchParams.set("hubMachineId", declaredMachine.id);
      launchUrl.searchParams.set("hubMachineName", declaredMachine.name);
      if (declaredMachine.capacityMb) launchUrl.searchParams.set("hubMachineCapacityMb", String(declaredMachine.capacityMb));
    }
    const child = window.open(launchUrl.toString(), "_blank");
    if (child && workspaceHandle) {
      const origin = new URL(machineCopy[id].url).origin;
      window.setTimeout(() => sendWorkspace(child, origin), 400);
      window.setTimeout(() => sendWorkspace(child, origin), 1200);
    }
  }
  return <main className="dashboard-screen"><header className="dashboard-header"><div><span className="brand-mark">STUDIO HUB</span><h1>Bienvenue, {profile.name} {profile.avatar}</h1></div><button className="profile-pill" onClick={onProfile}>{profile.avatar} <span>Ma fiche</span></button></header><div className="dashboard-content"><section className="dashboard-hero"><div><span className="section-kicker">TON ATELIER LOCAL</span><h2>Tout est réuni au même endroit.</h2><p className="muted">Ouvre un studio, retrouve tes sauvegardes et garde la maîtrise de tes fichiers.</p></div><div className="quick-stats"><strong>{totalBackups}</strong><span>sauvegardes suivies</span><strong>{profile.workspace?.name ?? "—"}</strong><span>espace de travail</span></div></section><section className="tools-section"><div><span className="section-kicker">HUB DES OUTILS</span><h2>Choisir un atelier</h2><p className="muted">Les outils reprennent automatiquement ta fiche et ton espace partagé.</p></div><div className="tools-grid"><article className="tool-card blue"><span className="studio-icon">🎛️</span><span className="section-kicker">MACHINE</span><h3>OP‑1 Studio</h3><p>Tape, sons, firmware, sauvegardes et éditeur d’images.</p><button className="studio-button" onClick={() => openStudio("op1")}>Ouvrir OP‑1 <span>↗</span></button></article><article className="tool-card orange"><span className="studio-icon">🥁</span><span className="section-kicker">MACHINE</span><h3>EP‑133 Studio</h3><p>Patterns, Song, sons, clone, MIDI et entraînement.</p><button className="studio-button" onClick={() => openStudio("ep133")}>Ouvrir EP‑133 <span>↗</span></button></article><article className="tool-card purple"><span className="studio-icon">🖼️</span><span className="section-kicker">CRÉATION</span><h3>Éditeur d’image</h3><p>Préparer les écrans et patches graphiques OP‑1 avec les bonnes dimensions.</p><button className="studio-button" onClick={() => openStudio("op1", "editor")}>Ouvrir l’éditeur <span>↗</span></button></article><article className="tool-card green"><span className="studio-icon">🎮</span><span className="section-kicker">JEUX</span><h3>Jeux & entraînement</h3><p>RHYTHM HERO et les modules de pratique liés à l’EP‑133.</p><button className="studio-button" onClick={() => openStudio("ep133", "game")}>Ouvrir les jeux <span>↗</span></button></article></div></section><section className="machine-grid"><div className="tools-section-heading"><span className="section-kicker">MACHINES CONFIGURÉES</span><h2>Ton inventaire</h2></div>{(Object.keys(machineCopy) as MachineId[]).filter((id) => profile.machines[id].enabled).map((id) => { const declared = profile.machineInventory.filter((machine) => machine.kind === id && machine.enabled); return <article className={`studio-card ${machineCopy[id].color}`} key={id}><span className="studio-icon">{id === "op1" ? "🎛️" : "🥁"}</span><span className="section-kicker">STUDIO {id.toUpperCase()}</span><h2>{machineCopy[id].title}</h2><p>{machineCopy[id].description}</p><div className="declared-machines"><strong>{declared.length} machine{declared.length > 1 ? "s" : ""} déclarée{declared.length > 1 ? "s" : ""}</strong><span>{declared.map((machine) => `${machine.name}${machine.kind === "ep133" ? ` · ${machine.capacityMb ?? 64} Mo` : ""}`).join(" · ")}</span></div><div className="card-stats"><span><b>{profile.machines[id].backups}</b> sauvegardes</span><span><b>{profile.machines[id].projects}</b> projets</span><span><b>{profile.machines[id].samples}</b> sons</span></div><button className="studio-button" onClick={() => openStudio(id)}>Ouvrir le studio <span>↗</span></button></article>; })}</section><section className="shared-panel"><div><span className="section-kicker">RESSOURCES PARTAGÉES</span><h2>Le coffre de l’atelier</h2><p className="muted">{profile.workspace ? `Dossier actif : ${profile.workspace.name}` : "Connecte un dossier maître pour activer les sauvegardes unifiées."}</p></div><div className="shared-links"><span>📁 Snapshots OP‑1 / EP‑133</span><span>☑️ Sauvegarde sélective par catégorie</span><span>↕️ Restauration contrôlée vers une machine</span></div><button className="secondary-button" onClick={() => document.getElementById("atelier-vault")?.scrollIntoView({ behavior: "smooth" })}>Gérer l’espace</button></section><VaultPanel workspaceHandle={workspaceHandle} onWorkspaceSelected={onWorkspaceSelected} onBackupRecorded={onBackupRecorded} /><p className="dashboard-note">Les studios restent autonomes : le Hub transmet l’identité locale et ouvre les applications. Les opérations machine sensibles restent confirmées dans chaque studio.</p></div></main>;
}
