import { describe, expect, it } from "vitest";
import { aLaPermission, creerMagasinHandles, demanderLaPermission } from "./index";

/**
 * Le droit de lire et d'écrire dans les dossiers de l'utilisateur.
 *
 * Ce paquet n'avait aucun test : 14,3 % de ses fonctions étaient exécutées.
 * C'est le module le plus dangereux du dépôt à laisser sans preuve, parce
 * qu'une erreur ne se voit pas. Elle affiche une bibliothèque vide sous un
 * espace annoncé « connecté » — ou, dans l'autre sens, laisse l'application
 * croire qu'elle a le droit d'écrire sur un dossier machine.
 *
 * Les fonctions de permission acceptent n'importe quel objet portant
 * `queryPermission` / `requestPermission` : elles se testent donc entièrement
 * sans navigateur, en leur passant un faux handle.
 */

/** Un handle qui répond ce qu'on lui demande de répondre. */
function handle(reponse: PermissionState | "jette", methode: "query" | "request" = "query") {
  const cle = methode === "query" ? "queryPermission" : "requestPermission";
  return {
    [cle]: async () => {
      if (reponse === "jette") throw new Error("API indisponible");
      return reponse;
    },
  };
}

describe("aLaPermission — l'interrogation silencieuse", () => {
  it("dit oui quand le navigateur a accordé", async () => {
    expect(await aLaPermission(handle("granted"), "readwrite")).toBe(true);
  });

  it("dit NON sur « prompt »", async () => {
    /**
     * Le cas qui compte le plus.
     *
     * « prompt » signifie « il faudrait redemander », pas « c'est accordé ».
     * Le confondre avec un oui ferait croire à l'application qu'elle a
     * l'accès : elle tenterait de lire, échouerait, et afficherait un dossier
     * vide sous un espace annoncé connecté. C'est le défaut que
     * `ModuleBibliotheque` contourne en revérifiant avant d'adopter une
     * poignée relue d'IndexedDB.
     */
    expect(await aLaPermission(handle("prompt"), "readwrite")).toBe(false);
  });

  it("dit non sur « denied »", async () => {
    expect(await aLaPermission(handle("denied"), "read")).toBe(false);
  });

  it("dit non plutôt que de jeter si l'API échoue", async () => {
    // Une exception qui remonte casserait le chargement de la page entiere.
    expect(await aLaPermission(handle("jette"), "read")).toBe(false);
  });

  it("suppose l'accès accordé quand le navigateur n'a pas l'API", async () => {
    // Choix assume et documente : bloquer un navigateur qui fonctionnerait
    // serait pire que tenter la lecture et echouer proprement.
    expect(await aLaPermission({}, "read")).toBe(true);
    expect(await aLaPermission(null, "read")).toBe(true);
    expect(await aLaPermission(undefined, "readwrite")).toBe(true);
  });

  it("transmet le mode demandé, sans le remplacer", async () => {
    // Interroger « read » alors qu'on veut ecrire rendrait un oui trompeur :
    // le droit de lire n'est pas le droit d'ecrire.
    const vus: string[] = [];
    const espion = { queryPermission: async (o: { mode: string }) => { vus.push(o.mode); return "granted" as PermissionState; } };
    await aLaPermission(espion, "read");
    await aLaPermission(espion, "readwrite");
    expect(vus).toEqual(["read", "readwrite"]);
  });
});

describe("demanderLaPermission — celle qui affiche une fenêtre", () => {
  it("rend vrai seulement sur « granted »", async () => {
    expect(await demanderLaPermission(handle("granted", "request"), "readwrite")).toBe(true);
    expect(await demanderLaPermission(handle("prompt", "request"), "readwrite")).toBe(false);
    expect(await demanderLaPermission(handle("denied", "request"), "readwrite")).toBe(false);
  });

  it("dit non plutôt que de jeter", async () => {
    expect(await demanderLaPermission(handle("jette", "request"), "read")).toBe(false);
  });

  it("suppose accordé sans l'API", async () => {
    expect(await demanderLaPermission({}, "read")).toBe(true);
  });

  it("n'appelle PAS queryPermission", async () => {
    /**
     * Les deux fonctions ont des effets différents : l'une est silencieuse,
     * l'autre ouvre une fenêtre qui exige un geste utilisateur en cours.
     * Les intervertir a déjà coûté — appelée depuis un `useEffect`,
     * `requestPermission` se résout « prompt » sans rien afficher, et le
     * coffre annonçait « L'accès au dossier a été refusé » au rechargement.
     */
    let queryAppele = false;
    const espion = {
      queryPermission: async () => { queryAppele = true; return "denied" as PermissionState; },
      requestPermission: async () => "granted" as PermissionState,
    };
    expect(await demanderLaPermission(espion, "readwrite")).toBe(true);
    expect(queryAppele, "demanderLaPermission a interrogé au lieu de demander").toBe(false);
  });
});

describe("aLaPermission n'appelle PAS requestPermission", () => {
  it("reste silencieuse même si la demande était disponible", async () => {
    // L'inverse du precedent. Une interrogation qui ouvrirait une fenetre ne
    // pourrait plus etre appelee au chargement d'une page.
    let requestAppele = false;
    const espion = {
      queryPermission: async () => "denied" as PermissionState,
      requestPermission: async () => { requestAppele = true; return "granted" as PermissionState; },
    };
    expect(await aLaPermission(espion, "readwrite")).toBe(false);
    expect(requestAppele, "aLaPermission a ouvert une fenêtre").toBe(false);
  });
});

describe("le magasin de handles sans IndexedDB", () => {
  /**
   * Navigation privée, stockage refusé, environnement sans IndexedDB : le
   * magasin doit rendre « pas de dossier mémorisé », pas une panne. C'est
   * exactement le cas de cet environnement de test, où `indexedDB` n'existe
   * pas — la branche de repli s'exerce donc pour de vrai.
   */
  const magasin = creerMagasinHandles<{ nom: string }>("base-de-test");

  it("expose les trois opérations", () => {
    for (const op of ["sauver", "charger", "oublier"] as const) {
      expect(typeof magasin[op], `${op} manquante`).toBe("function");
    }
  });

  it("charger rend null au lieu de jeter", async () => {
    await expect(magasin.charger("dossier-de-travail")).resolves.toBeNull();
  });

  it("oublier ne jette pas non plus", async () => {
    await expect(magasin.oublier("dossier-de-travail")).resolves.toBeUndefined();
  });

  it("LIMITE CONNUE : sauver, lui, laisse remonter l'erreur", async () => {
    /**
     * Asymétrie volontaire, mais qui n'était écrite nulle part : `charger` et
     * `oublier` avalent l'échec — ne rien retrouver n'est pas une panne —
     * tandis que `sauver` le laisse passer. C'est défendable : croire avoir
     * mémorisé un dossier qu'on a perdu est pire que d'échouer bruyamment.
     *
     * Ce test le constate pour que l'appelant sache qu'il doit l'entourer.
     */
    await expect(magasin.sauver("cle", { nom: "x" })).rejects.toBeTruthy();
  });

  it("deux magasins de noms différents ne se mélangent pas", () => {
    // Les deux applications memorisent des dossiers differents. Un magasin
    // unique ferait qu'ouvrir l'une changerait le dossier de l'autre.
    expect(creerMagasinHandles("hub")).not.toBe(creerMagasinHandles("ep133"));
  });
});
