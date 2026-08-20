"use client";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

export default function DocOP1() {
  const [profileName] = useState("NOUVEAU MEMBRE");
  const [activeTab, setActiveTab] = useState<"overview" | "firmware" | "editor" | "procedures">("overview");

  return (
    <main className="doc-page" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <TopBar activePage="documentation" profileName={profileName} onDocClick={() => {}} />

      <section style={{ marginTop: "40px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1>🎹 Documentation OP-1</h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Guide complet pour utiliser, préparer et maintenir votre OP-1
          </p>
          <button
            onClick={() => (window as any).navigateMaquette("outils")}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: "#dfd9ff",
              border: "2px solid #383572",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ← Retour aux outils
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #383572" }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "10px 20px",
              background: activeTab === "overview" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "overview" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📋 Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("firmware")}
            style={{
              padding: "10px 20px",
              background: activeTab === "firmware" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "firmware" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ⚙️ Firmware
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            style={{
              padding: "10px 20px",
              background: activeTab === "editor" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "editor" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✏️ Éditeur
          </button>
          <button
            onClick={() => setActiveTab("procedures")}
            style={{
              padding: "10px 20px",
              background: activeTab === "procedures" ? "#00ed95" : "#dfd9ff",
              color: activeTab === "procedures" ? "#fff" : "#383572",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📖 Procédures
          </button>
        </div>

        {activeTab === "overview" && (
          <div style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>Vue d'ensemble OP-1</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572" }}>
                <h3>🎛️ Principales fonctionnalités</h3>
                <ul style={{ lineHeight: "1.8" }}>
                  <li><strong>Tape Mode</strong> : 4 pistes d'enregistrement</li>
                  <li><strong>Drum Synth</strong> : Synthé percussif</li>
                  <li><strong>Multiple LFOs</strong> : Modulation avancée</li>
                  <li><strong>Built-in FX</strong> : 7 effets haute qualité</li>
                  <li><strong>Album</strong> : Rendu et sauvegarde</li>
                </ul>
              </div>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572" }}>
                <h3>⚡ Avant de commencer</h3>
                <ul style={{ lineHeight: "1.8" }}>
                  <li>✅ Connecter l'OP-1 en USB</li>
                  <li>✅ Installer le firmware officiel</li>
                  <li>✅ Configurer votre profil utilisateur</li>
                  <li>✅ Préparer votre espace de travail</li>
                  <li>✅ Sauvegarder vos données</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "firmware" && (
          <div style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>🔧 Firmware Officiel</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572", marginBottom: "15px" }}>
                <h3>⚠️ Sécurité Firmware</h3>
                <p><strong>IMPORTANT :</strong> Utilisez uniquement des fichiers firmware provenant de Teenage Engineering</p>
                <p style={{ marginTop: "10px" }}>Avant toute modification :</p>
                <ol style={{ marginTop: "10px", lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Sauvegarder TOUS vos projets</li>
                  <li>Vérifier l'intégrité du fichier .op1</li>
                  <li>Utiliser un câble USB fiable</li>
                  <li>Garder l'OP-1 branché pendant toute l'opération</li>
                  <li>Ne pas éteindre pendant la mise à jour</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572", marginBottom: "15px" }}>
                <h3>📥 Comment mettre à jour</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Télécharger le firmware officiel de Teenage Engineering</li>
                  <li>Brancher l'OP-1 en USB mode</li>
                  <li>Utiliser le "Firmware Lab" pour préparer</li>
                  <li>Vérifier le plan avant d'appliquer</li>
                  <li>Attendre la fin de la mise à jour</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#00ed95", border: "3px solid #383572" }}>
                <strong>🔗 Ressource officielle :</strong><br />
                <a href="https://teenage.engineering/guides/op-1/original/te-boot" target="_blank" rel="noreferrer" style={{ color: "#383572", textDecoration: "underline" }}>
                  Teenage Engineering - OP-1 Guide
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "editor" && (
          <div style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>✏️ Éditeur Firmware</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572", marginBottom: "15px" }}>
                <h3>🛡️ Sécurité Éditeur</h3>
                <p style={{ lineHeight: "1.8" }}>
                  L'éditeur firmware préparé ici est 100% sûr. Il ne modifie pas le firmware réel
                  et n'écrit rien sur l'OP-1. Vous pouvez :
                </p>
                <ul style={{ marginTop: "10px", lineHeight: "1.8" }}>
                  <li>✅ Prévisualiser les changements</li>
                  <li>✅ Générer un plan lisible</li>
                  <li>✅ Exporter les patches</li>
                  <li>❌ Rien n'est écrit sans confirmation explicite</li>
                </ul>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572" }}>
                <h3>🎯 Workflow recommandé</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Télécharger un firmware officiel</li>
                  <li>Utiliser l'éditeur d'images pour personnaliser</li>
                  <li>Prévisualiser les résultats</li>
                  <li>Générer les patches</li>
                  <li>Exporter le bundle</li>
                  <li>Appliquer seulement après vérification</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeTab === "procedures" && (
          <div style={{ padding: "20px", background: "#dfd9ff", borderRadius: "4px" }}>
            <h2>📖 Procédures courantes</h2>
            <div style={{ marginTop: "20px" }}>
              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572", marginBottom: "15px" }}>
                <h3>🔄 Sauvegarder un projet</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Ouvrir "Sauvegarde OP-1" au Hub</li>
                  <li>Sélectionner ce que vous voulez sauvegarder (Tape, Album, etc.)</li>
                  <li>Confirmer et attendre la vérification SHA-256</li>
                  <li>Votre projet est sécurisé dans le coffre</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572", marginBottom: "15px" }}>
                <h3>🎵 Importer des samples</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Préparer vos fichiers WAV/AIFF</li>
                  <li>Utiliser l'éditeur de samples</li>
                  <li>Trimmer, appliquer des fondus si nécessaire</li>
                  <li>Exporter pour l'OP-1</li>
                  <li>Transférer via le HUB</li>
                </ol>
              </div>

              <div style={{ padding: "15px", background: "#fff", border: "3px solid #383572" }}>
                <h3>🎮 S'entraîner avec les exercices MIDI</h3>
                <ol style={{ lineHeight: "1.8", marginLeft: "20px" }}>
                  <li>Brancher l'OP-1 en USB</li>
                  <li>Aller dans "Exercices OP-1" au Hub</li>
                  <li>Sélectionner un niveau (Accords → Mélodies)</li>
                  <li>Appuyer sur les touches pour que le système les détecte</li>
                  <li>Progresser jusqu'au niveau suivant</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
