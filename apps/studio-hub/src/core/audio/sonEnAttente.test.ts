import { beforeEach, describe, expect, it } from "vitest";
import {
  aUnSonEnAttente,
  poserFichierEnAttente,
  poserSonEnAttente,
  prendreSonEnAttente,
  reinitialiserDepotPourTests,
} from "./sonEnAttente";
import { ajouterCouche, nouveauSon, serialiserSon } from "./couches";

/**
 * Le passage de relais entre la bibliotheque et l'atelier.
 *
 * La navigation du Hub est un changement d'etat sans URL : il n'y a aucun
 * endroit ou glisser « ouvre CE son ». Ce depot est ce chemin, et son seul
 * invariant delicat est qu'il se VIDE a la prise.
 */

const T = "2026-08-29T12:00:00.000Z";
const fige = () => T;

beforeEach(() => reinitialiserDepotPourTests());

describe("le depot se vide a la prise", () => {
  it("un son depose se prend une fois", () => {
    /**
     * L'invariant qui compte. Sans lui, revenir a l'atelier rouvrirait le
     * meme son et ecraserait le travail en cours — un mois plus tard,
     * personne ne comprendrait d'ou il vient.
     */
    poserSonEnAttente(nouveauSon("essai", fige), "la bibliothèque");
    expect(prendreSonEnAttente()?.son.nom).toBe("essai");
    expect(prendreSonEnAttente()).toBeNull();
  });

  it("`aUnSonEnAttente` ne consomme rien", () => {
    poserSonEnAttente(nouveauSon("essai", fige), "test");
    expect(aUnSonEnAttente()).toBe(true);
    expect(aUnSonEnAttente()).toBe(true);
    expect(prendreSonEnAttente()).not.toBeNull();
  });

  it("un depot remplace le precedent non consomme", () => {
    // Deux clics d'affilee dans la bibliotheque : c'est le SECOND son qu'on
    // veut, pas le premier reste en file.
    poserSonEnAttente(nouveauSon("premier", fige), "a");
    poserSonEnAttente(nouveauSon("second", fige), "b");
    expect(prendreSonEnAttente()?.son.nom).toBe("second");
    expect(prendreSonEnAttente()).toBeNull();
  });

  it("la provenance voyage avec le son", () => {
    // L'atelier l'affiche : « ouvert depuis la bibliotheque ». Sans elle, on
    // ne saurait pas d'ou vient le son qui a remplace l'ecran.
    poserSonEnAttente(nouveauSon("x", fige), "la bibliothèque");
    expect(prendreSonEnAttente()?.provenance).toBe("la bibliothèque");
  });
});

describe("deposer le contenu d'un fichier", () => {
  it("un son valide est accepte avec ses couches", () => {
    const son = ajouterCouche(nouveauSon("nappe", fige), "string_machine", {}, fige);
    expect(poserFichierEnAttente(serialiserSon(son), "test")).toEqual({ ok: true });
    const pris = prendreSonEnAttente();
    expect(pris?.son.couches.map((c) => c.moteur)).toEqual(["string_machine"]);
  });

  it("un fichier abime rend le message, et ne depose rien", () => {
    /**
     * L'appelant est une liste de fichiers : un `.son.json` corrompu ne doit
     * pas empecher d'ouvrir les autres, ni faire basculer vers un atelier
     * vide sans explication.
     */
    const r = poserFichierEnAttente("{ pas du json", "test");
    expect("erreur" in r && r.ok === false).toBe(true);
    expect(aUnSonEnAttente()).toBe(false);
  });

  it("un fichier vide est refuse", () => {
    expect(poserFichierEnAttente("", "test").ok).toBe(false);
    expect(aUnSonEnAttente()).toBe(false);
  });

  it("un echec ne detruit pas un depot valide precedent", () => {
    // On ne perd pas ce qui etait pret parce qu'un second fichier est abime.
    poserSonEnAttente(nouveauSon("garde", fige), "a");
    poserFichierEnAttente("{{{", "b");
    expect(prendreSonEnAttente()?.son.nom).toBe("garde");
  });
});
