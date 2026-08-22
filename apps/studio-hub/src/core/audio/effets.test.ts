import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AMORTI_HZ, CHORUS_BASE_SEC, FLANGER_BASE_SEC, FLANGER_FEEDBACK_MAX,
  PHASER_ETAGES, PHASER_MAX_HZ, PHASER_MIN_HZ, REINJECTION_MAX,
  frequenceEtagePhaser, melange, profondeurChorusSec, profondeurModulationSec,
  reinjection, reinjectionFlanger, tempsRetardSec, vitesseChorusHz,
} from "./effets";

/**
 * Le rack d'effets.
 *
 * Ces invariants etaient auparavant verifies en LISANT le source du rack de
 * moteurs — la seule chose possible tant que la chaine vivait au milieu de ses
 * 3900 lignes. Extraite, elle expose des fonctions pures : on teste ce qu'elles
 * rendent, pas comment elles sont ecrites.
 *
 * La difference n'est pas cosmetique. L'ancien test cherchait la chaine exacte
 * `Math.min(0.85, Math.max(0, p.fxDelayFeedback / 100))` : reordonner les deux
 * bornes, ce qui ne change rien, l'aurait fait tomber ; passer a 0,95, ce qui
 * change tout, aurait demande une retouche du test au meme endroit — donc sans
 * frottement.
 */

describe("melange", () => {
  it("rend une proportion, pas un pourcentage", () => {
    expect(melange(0)).toBe(0);
    expect(melange(50)).toBe(0.5);
    expect(melange(100)).toBe(1);
  });

  it("borne des deux cotes", () => {
    expect(melange(-20)).toBe(0);
    expect(melange(300)).toBe(1);
  });

  it("rend 0 sur toute valeur non finie, Infinity comprise", () => {
    // Un NaN traverse `setValueAtTime` sans lever et rend le noeud muet :
    // le pire des defauts, silencieux et sans trace.
    //
    // Infinity retombe sur 0 et non sur 1, contrairement a ce que le bornage
    // suggererait. C'est deliberé : une valeur aberrante doit contourner
    // l'effet, pas le pousser a fond. Un curseur corrompu ne doit pas saturer
    // la sortie.
    expect(melange(NaN)).toBe(0);
    expect(melange(Infinity)).toBe(0);
    expect(melange(-Infinity)).toBe(0);
  });
});

describe("reinjection du delai", () => {
  it("ne depasse jamais le plafond, curseur a fond", () => {
    // C'est une garantie, pas un reglage : un curseur a 100 % ne doit pas
    // pouvoir produire un larsen.
    expect(reinjection(100)).toBe(REINJECTION_MAX);
    expect(reinjection(999)).toBe(REINJECTION_MAX);
  });

  it("reste strictement sous 1 — au-dela la boucle diverge", () => {
    // L'invariant qui compte vraiment. Il survit a un changement de plafond,
    // contrairement a une comparaison avec 0,85 en dur.
    for (let pct = 0; pct <= 200; pct += 5) expect(reinjection(pct)).toBeLessThan(1);
  });

  it("laisse le reglage libre sous le plafond", () => {
    expect(reinjection(35)).toBeCloseTo(0.35, 10);
    expect(reinjection(0)).toBe(0);
  });

  it("ne rend jamais de valeur negative", () => {
    // Une reinjection negative inverserait la phase a chaque tour.
    expect(reinjection(-50)).toBe(0);
    expect(reinjection(NaN)).toBe(0);
  });

  it("croit avec le curseur, jusqu'au plafond", () => {
    let precedent = -1;
    for (let pct = 0; pct <= 85; pct += 5) {
      const v = reinjection(pct);
      expect(v).toBeGreaterThanOrEqual(precedent);
      precedent = v;
    }
  });
});

describe("temps de delai", () => {
  it("convertit les millisecondes en secondes", () => {
    expect(tempsRetardSec(500)).toBe(0.5);
    expect(tempsRetardSec(280)).toBeCloseTo(0.28, 10);
  });

  it("ne depasse pas ce que createDelay(2) accepte", () => {
    // Une valeur au-dela serait silencieusement ramenee, et l'affichage
    // mentirait sur ce qu'on entend.
    expect(tempsRetardSec(5000)).toBe(2);
  });

  it("ne descend pas a zero", () => {
    // Un delai nul rebouclerait sans avancer : la boucle s'emballe en une
    // seule trame.
    expect(tempsRetardSec(0)).toBeGreaterThan(0);
    expect(tempsRetardSec(-100)).toBeGreaterThan(0);
    expect(tempsRetardSec(NaN)).toBeGreaterThan(0);
  });

  it("couvre toute la course du curseur du rack", () => {
    // Le curseur va de 20 a 1200 ms : aucune de ces valeurs ne doit etre
    // ecretee, sinon une partie de la course serait sans effet.
    expect(tempsRetardSec(20)).toBeCloseTo(0.02, 10);
    expect(tempsRetardSec(1200)).toBeCloseTo(1.2, 10);
  });
});

describe("chorus", () => {
  it("la profondeur reste sous le delai de base", () => {
    // Une modulation plus profonde que le retard central rendrait le temps de
    // delai negatif — le noeud revient alors a zero et le chorus se tait par
    // intermittence, ce qui s'entend comme un defaut de son, pas de reglage.
    for (const ms of [0, 1, 5, 10, 50, 1000]) {
      expect(profondeurChorusSec(ms)).toBeLessThan(CHORUS_BASE_SEC);
      expect(CHORUS_BASE_SEC - profondeurChorusSec(ms)).toBeGreaterThan(0);
    }
  });

  it("la profondeur suit le curseur dans sa plage utile", () => {
    // Le curseur va de 0 a 10 ms ; au-dela de ~10,8 ms la borne mord.
    expect(profondeurChorusSec(0)).toBe(0);
    expect(profondeurChorusSec(4)).toBeCloseTo(0.004, 10);
  });

  it("la vitesse reste dans une plage audible comme chorus", () => {
    // Sous 0,1 Hz on n'entend plus de mouvement ; au-dela de 8 Hz ce n'est
    // plus un chorus mais un vibrato.
    expect(vitesseChorusHz(0)).toBe(0.1);
    expect(vitesseChorusHz(15)).toBeCloseTo(1.5, 10);
    expect(vitesseChorusHz(9999)).toBe(8);
    expect(vitesseChorusHz(NaN)).toBe(0.1);
  });

  it("le curseur entier donne bien des dixiemes de Hz", () => {
    // Le curseur ne prend pas de decimales : sans le facteur 10, la plage
    // utile se reduirait a huit crans.
    expect(vitesseChorusHz(1)).toBeCloseTo(0.1, 10);
    expect(vitesseChorusHz(80)).toBeCloseTo(8, 10);
  });
});

describe("structure de la chaine", () => {
  const DIR = path.dirname(fileURLToPath(import.meta.url));
  const SRC = readFileSync(path.join(DIR, "effets.ts"), "utf-8");

  it("l'ordre est saturation → egaliseur → modulation → delai", () => {
    // Ordre d'un pedalier, et il n'est pas arbitraire : egaliser APRES la
    // saturation permet de dompter les aigus qu'elle cree. L'inverse
    // egaliserait un signal que la saturation ecraserait ensuite.
    // `indexOf` rend -1 quand le marqueur est absent, et -1 est plus petit
    // que tout : un premier jet de ce test confondait « absent » et « en
    // premier », donc supprimer une etape entiere le laissait vert.
    const rang = (s: string) => {
      const i = SRC.indexOf(s);
      expect(i, `marqueur « ${s} » absent de la chaine`).toBeGreaterThan(-1);
      return i;
    };
    expect(rang("── Saturation")).toBeLessThan(rang("── Égaliseur"));
    expect(rang("── Égaliseur")).toBeLessThan(rang("── Modulation"));
    expect(rang("── Modulation")).toBeLessThan(rang("── Délai"));
  });

  it("amortit la boucle de reinjection", () => {
    // Sans filtre dans la boucle, les aigus s'accumulent a chaque tour et les
    // repetitions deviennent stridentes.
    expect(SRC).toContain('amorti.type = "lowpass"');
    expect(SRC).toContain("amorti.frequency.setValueAtTime(AMORTI_HZ");
    expect(AMORTI_HZ).toBeGreaterThan(1000);
    expect(AMORTI_HZ).toBeLessThan(20000);
  });

  it("laisse toujours passer la voie directe du delai", () => {
    // Seule la voie retardee est dosee. Sans voie directe, un melange a 0 %
    // rendrait le silence au lieu du son sec.
    const i = SRC.indexOf("── Délai");
    expect(SRC.slice(i, i + 400)).toContain("courant.connect(sortie);");
  });

  it("ne se raccorde a aucune destination", () => {
    // C'est ce qui permet au rendu hors ligne d'utiliser la meme chaine, donc
    // ce qui garantit qu'un echantillon porte exactement les effets entendus.
    expect(SRC).not.toContain("ctx.destination");
  });

  it("saturation et modulation sont contournees quand leur melange est nul", () => {
    // Construire un WaveShaper et un LFO inutiles a chaque note couterait
    // pour rien — et le LFO tournerait indefiniment.
    expect(SRC).toContain("if (doseDrive > 0 && p.fxDriveAmount > 0)");
    expect(SRC).toContain("if (doseMod > 0)");
  });
});

describe("flanger", () => {
  it("son delai central est bien plus court que celui du chorus", () => {
    // C'est TOUTE la difference entre les deux. Au-dessus de ~10 ms l'oreille
    // entend deux sources ; en dessous, un filtre en peigne. Meme graphe, un
    // ordre de grandeur d'ecart. Rapprocher les deux valeurs ferait sonner le
    // flanger comme un chorus, sans qu'aucun type ne s'en plaigne.
    expect(FLANGER_BASE_SEC).toBeLessThan(CHORUS_BASE_SEC / 5);
    expect(FLANGER_BASE_SEC).toBeGreaterThan(0);
  });

  it("sa profondeur reste sous SON delai de base, pas celui du chorus", () => {
    // Le piege : reutiliser la marge du chorus donnerait une profondeur dix
    // fois trop grande, un temps de delai negatif, et un flanger qui se tait
    // par intermittence.
    for (const ms of [0, 1, 5, 10, 1000]) {
      expect(profondeurModulationSec(ms, "flanger")).toBeLessThan(FLANGER_BASE_SEC);
    }
  });

  it("le chorus garde sa marge a lui", () => {
    for (const ms of [0, 1, 5, 10, 1000]) {
      expect(profondeurModulationSec(ms, "chorus")).toBeLessThan(CHORUS_BASE_SEC);
    }
    expect(profondeurModulationSec(4, "chorus")).toBe(profondeurChorusSec(4));
  });

  it("la profondeur du chorus depasse celle du flanger, a reglage egal", () => {
    // Sinon les deux modes sonneraient pareil au meme reglage.
    expect(profondeurModulationSec(10, "chorus")).toBeGreaterThan(
      profondeurModulationSec(10, "flanger")
    );
  });

  it("sa reinjection reste strictement sous 1", () => {
    // Comme celle du delai : au-dela, le peigne devient un sifflement qui ne
    // s'arrete plus.
    for (let pct = 0; pct <= 200; pct += 5) {
      expect(reinjectionFlanger(pct)).toBeLessThan(1);
    }
    expect(reinjectionFlanger(100)).toBe(FLANGER_FEEDBACK_MAX);
    expect(reinjectionFlanger(-30)).toBe(0);
    expect(reinjectionFlanger(NaN)).toBe(0);
  });
});

describe("phaser", () => {
  it("repartit ses etages geometriquement, pas lineairement", () => {
    // L'oreille entend les frequences en RAPPORTS, pas en ecarts. Quatre
    // etages egalement espaces en Hz mettraient trois creux dans les aigus et
    // un seul en bas.
    const f = Array.from({ length: PHASER_ETAGES }, (_, i) => frequenceEtagePhaser(i));
    const rapports = f.slice(1).map((v, i) => v / f[i]);
    for (const r of rapports) expect(r).toBeCloseTo(rapports[0], 6);
  });

  it("couvre exactement la bande annoncee", () => {
    expect(frequenceEtagePhaser(0)).toBeCloseTo(PHASER_MIN_HZ, 6);
    expect(frequenceEtagePhaser(PHASER_ETAGES - 1)).toBeCloseTo(PHASER_MAX_HZ, 6);
  });

  it("monte a chaque etage", () => {
    for (let i = 1; i < PHASER_ETAGES; i++) {
      expect(frequenceEtagePhaser(i)).toBeGreaterThan(frequenceEtagePhaser(i - 1));
    }
  });

  it("borne un index hors plage plutot que de rendre NaN", () => {
    // Une frequence NaN traverse `setValueAtTime` sans lever et rend l'etage
    // muet — defaut silencieux.
    expect(frequenceEtagePhaser(-5)).toBeCloseTo(PHASER_MIN_HZ, 6);
    expect(frequenceEtagePhaser(999)).toBeCloseTo(PHASER_MAX_HZ, 6);
  });

  it("un seul etage ne divise pas par zero", () => {
    // `i / (n - 1)` avec n = 1 donne une division par zero.
    expect(Number.isFinite(frequenceEtagePhaser(0, 1))).toBe(true);
  });

  it("reste dans une bande ou les creux s'entendent", () => {
    // Trop bas, le creux passe sous le fondamental ; trop haut, il n'y a plus
    // grand-chose a creuser.
    expect(PHASER_MIN_HZ).toBeGreaterThanOrEqual(100);
    expect(PHASER_MAX_HZ).toBeLessThanOrEqual(6000);
    expect(PHASER_ETAGES).toBeGreaterThanOrEqual(2);
  });
});

describe("structure des trois modes", () => {
  const DIR2 = path.dirname(fileURLToPath(import.meta.url));
  const S2 = readFileSync(path.join(DIR2, "effets.ts"), "utf-8");

  it("le phaser somme avec la voie directe", () => {
    // Un passe-tout ne change pas l'amplitude : c'est la SOMME avec le signal
    // direct qui creuse le spectre. Sans voie directe, le phaser est inaudible
    // — il laisserait passer le son intact.
    const i = S2.indexOf('=== "phaser"');
    expect(i).toBeGreaterThan(-1);
    const j = S2.indexOf("── Délai", i);
    expect(S2.slice(i, j)).toContain("courant.connect(somme);");
  });

  it("seul le flanger reinjecte", () => {
    // La reinjection est ce qui lui donne son creusement. L'ajouter au chorus
    // en ferait un flanger long, donc un autre effet.
    //
    // Le test verifie l'EXCLUSIVITE, pas la presence. Un premier jet cherchait
    // seulement `p.fxModMode === "flanger"` quelque part : un `|| true`
    // ajoute au garde passait inapercu, et les trois modes reinjectaient.
    expect(S2).toContain("reinjectionFlanger(p.fxModFeedback)");
    const lignes = S2.split("\n");
    const garde = lignes.find((l) => l.includes('p.fxModMode === "flanger"') && l.includes("if ("));
    expect(garde, "garde du flanger introuvable").toBeTruthy();
    expect(garde!.trim()).toBe('if (p.fxModMode === "flanger") {');
  });

  it("les trois partagent un seul LFO par voie", () => {
    // Deux LFO desynchronises sur la meme voie donneraient un battement
    // parasite.
    const i = S2.indexOf("── Modulation");
    const bloc = S2.slice(i, S2.indexOf("── Délai", i));
    expect((bloc.match(/attachLfo\(/g) ?? []).length).toBe(2); // phaser (boucle) + delai module
  });
});
