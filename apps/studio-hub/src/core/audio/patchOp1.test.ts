import { describe, expect, it } from "vitest";
import { encodeAiffPcm16, encodeOp1PatchAiff, readOp1PatchJson } from "@studio-hub/audio-formats";
import { ECHELLE_MARQUEURS, TOUCHES_DRUM, metadonneesOp1, nomPatchOp1 } from "./patchOp1";
import { ajouterCouche, nouveauSon } from "./couches";
import { frequenceDeNoteMidi } from "./rendreCouches";

/**
 * Les metadonnees d'un patch OP-1.
 *
 * Ce qu'elles protegent : que la machine sache QUOI elle charge. Sans elles
 * l'OP-1 prend le fichier pour un echantillon anonyme, et transpose depuis un
 * do arbitraire — tout sonne faux d'autant, sans message.
 *
 * `SoundPatchCreator` produisait ces informations dans un `.json` pose a cote
 * de l'audio. La machine n'ouvre que l'AIFF : personne ne le lisait.
 */

const T = "2026-08-29T12:00:00.000Z";
const fige = () => T;

describe("le nom du patch", () => {
  it("translittere et retire ce que l'ecran ne montre pas", () => {
    expect(nomPatchOp1("Été à Berlin !")).toBe("Ete a Berlin");
  });

  it("un nom vide donne un repli, pas une chaine vide", () => {
    // Un patch sans nom est introuvable sur la machine.
    expect(nomPatchOp1("")).toBe("patch");
    expect(nomPatchOp1("!!!")).toBe("patch");
  });

  it("tronque a la largeur de l'ecran", () => {
    expect(nomPatchOp1("a".repeat(60)).length).toBe(24);
  });
});

describe("un patch synth porte sa frequence de reference", () => {
  it("la frequence est celle de la note RENDUE", () => {
    /**
     * L'invariant qui evite le decalage : la machine transpose depuis cette
     * frequence. Un son rendu en do2 mais annonce en do3 sonnerait une octave
     * a cote, sans que rien ne le signale.
     */
    for (const note of [36, 60, 72]) {
      const son = { ...nouveauSon("x", fige), note };
      const m = metadonneesOp1(son, "synth") as { base_freq: number };
      expect(m.base_freq).toBeCloseTo(frequenceDeNoteMidi(note), 1);
    }
  });

  it("le type annonce est celui que la machine attend", () => {
    const m = metadonneesOp1(nouveauSon("x", fige), "synth");
    expect(m.type).toBe("sampler");
  });
});

describe("un patch drum couvre ses 24 touches", () => {
  it("les 24 marqueurs sont poses", () => {
    /**
     * Laisser des marqueurs a zero laisserait 23 touches muettes. On pose le
     * son entier sous chacune : le meme son partout est utilisable, le
     * silence non.
     */
    const m = metadonneesOp1(nouveauSon("kit", fige), "drum") as {
      start: number[]; end: number[]; playmode: number[];
    };
    expect(m.start.length).toBe(TOUCHES_DRUM);
    expect(m.end.length).toBe(TOUCHES_DRUM);
    expect(m.end.every((v) => v === ECHELLE_MARQUEURS)).toBe(true);
    expect(m.playmode.length).toBe(TOUCHES_DRUM);
  });

  it("les marqueurs sont sur l'echelle FIXE de l'OP-1", () => {
    /**
     * `start` et `end` ne sont pas des echantillons : ils s'expriment sur une
     * echelle de 0 a 2 032 000 quelle que soit la duree du fichier. Des
     * valeurs en echantillons placeraient les 24 tranches au tout debut du
     * son.
     */
    expect(ECHELLE_MARQUEURS).toBe(2_032_000);
  });
});

describe("le chunk est reellement ecrit dans l'AIFF", () => {
  it("un aller-retour rend les metadonnees", () => {
    // Le test qui compte : ecrire, relire l'AIFF, retrouver le JSON. C'est
    // exactement ce que fera la machine.
    const audio = encodeAiffPcm16(new Float32Array(4410), 1, 44100);
    const son = { ...ajouterCouche(nouveauSon("Ma Basse", fige), "open303", {}, fige), note: 36 };
    const avec = encodeOp1PatchAiff(audio, "synth", metadonneesOp1(son, "synth"));
    const relu = readOp1PatchJson(avec) as { name: string; base_freq: number } | null;
    expect(relu?.name).toBe("Ma Basse");
    expect(relu?.base_freq).toBeCloseTo(frequenceDeNoteMidi(36), 1);
  });

  it("le fichier reste un AIFF valide", () => {
    // Un chunk mal ecrit casserait le conteneur : la machine ne lirait meme
    // plus l'audio.
    const audio = encodeAiffPcm16(new Float32Array(4410), 1, 44100);
    const avec = encodeOp1PatchAiff(audio, "synth", metadonneesOp1(nouveauSon("x", fige), "synth"));
    const tete = new TextDecoder().decode(new Uint8Array(avec, 0, 4));
    const forme = new TextDecoder().decode(new Uint8Array(avec, 8, 4));
    expect(tete).toBe("FORM");
    expect(forme).toBe("AIFF");
    expect(avec.byteLength).toBeGreaterThan(audio.byteLength);
  });
});
