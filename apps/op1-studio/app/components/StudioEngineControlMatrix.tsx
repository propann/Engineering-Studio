"use client";

import React, { useState, useEffect } from "react";
import { RACK_ENGINES_METAS, getEnginesByRack, FACTORY_PATCHES_BY_ENGINE, EngineId, EngineMeta } from "../lib/soundEnginesData";
import { op1AudioEngine } from "../lib/op1SynthEngine";

interface StudioEngineControlMatrixProps {
  currentEngine: string;
  currentPatch: string;
  onSelectEngine: (engineId: string) => void;
  onSelectPatch: (patchName: string) => void;
  onClose: () => void;
  onNotice?: (msg: string) => void;
}

export function StudioEngineControlMatrix({
  currentEngine,
  currentPatch,
  onSelectEngine,
  onSelectPatch,
  onClose,
  onNotice,
}: StudioEngineControlMatrixProps) {
  const [selectedRack, setSelectedRack] = useState<1 | 2>(1);
  const [activeEngineId, setActiveEngineId] = useState<EngineId>(() => (currentEngine as EngineId) || "mi_plaits");
  const [activeTab, setActiveTab] = useState<"quick_knobs" | "adsr_filter" | "lfo_mod" | "matrix_routing">("quick_knobs");

  // Paramètres réels du moteur audio
  const [params, setParams] = useState<Record<string, number>>(() => {
    return {
      t1: op1AudioEngine.getEngineParam("t1", 1),
      t2: op1AudioEngine.getEngineParam("t2", 65),
      t3: op1AudioEngine.getEngineParam("t3", 45),
      t4: op1AudioEngine.getEngineParam("t4", 70),
      shift_t1: op1AudioEngine.getEngineParam("shift_t1", 20),
      shift_t2: op1AudioEngine.getEngineParam("shift_t2", 4500),
      shift_t3: op1AudioEngine.getEngineParam("shift_t3", 40),
      shift_t4: op1AudioEngine.getEngineParam("shift_t4", 30),
      // ADSR
      attack: 15,
      decay: 45,
      sustain: 70,
      release: 35,
      // Filter
      filterType: 0, // 0: LP, 1: HP, 2: BP, 3: Notch
      cutoff: 75,
      resonance: 50,
      envAmount: 60,
      // LFO
      lfoRate: 40,
      lfoDepth: 30,
      lfoTarget: 0, // 0: Filter, 1: Pitch, 2: Pan, 3: Amplitude
      lfoWave: 0, // 0: Sine, 1: Tri, 2: Saw, 3: Square
      // FX & Output
      drive: 25,
      stereoWidth: 80,
      glide: 10,
      masterGain: 85,
    };
  });

  const [testingNote, setTestingNote] = useState<number | null>(null);

  const rack1Engines = getEnginesByRack(1);
  const rack2Engines = getEnginesByRack(2);
  const currentEngines = selectedRack === 1 ? rack1Engines : rack2Engines;
  const activeMeta = RACK_ENGINES_METAS.find((m) => m.id === activeEngineId) || rack1Engines[0];
  const activePatches = FACTORY_PATCHES_BY_ENGINE[activeEngineId] || [];

  const handleParamChange = (key: string, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
    op1AudioEngine.setEngineParam(key, val);
  };

  const handleTriggerNote = (note: number) => {
    setTestingNote(note);
    op1AudioEngine.triggerNoteOn(note, 100);
    setTimeout(() => {
      op1AudioEngine.triggerNoteOff(note);
      setTestingNote((curr) => (curr === note ? null : curr));
    }, 450);
  };

  const handleSaveCustomPatch = () => {
    const patchName = `Custom ${activeMeta.label} #${Math.floor(Math.random() * 900 + 100)}`;
    try {
      const stored = JSON.parse(localStorage.getItem("op1_custom_patches") || "[]");
      stored.unshift({
        id: `custom_${Date.now()}`,
        name: patchName,
        engine: activeEngineId,
        params,
        timestamp: Date.now(),
      });
      localStorage.setItem("op1_custom_patches", JSON.stringify(stored.slice(0, 30)));
      onNotice?.(`Patch "${patchName}" sauvegardé dans la bibliothèque locale !`);
    } catch {}
  };

  return (
    <div
      className="studio-control-matrix-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Entête de la Carte de Contrôle ── */}
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
              background: "linear-gradient(135deg, #698EFF, #00ED95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#090d16",
              fontWeight: 900,
              fontSize: "18px",
            }}
          >
            🎛️
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
              CARTE DE CONTRÔLE GLOBALE · 20 MOTEURS AUDIO
            </h2>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
              2 Racks de 10 moteurs connectés au moteur audio temps réel OP-1 & matrice de modulation
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={handleSaveCustomPatch}
            style={{
              padding: "6px 12px",
              background: "rgba(0, 237, 149, 0.15)",
              border: "1px solid #00ED95",
              color: "#00ED95",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            💾 Mémoriser le Preset
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

      {/* ── Sélecteur de Rack (Rack 1 : 10 moteurs / Rack 2 : 10 moteurs) ── */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => {
            setSelectedRack(1);
            setActiveEngineId(rack1Engines[0].id);
          }}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: selectedRack === 1 ? "1px solid #698EFF" : "1px solid #1e293b",
            background: selectedRack === 1 ? "rgba(105, 142, 255, 0.15)" : "#0f172a",
            color: selectedRack === 1 ? "#93c5fd" : "#64748b",
            fontWeight: 700,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>🔵 RACK 1 · SYNTHÈSE MODULAIRE & FM (10 Moteurs)</span>
          <span style={{ fontSize: "10px", opacity: 0.8 }}>Slots 01-10</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedRack(2);
            setActiveEngineId(rack2Engines[0].id);
          }}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: selectedRack === 2 ? "1px solid #00ED95" : "1px solid #1e293b",
            background: selectedRack === 2 ? "rgba(0, 237, 149, 0.15)" : "#0f172a",
            color: selectedRack === 2 ? "#86efac" : "#64748b",
            fontWeight: 700,
            fontSize: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>🟢 RACK 2 · VINTAGE, DRUMS, SF2 & DSP FAUST (10 Moteurs)</span>
          <span style={{ fontSize: "10px", opacity: 0.8 }}>Slots 11-20</span>
        </button>
      </div>

      {/* ── Grille des 10 Moteurs du Rack Actif ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
          backgroundColor: "#090d16",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #1e293b",
        }}
      >
        {currentEngines.map((eng) => {
          const isSelected = activeEngineId === eng.id;
          const isMasterActive = currentEngine === eng.id;
          return (
            <button
              key={eng.id}
              type="button"
              onClick={() => {
                setActiveEngineId(eng.id);
                onSelectEngine(eng.id);
                const patches = FACTORY_PATCHES_BY_ENGINE[eng.id];
                if (patches && patches[0]) {
                  onSelectPatch(patches[0].name);
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 10px",
                borderRadius: "6px",
                border: isSelected
                  ? "1px solid #00ED95"
                  : isMasterActive
                  ? "1px solid #698EFF"
                  : "1px solid #1e293b",
                background: isSelected
                  ? "rgba(0, 237, 149, 0.15)"
                  : isMasterActive
                  ? "rgba(105, 142, 255, 0.1)"
                  : "#111827",
                color: isSelected ? "#ffffff" : "#cbd5e1",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.12s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700 }}>
                  SLOT {eng.slot < 10 ? `0${eng.slot}` : eng.slot}
                </span>
                {isMasterActive && (
                  <span
                    style={{
                      fontSize: "8px",
                      background: "#698EFF",
                      color: "#0f172a",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontWeight: 800,
                    }}
                  >
                    ACTIF
                  </span>
                )}
              </div>
              <strong style={{ fontSize: "11px", color: isSelected ? "#00ED95" : "#e2e8f0", marginTop: "2px" }}>
                {eng.label}
              </strong>
              <span style={{ fontSize: "9px", color: "#94a3b8" }}>{eng.type}</span>
            </button>
          );
        })}
      </div>

      {/* ── Section Centrale : Contrôleur Temps Réel & Patches ── */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "12px" }}>
        {/* Liste des Patches Usine du moteur sélectionné */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>PATCHS ({activePatches.length})</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>{activeMeta.category}</span>
          </div>

          <div style={{ overflowY: "auto", maxHeight: "230px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {activePatches.map((p) => {
              const isPatchActive = currentPatch === p.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPatch(p.name);
                    onNotice?.(`Patch "${p.name}" activé.`);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    border: isPatchActive ? "1px solid #00ED95" : "1px solid transparent",
                    background: isPatchActive ? "rgba(0, 237, 149, 0.12)" : "rgba(30, 41, 59, 0.5)",
                    color: isPatchActive ? "#00ED95" : "#cbd5e1",
                    fontSize: "10.5px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <strong style={{ fontSize: "10.5px" }}>{p.name}</strong>
                  <span style={{ fontSize: "8.5px", color: "#64748b" }}>{p.description}</span>
                </button>
              );
            })}
          </div>

          {/* Testeur de son interactif direct */}
          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "8px" }}>
            <span style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              ÉCOUTE TEST RAPIDE (C3 - G4) :
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {[48, 52, 55, 60, 64, 67].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => handleTriggerNote(note)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    background: testingNote === note ? "#00ED95" : "#1e293b",
                    color: testingNote === note ? "#090d16" : "#ffffff",
                    border: "1px solid #334155",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {note === 48 ? "C3" : note === 52 ? "E3" : note === 55 ? "G3" : note === 60 ? "C4" : note === 64 ? "E4" : "G4"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panneau de Paramétrage des Potentiomètres & Matrices */}
        <div
          style={{
            background: "#090d16",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Onglets de contrôle */}
          <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("quick_knobs")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                border: activeTab === "quick_knobs" ? "1px solid #698EFF" : "1px solid transparent",
                background: activeTab === "quick_knobs" ? "rgba(105, 142, 255, 0.2)" : "transparent",
                color: activeTab === "quick_knobs" ? "#93c5fd" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              🎛️ Encodeurs T1-T4 (Bleu/Vert/Blanc/Orange)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("adsr_filter")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                border: activeTab === "adsr_filter" ? "1px solid #00ED95" : "1px solid transparent",
                background: activeTab === "adsr_filter" ? "rgba(0, 237, 149, 0.2)" : "transparent",
                color: activeTab === "adsr_filter" ? "#86efac" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              📈 Enveloppe ADSR & Filtre 24dB
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lfo_mod")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                border: activeTab === "lfo_mod" ? "1px solid #FF7A30" : "1px solid transparent",
                background: activeTab === "lfo_mod" ? "rgba(255, 122, 48, 0.2)" : "transparent",
                color: activeTab === "lfo_mod" ? "#fdba74" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              〰️ LFO & Spatialisation
            </button>
          </div>

          {/* Onglet 1 : Les 4 Potentiomètres Phares + SHIFT */}
          {activeTab === "quick_knobs" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {/* T1 Bleu */}
              <div style={{ background: "#131b26", padding: "10px", borderRadius: "6px", border: "1px solid #698EFF" }}>
                <div style={{ fontSize: "10px", color: "#698EFF", fontWeight: 800, marginBottom: "4px" }}>
                  🔵 T1 · TIMBRE / MODÈLE
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                  <span>Valeur</span>
                  <span style={{ color: "#698EFF" }}>{params.t1}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={params.t1}
                  onChange={(e) => handleParamChange("t1", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#698EFF", margin: "8px 0" }}
                />
                <div style={{ fontSize: "9px", color: "#64748b" }}>Shift T1: Coarse Tune ({params.shift_t1})</div>
                <input
                  type="range"
                  min={-24}
                  max={24}
                  value={params.shift_t1}
                  onChange={(e) => handleParamChange("shift_t1", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#698EFF" }}
                />
              </div>

              {/* T2 Vert */}
              <div style={{ background: "#11221c", padding: "10px", borderRadius: "6px", border: "1px solid #00ED95" }}>
                <div style={{ fontSize: "10px", color: "#00ED95", fontWeight: 800, marginBottom: "4px" }}>
                  🟢 T2 · MORPH / CUTOFF
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                  <span>Valeur</span>
                  <span style={{ color: "#00ED95" }}>{params.t2}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.t2}
                  onChange={(e) => handleParamChange("t2", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00ED95", margin: "8px 0" }}
                />
                <div style={{ fontSize: "9px", color: "#64748b" }}>Shift T2: Fine Tune ({params.shift_t2})</div>
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={params.shift_t2}
                  onChange={(e) => handleParamChange("shift_t2", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00ED95" }}
                />
              </div>

              {/* T3 Blanc */}
              <div style={{ background: "#1a1f26", padding: "10px", borderRadius: "6px", border: "1px solid #DFD9FF" }}>
                <div style={{ fontSize: "10px", color: "#DFD9FF", fontWeight: 800, marginBottom: "4px" }}>
                  ⚪ T3 · HARMONIQUES / Q
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                  <span>Valeur</span>
                  <span style={{ color: "#DFD9FF" }}>{params.t3}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.t3}
                  onChange={(e) => handleParamChange("t3", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#DFD9FF", margin: "8px 0" }}
                />
                <div style={{ fontSize: "9px", color: "#64748b" }}>Shift T3: Resonance ({params.shift_t3}%)</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.shift_t3}
                  onChange={(e) => handleParamChange("shift_t3", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#DFD9FF" }}
                />
              </div>

              {/* T4 Orange */}
              <div style={{ background: "#221711", padding: "10px", borderRadius: "6px", border: "1px solid #FF7A30" }}>
                <div style={{ fontSize: "10px", color: "#FF7A30", fontWeight: 800, marginBottom: "4px" }}>
                  🟠 T4 · DÉCLIN / ESPACE
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                  <span>Valeur</span>
                  <span style={{ color: "#FF7A30" }}>{params.t4}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.t4}
                  onChange={(e) => handleParamChange("t4", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF7A30", margin: "8px 0" }}
                />
                <div style={{ fontSize: "9px", color: "#64748b" }}>Shift T4: FX Send ({params.shift_t4}%)</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.shift_t4}
                  onChange={(e) => handleParamChange("shift_t4", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF7A30" }}
                />
              </div>
            </div>
          )}

          {/* Onglet 2 : ADSR & Filtre */}
          {activeTab === "adsr_filter" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Enveloppe ADSR */}
              <div style={{ background: "#111827", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                <strong style={{ fontSize: "11px", color: "#00ED95", display: "block", marginBottom: "8px" }}>
                  ENVELOPPE D&apos;AMPLITUDE (ADSR)
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Attack ({params.attack}ms)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.attack}
                      onChange={(e) => handleParamChange("attack", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00ED95" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Decay ({params.decay}ms)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.decay}
                      onChange={(e) => handleParamChange("decay", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00ED95" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Sustain ({params.sustain}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.sustain}
                      onChange={(e) => handleParamChange("sustain", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00ED95" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Release ({params.release}ms)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.release}
                      onChange={(e) => handleParamChange("release", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00ED95" }}
                    />
                  </div>
                </div>
              </div>

              {/* Filtre 24dB */}
              <div style={{ background: "#111827", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                <strong style={{ fontSize: "11px", color: "#698EFF", display: "block", marginBottom: "8px" }}>
                  FILTRE MULTI-MODE RÉSONANT 24dB/OCT
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Cutoff ({params.cutoff}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.cutoff}
                      onChange={(e) => handleParamChange("cutoff", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#698EFF" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Resonance ({params.resonance}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.resonance}
                      onChange={(e) => handleParamChange("resonance", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#698EFF" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet 3 : LFO & Spatialisation */}
          {activeTab === "lfo_mod" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#111827", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                <strong style={{ fontSize: "11px", color: "#FF7A30", display: "block", marginBottom: "8px" }}>
                  LFO MODULATEUR UNIVERSEL
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Vitesse LFO Rate ({params.lfoRate}Hz)</span>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={params.lfoRate}
                      onChange={(e) => handleParamChange("lfoRate", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#FF7A30" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Profondeur LFO Depth ({params.lfoDepth}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.lfoDepth}
                      onChange={(e) => handleParamChange("lfoDepth", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#FF7A30" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: "#111827", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                <strong style={{ fontSize: "11px", color: "#DFD9FF", display: "block", marginBottom: "8px" }}>
                  DRIVE, STEREO & SORTIE
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Saturation Drive ({params.drive}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.drive}
                      onChange={(e) => handleParamChange("drive", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#DFD9FF" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}>Largeur Stéréo ({params.stereoWidth}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={params.stereoWidth}
                      onChange={(e) => handleParamChange("stereoWidth", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#DFD9FF" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
