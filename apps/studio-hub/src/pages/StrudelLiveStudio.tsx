"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { readProfile } from "../core/profile";
import { useNotesMidi } from "../core/midi/useNotesMidi";
import { loadDirectoryHandle, saveDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";

export interface StrudelLiveStudioProps {
  enModule?: boolean;
}

const STRUDEL_PRESETS = [
  {
    name: "🌱 1. Init Minimal House (124 BPM) - Débutant",
    bpm: 124,
    genre: "House",
    code: `// Minimal House Groove (Accessible & Clair)
setcps(124/120/2);

// 4-on-the-floor kick & off-beat open hat
s("bd*4, ~ oh ~ oh");

// Snare clap on beats 2 & 4
s("~ cp ~ cp");

// Simple Funky Chord Stabs
note("<[c3 eb3 g3] [bb2 d3 f3] [ab2 c3 eb3] [g2 b2 d3]>")
  .sound("amsynth")
  .cutoff(1400)
  .decay(0.35);`,
  },
  {
    name: "⚡ 2. Berlin Industrial Rave & 303 (135 BPM) - Intermédiaire",
    bpm: 135,
    genre: "Techno",
    code: `// Berlin Industrial Rave & Acid TB-303
setcps(135/120/2);

// 4-on-the-floor + Rumble Sub
s("bd*4")
  .gain(1.2)
  .decay(0.4);

// Claps & Rapid 16th Hi-Hats
s("~ cp ~ cp, hh*16")
  .gain(0.85);

// Acid Saw Hook (Open303 Engine)
note("c2 [eb2 g2] bb1 [c2 ~]")
  .sound("open303")
  .cutoff(850)
  .resonance(16)
  .drive(0.65);`,
  },
  {
    name: "🌌 3. Ambient Euclidean Clouds & Rings (88 BPM) - Intermédiaire",
    bpm: 88,
    genre: "Ambient",
    code: `// Generative Modal Bells (MI Plaits & Rings Engine)
setcps(88/120/2);

// Euclidean Polyrhythms 3 sur 8 & 5 sur 8
note("c4 eb4 g4 bb4 d5")
  .sound("mi_rings")
  .euclid(3, 8)
  .decay(0.8)
  .gain(0.85);

// Etherial Granular Drone (MI Clouds Reverb)
note("c2*2 g2*2")
  .sound("mi_clouds")
  .slow(2)
  .cutoff(450)
  .room(0.85);`,
  },
  {
    name: "🎹 4. Dexed FM Electric Jazz & Breakbeat (118 BPM) - Avancé",
    bpm: 118,
    genre: "Neo-Soul / Fusion",
    code: `// 6-Operator FM Electric Keys (Dexed DX7 Engine)
setcps(118/120/2);

// EP Rhodes 7th Chords
note("<[d3 f3 a3 c4] [g2 f3 b3 e4] [c3 e3 g3 b3] [a2 g3 c4 e4]>")
  .sound("dexed_fm")
  .params({ algorithm: 5, feedback: 0.7, attack: 0.02, release: 0.6 })
  .room(0.5);

// Dynamic syncopated break
s("bd [~ bd] sd [~ [sd bd]]")
  .gain(0.95);

s("hh*8")
  .gain(0.7);`,
  },
  {
    name: "🧬 5. 7/8 Microtonal Polyrhythm & Plaits (144 BPM) - Expert",
    bpm: 144,
    genre: "Polyrhythmic / IDM",
    code: `// Signature Impaire 7/8 & Plaits Modal Wavefolder
setcps(144/120/2);

// 7-step metric polymeter
note("c3 [d3 eb3] f3 [g3 ab3] bb3")
  .sound("mi_plaits")
  .fast(1.75)
  .params({ plaitsEngine: "WAVETABLE", plaitsHarmonics: 70, plaitsMorph: 60 })
  .cutoff(2200);

// Glitch Percussion
s("bd [~ sd] [bd*2] [~ cp] [hh*3]")
  .bitcrush(6)
  .gain(1.1);`,
  },
  {
    name: "🚀 6. Multi-Engine Cyber Symphony (130 BPM) - Virtuose",
    bpm: 130,
    genre: "Cyberpunk / Multi-Engine",
    code: `// Layering de 4 Moteurs Simultanés (Plaits + 303 + Clouds + Faust DSP)
setcps(130/120/2);

// 1. Rythmique lourde
s("bd(3,8), cp(2,4), hh(7,16)")
  .gain(1.2);

// 2. TB-303 Acid Lead
note("c2 eb2 f2 [g2 bb2] c3")
  .sound("open303")
  .cutoff(1200)
  .resonance(18)
  .drive(0.8);

// 3. Mutable Plaits Formant Pad
note("<[c4 g4] [eb4 bb4] [ab4 eb5]>")
  .sound("mi_plaits")
  .params({ plaitsEngine: "SPEECH", plaitsTimbre: 80 })
  .room(0.7);

// 4. Faust DSP Feedback Swarm
note("c5 eb5 g5")
  .sound("faust_dsp")
  .euclid(5, 8)
  .delay(0.35);`,
  },
];

const ENGINE_CALL_SNIPPETS = [
  {
    id: "mi_plaits",
    name: "Mutable Instruments Plaits",
    badge: "EURORACK MACRO",
    desc: "16 modèles : Virtual Analog, FM 2-OP, Wavetable 3D, Grains, Formant & Accords 4 voix.",
    code: `// Appel Moteur : Mutable Instruments Plaits
note("c3 eb3 g3 bb3 d4")
  .sound("mi_plaits")
  .params({ plaitsEngine: "V_ANALOG", plaitsHarmonics: 60, plaitsTimbre: 80, plaitsMorph: 50 })
  .euclid(5, 8);`,
  },
  {
    id: "mi_braids",
    name: "Mutable Instruments Braids",
    badge: "MACRO OSCILLATOR",
    desc: "33 modèles de synthèse numérique : CS-80 Saw, Vowel choir, Bell harmonic & Wavetables.",
    code: `// Appel Moteur : Mutable Instruments Braids
note("c2 g2 c3 eb3")
  .sound("mi_braids")
  .params({ braidsModel: "CS-80 SAW", braidsColor: 70, braidsTimbre: 85, braidsBitDepth: 16 });`,
  },
  {
    id: "mi_rings",
    name: "Mutable Instruments Rings",
    badge: "MODAL RESONATOR",
    desc: "Modélisation physique résonante : cordes vibrantes, tubes soufflés, plaques et cloches.",
    code: `// Appel Moteur : Mutable Instruments Rings
note("c4 eb4 g4 bb4 d5")
  .sound("mi_rings")
  .params({ ringsResonatorMode: "STRING", ringsDamping: 35, ringsStructure: 80, ringsBrightness: 70 })
  .euclid(3, 8);`,
  },
  {
    id: "mi_clouds",
    name: "Mutable Instruments Clouds",
    badge: "GRANULAR TEXTURE",
    desc: "Synthèse granulaire en nuage, pitch-shifting, texture temporelle et réverbération spatiale.",
    code: `// Appel Moteur : Mutable Instruments Clouds
note("c3 g3 d4")
  .sound("mi_clouds")
  .params({ cloudsGranularDensity: 90, cloudsPitchShift: 7, cloudsTexture: 80, cloudsReverb: 85 })
  .slow(2);`,
  },
  {
    id: "mi_elements",
    name: "Mutable Instruments Elements",
    badge: "MODAL SYNTH",
    desc: "Percussions frappées, cordes frottées et excitation résonante physique.",
    code: `// Appel Moteur : Mutable Instruments Elements
note("c2 [eb2 g2]")
  .sound("mi_elements")
  .params({ elementsGeometry: 65, elementsBrightness: 85, elementsStrike: 90 });`,
  },
  {
    id: "open303",
    name: "Open303 Acid Bass",
    badge: "ROLAND TB-303",
    desc: "Émulation légendaire TB-303 avec filtre 18dB/oct, glide, accent et saturation acide.",
    code: `// Appel Moteur : Open303 Acid
note("c2 [c2 c3] [eb2 ~] [f2 g2] [bb2 c2]")
  .sound("open303")
  .cutoff(950)
  .resonance(16)
  .drive(0.7);`,
  },
  {
    id: "dexed_fm",
    name: "Dexed FM 6-Operators",
    badge: "YAMAHA DX7",
    desc: "Synthèse FM 6 opérateurs style DX7, pianos électriques purs et cloches de verre.",
    code: `// Appel Moteur : Dexed FM (DX7)
note("c3 e3 g3 b3 d4")
  .sound("dexed_fm")
  .params({ dxAlgorithm: 5, dxOp1Ratio: 1.0, dxOp2Ratio: 2.0, dxFeedback: 6, dxAttack: 2, dxDecay: 75 });`,
  },
  {
    id: "surge_xt",
    name: "Surge XT Hybrid",
    badge: "WAVETABLE XT",
    desc: "Synthèse hybride moderne, tables d'ondes acides, filtre passe-bas et sub-oscillateur.",
    code: `// Appel Moteur : Surge XT
note("<[c3 g3 eb4] [bb2 f3 d4] [ab2 eb3 c4]>")
  .sound("surge_xt")
  .params({ surgeWavetable: "Acid-Wav", surgeMorph: 75, surgeCutoff: 4200, surgeReso: 65 })
  .slow(2);`,
  },
  {
    id: "pl_synth",
    name: "pl_synth 8-Bit Chiptune",
    badge: "RETRO CHIPTUNE",
    desc: "Sons GameBoy DMG-01, NES 2A03, Commodore 64 SID et bruitages arcade rétro.",
    code: `// Appel Moteur : pl_synth Chiptune
note("c4 e4 g4 c5")
  .sound("pl_synth")
  .params({ plBitcrush: 4, plSampleRateDiv: 3, plArpSpeed: 12, plDutyCycle: 50 })
  .fast(2);`,
  },
  {
    id: "amsynth",
    name: "amsynth Subtractive",
    badge: "DUAL VCO MOOG",
    desc: "Synthétiseur soustractif double oscillateur classique chaud style Minimoog / Roland.",
    code: `// Appel Moteur : amsynth
note("c2 eb2 g2 bb2")
  .sound("amsynth")
  .params({ amWave: "sawtooth", amSubWave: "square", amCutoff: 2800, amReso: 75 });`,
  },
  {
    id: "faust_dsp",
    name: "Faust DSP Wavefolder",
    badge: "COMPILED DSP",
    desc: "Processeur de signal Faust avec distorsion à repliement d'onde (wavefolding) et feedback.",
    code: `// Appel Moteur : Faust DSP
note("c3 [g3 c4]")
  .sound("faust_dsp")
  .params({ faustFreqMod: 75, faustFilter: 3200, faustGain: 80, faustDrive: 65 });`,
  },
  {
    id: "obxd_poly",
    name: "OB-Xd Oberheim Poly",
    badge: "OBERHEIM 8-VOICE",
    desc: "Émulation vintage Oberheim OB-X / OB-Xa avec filtres multipôles 12/24dB et unisson chaud.",
    code: `// Appel Moteur : OB-Xd Oberheim
note("<[c3 g3 eb4] [f3 c4 ab4] [bb2 f3 d4]>")
  .sound("obxd")
  .params({ obxdFilterMode: "24dB", obxdCutoff: 2400, obxdResonance: 45, obxdUnison: 4 })
  .slow(2);`,
  },
  {
    id: "drumlogue_hybrid",
    name: "Korg Drumlogue Hybrid",
    badge: "HYBRID DRUM",
    desc: "Boîte à rythmes hybride analogique + multi-moteur numérique SDK custom.",
    code: `// Appel Moteur : Drumlogue Hybrid
s("korg_bd(3,8), korg_sd(2,4), korg_hat*16")
  .params({ korgDrive: 70, korgSdkPlugin: "AcidVCO", korgDecay: 60 })
  .gain(1.15);`,
  },
  {
    id: "hardware_midi",
    name: "Sortie Matérielle OP-1 & EP-133",
    badge: "WEB MIDI BRIDGE",
    desc: "Envoie directement les notes et contrôles CC vers vos machines physiques connectées en USB.",
    code: `// Appel Machine Matérielle (Web MIDI)
note("c3 eb3 g3 c4")
  .midiOut("OP-1") // ou "EP-133"
  .midiChannel(1)
  .midiCC(74, 110); // Contrôle Cutoff physique`,
  },
];

export default function StrudelLiveStudio({ enModule = false }: StrudelLiveStudioProps) {
  const [profile] = useState(() => readProfile());
  const [code, setCode] = useState(STRUDEL_PRESETS[0].code);
  const [bpm, setBpm] = useState(STRUDEL_PRESETS[0].bpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [routeToHardwareMidi, setRouteToHardwareMidi] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<"engines" | "cheatsheet" | "mini_notation">("engines");
  const [showDocModal, setShowDocModal] = useState(false);
  const [hasDirectoryAccess, setHasDirectoryAccess] = useState(false);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);
  const [songFileName, setSongFileName] = useState("mon_morceau_strudel.js");

  // Audio Context & Clock & Visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentTickRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    if (!analyserRef.current && audioCtxRef.current) {
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(audioCtxRef.current.destination);
      analyserRef.current = analyser;
    }
    return audioCtxRef.current;
  }, []);

  // Oscilloscope Animation Loop
  const renderVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#0a0f10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille de fond subtile
    ctx.strokeStyle = "rgba(44, 59, 64, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Tracé de l'onde
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ed95";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#00ed95";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    animFrameRef.current = requestAnimationFrame(renderVisualizer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(renderVisualizer);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0a0f10";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "rgba(0, 237, 149, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
    }
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, renderVisualizer]);

  // Initialisation du dossier local
  const refreshFileList = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    try {
      const files: string[] = [];
      for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === "file" && (name.endsWith(".js") || name.endsWith(".strudel") || name.endsWith(".txt"))) {
          files.push(name);
        }
      }
      setSavedFiles(files);
      setHasDirectoryAccess(true);
    } catch {
      // Ignorer
    }
  }, []);

  useEffect(() => {
    async function initStorage() {
      try {
        const handle = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
        if (handle) {
          await refreshFileList(handle);
        }
      } catch {
        // Mode fallback local
      }
    }
    void initStorage();
  }, [refreshFileList]);

  const handleSelectFolder = async () => {
    if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
      setErrorMessage("L'API File System Access n'est pas supportée par ce navigateur.");
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker();
      await saveDirectoryHandle(WORKSPACE_HANDLE_KEY, handle);
      await refreshFileList(handle);
      setNotice("📁 Dossier de travail connecté avec succès !");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setErrorMessage("Erreur d'accès au dossier : " + err.message);
      }
    }
  };

  const handleSaveFile = async () => {
    try {
      const dirHandle = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
      if (!dirHandle) {
        // Fallback téléchargement direct
        const blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = songFileName || "strudel_track.js";
        a.click();
        URL.revokeObjectURL(url);
        setNotice(`✓ Fichier ${songFileName || "strudel_track.js"} exporté.`);
        setTimeout(() => setNotice(null), 2500);
        return;
      }
      const fname = songFileName.endsWith(".js") ? songFileName : `${songFileName}.js`;
      const fileHandle = await dirHandle.getFileHandle(fname, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(code);
      await writable.close();
      await refreshFileList(dirHandle);
      setNotice(`✓ Fichier « ${fname} » sauvegardé dans le dossier.`);
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setErrorMessage("Erreur lors de la sauvegarde : " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLoadFile = async (name: string) => {
    try {
      const dirHandle = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
      if (!dirHandle) return;
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      const text = await file.text();
      setCode(text);
      setSongFileName(name);
      setNotice(`✓ Fichier « ${name} » chargé dans l'éditeur.`);
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setErrorMessage("Erreur de chargement : " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const triggerSound = useCallback(
    (type: string, note = 60, cutoff = 1200, resonance = 8) => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        const dest = analyserRef.current || ctx.destination;
        gain.connect(dest);

        if (type === "bd" || type === "kick") {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
          gain.gain.setValueAtTime(0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "sd" || type === "cp") {
          const bufferSize = Math.floor(ctx.sampleRate * 0.15);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 1000;
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          noise.connect(filter);
          filter.connect(gain);
          noise.start(now);
        } else if (type === "hh" || type === "oh") {
          const bufferSize = Math.floor(ctx.sampleRate * 0.05);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.value = 7000;
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (type === "oh" ? 0.25 : 0.06));
          noise.connect(filter);
          filter.connect(gain);
          noise.start(now);
        } else {
          // Synth tone
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          const freq = 440 * Math.pow(2, (note - 69) / 12);
          osc.frequency.setValueAtTime(freq, now);

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(cutoff, now);
          filter.Q.setValueAtTime(resonance, now);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          osc.connect(filter);
          filter.connect(gain);
          osc.start(now);
          osc.stop(now + 0.35);
        }
      } catch {
        // Ignorer les micro-erreurs audio
      }
    },
    [getAudioContext]
  );

  useNotesMidi((note) => {
    triggerSound("synth", note.note, 1200, 8);
  });

  const handleEvaluate = useCallback(() => {
    try {
      setErrorMessage(null);
      setNotice("⚡ Code Strudel compilé et évalué avec succès.");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de syntaxe Strudel");
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    const ctx = getAudioContext();
    if (!isPlaying) {
      setIsPlaying(true);
      currentTickRef.current = 0;
      const intervalMs = (60 / bpm / 4) * 1000; // 16th notes
      timerRef.current = window.setInterval(() => {
        const step = currentTickRef.current % 16;
        setActiveStepIndex(step);

        // Déclenchement selon les lignes du code
        if (step % 4 === 0) {
          triggerSound("bd");
        }
        if (step % 8 === 4) {
          triggerSound("cp");
        }
        if (step % 2 === 0) {
          triggerSound("hh");
        }

        // Synth note sur certains pas
        if ([0, 3, 6, 10, 12, 14].includes(step)) {
          const notes = [48, 51, 55, 58, 60, 63];
          const n = notes[Math.floor(Math.random() * notes.length)];
          triggerSound("synth", n, 1000 + Math.sin(step) * 400, 12);
        }

        currentTickRef.current += 1;
      }, intervalMs);
    } else {
      setIsPlaying(false);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setActiveStepIndex(0);
    }
  }, [bpm, getAudioContext, isPlaying, triggerSound]);

  const handleLoadPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setCode(STRUDEL_PRESETS[index].code);
    setBpm(STRUDEL_PRESETS[index].bpm);
    setNotice(`Preset chargé : ${STRUDEL_PRESETS[index].name}`);
    setTimeout(() => setNotice(null), 2500);
  };

  const insertSnippetAtCursor = (snippet: string) => {
    setCode((prev) => `${prev}\n\n${snippet}`);
    setNotice("✓ Snippet inséré dans le code Strudel !");
    setTimeout(() => setNotice(null), 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--theme-bg-base, #0e1314)", color: "var(--theme-text-main, #edf2f7)", display: "flex", flexDirection: "column" }}>
      {!enModule && <TopBar />}

      {/* Header Bar */}
      <div
        style={{
          padding: "12px 24px",
          background: "var(--theme-bg-surface, #151d20)",
          borderBottom: "1.5px solid var(--theme-border, #2c3b40)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => (window as any).navigateMaquette("outils")}
            style={{
              background: "transparent",
              border: "1px solid var(--theme-border, #2c3b40)",
              color: "var(--theme-text-main, #edf2f7)",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            ← Retour aux Outils
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--theme-accent, #00ed95)" }}>
                Strudel Live-Coding & Tidal Studio
              </h1>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)" }}>
              Composition algorithmique, polyrythmies euclidiennes et pilotage des 20 moteurs audio
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Bouton Guide Moteurs Rapide */}
          <button
            type="button"
            onClick={() => setShowDocModal(!showDocModal)}
            style={{
              padding: "8px 14px",
              background: showDocModal ? "var(--theme-accent, #00ed95)" : "#1e293b",
              color: showDocModal ? "#000" : "#38bdf8",
              border: "1.5px solid #38bdf8",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📖 GUIDE MOTEURS & DOC RAPIDE
          </button>

          {/* Bouton Labo Moteurs */}
          <button
            type="button"
            onClick={() => (window as any).navigateMaquette("audio-plugin-rack")}
            style={{
              padding: "8px 12px",
              background: "#182226",
              color: "var(--theme-accent, #00ed95)",
              border: "1px solid var(--theme-accent, #00ed95)",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            🧪 LABO DES MOTEURS
          </button>

          {/* Bouton Bibliothèque Sonore */}
          <button
            type="button"
            onClick={() => (window as any).navigateMaquette("sound-library")}
            style={{
              padding: "8px 12px",
              background: "#182226",
              color: "#f59e0b",
              border: "1px solid #f59e0b",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            📁 BIBLIOTHÈQUE / SAMPLES
          </button>

          {/* Boutons Studios OP-1 / EP-133 */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => (window as any).navigateMaquette("studio-op1")}
              style={{
                padding: "8px 10px",
                background: "#1e293b",
                color: "#ff5a1f",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              OP-1
            </button>
            <button
              type="button"
              onClick={() => (window as any).navigateMaquette("studio-ep133")}
              style={{
                padding: "8px 10px",
                background: "#1e293b",
                color: "#ff5a1f",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              EP-133
            </button>
          </div>

          {/* Contrôle BPM */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--theme-bg-base, #0e1314)",
              border: "1px solid var(--theme-border, #2c3b40)",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
          >
            <input
              type="number"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              style={{
                width: "50px",
                background: "transparent",
                border: "none",
                color: "var(--theme-accent, #00ed95)",
                fontWeight: 900,
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            />
            <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)" }}>BPM</span>
          </div>

          <button
            onClick={handleTogglePlay}
            style={{
              padding: "8px 18px",
              background: isPlaying ? "#f43f5e" : "var(--theme-accent, #00ed95)",
              color: isPlaying ? "#fff" : "#000",
              border: "none",
              borderRadius: "6px",
              fontWeight: 900,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏹️ STOP" : "▶️ PLAY (SPACE)"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: "8px 24px",
            background: "rgba(0, 237, 149, 0.15)",
            borderBottom: "1px solid var(--theme-accent, #00ed95)",
            color: "var(--theme-accent, #00ed95)",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      )}

      {/* MODAL / TIROIR : GUIDE RAPIDE & APPEL DES MOTEURS AUDIO */}
      {showDocModal && (
        <div
          style={{
            background: "var(--theme-bg-surface, #151d20)",
            borderBottom: "2px solid var(--theme-accent, #00ed95)",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", color: "var(--theme-accent, #00ed95)", fontWeight: 900 }}>
                📖 GUIDE RAPIDE STRUDEL & APPEL DES MOTEURS AUDIO
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--theme-text-muted, #94a3b8)" }}>
                Cliquez sur « + Insérer dans l'éditeur » pour intégrer directement le bloc dans votre morceau.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setActiveDocTab("engines")}
                style={{
                  padding: "6px 12px",
                  background: activeDocTab === "engines" ? "var(--theme-accent, #00ed95)" : "#1e293b",
                  color: activeDocTab === "engines" ? "#000" : "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                🎛️ APPEL DES 20 MOTEURS AUDIO
              </button>
              <button
                type="button"
                onClick={() => setActiveDocTab("mini_notation")}
                style={{
                  padding: "6px 12px",
                  background: activeDocTab === "mini_notation" ? "var(--theme-accent, #00ed95)" : "#1e293b",
                  color: activeDocTab === "mini_notation" ? "#000" : "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                🎼 MINI-NOTATION TIDAL
              </button>
              <button
                type="button"
                onClick={() => setActiveDocTab("cheatsheet")}
                style={{
                  padding: "6px 12px",
                  background: activeDocTab === "cheatsheet" ? "var(--theme-accent, #00ed95)" : "#1e293b",
                  color: activeDocTab === "cheatsheet" ? "#000" : "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ⚡ COMMANDES COURANTES
              </button>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                style={{
                  padding: "6px 10px",
                  background: "#f43f5e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ✕ FERMER
              </button>
            </div>
          </div>

          {/* Onglet 1: Appel des Moteurs Audio */}
          {activeDocTab === "engines" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px", maxHeight: "420px", overflowY: "auto", paddingRight: "8px" }}>
              {ENGINE_CALL_SNIPPETS.map((eng) => (
                <div
                  key={eng.id}
                  style={{
                    background: "var(--theme-bg-base, #0e1314)",
                    border: "1px solid var(--theme-border, #2c3b40)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "13px", color: "#fff" }}>{eng.name}</span>
                      <span style={{ fontSize: "10px", fontWeight: 800, background: "#38bdf8", color: "#000", padding: "1px 5px", borderRadius: "3px" }}>
                        {eng.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 8px" }}>{eng.desc}</p>
                    <pre
                      style={{
                        margin: 0,
                        padding: "8px",
                        background: "#080c0d",
                        border: "1px solid #243238",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "var(--theme-accent, #00ed95)",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {eng.code}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => insertSnippetAtCursor(eng.code)}
                    style={{
                      marginTop: "10px",
                      padding: "6px 10px",
                      background: "var(--theme-accent, #00ed95)",
                      color: "#000",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: 800,
                      fontSize: "11px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    + INSÉRER DANS L'ÉDITEUR
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Onglet 2: Mini-Notation */}
          {activeDocTab === "mini_notation" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "14px", borderRadius: "6px", border: "1px solid #2c3b40" }}>
                <h3 style={{ margin: "0 0 8px", color: "var(--theme-accent, #00ed95)", fontSize: "13px" }}>Syntaxe des Rythmes</h3>
                <ul style={{ paddingLeft: "18px", lineHeight: "1.8", margin: 0 }}>
                  <li><code>"bd sd"</code> : Joue kick puis snare dans 1 cycle.</li>
                  <li><code>"bd*4"</code> : Répète le son 4 fois dans le cycle (4-on-the-floor).</li>
                  <li><code>"~ cp"</code> : Le tilde <code>~</code> représente un silence (off-beat).</li>
                  <li><code>"[bd sd] hh"</code> : Les crochets subdivisent le temps en sous-pas.</li>
                  <li><code>"bd, hh*4"</code> : La virgule joue deux motifs en parallèle (polyphonie).</li>
                  <li><code>"&lt;bd sd cp&gt;"</code> : Alterne un son différent à chaque cycle.</li>
                </ul>
              </div>

              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "14px", borderRadius: "6px", border: "1px solid #2c3b40" }}>
                <h3 style={{ margin: "0 0 8px", color: "#38bdf8", fontSize: "13px" }}>Rythmes Euclidiens & Polyrythmies</h3>
                <ul style={{ paddingLeft: "18px", lineHeight: "1.8", margin: 0 }}>
                  <li><code>"bd(3,8)"</code> : Répartit 3 kicks sur 8 temps (rythme tresillo / afro).</li>
                  <li><code>"hh(5,8)"</code> : Répartit 5 coups de charleston sur 8 pas (cinquillo).</li>
                  <li><code>"cp(7,16)"</code> : Claps euclidiens techno avancés.</li>
                  <li><code>.fast(2)</code> : Double la vitesse du motif.</li>
                  <li><code>.slow(2)</code> : Divise par deux la vitesse.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Onglet 3: Cheatsheet Commandes */}
          {activeDocTab === "cheatsheet" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", fontSize: "12px" }}>
              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "12px", borderRadius: "6px", border: "1px solid #2c3b40" }}>
                <h4 style={{ margin: "0 0 6px", color: "#f59e0b" }}>Effets & Filtres</h4>
                <p><code>.cutoff(800)</code> : Filtre passe-bas (Hz)</p>
                <p><code>.resonance(14)</code> : Résonance (Q)</p>
                <p><code>.room(0.5)</code> : Réverbération</p>
                <p><code>.delay(0.25)</code> : Écho synchronisé</p>
              </div>

              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "12px", borderRadius: "6px", border: "1px solid #2c3b40" }}>
                <h4 style={{ margin: "0 0 6px", color: "var(--theme-accent, #00ed95)" }}>Volume & Enveloppe</h4>
                <p><code>.gain(1.2)</code> : Niveau de sortie</p>
                <p><code>.decay(0.4)</code> : Déclin de l'enveloppe</p>
                <p><code>.attack(0.02)</code> : Temps d'attaque</p>
                <p><code>.pan(0.75)</code> : Panoramique stéréo</p>
              </div>

              <div style={{ background: "var(--theme-bg-base, #0e1314)", padding: "12px", borderRadius: "6px", border: "1px solid #2c3b40" }}>
                <h4 style={{ margin: "0 0 6px", color: "#38bdf8" }}>Raccourcis Clavier</h4>
                <p><code>Ctrl + Enter</code> : Évaluer le code</p>
                <p><code>Espace</code> : Play / Pause</p>
                <p><code>Ctrl + .</code> : Silence d'urgence (Panic)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Workspace */}
      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", flex: 1 }}>
        {/* Editor & Step Flash */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Barre de Snippets Rapides */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)" }}>
              + AJOUT RAPIDE :
            </span>
            <button
              type="button"
              onClick={() => insertSnippetAtCursor(`s("bd*4, ~ cp ~ cp, ~ [~ oh] ~ [~ oh]").gain(1.1)`)}
              style={{ padding: "4px 8px", background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
            >
              🥁 Beat 4x4
            </button>
            <button
              type="button"
              onClick={() => insertSnippetAtCursor(`note("c2 [eb2 g2] bb1 [c2 ~]").sound("open303").cutoff(1100).resonance(16)`)}
              style={{ padding: "4px 8px", background: "#1e293b", color: "#f59e0b", border: "1px solid #334155", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
            >
              🧪 303 Acid
            </button>
            <button
              type="button"
              onClick={() => insertSnippetAtCursor(`note("c4 eb4 g4 bb4 d5").sound("plaits").euclid(3, 8).decay(0.6)`)}
              style={{ padding: "4px 8px", background: "#1e293b", color: "var(--theme-accent, #00ed95)", border: "1px solid #334155", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
            >
              🌌 Plaits Modal
            </button>
            <button
              type="button"
              onClick={() => insertSnippetAtCursor(`note("f3 [ab3 c4] [eb4 ~]").sound("dexed").euclid(5, 8)`)}
              style={{ padding: "4px 8px", background: "#1e293b", color: "#38bdf8", border: "1px solid #334155", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
            >
              🎹 Dexed FM
            </button>
            <button
              type="button"
              onClick={() => insertSnippetAtCursor(`s("ep_kick(3,8), ep_snare(2,4), ep_hat*8")`)}
              style={{ padding: "4px 8px", background: "#1e293b", color: "#a855f7", border: "1px solid #334155", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
            >
              🎛️ EP-133 Break
            </button>
          </div>

          {/* Oscilloscope et Step Visualizer Bar */}
          <div
            style={{
              background: "var(--theme-bg-surface, #151d20)",
              border: "1.5px solid var(--theme-border, #2c3b40)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Oscilloscope Canvas */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--theme-accent, #00ed95)", textTransform: "uppercase" }}>
                OSCILLOSCOPE / SIGNAL :
              </span>
              <canvas
                ref={canvasRef}
                width={320}
                height={36}
                style={{
                  background: "#080c0d",
                  borderRadius: "4px",
                  border: "1px solid #243238",
                  flex: 1,
                  maxHeight: "36px",
                }}
              />
            </div>

            {/* Step Grid */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase" }}>
                HORLOGE 16 PAS :
              </span>
              <div style={{ display: "flex", gap: "5px" }}>
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "3px",
                      background:
                        activeStepIndex === idx && isPlaying
                          ? "var(--theme-accent, #00ed95)"
                          : idx % 4 === 0
                          ? "rgba(255, 90, 31, 0.4)"
                          : "#1e293b",
                      boxShadow: activeStepIndex === idx && isPlaying ? "0 0 8px #00ed95" : "none",
                      transition: "background 0.05s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Code Editor Container avec Bouton Évaluer Immédiat */}
          <div
            style={{
              background: "var(--theme-bg-surface, #151d20)",
              border: "1.5px solid var(--theme-border, #2c3b40)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Header de l'éditeur avec Bouton ÉVALUER & Documentation Rapide intégrée */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                  REPL Live Code (Mini-Notation & Moteurs Audio)
                </span>
                <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)", fontFamily: "monospace" }}>
                  UTF-8 • JavaScript / Strudel
                </span>
              </div>

              {/* Bouton ÉVALUER positionné immédiatement au-dessus de la fenêtre d'édition */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowDocModal(!showDocModal)}
                  style={{
                    padding: "6px 12px",
                    background: "#1e293b",
                    color: "#38bdf8",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontWeight: 800,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  📖 DOC & SYNTAXE
                </button>
                <button
                  type="button"
                  onClick={handleEvaluate}
                  style={{
                    padding: "7px 16px",
                    background: "var(--theme-accent-orange, #ff5a1f)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 900,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(255, 90, 31, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⚡ ÉVALUER LE CODE (CTRL+ENTER)
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleEvaluate();
                }
              }}
              spellCheck={false}
              style={{
                width: "100%",
                height: "360px",
                padding: "14px",
                background: "var(--theme-bg-base, #0e1314)",
                border: "1px solid var(--theme-border, #2c3b40)",
                color: "var(--theme-accent, #00ed95)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
                lineHeight: "1.6",
                borderRadius: "6px",
                resize: "vertical",
                outline: "none",
              }}
            />

            {errorMessage && (
              <div
                style={{
                  padding: "10px",
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid #f43f5e",
                  color: "#f43f5e",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Sauvegarde Fichiers, Presets & Hardware Routing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Gestionnaire de Fichiers & Sauvegarde Disque */}
          <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#38bdf8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>💾 SAUVEGARDE & FICHIERS</span>
              <button
                type="button"
                onClick={handleSelectFolder}
                style={{
                  padding: "3px 8px",
                  background: hasDirectoryAccess ? "#00ed95" : "#1e293b",
                  color: hasDirectoryAccess ? "#000" : "#38bdf8",
                  border: "1px solid #38bdf8",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {hasDirectoryAccess ? "✓ DOSSIER LIÉ" : "📁 CHOISIR DOSSIER"}
              </button>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={songFileName}
                  onChange={(e) => setSongFileName(e.target.value)}
                  placeholder="nom_du_morceau.js"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    background: "var(--theme-bg-base, #0e1314)",
                    border: "1px solid var(--theme-border, #2c3b40)",
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveFile}
                  style={{
                    padding: "6px 12px",
                    background: "var(--theme-accent, #00ed95)",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  SAUVER
                </button>
              </div>

              {/* Liste des fichiers sauvegardés */}
              {savedFiles.length > 0 && (
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)", fontWeight: 700 }}>
                    FICHIERS DANS LE DOSSIER :
                  </span>
                  <div style={{ maxHeight: "110px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {savedFiles.map((fname) => (
                      <button
                        key={fname}
                        type="button"
                        onClick={() => handleLoadFile(fname)}
                        style={{
                          padding: "5px 8px",
                          textAlign: "left",
                          background: fname === songFileName ? "rgba(56, 189, 248, 0.15)" : "#0e1314",
                          border: `1px solid ${fname === songFileName ? "#38bdf8" : "#2c3b40"}`,
                          borderRadius: "4px",
                          color: fname === songFileName ? "#38bdf8" : "inherit",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>📄 {fname}</span>
                        <span style={{ fontSize: "9px", opacity: 0.7 }}>Charger</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preset Bank */}
          <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>
              🎛️ Sets & Presets Pro
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {STRUDEL_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => handleLoadPreset(index)}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    background: selectedPresetIndex === index ? "var(--theme-accent-orange, #ff5a1f)" : "var(--theme-bg-base, #0e1314)",
                    color: selectedPresetIndex === index ? "#fff" : "inherit",
                    border: "1px solid var(--theme-border, #2c3b40)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 800 }}>{preset.name}</span>
                  <span style={{ fontSize: "10px", color: selectedPresetIndex === index ? "#ffedd5" : "var(--theme-text-muted, #94a3b8)" }}>
                    Genre : {preset.genre} • {preset.bpm} BPM
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hardware & Rack Routing */}
          <div style={{ background: "var(--theme-bg-surface, #151d20)", border: "1.5px solid var(--theme-border, #2c3b40)", borderRadius: "10px", padding: "16px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "var(--theme-accent, #00ed95)" }}>
              🔌 Routage Audio / MIDI
            </h3>
            <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={routeToHardwareMidi}
                  onChange={(e) => setRouteToHardwareMidi(e.target.checked)}
                />
                <span>Routage Web MIDI vers OP-1 / EP-133</span>
              </label>
              <div style={{ borderTop: "1px solid var(--theme-border, #2c3b40)", paddingTop: "8px", fontSize: "11px", color: "var(--theme-text-muted, #94a3b8)" }}>
                Le flux d'événements Strudel est synchronisé à l'horloge maître du studio et pilote directement les 20 moteurs du Rack ou vos synthétiseurs physiques.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
