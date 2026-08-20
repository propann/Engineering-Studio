"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function Exercises() {
  const [profileName] = useState("NOUVEAU MEMBRE");
  const [activeMode, setActiveMode] = useState<"drumkit" | "melodie" | "accord">("accord");

  const exercises = {
    drumkit: [
      { name: "Groove simple", pattern: "KICK, HAT, SNARE, HAT, KICK, HAT, SNARE, OPEN" },
      { name: "Kick & snare", pattern: "KICK, KICK, SNARE, KICK, KICK, SNARE, KICK, SNARE" },
      { name: "Hi-hat régulier", pattern: "HAT, HAT, HAT, HAT, HAT, HAT, HAT, HAT" },
    ],
    melodie: [
      { name: "Gamme montante", notes: "C, D, E, F, G, A, B, C" },
      { name: "Gamme descendante", notes: "C, B, A, G, F, E, D, C" },
      { name: "Arpège de Do", notes: "C, E, G, C" },
      { name: "Petit air", notes: "E, E, F, G, G, F, E, D, C" },
    ],
    accord: [
      { name: "I–V–vi–IV", chords: "C, G, Am, F (4 temps par accord)" },
      { name: "I–IV–V", chords: "C, F, G (progression classique)" },
      { name: "ii–V–I", chords: "Dm, G, C (jazz progression)" },
      { name: "vi–IV–I–V", chords: "Am, F, C, G (sad progression)" },
    ],
  };

  return (
    <main className="exercises-page" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <h1>🎓 Exercices Engineering Studio</h1>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "30px" }}>
          Entraînement progressif sur OP-1 et EP-133. Commencez par les accords, puis progressez vers les mélodies.
        </p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #383572" }}>
          <button
            onClick={() => setActiveMode("accord")}
            style={{
              padding: "10px 20px",
              background: activeMode === "accord" ? "#00ed95" : "#dfd9ff",
              color: "#383572",
              border: "2px solid #383572",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            🎼 Accords (Niveau 1)
          </button>
          <button
            onClick={() => setActiveMode("melodie")}
            style={{
              padding: "10px 20px",
              background: activeMode === "melodie" ? "#00ed95" : "#dfd9ff",
              color: "#383572",
              border: "2px solid #383572",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            🎵 Mélodies (Niveau 2)
          </button>
          <button
            onClick={() => setActiveMode("drumkit")}
            style={{
              padding: "10px 20px",
              background: activeMode === "drumkit" ? "#00ed95" : "#dfd9ff",
              color: "#383572",
              border: "2px solid #383572",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            🥁 Rhythm (Bonus)
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {activeMode === "accord" && exercises.accord.map((ex, i) => (
            <div key={i} style={{ padding: "20px", background: "#fff", border: "3px solid #383572" }}>
              <h3 style={{ marginBottom: "10px" }}>{ex.name}</h3>
              <code style={{ display: "block", background: "#dfd9ff", padding: "10px", marginBottom: "15px", fontSize: "12px" }}>
                {ex.chords}
              </code>
              <button style={{
                padding: "10px 15px",
                background: "#00ed95",
                color: "#fff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
                width: "100%"
              }}>
                Pratiquer →
              </button>
            </div>
          ))}

          {activeMode === "melodie" && exercises.melodie.map((ex, i) => (
            <div key={i} style={{ padding: "20px", background: "#fff", border: "3px solid #383572" }}>
              <h3 style={{ marginBottom: "10px" }}>{ex.name}</h3>
              <code style={{ display: "block", background: "#dfd9ff", padding: "10px", marginBottom: "15px", fontSize: "12px" }}>
                {ex.notes}
              </code>
              <button style={{
                padding: "10px 15px",
                background: "#00ed95",
                color: "#fff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
                width: "100%"
              }}>
                Pratiquer →
              </button>
            </div>
          ))}

          {activeMode === "drumkit" && exercises.drumkit.map((ex, i) => (
            <div key={i} style={{ padding: "20px", background: "#fff", border: "3px solid #383572" }}>
              <h3 style={{ marginBottom: "10px" }}>{ex.name}</h3>
              <code style={{ display: "block", background: "#dfd9ff", padding: "10px", marginBottom: "15px", fontSize: "12px" }}>
                {ex.pattern}
              </code>
              <button style={{
                padding: "10px 15px",
                background: "#00ed95",
                color: "#fff",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold",
                width: "100%"
              }}>
                Pratiquer →
              </button>
            </div>
          ))}
        </div>

        <section style={{ marginTop: "40px", padding: "20px", background: "#dfd9ff", border: "3px solid #383572" }}>
          <h2>🚀 Comment pratiquer ?</h2>
          <ol style={{ lineHeight: "1.8", fontSize: "16px" }}>
            <li><strong>Ouvrir OP-1 Studio</strong> depuis le Hub</li>
            <li><strong>Sélectionner l'exercice</strong> dans la section Exercices</li>
            <li><strong>Brancher l'OP-1 en USB</strong> et sélectionner l'entrée MIDI</li>
            <li><strong>Appuyer sur les notes</strong> pour que le système les détecte</li>
            <li><strong>Progresser</strong> au niveau suivant quand le niveau actuel est maîtrisé</li>
          </ol>
        </section>
      </section>
    </main>
  );
}
