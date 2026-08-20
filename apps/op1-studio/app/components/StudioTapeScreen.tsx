/**
 * StudioTapeScreen — écran Tape du firmware OP-1 rendu en SVG inline React.
 *
 * Géométrie extraite de .cache/firmware/op1_246/content/display/tape.svg
 * (320 × 160 px, OS 246). Les bobines tournent pendant la lecture.
 * Les clips sur les 4 pistes sont rendus dynamiquement.
 */

const TAPE_W = 320;
const TAPE_H = 160;
const TAPE_DURATION = 360; // secondes max OP-1
const TAPE_X0 = 5.467; // x gauche de la bande
const TAPE_X1 = 311.398; // x droite de la bande
const TAPE_SPAN = TAPE_X1 - TAPE_X0; // ~305.93 px

// Y des 4 pistes dans le SVG 320×160
const TRACK_Y = [128.359, 132.396, 136.434, 140.471] as const;

// Couleurs encodeurs réels (source : op1-glitter THEME_CREATION.md)
const TRACK_COLORS = ["#698EFF", "#00ED95", "#DFD9FF", "#FF3A5D"] as const;

function secToX(seconds: number): number {
  return TAPE_X0 + Math.max(0, Math.min(1, seconds / TAPE_DURATION)) * TAPE_SPAN;
}

// Chiffres 1-4 dans le cadre track-number, tirés de tape.svg
function TrackNumber({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <line x1="20.342" y1="9.378" x2="20.342" y2="24.367" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    case 1:
      return <path d="M13.222,14.443c0-2.797,2.266-5.065,5.063-5.065h3.927c2.77,0,5.011,2.197,5.011,4.964c0,2.242-1.263,3.985-3.511,4.778l-10.487,4.5v0.752h14.238" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    case 2:
      return <path d="M12.846,13.237c0-2.132,1.73-3.859,3.862-3.859h7.312c2.106,0,3.814,1.676,3.814,3.782c0,2.11-1.708,3.713-3.814,3.713h-6.678h6.678c2.106,0,3.814,1.604,3.814,3.712c0,2.107-1.708,3.784-3.814,3.784h-7.312c-2.133,0-3.862-1.728-3.862-3.862" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
    default:
      return <polyline points="27.444,19.596 12.844,19.596 12.844,18.862 23.065,9.374 23.792,9.374 23.792,23.971" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" />;
  }
}

export type TapeClip = {
  offset: number;   // début en secondes
  clipEnd: number;  // fin en secondes (durée trim)
};

export function StudioTapeScreen({
  clips,
  position,
  playing,
  selectedTrack,
  looping,
  loopIn = 0,
  loopOut = 360,
  tempo = 90,
}: {
  clips: Record<number, TapeClip | undefined>;
  position: number;
  playing: boolean;
  selectedTrack: number;
  looping: boolean;
  loopIn?: number;
  loopOut?: number;
  tempo?: number;
}) {
  // Rotation des bobines : ~1 tour toutes les 8 secondes
  const reelAngle = (position * 360) / 8;
  const playX = secToX(position);

  // Repères de mesure dynamiques calés sur le tempo
  const beatSec = 60 / Math.max(30, tempo);
  const visibleMeasures = (() => {
    const list: Array<{ x: number; isBar: boolean; barNumber: number }> = [];
    const stepRatio = (beatSec / TAPE_DURATION) * TAPE_SPAN;
    let stride = 1;
    if (stepRatio < 3) stride = 4;
    if (stepRatio < 0.75) stride = 16;
    if (stepRatio < 0.2) stride = 32;

    const totalBeats = Math.floor(TAPE_DURATION / beatSec);
    for (let b = 0; b <= totalBeats; b += stride) {
      const sec = b * beatSec;
      if (sec > TAPE_DURATION) break;
      list.push({
        x: secToX(sec),
        isBar: b % 4 === 0,
        barNumber: Math.floor(b / 4) + 1,
      });
    }
    return list;
  })();

  return (
    <div className="studio-tape-screen" aria-label="Écran Tape OP-1">
      <svg
        viewBox={`0 0 ${TAPE_W} ${TAPE_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-hidden="true"
      >
        {/* Fond */}
        <rect width={TAPE_W} height={TAPE_H} fill="#0c1011" />

        {/* ── Bobines blanches ─────────────────────────────────────────── */}
        {/* Cercles extérieurs */}
        <circle cx="85.225" cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.639" cy="53.316" r="42.499" fill="none" stroke="#fff" strokeWidth="1.5" />
        {/* Anneaux intérieurs */}
        <circle cx="85.225" cy="53.316" r="8.323" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.793" cy="53.315" r="8.37" fill="none" stroke="#fff" strokeWidth="1.5" />
        {/* Points centraux */}
        <circle cx="85.225" cy="53.316" r="1.868" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="232.639" cy="53.316" r="1.869" fill="none" stroke="#fff" strokeWidth="1.5" />

        {/* Bras droits de bobine (tournent avec la lecture) */}
        <g transform={`rotate(${reelAngle}, 232.639, 53.316)`}>
          <line x1="232.54" y1="35.364" x2="232.54" y2="17.621" stroke="#fff" strokeWidth="1.5" />
          <line x1="216.846" y1="62.549" x2="201.479" y2="71.421" stroke="#fff" strokeWidth="1.5" />
          <line x1="248.234" y1="62.55" x2="263.602" y2="71.42" stroke="#fff" strokeWidth="1.5" />
        </g>
        {/* Bras gauches (tournent en sens inverse) */}
        <g transform={`rotate(${-reelAngle}, 85.225, 53.316)`}>
          <line x1="97.56" y1="40.039" x2="109.637" y2="27.041" stroke="#fff" strokeWidth="1.5" />
          <line x1="90.555" y1="70.638" x2="95.774" y2="87.596" stroke="#fff" strokeWidth="1.5" />
          <line x1="67.559" y1="49.272" x2="50.262" y2="45.313" stroke="#fff" strokeWidth="1.5" />
        </g>

        {/* Têtes et galets */}
        <path d="M167.271,100.63v11.66c0,0-3.396,0.533-7.271,0.533s-7.193-0.533-7.193-0.533v-11.66H167.271z" fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1="205.753" y1="110.85" x2="210.52" y2="106.082" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="160" y1="112.823" x2="160" y2="106.802" stroke="#fff" strokeWidth="1.5" />
        <circle cx="234.523" cy="105.023" r="3.92" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="113.198" cy="108.16" r="6.8" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="113.198" cy="108.16" r="1.406" fill="#fff" />
        <circle cx="85.887" cy="110.354" r="3.919" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="208.137" cy="108.467" r="6.8" fill="none" stroke="#fff" strokeWidth="1.5" />

        {/* ── Chemin du ruban (gris foncé) ─────────────────────────────── */}
        <g opacity="0.5" stroke="#656579" strokeWidth="1.5" fill="none">
          <path d="M85.445,105.977c0.098-2.271,0.708-4.422,1.719-6.312" />
          <path d="M88.49,115.832c-0.32-0.445-0.616-0.908-0.887-1.389" />
          <path d="M233.314,100.742c-0.16-0.369-0.334-0.732-0.521-1.086" />
          <path d="M232.002,115.564c1.24-1.729,2.118-3.715,2.529-5.879" />
          <circle cx="232.641" cy="53.316" r="22.774" />
          <line x1="212.943" y1="103.658" x2="231.552" y2="107.422" />
          <line x1="167.271" y1="112.29" x2="203.327" y2="103.658" />
          <line x1="119.239" y1="105.127" x2="153.273" y2="112.436" />
          <line x1="89.547" y1="111.818" x2="107.205" y2="104.939" />
          <line x1="61.282" y1="88.301" x2="81.928" y2="109.867" />
          <line x1="242.841" y1="94.959" x2="238.443" y2="105.023" />
        </g>
        <line x1="243.062" y1="94.096" x2="254.666" y2="59.17" stroke="#656579" strokeWidth="1.5" />

        {/* ── Repères de mesure dynamiques calés sur le tempo ────────── */}
        <g opacity="0.45">
          {visibleMeasures.map((m, idx) => (
            <g key={idx}>
              <line
                x1={m.x}
                y1={m.isBar ? "118" : "120.5"}
                x2={m.x}
                y2={m.isBar ? "125.5" : "123.5"}
                stroke={m.isBar ? "#00ED95" : "#656579"}
                strokeWidth={m.isBar ? "1.2" : "0.8"}
              />
              {m.isBar && m.barNumber % 2 === 1 && (
                <text
                  x={m.x}
                  y="116"
                  textAnchor="middle"
                  fill="#00ED95"
                  fontSize="4"
                  fontFamily="monospace"
                  opacity="0.8"
                >
                  {m.barNumber}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* ── Ligne de boucle (verte) & Région active ───────────────────── */}
        <line x1="0" y1="122.969" x2="320" y2="122.969" stroke="#2a353d" strokeWidth="2" strokeLinecap="square" />
        {looping && (
          <>
            <rect
              x={Math.min(secToX(loopIn), secToX(loopOut))}
              y="121.5"
              width={Math.max(1, Math.abs(secToX(loopOut) - secToX(loopIn)))}
              height="3"
              fill="#00ED95"
              opacity="0.35"
            />
            <line x1={secToX(loopIn)} y1="122.969" x2={secToX(loopOut)} y2="122.969" stroke="#00ED95" strokeWidth="2.5" />
          </>
        )}
        <circle cx={secToX(loopIn)} cy="122.969" r="2.5" fill="#00ED95" stroke="#fff" strokeWidth="0.5" />
        <circle cx={secToX(loopOut)} cy="122.969" r="2.5" fill="#00ED95" stroke="#fff" strokeWidth="0.5" />

        {/* ── Graduations de la bande ───────────────────────────────────── */}
        {([17.062, 72.425, 127.788, 183.15, 238.514, 293.877] as const).map((x) => (
          <line key={x} x1={x} y1="126.238" x2={x} y2="120.338" stroke="#585566" strokeWidth="1.5" />
        ))}

        {/* ── Pistes — fond puis clips ──────────────────────────────────── */}
        {([0, 1, 2, 3] as const).map((ti) => {
          const y = TRACK_Y[ti];
          const color = TRACK_COLORS[ti];
          const clip = clips[ti];
          const isSelected = ti === selectedTrack;

          return (
            <g key={ti}>
              {/* Fond de piste */}
              <line
                x1={TAPE_X0} y1={y}
                x2={TAPE_X1} y2={y}
                stroke={isSelected ? "#3B2D49" : "#231728"}
                strokeWidth="3.5"
              />
              {/* Clip */}
              {clip && clip.clipEnd > 0 && (
                <line
                  x1={secToX(clip.offset)}
                  y1={y}
                  x2={Math.min(TAPE_X1, secToX(clip.offset + clip.clipEnd))}
                  y2={y}
                  stroke={color}
                  strokeWidth="3.5"
                  opacity={isSelected ? 1 : 0.65}
                />
              )}
              {/* Indicateur de piste sélectionnée (rectangle gauche) */}
              {isSelected && (
                <rect x="0" y={y - 2.5} width="4" height="5" fill={color} />
              )}
            </g>
          );
        })}

        {/* ── Playhead ─────────────────────────────────────────────────── */}
        <line
          x1={playX} y1="116.635"
          x2={playX} y2="146"
          stroke="#AEB1DC"
          strokeWidth="1.5"
        />

        {/* ── Indicateur niveau / volume (rouge à droite) ───────────────── */}
        <line x1="305.268" y1="4.451" x2="305.268" y2="110.292" stroke={playing ? "#FF3A5D" : "#4E2832"} strokeWidth="1.5" />
        <circle cx="305.268" cy="110.292" r="2.667" fill={playing ? "#FF3A5D" : "#4E2832"} />

        {/* ── Transport central — play/pause (décoratif) ────────────────── */}
        {playing ? (
          <g opacity="0.55" fill="#fff">
            <rect x="152" y="47" width="4.5" height="15" rx="1" />
            <rect x="163" y="47" width="4.5" height="15" rx="1" />
          </g>
        ) : (
          <path
            d="M154.141,47.047c0-1.052,0.747-1.482,1.657-0.955l12.843,7.411c0.909,0.522,0.909,1.385,0,1.908l-12.843,7.416c-0.91,0.523-1.657,0.094-1.657-0.954V47.047z"
            fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="square" opacity="0.4"
          />
        )}

        {/* ── Numéro de piste (cadre en haut à gauche) ─────────────────── */}
        <rect x="6" y="3" width="28.082" height="28.081" fill="none" stroke="#fff" strokeWidth="1.5" />
        <TrackNumber index={selectedTrack} />

        {/* ── Symboles séquenceur / synth (bas gauche, décoratifs) ──────── */}
        <g fill="#698EFF">
          <circle cx="10.938" cy="89.697" r="2.001" />
          <circle cx="16.963" cy="83.422" r="2.001" />
          <circle cx="22.987" cy="89.697" r="2.001" />
          <circle cx="29.012" cy="89.697" r="2.001" />
        </g>
        {/* Drum dot */}
        <circle cx="19.894" cy="103.623" r="6.736" fill="none" stroke="#00ED95" strokeWidth="1.5" />
        <circle cx="19.894" cy="104.891" r="1.334" fill="#00ED95" />
        <line x1="19.894" y1="113.494" x2="19.894" y2="104.957" stroke="#00ED95" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
