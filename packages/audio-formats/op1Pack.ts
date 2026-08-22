/**
 * Manifest et validation d'un pack OP-1.
 *
 * Un pack est une sortie locale : aucune fonction de ce module ne monte un
 * disque, ne copie un fichier ou n'envoie du MIDI. L'écriture sera une étape
 * native séparée, activable uniquement après validation explicite.
 */
import { parseAiffFormat } from "./aiff.ts";
import { OP1_AUDIO_LIMITS } from "./machines.ts";
import { readOp1PatchJson, validateOp1PatchAiff, type Op1PatchKind, type Op1PatchMetadata } from "./op1Patch.ts";

export type Op1PackFile = {
  path: `tape/${string}` | `album/${string}` | `synth/user/${string}` | `drum/user/${string}`;
  bytes: ArrayBuffer;
  patch?: { kind: Op1PatchKind; metadata: Op1PatchMetadata };
};

export type Op1PackIssue = { path: string; message: string };
export type Op1PackValidation = { ok: boolean; issues: Op1PackIssue[]; files: string[] };

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

function issue(path: string, message: string): Op1PackIssue { return { path, message }; }

export function validateOp1Pack(files: Op1PackFile[]): Op1PackValidation {
  const issues: Op1PackIssue[] = [];
  const paths = new Set<string>();
  for (const file of files) {
    if (paths.has(file.path)) issues.push(issue(file.path, "duplicate pack path"));
    paths.add(file.path);
    const parts = file.path.split("/");
    const name = parts.at(-1) ?? "";
    if (!SAFE_NAME.test(name)) issues.push(issue(file.path, "unsafe filename"));
    const format = parseAiffFormat(file.bytes);
    if (!format) { issues.push(issue(file.path, "invalid AIFF")); continue; }
    if (format.bitDepth !== 16) issues.push(issue(file.path, "must be PCM 16-bit"));
    if (format.sampleRate !== 44100) issues.push(issue(file.path, "must be 44.1 kHz"));
    const duration = format.frameCount / format.sampleRate;
    const isDrum = file.path.startsWith("drum/");
    const isSample = file.path.startsWith("synth/") || isDrum;
    if (isSample && format.channels !== 1) issues.push(issue(file.path, "OP-1 samples must be mono"));
    if (isDrum && duration > OP1_AUDIO_LIMITS.drumMaxSeconds + 1 / format.sampleRate) {
      issues.push(issue(file.path, "drum sample exceeds 12 seconds"));
    }
    if (file.path.startsWith("synth/") && duration > OP1_AUDIO_LIMITS.synthMaxSeconds + 1 / format.sampleRate) {
      issues.push(issue(file.path, "synth sample exceeds 6 seconds"));
    }
    if (file.patch) {
      const patchResult = validateOp1PatchAiff(file.bytes, file.patch.kind, file.patch.metadata);
      if (!patchResult.ok) issues.push(...patchResult.errors.map((message) => issue(file.path, message)));
      if (!readOp1PatchJson(file.bytes)) issues.push(issue(file.path, "missing APPL/op-1 patch metadata"));
    }
  }
  return { ok: issues.length === 0, issues, files: [...paths].sort() };
}

export function createOp1PackManifest(
  files: Op1PackFile[],
  project: string,
  sourceCommit?: string,
) {
  const validation = validateOp1Pack(files);
  return {
    schema: "op1-pack-manifest",
    version: 1,
    machine: "op-1",
    project,
    sourceCommit: sourceCommit ?? null,
    machineWrite: false as const,
    requiresConfirmation: true as const,
    validation,
    files: files.map(({ path, bytes, patch }) => ({
      path,
      bytes: bytes.byteLength,
      patch: patch?.metadata.name ?? null,
    })),
  };
}
