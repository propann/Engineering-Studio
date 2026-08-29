import { beforeEach, describe, expect, it } from "vitest";
import {
  CLE_EFFETS,
  EFFETS_NEUTRES,
  assainir,
  effetsActifs,
  effetsMaitre,
  reglerEffetsMaitre,
  reinitialiserEffetsPourTests,
  sAbonnerEffets,
  type Stockage,
} from "./effetsMaitre";

/**
 * Le rack d'effets partage — la logique, executee.
 *
 * Ce qu'elle protege : les reglages doivent SUIVRE. Regler un delai dans le
 * rack DSP puis passer a Strudel doit garder le delai, sinon « accessible de
 * partout » ne veut rien dire. Et un stockage abime ne doit pas empecher
 * l'atelier de sonner.
 */

/** Un stockage en memoire, pour ne pas dependre de localStorage. */
function stockageFactice(initial?: string): Stockage & { valeurs: Map<string, string> } {
  const valeurs = new Map<string, string>();
  if (initial !== undefined) valeurs.set(CLE_EFFETS, initial);
  return {
    valeurs,
    getItem: (c) => valeurs.get(c) ?? null,
    setItem: (c, v) => void valeurs.set(c, v),
  };
}

beforeEach(() => reinitialiserEffetsPourTests());

describe("les reglages par defaut ne modifient rien", () => {
  it("la chaine est transparente au demarrage", () => {
    /**
     * Un atelier qui demarre avec un delai audible surprendrait, et l'on
     * chercherait d'ou il vient.
     */
    expect(effetsActifs(EFFETS_NEUTRES)).toBe(false);
  });

  it("un seul melange leve suffit a l'activer", () => {
    for (const cle of ["fxDelayMix", "fxModMix", "fxDriveMix"] as const) {
      expect(effetsActifs({ ...EFFETS_NEUTRES, [cle]: 40 })).toBe(true);
    }
  });

  it("une bande d'egaliseur deplacee compte aussi", () => {
    // L'egaliseur n'a pas de melange : son gain EST son activation.
    expect(effetsActifs({ ...EFFETS_NEUTRES, fxEqLow: 5 })).toBe(true);
    expect(effetsActifs({ ...EFFETS_NEUTRES, fxEqHigh: -3 })).toBe(true);
  });
});

describe("les reglages survivent", () => {
  it("un reglage ecrit se relit", () => {
    const s = stockageFactice();
    reglerEffetsMaitre({ fxDelayMix: 45, fxDelayTime: 250 }, s);
    reinitialiserEffetsPourTests();
    const relu = effetsMaitre(s);
    expect(relu.fxDelayMix).toBe(45);
    expect(relu.fxDelayTime).toBe(250);
  });

  it("un reglage partiel n'efface pas les autres", () => {
    const s = stockageFactice();
    reglerEffetsMaitre({ fxDelayMix: 45 }, s);
    reglerEffetsMaitre({ fxEqLow: 6 }, s);
    const p = effetsMaitre(s);
    expect(p.fxDelayMix).toBe(45);
    expect(p.fxEqLow).toBe(6);
  });

  it("un stockage absent ne fait pas lever", () => {
    // Fenetre privee verrouillee : l'atelier doit marcher sans memoire.
    expect(() => reglerEffetsMaitre({ fxDelayMix: 20 }, null)).not.toThrow();
    expect(effetsMaitre(null).fxDelayMix).toBe(20);
  });

  it("un stockage qui refuse d'ecrire ne perd pas la session", () => {
    const s: Stockage = {
      getItem: () => null,
      setItem: () => { throw new Error("quota"); },
    };
    expect(() => reglerEffetsMaitre({ fxDelayMix: 30 }, s)).not.toThrow();
    expect(effetsMaitre(s).fxDelayMix).toBe(30);
  });
});

describe("un stockage abime ne casse rien", () => {
  it("du JSON illisible rend les valeurs neutres", () => {
    expect(effetsMaitre(stockageFactice("{ pas du json"))).toEqual(EFFETS_NEUTRES);
  });

  it("un champ corrompu ne fait pas tomber les autres", () => {
    /**
     * Chaque champ est repris individuellement. Rejeter l'objet entier pour
     * une valeur abimee perdrait seize reglages valides.
     */
    const p = assainir({ fxDelayMix: 40, fxDelayTime: "beaucoup", fxEqLow: 3 });
    expect(p.fxDelayMix).toBe(40);
    expect(p.fxEqLow).toBe(3);
    expect(p.fxDelayTime).toBe(EFFETS_NEUTRES.fxDelayTime);
  });

  it("un mode inconnu retombe sur le mode neutre", () => {
    // Les deux champs texte sont des enumerations : une valeur inconnue ferait
    // construire un effet qui n'existe pas.
    expect(assainir({ fxModMode: "reverb-spatiale" }).fxModMode).toBe(EFFETS_NEUTRES.fxModMode);
    expect(assainir({ fxDriveMode: "explose" }).fxDriveMode).toBe(EFFETS_NEUTRES.fxDriveMode);
  });

  it("les modes valides passent", () => {
    expect(assainir({ fxModMode: "flanger" }).fxModMode).toBe("flanger");
    expect(assainir({ fxDriveMode: "fold" }).fxDriveMode).toBe("fold");
  });

  it("NaN et Infinity sont rejetes", () => {
    // `setValueAtTime(NaN)` leve, et couperait la construction de la chaine.
    expect(assainir({ fxDelayMix: NaN }).fxDelayMix).toBe(EFFETS_NEUTRES.fxDelayMix);
    expect(assainir({ fxEqLow: Infinity }).fxEqLow).toBe(EFFETS_NEUTRES.fxEqLow);
  });

  it("n'importe quoi rend les valeurs neutres", () => {
    for (const brut of [null, undefined, 42, "texte", []]) {
      expect(assainir(brut)).toEqual(EFFETS_NEUTRES);
    }
  });
});

describe("les pages restent d'accord", () => {
  it("un abonne recoit l'etat courant tout de suite", () => {
    /**
     * Sans cet appel immediat, un panneau afficherait ses valeurs par defaut
     * jusqu'au premier changement — pendant que le bus applique autre chose.
     * Deux verites concurrentes, dont une visible et fausse.
     */
    const s = stockageFactice();
    reglerEffetsMaitre({ fxDelayMix: 33 }, s);
    let vu = -1;
    sAbonnerEffets((p) => { vu = p.fxDelayMix; });
    expect(vu).toBe(33);
  });

  it("un changement reveille tous les abonnes", () => {
    const s = stockageFactice();
    const vus: number[] = [];
    sAbonnerEffets((p) => vus.push(p.fxEqMid));
    sAbonnerEffets((p) => vus.push(p.fxEqMid));
    vus.length = 0;
    reglerEffetsMaitre({ fxEqMid: 7 }, s);
    expect(vus).toEqual([7, 7]);
  });

  it("le desabonnement rendu coupe les notifications", () => {
    const s = stockageFactice();
    let n = 0;
    const stop = sAbonnerEffets(() => { n += 1; });
    n = 0;
    stop();
    reglerEffetsMaitre({ fxEqHigh: 4 }, s);
    expect(n).toBe(0);
  });

  it("un abonne qui leve ne prive pas les autres", () => {
    const s = stockageFactice();
    let atteint = false;
    sAbonnerEffets(() => { throw new Error("panneau casse"); });
    sAbonnerEffets(() => { atteint = true; });
    atteint = false;
    reglerEffetsMaitre({ fxDelayMix: 12 }, s);
    expect(atteint).toBe(true);
  });

  it("l'appelant recoit une copie, pas l'etat interne", () => {
    // Un panneau qui muterait l'objet rendu changerait le bus sans passer par
    // `reglerEffetsMaitre` — donc sans prevenir personne ni rien enregistrer.
    const s = stockageFactice();
    const p = effetsMaitre(s);
    p.fxDelayMix = 99;
    expect(effetsMaitre(s).fxDelayMix).toBe(EFFETS_NEUTRES.fxDelayMix);
  });
});
