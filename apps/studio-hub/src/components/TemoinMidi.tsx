import { useEffect, useRef, useState } from "react";
import { sAbonner, sAbonnerEtat } from "@studio-hub/midi-dispatch";
import { parseMidiNotePacket } from "@studio-hub/midi-bridge";
import { nomDeNote } from "@studio-hub/core/audio/rendu";

/**
 * Témoin MIDI — dire à l'écran si la machine est entendue, ici.
 *
 * Deux pages produisaient du son en écoutant la machine **sans rien afficher**.
 * Quand rien ne sonne, on ne peut alors pas distinguer trois causes très
 * différentes :
 *
 * - le navigateur n'a pas accordé l'accès MIDI ;
 * - Web MIDI n'existe pas ici — c'est le cas hors contexte sécurisé, et
 *   `http://192.168.x.x` n'en est pas un ;
 * - la machine émet, la page reçoit, mais le son ne sort pas.
 *
 * Le témoin les sépare : il montre l'état de l'accès, le nombre d'entrées, et
 * **la dernière note reçue**. Une note qui s'affiche sans qu'on entende rien
 * déplace le diagnostic du MIDI vers l'audio, ce qui est la moitié du travail.
 */
export function TemoinMidi({ compact = false }: { compact?: boolean }) {
  const [accorde, setAccorde] = useState<boolean | null>(null);
  const [raison, setRaison] = useState<string | null>(null);
  const [entrees, setEntrees] = useState<string[]>([]);
  const [derniere, setDerniere] = useState<string | null>(null);
  const minuterie = useRef<number | undefined>(undefined);

  useEffect(() => {
    const seDesabonnerEtat = sAbonnerEtat(({ entrees: e, accorde: a, raison: r }) => {
      setAccorde(a);
      setEntrees(e);
      setRaison(r ?? null);
    });

    const seDesabonner = sAbonner(({ donnees }) => {
      const message = parseMidiNotePacket(donnees);
      // Seules les notes : afficher l'horloge ferait clignoter le témoin
      // 24 fois par noire, ce qui n'apprend rien et fatigue l'œil.
      if (!message || message.action !== "note-on") return;
      setDerniere(`${nomDeNote(message.note)} · ${message.velocity}`);
      // La note s'efface : un témoin figé sur une note d'il y a dix minutes
      // ferait croire que la machine parle encore.
      if (minuterie.current !== undefined) window.clearTimeout(minuterie.current);
      minuterie.current = window.setTimeout(() => setDerniere(null), 1500);
    });

    return () => {
      if (minuterie.current !== undefined) window.clearTimeout(minuterie.current);
      seDesabonnerEtat();
      seDesabonner();
    };
  }, []);

  const etat = accorde === null ? "attente" : accorde ? "ok" : "refus";
  const texte =
    accorde === null
      ? "MIDI — connexion…"
      : accorde
        ? entrees.length
          ? `MIDI · ${entrees.length} entrée${entrees.length > 1 ? "s" : ""}`
          : "MIDI accordé · aucune entrée détectée"
        : "MIDI indisponible";

  return (
    <div className={`temoin-midi temoin-midi--${etat} ${compact ? "temoin-midi--compact" : ""}`}>
      <span className="temoin-midi-point" aria-hidden="true" />
      <span className="temoin-midi-texte">{texte}</span>
      {derniere && <span className="temoin-midi-note">♪ {derniere}</span>}
      {accorde === false && raison && (
        <span className="temoin-midi-raison" title={raison}>
          {/* Le cas le plus frequent, et le plus deroutant : la page marche
              parfaitement a la souris, et le MIDI n'existe simplement pas. */}
          {raison.includes("indisponible")
            ? "ouvre le site en https ou sur localhost"
            : "autorise le MIDI dans le navigateur"}
        </span>
      )}
    </div>
  );
}
