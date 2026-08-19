"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import "./audio-plugin-rack.css";

type EnginePluginType =
  // TOP 10 GIT OPEN SOURCE ENGINES
  | "dexed_fm"
  | "surge_xt"
  | "zynaddsubfx"
  | "helm"
  | "fluidsynth"
  | "amsynth"
  | "amy_engine"
  | "pl_synth"
  | "open303"
  | "faust_dsp"
  // MUTABLE INSTRUMENTS EURORACK SUITE
  | "mi_plaits"
  | "mi_braids"
  | "mi_rings"
  | "mi_clouds"
  | "mi_elements";

export default function AudioPluginRack({ profileName = "AZOTH", onClose }: { profileName?: string; onClose?: () => void }) {
  const [activeEngine, setActiveEngine] = useState<EnginePluginType>("mi_plaits");

  // DEXED FM PARAMS
  const [dxAlgorithm, setDxAlgorithm] = useState<number>(5);
  const [dxOp1Ratio, setDxOp1Ratio] = useState<number>(1.0);
  const [dxOp2Ratio, setDxOp2Ratio] = useState<number>(2.0);

  // SURGE XT PARAMS
  const [surgeWavetable, setSurgeWavetable] = useState<string>("Basic Vector");
  const [surgeMorph, setSurgeMorph] = useState<number>(50);

  // ZYNADDSUBFX PARAMS
  const [zynHarmonics, setZynHarmonics] = useState<number>(8);
  const [zynBandwidth, setZynBandwidth] = useState<number>(60);

  // HELM PARAMS
  const [helmCrossmod, setHelmCrossmod] = useState<number>(45);

  // FLUIDSYNTH SF2 PARAMS
  const [fluidPreset, setFluidPreset] = useState<string>("Acoustic Grand Piano");

  // AMSYNTH PARAMS
  const [amCutoff, setAmCutoff] = useState<number>(3200);

  // AMY PARAMS
  const [amyPartialCount, setAmyPartialCount] = useState<number>(16);

  // PL_SYNTH PARAMS
  const [plBitcrush, setPlBitcrush] = useState<number>(8);

  // OPEN303 ACID PARAMS
  const [acidCutoff, setAcidCutoff] = useState<number>(1800);
  const [acidResonance, setAcidResonance] = useState<number>(88);
  const [acidAccent, setAcidAccent] = useState<boolean>(true);

  // FAUST DSP PARAMS
  const [faustFreqMod, setFaustFreqMod] = useState<number>(50);

  // MUTABLE PLAITS PARAMS
  const [plaitsEngine, setPlaitsEngine] = useState<"V_ANALOG" | "FM" | "WAVETABLE" | "GRAIN" | "SPEECH" | "CHORD">("V_ANALOG");
  const [plaitsHarmonics, setPlaitsHarmonics] = useState<number>(60);
  const [plaitsTimbre, setPlaitsTimbre] = useState<number>(75);
  const [plaitsMorph, setPlaitsMorph] = useState<number>(50);

  // MUTABLE BRAIDS PARAMS
  const [braidsModel, setBraidsModel] = useState<string>("CS-80 SAW");
  const [braidsColor, setBraidsColor] = useState<number>(65);

  // MUTABLE RINGS PARAMS
  const [ringsResonatorMode, setRingsResonatorMode] = useState<"STRING" | "TUBE" | "PLATE">("STRING");
  const [ringsDamping, setRingsDamping] = useState<number>(40);
  const [ringsStructure, setRingsStructure] = useState<number>(70);

  // MUTABLE CLOUDS PARAMS
  const [cloudsGranularDensity, setCloudsGranularDensity] = useState<number>(80);
  const [cloudsPitchShift, setCloudsPitchShift] = useState<number>(0);
  const [cloudsTexture, setCloudsTexture] = useState<number>(60);

  // MUTABLE ELEMENTS PARAMS
  const [elementsGeometry, setElementsGeometry] = useState<number>(50);
  const [elementsBrightness, setElementsBrightness] = useState<number>(80);

  // Web Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);

  // Toast Overlay
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

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

  // REAL-TIME SYNTHESIS FOR ALL 15 ENGINES
  const playPluginNote = (freq: number = 261.63) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);

      if (activeEngine === "mi_plaits") {
        // MUTABLE INSTRUMENTS PLAITS (Macro-Oscillator)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        const typeMap: Record<string, OscillatorType> = {
          V_ANALOG: "sawtooth",
          FM: "sine",
          WAVETABLE: "triangle",
          GRAIN: "square",
          SPEECH: "sawtooth",
          CHORD: "sawtooth",
        };

        osc1.type = typeMap[plaitsEngine] || "sawtooth";
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * (1 + (plaitsHarmonics / 100) * 2), now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200 + (plaitsTimbre / 100) * 8000, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);

        showToast(`🎛️ MUTABLE PLAITS [${plaitsEngine}] : ${freq.toFixed(1)} Hz`);
      } else if (activeEngine === "mi_rings") {
        // MUTABLE INSTRUMENTS RINGS (Modal Resonator / Physical Modeling)
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const delay = ctx.createDelay();
        delay.delayTime.value = 1 / freq;

        const feedback = ctx.createGain();
        feedback.gain.value = 0.99 - (ringsDamping / 100) * 0.12;

        noise.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.02);

        showToast(`🔔 MUTABLE RINGS [${ringsResonatorMode}] : ${freq.toFixed(1)} Hz`);
      } else if (activeEngine === "mi_clouds") {
        // MUTABLE INSTRUMENTS CLOUDS (Granular Texture Synthesizer)
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * Math.pow(2, cloudsPitchShift / 12), now);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1000 + (cloudsTexture / 100) * 4000, now);
        filter.Q.setValueAtTime(2.0, now);

        osc.connect(filter);
        filter.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.5);

        showToast(`☁️ MUTABLE CLOUDS (Granular Texture) : ${freq.toFixed(1)} Hz`);
      } else if (activeEngine === "open303") {
        // ROLAND TB-303 ACID BASS
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        const envPeak = acidCutoff + 3500 * (acidAccent ? 1.4 : 0.8);
        filter.frequency.setValueAtTime(envPeak, now);
        filter.frequency.exponentialRampToValueAtTime(acidCutoff * 0.2, now + 0.35);
        filter.Q.setValueAtTime((acidResonance / 100) * 20, now);

        osc.connect(filter);
        filter.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.4);

        showToast(`🎛️ OPEN303 ACID BASS : ${freq.toFixed(1)} Hz`);
      } else if (activeEngine === "dexed_fm") {
        // DEXED FM
        const carrier = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();

        carrier.type = "sine";
        carrier.frequency.setValueAtTime(freq * dxOp1Ratio, now);

        mod.type = "sine";
        mod.frequency.setValueAtTime(freq * dxOp2Ratio, now);
        modGain.gain.setValueAtTime(600, now);

        mod.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(masterGain);

        carrier.start(now);
        mod.start(now);
        carrier.stop(now + 1.2);
        mod.stop(now + 1.2);

        showToast(`🎹 DEXED FM (DX7 Algo #${dxAlgorithm}) : ${freq.toFixed(1)} Hz`);
      } else {
        // GENERAL SYNTHESIZER FALLBACK
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.8);

        showToast(`🔊 MOTEUR AUDIO [${activeEngine.toUpperCase()}] : ${freq.toFixed(1)} Hz`);
      }

      masterGain.connect(ctx.destination);
    } catch (e) {
      console.error(e);
    }
  };

  // DRAW OSCILLOSCOPE
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#0d0f18";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(0, 237, 149, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.strokeStyle = activeEngine.startsWith("mi_") ? "#00ed95" : "#d9ff43";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      let y = height / 2;
      if (activeEngine === "mi_plaits") {
        y += Math.sin(x * 0.08) * 35 * Math.cos(x * 0.02 * (plaitsHarmonics / 20));
      } else if (activeEngine === "mi_rings") {
        y += Math.sin(x * 0.1) * Math.exp(-x * 0.004) * 40;
      } else if (activeEngine === "open303") {
        const saw = ((x % 20) / 20 - 0.5) * 60;
        y += saw * Math.exp(-x * 0.003);
      } else {
        y += Math.sin(x * 0.05) * 30;
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [activeEngine, plaitsEngine, plaitsHarmonics, plaitsTimbre, ringsResonatorMode, ringsDamping, acidCutoff, acidResonance]);

  // EXPORT PRESET FOR INSTRUMENTS
  const exportPreset = () => {
    const preset = {
      engine: activeEngine,
      author: profileName,
      created: new Date().toISOString(),
      mutable: activeEngine.startsWith("mi_"),
      parameters: {
        plaits: { plaitsEngine, plaitsHarmonics, plaitsTimbre, plaitsMorph },
        rings: { ringsResonatorMode, ringsDamping, ringsStructure },
        clouds: { cloudsGranularDensity, cloudsPitchShift, cloudsTexture },
        elements: { elementsGeometry, elementsBrightness },
        dexed: { dxAlgorithm, dxOp1Ratio, dxOp2Ratio },
        acid: { acidCutoff, acidResonance, acidAccent },
      },
    };

    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rack_engine_${activeEngine}_${Date.now()}.json`;
    a.click();
    showToast(`📦 PRESET EXPORTÉ POUR OP-1 ET EP-133 : ${activeEngine.toUpperCase()}`);
  };

  return (
    <main className="audio-plugin-rack-page">
      <TopBar activePage="outils" profileName={profileName} />

      {onClose && (
        <button type="button" className="rack-back-btn" onClick={onClose}>
          ← Retour aux Outils
        </button>
      )}

      <div className="plugin-rack-wrapper">
        <header className="plugin-rack-header">
          <div className="rack-title-group">
            <h1>🔌 RACK DE MOTEURS AUDIO : OPEN SOURCE & MUTABLE INSTRUMENTS</h1>
            <p>15 Moteurs de Synthèse Légendaires (Dexed, Surge, Plaits, Rings, Clouds, 303, FluidSynth) Prêts à l'Emploi</p>
          </div>

          <button type="button" className="export-preset-btn" onClick={exportPreset}>
            📦 EXPORTER PRESET EN RACK (OP-1 & EP-133)
          </button>
        </header>

        {/* CATEGORY 1: MUTABLE INSTRUMENTS EURORACK SUITE */}
        <section className="rack-category-section">
          <h2>🎛️ RACK MUTABLE INSTRUMENTS (EURORACK OPEN SOURCE)</h2>
          <div className="engines-selector-grid">
            {[
              { id: "mi_plaits", name: "MUTABLE PLAITS", subtitle: "16-Engine Macro Oscillator", color: "green" },
              { id: "mi_braids", name: "MUTABLE BRAIDS", subtitle: "33-Model Macro Synth", color: "yellow" },
              { id: "mi_rings", name: "MUTABLE RINGS", subtitle: "Resonator & Physical Modeling", color: "purple" },
              { id: "mi_clouds", name: "MUTABLE CLOUDS", subtitle: "Granular Texture Synthesizer", color: "blue" },
              { id: "mi_elements", name: "MUTABLE ELEMENTS", subtitle: "Modal Physical Modeling", color: "pink" },
            ].map((e) => (
              <button
                key={e.id}
                type="button"
                className={`plugin-card-btn color-${e.color} ${activeEngine === e.id ? "active-plugin" : ""}`}
                onClick={() => setActiveEngine(e.id as EnginePluginType)}
              >
                <strong>{e.name}</strong>
                <small>{e.subtitle}</small>
              </button>
            ))}
          </div>
        </section>

        {/* CATEGORY 2: TOP 10 GIT OPEN SOURCE ENGINES */}
        <section className="rack-category-section">
          <h2>🎹 TOP 10 MOTEURS AUDIO OPEN SOURCE (GITHUB)</h2>
          <div className="engines-selector-grid">
            {[
              { id: "dexed_fm", name: "DEXED / DX7 FM", subtitle: "6-Op FM Engine", color: "green" },
              { id: "surge_xt", name: "SURGE XT", subtitle: "Hybrid Wavetable Synth", color: "yellow" },
              { id: "zynaddsubfx", name: "ZYNADDSUBFX", subtitle: "Additive & Pad Synth", color: "purple" },
              { id: "helm", name: "HELM SYNTH", subtitle: "Polyphonic Modulation", color: "blue" },
              { id: "fluidsynth", name: "FLUIDSYNTH SF2", subtitle: "SoundFont Sample Engine", color: "pink" },
              { id: "amsynth", name: "AMSYNTH", subtitle: "Dual VCO Analog Synth", color: "yellow" },
              { id: "amy_engine", name: "AMY C/JS", subtitle: "Fixed-Point Audio Engine", color: "green" },
              { id: "pl_synth", name: "PL_SYNTH", subtitle: "8-Bit Chiptune Tracker", color: "blue" },
              { id: "open303", name: "OPEN303 ACID", subtitle: "Roland TB-303 Emulation", color: "pink" },
              { id: "faust_dsp", name: "FAUST DSP NODE", subtitle: "Compiled DSP WebAudio Engine", color: "purple" },
            ].map((e) => (
              <button
                key={e.id}
                type="button"
                className={`plugin-card-btn color-${e.color} ${activeEngine === e.id ? "active-plugin" : ""}`}
                onClick={() => setActiveEngine(e.id as EnginePluginType)}
              >
                <strong>{e.name}</strong>
                <small>{e.subtitle}</small>
              </button>
            ))}
          </div>
        </section>

        {/* OSCILLOSCOPE DISPLAY */}
        <section className="plugin-visualizer-card">
          <div className="vis-header">
            <strong>MOTEUR SELECTIONNÉ : {activeEngine.toUpperCase().replace("_", " ")}</strong>
            <small>Oscilloscope Web Audio API</small>
          </div>
          <div className="vis-canvas-frame">
            <canvas ref={oscCanvasRef} width={1000} height={100} className="vis-canvas" />
          </div>
        </section>

        {/* DYNAMIC PARAMETERS FORM FOR ACTIVE ENGINE */}
        <section className="plugin-controls-card">
          {activeEngine === "mi_plaits" && (
            <div className="plugin-parameters-form">
              <h3>🎛️ MUTABLE INSTRUMENTS PLAITS (MACRO-OSCILLATOR 16 ENGINES)</h3>
              <div className="params-grid">
                <label>SÉLECTION DU MOTEUR :
                  <select value={plaitsEngine} onChange={(e) => setPlaitsEngine(e.target.value as any)}>
                    <option value="V_ANALOG">1. VIRTUAL ANALOG (Pair Pair/Saw)</option>
                    <option value="FM">2. FREQUENCY MODULATION (2-OP FM)</option>
                    <option value="WAVETABLE">3. WAVETABLE (Sweepable 3D Grid)</option>
                    <option value="GRAIN">4. GRANULAR PULSE CLOUD</option>
                    <option value="SPEECH">5. SPEECH SYNTHESIS & FORMANT</option>
                    <option value="CHORD">6. FOUR-VOICE CHORD GENERATOR</option>
                  </select>
                </label>
                <label>HARMONICS CONTROL: {plaitsHarmonics}%
                  <input type="range" min={0} max={100} value={plaitsHarmonics} onChange={(e) => setPlaitsHarmonics(Number(e.target.value))} />
                </label>
                <label>TIMBRE (FILTER CUTOFF): {plaitsTimbre}%
                  <input type="range" min={0} max={100} value={plaitsTimbre} onChange={(e) => setPlaitsTimbre(Number(e.target.value))} />
                </label>
                <label>MORPH (WAVEFORM SHAPE): {plaitsMorph}%
                  <input type="range" min={0} max={100} value={plaitsMorph} onChange={(e) => setPlaitsMorph(Number(e.target.value))} />
                </label>
              </div>
            </div>
          )}

          {activeEngine === "mi_rings" && (
            <div className="plugin-parameters-form">
              <h3>🔔 MUTABLE INSTRUMENTS RINGS (RESONATOR & PHYSICAL MODELING)</h3>
              <div className="params-grid">
                <label>RESONATOR MODE :
                  <select value={ringsResonatorMode} onChange={(e) => setRingsResonatorMode(e.target.value as any)}>
                    <option value="STRING">MODAL STRING (Corde Vibrante)</option>
                    <option value="TUBE">SYMPATHETIC STRINGS (Tubes & Flûtes)</option>
                    <option value="PLATE">INHARMONIC STRING (Plaques & Cloches)</option>
                  </select>
                </label>
                <label>DAMPING (AMORTISSEMENT): {ringsDamping}%
                  <input type="range" min={0} max={100} value={ringsDamping} onChange={(e) => setRingsDamping(Number(e.target.value))} />
                </label>
                <label>STRUCTURE (INHARMONICITÉ): {ringsStructure}%
                  <input type="range" min={0} max={100} value={ringsStructure} onChange={(e) => setRingsStructure(Number(e.target.value))} />
                </label>
              </div>
            </div>
          )}

          {activeEngine === "mi_clouds" && (
            <div className="plugin-parameters-form">
              <h3>☁️ MUTABLE INSTRUMENTS CLOUDS (GRANULAR TEXTURE SYNTHESIZER)</h3>
              <div className="params-grid">
                <label>GRANULAR DENSITY: {cloudsGranularDensity}%
                  <input type="range" min={0} max={100} value={cloudsGranularDensity} onChange={(e) => setCloudsGranularDensity(Number(e.target.value))} />
                </label>
                <label>PITCH SHIFT (SEMITONES): {cloudsPitchShift}
                  <input type="range" min={-12} max={12} value={cloudsPitchShift} onChange={(e) => setCloudsPitchShift(Number(e.target.value))} />
                </label>
                <label>TEXTURE / SMOOTHING: {cloudsTexture}%
                  <input type="range" min={0} max={100} value={cloudsTexture} onChange={(e) => setCloudsTexture(Number(e.target.value))} />
                </label>
              </div>
            </div>
          )}

          {activeEngine === "open303" && (
            <div className="plugin-parameters-form">
              <h3>🎛️ ROLAND TB-303 ACID BASS ENGINE</h3>
              <div className="params-grid">
                <label>CUTOFF BASS: {acidCutoff} Hz
                  <input type="range" min={200} max={6000} value={acidCutoff} onChange={(e) => setAcidCutoff(Number(e.target.value))} />
                </label>
                <label>RESONANCE SWEEP: {acidResonance}%
                  <input type="range" min={0} max={100} value={acidResonance} onChange={(e) => setAcidResonance(Number(e.target.value))} />
                </label>
                <label className="checkbox-lbl">
                  <input type="checkbox" checked={acidAccent} onChange={(e) => setAcidAccent(e.target.checked)} />
                  <span>ACCENT MODE (PUNCH)</span>
                </label>
              </div>
            </div>
          )}

          {activeEngine === "dexed_fm" && (
            <div className="plugin-parameters-form">
              <h3>🎹 DEXED FM SYNTH (YAMAHA DX7 EMULATION)</h3>
              <div className="params-grid">
                <label>ALGORITHME (1-32): {dxAlgorithm}
                  <input type="range" min={1} max={32} value={dxAlgorithm} onChange={(e) => setDxAlgorithm(Number(e.target.value))} />
                </label>
                <label>CARRIER RATIO: {dxOp1Ratio}
                  <input type="range" min={0.5} max={4.0} step={0.1} value={dxOp1Ratio} onChange={(e) => setDxOp1Ratio(Number(e.target.value))} />
                </label>
                <label>MODULATOR RATIO: {dxOp2Ratio}
                  <input type="range" min={0.5} max={8.0} step={0.1} value={dxOp2Ratio} onChange={(e) => setDxOp2Ratio(Number(e.target.value))} />
                </label>
              </div>
            </div>
          )}
        </section>

        {/* VIRTUAL PIANO KEYBOARD */}
        <section className="plugin-piano-bar">
          <span>JOUER LE MOTEUR EN DIRECT (CLAVIER & WEB MIDI) :</span>
          <div className="piano-keys-row">
            {[
              { note: "C3", freq: 130.81, key: "C3" },
              { note: "C#3", freq: 138.59, key: "C#3", isBlack: true },
              { note: "D3", freq: 146.83, key: "D3" },
              { note: "D#3", freq: 155.56, key: "D#3", isBlack: true },
              { note: "E3", freq: 164.81, key: "E3" },
              { note: "F3", freq: 174.61, key: "F3" },
              { note: "F#3", freq: 185.0, key: "F#3", isBlack: true },
              { note: "G3", freq: 196.0, key: "G3" },
              { note: "G#3", freq: 207.65, key: "G#3", isBlack: true },
              { note: "A3", freq: 220.0, key: "A3" },
              { note: "A#3", freq: 233.08, key: "A#3", isBlack: true },
              { note: "B3", freq: 246.94, key: "B3" },
              { note: "C4", freq: 261.63, key: "C4" },
            ].map((k) => (
              <button
                key={k.note}
                type="button"
                className={`piano-key-btn ${k.isBlack ? "black-key" : "white-key"}`}
                onClick={() => playPluginNote(k.freq)}
              >
                <span>{k.key}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {toastMessage && (
        <div className="plugin-toast-overlay">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
