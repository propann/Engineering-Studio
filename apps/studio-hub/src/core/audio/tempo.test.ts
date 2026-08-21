import { describe, expect, it } from "vitest";
import {
  DELAY_MAX_MS, DELAY_MIN_MS, DIVISIONS, ORDRE_DIVISIONS,
  dureeDivisionMs, vitesseArpege, type Division,
} from "./tempo";

describe("duree d'une division", () => {
  it("la noire vaut 60000/bpm", () => {
    // Le repere que tout le reste derive. A 120, c'est 500 ms.
    expect(dureeDivisionMs(120, "1/4")).toBe(500);
    expect(dureeDivisionMs(60, "1/4")).toBe(1000);
  });

  it("la croche vaut la moitie de la noire", () => {
    expect(dureeDivisionMs(120, "1/8")).toBe(250);
    // A 140 BPM la noire fait 428,57 ms : arrondis separement, la croche
    // doublee donne 428 et la noire 429. Un ecart d'1 ms est l'arrondi, pas
    // une erreur de calcul — d'ou la tolerance plutot qu'une egalite.
    expect(Math.abs(dureeDivisionMs(140, "1/8") * 2 - dureeDivisionMs(140, "1/4"))).toBeLessThanOrEqual(1);
  });

  it("le pointe vaut une fois et demie", () => {
    expect(dureeDivisionMs(120, "1/8.")).toBe(375);
  });

  it("le triolet vaut deux tiers", () => {
    // 250 * 2/3 = 166.67 → 167. C'est l'arrondi, pas une approximation du calcul.
    expect(dureeDivisionMs(120, "1/8T")).toBe(167);
  });

  it("borne au maximum du curseur plutot que de rendre l'injouable", () => {
    // A 60 BPM une ronde fait 4000 ms ; le noeud de delay refuse au-dela de
    // 2 s et le curseur s'arrete a 1200. Sans borne, la valeur rendue serait
    // silencieusement ecrasee ailleurs et l'affichage mentirait.
    expect(dureeDivisionMs(60, "1/1")).toBe(DELAY_MAX_MS);
  });

  it("ne descend jamais sous le minimum du curseur", () => {
    // A retenir : ce plancher ne se declenche jamais. Au tempo le plus haut
    // (300) et sur la division la plus courte (1/16T), on est encore a 33 ms.
    // Le `Math.max` est donc defensif, pas fonctionnel — le noter ici evite
    // qu'on le prenne un jour pour un comportement observable.
    expect(dureeDivisionMs(300, "1/16T")).toBe(33);
    for (const bpm of [20, 60, 120, 300]) {
      for (const d of ORDRE_DIVISIONS) {
        expect(dureeDivisionMs(bpm, d)).toBeGreaterThanOrEqual(DELAY_MIN_MS);
      }
    }
  });

  it("resiste a un tempo aberrant", () => {
    // Le message vient d'une autre fenetre : rien ne garantit un BPM sense.
    expect(Number.isFinite(dureeDivisionMs(0, "1/4"))).toBe(true);
    expect(Number.isFinite(dureeDivisionMs(-40, "1/4"))).toBe(true);
    expect(dureeDivisionMs(99999, "1/4")).toBeGreaterThanOrEqual(DELAY_MIN_MS);
  });

  it("rend un entier — le curseur ne prend pas de decimales", () => {
    for (const d of ORDRE_DIVISIONS) {
      expect(Number.isInteger(dureeDivisionMs(137, d))).toBe(true);
    }
  });

  it("groupe par valeur de base, pas par duree stricte", () => {
    // Convention des sequenceurs : 1/4, 1/4., 1/4T se suivent, meme si la
    // pointee (750 ms) est plus longue que la 1/2 suivante n'est courte. Un
    // tri strictement decroissant melangerait les familles et rendrait le
    // menu illisible. C'est un choix, verrouille comme tel.
    expect(ORDRE_DIVISIONS).toEqual([
      "1/1", "1/2", "1/4", "1/4.", "1/4T", "1/8", "1/8.", "1/8T", "1/16", "1/16T",
    ]);
    // Les valeurs de base, elles, decroissent bien.
    const bases = ["1/1", "1/2", "1/4", "1/8", "1/16"] as Division[];
    const ms = bases.map((d) => DIVISIONS[d]);
    expect([...ms].sort((a, b) => b - a)).toEqual(ms);
  });

  it("l'ordre d'affichage couvre toutes les divisions", () => {
    expect([...ORDRE_DIVISIONS].sort()).toEqual((Object.keys(DIVISIONS) as Division[]).sort());
  });
});

describe("vitesse d'arpege", () => {
  it("rend des pas par seconde, pas des millisecondes", () => {
    // A 120 BPM la croche dure 250 ms, soit 4 pas par seconde.
    expect(vitesseArpege(120, "1/8")).toBe(4);
    expect(vitesseArpege(120, "1/16")).toBe(8);
  });

  it("reste dans les bornes du curseur ARP SPEED", () => {
    expect(vitesseArpege(300, "1/16T")).toBeLessThanOrEqual(30);
    expect(vitesseArpege(20, "1/1")).toBeGreaterThanOrEqual(1);
  });

  it("ne rend jamais 0 — le rack lit 0 comme « note tenue »", () => {
    // `if (p.plArpSpeed > 0)` (AudioPluginRack.tsx:1578) : un 0 issu d'un
    // arrondi couperait l'arpege au lieu de le ralentir.
    for (const bpm of [20, 30, 60, 90, 120, 174, 300]) {
      for (const d of ORDRE_DIVISIONS) {
        expect(vitesseArpege(bpm, d)).toBeGreaterThan(0);
      }
    }
  });

  it("rend un entier", () => {
    expect(Number.isInteger(vitesseArpege(137, "1/8"))).toBe(true);
  });
});
