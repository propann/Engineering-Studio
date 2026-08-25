import { ORDRE_DIVISIONS, type Division } from "../core/audio/tempo";
import {
  LFO_HZ_MAX, NOMS_CIBLES, NOMS_FORMES, ORDRE_CIBLES, ORDRE_FORMES,
  vitesseLfoHz, type ParamsLfo,
} from "../core/audio/lfo";

/**
 * Panneau LFO — les commandes du module 7.
 *
 * Contrôlé, comme `RackEffets` et `PanneauEnveloppe` : il reçoit ses valeurs et
 * rend ses changements. Les patches écrivent le LFO, donc le rack doit pouvoir
 * le pousser vers le bas.
 *
 * Le panneau affiche la vitesse **résolue**, pas le réglage brut. Calé sur le
 * tempo, le curseur de vitesse ne veut plus rien dire : montrer « 1/4 » sans le
 * Hz correspondant laisserait deviner à quelle allure ça module.
 */
export type ProprietesPanneauLfo = {
  params: ParamsLfo;
  onParam: <N extends keyof ParamsLfo>(nom: N, valeur: ParamsLfo[N]) => void;
  /** Tempo de l'hôte, pour afficher la vitesse réelle quand la synchro est active. */
  bpmHote: number;
};

export function PanneauLfo({ params, onParam, bpmHote }: ProprietesPanneauLfo) {
  const actif = params.lfoCible !== "aucun";
  const hz = vitesseLfoHz(params, bpmHote);

  return (
    <div className="fx-groupe lfo-groupe">
      <span className="fx-groupe-nom">LFO</span>

      <label>CIBLE
        <select
          value={params.lfoCible}
          onChange={(e) => onParam("lfoCible", e.target.value as ParamsLfo["lfoCible"])}
        >
          {ORDRE_CIBLES.map((c) => (
            <option key={c} value={c}>{NOMS_CIBLES[c]}</option>
          ))}
        </select>
      </label>

      <label>FORME
        <select
          value={params.lfoForme}
          disabled={!actif}
          onChange={(e) => onParam("lfoForme", e.target.value as ParamsLfo["lfoForme"])}
        >
          {ORDRE_FORMES.map((f) => (
            <option key={f} value={f}>{NOMS_FORMES[f]}</option>
          ))}
        </select>
      </label>

      {/* Le LFO est construit avec chaque voix : la phase decide de l'endroit
          du cycle ou une note DEMARRE. A 0 un tremolo part du milieu et monte ;
          a 270 il part du creux, et l'attaque se fait en fondu. Pas de 360 :
          ce serait 0 sous un autre nom, et le curseur aurait deux extremites
          identiques. */}
      <label>PHASE {params.lfoPhase}°
        <input
          type="range" min={0} max={359} step={1} value={params.lfoPhase} disabled={!actif}
          onChange={(e) => onParam("lfoPhase", Number(e.target.value))}
        />
      </label>

      <label>PROFONDEUR {params.lfoDepth}%
        <input
          type="range" min={0} max={100} value={params.lfoDepth} disabled={!actif}
          onChange={(e) => onParam("lfoDepth", Number(e.target.value))}
        />
      </label>

      <label>VITESSE {hz.toFixed(2)} Hz
        <input
          type="range" min={1} max={LFO_HZ_MAX * 10} value={params.lfoRate}
          disabled={!actif || params.lfoSync}
          onChange={(e) => onParam("lfoRate", Number(e.target.value))}
        />
      </label>

      <div className="fx-sync">
        <button
          type="button"
          className={`fx-sync-btn ${params.lfoSync ? "actif" : ""}`}
          disabled={!actif}
          onClick={() => onParam("lfoSync", !params.lfoSync)}
          title={`Cale le LFO sur le tempo du studio (${bpmHote} BPM)`}
        >
          SYNC {params.lfoSync ? `· ${bpmHote} BPM` : ""}
        </button>
        <select
          className="fx-sync-div"
          value={params.lfoDivision}
          disabled={!actif || !params.lfoSync}
          onChange={(e) => onParam("lfoDivision", e.target.value as Division)}
          title="Un cycle par division"
        >
          {ORDRE_DIVISIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
