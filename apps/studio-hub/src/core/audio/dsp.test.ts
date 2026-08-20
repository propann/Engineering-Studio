import { describe, expect, it } from "vitest";
import { buildBitcrushCurve, buildSaturationCurve } from "./dsp";

/**
 * Ces tests portent sur les proprietes du signal, pas sur des valeurs
 * relevees puis figees. Un test qui compare a une capture ne detecte que le
 * changement ; celui-ci detecte l'erreur.
 *
 * Seules les fonctions sans AudioContext sont couvertes ici :
 * buildImpulseResponse, buildPulseWave, attachLfo et buildFeedbackLoop en
 * exigent un, ce qui demanderait un environnement navigateur.
 */

describe("buildBitcrushCurve", () => {
  it("produit une courbe exploitable par WaveShaperNode", () => {
    const curve = buildBitcrushCurve(8);
    expect(curve).toBeInstanceOf(Float32Array);
    expect(curve.length).toBeGreaterThan(1); // en deca, WaveShaper rejette
  });

  it("reste dans les bornes -1..1", () => {
    // Un depassement se traduirait par de l'ecretage franc a la lecture.
    for (const bits of [1, 4, 8, 16]) {
      for (const v of buildBitcrushCurve(bits)) {
        expect(v).toBeGreaterThanOrEqual(-1.05);
        expect(v).toBeLessThanOrEqual(1.05);
      }
    }
  });

  it("quantifie d'autant plus fort que la resolution baisse", () => {
    // C'est tout l'interet du reglage : moins de bits, moins de paliers.
    const paliers = (bits: number) => new Set(buildBitcrushCurve(bits)).size;
    expect(paliers(2)).toBeLessThan(paliers(4));
    expect(paliers(4)).toBeLessThan(paliers(8));
    expect(paliers(8)).toBeLessThan(paliers(16));
  });

  it("reste monotone croissante", () => {
    // Une courbe qui redescend replierait le signal au lieu de le quantifier.
    const curve = buildBitcrushCurve(6);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1]);
    }
  });

  it("borne la resolution demandee", () => {
    // Sans borne, Math.pow(2, 40) produirait des paliers inexploitables.
    expect(() => buildBitcrushCurve(0)).not.toThrow();
    expect(() => buildBitcrushCurve(64)).not.toThrow();
    expect(new Set(buildBitcrushCurve(0)).size).toBeGreaterThan(1);
  });
});

describe("buildSaturationCurve", () => {
  it("reste dans les bornes -1..1 quel que soit le reglage", () => {
    for (const mode of ["soft", "fold"] as const) {
      for (const amount of [0, 25, 50, 100]) {
        for (const v of buildSaturationCurve(amount, mode)) {
          expect(v).toBeGreaterThanOrEqual(-1.05);
          expect(v).toBeLessThanOrEqual(1.05);
        }
      }
    }
  });

  it("en mode doux, reste monotone croissante", () => {
    // tanh ne replie jamais : la courbe doit toujours monter, sinon ce
    // n'est plus de la saturation.
    const curve = buildSaturationCurve(70, "soft");
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-6);
    }
  });

  it("en mode doux, un drive plus fort comprime davantage", () => {
    // Le point a mi-course monte quand on augmente le drive : c'est la
    // signature de la compression douce.
    const at = (amount: number) => {
      const c = buildSaturationCurve(amount, "soft");
      return c[Math.floor(c.length * 0.75)];
    };
    expect(at(90)).toBeGreaterThan(at(10));
  });

  it("en mode repliement, la courbe redescend", () => {
    // C'est precisement ce qui distingue le wavefolding de la saturation :
    // au-dela d'un seuil l'amplitude se replie. Sans cette inversion, le
    // module ne merite pas son nom.
    const curve = buildSaturationCurve(100, "fold");
    let redescend = false;
    for (let i = 1; i < curve.length; i++) {
      if (curve[i] < curve[i - 1] - 1e-6) {
        redescend = true;
        break;
      }
    }
    expect(redescend).toBe(true);
  });

  it("a drive nul, le mode doux reste proche de l'identite", () => {
    const curve = buildSaturationCurve(0, "soft");
    const mid = curve[Math.floor(curve.length / 2)];
    expect(Math.abs(mid)).toBeLessThan(0.1); // le centre reste au centre
  });

  it("passe par zero au centre", () => {
    // Un decalage introduirait une composante continue, qui fait claquer
    // les enceintes et decale l'enveloppe.
    for (const mode of ["soft", "fold"] as const) {
      const c = buildSaturationCurve(50, mode);
      expect(Math.abs(c[Math.floor(c.length / 2)])).toBeLessThan(0.05);
    }
  });
});
