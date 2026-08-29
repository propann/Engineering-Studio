/**
 * Le son qu'une autre page demande à l'atelier d'ouvrir.
 *
 * ## Pourquoi ce détour
 *
 * La navigation du Hub est un simple changement d'état :
 * `window.navigateMaquette("atelier-son")` remplace la page, sans URL ni
 * paramètre. Il n'y a donc aucun endroit où glisser « ouvre CE son ».
 *
 * Trois solutions se présentaient :
 *
 * - **Une URL** — il faudrait donner une route à chaque page, ce que le Hub
 *   n'a pas, et un son ne tient pas dans une adresse.
 * - **Un événement** — il partirait avant que l'atelier soit monté, et
 *   personne ne l'entendrait.
 * - **Un dépôt** — la page qui envoie pose, celle qui arrive prend. C'est
 *   celui-ci.
 *
 * ## Une seule prise
 *
 * `prendreSonEnAttente` VIDE le dépôt. Sans cela, revenir à l'atelier
 * rouvrirait le même son et écraserait le travail en cours — un mois plus
 * tard, personne ne comprendrait d'où il vient.
 */

import { analyserSon, type SonFabrique } from "./couches";

type Depot = { son: SonFabrique; provenance: string } | null;

let depot: Depot = null;

/** Dépose un son pour l'atelier. Remplace un dépôt précédent non consommé. */
export function poserSonEnAttente(son: SonFabrique, provenance: string): void {
  depot = { son, provenance };
}

/**
 * Dépose le CONTENU d'un fichier, en le validant.
 *
 * Rend le message d'erreur plutôt que de lever : l'appelant est une liste de
 * fichiers, et un `.son.json` abîmé ne doit pas empêcher d'ouvrir les autres.
 */
export function poserFichierEnAttente(
  contenu: string,
  provenance: string,
): { ok: true } | { ok: false; erreur: string } {
  const lu = analyserSon(contenu);
  if ("erreur" in lu) return { ok: false, erreur: lu.erreur };
  poserSonEnAttente(lu.son, provenance);
  return { ok: true };
}

/** Prend le son déposé, s'il y en a un. Le dépôt est vidé. */
export function prendreSonEnAttente(): { son: SonFabrique; provenance: string } | null {
  const pris = depot;
  depot = null;
  return pris;
}

/** Y a-t-il un son en attente ? Ne le consomme pas. */
export function aUnSonEnAttente(): boolean {
  return depot !== null;
}

/** Vide le dépôt. Réservé aux tests. */
export function reinitialiserDepotPourTests(): void {
  depot = null;
}
