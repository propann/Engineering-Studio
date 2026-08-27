/**
 * StudioBrowserScreen.tsx — Navigateur et bibliothèque de patchs intégrés dans l'écran OLED 320×160.
 *
 * Permet d'explorer, tester et charger les 15 moteurs et 91+ patches directement dans l'écran :
 * - Sélecteur de Moteurs Sonores (Plaits, Braids, Rings, FM, Phase, String, Pulse, Digital, Cluster, Dsay, Dr Wave, Drum, etc.)
 * - Liste des patches avec catégories (Lead, Bass, Pad, Keys, Pluck, Percs, FX)
 * - Bouton direct "📼 RETOUR BANDE (TAPE)"
 */

import { useState } from "react";
import { RACK_ENGINES_METAS, getPatchesForEngine, getEngineMeta } from "../lib/soundEnginesData";

export interface StudioBrowserScreenProps {
  selectedEngine: string;
  selectedPatch: string;
  onEngineChange: (engine: string) => void;
  onPatchChange: (patch: string) => void;
  onMachineModeChange: (mode: "synth" | "drum" | "tape" | "mixer" | "effects" | "browser") => void;
  onOpenTapeView: () => void;
  onNotice?: (msg: string) => void;
}

export function StudioBrowserScreen({
  selectedEngine,
  selectedPatch,
  onEngineChange,
  onPatchChange,
  onMachineModeChange,
  onOpenTapeView,
  onNotice,
}: StudioBrowserScreenProps) {
  const [engineIdx, setEngineIdx] = useState(() => {
    const idx = RACK_ENGINES_METAS.findIndex((e) => e.id === selectedEngine);
    return idx >= 0 ? idx : 0;
  });
  const [patchScroll, setPatchScroll] = useState(0);

  const currentEngineMeta = RACK_ENGINES_METAS[engineIdx] || RACK_ENGINES_METAS[0];
  const patches = getPatchesForEngine(currentEngineMeta.id);

  const handlePrevEngine = () => {
    const nextIdx = (engineIdx - 1 + RACK_ENGINES_METAS.length) % RACK_ENGINES_METAS.length;
    setEngineIdx(nextIdx);
    const eng = RACK_ENGINES_METAS[nextIdx];
    onEngineChange(eng.id);
    const pts = getPatchesForEngine(eng.id);
    if (pts.length > 0) onPatchChange(pts[0].name);
    setPatchScroll(0);
  };

  const handleNextEngine = () => {
    const nextIdx = (engineIdx + 1) % RACK_ENGINES_METAS.length;
    setEngineIdx(nextIdx);
    const eng = RACK_ENGINES_METAS[nextIdx];
    onEngineChange(eng.id);
    const pts = getPatchesForEngine(eng.id);
    if (pts.length > 0) onPatchChange(pts[0].name);
    setPatchScroll(0);
  };

  return (
    <div className="op1-browser-screen-container" style={{ position: "relative" }}>
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
            const isActive = item.id === "browser";
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

        {/* ── COLONNE GAUCHE : SÉLECTEUR DE MOTEUR SONORE ───────────────────── */}
        <g transform="translate(6, 24)">
          <rect x="0" y="0" width="120" height="74" rx="3" fill="#0d141c" stroke="#1f2d3a" strokeWidth="0.8" />
          <rect x="2" y="2" width="116" height="11" rx="2" fill="#16222f" />
          <text x="60" y="9.5" textAnchor="middle" fill="#698EFF" fontSize="4.2" fontFamily="monospace" fontWeight="900">
            MOTEUR [{engineIdx + 1}/{RACK_ENGINES_METAS.length}]
          </text>

          {/* Boutons Gauche / Droite pour changer de moteur */}
          <g
            transform="translate(4, 18)"
            style={{ cursor: "pointer" }}
            onClick={handlePrevEngine}
          >
            <rect x="0" y="0" width="14" height="24" rx="2" fill="#1b2836" stroke="#2c4258" strokeWidth="0.6" />
            <text x="7" y="15" textAnchor="middle" fill="#DFD9FF" fontSize="6" fontFamily="monospace" fontWeight="bold">◀</text>
          </g>

          <g transform="translate(22, 18)">
            <rect x="0" y="0" width="76" height="24" rx="2" fill="#111a24" stroke="#233546" strokeWidth="0.6" />
            <text x="38" y="11" textAnchor="middle" fill="#00ED95" fontSize="4.4" fontFamily="monospace" fontWeight="900">
              {currentEngineMeta.label.toUpperCase()}
            </text>
            <text x="38" y="19" textAnchor="middle" fill="#94a3b8" fontSize="3.2" fontFamily="monospace">
              {currentEngineMeta.type.toUpperCase()}
            </text>
          </g>

          <g
            transform="translate(102, 18)"
            style={{ cursor: "pointer" }}
            onClick={handleNextEngine}
          >
            <rect x="0" y="0" width="14" height="24" rx="2" fill="#1b2836" stroke="#2c4258" strokeWidth="0.6" />
            <text x="7" y="15" textAnchor="middle" fill="#DFD9FF" fontSize="6" fontFamily="monospace" fontWeight="bold">▶</text>
          </g>

          {/* Description rapide du moteur */}
          <text x="6" y="52" fill="#64748b" fontSize="3.2" fontFamily="monospace">
            {currentEngineMeta.description.length > 34 ? `${currentEngineMeta.description.slice(0, 32)}…` : currentEngineMeta.description}
          </text>
          <text x="6" y="62" fill="#4b6b88" fontSize="3.0" fontFamily="monospace">
            {`${patches.length} presets disponibles`}
          </text>
          <g
            transform="translate(6, 60)"
            style={{ cursor: "pointer" }}
            onClick={() => onMachineModeChange(currentEngineMeta.label.toLowerCase().includes("drum") ? "drum" : "synth")}
          >
            <rect x="62" y="-3" width="48" height="13" rx="2" fill="#00ED95" />
            <text x="86" y="5.5" textAnchor="middle" fill="#090d10" fontSize="3.8" fontFamily="monospace" fontWeight="900">
              JOUER ▶
            </text>
          </g>
        </g>

        {/* ── COLONNE DROITE : LISTE DES PATCHES ─────────────────────────────── */}
        <g transform="translate(132, 24)">
          <rect x="0" y="0" width="182" height="74" rx="3" fill="#0d141c" stroke="#1f2d3a" strokeWidth="0.8" />
          <rect x="2" y="2" width="178" height="11" rx="2" fill="#16222f" />
          <text x="91" y="9.5" textAnchor="middle" fill="#00ED95" fontSize="4.2" fontFamily="monospace" fontWeight="900">
            BANQUE DE PATCHES
          </text>

          {/* Liste des 4 patches visibles selon scroll */}
          {patches.slice(patchScroll, patchScroll + 4).map((patch, idx) => {
            const isSelected = selectedPatch === patch.name && selectedEngine === currentEngineMeta.id;
            const rowY = 16 + idx * 13.5;
            return (
              <g
                key={patch.name}
                transform={`translate(4, ${rowY})`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  onEngineChange(currentEngineMeta.id);
                  onPatchChange(patch.name);
                  onNotice?.(`Patch chargé : ${patch.name}`);
                }}
              >
                <rect
                  x="0"
                  y="0"
                  width="174"
                  height="12"
                  rx="2"
                  fill={isSelected ? "#1e3346" : "#111822"}
                  stroke={isSelected ? "#00ED95" : "#1b2938"}
                  strokeWidth={isSelected ? "1" : "0.5"}
                />
                <text
                  x="6"
                  y="8"
                  fill={isSelected ? "#00ED95" : "#f1f5f9"}
                  fontSize="3.8"
                  fontFamily="monospace"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {patch.name.length > 22 ? `${patch.name.slice(0, 20)}…` : patch.name}
                </text>
                <rect x="132" y="2" width="38" height="8" rx="1.5" fill="#172635" />
                <text
                  x="151"
                  y="7.5"
                  textAnchor="middle"
                  fill="#698EFF"
                  fontSize="3.0"
                  fontFamily="monospace"
                >
                  {patch.category.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── ZONE INFÉRIEURE : ENCODEURS T1-T4 POUR NAVIGATION RAPIDE ────────── */}
        {[
          { label: "T1 · MOTEUR -", color: "#698EFF", action: handlePrevEngine },
          { label: "T2 · MOTEUR +", color: "#00ED95", action: handleNextEngine },
          {
            label: "T3 · SCROLL HAUT",
            color: "#DFD9FF",
            action: () => setPatchScroll((p) => Math.max(0, p - 1)),
          },
          {
            label: "T4 · SCROLL BAS",
            color: "#FF3A5D",
            action: () => setPatchScroll((p) => Math.min(Math.max(0, patches.length - 4), p + 1)),
          },
        ].map((btn, idx) => {
          const kcx = 40 + idx * 80;
          return (
            <g
              key={idx}
              style={{ cursor: "pointer" }}
              onClick={btn.action}
            >
              <rect
                x={kcx - 36}
                y="104"
                width="72"
                height="51"
                rx="3"
                fill="#0d141a"
                stroke={btn.color}
                strokeWidth="0.8"
              />
              <text x={kcx} y="114" textAnchor="middle" fill={btn.color} fontSize="4.2" fontFamily="monospace" fontWeight="900">
                {btn.label}
              </text>
              <circle cx={kcx} cy={133} r="12" fill="#14202c" stroke={btn.color} strokeWidth="1" />
              <text x={kcx} y="137" textAnchor="middle" fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold">
                {idx < 2 ? (idx === 0 ? "◀" : "▶") : (idx === 2 ? "▲" : "▼")}
              </text>
            </g>
          );
        })}

        <rect x="1" y="1" width="318" height="158" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.2" style={{ pointerEvents: "none" }} />
      </svg>
    </div>
  );
}
