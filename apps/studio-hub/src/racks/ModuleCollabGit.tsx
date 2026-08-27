import { Suspense, lazy } from "react";

/**
 * ModuleCollabGit.tsx — Module Rack pour le Git Musical & Live Jam P2P
 *
 * S'intègre directement dans les racks de studio sans TopBar redondante.
 */
const CollabStudio = lazy(() => import("../pages/CollabStudio"));

export function ModuleCollabGit() {
  return (
    <div className="module-collab-git-rack" style={{ width: "100%", minHeight: "600px" }}>
      <Suspense fallback={<div style={{ padding: "24px", color: "var(--theme-text-muted, #94a3b8)", textAlign: "center" }}>Chargement du Git Musical…</div>}>
        <CollabStudio enModule={true} />
      </Suspense>
    </div>
  );
}

export default ModuleCollabGit;
