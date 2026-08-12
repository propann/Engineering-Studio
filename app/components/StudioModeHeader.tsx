import type { ReactNode } from "react";

type StudioIcon = (props: { name: "chip" | "plug"; size?: number }) => ReactNode;

export function StudioModeHeader({ Icon, mode, onModeChange, onConnectMidi }: { Icon: StudioIcon; mode: "clone" | "midi"; onModeChange: (mode: "clone" | "midi") => void; onConnectMidi: () => Promise<boolean> }) {
  return <><div className="tape-editor-head"><div><span className="section-label">STUDIO OP-1</span><strong>Tape &amp; Album · 4 pistes</strong><small>{mode === "clone" ? "Clone local · édition non destructive" : "OP-1 MIDI · machine utilisée comme contrôleur"}</small></div><span className="midi-badge"><i /> {mode === "clone" ? "CLONE" : "MIDI"}</span></div><div className="studio-mode-tabs" role="tablist" aria-label="Mode du studio"><button type="button" className={mode === "clone" ? "is-active" : ""} onClick={() => onModeChange("clone")}><Icon name="chip" size={15} />Clone OP-1</button><button type="button" className={mode === "midi" ? "is-active" : ""} onClick={async () => { onModeChange("midi"); await onConnectMidi(); }}><Icon name="plug" size={15} />OP-1 MIDI</button></div></>;
}
