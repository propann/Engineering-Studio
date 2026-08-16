"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { analyzeWavBuffer, computeWaveformPeaks } from "../lib/audioOracle";
import { computeAiffWaveformPeaks, parseAiffFormat } from "../lib/aiffPatchOracle";
import { convertToOp1Audio, type ConversionResult } from "../lib/audioConvert";
import { WaveformMarkers } from "./WaveformMarkers";

type SampleIcon = (props: { name: "wave" | "download" | "check"; size?: number }) => ReactNode;
type SampleMode = "synth" | "drum" | "tape";

const MODE_LABEL: Record<SampleMode, string> = { synth: "Synth", drum: "Drum", tape: "Tape / Album" };
const MODE_LIMIT: Record<SampleMode, number> = { synth: 6, drum: 12, tape: 120 };

type SampleReport = {
  format: "WAV" | "AIFF";
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peaks: Float32Array;
};

export function SampleEditorPanel({ Icon }: { Icon: SampleIcon }) {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [report, setReport] = useState<SampleReport | null>(null);
  const [mode, setMode] = useState<SampleMode>("synth");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [prepared, setPrepared] = useState<ConversionResult | null>(null);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preparedUrl) URL.revokeObjectURL(preparedUrl); }, [preparedUrl]);

  const selectedDuration = Math.max(0, end - start);
  const limit = MODE_LIMIT[mode];
  const tooLong = selectedDuration > limit;
  const selectionLabel = useMemo(() => `${start.toFixed(2)} s → ${end.toFixed(2)} s · ${selectedDuration.toFixed(2)} s`, [start, end, selectedDuration]);

  async function loadFile(nextFile: File | undefined) {
    if (!nextFile) return;
    setError(null); setPrepared(null);
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    setPreparedUrl(null);
    const nextBytes = await nextFile.arrayBuffer();
    const aiff = parseAiffFormat(nextBytes);
    const wav = aiff ? null : analyzeWavBuffer(nextBytes, nextFile.size);
    const duration = aiff ? aiff.frameCount / aiff.sampleRate : wav?.durationSeconds;
    if (!duration) { setFile(null); setBytes(null); setReport(null); setError("Format non reconnu. Utilisez un WAV ou un AIFF PCM."); return; }
    const waveform = aiff ? computeAiffWaveformPeaks(nextBytes, 180) : computeWaveformPeaks(nextBytes, 180);
    if (!waveform) { setError("Impossible de calculer la forme d’onde de ce fichier."); return; }
    setFile(nextFile); setBytes(nextBytes); setStart(0); setEnd(duration);
    setReport({
      format: aiff ? "AIFF" : "WAV", duration, sampleRate: aiff?.sampleRate ?? wav?.sampleRate ?? 0,
      channels: aiff?.channels ?? wav?.channels ?? 0, bitDepth: aiff?.bitDepth ?? wav?.bitDepth ?? 0,
      peaks: waveform.values,
    });
  }

  function updateStart(value: number) { setStart(Math.max(0, Math.min(value, end - 0.01))); }
  function updateEnd(value: number) { setEnd(Math.min(report?.duration ?? value, Math.max(value, start + 0.01))); }

  function prepare() {
    if (!bytes || !report || tooLong) return;
    const result = convertToOp1Audio(bytes, {
      trim: { startSeconds: start, endSeconds: end }, fadeInSeconds: fadeIn, fadeOutSeconds: fadeOut,
      targetSampleRate: 44100, targetChannels: 1, targetFormat: "aiff",
    });
    if (!result) { setError("La conversion locale a échoué."); return; }
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    setPrepared(result); setPreparedUrl(URL.createObjectURL(new Blob([result.bytes], { type: "audio/aiff" })));
  }

  return <section className="sample-editor-panel" aria-labelledby="sample-editor-title">
    <div className="sample-editor-heading">
      <div><span className="section-label">ÉDITEUR DE SAMPLE</span><strong id="sample-editor-title">Préparer un sample OP‑1</strong><small>Tout reste local : le fichier source n’est jamais modifié.</small></div>
      <span className="sample-editor-status"><i />{prepared ? "EXPORT PRÊT" : "LOCAL"}</span>
    </div>
    <label className="sample-dropzone"><Icon name="wave" size={22} /><strong>{file?.name ?? "Déposer ou choisir un WAV / AIFF"}</strong><small>Analyse PCM déterministe · export AIFF mono 44,1 kHz / 16 bits</small><input type="file" accept=".wav,.aif,.aiff,audio/wav,audio/aiff" onChange={(event) => { void loadFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
    {report && <>
      <div className="sample-editor-mode" role="group" aria-label="Destination du sample">
        {(Object.keys(MODE_LABEL) as SampleMode[]).map((key) => <button key={key} type="button" className={mode === key ? "is-active" : ""} onClick={() => setMode(key)}>{MODE_LABEL[key]}<small>{MODE_LIMIT[key]} s max</small></button>)}
      </div>
      <WaveformMarkers peaks={report.peaks} durationSeconds={report.duration} />
      <div className="sample-editor-meta"><span>{report.format} · {report.channels} canal{report.channels > 1 ? "s" : ""} · {report.bitDepth} bits</span><span>{report.sampleRate} Hz · {report.duration.toFixed(2)} s</span><strong>{selectionLabel}</strong></div>
      <div className="sample-editor-range-grid">
        <label><span>Début</span><input type="number" min="0" max={Math.max(0, end - 0.01)} step="0.01" value={start.toFixed(2)} onChange={(event) => updateStart(Number(event.target.value))} /></label>
        <label><span>Fin</span><input type="number" min={Math.min(report.duration, start + 0.01)} max={report.duration} step="0.01" value={end.toFixed(2)} onChange={(event) => updateEnd(Number(event.target.value))} /></label>
        <label><span>Fondu entrée</span><input type="number" min="0" max={Math.min(2, selectedDuration / 2)} step="0.01" value={fadeIn} onChange={(event) => setFadeIn(Math.max(0, Number(event.target.value)))} /></label>
        <label><span>Fondu sortie</span><input type="number" min="0" max={Math.min(2, selectedDuration / 2)} step="0.01" value={fadeOut} onChange={(event) => setFadeOut(Math.max(0, Number(event.target.value)))} /></label>
      </div>
      <div className={`sample-editor-validation ${tooLong ? "is-warning" : "is-ok"}`}><Icon name={tooLong ? "wave" : "check"} size={15} /><span>{tooLong ? `La sélection dépasse la limite ${MODE_LABEL[mode]} de ${limit} secondes.` : `Sélection compatible avec le mode ${MODE_LABEL[mode]}.`}</span></div>
      <div className="sample-editor-actions"><button type="button" className="secondary-action" onClick={() => { setStart(0); setEnd(report.duration); setFadeIn(0); setFadeOut(0); }}>Réinitialiser</button><button type="button" className="primary-action" disabled={tooLong} onClick={prepare}><Icon name="download" size={15} />Préparer l’AIFF</button></div>
      {prepared && preparedUrl && <div className="sample-editor-result"><div><span className="section-label">FICHIER PRÊT</span><strong>AIFF · {prepared.durationSeconds.toFixed(2)} s · mono · 44,1 kHz</strong><small>Nouvelle copie en mémoire, aucune écriture machine.</small></div><a className="secondary-action" href={preparedUrl} download={`${file?.name.replace(/\.[^.]+$/, "") ?? "sample"}-op1.aif`}>Télécharger</a></div>}
    </>}
    {error && <p className="tool-note is-error">{error}</p>}
  </section>;
}
