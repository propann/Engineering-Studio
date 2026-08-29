/**
 * Les couches d'un son fabriqué ici.
 *
 * ## Ce qu'est une couche
 *
 * Un moteur, ses réglages, un gain, une couleur. Un son est une pile de
 * couches jouées ensemble : une basse Plaits sous une nappe Rings, un grain de
 * Clouds par-dessus. C'est ce que le rack faisait déjà — mais avec une simple
 * liste d'identifiants de patches, sans couleur, sans réglages propres, sans
 * moyen d'en retirer une autrement qu'en la décochant dans une autre fenêtre.
 *
 * ## Pourquoi la couleur est dans le modèle
 *
 * Parce qu'elle doit être la MÊME dans la liste, sur l'onde et sur la carte de
 * réglages. Une couleur attribuée par l'affichage divergerait dès qu'on
 * réordonne : la troisième couche changerait de teinte en montant d'un rang,
 * et l'on ne saurait plus quelle courbe appartient à quoi.
 *
 * Elle est donc posée à la création, et ne bouge plus.
 *
 * ## Tout est pur ici
 *
 * Aucun nœud audio, aucun React. Ce module décrit un son ; le rendre est le
 * travail de `moteurs.ts`, l'afficher celui de l'atelier. C'est ce qui permet
 * de vérifier le rangement, la sérialisation et l'attribution des couleurs
 * sans monter une page.
 */

import { PARAMS_DEFAUT, type ParamsMoteurs } from "./moteurs";
import { nomDe } from "./catalogueParams";

/**
 * La palette des couches.
 *
 * Huit teintes, choisies pour rester distinctes l'une de l'autre sur fond
 * sombre ET pour qui ne distingue pas le rouge du vert : les deux formes de
 * daltonisme les plus répandues confondent des rouges et des verts de même
 * clarté. On fait donc varier la CLARTÉ autant que la teinte, ce qui garde les
 * couches lisibles même en niveaux de gris.
 */
export const PALETTE_COUCHES: ReadonlyArray<string> = [
  "#7cf07c", // vert phosphore — la teinte de l'atelier
  "#ff5fa2", // magenta
  "#ffc14d", // ambre
  "#5fd0ff", // cyan
  "#c89bff", // violet
  "#ff8a5f", // orange
  "#9ee7c1", // menthe
  "#f0e05f", // jaune
];

/**
 * Un échantillon posé dans une couche.
 *
 * Les données sont DANS le son, pas référencées : un fichier qui pointe vers
 * `~/samples/kick.wav` cesse de fonctionner dès qu'on l'envoie à quelqu'un ou
 * qu'on range le dossier. Un son fabriqué ici doit rester entier.
 *
 * Le prix est la taille : deux secondes de mono en 16 bits font 176 ko, un
 * tiers de plus une fois en base64. C'est acceptable pour un son, ça ne le
 * serait pas pour un morceau — et l'atelier fabrique des sons.
 */
export type Echantillon = {
  /** Nom du fichier d'origine, pour s'y retrouver. */
  fichier: string;
  /** PCM 16 bits mono, encodé en base64. */
  donnees: string;
  /** Fréquence d'échantillonnage d'origine. */
  taux: number;
  /** Transposition en demi-tons, pour accorder l'échantillon aux moteurs. */
  accord: number;
  /**
   * La découpe, en fractions de 0 à 1.
   *
   * En fractions et non en échantillons : un son importé est rééchantillonné
   * au taux du contexte, qui change d'une machine à l'autre. Des bornes en
   * échantillons désigneraient un autre endroit du son sur un ordinateur en
   * 48 kHz que sur un en 44,1 — la découpe se déplacerait toute seule.
   */
  debut?: number;
  fin?: number;
};

export type Couche = {
  id: string;
  /**
   * Ce que joue la couche : un moteur du rack, ou un échantillon.
   *
   * Le champ existe pour que la lecture soit explicite. Se fier à la présence
   * de `echantillon` marcherait, mais un `type` se lit dans une liste, se
   * filtre, et se sérialise sans ambiguïté.
   */
  type: "moteur" | "echantillon";
  /** Le moteur joué. Vide pour une couche d'échantillon. */
  moteur: string;
  /** L'échantillon joué. Absent pour une couche de moteur. */
  echantillon?: Echantillon;
  /** Nom affiché. Par défaut celui du moteur ou du fichier, modifiable. */
  nom: string;
  couleur: string;
  /** Réglages propres à cette couche. */
  params: Partial<ParamsMoteurs>;
  /** Niveau relatif, de 0 à 2. */
  gain: number;
  muette: boolean;
};

/** Un son complet : des couches, un nom, une origine. */
export type SonFabrique = {
  version: number;
  nom: string;
  couches: Couche[];
  /** Note de référence pour l'écoute et le rendu, en MIDI. */
  note: number;
  /**
   * Les balises du son.
   *
   * Même vocabulaire que les étiquettes de patches (`core/patchMeta.ts`) : un
   * son fabriqué ici et un patch d'usine doivent se chercher de la même façon,
   * sinon on tient deux classements pour une seule bibliothèque.
   */
  etiquettes: string[];
  creeLe: string;
  modifieLe: string;
};

export const VERSION_SON = 1;

function identifiant(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Contexte non sécurisé : une clé suffisante ici, rien ne quitte l'atelier.
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * La couleur à donner à une nouvelle couche.
 *
 * On prend la première teinte NON UTILISÉE plutôt que la suivante dans
 * l'ordre. Retirer la deuxième couche puis en ajouter une autre redonne ainsi
 * la teinte libérée, au lieu de sauter à la neuvième et de tourner sur une
 * couleur déjà prise.
 *
 * Au-delà de huit couches, on recycle : c'est le rang qui distingue, et huit
 * couches simultanées relèvent déjà d'un autre outil.
 */
export function prochaineCouleur(couches: ReadonlyArray<Couche>): string {
  const prises = new Set(couches.map((c) => c.couleur));
  return (
    PALETTE_COUCHES.find((c) => !prises.has(c)) ??
    PALETTE_COUCHES[couches.length % PALETTE_COUCHES.length]
  );
}

/** Fabrique un son vide. */
export function nouveauSon(
  nom = "Sans titre",
  maintenant: () => string = () => new Date().toISOString(),
): SonFabrique {
  const t = maintenant();
  return { version: VERSION_SON, nom, couches: [], note: 60, etiquettes: [], creeLe: t, modifieLe: t };
}

/** Ajoute une couche pour un moteur. */
export function ajouterCouche(
  son: SonFabrique,
  moteur: string,
  params: Partial<ParamsMoteurs> = {},
  maintenant: () => string = () => new Date().toISOString(),
): SonFabrique {
  const couche: Couche = {
    id: identifiant(),
    type: "moteur",
    moteur,
    nom: nomDe(moteur),
    couleur: prochaineCouleur(son.couches),
    params,
    gain: 1,
    muette: false,
  };
  return { ...son, couches: [...son.couches, couche], modifieLe: maintenant() };
}

/**
 * Ajoute une couche d'échantillon.
 *
 * Elle porte les mêmes attributs qu'une couche de moteur — couleur, gain,
 * muet, rang — pour que la pile reste homogène. Ce qui change est ce qui
 * sonne, pas la façon dont on la manipule.
 */
export function ajouterEchantillon(
  son: SonFabrique,
  echantillon: Echantillon,
  maintenant: () => string = () => new Date().toISOString(),
): SonFabrique {
  const couche: Couche = {
    id: identifiant(),
    type: "echantillon",
    moteur: "",
    echantillon,
    // Le nom du fichier sans son extension : « kick-808.wav » devient
    // « kick-808 », qui tient dans la liste.
    nom: echantillon.fichier.replace(/\.[a-z0-9]+$/i, "") || "échantillon",
    couleur: prochaineCouleur(son.couches),
    params: {},
    gain: 1,
    muette: false,
  };
  return { ...son, couches: [...son.couches, couche], modifieLe: maintenant() };
}

/** Retire une couche. Une liste inchangée signifie que l'identifiant est inconnu. */
export function retirerCouche(
  son: SonFabrique,
  id: string,
  maintenant: () => string = () => new Date().toISOString(),
): SonFabrique {
  const couches = son.couches.filter((c) => c.id !== id);
  if (couches.length === son.couches.length) return son;
  return { ...son, couches, modifieLe: maintenant() };
}

/** Modifie une couche. Les champs absents restent inchangés. */
export function modifierCouche(
  son: SonFabrique,
  id: string,
  changements: Partial<Omit<Couche, "id">>,
  maintenant: () => string = () => new Date().toISOString(),
): SonFabrique {
  let touchee = false;
  const couches = son.couches.map((c) => {
    if (c.id !== id) return c;
    touchee = true;
    return { ...c, ...changements, params: { ...c.params, ...(changements.params ?? {}) } };
  });
  return touchee ? { ...son, couches, modifieLe: maintenant() } : son;
}

/**
 * Déplace une couche d'un rang.
 *
 * L'ordre compte à l'affichage, pas au son : toutes les couches jouent
 * ensemble. On le garde quand même — c'est ainsi qu'on range une pile, et
 * l'onde superposée se lit mieux quand les graves sont en bas.
 */
export function deplacerCouche(son: SonFabrique, id: string, delta: number): SonFabrique {
  const i = son.couches.findIndex((c) => c.id === id);
  if (i < 0) return son;
  const j = Math.min(son.couches.length - 1, Math.max(0, i + delta));
  if (i === j) return son;
  const couches = [...son.couches];
  const [prise] = couches.splice(i, 1);
  couches.splice(j, 0, prise);
  return { ...son, couches };
}

/**
 * Les réglages complets d'une couche, prêts pour `construireMoteur`.
 *
 * Les défauts d'abord, puis ce que la couche a posé. Sans les défauts, un
 * moteur recevrait des paramètres absents et lirait `undefined` là où il
 * attend un nombre — `setValueAtTime(undefined)` lève.
 */
export function paramsDeCouche(couche: Couche): ParamsMoteurs {
  return {
    ...PARAMS_DEFAUT,
    ...couche.params,
    activeEngine: couche.moteur as ParamsMoteurs["activeEngine"],
  } as ParamsMoteurs;
}

/** Les couches qui doivent sonner : non muettes, gain non nul. */
export function couchesAudibles(son: SonFabrique): Couche[] {
  return son.couches.filter((c) => !c.muette && c.gain > 0);
}

/* ======================================================================== *
 * RANGEMENT AUTOMATIQUE
 * ======================================================================== */

/**
 * Les familles de rangement, et les moteurs qui y tombent.
 *
 * Le classement suit ce qu'on CHERCHE, pas la technologie : on cherche « une
 * basse », pas « un modèle physique ». Un moteur peut faire plusieurs choses —
 * Plaits fait des basses et des nappes — d'où le second critère plus bas, la
 * hauteur de la note.
 */
export const FAMILLES: ReadonlyArray<{ dossier: string; moteurs: ReadonlyArray<string> }> = [
  { dossier: "rythmes", moteurs: ["drum_machine"] },
  { dossier: "basses", moteurs: ["open303", "amsynth"] },
  { dossier: "claviers", moteurs: ["organ_drawbars", "fluidsynth", "dexed_fm"] },
  { dossier: "nappes", moteurs: ["string_machine", "mi_clouds", "zynaddsubfx"] },
  { dossier: "percussions", moteurs: ["mi_elements", "mi_rings"] },
  { dossier: "leads", moteurs: ["mi_plaits", "mi_braids", "surge_xt", "helm", "pl_synth"] },
  { dossier: "textures", moteurs: ["faust_dsp", "amy_engine", "vocoder_dsp", "phase_distortion"] },
];

/**
 * Où ranger ce son.
 *
 * Deux critères, dans cet ordre :
 *
 * 1. **La famille de la première couche audible.** C'est elle qui porte le
 *    caractère du son ; les suivantes l'habillent.
 * 2. **La hauteur**, quand la famille ne tranche pas. Un Plaits joué en dessous
 *    de do2 est une basse, quelle que soit la table à laquelle il appartient.
 *
 * Rend `divers` plutôt que rien : un son sans couche audible existe quand même,
 * et le perdre dans un dossier sans nom serait pire que de le ranger largement.
 */
export function dossierDe(son: SonFabrique): string {
  /**
   * Une balise qui nomme une famille l'emporte sur tout.
   *
   * C'est le seul moyen de contredire le classement automatique quand il se
   * trompe, et il se trompera : un Plaits reglé en nappe reste rangé en lead
   * tant que personne ne le dit. Poser la balise « nappes » suffit.
   */
  const parBalise = FAMILLES.find((f) => son.etiquettes?.includes(f.dossier));
  if (parBalise) return parBalise.dossier;

  const audibles = couchesAudibles(son);
  if (audibles.length === 0) return "divers";
  const premiere = audibles[0];

  // Une note grave l'emporte sur la famille : c'est ce qu'on entend d'abord.
  if (son.note < 48 && premiere.moteur !== "drum_machine") return "basses";

  const famille = FAMILLES.find((f) => f.moteurs.includes(premiere.moteur));
  return famille?.dossier ?? "divers";
}

/**
 * Un nom de fichier sûr, dérivé du nom du son.
 *
 * Les caractères interdits varient selon les systèmes ; on garde l'union la
 * plus stricte. Même règle que `projets.ts` — deux conventions de nommage dans
 * le même atelier finiraient par diverger.
 */
export function nomFichierSon(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
  return `${base || "sans-titre"}.son.json`;
}

/** Le chemin de rangement complet : `nappes/ma-nappe.son.json`. */
export function cheminDe(son: SonFabrique): string {
  return `${dossierDe(son)}/${nomFichierSon(son.nom)}`;
}

/* ======================================================================== *
 * SAUVEGARDE
 * ======================================================================== */

/** Le texte à écrire. Indenté : un son se relit et se compare dans git. */
export function serialiserSon(son: SonFabrique): string {
  return `${JSON.stringify(son, null, 2)}\n`;
}

/**
 * Relit un son.
 *
 * Ne lève jamais : un fichier abîmé rend un message, pas une page blanche.
 * Chaque couche est revalidée séparément — une seule ligne corrompue ne doit
 * pas emporter les autres.
 */
export function analyserSon(contenu: string): { son: SonFabrique } | { erreur: string } {
  const texte = contenu.trim();
  if (!texte) return { erreur: "Le fichier est vide." };
  let lu: unknown;
  try {
    lu = JSON.parse(texte);
  } catch {
    return { erreur: "Ce fichier n'est pas un son lisible." };
  }
  const s = lu as Partial<SonFabrique>;
  if (!Array.isArray(s?.couches)) return { erreur: "Ce fichier ne contient aucune couche." };
  if (typeof s.version === "number" && s.version > VERSION_SON) {
    return {
      erreur:
        `Ce son est en version ${s.version}, l'atelier lit jusqu'à ${VERSION_SON}. ` +
        "Mets le Hub à jour avant de l'ouvrir.",
    };
  }
  const t = new Date().toISOString();
  const couches: Couche[] = [];
  for (const brut of s.couches) {
    const c = brut as Partial<Couche>;

    /**
     * Deux formes valides, et une seule cohérence à vérifier.
     *
     * Une couche de moteur doit nommer son moteur ; une couche d'échantillon
     * doit porter ses données. Une couche qui ne fait ni l'un ni l'autre est
     * écartée — c'est du bruit dans le fichier, et l'admettre donnerait une
     * ligne muette dans la pile que personne ne saurait expliquer.
     *
     * Le champ `type` peut manquer : les premiers sons enregistrés par
     * l'atelier n'en avaient pas. On le déduit alors de ce qui est présent.
     */
    const ech = c.echantillon;
    const estEchantillon =
      c.type === "echantillon" ||
      (!c.type && !!ech && typeof ech.donnees === "string");
    if (estEchantillon) {
      if (!ech || typeof ech.donnees !== "string" || !ech.donnees) continue;
    } else if (typeof c?.moteur !== "string" || !c.moteur) {
      continue;
    }

    couches.push({
      id: typeof c.id === "string" && c.id ? c.id : identifiant(),
      type: estEchantillon ? "echantillon" : "moteur",
      moteur: estEchantillon ? "" : (c.moteur as string),
      echantillon: estEchantillon
        ? {
            fichier: typeof ech!.fichier === "string" ? ech!.fichier : "échantillon",
            donnees: ech!.donnees,
            taux:
              typeof ech!.taux === "number" && ech!.taux > 0 ? ech!.taux : 44100,
            // Un accord absurde rendrait l'échantillon inaudible : deux
            // octaves de part et d'autre suffisent largement.
            accord:
              typeof ech!.accord === "number" && Number.isFinite(ech!.accord)
                ? Math.min(24, Math.max(-24, ech!.accord))
                : 0,
            ...bornesSaines(ech!.debut, ech!.fin),
          }
        : undefined,
      nom:
        typeof c.nom === "string" && c.nom
          ? c.nom
          : estEchantillon
            ? (ech!.fichier ?? "échantillon")
            : nomDe(c.moteur as string),
      // Une couleur hors palette est acceptée — on ne va pas refuser un son
      // parce que quelqu'un a mis du bleu roi — mais une couleur absente est
      // recalculée pour que la liste reste lisible.
      couleur:
        typeof c.couleur === "string" && /^#[0-9a-f]{3,8}$/i.test(c.couleur)
          ? c.couleur
          : prochaineCouleur(couches),
      params: c.params && typeof c.params === "object" ? c.params : {},
      gain: typeof c.gain === "number" && Number.isFinite(c.gain) ? Math.min(2, Math.max(0, c.gain)) : 1,
      muette: c.muette === true,
    });
  }
  return {
    son: {
      version: VERSION_SON,
      nom: typeof s.nom === "string" && s.nom.trim() ? s.nom : "Sans titre",
      couches,
      note:
        typeof s.note === "number" && Number.isFinite(s.note)
          ? Math.min(127, Math.max(0, Math.round(s.note)))
          : 60,
      // Chaque etiquette est nettoyee separement : une seule abimee ne doit
      // pas faire perdre les autres.
      etiquettes: Array.isArray(s.etiquettes)
        ? [...new Set(
            s.etiquettes
              .filter((e): e is string => typeof e === "string")
              .map((e) => e.trim().toLowerCase())
              .filter((e) => e.length > 0 && e.length <= 30),
          )]
        : [],
      creeLe: typeof s.creeLe === "string" ? s.creeLe : t,
      modifieLe: typeof s.modifieLe === "string" ? s.modifieLe : t,
    },
  };
}

/**
 * Valide une découpe.
 *
 * Une fin avant le début donnerait une durée négative : `createBufferSource`
 * l'accepte sans broncher et ne joue rien, ce qu'on prendrait pour un
 * échantillon muet. On les remet donc dans l'ordre plutôt que de refuser.
 */
export function bornesSaines(
  debut: unknown,
  fin: unknown,
): { debut: number; fin: number } {
  const d = typeof debut === "number" && Number.isFinite(debut) ? Math.min(1, Math.max(0, debut)) : 0;
  const f = typeof fin === "number" && Number.isFinite(fin) ? Math.min(1, Math.max(0, fin)) : 1;
  return d <= f ? { debut: d, fin: f } : { debut: f, fin: d };
}

/* ======================================================================== *
 * ENCODAGE DES ECHANTILLONS
 *
 * Un son fabriqué ici doit rester entier : les données audio sont DANS le
 * fichier, pas référencées. Deux conversions, l'une inverse de l'autre, et
 * c'est le seul endroit du dépôt où une erreur d'un demi-bit se traduirait
 * par un son déformé au rechargement.
 * ======================================================================== */

/**
 * Convertit des échantillons flottants en PCM 16 bits, encodé en base64.
 *
 * Le seuil est asymétrique — −32768 à +32767 — parce que le complément à deux
 * l'est. Multiplier par 32768 dans les deux sens ferait déborder les crêtes
 * positives d'un pas, ce qui s'entend comme un claquement sur un son saturé.
 */
export function encoderEchantillons(source: Float32Array): string {
  const pcm = new Int16Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const v = Math.max(-1, Math.min(1, source[i]));
    pcm[i] = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
  }
  const octets = new Uint8Array(pcm.buffer);
  // Par tranches : `String.fromCharCode(...tableau)` dépasse la taille de pile
  // au-delà de quelques dizaines de milliers d'arguments, et deux secondes de
  // son en font cent quatre-vingt mille.
  let binaire = "";
  const TRANCHE = 0x8000;
  for (let i = 0; i < octets.length; i += TRANCHE) {
    binaire += String.fromCharCode(...octets.subarray(i, i + TRANCHE));
  }
  return typeof btoa === "function" ? btoa(binaire) : "";
}

/**
 * L'inverse. Rend un tableau vide plutôt que de lever sur une donnée abîmée :
 * une couche muette se remarque et se corrige, une page blanche non.
 */
export function decoderEchantillons(base64: string): Float32Array {
  try {
    if (typeof atob !== "function" || !base64) return new Float32Array(0);
    const binaire = atob(base64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
    // Un nombre impair d'octets ne fait pas un entier 16 bits : on tronque
    // plutôt que de laisser `Int16Array` lever sur un tampon mal aligné.
    const pcm = new Int16Array(octets.buffer, 0, Math.floor(octets.length / 2));
    const sortie = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i += 1) {
      sortie[i] = pcm[i] < 0 ? pcm[i] / 32768 : pcm[i] / 32767;
    }
    return sortie;
  } catch {
    return new Float32Array(0);
  }
}
