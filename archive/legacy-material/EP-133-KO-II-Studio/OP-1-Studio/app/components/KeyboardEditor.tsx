"use client";
/**
 * KeyboardEditor — éditeur de grille du clavier MIDI, déplacé dans la
 * fenêtre Exercices (13 août 2026). Peint la disposition (notes blanches/
 * noires, encodeurs, boutons, transport) et l'enregistre sous la même clé
 * (`op1-studio-grid-v1`, local ou coffre natif) que celle relue par
 * `StudioMachinePanel` — construire ici met donc à jour le clavier joué du
 * Studio, sans dépendance directe entre les deux composants.
 *
 * Couleurs → types :
 *   #DFD9FF  blanc   → touche blanche piano
 *   #e8a020  orange  → touche noire piano
 *   #698EFF  bleu    → encodeur (potard)
 *   #00ED95  vert    → bouton de fonction
 *   #FF3A5D  rouge   → transport / spécial
 */
import { useEffect, useRef, useState } from "react";
import keyboardTemplate from "../../data/keyboard/default.json";
import { hasNativeStorage, readNativeKeyboard, writeNativeKeyboard } from "../lib/nativeStorage";

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

const DEFAULT_BLOCKS: Block[] = keyboardTemplate.validated as Block[];
const DEFAULT_CELLS = keyboardTemplate.cells as (string|null)[][];

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
    if (hasNativeStorage()) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.validated) {
      data.validated = data.validated.map((b: Block & { type?: string }) => ({
        ...b,
        type: b.type ?? colorToType(b.color),
      }));
    }
    return data;
  } catch { return null; }
}

export function KeyboardEditor() {
  const saved = loadState();

  const [cells, setCells] = useState<(string|null)[][]>(() => saved?.cells ?? DEFAULT_CELLS);
  const [validated, setValidated] = useState<Block[]>(() => saved?.validated ?? (saved === null ? DEFAULT_BLOCKS : []));
  const [hydrated, setHydrated] = useState(false);
  const [painting, setPainting] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [erasing, setErasing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let active = true;
    const applyState = (state: { cells: (string|null)[][]; validated: Block[] } | null) => {
      if (!active) return;
      setCells(state?.cells ?? DEFAULT_CELLS);
      setValidated(state?.validated ?? DEFAULT_BLOCKS);
      setHydrated(true);
    };
    if (hasNativeStorage()) {
      void readNativeKeyboard()?.then((raw) => {
        try { applyState(raw ? JSON.parse(raw) as { cells: (string|null)[][]; validated: Block[] } : null); } catch { applyState(null); }
      }).catch(() => applyState(null));
      return () => { active = false; };
    }
    const state = loadState();
    const timer = window.setTimeout(() => applyState(state), 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const content = JSON.stringify({ cells, validated });
    if (hasNativeStorage()) { void writeNativeKeyboard(content)?.catch(() => undefined); return; }
    try { localStorage.setItem(STORAGE_KEY, content); } catch {}
  }, [cells, validated, hydrated]);

  function saveKeyboard() {
    const backup = { schema: "op1-studio-keyboard", version: 1, saved_at: new Date().toISOString(), cells, validated };
    try {
      const content = JSON.stringify(backup, null, 2);
      if (hasNativeStorage()) void writeNativeKeyboard(content)?.catch(() => undefined);
      else localStorage.setItem(STORAGE_KEY, content);
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

  function cellAt(e: React.MouseEvent | MouseEvent): [number, number] | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * COLS);
    const row = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return [col, row];
  }

  function paint(e: React.MouseEvent | MouseEvent) {
    const pos = cellAt(e);
    if (!pos) return;
    const [col, row] = pos;
    setCells((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = erasing ? null : PALETTE[colorIdx].color;
      return next;
    });
  }

  useEffect(() => {
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
          setValidated((v) => [...v, ...blocks]);
          setCells(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
        }
      }
      if (e.key >= "1" && e.key <= "5") setColorIdx(Number(e.key) - 1);
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
  }, [cells, colorIdx, selectedBlock]);

  return (
    <div className="keyboard-editor">
      <div className="mpanel-bar">
        {PALETTE.map((p, i) => (
          <button key={p.color}
            className={`mgrid-color${colorIdx === i ? " is-active" : ""}`}
            style={{ background: p.color }}
            onClick={() => { setColorIdx(i); setErasing(false); }}
            title={p.label}
            aria-label={p.label}
          />
        ))}
        <button className={`mgrid-tool${erasing ? " is-active" : ""}`} onClick={() => setErasing((v) => !v)}>{erasing ? "✕ gomme" : "✕"}</button>
        <button className={`mgrid-tool${showGrid ? " is-active" : ""}`} onClick={() => setShowGrid((v) => !v)}>{showGrid ? "grille ON" : "grille OFF"}</button>
        <button className="mgrid-tool" onClick={saveKeyboard}>{savedNotice ? "clavier sauvegardé" : "sauvegarder clavier"}</button>
        <button className="mgrid-tool mgrid-clear-tool" onClick={clearKeyboard}>nettoyer la page</button>
        <span className="mgrid-hint">{validated.length} blocs · Espace : valider · E / Suppr : touche sélectionnée · 1-5 : couleur</span>
      </div>

      <div className="mgrid-legend" aria-label="Légende des couleurs MIDI">
        {PALETTE.map((p) => (
          <span key={p.type} className="mgrid-legend-item"><i style={{ background: p.color }} aria-hidden="true" />{p.label}</span>
        ))}
      </div>

      <div className="machine-grid-zone">
        <svg ref={svgRef} viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block", cursor: erasing ? "cell" : "crosshair" }}
          onMouseDown={(e) => { setSelectedBlock(null); setPainting(true); paint(e); }}
          onMouseMove={(e) => { if (painting) paint(e); }}
          onMouseUp={() => setPainting(false)}
          onMouseLeave={() => setPainting(false)}
        >
          {validated.map((v, i) => (
            <rect key={i} x={v.col + .05} y={v.row + .05} width={v.w - .1} height={v.h - .1}
              fill={v.color + "55"} stroke={selectedBlock === i ? "#fff" : v.color}
              strokeWidth={selectedBlock === i ? .16 : .07} rx={.2}
              onPointerDown={(e) => { e.stopPropagation(); setSelectedBlock(i); }}
              aria-label={`Sélectionner ${v.type}`} />
          ))}
          {cells.map((row, r) => row.map((c, col) => c ? (
            <rect key={`${r}-${col}`} x={col + .08} y={r + .08} width={.84} height={.84} fill={c} rx={.12} />
          ) : null))}
          {showGrid && Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i} y1={0} x2={i} y2={ROWS} stroke={i % 4 === 0 ? "rgba(220,40,40,0.78)" : "rgba(220,40,40,0.34)"} strokeWidth={i % 4 === 0 ? .05 : .02} />
          ))}
          {showGrid && Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i} x2={COLS} y2={i} stroke={i % 2 === 0 ? "rgba(220,40,40,0.78)" : "rgba(220,40,40,0.34)"} strokeWidth={i % 2 === 0 ? .05 : .02} />
          ))}
          <rect x={.1} y={.1} width={.8} height={.8}
            fill={erasing ? "none" : PALETTE[colorIdx].color}
            stroke={erasing ? "rgba(255,60,60,0.6)" : "none"} strokeWidth={.08}
            strokeDasharray=".15 .1" rx={.15} opacity={.9} />
        </svg>
      </div>
    </div>
  );
}
