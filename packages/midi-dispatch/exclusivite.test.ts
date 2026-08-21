import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Exclusivite du repartiteur.
 *
 * `input.onmidimessage` est une PROPRIETE : un seul gestionnaire a la fois. Le
 * repartiteur n'a de valeur que s'il est le SEUL a l'ecrire — sinon le
 * nouveau venu ecrase son gestionnaire et rend muets tous les abonnes d'un
 * coup, sans erreur.
 *
 * Cinq composants l'ecrivaient : le rack, les deux pages MIDI du hub,
 * `useWebMidi` de l'EP-133 et la page OP-1. Tous migres le 2026-08-21.
 *
 * Ce test lit le source parce que la faute est un ACCES, pas un type : rien ne
 * l'empeche a la compilation, et le defaut ne se voit qu'a l'usage, quand deux
 * fonctions marchent parfaitement chacune de son cote.
 */

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function fichiersSources(dossier: string, acc: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    if (entree === "node_modules" || entree === "dist" || entree === ".git") continue;
    const complet = path.join(dossier, entree);
    if (statSync(complet).isDirectory()) fichiersSources(complet, acc);
    else if (/\.tsx?$/.test(entree) && !/\.test\.tsx?$/.test(entree)) acc.push(complet);
  }
  return acc;
}

/** Lignes qui ECRIVENT onmidimessage, commentaires exclus. */
function ecrituresDirectes(): string[] {
  const coupables: string[] = [];
  for (const fichier of [...fichiersSources(path.join(RACINE, "apps")), ...fichiersSources(path.join(RACINE, "packages"))]) {
    // Le repartiteur est le seul autorise : c'est tout son objet.
    if (fichier.includes(path.join("packages", "midi-dispatch"))) continue;
    // Les suites end-to-end pilotent un vrai navigateur, hors de ce contrat.
    if (fichier.includes(`${path.sep}e2e${path.sep}`)) continue;

    readFileSync(fichier, "utf-8").split("\n").forEach((ligne, i) => {
      const nu = ligne.trim();
      if (nu.startsWith("//") || nu.startsWith("*") || nu.startsWith("/*")) return;
      // `onmidimessage:` en position de type est une declaration, pas un acces.
      if (/onmidimessage\s*=/.test(nu)) {
        coupables.push(`${path.relative(RACINE, fichier)}:${i + 1}`);
      }
    });
  }
  return coupables;
}

describe("le répartiteur est le seul à écrire onmidimessage", () => {
  it("aucune écriture directe hors du répartiteur", () => {
    const coupables = ecrituresDirectes();
    expect(
      coupables,
      `écriture directe de onmidimessage — elle écrase le gestionnaire du ` +
        `répartiteur et rend muets TOUS les abonnés :\n  ${coupables.join("\n  ")}`
    ).toEqual([]);
  });

  it("le test sait repérer une écriture — il pourrait échouer", () => {
    // Un test qui ne peut pas échouer ne prouve rien. On vérifie donc que le
    // motif recherché attrape bien la forme fautive, sans dépendre d'un
    // sabotage manuel du dépôt.
    const fautif = "input.onmidimessage = handler;";
    expect(/onmidimessage\s*=/.test(fautif)).toBe(true);
    // Et qu'il laisse passer une déclaration de type, qui n'est pas un accès.
    expect(/onmidimessage\s*=/.test("onmidimessage: MIDIInput['onmidimessage']")).toBe(false);
  });

  it("inspecte réellement des fichiers, pas une liste vide", () => {
    // Une erreur de chemin rendrait le premier test vert sans rien lire.
    const nb = fichiersSources(path.join(RACINE, "apps")).length;
    expect(nb, "aucun fichier source inspecté").toBeGreaterThan(50);
  });
});
