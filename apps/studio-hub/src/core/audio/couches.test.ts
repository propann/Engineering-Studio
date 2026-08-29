import { describe, expect, it } from "vitest";
import {
  FAMILLES,
  PALETTE_COUCHES,
  VERSION_SON,
  ajouterCouche,
  analyserSon,
  cheminDe,
  couchesAudibles,
  deplacerCouche,
  dossierDe,
  modifierCouche,
  nomFichierSon,
  nouveauSon,
  paramsDeCouche,
  prochaineCouleur,
  retirerCouche,
  serialiserSon,
} from "./couches";
import { CATALOGUE } from "./catalogueParams";
import { PARAMS_DEFAUT } from "./moteurs";

/**
 * Le modele des sons superposes.
 *
 * Ce qu'il protege : **on ne perd pas un son**, et **on sait toujours quelle
 * couche est laquelle**. Le reste — l'onde, les cartes — se dessine par-dessus
 * et n'a de sens que si ces deux-la tiennent.
 */

const T = "2026-08-29T12:00:00.000Z";
const fige = () => T;

describe("les couleurs identifient les couches", () => {
  it("deux couches ajoutees ont des couleurs distinctes", () => {
    let son = nouveauSon("essai", fige);
    son = ajouterCouche(son, "mi_plaits", {}, fige);
    son = ajouterCouche(son, "open303", {}, fige);
    expect(son.couches[0].couleur).not.toBe(son.couches[1].couleur);
  });

  it("huit couches epuisent la palette sans doublon", () => {
    let son = nouveauSon("essai", fige);
    for (let i = 0; i < PALETTE_COUCHES.length; i += 1) {
      son = ajouterCouche(son, "mi_plaits", {}, fige);
    }
    const couleurs = son.couches.map((c) => c.couleur);
    expect(new Set(couleurs).size).toBe(PALETTE_COUCHES.length);
  });

  it("retirer une couche libere sa couleur", () => {
    /**
     * On reprend la teinte liberee plutot que de sauter a la suivante. Sinon,
     * apres quelques ajouts et retraits, deux couches porteraient la meme
     * couleur alors que la palette n'est pas epuisee.
     */
    let son = nouveauSon("essai", fige);
    son = ajouterCouche(son, "mi_plaits", {}, fige);
    son = ajouterCouche(son, "open303", {}, fige);
    const libere = son.couches[0].couleur;
    son = retirerCouche(son, son.couches[0].id, fige);
    son = ajouterCouche(son, "helm", {}, fige);
    expect(son.couches.map((c) => c.couleur)).toContain(libere);
    expect(new Set(son.couches.map((c) => c.couleur)).size).toBe(2);
  });

  it("la couleur ne bouge pas quand on reordonne", () => {
    /**
     * L'invariant qui rend l'onde lisible : si la couleur suivait le rang, la
     * troisieme couche changerait de teinte en montant, et l'on ne saurait
     * plus quelle courbe appartient a quoi.
     */
    let son = nouveauSon("essai", fige);
    son = ajouterCouche(son, "mi_plaits", {}, fige);
    son = ajouterCouche(son, "open303", {}, fige);
    son = ajouterCouche(son, "helm", {}, fige);
    const avant = new Map(son.couches.map((c) => [c.id, c.couleur]));
    son = deplacerCouche(son, son.couches[2].id, -2);
    for (const c of son.couches) expect(c.couleur).toBe(avant.get(c.id));
  });

  it("la palette varie aussi en clarte", () => {
    /**
     * Les deux daltonismes les plus repandus confondent des rouges et des
     * verts de meme clarte. Faire varier la luminance garde les couches
     * distinctes meme en niveaux de gris.
     */
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const l = PALETTE_COUCHES.map(luminance).sort((a, b) => a - b);
    expect(l[l.length - 1] - l[0]).toBeGreaterThan(0.2);
  });
});

describe("manipuler la pile", () => {
  it("ajouter donne un nom lisible, pas un identifiant", () => {
    const son = ajouterCouche(nouveauSon("x", fige), "mi_plaits", {}, fige);
    expect(son.couches[0].nom).toBe("Mutable Plaits");
  });

  it("retirer un identifiant inconnu ne change rien", () => {
    const son = ajouterCouche(nouveauSon("x", fige), "helm", {}, fige);
    expect(retirerCouche(son, "inexistant", fige)).toBe(son);
  });

  it("modifier ne touche que la couche visee", () => {
    let son = nouveauSon("x", fige);
    son = ajouterCouche(son, "mi_plaits", {}, fige);
    son = ajouterCouche(son, "open303", {}, fige);
    const modifie = modifierCouche(son, son.couches[0].id, { gain: 0.4 }, fige);
    expect(modifie.couches[0].gain).toBe(0.4);
    expect(modifie.couches[1].gain).toBe(1);
  });

  it("modifier les params FUSIONNE au lieu d'ecraser", () => {
    // Un curseur pousse ne doit pas effacer les quatre autres reglages.
    let son = ajouterCouche(nouveauSon("x", fige), "open303", { acidCutoff: 900 }, fige);
    son = modifierCouche(son, son.couches[0].id, { params: { acidResonance: 80 } }, fige);
    expect(son.couches[0].params).toEqual({ acidCutoff: 900, acidResonance: 80 });
  });

  it("deplacer borne aux extremites au lieu de perdre la couche", () => {
    let son = nouveauSon("x", fige);
    son = ajouterCouche(son, "a", {}, fige);
    son = ajouterCouche(son, "b", {}, fige);
    const premier = son.couches[0].id;
    expect(deplacerCouche(son, premier, -5).couches[0].id).toBe(premier);
    expect(deplacerCouche(son, premier, 9).couches[1].id).toBe(premier);
  });

  it("les couches muettes ou a zero ne sont pas audibles", () => {
    let son = nouveauSon("x", fige);
    son = ajouterCouche(son, "a", {}, fige);
    son = ajouterCouche(son, "b", {}, fige);
    son = ajouterCouche(son, "c", {}, fige);
    son = modifierCouche(son, son.couches[1].id, { muette: true }, fige);
    son = modifierCouche(son, son.couches[2].id, { gain: 0 }, fige);
    expect(couchesAudibles(son).map((c) => c.moteur)).toEqual(["a"]);
  });
});

describe("les reglages d'une couche sont complets", () => {
  it("les defauts comblent ce que la couche ne pose pas", () => {
    /**
     * Un moteur qui recoit `undefined` la ou il attend un nombre appelle
     * `setValueAtTime(undefined)`, qui leve. La couche ne porte que ses
     * differences ; les defauts font le reste.
     */
    const son = ajouterCouche(nouveauSon("x", fige), "open303", { acidCutoff: 900 }, fige);
    const p = paramsDeCouche(son.couches[0]);
    expect(p.acidCutoff).toBe(900);
    expect(p.acidResonance).toBe(PARAMS_DEFAUT.acidResonance);
    expect(p.activeEngine).toBe("open303");
  });
});

describe("le rangement automatique", () => {
  const avec = (moteur: string, note = 60) => {
    const son = ajouterCouche(nouveauSon("essai", fige), moteur, {}, fige);
    return { ...son, note };
  };

  it("classe selon la premiere couche audible", () => {
    expect(dossierDe(avec("drum_machine"))).toBe("rythmes");
    expect(dossierDe(avec("string_machine"))).toBe("nappes");
    expect(dossierDe(avec("organ_drawbars"))).toBe("claviers");
  });

  it("une note grave l'emporte sur la famille", () => {
    // On cherche « une basse » avant de chercher « un lead ».
    expect(dossierDe(avec("mi_plaits", 60))).toBe("leads");
    expect(dossierDe(avec("mi_plaits", 36))).toBe("basses");
  });

  it("une boite a rythmes reste un rythme, meme grave", () => {
    // Une grosse caisse est grave par nature : la classer en basse la perdrait.
    expect(dossierDe(avec("drum_machine", 30))).toBe("rythmes");
  });

  it("ignore les couches muettes pour classer", () => {
    let son = nouveauSon("x", fige);
    son = ajouterCouche(son, "drum_machine", {}, fige);
    son = ajouterCouche(son, "string_machine", {}, fige);
    son = modifierCouche(son, son.couches[0].id, { muette: true }, fige);
    expect(dossierDe(son)).toBe("nappes");
  });

  it("un son sans couche audible va dans divers, pas nulle part", () => {
    expect(dossierDe(nouveauSon("vide", fige))).toBe("divers");
  });

  it("les vingt moteurs sont tous classes", () => {
    // Un moteur oublie tomberait dans « divers » sans qu'on le remarque.
    const classes = new Set(FAMILLES.flatMap((f) => f.moteurs));
    const absents = Object.keys(CATALOGUE).filter((m) => !classes.has(m));
    expect(absents, `moteurs sans famille : ${absents.join(", ")}`).toEqual([]);
  });

  it("aucun moteur n'est classe dans deux familles", () => {
    const tous = FAMILLES.flatMap((f) => f.moteurs);
    expect(new Set(tous).size).toBe(tous.length);
  });

  it("le chemin joint le dossier et le fichier", () => {
    const son = { ...ajouterCouche(nouveauSon("Ma Nappe", fige), "string_machine", {}, fige) };
    expect(cheminDe(son)).toBe("nappes/ma-nappe.son.json");
  });
});

describe("nommer le fichier", () => {
  it("translittere et remplace les espaces", () => {
    expect(nomFichierSon("Été à Berlin")).toBe("ete-a-berlin.son.json");
  });

  it("un nom vide donne un fichier visible", () => {
    // Sans repli, le nom serait `.son.json` — cache sur les systemes Unix.
    expect(nomFichierSon("")).toBe("sans-titre.son.json");
    expect(nomFichierSon("///")).toBe("sans-titre.son.json");
  });
});

describe("on ne perd pas un son", () => {
  it("un aller-retour preserve les couches et leurs couleurs", () => {
    let son = nouveauSon("Essai", fige);
    son = ajouterCouche(son, "mi_plaits", { plaitsTimbre: 90 }, fige);
    son = ajouterCouche(son, "open303", { acidCutoff: 900 }, fige);
    const lu = analyserSon(serialiserSon(son));
    expect("erreur" in lu).toBe(false);
    if ("erreur" in lu) return;
    expect(lu.son.couches.map((c) => c.moteur)).toEqual(["mi_plaits", "open303"]);
    expect(lu.son.couches.map((c) => c.couleur)).toEqual(son.couches.map((c) => c.couleur));
    expect(lu.son.couches[0].params).toEqual({ plaitsTimbre: 90 });
  });

  it("le fichier se termine par un saut de ligne", () => {
    expect(serialiserSon(nouveauSon("x", fige))).toMatch(/\n$/);
  });

  it("un fichier vide rend une erreur, pas une exception", () => {
    expect(analyserSon("   ")).toEqual({ erreur: "Le fichier est vide." });
  });

  it("une version future est refusee plutot que mal lue", () => {
    /**
     * Ouvrir a moitie un format qu'on ne comprend pas, puis le reecrire,
     * detruirait silencieusement ce qu'on n'a pas su lire.
     */
    const r = analyserSon(`{"version":${VERSION_SON + 1},"couches":[]}`);
    expect("erreur" in r && r.erreur).toMatch(/version/);
  });

  it("une couche abimee est ecartee, les autres survivent", () => {
    const r = analyserSon('{"version":1,"couches":[{"moteur":"helm"},{"nom":"sans moteur"},{"moteur":"open303"}]}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    expect(r.son.couches.map((c) => c.moteur)).toEqual(["helm", "open303"]);
  });

  it("une couche sans couleur en recoit une distincte", () => {
    const r = analyserSon('{"version":1,"couches":[{"moteur":"a"},{"moteur":"b"}]}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    const couleurs = r.son.couches.map((c) => c.couleur);
    expect(new Set(couleurs).size).toBe(2);
  });

  it("un gain absurde est borne", () => {
    const r = analyserSon('{"version":1,"couches":[{"moteur":"a","gain":900},{"moteur":"b","gain":"fort"}]}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    expect(r.son.couches[0].gain).toBe(2);
    expect(r.son.couches[1].gain).toBe(1);
  });

  it("une note hors du clavier est ramenee dedans", () => {
    const r = analyserSon('{"version":1,"couches":[{"moteur":"a"}],"note":900}');
    expect("erreur" in r).toBe(false);
    if ("erreur" in r) return;
    expect(r.son.note).toBe(127);
  });
});
