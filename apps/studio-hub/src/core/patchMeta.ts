/**
 * Favoris et etiquettes des patches.
 *
 * Stockes A PART des patches eux-memes, et c'est la contrainte qui dicte tout
 * le reste : les 91 patches d'usine sont des constantes du source. On ne peut
 * pas y ecrire un favori, et les recopier pour cela creerait un doublon de
 * chaque patch au premier clic sur une etoile.
 *
 * D'ou un dictionnaire indexe par identifiant, fusionne a la lecture. Les
 * patches d'usine restent intacts ; seul ce qui est propre a l'utilisateur est
 * conserve.
 *
 * `PatchSearchEngine.search` lit deja `tags` et `isFavorite` : une fois la
 * fusion faite, la recherche par etiquette et le filtre favoris fonctionnent
 * sans une ligne de plus.
 */

export const PATCH_META_KEY = "studio-hub-patch-meta";

export interface MetaPatch {
  favori?: boolean;
  etiquettes?: string[];
}

export type MetasPatches = Record<string, MetaPatch>;

/** Forme minimale attendue : de quoi fusionner sans dependre du rack. */
interface PatchFusionnable {
  id: string;
  tags?: string[];
  isFavorite?: boolean;
}

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Nettoie ce qui vient du stockage.
 *
 * Le contenu de localStorage n'est pas fiable : une version anterieure, une
 * edition a la main, un autre onglet. Une entree malformee est ecartee plutot
 * que propagee — elle ferait planter la fusion a chaque rendu de la liste.
 */
export function normaliserMetas(brut: unknown): MetasPatches {
  if (!estObjet(brut)) return {};
  const sortie: MetasPatches = {};
  for (const [id, valeur] of Object.entries(brut)) {
    if (!id || !estObjet(valeur)) continue;
    const meta: MetaPatch = {};
    if (valeur.favori === true) meta.favori = true;
    if (Array.isArray(valeur.etiquettes)) {
      const propres = valeur.etiquettes
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean);
      // Doublons ecartes : deux fois la meme etiquette n'apporte rien et
      // s'afficherait deux fois.
      if (propres.length) meta.etiquettes = [...new Set(propres)];
    }
    // Une entree vide ne merite pas d'etre conservee.
    if (meta.favori || meta.etiquettes) sortie[id] = meta;
  }
  return sortie;
}

export function lireMetas(): MetasPatches {
  if (typeof window === "undefined") return {};
  try {
    const brut = window.localStorage.getItem(PATCH_META_KEY);
    return brut ? normaliserMetas(JSON.parse(brut)) : {};
  } catch {
    // Illisible : on repart d'un dictionnaire vide plutot que d'effacer. Les
    // favoris ne valent pas qu'on detruise quoi que ce soit.
    return {};
  }
}

export function ecrireMetas(metas: MetasPatches): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PATCH_META_KEY, JSON.stringify(metas));
  } catch {
    // Stockage plein ou refuse : les favoris restent en memoire pour la session.
  }
}

/** Rend un NOUVEAU dictionnaire — l'appelant tient l'ancien dans un etat React. */
export function basculerFavori(metas: MetasPatches, id: string): MetasPatches {
  if (!id) return metas;
  const actuel = metas[id] ?? {};
  const suivant: MetaPatch = { ...actuel, favori: !actuel.favori };
  const sortie = { ...metas, [id]: suivant };
  if (!suivant.favori && !suivant.etiquettes?.length) delete sortie[id];
  return sortie;
}

export function ajouterEtiquette(metas: MetasPatches, id: string, etiquette: string): MetasPatches {
  const propre = etiquette.trim();
  if (!id || !propre) return metas;
  const actuel = metas[id] ?? {};
  const liste = actuel.etiquettes ?? [];
  // Comparaison insensible a la casse : « Basse » et « basse » sont la meme
  // etiquette pour qui les tape, et deux entrees rendraient le tri inutile.
  if (liste.some((t) => t.toLowerCase() === propre.toLowerCase())) return metas;
  return { ...metas, [id]: { ...actuel, etiquettes: [...liste, propre] } };
}

export function retirerEtiquette(metas: MetasPatches, id: string, etiquette: string): MetasPatches {
  const actuel = metas[id];
  if (!actuel?.etiquettes) return metas;
  const restantes = actuel.etiquettes.filter((t) => t.toLowerCase() !== etiquette.trim().toLowerCase());
  const suivant: MetaPatch = { ...actuel };
  if (restantes.length) suivant.etiquettes = restantes;
  else delete suivant.etiquettes;
  const sortie = { ...metas, [id]: suivant };
  if (!suivant.favori && !suivant.etiquettes) delete sortie[id];
  return sortie;
}

/**
 * Verse les metadonnees dans une liste de patches.
 *
 * Ne modifie jamais les patches recus : les patches d'usine sont des constantes
 * partagees, les muter contaminerait toutes les listes qui les referencent.
 */
export function fusionnerMetas<T extends PatchFusionnable>(patches: T[], metas: MetasPatches): T[] {
  return patches.map((p) => {
    const meta = metas[p.id];
    if (!meta) return p;
    return {
      ...p,
      ...(meta.favori ? { isFavorite: true } : {}),
      ...(meta.etiquettes?.length ? { tags: [...(p.tags ?? []), ...meta.etiquettes] } : {}),
    };
  });
}

/** Toutes les etiquettes posees, triees — pour proposer l'existant. */
export function toutesLesEtiquettes(metas: MetasPatches): string[] {
  const vues = new Set<string>();
  for (const meta of Object.values(metas)) {
    for (const t of meta.etiquettes ?? []) vues.add(t);
  }
  return [...vues].sort((a, b) => a.localeCompare(b));
}
