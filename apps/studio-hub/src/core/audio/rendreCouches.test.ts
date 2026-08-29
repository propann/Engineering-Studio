import { describe, expect, it } from "vitest";
import { crete, cretes, frequenceDeNoteMidi, normaliser, rendreSon } from "./rendreCouches";
import { ajouterCouche, nouveauSon } from "./couches";

/**
 * Le rendu des couches et la reduction pour l'affichage.
 *
 * Le rendu lui-meme demande un `OfflineAudioContext`, absent sous Node : on
 * verifie donc ce qui est calculable — la reduction en cretes, la conversion
 * de note — et le comportement SANS contexte, qui doit degrader proprement
 * plutot que d'empecher l'atelier de s'ouvrir.
 */

describe("la note de reference", () => {
  it("le la 3 vaut 440 Hz", () => {
    expect(frequenceDeNoteMidi(69)).toBeCloseTo(440, 6);
  });

  it("une octave double la frequence", () => {
    expect(frequenceDeNoteMidi(81)).toBeCloseTo(880, 6);
    expect(frequenceDeNoteMidi(57)).toBeCloseTo(220, 6);
  });
});

describe("reduire une onde pour la dessiner", () => {
  it("garde les cretes, pas un echantillon sur cent", () => {
    /**
     * L'invariant qui rend une attaque visible. Un pic isole survit a la
     * reduction ; un echantillonnage regulier le manquerait une fois sur
     * cent, et l'onde scintillerait d'un rendu a l'autre.
     */
    const n = 10_000;
    const s = new Float32Array(n);
    s[4_321] = 0.93; // un transitoire isole
    const { max } = cretes(s, 100);
    expect(Math.max(...max)).toBeCloseTo(0.93, 6);
  });

  it("garde aussi les creux", () => {
    const s = new Float32Array(1000);
    s[500] = -0.77;
    const { min } = cretes(s, 50);
    expect(Math.min(...min)).toBeCloseTo(-0.77, 6);
  });

  it("rend exactement le nombre de colonnes demande", () => {
    for (const largeur of [1, 37, 800]) {
      const { min, max } = cretes(new Float32Array(5000), largeur);
      expect(min.length).toBe(largeur);
      expect(max.length).toBe(largeur);
    }
  });

  it("plus de colonnes que d'echantillons ne produit pas d'infini", () => {
    // Une colonne vide vaut zero, pas ±Infinity — qui dessinerait une barre
    // sur toute la hauteur.
    const { min, max } = cretes(new Float32Array(3), 50);
    for (const v of [...min, ...max]) expect(Number.isFinite(v)).toBe(true);
  });

  it("un signal vide ne fait pas lever", () => {
    const { min, max } = cretes(new Float32Array(0), 10);
    expect(min.every((v) => v === 0)).toBe(true);
    expect(max.every((v) => v === 0)).toBe(true);
  });

  it("`crete` rend le niveau absolu maximal", () => {
    const s = Float32Array.from([0.2, -0.8, 0.5]);
    expect(crete(s)).toBeCloseTo(0.8, 6);
    expect(crete(new Float32Array(0))).toBe(0);
  });
});

describe("sans contexte hors ligne", () => {
  it("le rendu rend null au lieu de lever", () => {
    /**
     * L'atelier doit s'ouvrir meme la ou `OfflineAudioContext` manque : on
     * peut regler un son sans le voir. Lever ici empecherait la page entiere.
     */
    const son = ajouterCouche(nouveauSon("x"), "mi_plaits");
    return expect(rendreSon(son, 1, 44100, null)).resolves.toBeNull();
  });
});

describe("normaliser avant l'encodage", () => {
  it("ramene un signal qui deborde sous la butee", () => {
    /**
     * Constate sur un export reel : un seul mi_plaits produisait 233
     * echantillons sur 88 200 colles a la butee negative. L'encodage ecrete
     * — c'est son travail — mais ecreter DEFORME l'onde.
     */
    const s = Float32Array.from([1.4, -1.8, 0.3]);
    const { signal, gain } = normaliser(s);
    expect(gain).toBeLessThan(1);
    for (const v of signal) expect(Math.abs(v)).toBeLessThanOrEqual(0.99 + 1e-6);
  });

  it("garde la FORME, ne fait que baisser le niveau", () => {
    // Ecreter aplatirait les cretes ; diviser preserve les rapports.
    const s = Float32Array.from([1.5, 0.75, -0.375]);
    const { signal } = normaliser(s);
    expect(signal[1] / signal[0]).toBeCloseTo(0.5, 6);
    expect(signal[2] / signal[0]).toBeCloseTo(-0.25, 6);
  });

  it("laisse intact un signal deja sous la cible", () => {
    /**
     * On ne remonte PAS : amplifier vers la butee ferait ressortir le souffle
     * d'une couche volontairement discrete, et changerait l'equilibre qu'on
     * vient de regler a l'oreille.
     */
    const s = Float32Array.from([0.2, -0.4]);
    const { signal, gain } = normaliser(s);
    expect(gain).toBe(1);
    expect(signal).toBe(s);
  });

  it("laisse une reserve : la cible n'est pas 1", () => {
    // Un signal cale exactement a la butee sature au moindre
    // reechantillonnage — et l'EP-133 reechantillonne.
    const { signal } = normaliser(Float32Array.from([2]));
    expect(signal[0]).toBeCloseTo(0.99, 6);
    expect(signal[0]).toBeLessThan(1);
  });

  it("un signal silencieux ne provoque pas de division par zero", () => {
    const s = new Float32Array(10);
    const { signal, gain } = normaliser(s);
    expect(gain).toBe(1);
    expect([...signal].every((v) => v === 0)).toBe(true);
  });
});
