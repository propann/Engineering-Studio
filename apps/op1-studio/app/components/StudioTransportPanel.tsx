import type { ReactNode } from "react";

type TransportIcon = (props: { name: "check" | "plug" | "settings" | "wave"; size?: number }) => ReactNode;

export function StudioTransportPanel({
  Icon, tempo, recording, looping, reversed, mode, midiNotes,
  onPlay, onRecord, onQuantize, onLoopChange, onTempoChange, onConnectMidi, onReversedChange,
}: {
  Icon: TransportIcon;
  tempo: number;
  recording: boolean;
  looping: boolean;
  reversed: boolean;
  mode: "clone" | "midi";
  midiNotes: number;
  onPlay: () => void;
  onRecord: () => void;
  onQuantize: () => void;
  onLoopChange: (value: boolean) => void;
  onTempoChange: (value: number) => void;
  onConnectMidi: () => Promise<boolean>;
  onReversedChange: (value: boolean) => void;
}) {
  return (
    <div className="tape-transport-panel" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", padding: "4px 8px" }}>
      {/* Bouton LECTURE / PAUSE */}
      <button className="icon-action" aria-label="Lecture / Pause" onClick={onPlay} title="Lecture (Barre Espace)" style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", padding: "4px 10px", fontSize: "11px", height: "28px" }}>
        <Icon name="wave" size={13} />
        <span>PLAY</span>
      </button>

      {/* Bouton ENREGISTREMENT REC (Rouge TE) */}
      <button
        className={`icon-action ${recording ? "is-recording" : ""}`}
        aria-label="Enregistrement REC"
        onClick={onRecord}
        title="Enregistrement multi-pistes & MIDI"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: recording ? "#FF3A5D" : "rgba(255, 58, 93, 0.15)",
          color: recording ? "#ffffff" : "#FF3A5D",
          border: "1px solid #FF3A5D",
          fontWeight: "bold",
          padding: "4px 10px",
          fontSize: "11px",
          height: "28px",
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: recording ? "0 0 10px rgba(255, 58, 93, 0.6)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        <span style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#FF3A5D",
          display: "inline-block",
          animation: recording ? "pulse 1s infinite" : "none",
          boxShadow: "0 0 5px #FF3A5D"
        }} />
        <span>REC</span>
      </button>

      <button className="secondary-action" onClick={onQuantize} style={{ padding: "4px 8px", fontSize: "11px", height: "28px", display: "flex", alignItems: "center", gap: "4px" }}>
        <Icon name="settings" size={12} />Quantif 1/16
      </button>

      <button className={`track-state ${looping ? "is-active" : ""}`} onClick={() => onLoopChange(!looping)} style={{ padding: "4px 8px", fontSize: "11px", height: "28px" }}>
        LOOP
      </button>

      <button
        className={`track-state${reversed ? " is-active" : ""}`}
        style={{ padding: "4px 8px", fontSize: "11px", height: "28px", ...(reversed ? { borderColor: "#FF3A5D", color: "#FF3A5D" } : {}) }}
        onClick={() => onReversedChange(!reversed)}
        title="Mode bande inversée (tape-invert)"
      >
        REV
      </button>

      <label className="tempo-control" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", height: "28px" }}>
        BPM{" "}
        <input
          type="number"
          min="40"
          max="200"
          value={tempo}
          onChange={(event) => onTempoChange(Number(event.target.value))}
          style={{ width: "48px", padding: "2px 4px", fontSize: "11px" }}
        />
      </label>

      <span style={{ fontSize: "10px", opacity: 0.85, fontFamily: "monospace", marginLeft: "4px" }}>
        {tempo} BPM · {recording ? `REC (${midiNotes}n)` : mode === "midi" ? "MIDI" : "CLONE OP-1"}
        {reversed && " · ⟵ REV"}
      </span>

      <button className="secondary-action" onClick={onConnectMidi} style={{ padding: "4px 8px", fontSize: "11px", height: "28px", display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }}>
        <Icon name="plug" />MIDI
      </button>
    </div>
  );
}
