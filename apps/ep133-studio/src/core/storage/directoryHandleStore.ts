import type { LocalDirectoryHandle } from './localFolders';
import {
  aLaPermission,
  creerMagasinHandles,
  demanderLaPermission,
} from '@studio-hub/fs-handles';

/**
 * Dossiers mémorisés de l'EP-133.
 *
 * Un `FileSystemDirectoryHandle` ne tient pas dans `localStorage` (pas
 * sérialisable en JSON) mais IndexedDB sait le stocker tel quel — c'est la
 * seule façon standard de « se souvenir » d'un dossier choisi d'une visite à
 * l'autre sans redemander le sélecteur natif à chaque fois.
 *
 * L'implémentation vit désormais dans `@studio-hub/fs-handles`, partagée avec
 * `studio-hub` qui en portait une copie quasi identique. Le partage compte
 * particulièrement ici : ce répertoire est **hors du périmètre de `tsconfig`**,
 * donc une divergence entre les deux copies — sur du code de permission —
 * n'aurait été vue ni par le typecheck ni par les tests.
 *
 * Ce fichier ne garde que ce qui est propre à l'EP-133 : le nom de la base et
 * les clés. Le nom de la base reste distinct de celui du Hub, sans quoi ouvrir
 * une application changerait le dossier de l'autre.
 */
const magasin = creerMagasinHandles<LocalDirectoryHandle>('ep133-rhythm-hero-handles');

export const SAMPLE_FOLDER_KEY = 'sample-folder';
/** Bibliothèque de sons personnelle de l'utilisateur — distincte du dossier de travail machine
 * (`SAMPLE_FOLDER_KEY`) : c'est la source (ses propres sons rangés), pas la destination (le clone). */
export const LOCAL_LIBRARY_FOLDER_KEY = 'local-library-folder';

export function saveDirectoryHandle(key: string, handle: LocalDirectoryHandle): Promise<void> {
  return magasin.sauver(key, handle);
}

export function loadDirectoryHandle(key: string): Promise<LocalDirectoryHandle | null> {
  return magasin.charger(key);
}

export function forgetDirectoryHandle(key: string): Promise<void> {
  return magasin.oublier(key);
}

/** Vérification silencieuse (pas de prompt) — sûre à appeler automatiquement au chargement d'une page. */
export function hasStoredPermission(
  handle: LocalDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<boolean> {
  return aLaPermission(handle, mode);
}

/** Redemande la permission — nécessite un vrai geste utilisateur (clic), sinon le navigateur rejette silencieusement. */
export function requestStoredPermission(
  handle: LocalDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<boolean> {
  return demanderLaPermission(handle, mode);
}
