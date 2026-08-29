"use client";
import { useMemo } from "react";
import { nomDe, reglagesDe, type Reglage } from "../core/audio/catalogueParams";
import "./carte-moteur.css";

/**
 * La carte de réglages d'un moteur.
 *
 * ## Ce qu'elle est
 *
 * Un bloc autonome qui affiche TOUS les paramètres d'un moteur, et rien
 * d'autre. Elle ne connaît ni le rack, ni la console, ni le contexte audio :
 * elle reçoit des valeurs et rend un rappel. C'est ce qui la rend incrustable
 * partout — dans le rack DSP, dans le rack Strudel, dans une fenêtre de
 * superposition, dans un outil de création de son.
 *
 * ## Pourquoi elle est petite
 *
 * Les panneaux du rack faisaient toute la largeur de la page. Une carte qui
 * doit tenir à côté d'un éditeur de code, sous une onde, ou en pile avec
 * quatre autres ne peut pas se le permettre. Elle s'adapte donc à la place
 * qu'on lui donne : une colonne si c'est étroit, deux si c'est large, sans
 * qu'on ait à le lui dire.
 *
 * ## Contrôlée, jamais propriétaire
 *
 * Même forme que `RackEffets`, `PanneauEnveloppe` et `SelecteurGamme` :
 * valeurs en entrée, rappel en sortie. Une carte qui garderait son propre état
 * divergerait de ce que le moteur joue vraiment — deux vérités concurrentes,
 * dont une visible et fausse.
 */

export type ProprietesCarteMoteur = {
  /** L'identifiant du moteur, `"mi_plaits"` par exemple. */
  moteur: string;
  /** Les valeurs courantes, indexées par nom de paramètre. */
  valeurs: Record<string, unknown>;
  /** Appelé à chaque changement. Le type suit celui du réglage. */
  surReglage: (nom: string, valeur: number | string) => void;
  /**
   * Compacte : libellés raccourcis, une seule colonne.
   * Pour une pile de cartes dans une colonne étroite.
   */
  compacte?: boolean;
  /** Contenu ajouté en pied — un bouton, un état, une pastille. */
  pied?: React.ReactNode;
  /** Titre remplacé. Par défaut, le nom du moteur. */
  titre?: React.ReactNode;
};

export function CarteMoteur({
  moteur,
  valeurs,
  surReglage,
  compacte = false,
  pied,
  titre,
}: ProprietesCarteMoteur) {
  const reglages = useMemo(() => reglagesDe(moteur), [moteur]);

  if (reglages.length === 0) {
    return (
      <div className="cm-carte cm-carte--vide" data-moteur={moteur}>
        <h3 className="cm-titre">{titre ?? nomDe(moteur)}</h3>
        {/* Un moteur sans réglage déclaré n'est pas forcément un bug : c'est
            peut-être un identifiant inconnu. On le dit plutôt que d'afficher
            une carte vide, qu'on prendrait pour un défaut d'affichage. */}
        <p className="cm-vide">Aucun réglage déclaré pour « {moteur} ».</p>
        {pied && <div className="cm-pied">{pied}</div>}
      </div>
    );
  }

  return (
    <div
      className={`cm-carte${compacte ? " cm-carte--compacte" : ""}`}
      data-moteur={moteur}
    >
      <h3 className="cm-titre">{titre ?? nomDe(moteur)}</h3>
      <div className="cm-grille">
        {reglages.map((r) => (
          <ControleReglage
            key={r.nom}
            reglage={r}
            valeur={valeurs[r.nom]}
            sur={surReglage}
            compacte={compacte}
          />
        ))}
      </div>
      {pied && <div className="cm-pied">{pied}</div>}
    </div>
  );
}

/** Un réglage : curseur ou liste, selon ce que le catalogue déclare. */
function ControleReglage({
  reglage,
  valeur,
  sur,
  compacte,
}: {
  reglage: Reglage;
  valeur: unknown;
  sur: (nom: string, valeur: number | string) => void;
  compacte: boolean;
}) {
  if (reglage.type === "liste") {
    const courante = typeof valeur === "string" ? valeur : reglage.options[0]?.valeur ?? "";
    return (
      <label className="cm-reglage cm-reglage--liste">
        <span className="cm-libelle">{reglage.libelle}</span>
        <select
          value={courante}
          onChange={(e) => sur(reglage.nom, e.target.value)}
          aria-label={reglage.libelle}
        >
          {reglage.options.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {/* En mode compact, les libellés d'origine — « 1. VIRTUAL ANALOG
                  (Saw/Pair) » — débordent d'une colonne étroite. On garde le
                  texte complet dans le titre, pour qui survole. */}
              {compacte ? abreger(o.libelle) : o.libelle}
            </option>
          ))}
        </select>
      </label>
    );
  }

  /**
   * Une valeur absente prend le milieu de l'intervalle, pas zéro.
   *
   * Zéro est une valeur légitime pour beaucoup de réglages : l'afficher pour
   * dire « je ne sais pas » ferait croire à un paramètre à fond à gauche.
   */
  const nombre =
    typeof valeur === "number" && Number.isFinite(valeur)
      ? valeur
      : Math.round((reglage.min + reglage.max) / 2);

  return (
    <label className="cm-reglage">
      <span className="cm-libelle">
        {reglage.libelle}
        <b className="cm-valeur">
          {nombre}
          {reglage.unite ? ` ${reglage.unite}` : ""}
        </b>
      </span>
      <input
        type="range"
        min={reglage.min}
        max={reglage.max}
        value={nombre}
        onChange={(e) => sur(reglage.nom, Number(e.target.value))}
        aria-label={reglage.libelle}
      />
    </label>
  );
}

/**
 * Raccourcit un libellé d'option pour une colonne étroite.
 *
 * On coupe à la parenthèse ou au tiret : c'est là que ces libellés placent
 * leur précision — « WAVETABLE (Sweep 3D Grid) » garde « WAVETABLE ». Couper
 * à un nombre de caractères fixe tomberait au milieu d'un mot.
 */
export function abreger(libelle: string): string {
  const coupe = libelle.split(/\s*[(—–-]\s*/)[0].trim();
  const sansNumero = coupe.replace(/^\d+\.\s*/, "");
  return sansNumero || coupe || libelle;
}
