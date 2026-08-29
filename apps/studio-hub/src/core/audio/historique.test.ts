import { describe, expect, it } from "vitest";
import {
  FUSION_MS,
  PROFONDEUR,
  annuler,
  empiler,
  historiqueVide,
  peutAnnuler,
  peutRefaire,
  refaire,
} from "./historique";
import { ajouterCouche, nouveauSon, type SonFabrique } from "./couches";

/**
 * L'annulation dans l'atelier.
 *
 * La regle qui compte n'est pas « garder les etats » mais LESQUELS garder. Un
 * historique qui empile chaque frappe d'un curseur en produit quarante par
 * geste, et « annuler » recule alors d'un pixel — ce qui est pire que rien,
 * parce qu'on croit avoir annule.
 */

const T = "2026-08-29T12:00:00.000Z";
const fige = () => T;
const son = (nom: string): SonFabrique => nouveauSon(nom, fige);

/** Une horloge qu'on avance a la main : sinon tester la fusion prendrait 1 s. */
function horloge(depart = 0) {
  let t = depart;
  return { lire: () => t, avancer: (ms: number) => { t += ms; } };
}

describe("un pas par geste, pas par valeur", () => {
  it("deux modifications du meme reglage, rapprochees, ne font qu'un pas", () => {
    /**
     * L'invariant central. Tirer un curseur produit des dizaines
     * d'evenements ; annuler doit revenir AVANT le geste, pas au pixel
     * precedent.
     */
    const h = horloge();
    let hist = historiqueVide();
    hist = empiler(hist, son("a"), "gain:x", h.lire);
    h.avancer(50);
    hist = empiler(hist, son("b"), "gain:x", h.lire);
    h.avancer(50);
    hist = empiler(hist, son("c"), "gain:x", h.lire);
    expect(hist.passe.length).toBe(1);
    expect(hist.passe[0].nom).toBe("a");
  });

  it("une pause au milieu du geste coupe le pas", () => {
    // Une seconde d'arret est un geste qui s'acheve : on veut pouvoir y
    // revenir.
    const h = horloge();
    let hist = historiqueVide();
    hist = empiler(hist, son("a"), "gain:x", h.lire);
    h.avancer(FUSION_MS + 1);
    hist = empiler(hist, son("b"), "gain:x", h.lire);
    expect(hist.passe.map((s) => s.nom)).toEqual(["a", "b"]);
  });

  it("deux reglages differents ne fusionnent jamais", () => {
    const h = horloge();
    let hist = historiqueVide();
    hist = empiler(hist, son("a"), "gain:x", h.lire);
    hist = empiler(hist, son("b"), "gain:y", h.lire);
    expect(hist.passe.map((s) => s.nom)).toEqual(["a", "b"]);
  });
});

describe("annuler et refaire", () => {
  it("annuler rend l'etat precedent", () => {
    let hist = empiler(historiqueVide(), son("avant"), "ajout");
    const r = annuler(hist, son("apres"));
    expect(r?.son.nom).toBe("avant");
  });

  it("refaire revient a l'etat annule", () => {
    let hist = empiler(historiqueVide(), son("avant"), "ajout");
    const a = annuler(hist, son("apres"))!;
    const r = refaire(a.historique, a.son);
    expect(r?.son.nom).toBe("apres");
  });

  it("un aller-retour complet retombe sur ses pieds", () => {
    let hist = historiqueVide();
    hist = empiler(hist, son("un"), "g1");
    hist = empiler(hist, son("deux"), "g2");
    let courant = son("trois");
    for (let i = 0; i < 2; i += 1) {
      const a = annuler(hist, courant)!;
      hist = a.historique; courant = a.son;
    }
    expect(courant.nom).toBe("un");
    for (let i = 0; i < 2; i += 1) {
      const r = refaire(hist, courant)!;
      hist = r.historique; courant = r.son;
    }
    expect(courant.nom).toBe("trois");
  });

  it("annuler sans passe rend null, pas un son vide", () => {
    // L'appelant garde alors son etat : recevoir un son vierge effacerait
    // le travail au lieu de le proteger.
    expect(annuler(historiqueVide(), son("x"))).toBeNull();
    expect(refaire(historiqueVide(), son("x"))).toBeNull();
  });

  it("une action neuve efface le futur", () => {
    /**
     * Garder une branche annulee puis reprise ailleurs donnerait un
     * « refaire » qui saute dans un etat sans rapport avec ce qu'on voit.
     */
    let hist = empiler(historiqueVide(), son("un"), "g1");
    const a = annuler(hist, son("deux"))!;
    expect(peutRefaire(a.historique)).toBe(true);
    const apres = empiler(a.historique, a.son, "g3");
    expect(peutRefaire(apres)).toBe(false);
  });

  it("modifier le meme reglage juste apres une annulation cree bien un pas", () => {
    /**
     * Le geste est oublie a l'annulation. Sans cela, la modification suivante
     * fusionnerait avec le geste d'AVANT l'annulation, et ce pas serait perdu.
     */
    const h = horloge();
    let hist = empiler(historiqueVide(), son("un"), "gain:x", h.lire);
    const a = annuler(hist, son("deux"))!;
    const apres = empiler(a.historique, a.son, "gain:x", h.lire);
    expect(peutAnnuler(apres)).toBe(true);
    expect(apres.passe[apres.passe.length - 1].nom).toBe("un");
  });
});

describe("la profondeur est bornee", () => {
  it("au-dela, les plus ANCIENS tombent", () => {
    // Couper par la droite jetterait ce qu'on vient de faire : l'inverse de
    // ce qu'on attend d'une annulation.
    const h = horloge();
    let hist = historiqueVide();
    for (let i = 0; i < PROFONDEUR + 5; i += 1) {
      hist = empiler(hist, son(`etat-${i}`), `geste-${i}`, h.lire);
      h.avancer(FUSION_MS + 1);
    }
    expect(hist.passe.length).toBe(PROFONDEUR);
    expect(hist.passe[0].nom).toBe("etat-5");
    expect(hist.passe[PROFONDEUR - 1].nom).toBe(`etat-${PROFONDEUR + 4}`);
  });
});

describe("les couches survivent a l'annulation", () => {
  it("retirer une couche puis annuler rend ses reglages", () => {
    /**
     * Le cas qui a motive ce module : le moteur se reajoute a la main, ses
     * cinq curseurs non.
     */
    let avant = ajouterCouche(son("x"), "open303", { acidCutoff: 900 }, fige);
    const hist = empiler(historiqueVide(), avant, "retrait");
    const r = annuler(hist, son("x"))!;
    expect(r.son.couches[0].params).toEqual({ acidCutoff: 900 });
  });
});
