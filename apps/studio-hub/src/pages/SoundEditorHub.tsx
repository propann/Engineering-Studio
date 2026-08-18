"use client";
import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import "./sound-editor.css";

type Machine = "op1" | "ep133";

interface SoundEditorHubProps {
  profileName?: string;
  onClose?: () => void;
}

const STUDIO_URLS = {
  op1: import.meta.env.VITE_OP1_URL || "http://127.0.0.1:5175/",
  ep133: import.meta.env.VITE_EP133_URL || "http://127.0.0.1:5177/",
  hub: import.meta.env.VITE_HUB_URL || "http://127.0.0.1:5179/"
};

const MACHINES = [
  {
    id: "ep133" as Machine,
    name: "EP-133",
    icon: "🥁",
    color: "pink",
    description: "Banques, réglages pads, clone et transferts",
    tool: "sounds"
  },
  {
    id: "op1" as Machine,
    name: "OP-1",
    icon: "🎹",
    color: "yellow",
    description: "Samples, waveform, trim et packs",
    tool: "sample"
  }
];

export default function SoundEditorHub({ profileName = "AZOTH", onClose }: SoundEditorHubProps) {
  const [selectedMachine, setSelectedMachine] = useState<Machine>("ep133");
  const [isLoading, setIsLoading] = useState(false);

  const openMachineEditor = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsLoading(true);

    const machineConfig = MACHINES.find(m => m.id === machine);
    if (!machineConfig) return;

    const url = new URL(STUDIO_URLS[machine]);

    // Ajouter les paramètres pour l'outil son
    if (machine === "ep133") {
      url.searchParams.set("hubTool", "sounds");
    } else if (machine === "op1") {
      url.searchParams.set("hubTool", "sounds");
    }

    url.searchParams.set("from", "sound-editor-hub");

    // Passer le profil
    try {
      const profile = localStorage.getItem("studio-hub-profile");
      if (profile) url.searchParams.set("hubProfile", profile);
    } catch {}

    // Ouvrir dans un iframe ou nouvelle fenêtre
    window.location.href = url.toString();
  };

  return (
    <main className="sound-editor-hub">
      <TopBar profileName={profileName} onDocClick={() => {}} />

      {onClose && (
        <button
          className="sound-editor-back"
          onClick={onClose}
          title="Retour au Hub"
        >
          ← Retour
        </button>
      )}

      <div className="sound-editor-container">
        <div className="sound-editor-header">
          <h1>🎵 Éditeur de Sons</h1>
          <p>Choisissez une machine pour éditer les sons</p>
        </div>

        <div className="machine-selector">
          {MACHINES.map(machine => (
            <button
              key={machine.id}
              className={`machine-button ${selectedMachine === machine.id ? 'active' : ''} machine-${machine.color}`}
              onClick={() => openMachineEditor(machine.id)}
              disabled={isLoading && selectedMachine === machine.id}
            >
              <span className="machine-icon">{machine.icon}</span>
              <span className="machine-name">{machine.name}</span>
              <span className="machine-description">{machine.description}</span>
              {isLoading && selectedMachine === machine.id && (
                <span className="machine-loading">Chargement...</span>
              )}
            </button>
          ))}
        </div>

        <div className="sound-editor-info">
          <div className="info-card">
            <h3>🥁 EP-133 Studio</h3>
            <ul>
              <li>64 ou 128 MB de stockage</li>
              <li>Banques de sons organisées</li>
              <li>Réglages de pads (A/B/C/D)</li>
              <li>Clone et transferts préparés</li>
              <li>Waveform et trim</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>🎹 OP-1 Studio</h3>
            <ul>
              <li>Éditeur de samples WAV/AIFF</li>
              <li>Waveform avec visualization</li>
              <li>Trim et fondus précis</li>
              <li>Préparation de packs</li>
              <li>Formats OP-1 complets</li>
            </ul>
          </div>
        </div>

        <div className="sound-editor-footer">
          <p>💡 Sélectionnez une machine pour commencer</p>
        </div>
      </div>
    </main>
  );
}
