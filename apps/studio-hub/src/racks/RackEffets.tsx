import { ORDRE_DIVISIONS, type Division } from "../core/audio/tempo";
import {
  BANDES_EQ,
  COURBES_EQ,
  EQ_DB_MAX,
  estCourbeAppliquee,
  type ParamsEffets,
} from "../core/audio/effets";
import { courbeEq } from "../core/audio/reponseEq";
import { ORDRE_SATURATION, type ModeSaturation } from "@studio-hub/core/audio/dsp";

/**
 * Ce que chaque mode fait, en une phrase.
 *
 * Les trois partagent le meme graphe : sans explication, le choix entre eux
 * releve du tatonnement.
 */
/**
 * Ce que chaque ecretage fait au son.
 *
 * Des `Record` complets : un quatrieme mode ajoute a `ModeSaturation` casse le
 * typecheck ici tant qu'il n'a ni nom ni explication. Les deux ternaires
 * qu'ils remplacent tenaient tant qu'il n'y avait que deux modes — et le
 * troisieme se serait affiche sous le nom du deuxieme.
 */
const SATURATION_NOM: Record<ModeSaturation, string> = {
  soft: "DOUX",
  hard: "DUR",
  fold: "REPLI",
};
const SATURATION_AIDE: Record<ModeSaturation, string> = {
  soft: "Ecretage progressif, facon lampe : la crete s'arrondit",
  hard: "Ecretage franc : le signal s'arrete net au seuil, harmoniques dures",
  fold: "Repliement : le signal se replie au lieu d'ecreter",
};

const MODULATION_NOM = { chorus: "CHORUS", flanger: "FLANGER", phaser: "PHASER" } as const;
const MODULATION_AIDE = {
  chorus: "Delai long module : on entend deux sources, l'ensemble s'epaissit",
  flanger: "Delai tres court reinjecte : filtre en peigne, effet de souffle metallique",
  phaser: "Filtres passe-tout balayes : creux mouvants dans le spectre",
} as const;

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
  /**
   * Un seul rappel. Le type de la valeur est DERIVE du type des reglages :
   * enumerer « number | "soft" | "fold" » a la main obligeait a y penser a
   * chaque effet ajoute, et le mode de modulation l'a montre.
   */
  onParam: <N extends keyof ParamsEffets>(nom: N, valeur: ParamsEffets[N]) => void;
  /** Synchronisation du délai sur le tempo de l'hôte. */
  delaySync: boolean;
  onDelaySync: (actif: boolean) => void;
  delayDivision: Division;
  onDelayDivision: (division: Division) => void;
  bpmHote: number;
};

/**
 * Le tracé de la réponse de l'égaliseur.
 *
 * Trois curseurs en dB ne disent pas ce qu'ils font au son : ils donnent trois
 * nombres, et l'oreille doit deviner la forme qui en sort — surtout aux
 * recouvrements, là où deux bandes s'additionnent sans le montrer.
 *
 * Le tracé se calcule sur `BANDES_EQ`, la table même que lit le graphe audio.
 * C'est la condition pour qu'il montre ce qu'on entend : deux listes
 * divergeraient au premier réglage changé, chacune restant cohérente de son
 * côté, et rien ne le signalerait.
 *
 * Repère en unités SVG, mis à l'échelle par la feuille de style.
 */
const COURBE_L = 320;
const COURBE_H = 64;
const COURBE_MIN_HZ = 20;
const COURBE_MAX_HZ = 20000;

/**
 * Débattement vertical du repère, en dB.
 *
 * Trois dB de plus que le débattement d'une bande. Les bandes sont assez
 * écartées — 220, 1200, 5200 Hz — pour ne se recouvrir qu'à peine : poussées
 * toutes les trois à +18, elles culminent à +18,1 dB, pas à +54. Un repère
 * calé sur la somme théorique écraserait le tracé au milieu du cadre pour une
 * réserve que rien n'atteint.
 */
const COURBE_DB_VUE = EQ_DB_MAX + 3;

/** Les graduations de l'axe des fréquences. */
const REPERES_HZ = [
  { hz: 100, nom: "100" },
  { hz: 1000, nom: "1k" },
  { hz: 10000, nom: "10k" },
];

/** L'axe des fréquences est logarithmique : l'oreille entend des octaves. */
function abscisse(hz: number): number {
  return (Math.log(hz / COURBE_MIN_HZ) / Math.log(COURBE_MAX_HZ / COURBE_MIN_HZ)) * COURBE_L;
}

/**
 * Un gain en dB vers sa hauteur dans le cadre, 0 dB au milieu.
 *
 * Le rabattage ne sert qu'à garantir un tracé dans le cadre : aucun réglage
 * accessible n'y arrive, mais un point hors cadre déformerait le remplissage
 * sans rien signaler.
 */
function ordonnee(db: number): number {
  const borne = Math.max(-COURBE_DB_VUE, Math.min(COURBE_DB_VUE, db));
  return COURBE_H / 2 - (borne / COURBE_DB_VUE) * (COURBE_H / 2);
}

/**
 * La courbe de réponse, dessinée.
 *
 * Pas d'état, pas de mémoïsation : 160 points × 3 bandes se recalculent en
 * quelques dizaines de microsecondes, et le rack se rend déjà à chaque
 * mouvement de curseur. Un cache ici n'économiserait rien et ajouterait une
 * dépendance à tenir juste.
 *
 * La courbe se calcule à 44,1 kHz alors que le contexte audio tourne peut-être
 * à 48 : l'écart ne se voit qu'aux dernières centaines de hertz sous Nyquist,
 * et le composant, contrôlé, n'a pas de contexte audio à interroger.
 */
function CourbeEq({ params }: { params: ParamsEffets }) {
  const points = courbeEq(params, 160, COURBE_MIN_HZ, COURBE_MAX_HZ);
  const trace = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${abscisse(p.frequence).toFixed(1)} ${ordonnee(p.db).toFixed(1)}`)
    .join(" ");
  const zero = ordonnee(0).toFixed(1);
  // Le remplissage est le tracé refermé sur la ligne des 0 dB : il montre d'un
  // coup d'œil de quel côté du neutre chaque région se trouve.
  const remplissage = `${trace} L${COURBE_L} ${zero} L0 ${zero} Z`;

  return (
    <svg
      className="fx-courbe"
      viewBox={`0 0 ${COURBE_L} ${COURBE_H}`}
      role="img"
      // Un tracé est muet pour qui ne le voit pas. Les trois réglages, eux, se
      // lisent — c'est l'information que la courbe porte.
      aria-label={`Réponse de l'égaliseur : ${BANDES_EQ.map(
        (b) => `${b.nom.toLowerCase()} ${params[b.reglage] > 0 ? "+" : ""}${params[b.reglage]} dB`,
      ).join(", ")}`}
    >
      {/* Graduations horizontales : le neutre, puis la moitié du débattement. */}
      <line x1={0} y1={zero} x2={COURBE_L} y2={zero} className="fx-courbe-zero" />
      {[EQ_DB_MAX / 2, -EQ_DB_MAX / 2].map((db) => (
        <line key={db} x1={0} y1={ordonnee(db)} x2={COURBE_L} y2={ordonnee(db)} className="fx-courbe-grille" />
      ))}

      {/* Là où chaque bande agit : sans ces repères, un creux reste anonyme. */}
      {BANDES_EQ.map((b) => (
        <line
          key={b.nom}
          x1={abscisse(b.frequence)}
          y1={0}
          x2={abscisse(b.frequence)}
          y2={COURBE_H}
          className="fx-courbe-bande"
        />
      ))}

      <path d={remplissage} className="fx-courbe-aire" />
      <path d={trace} className="fx-courbe-trait" />

      {REPERES_HZ.map((r) => (
        <text key={r.hz} x={abscisse(r.hz) + 3} y={COURBE_H - 3} className="fx-courbe-hz">
          {r.nom}
        </text>
      ))}
    </svg>
  );
}

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
          {ORDRE_SATURATION.map((m) => (
            <button
              key={m}
              type="button"
              className={`fx-mode-btn ${params.fxDriveMode === m ? "actif" : ""}`}
              disabled={params.fxDriveMix === 0}
              onClick={() => onParam("fxDriveMode", m)}
              title={SATURATION_AIDE[m]}
            >
              {SATURATION_NOM[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">MODULATION</span>
        <div className="fx-modes">
          {(["chorus", "flanger", "phaser"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`fx-mode-btn ${params.fxModMode === m ? "actif" : ""}`}
              disabled={params.fxModMix === 0}
              onClick={() => onParam("fxModMode", m)}
              title={MODULATION_AIDE[m]}
            >
              {MODULATION_NOM[m]}
            </button>
          ))}
        </div>
        <label>MIX {params.fxModMix}%
          <input type="range" min={0} max={100} value={params.fxModMix}
            onChange={(e) => onParam("fxModMix", Number(e.target.value))} />
        </label>
        <label>VITESSE {(params.fxModRate / 10).toFixed(1)} Hz
          <input type="range" min={1} max={80} value={params.fxModRate} disabled={params.fxModMix === 0}
            onChange={(e) => onParam("fxModRate", Number(e.target.value))} />
        </label>
        {params.fxModMode !== "phaser" && (
          <label>PROFONDEUR {params.fxModDepth} ms
            <input type="range" min={0} max={10} value={params.fxModDepth} disabled={params.fxModMix === 0}
              onChange={(e) => onParam("fxModDepth", Number(e.target.value))} />
          </label>
        )}
        {params.fxModMode === "flanger" && (
          <label>RETOUR {params.fxModFeedback}%
            <input type="range" min={0} max={100} value={params.fxModFeedback} disabled={params.fxModMix === 0}
              onChange={(e) => onParam("fxModFeedback", Number(e.target.value))} />
          </label>
        )}
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
        <label>PRISES {params.fxDelayTaps}
          <input type="range" min={1} max={4} step={1} value={params.fxDelayTaps}
            onChange={(e) => onParam("fxDelayTaps", Number(e.target.value))} />
        </label>
        {params.fxDelayTaps > 1 && (
          <label>ÉCART {params.fxDelaySpread}%
            <input type="range" min={0} max={100} step={5} value={params.fxDelaySpread}
              onChange={(e) => onParam("fxDelaySpread", Number(e.target.value))} />
          </label>
        )}
      </div>
      <div className="fx-groupe">
        <span className="fx-groupe-nom">ÉGALISEUR</span>
        {/* Un curseur par bande, tirés de `BANDES_EQ` : le nom affiché, la
            fréquence tracée et le filtre construit viennent de la même ligne.
            Recopiés ici, ils auraient fini par désigner des bandes différentes
            — « GRAVES » sur le curseur d'une bande déplacée ailleurs. */}
        {BANDES_EQ.map((bande) => (
          <label key={bande.nom}>
            {bande.nom} {params[bande.reglage] > 0 ? "+" : ""}{params[bande.reglage]} dB
            <input
              type="range"
              min={-EQ_DB_MAX}
              max={EQ_DB_MAX}
              value={params[bande.reglage]}
              title={`${bande.frequence} Hz`}
              onChange={(e) => onParam(bande.reglage, Number(e.target.value))}
            />
          </label>
        ))}
        <CourbeEq params={params} />
        {/* Les courbes prédéfinies. Chacune pousse ses trois gains par le
            rappel habituel : trois appels d'affilée, chaque gain ayant son
            propre setter, donc aucun ne s'écrase. Un second rappel « applique
            cette courbe » aurait doublé la frontière pour rien.

            Le bouton s'allume quand les trois gains sont exactement les siens
            — y compris apres un retour au curseur, qui l'eteint. Sans cela il
            resterait allume sur une courbe qu'on vient de quitter. */}
        <div className="fx-modes fx-courbes-eq">
          {COURBES_EQ.map((courbe) => (
            <button
              key={courbe.nom}
              type="button"
              className={`fx-mode-btn ${estCourbeAppliquee(params, courbe) ? "actif" : ""}`}
              onClick={() => {
                for (const bande of BANDES_EQ) onParam(bande.reglage, courbe.gains[bande.reglage]);
              }}
              title={courbe.aide}
            >
              {courbe.nom}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
