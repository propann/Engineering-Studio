"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function ExercisesOP1() {
  const [profileName] = useState("AZOTH");

  return (
    <main className="exercises-page" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1>🎹 Exercices OP-1 - Entraînement Musical</h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Maîtrisez les accords, les mélodies et les rythmes avec votre OP-1 grâce à des exercices interactifs
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
              Exercices OP-1 est un module d'entraînement interactif conçu pour développer votre maîtrise musicale.
            </p>
            <p style={{ lineHeight: "1.8", color: "#666" }}>
              Progresse à travers les niveaux d'accord, mélodie et rythme. Utilisez votre OP-1 en MIDI ou cliquez sur les touches.
            </p>
          </div>

          <div style={{ padding: "20px", background: "#fff", border: "3px solid #111" }}>
            <h2>⚡ Capacités requises</h2>
            <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
              <li>✅ OP-1 connecté en USB</li>
              <li>✅ Connexion MIDI active</li>
              <li>✅ Clavier ou touches fonctionnelles</li>
              <li>✅ Son en lecture</li>
            </ul>
          </div>
        </div>

        <div style={{ padding: "20px", background: "#f0f0f0", border: "3px solid #111", marginBottom: "30px" }}>
          <h2>🎯 Modes d'entraînement</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" }}>
            <div>
              <h3>🎼 Accords (Niveau 1)</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Maîtrisez les progressions d'accords classiques en Do majeur</p>
            </div>
            <div>
              <h3>🎵 Mélodies (Niveau 2)</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Travaillez la gamme et les mélodies note par note</p>
            </div>
            <div>
              <h3>🥁 Drumkit (Bonus)</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Perfectionnez les patterns rythmiques sur les pads</p>
            </div>
            <div>
              <h3>🎶 Effets & Morceau</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Importez des MIDI et entraînez-vous sur des vraies compositions</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", background: "#fff", border: "3px solid #111", marginBottom: "30px" }}>
          <h2>💡 Comment ça marche</h2>
          <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
            <li><strong>Choisir un mode</strong> : Accords, mélodies, rythme ou importer un morceau</li>
            <li><strong>Ajuster la vitesse</strong> : BPM réglable de 40 à 200</li>
            <li><strong>Notes qui tombent</strong> : Visez la ligne de jeu et appuyez au bon moment</li>
            <li><strong>Scoring</strong> : Precision = points, séries = combos bonus</li>
            <li><strong>Progression</strong> : Vos scores sont sauvegardés localement</li>
          </ol>
        </div>

        <div style={{ textAlign: "center", padding: "20px", background: "#d9ff43", border: "3px solid #111" }}>
          <h3>🚀 Prêt à t'entraîner ?</h3>
          <p style={{ marginBottom: "15px", fontSize: "16px" }}>
            Ouvre OP-1 Studio pour accéder aux exercices complets et commence ton entraînement !
          </p>
          <button
            onClick={() => window.location.href = "http://127.0.0.1:5175/?hubTool=exercise"}
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
            Ouvrir Exercices en OP-1 →
          </button>
        </div>
      </section>
    </main>
  );
}
