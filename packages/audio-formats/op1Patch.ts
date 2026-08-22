/**
 * Fabrication sûre de patches OP-1.
 *
 * Cette couche ne connaît aucun périphérique et n'écrit jamais sur la machine.
 * Elle ajoute le chunk APPL/op-1 aux AIFF PCM déjà encodés et valide les
 * contraintes OP-1 avant qu'un pack puisse être préparé.
 */
import { parseAiffFormat } from "./aiff.ts";
import { OP1_AUDIO_LIMITS } from "./machines.ts";

const OP1_SIGNATURE = "op-1";
const DRUM_MAX_ENDPOINT = 2147483646;

export type Op1PatchKind = "synth" | "drum";

export interface Op1SynthPatchMetadata {
  type: string;
  name: string;
  base_freq?: number;
}

export interface Op1DrumPatchMetadata {
  type: "drum";
  name: string;
  start: number[];
  end: number[];
  playmode?: number[];
  reverse?: number[];
  volume?: number[];
}

export type Op1PatchMetadata = Op1SynthPatchMetadata | Op1DrumPatchMetadata;

export type Op1PatchValidation = {
  ok: boolean;
  errors: string[];
  kind: Op1PatchKind;
  durationSeconds: number | null;
};

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

function isFiniteInteger(value: number) {
  return Number.isInteger(value) && Number.isFinite(value);
}

function validateMetadata(metadata: Op1PatchMetadata): string[] {
  const errors: string[] = [];
  if (!metadata || typeof metadata !== "object") return ["patch metadata is required"];
  if (!metadata.name?.trim()) errors.push("patch name is required");
  if (!metadata.type?.trim()) errors.push("patch type is required");

  if (metadata.type === "drum") {
    const drum = metadata as Op1DrumPatchMetadata;
    if (!Array.isArray(drum.start) || !Array.isArray(drum.end) || drum.start.length !== 24 || drum.end.length !== 24) {
      errors.push("drum patches require exactly 24 start/end markers");
    }
    for (const [label, values] of [["start", drum.start], ["end", drum.end]] as const) {
      if (!Array.isArray(values) || values.some((value) => !isFiniteInteger(value) || value < 0 || value > DRUM_MAX_ENDPOINT)) {
        errors.push(`drum ${label} markers must be integers between 0 and ${DRUM_MAX_ENDPOINT}`);
      }
    }
    for (const [label, values] of [["playmode", drum.playmode], ["reverse", drum.reverse], ["volume", drum.volume]] as const) {
      if (values !== undefined && (!Array.isArray(values) || values.length !== 24)) {
        errors.push(`drum ${label} must contain 24 values when provided`);
      }
    }
  } else if (metadata.base_freq !== undefined && (!Number.isFinite(metadata.base_freq) || metadata.base_freq <= 0)) {
    errors.push("base_freq must be a positive number");
  }
  return errors;
}

export function validateOp1PatchAiff(
  bytes: ArrayBuffer,
  kind: Op1PatchKind,
  metadata: Op1PatchMetadata,
): Op1PatchValidation {
  const errors = validateMetadata(metadata);
  const parsed = parseAiffFormat(bytes);
  if (!parsed) errors.push("file is not a valid AIFF/AIFC");
  if (parsed && parsed.bitDepth !== 16) errors.push("OP-1 patches must be PCM 16-bit");
  if (parsed && parsed.channels !== 1) errors.push("OP-1 patches must be mono");
  if (parsed && parsed.sampleRate !== 44100) errors.push("OP-1 patches must use 44.1 kHz");
  const durationSeconds = parsed ? parsed.frameCount / parsed.sampleRate : null;
  const maxSeconds = kind === "drum" ? OP1_AUDIO_LIMITS.drumMaxSeconds : OP1_AUDIO_LIMITS.synthMaxSeconds;
  if (durationSeconds !== null && durationSeconds > maxSeconds + 1 / parsed.sampleRate) {
    errors.push(`${kind} patch exceeds the ${maxSeconds}s OP-1 limit`);
  }
  if (kind === "drum" && metadata.type !== "drum") errors.push("drum target requires metadata.type=drum");
  if (kind === "synth" && metadata.type === "drum") errors.push("synth target cannot use drum metadata");
  return { ok: errors.length === 0, errors, kind, durationSeconds };
}

/**
 * Ajoute un chunk APPL/op-1 à un AIFF valide. La fonction refuse tout fichier
 * non conforme et ne modifie jamais l'ArrayBuffer fourni.
 */
export function encodeOp1PatchAiff(
  audioAiff: ArrayBuffer,
  kind: Op1PatchKind,
  metadata: Op1PatchMetadata,
): ArrayBuffer {
  const validation = validateOp1PatchAiff(audioAiff, kind, metadata);
  if (!validation.ok) throw new RangeError(validation.errors.join("; "));

  const json = utf8(JSON.stringify(metadata));
  const payloadLength = 4 + json.length;
  const paddedPayloadLength = payloadLength + (payloadLength % 2);
  const chunkLength = 8 + paddedPayloadLength;
  const output = new ArrayBuffer(audioAiff.byteLength + chunkLength);
  new Uint8Array(output).set(new Uint8Array(audioAiff), 0);
  const view = new DataView(output);
  const offset = audioAiff.byteLength;
  writeAscii(view, offset, "APPL");
  view.setUint32(offset + 4, payloadLength, false);
  writeAscii(view, offset + 8, OP1_SIGNATURE);
  new Uint8Array(output).set(json, offset + 12);
  // FORM size excludes the 8-byte FORM header.
  view.setUint32(4, output.byteLength - 8, false);
  return output;
}
