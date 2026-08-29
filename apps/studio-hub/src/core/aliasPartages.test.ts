import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Les alias `@studio-hub/*` doivent etre declares partout ou ils sont compiles.
 *
 * ## Le defaut que ce test empeche
 *
 * Les deux studios — `apps/op1-studio` et `apps/ep133-studio` — declarent
 * `"@studio-hub/core/*": ["../studio-hub/src/core/*"]` dans leur tsconfig.
 * Leur typecheck compile donc les sources du Hub, y compris des fichiers
 * qu'ils n'importent pas eux-memes.
 *
 * Consequence : ajouter un import `@studio-hub/quelque-chose` dans le Hub
 * casse le typecheck des DEUX studios, meme si le Hub compile parfaitement.
 *
 * C'est arrive le 2026-08-29. La migration du rack sur `@studio-hub/rack-bus`
 * passait en local — vitest et le tsconfig du Hub ont l'alias — et le CI est
 * reste rouge sur deux commits : « OP-1 Studio Checks » et « EP-133 Studio
 * Checks » echouaient sur `Cannot find module '@studio-hub/rack-bus'`.
 *
 * ## Pourquoi ici
 *
 * La suite du Hub tourne a chaque commit ; les typechecks des studios sont
 * deux jobs CI separes qu'on ne lance pas en local. Verifier la coherence
 * depuis le Hub fait tomber le probleme la ou on le verra.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(DIR, "..", "..", "..", "..");

/**
 * Retire les commentaires d'un tsconfig, en respectant les chaines.
 *
 * Un premier jet retirait les blocs par expression reguliere. Il coupait le
 * fichier en deux : `"@studio-hub/core/*"` contient `/*`, que le motif prend
 * pour l'ouverture d'un commentaire. Tous les alias en glob sont concernes —
 * c'est-a-dire ceux qu'on veut justement lire.
 *
 * On parcourt donc caractere par caractere en suivant l'etat « dans une
 * chaine ou non ».
 */
function sansCommentaires(brut: string): string {
  let sortie = "";
  let dansChaine = false;
  let echappe = false;
  for (let i = 0; i < brut.length; i += 1) {
    const c = brut[i];
    if (dansChaine) {
      sortie += c;
      if (echappe) echappe = false;
      else if (c === "\\") echappe = true;
      else if (c === '"') dansChaine = false;
      continue;
    }
    if (c === '"') { dansChaine = true; sortie += c; continue; }
    if (c === "/" && brut[i + 1] === "/") {
      while (i < brut.length && brut[i] !== "\n") i += 1;
      sortie += "\n";
      continue;
    }
    if (c === "/" && brut[i + 1] === "*") {
      i += 2;
      while (i < brut.length && !(brut[i] === "*" && brut[i + 1] === "/")) i += 1;
      i += 1;
      continue;
    }
    sortie += c;
  }
  return sortie;
}

/** Lit un tsconfig avec commentaires et rend ses `paths`. */
function alias(fichier: string): Record<string, string[]> {
  const brut = sansCommentaires(readFileSync(path.join(RACINE, fichier), "utf-8"));
  const lu = JSON.parse(brut) as { compilerOptions?: { paths?: Record<string, string[]> } };
  return lu.compilerOptions?.paths ?? {};
}

/**
 * Les alias `@studio-hub/*` que la racine declare.
 *
 * C'est la reference. On ne se fonde PAS sur ce que les sources du Hub
 * importent aujourd'hui : ce que chaque studio finit par compiler depend de
 * son graphe d'import, qui change a chaque fichier ajoute. Un alias importe
 * par un fichier qu'aucun studio n'atteint encore le sera peut-etre demain,
 * et la panne arriverait alors sans qu'on ait touche aux configurations.
 *
 * Garder les trois jeux identiques est le seul invariant stable. Il coute
 * trois lignes par paquet ajoute, et evite un CI rouge qu'on ne reproduit pas
 * en local.
 */
function referenceRacine(): string[] {
  return Object.keys(alias("tsconfig.json"))
    .filter((a) => a.startsWith("@studio-hub/"))
    .sort();
}

/**
 * Les configurations qui compilent les sources du Hub.
 *
 * Chacune est nommee avec le job CI qui la lance : quand ce test tombe, on
 * sait quel job serait rouge.
 */
const CONFIGS: ReadonlyArray<{ fichier: string; job: string }> = [
  { fichier: "apps/op1-studio/tsconfig.json", job: "OP-1 Studio Checks" },
  { fichier: "apps/ep133-studio/tsconfig.app.json", job: "EP-133 Studio Checks" },
];

describe("les alias partages sont declares partout", () => {
  const reference = referenceRacine();

  it("la racine declare bien des paquets partages", () => {
    // Garde-fou du garde-fou : une reference vide validerait n'importe quoi.
    expect(reference.length).toBeGreaterThan(3);
  });

  for (const { fichier, job } of CONFIGS) {
    it(`${fichier} declare les memes alias que la racine`, () => {
      const declares = new Set(Object.keys(alias(fichier)));
      const manquants = reference.filter((a) => !declares.has(a));
      expect(
        manquants,
        `alias absents de ${fichier} — le job « ${job} » peut echouer sur : ${manquants.join(", ")}`,
      ).toEqual([]);
    });
  }
});

describe("les alias pointent vers des fichiers qui existent", () => {
  /**
   * Un chemin faux ne se voit qu'au moment ou quelqu'un importe l'alias —
   * potentiellement des mois plus tard, dans un autre studio.
   */
  for (const { fichier } of CONFIGS) {
    it(`${fichier} ne pointe nulle part dans le vide`, () => {
      const base = path.dirname(path.join(RACINE, fichier));
      const casses: string[] = [];
      for (const [nom, cibles] of Object.entries(alias(fichier))) {
        // Les alias en `/*` designent un dossier : on verifie le dossier.
        for (const cible of cibles) {
          const chemin = path.resolve(base, cible.replace(/\/\*$/, ""));
          try {
            statSync(chemin);
          } catch {
            casses.push(`${nom} -> ${cible}`);
          }
        }
      }
      expect(casses, `chemins introuvables : ${casses.join(", ")}`).toEqual([]);
    });
  }
});
