/**
 * StudioTapeEditor — copie conforme de l'écran tape.svg OS 246 (320×160).
 *
 * Le viewBox reste 0 0 320 160 — résolution réelle de l'écran OP-1.
 * Les pistes interactives sont les lignes du bas du dessin (y=128–141).
 * Les clips = segments de ligne colorés, exactement comme la machine.
 * Drag sur un clip → repositionne l'offset sur la bande.
 *
 * Géométrie firmware (tape.svg OS 246) :
 *   loop line  : y=122.969
 *   track 1    : y=128.359  (bleu  #698EFF)
 *   track 2    : y=132.396  (vert  #00ED95)
 *   track 3    : y=136.434  (blanc #DFD9FF)
 *   track 4    : y=140.471  (rouge #FF3A5D)
 *   tape x0    : 5.467  tape x1 : 311.398
 */
import { useRef, type MutableRefObject } from "react";

// ── Constantes géométrie firmware ──────────────────────────────────────────────
const SVG_W = 320;
const SVG_H = 160;
const TAPE_DURATION = 360;       // secondes totales OP-1
const TAPE_X0 = 5.467;
const TAPE_X1 = 311.398;
const TAPE_SPAN = TAPE_X1 - TAPE_X0;

// Y exact de chaque piste (extrait de tape.svg)
const TRACK_Y    = [128.359, 132.396, 136.434, 140.471] as const;
// Épaisseur de frappe (hit zone) au-dessus/en dessous de chaque ligne
const HIT_HALF   = 4;

// Couleurs encodeurs réels TE
const TRACK_COLORS = ["#698EFF", "#00ED95", "#DFD9FF", "#FF3A5D"] as const;

function secToRatio(sec: number) {
  return Math.max(0, Math.min(1, sec / TAPE_DURATION));
}
function formatPos(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const t = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${t}`;
}

// ── Chiffres 1-4 (boîte trackno, extrait tape.svg) ────────────────────────────
function TrackNumber({ index }: { index: number }) {
  switch (index) {
    case 0: return <line x1="20.342" y1="9.378" x2="20.342" y2="24.367" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    case 1: return <path d="M13.222,14.443c0-2.797,2.266-5.065,5.063-5.065h3.927c2.77,0,5.011,2.197,5.011,4.964c0,2.242-1.263,3.985-3.511,4.778l-10.487,4.5v0.752h14.238" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    case 2: return <path d="M12.846,13.237c0-2.132,1.73-3.859,3.862-3.859h7.312c2.106,0,3.814,1.676,3.814,3.782c0,2.11-1.708,3.713-3.814,3.713h-6.678h6.678c2.106,0,3.814,1.604,3.814,3.712c0,2.107-1.708,3.784-3.814,3.784h-7.312c-2.133,0-3.862-1.728-3.862-3.862" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    default: return <polyline points="27.444,19.596 12.844,19.596 12.844,18.862 23.065,9.374 23.792,9.374 23.792,23.971" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface StudioTapeEditorProps {
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
  position: number;
  transportPlaying: boolean;
  looping: boolean;
  reversed: boolean;
  audioRefs: MutableRefObject<Record<number, HTMLAudioElement | null>>;
  onFileLoad: (index: number, file: File) => void;
  onTogglePlay: (index: number) => void;
  onSoloChange: (index: number) => void;
  onMuteChange: (index: number) => void;
  onDurationChange: (index: number, duration: number) => void;
  onTrackEnd: () => void;
  onOffsetChange: (index: number, offset: number) => void;
  onSelectTrack: (index: number) => void;
  onSeek: (time: number) => void;
}

// ── Composant principal ───────────────────────────────────────────────────────
export function StudioTapeEditor(props: StudioTapeEditorProps) {
  const {
    tracks, files, sources, sourceRefs,
    waveformPeaks, clipOffsets, clipEnds, durations,
    muted, solo, playing, selectedTrack,
    position, transportPlaying, looping, reversed,
    audioRefs,
    onFileLoad, onTogglePlay, onSoloChange, onMuteChange,
    onDurationChange, onTrackEnd, onOffsetChange, onSelectTrack,
    onSeek,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    kind: "clip" | "playhead";
    trackIndex: number;
    startSvgX: number;
    startOffset: number;
  } | null>(null);

  // Rotation bobines
  const reelAngle = (position * 360) / 8 * (reversed ? -1 : 1);

  // Playhead X dans le SVG
  const playX = reversed
    ? TAPE_X0 + (1 - secToRatio(position)) * TAPE_SPAN
    : TAPE_X0 + secToRatio(position) * TAPE_SPAN;

  // Convertir clientX/Y → coordonnées SVG
  function toSvgPt(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const r = pt.matrixTransform(ctm.inverse());
    return { x: r.x, y: r.y };
  }

  // Trouve la piste la plus proche d'un y SVG donné (dans la zone de pistes)
  function trackAtY(svgY: number): number | null {
    let best = -1, bestDist = Infinity;
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(svgY - TRACK_Y[i]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return bestDist <= HIT_HALF * 2 ? best : null;
  }

  function onSvgPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const pt = toSvgPt(event.clientX, event.clientY);

    // Clic sur la zone du playhead (tolérance 3px en x)
    if (Math.abs(pt.x - playX) < 3 && pt.y >= 116 && pt.y <= 146) {
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
      dragRef.current = { kind: "playhead", trackIndex: -1, startSvgX: pt.x, startOffset: 0 };
      return;
    }

    // Clic dans la zone des pistes
    const ti = trackAtY(pt.y);
    if (ti === null) return;
    onSelectTrack(ti);

    // Clic sur un clip ?
    const offset = clipOffsets[ti] ?? 0;
    const end    = clipEnds[ti] ?? durations[ti] ?? 0;
    if (Boolean(files[ti]) && end > 0) {
      const r0 = reversed ? 1 - secToRatio(offset + end) : secToRatio(offset);
      const r1 = reversed ? 1 - secToRatio(offset)       : secToRatio(offset + end);
      const cx0 = TAPE_X0 + r0 * TAPE_SPAN;
      const cx1 = TAPE_X0 + r1 * TAPE_SPAN;
      if (pt.x >= cx0 - 2 && pt.x <= cx1 + 2) {
        (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
        dragRef.current = { kind: "clip", trackIndex: ti, startSvgX: pt.x, startOffset: offset };
        return;
      }
    }

    // Clic sur la bande vide → seek
    if (pt.y >= 122 && pt.y <= 146 && pt.x >= TAPE_X0 && pt.x <= TAPE_X1) {
      const ratio = (pt.x - TAPE_X0) / TAPE_SPAN;
      const t = reversed ? (1 - ratio) * TAPE_DURATION : ratio * TAPE_DURATION;
      onSeek(Math.max(0, Math.min(TAPE_DURATION, t)));
    }
  }

  function onSvgPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const pt = toSvgPt(event.clientX, event.clientY);
    const dx = pt.x - dragRef.current.startSvgX;

    if (dragRef.current.kind === "playhead") {
      const ratio = Math.max(0, Math.min(1, (pt.x - TAPE_X0) / TAPE_SPAN));
      const t = reversed ? (1 - ratio) * TAPE_DURATION : ratio * TAPE_DURATION;
      onSeek(t);
      return;
    }

    // Drag clip
    const ti = dragRef.current.trackIndex;
    const dSec = (dx / TAPE_SPAN) * TAPE_DURATION * (reversed ? -1 : 1);
    const clipEnd = clipEnds[ti] ?? durations[ti] ?? 0;
    const next = Math.max(0, Math.min(TAPE_DURATION - clipEnd, dragRef.current.startOffset + dSec));
    onOffsetChange(ti, next);
  }

  function onSvgPointerUp() { dragRef.current = null; }

  return (
    <div className="tape-editor-screen">

      {/* Éléments audio cachés */}
      <div style={{ display: "none" }}>
        {[0, 1, 2, 3].map((i) => (
          <audio
            key={i}
            ref={(el) => { audioRefs.current[i] = el; }}
            src={sources[i]}
            muted={muted[i] === true || (solo !== null && solo !== i)}
            onLoadedMetadata={(e) => onDurationChange(i, e.currentTarget.duration)}
            onEnded={onTrackEnd}
          />
        ))}
      </div>

      {/* ── SVG 320×160 — copie conforme de l'écran OP-1 ────────────────── */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block", cursor: "default" }}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerCancel={onSvgPointerUp}
      >
        {/* Fond */}
        <rect width={SVG_W} height={SVG_H} fill="#0c1011" />

        {/* ── Partie statique : chemin du ruban ──────────────────────────── */}
        <g opacity="0.5" stroke="#656579" strokeWidth="1.5" fill="none">
          <path d="M85.445,105.977c0.098-2.271,0.708-4.422,1.719-6.312" />
          <path d="M88.49,115.832c-0.32-0.445-0.616-0.908-0.887-1.389" />
          <path d="M233.314,100.742c-0.16-0.369-0.334-0.732-0.521-1.086" />
          <path d="M232.002,115.564c1.24-1.729,2.118-3.715,2.529-5.879" />
          <circle cx="232.641" cy="53.316" r="22.774" />
          <line x1="212.943" y1="103.658" x2="231.552" y2="107.422" />
          <line x1="167.271" y1="112.29"  x2="203.327" y2="103.658" />
          <line x1="119.239" y1="105.127" x2="153.273" y2="112.436" />
          <line x1="89.547"  y1="111.818" x2="107.205" y2="104.939" />
          <line x1="61.282"  y1="88.301"  x2="81.928"  y2="109.867" />
          <line x1="242.841" y1="94.959"  x2="238.443" y2="105.023" />
        </g>
        <line x1="243.062" y1="94.096" x2="254.666" y2="59.17" stroke="#656579" strokeWidth="1.5" />

        {/* ── Bobines blanches ─────────────────────────────────────────────── */}
        <circle cx="85.225"  cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.639" cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="85.225"  cy="53.316" r="8.323"  fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.793" cy="53.315" r="8.37"   fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="85.225"  cy="53.316" r="1.868"  fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.639" cy="53.316" r="1.869"  fill="none" stroke="#fff" strokeWidth="1.5" />

        {/* Bras bobine droite (tourne) */}
        <g transform={`rotate(${reelAngle}, 232.639, 53.316)`}>
          <line x1="232.54"  y1="35.364" x2="232.54"  y2="17.621" stroke="#fff" strokeWidth="1.5" />
          <line x1="216.846" y1="62.549" x2="201.479" y2="71.421" stroke="#fff" strokeWidth="1.5" />
          <line x1="248.234" y1="62.55"  x2="263.602" y2="71.42"  stroke="#fff" strokeWidth="1.5" />
        </g>
        {/* Bras bobine gauche (tourne en sens inverse) */}
        <g transform={`rotate(${-reelAngle}, 85.225, 53.316)`}>
          <line x1="97.56"  y1="40.039" x2="109.637" y2="27.041" stroke="#fff" strokeWidth="1.5" />
          <line x1="90.555" y1="70.638" x2="95.774"  y2="87.596" stroke="#fff" strokeWidth="1.5" />
          <line x1="67.559" y1="49.272" x2="50.262"  y2="45.313" stroke="#fff" strokeWidth="1.5" />
        </g>

        {/* Têtes + galets */}
        <path d="M167.271,100.63v11.66c0,0-3.396,0.533-7.271,0.533s-7.193-0.533-7.193-0.533v-11.66H167.271z" fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1="205.753" y1="110.85"  x2="210.52"  y2="106.082" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="160"     y1="112.823" x2="160"     y2="106.802" stroke="#fff" strokeWidth="1.5" />
        <circle cx="234.523" cy="105.023" r="3.92" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="113.198" cy="108.16"  r="6.8"  fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="113.198" cy="108.16"  r="1.406" fill="#fff" />
        <circle cx="85.887"  cy="110.354" r="3.919" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="208.137" cy="108.467" r="6.8"  fill="none" stroke="#fff" strokeWidth="1.5" />

        {/* Compteur de position (entre les bobines, haut centre) */}
        <text x="160" y="28" textAnchor="middle" fill="#fff" fontSize="8"
          fontFamily="monospace" opacity="0.5" letterSpacing="0.5">
          {formatPos(position)}
        </text>

        {/* Vitesse bande (tapecurrspeed) */}
        <line x1="160" y1="33.302" x2="160" y2="27.968" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" opacity="0.3" />

        {/* Transport : play/pause décoratif */}
        {transportPlaying ? (
          <g opacity="0.55" fill="#fff">
            <rect x="152" y="47" width="4.5" height="15" rx="1" />
            <rect x="163" y="47" width="4.5" height="15" rx="1" />
          </g>
        ) : (
          <path d="M154.141,47.047c0-1.052,0.747-1.482,1.657-0.955l12.843,7.411c0.909,0.522,0.909,1.385,0,1.908l-12.843,7.416c-0.91,0.523-1.657,0.094-1.657-0.954V47.047z"
            fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" opacity="0.4" />
        )}

        {/* Indicateur niveau (rouge) */}
        <line x1="305.268" y1="4.451" x2="305.268" y2="110.292"
          stroke={transportPlaying ? "#FF3A5D" : "#4E2832"} strokeWidth="1.5" />
        <circle cx="305.268" cy="110.292" r="2.667"
          fill={transportPlaying ? "#FF3A5D" : "#4E2832"} />

        {/* Numéro de piste (cadre haut gauche) */}
        <rect x="6" y="3" width="28.082" height="28.081" fill="none" stroke="#fff" strokeWidth="1.5" />
        <TrackNumber index={selectedTrack} />

        {/* Points séquenceur (décoratifs) */}
        <g fill="#698EFF">
          <circle cx="10.938" cy="89.697" r="2.001" />
          <circle cx="16.963" cy="83.422" r="2.001" />
          <circle cx="22.987" cy="89.697" r="2.001" />
          <circle cx="29.012" cy="89.697" r="2.001" />
        </g>
        <circle cx="19.894" cy="103.623" r="6.736" fill="none" stroke="#00ED95" strokeWidth="1.5" />
        <circle cx="19.894" cy="104.891" r="1.334" fill="#00ED95" />
        <line x1="19.894" y1="113.494" x2="19.894" y2="104.957" stroke="#00ED95" strokeWidth="1.5" />

        {/* Dots fixes (virgules tempo) */}
        <circle cx="143.6"  cy="8.578"  r="0.678" fill="#fff" />
        <circle cx="143.6"  cy="16.156" r="0.678" fill="#fff" />
        <circle cx="173.044" cy="8.578"  r="0.678" fill="#fff" />
        <circle cx="173.044" cy="16.156" r="0.678" fill="#fff" />

        {/* Badge REV */}
        {reversed && (
          <g>
            <rect x="254" y="4" width="28" height="12" rx="1.5" fill="#FF3A5D22" stroke="#FF3A5D" strokeWidth="1" />
            <text x="268" y="12.5" textAnchor="middle" fill="#FF3A5D" fontSize="7"
              fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">REV</text>
            <polyline points="244,119 238,115 244,111" fill="none" stroke="#FF3A5D" strokeWidth="1.5" />
          </g>
        )}

        {/* Graduations bande */}
        {([17.062, 72.425, 127.788, 183.15, 238.514, 293.877] as const).map((x) => (
          <line key={x} x1={x} y1="126.238" x2={x} y2="120.338" stroke="#585566" strokeWidth="1.5" />
        ))}

        {/* ── Ligne de boucle (verte) ────────────────────────────────────── */}
        <line x1="0" y1="122.969" x2={SVG_W} y2="122.969" stroke="#00ED95" strokeWidth="2" />
        <circle cx="160" cy="122.969" r="2.5" fill="#00ED95" />

        {/* ═══════════════════════════════════════════════════════════════════
            PISTES INTERACTIVES — dans le bas de l'écran, comme la machine
            y=128.359 / 132.396 / 136.434 / 140.471
            Épaisseur stroke 3.5 (identique au firmware)
            ═══════════════════════════════════════════════════════════════════ */}
        {([0, 1, 2, 3] as const).map((ti) => {
          const y        = TRACK_Y[ti];
          const color    = TRACK_COLORS[ti];
          const offset   = clipOffsets[ti] ?? 0;
          const clipEnd  = clipEnds[ti] ?? durations[ti] ?? 0;
          const hasClip  = Boolean(files[ti]) && clipEnd > 0;
          const isSelected = ti === selectedTrack;
          const isMuted  = muted[ti] === true || (solo !== null && solo !== ti);
          const isPlaying = playing === ti;

          // Coordonnées x du clip dans le SVG
          const r0 = reversed ? 1 - secToRatio(offset + clipEnd) : secToRatio(offset);
          const r1 = reversed ? 1 - secToRatio(offset)           : secToRatio(offset + clipEnd);
          const cx0 = TAPE_X0 + r0 * TAPE_SPAN;
          const cx1 = TAPE_X0 + Math.min(1, r1) * TAPE_SPAN;

          return (
            <g key={ti} opacity={isMuted ? 0.3 : 1} style={{ cursor: "ew-resize" }}>
              {/* Rail de fond — ligne inactive (comme firmware : couleur sombre) */}
              <line
                x1={TAPE_X0} y1={y} x2={TAPE_X1} y2={y}
                stroke={isSelected ? "#3B2D49" : "#231728"}
                strokeWidth="3.5"
              />
              {/* Indicateur piste sélectionnée (rect gauche, comme firmware) */}
              {isSelected && (
                <rect x="0" y={y - 2.5} width="4" height="5" fill={color} />
              )}

              {/* Clip — segment coloré, exactement comme dans tape.svg */}
              {hasClip && (
                <line
                  x1={cx0} y1={y} x2={cx1} y2={y}
                  stroke={color}
                  strokeWidth="3.5"
                  opacity={isSelected ? 1 : 0.65}
                  style={{ cursor: "ew-resize" }}
                >
                  {/* Pulse quand en lecture */}
                  {isPlaying && (
                    <animate attributeName="opacity"
                      values={isSelected ? "0.5;1;0.5" : "0.3;0.65;0.3"}
                      dur="1.2s" repeatCount="indefinite" />
                  )}
                </line>
              )}

              {/* Waveform SVG miniature dans le clip (quand sélectionné) */}
              {hasClip && isSelected && (waveformPeaks[ti] ?? []).length > 0 && (() => {
                const peaks = waveformPeaks[ti];
                const clipW = cx1 - cx0;
                if (clipW < 2) return null;
                const bw = clipW / peaks.length;
                return (
                  <g opacity="0.35">
                    {peaks.map((peak, i) => {
                      const bh = Math.max(0.3, peak * 2.8);
                      return (
                        <rect
                          key={i}
                          x={cx0 + i * bw}
                          y={y - bh / 2}
                          width={Math.max(0.2, bw - 0.3)}
                          height={bh}
                          fill={color}
                        />
                      );
                    })}
                  </g>
                );
              })()}

              {/* Zone de hit élargie (invisible) — facilite le clic/drag */}
              <rect
                x={TAPE_X0}
                y={y - HIT_HALF}
                width={TAPE_SPAN}
                height={HIT_HALF * 2}
                fill="transparent"
                style={{ cursor: hasClip ? "ew-resize" : "pointer" }}
              />

              {/* Label nom de fichier au survol de la piste sélectionnée */}
              {hasClip && isSelected && files[ti] && (
                <text
                  x={cx0 + 2}
                  y={y - 4.5}
                  fill={color}
                  fontSize="5"
                  fontFamily="monospace"
                  opacity="0.7"
                >
                  {files[ti].length > 40 ? `${files[ti].slice(0, 38)}…` : files[ti]}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Playhead — traverse la zone des pistes ─────────────────────── */}
        <line
          x1={playX} y1="116.635"
          x2={playX} y2="148"
          stroke="#AEB1DC"
          strokeWidth="1.5"
          style={{ cursor: "ew-resize" }}
        />
      </svg>

      {/* ── Barre de chargement des pistes (sous le SVG) ────────────────── */}
      <div className="tape-editor-file-inputs">
        {[0, 1, 2, 3].map((i) => {
          const color = TRACK_COLORS[i];
          const hasFile = Boolean(files[i]);
          const isMuted = muted[i] === true || (solo !== null && solo !== i);
          const isSolo  = solo === i;
          return (
            <div key={i} className={`tape-track-slot${i === selectedTrack ? " is-selected" : ""}${isMuted ? " is-muted" : ""}`}
              onClick={() => onSelectTrack(i)}>
              {/* Indicateur couleur */}
              <span className="slot-dot" style={{ background: color }} />
              {/* Nom fichier ou label piste */}
              <span className="slot-name" style={{ color: hasFile ? color : undefined }}>
                {hasFile ? files[i] : `Piste ${i + 1}`}
              </span>
              {/* Boutons S / M */}
              <button className={`slot-btn${isSolo ? " is-active" : ""}`}
                style={isSolo ? { color, borderColor: color } : {}}
                onClick={(e) => { e.stopPropagation(); onSoloChange(i); }}>S</button>
              <button className={`slot-btn${muted[i] ? " is-active" : ""}`}
                style={muted[i] ? { color: "#FF3A5D", borderColor: "#FF3A5D44" } : {}}
                onClick={(e) => { e.stopPropagation(); onMuteChange(i); }}>M</button>
              {/* Charger fichier */}
              <label className="slot-load" title={hasFile ? "Remplacer" : "Charger audio"}>
                ↓
                <input type="file" accept="audio/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileLoad(i, f);
                  e.currentTarget.value = "";
                }} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
