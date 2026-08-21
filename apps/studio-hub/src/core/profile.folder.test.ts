import { describe, expect, it } from "vitest";
import {
  estFichierProfil,
  lireProfilDepuisTexte,
  nomFichierProfil,
  profilLePlusRecent,
  profilsDuDossier,
  PROFILE_VERSION,
  type StudioProfile,
} from "./profile";

/**
 * Relecture de la fiche depuis le dossier de travail.
 *
 * La fiche est enregistree a deux endroits : le localStorage du navigateur, et
 * un fichier `profile_<NOM>.json` dans le dossier choisi. La seconde copie
 * etait ecrite mais JAMAIS relue.
 *
 * Le defaut se manifestait ainsi : vider les donnees du navigateur effacait la
 * fiche — normal — mais re-choisir le dossier retrouvait le fichier sans
 * jamais l'ouvrir. Il fallait tout ressaisir alors que la sauvegarde etait la,
 * a cote. Le bouton « supprimer la fiche locale » promettait meme que « le
 * fichier deja ecrit dans le dossier restera intact » : l'intention etait bien
 * qu'il serve de recours, la fonction de relecture n'avait jamais ete ecrite.
 */

describe("nomFichierProfil", () => {
  it("met en majuscules et remplace les espaces", () => {
    expect(nomFichierProfil("Jean Michel")).toBe("profile_JEAN_MICHEL.json");
  });

  it("ignore les espaces de bord", () => {
    expect(nomFichierProfil("  Ana  ")).toBe("profile_ANA.json");
  });

  it("reduit les espaces multiples a un seul separateur", () => {
    // Sinon le nom ecrit et le nom recherche divergent, et la fiche devient
    // introuvable alors qu'elle est bien la.
    expect(nomFichierProfil("A   B")).toBe("profile_A_B.json");
  });

  it("produit un nom que estFichierProfil reconnait", () => {
    // L'invariant qui compte : ecrire puis relire doit boucler.
    expect(estFichierProfil(nomFichierProfil("Quelqu'un"))).toBe(true);
  });
});

describe("estFichierProfil", () => {
  it("reconnait un fichier de fiche", () => {
    expect(estFichierProfil("profile_ANA.json")).toBe(true);
  });

  it("accepte une extension en majuscules", () => {
    expect(estFichierProfil("profile_ANA.JSON")).toBe(true);
  });

  it("refuse un nom sans partie variable", () => {
    expect(estFichierProfil("profile_.json")).toBe(false);
  });

  it("refuse les autres fichiers du dossier", () => {
    // Le dossier contient aussi des sauvegardes machine et des manifestes.
    for (const n of ["manifest.json", "backup.json", "profile.txt", "notes.md", "profile_ANA.json.bak"]) {
      expect(estFichierProfil(n), n).toBe(false);
    }
  });
});

describe("profilsDuDossier", () => {
  it("ne retient que les fiches", () => {
    const noms = ["manifest.json", "profile_ANA.json", "son.aif", "profile_BOB.json"];
    expect(profilsDuDossier(noms)).toEqual(["profile_ANA.json", "profile_BOB.json"]);
  });

  it("rend une liste triee, quel que soit l'ordre de lecture du dossier", () => {
    // `entries()` ne garantit aucun ordre : sans tri, l'affichage changerait
    // d'un scan a l'autre.
    expect(profilsDuDossier(["profile_Z.json", "profile_A.json"])).toEqual([
      "profile_A.json",
      "profile_Z.json",
    ]);
  });

  it("accepte un dossier sans aucune fiche", () => {
    expect(profilsDuDossier(["manifest.json"])).toEqual([]);
  });

  it("accepte un dossier vide", () => {
    expect(profilsDuDossier([])).toEqual([]);
  });
});

describe("lireProfilDepuisTexte", () => {
  it("lit une fiche et la migre au schema courant", () => {
    const p = lireProfilDepuisTexte(JSON.stringify({ version: 1, name: "Ana", bio: "x" }));
    expect(p?.name).toBe("Ana");
    expect(p?.version).toBe(PROFILE_VERSION);
  });

  it("conserve les champs qu'elle ne connait pas", () => {
    // Les fiches portent l'inventaire machines, les disques, l'espace de
    // travail. Les perdre a la relecture reviendrait a tout faire ressaisir —
    // c'est-a-dire a ne rien corriger du tout.
    const p = lireProfilDepuisTexte(
      JSON.stringify({ name: "Ana", machineInventory: [{ id: 1 }], drives: [{ id: 2 }] })
    );
    expect(p?.machineInventory).toEqual([{ id: 1 }]);
    expect(p?.drives).toEqual([{ id: 2 }]);
  });

  it("rend null sur du JSON invalide", () => {
    expect(lireProfilDepuisTexte("{ pas du json")).toBeNull();
  });

  it("rend null sur un fichier vide", () => {
    expect(lireProfilDepuisTexte("")).toBeNull();
  });

  it("rend null quand le JSON n'est pas un objet", () => {
    for (const t of ["[]", '"texte"', "42", "null"]) {
      expect(lireProfilDepuisTexte(t), t).toBeNull();
    }
  });

  it("ne touche jamais au localStorage", () => {
    // Point central. `readProfile` EFFACE la fiche locale quand elle est
    // illisible. Appliquer cela a un fichier du dossier detruirait la fiche du
    // navigateur — la seule copie encore valable — a cause d'un fichier
    // corrompu ailleurs.
    const temoin = "sentinelle";
    globalThis.localStorage?.setItem?.("studio-hub-profile", temoin);
    lireProfilDepuisTexte("{ corrompu");
    expect(globalThis.localStorage?.getItem?.("studio-hub-profile") ?? temoin).toBe(temoin);
  });
});

describe("profilLePlusRecent", () => {
  const f = (fichier: string, savedAt?: string, name = "x") =>
    ({ fichier, profil: { version: 2, name, bio: "", savedAt } as StudioProfile });

  it("rend null quand il n'y a rien", () => {
    expect(profilLePlusRecent([])).toBeNull();
  });

  it("rend l'unique fiche presente", () => {
    expect(profilLePlusRecent([f("a.json")])?.fichier).toBe("a.json");
  });

  it("retient la plus recemment enregistree", () => {
    const r = profilLePlusRecent([
      f("vieille.json", "2026-01-01T00:00:00.000Z"),
      f("recente.json", "2026-08-21T00:00:00.000Z"),
      f("moyenne.json", "2026-05-01T00:00:00.000Z"),
    ]);
    expect(r?.fichier).toBe("recente.json");
  });

  it("classe une fiche sans horodatage apres celles qui en ont", () => {
    // Les fiches ecrites par une version anterieure n'ont pas de savedAt. Les
    // ecarter serait pire : on les garde, simplement en dernier.
    const r = profilLePlusRecent([f("sans.json", undefined), f("avec.json", "2026-01-01T00:00:00.000Z")]);
    expect(r?.fichier).toBe("avec.json");
  });

  it("retient quand meme une fiche sans horodatage s'il n'y a qu'elle", () => {
    expect(profilLePlusRecent([f("sans.json", undefined)])?.fichier).toBe("sans.json");
  });

  it("ignore un horodatage illisible sans lever", () => {
    const r = profilLePlusRecent([f("casse.json", "pas une date"), f("bon.json", "2026-01-01T00:00:00.000Z")]);
    expect(r?.fichier).toBe("bon.json");
  });

  it("departage deux horodatages identiques par le nom de fichier", () => {
    // Sans ce depart, le resultat dependrait de l'ordre de lecture du dossier,
    // qui n'est pas garanti : la meme situation donnerait deux fiches
    // differentes d'un chargement a l'autre.
    const d = "2026-08-21T00:00:00.000Z";
    expect(profilLePlusRecent([f("b.json", d), f("a.json", d)])?.fichier).toBe("a.json");
  });

  it("ne modifie pas la liste recue", () => {
    const liste = [f("b.json", "2026-01-01T00:00:00.000Z"), f("a.json", "2026-08-21T00:00:00.000Z")];
    profilLePlusRecent(liste);
    expect(liste.map((x) => x.fichier)).toEqual(["b.json", "a.json"]);
  });
});
