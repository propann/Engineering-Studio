import { describe, expect, it } from "vitest";
import {
  groupForMappedObservation,
  loadControlAssignments,
  midiObservationSignature,
  MIDI_CONTROL_MAP_STORAGE_KEY,
  type ControlAssignment,
} from "../../../ep133-studio/src/core/midi/controlMapping";
import type { MidiObservation } from "../../../ep133-studio/src/core/midi/useWebMidi";

/**
 * Correspondances MIDI de l'EP-133 : ce qui relie un message recu a un
 * controle de l'interface, et qui survit d'une session a l'autre.
 *
 * La signature est le coeur du systeme. Si elle inclut la velocite, une
 * touche jouee fort et la meme jouee doucement produisent deux signatures
 * differentes, et l'apprentissage ne reconnait qu'un seul niveau de frappe.
 */

const obs = (over: Partial<MidiObservation> = {}): MidiObservation =>
  ({
    kind: "note",
    channel: 1,
    note: 36,
    velocity: 100,
    data: [0x90, 36, 100],
    hex: "90 24 64",
    inputName: "EP-133 MIDI 1",
    timestamp: 0,
    ...over,
  }) as MidiObservation;

describe("midiObservationSignature", () => {
  it("ignore la velocite", () => {
    // Le point qui compte : sans ca, une frappe douce ne serait pas
    // reconnue apres un apprentissage fait en frappant fort.
    const fort = midiObservationSignature(obs({ velocity: 127 }));
    const doux = midiObservationSignature(obs({ velocity: 12 }));
    expect(fort).toBe(doux);
  });

  it("distingue deux notes differentes", () => {
    expect(midiObservationSignature(obs({ note: 36 }))).not.toBe(
      midiObservationSignature(obs({ note: 37 }))
    );
  });

  it("distingue deux canaux", () => {
    // Deux machines sur des canaux distincts ne doivent pas se confondre.
    expect(midiObservationSignature(obs({ channel: 1 }))).not.toBe(
      midiObservationSignature(obs({ channel: 2 }))
    );
  });

  it("ignore la valeur d'un controleur", () => {
    // Un potentiometre balaye 0..127 : seul son numero identifie le controle.
    const bas = midiObservationSignature(obs({ kind: "control", data: [0xb0, 70, 0] }));
    const haut = midiObservationSignature(obs({ kind: "control", data: [0xb0, 70, 127] }));
    expect(bas).toBe(haut);
  });

  it("distingue deux numeros de controleur", () => {
    expect(midiObservationSignature(obs({ kind: "control", data: [0xb0, 70, 64] }))).not.toBe(
      midiObservationSignature(obs({ kind: "control", data: [0xb0, 71, 64] }))
    );
  });

  it("ne confond pas une note et un controleur de meme numero", () => {
    expect(midiObservationSignature(obs({ kind: "note", note: 70 }))).not.toBe(
      midiObservationSignature(obs({ kind: "control", data: [0xb0, 70, 0] }))
    );
  });

  it("retombe sur les octets bruts pour les autres familles", () => {
    const sig = midiObservationSignature(obs({ kind: "sysex", hex: "F0 7E 00 F7" }));
    expect(sig).toContain("sysex");
    expect(sig).toContain("F0 7E 00 F7");
  });

  it("reste stable d'un appel a l'autre", () => {
    // Une signature instable rendrait toute assignation inutilisable.
    const o = obs();
    expect(midiObservationSignature(o)).toBe(midiObservationSignature(o));
  });
});

describe("groupForMappedObservation", () => {
  const assign = (sig: string): ControlAssignment => ({ signature: sig, data: [], kind: "note" });

  it("trouve le groupe associe au message", () => {
    const sig = midiObservationSignature(obs({ note: 40 }));
    const groupe = groupForMappedObservation(obs({ note: 40 }), { "group:C": assign(sig) });
    expect(groupe).toBe("C");
  });

  it("ne rend rien quand aucun groupe ne correspond", () => {
    const autre = midiObservationSignature(obs({ note: 99 }));
    expect(groupForMappedObservation(obs({ note: 40 }), { "group:A": assign(autre) })).toBeUndefined();
  });

  it("ignore les assignations en texte heritees", () => {
    // ep133 a connu un format ou la valeur etait une chaine : la relire ne
    // doit pas planter ni produire un faux positif.
    const sig = midiObservationSignature(obs());
    expect(groupForMappedObservation(obs(), { "group:A": sig as never })).toBeUndefined();
  });

  it("ignore les assignations qui ne visent pas un groupe", () => {
    const sig = midiObservationSignature(obs());
    expect(groupForMappedObservation(obs(), { "pad:3": assign(sig) })).toBeUndefined();
  });
});

describe("loadControlAssignments", () => {
  const store = (raw: string | null) => ({ getItem: () => raw });

  it("rend un objet vide quand rien n'est enregistre", () => {
    expect(loadControlAssignments(store(null))).toEqual({});
  });

  it("rend un objet vide plutot que de lever sur un contenu illisible", () => {
    // Contrairement a la fiche personnage, les correspondances ne sont pas
    // effacees : on repart de zero sans toucher au stockage.
    expect(loadControlAssignments(store("{tronque"))).toEqual({});
  });

  it("relit les assignations valides", () => {
    const raw = JSON.stringify({ "pad:1": { signature: "note:ch1:36", data: [144, 36, 100], kind: "note" } });
    const out = loadControlAssignments(store(raw));
    expect(out["pad:1"].signature).toBe("note:ch1:36");
  });

  it("ecarte les entrees en texte, garde les autres", () => {
    const raw = JSON.stringify({
      ancienne: "note:ch1:36",
      "pad:1": { signature: "note:ch1:37", data: [], kind: "note" },
    });
    const out = loadControlAssignments(store(raw));
    expect(out.ancienne).toBeUndefined();
    expect(out["pad:1"]).toBeDefined();
  });

  it("expose une cle de stockage versionnee", () => {
    // Le versionnage permet de changer de format sans relire l'ancien.
    expect(MIDI_CONTROL_MAP_STORAGE_KEY).toMatch(/:v\d+$/);
  });
});
