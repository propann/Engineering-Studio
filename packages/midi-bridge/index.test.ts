import { describe, expect, it } from "vitest";
import {
  MasterTransportClock,
  buildMidiNotePacket,
  buildMidiPanicPackets,
  buildMidiRealtimePacket,
  parseMidiNotePacket,
} from "./index";

describe("MIDI Bridge - Packets & Parsing", () => {
  it("construit un paquet note-on et le repique fidèlement", () => {
    const packet = buildMidiNotePacket("note-on", 60, 100, 2);
    expect(packet.data[0]).toBe(0x92); // Note-on canal 2
    expect(packet.data[1]).toBe(60);
    expect(packet.data[2]).toBe(100);

    const parsed = parseMidiNotePacket(packet.data);
    expect(parsed).toEqual({
      action: "note-on",
      note: 60,
      velocity: 100,
      channel: 2,
    });
  });

  it("génère des paquets de panique sur les 16 canaux", () => {
    const packets = buildMidiPanicPackets();
    expect(packets.length).toBe(32); // 2 par canal × 16 canaux
  });

  it("génère les messages Realtime MIDI standards", () => {
    expect(buildMidiRealtimePacket("start").data[0]).toBe(0xfa);
    expect(buildMidiRealtimePacket("continue").data[0]).toBe(0xfb);
    expect(buildMidiRealtimePacket("stop").data[0]).toBe(0xfc);
    expect(buildMidiRealtimePacket("clock").data[0]).toBe(0xf8);
  });
});

describe("MIDI Bridge - MasterTransportClock (24 PPQN)", () => {
  it("initialise l'horloge avec le tempo demandé", () => {
    const clock = new MasterTransportClock(130);
    expect(clock.getBpm()).toBe(130);
    expect(clock.getIsRunning()).toBe(false);

    clock.setBpm(140);
    expect(clock.getBpm()).toBe(140);
  });

  it("borne le tempo entre 30 et 300 BPM", () => {
    const clock = new MasterTransportClock();
    clock.setBpm(10);
    expect(clock.getBpm()).toBe(30);

    clock.setBpm(500);
    expect(clock.getBpm()).toBe(300);
  });
});
