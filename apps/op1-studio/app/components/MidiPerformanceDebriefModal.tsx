"use client";
/**
 * MidiPerformanceDebriefModal.tsx — Modale de Bilan de Fin de Partie & Comparateur MIDI Joueur vs Partition.
 * 
 * Fonctionnalités Clés :
 * 1. Arrêt automatique & Débriefing immédiat à la fin du morceau.
 * 2. Visualisation comparative Piano-Roll : Partition Théorique vs Jeu Réel Enregistré du Joueur.
 * 3. Analyse de précision, timing moyen en millisecondes (avance/retard) et régularité rythmique.
 * 4. Mise à jour instantanée de la Fiche de Personnage unifiée (XP, niveau, rangs, historique).
 * 5. Actions rapides : Rejouer, Consulter la Fiche, Changer d'Exercice, Exporter l'Enregistrement.
 */

import React, { useState, useMemo } from "react";
import type { GameSongTheme, GameNote } from "../lib/gameSongsCatalog";
import type { CharacterProfile, CharacterAchievement } from "../lib/characterProfile";

export type HitJudgment = "PERFECT" | "GREAT" | "GOOD" | "MISS";

export interface RecordedPlayerEvent {
  id: string;
  note: number;
  timestampSeconds: number;
  velocity: number;
  judgment: HitJudgment | "EXTRA";
  timingDiffMs: number; // ex: -12ms (avance), +24ms (retard)
  matchedTargetStartSeconds?: number;
  matchedTargetLabel?: string;
}

export interface DebriefModalProps {
  isOpen: boolean;
  song: GameSongTheme;
  score: number;
  accuracy: number;
  rank: "S+" | "S" | "A" | "B" | "C" | "D";
  maxCombo: number;
  sessionStats: {
    perfect: number;
    great: number;
    good: number;
    miss: number;
    totalNotes: number;
  };
  recordedEvents: RecordedPlayerEvent[];
  xpEarned: number;
  newLevel: boolean;
  newAchievements: CharacterAchievement[];
  profile: CharacterProfile;
  onReplay: () => void;
  onViewProfile: () => void;
  onBrowseCatalog: () => void;
  onClose: () => void;
}

export function MidiPerformanceDebriefModal({
  isOpen,
  song,
  score,
  accuracy,
  rank,
  maxCombo,
  sessionStats,
  recordedEvents,
  xpEarned,
  newLevel,
  newAchievements,
  profile,
  onReplay,
  onViewProfile,
  onBrowseCatalog,
  onClose,
}: DebriefModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Calcul du timing moyen et de la dispersion (jitter)
  const timingAnalysis = useMemo(() => {
    const validHits = recordedEvents.filter(
      (e) => e.judgment === "PERFECT" || e.judgment === "GREAT" || e.judgment === "GOOD"
    );
    if (validHits.length === 0) {
      return { avgMs: 0, stdDevMs: 0, count: 0, text: "Aucune note synchronisée" };
    }

    const sum = validHits.reduce((acc, curr) => acc + curr.timingDiffMs, 0);
    const avg = Math.round(sum / validHits.length);

    const variance =
      validHits.reduce((acc, curr) => acc + Math.pow(curr.timingDiffMs - avg, 2), 0) / validHits.length;
    const stdDev = Math.round(Math.sqrt(variance));

    let text = "Précision millimétrée";
    if (avg < -20) text = "Légère tendance à jouer en avance";
    else if (avg > 20) text = "Légère tendance à jouer en retard";
    else text = "Excellent calage sur le tempo";

    return { avgMs: avg, stdDevMs: stdDev, count: validHits.length, text };
  }, [recordedEvents]);

  // Exportation de la session MIDI enregistrée
  const handleExportRecording = () => {
    const exportData = {
      app: "OP-1 Studio Academy & Arcadia",
      timestamp: new Date().toISOString(),
      song: {
        id: song.id,
        title: song.title,
        category: song.category,
        bpm: song.bpm,
        durationSeconds: song.durationSeconds,
      },
      playerProfile: {
        name: profile.operatorName,
        level: profile.level,
        title: profile.title,
      },
      performance: {
        score,
        accuracy,
        rank,
        maxCombo,
        timingAnalysis,
        sessionStats,
        xpEarned,
      },
      recordedMidiEvents: recordedEvents,
      targetPartition: song.notes,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `op1_midi_performance_${song.id}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  // Couleurs selon le Rang
  const rankColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    "S+": { bg: "#00ED95", border: "#00ED95", glow: "rgba(0, 237, 149, 0.6)", text: "#000000" },
    S: { bg: "#38bdf8", border: "#38bdf8", glow: "rgba(56, 189, 248, 0.6)", text: "#000000" },
    A: { bg: "#fbbf24", border: "#fbbf24", glow: "rgba(251, 191, 36, 0.6)", text: "#000000" },
    B: { bg: "#a855f7", border: "#a855f7", glow: "rgba(168, 85, 247, 0.6)", text: "#ffffff" },
    C: { bg: "#f97316", border: "#f97316", glow: "rgba(249, 115, 22, 0.6)", text: "#ffffff" },
    D: { bg: "#FF3A5D", border: "#FF3A5D", glow: "rgba(255, 58, 93, 0.6)", text: "#ffffff" },
  };

  const rankStyle = rankColors[rank] || rankColors["D"];

  // Notes distinctes présentes dans le morceau (ordonnées pour l'axe vertical du Piano-Roll)
  const allUsedNotes = Array.from(
    new Set([...song.notes.map((n) => n.note), ...recordedEvents.map((e) => e.note)])
  ).sort((a, b) => a - b);

  const duration = Math.max(song.durationSeconds, 4);
  const pxPerSecond = 85 * zoomLevel;
  const timelineWidth = Math.max(800, duration * pxPerSecond);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'JetBrains Mono', 'Segoe UI', monospace",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          maxHeight: "92vh",
          backgroundColor: "#0c1017",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 237, 149, 0.15)",
        }}
      >
        {/* ── EN-TÊTE MODALE AVEC TITRE & RANG ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "linear-gradient(90deg, #111827 0%, #0f172a 100%)",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>👾</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#f8fafc", margin: 0 }}>
                  SESSION TERMINÉE · {song.title.toUpperCase()}
                </h2>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(56, 189, 248, 0.2)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                  }}
                >
                  NIVEAU {song.level} · {song.difficulty}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                Enregistrement MIDI synchronisé · Analyse des frappes et mise à jour du profil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#1e293b",
              border: "none",
              color: "#94a3b8",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* ── CORPS DE LA MODALE SCROLLABLE ── */}
        <div
          style={{
            padding: "18px 20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* BANDEAU SUPÉRIEUR : BADGE DE RANG + STATS GLOBALES */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "16px",
              background: "#080c10",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "16px",
              alignItems: "center",
            }}
          >
            {/* 1. Grand Badge de Rang */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle, #1e293b 0%, #0c1017 100%)",
                border: `2px solid ${rankStyle.border}`,
                borderRadius: "10px",
                padding: "12px",
                boxShadow: `0 0 25px ${rankStyle.glow}`,
              }}
            >
              <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                RANG OBTENU
              </span>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 900,
                  color: rankStyle.bg,
                  textShadow: `0 0 16px ${rankStyle.bg}`,
                  lineHeight: 1.1,
                }}
              >
                {rank}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#f8fafc" }}>
                {accuracy}% Précision
              </span>
            </div>

            {/* 2. Grille des Scores, Combo, XP & Timing */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                <div style={{ background: "#111822", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Score Final</span>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#00ED95" }}>{score.toLocaleString()}</div>
                </div>

                <div style={{ background: "#111822", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Max Combo</span>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#38bdf8" }}>{maxCombo}</div>
                </div>

                <div style={{ background: "#111822", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Gain d'XP</span>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#a855f7" }}>+{xpEarned} XP</div>
                </div>

                <div style={{ background: "#111822", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                  <span style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>Timing Moyen</span>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: timingAnalysis.avgMs < 0 ? "#38bdf8" : "#fbbf24" }}>
                    {timingAnalysis.avgMs > 0 ? `+${timingAnalysis.avgMs}` : timingAnalysis.avgMs} ms
                  </div>
                </div>
              </div>

              {/* Ligne des Jugements détaillés */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#111822",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #1e293b",
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", gap: "14px" }}>
                  <span><strong style={{ color: "#00ED95" }}>PERFECT :</strong> {sessionStats.perfect}</span>
                  <span><strong style={{ color: "#38bdf8" }}>GREAT :</strong> {sessionStats.great}</span>
                  <span><strong style={{ color: "#fbbf24" }}>GOOD :</strong> {sessionStats.good}</span>
                  <span><strong style={{ color: "#FF3A5D" }}>MISS :</strong> {sessionStats.miss}</span>
                  <span><strong style={{ color: "#94a3b8" }}>EXTRA :</strong> {recordedEvents.filter((e) => e.judgment === "EXTRA").length}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontStyle: "italic" }}>
                  {timingAnalysis.text} (dispersion ±{timingAnalysis.stdDevMs}ms)
                </div>
              </div>

              {/* Notification Level Up / Trophées débloqués */}
              {(newLevel || newAchievements.length > 0) && (
                <div
                  style={{
                    background: "rgba(0, 237, 149, 0.12)",
                    border: "1px solid #00ED95",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                    color: "#00ED95",
                  }}
                >
                  <span>🎉</span>
                  <span>
                    {newLevel && `FÉLICITATIONS ! Vous passez Niveau ${profile.level} : "${profile.title}" ! `}
                    {newAchievements.length > 0 && `Nouveau trophée débloqué : ${newAchievements[0].title} (${newAchievements[0].icon})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              COMPARATEUR VISUEL PIANO-ROLL : PARTITION CIBLE VS JEU RÉEL
             ══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              background: "#080c10",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>🎹</span>
                <strong style={{ fontSize: "12px", color: "#f8fafc" }}>
                  Comparateur Visuel Interactif : Partition Cible vs Jeu Réel Enregistré
                </strong>
              </div>

              {/* Contrôles de zoom & Légende */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", background: "rgba(56, 189, 248, 0.4)", border: "1px solid #38bdf8", borderRadius: "2px" }} />
                    <span style={{ color: "#94a3b8" }}>Partition Cible</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#00ED95", borderRadius: "50%" }} />
                    <span style={{ color: "#94a3b8" }}>Frappe Réussie (P/G)</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#FF3A5D", borderRadius: "2px" }} />
                    <span style={{ color: "#94a3b8" }}>Miss</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#f59e0b", borderRadius: "50%" }} />
                    <span style={{ color: "#94a3b8" }}>Extra / Fausse Note</span>
                  </span>
                </div>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    style={{ background: "#1e293b", border: "none", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px" }}
                  >
                    🔍 -
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    style={{ background: "#1e293b", border: "none", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "10px" }}
                  >
                    🔍 +
                  </button>
                </div>
              </div>
            </div>

            {/* Zone de défilement horizontal du Piano-Roll */}
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                background: "#04070c",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              <div style={{ width: `${timelineWidth}px`, position: "relative" }}>
                {/* Règle temporelle en secondes */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #1e293b",
                    paddingBottom: "4px",
                    marginBottom: "6px",
                    fontSize: "9px",
                    color: "#64748b",
                  }}
                >
                  {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => (
                    <div
                      key={`sec-${sec}`}
                      style={{
                        position: "absolute",
                        left: `${sec * pxPerSecond}px`,
                        transform: "translateX(-50%)",
                        textAlign: "center",
                      }}
                    >
                      {sec}s
                    </div>
                  ))}
                </div>

                {/* Grille des touches et des pistes */}
                <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {allUsedNotes.map((noteNum) => {
                    const targetNotesOnRow = song.notes.filter((n) => n.note === noteNum);
                    const playerNotesOnRow = recordedEvents.filter((e) => e.note === noteNum);
                    const noteName = `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][noteNum % 12]}${
                      Math.floor(noteNum / 12) - 1
                    }`;
                    const label = targetNotesOnRow[0]?.label || noteName;

                    return (
                      <div
                        key={`row-${noteNum}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "22px",
                          position: "relative",
                          borderBottom: "1px dashed rgba(30, 41, 59, 0.4)",
                        }}
                      >
                        {/* Libellé de touche à gauche fixe */}
                        <div
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                            width: "60px",
                            background: "#0f172a",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#38bdf8",
                            border: "1px solid #1e293b",
                          }}
                        >
                          {label}
                        </div>

                        {/* Piste des notes théoriques de la partition */}
                        {targetNotesOnRow.map((tn, tIdx) => {
                          const left = tn.startSeconds * pxPerSecond + 70;
                          const width = Math.max(16, (tn.durationSeconds || 0.4) * pxPerSecond);

                          return (
                            <div
                              key={`target-${tIdx}-${tn.startSeconds}`}
                              style={{
                                position: "absolute",
                                left: `${left}px`,
                                width: `${width}px`,
                                height: "16px",
                                background: "rgba(56, 189, 248, 0.2)",
                                border: "1px solid rgba(56, 189, 248, 0.6)",
                                borderRadius: "3px",
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                color: "#94a3b8",
                              }}
                              title={`Partition Cible : ${tn.label} à ${tn.startSeconds.toFixed(2)}s`}
                            >
                              {tn.label}
                            </div>
                          );
                        })}

                        {/* Piste des frappes enregistrées du joueur */}
                        {playerNotesOnRow.map((pe) => {
                          const left = pe.timestampSeconds * pxPerSecond + 70;
                          const isPerfect = pe.judgment === "PERFECT";
                          const isGreat = pe.judgment === "GREAT";
                          const isGood = pe.judgment === "GOOD";
                          const isExtra = pe.judgment === "EXTRA";

                          const dotColor = isPerfect
                            ? "#00ED95"
                            : isGreat
                            ? "#38bdf8"
                            : isGood
                            ? "#fbbf24"
                            : "#f59e0b";

                          const isSelected = selectedEventId === pe.id;

                          return (
                            <div
                              key={pe.id}
                              onClick={() => setSelectedEventId(pe.id)}
                              style={{
                                position: "absolute",
                                left: `${left}px`,
                                transform: "translateX(-50%)",
                                width: isSelected ? "18px" : "14px",
                                height: isSelected ? "18px" : "14px",
                                borderRadius: "50%",
                                background: dotColor,
                                border: isSelected ? "2px solid #ffffff" : "1px solid #000000",
                                zIndex: 5,
                                cursor: "pointer",
                                boxShadow: isSelected ? `0 0 10px ${dotColor}` : "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "7px",
                                fontWeight: 900,
                                color: "#000000",
                              }}
                              title={`Joué à ${pe.timestampSeconds.toFixed(2)}s (${pe.judgment}) · Décalage : ${pe.timingDiffMs > 0 ? `+${pe.timingDiffMs}` : pe.timingDiffMs}ms`}
                            >
                              {isPerfect ? "P" : isGreat ? "G" : isGood ? "OK" : "!"}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Détail de l'événement MIDI sélectionné */}
            {selectedEventId && (
              <div
                style={{
                  background: "#111822",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {(() => {
                  const ev = recordedEvents.find((e) => e.id === selectedEventId);
                  if (!ev) return null;
                  return (
                    <>
                      <span>
                        🎯 Note Jouée : <strong style={{ color: "#ffffff" }}>{ev.matchedTargetLabel || ev.note}</strong> à{" "}
                        <strong style={{ color: "#38bdf8" }}>{ev.timestampSeconds.toFixed(2)}s</strong>
                      </span>
                      <span>
                        Jugement : <strong style={{ color: ev.judgment === "PERFECT" ? "#00ED95" : "#38bdf8" }}>{ev.judgment}</strong>
                      </span>
                      <span>
                        Décalage :{" "}
                        <strong style={{ color: Math.abs(ev.timingDiffMs) <= 15 ? "#00ED95" : "#fbbf24" }}>
                          {ev.timingDiffMs > 0 ? `+${ev.timingDiffMs}` : ev.timingDiffMs} ms
                        </strong>{" "}
                        ({ev.timingDiffMs < 0 ? "en avance" : ev.timingDiffMs === 0 ? "parfait" : "en retard"})
                      </span>
                      <span>
                        Vélocité : <strong style={{ color: "#f8fafc" }}>{ev.velocity}</strong>
                      </span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── PIED DE MODALE : BOUTONS D'ACTIONS ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "#080c10",
            borderTop: "1px solid #1e293b",
          }}
        >
          <button
            type="button"
            onClick={handleExportRecording}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "6px",
              border: "1px solid #334155",
              background: "#111822",
              color: "#38bdf8",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>📥</span>
            <span>Exporter Enregistrement (JSON)</span>
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onBrowseCatalog}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: "#111822",
                color: "#e2e8f0",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📚 Choisir un autre exercice
            </button>

            <button
              type="button"
              onClick={onViewProfile}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #a855f7",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📊 Voir ma Fiche de Jeu
            </button>

            <button
              type="button"
              onClick={onReplay}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                background: "#00ED95",
                color: "#000000",
                fontSize: "12px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(0, 237, 149, 0.4)",
              }}
            >
              <span>🔁</span>
              <span>Rejouer l'exercice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
