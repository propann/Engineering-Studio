import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { readProfile, DEFAULT_PROFILE_NAME, type StudioProfile } from "../core/profile";
import { loadDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";
import { VaultPanel, type MachineId } from "../VaultPanel";
import "./backup-lab.css";

type MachineRecord = { id?: number; kind: MachineId; name?: string; memory?: 64 | 128; active?: boolean };
type DriveRecord = { name?: string; type?: string; capacityGb?: number; status?: string; active?: boolean };

function profileMachines(profile: StudioProfile | null, kind: MachineId): MachineRecord[] {
  if (!Array.isArray(profile?.machineInventory)) return [];
  return (profile.machineInventory as MachineRecord[]).filter((machine) => machine.kind === kind);
}

function formatDriveType(value: unknown) {
  return String(value ?? "local").replaceAll("_", " ").toUpperCase();
}

export default function BackupLab() {
  const profile = useMemo(() => readProfile(), []);
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [workspaceName, setWorkspaceName] = useState(profile?.workspace?.name ?? "");
  const [lastBackup, setLastBackup] = useState<MachineId | null>(null);
  const drives = Array.isArray(profile?.drives) ? profile.drives as DriveRecord[] : [];
  const machineSummary = profile?.machines as Record<MachineId, { enabled?: boolean }> | undefined;

  useEffect(() => {
    void loadDirectoryHandle(WORKSPACE_HANDLE_KEY).then((handle) => {
      if (!handle) return;
      setWorkspaceHandle(handle);
      setWorkspaceName(handle.name);
    });
  }, []);

  return (
    <main className="backup-lab-page">
      <TopBar activePage="backup-lab" profileName={profile?.name || DEFAULT_PROFILE_NAME} />
      <header className="backup-lab-hero">
        <div>
          <button className="backup-back-button" type="button" onClick={() => (window as any).navigateMaquette("outils")}>← RETOUR AU HUB</button>
          <span className="backup-eyebrow">ENGINEERING STUDIO · BACKUP LAB</span>
          <h1>Sauvegarder<br /><em>l’atelier.</em></h1>
          <p>Une page unique pour protéger les deux machines. Choisis les dossiers, lance le scan, puis écris un snapshot vérifié dans ton espace local.</p>
        </div>
        <div className="backup-profile-card">
          <div className="backup-profile-avatar">{profile?.avatar ? <img src={`/media/avatars/pixel-avatar-${profile.avatar}.webp`} alt="" /> : "◆"}</div>
          <div><small>FICHE PERSONNAGE</small><strong>{profile?.name || DEFAULT_PROFILE_NAME}</strong><span>{profile?.bio || "Aucune présentation configurée."}</span></div>
          <button type="button" onClick={() => (window as any).navigateMaquette("profil")}>MODIFIER →</button>
        </div>
      </header>

      <section className="backup-workspace-summary" aria-label="Gestion du dossier de sauvegarde">
        <div><span>ESPACE DE SAUVEGARDE CENTRAL</span><strong>{workspaceName || "Aucun dossier connecté"}</strong><small>{workspaceHandle ? "Dossier prêt pour les deux machines" : "Connecte le dossier depuis la colonne OP‑1 : il sera partagé avec EP‑133"}</small></div>
        <div className="backup-workspace-tree"><b>ARBORESCENCE</b><span>op1/backups</span><span>ep133/backups</span><span>shared/sounds</span></div>
      </section>

      <section className="backup-columns-section" aria-labelledby="backup-columns-title">
        <div className="backup-section-heading"><div><span>01 · DEUX MACHINES · UN COFFRE</span><h2 id="backup-columns-title">Choisis ce que tu veux sauver</h2></div><p>Les colonnes sont indépendantes. Une machine peut être sauvegardée sans toucher à l’autre.</p></div>
        <div className="backup-machine-columns">
          <BackupMachineColumn kind="op1" profileMachines={profileMachines(profile, "op1")} enabled={Boolean(machineSummary?.op1?.enabled)} workspaceHandle={workspaceHandle} onWorkspaceSelected={(handle, name) => { setWorkspaceHandle(handle); setWorkspaceName(name); }} onBackupRecorded={setLastBackup} showWorkspace />
          <BackupMachineColumn kind="ep133" profileMachines={profileMachines(profile, "ep133")} enabled={Boolean(machineSummary?.ep133?.enabled)} workspaceHandle={workspaceHandle} onWorkspaceSelected={(handle, name) => { setWorkspaceHandle(handle); setWorkspaceName(name); }} onBackupRecorded={setLastBackup} />
        </div>
        {lastBackup && <div className="backup-lab-confirmation">✓ Dernier snapshot enregistré : {lastBackup.toUpperCase()} · les deux colonnes restent disponibles.</div>}
      </section>

      <section className="backup-profile-data" aria-label="Informations de la fiche personnage">
        <div className="backup-section-heading"><div><span>02 · INFORMATIONS LOCALES</span><h2>Ce que la fiche apporte</h2></div><p>Ces informations viennent du navigateur et ne sont jamais envoyées au serveur.</p></div>
        <div className="backup-facts"><Fact label="IDENTITÉ" value={profile?.name || DEFAULT_PROFILE_NAME} note={profile?.bio || "Aucune présentation"} /><Fact label="WORKSPACE" value={workspaceName || "Non connecté"} note={workspaceHandle ? "Handle actif" : "À connecter"} /><Fact label="MACHINES" value={`${profileMachines(profile, "op1").length + profileMachines(profile, "ep133").length}`} note="Unités déclarées" /><Fact label="DRIVES" value={`${drives.length}`} note="Supports déclarés" /></div>
        <div className="backup-drive-strip"><span>DRIVES DÉCLARÉS</span>{drives.length ? drives.map((drive, index) => <span className="backup-drive" key={`${drive.name}-${index}`}><b>{drive.name || `DRIVE ${index + 1}`}</b> · {formatDriveType(drive.type)} · {drive.capacityGb || "?"} Go · {drive.status || "offline"}</span>) : <em>Aucun drive déclaré dans la fiche.</em>}</div>
      </section>
    </main>
  );
}

function BackupMachineColumn({ kind, profileMachines: machines, enabled, workspaceHandle, onWorkspaceSelected, onBackupRecorded, showWorkspace = false }: { kind: MachineId; profileMachines: MachineRecord[]; enabled: boolean; workspaceHandle: FileSystemDirectoryHandle | null; onWorkspaceSelected: (handle: FileSystemDirectoryHandle, name: string) => void; onBackupRecorded: (machine: MachineId) => void; showWorkspace?: boolean }) {
  const isOp1 = kind === "op1";
  return <article className={`backup-machine-column ${isOp1 ? "op1" : "ep133"}`}>
    <header className="backup-column-head"><div className="backup-column-title"><span>{isOp1 ? "OP-1" : "EP-133"}</span><small>{isOp1 ? "ORIGINAL · DISK MODE" : "K.O. II · PROJECTS + SAMPLES"}</small></div><div className="backup-column-image"><img src={isOp1 ? "/media/op1.jpeg" : "/media/ep133.jpeg"} alt={isOp1 ? "OP-1" : "EP-133 K.O. II"} /></div><h3>{isOp1 ? "Sauvegarde OP-1" : "Sauvegarde EP-133"}</h3><p>{isOp1 ? "Tape, Album, Drum et Synth : coche uniquement ce que tu veux archiver." : "Projets et samples : prépare un clone local sans écrire sur la machine."}</p><div className="backup-column-meta"><strong>{machines[0]?.name || (isOp1 ? "OP-1 non nommée" : "EP-133 non nommé")}</strong><span>{machines.length ? "Fiche configurée" : enabled ? "Activée dans le profil" : "À configurer dans Profil"}</span></div></header>
    <VaultPanel key={kind} initialMachine={kind} compact showWorkspace={showWorkspace} workspaceHandle={workspaceHandle} onWorkspaceSelected={onWorkspaceSelected} onBackupRecorded={onBackupRecorded} />
  </article>;
}

function Fact({ label, value, note }: { label: string; value: string; note: string }) {
  return <div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>;
}
