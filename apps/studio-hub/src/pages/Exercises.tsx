"use client";
import { useCallback, useRef, useState } from "react";
import { useNotesMidi } from "../core/midi/useNotesMidi";
import { GameGuitarHeroPanel } from "../../../op1-studio/app/components/GameGuitarHeroPanel";
import { AppShell, Button, StatusBadge } from "../ui";

export default function Exercises() {
  const [notice, setNotice] = useState<string | null>(null);
  const [pressedMidiNotes, setPressedMidiNotes] = useState<number[]>([]);

  const handleNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  const handleClose = useCallback(() => {
    (window as any).navigateMaquette?.("outils");
  }, []);

  /**
   * Les notes tenues, vues par le repartiteur.
   *
   * Cette page ecrivait `input.onmidimessage` sur chaque entree, et le
   * reecrivait a chaque `onstatechange`. C'est une propriete UNIQUE : l'ecrire
   * remplace le gestionnaire du repartiteur, et rend muets tous les autres
   * abonnes — le rack, le clavier virtuel, le temoin MIDI — sans le moindre
   * message d'erreur. `packages/midi-dispatch/exclusivite.test.ts` interdit ce
   * geste, et le signalait ici en trois endroits.
   *
   * Le crochet fait deja tout ce que le bloc supprime refaisait, y compris le
   * note-off deguise (`0x90` de velocite 0) que beaucoup de claviers envoient
   * a la place d'un vrai `0x80`.
   */
  const tenues = useRef(new Set<number>());

  useNotesMidi(
    useCallback(({ note }) => {
      tenues.current.add(note);
      setPressedMidiNotes([...tenues.current]);
    }, []),
    useCallback((note: number) => {
      tenues.current.delete(note);
      setPressedMidiNotes([...tenues.current]);
    }, [])
  );

  return (
    <AppShell activePage="exercises" onDocClick={() => (window as any).navigateMaquette?.("doc-op1")} className="exercises-hub-app">

      {notice && (
        <div role="status" className="exercise-notice">
          <StatusBadge tone="test">{notice}</StatusBadge>
          <Button variant="icon" aria-label="Fermer le message" onClick={() => setNotice(null)} icon={<span aria-hidden="true">✕</span>} />
        </div>
      )}

      <div className="exercise-game-stage">
        <GameGuitarHeroPanel
          onClose={handleClose}
          pressedNotes={pressedMidiNotes}
          onNotice={handleNotice}
        />
      </div>
    </AppShell>
  );
}
