/**
 * Mémoriser un dossier choisi, d'une visite à l'autre.
 *
 * Un `FileSystemDirectoryHandle` n'est pas sérialisable en JSON, donc
 * `localStorage` ne peut pas le garder. IndexedDB, si — c'est la seule façon
 * standard de se souvenir d'un dossier sans redemander le sélecteur natif à
 * chaque ouverture.
 *
 * Ce paquet existe parce que les deux applications en portaient chacune leur
 * copie. Celle d'`ep133-studio` se trouve **hors du périmètre de `tsconfig`** :
 * une divergence entre les deux — sur du code de permission — n'aurait été vue
 * ni par le typecheck ni par les tests.
 *
 * ## Ce qui reste propre à chaque application
 *
 * Le **nom de la base**. Les deux applications mémorisent des dossiers
 * différents ; les mélanger ferait qu'ouvrir l'une changerait le dossier de
 * l'autre. D'où une fabrique paramétrée plutôt qu'un magasin unique.
 */

// ---------------------------------------------------------------------------
// Magasin de handles
// ---------------------------------------------------------------------------

/**
 * Générique sur le type de handle : `studio-hub` manipule le
 * `FileSystemDirectoryHandle` natif, `ep133-studio` sa propre interface
 * `LocalDirectoryHandle`. IndexedDB stocke l'objet tel quel et se moque du
 * type ; seul l'appelant a besoin de le connaître.
 */
export type MagasinHandles<H> = {
  /** Mémorise un handle sous une clé. Écrase la valeur précédente. */
  sauver(cle: string, handle: H): Promise<void>;
  /** Relit un handle, ou `null` s'il n'y en a pas — ou si IndexedDB est indisponible. */
  charger(cle: string): Promise<H | null>;
  /** Oublie un handle. Ne lève jamais. */
  oublier(cle: string): Promise<void>;
};

export function creerMagasinHandles<H>(nomBase: string, nomMagasin = "directories"): MagasinHandles<H> {
  function ouvrir(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const requete = indexedDB.open(nomBase, 1);
      requete.onupgradeneeded = () => {
        requete.result.createObjectStore(nomMagasin);
      };
      requete.onsuccess = () => resolve(requete.result);
      requete.onerror = () => reject(requete.error);
    });
  }

  return {
    async sauver(cle, handle) {
      const db = await ouvrir();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(nomMagasin, "readwrite");
        tx.objectStore(nomMagasin).put(handle, cle);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        // `onabort` est distinct de `onerror` : un quota dépassé annule la
        // transaction sans passer par onerror, et la promesse resterait
        // suspendue pour toujours.
        tx.onabort = () => reject(tx.error);
      });
      db.close();
    },

    async charger(cle) {
      try {
        const db = await ouvrir();
        const handle = await new Promise<H | null>((resolve, reject) => {
          const r = db.transaction(nomMagasin, "readonly").objectStore(nomMagasin).get(cle);
          r.onsuccess = () => resolve((r.result as H | undefined) ?? null);
          r.onerror = () => reject(r.error);
        });
        db.close();
        return handle;
      } catch {
        // Navigation privée, stockage refusé : pas de dossier mémorisé, ce
        // n'est pas une panne.
        return null;
      }
    },

    async oublier(cle) {
      try {
        const db = await ouvrir();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(nomMagasin, "readwrite");
          tx.objectStore(nomMagasin).delete(cle);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      } catch {
        // Rien à oublier si IndexedDB est indisponible.
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export type ModeAcces = "read" | "readwrite";

type AvecPermission = {
  queryPermission?: (o: { mode: ModeAcces }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: ModeAcces }) => Promise<PermissionState>;
};

/**
 * Interrogation SILENCIEUSE : n'affiche jamais de fenêtre.
 *
 * C'est la seule des deux qu'on puisse appeler au chargement d'une page. Elle
 * répond à « ai-je encore le droit ? » sans rien demander.
 *
 * Un handle relu depuis IndexedDB ne porte PAS la permission avec lui : le
 * navigateur révoque l'accès à la fermeture de l'onglet, sauf si l'utilisateur
 * a explicitement choisi « autoriser à chaque visite ». On récupère donc bien
 * le dossier, mais toute lecture échoue tant que la permission n'a pas été
 * re-accordée.
 */
export async function aLaPermission(handle: unknown, mode: ModeAcces): Promise<boolean> {
  const h = handle as AvecPermission;
  // Navigateur sans l'API de permission : on suppose l'accès accordé plutôt
  // que de bloquer un cas qui fonctionnerait.
  if (!h?.queryPermission) return true;
  try {
    return (await h.queryPermission({ mode })) === "granted";
  } catch {
    return false;
  }
}

/**
 * Redemande la permission — exige un geste utilisateur en cours.
 *
 * Appelée depuis un `useEffect` elle échoue silencieusement : sans activation
 * transitoire, le navigateur résout « prompt » sans rien afficher. C'est
 * exactement ce qui se produisait au rechargement du coffre, où l'appel partait
 * d'un effet et se soldait par « L'accès au dossier a été refusé ».
 *
 * Ne l'appeler que depuis un gestionnaire de clic.
 */
export async function demanderLaPermission(handle: unknown, mode: ModeAcces): Promise<boolean> {
  const h = handle as AvecPermission;
  if (!h?.requestPermission) return true;
  try {
    return (await h.requestPermission({ mode })) === "granted";
  } catch {
    return false;
  }
}
