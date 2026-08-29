/**
 * Ranger un son dans l'espace de travail, pour de vrai.
 *
 * ## L'écart que ce module ferme
 *
 * `dossierDe()` disait où le son devait aller — `nappes/`, `basses/` — et
 * l'atelier l'affichait. Mais l'enregistrement ouvrait un sélecteur de
 * fichier : c'était à l'utilisateur de naviguer jusqu'au bon dossier, à chaque
 * fois. « Rangement automatique » nommait donc une suggestion.
 *
 * Quand un espace de travail est connecté, on écrit directement au bon
 * endroit, sans rien demander. Le son apparaît alors dans la Bibliothèque
 * sonore, qui lit ce même espace — sinon un son fabriqué ici resterait
 * invisible de l'outil censé les rassembler.
 *
 * ## Où exactement
 *
 * `shared/sounds/prepared/<famille>/`. Les quatre dossiers de la bibliothèque
 * ont un sens : `originals` est ce qu'on a importé, `prepared` ce qu'on a
 * fabriqué ou converti, `packs` les ensembles, `quarantine` ce qui est
 * suspect. Un son de l'atelier est un son préparé.
 *
 * ## Le repli reste
 *
 * Sans espace connecté, l'atelier retombe sur le sélecteur ou le
 * téléchargement. On ne bloque pas la fabrication d'un son parce qu'un dossier
 * n'est pas branché — mais on le dit, plutôt que de laisser croire que c'est
 * rangé.
 */

import {
  hasStoredPermission,
  loadDirectoryHandle,
  WORKSPACE_HANDLE_KEY,
} from "../storage/directoryHandleStore";
import { cheminDe, nomFichierSon, serialiserSon, type SonFabrique } from "./couches";

/** Le sous-dossier de la bibliothèque où atterrissent les sons de l'atelier. */
export const DOSSIER_ATELIER = "prepared";

export type Rangement =
  | { ok: true; chemin: string }
  | { ok: false; raison: "pas-d-espace" | "refuse" | "echec"; message?: string };

/**
 * L'espace de travail, s'il est connecté ET lisible en écriture.
 *
 * La poignée revient d'IndexedDB mais **pas le droit d'écrire** : le
 * redemander exige un geste utilisateur, qu'un appel automatique n'a pas.
 * Adopter la poignée sans vérifier écrirait dans le vide, ou lèverait au
 * premier fichier. Même précaution que `ModuleBibliotheque`.
 */
export async function espaceDeTravail(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const racine = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
    if (!racine) return null;
    if (!(await hasStoredPermission(racine, "readwrite"))) return null;
    return racine;
  } catch {
    return null;
  }
}

/**
 * Descend jusqu'au dossier voulu, en créant ce qui manque.
 *
 * Exporté pour que l'écriture d'un son et celle d'un échantillon exporté
 * partagent exactement ce chemin : deux versions divergeraient au premier
 * dossier renommé.
 */
export async function dossierCible(
  racine: FileSystemDirectoryHandle,
  ...parts: string[]
): Promise<FileSystemDirectoryHandle> {
  let courant = racine;
  for (const part of parts) {
    courant = await courant.getDirectoryHandle(part, { create: true });
  }
  return courant;
}

/**
 * Écrit un contenu dans l'espace, au chemin donné.
 *
 * Relit et compare la taille après écriture. Un `write()` qui rend la main ne
 * garantit pas que les octets sont sur le support — c'est la précaution que
 * le rack prend déjà pour ses exports machine, et le seul endroit où une
 * écriture tronquée est détectable.
 */
async function ecrireDans(
  dossier: FileSystemDirectoryHandle,
  nom: string,
  contenu: string | ArrayBuffer,
): Promise<number> {
  const fichier = await dossier.getFileHandle(nom, { create: true });
  const flux = await fichier.createWritable();
  await flux.write(contenu);
  await flux.close();
  const relu = await fichier.getFile();
  const attendu =
    typeof contenu === "string" ? new Blob([contenu]).size : contenu.byteLength;
  if (relu.size !== attendu) {
    throw new Error(`Écriture tronquée : ${nom} fait ${relu.size} octets au lieu de ${attendu}`);
  }
  return relu.size;
}

/**
 * Range le son dans l'espace de travail.
 *
 * Rend `pas-d-espace` plutôt qu'une erreur quand rien n'est connecté :
 * l'appelant retombe alors sur le sélecteur, ce qui est un chemin normal et
 * non une panne.
 */
export async function rangerSon(son: SonFabrique): Promise<Rangement> {
  const racine = await espaceDeTravail();
  if (!racine) return { ok: false, raison: "pas-d-espace" };
  try {
    const famille = cheminDe(son).split("/")[0];
    const dossier = await dossierCible(racine, "shared", "sounds", DOSSIER_ATELIER, famille);
    await ecrireDans(dossier, nomFichierSon(son.nom), serialiserSon(son));
    return { ok: true, chemin: `shared/sounds/${DOSSIER_ATELIER}/${famille}/${nomFichierSon(son.nom)}` };
  } catch (e) {
    // Une permission retirée entre-temps, un disque plein, un nom refusé par
    // le système : on distingue le refus de l'échec pour que le message le
    // soit aussi.
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      raison: /permission|denied|NotAllowed/i.test(message) ? "refuse" : "echec",
      message,
    };
  }
}

/**
 * Range un échantillon exporté, au format d'une machine.
 *
 * Sous `packs/<famille>/` plutôt que `prepared/` : un fichier destiné à une
 * machine n'est pas un son de travail, c'est un livrable qu'on copiera tel
 * quel sur la carte. Les mélanger obligerait à trier à la main au moment où
 * l'on est pressé.
 */
export async function rangerEchantillon(
  son: SonFabrique,
  nom: string,
  octets: ArrayBuffer,
): Promise<Rangement> {
  const racine = await espaceDeTravail();
  if (!racine) return { ok: false, raison: "pas-d-espace" };
  try {
    const famille = cheminDe(son).split("/")[0];
    const dossier = await dossierCible(racine, "shared", "sounds", "packs", famille);
    await ecrireDans(dossier, nom, octets);
    return { ok: true, chemin: `shared/sounds/packs/${famille}/${nom}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      raison: /permission|denied|NotAllowed/i.test(message) ? "refuse" : "echec",
      message,
    };
  }
}
