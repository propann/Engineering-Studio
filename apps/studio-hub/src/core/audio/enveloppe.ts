/**
 * Enveloppe ADSR — résolution des réglages en durées.
 *
 * L'enveloppe existait, câblée en dur : `ATTACK = 0.008` et trois sœurs, sans
 * aucun moyen d'y toucher. C'est elle qui supprime les clics — avant elle, le
 * gain restait constant puis l'oscillateur s'arrêtait net.
 *
 * Les bornes ci-dessous ne sont pas de la prudence décorative. Les rampes sont
 * **exponentielles**, et `exponentialRampToValueAtTime` rejette zéro : un
 * curseur de maintien à 0 % lèverait, et une attaque ou un relâchement nuls
 * ramèneraient le clic que l'enveloppe existe pour supprimer.
 */

/**
 * La forme des rampes.
 *
 * - `exp` — exponentielle, comme depuis l'origine. C'est la façon dont
 *   l'oreille perçoit le volume, donc un déclin exponentiel s'entend
 *   « régulier ». C'est aussi ce qui interdit le zéro.
 * - `lin` — droite. Une attaque linéaire monte plus vite au début puis
 *   semble ralentir ; c'est le grain des vieilles machines numériques, et
 *   c'est franchement audible sur une attaque lente.
 */
export type CourbeRampe = "exp" | "lin";

export type ParamsEnveloppe = {
  envAttack: number;   // ms
  envDecay: number;    // ms
  envSustain: number;  // %
  envRelease: number;  // ms
  envCourbe: CourbeRampe;
};

/**
 * Les phases chiffrées — tout `ParamsEnveloppe` sauf la forme des rampes.
 *
 * Les enveloppes prédéfinies ne fixent que celles-ci : la forme des rampes est
 * un goût qui traverse tous les sons, pas une caractéristique du PERCUSSIF ou
 * de la NAPPE. Rappeler une enveloppe ne doit donc pas la changer sous les
 * doigts.
 */
export type PhaseEnveloppe = Exclude<keyof ParamsEnveloppe, "envCourbe">;

/** Valeurs d'origine, câblées jusqu'ici. Elles restent les défauts. */
export const ENVELOPPE_DEFAUT: ParamsEnveloppe = {
  envAttack: 8,
  envDecay: 120,
  envSustain: 75,
  envRelease: 220,
  envCourbe: "exp",
};

/**
 * Plancher des rampes exponentielles.
 *
 * `exponentialRampToValueAtTime(0)` lève. 0,0001 est à −80 dB : inaudible,
 * mais strictement positif.
 */
export const PLANCHER = 0.0001;

/** Durée minimale d'une rampe, en secondes. Plus court s'entend comme un clic. */
export const RAMPE_MIN_SEC = 0.001;

export const BORNES = {
  attaqueMaxMs: 2000,
  declinMaxMs: 2000,
  relachementMaxMs: 4000,
} as const;

export type Enveloppe = {
  ATTACK: number;   // s
  DECAY: number;    // s
  SUSTAIN: number;  // proportion, jamais 0
  RELEASE: number;  // s
};

/**
 * Convertit les réglages en durées utilisables par les rampes.
 *
 * Toujours des valeurs sûres : un réglage aberrant — venu d'un patch corrompu
 * ou d'un import — donne le défaut plutôt qu'une exception au premier appui
 * sur une touche.
 */
export function resoudreEnveloppe(p: Partial<ParamsEnveloppe>): Enveloppe {
  const ms = (valeur: number | undefined, defaut: number, max: number) => {
    if (valeur === undefined || !Number.isFinite(valeur)) return defaut / 1000;
    return Math.max(RAMPE_MIN_SEC, Math.min(max, valeur) / 1000);
  };

  const maintien = Number.isFinite(p.envSustain as number)
    ? Math.max(0, Math.min(100, p.envSustain as number)) / 100
    : ENVELOPPE_DEFAUT.envSustain / 100;

  return {
    ATTACK: ms(p.envAttack, ENVELOPPE_DEFAUT.envAttack, BORNES.attaqueMaxMs),
    DECAY: ms(p.envDecay, ENVELOPPE_DEFAUT.envDecay, BORNES.declinMaxMs),
    // Le maintien passe par le plancher et non par un `Math.max(0, ...)` :
    // c'est la cible d'une rampe exponentielle, pas une durée.
    SUSTAIN: Math.max(PLANCHER, maintien),
    RELEASE: ms(p.envRelease, ENVELOPPE_DEFAUT.envRelease, BORNES.relachementMaxMs),
  };
}

/**
 * Durée totale de la partie tenue, pour dimensionner un rendu hors ligne.
 *
 * Le relâchement n'en fait pas partie : il démarre quand la note s'arrête, pas
 * après le déclin.
 */
export function dureeAttaqueDeclin(e: Enveloppe): number {
  return e.ATTACK + e.DECAY;
}

/** Un point de la courbe : temps en secondes depuis l'attaque, niveau en proportion. */
export type PointEnveloppe = { t: number; v: number };

/**
 * La courbe de l'enveloppe, tracée comme le moteur la joue.
 *
 * Les rampes sont **exponentielles** — `exponentialRampToValueAtTime` — et non
 * droites. Une courbe dessinée en segments droits montrerait une attaque qui
 * monte régulièrement là où le moteur la fait bondir puis ralentir. Le même
 * principe que la courbe de l'égaliseur : on trace ce que le son fait, pas une
 * idée du réglage.
 *
 * L'interpolation exponentielle entre v0 et v1 sur une durée d vaut
 * v(t) = v0 · (v1/v0)^(t/d) — c'est la formule de la spécification Web Audio,
 * et c'est pourquoi v0 ne peut jamais être nul : `resoudreEnveloppe` garantit
 * déjà ce plancher.
 *
 * **La durée du maintien est une convention d'affichage**, pas un réglage. On
 * ne peut pas savoir combien de temps une touche sera tenue. Le palier existe
 * pour montrer le NIVEAU de maintien, donc il lui faut assez de largeur pour se
 * lire : un tiers de la somme des trois autres, soit un quart du tracé, quelles
 * que soient les valeurs.
 */
export function courbeEnveloppe(
  p: Partial<ParamsEnveloppe>,
  parSegment = 24,
): PointEnveloppe[] {
  const e = resoudreEnveloppe(p);
  const tenue = (e.ATTACK + e.DECAY + e.RELEASE) / 3;

  // La MEME forme que celle qui sera jouee. Un trace toujours exponentiel
  // pendant que le moteur monte en droite montrerait une attaque qu'on
  // n'entend pas — exactement le defaut que la courbe existe pour eviter.
  const droite = formeRampe(p) === "lin";
  const rampe = droite
    // `linearRampToValueAtTime` interpole en droite entre les deux valeurs.
    ? (v0: number, v1: number, x: number) => v0 + (v1 - v0) * x
    // v0 · (v1/v0)^x, l'interpolation exponentielle de Web Audio.
    : (v0: number, v1: number, x: number) => v0 * Math.pow(v1 / v0, x);

  const points: PointEnveloppe[] = [];
  const segment = (t0: number, duree: number, v0: number, v1: number) => {
    for (let i = 0; i <= parSegment; i++) {
      const x = i / parSegment;
      points.push({ t: t0 + duree * x, v: rampe(v0, v1, x) });
    }
  };

  segment(0, e.ATTACK, PLANCHER, 1);
  segment(e.ATTACK, e.DECAY, 1, e.SUSTAIN);
  // Le maintien est plat : deux points suffisent, et un palier échantillonné
  // n'apporterait que des points identiques.
  points.push({ t: e.ATTACK + e.DECAY, v: e.SUSTAIN });
  points.push({ t: e.ATTACK + e.DECAY + tenue, v: e.SUSTAIN });
  segment(e.ATTACK + e.DECAY + tenue, e.RELEASE, e.SUSTAIN, PLANCHER);

  return points;
}

/**
 * Durée totale du tracé, maintien d'affichage compris.
 *
 * Sert à mettre l'axe des temps à l'échelle. Recalculer le maintien dans le
 * panneau en ferait une seconde source de vérité, qui divergerait le jour où
 * la convention change.
 */
export function dureeCourbe(p: Partial<ParamsEnveloppe>): number {
  const e = resoudreEnveloppe(p);
  return (e.ATTACK + e.DECAY + e.RELEASE) * (4 / 3);
}

/**
 * Une enveloppe prête à rappeler.
 *
 * `reglages` est un `Record` **complet**, pas un partiel — même raison que les
 * courbes d'égaliseur : ajouter une phase à `ParamsEnveloppe` casse le
 * typecheck sur chaque enveloppe tant qu'elle n'a pas reçu sa valeur. Un
 * partiel aurait compilé, la phase neuve serait restée où le curseur précédent
 * l'avait laissée, et l'enveloppe rappelée n'aurait pas été celle que son nom
 * annonce.
 */
export type EnveloppePredefinie = {
  nom: string;
  /** Ce qu'elle fait à l'oreille, en une phrase. Sert d'infobulle. */
  aide: string;
  reglages: Record<PhaseEnveloppe, number>;
};

/**
 * Les enveloppes prédéfinies.
 *
 * Quatre durées en millisecondes demandent de savoir d'avance ce qu'on
 * cherche. Ces enveloppes donnent des points de départ nommés, qu'on retouche
 * ensuite au curseur.
 *
 * DÉFAUT ouvre la liste et reprend `ENVELOPPE_DEFAUT`, jamais recopié : deux
 * jeux de valeurs divergeraient au premier réglage d'origine changé, et le
 * bouton « défaut » ne ramènerait plus au défaut. Sans retour au point de
 * départ, essayer une enveloppe serait une porte à sens unique — il faudrait
 * se rappeler quatre nombres pour revenir.
 */
export const ENVELOPPES: readonly EnveloppePredefinie[] = [
  {
    nom: "DÉFAUT",
    aide: "Le réglage d'origine : attaque courte, maintien haut, queue brève",
    reglages: {
      envAttack: ENVELOPPE_DEFAUT.envAttack,
      envDecay: ENVELOPPE_DEFAUT.envDecay,
      envSustain: ENVELOPPE_DEFAUT.envSustain,
      envRelease: ENVELOPPE_DEFAUT.envRelease,
    },
  },
  {
    nom: "PERCUSSIF",
    aide: "Frappe sèche : tout est dit en un dixième de seconde, rien ne tient",
    reglages: { envAttack: 1, envDecay: 90, envSustain: 0, envRelease: 60 },
  },
  {
    nom: "PINCÉ",
    aide: "Corde pincée : attaque immédiate, déclin long, un reste qui s'éteint",
    reglages: { envAttack: 2, envDecay: 300, envSustain: 15, envRelease: 200 },
  },
  {
    nom: "ORGUE",
    aide: "Tout ou rien : le son s'établit et tient tant que la touche est tenue",
    reglages: { envAttack: 3, envDecay: 5, envSustain: 100, envRelease: 8 },
  },
  {
    nom: "NAPPE",
    aide: "Souffle lent : monte en presque une seconde et met longtemps à partir",
    reglages: { envAttack: 800, envDecay: 900, envSustain: 80, envRelease: 2500 },
  },
];

/**
 * L'enveloppe courante est-elle exactement celle-ci ?
 *
 * Les quatre champs se lisent sur les clés de l'enveloppe comparée, donc une
 * phase ajoutée entre dans la comparaison sans qu'on y pense. Comparer quatre
 * noms écrits à la main aurait laissé la cinquième hors du test, et deux
 * enveloppes différentes se seraient dites égales.
 */
export function estEnveloppeAppliquee(
  // Seules les phases chiffrees, pas tout `ParamsEnveloppe` : la forme des
  // rampes n'entre pas dans la comparaison, puisqu'une enveloppe predefinie ne
  // la fixe pas. Le type le dit, plutot que le commentaire seul.
  params: Pick<ParamsEnveloppe, PhaseEnveloppe>,
  enveloppe: EnveloppePredefinie,
): boolean {
  return (Object.keys(enveloppe.reglages) as PhaseEnveloppe[])
    .every((nom) => params[nom] === enveloppe.reglages[nom]);
}


/**
 * Applique une rampe vers une valeur, selon la forme choisie.
 *
 * **Un seul point d'application.** Les rampes d'enveloppe sont programmées à
 * cinq endroits du rack — attaque, déclin, relâchement d'une note tenue,
 * relâchement d'une note ponctuelle, et le rendu hors ligne. Écrire le choix
 * de forme cinq fois, c'est se garantir qu'un des cinq restera exponentiel
 * après une retouche : le son rendu ne correspondrait plus à ce qu'on entend
 * en jouant, et rien ne le signalerait.
 *
 * Le plancher reste appliqué en linéaire, où il n'est pourtant pas obligatoire
 * — `linearRampToValueAtTime` accepte zéro. Le garder évite un second chemin
 * de résolution : à −80 dB, la différence est inaudible, et une enveloppe qui
 * change de valeur de repos selon la forme choisie serait un piège.
 */
export function rampeVers(
  parametre: AudioParam,
  cible: number,
  quand: number,
  forme: CourbeRampe,
): void {
  const valeur = Math.max(PLANCHER, cible);
  if (forme === "lin") parametre.linearRampToValueAtTime(valeur, quand);
  else parametre.exponentialRampToValueAtTime(valeur, quand);
}

/** La forme des rampes d'un réglage, `exp` par défaut si elle manque ou ment. */
export function formeRampe(p: Partial<ParamsEnveloppe>): CourbeRampe {
  return p.envCourbe === "lin" ? "lin" : "exp";
}
