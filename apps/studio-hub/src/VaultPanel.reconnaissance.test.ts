import { describe, expect, it } from "vitest";
import { reconnaitreMachine, type ScanSource } from "./VaultPanel";

/**
 * Reconnaissance du support d'une machine.
 *
 * Le navigateur ne peut PAS enumerer les disques — aucune API ne le permet, et
 * c'est deliberé. Le selecteur natif reste obligatoire ; ce qu'on peut faire,
 * c'est confirmer APRES coup que le dossier choisi ressemble a la machine
 * attendue.
 *
 * Ce que ca evite : designer le mauvais dossier et le decouvrir apres
 * l'ecriture.
 */

const scan = (etats: Record<string, "presente" | "vide" | "absente">): ScanSource => ({
  categories: Object.entries(etats).map(([categorie, etat]) => ({
    categorie: categorie as any,
    etat: etat as any,
    fichiers: etat === "presente" ? 3 : 0,
    octets: etat === "presente" ? 300 : 0,
  })),
  fichiers: 0,
  octets: 0,
});

describe("reconnaitreMachine", () => {
  it("reconnait un OP-1 complet", () => {
    const r = reconnaitreMachine(
      scan({ tape: "presente", album: "presente", drum: "presente", synth: "presente" }),
      "op1"
    );
    expect(r.reconnu).toBe(true);
    expect(r.manquantes).toEqual([]);
    expect(r.libelle).toContain("OP‑1 reconnu");
  });

  it("compte un dossier VIDE comme present", () => {
    // Sur une OP-1, un dossier vide est un emplacement libre, pas une absence.
    // Le traiter comme manquant ferait passer une machine neuve pour un
    // mauvais dossier.
    const r = reconnaitreMachine(scan({ tape: "vide", album: "vide", drum: "vide", synth: "vide" }), "op1");
    expect(r.reconnu).toBe(true);
    expect(r.presentes).toHaveLength(4);
  });

  it("reconnait malgre une categorie manquante, en le disant", () => {
    const r = reconnaitreMachine(
      scan({ tape: "presente", album: "presente", drum: "presente", synth: "absente" }),
      "op1"
    );
    expect(r.reconnu).toBe(true);
    expect(r.manquantes).toEqual(["synth"]);
    expect(r.libelle).toContain("manque synth");
  });

  it("refuse de reconnaitre sur UNE seule categorie", () => {
    // N'importe quel dossier nomme « synth » passerait. Deux, c'est deja une
    // structure.
    const r = reconnaitreMachine(
      scan({ tape: "absente", album: "absente", drum: "absente", synth: "presente" }),
      "op1"
    );
    expect(r.reconnu).toBe(false);
    expect(r.libelle).toContain("Ne ressemble pas");
  });

  it("le dit clairement quand rien ne correspond", () => {
    const r = reconnaitreMachine(
      scan({ tape: "absente", album: "absente", drum: "absente", synth: "absente" }),
      "op1"
    );
    expect(r.reconnu).toBe(false);
    expect(r.libelle).toContain("Aucun dossier");
  });

  it("nomme la bonne machine", () => {
    const s = scan({ projects: "presente", samples: "presente" });
    expect(reconnaitreMachine(s, "ep133").libelle).toContain("EP‑133");
    expect(reconnaitreMachine(s, "op1").libelle).toContain("OP‑1");
  });

  it("SIGNALE sans bloquer", () => {
    // Un dossier de travail personnel est un choix legitime : on previent,
    // on n'interdit pas. Rien dans le retour ne permet de refuser l'operation.
    const r = reconnaitreMachine(scan({ tape: "absente" }), "op1");
    expect(r).not.toHaveProperty("bloquer");
    expect(r.libelle.startsWith("⚠️")).toBe(true);
  });

  it("accepte un scan vide sans lever", () => {
    const r = reconnaitreMachine({ categories: [], fichiers: 0, octets: 0 }, "op1");
    expect(r.reconnu).toBe(false);
    expect(() => r.libelle).not.toThrow();
  });
});
