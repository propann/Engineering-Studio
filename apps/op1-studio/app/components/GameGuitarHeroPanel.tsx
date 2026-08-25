"use client";
/**
 * GameGuitarHeroPanel.tsx — Espace d'Apprentissage Interactif & Arcade OP-1.
 * 
 * Conception & Exigences :
 * - Écran OLED haute définition : Fond noir pur (#000000), colonnes vectorielles en pointillés blancs nets.
 * - Catalogue complet de 40 exercices classés par Niveaux (1 à 10) et 4 Catégories (Mélodies, Accords, Finger Drumming, Arcade).
 * - Fiche de Personnage RPG complète & unifiée regroupant toutes les informations (Identité, Atelier/Studio, 4 Disciplines, Statistiques complètes, Badges & Trophées, Historique).
 * - Sauvegarde locale persistante, import/export JSON de profil.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { GameGuitarHeroKeyboard } from "./GameGuitarHeroKeyboard";
import { InvaderSprite } from "./InvaderLineSprites";
import {
  MidiPerformanceDebriefModal,
  type RecordedPlayerEvent,
  type HitJudgment,
} from "./MidiPerformanceDebriefModal";
import {
  GAME_SONG_THEMES,
  type GameSongTheme,
  type GameNote,
} from "../lib/gameSongsCatalog";
import {
  loadKeyboardLayout,
  loadKeyboardLayoutSync,
  sortKeyBlocks,
  layoutBounds,
  KEYBOARD_COLS,
  KEYBOARD_ROWS,
  KEYBOARD_WHITE_NOTES,
  KEYBOARD_BLACK_NOTES,
  foldNoteToPlayableKeyboard,
  isPlayableKeyboardNote,
  type KeyboardBlock,
} from "../lib/keyboardLayout";
import { parseMidiFile, type ParsedMidiFile } from "../lib/midiFileImport";

/**
 * Part de sa touche occupée par la note qui tombe.
 *
 * Choisies pour laisser la disposition livrée telle qu'elle était : une
 * blanche de 2 donne toujours 1,18, une noire étroite de 2 toujours 0,82. Ce
 * qui change, ce sont les huit noires larges, qui suivent enfin leur touche.
 */
const PART_BLANCHE = 0.59;
const PART_NOIRE = 0.41;
import { op1AudioEngine } from "../lib/op1SynthEngine";
import {
  loadCharacterProfile,
  saveCharacterProfile,
  recordSessionScore,
  createDefaultProfile,
  syncWithHubProfile,
  calculateRank,
  OPERATOR_AVATARS,
  HUB_AVATAR_ICONS,
  type CharacterProfile,
  type CharacterAchievement,
} from "../lib/characterProfile";

// Dimensions & repères verticaux de l'autoroute (Highway)
const SCREEN_TOP = 0;
const SCREEN_BOTTOM = 100;
const HIT_LINE = 84; // Ligne de frappe basse juste au-dessus du clavier
const NOTE_TRAVEL_TIME_DEFAULT = 2.4; // Secondes pour parcourir l'écran à 100% de vitesse

interface HitFeedback {
  id: number;
  judgment: HitJudgment;
  note: number;
  x: number;
  points: number;
  timestamp: number;
}

interface HitParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

const CATEGORY_TABS: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  all: { label: "Toutes (40)", icon: "✨", color: "#DFD9FF", desc: "Catalogue complet des 40 exercices" },
  melody: { label: "🎹 Mélodies (10)", icon: "🎹", color: "#38bdf8", desc: "Leads modernes, Lo-Fi, Afrobeat, Drill, Neo-Soul" },
  chord: { label: "🎼 Accords (10)", icon: "🎼", color: "#fbbf24", desc: "Triades, 7èmes, Amapiano, Jazz, Gospel" },
  drum: { label: "🥁 Finger Drum (10)", icon: "🥁", color: "#FF3A5D", desc: "Mapping fidèle OP-1 : 808, Drill, Jersey, DnB" },
  arcade: { label: "👾 Arcade (10)", icon: "👾", color: "#a855f7", desc: "Chiptune, Tetris, Phonk, Daft Punk, Boss Rush" },
};

const LEVEL_FILTERS = [
  { id: "all", label: "Tous Niveaux (1-10)" },
  { id: "beginner", label: "Niv. 1-2 Débutant", min: 1, max: 2 },
  { id: "intermediate", label: "Niv. 3-4 Intermédiaire", min: 3, max: 4 },
  { id: "advanced", label: "Niv. 5-6 Avancé", min: 5, max: 6 },
  { id: "pro", label: "Niv. 7-8 Pro", min: 7, max: 8 },
  { id: "master", label: "Niv. 9-10 Expert / Maître", min: 9, max: 10 },
];

export function GameGuitarHeroPanel({
  onClose,
  pressedNotes = [],
  onSendMidi,
  onNotice,
}: {
  onClose?: () => void;
  pressedNotes?: number[];
  onSendMidi?: (data: number[]) => void;
  onNotice?: (msg: string) => void;
}) {
  // Navigation entre les vues
  const [activeView, setActiveView] = useState<"game" | "profile" | "catalog">("game");

  // Profil de personnage RPG & Atelier
  const [profile, setProfile] = useState<CharacterProfile>(() => loadCharacterProfile());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.operatorName);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // Morceaux & Filtres Catalogue
  const [selectedThemeId, setSelectedThemeId] = useState<string>("drum_lvl1_basic_groove");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customMidi, setCustomMidi] = useState<ParsedMidiFile | null>(null);
  const [customMidiName, setCustomMidiName] = useState<string | null>(null);

  // Moteur de jeu & Compte à rebours
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [countdownStage, setCountdownStage] = useState<null | 3 | 2 | 1 | "GO">(null);
  const [visualMode, setVisualMode] = useState<"invaders" | "classic">("invaders");
  const [speedPercent, setSpeedPercent] = useState<number>(100);
  const [loopMode, setLoopMode] = useState<boolean>(false);
  const [autoPlaySound, setAutoPlaySound] = useState<boolean>(true);
  const [soundEngine, setSoundEngine] = useState<string>("Drum");
  const [soundPatch, setSoundPatch] = useState<string>("Kit Drum OP-1 Standard");

  // Progression, Score & Particules
  const [score, setScore] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [sessionStats, setSessionStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0, totalNotes: 0 });
  const [feedbacks, setFeedbacks] = useState<HitFeedback[]>([]);
  const [particles, setParticles] = useState<HitParticle[]>([]);
  const [lastFinishedResult, setLastFinishedResult] = useState<{ xpEarned: number; newLevel: boolean } | null>(null);

  // ── ENREGISTREMENT DU JEU MIDI JOUEUR & DÉBRIEFING DE FIN DE SESSION ──
  const [recordedEvents, setRecordedEvents] = useState<RecordedPlayerEvent[]>([]);
  const recordedEventsRef = useRef<RecordedPlayerEvent[]>([]);
  const [showDebriefModal, setShowDebriefModal] = useState<boolean>(false);
  const [lastDebriefData, setLastDebriefData] = useState<{
    score: number;
    accuracy: number;
    rank: "S+" | "S" | "A" | "B" | "C" | "D";
    maxCombo: number;
    sessionStats: { perfect: number; great: number; good: number; miss: number; totalNotes: number };
    recordedEvents: RecordedPlayerEvent[];
    xpEarned: number;
    newLevel: boolean;
    newAchievements: CharacterAchievement[];
  } | null>(null);

  // Clavier & Notes
  const [validatedBlocks, setValidatedBlocks] = useState(() => loadKeyboardLayoutSync());
  const [pressedKeyboardNotes, setPressedKeyboardNotes] = useState<number[]>([]);

  const handleKeyboardPressedChange = useCallback((notesSet: Set<number>) => {
    setPressedKeyboardNotes(Array.from(notesSet));
  }, []);

  // Horloge temps réel & Références synchronisées pour éviter les boucles infinies de re-render
  const [currentTime, setCurrentTime] = useState<number>(0);
  const currentTimeRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const countdownTimersRef = useRef<number[]>([]);
  const judgedNotesRef = useRef<Set<string>>(new Set());
  const soundTriggeredNotesRef = useRef<Set<string>>(new Set());
  const lastPressedStateRef = useRef<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImportInputRef = useRef<HTMLInputElement>(null);

  // Refs de stabilité (évite les ré-instanciations d'effets cycliques)
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboStreakRef = useRef(comboStreak);
  comboStreakRef.current = comboStreak;
  const maxComboRef = useRef(maxCombo);
  maxComboRef.current = maxCombo;
  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;

  // Annulation propre des timers de compte à rebours
  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((t) => window.clearTimeout(t));
    countdownTimersRef.current = [];
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      clearCountdownTimers();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [clearCountdownTimers]);

  // Chargement de la disposition clavier OP-1
  useEffect(() => {
    let active = true;
    void loadKeyboardLayout().then((b) => {
      if (active) setValidatedBlocks(b);
    });
    return () => { active = false; };
  }, []);

  const { white: whiteBlocks, black: blackBlocks } = sortKeyBlocks(validatedBlocks);
  const bounds = layoutBounds([...whiteBlocks, ...blackBlocks], KEYBOARD_COLS, KEYBOARD_ROWS);

  // Morceau actif
  const currentSong: GameSongTheme = useMemo(() => {
    if (customMidi && customMidiName) {
      return {
        id: "custom_midi",
        title: customMidiName,
        category: "melody",
        level: 5,
        icon: "📁",
        bpm: 120,
        difficulty: "Intermédiaire",
        description: `Morceau importé personnellement (${customMidi.notes.length} notes)`,
        durationSeconds: customMidi.durationSeconds,
        recommendedEngine: soundEngine,
        recommendedPatch: soundPatch,
        notes: customMidi.notes.map((n) => {
          const note = foldNoteToPlayableKeyboard(n.note);
          return {
            note,
            startSeconds: n.startSeconds,
            durationSeconds: n.durationSeconds,
            velocity: n.velocity,
            label: `${["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][note % 12]}${Math.floor(note / 12) - 1}`,
          };
        }),
      };
    }
    return GAME_SONG_THEMES.find((t) => t.id === selectedThemeId) ?? GAME_SONG_THEMES[0];
  }, [selectedThemeId, customMidi, customMidiName, soundEngine, soundPatch]);

  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;

  // Notes cibles actives actuellement sur la ligne de jeu
  const activeTargetNotes = useMemo(() => {
    const targetSet = new Set<number>();
    const tolerance = 0.25;
    for (const note of currentSong.notes) {
      if (Math.abs(note.startSeconds - currentTime) <= tolerance) {
        targetSet.add(note.note);
      }
    }
    return targetSet;
  }, [currentSong.notes, currentTime]);

  /**
   * La touche qui porte une note, ou `null` si aucune ne la porte.
   *
   * Une seule recherche, lue par la position ET par la largeur. Deux
   * recherches séparées pouvaient déjà répondre sur des blocs différents — la
   * largeur ne cherchait même pas de bloc, elle rendait une constante.
   */
  const blocDeNote = useCallback((note: number): KeyboardBlock | null => {
    const iBlanche = KEYBOARD_WHITE_NOTES.indexOf(note);
    if (iBlanche >= 0 && whiteBlocks[iBlanche]) return whiteBlocks[iBlanche];
    const iNoire = KEYBOARD_BLACK_NOTES.indexOf(note);
    if (iNoire >= 0 && blackBlocks[iNoire]) return blackBlocks[iNoire];
    return null;
  }, [whiteBlocks, blackBlocks]);

  // Calcul horizontal X exact correspondant à la colonne de la touche
  const getNoteX = useCallback((note: number): number => {
    const b = blocDeNote(note);
    if (!b) throw new Error(`Note MIDI ${note} absente du clavier OP-1`);
    return b.col + b.w / 2;
  }, [blocDeNote]);

  /**
   * Largeur de la note qui tombe — une FRACTION de sa touche, pas une taille.
   *
   * `1.18` et `0.82` étaient écrits en dur. Sur la disposition livrée, les
   * touches blanches font 2 et les noires 2 OU 3 : la note couvrait donc 59 %
   * d'une blanche, mais 41 % des deux noires étroites et seulement 27 % des
   * huit larges. Trois tailles relatives différentes pour un écran qui promet
   * de tomber « exactement au-dessus de sa touche ».
   *
   * Et la disposition s'édite (`KeyboardEditor`) : élargir une touche déplaçait
   * sa colonne sans toucher à la note qui y tombe. C'est précisément ce que le
   * module `keyboardLayout` existe pour empêcher.
   *
   * Deux fractions, pas une : les noires de cette disposition sont dessinées
   * PLUS larges que les blanches, et une fraction unique donnerait des notes
   * noires plus lourdes que les blanches à l'écran.
   */
  const getNoteWidth = useCallback((note: number): number => {
    const b = blocDeNote(note);
    if (!b) throw new Error(`Note MIDI ${note} absente du clavier OP-1`);
    return b.w * (b.type === "black" ? PART_NOIRE : PART_BLANCHE);
  }, [blocDeNote]);

  // Sélection d'un thème depuis le catalogue
  const handleSelectTheme = useCallback((theme: GameSongTheme) => {
    setSelectedThemeId(theme.id);
    setCustomMidi(null);
    setCustomMidiName(null);
    setSoundEngine(theme.recommendedEngine);
    setSoundPatch(theme.recommendedPatch);

    // Réinitialiser la session
    setIsPlaying(false);
    setShowDebriefModal(false);
    setRecordedEvents([]);
    recordedEventsRef.current = [];
    currentTimeRef.current = 0;
    setCurrentTime(0);
    scoreRef.current = 0;
    setScore(0);
    comboStreakRef.current = 0;
    setComboStreak(0);
    maxComboRef.current = 0;
    setMaxCombo(0);
    setMultiplier(1);
    const initialStats = { perfect: 0, great: 0, good: 0, miss: 0, totalNotes: theme.notes.length };
    sessionStatsRef.current = initialStats;
    setSessionStats(initialStats);
    setFeedbacks([]);
    setParticles([]);
    judgedNotesRef.current.clear();
    soundTriggeredNotesRef.current.clear();
    setActiveView("game");
  }, []);

  // Import fichier MIDI
  const handleImportMidi = useCallback((file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const parsed = parseMidiFile(buffer);
        if (!parsed || parsed.notes.length === 0) {
          onNoticeRef.current?.("Aucune note jouable trouvée dans ce fichier MIDI.");
          return;
        }
        setCustomMidi(parsed);
        setCustomMidiName(file.name.replace(/\.[^/.]+$/, ""));
        setSelectedThemeId("custom_midi");
        setIsPlaying(false);
        setShowDebriefModal(false);
        setRecordedEvents([]);
        recordedEventsRef.current = [];
        currentTimeRef.current = 0;
        setCurrentTime(0);
        scoreRef.current = 0;
        setScore(0);
        comboStreakRef.current = 0;
        setComboStreak(0);
        maxComboRef.current = 0;
        setMaxCombo(0);
        setMultiplier(1);
        const initialStats = { perfect: 0, great: 0, good: 0, miss: 0, totalNotes: parsed.notes.length };
        sessionStatsRef.current = initialStats;
        setSessionStats(initialStats);
        setFeedbacks([]);
        setParticles([]);
        judgedNotesRef.current.clear();
        soundTriggeredNotesRef.current.clear();
        setActiveView("game");
        onNoticeRef.current?.(`Fichier MIDI "${file.name}" importé avec succès (${parsed.notes.length} notes) !`);
      } catch {
        onNoticeRef.current?.("Erreur lors de la lecture du fichier MIDI.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Jouer une note sur le moteur sonore OP-1
  const playSoundNote = useCallback((noteNumber: number, velocity = 0.85) => {
    try {
      const song = currentSongRef.current;
      const isDrum =
        song.category === "drum" ||
        soundEngine === "Drum" ||
        song.recommendedEngine === "Drum";

      if (isDrum) {
        op1AudioEngine.triggerDrum(noteNumber, Math.round(velocity * 127));
      } else {
        op1AudioEngine.triggerNoteOn(noteNumber, Math.round(velocity * 127), soundEngine as any);
        window.setTimeout(() => {
          op1AudioEngine.triggerNoteOff(noteNumber);
          onSendMidi?.([0x80, noteNumber, 0]);
        }, 220);
      }
      onSendMidi?.([0x90, noteNumber, Math.round(velocity * 127)]);
    } catch {
      // Audio engine fallback
    }
  }, [soundEngine, onSendMidi]);

  // Lancement interactif avec compte à rebours central 3, 2, 1, GO!
  const launchCountdown = useCallback(() => {
    clearCountdownTimers();
    setIsPlaying(false);
    setShowDebriefModal(false);
    setRecordedEvents([]);
    recordedEventsRef.current = [];
    currentTimeRef.current = 0;
    setCurrentTime(0);
    scoreRef.current = 0;
    setScore(0);
    comboStreakRef.current = 0;
    setComboStreak(0);
    maxComboRef.current = 0;
    setMaxCombo(0);
    setMultiplier(1);
    const initialStats = { perfect: 0, great: 0, good: 0, miss: 0, totalNotes: currentSongRef.current.notes.length };
    sessionStatsRef.current = initialStats;
    setSessionStats(initialStats);
    setFeedbacks([]);
    setParticles([]);
    judgedNotesRef.current.clear();
    soundTriggeredNotesRef.current.clear();

    setCountdownStage(3);
    op1AudioEngine.playCountdownBeep("3");

    const t1 = window.setTimeout(() => {
      setCountdownStage(2);
      op1AudioEngine.playCountdownBeep("2");
    }, 700);

    const t2 = window.setTimeout(() => {
      setCountdownStage(1);
      op1AudioEngine.playCountdownBeep("1");
    }, 1400);

    const t3 = window.setTimeout(() => {
      setCountdownStage("GO");
      op1AudioEngine.playCountdownBeep("GO");
    }, 2100);

    const t4 = window.setTimeout(() => {
      setCountdownStage(null);
      setIsPlaying(true);
      playbackStartTimeRef.current = performance.now();
    }, 2600);

    countdownTimersRef.current = [t1, t2, t3, t4];
  }, [clearCountdownTimers]);

  // Démarrage instantané de la lecture (ou reprise)
  const startPlayback = useCallback(() => {
    launchCountdown();
  }, [launchCountdown]);

  // Fin ou arrêt de session & Génération du Débriefing MIDI Comparatif
  const stopPlayback = useCallback((completedNormally = false) => {
    clearCountdownTimers();
    setCountdownStage(null);
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const currentStats = sessionStatsRef.current;
    const currentProfile = profileRef.current;
    const song = currentSongRef.current;
    const curScore = scoreRef.current;
    const curMaxCombo = maxComboRef.current;
    const allRecorded = [...recordedEventsRef.current];
    setRecordedEvents(allRecorded);

    if (completedNormally && currentStats.totalNotes > 0) {
      const totalJudged = currentStats.perfect + currentStats.great + currentStats.good + currentStats.miss;
      const accuracy = totalJudged > 0 ? Math.round(((currentStats.perfect + currentStats.great + currentStats.good) / totalJudged) * 100) : 0;
      const rank = calculateRank(accuracy);

      const { updatedProfile, newLevel, newAchievements } = recordSessionScore(currentProfile, {
        songId: song.id,
        songTitle: song.title,
        category: song.category,
        score: curScore,
        accuracy,
        maxCombo: curMaxCombo,
        perfectCount: currentStats.perfect,
        greatCount: currentStats.great,
        goodCount: currentStats.good,
        missCount: currentStats.miss,
        durationSeconds: song.durationSeconds,
      });

      setProfile(updatedProfile);
      profileRef.current = updatedProfile;
      saveCharacterProfile(updatedProfile);

      const xpEarned = Math.floor(curScore / 10);
      setLastFinishedResult({ xpEarned, newLevel });

      // Configuration des données du débriefing comparatif
      setLastDebriefData({
        score: curScore,
        accuracy,
        rank,
        maxCombo: curMaxCombo,
        sessionStats: { ...currentStats },
        recordedEvents: allRecorded,
        xpEarned,
        newLevel,
        newAchievements,
      });

      // Ouverture de la modale de débriefing
      setShowDebriefModal(true);

      if (newLevel) {
        onNoticeRef.current?.(`🎉 NIVEAU SUPÉRIEUR ! Vous êtes maintenant Niveau ${updatedProfile.level} : ${updatedProfile.title} !`);
      } else if (newAchievements.length > 0) {
        onNoticeRef.current?.(`🏆 SUCCÈS DÉBLOQUÉ : ${newAchievements[0].title} (${newAchievements[0].icon}) !`);
      } else {
        onNoticeRef.current?.(`Session terminée ! Rang ${rank} (${accuracy}%) · Score : ${curScore.toLocaleString()} pts.`);
      }
    }
  }, [clearCountdownTimers]);

  // Traitement robuste de la frappe d'une note (découplé du cycle de rendu)
  const processNoteHit = useCallback((note: number) => {
    if (!isPlayingRef.current) return;
    const time = currentTimeRef.current;
    const song = currentSongRef.current;

    let bestMatchIdx = -1;
    let minDiff = Infinity;
    let timingDiffRaw = 0;

    for (let i = 0; i < song.notes.length; i++) {
      const songNote = song.notes[i];
      const noteKey = `${i}_${songNote.note}_${songNote.startSeconds}`;
      if (songNote.note === note && !judgedNotesRef.current.has(noteKey)) {
        const diff = Math.abs(songNote.startSeconds - time);
        if (diff < minDiff && diff <= 0.35) {
          minDiff = diff;
          bestMatchIdx = i;
          timingDiffRaw = time - songNote.startSeconds;
        }
      }
    }

    if (bestMatchIdx >= 0) {
      const matchedNote = song.notes[bestMatchIdx];
      const noteKey = `${bestMatchIdx}_${matchedNote.note}_${matchedNote.startSeconds}`;
      judgedNotesRef.current.add(noteKey);

      let judgment: HitJudgment = "GOOD";
      let basePoints = 50;

      if (minDiff <= 0.08) {
        judgment = "PERFECT";
        basePoints = 200;
      } else if (minDiff <= 0.18) {
        judgment = "GREAT";
        basePoints = 120;
      }

      // Enregistrement de l'événement MIDI du joueur pour analyse & comparateur
      const timingDiffMs = Math.round(timingDiffRaw * 1000);
      const recordedEv: RecordedPlayerEvent = {
        id: `hit_${Date.now()}_${Math.random()}`,
        note,
        timestampSeconds: time,
        velocity: 100,
        judgment,
        timingDiffMs,
        matchedTargetStartSeconds: matchedNote.startSeconds,
        matchedTargetLabel: matchedNote.label,
      };
      recordedEventsRef.current.push(recordedEv);
      setRecordedEvents([...recordedEventsRef.current]);

      op1AudioEngine.playHitSound(judgment);

      const currentCombo = comboStreakRef.current + 1;
      comboStreakRef.current = currentCombo;
      setComboStreak(currentCombo);

      const newMax = Math.max(maxComboRef.current, currentCombo);
      maxComboRef.current = newMax;
      setMaxCombo(newMax);

      const currentMulti = currentCombo >= 30 ? 4 : currentCombo >= 20 ? 3 : currentCombo >= 10 ? 2 : 1;
      setMultiplier(currentMulti);

      const pointsWon = basePoints * currentMulti;
      scoreRef.current += pointsWon;
      setScore((prev) => prev + pointsWon);

      setSessionStats((prev) => {
        const next = {
          ...prev,
          perfect: judgment === "PERFECT" ? prev.perfect + 1 : prev.perfect,
          great: judgment === "GREAT" ? prev.great + 1 : prev.great,
          good: judgment === "GOOD" ? prev.good + 1 : prev.good,
        };
        sessionStatsRef.current = next;
        return next;
      });

      const noteX = getNoteX(note);

      // Particules d'impact
      const sparkColor = judgment === "PERFECT" ? "#00ED95" : judgment === "GREAT" ? "#38bdf8" : "#fbbf24";
      const newSparks: HitParticle[] = Array.from({ length: 6 }, (_, sIdx) => ({
        id: Date.now() + sIdx + Math.random(),
        x: noteX,
        y: HIT_LINE,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -Math.random() * 2.5 - 0.8,
        color: sparkColor,
        size: 0.35 + Math.random() * 0.45,
        alpha: 1,
      }));
      setParticles((prev) => [...prev.slice(-24), ...newSparks]);

      setFeedbacks((prev) => [
        ...prev.filter((f) => Date.now() - f.timestamp < 700).slice(-3),
        { id: Date.now() + bestMatchIdx, judgment, note, x: noteX, points: pointsWon, timestamp: Date.now() },
      ]);
    } else {
      // Note pressée en dehors de la partition (Extra / Fausse note)
      const recordedEv: RecordedPlayerEvent = {
        id: `extra_${Date.now()}_${Math.random()}`,
        note,
        timestampSeconds: time,
        velocity: 90,
        judgment: "EXTRA",
        timingDiffMs: 0,
      };
      recordedEventsRef.current.push(recordedEv);
      setRecordedEvents([...recordedEventsRef.current]);
    }
  }, [getNoteX]);

  // Boucle d'animation principale temps réel (RAF)
  useEffect(() => {
    if (!isPlaying) return;

    const speedRatio = speedPercent / 100;
    const songDuration = currentSong.durationSeconds;

    const updateLoop = () => {
      const now = performance.now();
      const elapsed = ((now - playbackStartTimeRef.current) / 1000) * speedRatio;
      currentTimeRef.current = elapsed;

      // Détection de fin de morceau automatique
      if (elapsed >= songDuration + 0.3) {
        if (loopMode) {
          playbackStartTimeRef.current = performance.now();
          judgedNotesRef.current.clear();
          soundTriggeredNotesRef.current.clear();
          currentTimeRef.current = 0;
          setCurrentTime(0);
        } else {
          stopPlayback(true);
          return;
        }
      } else {
        setCurrentTime(elapsed);
      }

      // Mise à jour de la physique des particules néon d'impact (seulement si actif)
      setParticles((prev) => {
        if (prev.length === 0) return prev;
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.4,
            y: p.y + p.vy * 0.4,
            vy: p.vy + 0.08,
            alpha: p.alpha - 0.04,
          }))
          .filter((p) => p.alpha > 0.05);
        return updated.length === 0 ? [] : updated;
      });

      // Nettoyage régulier des feedbacks expirés
      setFeedbacks((prev) => {
        if (prev.length === 0) return prev;
        const nowTs = Date.now();
        const remaining = prev.filter((f) => nowTs - f.timestamp < 700);
        return remaining.length === prev.length ? prev : remaining;
      });

      // Déclenchement automatique du son guide
      if (autoPlaySound) {
        for (let i = 0; i < currentSong.notes.length; i++) {
          const note = currentSong.notes[i];
          const noteKey = `${i}_${note.note}_${note.startSeconds}`;
          if (!soundTriggeredNotesRef.current.has(noteKey) && elapsed >= note.startSeconds) {
            soundTriggeredNotesRef.current.add(noteKey);
            playSoundNote(note.note, note.velocity ?? 0.8);
          }
        }
      }

      // Détection des MISS automatiques pour les notes dépassées
      const missThreshold = 0.35;
      for (let i = 0; i < currentSong.notes.length; i++) {
        const note = currentSong.notes[i];
        const noteKey = `${i}_${note.note}_${note.startSeconds}`;
        if (!judgedNotesRef.current.has(noteKey) && elapsed > note.startSeconds + missThreshold) {
          judgedNotesRef.current.add(noteKey);
          comboStreakRef.current = 0;
          setComboStreak(0);
          setMultiplier(1);
          setSessionStats((prev) => {
            const next = { ...prev, miss: prev.miss + 1 };
            sessionStatsRef.current = next;
            return next;
          });

          op1AudioEngine.playHitSound("MISS");

          const noteX = getNoteX(note.note);
          setFeedbacks((prev) => [
            ...prev.filter((f) => Date.now() - f.timestamp < 700).slice(-3),
            { id: Date.now() + i, judgment: "MISS", note: note.note, x: noteX, points: 0, timestamp: Date.now() },
          ]);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speedPercent, loopMode, currentSong, autoPlaySound, playSoundNote, stopPlayback, getNoteX]);

  // L'OP-1 peut décaler son octave : les 24 touches matérielles sont repliées
  // sur les 24 touches visibles avant le jeu et la surbrillance.
  const playablePressedNotes = useMemo(
    () => pressedNotes.map(foldNoteToPlayableKeyboard),
    [pressedNotes]
  );

  // Combinaison des notes appuyées (Physique MIDI + Clavier Virtuel)
  const allActivePressedNotes = useMemo(() => {
    return new Set<number>([...playablePressedNotes, ...pressedKeyboardNotes].filter(isPlayableKeyboardNote));
  }, [playablePressedNotes, pressedKeyboardNotes]);

  // Évaluation des frappes joueur lors du changement des touches pressées
  useEffect(() => {
    if (!isPlaying) return;

    const currentPressed = allActivePressedNotes;
    const lastPressed = lastPressedStateRef.current;

    for (const note of currentPressed) {
      if (!lastPressed.has(note)) {
        processNoteHit(note);
      }
    }

    lastPressedStateRef.current = new Set(currentPressed);
  }, [allActivePressedNotes, isPlaying, processNoteHit]);

  // Notes visibles sur l'autoroute à l'instant T
  const visibleHighwayNotes = useMemo(() => {
    const travelTime = NOTE_TRAVEL_TIME_DEFAULT / (speedPercent / 100);
    const windowStart = currentTime - 0.4;
    const windowEnd = currentTime + travelTime;

    return currentSong.notes
      .map((n, idx) => {
        if (n.startSeconds < windowStart || n.startSeconds > windowEnd) return null;

        const timeUntilHit = n.startSeconds - currentTime;
        const progress = 1 - timeUntilHit / travelTime;
        const y = SCREEN_TOP + progress * (HIT_LINE - SCREEN_TOP);
        const x = getNoteX(n.note);
        const width = getNoteWidth(n.note);
        const height = Math.max(2.8, (n.durationSeconds / travelTime) * (HIT_LINE - SCREEN_TOP));
        const isPastHit = n.startSeconds < currentTime;

        return {
          ...n,
          key: `hw-note-${idx}-${n.note}-${n.startSeconds}`,
          x,
          y,
          width,
          height,
          isPastHit,
        };
      })
      .filter(Boolean) as Array<GameNote & { key: string; x: number; y: number; width: number; height: number; isPastHit: boolean }>;
  }, [currentSong.notes, currentTime, speedPercent, getNoteX, getNoteWidth]);

  // Filtrage du catalogue des exercices
  const filteredThemes = useMemo(() => {
    return GAME_SONG_THEMES.filter((theme) => {
      // Filtre catégorie
      if (selectedCategory !== "all" && theme.category !== selectedCategory) return false;
      // Filtre niveau
      if (selectedLevelFilter !== "all") {
        const filterDef = LEVEL_FILTERS.find((f) => f.id === selectedLevelFilter);
        if (filterDef?.min && filterDef?.max) {
          if (theme.level < filterDef.min || theme.level > filterDef.max) return false;
        }
      }
      // Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = theme.title.toLowerCase().includes(q);
        const matchDesc = theme.description.toLowerCase().includes(q);
        const matchEngine = theme.recommendedEngine.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEngine) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedLevelFilter, searchQuery]);

  // Export du profil en fichier JSON
  const handleExportProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `op1_profile_${profile.operatorName.replace(/\s+/g, "_").toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotice?.("Fiche de personnage et statistiques exportées en JSON avec succès !");
  };

  // Import du profil depuis un fichier JSON
  const handleImportProfile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as CharacterProfile;
        if (parsed && typeof parsed.level === "number" && parsed.stats) {
          setProfile(parsed);
          saveCharacterProfile(parsed);
          setNameInput(parsed.operatorName);
          onNotice?.(`Profil de "${parsed.operatorName}" (Niveau ${parsed.level}) importé avec succès !`);
        } else {
          onNotice?.("Fichier de profil invalide ou incompatible.");
        }
      } catch {
        onNotice?.("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetProfile = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la fiche de personnage et toutes vos statistiques ?")) {
      const def = createDefaultProfile();
      setProfile(def);
      saveCharacterProfile(def);
      setNameInput(def.operatorName);
      onNotice?.("Fiche de personnage réinitialisée à zéro.");
    }
  };

  const currentAvatar = OPERATOR_AVATARS.find((a) => a.id === profile.operatorAvatar) ?? OPERATOR_AVATARS[0];

  return (
    <div
      className="game-guitar-hero-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        background: "#080c10",
        color: "#f8fafc",
        fontFamily: "'JetBrains Mono', 'Segoe UI', monospace",
      }}
    >
      {/* ── EN-TÊTE DU HUB & NAVIGATION PRINCIPALE ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#111822",
          border: "1px solid #1e293b",
          borderRadius: "7px",
          padding: "5px 8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {/* Logo Arcade OP-1 */}
          <div style={{ fontSize: "12px", fontWeight: 900, color: "#00ED95", whiteSpace: "nowrap" }}>
            OP-1 · EXERCICES
          </div>

          {/* Onglets de Vue */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setActiveView("game")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                border: activeView === "game" ? "1px solid #00ED95" : "1px solid #334155",
                background: activeView === "game" ? "rgba(0, 237, 149, 0.2)" : "#131b24",
                color: activeView === "game" ? "#00ED95" : "#cbd5e1",
              }}
            >
              <span>🎮</span>
              <span>Jouer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("catalog")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                border: activeView === "catalog" ? "1px solid #a855f7" : "1px solid #334155",
                background: activeView === "catalog" ? "rgba(168, 85, 247, 0.2)" : "#131b24",
                color: activeView === "catalog" ? "#c084fc" : "#cbd5e1",
              }}
            >
              <span>📚</span>
              <span>Exercices</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                border: activeView === "profile" ? "1px solid #38bdf8" : "1px solid #334155",
                background: activeView === "profile" ? "rgba(56, 189, 248, 0.2)" : "#131b24",
                color: activeView === "profile" ? "#38bdf8" : "#cbd5e1",
              }}
            >
              <span>👤</span>
              <span>Profil</span>
              <span
                style={{
                  background: "#38bdf8",
                  color: "#0f172a",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  fontWeight: 900,
                }}
              >
                Niv. {profile.level}
              </span>
            </button>
          </div>
        </div>

        {/* Bouton Fermer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#1e293b",
              border: "1px solid #475569",
              color: "#f8fafc",
              padding: "4px 8px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VUE 1 : SESSION DE JEU (HIGHWAY OLED FOND NOIR VECTORIEL)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "game" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          
          {/* Bandeau d'état du morceau & transport */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "7px",
              padding: "5px 8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <span style={{ fontSize: "15px" }}>{currentSong.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "11px", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentSong.title}</strong>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 800,
                      background:
                        currentSong.category === "drum"
                          ? "#FF3A5D"
                          : currentSong.category === "chord"
                          ? "#fbbf24"
                          : currentSong.category === "arcade"
                          ? "#a855f7"
                          : "#38bdf8",
                      color: "#0f172a",
                    }}
                  >
                    NIV. {currentSong.level}
                  </span>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    {currentSong.bpm} BPM · {currentSong.notes.length} NOTES
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons de contrôle de lecture */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={startPlayback}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#00ED95",
                    color: "#05160e",
                    border: "none",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontWeight: 900,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 0 14px rgba(0, 237, 149, 0.4)",
                  }}
                >
                  <span>▶</span> JOUER
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopPlayback(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#FF3A5D",
                    color: "#ffffff",
                    border: "none",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontWeight: 900,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <span>■</span> STOP
                </button>
              )}

              {/* Mode Visuel Space Invaders vs Classique */}
              <button
                type="button"
                onClick={() => setVisualMode((prev) => (prev === "invaders" ? "classic" : "invaders"))}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: visualMode === "invaders" ? "1px solid #a855f7" : "1px solid #334155",
                  background: visualMode === "invaders" ? "rgba(168, 85, 247, 0.2)" : "#0f172a",
                  color: visualMode === "invaders" ? "#c084fc" : "#94a3b8",
                }}
              >
                {visualMode === "invaders" ? "👾" : "🎹"}
              </button>

              {/* Vitesse */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#0f172a",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  fontSize: "10px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>VIT.</span>
                <select
                  value={speedPercent}
                  onChange={(e) => setSpeedPercent(Number(e.target.value))}
                  style={{
                    background: "#1e293b",
                    color: "#38bdf8",
                    border: "none",
                    borderRadius: "4px",
                    padding: "2px 4px",
                    fontWeight: 700,
                  }}
                >
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                  <option value={125}>125%</option>
                  <option value={150}>150%</option>
                </select>
              </div>

              {/* Boucle */}
              <button
                type="button"
                onClick={() => setLoopMode(!loopMode)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: loopMode ? "1px solid #00ED95" : "1px solid #334155",
                  background: loopMode ? "rgba(0, 237, 149, 0.15)" : "#0f172a",
                  color: loopMode ? "#00ED95" : "#94a3b8",
                }}
              >
                🔁 {loopMode ? "ON" : "OFF"}
              </button>

              {/* Son Guide */}
              <button
                type="button"
                onClick={() => setAutoPlaySound(!autoPlaySound)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: autoPlaySound ? "1px solid #38bdf8" : "1px solid #334155",
                  background: autoPlaySound ? "rgba(56, 189, 248, 0.15)" : "#0f172a",
                  color: autoPlaySound ? "#38bdf8" : "#94a3b8",
                }}
              >
                🔊 {autoPlaySound ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Statistiques utiles pendant la partie. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "4px",
              background: "#0c1017",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "4px 8px",
            }}
          >
            {/* 1. Score & Multiplicateur */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Score</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <strong style={{ fontSize: "14px", color: "#00ED95" }}>{score.toLocaleString()}</strong>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    background: multiplier > 1 ? "#FF3A5D" : "#1e293b",
                    color: "#ffffff",
                  }}
                >
                  x{multiplier}
                </span>
              </div>
            </div>

            {/* 2. Combo & Max Combo */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Combo</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <strong style={{ fontSize: "14px", color: "#38bdf8" }}>{comboStreak}</strong>
                <span style={{ fontSize: "10px", color: "#64748b" }}>Max: {maxCombo}</span>
              </div>
            </div>

            {/* 3. Précision */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Précision</span>
              <div>
                <strong style={{ fontSize: "14px", color: "#fbbf24" }}>
                  {sessionStats.perfect + sessionStats.great + sessionStats.good + sessionStats.miss === 0
                    ? "100%"
                    : `${Math.round(
                        ((sessionStats.perfect + sessionStats.great + sessionStats.good) /
                          Math.max(1, sessionStats.perfect + sessionStats.great + sessionStats.good + sessionStats.miss)) *
                          100
                      )}%`}
                </strong>
              </div>
            </div>

            {/* 4. Jugements détaillés */}
            <div style={{ display: "flex", flexDirection: "column", fontSize: "10px" }}>
              <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Frappes</span>
              <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                <span style={{ color: "#00ED95" }}>P:{sessionStats.perfect}</span>
                <span style={{ color: "#38bdf8" }}>G:{sessionStats.great}</span>
                <span style={{ color: "#f59e0b" }}>Ok:{sessionStats.good}</span>
                <span style={{ color: "#FF3A5D" }}>M:{sessionStats.miss}</span>
              </div>
            </div>

          </div>

          <div
            className="op1-training-stage"
            data-key-columns="24"
            style={{ width: "min(100%, 1100px)", margin: "0 auto" }}
          >
          {/* ══════════════════════════════════════════════════════════════════
              ÉCRAN OLED SIMULATEUR : FOND NOIR VECTORIEL AVEC POINTILLÉS BLANCS
             ══════════════════════════════════════════════════════════════════ */}
          <div
            className="op1-highway-screen-oled"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "100 / 32",
              background: "#000000",
              borderRadius: "8px 8px 0 0",
              border: "1px solid #1e293b",
              borderBottom: "none",
              overflow: "hidden",
              boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.95)",
            }}
          >
            <svg
              viewBox={`${bounds.minX} ${SCREEN_TOP} ${bounds.width} ${SCREEN_BOTTOM - SCREEN_TOP}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <defs>
                <linearGradient id="melodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="chordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="drumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3A5D" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
                <linearGradient id="arcadeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7e22ce" />
                </linearGradient>
              </defs>

              {/* Fond noir pur */}
              <rect x={bounds.minX} y={SCREEN_TOP} width={bounds.width} height={SCREEN_BOTTOM - SCREEN_TOP} fill="#000000" />

              {/* ── COLONNES VERTICALES EN POINTILLÉS BLANCS NETS POUR TOUTES LES TOUCHES ── */}
              {whiteBlocks.map((b, i) => {
                const centerX = b.col + b.w / 2;
                return (
                  <line
                    key={`grid-line-white-${i}`}
                    x1={centerX}
                    y1={SCREEN_TOP}
                    x2={centerX}
                    y2={SCREEN_BOTTOM}
                    stroke="#ffffff"
                    strokeWidth={0.07}
                    strokeDasharray="2.5 3.5"
                    opacity={0.3}
                  />
                );
              })}

              {blackBlocks.map((b, i) => {
                const centerX = b.col + b.w / 2;
                return (
                  <line
                    key={`grid-line-black-${i}`}
                    x1={centerX}
                    y1={SCREEN_TOP}
                    x2={centerX}
                    y2={SCREEN_BOTTOM}
                    stroke="#ffffff"
                    strokeWidth={0.06}
                    strokeDasharray="1.5 3"
                    opacity={0.2}
                  />
                );
              })}

              {/* Lignes de temps / pulsations horizontales subtiles */}
              {[20, 40, 60].map((y) => (
                <line
                  key={`beat-line-${y}`}
                  x1={bounds.minX}
                  y1={y}
                  x2={bounds.minX + bounds.width}
                  y2={y}
                  stroke="#ffffff"
                  strokeWidth={0.04}
                  strokeDasharray="1 4"
                  opacity={0.12}
                />
              ))}

              {/* ── LIGNE DE JEU / HIT LINE VECTORIELLE ── */}
              <line
                x1={bounds.minX}
                y1={HIT_LINE}
                x2={bounds.minX + bounds.width}
                y2={HIT_LINE}
                stroke="#FF3A5D"
                strokeWidth={0.8}
                strokeDasharray="2 1.5"
                opacity={0.9}
              />

              {/* Zone d'impact néon */}
              <rect
                x={bounds.minX}
                y={HIT_LINE - 2}
                width={bounds.width}
                height={4}
                fill="#FF3A5D"
                opacity={0.1}
              />

              {/* Viseurs d'impact circulaires sur chaque colonne de touche sur la Hit Line */}
              {whiteBlocks.map((b, i) => (
                <circle
                  key={`target-ring-w-${i}`}
                  cx={b.col + b.w / 2}
                  cy={HIT_LINE}
                  r={0.45}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={0.08}
                  opacity={0.5}
                />
              ))}

              {/* ── RENDU DES NOTES OU DES SPACE INVADERS SELON LE MODE CHOISI ── */}
              {visibleHighwayNotes.map((note) => {
                if (visualMode === "invaders") {
                  return (
                    <InvaderSprite
                      key={note.key}
                      note={note}
                      x={note.x}
                      y={note.y}
                      width={note.width}
                      height={note.height}
                      level={currentSong.level}
                      category={currentSong.category}
                      isPastHit={note.isPastHit}
                      time={currentTime}
                    />
                  );
                }

                // Mode classique
                let noteFill = "url(#melodyGrad)";
                let strokeColor = "#38bdf8";

                if (currentSong.category === "drum") {
                  noteFill = "url(#drumGrad)";
                  strokeColor = "#FF3A5D";
                } else if (currentSong.category === "chord") {
                  noteFill = "url(#chordGrad)";
                  strokeColor = "#fbbf24";
                } else if (currentSong.category === "arcade") {
                  noteFill = "url(#arcadeGrad)";
                  strokeColor = "#a855f7";
                }

                return (
                  <g key={note.key} transform={`translate(0, ${note.y - note.height})`}>
                    {/* Pavé de note géométrique */}
                    <rect
                      x={note.x - note.width / 2}
                      y={0}
                      width={note.width}
                      height={note.height}
                      rx={0.3}
                      fill={noteFill}
                      stroke={strokeColor}
                      strokeWidth={0.12}
                      opacity={note.isPastHit ? 0.3 : 0.95}
                    />

                    {/* Capsule blanche d'impact sur la tête de la note */}
                    <rect
                      x={note.x - note.width / 2}
                      y={note.height - 2.0}
                      width={note.width}
                      height={2.0}
                      rx={0.25}
                      fill="#ffffff"
                      opacity={0.95}
                    />

                    {/* Libellé de note / son de batterie */}
                    {note.label && (
                      <text
                        x={note.x}
                        y={note.height - 1.0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={0.85}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight={900}
                        fill="#000000"
                      >
                        {note.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ÉTINCELLES & PARTICULES NÉON DE FRAPPE */}
              {particles.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={p.size}
                  fill={p.color}
                  opacity={p.alpha}
                />
              ))}

              {/* Halos lumineux lors des frappes actives */}
              {Array.from(allActivePressedNotes).map((n) => {
                const x = getNoteX(n);
                const w = getNoteWidth(n);
                return (
                  <g key={`hit-light-${n}`}>
                    <circle cx={x} cy={HIT_LINE} r={w * 1.3} fill="#00ED95" opacity={0.65} />
                    <line x1={x} y1={HIT_LINE - 6} x2={x} y2={HIT_LINE + 6} stroke="#ffffff" strokeWidth={0.4} />
                  </g>
                );
              })}
            </svg>

            {/* ── COMPTEUR CENTRAL GÉANT INTERACTIF (3, 2, 1, GO!) ── */}
            {countdownStage !== null && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0, 0, 0, 0.78)",
                  backdropFilter: "blur(3px)",
                  zIndex: 50,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "160px",
                    height: "160px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Anneau extérieur rotatif néon */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `3px dashed ${
                        countdownStage === "GO"
                          ? "#FF3A5D"
                          : countdownStage === 1
                          ? "#00ED95"
                          : countdownStage === 2
                          ? "#38bdf8"
                          : "#fbbf24"
                      }`,
                      boxShadow: `0 0 30px ${
                        countdownStage === "GO"
                          ? "rgba(255, 58, 93, 0.7)"
                          : countdownStage === 1
                          ? "rgba(0, 237, 149, 0.7)"
                          : countdownStage === 2
                          ? "rgba(56, 189, 248, 0.7)"
                          : "rgba(251, 191, 36, 0.7)"
                      }`,
                    }}
                  />
                  {/* Disque intérieur avec chiffre */}
                  <div
                    style={{
                      width: "134px",
                      height: "134px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, #0f172a 0%, #000000 100%)",
                      border: "2px solid #ffffff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: countdownStage === "GO" ? "40px" : "60px",
                        fontWeight: 900,
                        fontFamily: "'JetBrains Mono', monospace",
                        color:
                          countdownStage === "GO"
                            ? "#FF3A5D"
                            : countdownStage === 1
                            ? "#00ED95"
                            : countdownStage === 2
                            ? "#38bdf8"
                            : "#fbbf24",
                        textShadow: "0 0 24px currentColor",
                        lineHeight: 1,
                      }}
                    >
                      {countdownStage}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                        color: "#ffffff",
                        marginTop: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {countdownStage === "GO"
                        ? "C'EST PARTI !"
                        : countdownStage === 1
                        ? "POSE LES DOIGTS !"
                        : countdownStage === 2
                        ? "ATTENTION..."
                        : "PRÊT ?"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Popups de feedback flottants (PERFECT, GREAT, MISS) */}
            {feedbacks.map((f) => {
              const leftPercent = ((f.x - bounds.minX) / bounds.width) * 100;
              const color =
                f.judgment === "PERFECT"
                  ? "#00ED95"
                  : f.judgment === "GREAT"
                  ? "#38bdf8"
                  : f.judgment === "GOOD"
                  ? "#fbbf24"
                  : "#FF3A5D";

              return (
                <div
                  key={f.id}
                  style={{
                    position: "absolute",
                    left: `${leftPercent}%`,
                    top: "72%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 900,
                      color,
                      textShadow: `0 0 8px ${color}`,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {f.judgment}
                  </span>
                  {f.points > 0 && (
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#ffffff" }}>
                      +{f.points}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Le clavier partage cette boîte avec l'écran : même largeur, même repère. */}
          <div
            style={{
              background: "#080c10",
              borderRadius: "0 0 8px 8px",
              border: "none",
              padding: 0,
            }}
          >
            <GameGuitarHeroKeyboard
              pressedNotes={playablePressedNotes}
              targetNotes={activeTargetNotes}
              onPressedChange={handleKeyboardPressedChange}
              onSendMidi={onSendMidi}
            />
          </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VUE 2 : CATALOGUE COMPLET DE 40 EXERCICES CLASSÉS PAR NIVEAUX (1-10)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "catalog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Barre de contrôle du catalogue (Filtres Catégories, Niveaux, Recherche, Import) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#111822", border: "1px solid #1e293b", borderRadius: "10px", padding: "14px" }}>
            
            {/* 1. Onglets Catégories */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {Object.entries(CATEGORY_TABS).map(([catKey, cat]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: selectedCategory === catKey ? `1px solid ${cat.color}` : "1px solid #1e293b",
                    background: selectedCategory === catKey ? "rgba(255, 255, 255, 0.12)" : "#0c1017",
                    color: selectedCategory === catKey ? cat.color : "#94a3b8",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}

              {/* Bouton Import Fichier MIDI */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid #00ED95",
                  background: "rgba(0, 237, 149, 0.15)",
                  color: "#00ED95",
                  marginLeft: "auto",
                }}
              >
                <span>📂</span>
                <span>Importer un fichier MIDI (.mid)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mid,.midi"
                style={{ display: "none" }}
                onChange={(e) => handleImportMidi(e.target.files?.[0])}
              />
            </div>

            {/* 2. Filtres par Niveau & Recherche textuelle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid #1e293b" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Filtrer par niveau :</span>
                {LEVEL_FILTERS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevelFilter(lvl.id)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: selectedLevelFilter === lvl.id ? "1px solid #38bdf8" : "1px solid #1e293b",
                      background: selectedLevelFilter === lvl.id ? "rgba(56, 189, 248, 0.2)" : "#0c1017",
                      color: selectedLevelFilter === lvl.id ? "#38bdf8" : "#94a3b8",
                    }}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Champ de recherche */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher par titre, style, moteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "#0c1017",
                    border: "1px solid #334155",
                    color: "#ffffff",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    width: "220px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Grille des 40 Morceaux & Exercices */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "12px",
            }}
          >
            {filteredThemes.map((theme) => {
              const isSelected = selectedThemeId === theme.id && !customMidi;
              const songBest = profile.stats.bestScoresBySong?.[theme.id];

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "14px",
                    borderRadius: "10px",
                    border: isSelected ? "1px solid #00ED95" : "1px solid #1e293b",
                    background: isSelected ? "rgba(0, 237, 149, 0.08)" : "#111822",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    {/* Badge Niveau + Catégorie + Meilleur Rang */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "18px" }}>{theme.icon}</span>
                        <span
                          style={{
                            fontSize: "9px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 900,
                            background:
                              theme.level <= 2
                                ? "#00ED95"
                                : theme.level <= 4
                                ? "#38bdf8"
                                : theme.level <= 6
                                ? "#fbbf24"
                                : theme.level <= 8
                                ? "#a855f7"
                                : "#FF3A5D",
                            color: "#0f172a",
                          }}
                        >
                          NIV. {theme.level}
                        </span>
                        <span style={{ fontSize: "10px", color: "#64748b" }}>{theme.difficulty}</span>
                      </div>

                      {/* Record du joueur si complété */}
                      {songBest ? (
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 900,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(0, 237, 149, 0.15)",
                            border: "1px solid rgba(0, 237, 149, 0.4)",
                            color: "#00ED95",
                          }}
                        >
                          Rang {songBest.bestRank} ({songBest.bestAccuracy}%)
                        </span>
                      ) : (
                        <span style={{ fontSize: "9px", color: "#475569" }}>Nouveau</span>
                      )}
                    </div>

                    <strong style={{ fontSize: "12.5px", color: isSelected ? "#00ED95" : "#f8fafc", display: "block" }}>
                      {theme.title}
                    </strong>
                    <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", lineHeight: "1.4" }}>
                      {theme.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "12px",
                      paddingTop: "8px",
                      borderTop: "1px solid #1e293b",
                      fontSize: "9.5px",
                      color: "#64748b",
                    }}
                  >
                    <span>{theme.notes.length} notes · {theme.durationSeconds}s · {theme.bpm} BPM</span>
                    <span style={{ color: "#38bdf8" }}>Moteur : {theme.recommendedEngine}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VUE 3 : FICHE DE PERSONNAGE UNIFIÉE & ÉTAT DE L'ATELIER / STUDIO
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* BANNIÈRE DE SYNCHRONISATION HUB & FICHE PERSONNAGE */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🧬</span>
              <div>
                <strong style={{ fontSize: "12.5px", color: "#f8fafc", display: "block" }}>
                  Fiche de Personnage & Atelier Studio
                </strong>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                  Progression RPG unifiée, avatar d'atelier et synchronisation avec le Hub Studio.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const res = syncWithHubProfile(profile);
                setProfile(res.updated);
                saveCharacterProfile(res.updated);
                setNameInput(res.updated.operatorName);
                if (res.synced) {
                  onNotice?.(`Profil synchronisé avec la fiche de personnage du Hub Studio (${res.updated.operatorName}) !`);
                } else {
                  onNotice?.("Profil OP-1 déjà à jour avec le Hub Studio.");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid #38bdf8",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
              }}
            >
              <span>🔄</span>
              <span>Synchroniser avec le Hub Studio</span>
            </button>
          </div>

          {/* CARTE PRINCIPALE : IDENTITÉ OPÉRATEUR & ÉTAT DU STUDIO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "16px",
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            {/* Avatar & Identité de l'Opérateur */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#0c1017",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Avatar cliquable pour changer */}
              <div
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF3A5D, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "38px",
                  boxShadow: "0 0 24px rgba(255, 58, 93, 0.3)",
                  marginBottom: "12px",
                  cursor: "pointer",
                  border: "2px solid #38bdf8",
                }}
                title="Cliquer pour changer d'avatar"
              >
                {currentAvatar.icon}
              </div>

              {/* Menu de sélection d'avatar */}
              {avatarMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "90px",
                    background: "#1e293b",
                    border: "1px solid #38bdf8",
                    borderRadius: "8px",
                    padding: "8px",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "6px",
                    zIndex: 50,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                  }}
                >
                  {OPERATOR_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, operatorAvatar: av.id };
                        setProfile(updated);
                        saveCharacterProfile(updated);
                        setAvatarMenuOpen(false);
                      }}
                      style={{
                        background: profile.operatorAvatar === av.id ? "rgba(56, 189, 248, 0.3)" : "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        fontSize: "20px",
                        padding: "6px",
                        cursor: "pointer",
                      }}
                    >
                      {av.icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Nom modifiable */}
              {!editingName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "14px", color: "#f8fafc" }}>{profile.operatorName}</strong>
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "11px" }}
                    title="Modifier le nom"
                  >
                    ✏️
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #38bdf8",
                      color: "#ffffff",
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      width: "130px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, operatorName: nameInput || "Opérateur OP-1" };
                      setProfile(updated);
                      saveCharacterProfile(updated);
                      setEditingName(false);
                    }}
                    style={{ background: "#00ED95", border: "none", borderRadius: "4px", padding: "2px 6px", cursor: "pointer" }}
                  >
                    ✓
                  </button>
                </div>
              )}

              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, marginTop: "2px" }}>
                {profile.title}
              </span>

              <div
                style={{
                  marginTop: "10px",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "#38bdf8",
                }}
              >
                NIVEAU {profile.level} / 50
              </div>
            </div>

            {/* Jauges d'XP et Maîtrise des 4 Disciplines */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Progression vers le Niveau {profile.level + 1}</span>
                  <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700 }}>
                    {profile.currentXp} / {profile.xpForNextLevel} XP
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#0c1017", borderRadius: "4px", overflow: "hidden", border: "1px solid #1e293b" }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((profile.currentXp / Math.max(1, profile.xpForNextLevel)) * 100))}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #38bdf8, #a855f7)",
                    }}
                  />
                </div>
              </div>

              {/* Jauges par discipline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                <div style={{ background: "#0c1017", padding: "8px 10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ color: "#38bdf8" }}>🎹 Mélodies & Leads</span>
                    <strong>{profile.stats.melodyXp} XP</strong>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "#1e293b", borderRadius: "2px" }}>
                    <div style={{ width: `${Math.min(100, (profile.stats.melodyXp / 2500) * 100)}%`, height: "100%", background: "#38bdf8" }} />
                  </div>
                </div>

                <div style={{ background: "#0c1017", padding: "8px 10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ color: "#fbbf24" }}>🎼 Accords & Harmonie</span>
                    <strong>{profile.stats.chordXp} XP</strong>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "#1e293b", borderRadius: "2px" }}>
                    <div style={{ width: `${Math.min(100, (profile.stats.chordXp / 2500) * 100)}%`, height: "100%", background: "#fbbf24" }} />
                  </div>
                </div>

                <div style={{ background: "#0c1017", padding: "8px 10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ color: "#FF3A5D" }}>🥁 Finger Drumming</span>
                    <strong>{profile.stats.drumXp} XP</strong>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "#1e293b", borderRadius: "2px" }}>
                    <div style={{ width: `${Math.min(100, (profile.stats.drumXp / 2500) * 100)}%`, height: "100%", background: "#FF3A5D" }} />
                  </div>
                </div>

                <div style={{ background: "#0c1017", padding: "8px 10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ color: "#a855f7" }}>👾 Arcade & Virtuosité</span>
                    <strong>{profile.stats.arcadeXp} XP</strong>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "#1e293b", borderRadius: "2px" }}>
                    <div style={{ width: `${Math.min(100, (profile.stats.arcadeXp / 2500) * 100)}%`, height: "100%", background: "#a855f7" }} />
                  </div>
                </div>
              </div>

              {/* État matériel Studio / Machine & Statistiques en ligne */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9.5px", color: "#64748b", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #1e293b" }}>
                <span>Machine : <strong style={{ color: "#f8fafc" }}>OP-1 Classic & Field (v246)</strong></span>
                <span>Sessions : <strong style={{ color: "#f8fafc" }}>{profile.stats.sessionsCount}</strong></span>
                <span>Temps : <strong style={{ color: "#f8fafc" }}>{Math.round(profile.stats.totalPlayTimeSeconds / 60)} min</strong></span>
                <span>Score cumulé : <strong style={{ color: "#00ED95" }}>{profile.stats.totalScore.toLocaleString()} pts</strong></span>
              </div>
            </div>
          </div>

          {/* TABLEAU DES STATISTIQUES GLOBALES DÉTAILLÉES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <div style={{ background: "#0c1017", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
              <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Précision Globale</span>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#00ED95", marginTop: "2px" }}>
                {profile.stats.totalNotesHit + profile.stats.missHits === 0
                  ? "100%"
                  : `${Math.round((profile.stats.totalNotesHit / (profile.stats.totalNotesHit + profile.stats.missHits)) * 100)}%`}
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{profile.stats.totalNotesHit} notes réussies</div>
            </div>

            <div style={{ background: "#0c1017", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
              <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Combo Record</span>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
                {profile.stats.highestCombo}
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>Notes consécutives</div>
            </div>

            <div style={{ background: "#0c1017", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
              <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Jugements Réussis</span>
              <div style={{ fontSize: "11px", color: "#e2e8f0", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div><span style={{ color: "#00ED95" }}>Perfect :</span> {profile.stats.perfectHits}</div>
                <div><span style={{ color: "#38bdf8" }}>Great :</span> {profile.stats.greatHits} · <span style={{ color: "#f59e0b" }}>Good :</span> {profile.stats.goodHits}</div>
              </div>
            </div>

            <div style={{ background: "#0c1017", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b" }}>
              <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Exercices Complétés</span>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                {Object.keys(profile.stats.bestScoresBySong || {}).length} / 40
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>Dans la banque d'exercices</div>
            </div>
          </div>

          {/* GALERIE DES BADGES & TROPHÉES RPG */}
          <div
            style={{
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong style={{ fontSize: "13px", color: "#f8fafc" }}>
                🏆 Badges & Succès Débloqués ({profile.achievements.filter((a) => a.unlocked).length} / {profile.achievements.length})
              </strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
              {profile.achievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    padding: "10px 0",
                    borderRadius: "8px",
                    border: ach.unlocked ? "1px solid rgba(0, 237, 149, 0.4)" : "1px solid #1e293b",
                    background: ach.unlocked ? "rgba(0, 237, 149, 0.08)" : "#0c1017",
                    opacity: ach.unlocked ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: "24px", filter: ach.unlocked ? "none" : "grayscale(100%)" }}>{ach.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: ach.unlocked ? "#00ED95" : "#94a3b8" }}>
                      {ach.title}
                    </div>
                    <div style={{ fontSize: "9.5px", color: "#64748b", marginTop: "2px" }}>{ach.description}</div>
                    {!ach.unlocked && (
                      <div style={{ width: "100%", height: "3px", background: "#1e293b", borderRadius: "2px", marginTop: "4px" }}>
                        <div style={{ width: `${ach.progressPercent}%`, height: "100%", background: "#38bdf8" }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HISTORIQUE DES SESSIONS RÉCENTES */}
          <div
            style={{
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <strong style={{ fontSize: "13px", color: "#f8fafc", display: "block", marginBottom: "10px" }}>
              📜 Historique des Dernières Sessions d'Entraînement
            </strong>

            {profile.history.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", padding: "16px" }}>
                Aucune session enregistrée pour le moment. Lancez un exercice dans l'onglet Banque d'Exercices !
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                {profile.history.slice(0, 15).map((h, i) => (
                  <div
                    key={`hist-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#0c1017",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #1e293b",
                      fontSize: "11px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#f8fafc" }}>{h.songTitle}</strong>
                      <span style={{ fontSize: "9px", color: "#64748b", marginLeft: "8px" }}>
                        {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>Rang {h.rank} ({h.accuracy}%)</span>
                      <span style={{ color: "#38bdf8" }}>Combo: {h.maxCombo}</span>
                      <span style={{ color: "#00ED95", fontWeight: 700 }}>+{h.xpEarned} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GESTION & SAUVEGARDE DE LA FICHE DE PERSONNAGE */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#111822",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "12px 16px",
            }}
          >
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              💾 Sauvegarde locale automatique (Persistée sur cet appareil)
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleExportProfile}
                style={{
                  background: "#1e293b",
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📥 Exporter Profil (JSON)
              </button>

              <button
                type="button"
                onClick={() => profileImportInputRef.current?.click()}
                style={{
                  background: "#1e293b",
                  border: "1px solid #00ED95",
                  color: "#00ED95",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📤 Importer Profil
              </button>
              <input
                ref={profileImportInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={(e) => handleImportProfile(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={handleResetProfile}
                style={{
                  background: "#1e293b",
                  border: "1px solid #FF3A5D",
                  color: "#FF3A5D",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚠️ Réinitialiser
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── MODALE DE DÉBRIEFING DE FIN DE SESSION & COMPARATEUR MIDI ── */}
      {showDebriefModal && lastDebriefData && (
        <MidiPerformanceDebriefModal
          isOpen={showDebriefModal}
          song={currentSong}
          score={lastDebriefData.score}
          accuracy={lastDebriefData.accuracy}
          rank={lastDebriefData.rank}
          maxCombo={lastDebriefData.maxCombo}
          sessionStats={lastDebriefData.sessionStats}
          recordedEvents={lastDebriefData.recordedEvents}
          xpEarned={lastDebriefData.xpEarned}
          newLevel={lastDebriefData.newLevel}
          newAchievements={lastDebriefData.newAchievements}
          profile={profile}
          onReplay={() => {
            setShowDebriefModal(false);
            launchCountdown();
          }}
          onViewProfile={() => {
            setShowDebriefModal(false);
            setActiveView("profile");
          }}
          onBrowseCatalog={() => {
            setShowDebriefModal(false);
            setActiveView("catalog");
          }}
          onClose={() => setShowDebriefModal(false)}
        />
      )}
    </div>
  );
}
