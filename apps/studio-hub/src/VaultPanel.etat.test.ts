import { describe, expect, it } from "vitest";
import {
  categoriesIncompletes,
  ETAT_INITIAL,
  libelleEtat,
  transition,
  verifierSnapshot,
  type EtatOperation,
  type EvenementOperation,
  type PhaseOperation,
} from "./VaultPanel";

/**
 * Machine a etats des operations de coffre.
 *
 * Elle existe parce qu'un echec partiel ne produisait rien d'exploitable :
 * le snapshot incomplet etait supprime, et seule une chaine d'erreur portait
 * « 118/240 fichiers finalises ». Aucune trace de CE qui avait ete copie.
 *
 * Les six phases demandees par la feuille de route, plus `idle` — sans lui,
 * `prepared` devrait mentir au repos.
 */

/** Amene l'etat jusqu'a une phase donnee, par des evenements legaux. */
function jusqua(phase: PhaseOperation, fichiers = 0): EtatOperation {
  let e = ETAT_INITIAL;
  if (phase === "idle") return e;
  e = transition(e, { type: "prepare", operation: "backup", fichiersPrevus: 10, octetsPrevus: 1000 });
  if (phase === "prepared") return e;
  e = transition(e, { type: "demarre" });
  for (let i = 0; i < fichiers; i++) e = transition(e, { type: "fichier-finalise", octets: 100 });
  if (phase === "running") return e;
  if (phase === "failed" || phase === "partial") {
    return transition(e, { type: "echoue", raison: "disque plein" });
  }
  e = transition(e, { type: "copie-terminee" });
  if (phase === "complete") return e;
  return transition(e, { type: "scelle", ok: phase === "verified", verification: "confirmee" });
}

describe("transitions legales", () => {
  it("part au repos", () => {
    expect(ETAT_INITIAL.phase).toBe("idle");
    expect(ETAT_INITIAL.ecritureCommencee).toBe(false);
  });

  it("prepare sans rien ecrire", () => {
    const e = jusqua("prepared");
    expect(e.phase).toBe("prepared");
    // Le point qui compte : renoncer ici laisse la cible intacte.
    expect(e.ecritureCommencee).toBe(false);
    expect(e.fichiersPrevus).toBe(10);
  });

  it("marque l'ecriture des le demarrage", () => {
    expect(jusqua("running").ecritureCommencee).toBe(true);
  });

  it("compte fichiers et octets finalises", () => {
    const e = jusqua("running", 3);
    expect(e.fichiersFinalises).toBe(3);
    expect(e.octetsFinalises).toBe(300);
  });

  it("passe par complete avant verified", () => {
    expect(jusqua("complete").phase).toBe("complete");
    expect(jusqua("verified").phase).toBe("verified");
  });

  it("annule depuis prepared et revient au repos", () => {
    const e = transition(jusqua("prepared"), { type: "annule" });
    expect(e).toEqual(ETAT_INITIAL);
  });

  it("reinitialise depuis n'importe quelle phase terminale", () => {
    for (const p of ["verified", "partial", "failed"] as PhaseOperation[]) {
      expect(transition(jusqua(p, 2), { type: "reinitialise" })).toEqual(ETAT_INITIAL);
    }
  });
});

describe("partial contre failed", () => {
  it("echoue sans aucun fichier finalise donne failed", () => {
    expect(jusqua("failed", 0).phase).toBe("failed");
  });

  it("echoue apres au moins un fichier donne partial", () => {
    // C'est toute la difference : partial signifie qu'il reste quelque chose
    // d'exploitable sur le disque.
    expect(jusqua("partial", 1).phase).toBe("partial");
  });

  it("echouer depuis prepared donne toujours failed", () => {
    // Rien n'a ete ecrit : ce n'est pas un partiel, meme a zero fichier.
    const e = transition(jusqua("prepared"), { type: "echoue", raison: "permission refusee" });
    expect(e.phase).toBe("failed");
    expect(e.ecritureCommencee).toBe(false);
  });

  it("conserve le drapeau d'ecriture meme en failed", () => {
    // Une restauration qui echoue PENDANT le point de retour n'a finalise
    // aucun fichier — mais la cible a bien ete modifiee.
    const e = jusqua("failed", 0);
    expect(e.phase).toBe("failed");
    expect(e.ecritureCommencee).toBe(true);
  });

  it("retient la raison et le fichier interrompu", () => {
    const e = transition(jusqua("running", 2), {
      type: "echoue",
      raison: "volume debranche",
      fichierInterrompu: "synth/user/a.aif",
    });
    expect(e.raison).toBe("volume debranche");
    expect(e.fichierInterrompu).toBe("synth/user/a.aif");
    expect(e.fichiersFinalises).toBe(2); // le decompte survit a l'echec
  });

  it("scelle en echec retombe en partial, pas en failed", () => {
    // Les fichiers sont bons, c'est l'artefact qui ne l'est pas.
    const e = transition(jusqua("complete"), {
      type: "scelle",
      ok: false,
      verification: "snapshot-illisible",
    });
    expect(e.phase).toBe("partial");
    expect(e.verification).toBe("snapshot-illisible");
  });
});

describe("evenements illegaux", () => {
  const TOUS: EvenementOperation[] = [
    { type: "prepare", operation: "backup", fichiersPrevus: 1, octetsPrevus: 1 },
    { type: "demarre" },
    { type: "fichier-finalise", octets: 1 },
    { type: "copie-terminee" },
    { type: "scelle", ok: true, verification: "confirmee" },
    { type: "echoue", raison: "x" },
    { type: "annule" },
  ];

  it("rend l'etat inchange plutot que de lever", () => {
    // Emis depuis un catch, une exception masquerait l'erreur d'origine.
    for (const phase of ["idle", "prepared", "running", "complete", "verified", "partial", "failed"] as PhaseOperation[]) {
      const depart = jusqua(phase, 1);
      for (const ev of TOUS) {
        expect(() => transition(depart, ev)).not.toThrow();
      }
    }
  });

  it("refuse de demarrer sans preparation", () => {
    expect(transition(ETAT_INITIAL, { type: "demarre" }).phase).toBe("idle");
  });

  it("refuse de compter un fichier hors ecriture", () => {
    const e = transition(jusqua("prepared"), { type: "fichier-finalise", octets: 50 });
    expect(e.fichiersFinalises).toBe(0);
  });

  it("refuse de sceller sans avoir termine la copie", () => {
    const e = transition(jusqua("running", 1), { type: "scelle", ok: true, verification: "confirmee" });
    expect(e.phase).toBe("running");
  });

  it("refuse de repreparer une operation en cours", () => {
    // Sans ce garde-fou, un double clic reinitialiserait les compteurs au
    // milieu d'une ecriture.
    const e = transition(jusqua("running", 3), {
      type: "prepare",
      operation: "restore",
      fichiersPrevus: 99,
      octetsPrevus: 99,
    });
    expect(e.phase).toBe("running");
    expect(e.fichiersFinalises).toBe(3);
  });

  it("refuse d'annuler apres la premiere ecriture", () => {
    expect(transition(jusqua("running", 1), { type: "annule" }).phase).toBe("running");
  });
});

describe("libelleEtat", () => {
  it("couvre les sept phases", () => {
    for (const p of ["idle", "prepared", "running", "complete", "verified", "partial", "failed"] as PhaseOperation[]) {
      expect(libelleEtat(p).texte.length).toBeGreaterThan(0);
    }
  });

  it("n'annonce le succes que pour verified", () => {
    // complete n'est pas un succes : le snapshot n'est pas encore scelle.
    const succes = (["idle", "prepared", "running", "complete", "verified", "partial", "failed"] as PhaseOperation[])
      .filter((p) => libelleEtat(p).ton === "succes");
    expect(succes).toEqual(["verified"]);
  });

  it("distingue partial de failed par le ton", () => {
    expect(libelleEtat("partial").ton).toBe("alerte");
    expect(libelleEtat("failed").ton).toBe("erreur");
  });
});

describe("verifierSnapshot", () => {
  const relus = [{ id: "a", fileCount: 10, totalBytes: 1000 }];

  it("confirme un snapshot relisible et conforme", () => {
    expect(verifierSnapshot(relus, "a", 10, 1000)).toEqual({ ok: true, verification: "confirmee" });
  });

  it("signale un snapshot introuvable apres ecriture", () => {
    // Le cas silencieux : les fichiers sont sur le disque, mais le manifeste
    // ne se parse pas, readSnapshots avale l'exception, et le snapshot
    // n'apparait nulle part. L'utilisateur croyait sa sauvegarde faite.
    const r = verifierSnapshot(relus, "inconnu", 10, 1000);
    expect(r.ok).toBe(false);
    expect(r.verification).toBe("snapshot-illisible");
    expect(r.raison).toMatch(/illisible/);
  });

  it("signale un decompte de fichiers divergent", () => {
    const r = verifierSnapshot(relus, "a", 11, 1000);
    expect(r.ok).toBe(false);
    expect(r.verification).toBe("totaux-divergents");
    expect(r.raison).toMatch(/10 fichiers relus pour 11/);
  });

  it("signale un volume d'octets divergent", () => {
    expect(verifierSnapshot(relus, "a", 10, 999).verification).toBe("totaux-divergents");
  });

  it("traite une liste vide comme illisible", () => {
    expect(verifierSnapshot([], "a", 0, 0).verification).toBe("snapshot-illisible");
  });
});

describe("categoriesIncompletes", () => {
  const f = (path: string, category?: string) => ({ path, category }) as any;

  it("ne signale rien quand tout est passe", () => {
    const prevus = [f("tape/a.aif", "tape"), f("drum/b.aif", "drum")];
    expect(categoriesIncompletes(prevus, prevus)).toEqual([]);
  });

  it("nomme la categorie partiellement copiee", () => {
    // « 118 sur 240 » ne dit pas si une categorie entiere manque. C'est
    // pourtant ce qui decide s'il faut tout relancer ou seulement completer.
    const prevus = [f("tape/a.aif", "tape"), f("tape/b.aif", "tape"), f("drum/c.aif", "drum")];
    const finalises = [f("tape/a.aif", "tape"), f("drum/c.aif", "drum")];
    expect(categoriesIncompletes(prevus, finalises)).toEqual(["tape"]);
  });

  it("nomme une categorie totalement absente du resultat", () => {
    const prevus = [f("tape/a.aif", "tape"), f("synth/x.aif", "synth")];
    expect(categoriesIncompletes(prevus, [f("tape/a.aif", "tape")])).toEqual(["synth"]);
  });

  it("retombe sur le premier segment du chemin sans categorie explicite", () => {
    // Les manifestes herites ne portent pas toujours de categorie.
    const prevus = [f("album/a.aif"), f("album/b.aif")];
    expect(categoriesIncompletes(prevus, [f("album/a.aif")])).toEqual(["album"]);
  });

  it("signale toutes les categories quand rien n'a abouti", () => {
    const prevus = [f("tape/a.aif", "tape"), f("drum/b.aif", "drum")];
    expect(categoriesIncompletes(prevus, []).sort()).toEqual(["drum", "tape"]);
  });

  it("accepte des listes vides", () => {
    expect(categoriesIncompletes([], [])).toEqual([]);
  });
});
