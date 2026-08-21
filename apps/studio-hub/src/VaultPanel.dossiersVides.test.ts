import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collecterDossiersVides } from "./VaultPanel";

/**
 * Dossiers vides d'une arborescence.
 *
 * `collectFiles` descend partout mais ne rapporte que des fichiers : un dossier
 * vide ne produit rien, donc il n'etait ni sauvegarde ni restaure. La structure
 * revenait amputee — et sur une OP-1 ces dossiers ont un sens, ce sont les
 * emplacements libres.
 *
 * La recursion est subtile : un dossier peut contenir des fichiers ET des
 * sous-dossiers vides, et se declarer vide a tort. D'ou ces cas.
 */

/** Arborescence factice depuis une description a plat. */
function arbre(spec: Record<string, "fichier" | "dossier">) {
  const racine: any = { kind: "directory", enfants: new Map() };
  const creer = (chemin: string, kind: "fichier" | "dossier") => {
    const parts = chemin.split("/");
    let noeud = racine;
    parts.forEach((part, i) => {
      const dernier = i === parts.length - 1;
      if (!noeud.enfants.has(part)) {
        noeud.enfants.set(part, {
          kind: dernier && kind === "fichier" ? "file" : "directory",
          enfants: new Map(),
        });
      }
      noeud = noeud.enfants.get(part);
    });
  };
  for (const [chemin, kind] of Object.entries(spec)) creer(chemin, kind);

  const envelopper = (n: any): any => ({
    kind: n.kind,
    async *entries() {
      for (const [nom, enfant] of n.enfants) yield [nom, envelopper(enfant)];
    },
  });
  return envelopper(racine);
}

const vides = (spec: Record<string, "fichier" | "dossier">) =>
  collecterDossiersVides(arbre(spec) as any).then((v) => v.sort());

describe("collecterDossiersVides", () => {
  it("ne rapporte rien quand tout contient des fichiers", async () => {
    expect(await vides({ "tape/a.aif": "fichier", "synth/b.aif": "fichier" })).toEqual([]);
  });

  it("rapporte un dossier vide de premier niveau", async () => {
    expect(await vides({ "tape/a.aif": "fichier", album: "dossier" })).toEqual(["album"]);
  });

  it("rapporte plusieurs dossiers vides", async () => {
    expect(await vides({ "tape/a.aif": "fichier", album: "dossier", drum: "dossier" })).toEqual([
      "album",
      "drum",
    ]);
  });

  it("descend jusqu'au dossier vide le plus profond", async () => {
    // Rapporter « synth » suffirait mal : c'est « synth/user » qui est vide, et
    // le recreer recree « synth » au passage.
    expect(await vides({ "synth/user": "dossier" })).toEqual(["synth/user"]);
  });

  it("ne declare PAS vide un dossier qui contient des fichiers ET un dossier vide", async () => {
    // Le cas qui casse une recursion naive : « synth » a un fichier, donc il
    // n'est pas vide, mais « synth/user » l'est.
    expect(await vides({ "synth/a.aif": "fichier", "synth/user": "dossier" })).toEqual([
      "synth/user",
    ]);
  });

  it("remonte un dossier vide enfoui sous des dossiers pleins", async () => {
    expect(
      await vides({ "op1/synth/a.aif": "fichier", "op1/synth/user": "dossier" })
    ).toEqual(["op1/synth/user"]);
  });

  it("ne se declare pas vide quand un sous-dossier porte des fichiers", async () => {
    expect(await vides({ "op1/synth/a.aif": "fichier" })).toEqual([]);
  });

  it("gere plusieurs branches, pleines et vides", async () => {
    expect(
      await vides({
        "tape/a.aif": "fichier",
        "synth/user": "dossier",
        "drum/user/b.aif": "fichier",
        album: "dossier",
      })
    ).toEqual(["album", "synth/user"]);
  });

  it("accepte une arborescence entierement vide", async () => {
    expect(await vides({ a: "dossier", b: "dossier" })).toEqual(["a", "b"]);
  });

  it("accepte une racine sans rien", async () => {
    expect(await vides({})).toEqual([]);
  });

  it("ne rapporte jamais la racine elle-meme", async () => {
    // Elle n'a pas de chemin : la rapporter donnerait une chaine vide, donc un
    // appel a getDirectoryHandle("") au moment de la recreer.
    const r = await vides({ a: "dossier" });
    expect(r).not.toContain("");
  });
});

/**
 * Cablage : lu dans le source, la fonction seule ne prouve pas qu'on s'en sert.
 */
const SOURCE = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "VaultPanel.tsx"),
  "utf-8"
);

describe("cablage dans le coffre", () => {
  it("la sauvegarde les collecte par categorie", () => {
    expect(SOURCE).toContain("await collecterDossiersVides(categorySource)");
  });

  it("elle les recree DANS le snapshot, pas seulement au manifeste", () => {
    // Un manifeste qui les mentionne sans que le snapshot les porte donnerait
    // une sauvegarde qui ne reflete pas la structure — et un dossier qu'on ne
    // peut pas retrouver en ouvrant le snapshot a la main.
    expect(SOURCE).toContain("await childDirectory(filesRoot, vide, true)");
  });

  it("elle les inscrit au manifeste", () => {
    expect(SOURCE).toContain("...(dossiersVides.length ? { dossiersVides } : {})");
  });

  it("la restauration les recree dans la cible", () => {
    expect(SOURCE).toContain("await childDirectory(restoreTarget, vide, true)");
  });

  it("la restauration respecte les categories choisies", () => {
    // Restaurer « synth » ne doit pas ressusciter les dossiers de « tape ».
    expect(SOURCE).toMatch(/restoreCategories\.includes\(d\.split\("\/"\)\[0\]/);
  });

  it("une sauvegarde de dossiers vides SEULS reste possible", () => {
    // C'est la structure de la machine : la refuser parce qu'elle ne contient
    // aucun fichier reviendrait a perdre precisement ce qu'on cherche a garder.
    expect(SOURCE).toContain("if (!filesToCopy.length && !dossiersVides.length)");
  });

  it("dossiersVides est declare hors du try", () => {
    // Trois collisions de portee ont deja eu lieu dans ce fichier : une
    // variable dont le catch a besoin se declare AVANT le try.
    const i = SOURCE.indexOf("let dossiersVides");
    const j = SOURCE.indexOf("try {", SOURCE.indexOf("async function createBackup"));
    expect(i).toBeGreaterThan(-1);
    expect(i, "declare a l'interieur du try").toBeLessThan(j);
  });
});
