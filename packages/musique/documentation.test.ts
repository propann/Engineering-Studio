import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAMILLES, GAMMES } from "./gammes";
import { ORDRE_MOTIFS } from "./arpege";

/**
 * Les chiffres annonces dans la doc.
 *
 * Ce test existe a cause d'un defaut reel : le README, MODULES_STATUS, STATUS
 * et TESTS_PHYSIQUES annoncaient tous « 29 gammes » alors qu'il y en a 30. Le
 * compte venait d'un `grep` dont le motif ratait `lydien_b7` — le chiffre dans
 * le nom. Quatre fichiers d'un coup, et rien pour le signaler.
 *
 * C'est le meme defaut que la carte du rack principal qui annonce encore les
 * moteurs d'un composant supprime : une promesse laissee derriere le code.
 */

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Les documents qui decrivent le PRESENT du depot.
 *
 * Les entrees datees de la feuille de route en sont exclues : « 515 tests
 * passaient a ce moment-la » est un fait historique, pas une affirmation sur
 * l'etat courant. C'est le present qui rouille.
 */
const VIVANTS = [
  "README.md",
  "MODULES_STATUS.md",
  "AUDIO_RACK_README.md",
  "AUDIO_RACK_ROADMAP.md",
  "GETTING_STARTED.md",
  "INDEX.md",
  "DEPLOIEMENT.md",
  "docs/STATUS.md",
  "docs/TESTS_PHYSIQUES.md",
  "docs/INDEX.md",
  "docs/ROADMAP.md",
  "docs/WORKFLOW.md",
  "docs/ANALYSE_RACK_PRINCIPAL.md",
  "docs/backup/CONTRAT_INTEGRATION.md",
  "docs/backup/PROTOCOLE_VALIDATION_RESTAURATION.md",
];

/**
 * La liste ci-dessus s'ecrivait a la main, et ca se voyait : AUDIO_RACK_README
 * y figurait DEUX fois, tandis que la feuille de route, GETTING_STARTED et
 * DEPLOIEMENT n'y etaient pas du tout. C'est dans la feuille de route,
 * justement, que « 366 automated tests » a survecu pour 886 reels.
 */
it("la liste des documents vivants n'a pas de doublon", () => {
  expect(new Set(VIVANTS).size, "un document est liste deux fois").toBe(VIVANTS.length);
});

const lire = (p: string) => readFileSync(path.join(RACINE, p), "utf-8");

/**
 * Le paragraphe qui porte le point.
 *
 * Une fenetre de +/- 90 caracteres etait trop large : `docs/STATUS.md` porte
 * « Date de reference : 2026-08-22 » en tete, et cette date absolvait toute
 * affirmation ecrite dans les lignes suivantes. Verifie par sabotage — une
 * phrase « la suite compte 886 automated tests » ajoutee sous l'en-tete passait
 * le garde-fou sans un bruit.
 *
 * Le paragraphe est la bonne maille : il suit les lignes repliees et les
 * continuations de puce, et il s'arrete a la ligne vide.
 */
function paragraphe(texte: string, position: number): string {
  const debut = texte.lastIndexOf("\n\n", position);
  const fin = texte.indexOf("\n\n", position);
  return texte.slice(debut === -1 ? 0 : debut + 2, fin === -1 ? texte.length : fin);
}

/**
 * Le point donne appartient-il a une entree deja cochee (`- [x]`) ?
 *
 * On remonte jusqu'a la puce qui porte le point : la derniere ligne, avant lui,
 * qui ouvre une entree de liste a cocher.
 */
function estEntreeCochee(texte: string, position: number): boolean {
  const avant = texte.slice(0, position);
  const puces = [...avant.matchAll(/^\s*- \[([ x~])\]/gm)];
  return puces.at(-1)?.[1] === "x";
}

const DOCS = [
  "README.md",
  "MODULES_STATUS.md",
  "docs/STATUS.md",
  "docs/TESTS_PHYSIQUES.md",
];

describe("les chiffres annonces sont exacts", () => {
  const nbGammes = Object.keys(GAMMES).length;

  it("aucun document n'annonce un autre nombre de gammes", () => {
    for (const doc of DOCS) {
      const texte = lire(doc);
      for (const m of texte.matchAll(/(\d+)\s+gammes/g)) {
        expect(Number(m[1]), `${doc} annonce « ${m[0]} » pour ${nbGammes} gammes`).toBe(nbGammes);
      }
    }
  });

  it("aucun document n'annonce un autre nombre de motifs", () => {
    for (const doc of DOCS) {
      for (const m of lire(doc).matchAll(/(\d+)\s+motifs/g)) {
        expect(Number(m[1]), `${doc} annonce « ${m[0]} »`).toBe(ORDRE_MOTIFS.length);
      }
    }
  });

  it("le compte se fait sur les cles, pas sur un motif de recherche", () => {
    // Le grep d'origine cherchait `^  [a-z_]+: \[` : il ratait `lydien_b7`,
    // dont le nom porte un chiffre. Compter les cles de l'objet ne peut pas
    // rater d'entree.
    expect(nbGammes).toBe(FAMILLES.flatMap((f) => f.gammes).length);
    expect(Object.keys(GAMMES)).toContain("lydien_b7");
  });
});

describe("le compte de patches d'usine est exact", () => {
  /**
   * « 91 patches » a vecu dans SEPT documents sans avoir jamais ete vrai.
   *
   * Le rack en declare 76 : quinze moteurs, un a six patches et quatorze a
   * cinq. Verifie sur les trente-neuf commits du fichier — le compte n'a
   * jamais valu 91. Le chiffre est entre par 3eadb90, un commit qui ne touchait
   * QUE de la documentation, et s'est propage de fichier en fichier.
   *
   * Ce commit-la ajoutait justement ce fichier de test, qui verrouillait les
   * gammes et les motifs. Il n'a pas verrouille le nombre qu'il introduisait.
   *
   * Le compte se lit dans la source, pas dans une constante recopiee ici : une
   * valeur en dur rouillerait exactement comme le chiffre qu'elle surveille.
   */
  const RACK = lire("apps/studio-hub/src/pages/AudioPluginRack.tsx");

  function patchesDUsine(source: string): number {
    const depart = source.indexOf("const FACTORY_PATCHES");
    expect(depart, "FACTORY_PATCHES a ete renomme — ce test ne surveille plus rien").toBeGreaterThan(-1);
    let profondeur = 0;
    let fin = depart;
    for (let i = source.indexOf("{", depart); i < source.length; i += 1) {
      if (source[i] === "{") profondeur += 1;
      else if (source[i] === "}") {
        profondeur -= 1;
        if (profondeur === 0) { fin = i; break; }
      }
    }
    return [...source.slice(depart, fin)].length && (source.slice(depart, fin).match(/\{\s*id:\s*"/g) ?? []).length;
  }

  const nbPatches = patchesDUsine(RACK);

  it("le compte lu dans la source est plausible", () => {
    // Un garde-fou qui compte zero passerait tous les tests suivants sans rien
    // prouver. La borne basse dit seulement « l'extraction a marche ».
    expect(nbPatches).toBeGreaterThan(50);
  });

  it("aucun document vivant n'annonce un autre nombre de patches", () => {
    for (const doc of VIVANTS) {
      const texte = lire(doc);
      for (const m of texte.matchAll(/(\d{2,4})\s+(?:[\w'-]+\s+){0,2}patches?\b/gi)) {
        const contexte = paragraphe(texte, m.index!);
        // Meme tolerance qu'ailleurs : un fait explicitement date ne rouille pas.
        if (/[a\u00e0] ce moment|at the time|[a\u00e0] l'[e\u00e9]poque|\d{4}-\d{2}-\d{2}/i.test(contexte)) continue;
        // Et ce qui decrit du code SUPPRIME ne rouille pas non plus : le
        // tableau des retraits de la feuille de route cite « 25 patches across
        // 6 engines » pour SynthEngineDrawer.tsx, un troisieme systeme de
        // patches efface depuis. Sa colonne s'intitule « What it was ».
        if (/what it was|ce que c'[e\u00e9]tait|removed|supprim[e\u00e9]/i.test(contexte)) continue;
        expect(Number(m[1]), `${doc} annonce \u00ab ${m[0]} \u00bb pour ${nbPatches} patches d'usine`).toBe(nbPatches);
      }
    }
  });
});

describe("aucun compte de tests fige dans la doc vivante", () => {
  /**
   * Un nombre de tests ecrit dans un document pourrit au commit suivant. Dix
   * affirmations « 515 tests » trainaient dans six fichiers, alors que la
   * suite en comptait plus de sept cents.
   *
   * Les entrees DATEES de la feuille de route sont exclues : « 515 tests
   * passaient a ce moment-la » est un fait historique, pas une affirmation sur
   * le present. C'est le present qui rouille.
   */

  it("aucun document vivant n'annonce un nombre de tests", () => {
    for (const doc of VIVANTS) {
      const texte = lire(doc);
      // `(\d+)\s+tests` exigeait que le nombre TOUCHE le mot « tests ».
      // « 366 automated tests » lui echappait donc, un seul mot suffisant a le
      // mettre en defaut — et c'est exactement la forme qui a survecu dans la
      // feuille de route. On tolere jusqu'a deux mots intercales.
      for (const m of texte.matchAll(/(\d{2,4})\s+(?:[\w'-]+\s+){0,2}tests?\b/g)) {
        // Tolere une formulation explicitement datee.
        const contexte = paragraphe(texte, m.index!);
        // Les accents comptent : un premier jet cherchait « a ce moment » et
        // ne reconnaissait pas « à ce moment-là ». La tolerance ne marchait
        // donc pas pour la formulation francaise qu'elle visait.
        if (/[aà] ce moment|at the time|[aà] l'[ée]poque|at that point|\d{4}-\d{2}-\d{2}/i.test(contexte)) continue;
        // Une entree DEJA COCHEE de la feuille de route est un fait passe :
        // « restore safety — 24 tests » dit combien ce changement-la en a
        // ajoute, pas combien la suite en compte. C'est le present qui rouille.
        //
        // Cette tolerance ne vaut QUE pour les comptes de tests. Le nombre de
        // patches, lui, est une propriete du code verifiable aujourd'hui : la
        // cocher ne la rend pas vraie, et « le rack contient 91 patches »
        // vivait justement dans une entree cochee.
        if (estEntreeCochee(texte, m.index!)) continue;
        expect.fail(`${doc} fige « ${m[0]} » : ce nombre change a chaque commit`);
      }
    }
  });
});

describe("aucun compte volatil fige dans la doc vivante", () => {
  /**
   * Meme raison que pour les tests : ces nombres bougent a chaque ajout, et
   * une doc qui les fige devient fausse sans que rien ne le signale.
   *
   * Trouves en une seule passe : « 98 essais » pour 127, « ~2990 lignes »
   * pour 4098, « 515 tests » pour plus de huit cents. Trois fichiers
   * differents, tous exacts le jour ou ils ont ete ecrits.
   */
  const VOLATILS = [
    { motif: /(\d{2,4})\s+essais/g, quoi: "essais physiques" },
  ];

  /**
   * Le compte de LIGNES a ete essaye, puis retire.
   *
   * Il tirait surtout sur du texte legitime : « 389 lignes du
   * SynthEngineDrawer » decrit un fichier SUPPRIME, dont la taille ne peut
   * plus rouiller ; « 159 lignes » et « 263 lignes » etaient exacts.
   *
   * Il a quand meme servi une fois — c'est en le lisant qu'on a vu que
   * MODULES_STATUS annoncait deux fichiers « a trancher » qui etaient
   * supprimes depuis. Mais un garde-fou qui se declenche surtout a tort finit
   * par etre desactive : celui-ci vise donc ce qui rouille vraiment.
   */

  it("aucun document vivant ne fige un compte qui bouge", () => {
    for (const doc of VIVANTS) {
      const texte = lire(doc);
      for (const { motif, quoi } of VOLATILS) {
        for (const m of texte.matchAll(motif)) {
          const contexte = texte.slice(Math.max(0, m.index! - 120), m.index! + 120);
          // Tolere une formulation explicitement datee, comme pour les tests.
          if (/[aà] ce moment|at the time|[aà] l'[ée]poque|\d{4}-\d{2}-\d{2}|au\nmoment/i.test(contexte)) continue;
          expect.fail(`${doc} fige « ${m[0]} » (${quoi}) : ce nombre change`);
        }
      }
    }
  });
});

describe("aucun lien mort dans la doc vivante", () => {
  /**
   * Les documents se citent les uns les autres. Un lien qui ne mene nulle part
   * ne casse rien et ne se voit pas : on clique, il ne se passe rien, et on
   * conclut que la page n'existe pas — alors qu'elle a seulement demenage.
   *
   * **Les archives sont exclues, et c'est voulu.** `docs/archived/` et
   * `docs/backup/` sont des instantanes figes : leurs liens pointent vers des
   * fichiers d'alors, dont certains n'existent plus. Les reparer falsifierait
   * ce qu'ils constatent a leur date. 39 liens y sont morts, tous la-bas.
   *
   * Les references de la forme `fichier.ts:42` sont ecartees aussi : ce n'est
   * pas un chemin mais un renvoi a une ligne, que rien ne peut ouvrir comme
   * un lien.
   */
  /** Tous les documents du depot, sauf archives et dependances. */
  function documentsVivants(dossier = RACINE, vus: string[] = []): string[] {
    for (const entree of readdirSync(dossier)) {
      if (entree === "node_modules" || entree === ".git" || entree === "dist" ||
          entree === "archived" || entree === "backup" || entree === ".next") continue;
      const chemin = path.join(dossier, entree);
      if (statSync(chemin).isDirectory()) documentsVivants(chemin, vus);
      else if (entree.endsWith(".md")) vus.push(chemin);
    }
    return vus;
  }

  it("parcourt bien tout le depot, pas trois fichiers", () => {
    // Sans ce garde, une erreur de chemin rendrait une liste vide et le test
    // suivant serait vert sans avoir rien lu.
    expect(documentsVivants().length).toBeGreaterThan(100);
  });

  it("chaque lien interne mene a un fichier qui existe", () => {
    const morts: string[] = [];
    for (const doc of documentsVivants()) {
      const texte = readFileSync(doc, "utf-8");
      for (const m of texte.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
        const cible = m[2].split("#")[0].trim();
        if (!cible) continue;
        if (/^(https?:|mailto:|<)/.test(cible)) continue;
        // `fichier.ts:42` renvoie a une ligne, ce n'est pas un chemin.
        if (/:\d+$/.test(cible)) continue;
        const vise = path.resolve(path.dirname(doc), cible);
        if (!existsSync(vise)) {
          morts.push(`${path.relative(RACINE, doc)} : « ${m[1]} » -> ${cible}`);
        }
      }
    }
    expect(morts, `liens morts :\n${morts.join("\n")}`).toEqual([]);
  });
});
