import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOGUE,
  nomDe,
  reglagesDe,
  tousLesReglages,
} from "./catalogueParams";
import { PARAMS_DEFAUT } from "./moteurs";

/**
 * Le catalogue des reglages.
 *
 * ## L'invariant qui compte
 *
 * Un reglage declare ici doit etre LU par le moteur. Un curseur qui ne pilote
 * rien est le defaut que ce depot a mis des mois a purger — 39 % des controles
 * du rack etaient inertes — et il revient des qu'on ajoute un moteur sans y
 * penser.
 *
 * `AudioPluginRack.wiring.test.ts` verifie l'autre sens : que tout parametre
 * declare en etat soit lu par le son. Ici on verifie que tout reglage AFFICHE
 * existe et agit.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MOTEURS = readFileSync(path.join(DIR, "moteurs.ts"), "utf-8");

describe("chaque reglage pilote reellement le moteur", () => {
  it("tous les noms declares sont lus par la bibliotheque", () => {
    const inertes = tousLesReglages().filter(
      (nom) => !new RegExp(`\\bp\\.${nom}\\b`).test(MOTEURS),
    );
    expect(
      inertes,
      `reglages affiches mais jamais lus : ${inertes.join(", ")}`,
    ).toEqual([]);
  });

  it("tous les noms declares existent dans les parametres", () => {
    // Un nom mal orthographie ferait un curseur qui ecrit dans le vide.
    const inconnus = tousLesReglages().filter((nom) => !(nom in PARAMS_DEFAUT));
    expect(inconnus, `noms absents de PARAMS_DEFAUT : ${inconnus.join(", ")}`).toEqual([]);
  });

  it("aucun reglage n'est declare deux fois pour un meme moteur", () => {
    for (const [moteur, fiche] of Object.entries(CATALOGUE)) {
      const noms = fiche.reglages.map((r) => r.nom);
      expect(new Set(noms).size, `${moteur} declare un doublon`).toBe(noms.length);
    }
  });
});

describe("le catalogue couvre les vingt moteurs", () => {
  it("chacun a un nom et au moins un reglage", () => {
    const entrees = Object.entries(CATALOGUE);
    expect(entrees.length).toBe(20);
    for (const [moteur, fiche] of entrees) {
      expect(fiche.nom.length, `${moteur} n'a pas de nom`).toBeGreaterThan(0);
      expect(fiche.reglages.length, `${moteur} n'a aucun reglage`).toBeGreaterThan(0);
    }
  });

  it("les bornes sont coherentes", () => {
    for (const [moteur, fiche] of Object.entries(CATALOGUE)) {
      for (const r of fiche.reglages) {
        if (r.type !== "curseur") continue;
        expect(r.max, `${moteur}.${r.nom} : max <= min`).toBeGreaterThan(r.min);
      }
    }
  });

  it("la valeur par defaut de chaque curseur tient dans ses bornes", () => {
    /**
     * Une valeur hors bornes se fait pincer par le curseur au premier
     * affichage : le son changerait sans qu'on ait rien touche, et l'on
     * chercherait pourquoi le patch d'usine ne sonne plus comme avant.
     */
    const dehors: string[] = [];
    for (const [moteur, fiche] of Object.entries(CATALOGUE)) {
      for (const r of fiche.reglages) {
        if (r.type !== "curseur") continue;
        const v = (PARAMS_DEFAUT as Record<string, unknown>)[r.nom];
        if (typeof v === "number" && (v < r.min || v > r.max)) {
          dehors.push(`${moteur}.${r.nom}=${v} hors [${r.min}, ${r.max}]`);
        }
      }
    }
    expect(dehors, dehors.join(" ; ")).toEqual([]);
  });

  it("chaque liste propose au moins deux options", () => {
    // Une liste a une seule option est un reglage qui n'en est pas un.
    for (const [moteur, fiche] of Object.entries(CATALOGUE)) {
      for (const r of fiche.reglages) {
        if (r.type !== "liste") continue;
        expect(r.options.length, `${moteur}.${r.nom} n'a qu'une option`).toBeGreaterThan(1);
      }
    }
  });

  it("la valeur par defaut de chaque liste est une option proposee", () => {
    // Sinon la liste s'affiche vide, ou pire, sur une option au hasard.
    const dehors: string[] = [];
    for (const [moteur, fiche] of Object.entries(CATALOGUE)) {
      for (const r of fiche.reglages) {
        if (r.type !== "liste") continue;
        const v = (PARAMS_DEFAUT as Record<string, unknown>)[r.nom];
        if (typeof v === "string" && !r.options.some((o) => o.valeur === v)) {
          dehors.push(`${moteur}.${r.nom}="${v}" absent des options`);
        }
      }
    }
    expect(dehors, dehors.join(" ; ")).toEqual([]);
  });
});

describe("les accesseurs", () => {
  it("`reglagesDe` rend une liste vide pour un moteur inconnu", () => {
    // Une carte incrustee avec un identifiant errone doit se dire vide, pas
    // faire tomber la page qui l'accueille.
    expect(reglagesDe("inconnu")).toEqual([]);
    expect(reglagesDe("")).toEqual([]);
  });

  it("`nomDe` retombe sur l'identifiant faute de fiche", () => {
    expect(nomDe("mi_plaits")).toBe("Mutable Plaits");
    expect(nomDe("inconnu")).toBe("inconnu");
  });
});
