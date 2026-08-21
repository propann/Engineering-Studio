import { forwardRef, useImperativeHandle, useState } from "react";

/**
 * Bandeau de diagnostic du rack : etat audio, MIDI, dernier message, derniere
 * note.
 *
 * Il porte son PROPRE etat et s'actualise par reference imperative, au lieu
 * d'etre alimente par des props.
 *
 * La raison est mesurable : AudioPluginRack compte 99 useState et 1160 lignes
 * de JSX. Quand ces quatre valeurs vivaient dans le rack, jouer une note
 * declenchait deux setState, donc un rendu complet de tout l'arbre — a chaque
 * note, et a chaque message MIDI entrant.
 *
 * Pour une application audio c'est le pire endroit ou depenser du temps : le
 * fil principal sert aussi a programmer les evenements Web Audio, et un rendu
 * long decale la mise en file des notes.
 *
 * Ici, seul ce composant se rend.
 */

export type DiagnosticHandle = {
  setAudio: (etat: string) => void;
  setMidi: (connecte: boolean, statut: string) => void;
  setDernierMessage: (texte: string) => void;
  setDerniereNote: (texte: string) => void;
  setLatence: (texte: string) => void;
};

type Etat = {
  audio: string;
  midiConnecte: boolean;
  midiStatut: string;
  dernierMessage: string;
  derniereNote: string;
  latence: string;
};

const INITIAL: Etat = {
  audio: "non démarré",
  midiConnecte: false,
  midiStatut: "initialisation…",
  dernierMessage: "—",
  derniereNote: "—",
  latence: "—",
};

export const RackDiagnostic = forwardRef<DiagnosticHandle>(function RackDiagnostic(_props, ref) {
  const [etat, setEtat] = useState<Etat>(INITIAL);

  useImperativeHandle(
    ref,
    () => ({
      // Chaque setter compare avant d'ecrire : un message MIDI repete a
      // l'identique — l'horloge de transport en produit 24 par noire — ne
      // doit pas provoquer de rendu.
      setAudio: (audio) => setEtat((e) => (e.audio === audio ? e : { ...e, audio })),
      setMidi: (midiConnecte, midiStatut) =>
        setEtat((e) =>
          e.midiConnecte === midiConnecte && e.midiStatut === midiStatut
            ? e
            : { ...e, midiConnecte, midiStatut }
        ),
      setDernierMessage: (dernierMessage) =>
        setEtat((e) => (e.dernierMessage === dernierMessage ? e : { ...e, dernierMessage })),
      setDerniereNote: (derniereNote) =>
        setEtat((e) => (e.derniereNote === derniereNote ? e : { ...e, derniereNote })),
      setLatence: (latence) => setEtat((e) => (e.latence === latence ? e : { ...e, latence })),
    }),
    []
  );

  const enErreur = etat.derniereNote.startsWith("ERREUR");

  return (
    <div className="rack-diagnostic">
      <div className="diag-row">
        <span className="diag-label">AUDIO</span>
        <span className={`diag-value ${etat.audio === "running" ? "diag-ok" : "diag-warn"}`}>
          {etat.audio}
        </span>
      </div>
      <div className="diag-row">
        <span className="diag-label">MIDI</span>
        <span className={`diag-value ${etat.midiConnecte ? "diag-ok" : "diag-warn"}`}>
          {etat.midiStatut}
        </span>
      </div>
      <div className="diag-row">
        <span className="diag-label">DERNIER MSG</span>
        <span className="diag-value diag-mono">{etat.dernierMessage}</span>
      </div>
      <div className="diag-row">
        <span className="diag-label">DERNIÈRE NOTE</span>
        <span className={`diag-value diag-mono ${enErreur ? "diag-err" : ""}`}>
          {etat.derniereNote}
        </span>
      </div>
      <div className="diag-row">
        <span className="diag-label">LATENCE MIDI</span>
        <span className="diag-value diag-mono">{etat.latence}</span>
      </div>
    </div>
  );
});
