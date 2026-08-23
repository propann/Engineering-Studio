/**
 * Le transport de l'atelier : un tempo, une marche, un arrêt.
 *
 * Dans son propre fichier parce que la synchro n'est pas strictement audio —
 * elle concerne aussi le MIDI, et l'horloge que le rack envoie aux machines.
 * Si elle doit un jour devenir `packages/transport`, ce sera un déplacement de
 * fichier, pas une refonte.
 *
 * Même forme que `midi-dispatch` : un état de module, des abonnés dans un
 * `Set`, et une fonction de désabonnement rendue à l'abonnement. Un service
 * qui s'utilise comme l'ancien ne s'apprend pas.
 */

/** L'état que voit un abonné. */
export interface Transport {
  /** Battements par minute, borné par `bpmSain`. */
  bpm: number;
  /** Le transport tourne-t-il. */
  enMarche: boolean;
}

export type AuditeurTransport = (t: Transport) => void;

/**
 * Bornes reprises de `packages/musique/divisions.ts`.
 *
 * Elles y sont appliquées par `bpmSain`. Les redire ici plutôt que d'importer
 * évite de faire dépendre le fond de panier du paquet musique, qui est un
 * client parmi d'autres — et deux valeurs recopiées valent mieux qu'un cycle
 * de dépendances. Le test `transport.test.ts` verrouille leur accord.
 */
export const BPM_MIN = 20;
export const BPM_MAX = 300;

type Etat = {
  bpm: number;
  enMarche: boolean;
  auditeurs: Set<AuditeurTransport>;
};

const etat: Etat = {
  bpm: 120,
  enMarche: false,
  auditeurs: new Set(),
};

/** Ramène un tempo dans les bornes. Un NaN retombe sur 120. */
export function bornerBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 120;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, bpm));
}

function prevenir(): void {
  const instantane: Transport = { bpm: etat.bpm, enMarche: etat.enMarche };
  for (const auditeur of etat.auditeurs) {
    // Un auditeur qui lève ne prive pas les autres du changement.
    try {
      auditeur(instantane);
    } catch {
      /* l'auditeur gère ses propres erreurs */
    }
  }
}

/** L'état courant, pour qui a besoin de le lire sans s'abonner. */
export function transport(): Transport {
  return { bpm: etat.bpm, enMarche: etat.enMarche };
}

/**
 * Change le tempo. Sans effet si la valeur bornée est déjà celle en cours :
 * un abonné qui redessine à chaque notification ne doit pas être réveillé
 * pour rien.
 */
export function reglerBpm(bpm: number): void {
  const borne = bornerBpm(bpm);
  if (borne === etat.bpm) return;
  etat.bpm = borne;
  prevenir();
}

/** Démarre ou arrête. Sans effet si l'état est déjà celui demandé. */
export function reglerMarche(enMarche: boolean): void {
  if (enMarche === etat.enMarche) return;
  etat.enMarche = enMarche;
  prevenir();
}

/**
 * Abonne au transport.
 *
 * Le nouvel abonné est prévenu **immédiatement**, sans attendre un changement :
 * une façade montée après le démarrage afficherait sinon un tempo faux jusqu'au
 * prochain réglage.
 */
export function sAbonnerTransport(auditeur: AuditeurTransport): () => void {
  etat.auditeurs.add(auditeur);
  try {
    auditeur({ bpm: etat.bpm, enMarche: etat.enMarche });
  } catch {
    /* idem */
  }
  return () => {
    etat.auditeurs.delete(auditeur);
  };
}

/**
 * Remet le transport à zéro. Réservé aux tests.
 *
 * Le module tient un état global — c'est son rôle — mais un test qui laisse
 * ses auditeurs en place contamine le suivant.
 */
export function reinitialiserTransportPourTests(): void {
  etat.bpm = 120;
  etat.enMarche = false;
  etat.auditeurs.clear();
}
