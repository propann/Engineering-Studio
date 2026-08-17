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
    <div className="tape-transport-panel">
      <button className="icon-action" aria-label="Lecture" onClick={onPlay}>
        <Icon name="wave" size={15} />
      </button>
      <button className={`icon-action ${recording ? "is-recording" : ""}`} aria-label="Enregistrement MIDI" onClick={onRecord}>
        <Icon name="check" size={15} />
      </button>
      <button className="secondary-action" onClick={onQuantize}>
        <Icon name="settings" size={14} />Quantifier 1/16
      </button>
      <button className={`track-state ${looping ? "is-active" : ""}`} onClick={() => onLoopChange(!looping)}>
        LOOP
      </button>
      <button
        className={`track-state${reversed ? " is-active" : ""}`}
        style={reversed ? { borderColor: "#FF3A5D", color: "#FF3A5D" } : {}}
        onClick={() => onReversedChange(!reversed)}
        title="Mode bande inversée (tape-invert)"
      >
        REV
      </button>
      <label className="tempo-control">
        BPM{" "}
        <input
          type="number"
          min="40"
          max="200"
          value={tempo}
          onChange={(event) => onTempoChange(Number(event.target.value))}
        />
      </label>
      <span>
        <i /> {tempo} BPM · {recording ? `MIDI ENREGISTRE · ${midiNotes} notes` : mode === "midi" ? "OP-1 MIDI PRÊT" : "CLONE PRÊT"}
        {reversed && " · ⟵ REV"}
      </span>
      <button className="secondary-action" onClick={onConnectMidi}>
        <Icon name="plug" />Connecter MIDI
      </button>
    </div>
  );
}
