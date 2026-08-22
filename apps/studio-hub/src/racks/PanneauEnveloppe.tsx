import { BORNES, type ParamsEnveloppe } from "../core/audio/enveloppe";

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
  onParam: (nom: keyof ParamsEnveloppe, valeur: number) => void;
};

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
    </div>
  );
}
