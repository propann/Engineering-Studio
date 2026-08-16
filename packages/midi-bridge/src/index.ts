/**
 * MIDI Bridge - Synchronization between OP-1 and EP-133
 * Handles MIDI event routing, clock sync, and coordination
 */

import type { InstrumentAdapter } from '@studio-hub/instrument-interface';

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
