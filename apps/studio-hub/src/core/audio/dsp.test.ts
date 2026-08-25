import { describe, expect, it } from "vitest";
import {
  ORDRE_SATURATION, buildBitcrushCurve, buildSaturationCurve } from "./dsp";

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
    for (const mode of ORDRE_SATURATION) {
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
    for (const mode of ORDRE_SATURATION) {
      const c = buildSaturationCurve(50, mode);
      expect(Math.abs(c[Math.floor(c.length / 2)])).toBeLessThan(0.05);
    }
  });
});

describe("ecretage franc", () => {
  it("laisse passer intact sous le seuil", () => {
    // C'est ce qui le distingue du tanh : celui-ci comprime des le depart,
    // l'ecretage franc ne touche a rien tant que le seuil n'est pas atteint.
    const curve = buildSaturationCurve(50, "hard");
    const n = curve.length;
    // Un point tres pres du centre, donc loin sous le seuil.
    const i = Math.floor(n / 2) + 4;
    const x = (i / (n - 1)) * 2 - 1;
    expect(curve[i]).toBeCloseTo(x * (1 + 0.5 * 12), 5);
  });

  it("s'arrete net, et reste net", () => {
    // Le plateau est la signature du mode. Sans lui, ce serait un tanh.
    const curve = buildSaturationCurve(50, "hard");
    let plateau = 0;
    for (let i = 1; i < curve.length; i++) {
      if (curve[i] === 1 && curve[i - 1] === 1) plateau++;
    }
    expect(plateau, "aucun plateau : la courbe n'ecrete pas").toBeGreaterThan(100);
  });

  it("ne redescend jamais", () => {
    // Un repliement ici serait un autre mode. L'ecretage franc est monotone.
    const curve = buildSaturationCurve(80, "hard");
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-6);
    }
  });

  it("ecrete plus tot quand le drive monte", () => {
    // Le seuil recule avec le gain d'entree : c'est ce que fait le curseur.
    const largeurPlateau = (amount: number) =>
      buildSaturationCurve(amount, "hard").filter((v) => v === 1).length;
    expect(largeurPlateau(90)).toBeGreaterThan(largeurPlateau(10));
  });

  it("reste distinct du mode doux au meme reglage", () => {
    // Deux modes qui rendraient la meme courbe donneraient deux boutons pour
    // un seul son.
    const dur = buildSaturationCurve(60, "hard");
    const doux = buildSaturationCurve(60, "soft");
    const ecart = Math.max(...dur.map((v, i) => Math.abs(v - doux[i])));
    expect(ecart).toBeGreaterThan(0.05);
  });
});
