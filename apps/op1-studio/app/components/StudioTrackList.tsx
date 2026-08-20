import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { TrackContextMenu } from "./TrackContextMenu";

type TrackIcon = (props: { name: "check" | "download" | "wave" | "settings"; size?: number }) => ReactNode;

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
  onExportTrack,
  onClearTrack,
  onEditTrim,
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
  onExportTrack?: (index: number) => void;
  onClearTrack?: (index: number) => void;
  onEditTrim?: (index: number) => void;
}) {
  const [contextMenu, setContextMenu] = useState<{
    trackIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  return (
    <div className="tape-track-list" style={{ position: "relative" }}>
      {/* Hidden file inputs triggerable only via explicit import action */}
      <div style={{ display: "none" }}>
        {tracks.map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              fileInputsRef.current[i] = el;
            }}
            type="file"
            accept="audio/*,.wav,.aif,.aiff,.mp3"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileLoad(i, file);
              event.currentTarget.value = "";
            }}
          />
        ))}
      </div>

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
            onOpenMenu={(x, y) => setContextMenu({ trackIndex: index, x, y })}
          />
        );
      })}

      {/* Menu contextuel Piste sur clic central / clic droit / bouton ⋮ */}
      {contextMenu !== null && (
        <TrackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackIndex={contextMenu.trackIndex}
          trackLabel={tracks[contextMenu.trackIndex]}
          color={TRACK_COLORS[contextMenu.trackIndex]}
          hasFile={Boolean(files[contextMenu.trackIndex])}
          fileName={files[contextMenu.trackIndex]}
          duration={durations[contextMenu.trackIndex]}
          onImport={() => {
            fileInputsRef.current[contextMenu.trackIndex]?.click();
          }}
          onExport={() => {
            onExportTrack?.(contextMenu.trackIndex);
          }}
          onEditTrim={onEditTrim ? () => onEditTrim(contextMenu.trackIndex) : undefined}
          onClear={() => {
            onClearTrack?.(contextMenu.trackIndex);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
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
  onOpenMenu,
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
  onOpenMenu: (x: number, y: number) => void;
}) {
  const laneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag du clip pour repositionner l'offset
  function handleClipPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return; // Ne drag que sur clic gauche
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
    if (file && (file.type.startsWith("audio/") || file.name.match(/\.(wav|aif|aiff|mp3)$/i))) {
      onFileLoad(file);
    }
  }

  // Intercepte clic central (bouton 1) ou clic droit (contextmenu) pour ouvrir le menu
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button === 1) {
      // Clic bouton central
      e.preventDefault();
      e.stopPropagation();
      onOpenMenu(e.clientX, e.clientY);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onOpenMenu(e.clientX, e.clientY);
  }

  // Position et largeur du clip en % de la piste
  const clipLeftPct = (offset / TAPE_DURATION) * 100;
  const clipWidthPct = Math.max(0, (Math.min(clipEnd, TAPE_DURATION - offset) / TAPE_DURATION) * 100);

  return (
    <div
      className={`tape-track-lane${isSelected ? " is-selected" : ""}${isMuted ? " is-muted" : ""}${isDragOver ? " is-drag-over" : ""}`}
      style={{ "--track-color": color } as React.CSSProperties}
      onClick={(e) => {
        // Clic gauche : uniquement sélectionner la piste
        if (e.button === 0) onSelect();
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Étiquette gauche */}
      <div
        className="track-lane-label"
        style={{ cursor: "pointer" }}
        title="Clic gauche : Sélectionner piste · Clic central / droit : Menu Import/Export"
      >
        <span
          className="track-lane-index"
          style={{ background: color, color: index === 2 ? "#111" : "#fff", cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          title="Sélectionner la piste"
        >
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

        {/* Indicateur visuel discret quand piste vide (sans ouvrir de sélecteur sur clic gauche) */}
        {!hasFile && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "#3e4f4c",
              fontSize: "9px",
              fontFamily: "monospace",
              pointerEvents: "none",
            }}
          >
            <Icon name="wave" size={12} />
            <span>Glisser-déposer un fichier audio ou clic central / menu ⋮</span>
          </div>
        )}
      </div>

      {/* Contrôles droite */}
      <div className="track-lane-controls" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          className={`icon-action${isPlaying ? " is-active" : ""}`}
          aria-label={isPlaying ? "Arrêter" : `Lire ${label}`}
          title={isPlaying ? "Arrêter la lecture" : "Lire cette piste"}
          onClick={(event) => { event.stopPropagation(); onTogglePlay(); }}
        >
          <Icon name={isPlaying ? "check" : "wave"} size={14} />
        </button>
        <button
          className={`track-state${isSolo ? " is-active" : ""}`}
          aria-label={`Solo ${label}`}
          title="Solo (isoler cette piste)"
          onClick={(event) => { event.stopPropagation(); onSoloChange(); }}
        >S</button>
        <button
          className={`track-state${isMutedDirect ? " is-active" : ""}`}
          aria-label={`Mute ${label}`}
          title="Mute (rendre cette piste muette)"
          onClick={(event) => { event.stopPropagation(); onMuteChange(); }}
        >M</button>

        {/* Bouton de menu Piste (⋮) pour ouvrir le menu contextuel au clic */}
        <button
          type="button"
          className="icon-action"
          title="Options de piste (Importer, Exporter, Vider, Trim)..."
          aria-label={`Menu Piste ${index + 1}`}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            onOpenMenu(rect.left - 180, rect.bottom + 6);
          }}
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            lineHeight: 1,
            color: "#94a3b8",
          }}
        >
          ⋮
        </button>
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
