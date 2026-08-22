import { describe, expect, it } from "vitest";
import { encodeAiffPcm16 } from "./encode";
import { encodeOp1PatchAiff, validateOp1PatchAiff } from "./op1Patch";
import { createOp1PackManifest, validateOp1Pack } from "./op1Pack";

function audio(seconds = 1) {
  return encodeAiffPcm16(new Float32Array(44100 * seconds), 1, 44100);
}

describe("OP-1 fabrication pipeline", () => {
  it("adds APPL/op-1 metadata without changing the audio contract", () => {
    const bytes = encodeOp1PatchAiff(audio(), "synth", { type: "FM", name: "Test" });
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("APPL");
    expect(text).toContain("op-1");
    expect(validateOp1PatchAiff(bytes, "synth", { type: "FM", name: "Test" }).ok).toBe(true);
  });

  it("rejects a synth sample above the machine limit", () => {
    const bytes = audio(7);
    expect(validateOp1PatchAiff(bytes, "synth", { type: "FM", name: "Too long" }).ok).toBe(false);
  });

  it("keeps pack validation local and rejects duplicate paths", () => {
    const first = { path: "synth/user/test.aif" as const, bytes: audio() };
    const result = validateOp1Pack([first, first]);
    expect(result.ok).toBe(false);
    expect(result.issues.some(({ message }) => message === "duplicate pack path")).toBe(true);
    expect(createOp1PackManifest([first], "Test").machineWrite).toBe(false);
  });
});
