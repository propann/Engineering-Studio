import type { GameSongTheme } from "./gameSongsCatalog";

export const EXERCISE_RULES = {
  playableMidiMin: 53,
  playableMidiMax: 76,
  minBpm: 40,
  maxBpm: 240,
  minLevel: 1,
  maxLevel: 10,
} as const;

export function validateExerciseCatalog(themes: readonly GameSongTheme[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const theme of themes) {
    const prefix = `[${theme.id || "sans-id"}]`;
    if (!theme.id.trim()) errors.push(`${prefix} identifiant vide`);
    if (ids.has(theme.id)) errors.push(`${prefix} identifiant dupliqué`);
    ids.add(theme.id);

    if (!Number.isInteger(theme.level) || theme.level < EXERCISE_RULES.minLevel || theme.level > EXERCISE_RULES.maxLevel) errors.push(`${prefix} niveau hors 1-10`);
    if (!Number.isFinite(theme.bpm) || theme.bpm < EXERCISE_RULES.minBpm || theme.bpm > EXERCISE_RULES.maxBpm) errors.push(`${prefix} BPM hors 40-240`);
    if (!Number.isFinite(theme.durationSeconds) || theme.durationSeconds <= 0) errors.push(`${prefix} durée invalide`);
    if (theme.notes.length === 0) errors.push(`${prefix} aucune note`);

    let previousStart = -1;
    theme.notes.forEach((note, index) => {
      const notePrefix = `${prefix} note ${index + 1}`;
      if (!Number.isInteger(note.note) || note.note < EXERCISE_RULES.playableMidiMin || note.note > EXERCISE_RULES.playableMidiMax) errors.push(`${notePrefix} hors clavier MIDI 53-76`);
      if (!Number.isFinite(note.startSeconds) || note.startSeconds < 0) errors.push(`${notePrefix} départ invalide`);
      if (note.startSeconds < previousStart) errors.push(`${notePrefix} ordre chronologique cassé`);
      if (!Number.isFinite(note.durationSeconds) || note.durationSeconds <= 0) errors.push(`${notePrefix} durée invalide`);
      previousStart = note.startSeconds;
    });
  }
  return errors;
}

export function assertExerciseCatalog(themes: readonly GameSongTheme[]): void {
  const errors = validateExerciseCatalog(themes);
  if (errors.length > 0) throw new Error(`Catalogue d’exercices invalide:\n${errors.join("\n")}`);
}
