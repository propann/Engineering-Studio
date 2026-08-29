/**
 * Rendre un son superposé, couche par couche.
 *
 * ## Pourquoi couche par couche
 *
 * L'atelier dessine une onde par couche, dans sa couleur, plus la somme. Un
 * rendu unique du mélange ne permettrait pas de dire laquelle prend toute la
 * place — ce qu'on cherche justement quand on empile.
 *
 * On rend donc chaque couche dans son propre contexte hors ligne, puis on
 * additionne. C'est plus lent qu'un rendu unique, mais un rendu hors ligne va
 * bien plus vite que le temps réel : deux secondes de son mettent quelques
 * dizaines de millisecondes, et l'on répète l'opération à chaque changement de
 * réglage, pas à chaque image.
 *
 * ## Sans effets
 *
 * L'onde montre les COUCHES, pas le résultat final. Les effets vivent sur le
 * bus maître et s'appliquent à tout ce qui joue dans l'atelier : les inclure
 * ici ferait bouger toutes les courbes quand on touche au délai, ce qui
 * n'apprendrait rien sur la couche qu'on règle.
 */

import { construireMoteur } from "./moteurs";
import {
  couchesAudibles,
  decoderEchantillons,
  paramsDeCouche,
  type Couche,
  type SonFabrique,
} from "./couches";

/** Le rendu d'une couche : ses échantillons et sa couleur. */
export type CoucheRendue = {
  id: string;
  nom: string;
  couleur: string;
  echantillons: Float32Array;
};

export type RenduSon = {
  couches: CoucheRendue[];
  /** La somme des couches, telle qu'on l'entendra. */
  somme: Float32Array;
  frequenceEchantillonnage: number;
};

/** La fréquence d'une note MIDI, la 440 au la 3. */
export function frequenceDeNoteMidi(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Ce dont ce module a besoin pour fabriquer un contexte hors ligne.
 *
 * Injectable : `OfflineAudioContext` n'existe pas sous Node, et un test qui
 * voudrait vérifier l'assemblage n'a pas à monter un navigateur.
 */
export type FabriqueHorsLigne = (canaux: number, trames: number, taux: number) => OfflineAudioContext;

function fabriqueParDefaut(): FabriqueHorsLigne | null {
  const C = (globalThis as { OfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext;
  return C ? (canaux, trames, taux) => new C(canaux, trames, taux) : null;
}

/**
 * Rend chaque couche audible, puis leur somme.
 *
 * `secondes` borne le rendu : une couche qui sonnerait plus longtemps est
 * coupée, ce qui est voulu — on dessine une vignette, pas le son entier.
 *
 * Rend `null` faute de contexte hors ligne. L'atelier affiche alors une onde
 * vide plutôt que de refuser de s'ouvrir : on peut régler un son sans le voir.
 */
export async function rendreSon(
  son: SonFabrique,
  secondes = 2,
  taux = 44100,
  fabrique: FabriqueHorsLigne | null = fabriqueParDefaut(),
): Promise<RenduSon | null> {
  if (!fabrique) return null;
  const audibles = couchesAudibles(son);
  const trames = Math.max(1, Math.floor(secondes * taux));
  const freq = frequenceDeNoteMidi(son.note);

  const rendues: CoucheRendue[] = [];
  for (const couche of audibles) {
    try {
      rendues.push({
        id: couche.id,
        nom: couche.nom,
        couleur: couche.couleur,
        echantillons: await rendreUne(couche, freq, trames, taux, fabrique),
      });
    } catch {
      // Une couche qui refuse de se rendre — un moteur retiré, un paramètre
      // hors bornes — ne doit pas emporter les autres : on la saute, et son
      // absence se voit dans la liste des ondes.
    }
  }

  const somme = new Float32Array(trames);
  for (const r of rendues) {
    const n = Math.min(trames, r.echantillons.length);
    for (let i = 0; i < n; i += 1) somme[i] += r.echantillons[i];
  }

  return { couches: rendues, somme, frequenceEchantillonnage: taux };
}

/** Rend une seule couche dans son propre contexte. */
async function rendreUne(
  couche: Couche,
  freq: number,
  trames: number,
  taux: number,
  fabrique: FabriqueHorsLigne,
): Promise<Float32Array> {
  /**
   * `offline`, pas `ctx`.
   *
   * La garde du fond de panier interdit toute sortie directe vers la
   * destination d'un contexte VIVANT, et distingue les deux par le nom de la
   * variable. Un rendu hors ligne a le droit — il n'a ni console ni bus — mais
   * seulement s'il le dit. Le nom porte donc l'information.
   */
  const offline = fabrique(1, trames, taux);
  const sortie = offline.createGain();
  sortie.gain.value = couche.gain;
  sortie.connect(offline.destination);

  if (couche.type === "echantillon") {
    poserEchantillon(offline, couche, sortie, 0);
    const renduEch = await offline.startRendering();
    return renduEch.getChannelData(0);
  }

  const sources: AudioScheduledSourceNode[] = [];
  construireMoteur(
    offline,
    paramsDeCouche(couche),
    freq,
    0,
    {
      trk: (n) => {
        sources.push(n);
        return n;
      },
      noteStop: (n, quand) => {
        try {
          n.stop(quand);
        } catch {
          /* deja arretee */
        }
      },
      holdUntil: () => {},
      // Pas de reverberation : elle vit sur le bus maitre, et l'onde montre
      // la couche, pas le studio.
      reverb: null,
    },
    sortie,
  );

  const rendu = await offline.startRendering();
  return rendu.getChannelData(0);
}

/**
 * Réduit un signal à `largeur` colonnes, en gardant les crêtes.
 *
 * Une onde de 88 200 échantillons dessinée sur 800 pixels doit choisir. Prendre
 * un point sur cent ferait scintiller le tracé et raterait les transitoires —
 * une attaque de percussion tient en quelques échantillons et disparaîtrait.
 *
 * On garde donc le MINIMUM et le MAXIMUM de chaque colonne : c'est ainsi que
 * tous les éditeurs audio dessinent une onde, et c'est ce qui rend une attaque
 * visible.
 */
export function cretes(
  echantillons: Float32Array,
  largeur: number,
): { min: Float32Array; max: Float32Array } {
  const colonnes = Math.max(1, Math.floor(largeur));
  const min = new Float32Array(colonnes);
  const max = new Float32Array(colonnes);
  if (echantillons.length === 0) return { min, max };

  const parColonne = echantillons.length / colonnes;
  for (let c = 0; c < colonnes; c += 1) {
    const debut = Math.floor(c * parColonne);
    const fin = Math.min(echantillons.length, Math.floor((c + 1) * parColonne));
    let bas = Infinity;
    let haut = -Infinity;
    for (let i = debut; i < fin; i += 1) {
      const v = echantillons[i];
      if (v < bas) bas = v;
      if (v > haut) haut = v;
    }
    // Une colonne vide — plus de colonnes que d'échantillons — vaut zéro,
    // pas ±Infinity, qui dessinerait une barre sur toute la hauteur.
    min[c] = Number.isFinite(bas) ? bas : 0;
    max[c] = Number.isFinite(haut) ? haut : 0;
  }
  return { min, max };
}

/** Le niveau crête d'un signal, pour normaliser l'affichage. */
export function crete(echantillons: Float32Array): number {
  let m = 0;
  for (let i = 0; i < echantillons.length; i += 1) {
    const v = Math.abs(echantillons[i]);
    if (v > m) m = v;
  }
  return m;
}

/**
 * Pose un échantillon dans le graphe, accordé.
 *
 * `playbackRate` transpose ET change la durée — c'est le comportement d'un
 * échantillonneur, et c'est celui qu'on veut : monter d'une octave doit
 * raccourcir le son, sinon on entend un étirement, pas une note.
 *
 * Le tampon est créé au taux D'ORIGINE de l'échantillon ; le navigateur
 * rééchantillonne. Le créer au taux du contexte le lirait trop vite ou trop
 * lentement selon la machine — un son juste sur un ordinateur et faux sur un
 * autre, ce qu'on ne diagnostique pas.
 *
 * Exportée pour que l'écoute en direct et le rendu hors ligne partagent
 * exactement ce code : deux copies désaccordées seraient invisibles à la
 * lecture et évidentes à l'oreille.
 */
export function poserEchantillon(
  ctx: BaseAudioContext,
  couche: Couche,
  sortie: AudioNode,
  quand: number,
): AudioBufferSourceNode | null {
  const ech = couche.echantillon;
  if (!ech) return null;
  const donnees = decoderEchantillons(ech.donnees);
  if (donnees.length === 0) return null;

  const tampon = ctx.createBuffer(1, donnees.length, ech.taux || 44100);
  tampon.getChannelData(0).set(donnees);

  const source = ctx.createBufferSource();
  source.buffer = tampon;
  source.playbackRate.value = Math.pow(2, (ech.accord || 0) / 12);
  source.connect(sortie);
  source.start(quand);
  return source;
}
