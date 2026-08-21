import { describe, expect, it } from "vitest";
import {
  ajouterEtMedianer,
  attenteFile,
  composerLatence,
  libelleLatence,
} from "./latence";

/**
 * Decomposition de la latence MIDI.
 *
 * Ces fonctions existent parce que le chiffre affiche doit etre exploitable :
 * une mesure fausse est pire qu'aucune mesure — elle envoie optimiser le
 * mauvais segment. Le transport en amont, lui, a deja ete mesure hors
 * navigateur et vaut 16,7 µs par message en salve : ce n'est pas la qu'il faut
 * chercher.
 */

describe("attenteFile", () => {
  it("mesure l'attente entre reception et traitement", () => {
    expect(attenteFile(1050, 1000)).toBe(50);
  });

  it("rend 0 quand le navigateur ne renseigne pas l'horodatage", () => {
    // Le cas qui compte : traiter un 0 comme un instant valide afficherait le
    // temps ecoule depuis le chargement de la page — des dizaines de secondes
    // presentees comme de la latence.
    expect(attenteFile(90000, 0)).toBe(0);
  });

  it("rend 0 pour un horodatage absent", () => {
    expect(attenteFile(1050, undefined)).toBe(0);
    expect(attenteFile(1050, null)).toBe(0);
  });

  it("rend 0 pour un horodatage non fini", () => {
    expect(attenteFile(1050, NaN)).toBe(0);
    expect(attenteFile(1050, Infinity)).toBe(0);
  });

  it("rend 0 si le message est date APRES l'entree du gestionnaire", () => {
    // On ne peut pas entrer dans le gestionnaire avant d'avoir recu le
    // message : une valeur negative signale une horloge incoherente, pas une
    // latence negative.
    expect(attenteFile(1000, 1050)).toBe(0);
  });
});

describe("composerLatence", () => {
  it("somme les trois segments, la sortie convertie en millisecondes", () => {
    const s = composerLatence(5, 2, 0.012);
    expect(s.file).toBe(5);
    expect(s.traitement).toBe(2);
    expect(s.sortie).toBeCloseTo(12, 6);
    expect(s.total).toBeCloseTo(19, 6);
  });

  it("neutralise les valeurs negatives plutot que de les propager", () => {
    const s = composerLatence(-3, 2, 0.01);
    expect(s.file).toBe(0);
    expect(s.total).toBeCloseTo(12, 6);
  });

  it("neutralise les valeurs non finies", () => {
    const s = composerLatence(NaN, Infinity, 0.01);
    expect(s.total).toBeCloseTo(10, 6);
  });

  it("accepte une latence de sortie nulle", () => {
    // Un contexte sans outputLatency renseigne ne doit pas casser l'affichage.
    expect(composerLatence(4, 1, 0).total).toBe(5);
  });
});

describe("ajouterEtMedianer", () => {
  it("rend la valeur elle-meme sur un seul echantillon", () => {
    expect(ajouterEtMedianer([], 12)).toBe(12);
  });

  it("prend la valeur centrale sur un nombre impair", () => {
    const h = [10, 30];
    expect(ajouterEtMedianer(h, 20)).toBe(20);
  });

  it("moyenne les deux centrales sur un nombre pair", () => {
    // Sans cela la mediane sauterait d'un echantillon a l'autre a chaque note.
    const h = [10, 20, 40];
    expect(ajouterEtMedianer(h, 30)).toBe(25);
  });

  it("resiste a un pic isole — c'est toute la raison d'etre de la mediane", () => {
    // Un ramasse-miettes a 300 ms au milieu de notes a 10 ms ne doit pas faire
    // conclure que le rack est lent. La moyenne, elle, passerait a 39 ms.
    const h: number[] = [];
    for (const v of [10, 10, 10, 10, 10, 10, 10, 10, 10]) ajouterEtMedianer(h, v);
    expect(ajouterEtMedianer(h, 300)).toBe(10);
  });

  it("borne l'historique et oublie les plus anciennes", () => {
    const h: number[] = [];
    for (let i = 0; i < 100; i++) ajouterEtMedianer(h, i, 40);
    expect(h).toHaveLength(40);
    expect(h[0]).toBe(60); // les 60 premieres sont sorties
  });

  it("suit une degradation reelle une fois l'historique renouvele", () => {
    // L'inverse du test precedent : la mediane doit bouger quand la latence
    // change vraiment, sinon elle ne mesure plus rien.
    const h: number[] = [];
    for (let i = 0; i < 40; i++) ajouterEtMedianer(h, 5, 40);
    let m = 5;
    for (let i = 0; i < 40; i++) m = ajouterEtMedianer(h, 50, 40);
    expect(m).toBe(50);
  });

  it("mute le tableau recu", () => {
    // Documente a dessein : l'appelant garde un tableau vivant dans une ref,
    // pour eviter une allocation par note sur le fil qui programme l'audio.
    const h: number[] = [];
    ajouterEtMedianer(h, 7);
    expect(h).toEqual([7]);
  });
});

describe("libelleLatence", () => {
  it("montre la mediane et les trois segments", () => {
    const texte = libelleLatence(composerLatence(3.14, 1.5, 0.012), 16.6, 12);
    expect(texte).toContain("16.6 ms méd.");
    expect(texte).toContain("file 3.1");
    expect(texte).toContain("trait. 1.5");
    expect(texte).toContain("sortie 12.0");
    expect(texte).toContain("n=12");
  });

  it("affiche le nombre d'echantillons — une mediane sur n=1 ne vaut rien", () => {
    expect(libelleLatence(composerLatence(1, 1, 0.001), 3, 1)).toContain("n=1");
  });
});
