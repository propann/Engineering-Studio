/**
 * Les sons que Strudel sait produire SANS réseau.
 *
 * Cette liste n'est pas une documentation recopiée : elle a été relevée dans
 * la source de `superdough`, le moteur de son de Strudel, à la version
 * verrouillée par `bun.lock`. Chaque entrée porte le fichier et la ligne où
 * elle est enregistrée, pour qu'une montée de version qui en retire une soit
 * retrouvable.
 *
 * ## Pourquoi ce fichier existe
 *
 * Le rack promet « aucun échantillon distant ». Cette promesse n'a de valeur
 * que si l'on sait ce qui reste **sans** eux — sinon on écrit des exemples qui
 * échouent en silence, chacun affichant « sound not found » là où l'on
 * attendait une caisse claire.
 *
 * C'est le piège dans lequel la page orpheline `StrudelLiveStudio.tsx` était
 * tombée : elle proposait quatorze « appels moteur » — `mi_plaits`,
 * `open303`, `dexed_fm`, `amsynth` — dont aucun n'existait dans
 * `@strudel/web`. Ils venaient du nom des moteurs du rack DSP, pas de ceux de
 * Strudel, et aucun de ces quatorze extraits n'aurait sonné.
 *
 * Ils existent depuis le 2026-08-29, mais parce qu'on les a ECRITS :
 * `moteursStrudel.ts` enregistre les vingt moteurs du rack aupres de
 * superdough. Voir `MOTEURS_RACK` plus bas. La page orpheline promettait donc
 * la bonne chose — il lui manquait seulement de la faire.
 *
 * ## Ce qui manque, et où le prendre
 *
 * La banque `dirt-samples` est chargée à la demande par le rack. Les noms
 * restent listés ici pour que le contrôle de code sache distinguer un sample
 * Strudel officiel d'une faute de frappe ou d'une clé locale inconnue.
 *
 * Ce n'est pas une privation dans cet atelier : la boîte à rythmes, c'est
 * l'EP‑133 posée sur le bureau. `SORTIE_MACHINE` de `sortieMidi.ts` envoie le
 * motif dans la machine, qui joue ses propres sons. Un `sbd` synthétisé et
 * quatre bruits colorés couvrent le reste.
 */

/** Ce qu'on peut passer à `.sound("…")` sans qu'une requête sorte. */
export type SonLocal = {
  nom: string;
  /** Ce qu'on entend, en une ligne. */
  aide: string;
  famille: "forme d'onde" | "bruit" | "percussion" | "expérimental";
  /** Où il est enregistré dans superdough, pour vérification. */
  source: string;
};

export const SONS_LOCAUX: ReadonlyArray<SonLocal> = [
  // --- Formes d'onde : superdough/synth.mjs:23, enregistrées ligne 43 -------
  {
    nom: "sine",
    aide: "Sinusoïde pure, sans harmonique. La plus douce, la plus sourde.",
    famille: "forme d'onde",
    source: "synth.mjs:23",
  },
  {
    nom: "triangle",
    aide: "Triangle : douce comme la sinusoïde, mais avec un peu de corps.",
    famille: "forme d'onde",
    source: "synth.mjs:23",
  },
  {
    nom: "square",
    aide: "Carrée, creuse et nasillarde. Le son des basses de jeu vidéo.",
    famille: "forme d'onde",
    source: "synth.mjs:23",
  },
  {
    nom: "sawtooth",
    aide: "Dent de scie, riche et mordante. Ce qu'on filtre le mieux.",
    famille: "forme d'onde",
    source: "synth.mjs:23",
  },
  {
    nom: "supersaw",
    aide: "Plusieurs dents de scie désaccordées : large, épais, rave.",
    famille: "forme d'onde",
    source: "synth.mjs:154",
  },
  {
    nom: "pulse",
    aide: "Impulsion à largeur réglable — `.pw()` en change le timbre.",
    famille: "forme d'onde",
    source: "synth.mjs:295",
  },

  // --- Bruits : superdough/helpers.mjs:7, enregistrés synth.mjs:407 --------
  {
    nom: "white",
    aide: "Bruit blanc, toutes les fréquences à égalité. Charleston, souffle.",
    famille: "bruit",
    source: "helpers.mjs:7",
  },
  {
    nom: "pink",
    aide: "Bruit rose, plus grave que le blanc. Plus proche de la pluie.",
    famille: "bruit",
    source: "helpers.mjs:7",
  },
  {
    nom: "brown",
    aide: "Bruit brun, sourd et grondant. Utile pour un sub ou un vent.",
    famille: "bruit",
    source: "helpers.mjs:7",
  },
  {
    nom: "crackle",
    aide: "Crépitement irrégulier, façon vinyle. `.density()` le règle.",
    famille: "bruit",
    source: "helpers.mjs:7",
  },

  // --- Percussion de synthèse : superdough/synth.mjs:84 --------------------
  {
    nom: "sbd",
    aide: "Grosse caisse synthétisée — la seule percussion sans échantillon.",
    famille: "percussion",
    source: "synth.mjs:84",
  },

  // --- Expérimental : superdough/synth.mjs:219 ----------------------------
  {
    nom: "bytebeat",
    aide: "Formule arithmétique jouée comme un son. Bruitiste, imprévisible.",
    famille: "expérimental",
    source: "synth.mjs:219",
  },
];

/**
 * Les raccourcis que superdough installe lui-même (`synth.mjs:24`).
 *
 * Ils sont documentés parce qu'on les lit dans du code trouvé ailleurs :
 * ignorer que `saw` vaut `sawtooth` fait chercher un son manquant.
 */
export const ALIAS_SONS: ReadonlyArray<{ alias: string; vers: string }> = [
  { alias: "tri", vers: "triangle" },
  { alias: "sqr", vers: "square" },
  { alias: "saw", vers: "sawtooth" },
  { alias: "sin", vers: "sine" },
];

/**
 * Les sons ZZFX, ajoutés par `registerZZFXSounds()`.
 *
 * `@strudel/web` ne les enregistre PAS de lui-même : sa `defaultPrebake`
 * n'appelle que `registerSynthSounds`. Le rack les demande explicitement au
 * démarrage — c'est un générateur, pas un téléchargement, donc rien ne sort du
 * navigateur.
 *
 * Relevé dans `superdough/zzfx.mjs:82`.
 */
export const SONS_ZZFX: ReadonlyArray<string> = [
  "zzfx",
  "z_sine",
  "z_sawtooth",
  "z_triangle",
  "z_square",
  "z_tan",
  "z_noise",
];

/**
 * Les noms que le Strudel officiel connaît et que le rack peut charger.
 *
 * Ils sont listés pour être reconnus avant et après le chargement de la banque
 * distante : quand un motif copié depuis strudel.cc ne sonne pas, le rack peut
 * dire pourquoi au lieu de laisser un silence.
 */
export const SONS_DISTANTS_CONNUS: ReadonlyArray<string> = [
  "bd", "sd", "hh", "oh", "cp", "rim", "lt", "mt", "ht", "cr", "rd",
  "arpy", "casio", "jazz", "metal", "east", "space", "numbers", "insect",
];

/**
 * Les vingt moteurs du rack DSP, ajoutes a la palette au demarrage.
 *
 * Enregistres aupres de superdough par `moteursStrudel.ts`. Ce sont les memes
 * oscillateurs que dans le rack : locaux, aucun telechargement. Les compter
 * ici evite que le rack signale `mi_plaits` comme « son introuvable » alors
 * qu'il vient de l'enregistrer.
 */
export const MOTEURS_RACK: ReadonlyArray<string> = [
  "mi_plaits", "mi_braids", "mi_rings", "mi_clouds", "mi_elements",
  "dexed_fm", "surge_xt", "zynaddsubfx", "helm", "open303",
  "amsynth", "amy_engine", "pl_synth", "fluidsynth", "faust_dsp",
  "drum_machine", "vocoder_dsp", "string_machine", "organ_drawbars",
  "phase_distortion",
];

/** Tous les noms jouables hors ligne, alias et moteurs du rack compris. */
export function nomsJouables(): string[] {
  return [
    ...SONS_LOCAUX.map((s) => s.nom),
    ...ALIAS_SONS.map((a) => a.alias),
    ...SONS_ZZFX,
    ...MOTEURS_RACK,
  ];
}

/**
 * Repère les sons d'un code qui ne sonneront pas ici.
 *
 * Sert l'avertissement affiché sous l'éditeur. On ne bloque pas l'exécution :
 * le reste du motif joue, et un `.sound()` inconnu n'est pas une erreur de
 * syntaxe — Strudel se contente de ne rien produire pour cette voix.
 */
export function sonsManquants(code: string, options: {
  samplesDistants?: boolean;
  samplesLocaux?: Iterable<string>;
} = {}): string[] {
  const jouables = new Set([
    ...nomsJouables(),
    ...(options.samplesDistants ? SONS_DISTANTS_CONNUS : []),
    ...(options.samplesLocaux ?? []),
  ]);
  const trouves = new Set<string>();
  // `.sound("x")` et `s("x")` sont les deux écritures ; le contenu peut être
  // un mini-motif entier — « bd*4, ~ hh » — donc on le découpe.
  for (const m of code.matchAll(/(?:\.sound|\bs)\(\s*["'`]([^"'`]*)["'`]/g)) {
    for (const brut of m[1].split(/[\s,<>[\]()*!@?~|.]+/)) {
      const nom = brut.replace(/:\d+$/, "").trim();
      if (!nom || /^\d+$/.test(nom)) continue;
      if (!jouables.has(nom)) trouves.add(nom);
    }
  }
  return [...trouves].sort();
}
