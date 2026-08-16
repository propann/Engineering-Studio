/**
 * WaveformMarkers — forme d'onde réelle (pas décorative) avec, pour un patch
 * drum multi-échantillons, les marqueurs de découpe matérialisés dessus.
 * Convention documentée dans `docs/AUDIO_FILE_FORMAT_REFERENCE.md` : un seul
 * fichier peut porter jusqu'à 24 sons différents, chacun délimité par une
 * paire `start`/`end` dans le chunk `APPL`/`op-1` — c'est cette convention
 * qu'on rend visible ici plutôt que de la laisser invisible dans le JSON.
 */
import type { DrumMarker } from "../lib/aiffPatchOracle";

const MARKER_COLORS = ["#698EFF", "#00ED95", "#FF3A5D", "#e8a020", "#DFD9FF"];

export function WaveformMarkers({
  peaks, durationSeconds, markers,
}: {
  peaks: Float32Array;
  durationSeconds: number;
  markers?: DrumMarker[];
}) {
  const activeMarkers = (markers ?? []).filter((m) => m.active);
  const width = 300;
  const height = 60;
  const mid = height / 2;
  const barWidth = width / peaks.length;

  return (
    <div className="waveform-markers">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: `${height}px`, display: "block" }}>
        <rect x={0} y={0} width={width} height={height} fill="#0c1011" />
        {activeMarkers.length > 0 && activeMarkers.map((marker, i) => {
          const x0 = (marker.startSeconds / durationSeconds) * width;
          const x1 = (marker.endSeconds / durationSeconds) * width;
          const color = MARKER_COLORS[i % MARKER_COLORS.length];
          return <rect key={marker.key} x={x0} y={0} width={Math.max(0.5, x1 - x0)} height={height} fill={color} opacity={.14} />;
        })}
        {Array.from(peaks).map((value, i) => {
          const barHeight = Math.max(0.5, value * (height - 4));
          return <rect key={i} x={i * barWidth} y={mid - barHeight / 2} width={Math.max(0.6, barWidth - 0.3)} height={barHeight} fill="#698EFF" />;
        })}
        {activeMarkers.map((marker, i) => {
          const x0 = (marker.startSeconds / durationSeconds) * width;
          const color = MARKER_COLORS[i % MARKER_COLORS.length];
          return (
            <g key={`m${marker.key}`}>
              <line x1={x0} y1={0} x2={x0} y2={height} stroke={color} strokeWidth={.6} opacity={.85} />
              <text x={x0 + 2} y={9} fontSize={7} fontFamily="monospace" fontWeight={700} fill={color}>{marker.key}</text>
            </g>
          );
        })}
      </svg>
      {activeMarkers.length > 0 && (
        <small className="waveform-markers-note">
          {activeMarkers.length} son{activeMarkers.length > 1 ? "s" : ""} différent{activeMarkers.length > 1 ? "s" : ""} découpé{activeMarkers.length > 1 ? "s" : ""} dans ce fichier, marqueurs {"start"}/{"end"} du patch.
        </small>
      )}
    </div>
  );
}
