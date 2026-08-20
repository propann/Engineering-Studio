"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { createLogger } from "@studio-hub/audio-bridge";
import { clearProfile, readProfile, writeProfile } from "../core/profile";

const log = createLogger("Hub.ProfileCreator");

const Link = ({ href, className = "", ...props }: any) => {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (href === "/outils") (window as any).navigateMaquette("outils");
    else if (href === "/") (window as any).navigateMaquette("landing");
  };
  return <a href={"#" + href} onClick={handleClick} className={className} {...props} />;
};

type Machine = { id: number; kind: "op1" | "ep133"; name: string; memory?: 64 | 128; active: boolean };

export type DriveType = "google_drive" | "usb_drive" | "sd_card" | "local_ssd" | "dropbox" | "op1_disk";

export interface DriveModule {
  id: number;
  name: string;
  type: DriveType;
  capacityGb: number;
  mountPath: string;
  status: "mounted" | "syncing" | "offline";
  active: boolean;
}

const avatarNames = [
  "teacher", "carpenter", "artist", "barista", "support", "architect", "activist", "mail-carrier",
  "builder", "scientist", "student", "librarian", "trainer", "office-worker", "influencer", "chef",
  "courier", "grandma", "musician", "paramedic", "knight", "rogue", "smith", "archer", "scholar",
  "warrior", "goblin", "cyborg", "cat-adventurer", "pirate", "sorceress", "viking", "engineer",
  "necromancer", "ranger", "royal-guard", "fighter", "samurai", "cultist", "explorer"
] as const;

const avatarLabel = (value: string) => value.replace(/-/g, " ").toUpperCase();

// avatarNames est un tuple `as const` : son .includes() n'accepte pas un
// string generique, et ne narrow donc pas le type au passage. Ce garde fait
// les deux — il valide la valeur relue du stockage et la retypera pour
// setAvatar.
type AvatarName = (typeof avatarNames)[number];
const isAvatarName = (value: string): value is AvatarName =>
  (avatarNames as readonly string[]).includes(value);

export default function CharacterPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<(typeof avatarNames)[number]>("engineer");
  const [workspace, setWorkspace] = useState("");
  const [workspaceDirHandle, setWorkspaceDirHandle] = useState<any>(null); // File System Access API handle
  const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]); // Files in workspace
  const [language, setLanguage] = useState("FR");
  const [keyboard, setKeyboard] = useState("AZERTY");
  const [theme, setTheme] = useState("PIXEL");

  const [machines, setMachines] = useState<Machine[]>([]);


  // Drive Modules for the Studio Rack (NEW REQUIREMENT)
  const [drives, setDrives] = useState<DriveModule[]>([]);

  // Scan workspace folder for files
  const scanWorkspaceFolder = async (dirHandle: any) => {
    try {
      const files: string[] = [];
      for await (const entry of dirHandle.entries()) {
        const [name, handle] = entry;
        if (handle.kind === "file") {
          files.push(name);
        }
      }
      log.info("✅ Workspace scanned", { files: files.length });
      setWorkspaceFiles(files);
    } catch (error) {
      log.warn("Failed to scan workspace folder", error);
    }
  };

  // Sous-dossiers créés automatiquement dans le dossier choisi
  const WORKSPACE_FOLDERS = [
    "shared/sounds",
    "op1/backups",
    "op1/projects",
    "ep133/projects",
    "ep133/samples",
    "drives/cloud",
  ];

  // Ouvre le vrai sélecteur de dossier de l'OS (File System Access API).
  // Exige un contexte sécurisé : https:// ou http://localhost.
  //
  // Pas de repli sur <input webkitdirectory> : celui-ci *importe* des fichiers
  // en lecture seule, sans handle ni droit d'écriture — ce n'est pas un
  // sélecteur de dossier. Mieux vaut échouer avec un message clair.
  const pickWorkspaceFolder = async () => {
    log.info("Workspace picker triggered", {
      isSecureContext: window.isSecureContext,
      origin: window.location.origin,
    });

    if (!("showDirectoryPicker" in window)) {
      const port = window.location.port || "3000";
      const raison = !window.isSecureContext
        ? `Cause : origine non sécurisée.\n\n` +
          `➜ Ouvre https://localhost:${port}\n` +
          `   ou https://${window.location.hostname}:${port}\n\n` +
          `(Chrome affichera un avertissement de certificat auto-signé :\n` +
          ` clique "Paramètres avancés" puis "Continuer".)`
        : `Cause : navigateur sans API File System Access.\n\n` +
          `➜ Utilise Chrome, Edge ou Opera\n` +
          `   (Firefox et Safari ne l'implémentent pas).`;

      log.warn("showDirectoryPicker unavailable", {
        isSecureContext: window.isSecureContext,
        origin: window.location.origin,
      });
      alert(
        `📁 Impossible d'ouvrir le sélecteur de dossier.\n\n` +
          `Origine : ${window.location.origin}\n` +
          `Contexte sécurisé : ${window.isSecureContext ? "oui" : "NON"}\n\n` +
          raison
      );
      return;
    }

    let dirHandle: any;
    try {
      dirHandle = await (window as any).showDirectoryPicker({
        id: "studio-hub-workspace",
        mode: "readwrite",
        startIn: "documents",
      });
    } catch (error) {
      const errorName = (error as any)?.name;
      if (errorName === "AbortError") {
        log.info("User cancelled directory picker");
        return;
      }
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        alert("❌ Permission refusée. Autorise l'accès au dossier pour continuer.");
        return;
      }
      log.error("showDirectoryPicker failed", error);
      alert(`❌ Erreur lors de l'ouverture du dossier : ${(error as any)?.message ?? error}`);
      return;
    }

    log.info("Directory selected", { name: dirHandle.name });
    setWorkspace(dirHandle.name);
    setWorkspaceDirHandle(dirHandle);

    // Création des sous-dossiers (non bloquant : on signale ce qui échoue)
    const failed: string[] = [];
    for (const folder of WORKSPACE_FOLDERS) {
      let current = dirHandle;
      try {
        for (const part of folder.split("/")) {
          current = await current.getDirectoryHandle(part, { create: true });
        }
      } catch (error) {
        log.warn(`Failed to create folder ${folder}`, error);
        failed.push(folder);
      }
    }

    await scanWorkspaceFolder(dirHandle);

    if (failed.length) {
      log.warn("Workspace setup partial", { name: dirHandle.name, failed });
      alert(
        `📁 Dossier "${dirHandle.name}" connecté.\n\n` +
          `⚠️ Sous-dossiers non créés : ${failed.join(", ")}`
      );
    } else {
      log.info("Workspace setup complete", { name: dirHandle.name });
    }
  };

  const toggleWorkspace = () => {
    if (workspace) {
      // Déconnexion : purger aussi le handle et la liste, sinon saveProfile()
      // continuerait d'écrire dans un dossier que l'UI présente comme détaché.
      setWorkspace("");
      setWorkspaceDirHandle(null);
      setWorkspaceFiles([]);
    } else {
      pickWorkspaceFolder();
    }
  };

  // Load existing profile from localStorage or workspace
  const loadProfile = async (profileData: ReturnType<typeof readProfile>) => {
    try {
      if (!profileData) return;
      if (profileData.name) setName(profileData.name);
      if (profileData.bio) setBio(profileData.bio);
      if (profileData.avatar && isAvatarName(profileData.avatar)) setAvatar(profileData.avatar);
      if (profileData.workspace?.name) setWorkspace(profileData.workspace.name);
      if (Array.isArray(profileData.drives) && profileData.drives.length) setDrives(profileData.drives as DriveModule[]);
      if (Array.isArray(profileData.machineInventory) && profileData.machineInventory.length) setMachines(profileData.machineInventory as Machine[]);
      log.info("✅ Profile loaded", { name: profileData.name });
    } catch (error) {
      log.error("Failed to load profile", error);
    }
  };

  useEffect(() => {
    try {
      void loadProfile(readProfile());
    } catch (error) {
      log.warn("Failed to load from localStorage", error);
    }
  }, []);

  const progress = useMemo(
    () => 20 + (name.trim() ? 20 : 0) + (machines.some((m) => m.active) ? 20 : 0) + (drives.length ? 20 : 0) + (workspace ? 20 : 0),
    [name, machines, drives, workspace]
  );

  const avatarIndex = avatarNames.indexOf(avatar);

  function cycleAvatar(direction: -1 | 1) {
    const next = (avatarIndex + direction + avatarNames.length) % avatarNames.length;
    setAvatar(avatarNames[next]);
  }

  function updateMachine(id: number, patch: Partial<Machine>) {
    setMachines((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function addMachine(kind: Machine["kind"]) {
    setMachines((list) => [
      ...list,
      {
        id: Date.now(),
        kind,
        name: kind === "op1" ? `OP-1 ${list.filter((m) => m.kind === kind).length + 1}` : `EP-133 ${list.filter((m) => m.kind === kind).length + 1}`,
        memory: kind === "ep133" ? 64 : undefined,
        active: true,
      },
    ]);
  }

  // Drive Helpers
  function addDrive(type: DriveType) {
    const typeNames: Record<DriveType, string> = {
      google_drive: "GOOGLE DRIVE",
      usb_drive: "DISQUE USB EXTERNE",
      sd_card: "CARTE SD",
      local_ssd: "DISQUE SSD LOCAL",
      dropbox: "DROPBOX CLOUD",
      op1_disk: "DISQUE VIRTUAL OP-1",
    };
    const newDrive: DriveModule = {
      id: Date.now(),
      name: `${typeNames[type]} #${drives.length + 1}`,
      type,
      capacityGb: type === "google_drive" ? 15 : 64,
      mountPath: type === "google_drive" ? "Cloud/Drive" : `/Volumes/DRIVE_${drives.length + 1}`,
      status: "mounted",
      active: true,
    };
    setDrives((list) => [...list, newDrive]);
  }

  function updateDrive(id: number, patch: Partial<DriveModule>) {
    setDrives((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDrive(id: number) {
    setDrives((list) => list.filter((d) => d.id !== id));
  }

  async function saveProfile() {
    const active = machines.filter((machine) => machine.active);
    const summary = {
      op1: { enabled: active.some((machine) => machine.kind === "op1"), backups: 0, projects: 0, samples: 0, trainingProgress: 0 },
      ep133: { enabled: active.some((machine) => machine.kind === "ep133"), backups: 0, projects: 0, samples: 0, trainingProgress: 0 },
    };

    const profileData = {
      version: 1,
      name: name.trim(),
      avatar,
      bio: bio.trim(),
      machines: summary,
      machineInventory: machines,
      drives,
      workspace: workspace ? { name: workspace, folders: workspaceFiles } : undefined,
      savedAt: new Date().toISOString(),
    };

    // 1. Save to the local browser profile store (always)
    if (!writeProfile(profileData)) {
      alert("⚠️ Impossible d’enregistrer la fiche dans le stockage local du navigateur.");
      return;
    }
    log.info("✅ Profile saved to localStorage");

    // 2. Try to save to workspace folder (if available)
    if (workspaceDirHandle) {
      try {
        log.info("Saving profile to workspace folder...");
        const fileName = `profile_${name.replace(/\s+/g, "_").toUpperCase()}.json`;
        const fileHandle = await workspaceDirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(profileData, null, 2));
        await writable.close();

        log.info("✅ Profile saved to workspace folder", { fileName });
        alert(`✅ Fiche enregistrée!\n\nNom: ${name}\nDossier: ${workspace}\nFichier: ${fileName}`);

        // Refresh file list
        await scanWorkspaceFolder(workspaceDirHandle);
      } catch (error) {
        log.error("❌ Failed to save profile to workspace", error);
        alert(`⚠️ Profil sauvegardé en local, mais pas dans le dossier.\n\nErreur: ${(error as any)?.message}`);
      }
    } else {
      log.info("No workspace handle available, profile saved to localStorage only");
      alert(`✅ Fiche enregistrée en local!\n\nNom: ${name}\n\nℹ️ Choisir un dossier de sauvegarde pour enregistrer dans le système de fichiers.`);
    }
  }

  function clearLocalProfile() {
    if (!window.confirm("Supprimer la fiche locale de ce navigateur ? Le fichier déjà écrit dans le dossier restera intact.")) return;
    clearProfile();
    setName("");
    setBio("");
    setWorkspace("");
    setWorkspaceDirHandle(null);
    setWorkspaceFiles([]);
    setMachines([]);
    setDrives([]);
  }

  return (
    <main className="creator-page">
      <TopBar activePage="profil" profileName={name} />
      <div className="creator-progress">
        <span style={{ width: `${progress}%` }} />
        <b>{progress}% · ATELIER CONFIGURÉ</b>
      </div>

      <section className="creator-layout">
        <aside className="player-panel">
          <div className="panel-label">PLAYER_01 / APERÇU FICHE</div>
          <div className="pixel-avatar">
            <img src={`/media/avatars/pixel-avatar-${avatar}.webp`} alt={`Avatar ${avatarLabel(avatar)}`} width="640" height="560" />
            <div className="avatar-role">
              <span>CLASS</span>
              <b>{avatarLabel(avatar)}</b>
            </div>
          </div>
          <div className="player-card">
            <small>CRÉATEUR LOCAL</small>
            <h1>{name || "SANS NOM"}</h1>
            <p>{bio || "Écris quelques mots sur ton atelier."}</p>
            <div className="player-stats">
              <span><b>{machines.filter((m) => m.active).length}</b>MACHINES</span>
              <span><b>{drives.filter((d) => d.active).length}</b>DRIVES</span>
              <span><b>{workspace ? "ON" : "OFF"}</b>WORKSPACE</span>
            </div>
          </div>
          <div className="privacy-chip"><i /> PROFIL LOCAL · AUCUN COMPTE</div>
        </aside>

        <div className="creator-console">
          <div className="quest-head"><span>CONFIGURATION PRINCIPALE & DRIVES</span><b>5 ÉTAPES</b></div>

          {/* BLOCK 01: IDENTITY */}
          <section className="creator-block identity-block">
            <div className="block-number">01</div>
            <div className="block-content">
              <div className="block-title">
                <span>IDENTITÉ</span>
                <small>QUI PILOTE L’ATELIER ?</small>
              </div>
              <div className="field-grid">
                <label>
                  PSEUDO
                  <input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} maxLength={40} />
                </label>
                <label className="wide">
                  PRÉSENTATION
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
                  <small>{bio.length}/160</small>
                </label>
              </div>
              <div className="avatar-carousel">
                <span>CHOISIR UN AVATAR</span>
                <div className="avatar-carousel-control">
                  <button onClick={() => cycleAvatar(-1)} aria-label="Avatar précédent">←</button>
                  <div className="avatar-current">
                    <img src={`/media/avatars/pixel-avatar-${avatar}.webp`} alt={`Avatar ${avatarLabel(avatar)}`} width="320" height="280" />
                    <div>
                      <small>{String(avatarIndex + 1).padStart(2, "0")} / 40</small>
                      <strong>{avatarLabel(avatar)}</strong>
                    </div>
                  </div>
                  <button onClick={() => cycleAvatar(1)} aria-label="Avatar suivant">→</button>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCK 02: MACHINES */}
          <section className="creator-block">
            <div className="block-number">02</div>
            <div className="block-content">
              <div className="block-title">
                <span>ÉQUIPEMENT</span>
                <small>NOMME TES MACHINES</small>
              </div>
              <div className="loadout-list">
                {machines.map((machine) => (
                  <article className={`loadout ${machine.kind} ${machine.active ? "active" : ""}`} key={machine.id}>
                    <button className="power" onClick={() => updateMachine(machine.id, { active: !machine.active })}><i /></button>
                    <div className="machine-pixel">
                      {machine.kind === "op1" ? (
                        <div className="mini-op"><i /><i /><i /><i /></div>
                      ) : (
                        <div className="mini-ko">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
                      )}
                    </div>
                    <label>
                      NOM
                      <input value={machine.name} onChange={(e) => updateMachine(machine.id, { name: e.target.value })} />
                    </label>
                    <label>
                      MODÈLE
                      <select value={machine.kind} onChange={(e) => {
                        const kind = e.target.value as Machine["kind"];
                        updateMachine(machine.id, { kind, memory: kind === "ep133" ? 64 : undefined });
                      }}>
                        <option value="op1">OP-1</option>
                        <option value="ep133">EP-133 K.O. II</option>
                      </select>
                    </label>
                    {machine.kind === "ep133" && (
                      <label>
                        MÉMOIRE
                        <select value={machine.memory || 64} onChange={(e) => updateMachine(machine.id, { memory: Number(e.target.value) as 64 | 128 })}>
                          <option value="64">64 MB (Standard)</option>
                          <option value="128">128 MB (Extended)</option>
                        </select>
                      </label>
                    )}
                    <button className="remove-machine" onClick={() => setMachines((list) => list.filter((m) => m.id !== machine.id))}>×</button>
                  </article>
                ))}
              </div>
              <div className="add-machine">
                <button onClick={() => addMachine("op1")}>+ AJOUTER OP-1</button>
                <button onClick={() => addMachine("ep133")}>+ AJOUTER EP-133</button>
              </div>
            </div>
          </section>

          {/* BLOCK 03: MODULE RACK DRIVES & CLOUD STORAGE (NEW REQUIREMENT) */}
          <section className="creator-block drive-rack-block">
            <div className="block-number">03</div>
            <div className="block-content">
              <div className="block-title">
                <span>MODULE RACK : LECTEURS & DRIVES</span>
                <small>DISQUES CLOUD, GOOGLE DRIVE ET CARTES USB CONNECTÉS</small>
              </div>

              <div className="drives-rack-list">
                {drives.map((d) => (
                  <article className={`drive-rack-item ${d.active ? "drive-online" : "drive-offline"}`} key={d.id}>
                    <div className="drive-head-status">
                      <button className="drive-power-btn" onClick={() => updateDrive(d.id, { active: !d.active })}>
                        <span className={`status-led ${d.active ? "led-green" : "led-red"}`} />
                      </button>
                      <span className="drive-type-badge">{d.type.toUpperCase().replace("_", " ")}</span>
                    </div>

                    <div className="drive-fields-row">
                      <label className="drive-field-name">
                        NOM DU DRIVE
                        <input value={d.name} onChange={(e) => updateDrive(d.id, { name: e.target.value })} />
                      </label>

                      <label className="drive-field-path">
                        CHEMIN / MOUNT
                        <input value={d.mountPath} onChange={(e) => updateDrive(d.id, { mountPath: e.target.value })} />
                      </label>

                      <label className="drive-field-cap">
                        CAPACITÉ
                        <select value={d.capacityGb} onChange={(e) => updateDrive(d.id, { capacityGb: Number(e.target.value) })}>
                          <option value="15">15 Go (Drive Free)</option>
                          <option value="32">32 Go (USB/SD)</option>
                          <option value="64">64 Go (SD PRO)</option>
                          <option value="100">100 Go (Google One)</option>
                          <option value="500">500 Go (SSD)</option>
                          <option value="1000">1 To (Storage Studio)</option>
                        </select>
                      </label>

                      <button className="remove-drive-btn" onClick={() => removeDrive(d.id)} title="Retirer ce drive">✕</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="add-drive-actions-bar">
                <span>➕ AJOUTER UN DRIVE AU RACK :</span>
                <button type="button" onClick={() => addDrive("google_drive")}>+ GOOGLE DRIVE</button>
                <button type="button" onClick={() => addDrive("usb_drive")}>+ CLÉ USB</button>
                <button type="button" onClick={() => addDrive("sd_card")}>+ CARTE SD</button>
                <button type="button" onClick={() => addDrive("local_ssd")}>+ SSD LOCAL</button>
              </div>
            </div>
          </section>

          {/* BLOCK 04: WORKSPACE */}
          <section className="creator-block">
            <div className="block-number">04</div>
            <div className="block-content">
              <div className="block-title">
                <span>BASE LOCALE</span>
                <small>DOSSIER MAÎTRE ET RACK DE STOCKAGE</small>
              </div>
              <div className={`workspace-slot ${workspace ? "connected" : ""}`}>
                <div className="pixel-folder"><i /><b /></div>
                <div>
                  <small>ESPACE DE TRAVAIL PARTAGÉ</small>
                  <strong>{workspace || "AUCUN DOSSIER CONNECTÉ"}</strong>
                  <p>Sons, thèmes et projets sauvegardés en local.</p>
                </div>
                <button onClick={toggleWorkspace}>{workspace ? "CHANGER DOSSIER" : "CHOISIR UN DOSSIER"}</button>
              </div>

              {/* Show files in workspace */}
              {workspace && workspaceFiles.length > 0 && (
                <div className="workspace-files-list">
                  <small>FICHIERS SAUVEGARDÉS ({workspaceFiles.length})</small>
                  <ul>
                    {workspaceFiles.map((file, idx) => (
                      <li key={idx}>
                        📄 {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {workspace && workspaceFiles.length === 0 && (
                <div className="workspace-empty">
                  <small>DOSSIER VIDE · AUCUNE SAUVEGARDE</small>
                </div>
              )}
            </div>
          </section>

          {/* BLOCK 05: PREFERENCES */}
          <section className="creator-block">
            <div className="block-number">05</div>
            <div className="block-content">
              <div className="block-title">
                <span>RÉGLAGES JOUEUR</span>
                <small>PRÉFÉRENCES LOCALES</small>
              </div>
              <div className="settings-row">
                <Choice label="LANGUE" value={language} choices={["FR", "EN"]} onChange={setLanguage} />
                <Choice label="CLAVIER" value={keyboard} choices={["AZERTY", "QWERTY"]} onChange={setKeyboard} />
                <Choice label="THÈME" value={theme} choices={["PIXEL", "LIGHT"]} onChange={setTheme} />
              </div>
            </div>
          </section>

          <div className="creator-actions">
            <Link href="/">ANNULER</Link>
            <button type="button" className="reset-profile-link" onClick={clearLocalProfile}>
              SUPPRIMER LA FICHE LOCALE
            </button>
            <Link className="save-profile-link" href="/outils" onClick={saveProfile}>
              ENREGISTRER MA FICHE <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Choice({ label, value, choices, onChange }: { label: string; value: string; choices: string[]; onChange: (v: string) => void }) {
  return (
    <div className="choice">
      <span>{label}</span>
      <div>
        {choices.map((item) => (
          <button key={item} className={item === value ? "active" : ""} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
