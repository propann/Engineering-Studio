import { describe, expect, it } from "vitest";
import { BPM_MAX, BPM_MIN } from "@studio-hub/rack-bus";
import { TEMPS_PAR_CYCLE, bpmVersCps, cpsVersBpm } from "./tempo";

/**
 * La conversion tempo → cycles.
 *
 * Trois lignes de code, mais l'erreur qu'elles évitent ne se diagnostique pas
 * à l'oreille : passer un BPM à `setCps` donne un bourdonnement continu, et
 * l'on cherche la panne dans le moteur audio.
 */

describe("traduire le tempo du Hub pour Strudel", () => {
  it("120 BPM font un demi-cycle par seconde", () => {
    // Une mesure de quatre temps a 120 BPM dure deux secondes : 0,5 cycle/s.
    expect(bpmVersCps(120)).toBeCloseTo(0.5, 10);
  });

  it("la conversion suit la convention de la documentation Strudel", () => {
    // `setcps(bpm/60/4)` y est l'ecriture courante.
    for (const bpm of [60, 90, 120, 174, 300]) {
      expect(bpmVersCps(bpm)).toBeCloseTo(bpm / 60 / TEMPS_PAR_CYCLE, 10);
    }
  });

  it("l'aller-retour rend le tempo de départ", () => {
    for (const bpm of [BPM_MIN, 100, 128, BPM_MAX]) {
      expect(cpsVersBpm(bpmVersCps(bpm))).toBeCloseTo(bpm, 10);
    }
  });

  it("un tempo plus rapide donne plus de cycles par seconde", () => {
    // Le sens de la conversion : l'inverser donnerait un tempo qui ralentit
    // quand on l'augmente, ce qu'un test d'egalite seul ne verrait pas.
    expect(bpmVersCps(140)).toBeGreaterThan(bpmVersCps(120));
  });

  it("aux bornes du rack, le résultat reste musicalement sensé", () => {
    /**
     * Un cycle de plus de dix secondes ou de moins d'un dixième de seconde
     * sortirait de ce qu'on peut suivre à l'oreille. Les bornes du fond de
     * panier doivent tenir dans cet intervalle, sans quoi le curseur de tempo
     * offrirait des réglages inutilisables.
     */
    const lent = 1 / bpmVersCps(BPM_MIN);
    const vif = 1 / bpmVersCps(BPM_MAX);
    expect(lent).toBeLessThan(15);
    expect(vif).toBeGreaterThan(0.1);
  });
});
