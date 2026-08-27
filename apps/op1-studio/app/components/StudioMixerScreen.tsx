/**
 * StudioMixerScreen.tsx — Écran OLED 320×160 dédié au Mixeur 4 Pistes de l'OP-1.
 *
 * Affiche l'interface du mixeur 4 pistes en temps réel :
 * - 4 tranches de mixage colorées (T1 Bleu, T2 Vert, T3 Blanc, T4 Rouge)
 * - Faders de volume / gain interactifs et VU-mètres de niveau
 * - Boutons Mute, Solo et Panoramique
 * - 4 encodeurs T1-T4 sous l'écran pour ajuster les gains
 * - Bouton toujours visible "📼 RETOUR BANDE (TAPE)" et sélecteur de mode
 */

import { useState } from "react";

export interface StudioMixerScreenProps {
  tracks: string[];
  files: Record<number, string>;
  gains: Record<number, number>;
  muted: Record<number, boolean>;
  solo: number | null;
  selectedTrack: number;
  onGainChange: (trackIdx: number, gain: number) => void;
  onMuteToggle: (trackIdx: number) => void;
  onSoloToggle: (trackIdx: number) => void;
  onSelectTrack: (trackIdx: number) => void;
  onMachineModeChange: (mode: "synth" | "drum" | "tape" | "mixer" | "effects" | "browser") => void;
  onOpenTapeView: () => void;
  onNotice?: (msg: string) => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
}

const TRACK_COLORS = ["#698EFF", "#00ED95", "#DFD9FF", "#FF3A5D"] as const;

export function StudioMixerScreen({
  tracks,
  files,
  gains,
  muted,
  solo,
  selectedTrack,
  onGainChange,
  onMuteToggle,
  onSoloToggle,
  onSelectTrack,
  onMachineModeChange,
  onOpenTapeView,
  onNotice,
  volume = 0.85,
  onVolumeChange,
}: StudioMixerScreenProps) {
  const [activeKnobDrag, setActiveKnobDrag] = useState<number | null>(null);

  // Valeurs de panoramique locales (-1 gauche à +1 droite)
  const [pans, setPans] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  const handleGainWheel = (trackIdx: number, e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = gains[trackIdx] ?? 1;
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const next = Math.max(0, Math.min(1.5, Math.round((current + delta) * 100) / 100));
    onGainChange(trackIdx, next);
    onNotice?.(`Piste ${trackIdx + 1} Gain : ${Math.round(next * 100)}%`);
  };

  return (
    <div className="op1-mixer-screen-container" style={{ position: "relative" }}>
      <svg
        viewBox="0 0 320 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block", cursor: "default" }}
      >
        {/* Fond OLED noir profond */}
        <rect width="320" height="160" fill="#090d10" />

        {/* ── BARRE SUPÉRIEURE DE NAVIGATION OP-1 ────────────────────────────── */}
        <rect x="3" y="3" width="314" height="17" rx="3" fill="#121820" stroke="#1f2c38" strokeWidth="0.8" />

        {/* Onglets de mode dans l'écran */}
        <g transform="translate(6, 5.5)">
          {[
            { id: "synth", label: "SYNTH", color: "#698EFF" },
            { id: "drum", label: "DRUM", color: "#FF3A5D" },
            { id: "tape", label: "TAPE", color: "#DFD9FF" },
            { id: "mixer", label: "MIXER", color: "#00ED95" },
            { id: "effects", label: "FX", color: "#e8a020" },
            { id: "browser", label: "PATCHS", color: "#94a3b8" },
          ].map((item, idx) => {
            const isActive = item.id === "mixer";
            return (
              <g
                key={item.id}
                transform={`translate(${idx * 38}, 0)`}
                style={{ cursor: "pointer" }}
                onClick={() => onMachineModeChange(item.id as any)}
                role="button"
                aria-label={`Passer au mode ${item.label}`}
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
          aria-label="Retour direct à l'écran de la bande Tape"
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

        {/* ── 4 TRANCHES DE MIXEUR DE PISTE ──────────────────────────────────── */}
        {[0, 1, 2, 3].map((trackIdx) => {
          const color = TRACK_COLORS[trackIdx];
          const hasAudio = Boolean(files[trackIdx]);
          const gain = gains[trackIdx] ?? 1;
          const isMuted = muted[trackIdx] === true;
          const isSolo = solo === trackIdx;
          const isSelected = selectedTrack === trackIdx;
          const pan = pans[trackIdx] ?? 0;

          const colX = 8 + trackIdx * 64;
          const colW = 60;
          const colY = 24;
          const colH = 74;

          // Hauteur du curseur fader (colY+20 à colY+55)
          const faderTop = colY + 16;
          const faderH = 36;
          const faderY = faderTop + (1 - Math.min(1.5, gain) / 1.5) * faderH;

          return (
            <g
              key={trackIdx}
              onClick={() => onSelectTrack(trackIdx)}
              style={{ cursor: "pointer" }}
            >
              {/* Boîtier de la piste */}
              <rect
                x={colX}
                y={colY}
                width={colW}
                height={colH}
                rx="3"
                fill={isSelected ? "#101822" : "#0c1218"}
                stroke={isSelected ? color : "#1a2530"}
                strokeWidth={isSelected ? "1.2" : "0.7"}
              />

              {/* En-tête Piste */}
              <rect x={colX + 2} y={colY + 2} width={colW - 4} height="10" rx="2" fill="#141e28" />
              <text
                x={colX + 6}
                y={colY + 9}
                fill={color}
                fontSize="4.4"
                fontFamily="monospace"
                fontWeight="900"
              >
                {`TRK ${trackIdx + 1}`}
              </text>
              <circle
                cx={colX + colW - 8}
                cy={colY + 7}
                r="2.5"
                fill={hasAudio ? "#00ED95" : "#334155"}
              />

              {/* Ligne Fader de Gain */}
              <line
                x1={colX + 20}
                y1={faderTop}
                x2={colX + 20}
                y2={faderTop + faderH}
                stroke="#1b2834"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={colX + 20}
                y1={faderY}
                x2={colX + 20}
                y2={faderTop + faderH}
                stroke={isMuted ? "#475569" : color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Poignée du fader */}
              <rect
                x={colX + 13}
                y={faderY - 3}
                width="14"
                height="6"
                rx="1.5"
                fill="#ffffff"
                stroke="#090d10"
                strokeWidth="0.8"
              />

              {/* Graduation VU-mètre à droite du fader */}
              <g transform={`translate(${colX + 32}, ${faderTop})`}>
                {[0, 1, 2, 3, 4, 5, 6].map((step) => {
                  const sY = (step / 6) * faderH;
                  const stepColor = step < 2 ? "#FF3A5D" : step < 4 ? "#e8a020" : "#00ED95";
                  const active = hasAudio && !isMuted && gain > (6 - step) / 6;
                  return (
                    <rect
                      key={step}
                      x="0"
                      y={sY}
                      width="5"
                      height="3.5"
                      rx="0.5"
                      fill={active ? stepColor : "#151f28"}
                    />
                  );
                })}
              </g>

              {/* Bouton Mute */}
              <g
                transform={`translate(${colX + 42}, ${colY + 16})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMuteToggle(trackIdx);
                }}
              >
                <rect
                  x="0"
                  y="0"
                  width="14"
                  height="9"
                  rx="1.5"
                  fill={isMuted ? "#FF3A5D" : "#17222c"}
                  stroke={isMuted ? "#ffffff" : "#283848"}
                  strokeWidth="0.5"
                />
                <text
                  x="7"
                  y="6.5"
                  textAnchor="middle"
                  fill={isMuted ? "#ffffff" : "#94a3b8"}
                  fontSize="3.4"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  M
                </text>
              </g>

              {/* Bouton Solo */}
              <g
                transform={`translate(${colX + 42}, ${colY + 28})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSoloToggle(trackIdx);
                }}
              >
                <rect
                  x="0"
                  y="0"
                  width="14"
                  height="9"
                  rx="1.5"
                  fill={isSolo ? "#00ED95" : "#17222c"}
                  stroke={isSolo ? "#ffffff" : "#283848"}
                  strokeWidth="0.5"
                />
                <text
                  x="7"
                  y="6.5"
                  textAnchor="middle"
                  fill={isSolo ? "#090d10" : "#94a3b8"}
                  fontSize="3.4"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  S
                </text>
              </g>

              {/* Panoramique L-C-R */}
              <g
                transform={`translate(${colX + 4}, ${colY + 57})`}
                onClick={(e) => {
                  e.stopPropagation();
                  const nextPan = pan === 0 ? -0.7 : pan < 0 ? 0.7 : 0;
                  setPans((prev) => ({ ...prev, [trackIdx]: nextPan }));
                }}
              >
                <rect x="0" y="0" width="52" height="13" rx="2" fill="#121a22" stroke="#1f2c38" strokeWidth="0.6" />
                <text x="26" y="9" textAnchor="middle" fill="#94a3b8" fontSize="3.6" fontFamily="monospace">
                  {pan === 0 ? "PAN: CTR" : pan < 0 ? `PAN: L${Math.round(Math.abs(pan) * 100)}` : `PAN: R${Math.round(pan * 100)}`}
                </text>
              </g>

              {/* Zone invisible d'interaction glisser/molette sur le fader */}
              <rect
                x={colX}
                y={colY + 14}
                width="34"
                height={colH - 14}
                fill="transparent"
                onWheel={(e) => handleGainWheel(trackIdx, e)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const startY = e.clientY;
                  const startGain = gain;
                  const onMove = (me: PointerEvent) => {
                    const delta = (startY - me.clientY) / (rect.height * 0.8);
                    const next = Math.max(0, Math.min(1.5, Math.round((startGain + delta * 1.5) * 100) / 100));
                    onGainChange(trackIdx, next);
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
        })}

        {/* Section Master Level à droite */}
        <g transform="translate(268, 24)">
          <rect x="0" y="0" width="46" height="74" rx="3" fill="#0d141b" stroke="#1f2d3a" strokeWidth="0.8" />
          <rect x="2" y="2" width="42" height="10" rx="2" fill="#17222e" />
          <text x="23" y="9" textAnchor="middle" fill="#FF3A5D" fontSize="4.2" fontFamily="monospace" fontWeight="900">
            MASTER
          </text>
          {/* Ligne Master Volume */}
          {(() => {
            const mH = 38;
            const mY = 16 + (1 - Math.max(0, Math.min(1, volume))) * mH;
            return (
              <>
                <line x1="23" y1="16" x2="23" y2="54" stroke="#2a161e" strokeWidth="3" strokeLinecap="round" />
                <line x1="23" y1={mY} x2="23" y2="54" stroke="#FF3A5D" strokeWidth="3" strokeLinecap="round" />
                <rect x="16" y={mY - 3} width="14" height="6" rx="1.5" fill="#ffffff" stroke="#FF3A5D" strokeWidth="0.8" />
                <text x="23" y="67" textAnchor="middle" fill="#FF3A5D" fontSize="4.2" fontFamily="monospace" fontWeight="bold">
                  {Math.round(volume * 100)}%
                </text>
                <rect
                  x="0"
                  y="14"
                  width="46"
                  height="54"
                  fill="transparent"
                  style={{ cursor: "ns-resize" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const onMove = (me: PointerEvent) => {
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
              </>
            );
          })()}
        </g>

        {/* ── ZONE INFÉRIEURE : 4 ENCODEURS T1, T2, T3, T4 GAIN PISTE 1-4 ─────── */}
        {[0, 1, 2, 3].map((trackIdx) => {
          const color = TRACK_COLORS[trackIdx];
          const gain = gains[trackIdx] ?? 1;
          const kcx = 40 + trackIdx * 80;
          const kcy = 130;
          const kr = 13.5;

          const progress = Math.max(0, Math.min(1, gain / 1.5));
          const angle = progress * 270 - 135;
          const rad = (angle * Math.PI) / 180;
          const nx = kcx + kr * 0.7 * Math.sin(rad);
          const ny = kcy - kr * 0.7 * Math.cos(rad);

          return (
            <g
              key={trackIdx}
              style={{ cursor: "pointer" }}
              onWheel={(e) => handleGainWheel(trackIdx, e)}
              onPointerDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const startGain = gain;
                const onMove = (me: PointerEvent) => {
                  const delta = (startY - me.clientY) / 100;
                  const next = Math.max(0, Math.min(1.5, Math.round((startGain + delta * 1.5) * 100) / 100));
                  onGainChange(trackIdx, next);
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
                stroke={color}
                strokeWidth="0.8"
              />
              <text x={kcx} y="112" textAnchor="middle" fill={color} fontSize="4.2" fontFamily="monospace" fontWeight="900">
                {`T${trackIdx + 1} · GAIN TRK ${trackIdx + 1}`}
              </text>
              <circle cx={kcx} cy={kcy} r={kr} fill="#070c10" stroke={color} strokeWidth="1.2" />
              <circle cx={kcx} cy={kcy} r={kr * 0.75} fill="#14202c" stroke="#253b4f" strokeWidth="0.6" />
              <circle cx={kcx} cy={kcy} r={kr + 2.5} fill="none" stroke="#1f3140" strokeWidth="0.8" strokeDasharray="1.5 2.5" />
              <line x1={kcx} y1={kcy} x2={nx} y2={ny} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
              <circle cx={nx} cy={ny} r="1.3" fill="#ffffff" />
              <circle cx={kcx} cy={kcy} r="2.2" fill="#ffffff" />
              <text x={kcx} y="151.5" textAnchor="middle" fill="#ffffff" fontSize="4.4" fontFamily="monospace" fontWeight="bold">
                {Math.round(gain * 100)}%
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
