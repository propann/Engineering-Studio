import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { creerContexteFactice } from "./contexteFactice";
import {
  MOTEURS_OP1,
  PARAMS_OP1_DEFAUT,
  construireMoteurOp1,
  estMoteurOp1,
  type ParamsOp1,
} from "./moteursOp1";
import type { AideVoix } from "./moteurs";

/**
 * Les moteurs natifs de l'OP-1.
 *
 * Ce que ces tests protegent : que chacun sonne DIFFEREMMENT. Ils partageaient
 * une seule synthese generique — deux oscillateurs et un filtre — et seul le
 * nom changeait a l'ecran. Un test qui verifierait seulement « ca produit du
 * son » aurait passe sur l'ancien code.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));

function aideDeTest() {
  const sources: unknown[] = [];
  const arrets: number[] = [];
  let audible = 0;
  const aide: AideVoix = {
    trk: (n) => { sources.push(n); return n; },
    noteStop: (_n, quand) => void arrets.push(quand),
    holdUntil: (t) => { audible = Math.max(audible, t); },
  };
  return { aide, sources, arrets, jusquA: () => audible };
}

/**
 * Une empreinte du graphe : types de noeuds, frequences ET courbes.
 *
 * Elle releve TOUT ce qu'un moteur peut poser : type, frequence, gain, Q,
 * desaccord et courbe. Chaque champ omis est un potentiometre qu'on
 * declarerait inerte a tort — `digital` fait son timbre par la courbe de son
 * quantificateur, `dna` par les gains de ses partiels. Les deux ont ete
 * signales comme inertes par une premiere version trop courte de cette
 * empreinte, alors qu'ils fonctionnaient.
 */
function empreinte(f: ReturnType<typeof creerContexteFactice>): string {
  return f.noeuds
    .map((n) => {
      const type = typeof n.type === "string" ? n.type : "";
      /**
       * On lit la SEQUENCE posee, pas la valeur finale.
       *
       * `.value` porte la derniere valeur ecrite. `dna` termine chaque partiel
       * par `exponentialRampToValueAtTime(0.0001)` : leurs gains finissent
       * donc tous a 0,0001, quel que soit le timbre. L'empreinte le declarait
       * inerte alors qu'il ne l'est pas — le contexte factice garde
       * `valeursPosees` pour exactement ce cas.
       */
      const suite = (nom: string) => {
        const param = n[nom] as { valeursPosees?: number[]; value?: number } | undefined;
        if (!param) return "";
        return param.valeursPosees?.length
          ? param.valeursPosees.map((v) => v.toFixed(4)).join(",")
          : String(param.value ?? "");
      };
      const freq = suite("frequency");
      const courbe = n.curve as Float32Array | null | undefined;
      // Quelques points suffisent a distinguer deux courbes : les relever
      // toutes ferait une empreinte de plusieurs kilo-octets par noeud.
      const c = courbe
        ? `${courbe.length}/${[0, 0.25, 0.5, 0.75]
            .map((r) => courbe[Math.floor(r * (courbe.length - 1))]?.toFixed(4))
            .join(",")}`
        : "";
      const gain = suite("gain");
      const q = suite("Q");
      const detune = suite("detune");
      // `voltage` fait son timbre par l'onde de Fourier posee sur
      // l'oscillateur : sans elle, il paraissait insensible a son propre
      // potentiometre. Quatrieme champ que cette empreinte a du apprendre a
      // voir — chaque oubli accuse un moteur qui fonctionne.
      const onde = n.__onde as { real?: Float32Array } | undefined;
      const o = onde?.real
        ? `${onde.real.length}/${[1, 2, 3, 5]
            .map((i) => onde.real![i]?.toFixed(5))
            .join(",")}`
        : "";
      return `${n.__kind}:${type}:${freq}:${gain}:${q}:${detune}:${c}:${o}`;
    })
    .sort()
    .join("|");
}

describe("chaque moteur natif produit un graphe relie", () => {
  for (const moteur of MOTEURS_OP1) {
    it(`${moteur} cree des sources et les relie a sa sortie`, () => {
      const f = creerContexteFactice();
      const { aide } = aideDeTest();
      const sortie = construireMoteurOp1(f.ctx, moteur, PARAMS_OP1_DEFAUT, 220, 0, aide) as
        unknown as { __id: string } | null;
      expect(sortie, `${moteur} ne rend aucune sortie`).toBeTruthy();

      const emetteurs = [...f.parType("osc"), ...f.parType("bufferSource")];
      expect(emetteurs.length).toBeGreaterThan(0);

      for (const e of emetteurs) {
        const vus = new Set<string>([e.__id]);
        let change = true;
        while (change) {
          change = false;
          for (const [de, vers] of f.liaisons) {
            if (vus.has(de) && !vus.has(vers)) { vus.add(vers); change = true; }
          }
        }
        // Un LFO module un parametre : il n'a pas a rejoindre la sortie.
        if (vus.has("param")) continue;
        expect(vus.has(sortie!.__id), `${moteur} : ${e.__id} n'atteint pas la sortie`).toBe(true);
      }
    });

    it(`${moteur} arrete toutes ses sources`, () => {
      const f = creerContexteFactice();
      const { aide, sources, arrets } = aideDeTest();
      construireMoteurOp1(f.ctx, moteur, PARAMS_OP1_DEFAUT, 220, 0, aide);
      expect(arrets.length).toBe(sources.length);
    });

    it(`${moteur} annonce jusqu'a quand il reste audible`, () => {
      const f = creerContexteFactice();
      const { aide, jusquA } = aideDeTest();
      construireMoteurOp1(f.ctx, moteur, PARAMS_OP1_DEFAUT, 220, 0, aide);
      expect(jusquA()).toBeGreaterThan(0);
    });

    it(`${moteur} encaisse des reglages absurdes`, () => {
      // Ils viennent de potentiometres, mais aussi de patches importes.
      const f = creerContexteFactice();
      const fous: ParamsOp1 = {
        op1Timbre: NaN, op1Forme: -300, op1Mouvement: 1e9, op1Decay: NaN,
      };
      expect(() => construireMoteurOp1(f.ctx, moteur, fous, 220, 0, aideDeTest().aide)).not.toThrow();
    });
  }
});

describe("ils sonnent differemment les uns des autres", () => {
  it("aucun ne construit le meme graphe qu'un autre", () => {
    /**
     * LE test qui compte. Les cinq partageaient un repli generique : deux
     * oscillateurs et un filtre, identiques pour tous. Verifier qu'ils
     * produisent du son n'aurait rien signale — c'etait deja le cas.
     */
    const empreintes = new Map<string, string>();
    for (const moteur of MOTEURS_OP1) {
      const f = creerContexteFactice();
      construireMoteurOp1(f.ctx, moteur, PARAMS_OP1_DEFAUT, 220, 0, aideDeTest().aide);
      empreintes.set(moteur, empreinte(f));
    }
    const vues = new Map<string, string[]>();
    for (const [moteur, e] of empreintes) {
      vues.set(e, [...(vues.get(e) ?? []), moteur]);
    }
    const jumeaux = [...vues.values()].filter((l) => l.length > 1);
    expect(
      jumeaux,
      `moteurs au graphe identique : ${jumeaux.map((l) => l.join("+")).join(", ")}`,
    ).toEqual([]);
  });

  it("le timbre change reellement le graphe", () => {
    // Un potentiometre sans effet est le defaut que ce depot a deja paye.
    for (const moteur of MOTEURS_OP1) {
      const bas = creerContexteFactice();
      construireMoteurOp1(bas.ctx, moteur, { ...PARAMS_OP1_DEFAUT, op1Timbre: 0 }, 220, 0, aideDeTest().aide);
      const haut = creerContexteFactice();
      construireMoteurOp1(haut.ctx, moteur, { ...PARAMS_OP1_DEFAUT, op1Timbre: 100 }, 220, 0, aideDeTest().aide);
      expect(
        empreinte(bas) !== empreinte(haut) || bas.noeuds.length !== haut.noeuds.length,
        `${moteur} : le timbre ne change rien`,
      ).toBe(true);
    }
  });
});

describe("les identifiants", () => {
  it("`estMoteurOp1` ne reconnait que les siens", () => {
    for (const m of MOTEURS_OP1) expect(estMoteurOp1(m)).toBe(true);
    for (const m of ["mi_plaits", "open303", "Digital", ""]) expect(estMoteurOp1(m)).toBe(false);
  });

  it("un identifiant inconnu rend null plutot que de lever", () => {
    // L'appelant retombe sur son propre repli : mieux qu'une note qui casse
    // la page.
    const f = creerContexteFactice();
    expect(construireMoteurOp1(f.ctx, "inconnu", PARAMS_OP1_DEFAUT, 220, 0, aideDeTest().aide)).toBeNull();
  });

  it("le clavier de l'OP-1 les traduit tous", () => {
    /**
     * `op1SynthEngine.ts` fait la correspondance entre les noms d'ecran
     * — « Digital » — et ceux de la bibliotheque. Un moteur ajoute ici sans
     * y etre traduit retomberait dans le repli generique sans que personne ne
     * le remarque : exactement le defaut corrige.
     */
    const source = readFileSync(
      path.join(DIR, "..", "..", "..", "..", "op1-studio", "app", "lib", "op1SynthEngine.ts"),
      "utf-8",
    );
    const i = source.indexOf("function moteurNatif");
    expect(i, "la traduction a disparu du clavier OP-1").toBeGreaterThan(-1);
    const bloc = source.slice(i, source.indexOf("}\n", source.indexOf("switch", i)));
    for (const m of MOTEURS_OP1) {
      expect(bloc, `${m} n'est pas traduit par le clavier`).toContain(`"${m}"`);
    }
  });
});
