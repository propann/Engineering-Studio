import { describe, expect, it } from "vitest";
import {
  GATE_DEFAUT, GATE_MAX, GATE_MIN, NOTE_MIN_MS, ORDRE_DIVISIONS,
  bpmSain, coupureGateMs, dureeMs,
} from "./divisions";

/**
 * La longueur de note.
 *
 * Ce qui compte ici n'est pas l'arithmetique — un pourcentage d'une duree —
 * mais les cas ou il ne faut PAS programmer de coupure. Chaque coupure
 * programmee est une minuterie de plus, donc une note qui peut rester coincee
 * si elle tombe au mauvais moment. Le module d'origine n'en avait aucune, et
 * c'etait ecrit dans son code comme une decision.
 */

describe("longueur de note", () => {
  const PAS = dureeMs(bpmSain(120), "1/4"); // 500 ms

  it("ne coupe rien a fond : le pas suivant s'en charge, comme avant", () => {
    // Le point qui compte le plus. A 100 %, le comportement doit etre
    // EXACTEMENT celui d'avant le reglage — pas « presque, a une minuterie
    // pres ». `null` dit a l'appelant de n'en programmer aucune.
    expect(coupureGateMs(PAS, GATE_MAX)).toBeNull();
    expect(coupureGateMs(PAS, GATE_DEFAUT)).toBeNull();
    expect(GATE_DEFAUT).toBe(GATE_MAX);
  });

  it("coupe a la moitie du pas a 50 %", () => {
    expect(coupureGateMs(PAS, 50)).toBeCloseTo(PAS / 2, 6);
  });

  it("coupe toujours AVANT le pas suivant", () => {
    // Une note-off programmee au moment ou part la note-on suivante est une
    // course dont l'issue depend de l'ordonnanceur : elle couperait parfois la
    // note NEUVE, et l'arpege sauterait une note au hasard.
    for (const bpm of [40, 90, 120, 200]) {
      for (const div of ORDRE_DIVISIONS) {
        const pas = dureeMs(bpmSain(bpm), div);
        for (const gate of [10, 25, 50, 75, 99]) {
          const c = coupureGateMs(pas, gate);
          if (c !== null) expect(c, `${bpm} ${div} ${gate}%`).toBeLessThan(pas);
        }
      }
    }
  });

  it("ne descend jamais sous la duree audible d'une note", () => {
    // Sous ~15 ms, la note-off part dans la meme bouffee MIDI que la note-on :
    // on entend un clic, ou rien.
    for (const pas of [40, 100, 500, 2000]) {
      const c = coupureGateMs(pas, GATE_MIN);
      if (c !== null) expect(c, `pas de ${pas} ms`).toBeGreaterThanOrEqual(NOTE_MIN_MS);
    }
  });

  it("sature au plancher plutot que de descendre sous l'audible", () => {
    // A 20 ms de pas, un gate de 10 % demanderait 2 ms. Le plancher rend 15,
    // ce qui coupe toujours avant le pas suivant : la note existe, meme si le
    // curseur ne mord plus. C'est le bon compromis — un clic ne serait pas
    // « un gate tres court », ce serait un defaut.
    expect(coupureGateMs(20, 10)).toBe(NOTE_MIN_MS);
  });

  it("renonce quand meme le plancher rejoindrait le pas suivant", () => {
    // Pas plus court que la duree audible d'une note. Mieux vaut jouer lie que
    // programmer une minuterie qui ne peut rien produire de bon — et une
    // minuterie de moins, c'est une note de moins qui peut rester coincee.
    for (const pas of [15, 12, 5, 1]) {
      expect(coupureGateMs(pas, 10), `pas de ${pas} ms`).toBeNull();
    }
  });

  it("borne un reglage hors plage au lieu de le suivre", () => {
    expect(coupureGateMs(PAS, 500)).toBeNull();          // ramene a 100 %
    expect(coupureGateMs(PAS, -50)).toBeCloseTo(coupureGateMs(PAS, GATE_MIN)!, 6);
  });

  it("ne programme rien sur une entree aberrante", () => {
    // Une minuterie a NaN millisecondes se declenche immediatement : la note
    // serait coupee des sa naissance.
    for (const [pas, gate] of [[NaN, 50], [500, NaN], [0, 50], [-100, 50], [Infinity, 50]]) {
      expect(coupureGateMs(pas, gate), `${pas}/${gate}`).toBeNull();
    }
  });

  it("une note plus courte quand le gate baisse", () => {
    expect(coupureGateMs(PAS, 25)!).toBeLessThan(coupureGateMs(PAS, 75)!);
  });
});
