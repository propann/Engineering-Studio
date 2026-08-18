"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function Documentation() {
  const [profileName] = useState("AZOTH");
  const [activeTab, setActiveTab] = useState<"op1" | "ep133">("op1");

  return (
    <main className="documentation-page" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <h1>📚 Documentation Engineering Studio</h1>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #383572" }}>
          <button
            onClick={() => setActiveTab("op1")}
            style={{
              padding: "10px 20px",
              background: activeTab === "op1" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "op1" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🎹 OP-1 Documentation
          </button>
          <button
            onClick={() => setActiveTab("ep133")}
            style={{
              padding: "10px 20px",
              background: activeTab === "ep133" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "ep133" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🥁 EP-133 Documentation
          </button>
        </div>

        {activeTab === "op1" && (
          <div className="doc-section" style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>OP-1 Studio Documentation</h2>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>🎓 Exercices MIDI</h3>
              <p>Branche l'OP-1 en USB, sélectionne son entrée MIDI, puis commence. Les notes sont analysées localement.</p>
              <button style={{
                padding: "10px 20px",
                background: "#00ed95",
                border: "2px solid #383572",
                cursor: "pointer",
                fontWeight: "bold"
              }}>
                Accéder aux exercices →
              </button>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>⚙️ Firmware officiel</h3>
              <p>Utilise uniquement un fichier provenant de Teenage Engineering. Une sauvegarde doit précéder toute préparation.</p>
              <p><strong>Recommandation :</strong> Toujours sauvegarder avant de modifier.</p>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>✏️ Éditeur firmware</h3>
              <p>Les cases préparent un plan lisible. Elles ne modifient pas le firmware et n'écrivent rien sur l'OP-1.</p>
              <p><strong>Sécurité :</strong> Aucune écriture directe — plan lisible, confirmation explicite requise.</p>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>📖 Guide officiel Teenage Engineering</h3>
              <p>Documentation complète et fiable du fabricant.</p>
              <a
                href="https://teenage.engineering/guides/op-1/original/te-boot"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  background: "#00ed95",
                  color: "#fff",
                  border: "2px solid #383572",
                  textDecoration: "none",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Ouvrir le guide TE-boot →
              </a>
            </div>
          </div>
        )}

        {activeTab === "ep133" && (
          <div className="doc-section" style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>EP-133 Studio Documentation</h2>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>🎹 Pattern & Song Studio</h3>
              <p>Groupes A/B/C/D, patterns, scènes et positions Song sur l'EP-133.</p>
              <p><strong>Capacité :</strong> Support 64 Mo et 128 Mo.</p>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>🎧 Sons & Transferts</h3>
              <p>Banques, réglages de pads, clone et transferts préparés en toute sécurité.</p>
              <p><strong>Checkpoints :</strong> Validation SHA-256 avant/après transfert.</p>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>🔧 Test Machine</h3>
              <p>Observer MIDI/SysEx, groupes actifs et communication aller-retour.</p>
              <p><strong>Mode :</strong> Lecture seule sans modification de projet.</p>
            </div>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#fff", border: "3px solid #383572" }}>
              <h3>🎯 Rhythm Hero</h3>
              <p>Styles, niveaux, BPM, partitions animées, scores et progression aux pads.</p>
              <p><strong>Apprentissage :</strong> Entraînement progressif sur MIDI.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
