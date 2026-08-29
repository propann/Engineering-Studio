import { describe, expect, it } from "vitest";
import { creerContexteFactice } from "./contexteFactice";
import {
  FORMANTS,
  MOTEURS_COMPLEMENTAIRES,
  TIRETTES,
  construireDrumMachine,
  construireOrganDrawbars,
  construirePhaseDistortion,
  construireStringMachine,
  construireVocodeur,
  courbePhaseDistortion,
  organDrawbarsLisible,
  PIEDS_TIRETTES,
  type AideVoix,
} from "./moteurs";

/**
 * Les cinq moteurs du second rack, vérifiés sur le graphe qu'ils construisent.
 *
 * Ce qu'on vérifie ici n'est pas « ça sonne bien » — un test ne peut pas
 * l'entendre. C'est plus utile que ça : **est-ce que quelque chose est
 * branché**. Les cinq moteurs ajoutés au rack n'existaient auparavant que
 * comme entrées de menu, et le défaut ne se voyait qu'à l'usage, en appuyant
 * sur une touche silencieuse.
 *
 * Un moteur qui ne crée aucune source, ou qui en crée une sans jamais la
 * relier à sa sortie, échoue ici.
 */

/** Un relevé des services que `construireVoix` prête aux moteurs. */
function aideDeTest() {
  const sources: unknown[] = [];
  const arrets: number[] = [];
  let audible = 0;
  const aide: AideVoix = {
    trk: (n) => {
      sources.push(n);
      return n;
    },
    noteStop: (_n, when) => {
      arrets.push(when);
    },
    holdUntil: (t) => {
      audible = Math.max(audible, t);
    },
  };
  return { aide, sources, arrets, jusquA: () => audible };
}

/** Toutes les cibles atteignables depuis un nœud, en suivant les liaisons. */
function atteignables(
  liaisons: Array<[string, string]>,
  depart: string,
): Set<string> {
  const vus = new Set<string>([depart]);
  let change = true;
  while (change) {
    change = false;
    for (const [de, vers] of liaisons) {
      if (vus.has(de) && !vus.has(vers)) {
        vus.add(vers);
        change = true;
      }
    }
  }
  return vus;
}

describe("chaque moteur produit un graphe relié", () => {
  /**
   * Le test qui compte : une source créée mais jamais reliée à la sortie
   * rendue est une note silencieuse. C'est exactement l'état dans lequel ces
   * cinq moteurs se trouvaient — présents à l'écran, absents du son.
   */
  const cas = [
    {
      nom: "drum_machine",
      jouer: (ctx: BaseAudioContext, aide: AideVoix) =>
        construireDrumMachine(
          ctx,
          { drumVoice: "kick", drumTone: 50, drumDecay: 50, drumNoise: 30, drumDrive: 0 },
          110,
          0,
          aide,
        ),
    },
    {
      nom: "vocoder_dsp",
      jouer: (ctx: BaseAudioContext, aide: AideVoix) =>
        construireVocodeur(
          ctx,
          { vocBands: 8, vocFormant: "a", vocCarrier: "sawtooth", vocBrightness: 60, vocResonance: 50 },
          220,
          0,
          aide,
        ),
    },
    {
      nom: "string_machine",
      jouer: (ctx: BaseAudioContext, aide: AideVoix) =>
        construireStringMachine(
          ctx,
          { strVoices: 5, strDetune: 12, strEnsemble: 70, strTone: 4000, strAttack: 40 },
          330,
          0,
          aide,
        ),
    },
    {
      nom: "organ_drawbars",
      jouer: (ctx: BaseAudioContext, aide: AideVoix) =>
        construireOrganDrawbars(
          ctx,
          { orgDrawbars: "888000000", orgPercussion: 50, orgLeslie: 5, orgKeyClick: 30 },
          220,
          0,
          aide,
        ),
    },
    {
      nom: "phase_distortion",
      jouer: (ctx: BaseAudioContext, aide: AideVoix) =>
        construirePhaseDistortion(
          ctx,
          { pdAmount: 70, pdShape: "saw", pdResonance: 4, pdBits: 8 },
          440,
          0,
          aide,
        ),
    },
  ];

  for (const c of cas) {
    it(`${c.nom} crée au moins une source sonore`, () => {
      const f = creerContexteFactice();
      const { aide, sources } = aideDeTest();
      c.jouer(f.ctx, aide);
      expect(sources.length, `${c.nom} ne crée aucune source`).toBeGreaterThan(0);
    });

    it(`${c.nom} relie ses sources à la sortie qu'il rend`, () => {
      const f = creerContexteFactice();
      const { aide } = aideDeTest();
      const sortie = c.jouer(f.ctx, aide) as unknown as { __id: string };

      // Les oscillateurs et lecteurs de tampon sont les seules sources de son.
      const emetteurs = [...f.parType("osc"), ...f.parType("bufferSource")];
      expect(emetteurs.length).toBeGreaterThan(0);

      for (const e of emetteurs) {
        const cibles = atteignables(f.liaisons, e.__id);
        /**
         * Un oscillateur peut légitimement ne pas atteindre la sortie : c'est
         * le cas d'un LFO, qui module un paramètre. Le contexte factice note
         * ces liaisons comme « param ».
         *
         * On suit la chaîne ENTIÈRE plutôt que la cible directe : un LFO passe
         * d'abord par un gain qui règle son amplitude, et ce n'est que ce gain
         * qui touche le paramètre. Ne regarder qu'un cran plus loin faisait
         * passer les trois LFO du chorus et celui du Leslie pour des
         * oscillateurs muets.
         */
        if (cibles.has("param")) continue;
        expect(
          cibles.has(sortie.__id),
          `${c.nom} : ${e.__id} ne rejoint jamais la sortie`,
        ).toBe(true);
      }
    });

    it(`${c.nom} arrête toutes ses sources`, () => {
      // Une source démarrée sans arrêt programmé sonne jusqu'à ce que la page
      // se ferme, et s'accumule à chaque note.
      const f = creerContexteFactice();
      const { aide, sources, arrets } = aideDeTest();
      c.jouer(f.ctx, aide);
      expect(arrets.length).toBe(sources.length);
      for (const t of arrets) expect(t).toBeGreaterThan(0);
    });

    it(`${c.nom} annonce jusqu'à quand il reste audible`, () => {
      // Sans `holdUntil`, l'enveloppe de l'appelant coupe le moteur avant la
      // fin de sa résonance — le défaut documenté dans `construireVoix`.
      const f = creerContexteFactice();
      const { aide, jusquA } = aideDeTest();
      c.jouer(f.ctx, aide);
      expect(jusquA()).toBeGreaterThan(0);
    });
  }
});

describe("boîte à rythmes", () => {
  const params = { drumVoice: "kick", drumTone: 50, drumDecay: 50, drumNoise: 30, drumDrive: 0 } as const;

  it("le charleston n'a pas de corps tonal, seulement du bruit", () => {
    // Un charleston avec un oscillateur accordé sonnerait comme un tom aigu.
    const f = creerContexteFactice();
    const { aide } = aideDeTest();
    construireDrumMachine(f.ctx, { ...params, drumVoice: "hat" }, 110, 0, aide);
    expect(f.parType("osc").length).toBe(0);
    expect(f.parType("bufferSource").length).toBe(1);
  });

  it("la grosse caisse a un corps tonal", () => {
    const f = creerContexteFactice();
    const { aide } = aideDeTest();
    construireDrumMachine(f.ctx, { ...params, drumVoice: "kick", drumNoise: 0 }, 110, 0, aide);
    expect(f.parType("osc").length).toBe(1);
  });

  it("le charleston filtre en passe-haut, la caisse claire en bande", () => {
    for (const [voix, attendu] of [["hat", "highpass"], ["snare", "bandpass"]] as const) {
      const f = creerContexteFactice();
      const { aide } = aideDeTest();
      construireDrumMachine(f.ctx, { ...params, drumVoice: voix }, 110, 0, aide);
      expect(f.parType("filter")[0].type).toBe(attendu);
    }
  });

  it("la saturation ajoute un étage, et seulement si elle est demandée", () => {
    const sans = creerContexteFactice();
    construireDrumMachine(sans.ctx, { ...params, drumDrive: 0 }, 110, 0, aideDeTest().aide);
    expect(sans.parType("waveshaper").length).toBe(0);

    const avec = creerContexteFactice();
    construireDrumMachine(avec.ctx, { ...params, drumDrive: 60 }, 110, 0, aideDeTest().aide);
    expect(avec.parType("waveshaper").length).toBe(1);
  });

  it("des paramètres absurdes ne produisent pas de valeurs illégales", () => {
    // Les parametres viennent de curseurs, mais aussi de patches importes.
    const f = creerContexteFactice();
    const { aide } = aideDeTest();
    expect(() =>
      construireDrumMachine(
        f.ctx,
        { drumVoice: "kick", drumTone: NaN, drumDecay: -50, drumNoise: 400, drumDrive: NaN },
        110, 0, aide,
      ),
    ).not.toThrow();
  });
});

describe("vocodeur", () => {
  const base = { vocBands: 8, vocFormant: "a", vocCarrier: "sawtooth", vocBrightness: 60, vocResonance: 50 } as const;

  it("construit autant de bandes que demandé", () => {
    for (const n of [3, 8, 16]) {
      const f = creerContexteFactice();
      construireVocodeur(f.ctx, { ...base, vocBands: n }, 220, 0, aideDeTest().aide);
      expect(f.parType("filter").length).toBe(n);
    }
  });

  it("borne le nombre de bandes", () => {
    // Un banc a 400 bandes bloquerait le fil principal a chaque note.
    const f = creerContexteFactice();
    construireVocodeur(f.ctx, { ...base, vocBands: 400 }, 220, 0, aideDeTest().aide);
    expect(f.parType("filter").length).toBe(16);
  });

  it("les trois premières bandes portent les formants de la voyelle", () => {
    /**
     * C'est ce qui fait entendre une voyelle. Si les bandes étaient réparties
     * uniformément, le vocodeur ne serait qu'un filtrage neutre.
     */
    const f = creerContexteFactice();
    construireVocodeur(f.ctx, { ...base, vocFormant: "i" }, 220, 0, aideDeTest().aide);
    const filtres = f.parType("filter");
    for (let i = 0; i < 3; i += 1) {
      expect((filtres[i].frequency as { value: number }).value).toBeCloseTo(FORMANTS.i[i], 0);
    }
  });

  it("les voyelles ont des formants distincts", () => {
    // Sans quoi toutes sonneraient pareil.
    const vus = new Set(Object.values(FORMANTS).map((f) => f.join(",")));
    expect(vus.size).toBe(Object.keys(FORMANTS).length);
  });

  it("aucune bande ne dépasse Nyquist", () => {
    /**
     * Un passe-bande centré au-dessus de la moitié de la fréquence
     * d'échantillonnage ne filtre plus rien de réel, et certains navigateurs
     * lèvent. Le cas se présente dès qu'on demande beaucoup de bandes.
     */
    const f = creerContexteFactice(44100);
    construireVocodeur(f.ctx, { ...base, vocBands: 16 }, 220, 0, aideDeTest().aide);
    for (const filtre of f.parType("filter")) {
      expect((filtre.frequency as { value: number }).value).toBeLessThan(44100 / 2);
    }
  });
});

describe("string machine", () => {
  const base = { strVoices: 5, strDetune: 12, strEnsemble: 70, strTone: 4000, strAttack: 40 } as const;

  it("empile le nombre de voix demandé", () => {
    const f = creerContexteFactice();
    construireStringMachine(f.ctx, { ...base, strVoices: 7, strEnsemble: 0 }, 330, 0, aideDeTest().aide);
    expect(f.parType("osc").length).toBe(7);
  });

  it("le désaccord est réparti autour de la note, pas décalé", () => {
    /**
     * L'erreur classique : décaler toutes les voix dans le même sens
     * transpose l'accord au lieu de l'élargir. La somme des désaccords doit
     * être nulle.
     */
    const f = creerContexteFactice();
    construireStringMachine(f.ctx, { ...base, strVoices: 5, strEnsemble: 0 }, 330, 0, aideDeTest().aide);
    const total = f.parType("osc")
      .reduce((s, o) => s + (o.detune as { value: number }).value, 0);
    expect(total).toBeCloseTo(0, 6);
  });

  it("une voix seule n'est pas désaccordée", () => {
    const f = creerContexteFactice();
    construireStringMachine(f.ctx, { ...base, strVoices: 1, strEnsemble: 0 }, 330, 0, aideDeTest().aide);
    expect((f.parType("osc")[0].detune as { value: number }).value).toBe(0);
  });

  it("le chorus utilise trois retards à vitesses différentes", () => {
    /**
     * Un seul retard modulé donne un vibrato, pas un ensemble. C'est le
     * battement entre modulations désynchronisées qui fait l'épaisseur.
     */
    const f = creerContexteFactice();
    construireStringMachine(f.ctx, { ...base, strVoices: 3, strEnsemble: 80 }, 330, 0, aideDeTest().aide);
    expect(f.parType("delay").length).toBe(3);
    // 3 voix + 3 LFO de chorus
    const taux = f.parType("osc").slice(3).map((o) => (o.frequency as { value: number }).value);
    expect(new Set(taux).size).toBe(3);
  });

  it("sans ensemble, aucun retard n'est construit", () => {
    const f = creerContexteFactice();
    construireStringMachine(f.ctx, { ...base, strEnsemble: 0 }, 330, 0, aideDeTest().aide);
    expect(f.parType("delay").length).toBe(0);
  });
});

describe("orgue à tirettes", () => {
  const base = { orgDrawbars: "888000000", orgPercussion: 0, orgLeslie: 0, orgKeyClick: 0 } as const;

  it("les rapports de tirettes sont ceux d'un Hammond", () => {
    /**
     * Ce ne sont pas des harmoniques régulières : la deuxième tirette est le
     * troisième harmonique, et la troisième la fondamentale. Une pile
     * 1-2-3-4 ne sonnerait pas Hammond.
     */
    expect(TIRETTES[0]).toBeCloseTo(0.5, 4);   // 16'
    expect(TIRETTES[1]).toBeCloseTo(1.4983, 4); // 5⅓' — la quinte
    expect(TIRETTES[2]).toBeCloseTo(1, 4);      // 8' — la fondamentale
    expect(TIRETTES.length).toBe(9);
  });

  it("ne crée un oscillateur que pour les tirettes tirées", () => {
    const f = creerContexteFactice();
    construireOrganDrawbars(f.ctx, { ...base, orgDrawbars: "800000000" }, 220, 0, aideDeTest().aide);
    expect(f.parType("osc").length).toBe(1);

    const g = creerContexteFactice();
    construireOrganDrawbars(g.ctx, { ...base, orgDrawbars: "888888888" }, 220, 0, aideDeTest().aide);
    expect(g.parType("osc").length).toBe(9);
  });

  it("complète un réglage trop court plutôt que de lever", () => {
    // Un patch importe peut porter un reglage abrege.
    const f = creerContexteFactice();
    expect(() =>
      construireOrganDrawbars(f.ctx, { ...base, orgDrawbars: "88" }, 220, 0, aideDeTest().aide),
    ).not.toThrow();
    expect(f.parType("osc").length).toBe(2);
  });

  it("écarte les tirettes qui dépasseraient Nyquist", () => {
    /**
     * La neuvième tirette est à huit fois la fondamentale. Sur une note aiguë
     * elle sort de la bande audible et se replierait en une fréquence grave
     * parasite — un sifflement qu'on n'explique pas.
     */
    const f = creerContexteFactice(44100);
    construireOrganDrawbars(f.ctx, { ...base, orgDrawbars: "888888888" }, 4000, 0, aideDeTest().aide);
    for (const o of f.parType("osc")) {
      expect((o.frequency as { value: number }).value).toBeLessThan(44100 / 2);
    }
    expect(f.parType("osc").length).toBeLessThan(9);
  });

  it("la percussion ajoute un oscillateur court", () => {
    const sans = creerContexteFactice();
    construireOrganDrawbars(sans.ctx, { ...base, orgPercussion: 0 }, 220, 0, aideDeTest().aide);
    const avec = creerContexteFactice();
    construireOrganDrawbars(avec.ctx, { ...base, orgPercussion: 80 }, 220, 0, aideDeTest().aide);
    expect(avec.parType("osc").length).toBe(sans.parType("osc").length + 1);
  });

  it("le Leslie module la hauteur de toutes les roues ensemble", () => {
    // C'est le haut-parleur qui tourne, pas chaque harmonique separement.
    const f = creerContexteFactice();
    construireOrganDrawbars(f.ctx, { ...base, orgDrawbars: "888000000", orgLeslie: 6 }, 220, 0, aideDeTest().aide);
    // Un seul LFO, dont le gain se connecte a plusieurs `detune`.
    const versParam = f.liaisons.filter(([, cible]) => cible === "param");
    expect(versParam.length).toBeGreaterThanOrEqual(3);
  });

  it("le claquement de contact est du bruit très court", () => {
    const f = creerContexteFactice();
    construireOrganDrawbars(f.ctx, { ...base, orgKeyClick: 60 }, 220, 0, aideDeTest().aide);
    expect(f.parType("bufferSource").length).toBe(1);
    expect(f.parType("filter")[0].type).toBe("highpass");
  });
});

describe("phase distortion", () => {
  it("la courbe reste dans [-1, 1]", () => {
    /**
     * Une courbe de waveshaper qui sort de cet intervalle sature brutalement
     * la sortie. Le mode résonant est le plus exposé : il multiplie une
     * sinusoïde par une enveloppe et un facteur.
     */
    for (const forme of ["saw", "square", "pulse", "resonant"] as const) {
      for (const q of [0, 0.5, 1]) {
        const c = courbePhaseDistortion(forme, q, 8);
        for (const v of c) {
          expect(Number.isFinite(v)).toBe(true);
          expect(Math.abs(v)).toBeLessThanOrEqual(1.0001);
        }
      }
    }
  });

  it("sans déformation, la courbe est une sinusoïde", () => {
    // Le point de repere : quantite 0 doit rendre le signal d'origine.
    const c = courbePhaseDistortion("saw", 0, 4, 1024);
    // t=0 -> sin(0) = 0 ; t=0.25 -> sin(pi/2) = 1
    expect(c[0]).toBeCloseTo(0, 5);
    expect(c[256]).toBeCloseTo(1, 2);
  });

  it("la déformation change réellement la courbe", () => {
    // Un parametre sans effet audible est le defaut que ce depot a deja paye.
    const douce = courbePhaseDistortion("saw", 0, 4, 512);
    const forte = courbePhaseDistortion("saw", 1, 4, 512);
    const ecart = douce.reduce((s, v, i) => s + Math.abs(v - forte[i]), 0);
    expect(ecart).toBeGreaterThan(10);
  });

  it("chaque forme donne une courbe distincte", () => {
    const vues = new Set(
      (["saw", "square", "pulse", "resonant"] as const).map((f) =>
        courbePhaseDistortion(f, 0.7, 6, 256).join(","),
      ),
    );
    expect(vues.size).toBe(4);
  });

  it("le mode résonant suit le nombre de cycles demandé", () => {
    // Plus de cycles = plus de passages par zero.
    const zeros = (c: Float32Array) => {
      let n = 0;
      for (let i = 1; i < c.length; i += 1) if (c[i - 1] < 0 !== c[i] < 0) n += 1;
      return n;
    };
    expect(zeros(courbePhaseDistortion("resonant", 1, 8, 2048))).toBeGreaterThan(
      zeros(courbePhaseDistortion("resonant", 1, 2, 2048)),
    );
  });

  it("le suréchantillonnage est activé", () => {
    /**
     * La déformation crée des harmoniques bien au-dessus de la fondamentale.
     * Sans suréchantillonnage elles se replient en graves parasites — et le
     * son devient métallique dans l'aigu sans qu'on comprenne pourquoi.
     */
    const f = creerContexteFactice();
    construirePhaseDistortion(
      f.ctx,
      { pdAmount: 80, pdShape: "saw", pdResonance: 4, pdBits: 16 },
      440, 0, aideDeTest().aide,
    );
    expect(f.parType("waveshaper")[0].oversample).toBe("4x");
  });

  it("la réduction de bits n'ajoute un étage que sous 16 bits", () => {
    const plein = creerContexteFactice();
    construirePhaseDistortion(plein.ctx, { pdAmount: 50, pdShape: "saw", pdResonance: 4, pdBits: 16 }, 440, 0, aideDeTest().aide);
    expect(plein.parType("waveshaper").length).toBe(1);

    const crush = creerContexteFactice();
    construirePhaseDistortion(crush.ctx, { pdAmount: 50, pdShape: "saw", pdResonance: 4, pdBits: 8 }, 440, 0, aideDeTest().aide);
    expect(crush.parType("waveshaper").length).toBe(2);
  });
});

describe("lire un réglage de tirettes", () => {
  it("nomme les registres tirés, pas les positions", () => {
    // « 888000000 » ne dit rien ; « 16' 5⅓' 8' » se lit.
    expect(organDrawbarsLisible("888000000")).toBe("16' 5⅓' 8'");
    expect(organDrawbarsLisible("008000000")).toBe("8'");
  });

  it("dit « aucune » plutôt que de rendre une chaîne vide", () => {
    expect(organDrawbarsLisible("000000000")).toBe("aucune");
    expect(organDrawbarsLisible("")).toBe("aucune");
  });

  it("complète ou tronque un réglage mal formé", () => {
    expect(organDrawbarsLisible("88")).toBe("16' 5⅓'");
    expect(organDrawbarsLisible("8888888888888")).toBe(PIEDS_TIRETTES.join(" "));
  });

  it("il y a neuf registres, autant que de tirettes", () => {
    expect(PIEDS_TIRETTES.length).toBe(TIRETTES.length);
  });
});

describe("le rack compte bien vingt moteurs", () => {
  it("cinq moteurs complémentaires sont déclarés", () => {
    expect(MOTEURS_COMPLEMENTAIRES.length).toBe(5);
    expect(new Set(MOTEURS_COMPLEMENTAIRES).size).toBe(5);
  });
});
