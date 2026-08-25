import { describe, expect, it } from "vitest";
import { BANDES_EQ, EQ_DB_MAX } from "./effets";
import { courbeEq, reponseEqDb } from "./reponseEq";

/**
 * La courbe affichée doit être celle qu'on entend.
 *
 * Ces tests ne comparent pas la sortie à des valeurs recopiées d'une exécution
 * précédente — ça verrouillerait un bug aussi bien qu'une correction. Ils
 * s'appuient sur des propriétés EXACTES des filtres en plateau et en cloche,
 * vraies indépendamment de l'implémentation :
 *
 * - un plateau grave vaut son gain en continu, et 0 dB à Nyquist ;
 * - un plateau aigu fait l'inverse ;
 * - une cloche vaut exactement son gain à sa fréquence centrale ;
 * - à gain nul, la chaîne entière est l'identité.
 *
 * Si le calcul dérive, ces égalités cassent. Elles ne peuvent pas être
 * satisfaites par accident.
 *
 * Un sabotage a été essayé et volontairement NON couvert : inverser le signe
 * de la partie imaginaire. Il ne change rien, et c'est correct — |a+bi| vaut
 * |a−bi|. Ce signe ne porte que la phase, qu'on ne trace pas. Écrire un test
 * qui le verrouille reviendrait à figer un détail sans effet observable.
 */

const PLAT = { fxEqLow: 0, fxEqMid: 0, fxEqHigh: 0 };
const ECH = 44100;
const NYQUIST = ECH / 2;

const bande = (reglage: string) => {
  const b = BANDES_EQ.find((x) => x.reglage === reglage);
  if (!b) throw new Error(`bande ${reglage} absente de BANDES_EQ`);
  return b;
};

describe("la courbe est plate quand rien n'est réglé", () => {
  it("vaut 0 dB partout à gain nul", () => {
    for (const f of [20, 100, 220, 1200, 5200, 12000, 20000]) {
      expect(reponseEqDb(PLAT, f, ECH), `${f} Hz`).toBeCloseTo(0, 10);
    }
  });

  it("reste plate même en poussant l'échantillonnage", () => {
    // Un bug de conversion fréquence → pulsation se verrait ici et pas à 44,1.
    for (const ech of [22050, 48000, 96000]) {
      expect(reponseEqDb(PLAT, 1000, ech), `${ech} Hz`).toBeCloseTo(0, 10);
    }
  });
});

describe("chaque bande vaut son gain là où elle agit", () => {
  it("la cloche vaut exactement son gain à sa fréquence centrale", () => {
    // Propriété exacte du peaking EQ : à f0, |H| = A² = 10^(gain/20).
    const medium = bande("fxEqMid");
    for (const gain of [-EQ_DB_MAX, -6, 6, EQ_DB_MAX]) {
      const db = reponseEqDb({ ...PLAT, fxEqMid: gain }, medium.frequence, ECH);
      expect(db, `${gain} dB`).toBeCloseTo(gain, 6);
    }
  });

  it("le plateau grave vaut son gain en continu et s'efface à Nyquist", () => {
    for (const gain of [-EQ_DB_MAX, EQ_DB_MAX]) {
      const p = { ...PLAT, fxEqLow: gain };
      // Pas exactement 0 Hz : log10(0) n'existe pas et la limite est atteinte
      // bien avant. À 1 Hz le plateau est établi.
      expect(reponseEqDb(p, 1, ECH), `continu, ${gain} dB`).toBeCloseTo(gain, 3);
      expect(reponseEqDb(p, NYQUIST, ECH), `Nyquist, ${gain} dB`).toBeCloseTo(0, 6);
    }
  });

  it("le plateau aigu fait l'inverse", () => {
    for (const gain of [-EQ_DB_MAX, EQ_DB_MAX]) {
      const p = { ...PLAT, fxEqHigh: gain };
      expect(reponseEqDb(p, NYQUIST, ECH), `Nyquist, ${gain} dB`).toBeCloseTo(gain, 3);
      expect(reponseEqDb(p, 1, ECH), `continu, ${gain} dB`).toBeCloseTo(0, 6);
    }
  });
});

describe("le Q de la cloche règle bien sa largeur", () => {
  /**
   * Ce test existe parce que les autres ne le voyaient pas.
   *
   * Sabotage : remplacer `sin / (2 * Q)` par `sin / 2` — donc ignorer Q — ne
   * faisait échouer AUCUN test. Le sommet d'une cloche vaut A² quel que soit
   * Q : c'est sa LARGEUR que Q commande, et rien ne la regardait.
   *
   * L'Audio EQ Cookbook donne la relation exacte entre Q et la largeur de
   * bande, mesurée entre les deux fréquences où le gain vaut la moitié du
   * sommet en dB :
   *
   *     1/Q = 2·sinh( (ln2 / 2) · BW · w0/sin(w0) )
   *
   * Le facteur w0/sin(w0) est la correction numérique : sans lui la relation
   * n'est vraie qu'en analogique. On inverse pour obtenir BW, et on vérifie
   * que la courbe vaut bien la moitié du gain à ces deux fréquences-là.
   */
  it("les bornes à mi-gain tombent où la relation les prédit", () => {
    const medium = bande("fxEqMid");
    const gain = 12;
    const w0 = (2 * Math.PI * medium.frequence) / ECH;
    const largeurOctaves =
      Math.asinh(1 / (2 * (medium.q ?? 1))) / ((Math.log(2) / 2) * (w0 / Math.sin(w0)));

    const ecart = Math.pow(2, largeurOctaves / 2);
    const p = { ...PLAT, fxEqMid: gain };

    expect(reponseEqDb(p, medium.frequence / ecart, ECH), "borne basse").toBeCloseTo(gain / 2, 1);
    expect(reponseEqDb(p, medium.frequence * ecart, ECH), "borne haute").toBeCloseTo(gain / 2, 1);
  });

  it("la cloche est bien plus étroite que la bande audible", () => {
    // Garde-fou grossier, mais il attrape un Q parti à l'unité par accident :
    // deux octaves plus loin, il ne doit presque plus rien rester.
    const medium = bande("fxEqMid");
    const loin = reponseEqDb({ ...PLAT, fxEqMid: EQ_DB_MAX }, medium.frequence * 4, ECH);
    expect(loin).toBeLessThan(EQ_DB_MAX / 3);
  });
});

describe("les bandes se composent", () => {
  it("trois gains égaux ne se contredisent pas au centre de la cloche", () => {
    // Les filtres sont en série : les décibels s'additionnent. Un signe inversé
    // quelque part ferait s'annuler ce qui devrait s'ajouter.
    const seule = reponseEqDb({ ...PLAT, fxEqMid: 6 }, bande("fxEqMid").frequence, ECH);
    const toutes = reponseEqDb({ fxEqLow: 6, fxEqMid: 6, fxEqHigh: 6 }, bande("fxEqMid").frequence, ECH);
    expect(toutes).toBeGreaterThan(seule);
  });

  it("un gain et son opposé se compensent exactement", () => {
    for (const f of [50, 220, 1200, 5200, 15000]) {
      const monte = reponseEqDb({ ...PLAT, fxEqLow: 9 }, f, ECH);
      const descend = reponseEqDb({ ...PLAT, fxEqLow: -9 }, f, ECH);
      // Les plateaux ne sont pas rigoureusement symétriques en dB, mais un
      // écart de plus d'un décibel trahirait une erreur de coefficient.
      expect(monte + descend, `${f} Hz`).toBeCloseTo(0, 0);
    }
  });
});

describe("la courbe tracée", () => {
  const courbe = courbeEq({ fxEqLow: 6, fxEqMid: -6, fxEqHigh: 3 });

  it("couvre la bande audible, bornes comprises", () => {
    expect(courbe[0].frequence).toBeCloseTo(20, 6);
    expect(courbe.at(-1)!.frequence).toBeCloseTo(20000, 6);
  });

  it("échantillonne en octaves, pas en hertz", () => {
    // Un pas linéaire donnerait une poignée de points sous 1 kHz. En
    // logarithmique, la moitié des points tombe avant la moyenne géométrique.
    const milieu = Math.sqrt(20 * 20000);
    const avant = courbe.filter((p) => p.frequence < milieu).length;
    expect(Math.abs(avant - courbe.length / 2)).toBeLessThanOrEqual(1);
  });

  it("ne produit ni NaN ni infini, à fond dans les deux sens", () => {
    for (const gain of [-EQ_DB_MAX, EQ_DB_MAX]) {
      for (const p of courbeEq({ fxEqLow: gain, fxEqMid: gain, fxEqHigh: gain })) {
        expect(Number.isFinite(p.db), `${p.frequence} Hz à ${gain} dB`).toBe(true);
      }
    }
  });

  it("rend bien le nombre de points demandé", () => {
    expect(courbeEq(PLAT, 40)).toHaveLength(40);
  });
});
