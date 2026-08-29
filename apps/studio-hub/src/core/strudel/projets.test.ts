import { describe, expect, it } from "vitest";
import {
  EXTENSION,
  VERSION_PROJET,
  analyser,
  modifie,
  moyenDisponible,
  nomDepuisFichier,
  nomFichier,
  nouveauProjet,
  serialiser,
} from "./projets";

/**
 * Les projets Strudel — la logique, exécutée.
 *
 * Ce que ces tests protègent en priorité : **on ne perd pas le travail**. Un
 * fichier abîmé, une version future, un `.js` collé depuis strudel.cc — aucun
 * de ces cas ne doit lever, ni écraser ce qui est ouvert.
 */

const T = "2026-08-29T10:00:00.000Z";
const fige = () => T;

describe("choisir le chemin d'écriture", () => {
  /**
   * Le piège documenté dans `profile-folder-picker` : l'atelier se sert en
   * HTTP sur le réseau local. `http://192.168.2.59:3000` n'est PAS un contexte
   * sécurisé, contrairement à `localhost`. L'API disparaît alors de `window`
   * sans erreur — un bouton qui ne fait rien, et rien pour l'expliquer.
   */
  const complet = {
    isSecureContext: true,
    showSaveFilePicker: () => {},
    showOpenFilePicker: () => {},
  } as unknown as Window;

  it("utilise le système de fichiers en contexte sécurisé", () => {
    expect(moyenDisponible(complet)).toBe("systeme-de-fichiers");
  });

  it("retombe sur le téléchargement hors contexte sécurisé", () => {
    // Le cas de l'acces par IP sur le reseau local.
    expect(moyenDisponible({ ...complet, isSecureContext: false } as unknown as Window)).toBe(
      "telechargement",
    );
  });

  it("retombe si une seule des deux fonctions manque", () => {
    /**
     * Certaines versions de Safari exposent `showOpenFilePicker` sans
     * `showSaveFilePicker`. N'en détecter qu'une donnerait un « Ouvrir » qui
     * marche et un « Enregistrer » mort.
     */
    const sansSave = { isSecureContext: true, showOpenFilePicker: () => {} } as unknown as Window;
    const sansOpen = { isSecureContext: true, showSaveFilePicker: () => {} } as unknown as Window;
    expect(moyenDisponible(sansSave)).toBe("telechargement");
    expect(moyenDisponible(sansOpen)).toBe("telechargement");
  });

  it("retombe sur un objet vide plutôt que de lever", () => {
    expect(moyenDisponible({} as Window)).toBe("telechargement");
  });
});

describe("nommer le fichier", () => {
  it("translittère les accents et remplace les espaces", () => {
    expect(nomFichier("Été à Berlin")).toBe(`ete-a-berlin${EXTENSION}`);
  });

  it("retire les caractères qu'un système de fichiers refuse", () => {
    expect(nomFichier('mon/projet:2*?"<>|')).toBe(`mon-projet-2${EXTENSION}`);
  });

  it("un nom vide donne un fichier visible", () => {
    /**
     * Sans repli, le nom serait `.strudel.json` — un fichier caché sur tous
     * les systèmes de type Unix. L'utilisateur ne le retrouverait pas.
     */
    expect(nomFichier("")).toBe(`sans-titre${EXTENSION}`);
    expect(nomFichier("   ")).toBe(`sans-titre${EXTENSION}`);
    expect(nomFichier("///")).toBe(`sans-titre${EXTENSION}`);
  });

  it("tronque un nom démesuré", () => {
    const long = nomFichier("a".repeat(200));
    expect(long.length).toBeLessThanOrEqual(60 + EXTENSION.length);
  });

  it("retrouve le nom depuis le fichier", () => {
    expect(nomDepuisFichier("mon-morceau.strudel.json")).toBe("mon morceau");
    expect(nomDepuisFichier("essai.js")).toBe("essai");
    expect(nomDepuisFichier("")).toBe("Sans titre");
  });
});

describe("écrire et relire", () => {
  it("un aller-retour préserve le code", () => {
    const p = nouveauProjet("Essai", 'note("c e g")', 120, fige);
    const lu = analyser(serialiser(p));
    expect("erreur" in lu).toBe(false);
    if ("erreur" in lu) return;
    expect(lu.projet.code).toBe('note("c e g")');
    expect(lu.projet.bpm).toBe(120);
    expect(lu.projet.nom).toBe("Essai");
    expect(lu.brut).toBe(false);
  });

  it("le fichier se termine par un saut de ligne", () => {
    // Pour que git ne signale pas « no newline at end of file » sur chaque
    // projet versionne.
    expect(serialiser(nouveauProjet("x", "y", 120, fige))).toMatch(/\n$/);
  });

  it("accepte du code nu collé depuis ailleurs", () => {
    /**
     * Refuser d'ouvrir un `.js` copié depuis strudel.cc serait absurde : c'est
     * exactement ce qu'on veut coller. On le charge comme projet neuf.
     */
    const lu = analyser('note("c e g").sound("sawtooth")', "collé");
    expect("erreur" in lu).toBe(false);
    if ("erreur" in lu) return;
    expect(lu.brut).toBe(true);
    expect(lu.projet.nom).toBe("collé");
    expect(lu.projet.bpm).toBe(0);
  });
});

describe("ne jamais perdre le travail sur un fichier douteux", () => {
  it("un fichier vide rend une erreur, pas une exception", () => {
    expect(analyser("   ")).toEqual({ erreur: "Le fichier est vide." });
  });

  it("un JSON illisible est signalé comme tel", () => {
    const r = analyser("{ ceci n'est pas du json");
    expect("erreur" in r && r.erreur).toMatch(/JSON/);
  });

  it("un JSON sans champ code est refusé", () => {
    const r = analyser('{"nom":"x"}');
    expect("erreur" in r && r.erreur).toMatch(/code/);
  });

  it("une version future est refusée plutôt que mal lue", () => {
    /**
     * Ouvrir à moitié un format qu'on ne comprend pas, puis le réécrire,
     * détruirait silencieusement ce qu'on n'a pas su lire. On refuse.
     */
    const r = analyser(`{"version":${VERSION_PROJET + 1},"code":"x"}`);
    expect("erreur" in r && r.erreur).toMatch(/version/);
  });

  it("un bpm absurde ne dérègle pas le Hub", () => {
    // La valeur 0 signale « inconnu » : l'appelant garde alors son tempo.
    const r = analyser('{"version":1,"code":"x","bpm":"vite"}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    expect(r.projet.bpm).toBe(0);
  });

  it("des dates manquantes sont comblées", () => {
    const r = analyser('{"version":1,"code":"x"}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    expect(r.projet.creeLe).toMatch(/^\d{4}-/);
  });
});

describe("savoir s'il reste des modifications", () => {
  it("un projet neuf non touché n'est pas modifié", () => {
    const p = nouveauProjet("x", 'note("c")', 120, fige);
    expect(modifie(p, 'note("c")')).toBe(false);
  });

  it("une frappe suffit à le signaler", () => {
    const p = nouveauProjet("x", 'note("c")', 120, fige);
    expect(modifie(p, 'note("c e")')).toBe(true);
  });

  it("sans projet, du code écrit compte comme non enregistré", () => {
    expect(modifie(null, 'note("c")')).toBe(true);
    expect(modifie(null, "   ")).toBe(false);
  });
});
