"use client";

import React, { useState, useEffect } from "react";

export interface GitCommit {
  id: string;
  hash: string;
  author: string;
  message: string;
  timestamp: number;
  branch: string;
  tracksCount: number;
  engine: string;
  patch: string;
  bpm: number;
}

export interface SharedProject {
  id: string;
  title: string;
  author: string;
  description: string;
  tags: string[];
  bpm: number;
  key: string;
  likes: number;
  tracksCount: number;
  engine: string;
  patch: string;
  downloadUrl?: string;
}

interface StudioGitWorkspaceProps {
  currentEngine: string;
  currentPatch: string;
  bpm: number;
  tracksInfo: { [key: number]: string };
  onLoadSharedProject?: (project: SharedProject) => void;
  onNotice?: (msg: string) => void;
  onClose: () => void;
}

const DEFAULT_COMMITS: GitCommit[] = [
  {
    id: "c1",
    hash: "a9f3b12",
    author: "Lead Architect",
    message: "Init: Architecture 4 pistes OP-1 + 20 moteurs audio connectés",
    timestamp: Date.now() - 3600000 * 5,
    branch: "main",
    tracksCount: 4,
    engine: "mi_plaits",
    patch: "Virtual Analog Saw Lead",
    bpm: 120,
  },
  {
    id: "c2",
    hash: "d4c8e71",
    author: "Sound Designer",
    message: "Patch: Nappe Plaits + Basse Open303 Acid mixées sur piste 1 & 2",
    timestamp: Date.now() - 3600000 * 2,
    branch: "main",
    tracksCount: 2,
    engine: "open303",
    patch: "Square Acid Sub Bass",
    bpm: 124,
  },
  {
    id: "c3",
    hash: "f82b09a",
    author: "Collab Producer",
    message: "Feat: Enregistrement Drum kit 808 et modulation granulaire Clouds",
    timestamp: Date.now() - 1800000,
    branch: "collab",
    tracksCount: 3,
    engine: "mi_clouds",
    patch: "Granular Ether Cloud",
    bpm: 120,
  },
];

const COMMUNITY_PROJECTS: SharedProject[] = [
  {
    id: "proj_cyber_acid",
    title: "Cyber Acid Odyssey 128",
    author: "NeonGrid",
    description: "Session Acid Techno complète : 303 résonante, 909 punchy, granular lead et nappes Solina.",
    tags: ["Acid", "Techno", "Open303", "Solina"],
    bpm: 128,
    key: "F# min",
    likes: 142,
    tracksCount: 4,
    engine: "open303",
    patch: "Acid 303 Resonance Lead",
  },
  {
    id: "proj_lofi_midnight",
    title: "Midnight Lo-Fi Tape Beats",
    author: "TapeMaster",
    description: "Beat chillwave lo-fi enregistré sur cassette 4 pistes avec Rhodes SF2 et sub percutante.",
    tags: ["Lo-Fi", "Tape", "Rhodes", "Chill"],
    bpm: 84,
    key: "C Maj",
    likes: 98,
    tracksCount: 4,
    engine: "fluidsynth",
    patch: "Stage Rhodes EP SF2",
  },
  {
    id: "proj_modular_ambient",
    title: "Mutable Modular Dreams",
    author: "EurorackWizard",
    description: "Voyage spatial génératif avec Plaits, Rings et Clouds en modulation croisée continue.",
    tags: ["Ambient", "Modular", "Plaits", "Clouds"],
    bpm: 70,
    key: "A min",
    likes: 210,
    tracksCount: 3,
    engine: "mi_rings",
    patch: "Modal Acoustic String",
  },
  {
    id: "proj_chiptune_boss",
    title: "8-Bit Boss Battle Arena",
    author: "PixelHero",
    description: "Arpèges rapides GameBoy DMG-01 et bruits de bitcrush pour jeux vidéo rétro arcade.",
    tags: ["Chiptune", "8-Bit", "GameBoy", "Retro"],
    bpm: 140,
    key: "E min",
    likes: 76,
    tracksCount: 4,
    engine: "pl_synth",
    patch: "GameBoy 8-Bit Lead",
  },
];

export function StudioGitWorkspace({
  currentEngine,
  currentPatch,
  bpm,
  tracksInfo,
  onLoadSharedProject,
  onNotice,
  onClose,
}: StudioGitWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"git_commits" | "shared_gallery" | "export_unified">("git_commits");
  const [commits, setCommits] = useState<GitCommit[]>(() => {
    try {
      const stored = localStorage.getItem("op1_git_commits");
      return stored ? JSON.parse(stored) : DEFAULT_COMMITS;
    } catch {
      return DEFAULT_COMMITS;
    }
  });

  const [activeBranch, setActiveBranch] = useState<string>("main");
  const [commitMessage, setCommitMessage] = useState("");
  const [authorName, setAuthorName] = useState("Studio Producer");

  const saveCommits = (newCommits: GitCommit[]) => {
    setCommits(newCommits);
    try {
      localStorage.setItem("op1_git_commits", JSON.stringify(newCommits));
    } catch {}
  };

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const newCommit: GitCommit = {
      id: `c_${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 9),
      author: authorName.trim() || "Studio Producer",
      message: commitMessage.trim(),
      timestamp: Date.now(),
      branch: activeBranch,
      tracksCount: Object.values(tracksInfo).filter(Boolean).length || 1,
      engine: currentEngine,
      patch: currentPatch,
      bpm: bpm,
    };

    const updated = [newCommit, ...commits];
    saveCommits(updated);
    setCommitMessage("");
    onNotice?.(`Commit [${newCommit.hash}] "${newCommit.message}" sauvegardé dans le Git Studio !`);
  };

  const handleExportUnifiedProject = () => {
    const projectData = {
      version: "2.4.0",
      format: "op1-unified-studio-project",
      timestamp: new Date().toISOString(),
      metadata: {
        engine: currentEngine,
        patch: currentPatch,
        bpm: bpm,
        tracks: tracksInfo,
        branch: activeBranch,
      },
      commitsCount: commits.length,
      commits: commits,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `op1-project-${activeBranch}-${Date.now()}.op1proj.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotice?.("Projet unifié .op1proj exporté avec succès !");
  };

  return (
    <div
      className="studio-git-workspace-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Entête du Hub Git & Projets Partagés ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e293b",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f97316, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "18px",
            }}
          >
            🐙
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
              ESPACE GIT & CRÉATIONS PARTAGÉES STUDIO
            </h2>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
              Historique des commits, gestion des branches et créations audio collaboratives
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleExportUnifiedProject}
            style={{
              padding: "6px 12px",
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid #f97316",
              color: "#fb923c",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📦 Exporter Projet Unifié (.op1proj)
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ── Onglets de Navigation ── */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("git_commits")}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "11.5px",
            fontWeight: 700,
            border: activeTab === "git_commits" ? "1px solid #f97316" : "1px solid transparent",
            background: activeTab === "git_commits" ? "rgba(249, 115, 22, 0.2)" : "transparent",
            color: activeTab === "git_commits" ? "#fb923c" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          🗂️ Dossier Git & Commits ({commits.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shared_gallery")}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "11.5px",
            fontWeight: 700,
            border: activeTab === "shared_gallery" ? "1px solid #00ED95" : "1px solid transparent",
            background: activeTab === "shared_gallery" ? "rgba(0, 237, 149, 0.2)" : "transparent",
            color: activeTab === "shared_gallery" ? "#86efac" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          🌐 Créations Partagées Communauté ({COMMUNITY_PROJECTS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("export_unified")}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "11.5px",
            fontWeight: 700,
            border: activeTab === "export_unified" ? "1px solid #698EFF" : "1px solid transparent",
            background: activeTab === "export_unified" ? "rgba(105, 142, 255, 0.2)" : "transparent",
            color: activeTab === "export_unified" ? "#93c5fd" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          💾 Sauvegarde Unifiée & Restauration
        </button>
      </div>

      {/* ── Onglet 1 : Dossier Git & Commits ── */}
      {activeTab === "git_commits" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "12px" }}>
          {/* Formulaire de nouveau commit */}
          <div
            style={{
              background: "#090d16",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <strong style={{ fontSize: "12px", color: "#f97316" }}>NOUVEAU COMMIT STUDIO</strong>
            <form onSubmit={handleCreateCommit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>
                  Branche Git :
                </label>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["main", "collab", "remix"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setActiveBranch(b)}
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        border: activeBranch === b ? "1px solid #f97316" : "1px solid #334155",
                        background: activeBranch === b ? "rgba(249, 115, 22, 0.2)" : "#1e293b",
                        color: activeBranch === b ? "#fb923c" : "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>
                  Auteur :
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "11px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>
                  Message de commit :
                </label>
                <textarea
                  rows={3}
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Ex: Enregistrement du solo de synthé et ajout du chorus..."
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "11px",
                    resize: "none",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "9.5px",
                  color: "#64748b",
                  background: "#111827",
                  padding: "6px 8px",
                  borderRadius: "4px",
                }}
              >
                État actuel capturé : {currentEngine} · {currentPatch} · {bpm} BPM
              </div>

              <button
                type="submit"
                style={{
                  padding: "8px",
                  background: "#f97316",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                ✓ Valider le Commit Git
              </button>
            </form>
          </div>

          {/* Liste chronologique des commits */}
          <div
            style={{
              background: "#090d16",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "360px",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", borderBottom: "1px solid #1e293b", paddingBottom: "6px" }}>
              <span>ARBRE DE COMMITS · BRANCHE [{activeBranch.toUpperCase()}]</span>
              <span>{commits.length} RÉVISIONS</span>
            </div>

            {commits.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <code
                      style={{
                        background: "#1e293b",
                        color: "#f97316",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {c.hash}
                    </code>
                    <strong style={{ fontSize: "11.5px", color: "#e2e8f0" }}>{c.message}</strong>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                    Par {c.author} · {new Date(c.timestamp).toLocaleTimeString()} · Branche: {c.branch} · {c.engine} ({c.patch}) · {c.bpm} BPM
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onNotice?.(`Restauration vers le commit [${c.hash}] effectuée.`);
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    color: "#93c5fd",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Checkout
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Onglet 2 : Galerie des Créations Partagées ── */}
      {activeTab === "shared_gallery" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {COMMUNITY_PROJECTS.map((proj) => (
            <div
              key={proj.id}
              style={{
                background: "#090d16",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#ffffff" }}>{proj.title}</strong>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>Par {proj.author} · {proj.key} · {proj.bpm} BPM</div>
                </div>
                <div style={{ fontSize: "10px", color: "#ec4899", fontWeight: 700 }}>
                  ❤️ {proj.likes}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: "10.5px", color: "#cbd5e1", lineHeight: 1.4 }}>
                {proj.description}
              </p>

              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {proj.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "9px",
                      background: "#1e293b",
                      color: "#94a3b8",
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e293b", paddingTop: "8px" }}>
                <span style={{ fontSize: "9.5px", color: "#64748b" }}>
                  Moteur: {proj.engine} ({proj.patch})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSharedProject?.(proj);
                    onNotice?.(`Projet "${proj.title}" chargé dans l'OP-1 Studio !`);
                  }}
                  style={{
                    padding: "5px 12px",
                    background: "rgba(0, 237, 149, 0.15)",
                    border: "1px solid #00ED95",
                    color: "#00ED95",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ⚡ Charger dans le Studio
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Onglet 3 : Sauvegarde Unifiée ── */}
      {activeTab === "export_unified" && (
        <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <strong style={{ fontSize: "13px", color: "#698EFF" }}>
            SYSTÈME DE SAUVEGARDE UNIFIÉE DU STUDIO
          </strong>
          <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", lineHeight: 1.5 }}>
            Le format unifié regroupe en un seul fichier JSON ou bundle Git l&apos;intégralité de la configuration :
            les 4 pistes magnétiques du Tape, les 20 moteurs sonores, les paramètres des 4 potentiomètres couleur,
            la grille du séquenceur, le tempo BPM et l&apos;historique complet des versions.
          </p>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleExportUnifiedProject}
              style={{
                flex: 1,
                padding: "12px",
                background: "linear-gradient(135deg, #2563eb, #38bdf8)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              📥 Télécharger l&apos;Archive Complète du Studio (.op1proj)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
