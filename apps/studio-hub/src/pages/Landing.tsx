"use client";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";

export default function Home() {
  const [profileName, setProfileName] = useState("INVITÉ");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("studio-hub-profile");
      if (raw) {
        const profile = JSON.parse(raw) as { name?: string };
        if (profile.name?.trim()) setProfileName(profile.name.trim());
      }
    } catch {
      /* profil local */
    }
  }, []);

  const openTool = (toolId: string) => {
    if (toolId === "op1") (window as any).navigateMaquette("studio-op1");
    else if (toolId === "ep133") (window as any).navigateMaquette("studio-ep133");
    else if (toolId === "sounds") (window as any).navigateMaquette("sound-editor");
    else if (toolId === "visual") (window as any).navigateMaquette("image-editor-op1");
    else if (toolId === "profil") (window as any).navigateMaquette("profil");
    else (window as any).navigateMaquette("outils");
  };

  return (
    <main className="landing-rich-page">
      <TopBar activePage="landing" profileName={profileName} />

      {/* Avertissement : le site est publiquement accessible alors que le
          developpement est en cours. Mieux vaut le dire d'entree que laisser
          quelqu'un buter sur des fonctions inachevees. */}
      <aside className="wip-banner" role="alert">
        <strong>Site en cours de développement</strong>
        <span>
          Rien n'est stable ici : la plupart des fonctions sont incomplètes ou
          ne marchent pas encore. Ça travaille, revenez plus tard.
        </span>
      </aside>

      {/* Hero Section */}
      <section className="rich-hero" id="top">
        <div className="hero-badge-strip">
          <span className="badge-dot" />
          <b>TEENAGE ENGINEERING SUITE</b>
          <small>· OP-1 STUDIO & EP-133 K.O. II</small>
        </div>

        <div className="rich-hero-grid">
          {/* Left Hero Copy */}
          <div className="hero-text-block">
            <h1>
              L’ATELIER <br />
              <b>MODULAIRE</b> <br />
              <em className="highlight-orange">TE HARDWARE</em>
            </h1>
            <p className="hero-lead">
              Un écosystème unique pour gérer vos projets <strong>OP-1</strong> et <strong>EP-133</strong>. 
              Sauvegardes, banques de sons, clone de pads et édition de bande magnétique en temps réel.
            </p>

            <div className="hero-buttons-row">
              <button
                type="button"
                className="btn-op1-hero"
                onClick={() => openTool("op1")}
              >
                <span>🎹</span>
                <div>
                  <strong>OP-1 STUDIO</strong>
                  <small>4 Pistes · Workstation</small>
                </div>
              </button>

              <button
                type="button"
                className="btn-ep133-hero"
                onClick={() => openTool("ep133")}
              >
                <span>🥁</span>
                <div>
                  <strong>EP-133 STUDIO</strong>
                  <small>K.O. II · Sampler Lab</small>
                </div>
              </button>
            </div>

            <div className="hero-features-chips">
              <span>⚡ Connexion WebMIDI Directe</span>
              <span>💾 100% Local (Sans Cloud)</span>
              <span>🎵 Synthétiseur & Samples 24-bit</span>
            </div>
          </div>

          {/* Right Machines Showcase - Seamless blended image cards */}
          <div className="rich-machine-showcase">
            {/* OP-1 Machine Card */}
            <div
              className="machine-card-frame op1-card-frame"
              onClick={() => openTool("op1")}
              title="Cliquer pour lancer l'OP-1 Studio"
            >
              <div className="card-status-bar op1-bar">
                <span>🎹 OP-1 WORKSTATION</span>
                <span className="pill-active">READY</span>
              </div>
              <div className="img-multiply-blend">
                <img
                  src="/media/op1.jpeg"
                  alt="OP-1 Synthesizer Workstation"
                  className="op1-clean-img"
                />
              </div>
              <div className="card-footer-info">
                <span>SYNTH · TAPE · DRUM</span>
                <strong>LANCER OP-1 STUDIO ↗</strong>
              </div>
            </div>

            {/* EP-133 Machine Card */}
            <div
              className="machine-card-frame ep133-card-frame"
              onClick={() => openTool("ep133")}
              title="Cliquer pour lancer l'EP-133 Studio"
            >
              <div className="card-status-bar ep133-bar">
                <span>🥁 EP-133 K.O. II</span>
                <span className="pill-orange">SAMPLER</span>
              </div>
              <div className="ep-crop-container">
                <img
                  src="/media/ep133.jpeg"
                  alt="EP-133 K.O. II Sampler"
                  className="ep133-clean-img"
                />
              </div>
              <div className="card-footer-info">
                <span>PADS A/B/C/D · 64MB</span>
                <strong>LANCER EP-133 STUDIO ↗</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Tools Overview Section */}
      <section className="rich-tools-hub-preview">
        <div className="preview-title">
          <h2>MODULES DE L'ATELIER</h2>
          <p>Choisissez votre outil pour commencer</p>
        </div>

        <div className="preview-cards-grid">
          <div className="preview-card" onClick={() => openTool("op1")}>
            <div className="card-icon">🎹</div>
            <h3>OP-1 Studio</h3>
            <p>Workstation complète, gestion des projets, backups et enregistreur de bande 4-pistes.</p>
            <span className="card-link">Ouvrir le Studio ↗</span>
          </div>

          <div className="preview-card" onClick={() => openTool("ep133")}>
            <div className="card-icon">🥁</div>
            <h3>EP-133 K.O. II</h3>
            <p>Gestionnaire de samples, banques de sons A/B/C/D, clonage de pads et sauvegardes.</p>
            <span className="card-link">Ouvrir le Sampler ↗</span>
          </div>

          <div className="preview-card" onClick={() => openTool("profil")}>
            <div className="card-icon">👤</div>
            <h3>Mon Profil</h3>
            <p>Configurez votre atelier, vos machines (OP-1, EP-133), la capacité mémoire et vos espaces de travail.</p>
            <span className="card-link">Créer/Éditer mon Profil ↗</span>
          </div>

          <div className="preview-card" onClick={() => openTool("sounds")}>
            <div className="card-icon">🎵</div>
            <h3>Éditeur de Sons</h3>
            <p>Convertisseur WAV/AIFF, détection de silence, normalisation 24-bit et banques partagées.</p>
            <span className="card-link">Lancer l'Éditeur ↗</span>
          </div>

          <div className="preview-card" onClick={() => openTool("visual")}>
            <div className="card-icon">🖼️</div>
            <h3>Éditeur d'Images OP-1</h3>
            <p>Création d'animations et de visuels pixel-art pour l'écran de votre synthétiseur.</p>
            <span className="card-link">Créer un visuel ↗</span>
          </div>
        </div>
      </section>
    </main>
  );
}
