import { useEffect, useRef } from "react";
import { sAbonner } from "@studio-hub/midi-dispatch";
import { parseMidiNotePacket } from "@studio-hub/midi-bridge";
import { frequenceDeNote } from "@studio-hub/core/audio/rendu";

/**
 * Jouer une page du hub depuis la machine branchée.
 *
 * Toute page qui produit du son doit être jouable au clavier de l'OP-1 en mode
 * contrôleur. Sans ce crochet, chaque page réécrivait le même décodage —
 * `status & 0xf0`, vélocité 0 qui vaut note-off, conversion en fréquence — et
 * la classification traînait déjà en quatre exemplaires dans le dépôt.
 *
 * Rien n'est décodé ici : `parseMidiNotePacket` le fait déjà, et gère le cas
 * qu'on oublie — le **note-off déguisé**, un `0x90` de vélocité 0 que beaucoup
 * de claviers envoient à la place d'un vrai `0x80`. Le rater laisse chaque note
 * tenue indéfiniment.
 *
 * L'abonnement passe par le répartiteur, jamais par `input.onmidimessage` :
 * c'est une propriété unique, et l'écrire couperait le MIDI de toutes les
 * autres pages sans le moindre message d'erreur.
 */
export type NoteJouee = {
  note: number;
  velocite: number;
  /** Fréquence tempérée, prête pour un oscillateur. */
  frequence: number;
  canal: number;
};

export function useNotesMidi(
  surNoteOn: (note: NoteJouee) => void,
  surNoteOff?: (note: number) => void,
  actif = true
): void {
  /**
   * Les rappels sont lus dans un relevé, pas capturés.
   *
   * Une fonction fléchée écrite dans le JSX change d'identité à chaque rendu.
   * En dépendance d'effet, elle ferait se désabonner puis se réabonner à
   * chaque frappe — et le `WeakSet` du répartiteur, qui évite de recâbler une
   * entrée déjà câblée, rendrait le résultat difficile à diagnostiquer.
   */
  const rappels = useRef({ surNoteOn, surNoteOff });
  rappels.current = { surNoteOn, surNoteOff };

  useEffect(() => {
    if (!actif) return;

    const seDesabonner = sAbonner(({ donnees }) => {
      const message = parseMidiNotePacket(donnees);
      if (!message) return; // horloge, SysEx, contrôleur continu : pas notre affaire

      if (message.action === "note-on") {
        rappels.current.surNoteOn({
          note: message.note,
          velocite: message.velocity,
          frequence: frequenceDeNote(message.note),
          canal: message.channel,
        });
      } else {
        rappels.current.surNoteOff?.(message.note);
      }
    });

    // Ne retire QUE cet auditeur. Le nettoyage destructeur d'autrefois —
    // `inputs.forEach(i => i.onmidimessage = null)` — coupait le MIDI de la
    // page qui prenait la place.
    return seDesabonner;
  }, [actif]);
}
