/**
 * Répartiteur Web MIDI : un seul abonnement aux entrées, plusieurs auditeurs.
 *
 * ## Pourquoi ce paquet existe
 *
 * `input.onmidimessage` est une **propriété unique**, pas un `addEventListener`.
 * Le dernier qui écrit gagne, silencieusement. Trois composants l'écrivaient
 * déjà — le rack, `useWebMidi` de l'EP-133, et la page OP-1 — et le simple fait
 * d'en afficher deux à la fois suffisait à en rendre un muet.
 *
 * Pire : leurs nettoyages étaient **destructeurs**. Chacun faisait
 *
 *     access.inputs.forEach((input) => { input.onmidimessage = null; });
 *
 * c'est-à-dire effaçait aussi les gestionnaires des autres. Fermer un panneau
 * coupait le MIDI de la page qui restait.
 *
 * Ici, `sAbonner` rend une fonction qui ne retire **que** son propre auditeur.
 * C'est tout l'objet du paquet.
 *
 * ## `sysex: true`, une fois pour toutes
 *
 * L'EP-133 en a besoin pour lister ses sons. Deux `requestMIDIAccess` aux
 * exigences différentes peuvent redéclencher une invite de permission, et le
 * navigateur mémorise la première réponse. On demande donc le plus large une
 * seule fois — un accès sysex sert aussi ceux qui n'en veulent pas.
 */

export interface MessageMidi {
  /** Octets bruts du message. */
  donnees: Uint8Array;
  /** Nom du port d'entrée, pour distinguer les machines. */
  port: string;
  /** Horodatage du navigateur, sur l'horloge de `performance.now()`. */
  horodatage: number;
}

export type AuditeurMidi = (message: MessageMidi) => void;
export type AuditeurEtat = (info: { entrees: string[]; accorde: boolean; raison?: string }) => void;

type Etat = {
  access: MIDIAccess | null;
  /** Demande en cours : deux abonnés simultanés ne doivent pas la lancer deux fois. */
  demande: Promise<MIDIAccess | null> | null;
  auditeurs: Set<AuditeurMidi>;
  auditeursEtat: Set<AuditeurEtat>;
  /** Ports déjà câblés, pour ne pas réécrire un gestionnaire à chaque rafraîchissement. */
  cables: WeakSet<MIDIInput>;
};

const etat: Etat = {
  access: null,
  demande: null,
  auditeurs: new Set(),
  auditeursEtat: new Set(),
  cables: new WeakSet(),
};

function nomsEntrees(access: MIDIAccess): string[] {
  const noms: string[] = [];
  access.inputs.forEach((input) => noms.push(input.name ?? "entrée sans nom"));
  return noms;
}

function prevenirEtat(accorde: boolean, raison?: string): void {
  const entrees = etat.access ? nomsEntrees(etat.access) : [];
  for (const a of etat.auditeursEtat) {
    // Un auditeur qui lève ne doit pas empêcher les autres d'être prévenus.
    try {
      a({ entrees, accorde, raison });
    } catch {
      /* l'auditeur gère ses propres erreurs */
    }
  }
}

/**
 * Câble les entrées non encore câblées.
 *
 * Le gestionnaire posé ici est le SEUL de tout le document. Il diffuse à tous
 * les auditeurs, ce qui rend la cohabitation possible.
 */
function cablerEntrees(access: MIDIAccess): void {
  access.inputs.forEach((input) => {
    if (etat.cables.has(input)) return;
    etat.cables.add(input);
    input.onmidimessage = (event: MIDIMessageEvent) => {
      const message: MessageMidi = {
        donnees: event.data ?? new Uint8Array(),
        port: input.name ?? "",
        horodatage: event.timeStamp,
      };
      for (const auditeur of etat.auditeurs) {
        try {
          auditeur(message);
        } catch {
          /* un auditeur en échec ne prive pas les autres du message */
        }
      }
    };
  });
}

/** Ouvre l'accès une seule fois, quelle que soit le nombre d'abonnés. */
function obtenirAcces(): Promise<MIDIAccess | null> {
  if (etat.access) return Promise.resolve(etat.access);
  if (etat.demande) return etat.demande;

  if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
    prevenirEtat(false, "Web MIDI indisponible (navigateur ou contexte non sécurisé)");
    return Promise.resolve(null);
  }

  etat.demande = navigator
    .requestMIDIAccess({ sysex: true })
    .then((access) => {
      etat.access = access;
      cablerEntrees(access);
      // Branchement et débranchement à chaud. Un seul `onstatechange` pour tout
      // le document : c'est lui qui, dupliqué, réattachait les gestionnaires
      // d'une page démontée par-dessus ceux de la page active.
      access.onstatechange = () => {
        cablerEntrees(access);
        prevenirEtat(true);
      };
      prevenirEtat(true);
      return access;
    })
    .catch((erreur) => {
      etat.demande = null; // une permission refusée peut être re-demandée
      prevenirEtat(false, `accès refusé : ${(erreur as Error)?.message ?? erreur}`);
      return null;
    });

  return etat.demande;
}

/**
 * Abonne un auditeur aux messages MIDI.
 *
 * Rend la fonction de désabonnement. Elle ne retire QUE cet auditeur — jamais
 * les gestionnaires du navigateur, jamais les auditeurs des autres. C'est la
 * différence avec ce que faisait chaque composant avant.
 */
export function sAbonner(auditeur: AuditeurMidi): () => void {
  etat.auditeurs.add(auditeur);
  void obtenirAcces();
  return () => {
    etat.auditeurs.delete(auditeur);
  };
}

/** Abonne aux changements d'état : entrées disponibles, accès accordé ou non. */
export function sAbonnerEtat(auditeur: AuditeurEtat): () => void {
  etat.auditeursEtat.add(auditeur);
  void obtenirAcces().then(() => {
    // On prévient immédiatement le nouvel abonné, sans attendre un branchement :
    // sinon une interface montée après l'ouverture de l'accès resterait vide.
    if (etat.access) {
      try {
        auditeur({ entrees: nomsEntrees(etat.access), accorde: true });
      } catch {
        /* idem */
      }
    }
  });
  return () => {
    etat.auditeursEtat.delete(auditeur);
  };
}

/** Sorties MIDI disponibles, pour qui doit émettre. */
export async function sorties(): Promise<MIDIOutput[]> {
  const access = await obtenirAcces();
  if (!access) return [];
  const liste: MIDIOutput[] = [];
  access.outputs.forEach((o) => liste.push(o));
  return liste;
}

/**
 * Remet le répartiteur à zéro. Réservé aux tests.
 *
 * Le module tient un état global — c'est son rôle, il n'existe qu'un seul
 * accès MIDI par document — mais un test qui laisse ses auditeurs en place
 * contamine le suivant.
 */
export function reinitialiserPourTests(): void {
  etat.access = null;
  etat.demande = null;
  etat.auditeurs.clear();
  etat.auditeursEtat.clear();
  etat.cables = new WeakSet();
}
