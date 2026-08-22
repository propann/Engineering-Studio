"use client";
/**
 * GameGuitarHeroKeyboard.tsx — Clavier dédié au mode Guitar Hero / Exercices OP-1.
 * 
 * Conception & Philosophie OP-1 :
 * - Cadré strictement sur les 24 touches de note (blanches et noires) sans encombrement inutile.
 * - S'adapte au pixel près et à la colonne près sous l'écran de chute (ExerciseHighway / GameScreen).
 * - Joue simultanément les sons internes du moteur audio OP-1 (op1AudioEngine) ET transmet le MIDI physique / WebMIDI.
 * - Répond à la frappe physique MIDI, au clic/tactile de souris/touch, et au clavier AZERTY/QWERTY de l'ordinateur.
 * - Affiche le retour visuel réactif (glow, ripple néon, surbrillance de touche pressée, et cible à frapper).
 * - Ne casse et ne modifie JAMAIS le clavier d'origine (StudioMachinePanel), assurant l'isolation totale du code.
 */

import { useEffect, useState, useRef } from "react";
import {
  loadKeyboardLayout,
  loadKeyboardLayoutSync,
  sortKeyBlocks,
  layoutBounds,
  KEYBOARD_COLS as COLS,
  KEYBOARD_ROWS as ROWS,
  KEYBOARD_WHITE_NOTES as WHITE_NOTES,
  KEYBOARD_BLACK_NOTES as BLACK_NOTES,
  type KeyboardBlock as Block,
} from "../lib/keyboardLayout";
import { op1AudioEngine } from "../lib/op1SynthEngine";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiNoteName(note: number) {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

const WHITE_KEY_CODES = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "KeyQ", "KeyW", "KeyE", "KeyR"];
const BLACK_KEY_CODES = ["KeyS", "KeyD", "KeyG", "KeyH", "KeyJ", "KeyL", "Semicolon", "Digit2", "Digit3", "Digit5"];

function labelForCode(code: string): string {
  const map: Record<string, string> = {
    KeyQ: "A", KeyW: "Z", KeyE: "E", KeyR: "R",
    KeyZ: "W", KeyX: "X", KeyC: "C", KeyV: "V", KeyB: "B", KeyN: "N", KeyM: ",",
    KeyS: "S", KeyD: "D", KeyG: "G", KeyH: "H", KeyJ: "J", KeyL: "L",
    Comma: ";", Period: ":", Slash: "!", Semicolon: "M",
    Digit2: "é", Digit3: "\"", Digit5: "(",
  };
  return map[code] ?? code.replace(/^(Key|Digit)/, "");
}

export function GameGuitarHeroKeyboard({
  pressedNotes = [],
  targetNotes = new Set<number>(),
  onPressedChange,
  onSendMidi,
  soundEngine = "FM",
  soundPatch = "Virtual Analog Saw Lead",
  gameMuted = false,
  showKeyLabels = true,
}: {
  pressedNotes?: number[];
  targetNotes?: Set<number>;
  onPressedChange?: (notes: Set<number>) => void;
  onSendMidi?: (data: number[]) => void;
  soundEngine?: string;
  soundPatch?: string;
  gameMuted?: boolean;
  showKeyLabels?: boolean;
}) {
  const [validated, setValidated] = useState<Block[]>(() => loadKeyboardLayoutSync());
  const [pressed, setPressed] = useState<Set<number>>(new Set(pressedNotes));

  useEffect(() => {
    let active = true;
    void loadKeyboardLayout().then((blocks) => {
      if (active) setValidated(blocks);
    });
    return () => { active = false; };
  }, []);

  // Synchronisation MIDI externe / contrôleur
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPressed(new Set(pressedNotes));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pressedNotes]);

  useEffect(() => {
    onPressedChange?.(pressed);
  }, [pressed, onPressedChange]);

  const { white: whiteBlocks, black: blackBlocks } = sortKeyBlocks(validated);
  const bounds = layoutBounds([...whiteBlocks, ...blackBlocks], COLS, ROWS);

  function noteOn(note: number) {
    setPressed((s) => new Set(s).add(note));
    if (!gameMuted) {
      op1AudioEngine.triggerNoteOn(note, 110);
    }
    if (onSendMidi) {
      onSendMidi([0x90, Math.max(0, Math.min(127, note)), 100]);
    }
  }

  function noteOff(note: number) {
    setPressed((s) => {
      const ns = new Set(s);
      ns.delete(note);
      return ns;
    });
    op1AudioEngine.triggerNoteOff(note);
    if (onSendMidi) {
      onSendMidi([0x80, Math.max(0, Math.min(127, note)), 0]);
    }
  }

  // Raccourcis clavier physique ordinateur (AZERTY / QWERTY)
  useEffect(() => {
    const heldKeys = new Set<string>();

    function noteForCode(code: string): number | null {
      const wi = WHITE_KEY_CODES.indexOf(code);
      if (wi >= 0 && wi < WHITE_NOTES.length) return WHITE_NOTES[wi];
      const bi = BLACK_KEY_CODES.indexOf(code);
      if (bi >= 0 && bi < BLACK_NOTES.length) return BLACK_NOTES[bi];
      return null;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const note = noteForCode(e.code);
      if (note === null) return;
      heldKeys.add(e.code);
      noteOn(note);
    }

    function onKeyUp(e: KeyboardEvent) {
      if (!heldKeys.has(e.code)) return;
      heldKeys.delete(e.code);
      const note = noteForCode(e.code);
      if (note !== null) noteOff(note);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      heldKeys.clear();
    };
  }, [whiteBlocks.length, blackBlocks.length, gameMuted]);

  return (
    <div
      className="game-guitar-hero-keyboard-wrapper"
      style={{
        width: "100%",
        background: "#14181a",
        borderTop: "2px solid #232d32",
        borderBottom: "1px solid #1c2226",
        borderRadius: "0 0 8px 8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <svg
        viewBox={bounds.viewBox}
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "150px",
          display: "block",
          touchAction: "none",
        }}
        aria-label="Clavier Arcade Guitar Hero OP-1"
      >
        <defs>
          {/* Gradients et filtres néon pour le style OP-1 Guitar Hero */}
          <linearGradient id="op1KeyWhiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfefd" />
            <stop offset="100%" stopColor="#e8eae6" />
          </linearGradient>
          <linearGradient id="op1KeyWhiteDownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ED95" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="op1KeyTargetWhiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
          <linearGradient id="op1KeyBlackGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c3033" />
            <stop offset="100%" stopColor="#0b0e10" />
          </linearGradient>
          <linearGradient id="op1KeyBlackDownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#698EFF" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <filter id="keyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Châssis de fond en aluminium anodisé OP-1 */}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.width}
          height={bounds.height}
          fill="#1c2225"
        />

        {/* ── 1. Touches blanches ── */}
        {whiteBlocks.map((b, i) => {
          const note = WHITE_NOTES[i] ?? (53 + i * 2);
          const isDown = pressed.has(note);
          const isTarget = targetNotes.has(note);
          const name = NOTE_NAMES[note % 12];

          return (
            <g
              key={`gh-w-${i}`}
              className={`gh-key gh-key-white ${isDown ? "is-down" : ""} ${isTarget ? "is-target" : ""}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                noteOn(note);
              }}
              onPointerUp={() => noteOff(note)}
              onPointerLeave={() => {
                if (pressed.has(note)) noteOff(note);
              }}
              style={{ cursor: "pointer" }}
            >
              {/* Corps de la touche */}
              <rect
                x={b.col + 0.08}
                y={b.row + 0.08}
                width={b.w - 0.16}
                height={b.h - 0.16}
                rx={0.4}
                fill={isDown ? "url(#op1KeyWhiteDownGrad)" : isTarget ? "url(#op1KeyTargetWhiteGrad)" : "url(#op1KeyWhiteGrad)"}
                stroke={isDown ? "#00ED95" : isTarget ? "#10b981" : "#8f89aa"}
                strokeWidth={isDown || isTarget ? 0.2 : 0.08}
                filter={isDown || isTarget ? "url(#keyGlow)" : "none"}
              />

              {/* Incrustation ovale tactile OP-1 */}
              <rect
                x={b.col + b.w * 0.22}
                y={b.row + b.h * 0.25}
                width={b.w * 0.56}
                height={b.h * 0.45}
                rx={b.w * 0.28}
                fill={isDown ? "rgba(255,255,255,0.4)" : isTarget ? "rgba(0,237,149,0.25)" : "#fbfcfa"}
                stroke={isDown ? "#ffffff" : isTarget ? "#00ED95" : "#aaa2c5"}
                strokeWidth={0.05}
              />

              {/* Libellé de note musicale */}
              {showKeyLabels && (
                <>
                  <text
                    x={b.col + b.w / 2}
                    y={b.row + b.h * 0.16}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={0.65}
                    fill={isDown ? "#ffffff" : isTarget ? "#065f46" : "#374151"}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={800}
                  >
                    {name}
                  </text>
                  <text
                    x={b.col + b.w / 2}
                    y={b.row + b.h - 0.42}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={0.48}
                    fill={isDown ? "#ffffff" : isTarget ? "#047857" : "#64748b"}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={700}
                  >
                    {labelForCode(WHITE_KEY_CODES[i])}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Séparateurs orange style OP-1 entre les touches */}
        {whiteBlocks.slice(0, -1).map((b, i) => (
          <rect
            key={`gh-sep-${i}`}
            x={b.col + b.w - 0.08}
            y={b.row + 0.2}
            width={0.16}
            height={Math.max(0, b.h - 0.4)}
            fill="#FF7A30"
            opacity="0.85"
          />
        ))}

        {/* ── 2. Touches noires ── */}
        {blackBlocks.map((b, i) => {
          const note = BLACK_NOTES[i] ?? (61 + i * 2);
          const isDown = pressed.has(note);
          const isTarget = targetNotes.has(note);

          return (
            <g
              key={`gh-bk-${i}`}
              className={`gh-key gh-key-black ${isDown ? "is-down" : ""} ${isTarget ? "is-target" : ""}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                noteOn(note);
              }}
              onPointerUp={() => noteOff(note)}
              onPointerLeave={() => {
                if (pressed.has(note)) noteOff(note);
              }}
              style={{ cursor: "pointer" }}
            >
              {/* Corps de touche noire */}
              <rect
                x={b.col + 0.08}
                y={b.row + 0.08}
                width={b.w - 0.16}
                height={b.h - 0.16}
                rx={0.35}
                fill={isDown ? "url(#op1KeyBlackDownGrad)" : isTarget ? "#1e293b" : "url(#op1KeyBlackGrad)"}
                stroke={isDown ? "#698EFF" : isTarget ? "#00ED95" : "#475569"}
                strokeWidth={isDown || isTarget ? 0.2 : 0.08}
                filter={isDown || isTarget ? "url(#keyGlow)" : "none"}
              />

              {/* Pastille circulaire centrale */}
              <circle
                cx={b.col + b.w / 2}
                cy={b.row + b.h / 2}
                r={Math.min(b.w, b.h) * 0.34}
                fill={isDown ? "#93c5fd" : isTarget ? "#00ED95" : "#000000"}
                stroke={isDown ? "#ffffff" : isTarget ? "#6ee7b7" : "#334155"}
                strokeWidth={0.06}
              />

              {/* Touche clavier ordinateur */}
              {showKeyLabels && (
                <text
                  x={b.col + b.w / 2}
                  y={b.row + b.h - 0.38}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={0.44}
                  fill={isDown ? "#ffffff" : isTarget ? "#a7f3d0" : "#94a3b8"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={800}
                >
                  {labelForCode(BLACK_KEY_CODES[i])}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
