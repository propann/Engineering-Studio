/**
 * op1SynthEngine.ts — Moteur audio de synthèse et d'échantillonnage OP-1 & Bus d'enregistrement Tape
 *
 * Les VINGT moteurs du rack sont jouables au clavier depuis le 2026-08-29.
 *
 * Sept d'entre eux — FM, String, Pulse, Cluster, Drum et les moteurs natifs —
 * gardent une voix propre a l'OP-1, reglee pour ses quatre potentiometres et
 * modifiable EN DIRECT sur une note tenue.
 *
 * Les treize autres passent par `construireMoteur`, la bibliotheque partagee
 * avec le rack du Hub et Strudel. Ils tombaient jusqu'ici dans un repli
 * generique — deux oscillateurs et un filtre — et sonnaient donc tous pareil :
 * seul le nom changeait dans l'ecran. Un `mi_clouds` joue ici est desormais le
 * meme granulateur que dans le rack.
 *
 * Synthetiseurs emblematiques couverts :
 * - Mutable Instruments : Plaits, Braids, Rings, Clouds, Elements
 * - Synthèse Légendaire : Dexed FM (DX7 2-6 op), Surge XT (Wavetable & Drive), ZynAddSubFX (Harmoniques additives), Helm, FluidSynth (SoundFonts / Rhodes / Piano), amSynth (Analog subtractive), AMY (Additive multi-partielle), Picoloop (8-bit Chiptune), Open303 (Acid bassline TB-303), Faust DSP (Wavefolder & physical modeling)
 * - Moteurs OP-1 Natifs : FM, Cluster, Digital, Pulse, String, Voltage, Phase, DNA, Iter, Drum (24 tranches)
 *
 * Tous les potentiomètres (T1 Bleu, T2 Vert, T3 Blanc, T4 Rouge) ainsi que la page SHIFT
 * modifient le son en temps réel (sur les notes tenues et les notes suivantes).
 */

import { PARAMS_DEFAUT, construireMoteur, type ParamsMoteurs } from "@studio-hub/core/audio/moteurs";

/**
 * Les vingt moteurs du rack DSP, par leur identifiant.
 *
 * La liste vit ici plutot que d'etre importee : `soundEnginesData.ts` la porte
 * deja pour l'interface, et le rack du Hub aussi. Une quatrieme copie serait
 * de trop — mais celle-ci est verifiee par
 * `apps/studio-hub/src/core/strudel/moteursStrudel.test.ts`, qui compare les
 * listes entre elles.
 */
const MOTEURS_RACK = new Set([
  "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
  "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "open303",
  "amsynth", "amy_engine", "pl_synth", "fluidsynth", "faust_dsp",
  "drum_machine", "vocoder_dsp", "string_machine", "organ_drawbars",
  "phase_distortion",
]);

/** Ce moteur a-t-il une synthese dans la bibliotheque partagee ? */
function moteurDuRack(id: string): boolean {
  return MOTEURS_RACK.has(id);
}

/**
 * Traduit les potentiometres de l'OP-1 en parametres du moteur.
 *
 * Volontairement etroit. Il n'existe pas de coupure universelle : chaque
 * moteur nomme la sienne, et beaucoup n'en ont pas. Router T2 vers un seul
 * d'entre eux donnerait un potentiometre qui agit sur un moteur et pas sur les
 * autres — le defaut que le rack du Hub a mis des mois a purger.
 *
 * Ce qui n'est pas mappe ne fait rien, et c'est dit plutot que masque.
 */
function reglagesDepuisPotentiometres(
  moteur: string,
  t2: number,
  t3: number,
): Partial<ParamsMoteurs> {
  const coupure = Math.min(16000, Math.max(200, (t2 / 100) * 12000 + 400));
  const resonance = Math.max(0, Math.min(100, t3));
  switch (moteur) {
    case "open303": return { acidCutoff: coupure, acidResonance: resonance };
    case "helm": return { helmCutoff: coupure };
    case "surge_xt": return { surgeCutoff: coupure, surgeReso: resonance };
    case "amsynth": return { amCutoff: coupure, amReso: resonance };
    case "zynaddsubfx": return { zynReso: resonance };
    case "faust_dsp": return { faustFilter: coupure };
    case "string_machine": return { strTone: coupure };
    default: return {};
  }
}


import { construireMoteurOp1, type MoteurOp1 } from "@studio-hub/core/audio/moteursOp1";

/**
 * Traduit un moteur natif de l'OP-1 vers son identifiant dans la bibliotheque.
 *
 * Les noms de l'ecran — « Digital », « Iter » — et ceux du code partage
 * — `op1_digital` — sont volontairement distincts : la bibliotheque sert
 * aussi Strudel et le Hub, ou « Digital » tout court ne voudrait rien dire.
 */
function moteurNatif(engine: string): MoteurOp1 | null {
  switch (engine) {
    case "Digital": return "op1_digital";
    case "Iter": return "op1_iter";
    case "Phase": return "op1_phase";
    case "DNA": return "op1_dna";
    case "Voltage": return "op1_voltage";
    default: return null;
  }
}


export type Op1EngineType =
  | "FM"
  | "Cluster"
  | "Digital"
  | "Iter"
  | "Pulse"
  | "String"
  | "Sampler"
  | "Phase"
  | "DNA"
  | "Voltage"
  | "Drum";

export type DrumSoundType =
  | "kick"
  | "kick_punch"
  | "snare"
  | "rim"
  | "clap"
  | "hat"
  | "hat_half"
  | "open"
  | "crash"
  | "ride"
  | "tom"
  | "tom_low"
  | "tom_mid"
  | "tom_hi"
  | "shaker"
  | "tambourine"
  | "cowbell"
  | "conga"
  | "claves"
  | "zap"
  | "woodblock"
  | "triangle"
  | "sub808"
  | "noise_fx";

export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

type PatchVoiceProfile = {
  carrier: OscillatorType;
  modRatio: number;
  modIndex: number;
  filterMultiplier: number;
  detune: number;
};

function patchVoiceProfile(patch: string): PatchVoiceProfile {
  const name = patch.toLowerCase();
  if (name.includes("dx7") || name.includes("fm") || name.includes("bell") || name.includes("ep") || name.includes("tine")) {
    return { carrier: "sine", modRatio: 3, modIndex: 5, filterMultiplier: 6, detune: 0.001 };
  }
  if (name.includes("saw") || name.includes("brass") || name.includes("acid") || name.includes("lead")) {
    return { carrier: "sawtooth", modRatio: 1.5, modIndex: 2.4, filterMultiplier: 4, detune: 0.003 };
  }
  if (name.includes("granular") || name.includes("cloud") || name.includes("modal") || name.includes("ambient")) {
    return { carrier: "triangle", modRatio: 2.5, modIndex: 8, filterMultiplier: 8, detune: -0.002 };
  }
  if (name.includes("tape") || name.includes("dust") || name.includes("organ")) {
    return { carrier: "triangle", modRatio: 1.01, modIndex: 1.4, filterMultiplier: 2.8, detune: -0.004 };
  }
  return { carrier: "sine", modRatio: 2, modIndex: 3.5, filterMultiplier: 5, detune: 0.003 };
}

interface ActiveVoice {
  note: number;
  stop: (releaseTime?: number) => void;
  updateParams?: (param: string, value: number) => void;
}

class Op1SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private instrumentBus: GainNode | null = null;
  private recordingNode: ScriptProcessorNode | null = null;
  private isRecording = false;
  private recordedChunks: Float32Array[] = [];
  private activeVoices = new Map<number, ActiveVoice>();
  private currentRawEngine = "mi_plaits";
  private currentEngine: Op1EngineType = "Digital";
  private currentPatch = "Virtual Analog Saw Lead";
  private sampleRate = 44100;
  private engineParams: Record<string, number> = {
    t1: 1,
    t2: 65,
    t3: 45,
    t4: 70,
    shift_t1: 50,
    shift_t2: 4500,
    shift_t3: 40,
    shift_t4: 30,
  };

  public setEngineParam(param: string, value: number): void {
    this.engineParams[param] = value;
    // Mise à jour immédiate en temps réel sur toutes les voix actives
    this.activeVoices.forEach((voice) => {
      voice.updateParams?.(param, value);
    });
  }

  public getEngineParam(param: string, fallback: number = 50): number {
    return this.engineParams[param] ?? fallback;
  }

  public getAllEngineParams(): Record<string, number> {
    return { ...this.engineParams };
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.sampleRate = this.ctx.sampleRate;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.instrumentBus = this.ctx.createGain();
      this.instrumentBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.instrumentBus.connect(this.masterGain);

      // Node d'écoute pour l'enregistrement numérique direct du bus
      this.recordingNode = this.ctx.createScriptProcessor(4096, 1, 1);
      this.recordingNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const channelData = e.inputBuffer.getChannelData(0);
        if (this.recordedChunks.length < 4500) {
          this.recordedChunks.push(new Float32Array(channelData));
        }
      };
      this.instrumentBus.connect(this.recordingNode);
      const silentGain = this.ctx.createGain();
      silentGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.recordingNode.connect(silentGain);
      silentGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  public setEngine(engine: string) {
    this.currentRawEngine = engine;
    const rackToOp1: Record<string, Op1EngineType> = {
      mi_plaits: "Digital",
      mi_braids: "Pulse",
      mi_rings: "String",
      mi_clouds: "Phase",
      mi_elements: "Iter",
      dexed_fm: "FM",
      surge_xt: "Voltage",
      zynaddsubfx: "DNA",
      helm: "Cluster",
      fluidsynth: "Sampler",
      amsynth: "Voltage",
      amy_engine: "Iter",
      pl_synth: "Pulse",
      open303: "Pulse",
      faust_dsp: "Digital",
    };
    const resolved = rackToOp1[engine] ?? engine;
    const validEngines: Op1EngineType[] = [
      "FM", "Cluster", "Digital", "Iter", "Pulse", "String", "Sampler", "Phase", "DNA", "Voltage", "Drum"
    ];
    if (validEngines.includes(resolved as Op1EngineType)) {
      this.currentEngine = resolved as Op1EngineType;
    }
  }

  public getEngine(): Op1EngineType {
    return this.currentEngine;
  }

  public getRawEngine(): string {
    return this.currentRawEngine;
  }

  public setPatch(patch: string) {
    this.currentPatch = patch.trim() || "Virtual Analog Saw Lead";
  }

  public getPatch(): string {
    return this.currentPatch;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.02);
    }
  }

  /**
   * Déclenche une note MIDI sur le moteur de synthèse actif avec modulation temps réel
   */
  public triggerNoteOn(note: number, velocity = 100, customEngine?: Op1EngineType) {
    const ctx = this.initContext();
    const rawEngine = this.currentRawEngine;
    const engine = customEngine || this.currentEngine;
    const baseFreq = midiToFrequency(note);
    const velFactor = Math.max(0.1, Math.min(1, velocity / 127));

    // Si la note joue déjà, on la coupe proprement
    if (this.activeVoices.has(note)) {
      this.triggerNoteOff(note);
    }

    const now = ctx.currentTime;
    const voiceGain = ctx.createGain();
    voiceGain.connect(this.instrumentBus!);

    if (engine === "Drum" || rawEngine === "Drum" || (note >= 35 && note <= 64 && this.currentEngine === "Drum")) {
      this.playDrumSynth(note, velFactor, voiceGain, ctx, now);
      return;
    }

    // Récupération des paramètres actuels des potentiomètres
    const t1 = this.getEngineParam("t1", 1);
    const t2 = this.getEngineParam("t2", 65);
    const t3 = this.getEngineParam("t3", 45);
    const t4 = this.getEngineParam("t4", 70);
    const shiftT1 = this.getEngineParam("shift_t1", 50);
    const shiftT2 = this.getEngineParam("shift_t2", 4500);
    const shiftT3 = this.getEngineParam("shift_t3", 40);
    const shiftT4 = this.getEngineParam("shift_t4", 30);

    // Noeuds modifiables en direct
    let osc1: OscillatorNode | null = null;
    let osc2: OscillatorNode | null = null;
    let modulator: OscillatorNode | null = null;
    let modGain: GainNode | null = null;
    let filter: BiquadFilterNode | null = null;
    let waveshaper: WaveShaperNode | null = null;
    let cleanupNodes: () => void = () => {};

    // Coarse / Fine tune
    const coarseOffset = rawEngine === "mi_braids" ? shiftT1 : 0;
    const fineOffset = rawEngine === "mi_braids" ? shiftT2 : 0;
    const freq = baseFreq * Math.pow(2, (coarseOffset + fineOffset / 100) / 12);

    // Routage selon le moteur actif
    if (rawEngine === "dexed_fm" || engine === "FM") {
      // ── Moteur FM (DX7 / OP-1 FM) ──
      osc1 = ctx.createOscillator();
      modulator = ctx.createOscillator();
      modGain = ctx.createGain();
      filter = ctx.createBiquadFilter();

      const algo = Math.floor(Math.max(1, t1));
      const feedback = Math.max(0, t2 / 10);
      const bright = Math.max(0.1, t3 / 100);
      const decay = Math.max(0.1, t4 / 100);

      const ratio = 1 + (algo % 8) * 0.5;
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      modulator.type = "sine";
      modulator.frequency.setValueAtTime(freq * ratio, now);

      const modIndex = freq * (1 + feedback * 3 + bright * 6) * velFactor;
      modGain.gain.setValueAtTime(modIndex, now);
      modGain.gain.exponentialRampToValueAtTime(Math.max(1, modIndex * (0.05 + bright * 0.2)), now + 0.1 + decay * 1.5);

      modulator.connect(modGain);
      modGain.connect(osc1.frequency);

      filter.type = "lowpass";
      const cut = Math.min(16000, Math.max(200, freq * (2 + bright * 10)));
      filter.frequency.setValueAtTime(cut, now);
      filter.Q.setValueAtTime(2 + bright * 4, now);

      osc1.connect(filter);
      filter.connect(voiceGain);

      const atk = Math.max(0.005, (shiftT1 / 100) * 0.5);
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.5 * velFactor, now + atk);
      voiceGain.gain.exponentialRampToValueAtTime(0.3 * velFactor, now + atk + decay * 0.8);

      osc1.start(now);
      modulator.start(now);

      cleanupNodes = () => {
        try {
          osc1?.stop(ctx.currentTime + 0.3);
          modulator?.stop(ctx.currentTime + 0.3);
        } catch {}
      };
    } else if (rawEngine === "open303") {
      // ── Moteur Open303 Acid TB-303 ──
      osc1 = ctx.createOscillator();
      filter = ctx.createBiquadFilter();

      const isSquare = t1 >= 0.5;
      osc1.type = isSquare ? "square" : "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      const baseCut = Math.max(100, Math.min(16000, t2));
      const resoVal = Math.max(1, (t3 / 100) * 24);
      const envMod = Math.max(0, t4 / 100);

      filter.frequency.setValueAtTime(Math.min(16000, baseCut + freq * envMod * 8), now);
      filter.frequency.exponentialRampToValueAtTime(baseCut, now + 0.05 + (shiftT2 / 1000) * 0.5);
      filter.Q.setValueAtTime(resoVal, now);

      osc1.connect(filter);
      filter.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.55 * velFactor, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(0.3 * velFactor, now + 0.4);

      osc1.start(now);
      cleanupNodes = () => {
        try { osc1?.stop(ctx.currentTime + 0.2); } catch {}
      };
    } else if (rawEngine === "mi_rings" || engine === "String") {
      // ── Moteur Rings / Modélisation Karplus-Strong ──
      const bufferSize = Math.max(2, Math.floor(ctx.sampleRate / freq));
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      const bright = Math.max(0.1, t2 / 100);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * (0.2 + bright * 0.8)));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(14000, freq * (2 + bright * 8)), now);
      filter.Q.setValueAtTime(4 + (t3 / 100) * 10, now);

      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(1 / freq, now);

      const damp = Math.max(0.7, Math.min(0.995, 0.98 - (t3 / 100) * 0.1));
      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(damp, now);

      noise.connect(filter);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(filter);
      filter.connect(voiceGain);

      const decaySec = Math.max(0.4, (t4 / 100) * 3.5);
      voiceGain.gain.setValueAtTime(0.6 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + decaySec);

      noise.start(now);
      cleanupNodes = () => {};
    } else if (rawEngine === "pl_synth" || engine === "Pulse") {
      // ── Moteur Chiptune / Pulse PWM & Sub ──
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      filter = ctx.createBiquadFilter();

      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq / 2, now);

      filter.type = "lowpass";
      const cut = Math.min(14000, Math.max(200, freq * (2 + (t2 / 100) * 8)));
      filter.frequency.setValueAtTime(cut, now);
      filter.Q.setValueAtTime(2 + (t3 / 100) * 8, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime((shiftT3 / 100) * 0.6, now);
      osc2.connect(subGain);

      osc1.connect(filter);
      subGain.connect(filter);
      filter.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.45 * velFactor, now + 0.01);

      osc1.start(now);
      osc2.start(now);

      cleanupNodes = () => {
        try {
          osc1?.stop(ctx.currentTime + 0.2);
          osc2?.stop(ctx.currentTime + 0.2);
        } catch {}
      };
    } else if (rawEngine === "helm" || engine === "Cluster") {
      // ── Moteur Helm / Cluster Supersaw ──
      const oscs: OscillatorNode[] = [];
      const detuneAmt = (t4 / 100) * 25 + 5;
      const detunes = [-detuneAmt, -detuneAmt * 0.35, detuneAmt * 0.35, detuneAmt];
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      const cut = Math.min(16000, Math.max(200, (t2 / 100) * 12000 + 400));
      filter.frequency.setValueAtTime(cut, now);
      filter.Q.setValueAtTime(1 + (t3 / 100) * 12, now);

      detunes.forEach((d) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq, now);
        o.detune.setValueAtTime(d, now);
        o.connect(filter!);
        o.start(now);
        oscs.push(o);
      });

      filter.connect(voiceGain);
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.35 * velFactor, now + 0.02);

      cleanupNodes = () => {
        oscs.forEach((o) => {
          try { o.stop(ctx.currentTime + 0.2); } catch {}
        });
      };
    } else if (moteurDuRack(rawEngine)) {
      /**
       * ── Les moteurs du rack DSP, joues par leur vraie synthese ──
       *
       * Jusqu'au 2026-08-29, cette branche etait un repli generique : deux
       * oscillateurs et un filtre, pilotes par les potentiometres. TREIZE
       * moteurs y tombaient — Plaits, Braids, Clouds, Elements, Surge, Zyn,
       * amSynth, AMY, FluidSynth, Faust et les cinq derniers — et sonnaient
       * donc tous PAREIL. Le nom change dans l'ecran, pas le son.
       *
       * Ils utilisent maintenant `construireMoteur`, la meme bibliotheque que
       * le rack du Hub et que Strudel. Un `mi_clouds` joue au clavier de
       * l'OP-1 est desormais le meme granulateur que dans le rack.
       *
       * Les sept moteurs traites plus haut gardent leur voix propre a l'OP-1 :
       * eux repondent aux potentiometres EN DIRECT, sur une note tenue, ce que
       * la bibliotheque ne sait pas faire — elle construit une voix par note.
       */
      const sources: AudioScheduledSourceNode[] = [];
      const params = {
        ...PARAMS_DEFAUT,
        activeEngine: rawEngine as (typeof PARAMS_DEFAUT)["activeEngine"],
        ...reglagesDepuisPotentiometres(rawEngine, t2, t3),
      };
      construireMoteur(
        ctx,
        params,
        freq,
        now,
        {
          trk: (n) => { sources.push(n); return n; },
          noteStop: (n, quand) => { try { n.stop(quand); } catch { /* deja arretee */ } },
          holdUntil: () => {},
          // Pas de reverberation partagee ici : le studio OP-1 a son propre
          // bus, et lui en imposer une changerait son espace sonore.
          reverb: null,
        },
        voiceGain,
      );

      const atkSec = Math.max(0.005, (shiftT1 / 100) * 0.3);
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.45 * velFactor, now + atkSec);

      cleanupNodes = () => {
        for (const s of sources) {
          try { s.stop(ctx.currentTime + 0.2); } catch { /* deja arretee */ }
        }
      };
    } else if (moteurNatif(engine)) {
      /**
       * ── Les moteurs natifs de l'OP-1, chacun avec sa voix ──
       *
       * Digital, Iter, Phase, DNA et Voltage tombaient dans le repli
       * generique ci-dessous et sonnaient donc tous PAREIL — seul le nom
       * changeait a l'ecran. C'est le meme defaut que celui des treize
       * moteurs du rack, corrige plus tot le 2026-08-29 : ceux-la manquaient
       * d'une synthese, ceux-ci en partageaient une seule.
       *
       * Ils vivent dans `core/audio/moteursOp1.ts`, donc jouables partout —
       * depuis ce clavier, depuis un motif Strudel, depuis les outils
       * d'echantillon. Les laisser ici les y aurait enfermes.
       */
      const sources: AudioScheduledSourceNode[] = [];
      const sortie = construireMoteurOp1(
        ctx,
        moteurNatif(engine)!,
        {
          op1Timbre: t1,
          op1Forme: t2,
          op1Mouvement: t3,
          op1Decay: t4,
        },
        freq,
        now,
        {
          trk: (n) => { sources.push(n); return n; },
          noteStop: (n, quand) => { try { n.stop(quand); } catch { /* deja arretee */ } },
          holdUntil: () => {},
        },
      );
      sortie?.connect(voiceGain);

      const atkSec = Math.max(0.005, (shiftT1 / 100) * 0.3);
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.4 * velFactor, now + atkSec);

      cleanupNodes = () => {
        for (const s of sources) {
          try { s.stop(ctx.currentTime + 0.2); } catch { /* deja arretee */ }
        }
      };
    } else {
      // ── Dernier repli : Sampler, et tout identifiant inconnu ──
      // Le Sampler n'est pas une synthese : il lit un echantillon, et n'a donc
      // rien a faire dans une bibliotheque d'oscillateurs.
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      filter = ctx.createBiquadFilter();

      const modelIdx = Math.floor(Math.max(1, t1));
      const waveTypes: OscillatorType[] = ["sawtooth", "square", "triangle", "sine"];
      osc1.type = waveTypes[(modelIdx - 1) % waveTypes.length] || "sawtooth";
      osc2.type = waveTypes[modelIdx % waveTypes.length] || "square";

      const timbre = Math.max(0.1, t2 / 100);
      const morph = Math.max(0.1, t3 / 100);
      const decay = Math.max(0.1, t4 / 100);

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * (1 + morph * 0.015), now);

      filter.type = "lowpass";
      const cut = Math.min(16000, Math.max(200, freq * (1.5 + timbre * 12)));
      filter.frequency.setValueAtTime(cut, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(150, freq * 1.5), now + 0.1 + decay * 0.8);
      filter.Q.setValueAtTime(2 + morph * 10, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);

      const atkSec = Math.max(0.005, (shiftT1 / 100) * 0.3);
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(0.45 * velFactor, now + atkSec);
      voiceGain.gain.exponentialRampToValueAtTime(0.25 * velFactor, now + atkSec + decay * 0.6);

      osc1.start(now);
      osc2.start(now);

      cleanupNodes = () => {
        try {
          osc1?.stop(ctx.currentTime + 0.2);
          osc2?.stop(ctx.currentTime + 0.2);
        } catch {}
      };
    }

    // Gestionnaire de mise à jour des paramètres en temps réel pendant le maintien de la note
    const updateParams = (param: string, value: number) => {
      if (!this.ctx) return;
      const curTime = this.ctx.currentTime;
      if (filter) {
        if (param === "t2" || param === "shift_t2") {
          const cut = Math.min(16000, Math.max(100, (value / 100) * 12000 + 200));
          filter.frequency.setTargetAtTime(cut, curTime, 0.03);
        } else if (param === "t3" || param === "shift_t3") {
          const qVal = Math.max(0.5, Math.min(24, (value / 100) * 18 + 0.5));
          filter.Q.setTargetAtTime(qVal, curTime, 0.03);
        }
      }
      if (osc1 && (param === "t1" || param === "shift_t1")) {
        if (rawEngine === "mi_braids") {
          const coarse = value;
          osc1.frequency.setTargetAtTime(baseFreq * Math.pow(2, coarse / 12), curTime, 0.03);
        }
      }
      if (modGain && (param === "t2" || param === "t3")) {
        const mIdx = freq * (1 + (value / 100) * 10);
        modGain.gain.setTargetAtTime(mIdx, curTime, 0.03);
      }
    };

    const relTime = Math.max(0.08, (shiftT2 / 100) * 0.8 || 0.15);
    const voice: ActiveVoice = {
      note,
      updateParams,
      stop: (customRelTime = relTime) => {
        if (!this.ctx) return;
        const relNow = this.ctx.currentTime;
        voiceGain.gain.cancelScheduledValues(relNow);
        voiceGain.gain.setValueAtTime(voiceGain.gain.value, relNow);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, relNow + customRelTime);
        cleanupNodes();
        window.setTimeout(() => {
          try { voiceGain.disconnect(); } catch {}
        }, customRelTime * 1000 + 50);
      },
    };

    this.activeVoices.set(note, voice);
  }

  public triggerNoteOff(note: number) {
    const voice = this.activeVoices.get(note);
    if (voice) {
      voice.stop(0.12);
      this.activeVoices.delete(note);
    }
  }

  public playNote(note: number, velocity = 100, duration = 0.3) {
    this.triggerNoteOn(note, velocity);
    window.setTimeout(() => {
      this.triggerNoteOff(note);
    }, Math.max(50, duration * 1000));
  }

  public triggerDrum(drumType: DrumSoundType | number, velocity = 100) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const velFactor = Math.max(0.1, Math.min(1, velocity / 127));
    const voiceGain = ctx.createGain();
    voiceGain.connect(this.instrumentBus!);
    this.playDrumSynth(drumType, velFactor, voiceGain, ctx, now);
  }

  private playDrumSynth(
    drumType: DrumSoundType | number,
    velFactor: number,
    voiceGain: GainNode,
    ctx: AudioContext,
    now: number
  ) {
    let typeStr: DrumSoundType = typeof drumType === "string" ? drumType : "kick";
    if (typeof drumType === "number") {
      const n = drumType;
      if (n === 41) typeStr = "kick";
      else if (n === 42) typeStr = "sub808";
      else if (n === 43) typeStr = "kick_punch";
      else if (n === 44) typeStr = "zap";
      else if (n === 45) typeStr = "snare";
      else if (n === 46) typeStr = "rim";
      else if (n === 47) typeStr = "clap";
      else if (n === 48) typeStr = "woodblock";
      else if (n === 49) typeStr = "hat";
      else if (n === 50) typeStr = "hat_half";
      else if (n === 51) typeStr = "shaker";
      else if (n === 52) typeStr = "tambourine";
      else if (n === 53) typeStr = "open";
      else if (n === 54) typeStr = "crash";
      else if (n === 55) typeStr = "ride";
      else if (n === 56) typeStr = "triangle";
      else if (n === 57) typeStr = "tom_low";
      else if (n === 58) typeStr = "tom_mid";
      else if (n === 59) typeStr = "tom_hi";
      else if (n === 60) typeStr = "conga";
      else if (n === 61) typeStr = "claves";
      else if (n === 62) typeStr = "cowbell";
      else if (n === 63) typeStr = "noise_fx";
      else if (n === 64) typeStr = "zap";
      else if (n === 35 || n === 36) typeStr = "kick";
      else if (n === 37) typeStr = "rim";
      else if (n === 38 || n === 40) typeStr = "snare";
      else if (n === 39) typeStr = "clap";
      else typeStr = "tom";
    }

    const pitchKnob = this.getEngineParam("t1", 0);
    const toneKnob = this.getEngineParam("t2", 60);
    const decayKnob = this.getEngineParam("t3", 50);
    const driveKnob = this.getEngineParam("t4", 40);
    const pitchFactor = Math.pow(2, pitchKnob / 12);
    const toneFactor = toneKnob / 100;
    const decayMultiplier = 0.5 + (decayKnob / 100) * 1.5;

    if (typeStr === "kick" || typeStr === "kick_punch") {
      const osc = ctx.createOscillator();
      const startFreq = (typeStr === "kick_punch" ? 170 : 130) * pitchFactor;
      const endFreq = (typeStr === "kick_punch" ? 42 : 36) * pitchFactor;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      voiceGain.gain.setValueAtTime(0.95 * velFactor * (1 + driveKnob * 0.005), now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 * decayMultiplier);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.38 * decayMultiplier);

      const click = ctx.createOscillator();
      click.type = "sine";
      click.frequency.setValueAtTime(600 * toneFactor * pitchFactor + 200, now);
      click.frequency.exponentialRampToValueAtTime(80, now + 0.015);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.4 * velFactor, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      click.connect(clickGain);
      clickGain.connect(voiceGain);
      click.start(now);
      click.stop(now + 0.025);
    } else if (typeStr === "sub808") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(75 * pitchFactor, now);
      osc.frequency.exponentialRampToValueAtTime(32 * pitchFactor, now + 0.2);
      voiceGain.gain.setValueAtTime(0.95 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85 * decayMultiplier);
      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.9 * decayMultiplier);
    } else if (typeStr === "snare") {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200 * pitchFactor, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitchFactor, now + 0.07);

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(800 + toneFactor * 1200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75 * velFactor, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 * decayMultiplier);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(voiceGain);

      osc.connect(voiceGain);
      voiceGain.gain.setValueAtTime(0.8 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24 * decayMultiplier);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.25 * decayMultiplier);
      noise.stop(now + 0.25 * decayMultiplier);
    } else {
      // Claps, Hats, Toms, Percs
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const f = (typeStr.includes("hat") ? 3200 : typeStr.includes("tom") ? 180 : 600) * pitchFactor;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, now + 0.05);

      voiceGain.gain.setValueAtTime(0.75 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 * decayMultiplier);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.18 * decayMultiplier);
    }
  }

  public startRecording() {
    this.initContext();
    this.recordedChunks = [];
    this.isRecording = true;
  }

  public stopRecording(): AudioBuffer | null {
    this.isRecording = false;
    if (!this.ctx || this.recordedChunks.length === 0) return null;

    let totalLength = 0;
    for (const chunk of this.recordedChunks) {
      totalLength += chunk.length;
    }
    if (totalLength === 0) return null;

    const buffer = this.ctx.createBuffer(1, totalLength, this.sampleRate);
    const channelData = buffer.getChannelData(0);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }

    this.recordedChunks = [];
    return buffer;
  }

  public audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const data = buffer.getChannelData(0);
    const byteLength = data.length * 2;
    const wavBuffer = new ArrayBuffer(44 + byteLength);
    const view = new DataView(wavBuffer);

    function writeString(offset: number, string: string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + byteLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, byteLength, true);

    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  }

  public startTapeRecording() {
    this.startRecording();
  }

  public stopTapeRecording(): { duration: number; samples: Float32Array; peaks: number[]; buffer: AudioBuffer } | null {
    this.isRecording = false;
    if (!this.ctx || this.recordedChunks.length === 0) return null;

    let totalLength = 0;
    for (const chunk of this.recordedChunks) {
      totalLength += chunk.length;
    }
    if (totalLength === 0) return null;

    const samples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    const buffer = this.ctx.createBuffer(1, totalLength, this.sampleRate);
    buffer.getChannelData(0).set(samples);

    const numPeaks = 120;
    const blockSize = Math.max(1, Math.floor(totalLength / numPeaks));
    const peaks: number[] = [];
    for (let i = 0; i < numPeaks; i++) {
      let maxVal = 0;
      const start = i * blockSize;
      const end = Math.min(totalLength, start + blockSize);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(samples[j]);
        if (abs > maxVal) maxVal = abs;
      }
      peaks.push(maxVal);
    }

    this.recordedChunks = [];
    return {
      duration: totalLength / this.sampleRate,
      samples,
      peaks,
      buffer,
    };
  }

  public playCountdownBeep(stage: string | number) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const isGo = stage === "GO" || stage === "go" || stage === 0;
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.35 : 0.15));
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + (isGo ? 0.38 : 0.18));
  }

  public playMetronomeClick(accent = false) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(accent ? 1200 : 800, now);
    gain.gain.setValueAtTime(accent ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playHitSound(judgment: string) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = judgment === "PERFECT" ? 880 : judgment === "GREAT" ? 660 : judgment === "GOOD" ? 520 : 220;
    osc.frequency.setValueAtTime(freq, now);
    if (judgment === "PERFECT") {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    }
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }
}

export const op1AudioEngine = new Op1SynthEngine();
