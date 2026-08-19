"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";

// OP-1 Native Screen Specs: 320 x 160 Pixels
const OP1_WIDTH = 320;
const OP1_HEIGHT = 160;

// Official OP-1 OLED Color Palette
const OP1_PALETTE = [
  { name: "OLED Dark", hex: "#0d0f18", desc: "Fond / Noir OLED" },
  { name: "Neon Green", hex: "#00ed95", desc: "Knob 2 / Vert Synth" },
  { name: "Electric Blue", hex: "#4aa7ff", desc: "Knob 1 / Bleu Pitch" },
  { name: "Crimson Red", hex: "#ff3a5d", desc: "Knob 4 / Rouge FX" },
  { name: "Cream White", hex: "#f4f5ef", desc: "Knob 3 / Blanc Level" },
  { name: "Soft Violet", hex: "#87839c", desc: "Gris / Grille" },
  { name: "Acid Yellow", hex: "#d9ff43", desc: "Jaune / Accent" },
  { name: "Hot Orange", hex: "#ff5a1f", desc: "Orange / Sélecteur" },
];

// OP-1 Mini Keyboard Notes (2 Octaves)
const OP1_KEYS = [
  { note: "C", isBlack: false },
  { note: "C#", isBlack: true },
  { note: "D", isBlack: false },
  { note: "D#", isBlack: true },
  { note: "E", isBlack: false },
  { note: "F", isBlack: false },
  { note: "F#", isBlack: true },
  { note: "G", isBlack: false },
  { note: "G#", isBlack: true },
  { note: "A", isBlack: false },
  { note: "A#", isBlack: true },
  { note: "B", isBlack: false },
  { note: "C2", isBlack: false },
  { note: "C#2", isBlack: true },
  { note: "D2", isBlack: false },
  { note: "D#2", isBlack: true },
  { note: "E2", isBlack: false },
  { note: "F2", isBlack: false },
  { note: "F#2", isBlack: true },
  { note: "G2", isBlack: false },
  { note: "G#2", isBlack: true },
  { note: "A2", isBlack: false },
  { note: "A#2", isBlack: true },
  { note: "B2", isBlack: false },
];

export interface EncoderState {
  name: string;
  val: number;
  min: number;
  max: number;
  unit: string;
}

export interface ScreenEncoders {
  k1: EncoderState;
  k2: EncoderState;
  k3: EncoderState;
  k4: EncoderState;
}

export interface FirmwareAsset {
  file: string;
  name: string;
  category: string;
  note: string;
  frameCount: number;
  encoders: ScreenEncoders;
}

const DEFAULT_ENCODERS: Record<string, ScreenEncoders> = {
  "fm.svg": {
    k1: { name: "Fréquence Porteur", val: 440, min: 50, max: 2000, unit: "Hz" },
    k2: { name: "Index FM Mod", val: 65, min: 0, max: 100, unit: "%" },
    k3: { name: "Attaque/Déclin", val: 40, min: 0, max: 100, unit: "%" },
    k4: { name: "Niveau Out", val: 80, min: 0, max: 100, unit: "%" },
  },
  "tape.svg": {
    k1: { name: "Vitesse Pitch", val: 100, min: 25, max: 200, unit: "%" },
    k2: { name: "Piste Active", val: 1, min: 1, max: 4, unit: "#" },
    k3: { name: "Tête de Lecture", val: 32, min: 0, max: 100, unit: "bar" },
    k4: { name: "Master Level", val: 90, min: 0, max: 100, unit: "%" },
  },
  "mixer.svg": {
    k1: { name: "Piste 1 Vol", val: 85, min: 0, max: 100, unit: "%" },
    k2: { name: "Piste 2 Vol", val: 70, min: 0, max: 100, unit: "%" },
    k3: { name: "Piste 3 Vol", val: 90, min: 0, max: 100, unit: "%" },
    k4: { name: "Piste 4 Vol", val: 60, min: 0, max: 100, unit: "%" },
  },
  "delay.svg": {
    k1: { name: "Délai MS", val: 250, min: 10, max: 1000, unit: "ms" },
    k2: { name: "Feedback", val: 55, min: 0, max: 99, unit: "%" },
    k3: { name: "Filtre Tone", val: 75, min: 0, max: 100, unit: "%" },
    k4: { name: "Mix Dry/Wet", val: 40, min: 0, max: 100, unit: "%" },
  },
  "tombola.svg": {
    k1: { name: "Billes Cage", val: 8, min: 1, max: 20, unit: "pts" },
    k2: { name: "Gravité RPM", val: 60, min: 10, max: 100, unit: "rpm" },
    k3: { name: "Taille Cage", val: 75, min: 20, max: 100, unit: "%" },
    k4: { name: "Rebond", val: 85, min: 0, max: 100, unit: "%" },
  },
  "eq.svg": {
    k1: { name: "Basses Low", val: 2, min: -12, max: 12, unit: "dB" },
    k2: { name: "Médiums Mid", val: -1, min: -12, max: 12, unit: "dB" },
    k3: { name: "Aigus High", val: 4, min: -12, max: 12, unit: "dB" },
    k4: { name: "Gain Master", val: 0, min: -12, max: 12, unit: "dB" },
  },
};

const FIRMWARE_ASSETS: FirmwareAsset[] = [
  { file: "tape.svg", name: "Tape 4-Track (Thème Principal)", category: "tape", note: "Thème principal par défaut du magnétophone", frameCount: 4, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "mixer.svg", name: "Mixer 4-Channel", category: "tape", note: "Table de mixage 4 canaux Tape", frameCount: 4, encoders: DEFAULT_ENCODERS["mixer.svg"] },
  { file: "tapeconfig.svg", name: "Tape Config", category: "tape", note: "Configuration bande et vitesse", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "fm.svg", name: "FM Synth Engine", category: "moteurs_sonores", note: "Moteur FM 4 opérateurs", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "dsynth.svg", name: "DSynth Engine", category: "moteurs_sonores", note: "Synthé numérique polyphonique", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "cls.svg", name: "Cluster Synth", category: "moteurs_sonores", note: "Moteur cluster d'ondes", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "id.svg", name: "DNA Synth Engine", category: "moteurs_sonores", note: "Synthèse DNA génétique", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "pd.svg", name: "Phase Synth Engine", category: "moteurs_sonores", note: "Phase Distortion synth", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "pls.svg", name: "Pulse Synth", category: "moteurs_sonores", note: "Synthèse d'impulsion Pulse", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "st.svg", name: "String Synth", category: "moteurs_sonores", note: "Modélisation de cordes String", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "slump.svg", name: "Voltage Synth", category: "moteurs_sonores", note: "Moteur sous tension Voltage", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "iter.svg", name: "Iter Synth Engine", category: "moteurs_sonores", note: "Synthé itératif Iter", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "t10.svg", name: "Digital Synth T10", category: "moteurs_sonores", note: "Synthé Digital T10", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "dbox.svg", name: "DBox Drum Synth", category: "moteurs_sonores", note: "Synthé batterie DBox", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "drum2.svg", name: "Drum Sampler", category: "moteurs_sonores", note: "Éditeur kit Drum Sampler", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "sampler.svg", name: "Synth Sampler", category: "moteurs_sonores", note: "Échantillonneur chromatique", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "delay.svg", name: "Delay FX", category: "effets", note: "Effet délai analogique / numérique", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "bode.svg", name: "CWO / Bode Frequency", category: "effets", note: "Décalage de fréquence CWO", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "ftwo.svg", name: "Nitro Filter FX", category: "effets", note: "Filtre résonant Nitro", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "grid.svg", name: "Grid Delay FX", category: "effets", note: "Délai matrice spatiale Grid", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "mllp.svg", name: "Punch FX", category: "effets", note: "Processeur dynamique Punch", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "ptch.svg", name: "Phone FX", category: "effets", note: "Simulateur ligne Phone", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "rymd.svg", name: "Spring Reverb Rymd", category: "effets", note: "Réverbération à ressorts Rymd", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "eq.svg", name: "Master EQ", category: "effets", note: "Égaliseur Master 3 bandes", frameCount: 2, encoders: DEFAULT_ENCODERS["eq.svg"] },
  { file: "master.svg", name: "Master Drive/Limiter", category: "effets", note: "Compression/drive Master", frameCount: 2, encoders: DEFAULT_ENCODERS["eq.svg"] },
  { file: "endless.svg", name: "Endless Sequencer", category: "sequenceurs", note: "Séquenceur pas à pas Endless", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "tombola.svg", name: "Tombola Sequencer", category: "sequenceurs", note: "Séquenceur à gravité Tombola", frameCount: 6, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "sketch.svg", name: "Sketch Sequencer", category: "sequenceurs", note: "Séquenceur d'ondes Sketch", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "pattern.svg", name: "Pattern Sequencer", category: "sequenceurs", note: "Séquenceur de motifs Pattern", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "simple.svg", name: "Arpeggio Sequencer", category: "sequenceurs", note: "Arpégiateur Simple", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "ok.svg", name: "Finger Sequencer", category: "sequenceurs", note: "Séquenceur polyphonique Finger", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "clock.svg", name: "Clock / Sync", category: "sequenceurs", note: "Horloge et synchro temporelle", frameCount: 2, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "duallfo.svg", name: "Dual LFO", category: "lfo", note: "LFO double", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "midilfo.svg", name: "MIDI LFO", category: "lfo", note: "LFO contrôlé par MIDI", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "rndlfo.svg", name: "Random LFO", category: "lfo", note: "LFO aléatoire Sample & Hold", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "singlelfo.svg", name: "Single LFO", category: "lfo", note: "LFO simple", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "bendlfo.svg", name: "Bend LFO", category: "lfo", note: "LFO pitch bend", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "cranklfo.svg", name: "Crank LFO", category: "lfo", note: "Modulation manuelle Crank", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "reroutelfo.svg", name: "Re-Route LFO", category: "lfo", note: "Matrice de réassignation", frameCount: 4, encoders: DEFAULT_ENCODERS["delay.svg"] },
  { file: "com.svg", name: "COM Connectivity", category: "connectivite", note: "Connexion USB, MIDI, Storage", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "in.svg", name: "Audio Input Selector", category: "connectivite", note: "Entrée Ligne, Micro, Radio FM", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "micline.svg", name: "Input Gain / Level", category: "connectivite", note: "Gain d'entrée enregistrement", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "album.svg", name: "Album Vinyl", category: "album", note: "Enregistreur vinyle 2 faces", frameCount: 4, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "tempo.svg", name: "BPM Tempo Screen", category: "tempo", note: "Réglage BPM et Métronome", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "octave.svg", name: "Keyboard Octave", category: "clavier", note: "Indicateur d'octave", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "help.svg", name: "Help System", category: "aide", note: "Guide d'aide interactif", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "playmode.svg", name: "Play Mode", category: "modes_principaux", note: "Mode Mono / Poly / Legato", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "presetbrowser.svg", name: "Preset Browser", category: "navigation_presets", note: "Navigateur de sons usine", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "lander.svg", name: "Chop Lifter Game", category: "interface_generique", note: "Easter egg jeu Lander", frameCount: 4, encoders: DEFAULT_ENCODERS["tombola.svg"] },
  { file: "save.svg", name: "Save Preset", category: "interface_generique", note: "Sauvegarde de preset", frameCount: 2, encoders: DEFAULT_ENCODERS["tape.svg"] },
  { file: "adsr.svg", name: "ADSR Envelope", category: "non_identifie", note: "Enveloppe ADSR", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "colors.svg", name: "Color Test Screen", category: "non_identifie", note: "Calibration couleurs OLED", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "dynaenv.svg", name: "Dynamic Envelope", category: "non_identifie", note: "Enveloppe dynamique", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "etchasketch.svg", name: "Etch Sketch Screen", category: "non_identifie", note: "Graphique spécial de dessin", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "fmpopup.svg", name: "FM Popup Dialog", category: "non_identifie", note: "Pop-up de réglage FM", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "mmmf.svg", name: "Filter Morph Screen", category: "non_identifie", note: "Morphing de filtre", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "opfont.svg", name: "OP Font Map", category: "non_identifie", note: "Police typographique OP-1", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "signalflow.svg", name: "Signal Flow Map", category: "non_identifie", note: "Schéma de flux audio", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "subscreenhand.svg", name: "Hand Pointer", category: "non_identifie", note: "Curseur main", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "tune.svg", name: "Master Tuning", category: "non_identifie", note: "Accordage Master Tuning 440Hz", frameCount: 2, encoders: DEFAULT_ENCODERS["fm.svg"] },
  { file: "drw.svg", name: "DRWave Engine", category: "moteurs_sonores", note: "Table d'ondes DRWave", frameCount: 4, encoders: DEFAULT_ENCODERS["fm.svg"] },
];

export type ToolType =
  | "pencil"
  | "brush"
  | "line"
  | "rect"
  | "circle"
  | "fill"
  | "eraser"
  | "picker";

export default function ImageEditorOP1() {
  const [profileName, setProfileName] = useState("AZOTH");
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // Mode Selection: "draw" (Édition Pixel) vs "live" (Simulation Béton Live)
  const [editorMode, setEditorMode] = useState<"draw" | "live">("draw");

  // Middle-Right Slide-out Drawer for Theme Explorer
  const [isRightOverlayOpen, setIsRightOverlayOpen] = useState<boolean>(false);

  // Retractable Controls & Keyboard Panel
  const [isRackCollapsed, setIsRackCollapsed] = useState<boolean>(false);

  // Adjustable Pixel Grid Step Size (1px, 2px, 4px, 8px, 16px)
  const [gridStepSize, setGridStepSize] = useState<number>(1);
  const [showPixelGrid, setShowPixelGrid] = useState<boolean>(true);

  // Colors
  const [fgColor, setFgColor] = useState<string>("#00ed95");
  const [bgColor, setBgColor] = useState<string>("#0d0f18");

  // Tools & Canvas Settings
  const [tool, setTool] = useState<ToolType>("pencil");
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isFilled, setIsFilled] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(100);
  const [zoomScale, setZoomScale] = useState<number>(3); // 3x Default

  // Frame Control
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [totalFramesCount, setTotalFramesCount] = useState<number>(4);

  // Cursor Coordinates
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Active Key Pressed Trigger
  const [lastNotePressed, setLastNotePressed] = useState<string | null>(null);
  const [activeBalls, setActiveBalls] = useState<{ x: number; y: number; r: number; color: string }[]>([]);

  // Drawing state
  const isDrawingRef = useRef<boolean>(false);
  const startPointRef = useRef<[number, number] | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  // History Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);

  // Firmware Assets & Active Encoders
  const [assetCategory, setAssetCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number>(0);
  const [activeEncoders, setActiveEncoders] = useState<ScreenEncoders>(FIRMWARE_ASSETS[0].encoders);

  // Active Parameter Popup Overlay
  const [activeKnobPopup, setActiveKnobPopup] = useState<string | null>(null);

  // Player Animation Loop
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState<boolean>(false);

  // WebMIDI Status
  const [midiConnected, setMidiConnected] = useState<boolean>(false);

  // Hydrate profile name
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studio-hub-profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setProfileName(parsed.name);
      }
    } catch {}
  }, []);

  // Initialize Canvas with Main Theme (tape.svg / Tape 4-Track par défaut)
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);

    const initData = ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT);
    setHistory([initData]);

    // Display Main Theme By Default
    loadMainDefaultTheme();
  }, []);

  // WebMIDI Reader
  useEffect(() => {
    if (typeof window !== "undefined" && "requestMIDIAccess" in navigator) {
      navigator
        .requestMIDIAccess()
        .then((midiAccess) => {
          const inputs = Array.from(midiAccess.inputs.values());
          if (inputs.length > 0) setMidiConnected(true);
        })
        .catch(() => {});
    }
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isPlayingAnimation) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prevFrame) => (prevFrame + 1) % totalFramesCount);
    }, 250);

    return () => clearInterval(interval);
  }, [isPlayingAnimation, totalFramesCount]);

  useEffect(() => {
    if (editorMode === "live") {
      const asset = filteredAssets[selectedAssetIndex];
      if (asset) {
        renderScreenSimulation(asset.file, currentFrameIndex, activeEncoders);
      }
    }
  }, [currentFrameIndex, selectedAssetIndex, activeEncoders, editorMode, lastNotePressed, activeBalls]);

  // DYNAMIC ADJUSTABLE PIXEL GRID RENDERING (Ultra-thin & Crisp)
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, OP1_WIDTH, OP1_HEIGHT);

    if (editorMode === "draw" || (showPixelGrid && zoomScale >= 2)) {
      ctx.strokeStyle = editorMode === "draw" ? "rgba(0, 237, 149, 0.18)" : "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 0.25; // Ultra-thin crisp hairline grid lines

      const step = gridStepSize;

      for (let x = 0; x <= OP1_WIDTH; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, OP1_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= OP1_HEIGHT; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(OP1_WIDTH, y + 0.5);
        ctx.stroke();
      }
    }
  }, [showPixelGrid, zoomScale, editorMode, gridStepSize]);

  // Load Main Default Theme (tape.svg)
  const loadMainDefaultTheme = () => {
    setSelectedAssetIndex(0);
    const mainAsset = FIRMWARE_ASSETS[0];
    setActiveEncoders(mainAsset.encoders);
    setTotalFramesCount(mainAsset.frameCount || 4);
    setCurrentFrameIndex(0);
    renderScreenSimulation(mainAsset.file, 0, mainAsset.encoders);
  };

  // CREATE MY PERSONAL CUSTOM THEME (NEW REQUIREMENT)
  const handleCreatePersonalTheme = () => {
    const themeNum = Math.floor(1000 + Math.random() * 9000);
    const themeFolderName = `THEME_${profileName.toUpperCase()}_#${themeNum}`;

    // Clear canvas & load clean custom template
    clearCanvas();
    setEditorMode("draw");

    setActiveKnobPopup(`✨ DOSSIER CRÉÉ: ${themeFolderName}`);
    setTimeout(() => setActiveKnobPopup(null), 2500);
  };

  // Open Storage Theme Folder
  const handleOpenStorageFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,.png,.json";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = mainCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, OP1_WIDTH, OP1_HEIGHT);
              saveState();
              setActiveKnobPopup(`THÈME STOCKAGE CHARGÉ: ${file.name}`);
              setTimeout(() => setActiveKnobPopup(null), 1500);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Save Canvas State
  const saveState = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT);
    setHistory((prev) => [...prev.slice(-30), currentData]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    const current = newHistory.pop()!;
    setFuture((prev) => [current, ...prev]);
    setHistory(newHistory);

    const previous = newHistory[newHistory.length - 1];
    if (previous) {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.putImageData(previous, 0, 0);
    }
  };

  const redo = () => {
    if (future.length === 0) return;
    const newFuture = [...future];
    const next = newFuture.shift()!;
    setFuture(newFuture);
    setHistory((prev) => [...prev, next]);

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(next, 0, 0);
  };

  // Get exact 320x160 pixel coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(OP1_WIDTH - 1, Math.floor(((e.clientX - rect.left) / rect.width) * OP1_WIDTH)));
    const y = Math.max(0, Math.min(OP1_HEIGHT - 1, Math.floor(((e.clientY - rect.top) / rect.height) * OP1_HEIGHT)));
    return [x, y];
  };

  // Flood Fill
  const floodFill = (startX: number, startY: number, fillColorHex: string) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT);
    const pixels = imgData.data;

    const tempDiv = document.createElement("div");
    tempDiv.style.color = fillColorHex;
    document.body.appendChild(tempDiv);
    const rgbStr = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    const match = rgbStr.match(/\d+/g);
    if (!match) return;
    const [r, g, b] = match.map(Number);

    const targetIdx = (startY * OP1_WIDTH + startX) * 4;
    const tr = pixels[targetIdx];
    const tg = pixels[targetIdx + 1];
    const tb = pixels[targetIdx + 2];

    if (tr === r && tg === g && tb === b) return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(OP1_WIDTH * OP1_HEIGHT);

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      const idx = y * OP1_WIDTH + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pIdx = idx * 4;
      if (
        Math.abs(pixels[pIdx] - tr) < 25 &&
        Math.abs(pixels[pIdx + 1] - tg) < 25 &&
        Math.abs(pixels[pIdx + 2] - tb) < 25
      ) {
        pixels[pIdx] = r;
        pixels[pIdx + 1] = g;
        pixels[pIdx + 2] = b;
        pixels[pIdx + 3] = Math.floor((opacity / 100) * 255);

        if (x > 0) queue.push([x - 1, y]);
        if (x < OP1_WIDTH - 1) queue.push([x + 1, y]);
        if (y > 0) queue.push([x, y - 1]);
        if (y < OP1_HEIGHT - 1) queue.push([x, y + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveState();
  };

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editorMode !== "draw") return;
    if (isPlayingAnimation) setIsPlayingAnimation(false);

    const coords = getCanvasCoords(e);
    if (!coords) return;
    const [x, y] = coords;

    isDrawingRef.current = true;
    startPointRef.current = [x, y];

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    snapshotRef.current = ctx.getImageData(0, 0, OP1_WIDTH, OP1_HEIGHT);

    if (tool === "picker") {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = "#" + [pixel[0], pixel[1], pixel[2]].map((c) => c.toString(16).padStart(2, "0")).join("");
      setFgColor(hex);
      isDrawingRef.current = false;
      return;
    }

    if (tool === "fill") {
      floodFill(x, y, fgColor);
      isDrawingRef.current = false;
      return;
    }

    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      ctx.fillStyle = tool === "eraser" ? bgColor : fgColor;
      ctx.fillRect(x, y, brushSize, brushSize);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (coords) setCursorPos({ x: coords[0], y: coords[1] });

    if (editorMode !== "draw") return;
    if (!isDrawingRef.current || !startPointRef.current) return;
    if (!coords) return;
    const [x, y] = coords;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [startX, startY] = startPointRef.current;

    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      ctx.fillStyle = tool === "eraser" ? bgColor : fgColor;
      ctx.fillRect(x, y, brushSize, brushSize);
      startPointRef.current = [x, y];
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      ctx.strokeStyle = fgColor;
      ctx.fillStyle = fgColor;
      ctx.lineWidth = brushSize;

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === "rect") {
        const w = x - startX;
        const h = y - startY;
        if (isFilled) ctx.fillRect(startX, startY, w, h);
        else ctx.strokeRect(startX, startY, w, h);
      } else if (tool === "circle") {
        const radius = Math.hypot(x - startX, y - startY);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        if (isFilled) ctx.fill();
        else ctx.stroke();
      }
    }
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      startPointRef.current = null;
      snapshotRef.current = null;
      saveState();
    }
  };

  // Swap Colors
  const swapColors = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  // Clear Canvas
  const clearCanvas = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);
    saveState();
  };

  // Trigger Keyboard Note Press
  const handleKeyPress = (noteName: string) => {
    setLastNotePressed(noteName);

    const newBall = {
      x: 40 + Math.random() * 240,
      y: 30,
      r: 6 + Math.random() * 8,
      color: OP1_PALETTE[Math.floor(Math.random() * OP1_PALETTE.length)].hex,
    };
    setActiveBalls((prev) => [...prev.slice(-12), newBall]);

    setActiveKnobPopup(`NOTE: ${noteName}`);
    setTimeout(() => setActiveKnobPopup(null), 1000);
  };

  // Slider Change Handler
  const handleEncoderSliderChange = (key: "k1" | "k2" | "k3" | "k4", value: number) => {
    const enc = activeEncoders[key];
    const updated = {
      ...activeEncoders,
      [key]: { ...enc, val: value },
    };
    setActiveEncoders(updated);

    setActiveKnobPopup(`${enc.name.toUpperCase()}: ${value} ${enc.unit}`);
    setTimeout(() => setActiveKnobPopup(null), 1200);

    if (editorMode === "live") {
      renderScreenSimulation(filteredAssets[selectedAssetIndex]?.file || "tape.svg", currentFrameIndex, updated);
    }
  };

  // RENDER OLED SCREEN SIMULATION
  const renderScreenSimulation = (filename: string, frameIdx: number, encoders: ScreenEncoders) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d0f18";
    ctx.fillRect(0, 0, OP1_WIDTH, OP1_HEIGHT);

    if (filename.includes("tombola") || filename.includes("sequenceur") || filename.includes("finger")) {
      const cageSize = encoders.k3.val;
      const gravity = encoders.k2.val;

      ctx.strokeStyle = "#00ed95";
      ctx.lineWidth = 2;
      const angle = (frameIdx * Math.PI * (gravity / 50));
      const size = (cageSize / 100) * 60 + 20;

      ctx.save();
      ctx.translate(160, 80);
      ctx.rotate(angle);
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      ctx.restore();

      activeBalls.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y + (frameIdx * 4) % 40, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`TOMBOLA SEQ : ${lastNotePressed ? "NOTE " + lastNotePressed : "JOUEZ LE CLAVIER"}`, 60, 20);
    } else if (filename.includes("tape") || filename.includes("mixer")) {
      const speedFactor = encoders.k1.val / 100;
      const activeTrack = Math.round(encoders.k2.val);
      const playheadPos = (encoders.k3.val / 100) * 280 + 20;
      const masterVol = encoders.k4.val;

      const reelAngle = (frameIdx * Math.PI * 0.5 * speedFactor);

      ctx.strokeStyle = "#4aa7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(75, 80, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(245, 80, 40, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        ctx.beginPath();
        ctx.moveTo(75, 80);
        ctx.lineTo(75 + Math.cos(a + reelAngle) * 38, 80 + Math.sin(a + reelAngle) * 38);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(245, 80);
        ctx.lineTo(245 + Math.cos(a - reelAngle) * 38, 245 + Math.sin(a - reelAngle) * 38);
        ctx.stroke();
      }

      ctx.fillStyle = "#ff5a1f";
      ctx.beginPath();
      ctx.arc(75, 80, 10, 0, Math.PI * 2);
      ctx.arc(245, 80, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ff3a5d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadPos, 25);
      ctx.lineTo(playheadPos, 135);
      ctx.stroke();

      for (let i = 1; i <= 4; i++) {
        const isSelected = i === activeTrack;
        const h = (masterVol / 100) * (20 + (i * 12) % 40);
        ctx.fillStyle = isSelected ? "#00ed95" : "#4aa7ff";
        ctx.fillRect(130 + i * 14, 115 - h, 10, h);
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`MAGNÉTOPHONE TAPE (TRACK ${activeTrack})`, 85, 20);
    } else if (filename.includes("fm") || filename.includes("synth")) {
      const freq = encoders.k1.val;
      const mod = encoders.k2.val;
      const env = encoders.k3.val;

      ctx.strokeStyle = "#00ed95";
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let x = 20; x < 300; x += 2) {
        const y = 80 + Math.sin((x * freq) / 2000 + frameIdx) * (mod * 0.4) * Math.cos(x * 0.02);
        if (x === 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "#ff3a5d";
      ctx.fillRect(40, 125, (env / 100) * 240, 8);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`FM SYNTH : ${freq} Hz | MOD: ${mod}%`, 75, 20);
    } else if (filename.includes("delay") || filename.includes("fx")) {
      const timeMs = encoders.k1.val;
      const feedback = encoders.k2.val;
      const mix = encoders.k4.val;

      const rings = Math.floor((timeMs / 1000) * 10) + 2;

      ctx.strokeStyle = "#d9ff43";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < rings; i++) {
        ctx.beginPath();
        ctx.arc(160, 80, 10 + i * (feedback / 8), 0, Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.fillStyle = "#4aa7ff";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`DELAY FX : ${timeMs} ms | MIX: ${mix}%`, 75, 20);
    } else if (filename.includes("eq")) {
      const low = encoders.k1.val;
      const mid = encoders.k2.val;
      const high = encoders.k3.val;

      ctx.strokeStyle = "#4aa7ff";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(30, 80 - low * 3);
      ctx.bezierCurveTo(100, 80 - low * 3, 160, 80 - mid * 3, 290, 80 - high * 3);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`MASTER EQ: L ${low}dB | M ${mid}dB | H ${high}dB`, 50, 20);
    } else {
      ctx.strokeStyle = "#87839c";
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, 280, 120);

      ctx.fillStyle = "#00ed95";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${filename.toUpperCase().replace(".SVG", "")}`, 80, 85);
    }
  };

  // Filter Assets
  const filteredAssets = FIRMWARE_ASSETS.filter((a) => {
    const matchesCategory = assetCategory === "all" || a.category === assetCategory;
    const matchesQuery =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.note.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const selectAsset = (index: number) => {
    if (filteredAssets[index]) {
      setSelectedAssetIndex(index);
      const asset = filteredAssets[index];
      setActiveEncoders(asset.encoders);
      setTotalFramesCount(asset.frameCount || 4);
      setCurrentFrameIndex(0);
      if (editorMode === "live") {
        renderScreenSimulation(asset.file, 0, asset.encoders);
      }
    }
  };

  const switchFrame = (delta: number) => {
    const newFrame = (currentFrameIndex + delta + totalFramesCount) % totalFramesCount;
    setCurrentFrameIndex(newFrame);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);

    const filename = e.dataTransfer.getData("text/plain");
    if (filename) {
      const foundIndex = filteredAssets.findIndex((a) => a.file === filename);
      if (foundIndex !== -1) {
        setSelectedAssetIndex(foundIndex);
        setActiveEncoders(filteredAssets[foundIndex].encoders);
        setTotalFramesCount(filteredAssets[foundIndex].frameCount || 4);
        setCurrentFrameIndex(0);
        if (editorMode === "live") {
          renderScreenSimulation(filename, 0, filteredAssets[foundIndex].encoders);
        }
      }
      return;
    }
  };

  // Export PNG
  const exportPNG = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `op1-screen-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="pro-pixel-studio-page">
      <TopBar activePage="image-editor-op1" profileName={profileName} />

      {/* MIDDLE-RIGHT SLIDE-OUT DRAWER TRIGGER BUTTON */}
      <button
        type="button"
        className={`middle-right-drawer-tab ${isRightOverlayOpen ? "drawer-tab-active" : ""}`}
        onClick={() => setIsRightOverlayOpen(!isRightOverlayOpen)}
        title="Ouvrir/Fermer le menu déroulant des Thèmes à droite"
      >
        <span>📂 THÈMES OP-1</span>
      </button>

      {/* TOP TOOLBAR */}
      <header className="pro-top-toolbar">
        {/* MODE SWITCHER BUTTON */}
        <div className="pro-mode-switcher-group">
          <button
            type="button"
            className={`pro-mode-btn ${editorMode === "draw" ? "is-active-mode-draw" : ""}`}
            onClick={() => setEditorMode("draw")}
          >
            🎨 ÉDITION PIXEL
          </button>
          <button
            type="button"
            className={`pro-mode-btn ${editorMode === "live" ? "is-active-mode-live" : ""}`}
            onClick={() => setEditorMode("live")}
          >
            🎮 SIMULATION LIVE
          </button>
        </div>

        <div className="pro-tb-separator" />

        <div className="pro-panel-toggles">
          <button
            type="button"
            className={`pro-toggle-btn ${isPlayingAnimation ? "active-panel" : ""}`}
            onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
          >
            {isPlayingAnimation ? "⏸ PAUSE" : "▶ ANIMER"}
          </button>
        </div>

        <div className="pro-tb-separator" />

        {/* FRAME SWITCHER CONTROL */}
        <div className="pro-frame-selector-box">
          <span className="frame-box-label">🎞️ FRAME:</span>
          <button type="button" className="pro-icon-btn" onClick={() => switchFrame(-1)}>◀</button>
          <span className="frame-counter-badge">{currentFrameIndex + 1} / {totalFramesCount}</span>
          <button type="button" className="pro-icon-btn" onClick={() => switchFrame(1)}>▶</button>
        </div>

        <div className="pro-tb-separator" />

        {/* Drawing Tools (Active in Draw Mode) */}
        {editorMode === "draw" && (
          <>
            <div className="pro-tools-row">
              {[
                { id: "pencil", name: "Crayon 1px", icon: "✏️" },
                { id: "brush", name: "Pinceau", icon: "🖌️" },
                { id: "line", name: "Ligne", icon: "📏" },
                { id: "rect", name: "Rect", icon: "🔲" },
                { id: "circle", name: "Cercle", icon: "⭕" },
                { id: "fill", name: "Remplir", icon: "🪣" },
                { id: "eraser", name: "Gomme", icon: "🧹" },
                { id: "picker", name: "Pipette", icon: "🧪" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pro-tool-icon ${tool === t.id ? "is-active-tool" : ""}`}
                  onClick={() => setTool(t.id as ToolType)}
                  title={t.name}
                >
                  <span>{t.icon}</span>
                </button>
              ))}
            </div>

            <div className="pro-tb-separator" />

            <div className="pro-tool-options">
              <label>Taille:
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Math.max(1, Number(e.target.value)))}
                  className="pro-number-input"
                />
                px
              </label>

              {/* ADJUSTABLE PIXEL GRID STEP SELECTOR */}
              <div className="grid-step-selector-box">
                <span className="grid-label-tag">🏁 GRILLE:</span>
                {[1, 2, 4, 8, 16].map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`grid-step-btn ${gridStepSize === step ? "active-grid-step" : ""}`}
                    onClick={() => setGridStepSize(step)}
                  >
                    {step}px
                  </button>
                ))}
              </div>
            </div>

            <div className="pro-tb-separator" />

            {/* Colors */}
            <div className="pro-palette-bar">
              <div className="pro-color-swatch-pair">
                <div className="swatch-bg-layer" style={{ backgroundColor: bgColor }} />
                <div className="swatch-fg-layer" style={{ backgroundColor: fgColor }} />
                <button type="button" className="swap-swatches-btn" onClick={swapColors}>🔄</button>
              </div>

              <div className="pro-palette-dots">
                {OP1_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`pro-dot ${fgColor === c.hex ? "active-dot" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setFgColor(c.hex)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Right Actions */}
        <div className="pro-actions-right">
          <button type="button" className="pro-icon-btn" onClick={undo} disabled={history.length <= 1}>↩</button>
          <button type="button" className="pro-icon-btn" onClick={redo} disabled={future.length === 0}>↪</button>
          <button type="button" className="pro-icon-btn clear-btn" onClick={clearCanvas}>🗑️</button>
          <button type="button" className="pro-action-export-btn" onClick={exportPNG}>💾 EXPORTER</button>
        </div>
      </header>

      {/* UNIFIED SINGLE-WINDOW WORKSPACE */}
      <section className="pro-canvas-workspace">
        {/* MIDDLE-RIGHT SLIDE-OUT DRAWER OVERLAY */}
        {isRightOverlayOpen && (
          <div className="floating-overlay-panel panel-right-middle-drawer">
            <div className="overlay-header">
              <strong>📂 EXPLORATEUR DE THÈMES OP-1 ({filteredAssets.length})</strong>
              <button type="button" className="close-overlay-btn" onClick={() => setIsRightOverlayOpen(false)}>✕</button>
            </div>

            <div className="overlay-body">
              {/* CREATE MY PERSONAL THEME BUTTON (NEW REQUIREMENT) */}
              <div className="drawer-quick-actions-row">
                <button
                  type="button"
                  className="official-theme-btn"
                  onClick={handleCreatePersonalTheme}
                  title="Créer immédiatement un dossier de thème personnalisé au nom de l'utilisateur"
                >
                  ✨ CRÉER MON THÈME PERSO ({profileName})
                </button>
                <button
                  type="button"
                  className="storage-folder-btn"
                  onClick={handleOpenStorageFolder}
                  title="Parcourir le dossier des thèmes dans le stockage"
                >
                  📁 PARCOURIR STOCKAGE
                </button>
              </div>

              <input
                type="text"
                className="overlay-search-input"
                placeholder="🔍 Filtrer écran (Tape, FM, LFO...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="overlay-category-pills">
                {[
                  { id: "all", label: "Tous" },
                  { id: "moteurs_sonores", label: "Moteurs" },
                  { id: "effets", label: "Effets" },
                  { id: "sequenceurs", label: "Seq" },
                  { id: "tape", label: "Tape" },
                  { id: "lfo", label: "LFO" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`pill-btn ${assetCategory === cat.id ? "active-pill" : ""}`}
                    onClick={() => setAssetCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="overlay-miniatures-grid">
                {filteredAssets.map((asset, index) => (
                  <div
                    key={asset.file}
                    draggable={true}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", asset.file)}
                    className={`mini-asset-card ${selectedAssetIndex === index ? "is-selected-mini" : ""}`}
                    onClick={() => selectAsset(index)}
                  >
                    <div className="mini-card-frame">
                      <img
                        src={`/firmware-original/${asset.file}`}
                        alt={asset.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <span>{asset.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONCRETE SIMULATOR CHASSIS */}
        <div className="op1-concrete-chassis">
          {/* Header Bar */}
          <div className="chassis-header-bar">
            <div className="chassis-title">
              <span className={`dot-live-status ${editorMode === "draw" ? "draw-status" : "live-status"}`} />
              <strong>
                {editorMode === "draw" ? "FEUILLE D'ÉDITION PIXEL 1:1 (320 × 160)" : "SIMULATEUR OP-1 BÉTON (320 × 160 OLED)"}
              </strong>
            </div>

            <div className="zoom-buttons">
              {[1, 2, 3, 4, 5].map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`zoom-btn ${zoomScale === z ? "active-zoom" : ""}`}
                  onClick={() => setZoomScale(z)}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          {/* MAIN DISPLAY CANVAS */}
          <div
            className={`concrete-screen-bezel ${isDraggingOverCanvas ? "drag-active" : ""}`}
            style={{
              width: OP1_WIDTH * zoomScale + "px",
              height: OP1_HEIGHT * zoomScale + "px",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <canvas
              ref={mainCanvasRef}
              width={OP1_WIDTH}
              height={OP1_HEIGHT}
              className="sheet-canvas main-sheet-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />

            <canvas
              ref={gridCanvasRef}
              width={OP1_WIDTH}
              height={OP1_HEIGHT}
              className="sheet-canvas grid-sheet-canvas"
            />

            {/* Live Parameter Popup Overlay */}
            {activeKnobPopup && (
              <div className="knob-live-popup-overlay">
                <span>{activeKnobPopup}</span>
              </div>
            )}

            {isDraggingOverCanvas && (
              <div className="sheet-drop-overlay">
                <span>📥 LÂCHEZ LE FICHIER POUR L'OUVRIR DIRECTEMENT</span>
              </div>
            )}
          </div>

          {/* BOTTOM RETRACTABLE RACK TOGGLE ARROW */}
          <button
            type="button"
            className="bottom-rack-toggle-btn"
            onClick={() => setIsRackCollapsed(!isRackCollapsed)}
            title={isRackCollapsed ? "Déplier les contrôles & le clavier" : "Masquer/Rétracter les contrôles"}
          >
            <span>{isRackCollapsed ? "▲ DÉPLIER CONTRÔLES & CLAVIER ▲" : "▼ RÉTRACTER CONTRÔLES & CLAVIER ▼"}</span>
          </button>

          {/* RETRACTABLE RACK */}
          {!isRackCollapsed && (
            <div className="retractable-bottom-rack">
              {/* SPACE-SAVING COMPACT SLIDERS */}
              <div className="compact-sliders-rack">
                {/* Slider K1 - Blue */}
                <div className="compact-slider-item slider-k1">
                  <div className="slider-label-row">
                    <span className="slider-name blue-text">K1 BLEU: {activeEncoders.k1.name}</span>
                    <span className="slider-val">{activeEncoders.k1.val} {activeEncoders.k1.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={activeEncoders.k1.min}
                    max={activeEncoders.k1.max}
                    value={activeEncoders.k1.val}
                    onChange={(e) => handleEncoderSliderChange("k1", Number(e.target.value))}
                    className="glissiere-range range-blue"
                  />
                </div>

                {/* Slider K2 - Green */}
                <div className="compact-slider-item slider-k2">
                  <div className="slider-label-row">
                    <span className="slider-name green-text">K2 VERT: {activeEncoders.k2.name}</span>
                    <span className="slider-val">{activeEncoders.k2.val} {activeEncoders.k2.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={activeEncoders.k2.min}
                    max={activeEncoders.k2.max}
                    value={activeEncoders.k2.val}
                    onChange={(e) => handleEncoderSliderChange("k2", Number(e.target.value))}
                    className="glissiere-range range-green"
                  />
                </div>

                {/* Slider K3 - White */}
                <div className="compact-slider-item slider-k3">
                  <div className="slider-label-row">
                    <span className="slider-name white-text">K3 BLANC: {activeEncoders.k3.name}</span>
                    <span className="slider-val">{activeEncoders.k3.val} {activeEncoders.k3.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={activeEncoders.k3.min}
                    max={activeEncoders.k3.max}
                    value={activeEncoders.k3.val}
                    onChange={(e) => handleEncoderSliderChange("k3", Number(e.target.value))}
                    className="glissiere-range range-white"
                  />
                </div>

                {/* Slider K4 - Red */}
                <div className="compact-slider-item slider-k4">
                  <div className="slider-label-row">
                    <span className="slider-name red-text">K4 ROUGE: {activeEncoders.k4.name}</span>
                    <span className="slider-val">{activeEncoders.k4.val} {activeEncoders.k4.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={activeEncoders.k4.min}
                    max={activeEncoders.k4.max}
                    value={activeEncoders.k4.val}
                    onChange={(e) => handleEncoderSliderChange("k4", Number(e.target.value))}
                    className="glissiere-range range-red"
                  />
                </div>
              </div>

              {/* INTERACTIVE OP-1 MINI PIANO KEYBOARD BAR */}
              <div className="op1-piano-bar">
                <span className="piano-title-tag">🎹 CLAVIER OP-1 INTERACTIF (ANIME LES SÉQUENCEURS & SYNTHÉS) :</span>
                <div className="piano-keys-container">
                  {OP1_KEYS.map((k, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`op1-key-btn ${k.isBlack ? "black-key" : "white-key"} ${lastNotePressed === k.note ? "pressed-key" : ""}`}
                      onClick={() => handleKeyPress(k.note)}
                      title={`Jouer note ${k.note}`}
                    >
                      <span className="key-note-label">{k.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="chassis-footer-info">
            <span>Écran: {filteredAssets[selectedAssetIndex]?.file}</span>
            <span>Grille: {gridStepSize}px</span>
            <span>Curseur: {cursorPos ? `X: ${cursorPos.x} | Y: ${cursorPos.y}` : "--"}</span>
            <span>MIDI: {midiConnected ? "Connecté" : "Actif"}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
