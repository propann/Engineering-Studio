/**
 * characterProfile.ts — Fiche de Personnage RPG Unifiée & Système de Progression OP-1 Studio.
 * 
 * Regroupe TOUTES les informations de l'opérateur et du studio :
 * - Identité : Nom personnalisable, avatar modifiable, niveau (1-50), titre honorifique
 * - Studio & Machine : Machine OP-1, snapshots de sauvegarde, espace local, préférences
 * - Disciplines (4 spécialités) : Mélodies, Accords, Finger Drumming, Arcade & Styles Modernes
 * - Statistiques globales : Notes réussies, précision moyenne, combo record, temps d'entraînement, score cumulé
 * - Système de Badges & Trophées RPG (20+ succès déblocables)
 * - Historique détaillé de toutes les sessions d'entraînement
 * - Sauvegarde et restauration locale sécurisée
 */

export interface OperatorStudioInfo {
  machineModel: string;
  deviceRef: string;
  firmwareVersion: string;
  backupSnapshotsCount: number;
  localUsedBytes: number;
  preferredTheme: string;
}

export interface CharacterStats {
  totalNotesHit: number;
  perfectHits: number;
  greatHits: number;
  goodHits: number;
  missHits: number;
  highestCombo: number;
  totalScore: number;
  totalPlayTimeSeconds: number;
  sessionsCount: number;
  // XP par spécialité
  melodyXp: number;
  chordXp: number;
  drumXp: number;
  arcadeXp: number;
  // Meilleurs scores par exercice
  bestScoresBySong: Record<string, { highscore: number; bestAccuracy: number; bestRank: string; completedCount: number }>;
}

export interface CharacterAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "melody" | "chord" | "drum" | "arcade" | "score" | "level";
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number; // 0 à 100
}

export interface SessionResult {
  songId: string;
  songTitle: string;
  category: "melody" | "chord" | "drum" | "arcade" | "custom";
  score: number;
  accuracy: number; // 0-100%
  rank: "S+" | "S" | "A" | "B" | "C" | "D";
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  xpEarned: number;
  timestamp: number;
}

export interface CharacterProfile {
  version: number;
  operatorName: string;
  operatorAvatar: string; // "robot" | "synth" | "tape" | "drum" | "cyber" | "astronaut" | "pixel"
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  title: string;
  studioInfo: OperatorStudioInfo;
  stats: CharacterStats;
  achievements: CharacterAchievement[];
  history: SessionResult[];
  lastActive: number;
}

const STORAGE_KEY = "op1_character_profile_unified_v3";

export const HUB_AVATAR_ICONS: Record<string, string> = {
  teacher: "🧑‍🏫",
  carpenter: "🪚",
  artist: "🎨",
  barista: "☕",
  support: "🎧",
  architect: "📐",
  activist: "📢",
  "mail-carrier": "📬",
  builder: "👷",
  scientist: "🧪",
  student: "🎒",
  librarian: "📚",
  trainer: "🏋️",
  "office-worker": "💼",
  influencer: "📱",
  chef: "🍳",
  courier: "📦",
  grandma: "👵",
  musician: "🎵",
  paramedic: "🚑",
  knight: "🛡️",
  rogue: "🗡️",
  smith: "🔨",
  archer: "🏹",
  scholar: "📜",
  warrior: "⚔️",
  goblin: "👺",
  cyborg: "🦾",
  "cat-adventurer": "🐱",
  pirate: "🏴‍☠️",
  sorceress: "🔮",
  viking: "🪓",
  engineer: "⚙️",
  necromancer: "💀",
  ranger: "🌲",
  "royal-guard": "💂",
  fighter: "🥊",
  samurai: "🥋",
  cultist: "🕯️",
  explorer: "🧭",
  robot: "🤖",
  synth: "🎹",
  drum: "🥁",
  tape: "📼",
  cyber: "👾",
  astronaut: "👨‍🚀",
  wizard: "🧙‍♂️",
  dj: "🎧",
};

export const OPERATOR_AVATARS = [
  { id: "robot", icon: "🤖", name: "Androïde OP-1" },
  { id: "synth", icon: "🎹", name: "Maître des Ondes" },
  { id: "drum", icon: "🥁", name: "Rythmicien 808" },
  { id: "tape", icon: "📼", name: "Gardien du Ruban" },
  { id: "cyber", icon: "👾", name: "Cyberpunk 2077" },
  { id: "astronaut", icon: "👨‍🚀", name: "Cosmonaute Sonore" },
  { id: "engineer", icon: "⚙️", name: "Ingénieur Studio" },
  { id: "musician", icon: "🎵", name: "Artiste Compositeur" },
  { id: "wizard", icon: "🧙‍♂️", name: "Alchimiste Audio" },
  { id: "dj", icon: "🎧", name: "Beatmaker Studio" },
  { id: "cyborg", icon: "🦾", name: "Cyborg Modifié" },
  { id: "cat-adventurer", icon: "🐱", name: "Félin Rythmique" },
];

export const OPERATOR_TITLES = [
  { level: 1, title: "Apprenti Cadence" },
  { level: 3, title: "Opérateur de Ruban" },
  { level: 5, title: "Rythmicien en Herbe" },
  { level: 8, title: "Beatmaker du Studio" },
  { level: 12, title: "Maître des Accords" },
  { level: 16, title: "Virtuose des Touches" },
  { level: 20, title: "Finger Drummer Émérite" },
  { level: 25, title: "Alchimiste Sonore OP-1" },
  { level: 30, title: "Grand Maître du Synthé" },
  { level: 40, title: "Légende Vivante du Studio" },
  { level: 50, title: "Grand Architecte Audio" },
];

export const INITIAL_ACHIEVEMENTS: CharacterAchievement[] = [
  {
    id: "first_perfect_run",
    title: "Précision Chirurgicale",
    description: "Terminer un exercice avec plus de 95% de précision.",
    icon: "🎯",
    category: "score",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "combo_master_30",
    title: "En Rythme !",
    description: "Atteindre un combo de 30 notes consécutives.",
    icon: "⚡",
    category: "score",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "combo_master_60",
    title: "En Fusion !",
    description: "Atteindre un combo de 60 notes sans interruption.",
    icon: "🔥",
    category: "score",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "combo_master_100",
    title: "Transcendance",
    description: "Atteindre un combo exceptionnel de 100 notes d'affilée.",
    icon: "💫",
    category: "score",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "melody_apprentice",
    title: "Doigts Agiles",
    description: "Gagner 500 XP dans la catégorie Mélodies & Leads.",
    icon: "🎹",
    category: "melody",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "melody_virtuoso",
    title: "Maître des Gammes",
    description: "Gagner 2 000 XP en Mélodies et réussir un exercice Niveau 8+.",
    icon: "🎼",
    category: "melody",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "chord_harmony_initiate",
    title: "Oreille Harmonique",
    description: "Gagner 500 XP dans la catégorie Accords & Harmonies.",
    icon: "🌟",
    category: "chord",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "chord_jazz_master",
    title: "Virtuose Neo-Soul",
    description: "Réussir la progression Neo-Soul ou Gospel avec le rang S.",
    icon: "🎷",
    category: "chord",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "finger_drummer_initiate",
    title: "Doigts de Fée",
    description: "Gagner 500 XP dans les exercices de Finger Drumming OP-1.",
    icon: "🥁",
    category: "drum",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "finger_drummer_drill",
    title: "Drill & 808 Master",
    description: "Terminer un exercice Trap/Drill/Afrobeat avec 90%+ de précision.",
    icon: "🎧",
    category: "drum",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "finger_drummer_amen",
    title: "Jungle Speed Champion",
    description: "Dompter le Drum & Bass 170 BPM au Niveau 10.",
    icon: "💥",
    category: "drum",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "arcade_tetris",
    title: "Légende 8-Bit",
    description: "Terminer le thème Tetris Korobeiniki avec le rang S.",
    icon: "👾",
    category: "arcade",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "arcade_french_touch",
    title: "French Touch Forever",
    description: "Terminer le défi Daft Punk / Disco Filtered avec succès.",
    icon: "🪩",
    category: "arcade",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "arcade_cyber_rush",
    title: "Hacker Cyberpunk",
    description: "Réussir le Boss Rush Arcade Niveau 10 sans perdre de combo.",
    icon: "🌃",
    category: "arcade",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "operator_level_5",
    title: "Opérateur Confirmé",
    description: "Atteindre le niveau 5 d'Opérateur OP-1.",
    icon: "🥉",
    category: "level",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "operator_level_10",
    title: "Pionnier de l'Atelier",
    description: "Atteindre le niveau 10 d'Opérateur OP-1.",
    icon: "🥈",
    category: "level",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "operator_level_25",
    title: "Alchimiste Légendaire",
    description: "Atteindre le niveau 25 d'Opérateur OP-1.",
    icon: "🥇",
    category: "level",
    unlocked: false,
    progressPercent: 0,
  },
  {
    id: "operator_level_50",
    title: "Grand Architecte Audio",
    description: "Atteindre le niveau suprême 50 du Studio.",
    icon: "👑",
    category: "level",
    unlocked: false,
    progressPercent: 0,
  },
];

export function getXpRequiredForLevel(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.32));
}

export function getTitleForLevel(level: number): string {
  let title = OPERATOR_TITLES[0].title;
  for (const item of OPERATOR_TITLES) {
    if (level >= item.level) {
      title = item.title;
    }
  }
  return title;
}

export function calculateRank(accuracy: number): "S+" | "S" | "A" | "B" | "C" | "D" {
  if (accuracy >= 98) return "S+";
  if (accuracy >= 92) return "S";
  if (accuracy >= 82) return "A";
  if (accuracy >= 70) return "B";
  if (accuracy >= 55) return "C";
  return "D";
}

export function createDefaultProfile(): CharacterProfile {
  return {
    version: 3,
    operatorName: "Opérateur OP-1",
    operatorAvatar: "robot",
    level: 1,
    currentXp: 0,
    xpForNextLevel: getXpRequiredForLevel(1),
    title: "Apprenti Cadence",
    studioInfo: {
      machineModel: "Teenage Engineering OP-1 (Classic & Field)",
      deviceRef: "OP1-STUDIO-LAB-01",
      firmwareVersion: "v246-mod-ready",
      backupSnapshotsCount: 4,
      localUsedBytes: 14200000,
      preferredTheme: "machine",
    },
    stats: {
      totalNotesHit: 0,
      perfectHits: 0,
      greatHits: 0,
      goodHits: 0,
      missHits: 0,
      highestCombo: 0,
      totalScore: 0,
      totalPlayTimeSeconds: 0,
      sessionsCount: 0,
      melodyXp: 0,
      chordXp: 0,
      drumXp: 0,
      arcadeXp: 0,
      bestScoresBySong: {},
    },
    achievements: INITIAL_ACHIEVEMENTS,
    history: [],
    lastActive: Date.now(),
  };
}

export function syncWithHubProfile(profile: CharacterProfile): { updated: CharacterProfile; synced: boolean; hubName?: string } {
  if (typeof window === "undefined") return { updated: profile, synced: false };
  try {
    const hubRaw = localStorage.getItem("studio-hub-profile");
    if (!hubRaw) return { updated: profile, synced: false };
    const hubProfile = JSON.parse(hubRaw);
    if (!hubProfile) return { updated: profile, synced: false };

    let changed = false;
    const updated: CharacterProfile = { ...profile };

    if (hubProfile.name && typeof hubProfile.name === "string" && hubProfile.name.trim() && hubProfile.name !== profile.operatorName) {
      updated.operatorName = hubProfile.name.trim();
      changed = true;
    }

    if (hubProfile.avatar && typeof hubProfile.avatar === "string") {
      updated.operatorAvatar = hubProfile.avatar;
      changed = true;
    }

    if (hubProfile.workspace?.name) {
      updated.studioInfo = {
        ...updated.studioInfo,
        deviceRef: hubProfile.workspace.name.toUpperCase(),
      };
    }

    if (changed) {
      saveCharacterProfile(updated);
    }

    return { updated, synced: true, hubName: hubProfile.name };
  } catch {
    return { updated: profile, synced: false };
  }
}

export function loadCharacterProfile(): CharacterProfile {
  if (typeof window === "undefined") {
    return createDefaultProfile();
  }

  try {
    let result: CharacterProfile;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Tentative de migration depuis l'ancienne clé v2 si présente
      const oldRaw = localStorage.getItem("op1_character_profile_v2");
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw);
        const def = createDefaultProfile();
        result = {
          ...def,
          operatorName: oldParsed.operatorName || def.operatorName,
          operatorAvatar: oldParsed.operatorAvatar || def.operatorAvatar,
          level: oldParsed.level || def.level,
          currentXp: oldParsed.currentXp || def.currentXp,
          xpForNextLevel: getXpRequiredForLevel(oldParsed.level || 1),
          title: getTitleForLevel(oldParsed.level || 1),
          stats: {
            ...def.stats,
            ...(oldParsed.stats || {}),
          },
        };
      } else {
        result = createDefaultProfile();
      }
    } else {
      const parsed = JSON.parse(raw) as CharacterProfile;
      if (!parsed || typeof parsed.level !== "number") {
        result = createDefaultProfile();
      } else {
        // Injection garantie des nouveaux achievements sans casser les déblocages
        const existingIds = new Set((parsed.achievements || []).map((a) => a.id));
        const mergedAchievements = [...(parsed.achievements || [])];
        for (const ach of INITIAL_ACHIEVEMENTS) {
          if (!existingIds.has(ach.id)) {
            mergedAchievements.push(ach);
          }
        }
        parsed.achievements = mergedAchievements;
        if (!parsed.stats.bestScoresBySong) parsed.stats.bestScoresBySong = {};
        if (!parsed.studioInfo) parsed.studioInfo = createDefaultProfile().studioInfo;
        result = parsed;
      }
    }

    // Auto-sync doux avec la fiche de personnage du Studio Hub si présente
    try {
      const hubRaw = localStorage.getItem("studio-hub-profile");
      if (hubRaw) {
        const hubProfile = JSON.parse(hubRaw);
        if (hubProfile.name && (result.operatorName === "Opérateur OP-1" || result.operatorName === "NOUVEAU MEMBRE")) {
          result.operatorName = hubProfile.name.trim();
        }
        if (hubProfile.avatar && result.operatorAvatar === "robot") {
          result.operatorAvatar = hubProfile.avatar;
        }
      }
    } catch {
      // Ignorer
    }

    return result;
  } catch {
    return createDefaultProfile();
  }
}

export function saveCharacterProfile(profile: CharacterProfile): void {
  if (typeof window === "undefined") return;
  try {
    profile.lastActive = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota ou stockage indisponible
  }
}

export function recordSessionScore(
  profile: CharacterProfile,
  result: Omit<SessionResult, "xpEarned" | "timestamp" | "rank"> & { durationSeconds: number }
): { updatedProfile: CharacterProfile; newLevel: boolean; newAchievements: CharacterAchievement[] } {
  const newAchievements: CharacterAchievement[] = [];
  let newLevel = false;

  const rank = calculateRank(result.accuracy);

  // Calcul d'XP généreux basé sur les hits et le multiplicateur de précision
  const baseHitXp = result.perfectCount * 14 + result.greatCount * 9 + result.goodCount * 5;
  const comboBonus = Math.floor(result.maxCombo * 3.0);
  const accuracyMultiplier = result.accuracy >= 98 ? 1.6 : result.accuracy >= 90 ? 1.35 : result.accuracy >= 75 ? 1.1 : 0.7;
  const xpEarned = Math.max(20, Math.floor((baseHitXp + comboBonus) * accuracyMultiplier));

  // Mise à jour des stats globales
  const stats = { ...profile.stats };
  stats.totalNotesHit += (result.perfectCount + result.greatCount + result.goodCount);
  stats.perfectHits += result.perfectCount;
  stats.greatHits += result.greatCount;
  stats.goodHits += result.goodCount;
  stats.missHits += result.missCount;
  stats.highestCombo = Math.max(stats.highestCombo, result.maxCombo);
  stats.totalScore += result.score;
  stats.totalPlayTimeSeconds += Math.round(result.durationSeconds);
  stats.sessionsCount += 1;

  // Meilleurs scores par exercice
  const existingBest = stats.bestScoresBySong[result.songId] || { highscore: 0, bestAccuracy: 0, bestRank: "D", completedCount: 0 };
  stats.bestScoresBySong[result.songId] = {
    highscore: Math.max(existingBest.highscore, result.score),
    bestAccuracy: Math.max(existingBest.bestAccuracy, result.accuracy),
    bestRank: result.accuracy >= existingBest.bestAccuracy ? rank : existingBest.bestRank,
    completedCount: existingBest.completedCount + 1,
  };

  // Répartition XP par discipline
  if (result.category === "melody") stats.melodyXp += xpEarned;
  else if (result.category === "chord") stats.chordXp += xpEarned;
  else if (result.category === "drum") stats.drumXp += xpEarned;
  else stats.arcadeXp += xpEarned;

  // Progression Level Up RPG
  let currentXp = profile.currentXp + xpEarned;
  let level = profile.level;
  let xpForNextLevel = profile.xpForNextLevel;

  while (currentXp >= xpForNextLevel && level < 50) {
    currentXp -= xpForNextLevel;
    level += 1;
    xpForNextLevel = getXpRequiredForLevel(level);
    newLevel = true;
  }

  const title = getTitleForLevel(level);

  // Vérification & Déblocage des Succès (Achievements)
  const achievements = profile.achievements.map((ach) => {
    if (ach.unlocked) return ach;
    let unlocked = false;
    let progress = ach.progressPercent;

    if (ach.id === "first_perfect_run" && result.accuracy >= 95) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "combo_master_30") {
      progress = Math.min(100, Math.round((stats.highestCombo / 30) * 100));
      if (stats.highestCombo >= 30) unlocked = true;
    } else if (ach.id === "combo_master_60") {
      progress = Math.min(100, Math.round((stats.highestCombo / 60) * 100));
      if (stats.highestCombo >= 60) unlocked = true;
    } else if (ach.id === "combo_master_100") {
      progress = Math.min(100, Math.round((stats.highestCombo / 100) * 100));
      if (stats.highestCombo >= 100) unlocked = true;
    } else if (ach.id === "melody_apprentice") {
      progress = Math.min(100, Math.round((stats.melodyXp / 500) * 100));
      if (stats.melodyXp >= 500) unlocked = true;
    } else if (ach.id === "melody_virtuoso") {
      progress = Math.min(100, Math.round((stats.melodyXp / 2000) * 100));
      if (stats.melodyXp >= 2000 && result.category === "melody" && result.accuracy >= 90) unlocked = true;
    } else if (ach.id === "chord_harmony_initiate") {
      progress = Math.min(100, Math.round((stats.chordXp / 500) * 100));
      if (stats.chordXp >= 500) unlocked = true;
    } else if (ach.id === "chord_jazz_master" && result.category === "chord" && (result.songId.includes("neosoul") || result.songId.includes("gospel") || result.songId.includes("jazz")) && result.accuracy >= 92) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "finger_drummer_initiate") {
      progress = Math.min(100, Math.round((stats.drumXp / 500) * 100));
      if (stats.drumXp >= 500) unlocked = true;
    } else if (ach.id === "finger_drummer_drill" && (result.songId.includes("drill") || result.songId.includes("trap") || result.songId.includes("afrobeat")) && result.accuracy >= 90) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "finger_drummer_amen" && result.songId.includes("jungle") && result.accuracy >= 85) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "arcade_tetris" && result.songId === "arcade_tetris" && result.accuracy >= 92) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "arcade_french_touch" && result.songId.includes("french_touch") && result.accuracy >= 90) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "arcade_cyber_rush" && result.songId.includes("boss_rush") && result.accuracy >= 90) {
      unlocked = true;
      progress = 100;
    } else if (ach.id === "operator_level_5") {
      progress = Math.min(100, Math.round((level / 5) * 100));
      if (level >= 5) unlocked = true;
    } else if (ach.id === "operator_level_10") {
      progress = Math.min(100, Math.round((level / 10) * 100));
      if (level >= 10) unlocked = true;
    } else if (ach.id === "operator_level_25") {
      progress = Math.min(100, Math.round((level / 25) * 100));
      if (level >= 25) unlocked = true;
    } else if (ach.id === "operator_level_50") {
      progress = Math.min(100, Math.round((level / 50) * 100));
      if (level >= 50) unlocked = true;
    }

    if (unlocked && !ach.unlocked) {
      const updated = { ...ach, unlocked: true, progressPercent: 100, unlockedAt: new Date().toISOString() };
      newAchievements.push(updated);
      return updated;
    }

    return { ...ach, progressPercent: progress };
  });

  const sessionEntry: SessionResult = {
    songId: result.songId,
    songTitle: result.songTitle,
    category: result.category,
    score: result.score,
    accuracy: result.accuracy,
    rank,
    maxCombo: result.maxCombo,
    perfectCount: result.perfectCount,
    greatCount: result.greatCount,
    goodCount: result.goodCount,
    missCount: result.missCount,
    xpEarned,
    timestamp: Date.now(),
  };

  // Garder les 50 dernières sessions
  const history = [sessionEntry, ...(profile.history || [])].slice(0, 50);

  const updatedProfile: CharacterProfile = {
    ...profile,
    level,
    currentXp,
    xpForNextLevel,
    title,
    stats,
    achievements,
    history,
  };

  saveCharacterProfile(updatedProfile);

  return { updatedProfile, newLevel, newAchievements };
}
