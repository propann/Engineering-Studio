"use client";
import { useCallback, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { GameGuitarHeroPanel } from "../../../op1-studio/app/components/GameGuitarHeroPanel";

type MidiMessageEventLike = { data: Uint8Array | number[] };
type MidiInputLike = { onmidimessage: ((event: MidiMessageEventLike) => void) | null };
type MidiAccessLike = {
  inputs: { values: () => Iterable<MidiInputLike> };
  onstatechange: (() => void) | null;
};

export default function Exercises() {
  const [notice, setNotice] = useState<string | null>(null);
  const [pressedMidiNotes, setPressedMidiNotes] = useState<number[]>([]);

  const handleNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  const handleClose = useCallback(() => {
    (window as any).navigateMaquette?.("outils");
  }, []);

  // Écoute de Web MIDI direct sur la page d'exercices
  useEffect(() => {
    if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) return;

    let midiAccess: MidiAccessLike | null = null;
    const activeNotes = new Set<number>();

    const onMidiMessage = (event: MidiMessageEventLike) => {
      const data = event.data;
      if (!data || data.length < 2) return;
      const cmd = data[0] & 0xf0;
      const note = data[1];
      const vel = data[2] || 0;

      if (cmd === 0x90 && vel > 0) {
        activeNotes.add(note);
        setPressedMidiNotes(Array.from(activeNotes));
      } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
        activeNotes.delete(note);
        setPressedMidiNotes(Array.from(activeNotes));
      }
    };

    const nav = navigator as unknown as { requestMIDIAccess?: (opt?: { sysex: boolean }) => Promise<MidiAccessLike> };
    nav.requestMIDIAccess?.({ sysex: false }).then(
      (access: MidiAccessLike) => {
        midiAccess = access;
        for (const input of access.inputs.values()) {
          input.onmidimessage = onMidiMessage;
        }
        access.onstatechange = () => {
          for (const input of access.inputs.values()) {
            input.onmidimessage = onMidiMessage;
          }
        };
      },
      () => {
        // MIDI indisponible ou refusé
      }
    );

    return () => {
      if (midiAccess) {
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, []);

  return (
    <main
      className="exercises-hub-app"
      style={{
        minHeight: "100vh",
        background: "#0e1314",
        color: "#eef3ea",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar activePage="exercises" onDocClick={() => (window as any).navigateMaquette?.("doc-op1")} />

      {notice && (
        <div
          role="status"
          style={{
            margin: "8px 16px",
            padding: "8px 12px",
            background: "#1e293b",
            border: "1px solid #38bdf8",
            borderRadius: "6px",
            color: "#38bdf8",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ flex: 1, padding: "12px 16px" }}>
        <GameGuitarHeroPanel
          onClose={handleClose}
          pressedNotes={pressedMidiNotes}
          onNotice={handleNotice}
        />
      </div>
    </main>
  );
}
