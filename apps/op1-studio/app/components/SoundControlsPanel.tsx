import { useEffect, useState, type ReactNode } from "react";
import {
  analyzeWavBuffer, computeWaveformPeaks, detectSilenceTrim, suggestNormalizationGainDb,
  type SilenceTrimSuggestion,
} from "../lib/audioOracle";
import {
  parseAiffFormat, computeAiffWaveformPeaks, readOp1PatchJson, isDrumPatch, drumMarkersInSeconds, detectAiffSilenceTrim,
  type DrumMarker, type Op1PatchData,
} from "../lib/aiffPatchOracle";
import { convertToOp1Audio, type ConversionResult } from "../lib/audioConvert";
import { WaveformMarkers } from "./WaveformMarkers";

type SoundIcon = (props: { name: "wave" | "tape"; size?: number }) => ReactNode;

type PreflightReport = {
  kind: "wav" | "aiff";
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peakLevel: number;
  clipped?: boolean;
  clippedSampleCount?: number;
};

export function SoundControlsPanel({ Icon, onPrepared }: { Icon: SoundIcon; onPrepared?: () => void }) {
  const [mode, setMode] = useState<"synth" | "drum">("synth");
  const [baseFreq, setBaseFreq] = useState(440);
  const [octave, setOctave] = useState(5);
  const [lowRes, setLowRes] = useState(false);

  // Préflight client (feuille de route M3.1, Phase C) : lecture locale
  // immédiate via app/lib/audioOracle.ts (WAV, porté de l'EP-133) et
  // app/lib/aiffPatchOracle.ts (AIFF + marqueurs de patch OP-1, code
  // original), avant même le préflight Python (`tools/sample_preflight.py`).
  // Affiche seulement — rien n'est converti, trimé ou transféré ici.
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [trim, setTrim] = useState<SilenceTrimSuggestion | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [patch, setPatch] = useState<Op1PatchData | null>(null);
  const [markers, setMarkers] = useState<DrumMarker[] | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  // Phase B/C (feuille de route M3.1) : « préparer le fichier » convertit
  // localement (app/lib/audioConvert.ts) sans jamais écrire sur un volume
  // OP-1 — action explicitement distincte d'un futur « transférer ».
  const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);
  const [applyTrim, setApplyTrim] = useState(false);
  const [prepared, setPrepared] = useState<ConversionResult | null>(null);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (preparedUrl) URL.revokeObjectURL(preparedUrl); };
  }, [preparedUrl]);

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setReport(null); setTrim(null); setPeaks(null); setPatch(null); setMarkers(null); setUnsupported(false);
    setPrepared(null); setApplyTrim(false);
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    setPreparedUrl(null);
    const bytes = await file.arrayBuffer();
    setFileBytes(bytes);

    // L'OP-1 utilise l'AIFF pour ses patches et ses pistes : on l'essaie en
    // premier, avec repli WAV pour les fichiers pas encore convertis.
    const aiff = parseAiffFormat(bytes);
    if (aiff) {
      const waveform = computeAiffWaveformPeaks(bytes, 150);
      setPeaks(waveform?.values ?? null);
      setReport({
        kind: "aiff", durationSeconds: aiff.frameCount / aiff.sampleRate, sampleRate: aiff.sampleRate,
        channels: aiff.channels, bitDepth: aiff.bitDepth, peakLevel: waveform ? Math.max(0, ...waveform.values) : 0,
      });
      const patchData = readOp1PatchJson(bytes);
      setPatch(patchData);
      if (patchData && isDrumPatch(patchData)) {
        setMarkers(drumMarkersInSeconds(patchData, waveform?.durationSeconds));
      }
      setTrim(detectAiffSilenceTrim(bytes) as any);
      return;
    }

    const analyzed = analyzeWavBuffer(bytes) as any;
    if (!analyzed) { setUnsupported(true); return; }
    setReport({
      kind: "wav", durationSeconds: analyzed.durationSeconds || (analyzed.durationMs ? analyzed.durationMs / 1000 : 0), sampleRate: analyzed.sampleRate,
      channels: analyzed.channels, bitDepth: analyzed.bitDepth, peakLevel: analyzed.peakLevel || 0.8,
      clipped: analyzed.clipped || false, clippedSampleCount: analyzed.clippedSampleCount || 0,
    });
    setTrim(detectSilenceTrim(bytes) as any);
    setPeaks((computeWaveformPeaks(bytes, 150) as any)?.values ?? null);
  }

  const overLimit = report ? report.durationSeconds > (mode === "synth" ? 6 : 12) : false;
  const gain = report ? suggestNormalizationGainDb(report.peakLevel) : null;

  function onPrepareFile() {
    if (!fileBytes) return;
    // AIFF, pas WAV : c'est le format que l'OP-1 lit réellement pour un
    // sample utilisateur (voir AUDIO_FILE_FORMAT_REFERENCE.md §1-2).
    const result = convertToOp1Audio(fileBytes, {
      trim: applyTrim && trim ? { startSeconds: (trim as any).startSeconds || 0, endSeconds: (trim as any).endSeconds || 0 } : undefined,
    });
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    if (!result) { setPrepared(null); setPreparedUrl(null); return; }
    setPrepared(result);
    setPreparedUrl(URL.createObjectURL(new Blob([result.bytes], { type: "audio/aiff" })));
    onPrepared?.();
  }

  const preparedFileName = fileName ? `${fileName.replace(/\.[^.]+$/, "")}-op1.aif` : "op1-prepared.aif";

  return (
    <section className="sound-control-panel" aria-labelledby="sound-controls-title">
      <div className="mod-section-heading"><div><span className="section-label">PRÉPARATION PATCH</span><strong id="sound-controls-title">Contrôles audio</strong></div><small>{mode === "synth" ? "1 WAV · 6 s max" : `${lowRes ? "24" : "12"} s max · 24 touches`}</small></div>
      <div className="sound-mode-switch" role="group" aria-label="Mode de patch">
        <button type="button" className={mode === "synth" ? "is-active" : ""} onClick={() => setMode("synth")}><Icon name="wave" size={15} />Synthé</button>
        <button type="button" className={mode === "drum" ? "is-active" : ""} onClick={() => setMode("drum")}><Icon name="tape" size={15} />Drum</button>
      </div>
      {mode === "synth" ? <label className="sound-number-control"><span>Fréquence de base</span><input type="number" min="20" max="20000" value={baseFreq} onChange={(event) => setBaseFreq(Number(event.target.value))} /><small>440 Hz par défaut</small></label> : <><label className="sound-number-control"><span>Octave racine</span><input type="number" min="1" max="10" value={octave} onChange={(event) => setOctave(Number(event.target.value))} /><small>De 1 à 10</small></label><label className="sound-toggle"><input type="checkbox" checked={lowRes} onChange={(event) => setLowRes(event.target.checked)} /><span><strong>Mode basse résolution</strong><small>Double la durée au prix d&apos;une fréquence réduite.</small></span></label></>}

      <label className="sound-preflight-input">
        <input type="file" accept=".wav,.aif,.aiff,audio/wav,audio/x-wav,audio/aiff,audio/x-aiff" onChange={(event) => onFileSelected(event.target.files?.[0])} />
        <span>{fileName ?? "Analyser un WAV ou AIFF avant import"}</span>
      </label>

      {peaks && report && (
        <WaveformMarkers peaks={peaks} durationSeconds={report.durationSeconds} markers={markers ?? undefined} />
      )}

      {report && (
        <div className="sound-preflight-report">
          {patch && (
            <div className="sound-preflight-row">
              <span>Patch détecté</span><strong>{patch.type} · {patch.name}</strong>
              <small>chunk APPL/op-1 lu localement, voir AUDIO_FILE_FORMAT_REFERENCE.md</small>
            </div>
          )}
          <div className={`sound-preflight-row${overLimit ? " is-over" : " is-ok"}`}>
            <span>Durée</span><strong>{report.durationSeconds.toFixed(2)} s</strong>
            <small>{mode === "synth" ? "limite 6 s" : "limite 12 s"}{overLimit ? " · dépassée" : ""}</small>
          </div>
          <div className="sound-preflight-row"><span>Format</span><strong>{report.kind.toUpperCase()}</strong></div>
          <div className="sound-preflight-row"><span>Fréquence</span><strong>{report.sampleRate} Hz</strong></div>
          <div className="sound-preflight-row"><span>Canaux</span><strong>{report.channels}</strong></div>
          <div className="sound-preflight-row"><span>Profondeur</span><strong>{report.bitDepth} bits</strong></div>
          <div className={`sound-preflight-row${report.clipped ? " is-over" : " is-ok"}`}>
            <span>Crête</span><strong>{(report.peakLevel * 100).toFixed(1)} %</strong>
            {report.clipped && <small>écrêtage détecté · {report.clippedSampleCount} échantillon(s)</small>}
          </div>
          {trim && (
            <div className="sound-preflight-row">
              <span>Trim suggéré</span><strong>{((trim as any).startSeconds || 0).toFixed(2)}s → {((trim as any).endSeconds || 0).toFixed(2)}s</strong>
              <small>suggestion seulement, rien n’est coupé ici</small>
            </div>
          )}
          {gain !== null && (
            <div className="sound-preflight-row"><span>Gain suggéré</span><strong>{gain > 0 ? "+" : ""}{gain.toFixed(1)} dB</strong></div>
          )}
        </div>
      )}

      {report && fileBytes && (
        <div className="sound-prepare-block">
          {trim && (
            <label className="sound-toggle">
              <input type="checkbox" checked={applyTrim} onChange={(event) => setApplyTrim(event.target.checked)} />
              <span><strong>Appliquer le trim suggéré</strong><small>{((trim as any).startSeconds || 0).toFixed(2)}s → {((trim as any).endSeconds || 0).toFixed(2)}s, seulement si coché</small></span>
            </label>
          )}
          <button type="button" className="sound-prepare-button" onClick={onPrepareFile}>
            Préparer le fichier (AIFF mono 44,1 kHz/16 bits)
          </button>
          <small className="tool-note">Conversion locale seulement — rien n’est transféré sur l’OP-1 depuis ce bouton. AIFF, pas WAV : c’est le format que la machine lit réellement.</small>
          {prepared && preparedUrl && (
            <div className="sound-preflight-row is-ok">
              <span>Fichier prêt</span><strong>{prepared.format.toUpperCase()} · {prepared.durationSeconds.toFixed(2)}s · {prepared.sampleRate} Hz · {prepared.channels === 1 ? "mono" : "stéréo"}</strong>
              <a href={preparedUrl} download={preparedFileName}>Télécharger {preparedFileName}</a>
            </div>
          )}
        </div>
      )}
      {unsupported && <p className="tool-note">Format non reconnu par l’analyse locale (WAV/AIFF PCM ou float). Ce fichier passe par le préflight existant (`tools/sample_preflight.py`) sans bloquer l’import.</p>}

      <div className="sound-tool-status"><span><i /> Moteur de patch détecté</span><code>op-patch-util 1.1.0</code></div>
    </section>
  );
}
