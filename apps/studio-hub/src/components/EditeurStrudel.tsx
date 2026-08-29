"use client";
import { useEffect, useRef } from "react";

/**
 * L'éditeur officiel de Strudel, monté dans le Hub.
 *
 * ## Pourquoi celui-ci et pas un `<textarea>`
 *
 * Le rack avait un `<textarea>` de douze lignes. Il tenait, mais il lui
 * manquait la chose qui fait Strudel : **le surlignage des événements pendant
 * la lecture**. Quand un motif joue, chaque fragment de mini-notation
 * s'illumine à l'instant où il sonne. On voit le motif, on ne le devine plus.
 *
 * C'est ce que `highlightMiniLocations` fait, et il faut CodeMirror pour
 * l'afficher : les positions sont des intervalles dans le document, posés en
 * décorations. Aucun `<textarea>` ne peut le rendre.
 *
 * Le paquet apporte aussi ce qu'on aurait mal réécrit : coloration de la
 * mini-notation, autocomplétion des fonctions de motif, curseurs `.slider()`
 * manipulables à la souris, `Ctrl-Entrée` et `Ctrl-.` déjà câblés.
 *
 * ## Chargé à la demande
 *
 * CodeMirror et ses greffons pèsent lourd. L'import est dynamique, comme celui
 * de `@strudel/web` : le Hub ne doit pas transporter un éditeur de code pour
 * afficher sa page d'accueil.
 *
 * Conséquence assumée : il y a un instant sans éditeur au premier affichage.
 * On montre le code dans un bloc figé pendant ce temps plutôt qu'un vide — un
 * cadre gris ferait croire à une panne.
 *
 * ## React ne possède pas ce DOM
 *
 * CodeMirror gère son arbre lui-même. Le composant lui prête un conteneur vide
 * et n'y touche plus : re-rendre par-dessus effacerait l'état de l'éditeur —
 * curseur, historique d'annulation, décorations en cours.
 *
 * D'où le `useRef` sur la vue et le montage en un seul effet, sans dépendance
 * sur le code. Les changements venus de l'extérieur — ouvrir un projet,
 * charger un exemple — passent par `dispatch`, jamais par un nouveau montage.
 */

/** Ce qu'on expose au rack, une fois l'éditeur prêt. */
export type PoigneeEditeur = {
  /** Remplace tout le contenu, en préservant l'historique d'annulation. */
  remplacer: (code: string) => void;
  /** Le texte courant. */
  lire: () => string;
  /**
   * Surligne les événements actifs. Appelé à chaque image pendant la lecture.
   * `haps` vient de l'ordonnanceur de Strudel.
   */
  surligner: (temps: number, haps: unknown[]) => void;
  /** Enregistre les positions de mini-notation issues de la dernière évaluation. */
  poserPositions: (positions: unknown[]) => void;
  /** Fait clignoter l'éditeur — confirmation visuelle d'une évaluation. */
  clignoter: () => void;
  /** Rend le focus au code après un clic ailleurs. */
  focus: () => void;
};

export type ThemeEditeur =
  | "algoboy"
  | "teletext"
  | "greenText"
  | "gruvboxDark"
  | "strudelTheme";

export function EditeurStrudel({
  codeInitial,
  theme = "algoboy",
  tailleTexte = 15,
  surChangement,
  surEvaluer,
  surArret,
  surPret,
}: {
  codeInitial: string;
  theme?: ThemeEditeur;
  tailleTexte?: number;
  surChangement: (code: string) => void;
  surEvaluer: () => void;
  surArret: () => void;
  /** Rendu une fois l'éditeur monté. `null` si le chargement a échoué. */
  surPret: (poignee: PoigneeEditeur | null) => void;
}) {
  const hote = useRef<HTMLDivElement | null>(null);
  /**
   * Les rappels sont lus dans un relevé, pas capturés.
   *
   * Une fonction fléchée écrite dans le JSX change d'identité à chaque rendu.
   * En dépendance de l'effet de montage, elle détruirait et reconstruirait
   * l'éditeur à chaque frappe — le curseur reviendrait au début du document à
   * chaque caractère tapé. Même raison que dans `useNotesMidi`.
   */
  const rappels = useRef({ surChangement, surEvaluer, surArret, surPret });
  rappels.current = { surChangement, surEvaluer, surArret, surPret };

  useEffect(() => {
    let vue: { destroy: () => void } | null = null;
    let annule = false;

    void (async () => {
      const racine = hote.current;
      if (!racine) return;
      try {
        const cm = await import("@strudel/codemirror");

        /**
         * Les réglages sont posés AVANT `initEditor` : il les lit une seule
         * fois, à la construction. Les changer après ne ferait rien tant que
         * l'éditeur n'est pas reconstruit.
         *
         * `codemirrorSettings` est un atome persistant : il garde ses valeurs
         * dans `localStorage`, sous une clé à lui. On écrase donc explicitement
         * ce qui compte pour le rack, sans quoi un réglage laissé par une
         * visite précédente reviendrait sans qu'on comprenne d'où.
         */
        cm.codemirrorSettings.set({
          ...cm.codemirrorSettings.get(),
          theme,
          fontFamily: "monospace",
          fontSize: tailleTexte,
          isLineNumbersDisplayed: true,
          isAutoCompletionEnabled: true,
          isPatternHighlightingEnabled: true,
          isFlashEnabled: true,
          isLineWrappingEnabled: true,
          isBracketClosingEnabled: true,
          isTabIndentationEnabled: true,
        });

        if (annule) return;

        const editeur = cm.initEditor({
          root: racine,
          initialCode: codeInitial,
          onChange: (v: { docChanged: boolean; state: { doc: { toString: () => string } } }) => {
            if (v.docChanged) rappels.current.surChangement(v.state.doc.toString());
          },
          onEvaluate: () => {
            rappels.current.surEvaluer();
            // Rendre `true` indique à CodeMirror que la touche est consommée :
            // sans cela le raccourci retomberait sur le navigateur.
            return true;
          },
          onStop: () => {
            rappels.current.surArret();
            return true;
          },
        });
        vue = editeur;

        rappels.current.surPret({
          remplacer: (code) => {
            editeur.dispatch({
              changes: { from: 0, to: editeur.state.doc.length, insert: code },
            });
          },
          lire: () => editeur.state.doc.toString(),
          surligner: (temps, haps) => {
            // Le surlignage est du confort : s'il échoue — une position hors
            // document après une édition pendant la lecture — le son doit
            // continuer. On avale donc l'erreur ici plutôt que de laisser une
            // exception remonter dans la boucle d'animation.
            try {
              cm.highlightMiniLocations(editeur, temps, haps);
            } catch {
              /* le motif continue de jouer */
            }
          },
          poserPositions: (positions) => {
            try {
              cm.updateMiniLocations(editeur, positions);
            } catch {
              /* idem */
            }
          },
          clignoter: () => {
            try {
              cm.flash(editeur);
            } catch {
              /* idem */
            }
          },
          focus: () => editeur.focus(),
        });
      } catch (e) {
        if (annule) return;
        // Remonter l'échec plutôt que de laisser un cadre vide : le rack
        // affichera son éditeur de repli, et le motif restera modifiable.
        console.error("[strudel] l'éditeur CodeMirror n'a pas pu être chargé", e);
        rappels.current.surPret(null);
      }
    })();

    return () => {
      annule = true;
      vue?.destroy();
    };
    // Monté une seule fois. Le thème et la taille sont lus à la construction :
    // les changer demande de remonter le composant, ce que la page fait en
    // changeant sa `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="strudel-cm" ref={hote} data-testid="editeur-strudel" />;
}
