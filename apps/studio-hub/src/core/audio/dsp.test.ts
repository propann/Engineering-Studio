import { describe, expect, it } from "vitest";
import {
  ORDRE_SATURATION,
  coefficientsFormeLfo,
  HARMONIQUES_LFO, buildBitcrushCurve, buildSaturationCurve } from "./dsp";

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

describe("dephasage du LFO", () => {
  /** Reconstruit x(theta) depuis les coefficients, comme le moteur audio. */
  const rendre = (c: { real: Float32Array; imag: Float32Array }, th: number) => {
    let v = 0;
    for (let k = 1; k < c.real.length; k++) v += c.real[k] * Math.cos(k * th) + c.imag[k] * Math.sin(k * th);
    return v;
  };

  /** Les quatre formes ideales de la specification Web Audio. */
  const IDEAL: Record<string, (t: number) => number> = {
    sine: (t) => Math.sin(t),
    square: (t) => (Math.sin(t) >= 0 ? 1 : -1),
    sawtooth: (t) => { const x = (((t / (2 * Math.PI)) % 1) + 1) % 1; return x < 0.5 ? 2 * x : 2 * x - 2; },
    triangle: (t) => { const x = (((t / (2 * Math.PI)) % 1) + 1) % 1; return x < 0.25 ? 4 * x : x < 0.75 ? 2 - 4 * x : 4 * x - 4; },
  };

  it("a phase nulle, le sinus est un sinus pur", () => {
    const c = coefficientsFormeLfo("sine", 0);
    expect(c.imag[1]).toBeCloseTo(1, 10);
    expect(c.real[1]).toBeCloseTo(0, 10);
    for (let k = 2; k < c.imag.length; k++) expect(c.imag[k]).toBeCloseTo(0, 10);
  });

  it("ne cree jamais de composante continue", () => {
    // L'indice 0 decalerait le LFO hors de son axe : un tremolo qui module
    // autour d'autre chose que le volume regle.
    for (const forme of ["sine", "triangle", "square", "sawtooth"] as const) {
      for (const deg of [0, 37, 90, 180, 300]) {
        const c = coefficientsFormeLfo(forme, deg);
        expect(c.real[0], `${forme} a ${deg}`).toBe(0);
        expect(c.imag[0], `${forme} a ${deg}`).toBe(0);
      }
    }
  });

  it("decale la forme sans la deformer", () => {
    // L'invariant central. L'ecart a la forme ideale doit etre le MEME a
    // toutes les phases : ce qui reste est la troncature des harmoniques, pas
    // le dephasage.
    for (const forme of ["sine", "triangle", "square", "sawtooth"] as const) {
      const ecarts = [0, 45, 90, 180, 270].map((deg) => {
        const c = coefficientsFormeLfo(forme, deg);
        const phi = (deg * Math.PI) / 180;
        let pire = 0;
        for (let i = 0; i < 720; i++) {
          const th = (i / 720) * 2 * Math.PI;
          // A l'ecart des sauts : une serie finie y sonne toujours (Gibbs).
          const saut = ["square", "sawtooth"].includes(forme)
            && [0, Math.PI, 2 * Math.PI].some((d) => Math.abs(((th + phi) % (2 * Math.PI)) - d) < 0.25);
          if (saut) continue;
          pire = Math.max(pire, Math.abs(rendre(c, th) - IDEAL[forme](th + phi)));
        }
        return pire;
      });
      for (const e of ecarts) expect(e, `${forme}`).toBeCloseTo(ecarts[0], 6);
    }
  });

  it("tourne chaque harmonique de k·phi, pas de phi", () => {
    // Le defaut classique : tourner tout le spectre du meme angle tourne le
    // FONDAMENTAL mais deforme la forme, au lieu de la deplacer. Il ne se voit
    // pas sur un sinus — qui n'a qu'une harmonique — d'ou ce test sur le carre.
    const deg = 30, phi = (deg * Math.PI) / 180;
    const c = coefficientsFormeLfo("square", deg);
    const b3 = 4 / (Math.PI * 3);
    expect(c.imag[3]).toBeCloseTo(b3 * Math.cos(3 * phi), 6);
    expect(c.real[3]).toBeCloseTo(b3 * Math.sin(3 * phi), 6);
    // Et surtout : ce n'est PAS la rotation d'angle phi.
    expect(c.imag[3]).not.toBeCloseTo(b3 * Math.cos(phi), 3);
  });

  it("deplace le sommet du triangle d'exactement la phase demandee", () => {
    // La lecture directe de ce que fait le reglage : la crete recule de phi.
    for (const deg of [0, 45, 90, 180]) {
      const c = coefficientsFormeLfo("triangle", deg);
      let sommet = 0, max = -Infinity;
      for (let i = 0; i < 3600; i++) {
        const th = (i / 3600) * 2 * Math.PI;
        const v = rendre(c, th);
        if (v > max) { max = v; sommet = (th * 180) / Math.PI; }
      }
      expect(sommet, `phase ${deg}`).toBeCloseTo(((90 - deg) % 360 + 360) % 360, 0);
    }
  });

  it("un tour complet revient au point de depart", () => {
    const a = coefficientsFormeLfo("sawtooth", 0);
    const b = coefficientsFormeLfo("sawtooth", 360);
    for (let k = 0; k < a.real.length; k++) {
      expect(b.real[k]).toBeCloseTo(a.real[k], 6);
      expect(b.imag[k]).toBeCloseTo(a.imag[k], 6);
    }
  });

  it("resiste a une phase aberrante", () => {
    // Un NaN ne ferait pas lever `createPeriodicWave` : il rendrait un LFO
    // muet, panne qui ne se voit qu'en jouant.
    for (const deg of [NaN, Infinity, -Infinity]) {
      const c = coefficientsFormeLfo("triangle", deg);
      expect(c.real.every((v) => Number.isFinite(v))).toBe(true);
      expect(c.imag.every((v) => Number.isFinite(v))).toBe(true);
    }
  });

  it("garde assez d'harmoniques pour que le carre reste carre", () => {
    expect(HARMONIQUES_LFO).toBeGreaterThanOrEqual(16);
    const c = coefficientsFormeLfo("square", 0);
    expect(c.imag.length).toBe(HARMONIQUES_LFO + 1);
    // Le plateau du carre doit tenir a 1, pas s'arrondir vers zero.
    expect(rendre(c, Math.PI / 2)).toBeCloseTo(1, 1);
  });
});
