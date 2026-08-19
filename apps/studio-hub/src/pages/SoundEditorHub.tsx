"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import "./sound-editor.css";

type SoundMachine = "ep133" | "op1";
type SoundOwner = "official" | "client";
type StudioViewMode = "grid4" | "ep133_focus" | "op1_focus";

export interface SoundItem {
  id: string;
  name: string;
  machine: SoundMachine;
  owner: SoundOwner;
  category: "kick" | "snare" | "hihat" | "perc" | "synth" | "bass" | "pad" | "loop" | "lead";
  format: "WAV 16-bit 46.8kHz" | "AIF + OP-1 JSON" | "Stereo WAV" | "Mono AIF";
  sizeKb: number;
  slotNumber?: number; // Slot #000 - #999 for EP-133
  durationSec: number;
  tags: string[];
  seedWave?: number[];
}

// EP-133 OFFICIAL SOUND BANKS (001 - 999 SLOTS)
const EP133_BANKS = [
  { id: "all", label: "TOUS (001–999)", from: 1, to: 999 },
  { id: "kick", label: "KICK (001–099)", from: 1, to: 99 },
  { id: "snare", label: "SNARE (100–199)", from: 100, to: 199 },
  { id: "hihat", label: "HI-HAT (200–299)", from: 200, to: 299 },
  { id: "perc", label: "PERC (300–399)", from: 300, to: 399 },
  { id: "bass", label: "BASS (400–499)", from: 400, to: 499 },
  { id: "synth", label: "MELODIC (500–599)", from: 500, to: 599 },
  { id: "user", label: "USER (600–999)", from: 600, to: 999 },
];

// SAMPLE DATA - EP-133 OFFICIAL FACTORY BANK
const OFFICIAL_EP133_SOUNDS: SoundItem[] = [
  { id: "ep133-001", name: "K.O. Kick Punch 01", machine: "ep133", owner: "official", category: "kick", format: "WAV 16-bit 46.8kHz", sizeKb: 120, slotNumber: 1, durationSec: 0.4, tags: ["EP133", "Kick", "Group A"], seedWave: [0.9, 0.7, 0.5, 0.3, 0.1, 0.05, 0.02] },
  { id: "ep133-002", name: "Snap Snare Crisp 02", machine: "ep133", owner: "official", category: "snare", format: "WAV 16-bit 46.8kHz", sizeKb: 180, slotNumber: 102, durationSec: 0.5, tags: ["EP133", "Snare", "Group A"], seedWave: [0.3, 0.95, 0.8, 0.6, 0.4, 0.2, 0.1] },
  { id: "ep133-003", name: "Closed Hat Tight 03", machine: "ep133", owner: "official", category: "hihat", format: "WAV 16-bit 46.8kHz", sizeKb: 85, slotNumber: 203, durationSec: 0.2, tags: ["EP133", "Hat", "Group A"], seedWave: [0.8, 0.4, 0.15, 0.05] },
  { id: "ep133-004", name: "Sub Bass Analog 04", machine: "ep133", owner: "official", category: "bass", format: "Stereo WAV", sizeKb: 420, slotNumber: 404, durationSec: 1.2, tags: ["EP133", "Bass", "Group B"], seedWave: [0.6, 0.65, 0.7, 0.68, 0.62, 0.55, 0.4] },
  { id: "ep133-005", name: "Chop Vocal Shout 05", machine: "ep133", owner: "official", category: "lead", format: "WAV 16-bit 46.8kHz", sizeKb: 250, slotNumber: 505, durationSec: 0.8, tags: ["EP133", "Vox", "Group C"], seedWave: [0.4, 0.85, 0.6, 0.75, 0.5, 0.2] },
  { id: "ep133-006", name: "Synth Stabs Poly 06", machine: "ep133", owner: "official", category: "synth", format: "Stereo WAV", sizeKb: 610, slotNumber: 506, durationSec: 1.5, tags: ["EP133", "Synth", "Group D"], seedWave: [0.75, 0.7, 0.65, 0.6, 0.55, 0.45] },
];

// SAMPLE DATA - EP-133 CLIENT LOCAL LIBRARY
const CLIENT_EP133_SOUNDS: SoundItem[] = [
  { id: "ep133-c01", name: "Mon Kick Perso 909", machine: "ep133", owner: "client", category: "kick", format: "WAV 16-bit 46.8kHz", sizeKb: 140, slotNumber: 601, durationSec: 0.45, tags: ["Client", "Custom", "909"], seedWave: [0.95, 0.8, 0.55, 0.25, 0.08] },
  { id: "ep133-c02", name: "Prise Micro Sample Live", machine: "ep133", owner: "client", category: "loop", format: "Stereo WAV", sizeKb: 980, slotNumber: 602, durationSec: 2.8, tags: ["Client", "Rec", "Mic"], seedWave: [0.3, 0.6, 0.45, 0.8, 0.5, 0.7] },
  { id: "ep133-c03", name: "Rimshot Vintage EP", machine: "ep133", owner: "client", category: "perc", format: "WAV 16-bit 46.8kHz", sizeKb: 95, slotNumber: 303, durationSec: 0.3, tags: ["Client", "Perc"], seedWave: [0.85, 0.3, 0.1] },
];

// SAMPLE DATA - OP-1 OFFICIAL FACTORY BANK
const OFFICIAL_OP1_SOUNDS: SoundItem[] = [
  { id: "op1-001", name: "FM Engine - Crystal Poly", machine: "op1", owner: "official", category: "synth", format: "AIF + OP-1 JSON", sizeKb: 1024, durationSec: 3.0, tags: ["OP1", "FM", "Patch"], seedWave: [0.5, 0.8, 0.3, 0.9, 0.4, 0.7] },
  { id: "op1-002", name: "Cluster Synth - Sub Attack", machine: "op1", owner: "official", category: "bass", format: "AIF + OP-1 JSON", sizeKb: 850, durationSec: 2.5, tags: ["OP1", "Cluster", "Bass"], seedWave: [0.85, 0.75, 0.65, 0.55, 0.4] },
  { id: "op1-003", name: "Drum Sampler - Electro Kit", machine: "op1", owner: "official", category: "kick", format: "AIF + OP-1 JSON", sizeKb: 2048, durationSec: 12.0, tags: ["OP1", "DrumKit", "8-Slice"], seedWave: [0.9, 0.2, 0.8, 0.15, 0.7, 0.2] },
  { id: "op1-004", name: "DNA Engine - Genetic Lead", machine: "op1", owner: "official", category: "lead", format: "AIF + OP-1 JSON", sizeKb: 920, durationSec: 2.2, tags: ["OP1", "DNA", "Lead"], seedWave: [0.4, 0.7, 0.9, 0.6, 0.8, 0.3] },
  { id: "op1-005", name: "String Engine - Warm Pad", machine: "op1", owner: "official", category: "pad", format: "AIF + OP-1 JSON", sizeKb: 1540, durationSec: 4.0, tags: ["OP1", "String", "Pad"], seedWave: [0.3, 0.4, 0.5, 0.6, 0.5, 0.4] },
];

// SAMPLE DATA - OP-1 CLIENT LOCAL LIBRARY
const CLIENT_OP1_SOUNDS: SoundItem[] = [
  { id: "op1-c01", name: "Patch Perso AZOTH Synth 01", machine: "op1", owner: "client", category: "synth", format: "AIF + OP-1 JSON", sizeKb: 1100, durationSec: 3.2, tags: ["AZOTH", "OP1", "Custom"], seedWave: [0.6, 0.85, 0.7, 0.9, 0.5] },
  { id: "op1-c02", name: "Export Tape Track 01 Session", machine: "op1", owner: "client", category: "loop", format: "Mono AIF", sizeKb: 4200, durationSec: 15.0, tags: ["AZOTH", "Tape", "Track1"], seedWave: [0.4, 0.5, 0.6, 0.55, 0.45, 0.35] },
  { id: "op1-c03", name: "Drum Kit Custom Vinyl", machine: "op1", owner: "client", category: "perc", format: "AIF + OP-1 JSON", sizeKb: 2150, durationSec: 12.0, tags: ["AZOTH", "Vinyl", "Drums"], seedWave: [0.9, 0.3, 0.75, 0.2, 0.8, 0.1] },
];

export default function SoundEditorHub({ profileName = "AZOTH" }: { profileName?: string; onClose?: () => void }) {
  // Studio View Mode (Space Saver): 4 Quadrants vs EP-133 Focus vs OP-1 Focus
  const [viewMode, setViewMode] = useState<StudioViewMode>("grid4");

  // Waveform Visualizer Retractable Space Saver State
  const [isWaveformExpanded, setIsWaveformExpanded] = useState<boolean>(true);

  // Slide-out Drawer Overlay States
  const [isEp133DrawerOpen, setIsEp133DrawerOpen] = useState<boolean>(false);
  const [isOp1DrawerOpen, setIsOp1DrawerOpen] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Active Selected Sound Item & Playback State
  const [selectedSound, setSelectedSound] = useState<SoundItem>(OFFICIAL_EP133_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playDirection, setPlayDirection] = useState<"forward" | "reverse">("forward");
  const [playProgress, setPlayProgress] = useState<number>(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);

  // Waveform Trim Markers
  const [trimIn, setTrimIn] = useState<number>(0); // 0%
  const [trimOut, setTrimOut] = useState<number>(100); // 100%
  const [waveZoom, setWaveZoom] = useState<number>(1); // 1x to 4x

  // Toast Overlay
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sound Banks State
  const [officialEp133List] = useState<SoundItem[]>(OFFICIAL_EP133_SOUNDS);
  const [clientEp133List, setClientEp133List] = useState<SoundItem[]>(CLIENT_EP133_SOUNDS);
  const [officialOp1List] = useState<SoundItem[]>(OFFICIAL_OP1_SOUNDS);
  const [clientOp1List, setClientOp1List] = useState<SoundItem[]>(CLIENT_OP1_SOUNDS);

  // Canvas Ref for Waveform
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Playback Progress Loop Animation (FORWARD & REVERSE)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlayProgress((prev) => {
        if (playDirection === "forward") {
          if (prev >= trimOut) {
            setIsPlaying(false);
            return trimIn;
          }
          return prev + 2;
        } else {
          if (prev <= trimIn) {
            setIsPlaying(false);
            return trimOut;
          }
          return prev - 2;
        }
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, trimIn, trimOut, playDirection]);

  // DRAW WAVEFORM CANVAS
  useEffect(() => {
    if (!isWaveformExpanded) return;
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background OLED dark
    ctx.fillStyle = "#0d0f18";
    ctx.fillRect(0, 0, width, height);

    // Fine OLED Grid lines
    ctx.strokeStyle = "rgba(0, 237, 149, 0.08)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center baseline
    ctx.strokeStyle = "rgba(135, 131, 156, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform color scheme according to machine
    const isEp = selectedSound.machine === "ep133";
    const mainColor = isEp ? "#ff3a5d" : "#00ed95";
    const fillColor = isEp ? "rgba(255, 58, 93, 0.25)" : "rgba(0, 237, 149, 0.25)";

    const cat = selectedSound.category.toLowerCase();
    const name = selectedSound.name.toLowerCase();
    const pointCount = Math.floor(300 * waveZoom);

    // Compute realistic amplitude envelope contour points
    const topPoints: { x: number; y: number }[] = [];
    const bottomPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < pointCount; i++) {
      const t = i / pointCount; // 0.0 to 1.0
      const x = t * width;

      let env = 0.5;
      if (cat === "kick" || name.includes("kick") || (selectedSound.slotNumber && selectedSound.slotNumber < 100)) {
        // Kick envelope: fast punch peak then exponential decay
        env = Math.exp(-t * 3.5) * (0.85 + 0.15 * Math.sin(t * 80));
      } else if (cat === "snare" || name.includes("snare") || (selectedSound.slotNumber && selectedSound.slotNumber >= 100 && selectedSound.slotNumber < 200)) {
        // Snare envelope: initial snap + noise burst tail
        env = Math.exp(-t * 4.0) * 0.9 + Math.exp(-t * 2.0) * 0.3 * Math.random();
      } else if (cat === "hihat" || cat === "perc" || name.includes("hihat") || (selectedSound.slotNumber && selectedSound.slotNumber >= 200 && selectedSound.slotNumber < 400)) {
        // Hi-Hat envelope: needle sharp spike + rapid decay
        env = Math.exp(-t * 12.0) * (0.6 + 0.4 * Math.random());
      } else if (cat === "bass" || name.includes("bass") || (selectedSound.slotNumber && selectedSound.slotNumber >= 400 && selectedSound.slotNumber < 500)) {
        // Bass envelope: sustained resonant oscillation
        env = (0.7 + 0.2 * Math.sin(t * 30)) * Math.exp(-t * 1.2);
      } else {
        // Melodic / Synth: rich harmonic wave + envelope
        env = (0.65 + 0.25 * Math.cos(t * 50) + 0.1 * Math.sin(t * 120)) * Math.exp(-t * 0.8);
      }

      // Add seed variability
      const seedVal = selectedSound.seedWave ? selectedSound.seedWave[i % selectedSound.seedWave.length] : 0.5;
      const finalAmp = Math.max(0.04, Math.min(0.95, env * (0.7 + seedVal * 0.3))) * (height / 2 - 8);

      topPoints.push({ x, y: height / 2 - finalAmp });
      bottomPoints.push({ x, y: height / 2 + finalAmp });
    }

    // Draw Filled Waveform Contour
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    for (let i = bottomPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw Crisp Waveform Outline Contour with OLED Glow
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 6;
    ctx.shadowColor = mainColor;

    // Top contour line
    ctx.beginPath();
    for (let i = 0; i < topPoints.length; i++) {
      if (i === 0) ctx.moveTo(topPoints[i].x, topPoints[i].y);
      else ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    ctx.stroke();

    // Bottom contour line
    ctx.beginPath();
    for (let i = 0; i < bottomPoints.length; i++) {
      if (i === 0) ctx.moveTo(bottomPoints[i].x, bottomPoints[i].y);
      else ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    }
    ctx.stroke();

    ctx.restore();

    // Trim Overlay - Dim regions outside Trim IN and Trim OUT
    const xIn = (trimIn / 100) * width;
    const xOut = (trimOut / 100) * width;

    ctx.fillStyle = "rgba(10, 12, 18, 0.7)";
    if (xIn > 0) ctx.fillRect(0, 0, xIn, height);
    if (xOut < width) ctx.fillRect(xOut, 0, width - xOut, height);

    // Draw Trim In Marker (Left)
    ctx.strokeStyle = "#4aa7ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xIn, 0);
    ctx.lineTo(xIn, height);
    ctx.stroke();

    ctx.fillStyle = "#4aa7ff";
    ctx.fillRect(xIn - 2, 0, 16, 12);
    ctx.fillStyle = "#0d0f18";
    ctx.font = "bold 8px monospace";
    ctx.fillText("IN", xIn + 1, 9);

    // Draw Trim Out Marker (Right)
    ctx.strokeStyle = "#d9ff43";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOut, 0);
    ctx.lineTo(xOut, height);
    ctx.stroke();

    ctx.fillStyle = "#d9ff43";
    ctx.fillRect(xOut - 18, 0, 20, 12);
    ctx.fillStyle = "#0d0f18";
    ctx.font = "bold 8px monospace";
    ctx.fillText("OUT", xOut - 16, 9);

    // Draw Playhead Line
    const xPlay = (playProgress / 100) * width;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPlay, 0);
    ctx.lineTo(xPlay, height);
    ctx.stroke();

    // Playhead head
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(xPlay, height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [selectedSound, trimIn, trimOut, waveZoom, playProgress, isWaveformExpanded]);

  // Click & Drag Canvas to Scrub Playhead Interactively
  const updatePlayheadFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setPlayProgress(pct);
    playScrubSound(selectedSound, pct);
  };

  const handleWaveformMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingPlayhead(true);
    updatePlayheadFromEvent(e);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingPlayhead) return;
    updatePlayheadFromEvent(e);
  };

  const handleWaveformMouseUp = () => {
    setIsDraggingPlayhead(false);
  };

  // Filter Sounds Helper
  const filterList = (list: SoundItem[]) => {
    return list.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

      // Filter EP-133 001-999 Slot Ranges if selected
      const bankConfig = EP133_BANKS.find((b) => b.id === selectedCategory);
      if (bankConfig && item.slotNumber !== undefined) {
        matchesCategory = item.slotNumber >= bankConfig.from && item.slotNumber <= bankConfig.to;
      }

      return matchesSearch && matchesCategory;
    });
  };

  // Audio Context Ref for Real Audible Web Audio Playback
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // AUDIO SCRUBBING / DJ TAPE SCRATCH SOUND
  const playScrubSound = (sound: SoundItem, pctPosition: number) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const cat = sound.category.toLowerCase();
      const baseFreq = cat === "kick" ? 60 + (100 - pctPosition) * 1.5 : 200 + (100 - pctPosition) * 4;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(baseFreq, now);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600 + pctPosition * 15, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (err) {
      console.warn("Scrub sound error:", err);
    }
  };

  // AUDIBLE SOUND SYNTHESIZER / SAMPLE PLAYER
  const playAudibleSound = (sound: SoundItem, direction: "forward" | "reverse" = "forward") => {
    try {
      if ((sound as any).audioUrl) {
        const audio = new Audio((sound as any).audioUrl);
        audio.play().catch((err) => console.warn("Audio element play error:", err));
        return;
      }

      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(ctx.destination);

      const cat = sound.category.toLowerCase();
      const name = sound.name.toLowerCase();

      if (cat === "kick" || name.includes("kick") || (sound.slotNumber && sound.slotNumber < 100)) {
        // PUNCHY BASS DRUM (KICK)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        if (direction === "forward") {
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
          gain.gain.setValueAtTime(1.0, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        } else {
          // REVERSE KICK SWELL
          osc.frequency.setValueAtTime(35, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.22);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(1.0, now + 0.22);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        }
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (cat === "snare" || name.includes("snare") || (sound.slotNumber && sound.slotNumber >= 100 && sound.slotNumber < 200)) {
        // SNARE DRUM (Noise + Sine Snap)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "triangle";

        if (direction === "forward") {
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
          oscGain.gain.setValueAtTime(0.7, now);
          oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        } else {
          // REVERSE SNARE SWELL
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
          oscGain.gain.setValueAtTime(0.01, now);
          oscGain.gain.linearRampToValueAtTime(0.7, now + 0.14);
        }
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.15);

        // Noise snap / reverse swell
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "highpass";
        noiseFilter.frequency.setValueAtTime(1000, now);
        const noiseGain = ctx.createGain();
        if (direction === "forward") {
          noiseGain.gain.setValueAtTime(0.6, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        } else {
          noiseGain.gain.setValueAtTime(0.01, now);
          noiseGain.gain.linearRampToValueAtTime(0.6, now + 0.14);
        }
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.15);
      } else if (cat === "hihat" || cat === "perc" || name.includes("hihat") || (sound.slotNumber && sound.slotNumber >= 200 && sound.slotNumber < 400)) {
        // HI-HAT / PERCUSSION
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7000, now);
        const gain = ctx.createGain();
        if (direction === "forward") {
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        } else {
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.07);
        }
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.08);
      } else {
        // MELODIC / SYNTH / OP-1 PATCH
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = sound.machine === "op1" ? "sawtooth" : "square";
        osc.frequency.setValueAtTime(329.63, now);
        if (direction === "forward") {
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        } else {
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.45);
        }
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // Select Sound Item
  const selectSound = (sound: SoundItem) => {
    setSelectedSound(sound);
    setPlayProgress(0);
    setTrimIn(0);
    setTrimOut(100);
    setIsPlaying(true);
    playAudibleSound(sound);
    showToast(`🎵 SON SÉLECTIONNÉ : ${sound.name}`);
  };

  // Import New Sound
  const handleImportClientSound = (machine: SoundMachine) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".wav,.aif,.aiff,.mp3";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const newSound: SoundItem = {
          id: `${machine}-c-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          machine,
          owner: "client",
          category: "synth",
          format: machine === "ep133" ? "WAV 16-bit 46.8kHz" : "AIF + OP-1 JSON",
          sizeKb: Math.round(file.size / 1024),
          slotNumber: machine === "ep133" ? 600 + Math.floor(Math.random() * 300) : undefined,
          durationSec: 2.0,
          tags: ["Client", "Importé", machine.toUpperCase()],
          seedWave: [0.7, 0.9, 0.8, 0.6, 0.4, 0.2],
        };

        if (machine === "ep133") {
          setClientEp133List((prev) => [newSound, ...prev]);
        } else {
          setClientOp1List((prev) => [newSound, ...prev]);
        }
        selectSound(newSound);
      }
    };
    input.click();
  };

  return (
    <main className="sound-editor-hub-page">
      <TopBar activePage="sound-editor" profileName={profileName} />

      {/* LEFT SLIDE-OUT DRAWER TRIGGER BUTTON (EP-133) */}
      <button
        type="button"
        className={`drawer-trigger-tab tab-left-ep133 ${isEp133DrawerOpen ? "drawer-tab-active" : ""}`}
        onClick={() => {
          setIsEp133DrawerOpen(!isEp133DrawerOpen);
          if (isOp1DrawerOpen) setIsOp1DrawerOpen(false);
        }}
        title="Ouvrir le panneau Import/Export & Transfert EP-133"
      >
        <span>📥 TRANSFERT & IMPORT EP-133</span>
      </button>

      {/* RIGHT SLIDE-OUT DRAWER TRIGGER BUTTON (OP-1) */}
      <button
        type="button"
        className={`drawer-trigger-tab tab-right-op1 ${isOp1DrawerOpen ? "drawer-tab-active" : ""}`}
        onClick={() => {
          setIsOp1DrawerOpen(!isOp1DrawerOpen);
          if (isEp133DrawerOpen) setIsEp133DrawerOpen(false);
        }}
        title="Ouvrir le panneau Sauvegarde & Transfert OP-1"
      >
        <span>🎹 SAUVEGARDE & TRANSFERT OP-1</span>
      </button>

      {/* MAIN CONTAINER */}
      <div className="sound-editor-wrapper">
        {/* TOP CONTROL BAR, VIEW MODE TOGGLES & SEARCH */}
        <header className="sound-top-bar">
          <div className="sound-top-headline-row">
            <div className="sound-header-titles">
              <h1>🎵 STUDIO SON UNIFIÉ (EP-133 & OP-1)</h1>
              <p>Banques usine, bibliothèques client local et transferts machines</p>
            </div>

            {/* VIEW MODE SPACE SAVER SWITCHER */}
            <div className="space-saver-mode-group">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "grid4" ? "active-mode" : ""}`}
                onClick={() => setViewMode("grid4")}
              >
                🎛️ VUE GLOBAL (4 QUADRANTS)
              </button>
              <button
                type="button"
                className={`view-mode-btn btn-ep-mode ${viewMode === "ep133_focus" ? "active-mode" : ""}`}
                onClick={() => setViewMode("ep133_focus")}
              >
                🥁 EP-133 K.O. II (FOCUS 999 SLOTS)
              </button>
              <button
                type="button"
                className={`view-mode-btn btn-op-mode ${viewMode === "op1_focus" ? "active-mode" : ""}`}
                onClick={() => setViewMode("op1_focus")}
              >
                🎹 OP-1 STUDIO (FOCUS PATCHES & TAPE)
              </button>
            </div>
          </div>

          <div className="sound-search-filter-row">
            <input
              type="text"
              className="sound-search-input"
              placeholder="🔍 Rechercher un son, kick, synthé, slot #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* EP-133 001-999 SLOTS BANK SELECTOR */}
            <div className="category-pills-bar">
              {EP133_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  className={`cat-pill-btn ${selectedCategory === bank.id ? "active-cat-pill" : ""}`}
                  onClick={() => setSelectedCategory(bank.id)}
                >
                  {bank.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* RETRACTABLE WAVEFORM VISUALIZER (SPACE SAVER) */}
        <section className="waveform-retractable-wrapper">
          <button
            type="button"
            className="toggle-waveform-banner-btn"
            onClick={() => setIsWaveformExpanded(!isWaveformExpanded)}
          >
            <span>
              {isWaveformExpanded
                ? "▼ MASQUER L'AFFICHEUR FORME D'ONDE (GAGNER DE LA PLACE) ▼"
                : `▲ AFFICHER LA FORME D'ONDE DE : ${selectedSound.name.toUpperCase()} ▲`}
            </span>
          </button>

          {isWaveformExpanded && (
            <div className="waveform-display-card">
              <div className="waveform-card-header">
                <div className="wf-info-group">
                  <span className={`wf-machine-tag ${selectedSound.machine === "ep133" ? "ep-tag" : "op-tag"}`}>
                    {selectedSound.machine.toUpperCase()}
                  </span>
                  <strong>{selectedSound.name}</strong>
                  <small>({selectedSound.format} • {selectedSound.sizeKb} Ko • {selectedSound.durationSec}s)</small>
                </div>

                <div className="wf-controls-toolbar">
                  {/* NORMAL PLAY BUTTON */}
                  <button
                    type="button"
                    className={`wf-play-btn ${isPlaying && playDirection === "forward" ? "playing" : ""}`}
                    onClick={() => {
                      if (isPlaying && playDirection === "forward") {
                        setIsPlaying(false);
                      } else {
                        setPlayDirection("forward");
                        setPlayProgress(trimIn);
                        setIsPlaying(true);
                        playAudibleSound(selectedSound, "forward");
                        showToast(`▶ LECTURE NORMALE : ${selectedSound.name}`);
                      }
                    }}
                  >
                    {isPlaying && playDirection === "forward" ? "⏸ PAUSE" : "▶ LECTURE NORMAL"}
                  </button>

                  {/* REVERSE PLAY BUTTON */}
                  <button
                    type="button"
                    className={`wf-play-btn btn-reverse-play ${isPlaying && playDirection === "reverse" ? "playing" : ""}`}
                    onClick={() => {
                      if (isPlaying && playDirection === "reverse") {
                        setIsPlaying(false);
                      } else {
                        setPlayDirection("reverse");
                        setPlayProgress(trimOut);
                        setIsPlaying(true);
                        playAudibleSound(selectedSound, "reverse");
                        showToast(`◀ LECTURE À L'ENVERS (REVERSE) : ${selectedSound.name}`);
                      }
                    }}
                  >
                    {isPlaying && playDirection === "reverse" ? "⏸ PAUSE" : "◀ À L'ENVERS (REVERSE)"}
                  </button>

                  <div className="wf-zoom-group">
                    <span>ZOOM WAVE:</span>
                    {[1, 2, 4].map((z) => (
                      <button
                        key={z}
                        type="button"
                        className={`wf-zoom-btn ${waveZoom === z ? "active" : ""}`}
                        onClick={() => setWaveZoom(z)}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CANVAS WAVEFORM */}
              <div className="waveform-canvas-frame">
                <canvas
                  ref={waveCanvasRef}
                  width={1200}
                  height={90}
                  className="waveform-canvas"
                  onMouseDown={handleWaveformMouseDown}
                  onMouseMove={handleWaveformMouseMove}
                  onMouseUp={handleWaveformMouseUp}
                  onMouseLeave={handleWaveformMouseUp}
                />
              </div>

              {/* WAVEFORM TRIM SLIDERS */}
              <div className="waveform-trim-bar">
                <label className="trim-label blue-lbl">
                  TRIM IN: {trimIn}%
                  <input
                    type="range"
                    min={0}
                    max={trimOut - 5}
                    value={trimIn}
                    onChange={(e) => setTrimIn(Number(e.target.value))}
                    className="trim-range range-blue"
                  />
                </label>

                <label className="trim-label yellow-lbl">
                  TRIM OUT: {trimOut}%
                  <input
                    type="range"
                    min={trimIn + 5}
                    max={100}
                    value={trimOut}
                    onChange={(e) => setTrimOut(Number(e.target.value))}
                    className="trim-range range-yellow"
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        {/* LEFT SLIDE-OUT DRAWER OVERLAY (EP-133 IMPORT/EXPORT) */}
        {isEp133DrawerOpen && (
          <aside className="slide-drawer-panel drawer-panel-left">
            <div className="drawer-panel-header">
              <h3>🥁 TAMPON DE TRANSFERT & IMPORT EP-133 K.O. II</h3>
              <button type="button" className="close-drawer-btn" onClick={() => setIsEp133DrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-panel-body">
              <div className="drawer-info-card">
                <strong>FORMAT EP-133 DE BASE :</strong>
                <p>Format WAV / AIF 16-bit 46.875 kHz. Supporte 999 slots audio (#000 - #999) répartis sur les Groupes A, B, C, D (Pads 1 à 12).</p>
              </div>

              <div className="drawer-actions-grid">
                <button type="button" className="drawer-action-btn btn-pink" onClick={() => handleImportClientSound("ep133")}>
                  📥 IMPORTER ÉCHANTILLON AUDIO (.WAV/.AIF)
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("⚡ TRANSFERT EN COURS VERS L'EP-133 VIA USB...")}>
                  ⚡ SAUVEGARDER & TRANSFÉRER VERS L'EP-133
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("📦 EXPORTATION DE LA BANQUE COMPLETE EN ZIP...")}>
                  📦 EXPORTER LA BANQUE 999 SLOTS (ZIP)
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("🔄 DÉDUPLICATION DES SAMPLES SHA-256 EFFECTUÉE")}>
                  🔄 NETTOYER & DÉDUPLIQUER (SHA-256)
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* RIGHT SLIDE-OUT DRAWER OVERLAY (OP-1 SAVE/TRANSFER) */}
        {isOp1DrawerOpen && (
          <aside className="slide-drawer-panel drawer-panel-right">
            <div className="drawer-panel-header">
              <h3>🎹 GESTIONNAIRE DE PATCHES & TAPE OP-1</h3>
              <button type="button" className="close-drawer-btn" onClick={() => setIsOp1DrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-panel-body">
              <div className="drawer-info-card">
                <strong>FORMAT OP-1 AIF.JSON DE BASE :</strong>
                <p>Format conteneur AIF avec métadonnées JSON intégrées (points d'attaque, pitch, 8 découpes drum, LFO et effets).</p>
              </div>

              <div className="drawer-actions-grid">
                <button type="button" className="drawer-action-btn btn-yellow" onClick={() => handleImportClientSound("op1")}>
                  📥 IMPORTER PATCH OP-1 (.AIF.JSON)
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("💾 SAUVEGARDE DU PATCH DANS OP1/PROJECTS...")}>
                  💾 SAUVEGARDER LE PATCH ACTIF
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("🔌 DISQUE VIRTUEL OP-1 MONTÉ (MASS STORAGE)")}>
                  🔌 TRANSFÉRER SUR LE DISQUE OP-1 (USB)
                </button>
                <button type="button" className="drawer-action-btn" onClick={() => showToast("🎚️ EXPORTATION DE LA TAPE 4-PISTES EN AIF MONO...")}>
                  🎚️ EXPORTER LA TAPE 4-PISTES (AIF)
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* UNIFIED QUADRANTS GRID OR FOCUS VIEWS */}
        <div className={`sound-quadrants-layout mode-${viewMode}`}>
          {/* EP-133 OFFICIAL QUADRANT */}
          {(viewMode === "grid4" || viewMode === "ep133_focus") && (
            <section className="quadrant-card quad-ep133-official">
              <div className="quadrant-header">
                <div className="quadrant-title-group">
                  <span className="badge-machine ep133-badge">EP-133</span>
                  <h2>🥁 BIBLIOTHÈQUE OFFICIELLE EP-133 K.O. II</h2>
                </div>
                <span className="count-tag">{filterList(officialEp133List).length} SAMPLES USINE</span>
              </div>

              <div className="quadrant-sounds-list">
                {filterList(officialEp133List).map((s) => (
                  <div key={s.id} className={`sound-list-item ${selectedSound.id === s.id ? "is-playing" : ""}`} onClick={() => selectSound(s)}>
                    <button type="button" className="play-sound-btn">
                      {selectedSound.id === s.id && isPlaying ? "⏸" : "▶"}
                    </button>
                    <div className="sound-meta-main">
                      <span className="sound-name">{s.name}</span>
                      <span className="sound-specs">Slot #{String(s.slotNumber).padStart(3, "0")} • {s.format} • {s.sizeKb} Ko</span>
                    </div>
                    <button
                      type="button"
                      className="action-copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientEp133List((prev) => [{ ...s, id: `copy-${Date.now()}`, owner: "client", name: `${s.name} (Copie)` }, ...prev]);
                        showToast(`➕ COPIÉ VERS LA BIBLIOTHÈQUE CLIENT EP-133`);
                      }}
                      title="Copier vers la bibliothèque client EP-133"
                    >
                      + CLIENT
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EP-133 CLIENT LOCAL QUADRANT */}
          {(viewMode === "grid4" || viewMode === "ep133_focus") && (
            <section className="quadrant-card quad-ep133-client">
              <div className="quadrant-header">
                <div className="quadrant-title-group">
                  <span className="badge-machine client-badge">CLIENT LOCAL</span>
                  <h2>🎧 BIBLIOTHÈQUE CLIENT EP-133</h2>
                </div>
                <button type="button" className="add-sound-mini-btn" onClick={() => handleImportClientSound("ep133")}>
                  + IMPORTER
                </button>
              </div>

              <div className="quadrant-sounds-list">
                {filterList(clientEp133List).length === 0 ? (
                  <div className="empty-bank-notice">Aucun son client dans cette catégorie. Cliquez sur + IMPORTER.</div>
                ) : (
                  filterList(clientEp133List).map((s) => (
                    <div key={s.id} className={`sound-list-item client-item ${selectedSound.id === s.id ? "is-playing" : ""}`} onClick={() => selectSound(s)}>
                      <button type="button" className="play-sound-btn">
                        {selectedSound.id === s.id && isPlaying ? "⏸" : "▶"}
                      </button>
                      <div className="sound-meta-main">
                        <span className="sound-name">{s.name}</span>
                        <span className="sound-specs">Slot #{s.slotNumber} • {s.format} • {s.sizeKb} Ko</span>
                      </div>
                      <button
                        type="button"
                        className="delete-sound-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientEp133List((prev) => prev.filter((item) => item.id !== s.id));
                          showToast(`🗑️ SON SUPPRIMÉ DE LA BIBLIOTHÈQUE CLIENT`);
                        }}
                        title="Supprimer ce son"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* OP-1 OFFICIAL QUADRANT */}
          {(viewMode === "grid4" || viewMode === "op1_focus") && (
            <section className="quadrant-card quad-op1-official">
              <div className="quadrant-header">
                <div className="quadrant-title-group">
                  <span className="badge-machine op1-badge">OP-1</span>
                  <h2>🎹 BIBLIOTHÈQUE OFFICIELLE OP-1</h2>
                </div>
                <span className="count-tag">{filterList(officialOp1List).length} PATCHES USINE</span>
              </div>

              <div className="quadrant-sounds-list">
                {filterList(officialOp1List).map((s) => (
                  <div key={s.id} className={`sound-list-item ${selectedSound.id === s.id ? "is-playing" : ""}`} onClick={() => selectSound(s)}>
                    <button type="button" className="play-sound-btn">
                      {selectedSound.id === s.id && isPlaying ? "⏸" : "▶"}
                    </button>
                    <div className="sound-meta-main">
                      <span className="sound-name">{s.name}</span>
                      <span className="sound-specs">{s.format} • {s.sizeKb} Ko • {s.durationSec}s</span>
                    </div>
                    <button
                      type="button"
                      className="action-copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientOp1List((prev) => [{ ...s, id: `copy-${Date.now()}`, owner: "client", name: `${s.name} (Copie)` }, ...prev]);
                        showToast(`➕ COPIÉ VERS LA BIBLIOTHÈQUE CLIENT OP-1`);
                      }}
                      title="Copier vers la bibliothèque client OP-1"
                    >
                      + CLIENT
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* OP-1 CLIENT LOCAL QUADRANT */}
          {(viewMode === "grid4" || viewMode === "op1_focus") && (
            <section className="quadrant-card quad-op1-client">
              <div className="quadrant-header">
                <div className="quadrant-title-group">
                  <span className="badge-machine client-badge">CLIENT LOCAL</span>
                  <h2>📂 BIBLIOTHÈQUE CLIENT OP-1</h2>
                </div>
                <button type="button" className="add-sound-mini-btn" onClick={() => handleImportClientSound("op1")}>
                  + IMPORTER
                </button>
              </div>

              <div className="quadrant-sounds-list">
                {filterList(clientOp1List).length === 0 ? (
                  <div className="empty-bank-notice">Aucun patch client dans cette catégorie. Cliquez sur + IMPORTER.</div>
                ) : (
                  filterList(clientOp1List).map((s) => (
                    <div key={s.id} className={`sound-list-item client-item ${selectedSound.id === s.id ? "is-playing" : ""}`} onClick={() => selectSound(s)}>
                      <button type="button" className="play-sound-btn">
                        {selectedSound.id === s.id && isPlaying ? "⏸" : "▶"}
                      </button>
                      <div className="sound-meta-main">
                        <span className="sound-name">{s.name}</span>
                        <span className="sound-specs">{s.format} • {s.sizeKb} Ko • {s.durationSec}s</span>
                      </div>
                      <button
                        type="button"
                        className="delete-sound-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientOp1List((prev) => prev.filter((item) => item.id !== s.id));
                          showToast(`🗑️ PATCH SUPPRIMÉ DE LA BIBLIOTHÈQUE CLIENT`);
                        }}
                        title="Supprimer ce patch"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* TOAST OVERLAY NOTIFICATION */}
      {toastMessage && (
        <div className="sound-toast-overlay">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
