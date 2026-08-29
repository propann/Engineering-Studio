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

export type Couche = {
  id: string;
  /** Le moteur joué par cette couche. */
  moteur: string;
  /** Nom affiché. Par défaut celui du moteur, modifiable. */
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
  return { version: VERSION_SON, nom, couches: [], note: 60, creeLe: t, modifieLe: t };
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
    moteur,
    nom: nomDe(moteur),
    couleur: prochaineCouleur(son.couches),
    params,
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
    if (typeof c?.moteur !== "string" || !c.moteur) continue;
    couches.push({
      id: typeof c.id === "string" && c.id ? c.id : identifiant(),
      moteur: c.moteur,
      nom: typeof c.nom === "string" && c.nom ? c.nom : nomDe(c.moteur),
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
      creeLe: typeof s.creeLe === "string" ? s.creeLe : t,
      modifieLe: typeof s.modifieLe === "string" ? s.modifieLe : t,
    },
  };
}
