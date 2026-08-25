import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { lirePatchImporte } from "./importPatch";
import type { PatchPreset } from "../types/audio";

/**
 * Sauvegarde et relecture d'un lot de patches, en une seule archive ZIP.
 *
 * Le rack savait exporter un patch à la fois. Quelqu'un qui en a trente doit
 * donc cliquer trente fois pour sauvegarder son travail — et sait qu'il
 * cliquera trente fois pour le remettre. En pratique, personne ne sauvegarde,
 * et un vidage du stockage local emporte tout : les patches vivent dans
 * `localStorage`, que le navigateur peut effacer sans prévenir.
 *
 * **Un fichier JSON par patch, pas un gros JSON.** Une archive de fichiers
 * séparés se relit à la main, s'ouvre dans n'importe quel outil, et surtout se
 * relit PARTIELLEMENT : un patch corrompu n'emporte pas les vingt-neuf autres.
 * Un unique document JSON aurait la propriété inverse — une accolade de trop et
 * tout est perdu.
 *
 * Chaque fichier lu repasse par `lirePatchImporte`, la même validation que
 * l'import à l'unité. Une archive est une entrée non fiable comme une autre :
 * elle peut venir d'une autre version, d'un autre poste, ou avoir été retouchée.
 */

/** Dossier interne de l'archive. Range les patches et laisse la racine libre. */
export const DOSSIER_ARCHIVE = "patches";

/**
 * Un nom de patch vers un nom de fichier sûr.
 *
 * Les noms viennent de l'utilisateur : ils contiennent des accents, des
 * espaces, parfois des barres obliques. Une barre oblique creuserait un
 * sous-dossier dans l'archive, et `..` en sortirait — un lecteur d'archive naïf
 * écrirait alors hors du dossier de destination. On ne garde donc qu'une liste
 * blanche de caractères.
 *
 * Un nom entièrement rejeté — que des symboles, ou vide — ne doit pas donner un
 * fichier sans nom : `patch` prend le relais, et l'index qui suit garantit de
 * toute façon l'unicité.
 */
export function nomFichierSur(nom: string, index: number): string {
  const propre = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // les accents, isolés par NFD
    .replace(/[^a-zA-Z0-9._-]+/g, "_")     // tout le reste
    .replace(/^[._]+|[._]+$/g, "")         // ni point ni tiret bas aux bouts
    .slice(0, 60);
  // L'index préfixe plutôt qu'il ne suffixe : deux patches du même nom restent
  // côte à côte au tri alphabétique, et l'ordre d'origine se relit.
  return `${String(index + 1).padStart(3, "0")}_${propre || "patch"}.json`;
}

/**
 * L'archive, prête à télécharger.
 *
 * Le format écrit est celui de l'export à l'unité — `engine` + `parameters` —
 * pour qu'un fichier tiré de l'archive s'importe seul, sans traitement
 * particulier. Deux formats auraient demandé deux lecteurs.
 */
export function construireArchivePatches(patches: readonly PatchPreset[]): Uint8Array {
  const entrees: Record<string, Uint8Array> = {};

  patches.forEach((patch, i) => {
    const contenu = {
      engine: patch.engine,
      name: patch.name,
      category: patch.category,
      tags: patch.tags ?? [],
      created: patch.createdAt ? new Date(patch.createdAt).toISOString() : undefined,
      parameters: { ...patch.params },
    };
    entrees[`${DOSSIER_ARCHIVE}/${nomFichierSur(patch.name, i)}`] =
      strToU8(JSON.stringify(contenu, null, 2));
  });

  return zipSync(entrees, { level: 6 });
}

export type PatchLu = { fichier: string; patch: PatchPreset };
export type EchecLecture = { fichier: string; raison: string };
export type ResultatArchive = { patches: PatchLu[]; echecs: EchecLecture[] };

/**
 * Relit une archive, fichier par fichier.
 *
 * **Ne s'arrête pas au premier échec.** Une archive de trente patches dont un
 * est illisible doit en rendre vingt-neuf, pas zéro : c'est toute la raison
 * d'avoir des fichiers séparés. Les échecs remontent nommés, pour qu'on sache
 * lequel manque plutôt que de découvrir le trou plus tard.
 *
 * Les entrées qui ne sont pas des `.json` sont ignorées sans bruit — un ZIP
 * peut porter des métadonnées de système de fichiers (`__MACOSX`, `.DS_Store`)
 * qui ne sont l'échec de personne.
 */
export function lireArchivePatches(
  octets: Uint8Array,
  clesAutorisees: readonly string[],
): ResultatArchive {
  let entrees: Record<string, Uint8Array>;
  try {
    entrees = unzipSync(octets);
  } catch {
    return { patches: [], echecs: [{ fichier: "", raison: "Ce fichier n'est pas une archive ZIP lisible." }] };
  }

  const patches: PatchLu[] = [];
  const echecs: EchecLecture[] = [];

  for (const fichier of Object.keys(entrees).sort()) {
    if (!fichier.toLowerCase().endsWith(".json")) continue;
    if (fichier.includes("__MACOSX/") || fichier.split("/").pop()?.startsWith(".")) continue;
    // Un dossier apparaît comme une entrée vide : ce n'est pas un patch raté.
    if (entrees[fichier].length === 0) continue;

    let texte: string;
    try {
      texte = strFromU8(entrees[fichier]);
    } catch {
      echecs.push({ fichier, raison: "Contenu illisible (encodage)." });
      continue;
    }

    const lu = lirePatchImporte(texte, clesAutorisees);
    if (!lu.ok) {
      echecs.push({ fichier, raison: lu.raison });
      continue;
    }
    patches.push({ fichier, patch: lu.patch });
  }

  return { patches, echecs };
}
