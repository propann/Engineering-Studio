/**
 * Le rack d'effets, sur le bus maître — donc partout.
 *
 * ## Ce que ça change
 *
 * `construireChaineEffets` existait depuis longtemps, mais **un seul appelant
 * l'utilisait** : `AudioPluginRack`, sur chaque voix. Le délai, l'égaliseur,
 * la saturation et le chorus n'existaient donc que pour les vingt moteurs.
 * Un motif Strudel, une pré-écoute de la bibliothèque ou une note du créateur
 * de patch sortaient secs, sans qu'on puisse rien y faire.
 *
 * Ce module l'insère une fois pour toutes entre le bus maître et la sortie.
 * Tout ce qui joue dans l'atelier le traverse, quel que soit l'outil qui l'a
 * produit. C'est ce qui fait un studio plutôt qu'une collection d'outils.
 *
 * ## Un seul jeu de réglages
 *
 * Les réglages vivent ici, pas dans une page. Deux conséquences voulues :
 *
 * - Ils survivent au changement de page. Régler un délai dans le rack DSP puis
 *   passer à Strudel garde le délai — sinon « partout » ne voudrait rien dire.
 * - Ils survivent au rechargement, par `localStorage`. Comme les extraits
 *   Strudel, et pour la même raison : un réglage perdu à chaque visite n'est
 *   pas un réglage.
 *
 * ## Reconstruire plutôt que modifier
 *
 * Un changement de réglage RECONSTRUIT la chaîne et la réinsère. C'est plus
 * simple que de tenir à jour chaque nœud, et le coût est invisible : quelques
 * dizaines de nœuds fabriqués sur un geste d'utilisateur.
 *
 * Le prix à payer est une discontinuité si l'on tourne un bouton pendant
 * qu'un son passe. On l'accepte : l'alternative demanderait de garder un
 * relevé de chaque nœud du graphe, et c'est exactement le genre d'état
 * parallèle qui finit par diverger.
 */

import { contexte, insererSurMaitre, retirerInsertion } from "@studio-hub/rack-bus";
import { construireChaineEffets, type ParamsEffets } from "./effets";

export const CLE_EFFETS = "engineering-studio:effets-maitre:v1";

/**
 * Réglages neutres : la chaîne laisse passer le son sans le modifier.
 *
 * Les mélanges sont à zéro, l'égaliseur à plat. Un atelier qui démarre avec un
 * délai audible surprendrait, et l'on chercherait d'où il vient.
 */
export const EFFETS_NEUTRES: ParamsEffets = {
  fxDriveMix: 0,
  fxDriveAmount: 40,
  fxDriveMode: "soft",
  fxEqLow: 0,
  fxEqMid: 0,
  fxEqHigh: 0,
  fxModMode: "chorus",
  fxModMix: 0,
  fxModRate: 8,
  fxModDepth: 3,
  fxModFeedback: 30,
  fxDelayMix: 0,
  fxDelayTime: 320,
  fxDelayFeedback: 35,
  fxDelayTaps: 1,
  fxDelaySpread: 0,
  fxDelayPan: 0,
};

type Auditeur = (p: ParamsEffets) => void;

const etat = {
  params: { ...EFFETS_NEUTRES },
  auditeurs: new Set<Auditeur>(),
  /** Comment defaire l'insertion courante. */
  retirer: null as (() => void) | null,
  luDuStockage: false,
};

/** Le stockage, injectable pour les tests et absent en fenêtre privée. */
export type Stockage = Pick<Storage, "getItem" | "setItem">;

function stockageParDefaut(): Stockage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Valide un réglage relu.
 *
 * Ne lève jamais : un stockage abîmé rend les valeurs neutres, pas une page
 * blanche. Chaque champ est repris individuellement — une seule valeur
 * corrompue ne doit pas emporter les seize autres.
 */
export function assainir(brut: unknown): ParamsEffets {
  const p = { ...EFFETS_NEUTRES };
  if (!brut || typeof brut !== "object") return p;
  const lu = brut as Record<string, unknown>;
  for (const cle of Object.keys(EFFETS_NEUTRES) as (keyof ParamsEffets)[]) {
    const v = lu[cle];
    const attendu = typeof EFFETS_NEUTRES[cle];
    if (attendu === "number" && typeof v === "number" && Number.isFinite(v)) {
      (p[cle] as number) = v;
    } else if (attendu === "string" && typeof v === "string") {
      // Les deux champs texte sont des enumerations : une valeur inconnue
      // ferait construire un effet qui n'existe pas.
      if (cle === "fxDriveMode" && ["soft", "hard", "fold"].includes(v)) {
        p.fxDriveMode = v as ParamsEffets["fxDriveMode"];
      } else if (cle === "fxModMode" && ["chorus", "flanger", "phaser"].includes(v)) {
        p.fxModMode = v as ParamsEffets["fxModMode"];
      }
    }
  }
  return p;
}

/** Les réglages courants, relus du stockage au premier appel. */
export function effetsMaitre(stockage: Stockage | null = stockageParDefaut()): ParamsEffets {
  if (!etat.luDuStockage) {
    etat.luDuStockage = true;
    try {
      const brut = stockage?.getItem(CLE_EFFETS);
      if (brut) etat.params = assainir(JSON.parse(brut));
    } catch {
      /* stockage illisible : on garde les valeurs neutres */
    }
  }
  return { ...etat.params };
}

/** La chaîne modifie-t-elle le son, ou laisse-t-elle passer ? */
export function effetsActifs(p: ParamsEffets = etat.params): boolean {
  return (
    p.fxDriveMix > 0 ||
    p.fxModMix > 0 ||
    p.fxDelayMix > 0 ||
    p.fxEqLow !== 0 ||
    p.fxEqMid !== 0 ||
    p.fxEqHigh !== 0
  );
}

/**
 * Applique de nouveaux réglages : reconstruit la chaîne et la réinsère.
 *
 * Quand rien n'est actif, on RETIRE l'insertion au lieu d'insérer une chaîne
 * transparente. Une chaîne neutre reste une vingtaine de nœuds à traverser
 * pour chaque échantillon ; ne rien insérer coûte zéro.
 */
export function reglerEffetsMaitre(
  partiels: Partial<ParamsEffets>,
  stockage: Stockage | null = stockageParDefaut(),
): ParamsEffets {
  etat.params = assainir({ ...effetsMaitre(stockage), ...partiels });
  try {
    stockage?.setItem(CLE_EFFETS, JSON.stringify(etat.params));
  } catch {
    // Quota ou mode privé : les réglages valent pour cette session seulement.
  }
  appliquer();
  for (const a of etat.auditeurs) {
    try {
      a({ ...etat.params });
    } catch {
      // Un auditeur qui lève ne doit pas priver les autres.
    }
  }
  return { ...etat.params };
}

/** (Re)construit la chaîne sur le bus maître selon les réglages courants. */
function appliquer(): void {
  try {
    etat.retirer?.();
    etat.retirer = null;
    if (!effetsActifs()) {
      retirerInsertion();
      return;
    }
    const ctx = contexte();
    const { entree, sortie } = construireChaineEffets(
      ctx,
      etat.params,
      ctx.currentTime,
      ctx.destination.channelCount,
    );
    etat.retirer = insererSurMaitre(entree, sortie);
  } catch {
    // Pas de contexte audio, ou un nœud refusé : l'atelier doit continuer de
    // sonner sec plutôt que de se taire.
    etat.retirer = null;
  }
}

/**
 * Rebranche la chaîne sur le contexte courant.
 *
 * À appeler quand un outil vient d'ouvrir le contexte audio : les réglages
 * relus du stockage n'ont encore rien inséré, faute de graphe où le faire.
 */
export function reappliquerEffetsMaitre(): void {
  effetsMaitre();
  appliquer();
}

/**
 * S'abonne aux changements. Rend la fonction de désabonnement.
 *
 * L'auditeur est appelé TOUT DE SUITE avec l'état courant : sans cela, un
 * panneau afficherait ses valeurs par défaut jusqu'au premier changement,
 * pendant que le bus applique autre chose. Deux vérités concurrentes, dont
 * une visible et fausse.
 *
 * Cet appel immédiat est protégé au même titre que les notifications. Il ne
 * l'était pas : un panneau qui lève à son montage — une valeur inattendue, un
 * nœud manquant — faisait remonter l'exception dans l'effet React qui
 * s'abonnait, et cassait la page entière au lieu de son seul panneau.
 */
export function sAbonnerEffets(auditeur: Auditeur): () => void {
  etat.auditeurs.add(auditeur);
  const courant = { ...effetsMaitre() };
  try {
    auditeur(courant);
  } catch {
    // Un auditeur qui lève reste abonné : c'est peut-être une valeur
    // passagère, et le désabonner en douce serait plus surprenant encore.
  }
  return () => {
    etat.auditeurs.delete(auditeur);
  };
}

/** Remet le module à zéro. Réservé aux tests. */
export function reinitialiserEffetsPourTests(): void {
  etat.params = { ...EFFETS_NEUTRES };
  etat.auditeurs.clear();
  etat.retirer = null;
  etat.luDuStockage = false;
}
