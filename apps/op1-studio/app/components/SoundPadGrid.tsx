"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Pad = { id: number; name: string; key: string };
type PadSample = { name: string; url: string };

const pads: Pad[] = [
  { id: 1, name: "Kick", key: "A" }, { id: 2, name: "Kick alt", key: "W" },
  { id: 3, name: "Snare", key: "S" }, { id: 4, name: "Rim", key: "E" },
  { id: 5, name: "Clap", key: "D" }, { id: 6, name: "Snap", key: "F" },
  { id: 7, name: "Perc", key: "T" }, { id: 8, name: "Tambo", key: "G" },
  { id: 9, name: "Hi-hat C", key: "Y" }, { id: 10, name: "Hi-hat O", key: "H" },
  { id: 11, name: "Ride", key: "U" }, { id: 12, name: "Crash", key: "J" },
  { id: 13, name: "Tom low", key: "K" }, { id: 14, name: "Tom mid", key: "O" },
  { id: 15, name: "Tom high", key: "L" }, { id: 16, name: "Shaker", key: "P" },
  { id: 17, name: "Click", key: "Z" }, { id: 18, name: "Clav", key: "X" },
  { id: 19, name: "Cowbell", key: "C" }, { id: 20, name: "Tambourine", key: "V" },
  { id: 21, name: "Noise", key: "B" }, { id: 22, name: "Vocal", key: "N" },
  { id: 23, name: "Impact", key: "M" }, { id: 24, name: "FX", key: "," },
];

export function SoundPadGrid() {
  const [samples, setSamples] = useState<Record<number, PadSample>>({});
  const [selected, setSelected] = useState(1);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const preview = useCallback((id: number) => {
    const sample = samples[id];
    if (!sample) return;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
    }
    const audio = new Audio(sample.url);
    audioRef.current = audio;
    audio.play().catch(() => {
      // Ignore interrupted by pause or autoplay policy restrictions
    });
    setSelected(id);
  }, [samples]);

  function assign(id: number, file?: File) {
    if (!file) return;
    setSamples((current) => {
      const previous = current[id];
      if (previous) URL.revokeObjectURL(previous.url);
      return { ...current, [id]: { name: file.name, url: URL.createObjectURL(file) } };
    });
    setSelected(id);
  }

  const clearSelected = useCallback(() => {
    setSamples((current) => {
      const sample = current[selected];
      if (sample) URL.revokeObjectURL(sample.url);
      const next = { ...current };
      delete next[selected];
      return next;
    });
  }, [selected]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        preview(selected);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        clearSelected();
        return;
      }
      const pad = pads.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (pad) {
        event.preventDefault();
        setSelected(pad.id);
        preview(pad.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelected, preview, selected]);

  useEffect(() => () => {
    Object.values(samples).forEach((sample) => URL.revokeObjectURL(sample.url));
    audioRef.current?.pause();
  }, [samples]);

  return (
    <section className="sound-pad-section" aria-labelledby="sound-pad-title">
      <div className="mod-section-heading"><div><span className="section-label">DRUM KIT</span><strong id="sound-pad-title">24 pads OP-1</strong></div><small>{Object.keys(samples).length}/24 chargés</small></div>
      <div className="sound-pad-grid">
        {pads.map((pad) => {
          const sample = samples[pad.id];
          return <button type="button" key={pad.id} className={`sound-pad ${selected === pad.id ? "is-selected" : ""} ${sample ? "has-sample" : ""}`} onClick={() => preview(pad.id)} onDoubleClick={() => inputRefs.current[pad.id]?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); assign(pad.id, event.dataTransfer.files[0]); }}><span className="sound-pad-key">{pad.key}</span><strong>{sample?.name ?? pad.name}</strong><small>{sample ? "PRÉÉCOUTE" : "DÉPOSER UN SAMPLE"}</small><input ref={(element) => { inputRefs.current[pad.id] = element; }} type="file" accept="audio/*" className="visually-hidden" onChange={(event) => { assign(pad.id, event.target.files?.[0]); event.currentTarget.value = ""; }} /></button>;
        })}
      </div>
      <div className="sound-pad-footer"><span>Cliquer pour écouter · double-cliquer pour choisir un fichier</span><button type="button" className="secondary-action" onClick={clearSelected}>Effacer le pad sélectionné</button></div>
    </section>
  );
}
