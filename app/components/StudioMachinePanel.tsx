import { useEffect, useState } from "react";

const keys = [
  { note: 48, label: "C", color: "blue" },
  { note: 50, label: "D", color: "green" },
  { note: 52, label: "E", color: "white" },
  { note: 53, label: "F", color: "orange" },
  { note: 55, label: "G", color: "blue" },
  { note: 57, label: "A", color: "green" },
  { note: 59, label: "B", color: "white" },
  { note: 60, label: "C", color: "orange" },
  { note: 62, label: "D", color: "blue" },
  { note: 64, label: "E", color: "green" },
  { note: 65, label: "F", color: "white" },
  { note: 67, label: "G", color: "orange" },
];
const computerKeys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];

const screenImage = "/firmware-mods/tape.svg";

export function StudioMachinePanel({
  pressedNotes,
  mode,
  playing,
  position,
  files,
  onTogglePlayback,
  onSendMidi,
}: {
  pressedNotes: number[];
  mode: "clone" | "midi";
  playing: boolean;
  position: number;
  files: Record<number, string>;
  onTogglePlayback: () => void;
  onSendMidi: (data: number[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [localPressedNotes, setLocalPressedNotes] = useState<number[]>([]);
  const pressed = new Set([...pressedNotes, ...localPressedNotes]);

  function noteOn(note: number) {
    setLocalPressedNotes((current) => current.includes(note) ? current : [...current, note]);
    if (mode === "midi") onSendMidi([0x90, note, 100]);
  }

  function noteOff(note: number) {
    setLocalPressedNotes((current) => current.filter((item) => item !== note));
    if (mode === "midi") onSendMidi([0x80, note, 0]);
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const index = computerKeys.indexOf(event.key.toLowerCase());
      if (index >= 0) { event.preventDefault(); noteOn(keys[index].note); }
    };
    const up = (event: KeyboardEvent) => {
      const index = computerKeys.indexOf(event.key.toLowerCase());
      if (index >= 0) { event.preventDefault(); noteOff(keys[index].note); }
    };
    const transport = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; const isReservedControl = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "BUTTON" || target?.isContentEditable; if (event.code === "Space" && !isReservedControl) { event.preventDefault(); onTogglePlayback(); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("keydown", transport);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("keydown", transport); };
  }, [onTogglePlayback]);

  return (
    <aside className={`studio-machine-panel ${collapsed ? "is-collapsed" : ""}`} aria-label="Clone machine OP-1">
      <button
        type="button"
        className="studio-machine-collapse"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span aria-hidden="true">{collapsed ? ">" : "<"}</span>
      </button>
      {!collapsed && (
        <div className="studio-machine-content">
          <div className="studio-machine-display-main">
            <img src={screenImage} alt="Ecran Tape du clone OP-1" />
            <button type="button" className={`studio-screen-native-control ${playing ? "is-playing" : ""}`} aria-label={playing ? "Arreter la lecture" : "Lire la bande"} onClick={onTogglePlayback} />
            <div className="studio-screen-track-hitboxes" aria-label="Bandes Tape tactiles">
              {[0, 1, 2, 3].map((index) => (
                <button type="button" key={index} className={selectedTrack === index ? "is-selected" : ""} aria-label={`Selectionner la piste ${index + 1}${files[index] ? `, ${files[index]}` : " vide"}`} onClick={() => setSelectedTrack(index)}><span>{index + 1}</span><i style={{ left: `${(position / 360) * 100}%` }} /></button>
              ))}
            </div>
          </div>
          <div className="studio-machine-photo">
            <img src="/firmware-mods/op1-machine.webp" alt="Machine OP-1" />
            <button type="button" className="studio-machine-volume-control" aria-label="Potentiometre de volume OP-1" onClick={() => { if (mode === "midi") onSendMidi([0xb0, 2, 64]); }} />
            <div className="studio-machine-key-overlay" aria-label="Touches MIDI du clone">
              {keys.map((key, index) => (
                <button
                  type="button"
                  key={key.note}
                  aria-label={`${key.label} ${key.note}`}
                  className={`studio-machine-key-overlay-button key-${key.color} ${pressed.has(key.note) ? "is-pressed" : ""}`}
                  style={{ left: `${20.5 + index * 5.05}%` }}
                  onPointerDown={() => noteOn(key.note)}
                  onPointerUp={() => noteOff(key.note)}
                  onPointerLeave={() => { if (pressed.has(key.note)) noteOff(key.note); }}
                >
                  <span>{computerKeys[index] ?? ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
