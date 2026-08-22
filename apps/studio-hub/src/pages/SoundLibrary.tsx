import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { DEFAULT_PROFILE_NAME, readProfileName } from "../core/profile";
import { hasStoredPermission, loadDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";
import { SoundLibraryPanel } from "../SoundLibraryPanel";

/**
 * Page « Bibliothèque sonore ».
 *
 * `SoundLibraryPanel` — 263 lignes qui importent, hachent, écrivent sur le
 * disque, tiennent un manifeste versionné, déduplaquent et font écouter —
 * n'était monté nulle part. L'entrée « Bibliothèque sonore » du rack principal
 * n'avait aucune route et retombait sur une modale purement descriptive.
 *
 * C'est le même défaut que celui documenté comme corrigé au cas `midi` de
 * `ToolsHub.openTool`, et celui du `SynthEngineDrawer` supprimé en août — à
 * une différence près, décisive : ce panneau-ci **fonctionne**. On le branche
 * plutôt que de le supprimer.
 *
 * Le chargement de l'espace de travail reprend le motif de `BackupLab` :
 * la poignée revient d'IndexedDB, mais **pas le droit de lire**. L'adopter
 * sans vérifier afficherait « espace connecté » au-dessus d'une bibliothèque
 * vide.
 */
export default function SoundLibrary() {
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME);
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => { setProfileName(readProfileName()); }, []);

  useEffect(() => {
    void (async () => {
      const handle = await loadDirectoryHandle(WORKSPACE_HANDLE_KEY);
      if (!handle) return;
      // Interrogation silencieuse : elle n'ouvre aucune fenêtre. La redemande
      // se fait au clic, là où le navigateur l'accepte.
      if (!(await hasStoredPermission(handle, "readwrite"))) return;
      setWorkspaceHandle(handle);
    })();
  }, []);

  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="outils" profileName={profileName} />
      <main className="sound-library-page">
        <header className="sound-library-head">
          <h1>Bibliothèque sonore</h1>
          <p>
            Catalogue commun aux deux machines : import, empreinte SHA‑256,
            étiquettes, favoris et préparation. Les fichiers sont écrits dans
            <code> shared/sounds/</code> de ton espace de travail.
          </p>
        </header>
        <SoundLibraryPanel
          workspaceHandle={workspaceHandle}
          onOpenOp1={() => (window as any).navigateMaquette("studio-op1")}
          onOpenEp133={() => (window as any).navigateMaquette("studio-ep133")}
        />
      </main>
    </div>
  );
}
