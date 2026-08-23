import { describe, expect, it, beforeEach } from "vitest";
import { bpmSain } from "../musique/divisions";
import {
  BPM_MAX,
  BPM_MIN,
  bornerBpm,
  reglerBpm,
  reglerMarche,
  reinitialiserTransportPourTests,
  sAbonnerTransport,
  transport,
} from "./transport";

/**
 * Le verrou que la documentation de `transport.ts` annonce.
 *
 * Elle recopie les bornes de `packages/musique/divisions.ts` plutot que de les
 * importer, pour ne pas faire dependre le fond de panier du paquet musique —
 * qui en est un client. Deux valeurs recopiees ne tiennent que si quelque chose
 * verifie leur accord : sans ce fichier, la justification promettait un test
 * qui n'existait pas.
 */
beforeEach(() => {
  reinitialiserTransportPourTests();
});

describe("les bornes restent d'accord avec packages/musique", () => {
  it("bornerBpm et bpmSain donnent le meme resultat", () => {
    // Les extremes, les valeurs hors bornes, et un NaN : les trois cas ou une
    // divergence entre les deux implementations se verrait.
    for (const bpm of [-1, 0, 19, BPM_MIN, 120, BPM_MAX, 301, 1e6, NaN]) {
      expect(bornerBpm(bpm), `bpm ${bpm}`).toBe(bpmSain(bpm));
    }
  });

  it("les constantes valent celles appliquees par bpmSain", () => {
    expect(BPM_MIN).toBe(bpmSain(-1));
    expect(BPM_MAX).toBe(bpmSain(1e6));
  });
});

describe("le transport previent ses abonnes", () => {
  it("previent immediatement a l'abonnement", () => {
    // Sans cela, une facade montee apres le demarrage afficherait un tempo faux
    // jusqu'au prochain reglage.
    reglerBpm(140);
    const vus: number[] = [];
    sAbonnerTransport((t) => vus.push(t.bpm));
    expect(vus).toEqual([140]);
  });

  it("ne reveille personne pour une valeur inchangee", () => {
    const vus: number[] = [];
    sAbonnerTransport((t) => vus.push(t.bpm));
    reglerBpm(120); // deja 120
    reglerMarche(false); // deja a l'arret
    expect(vus).toEqual([120]);
  });

  it("borne avant de comparer : 301 et 300 sont un seul changement", () => {
    const vus: number[] = [];
    sAbonnerTransport((t) => vus.push(t.bpm));
    reglerBpm(1e6);
    reglerBpm(BPM_MAX);
    expect(vus).toEqual([120, BPM_MAX]);
  });

  it("le desabonnement rendu coupe bien les notifications", () => {
    const vus: number[] = [];
    const desabonner = sAbonnerTransport((t) => vus.push(t.bpm));
    desabonner();
    reglerBpm(150);
    expect(vus).toEqual([120]);
    expect(transport().bpm).toBe(150);
  });

  it("un auditeur qui leve ne prive pas les autres", () => {
    const vus: number[] = [];
    sAbonnerTransport(() => { throw new Error("cet auditeur est casse"); });
    sAbonnerTransport((t) => vus.push(t.bpm));
    reglerBpm(90);
    expect(vus).toEqual([120, 90]);
  });
});
