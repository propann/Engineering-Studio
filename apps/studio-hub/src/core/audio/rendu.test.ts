import { describe, expect, it } from "vitest";
import { frequenceDeNote, nomDeNote, nomEchantillon, planifierRendu } from "./rendu";

/**
 * Calculs du rendu hors ligne.
 *
 * `OfflineAudioContext` n'existe pas ici, mais l'arithmétique qui l'entoure
 * décide si le fichier produit se termine proprement ou se coupe net — et un
 * fichier coupé net claque à chaque lecture, sur la machine comme ailleurs.
 */

const ENV = { ATTACK: 0.008, DECAY: 0.12, RELEASE: 0.22 };

describe("planifierRendu", () => {
  it("programme le relâchement pour qu'il se termine à la fin voulue", () => {
    const p = planifierRendu(2, 2, 44100, ENV);
    expect(p.debutRelachement).toBeCloseTo(2 - ENV.RELEASE, 6);
  });

  it("alloue de quoi contenir la rampe ENTIÈRE", () => {
    // Le piège central : dimensionner le tampon sur `fin` seul tronquerait
    // précisément la rampe qu'on cherche à préserver, et le fichier claquerait.
    const p = planifierRendu(2, 2, 44100, ENV);
    expect(p.trames / 44100).toBeGreaterThanOrEqual(p.debutRelachement + ENV.RELEASE);
  });

  it("s'arrête à l'extinction du moteur si elle vient avant", () => {
    // Inutile de rendre du silence : un son percussif de 300 ms ne doit pas
    // produire un fichier de 6 secondes.
    const p = planifierRendu(6, 0.3, 44100, ENV);
    expect(p.fin).toBeCloseTo(0.3, 6);
    expect(p.tronque).toBe(true);
  });

  it("s'arrête à la durée demandée si le moteur sonne plus longtemps", () => {
    // Rings résonne bien au-delà de son impulsion d'excitation : c'est
    // l'utilisateur qui décide de la longueur du sample.
    const p = planifierRendu(1, 10, 44100, ENV);
    expect(p.fin).toBeCloseTo(1, 6);
    expect(p.tronque).toBe(false);
  });

  it("ne relâche jamais pendant l'attaque", () => {
    // Sur une durée très courte, caler le relâchement sur `fin - RELEASE`
    // donnerait un instant négatif : la note serait coupée pendant sa montée.
    const p = planifierRendu(0.05, 0.05, 44100, ENV);
    expect(p.debutRelachement).toBeGreaterThanOrEqual(ENV.ATTACK + ENV.DECAY);
  });

  it("alloue au moins une trame, même sur une durée nulle", () => {
    // Un OfflineAudioContext de longueur 0 lève.
    for (const d of [0, -1, NaN, Infinity]) {
      expect(planifierRendu(d, 1, 44100, ENV).trames, String(d)).toBeGreaterThanOrEqual(1);
    }
  });

  it("suit la fréquence d'échantillonnage de la cible", () => {
    // L'EP-133 travaille à 26250 Hz : allouer à 44100 produirait un fichier
    // presque deux fois trop long après conversion.
    const a = planifierRendu(1, 1, 44100, ENV).trames;
    const b = planifierRendu(1, 1, 26250, ENV).trames;
    expect(a / b).toBeCloseTo(44100 / 26250, 1);
  });

  it("retombe sur la durée demandée si l'extinction est inconnue", () => {
    expect(planifierRendu(2, NaN, 44100, ENV).fin).toBeCloseTo(2, 6);
  });
});

describe("frequenceDeNote", () => {
  it("place le La 440 sur la note 69", () => {
    expect(frequenceDeNote(69)).toBeCloseTo(440, 6);
  });

  it("double d'une octave à l'autre", () => {
    expect(frequenceDeNote(81)).toBeCloseTo(880, 6);
    expect(frequenceDeNote(57)).toBeCloseTo(220, 6);
  });

  it("donne un Do central conforme", () => {
    expect(frequenceDeNote(60)).toBeCloseTo(261.63, 1);
  });
});

describe("nomDeNote", () => {
  it("nomme les repères usuels", () => {
    expect(nomDeNote(60)).toBe("C4");
    expect(nomDeNote(69)).toBe("A4");
    expect(nomDeNote(61)).toBe("C#4");
  });

  it("descend correctement sous le Do central", () => {
    expect(nomDeNote(48)).toBe("C3");
    expect(nomDeNote(0)).toBe("C-1");
  });

  it("couvre la plage d'un pack C3 à C7 sans trou", () => {
    const noms = new Set<string>();
    for (let n = 48; n <= 96; n++) noms.add(nomDeNote(n));
    expect(noms.size).toBe(49);
  });
});

describe("nomEchantillon", () => {
  it("assemble le patch et la note", () => {
    expect(nomEchantillon("Analog Bass", "C3")).toBe("ANALOG_BASS_C3");
  });

  it("écarte les caractères que le système de fichiers refuse", () => {
    // Un patch peut s'appeler « Bass/Lead » : la barre creerait un sous-dossier.
    expect(nomEchantillon("Bass/Lead", "C3")).toBe("BASS_LEAD_C3");
  });

  it("retire les accents plutôt que de les laisser passer", () => {
    expect(nomEchantillon("Basse Réglée", "A4")).toBe("BASSE_REGLEE_A4");
  });

  it("ne produit jamais un nom vide", () => {
    // Un nom vide donnerait un fichier caché, voire un chemin invalide.
    expect(nomEchantillon("", "")).toBe("ECHANTILLON");
    expect(nomEchantillon("###", "***")).toBe("ECHANTILLON");
  });

  it("ne laisse pas de séparateur en bord de nom", () => {
    expect(nomEchantillon(" Bass ", "C3")).toBe("BASS_C3");
    expect(nomEchantillon("Bass", "")).toBe("BASS");
  });
});
