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
import { op1AudioEngine } from "../lib/op1SynthEngine";
import {
  OP1_7B_BUTTONS, OP1_7B_BY_COORDS, OP1_7B_BY_ID, OP1_CATEGORY_LABELS,
  type OP1ButtonDef, type ControlVisual,
} from "../lib/op1Buttons7B";

type Op1MachineMode = "synth" | "drum" | "tape";

function machineModeFromControl(id: string): Op1MachineMode | null {
  if (id === "synth") return "synth";
  if (id === "drum") return "drum";
  if (id === "tape-mode") return "tape";
  return null;
}

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
type ControlRefEntry = { id: string; label: string; visual: ControlVisual; note: string };
const OP1_CONTROL_GROUPS: { label: string; entries: ControlRefEntry[] }[] = [
  { label: "Modes principaux", entries: [
    { id: "synth", label: "SYNTH", visual: "synth", note: "" },
    { id: "drum", label: "DRUM", visual: "drum", note: "" },
    { id: "tape", label: "TAPE", visual: "tape-mode", note: "" },
    { id: "mixer", label: "MIXER", visual: "mixer", note: "" },
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
    { id: "com", label: "COM", visual: "plug", note: "connectivité : disque, MIDI, TE-boot" },
    { id: "help", label: "HELP", visual: "help", note: "aide contextuelle" },
    { id: "tempo", label: "TEMPO", visual: "tempo", note: "horloge interne" },
  ] },
  { label: "Bande", entries: [
    { id: "transport-play", label: "Lecture", visual: "play", note: "" },
    { id: "transport-rec", label: "Enregistr.", visual: "rec", note: "" },
    { id: "transport-stop", label: "Stop", visual: "stop", note: "" },
    { id: "tape-split", label: "Split", visual: "split", note: "" },
    { id: "tape-drop", label: "Drop", visual: "drop", note: "" },
    { id: "tape-join", label: "Join", visual: "join", note: "" },
  ] },
  { label: "Audio", entries: [
    { id: "micin", label: "MIC/LINE", visual: "mic", note: "" },
  ] },
  { label: "Affichage", entries: [
    // T1-T4 : 4 encodeurs colores alignes sous l'ecran (soft keys, on
    // tourne ET on clique) - absents de cette liste jusqu'ici, on ne
    // pouvait les associer qu'en cliquant directement le cercle du clavier
    // construit (18 aout 2026, demande : « il manque le 1 2 3 4 qui est
    // sous l'ecran »).
    { id: "t1", label: "T1", visual: "enc", note: "sous l'écran" },
    { id: "t2", label: "T2", visual: "enc", note: "sous l'écran" },
    { id: "t3", label: "T3", visual: "enc", note: "sous l'écran" },
    { id: "t4", label: "T4", visual: "enc", note: "sous l'écran" },
    // Clic (pas rotation) du même encodeur - un contrôle à part, voir
    // `pressedEncPush`/`asPressSignature` (18 août 2026, demande : « il y a
    // aussi sur les 4 encodeur un bouton »).
    { id: "t1-push", label: "1", visual: "enc", note: "" },
    { id: "t2-push", label: "2", visual: "enc", note: "" },
    { id: "t3-push", label: "3", visual: "enc", note: "" },
    { id: "t4-push", label: "4", visual: "enc", note: "" },
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
// Même ordre, identifiants de OP1_CONTROL_GROUPS - sert à reconnaître un
// bouton SOUND (associé ou non) pour lui donner un petit chiffre plutôt
// qu'un point plein générique (18 août 2026, demande : « les logo des son
// de 1 à 8 faut mettre des petit chiffre »).
const FN_REAL_IDS = [
  "synth", "drum", "tape", "mixer",
  "sound1", "sound2", "sound3", "sound4", "sound5", "sound6", "sound7", "sound8",
  "sequencer", "shift", "com", "help",
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
/** Une association apprise capture le premier message different de la
 * reference - ce peut etre le relachement (valeur 0) plutot que l'appui.
 * Envoyer tel quel un CC/Note ON a 0 ne declenche rien sur la vraie
 * machine ; on force donc la valeur a fond pour rejouer un vrai "appui"
 * (18 aout 2026, SEQUENCER capture avec la valeur 0). */
function asPressSignature(midi: number[]): number[] {
  const status = midi[0] & 0xf0;
  if ((status === 0x90 || status === 0xb0) && midi[2] === 0) return [midi[0], midi[1], 127];
  return midi;
}
const CONTROL_GLYPH_COLORS: Record<ControlVisual, string> = {
  key: "#8f89aa", enc: "#698EFF", fn: "#00ED95", trans: "#FF3A5D",
  knob: "#c9a227", button: "#7a8a86", arrow: "#5a7a72", speaker: "#5a7a72",
  screen: "#3a5550", battery: "#3a5550", plug: "#8a6fb0", mic: "#5a7a72",
  synth: "#00ED95", drum: "#00ED95", "tape-mode": "#00ED95", mixer: "#00ED95", seq: "#00ED95",
  shift: "#7a8a86", help: "#7a8a86", tempo: "#c9a227",
  play: "#00ED95", rec: "#FF3A5D", stop: "#7a8a86",
  rewind: "#5a7a72", forward: "#5a7a72",
  split: "#c9915a", drop: "#c9915a", lift: "#c9915a", join: "#c9915a",
  loop: "#00ED95", break: "#00ED95", m1: "#00ED95", m2: "#00ED95", in: "#00ED95", out: "#00ED95",
};
// Bleu, vert, blanc, orange - couleur réelle des 4 encodeurs T1-T4 (voir
// `encRoles` pour le rôle par bloc peint). Partagé entre le rendu du
// clavier construit et les lignes T1-T4/T1-T4 (clic) de la liste de
// référence, pour ne pas répéter « encodeur bleu » en toutes lettres
// (18 août 2026, demande : « on met des encodeur de la couleur, pas besoin
// de mettre encodeur vert tout ça c'est trop long »).
const T_ENCODER_COLORS = ["#698EFF", "#00ED95", "#DFD9FF", "#FF7A30"];
function tEncoderColor(id: string): string | undefined {
  const match = /^t([1-4])(-push)?$/.exec(id);
  return match ? T_ENCODER_COLORS[Number(match[1]) - 1] : undefined;
}
/** Le clic (pas la rotation) d'un encodeur T1-T4 : gros chiffre plein plutôt
 * que le cadran générique, même logique que le gros chiffre dans le rendu
 * de l'encodeur lui-même (18 août 2026, demande : « en icone on met des
 * gros 1234 dedans »). */
function tEncoderPushDigit(id: string): { digit: string; color: string } | null {
  const match = /^t([1-4])-push$/.exec(id);
  return match ? { digit: match[1], color: T_ENCODER_COLORS[Number(match[1]) - 1] } : null;
}
/** Formes seules, coordonnées 0-18 — réutilisées telles quelles par
 * `ControlGlyph` (liste de référence) et `EmbeddedGlyph` (incrustées dans un
 * bouton du clavier construit, 14 août 2026 : « on remplace la pastille de
 * couleur par le logo de la touche » une fois une association apprise). */
function ControlGlyphShape({ visual, colorOverride }: { visual: ControlVisual; colorOverride?: string }) {
  const c = colorOverride ?? CONTROL_GLYPH_COLORS[visual] ?? "#00ED95";
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
      // Onde double, recalée sur le pictogramme reel de "layout" (18 aout 2026).
      <path d="M1.5 11 Q4.5 4.5 7.5 11 T13.5 11" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "drum": return (
      // Note pointee (rond + hampe) - le vrai bouton DRUM n'affiche pas une
      // grille de pads mais une note isolee.
      <>
        <circle cx={6.5} cy={13} r={3} fill={c} />
        <line x1={9.3} y1={13} x2={9.3} y2={3} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      </>
    );
    case "tape-mode": return (
      // Deux bobines cote a cote, sans boitier - le vrai bouton TAPE ne
      // montre que "OO", pas un rectangle de cassette.
      <>
        <circle cx={6} cy={9} r={4.3} fill="none" stroke={c} strokeWidth={1.5} />
        <circle cx={12} cy={9} r={4.3} fill="none" stroke={c} strokeWidth={1.5} />
        <circle cx={6} cy={9} r={1.2} fill={c} />
        <circle cx={12} cy={9} r={1.2} fill={c} />
      </>
    );
    case "mixer": return (
      // Trois barres de hauteur differente (comme le pictogramme reel),
      // sans curseurs rapportes.
      <>
        <line x1={4.5} y1={14} x2={4.5} y2={7} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        <line x1={9} y1={14} x2={9} y2={3} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        <line x1={13.5} y1={14} x2={13.5} y2={8.5} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
      </>
    );
    case "seq": return (<>
      <circle cx={3.5} cy={9} r={1.8} fill={c} />
      <circle cx={7.7} cy={9} r={1.8} fill={c} opacity={.5} />
      <circle cx={11.9} cy={9} r={1.8} fill={c} />
      <circle cx={14.5} cy={9} r={1.8} fill={c} opacity={.5} />
    </>);
    case "shift": return (
      <text x={9} y={9.5} textAnchor="middle" dominantBaseline="central" fontSize={7} fontFamily="monospace" fontWeight="900" fill={c}>shift</text>
    );
    case "help": return (
      // 3 petits points ou crochet
      <g>
        <circle cx={4.5} cy={9} r={1.5} fill={c} />
        <circle cx={9} cy={9} r={1.5} fill={c} />
        <circle cx={13.5} cy={9} r={1.5} fill={c} />
      </g>
    );
    case "tempo": return (
      // Triangle inscrit dans un cercle (metronome), pas une horloge.
      <>
        <circle cx={9} cy={9} r={7} fill="none" stroke={c} strokeWidth={1.4} />
        <path d="M9 4.2 L13.2 13 L4.8 13 Z" fill="none" stroke={c} strokeWidth={1.3} strokeLinejoin="round" />
      </>
    );
    case "play": return (<path d="M6 4 L14 9 L6 14 Z" fill={c} />);
    case "rec": return (
      // Anneau + point central - le vrai bouton REC affiche un cercle
      // creuse, pas un disque plein.
      <>
        <circle cx={9} cy={9} r={5.6} fill="none" stroke={c} strokeWidth={2} />
        <circle cx={9} cy={9} r={2.2} fill={c} />
      </>
    );
    case "stop": return (<rect x={4.5} y={4.5} width={9} height={9} rx={1} fill={c} />);
    case "rewind": return (
      <path d="M12 4 L6 9 L12 14" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "forward": return (
      <path d="M6 4 L12 9 L6 14" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
    case "split": return (
      // Ciseaux / Split tape
      <g>
        <circle cx={6} cy={13} r={2} fill="none" stroke={c} strokeWidth={1.3} />
        <circle cx={12} cy={13} r={2} fill="none" stroke={c} strokeWidth={1.3} />
        <line x1={7.5} y1={11.5} x2={12.5} y2={4} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
        <line x1={10.5} y1={11.5} x2={5.5} y2={4} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
    case "lift": return (
      // Fleche LIFT vers le haut
      <g>
        <path d="M9 13.5 V4 M5.5 7.5 L9 4 L12.5 7.5" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={4} y1={15} x2={14} y2={15} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
    case "drop": return (
      // Fleche DROP vers le bas
      <g>
        <path d="M9 4.5 V14 M5.5 10.5 L9 14 L12.5 10.5" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={4} y1={3} x2={14} y2={3} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
    case "loop": return (
      <g>
        <path d="M13.5 9 A4.5 4.5 0 1 1 11.5 5" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <path d="M11 2.5 L14 5 L11 7" stroke={c} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
    case "break": return (
      <g>
        <path d="M9 3 V15 M4.5 9 H13.5" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx={9} cy={9} r={1.5} fill={c} />
      </g>
    );
    case "in": return (
      <g>
        <text x={9} y={7.5} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontFamily="monospace" fontWeight="900" fill={c}>1</text>
        <text x={9} y={13.5} textAnchor="middle" dominantBaseline="central" fontSize={4} fontFamily="monospace" fontWeight="700" fill={c}>IN</text>
      </g>
    );
    case "out": return (
      <g>
        <text x={9} y={7.5} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontFamily="monospace" fontWeight="900" fill={c}>2</text>
        <text x={9} y={13.5} textAnchor="middle" dominantBaseline="central" fontSize={4} fontFamily="monospace" fontWeight="700" fill={c}>OUT</text>
      </g>
    );
    case "m1": return (
      <g>
        <text x={9} y={7.5} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontFamily="monospace" fontWeight="900" fill={c}>7</text>
        <text x={9} y={13.5} textAnchor="middle" dominantBaseline="central" fontSize={4} fontFamily="monospace" fontWeight="700" fill={c}>M1</text>
      </g>
    );
    case "m2": return (
      <g>
        <text x={9} y={7.5} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontFamily="monospace" fontWeight="900" fill={c}>8</text>
        <text x={9} y={13.5} textAnchor="middle" dominantBaseline="central" fontSize={4} fontFamily="monospace" fontWeight="700" fill={c}>M2</text>
      </g>
    );
    case "join": return (
      // Deux points qui convergent en un - le bouton reel fusionne deux
      // segments de bande.
      <>
        <circle cx={4} cy={5.5} r={1.4} fill={c} />
        <circle cx={4} cy={12.5} r={1.4} fill={c} />
        <path d="M6 5.5 Q12 9 6 12.5" stroke={c} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <circle cx={13.5} cy={9} r={1.7} fill={c} />
      </>
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
    case "plug": return (
      // Accolade ouverte "C" - le vrai bouton COM affiche ce crochet, pas
      // une prise avec broches.
      <path d="M12.5 4.5 A6 6 0 1 0 12.5 13.5" stroke={c} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    );
    case "button": default: return (
      <rect x={2} y={2} width={14} height={14} rx={3} fill="none" stroke={c} strokeWidth={2} />
    );
  }
}

function ControlGlyph({ visual, colorOverride }: { visual: ControlVisual; colorOverride?: string }) {
  return (
    <svg viewBox="0 0 18 18" width={18} height={18} aria-hidden="true">
      <ControlGlyphShape visual={visual} colorOverride={colorOverride} />
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
  onRecord,
  onModeChange,
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
  /** Même action que REC sur l’écran simulé OP-1. */
  onRecord?: () => void;
  onModeChange?: (mode: Op1MachineMode) => void;
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

  // ── Journal MIDI : trace tout ce qui part et tout ce qui arrive. ────────
  const [midiLog, setMidiLog] = useState<MidiLogEntry[]>([]);
  const midiLogIdRef = useRef(0);
  function logMidi(dir: "in" | "out", data: number[], label?: string) {
    midiLogIdRef.current += 1;
    setMidiLog((prev) => {
      const next = [...prev, { id: midiLogIdRef.current, dir, time: Date.now(), data, label }];
      return next.length > MIDI_LOG_LIMIT ? next.slice(next.length - MIDI_LOG_LIMIT) : next;
    });
  }
  function sendMidi(data: number[], label?: string) {
    logMidi("out", data, label);
    onSendMidi(data);
  }

  const { white: whiteBlocks, black: blackBlocks, enc: encBlocks, fn: fnBlocks, trans: transBlocks } = sortKeyBlocks(validated);
  // Le clavier construit contient 5 blocs "enc", mais la vraie machine n'a
  // que 4 encodeurs colores T1-T4 (bleu/vert/blanc/orange) sous l'ecran -
  // le 5e bloc, plus petit (h=2 contre h=4 dans le gabarit), est en realite
  // le potentiometre VOLUME (18 aout 2026, demande : « le volume est blanc
  // le petit encodeur »). On le repere par sa taille (le plus petit bloc
  // "enc"), pas par son index, pour rester correct si le gabarit change.
  const encVolumeIdx = encBlocks.length > 4
    ? encBlocks.reduce((minI, b, i, arr) => (b.w * b.h < arr[minI].w * arr[minI].h ? i : minI), 0)
    : -1;
  let tCounter = 0;
  const encRoles = encBlocks.map((_, i) => (i === encVolumeIdx ? { isVolume: true, tIndex: -1 } : { isVolume: false, tIndex: tCounter++ }));
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
    op1AudioEngine.triggerNoteOn(note, 100);
    if (mode === "midi") sendMidi([0x90, Math.max(0, Math.min(127, note)), 100], `note ${midiNoteName(note)}`);
  }

  function noteOff(note: number) {
    setPressed(s => { const ns = new Set(s); ns.delete(note); return ns; });
    op1AudioEngine.triggerNoteOff(note);
    if (mode === "midi") sendMidi([0x80, Math.max(0, Math.min(127, note)), 0], `note ${midiNoteName(note)} off`);
  }

  function selectConfig(type: string, index: number, label: string) {
    setConfigTarget({ type, index, label });
  }

  // Joue les touches note construites depuis le clavier ordinateur. Ignoré
  // pendant la configuration, dans un champ texte, ou en cas de répétition
  // OS (une touche maintenue ne redéclenche pas noteOn en boucle).
  const heldKeysRef = useRef<Set<string>>(new Set());

  // Etiquettes reelles des touches, resolues depuis la disposition de
  // l'utilisateur. WHITE_KEY_CODES/BLACK_KEY_CODES designent des POSITIONS
  // physiques nommees d'apres QWERTY : sur un clavier AZERTY, "KeyZ" est la
  // touche marquee W et "KeyQ" celle marquee A. Sans affichage, impossible
  // de deviner sur quoi appuyer.
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    const kb = (navigator as any).keyboard;
    if (!kb?.getLayoutMap) return;
    let active = true;
    void kb.getLayoutMap().then((map: Map<string, string>) => {
      if (!active) return;
      const out: Record<string, string> = {};
      for (const code of [...WHITE_KEY_CODES, ...BLACK_KEY_CODES]) {
        const label = map.get(code);
        if (label) out[code] = label.toUpperCase();
      }
      setKeyLabels(out);
    }).catch(() => { /* API indisponible : on retombe sur le code brut */ });
    return () => { active = false; };
  }, []);

  // Repli quand l'API de disposition manque (Firefox, Safari) : on retire le
  // prefixe "Key"/"Digit" du code, ce qui donne l'etiquette QWERTY.
  const labelForCode = (code: string | undefined) =>
    code ? (keyLabels[code] ?? code.replace(/^(Key|Digit)/, "")) : "";
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
  const [, setLastEnc] = useState<{ idx: number; v: number } | null>(null);
  const [, setLastFn] = useState<number | null>(null);
  // Anime brièvement le bouton pressé — les boutons verts/rouges ne
  // suivent pas un cycle down/up MIDI comme les notes (l'action part au
  // pointerDown), donc ce sont des sets purement visuels, remis à zéro au
  // relâchement ou si le pointeur quitte le bouton (14 août 2026, demande :
  // « toute les touche du clavier reagisse comme les note en bougant »).
  const [pressedFn, setPressedFn] = useState<Set<number>>(new Set());
  const [pressedTrans, setPressedTrans] = useState<Set<number>>(new Set());
  // Clic (pas rotation) d'un encodeur - la vraie machine dit « tapping an
  // encoder usually means confirm/return to default » (guide TE synth
  // mode) : un contrôle à part, distinct de la rotation CC (18 août 2026,
  // demande : « il nous faut un truc pour regler les bouton des encodeur »).
  const [pressedEncPush, setPressedEncPush] = useState<Set<number>>(new Set());
  // Minuteurs des « flashs » déclenchés par un vrai appui matériel (voir
  // plus bas) — nettoyés au démontage pour ne jamais toucher un composant
  // déjà parti.
  const flashTimersRef = useRef<number[]>([]);
  useEffect(() => () => { flashTimersRef.current.forEach((t) => window.clearTimeout(t)); }, []);

  /** Remplace tous les appels directs à `onSendMidi` : journalise avant
   * d'envoyer, pour que le journal reflète exactement ce qui part vers la
   * machine, pas une reconstruction approximative après coup. */
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
  const [controlSearch, setControlSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    try { localStorage.setItem(LEARNED_MAP_KEY, JSON.stringify(learnedMap)); } catch { /* stockage indisponible (navigation privée) : tant pis, pas bloquant */ }
  }, [learnedMap]);
  const [learnStep, setLearnStep] = useState<"pick-virtual" | "listen-machine" | null>(null);
  const [learnReal, setLearnReal] = useState<ControlRefEntry | null>(null);
  const [learnVirtual, setLearnVirtual] = useState<{ key: string; label: string } | null>(null);
  const [learnBaseline, setLearnBaseline] = useState<number[] | null>(null);
  const [learnFeedback, setLearnFeedback] = useState<string | null>(null);

  function applyOfficial7BMapping() {
    const newMap: LearnedMap = {};
    fnBlocks.forEach((b, i) => {
      const def = OP1_7B_BY_COORDS.get(`${b.col},${b.row}`);
      if (def) {
        newMap[`fn-${i}`] = {
          realId: def.id,
          realLabel: def.label,
          visual: def.visual,
          midi: def.midiDefault ?? [0x99, 36 + i, 100],
        };
      }
    });
    transBlocks.forEach((b, i) => {
      const def = OP1_7B_BY_COORDS.get(`${b.col},${b.row}`);
      if (def) {
        newMap[`trans-${i}`] = {
          realId: def.id,
          realLabel: def.label,
          visual: def.visual,
          midi: def.midiDefault ?? [0x99, 52 + i, 100],
        };
      }
    });
    setLearnedMap(newMap);
    setLearnFeedback("Configuration officielle 7B appliquée avec succès !");
  }

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
        const v = lastRawMidiIn[2];
        // Une association apprise (enc-N, meme numero de CC) passe avant la
        // convention par defaut CC7/70-73 - permet de corriger si la vraie
        // machine envoie un autre numero (18 aout 2026, demande : « il me
        // semble qu'il y a quelques touches qui n'envoient pas de signaux »).
        let targetIdx = -1;
        for (const [key, binding] of Object.entries(learnedMap)) {
          if (!key.startsWith("enc-")) continue;
          if ((binding.midi[0] & 0xf0) === 0xb0 && binding.midi[1] === cc) {
            targetIdx = Number(key.split("-")[1]);
            break;
          }
        }
        if (targetIdx < 0) {
          // CC 7 (volume standard MIDI) et CC 70-73 (T1-T4) recherches par
          // role, pas par index brut (voir `encRoles`).
          targetIdx = cc === 7
            ? encRoles.findIndex((r) => r.isVolume)
            : cc >= 70 && cc <= 73
              ? encRoles.findIndex((r) => !r.isVolume && r.tIndex === cc - 70)
              : -1;
        }
        if (targetIdx >= 0) {
          setEncVals((arr) => arr.map((x, i) => (i === targetIdx ? v : x)));
          setLastEnc({ idx: targetIdx, v });
        }
      }
      for (const [key, binding] of Object.entries(learnedMap)) {
        // Compare seulement statut+donnee1 (pas l'octet de valeur) : un
        // bouton qui bascule 127/0 a chaque appui n'aurait matche qu'un
        // appui sur deux sinon - repere le 18 aout 2026 en testant
        // SEQUENCER, capture avec la valeur 0 (relachement).
        if (binding.midi[0] !== lastRawMidiIn[0] || binding.midi[1] !== lastRawMidiIn[1]) continue;
        const [type, idxStr] = key.split("-");
        const idx = Number(idxStr);
        const setPressed = type === "fn" ? setPressedFn : type === "trans" ? setPressedTrans : type === "encpush" ? setPressedEncPush : null;
        if (setPressed) {
          setPressed((s) => new Set(s).add(idx));
          const timer = window.setTimeout(() => setPressed((s) => { if (!s.has(idx)) return s; const ns = new Set(s); ns.delete(idx); return ns; }), 150);
          flashTimersRef.current.push(timer);
        }
        // Le bouton réel MIDI et le bouton virtuel pilotent le même écran :
        // après association, Lecture et REC déclenchent le même handler.
        if (type === "trans" && idx === 0) onTogglePlayback();
        if (type === "trans" && idx === 1) onRecord?.();
        if (type === "fn") {
          const modeChange = machineModeFromControl(binding.realId);
          if (modeChange) onModeChange?.(modeChange);
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
              <span>{configTarget.type === "note" ? `Note MIDI ${WHITE_NOTES[configTarget.index] ?? BLACK_NOTES[configTarget.index] ?? "-"}` : configTarget.type === "enc" ? (encRoles[configTarget.index]?.isVolume ? "CC MIDI 7 (volume)" : `CC MIDI ${70 + (encRoles[configTarget.index]?.tIndex ?? 0)}`) : `Commande MIDI ${36 + configTarget.index}`}</span>
              <small>Cliquez un autre contrôle pour le configurer.</small>
            </> : learnFeedback ? <strong className="control-learn-done">✓ {learnFeedback}</strong>
              : <small>Cliquez un bouton virtuel, une note ou un potentiomètre — ou une touche de la liste à droite pour l&apos;associer à un bouton du clavier construit.</small>}
          </div>

          <div className="control-reference" aria-label="Liste complète des touches de la machine">
            {/* Le cadre "Câblé ici" (état filaire brut, une ligne par
               famille de contrôle) a été retiré le 18 août 2026 : il prenait
               la moitié de la largeur pour peu d'information, au détriment
               de la vraie liste de référence à droite (demande : « on prend
               la place pour bien exposer les bouton »). L'état des touches
               reste visible en direct sur le clavier construit lui-même. */}
            <div className="control-ref-section">
              <strong>Boutons à configurer</strong>
              <small className="control-ref-hint">Cliquez une touche, ou glissez-la sur un bouton du clavier construit.</small>

              {OP1_CONTROL_GROUPS.map((group) => {
                const remaining = group.entries.filter((entry) => !Object.values(learnedMap).some((binding) => binding.realId === entry.id));
                if (!remaining.length) return null;
                return (
                <div key={group.label} className="control-ref-group">
                  <span className="control-ref-group-label">{group.label}</span>
                  {remaining.map((entry) => (
                    <button type="button" key={entry.id} className={`control-ref-row control-ref-row-pick${learnReal?.id === entry.id ? " is-picking" : ""}`}
                      onClick={() => startLearn(entry)}
                      draggable
                      onDragStart={() => { dragPayloadRef.current = { kind: "real", entry }; }}
                    >
                      {(() => {
                        const bigDigit = tEncoderPushDigit(entry.id);
                        return bigDigit
                          ? <svg viewBox="0 0 18 18" width={18} height={18} aria-hidden="true">
                              <text x={9} y={9} textAnchor="middle" dominantBaseline="central" fontSize={14} fontFamily="monospace" fontWeight="700" fill={bigDigit.color}>{bigDigit.digit}</text>
                            </svg>
                          : <ControlGlyph visual={entry.visual} colorOverride={tEncoderColor(entry.id)} />;
                      })()}
                      <span>{entry.label}</span>
                    </button>
                  ))}
                </div>
                );
              })}
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
              {/* slice(0, 1) n'affichait qu'un seul message : ce n'est pas un journal.
                  Le tampon en garde 300, autant en montrer une page. */}
              {[...midiLog].reverse().slice(0, 40).map((entry) => (
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
              const drag = encDrag.current;
              encDrag.current = null;
              if (!drag) return;
              // Pas de mouvement de rotation entre l'appui et le relâchement
              // = un clic, pas un tour de molette - envoie l'association
              // "encpush" apprise pour cet encodeur, si elle existe.
              const moved = (encVals[drag.idx] ?? drag.startV) !== drag.startV;
              if (moved) return;
              const pushKey = `encpush-${drag.idx}`;
              const pushBinding = learnedMap[pushKey];
              setPressedEncPush((s) => new Set(s).add(drag.idx));
              const timer = window.setTimeout(() => setPressedEncPush((s) => { if (!s.has(drag.idx)) return s; const ns = new Set(s); ns.delete(drag.idx); return ns; }), 150);
              flashTimersRef.current.push(timer);
              if (mode === "midi" && pushBinding) sendMidi(asPressSignature(pushBinding.midi), `${pushBinding.realLabel} (clic)`);
            }}
            onPointerMove={e => {
              if (!encDrag.current) return;
              const {idx, startY, startV} = encDrag.current;
              const delta = Math.round((startY - e.clientY) / 3);
              const v = Math.max(0, Math.min(127, startV + delta));
              setEncVals(arr => arr.map((x,i) => i===idx ? v : x));
              setLastEnc({ idx, v });
              // CC 7 = volume MIDI standard ; CC 70-73 = T1-T4 (voir `encRoles`).
              const role = encRoles[idx];
              if (mode === "midi" && role) sendMidi(role.isVolume ? [0xb0, 7, v] : [0xb0, 70 + role.tIndex, v], role.isVolume ? "VOLUME" : `T${role.tIndex + 1}`);
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
                  {/* Touche du clavier ordinateur correspondante. */}
                  <text x={b.col+b.w/2} y={b.row+b.h-.42}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={.42} fill="#8b86a8" fontFamily="monospace" fontWeight="700">
                    {labelForCode(WHITE_KEY_CODES[i])}
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
                  {/* Touche du clavier ordinateur correspondante. */}
                  <text x={b.col+b.w/2} y={b.row+b.h-.38}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={.4} fill="#9a95b5" fontFamily="monospace" fontWeight="700">
                    {labelForCode(BLACK_KEY_CODES[i])}
                  </text>
                </g>
              );
            })}

            {!notesOnly && encBlocks.map((b, i) => {
              const v = encVals[i] ?? 64;
              const angle = ((v/127)*270 - 135) * Math.PI/180;
              const cx = b.col + b.w/2;
              const cy = b.row + b.h/2;
              const r  = Math.min(b.w, b.h)/2 - .2;
              const role = encRoles[i];
              // Bleu, vert, blanc, orange - ordre reel des 4 encodeurs T1-T4
              // (verifie sur photo produit, 18 aout 2026). Le potentiometre
              // VOLUME (bloc a part, voir `encRoles`) est blanc/neutre, pas
              // pris dans ce cycle.
              const ENC_COLORS = ["#698EFF","#00ED95","#DFD9FF","#FF7A30"];
              const ec = role.isVolume ? "#DFD9FF" : ENC_COLORS[role.tIndex % 4];
              const label = role.isVolume ? "VOL" : `T${role.tIndex + 1}`;
              const isPushDown = pressedEncPush.has(i);
              return (
                <g key={`enc${i}`}
                  className={`mk-key${isPushDown ? " is-down" : ""}`}
                  onPointerDown={e => {
                    const encLabel = role.isVolume ? "Potentiomètre VOLUME" : `Potentiomètre T${role.tIndex + 1}`;
                    // Les encodeurs n'acceptaient pas l'étape 2/3 de la
                    // procédure d'association (seuls fn/trans le faisaient) -
                    // impossible jusqu'ici d'apprendre VOLUME ou un Tn
                    // (18 août 2026, demande : « j'ai pas les bouton pour
                    // regler les potentiometre »).
                    if (learnStep === "pick-virtual") {
                      e.stopPropagation();
                      const isPush = learnReal?.id.endsWith("-push");
                      pickVirtualForLearn(isPush ? "encpush" : "enc", i, isPush ? `${encLabel} (clic)` : encLabel);
                      return;
                    }
                    if (configOpen) { e.stopPropagation(); selectConfig("enc", i, encLabel); return; }
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
                  {!role.isVolume && (
                    // Gros chiffre 1-4 dans le cadran, sous l'aiguille - les
                    // 4 encodeurs T1-T4 sont alignes ensemble, VOLUME (le
                    // 5e, plus petit) reste sans chiffre (18 aout 2026,
                    // demande : « les 4 premiers […] gros chiffre 1234 »).
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                      fontSize={r*.85} fill={`${ec}33`} fontFamily="monospace" fontWeight="700">
                      {role.tIndex + 1}
                    </text>
                  )}
                  <text x={cx} y={b.row+b.h+.55} textAnchor="middle"
                    fontSize={.55} fill={ec} fontFamily="monospace" fontWeight="700">
                    {label}
                  </text>
                </g>
              );
            })}

            {!notesOnly && fnBlocks.map((b, i) => {
              const key = `fn-${i}`;
              const binding = learnedMap[key];
              const def7B = OP1_7B_BY_COORDS.get(`${b.col},${b.row}`);
              const fnLabel = binding?.realLabel ?? def7B?.label ?? FN_REAL_LABELS[i] ?? `Bouton ${i + 1}`;
              const fnVisual = binding?.visual ?? def7B?.visual ?? FN_STATIC_VISUAL[i];
              const fnRealId = binding?.realId ?? def7B?.id ?? FN_REAL_IDS[i];
              const fnSoundNumber = fnRealId ? (/^sound([1-8])$/.exec(fnRealId)?.[1] ?? /^track([1-4])$/.exec(fnRealId)?.[1]) : null;
              const isFnDown = pressedFn.has(i);
              const isPickTarget = learnStep === "pick-virtual";
              const sublabel = def7B?.sublabel;
              return (
                <g key={`fn${i}`}
                  className={`mk-key${isFnDown ? " is-down" : ""}`}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => {
                    if (isPickTarget) { e.stopPropagation(); pickVirtualForLearn("fn", i, fnLabel); return; }
                    if (configOpen) { e.stopPropagation(); selectConfig("button", i, fnLabel); return; }
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    setPressedFn(s => new Set(s).add(i));
                    setLastFn(i);
                    const modeChange = machineModeFromControl(fnRealId);
                    if (modeChange) onModeChange?.(modeChange);
                    if (mode === "midi") sendMidi(binding ? asPressSignature(binding.midi) : (def7B?.midiDefault ?? [0x99, 36 + i, 100]), fnLabel);
                  }}
                  onPointerUp={() => setPressedFn(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  onPointerLeave={() => setPressedFn(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  ref={(node) => { node?.setAttribute("draggable", configOpen && binding ? "true" : "false"); }}
                  onDragStart={() => { if (binding) dragPayloadRef.current = { kind: "binding", key }; }}
                  onDragOver={(e) => { if (configOpen) e.preventDefault(); }}
                  onDragEnter={() => { if (configOpen) setDragOverKey(key); }}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => { if (!configOpen) return; e.preventDefault(); handleDropOnVirtual("fn", i, fnLabel); }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.35}
                    fill={isFnDown ? "#a8a8a4" : "#cececb"}
                    stroke={dragOverKey === key ? "#00ED95" : binding ? "#267c65" : (isPickTarget ? "#00ED95" : "#8d9690")}
                    strokeWidth={dragOverKey === key || binding || isPickTarget ? .14 : .06}
                  />
                  <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.32} fill={isFnDown ? "#bcbcba" : "#dedede"} stroke="#b0b0ad" strokeWidth={.04}/>
                  {fnSoundNumber
                    ? <text x={b.col+b.w/2} y={b.row+b.h*.42} textAnchor="middle" dominantBaseline="central"
                        fontSize={Math.min(b.w,b.h)*.36} fill="#171a1b" fontFamily="monospace" fontWeight="900">{fnSoundNumber}</text>
                    : fnVisual
                      ? <EmbeddedGlyph visual={fnVisual} cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.28}/>
                      : <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.24} fill="#00ED95"/>
                  }
                  {fnLabel && (
                    <text x={b.col+b.w/2} y={b.row+b.h*.82}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={.34} fill="#263430" fontFamily="monospace" fontWeight="700">
                      {sublabel ? sublabel : (fnLabel.length > 5 ? `${fnLabel.slice(0, 4)}…` : fnLabel)}
                    </text>
                  )}
                </g>
              );
            })}

            {!notesOnly && transBlocks.map((b, i) => {
              const key = `trans-${i}`;
              const binding = learnedMap[key];
              const def7B = OP1_7B_BY_COORDS.get(`${b.col},${b.row}`);
              const transLabel = binding?.realLabel ?? def7B?.label ?? TRANS_REAL_LABELS[i] ?? `Transport ${i + 1}`;
              const transVisual = binding?.visual ?? def7B?.visual ?? TRANS_STATIC_VISUAL[i];
              const isTransDown = pressedTrans.has(i);
              const isPickTarget = learnStep === "pick-virtual";
              const sublabel = def7B?.sublabel;
              return (
                <g key={`tr${i}`}
                  className={`mk-key${isTransDown ? " is-down" : ""}`}
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => {
                    if (isPickTarget) { e.stopPropagation(); pickVirtualForLearn("trans", i, transLabel); return; }
                    if (configOpen) { e.stopPropagation(); selectConfig("transport", i, transLabel); return; }
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    setPressedTrans(s => new Set(s).add(i));
                    if (i === 0 || def7B?.id === "transport-play") onTogglePlayback();
                    if (i === 1 || def7B?.id === "transport-rec") onRecord?.();
                    if (mode === "midi") sendMidi(binding ? asPressSignature(binding.midi) : (def7B?.midiDefault ?? [0x99, 52 + i, 100]), transLabel);
                  }}
                  onPointerUp={() => setPressedTrans(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  onPointerLeave={() => setPressedTrans(s => { if (!s.has(i)) return s; const ns = new Set(s); ns.delete(i); return ns; })}
                  ref={(node) => { node?.setAttribute("draggable", configOpen && binding ? "true" : "false"); }}
                  onDragStart={() => { if (binding) dragPayloadRef.current = { kind: "binding", key }; }}
                  onDragOver={(e) => { if (configOpen) e.preventDefault(); }}
                  onDragEnter={() => { if (configOpen) setDragOverKey(key); }}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => { if (!configOpen) return; e.preventDefault(); handleDropOnVirtual("trans", i, transLabel); }}
                >
                  <rect x={b.col+.08} y={b.row+.08} width={b.w-.16} height={b.h-.16}
                    rx={.35}
                    fill={isTransDown ? "#a8a8a4" : "#cececb"}
                    stroke={dragOverKey === key ? "#FF3A5D" : binding ? "#267c65" : (isPickTarget ? "#FF3A5D" : "#8d9690")}
                    strokeWidth={dragOverKey === key || binding || isPickTarget ? .14 : .06}
                  />
                  <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.32} fill={isTransDown ? "#bcbcba" : "#dedede"} stroke="#b0b0ad" strokeWidth={.04}/>
                  {transVisual
                    ? <EmbeddedGlyph visual={transVisual} cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.28}/>
                    : <circle cx={b.col+b.w/2} cy={b.row+b.h*.42} r={Math.min(b.w,b.h)*.24} fill="#FF3A5D"/>
                  }
                  {transLabel && (
                    <text x={b.col+b.w/2} y={b.row+b.h*.82}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={.34} fill="#263430" fontFamily="monospace" fontWeight="700">
                      {sublabel ? sublabel : (transLabel.length > 5 ? `${transLabel.slice(0, 4)}…` : transLabel)}
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
