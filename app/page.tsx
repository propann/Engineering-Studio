"use client";

import { useMemo, useState } from "react";

type IconName =
  | "chip"
  | "shield"
  | "archive"
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

const nav = [
  { label: "Firmware", icon: "chip" as IconName, active: true },
  { label: "Sauvegardes", icon: "archive" as IconName },
  { label: "Sons", icon: "wave" as IconName },
  { label: "Tape & Album", icon: "tape" as IconName },
];

const firmwareSteps = [
  { title: "Sauvegarde", detail: "Snapshot complet + SHA-256", color: "blue" },
  { title: "Validation", detail: "Origine, CRC et structure", color: "green" },
  { title: "TE-boot", detail: "Volume de maintenance", color: "white" },
  { title: "Installation", detail: "Copie, sync et éjection", color: "orange" },
];

export default function Home() {
  const [stage, setStage] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [expertOpen, setExpertOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const logs = useMemo(() => {
    const entries = [
      ["14:32:04", "Interface sécurisée prête — aucune machine connectée"],
    ];
    if (stage >= 1) entries.push(["14:32:18", "Pont local détecté sur cette machine"]);
    if (stage >= 2) {
      entries.push(["14:32:21", "OP-1 original identifié — mode normal"]);
      entries.push(["14:32:22", "OS 243 lu — mise à jour 246 disponible"]);
    }
    if (stage >= 3) entries.push(["14:32:36", "Plan préparé — attente du mode TE-boot"]);
    return entries;
  }, [stage]);

  function runPrimaryAction() {
    if (stage === 0) {
      setStage(1);
      setNotice("Pont local simulé. Le prototype n’accède à aucun périphérique réel.");
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
    : stage === 0
      ? "Simuler la connexion"
      : stage === 1
        ? "Contrôler la machine"
        : stage === 2
          ? "Préparer la mise à jour"
          : "Voir l’étape TE-boot";

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
            <span className="screen-kicker">FIRMWARE CONTROL</span>
            <strong>{stage >= 2 ? "OS 243 → 246" : "NO DEVICE"}</strong>
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
            <div><small>PONT LOCAL</small><strong>{stage > 0 ? "SIMULÉ" : "REQUIS"}</strong></div>
          </div>
        </header>

        <div className="workspace">
          <aside className="sidebar">
            <nav aria-label="Navigation principale">
              <p className="nav-label">CONTRÔLE</p>
              {nav.map((item) => (
                <button
                  key={item.label}
                  className={item.active ? "nav-item active" : "nav-item"}
                  onClick={() => !item.active && setNotice(`${item.label} arrive après le socle firmware.`)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {!item.active && <small>BIENTÔT</small>}
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
              <span>COMMUNITY CORE</span>
              <strong>Gratuit & local</strong>
              <p>Le contrôle essentiel reste disponible sans abonnement.</p>
              <button onClick={() => setNotice("Studio Cloud ajoutera historique distant, profils et support — jamais l’accès de base à la machine.")}>Découvrir Studio Cloud</button>
            </div>
          </aside>

          <div className="content">
            <div className="page-heading">
              <div>
                <span className="eyebrow"><Icon name="shield" size={16} /> FIRMWARE / CENTRE DE CONTRÔLE</span>
                <h1>Votre OP‑1, sous contrôle.</h1>
                <p>Identifier, sauvegarder, vérifier et mettre à jour avec un plan lisible à chaque étape.</p>
              </div>
              <button className="primary-action" onClick={runPrimaryAction} disabled={scanning}>
                {stage === 0 ? <Icon name="plug" /> : stage < 3 ? <Icon name="shield" /> : <Icon name="terminal" />}
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
                <div><span>SAUVEGARDE</span><strong className={stage >= 3 ? "ok" : "warn"}>{stage >= 3 ? "VÉRIFIÉE" : "REQUISE"}</strong></div>
              </div>
            </section>

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

            <footer className="safety-footer">
              <div><Icon name="shield" /><p><strong>Le navigateur pilote l’interface.</strong><span>Le pont local signé vérifie le volume, synchronise les écritures et demande une éjection sûre.</span></p></div>
              <a href="https://github.com/propann/OP-1-Studio" target="_blank" rel="noreferrer">AGPL‑3.0 · DONNÉES LOCALES · VOIR LE CODE SOURCE</a>
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
