/**
 * FileSystemDirectoryHandle n'est pas sérialisable dans localStorage.
 * IndexedDB permet de le conserver entre deux visites du Hub.
 */
const DB_NAME = "studio-hub-handles";
const STORE_NAME = "directories";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDirectoryHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(handle, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
}

export async function loadDirectoryHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function forgetDirectoryHandle(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // IndexedDB peut être indisponible en mode privé : rien à supprimer.
  }
}

export const WORKSPACE_HANDLE_KEY = "studio-workspace";

/**
 * Un handle relu depuis IndexedDB ne porte PAS la permission avec lui.
 *
 * Le navigateur revoque l'acces a la fermeture de l'onglet, sauf si
 * l'utilisateur a explicitement choisi « autoriser a chaque visite ». On
 * recupere donc bien le dossier, mais toute lecture echoue tant que la
 * permission n'a pas ete re-accordee.
 *
 * D'ou ces deux fonctions, et surtout la distinction entre elles : c'est la
 * meme separation que dans apps/ep133-studio, ou elle avait deja ete etablie.
 */

type AvecPermission = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
};

/**
 * Interrogation SILENCIEUSE : n'affiche jamais de fenetre.
 *
 * C'est la seule des deux qu'on puisse appeler au chargement d'une page. Elle
 * repond a « ai-je encore le droit ? » sans rien demander.
 */
export async function hasStoredPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  const h = handle as AvecPermission;
  // Navigateur sans l'API de permission : on suppose l'acces accorde plutot
  // que de bloquer un cas qui fonctionnerait.
  if (!h.queryPermission) return true;
  try {
    return (await h.queryPermission({ mode })) === "granted";
  } catch {
    return false;
  }
}

/**
 * Redemande la permission — exige un geste utilisateur en cours.
 *
 * Appelee depuis un useEffect elle echoue silencieusement : sans activation
 * transitoire, le navigateur resout « prompt » sans rien afficher. C'est
 * exactement ce qui se produisait au rechargement du coffre, ou l'appel
 * partait d'un effet et se soldait par « L'acces au dossier a ete refuse ».
 * Ne l'appeler que depuis un gestionnaire de clic.
 */
export async function requestStoredPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  const h = handle as AvecPermission;
  if (!h.requestPermission) return true;
  try {
    return (await h.requestPermission({ mode })) === "granted";
  } catch {
    return false;
  }
}
