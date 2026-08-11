"use client";

import { useMemo, useState } from "react";

type IconName =
  | "chip"
  | "shield"
  | "archive"
  | "folder"
  | "sliders"
  | "upload"
  | "music"
  | "refresh"
  | "save"
  | "wave"
  | "tape"
  | "settings"
  | "download"
  | "check"
  | "lock"
  | "terminal"
  | "plug"
  | "book";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    chip: <><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3M10 10h4v4h-4z"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.7 8.1 7 10 4.3-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    archive: <><path d="M4 7h16v14H4zM3 3h18v4H3z"/><path d="M9 11h6"/></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 9h18"/></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
    upload: <><path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M5 20h14"/></>,
    music: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/></>,
    save: <><path d="M5 3h12l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-6h8v6"/></>,
    wave: <path d="M3 12h3l2-6 4 12 3-9 2 6h4"/>,
    tape: <><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8" cy="11" r="2.5"/><circle cx="16" cy="11" r="2.5"/><path d="m8 16 2-2h4l2 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    terminal: <><path d="m5 7 4 5-4 5M11 17h8"/></>,
    plug: <><path d="M9 2v6m6-6v6M7 8h10v3a5 5 0 0 1-5 5v5"/></>,
    book: <><path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5z"/></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type ViewKey = "firmware" | "backups" | "machine" | "sounds" | "tape";

const nav: Array<{ id: ViewKey; label: string; icon: IconName }> = [
  { id: "firmware", label: "Firmware", icon: "chip" },
  { id: "backups", label: "Sauvegardes", icon: "archive" },
  { id: "machine", label: "Machine", icon: "folder" },
  { id: "sounds", label: "Sons & patches", icon: "wave" },
  { id: "tape", label: "Tape & Album", icon: "tape" },
];

const viewCopy: Record<ViewKey, { eyebrow: string; title: string; description: string; action: string }> = {
  firmware: {
    eyebrow: "FIRMWARE / CENTRE DE CONTRÔLE",
    title: "Votre OP‑1, sous contrôle.",
    description: "Identifier, sauvegarder, vérifier et mettre à jour avec un plan lisible à chaque étape.",
    action: "Contrôler le firmware",
  },
  backups: {
    eyebrow: "COFFRE LOCAL / TIME MACHINE",
    title: "Votre machine peut revenir en arrière.",
    description: "Créez une copie complète, vérifiez chaque fichier et restaurez uniquement après validation.",
    action: "Créer une sauvegarde",
  },
  machine: {
    eyebrow: "MACHINE / REMPLISSAGE CONTRÔLÉ",
    title: "Remplir l’OP‑1 sans rien écraser par accident.",
    description: "Préparez les samples, patches, kits et morceaux, puis relisez le plan avant chaque copie.",
    action: "Préparer un transfert",
  },
  sounds: {
    eyebrow: "SAMPLES & PATCHES / ÉDITEUR LOCAL",
    title: "Construire vos sons, simplement.",
    description: "Écoutez, ajustez et exportez une copie compatible avant de l’envoyer vers la machine.",
    action: "Importer un son",
  },
  tape: {
    eyebrow: "TAPE & ALBUM / ARCHIVE",
    title: "Retrouver le morceau derrière les fichiers.",
    description: "Prévisualisez les quatre pistes et archivez le projet avec sa sauvegarde source.",
    action: "Analyser la Tape",
  },
};

const patchCatalog = [
  { name: "Dust Engine", type: "Synth patch", color: "orange", description: "Basse granuleuse · local" },
  { name: "Glass Choir", type: "Synth patch", color: "blue", description: "Texture claire · local" },
  { name: "Pocket Drums", type: "Drum kit", color: "green", description: "12 sons · local" },
];

const firmwareSteps = [
  { title: "Sauvegarde", detail: "Snapshot complet + SHA-256", color: "blue" },
  { title: "Validation", detail: "Origine, CRC et structure", color: "green" },
  { title: "TE-boot", detail: "Volume de maintenance", color: "white" },
  { title: "Installation", detail: "Copie, sync et éjection", color: "orange" },
];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>("firmware");
  const [stage, setStage] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [backupState, setBackupState] = useState<"required" | "creating" | "verified">("required");
  const [fillState, setFillState] = useState<"idle" | "planned">("idle");
  const [selectedPatch, setSelectedPatch] = useState(0);
  const [patchValues, setPatchValues] = useState({ cutoff: 62, resonance: 35, drive: 48, envelope: 20 });
  const [expertOpen, setExpertOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const logs = useMemo(() => {
    const entries = [
      ["14:32:04", "Interface sécurisée prête — aucune machine connectée"],
    ];
    if (stage >= 1) entries.push(["14:32:18", "Application locale prête — connexion USB simulée"]);
    if (stage >= 2) {
      entries.push(["14:32:21", "OP-1 original identifié — mode normal"]);
      entries.push(["14:32:22", "OS 243 lu — mise à jour 246 disponible"]);
    }
    if (stage >= 3) entries.push(["14:32:36", "Plan préparé — attente du mode TE-boot"]);
    if (backupState === "verified") entries.push(["14:33:02", "Sauvegarde vérifiée — coffre local disponible"]);
    if (fillState === "planned") entries.push(["14:33:18", "Plan de remplissage prêt — 3 éléments, aucune suppression"]);
    return entries;
  }, [backupState, fillState, stage]);

  function runPrimaryAction() {
    if (activeView === "backups") {
      if (backupState === "verified") {
        setNotice("La sauvegarde locale est déjà vérifiée. La prochaine étape sera la comparaison ou la restauration contrôlée.");
        return;
      }
      setBackupState("creating");
      setNotice("Copie simulée en cours : les fichiers seront ensuite relus et hachés.");
      window.setTimeout(() => {
        setBackupState("verified");
        setNotice("Sauvegarde vérifiée. Le firmware et le remplissage peuvent maintenant utiliser ce coffre.");
      }, 900);
      return;
    }
    if (activeView === "machine") {
      setFillState("planned");
      setNotice("Plan de remplissage simulé : 2 patches, 1 kit batterie, 0 suppression. Aucune écriture réelle.");
      return;
    }
    if (activeView === "sounds") {
      setNotice("Import simulé. La version native analysera le format, la durée et la destination avant copie.");
      return;
    }
    if (activeView === "tape") {
      setNotice("Analyse Tape simulée : les quatre pistes seront prévisualisées sans modifier la machine.");
      return;
    }
    if (stage === 0) {
      setStage(1);
      setNotice("Connexion simulée. La version application utilisera le pont Tauri/Rust pour l’accès USB réel.");
      return;
    }
    if (stage === 1) {
      setScanning(true);
      setNotice(null);
      window.setTimeout(() => {
        setStage(2);
        setScanning(false);
      }, 850);
      return;
    }
    if (stage === 2) {
      setStage(3);
      setNotice("Plan prêt. La vraie version demandera une sauvegarde vérifiée avant TE-boot.");
      return;
    }
    setNotice("Le prototype s’arrête volontairement avant toute écriture firmware.");
  }

  const primaryLabel = scanning
    ? "Contrôle en cours…"
    : activeView !== "firmware"
      ? viewCopy[activeView].action
      : stage === 0
      ? "Simuler la connexion"
      : stage === 1
        ? "Contrôler la machine"
        : stage === 2
          ? "Préparer la mise à jour"
          : "Voir l’étape TE-boot";

  const copy = viewCopy[activeView];

  return (
    <main className="site-canvas">
      <div className="prototype-ribbon">Prototype interactif · aucune écriture matérielle</div>

      <section className="machine-shell" aria-label="OP-1 Studio">
        <header className="machine-strip">
          <div className="brand-block">
            <span className="speaker-mark" aria-hidden="true">{Array.from({ length: 16 }).map((_, index) => <i key={index} />)}</span>
            <div><strong>OP-1</strong><span>STUDIO</span></div>
          </div>

          <div className="mini-screen" aria-label="État du système">
            <span className="screen-kicker">OP‑1 STUDIO / LOCAL APP</span>
            <strong>{stage >= 2 ? "OS 243 → 246" : "READY / NO DEVICE"}</strong>
            <div className="screen-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          </div>

          <div className="knob-group" aria-label="Codes couleur de progression">
            <span className="knob knob-blue"><i /></span>
            <span className="knob knob-green"><i /></span>
            <span className="knob knob-white"><i /></span>
            <span className="knob knob-orange"><i /></span>
          </div>

          <div className={`bridge-state ${stage > 0 ? "online" : ""}`}>
            <span className="state-dot" />
            <div><small>APPLICATION LOCALE</small><strong>{stage > 0 ? "PRÊTE" : "EN ATTENTE"}</strong></div>
          </div>
        </header>

        <div className="workspace">
          <aside className="sidebar">
            <nav aria-label="Navigation principale">
              <p className="nav-label">CONTRÔLE</p>
              {nav.map((item) => (
                <button
                  key={item.id}
                  className={activeView === item.id ? "nav-item active" : "nav-item"}
                  onClick={() => { setActiveView(item.id); setNotice(null); }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-spacer" />

            <button className="nav-item" onClick={() => setNotice("La documentation sera reliée au guide officiel et à chaque contrôle.")}>
              <Icon name="book" /><span>Documentation</span>
            </button>
            <button className="nav-item" onClick={() => setNotice("Les réglages restent locaux dans la version de base.")}>
              <Icon name="settings" /><span>Réglages</span>
            </button>

            <div className="plan-card">
              <span>MIT / LOCAL FIRST</span>
              <strong>Application libre</strong>
              <p>Firmware, sauvegardes, samples et patches restent utilisables hors ligne.</p>
              <button onClick={() => setNotice("Un service distant pourra venir plus tard, mais l’application ne dépendra jamais d’un abonnement.")}>Voir le principe</button>
            </div>
          </aside>

          <div className="content">
            <div className="page-heading">
              <div>
                <span className="eyebrow"><Icon name={activeView === "sounds" ? "wave" : activeView === "backups" ? "archive" : activeView === "machine" ? "folder" : "shield"} size={16} /> {copy.eyebrow}</span>
                <h1>{copy.title}</h1>
                <p>{copy.description}</p>
              </div>
              <button className="primary-action" onClick={runPrimaryAction} disabled={scanning}>
                {activeView === "backups" ? <Icon name="archive" /> : activeView === "machine" ? <Icon name="upload" /> : activeView === "sounds" ? <Icon name="upload" /> : activeView === "tape" ? <Icon name="music" /> : stage === 0 ? <Icon name="plug" /> : stage < 3 ? <Icon name="shield" /> : <Icon name="terminal" />}
                {primaryLabel}
              </button>
            </div>

            {notice && <div className="notice" role="status"><Icon name="shield" size={17} /><span>{notice}</span><button aria-label="Fermer" onClick={() => setNotice(null)}>×</button></div>}

            <section className="device-overview" aria-labelledby="machine-title">
              <div className="device-identity">
                <div className="device-icon"><Icon name="chip" size={28} /></div>
                <div>
                  <span className="section-label">MACHINE DÉTECTÉE</span>
                  <h2 id="machine-title">{stage >= 2 ? "OP‑1 original" : "En attente d’une machine"}</h2>
                  <p>{stage >= 2 ? "USB 2367:0004 · Mode normal" : "Installez le pont local puis connectez l’OP‑1 en USB."}</p>
                </div>
              </div>
              <div className="device-metrics">
                <div><span>OS ACTUEL</span><strong>{stage >= 2 ? "243" : "—"}</strong></div>
                <div><span>DERNIER OFFICIEL</span><strong>246</strong></div>
                <div><span>BATTERIE</span><strong>{stage >= 2 ? "84%" : "—"}</strong></div>
                <div><span>SAUVEGARDE</span><strong className={backupState === "verified" ? "ok" : "warn"}>{backupState === "verified" ? "VÉRIFIÉE" : "REQUISE"}</strong></div>
              </div>
            </section>

            {activeView === "firmware" && <>
            <section className="workflow-section" aria-labelledby="workflow-title">
              <div className="section-heading">
                <div><span className="section-label">PARCOURS SÉCURISÉ</span><h2 id="workflow-title">Mise à jour officielle</h2></div>
                <span className="release-pill"><i /> OS 246 · 13 DÉC. 2022</span>
              </div>

              <div className="step-grid">
                {firmwareSteps.map((step, index) => {
                  const reached = stage >= index + 2 || (index === 0 && stage >= 1);
                  const active = (index === 0 && stage === 1) || (index === 1 && stage === 2) || (index === 2 && stage === 3);
                  return (
                    <article key={step.title} className={`step-card ${reached ? "reached" : ""} ${active ? "active" : ""}`}>
                      <div className={`step-number ${step.color}`}>{reached && !active ? <Icon name="check" size={17} /> : index + 1}</div>
                      <div><h3>{step.title}</h3><p>{step.detail}</p></div>
                      <span className="step-status">{active ? "À FAIRE" : reached ? "PRÊT" : <Icon name="lock" size={14} />}</span>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="panel release-panel" aria-labelledby="release-title">
                <div className="panel-heading"><div><span className="section-label">CATALOGUE VÉRIFIÉ</span><h2 id="release-title">Firmwares</h2></div><button onClick={() => setNotice("Le catalogue officiel a été vérifié le 11 août 2026.")}>Actualiser</button></div>
                <div className="release-row selected">
                  <div className="release-radio"><i /></div>
                  <div className="release-copy"><strong>OP‑1 OS 246</strong><span>Version officielle recommandée</span></div>
                  <div className="release-meta"><span>OFFICIEL</span><small>Correction line / mic / radio</small></div>
                  <button className="icon-button" aria-label="Informations sur OS 246" onClick={() => setNotice("Le binaire ne sera téléchargé qu’à la demande depuis teenage.engineering.")}><Icon name="download" size={17} /></button>
                </div>
                <div className="release-row muted">
                  <div className="release-radio" />
                  <div className="release-copy"><strong>Firmware personnalisé</strong><span>Analyse et repack communautaire</span></div>
                  <div className="release-meta danger"><span>LABO EXPERT</span><small>Désactivé par défaut</small></div>
                  <button className="text-button" onClick={() => setExpertOpen(true)}>Comprendre</button>
                </div>
              </section>

              <section className="panel log-panel" aria-labelledby="log-title">
                <div className="panel-heading"><div><span className="section-label">JOURNAL LOCAL</span><h2 id="log-title">Session</h2></div><span className="live-dot"><i /> LOCAL</span></div>
                <div className="terminal">
                  {logs.map(([time, message]) => <p key={`${time}-${message}`}><time>{time}</time><span>{message}</span></p>)}
                  {scanning && <p className="terminal-active"><time>14:32:20</time><span>Contrôle des interfaces et du mode…</span></p>}
                </div>
              </section>
            </div>
            </>}

            {activeView === "backups" && (
              <div className="module-grid">
                <section className="panel module-panel" aria-labelledby="backup-title">
                  <div className="panel-heading"><div><span className="section-label">COFFRE LOCAL</span><h2 id="backup-title">Sauvegarde complète</h2></div><span className={`status-chip ${backupState === "verified" ? "success" : "warning"}`}>{backupState === "verified" ? "VÉRIFIÉE" : backupState === "creating" ? "EN COURS" : "REQUISE"}</span></div>
                  <div className="module-body">
                    <div className="big-status"><Icon name={backupState === "verified" ? "check" : "archive"} size={25} /><div><strong>{backupState === "verified" ? "Snapshot prêt à servir de point de retour" : "Aucun snapshot récent"}</strong><span>{backupState === "verified" ? "OP‑1 original · 184 fichiers · SHA‑256 relu" : "La sauvegarde est obligatoire avant firmware ou transfert."}</span></div></div>
                    <div className="stat-grid"><div><span>CONTENU</span><strong>184 fichiers</strong></div><div><span>TAILLE</span><strong>412 Mo</strong></div><div><span>DERNIÈRE COPIE</span><strong>{backupState === "verified" ? "À l’instant" : "Jamais"}</strong></div></div>
                    <div className="check-list"><p><Icon name="check" size={15} /> Copie locale dans le coffre</p><p><Icon name="check" size={15} /> Manifestes SHA‑256</p><p><Icon name="check" size={15} /> Restauration sous forme de plan relisible</p></div>
                  </div>
                </section>
                <section className="panel log-panel" aria-labelledby="backup-log-title">
                  <div className="panel-heading"><div><span className="section-label">JOURNAL</span><h2 id="backup-log-title">Contrôle de preuve</h2></div><span className="live-dot"><i /> LOCAL</span></div>
                  <div className="terminal"><p><time>14:30:01</time><span>Destination coffre sélectionnée</span></p><p><time>14:30:03</time><span>Préservation des fichiers inconnus</span></p><p><time>14:30:08</time><span>{backupState === "verified" ? "SHA-256 : manifeste cohérent" : "En attente d’une copie vérifiée"}</span></p></div>
                </section>
              </div>
            )}

            {activeView === "machine" && (
              <div className="module-grid machine-grid">
                <section className="panel module-panel" aria-labelledby="fill-title">
                  <div className="panel-heading"><div><span className="section-label">PLAN DE COPIE</span><h2 id="fill-title">Remplissage de la machine</h2></div><span className={`status-chip ${fillState === "planned" ? "success" : "warning"}`}>{fillState === "planned" ? "PRÊT" : "BROUILLON"}</span></div>
                  <div className="module-body">
                    <div className="transfer-summary"><div className="transfer-icon"><Icon name="upload" size={23} /></div><div><strong>Bibliothèque locale → OP‑1 original</strong><span>Le plan n’écrit rien tant qu’il n’est pas relu et confirmé.</span></div></div>
                    <div className="transfer-list"><p><span className="file-kind patch-kind">PATCH</span><strong>Dust Engine</strong><small>vers synth · remplacement contrôlé</small><Icon name="check" size={15} /></p><p><span className="file-kind patch-kind">PATCH</span><strong>Glass Choir</strong><small>vers synth · nouveau fichier</small><Icon name="check" size={15} /></p><p><span className="file-kind kit-kind">KIT</span><strong>Pocket Drums</strong><small>12 samples · nouveau kit</small><Icon name="check" size={15} /></p></div>
                    <div className="warning-line"><Icon name="shield" size={16} /> Aucun fichier existant ne sera supprimé automatiquement.</div>
                  </div>
                </section>
                <section className="panel module-panel" aria-labelledby="capacity-title">
                  <div className="panel-heading"><div><span className="section-label">INVENTAIRE</span><h2 id="capacity-title">Place et règles</h2></div><button onClick={() => setNotice("Inventaire simulé actualisé. La version native relira le volume avant chaque plan.")}><Icon name="refresh" size={14} /></button></div>
                  <div className="module-body"><div className="capacity-meter"><div><span>ESPACE UTILISÉ</span><strong>412 / 1024 Mo</strong></div><i><b /></i></div><div className="check-list"><p><Icon name="check" size={15} /> Sauvegarde vérifiée liée au plan</p><p><Icon name="check" size={15} /> Conversion audio avant copie</p><p><Icon name="check" size={15} /> Vérification après écriture</p></div><button className="secondary-action" onClick={() => setNotice("Le plan de copie est prêt à être relu. Aucune écriture réelle dans ce prototype.")}>Relire le plan</button></div>
                </section>
              </div>
            )}

            {activeView === "sounds" && (
              <div className="module-grid sounds-grid">
                <section className="panel library-panel" aria-labelledby="library-title">
                  <div className="panel-heading"><div><span className="section-label">BIBLIOTHÈQUE LOCALE</span><h2 id="library-title">Samples & patches</h2></div><button onClick={() => setNotice("Import simulé. Les formats WAV, AIFF, FLAC et MP3 seront mesurés avant conversion.")}><Icon name="upload" size={14} /> Importer</button></div>
                  <div className="patch-list">{patchCatalog.map((patch, index) => <button key={patch.name} className={`patch-row ${selectedPatch === index ? "selected" : ""}`} onClick={() => setSelectedPatch(index)}><span className={`patch-dot ${patch.color}`} /><span><strong>{patch.name}</strong><small>{patch.type} · {patch.description}</small></span><Icon name={patch.type === "Drum kit" ? "music" : "sliders"} size={16} /></button>)}</div>
                </section>
                <section className="panel editor-panel" aria-labelledby="editor-title">
                  <div className="panel-heading"><div><span className="section-label">ÉDITEUR SIMPLE</span><h2 id="editor-title">{patchCatalog[selectedPatch].name}</h2></div><span className="status-chip neutral">COPIE LOCALE</span></div>
                  <div className="module-body"><label className="field-label">Nom du patch<input value={patchCatalog[selectedPatch].name} readOnly /></label><div className="wave-preview"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="slider-list">{(["cutoff", "resonance", "drive", "envelope"] as const).map((key) => <label key={key}><span>{key === "cutoff" ? "Cutoff" : key === "resonance" ? "Résonance" : key === "drive" ? "Drive" : "Enveloppe"}<b>{patchValues[key]}%</b></span><input type="range" min="0" max="100" value={patchValues[key]} onChange={(event) => setPatchValues({ ...patchValues, [key]: Number(event.target.value) })} /></label>)}</div><div className="editor-actions"><button className="secondary-action" onClick={() => setNotice("Aperçu audio simulé : le moteur natif jouera le patch sans l’envoyer.")}><Icon name="music" size={15} /> Écouter</button><button className="primary-action compact" onClick={() => setNotice("Copie du patch préparée. Le transfert passera par une sauvegarde et un ChangePlan.")}><Icon name="save" size={15} /> Exporter la copie</button></div></div>
                </section>
              </div>
            )}

            {activeView === "tape" && (
              <section className="panel module-panel tape-panel" aria-labelledby="tape-title">
                <div className="panel-heading"><div><span className="section-label">APERÇU NON DESTRUCTIF</span><h2 id="tape-title">Tape & Album</h2></div><span className="status-chip neutral">4 PISTES</span></div>
                <div className="module-body"><div className="tape-tracks">{["Side A", "Side B", "Side C", "Side D"].map((side, index) => <div key={side}><span>{side}</span><i className={`track-wave track-${index}`}><b /><b /><b /><b /><b /><b /><b /><b /></i><small>00:00 — 06:00</small></div>)}</div><div className="warning-line"><Icon name="shield" size={16} /> La prévisualisation ne modifie jamais les fichiers de la machine.</div></div>
              </section>
            )}

            <footer className="safety-footer">
              <div><Icon name="shield" /><p><strong>L’application garde la main.</strong><span>Chaque écriture passe par une sauvegarde, un plan relisible, une synchronisation et une vérification.</span></p></div>
              <a href="https://github.com/propann/OP-1-Studio" target="_blank" rel="noreferrer">MIT · DONNÉES LOCALES · VOIR LE CODE SOURCE</a>
            </footer>
          </div>
        </div>
      </section>

      {expertOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setExpertOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="expert-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="modal-icon"><Icon name="terminal" size={25} /></span>
            <span className="section-label">ZONE À RISQUE</span>
            <h2 id="expert-title">Le Labo expert reste séparé.</h2>
            <p>Les outils de repack peuvent inspecter ou préparer un firmware modifié, mais ils ne pourront jamais écrire directement sur l’OP‑1 depuis cet écran.</p>
            <ul>
              <li>activation volontaire et avertissement persistant ;</li>
              <li>processus isolé, version épinglée et empreinte vérifiée ;</li>
              <li>export manuel marqué comme non officiel ;</li>
              <li>aucun mélange avec le catalogue Teenage Engineering.</li>
            </ul>
            <button onClick={() => setExpertOpen(false)}>J’ai compris</button>
          </section>
        </div>
      )}
    </main>
  );
}
