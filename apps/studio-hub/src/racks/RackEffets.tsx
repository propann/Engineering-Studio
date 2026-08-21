import { ORDRE_DIVISIONS, type Division } from "../core/audio/tempo";
import type { ParamsEffets } from "../core/audio/effets";

/**
 * Le rack d'effets — son interface.
 *
 * Chaque rack porte son interface dans son ventre. Celle-ci vivait au milieu du
 * rack de moteurs : la séparation des métiers n'existait qu'à moitié, la
 * logique d'un côté et 94 lignes de JSX de l'autre.
 *
 * **Contrôlé, pas autonome.** Il reçoit ses valeurs et rend ses changements.
 * Ce n'est pas un choix de commodité : les patches écrivent les réglages
 * d'effets, donc le rack de moteurs doit pouvoir les pousser vers le bas.
 * Un composant qui posséderait son propre état afficherait l'ancien réglage
 * après un changement de patch.
 *
 * Même forme que `SelecteurGamme` : valeurs en entrée, rappel en sortie.
 */
export type ProprietesRackEffets = {
  params: ParamsEffets;
  onParam: (nom: keyof ParamsEffets, valeur: number | "soft" | "fold") => void;
  /** Synchronisation du délai sur le tempo de l'hôte. */
  delaySync: boolean;
  onDelaySync: (actif: boolean) => void;
  delayDivision: Division;
  onDelayDivision: (division: Division) => void;
  bpmHote: number;
};

export function RackEffets({
  params,
  onParam,
  delaySync,
  onDelaySync,
  delayDivision,
  onDelayDivision,
  bpmHote,
}: ProprietesRackEffets) {
  return (
    <div className="fx-globaux">
      <div className="fx-titre">🎛️ EFFETS GLOBAUX</div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">SATURATION</span>
        <label>MIX {params.fxDriveMix}%
          <input type="range" min={0} max={100} value={params.fxDriveMix}
            onChange={(e) => onParam("fxDriveMix", Number(e.target.value))} />
        </label>
        <label>GAIN {params.fxDriveAmount}%
          <input type="range" min={0} max={100} value={params.fxDriveAmount} disabled={params.fxDriveMix === 0}
            onChange={(e) => onParam("fxDriveAmount", Number(e.target.value))} />
        </label>
        <div className="fx-modes">
          {(["soft", "fold"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`fx-mode-btn ${params.fxDriveMode === m ? "actif" : ""}`}
              disabled={params.fxDriveMix === 0}
              onClick={() => onParam("fxDriveMode", m)}
              title={m === "soft" ? "Écrêtage doux, façon lampe" : "Repliement : le signal se replie au lieu d'écrêter"}
            >
              {m === "soft" ? "DOUX" : "REPLI"}
            </button>
          ))}
        </div>
      </div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">CHORUS</span>
        <label>MIX {params.fxChorusMix}%
          <input type="range" min={0} max={100} value={params.fxChorusMix}
            onChange={(e) => onParam("fxChorusMix", Number(e.target.value))} />
        </label>
        <label>VITESSE {(params.fxChorusRate / 10).toFixed(1)} Hz
          <input type="range" min={1} max={80} value={params.fxChorusRate} disabled={params.fxChorusMix === 0}
            onChange={(e) => onParam("fxChorusRate", Number(e.target.value))} />
        </label>
        <label>PROFONDEUR {params.fxChorusDepth} ms
          <input type="range" min={0} max={10} value={params.fxChorusDepth} disabled={params.fxChorusMix === 0}
            onChange={(e) => onParam("fxChorusDepth", Number(e.target.value))} />
        </label>
      </div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">DELAY</span>
        <label>MIX {params.fxDelayMix}%
          <input type="range" min={0} max={100} value={params.fxDelayMix}
            onChange={(e) => onParam("fxDelayMix", Number(e.target.value))} />
        </label>
        <label>TEMPS {params.fxDelayTime} ms
          <input type="range" min={20} max={1200} step={10} value={params.fxDelayTime} disabled={delaySync}
            onChange={(e) => onParam("fxDelayTime", Number(e.target.value))} />
        </label>
        <div className="fx-sync">
          <button
            type="button"
            className={`fx-sync-btn ${delaySync ? "actif" : ""}`}
            onClick={() => onDelaySync(!delaySync)}
            title={`Cale le delay sur le tempo du studio (${bpmHote} BPM)`}
          >
            SYNC {delaySync ? `· ${bpmHote} BPM` : ""}
          </button>
          <select
            className="fx-sync-div"
            value={delayDivision}
            disabled={!delaySync}
            onChange={(e) => onDelayDivision(e.target.value as Division)}
            title="Division musicale"
          >
            {ORDRE_DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <label>RETOUR {params.fxDelayFeedback}%
          <input type="range" min={0} max={100} value={params.fxDelayFeedback}
            onChange={(e) => onParam("fxDelayFeedback", Number(e.target.value))} />
        </label>
      </div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">ÉGALISEUR</span>
        <label>GRAVES {params.fxEqLow > 0 ? "+" : ""}{params.fxEqLow} dB
          <input type="range" min={-18} max={18} value={params.fxEqLow}
            onChange={(e) => onParam("fxEqLow", Number(e.target.value))} />
        </label>
        <label>MÉDIUMS {params.fxEqMid > 0 ? "+" : ""}{params.fxEqMid} dB
          <input type="range" min={-18} max={18} value={params.fxEqMid}
            onChange={(e) => onParam("fxEqMid", Number(e.target.value))} />
        </label>
        <label>AIGUS {params.fxEqHigh > 0 ? "+" : ""}{params.fxEqHigh} dB
          <input type="range" min={-18} max={18} value={params.fxEqHigh}
            onChange={(e) => onParam("fxEqHigh", Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
