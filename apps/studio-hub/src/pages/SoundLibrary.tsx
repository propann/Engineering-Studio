import { useEffect, useState } from "react";
import { DEFAULT_PROFILE_NAME, readProfileName } from "../core/profile";
import { hasStoredPermission, loadDirectoryHandle, WORKSPACE_HANDLE_KEY } from "../core/storage/directoryHandleStore";
import { SoundLibraryPanel } from "../SoundLibraryPanel";
import SoundEditorHub from "./SoundEditorHub";
import { AppShell, PageHeader, StatusBadge, Tabs } from "../ui";

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
  const [activeView, setActiveView] = useState<"library" | "editor">("library");

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
    <AppShell activePage="sound-library" profileName={profileName} className="sound-library-page">
        <PageHeader
          eyebrow="ENGINEERING STUDIO · SOUND LAB"
          title="Bibliothèque sonore"
          description="Catalogue, préparation et écoute pour OP‑1 et EP‑133. Les formats et transferts restent propres à chaque machine."
          onBack={() => (window as any).navigateMaquette("outils")}
          status={<StatusBadge tone={workspaceHandle ? "ready" : "offline"}>{workspaceHandle ? `Dossier ${workspaceHandle.name}` : "Dossier non connecté"}</StatusBadge>}
          action={<Tabs label="Vue de la bibliothèque" items={[{ id: "library", label: "Catalogue" }, { id: "editor", label: "Éditeur" }]} selected={activeView} onChange={setActiveView} />}
        />
        {activeView === "library" ? (
          <SoundLibraryPanel
            workspaceHandle={workspaceHandle}
            onOpenOp1={() => (window as any).navigateMaquette("studio-op1")}
            onOpenEp133={() => (window as any).navigateMaquette("studio-ep133")}
          />
        ) : (
          /* Sans props : SoundEditorHub ne rend plus de TopBar, la nôtre suffit.
             La garantie est structurelle, pas un drapeau — ModulesLabo.test.ts
             refuse tout <TopBar dans ce fichier. */
          <SoundEditorHub />
        )}
    </AppShell>
  );
}
