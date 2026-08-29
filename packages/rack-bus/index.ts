/**
 * Le fond de panier du rack.
 *
 * Tout outil qu'on ajoute — les quinze moteurs, l'éditeur de sample, la Game
 * Boy émulée, Strudel — se branche ici et hérite d'office du traitement, du
 * mixage et de la synchro. Il ne fabrique pas de contexte, ne connaît pas la
 * réverbération, et ignore qui d'autre est branché.
 *
 * ## Pourquoi ce paquet existe
 *
 * Le graphe qu'il porte n'est pas nouveau : il était écrit dans
 * `AudioPluginRack.tsx`, aux lignes 588 à 612, au service exclusif des quinze
 * moteurs — bus maître, analyseur, et « un seul convolveur pour tout le rack,
 * chaque moteur y envoie via son propre gain auxiliaire ». C'est un départ
 * auxiliaire vers un retour partagé : une console, déjà.
 *
 * Le problème n'était pas le graphe, c'était son propriétaire. **Trois**
 * composants définissaient chacun leur propre `getAudioContext` —
 * `AudioPluginRack:650`, `SoundEditorHub:374`, `SoundPatchCreator:55` — qui
 * fabriquait un `AudioContext` privé dans un `useRef` et le fermait au
 * démontage. Les pages étant exclusives dans `App.tsx`, ouvrir un outil coupait
 * le son du précédent, et rien ne pouvait être câblé entre deux pages.
 *
 * ## La forme
 *
 * Celle de `midi-dispatch`, qui a résolu le même problème pour les notes : un
 * état de module, des abonnés dans un `Set`, une fonction de désabonnement
 * rendue à l'abonnement, et un `reinitialiser…PourTests`. Les deux paquets sont
 * les deux bus du rack — l'un porte les notes, l'autre le son.
 *
 * ## Ce que ce paquet ne fait pas
 *
 * Il ne ferme jamais le contexte. Un `AudioContext` par document, ouvert à la
 * première demande et gardé : c'est exactement ce que les composants ne
 * faisaient pas, et les navigateurs en limitent le nombre par page.
 */

export {
  BPM_MAX,
  BPM_MIN,
  bornerBpm,
  reglerBpm,
  reglerMarche,
  reinitialiserTransportPourTests,
  sAbonnerTransport,
  transport,
  type AuditeurTransport,
  type Transport,
} from "./transport";

/** Ce qu'un outil reçoit en échange de son branchement. */
export interface Prise {
  /** Le nœud où l'outil connecte sa sortie. Son gain est la tranche de console. */
  entree: GainNode;
  /** Panoramique de la voie. */
  panoramique: StereoPannerNode;
  /** Départ auxiliaire vers la réverbération partagée. À 0 par défaut. */
  depart: GainNode;
  /** Débranche la voie et libère ses nœuds. Idempotent. */
  detacher(): void;
}

/** L'état d'une voie, pour dessiner la console. */
export interface Voie {
  /** Identifiant stable, unique même si deux outils portent le même nom. */
  id: string;
  nom: string;
  gain: number;
  panoramique: number;
  depart: number;
  muet: boolean;
  /** Une voie en solo impose le silence aux autres. */
  solo: boolean;
}

export type AuditeurMixage = (voies: Voie[]) => void;

type VoieInterne = Voie & {
  entree: GainNode;
  pan: StereoPannerNode;
  aux: GainNode;
  /** Gain appliqué par muet/solo, distinct du gain de l'utilisateur. */
  coupure: GainNode;
  detachee: boolean;
};

type Etat = {
  ctx: AudioContext | null;
  /** Bus maître : tout y aboutit, il est seul relié à la sortie. */
  bus: GainNode | null;
  analyseur: AnalyserNode | null;
  reverb: ConvolverNode | null;
  retour: GainNode | null;
  voies: Map<string, VoieInterne>;
  auditeurs: Set<AuditeurMixage>;
  compteur: number;
};

const etat: Etat = {
  ctx: null,
  bus: null,
  analyseur: null,
  reverb: null,
  retour: null,
  voies: new Map(),
  auditeurs: new Set(),
  compteur: 0,
};

/**
 * Fabrique la réponse impulsionnelle de la réverbération.
 *
 * Un bruit décroissant suffit : c'est ce que faisait le rack, et charger un
 * fichier d'impulsion ferait dépendre le son d'un téléchargement — donc d'un
 * réseau, dans un atelier qui se veut local-first.
 */
function fabriquerImpulsion(ctx: BaseAudioContext, secondes = 2.4): AudioBuffer {
  const n = Math.max(1, Math.floor(ctx.sampleRate * secondes));
  const buffer = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal += 1) {
    const donnees = buffer.getChannelData(canal);
    for (let i = 0; i < n; i += 1) {
      // Décroissance exponentielle : la puissance 2.6 donne une queue courte,
      // proche de celle du rack, sans traîner sur les notes rapides.
      donnees[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.6;
    }
  }
  return buffer;
}

/**
 * Le contexte de l'atelier. Un seul par document, ouvert à la première demande.
 *
 * Jamais fermé : c'est le contrat. Une page qui se démonte débranche sa voie,
 * elle ne coupe pas le son des autres.
 */
export function contexte(): AudioContext {
  if (etat.ctx && etat.ctx.state !== "closed") {
    // Un contexte suspendu par la politique de lecture automatique se réveille
    // au premier geste : reprendre ici évite un silence inexpliqué.
    if (etat.ctx.state === "suspended") void etat.ctx.resume().catch(() => {});
    return etat.ctx;
  }

  const Ctor: typeof AudioContext =
    (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;

  const ctx = new Ctor();
  const bus = ctx.createGain();
  const analyseur = ctx.createAnalyser();
  analyseur.fftSize = 2048;

  const reverb = ctx.createConvolver();
  reverb.buffer = fabriquerImpulsion(ctx);
  const retour = ctx.createGain();
  retour.gain.value = 1;
  reverb.connect(retour);
  retour.connect(bus);

  bus.connect(analyseur);
  bus.connect(ctx.destination);

  etat.ctx = ctx;
  etat.bus = bus;
  etat.analyseur = analyseur;
  etat.reverb = reverb;
  etat.retour = retour;
  return ctx;
}

/**
 * Le contexte s'il existe DEJA, sans en ouvrir un.
 *
 * `contexte()` ouvre le contexte a la premiere demande — c'est ce qu'on veut
 * d'un outil qui va jouer. Un panneau qui se contente de RENDRE COMPTE de
 * l'etat audio n'a pas a le declencher : un visiteur qui n'a rien lance ne
 * doit pas se voir ouvrir un contexte, et les navigateurs en plafonnent le
 * nombre par document.
 *
 * Ajoute le 2026-08-29 pour `ServerTelemetryRack`, qui fabriquait un contexte
 * jetable a seule fin de lire son `sampleRate`, puis le fermait — deux fois,
 * le mode strict de React rejouant l'effet. Il decrivait donc un contexte que
 * personne n'utilisait, en consommant deux des six places de Chrome.
 */
export function contexteExistant(): AudioContext | null {
  return etat.ctx && etat.ctx.state !== "closed" ? etat.ctx : null;
}

/** Le bus maître, pour qui doit s'y brancher sans passer par une voie. */
export function busMaitre(): GainNode {
  contexte();
  return etat.bus!;
}

/** L'analyseur du bus maître, pour tracer la sortie générale. */
export function analyseur(): AnalyserNode {
  contexte();
  return etat.analyseur!;
}

/**
 * L'entrée de la réverbération partagée.
 *
 * `Prise.depart` suffit à un outil qui envoie TOUTE sa voie à la réverbération.
 * Le rack des vingt moteurs, lui, dose l'envoi **par voix** — Clouds, Zyn,
 * Helm et FluidSynth ont chacun leur propre réglage, et deux notes du même
 * moteur peuvent partir à des niveaux différents. Passer par le départ de voie
 * imposerait un niveau unique à tout le rack.
 *
 * Exposé pour cet usage précis, comme `busMaitre` et `analyseur` le sont déjà.
 * Un outil qui n'a pas ce besoin doit utiliser `Prise.depart` : c'est le
 * chemin qui respecte le muet et le solo de la console.
 */
export function reverbePartagee(): ConvolverNode {
  contexte();
  return etat.reverb!;
}

function instantane(): Voie[] {
  return [...etat.voies.values()].map((v) => ({
    id: v.id,
    nom: v.nom,
    gain: v.gain,
    panoramique: v.panoramique,
    depart: v.depart,
    muet: v.muet,
    solo: v.solo,
  }));
}

function prevenirMixage(): void {
  const voies = instantane();
  for (const auditeur of etat.auditeurs) {
    try {
      auditeur(voies);
    } catch {
      /* l'auditeur gère ses propres erreurs */
    }
  }
}

/**
 * Applique muet et solo à toutes les voies.
 *
 * Le solo est une propriété du mélange, pas d'une voie : dès qu'une voie est en
 * solo, toutes les autres se taisent. Il faut donc relire l'ensemble à chaque
 * changement, d'où cette fonction plutôt qu'un réglage local.
 */
function appliquerCoupures(): void {
  const soloActif = [...etat.voies.values()].some((v) => v.solo);
  for (const v of etat.voies.values()) {
    const audible = v.solo || (!v.muet && !soloActif);
    v.coupure.gain.value = audible ? 1 : 0;
  }
}

/**
 * Ouvre une voie de console.
 *
 *   entree ─► panoramique ─► coupure ─┬─► bus maître
 *                                     └─► depart ─► réverb partagée
 *
 * Le départ est pris **après** la coupure : une voie muette ne doit pas
 * continuer d'alimenter la réverbération, sans quoi son silence reste audible
 * dans la queue.
 */
export function brancher(nom: string): Prise {
  const ctx = contexte();
  etat.compteur += 1;
  const id = `voie-${etat.compteur}`;

  const entree = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const coupure = ctx.createGain();
  const aux = ctx.createGain();
  aux.gain.value = 0;

  entree.connect(pan);
  pan.connect(coupure);
  coupure.connect(etat.bus!);
  coupure.connect(aux);
  aux.connect(etat.reverb!);

  const voie: VoieInterne = {
    id,
    nom,
    gain: 1,
    panoramique: 0,
    depart: 0,
    muet: false,
    solo: false,
    entree,
    pan,
    aux,
    coupure,
    detachee: false,
  };
  etat.voies.set(id, voie);
  prevenirMixage();

  return {
    entree,
    panoramique: pan,
    depart: aux,
    detacher() {
      if (voie.detachee) return;
      voie.detachee = true;
      etat.voies.delete(id);
      // Débrancher dans le sens du signal : un nœud encore relié à la
      // destination garde le graphe vivant.
      try {
        entree.disconnect();
        pan.disconnect();
        coupure.disconnect();
        aux.disconnect();
      } catch {
        /* un nœud déjà débranché n'a rien à réparer */
      }
      appliquerCoupures();
      prevenirMixage();
    },
  };
}

/** Règle le gain d'une voie. Sans effet sur une voie inconnue ou débranchée. */
export function reglerGain(id: string, gain: number): void {
  const v = etat.voies.get(id);
  if (!v) return;
  v.gain = Math.min(2, Math.max(0, gain));
  v.entree.gain.value = v.gain;
  prevenirMixage();
}

/** Règle le panoramique d'une voie, de -1 (gauche) à 1 (droite). */
export function reglerPanoramique(id: string, valeur: number): void {
  const v = etat.voies.get(id);
  if (!v) return;
  v.panoramique = Math.min(1, Math.max(-1, valeur));
  v.pan.pan.value = v.panoramique;
  prevenirMixage();
}

/** Règle le départ vers la réverbération partagée, de 0 à 1. */
export function reglerDepart(id: string, valeur: number): void {
  const v = etat.voies.get(id);
  if (!v) return;
  v.depart = Math.min(1, Math.max(0, valeur));
  v.aux.gain.value = v.depart;
  prevenirMixage();
}

/** Rend une voie muette, ou la rétablit. */
export function reglerMuet(id: string, muet: boolean): void {
  const v = etat.voies.get(id);
  if (!v) return;
  v.muet = muet;
  appliquerCoupures();
  prevenirMixage();
}

/** Met une voie en solo, ou la retire du solo. */
export function reglerSolo(id: string, solo: boolean): void {
  const v = etat.voies.get(id);
  if (!v) return;
  v.solo = solo;
  appliquerCoupures();
  prevenirMixage();
}

/**
 * Abonne à l'état du mixage.
 *
 * Le nouvel abonné est prévenu immédiatement : une console montée après les
 * branchements resterait sinon vide jusqu'au premier réglage.
 */
export function sAbonnerMixage(auditeur: AuditeurMixage): () => void {
  etat.auditeurs.add(auditeur);
  try {
    auditeur(instantane());
  } catch {
    /* idem */
  }
  return () => {
    etat.auditeurs.delete(auditeur);
  };
}

/** Les voies branchées, pour qui a besoin de les lire sans s'abonner. */
export function voies(): Voie[] {
  return instantane();
}

/**
 * Remet le fond de panier à zéro. Réservé aux tests.
 *
 * Le contexte n'est pas fermé — le fermer rendrait les nœuds des tests suivants
 * inutilisables — mais il est oublié, pour que le suivant en fabrique un neuf.
 */
export function reinitialiserPourTests(): void {
  etat.ctx = null;
  etat.bus = null;
  etat.analyseur = null;
  etat.reverb = null;
  etat.retour = null;
  etat.voies.clear();
  etat.auditeurs.clear();
  etat.compteur = 0;
}
