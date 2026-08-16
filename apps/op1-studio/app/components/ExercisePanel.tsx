"use client";
/**
 * ExercisePanel — exercices d'accords ET de mélodie façon « notes qui
 * tombent », sur un écran SVG façon machine. Le clavier joué en dessous est
 * `StudioMachinePanel`, le même composant que dans la fenêtre Studio (13
 * août 2026) — un seul clavier construit, affiché aux deux endroits, pas de
 * copie divergente. L'éditeur de grille (`KeyboardEditor.tsx`) reste dans le
 * dépôt mais n'est monté nulle part pour l'instant, volontairement mis de
 * côté. Vitesse réglable (BPM), notes réellement enfoncées (MIDI ou clic sur
 * les pads drumkit) mises en évidence en plus de la cible qui approche de la
 * ligne de jeu.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StudioMachinePanel } from "./StudioMachinePanel";
import {
  loadKeyboardLayout, loadKeyboardLayoutSync, sortKeyBlocks, layoutBounds,
  KEYBOARD_COLS, KEYBOARD_ROWS, KEYBOARD_WHITE_NOTES, KEYBOARD_BLACK_NOTES,
} from "../lib/keyboardLayout";
import { parseMidiFile, type ParsedMidiFile } from "../lib/midiFileImport";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiNoteLabel(note: number) { return NOTE_NAMES[note % 12]; }

type ExerciseIcon = (props: { name: "check" | "wave"; size?: number }) => ReactNode;

// ── Pas d'exercice : un accord (plusieurs notes) ou une note de mélodie
// (une seule note) — même forme, le rendu s'adapte à la largeur. ───────────
type Step = { label: string; notes: number[] };
const STEP: Record<string, Step> = {
  // Triades en Do majeur
  C:  { label: "C",  notes: [60, 64, 67] },
  Dm: { label: "Dm", notes: [62, 65, 69] },
  Em: { label: "Em", notes: [64, 67, 71] },
  F:  { label: "F",  notes: [65, 69, 72] },
  G:  { label: "G",  notes: [67, 71, 74] },
  Am: { label: "Am", notes: [69, 72, 76] },
  // Notes seules pour les exercices de mélodie (C4 à C5)
  n60: { label: "C", notes: [60] }, n62: { label: "D", notes: [62] },
  n64: { label: "E", notes: [64] }, n65: { label: "F", notes: [65] },
  n67: { label: "G", notes: [67] }, n69: { label: "A", notes: [69] },
  n71: { label: "B", notes: [71] }, n72: { label: "C", notes: [72] },
};

const DRUM_STEPS: Record<string, Step> = {
  kick: { label: "KICK", notes: [36] }, snare: { label: "SNARE", notes: [38] },
  hat: { label: "HAT", notes: [42] }, open: { label: "OPEN", notes: [46] },
};
const DRUM_NOTE_ORDER = [36, 38, 42, 46];

// Mode Effets (feuille de route M4.5, idée du 13 août 2026 : « touches
// d'effet ») — T3 bascule l'effet on/off sur la machine
// (SYNTH_DRUM_MODE_REFERENCE.md §1) ; ici, un seul pad cible plutôt qu'une
// note ou un clavier, avec une note MIDI sentinelle (99, hors de toute
// plage utilisée par les autres modes) pour rester compatible avec le
// modèle de jugement existant (`pressed`/`targetNotes`) sans le dupliquer.
const EFFECT_NOTE = 99;
const EFFECT_STEPS: Record<string, Step> = {
  on: { label: "FX ON", notes: [EFFECT_NOTE] },
  off: { label: "FX OFF", notes: [EFFECT_NOTE] },
};
const EFFECT_NOTE_ORDER = [EFFECT_NOTE];

type ExerciseMode = "drumkit" | "melodie" | "accord" | "morceau" | "effets";
const MODE_LABEL: Record<ExerciseMode, string> = { drumkit: "DRUMKIT", melodie: "MÉLODIE", accord: "ACCORD", morceau: "MORCEAU", effets: "EFFETS" };
const EXERCISES: Record<ExerciseMode, Record<string, { steps: string[]; beatsPerStep: number }>> = {
  drumkit: {
    "Groove simple": { steps: ["kick", "hat", "snare", "hat", "kick", "hat", "snare", "open"], beatsPerStep: 1 },
    "Kick & snare": { steps: ["kick", "kick", "snare", "kick", "kick", "snare", "kick", "snare"], beatsPerStep: 1 },
    "Hi-hat régulier": { steps: ["hat", "hat", "hat", "hat", "hat", "hat", "hat", "hat"], beatsPerStep: 1 },
  },
  melodie: {
    "Gamme montante": { steps: ["n60", "n62", "n64", "n65", "n67", "n69", "n71", "n72"], beatsPerStep: 2 },
    "Gamme descendante": { steps: ["n72", "n71", "n69", "n67", "n65", "n64", "n62", "n60"], beatsPerStep: 2 },
    "Arpège de Do": { steps: ["n60", "n64", "n67", "n72"], beatsPerStep: 2 },
    "Petit air": { steps: ["n64", "n64", "n65", "n67", "n67", "n65", "n64", "n62", "n60"], beatsPerStep: 2 },
  },
  accord: {
    "I–V–vi–IV": { steps: ["C", "G", "Am", "F"], beatsPerStep: 4 },
    "I–IV–V": { steps: ["C", "F", "G"], beatsPerStep: 4 },
    "ii–V–I": { steps: ["Dm", "G", "C"], beatsPerStep: 4 },
    "vi–IV–I–V": { steps: ["Am", "F", "C", "G"], beatsPerStep: 4 },
    "I–vi–IV–V": { steps: ["C", "Am", "F", "G"], beatsPerStep: 4 },
  },
  effets: {
    "Rythme simple": { steps: ["on", "off", "on", "off", "on", "off", "on", "off"], beatsPerStep: 1 },
    "Contretemps": { steps: ["off", "on", "off", "on", "off", "on", "off", "on"], beatsPerStep: 1 },
    "Doubles": { steps: ["on", "on", "off", "off", "on", "on", "off", "off"], beatsPerStep: 1 },
  },
  // Pas de suite prédéfinie : le morceau vient d'un fichier .mid importé (state `song`).
  morceau: {},
};

const STEP_BY_MODE: Record<ExerciseMode, Record<string, Step>> = {
  drumkit: DRUM_STEPS,
  melodie: STEP,
  accord: STEP,
  effets: EFFECT_STEPS,
  morceau: {},
};

// ── Mode « apprendre un morceau » (import MIDI) ─────────────────────────────
// Fenêtre d'anticipation : un événement MIDI met SONG_FALL_SECONDS pour
// tomber du haut de l'écran jusqu'à la ligne de jeu — pas un pas de grille
// répété comme les autres modes, une timeline continue.
const SONG_FALL_SECONDS = 2.5;

// ── Géométrie de l'écran (viewBox indépendant de la taille réelle) ──────────
const SCREEN_TOP = -8;
const HIT_LINE = 48;
const SCREEN_BOTTOM = 60;
const TRAVEL = SCREEN_BOTTOM - SCREEN_TOP;
const HIT_TOLERANCE = 3; // même seuil que le surlignage visuel « isHit »

// ── Progression locale (feuille de route M4.5 : « progression » du module
// Exercices) — un score par exercice, jamais envoyé hors de l'appareil. ────
const PROGRESS_STORAGE_KEY = "op1-studio-exercise-progress-v1";
type ExerciseProgress = { bestStreak: number; bestAccuracy: number; attempts: number };

function loadProgress(): Record<string, ExerciseProgress> {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(all: Record<string, ExerciseProgress>) {
  try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all)); } catch {}
}

export function ExercisePanel({
  Icon, selectedExercise, running, onExerciseChange, onToggle, pressedNotes = [],
}: {
  Icon: ExerciseIcon;
  selectedExercise: string;
  running: boolean;
  onExerciseChange: (value: string) => void;
  onToggle: () => void;
  pressedNotes?: number[];
}) {
  const [bpm, setBpm] = useState(90);
  const [mode, setMode] = useState<ExerciseMode>("accord");
  const [elapsed, setElapsed] = useState(0);
  const [pressedLocal, setPressedLocal] = useState<number[]>([]);
  // Notes tenues sur le clavier StudioMachinePanel (clic), distinct de
  // `pressedLocal` (pads Drumkit) et de `pressedNotes` (vrai MIDI entrant) —
  // sans ça, cliquer une note en mode Mélodie/Accord/Morceau ne compte pas.
  const [pressedFromKeyboard, setPressedFromKeyboard] = useState<number[]>([]);
  const [validated, setValidated] = useState(() => loadKeyboardLayoutSync());
  const [score, setScore] = useState({ hits: 0, total: 0, streak: 0, bestStreak: 0 });
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>(() => loadProgress());
  const [song, setSong] = useState<ParsedMidiFile | null>(null);
  const [songName, setSongName] = useState<string | null>(null);
  const [songUnsupported, setSongUnsupported] = useState(false);
  // Boucle par section (feuille de route M4.5, idée notée le 13 août 2026) :
  // par défaut sur tout le morceau, comme avant ; décocher pour ne
  // s'entraîner que sur un passage en secondes réelles (avant vitesse).
  const [loopWholeSong, setLoopWholeSong] = useState(true);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const frame = useRef<number | null>(null);
  const startedAt = useRef(0);
  const judgedRef = useRef<Record<string, boolean>>({});

  // Même disposition que le clavier affiché juste en dessous (StudioMachinePanel) :
  // sans ça, une note pourrait tomber au-dessus d'une colonne qui n'est pas
  // la sienne. Objectif : la colonne de chute = la colonne de la touche.
  useEffect(() => {
    let active = true;
    void loadKeyboardLayout().then((blocks) => { if (active) setValidated(blocks); });
    return () => { active = false; };
  }, []);
  const { white: keyboardWhite, black: keyboardBlack } = sortKeyBlocks(validated);
  // Cadrage sur les touches note seulement (comme `StudioMachinePanel
  // notesOnly`) : les encodeurs/boutons/transport ne comptent pas dans la
  // largeur, sinon 2-3 colonnes sans note tombante désalignent l'écran.
  const bounds = layoutBounds([...keyboardWhite, ...keyboardBlack], KEYBOARD_COLS, KEYBOARD_ROWS);

  function xForKeyboardNote(note: number): number {
    const whiteIdx = KEYBOARD_WHITE_NOTES.indexOf(note);
    if (whiteIdx >= 0 && keyboardWhite[whiteIdx]) {
      const b = keyboardWhite[whiteIdx];
      return b.col + b.w / 2;
    }
    const blackIdx = KEYBOARD_BLACK_NOTES.indexOf(note);
    if (blackIdx >= 0 && keyboardBlack[blackIdx]) {
      const b = keyboardBlack[blackIdx];
      return b.col + b.w / 2;
    }
    // Touche pas encore construite à cette position : centre de la disposition actuelle, par défaut.
    return bounds.minX + bounds.width / 2;
  }

  const modeExercises = EXERCISES[mode];
  const defaultExercise = Object.keys(modeExercises)[0];
  // Morceau n'a pas de suite prédéfinie (EXERCISES.morceau est vide) : repli
  // sûr, ces champs ne sont de toute façon pas utilisés dans cette branche.
  const exercise = modeExercises[selectedExercise] ?? modeExercises[defaultExercise] ?? { steps: [], beatsPerStep: 4 };
  const sequence = exercise.steps;
  const beatsPerStep = exercise.beatsPerStep;
  const stepLibrary = STEP_BY_MODE[mode];
  const chordSeconds = (60 / Math.max(40, Math.min(200, bpm))) * beatsPerStep;
  const cycle = chordSeconds * Math.max(1, sequence.length);
  // En mode morceau, la vitesse (BPM) devient un pourcentage de lecture —
  // ralenti en dessous de 100, comme demandé pour « apprendre un morceau ».
  const songSpeed = bpm / 90;

  async function onSongFile(file: File | undefined) {
    if (!file) return;
    setSongUnsupported(false);
    const bytes = await file.arrayBuffer();
    const parsed = parseMidiFile(bytes);
    if (!parsed || !parsed.notes.length) { setSong(null); setSongUnsupported(true); return; }
    setSong(parsed);
    setSongName(file.name);
    // Nouveau morceau = nouvelle boucle par défaut sur sa durée entière.
    setLoopWholeSong(true);
    setLoopStart(0);
    setLoopEnd(parsed.durationSeconds);
  }

  // Horloge de chute : ne tourne que pendant l'exercice, se remet à zéro à
  // chaque démarrage pour repartir du premier pas de la suite (ou du début
  // du morceau importé).
  useEffect(() => {
    if (!running) { if (frame.current) cancelAnimationFrame(frame.current); return; }
    startedAt.current = performance.now();
    const tick = () => {
      setElapsed((performance.now() - startedAt.current) / 1000);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [running, selectedExercise, bpm, songName]);

  // Nouveau départ = nouveau score. La clé de progression suit le mode et
  // l'exercice choisi (ou le nom du morceau importé), jamais mélangée entre
  // deux suites différentes. La mise à jour est différée dans une image
  // (requestAnimationFrame) plutôt qu'appelée en direct dans le corps de
  // l'effet, pour rester en dehors du rendu synchrone
  // (règle react-hooks/set-state-in-effect).
  const progressKey = mode === "morceau" ? `morceau:${songName ?? "sans-titre"}` : `${mode}:${modeExercises[selectedExercise] ? selectedExercise : defaultExercise}`;
  useEffect(() => {
    if (!running) return;
    const raf = requestAnimationFrame(() => {
      setScore({ hits: 0, total: 0, streak: 0, bestStreak: 0 });
      judgedRef.current = {};
    });
    return () => cancelAnimationFrame(raf);
  }, [running, progressKey]);

  const pressed = new Set([...pressedNotes, ...pressedLocal, ...pressedFromKeyboard]);

  function pressLocal(note: number) {
    setPressedLocal((current) => current.includes(note) ? current : [...current, note]);
  }

  function releaseLocal(note: number) {
    setPressedLocal((current) => current.filter((item) => item !== note));
  }

  // Position de chaque pas de la suite + celui actuellement au plus près de
  // la ligne de jeu, pour surligner la bonne cible sur le clavier. Mode
  // morceau : timeline continue depuis le fichier importé (pas de pas
  // répétés), boucle soit sur toute sa durée, soit sur la section choisie
  // (livré 14 août 2026 — bornes en secondes réelles avant application de la
  // vitesse de lecture).
  const songDuration = song?.durationSeconds ?? 0;
  const loopStartSeconds = loopWholeSong ? 0 : Math.max(0, Math.min(loopStart, songDuration));
  const loopEndSeconds = loopWholeSong ? songDuration : Math.max(loopStartSeconds + 0.1, Math.min(loopEnd, songDuration));
  const songLoopSeconds = song ? (loopEndSeconds - loopStartSeconds) + SONG_FALL_SECONDS + 1 : 0;
  const songTime = song ? loopStartSeconds + (((elapsed * songSpeed) % songLoopSeconds) + songLoopSeconds) % songLoopSeconds : 0;
  const loopSongNotes = song ? song.notes.filter((note) => note.startSeconds >= loopStartSeconds && note.startSeconds < loopEndSeconds) : [];
  const blocks = mode === "morceau"
    ? loopSongNotes.map((note, i) => {
        const secondsUntilHit = note.startSeconds - songTime;
        const y = HIT_LINE - (secondsUntilHit / SONG_FALL_SECONDS) * (HIT_LINE - SCREEN_TOP);
        return { key: `song-${i}`, step: { label: midiNoteLabel(note.note), notes: [note.note] }, y, distanceToHit: Math.abs(y - HIT_LINE) };
      }).filter((b) => b.y > SCREEN_TOP - 6 && b.y < SCREEN_BOTTOM + 6)
    : sequence.map((key, i) => {
    const phase = ((elapsed + i * chordSeconds) % cycle + cycle) % cycle;
    const y = SCREEN_TOP + (phase / cycle) * TRAVEL;
    return { key: `${key}-${i}`, step: stepLibrary[key], y, distanceToHit: Math.abs(y - HIT_LINE) };
  });
  const active = running
    ? blocks.reduce((best, b) => (b.distanceToHit < best.distanceToHit ? b : best), blocks[0])
    : null;
  const targetNotes = new Set(active?.step.notes ?? []);

  // Jugement note/timing (feuille de route M4.5 : « exercices notes/timing/
  // progression »). À chaque image pendant la lecture : un pas jugé une
  // seule fois par passage, au moment où il entre dans la zone de la ligne
  // de jeu (même seuil que le surlignage visuel). Réussite = toutes les
  // notes cibles sont tenues au même instant ; sinon échec, série remise à
  // zéro. En dehors de la zone, le pas redevient jugeable au tour suivant.
  // La détection (lecture/écriture de `judgedRef`, une ref) reste synchrone ;
  // seules les mises à jour de state sont différées dans une image, pour
  // rester en dehors du rendu synchrone (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!running) return;
    let hit = false;
    let missed = false;
    for (const b of blocks) {
      const near = b.distanceToHit < HIT_TOLERANCE;
      if (near && !judgedRef.current[b.key]) {
        judgedRef.current[b.key] = true;
        const success = b.step.notes.every((note) => pressed.has(note));
        if (success) hit = true; else missed = true;
      } else if (!near) {
        judgedRef.current[b.key] = false;
      }
    }
    if (!hit && !missed) return;
    const raf = requestAnimationFrame(() => {
      setScore((current) => {
        const streak = hit ? current.streak + 1 : 0;
        const next = {
          hits: current.hits + (hit ? 1 : 0),
          total: current.total + 1,
          streak,
          bestStreak: Math.max(current.bestStreak, streak),
        };
        const accuracy = next.total ? next.hits / next.total : 0;
        const stored = progress[progressKey];
        if (!stored || next.bestStreak > stored.bestStreak || accuracy > stored.bestAccuracy) {
          const nextProgress = {
            ...progress,
            [progressKey]: {
              bestStreak: Math.max(next.bestStreak, stored?.bestStreak ?? 0),
              bestAccuracy: Math.max(accuracy, stored?.bestAccuracy ?? 0),
              attempts: (stored?.attempts ?? 0) + (next.total === 1 ? 1 : 0),
            },
          };
          setProgress(nextProgress);
          saveProgress(nextProgress);
        }
        return next;
      });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, running]);

  const best = progress[progressKey];
  // Drumkit et Effets gardent un repère 0-100 (pas de touches piano à
  // aligner, juste des pads) ; mélodie/accord utilisent le repère colonne
  // du clavier construit, pour que chaque note tombe exactement au-dessus
  // de sa touche.
  const usesPadLayout = mode === "drumkit" || mode === "effets";
  const padOrder = mode === "effets" ? EFFECT_NOTE_ORDER : DRUM_NOTE_ORDER;
  const screenMinX = usesPadLayout ? 0 : bounds.minX;
  const screenWidth = usesPadLayout ? 100 : bounds.width;
  const xForExerciseNote = (note: number) => usesPadLayout
    ? ((padOrder.indexOf(note) + 0.5) / padOrder.length) * 100
    : xForKeyboardNote(note);

  return (
    <div className="tool-body exercise-tool-body">
      <div className="exercise-toolbar">
        <div className="exercise-mode-switch" role="group" aria-label="Mode d’exercice">
          {(Object.keys(EXERCISES) as ExerciseMode[]).map((item) => <button type="button" key={item} className={mode === item ? "is-active" : ""} onClick={() => { setMode(item); if (item !== "morceau") onExerciseChange(Object.keys(EXERCISES[item])[0]); }}>{MODE_LABEL[item]}</button>)}
        </div>
        {mode === "morceau" ? (
          <>
            <label className="exercise-song-input">Morceau
              <input type="file" accept=".mid,.midi,audio/midi" onChange={(event) => { void onSongFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <span>{songName ?? "Importer un fichier .mid"}</span>
            </label>
            {song && (
              <>
                <label><input type="checkbox" checked={loopWholeSong} onChange={(event) => setLoopWholeSong(event.target.checked)} style={{ width: "auto" }} />Morceau entier</label>
                {!loopWholeSong && (
                  <>
                    <label>Début (s)
                      <input type="number" min="0" max={songDuration} step="0.5" value={loopStart}
                        onChange={(event) => setLoopStart(Math.max(0, Math.min(songDuration, Number(event.target.value) || 0)))} />
                    </label>
                    <label>Fin (s)
                      <input type="number" min="0" max={songDuration} step="0.5" value={loopEnd}
                        onChange={(event) => setLoopEnd(Math.max(0, Math.min(songDuration, Number(event.target.value) || songDuration)))} />
                    </label>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <label>Exercice
            <select value={modeExercises[selectedExercise] ? selectedExercise : defaultExercise} onChange={(event) => onExerciseChange(event.target.value)}>
              {Object.keys(modeExercises).map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
        )}
        <label>Vitesse
          <input type="number" min="40" max="200" value={bpm}
            onChange={(event) => setBpm(Math.max(40, Math.min(200, Number(event.target.value) || 90)))} /> {mode === "morceau" ? "%" : "BPM"}
        </label>
      </div>
      {mode === "morceau" && songUnsupported && <p className="tool-note">Fichier non reconnu comme MIDI standard (.mid) exploitable — aucune note trouvée.</p>}
      {mode === "morceau" && !song && !songUnsupported && <p className="tool-note">Importez un fichier .mid pour vous entraîner dessus. Toutes les pistes sont fusionnées en une seule performance. Boucle sur tout le morceau par défaut, ou sur une section choisie (décocher « morceau entier »).</p>}

      {/* ── Écran — accords ou notes qui tombent vers la ligne de jeu ──
          Repère horizontal (X) partagé avec le clavier affiché juste en
          dessous : même minX/largeur que `bounds`, donc une colonne de
          l'écran tombe exactement sur la même colonne de touche. La forme du
          cadre (paysage, indépendante du nombre de touches) est fixe :
          `preserveAspectRatio="none"` étire le contenu sans lien avec le
          ratio du conteneur, seul l'axe X compte pour l'alignement. */}
      <div className="exercise-highway" style={{ aspectRatio: "100 / 42" }}>
        <svg viewBox={`${screenMinX} ${SCREEN_TOP} ${screenWidth} ${SCREEN_BOTTOM - SCREEN_TOP}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect x={screenMinX} y={SCREEN_TOP} width={screenWidth} height={SCREEN_BOTTOM - SCREEN_TOP} fill="#0c1011" />
          <line x1={screenMinX} y1={HIT_LINE} x2={screenMinX + screenWidth} y2={HIT_LINE} stroke="#FF3A5D" strokeWidth={0.6} strokeDasharray="2 1.4" opacity={.75} />
          {blocks.map((b) => {
            const xs = b.step.notes.map(xForExerciseNote);
            const margin = usesPadLayout ? (b.step.notes.length === 1 ? 2.5 : 4) : 0.15;
            const x0 = Math.max(screenMinX + 0.3, Math.min(...xs) - margin);
            const x1 = Math.min(screenMinX + screenWidth - 0.3, Math.max(...xs) + margin);
            const isHit = running && b === active && b.distanceToHit < 3;
            const single = b.step.notes.length === 1;
            return (
              <g key={b.key} transform={`translate(0 ${b.y})`}>
                <rect x={x0} y={-4} width={x1 - x0} height={8} rx={usesPadLayout ? 2 : 0.3}
                  fill={isHit ? "#00ED95" : single ? "#DFD9FF" : "#698EFF"} opacity={isHit ? .95 : .75}
                  stroke={isHit ? "#00ED95" : single ? "#8f89aa" : "#4c6fd9"} strokeWidth={usesPadLayout ? 0.4 : 0.1} />
                <text x={(x0 + x1) / 2} y={.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={usesPadLayout ? 4.2 : 1.2} fontFamily="monospace" fontWeight={700} fill="#0c1011">
                  {b.step.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="exercise-instrument" aria-label="Clavier OP-1 compact pour exercice">
        {mode === "drumkit" ? <div className="exercise-drum-pads">{DRUM_NOTE_ORDER.map((note) => <button type="button" key={note} aria-label={`Jouer le pad MIDI ${note}`} className={`exercise-drum-pad${pressed.has(note) ? " is-down" : ""}${targetNotes.has(note) ? " is-target" : ""}`} onPointerDown={() => pressLocal(note)} onPointerUp={() => releaseLocal(note)} onPointerLeave={() => releaseLocal(note)}><strong>{DRUM_STEPS[Object.keys(DRUM_STEPS).find((key) => DRUM_STEPS[key].notes[0] === note) ?? "kick"].label}</strong><small>{note}</small></button>)}</div> : mode === "effets" ? (
          // T3 bascule l'effet on/off sur la machine (voir la constante
          // EFFECT_NOTE ci-dessus) : un seul pad cible, pas un clavier.
          <div className="exercise-effect-pad-row">
            <button type="button" aria-label="Basculer l'effet (touche T3)"
              className={`exercise-effect-pad${pressed.has(EFFECT_NOTE) ? " is-down" : ""}${targetNotes.has(EFFECT_NOTE) ? " is-target" : ""}`}
              onPointerDown={() => pressLocal(EFFECT_NOTE)} onPointerUp={() => releaseLocal(EFFECT_NOTE)} onPointerLeave={() => releaseLocal(EFFECT_NOTE)}>
              <strong>T3</strong><small>EFFET</small>
            </button>
          </div>
        ) : (
          // Même clavier que la fenêtre Studio, pas une copie : construit une
          // fois dans l'éditeur (mis de côté pour l'instant), affiché ici et
          // là identiquement.
          <StudioMachinePanel mode="clone" pressedNotes={pressedNotes} onTogglePlayback={onToggle} onSendMidi={() => {}} notesOnly
            onPressedChange={(notes) => setPressedFromKeyboard(Array.from(notes))} />
        )}
      </div>

      {/* ── Score et progression locale ── */}
      <div className="exercise-score-row" aria-live="polite">
        <span><strong>{score.hits}</strong>/{score.total} réussis</span>
        <span><strong>{score.total ? Math.round((score.hits / score.total) * 100) : 0}</strong>% précision</span>
        <span>série <strong>{score.streak}</strong> · meilleure <strong>{score.bestStreak}</strong></span>
        {best && <span className="exercise-score-best">record de l’exercice : série {best.bestStreak}, {Math.round(best.bestAccuracy * 100)}%</span>}
      </div>

      {/* ── Transport ── */}
      <div className="exercise-actions">
        <div className="exercise-transport">
          <button type="button" className="exercise-transport-btn" onClick={onToggle} aria-label={running ? "Arrêter" : "Lecture"}>
            <i className={running ? "is-stop" : "is-play"} />
          </button>
          <span className="mgrid-hint">{active ? `Cible : ${active.step.label}` : "Prêt à commencer"}</span>
        </div>
        <button className="primary-action" onClick={onToggle}>
          <Icon name={running ? "check" : "wave"} />{running ? "Arrêter l’exercice" : "Commencer l’exercice"}
        </button>
        <span className="midi-badge"><i /> OP-1 MIDI {running ? "ACTIF" : "PRÊT"}</span>
      </div>
      <p className="tool-note">La cible verte est ce qu’il faut jouer maintenant ; les touches enfoncées (MIDI ou clic) s’allument séparément. Le score et le record sont enregistrés localement, jamais envoyés hors de l’appareil. Aucun message MIDI n’est envoyé à la machine.</p>
    </div>
  );
}
