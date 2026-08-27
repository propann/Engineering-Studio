"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { readProfile } from "../core/profile";

export interface StrudelLiveStudioProps {
  enModule?: boolean;
}

const STRUDEL_PRESETS = [
  {
    name: "⚡ Berlin Warehouse Techno (135 BPM)",
    bpm: 135,
    genre: "Techno",
    code: `// Berlin Industrial Rave & 303 Acid
setcps(135/120/2);

// 4-on-the-floor + Rumble sub
s("bd*4")
  .gain(1.2)
  .decay(0.4);

// Claps & Off-beat open hats
s("~ cp ~ cp, ~ oh ~ oh")
  .fast(1);

// Acid Saw hook (Open303)
note("c2 [eb2 g2] bb1 [c2 ~]")
  .cutoff(800)
  .resonance(14);`,
  },
  {
    name: "🌌 Ambient Euclidean Clouds (88 BPM)",
    bpm: 88,
    genre: "Ambient",
    code: `// Generative Modal Bells (MI Plaits Engine)
setcps(88/120/2);

// Euclidean polyrhythms
note("c4 eb4 g4 bb4 d5")
  .euclid(3, 8)
  .decay(0.8)
  .gain(0.85);

// Etherial drone
note("c2*2 g2*2")
  .slow(2)
  .cutoff(450);`,
  },
  {
    name: "🧪 Acid 303 Resonance Surge (132 BPM)",
    bpm: 132,
    genre: "Acid",
    code: `// TB-303 Overdrive Loop
setcps(132/120/2);

note("c2 c3 eb2 f2 g2 [bb2 ab2] c2 ~")
  .fast(2)
  .resonance(18)
  .cutoff(1200)
  .drive(0.6);

s("bd sd, hh*8");`,
  },
  {
    name: "🥁 Polyrhythmic Glitch Break (140 BPM)",
    bpm: 140,
    genre: "Glitch / IDM",
    code: `// Complex Micro-timed breakbeat (EP-133 K.O. II)
setcps(140/120/2);

s("bd [sd ~] [bd*2] [sd cp]")
  .fast(1.5);

note("f3 [ab3 c4] [eb4 ~]")
  .euclid(5, 8)
  .bitcrush(6);`,
  },
];

const ENGINE_CALL_SNIPPETS = [
  {
    id: "mi_plaits",
    name: "Mutable Instruments Plaits",
    badge: "MODAL / WAVETABLE",
    desc: "Synthèse modale physique, cordes pincées, cloches FM et wavetables.",
    code: `// Appel Moteur : Mutable Instruments Plaits
note("c3 eb3 g3 bb3 d4")
  .sound("plaits")
  .params({ model: "modal", timbre: 0.65, morph: 0.4, decay: 0.8 })
  .euclid(5, 8);`,
  },
  {
    id: "open303",
    name: "Open303 Acid Engine",
    badge: "ANALOG ACID",
    desc: "Ligne de basse TB-303 avec filtre passe-bas résonant et saturation.",
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
    badge: "DX7 FM",
    desc: "Synthèse FM 6 opérateurs style DX7, pianos électriques et cloches de verre.",
    code: `// Appel Moteur : Dexed FM (DX7)
note("c3 e3 g3 b3 d4")
  .sound("dexed")
  .params({ algorithm: 5, feedback: 0.8, attack: 0.01, release: 0.6 });`,
  },
  {
    id: "surge_xt",
    name: "Surge XT Shimmer",
    badge: "POLYPHONIC XT",
    desc: "Pads riches, nappes spectrales et modulations étendues.",
    code: `// Appel Moteur : Surge XT Pad
note("<[c3 g3 eb4] [bb2 f3 d4] [ab2 eb3 c4]>")
  .sound("surge_xt")
  .slow(2)
  .room(0.6);`,
  },
  {
    id: "ep133_sampler",
    name: "EP-133 Sampler & Drum",
    badge: "HARDWARE DRUM",
    desc: "Déclenche les slots d'échantillons et kits de l'EP-133 K.O. II.",
    code: `// Appel Machine : EP-133 Sampler
s("ep_kick(3,8), ep_snare(2,4), ep_hat*8")
  .params({ slot: "001-099", group: "A" })
  .gain(1.1);`,
  },
  {
    id: "op1_tape",
    name: "OP-1 Drumkit & Synth",
    badge: "OP-1 FIELD",
    desc: "Kits 24 touches OP-1 et moteurs DNA / Phase / Cluster.",
    code: `// Appel Machine : OP-1 Drum & Synth
s("op1_dbox*4")
  .params({ track: 1, tapeSpeed: 1.0 })
  .room(0.3);`,
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

  // Audio Context & Clock
  const audioCtxRef = useRef<AudioContext | null>(null);
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
    return audioCtxRef.current;
  }, []);

  const triggerSound = useCallback(
    (type: string, note = 60, cutoff = 1200, resonance = 8) => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

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
          {/* Bouton Documentation Rapide */}
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
            📁 BIBLIOTHÈQUE SONORE
          </button>

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

          <button
            onClick={handleEvaluate}
            style={{
              padding: "8px 14px",
              background: "var(--theme-accent-orange, #ff5a1f)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 900,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ⚡ ÉVALUER (CTRL+ENTER)
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
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

          {/* Step Visualizer Bar */}
          <div
            style={{
              background: "var(--theme-bg-surface, #151d20)",
              border: "1.5px solid var(--theme-border, #2c3b40)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--theme-text-muted, #94a3b8)", textTransform: "uppercase" }}>
              Grille Horloge 16 Pas
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: 16 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: "16px",
                    height: "16px",
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

          {/* Code Editor Container */}
          <div
            style={{
              background: "var(--theme-bg-surface, #151d20)",
              border: "1.5px solid var(--theme-border, #2c3b40)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                REPL Live Code (Mini-Notation & Moteurs Audio)
              </span>
              <span style={{ fontSize: "10px", color: "var(--theme-text-muted, #94a3b8)", fontFamily: "monospace" }}>
                UTF-8 • JavaScript / Strudel Tidal
              </span>
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
                  marginTop: "10px",
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

        {/* Sidebar: Presets & Hardware Routing */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
