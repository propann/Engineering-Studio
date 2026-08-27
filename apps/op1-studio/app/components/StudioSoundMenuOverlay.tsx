/**
 * StudioSoundMenuOverlay.tsx — Menu intégré de sélection des Moteurs & Patches OP-1.
 *
 * S'affiche en superposition directe sur l'écran OLED 320×160 :
 * - Colonne gauche (Bleue) : 15 moteurs audio contrôlables au potentiomètre T1 Bleu ou au clic.
 * - Colonne droite (Verte) : Patches du moteur contrôlables au potentiomètre T2 Vert ou au clic.
 */

import React, { useState } from "react";
import {
  RACK_ENGINES_METAS,
  getPatchesForEngine,
  type EngineId,
} from "../lib/soundEnginesData";

export interface StudioSoundMenuOverlayProps {
  selectedEngine: string;
  selectedPatch: string;
  onEngineChange: (engineId: string) => void;
  onPatchChange: (patchName: string) => void;
  onClose: () => void;
  onNotice?: (msg: string) => void;
}

export function StudioSoundMenuOverlay({
  selectedEngine,
  selectedPatch,
  onEngineChange,
  onPatchChange,
  onClose,
  onNotice,
}: StudioSoundMenuOverlayProps) {
  const [hoveredEngineId, setHoveredEngineId] = useState<string | null>(null);
  const [hoveredPatchId, setHoveredPatchId] = useState<string | null>(null);

  const currentEngineIndex = Math.max(0, RACK_ENGINES_METAS.findIndex((m) => m.id === selectedEngine));
  const currentPatches = getPatchesForEngine(selectedEngine);
  const currentPatchIndex = Math.max(0, currentPatches.findIndex((p) => p.name === selectedPatch));

  function cycleEngine(direction: 1 | -1) {
    const nextIdx = (currentEngineIndex + direction + RACK_ENGINES_METAS.length) % RACK_ENGINES_METAS.length;
    const nextEngine = RACK_ENGINES_METAS[nextIdx];
    if (nextEngine) {
      onEngineChange(nextEngine.id);
      const patches = getPatchesForEngine(nextEngine.id);
      if (patches.length > 0) {
        onPatchChange(patches[0].name);
      }
      onNotice?.(`🔵 Moteur audio (T1 Bleu) : ${nextEngine.label}`);
    }
  }

  function cyclePatch(direction: 1 | -1) {
    if (currentPatches.length === 0) return;
    const nextIdx = (currentPatchIndex + direction + currentPatches.length) % currentPatches.length;
    const nextPatch = currentPatches[nextIdx];
    if (nextPatch) {
      onPatchChange(nextPatch.name);
      onNotice?.(`🟢 Patch audio (T2 Vert) : ${nextPatch.name}`);
    }
  }

  const winW = 200;
  const winH = 86;
  const winX = (320 - winW) / 2; // 60px centré
  const winY = 24; // Commence sous la barre supérieure (y=20)

  const visibleEngineCount = 4;
  const maxEngineOffset = Math.max(0, RACK_ENGINES_METAS.length - visibleEngineCount);
  const safeEngineOffset = Math.max(0, Math.min(maxEngineOffset, Math.min(currentEngineIndex, Math.max(0, currentEngineIndex - 1))));
  const visibleEngines = RACK_ENGINES_METAS.slice(safeEngineOffset, safeEngineOffset + visibleEngineCount);

  const engineProgress = RACK_ENGINES_METAS.length > 1 ? currentEngineIndex / (RACK_ENGINES_METAS.length - 1) : 0;
  const blueKnobAngle = engineProgress * 270 - 135;

  const visiblePatchCount = 4;
  const maxPatchOffset = Math.max(0, currentPatches.length - visiblePatchCount);
  const safePatchOffset = Math.max(0, Math.min(maxPatchOffset, Math.min(currentPatchIndex, Math.max(0, currentPatchIndex - 1))));
  const visiblePatches = currentPatches.slice(safePatchOffset, safePatchOffset + visiblePatchCount);

  const patchProgress = currentPatches.length > 1 ? currentPatchIndex / (currentPatches.length - 1) : 0;
  const greenKnobAngle = patchProgress * 270 - 135;

  const colW = 95;

  return (
    <g
      transform={`translate(${winX} ${winY})`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Fond sombre & double bordure OLED */}
      <rect
        x="0"
        y="0"
        width={winW}
        height={winH}
        rx="3"
        fill="#070c10"
        stroke="#1b2a36"
        strokeWidth="1.2"
        style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.95))" }}
      />
      <rect
        x="1.2"
        y="1.2"
        width={winW - 2.4}
        height={winH - 2.4}
        rx="2"
        fill="none"
        stroke="#2a3f50"
        strokeWidth="0.5"
      />

      {/* Barre de titre compacte */}
      <rect x="1.5" y="1.5" width={winW - 3} height="8.5" rx="1.5" fill="#0d1820" />
      <line x1="1.5" y1="10" x2={winW - 1.5} y2="10" stroke="#1b2a36" strokeWidth="0.7" />

      {/* Titre MOTEURS (Bleu) & PATCHES (Vert) */}
      <text x="5" y="7.2" fill="#698EFF" fontFamily="monospace" fontSize="3.6" fontWeight="900" letterSpacing="0.4">
        🔵 MOTEURS
      </text>
      <text x="38" y="7.2" fill="#4a657c" fontFamily="monospace" fontSize="3.2" fontWeight="700">
        &
      </text>
      <text x="44" y="7.2" fill="#00ED95" fontFamily="monospace" fontSize="3.6" fontWeight="900" letterSpacing="0.4">
        🟢 PATCHES
      </text>

      {/* Bouton Fermer (×) */}
      <g
        style={{ cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        role="button"
        aria-label="Fermer le menu de son"
      >
        <rect x={winW - 10} y="2.2" width="7.5" height="6" rx="1" fill="#2d171d" stroke="#5c2937" strokeWidth="0.4" />
        <text x={winW - 6.25} y="6.6" textAnchor="middle" fill="#ff5c7a" fontSize="4.5" fontWeight="900">×</text>
      </g>

      {/* ── COLONNE 1 (GAUCHE) : MOTEURS BLEUS AVEC POTENTIOMÈTRE BLEU T1 ── */}
      <g
        transform="translate(2.5 11)"
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cycleEngine(e.deltaY > 0 ? 1 : -1);
        }}
      >
        {/* En-tête Moteurs avec Potentiomètre BLEU */}
        <rect x="0" y="0" width={colW} height="12" rx="1.5" fill="#0c1825" stroke="#1d3855" strokeWidth="0.5" />
        <text x="3" y="5.5" fill="#698EFF" fontFamily="monospace" fontSize="3.2" fontWeight="900">
          MOTEUR ({RACK_ENGINES_METAS.length})
        </text>
        <text x="3" y="9.8" fill="#587ea0" fontFamily="monospace" fontSize="2.4" fontWeight="700">
          {`#${currentEngineIndex + 1}/${RACK_ENGINES_METAS.length}`}
        </text>

        {/* Potentiomètre Rotatif BLEU interactif T1 */}
        {(() => {
          const kcx = 66.5;
          const kcy = 6;
          const kr = 4.2;
          const rad = (blueKnobAngle * Math.PI) / 180;
          const nx = kcx + kr * 0.7 * Math.sin(rad);
          const ny = kcy - kr * 0.7 * Math.cos(rad);

          return (
            <g
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                cycleEngine(1);
              }}
            >
              <title>Potentiomètre BLEU (T1) : Tourner pour changer de moteur</title>
              <circle cx={kcx} cy={kcy} r={kr} fill="#0b1726" stroke="#698EFF" strokeWidth="0.7" />
              <circle cx={kcx} cy={kcy} r={kr * 0.75} fill="#142840" stroke="#254a73" strokeWidth="0.4" />
              <line x1={kcx} y1={kcy} x2={nx} y2={ny} stroke="#698EFF" strokeWidth="1" strokeLinecap="round" />
              <circle cx={kcx} cy={kcy} r="0.9" fill="#ffffff" />
              <circle cx={nx} cy={ny} r="0.6" fill="#ffffff" />
            </g>
          );
        })()}

        {/* Liste compacte des moteurs en BLEU */}
        {visibleEngines.map((meta, idx) => {
          const isActive = selectedEngine === meta.id;
          const isHovered = hoveredEngineId === meta.id;
          const rowY = 13 + idx * 10.5;
          return (
            <g
              key={meta.id}
              transform={`translate(0 ${rowY})`}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onEngineChange(meta.id);
                const patches = getPatchesForEngine(meta.id);
                if (patches.length > 0) {
                  onPatchChange(patches[0].name);
                }
                onNotice?.(`🔵 Moteur sélectionné : ${meta.label}`);
              }}
              onMouseEnter={() => setHoveredEngineId(meta.id)}
              onMouseLeave={() => setHoveredEngineId(null)}
            >
              <rect
                x="0"
                y="0"
                width={colW}
                height="9.5"
                rx="1.2"
                fill={isActive ? "#11263d" : isHovered ? "#0d1d2e" : "#08131e"}
                stroke={isActive ? "#698EFF" : isHovered ? "#3d6490" : "#132538"}
                strokeWidth={isActive ? "0.9" : "0.4"}
              />
              <circle cx="3.2" cy="4.7" r={isActive ? 1.4 : 0.9} fill={isActive ? "#698EFF" : "#2a4d70"} />
              <text
                x="6.5"
                y="6.2"
                fill={isActive ? "#ffffff" : isHovered ? "#bcd6f5" : "#89aecd"}
                fontFamily="monospace"
                fontSize="3.1"
                fontWeight={isActive ? "900" : "600"}
              >
                {meta.label.length > 11 ? meta.label.slice(0, 10) + "…" : meta.label}
              </text>
              <text
                x={colW - 2.5}
                y="6.2"
                textAnchor="end"
                fill={isActive ? "#698EFF" : "#4a7095"}
                fontFamily="monospace"
                fontSize="2.4"
                fontWeight="800"
              >
                {meta.category === "Eurorack" ? "MOD" : meta.category === "Synthèse FM" ? "FM" : meta.category === "Wavetable" ? "WT" : meta.category === "Acid Bassline" ? "303" : meta.category === "Échantillonneur" ? "SF2" : meta.category === "Analogique Moog" ? "MOOG" : "VA"}
              </text>
            </g>
          );
        })}
      </g>

      {/* Séparateur vertical médian */}
      <line x1={winW / 2} y1="11" x2={winW / 2} y2={winH - 2} stroke="#1b2a36" strokeWidth="0.7" />

      {/* ── COLONNE 2 (DROITE) : PATCHES VERTS AVEC POTENTIOMÈTRE VERT T2 ── */}
      <g
        transform={`translate(${winW / 2 + 1.5} 11)`}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cyclePatch(e.deltaY > 0 ? 1 : -1);
        }}
      >
        {/* En-tête Patches avec Potentiomètre VERT */}
        <rect x="0" y="0" width={colW} height="12" rx="1.5" fill="#0b1e16" stroke="#194833" strokeWidth="0.5" />
        <text x="3" y="5.5" fill="#00ED95" fontFamily="monospace" fontSize="3.2" fontWeight="900">
          PATCH ({currentPatches.length})
        </text>
        <text x="3" y="9.8" fill="#4d9978" fontFamily="monospace" fontSize="2.4" fontWeight="700">
          {`#${currentPatchIndex + 1}/${currentPatches.length}`}
        </text>

        {/* Potentiomètre Rotatif VERT interactif T2 */}
        {(() => {
          const kcx = 66.5;
          const kcy = 6;
          const kr = 4.2;
          const rad = (greenKnobAngle * Math.PI) / 180;
          const nx = kcx + kr * 0.7 * Math.sin(rad);
          const ny = kcy - kr * 0.7 * Math.cos(rad);

          return (
            <g
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                cyclePatch(1);
              }}
            >
              <title>Potentiomètre VERT (T2) : Tourner pour naviguer dans les patches</title>
              <circle cx={kcx} cy={kcy} r={kr} fill="#091b13" stroke="#00ED95" strokeWidth="0.7" />
              <circle cx={kcx} cy={kcy} r={kr * 0.75} fill="#103322" stroke="#1d6643" strokeWidth="0.4" />
              <line x1={kcx} y1={kcy} x2={nx} y2={ny} stroke="#00ED95" strokeWidth="1" strokeLinecap="round" />
              <circle cx={kcx} cy={kcy} r="0.9" fill="#ffffff" />
              <circle cx={nx} cy={ny} r="0.6" fill="#ffffff" />
            </g>
          );
        })()}

        {/* Liste compacte des patches en VERT */}
        {visiblePatches.map((patch, idx) => {
          const isActive = selectedPatch === patch.name;
          const isHovered = hoveredPatchId === patch.id;
          const rowY = 13 + idx * 10.5;
          return (
            <g
              key={patch.id}
              transform={`translate(0 ${rowY})`}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onPatchChange(patch.name);
                onNotice?.(`🟢 Patch actif : ${patch.name}`);
              }}
              onMouseEnter={() => setHoveredPatchId(patch.id)}
              onMouseLeave={() => setHoveredPatchId(null)}
            >
              <rect
                x="0"
                y="0"
                width={colW}
                height="9.5"
                rx="1.2"
                fill={isActive ? "#0d2b1f" : isHovered ? "#0a2118" : "#071711"}
                stroke={isActive ? "#00ED95" : isHovered ? "#267a57" : "#103324"}
                strokeWidth={isActive ? "0.9" : "0.4"}
              />
              <circle cx="3.2" cy="4.7" r={isActive ? 1.4 : 0.9} fill={isActive ? "#00ED95" : "#1f6044"} />
              <text
                x="6.5"
                y="6.2"
                fill={isActive ? "#ffffff" : isHovered ? "#b7f4db" : "#80c4a7"}
                fontFamily="monospace"
                fontSize="2.9"
                fontWeight={isActive ? "900" : "600"}
              >
                {patch.name.length > 12 ? patch.name.slice(0, 11) + "…" : patch.name}
              </text>
              <text
                x={colW - 2.5}
                y="6.2"
                textAnchor="end"
                fill={isActive ? "#00ED95" : "#448067"}
                fontFamily="monospace"
                fontSize="2.3"
                fontWeight="700"
              >
                {patch.category.length > 5 ? patch.category.slice(0, 4) + "." : patch.category}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
