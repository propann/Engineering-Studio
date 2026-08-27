import { describe, expect, it } from "vitest";
import { creerContexteFactice } from "./contexteFactice";
import {
  AMORTI_HZ,
  BANDES_EQ,
  PHASER_ETAGES,
  construireChaineEffets,
  niveauPrise,
  reinjection,
  reinjectionFlanger,
  tempsDesPrises,
  type ParamsEffets,
} from "./effets";

/**
 * La chaîne d'effets, construite pour de vrai.
 *
 * `construireChaineEffets` occupait les lignes 379-542 du fichier — un tiers
 * de son contenu — sans qu'aucun test ne l'exécute jamais. Elle exige un
 * `AudioContext`, ce qui l'avait mise hors de portée.
 *
 * Ce n'était pas anodin : la chaîne traverse le rendu HORS LIGNE. Un
 * échantillon fabriqué porte exactement ce que ces lignes calculent, et il
 * finit dans un fichier écrit sur une machine. Une erreur ici ne se rattrape
 * pas après coup.
 *
 * Les tests vérifient le GRAPHE — quels nœuds sont créés, comment ils sont
 * reliés, quelles valeurs sont posées — pas le son. C'est ce qu'un contexte
 * factice peut prouver, et c'est déjà ce que la fonction décide.
 */

/** Des réglages neutres : rien d'activé, tout à zéro. */
function neutres(): ParamsEffets {
  return {
    fxDriveMix: 0, fxDriveAmount: 0, fxDriveMode: "soft",
    fxEqLow: 0, fxEqMid: 0, fxEqHigh: 0,
    fxModMix: 0, fxModMode: "chorus", fxModRate: 0, fxModDepth: 0, fxModFeedback: 0,
    fxDelayMix: 0, fxDelayTime: 300, fxDelayFeedback: 0,
    fxDelayTaps: 1, fxDelaySpread: 0, fxDelayPan: 0,
  } as ParamsEffets;
}

describe("l'égaliseur est toujours construit", () => {
  it("pose un filtre par bande de BANDES_EQ, jamais une liste recopiée", () => {
    /**
     * Le graphe de réponse affiché dans le rack se calcule sur la MÊME table.
     * Deux listes divergeraient au premier réglage changé, et le rack
     * montrerait une courbe que le son ne produit pas — chacune restant
     * cohérente de son côté, donc rien ne le signalerait.
     */
    const f = creerContexteFactice();
    construireChaineEffets(f.ctx, neutres(), 0);
    const filtres = f.parType("filter");
    expect(filtres).toHaveLength(BANDES_EQ.length);
    BANDES_EQ.forEach((bande, i) => {
      expect(filtres[i].type).toBe(bande.type);
      expect((filtres[i].frequency as { value: number }).value).toBe(bande.frequence);
    });
  });

  it("reporte les gains demandés sur les bonnes bandes", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxEqLow = -6; p.fxEqMid = 3; p.fxEqHigh = 9;
    construireChaineEffets(f.ctx, p, 0);
    const filtres = f.parType("filter");
    BANDES_EQ.forEach((bande, i) => {
      expect((filtres[i].gain as { value: number }).value).toBe(p[bande.reglage]);
    });
  });
});

describe("la saturation ne s'insère que si elle a quelque chose à faire", () => {
  it("aucun waveshaper quand le mélange est à zéro", () => {
    // Le signal doit passer intact. Inserer un shaper dose a 0 ajouterait un
    // suréchantillonnage 2x pour un resultat identique.
    const f = creerContexteFactice();
    construireChaineEffets(f.ctx, neutres(), 0);
    expect(f.parType("waveshaper")).toHaveLength(0);
  });

  it("aucun waveshaper quand la quantité est à zéro, même dosée", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDriveMix = 100; p.fxDriveAmount = 0;
    construireChaineEffets(f.ctx, p, 0);
    expect(f.parType("waveshaper")).toHaveLength(0);
  });

  it("un waveshaper suréchantillonné quand les deux sont posés", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDriveMix = 50; p.fxDriveAmount = 40;
    construireChaineEffets(f.ctx, p, 0);
    const formes = f.parType("waveshaper");
    expect(formes).toHaveLength(1);
    expect(formes[0].oversample).toBe("2x");
    expect(formes[0].curve, "la courbe de saturation n'est pas posée").toBeTruthy();
  });

  it("garde une voie directe en parallèle de la voie saturée", () => {
    // Sans elle, un melange a 50 % ne melangerait rien : tout le signal
    // passerait par le shaper.
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDriveMix = 50; p.fxDriveAmount = 40;
    construireChaineEffets(f.ctx, p, 0);
    const entree = f.noeuds[0];
    // L'entree part vers le shaper ET vers un gain direct.
    expect(f.cibles(entree).length).toBeGreaterThanOrEqual(2);
  });
});

describe("la modulation", () => {
  it("le phaser empile exactement PHASER_ETAGES passe-tout", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxModMix = 60; p.fxModMode = "phaser"; p.fxModRate = 30; p.fxModDepth = 50;
    construireChaineEffets(f.ctx, p, 0);
    const allpass = f.parType("filter").filter((n) => n.type === "allpass");
    expect(allpass).toHaveLength(PHASER_ETAGES);
  });

  it("le phaser ne construit aucune ligne à retard", () => {
    // Un passe-tout ne retarde pas : c'est la somme avec la voie directe qui
    // creuse le spectre. Un delai ici serait un chorus deguise.
    const f = creerContexteFactice();
    const p = neutres();
    p.fxModMix = 60; p.fxModMode = "phaser"; p.fxModRate = 30;
    construireChaineEffets(f.ctx, p, 0);
    expect(f.parType("delay")).toHaveLength(0);
  });

  it("le flanger réinjecte, le chorus non", () => {
    /**
     * C'est ce qui les sépare le plus : sans réinjection, un flanger n'est
     * qu'un chorus très court. Le creusement en peigne vient de la boucle.
     */
    const avec = (mode: "chorus" | "flanger") => {
      const f = creerContexteFactice();
      const p = neutres();
      p.fxModMix = 60; p.fxModMode = mode; p.fxModRate = 30; p.fxModFeedback = 50;
      construireChaineEffets(f.ctx, p, 0);
      const retard = f.parType("delay")[0];
      // Une boucle : le retard alimente un noeud qui revient sur le retard.
      return f.liaisons.some(([, cible]) => cible === retard.__id &&
        f.liaisons.some(([s]) => s === retard.__id));
    };
    expect(avec("flanger"), "le flanger ne réinjecte pas").toBe(true);
    const f = creerContexteFactice();
    const p = neutres();
    p.fxModMix = 60; p.fxModMode = "chorus"; p.fxModRate = 30; p.fxModFeedback = 50;
    construireChaineEffets(f.ctx, p, 0);
    const retard = f.parType("delay")[0];
    const retours = f.liaisons.filter(([, cible]) => cible === retard.__id);
    expect(retours, "le chorus réinjecte alors qu'il ne devrait pas").toHaveLength(1);
  });

  it("le gain de réinjection du flanger suit reinjectionFlanger", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxModMix = 60; p.fxModMode = "flanger"; p.fxModRate = 30; p.fxModFeedback = 80;
    construireChaineEffets(f.ctx, p, 0);
    const attendu = reinjectionFlanger(80);
    const trouve = f.parType("gain").some((g) => (g.gain as { value: number }).value === attendu);
    expect(trouve, `aucun gain à ${attendu}`).toBe(true);
  });

  it("rien du tout quand le mélange est à zéro", () => {
    const f = creerContexteFactice();
    construireChaineEffets(f.ctx, neutres(), 0);
    expect(f.parType("osc"), "un LFO tourne pour rien").toHaveLength(0);
  });
});

describe("le délai", () => {
  it("construit une ligne par prise", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelayTime = 300; p.fxDelaySpread = 30;
    construireChaineEffets(f.ctx, p, 0);
    expect(f.parType("delay")).toHaveLength(4);
  });

  it("À ÉCART NUL, quatre prises se replient sur une seule", () => {
    /**
     * Documenté dans `tempsDesPrises` et facile à rater en écrivant un test :
     * sans écart, toutes les prises tombent sur le même temps. Les construire
     * n'ajouterait aucun écho, seulement du gain — quatre copies exactement
     * superposées.
     *
     * Mes trois premiers tests de ce fichier sont tombés pour cette raison :
     * ils demandaient quatre prises sans écart et n'en obtenaient qu'une.
     * Le code avait raison.
     */
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelayTime = 300; p.fxDelaySpread = 0;
    construireChaineEffets(f.ctx, p, 0);
    expect(f.parType("delay")).toHaveLength(1);
  });

  it("les temps de prise viennent de tempsDesPrises", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 3; p.fxDelayTime = 400; p.fxDelaySpread = 30;
    construireChaineEffets(f.ctx, p, 0);
    const attendus = tempsDesPrises(400, 3, 30);
    const poses = f.parType("delay").map((d) => (d.delayTime as { value: number }).value);
    expect(poses).toEqual(attendus);
  });

  it("les niveaux de prise viennent de niveauPrise", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelaySpread = 30;
    construireChaineEffets(f.ctx, p, 0);
    const valeurs = f.parType("gain").map((g) => (g.gain as { value: number }).value);
    for (let i = 0; i < 4; i++) {
      expect(valeurs, `niveau de la prise ${i} absent`).toContain(niveauPrise(i, 4));
    }
  });

  it("la réinjection ne boucle QUE sur la première prise", () => {
    /**
     * La brancher sur toutes multiplierait le gain de boucle par le nombre de
     * prises : le plafond de 0,85 ne protégerait plus rien, et quatre prises
     * divergeraient là où une seule tenait. C'est un emballement audible, et
     * il finirait dans le fichier exporté.
     */
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelaySpread = 30; p.fxDelayFeedback = 60;
    construireChaineEffets(f.ctx, p, 0);
    const retards = f.parType("delay");
    const bouclees = retards.filter((r) =>
      f.liaisons.filter(([, cible]) => cible === r.__id).length > 1,
    );
    expect(bouclees.map((r) => r.__id)).toEqual([retards[0].__id]);
  });

  it("amortit la réinjection par un passe-bas à AMORTI_HZ", () => {
    // Sans amortissement, les aigus s'accumulent a chaque tour et les
    // repetitions deviennent stridentes.
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 2; p.fxDelaySpread = 30; p.fxDelayFeedback = 60;
    construireChaineEffets(f.ctx, p, 0);
    const amortis = f.parType("filter").filter(
      (n) => n.type === "lowpass" && (n.frequency as { value: number }).value === AMORTI_HZ,
    );
    expect(amortis).toHaveLength(1);
  });

  it("le gain de réinjection suit reinjection()", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 2; p.fxDelaySpread = 30; p.fxDelayFeedback = 70;
    construireChaineEffets(f.ctx, p, 0);
    const attendu = reinjection(70);
    expect(f.parType("gain").map((g) => (g.gain as { value: number }).value)).toContain(attendu);
  });

  it("rien du tout quand le mélange est à zéro", () => {
    const f = creerContexteFactice();
    construireChaineEffets(f.ctx, neutres(), 0);
    expect(f.parType("delay")).toHaveLength(0);
  });
});

describe("le panoramique et le contexte mono", () => {
  it("EN MONO, aucun panneur n'est construit", () => {
    /**
     * L'invariant le plus important du fichier, et le moins évident.
     *
     * Un `StereoPannerNode` inséré dans un contexte mono est replié par le
     * moteur audio, et ce repli n'est PAS neutre : il vaut 0,5·(G+D). Une
     * prise à fond à gauche ressortirait donc 3 dB sous une prise centrée, et
     * l'équilibre du fichier exporté ne serait plus celui qu'on entend en
     * jouant.
     *
     * Sans panoramique, chaque prise garde le niveau que `niveauPrise` lui
     * donne, et le fichier mono reste la somme fidèle de ce qui est joué.
     */
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelaySpread = 30; p.fxDelayPan = 100;
    construireChaineEffets(f.ctx, p, 0, 1);
    expect(f.parType("panner"), "un panneur est construit en mono").toHaveLength(0);
  });

  it("en stéréo avec une largeur, les panneurs apparaissent", () => {
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelaySpread = 30; p.fxDelayPan = 100;
    construireChaineEffets(f.ctx, p, 0, 2);
    expect(f.parType("panner").length).toBeGreaterThan(0);
  });

  it("en stéréo à largeur nulle, aucun panneur non plus", () => {
    // Un panneur au centre ajouterait un noeud par prise et par note pour un
    // resultat strictement identique.
    const f = creerContexteFactice();
    const p = neutres();
    p.fxDelayMix = 50; p.fxDelayTaps = 4; p.fxDelaySpread = 30; p.fxDelayPan = 0;
    construireChaineEffets(f.ctx, p, 0, 2);
    expect(f.parType("panner")).toHaveLength(0);
  });
});

describe("la chaîne rend toujours une entrée et une sortie", () => {
  it("même entièrement neutre", () => {
    const f = creerContexteFactice();
    const { entree, sortie } = construireChaineEffets(f.ctx, neutres(), 0);
    expect(entree).toBeTruthy();
    expect(sortie).toBeTruthy();
    expect(entree).not.toBe(sortie);
  });

  it("la voie directe atteint la sortie même sans délai", () => {
    // Le signal ne doit jamais se perdre : sans delai, il passe quand meme.
    const f = creerContexteFactice();
    construireChaineEffets(f.ctx, neutres(), 0);
    const sortie = f.noeuds[1];
    expect(f.liaisons.some(([, cible]) => cible === sortie.__id)).toBe(true);
  });
});
