import { attachLfo, buildSaturationCurve, type ModeSaturation } from "@studio-hub/core/audio/dsp";

/**
 * Le rack d'effets — tout ce qui **traite** le son.
 *
 * Trois racks, trois métiers : le rack MIDI produit les notes, le rack de
 * moteurs en fait du son, celui-ci le traite. La chaîne vivait au milieu des
 * 3900 lignes du rack de moteurs, ce qui rendait la séparation invisible dans
 * le code — elle n'existait que dans l'interface.
 *
 * Elle ne connaît ni les moteurs, ni les patches, ni React : un contexte, des
 * réglages, un couple entrée/sortie. C'est ce qui la rend réutilisable, et
 * c'est aussi ce qui la rend testable.
 *
 * Ordre de la chaîne : **saturation → égaliseur → chorus → délai**. C'est
 * l'ordre d'un pédalier, et il n'est pas arbitraire — égaliser après la
 * saturation permet de dompter les aigus qu'elle crée ; l'inverse égaliserait
 * un signal que la saturation écraserait ensuite.
 */

export type ParamsEffets = {
  fxDriveMix: number;      // %
  fxDriveAmount: number;   // %
  fxDriveMode: ModeSaturation;
  fxEqLow: number;         // dB
  fxEqMid: number;         // dB
  fxEqHigh: number;        // dB
  fxModMode: "chorus" | "flanger" | "phaser";
  fxModMix: number;        // %
  fxModRate: number;       // Hz ×10 (curseur entier)
  fxModDepth: number;      // millièmes de seconde (chorus, flanger)
  fxModFeedback: number;   // % — flanger seulement
  fxDelayMix: number;      // %
  fxDelayTime: number;     // ms
  fxDelayFeedback: number; // %
  fxDelayTaps: number;     // nombre de prises, 1 = délai simple
  fxDelaySpread: number;   // % — écart entre prises, 0 = toutes au même temps
  fxDelayPan: number;      // % — largeur stéréo des prises, 0 = toutes au centre
};

/**
 * Les trois bandes de l'égaliseur.
 *
 * Une seule table, lue par la construction du graphe audio ET par le calcul de
 * la courbe de réponse affichée dans le rack. Le jour où l'une des deux recopie
 * ces valeurs, elles divergent au premier réglage — et le graphe montre une
 * courbe que le son ne produit pas, sans que rien ne le signale : chacun reste
 * cohérent de son côté.
 *
 * `reglage` désigne le champ de `ParamsEffets` qui porte le gain de la bande.
 * Le dériver évite la table de correspondance parallèle qu'il faudrait tenir à
 * jour à chaque bande ajoutée.
 *
 * Le Q ne concerne que la cloche : l'API Web Audio IGNORE `Q` sur un filtre en
 * plateau et impose une pente S = 1. Le préciser sur les plateaux laisserait
 * croire qu'il agit.
 */
export type BandeEq = {
  nom: string;
  type: "lowshelf" | "peaking" | "highshelf";
  frequence: number;
  /** Le champ de `ParamsEffets` qui porte le gain de cette bande, en dB. */
  reglage: "fxEqLow" | "fxEqMid" | "fxEqHigh";
  /** Cloche seulement — voir ci-dessus. */
  q?: number;
};

export const BANDES_EQ: readonly BandeEq[] = [
  { nom: "GRAVES",  type: "lowshelf",  frequence: 220,  reglage: "fxEqLow" },
  { nom: "MÉDIUMS", type: "peaking",   frequence: 1200, reglage: "fxEqMid",  q: 0.9 },
  { nom: "AIGUS",   type: "highshelf", frequence: 5200, reglage: "fxEqHigh" },
];

/** Débattement d'une bande, en dB. Les curseurs du rack s'y accordent. */
export const EQ_DB_MAX = 18;

/**
 * Une courbe prête à rappeler.
 *
 * `gains` est un `Record` **complet** des bandes, pas un partiel. Ajouter une
 * bande à `BANDES_EQ` casse alors le typecheck sur chaque courbe tant qu'elle
 * n'a pas reçu sa valeur. Un partiel aurait compilé : la bande neuve serait
 * restée là où le curseur précédent l'avait laissée, et la courbe rappelée
 * n'aurait pas été celle que son nom annonce — sans que rien ne le signale.
 */
export type CourbeEqPredefinie = {
  nom: string;
  /** Ce qu'elle fait à l'oreille, en une phrase. Sert d'infobulle. */
  aide: string;
  gains: Record<BandeEq["reglage"], number>;
};

/**
 * Les courbes prédéfinies.
 *
 * Trois curseurs en dB demandent de savoir d'avance ce qu'on cherche. Ces
 * courbes donnent des points de départ nommés, qu'on retouche ensuite au
 * curseur : elles ne verrouillent rien.
 *
 * PLAT ouvre la liste et n'est pas décoratif. Sans retour au neutre, essayer
 * une courbe est une porte à sens unique — il faudrait se rappeler trois
 * nombres pour revenir. C'est ce qui décide de s'autoriser à essayer.
 *
 * Les valeurs restent modestes — le tiers du débattement au plus. Une courbe
 * prédéfinie qui pousse à ±18 dB ne laisse plus de place au réglage fin, et
 * sature l'étage suivant de la chaîne alors qu'elle prétend juste colorer.
 */
export const COURBES_EQ: readonly CourbeEqPredefinie[] = [
  {
    nom: "PLAT",
    aide: "Les trois bandes à zéro : l'égaliseur laisse passer sans rien changer",
    gains: { fxEqLow: 0, fxEqMid: 0, fxEqHigh: 0 },
  },
  {
    nom: "CHALEUR",
    aide: "Graves posés, aigus retenus : arrondit un son dur sans l'assourdir",
    gains: { fxEqLow: 5, fxEqMid: 0, fxEqHigh: -3 },
  },
  {
    nom: "SOURIRE",
    aide: "Les deux bouts relevés, le milieu creusé : le son d'une sono de club",
    gains: { fxEqLow: 6, fxEqMid: -5, fxEqHigh: 5 },
  },
  {
    nom: "PRÉSENCE",
    aide: "Médiums en avant : fait ressortir le corps d'un son noyé dans la superposition",
    gains: { fxEqLow: -2, fxEqMid: 5, fxEqHigh: 1 },
  },
  {
    nom: "AIR",
    aide: "Aigus ouverts : aère un son mat, au risque de réveiller le souffle",
    gains: { fxEqLow: 0, fxEqMid: -2, fxEqHigh: 6 },
  },
];

/**
 * La courbe courante est-elle exactement celle-ci ?
 *
 * Lu sur `BANDES_EQ` : une bande ajoutée entre dans la comparaison sans qu'on
 * y pense. Comparer trois champs nommés à la main aurait laissé la quatrième
 * bande hors du test, et deux courbes différentes se seraient dites égales.
 */
export function estCourbeAppliquee(
  params: Pick<ParamsEffets, "fxEqLow" | "fxEqMid" | "fxEqHigh">,
  courbe: CourbeEqPredefinie,
): boolean {
  return BANDES_EQ.every((bande) => params[bande.reglage] === courbe.gains[bande.reglage]);
}

/**
 * Position stéréo d'une prise, de -1 (gauche) à +1 (droite).
 *
 * **La première reste au centre**, toujours. C'est l'écho principal, celui qui
 * porte le temps réglé ; le déplacer décalerait tout l'effet d'un côté, y
 * compris avec une seule prise — où « panoramique des prises » ne veut rien
 * dire. Les suivantes alternent, ce qui donne le renvoi de balle habituel.
 *
 * Alternance et non étalement progressif : avec deux prises, un étalement ne
 * bougerait presque rien, alors que l'alternance sépare immédiatement l'écho
 * de sa source. C'est le réglage à une ou deux prises qui décide, puisque
 * c'est le plus courant.
 */
export function panoramiquePrise(index: number, largeurPourcent: number): number {
  if (index <= 0) return 0;
  const largeur = Number.isFinite(largeurPourcent)
    ? Math.max(0, Math.min(100, largeurPourcent)) / 100
    : 0;
  // Sortie anticipée à largeur nulle, et pas seulement par économie : la
  // négation d'un zéro rend -0, qui sonne comme 0 mais ne lui est pas égal au
  // sens de `Object.is`. Une prise impaire rendrait donc « -0 » là où sa
  // voisine rend « 0 », et la valeur voyagerait ainsi dans les patches.
  if (largeur === 0) return 0;
  return index % 2 === 1 ? -largeur : largeur;
}

/** Plafond de réinjection. Au-delà, la boucle diverge et sature indéfiniment. */
export const REINJECTION_MAX = 0.85;

/** Nombre maximal de prises. Au-delà, elles se confondent en réverbération. */
export const TAPS_MAX = 8;

/**
 * Temps des prises d'un délai multi-prises.
 *
 * Chaque prise est un délai distinct, réparti entre le temps de base et son
 * multiple selon l'écart. À écart nul toutes les prises tombent sur le même
 * temps — ce qui n'ajoute rien, juste du gain : d'où le repli sur une prise.
 *
 * Les prises sont **décroissantes en niveau** : la plus lointaine est la plus
 * faible, sinon l'écho serait plus fort que la source.
 */
export function tempsDesPrises(msBase: number, prises: number, ecartPourcent: number): number[] {
  const n = Math.max(1, Math.min(TAPS_MAX, Math.floor(prises) || 1));
  const base = tempsRetardSec(msBase);
  // Raccourci, pas un comportement : avec une seule prise le calcul général
  // donne `base × (1 + 0 × écart)` = `base`. Vérifié par sabotage — retirer
  // cette ligne ne change aucun résultat. Elle reste pour dire l'intention.
  if (n === 1) return [base];
  const ecart = Number.isFinite(ecartPourcent)
    ? Math.max(0, Math.min(100, ecartPourcent)) / 100
    : 0;
  if (ecart === 0) return [base];

  // L'écart se met à l'échelle de ce qui TIENT sous le plafond, au lieu d'être
  // rogné prise par prise.
  //
  // Chaque prise était bornée séparément à 2 s — le maximum de `createDelay(2)`.
  // Passé un certain temps de base, plusieurs prises retombaient donc sur la
  // même valeur : à 1200 ms et 100 % d'écart, quatre prises n'en donnaient que
  // deux distinctes, trois d'entre elles empilées sur 2,0 s. Ce n'est pas un
  // détail d'arrondi — ces trois-là sonnaient comme un seul écho plus fort, et
  // les nœuds correspondants tournaient pour rien.
  //
  // La dernière prise vise maintenant le plafond, et les autres se répartissent
  // jusqu'à elle. Le curseur d'écart règle donc l'étalement réel plutôt que de
  // saturer : au-delà d'un certain point il n'ajoute plus rien, mais il ne
  // détruit plus les prises intermédiaires.
  const facteurVoulu = 1 + (n - 1) * ecart;
  const facteurTenable = 2 / base;
  const echelle = facteurVoulu > facteurTenable
    ? Math.max(0, (facteurTenable - 1) / (facteurVoulu - 1))
    : 1;

  return Array.from({ length: n }, (_, i) => {
    // La première prise reste au temps de base : sinon changer le nombre de
    // prises déplacerait aussi le premier écho.
    const facteur = 1 + i * ecart * echelle;
    return Math.max(0.01, Math.min(2, base * facteur));
  });
}

/**
 * Niveau d'une prise, décroissant.
 *
 * Compensé par le nombre de prises : quatre prises à plein niveau feraient
 * quatre fois le gain d'une seule, et satureraient le bus.
 */
export function niveauPrise(index: number, total: number): number {
  const n = Math.max(1, total);
  const i = Math.max(0, Math.min(n - 1, index));
  return Math.pow(0.7, i) / Math.sqrt(n);
}

/** Amortissement de la boucle de délai, en Hz. */
export const AMORTI_HZ = 4800;

/** Un pourcentage de curseur en proportion [0,1]. */
export function melange(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.max(0, Math.min(100, pourcent)) / 100;
}

/**
 * Réinjection du délai, bornée.
 *
 * Un curseur à 100 % ne doit pas pouvoir produire un larsen : c'est une
 * garantie, pas un réglage.
 */
export function reinjection(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.min(REINJECTION_MAX, Math.max(0, pourcent / 100));
}

/**
 * Temps de délai en secondes, borné à ce que le nœud accepte.
 *
 * `createDelay(2)` fixe le maximum : une valeur au-delà serait silencieusement
 * ramenée, et l'affichage mentirait sur ce qu'on entend.
 */
export function tempsRetardSec(ms: number): number {
  if (!Number.isFinite(ms)) return 0.01;
  return Math.max(0.01, Math.min(2, ms / 1000));
}

/**
 * Profondeur de chorus en secondes.
 *
 * Bornée sous le délai de base : une modulation plus profonde que le retard
 * central rendrait le temps de délai négatif, ce que le nœud refuse en
 * revenant à zéro — un chorus qui se tait par intermittence.
 */
export const CHORUS_BASE_SEC = 0.012;

/**
 * Délai central du flanger, dix fois plus court que celui du chorus.
 *
 * C'est toute la différence entre les deux : au-dessus de ~10 ms l'oreille
 * entend deux sources (chorus), en dessous elle entend un filtre en peigne
 * (flanger). Le même graphe, un ordre de grandeur d'écart.
 */
export const FLANGER_BASE_SEC = 0.0012;

/** Réinjection maximale du flanger. Au-delà, le peigne devient un sifflement. */
export const FLANGER_FEEDBACK_MAX = 0.75;

/** Nombre d'étages du phaser. Quatre passe-tout = deux creux dans le spectre. */
export const PHASER_ETAGES = 4;

/** Bande balayée par le phaser, en Hz. */
export const PHASER_MIN_HZ = 300;
export const PHASER_MAX_HZ = 2600;

export function profondeurChorusSec(millisecondes: number): number {
  return profondeurModulationSec(millisecondes, "chorus");
}

/**
 * Profondeur de modulation, bornée sous le délai central du mode.
 *
 * Plus profonde, elle rendrait le temps de délai négatif — le nœud revient
 * alors à zéro et l'effet se tait par intermittence, ce qui s'entend comme un
 * défaut de son et non de réglage. Le flanger a un délai central dix fois plus
 * court : sa marge l'est aussi.
 */
export function profondeurModulationSec(
  millisecondes: number,
  mode: "chorus" | "flanger" | "phaser"
): number {
  if (!Number.isFinite(millisecondes)) return 0;
  const base = mode === "flanger" ? FLANGER_BASE_SEC : CHORUS_BASE_SEC;
  return Math.max(0, Math.min(base * 0.9, millisecondes / 1000));
}

/** Réinjection du flanger, bornée sous 1 comme celle du délai. */
export function reinjectionFlanger(pourcent: number): number {
  if (!Number.isFinite(pourcent)) return 0;
  return Math.min(FLANGER_FEEDBACK_MAX, Math.max(0, pourcent / 100));
}

/**
 * Fréquence centrale d'un étage de phaser.
 *
 * Les étages sont répartis géométriquement et non linéairement : l'oreille
 * entend les fréquences en rapports, pas en écarts. Quatre étages également
 * espacés en Hz mettraient trois creux dans les aigus et un seul en bas.
 */
export function frequenceEtagePhaser(index: number, total = PHASER_ETAGES): number {
  const n = Math.max(1, total);
  const i = Math.max(0, Math.min(n - 1, index));
  const ratio = n === 1 ? 0 : i / (n - 1);
  return PHASER_MIN_HZ * Math.pow(PHASER_MAX_HZ / PHASER_MIN_HZ, ratio);
}

/** Vitesse de chorus en Hz. Le curseur est un entier, d'où le facteur 10. */
export function vitesseChorusHz(valeurCurseur: number): number {
  if (!Number.isFinite(valeurCurseur)) return 0.1;
  return Math.max(0.1, Math.min(8, valeurCurseur / 10));
}

/**
 * Construit la chaîne. Ne se raccorde à rien : l'appelant branche `entree` et
 * `sortie` où il veut — bus principal en direct, ou contexte hors-ligne pour
 * fabriquer un échantillon. C'est ce qui garantit qu'un sample porte
 * exactement les effets qu'on entend.
 */
/**
 * `canaux` : la largeur du contexte, donnée par l'APPELANT.
 *
 * Elle n'est PAS lue sur la destination du contexte : la chaîne ne doit rien
 * en connaître, c'est ce qui permet au rendu hors ligne d'utiliser exactement
 * le même code. Un test l'interdit d'ailleurs par le texte — ce commentaire
 * évite jusqu'à la mentionner littéralement, faute de quoi il ferait tomber
 * le garde qu'il explique.
 *
 * Elle sert au seul panoramique des prises. En mono, les `StereoPannerNode`
 * ne sont PAS construits, au lieu d'être insérés puis repliés par le moteur
 * audio. Ce repli n'est pas neutre : il vaut 0,5·(G+D), donc une prise à fond
 * à gauche ressortirait 3 dB sous une prise centrée — l'équilibre du fichier
 * exporté ne serait plus celui qu'on entend en jouant. Sans panoramique,
 * chaque prise garde exactement le niveau que `niveauPrise` lui donne, et le
 * fichier mono reste la somme fidèle de ce qui est joué.
 */
export function construireChaineEffets(
  ctx: BaseAudioContext,
  p: ParamsEffets,
  now: number,
  canaux = 2
): { entree: AudioNode; sortie: AudioNode } {
  const entree = ctx.createGain();
  const sortie = ctx.createGain();

  // ── Saturation ────────────────────────────────────────────────────────
  // Voie directe toujours ouverte ; seule la voie saturée est dosée. Un
  // mélange à 0 laisse donc passer le signal intact.
  let tete: AudioNode = entree;
  const doseDrive = melange(p.fxDriveMix);
  if (doseDrive > 0 && p.fxDriveAmount > 0) {
    const forme = ctx.createWaveShaper();
    forme.curve = buildSaturationCurve(p.fxDriveAmount, p.fxDriveMode);
    forme.oversample = "2x";

    const sature = ctx.createGain();
    sature.gain.setValueAtTime(doseDrive, now);
    const direct = ctx.createGain();
    direct.gain.setValueAtTime(1 - doseDrive, now);

    const somme = ctx.createGain();
    entree.connect(forme);
    forme.connect(sature);
    sature.connect(somme);
    entree.connect(direct);
    direct.connect(somme);
    tete = somme;
  }

  // ── Égaliseur trois bandes ────────────────────────────────────────────
  // Un gain à 0 dB laisse passer sans rien changer : inutile de conditionner
  // la construction, le coût d'un filtre neutre est négligeable et le graphe
  // reste le même dans tous les cas.
  //
  // Les trois bandes se lisent dans `BANDES_EQ`, jamais recopiées : le graphe
  // de réponse affiché dans le rack se calcule sur la MÊME table. Deux listes
  // divergeraient au premier réglage changé, et le graphe montrerait alors une
  // courbe que le son ne produit pas — un défaut invisible, puisque les deux
  // resteraient cohérents chacun de leur côté.
  let precedent: AudioNode = tete;
  for (const bande of BANDES_EQ) {
    const filtre = ctx.createBiquadFilter();
    filtre.type = bande.type;
    filtre.frequency.setValueAtTime(bande.frequence, now);
    if (bande.q !== undefined) filtre.Q.setValueAtTime(bande.q, now);
    filtre.gain.setValueAtTime(p[bande.reglage], now);
    precedent.connect(filtre);
    precedent = filtre;
  }
  let courant: AudioNode = precedent;

  // ── Modulation : chorus, flanger ou phaser ───────────────────────────
  // Les trois partagent un LFO et une voie parallèle dosée. Ce qui les
  // sépare tient en peu de choses : le chorus et le flanger modulent un
  // délai — dix fois plus court pour le flanger, d'où le peigne au lieu du
  // dédoublement — et le phaser module des filtres passe-tout.
  const doseMod = melange(p.fxModMix);
  if (doseMod > 0) {
    const vitesse = vitesseChorusHz(p.fxModRate);
    const dose = ctx.createGain();
    dose.gain.setValueAtTime(doseMod, now);
    const somme = ctx.createGain();

    if (p.fxModMode === "phaser") {
      // Quatre passe-tout en série, balayés ensemble. Un passe-tout ne change
      // pas l'amplitude : c'est la SOMME avec le signal direct qui creuse le
      // spectre. Sans la voie directe, un phaser est inaudible.
      let etage: AudioNode = courant;
      for (let i = 0; i < PHASER_ETAGES; i++) {
        const filtre = ctx.createBiquadFilter();
        filtre.type = "allpass";
        const centre = frequenceEtagePhaser(i);
        filtre.frequency.setValueAtTime(centre, now);
        filtre.Q.setValueAtTime(0.7, now);
        // La profondeur balaie une fraction de la fréquence centrale : un
        // balayage en Hz constant serait imperceptible en haut du spectre et
        // ferait sortir les étages du bas sous zéro.
        attachLfo(ctx, filtre.frequency, vitesse, centre * 0.6, now);
        etage.connect(filtre);
        etage = filtre;
      }
      etage.connect(dose);
    } else {
      const base = p.fxModMode === "flanger" ? FLANGER_BASE_SEC : CHORUS_BASE_SEC;
      const retardMod = ctx.createDelay(0.1);
      retardMod.delayTime.setValueAtTime(base, now);
      attachLfo(ctx, retardMod.delayTime, vitesse, profondeurModulationSec(p.fxModDepth, p.fxModMode), now);

      courant.connect(retardMod);

      if (p.fxModMode === "flanger") {
        // La réinjection est ce qui donne au flanger son creusement : sans
        // elle, il n'est qu'un chorus très court.
        const retour = ctx.createGain();
        retour.gain.setValueAtTime(reinjectionFlanger(p.fxModFeedback), now);
        retardMod.connect(retour);
        retour.connect(retardMod);
      }

      retardMod.connect(dose);
    }

    dose.connect(somme);
    courant.connect(somme);
    courant = somme;
  }

  // ── Délai ─────────────────────────────────────────────────────────────
  // La voie directe passe toujours ; seule la voie retardée est dosée.
  courant.connect(sortie);

  const doseDelai = melange(p.fxDelayMix);
  if (doseDelai > 0) {
    const dose = ctx.createGain();
    dose.gain.setValueAtTime(doseDelai, now);
    dose.connect(sortie);

    const temps = tempsDesPrises(p.fxDelayTime, p.fxDelayTaps, p.fxDelaySpread);

    // La réinjection ne boucle que sur la PREMIÈRE prise. La brancher sur
    // toutes multiplierait le gain de boucle par le nombre de prises : le
    // plafond de 0,85 ne protégerait plus rien et quatre prises
    // divergeraient là où une seule tenait.
    temps.forEach((t, i) => {
      const retard = ctx.createDelay(2);
      retard.delayTime.setValueAtTime(t, now);

      const niveau = ctx.createGain();
      niveau.gain.setValueAtTime(niveauPrise(i, temps.length), now);

      courant.connect(retard);

      if (i === 0) {
        const retour = ctx.createGain();
        retour.gain.setValueAtTime(reinjection(p.fxDelayFeedback), now);

        // Amortir la réinjection évite l'accumulation d'aigus à chaque tour,
        // qui rend les répétitions stridentes.
        const amorti = ctx.createBiquadFilter();
        amorti.type = "lowpass";
        amorti.frequency.setValueAtTime(AMORTI_HZ, now);

        retard.connect(amorti);
        amorti.connect(retour);
        retour.connect(retard);
      }

      retard.connect(niveau);

      // Le panoramique ne se construit que s'il a quelque chose à dire : un
      // contexte stéréo, et une largeur non nulle. À 0 %, insérer un panneur
      // au centre ajouterait un nœud par prise et par note pour un gain
      // strictement identique.
      const place = canaux >= 2 ? panoramiquePrise(i, p.fxDelayPan) : 0;
      if (place !== 0) {
        const panoramique = ctx.createStereoPanner();
        panoramique.pan.setValueAtTime(place, now);
        niveau.connect(panoramique);
        panoramique.connect(dose);
      } else {
        niveau.connect(dose);
      }
    });
  }

  return { entree, sortie };
}
