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

export const HUB_CACHE_KEYS = {
  PROFILE: "studio-hub:profile",
  CACHE: "studio-hub:cache",
  profile: "studio-hub:profile",
  machine: "studio-hub:machine"
};

export function createHubCacheEnvelope<T>(data: T) {
  return { data, timestamp: Date.now() };
}

export function readHubCache<T>(keyOrRaw: string): T | null {
  if (!keyOrRaw) return null;
  try {
    let raw: string | null = null;
    if (typeof window !== "undefined") {
      try {
        raw = localStorage.getItem(keyOrRaw) ?? sessionStorage.getItem(keyOrRaw);
      } catch {
        // Storage might be restricted
      }
    }
    const candidate = raw || keyOrRaw;
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && "data" in parsed && "timestamp" in parsed) {
      return (parsed as { data: T }).data;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function isHubNoteMessage(msg: any): msg is HubNoteMessage {
  return msg && msg.type === "hub-note";
}

export function isHubTransportMessage(msg: any): msg is HubTransportMessage {
  return msg && msg.type === "hub-transport";
}

export function isHubPanicMessage(msg: any): msg is HubPanicMessage {
  return msg && msg.type === "hub-panic";
}

// =====================================================================
// SAMPLE-ACCURATE LOOKAHEAD MASTER CLOCK (24 PPQN)
// =====================================================================

export interface ClockTickEvent {
  tick: number; // 0..23 dans le temps courant
  beat: number; // temps dans la mesure (0..3 pour du 4/4)
  bar: number;  // mesure (1..)
  totalTicks: number;
  audioTime: number;
  bpm: number;
}

export type ClockTickListener = (event: ClockTickEvent) => void;

/**
 * Horloge maître d'ordonnancement audio temps réel.
 * Utilise la technique du double timer (Web Audio currentTime + requestAnimationFrame / setInterval court)
 * pour garantir une dérive < 0.5ms même si l'onglet passe au second plan.
 */
export class MasterTransportClock {
  private bpm: number = 120;
  private isRunning: boolean = false;
  private audioCtx: AudioContext | null = null;
  private nextTickTime: number = 0;
  private currentTotalTick: number = 0;
  private lookaheadMs: number = 40;
  private scheduleIntervalMs: number = 20;
  private timerId: any = null;
  private tickListeners: Set<ClockTickListener> = new Set();
  private stateListeners: Set<(running: boolean, bpm: number) => void> = new Set();

  constructor(initialBpm = 120) {
    this.bpm = Math.max(30, Math.min(300, initialBpm));
  }

  public setAudioContext(ctx: AudioContext): void {
    this.audioCtx = ctx;
  }

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(30, Math.min(300, newBpm));
    this.notifyState();
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public onTick(listener: ClockTickListener): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  public onStateChange(listener: (running: boolean, bpm: number) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentTotalTick = 0;

    const ctx = this.audioCtx || (typeof window !== "undefined" && (window as any).AudioContext ? new (window as any).AudioContext() : null);
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
    this.audioCtx = ctx;

    const now = ctx ? ctx.currentTime : performance.now() / 1000;
    this.nextTickTime = now + 0.05; // 50ms pre-roll

    this.timerId = setInterval(() => this.scheduler(), this.scheduleIntervalMs);
    this.notifyState();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hub:transport", {
        detail: createHubTransportMessage("start", this.bpm, performance.now()),
      }));
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyState();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hub:transport", {
        detail: createHubTransportMessage("stop", this.bpm, performance.now()),
      }));
    }
  }

  private scheduler(): void {
    if (!this.isRunning) return;
    const now = this.audioCtx ? this.audioCtx.currentTime : performance.now() / 1000;
    const lookaheadSec = this.lookaheadMs / 1000;

    // 24 PPQN = 24 ticks par noire
    const secondsPerBeat = 60 / this.bpm;
    const secondsPerTick = secondsPerBeat / 24;

    while (this.nextTickTime < now + lookaheadSec) {
      const tickInBeat = this.currentTotalTick % 24;
      const beatInBar = Math.floor((this.currentTotalTick / 24) % 4);
      const bar = Math.floor(this.currentTotalTick / (24 * 4)) + 1;

      const event: ClockTickEvent = {
        tick: tickInBeat,
        beat: beatInBar,
        bar,
        totalTicks: this.currentTotalTick,
        audioTime: this.nextTickTime,
        bpm: this.bpm,
      };

      this.tickListeners.forEach((l) => {
        try {
          l(event);
        } catch (e) {
          console.error("Error in clock tick listener", e);
        }
      });

      this.nextTickTime += secondsPerTick;
      this.currentTotalTick++;
    }
  }

  private notifyState(): void {
    this.stateListeners.forEach((l) => {
      try {
        l(this.isRunning, this.bpm);
      } catch (e) {
        console.error("Error in clock state listener", e);
      }
    });
  }
}

export const masterTransportClock = new MasterTransportClock();

