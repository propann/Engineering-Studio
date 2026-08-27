/**
 * gitEngine.ts — Moteur Mini-Git Décentralisé pour la Musique & Co-Création
 */

import { computeObjectHash } from "./hash";
import type {
  AudioBlobRef,
  DiffTrackChange,
  MergeResult,
  MusicBranch,
  MusicCommit,
  MusicProjectBundle,
  MusicProjectDiff,
  MusicProjectSnapshot,
  MusicTag,
  MusicTrackLane,
} from "./types";

export interface CreateCommitOptions {
  message: string;
  author: {
    name: string;
    avatar?: string;
    publicKey?: string;
  };
  snapshot: MusicProjectSnapshot;
  blobs?: AudioBlobRef[];
}

export class MusicGitRepository {
  private projectName: string;
  private activeBranchName: string = "main";
  private branches: Map<string, MusicBranch> = new Map();
  private commits: Map<string, MusicCommit> = new Map();
  private tags: Map<string, MusicTag> = new Map();
  private blobs: Map<string, Uint8Array> = new Map();

  constructor(projectName: string = "Nouveau Morceau") {
    this.projectName = projectName;
  }

  /**
   * Initialise le dépôt avec un snapshot initial et la branche 'main'
   */
  async init(initialSnapshot?: Partial<MusicProjectSnapshot>, authorName: string = "Opérateur"): Promise<MusicCommit> {
    const baseSnapshot: MusicProjectSnapshot = {
      id: "proj-" + Math.random().toString(36).slice(2, 9),
      name: this.projectName,
      bpm: 120,
      timeSignature: [4, 4],
      scale: "C Majeur",
      swing: 0,
      masterVolume: 0.85,
      tracks: [
        {
          id: "tr-kick",
          name: "Kick 909",
          volume: 0.9,
          pan: 0,
          muted: false,
          solo: false,
          color: "#ff5a1f",
          patterns: [
            {
              id: "pat-1",
              name: "Four on Floor",
              stepsCount: 16,
              steps: Array.from({ length: 16 }, (_, i) => ({
                note: 36,
                velocity: i % 4 === 0 ? 120 : 0,
                durationSteps: 1,
                active: i % 4 === 0,
              })),
            },
          ],
        },
        {
          id: "tr-snare",
          name: "Snare / Clap",
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          color: "#d9ff43",
          patterns: [
            {
              id: "pat-2",
              name: "Backbeat",
              stepsCount: 16,
              steps: Array.from({ length: 16 }, (_, i) => ({
                note: 38,
                velocity: i === 4 || i === 12 ? 110 : 0,
                durationSteps: 1,
                active: i === 4 || i === 12,
              })),
            },
          ],
        },
        {
          id: "tr-synth",
          name: "OP-1 Lead Synth",
          volume: 0.75,
          pan: 0,
          muted: false,
          solo: false,
          color: "#00ed95",
          patterns: [
            {
              id: "pat-3",
              name: "Melody 1",
              stepsCount: 16,
              steps: Array.from({ length: 16 }, (_, i) => ({
                note: 60 + (i % 7) * 2,
                velocity: i % 2 === 0 ? 95 : 0,
                durationSteps: 1,
                active: i % 2 === 0,
              })),
            },
          ],
        },
      ],
      markers: [{ id: "m-1", bar: 1, beat: 1, label: "Intro", author: authorName }],
      ...initialSnapshot,
    };

    const commit = await this.commit({
      message: "Initial commit: Création du projet musical",
      author: { name: authorName },
      snapshot: baseSnapshot,
      blobs: [],
    });

    this.activeBranchName = "main";
    this.branches.set("main", {
      name: "main",
      headCommitId: commit.id,
      createdAt: Date.now(),
      isDefault: true,
    });

    return commit;
  }

  getProjectName(): string {
    return this.projectName;
  }

  getActiveBranch(): string {
    return this.activeBranchName;
  }

  getBranches(): MusicBranch[] {
    return Array.from(this.branches.values());
  }

  getHeadCommit(): MusicCommit | null {
    const branch = this.branches.get(this.activeBranchName);
    if (!branch) return null;
    return this.commits.get(branch.headCommitId) || null;
  }

  getCommit(commitId: string): MusicCommit | null {
    return this.commits.get(commitId) || null;
  }

  /**
   * Met à jour le snapshot de travail du commit HEAD actuel
   */
  updateHeadSnapshot(newSnapshot: MusicProjectSnapshot): void {
    const head = this.getHeadCommit();
    if (head) {
      head.snapshot = JSON.parse(JSON.stringify(newSnapshot));
    }
  }

  /**
   * Crée un nouveau commit sur la branche active
   */
  async commit(options: CreateCommitOptions): Promise<MusicCommit> {
    const parent = this.getHeadCommit();
    const parentId = parent ? parent.id : null;
    const timestamp = Date.now();

    const commitDataToHash = {
      parentId,
      branch: this.activeBranchName,
      author: options.author,
      message: options.message,
      timestamp,
      snapshot: options.snapshot,
      blobs: options.blobs || [],
    };

    const commitId = await computeObjectHash(commitDataToHash);

    const commit: MusicCommit = {
      id: commitId,
      parentId,
      branch: this.activeBranchName,
      author: options.author,
      message: options.message,
      timestamp,
      snapshot: JSON.parse(JSON.stringify(options.snapshot)),
      blobs: options.blobs || [],
    };

    this.commits.set(commitId, commit);

    // Mise à jour de la tête de branche
    const currentBranch = this.branches.get(this.activeBranchName);
    if (currentBranch) {
      currentBranch.headCommitId = commitId;
    } else {
      this.branches.set(this.activeBranchName, {
        name: this.activeBranchName,
        headCommitId: commitId,
        createdAt: timestamp,
      });
    }

    return commit;
  }

  /**
   * Crée une nouvelle branche depuis le commit HEAD actuel
   */
  createBranch(branchName: string): MusicBranch {
    const cleanName = branchName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (!cleanName) {
      throw new Error("Nom de branche invalide.");
    }
    if (this.branches.has(cleanName)) {
      throw new Error(`La branche '${cleanName}' existe déjà.`);
    }

    const head = this.getHeadCommit();
    if (!head) {
      throw new Error("Impossible de créer une branche sans commit initial.");
    }

    const newBranch: MusicBranch = {
      name: cleanName,
      headCommitId: head.id,
      createdAt: Date.now(),
    };

    this.branches.set(cleanName, newBranch);
    return newBranch;
  }

  /**
   * Change de branche active
   */
  checkout(branchName: string): MusicProjectSnapshot {
    const branch = this.branches.get(branchName);
    if (!branch) {
      throw new Error(`Branche introuvable : ${branchName}`);
    }
    this.activeBranchName = branchName;
    const headCommit = this.commits.get(branch.headCommitId);
    if (!headCommit) {
      throw new Error(`Commit de tête introuvable pour la branche ${branchName}`);
    }
    return JSON.parse(JSON.stringify(headCommit.snapshot));
  }

  /**
   * Historique complet des commits (chronologique inversé)
   */
  getHistory(limit: number = 50): MusicCommit[] {
    const list = Array.from(this.commits.values());
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list.slice(0, limit);
  }

  /**
   * Compare deux versions (diff musical)
   */
  diff(fromCommitId: string, toCommitId: string): MusicProjectDiff {
    const fromCommit = this.commits.get(fromCommitId);
    const toCommit = this.commits.get(toCommitId);
    if (!fromCommit || !toCommit) {
      throw new Error("Commit non trouvé pour le diff.");
    }

    const fromSnap = fromCommit.snapshot;
    const toSnap = toCommit.snapshot;

    const diff: MusicProjectDiff = {
      fromCommitId,
      toCommitId,
      trackChanges: [],
      markerChanges: [],
    };

    if (fromSnap.bpm !== toSnap.bpm) {
      diff.bpmChanged = { from: fromSnap.bpm, to: toSnap.bpm };
    }

    const fromTracksMap = new Map(fromSnap.tracks.map((t) => [t.id, t]));
    const toTracksMap = new Map(toSnap.tracks.map((t) => [t.id, t]));

    // Vérification des pistes modifiées ou ajoutées
    for (const [id, toTrack] of toTracksMap.entries()) {
      const fromTrack = fromTracksMap.get(id);
      if (!fromTrack) {
        diff.trackChanges.push({
          trackId: id,
          trackName: toTrack.name,
          changeType: "added",
          details: [`Nouvelle piste ajoutée avec ${toTrack.patterns.length} pattern(s)`],
        });
      } else {
        const details: string[] = [];
        if (fromTrack.volume !== toTrack.volume) {
          details.push(`Volume modifié (${Math.round(fromTrack.volume * 100)}% -> ${Math.round(toTrack.volume * 100)}%)`);
        }
        if (fromTrack.muted !== toTrack.muted) {
          details.push(toTrack.muted ? "Piste rendue muette" : "Piste démutée");
        }
        if (fromTrack.sampleBlob?.hash !== toTrack.sampleBlob?.hash) {
          details.push("Nouvel échantillon sonore (Sample Blob) assigné");
        }
        if (JSON.stringify(fromTrack.patterns) !== JSON.stringify(toTrack.patterns)) {
          details.push("Notes et patterns modifiés");
        }

        diff.trackChanges.push({
          trackId: id,
          trackName: toTrack.name,
          changeType: details.length > 0 ? "modified" : "unchanged",
          details,
        });
      }
    }

    // Vérification des pistes supprimées
    for (const [id, fromTrack] of fromTracksMap.entries()) {
      if (!toTracksMap.has(id)) {
        diff.trackChanges.push({
          trackId: id,
          trackName: fromTrack.name,
          changeType: "removed",
          details: ["Piste retirée de la timeline"],
        });
      }
    }

    return diff;
  }

  /**
   * Fusion intelligente (Music Merge) avec création automatique de Takes / Pistes alternatives
   */
  async merge(
    sourceBranchName: string,
    author: { name: string; avatar?: string },
    commitMessage?: string
  ): Promise<MergeResult> {
    const targetBranch = this.branches.get(this.activeBranchName);
    const sourceBranch = this.branches.get(sourceBranchName);

    if (!targetBranch || !sourceBranch) {
      throw new Error("Branche source ou cible introuvable.");
    }

    const targetHead = this.commits.get(targetBranch.headCommitId);
    const sourceHead = this.commits.get(sourceBranch.headCommitId);

    if (!targetHead || !sourceHead) {
      throw new Error("Commit de tête introuvable pour la fusion.");
    }

    const targetSnap = JSON.parse(JSON.stringify(targetHead.snapshot)) as MusicProjectSnapshot;
    const sourceSnap = sourceHead.snapshot;

    const mergedTracks: MusicTrackLane[] = [...targetSnap.tracks];
    const createdAlternativeLanes: MusicTrackLane[] = [];
    const targetTracksMap = new Map(mergedTracks.map((t) => [t.id, t]));

    for (const sourceTrack of sourceSnap.tracks) {
      const existing = targetTracksMap.get(sourceTrack.id);
      if (!existing) {
        // Piste nouvelle : fusion propre sans conflit
        mergedTracks.push(JSON.parse(JSON.stringify(sourceTrack)));
      } else {
        // La piste existe des deux côtés : vérifions si elle a divergé
        const hasDiverged =
          JSON.stringify(existing.patterns) !== JSON.stringify(sourceTrack.patterns) ||
          existing.sampleBlob?.hash !== sourceTrack.sampleBlob?.hash;

        if (hasDiverged) {
          // CONFLIT MUSICAL RÉSOLU PAR CRÉATION D'UNE PRISE ALTERNATIVE (TAKE)
          const alternativeLane: MusicTrackLane = {
            ...JSON.parse(JSON.stringify(sourceTrack)),
            id: `${sourceTrack.id}-take-${sourceBranchName}`,
            name: `${sourceTrack.name} (Prise: ${sourceBranchName})`,
            muted: true, // Mute par défaut pour ne pas saturer l'écoute immédiate
            notesAuthor: `Fusion depuis branche [${sourceBranchName}] par ${author.name}`,
          };
          mergedTracks.push(alternativeLane);
          createdAlternativeLanes.push(alternativeLane);
        }
      }
    }

    const mergedSnapshot: MusicProjectSnapshot = {
      ...targetSnap,
      tracks: mergedTracks,
      markers: [
        ...targetSnap.markers,
        ...sourceSnap.markers.filter((sm) => !targetSnap.markers.some((tm) => tm.id === sm.id)),
      ],
    };

    // Création du commit de fusion
    const mergeCommit = await this.commit({
      message: commitMessage || `Merge branche '${sourceBranchName}' dans '${this.activeBranchName}'`,
      author,
      snapshot: mergedSnapshot,
      blobs: Array.from(new Set([...targetHead.blobs, ...sourceHead.blobs])),
    });

    mergeCommit.secondParentId = sourceHead.id;

    return {
      success: true,
      mergedSnapshot,
      conflicts: [],
      createdAlternativeLanes,
    };
  }

  /**
   * Crée un tag pour étiqueter un commit donné (ou le HEAD de la branche active)
   */
  createTag(name: string, commitId?: string, authorName?: string): MusicTag {
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error("Nom de tag invalide.");
    }
    if (this.tags.has(cleanName)) {
      throw new Error(`Le tag '${cleanName}' existe déjà.`);
    }

    const targetCommitId = commitId || this.getHeadCommit()?.id;
    if (!targetCommitId) {
      throw new Error("Aucun commit cible pour ce tag.");
    }
    if (!this.commits.has(targetCommitId)) {
      throw new Error(`Le commit ciblé '${targetCommitId}' est introuvable.`);
    }

    const tag: MusicTag = {
      name: cleanName,
      commitId: targetCommitId,
      annotatedBy: authorName,
      timestamp: Date.now(),
    };

    this.tags.set(cleanName, tag);
    return tag;
  }

  /**
   * Retourne la liste de tous les tags créés
   */
  getTags(): MusicTag[] {
    return Array.from(this.tags.values());
  }

  /**
   * Retourne les tags attachés à un commit précis
   */
  getTagsForCommit(commitId: string): MusicTag[] {
    return Array.from(this.tags.values()).filter((t) => t.commitId === commitId);
  }

  /**
   * Supprime un tag par son nom
   */
  deleteTag(name: string): boolean {
    return this.tags.delete(name);
  }

  /**
   * Annule les modifications d'un commit en créant un nouveau commit avec l'état précédent
   */
  async revert(commitId: string, author: { name: string; avatar?: string; publicKey?: string }): Promise<MusicCommit> {
    const targetCommit = this.commits.get(commitId);
    if (!targetCommit) {
      throw new Error(`Commit introuvable pour le revert : ${commitId}`);
    }

    const revertCommit = await this.commit({
      message: `Revert to ${commitId.slice(0, 7)} ("${targetCommit.message}")`,
      author,
      snapshot: JSON.parse(JSON.stringify(targetCommit.snapshot)),
      blobs: targetCommit.blobs,
    });

    return revertCommit;
  }

  /**
   * Export complet du projet sous forme de Bundle Zéro-Serveur
   */
  exportBundle(): MusicProjectBundle {
    return {
      format: "engineering-studio.music-bundle",
      version: 1,
      exportedAt: Date.now(),
      projectName: this.projectName,
      activeBranch: this.activeBranchName,
      branches: Array.from(this.branches.values()),
      commits: Array.from(this.commits.values()),
      tags: Array.from(this.tags.values()),
    };
  }

  /**
   * Import d'un bundle complet
   */
  importBundle(bundle: MusicProjectBundle): void {
    if (bundle.format !== "engineering-studio.music-bundle") {
      throw new Error("Format de bundle non reconnu.");
    }
    this.projectName = bundle.projectName;
    this.activeBranchName = bundle.activeBranch;
    this.branches.clear();
    this.commits.clear();
    this.tags.clear();

    for (const b of bundle.branches) {
      this.branches.set(b.name, b);
    }
    for (const c of bundle.commits) {
      this.commits.set(c.id, c);
    }
    if (bundle.tags && Array.isArray(bundle.tags)) {
      for (const t of bundle.tags) {
        this.tags.set(t.name, t);
      }
    }
  }
}
