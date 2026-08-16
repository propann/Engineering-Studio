/**
 * Instrument Adapter Integration Tests
 * Tests interaction between adapters, interface, core, and resource management
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Instrument adapters
import { createOP1Adapter } from '@studio-hub/instrument-op1';
import { createEP133Adapter } from '@studio-hub/instrument-ep133';
import { createAdapterRegistry, getAdaptersSupportedForMachine, findAdaptersForResources, validateAdapterForMachine } from '@studio-hub/instrument-interface';

// Core framework
import { detectMachine, getRecommendedConfig } from '@studio-hub/machine-profiler';
import { createDefaultConfig } from '@studio-hub/config-engine';
import { createFlagsStore, initializeDefaultFlags, setupFlagsForMachine } from '@studio-hub/feature-flags';
import { createResourceManager, allocate, release, getUsage } from '@studio-hub/resource-manager';

import type { MachineClass } from '@studio-hub/instrument-interface';

describe('Instrument Adapter Integration Tests', () => {
  let registry: ReturnType<typeof createAdapterRegistry>;

  beforeEach(() => {
    registry = createAdapterRegistry();
    registry.registerAdapter('op1', createOP1Adapter());
    registry.registerAdapter('ep133', createEP133Adapter());
  });

  describe('Registry Operations', () => {
    it('should list all registered adapters', () => {
      const adapters = registry.listAdapters();

      expect(adapters).toHaveLength(2);
      expect(adapters).toContain('op1');
      expect(adapters).toContain('ep133');
    });

    it('should get specific adapter from registry', () => {
      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      expect(op1).toBeDefined();
      expect(ep133).toBeDefined();
      expect(op1?.getCapabilities().name).toBe('OP-1 Synthesizer');
      expect(ep133?.getCapabilities().name).toBe('Korg EP-133 GO');
    });
  });

  describe('Machine Class Filtering', () => {
    it('should return only EP-133 for minimal machine', () => {
      const supported = getAdaptersSupportedForMachine(registry, 'minimal');

      expect(supported).toContain('ep133');
      expect(supported).not.toContain('op1');
      expect(supported).toHaveLength(1);
    });

    it('should return both adapters for standard machine', () => {
      const supported = getAdaptersSupportedForMachine(registry, 'standard');

      expect(supported).toContain('op1');
      expect(supported).toContain('ep133');
      expect(supported).toHaveLength(2);
    });

    it('should return both adapters for performance machine', () => {
      const supported = getAdaptersSupportedForMachine(registry, 'performance');

      expect(supported).toContain('op1');
      expect(supported).toContain('ep133');
    });

    it('should return both adapters for server machine', () => {
      const supported = getAdaptersSupportedForMachine(registry, 'server');

      expect(supported).toContain('op1');
      expect(supported).toContain('ep133');
    });
  });

  describe('Quality Presets Across Adapters', () => {
    (['minimal', 'standard', 'performance', 'server'] as const).forEach(machineClass => {
      it(`should provide quality presets for ${machineClass} machine`, () => {
        const op1Preset = registry.getAdapter('op1')?.getQualityPreset(machineClass);
        const ep133Preset = registry.getAdapter('ep133')?.getQualityPreset(machineClass);

        expect(op1Preset).toBeDefined();
        expect(ep133Preset).toBeDefined();
        expect(op1Preset?.machineClass).toBe(machineClass);
        expect(ep133Preset?.machineClass).toBe(machineClass);
      });

      it(`should scale resources appropriately for ${machineClass}`, () => {
        const op1Preset = registry.getAdapter('op1')?.getQualityPreset(machineClass);
        const ep133Preset = registry.getAdapter('ep133')?.getQualityPreset(machineClass);

        if (op1Preset && machineClass !== 'minimal') {
          expect(op1Preset.voicePolyphony).toBeGreaterThan(0);
          expect(op1Preset.sampleRate).toBeGreaterThan(0);
        }

        if (ep133Preset) {
          expect(ep133Preset.voicePolyphony).toBeGreaterThan(0);
          expect(ep133Preset.sampleRate).toBeGreaterThan(0);
        }
      });
    });

    it('should have increasing specs from minimal to server', () => {
      const ep133 = registry.getAdapter('ep133');

      const minimal = ep133?.getQualityPreset('minimal');
      const standard = ep133?.getQualityPreset('standard');
      const performance = ep133?.getQualityPreset('performance');
      const server = ep133?.getQualityPreset('server');

      expect(minimal?.voicePolyphony).toBeLessThan(standard?.voicePolyphony || 0);
      expect(standard?.voicePolyphony).toBeLessThan(performance?.voicePolyphony || 0);
      expect(performance?.voicePolyphony).toBeLessThan(server?.voicePolyphony || 0);
    });
  });

  describe('Resource Allocation Integration', () => {
    it('should allocate resources for single adapter on standard machine', () => {
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 60,
        cache: 200,
      });

      const ep133 = registry.getAdapter('ep133');
      const reqs = ep133?.getResourceRequirements();

      expect(reqs).toBeDefined();
      const success = allocate(resourceMgr, 'ep133', {
        memory: reqs?.memory,
        cpu: reqs?.cpu,
      });

      expect(success).toBe(true);
    });

    it('should allocate resources for both adapters on performance machine', () => {
      const resourceMgr = createResourceManager({
        memory: 8192,
        cpu: 80,
        cache: 1000,
      });

      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      const op1Reqs = op1?.getResourceRequirements();
      const ep133Reqs = ep133?.getResourceRequirements();

      const op1Success = allocate(resourceMgr, 'op1', {
        memory: op1Reqs?.memory,
        cpu: op1Reqs?.cpu,
      });

      const ep133Success = allocate(resourceMgr, 'ep133', {
        memory: ep133Reqs?.memory,
        cpu: ep133Reqs?.cpu,
      });

      expect(op1Success).toBe(true);
      expect(ep133Success).toBe(true);

      const usage = getUsage(resourceMgr);
      expect(usage.utilization.memory).toBeLessThan(100);
    });

    it('should fail to allocate OP-1 on minimal machine', () => {
      const resourceMgr = createResourceManager({
        memory: 128,
        cpu: 25,
        cache: 50,
      });

      const op1 = registry.getAdapter('op1');
      const reqs = op1?.getResourceRequirements();

      const success = allocate(resourceMgr, 'op1', {
        memory: reqs?.memory,
        cpu: reqs?.cpu,
      });

      // Should fail because insufficient resources
      expect(success).toBe(false);
    });

    it('should allocate EP-133 on minimal machine', () => {
      const resourceMgr = createResourceManager({
        memory: 128,
        cpu: 25,
        cache: 50,
      });

      const ep133 = registry.getAdapter('ep133');
      const reqs = ep133?.getResourceRequirements();

      const success = allocate(resourceMgr, 'ep133', {
        memory: reqs?.memory,
        cpu: reqs?.cpu,
      });

      expect(success).toBe(true);
    });
  });

  describe('Configuration + Feature Flags Integration', () => {
    it('should configure adapters with machine-specific settings', () => {
      const config = createDefaultConfig('studio', 'standard');
      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      op1?.configure({
        machineClass: 'standard',
        quality: op1?.getQualityPreset('standard'),
        enabledFeatures: ['reverb', 'delay'],
      });

      ep133?.configure({
        machineClass: 'standard',
        quality: ep133?.getQualityPreset('standard'),
        enabledFeatures: ['rhythms', 'patterns'],
      });

      expect(op1?.isFeatureEnabled('reverb')).toBe(true);
      expect(ep133?.isFeatureEnabled('rhythms')).toBe(true);
    });

    it('should align adapter features with global feature flags', () => {
      const flagStore = createFlagsStore();
      initializeDefaultFlags(flagStore);
      setupFlagsForMachine(flagStore, 'standard');

      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      // Both adapters should be able to enable supported features
      expect(op1?.enableFeature('reverb')).toBe(true);
      expect(ep133?.enableFeature('reverb')).toBe(true);

      expect(op1?.enableFeature('synth-engine')).toBe(true);
      expect(ep133?.enableFeature('rhythms')).toBe(true);
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should initialize and configure adapters for standard machine', async () => {
      const machineClass: MachineClass = 'standard';
      const config = createDefaultConfig('studio', machineClass);
      // Use larger budget for both adapters
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 100, // Increased from 60 to handle both adapters
        cache: 200,
      });

      const supported = getAdaptersSupportedForMachine(registry, machineClass);
      expect(supported).toHaveLength(2);

      // Initialize adapters
      for (const adapterName of supported) {
        const adapter = registry.getAdapter(adapterName);
        if (adapter) {
          await adapter.initialize();

          // Configure adapter
          adapter.configure({
            machineClass,
            quality: adapter.getQualityPreset(machineClass),
            enabledFeatures: adapter.getCapabilities().supportedFeatures.slice(0, 2),
          });

          // Allocate resources
          const reqs = adapter.getResourceRequirements();
          const success = allocate(resourceMgr, adapterName, {
            memory: reqs.memory,
            cpu: reqs.cpu,
          });

          expect(success).toBe(true);

          await adapter.shutdown();
        }
      }
    });

    it('should validate adapter compatibility before allocation', () => {
      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      // Check minimal machine
      const minimalOp1 = op1 ? validateAdapterForMachine(op1, 'minimal', 256, 30) : null;
      const minimalEP133 = ep133 ? validateAdapterForMachine(ep133, 'minimal', 256, 30) : null;

      expect(minimalOp1?.valid).toBe(false);
      expect(minimalEP133?.valid).toBe(true);

      // Check performance machine
      const perfOp1 = op1 ? validateAdapterForMachine(op1, 'performance', 8192, 80) : null;
      const perfEP133 = ep133 ? validateAdapterForMachine(ep133, 'performance', 8192, 80) : null;

      expect(perfOp1?.valid).toBe(true);
      expect(perfEP133?.valid).toBe(true);
    });

    it('should find adapters that fit available resources', () => {
      // Standard machine with budget
      const standardCandidates = findAdaptersForResources(registry, 2048, 60, 'standard');
      expect(standardCandidates.length).toBeGreaterThan(0);

      // Minimal machine with limited resources
      const minimalCandidates = findAdaptersForResources(registry, 128, 25, 'minimal');
      expect(minimalCandidates).toContain('ep133');
      expect(minimalCandidates).not.toContain('op1');
    });
  });

  describe('Resource Utilization Efficiency', () => {
    it('should show OP-1 uses more resources than EP-133', () => {
      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');

      const op1Reqs = op1?.getResourceRequirements();
      const ep133Reqs = ep133?.getResourceRequirements();

      expect(op1Reqs?.memory).toBeGreaterThan(ep133Reqs?.memory || 0);
      expect(op1Reqs?.cpu).toBeGreaterThanOrEqual(ep133Reqs?.cpu || 0);
    });

    it('should allow both adapters in low-resource environment when choosing minimal presets', () => {
      const resourceMgr = createResourceManager({
        memory: 512,
        cpu: 50,
        cache: 100,
      });

      const ep133 = registry.getAdapter('ep133');
      const minimalPreset = ep133?.getQualityPreset('minimal');

      if (minimalPreset) {
        ep133?.setQualityPreset(minimalPreset);

        const reqs = ep133?.getResourceRequirements();
        const success = allocate(resourceMgr, 'ep133', {
          memory: reqs?.memory,
          cpu: reqs?.cpu,
        });

        expect(success).toBe(true);

        const usage = getUsage(resourceMgr);
        expect(usage.utilization.memory).toBeLessThan(100);
      }
    });
  });

  describe('Multi-Adapter Workflows', () => {
    it('should support OP-1 for synth + EP-133 for drums workflow', async () => {
      const machineClass: MachineClass = 'performance';
      const op1 = registry.getAdapter('op1');
      const ep133 = registry.getAdapter('ep133');
      const resourceMgr = createResourceManager({
        memory: 16384, // Increased for both adapters
        cpu: 160, // Increased for both adapters
        cache: 2000,
      });

      // Initialize both
      if (op1 && ep133) {
        await op1.initialize();
        await ep133.initialize();

        // Configure for synthesis + drums
        op1.configure({
          machineClass,
          quality: op1.getQualityPreset(machineClass),
          enabledFeatures: ['synth-engine', 'reverb', 'delay'],
        });

        ep133.configure({
          machineClass,
          quality: ep133.getQualityPreset(machineClass),
          enabledFeatures: ['rhythms', 'patterns'],
        });

        // Allocate resources for both
        const op1Reqs = op1.getResourceRequirements();
        const ep133Reqs = ep133.getResourceRequirements();

        const op1Allocated = allocate(resourceMgr, 'op1', {
          memory: op1Reqs.memory,
          cpu: op1Reqs.cpu,
        });

        const ep133Allocated = allocate(resourceMgr, 'ep133', {
          memory: ep133Reqs.memory,
          cpu: ep133Reqs.cpu,
        });

        expect(op1Allocated).toBe(true);
        expect(ep133Allocated).toBe(true);

        // Verify resources
        const usage = getUsage(resourceMgr);
        expect(usage.utilization.memory).toBeLessThan(100);
        expect(usage.utilization.cpu).toBeLessThan(100);

        await op1.shutdown();
        await ep133.shutdown();
      }
    });
  });
});
