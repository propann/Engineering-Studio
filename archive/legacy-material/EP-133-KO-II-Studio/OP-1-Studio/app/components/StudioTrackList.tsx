import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";

type TrackIcon = (props: { name: "check" | "download" | "wave"; size?: number }) => ReactNode;

// Couleurs TE réelles par piste (même ordre que StudioTapeScreen)
const TRACK_COLORS = ["#698EFF", "#00ED95", "#DFD9FF", "#FF3A5D"] as const;
const TAPE_DURATION = 360; // secondes

function WaveformCanvas({
  peaks,
  color,
  offset,
  clipEnd,
  duration,
}: {
  peaks: number[];
  color: string;
  offset: number;
  clipEnd: number;
  duration: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Zone du clip en proportion de la durée totale
    const clipDuration = Math.max(0.01, clipEnd);
    const barW = w / peaks.length;

    peaks.forEach((peak, i) => {
      const barH = Math.max(1, peak * (h - 4));
      const x = i * barW;
      const y = (h - barH) / 2;

      // Barre principale
      ctx.fillStyle = color + "cc";
      ctx.fillRect(x + 1, y, Math.max(1, barW - 2), barH);
    });

    // Overlay sombre hors du clip (trim)
    const leftRatio = offset / TAPE_DURATION;
    const rightRatio = (offset + clipDuration) / TAPE_DURATION;
    const leftPx = leftRatio * w;
    const rightPx = rightRatio * w;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    if (leftPx > 0) ctx.fillRect(0, 0, leftPx, h);
    if (rightPx < w) ctx.fillRect(rightPx, 0, w - rightPx, h);

    // Ligne de fond (rail de la piste)
    ctx.fillStyle = color + "33";
    ctx.fillRect(0, h / 2 - 1, w, 2);
  }, [peaks, color, offset, clipEnd, duration]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={72}
      className="track-waveform-canvas"
      aria-hidden="true"
    />
  );
}

export function StudioTrackList({
  Icon,
  tracks,
  files,
  sources,
  sourceRefs,
  waveformPeaks,
  clipOffsets,
  clipEnds,
  durations,
  muted,
  solo,
  playing,
  selectedTrack,
  audioRefs,
  onFileLoad,
  onTogglePlay,
  onSoloChange,
  onMuteChange,
  onDurationChange,
  onTrackEnd,
  onOffsetChange,
  onSelectTrack,
}: {
  Icon: TrackIcon;
  tracks: string[];
  files: Record<number, string>;
  sources: Record<number, string>;
  sourceRefs: Record<number, { path: string; status: "linked" | "reconnect" }>;
  waveformPeaks: Record<number, number[]>;
  clipOffsets: Record<number, number>;
  clipEnds: Record<number, number>;
  durations: Record<number, number>;
  muted: Record<number, boolean>;
  solo: number | null;
  playing: number | null;
  selectedTrack: number;
  audioRefs: MutableRefObject<Record<number, HTMLAudioElement | null>>;
  onFileLoad: (index: number, file: File) => void;
  onTogglePlay: (index: number) => void;
  onSoloChange: (index: number) => void;
  onMuteChange: (index: number) => void;
  onDurationChange: (index: number, duration: number) => void;
  onTrackEnd: () => void;
  onOffsetChange: (index: number, offset: number) => void;
  onSelectTrack: (index: number) => void;
}) {
  return (
    <div className="tape-track-list">
      {tracks.map((track, index) => {
        const isMuted = muted[index] === true || (solo !== null && solo !== index);
        const isSelected = selectedTrack === index;
        const color = TRACK_COLORS[index];
        const peaks = waveformPeaks[index] ?? [];
        const offset = clipOffsets[index] ?? 0;
        const clipEnd = clipEnds[index] ?? durations[index] ?? 0;
        const duration = durations[index] ?? 0;
        const hasFile = Boolean(files[index]);

        return (
          <TrackLane
            key={track}
            label={track}
            index={index}
            color={color}
            hasFile={hasFile}
            fileName={files[index]}
            sourceRef={sourceRefs[index]}
            peaks={peaks}
            offset={offset}
            clipEnd={clipEnd}
            duration={duration}
            isMuted={isMuted}
            isSelected={isSelected}
            isPlaying={playing === index}
            isSolo={solo === index}
            isMutedDirect={muted[index] === true}
            Icon={Icon}
            audioRef={(el) => { audioRefs.current[index] = el; }}
            audioSrc={sources[index]}
            onFileLoad={(file) => onFileLoad(index, file)}
            onTogglePlay={() => onTogglePlay(index)}
            onSoloChange={() => onSoloChange(index)}
            onMuteChange={() => onMuteChange(index)}
            onDurationChange={(d) => onDurationChange(index, d)}
            onTrackEnd={onTrackEnd}
            onOffsetChange={(o) => onOffsetChange(index, o)}
            onSelect={() => onSelectTrack(index)}
            muted={isMuted}
          />
        );
      })}
    </div>
  );
}

function TrackLane({
  label,
  index,
  color,
  hasFile,
  fileName,
  sourceRef,
  peaks,
  offset,
  clipEnd,
  duration,
  isMuted,
  isSelected,
  isPlaying,
  isSolo,
  isMutedDirect,
  muted,
  Icon,
  audioRef,
  audioSrc,
  onFileLoad,
  onTogglePlay,
  onSoloChange,
  onMuteChange,
  onDurationChange,
  onTrackEnd,
  onOffsetChange,
  onSelect,
}: {
  label: string;
  index: number;
  color: string;
  hasFile: boolean;
  fileName?: string;
  sourceRef?: { path: string; status: "linked" | "reconnect" };
  peaks: number[];
  offset: number;
  clipEnd: number;
  duration: number;
  isMuted: boolean;
  isSelected: boolean;
  isPlaying: boolean;
  isSolo: boolean;
  isMutedDirect: boolean;
  muted: boolean;
  Icon: TrackIcon;
  audioRef: (el: HTMLAudioElement | null) => void;
  audioSrc?: string;
  onFileLoad: (file: File) => void;
  onTogglePlay: () => void;
  onSoloChange: () => void;
  onMuteChange: () => void;
  onDurationChange: (duration: number) => void;
  onTrackEnd: () => void;
  onOffsetChange: (offset: number) => void;
  onSelect: () => void;
}) {
  const laneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag du clip pour repositionner l'offset
  function handleClipPointerDown(event: React.PointerEvent) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startOffset: offset };
  }

  function handleClipPointerMove(event: React.PointerEvent) {
    if (!dragRef.current || !laneRef.current) return;
    const laneW = laneRef.current.getBoundingClientRect().width;
    const dx = event.clientX - dragRef.current.startX;
    const dSec = (dx / laneW) * TAPE_DURATION;
    const newOffset = Math.max(0, Math.min(TAPE_DURATION - clipEnd, dragRef.current.startOffset + dSec));
    onOffsetChange(newOffset);
  }

  function handleClipPointerUp() {
    dragRef.current = null;
  }

  // Drop d'un fichier audio depuis le système
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave() { setIsDragOver(false); }
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) onFileLoad(file);
  }

  // Position et largeur du clip en % de la piste
  const clipLeftPct = (offset / TAPE_DURATION) * 100;
  const clipWidthPct = Math.max(0, (Math.min(clipEnd, TAPE_DURATION - offset) / TAPE_DURATION) * 100);

  return (
    <div
      className={`tape-track-lane${isSelected ? " is-selected" : ""}${isMuted ? " is-muted" : ""}${isDragOver ? " is-drag-over" : ""}`}
      style={{ "--track-color": color } as React.CSSProperties}
      onClick={onSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Étiquette gauche */}
      <div className="track-lane-label">
        <span className="track-lane-index" style={{ background: color, color: index === 2 ? "#111" : "#fff" }}>
          {index + 1}
        </span>
        <div className="track-lane-info">
          <strong>{label}</strong>
          {fileName ? (
            <small title={fileName}>{fileName}</small>
          ) : (
            <small className="track-lane-empty">— vide —</small>
          )}
          {sourceRef?.status === "reconnect" && (
            <em className="tape-source-status">Reconnecter</em>
          )}
        </div>
      </div>

      {/* Zone de la forme d'onde + clip */}
      <div className="track-lane-wave" ref={laneRef}>
        {/* Fond de piste (rail) */}
        <div className="track-lane-rail" style={{ borderColor: color + "33" }} />

        {/* Waveform canvas */}
        {peaks.length > 0 && (
          <WaveformCanvas
            peaks={peaks}
            color={color}
            offset={offset}
            clipEnd={clipEnd}
            duration={duration}
          />
        )}

        {/* Clip draggable */}
        {hasFile && clipEnd > 0 && (
          <div
            className={`track-clip${isPlaying ? " is-playing" : ""}`}
            style={{
              left: `${clipLeftPct}%`,
              width: `${clipWidthPct}%`,
              background: color + "22",
              borderColor: color,
            }}
            onPointerDown={handleClipPointerDown}
            onPointerMove={handleClipPointerMove}
            onPointerUp={handleClipPointerUp}
            onPointerCancel={handleClipPointerUp}
          >
            <span className="track-clip-label" style={{ color }}>
              {fileName}
            </span>
          </div>
        )}

        {/* Zone de drop vide */}
        {!hasFile && (
          <label className="track-lane-drop">
            <Icon name="download" size={13} />
            <span>Déposer un fichier audio ou cliquer</span>
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFileLoad(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Contrôles droite */}
      <div className="track-lane-controls">
        <button
          className={`icon-action${isPlaying ? " is-active" : ""}`}
          aria-label={isPlaying ? "Arrêter" : `Lire ${label}`}
          onClick={(event) => { event.stopPropagation(); onTogglePlay(); }}
        >
          <Icon name={isPlaying ? "check" : "wave"} size={14} />
        </button>
        <button
          className={`track-state${isSolo ? " is-active" : ""}`}
          aria-label={`Solo ${label}`}
          onClick={(event) => { event.stopPropagation(); onSoloChange(); }}
        >S</button>
        <button
          className={`track-state${isMutedDirect ? " is-active" : ""}`}
          aria-label={`Mute ${label}`}
          onClick={(event) => { event.stopPropagation(); onMuteChange(); }}
        >M</button>
        {/* Bouton charger fichier (si piste déjà occupée) */}
        {hasFile && (
          <label className="track-lane-reload" title="Remplacer le fichier audio">
            <Icon name="download" size={12} />
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFileLoad(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Élément audio caché */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          muted={isMuted}
          onLoadedMetadata={(event) => onDurationChange(event.currentTarget.duration)}
          onEnded={onTrackEnd}
        />
      )}
    </div>
  );
}
