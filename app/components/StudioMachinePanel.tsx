"use client";
/**
 * StudioMachinePanel — interface générée depuis la matrice de boutons.
 *
 * Couleurs → types :
 *   #DFD9FF  blanc   → touche blanche piano
 *   #e8a020  orange  → touche noire piano
 *   #698EFF  bleu    → encodeur (potard)
 *   #00ED95  vert    → bouton de fonction
 *   #FF3A5D  rouge   → transport / spécial
 */
import { useEffect, useRef, useState } from "react";

// ── Grille éditeur ────────────────────────────────────────────────────────────
const COLS = 64;
const ROWS = 16;
const STORAGE_KEY = "op1-studio-grid-v1";

const PALETTE = [
  { color: "#DFD9FF", label: "Note blanche", type: "white"  },
  { color: "#e8a020", label: "Note noire",   type: "black"  },
  { color: "#698EFF", label: "Potentiomètre", type: "enc"    },
  { color: "#00ED95", label: "Bouton",        type: "fn"     },
  { color: "#FF3A5D", label: "Transport",     type: "trans"  },
] as const;

type Block = { col: number; row: number; w: number; h: number; color: string; type: string };

// ── Mappage note MIDI par position gauche→droite ──────────────────────────────
// Blanches : C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4 B4
const WHITE_NOTES = [48,50,52,53,55,57,59,60,62,64,65,67,69,71];
// Noires : C#3 D#3 F#3 G#3 A#3 C#4 D#4 F#4 G#4 A#4
const BLACK_NOTES = [49,51,54,56,58,61,63,66,68,70];

// Inférer le type depuis la couleur (compatibilité anciens blocs)
function colorToType(color: string): string {
  if (color === "#DFD9FF") return "white";
  if (color === "#e8a020") return "black";
  if (color === "#698EFF") return "enc";
  if (color === "#00ED95") return "fn";
  if (color === "#FF3A5D") return "trans";
  return "white";
}

function loadState(): { cells: (string|null)[][]; validated: Block[] } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Migrer les anciens blocs sans champ type
    if (data?.validated) {
      data.validated = data.validated.map((b: Block & { type?: string }) => ({
        ...b,
        type: b.type ?? colorToType(b.color),
      }));
    }
    return data;
  } catch { return null; }
}

export function StudioMachinePanel({
  mode = "clone",
  onTogglePlayback,
  onSendMidi,
}: {
  pressedNotes?: number[];
  mode?: "clone" | "midi";
  playing?: boolean;
  position?: number;
  files?: Record<number, string>;
  onTogglePlayback: () => void;
  onSendMidi: (data: number[]) => void;
  onConnectMidi?: () => void;
}) {
  const saved = loadState();

  // ── État éditeur ──────────────────────────────────────────────────────────
  const [cells, setCells] = useState<(string|null)[][]>(
    () => saved?.cells ?? Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  // localStorage is read again after browser hydration.
  const [validated, setValidated] = useState<Block[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [painting, setPainting]   = useState(false);
  const [colorIdx, setColorIdx]   = useState(0);
  const [erasing, setErasing]     = useState(false);
  // La grille est le plan de construction du clavier MIDI.
  const [showGrid, setShowGrid]   = useState(true);
  // L'editeur est de nouveau disponible pour modifier le clavier construit.
  const [editOpen, setEditOpen]   = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);   // déployé par défaut
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Sauvegarde auto ───────────────────────────────────────────────────────
  // The hidden editor must not overwrite the saved keyboard with an empty state.
  useEffect(() => {
    const state = loadState();
    const timer = window.setTimeout(() => {
      setValidated(state?.validated ?? []);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!editOpen || !hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cells, validated })); } catch {}
  }, [cells, validated, editOpen, hydrated]);

  function saveKeyboard() {
    const backup = {
      schema: "op1-studio-keyboard",
      version: 1,
      saved_at: new Date().toISOString(),
      cells,
      validated,
    };
    try {
      const content = JSON.stringify(backup, null, 2);
      localStorage.setItem(STORAGE_KEY, content);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `op1-keyboard-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 1400);
    } catch {}
  }

  function clearKeyboard() {
    setCells(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setValidated([]);
    setSelectedBlock(null);
  }

  // ── Éditeur : peinture ────────────────────────────────────────────────────
  function cellAt(e: React.MouseEvent | MouseEvent): [number,number] | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width)  * COLS);
    const row = Math.floor(((e.clientY - r.top)  / r.height) * ROWS);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return [col, row];
  }

  function paint(e: React.MouseEvent | MouseEvent) {
    const pos = cellAt(e);
    if (!pos) return;
    const [col, row] = pos;
    setCells(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = erasing ? null : PALETTE[colorIdx].color;
      return next;
    });
  }

  // Espace : valider la sélection
  useEffect(() => {
    if (!editOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        const groups = new Map<string, { col: number; row: number }[]>();
        cells.forEach((row, r) => row.forEach((color, col) => {
          if (color) groups.set(color, [...(groups.get(color) ?? []), { col, row: r }]);
        }));
        if (groups.size) {
          const blocks = [...groups].map(([color, points]) => {
            const minC = Math.min(...points.map((p) => p.col));
            const maxC = Math.max(...points.map((p) => p.col));
            const minR = Math.min(...points.map((p) => p.row));
            const maxR = Math.max(...points.map((p) => p.row));
            return { col: minC, row: minR, w: maxC - minC + 1, h: maxR - minR + 1, color, type: colorToType(color) };
          });
          setValidated(v => [...v, ...blocks]);
          setCells(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
        }
      }
      if (e.key >= "1" && e.key <= "5") setColorIdx(Number(e.key)-1);
      // E efface la zone en cours sans changer le mode de peinture.
      if (e.key === "e" || e.key === "E") {
        if (selectedBlock !== null) {
          setValidated((current) => current.filter((_, index) => index !== selectedBlock));
          setSelectedBlock(null);
        } else {
          setCells(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
        }
        setErasing(false);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedBlock !== null) {
          setValidated((current) => current.filter((_, index) => index !== selectedBlock));
          setSelectedBlock(null);
        } else {
          setCells(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cells, colorIdx, editOpen, selectedBlock]);

  // ── Interface interactive : note mapping ──────────────────────────────────
  const [pressed, setPressed] = useState<Set<number>>(new Set());

  // Trie les blocs par position x pour assigner les notes dans l'ordre
  const whiteBlocks = [...validated.filter(b => b.type === "white")].sort((a,b) => a.col - b.col);
  const blackBlocks = [...validated.filter(b => b.type === "black")].sort((a,b) => a.col - b.col);
  const encBlocks   = [...validated.filter(b => b.type === "enc")  ].sort((a,b) => a.col - b.col);
  const fnBlocks    = [...validated.filter(b => b.type === "fn")   ].sort((a,b) => a.col - b.col);
  const transBlocks = [...validated.filter(b => b.type === "trans" )].sort((a,b) => a.col - b.col);

  function noteOn(note: number) {
    setPressed(s => new Set(s).add(note));
    if (mode === "midi") onSendMidi([0x90, Math.max(0, Math.min(127, note)), 100]);
  }
  function noteOff(note: number) {
    setPressed(s => { const ns = new Set(s); ns.delete(note); return ns; });
    if (mode === "midi") onSendMidi([0x80, Math.max(0, Math.min(127, note)), 0]);
  }

  // ── Encodeurs ─────────────────────────────────────────────────────────────
  const [encVals, setEncVals] = useState([64,64,64,64,64,64,64,64]);
  const encDrag = useRef<{idx:number; startY:number; startV:number}|null>(null);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <aside className="studio-machine-panel">

      {/* Barre de contrôle */}
      <div className="mpanel-bar">
        <button className="mpanel-bar-btn" onClick={() => setPanelOpen(v => !v)}>
          {panelOpen ? "▼ clavier" : "▲ clavier"}
        </button>
        {panelOpen && <button className="mpanel-bar-btn" onClick={() => setEditOpen(v => !v)}>
          {editOpen ? "masquer éditeur" : "✎ éditeur"}
        </button>}
        <span className="mgrid-hint">{validated.length} blocs</span>
        {editOpen && panelOpen && (
          <>
            {PALETTE.map((p,i) => (
              <button key={p.color}
                className={`mgrid-color${colorIdx===i?" is-active":""}`}
                style={{ background: p.color }}
                onClick={() => { setColorIdx(i); setErasing(false); }}
                title={p.label}
                aria-label={p.label}
              />
            ))}
            <button className={`mgrid-tool${erasing?" is-active":""}`} onClick={() => setErasing(v=>!v)}>
              {erasing ? "✕ gomme" : "✕"}
            </button>
            <button className={`mgrid-tool${showGrid?" is-active":""}`} onClick={() => setShowGrid(v=>!v)}>
              {showGrid ? "grille ON" : "grille OFF"}
            </button>
            <button className="mgrid-tool" onClick={saveKeyboard}>
              {savedNotice ? "clavier sauvegardé" : "sauvegarder clavier"}
            </button>
            <button className="mgrid-tool mgrid-clear-tool" onClick={clearKeyboard}>
              nettoyer la page
            </button>
            <span className="mgrid-hint">Espace : valider · E / Suppr : touche sélectionnée · 1-5 : couleur</span>
          </>
        )}
      </div>

      {panelOpen && editOpen && (
        <div className="mgrid-legend" aria-label="Légende des couleurs MIDI">
          {PALETTE.map((p) => (
            <span key={p.type} className="mgrid-legend-item">
              <i style={{ background: p.color }} aria-hidden="true" />
              {p.label}
            </span>
          ))}
        </div>
      )}

      {/* Éditeur (replié par défaut) */}
      {panelOpen && editOpen && (
        <div className="machine-grid-zone">
          <svg ref={svgRef} viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="none"
            style={{ width:"100%", height:"100%", display:"block", cursor: erasing ? "cell" : "crosshair" }}
            onMouseDown={e => { setSelectedBlock(null); setPainting(true); paint(e); }}
            onMouseMove={e => { if (painting) paint(e); }}
            onMouseUp={() => setPainting(false)}
            onMouseLeave={() => setPainting(false)}
          >
            {/* Blocs validés */}
            {validated.map((v,i) => (
              <rect key={i} x={v.col+.05} y={v.row+.05} width={v.w-.1} height={v.h-.1}
                fill={v.color+"55"} stroke={selectedBlock === i ? "#fff" : v.color}
                strokeWidth={selectedBlock === i ? .16 : .07} rx={.2}
                onPointerDown={(e) => { e.stopPropagation(); setSelectedBlock(i); }}
                aria-label={`Sélectionner ${v.type}`} />
            ))}
            {/* Peinture en cours */}
            {cells.map((row,r) => row.map((c,col) => c ? (
              <rect key={`${r}-${col}`} x={col+.08} y={r+.08} width={.84} height={.84} fill={c} rx={.12} />
            ) : null))}
            {/* Grille */}
            {showGrid && Array.from({length:COLS+1},(_,i) => (
              <line key={`v${i}`} x1={i} y1={0} x2={i} y2={ROWS}
                stroke={i%4===0?"rgba(220,40,40,0.78)":"rgba(220,40,40,0.34)"}
                strokeWidth={i%4===0?.05:.02} />
            ))}
            {showGrid && Array.from({length:ROWS+1},(_,i) => (
              <line key={`h${i}`} x1={0} y1={i} x2={COLS} y2={i}
                stroke={i%2===0?"rgba(220,40,40,0.78)":"rgba(220,40,40,0.34)"}
                strokeWidth={i%2===0?.05:.02} />
            ))}
            {/* Indicateur couleur */}
            <rect x={.1} y={.1} width={.8} height={.8}
              fill={erasing?"none":PALETTE[colorIdx].color}
              stroke={erasing?"rgba(255,60,60,0.6)":"none"} strokeWidth={.08}
              strokeDasharray=".15 .1" rx={.15} opacity={.9} />
          </svg>
        </div>
      )}

      {/* ── Interface interactive — plein écran ── */}
      {panelOpen && (
        <div className="machine-layout-zone">
          <svg viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="none"
            style={{ width:"100%", height:"100%", display:"block" }}
            onPointerUp={() => {
              // Note-off global si pointer lâché hors bouton
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
            {/* Fond */}
            <rect x={0} y={0} width={COLS} height={ROWS} fill="#181c1d" />

            {/* ── Touches blanches ── */}
            {whiteBlocks.map((b, i) => {
              const note = WHITE_NOTES[i] ?? (60 + i);
              const isDown = pressed.has(note);
              const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
              const name = NOTE_NAMES[note % 12];
              return (
                <g key={`w${i}`}
                  onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); noteOn(note); }}
                  onPointerUp={() => noteOff(note)}
                  onPointerLeave={() => { if (pressed.has(note)) noteOff(note); }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.35}
                    fill={isDown ? "#dfe4df" : "#fbfcf8"}
                    stroke="#a0a3a0" strokeWidth={.06}
                  />
                  {/* Ovale central */}
                  <rect
                    x={b.col + b.w*.22} y={b.row + b.h*.25}
                    width={b.w*.56} height={b.h*.45}
                    rx={b.w*.28}
                    fill={isDown?"#d7ddd7":"#eef1ed"}
                    stroke="#aaa" strokeWidth={.04}
                  />
                  {/* Nom de la note */}
                  <text x={b.col+b.w/2} y={b.row+b.h*.16}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={.55} fill="#5a5e5a" fontFamily="monospace" fontWeight="700">
                    {name}
                  </text>
                </g>
              );
            })}

            {/* ── Touches noires ── */}
            {blackBlocks.map((b, i) => {
              const note = BLACK_NOTES[i] ?? (61 + i*2);
              const isDown = pressed.has(note);
              return (
                <g key={`bk${i}`}
                  onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); noteOn(note); }}
                  onPointerUp={() => noteOff(note)}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.3}
                    fill={isDown?"#d0d3d0":"#cececb"}
                    stroke="#a0a3a0" strokeWidth={.06}
                  />
                  {/* Cercle noir */}
                  <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                    r={Math.min(b.w, b.h)*.32}
                    fill={isDown?"#333":"#0a0a0a"}
                  />
                </g>
              );
            })}

            {/* ── Encodeurs (bleu) ── */}
            {encBlocks.map((b, i) => {
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
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    encDrag.current = {idx:i, startY:e.clientY, startV:v};
                  }}
                  style={{ cursor: "ns-resize" }}
                >
                  <circle cx={cx} cy={cy} r={r} fill="#c8ccc8" stroke="#999" strokeWidth={.07}/>
                  <circle cx={cx} cy={cy} r={r*.75} fill="#b8bcb8" stroke="#888" strokeWidth={.04}/>
                  {/* Arc valeur */}
                  <circle cx={cx} cy={cy} r={r*.88}
                    fill="none" stroke={ec} strokeWidth={.18}
                    strokeDasharray={`${(v/127)*5.5} 6.3`}
                    strokeDashoffset="1.55"
                    strokeLinecap="round"
                    transform={`rotate(-135 ${cx} ${cy})`}
                  />
                  {/* Indicateur */}
                  <line x1={cx} y1={cy}
                    x2={cx + r*.65*Math.sin(angle)}
                    y2={cy - r*.65*Math.cos(angle)}
                    stroke="#444" strokeWidth={.1} strokeLinecap="round"/>
                  <circle cx={cx} cy={cy} r={.15} fill="#666"/>
                  {/* Label */}
                  <text x={cx} y={b.row+b.h+.55} textAnchor="middle"
                    fontSize={.55} fill={ec} fontFamily="monospace" fontWeight="700">
                    T{i+1}
                  </text>
                </g>
              );
            })}

            {/* ── Boutons de fonction (vert) ── */}
            {fnBlocks.map((b, i) => (
              <g key={`fn${i}`} style={{ cursor: "pointer" }}
                onPointerDown={() => { if (mode==="midi") onSendMidi([0x99, 36+i, 100]); }}
              >
                <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                  rx={.3} fill="#cececb" stroke="#a0a3a0" strokeWidth={.07}/>
                <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                  r={Math.min(b.w,b.h)*.3} fill="#00ED95"/>
              </g>
            ))}

            {/* ── Transport / spécial (rouge) ── */}
            {transBlocks.map((b, i) => (
              <g key={`tr${i}`} style={{ cursor: "pointer" }}
                onPointerDown={() => { if (i===0) onTogglePlayback(); }}
              >
                <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                  rx={.3} fill="#cececb" stroke="#a0a3a0" strokeWidth={.07}/>
                <circle cx={b.col+b.w/2} cy={b.row+b.h/2}
                  r={Math.min(b.w,b.h)*.28} fill="#FF3A5D"/>
              </g>
            ))}

            {/* Dégradés */}
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
