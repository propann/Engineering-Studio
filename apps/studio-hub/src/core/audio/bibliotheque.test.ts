import { describe, expect, it } from "vitest";
import { cleSample, inferSoundKind } from "./bibliotheque";

describe("inventaire sonore partagé", () => {
  it("produit une clé Strudel stable, lisible et sans accent", () => {
    const asset = { id: "machine_ep133_slot_001_ABC123", name: "Voix Étrange / 001", sourceType: "machines" as const };
    expect(cleSample(asset)).toBe("machine_voix_etrange_001_abc123");
    expect(cleSample(asset)).toBe(cleSample(asset));
  });

  it("classe les sons de machine pour la bibliothèque", () => {
    expect(inferSoundKind("samples/kick_808.pcm")).toBe("drum");
    expect(inferSoundKind("patches/synth_lead.aif")).toBe("synth");
    expect(inferSoundKind("voice_hook.wav")).toBe("voice");
  });
});
