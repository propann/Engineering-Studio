import { describe, it, expect, beforeEach } from 'vitest';
import { buildMidiClockWindow, buildMidiRealtimePacket, createHubTransportMessage, createMidiBridge, isHubTransportMessage, MidiEvent, MIDI_REALTIME } from './index';
import { createOP1Adapter } from '@studio-hub/instrument-op1';
import { createEP133Adapter } from '@studio-hub/instrument-ep133';

describe('MIDI Bridge', () => {
  it('builds a standard 24 PPQN clock window', () => {
    const window = buildMidiClockWindow(120, 48, 1_000);

    expect(window.ppqn).toBe(24);
    expect(window.intervalMs).toBeCloseTo(20.8333, 3);
    expect(window.packets).toHaveLength(48);
    expect(window.packets[0]).toEqual({ type: 'clock', data: [MIDI_REALTIME.clock], timestamp: 1_000 });
    expect(window.packets[24].timestamp - window.packets[0].timestamp).toBeCloseTo(500, 6);
  });

  it('builds transport start and stop packets', () => {
    expect(buildMidiRealtimePacket('start', 12)).toEqual({ type: 'start', data: [0xfa], timestamp: 12 });
    expect(buildMidiRealtimePacket('stop', 34)).toEqual({ type: 'stop', data: [0xfc], timestamp: 34 });
  });

  it('validates the Hub transport message contract', () => {
    const message = createHubTransportMessage('start', 96, 42);
    expect(isHubTransportMessage(message)).toBe(true);
    expect(isHubTransportMessage({ ...message, source: 'unknown' })).toBe(false);
    expect(isHubTransportMessage({ ...message, bpm: 0 })).toBe(false);
  });

  it('rejects invalid clock parameters', () => {
    expect(() => buildMidiClockWindow(0)).toThrow('BPM must be a positive number');
    expect(() => buildMidiClockWindow(120, 0)).toThrow('ticks must be a positive integer');
    expect(() => buildMidiClockWindow(120, 1, Number.NaN)).toThrow('startAt must be a finite timestamp');
  });

  it('should create bridge instance', () => {
    const bridge = createMidiBridge();
    expect(bridge).toBeDefined();
  });

  it('should initialize with default config', () => {
    const bridge = createMidiBridge();
    const status = bridge.getStatus();

    expect(status.isRunning).toBe(false);
    expect(status.clockRate).toBe(120);
    expect(status.queueSize).toBe(0);
  });

  it('should connect instruments', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);

    const status = bridge.getStatus();
    expect(status.op1Connected).toBe(true);
    expect(status.ep133Connected).toBe(true);
  });

  it('should start and stop synchronization', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);

    bridge.start();
    expect(bridge.getStatus().isRunning).toBe(true);

    bridge.stop();
    expect(bridge.getStatus().isRunning).toBe(false);
  });

  it('should require both instruments for start', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();

    bridge.connectOP1(op1);

    expect(() => bridge.start()).toThrow('Both instruments must be connected');
  });

  it('should queue MIDI events', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);
    bridge.start();

    const event: MidiEvent = {
      type: 'note-on',
      channel: 0,
      note: 60,
      velocity: 100,
      timestamp: Date.now(),
    };

    bridge.routeEvent(event);

    expect(bridge.getQueueSize()).toBe(1);
  });

  it('should not queue events when stopped', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);

    const event: MidiEvent = {
      type: 'note-on',
      channel: 0,
      note: 60,
      velocity: 100,
      timestamp: Date.now(),
    };

    bridge.routeEvent(event);

    expect(bridge.getQueueSize()).toBe(0);
  });

  it('should handle multiple event types', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);
    bridge.start();

    const events: MidiEvent[] = [
      { type: 'note-on', channel: 0, note: 60, velocity: 100, timestamp: Date.now() },
      { type: 'control-change', channel: 0, controller: 7, value: 100, timestamp: Date.now() },
      { type: 'note-off', channel: 0, note: 60, velocity: 0, timestamp: Date.now() },
    ];

    events.forEach(e => bridge.routeEvent(e));

    expect(bridge.getQueueSize()).toBe(3);
  });

  it('should send MIDI clock', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);
    bridge.start();

    bridge.sendClock(140);

    expect(bridge.getClockRate()).toBe(140);
    expect(bridge.getQueueSize()).toBe(1);
  });

  it('should respect latency configuration', () => {
    const bridge = createMidiBridge({ latencyMs: 50 });
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);
    bridge.start();

    const originalTime = Date.now();
    const event: MidiEvent = {
      type: 'note-on',
      channel: 0,
      note: 60,
      velocity: 100,
      timestamp: originalTime,
    };

    bridge.routeEvent(event);

    expect(bridge.getQueueSize()).toBe(1);
  });

  it('should clear event queue', () => {
    const bridge = createMidiBridge();
    const op1 = createOP1Adapter();
    const ep133 = createEP133Adapter();

    bridge.connectOP1(op1);
    bridge.connectEP133(ep133);
    bridge.start();

    const event: MidiEvent = {
      type: 'note-on',
      channel: 0,
      note: 60,
      velocity: 100,
      timestamp: Date.now(),
    };

    bridge.routeEvent(event);
    expect(bridge.getQueueSize()).toBe(1);

    bridge.clearQueue();
    expect(bridge.getQueueSize()).toBe(0);
  });
});
