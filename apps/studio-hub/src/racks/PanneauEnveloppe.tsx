import {
  BORNES,
  ENVELOPPES,
  PLANCHER,
  type PhaseEnveloppe,
  courbeEnveloppe,
  dureeCourbe,
  estEnveloppeAppliquee,
  type ParamsEnveloppe,
} from "../core/audio/enveloppe";

/**
 * Panneau ENVELOPPE — les commandes ADSR du rack de moteurs.
 *
 * Un panneau du rack de moteurs, pas un quatrième rack : l'enveloppe façonne
 * la voix, elle est du métier des moteurs. Il vit dans un fichier à part pour
 * la même raison que `RackEffets` — le rack de moteurs fait déjà 3900 lignes.
 *
 * Contrôlé, comme les autres : les patches écrivent l'enveloppe, donc le rack
 * doit pouvoir la pousser vers le bas.
 */
export type ProprietesPanneauEnveloppe = {
  params: ParamsEnveloppe;
  /**
   * Un seul rappel, dont le type de la valeur est DERIVE du nom : sans cela,
   * la forme des rampes — la seule valeur non chiffree — aurait demande un
   * second rappel rien que pour elle.
   */
  onParam: <N extends keyof ParamsEnveloppe>(nom: N, valeur: ParamsEnveloppe[N]) => void;
};

/** Repère du tracé, en unités SVG. Mis à l'échelle par la feuille de style. */
const TRACE_L = 320;
const TRACE_H = 64;
/** Marge haute : sans elle, le sommet de l'attaque se confond avec le cadre. */
const MARGE = 3;

/**
 * Le tracé de l'enveloppe.
 *
 * Quatre curseurs en millisecondes ne disent pas la forme qu'ils dessinent —
 * ni où l'attaque s'arrête, ni combien la queue dure par rapport au reste.
 *
 * **L'axe des temps est linéaire**, et c'est un choix. L'oreille entend les
 * hauteurs en octaves — d'où l'axe logarithmique de la courbe d'égaliseur —
 * mais elle entend les durées telles quelles. Un axe comprimé montrerait une
 * attaque de 8 ms aussi large qu'un relâchement de 4 s : plus lisible, et faux.
 * Une attaque très courte doit se voir comme ce qu'elle est, un mur.
 *
 * Les valeurs viennent de `courbeEnveloppe`, la même fonction que les tests
 * vérifient, et qui reproduit les rampes exponentielles du moteur.
 */
function CourbeEnveloppe({ params }: { params: ParamsEnveloppe }) {
  const total = dureeCourbe(params);
  const points = courbeEnveloppe(params);

  const x = (t: number) => (t / total) * TRACE_L;
  const y = (v: number) => TRACE_H - MARGE - v * (TRACE_H - 2 * MARGE);

  const trace = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(" ");
  const bas = y(PLANCHER).toFixed(1);
  const aire = `${trace} L${TRACE_L} ${bas} L0 ${bas} Z`;

  // Le sommet de l'attaque, lu SUR la courbe — son point le plus haut — et non
  // recalculé depuis les réglages. Deux calculs donneraient deux vérités, et le
  // repère se décalerait du tracé qu'il annote.
  const sommet = points.reduce((a, b) => (b.v > a.v ? b : a));

  return (
    <svg
      className="env-courbe"
      viewBox={`0 0 ${TRACE_L} ${TRACE_H}`}
      role="img"
      // Un tracé est muet pour qui ne le voit pas ; les quatre réglages, eux,
      // se lisent — c'est l'information qu'il porte.
      aria-label={
        `Enveloppe : attaque ${params.envAttack} ms, déclin ${params.envDecay} ms, ` +
        `maintien ${params.envSustain} %, relâchement ${params.envRelease} ms`
      }
    >
      {/* Le plein et le vide : niveau 1 en haut, plancher en bas. */}
      <line x1={0} y1={y(1)} x2={TRACE_L} y2={y(1)} className="env-courbe-grille" />
      <line x1={0} y1={bas} x2={TRACE_L} y2={bas} className="env-courbe-zero" />
      {/* Le niveau de maintien : c'est lui que le palier sert à montrer. */}
      <line
        x1={0}
        y1={y(params.envSustain / 100)}
        x2={TRACE_L}
        y2={y(params.envSustain / 100)}
        className="env-courbe-maintien"
      />
      {/* Le sommet de l'attaque, seule frontière de phase qui se repère mal
          quand l'attaque est très courte. */}
      <line x1={x(sommet.t)} y1={0} x2={x(sommet.t)} y2={TRACE_H} className="env-courbe-phase" />

      <path d={aire} className="env-courbe-aire" />
      <path d={trace} className="env-courbe-trait" />
    </svg>
  );
}

export function PanneauEnveloppe({ params, onParam }: ProprietesPanneauEnveloppe) {
  return (
    <div className="fx-groupe env-groupe">
      <span className="fx-groupe-nom">ENVELOPPE</span>
      <label>ATTAQUE {params.envAttack} ms
        <input
          type="range" min={0} max={BORNES.attaqueMaxMs} step={1}
          value={params.envAttack}
          onChange={(e) => onParam("envAttack", Number(e.target.value))}
        />
      </label>
      <label>DÉCLIN {params.envDecay} ms
        <input
          type="range" min={0} max={BORNES.declinMaxMs} step={1}
          value={params.envDecay}
          onChange={(e) => onParam("envDecay", Number(e.target.value))}
        />
      </label>
      <label>MAINTIEN {params.envSustain}%
        <input
          type="range" min={0} max={100} step={1}
          value={params.envSustain}
          onChange={(e) => onParam("envSustain", Number(e.target.value))}
        />
      </label>
      <label>RELÂCHEMENT {params.envRelease} ms
        <input
          type="range" min={0} max={BORNES.relachementMaxMs} step={10}
          value={params.envRelease}
          onChange={(e) => onParam("envRelease", Number(e.target.value))}
        />
      </label>
      {/* La forme des rampes. Deux boutons plutot qu'un interrupteur : « EXP »
          et « DROIT » se lisent tous les deux, la ou une case a cocher
          « lineaire » laisserait deviner ce que vaut l'etat decoche. */}
      <div className="fx-modes env-formes">
        {(["exp", "lin"] as const).map((forme) => (
          <button
            key={forme}
            type="button"
            className={`fx-mode-btn ${params.envCourbe === forme ? "actif" : ""}`}
            onClick={() => onParam("envCourbe", forme)}
            title={forme === "exp"
              ? "Rampes exponentielles : la facon dont l'oreille percoit le volume, un declin s'y entend regulier"
              : "Rampes droites : monte vite puis semble ralentir, le grain des vieilles machines numeriques"}
          >
            {forme === "exp" ? "COURBE EXP" : "COURBE DROITE"}
          </button>
        ))}
      </div>

      <CourbeEnveloppe params={params} />
      {/* Les enveloppes prédéfinies. Chacune pousse ses quatre réglages par le
          rappel habituel : quatre appels d'affilée, chaque phase ayant son
          propre setter, donc aucune ne s'écrase. Un second rappel « applique
          cette enveloppe » aurait doublé la frontière pour rien.

          Le bouton s'allume quand les quatre réglages sont exactement les
          siens — et s'éteint dès qu'on retouche un curseur, sans quoi il
          annoncerait une enveloppe qui n'est plus. */}
      <div className="fx-modes env-predefinies">
        {ENVELOPPES.map((enveloppe) => (
          <button
            key={enveloppe.nom}
            type="button"
            className={`fx-mode-btn ${estEnveloppeAppliquee(params, enveloppe) ? "actif" : ""}`}
            onClick={() => {
              for (const nom of Object.keys(enveloppe.reglages) as PhaseEnveloppe[]) {
                onParam(nom, enveloppe.reglages[nom]);
              }
            }}
            title={enveloppe.aide}
          >
            {enveloppe.nom}
          </button>
        ))}
      </div>
    </div>
  );
}
