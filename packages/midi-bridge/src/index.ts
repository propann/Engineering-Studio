/**
 * MIDI Bridge - Synchronization between OP-1 and EP-133
 * Handles MIDI event routing, clock sync, and coordination
 */

import type { InstrumentAdapter } from '@studio-hub/instrument-interface';

/** MIDI realtime messages used by both studios for transport synchronisation. */
export const MIDI_REALTIME = {
  clock: 0xf8,
  start: 0xfa,
  continue: 0xfb,
  stop: 0xfc,
} as const;

export type MidiRealtimeType = keyof typeof MIDI_REALTIME;

export type HubTransportAction = 'start' | 'stop';

export interface HubTransportMessage {
  type: 'hub:midi-transport';
  schema: 'studio-hub.transport.v1';
  source: 'studio-hub';
  action: HubTransportAction;
  bpm: number;
  timestamp: number;
}

export function createHubTransportMessage(action: HubTransportAction, bpm: number, timestamp: number): HubTransportMessage {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error('BPM must be a positive number');
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  return { type: 'hub:midi-transport', schema: 'studio-hub.transport.v1', source: 'studio-hub', action, bpm, timestamp };
}

export function isHubTransportMessage(value: unknown): value is HubTransportMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<HubTransportMessage>;
  return message.type === 'hub:midi-transport'
    && message.schema === 'studio-hub.transport.v1'
    && message.source === 'studio-hub'
    && (message.action === 'start' || message.action === 'stop')
    && typeof message.bpm === 'number' && Number.isFinite(message.bpm) && message.bpm > 0
    && typeof message.timestamp === 'number' && Number.isFinite(message.timestamp);
}

export type HubNoteAction = 'note-on' | 'note-off';

export interface HubNoteMessage {
  type: 'hub:midi-note';
  schema: 'studio-hub.note.v1';
  source: 'studio-hub';
  action: HubNoteAction;
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
}

export interface HubPanicMessage {
  type: 'hub:midi-panic';
  schema: 'studio-hub.panic.v1';
  source: 'studio-hub';
  timestamp: number;
}

function assertMidiValue(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 127) throw new Error(`${label} must be an integer between 0 and 127`);
}

export function createHubNoteMessage(action: HubNoteAction, note: number, velocity: number, channel = 0, timestamp = 0): HubNoteMessage {
  assertMidiValue(note, 'note');
  assertMidiValue(velocity, 'velocity');
  if (!Number.isInteger(channel) || channel < 0 || channel > 15) throw new Error('channel must be an integer between 0 and 15');
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  return { type: 'hub:midi-note', schema: 'studio-hub.note.v1', source: 'studio-hub', action, note, velocity, channel, timestamp };
}

export function isHubNoteMessage(value: unknown): value is HubNoteMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<HubNoteMessage>;
  return message.type === 'hub:midi-note'
    && message.schema === 'studio-hub.note.v1'
    && message.source === 'studio-hub'
    && (message.action === 'note-on' || message.action === 'note-off')
    && typeof message.note === 'number' && Number.isInteger(message.note) && message.note >= 0 && message.note <= 127
    && typeof message.velocity === 'number' && Number.isInteger(message.velocity) && message.velocity >= 0 && message.velocity <= 127
    && typeof message.channel === 'number' && Number.isInteger(message.channel) && message.channel >= 0 && message.channel <= 15
    && typeof message.timestamp === 'number' && Number.isFinite(message.timestamp);
}

export function createHubPanicMessage(timestamp = 0): HubPanicMessage {
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  return { type: 'hub:midi-panic', schema: 'studio-hub.panic.v1', source: 'studio-hub', timestamp };
}

/** Build a standard channel voice packet for a hardware MIDI output. */
export function buildMidiNotePacket(action: HubNoteAction, note: number, velocity: number, channel = 0, timestamp = 0): { type: HubNoteAction; data: number[]; timestamp: number } {
  assertMidiValue(note, 'note');
  assertMidiValue(velocity, 'velocity');
  if (!Number.isInteger(channel) || channel < 0 || channel > 15) throw new Error('channel must be an integer between 0 and 15');
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  const status = (action === 'note-on' ? 0x90 : 0x80) | channel;
  return { type: action, data: [status, note, velocity], timestamp };
}

/** Decode a channel MIDI note message from a Web MIDI byte array. */
export function parseMidiNotePacket(data: ArrayLike<number> | null | undefined): { action: HubNoteAction; note: number; velocity: number; channel: number } | null {
  if (!data || data.length < 3) return null;
  const status = Number(data[0]);
  const command = status & 0xf0;
  const channel = status & 0x0f;
  const note = Number(data[1]);
  const velocity = Number(data[2]);
  if ((command !== 0x80 && command !== 0x90) || ![note, velocity].every((value) => Number.isInteger(value) && value >= 0 && value <= 127)) return null;
  return { action: command === 0x90 && velocity > 0 ? 'note-on' : 'note-off', note, velocity: command === 0x90 ? velocity : 0, channel };
}

/** Standard all-sound-off/all-notes-off pair for every MIDI channel. */
export function buildMidiPanicPackets(timestamp = 0): Array<{ type: 'control-change'; data: number[]; timestamp: number }> {
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  return Array.from({ length: 16 }, (_, channel) => [
    { type: 'control-change' as const, data: [0xb0 | channel, 123, 0], timestamp },
    { type: 'control-change' as const, data: [0xb0 | channel, 120, 0], timestamp },
  ]).flat();
}

export function isHubPanicMessage(value: unknown): value is HubPanicMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<HubPanicMessage>;
  return message.type === 'hub:midi-panic'
    && message.schema === 'studio-hub.panic.v1'
    && message.source === 'studio-hub'
    && typeof message.timestamp === 'number' && Number.isFinite(message.timestamp);
}

/** Shared versioned cache envelope used by both studios for Hub imports. */
export const HUB_CACHE_KEYS = {
  profile: 'studio-hub:imported-profile',
  machine: 'studio-hub:imported-machine',
} as const;

export interface HubCacheEnvelope<T> {
  schema: 'studio-hub.cache.v1';
  source: 'studio-hub';
  version: 1;
  savedAt: string;
  value: T;
}

export function createHubCacheEnvelope<T>(value: T, savedAt = new Date().toISOString()): HubCacheEnvelope<T> {
  if (Number.isNaN(Date.parse(savedAt))) throw new Error('savedAt must be an ISO date');
  return { schema: 'studio-hub.cache.v1', source: 'studio-hub', version: 1, savedAt, value };
}

/** Read a versioned cache value while accepting the raw JSON used by older builds. */
export function readHubCache<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HubCacheEnvelope<T>> & { value?: T };
    if (parsed.schema === 'studio-hub.cache.v1') {
      if (parsed.source !== 'studio-hub' || parsed.version !== 1 || typeof parsed.savedAt !== 'string' || Number.isNaN(Date.parse(parsed.savedAt)) || !('value' in parsed)) return null;
      return parsed.value ?? null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export interface MidiRealtimePacket {
  type: MidiRealtimeType;
  data: number[];
  timestamp: number;
}

export interface MidiClockWindow {
  bpm: number;
  ppqn: 24;
  intervalMs: number;
  packets: MidiRealtimePacket[];
}

/**
 * Build a timestamped MIDI clock window without touching a device.
 *
 * Keeping this calculation pure gives the Hub and the hardware bridge the
 * same timing contract, and makes it possible to validate sync without a
 * connected machine. MIDI clock is 24 pulses per quarter note.
 */
export function buildMidiClockWindow(bpm: number, ticks = 24, startAt = 0): MidiClockWindow {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error('BPM must be a positive number');
  if (!Number.isInteger(ticks) || ticks <= 0) throw new Error('ticks must be a positive integer');
  if (!Number.isFinite(startAt)) throw new Error('startAt must be a finite timestamp');

  const intervalMs = 60_000 / bpm / 24;
  const packets = Array.from({ length: ticks }, (_, index): MidiRealtimePacket => ({
    type: 'clock',
    data: [MIDI_REALTIME.clock],
    timestamp: startAt + index * intervalMs,
  }));

  return { bpm, ppqn: 24, intervalMs, packets };
}

/** Create a transport packet for a Web MIDI output or another MIDI sink. */
export function buildMidiRealtimePacket(type: MidiRealtimeType, timestamp = 0): MidiRealtimePacket {
  if (!Number.isFinite(timestamp)) throw new Error('timestamp must be finite');
  return { type, data: [MIDI_REALTIME[type]], timestamp };
}

export interface MidiEvent {
  type: 'note-on' | 'note-off' | 'control-change' | 'program-change' | 'clock' | 'start' | 'stop';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  timestamp: number;
}

export interface MidiBridgeConfig {
  masterDevice: 'op1' | 'ep133';
  enableClockSync: boolean;
  enableEventRouting: boolean;
  latencyMs: number;
}

export class MidiBridge {
  private op1?: InstrumentAdapter;
  private ep133?: InstrumentAdapter;
  private config: MidiBridgeConfig;
  private eventQueue: MidiEvent[] = [];
  private isRunning = false;
  private clockRate = 120; // BPM

  constructor(config: Partial<MidiBridgeConfig> = {}) {
    this.config = {
      masterDevice: 'op1',
      enableClockSync: true,
      enableEventRouting: true,
      latencyMs: 0,
      ...config,
    };
  }

  /**
   * Connect instruments to the bridge
   */
  connectOP1(adapter: InstrumentAdapter): void {
    this.op1 = adapter;
  }

  connectEP133(adapter: InstrumentAdapter): void {
    this.ep133 = adapter;
  }

  /**
   * Start synchronization
   */
  start(): void {
    if (!this.op1 || !this.ep133) {
      throw new Error('Both instruments must be connected');
    }
    this.isRunning = true;
  }

  /**
   * Stop synchronization
   */
  stop(): void {
    this.isRunning = false;
    this.eventQueue = [];
  }

  /**
   * Route MIDI event from source to destination
   */
  routeEvent(event: MidiEvent): void {
    if (!this.isRunning) return;

    // Add latency if configured
    if (this.config.latencyMs > 0) {
      event.timestamp += this.config.latencyMs;
    }

    this.eventQueue.push(event);

    if (this.config.enableEventRouting) {
      this.processEvent(event);
    }
  }

  /**
   * Send MIDI clock tick
   */
  sendClock(bpm: number): void {
    if (!this.isRunning || !this.config.enableClockSync) return;

    this.clockRate = bpm;

    const clockEvent: MidiEvent = {
      type: 'clock',
      channel: 0,
      timestamp: Date.now(),
    };

    this.eventQueue.push(clockEvent);
  }

  /**
   * Get current clock rate
   */
  getClockRate(): number {
    return this.clockRate;
  }

  /**
   * Get event queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Get bridge status
   */
  getStatus(): {
    isRunning: boolean;
    op1Connected: boolean;
    ep133Connected: boolean;
    queueSize: number;
    clockRate: number;
  } {
    return {
      isRunning: this.isRunning,
      op1Connected: !!this.op1,
      ep133Connected: !!this.ep133,
      queueSize: this.eventQueue.length,
      clockRate: this.clockRate,
    };
  }

  /**
   * Process event and route to appropriate instrument
   */
  private processEvent(event: MidiEvent): void {
    // Determine destination based on event type and master device
    const destination = this.config.masterDevice === 'op1' ? this.ep133 : this.op1;

    if (!destination) return;

    // Route based on event type
    switch (event.type) {
      case 'note-on':
      case 'note-off':
        // Route note events to opposite instrument
        break;
      case 'control-change':
        // Route CC events
        break;
      case 'clock':
        // Clock events don't need routing
        break;
    }
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }
}

/**
 * Create a new MIDI bridge
 */
export function createMidiBridge(config?: Partial<MidiBridgeConfig>): MidiBridge {
  return new MidiBridge(config);
}
