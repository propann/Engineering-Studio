/**
 * Dossiers mémorisés du Hub.
 *
 * L'implémentation vit dans `@studio-hub/fs-handles`, partagée avec
 * `ep133-studio` qui portait jusque-là sa propre copie. Ce fichier ne garde que
 * ce qui est propre au Hub — le nom de la base et les clés — et conserve les
 * noms d'export historiques pour que les pages qui l'utilisent restent
 * inchangées.
 *
 * Le nom de la base reste distinct de celui d'ep133 : les deux applications
 * mémorisent des dossiers différents, et les confondre ferait qu'ouvrir l'une
 * changerait le dossier de l'autre.
 */
import {
  aLaPermission,
  creerMagasinHandles,
  demanderLaPermission,
} from "@studio-hub/fs-handles";

const magasin = creerMagasinHandles<FileSystemDirectoryHandle>("studio-hub-handles");

export const WORKSPACE_HANDLE_KEY = "studio-workspace";

export function saveDirectoryHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  return magasin.sauver(key, handle);
}

export function loadDirectoryHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  return magasin.charger(key);
}

export function forgetDirectoryHandle(key: string): Promise<void> {
  return magasin.oublier(key);
}

/**
 * Interrogation silencieuse : n'affiche jamais de fenêtre, donc appelable au
 * chargement d'une page. C'est la distinction qui compte avec la suivante.
 */
export function hasStoredPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  return aLaPermission(handle, mode);
}

/**
 * Redemande la permission — exige un geste utilisateur en cours. Appelée depuis
 * un effet, elle échoue sans rien afficher.
 */
export function requestStoredPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  return demanderLaPermission(handle, mode);
}
