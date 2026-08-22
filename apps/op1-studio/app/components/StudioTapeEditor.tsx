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
import { useRef, useState, type MutableRefObject } from "react";
import { TrackContextMenu } from "./TrackContextMenu";

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
  recording?: boolean;
  recordingStartPos?: number;
  onRecord?: () => void;
  onToggleGlobalPlayback?: () => void;
  looping: boolean;
  loopIn?: number;
  loopOut?: number;
  onLoopChange?: (looping: boolean) => void;
  onLoopRangeChange?: (loopIn: number, loopOut: number) => void;
  tempo?: number;
  reversed: boolean;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
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
  onNotice?: (msg: string) => void;
  onExportTrack?: (index: number) => void;
  onClearTrack?: (index: number) => void;
  onEditTrim?: (index: number) => void;
}

// ── Composant principal ───────────────────────────────────────────────────────
export function StudioTapeEditor(props: StudioTapeEditorProps) {
  const {
    files, sources,
    waveformPeaks, clipOffsets, clipEnds, durations,
    muted, solo, playing, selectedTrack,
    position, transportPlaying, recording = false,
    recordingStartPos = 0,
    onRecord, onToggleGlobalPlayback,
    looping,
    loopIn = 0, loopOut = 16,
    onLoopChange, onLoopRangeChange,
    tempo = 90,
    reversed,
    volume = 0.85, onVolumeChange,
    audioRefs,
    onFileLoad, onSoloChange, onMuteChange,
    onDurationChange, onTrackEnd, onOffsetChange, onSelectTrack,
    onSeek, onNotice,
    onExportTrack, onClearTrack, onEditTrim,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});
  const [contextMenu, setContextMenu] = useState<{
    trackIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const dragRef = useRef<{
    kind: "clip" | "playhead" | "volume" | "scrub" | "loopIn" | "loopOut" | "overviewScrub";
    trackIndex: number;
    startSvgX: number;
    startOffset: number;
  } | null>(null);

  // Constantes de géométrie de la Bande d'Ensemble Globale (sous la Piste 4)
  const OVERVIEW_X0 = 3.5;
  const OVERVIEW_X1 = 316.5;
  const OVERVIEW_W = OVERVIEW_X1 - OVERVIEW_X0; // 313px
  const OVERVIEW_Y = 146.5;
  const OVERVIEW_H = 10.5;

  // Constantes de projection OP-1
  const HEAD_X = 160; // Tête de lecture fixe au centre de l'écran OP-1
  const BAR_WIDTH_PX = 55.363; // Espacement exact d'une mesure (distance entre graduations OP-1)
  const barSec = (60 / Math.max(30, tempo)) * 4;
  const beatSec = barSec / 4;
  const pixelsPerSec = BAR_WIDTH_PX / barSec;

  // Convertisseur Temps (s) -> Coordonnée X écran
  function timeToX(t: number): number {
    const deltaSec = (t - position) * (reversed ? -1 : 1);
    return HEAD_X + deltaSec * pixelsPerSec;
  }

  // Convertisseur Coordonnée X écran -> Temps (s)
  function xToTime(x: number): number {
    const deltaSec = ((x - HEAD_X) / pixelsPerSec) * (reversed ? -1 : 1);
    return position + deltaSec;
  }

  // Rotation bobines
  const reelAngle = (position * 360) / 8 * (reversed ? -1 : 1);

  // ── Calcul de la région enregistrée et de la forme d'onde composite (fusion des 4 pistes) ──
  const { songStart, songEnd, songDuration, compositeBars, overviewMeasureTicks } = (() => {
    let hasAnyAudio = false;
    let minStart = TAPE_DURATION;
    let maxEnd = 0;

    ([0, 1, 2, 3] as const).forEach((ti) => {
      const hasFile = Boolean(files[ti]);
      const duration = clipEnds[ti] ?? durations[ti] ?? 0;
      const offset = clipOffsets[ti] ?? 0;
      if (hasFile && duration > 0) {
        hasAnyAudio = true;
        minStart = Math.min(minStart, offset);
        maxEnd = Math.max(maxEnd, Math.min(TAPE_DURATION, offset + duration));
      }
    });

    let start = 0;
    let end = 16;

    if (hasAnyAudio) {
      start = Math.max(0, minStart);
      // Adaptation exacte au morceau enregistré (avec au moins 8s de vue pour le confort visuel, max 360s matériel OP-1)
      end = Math.min(TAPE_DURATION, Math.max(maxEnd, start + 8));
    } else if (looping) {
      end = Math.min(TAPE_DURATION, Math.max(loopOut, 16));
    }

    // Inclusion dynamique de la position de la tête de lecture si elle dépasse temporairement
    if (position > end) {
      end = Math.min(TAPE_DURATION, position + 2);
    }
    if (position < start) {
      start = Math.max(0, position - 2);
    }

    const duration = Math.max(1, end - start);
    const NUM_BARS = 104; // Résolution de la mini-bande
    const bars: Array<{
      xRatio: number;
      tracks: Array<{ ti: number; height: number; color: string; isMuted: boolean }>;
      totalHeight: number;
      time: number;
    }> = [];

    for (let b = 0; b < NUM_BARS; b++) {
      const xRatio = (b + 0.5) / NUM_BARS;
      const t = start + xRatio * duration;
      const trackSlices: Array<{ ti: number; height: number; color: string; isMuted: boolean }> = [];
      let sumH = 0;

      ([0, 1, 2, 3] as const).forEach((ti) => {
        const hasFile = Boolean(files[ti]);
        const clipEnd = clipEnds[ti] ?? durations[ti] ?? 0;
        const offset = clipOffsets[ti] ?? 0;
        const isMuted = muted[ti] === true || (solo !== null && solo !== ti);

        if (hasFile && clipEnd > 0 && t >= offset && t <= offset + clipEnd) {
          const peaks = waveformPeaks[ti] ?? [];
          let amp = 0.5;
          if (peaks.length > 0) {
            const peakProgress = (t - offset) / clipEnd;
            const peakIdx = Math.min(peaks.length - 1, Math.max(0, Math.floor(peakProgress * peaks.length)));
            amp = peaks[peakIdx] ?? 0.5;
          }
          const barHeight = Math.max(0.6, amp * 8.2);
          trackSlices.push({
            ti,
            height: barHeight,
            color: TRACK_COLORS[ti],
            isMuted,
          });
          if (!isMuted) {
            sumH = Math.max(sumH, barHeight);
          }
        }
      });

      bars.push({
        xRatio,
        tracks: trackSlices,
        totalHeight: sumH,
        time: t,
      });
    }

    // Repères de mesures dans la bande globale
    const ticks: number[] = [];
    const minBar = Math.floor(start / barSec);
    const maxBar = Math.ceil(end / barSec);
    for (let b = minBar; b <= maxBar; b++) {
      const barTime = b * barSec;
      if (barTime >= start && barTime <= end) {
        const ratio = (barTime - start) / duration;
        ticks.push(OVERVIEW_X0 + ratio * OVERVIEW_W);
      }
    }

    return {
      songStart: start,
      songEnd: end,
      songDuration: duration,
      compositeBars: bars,
      overviewMeasureTicks: ticks,
    };
  })();

  // Convertisseur Temps (s) -> Coordonnée X de la Bande d'Ensemble
  function overviewTimeToX(t: number): number {
    const clamped = Math.max(songStart, Math.min(songEnd, t));
    const ratio = (clamped - songStart) / songDuration;
    return OVERVIEW_X0 + ratio * OVERVIEW_W;
  }

  // Convertisseur Coordonnée X de la Bande d'Ensemble -> Temps (s)
  function overviewXToTime(x: number): number {
    const ratio = Math.max(0, Math.min(1, (x - OVERVIEW_X0) / OVERVIEW_W));
    const t = songStart + ratio * songDuration;
    return Math.max(0, Math.min(TAPE_DURATION, t));
  }

  // Calcul des repères de mesure dynamiques (une barre toutes les mesures, calées au tempo)
  const visibleMeasures = (() => {
    const list: number[] = [];
    const tStart = Math.min(xToTime(-20), xToTime(340));
    const tEnd = Math.max(xToTime(-20), xToTime(340));
    const minBar = Math.max(0, Math.floor(tStart / barSec));
    const maxBar = Math.min(Math.ceil(TAPE_DURATION / barSec), Math.ceil(tEnd / barSec));

    for (let b = minBar; b <= maxBar; b++) {
      const x = timeToX(b * barSec);
      if (x >= -10 && x <= 330) {
        list.push(x);
      }
    }
    return list;
  })();

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

  // Snap automatique au repère de mesure / temps le plus proche
  function snapToGrid(sec: number): number {
    const quant = beatSec; // aligne au quart de temps (beat)
    const snapped = Math.round(sec / quant) * quant;
    return Math.max(0, Math.min(TAPE_DURATION, snapped));
  }

  function onSvgPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const pt = toSvgPt(event.clientX, event.clientY);
    const ti = trackAtY(pt.y);

    // Clic bouton central (e.button === 1) : ouvrir le menu contextuel de piste
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      const targetTi = ti !== null ? ti : selectedTrack;
      setContextMenu({
        trackIndex: targetTi,
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }

    // 0. Clic / Drag sur la Bande d'Ensemble inférieure (Fusion 4 pistes & Navigation précise)
    if (pt.y >= 144.5 && pt.y <= 159.5 && pt.x >= 1.5 && pt.x <= 318.5) {
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
      dragRef.current = { kind: "overviewScrub", trackIndex: -1, startSvgX: pt.x, startOffset: position };
      const targetTime = overviewXToTime(pt.x);
      onSeek(targetTime);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.currentTime = Math.max(0, Math.min(audio.duration || TAPE_DURATION, targetTime));
        }
      });
      onNotice?.(`Position : ${formatPos(targetTime)} / ${formatPos(songEnd)} [Limite Tape OP-1 : 06:00]`);
      return;
    }

    // 1. Glissière de volume sur l'écran (colonne de droite x=295..318, y=10..115)
    if (pt.x >= 295 && pt.x <= 318 && pt.y <= 118) {
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
      dragRef.current = { kind: "volume", trackIndex: -1, startSvgX: pt.x, startOffset: 0 };
      const vol = Math.max(0, Math.min(1, 1 - (pt.y - 10) / 100));
      onVolumeChange?.(vol);
      return;
    }

    // 2. Clic sur le petit bouton au tout début de la piste (Pistes 1..4, x=0..16) -> Sélectionner la piste UNIQUEMENT
    if (pt.x <= 16 && ti !== null) {
      onSelectTrack(ti);
      onNotice?.(`Piste ${ti + 1} sélectionnée.`);
      return;
    }

    // 4. Clic tactile sur le bouton PLAY / PAUSE au centre de l'écran (y=40..65)
    if (pt.x >= 144 && pt.x <= 176 && pt.y >= 40 && pt.y <= 65) {
      onToggleGlobalPlayback?.();
      return;
    }

    // 5. Clic tactile sur le bouton RECORD sous la lecture (y=68..90)
    if (pt.x >= 144 && pt.x <= 176 && pt.y >= 68 && pt.y <= 90) {
      onRecord?.();
      return;
    }

    // 6. Clic tactile sur la bobine gauche (Rewind -5s)
    const dLeftReel = (pt.x - 85.225) ** 2 + (pt.y - 53.316) ** 2;
    if (dLeftReel <= 44 ** 2 && pt.y < 105) {
      const nextPos = Math.max(0, position - 5);
      onSeek(nextPos);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || 360, nextPos));
      });
      onNotice?.(`Rembobinage : ${formatPos(nextPos)}`);
      return;
    }

    // 7. Clic tactile sur la bobine droite (Fast Forward +5s)
    const dRightReel = (pt.x - 232.639) ** 2 + (pt.y - 53.316) ** 2;
    if (dRightReel <= 44 ** 2 && pt.y < 105) {
      const nextPos = Math.min(TAPE_DURATION, position + 5);
      onSeek(nextPos);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || 360, nextPos));
      });
      onNotice?.(`Avance rapide : ${formatPos(nextPos)}`);
      return;
    }

    // 8. Poignée de boucle Loop In / Loop Out sur la ligne verte (y=118..126)
    const loopInX = timeToX(loopIn);
    const loopOutX = timeToX(loopOut);

    if (pt.y >= 118 && pt.y <= 126) {
      if (Math.abs(pt.x - loopInX) <= 8) {
        (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
        dragRef.current = { kind: "loopIn", trackIndex: -1, startSvgX: pt.x, startOffset: loopIn };
        return;
      }
      if (Math.abs(pt.x - loopOutX) <= 8) {
        (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
        dragRef.current = { kind: "loopOut", trackIndex: -1, startSvgX: pt.x, startOffset: loopOut };
        return;
      }
    }

    // 9. Clic dans la zone des 4 pistes (y=127..145) : sélection piste ou drag d'un clip
    if (ti !== null) {
      onSelectTrack(ti);
      const offset = clipOffsets[ti] ?? 0;
      const end    = clipEnds[ti] ?? durations[ti] ?? 0;
      if (Boolean(files[ti]) && end > 0) {
        const cx0 = timeToX(offset);
        const cx1 = timeToX(offset + end);
        const minX = Math.min(cx0, cx1);
        const maxX = Math.max(cx0, cx1);
        if (pt.x >= minX - 4 && pt.x <= maxX + 4) {
          (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
          dragRef.current = { kind: "clip", trackIndex: ti, startSvgX: pt.x, startOffset: offset };
          return;
        }
      }
    }

    // 10. Scrubbing direct de la bande (clic-glisser fait défiler la bande sous la tête centrale)
    if (pt.y >= 115 && pt.y <= 148 && pt.x >= 0 && pt.x <= SVG_W) {
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
      dragRef.current = { kind: "scrub", trackIndex: -1, startSvgX: pt.x, startOffset: position };
      const clickedTime = snapToGrid(xToTime(pt.x));
      onSeek(Math.max(0, Math.min(TAPE_DURATION, clickedTime)));
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.currentTime = Math.max(0, Math.min(audio.duration || 360, clickedTime));
        }
      });
      return;
    }
  }

  function onSvgPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const pt = toSvgPt(event.clientX, event.clientY);
    const dx = pt.x - dragRef.current.startSvgX;

    if (dragRef.current.kind === "overviewScrub") {
      const targetTime = overviewXToTime(pt.x);
      onSeek(targetTime);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.currentTime = Math.max(0, Math.min(audio.duration || TAPE_DURATION, targetTime));
        }
      });
      return;
    }

    if (dragRef.current.kind === "volume") {
      const vol = Math.max(0, Math.min(1, 1 - (pt.y - 10) / 100));
      onVolumeChange?.(vol);
      return;
    }

    if (dragRef.current.kind === "loopIn") {
      const rawT = xToTime(pt.x);
      const snapped = snapToGrid(rawT);
      if (onLoopRangeChange) {
        onLoopRangeChange(Math.min(snapped, loopOut - beatSec), loopOut);
      }
      return;
    }

    if (dragRef.current.kind === "loopOut") {
      const rawT = xToTime(pt.x);
      const snapped = snapToGrid(rawT);
      if (onLoopRangeChange) {
        onLoopRangeChange(loopIn, Math.max(snapped, loopIn + beatSec));
      }
      return;
    }

    if (dragRef.current.kind === "scrub") {
      // Défilement de bande fluide sous la tête fixe
      const dSec = (dx / pixelsPerSec) * (reversed ? 1 : -1);
      const nextPos = Math.max(0, Math.min(TAPE_DURATION, dragRef.current.startOffset - dSec));
      onSeek(nextPos);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.currentTime = Math.max(0, Math.min(audio.duration || 360, nextPos));
        }
      });
      return;
    }

    // Drag clip avec alignement automatique sur les repères de mesure tempo
    if (dragRef.current.kind === "clip") {
      const ti = dragRef.current.trackIndex;
      const dSec = (dx / pixelsPerSec) * (reversed ? -1 : 1);
      const clipEnd = clipEnds[ti] ?? durations[ti] ?? 0;
      const rawNext = dragRef.current.startOffset + dSec;
      const snapped = snapToGrid(rawNext);
      const finalNext = Math.max(0, Math.min(TAPE_DURATION - clipEnd, snapped));
      onOffsetChange(ti, finalNext);
    }
  }

  function onSvgPointerUp() { dragRef.current = null; }

  function onSvgContextMenu(event: React.MouseEvent<SVGSVGElement>) {
    event.preventDefault();
    event.stopPropagation();
    const pt = toSvgPt(event.clientX, event.clientY);
    const ti = trackAtY(pt.y);
    const targetTi = ti !== null ? ti : selectedTrack;
    setContextMenu({
      trackIndex: targetTi,
      x: event.clientX,
      y: event.clientY,
    });
  }

  return (
    <div className="tape-editor-screen" style={{ position: "relative" }}>

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
        onContextMenu={onSvgContextMenu}
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

        {/* ── Bobines blanches interactives (clic gauche = rewind, clic droite = fast-forward) ── */}
        <g style={{ cursor: "pointer" }}>
          <title>Bobine gauche (cliquer pour rembobiner -5s)</title>
          <circle cx="85.225"  cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="85.225"  cy="53.316" r="8.323"  fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="85.225"  cy="53.316" r="1.868"  fill="none" stroke="#fff" strokeWidth="1.5" />
          {/* Bras bobine gauche (tourne en sens inverse) */}
          <g transform={`rotate(${-reelAngle}, 85.225, 53.316)`}>
            <line x1="97.56"  y1="40.039" x2="109.637" y2="27.041" stroke="#fff" strokeWidth="1.5" />
            <line x1="90.555" y1="70.638" x2="95.774"  y2="87.596" stroke="#fff" strokeWidth="1.5" />
            <line x1="67.559" y1="49.272" x2="50.262"  y2="45.313" stroke="#fff" strokeWidth="1.5" />
          </g>
        </g>

        <g style={{ cursor: "pointer" }}>
          <title>Bobine droite (cliquer pour avance rapide +5s)</title>
          <circle cx="232.639" cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="232.793" cy="53.315" r="8.37"   fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="232.639" cy="53.316" r="1.869"  fill="none" stroke="#fff" strokeWidth="1.5" />
          {/* Bras bobine droite (tourne) */}
          <g transform={`rotate(${reelAngle}, 232.639, 53.316)`}>
            <line x1="232.54"  y1="35.364" x2="232.54"  y2="17.621" stroke="#fff" strokeWidth="1.5" />
            <line x1="216.846" y1="62.549" x2="201.479" y2="71.421" stroke="#fff" strokeWidth="1.5" />
            <line x1="248.234" y1="62.55"  x2="263.602" y2="71.42"  stroke="#fff" strokeWidth="1.5" />
          </g>
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

        {/* Compteur de position OP-1 (agrandi, lisible, sans points/barres parasites, avec avertissement couleur fin de bande) */}
        {(() => {
          // Calcul de la proximité de fin de bande (max 360s)
          // 0:00 - 4:00 (< 240s) : Blanc éclatant (#ffffff)
          // 4:00 - 5:15 (240s - 315s) : Orange avertissement (#FF9436)
          // 5:15 - 6:00 (>= 315s) : Rouge alerte fin de bande OP-1 (#FF3A5D)
          let counterColor = "#ffffff";
          let alertStatus: "normal" | "warning" | "critical" = "normal";

          if (position >= 315) {
            counterColor = "#FF3A5D"; // Rouge critique
            alertStatus = "critical";
          } else if (position >= 240) {
            counterColor = "#FF9436"; // Orange avertissement
            alertStatus = "warning";
          }

          return (
            <g style={{ pointerEvents: "none" }}>
              {alertStatus !== "normal" && (
                <rect
                  x="120"
                  y="10"
                  width="80"
                  height="22"
                  rx="4"
                  fill={alertStatus === "critical" ? "#FF3A5D20" : "#FF943618"}
                  stroke={alertStatus === "critical" ? "#FF3A5D77" : "#FF943655"}
                  strokeWidth="1"
                />
              )}
              <text
                x="160"
                y="26.5"
                textAnchor="middle"
                fill={counterColor}
                fontSize="16"
                fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                fontWeight="900"
                letterSpacing="1.8"
                style={{
                  filter: alertStatus === "critical"
                    ? "drop-shadow(0px 0px 4px rgba(255,58,93,0.9))"
                    : alertStatus === "warning"
                    ? "drop-shadow(0px 0px 3px rgba(255,148,54,0.7))"
                    : "none",
                  transition: "fill 0.25s ease, filter 0.25s ease"
                }}
              >
                {formatPos(position)}
              </text>
            </g>
          );
        })()}

        {/* Témoin d'état central : Petit triangle vert de lecture et Petit rond rouge de REC */}
        {recording ? (
          <g style={{ cursor: "pointer" }} onClick={() => onRecord?.()}>
            <title>Enregistrement en cours (cliquer pour stopper)</title>
            {/* Petit rond rouge REC avec anneau pulsant */}
            <circle cx="160" cy="50" r="5.5" fill="#FF3A5D" stroke="#ffffff" strokeWidth="0.9" />
            <circle cx="160" cy="50" r="8.5" fill="none" stroke="#FF3A5D" strokeWidth="1.2" opacity="0.8">
              <animate attributeName="r" values="5.5;10;5.5" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>
        ) : (transportPlaying || playing !== null) ? (
          <g style={{ cursor: "pointer" }} onClick={() => onToggleGlobalPlayback?.()}>
            <title>Lecture en cours (cliquer pour pause)</title>
            {/* Petit triangle vert de lecture */}
            <polygon points="154,43.5 168,50 154,56.5" fill="#00ED95" stroke="#ffffff" strokeWidth="0.8" />
          </g>
        ) : (
          <g style={{ cursor: "pointer", opacity: 0.45 }} onClick={() => onToggleGlobalPlayback?.()}>
            <title>Lecture arrêtée (cliquer pour jouer)</title>
            <polygon points="154.5,44 167.5,50 154.5,56" fill="none" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        )}

        {/* Indicateur & Glissière de Volume Interactive (rouge TE) */}
        {(() => {
          const volY = 10 + (1 - Math.max(0, Math.min(1, volume))) * 100;
          return (
            <g style={{ cursor: "ns-resize" }}>
              <title>Glissière de volume master (glisser verticalement)</title>
              {/* Rail de fond */}
              <line x1="305.268" y1="10" x2="305.268" y2="110"
                stroke="#3a2028" strokeWidth="2.5" strokeLinecap="round" />
              {/* Niveau actif */}
              <line x1="305.268" y1={volY} x2="305.268" y2="110"
                stroke="#FF3A5D" strokeWidth="2.5" strokeLinecap="round" />
              {/* Curseur de volume */}
              <circle cx="305.268" cy={volY} r="4" fill="#FF3A5D" stroke="#fff" strokeWidth="1" />
              {/* Texte % Volume */}
              <text x="305.268" y="117" textAnchor="middle" fill="#FF3A5D" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
                {Math.round(volume * 100)}%
              </text>
              {/* Zone Clic Élargie */}
              <rect x="296" y="5" width="20" height="115" fill="transparent" />
            </g>
          );
        })()}

        {/* Badge REV */}
        {reversed && (
          <g>
            <rect x="254" y="4" width="28" height="12" rx="1.5" fill="#FF3A5D22" stroke="#FF3A5D" strokeWidth="1" />
            <text x="268" y="12.5" textAnchor="middle" fill="#FF3A5D" fontSize="7"
              fontFamily="monospace" fontWeight="bold" letterSpacing="0.5">REV</text>
            <polyline points="244,119 238,115 244,111" fill="none" stroke="#FF3A5D" strokeWidth="1.5" />
          </g>
        )}

        {/* ── Repères de mesure dynamiques (calés sur le tempo et défilant avec la bande) ── */}
        {visibleMeasures.map((x, idx) => (
          <line key={idx} x1={x} y1="126.238" x2={x} y2="120.338" stroke="#585566" strokeWidth="1.5" />
        ))}

        {/* ── Ligne de boucle (verte) & Repères de boucle sans texte ────────── */}
        {(() => {
          const xIn = timeToX(loopIn);
          const xOut = timeToX(loopOut);
          const leftX = Math.min(xIn, xOut);
          const rightX = Math.max(xIn, xOut);

          return (
            <g>
              {/* Rail de base de la boucle */}
              <line x1="0" y1="122.969" x2={SVG_W} y2="122.969" stroke="#2a353d" strokeWidth="2" />
              
              {/* Zone surlignée de la boucle active */}
              {looping && (
                <line
                  x1={Math.max(0, leftX)}
                  y1="122.969"
                  x2={Math.min(SVG_W, rightX)}
                  y2="122.969"
                  stroke="#00ED95"
                  strokeWidth="2.5"
                />
              )}

              {/* Repère départ boucle */}
              <circle cx={xIn} cy="122.969" r="2.5" fill="#00ED95" stroke="#fff" strokeWidth="0.5" />

              {/* Repère fin boucle */}
              <circle cx={xOut} cy="122.969" r="2.5" fill="#00ED95" stroke="#fff" strokeWidth="0.5" />
            </g>
          );
        })()}

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

          // Coordonnées x du clip qui défile sous la tête fixe
          const cx0 = timeToX(offset);
          const cx1 = timeToX(offset + clipEnd);
          const minX = Math.min(cx0, cx1);
          const maxX = Math.max(cx0, cx1);

          return (
            <g key={ti} opacity={isMuted ? 0.3 : 1} style={{ cursor: "ew-resize" }}>
              {/* Rail de fond — ligne inactive (comme firmware : couleur sombre) */}
              <line
                x1="8" y1={y} x2={SVG_W} y2={y}
                stroke={isSelected ? "#3B2D49" : "#231728"}
                strokeWidth="3.5"
              />

              {/* Petit bouton discret au tout début de la piste (clic pour choisir/charger un fichier) */}
              <g style={{ cursor: "pointer" }}>
                <title>{`Piste ${ti + 1} : Cliquer pour choisir un fichier audio`}</title>
                <rect
                  x="1.5"
                  y={y - 2.2}
                  width="5"
                  height="4.4"
                  rx="0.8"
                  fill={hasClip ? color : isSelected ? "#3B2D49" : "#231728"}
                  stroke={color}
                  strokeWidth="0.75"
                />
                <text
                  x="4"
                  y={y + 1.2}
                  textAnchor="middle"
                  fill={hasClip ? "#0b0f14" : color}
                  fontSize="3.8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {ti + 1}
                </text>
              </g>

              {/* Clip — segment coloré défilant */}
              {hasClip && (
                <line
                  x1={Math.max(8, minX)} y1={y} x2={maxX} y2={y}
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

              {/* Segment d'enregistrement en direct rouge OP-1 si REC est actif sur cette piste */}
              {recording && isSelected && (() => {
                const rx0 = timeToX(Math.min(recordingStartPos, position));
                const rx1 = timeToX(Math.max(recordingStartPos, position));
                const rMinX = Math.min(rx0, rx1);
                const rMaxX = Math.max(rx0, rx1);
                return (
                  <g>
                    <line
                      x1={Math.max(8, rMinX)}
                      y1={y}
                      x2={Math.max(rMinX + 1, rMaxX)}
                      y2={y}
                      stroke="#FF3A5D"
                      strokeWidth="3.5"
                      opacity="0.95"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.6;1;0.6"
                        dur="0.8s"
                        repeatCount="indefinite"
                      />
                    </line>
                    {/* Badge REC sur la piste */}
                    <circle cx={Math.max(12, rMaxX)} cy={y} r="2.2" fill="#FF3A5D">
                      <animate attributeName="r" values="1.8;3;1.8" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })()}

              {/* Waveform SVG miniature dans le clip (quand sélectionné) */}
              {hasClip && isSelected && (waveformPeaks[ti] ?? []).length > 0 && (() => {
                const peaks = waveformPeaks[ti];
                const clipW = maxX - minX;
                if (clipW < 2) return null;
                const bw = clipW / peaks.length;
                return (
                  <g opacity="0.35">
                    {peaks.map((peak, i) => {
                      const bh = Math.max(0.3, peak * 2.8);
                      return (
                        <rect
                          key={i}
                          x={minX + i * bw}
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
                x="8"
                y={y - HIT_HALF}
                width={SVG_W - 8}
                height={HIT_HALF * 2}
                fill="transparent"
                style={{ cursor: hasClip ? "ew-resize" : "pointer" }}
              />

              {/* Label de piste et nom de fichier toujours visible à gauche ou au-dessus de la piste */}
              {hasClip && files[ti] ? (
                <text
                  x={Math.max(10, minX + 2)}
                  y={y - 2.5}
                  fill={color}
                  fontSize="3.8"
                  fontFamily="monospace"
                  fontWeight={isSelected ? "bold" : "normal"}
                  opacity={isSelected ? 0.95 : 0.65}
                  style={{ pointerEvents: "none" }}
                >
                  {`T${ti + 1}: ${files[ti].length > 32 ? `${files[ti].slice(0, 30)}…` : files[ti]}`}
                </text>
              ) : isSelected ? (
                <text
                  x="12"
                  y={y - 2.2}
                  fill={color}
                  fontSize="3.5"
                  fontFamily="monospace"
                  opacity="0.45"
                  style={{ pointerEvents: "none" }}
                >
                  {`TRACK ${ti + 1}`}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* ── Playhead centrale FIXE au milieu de l'écran (OP-1) ─────────── */}
        <g>
          <line
            x1="160" y1="116.635"
            x2="160" y2="143.5"
            stroke="#AEB1DC"
            strokeWidth="1.5"
          />
          <polygon points="157.5,116.5 162.5,116.5 160,119.5" fill="#AEB1DC" />
        </g>

        {/* ═══════════════════════════════════════════════════════════════════
            BANDE SONORE D'ENSEMBLE GLOBALE (SOUS LA PISTE 4)
            - Matérialise la bande sonore au complet (fusion visuelle des 4 pistes)
            - S'adapte au contenu enregistré (ne montre que le morceau en cours)
            - Respecte la limite matérielle OP-1 absolue (max 360s / 06:00.0)
            - Permet d'aller à un endroit précis dans le son par clic/glisser
            ═══════════════════════════════════════════════════════════════════ */}
        <g>
          <title>Bande d'ensemble du morceau (Cliquer/Glisser pour naviguer précisément)</title>

          {/* Rail de fond de la bande globale (à peine plus large : x=3.5..316.5) */}
          <rect
            x={OVERVIEW_X0}
            y={OVERVIEW_Y}
            width={OVERVIEW_W}
            height={OVERVIEW_H}
            rx="1.5"
            fill="#090e13"
            stroke="#212d38"
            strokeWidth="0.8"
          />

          {/* Ligne médiane de référence audio */}
          <line
            x1={OVERVIEW_X0 + 1}
            y1={OVERVIEW_Y + OVERVIEW_H / 2}
            x2={OVERVIEW_X1 - 1}
            y2={OVERVIEW_Y + OVERVIEW_H / 2}
            stroke="#17222c"
            strokeWidth="0.6"
          />

          {/* Repères de mesures musicales adaptés dans la bande */}
          {overviewMeasureTicks.map((x, i) => (
            <line
              key={i}
              x1={x}
              y1={OVERVIEW_Y + 1}
              x2={x}
              y2={OVERVIEW_Y + OVERVIEW_H - 1}
              stroke="#1b2834"
              strokeWidth="0.5"
            />
          ))}

          {/* Forme d'onde composite : fusion visuelle des 4 pistes */}
          {compositeBars.map((bar, i) => {
            const barW = Math.max(1, (OVERVIEW_W / compositeBars.length) - 0.4);
            const barX = OVERVIEW_X0 + bar.xRatio * OVERVIEW_W - barW / 2;
            const centerY = OVERVIEW_Y + OVERVIEW_H / 2;

            if (bar.tracks.length === 0) {
              return (
                <line
                  key={i}
                  x1={barX}
                  y1={centerY - 0.5}
                  x2={barX}
                  y2={centerY + 0.5}
                  stroke="#16222b"
                  strokeWidth="0.8"
                />
              );
            }

            // Répartition des composantes de pistes dans la colonne
            let upOffset = 0;
            let downOffset = 0;

            return (
              <g key={i}>
                {bar.tracks.map((tr, tIdx) => {
                  const h = Math.max(0.5, tr.height / bar.tracks.length);
                  const halfH = h / 2;
                  const y = centerY - upOffset - halfH;
                  upOffset += halfH;
                  downOffset += halfH;

                  return (
                    <rect
                      key={tIdx}
                      x={barX}
                      y={Math.max(OVERVIEW_Y + 0.8, Math.min(OVERVIEW_Y + OVERVIEW_H - h - 0.8, y))}
                      width={barW}
                      height={h}
                      fill={tr.color}
                      opacity={tr.isMuted ? 0.25 : 0.9}
                      rx="0.3"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Zone Boucle active (Loop In -> Loop Out) sur la bande d'ensemble */}
          {looping && (() => {
            const lx0 = overviewTimeToX(Math.min(loopIn, loopOut));
            const lx1 = overviewTimeToX(Math.max(loopIn, loopOut));
            const lMin = Math.min(lx0, lx1);
            const lMax = Math.max(lx0, lx1);
            return (
              <g>
                <rect
                  x={Math.max(OVERVIEW_X0, lMin)}
                  y={OVERVIEW_Y + 0.5}
                  width={Math.max(2, lMax - lMin)}
                  height={OVERVIEW_H - 1}
                  fill="#00ED9522"
                  stroke="#00ED95"
                  strokeWidth="0.8"
                  strokeDasharray="2 1"
                  rx="1"
                />
                <circle cx={lMin} cy={OVERVIEW_Y + 2} r="1" fill="#00ED95" />
                <circle cx={lMax} cy={OVERVIEW_Y + 2} r="1" fill="#00ED95" />
              </g>
            );
          })()}

          {/* Fenêtre visible actuelle (Viewport de l'écran supérieur) */}
          {(() => {
            const viewStartSec = Math.max(songStart, xToTime(0));
            const viewEndSec = Math.min(songEnd, xToTime(SVG_W));
            const vx0 = overviewTimeToX(Math.min(viewStartSec, viewEndSec));
            const vx1 = overviewTimeToX(Math.max(viewStartSec, viewEndSec));
            return (
              <rect
                x={Math.max(OVERVIEW_X0, vx0)}
                y={OVERVIEW_Y + 0.5}
                width={Math.max(2, vx1 - vx0)}
                height={OVERVIEW_H - 1}
                fill="#ffffff0d"
                stroke="#ffffff33"
                strokeWidth="0.5"
                rx="0.8"
                style={{ pointerEvents: "none" }}
              />
            );
          })()}

          {/* Curseur de lecture précis sur la bande d'ensemble */}
          {(() => {
            const px = overviewTimeToX(position);
            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Ligne verticale orange fluo OP-1 */}
                <line
                  x1={px}
                  y1={OVERVIEW_Y - 0.5}
                  x2={px}
                  y2={OVERVIEW_Y + OVERVIEW_H + 0.5}
                  stroke="#FF7644"
                  strokeWidth="1.5"
                />
                {/* Repère supérieur */}
                <polygon
                  points={`${px - 1.8},${OVERVIEW_Y - 0.5} ${px + 1.8},${OVERVIEW_Y - 0.5} ${px},${OVERVIEW_Y + 2}`}
                  fill="#FF7644"
                />
                {/* Repère inférieur */}
                <polygon
                  points={`${px - 1.8},${OVERVIEW_Y + OVERVIEW_H + 0.5} ${px + 1.8},${OVERVIEW_Y + OVERVIEW_H + 0.5} ${px},${OVERVIEW_Y + OVERVIEW_H - 2}`}
                  fill="#FF7644"
                />
              </g>
            );
          })()}

          {/* Libellé Début de Morceau */}
          <text
            x={OVERVIEW_X0 + 2.5}
            y={OVERVIEW_Y + OVERVIEW_H - 1.5}
            fill="#5c7a95"
            fontSize="3.2"
            fontFamily="monospace"
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {formatPos(songStart)}
          </text>

          {/* Libellé Fin de Morceau & Limite Machine OP-1 */}
          <text
            x={OVERVIEW_X1 - 2.5}
            y={OVERVIEW_Y + OVERVIEW_H - 1.5}
            textAnchor="end"
            fill="#5c7a95"
            fontSize="3.2"
            fontFamily="monospace"
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {`${formatPos(songEnd)} (MAX 06:00)`}
          </text>

          {/* Zone de clic/glisser tactile et souris pour naviguer */}
          <rect
            x={OVERVIEW_X0 - 2}
            y={OVERVIEW_Y - 2}
            width={OVERVIEW_W + 4}
            height={OVERVIEW_H + 4}
            fill="transparent"
            style={{ cursor: "pointer" }}
          />
        </g>
      </svg>

      {/* Contrôles sortis de l’écran : la zone OLED reste réservée à l’affichage. */}
      <div className="op1-screen-controls" aria-label="Contrôles de l’écran OP-1">
        <div className="op1-screen-track-selector" role="group" aria-label="Sélection de piste">
          <span className="op1-screen-control-label">PISTE</span>
          {[0, 1, 2, 3].map((track) => (
            <button
              key={track}
              type="button"
              className={`op1-screen-track-button op1-screen-track-button-${track + 1} ${selectedTrack === track ? "is-selected" : ""}`}
              onClick={() => { onSelectTrack(track); onNotice?.(`Piste ${track + 1} sélectionnée.`); }}
              aria-pressed={selectedTrack === track}
              title={`Sélectionner la piste ${track + 1}`}
            >
              {track + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`op1-screen-record-button ${recording ? "is-recording" : ""}`}
          onClick={() => onRecord?.()}
          aria-pressed={recording}
          title={recording ? "Arrêter l’enregistrement" : `Enregistrer sur la piste ${selectedTrack + 1}`}
        >
          <span className="op1-screen-record-dot" aria-hidden="true" />
          {recording ? "ARRÊTER" : "ENREGISTRER"}
          <small>Piste {selectedTrack + 1}</small>
        </button>
      </div>

      {/* ── Inputs fichiers invisibles (déclenchés via le menu de piste 1..4) ── */}
      <div style={{ display: "none" }}>
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => {
              fileInputsRef.current[i] = el;
            }}
            type="file"
            accept="audio/*,.wav,.aif,.aiff,.mp3"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileLoad(i, f);
              e.currentTarget.value = "";
            }}
          />
        ))}
      </div>

      {/* Menu contextuel Piste sur clic central / clic droit */}
      {contextMenu !== null && (
        <TrackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          trackIndex={contextMenu.trackIndex}
          trackLabel={`Piste ${contextMenu.trackIndex + 1}`}
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
