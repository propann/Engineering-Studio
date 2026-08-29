import { describe, expect, it } from "vitest";
import { creerContexteFactice } from "../audio/contexteFactice";
import { MOTEURS_RACK } from "./sons";
import {
  MOTEURS_JOUABLES,
  construireVoixStrudel,
  enregistrerMoteurs,
  surchargesDepuisMotif,
  type ApiEnregistrement,
  type ValeurMotif,
} from "./moteursStrudel";

/**
 * Les vingt moteurs du rack, joues depuis un motif.
 *
 * Ce qui est verifie ici : qu'un `.sound("mi_plaits")` produise reellement un
 * graphe audio relie. C'est exactement ce que la page orpheline
 * `StrudelLiveStudio.tsx` promettait sans le faire — quatorze appels moteur
 * qui n'auraient rien produit.
 */

function aideDeTest() {
  return { sources: [] as unknown[] };
}

const VALEUR: ValeurMotif = { note: 60, duration: 0.25 };

describe("les vingt moteurs sont enregistres", () => {
  it("la liste couvre les deux racks", () => {
    expect(MOTEURS_JOUABLES.length).toBe(20);
    expect(new Set(MOTEURS_JOUABLES).size).toBe(20);
  });

  it("elle ne diverge pas de celle que le rack annonce", () => {
    /**
     * `MOTEURS_RACK` sert l'avertissement « son introuvable » et le panneau
     * des sons ; `MOTEURS_JOUABLES` sert l'enregistrement. Deux listes
     * divergentes donneraient un moteur enregistre mais signale comme absent,
     * ou l'inverse.
     */
    expect([...MOTEURS_JOUABLES].sort()).toEqual([...MOTEURS_RACK].sort());
  });

  it("`enregistrerMoteurs` les declare tous", () => {
    const vus: string[] = [];
    const api: ApiEnregistrement = { registerSound: (nom) => void vus.push(nom) };
    const rendus = enregistrerMoteurs(api, () => creerContexteFactice().ctx, () => null);
    expect(vus.length).toBe(20);
    expect(rendus.length).toBe(20);
  });

  it("un nom refuse n'empeche pas les autres", () => {
    // Une version future de superdough pourrait rejeter un nom ; dix-neuf
    // moteurs valent mieux que zero.
    let n = 0;
    const api: ApiEnregistrement = {
      registerSound: (nom) => {
        n += 1;
        if (nom === "helm") throw new Error("nom refuse");
      },
    };
    const rendus = enregistrerMoteurs(api, () => creerContexteFactice().ctx, () => null);
    expect(n).toBe(20);
    expect(rendus.length).toBe(19);
    expect(rendus).not.toContain("helm");
  });
});

describe("chaque moteur construit une voix jouable", () => {
  for (const moteur of MOTEURS_JOUABLES) {
    it(`${moteur} produit un graphe relie a sa sortie`, () => {
      const f = creerContexteFactice();
      const voix = construireVoixStrudel(f.ctx, moteur, 0, VALEUR);
      const sortie = voix.node as unknown as { __id: string };

      const emetteurs = [...f.parType("osc"), ...f.parType("bufferSource")];
      expect(emetteurs.length, `${moteur} ne cree aucune source`).toBeGreaterThan(0);

      // Atteignabilite depuis chaque source, en suivant les liaisons.
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
        expect(vus.has(sortie.__id), `${moteur} : ${e.__id} n'atteint pas la sortie`).toBe(true);
      }
    });

    it(`${moteur} peut etre arrete sans lever`, () => {
      // superdough appelle `stop` a la fin de chaque evenement du motif. Une
      // exception la couperait le motif entier.
      const f = creerContexteFactice();
      const voix = construireVoixStrudel(f.ctx, moteur, 0, VALEUR);
      expect(() => voix.stop(0.5)).not.toThrow();
    });
  }
});

describe("ce qui traverse depuis le motif", () => {
  it("le moteur demande devient l'actif", () => {
    expect(surchargesDepuisMotif({}, "mi_rings").activeEngine).toBe("mi_rings");
  });

  it("`.cutoff()` vise le parametre du bon moteur", () => {
    /**
     * Il n'existe pas de coupure universelle : chaque moteur nomme la sienne.
     * Router `.cutoff()` vers un seul d'entre eux donnerait un controle qui
     * marche sur un moteur et pas sur les autres.
     */
    expect(surchargesDepuisMotif({ cutoff: 900 }, "open303").acidCutoff).toBe(900);
    expect(surchargesDepuisMotif({ cutoff: 900 }, "helm").helmCutoff).toBe(900);
    expect(surchargesDepuisMotif({ cutoff: 900 }, "surge_xt").surgeCutoff).toBe(900);
    expect(surchargesDepuisMotif({ cutoff: 900 }, "amsynth").amCutoff).toBe(900);
  });

  it("un moteur sans coupure nommee n'en recoit pas", () => {
    // Inventer une correspondance donnerait un curseur inerte.
    const s = surchargesDepuisMotif({ cutoff: 900 }, "mi_rings");
    expect(Object.keys(s)).toEqual(["activeEngine"]);
  });

  it("une valeur absente ne surcharge rien", () => {
    expect(Object.keys(surchargesDepuisMotif({}, "open303"))).toEqual(["activeEngine"]);
  });
});

describe("l'enveloppe evite les clics", () => {
  it("le gain ne part jamais de zero", () => {
    /**
     * `exponentialRampToValueAtTime` rejette la valeur zero. Un plancher
     * oublie leve a la premiere note — donc a chaque evenement du motif.
     */
    const f = creerContexteFactice();
    expect(() =>
      construireVoixStrudel(f.ctx, "open303", 0, { note: 60, gain: 0, sustain: 0 }),
    ).not.toThrow();
  });

  it("un gain absent prend une valeur raisonnable", () => {
    const f = creerContexteFactice();
    const voix = construireVoixStrudel(f.ctx, "open303", 0, { note: 60 });
    expect(voix.node).toBeTruthy();
  });
});
