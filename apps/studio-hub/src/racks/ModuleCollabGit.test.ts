import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, "..");
const lire = (p: string) => readFileSync(path.join(SRC, p), "utf-8");

const MODULE_COLLAB = lire("racks/ModuleCollabGit.tsx");
const COLLAB_PAGE = lire("pages/CollabStudio.tsx");

describe("ModuleCollabGit & Intégration modulaire au Rack", () => {
  it("CollabStudio accepte la prop enModule et masque sa TopBar en mode rack", () => {
    expect(COLLAB_PAGE).toContain("enModule = false");
    expect(COLLAB_PAGE).toContain("!enModule && <TopBar");
  });

  it("ModuleCollabGit monte CollabStudio avec le drapeau enModule", () => {
    expect(MODULE_COLLAB).toContain("<CollabStudio enModule={true} />");
    expect(MODULE_COLLAB).toContain("lazy(() => import(");
    expect(MODULE_COLLAB).toContain("<Suspense");
  });

  it("CollabStudio dispose du moteur de synthèse WebAudio et du séquenceur 16 pas", () => {
    expect(COLLAB_PAGE).toContain("playSynthesizedSound");
    expect(COLLAB_PAGE).toContain("handleToggleStep");
    expect(COLLAB_PAGE).toContain("handleCaptureJamToCommit");
    expect(COLLAB_PAGE).toContain("Array.from({ length: 16 }");
  });

  it("CollabStudio intègre les 3 vues : Git Musical, Live Jam P2P et Coffre Crypto", () => {
    expect(COLLAB_PAGE).toContain('activeTab === "git"');
    expect(COLLAB_PAGE).toContain('activeTab === "jam"');
    expect(COLLAB_PAGE).toContain('activeTab === "crypto"');
  });
});
