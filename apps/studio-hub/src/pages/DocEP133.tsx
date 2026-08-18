"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function DocEP133() {
  const [profileName] = useState("AZOTH");
  const [activeTab, setActiveTab] = useState<"overview" | "patterns" | "sounds" | "procedures">("overview");

  return (
    <main className="doc-page" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <TopBar profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1>🥁 Documentation EP-133 Studio</h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Guide complet pour créer, cloner et performer avec votre EP-133
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

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #111" }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "10px 20px",
              background: activeTab === "overview" ? "#ff5a1f" : "#ebece6",
              color: activeTab === "overview" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📋 Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("patterns")}
            style={{
              padding: "10px 20px",
              background: activeTab === "patterns" ? "#ff5a1f" : "#ebece6",
              color: activeTab === "patterns" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🎼 Patterns & Songs
          </button>
          <button
            onClick={() => setActiveTab("sounds")}
            style={{
              padding: "10px 20px",
              background: activeTab === "sounds" ? "#ff5a1f" : "#ebece6",
              color: activeTab === "sounds" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🎧 Sons & Transferts
          </button>
          <button
            onClick={() => setActiveTab("procedures")}
            style={{
              padding: "10px 20px",
              background: activeTab === "procedures" ? "#ff5a1f" : "#ebece6",
              color: activeTab === "procedures" ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📖 Procédures
          </button>
        </div>

        {activeTab === "overview" && (
          <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "4px" }}>
            <h2>Vue d'ensemble EP-133</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111" }}>
                <h3>🎛️ Caractéristiques principales</h3>
                <ul style={{ lineHeight: "1.8" }}>
                  <li><strong>Pattern Studio</strong> : Édition complète des patterns</li>
                  <li><strong>4 Groupes</strong> : A, B, C, D indépendants</li>
                  <li><strong>Song Mode</strong> : Arranger et arranger les patterns</li>
                  <li><strong>128 Sons</strong> : Banque de samples programmable</li>
                  <li><strong>Mémoire</strong> : 64 Mo ou 128 Mo</li>
                </ul>
              </div>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111" }}>
                <h3>⚡ Avant de commencer</h3>
                <ul style={{ lineHeight: "1.8" }}>
                  <li>✅ Connecter l'EP-133 en USB</li>
                  <li>✅ Identifier la capacité mémoire (64 ou 128 Mo)</li>
                  <li>✅ Configurer votre profil utilisateur</li>
                  <li>✅ Préparer votre espace de travail</li>
                  <li>✅ Sauvegarder vos projets</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "4px" }}>
            <h2>🎼 Patterns & Song Studio</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Pattern Mode</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Sélectionner un groupe (A, B, C ou D)</li>
                  <li>Éditer les patterns avec 32 pads</li>
                  <li>Programmer les notes et la vélocité</li>
                  <li>Mettre en place les scènes</li>
                  <li>Tester en temps réel</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Song Mode</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Arranger les patterns dans l'ordre</li>
                  <li>Définir les transitions</li>
                  <li>Gérer les sections (intro, couplet, refrain)</li>
                  <li>Enregistrer les paramètres</li>
                  <li>Exporter pour performance</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111" }}>
                <h3>💡 Conseils</h3>
                <ul style={{ lineHeight: "1.8" }}>
                  <li>Nommer vos patterns de manière logique</li>
                  <li>Sauvegarder régulièrement</li>
                  <li>Tester sur les pads réels avant de performer</li>
                  <li>Utiliser les groupes pour organiser</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sounds" && (
          <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "4px" }}>
            <h2>🎧 Sons & Transferts</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Banques de Sons</h3>
                <p style={{ lineHeight: "1.8" }}>
                  L'EP-133 contient 128 emplacements de sons programmables. Vous pouvez :
                </p>
                <ul style={{ marginTop: "10px", lineHeight: "1.8" }}>
                  <li>Charger des sons depuis la bibliothèque</li>
                  <li>Cloner des sons existants</li>
                  <li>Créer des variations</li>
                  <li>Organiser par type ou groupe</li>
                </ul>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Transfert de Projets</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Sélectionner le projet à transférer</li>
                  <li>Prévoir l'espace mémoire</li>
                  <li>Connecter l'EP-133</li>
                  <li>Confirmer le transfert</li>
                  <li>Vérifier l'intégrité (SHA-256)</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111" }}>
                <h3>⚠️ Capacités Mémoire</h3>
                <p><strong>64 Mo :</strong> Environ 40-50 projets simples</p>
                <p style={{ marginTop: "10px" }}><strong>128 Mo :</strong> Environ 80-100 projets ou plus complexes</p>
                <p style={{ marginTop: "10px", color: "#666" }}>
                  Vérifiez toujours votre capacité avant de transférer des projets volumineux.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "procedures" && (
          <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "4px" }}>
            <h2>📖 Procédures courantes</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Cloner un Projet</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Ouvrir "Sons & transferts EP-133" au Hub</li>
                  <li>Sélectionner le projet à cloner</li>
                  <li>Brancher l'EP-133</li>
                  <li>Lancer le clone</li>
                  <li>Vérifier l'intégrité après transfert</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111", marginBottom: "15px" }}>
                <h3>Sauvegarder un Projet</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Utiliser le coffre au Hub</li>
                  <li>Sélectionner les projets à sauvegarder</li>
                  <li>Confirmer et attendre la vérification</li>
                  <li>Vos données sont protégées par SHA-256</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #111" }}>
                <h3>Test Machine</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Brancher l'EP-133 en USB</li>
                  <li>Ouvrir "Test machine" au Hub</li>
                  <li>Vérifier la communication MIDI/SysEx</li>
                  <li>Tester les pads et les groupes</li>
                  <li>Confirmer la réactivité</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
