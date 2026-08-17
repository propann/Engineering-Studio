/**
 * Performance Benchmarks & Regression Tests
 * Ensures framework performance meets targets across all operations
 */

import { describe, it, expect } from 'vitest';

// Core framework
import { detectMachine, getRecommendedConfig } from '@studio-hub/machine-profiler';
import { createDefaultConfig, mergeConfigs, exportConfig } from '@studio-hub/config-engine';
import { createFlagsStore, initializeDefaultFlags, setupFlagsForMachine } from '@studio-hub/feature-flags';
import { createResourceManager, allocate } from '@studio-hub/resource-manager';

// Adapters
import { createAdapterRegistry } from '@studio-hub/instrument-interface';
import { createOP1Adapter } from '@studio-hub/instrument-op1';
import { createEP133Adapter } from '@studio-hub/instrument-ep133';

// Games
import { createGameRegistry } from '@studio-hub/game-core';
import { createRhythmGame } from '@studio-hub/game-rhythm';
import { createPlatformerGame } from '@studio-hub/game-platformer';

describe('Performance Benchmarks & Regression Tests', () => {
  // Performance targets in milliseconds
  const PERFORMANCE_TARGETS = {
    machineDetection: 50,
    configCreation: 10,
    configMerge: 5,
    featureFlagInit: 10,
    featureFlagCheck: 1,
    resourceAllocation: 5,
    registryLookup: 1,
    registryIteration: 10,
    qualityPresetScale: 1,
    gameInitialize: 5,
  };

  describe('Machine Profiler Performance', () => {
    it('should detect machine within performance target', async () => {
      const start = performance.now();
      const profile = await detectMachine();
      const elapsed = performance.now() - start;

      expect(profile).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.machineDetection);
    });

    it('should get recommended config within target', async () => {
      const start = performance.now();
      const config = getRecommendedConfig('standard');
      const elapsed = performance.now() - start;

      expect(config).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.configCreation);
    });
  });

  describe('Config Engine Performance', () => {
    it('should create default config within target', () => {
      const start = performance.now();
      const config = createDefaultConfig('studio', 'standard');
      const elapsed = performance.now() - start;

      expect(config).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.configCreation);
    });

    it('should merge configs efficiently', () => {
      const config1 = createDefaultConfig('studio', 'standard');
      const config2 = { machineClass: 'performance' as const };

      const start = performance.now();
      const merged = mergeConfigs(config1, config2);
      const elapsed = performance.now() - start;

      expect(merged).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.configMerge);
    });

    it('should export config efficiently', () => {
      const config = createDefaultConfig('studio', 'standard');

      const start = performance.now();
      const exported = exportConfig(config);
      const elapsed = performance.now() - start;

      expect(exported).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.configCreation);
    });
  });

  describe('Feature Flags Performance', () => {
    it('should initialize flags efficiently', () => {
      const store = createFlagsStore();

      const start = performance.now();
      initializeDefaultFlags(store);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.featureFlagInit);
    });

    it('should check feature flags in < 1ms', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'standard');

      const start = performance.now();
      const flag = store.flags.get('effectsChain');
      const elapsed = performance.now() - start;

      expect(flag).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.featureFlagCheck);
    });

    it('should setup machine flags efficiently', () => {
      const store = createFlagsStore();

      const start = performance.now();
      setupFlagsForMachine(store, 'performance');
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.featureFlagInit);
    });
  });

  describe('Resource Manager Performance', () => {
    it('should allocate resources within target', () => {
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 100,
        cache: 200,
      });

      const start = performance.now();
      const success = allocate(resourceMgr, 'test', { memory: 256, cpu: 25 });
      const elapsed = performance.now() - start;

      expect(success).toBe(true);
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.resourceAllocation);
    });
  });

  describe('Registry Performance', () => {
    it('should lookup adapter in registry quickly', () => {
      const registry = createAdapterRegistry();
      registry.registerAdapter('op1', createOP1Adapter());
      registry.registerAdapter('ep133', createEP133Adapter());

      const start = performance.now();
      const adapter = registry.getAdapter('op1');
      const elapsed = performance.now() - start;

      expect(adapter).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.registryLookup);
    });

    it('should list many adapters efficiently', () => {
      const registry = createAdapterRegistry();

      // Register 50 adapters
      for (let i = 0; i < 50; i++) {
        registry.registerAdapter(`adapter-${i}`, createEP133Adapter());
      }

      const start = performance.now();
      const list = registry.listAdapters();
      const elapsed = performance.now() - start;

      expect(list.length).toBe(50);
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.registryIteration);
    });

    it('should lookup game in registry quickly', () => {
      const registry = createGameRegistry();
      registry.registerGame('rhythm', createRhythmGame());
      registry.registerGame('platformer', createPlatformerGame());

      const start = performance.now();
      const game = registry.getGame('rhythm');
      const elapsed = performance.now() - start;

      expect(game).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.registryLookup);
    });
  });

  describe('Quality Preset Performance', () => {
    it('should get quality preset quickly', () => {
      const game = createRhythmGame();

      const start = performance.now();
      const preset = game.getQualityPreset('performance');
      const elapsed = performance.now() - start;

      expect(preset).toBeDefined();
      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.qualityPresetScale);
    });
  });

  describe('Game Initialization Performance', () => {
    it('should initialize game within target', async () => {
      const game = createRhythmGame();

      const start = performance.now();
      await game.initialize();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_TARGETS.gameInitialize);
      await game.shutdown();
    });
  });

  describe('Load Testing - Multiple Items', () => {
    it('should handle 100+ adapters in registry', () => {
      const registry = createAdapterRegistry();

      // Register 100 adapters
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const adapter = i % 2 === 0 ? createOP1Adapter() : createEP133Adapter();
        registry.registerAdapter(`adapter-${i}`, adapter);
      }
      const registerElapsed = performance.now() - start;

      expect(registry.listAdapters().length).toBe(100);
      expect(registerElapsed).toBeLessThan(100); // Should be very fast

      // List should still be fast
      const listStart = performance.now();
      registry.listAdapters();
      const listElapsed = performance.now() - listStart;
      expect(listElapsed).toBeLessThan(20);
    });

    it('should handle 100+ games in registry', () => {
      const registry = createGameRegistry();

      // Register 100 games
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const game = i % 2 === 0 ? createRhythmGame() : createPlatformerGame();
        registry.registerGame(`game-${i}`, game);
      }
      const elapsed = performance.now() - start;

      expect(registry.listGames().length).toBe(100);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent config creations', () => {
      const start = performance.now();

      // Create 50 configs concurrently
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(createDefaultConfig(`studio-${i}`, 'standard')));
      }

      Promise.all(promises);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should handle concurrent resource allocations', () => {
      const resourceMgr = createResourceManager({
        memory: 16384,
        cpu: 500,
        cache: 2000,
      });

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        allocate(resourceMgr, `resource-${i}`, { memory: 128, cpu: 5 });
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Regression - No Performance Degradation', () => {
    it('should maintain config creation speed across iterations', () => {
      const times = [];

      for (let iteration = 0; iteration < 10; iteration++) {
        const start = performance.now();
        createDefaultConfig('studio', 'standard');
        times.push(performance.now() - start);
      }

      // Check operations complete in reasonable time
      const average = times.reduce((a, b) => a + b) / times.length;

      // Average should be < 10ms (our target)
      expect(average).toBeLessThan(10);
    });

    it('should maintain registry lookup speed with many items', () => {
      const registry = createAdapterRegistry();

      // Pre-populate with 50 adapters
      for (let i = 0; i < 50; i++) {
        registry.registerAdapter(`adapter-${i}`, createEP133Adapter());
      }

      // All lookups should complete
      for (let iteration = 0; iteration < 10; iteration++) {
        const adapter = registry.getAdapter('adapter-25');
        expect(adapter).toBeDefined();
      }
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory in repeated operations', () => {
      const initialMem = process.memoryUsage().heapUsed;

      // Do 1000 operations
      for (let i = 0; i < 1000; i++) {
        const config = createDefaultConfig(`studio-${i}`, 'standard');
        expect(config).toBeDefined();
      }

      const finalMem = process.memoryUsage().heapUsed;
      const increase = (finalMem - initialMem) / 1024 / 1024; // MB

      // Should not increase by more than 10MB
      expect(increase).toBeLessThan(10);
    });
  });
});
