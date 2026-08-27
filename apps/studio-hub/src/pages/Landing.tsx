"use client";
import React, { useEffect, useState } from "react";
import { readProfileName } from "../core/profile";
import { AppShell, Button, Card, PageHeader, StatusBadge } from "../ui";

export default function Home() {
  const [profileName, setProfileName] = useState("NOUVEAU MEMBRE");

  useEffect(() => {
    setProfileName(readProfileName());
  }, []);

  const openTool = (toolId: string) => {
    if (toolId === "op1") (window as any).navigateMaquette("studio-op1");
    else if (toolId === "ep133") (window as any).navigateMaquette("studio-ep133");
    else if (toolId === "sounds") (window as any).navigateMaquette("sound-library");
    else if (toolId === "strudel") (window as any).navigateMaquette("strudel-studio");
    else if (toolId === "collab") (window as any).navigateMaquette("collab");
    else if (toolId === "labo") (window as any).navigateMaquette("labo");
    else if (toolId === "visual") (window as any).navigateMaquette("image-editor-op1");
    else if (toolId === "profil") (window as any).navigateMaquette("profil");
    else if (toolId === "backup") (window as any).navigateMaquette("backup-lab");
    else if (toolId === "training") (window as any).navigateMaquette("exercises");
    else if (toolId === "rhythm-hero") (window as any).navigateMaquette("rhythm-hero");
    else if (toolId === "settings") (window as any).navigateMaquette("midi-settings");
    else (window as any).navigateMaquette("outils");
  };

  return (
    <AppShell activePage="landing" profileName={profileName} className="landing-v2">
      <details className="landing-test-alert">
        <summary>
          <StatusBadge tone="danger">Écriture machine non validée</StatusBadge>
          <span>Serveur public de test — lire avant toute restauration</span>
        </summary>
        <p>La restauration et l’écriture vers une machine ne sont pas validées de bout en bout. Garde toujours une copie indépendante.</p>
      </details>

      <PageHeader
        eyebrow="ENGINEERING STUDIO · ARCHITECTURE MODULAIRE & P2P"
        title={<>Deux machines. 20 Moteurs.<br /><em>Un Studio Unifié Décentralisé.</em></>}
        description="Atelier de création sonore temps réel, Git P2P sans serveur central, live-coding Strudel, bibliothèque multi-sources et entraînement arcade relié à votre profil RPG."
        status={<StatusBadge tone="test">Moteurs DSP & P2P Actifs</StatusBadge>}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="primary" onClick={() => openTool("strudel")}>⚡ Strudel Live Studio</Button>
            <Button variant="secondary" onClick={() => openTool("hub")}>Explorer tous les outils</Button>
          </div>
        }
      />

      {/* SECTION 1: MACHINES PHYSIQUES PRINCIPALES */}
      <section className="landing-machine-grid" aria-label="Studios des machines">
        <MachineCard machine="op1" onOpen={() => openTool("op1")} />
        <MachineCard machine="ep133" onOpen={() => openTool("ep133")} />
      </section>

      {/* SECTION 2: LES NOUVEAUX PILIERS DU STUDIO UNIFIÉ */}
      <section style={{ margin: "28px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* P2P GIT & COLLAB SANS SERVEUR */}
        <div
          onClick={() => openTool("collab")}
          style={{
            padding: "18px",
            background: "var(--theme-bg-surface, #151d20)",
            border: "1.5px solid var(--theme-border, #2c3b40)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "border-color 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>🤝</span>
            <StatusBadge tone="test">0 Serveur · 100% P2P</StatusBadge>
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 900, color: "#38bdf8" }}>
            P2P GIT & COLLAB DIRECTE
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)", lineHeight: "1.6" }}>
            Collaboration en temps réel et versioning décentralisé (Music-Git). Rien n'est hébergé sur un serveur central : échange direct de stems, presets et sessions entre pairs.
          </p>
        </div>

        {/* STRUDEL LIVE CODING */}
        <div
          onClick={() => openTool("strudel")}
          style={{
            padding: "18px",
            background: "var(--theme-bg-surface, #151d20)",
            border: "1.5px solid var(--theme-border, #2c3b40)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>⚡</span>
            <StatusBadge tone="test">Tidal Mini-Notation</StatusBadge>
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 900, color: "var(--theme-accent, #00ed95)" }}>
            STRUDEL LIVE CODING & SYNTHS
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)", lineHeight: "1.6" }}>
            Composition algorithmique et polyrythmies euclidiennes. Pilote directement les 20 moteurs audio internes (Mutable Plaits, TB-303, Dexed FM, Surge XT...) et les machines physiques.
          </p>
        </div>

        {/* BIBLIOTHÈQUE MULTI-SOURCES */}
        <div
          onClick={() => openTool("sounds")}
          style={{
            padding: "18px",
            background: "var(--theme-bg-surface, #151d20)",
            border: "1.5px solid var(--theme-border, #2c3b40)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>📁</span>
            <StatusBadge tone="test">Multi-Sources</StatusBadge>
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 900, color: "#f59e0b" }}>
            BIBLIOTHÈQUE SONORE UNIFIÉE
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)", lineHeight: "1.6" }}>
            Catalogue centralisé : sons créés au labo, stems reçus en P2P, dossiers personnels locaux et banques mémoire des machines (slots 001-999 EP-133, kits OP-1).
          </p>
        </div>

        {/* ENTRAÎNEMENT & PROGESSION RPG */}
        <div
          onClick={() => openTool("training")}
          style={{
            padding: "18px",
            background: "var(--theme-bg-surface, #151d20)",
            border: "1.5px solid var(--theme-border, #2c3b40)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>🎮</span>
            <StatusBadge tone="test">Progression RPG & Scores</StatusBadge>
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 900, color: "#a855f7" }}>
            RHYTHM HERO & GUITAR HERO
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)", lineHeight: "1.6" }}>
            Entraînement rythmique arcade temps réel. Chaque partie enregistre vos points, combos, niveaux et trophées directement sur votre Fiche de Personnage RPG.
          </p>
        </div>
      </section>

      <section className="landing-proof-strip" aria-label="Garanties du workspace">
        <span><b>DÉCENTRALISÉ</b>P2P Git & 0 Hébergement central</span>
        <span><b>20 MOTEURS DSP</b>Plaits, 303, FM Dexed, Surge XT</span>
        <span><b>UNIFIÉ</b>Bibliothèque multi-sources & Strudel</span>
      </section>

      <nav className="landing-shortcuts" aria-label="Outils principaux">
        <Button variant="secondary" onClick={() => openTool("collab")} icon={<span aria-hidden="true">🤝</span>}>P2P Collab & Chat</Button>
        <Button variant="secondary" onClick={() => openTool("strudel")} icon={<span aria-hidden="true">⚡</span>}>Strudel Live</Button>
        <Button variant="secondary" onClick={() => openTool("sounds")} icon={<span aria-hidden="true">♫</span>}>Bibliothèque Sonore</Button>
        <Button variant="secondary" onClick={() => openTool("backup")} icon={<span aria-hidden="true">▣</span>}>Sauvegardes</Button>
        <Button variant="secondary" onClick={() => openTool("training")} icon={<span aria-hidden="true">◆</span>}>Apprendre / Jeux</Button>
        <Button variant="secondary" onClick={() => openTool("profil")} icon={<span aria-hidden="true">👤</span>}>Fiche RPG & Stats</Button>
        <Button variant="secondary" onClick={() => openTool("settings")} icon={<span aria-hidden="true">⚙</span>}>Réglages</Button>
        <Button variant="secondary" onClick={() => openTool("visual")} icon={<span aria-hidden="true">▦</span>}>Images OP-1</Button>
      </nav>
    </AppShell>
  );
}

function MachineCard({ machine, onOpen }: { machine: "op1" | "ep133"; onOpen: () => void }) {
  const op1 = machine === "op1";
  const name = op1 ? "OP-1 Studio" : "EP-133 Studio";
  return (
    <Card
      variant="machine"
      className={`landing-machine landing-machine--${machine}`}
      eyebrow={op1 ? "SYNTH · TAPE · DRUM" : "SAMPLE · PADS · PATTERNS"}
      title={name}
      footer={<span>OUVRIR {name.toUpperCase()} ↗</span>}
      onActivate={onOpen}
      accessibleName={`Ouvrir ${name}`}
    >
      <div className="landing-machine__visual">
        <img src={op1 ? "/media/op1.jpeg" : "/media/ep133.jpeg"} alt={op1 ? "Teenage Engineering OP-1" : "Teenage Engineering EP-133 K.O. II"} />
      </div>
      <StatusBadge tone="test">Entièrement Connecté</StatusBadge>
    </Card>
  );
}
