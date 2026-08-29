import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La machine branchée joue ; le studio se tait.
 *
 * ## Le défaut que ce test empêche
 *
 * `StudioMachinePanel.noteOn` faisait les deux :
 *
 *     op1AudioEngine.triggerNoteOn(note, 100);
 *     if (mode === "midi") sendMidi([0x90, note, 100]);
 *
 * Machine branchée, une touche produisait donc DEUX sons : celui de l'OP-1 et
 * celui de son imitation logicielle, désaccordés de tout ce qui les sépare.
 * Rien ne le signalait — les deux chemins fonctionnaient parfaitement chacun
 * de leur côté, et le défaut ne s'entend qu'avec le matériel sur le bureau.
 *
 * ## Le principe
 *
 * L'OP-1 a ses moteurs dans le ventre. Quand elle est là, c'est elle qui
 * sonne. L'atelier a ses vingt moteurs à lui, et n'a aucune raison d'imiter
 * ceux d'une machine qui fait déjà mieux.
 *
 * Cinq imitations — Digital, Iter, Phase, DNA, Voltage — ont été écrites le
 * 2026-08-29 puis retirées le même jour, pour cette raison. Ce test empêche
 * qu'elles reviennent.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OP1 = path.join(DIR, "..", "..", "..", "..", "op1-studio", "app");

/** Retire les commentaires : ils racontent le défaut qu'on interdit. */
const lire = (p: string) =>
  readFileSync(path.join(OP1, p), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const PANNEAU = lire("components/StudioMachinePanel.tsx");
const MOTEUR = lire("lib/op1SynthEngine.ts");

describe("en mode MIDI, la machine joue seule", () => {
  it("`noteOn` rend la main après avoir émis, sans synthétiser", () => {
    const i = PANNEAU.indexOf("function noteOn(");
    expect(i, "noteOn a disparu du panneau machine").toBeGreaterThan(-1);
    const corps = PANNEAU.slice(i, PANNEAU.indexOf("\n  }", i));

    const iMidi = corps.indexOf('mode === "midi"');
    const iSynthese = corps.indexOf("triggerNoteOn");
    expect(iMidi, "le mode MIDI n'est plus consulté").toBeGreaterThan(-1);
    expect(iSynthese, "la synthèse locale a disparu du repli").toBeGreaterThan(-1);

    /**
     * L'ordre est l'invariant : le test du mode doit précéder la synthèse, et
     * la branche MIDI doit sortir. Sans le `return`, les deux s'exécutent —
     * c'est exactement l'état d'avant.
     */
    expect(iMidi, "la synthèse locale passe avant le test du mode").toBeLessThan(iSynthese);
    expect(
      corps.slice(iMidi, iSynthese),
      "la branche MIDI ne rend pas la main : les deux sons partent",
    ).toContain("return");
  });

  it("`noteOff` suit la même règle", () => {
    // Une note relachee en local alors qu'elle a ete jouee par la machine
    // laisserait la machine sonner indefiniment.
    const i = PANNEAU.indexOf("function noteOff(");
    const corps = PANNEAU.slice(i, PANNEAU.indexOf("\n  }", i));
    const iMidi = corps.indexOf('mode === "midi"');
    const iSynthese = corps.indexOf("triggerNoteOff");
    expect(iMidi).toBeGreaterThan(-1);
    expect(iMidi).toBeLessThan(iSynthese);
    expect(corps.slice(iMidi, iSynthese)).toContain("return");
  });
});

describe("le studio n'imite pas les moteurs de la machine", () => {
  it("aucune synthèse des moteurs natifs de l'OP-1", () => {
    /**
     * Digital, Iter, Phase, DNA et Voltage sont dans la machine. Les écrire
     * ici reviendrait à doubler un instrument qu'on a sous la main, et à
     * entretenir une imitation que personne ne peut comparer à l'original.
     */
    for (const interdit of ["moteursOp1", "construireMoteurOp1", "op1_digital", "op1_voltage"]) {
      expect(MOTEUR, `le moteur importe encore ${interdit}`).not.toContain(interdit);
    }
  });

  it("le module d'imitation n'est pas revenu dans le Hub", () => {
    const chemin = path.join(DIR, "moteursOp1.ts");
    let existe = true;
    try {
      readFileSync(chemin, "utf-8");
    } catch {
      existe = false;
    }
    expect(
      existe,
      "core/audio/moteursOp1.ts est revenu : la machine a deja ces moteurs",
    ).toBe(false);
  });

  it("les vingt moteurs du rack, eux, restent jouables au clavier", () => {
    // C'est l'inverse du precedent : ceux-la sont a NOUS, et le clavier doit
    // pouvoir les jouer sans machine branchee.
    expect(MOTEUR).toContain("construireMoteur");
    expect(MOTEUR).toContain("MOTEURS_RACK");
  });
});
