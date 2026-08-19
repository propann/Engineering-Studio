/**
 * Conversion OP-1 (feuille de route M3.1, Phase B) — trim, repli de canaux,
 * rééchantillonnage et fondus, puis encodage PCM 16 bits ditheré vers les
 * cibles déjà actées dans ce dépôt (mono 44,1 kHz/16 bits, jamais les cibles
 * EP-133 26250/32000/46875 Hz), en AIFF par défaut — c'est le format que
 * l'OP-1 lit réellement pour `synth/user/*.aif`, `drum/user/*.aif` et les
 * pistes Tape/Album (`AUDIO_FILE_FORMAT_REFERENCE.md` §1-2), le WAV reste
 * disponible via `targetFormat: "wav"` pour un usage hors machine. Ne touche
 * jamais au fichier source : produit un nouveau tampon en mémoire, à
 * télécharger ou prévisualiser — aucune écriture sur un volume OP-1 depuis
 * ce module.
 *
 * Architecture reprise du dépôt compagnon EP-133 K.O. II
 * (`src/core/audio/wavConvert.ts`, voir
 * `docs/RAPPORT_REUTILISATION_EP133_POUR_OP1.md`), avec une vraie
 * différence assumée : l'EP-133 délègue le rééchantillonnage à
 * `@alexanderolsen/libsamplerate-js` (qualité `SRC_SINC_BEST_QUALITY`) ; ce
 * module reste sans dépendance et utilise une interpolation linéaire —
 * moins fidèle, pas silencieusement présentée comme équivalente. Passer à
 * une meilleure méthode de rééchantillonnage est une décision séparée (ajout
 * d'une dépendance), pas prise ici.
 */
// Extensions .ts explicites : la résolution ESM native de Node (utilisée par
// `node --test` sur ces fichiers directement, sans bundler) ne complète pas
// les imports relatifs sans extension comme le fait Vite dans l'application.
import { parseWavFormat, readSignedSample as readWavSample } from "./audioOracle.ts";
import { parseAiffFormat, readAiffSample } from "./aiffPatchOracle.ts";

interface ExtractedAudio {
  channels: number;
  sampleRate: number;
  frameCount: number;
  interleaved: Float32Array;
}

/** AIFF d'abord (format réel OP-1), repli WAV. `null` si aucun des deux formats n'est reconnu. */
function extractInterleaved(bytes: ArrayBuffer): ExtractedAudio | null {
  const aiff = parseAiffFormat(bytes);
  if (aiff) {
    const out = new Float32Array(aiff.frameCount * aiff.channels);
    let index = 0;
    for (let frame = 0; frame < aiff.frameCount; frame += 1) {
      const frameStart = aiff.dataStart + frame * aiff.bytesPerFrame;
      for (let channel = 0; channel < aiff.channels; channel += 1) {
        out[index] = Math.max(-1, Math.min(1, readAiffSample(aiff, frameStart + channel * aiff.bytesPerSample)));
        index += 1;
      }
    }
    return { channels: aiff.channels, sampleRate: aiff.sampleRate, frameCount: aiff.frameCount, interleaved: out };
  }

  const wav = parseWavFormat(bytes) as any;
  if (wav) {
    const out = new Float32Array((wav.frameCount || 0) * wav.channels);
    let index = 0;
    for (let frame = 0; frame < (wav.frameCount || 0); frame += 1) {
      const frameStart = (wav.dataStart || 0) + frame * (wav.bytesPerFrame || 1);
      for (let channel = 0; channel < wav.channels; channel += 1) {
        out[index] = Math.max(-1, Math.min(1, readWavSample(new DataView(bytes), frameStart + channel * (wav.bytesPerSample || 2), wav.bitDepth || 16)));
        index += 1;
      }
    }
    return { channels: wav.channels, sampleRate: wav.sampleRate, frameCount: wav.frameCount || 0, interleaved: out };
  }

  return null;
}

function cropInterleaved(interleaved: Float32Array, channels: number, startFrame: number, endFrame: number): Float32Array {
  const safeStart = Math.max(0, Math.min(startFrame, endFrame));
  const safeEnd = Math.max(safeStart, endFrame);
  return interleaved.slice(safeStart * channels, safeEnd * channels);
}

/** Repli mono/stéréo — `fromChannels === toChannels` renvoie l'entrée telle quelle. Downmix = moyenne, pas de choix gauche/droite explicite. */
function remixChannels(interleaved: Float32Array, fromChannels: number, toChannels: number): Float32Array {
  if (fromChannels === toChannels) return interleaved;
  const frameCount = interleaved.length / fromChannels;
  const out = new Float32Array(frameCount * toChannels);
  for (let frame = 0; frame < frameCount; frame += 1) {
    if (toChannels === 1) {
      let sum = 0;
      for (let channel = 0; channel < fromChannels; channel += 1) sum += interleaved[frame * fromChannels + channel];
      out[frame] = sum / fromChannels;
    } else {
      const value = interleaved[frame * fromChannels];
      for (let channel = 0; channel < toChannels; channel += 1) out[frame * toChannels + channel] = value;
    }
  }
  return out;
}

/**
 * Rééchantillonnage par interpolation linéaire — sans dépendance, donc moins
 * fidèle qu'un sinc-resampler pour un signal riche en aigus (repliement
 * possible). Suffisant pour une conversion de préparation locale ; à
 * remplacer par une bibliothèque dédiée si la qualité s'avère insuffisante
 * en usage réel (décision séparée, voir l'en-tête de ce fichier).
 */
function resampleLinear(interleaved: Float32Array, channels: number, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return interleaved;
  const fromFrameCount = interleaved.length / channels;
  const toFrameCount = Math.max(1, Math.round(fromFrameCount * (toRate / fromRate)));
  const out = new Float32Array(toFrameCount * channels);
  const ratio = (fromFrameCount - 1) / Math.max(1, toFrameCount - 1);
  for (let frame = 0; frame < toFrameCount; frame += 1) {
    const sourcePos = frame * ratio;
    const lowerFrame = Math.floor(sourcePos);
    const upperFrame = Math.min(fromFrameCount - 1, lowerFrame + 1);
    const t = sourcePos - lowerFrame;
    for (let channel = 0; channel < channels; channel += 1) {
      const lower = interleaved[lowerFrame * channels + channel];
      const upper = interleaved[upperFrame * channels + channel];
      out[frame * channels + channel] = lower + (upper - lower) * t;
    }
  }
  return out;
}

/** Fondu linéaire en entrée/sortie, appliqué après rééchantillonnage (durées en secondes exactes quelle que soit la cible). Chaque fondu plafonné à la moitié des trames disponibles. */
function applyFade(interleaved: Float32Array, channels: number, sampleRate: number, fadeInSeconds: number, fadeOutSeconds: number): Float32Array {
  const frameCount = channels > 0 ? interleaved.length / channels : 0;
  if (!frameCount || (fadeInSeconds <= 0 && fadeOutSeconds <= 0)) return interleaved;

  const maxFadeFrames = Math.floor(frameCount / 2);
  const fadeInFrames = Math.max(0, Math.min(maxFadeFrames, Math.round(fadeInSeconds * sampleRate)));
  const fadeOutFrames = Math.max(0, Math.min(maxFadeFrames, Math.round(fadeOutSeconds * sampleRate)));
  if (!fadeInFrames && !fadeOutFrames) return interleaved;

  const out = interleaved.slice();
  for (let frame = 0; frame < fadeInFrames; frame += 1) {
    const gain = frame / fadeInFrames;
    for (let channel = 0; channel < channels; channel += 1) out[frame * channels + channel] *= gain;
  }
  for (let frame = 0; frame < fadeOutFrames; frame += 1) {
    const gain = frame / fadeOutFrames;
    const targetFrame = frameCount - 1 - frame;
    for (let channel = 0; channel < channels; channel += 1) out[targetFrame * channels + channel] *= gain;
  }
  return out;
}

/**
 * IEEE 754 80 bits étendu (Motorola/SANE), inverse de `readExtended80` dans
 * `aiffPatchOracle.ts` — même relation mantisse/exposant, vérifiée par un
 * test qui compare l'octet exact produit pour 44100 Hz à la séquence
 * documentée `[64,14,172,68,0,0,0,0,0,0]` (référence `op-patch-util`), et par
 * un aller-retour via le parseur AIFF existant.
 */
function writeExtended80(view: DataView, offset: number, value: number): void {
  if (!value) { for (let i = 0; i < 10; i += 1) view.setUint8(offset + i, 0); return; }
  const sign = value < 0 ? 0x8000 : 0;
  const magnitude = Math.abs(value);
  let exponent = Math.floor(Math.log2(magnitude));
  let mantissa = BigInt(Math.round(magnitude / Math.pow(2, exponent - 63)));
  if (mantissa >= (BigInt(1) << BigInt(64))) { mantissa >>= BigInt(1); exponent += 1; } // arrondi ayant fait déborder la mantisse sur 65 bits
  view.setUint16(offset, sign | ((exponent + 16383) & 0x7fff), false);
  view.setUint32(offset + 2, Number((mantissa >> BigInt(32)) & BigInt(0xffffffff)), false);
  view.setUint32(offset + 6, Number(mantissa & BigInt(0xffffffff)), false);
}

/**
 * Encode des trames Float32 interleaved en AIFF PCM 16 bits (FORM/COMM/SSND,
 * big-endian), avec dither TPDF — c'est le format réel que l'OP-1 attend
 * pour `synth/user/*.aif`, `drum/user/*.aif` et les pistes Tape/Album (voir
 * `docs/AUDIO_FILE_FORMAT_REFERENCE.md` §1-2), pas le WAV. Exportée : réutilisée
 * telle quelle par `app/page.tsx` pour l'export des stems Tape et des faces
 * Album (même correction que `convertToOp1Audio`, un seul encodeur AIFF dans
 * tout le dépôt plutôt que deux implémentations qui pourraient diverger).
 */
export function encodeAiffPcm16(samples: Float32Array, channels: number, sampleRate: number): ArrayBuffer {
  const dataLength = samples.length * 2;
  const totalLength = 54 + dataLength;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => { for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index)); };
  writeString(0, "FORM");
  view.setUint32(4, totalLength - 8, false);
  writeString(8, "AIFF");
  writeString(12, "COMM");
  view.setUint32(16, 18, false);
  view.setUint16(20, channels, false);
  view.setUint32(22, channels > 0 ? samples.length / channels : 0, false);
  view.setUint16(26, 16, false);
  writeExtended80(view, 28, sampleRate);
  writeString(38, "SSND");
  view.setUint32(42, dataLength + 8, false);
  view.setUint32(46, 0, false);
  view.setUint32(50, 0, false);
  for (let index = 0; index < samples.length; index += 1) {
    const dither = (Math.random() - Math.random()) / 32768; // TPDF : somme de deux uniformes indépendantes
    const quantized = Math.round((samples[index] + dither) * 32767);
    view.setInt16(54 + index * 2, Math.max(-32768, Math.min(32767, quantized)), false); // big-endian
  }
  return buffer;
}

/** Encode des trames Float32 interleaved en WAV PCM 16 bits, avec dither TPDF (bruit triangulaire ~1 LSB avant l'arrondi, pas une troncature sèche). Utile en aperçu/export générique — l'OP-1 lui-même veut de l'AIFF, voir `encodeAiffPcm16`. */
function encodeWavPcm16(samples: Float32Array, channels: number, sampleRate: number): ArrayBuffer {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => { for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index)); };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  for (let index = 0; index < samples.length; index += 1) {
    const dither = (Math.random() - Math.random()) / 32768; // TPDF : somme de deux uniformes indépendantes
    const quantized = Math.round((samples[index] + dither) * 32767);
    view.setInt16(44 + index * 2, Math.max(-32768, Math.min(32767, quantized)), true);
  }
  return buffer;
}

export interface ConversionOptions {
  targetSampleRate?: number;
  targetChannels?: 1 | 2;
  /** `"aiff"` (défaut) : c'est le format réel attendu par l'OP-1 pour un sample
   * utilisateur ou une piste (§1-2 de `AUDIO_FILE_FORMAT_REFERENCE.md`) — le
   * WAV reste disponible pour un aperçu ou un usage hors OP-1. */
  targetFormat?: "aiff" | "wav";
  trim?: { startSeconds: number; endSeconds: number };
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export interface ConversionResult {
  bytes: ArrayBuffer;
  format: "aiff" | "wav";
  sampleRate: number;
  channels: number;
  bitDepth: 16;
  durationSeconds: number;
}

/**
 * Conversion complète : extraction (AIFF ou WAV), trim, repli de canaux,
 * rééchantillonnage, fondus, encodage PCM 16 bits ditheré vers AIFF (par
 * défaut — le format que l'OP-1 lit réellement) ou WAV. `null` si la source
 * n'est ni AIFF ni WAV exploitable — jamais une exception. Ne transfère
 * rien : le tampon produit reste en mémoire côté appelant.
 */
export function convertToOp1Audio(sourceBytes: ArrayBuffer, options: ConversionOptions = {}): ConversionResult | null {
  const extracted = extractInterleaved(sourceBytes);
  if (!extracted || !extracted.frameCount) return null;

  let samples = extracted.interleaved;
  if (options.trim) {
    const startFrame = Math.round(options.trim.startSeconds * extracted.sampleRate);
    const endFrame = Math.round(options.trim.endSeconds * extracted.sampleRate);
    samples = cropInterleaved(samples, extracted.channels, startFrame, endFrame);
    if (!samples.length) return null;
  }

  // Mono par défaut, quel que soit le nombre de canaux source : c'est la
  // cible documentée pour un sample utilisateur OP-1 (synth/drum), pas un
  // choix de confort. Appelant explicite requis pour garder du stéréo.
  const targetChannels = options.targetChannels ?? 1;
  samples = remixChannels(samples, extracted.channels, targetChannels);

  const targetSampleRate = options.targetSampleRate ?? 44100;
  samples = resampleLinear(samples, targetChannels, extracted.sampleRate, targetSampleRate);

  if (options.fadeInSeconds || options.fadeOutSeconds) {
    samples = applyFade(samples, targetChannels, targetSampleRate, options.fadeInSeconds ?? 0, options.fadeOutSeconds ?? 0);
  }

  const targetFormat = options.targetFormat ?? "aiff";
  const bytes = targetFormat === "aiff"
    ? encodeAiffPcm16(samples, targetChannels, targetSampleRate)
    : encodeWavPcm16(samples, targetChannels, targetSampleRate);
  return {
    bytes, format: targetFormat, sampleRate: targetSampleRate, channels: targetChannels, bitDepth: 16,
    durationSeconds: samples.length / targetChannels / targetSampleRate,
  };
}
