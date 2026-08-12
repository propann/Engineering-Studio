import { useState, type ReactNode } from "react";

type SoundIcon = (props: { name: "wave" | "tape"; size?: number }) => ReactNode;

export function SoundControlsPanel({ Icon }: { Icon: SoundIcon }) {
  const [mode, setMode] = useState<"synth" | "drum">("synth");
  const [baseFreq, setBaseFreq] = useState(440);
  const [octave, setOctave] = useState(5);
  const [lowRes, setLowRes] = useState(false);

  return (
    <section className="sound-control-panel" aria-labelledby="sound-controls-title">
      <div className="mod-section-heading"><div><span className="section-label">PRÉPARATION PATCH</span><strong id="sound-controls-title">Contrôles audio</strong></div><small>{mode === "synth" ? "1 WAV · 6 s max" : `${lowRes ? "24" : "12"} s max · 24 touches`}</small></div>
      <div className="sound-mode-switch" role="group" aria-label="Mode de patch">
        <button type="button" className={mode === "synth" ? "is-active" : ""} onClick={() => setMode("synth")}><Icon name="wave" size={15} />Synthé</button>
        <button type="button" className={mode === "drum" ? "is-active" : ""} onClick={() => setMode("drum")}><Icon name="tape" size={15} />Drum</button>
      </div>
      {mode === "synth" ? <label className="sound-number-control"><span>Fréquence de base</span><input type="number" min="20" max="20000" value={baseFreq} onChange={(event) => setBaseFreq(Number(event.target.value))} /><small>440 Hz par défaut</small></label> : <><label className="sound-number-control"><span>Octave racine</span><input type="number" min="1" max="10" value={octave} onChange={(event) => setOctave(Number(event.target.value))} /><small>De 1 à 10</small></label><label className="sound-toggle"><input type="checkbox" checked={lowRes} onChange={(event) => setLowRes(event.target.checked)} /><span><strong>Mode basse résolution</strong><small>Double la durée au prix d&apos;une fréquence réduite.</small></span></label></>}
      <div className="sound-tool-status"><span><i /> Moteur de patch détecté</span><code>op-patch-util 1.1.0</code></div>
    </section>
  );
}
