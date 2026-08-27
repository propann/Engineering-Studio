/**
 * types.ts — Définitions pour le Mini-Git Audio & Co-Création Locale
 */

export interface AudioBlobRef {
  /** Hash SHA-256 du contenu binaire (Content-Addressable Storage) */
  hash: string;
  name: string;
  byteLength: number;
  format: "wav" | "aiff" | "json" | "ogg";
  durationSeconds?: number;
  sampleRate?: number;
  channels?: number;
}

export interface TrackPatternStep {
  note: number;
  velocity: number;
  durationSteps: number;
  active: boolean;
}

export interface TrackPattern {
  id: string;
  name: string;
  stepsCount: number;
  steps: TrackPatternStep[];
}

export interface ParameterAutomationPoint {
  step: number; // 0..63
  value: number; // 0..127 or 0.0..1.0
  curve?: "linear" | "exponential" | "instant";
}

export interface TrackAutomationLane {
  targetParameter: "filter_cutoff" | "filter_resonance" | "volume" | "pan" | "send_fx";
  points: ParameterAutomationPoint[];
}

export interface MusicTrackLane {
  id: string;
  name: string;
  color?: string;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 to 1.0
  muted: boolean;
  solo: boolean;
  sampleBlob?: AudioBlobRef;
  patterns: TrackPattern[];
  automations?: TrackAutomationLane[];
  fxConfig?: Record<string, number | string | boolean>;
  notesAuthor?: string;
}

export interface MusicTag {
  name: string;
  commitId: string;
  annotatedBy?: string;
  timestamp: number;
}

export interface ProjectTimelineMarker {
  id: string;
  bar: number;
  beat: number;
  label: string;
  comment?: string;
  author?: string;
}

export interface MusicProjectSnapshot {
  id: string;
  name: string;
  bpm: number;
  timeSignature: [number, number]; // e.g. [4, 4]
  scale: string; // e.g. "C Minor"
  swing: number; // 0 to 100%
  masterVolume: number;
  tracks: MusicTrackLane[];
  markers: ProjectTimelineMarker[];
  customMeta?: Record<string, unknown>;
}

export interface MusicCommit {
  id: string; // Hash SHA-256 du commit
  parentId: string | null; // Parent commit hash (or null if initial)
  secondParentId?: string | null; // Si issu d'un merge
  branch: string; // e.g. "main", "dev", "solo-lead"
  author: {
    name: string;
    avatar?: string;
    publicKey?: string;
  };
  message: string;
  timestamp: number;
  snapshot: MusicProjectSnapshot;
  blobs: AudioBlobRef[]; // Liste des blobs audio référencés
}

export interface MusicBranch {
  name: string;
  headCommitId: string;
  createdAt: number;
  isDefault?: boolean;
}

export interface DiffTrackChange {
  trackId: string;
  trackName: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  details: string[];
}

export interface MusicProjectDiff {
  fromCommitId: string;
  toCommitId: string;
  bpmChanged?: { from: number; to: number };
  trackChanges: DiffTrackChange[];
  markerChanges: string[];
}

export interface MergeConflictLane {
  trackId: string;
  trackName: string;
  sourceVersion: MusicTrackLane;
  targetVersion: MusicTrackLane;
  resolution: "keep-target" | "take-source" | "create-alternative-lane";
}

export interface MergeResult {
  success: boolean;
  mergedSnapshot: MusicProjectSnapshot;
  conflicts: MergeConflictLane[];
  createdAlternativeLanes: MusicTrackLane[];
}

export interface MusicProjectBundle {
  format: "engineering-studio.music-bundle";
  version: 1;
  exportedAt: number;
  projectName: string;
  activeBranch: string;
  branches: MusicBranch[];
  commits: MusicCommit[];
  tags?: MusicTag[];
  blobsBase64?: Record<string, string>; // Hash -> Base64 data
}
