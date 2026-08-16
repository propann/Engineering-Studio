/**
 * Instrument Interface Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createAdapterRegistry,
  getAdaptersSupportedForMachine,
  getTotalResourceRequirements,
  findAdaptersForResources,
  createQualityPreset,
  validateAdapterForMachine,
  InstrumentAdapter,
  InstrumentState,
} from './index';

// Mock adapter for testing
function createMockAdapter(name: string, minClass: 'minimal' | 'standard' = 'standard'): InstrumentAdapter {
  return {
    initialize: async () => {},
    shutdown: async () => {},
    getCapabilities: () => ({
      name,
      vendor: 'Mock',
      version: '1.0.0',
      minMachineClass: minClass,
      requiredMemoryMB: 256,
      requiredCpuPercent: 30,
      maxVoicesPerClass: { minimal: 4, standard: 8, performance: 16, server: 32 },
      supportedAudioFormats: ['wav', 'aiff'],
      supportedFeatures: ['reverb', 'delay'],
      hasBuiltInEffects: true,
      midiCapabilities: {
        inputSupported: true,
        outputSupported: true,
        ccControlled: true,
      },
    }),
    getState: (): InstrumentState => ({
      isInitialized: true,
      isRunning: false,
      activeVoices: 0,
      cpuLoad: 0,
    }),
    isSupported: (machineClass) => {
      const hierarchy: Record<string, string[]> = {
        minimal: ['minimal'],
        standard: ['minimal', 'standard'],
        performance: ['minimal', 'standard', 'performance'],
        server: ['minimal', 'standard', 'performance', 'server'],
      };
      return hierarchy[machineClass]?.includes(minClass) || false;
    },
    configure: () => {},
    getQualityPreset: (machineClass) =>
      createQualityPreset(machineClass, {}),
    setQualityPreset: () => {},
    getResourceRequirements: () => ({
      name,
      memory: 256,
      cpu: 30,
      priority: 50,
    }),
    getResourceUsage: () => ({
      name,
      memory: 100,
      cpu: 15,
      priority: 50,
    }),
    getAvailableMidiPorts: () => [
      { id: 'midi1', name: 'MIDI In', direction: 'in', isConnected: true },
    ],
    getAvailableAudioOutputs: () => [
      { id: 'out1', name: 'Main', channels: 2, sampleRate: 44100 },
    ],
    setAudioOutput: () => {},
    enableFeature: () => true,
    disableFeature: () => true,
    isFeatureEnabled: () => true,
  };
}

describe('Instrument Interface', () => {
  describe('createAdapterRegistry', () => {
    it('should create empty registry', () => {
      const registry = createAdapterRegistry();

      expect(registry.adapters.size).toBe(0);
      expect(registry.listAdapters()).toHaveLength(0);
    });

    it('should register adapter', () => {
      const registry = createAdapterRegistry();
      const adapter = createMockAdapter('mock1');

      registry.registerAdapter('mock1', adapter);

      expect(registry.adapters.size).toBe(1);
      expect(registry.getAdapter('mock1')).toBe(adapter);
    });

    it('should unregister adapter', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('mock1', createMockAdapter('mock1'));

      registry.unregisterAdapter('mock1');

      expect(registry.adapters.size).toBe(0);
      expect(registry.getAdapter('mock1')).toBeUndefined();
    });

    it('should list adapters', () => {
      const registry = createAdapterRegistry();

      registry.registerAdapter('adapter1', createMockAdapter('adapter1'));
      registry.registerAdapter('adapter2', createMockAdapter('adapter2'));

      const list = registry.listAdapters();

      expect(list).toHaveLength(2);
      expect(list).toContain('adapter1');
      expect(list).toContain('adapter2');
    });
  });

  describe('getAdaptersSupportedForMachine', () => {
    it('should return minimal adapters for minimal machine', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('minimal-adapter', createMockAdapter('minimal', 'minimal'));
      registry.registerAdapter('standard-adapter', createMockAdapter('standard', 'standard'));

      const supported = getAdaptersSupportedForMachine(registry, 'minimal');

      expect(supported).toContain('minimal-adapter');
      expect(supported).not.toContain('standard-adapter');
    });

    it('should return all supported adapters for server machine', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('minimal-adapter', createMockAdapter('minimal', 'minimal'));
      registry.registerAdapter('standard-adapter', createMockAdapter('standard', 'standard'));
      registry.registerAdapter('performance-adapter', createMockAdapter('perf', 'performance'));

      const supported = getAdaptersSupportedForMachine(registry, 'server');

      expect(supported.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getTotalResourceRequirements', () => {
    it('should sum resource requirements', () => {
      const adapters = [
        createMockAdapter('adapter1'),
        createMockAdapter('adapter2'),
      ];

      const total = getTotalResourceRequirements(adapters);

      expect(total.memory).toBe(512); // 256 + 256
      expect(total.cpu).toBe(60); // 30 + 30
    });
  });

  describe('findAdaptersForResources', () => {
    it('should find adapters that fit in available resources', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('adapter1', createMockAdapter('adapter1'));

      const found = findAdaptersForResources(registry, 512, 60, 'standard');

      expect(found).toContain('adapter1');
    });

    it('should not return adapters that exceed resources', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('adapter1', createMockAdapter('adapter1'));

      const found = findAdaptersForResources(registry, 100, 20, 'standard');

      expect(found).not.toContain('adapter1');
    });
  });

  describe('createQualityPreset', () => {
    it('should create minimal preset', () => {
      const preset = createQualityPreset('minimal', {});

      expect(preset.machineClass).toBe('minimal');
      expect(preset.voicePolyphony).toBe(4);
      expect(preset.sampleRate).toBe(22050);
    });

    it('should create standard preset', () => {
      const preset = createQualityPreset('standard', {});

      expect(preset.voicePolyphony).toBe(8);
      expect(preset.sampleRate).toBe(44100);
    });

    it('should create performance preset', () => {
      const preset = createQualityPreset('performance', {});

      expect(preset.voicePolyphony).toBe(16);
      expect(preset.sampleRate).toBe(48000);
    });

    it('should create server preset', () => {
      const preset = createQualityPreset('server', {});

      expect(preset.voicePolyphony).toBe(32);
      expect(preset.sampleRate).toBe(96000);
    });

    it('should override defaults', () => {
      const preset = createQualityPreset('standard', {
        voicePolyphony: 16,
        sampleRate: 96000,
      });

      expect(preset.voicePolyphony).toBe(16);
      expect(preset.sampleRate).toBe(96000);
    });
  });

  describe('validateAdapterForMachine', () => {
    it('should validate supported adapter', () => {
      const adapter = createMockAdapter('test', 'standard');

      const result = validateAdapterForMachine(adapter, 'standard', 512, 60);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unsupported adapter', () => {
      const adapter = createMockAdapter('test', 'performance');

      const result = validateAdapterForMachine(adapter, 'minimal', 512, 60);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject insufficient memory', () => {
      const adapter = createMockAdapter('test', 'standard');

      const result = validateAdapterForMachine(adapter, 'standard', 100, 60);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('memory'))).toBe(true);
    });

    it('should reject insufficient CPU', () => {
      const adapter = createMockAdapter('test', 'standard');

      const result = validateAdapterForMachine(adapter, 'standard', 512, 10);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('CPU'))).toBe(true);
    });
  });

  describe('mock adapter functionality', () => {
    it('should implement instrument adapter interface', async () => {
      const adapter = createMockAdapter('test');

      // Lifecycle
      await adapter.initialize();
      await adapter.shutdown();

      // Capabilities
      const caps = adapter.getCapabilities();
      expect(caps.name).toBe('test');

      // Support check
      expect(adapter.isSupported('standard')).toBe(true);

      // MIDI/Audio
      const midi = adapter.getAvailableMidiPorts();
      expect(midi.length).toBeGreaterThan(0);

      const audio = adapter.getAvailableAudioOutputs();
      expect(audio.length).toBeGreaterThan(0);
    });
  });
});
