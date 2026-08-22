"use client";
import { useEffect, useState } from "react";
import { clearProfile, readProfileName } from "../core/profile";

export interface TopBarProps {
  activePage?: string;
  profileName?: string;
  onDocClick?: () => void;
  customAction?: React.ReactNode;
}

export function TopBar({
  activePage = "landing",
  profileName = "NOUVEAU MEMBRE",
  onDocClick,
  customAction,
}: TopBarProps) {
  const [currentName, setCurrentName] = useState(profileName);

  useEffect(() => {
    try {
      setCurrentName(readProfileName(profileName));
    } catch {
      // Profile cache is convenience only; session continues with default
      clearProfile();
    }
  }, [profileName]);

  const nav = (page: string) => {
    if ((window as any).navigateMaquette) {
      (window as any).navigateMaquette(page);
    }
  };

  const studioLinks = [
    { id: "studio-op1", label: "OP-1 Studio", icon: "🎹", badge: "OP-1" },
    { id: "studio-ep133", label: "EP-133 Studio", icon: "🥁", badge: "K.O. II" },
    { id: "sound-library", label: "Bibliothèque sonore", icon: "🎵" },
    { id: "outils", label: "Hub Outils", icon: "🔗" },
    { id: "orphan-pages", label: "Pages", icon: "🗂️" },
  ];

  return (
    <header className="universal-topbar">
      <div className="topbar-inner">
        {/* Left: Brand logo button */}
        <button
          type="button"
          className="topbar-brand"
          onClick={() => nav("landing")}
          title="Engineering Studio - Accueil"
        >
          <span className="brand-dots">
            <i className="dot-cyan" />
            <i className="dot-blue" />
            <i className="dot-orange" />
            <i className="dot-yellow" />
          </span>
          <span className="brand-title">
            <strong>ENGINEERING</strong>
            <b>STUDIO</b>
          </span>
        </button>

        {/* Center: Main Studios Shortcuts */}
        <nav className="topbar-studios-nav" aria-label="Accès direct aux Studios">
          {studioLinks.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`topbar-studio-btn ${isActive ? "is-active" : ""}`}
                onClick={() => nav(item.id)}
              >
                <span className="btn-icon">{item.icon}</span>
                <span className="btn-label">{item.label}</span>
                {item.badge && <small className="btn-badge">{item.badge}</small>}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions & Profile */}
        <div className="topbar-actions">
          {onDocClick && (
            <button
              type="button"
              className="topbar-btn-secondary"
              onClick={onDocClick}
              title="Consulter la documentation"
            >
              📖 Docs
            </button>
          )}

          {customAction}

          <button
            type="button"
            className="topbar-profile-badge"
            onClick={() => nav("profil")}
            title="Consulter votre profil et configuration d'atelier"
          >
            <span className="profile-initials">
              {(currentName || "AZ").slice(0, 2).toUpperCase()}
            </span>
            <div className="profile-text">
              <small>ATELIER LOCAL</small>
              <strong>{currentName || "NOUVEAU MEMBRE"}</strong>
            </div>
            <span className="profile-arrow">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
}
