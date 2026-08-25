import { describe, expect, it } from "vitest";
import { GAMMES } from "./gammes";
import {
  capturer,
  NOMS_DIRECTIONS, ORDRE_DIRECTIONS, PAS_MAX, PAS_MIN, VELOCITE_DEFAUT,
  basculerPas, ecrirePas, indexDuPas, pasAJouer, redimensionner,
  remplirAuHasard, sequenceVide, transposer, type Pas,
} from "./sequenceur";

const DO3 = 60;
const note = (n: number | null, actif = true): Pas => ({ note: n, velocite: VELOCITE_DEFAUT, actif });

describe("creation et redimensionnement", () => {
  it("une sequence vide n'a que des silences actifs", () => {
    const s = sequenceVide(8);
    expect(s).toHaveLength(8);
    for (const pas of s) {
      expect(pas.note).toBeNull();
      expect(pas.actif).toBe(true);
    }
  });

  it("borne la longueur", () => {
    expect(sequenceVide(0)).toHaveLength(PAS_MIN);
    expect(sequenceVide(999)).toHaveLength(PAS_MAX);
    expect(sequenceVide(NaN)).toHaveLength(PAS_MIN);
  });

  it("rallonger conserve ce qui etait ecrit", () => {
    const s = [note(60), note(64)];
    const long = redimensionner(s, 4);
    expect(long).toHaveLength(4);
    expect(long[0].note).toBe(60);
    expect(long[1].note).toBe(64);
    expect(long[2].note).toBeNull();
  });

  it("raccourcir ne touche pas aux pas gardes", () => {
    // Le tableau rendu est tronque, mais l'appelant garde l'original :
    // quelqu'un qui passe de 16 a 8 pour essayer, puis revient, ne doit pas
    // retrouver une sequence vide.
    const s = [note(60), note(62), note(64), note(65)];
    expect(redimensionner(s, 2)).toHaveLength(2);
    expect(s).toHaveLength(4);
    expect(redimensionner(s, 4)[3].note).toBe(65);
  });
});

describe("parcours des pas", () => {
  it("avant deroule puis reboucle", () => {
    expect([0, 1, 2, 3, 4].map((i) => indexDuPas(4, "avant", i))).toEqual([0, 1, 2, 3, 0]);
  });

  it("arriere part de la fin", () => {
    expect([0, 1, 2, 3].map((i) => indexDuPas(4, "arriere", i))).toEqual([3, 2, 1, 0]);
  });

  it("aller-retour ne rejoue pas les extremites deux fois", () => {
    // Le defaut classique : un cycle de 2n au lieu de 2n-2 donne
    // 0 1 2 3 3 2 1 0. On veut 0 1 2 3 2 1.
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => indexDuPas(4, "aller-retour", i)))
      .toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it("aleatoire reste dans la sequence, tirage extreme compris", () => {
    // `Math.floor(1 * n)` vaut n : sans borne, l'index depasse et le pas est
    // `undefined`.
    expect(indexDuPas(4, "aleatoire", 0, () => 1)).toBe(3);
    expect(indexDuPas(4, "aleatoire", 0, () => 0)).toBe(0);
    for (let i = 0; i < 50; i++) {
      const j = indexDuPas(6, "aleatoire", i);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThan(6);
    }
  });

  it("un seul pas ne divise pas par zero", () => {
    // `2n-2` vaut 0 pour n=1 : `i % 0` rend NaN, et `sequence[NaN]` est
    // `undefined`.
    for (const d of ORDRE_DIRECTIONS) {
      expect(indexDuPas(1, d, 7), `direction ${d}`).toBe(0);
    }
  });

  it("un compteur negatif ne casse rien", () => {
    for (const d of ORDRE_DIRECTIONS) {
      const j = indexDuPas(5, d, -3);
      expect(Number.isInteger(j), `direction ${d}`).toBe(true);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThan(5);
    }
  });

  it("aucune direction ne rend jamais un index hors bornes", () => {
    for (const d of ORDRE_DIRECTIONS) {
      for (let n = 1; n <= 8; n++) {
        for (let i = -5; i < 40; i++) {
          const j = indexDuPas(n, d, i);
          expect(j, `${d}, ${n} pas, tour ${i}`).toBeGreaterThanOrEqual(0);
          expect(j).toBeLessThan(n);
        }
      }
    }
  });
});

describe("ce qu'il faut jouer", () => {
  const sequence = [note(60), note(null), note(67), note(64, false)];

  it("rend la note d'un pas ecrit", () => {
    const r = pasAJouer(sequence, "avant", 0, "chromatique", DO3);
    expect(r).toEqual({ note: 60, velocite: VELOCITE_DEFAUT });
  });

  it("rend null sur un silence", () => {
    expect(pasAJouer(sequence, "avant", 1, "chromatique", DO3)).toBeNull();
  });

  it("rend null sur un pas eteint", () => {
    // Eteindre garde la note ecrite, contrairement au silence — mais du point
    // de vue de l'appelant, les deux ne donnent rien a envoyer.
    expect(pasAJouer(sequence, "avant", 3, "chromatique", DO3)).toBeNull();
    expect(sequence[3].note).toBe(64);
  });

  it("quantifie sur la gamme choisie", () => {
    // Changer de gamme apres avoir ecrit doit s'entendre : la quantification
    // se fait AUSSI a la lecture.
    const s = [note(61)]; // do diese
    expect(pasAJouer(s, "avant", 0, "chromatique", DO3)?.note).toBe(61);
    expect(pasAJouer(s, "avant", 0, "majeure", DO3)?.note).toBe(60);
    expect(pasAJouer(s, "avant", 0, "pentatonique_mineure", DO3)?.note).toBe(60);
  });

  it("borne la velocite dans la plage MIDI", () => {
    // 0 vaut note-off : une velocite nulle rendrait le pas muet sans le dire.
    const trop = [{ note: 60, velocite: 500, actif: true }];
    const rien = [{ note: 60, velocite: 0, actif: true }];
    expect(pasAJouer(trop, "avant", 0, "chromatique", DO3)?.velocite).toBe(127);
    expect(pasAJouer(rien, "avant", 0, "chromatique", DO3)?.velocite).toBe(1);
  });

  it("resiste a une note aberrante", () => {
    const casse = [{ note: NaN, velocite: 100, actif: true }];
    expect(pasAJouer(casse, "avant", 0, "chromatique", DO3)).toBeNull();
    const vel = [{ note: 60, velocite: NaN, actif: true }];
    expect(pasAJouer(vel, "avant", 0, "chromatique", DO3)?.velocite).toBe(VELOCITE_DEFAUT);
  });

  it("rend null sur une sequence vide", () => {
    expect(pasAJouer([], "avant", 0, "chromatique", DO3)).toBeNull();
  });
});

describe("transposition", () => {
  it("deplace les notes et garde les silences", () => {
    const s = transposer([note(60), note(null), note(64)], 12);
    expect(s[0].note).toBe(72);
    expect(s[1].note).toBeNull();
    expect(s[2].note).toBe(76);
  });

  it("tasse contre les bornes plutot que de replier", () => {
    // Replier ferait reapparaitre la melodie trois octaves plus bas : une
    // transposition extreme doit s'entendre comme extreme, pas comme fausse.
    expect(transposer([note(120)], 60)[0].note).toBe(127);
    expect(transposer([note(5)], -60)[0].note).toBe(0);
  });

  it("ne fait rien sur une valeur aberrante", () => {
    const s = [note(60)];
    expect(transposer(s, NaN)).toBe(s);
  });
});

describe("ecriture et bascule", () => {
  it("quantifie a l'ecriture", () => {
    // L'utilisateur doit voir tout de suite la note reellement retenue.
    const s = ecrirePas(sequenceVide(2), 0, 61, "majeure", DO3);
    expect(s[0].note).toBe(60);
  });

  it("efface avec null", () => {
    const s = ecrirePas([note(60)], 0, null, "chromatique", DO3);
    expect(s[0].note).toBeNull();
  });

  it("ignore un index hors bornes plutot que de lever", () => {
    const s = [note(60)];
    expect(ecrirePas(s, 5, 64, "chromatique", DO3)).toBe(s);
    expect(basculerPas(s, -1)).toBe(s);
  });

  it("bascule sans toucher a la note", () => {
    const s = basculerPas([note(60)], 0);
    expect(s[0].actif).toBe(false);
    expect(s[0].note).toBe(60);
    expect(basculerPas(s, 0)[0].actif).toBe(true);
  });

  it("ne mute jamais la sequence recue", () => {
    // Le rendu React compare les references : muter en place n'afficherait
    // pas le changement.
    const s = [note(60)];
    expect(ecrirePas(s, 0, 64, "chromatique", DO3)).not.toBe(s);
    expect(s[0].note).toBe(60);
    expect(basculerPas(s, 0)).not.toBe(s);
    expect(s[0].actif).toBe(true);
  });
});

describe("remplissage au hasard", () => {
  it("ne rend que des notes de la gamme", () => {
    for (const pas of remplirAuHasard(32, "pentatonique_mineure", DO3, 1)) {
      if (pas.note === null) continue;
      const classe = ((pas.note - DO3) % 12 + 12) % 12;
      expect(GAMMES.pentatonique_mineure).toContain(classe);
    }
  });

  it("laisse des silences", () => {
    // Une sequence pleine sonne comme une gamme montee au hasard, pas comme
    // une phrase.
    const s = remplirAuHasard(16, "majeure", DO3, 0.5, () => 0.9);
    expect(s.every((p) => p.note === null)).toBe(true);
  });

  it("reste dans les bornes MIDI", () => {
    for (const pas of remplirAuHasard(32, "majeure", 120, 1)) {
      if (pas.note === null) continue;
      expect(pas.note).toBeGreaterThanOrEqual(0);
      expect(pas.note).toBeLessThanOrEqual(127);
    }
  });
});

describe("listes d'affichage", () => {
  it("couvrent toutes les directions", () => {
    expect([...ORDRE_DIRECTIONS].sort()).toEqual(Object.keys(NOMS_DIRECTIONS).sort());
    for (const d of ORDRE_DIRECTIONS) expect(NOMS_DIRECTIONS[d]).toBeTruthy();
  });
});

describe("enregistrement pas a pas", () => {
  const vide = (n: number) => sequenceVide(n);

  it("ecrit la note jouee dans la case du curseur", () => {
    const r = capturer(vide(4), 0, 60, 90);
    expect(r.sequence[0]).toEqual({ note: 60, velocite: 90, actif: true });
  });

  it("avance d'une case a chaque note", () => {
    let etat = { sequence: vide(4), curseur: 0, termine: false };
    for (const note of [60, 62, 64]) etat = capturer(etat.sequence, etat.curseur, note);
    expect(etat.curseur).toBe(3);
    expect(etat.sequence.map((p) => p.note)).toEqual([60, 62, 64, null]);
  });

  it("s'annonce termine a la derniere case, et pas avant", () => {
    // Le point qui compte. Repartir a zero effacerait silencieusement ce qu'on
    // vient d'enregistrer, et on ne s'en apercevrait qu'en ecoutant — trop
    // tard. `termine` laisse l'appelant couper l'enregistrement.
    let etat = { sequence: vide(3), curseur: 0, termine: false };
    etat = capturer(etat.sequence, etat.curseur, 60);
    expect(etat.termine).toBe(false);
    etat = capturer(etat.sequence, etat.curseur, 62);
    expect(etat.termine).toBe(false);
    etat = capturer(etat.sequence, etat.curseur, 64);
    expect(etat.termine).toBe(true);
  });

  it("ne touche jamais la sequence d'origine", () => {
    // Une ecriture en place laisserait React aveugle au changement, et
    // interdirait tout retour en arriere.
    const avant = vide(4);
    const copie = JSON.parse(JSON.stringify(avant));
    capturer(avant, 0, 60);
    expect(avant).toEqual(copie);
  });

  it("laisse le curseur ou il est sur une note hors MIDI", () => {
    // Avancer laisserait un TROU dans la phrase pour une note que la machine
    // n'a de toute facon pas pu jouer.
    for (const note of [-1, 128, 999, NaN, Infinity]) {
      const r = capturer(vide(4), 2, note);
      expect(r.curseur, `note ${note}`).toBe(2);
      expect(r.sequence[2].note, `note ${note}`).toBeNull();
    }
  });

  it("borne la velocite au lieu de la transmettre telle quelle", () => {
    expect(capturer(vide(2), 0, 60, 999).sequence[0].velocite).toBe(127);
    expect(capturer(vide(2), 0, 60, 0).sequence[0].velocite).toBe(1);
    expect(capturer(vide(2), 0, 60, NaN).sequence[0].velocite).toBe(VELOCITE_DEFAUT);
  });

  it("ramene un curseur aberrant dans la sequence", () => {
    // Une longueur reduite pendant l'enregistrement laisserait le curseur
    // au-dela de la fin.
    const r = capturer(vide(3), 99, 60);
    expect(r.sequence[2].note).toBe(60);
    expect(r.termine).toBe(true);
  });

  it("ne fabrique pas de sequence quand il n'y en a pas", () => {
    // La longueur est un reglage, pas un accident : en inventer une ici
    // ferait apparaitre des pas que personne n'a demandes.
    const r = capturer([], 0, 60);
    expect(r.sequence).toEqual([]);
    expect(r.termine).toBe(true);
  });

  it("marque le pas actif : une note enregistree doit s'entendre", () => {
    const desactive = vide(2).map((p) => ({ ...p, actif: false }));
    expect(capturer(desactive, 0, 60).sequence[0].actif).toBe(true);
  });
});
