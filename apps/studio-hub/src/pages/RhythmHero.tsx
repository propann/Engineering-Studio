"use client";
import React, { useCallback, useRef, useState } from "react";
import { useNotesMidi } from "../core/midi/useNotesMidi";
import { GameGuitarHeroPanel } from "../../../op1-studio/app/components/GameGuitarHeroPanel";
import { AppShell, Button, PageHeader, StatusBadge } from "../ui";
import { readProfileName } from "../core/profile";

export default function RhythmHero() {
  const [profileName] = useState(() => readProfileName());
  const [mode, setMode] = useState<"game" | "guide">("game");
  const [notice, setNotice] = useState<string | null>(null);
  const [pressedMidiNotes, setPressedMidiNotes] = useState<number[]>([]);

  const handleNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  const handleClose = useCallback(() => {
    (window as any).navigateMaquette?.("outils");
  }, []);

  const tenues = useRef(new Set<number>());

  useNotesMidi(
    useCallback(({ note }) => {
      tenues.current.add(note);
      setPressedMidiNotes([...tenues.current]);
    }, []),
    useCallback((note: number) => {
      tenues.current.delete(note);
      setPressedMidiNotes([...tenues.current]);
    }, [])
  );

  return (
    <AppShell activePage="exercises" profileName={profileName} className="game-page rhythm-hero-page">
      <PageHeader
        eyebrow="TRAINING LAB · EP-133 & OP-1"
        title="Rhythm Hero & Finger Drumming"
        description="Jeu de rythme arcade temps réel : cascade de notes, scoring de précision et synchronisation MIDI directe."
        onBack={handleClose}
        status={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Button
              variant={mode === "game" ? "primary" : "secondary"}
              onClick={() => setMode("game")}
            >
              🎮 JOUER
            </Button>
            <Button
              variant={mode === "guide" ? "primary" : "secondary"}
              onClick={() => setMode("guide")}
            >
              📖 GUIDE & NIVEAUX
            </Button>
            <StatusBadge tone="test">Moteur MIDI Actif</StatusBadge>
          </div>
        }
      />

      {notice && (
        <div role="status" className="exercise-notice" style={{ margin: "12px 0" }}>
          <StatusBadge tone="test">{notice}</StatusBadge>
          <Button
            variant="icon"
            aria-label="Fermer le message"
            onClick={() => setNotice(null)}
            icon={<span aria-hidden="true">✕</span>}
          />
        </div>
      )}

      {mode === "game" ? (
        <div className="exercise-game-stage" style={{ marginTop: "16px" }}>
          <GameGuitarHeroPanel
            onClose={handleClose}
            pressedNotes={pressedMidiNotes}
            onNotice={handleNotice}
          />
        </div>
      ) : (
        <section style={{ marginTop: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div style={{ padding: "20px", background: "var(--theme-bg-surface, #151d20)", border: "2px solid var(--theme-border, #2c3b40)", borderRadius: "8px" }}>
              <h2 style={{ color: "var(--theme-accent, #00ed95)", margin: "0 0 10px 0" }}>📚 À propos de Rhythm Hero</h2>
              <p style={{ lineHeight: "1.7", color: "var(--theme-text-main, #edf2f7)", fontSize: "14px" }}>
                Rhythm Hero est le banc d'entraînement arcade interactif du Studio. Chaque note jouée et chaque combo réussi sont comptabilisés dans votre Fiche de Personnage RPG (XP, Titres, Rangs S+ et Trophées).
              </p>
            </div>

            <div style={{ padding: "20px", background: "var(--theme-bg-surface, #151d20)", border: "2px solid var(--theme-border, #2c3b40)", borderRadius: "8px" }}>
              <h2 style={{ color: "#38bdf8", margin: "0 0 10px 0" }}>⚡ Contrôles & Matériel</h2>
              <ul style={{ lineHeight: "1.8", color: "var(--theme-text-main, #edf2f7)", fontSize: "14px", paddingLeft: "20px" }}>
                <li>🎹 Clavier OP-1 ou Pads EP-133 branchés en USB/MIDI</li>
                <li>⌨️ Clavier d'ordinateur (touches Z, S, X, D, C, V, G, B, H...)</li>
                <li>🖱️ Clic souris ou écran tactile sur les touches virtuelles</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "24px", background: "var(--theme-bg-surface, #151d20)", border: "2px solid var(--theme-accent, #00ed95)", borderRadius: "8px" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>🚀 Prêt à relever le défi ?</h3>
            <p style={{ marginBottom: "16px", color: "var(--theme-text-muted, #94a3b8)" }}>
              Lancez une partie, battez votre record et faites monter votre niveau d'opérateur !
            </p>
            <Button variant="primary" onClick={() => setMode("game")}>
              LANCER LE JEU IMMÉDIATEMENT →
            </Button>
          </div>
        </section>
      )}
    </AppShell>
  );
}
