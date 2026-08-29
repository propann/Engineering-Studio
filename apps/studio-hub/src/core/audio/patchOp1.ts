/**
 * Les métadonnées qu'un patch OP-1 porte dans son AIFF.
 *
 * ## Pourquoi elles comptent
 *
 * La référence matérielle du dépôt est explicite : « Patches `.aif` avec
 * métadonnées JSON encodées dans le chunk standard AIFF `APPL` tag `OP-1` ».
 * Sans ce chunk, la machine charge le son — mais comme un échantillon
 * anonyme : pas de nom de patch, et surtout **pas de fréquence de
 * référence**, donc une transposition calée sur un do arbitraire.
 *
 * `SoundPatchCreator` produisait ces informations dans un fichier `.json`
 * posé À CÔTÉ de l'audio. L'OP-1 n'ouvre que l'AIFF : ce fichier n'était lu
 * par personne. Le contenu était juste, le conteneur non.
 *
 * ## Deux formes, deux usages
 *
 * Un patch **synth** transpose un seul échantillon sur tout le clavier : il
 * lui faut la fréquence de la note enregistrée, sans quoi la machine suppose
 * un do et tout sonne faux d'autant.
 *
 * Un patch **drum** découpe un fichier unique en 24 tranches, une par touche.
 * L'atelier ne fabrique pas encore de kit : on pose donc les 24 marqueurs sur
 * le son entier, ce qui donne le même son sous chaque touche. C'est
 * volontaire et dit — plutôt que de laisser 23 touches muettes.
 */

import { frequenceDeNoteMidi } from "./rendreCouches";
import type { SonFabrique } from "./couches";
import type { Op1PatchMetadata } from "@studio-hub/audio-formats";

/**
 * L'échelle des marqueurs OP-1.
 *
 * Les positions `start` et `end` d'un patch drum ne sont pas des
 * échantillons : elles sont exprimées sur une échelle fixe de 0 à 2 032 000,
 * quelle que soit la durée du fichier. Une valeur en échantillons y placerait
 * les tranches au tout début du son.
 */
export const ECHELLE_MARQUEURS = 2_032_000;

/** Nombre de touches d'un kit drum. */
export const TOUCHES_DRUM = 24;

/** Un nom de patch acceptable pour l'écran de la machine. */
export function nomPatchOp1(nom: string): string {
  const propre = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 24);
  return propre || "patch";
}

/** Les métadonnées à écrire dans le chunk, selon le type de patch. */
export function metadonneesOp1(son: SonFabrique, type: "synth" | "drum"): Op1PatchMetadata {
  const nom = nomPatchOp1(son.nom);
  if (type === "drum") {
    /**
     * Les 24 tranches couvrent tout le son.
     *
     * Un kit fabriqué couche par couche demanderait de rendre 24 sons et de
     * les concaténer — l'atelier ne le fait pas encore. Poser les marqueurs
     * sur l'ensemble donne le même son sous chaque touche, ce qui est
     * utilisable ; laisser des marqueurs à zéro laisserait 23 touches muettes.
     */
    return {
      type: "drum",
      name: nom,
      start: Array.from({ length: TOUCHES_DRUM }, () => 0),
      end: Array.from({ length: TOUCHES_DRUM }, () => ECHELLE_MARQUEURS),
      playmode: Array.from({ length: TOUCHES_DRUM }, () => 8192),
      reverse: Array.from({ length: TOUCHES_DRUM }, () => 8192),
      volume: Array.from({ length: TOUCHES_DRUM }, () => 8192),
    };
  }
  return {
    type: "sampler",
    name: nom,
    /**
     * La fréquence de la note RENDUE, pas un do arbitraire.
     *
     * C'est ce qui permet à la machine de transposer juste : elle sait alors
     * quelle touche correspond au son tel qu'il a été enregistré. Sans elle,
     * un son rendu en do2 joué depuis la touche do3 sonnerait une octave à
     * côté sans qu'on comprenne pourquoi.
     */
    base_freq: Math.round(frequenceDeNoteMidi(son.note) * 100) / 100,
  };
}
