/**
 * MasterEffectsPanel.tsx — Panneau d'effets et de traitement audio de l'OP-1 Studio.
 *
 * Implémente :
 * - Filtre Master Résonant (Cutoff / Resonance / Mode LP-HP-BP)
 * - Delay Stéréo Bande / Analog Tape Delay
 * - Réverbération Spatiale de Studio
 * - Overdrive & Saturation Analogique
 * - Égaliseur Paramétrique 3 Bandes (Low / Mid / High)
 * - Chorus Stéréo
 */

import { useState } from "react";
import { op1AudioEngine } from "../lib/op1SynthEngine";

export interface MasterEffectsState {
  filterEnabled: boolean;
  filterCutoff: number;
  filterRes: number;
  filterType: "lowpass" | "highpass" | "bandpass";
  delayEnabled: boolean;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbEnabled: boolean;
  reverbSize: number;
  reverbDecay: number;
  reverbMix: number;
  driveEnabled: boolean;
  driveAmount: number;
  driveTone: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  chorusEnabled: boolean;
  chorusRate: number;
  chorusDepth: number;
}

export const DEFAULT_MASTER_EFFECTS: MasterEffectsState = {
  filterEnabled: true,
  filterCutoff: 16000,
  filterRes: 2.0,
  filterType: "lowpass",
  delayEnabled: false,
  delayTime: 320,
  delayFeedback: 45,
  delayMix: 30,
  reverbEnabled: false,
  reverbSize: 60,
  reverbDecay: 2.2,
  reverbMix: 35,
  driveEnabled: false,
  driveAmount: 25,
  driveTone: 50,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  chorusEnabled: false,
  chorusRate: 1.2,
  chorusDepth: 40,
};

export function MasterEffectsPanel({
  effects = DEFAULT_MASTER_EFFECTS,
  onChange,
  onNotice,
  onClose,
}: {
  effects?: MasterEffectsState;
  onChange?: (next: Partial<MasterEffectsState>) => void;
  onNotice?: (msg: string) => void;
  onClose?: () => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"filter" | "delay" | "reverb" | "drive" | "eq" | "chorus">("filter");

  const update = (patch: Partial<MasterEffectsState>) => {
    onChange?.(patch);
  };

  return (
    <div className="op1-effects-rack-container" style={{ background: "#11171d", border: "1px solid #22303e", borderRadius: "8px", padding: "12px", color: "#f1f5f9" }}>
      {/* En-tête des onglets d'effets */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2d3a", paddingBottom: "8px", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "filter", label: "🎛️ Filtre Master", active: effects.filterEnabled },
            { id: "delay", label: "📼 Tape Delay", active: effects.delayEnabled },
            { id: "reverb", label: "🌌 Reverb", active: effects.reverbEnabled },
            { id: "drive", label: "🔥 Overdrive", active: effects.driveEnabled },
            { id: "eq", label: "📊 EQ 3-Band", active: true },
            { id: "chorus", label: "🌊 Chorus", active: effects.chorusEnabled },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`op1-pill-btn ${activeSubTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              style={{ fontSize: "11px", padding: "3px 8px" }}
            >
              <span>{tab.label}</span>
              {tab.active && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ED95", display: "inline-block", marginLeft: "4px" }} />}
            </button>
          ))}
        </div>
        {onClose && (
          <button
            type="button"
            className="op1-pill-btn"
            onClick={onClose}
            style={{ fontSize: "11px", padding: "3px 8px" }}
          >
            <span>✕ Fermer</span>
          </button>
        )}
      </div>

      {/* Contenu spécifique à l'effet sélectionné */}
      {activeSubTab === "filter" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#698EFF", fontWeight: 700 }}>Fréquence Cutoff</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.filterCutoff >= 1000 ? `${(effects.filterCutoff / 1000).toFixed(1)} kHz` : `${Math.round(effects.filterCutoff)} Hz`}</span>
            </div>
            <input
              type="range"
              min="100"
              max="20000"
              step="50"
              value={effects.filterCutoff}
              onChange={(e) => update({ filterCutoff: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#698EFF" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Résonance (Q)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.filterRes.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.1"
              value={effects.filterRes}
              onChange={(e) => update({ filterRes: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>

          <div>
            <span style={{ fontSize: "12px", color: "#DFD9FF", fontWeight: 700, display: "block", marginBottom: "6px" }}>Type de Filtre</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["lowpass", "highpass", "bandpass"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ filterType: t })}
                  className={`op1-pill-btn ${effects.filterType === t ? "is-active" : ""}`}
                  style={{ fontSize: "10px", textTransform: "uppercase" }}
                >
                  {t === "lowpass" ? "Passe-Bas" : t === "highpass" ? "Passe-Haut" : "Passe-Bande"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "delay" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#698EFF", fontWeight: 700 }}>Temps de Delay</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.delayTime} ms</span>
            </div>
            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={effects.delayTime}
              onChange={(e) => update({ delayTime: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#698EFF" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Feedback</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.delayFeedback}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="1"
              value={effects.delayFeedback}
              onChange={(e) => update({ delayFeedback: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#FF3A5D", fontWeight: 700 }}>Dry / Wet Mix</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.delayMix}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={effects.delayMix}
              onChange={(e) => update({ delayMix: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#FF3A5D" }}
            />
          </div>
        </div>
      )}

      {activeSubTab === "reverb" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#698EFF", fontWeight: 700 }}>Taille de Pièce</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.reverbSize}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={effects.reverbSize}
              onChange={(e) => update({ reverbSize: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#698EFF" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Durée Decay</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.reverbDecay.toFixed(1)} s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="8.0"
              step="0.1"
              value={effects.reverbDecay}
              onChange={(e) => update({ reverbDecay: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#FF3A5D", fontWeight: 700 }}>Mix Réverbération</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.reverbMix}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={effects.reverbMix}
              onChange={(e) => update({ reverbMix: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#FF3A5D" }}
            />
          </div>
        </div>
      )}

      {activeSubTab === "drive" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#FF3A5D", fontWeight: 700 }}>Saturation / Drive</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.driveAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={effects.driveAmount}
              onChange={(e) => update({ driveAmount: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#FF3A5D" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Couleur & Tone</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.driveTone}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={effects.driveTone}
              onChange={(e) => update({ driveTone: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>
        </div>
      )}

      {activeSubTab === "eq" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#698EFF", fontWeight: 700 }}>Basses (100 Hz)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.eqLow > 0 ? `+${effects.eqLow}` : effects.eqLow} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={effects.eqLow}
              onChange={(e) => update({ eqLow: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#698EFF" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Médiums (1.5 kHz)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.eqMid > 0 ? `+${effects.eqMid}` : effects.eqMid} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={effects.eqMid}
              onChange={(e) => update({ eqMid: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#DFD9FF", fontWeight: 700 }}>Aigus (8 kHz)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.eqHigh > 0 ? `+${effects.eqHigh}` : effects.eqHigh} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={effects.eqHigh}
              onChange={(e) => update({ eqHigh: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#DFD9FF" }}
            />
          </div>
        </div>
      )}

      {activeSubTab === "chorus" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#698EFF", fontWeight: 700 }}>Vitesse LFO (Rate)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.chorusRate.toFixed(1)} Hz</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="8.0"
              step="0.1"
              value={effects.chorusRate}
              onChange={(e) => update({ chorusRate: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#698EFF" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#00ED95", fontWeight: 700 }}>Profondeur (Depth)</span>
              <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{effects.chorusDepth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={effects.chorusDepth}
              onChange={(e) => update({ chorusDepth: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#00ED95" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
