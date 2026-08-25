"use client";
import { useCallback, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { useNotesMidi } from "../core/midi/useNotesMidi";
import { GameGuitarHeroPanel } from "../../../op1-studio/app/components/GameGuitarHeroPanel";

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
    <main
      className="exercises-hub-app"
      style={{
        minHeight: "100vh",
        background: "#0e1314",
        color: "#eef3ea",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar activePage="exercises" onDocClick={() => (window as any).navigateMaquette?.("doc-op1")} />

      {notice && (
        <div
          role="status"
          style={{
            margin: "8px 16px",
            padding: "8px 12px",
            background: "#1e293b",
            border: "1px solid #38bdf8",
            borderRadius: "6px",
            color: "#38bdf8",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ flex: 1, padding: "6px 8px" }}>
        <GameGuitarHeroPanel
          onClose={handleClose}
          pressedNotes={pressedMidiNotes}
          onNotice={handleNotice}
        />
      </div>
    </main>
  );
}
