import { describe, expect, it, vi } from "vitest";
import { hasStoredPermission, requestStoredPermission } from "./directoryHandleStore";

/**
 * Permissions d'un dossier relu depuis IndexedDB.
 *
 * IndexedDB rend le handle, jamais le droit de s'en servir : le navigateur
 * revoque l'acces a la fermeture de l'onglet, sauf choix explicite de
 * l'utilisateur. Les deux fonctions testees ici ne se distinguent que par ce
 * qu'elles ont le droit de faire, et confondre les deux a un cout visible.
 *
 * Ce qui se produisait avant ces garde-fous : BackupLab adoptait le handle
 * relu sans rien verifier, l'interface annoncait « espace connecte », puis
 * l'effet de lecture appelait requestPermission depuis un useEffect — hors de
 * toute activation utilisateur, la ou le navigateur resout « prompt » sans
 * rien afficher. L'utilisateur voyait un espace connecte, un bandeau rouge
 * « L'acces au dossier a ete refuse », et aucune sauvegarde listee.
 */

/**
 * Handle factice. `etat` est ce que rendent les deux methodes natives.
 *
 * Les deux espions sont DISTINCTS a dessein : la premiere version partageait
 * une seule fonction, si bien qu'on ne pouvait plus verifier laquelle des deux
 * avait ete appelee — ce qui est precisement l'invariant qui compte ici.
 */
function handle(etat: PermissionState | "absent", options?: { leve?: boolean }) {
  if (etat === "absent") return {} as unknown as FileSystemDirectoryHandle;
  const reponse = options?.leve
    ? async () => { throw new DOMException("SecurityError"); }
    : async () => etat;
  return {
    name: "espace",
    queryPermission: vi.fn(reponse),
    requestPermission: vi.fn(reponse),
  } as unknown as FileSystemDirectoryHandle;
}

describe("hasStoredPermission — interrogation silencieuse", () => {
  it("confirme un acces encore accorde", async () => {
    expect(await hasStoredPermission(handle("granted"), "readwrite")).toBe(true);
  });

  it("refuse quand l'acces est retombe sur « prompt »", async () => {
    // Le cas normal apres un rechargement : le handle existe, le droit non.
    expect(await hasStoredPermission(handle("prompt"), "readwrite")).toBe(false);
  });

  it("refuse un acces explicitement denie", async () => {
    expect(await hasStoredPermission(handle("denied"), "readwrite")).toBe(false);
  });

  it("n'appelle JAMAIS requestPermission", async () => {
    // Le point central : cette fonction est appelee au chargement d'une page.
    // Si elle demandait quoi que ce soit, elle echouerait silencieusement —
    // et rouvrirait exactement le defaut qu'elle est censee fermer.
    const h = handle("prompt");
    await hasStoredPermission(h, "readwrite");
    expect((h as any).requestPermission).not.toHaveBeenCalled();
    expect((h as any).queryPermission).toHaveBeenCalledOnce();
  });

  it("transmet le mode demande", async () => {
    const h = handle("granted");
    await hasStoredPermission(h, "read");
    expect((h as any).queryPermission).toHaveBeenCalledWith({ mode: "read" });
  });

  it("suppose l'acces accorde si le navigateur n'a pas l'API", async () => {
    // Refuser ici bloquerait un navigateur ou tout fonctionnerait.
    expect(await hasStoredPermission(handle("absent"), "readwrite")).toBe(true);
  });

  it("refuse plutot que de lever quand l'appel echoue", async () => {
    // Appelee depuis un effet : une exception non rattrapee y casserait le
    // rendu de la page.
    expect(await hasStoredPermission(handle("prompt", { leve: true }), "readwrite")).toBe(false);
  });
});

describe("requestStoredPermission — redemande", () => {
  it("rend vrai quand l'utilisateur accorde", async () => {
    expect(await requestStoredPermission(handle("granted"), "readwrite")).toBe(true);
  });

  it("rend faux quand l'utilisateur refuse", async () => {
    expect(await requestStoredPermission(handle("denied"), "readwrite")).toBe(false);
  });

  it("rend faux sur « prompt » — le cas d'un appel hors clic", async () => {
    // Sans activation transitoire, le navigateur resout « prompt » au lieu
    // d'afficher quoi que ce soit. Traiter ce retour comme un succes ferait
    // croire a un acces qu'on n'a pas.
    expect(await requestStoredPermission(handle("prompt"), "readwrite")).toBe(false);
  });

  it("appelle bien requestPermission, pas queryPermission", async () => {
    const h = handle("granted");
    await requestStoredPermission(h, "readwrite");
    expect((h as any).requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });

  it("rend faux plutot que de lever", async () => {
    expect(await requestStoredPermission(handle("prompt", { leve: true }), "readwrite")).toBe(false);
  });
});

/**
 * Le cablage cote pages : lu dans le source, comme le test du rack, parce que
 * l'erreur qu'on veut interdire est un appel au mauvais endroit — invisible
 * au typecheck, et sans effet tant qu'on ne recharge pas la page.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const lire = (p: string) => readFileSync(path.join(DIR, "..", "..", p), "utf-8");

describe("cablage dans les pages", () => {
  it("BackupLab verifie la permission avant d'adopter le dossier", () => {
    const src = lire("pages/BackupLab.tsx");
    expect(src).toContain('await hasStoredPermission(handle, "readwrite")');
    // L'adoption doit venir APRES la verification, sinon elle ne sert a rien.
    expect(src.indexOf("hasStoredPermission")).toBeLessThan(src.indexOf("setWorkspaceHandle(handle)"));
  });

  it("BackupLab ne redemande jamais la permission depuis son effet", () => {
    // C'est la faute d'origine : un requestPermission dans un useEffect ne
    // peut pas aboutir.
    expect(lire("pages/BackupLab.tsx")).not.toContain("requestStoredPermission");
  });

  it("la reprise du dossier memorise n'a lieu que si rien n'est connecte", () => {
    // Le bouton porte « Changer » des qu'un espace est actif : sans cette
    // garde, il reprendrait en silence le dossier deja memorise, c'est-a-dire
    // qu'il refuserait de changer.
    expect(lire("VaultPanel.tsx")).toContain(
      "const memorise = !workspaceHandle ? await loadDirectoryHandle(WORKSPACE_HANDLE_KEY) : null"
    );
  });
});
