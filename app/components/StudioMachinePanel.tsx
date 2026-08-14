"use client";
/**
 * StudioMachinePanel — clavier joué, construit depuis la disposition
 * enregistrée par l'éditeur. L'éditeur de grille a été déplacé dans la
 * fenêtre Exercices (`KeyboardEditor.tsx`, 13 août 2026) : ce composant ne
 * fait plus que lire la disposition sauvegardée (`op1-studio-grid-v1`) et la
 * rendre jouable — il n'écrit plus rien lui-même.
 *
 * Couleurs → types :
 *   #DFD9FF  blanc   → touche blanche piano
 *   #e8a020  orange  → touche noire piano
 *   #698EFF  bleu    → encodeur (potard)
 *   #00ED95  vert    → bouton de fonction
 *   #FF3A5D  rouge   → transport / spécial
 */
import { useEffect, useRef, useState } from "react";
import {
  loadKeyboardLayout, loadKeyboardLayoutSync, sortKeyBlocks, layoutBounds,
  KEYBOARD_COLS as COLS, KEYBOARD_ROWS as ROWS,
  KEYBOARD_WHITE_NOTES as WHITE_NOTES, KEYBOARD_BLACK_NOTES as BLACK_NOTES,
  type KeyboardBlock as Block,
} from "../lib/keyboardLayout";

function midiNoteName(note: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[note % 12]}${Math.floor(note / 12) - 1}`;
}

// ── Clavier ordinateur → notes (14 août 2026) ───────────────────────────────
// `event.code` identifie la position physique de la touche, pas le caractère
// qu'elle produit : le même mappage marche donc tel quel en AZERTY ou en
// QWERTY (« disposition clavier ordinateur configurable » de la feuille de
// route, sans case à cocher — la position suffit). Deux rangées, indexées
// dans le même ordre que KEYBOARD_WHITE_NOTES/KEYBOARD_BLACK_NOTES ; ne
// couvre donc que les premières touches construites, pas toute la gamme.
const WHITE_KEY_CODES = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "KeyQ", "KeyW", "KeyE", "KeyR"];
const BLACK_KEY_CODES = ["KeyS", "KeyD", "KeyG", "KeyH", "KeyJ", "KeyL", "Semicolon", "Digit2", "Digit3", "Digit5"];

export function StudioMachinePanel({
  mode = "clone",
  pressedNotes = [],
  onTogglePlayback,
  onSendMidi,
  notesOnly = false,
  onPressedChange,
}: {
  pressedNotes?: number[];
  mode?: "clone" | "midi";
  playing?: boolean;
  position?: number;
  files?: Record<number, string>;
  onTogglePlayback: () => void;
  onSendMidi: (data: number[]) => void;
  onConnectMidi?: () => void;
  /** Zoome sur les touches note (blanches/noires) seulement, encodeurs/
   * boutons/transport ni rendus ni comptés dans le cadrage — pour un usage
   * comme Exercices où seules les notes doivent occuper toute la largeur,
   * alignées avec l'écran au-dessus. */
  notesOnly?: boolean;
  /** Notifie un parent (Exercices) des notes actuellement enfoncées, clic
   * comme clavier ordinateur — sans ça, seul le vrai MIDI entrant
   * (`pressedNotes`) compte pour le jugement note/timing d'un exercice. */
  onPressedChange?: (notes: Set<number>) => void;
}) {
  const [validated, setValidated] = useState<Block[]>(() => loadKeyboardLayoutSync());
  const [configOpen, setConfigOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<{ type: string; index: number; label: string } | null>(null);
  const [lastPlayed, setLastPlayed] = useState("aucune touche jouée");
  const panelOpen = true;

  // Relit la disposition à chaque montage : reflète ce que l'éditeur (dans
  // la fenêtre Exercices) a sauvegardé, y compris pendant que le Studio
  // reste ouvert dans un autre onglet.
  useEffect(() => {
    let active = true;
    void loadKeyboardLayout().then((blocks) => { if (active) setValidated(blocks); });
    return () => { active = false; };
  }, []);

  const [pressed, setPressed] = useState<Set<number>>(new Set(pressedNotes));

  // Reflète les notes reçues de l'OP-1 sur le clavier construit.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPressed(new Set(pressedNotes));
      if (pressedNotes.length) setLastPlayed(`jouée : ${midiNoteName(pressedNotes[pressedNotes.length - 1])}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pressedNotes]);

  // Notifie le parent (ex. l'écran de jugement note/timing d'Exercices) de
  // chaque changement, qu'il vienne d'un clic ou du MIDI entrant — sinon un
  // clic sur ce clavier reste invisible pour qui l'utilise en dehors du Studio.
  useEffect(() => {
    onPressedChange?.(pressed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressed]);

  const { white: whiteBlocks, black: blackBlocks, enc: encBlocks, fn: fnBlocks, trans: transBlocks } = sortKeyBlocks(validated);
  // En mode notesOnly, le cadrage ignore les encodeurs/boutons/transport :
  // sans ça, 2-3 colonnes réservées à des contrôles sans note tombante
  // s'ajoutent sur le côté et désalignent l'écran par rapport aux touches.
  const bounds = layoutBounds(notesOnly ? [...whiteBlocks, ...blackBlocks] : validated, COLS, ROWS);
  const layoutWidth = bounds.width;
  const layoutHeight = bounds.height;
  const layoutViewBox = bounds.viewBox;

  function noteOn(note: number) {
    setPressed(s => new Set(s).add(note));
    setLastPlayed(`jouée : ${midiNoteName(note)}`);
    if (mode === "midi") onSendMidi([0x90, Math.max(0, Math.min(127, note)), 100]);
  }

  function noteOff(note: number) {
    setPressed(s => { const ns = new Set(s); ns.delete(note); return ns; });
    if (mode === "midi") onSendMidi([0x80, Math.max(0, Math.min(127, note)), 0]);
  }

  function selectConfig(type: string, index: number, label: string) {
    setConfigTarget({ type, index, label });
  }

  // Joue les touches note construites depuis le clavier ordinateur. Ignoré
  // pendant la configuration, dans un champ texte, ou en cas de répétition
  // OS (une touche maintenue ne redéclenche pas noteOn en boucle).
  const heldKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const heldKeys = heldKeysRef.current;
    function noteForCode(code: string): number | null {
      const whiteIdx = WHITE_KEY_CODES.indexOf(code);
      if (whiteIdx >= 0) return whiteBlocks[whiteIdx] ? (WHITE_NOTES[whiteIdx] ?? null) : null;
      const blackIdx = BLACK_KEY_CODES.indexOf(code);
      if (blackIdx >= 0) return blackBlocks[blackIdx] ? (BLACK_NOTES[blackIdx] ?? null) : null;
      return null;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (configOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (heldKeys.has(e.code)) return; // répétition OS, pas un nouvel appui
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configOpen, whiteBlocks.length, blackBlocks.length, mode]);

  const [encVals, setEncVals] = useState([64,64,64,64,64,64,64,64]);
  const encDrag = useRef<{idx:number; startY:number; startV:number}|null>(null);

  return (
    <aside className="studio-machine-panel">

      <div className="mpanel-bar">
        <button className="mpanel-bar-btn" type="button" aria-label="Clavier visible" disabled>
          ▼ clavier
        </button>
        {panelOpen && <button className={`mpanel-bar-btn${configOpen ? " is-active" : ""}`} onClick={() => { setConfigOpen(v => !v); setConfigTarget(null); }}>
          {configOpen ? "fermer config" : "config"}
        </button>}
        <span className="mgrid-hint">{validated.length} blocs</span>
        <span className="mgrid-hint">clavier ordinateur : ZXCVBNM,./ QWER (+ SDGHJL;23 5)</span>
        {configOpen && <span className="mgrid-feedback" aria-live="polite">{lastPlayed}</span>}
      </div>

      {panelOpen && configOpen && (
        <div className="machine-config-panel" aria-label="Configuration du contrôle MIDI">
          {configTarget ? <>
            <strong>{configTarget.label}</strong>
            <span>{configTarget.type === "note" ? `Note MIDI ${WHITE_NOTES[configTarget.index] ?? BLACK_NOTES[configTarget.index] ?? "-"}` : configTarget.type === "enc" ? `CC MIDI ${70 + configTarget.index}` : `Commande MIDI ${36 + configTarget.index}`}</span>
            <small>Cliquez un autre contrôle pour le configurer.</small>
          </> : <small>Cliquez un bouton virtuel, une note ou un potentiomètre sur le clavier.</small>}
        </div>
      )}

      {panelOpen && (
        <div className="machine-layout-zone" style={{ aspectRatio: `${layoutWidth} / ${layoutHeight}` }}>
          <svg viewBox={layoutViewBox} preserveAspectRatio="xMidYMid meet"
            style={{ width:"100%", height:"100%", display:"block" }}
            onPointerUp={() => {
              if (encDrag.current) encDrag.current = null;
            }}
            onPointerMove={e => {
              if (!encDrag.current) return;
              const {idx, startY, startV} = encDrag.current;
              const delta = Math.round((startY - e.clientY) / 3);
              const v = Math.max(0, Math.min(127, startV + delta));
              setEncVals(arr => arr.map((x,i) => i===idx ? v : x));
              if (mode === "midi") onSendMidi([0xb0, idx+70, v]);
            }}
          >
            <rect x={0} y={0} width={COLS} height={ROWS} fill="#ffffff" />

            {whiteBlocks.map((b, i) => {
              const note = WHITE_NOTES[i] ?? (60 + i);
              const isDown = pressed.has(note);
              const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
              const name = NOTE_NAMES[note % 12];
              return (
                <g key={`w${i}`}
                  onPointerDown={e => { if (configOpen) { e.stopPropagation(); selectConfig("note", i, name); return; } e.currentTarget.setPointerCapture(e.pointerId); noteOn(note); }}
                  onPointerUp={() => { if (!configOpen) noteOff(note); }}
                  onPointerLeave={() => { if (!configOpen && pressed.has(note)) noteOff(note); }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.35}
                    fill={isDown ? "#c9c2eb" : "#DFD9FF"}
                    stroke="#8f89aa" strokeWidth={.06}
                  />
                  <rect
                    x={b.col + b.w*.22} y={b.row + b.h*.25}
                    width={b.w*.56} height={b.h*.45}
                    rx={b.w*.28}
                    fill={isDown?"#b8b0d9":"#f5f2ff"}
                    stroke="#aaa2c5" strokeWidth={.04}
                  />
                  <text x={b.col+b.w/2} y={b.row+b.h*.16}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={.55} fill="#5a5e5a" fontFamily="monospace" fontWeight="700">
                    {name}
                  </text>
                </g>
              );
            })}

            {blackBlocks.map((b, i) => {
              const note = BLACK_NOTES[i] ?? (61 + i*2);
              const isDown = pressed.has(note);
              return (
                <g key={`bk${i}`}
                  onPointerDown={e => { if (configOpen) { e.stopPropagation(); selectConfig("note", i, `Noire ${note}`); return; } e.currentTarget.setPointerCapture(e.pointerId); noteOn(note); }}
                  onPointerUp={() => { if (!configOpen) noteOff(note); }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.3}
                    fill={isDown?"#555":"#171a1b"}
                    stroke="#050606" strokeWidth={.06}
                  />
                  <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                    r={Math.min(b.w, b.h)*.32}
                    fill={isDown?"#777":"#000000"}
                  />
                </g>
              );
            })}

            {!notesOnly && encBlocks.map((b, i) => {
              const v = encVals[i] ?? 64;
              const angle = ((v/127)*270 - 135) * Math.PI/180;
              const cx = b.col + b.w/2;
              const cy = b.row + b.h/2;
              const r  = Math.min(b.w, b.h)/2 - .2;
              const ENC_COLORS = ["#698EFF","#00ED95","#DFD9FF","#FF3A5D"];
              const ec = ENC_COLORS[i % 4];
              return (
                <g key={`enc${i}`}
                  onPointerDown={e => {
                    if (configOpen) { e.stopPropagation(); selectConfig("enc", i, `Potentiomètre T${i + 1}`); return; }
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    encDrag.current = {idx:i, startY:e.clientY, startV:v};
                  }}
                  style={{ cursor: "ns-resize" }}
                >
                  <circle cx={cx} cy={cy} r={r} fill={`${ec}44`} stroke={ec} strokeWidth={.07}/>
                  <circle cx={cx} cy={cy} r={r*.75} fill="#ffffff" stroke="#8d9690" strokeWidth={.04}/>
                  <circle cx={cx} cy={cy} r={r*.88}
                    fill="none" stroke={ec} strokeWidth={.18}
                    strokeDasharray={`${(v/127)*5.5} 6.3`}
                    strokeDashoffset="1.55"
                    strokeLinecap="round"
                    transform={`rotate(-135 ${cx} ${cy})`}
                  />
                  <line x1={cx} y1={cy}
                    x2={cx + r*.65*Math.sin(angle)}
                    y2={cy - r*.65*Math.cos(angle)}
                    stroke="#444" strokeWidth={.1} strokeLinecap="round"/>
                  <circle cx={cx} cy={cy} r={.15} fill={ec}/>
                  <text x={cx} y={b.row+b.h+.55} textAnchor="middle"
                    fontSize={.55} fill={ec} fontFamily="monospace" fontWeight="700">
                    T{i+1}
                  </text>
                </g>
              );
            })}

            {!notesOnly && fnBlocks.map((b, i) => (
              <g key={`fn${i}`} style={{ cursor: "pointer" }}
                onPointerDown={(e) => { if (configOpen) { e.stopPropagation(); selectConfig("button", i, `Bouton ${i + 1}`); return; } if (mode==="midi") onSendMidi([0x99, 36+i, 100]); }}
              >
                <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                  rx={.3} fill="#cececb" stroke="#a0a3a0" strokeWidth={.07}/>
                <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                  r={Math.min(b.w,b.h)*.3} fill="#00ED95"/>
              </g>
            ))}

            {!notesOnly && transBlocks.map((b, i) => (
              <g key={`tr${i}`} style={{ cursor: "pointer" }}
                onPointerDown={(e) => { if (configOpen) { e.stopPropagation(); selectConfig("transport", i, `Transport ${i + 1}`); return; } if (i===0) onTogglePlayback(); }}
              >
                <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                  rx={.3} fill="#cececb" stroke="#a0a3a0" strokeWidth={.07}/>
                <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                  r={Math.min(b.w,b.h)*.28} fill="#FF3A5D"/>
              </g>
            ))}

            <defs>
              <linearGradient id="wkeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#d8dbd8"/>
                <stop offset="100%" stopColor="#c4c7c4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </aside>
  );
}
