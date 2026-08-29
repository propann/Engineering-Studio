/**
 * Annuler et refaire, dans l'atelier.
 *
 * ## Ce que ça protège
 *
 * Retirer une couche par erreur perdait ses réglages : le moteur se
 * réajoute, ses cinq curseurs non. Régler un son se fait par essais, et un
 * outil d'essai sans retour arrière punit l'essai.
 *
 * ## Pourquoi un module plutôt qu'un `useState` de plus
 *
 * Parce que la règle qui compte n'est pas « garder les états » mais **lesquels
 * garder**. Un historique qui empile chaque frappe d'un curseur en produit
 * quarante par geste, et « annuler » recule alors d'un pixel. Cette décision
 * se teste ; un tableau dans un composant, non.
 *
 * ## La règle : un pas par GESTE, pas par valeur
 *
 * Deux modifications du même réglage, à moins d'une seconde d'intervalle,
 * fusionnent en un seul pas. C'est ce qui fait qu'annuler après avoir tiré un
 * curseur revient AVANT le geste, et non au pixel précédent.
 *
 * Le seuil est temporel et non basé sur le nombre : une pause d'une seconde
 * au milieu d'un réglage est un geste qui s'arrête, et l'on veut pouvoir y
 * revenir.
 */

import type { SonFabrique } from "./couches";

/** Profondeur de l'historique. Au-delà, les plus anciens tombent. */
export const PROFONDEUR = 40;

/** Délai en deçà duquel deux gestes identiques fusionnent, en millisecondes. */
export const FUSION_MS = 1000;

export type Historique = {
  /** Les états passés, du plus ancien au plus récent. */
  passe: SonFabrique[];
  /** Les états annulés, prêts à être refaits. */
  futur: SonFabrique[];
  /** Ce qui a produit le dernier pas, pour décider d'une fusion. */
  dernierGeste: string | null;
  dernierInstant: number;
};

export function historiqueVide(): Historique {
  return { passe: [], futur: [], dernierGeste: null, dernierInstant: 0 };
}

/**
 * Enregistre un état AVANT de le remplacer.
 *
 * `geste` nomme ce qu'on fait : `"gain:abc123"`, `"ajout"`, `"retrait"`. Deux
 * appels de suite avec le MÊME nom, rapprochés, ne créent qu'un pas — c'est
 * ainsi qu'un curseur tiré compte pour un.
 *
 * `maintenant` est injectable : sans cela, tester la fusion demanderait
 * d'attendre une seconde pour de vrai.
 */
export function empiler(
  h: Historique,
  avant: SonFabrique,
  geste: string,
  maintenant: () => number = () => Date.now(),
): Historique {
  const t = maintenant();
  const fusionne = h.dernierGeste === geste && t - h.dernierInstant < FUSION_MS;

  if (fusionne) {
    // On garde l'état d'AVANT le geste, déjà empilé, et l'on repousse
    // seulement l'horloge : le pas couvre tout le geste.
    return { ...h, dernierInstant: t, futur: [] };
  }

  const passe = [...h.passe, avant];
  return {
    // On coupe par la GAUCHE : les états les plus anciens tombent en premier.
    passe: passe.length > PROFONDEUR ? passe.slice(passe.length - PROFONDEUR) : passe,
    // Toute action neuve efface le futur. Garder une branche annulée puis
    // reprise ailleurs donnerait un « refaire » qui saute dans un état sans
    // rapport avec ce qu'on voit.
    futur: [],
    dernierGeste: geste,
    dernierInstant: t,
  };
}

/**
 * Annule : rend l'état précédent et l'historique mis à jour.
 *
 * `courant` entre dans le futur, pour que « refaire » y revienne. Rend `null`
 * quand il n'y a rien à annuler — l'appelant garde alors son état plutôt que
 * de recevoir un son vide.
 */
export function annuler(
  h: Historique,
  courant: SonFabrique,
): { son: SonFabrique; historique: Historique } | null {
  if (h.passe.length === 0) return null;
  const son = h.passe[h.passe.length - 1];
  return {
    son,
    historique: {
      passe: h.passe.slice(0, -1),
      futur: [courant, ...h.futur],
      // Le geste est oublié : sans cela, modifier le même réglage juste après
      // une annulation fusionnerait avec le geste d'avant celle-ci, et le pas
      // suivant serait perdu.
      dernierGeste: null,
      dernierInstant: 0,
    },
  };
}

/** Refait ce qui vient d'être annulé. */
export function refaire(
  h: Historique,
  courant: SonFabrique,
): { son: SonFabrique; historique: Historique } | null {
  if (h.futur.length === 0) return null;
  const [son, ...reste] = h.futur;
  return {
    son,
    historique: {
      passe: [...h.passe, courant],
      futur: reste,
      dernierGeste: null,
      dernierInstant: 0,
    },
  };
}

export const peutAnnuler = (h: Historique): boolean => h.passe.length > 0;
export const peutRefaire = (h: Historique): boolean => h.futur.length > 0;
