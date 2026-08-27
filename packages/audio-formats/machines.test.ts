import { describe, expect, it } from "vitest";
import {
  calculateEp133MemoryBudget,
  dureeAdmise,
  EP133_TARGET_SAMPLE_RATES,
  estimateEp133ConversionBytes,
  estimateEp133MemoryFit,
  OP1_AUDIO_LIMITS,
  op1MaxSeconds,
  SPECS_CIBLES,
  type CibleMachine,
} from "./machines";

/**
 * Spécifications des machines.
 *
 * Ce sont des valeurs matérielles : elles ne se devinent pas, et une erreur
 * produit un fichier que la machine refuse — ou pire, accepte de travers. Les
 * tests les figent pour qu'une « simplification » ne les modifie pas sans
 * qu'on s'en aperçoive.
 */

const TOUTES = Object.keys(SPECS_CIBLES) as CibleMachine[];

describe("valeurs matérielles", () => {
  it("fige les trois cibles de l'EP-133", () => {
    // Firmware 2.5. Ces fréquences ne sont pas arbitraires.
    expect(EP133_TARGET_SAMPLE_RATES).toEqual({ LO: 26250, MID: 32000, HI: 46875 });
  });

  it("fige les durées maximales de l'OP-1", () => {
    expect(OP1_AUDIO_LIMITS.synthMaxSeconds).toBe(6);
    expect(OP1_AUDIO_LIMITS.drumMaxSeconds).toBe(12);
  });

  it("donne la bonne limite selon le type de sample", () => {
    expect(op1MaxSeconds("synth")).toBe(6);
    expect(op1MaxSeconds("drum")).toBe(12);
  });

  it("vise l'AIFF pour l'OP-1, pas le WAV", () => {
    // L'OP-1 lit de l'AIFF pour ses patches. Lui écrire du WAV produit un
    // fichier qu'elle ignore, sans message.
    expect(SPECS_CIBLES.op1_synth.format).toBe("aiff");
    expect(SPECS_CIBLES.op1_drum.format).toBe("aiff");
  });

  it("laisse l'EP-133 sans dossier", () => {
    // Elle n'a pas de mode disque : ses sons passent par SysEx. Annoncer un
    // dossier laisserait croire à un transfert par fichier.
    expect(SPECS_CIBLES.ep133_lo.dossier).toBeUndefined();
    expect(SPECS_CIBLES.ep133_hi.dossier).toBeUndefined();
  });

  it("donne un dossier d'usage aux cibles OP-1", () => {
    expect(SPECS_CIBLES.op1_synth.dossier).toBe("synth/user");
    expect(SPECS_CIBLES.op1_drum.dossier).toBe("drum/user");
  });

  it("décrit chaque cible complètement", () => {
    for (const c of TOUTES) {
      const s = SPECS_CIBLES[c];
      expect(s.libelle.length, c).toBeGreaterThan(0);
      expect(s.frequence, c).toBeGreaterThan(0);
      expect(s.dureeMaxSecondes, c).toBeGreaterThan(0);
      expect([1, 2], c).toContain(s.canaux);
    }
  });
});

describe("dureeAdmise", () => {
  it("laisse passer une durée dans les limites", () => {
    expect(dureeAdmise("op1_synth", 3)).toBe(3);
  });

  it("tronque au maximum de la cible", () => {
    // Tronquer plutôt que refuser : l'utilisateur obtient un fichier
    // utilisable. L'appelant compare la valeur rendue à celle demandée pour
    // le signaler — ce n'est jamais silencieux de son côté.
    expect(dureeAdmise("op1_synth", 30)).toBe(6);
    expect(dureeAdmise("op1_drum", 30)).toBe(12);
  });

  it("rend 0 sur une durée absurde plutôt qu'un calcul faux", () => {
    for (const d of [0, -5, NaN, Infinity]) {
      expect(dureeAdmise("op1_synth", d), String(d)).toBe(0);
    }
  });
});

describe("estimateEp133ConversionBytes", () => {
  it("compte l'en-tête WAV de 44 octets", () => {
    expect(estimateEp133ConversionBytes(0, 1, 32000)).toBe(44);
  });

  it("calcule le poids d'une seconde mono", () => {
    // 32000 trames × 1 canal × 2 octets, plus l'en-tête.
    expect(estimateEp133ConversionBytes(1, 1, 32000)).toBe(44 + 32000 * 2);
  });

  it("double pour du stéréo", () => {
    const mono = estimateEp133ConversionBytes(2, 1, 26250);
    const stereo = estimateEp133ConversionBytes(2, 2, 26250);
    expect(stereo - 44).toBe((mono - 44) * 2);
  });

  it("ne rend jamais moins que l'en-tête sur une durée négative", () => {
    expect(estimateEp133ConversionBytes(-3, 1, 32000)).toBe(44);
  });
});

describe("estimateEp133MemoryFit", () => {
  it("accepte ce qui tient", () => {
    const r = estimateEp133MemoryFit(1e6, 0, 64);
    expect(r.fits).toBe(true);
    expect(r.remainingBytes).toBe(64e6);
  });

  it("refuse ce qui déborde", () => {
    expect(estimateEp133MemoryFit(70e6, 0, 64).fits).toBe(false);
  });

  it("tient compte de l'occupation déjà mesurée", () => {
    const r = estimateEp133MemoryFit(10e6, 60e6, 64);
    expect(r.remainingBytes).toBe(4e6);
    expect(r.fits).toBe(false);
  });

  it("ne suppose JAMAIS que l'espace est suffisant sur une entrée douteuse", () => {
    // Précaution héritée du bug « NaN son » : une capacité non finie doit
    // donner 0 de restant, pas un booléen tiré d'une comparaison avec NaN —
    // qui aurait laissé croire à un transfert possible.
    for (const capacite of [NaN, Infinity, -1, 0]) {
      const r = estimateEp133MemoryFit(1, 0, capacite);
      expect(r.remainingBytes, String(capacite)).toBe(0);
      expect(r.fits, String(capacite)).toBe(false);
    }
  });

  it("ignore une occupation absurde plutôt que de l'ajouter", () => {
    expect(estimateEp133MemoryFit(1e6, NaN, 64).remainingBytes).toBe(64e6);
    expect(estimateEp133MemoryFit(1e6, -5e6, 64).remainingBytes).toBe(64e6);
  });
});

describe("calculateEp133MemoryBudget", () => {
  it("calcule le budget pour une machine vide (64 Mo, 999 slots)", () => {
    const b = calculateEp133MemoryBudget(0, 0, 64);
    expect(b.capacityBytes).toBe(64e6);
    expect(b.usedBytes).toBe(0);
    expect(b.remainingBytes).toBe(64e6);
    expect(b.usagePercentage).toBe(0);
    expect(b.isFull).toBe(false);
    expect(b.isCritical).toBe(false);
    expect(b.totalSlots).toBe(999);
    expect(b.usedSlots).toBe(0);
    expect(b.availableSlots).toBe(999);
    expect(b.maxRecordingTimeRemainingSec.lo).toBeGreaterThan(1000);
    expect(b.maxRecordingTimeRemainingSec.mid).toBeGreaterThan(900);
    expect(b.maxRecordingTimeRemainingSec.hi).toBeGreaterThan(600);
  });

  it("signale l'état critique dès 90% d'utilisation ou <= 10 slots restants", () => {
    const b1 = calculateEp133MemoryBudget(58e6, 100, 64);
    expect(b1.usagePercentage).toBe(91);
    expect(b1.isCritical).toBe(true);
    expect(b1.isFull).toBe(false);

    const b2 = calculateEp133MemoryBudget(10e6, 990, 64);
    expect(b2.availableSlots).toBe(9);
    expect(b2.isCritical).toBe(true);
  });

  it("signale une machine pleine quand les octets ou slots sont épuisés", () => {
    const b = calculateEp133MemoryBudget(64e6, 999, 64);
    expect(b.isFull).toBe(true);
    expect(b.remainingBytes).toBe(0);
    expect(b.availableSlots).toBe(0);
  });
});

