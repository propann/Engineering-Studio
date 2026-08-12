"use client";

import { useEffect, useRef, useState } from "react";

const KEYS = [
  { note: 60, label: "C4", key: "a", black: false },
  { note: 61, label: "C#4", key: "w", black: true },
  { note: 62, label: "D4", key: "s", black: false },
  { note: 63, label: "D#4", key: "e", black: true },
  { note: 64, label: "E4", key: "d", black: false },
  { note: 65, label: "F4", key: "f", black: false },
  { note: 66, label: "F#4", key: "t", black: true },
  { note: 67, label: "G4", key: "g", black: false },
  { note: 68, label: "G#4", key: "y", black: true },
  { note: 69, label: "A4", key: "h", black: false },
  { note: 70, label: "A#4", key: "u", black: true },
  { note: 71, label: "B4", key: "j", black: false },
  { note: 72, label: "C5", key: "k", black: false },
];

export function LegacyKeyboardPanel({ onSendMidi }: { onSendMidi: (data: number[]) => void }) {
  const [pressed, setPressed] = useState<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Record<number, OscillatorNode>>({});

  function noteOn(note: number) {
    if (pressed.includes(note)) return;
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillators.current[note] = oscillator;
    setPressed((current) => [...current, note]);
    onSendMidi([0x90, note, 100]);
  }

  function noteOff(note: number) {
    const oscillator = oscillators.current[note];
    if (oscillator && audioContext.current) {
      oscillator.stop(audioContext.current.currentTime + 0.04);
      delete oscillators.current[note];
    }
    setPressed((current) => current.filter((item) => item !== note));
    onSendMidi([0x80, note, 0]);
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const item = KEYS.find((key) => key.key === event.key.toLowerCase());
      if (item) { event.preventDefault(); noteOn(item.note); }
    };
    const up = (event: KeyboardEvent) => {
      const item = KEYS.find((key) => key.key === event.key.toLowerCase());
      if (item) noteOff(item.note);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const activeOscillators = oscillators.current;
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      Object.values(activeOscillators).forEach((oscillator) => oscillator.stop());
    };
  });

  return (
    <section className="clone-surface legacy-keyboard-panel" aria-label="Ancien clavier OP-1">
      <div className="clone-surface-head"><div><span className="section-label">CLAVIER OP-1</span><strong>Surface jouable</strong><small>Clavier restauré · ordinateur ou MIDI</small></div></div>
      <div className="clone-keyboard">{KEYS.map((item) => <button type="button" className={`${item.black ? "clone-key black-key" : "clone-key"} ${pressed.includes(item.note) ? "is-pressed" : ""}`} key={item.note} onPointerDown={() => noteOn(item.note)} onPointerUp={() => noteOff(item.note)} onPointerLeave={() => { if (pressed.includes(item.note)) noteOff(item.note); }}><strong>{item.label}</strong><small>{item.key.toUpperCase()}</small></button>)}</div>
    </section>
  );
}
