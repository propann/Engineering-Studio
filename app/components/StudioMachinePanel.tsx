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

// ── Référence complète des touches de la vraie machine (14 août 2026) ──────
// Le clavier construit ci-dessous ne représente que des familles génériques
// (blanche/noire/encodeur/bouton vert/transport) : il ne connaît pas les
// vrais noms imprimés sur l'OP-1. Cette liste documente les vrais boutons,
// avec leur icône, indépendamment de ce qui est câblé plus haut — source :
// guide officiel teenage.engineering/guides/op-1/original/layout (14 août
// 2026), recoupé avec OP1_KNOWLEDGE_BASE.md pour Shift+COM/TE-boot. Les
// familles réellement câblées et testables ici (notes, T1-T4, boutons verts
// génériques) sont listées séparément, avec leur dernier message envoyé.
type ControlVisual = "key" | "enc" | "fn" | "trans" | "knob" | "button" | "arrow" | "speaker" | "screen" | "battery" | "plug" | "mic";
type ControlRefEntry = { id: string; label: string; visual: ControlVisual; note: string };
const OP1_CONTROL_GROUPS: { label: string; entries: ControlRefEntry[] }[] = [
  { label: "Modes principaux", entries: [
    { id: "synth", label: "SYNTH", visual: "fn", note: "guide TE « main modes »" },
    { id: "drum", label: "DRUM", visual: "fn", note: "guide TE « main modes »" },
    { id: "tape", label: "TAPE", visual: "fn", note: "guide TE « main modes »" },
    { id: "mixer", label: "MIXER", visual: "fn", note: "guide TE « main modes »" },
  ] },
  { label: "Sélection de son", entries: [
    { id: "sound18", label: "SOUND 1–8", visual: "fn", note: "8 boutons, choix moteur/échantillon" },
    { id: "sequencer", label: "SEQUENCER", visual: "fn", note: "bouton dédié" },
  ] },
  { label: "Système", entries: [
    { id: "shift", label: "SHIFT", visual: "button", note: "accès secondaire de chaque bouton" },
    { id: "com", label: "ALBUM / COM", visual: "plug", note: "disque, MIDI, TE-boot — Shift+COM" },
    { id: "help", label: "HELP", visual: "button", note: "aide contextuelle" },
    { id: "tempo", label: "TEMPO", visual: "knob", note: "horloge interne" },
    { id: "volume", label: "VOLUME", visual: "knob", note: "potentiomètre général" },
  ] },
  { label: "Bande", entries: [
    { id: "transport", label: "Transport (lecture/stop/enregistrement)", visual: "trans", note: "guide TE « tape transport »" },
    { id: "tapeedits", label: "Édition (cut/copy/loop…)", visual: "button", note: "guide TE « tape edits »" },
    { id: "nav", label: "Navigation (rewind/forward, octave ±, pas ±)", visual: "arrow", note: "guide TE « navigation buttons »" },
  ] },
  { label: "Audio", entries: [
    { id: "micin", label: "Entrée MIC/LINE", visual: "mic", note: "jack d'entrée" },
    { id: "micbuiltin", label: "Micro intégré", visual: "mic", note: "capture interne" },
    { id: "speaker", label: "Haut-parleur", visual: "speaker", note: "sortie intégrée" },
  ] },
  { label: "Affichage", entries: [
    { id: "display", label: "Écran", visual: "screen", note: "interface graphique" },
    { id: "vu", label: "VU / batterie", visual: "battery", note: "niveau + charge" },
  ] },
];

function ControlGlyph({ visual }: { visual: ControlVisual }) {
  const COLORS: Record<ControlVisual, string> = {
    key: "#8f89aa", enc: "#698EFF", fn: "#00ED95", trans: "#FF3A5D",
    knob: "#c9a227", button: "#7a8a86", arrow: "#5a7a72", speaker: "#5a7a72",
    screen: "#3a5550", battery: "#3a5550", plug: "#8a6fb0", mic: "#5a7a72",
  };
  const c = COLORS[visual];
  switch (visual) {
    case "key": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={2} y={2} width={5} height={14} rx={1} fill="#DFD9FF" stroke={c} strokeWidth={1} />
        <rect x={7.5} y={2} width={3} height={9} rx={1} fill="#171a1b" />
        <rect x={12} y={2} width={4} height={14} rx={1} fill="#DFD9FF" stroke={c} strokeWidth={1} />
      </svg>
    );
    case "enc": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={2} />
        <line x1={9} y1={9} x2={9} y2={3.5} stroke={c} strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
    case "fn": case "trans": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={2} y={2} width={14} height={14} rx={3} fill="#cececb" stroke="#a0a3a0" />
        <circle cx={9} cy={9} r={4} fill={c} />
      </svg>
    );
    case "knob": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={2} />
        <circle cx={9} cy={9} r={2} fill={c} />
      </svg>
    );
    case "arrow": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <path d="M4 9h10M4 9l4-4M4 9l4 4M14 9l-4-4M14 9l-4 4" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
    case "speaker": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <path d="M3 7h3l4-3v10l-4-3H3z" fill={c} />
        <path d="M12 6q2 3 0 6" stroke={c} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </svg>
    );
    case "mic": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={7} y={2} width={4} height={9} rx={2} fill={c} />
        <path d="M5 9a4 4 0 0 0 8 0M9 13v3M6 16h6" stroke={c} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </svg>
    );
    case "screen": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={2} y={4} width={14} height={9} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
        <line x1={6} y1={16} x2={12} y2={16} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    );
    case "battery": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={2} y={5} width={12} height={8} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
        <rect x={14.5} y={7.5} width={2} height={3} fill={c} />
        <rect x={4} y={7} width={6} height={4} fill={c} />
      </svg>
    );
    case "plug": return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={5} y={7} width={8} height={6} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
        <line x1={7} y1={7} x2={7} y2={4} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
        <line x1={11} y1={7} x2={11} y2={4} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    );
    case "button": default: return (
      <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
        <rect x={2} y={2} width={14} height={14} rx={3} fill="none" stroke={c} strokeWidth={2} />
      </svg>
    );
  }
}

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
  // Dernier message envoyé par famille câblée — pour la liste de référence
  // ci-dessous (« ça envoie les messages à l'ordi », 14 août 2026) : sans ça
  // la liste resterait une doc statique, sans lien avec ce qui se passe
  // réellement quand on joue sur ce clavier construit.
  const [lastEnc, setLastEnc] = useState<{ idx: number; v: number } | null>(null);
  const [lastFn, setLastFn] = useState<number | null>(null);

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
        <div className="machine-config-panel-wrap">
          <div className="machine-config-panel" aria-label="Configuration du contrôle MIDI">
            {configTarget ? <>
              <strong>{configTarget.label}</strong>
              <span>{configTarget.type === "note" ? `Note MIDI ${WHITE_NOTES[configTarget.index] ?? BLACK_NOTES[configTarget.index] ?? "-"}` : configTarget.type === "enc" ? `CC MIDI ${70 + configTarget.index}` : `Commande MIDI ${36 + configTarget.index}`}</span>
              <small>Cliquez un autre contrôle pour le configurer.</small>
            </> : <small>Cliquez un bouton virtuel, une note ou un potentiomètre sur le clavier.</small>}
          </div>

          <div className="control-reference" aria-label="Liste complète des touches de la machine">
            <div className="control-ref-section">
              <strong>Câblé ici — envoie réellement des messages</strong>
              <div className="control-ref-row">
                <ControlGlyph visual="key" />
                <span>Clavier de notes ({whiteBlocks.length + blackBlocks.length} touches construites)</span>
                <span className="control-ref-live">{lastPlayed}</span>
              </div>
              {encBlocks.map((_, i) => (
                <div className="control-ref-row" key={`refenc${i}`}>
                  <ControlGlyph visual="enc" />
                  <span>T{i + 1} (encodeur) — CC MIDI {70 + i}</span>
                  <span className="control-ref-live">{lastEnc?.idx === i ? `valeur ${lastEnc.v}` : "—"}</span>
                </div>
              ))}
              <div className="control-ref-row">
                <ControlGlyph visual="fn" />
                <span>{fnBlocks.length} boutons verts génériques — Note ON canal 10, 36+index</span>
                <span className="control-ref-live">{lastFn !== null ? `note ${36 + lastFn}` : "—"}</span>
              </div>
              <div className="control-ref-row">
                <ControlGlyph visual="trans" />
                <span>{transBlocks.length} boutons transport — lecture/pause seulement pour l&apos;instant</span>
                <span className="control-ref-note">pas encore en MIDI</span>
              </div>
            </div>

            <div className="control-ref-section">
              <strong>Référence — vraies touches OP-1 (guide officiel TE)</strong>
              {OP1_CONTROL_GROUPS.map((group) => (
                <div key={group.label} className="control-ref-group">
                  <span className="control-ref-group-label">{group.label}</span>
                  {group.entries.map((entry) => (
                    <div className="control-ref-row" key={entry.id}>
                      <ControlGlyph visual={entry.visual} />
                      <span>{entry.label}</span>
                      <span className="control-ref-note">{entry.note}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
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
              setLastEnc({ idx, v });
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
                onPointerDown={(e) => { if (configOpen) { e.stopPropagation(); selectConfig("button", i, `Bouton ${i + 1}`); return; } setLastFn(i); if (mode==="midi") onSendMidi([0x99, 36+i, 100]); }}
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
