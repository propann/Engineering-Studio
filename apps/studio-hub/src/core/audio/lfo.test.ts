import { describe, expect, it } from "vitest";
import {
  phaseLfoDeg,
  FILTRE_CENTRE_HZ, FILTRE_MIN_HZ, LFO_DEFAUT, LFO_HZ_MAX, LFO_HZ_MIN,
  NOMS_CIBLES, NOMS_FORMES, ORDRE_CIBLES, ORDRE_FORMES,
  amplitudeFiltre, lfoActif, profondeurTremolo, vitesseLfoHz,
} from "./lfo";

const avec = (p: Partial<typeof LFO_DEFAUT>) => ({ ...LFO_DEFAUT, ...p });

describe("vitesse", () => {
  it("le curseur entier donne des dixiemes de Hz", () => {
    // Sans le facteur 10, la plage utile se reduirait a vingt crans.
    expect(vitesseLfoHz(avec({ lfoRate: 35 }), 120)).toBeCloseTo(3.5, 10);
    expect(vitesseLfoHz(avec({ lfoRate: 10 }), 120)).toBeCloseTo(1, 10);
  });

  it("calee sur le tempo, une noire donne deux cycles par seconde a 120", () => {
    // Une noire dure 500 ms : un cycle par division = 2 Hz.
    expect(vitesseLfoHz(avec({ lfoSync: true, lfoDivision: "1/4" }), 120)).toBeCloseTo(2, 6);
    expect(vitesseLfoHz(avec({ lfoSync: true, lfoDivision: "1/8" }), 120)).toBeCloseTo(4, 6);
  });

  it("suit le tempo", () => {
    const lent = vitesseLfoHz(avec({ lfoSync: true, lfoDivision: "1/4" }), 60);
    const vite = vitesseLfoHz(avec({ lfoSync: true, lfoDivision: "1/4" }), 180);
    expect(vite).toBeGreaterThan(lent);
  });

  it("ignore le curseur quand la synchro est active", () => {
    // Sinon le reglage libre et la division se contrediraient sans qu'on
    // sache lequel gagne.
    const a = vitesseLfoHz(avec({ lfoSync: true, lfoRate: 1, lfoDivision: "1/4" }), 120);
    const b = vitesseLfoHz(avec({ lfoSync: true, lfoRate: 200, lfoDivision: "1/4" }), 120);
    expect(a).toBe(b);
  });

  it("reste dans une plage ou l'on entend une modulation", () => {
    // Sous 0,05 Hz un cycle dure vingt secondes : plus rien ne bouge. Au-dela
    // de 20 Hz ce n'est plus une modulation mais un son.
    for (const rate of [0, -50, 1, 5000]) {
      const v = vitesseLfoHz(avec({ lfoRate: rate }), 120);
      expect(v).toBeGreaterThanOrEqual(LFO_HZ_MIN);
      expect(v).toBeLessThanOrEqual(LFO_HZ_MAX);
    }
    for (const division of ["1/1", "1/16T"] as const) {
      const v = vitesseLfoHz(avec({ lfoSync: true, lfoDivision: division }), 300);
      expect(v).toBeGreaterThanOrEqual(LFO_HZ_MIN);
      expect(v).toBeLessThanOrEqual(LFO_HZ_MAX);
    }
  });

  it("resiste a un reglage aberrant", () => {
    for (const v of [NaN, Infinity, -Infinity]) {
      expect(Number.isFinite(vitesseLfoHz(avec({ lfoRate: v }), 120))).toBe(true);
      expect(Number.isFinite(vitesseLfoHz(avec({ lfoSync: true }), v))).toBe(true);
    }
  });
});

describe("tremolo", () => {
  it("ne peut jamais faire passer le gain sous zero", () => {
    // L'invariant qui compte. Le LFO AJOUTE au gain, qui vaut au plus 1. Un
    // gain negatif n'attenue pas : il INVERSE LA PHASE. Sur une superposition
    // de patches, deux voix en opposition s'annulent — le son disparait par
    // intermittence, sans qu'aucune erreur ne soit levee.
    for (let pct = 0; pct <= 100; pct += 5) {
      const gainMin = 1 - profondeurTremolo(pct);
      expect(gainMin, `a ${pct} %`).toBeGreaterThan(0);
    }
  });

  it("croit avec le curseur", () => {
    expect(profondeurTremolo(100)).toBeGreaterThan(profondeurTremolo(50));
    expect(profondeurTremolo(50)).toBeGreaterThan(profondeurTremolo(0));
  });

  it("vaut zero a zero", () => {
    // Un tremolo « inactif » qui module quand meme serait un defaut silencieux.
    expect(profondeurTremolo(0)).toBe(0);
  });

  it("borne des deux cotes", () => {
    expect(profondeurTremolo(-30)).toBe(0);
    expect(profondeurTremolo(500)).toBe(profondeurTremolo(100));
    expect(profondeurTremolo(NaN)).toBe(0);
  });
});

describe("balayage de filtre", () => {
  it("le creux reste au-dessus du plancher audible", () => {
    // Un filtre balaye jusqu'a zero coupe tout : l'oreille entend un trou,
    // pas un balayage.
    for (let pct = 0; pct <= 100; pct += 5) {
      expect(FILTRE_CENTRE_HZ - amplitudeFiltre(pct), `a ${pct} %`).toBeGreaterThanOrEqual(FILTRE_MIN_HZ);
    }
  });

  it("a fond, le balayage descend jusqu'au plancher", () => {
    // Sinon la moitie de la course du curseur serait sans effet audible.
    expect(FILTRE_CENTRE_HZ - amplitudeFiltre(100)).toBeCloseTo(FILTRE_MIN_HZ, 6);
  });

  it("vaut zero a zero, et resiste a l'aberrant", () => {
    expect(amplitudeFiltre(0)).toBe(0);
    expect(amplitudeFiltre(-10)).toBe(0);
    expect(amplitudeFiltre(NaN)).toBe(0);
    expect(amplitudeFiltre(1e9)).toBe(amplitudeFiltre(100));
  });

  it("le centre est dans une bande ou le balayage s'entend", () => {
    expect(FILTRE_CENTRE_HZ).toBeGreaterThan(400);
    expect(FILTRE_CENTRE_HZ).toBeLessThan(4000);
    expect(FILTRE_MIN_HZ).toBeGreaterThan(20);
  });
});

describe("activite", () => {
  it("inactif sans cible", () => {
    // Construire un oscillateur et un gain pour rien couterait a chaque note,
    // et le LFO tournerait indefiniment.
    expect(lfoActif(avec({ lfoCible: "aucun", lfoDepth: 100 }))).toBe(false);
  });

  it("inactif a profondeur nulle", () => {
    expect(lfoActif(avec({ lfoCible: "tremolo", lfoDepth: 0 }))).toBe(false);
  });

  it("actif quand une cible et une profondeur sont posees", () => {
    expect(lfoActif(avec({ lfoCible: "tremolo", lfoDepth: 40 }))).toBe(true);
    expect(lfoActif(avec({ lfoCible: "filtre", lfoDepth: 1 }))).toBe(true);
  });

  it("inactif sur une profondeur aberrante", () => {
    expect(lfoActif(avec({ lfoCible: "tremolo", lfoDepth: NaN }))).toBe(false);
  });
});

describe("listes d'affichage", () => {
  it("couvrent toutes les cibles et toutes les formes", () => {
    expect([...ORDRE_CIBLES].sort()).toEqual(Object.keys(NOMS_CIBLES).sort());
    expect([...ORDRE_FORMES].sort()).toEqual(Object.keys(NOMS_FORMES).sort());
  });

  it("« aucun » vient en premier", () => {
    // Le premier choix qu'on cherche quand on veut couper la modulation.
    expect(ORDRE_CIBLES[0]).toBe("aucun");
  });

  it("les formes sont celles qu'un OscillatorNode accepte", () => {
    // `lfo.type = shape` : une valeur inconnue leve.
    const acceptees = ["sine", "square", "sawtooth", "triangle"];
    for (const f of ORDRE_FORMES) expect(acceptees, `${f} refusee par OscillatorNode`).toContain(f);
  });

  it("le defaut ne module rien", () => {
    // Ajouter le module ne doit pas changer le son des 91 patches d'usine.
    expect(lfoActif(LFO_DEFAUT)).toBe(false);
  });
});

describe("dephasage a l'origine", () => {
  it("part a zero : le defaut ne change rien aux patches existants", () => {
    expect(LFO_DEFAUT.lfoPhase).toBe(0);
  });

  it("ramene au tour", () => {
    // 450 degres, c'est 90. Sans le modulo, `createPeriodicWave` ne
    // protesterait pas — la forme serait juste ailleurs qu'annonce.
    expect(phaseLfoDeg({ lfoPhase: 450 })).toBe(90);
    expect(phaseLfoDeg({ lfoPhase: 360 })).toBe(0);
    expect(phaseLfoDeg({ lfoPhase: 0 })).toBe(0);
  });

  it("ramene un angle negatif dans le tour, sans changer le point du cycle", () => {
    // -90 et 270 designent le meme endroit. Un modulo naif rendrait -90, et
    // le curseur afficherait une valeur qu'il ne peut pas atteindre.
    expect(phaseLfoDeg({ lfoPhase: -90 })).toBe(270);
    expect(phaseLfoDeg({ lfoPhase: -360 })).toBe(0);
  });

  it("rend toujours un angle utilisable", () => {
    // Un NaN ne fait pas lever `createPeriodicWave` : il rend un LFO muet.
    for (const v of [NaN, Infinity, -Infinity, undefined as unknown as number]) {
      const d = phaseLfoDeg({ lfoPhase: v });
      expect(Number.isFinite(d), `${v}`).toBe(true);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(360);
    }
  });
});
