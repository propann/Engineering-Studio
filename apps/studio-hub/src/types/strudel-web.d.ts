/**
 * `@strudel/web` ne fournit pas de types.
 *
 * Plutôt qu'un `any` global, on déclare EXACTEMENT ce que le rack appelle.
 * Une signature qui changerait chez Strudel serait alors signalée par le
 * typecheck, au lieu de passer et d'échouer en direct dans le navigateur.
 *
 * Volontairement incomplet : Strudel expose des centaines de fonctions de
 * motifs, mais elles sont posées sur `globalThis` par `initStrudel` et
 * utilisées depuis le code de l'utilisateur, jamais depuis le nôtre.
 */
declare module "@strudel/web" {
  /** Ce que l'ordonnanceur expose au rack. */
  export interface ReplStrudel {
    /** Consulté par le dessinateur pour savoir quoi illuminer. */
    scheduler?: unknown;
    /** Cycles par seconde. Le rack le dérive du tempo partagé du Hub. */
    setCps?: (cps: number) => unknown;
  }

  /** Ce que `afterEval` reçoit après chaque évaluation réussie. */
  export interface MetaEvaluation {
    meta?: {
      /**
       * Les intervalles de mini-notation dans le document, que
       * `highlightMiniLocations` illumine pendant la lecture.
       */
      miniLocations?: unknown[];
    };
  }

  /**
   * Initialise Strudel et publie ses fonctions de motifs.
   *
   * Rend une promesse résolue sur le repl — c'est par là qu'on obtient
   * l'ordonnanceur, sans lequel il n'y a pas de surlignage.
   */
  export function initStrudel(options?: Record<string, unknown>): Promise<ReplStrudel>;

  /** Évalue du code Strudel. Rejette sur une erreur de syntaxe. */
  export function evaluate(code: string): Promise<unknown>;

  /** Coupe tout ce qui joue. */
  export function hush(): void;

  /**
   * Impose le contexte audio à utiliser.
   *
   * À appeler AVANT `initStrudel` : sans cela Strudel fabrique le sien, et le
   * rack sortirait à côté du mixage du Hub au lieu d'y passer.
   */
  export function setAudioContext(contexte: AudioContext): unknown;

  /**
   * Ajoute les sons ZZFX à la palette.
   *
   * Réexporté depuis `superdough`. `@strudel/web` ne l'appelle pas lui-même :
   * son initialisation n'enregistre que `registerSynthSounds`. Ce sont des
   * générateurs, donc rien ne sort du navigateur en les ajoutant.
   */
  export function registerZZFXSounds(): unknown;

  /**
   * Le contrôleur audio de superdough.
   *
   * Le rack s'en sert pour une seule chose : atteindre `destinationGain`, le
   * dernier nœud avant la sortie, et le détourner vers une voie de la console.
   * superdough n'offre aucune API pour changer sa destination.
   */
  export function getSuperdoughAudioController(): {
    output?: { destinationGain?: GainNode | null };
  };
}

/**
 * `@strudel/codemirror` — l'éditeur officiel.
 *
 * Même règle : on ne déclare que ce que `EditeurStrudel.tsx` appelle. Le
 * paquet expose bien davantage (thèmes, curseurs, info-bulles), mais tout
 * passe par les réglages plutôt que par des appels directs.
 */
declare module "@strudel/codemirror" {
  /** La vue CodeMirror, réduite à ce que le rack manipule. */
  export interface VueEditeur {
    state: { doc: { toString(): string; length: number } };
    dispatch(transaction: unknown): void;
    focus(): void;
    destroy(): void;
  }

  /** Ce que `onChange` reçoit à chaque frappe. */
  export interface MiseAJourEditeur {
    docChanged: boolean;
    state: { doc: { toString(): string } };
  }

  /**
   * Les réglages, gardés dans un atome persistant (`localStorage`).
   *
   * Lus UNE SEULE FOIS par `initEditor`, à la construction : les modifier
   * ensuite n'a aucun effet tant que l'éditeur n'est pas remonté.
   */
  export const codemirrorSettings: {
    get(): Record<string, unknown>;
    set(valeurs: Record<string, unknown>): void;
  };

  /** Construit l'éditeur dans `root`. */
  export function initEditor(options: {
    root: HTMLElement;
    initialCode?: string;
    onChange: (v: MiseAJourEditeur) => void;
    onEvaluate?: () => boolean | void;
    onStop?: () => boolean | void;
  }): VueEditeur;

  /** Illumine les fragments actifs à l'instant donné. */
  export function highlightMiniLocations(
    vue: VueEditeur,
    temps: number,
    haps: unknown[],
  ): void;

  /** Enregistre les intervalles issus de la dernière évaluation. */
  export function updateMiniLocations(vue: VueEditeur, positions: unknown[]): void;

  /** Fait clignoter l'éditeur — confirmation visuelle d'une évaluation. */
  export function flash(vue: VueEditeur, ms?: number): void;
}

/**
 * `@strudel/draw` — la boucle d'images.
 *
 * Le rack n'en utilise que `Drawer`, et pour une seule chose : recevoir les
 * événements actifs à chaque image, afin de les passer au surlignage. Aucun
 * dessin sur canevas n'est fait ici.
 */
declare module "@strudel/draw" {
  export class Drawer {
    constructor(
      surImage: (haps: unknown[], temps: number) => void,
      /** Fenêtre [passé, futur] en cycles. `[0, 0]` = l'instant seul. */
      fenetre: [number, number],
    );
    start(ordonnanceur: unknown): void;
    stop(): void;
    invalidate(ordonnanceur?: unknown): void;
  }
}
