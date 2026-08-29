import { describe, expect, it } from "vitest";
import {
  ALIAS_SONS,
  SONS_DISTANTS_CONNUS,
  SONS_LOCAUX,
  SONS_ZZFX,
  nomsJouables,
  sonsManquants,
} from "./sons";

/**
 * Le catalogue des sons, et le détecteur de sons absents.
 *
 * Ce que ces tests protègent : la promesse « aucun échantillon distant » n'a
 * de valeur que si le rack sait dire ce qui manque. Un motif copié depuis
 * strudel.cc appelle `bd` et `hh` ; sans avertissement, il joue à moitié et
 * l'on cherche la panne dans le mauvais endroit.
 */

describe("le catalogue", () => {
  it("chaque son porte sa source dans superdough", () => {
    // Une entrée sans source est une entrée qu'on ne peut pas revérifier
    // après une montée de version.
    for (const s of SONS_LOCAUX) {
      expect(s.source, `${s.nom} n'indique pas d'où il vient`).toMatch(/\.mjs:\d+$/);
    }
  });

  it("aucun doublon", () => {
    const noms = SONS_LOCAUX.map((s) => s.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it("les alias pointent vers des sons qui existent", () => {
    const noms = new Set(SONS_LOCAUX.map((s) => s.nom));
    for (const a of ALIAS_SONS) {
      expect(noms.has(a.vers), `${a.alias} pointe vers ${a.vers}, absent du catalogue`).toBe(true);
    }
  });

  it("les sons distants ne sont jamais présentés comme jouables", () => {
    /**
     * `SONS_DISTANTS_CONNUS` existe pour RECONNAÎTRE, pas pour proposer. Si
     * un de ces noms entrait dans le catalogue local, le rack cesserait
     * d'avertir à son sujet — et laisserait un silence inexpliqué.
     */
    const jouables = new Set(nomsJouables());
    for (const d of SONS_DISTANTS_CONNUS) {
      expect(jouables.has(d), `${d} est distant mais annoncé comme local`).toBe(false);
    }
  });

  it("la palette hors ligne couvre les quatre familles", () => {
    const familles = new Set(SONS_LOCAUX.map((s) => s.famille));
    expect(familles).toContain("forme d'onde");
    expect(familles).toContain("bruit");
    expect(familles).toContain("percussion");
  });

  it("les sons ZZFX sont dans les jouables", () => {
    const jouables = new Set(nomsJouables());
    for (const z of SONS_ZZFX) expect(jouables.has(z)).toBe(true);
  });
});

describe("repérer les sons qui ne sonneront pas", () => {
  it("ne signale rien sur un motif entièrement local", () => {
    expect(sonsManquants('note("c e g").sound("sawtooth")')).toEqual([]);
  });

  it("repère un échantillon distant", () => {
    expect(sonsManquants('s("bd*4")')).toEqual(["bd"]);
  });

  it("découpe un mini-motif entier", () => {
    // Le contenu de `s()` n'est pas un nom, c'est un motif : « bd*4, ~ hh »
    // contient deux sons, un silence et une répétition.
    expect(sonsManquants('s("bd*4, ~ hh")')).toEqual(["bd", "hh"]);
  });

  it("accepte les deux écritures, `s()` et `.sound()`", () => {
    expect(sonsManquants('note("c").sound("arpy")')).toEqual(["arpy"]);
    expect(sonsManquants('s("arpy")')).toEqual(["arpy"]);
  });

  it("connaît les alias de superdough", () => {
    // `saw` vaut `sawtooth` : le signaler comme manquant serait un faux
    // positif, et le premier faux positif rend l'avertissement ignorable.
    expect(sonsManquants('note("c").sound("saw")')).toEqual([]);
    expect(sonsManquants('note("c").sound("tri")')).toEqual([]);
  });

  it("ignore l'indice d'échantillon", () => {
    // `bd:3` designe la 3e variante de `bd` : c'est le meme son manquant.
    expect(sonsManquants('s("bd:3")')).toEqual(["bd"]);
  });

  it("ignore les chiffres seuls et les silences", () => {
    expect(sonsManquants('s("~ ~ ~")')).toEqual([]);
    expect(sonsManquants('s("sine*4")')).toEqual([]);
  });

  it("ne rend chaque nom qu'une fois, trié", () => {
    expect(sonsManquants('s("hh bd hh bd cp")')).toEqual(["bd", "cp", "hh"]);
  });

  it("laisse passer les motifs dynamiques sans planter", () => {
    // `.sound(variable)` n'est pas une chaîne : on ne peut rien en dire, et
    // inventer un avertissement serait pire que se taire.
    expect(sonsManquants("note('c').sound(monSon)")).toEqual([]);
    expect(sonsManquants("")).toEqual([]);
  });

  it("ne confond pas `s(` avec la fin d'un autre identifiant", () => {
    /**
     * `stack(...)`, `notes(...)`, `beats("bd")` se terminent par une lettre
     * avant la parenthèse. Sans la limite de mot, `beats("bd")` aurait été lu
     * comme un `s("bd")` — un avertissement sur du code qui ne joue aucun son.
     */
    expect(sonsManquants('stack("bd")')).toEqual([]);
    expect(sonsManquants('beats("bd")')).toEqual([]);
  });
});
