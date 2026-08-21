import { describe, expect, it } from "vitest";
import { FAMILLES, GAMMES, NOMS_GAMMES, NOMS_NOTES, ORDRE_GAMMES, type Gamme } from "./gammes";
import { quantifier } from "./arpege";

const TOUTES = Object.keys(GAMMES) as Gamme[];
const DO3 = 60;

describe("forme des gammes", () => {
  it("chacune part de la tonique", () => {
    // Un degre 0 absent decalerait toute la gamme d'un demi-ton sans que rien
    // ne le signale.
    for (const g of TOUTES) expect(GAMMES[g][0], g).toBe(0);
  });

  it("chacune est triee, sans doublon, dans l'octave", () => {
    // `quantifier` parcourt les degres en cherchant le plus proche : un degre
    // hors de [0,12[ ferait sortir le resultat de son octave.
    for (const g of TOUTES) {
      const d = GAMMES[g];
      expect([...new Set(d)], `${g} a un doublon`).toHaveLength(d.length);
      expect([...d].sort((a, b) => a - b), `${g} n'est pas triee`).toEqual([...d]);
      expect(Math.min(...d), `${g} a un degre negatif`).toBeGreaterThanOrEqual(0);
      expect(Math.max(...d), `${g} depasse l'octave`).toBeLessThan(12);
    }
  });

  it("aucune n'est vide", () => {
    for (const g of TOUTES) expect(GAMMES[g].length, g).toBeGreaterThan(0);
  });

  it("aucune paire n'a exactement les memes degres", () => {
    // Deux gammes identiques sous deux noms sont un piege : l'utilisateur
    // croirait entendre une difference. Les synonymes doivent etre annonces
    // dans le NOM, pas dupliques en entrees.
    const vues = new Map<string, Gamme>();
    for (const g of TOUTES) {
      const clef = GAMMES[g].join(",");
      const deja = vues.get(clef);
      expect(deja, `${g} a les memes degres que ${deja}`).toBeUndefined();
      vues.set(clef, g);
    }
  });
});

describe("justesse musicale", () => {
  // Les degres sont verifies contre leur definition, pas contre eux-memes.
  // Une gamme fausse est un defaut qu'aucun invariant de forme n'attrape.
  const ATTENDU: Partial<Record<Gamme, number[]>> = {
    majeure: [0, 2, 4, 5, 7, 9, 11],
    mineure: [0, 2, 3, 5, 7, 8, 10],
    dorien: [0, 2, 3, 5, 7, 9, 10],
    phrygien: [0, 1, 3, 5, 7, 8, 10],
    lydien: [0, 2, 4, 6, 7, 9, 11],
    mixolydien: [0, 2, 4, 5, 7, 9, 10],
    locrien: [0, 1, 3, 5, 6, 8, 10],
    mineure_harmonique: [0, 2, 3, 5, 7, 8, 11],
    mineure_melodique: [0, 2, 3, 5, 7, 9, 11],
    pentatonique_majeure: [0, 2, 4, 7, 9],
    pentatonique_mineure: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    ton_par_ton: [0, 2, 4, 6, 8, 10],
    phrygien_dominant: [0, 1, 4, 5, 7, 8, 10],
    double_harmonique: [0, 1, 4, 5, 7, 8, 11],
    hirajoshi: [0, 2, 3, 7, 8],
    alteree: [0, 1, 3, 4, 6, 8, 10],
  };

  for (const [nom, degres] of Object.entries(ATTENDU)) {
    it(`${nom} a les bons degres`, () => {
      expect([...GAMMES[nom as Gamme]]).toEqual(degres);
    });
  }

  it("les modes sont bien des rotations de la majeure", () => {
    // Test structurel au sens musical : dorien est la majeure demarree au 2e
    // degre, phrygien au 3e, etc. Une faute de frappe dans un mode le casse.
    const majeure = [...GAMMES.majeure];
    const rotation = (n: number) =>
      majeure.map((_, i) => (majeure[(i + n) % 7] - majeure[n] + 12) % 12).sort((a, b) => a - b);
    expect([...GAMMES.dorien]).toEqual(rotation(1));
    expect([...GAMMES.phrygien]).toEqual(rotation(2));
    expect([...GAMMES.lydien]).toEqual(rotation(3));
    expect([...GAMMES.mixolydien]).toEqual(rotation(4));
    expect([...GAMMES.mineure]).toEqual(rotation(5));
    expect([...GAMMES.locrien]).toEqual(rotation(6));
  });

  it("les symetriques se repetent bien", () => {
    // Le ton par ton se transpose en lui-meme d'un ton ; la diminuee d'un ton
    // et demi. C'est leur definition, et le seul test qui la verifie.
    const transposee = (g: Gamme, n: number) =>
      [...new Set(GAMMES[g].map((d) => (d + n) % 12))].sort((a, b) => a - b);
    expect(transposee("ton_par_ton", 2)).toEqual([...GAMMES.ton_par_ton]);
    expect(transposee("diminuee_ton_demi", 3)).toEqual([...GAMMES.diminuee_ton_demi]);
    expect(transposee("augmentee", 4)).toEqual([...GAMMES.augmentee]);
  });

  it("les pentatoniques ont cinq notes, les heptatoniques sept", () => {
    for (const g of ["pentatonique_majeure", "pentatonique_mineure", "japonaise", "in_sen",
                     "hirajoshi", "kumoi", "iwato", "egyptienne"] as Gamme[]) {
      expect(GAMMES[g], g).toHaveLength(5);
    }
    for (const g of ["majeure", "mineure", "dorien", "phrygien", "lydien", "mixolydien",
                     "locrien", "mineure_harmonique", "mineure_melodique",
                     "double_harmonique", "hongroise_mineure", "phrygien_dominant",
                     "alteree", "lydien_b7"] as Gamme[]) {
      expect(GAMMES[g], g).toHaveLength(7);
    }
  });

  it("la chromatique contient tout, et elle seule", () => {
    expect(GAMMES.chromatique).toHaveLength(12);
    for (const g of TOUTES) {
      if (g !== "chromatique") expect(GAMMES[g].length, g).toBeLessThan(12);
    }
  });
});

describe("familles et affichage", () => {
  it("les familles couvrent toutes les gammes, une seule fois chacune", () => {
    // Une gamme oubliee serait simplement absente du menu — sans erreur nulle
    // part. Une gamme dans deux familles apparaitrait deux fois.
    const plates = FAMILLES.flatMap((f) => f.gammes);
    expect([...plates].sort()).toEqual([...TOUTES].sort());
    expect(new Set(plates).size).toBe(plates.length);
  });

  it("l'ordre d'affichage est derive des familles", () => {
    // Derive et non ecrit a cote : deux listes divergeraient a la premiere
    // gamme ajoutee.
    expect(ORDRE_GAMMES).toEqual(FAMILLES.flatMap((f) => f.gammes));
  });

  it("aucune famille n'est vide et chacune a un nom", () => {
    for (const f of FAMILLES) {
      expect(f.nom.trim().length, JSON.stringify(f)).toBeGreaterThan(0);
      expect(f.gammes.length, f.nom).toBeGreaterThan(0);
    }
  });

  it("la chromatique vient en premier : c'est « ne rien contraindre »", () => {
    expect(ORDRE_GAMMES[0]).toBe("chromatique");
  });

  it("chaque gamme a un nom lisible, et aucun n'est en double", () => {
    const noms = TOUTES.map((g) => NOMS_GAMMES[g]);
    for (const [i, n] of noms.entries()) {
      expect(n, `${TOUTES[i]} sans nom`).toBeTruthy();
      expect(n, `${TOUTES[i]} : nom identique au slug`).not.toBe(TOUTES[i]);
    }
    expect(new Set(noms).size, "deux gammes portent le meme nom").toBe(noms.length);
  });

  it("les douze noms de notes sont la, dans l'ordre", () => {
    expect(NOMS_NOTES).toHaveLength(12);
    expect(NOMS_NOTES[0]).toBe("C");
    expect(NOMS_NOTES[11]).toBe("B");
  });
});

describe("toutes les gammes quantifient reellement", () => {
  it("chaque gamme rend toujours un de ses degres", () => {
    // L'invariant central, applique aux 29. Une gamme mal formee le casse.
    for (const g of TOUTES) {
      for (let n = 36; n <= 96; n++) {
        const r = quantifier(n, DO3, g);
        const classe = ((r - DO3) % 12 + 12) % 12;
        expect(GAMMES[g], `${g} : ${n} → ${r}`).toContain(classe);
      }
    }
  });

  it("aucune gamme ne fait sortir des bornes MIDI", () => {
    for (const g of TOUTES) {
      for (const n of [0, 1, 2, 125, 126, 127]) {
        const r = quantifier(n, DO3, g);
        expect(r, `${g} sur ${n}`).toBeGreaterThanOrEqual(0);
        expect(r, `${g} sur ${n}`).toBeLessThanOrEqual(127);
      }
    }
  });

  it("aucune gamme ne deplace une note de plus de six demi-tons", () => {
    // Une quantification qui deplace de plus d'un triton a rate le degre le
    // plus proche : ce serait un defaut de recherche, pas de gamme.
    for (const g of TOUTES) {
      for (let n = 40; n <= 90; n++) {
        expect(Math.abs(quantifier(n, DO3, g) - n), `${g} sur ${n}`).toBeLessThanOrEqual(6);
      }
    }
  });
});
