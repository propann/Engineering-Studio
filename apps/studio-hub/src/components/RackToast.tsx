import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * Message fugitif du rack.
 *
 * Meme raison d'etre que RackDiagnostic : le message vivait dans l'etat du
 * rack, et les quinze moteurs l'appellent a chaque note. Chaque note
 * declenchait donc DEUX rendus des 1160 lignes de JSX du rack — un a
 * l'affichage, un a l'extinction deux secondes plus tard.
 *
 * Le fil qui rend est aussi celui qui programme les evenements Web Audio :
 * un rendu long y decale la mise en file des notes.
 */

export type ToastHandle = {
  afficher: (message: string) => void;
};

export const RackToast = forwardRef<ToastHandle>(function RackToast(_props, ref) {
  const [message, setMessage] = useState<string | null>(null);
  const minuterie = useRef<number | undefined>(undefined);

  useImperativeHandle(
    ref,
    () => ({
      afficher: (texte: string) => {
        // Une seule minuterie a la fois : sur un trait rapide au clavier, la
        // precedente effacerait le message courant avant son terme.
        if (minuterie.current !== undefined) window.clearTimeout(minuterie.current);
        setMessage(texte);
        minuterie.current = window.setTimeout(() => setMessage(null), 2000);
      },
    }),
    []
  );

  useEffect(
    () => () => {
      if (minuterie.current !== undefined) window.clearTimeout(minuterie.current);
    },
    []
  );

  if (!message) return null;

  return (
    <div className="plugin-toast-overlay" role="status" aria-live="polite">
      <span>{message}</span>
    </div>
  );
});
