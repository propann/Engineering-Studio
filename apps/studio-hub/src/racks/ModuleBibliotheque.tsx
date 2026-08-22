import { useEffect, useState } from "react";
import { hasStoredPermission, loadDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";
import { SoundLibraryPanel } from "../SoundLibraryPanel";

/**
 * La bibliothèque sonore, en module du Labo.
 *
 * Le panneau existe et fonctionne — import, empreinte SHA-256, manifeste
 * versionné, favoris, déduplication. Il a déjà sa page ; ce module le rend
 * disponible **sans quitter le Labo**, ce qui est tout l'intérêt : choisir un
 * son pendant qu'on règle un moteur.
 *
 * Le chargement de l'espace de travail reprend le motif éprouvé : la poignée
 * revient d'IndexedDB, mais **pas le droit de lire**. L'adopter sans vérifier
 * afficherait une bibliothèque vide sous un espace annoncé « connecté ».
 */
export default function ModuleBibliotheque() {
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    void (async () => {
      const handle = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
      if (!handle) return;
      if (!(await hasStoredPermission(handle, "readwrite"))) return;
      setWorkspaceHandle(handle);
    })();
  }, []);

  return (
    <SoundLibraryPanel
      workspaceHandle={workspaceHandle}
      onOpenOp1={() => (window as any).navigateMaquette("studio-op1")}
      onOpenEp133={() => (window as any).navigateMaquette("studio-ep133")}
    />
  );
}
