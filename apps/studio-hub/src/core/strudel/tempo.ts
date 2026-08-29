/**
 * Le tempo du Hub, traduit pour Strudel.
 *
 * ## Deux façons de compter
 *
 * Le Hub compte en **battements par minute** : c'est ce que porte le transport
 * partagé, ce que lisent l'OP‑1 et l'EP‑133, et ce que l'utilisateur règle.
 *
 * Strudel compte en **cycles par seconde**. Un cycle est la boucle complète
 * d'un motif : `note("c e g")` répartit trois notes sur un cycle, quelle que
 * soit sa durée.
 *
 * Passer 120 à `setCps` ne donnerait donc pas 120 BPM mais 120 cycles par
 * seconde — un bourdonnement continu, pas un tempo. C'est une erreur qu'on ne
 * diagnostique pas à l'oreille : on croit à une panne du moteur.
 *
 * ## La convention retenue
 *
 * Un cycle vaut une mesure de quatre temps, comme dans la documentation de
 * Strudel — `setcps(120/60/4)` y est l'écriture courante. D'où `bpm / 240`.
 *
 * Ce fichier est séparé du composant pour être exécuté par des tests : la
 * suite tourne en environnement `node`, où importer un `.tsx` et sa feuille de
 * style échouerait.
 */

/** Nombre de temps par cycle. Une mesure à quatre temps. */
export const TEMPS_PAR_CYCLE = 4;

/** Convertit un tempo en battements par minute vers des cycles par seconde. */
export function bpmVersCps(bpm: number): number {
  return bpm / 60 / TEMPS_PAR_CYCLE;
}

/** L'inverse. Sert à vérifier la conversion, et à lire un cps trouvé ailleurs. */
export function cpsVersBpm(cps: number): number {
  return cps * 60 * TEMPS_PAR_CYCLE;
}
