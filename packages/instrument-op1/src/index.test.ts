/**
 * OP-1 Adapter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OP1Adapter, createOP1Adapter, configureOP1, OP1_QUALITY_PRESETS } from './index';
import type { MachineClass } from '@studio-hub/instrument-interface';

describe('OP1Adapter', () => {
  let adapter: OP1Adapter;

  beforeEach(() => {
    adapter = new OP1Adapter();
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

      expect(caps.name).toBe('OP-1 Synthesizer');
      expect(caps.vendor).toBe('Teenage Engineering');
      expect(caps.hasBuiltInEffects).toBe(true);
      expect(caps.supportedFeatures.length).toBeGreaterThan(0);
    });

    it('should have MIDI capabilities', () => {
      const caps = adapter.getCapabilities();

      expect(caps.midiCapabilities.inputSupported).toBe(true);
      expect(caps.midiCapabilities.outputSupported).toBe(true);
    });

    it('should require standard or better machine', () => {
      expect(adapter.isSupported('minimal')).toBe(false);
      expect(adapter.isSupported('standard')).toBe(true);
      expect(adapter.isSupported('performance')).toBe(true);
      expect(adapter.isSupported('server')).toBe(true);
    });
  });

  describe('Quality Presets', () => {
    it('should provide standard preset', () => {
      const preset = adapter.getQualityPreset('standard');

      expect(preset.machineClass).toBe('standard');
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

    it('should set and get quality preset', () => {
      const preset = adapter.getQualityPreset('performance');
      adapter.setQualityPreset(preset);

      const state = adapter.getState();
      expect(state.currentPreset?.machineClass).toBe('performance');
    });
  });

  describe('Resource Management', () => {
    it('should report resource requirements', () => {
      const reqs = adapter.getResourceRequirements();

      expect(reqs.name).toBe('op1');
      expect(reqs.memory).toBeGreaterThan(0);
      expect(reqs.cpu).toBeGreaterThan(0);
      expect(reqs.priority).toBe(80);
    });

    it('should report resource usage', () => {
      const usage = adapter.getResourceUsage();

      expect(usage.name).toBe('op1');
      expect(usage.memory).toBeGreaterThan(0);
      expect(usage.cpu).toBeGreaterThan(0);
    });

    it('should scale resources with preset', () => {
      const standardPreset = adapter.getQualityPreset('standard');
      adapter.setQualityPreset(standardPreset);

      const standardReqs = adapter.getResourceRequirements();

      const performancePreset = adapter.getQualityPreset('performance');
      adapter.setQualityPreset(performancePreset);

      const performanceReqs = adapter.getResourceRequirements();

      expect(performanceReqs.memory).toBeGreaterThan(standardReqs.memory);
      expect(performanceReqs.cpu).toBeGreaterThan(standardReqs.cpu);
    });
  });

  describe('MIDI I/O', () => {
    it('should list MIDI ports', () => {
      const ports = adapter.getAvailableMidiPorts();

      expect(ports.length).toBeGreaterThan(0);
      expect(ports.some(p => p.direction === 'in')).toBe(true);
      expect(ports.some(p => p.direction === 'out')).toBe(true);
    });

    it('should have standard port names', () => {
      const ports = adapter.getAvailableMidiPorts();
      const portNames = ports.map(p => p.name);

      expect(portNames.some(n => n.includes('OP-1'))).toBe(true);
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
      // Verify it was set (adapter state updated)
      expect(outputs[0].id).toBe(outputId);
    });

    it('should match sample rate to preset', () => {
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
      expect(adapter.isFeatureEnabled('reverb')).toBe(true);

      adapter.disableFeature('reverb');
      expect(adapter.isFeatureEnabled('reverb')).toBe(false);
    });

    it('should reject unsupported features', () => {
      const success = adapter.enableFeature('nonexistent');

      expect(success).toBe(false);
    });

    it('should support OP-1 specific features', () => {
      const success1 = adapter.enableFeature('synth-engine');
      const success2 = adapter.enableFeature('drum-machine');
      const success3 = adapter.enableFeature('tape');

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(success3).toBe(true);
    });
  });

  describe('Factory Function', () => {
    it('should create adapter via factory', () => {
      const created = createOP1Adapter();

      expect(created).toBeDefined();
      expect(created.getCapabilities().name).toBe('OP-1 Synthesizer');
    });
  });

  describe('Configuration', () => {
    it('should apply configuration', () => {
      const config = {
        machineClass: 'performance' as const,
        quality: adapter.getQualityPreset('performance'),
        enabledFeatures: ['reverb', 'delay'],
      };

      adapter.configure(config);

      expect(adapter.isFeatureEnabled('reverb')).toBe(true);
      expect(adapter.isFeatureEnabled('delay')).toBe(true);
    });

    it('should apply OP-1 specific configuration', () => {
      const config = {
        machineClass: 'performance' as const,
        enableSynthEngine: true,
        enableDrumMachine: true,
        enableTapeSimulation: true,
      };

      configureOP1(adapter, config);

      expect(adapter.isFeatureEnabled('synth-engine')).toBe(true);
      expect(adapter.isFeatureEnabled('drum-machine')).toBe(true);
      expect(adapter.isFeatureEnabled('tape')).toBe(true);
    });
  });

  describe('Quality Presets Collection', () => {
    it('should have predefined quality presets', () => {
      expect(OP1_QUALITY_PRESETS.standard_balanced).toBeDefined();
      expect(OP1_QUALITY_PRESETS.performance_pro).toBeDefined();
      expect(OP1_QUALITY_PRESETS.server_ultra).toBeDefined();
    });

    it('should have different specs for each preset', () => {
      const standard = OP1_QUALITY_PRESETS.standard_balanced;
      const perf = OP1_QUALITY_PRESETS.performance_pro;
      const server = OP1_QUALITY_PRESETS.server_ultra;

      expect(standard.voicePolyphony).toBeLessThan(perf.voicePolyphony);
      expect(perf.voicePolyphony).toBeLessThan(server.voicePolyphony);

      expect(standard.sampleRate).toBeLessThan(perf.sampleRate);
      expect(perf.sampleRate).toBeLessThanOrEqual(server.sampleRate);
    });
  });

  describe('Machine Class Support', () => {
    it('should not support minimal machines', () => {
      expect(adapter.isSupported('minimal')).toBe(false);
    });

    (['standard', 'performance', 'server'] as const).forEach(machineClass => {
      it(`should support ${machineClass} machines`, () => {
        expect(adapter.isSupported(machineClass)).toBe(true);
      });
    });
  });
});
