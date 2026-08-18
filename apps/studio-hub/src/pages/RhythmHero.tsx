"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function RhythmHero() {
  const [profileName] = useState("AZOTH");

  return (
    <main className="game-page" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1>🎮 Rhythm Hero - Entraînement Musical</h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Maîtrisez les patterns et la rhythm avec l'EP-133 grâce à des exercices progressifs et des parties enregistrées
          </p>
          <button
            onClick={() => (window as any).navigateMaquette("outils")}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: "#ebece6",
              border: "2px solid #111",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ← Retour aux outils
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
          <div style={{ padding: "20px", background: "#fff", border: "3px solid #111" }}>
            <h2>📚 À propos</h2>
            <p style={{ lineHeight: "1.8", marginBottom: "15px" }}>
              Rhythm Hero est un jeu d'entraînement interactif conçu pour vous aider à maîtriser les patterns et la synchronisation sur l'EP-133.
            </p>
            <p style={{ lineHeight: "1.8", color: "#666" }}>
              Progresse à travers les niveaux, améliore ta précision et ta vitesse, et déverrouille des récompenses en jouant.
            </p>
          </div>

          <div style={{ padding: "20px", background: "#fff", border: "3px solid #111" }}>
            <h2>⚡ Capacités requises</h2>
            <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
              <li>✅ EP-133 connecté en USB</li>
              <li>✅ Connexion MIDI active</li>
              <li>✅ Pads fonctionnels</li>
              <li>✅ Son en lecture</li>
            </ul>
          </div>
        </div>

        <div style={{ padding: "20px", background: "#f0f0f0", border: "3px solid #111", marginBottom: "30px" }}>
          <h2>🎯 Comment jouer</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" }}>
            <div>
              <h3>1️⃣ Sélectionner un style</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Choisir parmi les styles disponibles (Funk, Electronic, Ambient, etc.)</p>
            </div>
            <div>
              <h3>2️⃣ Choisir le niveau</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Du débutant à expert, progressez à votre rythme</p>
            </div>
            <div>
              <h3>3️⃣ Suivre le pattern</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Notes qui tombent, hit les pads en synchronisation</p>
            </div>
            <div>
              <h3>4️⃣ Marquer des points</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Précision = points, bonnes chaînes = combos bonus</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", background: "#fff", border: "3px solid #111", marginBottom: "30px" }}>
          <h2>📊 Niveaux de difficulté</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
            <tbody>
              <tr style={{ borderBottom: "2px solid #111" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>🟢 Débutant</td>
                <td style={{ padding: "10px" }}>Patterns simples, rythme lent, parfait pour apprendre</td>
              </tr>
              <tr style={{ borderBottom: "2px solid #111" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>🟡 Intermédiaire</td>
                <td style={{ padding: "10px" }}>Patterns mixtes, rythme moyen, bonne progression</td>
              </tr>
              <tr style={{ borderBottom: "2px solid #111" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>🔴 Expert</td>
                <td style={{ padding: "10px" }}>Patterns complexes, rythme rapide, vrai défi</td>
              </tr>
              <tr>
                <td style={{ padding: "10px", fontWeight: "bold" }}>⚫ Maître</td>
                <td style={{ padding: "10px" }}>Ultra-rapide, patterns folles, pour les champions</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", padding: "20px", background: "#d9ff43", border: "3px solid #111" }}>
          <h3>🚀 Prêt à jouer ?</h3>
          <p style={{ marginBottom: "15px", fontSize: "16px" }}>
            Ouvre l'EP-133 Studio pour lancer Rhythm Hero et commence ton entraînement !
          </p>
          <button
            onClick={() => window.location.href = "http://127.0.0.1:5177/?hubTool=game"}
            style={{
              padding: "12px 30px",
              background: "#ff5a1f",
              color: "#fff",
              border: "2px solid #111",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px"
            }}
          >
            Ouvrir Rhythm Hero en EP-133 →
          </button>
        </div>
      </section>
    </main>
  );
}
