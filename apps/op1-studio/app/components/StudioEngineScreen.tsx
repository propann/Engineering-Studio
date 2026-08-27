/**
 * StudioEngineScreen.tsx — Écran OLED 320×160 dédié au paramétrage officiel des moteurs audio OP-1.
 *
 * Affiche l'interface graphique de synthèse épurée et réactive :
 * - Visualiseur oscilloscopique haute fidélité réactif aux paramètres
 * - 4 encodeurs rotatifs T1 (Bleu), T2 (Vert), T3 (Blanc), T4 (Rouge)
 * - Gestion native du mode SHIFT (Page 1 : Paramètres Principaux / Page 2 : Paramètres SHIFT)
 * - Sélection fluide du moteur et patch sans superposition parasite
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { getEngineKnobsConfig, getEngineDualConfig, type EngineKnobsConfig } from "../lib/engineKnobsData";
import { op1AudioEngine } from "../lib/op1SynthEngine";
import { StudioSoundMenuOverlay } from "./StudioSoundMenuOverlay";

export interface StudioEngineScreenProps {
  engineId: string;
  engineName: string;
  patchName: string;
  patchCategory?: string;
  machineMode: "synth" | "drum" | "tape" | "mixer" | "effects" | "browser";
  onMachineModeChange: (mode: "synth" | "drum" | "tape" | "mixer" | "effects" | "browser") => void;
  soundMenuOpen?: boolean;
  onOpenSoundMenu?: () => void;
  onCloseSoundMenu?: () => void;
  onEngineChange?: (engineId: string) => void;
  onPatchChange?: (patchName: string) => void;
  onOpenTapeView?: () => void;
  onNotice?: (msg: string) => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  isShiftActive?: boolean;
  onToggleShift?: () => void;
}

export function StudioEngineScreen({
  engineId,
  engineName,
  patchName,
  patchCategory = "LEAD",
  machineMode,
  onMachineModeChange,
  soundMenuOpen = false,
  onOpenSoundMenu,
  onCloseSoundMenu,
  onEngineChange,
  onPatchChange,
  onOpenTapeView,
  onNotice,
  volume = 0.85,
  onVolumeChange,
  isShiftActive: externalShiftActive,
  onToggleShift,
}: StudioEngineScreenProps) {
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [internalShift, setInternalShift] = useState(false);
  const isShift = externalShiftActive !== undefined ? externalShiftActive : internalShift;
  const isMenuOpen = soundMenuOpen || localMenuOpen;

  const dualConfig = getEngineDualConfig(engineId);
  const currentKnobsConfig = isShift ? dualConfig.shift : dualConfig.main;

  // Paramètres réels stockés
  const [mainParams, setMainParams] = useState({
    t1: dualConfig.main.t1.defaultValue,
    t2: dualConfig.main.t2.defaultValue,
    t3: dualConfig.main.t3.defaultValue,
    t4: dualConfig.main.t4.defaultValue,
  });

  const [shiftParams, setShiftParams] = useState({
    t1: dualConfig.shift.t1.defaultValue,
    t2: dualConfig.shift.t2.defaultValue,
    t3: dualConfig.shift.t3.defaultValue,
    t4: dualConfig.shift.t4.defaultValue,
  });

  // Recharger les valeurs par défaut au changement de moteur
  useEffect(() => {
    const nextDual = getEngineDualConfig(engineId);
    const m = {
      t1: nextDual.main.t1.defaultValue,
      t2: nextDual.main.t2.defaultValue,
      t3: nextDual.main.t3.defaultValue,
      t4: nextDual.main.t4.defaultValue,
    };
    const s = {
      t1: nextDual.shift.t1.defaultValue,
      t2: nextDual.shift.t2.defaultValue,
      t3: nextDual.shift.t3.defaultValue,
      t4: nextDual.shift.t4.defaultValue,
    };
    setMainParams(m);
    setShiftParams(s);

    op1AudioEngine.setEngine(engineId);
    op1AudioEngine.setPatch(patchName);
    op1AudioEngine.setEngineParam("t1", m.t1);
    op1AudioEngine.setEngineParam("t2", m.t2);
    op1AudioEngine.setEngineParam("t3", m.t3);
    op1AudioEngine.setEngineParam("t4", m.t4);
    op1AudioEngine.setEngineParam("shift_t1", s.t1);
    op1AudioEngine.setEngineParam("shift_t2", s.t2);
    op1AudioEngine.setEngineParam("shift_t3", s.t3);
    op1AudioEngine.setEngineParam("shift_t4", s.t4);
  }, [engineId, patchName]);

  // Écoute clavier de la touche Shift
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && !e.repeat) {
        setInternalShift(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setInternalShift(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const [activeDraggingKnob, setActiveDraggingKnob] = useState<"t1" | "t2" | "t3" | "t4" | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartValRef = useRef<number>(0);
  const [animPhase, setAnimPhase] = useState(0);

  // Animation continue de la forme d'onde dynamique
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setAnimPhase((p) => (p + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const activeParams = isShift ? shiftParams : mainParams;
  const setActiveParams = isShift ? setShiftParams : setMainParams;

  const handleKnobStart = (knob: "t1" | "t2" | "t3" | "t4", clientY: number) => {
    setActiveDraggingKnob(knob);
    dragStartYRef.current = clientY;
    dragStartValRef.current = activeParams[knob];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggingKnob) return;
    const deltaY = dragStartYRef.current - e.clientY;
    const kDef = currentKnobsConfig[activeDraggingKnob];
    const range = kDef.max - kDef.min;
    const step = kDef.step || 1;
    const change = (deltaY / 120) * range;
    const rawVal = Math.max(kDef.min, Math.min(kDef.max, dragStartValRef.current + change));
    const quantizedVal = Math.round(rawVal / step) * step;

    setActiveParams((prev) => {
      const next = { ...prev, [activeDraggingKnob]: quantizedVal };
      const paramKey = isShift ? `shift_${activeDraggingKnob}` : activeDraggingKnob;
      op1AudioEngine.setEngineParam(paramKey, quantizedVal);
      return next;
    });
  };

  const handlePointerUp = () => {
    setActiveDraggingKnob(null);
  };

  const handleWheel = (knob: "t1" | "t2" | "t3" | "t4", e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const kDef = currentKnobsConfig[knob];
    const step = kDef.step || 1;
    const dir = e.deltaY < 0 ? 1 : -1;
    const rawVal = Math.max(kDef.min, Math.min(kDef.max, activeParams[knob] + dir * step));
    const quantizedVal = Math.round(rawVal / step) * step;

    setActiveParams((prev) => {
      const next = { ...prev, [knob]: quantizedVal };
      const paramKey = isShift ? `shift_${knob}` : knob;
      op1AudioEngine.setEngineParam(paramKey, quantizedVal);
      return next;
    });
    onNotice?.(`${kDef.name} : ${kDef.formatter ? kDef.formatter(quantizedVal) : quantizedVal}`);
  };

  // Convertit une valeur de potentiomètre en angle de -135° à +135°
  const getKnobAngle = (val: number, min: number, max: number) => {
    const range = Math.max(0.001, max - min);
    const progress = Math.max(0, Math.min(1, (val - min) / range));
    return progress * 270 - 135;
  };

  // Génération de la forme d'onde réactive au centre
  const renderVisualizerWaveform = useCallback(() => {
    const w = 210;
    const h = 54;
    const cx = 145;
    const cy = 60;
    const points: string[] = [];

    const numPoints = 48;
    const t1Factor = (mainParams.t1 - dualConfig.main.t1.min) / (dualConfig.main.t1.max - dualConfig.main.t1.min || 1);
    const t2Factor = mainParams.t2 / 100;
    const t3Factor = mainParams.t3 / 100;
    const t4Factor = mainParams.t4 / 100;

    for (let i = 0; i <= numPoints; i++) {
      const xRatio = i / numPoints;
      const x = cx - w / 2 + xRatio * w;
      const freq1 = 2 + t1Factor * 5;
      const freq2 = 4 + t3Factor * 6;
      const yNorm =
        Math.sin(xRatio * Math.PI * freq1 + animPhase) * (0.55 * t2Factor) +
        Math.sin(xRatio * Math.PI * freq2 - animPhase * 1.5) * (0.35 * t3Factor) +
        Math.cos(xRatio * Math.PI * 8 + animPhase * 0.8) * (0.15 * t4Factor);

      const y = cy + yNorm * (h / 2 - 4);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return points.join(" ");
  }, [mainParams, dualConfig, animPhase]);

  const knobColors = {
    t1: "#698EFF", // Bleu
    t2: "#00ED95", // Vert
    t3: "#DFD9FF", // Blanc
    t4: "#FF3A5D", // Rouge
  };

  return (
    <div className="op1-engine-screen-container" style={{ position: "relative" }}>
      <svg
        viewBox="0 0 320 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block", cursor: "default" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Fond OLED noir profond OP-1 */}
        <rect width="320" height="160" fill="#090d10" />

        {/* ── BARRE SUPÉRIEURE : NAVIGATION OP-1 & MODES (y=3..17) ──────────────── */}
        <rect x="3" y="3" width="314" height="15" rx="3" fill="#121820" stroke="#1f2c38" strokeWidth="0.8" />

        {/* 4 MODES OP-1 ALIGNÉS SUR LA BANDE : SYNTH, DRUM, TAPE, MIXER */}
        <g transform="translate(6, 4.5)">
          {[
            { id: "synth", label: "SYNTH", color: "#698EFF" },
            { id: "drum", label: "DRUM", color: "#FF3A5D" },
            { id: "tape", label: "TAPE", color: "#DFD9FF" },
            { id: "mixer", label: "MIXER", color: "#00ED95" },
          ].map((item, idx) => {
            const isActive = machineMode === item.id;
            return (
              <g
                key={item.id}
                transform={`translate(${idx * 48}, 0)`}
                style={{ cursor: "pointer" }}
                onClick={() => onMachineModeChange(item.id as any)}
                role="button"
                aria-label={`Passer au mode ${item.label}`}
              >
                <rect
                  x="0"
                  y="0"
                  width="44"
                  height="12"
                  rx="2"
                  fill={isActive ? item.color : "#17202a"}
                  stroke={isActive ? "#ffffff" : "#243342"}
                  strokeWidth={isActive ? "0.9" : "0.4"}
                />
                <text
                  x="22"
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

        {/* BOUTON TOGGLE SHIFT (PAGE 1 / PAGE 2) */}
        <g
          transform="translate(204, 4.5)"
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (onToggleShift) onToggleShift();
            else setInternalShift(!internalShift);
          }}
          role="button"
          aria-label="Basculer entre Page 1 et Page 2 Shift"
        >
          <rect
            x="0"
            y="0"
            width="52"
            height="12"
            rx="2"
            fill={isShift ? "#FF3A5D" : "#17202a"}
            stroke={isShift ? "#ffffff" : "#475569"}
            strokeWidth={isShift ? "0.9" : "0.5"}
          />
          <text
            x="26"
            y="8.5"
            textAnchor="middle"
            fill={isShift ? "#ffffff" : "#94a3b8"}
            fontSize="3.8"
            fontFamily="monospace"
            fontWeight="900"
          >
            {isShift ? "⇧ SHIFT [P2]" : "PAGE 1 [MAIN]"}
          </text>
        </g>

        {/* BOUTON DIRECT RETOUR BANDE */}
        <g
          style={{ cursor: "pointer" }}
          onClick={onOpenTapeView}
          role="button"
          aria-label="Retour direct à l'écran Tape"
        >
          <rect
            x="260"
            y="4.5"
            width="54"
            height="12"
            rx="2"
            fill="#1e293b"
            stroke="#DFD9FF"
            strokeWidth="0.8"
          />
          <text x="287" y="13" textAnchor="middle" fill="#DFD9FF" fontSize="3.8" fontFamily="monospace" fontWeight="900">
            📼 BANDE
          </text>
        </g>

        {/* ── SOUS-BARRE SÉLECTEUR MOTEUR & PATCH (y=21..32) ────────────────── */}
        <g transform="translate(6, 21)">
          {/* Bouton Moteur */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (onOpenSoundMenu) onOpenSoundMenu();
              else setLocalMenuOpen(!localMenuOpen);
            }}
          >
            <rect x="0" y="0" width="95" height="11" rx="2" fill="#0d1b2a" stroke="#698EFF" strokeWidth="0.8" />
            <text x="47.5" y="7.5" textAnchor="middle" fill="#698EFF" fontSize="4.0" fontFamily="monospace" fontWeight="900">
              🔵 {engineName.toUpperCase()}
            </text>
          </g>

          {/* Bouton Patch */}
          <g
            transform="translate(100, 0)"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (onOpenSoundMenu) onOpenSoundMenu();
              else setLocalMenuOpen(!localMenuOpen);
            }}
          >
            <rect x="0" y="0" width="160" height="11" rx="2" fill="#0b2016" stroke="#00ED95" strokeWidth="0.8" />
            <text x="80" y="7.5" textAnchor="middle" fill="#00ED95" fontSize="4.0" fontFamily="monospace" fontWeight="800">
              🟢 {patchName.length > 28 ? `${patchName.slice(0, 26)}…` : patchName}
            </text>
          </g>

          {/* Badge Catégorie */}
          <rect x="265" y="0" width="49" height="11" rx="1.5" fill="#1c2b36" stroke="#2c4254" strokeWidth="0.5" />
          <text x="289.5" y="7.5" textAnchor="middle" fill="#DFD9FF" fontSize="3.4" fontFamily="monospace" fontWeight="700">
            {patchCategory.toUpperCase()}
          </text>
        </g>

        {/* ── ZONE CENTRALE : VISUALISEUR OSCILLOSCOPE RÉACTIF (y=34..98) ──── */}
        {/* Cadre de l'oscilloscope */}
        <rect x="6" y="34" width="264" height="65" rx="3" fill="#06090c" stroke="#1a2530" strokeWidth="1" />
        <rect x="7" y="35" width="262" height="63" rx="2" fill="none" stroke="#243746" strokeWidth="0.4" strokeDasharray="3 3" />

        {/* Grille de fond de l'oscilloscope */}
        <line x1="7" y1="66.5" x2="269" y2="66.5" stroke="#121e28" strokeWidth="0.8" />
        <line x1="138" y1="35" x2="138" y2="98" stroke="#121e28" strokeWidth="0.8" />
        <line x1="72" y1="35" x2="72" y2="98" stroke="#0e1720" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="204" y1="35" x2="204" y2="98" stroke="#0e1720" strokeWidth="0.5" strokeDasharray="2 2" />

        {/* Forme d'onde dynamique active */}
        <polyline
          points={renderVisualizerWaveform()}
          fill="none"
          stroke={isShift ? "#FF3A5D" : "#00ED95"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: isShift
              ? "drop-shadow(0 0 4px rgba(255, 58, 93, 0.75))"
              : "drop-shadow(0 0 4px rgba(0, 237, 149, 0.75))",
          }}
        />

        {/* Deuxième trace d'harmoniques */}
        <polyline
          points={renderVisualizerWaveform()}
          transform="translate(0, 2) scale(1, -0.4) translate(0, -66.5)"
          fill="none"
          stroke="#698EFF"
          strokeWidth="0.9"
          opacity="0.65"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px rgba(105, 142, 255, 0.5))" }}
        />

        {/* Indicateurs textuels dans les coins de l'oscilloscope (zones nettes sans dessin) */}
        <g opacity="0.8">
          <text x="12" y="43" fill="#698EFF" fontSize="3.4" fontFamily="monospace" fontWeight="700">DSP 44.1k</text>
          <text x="12" y="50" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">POLY 8</text>
          <text x="12" y="94" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">{isShift ? "PAGE 2 (SHIFT)" : "PAGE 1 (STD)"}</text>

          <text x="264" y="43" textAnchor="end" fill="#00ED95" fontSize="3.4" fontFamily="monospace" fontWeight="700">READY</text>
          <text x="264" y="50" textAnchor="end" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">24-BIT</text>
          <text x="264" y="94" textAnchor="end" fill="#DFD9FF" fontSize="3.2" fontFamily="monospace">STEREO BUS</text>
        </g>

        {/* Indicateur de Volume Master à droite (y=34..99) */}
        {(() => {
          const volH = 42;
          const volY = 44 + (1 - Math.max(0, Math.min(1, volume))) * volH;
          return (
            <g style={{ cursor: "ns-resize" }}>
              <rect x="276" y="34" width="38" height="65" rx="3" fill="#111820" stroke="#1f2d3a" strokeWidth="0.8" />
              <text x="295" y="42" textAnchor="middle" fill="#FF3A5D" fontSize="3.4" fontFamily="monospace" fontWeight="900">VOL</text>
              <line x1="295" y1="46" x2="295" y2="88" stroke="#2d1d24" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="295" y1={volY} x2="295" y2="88" stroke="#FF3A5D" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="295" cy={volY} r="3" fill="#FF3A5D" stroke="#ffffff" strokeWidth="0.8" />
              <text x="295" y="95" textAnchor="middle" fill="#FF3A5D" fontSize="3.4" fontFamily="monospace" fontWeight="bold">
                {Math.round(volume * 100)}%
              </text>
              <rect
                x="274"
                y="34"
                width="42"
                height="65"
                fill="transparent"
                onPointerDown={(e) => {
                  const onMove = (me: PointerEvent) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, 1 - (me.clientY - rect.top) / rect.height));
                    onVolumeChange?.(ratio);
                  };
                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
            </g>
          );
        })()}

        {/* ── ZONE INFÉRIEURE : 4 POTENTIOMÈTRES ROTATIFS OP-1 T1, T2, T3, T4 ─── */}
        {(["t1", "t2", "t3", "t4"] as const).map((knobId, index) => {
          const kDef = currentKnobsConfig[knobId];
          const kColor = knobColors[knobId];
          const kVal = activeParams[knobId];
          const kAngle = getKnobAngle(kVal, kDef.min, kDef.max);
          const kcx = 40 + index * 80;
          const kcy = 130;
          const kr = 13.5;

          // Aiguille
          const rad = (kAngle * Math.PI) / 180;
          const nx = kcx + kr * 0.7 * Math.sin(rad);
          const ny = kcy - kr * 0.7 * Math.cos(rad);

          const formattedValue = kDef.formatter ? kDef.formatter(kVal) : `${Math.round(kVal)}${kDef.unit || ""}`;

          return (
            <g
              key={`${knobId}-${isShift ? "shift" : "main"}`}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
                handleKnobStart(knobId, e.clientY);
              }}
              onWheel={(e) => handleWheel(knobId, e)}
            >
              <title>{`${kDef.name} : ${formattedValue} (Glisser verticalement ou molette)`}</title>

              {/* Boîte de fond encodeur */}
              <rect
                x={kcx - 36}
                y="104"
                width="72"
                height="51"
                rx="3"
                fill="#0d141a"
                stroke={activeDraggingKnob === knobId ? kColor : isShift ? "#33222a" : "#1a2734"}
                strokeWidth={activeDraggingKnob === knobId ? "1.2" : "0.8"}
              />

              {/* Titre Encodeur & Nom de Paramètre */}
              <text x={kcx} y="112" textAnchor="middle" fill={kColor} fontSize="4.2" fontFamily="monospace" fontWeight="900" letterSpacing="0.4">
                {`T${index + 1}${isShift ? " ⇧" : ""} · ${kDef.name}`}
              </text>

              {/* Potentiomètre extérieur */}
              <circle cx={kcx} cy={kcy} r={kr} fill="#070c10" stroke={kColor} strokeWidth="1.2" />
              <circle cx={kcx} cy={kcy} r={kr * 0.75} fill="#14202c" stroke="#253b4f" strokeWidth="0.6" />

              {/* Arc de graduation */}
              <circle cx={kcx} cy={kcy} r={kr + 2.5} fill="none" stroke="#1f3140" strokeWidth="0.8" strokeDasharray="1.5 2.5" />

              {/* Aiguille rotative colorée */}
              <line x1={kcx} y1={kcy} x2={nx} y2={ny} stroke={kColor} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx={nx} cy={ny} r="1.3" fill="#ffffff" />
              <circle cx={kcx} cy={kcy} r="2.2" fill="#ffffff" />

              {/* Valeur formatée sous le potentiomètre */}
              <text x={kcx} y="151.5" textAnchor="middle" fill="#ffffff" fontSize="4.4" fontFamily="monospace" fontWeight="bold">
                {formattedValue}
              </text>
            </g>
          );
        })}

        {/* ── SUPERPOSITION DU MENU DE SON (MOTEURS & PATCHES) ── */}
        {isMenuOpen && (
          <StudioSoundMenuOverlay
            selectedEngine={engineId}
            selectedPatch={patchName}
            onEngineChange={(eng) => onEngineChange?.(eng)}
            onPatchChange={(ptc) => onPatchChange?.(ptc)}
            onClose={() => {
              setLocalMenuOpen(false);
              onCloseSoundMenu?.();
            }}
            onNotice={onNotice}
          />
        )}

        {/* Contour net de l'écran OLED */}
        <rect x="1" y="1" width="318" height="158" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.2" style={{ pointerEvents: "none" }} />
      </svg>
    </div>
  );
}
