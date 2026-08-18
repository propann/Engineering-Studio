// MIDI Bridge package for Studio Hub / EP-133 & OP-1 Suite

export interface HubTransportMessage {
  type: "hub-transport";
  action: "start" | "stop";
  bpm: number;
  timestamp: number;
}

export interface HubNoteMessage {
  type: "hub-note";
  action: "note-on" | "note-off";
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

export interface HubPanicMessage {
  type: "hub-panic";
  timestamp: number;
}

export interface MidiPacket {
  data: Uint8Array;
  timestamp: number;
}

export interface ClockWindow {
  packets: MidiPacket[];
  intervalMs: number;
}

export function createHubTransportMessage(
  action: "start" | "stop",
  bpm: number,
  timestamp: number
): HubTransportMessage {
  return { type: "hub-transport", action, bpm, timestamp };
}

export function createHubNoteMessage(
  action: "note-on" | "note-off",
  note: number,
  velocity: number,
  channel: number,
  timestamp: number
): HubNoteMessage {
  return { type: "hub-note", action, note, velocity, channel, timestamp };
}

export function createHubPanicMessage(timestamp: number): HubPanicMessage {
  return { type: "hub-panic", timestamp };
}

export function buildMidiNotePacket(
  action: "note-on" | "note-off",
  note: number,
  velocity: number,
  channel = 0,
  timestamp = performance.now()
): MidiPacket {
  const statusByte = (action === "note-on" ? 0x90 : 0x80) | (channel & 0x0f);
  return {
    data: new Uint8Array([statusByte, note & 0x7f, velocity & 0x7f]),
    timestamp,
  };
}

export function buildMidiPanicPackets(timestamp = performance.now()): MidiPacket[] {
  const packets: MidiPacket[] = [];
  for (let ch = 0; ch < 16; ch++) {
    // All Notes Off (CC 123) and Reset All Controllers (CC 121)
    packets.push({
      data: new Uint8Array([0xb0 | ch, 123, 0]),
      timestamp,
    });
    packets.push({
      data: new Uint8Array([0xb0 | ch, 121, 0]),
      timestamp,
    });
  }
  return packets;
}

export function buildMidiRealtimePacket(
  type: "start" | "stop" | "clock" | "continue",
  timestamp = performance.now()
): MidiPacket {
  let byte = 0xf8; // clock
  if (type === "start") byte = 0xfa;
  else if (type === "continue") byte = 0xfb;
  else if (type === "stop") byte = 0xfc;

  return {
    data: new Uint8Array([byte]),
    timestamp,
  };
}

export function buildMidiClockWindow(
  bpm: number,
  tickCount = 4,
  windowStart = performance.now()
): ClockWindow {
  // 24 PPQN (pulses per quarter note)
  const msPerBeat = 60000 / bpm;
  const intervalMs = msPerBeat / 24;
  const packets: MidiPacket[] = [];

  for (let i = 0; i < tickCount; i++) {
    packets.push({
      data: new Uint8Array([0xf8]),
      timestamp: windowStart + i * intervalMs,
    });
  }

  return { packets, intervalMs };
}

export function parseMidiNotePacket(data: Uint8Array | number[]): {
  action: "note-on" | "note-off";
  note: number;
  velocity: number;
  channel: number;
} | null {
  if (!data || data.length < 3) return null;
  const status = data[0];
  const command = status & 0xf0;
  const channel = status & 0x0f;
  const note = data[1];
  const velocity = data[2];

  if (command === 0x90) {
    if (velocity === 0) {
      return { action: "note-off", note, velocity: 0, channel };
    }
    return { action: "note-on", note, velocity, channel };
  } else if (command === 0x80) {
    return { action: "note-off", note, velocity, channel };
  }

  return null;
}
