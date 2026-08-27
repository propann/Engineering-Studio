import { describe, expect, it } from "vitest";
import {
  interStudioBridge,
  optimizeAudioBufferForEp133,
  sliceAudioInto24DrumPads,
  detectSilenceTrim,
} from "./index";

describe("Audio Bridge - InterStudioBridge (OP-1 <-> EP-133)", () => {
  it("partage un buffer audio dans le presse-papier inter-studios", () => {
    const leftChannel = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    const rightChannel = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    
    interStudioBridge.copyAudioToClipboard("Kick 01", "op1", [leftChannel, rightChannel], 44100);
    const clip = interStudioBridge.getAudioClipboard();

    expect(clip).not.toBeNull();
    expect(clip?.name).toBe("Kick 01");
    expect(clip?.source).toBe("op1");
    expect(clip?.buffer.length).toBe(2);
    expect(clip?.sampleRate).toBe(44100);
    expect(clip?.duration).toBeCloseTo(4 / 44100, 5);
  });

  it("émet et reçoit les transferts de bandes OP-1 vers pads EP-133", () => {
    let recu: any = null;
    const unsubscribe = interStudioBridge.on("tape:to_ep133_pad", (payload) => {
      recu = payload;
    });

    interStudioBridge.transferTapeSelectionToEp133({
      sourceTrack: 2,
      startSample: 1000,
      endSample: 5000,
      targetGroup: "B",
      targetPadIndex: 4,
      sampleRate: 44100,
      channels: 1,
      channelData: [new Float32Array(4000)],
      name: "Track 2 Solo",
    });

    expect(recu).not.toBeNull();
    expect(recu.sourceTrack).toBe(2);
    expect(recu.targetGroup).toBe("B");
    expect(recu.targetPadIndex).toBe(4);

    unsubscribe();
  });

  it("émet et reçoit les bounce de patterns EP-133 vers pistes OP-1", () => {
    let recu: any = null;
    const unsubscribe = interStudioBridge.on("ep133:to_op1_track", (payload) => {
      recu = payload;
    });

    interStudioBridge.bouncePatternToOp1Track({
      sourceGroup: "A",
      patternIndex: 1,
      targetTrack: 3,
      sampleRate: 46875,
      channelData: [new Float32Array(1000), new Float32Array(1000)],
      durationSeconds: 2.5,
      name: "Pattern A1 Bounce",
    });

    expect(recu).not.toBeNull();
    expect(recu.sourceGroup).toBe("A");
    expect(recu.targetTrack).toBe(3);

    unsubscribe();
  });
});

describe("Audio Bridge - optimizeAudioBufferForEp133", () => {
  it("effectue un downmix mono et un trim de silence", () => {
    // 100 frames silence + 200 frames signal + 100 frames silence
    const sampleRate = 32000;
    const totalFrames = 400;
    const left = new Float32Array(totalFrames);
    const right = new Float32Array(totalFrames);

    for (let i = 100; i < 300; i++) {
      left[i] = 0.5;
      right[i] = 0.5;
    }

    const res = optimizeAudioBufferForEp133([left, right], sampleRate, {
      forceMono: true,
      trimSilence: true,
      silenceThresholdDb: -30,
    });

    expect(res.channels).toBe(1);
    expect(res.bytesSaved).toBeGreaterThan(0);
    expect(res.wavBuffer.byteLength).toBe(res.optimizedBytes);
    expect(res.reductionPercentage).toBeGreaterThanOrEqual(45);
  });
});

describe("Audio Bridge - sliceAudioInto24DrumPads", () => {
  it("découpe un buffer de 24000 trames en 24 tranches exactes", () => {
    const slices = sliceAudioInto24DrumPads(24000, 44100);
    expect(slices.length).toBe(24);
    expect(slices[0].startFrame).toBe(0);
    expect(slices[0].endFrame).toBe(1000);
    expect(slices[23].endFrame).toBe(24000);
    expect(slices[23].index).toBe(23);
  });
});
