import { ORDRE_DIVISIONS, type Division } from "./divisions";
import { NOMS_NOTES, type Gamme } from "./gammes";
import { NOMS_DIRECTIONS, ORDRE_DIRECTIONS, type Direction, type Pas } from "./sequenceur";
import { SelecteurGamme } from "./SelecteurGamme";

/**
 * Séquenceur pas à pas — son interface.
 *
 * Dans le paquet et non dans le hub, pour la même raison que l'arpégiateur et
 * le sélecteur de gamme : un studio doit pouvoir le poser. Le moteur reste
 * côté hôte, qui possède le tempo et sait à qui envoyer.
 *
 * **Contrôlé, pas autonome.** Aucun état interne : la séquence vit chez l'hôte,
 * là où la minuterie la lit. Deux copies divergeraient au premier pas joué.
 */
export type ProprietesSequenceur = {
  sequence: Pas[];
  onSequence: (sequence: Pas[]) => void;
  /** Pas en cours de lecture, pour le suivre à l'œil. `null` à l'arrêt. */
  pasCourant: number | null;
  enMarche: boolean;
  onMarche: () => void;
  /** Une destination existe. Sans elle, démarrer n'aurait aucun effet audible. */
  pret: boolean;
  longueur: number;
  onLongueur: (longueur: number) => void;
  direction: Direction;
  onDirection: (direction: Direction) => void;
  division: Division;
  onDivision: (division: Division) => void;
  gamme: Gamme;
  onGamme: (gamme: Gamme) => void;
  tonique: number;
  onTonique: (note: number) => void;
  /** Écrit une note dans un pas ; `null` efface. */
  onEcrire: (index: number, note: number | null) => void;
  onBasculer: (index: number) => void;
  onRemplir: () => void;
  onEffacer: () => void;
  prefixe?: string;
};

/** Deux octaves depuis la tonique : de quoi écrire une phrase sans faire défiler. */
const AMBITUS = 24;

export function Sequenceur({
  sequence, pasCourant, enMarche, onMarche, pret,
  longueur, onLongueur, direction, onDirection, division, onDivision,
  gamme, onGamme, tonique, onTonique,
  onEcrire, onBasculer, onRemplir, onEffacer,
  prefixe = "sequenceur",
}: ProprietesSequenceur) {
  const nomDe = (note: number | null) =>
    note === null ? "—" : `${NOMS_NOTES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;

  return (
    <div className={prefixe}>
      <div className={`${prefixe}__tete`}>
        <strong>Séquenceur</strong>
        <button
          type="button"
          className={`${prefixe}__marche ${enMarche ? "actif" : ""}`}
          disabled={!pret && !enMarche}
          onClick={onMarche}
        >
          {enMarche ? "■ Arrêter" : "▶ Démarrer"}
        </button>
      </div>

      <span className={`${prefixe}__aide`}>
        Écris une phrase, elle tourne toute seule et part vers <strong>tout ce qui
        écoute</strong>. L’arpégiateur, lui, déroule ce que tu tiens.
      </span>

      <div className={`${prefixe}__reglages`}>
        <label>Pas
          <select value={longueur} onChange={(e) => onLongueur(Number(e.target.value))}>
            {[4, 8, 12, 16, 24, 32].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Sens
          <select value={direction} onChange={(e) => onDirection(e.target.value as Direction)}>
            {ORDRE_DIRECTIONS.map((d) => <option key={d} value={d}>{NOMS_DIRECTIONS[d]}</option>)}
          </select>
        </label>
        <label>Vitesse
          <select value={division} onChange={(e) => onDivision(e.target.value as Division)}>
            {ORDRE_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <SelecteurGamme
          gamme={gamme}
          onGamme={onGamme}
          tonique={tonique}
          onTonique={onTonique}
          prefixe={`${prefixe}-gamme`}
        />
      </div>

      {/* Une colonne par pas : la note au-dessus, le pas en dessous. */}
      <div className={`${prefixe}__grille`}>
        {sequence.map((pas, index) => (
          <div
            key={index}
            className={[
              `${prefixe}__pas`,
              index === pasCourant ? "joue" : "",
              pas.actif ? "" : "eteint",
              pas.note === null ? "vide" : "",
            ].join(" ").trim()}
          >
            <select
              className={`${prefixe}__note`}
              value={pas.note === null ? "" : String(pas.note)}
              onChange={(e) => onEcrire(index, e.target.value === "" ? null : Number(e.target.value))}
              aria-label={`Note du pas ${index + 1}`}
            >
              <option value="">—</option>
              {Array.from({ length: AMBITUS }, (_, d) => tonique + d).map((n) => (
                <option key={n} value={n}>{nomDe(n)}</option>
              ))}
            </select>
            <button
              type="button"
              className={`${prefixe}__bascule`}
              onClick={() => onBasculer(index)}
              title={pas.actif ? "Éteindre ce pas (la note est gardée)" : "Rallumer ce pas"}
              aria-label={`Pas ${index + 1} ${pas.actif ? "allumé" : "éteint"}`}
            >
              {index + 1}
            </button>
          </div>
        ))}
      </div>

      <div className={`${prefixe}__pied`}>
        <button type="button" className={`${prefixe}__action`} onClick={onRemplir}>
          ⚄ Remplir au hasard
        </button>
        <button type="button" className={`${prefixe}__action`} onClick={onEffacer}>
          ✕ Tout effacer
        </button>
      </div>
    </div>
  );
}
