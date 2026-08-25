/**
 * Briques de traitement du signal partagees par les moteurs du rack.
 *
 * Extraites de AudioPluginRack pour etre testables : ce sont des fonctions
 * pures, ou dont la seule dependance est un AudioContext qu'un test peut
 * fournir hors-ligne. Le composant qui les utilise, lui, ne l'est pas.
 */


// =====================================================================
// BRIQUES DSP PARTAGÉES
//
// Chacune sert plusieurs moteurs. Les 33 paramètres qui n'avaient aucun
// effet sur le son se ramènent à ces quelques traitements réutilisables.
// =====================================================================

/**
 * Réponse impulsionnelle synthétique pour ConvolverNode.
 * Bruit blanc à décroissance exponentielle : évite de charger un fichier
 * externe tout en donnant une queue de réverbération crédible.
 */
export function buildImpulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

/**
 * Courbe de quantification pour WaveShaperNode.
 * `bits` marches d'escalier : c'est la réduction de résolution qui donne
 * le grain 8-bit. 16 bits = quasi transparent, 1-2 bits = destruction.
 */
export function buildBitcrushCurve(bits: number): Float32Array<ArrayBuffer> {
  const n = 4096;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const steps = Math.pow(2, Math.max(1, Math.min(16, bits)));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

/**
 * Les trois écrêtages.
 *
 * Le type ET l'ordre d'affichage au même endroit : une liste des modes tenue
 * ailleurs se serait tue le jour où un quatrième arrive, et le bouton aurait
 * manqué pour un mode que la courbe sait pourtant produire.
 */
export type ModeSaturation = "soft" | "fold" | "hard";
export const ORDRE_SATURATION: readonly ModeSaturation[] = ["soft", "hard", "fold"];

/**
 * Courbe de saturation.
 *  - "soft" : tanh, écrêtage progressif, chaleur analogique.
 *  - "hard" : écrêtage franc. Le signal passe intact jusqu'au seuil, puis
 *    s'arrête net. Le coin anguleux est ce qui produit les harmoniques
 *    impaires dures — c'est un autre son que le tanh, pas un tanh plus fort.
 *  - "fold" : repliement d'onde. L'amplitude qui dépasse ne sature pas,
 *    elle se replie et crée des harmoniques supérieures. C'est le
 *    traitement que faust_dsp annonçait sans jamais l'appliquer.
 *
 * Les trois partagent le même gain d'entrée `1 + k·12` — sauf le repliement,
 * qui replierait bien trop tôt. À réglage égal, passer d'un mode à l'autre
 * change donc le grain, pas le volume.
 */
export function buildSaturationCurve(amount: number, mode: ModeSaturation = "soft"): Float32Array<ArrayBuffer> {
  const n = 4096;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.max(0.001, amount / 100);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    if (mode === "fold") {
      curve[i] = Math.sin(x * (1 + k * 6) * Math.PI * 0.5);
    } else if (mode === "hard") {
      // Pas de normalisation : l'écrêtage franc atteint ±1 de lui-même des
      // que le seuil est franchi. Diviser par le maximum ramenerait le
      // plateau sous 1 et rendrait le mode plus discret que les autres.
      curve[i] = Math.max(-1, Math.min(1, x * (1 + k * 12)));
    } else {
      curve[i] = Math.tanh(x * (1 + k * 12)) / Math.tanh(1 + k * 12);
    }
  }
  return curve;
}

/**
 * Onde périodique à rapport cyclique variable, par synthèse de Fourier.
 * Un OscillatorNode "square" est figé à 50 % ; cette forme permet le
 * balayage de largeur d'impulsion caractéristique des puces sonores.
 */
export function buildPulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  const n = 32;
  const real = new Float32Array(new ArrayBuffer(n * 4));
  const imag = new Float32Array(new ArrayBuffer(n * 4));
  const d = Math.max(0.02, Math.min(0.98, duty / 100));
  for (let h = 1; h < n; h++) {
    // Série de Fourier d'un train d'impulsions de rapport cyclique d.
    real[h] = (2 / (h * Math.PI)) * Math.sin(Math.PI * h * d);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

/**
 * LFO branché sur un AudioParam. Renvoie l'oscillateur pour que l'appelant
 * puisse l'arrêter avec la voix.
 */
export function attachLfo(
  ctx: BaseAudioContext,
  target: AudioParam,
  rateHz: number,
  depth: number,
  now: number,
  shape: OscillatorType = "sine"
): OscillatorNode {
  const lfo = ctx.createOscillator();
  const amt = ctx.createGain();
  lfo.type = shape;
  lfo.frequency.setValueAtTime(Math.max(0.01, rateHz), now);
  amt.gain.setValueAtTime(depth, now);
  lfo.connect(amt);
  amt.connect(target);
  lfo.start(now);
  return lfo;
}

/**
 * Boucle de retour amortie : délai rebouclé via un gain, avec passe-bas
 * dans la boucle. Le gain est plafonné sous 1 — au-delà la boucle
 * s'emballe et produit un larsen.
 */
export function buildFeedbackLoop(
  ctx: BaseAudioContext,
  delaySec: number,
  feedback: number,
  dampHz: number
): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(2);
  const fb = ctx.createGain();
  const damp = ctx.createBiquadFilter();

  delay.delayTime.value = Math.max(0.001, delaySec);
  fb.gain.value = Math.min(0.92, Math.max(0, feedback / 100) * 0.92);
  damp.type = "lowpass";
  damp.frequency.value = dampHz;

  input.connect(delay);
  delay.connect(damp);
  damp.connect(fb);
  fb.connect(delay);
  delay.connect(output);
  input.connect(output);

  return { input, output };
}
