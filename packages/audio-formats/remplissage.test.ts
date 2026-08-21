import { describe, expect, it } from "vitest";
import { calculerRemplissage, CAPACITE_EP133_OCTETS, CAPACITE_OP1_OCTETS } from "./machines";

/**
 * Taux de remplissage d'un support machine.
 *
 * La capacite est une CONSTANTE, pas une mesure : le navigateur ne peut pas
 * lire la taille d'un volume — la File System Access API n'expose ni capacite
 * ni espace libre, et `navigator.storage.estimate()` renseigne le quota de
 * l'origine, pas le disque.
 *
 * Consequence : la capacite peut etre fausse, notamment si le modele d'EP-133
 * est mal renseigne dans la fiche. La jauge doit donc rester lisible meme
 * quand les chiffres ne collent pas.
 */

describe("capacites", () => {
  it("fige le volume de l'OP-1", () => {
    // Releve sur le materiel le 2026-08-21 : `lsblk` donne `sda 384M vfat`.
    expect(CAPACITE_OP1_OCTETS).toBe(384e6);
  });

  it("fige les deux modeles d'EP-133", () => {
    expect(CAPACITE_EP133_OCTETS[64]).toBe(64e6);
    expect(CAPACITE_EP133_OCTETS[128]).toBe(128e6);
  });
});

describe("calculerRemplissage", () => {
  it("calcule un pourcentage juste", () => {
    expect(calculerRemplissage(192e6, 384e6).pourcentage).toBe(50);
    expect(calculerRemplissage(96e6, 384e6).pourcentage).toBe(25);
  });

  it("rend 0 sur un support vide", () => {
    const r = calculerRemplissage(0, 384e6);
    expect(r.pourcentage).toBe(0);
    expect(r.critique).toBe(false);
  });

  it("BORNE a 100 % plutot que de laisser filer", () => {
    // Une capacite sous-estimee — un modele d'EP-133 mal renseigne — donnerait
    // sinon une jauge a 140 %, qui ne veut rien dire a l'ecran et deborderait
    // de sa piste.
    const r = calculerRemplissage(500e6, 384e6);
    expect(r.pourcentage).toBe(100);
  });

  it("signale le critique au-dela de 90 %", () => {
    expect(calculerRemplissage(345e6, 384e6).critique).toBe(true);
    expect(calculerRemplissage(340e6, 384e6).critique).toBe(false);
  });

  it("ne divise pas par une capacite nulle", () => {
    // Donnerait NaN, affiche tel quel dans la jauge.
    const r = calculerRemplissage(100, 0);
    expect(r.pourcentage).toBe(0);
    expect(Number.isNaN(r.pourcentage)).toBe(false);
  });

  it("neutralise les entrees absurdes", () => {
    for (const [u, c] of [[NaN, 384e6], [-5, 384e6], [100, NaN], [100, -1], [Infinity, 384e6]]) {
      const r = calculerRemplissage(u, c);
      expect(Number.isFinite(r.pourcentage), `${u}/${c}`).toBe(true);
      expect(r.pourcentage).toBeGreaterThanOrEqual(0);
      expect(r.pourcentage).toBeLessThanOrEqual(100);
    }
  });

  it("rend les octets nettoyes, pas les entrees brutes", () => {
    // La jauge affiche « X sur environ Y » : propager un NaN y ecrirait « NaN ».
    const r = calculerRemplissage(NaN, 384e6);
    expect(r.utilises).toBe(0);
    expect(r.capacite).toBe(384e6);
  });
});
