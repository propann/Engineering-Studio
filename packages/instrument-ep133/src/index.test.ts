/**
 * Korg EP-133 Adapter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EP133Adapter, createEP133Adapter, configureEP133, EP133_QUALITY_PRESETS } from './index';
import type { MachineClass } from '@studio-hub/instrument-interface';

describe('EP133Adapter', () => {
  let adapter: EP133Adapter;

  beforeEach(() => {
    adapter = new EP133Adapter();
  });

  describe('Initialization', () => {
    it('should initialize', async () => {
      expect(adapter.getState().isInitialized).toBe(false);

      await adapter.initialize();

      expect(adapter.getState().isInitialized).toBe(true);
    });

    it('should shutdown', async () => {
      await adapter.initialize();
      expect(adapter.getState().isInitialized).toBe(true);

      await adapter.shutdown();

      expect(adapter.getState().isInitialized).toBe(false);
    });
  });

  describe('Capabilities', () => {
    it('should report capabilities', () => {
      const caps = adapter.getCapabilities();

      expect(caps.name).toBe('Korg EP-133 GO');
      expect(caps.vendor).toBe('Korg');
      expect(caps.hasBuiltInEffects).toBe(true);
    });

    it('should support all machine classes', () => {
      expect(adapter.isSupported('minimal')).toBe(true);
      expect(adapter.isSupported('standard')).toBe(true);
      expect(adapter.isSupported('performance')).toBe(true);
      expect(adapter.isSupported('server')).toBe(true);
    });

    it('should have drum-specific features', () => {
      const caps = adapter.getCapabilities();
      const features = caps.supportedFeatures;

      expect(features).toContain('rhythms');
      expect(features).toContain('patterns');
      expect(features).toContain('sampling');
    });
  });

  describe('Quality Presets', () => {
    it('should provide minimal preset', () => {
      const preset = adapter.getQualityPreset('minimal');

      expect(preset.machineClass).toBe('minimal');
      expect(preset.voicePolyphony).toBe(4);
      expect(preset.sampleRate).toBe(22050);
    });

    it('should provide standard preset', () => {
      const preset = adapter.getQualityPreset('standard');

      expect(preset.voicePolyphony).toBe(8);
      expect(preset.sampleRate).toBe(44100);
    });

    it('should provide performance preset', () => {
      const preset = adapter.getQualityPreset('performance');

      expect(preset.voicePolyphony).toBe(16);
      expect(preset.sampleRate).toBe(48000);
    });

    it('should provide server preset', () => {
      const preset = adapter.getQualityPreset('server');

      expect(preset.voicePolyphony).toBe(32);
      expect(preset.sampleRate).toBe(96000);
    });

    it('should allow preset override', () => {
      const preset = adapter.getQualityPreset('standard');
      adapter.setQualityPreset(preset);

      const state = adapter.getState();
      expect(state.currentPreset?.machineClass).toBe('standard');
    });
  });

  describe('Resource Management', () => {
    it('should report resource requirements', () => {
      const reqs = adapter.getResourceRequirements();

      expect(reqs.name).toBe('ep133');
      expect(reqs.memory).toBeGreaterThan(0);
      expect(reqs.cpu).toBeGreaterThan(0);
    });

    it('should report lower resources than OP-1', () => {
      // EP-133 is a drum machine, should use less resources
      const reqs = adapter.getResourceRequirements();

      expect(reqs.memory).toBeLessThan(256);
      expect(reqs.cpu).toBeLessThan(35);
    });

    it('should scale resources with preset', () => {
      const minimalPreset = adapter.getQualityPreset('minimal');
      adapter.setQualityPreset(minimalPreset);

      const minimalReqs = adapter.getResourceRequirements();

      const serverPreset = adapter.getQualityPreset('server');
      adapter.setQualityPreset(serverPreset);

      const serverReqs = adapter.getResourceRequirements();

      expect(serverReqs.memory).toBeGreaterThan(minimalReqs.memory);
      expect(serverReqs.cpu).toBeGreaterThan(minimalReqs.cpu);
    });
  });

  describe('MIDI I/O', () => {
    it('should list MIDI ports', () => {
      const ports = adapter.getAvailableMidiPorts();

      expect(ports.length).toBeGreaterThan(0);
      expect(ports.some(p => p.direction === 'in')).toBe(true);
    });

    it('should have EP-133 specific port names', () => {
      const ports = adapter.getAvailableMidiPorts();
      const portNames = ports.map(p => p.name);

      expect(portNames.some(n => n.includes('EP-133'))).toBe(true);
    });
  });

  describe('Audio I/O', () => {
    it('should list audio outputs', () => {
      const outputs = adapter.getAvailableAudioOutputs();

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0].channels).toBe(2);
    });

    it('should set audio output', () => {
      const outputs = adapter.getAvailableAudioOutputs();
      const outputId = outputs[0].id;

      adapter.setAudioOutput(outputId);
      expect(outputs[0].id).toBe(outputId);
    });

    it('should adapt sample rate to preset', () => {
      const preset = adapter.getQualityPreset('performance');
      adapter.setQualityPreset(preset);

      const outputs = adapter.getAvailableAudioOutputs();
      expect(outputs[0].sampleRate).toBe(48000);
    });
  });

  describe('Features', () => {
    it('should enable features', () => {
      const success = adapter.enableFeature('reverb');

      expect(success).toBe(true);
      expect(adapter.isFeatureEnabled('reverb')).toBe(true);
    });

    it('should disable features', () => {
      adapter.enableFeature('reverb');
      adapter.disableFeature('reverb');

      expect(adapter.isFeatureEnabled('reverb')).toBe(false);
    });

    it('should support drum-specific features', () => {
      const success1 = adapter.enableFeature('rhythms');
      const success2 = adapter.enableFeature('patterns');
      const success3 = adapter.enableFeature('sampling');

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(success3).toBe(true);
    });
  });

  describe('Factory Function', () => {
    it('should create adapter via factory', () => {
      const created = createEP133Adapter();

      expect(created).toBeDefined();
      expect(created.getCapabilities().name).toBe('Korg EP-133 GO');
    });
  });

  describe('Configuration', () => {
    it('should apply configuration', () => {
      const config = {
        machineClass: 'standard' as const,
        quality: adapter.getQualityPreset('standard'),
        enabledFeatures: ['rhythms', 'patterns'],
      };

      adapter.configure(config);

      expect(adapter.isFeatureEnabled('rhythms')).toBe(true);
      expect(adapter.isFeatureEnabled('patterns')).toBe(true);
    });

    it('should apply EP-133 specific configuration', () => {
      const config = {
        machineClass: 'standard' as const,
        enableRhythms: true,
        enablePatterns: true,
        enableChaining: true,
        enableSampling: false,
      };

      configureEP133(adapter, config);

      expect(adapter.isFeatureEnabled('rhythms')).toBe(true);
      expect(adapter.isFeatureEnabled('patterns')).toBe(true);
      expect(adapter.isFeatureEnabled('chaining')).toBe(true);
      expect(adapter.isFeatureEnabled('sampling')).toBe(false);
    });
  });

  describe('Quality Presets Collection', () => {
    it('should have predefined quality presets', () => {
      expect(EP133_QUALITY_PRESETS.minimal_basic).toBeDefined();
      expect(EP133_QUALITY_PRESETS.standard_balanced).toBeDefined();
      expect(EP133_QUALITY_PRESETS.performance_pro).toBeDefined();
      expect(EP133_QUALITY_PRESETS.server_ultra).toBeDefined();
    });

    it('should scale presets across machine classes', () => {
      const minimal = EP133_QUALITY_PRESETS.minimal_basic;
      const standard = EP133_QUALITY_PRESETS.standard_balanced;
      const perf = EP133_QUALITY_PRESETS.performance_pro;
      const server = EP133_QUALITY_PRESETS.server_ultra;

      expect(minimal.voicePolyphony).toBeLessThan(standard.voicePolyphony);
      expect(standard.voicePolyphony).toBeLessThan(perf.voicePolyphony);
      expect(perf.voicePolyphony).toBeLessThan(server.voicePolyphony);
    });
  });

  describe('Multi-Machine Support', () => {
    it('should work on minimal machine', () => {
      expect(adapter.isSupported('minimal')).toBe(true);
      const preset = adapter.getQualityPreset('minimal');
      expect(preset.voicePolyphony).toBeGreaterThan(0);
    });

    (['standard', 'performance', 'server'] as const).forEach(machineClass => {
      it(`should support ${machineClass} machines`, () => {
        expect(adapter.isSupported(machineClass)).toBe(true);
      });
    });
  });

  describe('Resource Efficiency', () => {
    it('should use less memory than OP-1 on standard', () => {
      // EP-133 is a drum machine, should be more efficient
      const preset = adapter.getQualityPreset('standard');

      expect(preset.memoryUsageMB).toBeLessThanOrEqual(256);
      expect(preset.cpuUsagePercent).toBeLessThanOrEqual(50);
    });

    it('should work on minimal machines', () => {
      const minimalPreset = adapter.getQualityPreset('minimal');

      // Should be very lightweight
      expect(minimalPreset.memoryUsageMB).toBeLessThan(128);
      expect(minimalPreset.cpuUsagePercent).toBeLessThan(30);
    });
  });
});
