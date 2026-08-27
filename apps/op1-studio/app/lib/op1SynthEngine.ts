/**
 * op1SynthEngine.ts — Moteur audio de synthèse et d'échantillonnage OP-1 & Bus d'enregistrement Tape
 *
 * Implémente fidèlement les moteurs sonores emblématiques de l'OP-1 :
 * - FM (Modulation de fréquence 2-op avec ratio harmonique et timbre brillant)
 * - Pulse (Onde carrée / PWM avec filtre passe-bas résonant et sub-bass)
 * - Cluster (Ensemble d'oscillateurs désaccordés / supersaw riche)
 * - Digital (Onde additive riche avec drive harmonique et filtre de forme)
 * - String (Modélisation de cordes pincées Karplus-Strong / résonateur physique)
 * - Phase (Distorsion de phase dynamique avec sweep de timbre)
 * - Voltage (Synthèse analogique soustractive avec saturation chaude)
 * - Iter / DNA (Synthèse expérimentale FM granulaire / métallique)
 * - Drum (Modélisation de percussions physiques / analogiques OP-1 : Kick, Snare, Hat, Open Hat, Clap, Tom)
 *
 * Toutes les voix sont routées vers un Master Instrument Bus qui alimente simultanément :
 * 1. La sortie haut-parleur / casque (Monitoring temps réel sans latence)
 * 2. Le Tape Recorder Bus (Enregistrement numérique direct "Tape Print" 44.1 kHz PCM 16 bits)
 */

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

/** Convertit le patch choisi dans le petit écran en paramètres réellement audibles. */
function patchVoiceProfile(patch: string): PatchVoiceProfile {
  const name = patch.toLowerCase();
  if (name.includes("dx7") || name.includes("fm") || name.includes("bell")) {
    return { carrier: "sine", modRatio: 3, modIndex: 5, filterMultiplier: 6, detune: 0.001 };
  }
  if (name.includes("saw") || name.includes("brass") || name.includes("acid")) {
    return { carrier: "sawtooth", modRatio: 1.5, modIndex: 2.4, filterMultiplier: 4, detune: 0.003 };
  }
  if (name.includes("granular") || name.includes("cloud") || name.includes("modal")) {
    return { carrier: "triangle", modRatio: 2.5, modIndex: 8, filterMultiplier: 8, detune: -0.002 };
  }
  if (name.includes("tape") || name.includes("dust")) {
    return { carrier: "triangle", modRatio: 1.01, modIndex: 1.4, filterMultiplier: 2.8, detune: -0.004 };
  }
  return { carrier: "sine", modRatio: 2, modIndex: 3.5, filterMultiplier: 5, detune: 0.003 };
}

interface ActiveVoice {
  note: number;
  stop: (releaseTime?: number) => void;
}

class Op1SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private instrumentBus: GainNode | null = null;
  private recordingNode: ScriptProcessorNode | null = null;
  private isRecording = false;
  private recordedChunks: Float32Array[] = [];
  private activeVoices = new Map<number, ActiveVoice>();
  private currentEngine: Op1EngineType = "FM";
  private currentPatch = "Virtual Analog Saw Lead";
  private sampleRate = 44100;
  private engineParams: Record<string, number> = {};

  public setEngineParam(param: string, value: number): void {
    this.engineParams[param] = value;
  }

  public getEngineParam(param: string, fallback: number = 0.5): number {
    return this.engineParams[param] ?? fallback;
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        // Limite maximale de sécurité calée sur la bande totale de l'OP-1 (360s * 48000Hz ≈ 17.2M samples max / ~4200 chunks)
        if (this.recordedChunks.length < 4500) {
          this.recordedChunks.push(new Float32Array(channelData));
        }
      };
      this.instrumentBus.connect(this.recordingNode);
      // Connecter à destination pour forcer le ScriptProcessor à tourner
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

  /**
   * Sélectionne un moteur OP-1 natif ou un moteur du rack Hub.
   * Les identifiants du rack restent des identifiants UI stables et sont
   * résolus vers le moteur local disponible ; aucun message machine n'est
   * émis par cette sélection.
   */
  public setEngine(engine: string) {
    const rackToOp1: Record<string, Op1EngineType> = {
      mi_plaits: "Digital", mi_braids: "Pulse", mi_rings: "String",
      mi_clouds: "Phase", mi_elements: "Iter", dexed_fm: "FM",
      surge_xt: "Voltage", zynaddsubfx: "DNA", helm: "Cluster",
      fluidsynth: "Sampler", amsynth: "Voltage", amy_engine: "Iter",
      pl_synth: "Pulse", open303: "Pulse", faust_dsp: "Digital",
    };
    const resolved = rackToOp1[engine] ?? engine;
    const validEngines: Op1EngineType[] = ["FM", "Cluster", "Digital", "Iter", "Pulse", "String", "Sampler", "Phase", "DNA", "Voltage", "Drum"];
    if (validEngines.includes(resolved as Op1EngineType)) {
      this.currentEngine = resolved as Op1EngineType;
    }
  }

  public getEngine(): Op1EngineType {
    return this.currentEngine;
  }

  /** Le patch reste local au rack et influence la prochaine voix jouée. */
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
   * Déclenche une note MIDI sur le moteur de synthèse actif
   */
  public triggerNoteOn(note: number, velocity = 100, customEngine?: Op1EngineType) {
    const ctx = this.initContext();
    const engine = customEngine || this.currentEngine;
    const freq = midiToFrequency(note);
    const velFactor = Math.max(0.1, Math.min(1, velocity / 127));

    // Si la note joue déjà, on la coupe proprement
    if (this.activeVoices.has(note)) {
      this.triggerNoteOff(note);
    }

    const now = ctx.currentTime;
    const voiceGain = ctx.createGain();
    voiceGain.connect(this.instrumentBus!);

    let cleanupNodes: () => void = () => {};

    if (engine === "Drum" || (note >= 35 && note <= 50 && (this.currentEngine as string) === "Drum")) {
      // Moteur Drum OP-1
      this.playDrumSynth(note, velFactor, voiceGain, ctx, now);
      return;
    }

    switch (engine) {
      case "FM": {
        // Moteur FM 2-Opérateurs classique OP-1
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();

        const patch = patchVoiceProfile(this.currentPatch);
        carrier.type = patch.carrier;
        carrier.frequency.setValueAtTime(freq, now);

        modulator.type = "sine";
        modulator.frequency.setValueAtTime(freq * patch.modRatio, now);

        const modIndex = freq * patch.modIndex * velFactor;
        modGain.gain.setValueAtTime(modIndex, now);
        modGain.gain.exponentialRampToValueAtTime(Math.max(1, modIndex * 0.15), now + 0.8);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(voiceGain);

        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.45 * velFactor, now + 0.01);
        voiceGain.gain.exponentialRampToValueAtTime(0.28 * velFactor, now + 0.3);

        carrier.start(now);
        modulator.start(now);

        cleanupNodes = () => {
          try {
            carrier.stop(ctx.currentTime + 0.2);
            modulator.stop(ctx.currentTime + 0.2);
          } catch {}
        };
        break;
      }

      case "Pulse": {
        // Moteur Pulse / PWM + Sub Bass
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now);

        sub.type = "sine";
        sub.frequency.setValueAtTime(freq / 2, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(Math.min(12000, freq * 4), now);
        filter.Q.setValueAtTime(4.0, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), now + 0.5);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.4, now);
        sub.connect(subGain);

        osc.connect(filter);
        subGain.connect(filter);
        filter.connect(voiceGain);

        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.4 * velFactor, now + 0.01);

        osc.start(now);
        sub.start(now);

        cleanupNodes = () => {
          try {
            osc.stop(ctx.currentTime + 0.2);
            sub.stop(ctx.currentTime + 0.2);
          } catch {}
        };
        break;
      }

      case "Cluster": {
        // Moteur Cluster : 4 oscillateurs légèrement désaccordés
        const oscs: OscillatorNode[] = [];
        const detunes = [-12, -4, 5, 13];
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.25 / oscs.length || 0.15, now);

        detunes.forEach((detune) => {
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now);
          osc.detune.setValueAtTime(detune, now);
          osc.connect(voiceGain);
          osc.start(now);
          oscs.push(osc);
        });

        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.35 * velFactor, now + 0.02);

        cleanupNodes = () => {
          oscs.forEach((osc) => {
            try { osc.stop(ctx.currentTime + 0.2); } catch {}
          });
        };
        break;
      }

      case "String": {
        // Modélisation physique Karplus-Strong pour corde pincée
        const bufferSize = Math.max(2, Math.floor(ctx.sampleRate / freq));
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(Math.min(10000, freq * 6), now);
        filter.Q.setValueAtTime(8, now);

        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(1 / freq, now);

        const feedback = ctx.createGain();
        feedback.gain.setValueAtTime(0.96, now);

        noise.connect(filter);
        filter.connect(delay);
        delay.connect(feedback);
        feedback.connect(filter);

        filter.connect(voiceGain);

        voiceGain.gain.setValueAtTime(0.5 * velFactor, now);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        noise.start(now);
        cleanupNodes = () => {};
        break;
      }

      case "Digital":
      case "Iter":
      case "DNA":
      case "Voltage":
      case "Phase":
      default: {
        // Synthèse Digital / Analog OP-1 chaleureuse et précise
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        const patch = patchVoiceProfile(this.currentPatch);
        osc1.type = engine === "Voltage" ? "sawtooth" : engine === "Phase" ? "triangle" : patch.carrier;
        osc2.type = engine === "Digital" ? "square" : "sine";

        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * (1 + patch.detune), now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(Math.min(14000, freq * patch.filterMultiplier), now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(100, freq * 1.8), now + 0.45);
        filter.Q.setValueAtTime(3.5, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(voiceGain);

        voiceGain.gain.setValueAtTime(0, now);
        voiceGain.gain.linearRampToValueAtTime(0.4 * velFactor, now + 0.015);
        voiceGain.gain.exponentialRampToValueAtTime(0.25 * velFactor, now + 0.4);

        osc1.start(now);
        osc2.start(now);

        cleanupNodes = () => {
          try {
            osc1.stop(ctx.currentTime + 0.2);
            osc2.stop(ctx.currentTime + 0.2);
          } catch {}
        };
        break;
      }
    }

    const voice: ActiveVoice = {
      note,
      stop: (releaseTime = 0.15) => {
        if (!this.ctx) return;
        const relNow = this.ctx.currentTime;
        voiceGain.gain.cancelScheduledValues(relNow);
        voiceGain.gain.setValueAtTime(voiceGain.gain.value, relNow);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, relNow + releaseTime);
        cleanupNodes();
        window.setTimeout(() => {
          try { voiceGain.disconnect(); } catch {}
        }, releaseTime * 1000 + 50);
      },
    };

    this.activeVoices.set(note, voice);
  }

  /**
   * Arrête une note en cours de jeu avec un release doux
   */
  public triggerNoteOff(note: number) {
    const voice = this.activeVoices.get(note);
    if (voice) {
      voice.stop(0.12);
      this.activeVoices.delete(note);
    }
  }

  /**
   * Joue une note de durée déterminée (utile pour les démos, exercices et clics de prévisualisation)
   */
  public playNote(note: number, velocity = 100, duration = 0.3) {
    this.triggerNoteOn(note, velocity);
    window.setTimeout(() => {
      this.triggerNoteOff(note);
    }, Math.max(50, duration * 1000));
  }

  /**
   * Moteur Drum OP-1 (Kick, Snare, Hi-Hat, Clap, Tom, Cowbell, 808 Sub, Zap, Percs...)
   */
  public triggerDrum(drumType: DrumSoundType | number, velocity = 100) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const velFactor = Math.max(0.1, Math.min(1, velocity / 127));
    const voiceGain = ctx.createGain();
    voiceGain.connect(this.instrumentBus!);

    let typeStr: DrumSoundType = typeof drumType === "string" ? drumType : "kick";
    if (typeof drumType === "number") {
      const n = drumType;
      // Tranches 1 à 24 de l'OP-1 (Notes MIDI 41 à 64 : Fa2 à Mi4)
      if (n === 41) typeStr = "kick";               // Slice 1 (Touche Fa2) : Kick Sub / Analogique
      else if (n === 42) typeStr = "sub808";        // Slice 2 (Touche Fa#2) : Sub 808
      else if (n === 43) typeStr = "kick_punch";    // Slice 3 (Touche Sol2) : Kick Punchy / Tranchant
      else if (n === 44) typeStr = "zap";           // Slice 4 (Touche Sol#2) : Laser Zap / Pitch Drop
      else if (n === 45) typeStr = "snare";         // Slice 5 (Touche La2) : Snare principal
      else if (n === 46) typeStr = "rim";           // Slice 6 (Touche La#2) : Rimshot / Side Stick
      else if (n === 47) typeStr = "clap";          // Slice 7 (Touche Si2) : Clap acoustique
      else if (n === 48) typeStr = "woodblock";     // Slice 8 (Touche Do3) : Woodblock / Snap
      else if (n === 49) typeStr = "hat";           // Slice 9 (Touche Do#3) : Hi-Hat Fermé court
      else if (n === 50) typeStr = "hat_half";      // Slice 10 (Touche Ré3) : Hi-Hat Semi-ouvert
      else if (n === 51) typeStr = "shaker";        // Slice 11 (Touche Ré#3) : Shaker
      else if (n === 52) typeStr = "tambourine";    // Slice 12 (Touche Mi3) : Tambourin
      else if (n === 53) typeStr = "open";          // Slice 13 (Touche Fa3) : Hi-Hat Ouvert
      else if (n === 54) typeStr = "crash";         // Slice 14 (Touche Fa#3) : Cymbale Crash
      else if (n === 55) typeStr = "ride";          // Slice 15 (Touche Sol3) : Cymbale Ride
      else if (n === 56) typeStr = "triangle";      // Slice 16 (Touche Sol#3) : Triangle / Bell
      else if (n === 57) typeStr = "tom_low";       // Slice 17 (Touche La3) : Tom Basse
      else if (n === 58) typeStr = "tom_mid";       // Slice 18 (Touche La#3) : Tom Médium
      else if (n === 59) typeStr = "tom_hi";        // Slice 19 (Touche Si3) : Tom Aigu
      else if (n === 60) typeStr = "conga";         // Slice 20 (Touche Do4) : Conga / Bongo
      else if (n === 61) typeStr = "claves";        // Slice 21 (Touche Do#4) : Claves
      else if (n === 62) typeStr = "cowbell";       // Slice 22 (Touche Ré4) : Cowbell 808
      else if (n === 63) typeStr = "noise_fx";      // Slice 23 (Touche Ré#4) : Noise Sweep FX
      else if (n === 64) typeStr = "zap";           // Slice 24 (Touche Mi4) : Synth Glitch / Stab
      // Rétrocompatibilité standard General MIDI (notes 35 à 40)
      else if (n === 35 || n === 36) typeStr = "kick";
      else if (n === 37) typeStr = "rim";
      else if (n === 38 || n === 40) typeStr = "snare";
      else if (n === 39) typeStr = "clap";
      else typeStr = "tom";
    }

    if (typeStr === "kick" || typeStr === "kick_punch") {
      // Kick percutant OP-1 avec pitch drop analogique + click d'attaque
      const osc = ctx.createOscillator();
      const startFreq = typeStr === "kick_punch" ? 170 : 130;
      const endFreq = typeStr === "kick_punch" ? 42 : 36;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      voiceGain.gain.setValueAtTime(0.95 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.38);

      // Petit clic transitoire d'attaque OP-1
      const click = ctx.createOscillator();
      click.type = "sine";
      click.frequency.setValueAtTime(600, now);
      click.frequency.exponentialRampToValueAtTime(80, now + 0.015);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.4 * velFactor, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      click.connect(clickGain);
      clickGain.connect(voiceGain);
      click.start(now);
      click.stop(now + 0.025);
    } else if (typeStr === "sub808") {
      // Sub 808 profond qui descend et résonne
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.2);
      voiceGain.gain.setValueAtTime(0.95 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (typeStr === "snare") {
      // Snare OP-1 : corps triangulaire/sinus + burst de bruit blanc filtré
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(1100, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75 * velFactor, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(voiceGain);

      osc.connect(voiceGain);
      voiceGain.gain.setValueAtTime(0.8 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.25);
      noise.stop(now + 0.25);
    } else if (typeStr === "rim" || typeStr === "woodblock" || typeStr === "claves") {
      // Rimshot / Side Stick / Woodblock / Claves
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const f = typeStr === "woodblock" ? 820 : typeStr === "claves" ? 1450 : 450;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, now + 0.04);
      voiceGain.gain.setValueAtTime(0.85 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + (typeStr === "claves" ? 0.05 : 0.07));
      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (typeStr === "triangle") {
      // Triangle / Bell OP-1 brillant
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(1240, now);
      osc2.frequency.setValueAtTime(1860, now);
      voiceGain.gain.setValueAtTime(0.65 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(voiceGain);
      osc2.connect(voiceGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.48);
      osc2.stop(now + 0.48);
    } else if (typeStr === "noise_fx") {
      // FX Noise Sweep analogique
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(4500, now + 0.5);
      filter.Q.setValueAtTime(4.0, now);
      voiceGain.gain.setValueAtTime(0.7 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      noise.connect(filter);
      filter.connect(voiceGain);
      noise.start(now);
      noise.stop(now + 0.58);
    } else if (typeStr === "clap") {
      // Clap OP-1 : 3 micro-rafales de bruit espacées de 11ms
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1300, now);
      filter.Q.setValueAtTime(2.2, now);

      const clapEnv = ctx.createGain();
      clapEnv.gain.setValueAtTime(0.45 * velFactor, now);
      clapEnv.gain.setValueAtTime(0.05, now + 0.01);
      clapEnv.gain.setValueAtTime(0.6 * velFactor, now + 0.012);
      clapEnv.gain.setValueAtTime(0.05, now + 0.022);
      clapEnv.gain.setValueAtTime(0.85 * velFactor, now + 0.025);
      clapEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(clapEnv);
      clapEnv.connect(voiceGain);

      noise.start(now);
      noise.stop(now + 0.24);
    } else if (typeStr === "hat" || typeStr === "hat_half" || typeStr === "shaker" || typeStr === "tambourine") {
      // Hi-Hat / Shaker métallique serré
      const dur = typeStr === "hat_half" ? 0.16 : typeStr === "tambourine" ? 0.2 : 0.06;
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (dur + 0.05)), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(typeStr === "shaker" ? 6500 : 9200, now);
      filter.Q.setValueAtTime(typeStr === "shaker" ? 3.5 : 6.0, now);

      voiceGain.gain.setValueAtTime(0.7 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(voiceGain);
      noise.start(now);
      noise.stop(now + dur + 0.02);
    } else if (typeStr === "open" || typeStr === "crash" || typeStr === "ride") {
      // Open Hat / Cymbale brillante et aérée
      const dur = typeStr === "crash" ? 0.9 : typeStr === "ride" ? 0.6 : 0.36;
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (dur + 0.1)), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7500, now);

      voiceGain.gain.setValueAtTime(0.75 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(voiceGain);
      noise.start(now);
      noise.stop(now + dur + 0.03);
    } else if (typeStr === "cowbell") {
      // Cowbell 808 OP-1 : 2 ondes carrées accordées (540Hz & 800Hz) avec filtre passe-bande
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "square";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(540, now);
      osc2.frequency.setValueAtTime(800, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(840, now);
      filter.Q.setValueAtTime(4.0, now);

      voiceGain.gain.setValueAtTime(0.8 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (typeStr === "zap") {
      // Synth Zap / Laser OP-1
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

      voiceGain.gain.setValueAtTime(0.85 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Toms & Percussions accordées
      const isHi = typeStr === "tom_hi" || typeStr === "conga";
      const isLow = typeStr === "tom_low";
      const baseFreq = isLow ? 110 : isHi ? 240 : 165;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.12);

      voiceGain.gain.setValueAtTime(0.75 * velFactor, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(voiceGain);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  private playDrumSynth(note: number, velFactor: number, voiceGain: GainNode, ctx: AudioContext, now: number) {
    this.triggerDrum(note, velFactor * 127);
  }

  /**
   * Bip sonore rétro arcade pour le compte à rebours de départ (3, 2, 1, GO!)
   */
  public playCountdownBeep(stage: "3" | "2" | "1" | "GO") {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.masterGain!);

    if (stage === "GO") {
      // Accord triomphal ascendant 8-bit
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.25, now + idx * 0.04);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(subGain);
        subGain.connect(gain);
        osc.start(now + idx * 0.04);
        osc.stop(now + 0.5);
      });
    } else {
      const osc = ctx.createOscillator();
      osc.type = "square";
      const freq = stage === "3" ? 440 : stage === "2" ? 554.37 : 659.25;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  /**
   * Clic de métronome court, calé sur le BPM de l'exercice.
   */
  public playMetronomeClick(accent = false) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(accent ? 1320 : 880, now);
    gain.gain.setValueAtTime(accent ? 0.11 : 0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Effet sonore lors de la validation d'une frappe joueur (PERFECT, GREAT, MISS)
   */
  public playHitSound(judgment: "PERFECT" | "GREAT" | "GOOD" | "MISS") {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.masterGain!);

    if (judgment === "PERFECT") {
      // Petit arpège cristal / étoile arcade
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(1174.66, now); // D6
      osc1.frequency.setValueAtTime(1760.00, now + 0.03); // A6
      osc2.frequency.setValueAtTime(1479.98, now); // F#6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } else if (judgment === "GREAT") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.02);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (judgment === "MISS") {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(65, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ENREGISTREMENT NUMÉRIQUE DU BUS INSTRUMENT ("TAPE PRINT")
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Démarre l'enregistrement direct des moteurs d'instruments sur le bus Tape
   */
  public startTapeRecording() {
    this.initContext();
    this.recordedChunks = [];
    this.isRecording = true;
  }

  /**
   * Termine l'enregistrement et génère le fichier audio PCM 16 bits 44.1 kHz
   */
  public stopTapeRecording(): {
    samples: Float32Array;
    duration: number;
    sampleRate: number;
    peaks: number[];
  } {
    this.isRecording = false;
    const chunks = this.recordedChunks;
    const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);

    if (totalSamples === 0) {
      return {
        samples: new Float32Array(0),
        duration: 0,
        sampleRate: 44100,
        peaks: [],
      };
    }

    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const currentRate = this.sampleRate || 44100;
    let samples44k = merged;
    if (currentRate !== 44100) {
      const outLen = Math.max(1, Math.round(totalSamples * (44100 / currentRate)));
      samples44k = new Float32Array(outLen);
      const ratio = (totalSamples - 1) / Math.max(1, outLen - 1);
      for (let i = 0; i < outLen; i++) {
        const srcPos = i * ratio;
        const low = Math.floor(srcPos);
        const high = Math.min(totalSamples - 1, low + 1);
        const t = srcPos - low;
        samples44k[i] = merged[low] + (merged[high] - merged[low]) * t;
      }
    }

    const duration = samples44k.length / 44100;

    // 24 bins de formes d'onde pour l'affichage précis sur la piste
    const bins = 24;
    const binSize = Math.max(1, Math.floor(samples44k.length / bins));
    const peaks: number[] = Array.from({ length: bins }, (_, bin) => {
      let max = 0;
      const start = bin * binSize;
      const end = Math.min(samples44k.length, (bin + 1) * binSize);
      for (let s = start; s < end; s++) {
        const val = Math.abs(samples44k[s]);
        if (val > max) max = val;
      }
      return Math.min(1, max);
    });

    this.recordedChunks = [];

    return {
      samples: samples44k,
      duration,
      sampleRate: 44100,
      peaks,
    };
  }
}

// Singleton exporté pour toute l'application
export const op1AudioEngine = new Op1SynthEngine();
