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
type ControlVisual =
  | "key" | "enc" | "fn" | "trans" | "knob" | "button" | "arrow" | "speaker" | "screen" | "battery" | "plug" | "mic"
  // Familles génériques ci-dessus ; formes propres ci-dessous pour chaque
  // vrai bouton qu'on connaît avec certitude (14 août 2026, demande :
  // « faut cloner un maximum les bouton officiel que nos logo soit top »).
  | "synth" | "drum" | "tape-mode" | "mixer" | "seq" | "shift" | "help" | "tempo"
  | "play" | "rec" | "stop" | "rewind" | "forward" | "octave-up" | "octave-down" | "step-back" | "step-fwd";
type ControlRefEntry = { id: string; label: string; visual: ControlVisual; note: string };
const OP1_CONTROL_GROUPS: { label: string; entries: ControlRefEntry[] }[] = [
  { label: "Modes principaux", entries: [
    { id: "synth", label: "SYNTH", visual: "synth", note: "guide TE « main modes »" },
    { id: "drum", label: "DRUM", visual: "drum", note: "guide TE « main modes »" },
    { id: "tape", label: "TAPE", visual: "tape-mode", note: "guide TE « main modes »" },
    { id: "mixer", label: "MIXER", visual: "mixer", note: "guide TE « main modes »" },
  ] },
  { label: "Sélection de son", entries: [
    { id: "sound1", label: "SOUND 1", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound2", label: "SOUND 2", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound3", label: "SOUND 3", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound4", label: "SOUND 4", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound5", label: "SOUND 5", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound6", label: "SOUND 6", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound7", label: "SOUND 7", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sound8", label: "SOUND 8", visual: "fn", note: "choix moteur/échantillon" },
    { id: "sequencer", label: "SEQUENCER", visual: "seq", note: "bouton dédié" },
  ] },
  { label: "Système", entries: [
    { id: "shift", label: "SHIFT", visual: "shift", note: "accès secondaire de chaque bouton" },
    { id: "com", label: "ALBUM / COM", visual: "plug", note: "disque, MIDI, TE-boot — Shift+COM" },
    { id: "help", label: "HELP", visual: "help", note: "aide contextuelle" },
    { id: "tempo", label: "TEMPO", visual: "tempo", note: "horloge interne" },
    { id: "volume", label: "VOLUME", visual: "knob", note: "potentiomètre général" },
  ] },
  { label: "Bande", entries: [
    { id: "transport-play", label: "Lecture / Pause", visual: "play", note: "guide TE « tape transport »" },
    { id: "transport-rec", label: "Enregistrement", visual: "rec", note: "guide TE « tape transport »" },
    { id: "transport-stop", label: "Stop", visual: "stop", note: "guide TE « tape transport »" },
    { id: "tapeedits", label: "Édition (cut/copy/loop…)", visual: "button", note: "guide TE « tape edits », pas détaillé bouton par bouton" },
    { id: "nav-rewind", label: "Rewind « << »", visual: "rewind", note: "guide TE « navigation buttons »" },
    { id: "nav-forward", label: "Avance rapide « >> »", visual: "forward", note: "guide TE « navigation buttons »" },
    { id: "nav-octave-down", label: "Octave −", visual: "octave-down", note: "guide TE « navigation buttons »" },
    { id: "nav-octave-up", label: "Octave +", visual: "octave-up", note: "guide TE « navigation buttons »" },
    { id: "nav-step-back", label: "Pas arrière", visual: "step-back", note: "guide TE « navigation buttons »" },
    { id: "nav-step-fwd", label: "Pas avant", visual: "step-fwd", note: "guide TE « navigation buttons »" },
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

// ── Noms réels appliqués aux boutons construits (14 août 2026, après-midi) ──
// Les 27 blocs verts et 3 blocs rouges du clavier construit n'ont pas de
// correspondance position→bouton réel vérifiée (voir commentaire plus haut).
// À la demande explicite de l'utilisateur (« bien regle les bouton avec les
// info qie tu a »), on assigne quand même les vrais noms qu'on connaît avec
// certitude (mêmes que OP1_CONTROL_GROUPS ci-dessus), dans l'ordre des blocs
// tels que construits gauche→droite (même logique que WHITE_NOTES/
// BLACK_NOTES) : les premiers blocs prennent un vrai nom, le reste — au-delà
// de ce qu'on sait vraiment — reste générique plutôt que d'inventer une
// correspondance qui n'existe pas.
const FN_REAL_LABELS = [
  "SYN", "DRM", "TAP", "MIX",
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
  "SEQ", "SFT", "COM", "HLP",
];
// Même ordre que FN_REAL_LABELS : la vraie forme quand on la connaît avec
// certitude (les 8 SOUND n'ont pas de pictogramme distinct connu — un
// simple numéro suffit, `null` garde le point plein générique).
const FN_STATIC_VISUAL: (ControlVisual | null)[] = [
  "synth", "drum", "tape-mode", "mixer",
  null, null, null, null, null, null, null, null,
  "seq", "shift", "plug", "help",
];
// Index 0 = déjà câblé sur onTogglePlayback ; 1-2 affichés mais sans action
// (aucune fonction d'enregistrement/stop implémentée côté clone pour l'instant).
const TRANS_REAL_LABELS = ["Lecture / Pause", "Enregistrement", "Stop"];
const TRANS_SHORT_LABELS = ["LEC", "ENR", "STO"];
const TRANS_STATIC_VISUAL: ControlVisual[] = ["play", "rec", "stop"];

// ── Association « touche réelle → bouton construit » (14 août 2026, fin
// d'après-midi) ─────────────────────────────────────────────────────────
// Procédure demandée : sélectionner une touche réelle dans la liste de
// référence, cliquer un bouton vert/rouge du clavier construit, puis
// appuyer la touche correspondante sur la vraie machine — le prochain
// message MIDI brut reçu devient la signature de ce bouton. Persistée en
// localStorage (pas le coffre natif : c'est un réglage de confort d'un seul
// clavier construit, pas une donnée machine).
type LearnedBinding = { realId: string; realLabel: string; visual: ControlVisual; midi: number[] };
type LearnedMap = Record<string, LearnedBinding>;
const LEARNED_MAP_KEY = "op1-studio-control-map-v1";
function loadLearnedMapSync(): LearnedMap {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(LEARNED_MAP_KEY);
    return raw ? (JSON.parse(raw) as LearnedMap) : {};
  } catch { return {}; }
}

// ── Journal MIDI (14 août 2026) ─────────────────────────────────────────
// « un retour midi un journal midi sovedardable dans les dossier de l'ordi
// du client » : trace chaque message MIDI (entrant depuis l'OP-1, sortant
// vers l'OP-1) et permet de le télécharger — même schéma Blob+lien que
// `saveProject` dans app/page.tsx, pas de nouveauté d'infra.
type MidiLogEntry = { id: number; dir: "in" | "out"; time: number; data: number[]; label?: string };
const MIDI_LOG_LIMIT = 300;
function hexBytes(data: number[]) {
  return data.map((b) => b.toString(16).padStart(2, "0")).join(" ");
}
function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

const CONTROL_GLYPH_COLORS: Record<ControlVisual, string> = {
  key: "#8f89aa", enc: "#698EFF", fn: "#00ED95", trans: "#FF3A5D",
  knob: "#c9a227", button: "#7a8a86", arrow: "#5a7a72", speaker: "#5a7a72",
  screen: "#3a5550", battery: "#3a5550", plug: "#8a6fb0", mic: "#5a7a72",
  synth: "#00ED95", drum: "#00ED95", "tape-mode": "#00ED95", mixer: "#00ED95", seq: "#00ED95",
  shift: "#7a8a86", help: "#7a8a86", tempo: "#c9a227",
  play: "#FF3A5D", rec: "#FF3A5D", stop: "#FF3A5D",
  rewind: "#5a7a72", forward: "#5a7a72", "octave-up": "#5a7a72", "octave-down": "#5a7a72",
  "step-back": "#5a7a72", "step-fwd": "#5a7a72",
};

/** Formes seules, coordonnées 0-18 — réutilisées telles quelles par
 * `ControlGlyph` (liste de référence) et `EmbeddedGlyph` (incrustées dans un
 * bouton du clavier construit, 14 août 2026 : « on remplace la pastille de
 * couleur par le logo de la touche » une fois une association apprise). */
function ControlGlyphShape({ visual }: { visual: ControlVisual }) {
  const c = CONTROL_GLYPH_COLORS[visual];
  switch (visual) {
    case "key": return (<>
      <rect x={2} y={2} width={5} height={14} rx={1} fill="#DFD9FF" stroke={c} strokeWidth={1} />
      <rect x={7.5} y={2} width={3} height={9} rx={1} fill="#171a1b" />
      <rect x={12} y={2} width={4} height={14} rx={1} fill="#DFD9FF" stroke={c} strokeWidth={1} />
    </>);
    case "enc": return (<>
      <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={2} />
      <line x1={9} y1={9} x2={9} y2={3.5} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </>);
    case "fn": case "trans": return (<>
      <rect x={2} y={2} width={14} height={14} rx={3} fill="#cececb" stroke="#a0a3a0" />
      <circle cx={9} cy={9} r={4} fill={c} />
    </>);
    case "knob": return (<>
      <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={2} />
      <circle cx={9} cy={9} r={2} fill={c} />
    </>);
    case "arrow": return (
      <path d="M4 9h10M4 9l4-4M4 9l4 4M14 9l-4-4M14 9l-4 4" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "synth": return (
      <path d="M2 11 Q5 4 9 11 T16 11" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    );
    case "drum": return (<>
      <rect x={2.5} y={2.5} width={5.5} height={5.5} rx={1} fill={c} />
      <rect x={10} y={2.5} width={5.5} height={5.5} rx={1} fill={c} opacity={.5} />
      <rect x={2.5} y={10} width={5.5} height={5.5} rx={1} fill={c} opacity={.5} />
      <rect x={10} y={10} width={5.5} height={5.5} rx={1} fill={c} />
    </>);
    case "tape-mode": return (<>
      <rect x={2} y={4} width={14} height={10} rx={1.5} fill="none" stroke={c} strokeWidth={1.4} />
      <circle cx={6.5} cy={9} r={2} fill="none" stroke={c} strokeWidth={1.2} />
      <circle cx={11.5} cy={9} r={2} fill="none" stroke={c} strokeWidth={1.2} />
    </>);
    case "mixer": return (<>
      <line x1={5} y1={3} x2={5} y2={15} stroke={c} strokeWidth={1.2} />
      <rect x={3.3} y={6.5} width={3.4} height={2} rx={.6} fill={c} />
      <line x1={9} y1={3} x2={9} y2={15} stroke={c} strokeWidth={1.2} />
      <rect x={7.3} y={10.5} width={3.4} height={2} rx={.6} fill={c} />
      <line x1={13} y1={3} x2={13} y2={15} stroke={c} strokeWidth={1.2} />
      <rect x={11.3} y={4} width={3.4} height={2} rx={.6} fill={c} />
    </>);
    case "seq": return (<>
      <circle cx={3.5} cy={9} r={1.7} fill={c} />
      <circle cx={7.7} cy={9} r={1.7} fill={c} opacity={.5} />
      <circle cx={11.9} cy={9} r={1.7} fill={c} />
      <circle cx={14.5} cy={9} r={1.7} fill={c} opacity={.5} />
    </>);
    case "shift": return (
      <path d="M9 3.5 L14.5 10 L11 10 L11 14.5 L7 14.5 L7 10 L3.5 10 Z" fill={c} />
    );
    case "help": return (
      <text x={9} y={13.5} textAnchor="middle" fontSize={12} fontFamily="monospace" fontWeight={700} fill={c}>?</text>
    );
    case "tempo": return (<>
      <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={1.6} />
      <line x1={9} y1={9} x2={9} y2={4.8} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      <line x1={9} y1={9} x2={12} y2={9} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
    </>);
    case "play": return (<path d="M6 4 L14 9 L6 14 Z" fill={c} />);
    case "rec": return (<circle cx={9} cy={9} r={5.5} fill={c} />);
    case "stop": return (<rect x={4} y={4} width={10} height={10} rx={1} fill={c} />);
    case "rewind": return (<>
      <path d="M14 4 L9 9 L14 14 Z" fill={c} />
      <path d="M8 4 L3 9 L8 14 Z" fill={c} />
    </>);
    case "forward": return (<>
      <path d="M4 4 L9 9 L4 14 Z" fill={c} />
      <path d="M10 4 L15 9 L10 14 Z" fill={c} />
    </>);
    case "octave-up": return (
      <path d="M4 12 L9 5 L14 12" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "octave-down": return (
      <path d="M4 6 L9 13 L14 6" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "step-back": return (
      <path d="M11 4 L6 9 L11 14" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "step-fwd": return (
      <path d="M7 4 L12 9 L7 14" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "speaker": return (<>
      <path d="M3 7h3l4-3v10l-4-3H3z" fill={c} />
      <path d="M12 6q2 3 0 6" stroke={c} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>);
    case "mic": return (<>
      <rect x={7} y={2} width={4} height={9} rx={2} fill={c} />
      <path d="M5 9a4 4 0 0 0 8 0M9 13v3M6 16h6" stroke={c} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>);
    case "screen": return (<>
      <rect x={2} y={4} width={14} height={9} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
      <line x1={6} y1={16} x2={12} y2={16} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </>);
    case "battery": return (<>
      <rect x={2} y={5} width={12} height={8} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
      <rect x={14.5} y={7.5} width={2} height={3} fill={c} />
      <rect x={4} y={7} width={6} height={4} fill={c} />
    </>);
    case "plug": return (<>
      <rect x={5} y={7} width={8} height={6} rx={1.5} fill="none" stroke={c} strokeWidth={1.6} />
      <line x1={7} y1={7} x2={7} y2={4} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={11} y1={7} x2={11} y2={4} stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </>);
    case "button": default: return (
      <rect x={2} y={2} width={14} height={14} rx={3} fill="none" stroke={c} strokeWidth={2} />
    );
  }
}

function ControlGlyph({ visual }: { visual: ControlVisual }) {
  return (
    <svg viewBox="0 0 18 18" width={14} height={14} aria-hidden="true">
      <ControlGlyphShape visual={visual} />
    </svg>
  );
}

/** Même glyphe, incrusté directement dans les coordonnées de la grille
 * construite (pas de `<svg>` imbriqué à dimensionner en pixels) : centré
 * sur (cx,cy), rayon `r`. */
function EmbeddedGlyph({ visual, cx, cy, r }: { visual: ControlVisual; cx: number; cy: number; r: number }) {
  const scale = (r * 2) / 18;
  return (
    <g transform={`translate(${cx - r} ${cy - r}) scale(${scale})`}>
      <ControlGlyphShape visual={visual} />
    </g>
  );
}

export function StudioMachinePanel({
  mode = "clone",
  pressedNotes = [],
  onTogglePlayback,
  onSendMidi,
  notesOnly = false,
  onPressedChange,
  lastRawMidiIn = null,
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
  /** Octets bruts du dernier message MIDI reçu de l'OP-1, quel que soit son
   * type (pas seulement note on/off comme `pressedNotes`) — nouvelle
   * référence à chaque message, même si les octets sont identiques au
   * précédent. Alimente le journal MIDI et la procédure d'association
   * (14 août 2026). */
  lastRawMidiIn?: number[] | null;
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
    if (mode === "midi") sendMidi([0x90, Math.max(0, Math.min(127, note)), 100], `note ${midiNoteName(note)}`);
  }

  function noteOff(note: number) {
    setPressed(s => { const ns = new Set(s); ns.delete(note); return ns; });
    if (mode === "midi") sendMidi([0x80, Math.max(0, Math.min(127, note)), 0], `note ${midiNoteName(note)} off`);
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
  // Anime brièvement le bouton pressé — les boutons verts/rouges ne
  // suivent pas un cycle down/up MIDI comme les notes (l'action part au
  // pointerDown), donc ce sont des sets purement visuels, remis à zéro au
  // relâchement ou si le pointeur quitte le bouton (14 août 2026, demande :
  // « toute les touche du clavier reagisse comme les note en bougant »).
  const [pressedFn, setPressedFn] = useState<Set<number>>(new Set());
  const [pressedTrans, setPressedTrans] = useState<Set<number>>(new Set());
  // Minuteurs des « flashs » déclenchés par un vrai appui matériel (voir
  // plus bas) — nettoyés au démontage pour ne jamais toucher un composant
  // déjà parti.
  const flashTimersRef = useRef<number[]>([]);
  useEffect(() => () => { flashTimersRef.current.forEach((t) => window.clearTimeout(t)); }, []);

  // ── Journal MIDI : trace tout ce qui part (sendMidi ci-dessous) et tout
  // ce qui arrive (lastRawMidiIn) — plafonné pour ne pas grossir sans fin
  // pendant une longue session. ──────────────────────────────────────────
  const [midiLog, setMidiLog] = useState<MidiLogEntry[]>([]);
  const midiLogIdRef = useRef(0);
  function logMidi(dir: "in" | "out", data: number[], label?: string) {
    midiLogIdRef.current += 1;
    setMidiLog((prev) => {
      const next = [...prev, { id: midiLogIdRef.current, dir, time: Date.now(), data, label }];
      return next.length > MIDI_LOG_LIMIT ? next.slice(next.length - MIDI_LOG_LIMIT) : next;
    });
  }
  /** Remplace tous les appels directs à `onSendMidi` : journalise avant
   * d'envoyer, pour que le journal reflète exactement ce qui part vers la
   * machine, pas une reconstruction approximative après coup. */
  function sendMidi(data: number[], label?: string) {
    logMidi("out", data, label);
    onSendMidi(data);
  }
  function downloadMidiLog() {
    const header = "horodatage\tsens\toctets (hex)\tlabel";
    const lines = midiLog.map((e) => `${new Date(e.time).toISOString()}\t${e.dir === "in" ? "IN " : "OUT"}\t${hexBytes(e.data)}\t${e.label ?? ""}`);
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `op1-studio-midi-journal-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ── Procédure d'association touche réelle → bouton construit ───────────
  const [learnedMap, setLearnedMap] = useState<LearnedMap>(() => loadLearnedMapSync());
  useEffect(() => {
    try { localStorage.setItem(LEARNED_MAP_KEY, JSON.stringify(learnedMap)); } catch { /* stockage indisponible (navigation privée) : tant pis, pas bloquant */ }
  }, [learnedMap]);
  const [learnStep, setLearnStep] = useState<"pick-virtual" | "listen-machine" | null>(null);
  const [learnReal, setLearnReal] = useState<ControlRefEntry | null>(null);
  const [learnVirtual, setLearnVirtual] = useState<{ key: string; label: string } | null>(null);
  const [learnBaseline, setLearnBaseline] = useState<number[] | null>(null);
  const [learnFeedback, setLearnFeedback] = useState<string | null>(null);

  function startLearn(entry: ControlRefEntry) {
    setLearnReal(entry);
    setLearnVirtual(null);
    setLearnFeedback(null);
    setLearnStep("pick-virtual");
  }
  function pickVirtualForLearn(type: string, index: number, label: string) {
    setLearnVirtual({ key: `${type}-${index}`, label });
    setLearnBaseline(lastRawMidiIn ?? null);
    setLearnStep("listen-machine");
  }
  function cancelLearn() {
    setLearnStep(null); setLearnReal(null); setLearnVirtual(null); setLearnBaseline(null);
  }

  // ── Glisser-déposer (14 août 2026, demande : « deplacer les config des
  // bouton en clic maintenu deposer ») ────────────────────────────────────
  // Deux sources possibles, une seule ref (pas de state : le survol pendant
  // un drag ne doit pas re-render tout le clavier) :
  //  - une ligne de la liste de référence → dépose sur un bouton vert/rouge
  //    = démarre directement l'étape 3 (écoute machine), équivalent au
  //    clic-puis-clic mais en un seul geste ;
  //  - un bouton déjà associé → dépose sur un autre bouton = déplace
  //    l'association déjà apprise, sans repasser par la machine réelle.
  type DragPayload = { kind: "real"; entry: ControlRefEntry } | { kind: "binding"; key: string };
  const dragPayloadRef = useRef<DragPayload | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  function handleDropOnVirtual(type: string, index: number, fallbackLabel: string) {
    const payload = dragPayloadRef.current;
    dragPayloadRef.current = null;
    setDragOverKey(null);
    if (!payload) return;
    const targetKey = `${type}-${index}`;
    if (payload.kind === "binding") {
      if (payload.key === targetKey) return;
      setLearnedMap((prev) => {
        const moved = prev[payload.key];
        if (!moved) return prev;
        const next = { ...prev };
        delete next[payload.key];
        next[targetKey] = moved;
        return next;
      });
      setLearnFeedback(`Association déplacée vers ${fallbackLabel}.`);
      return;
    }
    setLearnReal(payload.entry);
    setLearnVirtual({ key: targetKey, label: fallbackLabel });
    setLearnBaseline(lastRawMidiIn ?? null);
    setLearnStep("listen-machine");
  }

  // Journalise chaque message entrant, et referme l'étape 3 dès qu'un
  // nouveau message arrive après la capture de la référence — comparaison
  // par référence (pas par contenu) : `lastRawMidiIn` change d'instance à
  // chaque message reçu du parent, même si les octets se répètent.
  useEffect(() => {
    if (!lastRawMidiIn) return;
    // Différé en rAF (même remède que `firmwareRiskAck` dans app/page.tsx) :
    // le linter interdit un setState synchrone dans le corps d'un effet.
    const raf = requestAnimationFrame(() => {
      logMidi("in", lastRawMidiIn);

      // Réaction du clavier virtuel au vrai matériel (14 août 2026, demande :
      // « il faut que le clavier reel fasse reagir le clavier virtuel
      // aussi ») — les notes réagissent déjà via `pressedNotes` (le parent
      // les décode et les passe en prop) ; ici, ce que ce composant peut
      // reconnaître lui-même : les encodeurs T1-T4 sur la convention CC
      // 70-73 déjà utilisée par ce clavier construit, et tout bouton
      // vert/rouge dont l'association apprise correspond exactement.
      const status = lastRawMidiIn[0] & 0xf0;
      if (status === 0xb0 && lastRawMidiIn.length >= 3) {
        const cc = lastRawMidiIn[1];
        if (cc >= 70 && cc <= 73) {
          const idx = cc - 70;
          const v = lastRawMidiIn[2];
          setEncVals((arr) => arr.map((x, i) => (i === idx ? v : x)));
          setLastEnc({ idx, v });
        }
      }
      for (const [key, binding] of Object.entries(learnedMap)) {
        if (!arraysEqual(binding.midi, lastRawMidiIn)) continue;
        const [type, idxStr] = key.split("-");
        const idx = Number(idxStr);
        const setPressed = type === "fn" ? setPressedFn : type === "trans" ? setPressedTrans : null;
        if (setPressed) {
          setPressed((s) => new Set(s).add(idx));
          const timer = window.setTimeout(() => setPressed((s) => { if (!s.has(idx)) return s; const ns = new Set(s); ns.delete(idx); return ns; }), 150);
          flashTimersRef.current.push(timer);
        }
        break; // un seul bouton peut correspondre à un message donné
      }

      if (learnStep !== "listen-machine" || !learnVirtual || !learnReal) return;
      if (lastRawMidiIn === learnBaseline) return;
      const binding: LearnedBinding = { realId: learnReal.id, realLabel: learnReal.label, visual: learnReal.visual, midi: lastRawMidiIn };
      setLearnedMap((prev) => ({ ...prev, [learnVirtual.key]: binding }));
      setLearnFeedback(`${learnReal.label} → ${learnVirtual.label} enregistré (${hexBytes(lastRawMidiIn)})`);
      setLearnStep(null); setLearnReal(null); setLearnVirtual(null); setLearnBaseline(null);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRawMidiIn]);

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
            {learnStep === "pick-virtual" ? <>
              <strong>Étape 2/3 — {learnReal?.label}</strong>
              <span>Cliquez un bouton vert ou rouge du clavier construit pour lui associer cette touche.</span>
              <button type="button" className="control-learn-cancel" onClick={cancelLearn}>Annuler</button>
            </> : learnStep === "listen-machine" ? <>
              <strong>Étape 3/3 — {learnReal?.label} → {learnVirtual?.label}</strong>
              <span aria-live="polite">En attente d&apos;un appui sur la vraie touche de l&apos;OP-1…</span>
              <button type="button" className="control-learn-cancel" onClick={cancelLearn}>Annuler</button>
            </> : configTarget ? <>
              <strong>{configTarget.label}</strong>
              <span>{configTarget.type === "note" ? `Note MIDI ${WHITE_NOTES[configTarget.index] ?? BLACK_NOTES[configTarget.index] ?? "-"}` : configTarget.type === "enc" ? `CC MIDI ${70 + configTarget.index}` : `Commande MIDI ${36 + configTarget.index}`}</span>
              <small>Cliquez un autre contrôle pour le configurer.</small>
            </> : learnFeedback ? <strong className="control-learn-done">✓ {learnFeedback}</strong>
              : <small>Cliquez un bouton virtuel, une note ou un potentiomètre — ou une touche de la liste à droite pour l&apos;associer à un bouton du clavier construit.</small>}
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
                <span>{fnBlocks.length} boutons verts ({FN_REAL_LABELS.length} nommés, {Object.keys(learnedMap).filter(k => k.startsWith("fn-")).length} associés) — Note ON canal 10, 36+index</span>
                <span className="control-ref-live">{lastFn !== null ? `${FN_REAL_LABELS[lastFn] ?? `Bouton ${lastFn + 1}`} → note ${36 + lastFn}` : "—"}</span>
              </div>
              <div className="control-ref-row">
                <ControlGlyph visual="trans" />
                <span>{transBlocks.length} boutons transport ({TRANS_REAL_LABELS.join("/")})</span>
                <span className="control-ref-note">seul « lecture » est câblé pour l&apos;instant</span>
              </div>
            </div>

            <div className="control-ref-section">
              <strong>Référence — vraies touches OP-1 (guide officiel TE)</strong>
              <small className="control-ref-hint">Cliquez une touche pour l&apos;associer, ou glissez-la directement sur un bouton du clavier construit.</small>
              {OP1_CONTROL_GROUPS.map((group) => (
                <div key={group.label} className="control-ref-group">
                  <span className="control-ref-group-label">{group.label}</span>
                  {group.entries.map((entry) => (
                    <button type="button" key={entry.id} className={`control-ref-row control-ref-row-pick${learnReal?.id === entry.id ? " is-picking" : ""}`}
                      onClick={() => startLearn(entry)}
                      draggable
                      onDragStart={() => { dragPayloadRef.current = { kind: "real", entry }; }}
                    >
                      <ControlGlyph visual={entry.visual} />
                      <span>{entry.label}</span>
                      <span className="control-ref-note">{entry.note}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="midi-journal" aria-label="Journal MIDI">
            <div className="midi-journal-head">
              <strong>Journal MIDI ({midiLog.length})</strong>
              <button type="button" className="control-learn-cancel" onClick={downloadMidiLog} disabled={!midiLog.length}>Télécharger</button>
              <button type="button" className="control-learn-cancel" onClick={() => setMidiLog([])} disabled={!midiLog.length}>Vider</button>
            </div>
            <div className="midi-journal-list">
              {midiLog.length === 0 && <span className="control-ref-note">Aucun message pour l&apos;instant — jouez une touche ou branchez l&apos;OP-1 en mode contrôleur.</span>}
              {[...midiLog].reverse().slice(0, 60).map((entry) => (
                <div key={entry.id} className={`midi-journal-row midi-journal-${entry.dir}`}>
                  <span className="midi-journal-dir">{entry.dir === "in" ? "↓ IN" : "↑ OUT"}</span>
                  <span className="midi-journal-hex">{hexBytes(entry.data)}</span>
                  <span className="midi-journal-label">{entry.label ?? ""}</span>
                  <span className="midi-journal-time">{new Date(entry.time).toLocaleTimeString()}</span>
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
              if (mode === "midi") sendMidi([0xb0, idx+70, v], `T${idx + 1}`);
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
                  className={`mk-key${isDown ? " is-down" : ""}`}
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
                  className={`mk-key${isDown ? " is-down" : ""}`}
                  onPointerDown={e => { if (configOpen) { e.stopPropagation(); selectConfig("note", i, `Noire ${note}`); return; } e.currentTarget.setPointerCapture(e.pointerId); noteOn(note); }}
                  onPointerUp={() => { if (!configOpen) noteOff(note); }}
                  onPointerLeave={() => { if (!configOpen && pressed.has(note)) noteOff(note); }}
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

            {!notesOnly && fnBlocks.map((b, i) => {
              const key = `fn-${i}`;
              const binding = learnedMap[key];
              const fnLabel = binding?.realLabel ?? FN_REAL_LABELS[i];
              const fnVisual = binding?.visual ?? FN_STATIC_VISUAL[i];
              const isFnDown = pressedFn.has(i);
              const isPickTarget = learnStep === "pick-virtual";
              return (
                <g key={`fn${i}`}
                  className={`mk-key${isFnDown ? " is-down" : ""}`}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => {
                    if (isPickTarget) { e.stopPropagation(); pickVirtualForLearn("fn", i, fnLabel ?? `Bouton ${i + 1}`); return; }
                    if (configOpen) { e.stopPropagation(); selectConfig("button", i, fnLabel ?? `Bouton ${i + 1}`); return; }
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    setPressedFn(s => new Set(s).add(i));
                    setLastFn(i);
                    if (mode === "midi") sendMidi(binding?.midi ?? [0x99, 36 + i, 100], fnLabel ?? `Bouton ${i + 1}`);
                  }}
                  onPointerUp={() => setPressedFn(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  onPointerLeave={() => setPressedFn(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  ref={(node) => { node?.setAttribute("draggable", configOpen && binding ? "true" : "false"); }}
                  onDragStart={() => { if (binding) dragPayloadRef.current = { kind: "binding", key }; }}
                  onDragOver={(e) => { if (configOpen) e.preventDefault(); }}
                  onDragEnter={() => { if (configOpen) setDragOverKey(key); }}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => { if (!configOpen) return; e.preventDefault(); handleDropOnVirtual("fn", i, fnLabel ?? `Bouton ${i + 1}`); }}
                >
                  <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                    rx={.3} fill="#cececb" stroke={dragOverKey === key ? "#00ED95" : binding ? "#267c65" : (isPickTarget ? "#00ED95" : "#a0a3a0")} strokeWidth={dragOverKey === key || binding || isPickTarget ? .14 : .07}/>
                  {fnVisual
                    ? <EmbeddedGlyph visual={fnVisual} cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.28}/>
                    : <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.24} fill="#00ED95"/>
                  }
                  {fnLabel && (
                    <text x={b.col+b.w/2} y={b.row+b.h*.82}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={.36} fill="#3a5550" fontFamily="monospace" fontWeight="700">
                      {fnLabel.length > 5 ? `${fnLabel.slice(0, 4)}…` : fnLabel}
                    </text>
                  )}
                </g>
              );
            })}

            {!notesOnly && transBlocks.map((b, i) => {
              const key = `trans-${i}`;
              const binding = learnedMap[key];
              const transLabel = binding?.realLabel ?? TRANS_SHORT_LABELS[i];
              const transVisual = binding?.visual ?? TRANS_STATIC_VISUAL[i];
              const isTransDown = pressedTrans.has(i);
              const isPickTarget = learnStep === "pick-virtual";
              return (
                <g key={`tr${i}`}
                  className={`mk-key${isTransDown ? " is-down" : ""}`}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => {
                    if (isPickTarget) { e.stopPropagation(); pickVirtualForLearn("trans", i, TRANS_REAL_LABELS[i] ?? `Transport ${i + 1}`); return; }
                    if (configOpen) { e.stopPropagation(); selectConfig("transport", i, TRANS_REAL_LABELS[i] ?? `Transport ${i + 1}`); return; }
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    setPressedTrans(s => new Set(s).add(i));
                    if (i === 0) onTogglePlayback();
                    if (mode === "midi" && binding) sendMidi(binding.midi, transLabel);
                  }}
                  onPointerUp={() => setPressedTrans(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  onPointerLeave={() => setPressedTrans(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  ref={(node) => { node?.setAttribute("draggable", configOpen && binding ? "true" : "false"); }}
                  onDragStart={() => { if (binding) dragPayloadRef.current = { kind: "binding", key }; }}
                  onDragOver={(e) => { if (configOpen) e.preventDefault(); }}
                  onDragEnter={() => { if (configOpen) setDragOverKey(key); }}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => { if (!configOpen) return; e.preventDefault(); handleDropOnVirtual("trans", i, TRANS_REAL_LABELS[i] ?? `Transport ${i + 1}`); }}
                >
                  <rect x={b.col+.1} y={b.row+.1} width={b.w-.2} height={b.h-.2}
                    rx={.3} fill="#cececb" stroke={dragOverKey === key ? "#FF3A5D" : binding ? "#267c65" : (isPickTarget ? "#FF3A5D" : "#a0a3a0")} strokeWidth={dragOverKey === key || binding || isPickTarget ? .14 : .07}/>
                  {transVisual
                    ? <EmbeddedGlyph visual={transVisual} cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.28}/>
                    : <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.24} fill="#FF3A5D"/>
                  }
                  {transLabel && (
                    <text x={b.col+b.w/2} y={b.row+b.h*.82}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={.36} fill="#3a5550" fontFamily="monospace" fontWeight="700">
                      {transLabel.length > 5 ? `${transLabel.slice(0, 4)}…` : transLabel}
                    </text>
                  )}
                </g>
              );
            })}

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
