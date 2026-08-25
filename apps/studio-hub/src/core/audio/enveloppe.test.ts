import { describe, expect, it } from "vitest";
import {
  BORNES, ENVELOPPE_DEFAUT, PLANCHER, RAMPE_MIN_SEC,
  dureeAttaqueDeclin, resoudreEnveloppe, courbeEnveloppe, dureeCourbe,
  ENVELOPPES, estEnveloppeAppliquee, formeRampe,
} from "./enveloppe";

describe("resolution des reglages", () => {
  it("convertit les millisecondes en secondes", () => {
    const e = resoudreEnveloppe({ envAttack: 500, envDecay: 250, envSustain: 50, envRelease: 1000 });
    expect(e.ATTACK).toBeCloseTo(0.5, 10);
    expect(e.DECAY).toBeCloseTo(0.25, 10);
    expect(e.SUSTAIN).toBeCloseTo(0.5, 10);
    expect(e.RELEASE).toBeCloseTo(1, 10);
  });

  it("reproduit exactement les valeurs cablees jusqu'ici", () => {
    // Le rack sonnait ainsi avant que l'enveloppe soit reglable. Ajouter des
    // curseurs ne doit pas changer le son par defaut de 91 patches.
    const e = resoudreEnveloppe(ENVELOPPE_DEFAUT);
    expect(e.ATTACK).toBeCloseTo(0.008, 10);
    expect(e.DECAY).toBeCloseTo(0.12, 10);
    expect(e.SUSTAIN).toBeCloseTo(0.75, 10);
    expect(e.RELEASE).toBeCloseTo(0.22, 10);
  });

  it("rend le defaut sur un reglage absent", () => {
    // Les 91 patches d'usine n'ont aucun champ d'enveloppe : sans ce repli,
    // charger l'un d'eux donnerait NaN partout.
    const e = resoudreEnveloppe({});
    expect(e).toEqual(resoudreEnveloppe(ENVELOPPE_DEFAUT));
  });
});

describe("les rampes ne peuvent pas lever", () => {
  it("le maintien n'est jamais nul, curseur a zero", () => {
    // `exponentialRampToValueAtTime(0)` leve. Un curseur MAINTIEN a 0 % est un
    // reglage legitime : il doit donner le silence, pas une exception au
    // premier appui sur une touche.
    expect(resoudreEnveloppe({ envSustain: 0 }).SUSTAIN).toBe(PLANCHER);
    expect(resoudreEnveloppe({ envSustain: -50 }).SUSTAIN).toBe(PLANCHER);
  });

  it("aucune duree n'est nulle", () => {
    // Une rampe de duree zero remet la valeur d'un coup : c'est exactement le
    // clic que l'enveloppe existe pour supprimer.
    const e = resoudreEnveloppe({ envAttack: 0, envDecay: 0, envRelease: 0 });
    expect(e.ATTACK).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
    expect(e.DECAY).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
    expect(e.RELEASE).toBeGreaterThanOrEqual(RAMPE_MIN_SEC);
  });

  it("toutes les valeurs restent strictement positives, quoi qu'on passe", () => {
    // Le filet global. Un seul zero quelque part et le noeud leve, ou clique.
    const aberrants = [NaN, Infinity, -Infinity, -1, -9999, 1e12];
    for (const v of aberrants) {
      const e = resoudreEnveloppe({ envAttack: v, envDecay: v, envSustain: v, envRelease: v });
      for (const [nom, x] of Object.entries(e)) {
        expect(Number.isFinite(x), `${nom} avec ${v}`).toBe(true);
        expect(x, `${nom} avec ${v}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("bornes", () => {
  it("plafonne les durees", () => {
    const e = resoudreEnveloppe({ envAttack: 99999, envDecay: 99999, envRelease: 99999 });
    expect(e.ATTACK).toBeCloseTo(BORNES.attaqueMaxMs / 1000, 10);
    expect(e.DECAY).toBeCloseTo(BORNES.declinMaxMs / 1000, 10);
    expect(e.RELEASE).toBeCloseTo(BORNES.relachementMaxMs / 1000, 10);
  });

  it("le maintien ne depasse pas 1", () => {
    // Au-dela, l'enveloppe amplifierait au lieu de maintenir : la
    // superposition de patches saturerait le bus.
    expect(resoudreEnveloppe({ envSustain: 300 }).SUSTAIN).toBe(1);
  });

  it("le relachement peut etre plus long que l'attaque et le declin reunis", () => {
    // Une nappe : attaque courte, longue queue. Si le plafond du relachement
    // etait celui des autres, ce son serait injouable.
    expect(BORNES.relachementMaxMs).toBeGreaterThan(BORNES.attaqueMaxMs);
  });
});

describe("duree attaque + declin", () => {
  it("additionne les deux phases, sans le relachement", () => {
    // Le relachement demarre quand la note s'arrete, pas apres le declin :
    // l'inclure surdimensionnerait chaque rendu hors ligne.
    const e = resoudreEnveloppe({ envAttack: 100, envDecay: 200, envRelease: 3000 });
    expect(dureeAttaqueDeclin(e)).toBeCloseTo(0.3, 10);
  });
});

describe("courbe de l'enveloppe", () => {
  const REGLAGE = { envAttack: 100, envDecay: 200, envSustain: 50, envRelease: 400 };

  it("part du plancher et atteint exactement 1 au sommet", () => {
    // Le plancher n'est pas une precaution : une rampe exponentielle partant
    // de zero leve. Et si le sommet n'atteignait pas 1, le declin partirait
    // d'ailleurs que de la ou l'attaque s'arrete.
    const c = courbeEnveloppe(REGLAGE);
    expect(c[0].v).toBeCloseTo(PLANCHER, 10);
    expect(Math.max(...c.map((q) => q.v))).toBeCloseTo(1, 10);
  });

  it("le temps ne recule jamais", () => {
    // Un segment qui repartirait en arriere replierait le trace sur lui-meme.
    const c = courbeEnveloppe(REGLAGE);
    for (let i = 1; i < c.length; i++) {
      expect(c[i].t, `recul au point ${i}`).toBeGreaterThanOrEqual(c[i - 1].t - 1e-12);
    }
  });

  it("suit la rampe exponentielle du moteur, pas une droite", () => {
    // A mi-course d'une attaque, une droite donnerait 0,5. L'exponentielle
    // part beaucoup plus bas : c'est ce qu'on entend, et c'est pourquoi le
    // trace ne peut pas etre fait de segments droits.
    const c = courbeEnveloppe({ ...REGLAGE, envAttack: 100 });
    const e = resoudreEnveloppe({ ...REGLAGE, envAttack: 100 });
    const milieu = c.find((q) => Math.abs(q.t - e.ATTACK / 2) < 1e-9);
    expect(milieu, "point de mi-attaque absent").toBeDefined();
    const attendu = PLANCHER * Math.pow(1 / PLANCHER, 0.5);
    expect(milieu!.v).toBeCloseTo(attendu, 10);
    expect(milieu!.v).toBeLessThan(0.5);
  });

  it("tient le maintien a plat, au niveau demande", () => {
    const c = courbeEnveloppe(REGLAGE);
    const e = resoudreEnveloppe(REGLAGE);
    const palier = c.filter((q) => Math.abs(q.v - e.SUSTAIN) < 1e-12);
    expect(palier.length).toBeGreaterThanOrEqual(2);
    expect(e.SUSTAIN).toBeCloseTo(0.5, 10);
  });

  it("redescend au plancher a la fin", () => {
    const c = courbeEnveloppe(REGLAGE);
    expect(c[c.length - 1].v).toBeCloseTo(PLANCHER, 10);
  });

  it("le palier occupe le quart du trace, quels que soient les reglages", () => {
    // Il montre un NIVEAU, pas une duree : on ne sait pas combien de temps la
    // touche sera tenue. Sans largeur garantie, il disparaitrait des qu'un
    // relachement long ecrase le reste.
    for (const r of [
      REGLAGE,
      { envAttack: 1, envDecay: 1, envSustain: 90, envRelease: 4000 },
      { envAttack: 2000, envDecay: 2000, envSustain: 10, envRelease: 1 },
    ]) {
      const e = resoudreEnveloppe(r);
      const total = dureeCourbe(r);
      const tenue = total - (e.ATTACK + e.DECAY + e.RELEASE);
      expect(tenue / total, `palier hors norme pour ${JSON.stringify(r)}`).toBeCloseTo(0.25, 10);
    }
  });

  it("la duree annoncee est celle du dernier point", () => {
    // Deux calculs du total divergeraient, et l'axe des temps ne collerait
    // plus au trace qu'il porte.
    for (const r of [REGLAGE, { envAttack: 5, envDecay: 900, envSustain: 30, envRelease: 60 }]) {
      const c = courbeEnveloppe(r);
      expect(c[c.length - 1].t).toBeCloseTo(dureeCourbe(r), 10);
    }
  });

  it("un reglage aberrant donne une courbe, pas une exception", () => {
    // Meme promesse que `resoudreEnveloppe` : un patch corrompu ne doit pas
    // casser l'affichage.
    for (const r of [{}, { envAttack: NaN }, { envSustain: -50 }, { envRelease: Infinity }]) {
      const c = courbeEnveloppe(r);
      expect(c.length).toBeGreaterThan(10);
      expect(c.every((q) => Number.isFinite(q.t) && Number.isFinite(q.v))).toBe(true);
    }
  });
});

describe("enveloppes predefinies", () => {
  it("ouvre par un retour au reglage d'origine, jamais recopie", () => {
    // Recopier les quatre valeurs ferait diverger le bouton « defaut » du
    // defaut le jour ou celui-ci change : il ne ramenerait plus au point de
    // depart, sans que rien ne le signale.
    const defaut = ENVELOPPES[0];
    expect(defaut.nom).toBe("DÉFAUT");
    for (const nom of ["envAttack", "envDecay", "envSustain", "envRelease"] as const) {
      expect(defaut.reglages[nom], nom).toBe(ENVELOPPE_DEFAUT[nom]);
    }
  });

  it("aucune ne touche a la forme des rampes", () => {
    // La forme est un gout qui traverse tous les sons, pas une caracteristique
    // du PERCUSSIF ou de la NAPPE. Rappeler une enveloppe ne doit pas la
    // changer sous les doigts — surtout qu'on ne la reglerait plus qu'a
    // l'aveugle, chaque predefinie la ramenant a la sienne.
    for (const e of ENVELOPPES) {
      expect(Object.keys(e.reglages), e.nom).not.toContain("envCourbe");
    }
  });

  it("aucune ne sort des bornes des curseurs", () => {
    // Hors bornes, `resoudreEnveloppe` rognerait en silence : le bouton ne
    // s'allumerait jamais, et le son ne serait pas celui annonce.
    for (const e of ENVELOPPES) {
      expect(e.reglages.envAttack, `${e.nom} attaque`).toBeGreaterThanOrEqual(0);
      expect(e.reglages.envAttack, `${e.nom} attaque`).toBeLessThanOrEqual(BORNES.attaqueMaxMs);
      expect(e.reglages.envDecay, `${e.nom} declin`).toBeLessThanOrEqual(BORNES.declinMaxMs);
      expect(e.reglages.envRelease, `${e.nom} relachement`).toBeLessThanOrEqual(BORNES.relachementMaxMs);
      expect(e.reglages.envSustain, `${e.nom} maintien`).toBeGreaterThanOrEqual(0);
      expect(e.reglages.envSustain, `${e.nom} maintien`).toBeLessThanOrEqual(100);
    }
  });

  it("chacune donne une valeur aux quatre phases", () => {
    // Le `Record` complet le garantit au typecheck ; ce test le garantit aussi
    // si quelqu'un elargit le type en `Partial`.
    for (const e of ENVELOPPES) {
      for (const nom of ["envAttack", "envDecay", "envSustain", "envRelease"] as const) {
        expect(typeof e.reglages[nom], `${e.nom} n'a rien pour ${nom}`).toBe("number");
      }
    }
  });

  it("porte des noms distincts, et une aide chacune", () => {
    const noms = ENVELOPPES.map((e) => e.nom);
    expect(new Set(noms).size).toBe(noms.length);
    for (const e of ENVELOPPES) expect(e.aide.length, e.nom).toBeGreaterThan(20);
  });

  it("deux enveloppes ne peuvent pas s'allumer ensemble", () => {
    const empreintes = ENVELOPPES.map((e) => JSON.stringify(e.reglages));
    expect(new Set(empreintes).size).toBe(empreintes.length);
  });

  it("chacune donne bien la forme que son nom annonce", () => {
    // Le nom est une promesse. Sans ce test, « PERCUSSIF » pourrait tenir plus
    // longtemps que « NAPPE » apres une retouche des valeurs.
    const par = (nom: string) => ENVELOPPES.find((e) => e.nom === nom)!;
    const percussif = par("PERCUSSIF"), nappe = par("NAPPE"), orgue = par("ORGUE");

    // Le percussif ne tient rien ; l'orgue tient tout.
    expect(percussif.reglages.envSustain).toBeLessThan(orgue.reglages.envSustain);
    expect(orgue.reglages.envSustain).toBe(100);
    // La nappe monte lentement, le percussif frappe.
    expect(nappe.reglages.envAttack).toBeGreaterThan(percussif.reglages.envAttack * 100);
    // Et elle met bien plus longtemps a partir.
    expect(nappe.reglages.envRelease).toBeGreaterThan(percussif.reglages.envRelease * 10);
  });
});

describe("reconnaissance de l'enveloppe courante", () => {
  const DEFAUT = ENVELOPPES[0];
  const AUTRE = ENVELOPPES[1];

  it("reconnait ses propres reglages", () => {
    expect(estEnveloppeAppliquee(AUTRE.reglages, AUTRE)).toBe(true);
  });

  it("s'eteint des qu'une seule phase bouge — la derniere comprise", () => {
    // Une comparaison qui n'en lirait que trois laisserait le bouton allume
    // sur une enveloppe qu'on vient de quitter au curseur.
    for (const nom of ["envAttack", "envDecay", "envSustain", "envRelease"] as const) {
      const retouche = { ...AUTRE.reglages, [nom]: AUTRE.reglages[nom] + 1 };
      expect(estEnveloppeAppliquee(retouche, AUTRE), `${nom} ignoree`).toBe(false);
    }
  });

  it("ne confond pas deux enveloppes", () => {
    expect(estEnveloppeAppliquee(DEFAUT.reglages, AUTRE)).toBe(false);
    expect(estEnveloppeAppliquee(AUTRE.reglages, DEFAUT)).toBe(false);
  });
});

describe("forme des rampes", () => {
  const REGLAGE = { envAttack: 400, envDecay: 200, envSustain: 50, envRelease: 300 } as const;

  it("l'exponentielle reste le defaut", () => {
    // Changer la forme par defaut ferait changer de son a TOUS les patches
    // existants, sans qu'aucun ait demande quoi que ce soit.
    expect(ENVELOPPE_DEFAUT.envCourbe).toBe("exp");
    expect(formeRampe({})).toBe("exp");
  });

  it("retombe sur l'exponentielle si le reglage ment", () => {
    // Un patch importe peut porter n'importe quoi. Une forme inconnue passee
    // telle quelle ferait tomber dans la branche lineaire par accident.
    for (const v of [undefined, "carre" as never, null as never, 42 as never]) {
      expect(formeRampe({ envCourbe: v })).toBe("exp");
    }
  });

  it("la droite est une droite", () => {
    // Aux quarts de l'attaque, une droite vaut exactement 0,25, 0,50, 0,75.
    const c = courbeEnveloppe({ ...REGLAGE, envCourbe: "lin" });
    const e = resoudreEnveloppe(REGLAGE);
    const au = (t: number) => c.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)).v;
    for (const x of [0.25, 0.5, 0.75]) {
      expect(au(e.ATTACK * x), `a ${x * 100} %`).toBeCloseTo(x, 2);
    }
  });

  it("l'exponentielle part bien plus bas que la droite", () => {
    // C'est toute la difference audible : a mi-attaque, l'exponentielle est
    // encore a un centieme du sommet. Un trace fige sur une seule forme
    // montrerait une attaque que l'on n'entend pas.
    const e = resoudreEnveloppe(REGLAGE);
    const auMilieu = (forme: "exp" | "lin") => {
      const c = courbeEnveloppe({ ...REGLAGE, envCourbe: forme });
      return c.reduce((a, b) => (Math.abs(b.t - e.ATTACK / 2) < Math.abs(a.t - e.ATTACK / 2) ? b : a)).v;
    };
    expect(auMilieu("exp")).toBeLessThan(auMilieu("lin") / 10);
  });

  it("les deux formes gardent les memes bornes et la meme duree", () => {
    // Seule la route change, pas les points de passage : sinon changer de
    // forme deplacerait aussi le sommet ou la fin.
    for (const forme of ["exp", "lin"] as const) {
      const c = courbeEnveloppe({ ...REGLAGE, envCourbe: forme });
      expect(Math.max(...c.map((q) => q.v)), forme).toBeCloseTo(1, 6);
      expect(c[c.length - 1].t, forme).toBeCloseTo(dureeCourbe(REGLAGE), 10);
    }
  });
});
