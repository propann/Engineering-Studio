import { describe, expect, it } from "vitest";
import {
  GAMMES, NOMS_GAMMES, NOMS_MOTIFS, NOTE_MAX, ORDRE_GAMMES, ORDRE_MOTIFS,
  pasArpege, quantifier, reservoir, type Gamme, type Motif,
} from "./musique";

const DO3 = 60; // do central, tonique de reference dans tous les cas ci-dessous

describe("gammes", () => {
  it("chaque gamme part de la tonique", () => {
    // Un degre 0 absent decalerait toute la gamme d'un demi-ton sans que rien
    // ne le signale.
    for (const g of ORDRE_GAMMES) expect(GAMMES[g][0]).toBe(0);
  });

  it("chaque gamme est triee et sans doublon", () => {
    // `quantifier` parcourt les degres en cherchant le plus proche : un
    // doublon ne casserait rien, mais un degre hors de [0,12[ ferait sortir
    // le resultat de l'octave.
    for (const g of ORDRE_GAMMES) {
      const d = GAMMES[g];
      expect([...new Set(d)], `${g} a un doublon`).toHaveLength(d.length);
      expect([...d].sort((a, b) => a - b), `${g} n'est pas triee`).toEqual([...d]);
      expect(Math.min(...d)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...d)).toBeLessThan(12);
    }
  });

  it("les pentatoniques ont bien cinq notes", () => {
    expect(GAMMES.pentatonique_majeure).toHaveLength(5);
    expect(GAMMES.pentatonique_mineure).toHaveLength(5);
  });

  it("l'ordre d'affichage couvre toutes les gammes, et les noms aussi", () => {
    const toutes = Object.keys(GAMMES) as Gamme[];
    expect([...ORDRE_GAMMES].sort()).toEqual([...toutes].sort());
    for (const g of toutes) expect(NOMS_GAMMES[g], `${g} sans nom`).toBeTruthy();
  });

  it("la chromatique vient en premier : c'est « ne rien contraindre »", () => {
    expect(ORDRE_GAMMES[0]).toBe("chromatique");
  });
});

describe("quantifier", () => {
  it("laisse passer une note deja dans la gamme", () => {
    for (const d of GAMMES.pentatonique_majeure) {
      expect(quantifier(DO3 + d, DO3, "pentatonique_majeure")).toBe(DO3 + d);
    }
  });

  it("ne change jamais rien en chromatique", () => {
    for (let n = 0; n <= NOTE_MAX; n++) expect(quantifier(n, DO3, "chromatique")).toBe(n);
  });

  it("remonte au do superieur plutot que de descendre au la", () => {
    // Le cas qui compte. Un si (71) en pentatonique majeure de do est a 2
    // demi-tons du la (69) mais a 1 seul du do au-dessus (72). Ignorer le
    // repli a l'octave ferait descendre toutes les sensibles — ca s'entend.
    expect(quantifier(71, DO3, "pentatonique_majeure")).toBe(72);
  });

  it("descend en cas d'egalite", () => {
    // Un do# (61) en majeure est a 1 demi-ton du do et du re. Sans regle
    // fixe, le resultat dependrait de l'ordre de declaration des degres.
    expect(quantifier(61, DO3, "majeure")).toBe(60);
  });

  it("respecte l'octave de la note, pas seulement sa classe", () => {
    // Un fa# deux octaves plus haut doit rester deux octaves plus haut.
    expect(quantifier(66 + 24, DO3, "majeure")).toBe(65 + 24);
  });

  it("fonctionne sous la tonique", () => {
    // L'ecart devient negatif : un modulo naif rendrait une classe negative
    // et le resultat partirait dans la mauvaise octave.
    expect(quantifier(DO3 - 1, DO3, "majeure")).toBe(DO3 - 1); // si, degre 11
    expect(quantifier(DO3 - 13, DO3, "pentatonique_majeure")).toBe(DO3 - 12);
  });

  it("reste dans les bornes MIDI", () => {
    for (const g of ORDRE_GAMMES) {
      for (const n of [0, 1, 126, 127]) {
        const r = quantifier(n, DO3, g);
        expect(r, `${g} sur ${n}`).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(NOTE_MAX);
      }
    }
  });

  it("rend toujours un degre de la gamme", () => {
    // L'invariant central : quantifier doit quantifier.
    for (const g of ORDRE_GAMMES) {
      for (let n = 40; n <= 90; n++) {
        const r = quantifier(n, DO3, g);
        const classe = ((r - DO3) % 12 + 12) % 12;
        expect(GAMMES[g], `${g} : ${n} → ${r} (classe ${classe})`).toContain(classe);
      }
    }
  });

  it("suit la tonique", () => {
    // Meme gamme, tonique differente : un fa# est dans la majeure de sol.
    expect(quantifier(66, 67, "majeure")).toBe(66);
    // ...et pas dans celle de do, ou il tombe sur le fa (egalite → on descend).
    expect(quantifier(66, 60, "majeure")).toBe(65);
  });
});

describe("reservoir", () => {
  it("trie les notes tenues", () => {
    // « Montant » doit monter, quel que soit l'ordre des doigts.
    expect(reservoir([67, 60, 64], 1)).toEqual([60, 64, 67]);
  });

  it("supprime les doublons", () => {
    expect(reservoir([60, 60, 64], 1)).toEqual([60, 64]);
  });

  it("empile les octaves", () => {
    expect(reservoir([60, 64], 2)).toEqual([60, 64, 72, 76]);
  });

  it("borne le nombre d'octaves", () => {
    expect(reservoir([60], 99)).toHaveLength(4);
    expect(reservoir([60], 0)).toHaveLength(1);
  });

  it("ne depasse jamais 127", () => {
    // Un si aigu sur 4 octaves sortirait de la plage MIDI : la note serait
    // envoyee et silencieusement ignoree, ou pire, repliee par le materiel.
    for (const n of reservoir([120, 125], 4)) expect(n).toBeLessThanOrEqual(NOTE_MAX);
  });

  it("rend un tableau vide quand rien n'est tenu", () => {
    expect(reservoir([], 2)).toEqual([]);
  });
});

describe("motifs d'arpege", () => {
  const ACCORD = [60, 64, 67];
  const suite = (m: Motif, n: number, notes = ACCORD, oct = 1) =>
    Array.from({ length: n }, (_, i) => pasArpege(notes, m, i, oct).join("+"));

  it("montant parcourt puis reboucle", () => {
    expect(suite("haut", 5)).toEqual(["60", "64", "67", "60", "64"]);
  });

  it("descendant part du haut", () => {
    expect(suite("bas", 4)).toEqual(["67", "64", "60", "67"]);
  });

  it("montant-descendant ne joue pas les extremites deux fois", () => {
    // Le defaut classique de l'arpegiateur : un cycle de 2n au lieu de 2n-2
    // donne do mi sol sol mi do. On veut do mi sol mi.
    expect(suite("haut-bas", 8)).toEqual(["60", "64", "67", "64", "60", "64", "67", "64"]);
  });

  it("descendant-montant est le miroir exact", () => {
    expect(suite("bas-haut", 8)).toEqual(["67", "64", "60", "64", "67", "64", "60", "64"]);
  });

  it("accord rend toutes les notes d'un coup", () => {
    expect(pasArpege(ACCORD, "accord", 0)).toEqual([60, 64, 67]);
    // ...et le meme accord a tous les pas : il ne se deroule pas.
    expect(pasArpege(ACCORD, "accord", 7)).toEqual([60, 64, 67]);
  });

  it("accord suit les octaves", () => {
    expect(pasArpege([60], "accord", 0, 3)).toEqual([60, 72, 84]);
  });

  it("aleatoire reste dans le reservoir", () => {
    for (let i = 0; i < 50; i++) {
      const [n] = pasArpege(ACCORD, "aleatoire", i);
      expect(ACCORD).toContain(n);
    }
  });

  it("aleatoire ne sort jamais du tableau, tirage extreme compris", () => {
    // `Math.floor(1 * n)` vaut n : sans borne, l'index depasse et rend
    // `undefined`, qui partirait tel quel dans un paquet MIDI.
    expect(pasArpege(ACCORD, "aleatoire", 0, 1, () => 1)).toEqual([67]);
    expect(pasArpege(ACCORD, "aleatoire", 0, 1, () => 0)).toEqual([60]);
    expect(pasArpege(ACCORD, "aleatoire", 0, 1, () => 0.999999)).toEqual([67]);
  });

  it("une seule note tenue : tous les motifs la rendent", () => {
    // Le cas qui divise par zero. `2n-2` vaut 0 pour n=1, donc `i % 0` = NaN
    // et `pool[NaN]` = undefined — une note `undefined` dans un paquet MIDI.
    for (const m of ORDRE_MOTIFS) {
      expect(pasArpege([60], m, 3, 1), `motif ${m}`).toEqual([60]);
    }
  });

  it("rien de tenu : tous les motifs rendent un tableau vide", () => {
    for (const m of ORDRE_MOTIFS) {
      expect(pasArpege([], m, 5), `motif ${m}`).toEqual([]);
    }
  });

  it("aucun motif ne rend jamais undefined", () => {
    // Le filet global : une note undefined traverse `buildMidiNotePacket`
    // et ne se voit qu'a l'oreille, comme un silence.
    for (const m of ORDRE_MOTIFS) {
      for (let i = 0; i < 30; i++) {
        for (const notes of [[60], [60, 64], ACCORD, [60, 62, 64, 65, 67]]) {
          for (const oct of [1, 2, 3]) {
            for (const n of pasArpege(notes, m, i, oct)) {
              expect(Number.isInteger(n), `${m} pas ${i}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it("un index negatif ne casse rien", () => {
    for (const m of ORDRE_MOTIFS) {
      expect(() => pasArpege(ACCORD, m, -5)).not.toThrow();
      for (const n of pasArpege(ACCORD, m, -5)) expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("l'ordre d'affichage couvre tous les motifs, et les noms aussi", () => {
    for (const m of ORDRE_MOTIFS) expect(NOMS_MOTIFS[m], `${m} sans nom`).toBeTruthy();
    expect(ORDRE_MOTIFS).toHaveLength(Object.keys(NOMS_MOTIFS).length);
  });
});
