import { describe, expect, it } from "vitest";
import {
  BORNES, ENVELOPPE_DEFAUT, PLANCHER, RAMPE_MIN_SEC,
  dureeAttaqueDeclin, resoudreEnveloppe,
} from "./enveloppe";

describe("resolution des reglages", () => {
  it("convertit les millisecondes en secondes", () => {
    const e = resoudreEnveloppe({ envAttack: 500, envDecay: 250, envSustain: 50, envRelease: 1000 });
    expect(e.ATTACK).toBeCloseTo(0.5, 10);
    expect(e.DECAY).toBeCloseTo(0.25, 10);
    expect(e.SUSTAIN).toBeCloseTo(0.5, 10);
    expect(e.RELEASE).toBeCloseTo(1, 10);
  });

  it("reproduit exactement les valeurs cablees jusqu'ici", () => {
    // Le rack sonnait ainsi avant que l'enveloppe soit reglable. Ajouter des
    // curseurs ne doit pas changer le son par defaut de 91 patches.
    const e = resoudreEnveloppe(ENVELOPPE_DEFAUT);
    expect(e.ATTACK).toBeCloseTo(0.008, 10);
    expect(e.DECAY).toBeCloseTo(0.12, 10);
    expect(e.SUSTAIN).toBeCloseTo(0.75, 10);
    expect(e.RELEASE).toBeCloseTo(0.22, 10);
  });

  it("rend le defaut sur un reglage absent", () => {
    // Les 91 patches d'usine n'ont aucun champ d'enveloppe : sans ce repli,
    // charger l'un d'eux donnerait NaN partout.
    const e = resoudreEnveloppe({});
    expect(e).toEqual(resoudreEnveloppe(ENVELOPPE_DEFAUT));
  });
});

describe("les rampes ne peuvent pas lever", () => {
  it("le maintien n'est jamais nul, curseur a zero", () => {
    // `exponentialRampToValueAtTime(0)` leve. Un curseur MAINTIEN a 0 % est un
    // reglage legitime : il doit donner le silence, pas une exception au
    // premier appui sur une touche.
    expect(resoudreEnveloppe({ envSustain: 0 }).SUSTAIN).toBe(PLANCHER);
    expect(resoudreEnveloppe({ envSustain: -50 }).SUSTAIN).toBe(PLANCHER);
  });

  it("aucune duree n'est nulle", () => {
    // Une rampe de duree zero remet la valeur d'un coup : c'est exactement le
    // clic que l'enveloppe existe pour supprimer.
    const e = resoudreEnveloppe({ envAttack: 0, envDecay: 0, envRelease: 0 });
    expect(e.ATTACK).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
    expect(e.DECAY).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
    expect(e.RELEASE).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
  });

  it("toutes les valeurs restent strictement positives, quoi qu'on passe", () => {
    // Le filet global. Un seul zero quelque part et le noeud leve, ou clique.
    const aberrants = [NaN, Infinity, -Infinity, -1, -9999, 1e12];
    for (const v of aberrants) {
      const e = resoudreEnveloppe({ envAttack: v, envDecay: v, envSustain: v, envRelease: v });
      for (const [nom, x] of Object.entries(e)) {
        expect(Number.isFinite(x), `${nom} avec ${v}`).toBe(true);
        expect(x, `${nom} avec ${v}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("bornes", () => {
  it("plafonne les durees", () => {
    const e = resoudreEnveloppe({ envAttack: 99999, envDecay: 99999, envRelease: 99999 });
    expect(e.ATTACK).toBeCloseTo(BORNES.attaqueMaxMs / 1000, 10);
    expect(e.DECAY).toBeCloseTo(BORNES.declinMaxMs / 1000, 10);
    expect(e.RELEASE).toBeCloseTo(BORNES.relachementMaxMs / 1000, 10);
  });

  it("le maintien ne depasse pas 1", () => {
    // Au-dela, l'enveloppe amplifierait au lieu de maintenir : la
    // superposition de patches saturerait le bus.
    expect(resoudreEnveloppe({ envSustain: 300 }).SUSTAIN).toBe(1);
  });

  it("le relachement peut etre plus long que l'attaque et le declin reunis", () => {
    // Une nappe : attaque courte, longue queue. Si le plafond du relachement
    // etait celui des autres, ce son serait injouable.
    expect(BORNES.relachementMaxMs).toBeGreaterThan(BORNES.attaqueMaxMs);
  });
});

describe("duree attaque + declin", () => {
  it("additionne les deux phases, sans le relachement", () => {
    // Le relachement demarre quand la note s'arrete, pas apres le declin :
    // l'inclure surdimensionnerait chaque rendu hors ligne.
    const e = resoudreEnveloppe({ envAttack: 100, envDecay: 200, envRelease: 3000 });
    expect(dureeAttaqueDeclin(e)).toBeCloseTo(0.3, 10);
  });
});
