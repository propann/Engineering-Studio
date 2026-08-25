"use client";
/**
 * InvaderLineSprites.tsx — Moteur de Rendu Vectoriel des 12 Aliens Space Invaders par Ligne.
 *
 * **Au trait, sans aplat.** Les sprites etaient pleins ; ils sont desormais
 * traces au fil, contour seul. C'est le parti pris de l'ecran de l'OP-1 a cote
 * — colonnes en pointilles, ligne de jeu vectorielle — et un aplat de la
 * largeur d'une colonne masquait justement la colonne qu'il descend.
 *
 * Consequence a garder en tete : sur ce fond noir, un noir ne se voit pas. Les
 * formes qui portaient un remplissage noir (orbites, hublots) prennent le trait
 * de la couleur principale, et le libelle de la capsule est passe au blanc — il
 * etait grave en noir DANS un aplat blanc qui n'existe plus.
 * 
 * Chaque ligne/colonne de note du clavier OP-1 possède son propre alien unique et animé :
 * - 0 : Crab Invader (Pinces géantes articulées, doubles antennes)
 * - 1 : Squid Glider (Tête en dôme conique, tentacules pulsantes, mono-œil)
 * - 2 : Octopus Cruiser (4 tentacules frétillantes, doubles phares)
 * - 3 : Cyber Skull (Crâne robotique, cornes néon, mâchoire articulée)
 * - 4 : UFO Mothership (Soucoupe volante avec cockpit vitré et faisceau)
 * - 5 : Beetle Tank (Scarabée blindé avec mandibules mécaniques)
 * - 6 : Jellyfish Pulsar (Méduse cosmique avec filaments plasma oscillants)
 * - 7 : Titan Dreadnought (Vaisseau amiral lourd avec doubles canons laser)
 * - 8 : Spider Drone (4 pattes articulées, yeux optiques hexagonaux)
 * - 9 : Pixel Ghost (Spectre arcade 8-bit ondulant avec queue 3 pans)
 * - 10 : Laser Viper (Vaisseau furtif triangulaire à ailes delta)
 * - 11 : Solar Guardian (Noyau sphérique rayonnant avec prismes orbitaux)
 */

import React from "react";
import type { GameNote } from "../lib/gameSongsCatalog";

/**
 * Epaisseur du trait, en unites du repere de l'ecran.
 *
 * Les aliens sont traces au fil, sans aplat : c'est le trait qui porte toute la
 * forme, comme les colonnes en pointilles a cote. Une valeur unique pour tous
 * les sprites — douze epaisseurs reglees a la main auraient donne douze aliens
 * d'epaisseurs differentes sur le meme ecran.
 *
 * 0,1 plutot que 0,14 : les plus petits details — pupilles, hublots — ont un
 * rayon de 0,06, et un trait plus epais que le rayon les rend a nouveau pleins.
 */
const TRAIT = 0.1;

export interface InvaderSpriteProps {
  note: GameNote;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  category: string;
  isPastHit: boolean;
  time: number;
}

export function InvaderSprite({
  note,
  x,
  y,
  width,
  height,
  level: _level,
  category,
  isPastHit,
  time,
}: InvaderSpriteProps) {
  const w = width;
  const h = Math.max(3.4, height);
  const opacity = isPastHit ? 0.25 : 0.96;

  // Ligne de l'alien (0 à 11 selon la note)
  // Touche la plus grave (F2 = 53).
  const lineIndex = Math.abs((note.note - 53 + 24)) % 12;

  // Cycle d'animation à 2 positions synchronisé sur le tempo et la colonne
  const animFrame = Math.floor(time * 6 + lineIndex * 0.4) % 2;

  // Palette de couleur selon la catégorie de l'exercice
  let primaryColor = "#38bdf8"; // Cyan par défaut (Mélodie)
  let secondaryColor = "#0284c7";
  let eyeColor = "#ffffff";
  let glowColor = "rgba(56, 189, 248, 0.4)";

  if (category === "drum") {
    primaryColor = "#FF3A5D"; // Rouge / Rose OP-1
    secondaryColor = "#be123c";
    eyeColor = "#ffe4e6";
    glowColor = "rgba(255, 58, 93, 0.4)";
  } else if (category === "chord") {
    primaryColor = "#fbbf24"; // Ambre / Doré
    secondaryColor = "#b45309";
    eyeColor = "#fef3c7";
    glowColor = "rgba(251, 191, 36, 0.4)";
  } else if (category === "arcade") {
    primaryColor = "#a855f7"; // Violet Arcade
    secondaryColor = "#6b21a8";
    eyeColor = "#f3e8ff";
    glowColor = "rgba(168, 85, 247, 0.4)";
  }

  return (
    <g transform={`translate(${x}, ${y - h})`} opacity={opacity}>
      {/* ── TRAÎNÉE D'ÉNERGIE PLASMA ARRIÈRE ── */}
      <line
        x1={0}
        y1={-2.2}
        x2={0}
        y2={-0.3}
        stroke={primaryColor}
        strokeWidth={0.22}
        strokeDasharray="0.35 0.35"
        opacity={0.75}
      />
      <circle cx={0} cy={-0.3} r={0.3} fill="none" stroke={primaryColor} strokeWidth={TRAIT} opacity={0.9} />

      {/* ── CORPS DU SPACE INVADER UNIQUE PAR LIGNE (0 à 11) ── */}

      {/* LIGNE 0 : CRAB INVADER (Touche Do / F2 / Kick) */}
      {lineIndex === 0 && (
        <g>
          {/* Antennes */}
          <line x1={-w * 0.28} y1={0.4} x2={-w * 0.42} y2={-0.15} stroke={primaryColor} strokeWidth={0.16} />
          <line x1={w * 0.28} y1={0.4} x2={w * 0.42} y2={-0.15} stroke={primaryColor} strokeWidth={0.16} />
          <circle cx={-w * 0.42} cy={-0.15} r={0.12} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <circle cx={w * 0.42} cy={-0.15} r={0.12} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Corps principal */}
          <rect x={-w * 0.44} y={0.3} width={w * 0.88} height={h * 0.48} rx={0.25} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Yeux géométriques */}
          <rect x={-w * 0.26} y={0.5} width={w * 0.16} height={0.38} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <rect x={w * 0.1} y={0.5} width={w * 0.16} height={0.38} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <circle cx={-w * 0.18} cy={0.65} r={0.07} fill="none" stroke={eyeColor} strokeWidth={TRAIT} />
          <circle cx={w * 0.18} cy={0.65} r={0.07} fill="none" stroke={eyeColor} strokeWidth={TRAIT} />
          {/* Pinces animées en battement */}
          {animFrame === 0 ? (
            <>
              <rect x={-w * 0.54} y={0.6} width={w * 0.14} height={0.55} rx={0.1} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
              <rect x={w * 0.4} y={0.6} width={w * 0.14} height={0.55} rx={0.1} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
            </>
          ) : (
            <>
              <rect x={-w * 0.54} y={0.25} width={w * 0.14} height={0.55} rx={0.1} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
              <rect x={w * 0.4} y={0.25} width={w * 0.14} height={0.55} rx={0.1} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
            </>
          )}
        </g>
      )}

      {/* LIGNE 1 : SQUID GLIDER (Touche Do# / F#2 / 808 Rim) */}
      {lineIndex === 1 && (
        <g>
          {/* Dôme fuselé */}
          <path
            d={`M ${-w * 0.4} 0.8 Q 0 -0.3 ${w * 0.4} 0.8 L ${w * 0.38} ${h * 0.5} L ${-w * 0.38} ${h * 0.5} Z`}
            fill="none" stroke={primaryColor} strokeWidth={TRAIT}
          />
          {/* Mono-œil cyclope laser */}
          <circle cx={0} cy={0.5} r={0.28} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <circle cx={0} cy={0.5} r={0.14} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          <circle cx={0} cy={0.5} r={0.06} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Tentacules oscillantes */}
          {animFrame === 0 ? (
            <>
              <line x1={-w * 0.3} y1={h * 0.5} x2={-w * 0.38} y2={h * 0.72} stroke={secondaryColor} strokeWidth={0.18} />
              <line x1={-w * 0.1} y1={h * 0.5} x2={-w * 0.1} y2={h * 0.8} stroke={primaryColor} strokeWidth={0.18} />
              <line x1={w * 0.1} y1={h * 0.5} x2={w * 0.1} y2={h * 0.8} stroke={primaryColor} strokeWidth={0.18} />
              <line x1={w * 0.3} y1={h * 0.5} x2={w * 0.38} y2={h * 0.72} stroke={secondaryColor} strokeWidth={0.18} />
            </>
          ) : (
            <>
              <line x1={-w * 0.3} y1={h * 0.5} x2={-w * 0.22} y2={h * 0.72} stroke={secondaryColor} strokeWidth={0.18} />
              <line x1={-w * 0.1} y1={h * 0.5} x2={-w * 0.18} y2={h * 0.8} stroke={primaryColor} strokeWidth={0.18} />
              <line x1={w * 0.1} y1={h * 0.5} x2={w * 0.18} y2={h * 0.8} stroke={primaryColor} strokeWidth={0.18} />
              <line x1={w * 0.3} y1={h * 0.5} x2={w * 0.22} y2={h * 0.72} stroke={secondaryColor} strokeWidth={0.18} />
            </>
          )}
        </g>
      )}

      {/* LIGNE 2 : OCTOPUS CRUISER (Touche Ré / G2 / Snare) */}
      {lineIndex === 2 && (
        <g>
          {/* Tête arrondie */}
          <polygon
            points={`0,-0.2 ${w * 0.48},0.65 ${w * 0.34},${h * 0.52} 0,${h * 0.42} ${-w * 0.34},${h * 0.52} ${-w * 0.48},0.65`}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={0.08}
          />
          {/* Phares doubles */}
          <rect x={-w * 0.4} y={0.25} width={w * 0.12} height={0.36} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <rect x={w * 0.28} y={0.25} width={w * 0.12} height={0.36} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          {/* 4 tentacules ventouses */}
          <line x1={-w * 0.28} y1={h * 0.5} x2={animFrame === 0 ? -w * 0.34 : -w * 0.24} y2={h * 0.72} stroke={primaryColor} strokeWidth={0.16} />
          <line x1={-w * 0.1} y1={h * 0.46} x2={animFrame === 0 ? -w * 0.08 : -w * 0.14} y2={h * 0.76} stroke={secondaryColor} strokeWidth={0.16} />
          <line x1={w * 0.1} y1={h * 0.46} x2={animFrame === 0 ? w * 0.08 : w * 0.14} y2={h * 0.76} stroke={secondaryColor} strokeWidth={0.16} />
          <line x1={w * 0.28} y1={h * 0.5} x2={animFrame === 0 ? w * 0.34 : w * 0.24} y2={h * 0.72} stroke={primaryColor} strokeWidth={0.16} />
        </g>
      )}

      {/* LIGNE 3 : CYBER SKULL (Touche Ré# / G#2 / Clap) */}
      {lineIndex === 3 && (
        <g>
          {/* Cornes néon */}
          <polygon points={`0,0.1 ${-w * 0.42},-0.25 ${-w * 0.22},0.3`} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          <polygon points={`0,0.1 ${w * 0.42},-0.25 ${w * 0.22},0.3`} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          {/* Boîte crânienne */}
          <path
            d={`M ${-w * 0.38} 0.3 Q 0 -0.1 ${w * 0.38} 0.3 L ${w * 0.34} ${h * 0.48} L ${-w * 0.34} ${h * 0.48} Z`}
            fill="none" stroke={primaryColor} strokeWidth={TRAIT}
          />
          {/* Orbites néon écarlates */}
          <circle cx={-w * 0.18} cy={0.4} r={0.15} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <circle cx={w * 0.18} cy={0.4} r={0.15} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <circle cx={-w * 0.18} cy={0.4} r={0.07} fill="none" stroke="#ff0055" strokeWidth={TRAIT} />
          <circle cx={w * 0.18} cy={0.4} r={0.07} fill="none" stroke="#ff0055" strokeWidth={TRAIT} />
          {/* Mâchoire articulée */}
          <rect
            x={-w * 0.22}
            y={animFrame === 0 ? h * 0.48 : h * 0.54}
            width={w * 0.44}
            height={0.24}
            rx={0.06}
            fill="none" stroke={secondaryColor} strokeWidth={TRAIT}
          />
        </g>
      )}

      {/* LIGNE 4 : UFO MOTHERSHIP (Touche Mi / A2 / Closed Hat) */}
      {lineIndex === 4 && (
        <g>
          {/* Cockpit hémisphérique vitré */}
          <ellipse cx={0} cy={0.25} rx={w * 0.24} ry={0.35} fill="none" stroke="#ffffff" strokeWidth={TRAIT} opacity={0.9} />
          <circle cx={0} cy={0.25} r={0.12} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Disque soucoupe volant */}
          <ellipse cx={0} cy={0.55} rx={w * 0.48} ry={0.28} fill="none" stroke={secondaryColor} strokeWidth={0.08} />
          {/* 3 lumières rotatives dessous */}
          <circle cx={animFrame === 0 ? -w * 0.3 : -w * 0.2} cy={0.62} r={0.09} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          <circle cx={0} cy={0.65} r={0.1} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <circle cx={animFrame === 0 ? w * 0.3 : w * 0.2} cy={0.62} r={0.09} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          {/* Faisceau tracteur plasma */}
          <polygon points={`-0.2,0.7 0.2,0.7 0.4,${h * 0.85} -0.4,${h * 0.85}`} fill="none" stroke={primaryColor} strokeWidth={TRAIT} opacity={0.35} />
        </g>
      )}

      {/* LIGNE 5 : BEETLE TANK (Touche Fa / A#2 / Open Hat) */}
      {lineIndex === 5 && (
        <g>
          {/* Mandibules avant */}
          <polygon points={`${-w * 0.35},-0.2 ${-w * 0.15},0.3 ${-w * 0.25},0.4`} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          <polygon points={`${w * 0.35},-0.2 ${w * 0.15},0.3 ${w * 0.25},0.4`} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          {/* Carapace blindée */}
          <rect x={-w * 0.42} y={0.2} width={w * 0.84} height={h * 0.45} rx={0.2} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <line x1={0} y1={0.2} x2={0} y2={h * 0.65} stroke={secondaryColor} strokeWidth={0.12} />
          {/* Yeux fentes */}
          <line x1={-w * 0.3} y1={0.38} x2={-w * 0.14} y2={0.38} stroke="#ffffff" strokeWidth={0.14} />
          <line x1={w * 0.14} y1={0.38} x2={w * 0.3} y2={0.38} stroke="#ffffff" strokeWidth={0.14} />
          {/* Chenilles / pattes latérales */}
          <rect x={-w * 0.5} y={animFrame === 0 ? 0.3 : 0.45} width={w * 0.1} height={0.35} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
          <rect x={w * 0.4} y={animFrame === 0 ? 0.3 : 0.45} width={w * 0.1} height={0.35} fill="none" stroke={secondaryColor} strokeWidth={TRAIT} />
        </g>
      )}

      {/* LIGNE 6 : JELLYFISH PULSAR (Touche Fa# / B2 / Perc 1) */}
      {lineIndex === 6 && (
        <g>
          {/* Cloche translucide */}
          <path
            d={`M ${-w * 0.4} 0.6 Q 0 -0.25 ${w * 0.4} 0.6 Q 0 0.4 ${-w * 0.4} 0.6 Z`}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.08}
          />
          <circle cx={0} cy={0.3} r={animFrame === 0 ? 0.18 : 0.25} fill="none" stroke="#ffffff" strokeWidth={TRAIT} opacity={0.8} />
          {/* Filaments plasma ondulants */}
          <path
            d={
              animFrame === 0
                ? `M ${-w * 0.25} 0.6 Q ${-w * 0.35} ${h * 0.55} ${-w * 0.2} ${h * 0.8}`
                : `M ${-w * 0.25} 0.6 Q ${-w * 0.15} ${h * 0.55} ${-w * 0.3} ${h * 0.8}`
            }
            stroke={secondaryColor}
            strokeWidth={0.16}
            fill="none"
          />
          <path
            d={
              animFrame === 0
                ? `M 0 0.6 Q 0.15 ${h * 0.55} 0 ${h * 0.85}`
                : `M 0 0.6 Q -0.15 ${h * 0.55} 0 ${h * 0.85}`
            }
            stroke={primaryColor}
            strokeWidth={0.18}
            fill="none"
          />
          <path
            d={
              animFrame === 0
                ? `M ${w * 0.25} 0.6 Q ${w * 0.35} ${h * 0.55} ${w * 0.2} ${h * 0.8}`
                : `M ${w * 0.25} 0.6 Q ${w * 0.15} ${h * 0.55} ${w * 0.3} ${h * 0.8}`
            }
            stroke={secondaryColor}
            strokeWidth={0.16}
            fill="none"
          />
        </g>
      )}

      {/* LIGNE 7 : TITAN DREADNOUGHT (Touche Sol / C3 / Crash) */}
      {lineIndex === 7 && (
        <g>
          {/* Ailerons delta jumeaux */}
          <polygon points={`0,-0.3 ${w * 0.5},0.35 ${w * 0.42},${h * 0.58} 0,${h * 0.45} ${-w * 0.42},${h * 0.58} ${-w * 0.5},0.35`} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Canons latéraux */}
          <line x1={-w * 0.36} y1={-0.15} x2={-w * 0.36} y2={0.65} stroke="#ffffff" strokeWidth={0.18} />
          <line x1={w * 0.36} y1={-0.15} x2={w * 0.36} y2={0.65} stroke="#ffffff" strokeWidth={0.18} />
          {/* Réacteur Warp central */}
          <polygon points={`0,0.1 0.22,0.3 0.22,0.52 0,0.68 -0.22,0.52 -0.22,0.3`} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <circle cx={0} cy={0.42} r={animFrame === 0 ? 0.12 : 0.18} fill="none" stroke="#ff0044" strokeWidth={TRAIT} />
        </g>
      )}

      {/* LIGNE 8 : SPIDER DRONE (Touche Sol# / C#3 / Tom Low) */}
      {lineIndex === 8 && (
        <g>
          {/* Corps hexagonal */}
          <polygon
            points={`0,0.15 ${w * 0.28},0.3 ${w * 0.28},0.55 0,0.7 ${-w * 0.28},0.55 ${-w * 0.28},0.3`}
            fill="none" stroke={primaryColor} strokeWidth={TRAIT}
          />
          {/* Yeux optiques multiples */}
          <circle cx={-w * 0.12} cy={0.35} r={0.06} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <circle cx={0} cy={0.32} r={0.07} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          <circle cx={w * 0.12} cy={0.35} r={0.06} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          {/* 4 pattes articulées */}
          <polyline
            points={`${-w * 0.25},0.35 ${-w * 0.45},${animFrame === 0 ? 0.2 : 0.1} ${-w * 0.48},0.65`}
            stroke={secondaryColor}
            strokeWidth={0.16}
            fill="none"
          />
          <polyline
            points={`${w * 0.25},0.35 ${w * 0.45},${animFrame === 0 ? 0.2 : 0.1} ${w * 0.48},0.65`}
            stroke={secondaryColor}
            strokeWidth={0.16}
            fill="none"
          />
          <polyline
            points={`${-w * 0.25},0.55 ${-w * 0.48},${animFrame === 0 ? 0.55 : 0.68} ${-w * 0.35},${h * 0.78}`}
            stroke={primaryColor}
            strokeWidth={0.16}
            fill="none"
          />
          <polyline
            points={`${w * 0.25},0.55 ${w * 0.48},${animFrame === 0 ? 0.55 : 0.68} ${w * 0.35},${h * 0.78}`}
            stroke={primaryColor}
            strokeWidth={0.16}
            fill="none"
          />
        </g>
      )}

      {/* LIGNE 9 : PIXEL GHOST (Touche La / D3 / Ride) */}
      {lineIndex === 9 && (
        <g>
          {/* Tête de fantôme 8-bit */}
          <path
            d={`M ${-w * 0.38} 0.8 Q 0 -0.2 ${w * 0.38} 0.8 L ${w * 0.38} ${h * 0.55} L ${-w * 0.38} ${h * 0.55} Z`}
            fill="none" stroke={primaryColor} strokeWidth={TRAIT}
          />
          {/* Yeux expressifs regardant vers le bas */}
          <rect x={-w * 0.28} y={0.35} width={w * 0.16} height={0.32} rx={0.06} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <rect x={w * 0.12} y={0.35} width={w * 0.16} height={0.32} rx={0.06} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          <rect x={-w * 0.24} y={animFrame === 0 ? 0.45 : 0.4} width={0.12} height={0.15} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          <rect x={w * 0.16} y={animFrame === 0 ? 0.45 : 0.4} width={0.12} height={0.15} fill="none" stroke={primaryColor} strokeWidth={TRAIT} />
          {/* Queue ondulée 3 pans */}
          {animFrame === 0 ? (
            <polygon
              points={`${-w * 0.38},${h * 0.55} ${-w * 0.2},${h * 0.75} ${-w * 0.05},${h * 0.55} ${w * 0.1},${h * 0.75} ${w * 0.25},${h * 0.55} ${w * 0.38},${h * 0.75} ${w * 0.38},${h * 0.55}`}
              fill="none" stroke={primaryColor} strokeWidth={TRAIT}
            />
          ) : (
            <polygon
              points={`${-w * 0.38},${h * 0.7} ${-w * 0.22},${h * 0.55} ${-w * 0.08},${h * 0.75} ${w * 0.08},${h * 0.55} ${w * 0.22},${h * 0.75} ${w * 0.38},${h * 0.55} ${w * 0.38},${h * 0.7}`}
              fill="none" stroke={primaryColor} strokeWidth={TRAIT}
            />
          )}
        </g>
      )}

      {/* LIGNE 10 : LASER VIPER (Touche La# / D#3 / Shaker) */}
      {lineIndex === 10 && (
        <g>
          {/* Fuselage furtif delta */}
          <polygon
            points={`0,-0.35 ${w * 0.48},0.5 ${w * 0.2},${h * 0.6} 0,${h * 0.45} ${-w * 0.2},${h * 0.6} ${-w * 0.48},0.5`}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.08}
          />
          {/* Ligne dorsale laser */}
          <line x1={0} y1={-0.2} x2={0} y2={h * 0.42} stroke="#ffffff" strokeWidth={0.16} />
          {/* Double propulseurs animés */}
          <circle cx={-w * 0.16} cy={h * 0.55} r={animFrame === 0 ? 0.12 : 0.18} fill="none" stroke="#ff0055" strokeWidth={TRAIT} />
          <circle cx={w * 0.16} cy={h * 0.55} r={animFrame === 0 ? 0.12 : 0.18} fill="none" stroke="#ff0055" strokeWidth={TRAIT} />
        </g>
      )}

      {/* LIGNE 11 : SOLAR GUARDIAN (Touche Si / E3 / Tom High / Vox) */}
      {lineIndex === 11 && (
        <g>
          {/* Anneau orbital */}
          <ellipse
            cx={0}
            cy={0.4}
            rx={w * 0.48}
            ry={0.22}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={0.12}
            transform={animFrame === 0 ? "rotate(15)" : "rotate(-15)"}
          />
          {/* Noyau d'énergie rayonnant */}
          <circle cx={0} cy={0.4} r={0.32} fill="none" stroke="#ffffff" strokeWidth={0.08} />
          <circle cx={0} cy={0.4} r={0.16} fill="none" stroke="#ffffff" strokeWidth={TRAIT} />
          {/* 4 prismes de bouclier orbitaux */}
          <circle cx={-w * 0.36} cy={0.2} r={0.1} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          <circle cx={w * 0.36} cy={0.2} r={0.1} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          <circle cx={-w * 0.36} cy={0.6} r={0.1} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
          <circle cx={w * 0.36} cy={0.6} r={0.1} fill="none" stroke="#fbbf24" strokeWidth={TRAIT} />
        </g>
      )}

      {/* ── SPÉCIFIQUE DRUM : ENCEINTE WOOFER PULSANTE AU COEUR DE L'ALIEN ── */}
      {category === "drum" && (
        <g transform="translate(0, 0.42)">
          <circle cx={0} cy={0} r={0.28} fill="none" stroke="#ffffff" strokeWidth={0.05} />
          <circle cx={0} cy={0} r={animFrame === 0 ? 0.15 : 0.22} fill="none" stroke="#FF3A5D" strokeWidth={TRAIT} opacity={0.95} />
        </g>
      )}

      {/* ── CAPSULE D'IMPACT SUR LA HIT LINE ──
          Son contour etait noir parce qu'elle etait pleine et blanche. Videe,
          un contour noir sur l'ecran noir de l'OP-1 ne se voit plus : elle
          passe au blanc, et prend un trait plus epais que les aliens pour
          rester l'element le plus lisible de la chute. ── */}
      <rect
        x={-w * 0.46}
        y={h - 1.85}
        width={w * 0.92}
        height={1.85}
        rx={0.28}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.14}
        filter={`drop-shadow(0 0 4px ${glowColor})`}
      />

      {/* Libellé en blanc : la capsule n'a plus d'aplat pour le détourer. */}
      {note.label && (
        <text
          x={0}
          y={h - 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={0.82}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={900}
          fill="#ffffff"
        >
          {note.label}
        </text>
      )}
    </g>
  );
}
