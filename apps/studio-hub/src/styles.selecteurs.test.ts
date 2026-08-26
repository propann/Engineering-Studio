import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Les feuilles heritees de la maquette portent des selecteurs d'element nus.
 * Le playbook UI les interdit (section 2) parce qu'ils frappent tout le DOM,
 * y compris des composants ecrits bien apres eux.
 *
 * Deux degats constates, pas theoriques :
 *
 * - `nav { display: none }` sous 900px masquait la barre de filtres du
 *   registre des pages ; trois autres <nav> n'ont survecu que par un
 *   rattrapage `!important`, et un quatrieme par un style inline.
 * - `footer { min-height: 120px; background: #111 }` visait le pied de page de
 *   la maquette. Ce pied n'existe plus : le seul <footer> du depot est celui du
 *   composant `Card`. La regle lui imposait donc un bloc noir de 120px sous
 *   chaque visuel machine de l'accueil, pour une ligne de texte de 10px.
 *
 * Ce test empeche d'en reintroduire. Il ne verifie pas une mise en forme mais
 * une portee : un selecteur nu est un effet de bord en attente.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FEUILLES = ["styles.css", "themes.css", "styles-maquette-map.css"];

/** Retire les commentaires et le contenu des chaines avant d'analyser. */
const nettoyer = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Les deux selecteurs nus qui restent. Chacun a son ticket ; les corriger ici
 * entrerait en collision avec la migration UI en cours.
 *
 * Cette liste se nettoie d'elle-meme : le test exige qu'un selecteur inscrit
 * soit ENCORE present. Le jour ou UI-002 supprime `nav`, ce fichier echoue en
 * demandant de retirer la ligne — la dette ne peut donc pas etre oubliee ici
 * apres avoir ete payee ailleurs.
 */
const RESTES: Record<string, string> = {
  "styles.css|nav": "UI-002 — remplacer chaque cas par une classe ciblee",
  "styles-maquette-map.css|main": "UI-801 — demantelement de styles-maquette-map.css",
};

describe("aucun selecteur d'element nu dans les feuilles de page", () => {
  // `html`, `body` et `*` sont legitimes : ils posent le socle, pas un composant.
  const INTERDITS = ["nav", "footer", "header", "main", "section", "article", "aside"];

  for (const feuille of FEUILLES) {
    const css = nettoyer(readFileSync(path.join(DIR, feuille), "utf-8"));

    for (const balise of INTERDITS) {
      // Un selecteur nu : debut de regle ou apres } , ou {, sans . # [ ni -
      const nu = new RegExp(`(^|[};,])\\s*${balise}\\s*[{,]`, "m");
      const connu = RESTES[`${feuille}|${balise}`];

      if (connu) {
        it(`${feuille} : <${balise}> est un reste connu (${connu})`, () => {
          expect(
            nu.test(css),
            `<${balise}> a disparu de ${feuille} : retirer son entree de RESTES`,
          ).toBe(true);
        });
        continue;
      }

      it(`${feuille} ne stylise pas <${balise}> globalement`, () => {
        const trouve = nu.exec(css);
        expect(
          trouve,
          trouve ? `selecteur nu « ${trouve[0].trim()} » — le nommer avec une classe` : "",
        ).toBeNull();
      });
    }
  }
});
