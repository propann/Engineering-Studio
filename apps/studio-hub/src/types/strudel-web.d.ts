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
  /** Initialise Strudel et publie ses fonctions de motifs. */
  export function initStrudel(options?: Record<string, unknown>): void;

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
}
