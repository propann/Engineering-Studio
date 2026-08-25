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
    for (const nom of ["fxDriveMix", "fxModMix", "fxModMode", "fxDelayTime"]) {
      expect(UI, `${nom} n'est pas lu dans params`).toContain(`params.${nom}`);
    }
  });

  it("lit les gains d'egaliseur par la table des bandes", () => {
    // Les trois bandes ne sont plus ecrites a la main : elles se lisent dans
    // `BANDES_EQ`, la table que lit aussi la construction du graphe audio.
    // Le nom du parametre n'apparait donc plus derriere un point — il apparait
    // dans la table. Ce test remplace la recherche de `params.fxEqLow` par
    // l'indirection elle-meme : elle passe toujours par les proprietes, et
    // aucune bande n'est recopiee ici.
    expect(UI).toContain("BANDES_EQ.map");
    expect(UI).toContain("params[bande.reglage]");
    for (const nom of ["GRAVES", "MÉDIUMS", "AIGUS"]) {
      expect(UI, `${nom} recopie dans l'interface au lieu d'etre lu dans BANDES_EQ`).not.toContain(`>${nom} `);
    }
  });

  it("le debattement des curseurs vient de la logique", () => {
    // Le +/-18 dB etait ecrit dans les deux fichiers. Elargir la plage d'un
    // cote laissait l'autre couper le reglage en silence.
    expect(UI).toContain("EQ_DB_MAX");
    expect(UI).not.toContain("min={-18}");
  });

  it("rappelle les courbes predefinies par le rappel habituel", () => {
    // Un second rappel « applique cette courbe » aurait double la frontiere :
    // trois `onParam` d'affilee suffisent, chaque gain ayant son propre setter.
    expect(UI).toContain("COURBES_EQ.map");
    expect(UI).toContain("onParam(bande.reglage, courbe.gains[bande.reglage])");
    expect(UI).not.toMatch(/onCourbe|onPreset/);
    // Les noms ne sont pas recopies ici : ils viennent de la table.
    for (const nom of ["PLAT", "SOURIRE", "CHALEUR"]) {
      expect(UI, `${nom} recopie dans l'interface`).not.toContain(`>${nom}<`);
    }
  });

  it("allume la courbe courante, et elle seule", () => {
    // Sans cela le bouton resterait allume sur une courbe qu'on vient de
    // quitter au curseur — l'interface annoncerait un reglage qui n'est plus.
    expect(UI).toContain("estCourbeAppliquee(params, courbe)");
  });

  it("montre ce que l'egaliseur fait au son", () => {
    // Trois nombres en dB ne disent pas la forme qui en sort. La courbe la
    // montre — calculee sur la meme table que le son, sinon elle montrerait
    // une courbe qu'on n'entend pas.
    expect(UI).toContain("courbeEq");
    expect(UI).toContain('from "../core/audio/reponseEq"');
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
