import { FAMILLES, NOMS_GAMMES, NOMS_NOTES, type Gamme } from "./gammes";

/**
 * Sélecteur de gamme, posable partout.
 *
 * Volontairement muet : aucun état interne, aucune feuille de style importée,
 * aucun accès au MIDI. Il reçoit ce qu'il affiche et rend ce qu'on choisit.
 * C'est ce qui lui permet d'être posé dans le hub comme dans les studios, dont
 * les feuilles de style n'ont rien en commun.
 *
 * Le rendu passe par un `<select>` natif et non par un menu maison : avec
 * trente gammes, la recherche au clavier du navigateur — taper « dor » pour
 * atteindre dorien — vaut mieux que tout ce qu'on écrirait à la main.
 *
 * Les familles deviennent des `<optgroup>`. Une liste plate de trente entrées
 * est inutilisable : on ne trouve pas « dorien » sans repère.
 */
export type ProprietesSelecteurGamme = {
  gamme: Gamme;
  onGamme: (gamme: Gamme) => void;
  /** Note MIDI de la tonique. Omise, le choix de tonique n'est pas rendu. */
  tonique?: number;
  onTonique?: (note: number) => void;
  /** Préfixe de classes, pour que chaque hôte applique son propre style. */
  prefixe?: string;
  /** Étiquettes. Omises pour un rendu compact. */
  etiquettes?: boolean;
  desactive?: boolean;
};

export function SelecteurGamme({
  gamme,
  onGamme,
  tonique,
  onTonique,
  prefixe = "selecteur-gamme",
  etiquettes = true,
  desactive = false,
}: ProprietesSelecteurGamme) {
  // `tonique` seule ne suffit pas : sans rappel, le choix serait figé et
  // l'utilisateur croirait à une panne.
  const avecTonique = tonique !== undefined && onTonique !== undefined;

  const choixGamme = (
    <select
      className={`${prefixe}__gamme`}
      value={gamme}
      disabled={desactive}
      onChange={(e) => onGamme(e.target.value as Gamme)}
      aria-label="Gamme"
    >
      {FAMILLES.map((famille) => (
        <optgroup key={famille.nom} label={famille.nom}>
          {famille.gammes.map((g) => (
            <option key={g} value={g}>{NOMS_GAMMES[g]}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const choixTonique = avecTonique ? (
    <select
      className={`${prefixe}__tonique`}
      value={tonique}
      disabled={desactive}
      onChange={(e) => onTonique(Number(e.target.value))}
      aria-label="Tonique"
    >
      {NOMS_NOTES.map((nom, demiTons) => (
        <option key={nom} value={60 + demiTons}>{nom}</option>
      ))}
    </select>
  ) : null;

  return (
    <div className={prefixe}>
      {etiquettes ? (
        <>
          <label className={`${prefixe}__champ`}>
            <span>Gamme</span>
            {choixGamme}
          </label>
          {choixTonique && (
            <label className={`${prefixe}__champ`}>
              <span>Tonique</span>
              {choixTonique}
            </label>
          )}
        </>
      ) : (
        <>
          {choixGamme}
          {choixTonique}
        </>
      )}
    </div>
  );
}
