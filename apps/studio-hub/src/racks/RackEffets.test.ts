import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * L'equilibre des trois racks.
 *
 * Chaque rack porte son interface dans son ventre. C'est une regle
 * d'architecture, pas une preference : tant que l'interface des effets vivait
 * au milieu du rack de moteurs, la separation n'existait qu'a moitie — la
 * logique d'un cote, 94 lignes de JSX de l'autre — et rien n'empechait la
 * suivante d'y retourner.
 *
 * Ces tests verrouillent la frontiere. Sans eux, elle se referme au premier
 * « juste un curseur de plus, tant qu'on y est ».
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const UI = readFileSync(path.join(DIR, "RackEffets.tsx"), "utf-8");
const LOGIQUE = readFileSync(path.join(DIR, "..", "core", "audio", "effets.ts"), "utf-8");
const MOTEURS = readFileSync(path.join(DIR, "..", "pages", "AudioPluginRack.tsx"), "utf-8");

describe("le rack d'effets porte son interface", () => {
  it("lit bien les sources", () => {
    expect(UI.length).toBeGreaterThan(2000);
    expect(MOTEURS.length).toBeGreaterThan(100000);
  });

  it("rend les quatre familles d'effets", () => {
    for (const nom of ["SATURATION", "ÉGALISEUR", "MODULATION", "DELAY"]) {
      expect(UI, `${nom} absent de l'interface`).toContain(nom);
    }
  });

  it("le rack de moteurs ne rend plus aucun curseur d'effet", () => {
    // L'invariant central. Un `fx-groupe` qui reapparait ici est le retour du
    // desequilibre — et il ne casserait rien de visible.
    expect(MOTEURS).not.toContain('className="fx-groupe"');
    expect(MOTEURS).not.toContain('className="fx-globaux"');
  });

  it("le rack de moteurs delegue en une seule balise", () => {
    expect(MOTEURS).toContain("<RackEffets params={{");
    expect(MOTEURS).toContain('from "../racks/RackEffets"');
  });
});

describe("controle, pas autonomie", () => {
  it("n'a aucun etat interne", () => {
    // Les patches ecrivent les reglages d'effets : le rack de moteurs doit
    // pouvoir les pousser vers le bas. Un composant qui posseerait son etat
    // afficherait l'ancien reglage apres un changement de patch.
    expect(UI).not.toContain("useState");
    expect(UI).not.toContain("useRef");
  });

  it("lit toutes ses valeurs dans ses proprietes", () => {
    // Une valeur lue ailleurs serait un fil qui traverse la frontiere.
    for (const nom of ["fxDriveMix", "fxEqLow", "fxModMix", "fxModMode", "fxDelayTime"]) {
      expect(UI, `${nom} n'est pas lu dans params`).toContain(`params.${nom}`);
    }
  });

  it("ne touche ni au son ni au MIDI", () => {
    // Il regle. La chaine, c'est core/audio/effets.ts ; le graphe, c'est le
    // rack de moteurs qui le construit.
    expect(UI).not.toContain("AudioContext");
    expect(UI).not.toContain("ctx.create");
    expect(UI).not.toContain("construireChaineEffets");
  });

  it("rend ses changements par un seul rappel", () => {
    // Douze setters passes en proprietes auraient recree le couplage qu'on
    // vient de defaire.
    expect(UI).toContain("onParam(");
    expect(UI).not.toMatch(/setFx[A-Z]/);
  });
});

describe("le pont cote rack de moteurs", () => {
  it("associe chaque parametre a son setter", () => {
    // Ajouter un effet sans l'inscrire ici donnerait un curseur qui bouge a
    // l'ecran sans rien changer au son.
    expect(MOTEURS).toContain("const SETTERS_EFFETS: Record<keyof ParamsEffets");
    expect(MOTEURS).toContain("SETTERS_EFFETS[nom]");
  });

  it("la table couvre exactement les parametres du type", () => {
    // `Record<keyof ParamsEffets, ...>` le garantit au typecheck ; ce test le
    // garantit aussi quand quelqu'un elargit le type en `Partial`.
    const declares = [...LOGIQUE.matchAll(/^  (fx\w+):/gm)].map((m) => m[1]);
    expect(declares.length).toBeGreaterThan(10);
    const i = MOTEURS.indexOf("const SETTERS_EFFETS");
    const table = MOTEURS.slice(i, MOTEURS.indexOf("};", i));
    for (const nom of declares) {
      expect(table, `${nom} absent de la table des setters`).toContain(`${nom}:`);
    }
  });

  it("passe par updateParam, qui reporte dans le patch courant", () => {
    // Sans cela l'ecran afficherait le bon reglage mais un echantillon rendu
    // ensuite reprendrait l'ancien.
    const i = MOTEURS.indexOf("const appliquerParamEffet");
    expect(MOTEURS.slice(i, i + 250)).toContain("updateParam(nom, valeur");
  });
});
