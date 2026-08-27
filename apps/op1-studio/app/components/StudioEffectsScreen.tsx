/**
 * StudioEffectsScreen.tsx — Écran OLED 320×160 dédié aux Effets Master DSP de l'OP-1.
 *
 * Implémente l'affichage vectoriel temps réel :
 * - Visualisation graphique de la courbe de réponse (Filtre, Delay, Reverb, Overdrive, EQ, Chorus)
 * - 4 encodeurs T1 (Bleu), T2 (Vert), T3 (Blanc), T4 (Rouge) mappés aux paramètres de l'effet actif
 * - Bouton toujours visible "📼 RETOUR BANDE (TAPE)" et commutation rapide de mode
 */

import { useState } from "react";
import { type MasterEffectsState, DEFAULT_MASTER_EFFECTS } from "./MasterEffectsPanel";

export interface StudioEffectsScreenProps {
  effects?: MasterEffectsState;
  onChange?: (next: Partial<MasterEffectsState>) => void;
  onMachineModeChange: (mode: "synth" | "drum" | "tape" | "mixer" | "effects" | "browser") => void;
  onOpenTapeView: () => void;
  onNotice?: (msg: string) => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
}

export function StudioEffectsScreen({
  effects = DEFAULT_MASTER_EFFECTS,
  onChange,
  onMachineModeChange,
  onOpenTapeView,
  onNotice,
  volume = 0.85,
  onVolumeChange,
}: StudioEffectsScreenProps) {
  const [activeTab, setActiveTab] = useState<"filter" | "delay" | "reverb" | "drive" | "eq" | "chorus">("filter");

  // Configuration des 4 encodeurs selon l'effet sélectionné
  const getKnobConfigs = () => {
    switch (activeTab) {
      case "filter":
        return [
          { name: "CUTOFF", val: effects.filterCutoff, min: 200, max: 20000, step: 100, unit: "Hz", color: "#698EFF", set: (v: number) => onChange?.({ filterCutoff: v }) },
          { name: "RESONANCE", val: effects.filterRes, min: 0.5, max: 20, step: 0.1, unit: "", color: "#00ED95", set: (v: number) => onChange?.({ filterRes: v }) },
          { name: "TYPE LP/HP", val: effects.filterType === "lowpass" ? 1 : effects.filterType === "highpass" ? 2 : 3, min: 1, max: 3, step: 1, unit: "", color: "#DFD9FF", set: (v: number) => onChange?.({ filterType: v === 1 ? "lowpass" : v === 2 ? "highpass" : "bandpass" }) },
          { name: "ON / BYPASS", val: effects.filterEnabled ? 1 : 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: (v: number) => onChange?.({ filterEnabled: v === 1 }) },
        ];
      case "delay":
        return [
          { name: "TEMPS", val: effects.delayTime, min: 20, max: 1000, step: 10, unit: "ms", color: "#698EFF", set: (v: number) => onChange?.({ delayTime: v }) },
          { name: "FEEDBACK", val: effects.delayFeedback, min: 0, max: 95, step: 1, unit: "%", color: "#00ED95", set: (v: number) => onChange?.({ delayFeedback: v }) },
          { name: "MIX WET", val: effects.delayMix, min: 0, max: 100, step: 1, unit: "%", color: "#DFD9FF", set: (v: number) => onChange?.({ delayMix: v }) },
          { name: "ON / BYPASS", val: effects.delayEnabled ? 1 : 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: (v: number) => onChange?.({ delayEnabled: v === 1 }) },
        ];
      case "reverb":
        return [
          { name: "SPACE SIZE", val: effects.reverbSize, min: 10, max: 100, step: 1, unit: "%", color: "#698EFF", set: (v: number) => onChange?.({ reverbSize: v }) },
          { name: "DECAY TIME", val: effects.reverbDecay, min: 0.5, max: 10, step: 0.1, unit: "s", color: "#00ED95", set: (v: number) => onChange?.({ reverbDecay: v }) },
          { name: "MIX WET", val: effects.reverbMix, min: 0, max: 100, step: 1, unit: "%", color: "#DFD9FF", set: (v: number) => onChange?.({ reverbMix: v }) },
          { name: "ON / BYPASS", val: effects.reverbEnabled ? 1 : 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: (v: number) => onChange?.({ reverbEnabled: v === 1 }) },
        ];
      case "drive":
        return [
          { name: "DRIVE GAIN", val: effects.driveAmount, min: 0, max: 100, step: 1, unit: "%", color: "#698EFF", set: (v: number) => onChange?.({ driveAmount: v }) },
          { name: "TONE COLOR", val: effects.driveTone, min: 0, max: 100, step: 1, unit: "%", color: "#00ED95", set: (v: number) => onChange?.({ driveTone: v }) },
          { name: "WARMTH", val: 50, min: 0, max: 100, step: 1, unit: "%", color: "#DFD9FF", set: () => {} },
          { name: "ON / BYPASS", val: effects.driveEnabled ? 1 : 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: (v: number) => onChange?.({ driveEnabled: v === 1 }) },
        ];
      case "eq":
        return [
          { name: "BASS 100Hz", val: effects.eqLow, min: -12, max: 12, step: 0.5, unit: "dB", color: "#698EFF", set: (v: number) => onChange?.({ eqLow: v }) },
          { name: "MID 1.2kHz", val: effects.eqMid, min: -12, max: 12, step: 0.5, unit: "dB", color: "#00ED95", set: (v: number) => onChange?.({ eqMid: v }) },
          { name: "HIGH 8kHz", val: effects.eqHigh, min: -12, max: 12, step: 0.5, unit: "dB", color: "#DFD9FF", set: (v: number) => onChange?.({ eqHigh: v }) },
          { name: "RESET FLAT", val: 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: () => onChange?.({ eqLow: 0, eqMid: 0, eqHigh: 0 }) },
        ];
      case "chorus":
        return [
          { name: "RATE SPEED", val: effects.chorusRate, min: 0.1, max: 8, step: 0.1, unit: "Hz", color: "#698EFF", set: (v: number) => onChange?.({ chorusRate: v }) },
          { name: "DEPTH", val: effects.chorusDepth, min: 0, max: 100, step: 1, unit: "%", color: "#00ED95", set: (v: number) => onChange?.({ chorusDepth: v }) },
          { name: "STEREO WIDE", val: 80, min: 0, max: 100, step: 1, unit: "%", color: "#DFD9FF", set: () => {} },
          { name: "ON / BYPASS", val: effects.chorusEnabled ? 1 : 0, min: 0, max: 1, step: 1, unit: "", color: "#FF3A5D", set: (v: number) => onChange?.({ chorusEnabled: v === 1 }) },
        ];
    }
  };

  const knobs = getKnobConfigs();

  // Courbe de visualisation en fonction de l'effet
  const renderVisualCurve = () => {
    const points: string[] = [];
    const cx = 160;
    const cy = 60;
    const w = 180;
    const h = 50;

    for (let i = 0; i <= 36; i++) {
      const r = i / 36;
      const x = cx - w / 2 + r * w;
      let y = cy;

      if (activeTab === "filter") {
        const cutR = Math.max(0.1, Math.min(0.9, (effects.filterCutoff - 200) / 19800));
        if (effects.filterType === "lowpass") {
          y = r < cutR ? cy - 15 : cy - 15 + Math.pow((r - cutR) / (1 - cutR), 2) * 32;
        } else if (effects.filterType === "highpass") {
          y = r > cutR ? cy - 15 : cy - 15 + Math.pow((cutR - r) / cutR, 2) * 32;
        } else {
          y = cy + Math.abs(r - cutR) * 34 - 15;
        }
      } else if (activeTab === "delay") {
        y = cy + Math.sin(r * Math.PI * (effects.delayTime / 80)) * (20 * (effects.delayFeedback / 100));
      } else if (activeTab === "reverb") {
        y = cy + (Math.sin(r * 24) * 0.4 + Math.sin(r * 52) * 0.3) * (effects.reverbSize / 4);
      } else if (activeTab === "drive") {
        const d = effects.driveAmount / 100;
        y = cy - Math.tanh(Math.sin(r * Math.PI * 4) * (1 + d * 4)) * 18;
      } else if (activeTab === "eq") {
        const low = effects.eqLow / 12;
        const mid = effects.eqMid / 12;
        const high = effects.eqHigh / 12;
        y = cy - (Math.cos(r * Math.PI) * low * 14 + Math.sin(r * Math.PI) * mid * 14 - Math.cos(r * Math.PI) * high * 14);
      } else {
        y = cy + Math.sin(r * Math.PI * 3 + (effects.chorusRate || 1)) * 15;
      }

      points.push(`${x.toFixed(1)},${Math.max(26, Math.min(96, y)).toFixed(1)}`);
    }

    return points.join(" ");
  };

  return (
    <div className="op1-effects-screen-container" style={{ position: "relative" }}>
      <svg
        viewBox="0 0 320 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block", cursor: "default" }}
      >
        <rect width="320" height="160" fill="#090d10" />

        {/* ── BARRE DE NAVIGATION SUPÉRIEURE ─────────────────────────────────── */}
        <rect x="3" y="3" width="314" height="17" rx="3" fill="#121820" stroke="#1f2c38" strokeWidth="0.8" />

        <g transform="translate(6, 5.5)">
          {[
            { id: "synth", label: "SYNTH", color: "#698EFF" },
            { id: "drum", label: "DRUM", color: "#FF3A5D" },
            { id: "tape", label: "TAPE", color: "#DFD9FF" },
            { id: "mixer", label: "MIXER", color: "#00ED95" },
            { id: "effects", label: "FX", color: "#e8a020" },
            { id: "browser", label: "PATCHS", color: "#94a3b8" },
          ].map((item, idx) => {
            const isActive = item.id === "effects";
            return (
              <g
                key={item.id}
                transform={`translate(${idx * 38}, 0)`}
                style={{ cursor: "pointer" }}
                onClick={() => onMachineModeChange(item.id as any)}
              >
                <rect
                  x="0"
                  y="0"
                  width="36"
                  height="12"
                  rx="2"
                  fill={isActive ? item.color : "#17202a"}
                  stroke={isActive ? "#ffffff" : "#243342"}
                  strokeWidth={isActive ? "0.8" : "0.4"}
                />
                <text
                  x="18"
                  y="8.5"
                  textAnchor="middle"
                  fill={isActive ? "#090d10" : item.color}
                  fontSize="4.2"
                  fontFamily="monospace"
                  fontWeight="900"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Bouton direct "RETOUR BANDE (TAPE)" à droite */}
        <g
          style={{ cursor: "pointer" }}
          onClick={onOpenTapeView}
          role="button"
          aria-label="Retour direct à l'écran Tape"
        >
          <rect
            x="248"
            y="5"
            width="66"
            height="13"
            rx="2.5"
            fill="#1e293b"
            stroke="#DFD9FF"
            strokeWidth="0.9"
            style={{ filter: "drop-shadow(0 0 3px rgba(223, 217, 255, 0.4))" }}
          />
          <text x="281" y="13.8" textAnchor="middle" fill="#DFD9FF" fontSize="4.2" fontFamily="monospace" fontWeight="900">
            📼 RETOUR BANDE
          </text>
        </g>

        {/* ── SÉLECTEUR D'EFFET (Filtre, Delay, Reverb, Drive, EQ, Chorus) ───── */}
        <g transform="translate(6, 24)">
          {[
            { id: "filter", label: "FILTER" },
            { id: "delay", label: "DELAY" },
            { id: "reverb", label: "REVERB" },
            { id: "drive", label: "DRIVE" },
            { id: "eq", label: "EQ 3B" },
            { id: "chorus", label: "CHORUS" },
          ].map((fx, idx) => {
            const isSel = activeTab === fx.id;
            return (
              <g
                key={fx.id}
                transform={`translate(${idx * 51}, 0)`}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveTab(fx.id as typeof activeTab)}
              >
                <rect
                  x="0"
                  y="0"
                  width="48"
                  height="12"
                  rx="2"
                  fill={isSel ? "#e8a020" : "#111820"}
                  stroke={isSel ? "#ffffff" : "#1f2c38"}
                  strokeWidth="0.6"
                />
                <text
                  x="24"
                  y="8.5"
                  textAnchor="middle"
                  fill={isSel ? "#090d10" : "#94a3b8"}
                  fontSize="3.8"
                  fontFamily="monospace"
                  fontWeight="900"
                >
                  {fx.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── ZONE GRAPHIQUE CENTRALE DE L'EFFET ─────────────────────────────── */}
        <rect x="52" y="40" width="216" height="58" rx="3" fill="#060a0e" stroke="#1a2530" strokeWidth="0.9" />
        <line x1="53" y1="69" x2="267" y2="69" stroke="#121e28" strokeWidth="0.8" />
        <line x1="160" y1="41" x2="160" y2="97" stroke="#121e28" strokeWidth="0.8" />

        {/* Courbe vectorielle active */}
        <polyline
          points={renderVisualCurve()}
          fill="none"
          stroke="#e8a020"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(232, 160, 32, 0.75))" }}
        />

        {/* Indicateurs latéraux */}
        <text x="56" y="48" fill="#4b6b88" fontSize="3.4" fontFamily="monospace" fontWeight="700">DSP MASTER</text>
        <text x="263" y="48" textAnchor="end" fill="#00ED95" fontSize="3.4" fontFamily="monospace" fontWeight="700">44.1 kHz</text>

        {/* ── 4 POTENTIOMÈTRES ROTATIFS T1, T2, T3, T4 ───────────────────────── */}
        {knobs.map((knob, idx) => {
          const kcx = 40 + idx * 80;
          const kcy = 130;
          const kr = 13.5;
          const progress = Math.max(0, Math.min(1, (knob.val - knob.min) / (knob.max - knob.min || 1)));
          const angle = progress * 270 - 135;
          const rad = (angle * Math.PI) / 180;
          const nx = kcx + kr * 0.7 * Math.sin(rad);
          const ny = kcy - kr * 0.7 * Math.cos(rad);

          return (
            <g
              key={idx}
              style={{ cursor: "pointer" }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY < 0 ? knob.step : -knob.step;
                const next = Math.max(knob.min, Math.min(knob.max, Math.round((knob.val + delta) * 10) / 10));
                knob.set(next);
                onNotice?.(`${knob.name} : ${next}${knob.unit}`);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const startVal = knob.val;
                const range = knob.max - knob.min;
                const onMove = (me: PointerEvent) => {
                  const delta = ((startY - me.clientY) / 100) * range;
                  const next = Math.max(knob.min, Math.min(knob.max, Math.round((startVal + delta) / knob.step) * knob.step));
                  knob.set(next);
                };
                const onUp = () => {
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                };
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }}
            >
              <rect
                x={kcx - 36}
                y="104"
                width="72"
                height="51"
                rx="3"
                fill="#0d141a"
                stroke={knob.color}
                strokeWidth="0.8"
              />
              <text x={kcx} y="112" textAnchor="middle" fill={knob.color} fontSize="4.2" fontFamily="monospace" fontWeight="900">
                {`T${idx + 1} · ${knob.name}`}
              </text>
              <circle cx={kcx} cy={kcy} r={kr} fill="#070c10" stroke={knob.color} strokeWidth="1.2" />
              <circle cx={kcx} cy={kcy} r={kr * 0.75} fill="#14202c" stroke="#253b4f" strokeWidth="0.6" />
              <circle cx={kcx} cy={kcy} r={kr + 2.5} fill="none" stroke="#1f3140" strokeWidth="0.8" strokeDasharray="1.5 2.5" />
              <line x1={kcx} y1={kcy} x2={nx} y2={ny} stroke={knob.color} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx={nx} cy={ny} r="1.3" fill="#ffffff" />
              <circle cx={kcx} cy={kcy} r="2.2" fill="#ffffff" />
              <text x={kcx} y="151.5" textAnchor="middle" fill="#ffffff" fontSize="4.4" fontFamily="monospace" fontWeight="bold">
                {`${knob.val}${knob.unit}`}
              </text>
            </g>
          );
        })}

        <rect x="1" y="1" width="318" height="158" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.2" style={{ pointerEvents: "none" }} />
      </svg>
    </div>
  );
}
