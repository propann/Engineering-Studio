import { describe, expect, it } from "vitest";
import { MusicGitRepository } from "./gitEngine";
import { computeBinaryHash, computeObjectHash } from "./hash";

describe("Music Git Engine", () => {
  it("computes deterministic SHA-256 object hashes", async () => {
    const obj1 = { b: 2, a: 1, tracks: ["kick", "snare"] };
    const obj2 = { a: 1, tracks: ["kick", "snare"], b: 2 };
    const h1 = await computeObjectHash(obj1);
    const h2 = await computeObjectHash(obj2);
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
  });

  it("initializes a music repository with default main branch", async () => {
    const repo = new MusicGitRepository("Mon Morceau Électro");
    const initCommit = await repo.init(undefined, "Alex");

    expect(repo.getProjectName()).toBe("Mon Morceau Électro");
    expect(repo.getActiveBranch()).toBe("main");
    expect(initCommit.author.name).toBe("Alex");
    expect(initCommit.parentId).toBeNull();
    expect(initCommit.snapshot.tracks.length).toBeGreaterThan(0);
  });

  it("creates commits and branches without losing history", async () => {
    const repo = new MusicGitRepository("Collab Test");
    await repo.init();

    // Commit 2
    const head = repo.getHeadCommit()!;
    const modifiedSnapshot = JSON.parse(JSON.stringify(head.snapshot));
    modifiedSnapshot.bpm = 128;
    modifiedSnapshot.tracks[0].volume = 0.95;

    const commit2 = await repo.commit({
      message: "Up tempo to 128 BPM & boost kick",
      author: { name: "Benoit" },
      snapshot: modifiedSnapshot,
    });

    expect(commit2.parentId).toBe(head.id);
    expect(repo.getHeadCommit()?.id).toBe(commit2.id);

    // Create branch 'solo-lead'
    repo.createBranch("solo-lead");
    repo.checkout("solo-lead");
    expect(repo.getActiveBranch()).toBe("solo-lead");

    // Commit on branch
    const soloSnapshot = JSON.parse(JSON.stringify(repo.getHeadCommit()!.snapshot));
    soloSnapshot.tracks.push({
      id: "tr-lead-solo",
      name: "Guitar Hero Solo",
      volume: 0.8,
      pan: 0.2,
      muted: false,
      solo: false,
      patterns: [],
    });

    const branchCommit = await repo.commit({
      message: "Add solo track lane",
      author: { name: "Clara" },
      snapshot: soloSnapshot,
    });

    expect(branchCommit.branch).toBe("solo-lead");

    // Checkout main again
    repo.checkout("main");
    expect(repo.getHeadCommit()?.snapshot.tracks.some((t: any) => t.id === "tr-lead-solo")).toBe(false);

    // Diff comparison
    const diffResult = repo.diff(commit2.id, branchCommit.id);
    expect(diffResult.trackChanges.some((t) => t.trackId === "tr-lead-solo" && t.changeType === "added")).toBe(true);

    // Music merge with alternative lane creation
    const mergeResult = await repo.merge("solo-lead", { name: "Alex" });
    expect(mergeResult.success).toBe(true);
    expect(repo.getHeadCommit()?.snapshot.tracks.some((t: any) => t.id === "tr-lead-solo")).toBe(true);
  });

  it("exports and imports zero-data project bundles seamlessly", async () => {
    const repo = new MusicGitRepository("Bundle Test");
    await repo.init();
    await repo.commit({
      message: "Second commit",
      author: { name: "David" },
      snapshot: { ...repo.getHeadCommit()!.snapshot, bpm: 135 },
    });

    const bundle = repo.exportBundle();
    expect(bundle.format).toBe("engineering-studio.music-bundle");
    expect(bundle.commits.length).toBe(2);

    const importedRepo = new MusicGitRepository("Empty");
    importedRepo.importBundle(bundle);

    expect(importedRepo.getProjectName()).toBe("Bundle Test");
    expect(importedRepo.getHeadCommit()?.snapshot.bpm).toBe(135);
  });

  it("creates, retrieves, and deletes tags correctly", async () => {
    const repo = new MusicGitRepository("Tag Test");
    const initCommit = await repo.init();

    const tag1 = repo.createTag("v1.0-master", initCommit.id, "Alice");
    expect(tag1.name).toBe("v1.0-master");
    expect(tag1.commitId).toBe(initCommit.id);
    expect(tag1.annotatedBy).toBe("Alice");

    expect(repo.getTags().length).toBe(1);
    expect(repo.getTagsForCommit(initCommit.id).length).toBe(1);

    // Rejet du doublon
    expect(() => repo.createTag("v1.0-master")).toThrow();

    // Suppression
    const deleted = repo.deleteTag("v1.0-master");
    expect(deleted).toBe(true);
    expect(repo.getTags().length).toBe(0);
  });

  it("reverts a commit cleanly creating a new history entry with prior state", async () => {
    const repo = new MusicGitRepository("Revert Test");
    const initCommit = await repo.init();
    const initBpm = initCommit.snapshot.bpm;

    await repo.commit({
      message: "Bad tempo change",
      author: { name: "Tester" },
      snapshot: { ...initCommit.snapshot, bpm: 190 },
    });
    expect(repo.getHeadCommit()?.snapshot.bpm).toBe(190);

    const revertedCommit = await repo.revert(initCommit.id, { name: "Admin" });
    expect(revertedCommit.message).toContain("Revert to");
    expect(repo.getHeadCommit()?.id).toBe(revertedCommit.id);
    expect(repo.getHeadCommit()?.snapshot.bpm).toBe(initBpm);
  });

  it("renders a project snapshot to WAV and AIFF offline with sound synthesis", async () => {
    const repo = new MusicGitRepository("Audio Render Test");
    const initCommit = await repo.init();

    const { renderSnapshotOffline } = await import("./bounceRenderer");
    const wavResult = renderSnapshotOffline(initCommit.snapshot, {
      bars: 1,
      format: "wav",
      sampleRate: 44100,
    });

    expect(wavResult.format).toBe("wav");
    expect(wavResult.buffer.byteLength).toBeGreaterThan(1000);
    expect(wavResult.durationSeconds).toBeGreaterThan(1.0);

    const aiffResult = renderSnapshotOffline(initCommit.snapshot, {
      bars: 1,
      format: "aiff",
      sampleRate: 44100,
    });

    expect(aiffResult.format).toBe("aiff");
    expect(aiffResult.buffer.byteLength).toBeGreaterThan(1000);
  });
});
