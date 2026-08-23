/**
 * gameSongsCatalog.ts — Banque enrichie de Morceaux & Exercices d'apprentissage OP-1.
 * 
 * 4 Catégories distinctes avec progression pédagogique complète :
 * 1. "melody" : Mélodies & Leads Modernes (Lo-Fi, Synthwave, Jazz, Afrobeat, etc.)
 * 2. "chord"  : Accords & Harmonies Contemporaines (Neo-Soul, French Touch, Bossa, J-Pop, Gospel)
 * 3. "drum"   : Finger Drumming OP-1 (Pads physiques alignés 41 à 64 : Fa2 à Mi4)
 * 4. "arcade" : Arcade & Rétro Virtuosité (Chiptune, 8-Bit Classics, Boss Fights, Phonk)
 */

export interface GameNote {
  note: number;            // MIDI Note number (ex: 41 = Kick, 45 = Snare, 60 = C4)
  startSeconds: number;    // Début en secondes
  durationSeconds: number; // Durée
  velocity?: number;
  label?: string;          // Nom lisible affiché sur la capsule
}

export interface GameSongTheme {
  id: string;
  title: string;
  category: "melody" | "chord" | "drum" | "arcade";
  level: number; // 1 à 10
  icon: string;
  bpm: number;
  difficulty: "Débutant" | "Débutant+" | "Intermédiaire" | "Intermédiaire+" | "Avancé" | "Avancé+" | "Pro" | "Pro+" | "Expert" | "Grand Maître";
  description: string;
  durationSeconds: number;
  recommendedEngine: string;
  recommendedPatch: string;
  notes: GameNote[];
}

export const GAME_SONG_THEMES: GameSongTheme[] = [
  {
    "id": "melody_lvl1_pentatonic_rnb",
    "title": "Gamme Pentatonique & Riff Lo-Fi R&B",
    "category": "melody",
    "level": 1,
    "icon": "🎹",
    "bpm": 85,
    "difficulty": "Débutant",
    "description": "Échauffement doux des doigts sur la gamme pentatonique majeure (C, D, E, G, A) avec phrasé R&B en 4 cycles complets.",
    "durationSeconds": 28,
    "recommendedEngine": "FM",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.5,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 0.65,
        "durationSeconds": 0.5,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 1.3,
        "durationSeconds": 0.5,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 1.95,
        "durationSeconds": 0.5,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.6,
        "durationSeconds": 0.5,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 3.25,
        "durationSeconds": 0.5,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 3.9,
        "durationSeconds": 0.5,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 4.55,
        "durationSeconds": 0.5,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 5.2,
        "durationSeconds": 0.5,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 6.35,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 6.95,
        "durationSeconds": 0.45,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 7.4,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 8,
        "durationSeconds": 0.45,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 8.45,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 9.05,
        "durationSeconds": 0.45,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 9.5,
        "durationSeconds": 0.45,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 10.1,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 10.55,
        "durationSeconds": 0.45,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 11.15,
        "durationSeconds": 1,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 12.4,
        "durationSeconds": 0.45,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 12.95,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 13.5,
        "durationSeconds": 0.45,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 14.05,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 14.6,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 15.15,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 15.7,
        "durationSeconds": 0.45,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 16.25,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 16.8,
        "durationSeconds": 0.45,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 17.95,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 18.45,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 18.95,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 19.45,
        "durationSeconds": 0.4,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 19.95,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 20.45,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 20.95,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 21.45,
        "durationSeconds": 0.4,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 21.95,
        "durationSeconds": 2.2,
        "label": "C4"
      }
    ]
  },
  {
    "id": "melody_lvl2_synthwave_neon",
    "title": "Synthwave 80s Neon Arp Hook",
    "category": "melody",
    "level": 2,
    "icon": "🌆",
    "bpm": 105,
    "difficulty": "Débutant+",
    "description": "Arpèges rétro-futuristes en croches régulières et cascades de notes néon sur basse La mineur.",
    "durationSeconds": 30,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.4,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 0.52,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 1.04,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 1.56,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 2.08,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 2.6,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 3.12,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 3.64,
        "durationSeconds": 0.4,
        "label": "D4"
      },
      {
        "note": 57,
        "startSeconds": 4.16,
        "durationSeconds": 0.4,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 4.68,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 5.2,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 72,
        "startSeconds": 5.72,
        "durationSeconds": 0.4,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 6.24,
        "durationSeconds": 0.4,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 6.76,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 7.28,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 7.8,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 8.32,
        "durationSeconds": 0.4,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 8.84,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 9.36,
        "durationSeconds": 0.4,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 9.88,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 10.4,
        "durationSeconds": 0.4,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 10.92,
        "durationSeconds": 0.4,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 11.44,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 11.96,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 12.48,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 13,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 13.52,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 14.04,
        "durationSeconds": 0.4,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 14.56,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 15.08,
        "durationSeconds": 0.4,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 15.6,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 16.12,
        "durationSeconds": 0.4,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 16.64,
        "durationSeconds": 0.4,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 17.16,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 17.68,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 18.2,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 18.72,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 19.24,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 19.76,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 20.28,
        "durationSeconds": 0.4,
        "label": "D4"
      },
      {
        "note": 57,
        "startSeconds": 20.8,
        "durationSeconds": 0.4,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 21.32,
        "durationSeconds": 0.4,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 21.84,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 72,
        "startSeconds": 22.36,
        "durationSeconds": 0.4,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 22.88,
        "durationSeconds": 0.4,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 23.4,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 23.92,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 24.44,
        "durationSeconds": 2.5,
        "label": "A4"
      }
    ]
  },
  {
    "id": "melody_lvl3_afrobeat_lead",
    "title": "Afrobeat Syncopated Hook (Burna/Rema style)",
    "category": "melody",
    "level": 3,
    "icon": "🌍",
    "bpm": 108,
    "difficulty": "Intermédiaire",
    "description": "Mélodie dansante syncopée avec appoggiatures, contretemps et phrasé festif de l'Afrique de l'Ouest.",
    "durationSeconds": 30,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.52,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.65,
        "durationSeconds": 0.36000000000000004,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 1.1,
        "durationSeconds": 0.36000000000000004,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 1.55,
        "durationSeconds": 0.52,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 2.2,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 2.65,
        "durationSeconds": 0.36000000000000004,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 3.1,
        "durationSeconds": 0.52,
        "label": "E4"
      },
      {
        "note": 64,
        "startSeconds": 3.75,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 4.2,
        "durationSeconds": 0.36000000000000004,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 4.65,
        "durationSeconds": 0.52,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 5.3,
        "durationSeconds": 0.36000000000000004,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 5.75,
        "durationSeconds": 0.36000000000000004,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 6.2,
        "durationSeconds": 0.52,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 6.85,
        "durationSeconds": 0.36000000000000004,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 7.3,
        "durationSeconds": 0.36000000000000004,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 7.75,
        "durationSeconds": 0.52,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 8.4,
        "durationSeconds": 0.36000000000000004,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 8.85,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 9.3,
        "durationSeconds": 0.52,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 9.95,
        "durationSeconds": 0.36000000000000004,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 10.4,
        "durationSeconds": 0.36000000000000004,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 10.85,
        "durationSeconds": 0.52,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 11.5,
        "durationSeconds": 0.36000000000000004,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 11.95,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 12.4,
        "durationSeconds": 0.52,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 13.05,
        "durationSeconds": 0.36000000000000004,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 13.5,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 13.95,
        "durationSeconds": 0.52,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 14.6,
        "durationSeconds": 0.36000000000000004,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 15.05,
        "durationSeconds": 0.36000000000000004,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 15.5,
        "durationSeconds": 0.52,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 16.15,
        "durationSeconds": 0.36000000000000004,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 16.6,
        "durationSeconds": 0.36000000000000004,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 17.05,
        "durationSeconds": 0.52,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 17.7,
        "durationSeconds": 0.36000000000000004,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 18.15,
        "durationSeconds": 0.36000000000000004,
        "label": "C4"
      }
    ]
  },
  {
    "id": "melody_lvl4_melodic_techno_pluck",
    "title": "Melodic Techno Sequence & Ostinato",
    "category": "melody",
    "level": 4,
    "icon": "⚡",
    "bpm": 126,
    "difficulty": "Intermédiaire+",
    "description": "Ostinato hypnotique en doubles-croches avec modulation subtile du filtre et accents rythmiques.",
    "durationSeconds": 32,
    "recommendedEngine": "FM",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 0.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 69,
        "startSeconds": 0.5,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 57,
        "startSeconds": 0.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 1,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 1.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 67,
        "startSeconds": 1.5,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 57,
        "startSeconds": 1.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 2,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 2.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 2.5,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 2.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 62,
        "startSeconds": 3,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 57,
        "startSeconds": 3.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 3.5,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 3.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 65,
        "startSeconds": 4,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 4.25,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 4.5,
        "durationSeconds": 0.2,
        "label": "C5"
      },
      {
        "note": 65,
        "startSeconds": 4.75,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 5,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 5.25,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 71,
        "startSeconds": 5.5,
        "durationSeconds": 0.2,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 5.75,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 67,
        "startSeconds": 6,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 67,
        "startSeconds": 6.25,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 74,
        "startSeconds": 6.5,
        "durationSeconds": 0.2,
        "label": "D5"
      },
      {
        "note": 67,
        "startSeconds": 6.75,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 7,
        "durationSeconds": 0.2,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 7.25,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 7.5,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 7.75,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 57,
        "startSeconds": 8,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 8.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 69,
        "startSeconds": 8.5,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 57,
        "startSeconds": 8.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 9,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 9.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 67,
        "startSeconds": 9.5,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 57,
        "startSeconds": 9.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 10,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 10.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 10.5,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 10.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 62,
        "startSeconds": 11,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 57,
        "startSeconds": 11.25,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 11.5,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 11.75,
        "durationSeconds": 0.2,
        "label": "A3"
      },
      {
        "note": 65,
        "startSeconds": 12,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 12.25,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 12.5,
        "durationSeconds": 0.2,
        "label": "C5"
      },
      {
        "note": 65,
        "startSeconds": 12.75,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 13,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 13.25,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 71,
        "startSeconds": 13.5,
        "durationSeconds": 0.2,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 13.75,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 67,
        "startSeconds": 14,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 67,
        "startSeconds": 14.25,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 74,
        "startSeconds": 14.5,
        "durationSeconds": 0.2,
        "label": "D5"
      },
      {
        "note": 67,
        "startSeconds": 14.75,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 15,
        "durationSeconds": 0.2,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 15.25,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 15.5,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 15.75,
        "durationSeconds": 0.2,
        "label": "G4"
      }
    ]
  },
  {
    "id": "melody_lvl5_uk_drill_piano",
    "title": "UK Drill Melancholic Minor Piano",
    "category": "melody",
    "level": 5,
    "icon": "🗡️",
    "bpm": 140,
    "difficulty": "Avancé",
    "description": "Mélodie de piano sombre en Ré mineur avec slides expressifs, trilles et appoggiatures courtes.",
    "durationSeconds": 32,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 62,
        "startSeconds": 0,
        "durationSeconds": 0.6,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 0.7,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 1.15,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 1.6,
        "durationSeconds": 0.35,
        "label": "D5"
      },
      {
        "note": 73,
        "startSeconds": 2.05,
        "durationSeconds": 0.35,
        "label": "C#5"
      },
      {
        "note": 74,
        "startSeconds": 2.75,
        "durationSeconds": 0.6,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 3.2,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 3.65,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 4.1,
        "durationSeconds": 0.35,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 4.8,
        "durationSeconds": 0.35,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 5.25,
        "durationSeconds": 0.6,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 5.7,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 70,
        "startSeconds": 6.15,
        "durationSeconds": 0.35,
        "label": "A#4"
      },
      {
        "note": 74,
        "startSeconds": 6.85,
        "durationSeconds": 0.35,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 7.3,
        "durationSeconds": 0.35,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 7.75,
        "durationSeconds": 0.6,
        "label": "D5"
      },
      {
        "note": 70,
        "startSeconds": 8.2,
        "durationSeconds": 0.35,
        "label": "A#4"
      },
      {
        "note": 69,
        "startSeconds": 8.9,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 9.35,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 9.8,
        "durationSeconds": 0.35,
        "label": "D4"
      },
      {
        "note": 61,
        "startSeconds": 10.25,
        "durationSeconds": 0.6,
        "label": "C#4"
      },
      {
        "note": 64,
        "startSeconds": 10.95,
        "durationSeconds": 0.35,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 11.4,
        "durationSeconds": 0.35,
        "label": "G4"
      },
      {
        "note": 73,
        "startSeconds": 11.85,
        "durationSeconds": 0.35,
        "label": "C#5"
      },
      {
        "note": 72,
        "startSeconds": 12.3,
        "durationSeconds": 0.35,
        "label": "C5"
      },
      {
        "note": 73,
        "startSeconds": 13,
        "durationSeconds": 0.6,
        "label": "C#5"
      },
      {
        "note": 67,
        "startSeconds": 13.45,
        "durationSeconds": 0.35,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 13.9,
        "durationSeconds": 0.35,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 14.35,
        "durationSeconds": 0.35,
        "label": "D4"
      },
      {
        "note": 61,
        "startSeconds": 15.05,
        "durationSeconds": 0.35,
        "label": "C#4"
      },
      {
        "note": 62,
        "startSeconds": 15.5,
        "durationSeconds": 0.6,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 15.95,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 16.4,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 17.1,
        "durationSeconds": 0.35,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 17.55,
        "durationSeconds": 0.35,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 18,
        "durationSeconds": 0.6,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 18.45,
        "durationSeconds": 0.35,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 19.15,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 19.6,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 20.05,
        "durationSeconds": 0.35,
        "label": "D4"
      }
    ]
  },
  {
    "id": "melody_lvl6_french_touch_disco",
    "title": "French Touch Filtered Disco Lead",
    "category": "melody",
    "level": 6,
    "icon": "🪩",
    "bpm": 122,
    "difficulty": "Avancé+",
    "description": "Riff disco funky ultra-syncopé à la Daft Punk / Modjo avec jeu rapide sur 2 octaves.",
    "durationSeconds": 32,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 0.33,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 72,
        "startSeconds": 0.66,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 0.99,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 1.32,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 1.65,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 1.98,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.31,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 2.64,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 2.97,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 3.3,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 60,
        "startSeconds": 3.63,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 3.96,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 4.29,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 4.62,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 4.95,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 5.28,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 5.61,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 5.94,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 6.27,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 6.6,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 6.93,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 7.26,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 7.59,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 7.92,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 8.25,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 74,
        "startSeconds": 8.58,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 8.91,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 9.24,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 66,
        "startSeconds": 9.57,
        "durationSeconds": 0.28,
        "label": "F#4"
      },
      {
        "note": 69,
        "startSeconds": 9.9,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 10.23,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 10.56,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 10.89,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 11.22,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 62,
        "startSeconds": 11.55,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 11.88,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 67,
        "startSeconds": 12.21,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 76,
        "startSeconds": 12.54,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 12.87,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 13.2,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 13.53,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 13.86,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 14.19,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 14.52,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 14.85,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 15.18,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 15.51,
        "durationSeconds": 0.28,
        "label": "G4"
      }
    ]
  },
  {
    "id": "melody_lvl7_future_bass_drop",
    "title": "Future Bass Supersaw Drop Lead",
    "category": "melody",
    "level": 7,
    "icon": "💎",
    "bpm": 150,
    "difficulty": "Pro",
    "description": "Drop explosif avec sauts de 7ème et 9ème, phrasé syncopé et arpèges scintillants.",
    "durationSeconds": 34,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.32,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 0.64,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 0.96,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 1.28,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 1.6,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 1.92,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.24,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 2.56,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 2.88,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 3.2,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 3.52,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 3.84,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 4.16,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 4.48,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 4.8,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 5.12,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 5.44,
        "durationSeconds": 0.25,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 5.76,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 6.08,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 6.4,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 6.72,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 7.04,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 7.36,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 79,
        "startSeconds": 7.68,
        "durationSeconds": 0.45,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 8,
        "durationSeconds": 0.25,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 8.32,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 8.64,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 64,
        "startSeconds": 8.96,
        "durationSeconds": 0.45,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 9.28,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 9.6,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 9.92,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 78,
        "startSeconds": 10.24,
        "durationSeconds": 0.45,
        "label": "F#5"
      },
      {
        "note": 76,
        "startSeconds": 10.56,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 10.88,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 11.2,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 11.52,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 11.84,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 81,
        "startSeconds": 12.16,
        "durationSeconds": 0.25,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 12.48,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 12.8,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 13.12,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 65,
        "startSeconds": 13.44,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 13.76,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 14.08,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 14.4,
        "durationSeconds": 0.25,
        "label": "F5"
      },
      {
        "note": 79,
        "startSeconds": 14.72,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 15.04,
        "durationSeconds": 0.25,
        "label": "F5"
      },
      {
        "note": 72,
        "startSeconds": 15.36,
        "durationSeconds": 0.45,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 15.68,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 16,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 16.32,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 83,
        "startSeconds": 16.64,
        "durationSeconds": 0.45,
        "label": "B5"
      },
      {
        "note": 79,
        "startSeconds": 16.96,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 74,
        "startSeconds": 17.28,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 17.6,
        "durationSeconds": 0.25,
        "label": "B4"
      }
    ]
  },
  {
    "id": "melody_lvl8_hyperpop_glitch_runs",
    "title": "Hyperpop Glitch High-Speed Runs",
    "category": "melody",
    "level": 8,
    "icon": "🍭",
    "bpm": 160,
    "difficulty": "Pro+",
    "description": "Cascades supersoniques de triples-croches et arpèges numériques virtuoses.",
    "durationSeconds": 32,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.18,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 0.23,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 0.46,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.69,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 0.92,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 1.15,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 1.38,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 1.61,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 1.84,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 2.07,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 2.3,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 2.53,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 2.76,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 2.99,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 3.22,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 3.45,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 3.68,
        "durationSeconds": 0.18,
        "label": "F4"
      },
      {
        "note": 67,
        "startSeconds": 3.91,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 4.14,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 4.37,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 4.6,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 4.83,
        "durationSeconds": 0.18,
        "label": "F5"
      },
      {
        "note": 79,
        "startSeconds": 5.06,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 81,
        "startSeconds": 5.29,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 84,
        "startSeconds": 5.52,
        "durationSeconds": 0.18,
        "label": "C6"
      },
      {
        "note": 81,
        "startSeconds": 5.75,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 5.98,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 6.21,
        "durationSeconds": 0.18,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 6.44,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 6.67,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 6.9,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 7.13,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 7.36,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 7.59,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 7.82,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 8.05,
        "durationSeconds": 0.18,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 8.28,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 8.51,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 8.74,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 83,
        "startSeconds": 8.97,
        "durationSeconds": 0.18,
        "label": "B5"
      },
      {
        "note": 81,
        "startSeconds": 9.2,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 9.43,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 9.66,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 9.89,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 10.12,
        "durationSeconds": 0.18,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 10.35,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 10.58,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 10.81,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 11.04,
        "durationSeconds": 0.18,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 11.27,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 11.5,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 11.73,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 11.96,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 12.19,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 12.42,
        "durationSeconds": 0.18,
        "label": "C6"
      },
      {
        "note": 88,
        "startSeconds": 12.65,
        "durationSeconds": 0.18,
        "label": "E6"
      },
      {
        "note": 84,
        "startSeconds": 12.88,
        "durationSeconds": 0.18,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 13.11,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 13.34,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 13.57,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 13.8,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 14.03,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 14.26,
        "durationSeconds": 0.18,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 14.49,
        "durationSeconds": 0.18,
        "label": "A3"
      }
    ]
  },
  {
    "id": "melody_lvl9_cyberpunk_heavy_bass",
    "title": "Cyberpunk 2077 Heavy Synth Bassline",
    "category": "melody",
    "level": 9,
    "icon": "🤖",
    "bpm": 130,
    "difficulty": "Expert",
    "description": "Ligne de basse distordue agressive avec syncopes, contre-temps et modulations d'octaves rapides.",
    "durationSeconds": 34,
    "recommendedEngine": "Voltage",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 53,
        "startSeconds": 0,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 53,
        "startSeconds": 0.26,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 65,
        "startSeconds": 0.52,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 53,
        "startSeconds": 0.78,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 56,
        "startSeconds": 1.04,
        "durationSeconds": 0.22,
        "label": "G#3"
      },
      {
        "note": 53,
        "startSeconds": 1.3,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 58,
        "startSeconds": 1.56,
        "durationSeconds": 0.22,
        "label": "A#3"
      },
      {
        "note": 53,
        "startSeconds": 1.82,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 60,
        "startSeconds": 2.08,
        "durationSeconds": 0.22,
        "label": "C4"
      },
      {
        "note": 53,
        "startSeconds": 2.34,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 63,
        "startSeconds": 2.6,
        "durationSeconds": 0.22,
        "label": "D#4"
      },
      {
        "note": 53,
        "startSeconds": 2.86,
        "durationSeconds": 0.22,
        "label": "F3"
      },
      {
        "note": 65,
        "startSeconds": 3.12,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 63,
        "startSeconds": 3.38,
        "durationSeconds": 0.22,
        "label": "D#4"
      },
      {
        "note": 60,
        "startSeconds": 3.64,
        "durationSeconds": 0.22,
        "label": "C4"
      },
      {
        "note": 58,
        "startSeconds": 3.9,
        "durationSeconds": 0.22,
        "label": "A#3"
      },
      {
        "note": 51,
        "startSeconds": 4.16,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 51,
        "startSeconds": 4.42,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 63,
        "startSeconds": 4.68,
        "durationSeconds": 0.22,
        "label": "D#4"
      },
      {
        "note": 51,
        "startSeconds": 4.94,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 54,
        "startSeconds": 5.2,
        "durationSeconds": 0.22,
        "label": "F#3"
      },
      {
        "note": 51,
        "startSeconds": 5.46,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 56,
        "startSeconds": 5.72,
        "durationSeconds": 0.22,
        "label": "G#3"
      },
      {
        "note": 51,
        "startSeconds": 5.98,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 58,
        "startSeconds": 6.24,
        "durationSeconds": 0.22,
        "label": "A#3"
      },
      {
        "note": 51,
        "startSeconds": 6.5,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 61,
        "startSeconds": 6.76,
        "durationSeconds": 0.22,
        "label": "C#4"
      },
      {
        "note": 51,
        "startSeconds": 7.02,
        "durationSeconds": 0.22,
        "label": "D#3"
      },
      {
        "note": 63,
        "startSeconds": 7.28,
        "durationSeconds": 0.22,
        "label": "D#4"
      },
      {
        "note": 61,
        "startSeconds": 7.54,
        "durationSeconds": 0.22,
        "label": "C#4"
      },
      {
        "note": 58,
        "startSeconds": 7.8,
        "durationSeconds": 0.22,
        "label": "A#3"
      },
      {
        "note": 56,
        "startSeconds": 8.06,
        "durationSeconds": 0.22,
        "label": "G#3"
      },
      {
        "note": 49,
        "startSeconds": 8.32,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 49,
        "startSeconds": 8.58,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 61,
        "startSeconds": 8.84,
        "durationSeconds": 0.22,
        "label": "C#4"
      },
      {
        "note": 49,
        "startSeconds": 9.1,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 52,
        "startSeconds": 9.36,
        "durationSeconds": 0.22,
        "label": "E3"
      },
      {
        "note": 49,
        "startSeconds": 9.62,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 54,
        "startSeconds": 9.88,
        "durationSeconds": 0.22,
        "label": "F#3"
      },
      {
        "note": 49,
        "startSeconds": 10.14,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 56,
        "startSeconds": 10.4,
        "durationSeconds": 0.22,
        "label": "G#3"
      },
      {
        "note": 49,
        "startSeconds": 10.66,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 59,
        "startSeconds": 10.92,
        "durationSeconds": 0.22,
        "label": "B3"
      },
      {
        "note": 49,
        "startSeconds": 11.18,
        "durationSeconds": 0.22,
        "label": "C#3"
      },
      {
        "note": 61,
        "startSeconds": 11.44,
        "durationSeconds": 0.22,
        "label": "C#4"
      },
      {
        "note": 59,
        "startSeconds": 11.7,
        "durationSeconds": 0.22,
        "label": "B3"
      },
      {
        "note": 56,
        "startSeconds": 11.96,
        "durationSeconds": 0.22,
        "label": "G#3"
      },
      {
        "note": 54,
        "startSeconds": 12.22,
        "durationSeconds": 0.22,
        "label": "F#3"
      },
      {
        "note": 55,
        "startSeconds": 12.48,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 55,
        "startSeconds": 12.74,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 67,
        "startSeconds": 13,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 55,
        "startSeconds": 13.26,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 58,
        "startSeconds": 13.52,
        "durationSeconds": 0.22,
        "label": "A#3"
      },
      {
        "note": 55,
        "startSeconds": 13.78,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 60,
        "startSeconds": 14.04,
        "durationSeconds": 0.22,
        "label": "C4"
      },
      {
        "note": 55,
        "startSeconds": 14.3,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 62,
        "startSeconds": 14.56,
        "durationSeconds": 0.22,
        "label": "D4"
      },
      {
        "note": 55,
        "startSeconds": 14.82,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 65,
        "startSeconds": 15.08,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 55,
        "startSeconds": 15.34,
        "durationSeconds": 0.22,
        "label": "G3"
      },
      {
        "note": 67,
        "startSeconds": 15.6,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 15.86,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 16.12,
        "durationSeconds": 0.22,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 16.38,
        "durationSeconds": 0.22,
        "label": "C4"
      }
    ]
  },
  {
    "id": "melody_lvl10_neosoul_virtuoso",
    "title": "Neo-Soul Jazz Sweeps & Riffs Virtuose",
    "category": "melody",
    "level": 10,
    "icon": "👑",
    "bpm": 92,
    "difficulty": "Grand Maître",
    "description": "Phrasé jazz/soul complexe à la Cory Henry / Robert Glasper avec trilles, extensions 9e/11e/13e et glissés ultra-rapides.",
    "durationSeconds": 36,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.35,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 0.22,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 63,
        "startSeconds": 0.44,
        "durationSeconds": 0.18,
        "label": "D#4"
      },
      {
        "note": 64,
        "startSeconds": 0.66,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.88,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 1.1,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 1.32,
        "durationSeconds": 0.35,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 1.54,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 1.76,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 1.98,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 2.2,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 2.42,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 2.64,
        "durationSeconds": 0.35,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 2.86,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 3.08,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 3.3,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 63,
        "startSeconds": 3.52,
        "durationSeconds": 0.18,
        "label": "D#4"
      },
      {
        "note": 62,
        "startSeconds": 3.74,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 3.96,
        "durationSeconds": 0.35,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 4.18,
        "durationSeconds": 0.18,
        "label": "F4"
      },
      {
        "note": 67,
        "startSeconds": 4.4,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 68,
        "startSeconds": 4.62,
        "durationSeconds": 0.18,
        "label": "G#4"
      },
      {
        "note": 69,
        "startSeconds": 4.84,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 5.06,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 5.28,
        "durationSeconds": 0.35,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 5.5,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 77,
        "startSeconds": 5.72,
        "durationSeconds": 0.18,
        "label": "F5"
      },
      {
        "note": 79,
        "startSeconds": 5.94,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 81,
        "startSeconds": 6.16,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 6.38,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 6.6,
        "durationSeconds": 0.35,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 6.82,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 7.04,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 7.26,
        "durationSeconds": 0.18,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 7.48,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 68,
        "startSeconds": 7.7,
        "durationSeconds": 0.18,
        "label": "G#4"
      },
      {
        "note": 67,
        "startSeconds": 7.92,
        "durationSeconds": 0.35,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 8.14,
        "durationSeconds": 0.18,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 8.36,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 8.58,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 65,
        "startSeconds": 8.8,
        "durationSeconds": 0.18,
        "label": "F4"
      },
      {
        "note": 66,
        "startSeconds": 9.02,
        "durationSeconds": 0.18,
        "label": "F#4"
      },
      {
        "note": 69,
        "startSeconds": 9.24,
        "durationSeconds": 0.35,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 9.46,
        "durationSeconds": 0.18,
        "label": "B4"
      },
      {
        "note": 73,
        "startSeconds": 9.68,
        "durationSeconds": 0.18,
        "label": "C#5"
      },
      {
        "note": 74,
        "startSeconds": 9.9,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 10.12,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 78,
        "startSeconds": 10.34,
        "durationSeconds": 0.18,
        "label": "F#5"
      },
      {
        "note": 76,
        "startSeconds": 10.56,
        "durationSeconds": 0.35,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 10.78,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 73,
        "startSeconds": 11,
        "durationSeconds": 0.18,
        "label": "C#5"
      },
      {
        "note": 71,
        "startSeconds": 11.22,
        "durationSeconds": 0.18,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 11.44,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 66,
        "startSeconds": 11.66,
        "durationSeconds": 0.18,
        "label": "F#4"
      },
      {
        "note": 65,
        "startSeconds": 11.88,
        "durationSeconds": 0.35,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 12.1,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 12.32,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 12.54,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 12.76,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 70,
        "startSeconds": 12.98,
        "durationSeconds": 0.18,
        "label": "A#4"
      },
      {
        "note": 71,
        "startSeconds": 13.2,
        "durationSeconds": 0.35,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 13.42,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 13.64,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 78,
        "startSeconds": 13.86,
        "durationSeconds": 0.18,
        "label": "F#5"
      },
      {
        "note": 79,
        "startSeconds": 14.08,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 81,
        "startSeconds": 14.3,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 83,
        "startSeconds": 14.52,
        "durationSeconds": 0.35,
        "label": "B5"
      },
      {
        "note": 81,
        "startSeconds": 14.74,
        "durationSeconds": 0.18,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 14.96,
        "durationSeconds": 0.18,
        "label": "G5"
      },
      {
        "note": 78,
        "startSeconds": 15.18,
        "durationSeconds": 0.18,
        "label": "F#5"
      },
      {
        "note": 76,
        "startSeconds": 15.4,
        "durationSeconds": 0.18,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 15.62,
        "durationSeconds": 0.18,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 15.84,
        "durationSeconds": 0.35,
        "label": "B4"
      },
      {
        "note": 70,
        "startSeconds": 16.06,
        "durationSeconds": 0.18,
        "label": "A#4"
      },
      {
        "note": 69,
        "startSeconds": 16.28,
        "durationSeconds": 0.18,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 16.5,
        "durationSeconds": 0.18,
        "label": "G4"
      }
    ]
  },
  {
    "id": "chord_lvl1_basic_triads",
    "title": "Triades Fondamentales (C – F – G – Am)",
    "category": "chord",
    "level": 1,
    "icon": "🎼",
    "bpm": 80,
    "difficulty": "Débutant",
    "description": "Apprentissage des 4 triades majeures et mineures fondamentales en position fondamentale.",
    "durationSeconds": 28,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 53,
        "startSeconds": 1.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 1.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 1.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 55,
        "startSeconds": 3,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 3,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 3,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 4.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 4.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 4.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 6,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 6,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 6,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 53,
        "startSeconds": 7.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 7.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 7.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 55,
        "startSeconds": 9,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 9,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 9,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 10.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 10.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 10.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 12,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 12,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 12,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 53,
        "startSeconds": 13.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 13.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 13.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 55,
        "startSeconds": 15,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 15,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 15,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 16.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 16.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 16.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 18,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 18,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 18,
        "durationSeconds": 1.35,
        "label": "C Maj"
      },
      {
        "note": 53,
        "startSeconds": 19.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 19.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 19.5,
        "durationSeconds": 1.35,
        "label": "F Maj"
      },
      {
        "note": 55,
        "startSeconds": 21,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 21,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 21,
        "durationSeconds": 1.35,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 22.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 22.5,
        "durationSeconds": 1.35,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 22.5,
        "durationSeconds": 1.35,
        "label": "Am"
      }
    ]
  },
  {
    "id": "chord_lvl2_pop_anthem_progression",
    "title": "Pop Anthem (I – V – vi – IV)",
    "category": "chord",
    "level": 2,
    "icon": "🌟",
    "bpm": 95,
    "difficulty": "Débutant+",
    "description": "La progression d'accords la plus célèbre de l'histoire de la musique pop moderne (C - G - Am - F).",
    "durationSeconds": 28,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 55,
        "startSeconds": 1.26,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 1.26,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 1.26,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 2.53,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 2.53,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 2.53,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 53,
        "startSeconds": 3.79,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 3.79,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 3.79,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 5.05,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 5.05,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 5.05,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 55,
        "startSeconds": 6.32,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 6.32,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 6.32,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 7.58,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 7.58,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 7.58,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 53,
        "startSeconds": 8.84,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 8.84,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 8.84,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 10.11,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 10.11,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 10.11,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 55,
        "startSeconds": 11.37,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 11.37,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 11.37,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 12.63,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 12.63,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 12.63,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 53,
        "startSeconds": 13.89,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 13.89,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 13.89,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 15.16,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 64,
        "startSeconds": 15.16,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 67,
        "startSeconds": 15.16,
        "durationSeconds": 1.14,
        "label": "C Maj"
      },
      {
        "note": 55,
        "startSeconds": 16.42,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 16.42,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 16.42,
        "durationSeconds": 1.14,
        "label": "G Maj"
      },
      {
        "note": 57,
        "startSeconds": 17.68,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 60,
        "startSeconds": 17.68,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 64,
        "startSeconds": 17.68,
        "durationSeconds": 1.14,
        "label": "Am"
      },
      {
        "note": 53,
        "startSeconds": 18.95,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 57,
        "startSeconds": 18.95,
        "durationSeconds": 1.14,
        "label": "F Maj"
      },
      {
        "note": 60,
        "startSeconds": 18.95,
        "durationSeconds": 1.14,
        "label": "F Maj"
      }
    ]
  },
  {
    "id": "chord_lvl3_lofi_jazzy_keys",
    "title": "Lo-Fi Jazzy 7th Keys (Am7 – Dm7 – Em7 – Fmaj7)",
    "category": "chord",
    "level": 3,
    "icon": "☕",
    "bpm": 82,
    "difficulty": "Intermédiaire",
    "description": "Accords de septièmes chaleureux et relaxants pour beats Lo-Fi d'étude.",
    "durationSeconds": 30,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 1.46,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 1.46,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 1.46,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 1.46,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 64,
        "startSeconds": 2.93,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 2.93,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 2.93,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 2.93,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 53,
        "startSeconds": 4.39,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 4.39,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 4.39,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 4.39,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 5.85,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 5.85,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 5.85,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 5.85,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 7.32,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 7.32,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 7.32,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 7.32,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 64,
        "startSeconds": 8.78,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 8.78,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 8.78,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 8.78,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 53,
        "startSeconds": 10.24,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 10.24,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 10.24,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 10.24,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 11.71,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 11.71,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 11.71,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 11.71,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 13.17,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 13.17,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 13.17,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 13.17,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 64,
        "startSeconds": 14.63,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 14.63,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 14.63,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 14.63,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 53,
        "startSeconds": 16.1,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 16.1,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 16.1,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 16.1,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 17.56,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 17.56,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 17.56,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 17.56,
        "durationSeconds": 1.32,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 19.02,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 19.02,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 19.02,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 19.02,
        "durationSeconds": 1.32,
        "label": "Dm7"
      },
      {
        "note": 64,
        "startSeconds": 20.49,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 20.49,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 20.49,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 20.49,
        "durationSeconds": 1.32,
        "label": "Em7"
      },
      {
        "note": 53,
        "startSeconds": 21.95,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 21.95,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 21.95,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 21.95,
        "durationSeconds": 1.32,
        "label": "Fmaj7"
      }
    ]
  },
  {
    "id": "chord_lvl4_dark_trap_minor",
    "title": "Dark Trap Minor (Cm – Ab – Fm – G)",
    "category": "chord",
    "level": 4,
    "icon": "🕷️",
    "bpm": 135,
    "difficulty": "Intermédiaire+",
    "description": "Progression mineure dramatique et ténébreuse avec accords suspendus.",
    "durationSeconds": 30,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 0,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 0.89,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 0.89,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 0.89,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 1.78,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 1.78,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 1.78,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 2.67,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 2.67,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 2.67,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 60,
        "startSeconds": 3.56,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 3.56,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 3.56,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 4.44,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 4.44,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 4.44,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 5.33,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 5.33,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 5.33,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 6.22,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 6.22,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 6.22,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 60,
        "startSeconds": 7.11,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 7.11,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 7.11,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 8,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 8,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 8,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 8.89,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 8.89,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 8.89,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 9.78,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 9.78,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 9.78,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 60,
        "startSeconds": 10.67,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 10.67,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 10.67,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 11.56,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 11.56,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 11.56,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 12.44,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 12.44,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 12.44,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 13.33,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 13.33,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 13.33,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 60,
        "startSeconds": 14.22,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 14.22,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 14.22,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 15.11,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 15.11,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 15.11,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 16,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 16,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 16,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 16.89,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 16.89,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 16.89,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 60,
        "startSeconds": 17.78,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 63,
        "startSeconds": 17.78,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 67,
        "startSeconds": 17.78,
        "durationSeconds": 0.8,
        "label": "Cm"
      },
      {
        "note": 56,
        "startSeconds": 18.67,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 60,
        "startSeconds": 18.67,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 63,
        "startSeconds": 18.67,
        "durationSeconds": 0.8,
        "label": "Ab"
      },
      {
        "note": 53,
        "startSeconds": 19.56,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 56,
        "startSeconds": 19.56,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 60,
        "startSeconds": 19.56,
        "durationSeconds": 0.8,
        "label": "Fm"
      },
      {
        "note": 55,
        "startSeconds": 20.44,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 59,
        "startSeconds": 20.44,
        "durationSeconds": 0.8,
        "label": "G Maj"
      },
      {
        "note": 62,
        "startSeconds": 20.44,
        "durationSeconds": 0.8,
        "label": "G Maj"
      }
    ]
  },
  {
    "id": "chord_lvl5_nudisco_stabs",
    "title": "House & Nu-Disco Stabs (Dm9 – Gm7 – C9 – Fmaj7)",
    "category": "chord",
    "level": 5,
    "icon": "🕺",
    "bpm": 122,
    "difficulty": "Avancé",
    "description": "Accords staccato syncopés avec extensions de 9ème pour grooves dansants.",
    "durationSeconds": 30,
    "recommendedEngine": "FM",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 62,
        "startSeconds": 0,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 0,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 0,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 0,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 0.98,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 58,
        "startSeconds": 0.98,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 62,
        "startSeconds": 0.98,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 65,
        "startSeconds": 0.98,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 60,
        "startSeconds": 1.97,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 64,
        "startSeconds": 1.97,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 67,
        "startSeconds": 1.97,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 70,
        "startSeconds": 1.97,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 53,
        "startSeconds": 2.95,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 2.95,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 2.95,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 2.95,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 62,
        "startSeconds": 3.93,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 3.93,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 3.93,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 3.93,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 4.92,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 58,
        "startSeconds": 4.92,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 62,
        "startSeconds": 4.92,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 65,
        "startSeconds": 4.92,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 60,
        "startSeconds": 5.9,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 64,
        "startSeconds": 5.9,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 67,
        "startSeconds": 5.9,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 70,
        "startSeconds": 5.9,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 53,
        "startSeconds": 6.89,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 6.89,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 6.89,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 6.89,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 62,
        "startSeconds": 7.87,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 7.87,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 7.87,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 7.87,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 8.85,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 58,
        "startSeconds": 8.85,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 62,
        "startSeconds": 8.85,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 65,
        "startSeconds": 8.85,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 60,
        "startSeconds": 9.84,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 64,
        "startSeconds": 9.84,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 67,
        "startSeconds": 9.84,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 70,
        "startSeconds": 9.84,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 53,
        "startSeconds": 10.82,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 10.82,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 10.82,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 10.82,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 62,
        "startSeconds": 11.8,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 11.8,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 11.8,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 11.8,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 12.79,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 58,
        "startSeconds": 12.79,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 62,
        "startSeconds": 12.79,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 65,
        "startSeconds": 12.79,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 60,
        "startSeconds": 13.77,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 64,
        "startSeconds": 13.77,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 67,
        "startSeconds": 13.77,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 70,
        "startSeconds": 13.77,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 53,
        "startSeconds": 14.75,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 14.75,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 14.75,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 14.75,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 62,
        "startSeconds": 15.74,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 15.74,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 15.74,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 15.74,
        "durationSeconds": 0.89,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 16.72,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 58,
        "startSeconds": 16.72,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 62,
        "startSeconds": 16.72,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 65,
        "startSeconds": 16.72,
        "durationSeconds": 0.89,
        "label": "Gm7"
      },
      {
        "note": 60,
        "startSeconds": 17.7,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 64,
        "startSeconds": 17.7,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 67,
        "startSeconds": 17.7,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 70,
        "startSeconds": 17.7,
        "durationSeconds": 0.89,
        "label": "C9"
      },
      {
        "note": 53,
        "startSeconds": 18.69,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 18.69,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 18.69,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 18.69,
        "durationSeconds": 0.89,
        "label": "Fmaj7"
      }
    ]
  },
  {
    "id": "chord_lvl6_amapiano_deep_chords",
    "title": "Amapiano Deep Lush Chords (Ebm7 – Bbm7 – Abm7)",
    "category": "chord",
    "level": 6,
    "icon": "🌴",
    "bpm": 112,
    "difficulty": "Avancé+",
    "description": "Harmonies amapiano sud-africaines profondes et envoûtantes avec accords de passage.",
    "durationSeconds": 32,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 63,
        "startSeconds": 0,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 66,
        "startSeconds": 0,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 70,
        "startSeconds": 0,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 73,
        "startSeconds": 0,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 58,
        "startSeconds": 1.07,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 61,
        "startSeconds": 1.07,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 65,
        "startSeconds": 1.07,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 68,
        "startSeconds": 1.07,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 56,
        "startSeconds": 2.14,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 59,
        "startSeconds": 2.14,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 63,
        "startSeconds": 2.14,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 66,
        "startSeconds": 2.14,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 61,
        "startSeconds": 3.21,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 65,
        "startSeconds": 3.21,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 68,
        "startSeconds": 3.21,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 71,
        "startSeconds": 3.21,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 63,
        "startSeconds": 4.29,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 66,
        "startSeconds": 4.29,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 70,
        "startSeconds": 4.29,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 73,
        "startSeconds": 4.29,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 58,
        "startSeconds": 5.36,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 61,
        "startSeconds": 5.36,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 65,
        "startSeconds": 5.36,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 68,
        "startSeconds": 5.36,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 56,
        "startSeconds": 6.43,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 59,
        "startSeconds": 6.43,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 63,
        "startSeconds": 6.43,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 66,
        "startSeconds": 6.43,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 61,
        "startSeconds": 7.5,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 65,
        "startSeconds": 7.5,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 68,
        "startSeconds": 7.5,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 71,
        "startSeconds": 7.5,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 63,
        "startSeconds": 8.57,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 66,
        "startSeconds": 8.57,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 70,
        "startSeconds": 8.57,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 73,
        "startSeconds": 8.57,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 58,
        "startSeconds": 9.64,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 61,
        "startSeconds": 9.64,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 65,
        "startSeconds": 9.64,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 68,
        "startSeconds": 9.64,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 56,
        "startSeconds": 10.71,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 59,
        "startSeconds": 10.71,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 63,
        "startSeconds": 10.71,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 66,
        "startSeconds": 10.71,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 61,
        "startSeconds": 11.79,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 65,
        "startSeconds": 11.79,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 68,
        "startSeconds": 11.79,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 71,
        "startSeconds": 11.79,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 63,
        "startSeconds": 12.86,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 66,
        "startSeconds": 12.86,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 70,
        "startSeconds": 12.86,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 73,
        "startSeconds": 12.86,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 58,
        "startSeconds": 13.93,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 61,
        "startSeconds": 13.93,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 65,
        "startSeconds": 13.93,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 68,
        "startSeconds": 13.93,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 56,
        "startSeconds": 15,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 59,
        "startSeconds": 15,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 63,
        "startSeconds": 15,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 66,
        "startSeconds": 15,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 61,
        "startSeconds": 16.07,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 65,
        "startSeconds": 16.07,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 68,
        "startSeconds": 16.07,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 71,
        "startSeconds": 16.07,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 63,
        "startSeconds": 17.14,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 66,
        "startSeconds": 17.14,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 70,
        "startSeconds": 17.14,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 73,
        "startSeconds": 17.14,
        "durationSeconds": 0.96,
        "label": "Ebm7"
      },
      {
        "note": 58,
        "startSeconds": 18.21,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 61,
        "startSeconds": 18.21,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 65,
        "startSeconds": 18.21,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 68,
        "startSeconds": 18.21,
        "durationSeconds": 0.96,
        "label": "Bbm7"
      },
      {
        "note": 56,
        "startSeconds": 19.29,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 59,
        "startSeconds": 19.29,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 63,
        "startSeconds": 19.29,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 66,
        "startSeconds": 19.29,
        "durationSeconds": 0.96,
        "label": "Abm7"
      },
      {
        "note": 61,
        "startSeconds": 20.36,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 65,
        "startSeconds": 20.36,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 68,
        "startSeconds": 20.36,
        "durationSeconds": 0.96,
        "label": "Db7"
      },
      {
        "note": 71,
        "startSeconds": 20.36,
        "durationSeconds": 0.96,
        "label": "Db7"
      }
    ]
  },
  {
    "id": "chord_lvl7_neosoul_9th_voicings",
    "title": "Neo-Soul 9th & 11th Voicings (Dmaj9 – C#m7 – Bm9 – A13)",
    "category": "chord",
    "level": 7,
    "icon": "✨",
    "bpm": 88,
    "difficulty": "Pro",
    "description": "Voicings raffinés à 4 et 5 voix avec enrichissements harmoniques avancés.",
    "durationSeconds": 32,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 62,
        "startSeconds": 0,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 66,
        "startSeconds": 0,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 69,
        "startSeconds": 0,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 73,
        "startSeconds": 0,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 76,
        "startSeconds": 0,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 61,
        "startSeconds": 1.36,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 64,
        "startSeconds": 1.36,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 68,
        "startSeconds": 1.36,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 71,
        "startSeconds": 1.36,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 59,
        "startSeconds": 2.73,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 62,
        "startSeconds": 2.73,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 66,
        "startSeconds": 2.73,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 69,
        "startSeconds": 2.73,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 73,
        "startSeconds": 2.73,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 57,
        "startSeconds": 4.09,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 61,
        "startSeconds": 4.09,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 64,
        "startSeconds": 4.09,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 67,
        "startSeconds": 4.09,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 71,
        "startSeconds": 4.09,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 62,
        "startSeconds": 5.45,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 66,
        "startSeconds": 5.45,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 69,
        "startSeconds": 5.45,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 73,
        "startSeconds": 5.45,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 76,
        "startSeconds": 5.45,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 61,
        "startSeconds": 6.82,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 64,
        "startSeconds": 6.82,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 68,
        "startSeconds": 6.82,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 71,
        "startSeconds": 6.82,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 59,
        "startSeconds": 8.18,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 62,
        "startSeconds": 8.18,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 66,
        "startSeconds": 8.18,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 69,
        "startSeconds": 8.18,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 73,
        "startSeconds": 8.18,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 57,
        "startSeconds": 9.55,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 61,
        "startSeconds": 9.55,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 64,
        "startSeconds": 9.55,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 67,
        "startSeconds": 9.55,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 71,
        "startSeconds": 9.55,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 62,
        "startSeconds": 10.91,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 66,
        "startSeconds": 10.91,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 69,
        "startSeconds": 10.91,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 73,
        "startSeconds": 10.91,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 76,
        "startSeconds": 10.91,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 61,
        "startSeconds": 12.27,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 64,
        "startSeconds": 12.27,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 68,
        "startSeconds": 12.27,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 71,
        "startSeconds": 12.27,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 59,
        "startSeconds": 13.64,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 62,
        "startSeconds": 13.64,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 66,
        "startSeconds": 13.64,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 69,
        "startSeconds": 13.64,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 73,
        "startSeconds": 13.64,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 57,
        "startSeconds": 15,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 61,
        "startSeconds": 15,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 64,
        "startSeconds": 15,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 67,
        "startSeconds": 15,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 71,
        "startSeconds": 15,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 62,
        "startSeconds": 16.36,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 66,
        "startSeconds": 16.36,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 69,
        "startSeconds": 16.36,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 73,
        "startSeconds": 16.36,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 76,
        "startSeconds": 16.36,
        "durationSeconds": 1.23,
        "label": "Dmaj9"
      },
      {
        "note": 61,
        "startSeconds": 17.73,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 64,
        "startSeconds": 17.73,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 68,
        "startSeconds": 17.73,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 71,
        "startSeconds": 17.73,
        "durationSeconds": 1.23,
        "label": "C#m7"
      },
      {
        "note": 59,
        "startSeconds": 19.09,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 62,
        "startSeconds": 19.09,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 66,
        "startSeconds": 19.09,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 69,
        "startSeconds": 19.09,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 73,
        "startSeconds": 19.09,
        "durationSeconds": 1.23,
        "label": "Bm9"
      },
      {
        "note": 57,
        "startSeconds": 20.45,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 61,
        "startSeconds": 20.45,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 64,
        "startSeconds": 20.45,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 67,
        "startSeconds": 20.45,
        "durationSeconds": 1.23,
        "label": "A13"
      },
      {
        "note": 71,
        "startSeconds": 20.45,
        "durationSeconds": 1.23,
        "label": "A13"
      }
    ]
  },
  {
    "id": "chord_lvl8_future_bass_sidechain",
    "title": "Future Bass Sidechained Grooves",
    "category": "chord",
    "level": 8,
    "icon": "🌊",
    "bpm": 145,
    "difficulty": "Pro+",
    "description": "Accords pompants et percutants avec polyrythmie et syncopes rapides.",
    "durationSeconds": 32,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 63,
        "startSeconds": 0,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 0,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 0,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 0.83,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 0.83,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 0.83,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 0.83,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 1.66,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 1.66,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 1.66,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 1.66,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 2.48,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 2.48,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 2.48,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 2.48,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 63,
        "startSeconds": 3.31,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 3.31,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 3.31,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 3.31,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 4.14,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 4.14,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 4.14,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 4.14,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 4.97,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 4.97,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 4.97,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 4.97,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 5.79,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 5.79,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 5.79,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 5.79,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 63,
        "startSeconds": 6.62,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 6.62,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 6.62,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 6.62,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 7.45,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 7.45,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 7.45,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 7.45,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 8.28,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 8.28,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 8.28,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 8.28,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 9.1,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 9.1,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 9.1,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 9.1,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 63,
        "startSeconds": 9.93,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 9.93,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 9.93,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 9.93,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 10.76,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 10.76,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 10.76,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 10.76,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 11.59,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 11.59,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 11.59,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 11.59,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 12.41,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 12.41,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 12.41,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 12.41,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 63,
        "startSeconds": 13.24,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 13.24,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 13.24,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 13.24,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 14.07,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 14.07,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 14.07,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 14.07,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 14.9,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 14.9,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 14.9,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 14.9,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 15.72,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 15.72,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 15.72,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 15.72,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 63,
        "startSeconds": 16.55,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 16.55,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 16.55,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 16.55,
        "durationSeconds": 0.74,
        "label": "Ebmaj7"
      },
      {
        "note": 65,
        "startSeconds": 17.38,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 69,
        "startSeconds": 17.38,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 72,
        "startSeconds": 17.38,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 75,
        "startSeconds": 17.38,
        "durationSeconds": 0.74,
        "label": "F/Eb"
      },
      {
        "note": 67,
        "startSeconds": 18.21,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 18.21,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 74,
        "startSeconds": 18.21,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 77,
        "startSeconds": 18.21,
        "durationSeconds": 0.74,
        "label": "Gm7"
      },
      {
        "note": 70,
        "startSeconds": 19.03,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 74,
        "startSeconds": 19.03,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 77,
        "startSeconds": 19.03,
        "durationSeconds": 0.74,
        "label": "Bb9"
      },
      {
        "note": 80,
        "startSeconds": 19.03,
        "durationSeconds": 0.74,
        "label": "Bb9"
      }
    ]
  },
  {
    "id": "chord_lvl9_coltrane_giant_steps",
    "title": "Jazz Coltrane Giant Steps Modulations",
    "category": "chord",
    "level": 9,
    "icon": "🎷",
    "bpm": 110,
    "difficulty": "Expert",
    "description": "Les modulations majeures mythiques de John Coltrane en cycles de tierces majeures (B - G - Eb).",
    "durationSeconds": 34,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 59,
        "startSeconds": 0,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 63,
        "startSeconds": 0,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 66,
        "startSeconds": 0,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 70,
        "startSeconds": 0,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 62,
        "startSeconds": 1.09,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 1.09,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 1.09,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 1.09,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 2.18,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 2.18,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 2.18,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 2.18,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 58,
        "startSeconds": 3.27,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 62,
        "startSeconds": 3.27,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 65,
        "startSeconds": 3.27,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 68,
        "startSeconds": 3.27,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 63,
        "startSeconds": 4.36,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 4.36,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 4.36,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 4.36,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 57,
        "startSeconds": 5.45,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 5.45,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 5.45,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 5.45,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 6.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 6.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 6.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 6.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 7.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 7.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 7.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 7.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 8.73,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 63,
        "startSeconds": 8.73,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 66,
        "startSeconds": 8.73,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 70,
        "startSeconds": 8.73,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 62,
        "startSeconds": 9.82,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 9.82,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 9.82,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 9.82,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 10.91,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 10.91,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 10.91,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 10.91,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 58,
        "startSeconds": 12,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 62,
        "startSeconds": 12,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 65,
        "startSeconds": 12,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 68,
        "startSeconds": 12,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 63,
        "startSeconds": 13.09,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 13.09,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 13.09,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 13.09,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 57,
        "startSeconds": 14.18,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 14.18,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 14.18,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 14.18,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 15.27,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 15.27,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 15.27,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 15.27,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 16.36,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 16.36,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 16.36,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 16.36,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 17.45,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 63,
        "startSeconds": 17.45,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 66,
        "startSeconds": 17.45,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 70,
        "startSeconds": 17.45,
        "durationSeconds": 0.98,
        "label": "Bmaj7"
      },
      {
        "note": 62,
        "startSeconds": 18.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 18.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 18.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 18.55,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 19.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 19.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 19.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 19.64,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 58,
        "startSeconds": 20.73,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 62,
        "startSeconds": 20.73,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 65,
        "startSeconds": 20.73,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 68,
        "startSeconds": 20.73,
        "durationSeconds": 0.98,
        "label": "Bb7"
      },
      {
        "note": 63,
        "startSeconds": 21.82,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 67,
        "startSeconds": 21.82,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 70,
        "startSeconds": 21.82,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 74,
        "startSeconds": 21.82,
        "durationSeconds": 0.98,
        "label": "Ebmaj7"
      },
      {
        "note": 57,
        "startSeconds": 22.91,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 22.91,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 22.91,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 22.91,
        "durationSeconds": 0.98,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 24,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 66,
        "startSeconds": 24,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 69,
        "startSeconds": 24,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 72,
        "startSeconds": 24,
        "durationSeconds": 0.98,
        "label": "D7"
      },
      {
        "note": 55,
        "startSeconds": 25.09,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 59,
        "startSeconds": 25.09,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 62,
        "startSeconds": 25.09,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      },
      {
        "note": 66,
        "startSeconds": 25.09,
        "durationSeconds": 0.98,
        "label": "Gmaj7"
      }
    ]
  },
  {
    "id": "chord_lvl10_gospel_reharm_virtuoso",
    "title": "Cinematic Gospel & Reharmonisation Avancée",
    "category": "chord",
    "level": 10,
    "icon": "👑",
    "bpm": 78,
    "difficulty": "Grand Maître",
    "description": "Reharmonisation complexe avec accords diminués de passage, altérations de quintes et voicings à 5 notes.",
    "durationSeconds": 36,
    "recommendedEngine": "Cluster",
    "recommendedPatch": "Tape Velvet Keys",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 71,
        "startSeconds": 0,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 74,
        "startSeconds": 0,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 61,
        "startSeconds": 1.54,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 64,
        "startSeconds": 1.54,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 67,
        "startSeconds": 1.54,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 70,
        "startSeconds": 1.54,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 62,
        "startSeconds": 3.08,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 65,
        "startSeconds": 3.08,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 69,
        "startSeconds": 3.08,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 72,
        "startSeconds": 3.08,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 63,
        "startSeconds": 4.62,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 66,
        "startSeconds": 4.62,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 69,
        "startSeconds": 4.62,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 72,
        "startSeconds": 4.62,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 64,
        "startSeconds": 6.15,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 6.15,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 6.15,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 6.15,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 57,
        "startSeconds": 7.69,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 61,
        "startSeconds": 7.69,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 64,
        "startSeconds": 7.69,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 67,
        "startSeconds": 7.69,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 70,
        "startSeconds": 7.69,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 62,
        "startSeconds": 9.23,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 9.23,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 9.23,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 9.23,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 10.77,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 59,
        "startSeconds": 10.77,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 62,
        "startSeconds": 10.77,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 66,
        "startSeconds": 10.77,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 70,
        "startSeconds": 10.77,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 60,
        "startSeconds": 12.31,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 64,
        "startSeconds": 12.31,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 67,
        "startSeconds": 12.31,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 71,
        "startSeconds": 12.31,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 74,
        "startSeconds": 12.31,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 61,
        "startSeconds": 13.85,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 64,
        "startSeconds": 13.85,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 67,
        "startSeconds": 13.85,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 70,
        "startSeconds": 13.85,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 62,
        "startSeconds": 15.38,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 65,
        "startSeconds": 15.38,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 69,
        "startSeconds": 15.38,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 72,
        "startSeconds": 15.38,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 63,
        "startSeconds": 16.92,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 66,
        "startSeconds": 16.92,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 69,
        "startSeconds": 16.92,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 72,
        "startSeconds": 16.92,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 64,
        "startSeconds": 18.46,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 18.46,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 18.46,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 18.46,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 57,
        "startSeconds": 20,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 61,
        "startSeconds": 20,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 64,
        "startSeconds": 20,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 67,
        "startSeconds": 20,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 70,
        "startSeconds": 20,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 62,
        "startSeconds": 21.54,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 21.54,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 21.54,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 21.54,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 23.08,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 59,
        "startSeconds": 23.08,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 62,
        "startSeconds": 23.08,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 66,
        "startSeconds": 23.08,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 70,
        "startSeconds": 23.08,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 60,
        "startSeconds": 24.62,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 64,
        "startSeconds": 24.62,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 67,
        "startSeconds": 24.62,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 71,
        "startSeconds": 24.62,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 74,
        "startSeconds": 24.62,
        "durationSeconds": 1.38,
        "label": "Cmaj9"
      },
      {
        "note": 61,
        "startSeconds": 26.15,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 64,
        "startSeconds": 26.15,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 67,
        "startSeconds": 26.15,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 70,
        "startSeconds": 26.15,
        "durationSeconds": 1.38,
        "label": "C#dim7"
      },
      {
        "note": 62,
        "startSeconds": 27.69,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 65,
        "startSeconds": 27.69,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 69,
        "startSeconds": 27.69,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 72,
        "startSeconds": 27.69,
        "durationSeconds": 1.38,
        "label": "Dm11"
      },
      {
        "note": 63,
        "startSeconds": 29.23,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 66,
        "startSeconds": 29.23,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 69,
        "startSeconds": 29.23,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 72,
        "startSeconds": 29.23,
        "durationSeconds": 1.38,
        "label": "Ebdim7"
      },
      {
        "note": 64,
        "startSeconds": 30.77,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 67,
        "startSeconds": 30.77,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 71,
        "startSeconds": 30.77,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 74,
        "startSeconds": 30.77,
        "durationSeconds": 1.38,
        "label": "Em7"
      },
      {
        "note": 57,
        "startSeconds": 32.31,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 61,
        "startSeconds": 32.31,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 64,
        "startSeconds": 32.31,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 67,
        "startSeconds": 32.31,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 70,
        "startSeconds": 32.31,
        "durationSeconds": 1.38,
        "label": "A7b9"
      },
      {
        "note": 62,
        "startSeconds": 33.85,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 33.85,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 33.85,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 33.85,
        "durationSeconds": 1.38,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 35.38,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 59,
        "startSeconds": 35.38,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 62,
        "startSeconds": 35.38,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 66,
        "startSeconds": 35.38,
        "durationSeconds": 1.38,
        "label": "G7alt"
      },
      {
        "note": 70,
        "startSeconds": 35.38,
        "durationSeconds": 1.38,
        "label": "G7alt"
      }
    ]
  },
  {
    "id": "drum_lvl1_basic_groove",
    "title": "Finger Drumming : Initiation Pulse (Kick 41, Snare 45 & Hat 49)",
    "category": "drum",
    "level": 1,
    "icon": "🥁",
    "bpm": 85,
    "difficulty": "Débutant",
    "description": "Apprentissage fondamental de la coordination Kick (41), Snare (45) et Closed Hat (49) en 8 mesures.",
    "durationSeconds": 28,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Kit Drum OP-1 Standard",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.35,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 0.71,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 0.71,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.06,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.41,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 1.41,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.76,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 2.12,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 2.12,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.47,
        "durationSeconds": 0.25,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 2.82,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 2.82,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.18,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 3.53,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 3.53,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.88,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 4.24,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 4.24,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.59,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 4.94,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 4.94,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 5.29,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 5.65,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 5.65,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 6.35,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 6.35,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.71,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 7.06,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 7.06,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.41,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 7.76,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 7.76,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.12,
        "durationSeconds": 0.25,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 8.47,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 8.47,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.82,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 9.18,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 9.18,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.53,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 9.88,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 9.88,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.24,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 10.59,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 10.59,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 10.94,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 11.29,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 11.29,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.65,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 12,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 12,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.35,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 12.71,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 12.71,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.06,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 13.41,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 13.41,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.76,
        "durationSeconds": 0.25,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 14.12,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 14.12,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.47,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 14.82,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 14.82,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.18,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 15.53,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 15.53,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.88,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 16.24,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 16.24,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 16.59,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 16.94,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 16.94,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 17.29,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 17.65,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 17.65,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 18,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 18.35,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 18.35,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 18.71,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 19.06,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 19.06,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 19.41,
        "durationSeconds": 0.25,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 19.76,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 19.76,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 20.12,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 20.47,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 20.47,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 20.82,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 21.18,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 21.18,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 21.53,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 21.88,
        "durationSeconds": 0.25,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 21.88,
        "durationSeconds": 0.15,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 22.24,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl2_boombap_90s",
    "title": "Finger Drumming : Boom Bap Hip-Hop 90s NYC Classic",
    "category": "drum",
    "level": 2,
    "icon": "🎧",
    "bpm": 90,
    "difficulty": "Débutant+",
    "description": "Le groove intemporel de New York : double frappe de Kick (41), Snare tranchant (45) et Open Hat (60).",
    "durationSeconds": 30,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Kit Drum OP-1 Standard",
    "notes": [
      {
        "note": 54,
        "startSeconds": 0,
        "durationSeconds": 0.6,
        "label": "Crash"
      },
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 0,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 0.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 0.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.17,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 1.33,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 1.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 2,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 2.33,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 2.67,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 2.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 3.33,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 3.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 3.83,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 4,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 4,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 4.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 5,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 5.33,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 5.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 6,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 6,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 6.5,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 6.67,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 6.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 7.33,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 7.67,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 8,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 8,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 8.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 8.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 9.17,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 9.33,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 9.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 10,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 10.33,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 54,
        "startSeconds": 10.67,
        "durationSeconds": 0.6,
        "label": "Crash"
      },
      {
        "note": 41,
        "startSeconds": 10.67,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 10.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 11.33,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 11.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 11.83,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 12,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 12,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 12.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 13,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 13.33,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 13.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 14,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 14,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 14.5,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 14.67,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 14.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 15.33,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 15.67,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 16,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 16,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 16.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 16.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 17.17,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 17.33,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 17.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 18,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 18.33,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 18.67,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 18.67,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 19,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 19.33,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 49,
        "startSeconds": 19.33,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 19.83,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 20,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 20,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 45,
        "startSeconds": 20.67,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 53,
        "startSeconds": 21,
        "durationSeconds": 0.35,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl3_french_house_909",
    "title": "Finger Drumming : French House & 909 4-on-the-Floor",
    "category": "drum",
    "level": 3,
    "icon": "🪩",
    "bpm": 124,
    "difficulty": "Intermédiaire",
    "description": "Kick 4-au-sol (41), Clap puissant au 2/4 (57) et Open Hi-Hat sur les contretemps (60).",
    "durationSeconds": 30,
    "recommendedEngine": "Drum",
    "recommendedPatch": "House 909 Kit",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 0.24,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 0.48,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 0.48,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 0.73,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 0.97,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 1.21,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.45,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 1.45,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 1.69,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.94,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 2.18,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 2.42,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 2.42,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 2.66,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 2.9,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 3.15,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 3.39,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 3.39,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 3.63,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 3.87,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 4.11,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 4.35,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 4.35,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 4.6,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 4.84,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 5.08,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 5.32,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 5.32,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 5.56,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 5.81,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 6.05,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 6.29,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 6.29,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 6.53,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 6.77,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 7.02,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 7.26,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 7.26,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 7.5,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 7.74,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 7.98,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 8.23,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 8.23,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 8.47,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 8.71,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 8.95,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 9.19,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 9.19,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 9.44,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 9.68,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 9.92,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 10.16,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 10.16,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 10.4,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 10.65,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 10.89,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 11.13,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 11.13,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 11.37,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 11.61,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 11.85,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 12.1,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 12.1,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 12.34,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 12.58,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 12.82,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 13.06,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 13.06,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 13.31,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 13.55,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 13.79,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 14.03,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 14.03,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 14.27,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 14.52,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 14.76,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 15,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 15,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 15.24,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 15.48,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 15.73,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 15.97,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 15.97,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 16.21,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 16.45,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 16.69,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 16.94,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 16.94,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 17.18,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 17.42,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 17.66,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 17.9,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 17.9,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 18.15,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 18.39,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 18.63,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 18.87,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 18.87,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 53,
        "startSeconds": 19.11,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl4_lofi_dusty_scratch",
    "title": "Finger Drumming : Lo-Fi Vinyl Dusty Beat & Woodblock",
    "category": "drum",
    "level": 4,
    "icon": "☕",
    "bpm": 80,
    "difficulty": "Intermédiaire+",
    "description": "Atmosphère feutrée avec rimshots (56), woodblocks boisés (73) et closed hats légers (49).",
    "durationSeconds": 32,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Lo-Fi Vintage Vinyl",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 0.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 0.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 1.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 1.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 1.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 2.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 2.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 3,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 3,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 3.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 3.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 4.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 4.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 4.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 4.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 5.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 5.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 6,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 6,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 6.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 6.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 7.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 7.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 7.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 7.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 8.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 8.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 9,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 9,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 9.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 9.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 10.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 10.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 10.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 10.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 11.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 11.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 12,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 12,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 12.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 12.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 13.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 13.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 13.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 13.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 14.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 14.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 15,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 15,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 15.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 15.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 16.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 16.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 16.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 16.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 17.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 17.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 18,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 18,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 18.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 18.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 19.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 19.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 19.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 19.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 20.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 20.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 21,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 48,
        "startSeconds": 21,
        "durationSeconds": 0.15,
        "label": "Woodblock"
      },
      {
        "note": 49,
        "startSeconds": 21.38,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 21.75,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 22.13,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 41,
        "startSeconds": 22.31,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 22.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 22.88,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 46,
        "startSeconds": 23.25,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 23.63,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl5_afrobeat_shakers_congas",
    "title": "Finger Drumming : Afrobeat Shakers (66) & Congas (69/70)",
    "category": "drum",
    "level": 5,
    "icon": "🌍",
    "bpm": 108,
    "difficulty": "Avancé",
    "description": "Polyrythmie africaine syncopée combinant Kick punchy (54), Shakers rapides (66) et roulements de Congas (69/70).",
    "durationSeconds": 32,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Afrobeat Percussion Kit",
    "notes": [
      {
        "note": 51,
        "startSeconds": 0,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.14,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.28,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.42,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.56,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.69,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.83,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.97,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.11,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.25,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.39,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.53,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.67,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.81,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.94,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.08,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 0.83,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 1.39,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 0.56,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 1.67,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 0.42,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 1.25,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 2.08,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 2.22,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.36,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.5,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.64,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.78,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.92,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.06,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.19,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.33,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.47,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.61,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.75,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.89,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.03,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.17,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.31,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 2.22,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 3.06,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 3.61,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 2.78,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 3.89,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 2.64,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 3.47,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 4.31,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 4.44,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.58,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.72,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.86,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.14,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.28,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.42,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.56,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.69,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.83,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.97,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.11,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.25,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.39,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.53,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 4.44,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 5.28,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 5.83,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 5,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 6.11,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 4.86,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 5.69,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 6.53,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 6.67,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.81,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.94,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.08,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.22,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.36,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.5,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.64,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.78,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.92,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.06,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.19,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.33,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.47,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.61,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.75,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 6.67,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 7.5,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 8.06,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 7.22,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 8.33,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 7.08,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 7.92,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 8.75,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 8.89,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.03,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.17,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.31,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.44,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.58,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.72,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.86,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.14,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.28,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.42,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.56,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.69,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.83,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.97,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 8.89,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 9.72,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 10.28,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 9.44,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 10.56,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 9.31,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 10.14,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 10.97,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 11.11,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.25,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.39,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.53,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.67,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.81,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.94,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.08,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.22,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.36,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.5,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.64,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.78,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.92,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.06,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.19,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 11.11,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 11.94,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 12.5,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 11.67,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 12.78,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 11.53,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 12.36,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 13.19,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 13.33,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.47,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.61,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.75,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.89,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.03,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.17,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.31,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.44,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.58,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.72,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.86,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.14,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.28,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.42,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 13.33,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.17,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.72,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 13.89,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 15,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 13.75,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 14.58,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 15.42,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 51,
        "startSeconds": 15.56,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.69,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.83,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.97,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.11,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.25,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.39,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.53,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.67,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.81,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.94,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 17.08,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 17.22,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 17.36,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 17.5,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 17.64,
        "durationSeconds": 0.08,
        "label": "Shaker"
      },
      {
        "note": 43,
        "startSeconds": 15.56,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 16.39,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 16.94,
        "durationSeconds": 0.2,
        "label": "Kick Punch"
      },
      {
        "note": 46,
        "startSeconds": 16.11,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 46,
        "startSeconds": 17.22,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 60,
        "startSeconds": 15.97,
        "durationSeconds": 0.18,
        "label": "Conga"
      },
      {
        "note": 70,
        "startSeconds": 16.81,
        "durationSeconds": 0.18,
        "label": "Conga H"
      },
      {
        "note": 70,
        "startSeconds": 17.64,
        "durationSeconds": 0.18,
        "label": "Conga H"
      }
    ]
  },
  {
    "id": "drum_lvl6_amapiano_log_drum",
    "title": "Finger Drumming : Amapiano Log Drum & Shaker Groove",
    "category": "drum",
    "level": 6,
    "icon": "🌴",
    "bpm": 113,
    "difficulty": "Avancé+",
    "description": "Le fameux Log Drum basse (75/54) et le Shaker 3-step sud-africain caractéristique.",
    "durationSeconds": 32,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Amapiano Log Kit",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 0.18,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.35,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 0.53,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 0.71,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.88,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 1.06,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 1.24,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.41,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 1.59,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 1.77,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 1.94,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 0.27,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 0.93,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 1.19,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 1.86,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 0.53,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 1.59,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 2.12,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 2.3,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 2.47,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 2.65,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 2.83,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.01,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 3.19,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 3.36,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 3.54,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 3.72,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 3.89,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.07,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 2.39,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 3.05,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 3.32,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 3.98,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 2.65,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 3.72,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 4.25,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 4.42,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 4.6,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 4.78,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 4.95,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.13,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 5.31,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 5.48,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 5.66,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 5.84,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 6.02,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.19,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 4.51,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 5.18,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 5.44,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 6.11,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 4.78,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 5.84,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 6.37,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 6.55,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 6.72,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 6.9,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 7.08,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.25,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 7.43,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 7.61,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 7.78,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 7.96,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 8.14,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.32,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 6.64,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 7.3,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 7.57,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 8.23,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 6.9,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 7.96,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 8.5,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 8.67,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 8.85,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 9.03,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 9.2,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.38,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 9.56,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 9.73,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 9.91,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 10.09,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 10.26,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.44,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 8.76,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 9.42,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 9.69,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 10.35,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 9.03,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 10.09,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 10.62,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 10.79,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 10.97,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 11.15,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 11.33,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 11.5,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 11.68,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 11.86,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.03,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 12.21,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 12.39,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 12.56,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 10.88,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 11.55,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 11.81,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 12.48,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 11.15,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 12.21,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 12.74,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 12.92,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.09,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 13.27,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 13.45,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 13.62,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 13.81,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 13.98,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.16,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 14.34,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 14.51,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 14.69,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 13.01,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 13.67,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 13.94,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 14.6,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 13.27,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 14.34,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 14.87,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 15.04,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.22,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 15.4,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 15.57,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 15.75,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 15.93,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 16.1,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.28,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 16.46,
        "durationSeconds": 0.2,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 16.64,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 16.81,
        "durationSeconds": 0.1,
        "label": "Shaker"
      },
      {
        "note": 42,
        "startSeconds": 15.13,
        "durationSeconds": 0.4,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 15.8,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 16.06,
        "durationSeconds": 0.35,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 16.73,
        "durationSeconds": 0.5,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 15.4,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 16.46,
        "durationSeconds": 0.2,
        "label": "Clap"
      }
    ]
  },
  {
    "id": "drum_lvl7_trap_808_rolls",
    "title": "Finger Drumming : Modern Trap & 808 Rolls (Sub 75, Rim 56, Hat Roll 49)",
    "category": "drum",
    "level": 7,
    "icon": "🔥",
    "bpm": 140,
    "difficulty": "Pro",
    "description": "Hi-Hat rolls ultra-rapides en triolets (49), Sub 808 percutant (75) et snare clap claquant (57).",
    "durationSeconds": 34,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Trap 808 Power Kit",
    "notes": [
      {
        "note": 42,
        "startSeconds": 0,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 1.07,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 0.86,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 0,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.39,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.45,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.5,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.55,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.61,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.66,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 1.71,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 2.79,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 2.57,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 1.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.14,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.36,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.57,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.79,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.11,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.16,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.21,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.27,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.32,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.37,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 3.43,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 4.5,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 4.29,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 3.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.82,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.88,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.93,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.98,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.04,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.09,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 5.14,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 6.21,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 6,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 5.14,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.36,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.57,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.79,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.54,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.59,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.64,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.7,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.75,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.8,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 6.86,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 7.93,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 7.71,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 6.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.14,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.36,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.25,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.3,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.36,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.41,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.46,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.52,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 8.57,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 9.64,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 9.43,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 8.57,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 8.79,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.96,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.02,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.07,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.13,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.18,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.23,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 10.29,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 11.36,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 11.14,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 10.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.14,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.36,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.57,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.79,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.68,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.73,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.79,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.84,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.89,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.95,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 12,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 13.07,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 12.86,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 12,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.39,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.45,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.5,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.55,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.61,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.66,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 13.71,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 14.79,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 14.57,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 13.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 13.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.14,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.36,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.57,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.79,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.21,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.11,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.16,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.21,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.27,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.32,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.37,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 42,
        "startSeconds": 15.43,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 42,
        "startSeconds": 16.5,
        "durationSeconds": 0.6,
        "label": "Sub 808"
      },
      {
        "note": 47,
        "startSeconds": 16.29,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 49,
        "startSeconds": 15.43,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.64,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.86,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.07,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.29,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.5,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.71,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.93,
        "durationSeconds": 0.08,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.82,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.87,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.93,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.98,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 17.04,
        "durationSeconds": 0.05,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 17.09,
        "durationSeconds": 0.05,
        "label": "Hat"
      }
    ]
  },
  {
    "id": "drum_lvl8_uk_drill_sliding_hats",
    "title": "Finger Drumming : UK Drill Sliding Hats & Ghost Snares",
    "category": "drum",
    "level": 8,
    "icon": "🗡️",
    "bpm": 142,
    "difficulty": "Pro+",
    "description": "Pattern drill syncopé avec kicks décalés (54), rimshots fantômes (56) et hi-hats glissés.",
    "durationSeconds": 34,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Drill 808 Kit",
    "notes": [
      {
        "note": 43,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 0.74,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 1.37,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 0.85,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 1.58,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 0.28,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 0.56,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 1.12,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 1.48,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 1.69,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 2.43,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 3.06,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 2.54,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 3.27,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 1.97,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.25,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 2.81,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 3.17,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 3.38,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4.12,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4.75,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 4.23,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 4.96,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 3.66,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 3.94,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 4.5,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 4.86,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 5.07,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 5.81,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 6.44,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 5.92,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 6.65,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 5.35,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 5.63,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 6.19,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 6.55,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 6.76,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 7.5,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 8.13,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 7.61,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 8.35,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 7.04,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.32,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 7.88,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 8.24,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 8.45,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 9.19,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 9.82,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 9.3,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 10.04,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 8.73,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.01,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 9.57,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 9.93,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 10.14,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 10.88,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 11.51,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 10.99,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 11.73,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 10.42,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 10.7,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 11.26,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 11.62,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 11.83,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 12.57,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 13.2,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 12.68,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 13.42,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 12.11,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.39,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 12.95,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 13.31,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 13.52,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.26,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.89,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 14.37,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 15.11,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 13.8,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.08,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 14.65,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 15,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      },
      {
        "note": 43,
        "startSeconds": 15.21,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 15.95,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 16.58,
        "durationSeconds": 0.25,
        "label": "Kick Punch"
      },
      {
        "note": 45,
        "startSeconds": 16.06,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 16.8,
        "durationSeconds": 0.15,
        "label": "Rim"
      },
      {
        "note": 49,
        "startSeconds": 15.49,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 15.77,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 49,
        "startSeconds": 16.34,
        "durationSeconds": 0.1,
        "label": "Hat"
      },
      {
        "note": 53,
        "startSeconds": 16.69,
        "durationSeconds": 0.2,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl9_jersey_club_triplets",
    "title": "Finger Drumming : Jersey Club & Baile Funk Fast Triplets",
    "category": "drum",
    "level": 9,
    "icon": "⚡",
    "bpm": 135,
    "difficulty": "Expert",
    "description": "Le rythme 'Bed Squeak' ultra-rapide de Jersey Club : 5 frappes de kick par mesure avec drops énergiques.",
    "durationSeconds": 34,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Jersey Club Kit",
    "notes": [
      {
        "note": 43,
        "startSeconds": 0,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 0.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 0.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 1.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 1.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 0.44,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 1.33,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 0.89,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 1.67,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 1.78,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 2.22,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 2.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 2.89,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 3.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 2.22,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 3.11,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 2.67,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 3.44,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 3.56,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4.22,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 4.89,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 4,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 4.89,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 4.44,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 5.22,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 5.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 5.78,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 6,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 6.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 6.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 5.78,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 6.67,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 6.22,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 7,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 7.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 7.56,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 7.78,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 8.22,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 8.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 7.56,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 8.44,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 8,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 8.78,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 8.89,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 9.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 9.56,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 10,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 10.22,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 9.33,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 10.22,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 9.78,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 10.56,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 10.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 11.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 11.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 11.78,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 12,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 11.11,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 12,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 11.56,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 12.33,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 12.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 12.89,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 13.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 13.56,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 13.78,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 12.89,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 13.78,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 13.33,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 14.11,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 14.22,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 14.89,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 15.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 15.56,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 14.67,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 15.56,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 15.11,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 15.89,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 43,
        "startSeconds": 16,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 16.44,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 16.67,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 17.11,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 43,
        "startSeconds": 17.33,
        "durationSeconds": 0.18,
        "label": "Kick Punch"
      },
      {
        "note": 47,
        "startSeconds": 16.44,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 47,
        "startSeconds": 17.33,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 44,
        "startSeconds": 16.89,
        "durationSeconds": 0.15,
        "label": "Zap"
      },
      {
        "note": 44,
        "startSeconds": 17.67,
        "durationSeconds": 0.15,
        "label": "Zap"
      }
    ]
  },
  {
    "id": "drum_lvl10_dnb_amen_break",
    "title": "Finger Drumming : Drum & Bass Jungle 170 BPM Amen Break Virtuose",
    "category": "drum",
    "level": 10,
    "icon": "👑",
    "bpm": 170,
    "difficulty": "Grand Maître",
    "description": "Le breakbeat le plus rapide et exigeant au monde : syncopes amen break, ghost snares et rides à 170 BPM !",
    "durationSeconds": 36,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Amen Jungle Kit",
    "notes": [
      {
        "note": 55,
        "startSeconds": 0,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 0.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 0.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 0.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 0.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 0.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 1.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 1.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 0.35,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 0.62,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 0.79,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 1.06,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 1.24,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 1.32,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 1.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 1.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 1.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 1.94,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 2.12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 2.29,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 2.47,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 2.65,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 1.41,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 1.76,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 2.03,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 2.21,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 2.47,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 2.65,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 2.74,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 2.82,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 3.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 4.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 2.82,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 3.18,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 3.44,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 3.62,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 3.88,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 4.06,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 4.15,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 4.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 4.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 4.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 4.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 4.94,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 5.12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 5.29,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 5.47,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 4.24,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 4.59,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 4.85,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 5.03,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 5.29,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 5.47,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 5.56,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 5.65,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 5.82,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 6.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 5.65,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 6,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 6.26,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 6.44,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 6.71,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 6.88,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 6.97,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 7.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 7.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 7.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 7.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 7.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 7.94,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 8.12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 8.29,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 7.06,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 7.41,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 7.68,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 7.85,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 8.12,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 8.29,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 8.38,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 8.47,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 8.65,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 8.82,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 9,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 9.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 9.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 9.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 9.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 8.47,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 8.82,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 9.09,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 9.26,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 9.53,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 9.71,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 9.79,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 9.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 10.94,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 11.12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 9.88,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 10.24,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 10.5,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 10.68,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 10.94,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 11.12,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 11.21,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 11.29,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 11.47,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 11.65,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 11.82,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 12.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 12.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 12.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 11.29,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 11.65,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 11.91,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 12.09,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 12.35,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 12.53,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 12.62,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 12.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 12.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 13.94,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 12.71,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 13.06,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 13.32,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 13.5,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 13.76,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 13.94,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 14.03,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 14.12,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 14.29,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 14.47,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 14.65,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 14.82,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 15,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 15.18,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 15.35,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 14.12,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 14.47,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 14.74,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 14.91,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 15.18,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 15.35,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 15.44,
        "durationSeconds": 0.25,
        "label": "Crash"
      },
      {
        "note": 55,
        "startSeconds": 15.53,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 15.71,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 15.88,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 16.06,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 16.24,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 16.41,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 16.59,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 55,
        "startSeconds": 16.76,
        "durationSeconds": 0.1,
        "label": "Ride"
      },
      {
        "note": 41,
        "startSeconds": 15.53,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 15.88,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 16.15,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 41,
        "startSeconds": 16.32,
        "durationSeconds": 0.15,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 16.59,
        "durationSeconds": 0.15,
        "label": "Snare"
      },
      {
        "note": 46,
        "startSeconds": 16.76,
        "durationSeconds": 0.12,
        "label": "Rim"
      },
      {
        "note": 54,
        "startSeconds": 16.85,
        "durationSeconds": 0.25,
        "label": "Crash"
      }
    ]
  },
  {
    "id": "arcade_lvl1_gameboy_chiptune",
    "title": "Gameboy Chiptune 8-Bit Nostalgia",
    "category": "arcade",
    "level": 1,
    "icon": "👾",
    "bpm": 110,
    "difficulty": "Débutant",
    "description": "Thème rétro enjoué avec ondes carrées authentiques et sauts d'octaves simples.",
    "durationSeconds": 28,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 0.38,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.76,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 1.14,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 1.52,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 1.9,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 2.28,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 2.66,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 3.04,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 3.42,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 3.8,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 4.18,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 4.56,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 4.94,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 5.32,
        "durationSeconds": 0.28,
        "label": "B3"
      },
      {
        "note": 62,
        "startSeconds": 5.7,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 6.08,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 6.46,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 6.84,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 7.22,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 7.6,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 7.98,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 8.36,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 8.74,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 9.12,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 9.5,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 9.88,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 10.26,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 10.64,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 11.02,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 11.4,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 11.78,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 12.16,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 12.54,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 12.92,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 13.3,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 13.68,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 14.06,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 14.44,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 14.82,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 15.2,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 15.58,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 15.96,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 16.34,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 16.72,
        "durationSeconds": 0.28,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 17.1,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 17.48,
        "durationSeconds": 0.28,
        "label": "B3"
      },
      {
        "note": 62,
        "startSeconds": 17.86,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 18.24,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 18.62,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 19,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 19.38,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 19.76,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 20.14,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 20.52,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 20.9,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 21.28,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 21.66,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 22.04,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 22.42,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 22.8,
        "durationSeconds": 0.28,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 23.18,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 23.56,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 23.94,
        "durationSeconds": 0.28,
        "label": "C4"
      }
    ]
  },
  {
    "id": "arcade_lvl2_tetris_korobeiniki",
    "title": "Tetris (Korobeiniki) Russian Folk Riff",
    "category": "arcade",
    "level": 2,
    "icon": "🧱",
    "bpm": 120,
    "difficulty": "Débutant+",
    "description": "Le thème de jeu vidéo le plus célèbre au monde : cadence rapide et mémorable.",
    "durationSeconds": 30,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 76,
        "startSeconds": 0,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 0.38,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 0.76,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 1.14,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 1.52,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 1.9,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 2.28,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 2.66,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 3.04,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 3.42,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 3.8,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 4.18,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 4.56,
        "durationSeconds": 0.45,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 4.94,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 5.32,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 5.7,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 6.08,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 6.46,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 6.84,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 7.22,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 7.6,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 7.98,
        "durationSeconds": 0.45,
        "label": "F5"
      },
      {
        "note": 81,
        "startSeconds": 8.36,
        "durationSeconds": 0.25,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 8.74,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 9.12,
        "durationSeconds": 0.45,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 9.5,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 9.88,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 10.26,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 10.64,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 11.02,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 11.4,
        "durationSeconds": 0.45,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 11.78,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 12.16,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 12.54,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 12.92,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 13.3,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 13.68,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 14.06,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 76,
        "startSeconds": 14.44,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 14.82,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 15.2,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 15.58,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 15.96,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 16.34,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 16.72,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 17.1,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 17.48,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 17.86,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 18.24,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 18.62,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 19,
        "durationSeconds": 0.45,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 19.38,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 19.76,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 20.14,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 20.52,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 20.9,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 21.28,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 21.66,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 22.04,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 22.42,
        "durationSeconds": 0.45,
        "label": "F5"
      },
      {
        "note": 81,
        "startSeconds": 22.8,
        "durationSeconds": 0.25,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 23.18,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 23.56,
        "durationSeconds": 0.45,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 23.94,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 24.32,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 24.7,
        "durationSeconds": 0.45,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 25.08,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 25.46,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 25.84,
        "durationSeconds": 0.45,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 26.22,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 72,
        "startSeconds": 26.6,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 26.98,
        "durationSeconds": 0.45,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 27.36,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 27.74,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 28.12,
        "durationSeconds": 0.45,
        "label": "A4"
      },
      {
        "note": 69,
        "startSeconds": 28.5,
        "durationSeconds": 0.25,
        "label": "A4"
      }
    ]
  },
  {
    "id": "arcade_lvl3_outrun_retrowave",
    "title": "Outrun Retrowave Highway Chase",
    "category": "arcade",
    "level": 3,
    "icon": "🏎️",
    "bpm": 128,
    "difficulty": "Intermédiaire",
    "description": "Conduite nocturne sur autoroute fluo avec lead analogique et arpèges filants.",
    "durationSeconds": 30,
    "recommendedEngine": "FM",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 0.35,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 0.7,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 1.05,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 1.4,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 1.75,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 2.1,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 2.45,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 53,
        "startSeconds": 2.8,
        "durationSeconds": 0.25,
        "label": "F3"
      },
      {
        "note": 60,
        "startSeconds": 3.15,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 3.5,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 3.85,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 4.2,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 4.55,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 60,
        "startSeconds": 4.9,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 5.25,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 55,
        "startSeconds": 5.6,
        "durationSeconds": 0.25,
        "label": "G3"
      },
      {
        "note": 62,
        "startSeconds": 5.95,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 6.3,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 6.65,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 7,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 7.35,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 7.7,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 8.05,
        "durationSeconds": 0.25,
        "label": "B3"
      },
      {
        "note": 57,
        "startSeconds": 8.4,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 8.75,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 9.1,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 9.45,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 9.8,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 10.15,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 10.5,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 10.85,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 57,
        "startSeconds": 11.2,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 11.55,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 11.9,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 12.25,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 12.6,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 12.95,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 13.3,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 13.65,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 53,
        "startSeconds": 14,
        "durationSeconds": 0.25,
        "label": "F3"
      },
      {
        "note": 60,
        "startSeconds": 14.35,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 14.7,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 15.05,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 15.4,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 15.75,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 60,
        "startSeconds": 16.1,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 16.45,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 55,
        "startSeconds": 16.8,
        "durationSeconds": 0.25,
        "label": "G3"
      },
      {
        "note": 62,
        "startSeconds": 17.15,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 17.5,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 17.85,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 18.2,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 18.55,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 18.9,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 19.25,
        "durationSeconds": 0.25,
        "label": "B3"
      },
      {
        "note": 57,
        "startSeconds": 19.6,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 64,
        "startSeconds": 19.95,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 20.3,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 20.65,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 21,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 21.35,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 21.7,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 22.05,
        "durationSeconds": 0.25,
        "label": "E4"
      }
    ]
  },
  {
    "id": "arcade_lvl4_drift_phonk_cowbell",
    "title": "Tokyo Drift Phonk Heavy Bass & Cowbell",
    "category": "arcade",
    "level": 4,
    "icon": "🏁",
    "bpm": 145,
    "difficulty": "Intermédiaire+",
    "description": "Cowbell agressive (68) et mélodie phonk syncopée pour virages en dérapage contrôlé.",
    "durationSeconds": 32,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Cowbell 808 Phonk",
    "notes": [
      {
        "note": 68,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 0.28,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 0.56,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 0.84,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 73,
        "startSeconds": 1.12,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 68,
        "startSeconds": 1.4,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 1.68,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 1.96,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 75,
        "startSeconds": 2.24,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 2.52,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 2.8,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 3.08,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 3.36,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 3.64,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 3.92,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 4.2,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 76,
        "startSeconds": 4.48,
        "durationSeconds": 0.2,
        "label": "Bell (76)"
      },
      {
        "note": 75,
        "startSeconds": 4.76,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 5.04,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 5.32,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 73,
        "startSeconds": 5.6,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 5.88,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 6.16,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 66,
        "startSeconds": 6.44,
        "durationSeconds": 0.2,
        "label": "Bell (66)"
      },
      {
        "note": 68,
        "startSeconds": 6.72,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 7,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 7.28,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 7.56,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 73,
        "startSeconds": 7.84,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 68,
        "startSeconds": 8.12,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 8.4,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 8.68,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 75,
        "startSeconds": 8.96,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 9.24,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 9.52,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 9.8,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 76,
        "startSeconds": 10.08,
        "durationSeconds": 0.2,
        "label": "Bell (76)"
      },
      {
        "note": 75,
        "startSeconds": 10.36,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 10.64,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 10.92,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 73,
        "startSeconds": 11.2,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 11.48,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 11.76,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 66,
        "startSeconds": 12.04,
        "durationSeconds": 0.2,
        "label": "Bell (66)"
      },
      {
        "note": 68,
        "startSeconds": 12.32,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 12.6,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 12.88,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 13.16,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 13.44,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 13.72,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 14,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 14.28,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 73,
        "startSeconds": 14.56,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 68,
        "startSeconds": 14.84,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 15.12,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 15.4,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 75,
        "startSeconds": 15.68,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 15.96,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 16.24,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 16.52,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 16.8,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 17.08,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 17.36,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 17.64,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 76,
        "startSeconds": 17.92,
        "durationSeconds": 0.2,
        "label": "Bell (76)"
      },
      {
        "note": 75,
        "startSeconds": 18.2,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 18.48,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 18.76,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 73,
        "startSeconds": 19.04,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 19.32,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 19.6,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 66,
        "startSeconds": 19.88,
        "durationSeconds": 0.2,
        "label": "Bell (66)"
      },
      {
        "note": 68,
        "startSeconds": 20.16,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 20.44,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 20.72,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 21,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 73,
        "startSeconds": 21.28,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 68,
        "startSeconds": 21.56,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 71,
        "startSeconds": 21.84,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 22.12,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 75,
        "startSeconds": 22.4,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 22.68,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 22.96,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 23.24,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 76,
        "startSeconds": 23.52,
        "durationSeconds": 0.2,
        "label": "Bell (76)"
      },
      {
        "note": 75,
        "startSeconds": 23.8,
        "durationSeconds": 0.2,
        "label": "Bell (75)"
      },
      {
        "note": 73,
        "startSeconds": 24.08,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 24.36,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 73,
        "startSeconds": 24.64,
        "durationSeconds": 0.2,
        "label": "Bell (73)"
      },
      {
        "note": 71,
        "startSeconds": 24.92,
        "durationSeconds": 0.2,
        "label": "Bell (71)"
      },
      {
        "note": 68,
        "startSeconds": 25.2,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 66,
        "startSeconds": 25.48,
        "durationSeconds": 0.2,
        "label": "Bell (66)"
      },
      {
        "note": 68,
        "startSeconds": 25.76,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 26.04,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 26.32,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      },
      {
        "note": 68,
        "startSeconds": 26.6,
        "durationSeconds": 0.2,
        "label": "Bell (68)"
      }
    ]
  },
  {
    "id": "arcade_lvl5_daft_punk_tribute",
    "title": "French Touch One More Time Tribute",
    "category": "arcade",
    "level": 5,
    "icon": "🤖",
    "bpm": 123,
    "difficulty": "Avancé",
    "description": "Le riff de cuivres samplé légendaire répliqué note pour note sur le clavier OP-1.",
    "durationSeconds": 32,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 71,
        "startSeconds": 0,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 0.38,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 0.76,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 1.14,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 1.52,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 1.9,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.28,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 2.66,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 3.04,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 3.42,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 71,
        "startSeconds": 3.8,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 4.18,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 4.56,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 4.94,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 5.32,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 5.7,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 6.08,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 6.46,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 6.84,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 7.22,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 7.6,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 7.98,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 8.36,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 8.74,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 9.12,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 9.5,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 9.88,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 10.26,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 10.64,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 11.02,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 11.4,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 11.78,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 12.16,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 12.54,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 12.92,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 13.3,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 13.68,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 14.06,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 14.44,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 14.82,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 15.2,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 15.58,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 15.96,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 16.34,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 16.72,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 17.1,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 17.48,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 17.86,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 18.24,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 18.62,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 71,
        "startSeconds": 19,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 19.38,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 19.76,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 20.14,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 20.52,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 20.9,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 21.28,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 21.66,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 22.04,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 22.42,
        "durationSeconds": 0.28,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 22.8,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 23.18,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 71,
        "startSeconds": 23.56,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 23.94,
        "durationSeconds": 0.28,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 24.32,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 24.7,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 25.08,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 25.46,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 25.84,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 26.22,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 26.6,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 26.98,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 27.36,
        "durationSeconds": 0.28,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 27.74,
        "durationSeconds": 0.28,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 28.12,
        "durationSeconds": 0.28,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 28.5,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 28.88,
        "durationSeconds": 0.28,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 29.26,
        "durationSeconds": 0.28,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 29.64,
        "durationSeconds": 0.28,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 30.02,
        "durationSeconds": 0.28,
        "label": "G4"
      }
    ]
  },
  {
    "id": "arcade_lvl6_cyberpunk_boss_fight",
    "title": "Cyberpunk Neon Boss Fight",
    "category": "arcade",
    "level": 6,
    "icon": "🔥",
    "bpm": 138,
    "difficulty": "Avancé+",
    "description": "Combat de boss frénétique avec arpèges industriels et montées chromatiques.",
    "durationSeconds": 34,
    "recommendedEngine": "Voltage",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 53,
        "startSeconds": 0,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 56,
        "startSeconds": 0.28,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 60,
        "startSeconds": 0.56,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 0.84,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 1.12,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 1.4,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 1.68,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 53,
        "startSeconds": 1.96,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 51,
        "startSeconds": 2.24,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 54,
        "startSeconds": 2.52,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 58,
        "startSeconds": 2.8,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 63,
        "startSeconds": 3.08,
        "durationSeconds": 0.2,
        "label": "D#4"
      },
      {
        "note": 62,
        "startSeconds": 3.36,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 3.64,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 54,
        "startSeconds": 3.92,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 51,
        "startSeconds": 4.2,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 49,
        "startSeconds": 4.48,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 52,
        "startSeconds": 4.76,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 56,
        "startSeconds": 5.04,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 61,
        "startSeconds": 5.32,
        "durationSeconds": 0.2,
        "label": "C#4"
      },
      {
        "note": 60,
        "startSeconds": 5.6,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 5.88,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 52,
        "startSeconds": 6.16,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 49,
        "startSeconds": 6.44,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 55,
        "startSeconds": 6.72,
        "durationSeconds": 0.2,
        "label": "G3"
      },
      {
        "note": 58,
        "startSeconds": 7,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 62,
        "startSeconds": 7.28,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 7.56,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 66,
        "startSeconds": 7.84,
        "durationSeconds": 0.2,
        "label": "F#4"
      },
      {
        "note": 62,
        "startSeconds": 8.12,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 8.4,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 55,
        "startSeconds": 8.68,
        "durationSeconds": 0.2,
        "label": "G3"
      },
      {
        "note": 53,
        "startSeconds": 8.96,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 56,
        "startSeconds": 9.24,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 60,
        "startSeconds": 9.52,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 9.8,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 10.08,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 10.36,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 10.64,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 53,
        "startSeconds": 10.92,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 51,
        "startSeconds": 11.2,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 54,
        "startSeconds": 11.48,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 58,
        "startSeconds": 11.76,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 63,
        "startSeconds": 12.04,
        "durationSeconds": 0.2,
        "label": "D#4"
      },
      {
        "note": 62,
        "startSeconds": 12.32,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 12.6,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 54,
        "startSeconds": 12.88,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 51,
        "startSeconds": 13.16,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 49,
        "startSeconds": 13.44,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 52,
        "startSeconds": 13.72,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 56,
        "startSeconds": 14,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 61,
        "startSeconds": 14.28,
        "durationSeconds": 0.2,
        "label": "C#4"
      },
      {
        "note": 60,
        "startSeconds": 14.56,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 14.84,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 52,
        "startSeconds": 15.12,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 49,
        "startSeconds": 15.4,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 55,
        "startSeconds": 15.68,
        "durationSeconds": 0.2,
        "label": "G3"
      },
      {
        "note": 58,
        "startSeconds": 15.96,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 62,
        "startSeconds": 16.24,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 16.52,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 66,
        "startSeconds": 16.8,
        "durationSeconds": 0.2,
        "label": "F#4"
      },
      {
        "note": 62,
        "startSeconds": 17.08,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 17.36,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 55,
        "startSeconds": 17.64,
        "durationSeconds": 0.2,
        "label": "G3"
      },
      {
        "note": 53,
        "startSeconds": 17.92,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 56,
        "startSeconds": 18.2,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 60,
        "startSeconds": 18.48,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 65,
        "startSeconds": 18.76,
        "durationSeconds": 0.2,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 19.04,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 19.32,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 19.6,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 53,
        "startSeconds": 19.88,
        "durationSeconds": 0.2,
        "label": "F3"
      },
      {
        "note": 51,
        "startSeconds": 20.16,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 54,
        "startSeconds": 20.44,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 58,
        "startSeconds": 20.72,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 63,
        "startSeconds": 21,
        "durationSeconds": 0.2,
        "label": "D#4"
      },
      {
        "note": 62,
        "startSeconds": 21.28,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 21.56,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 54,
        "startSeconds": 21.84,
        "durationSeconds": 0.2,
        "label": "F#3"
      },
      {
        "note": 51,
        "startSeconds": 22.12,
        "durationSeconds": 0.2,
        "label": "D#3"
      },
      {
        "note": 49,
        "startSeconds": 22.4,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 52,
        "startSeconds": 22.68,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 56,
        "startSeconds": 22.96,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 61,
        "startSeconds": 23.24,
        "durationSeconds": 0.2,
        "label": "C#4"
      },
      {
        "note": 60,
        "startSeconds": 23.52,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 56,
        "startSeconds": 23.8,
        "durationSeconds": 0.2,
        "label": "G#3"
      },
      {
        "note": 52,
        "startSeconds": 24.08,
        "durationSeconds": 0.2,
        "label": "E3"
      },
      {
        "note": 49,
        "startSeconds": 24.36,
        "durationSeconds": 0.2,
        "label": "C#3"
      },
      {
        "note": 55,
        "startSeconds": 24.64,
        "durationSeconds": 0.2,
        "label": "G3"
      },
      {
        "note": 58,
        "startSeconds": 24.92,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 62,
        "startSeconds": 25.2,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 25.48,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 66,
        "startSeconds": 25.76,
        "durationSeconds": 0.2,
        "label": "F#4"
      },
      {
        "note": 62,
        "startSeconds": 26.04,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 58,
        "startSeconds": 26.32,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 55,
        "startSeconds": 26.6,
        "durationSeconds": 0.2,
        "label": "G3"
      }
    ]
  },
  {
    "id": "arcade_lvl7_hyperpop_speedcore",
    "title": "Hyperpop Speedcore Glitch Anthem",
    "category": "arcade",
    "level": 7,
    "icon": "⚡",
    "bpm": 155,
    "difficulty": "Pro",
    "description": "Euphorie numérique à tempo survolté : trilles rapides et explosions de notes multicolores.",
    "durationSeconds": 34,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 65,
        "startSeconds": 0,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 0.24,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 0.48,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 0.72,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 77,
        "startSeconds": 0.96,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 1.2,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 1.44,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 1.68,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 1.92,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 2.16,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 2.4,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 2.64,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 2.88,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 3.12,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 3.36,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 3.6,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 3.84,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 4.08,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 4.32,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 4.56,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 4.8,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 5.04,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 5.28,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 5.52,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 60,
        "startSeconds": 5.76,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 6,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 6.24,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 6.48,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 6.72,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 6.96,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 7.2,
        "durationSeconds": 0.16,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 7.44,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 65,
        "startSeconds": 7.68,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 7.92,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 8.16,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 8.4,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 77,
        "startSeconds": 8.64,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 8.88,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 9.12,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 9.36,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 9.6,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 9.84,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 10.08,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 10.32,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 10.56,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 10.8,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 11.04,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 11.28,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 11.52,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 11.76,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 12,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 12.24,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 12.48,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 12.72,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 12.96,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 13.2,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 60,
        "startSeconds": 13.44,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 13.68,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 13.92,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 14.16,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 14.4,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 14.64,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 14.88,
        "durationSeconds": 0.16,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 15.12,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 65,
        "startSeconds": 15.36,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 15.6,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 15.84,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 16.08,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 77,
        "startSeconds": 16.32,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 16.56,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 16.8,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 17.04,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 17.28,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 17.52,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 17.76,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 18,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 18.24,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 18.48,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 18.72,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 18.96,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 19.2,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 65,
        "startSeconds": 19.44,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 19.68,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 74,
        "startSeconds": 19.92,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 77,
        "startSeconds": 20.16,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 20.4,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 69,
        "startSeconds": 20.64,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 20.88,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 60,
        "startSeconds": 21.12,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 21.36,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 21.6,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 21.84,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 22.08,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 22.32,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 22.56,
        "durationSeconds": 0.16,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 22.8,
        "durationSeconds": 0.16,
        "label": "G5"
      }
    ]
  },
  {
    "id": "arcade_lvl8_kawaii_future_bass",
    "title": "Kawaii Future Bass Drop (Snail's House style)",
    "category": "arcade",
    "level": 8,
    "icon": "🌸",
    "bpm": 148,
    "difficulty": "Pro+",
    "description": "Mélodie joyeuse et pétillante avec sauts d'intervalles expressifs et accords scintillants.",
    "durationSeconds": 34,
    "recommendedEngine": "FM",
    "recommendedPatch": "Dream Poly Synth",
    "notes": [
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.22,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.32,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 0.64,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 0.96,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 1.28,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 1.6,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 1.92,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.24,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 2.56,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 2.88,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 3.2,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 3.52,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 3.84,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 4.16,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 4.48,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 4.8,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 5.12,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 5.44,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 5.76,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 6.08,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 6.4,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 79,
        "startSeconds": 6.72,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 7.04,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 7.36,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 64,
        "startSeconds": 7.68,
        "durationSeconds": 0.22,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 8,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 8.32,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 8.64,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 8.96,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 9.28,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 9.6,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 9.92,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 10.24,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 10.56,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 81,
        "startSeconds": 10.88,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 76,
        "startSeconds": 11.2,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 65,
        "startSeconds": 11.52,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 11.84,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 12.16,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 12.48,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 79,
        "startSeconds": 12.8,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 81,
        "startSeconds": 13.12,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 84,
        "startSeconds": 13.44,
        "durationSeconds": 0.22,
        "label": "C6"
      },
      {
        "note": 81,
        "startSeconds": 13.76,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 77,
        "startSeconds": 14.08,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 14.4,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 14.72,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 15.04,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 15.36,
        "durationSeconds": 0.22,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 15.68,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 16,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 16.32,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 16.64,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 16.96,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 17.28,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 17.6,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 17.92,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 18.24,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 18.56,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 18.88,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 19.2,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 19.52,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 19.84,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 20.16,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 76,
        "startSeconds": 20.48,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 20.8,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 21.12,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 21.44,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 21.76,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 79,
        "startSeconds": 22.08,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 22.4,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 22.72,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 64,
        "startSeconds": 23.04,
        "durationSeconds": 0.22,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 23.36,
        "durationSeconds": 0.22,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 23.68,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 76,
        "startSeconds": 24,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 24.32,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 24.64,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 71,
        "startSeconds": 24.96,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 25.28,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 25.6,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 25.92,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 81,
        "startSeconds": 26.24,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 76,
        "startSeconds": 26.56,
        "durationSeconds": 0.22,
        "label": "E5"
      },
      {
        "note": 65,
        "startSeconds": 26.88,
        "durationSeconds": 0.22,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 27.2,
        "durationSeconds": 0.22,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 27.52,
        "durationSeconds": 0.22,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 27.84,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 79,
        "startSeconds": 28.16,
        "durationSeconds": 0.22,
        "label": "G5"
      },
      {
        "note": 81,
        "startSeconds": 28.48,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 84,
        "startSeconds": 28.8,
        "durationSeconds": 0.22,
        "label": "C6"
      },
      {
        "note": 81,
        "startSeconds": 29.12,
        "durationSeconds": 0.22,
        "label": "A5"
      },
      {
        "note": 77,
        "startSeconds": 29.44,
        "durationSeconds": 0.22,
        "label": "F5"
      },
      {
        "note": 74,
        "startSeconds": 29.76,
        "durationSeconds": 0.22,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 30.08,
        "durationSeconds": 0.22,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 30.4,
        "durationSeconds": 0.22,
        "label": "G4"
      }
    ]
  },
  {
    "id": "arcade_lvl9_edm_festival_drop",
    "title": "EDM Festival Big Room Drop",
    "category": "arcade",
    "level": 9,
    "icon": "🎆",
    "bpm": 128,
    "difficulty": "Expert",
    "description": "Montée en tension maximale et drop ravageur pour stades : saut de quintes et énergie brute.",
    "durationSeconds": 34,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Virtual Analog Saw Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 0.35,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 67,
        "startSeconds": 0.7,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 1.05,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 1.4,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 1.75,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 2.1,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 2.45,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 67,
        "startSeconds": 2.8,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 3.15,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 3.5,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 3.85,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 4.2,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 4.55,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 4.9,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 5.25,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 5.6,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 5.95,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 6.3,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 6.65,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 7,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 7.35,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 7.7,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 8.05,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 62,
        "startSeconds": 8.4,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 8.75,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 69,
        "startSeconds": 9.1,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 9.45,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 9.8,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 10.15,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 10.5,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 10.85,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 69,
        "startSeconds": 11.2,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 11.55,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 11.9,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 12.25,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 12.6,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 67,
        "startSeconds": 12.95,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 74,
        "startSeconds": 13.3,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 13.65,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 14,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 14.35,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 14.7,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 15.05,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 15.4,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 15.75,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 16.1,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 16.45,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 16.8,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 17.15,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 67,
        "startSeconds": 17.5,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 17.85,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 18.2,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 18.55,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 18.9,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 60,
        "startSeconds": 19.25,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 67,
        "startSeconds": 19.6,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 19.95,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 20.3,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 20.65,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 65,
        "startSeconds": 21,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 21.35,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 21.7,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 22.05,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 22.4,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 22.75,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 23.1,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 65,
        "startSeconds": 23.45,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 72,
        "startSeconds": 23.8,
        "durationSeconds": 0.25,
        "label": "C5"
      },
      {
        "note": 74,
        "startSeconds": 24.15,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 24.5,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 24.85,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 62,
        "startSeconds": 25.2,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 25.55,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 69,
        "startSeconds": 25.9,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 26.25,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 65,
        "startSeconds": 26.6,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 64,
        "startSeconds": 26.95,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 27.3,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 62,
        "startSeconds": 27.65,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 69,
        "startSeconds": 28,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 71,
        "startSeconds": 28.35,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 28.7,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 29.05,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 29.4,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 67,
        "startSeconds": 29.75,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 74,
        "startSeconds": 30.1,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 30.45,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 30.8,
        "durationSeconds": 0.25,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 31.15,
        "durationSeconds": 0.25,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 31.5,
        "durationSeconds": 0.25,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 31.85,
        "durationSeconds": 0.25,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 32.2,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 32.55,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 32.9,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 33.25,
        "durationSeconds": 0.25,
        "label": "C4"
      }
    ]
  },
  {
    "id": "arcade_lvl10_final_boss_rush",
    "title": "Grand Maître Arcade Final Boss Rush",
    "category": "arcade",
    "level": 10,
    "icon": "👑",
    "bpm": 165,
    "difficulty": "Grand Maître",
    "description": "L'épreuve suprême : enchaînement frénétique de toutes les techniques (gammes, arpèges, percussions) à 165 BPM !",
    "durationSeconds": 38,
    "recommendedEngine": "Voltage",
    "recommendedPatch": "Acid Sequence",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 0.24,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 0.48,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 0.72,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 0.96,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 1.2,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 1.44,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 1.68,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 1.92,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 2.16,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 2.4,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 2.64,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 2.88,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 65,
        "startSeconds": 3.12,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 3.36,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 3.6,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 3.84,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 81,
        "startSeconds": 4.08,
        "durationSeconds": 0.16,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 4.32,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 4.56,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 72,
        "startSeconds": 4.8,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 5.04,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 5.28,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 5.52,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 5.76,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 57,
        "startSeconds": 6,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 55,
        "startSeconds": 6.24,
        "durationSeconds": 0.16,
        "label": "G3"
      },
      {
        "note": 59,
        "startSeconds": 6.48,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 62,
        "startSeconds": 6.72,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 6.96,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 7.2,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 7.44,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 7.68,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 7.92,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 8.16,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 8.4,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 8.64,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 8.88,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 55,
        "startSeconds": 9.12,
        "durationSeconds": 0.16,
        "label": "G3"
      },
      {
        "note": 60,
        "startSeconds": 9.36,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 9.6,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 9.84,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 10.08,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 10.32,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 10.56,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 10.8,
        "durationSeconds": 0.16,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 11.04,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 11.28,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 11.52,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 11.76,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 12,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 12.24,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 12.48,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 12.72,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 12.96,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 13.2,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 13.44,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 13.68,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 81,
        "startSeconds": 13.92,
        "durationSeconds": 0.16,
        "label": "A5"
      },
      {
        "note": 76,
        "startSeconds": 14.16,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 14.4,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 14.64,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 14.88,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 15.12,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 15.36,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 15.6,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 15.84,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 16.08,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 16.32,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 16.56,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 16.8,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 17.04,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 72,
        "startSeconds": 17.28,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 17.52,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 17.76,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 18,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 18.24,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 18.48,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 65,
        "startSeconds": 18.72,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 69,
        "startSeconds": 18.96,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 19.2,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 77,
        "startSeconds": 19.44,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 81,
        "startSeconds": 19.68,
        "durationSeconds": 0.16,
        "label": "A5"
      },
      {
        "note": 79,
        "startSeconds": 19.92,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 77,
        "startSeconds": 20.16,
        "durationSeconds": 0.16,
        "label": "F5"
      },
      {
        "note": 72,
        "startSeconds": 20.4,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 20.64,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 20.88,
        "durationSeconds": 0.16,
        "label": "F4"
      },
      {
        "note": 62,
        "startSeconds": 21.12,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 21.36,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 57,
        "startSeconds": 21.6,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 55,
        "startSeconds": 21.84,
        "durationSeconds": 0.16,
        "label": "G3"
      },
      {
        "note": 59,
        "startSeconds": 22.08,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 62,
        "startSeconds": 22.32,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 67,
        "startSeconds": 22.56,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 71,
        "startSeconds": 22.8,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 74,
        "startSeconds": 23.04,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 76,
        "startSeconds": 23.28,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 74,
        "startSeconds": 23.52,
        "durationSeconds": 0.16,
        "label": "D5"
      },
      {
        "note": 71,
        "startSeconds": 23.76,
        "durationSeconds": 0.16,
        "label": "B4"
      },
      {
        "note": 67,
        "startSeconds": 24,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 62,
        "startSeconds": 24.24,
        "durationSeconds": 0.16,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 24.48,
        "durationSeconds": 0.16,
        "label": "B3"
      },
      {
        "note": 55,
        "startSeconds": 24.72,
        "durationSeconds": 0.16,
        "label": "G3"
      },
      {
        "note": 60,
        "startSeconds": 24.96,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 25.2,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 25.44,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 25.68,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 25.92,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 79,
        "startSeconds": 26.16,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 84,
        "startSeconds": 26.4,
        "durationSeconds": 0.16,
        "label": "C6"
      },
      {
        "note": 79,
        "startSeconds": 26.64,
        "durationSeconds": 0.16,
        "label": "G5"
      },
      {
        "note": 76,
        "startSeconds": 26.88,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 27.12,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 67,
        "startSeconds": 27.36,
        "durationSeconds": 0.16,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 27.6,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 27.84,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 28.08,
        "durationSeconds": 0.16,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 28.32,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 28.56,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 28.8,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 29.04,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 76,
        "startSeconds": 29.28,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 81,
        "startSeconds": 29.52,
        "durationSeconds": 0.16,
        "label": "A5"
      },
      {
        "note": 76,
        "startSeconds": 29.76,
        "durationSeconds": 0.16,
        "label": "E5"
      },
      {
        "note": 72,
        "startSeconds": 30,
        "durationSeconds": 0.16,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 30.24,
        "durationSeconds": 0.16,
        "label": "A4"
      },
      {
        "note": 64,
        "startSeconds": 30.48,
        "durationSeconds": 0.16,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 30.72,
        "durationSeconds": 0.16,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 30.96,
        "durationSeconds": 0.16,
        "label": "A3"
      }
    ]
  },
  {
    "id": "melody_lvl2_lofi_chill_riff",
    "title": "Lo-Fi Midnight Chillhop Guitar",
    "category": "melody",
    "level": 2,
    "icon": "☕",
    "bpm": 78,
    "difficulty": "Débutant+",
    "description": "Phrasé détendu et chaloupé en Do Majeur / La Mineur pentatonique avec notes tenues et glissements doux.",
    "durationSeconds": 28,
    "recommendedEngine": "String",
    "recommendedPatch": "Nylon Mellow",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.8,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 0.9,
        "durationSeconds": 0.7,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 1.8,
        "durationSeconds": 0.9,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 2.9,
        "durationSeconds": 1.2,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 4.4,
        "durationSeconds": 0.6,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 5.2,
        "durationSeconds": 0.6,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 6,
        "durationSeconds": 1.2,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 7.5,
        "durationSeconds": 0.7,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 8.4,
        "durationSeconds": 1.4,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 10.2,
        "durationSeconds": 0.8,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 11.1,
        "durationSeconds": 0.7,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 12,
        "durationSeconds": 0.9,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 13.1,
        "durationSeconds": 1.4,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 14.8,
        "durationSeconds": 0.6,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 15.6,
        "durationSeconds": 0.6,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 16.4,
        "durationSeconds": 1.2,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 17.9,
        "durationSeconds": 0.7,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 18.8,
        "durationSeconds": 1.6,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 21,
        "durationSeconds": 0.9,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 22.1,
        "durationSeconds": 0.9,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 23.2,
        "durationSeconds": 1.2,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 24.8,
        "durationSeconds": 2,
        "label": "C5"
      }
    ]
  },
  {
    "id": "melody_lvl5_synth_funk_talkbox",
    "title": "Electro-Funk 80s Talkbox Riff",
    "category": "melody",
    "level": 5,
    "icon": "⚡",
    "bpm": 108,
    "difficulty": "Avancé",
    "description": "Ligne de solo funk ultra-dynamique avec syncopes, doubles croches et staccato nerveux sur moteur Pulse/FM.",
    "durationSeconds": 30,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "Funk Talkbox",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 0.35,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 0.7,
        "durationSeconds": 0.3,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 1.05,
        "durationSeconds": 0.3,
        "label": "D4"
      },
      {
        "note": 63,
        "startSeconds": 1.4,
        "durationSeconds": 0.25,
        "label": "D#4"
      },
      {
        "note": 64,
        "startSeconds": 1.75,
        "durationSeconds": 0.5,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 2.4,
        "durationSeconds": 0.3,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 2.8,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 3.3,
        "durationSeconds": 0.5,
        "label": "D4"
      },
      {
        "note": 57,
        "startSeconds": 4.2,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 4.6,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 4.95,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 5.3,
        "durationSeconds": 0.35,
        "label": "E4"
      },
      {
        "note": 69,
        "startSeconds": 5.8,
        "durationSeconds": 0.5,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 6.4,
        "durationSeconds": 0.3,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 6.8,
        "durationSeconds": 0.3,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 7.2,
        "durationSeconds": 0.6,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 8.5,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 57,
        "startSeconds": 8.85,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 9.2,
        "durationSeconds": 0.3,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 9.6,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 10.1,
        "durationSeconds": 0.3,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 10.5,
        "durationSeconds": 0.6,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 11.3,
        "durationSeconds": 0.5,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 11.9,
        "durationSeconds": 0.4,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 12.4,
        "durationSeconds": 0.7,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 13.3,
        "durationSeconds": 0.4,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 13.8,
        "durationSeconds": 0.4,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 14.3,
        "durationSeconds": 0.8,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 15.3,
        "durationSeconds": 1.2,
        "label": "A3"
      },
      {
        "note": 60,
        "startSeconds": 17.2,
        "durationSeconds": 0.2,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 17.5,
        "durationSeconds": 0.2,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 17.8,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 18.1,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 18.4,
        "durationSeconds": 0.3,
        "label": "A4"
      },
      {
        "note": 72,
        "startSeconds": 18.8,
        "durationSeconds": 0.5,
        "label": "C5"
      },
      {
        "note": 69,
        "startSeconds": 19.4,
        "durationSeconds": 0.3,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 19.8,
        "durationSeconds": 0.3,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 20.2,
        "durationSeconds": 0.5,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 20.8,
        "durationSeconds": 0.8,
        "label": "C4"
      },
      {
        "note": 57,
        "startSeconds": 21.8,
        "durationSeconds": 1.8,
        "label": "A3"
      }
    ]
  },
  {
    "id": "chord_lvl3_french_touch_disco",
    "title": "French Touch Disco Filter Chords",
    "category": "chord",
    "level": 3,
    "icon": "🪩",
    "bpm": 122,
    "difficulty": "Intermédiaire",
    "description": "Accords funky filtrés à la Daft Punk (Am7, Dm7, Fmaj7, Em7) joués en croches pompantes.",
    "durationSeconds": 28,
    "recommendedEngine": "Phase",
    "recommendedPatch": "French House Clav",
    "notes": [
      {
        "note": 57,
        "startSeconds": 0,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 57,
        "startSeconds": 0.5,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 0.5,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 0.5,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 0.5,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 57,
        "startSeconds": 1,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 1,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 1,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 1,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 1.96,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 1.96,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 1.96,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 1.96,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 62,
        "startSeconds": 2.45,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 2.45,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 2.45,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 2.45,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 53,
        "startSeconds": 3.93,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 3.93,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 3.93,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 3.93,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 53,
        "startSeconds": 4.42,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 4.42,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 4.42,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 4.42,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 52,
        "startSeconds": 5.9,
        "durationSeconds": 0.45,
        "label": "Em7"
      },
      {
        "note": 55,
        "startSeconds": 5.9,
        "durationSeconds": 0.45,
        "label": "Em7"
      },
      {
        "note": 59,
        "startSeconds": 5.9,
        "durationSeconds": 0.45,
        "label": "Em7"
      },
      {
        "note": 62,
        "startSeconds": 5.9,
        "durationSeconds": 0.45,
        "label": "Em7"
      },
      {
        "note": 57,
        "startSeconds": 7.86,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 60,
        "startSeconds": 7.86,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 64,
        "startSeconds": 7.86,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 67,
        "startSeconds": 7.86,
        "durationSeconds": 0.35,
        "label": "Am7"
      },
      {
        "note": 62,
        "startSeconds": 9.83,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 65,
        "startSeconds": 9.83,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 69,
        "startSeconds": 9.83,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 72,
        "startSeconds": 9.83,
        "durationSeconds": 0.35,
        "label": "Dm7"
      },
      {
        "note": 53,
        "startSeconds": 11.8,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 57,
        "startSeconds": 11.8,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 60,
        "startSeconds": 11.8,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 64,
        "startSeconds": 11.8,
        "durationSeconds": 0.35,
        "label": "Fmaj7"
      },
      {
        "note": 52,
        "startSeconds": 13.77,
        "durationSeconds": 0.6,
        "label": "Em7"
      },
      {
        "note": 55,
        "startSeconds": 13.77,
        "durationSeconds": 0.6,
        "label": "Em7"
      },
      {
        "note": 59,
        "startSeconds": 13.77,
        "durationSeconds": 0.6,
        "label": "Em7"
      },
      {
        "note": 62,
        "startSeconds": 13.77,
        "durationSeconds": 0.6,
        "label": "Em7"
      }
    ]
  },
  {
    "id": "chord_lvl7_bossa_nova_jazz",
    "title": "Bossa Nova Smooth 9th Grooves",
    "category": "chord",
    "level": 7,
    "icon": "🌴",
    "bpm": 128,
    "difficulty": "Pro",
    "description": "Rythmique Bossa Nova typique avec syncopes brésiliennes et accords riches (Cmaj9, Dm9, G13, Am9).",
    "durationSeconds": 30,
    "recommendedEngine": "FM",
    "recommendedPatch": "Bossa Electric Piano",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.4,
        "label": "Cmaj9"
      },
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.4,
        "label": "Cmaj9"
      },
      {
        "note": 67,
        "startSeconds": 0,
        "durationSeconds": 0.4,
        "label": "Cmaj9"
      },
      {
        "note": 71,
        "startSeconds": 0,
        "durationSeconds": 0.4,
        "label": "Cmaj9"
      },
      {
        "note": 60,
        "startSeconds": 0.7,
        "durationSeconds": 0.35,
        "label": "Cmaj9"
      },
      {
        "note": 64,
        "startSeconds": 0.7,
        "durationSeconds": 0.35,
        "label": "Cmaj9"
      },
      {
        "note": 67,
        "startSeconds": 0.7,
        "durationSeconds": 0.35,
        "label": "Cmaj9"
      },
      {
        "note": 71,
        "startSeconds": 0.7,
        "durationSeconds": 0.35,
        "label": "Cmaj9"
      },
      {
        "note": 62,
        "startSeconds": 1.87,
        "durationSeconds": 0.4,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 1.87,
        "durationSeconds": 0.4,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 1.87,
        "durationSeconds": 0.4,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 1.87,
        "durationSeconds": 0.4,
        "label": "Dm9"
      },
      {
        "note": 62,
        "startSeconds": 2.57,
        "durationSeconds": 0.35,
        "label": "Dm9"
      },
      {
        "note": 65,
        "startSeconds": 2.57,
        "durationSeconds": 0.35,
        "label": "Dm9"
      },
      {
        "note": 69,
        "startSeconds": 2.57,
        "durationSeconds": 0.35,
        "label": "Dm9"
      },
      {
        "note": 72,
        "startSeconds": 2.57,
        "durationSeconds": 0.35,
        "label": "Dm9"
      },
      {
        "note": 55,
        "startSeconds": 3.75,
        "durationSeconds": 0.4,
        "label": "G7alt"
      },
      {
        "note": 59,
        "startSeconds": 3.75,
        "durationSeconds": 0.4,
        "label": "G7alt"
      },
      {
        "note": 65,
        "startSeconds": 3.75,
        "durationSeconds": 0.4,
        "label": "G7alt"
      },
      {
        "note": 68,
        "startSeconds": 3.75,
        "durationSeconds": 0.4,
        "label": "G7alt"
      },
      {
        "note": 57,
        "startSeconds": 5.62,
        "durationSeconds": 0.5,
        "label": "Am9"
      },
      {
        "note": 60,
        "startSeconds": 5.62,
        "durationSeconds": 0.5,
        "label": "Am9"
      },
      {
        "note": 64,
        "startSeconds": 5.62,
        "durationSeconds": 0.5,
        "label": "Am9"
      },
      {
        "note": 67,
        "startSeconds": 5.62,
        "durationSeconds": 0.5,
        "label": "Am9"
      }
    ]
  },
  {
    "id": "drum_lvl3_reggaeton_dembow",
    "title": "Reggaeton Dembow & Shaker Bounce",
    "category": "drum",
    "level": 3,
    "icon": "🔥",
    "bpm": 96,
    "difficulty": "Intermédiaire",
    "description": "Le rythme Dembow universel : Kick 4/4 (41), Snares syncopés (45/46) et Shakers rapides (51).",
    "durationSeconds": 28,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Kit Latin Urban OP-1",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "Shaker"
      },
      {
        "note": 51,
        "startSeconds": 0.31,
        "durationSeconds": 0.15,
        "label": "Shaker"
      },
      {
        "note": 45,
        "startSeconds": 0.47,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 0.625,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 0.625,
        "durationSeconds": 0.15,
        "label": "Shaker"
      },
      {
        "note": 46,
        "startSeconds": 0.78,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 51,
        "startSeconds": 0.94,
        "durationSeconds": 0.15,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 1.25,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 51,
        "startSeconds": 1.25,
        "durationSeconds": 0.15,
        "label": "Shaker"
      },
      {
        "note": 45,
        "startSeconds": 1.72,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 1.875,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 46,
        "startSeconds": 2.03,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 41,
        "startSeconds": 2.5,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 2.97,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 3.125,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 46,
        "startSeconds": 3.28,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 41,
        "startSeconds": 3.75,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 45,
        "startSeconds": 4.22,
        "durationSeconds": 0.2,
        "label": "Snare"
      },
      {
        "note": 41,
        "startSeconds": 4.375,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 46,
        "startSeconds": 4.53,
        "durationSeconds": 0.2,
        "label": "Rim"
      },
      {
        "note": 53,
        "startSeconds": 4.8,
        "durationSeconds": 0.3,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "drum_lvl5_afro_house_polyrhythm",
    "title": "Afro-House 3-against-2 Polyrhythm",
    "category": "drum",
    "level": 5,
    "icon": "🥁",
    "bpm": 124,
    "difficulty": "Avancé",
    "description": "Polyrythmie riche combinant Kick Four-on-the-Floor (41), Congas (60), Shakers (51) et Claves (61).",
    "durationSeconds": 30,
    "recommendedEngine": "Drum",
    "recommendedPatch": "Kit Tribal Percs OP-1",
    "notes": [
      {
        "note": 41,
        "startSeconds": 0,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 0,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 61,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "Claves"
      },
      {
        "note": 51,
        "startSeconds": 0.24,
        "durationSeconds": 0.12,
        "label": "Shaker"
      },
      {
        "note": 41,
        "startSeconds": 0.48,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 60,
        "startSeconds": 0.48,
        "durationSeconds": 0.2,
        "label": "Conga"
      },
      {
        "note": 49,
        "startSeconds": 0.48,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 61,
        "startSeconds": 0.72,
        "durationSeconds": 0.15,
        "label": "Claves"
      },
      {
        "note": 41,
        "startSeconds": 0.96,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 0.96,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 47,
        "startSeconds": 0.96,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 60,
        "startSeconds": 1.2,
        "durationSeconds": 0.2,
        "label": "Conga"
      },
      {
        "note": 41,
        "startSeconds": 1.44,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 1.44,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 61,
        "startSeconds": 1.44,
        "durationSeconds": 0.15,
        "label": "Claves"
      },
      {
        "note": 53,
        "startSeconds": 1.68,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      },
      {
        "note": 41,
        "startSeconds": 1.92,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 49,
        "startSeconds": 1.92,
        "durationSeconds": 0.12,
        "label": "Hat"
      },
      {
        "note": 60,
        "startSeconds": 2.16,
        "durationSeconds": 0.2,
        "label": "Conga"
      },
      {
        "note": 41,
        "startSeconds": 2.4,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 47,
        "startSeconds": 2.88,
        "durationSeconds": 0.2,
        "label": "Clap"
      },
      {
        "note": 41,
        "startSeconds": 2.88,
        "durationSeconds": 0.25,
        "label": "Kick"
      },
      {
        "note": 53,
        "startSeconds": 3.6,
        "durationSeconds": 0.25,
        "label": "Open Hat"
      }
    ]
  },
  {
    "id": "arcade_lvl3_super_mario_theme",
    "title": "8-Bit Mushroom Kingdom Theme",
    "category": "arcade",
    "level": 3,
    "icon": "🍄",
    "bpm": 100,
    "difficulty": "Intermédiaire",
    "description": "Le thème légendaire de plateforme 8-bit avec arpèges rapides, staccatos et rebonds sautillants.",
    "durationSeconds": 28,
    "recommendedEngine": "Pulse",
    "recommendedPatch": "NES 8-Bit Square",
    "notes": [
      {
        "note": 64,
        "startSeconds": 0,
        "durationSeconds": 0.15,
        "label": "E4"
      },
      {
        "note": 64,
        "startSeconds": 0.2,
        "durationSeconds": 0.15,
        "label": "E4"
      },
      {
        "note": 64,
        "startSeconds": 0.5,
        "durationSeconds": 0.15,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 0.7,
        "durationSeconds": 0.15,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 0.9,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 1.2,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 55,
        "startSeconds": 1.8,
        "durationSeconds": 0.5,
        "label": "G3"
      },
      {
        "note": 60,
        "startSeconds": 2.7,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 55,
        "startSeconds": 3.1,
        "durationSeconds": 0.25,
        "label": "G3"
      },
      {
        "note": 52,
        "startSeconds": 3.5,
        "durationSeconds": 0.25,
        "label": "E3"
      },
      {
        "note": 57,
        "startSeconds": 4,
        "durationSeconds": 0.25,
        "label": "A3"
      },
      {
        "note": 59,
        "startSeconds": 4.4,
        "durationSeconds": 0.25,
        "label": "B3"
      },
      {
        "note": 58,
        "startSeconds": 4.8,
        "durationSeconds": 0.2,
        "label": "A#3"
      },
      {
        "note": 57,
        "startSeconds": 5.1,
        "durationSeconds": 0.3,
        "label": "A3"
      },
      {
        "note": 55,
        "startSeconds": 5.6,
        "durationSeconds": 0.3,
        "label": "G3"
      },
      {
        "note": 64,
        "startSeconds": 6,
        "durationSeconds": 0.25,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 6.4,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 6.8,
        "durationSeconds": 0.3,
        "label": "A4"
      },
      {
        "note": 65,
        "startSeconds": 7.3,
        "durationSeconds": 0.25,
        "label": "F4"
      },
      {
        "note": 67,
        "startSeconds": 7.7,
        "durationSeconds": 0.25,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 8.2,
        "durationSeconds": 0.3,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 8.7,
        "durationSeconds": 0.25,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 9.1,
        "durationSeconds": 0.25,
        "label": "D4"
      },
      {
        "note": 59,
        "startSeconds": 9.5,
        "durationSeconds": 0.4,
        "label": "B3"
      }
    ]
  },
  {
    "id": "arcade_lvl5_sonic_green_hill",
    "title": "Green Hill Zone Speed Run",
    "category": "arcade",
    "level": 5,
    "icon": "🦔",
    "bpm": 135,
    "difficulty": "Avancé",
    "description": "Arpèges étourdissants et gammes à pleine vitesse façon 16-bit Mega Drive FM.",
    "durationSeconds": 30,
    "recommendedEngine": "FM",
    "recommendedPatch": "Mega Drive FM Lead",
    "notes": [
      {
        "note": 60,
        "startSeconds": 0,
        "durationSeconds": 0.18,
        "label": "C4"
      },
      {
        "note": 62,
        "startSeconds": 0.22,
        "durationSeconds": 0.18,
        "label": "D4"
      },
      {
        "note": 64,
        "startSeconds": 0.44,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 0.66,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 69,
        "startSeconds": 0.88,
        "durationSeconds": 0.25,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 1.2,
        "durationSeconds": 0.2,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 1.5,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 62,
        "startSeconds": 1.8,
        "durationSeconds": 0.3,
        "label": "D4"
      },
      {
        "note": 60,
        "startSeconds": 2.3,
        "durationSeconds": 0.18,
        "label": "C4"
      },
      {
        "note": 64,
        "startSeconds": 2.52,
        "durationSeconds": 0.18,
        "label": "E4"
      },
      {
        "note": 67,
        "startSeconds": 2.74,
        "durationSeconds": 0.18,
        "label": "G4"
      },
      {
        "note": 72,
        "startSeconds": 2.96,
        "durationSeconds": 0.3,
        "label": "C5"
      },
      {
        "note": 71,
        "startSeconds": 3.3,
        "durationSeconds": 0.2,
        "label": "B4"
      },
      {
        "note": 69,
        "startSeconds": 3.6,
        "durationSeconds": 0.2,
        "label": "A4"
      },
      {
        "note": 67,
        "startSeconds": 3.9,
        "durationSeconds": 0.4,
        "label": "G4"
      },
      {
        "note": 64,
        "startSeconds": 4.4,
        "durationSeconds": 0.2,
        "label": "E4"
      },
      {
        "note": 60,
        "startSeconds": 4.7,
        "durationSeconds": 0.4,
        "label": "C4"
      }
    ]
  }
];
