"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { MusicGitRepository, type MusicCommit, type MusicBranch, type MusicProjectDiff, type MusicTag, type TrackAutomationLane, renderSnapshotOffline } from "@studio-hub/music-git";
import { P2PCollabSession, type ConnectedPeer, type ChatMessage, type ChatChannelId, type ChatAttachment, exportStudioKeyFile, importStudioKeyFile, getOrCreateCryptoIdentity, saveCryptoIdentity, type CryptoIdentity } from "@studio-hub/p2p-collab";
import { readProfile } from "../core/profile";
import { useNotesMidi } from "../core/midi/useNotesMidi";
import { brancher, contexte, type Prise } from "@studio-hub/rack-bus";

export interface CollabStudioProps {
  enModule?: boolean;
}

export default function CollabStudio({ enModule = false }: CollabStudioProps) {
  const [activeTab, setActiveTab] = useState<"git" | "jam" | "crypto">("git");
  const [profile] = useState(() => readProfile());
  const [userCryptoId, setUserCryptoId] = useState<CryptoIdentity | null>(null);
  const [artistNameInput, setArtistNameInput] = useState("");
  const [artistRole, setArtistRole] = useState("Sound Designer / Producer");
  const [keyFileInputRef, setKeyFileInputRef] = useState<HTMLInputElement | null>(null);
  const [repo, setRepo] = useState<MusicGitRepository | null>(null);

  // Git State
  const [branches, setBranches] = useState<MusicBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>("main");
  const [commits, setCommits] = useState<MusicCommit[]>([]);
  const [headCommit, setHeadCommit] = useState<MusicCommit | null>(null);
  const [tags, setTags] = useState<MusicTag[]>([]);
  const [newCommitMsg, setNewCommitMsg] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [tagModalCommitId, setTagModalCommitId] = useState<string | null>(null);
  const [activeAutomationTrackId, setActiveAutomationTrackId] = useState<string | null>(null);
  const [mergeSourceBranch, setMergeSourceBranch] = useState("");
  const [selectedDiff, setSelectedDiff] = useState<MusicProjectDiff | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // P2P / Jam & Multi-Channel Chat State
  const [roomId, setRoomId] = useState("JAM-ELECTRO-101");
  const [activeChatChannel, setActiveChatChannel] = useState<ChatChannelId>("general");
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<"none" | "stem_audio" | "midi_pattern" | "synth_preset" | "strudel_code">("none");
  const [p2pSession, setP2pSession] = useState<P2PCollabSession | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBarMarker, setChatBarMarker] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lastMidiEvent, setLastMidiEvent] = useState<string | null>(null);

  // Audio & WebAudio Synthesis Engine
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stepTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priseRef = useRef<Prise | null>(null);

  /**
   * Le contexte du Hub, et une voie de console.
   *
   * Cet outil fabriquait son propre `AudioContext` et ne le fermait jamais :
   * chaque visite en fuyait un, et Chrome en plafonne six par document. Au
   * septieme, plus aucun son nulle part et aucune erreur.
   *
   * `rack-bus` existe pour ca. La migration du rack DSP a eu lieu le
   * 2026-08-29 ; celle-ci suit, pour que tout ce qui sonne dans l'atelier
   * passe par la meme console.
   */
  const getAudioContext = () => {
    const ctx = contexte();
    audioCtxRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();
    if (!priseRef.current) priseRef.current = brancher("Collab Studio");
    return ctx;
  };

  /**
   * Rend la voie au demontage.
   *
   * Le contexte, lui, n'est pas ferme : il appartient au Hub. Une voie
   * laissee derriere garderait le graphe vivant et ajouterait une tranche
   * fantome a la console a chaque visite de cette page.
   */
  useEffect(() => {
    return () => {
      priseRef.current?.detacher();
      priseRef.current = null;
      audioCtxRef.current = null;
    };
  }, []);

  /** Le point de sortie : la voie de console, jamais la destination brute. */
  const sortieAudio = (): AudioNode => {
    getAudioContext();
    return priseRef.current!.entree;
  };

  // WebAudio Sound Synthesizer Functions
  const playSynthesizedSound = useCallback((
    trackType: string,
    note = 60,
    velocity = 100,
    params?: { cutoff?: number; pan?: number; volume?: number }
  ) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      const trackVol = params?.volume !== undefined ? Math.max(0, Math.min(1, params.volume)) : 1.0;
      const vol = (velocity / 127) * 0.4 * trackVol;

      // Stereo Panning
      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner && params?.pan !== undefined) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, params.pan)), now);
      }

      const connectOut = (node: AudioNode) => {
        if (panner) {
          node.connect(panner);
          panner.connect(sortieAudio());
        } else {
          node.connect(sortieAudio());
        }
      };

      if (trackType.toLowerCase().includes("kick") || note === 36) {
        // 909/808 Kick Drop
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

        gain.gain.setValueAtTime(vol * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        connectOut(gain);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (trackType.toLowerCase().includes("snare") || note === 38) {
        // Snare / Clap Noise Burst + Body
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const output = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseBuf.length; i++) output[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(params?.cutoff !== undefined ? params.cutoff : 1200, now);
        filter.Q.setValueAtTime(2, now);

        gain.gain.setValueAtTime(vol * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        connectOut(gain);
        noise.start(now);
        noise.stop(now + 0.2);
      } else if (trackType.toLowerCase().includes("hat") || note === 42) {
        // Hi-Hat Metallic Highpass Burst
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const output = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseBuf.length; i++) output[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(params?.cutoff !== undefined ? Math.max(2000, params.cutoff) : 6000, now);

        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noise.connect(filter);
        filter.connect(gain);
        connectOut(gain);
        noise.start(now);
        noise.stop(now + 0.08);
      } else {
        // Melodic Synth / Lead / Bass
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const freq = 440 * Math.pow(2, (note - 69) / 12);

        osc.type = trackType.toLowerCase().includes("bass") ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        const baseCutoff = params?.cutoff !== undefined ? params.cutoff : 1800;
        filter.frequency.setValueAtTime(baseCutoff, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(100, baseCutoff * 0.2), now + 0.25);

        gain.gain.setValueAtTime(vol * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        connectOut(gain);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch {
      // Audio context error handling
    }
    // `getAudioContext` n'est plus un useCallback depuis la migration sur le
    // fond de panier : il change d'identite a chaque rendu. Le garder en
    // dependance recreerait ce callback a chaque frappe. Il ne capture plus
    // rien de variable — le contexte est celui du Hub — donc l'omettre est sur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écoute du répartiteur MIDI matériel (OP-1 / EP-133)
  useNotesMidi((noteInfo) => {
    playSynthesizedSound("synth", noteInfo.note, noteInfo.velocite);
    if (p2pSession) {
      p2pSession.sendLiveMidi({
        note: noteInfo.note,
        velocity: noteInfo.velocite,
        channel: noteInfo.canal,
        type: "note_on",
      });
    }
  });

  // Initialisation du dépôt Music Git
  useEffect(() => {
    const repository = new MusicGitRepository("Mon Morceau Électro");
    repository.init(undefined, profile?.name || "Opérateur OP-1").then(() => {
      setRepo(repository);
      refreshGitState(repository);
    });
  }, [profile?.name]);

  const refreshGitState = (repository: MusicGitRepository) => {
    setBranches(repository.getBranches());
    setActiveBranch(repository.getActiveBranch());
    setCommits(repository.getHistory());
    setTags(repository.getTags());
    const head = repository.getHeadCommit();
    setHeadCommit(head);
    if (head?.snapshot.bpm) {
      setTempo(head.snapshot.bpm);
    }
  };

  // Initialisation et gestion de la session P2P
  useEffect(() => {
    const session = new P2PCollabSession(roomId);
    session.init(profile?.name, typeof profile?.avatar === "string" ? profile.avatar : "robot").then(() => {
      session.join();
      setP2pSession(session);

      session.on("CHAT_MESSAGE", (packet) => {
        setChatMessages((prev) => [...prev, packet.payload]);
      });

      session.on("LIVE_MIDI", (packet) => {
        const { note, velocity } = packet.payload;
        setLastMidiEvent(`Pair ${packet.sender.name} : Note ${note}`);
        playSynthesizedSound("synth", note, velocity);
      });

      session.on("TRANSPORT_SYNC", (packet) => {
        const { action, bpm } = packet.payload;
        if (bpm) setTempo(bpm);
        if (action === "play") {
          setIsPlaying(true);
          isPlayingRef.current = true;
        } else if (action === "pause" || action === "stop") {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      });

      session.on("PEER_JOIN", () => {
        setConnectedPeers(session.getConnectedPeers());
      });

      session.on("PEER_LEAVE", () => {
        setConnectedPeers(session.getConnectedPeers());
      });

      return () => {
        session.leave();
      };
    });
  }, [roomId, profile?.name, profile?.avatar, playSynthesizedSound]);

  // Playback Loop for Sequencer
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      const stepDurationMs = (60000 / tempo) / 4; // 16th notes
      const interval = window.setInterval(() => {
        if (!isPlayingRef.current) return;
        const step = (currentStepRef.current + 1) % 16;
        currentStepRef.current = step;
        setCurrentStep(step);

        // Trigger sounds for active snapshot tracks
        if (headCommit) {
          const hasSolo = headCommit.snapshot.tracks.some((t) => t.solo);
          headCommit.snapshot.tracks.forEach((track) => {
            if (track.muted) return;
            if (hasSolo && !track.solo) return;

            const pat = track.patterns[0];
            if (pat && pat.steps[step]?.active) {
              const cutoffPt = track.automations?.find((l) => l.targetParameter === "filter_cutoff")?.points.find((p) => p.step === step);
              const panPt = track.automations?.find((l) => l.targetParameter === "pan")?.points.find((p) => p.step === step);
              const volPt = track.automations?.find((l) => l.targetParameter === "volume")?.points.find((p) => p.step === step);

              const cutoff = cutoffPt ? cutoffPt.value : undefined;
              const pan = panPt ? panPt.value : (track.pan !== undefined ? track.pan : 0);
              const vol = volPt ? volPt.value : (track.volume !== undefined ? track.volume : 1);

              playSynthesizedSound(track.name, pat.steps[step].note, pat.steps[step].velocity, {
                cutoff,
                pan,
                volume: vol,
              });
            }
          });
        }
      }, stepDurationMs);

      stepTimerRef.current = interval;
      return () => {
        window.clearInterval(interval);
      };
    } else {
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current);
      }
    }
  }, [isPlaying, tempo, headCommit, playSynthesizedSound]);

  // Actions Git
  const handleCreateCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !newCommitMsg.trim() || !headCommit) return;

    const modifiedSnapshot = { ...headCommit.snapshot, bpm: tempo };
    await repo.commit({
      message: newCommitMsg.trim(),
      author: {
        name: profile?.name || "Opérateur",
        avatar: typeof profile?.avatar === "string" ? profile.avatar : "robot",
      },
      snapshot: modifiedSnapshot,
    });

    setNewCommitMsg("");
    refreshGitState(repo);
    setNotice("💾 Snapshot enregistré dans l'historique Git !");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleStep = (trackId: string, stepIndex: number) => {
    if (!headCommit || !repo) return;
    const updatedTracks = headCommit.snapshot.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const updatedPatterns = track.patterns.map((pat, pIdx) => {
        if (pIdx !== 0) return pat;
        const updatedSteps = [...pat.steps];
        const current = updatedSteps[stepIndex];
        const nextActive = !current.active;
        updatedSteps[stepIndex] = {
          ...current,
          active: nextActive,
          velocity: nextActive ? 100 : 0,
        };
        return { ...pat, steps: updatedSteps };
      });
      return { ...track, patterns: updatedPatterns };
    });

    const updatedSnapshot = { ...headCommit.snapshot, tracks: updatedTracks };
    repo.updateHeadSnapshot(updatedSnapshot);
    refreshGitState(repo);

    // Audio feedback on toggle
    const track = updatedTracks.find((t) => t.id === trackId);
    if (track && track.patterns[0]?.steps[stepIndex]?.active) {
      playSynthesizedSound(track.name, track.patterns[0].steps[stepIndex].note, 100);
    }
  };

  const handleToggleMute = (trackId: string) => {
    if (!headCommit || !repo) return;
    const updatedTracks = headCommit.snapshot.tracks.map((t) =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
    repo.updateHeadSnapshot({ ...headCommit.snapshot, tracks: updatedTracks });
    refreshGitState(repo);
  };

  const handleToggleSolo = (trackId: string) => {
    if (!headCommit || !repo) return;
    const updatedTracks = headCommit.snapshot.tracks.map((t) =>
      t.id === trackId ? { ...t, solo: !t.solo } : t
    );
    repo.updateHeadSnapshot({ ...headCommit.snapshot, tracks: updatedTracks });
    refreshGitState(repo);
  };

  const handleClearTrack = (trackId: string) => {
    if (!headCommit || !repo) return;
    const updatedTracks = headCommit.snapshot.tracks.map((t) => {
      if (t.id !== trackId) return t;
      const updatedPatterns = t.patterns.map((p, pIdx) => {
        if (pIdx !== 0) return p;
        return {
          ...p,
          steps: p.steps.map((s) => ({ ...s, active: false, velocity: 0 })),
        };
      });
      return { ...t, patterns: updatedPatterns };
    });
    repo.updateHeadSnapshot({ ...headCommit.snapshot, tracks: updatedTracks });
    refreshGitState(repo);
  };

  const handleAddTrack = (type: "kick" | "snare" | "hat" | "bass" | "lead") => {
    if (!headCommit || !repo) return;
    const colors: Record<string, string> = {
      kick: "#ff5a1f",
      snare: "#d9ff43",
      hat: "#00ed95",
      bass: "#a855f7",
      lead: "#38bdf8",
    };
    const defaultNotes: Record<string, number> = {
      kick: 36,
      snare: 38,
      hat: 42,
      bass: 48,
      lead: 60,
    };
    const count = headCommit.snapshot.tracks.filter((t) => t.name.toLowerCase().includes(type)).length + 1;
    const newTrackId = `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTrack = {
      id: newTrackId,
      name: `${type.toUpperCase()} ${count}`,
      type: "midi" as const,
      color: colors[type] || "#00ed95",
      muted: false,
      solo: false,
      volume: 1,
      pan: 0,
      patterns: [
        {
          id: `pat-${Date.now()}`,
          name: "Motif 1",
          stepsCount: 16,
          steps: Array.from({ length: 16 }, () => ({
            active: false,
            note: defaultNotes[type] || 60,
            velocity: 100,
            durationSteps: 1,
          })),
        },
      ],
      automations: [
        {
          targetParameter: "filter_cutoff" as const,
          points: [],
        },
      ],
    };

    const updatedTracks = [...headCommit.snapshot.tracks, newTrack];
    repo.updateHeadSnapshot({ ...headCommit.snapshot, tracks: updatedTracks });
    refreshGitState(repo);
    setNotice(`➕ Piste « ${newTrack.name} » ajoutée au snapshot actif`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!headCommit || !repo) return;
    if (headCommit.snapshot.tracks.length <= 1) {
      alert("Le projet doit contenir au moins une piste.");
      return;
    }
    const trackToRemove = headCommit.snapshot.tracks.find((t) => t.id === trackId);
    const updatedTracks = headCommit.snapshot.tracks.filter((t) => t.id !== trackId);
    repo.updateHeadSnapshot({ ...headCommit.snapshot, tracks: updatedTracks });
    refreshGitState(repo);
    if (trackToRemove) {
      setNotice(`🗑️ Piste « ${trackToRemove.name} » retirée du snapshot`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleCaptureJamToCommit = async () => {
    if (!repo || !headCommit) return;
    await repo.commit({
      message: `Jam Session Live [${new Date().toLocaleTimeString()}] - BPM ${tempo}`,
      author: {
        name: profile?.name || "Opérateur Jam",
        avatar: typeof profile?.avatar === "string" ? profile.avatar : "robot",
      },
      snapshot: {
        ...headCommit.snapshot,
        bpm: tempo,
      },
    });
    refreshGitState(repo);
    setNotice("⚡ Jam capturée et archivée dans un nouveau Commit Git !");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !newBranchName.trim()) return;
    try {
      repo.createBranch(newBranchName.trim());
      repo.checkout(newBranchName.trim());
      setNewBranchName("");
      refreshGitState(repo);
      setNotice(`🌿 Branche « ${newBranchName.trim()} » créée et sélectionnée !`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur de création de branche");
    }
  };

  const handleSwitchBranch = (name: string) => {
    if (!repo) return;
    try {
      repo.checkout(name);
      refreshGitState(repo);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur de bascule de branche");
    }
  };

  const handleMergeBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !mergeSourceBranch) return;
    try {
      const res = await repo.merge(mergeSourceBranch, {
        name: profile?.name || "Opérateur",
        avatar: typeof profile?.avatar === "string" ? profile.avatar : "robot",
      });
      refreshGitState(repo);
      setNotice(`🎉 Fusion réussie ! ${res.createdAlternativeLanes.length} piste(s) alternative(s) générée(s).`);
      setMergeSourceBranch("");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du merge");
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !newTagName.trim()) return;
    try {
      const tag = repo.createTag(
        newTagName.trim(),
        tagModalCommitId || undefined,
        profile?.name || "Opérateur"
      );
      setNewTagName("");
      setTagModalCommitId(null);
      refreshGitState(repo);
      setNotice(`🏷️ Tag « ${tag.name} » posé avec succès !`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la création du tag");
    }
  };

  const handleDeleteTag = (tagName: string) => {
    if (!repo) return;
    repo.deleteTag(tagName);
    refreshGitState(repo);
    setNotice(`🗑️ Tag « ${tagName} » retiré.`);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleRevertCommit = async (commitId: string) => {
    if (!repo) return;
    try {
      const rev = await repo.revert(commitId, {
        name: profile?.name || "Opérateur",
        avatar: typeof profile?.avatar === "string" ? profile.avatar : "robot",
      });
      refreshGitState(repo);
      setNotice(`⏮️ Revert effectué vers l'état ${commitId.slice(0, 7)} (Commit ${rev.id.slice(0, 7)})`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du revert");
    }
  };

  const handleSetTrackAutomation = (
    trackId: string,
    param: "filter_cutoff" | "filter_resonance" | "volume" | "pan",
    step: number,
    value: number
  ) => {
    if (!headCommit || !repo) return;
    const updatedTracks = headCommit.snapshot.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const automations = [...(track.automations || [])];
      let lane = automations.find((l) => l.targetParameter === param);
      if (!lane) {
        lane = { targetParameter: param, points: [] };
        automations.push(lane);
      }
      const existingPointIndex = lane.points.findIndex((p) => p.step === step);
      if (existingPointIndex >= 0) {
        lane.points[existingPointIndex] = { step, value, curve: "linear" };
      } else {
        lane.points.push({ step, value, curve: "linear" });
        lane.points.sort((a, b) => a.step - b.step);
      }
      return { ...track, automations };
    });

    const updatedSnapshot = { ...headCommit.snapshot, tracks: updatedTracks };
    repo.updateHeadSnapshot(updatedSnapshot);
    refreshGitState(repo);
  };

  const handleManualPing = () => {
    if (!p2pSession) return;
    p2pSession.send("PING", { timestamp: Date.now() });
    setNotice("📡 Sonde Ping envoyée à tous les pairs connectés");
    setTimeout(() => setNotice(null), 2000);
  };

  const handleBounceSnapshot = (commit: MusicCommit, format: "wav" | "aiff" = "wav") => {
    try {
      const result = renderSnapshotOffline(commit.snapshot, {
        bars: 4,
        format,
        sampleRate: 44100,
        normalize: true,
      });

      const mimeType = format === "aiff" ? "audio/aiff" : "audio/wav";
      const blob = new Blob([result.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${commit.snapshot.name.toLowerCase().replace(/\s+/g, "_")}_${commit.id.slice(0, 7)}.${format === "aiff" ? "aif" : "wav"}`;
      a.click();
      URL.revokeObjectURL(url);

      setNotice(`🎵 Bounce audio exporté en ${format.toUpperCase()} (${result.durationSeconds.toFixed(1)}s, ${Math.round(result.buffer.byteLength / 1024)} Ko)`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du bounce audio");
    }
  };

  const handleExportBundle = () => {
    if (!repo) return;
    const bundle = repo.exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.getProjectName().toLowerCase().replace(/\s+/g, "-")}.musicgit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBundle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !repo) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bundle = JSON.parse(event.target?.result as string);
        repo.importBundle(bundle);
        refreshGitState(repo);
        setNotice("📦 Projet & Historique Git importés avec succès !");
        setTimeout(() => setNotice(null), 3000);
      } catch {
        alert("Erreur lors de l'analyse du fichier bundle.");
      }
    };
    reader.readAsText(file);
  };

  // Initialisation de l'identité cryptographique
  useEffect(() => {
    getOrCreateCryptoIdentity(profile?.name || "Opérateur").then((id) => {
      setUserCryptoId(id);
      setArtistNameInput(id.name);
    });
  }, [profile?.name]);

  const handleExportKeyFile = () => {
    if (!userCryptoId) return;
    const jsonStr = exportStudioKeyFile(userCryptoId);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `identity_${userCryptoId.shortId.toLowerCase()}_${userCryptoId.name.toLowerCase().replace(/\s+/g, "_")}.studio-key`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`🔑 Clé client exportée avec succès (${userCryptoId.shortId})`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleImportKeyFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const importedId = importStudioKeyFile(raw);
        setUserCryptoId(importedId);
        setArtistNameInput(importedId.name);
        setNotice(`✅ Identité client « ${importedId.name} » (${importedId.shortId}) restaurée !`);
        setTimeout(() => setNotice(null), 4000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erreur lors de l'import de la clé client");
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateArtistName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCryptoId || !artistNameInput.trim()) return;
    const updated: CryptoIdentity = {
      ...userCryptoId,
      name: artistNameInput.trim(),
    };
    saveCryptoIdentity(updated);
    setUserCryptoId(updated);
    setNotice(`✨ Pseudo d'artiste mis à jour : ${updated.name}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Voulez-vous générer une toute nouvelle identité cryptographique ? Vos anciens commits garderont leur signature d'origine.")) return;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("engineering-studio.crypto-identity.v1");
    }
    const fresh = await getOrCreateCryptoIdentity(artistNameInput || "Artiste", "synth");
    setUserCryptoId(fresh);
    setNotice(`🎲 Nouvelle clé créée : ${fresh.shortId}`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2pSession || !chatInput.trim()) return;

    let attachment: ChatAttachment | undefined = undefined;
    if (selectedAttachmentType === "stem_audio") {
      attachment = {
        type: "stem_audio",
        title: `Stem Audio Master (${tempo} BPM)`,
        payload: { bpm: tempo, bars: 4, format: "wav" },
      };
    } else if (selectedAttachmentType === "midi_pattern") {
      attachment = {
        type: "midi_pattern",
        title: `Pattern Drum & Bass 16 Pas`,
        payload: { steps: 16, tracks: 4 },
      };
    } else if (selectedAttachmentType === "synth_preset") {
      attachment = {
        type: "synth_preset",
        title: `Patch Dexed FM Glass Bell`,
        payload: { engine: "dexed_fm", algorithm: 8 },
      };
    } else if (selectedAttachmentType === "strudel_code") {
      attachment = {
        type: "strudel_code",
        title: `Strudel Live Code Motif`,
        payload: { code: 's("bd [sd hh] bd sd").fast(1.5)' },
      };
    }

    p2pSession.sendChatMessage(chatInput.trim(), {
      bar: chatBarMarker,
      beat: 1,
    });
    setChatMessages((prev) => [
      ...prev,
      {
        id: "msg-" + Math.random().toString(36).slice(2, 9),
        channel: activeChatChannel,
        author: p2pSession.getIdentity() || userCryptoId || {
          publicKeyHex: "04TEST",
          shortId: "STUDIO-USER",
          name: artistNameInput || "Opérateur",
          createdTimestamp: Date.now(),
        },
        text: chatInput.trim(),
        timestamp: Date.now(),
        attachment,
        timelineMarker: { bar: chatBarMarker, beat: 1 },
      },
    ]);
    setChatInput("");
    setSelectedAttachmentType("none");
  };

  const triggerLiveMidiPad = (note: number, label: string) => {
    playSynthesizedSound(label, note, 110);
    if (!p2pSession) return;
    p2pSession.sendLiveMidi({
      note,
      velocity: 110,
      channel: 1,
      type: "note_on",
    });
    setLastMidiEvent(`${label} (Note ${note}) déclenchée`);
    setTimeout(() => setLastMidiEvent(null), 1000);
  };

  const handleToggleTransport = () => {
    getAudioContext();
    const next = !isPlaying;
    setIsPlaying(next);
    p2pSession?.sendTransportSync({
      action: next ? "play" : "pause",
      currentBar: 1,
      currentBeat: 1,
      bpm: tempo,
    });
  };

  return (
    <div className="collab-studio-container" style={{ minHeight: enModule ? "auto" : "100vh", background: "var(--theme-bg-base, #0e1314)", color: "var(--theme-text-main, #edf2f7)" }}>
      {!enModule && <TopBar activePage="collab-studio" />}

      {/* Header & Sub-Nav */}
      <div style={{ padding: "16px 24px", borderBottom: "1.5px solid var(--theme-border, #2c3b40)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--theme-bg-surface, #151d20)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🌿</span>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, fontFamily: "monospace" }}>
              GIT MUSICAL & LIVE JAM P2P
            </h1>
            <span style={{ background: "var(--theme-accent, #00ed95)", color: "#000", fontSize: "10px", fontWeight: 900, padding: "2px 8px", borderRadius: "12px" }}>
              DÉCENTRALISÉ / ZERO-DONNÉE
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)" }}>
            Contrôle de version par snapshots SHA-256 · Fusion anti-écrasement · Session P2P temps réel
          </p>
        </div>

        {/* Global Transport & Tempo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--theme-bg-base, #0e1314)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--theme-border, #2c3b40)" }}>
          <button
            onClick={handleToggleTransport}
            style={{
              padding: "6px 14px",
              background: isPlaying ? "var(--theme-accent-orange, #ff5a1f)" : "var(--theme-accent, #00ed95)",
              color: isPlaying ? "#fff" : "#000",
              border: "none",
              borderRadius: "6px",
              fontWeight: 900,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isPlaying ? "⏸ PAUSE" : "▶ ÉCOUTER"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)" }}>BPM</span>
            <input
              type="number"
              min="40"
              max="240"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              style={{ width: "55px", padding: "4px 6px", background: "var(--theme-bg-surface, #151d20)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "12px", fontWeight: 800, textAlign: "center" }}
            />
          </div>

          <button
            onClick={handleCaptureJamToCommit}
            title="Prendre une photo instantanée du projet et l'enregistrer dans l'arbre Git"
            style={{
              padding: "6px 10px",
              background: "transparent",
              border: "1px solid var(--theme-border, #2c3b40)",
              color: "var(--theme-accent-orange, #ff5a1f)",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            📸 Capture Snapshot
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "6px", background: "var(--theme-bg-base, #0e1314)", padding: "4px", borderRadius: "8px", border: "1.5px solid var(--theme-border, #2c3b40)" }}>
          <button
            onClick={() => setActiveTab("git")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "git" ? "var(--theme-accent-orange, #ff5a1f)" : "transparent",
              color: activeTab === "git" ? "#fff" : "inherit",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            🌿 Git Musical ({commits.length})
          </button>
          <button
            onClick={() => setActiveTab("jam")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "jam" ? "var(--theme-accent, #00ed95)" : "transparent",
              color: activeTab === "jam" ? "#000" : "inherit",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ⚡ Live Jam & Chat ({connectedPeers.length})
          </button>
          <button
            onClick={() => setActiveTab("crypto")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "crypto" ? "#38bdf8" : "transparent",
              color: activeTab === "crypto" ? "#000" : "inherit",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            🔒 Coffre & Identité
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Notice Alert Banner */}
        {notice && (
          <div style={{
            marginBottom: "16px",
            padding: "10px 16px",
            background: "rgba(0, 237, 149, 0.12)",
            border: "1.5px solid var(--theme-accent, #00ed95)",
            borderRadius: "8px",
            color: "var(--theme-accent, #00ed95)",
            fontWeight: 800,
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Modal de création de Tag */}
        {tagModalCommitId && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}>
            <div style={{
              background: "var(--theme-bg-surface, #151d20)",
              border: "2px solid var(--theme-accent-orange, #ff5a1f)",
              borderRadius: "10px",
              padding: "22px",
              width: "400px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
            }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 900 }}>🏷️ Créer un Tag Musical</h3>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)" }}>
                Marquer le commit <code style={{ fontFamily: "monospace" }}>{tagModalCommitId.slice(0, 7)}</code> avec une étiquette de jalon ou version.
              </p>
              <form onSubmit={handleCreateTag}>
                <input
                  type="text"
                  placeholder="ex: v1.0-master, radio-edit, mix-validé"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  autoFocus
                  style={{ width: "100%", marginBottom: "14px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => { setTagModalCommitId(null); setNewTagName(""); }}
                    style={{ padding: "8px 12px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 16px", background: "var(--theme-accent-orange, #ff5a1f)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}
                  >
                    Créer Tag
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ONGLET 1: GIT MUSICAL */}
        {activeTab === "git" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Grille Interactive de Pas (Step Sequencer Matrix) */}
            {headCommit && (
              <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px" }}>🎹</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 900, textTransform: "uppercase" }}>
                        Séquenceur & Échantillons du Snapshot Actif ({headCommit.id.slice(0, 7)})
                      </h3>
                      <span style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)" }}>
                        Cliquez sur les pas pour modifier le motif · Automations & Mixage temps réel
                      </span>
                    </div>
                  </div>

                  {/* Barre d'Ajout Rapide de Pistes */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)" }}>+ Piste :</span>
                    <button
                      onClick={() => handleAddTrack("kick")}
                      style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(255, 90, 31, 0.15)", border: "1px solid #ff5a1f", color: "#ff5a1f", borderRadius: "4px", cursor: "pointer", fontWeight: 800 }}
                    >
                      + Kick
                    </button>
                    <button
                      onClick={() => handleAddTrack("snare")}
                      style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(217, 255, 67, 0.15)", border: "1px solid #d9ff43", color: "#d9ff43", borderRadius: "4px", cursor: "pointer", fontWeight: 800 }}
                    >
                      + Snare
                    </button>
                    <button
                      onClick={() => handleAddTrack("hat")}
                      style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(0, 237, 149, 0.15)", border: "1px solid #00ed95", color: "#00ed95", borderRadius: "4px", cursor: "pointer", fontWeight: 800 }}
                    >
                      + Hat
                    </button>
                    <button
                      onClick={() => handleAddTrack("bass")}
                      style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid #a855f7", color: "#a855f7", borderRadius: "4px", cursor: "pointer", fontWeight: 800 }}
                    >
                      + Bass
                    </button>
                    <button
                      onClick={() => handleAddTrack("lead")}
                      style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: "4px", cursor: "pointer", fontWeight: 800 }}
                    >
                      + Lead
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {headCommit.snapshot.tracks.map((track) => {
                    const pat = track.patterns[0];
                    const isAlternative = track.name.includes("Alternative") || track.name.includes("Merge");
                    const isAutomationOpen = activeAutomationTrackId === track.id;
                    const cutoffLane = track.automations?.find((l) => l.targetParameter === "filter_cutoff");

                    return (
                      <div key={track.id} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "var(--theme-bg-base, #0e1314)", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${isAlternative ? "#fbbf24" : "var(--theme-border, #2c3b40)"}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "12px", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: track.color || "var(--theme-accent, #00ed95)", flexShrink: 0 }} />
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              <strong style={{ fontSize: "12px", color: isAlternative ? "#fbbf24" : "inherit" }}>
                                {track.name}
                              </strong>
                              {isAlternative && (
                                <span style={{ display: "block", fontSize: "9px", color: "#fbbf24", fontWeight: 800 }}>
                                  🔀 PRISE ALTERNATIVE (MERGE)
                                </span>
                              )}
                            </div>

                            {/* Boutons Mute / Solo / Clear / Delete */}
                            <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                              <button
                                onClick={() => handleToggleMute(track.id)}
                                title={track.muted ? "Démuter la piste" : "Couper le son (Mute)"}
                                style={{
                                  padding: "2px 5px",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  background: track.muted ? "#ef4444" : "transparent",
                                  color: track.muted ? "#fff" : "var(--theme-text-muted, #94a3b8)",
                                  border: "1px solid var(--theme-border, #2c3b40)",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                }}
                              >
                                M
                              </button>

                              <button
                                onClick={() => handleToggleSolo(track.id)}
                                title={track.solo ? "Désactiver Solo" : "Isoler la piste (Solo)"}
                                style={{
                                  padding: "2px 5px",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  background: track.solo ? "#eab308" : "transparent",
                                  color: track.solo ? "#000" : "var(--theme-text-muted, #94a3b8)",
                                  border: "1px solid var(--theme-border, #2c3b40)",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                }}
                              >
                                S
                              </button>

                              <button
                                onClick={() => handleClearTrack(track.id)}
                                title="Effacer tous les pas de cette piste"
                                style={{
                                  padding: "2px 4px",
                                  fontSize: "9px",
                                  background: "transparent",
                                  color: "var(--theme-text-muted, #94a3b8)",
                                  border: "1px solid var(--theme-border, #2c3b40)",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                }}
                              >
                                🧹
                              </button>

                              <button
                                onClick={() => setActiveAutomationTrackId(isAutomationOpen ? null : track.id)}
                                title="Afficher la courbe d'automations (Filtre / Volume)"
                                style={{
                                  padding: "2px 5px",
                                  fontSize: "9px",
                                  background: isAutomationOpen ? "var(--theme-accent, #00ed95)" : "transparent",
                                  color: isAutomationOpen ? "#000" : "var(--theme-text-muted, #94a3b8)",
                                  border: "1px solid var(--theme-border, #2c3b40)",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontWeight: 800,
                                }}
                              >
                                🎛️
                              </button>

                              {headCommit.snapshot.tracks.length > 1 && (
                                <button
                                  onClick={() => handleRemoveTrack(track.id)}
                                  title="Supprimer cette piste du snapshot"
                                  style={{
                                    padding: "2px 4px",
                                    fontSize: "9px",
                                    background: "transparent",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 16 Steps Row */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "4px" }}>
                            {Array.from({ length: 16 }, (_, stepIdx) => {
                              const stepData = pat?.steps[stepIdx];
                              const isActive = !!stepData?.active;
                              const isCurrentCursor = isPlaying && currentStep === stepIdx;

                              return (
                                <button
                                  key={stepIdx}
                                  onClick={() => handleToggleStep(track.id, stepIdx)}
                                  title={`Pas ${stepIdx + 1} - ${track.name} (${isActive ? "Actif" : "Muet"})`}
                                  style={{
                                    height: "32px",
                                    borderRadius: "4px",
                                    border: isCurrentCursor ? "2px solid #fff" : "1px solid var(--theme-border, #2c3b40)",
                                    background: isActive
                                      ? (track.color || "var(--theme-accent, #00ed95)")
                                      : (stepIdx % 4 === 0 ? "rgba(255, 255, 255, 0.05)" : "transparent"),
                                    boxShadow: isCurrentCursor ? "0 0 8px #fff" : "none",
                                    cursor: "pointer",
                                    opacity: isActive ? 1 : 0.6,
                                    transition: "all 0.05s ease",
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Tiroir d'Automations du Track */}
                        {isAutomationOpen && (
                          <div style={{ marginTop: "6px", paddingTop: "8px", borderTop: "1px dashed var(--theme-border, #2c3b40)", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--theme-accent, #00ed95)", fontWeight: 800 }}>
                              <span>🎛️ Courbe d'Automation de Filtre Cutoff (Hz) sur 16 pas</span>
                              <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)" }}>Glissez les curseurs pour moduler le timbre</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "4px" }}>
                              {Array.from({ length: 16 }, (_, stepIdx) => {
                                const pt = cutoffLane?.points.find((p) => p.step === stepIdx);
                                const val = pt ? pt.value : 1000;
                                return (
                                  <div key={stepIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                    <input
                                      type="range"
                                      min="100"
                                      max="8000"
                                      step="50"
                                      value={val}
                                      onChange={(e) => handleSetTrackAutomation(track.id, "filter_cutoff", stepIdx, Number(e.target.value))}
                                      style={{ height: "60px", writingMode: "vertical-lr", direction: "rtl", width: "16px" }}
                                    />
                                    <span style={{ fontSize: "8px", fontFamily: "monospace", color: "var(--theme-text-muted, #94a3b8)" }}>
                                      {Math.round(val / 100)}h
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
              {/* Timeline & Commits */}
              <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Arbre de Versions (Branche active: <span style={{ color: "var(--theme-accent-orange, #ff5a1f)" }}>{activeBranch}</span>)
                  </h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleExportBundle} style={{ padding: "4px 10px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", cursor: "pointer" }}>
                      📥 Exporter Bundle .json
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: "4px 10px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", cursor: "pointer" }}>
                      📤 Importer Bundle
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportBundle} accept=".json" style={{ display: "none" }} />
                  </div>
                </div>

                {/* Nouveau commit */}
                <form onSubmit={handleCreateCommit} style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "var(--theme-bg-base, #0e1314)", padding: "12px", borderRadius: "8px", border: "1px solid var(--theme-border, #2c3b40)" }}>
                  <input
                    type="text"
                    placeholder="Décrire votre modification (ex: Ajout du solo de lead, ajustement du filtre 909...)"
                    value={newCommitMsg}
                    onChange={(e) => setNewCommitMsg(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", background: "var(--theme-bg-surface, #151d20)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button type="submit" style={{ padding: "8px 16px", background: "var(--theme-accent-orange, #ff5a1f)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>
                    Enregistrer Snapshot
                  </button>
                </form>

                {/* Liste des commits */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {commits.map((commit, index) => {
                    const commitTags = tags.filter((t) => t.commitId === commit.id);
                    return (
                      <div
                        key={commit.id}
                        style={{
                          padding: "12px 16px",
                          background: commit.id === headCommit?.id ? "rgba(255, 90, 31, 0.08)" : "var(--theme-bg-base, #0e1314)",
                          border: `1.5px solid ${commit.id === headCommit?.id ? "var(--theme-accent-orange, #ff5a1f)" : "var(--theme-border, #2c3b40)"}`,
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: commit.id === headCommit?.id ? "var(--theme-accent-orange, #ff5a1f)" : "#64748b" }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <strong style={{ fontSize: "13px" }}>{commit.message}</strong>
                              <span style={{ fontFamily: "monospace", fontSize: "10px", padding: "1px 6px", background: "var(--theme-bg-surface, #151d20)", borderRadius: "4px", color: "var(--theme-text-muted, #94a3b8)" }}>
                                {commit.id.slice(0, 7)}
                              </span>
                              {commit.id === headCommit?.id && (
                                <span style={{ fontSize: "9px", background: "var(--theme-accent-orange, #ff5a1f)", color: "#fff", padding: "1px 6px", borderRadius: "4px", fontWeight: 900 }}>
                                  HEAD ({commit.branch})
                                </span>
                              )}
                              {commitTags.map((tag) => (
                                <span
                                  key={tag.name}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "10px",
                                    padding: "1px 6px",
                                    background: "rgba(0, 237, 149, 0.15)",
                                    border: "1px solid var(--theme-accent, #00ed95)",
                                    color: "var(--theme-accent, #00ed95)",
                                    borderRadius: "10px",
                                    fontWeight: 800,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  🏷️ {tag.name}
                                  <button
                                    onClick={() => handleDeleteTag(tag.name)}
                                    title="Supprimer ce tag"
                                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "0 2px", fontSize: "9px" }}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", marginTop: "3px" }}>
                              Par <b>{commit.author.name}</b> · {new Date(commit.timestamp).toLocaleTimeString()} · {commit.snapshot.tracks.length} pistes · {commit.snapshot.bpm} BPM
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleBounceSnapshot(commit, "wav")}
                            title="Exporter un rendu audio WAV complet de ce snapshot (Bounce Offline)"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "var(--theme-accent, #00ed95)", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}
                          >
                            🎵 WAV
                          </button>

                          <button
                            onClick={() => handleBounceSnapshot(commit, "aiff")}
                            title="Exporter un rendu audio AIFF pour OP-1 / Teenage Engineering"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "#38bdf8", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}
                          >
                            🎛️ AIFF
                          </button>

                          <button
                            onClick={() => setTagModalCommitId(commit.id)}
                            title="Ajouter un tag à ce commit"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", cursor: "pointer" }}
                          >
                            🏷️ Tag
                          </button>

                          {commit.id !== headCommit?.id && (
                            <button
                              onClick={() => handleRevertCommit(commit.id)}
                              title="Restaurer l'état de ce commit via un nouveau commit revert"
                              style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "var(--theme-accent-orange, #ff5a1f)", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}
                            >
                              ⏮️ Revert
                            </button>
                          )}

                          {index < commits.length - 1 && (
                            <button
                              onClick={() => {
                                if (repo) setSelectedDiff(repo.diff(commits[index + 1].id, commit.id));
                              }}
                              style={{ padding: "4px 8px", fontSize: "11px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", cursor: "pointer" }}
                            >
                              🔍 Diff
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Diff Modal / Section */}
                {selectedDiff && (
                  <div style={{ marginTop: "20px", padding: "14px", background: "var(--theme-bg-base, #0e1314)", border: "1.5px solid #38bdf8", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "12px", color: "#38bdf8" }}>🔍 Diff Musical ({selectedDiff.fromCommitId.slice(0, 7)} ➔ {selectedDiff.toCommitId.slice(0, 7)})</strong>
                      <button onClick={() => setSelectedDiff(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
                    </div>
                    {selectedDiff.bpmChanged && (
                      <div style={{ fontSize: "11px", color: "#e2e8f0", marginBottom: "4px" }}>
                        ⚡ Tempo : {selectedDiff.bpmChanged.from} BPM ➔ <b>{selectedDiff.bpmChanged.to} BPM</b>
                      </div>
                    )}
                    {selectedDiff.trackChanges.map((tc) => (
                      <div key={tc.trackId} style={{ fontSize: "11px", color: tc.changeType === "added" ? "#00ed95" : tc.changeType === "removed" ? "#f43f5e" : "#fbbf24", margin: "3px 0" }}>
                        • <b>{tc.trackName}</b> : [{tc.changeType.toUpperCase()}] {tc.details.join(", ")}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branches & Fusion */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Branches */}
                <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>
                    🌿 Branches d'Idées
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                    {branches.map((b) => (
                      <button
                        key={b.name}
                        onClick={() => handleSwitchBranch(b.name)}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          background: b.name === activeBranch ? "var(--theme-accent-orange, #ff5a1f)" : "var(--theme-bg-base, #0e1314)",
                          color: b.name === activeBranch ? "#fff" : "inherit",
                          border: "1px solid var(--theme-border, #2c3b40)",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{b.name}</span>
                        {b.name === activeBranch && <small>ACTIF</small>}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleCreateBranch} style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Nouvelle branche (ex: solo-b)"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      style={{ flex: 1, padding: "6px 8px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "11px" }}
                    />
                    <button type="submit" style={{ padding: "6px 10px", background: "var(--theme-accent, #00ed95)", color: "#000", border: "none", borderRadius: "4px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                      + Créer
                    </button>
                  </form>
                </div>

                {/* Fusion / Merge Anti-Écrasement */}
                <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "var(--theme-accent, #00ed95)" }}>
                    🔀 Fusion Musicale (Merge)
                  </h3>
                  <p style={{ margin: "0 0 12px", fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)" }}>
                    Fusionne une branche dans <b>{activeBranch}</b>. En cas de divergence, une <b>Prise Alternative</b> est créée sans écraser vos pistes.
                  </p>

                  <form onSubmit={handleMergeBranch} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <select
                      value={mergeSourceBranch}
                      onChange={(e) => setMergeSourceBranch(e.target.value)}
                      style={{ padding: "6px 8px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "12px" }}
                    >
                      <option value="">-- Choisir la branche source --</option>
                      {branches.filter((b) => b.name !== activeBranch).map((b) => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!mergeSourceBranch}
                      style={{
                        padding: "8px",
                        background: mergeSourceBranch ? "var(--theme-accent, #00ed95)" : "#334155",
                        color: mergeSourceBranch ? "#000" : "#94a3b8",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: 800,
                        fontSize: "12px",
                        cursor: mergeSourceBranch ? "pointer" : "not-allowed",
                      }}
                    >
                      Fusionner vers {activeBranch}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2: LIVE JAM & CHAT */}
        {activeTab === "jam" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
            {/* Espace Jam / Pads MIDI */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Configuration Room & Latence */}
              <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase", fontWeight: 800 }}>Code de Salle P2P</div>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={{ marginTop: "4px", padding: "6px 10px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "6px", fontWeight: 800, fontSize: "13px", fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={handleManualPing}
                    title="Mesurer la latence RTT avec tous les pairs connectés"
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid var(--theme-border, #2c3b40)",
                      color: "var(--theme-accent, #00ed95)",
                      borderRadius: "6px",
                      fontWeight: 800,
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    📡 Tester Latence (Ping)
                  </button>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase", fontWeight: 800 }}>Pairs Connectés</div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--theme-accent, #00ed95)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{connectedPeers.length} en ligne</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste détaillée des Pairs connectés avec Télémétrie Latence */}
              {connectedPeers.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {connectedPeers.map((peer) => {
                    const latency = peer.latencyMs;
                    const latencyColor = latency !== undefined ? (latency < 50 ? "#00ed95" : latency < 120 ? "#fbbf24" : "#f43f5e") : "#94a3b8";
                    return (
                      <div
                        key={peer.identity.publicKeyHex}
                        style={{
                          padding: "6px 12px",
                          background: "var(--theme-bg-surface, #151d20)",
                          border: "1px solid var(--theme-border, #2c3b40)",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: latencyColor }} />
                        <strong>{peer.identity.name}</strong>
                        <span style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)" }}>
                          {peer.identity.shortId}
                        </span>
                        {latency !== undefined && (
                          <span style={{ fontFamily: "monospace", fontWeight: 800, color: latencyColor }}>
                            {latency}ms
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pads de Déclenchement MIDI Live */}
              <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}>
                    Grille de Déclenchement MIDI en Direct
                  </h3>
                  {lastMidiEvent && (
                    <span style={{ fontSize: "11px", color: "var(--theme-accent, #00ed95)", fontFamily: "monospace", fontWeight: 800 }}>
                      ⚡ {lastMidiEvent}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {[
                    { note: 36, label: "KICK 909", color: "#ff5a1f" },
                    { note: 38, label: "SNARE / CLAP", color: "#d9ff43" },
                    { note: 42, label: "HI-HAT CLOSED", color: "#00ed95" },
                    { note: 46, label: "HI-HAT OPEN", color: "#38bdf8" },
                    { note: 48, label: "TOM 1", color: "#a855f7" },
                    { note: 50, label: "TOM 2", color: "#ec4899" },
                    { note: 60, label: "SYNTH C3", color: "#f59e0b" },
                    { note: 64, label: "SYNTH E3", color: "#10b981" },
                  ].map((pad) => (
                    <button
                      key={pad.note}
                      onClick={() => triggerLiveMidiPad(pad.note, pad.label)}
                      style={{
                        padding: "24px 12px",
                        background: "var(--theme-bg-base, #0e1314)",
                        border: `2px solid ${pad.color}`,
                        borderRadius: "8px",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 900,
                        transition: "transform 0.05s ease",
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <span style={{ fontSize: "13px" }}>{pad.label}</span>
                      <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)", fontFamily: "monospace" }}>Note {pad.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat de Session Multi-Canaux & Partage Musical */}
            <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", height: "560px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>
                  💬 Chat & Canaux de Session
                </h3>
                <span style={{ fontSize: "10px", color: "var(--theme-accent, #00ed95)", fontFamily: "monospace" }}>P2P DATACHANNEL</span>
              </div>

              {/* Canaux de Conversation */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "10px", borderBottom: "1px solid var(--theme-border, #2c3b40)", paddingBottom: "8px", overflowX: "auto" }}>
                {(["general", "stems", "mix-master", "live-jam", "idees"] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setActiveChatChannel(channel)}
                    style={{
                      padding: "4px 8px",
                      background: activeChatChannel === channel ? "var(--theme-accent, #00ed95)" : "transparent",
                      color: activeChatChannel === channel ? "#000" : "var(--theme-text-muted, #94a3b8)",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    #{channel}
                  </button>
                ))}
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                {chatMessages.filter((m) => !m.channel || m.channel === activeChatChannel).length === 0 ? (
                  <div style={{ color: "var(--theme-text-muted, #94a3b8)", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>
                    Aucun message sur le canal <b>#{activeChatChannel}</b>. Partagez le code <b>{roomId}</b> pour collaborer !
                  </div>
                ) : (
                  chatMessages
                    .filter((m) => !m.channel || m.channel === activeChatChannel)
                    .map((msg) => (
                      <div key={msg.id} style={{ background: "var(--theme-bg-base, #0e1314)", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--theme-border, #2c3b40)", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <strong style={{ color: "var(--theme-accent, #00ed95)", fontSize: "11px" }}>{msg.author.name}</strong>
                          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            {msg.timelineMarker && (
                              <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "1px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 800 }}>
                                MESURE {msg.timelineMarker.bar}
                              </span>
                            )}
                            <span style={{ fontSize: "9px", color: "var(--theme-text-muted, #94a3b8)" }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div style={{ color: "#edf2f7" }}>{msg.text}</div>

                        {/* Rendu de la pièce jointe musicale */}
                        {msg.attachment && (
                          <div style={{ marginTop: "6px", padding: "6px 8px", background: "rgba(0, 237, 149, 0.08)", border: "1px dashed var(--theme-accent, #00ed95)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{msg.attachment.type === "stem_audio" ? "🎵" : msg.attachment.type === "synth_preset" ? "🎛️" : msg.attachment.type === "midi_pattern" ? "🎹" : "⚡"}</span>
                              <strong>{msg.attachment.title}</strong>
                            </div>
                            <button
                              onClick={() => {
                                playSynthesizedSound("synth", 60, 110);
                                setNotice(`▶️ Écoute de l'élément : ${msg.attachment?.title}`);
                                setTimeout(() => setNotice(null), 2500);
                              }}
                              style={{ padding: "2px 8px", background: "var(--theme-accent, #00ed95)", color: "#000", border: "none", borderRadius: "3px", fontWeight: 800, fontSize: "10px", cursor: "pointer" }}
                            >
                              Écouter
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* Chat Input & Pièces Jointes */}
              <form onSubmit={handleSendChat} style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", fontSize: "11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "var(--theme-text-muted, #94a3b8)" }}>📎 Attacher :</span>
                    <select
                      value={selectedAttachmentType}
                      onChange={(e) => setSelectedAttachmentType(e.target.value as any)}
                      style={{ padding: "2px 6px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "10px" }}
                    >
                      <option value="none">Aucun</option>
                      <option value="stem_audio">Stem Audio Master</option>
                      <option value="synth_preset">Preset Synthé FM</option>
                      <option value="midi_pattern">Pattern MIDI 16 pas</option>
                      <option value="strudel_code">Motif Live Strudel</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "var(--theme-text-muted, #94a3b8)" }}>Mesure :</span>
                    <input
                      type="number"
                      min="1"
                      max="128"
                      value={chatBarMarker}
                      onChange={(e) => setChatBarMarker(Number(e.target.value))}
                      style={{ width: "45px", padding: "2px 4px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "11px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    placeholder={`Message dans #${activeChatChannel}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", background: "var(--theme-bg-base, #0e1314)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <button type="submit" style={{ padding: "8px 14px", background: "var(--theme-accent, #00ed95)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ONGLET 3: COFFRE & IDENTITÉ */}
        {activeTab === "crypto" && (
          <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
                🔒 Profil Studio & Trousseau de Clés Client (.studio-key)
              </h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleExportKeyFile}
                  style={{ padding: "6px 12px", background: "var(--theme-accent, #00ed95)", color: "#000", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                >
                  📥 Exporter ma Clé (.studio-key)
                </button>
                <button
                  onClick={() => keyFileInputRef?.click()}
                  style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--theme-border, #2c3b40)", color: "#38bdf8", borderRadius: "6px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                >
                  📤 Importer une Clé
                </button>
                <input
                  type="file"
                  accept=".studio-key,.json"
                  ref={(el) => setKeyFileInputRef(el)}
                  onChange={handleImportKeyFile}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Carte Identité & Paramètres */}
              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "18px", borderRadius: "8px", border: "1px solid var(--theme-border, #2c3b40)" }}>
                <h4 style={{ margin: "0 0 14px", color: "#38bdf8", fontSize: "13px", textTransform: "uppercase" }}>
                  Gestion de l'Identité Locale
                </h4>

                <form onSubmit={handleUpdateArtistName} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase", fontWeight: 800 }}>Nom / Alias d'Artiste</label>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <input
                        type="text"
                        value={artistNameInput}
                        onChange={(e) => setArtistNameInput(e.target.value)}
                        style={{ flex: 1, padding: "6px 10px", background: "var(--theme-bg-surface, #151d20)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "12px", fontWeight: 700 }}
                      />
                      <button type="submit" style={{ padding: "6px 10px", background: "var(--theme-accent, #00ed95)", color: "#000", border: "none", borderRadius: "4px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase", fontWeight: 800 }}>Rôle Principal dans le Studio</label>
                    <select
                      value={artistRole}
                      onChange={(e) => setArtistRole(e.target.value)}
                      style={{ width: "100%", marginTop: "4px", padding: "6px 8px", background: "var(--theme-bg-surface, #151d20)", border: "1px solid var(--theme-border, #2c3b40)", color: "inherit", borderRadius: "4px", fontSize: "12px" }}
                    >
                      <option value="Sound Designer / Producer">Sound Designer / Producer</option>
                      <option value="Beatmaker & Rythmiques">Beatmaker & Rythmiques</option>
                      <option value="Live Coder Algorave">Live Coder Algorave</option>
                      <option value="Mix & Mastering Engineer">Mix & Mastering Engineer</option>
                    </select>
                  </div>

                  <div style={{ borderTop: "1px solid var(--theme-border, #2c3b40)", paddingTop: "10px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><b>Identifiant Court :</b> <span style={{ color: "var(--theme-accent, #00ed95)", fontFamily: "monospace", fontWeight: 800 }}>{userCryptoId?.shortId || "STUDIO-LOCAL"}</span></div>
                    <div><b>Empreinte Clé :</b> <code style={{ wordBreak: "break-all", fontSize: "10px", color: "#94a3b8" }}>{userCryptoId?.publicKeyHex || "04..."}</code></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    style={{ marginTop: "6px", padding: "6px", background: "transparent", border: "1px dashed #f43f5e", color: "#f43f5e", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                  >
                    🎲 Régénérer une Clé Client
                  </button>
                </form>
              </div>

              {/* Carte Garanties & Sécurité */}
              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "18px", borderRadius: "8px", border: "1px solid var(--theme-border, #2c3b40)" }}>
                <h4 style={{ margin: "0 0 14px", color: "var(--theme-accent, #00ed95)", fontSize: "13px", textTransform: "uppercase" }}>
                  Garanties Zero-Knowledge & Local-First
                </h4>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)", lineHeight: "1.7" }}>
                  <li><b>Aucun Mot de Passe Centralisé :</b> Votre fichier de clé <code>.studio-key</code> contient votre signature unique. Conservez-le sur votre clé USB ou disque local.</li>
                  <li><b>Signatures Music-Git :</b> Chaque commit et snapshot est automatiquement validé et signé par votre identité sans serveur tiers.</li>
                  <li><b>Flux Audio P2P Directs :</b> Les sessions de jam et de partage de stems transitent en pair-à-pair direct via <b>WebRTC DataChannels</b>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
