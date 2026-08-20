import { useEffect, useRef } from "react";

export interface TrackContextMenuProps {
  x: number;
  y: number;
  trackIndex: number;
  trackLabel: string;
  color: string;
  hasFile: boolean;
  fileName?: string;
  duration?: number;
  onImport: () => void;
  onExport: () => void;
  onEditTrim?: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function TrackContextMenu({
  x,
  y,
  trackIndex,
  trackLabel,
  color,
  hasFile,
  fileName,
  duration,
  onImport,
  onExport,
  onEditTrim,
  onClear,
  onClose,
}: TrackContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermeture sur clic extérieur ou touche Échap
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    // Capture dès la phase suivante pour éviter le clic initial
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("contextmenu", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("contextmenu", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Ajustement pour ne pas dépasser de l'écran
  const menuWidth = 230;
  const menuHeight = 220;
  const posX = Math.max(10, Math.min(window.innerWidth - menuWidth - 10, x));
  const posY = Math.max(10, Math.min(window.innerHeight - menuHeight - 10, y));

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Menu Piste ${trackIndex + 1}`}
      style={{
        position: "fixed",
        top: posY,
        left: posX,
        zIndex: 99999,
        width: `${menuWidth}px`,
        backgroundColor: "#13181f",
        border: "1px solid #2d3844",
        borderRadius: "7px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.2)",
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "#e2e8f0",
        userSelect: "none",
        animation: "op1MenuFadeIn 0.12s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* En-tête de la piste */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 8px 6px 6px",
          borderBottom: "1px solid #222b35",
          marginBottom: "2px",
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            backgroundColor: color,
            color: trackIndex === 2 ? "#111" : "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: "11px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          {trackIndex + 1}
        </span>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <strong style={{ fontSize: "12px", color: "#f8fafc", lineHeight: 1.2 }}>{trackLabel}</strong>
          <small
            style={{
              fontSize: "10px",
              color: hasFile ? "#94a3b8" : "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
            }}
            title={fileName || "Piste vide"}
          >
            {hasFile ? (fileName ? `${fileName} (${duration ? duration.toFixed(1) + "s" : ""})` : "Audio chargé") : "— Vide —"}
          </small>
        </div>
      </div>

      {/* Bouton : Importer un fichier audio */}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onImport();
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          borderRadius: "5px",
          color: "#29be87",
          fontSize: "11.5px",
          fontWeight: "600",
          textAlign: "left",
          cursor: "pointer",
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(41, 190, 135, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ fontSize: "14px" }}>📥</span>
        <span>Importer un fichier audio...</span>
      </button>

      {/* Bouton : Exporter la piste */}
      <button
        type="button"
        role="menuitem"
        disabled={!hasFile}
        onClick={() => {
          onExport();
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          borderRadius: "5px",
          color: hasFile ? "#698eff" : "#475569",
          fontSize: "11.5px",
          fontWeight: "600",
          textAlign: "left",
          cursor: hasFile ? "pointer" : "not-allowed",
          opacity: hasFile ? 1 : 0.5,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          if (hasFile) e.currentTarget.style.background = "rgba(105, 142, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ fontSize: "14px" }}>📤</span>
        <span>Exporter la piste (AIFF mono)</span>
      </button>

      {/* Bouton : Éditer Trim & Fades */}
      {onEditTrim && (
        <button
          type="button"
          role="menuitem"
          disabled={!hasFile}
          onClick={() => {
            onEditTrim();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "7px 10px",
            background: "transparent",
            border: "none",
            borderRadius: "5px",
            color: hasFile ? "#cbd5e1" : "#475569",
            fontSize: "11.5px",
            textAlign: "left",
            cursor: hasFile ? "pointer" : "not-allowed",
            opacity: hasFile ? 1 : 0.5,
            transition: "background 0.1s ease",
          }}
          onMouseEnter={(e) => {
            if (hasFile) e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: "14px" }}>✂️</span>
          <span>Éditer Trim & Fades</span>
        </button>
      )}

      {/* Séparateur */}
      <div style={{ height: "1px", backgroundColor: "#222b35", margin: "2px 0" }} />

      {/* Bouton : Vider la piste */}
      <button
        type="button"
        role="menuitem"
        disabled={!hasFile}
        onClick={() => {
          onClear();
          onClose();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          borderRadius: "5px",
          color: hasFile ? "#ff3a5d" : "#475569",
          fontSize: "11.5px",
          textAlign: "left",
          cursor: hasFile ? "pointer" : "not-allowed",
          opacity: hasFile ? 1 : 0.5,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          if (hasFile) e.currentTarget.style.background = "rgba(255, 58, 93, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ fontSize: "14px" }}>🗑️</span>
        <span>Vider / Effacer la piste</span>
      </button>
    </div>
  );
}
