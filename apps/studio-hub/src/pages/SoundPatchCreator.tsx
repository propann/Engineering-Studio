import { createLogger } from "@studio-hub/audio-bridge";
const log = createLogger("SoundPatch");
"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import "./sound-patch-creator.css";
import { useNotesMidi } from "../core/midi/useNotesMidi";

type MachineTarget = "op1" | "ep133";
type Op1EngineType = "fm" | "dna" | "cluster" | "string" | "phase" | "digital" | "pulse";

export default function SoundPatchCreator({ profileName = "NOUVEAU MEMBRE", onClose }: { profileName?: string; onClose?: () => void }) {
  const [targetMachine, setTargetMachine] = useState<MachineTarget>("op1");

  // OP-1 SYNTH PATCH ENGINE PARAMETERS
  const [op1Engine, setOp1Engine] = useState<Op1EngineType>("fm");
  const [patchName, setPatchName] = useState<string>("MON_PATCH_01");
  const [knob1Val, setKnob1Val] = useState<number>(64); // Blue Encoder
  const [knob2Val, setKnob2Val] = useState<number>(85); // Green Encoder
  const [knob3Val, setKnob3Val] = useState<number>(42); // White Encoder
  const [knob4Val, setKnob4Val] = useState<number>(90); // Orange Encoder

  // ADSR ENVELOPE PARAMETERS
  const [attack, setAttack] = useState<number>(10); // ms / %
  const [decay, setDecay] = useState<number>(40);
  const [sustain, setSustain] = useState<number>(70);
  const [release, setRelease] = useState<number>(30);

  // EP-133 SAMPLE & PAD CONFIG
  const [epSlot, setEpSlot] = useState<number>(501);
  const [epGroup, setEpGroup] = useState<"A" | "B" | "C" | "D">("A");
  const [epPad, setEpPad] = useState<number>(1);
  const [epPadMode, setEpPadMode] = useState<"ONE-SHOT" | "KEYS" | "LEGATO">("KEYS");
  const [epPitch, setEpPitch] = useState<number>(0);
  const [epLoop, setEpLoop] = useState<boolean>(false);

  // Web Audio Context State
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Toast Overlay
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Ref for Engine Oscilloscope / Envelope
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // INITIALIZE WEB AUDIO CONTEXT
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setIsAudioActive(true);
    return audioCtxRef.current;
  };

  // PLAY REAL-TIME SYNTH SOUND VIA WEB AUDIO API
  const playLiveSynthNote = (freq: number = 261.63, silencieux = false) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Master Gain Node for ADSR Envelope
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      // ADSR Envelope Timings
      const attTime = Math.max(0.01, (attack / 100) * 0.8);
      const decTime = Math.max(0.02, (decay / 100) * 0.8);
      const susLevel = Math.max(0.01, sustain / 100);
      const relTime = Math.max(0.05, (release / 100) * 1.5);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + attTime);
      gainNode.gain.exponentialRampToValueAtTime(susLevel * 0.4, now + attTime + decTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attTime + decTime + relTime);

      // Filter settings based on White (Resonance) & Blue (Cutoff) Encoders
      const cutoffFreq = Math.min(12000, Math.max(100, (knob1Val / 100) * 8000 + 200));
      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(cutoffFreq, now);
      filterNode.Q.setValueAtTime((knob3Val / 100) * 15, now);

      if (op1Engine === "fm") {
        // FM SYNTHESIS: Carrier + Modulator
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();

        const modRatio = (knob2Val / 100) * 4 + 0.5;
        const modIndex = (knob4Val / 100) * 500;

        carrier.type = "sine";
        carrier.frequency.setValueAtTime(freq, now);

        modulator.type = "sine";
        modulator.frequency.setValueAtTime(freq * modRatio, now);
        modGain.gain.setValueAtTime(modIndex, now);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + attTime + decTime + relTime + 0.1);
        modulator.stop(now + attTime + decTime + relTime + 0.1);
      } else {
        // SUBTRACTIVE / PULSE / CLUSTER / STRING SYNTHESIS
        const osc = ctx.createOscillator();
        const typeMap: Record<Op1EngineType, OscillatorType> = {
          fm: "sine",
          dna: "sawtooth",
          cluster: "square",
          string: "triangle",
          phase: "sawtooth",
          digital: "square",
          pulse: "square",
        };

        osc.type = typeMap[op1Engine] || "sawtooth";
        osc.frequency.setValueAtTime(freq, now);

        osc.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + attTime + decTime + relTime + 0.1);
      }

      // Muet pour les notes MIDI : jouer une gamme sur l'OP-1 leverait une
      // notification par touche, ce qui masquerait la page entiere.
      if (!silencieux) showToast(`🔊 LECTURE EN DIRECT : ${freq.toFixed(1)} Hz (${op1Engine.toUpperCase()})`);
    } catch (e) {
      log.error("Error playing Web Audio note:", e);
    }
  };

  /**
   * Jouable depuis la machine branchee.
   *
   * Cette page fabrique des patches : c'est precisement celle ou l'on veut
   * essayer un reglage au clavier plutot qu'au pave tactile. La note s'arrete
   * d'elle-meme — `osc.stop` est planifie a la construction — donc il n'y a
   * aucun note-off a gerer.
   */
  useNotesMidi(({ frequence }) => playLiveSynthNote(frequence, true));
  
  // DRAW SYNTH ENGINE / ADSR OSCILLOSCOPE
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // OLED Dark Screen
    ctx.fillStyle = "#0d0f18";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "rgba(0, 237, 149, 0.15)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (targetMachine === "op1") {
      // OP-1 SYNTH WAVEFORM SIMULATION
      ctx.strokeStyle = "#00ed95";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const freq = (knob1Val / 100) * 0.1 + 0.02;
      const harmonic = (knob2Val / 100) * 5;
      const res = (knob3Val / 100) * 20;

      for (let x = 0; x < width; x++) {
        const y =
          height / 2 +
          Math.sin(x * freq) * (height / 3) * Math.cos(x * 0.01 * harmonic) +
          (Math.random() - 0.5) * res;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // EP-133 ADSR ENVELOPE CURVE
      ctx.strokeStyle = "#ff3a5d";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const xA = (attack / 100) * (width * 0.25);
      const xD = xA + (decay / 100) * (width * 0.25);
      const yS = height - (sustain / 100) * (height - 20);
      const xR = xD + (width * 0.25) + (release / 100) * (width * 0.25);

      ctx.moveTo(0, height);
      ctx.lineTo(xA, 10);
      ctx.lineTo(xD, yS);
      ctx.lineTo(xD + width * 0.25, yS);
      ctx.lineTo(xR, height);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 58, 93, 0.2)";
      ctx.lineTo(0, height);
      ctx.fill();
    }
  }, [targetMachine, op1Engine, knob1Val, knob2Val, knob3Val, knob4Val, attack, decay, sustain, release]);

  // Export OP-1 AIF.JSON Patch
  const exportOp1Patch = () => {
    const op1PatchJson = {
      engine: op1Engine,
      name: patchName,
      type: "synth",
      params: [knob1Val * 32, knob2Val * 32, knob3Val * 32, knob4Val * 32],
      envelope: { attack, decay, sustain, release },
      lfo: { type: "element", speed: 64, amount: 50 },
      fx: { type: "delay", params: [40, 60] },
      author: profileName,
      created: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(op1PatchJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patchName.toLowerCase().replace(/\s+/g, "_")}.aif.json`;
    a.click();
    showToast(`💾 PATCH OP-1 EXPORTÉ AVEC SUCCÈS : ${patchName}.aif.json`);
  };

  // Export EP-133 Sound Config
  const exportEp133Sound = () => {
    const epSoundConfig = {
      machine: "EP-133 K.O. II",
      slot: epSlot,
      group: epGroup,
      pad: epPad,
      mode: epPadMode,
      pitch: epPitch,
      loop: epLoop,
      envelope: { attack, release },
      author: profileName,
    };

    const blob = new Blob([JSON.stringify(epSoundConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ep133_slot_${epSlot}_pad_${epGroup}${epPad}.json`;
    a.click();
    showToast(`💾 FICHIER DE RÉGLAGE EP-133 EXPORTÉ (SLOT #${epSlot})`);
  };

  return (
    <main className="sound-patch-creator-page">
      <TopBar activePage="outils" profileName={profileName} />

      {onClose && (
        <button type="button" className="creator-back-btn" onClick={onClose}>
          ← Retour aux Outils
        </button>
      )}

      <div className="patch-creator-wrapper">
        <header className="patch-creator-header">
          <div className="header-top-row">
            <div>
              <h1>🎛️ CRÉATEUR DE PATCHES & SOUND DESIGN</h1>
              <p>Fabriquez, écoutez en direct (Web Audio API) et exportez vos sons OP-1 & EP-133</p>
            </div>

            <button type="button" className="live-preview-audio-btn" onClick={() => playLiveSynthNote(261.63)}>
              ▶ ÉCOUTER LE PATCH EN DIRECT (WEB AUDIO)
            </button>
          </div>

          <div className="machine-target-selector">
            <button
              type="button"
              className={`target-tab-btn ${targetMachine === "op1" ? "active-op1" : ""}`}
              onClick={() => setTargetMachine("op1")}
            >
              🎹 MODÉLISEUR DE PATCH SYNTHÉ OP-1
            </button>
            <button
              type="button"
              className={`target-tab-btn ${targetMachine === "ep133" ? "active-ep133" : ""}`}
              onClick={() => setTargetMachine("ep133")}
            >
              🥁 CONFIGURATEUR DE SAMPLES & PADS EP-133
            </button>
          </div>
        </header>

        {/* INTERACTIVE PIANO KEYBOARD TO TRIGGER LIVE WEB AUDIO SYNTH */}
        <section className="virtual-piano-bar">
          <span className="piano-label">CLAVIER VIRTUEL TEMPS RÉEL (JOUER EN DIRECT) :</span>
          <div className="piano-keys-row">
            {[
              { note: "C4", freq: 261.63, key: "C" },
              { note: "C#4", freq: 277.18, key: "C#", isBlack: true },
              { note: "D4", freq: 293.66, key: "D" },
              { note: "D#4", freq: 311.13, key: "D#", isBlack: true },
              { note: "E4", freq: 329.63, key: "E" },
              { note: "F4", freq: 349.23, key: "F" },
              { note: "F#4", freq: 369.99, key: "F#", isBlack: true },
              { note: "G4", freq: 392.0, key: "G" },
              { note: "G#4", freq: 415.3, key: "G#", isBlack: true },
              { note: "A4", freq: 440.0, key: "A" },
              { note: "A#4", freq: 466.16, key: "A#", isBlack: true },
              { note: "B4", freq: 493.88, key: "B" },
              { note: "C5", freq: 523.25, key: "C5" },
            ].map((k) => (
              <button
                key={k.note}
                type="button"
                className={`piano-key-btn ${k.isBlack ? "black-key" : "white-key"}`}
                onClick={() => playLiveSynthNote(k.freq)}
              >
                <span>{k.key}</span>
              </button>
            ))}
          </div>
        </section>

        {/* OSCILLOSCOPE & VISUALIZER */}
        <section className="synth-visualizer-card">
          <div className="visualizer-header">
            <strong>
              {targetMachine === "op1"
                ? `MOTEUR OP-1 : ${op1Engine.toUpperCase()} ENGINE`
                : `ENVELOPPE & REGLAGES PAD EP-133 (GROUPE ${epGroup} / PAD ${epPad})`}
            </strong>
            <small>Rendu Oscilloscope Temps Réel</small>
          </div>

          <div className="osc-canvas-frame">
            <canvas ref={oscCanvasRef} width={1000} height={110} className="osc-canvas" />
          </div>
        </section>

        {/* MACHINE SPECIFIC EDITOR PANELS */}
        {targetMachine === "op1" ? (
          /* OP-1 SYNTH ENGINE PARAMETERS */
          <section className="editor-panel-card op1-panel">
            <div className="panel-title">
              <h2>🎹 MOTEURS & ENCODEURS OP-1 (ENCODERS 1-4)</h2>
            </div>

            <div className="form-row">
              <label className="input-field">
                <span>NOM DU PATCH :</span>
                <input
                  type="text"
                  value={patchName}
                  onChange={(e) => setPatchName(e.target.value)}
                  placeholder="NOM_DU_PATCH"
                />
              </label>

              <label className="input-field">
                <span>MOTEUR SYNTHÉ :</span>
                <select value={op1Engine} onChange={(e) => setOp1Engine(e.target.value as Op1EngineType)}>
                  <option value="fm">FM (Frequence Modulation)</option>
                  <option value="dna">DNA (Genetic Waveform)</option>
                  <option value="cluster">CLUSTER (Multi-Oscillator)</option>
                  <option value="string">STRING (Physical Modeling)</option>
                  <option value="phase">PHASE (Phase Distortion)</option>
                  <option value="digital">DIGITAL (Classic Digital)</option>
                  <option value="pulse">PULSE (Pulse Width)</option>
                </select>
              </label>
            </div>

            {/* 4 COLOR ENCODERS (BLUE, GREEN, WHITE, ORANGE) */}
            <div className="encoders-grid">
              <div className="encoder-box encoder-blue">
                <span className="knob-label">T1 (BLEU): FRÉQUENCE / CUTOFF</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={knob1Val}
                  onChange={(e) => setKnob1Val(Number(e.target.value))}
                />
                <strong>{knob1Val}</strong>
              </div>

              <div className="encoder-box encoder-green">
                <span className="knob-label">T2 (VERT): RATIO MODULATION / HARMONIQUES</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={knob2Val}
                  onChange={(e) => setKnob2Val(Number(e.target.value))}
                />
                <strong>{knob2Val}</strong>
              </div>

              <div className="encoder-box encoder-white">
                <span className="knob-label">T3 (BLANC): RÉSONANCE / FILTER Q</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={knob3Val}
                  onChange={(e) => setKnob3Val(Number(e.target.value))}
                />
                <strong>{knob3Val}</strong>
              </div>

              <div className="encoder-box encoder-orange">
                <span className="knob-label">T4 (ORANGE): INDEX MODULATION / ENVELOPPE</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={knob4Val}
                  onChange={(e) => setKnob4Val(Number(e.target.value))}
                />
                <strong>{knob4Val}</strong>
              </div>
            </div>

            {/* ADSR ENVELOPE CONTROLS */}
            <div className="adsr-controls-row">
              <label>ATTACK: {attack}% <input type="range" min={0} max={100} value={attack} onChange={(e) => setAttack(Number(e.target.value))} /></label>
              <label>DECAY: {decay}% <input type="range" min={0} max={100} value={decay} onChange={(e) => setDecay(Number(e.target.value))} /></label>
              <label>SUSTAIN: {sustain}% <input type="range" min={0} max={100} value={sustain} onChange={(e) => setSustain(Number(e.target.value))} /></label>
              <label>RELEASE: {release}% <input type="range" min={0} max={100} value={release} onChange={(e) => setRelease(Number(e.target.value))} /></label>
            </div>

            <button type="button" className="export-patch-btn op1-btn" onClick={exportOp1Patch}>
              💾 GÉNÉRER & EXPORTER LE PATCH OP-1 (.AIF.JSON)
            </button>
          </section>
        ) : (
          /* EP-133 SAMPLE & PAD CONFIGURATION PANEL */
          <section className="editor-panel-card ep133-panel">
            <div className="panel-title">
              <h2>🥁 CONFIGURATION PAD & BANQUE EP-133 K.O. II</h2>
            </div>

            <div className="form-row">
              <label className="input-field">
                <span>NUMÉRO DE SLOT (#001 - #999) :</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={epSlot}
                  onChange={(e) => setEpSlot(Number(e.target.value))}
                />
              </label>

              <label className="input-field">
                <span>GROUPE :</span>
                <select value={epGroup} onChange={(e) => setEpGroup(e.target.value as "A" | "B" | "C" | "D")}>
                  <option value="A">GROUPE A (DRUMS / KICKS)</option>
                  <option value="B">GROUPE B (BASS / PERC)</option>
                  <option value="C">GROUPE C (MELODIC / SYNTH)</option>
                  <option value="D">GROUPE D (FX / SAMPLES)</option>
                </select>
              </label>

              <label className="input-field">
                <span>PAD (1 à 12) :</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={epPad}
                  onChange={(e) => setEpPad(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="form-row">
              <label className="input-field">
                <span>MODE DE JEU PAD :</span>
                <select value={epPadMode} onChange={(e) => setEpPadMode(e.target.value as any)}>
                  <option value="KEYS">KEYS (Gamme chromatique)</option>
                  <option value="ONE-SHOT">ONE-SHOT (Trigger unique)</option>
                  <option value="LEGATO">LEGATO (Enchaînement fluide)</option>
                </select>
              </label>

              <label className="input-field">
                <span>PITCH / TRANSPOSE (SEMITONES) :</span>
                <input
                  type="number"
                  min={-24}
                  max={24}
                  value={epPitch}
                  onChange={(e) => setEpPitch(Number(e.target.value))}
                />
              </label>

              <label className="input-checkbox">
                <input
                  type="checkbox"
                  checked={epLoop}
                  onChange={(e) => setEpLoop(e.target.checked)}
                />
                <span>BOUCLAGE (LOOP MODE)</span>
              </label>
            </div>

            <button type="button" className="export-patch-btn ep133-btn" onClick={exportEp133Sound}>
              💾 GÉNÉRER & EXPORTER FICHIER EP-133 (.JSON)
            </button>
          </section>
        )}
      </div>

      {toastMessage && (
        <div className="patch-toast-overlay">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
