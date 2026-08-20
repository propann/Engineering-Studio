/**
 * Référence complète des boutons et contrôles du clavier OP-1 (Gabarit 7B officiel).
 * Source : Teenage Engineering OP-1 hardware specifications & layout 7B.
 */

export type OP1ButtonCategory =
  | "modes"
  | "tracks"
  | "sound_functions"
  | "tape_edit"
  | "transport"
  | "system_audio"
  | "encoders";

export type ControlVisual =
  | "key" | "enc" | "fn" | "trans" | "knob" | "button" | "arrow" | "speaker" | "screen" | "battery" | "plug" | "mic"
  | "synth" | "drum" | "tape-mode" | "mixer" | "seq" | "shift" | "help" | "tempo"
  | "play" | "rec" | "stop" | "rewind" | "forward" | "split" | "drop" | "lift" | "join"
  | "loop" | "break" | "m1" | "m2" | "in" | "out";

export type OP1ButtonDef = {
  id: string;
  label: string;
  sublabel?: string;
  category: OP1ButtonCategory;
  visual: ControlVisual;
  color?: string;
  col?: number;
  row?: number;
  w?: number;
  h?: number;
  note: string;
  midiDefault?: number[];
};

export const OP1_7B_BUTTONS: OP1ButtonDef[] = [
  // ── MODES PRINCIPAUX ──
  { id: "synth", label: "SYNTH", sublabel: "∿", category: "modes", visual: "synth", col: 0, row: 8, w: 2, h: 2, note: "Moteur de synthèse sonore", midiDefault: [0x99, 36, 127] },
  { id: "drum", label: "DRUM", sublabel: "☿", category: "modes", visual: "drum", col: 2, row: 8, w: 2, h: 2, note: "Moteur de batterie & échantillonneur de kits", midiDefault: [0x99, 37, 127] },
  { id: "tape", label: "TAPE", sublabel: "OO", category: "modes", visual: "tape-mode", col: 4, row: 8, w: 2, h: 2, note: "Enregistreur 4 pistes à bande virtuelle", midiDefault: [0x99, 38, 127] },
  { id: "mixer", label: "MIXER", sublabel: "ılı", category: "modes", visual: "mixer", col: 6, row: 8, w: 2, h: 2, note: "Table de mixage 4 pistes, EQ & Master FX", midiDefault: [0x99, 39, 127] },

  // ── SÉLECTION DES PISTES (1 à 4) ──
  { id: "track1", label: "Piste 1", sublabel: "1", category: "tracks", visual: "fn", col: 8, row: 8, w: 2, h: 2, note: "Sélectionner la piste 1", midiDefault: [0xb0, 11, 127] },
  { id: "track2", label: "Piste 2", sublabel: "2", category: "tracks", visual: "fn", col: 10, row: 8, w: 2, h: 2, note: "Sélectionner la piste 2", midiDefault: [0xb0, 12, 127] },
  { id: "track3", label: "Piste 3", sublabel: "3", category: "tracks", visual: "fn", col: 12, row: 8, w: 2, h: 2, note: "Sélectionner la piste 3", midiDefault: [0xb0, 13, 127] },
  { id: "track4", label: "Piste 4", sublabel: "4", category: "tracks", visual: "fn", col: 14, row: 8, w: 2, h: 2, note: "Sélectionner la piste 4", midiDefault: [0xb0, 14, 127] },

  // ── TOUCHES DE SÉLECTION DE SON & FONCTIONS (1 à 8) ──
  { id: "sound1", label: "1 (IN)", sublabel: "IN", category: "sound_functions", visual: "in", col: 16, row: 8, w: 2, h: 2, note: "Son 1 / Définir point IN de boucle", midiDefault: [0x99, 40, 127] },
  { id: "sound2", label: "2 (OUT)", sublabel: "OUT", category: "sound_functions", visual: "out", col: 18, row: 8, w: 2, h: 2, note: "Son 2 / Définir point OUT de boucle", midiDefault: [0x99, 41, 127] },
  { id: "sound3", label: "3 (LOOP)", sublabel: "LOOP", category: "sound_functions", visual: "loop", col: 20, row: 8, w: 2, h: 2, note: "Son 3 / Activer boucle de bande", midiDefault: [0x99, 42, 127] },
  { id: "sound4", label: "4 (BREAK)", sublabel: "BREAK", category: "sound_functions", visual: "break", col: 22, row: 8, w: 2, h: 2, note: "Son 4 / Effet Break / Reverse bande", midiDefault: [0x99, 43, 127] },
  { id: "sound5", label: "5 (LIFT)", sublabel: "LIFT", category: "sound_functions", visual: "lift", col: 24, row: 8, w: 2, h: 2, note: "Son 5 / Lever / Copier audio piste", midiDefault: [0x99, 44, 127] },
  { id: "sound6", label: "6 (DROP)", sublabel: "DROP", category: "sound_functions", visual: "drop", col: 26, row: 8, w: 2, h: 2, note: "Son 6 / Poser / Coller audio piste", midiDefault: [0x99, 45, 127] },
  { id: "sound7", label: "7 (M1)", sublabel: "M1", category: "sound_functions", visual: "m1", col: 28, row: 8, w: 2, h: 2, note: "Son 7 / Mémoire rapide 1", midiDefault: [0x99, 46, 127] },
  { id: "sound8", label: "8 (M2)", sublabel: "M2", category: "sound_functions", visual: "m2", col: 30, row: 8, w: 2, h: 2, note: "Son 8 / Mémoire rapide 2", midiDefault: [0x99, 47, 127] },
  { id: "help", label: "HELP", sublabel: "...", category: "sound_functions", visual: "help", col: 32, row: 8, w: 2, h: 2, note: "Aide contextuelle & description des paramètres", midiDefault: [0x99, 48, 127] },

  // ── ÉDITION DE BANDE ──
  { id: "tape-lift", label: "LIFT (↑)", sublabel: "↑", category: "tape_edit", visual: "lift", col: 0, row: 10, w: 2, h: 2, note: "Lever le segment sélectionné de la bande", midiDefault: [0x99, 49, 127] },
  { id: "tape-drop", label: "DROP (↓)", sublabel: "↓", category: "tape_edit", visual: "drop", col: 2, row: 10, w: 2, h: 2, note: "Poser le segment sur la tête de lecture", midiDefault: [0x99, 50, 127] },
  { id: "tape-split", label: "SPLIT (✂)", sublabel: "✂", category: "tape_edit", visual: "split", col: 4, row: 10, w: 2, h: 2, note: "Couper le segment de bande à la position courante", midiDefault: [0x99, 51, 127] },

  // ── TRANSPORT & NAVIGATION ──
  { id: "transport-rec", label: "REC (🔴)", sublabel: "REC", category: "transport", visual: "rec", col: 0, row: 12, w: 2, h: 2, note: "Armer / Enregistrer sur la bande", midiDefault: [0x99, 52, 127] },
  { id: "transport-play", label: "PLAY (▶)", sublabel: "PLAY", category: "transport", visual: "play", col: 2, row: 12, w: 2, h: 2, note: "Démarrer / Mettre en pause la lecture", midiDefault: [0x99, 53, 127] },
  { id: "transport-stop", label: "STOP (■)", sublabel: "STOP", category: "transport", visual: "stop", col: 4, row: 12, w: 2, h: 2, note: "Arrêter la bande & remettre à zéro", midiDefault: [0x99, 54, 127] },
  { id: "rewind", label: "REWIND (<)", sublabel: "<", category: "transport", visual: "rewind", col: 0, row: 14, w: 2, h: 2, note: "Reculer la bande / Octave inférieure", midiDefault: [0x99, 55, 127] },
  { id: "forward", label: "FORWARD (>)", sublabel: ">", category: "transport", visual: "forward", col: 2, row: 14, w: 2, h: 2, note: "Avancer la bande / Octave supérieure", midiDefault: [0x99, 56, 127] },
  { id: "shift", label: "SHIFT", sublabel: "shift", category: "transport", visual: "shift", col: 4, row: 14, w: 2, h: 2, note: "Modificateur secondaire / Fonctions expertes", midiDefault: [0x99, 57, 127] },

  // ── SYSTÈME, AUDIO & ENTRÉES ──
  { id: "volume", label: "VOLUME", sublabel: "VOL", category: "system_audio", visual: "knob", col: 4, row: 4, w: 4, h: 2, note: "Potentiomètre de volume de sortie principal", midiDefault: [0xb0, 7, 100] },
  { id: "mic", label: "MIC / IN", sublabel: "MIC", category: "system_audio", visual: "mic", col: 4, row: 6, w: 2, h: 2, note: "Microphone intégré & source d'enregistrement", midiDefault: [0x99, 58, 127] },
  { id: "tempo", label: "TEMPO / METRO", sublabel: "TEMPO", category: "system_audio", visual: "tempo", col: 6, row: 6, w: 2, h: 2, note: "Réglage du tempo BPM & Métronome", midiDefault: [0x99, 59, 127] },
  { id: "audio_in", label: "AUDIO IN", sublabel: "IN", category: "system_audio", visual: "mic", col: 32, row: 4, w: 2, h: 2, note: "Entrée ligne mini-jack & radio FM", midiDefault: [0x99, 60, 127] },
  { id: "com", label: "COM", sublabel: "COM", category: "system_audio", visual: "plug", col: 32, row: 6, w: 2, h: 2, note: "Connectivité USB : Disque, Contrôleur MIDI, TE-Boot", midiDefault: [0x99, 61, 127] },

  // ── ENCODEURS COLORÉS (T1 à T4) ──
  { id: "t1", label: "Encodeur 1 (Bleu)", sublabel: "T1", category: "encoders", visual: "enc", color: "#698EFF", col: 16, row: 4, w: 4, h: 4, note: "Encodeur rotatif Bleu (Paramètre 1)", midiDefault: [0xb0, 70, 64] },
  { id: "t2", label: "Encodeur 2 (Vert)", sublabel: "T2", category: "encoders", visual: "enc", color: "#00ED95", col: 20, row: 4, w: 4, h: 4, note: "Encodeur rotatif Vert (Paramètre 2)", midiDefault: [0xb0, 71, 64] },
  { id: "t3", label: "Encodeur 3 (Blanc)", sublabel: "T3", category: "encoders", visual: "enc", color: "#DFD9FF", col: 24, row: 4, w: 4, h: 4, note: "Encodeur rotatif Blanc (Paramètre 3)", midiDefault: [0xb0, 72, 64] },
  { id: "t4", label: "Encodeur 4 (Orange)", sublabel: "T4", category: "encoders", visual: "enc", color: "#FF7A30", col: 28, row: 4, w: 4, h: 4, note: "Encodeur rotatif Orange (Paramètre 4)", midiDefault: [0xb0, 73, 64] },

  // ── CLICS POUSSOIRS DES ENCODEURS (PUSH 1-4) ──
  { id: "t1-push", label: "Clic T1 (Bleu)", sublabel: "1", category: "encoders", visual: "enc", color: "#698EFF", note: "Appui poussoir sur l'encodeur bleu T1", midiDefault: [0x99, 70, 127] },
  { id: "t2-push", label: "Clic T2 (Vert)", sublabel: "2", category: "encoders", visual: "enc", color: "#00ED95", note: "Appui poussoir sur l'encodeur vert T2", midiDefault: [0x99, 71, 127] },
  { id: "t3-push", label: "Clic T3 (Blanc)", sublabel: "3", category: "encoders", visual: "enc", color: "#DFD9FF", note: "Appui poussoir sur l'encodeur blanc T3", midiDefault: [0x99, 72, 127] },
  { id: "t4-push", label: "Clic T4 (Orange)", sublabel: "4", category: "encoders", visual: "enc", color: "#FF7A30", note: "Appui poussoir sur l'encodeur orange T4", midiDefault: [0x99, 73, 127] },
];

/** Index par coordonnées "col,row" pour identifier instantanément les boutons du gabarit officiel 7B */
export const OP1_7B_BY_COORDS = new Map<string, OP1ButtonDef>();
OP1_7B_BUTTONS.forEach((b) => {
  if (b.col !== undefined && b.row !== undefined) {
    OP1_7B_BY_COORDS.set(`${b.col},${b.row}`, b);
  }
});

/** Index par ID unique pour les lookups */
export const OP1_7B_BY_ID = new Map<string, OP1ButtonDef>();
OP1_7B_BUTTONS.forEach((b) => {
  OP1_7B_BY_ID.set(b.id, b);
});

export const OP1_CATEGORY_LABELS: Record<OP1ButtonCategory, string> = {
  modes: "Modes principaux (Synth / Drum / Tape / Mixer)",
  tracks: "Sélection des pistes (1, 2, 3, 4)",
  sound_functions: "Sons & Fonctions (1-8, IN, OUT, Loop, Break, Lift, Drop, M1, M2, Help)",
  tape_edit: "Édition de bande (Lift ↑, Drop ↓, Split ✂)",
  transport: "Transport & Navigation (Rec, Play, Stop, <, >, Shift)",
  system_audio: "Système & Audio (Volume, Micro, Tempo, Audio IN, COM)",
  encoders: "Encodeurs colorés & Clics poussoirs (T1 Bleu, T2 Vert, T3 Blanc, T4 Orange)",
};
