import { useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { readProfile, DEFAULT_PROFILE_NAME, type StudioProfile } from "../core/profile";
import { VaultPanel, type MachineId } from "../VaultPanel";
import "./backup-lab.css";

type MachineRecord = {
  id?: number;
  kind: MachineId;
  name?: string;
  memory?: 64 | 128;
  active?: boolean;
};

function profileMachines(profile: StudioProfile | null, kind: MachineId): MachineRecord[] {
  if (!Array.isArray(profile?.machineInventory)) return [];
  return (profile.machineInventory as MachineRecord[]).filter((machine) => machine.kind === kind);
}

function formatDriveType(value: unknown) {
  return String(value ?? "local").replaceAll("_", " ").toUpperCase();
}

export default function BackupLab() {
  const profile = useMemo(() => readProfile(), []);
  const [machine, setMachine] = useState<MachineId>("op1");
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [workspaceName, setWorkspaceName] = useState(profile?.workspace?.name ?? "");
  const [lastBackup, setLastBackup] = useState<MachineId | null>(null);

  const machines = profileMachines(profile, machine);
  const drives = Array.isArray(profile?.drives) ? profile.drives as Array<{ name?: string; type?: string; capacityGb?: number; status?: string; active?: boolean }> : [];
  const machineSummary = profile?.machines as Record<MachineId, { enabled?: boolean }> | undefined;

  function selectMachine(next: MachineId) {
    setMachine(next);
    setLastBackup(null);
  }

  return (
    <main className="backup-lab-page">
      <TopBar activePage="backup-lab" profileName={profile?.name || DEFAULT_PROFILE_NAME} />
      <header className="backup-lab-hero">
        <div>
          <button className="backup-back-button" type="button" onClick={() => (window as any).navigateMaquette("outils")}>← RETOUR AU HUB</button>
          <span className="backup-eyebrow">ENGINEERING STUDIO · BACKUP LAB</span>
          <h1>Protéger<br /><em>l’atelier.</em></h1>
          <p>Choisis une machine, scanne son contenu, puis crée un snapshot vérifié dans ton espace local. Rien ne part sur un serveur.</p>
        </div>
        <div className="backup-profile-card">
          <div className="backup-profile-avatar">{profile?.avatar ? <img src={`/media/avatars/pixel-avatar-${profile.avatar}.webp`} alt="" /> : "◆"}</div>
          <div><small>FICHE PERSONNAGE</small><strong>{profile?.name || DEFAULT_PROFILE_NAME}</strong><span>{profile?.bio || "Aucune présentation configurée."}</span></div>
          <button type="button" onClick={() => (window as any).navigateMaquette("profil")}>MODIFIER →</button>
        </div>
      </header>

      <section className="backup-machine-picker" aria-labelledby="backup-machine-title">
        <div className="backup-section-heading"><div><span>01 · MACHINE CIBLE</span><h2 id="backup-machine-title">Quel monde veux-tu sécuriser ?</h2></div><p>Deux chemins, deux formats, un seul coffre.</p></div>
        <div className="backup-machine-grid">
          {(["op1", "ep133"] as MachineId[]).map((kind) => {
            const isOp1 = kind === "op1";
            const records = profileMachines(profile, kind);
            const enabled = machineSummary?.[kind]?.enabled || records.some((item) => item.active);
            return <button key={kind} type="button" className={`backup-machine-card ${isOp1 ? "op1" : "ep133"} ${machine === kind ? "selected" : ""}`} onClick={() => selectMachine(kind)}>
              <div className="backup-machine-card-top"><span>{isOp1 ? "OP-1" : "EP-133"}</span><small>{isOp1 ? "ORIGINAL" : "K.O. II"}</small></div>
              <div className="backup-machine-image"><img src={isOp1 ? "/media/op1.jpeg" : "/media/ep133.jpeg"} alt={isOp1 ? "OP-1" : "EP-133 K.O. II"} /></div>
              <div className="backup-machine-copy"><h3>{isOp1 ? "OP-1 Studio" : "EP-133 Studio"}</h3><p>{isOp1 ? "Tape, Album, Drum, Synth et projets du Disk Mode." : "Projets, samples, slots audio et clones lecture seule."}</p><div><strong>{records.length || (enabled ? 1 : 0)}</strong><span>{records.length > 1 ? "machines configurées" : "machine configurée"}</span><b>{machine === kind ? "SÉLECTIONNÉE" : "OUVRIR LA FICHE →"}</b></div></div>
            </button>;
          })}
        </div>
      </section>

      <section className="backup-machine-info" aria-label={`Informations ${machine.toUpperCase()}`}>
        <div className="backup-info-title"><span>02 · FICHE MACHINE</span><h2>{machine === "op1" ? "OP-1 Studio" : "EP-133 K.O. II"}</h2><p>Informations remontées de ta fiche personnage locale.</p></div>
        <div className="backup-facts">
          <div><small>IDENTITÉ LOCALE</small><strong>{machines[0]?.name || (machine === "op1" ? "OP-1 non nommée" : "EP-133 non nommé")}</strong><span>{machines.length ? `${machines.length} unité(s) dans la fiche` : "Ajoute cette machine dans Profil"}</span></div>
          <div><small>CAPACITÉ DÉCLARÉE</small><strong>{machine === "ep133" ? `${machines[0]?.memory || "—"} Mo` : "Disk Mode"}</strong><span>{machine === "ep133" ? "Mémoire de l’unité" : "Structure de fichiers machine"}</span></div>
          <div><small>ESPACE MAÎTRE</small><strong>{workspaceName || "Non connecté"}</strong><span>{workspaceHandle ? "Handle actif dans cette page" : "Le bouton Connecter ouvre le dossier local"}</span></div>
          <div><small>ÉTAT DU PROFIL</small><strong>{enabledLabel(machines, machineSummary, machine)}</strong><span>Profil stocké dans ce navigateur</span></div>
        </div>
        <div className="backup-drive-strip"><span>DRIVES DÉCLARÉS</span>{drives.length ? drives.map((drive, index) => <span className="backup-drive" key={`${drive.name}-${index}`}><b>{drive.name || `DRIVE ${index + 1}`}</b> · {formatDriveType(drive.type)} · {drive.capacityGb || "?"} Go · {drive.status || "offline"}</span>) : <em>Aucun drive déclaré dans la fiche.</em>}</div>
      </section>

      <section className="backup-engine-section" aria-labelledby="backup-engine-title">
        <div className="backup-section-heading"><div><span>03 · SCAN ET COFFRE</span><h2 id="backup-engine-title">Le coffre de {machine === "op1" ? "l’OP-1" : "l’EP-133"}</h2></div><p>Le scan lit la source. La sauvegarde écrit seulement dans le workspace.</p></div>
        <VaultPanel key={machine} initialMachine={machine} workspaceHandle={workspaceHandle} onWorkspaceSelected={(handle, name) => { setWorkspaceHandle(handle); setWorkspaceName(name); }} onBackupRecorded={(savedMachine) => setLastBackup(savedMachine)} />
        {lastBackup === machine && <div className="backup-lab-confirmation">✓ Snapshot {machine.toUpperCase()} enregistré dans le coffre local.</div>}
      </section>
    </main>
  );
}

function enabledLabel(machines: MachineRecord[], summary: Record<MachineId, { enabled?: boolean }> | undefined, kind: MachineId) {
  if (machines.some((machine) => machine.active) || summary?.[kind]?.enabled) return "ACTIVE";
  return "NON CONFIGURÉE";
}
