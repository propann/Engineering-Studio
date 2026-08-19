import { useState, useMemo } from 'react';
import type { EditorGroup } from '../../core/project/exporters';

export interface PatchPreset {
  id: string;
  name: string;
  engine: string;
  engineName: string;
  category: 'kick' | 'snare' | 'clap' | 'hat' | 'bass' | 'lead' | 'synth' | 'fx';
  cutoff: number; // 20 - 20000 Hz
  resonance: number; // 0 - 20
  attack: number; // 0.001 - 2.0 s
  decay: number; // 0.01 - 3.0 s
  tune: number; // -24 to +24 semitones
  morph: number; // 0 - 100%
  waveformType: 'fm' | 'ladder' | 'acid' | 'nes' | 'pluck' | 'wavetable' | 'drum';
  playMode?: 'KEYS' | 'ONE';
}

export const SYNTH_ENGINES = [
  {
    id: 'dexed-fm',
    name: 'Dexed FM (DX7)',
    icon: '🎹',
    description: 'Synthèse FM 6 opérateurs style Yamaha DX7 & Digitone',
    presets: [
      { id: 'dx7-epiano1', name: 'E.PIANO 1 (DX7)', engine: 'dexed-fm', engineName: 'Dexed FM', category: 'synth' as const, cutoff: 8500, resonance: 2.5, attack: 0.002, decay: 1.2, tune: 0, morph: 45, waveformType: 'fm' as const, playMode: 'KEYS' as const },
      { id: 'dx7-latelybass', name: 'LATELY BASS (FM)', engine: 'dexed-fm', engineName: 'Dexed FM', category: 'bass' as const, cutoff: 3200, resonance: 5.0, attack: 0.001, decay: 0.4, tune: -12, morph: 80, waveformType: 'fm' as const, playMode: 'KEYS' as const },
      { id: 'dx7-glassbell', name: 'GLASS BELL', engine: 'dexed-fm', engineName: 'Dexed FM', category: 'fx' as const, cutoff: 16000, resonance: 1.0, attack: 0.001, decay: 2.2, tune: 12, morph: 20, waveformType: 'fm' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'moog-24db',
    name: 'Moog 24dB Ladder',
    icon: '🎛️',
    description: 'Filtre en échelle 24dB Moog, basses analogiques riches',
    presets: [
      { id: 'moog-fatlead', name: 'MINIMOOG FAT LEAD', engine: 'moog-24db', engineName: 'Moog 24dB', category: 'lead' as const, cutoff: 4500, resonance: 8.5, attack: 0.005, decay: 0.8, tune: 0, morph: 60, waveformType: 'ladder' as const, playMode: 'KEYS' as const },
      { id: 'moog-sub24', name: 'SUB BASS 24dB', engine: 'moog-24db', engineName: 'Moog 24dB', category: 'bass' as const, cutoff: 800, resonance: 12.0, attack: 0.001, decay: 0.5, tune: -24, morph: 90, waveformType: 'ladder' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'tb-303-acid',
    name: 'TB-303 Acid',
    icon: '⚡',
    description: 'Emulateur Roland TB-303 avec filtre résonant & slide',
    presets: [
      { id: 'acid-303-squelch', name: 'ACID SQUELCH 303', engine: 'tb-303-acid', engineName: 'TB-303 Acid', category: 'bass' as const, cutoff: 2200, resonance: 18.0, attack: 0.001, decay: 0.35, tune: -12, morph: 75, waveformType: 'acid' as const, playMode: 'KEYS' as const },
      { id: 'acid-303-accent', name: 'ACCENTED SAW 303', engine: 'tb-303-acid', engineName: 'TB-303 Acid', category: 'lead' as const, cutoff: 6500, resonance: 15.0, attack: 0.001, decay: 0.25, tune: 0, morph: 85, waveformType: 'acid' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'nes-8bit',
    name: 'NES 8-Bit Chiptune',
    icon: '👾',
    description: 'Puces sonores 8-Bit NES / Gameboy (Pulse, Triangle, Noise)',
    presets: [
      { id: 'nes-mario-pulse', name: 'MARIO PULSE 50%', engine: 'nes-8bit', engineName: 'NES 8-Bit', category: 'lead' as const, cutoff: 18000, resonance: 0, attack: 0.001, decay: 0.2, tune: 12, morph: 50, waveformType: 'nes' as const, playMode: 'KEYS' as const },
      { id: 'nes-gb-arp', name: 'GAMEBOY FAST ARP', engine: 'nes-8bit', engineName: 'NES 8-Bit', category: 'synth' as const, cutoff: 20000, resonance: 0, attack: 0.001, decay: 0.15, tune: 0, morph: 25, waveformType: 'nes' as const, playMode: 'KEYS' as const },
      { id: 'nes-tri-bass', name: 'NES TRIANGLE BASS', engine: 'nes-8bit', engineName: 'NES 8-Bit', category: 'bass' as const, cutoff: 1200, resonance: 0, attack: 0.001, decay: 0.6, tune: -12, morph: 10, waveformType: 'nes' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'karplus-strong',
    name: 'Karplus-Strong Pluck',
    icon: '🎻',
    description: 'Modélisation physique d\'instruments à cordes pincées',
    presets: [
      { id: 'pluck-harp', name: 'ACOUSTIC HARP', engine: 'karplus-strong', engineName: 'Karplus-Strong', category: 'synth' as const, cutoff: 12000, resonance: 4.0, attack: 0.001, decay: 1.8, tune: 0, morph: 30, waveformType: 'pluck' as const, playMode: 'KEYS' as const },
      { id: 'pluck-guitar', name: 'STEEL GUITAR PLUCK', engine: 'karplus-strong', engineName: 'Karplus-Strong', category: 'lead' as const, cutoff: 9500, resonance: 6.0, attack: 0.001, decay: 1.1, tune: -12, morph: 50, waveformType: 'pluck' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'wavetable-morph',
    name: 'Wavetable Morph',
    icon: '🌊',
    description: 'Tables d\'ondes évolutives & textures métalliques',
    presets: [
      { id: 'wt-ambient-pad', name: 'EVOLVING AMBIENT', engine: 'wavetable-morph', engineName: 'Wavetable', category: 'synth' as const, cutoff: 5500, resonance: 3.0, attack: 0.4, decay: 2.5, tune: 0, morph: 70, waveformType: 'wavetable' as const, playMode: 'KEYS' as const },
      { id: 'wt-digi-bell', name: 'DIGITONE METALLIC', engine: 'wavetable-morph', engineName: 'Wavetable', category: 'fx' as const, cutoff: 14000, resonance: 7.0, attack: 0.001, decay: 1.5, tune: 12, morph: 90, waveformType: 'wavetable' as const, playMode: 'KEYS' as const },
    ]
  },
  {
    id: 'ep133-punch-drums',
    name: 'EP-133 Punch Drums',
    icon: '🥁',
    description: 'Kits de batterie percussion percutants K.O. II',
    presets: [
      { id: 'ep-punch-kick', name: 'EP-133 PUNCH KICK', engine: 'ep133-punch-drums', engineName: 'EP Punch', category: 'kick' as const, cutoff: 2500, resonance: 2.0, attack: 0.001, decay: 0.28, tune: -12, morph: 95, waveformType: 'drum' as const, playMode: 'ONE' as const },
      { id: 'ep-punch-snare', name: 'EP-133 ANALOG SNARE', engine: 'ep133-punch-drums', engineName: 'EP Punch', category: 'snare' as const, cutoff: 7500, resonance: 1.5, attack: 0.001, decay: 0.22, tune: 0, morph: 60, waveformType: 'drum' as const, playMode: 'ONE' as const },
      { id: 'ep-punch-clap', name: 'EP-133 RIM CLAP', engine: 'ep133-punch-drums', engineName: 'EP Punch', category: 'clap' as const, cutoff: 9000, resonance: 1.0, attack: 0.001, decay: 0.18, tune: 0, morph: 40, waveformType: 'drum' as const, playMode: 'ONE' as const },
    ]
  }
];

interface SynthEngineDrawerProps {
  activeGroup: EditorGroup;
  selectedPad: number;
  padName: string;
  onAssignPatchToPad: (group: EditorGroup, padIndex: number, patch: PatchPreset) => void;
  onPreviewPatchSound: (patch: PatchPreset) => void;
}

export function SynthEngineDrawer(props: SynthEngineDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEngineId, setSelectedEngineId] = useState(SYNTH_ENGINES[0].id);
  const [selectedPresetId, setSelectedPresetId] = useState(SYNTH_ENGINES[0].presets[0].id);
  
  // Patch Parameters state
  const currentEngine = useMemo(() => SYNTH_ENGINES.find((e) => e.id === selectedEngineId) || SYNTH_ENGINES[0], [selectedEngineId]);
  const defaultPreset = useMemo(() => currentEngine.presets.find((p) => p.id === selectedPresetId) || currentEngine.presets[0], [currentEngine, selectedPresetId]);
  
  const [playMode, setPlayMode] = useState<'KEYS' | 'ONE'>(defaultPreset.playMode || 'KEYS');
  const [cutoff, setCutoff] = useState(defaultPreset.cutoff);
  const [resonance, setResonance] = useState(defaultPreset.resonance);
  const [attack, setAttack] = useState(defaultPreset.attack);
  const [decay, setDecay] = useState(defaultPreset.decay);
  const [tune, setTune] = useState(defaultPreset.tune);
  const [morph, setMorph] = useState(defaultPreset.morph);

  const activePreset: PatchPreset = useMemo(() => ({
    ...defaultPreset,
    playMode,
    cutoff,
    resonance,
    attack,
    decay,
    tune,
    morph
  }), [defaultPreset, playMode, cutoff, resonance, attack, decay, tune, morph]);

  // Select a preset and sync parameter controls
  const handleSelectPreset = (preset: (typeof defaultPreset)) => {
    setSelectedPresetId(preset.id);
    setPlayMode(preset.playMode || 'KEYS');
    setCutoff(preset.cutoff);
    setResonance(preset.resonance);
    setAttack(preset.attack);
    setDecay(preset.decay);
    setTune(preset.tune);
    setMorph(preset.morph);
  };

  // Generate SVG Waveform points based on engine type and parameters ("onde du son")
  const waveformSvgPoints = useMemo(() => {
    const width = 180;
    const height = 44;
    const midY = height / 2;
    const points: string[] = [];
    const steps = 60;
    const freqFactor = (24 + tune) / 12;
    const filterFactor = cutoff / 5000;
    const resFactor = 1 + resonance / 4;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const t = (i / steps) * Math.PI * 6 * freqFactor;
      let y = midY;

      switch (activePreset.waveformType) {
        case 'fm': {
          const mod = Math.sin(t * (1 + morph / 20)) * (morph / 100) * 12;
          y = midY - Math.sin(t + mod) * 16;
          break;
        }
        case 'ladder': {
          const raw = Math.sin(t) + (Math.sin(t * 3) / 3) + (Math.sin(t * 5) / 5);
          const filtered = raw * Math.min(1.5, filterFactor);
          y = midY - Math.max(-18, Math.min(18, filtered * 12 * resFactor));
          break;
        }
        case 'acid': {
          const saw = (t % (Math.PI * 2)) / Math.PI - 1;
          const resonancePeak = Math.sin(t * 4) * (resonance / 20) * 10;
          y = midY - (saw * 12 + resonancePeak);
          break;
        }
        case 'nes': {
          const pulse = (t % (Math.PI * 2)) < (Math.PI * (morph / 50)) ? 1 : -1;
          y = midY - pulse * 14;
          break;
        }
        case 'pluck': {
          const damp = Math.exp(-(i / steps) * (3 / (decay + 0.1)));
          y = midY - Math.sin(t) * 16 * damp;
          break;
        }
        case 'wavetable': {
          const morphWave = Math.sin(t) * (1 - morph / 100) + ((t % (Math.PI * 2)) / Math.PI - 1) * (morph / 100);
          y = midY - morphWave * 15;
          break;
        }
        case 'drum': {
          const pitchEnv = Math.exp(-(i / steps) * 8);
          y = midY - Math.sin(t * (1 + pitchEnv * 3)) * 16 * Math.exp(-(i / steps) * 4);
          break;
        }
      }
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [activePreset.waveformType, tune, cutoff, resonance, morph, decay]);

  // Drag start handler for Drag & Drop onto Machine Pads
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, preset: PatchPreset) => {
    event.dataTransfer.setData('application/ep133-patch', JSON.stringify({
      ...preset,
      playMode
    }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={`synth-drawer-container ${isOpen ? 'open' : 'closed'}`}>
      {/* Toggle Bar at the bottom of the Editor */}
      <button
        className="synth-drawer-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Ouvrir le panneau des moteurs de son et glisser-déposer de patches"
      >
        <span>🎛️ MOTEURS AUDIO & PATCHES (DEXED, MOOG, 303, NES, WAVETABLE...)</span>
        <span className="synth-drawer-badge">{currentEngine.name} · {activePreset.name} [{playMode}]</span>
        <b>{isOpen ? '▼ REPLIER' : '▲ DÉROULER LE RACK'}</b>
      </button>

      {/* Expanded Drawer Panel */}
      {isOpen && (
        <div className="synth-drawer-panel">
          {/* Column 1: Choice of Sound Engines */}
          <div className="synth-engines-col">
            <small>1. CHOIX DU MOTEUR AUDIO</small>
            <div className="synth-engine-list">
              {SYNTH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  className={`synth-engine-btn ${engine.id === selectedEngineId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEngineId(engine.id);
                    handleSelectPreset(engine.presets[0]);
                  }}
                >
                  <i>{engine.icon}</i>
                  <div>
                    <b>{engine.name}</b>
                    <small>{engine.description}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Presets & Drag-and-Drop Patch Cards */}
          <div className="synth-presets-col">
            <small>2. PATCHES PRÊTS À GLISSER (DRAG & DROP)</small>
            <div className="synth-presets-list">
              {currentEngine.presets.map((preset) => (
                <div
                  key={preset.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, { ...preset, playMode })}
                  className={`synth-preset-card ${preset.id === selectedPresetId ? 'selected' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                  title="Glissez ce patch sur n'importe quel Pad de la machine !"
                >
                  <span className="drag-handle">⠿ GLISSER ({playMode === 'KEYS' ? '🎹 NOTE' : '🥁 DRUM'})</span>
                  <b>{preset.name}</b>
                  <small>CATEGORIE: {preset.category.toUpperCase()}</small>
                  <button
                    className="assign-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onAssignPatchToPad(props.activeGroup, props.selectedPad, { ...preset, playMode });
                    }}
                  >
                    ➜ PAD {props.activeGroup}{props.selectedPad + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Waveform Visualizer & Parameter Controls */}
          <div className="synth-editor-col">
            <small>3. ONDE DU SON & SORTIE (NOTE / BATTERIE)</small>

            {/* Mode Note vs Batterie option */}
            <div className="synth-mode-toggle">
              <span>DESTINATION DU SON :</span>
              <div className="synth-mode-buttons">
                <button
                  className={playMode === 'KEYS' ? 'active' : ''}
                  onClick={() => setPlayMode('KEYS')}
                >
                  🎹 MODE NOTE (KEYS)
                </button>
                <button
                  className={playMode === 'ONE' ? 'active' : ''}
                  onClick={() => setPlayMode('ONE')}
                >
                  🥁 MODE BATTERIE
                </button>
              </div>
            </div>

            {/* Waveform Canvas / SVG ("onde du son") */}
            <div className="synth-waveform-box">
              <svg viewBox="0 0 180 44" className="synth-waveform-svg">
                <polyline
                  fill="none"
                  stroke="var(--ko-orange)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={waveformSvgPoints}
                />
              </svg>
              <button
                className="synth-preview-btn"
                onClick={() => props.onPreviewPatchSound(activePreset)}
                title="Écouter le patch actuel"
              >
                🔊 ÉCOUTER
              </button>
            </div>

            {/* Simplified Knobs / Sliders */}
            <div className="synth-knobs-grid">
              <label>
                <span>CUTOFF ({Math.round(cutoff)}Hz)</span>
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={cutoff}
                  onChange={(e) => setCutoff(Number(e.target.value))}
                />
              </label>

              <label>
                <span>RESONANCE ({resonance.toFixed(1)})</span>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={resonance}
                  onChange={(e) => setResonance(Number(e.target.value))}
                />
              </label>

              <label>
                <span>DECAY ({decay.toFixed(2)}s)</span>
                <input
                  type="range"
                  min="0.05"
                  max="3.0"
                  step="0.05"
                  value={decay}
                  onChange={(e) => setDecay(Number(e.target.value))}
                />
              </label>

              <label>
                <span>MORPH ({morph}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={morph}
                  onChange={(e) => setMorph(Number(e.target.value))}
                />
              </label>
            </div>

            {/* Main Action Button */}
            <button
              className="synth-apply-pad-btn"
              onClick={() => props.onAssignPatchToPad(props.activeGroup, props.selectedPad, activePreset)}
            >
              ✅ ASSIGNER AU PAD {props.activeGroup}{props.selectedPad + 1} ({props.padName})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
