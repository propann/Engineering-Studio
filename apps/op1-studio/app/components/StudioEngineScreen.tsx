/**
 * StudioEngineScreen.tsx — Écran OLED 320×160 dédié aux réglages des moteurs audio de l'OP-1.
 *
 * Affiche l'interface graphique de synthèse en temps réel :
 * - Visualiseur oscilloscopique / spectral / forme d'onde réactif
 * - 4 encodeurs rotatifs T1 (Bleu), T2 (Vert), T3 (Blanc), T4 (Rouge) avec libellés et valeurs
 * - Navigation instantanée entre modes SYNTH, DRUM et TAPE
 */

import { useRef, useState, useEffect } from "react";
import { getEngineKnobsConfig, type EngineKnobsConfig } from "../lib/engineKnobsData";
import { op1AudioEngine } from "../lib/op1SynthEngine";

export interface StudioEngineScreenProps {
  engineId: string;
  engineName: string;
  patchName: string;
  patchCategory?: string;
  machineMode: "synth" | "drum" | "tape";
  onMachineModeChange: (mode: "synth" | "drum" | "tape") => void;
  onOpenSoundMenu?: () => void;
  onOpenTapeView?: () => void;
  onNotice?: (msg: string) => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
}

export function StudioEngineScreen({
  engineId,
  engineName,
  patchName,
  patchCategory = "LEAD",
  machineMode,
  onMachineModeChange,
  onOpenSoundMenu,
  onOpenTapeView,
  onNotice,
  volume = 0.85,
  onVolumeChange,
}: StudioEngineScreenProps) {
  const config = getEngineKnobsConfig(engineId);
  const [params, setParams] = useState({
    t1: config.t1.defaultValue,
    t2: config.t2.defaultValue,
    t3: config.t3.defaultValue,
    t4: config.t4.defaultValue,
  });

  // Recharger les valeurs par défaut au changement de moteur
  useEffect(() => {
    const currentConfig = getEngineKnobsConfig(engineId);
    const initialParams = {
      t1: currentConfig.t1.defaultValue,
      t2: currentConfig.t2.defaultValue,
      t3: currentConfig.t3.defaultValue,
      t4: currentConfig.t4.defaultValue,
    };
    setParams(initialParams);
    op1AudioEngine.setEngineParam("t1", initialParams.t1);
    op1AudioEngine.setEngineParam("t2", initialParams.t2);
    op1AudioEngine.setEngineParam("t3", initialParams.t3);
    op1AudioEngine.setEngineParam("t4", initialParams.t4);
  }, [engineId]);

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

  const handleKnobStart = (knob: "t1" | "t2" | "t3" | "t4", clientY: number) => {
    setActiveDraggingKnob(knob);
    dragStartYRef.current = clientY;
    dragStartValRef.current = params[knob];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggingKnob) return;
    const deltaY = dragStartYRef.current - e.clientY;
    const kDef = config[activeDraggingKnob];
    const range = kDef.max - kDef.min;
    const step = kDef.step || 1;
    const change = (deltaY / 120) * range;
    const rawVal = Math.max(kDef.min, Math.min(kDef.max, dragStartValRef.current + change));
    const quantizedVal = Math.round(rawVal / step) * step;

    setParams((prev) => {
      const next = { ...prev, [activeDraggingKnob]: quantizedVal };
      op1AudioEngine.setEngineParam(activeDraggingKnob, quantizedVal);
      return next;
    });
  };

  const handlePointerUp = () => {
    setActiveDraggingKnob(null);
  };

  const handleWheel = (knob: "t1" | "t2" | "t3" | "t4", e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const kDef = config[knob];
    const step = kDef.step || 1;
    const dir = e.deltaY < 0 ? 1 : -1;
    const rawVal = Math.max(kDef.min, Math.min(kDef.max, params[knob] + dir * step));
    const quantizedVal = Math.round(rawVal / step) * step;

    setParams((prev) => {
      const next = { ...prev, [knob]: quantizedVal };
      op1AudioEngine.setEngineParam(knob, quantizedVal);
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
  const renderVisualizerWaveform = () => {
    const w = 180;
    const h = 52;
    const cx = 160;
    const cy = 60;
    const points: string[] = [];

    const numPoints = 48;
    const t1Factor = (params.t1 - config.t1.min) / (config.t1.max - config.t1.min || 1);
    const t2Factor = params.t2 / 100;
    const t3Factor = params.t3 / 100;
    const t4Factor = params.t4 / 100;

    for (let i = 0; i <= numPoints; i++) {
      const xRatio = i / numPoints;
      const x = cx - w / 2 + xRatio * w;
      const freq1 = 2 + t1Factor * 4;
      const freq2 = 4 + t3Factor * 6;
      const yNorm =
        Math.sin(xRatio * Math.PI * freq1 + animPhase) * (0.5 * t2Factor) +
        Math.sin(xRatio * Math.PI * freq2 - animPhase * 1.5) * (0.35 * t3Factor) +
        Math.cos(xRatio * Math.PI * 8 + animPhase * 0.8) * (0.15 * t4Factor);

      const y = cy + yNorm * (h / 2 - 4);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return points.join(" ");
  };

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

        {/* ── BARRE DE TITRE SUPÉRIEURE ──────────────────────────────────────── */}
        <rect x="3" y="3" width="314" height="17" rx="3" fill="#121820" stroke="#1f2c38" strokeWidth="0.8" />

        {/* Badge Mode (SYNTH / DRUM) */}
        <g
          style={{ cursor: "pointer" }}
          onClick={() => onMachineModeChange(machineMode === "synth" ? "drum" : "synth")}
          role="button"
          aria-label="Basculer le mode SYNTH / DRUM"
        >
          <rect x="6" y="5.5" width="32" height="12" rx="2" fill={machineMode === "synth" ? "#698EFF" : "#FF3A5D"} />
          <text x="22" y="14" textAnchor="middle" fill="#0a0f14" fontSize="4.6" fontFamily="monospace" fontWeight="900">
            {machineMode.toUpperCase()}
          </text>
        </g>

        {/* Nom du Moteur Sonore */}
        <text x="44" y="14.2" fill="#698EFF" fontSize="4.6" fontFamily="monospace" fontWeight="900" letterSpacing="0.4">
          {engineName.toUpperCase()}
        </text>

        {/* Nom du Patch & Catégorie */}
        <text x="160" y="14" textAnchor="middle" fill="#f1f5f9" fontSize="4.4" fontFamily="monospace" fontWeight="700">
          {patchName.length > 28 ? `${patchName.slice(0, 26)}…` : patchName}
        </text>

        {/* Badge Catégorie */}
        <rect x="252" y="6" width="32" height="11" rx="2" fill="#1c2b36" stroke="#2c4254" strokeWidth="0.5" />
        <text x="268" y="13.6" textAnchor="middle" fill="#00ED95" fontSize="3.6" fontFamily="monospace" fontWeight="700">
          {patchCategory.toUpperCase()}
        </text>

        {/* Bouton Tape View rapide (K7) */}
        <g
          style={{ cursor: "pointer" }}
          onClick={onOpenTapeView}
          role="button"
          aria-label="Basculer vers la vue Bande 4 Pistes"
        >
          <rect x="288" y="5.5" width="26" height="12" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          <text x="301" y="13.8" textAnchor="middle" fill="#DFD9FF" fontSize="3.8" fontFamily="monospace" fontWeight="800">
            📼 TAPE
          </text>
        </g>

        {/* ── ZONE CENTRALE : VISUALISEUR GRAPHIQUE OSCILLOSCOPE ─────────────── */}
        {/* Cadre de l'oscilloscope */}
        <rect x="52" y="24" width="216" height="74" rx="4" fill="#06090c" stroke="#1a2530" strokeWidth="1" />
        <rect x="53" y="25" width="214" height="72" rx="3" fill="none" stroke="#243746" strokeWidth="0.4" strokeDasharray="3 3" />

        {/* Grille de fond de l'oscilloscope */}
        <line x1="53" y1="61" x2="267" y2="61" stroke="#121e28" strokeWidth="0.8" />
        <line x1="160" y1="25" x2="160" y2="97" stroke="#121e28" strokeWidth="0.8" />
        <line x1="106" y1="25" x2="106" y2="97" stroke="#0e1720" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="214" y1="25" x2="214" y2="97" stroke="#0e1720" strokeWidth="0.5" strokeDasharray="2 2" />

        {/* Forme d'onde dynamique active */}
        <polyline
          points={renderVisualizerWaveform()}
          fill="none"
          stroke="#00ED95"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(0, 237, 149, 0.75))" }}
        />

        {/* Deuxième trace d'harmoniques (Bleue) */}
        <polyline
          points={renderVisualizerWaveform()}
          transform="translate(0, 2) scale(1, -0.4) translate(0, -60)"
          fill="none"
          stroke="#698EFF"
          strokeWidth="0.9"
          opacity="0.65"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px rgba(105, 142, 255, 0.5))" }}
        />

        {/* Indicateurs latéraux à gauche & droite de l'oscilloscope */}
        <g opacity="0.75">
          <text x="56" y="32" fill="#4b6b88" fontSize="3.4" fontFamily="monospace" fontWeight="700">OSC 1</text>
          <text x="56" y="40" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">44.1k</text>
          <text x="56" y="93" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">POLY 8</text>

          <text x="263" y="32" textAnchor="end" fill="#00ED95" fontSize="3.4" fontFamily="monospace" fontWeight="700">ACTIVE</text>
          <text x="263" y="40" textAnchor="end" fill="#4b6b88" fontSize="3.2" fontFamily="monospace">24-BIT</text>
          <text x="263" y="93" textAnchor="end" fill="#FF3A5D" fontSize="3.2" fontFamily="monospace">L/R STEREO</text>
        </g>

        {/* Bouton de navigation vers les banques de sons / patchs */}
        <g
          style={{ cursor: "pointer" }}
          onClick={onOpenSoundMenu}
          role="button"
          aria-label="Ouvrir la liste des patches"
        >
          <rect x="6" y="36" width="38" height="24" rx="3" fill="#13202d" stroke="#253e54" strokeWidth="0.8" />
          <text x="25" y="47" textAnchor="middle" fill="#698EFF" fontSize="3.8" fontFamily="monospace" fontWeight="900">
            PATCHS
          </text>
          <text x="25" y="55" textAnchor="middle" fill="#00ED95" fontSize="3.2" fontFamily="monospace" fontWeight="700">
            LISTE ▼
          </text>
        </g>

        {/* Indicateur de Volume Master à droite */}
        {(() => {
          const volH = 48;
          const volY = 36 + (1 - Math.max(0, Math.min(1, volume))) * volH;
          return (
            <g style={{ cursor: "ns-resize" }}>
              <rect x="278" y="30" width="36" height="64" rx="3" fill="#111820" stroke="#1f2d3a" strokeWidth="0.8" />
              <text x="296" y="38" textAnchor="middle" fill="#FF3A5D" fontSize="3.4" fontFamily="monospace" fontWeight="900">VOL</text>
              <line x1="296" y1="42" x2="296" y2="84" stroke="#2d1d24" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="296" y1={volY} x2="296" y2="84" stroke="#FF3A5D" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="296" cy={volY} r="3" fill="#FF3A5D" stroke="#ffffff" strokeWidth="0.8" />
              <text x="296" y="91" textAnchor="middle" fill="#FF3A5D" fontSize="3.4" fontFamily="monospace" fontWeight="bold">
                {Math.round(volume * 100)}%
              </text>
              <rect
                x="276"
                y="30"
                width="40"
                height="64"
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
          const kDef = config[knobId];
          const kColor = knobColors[knobId];
          const kVal = params[knobId];
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
              key={knobId}
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
                stroke={activeDraggingKnob === knobId ? kColor : "#1a2734"}
                strokeWidth={activeDraggingKnob === knobId ? "1.2" : "0.8"}
              />

              {/* Titre Encodeur & Nom de Paramètre */}
              <text x={kcx} y="112" textAnchor="middle" fill={kColor} fontSize="4.2" fontFamily="monospace" fontWeight="900" letterSpacing="0.4">
                {`T${index + 1} · ${kDef.name}`}
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

        {/* Contour net de l'écran OLED */}
        <rect x="1" y="1" width="318" height="158" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.2" style={{ pointerEvents: "none" }} />
      </svg>
    </div>
  );
}
