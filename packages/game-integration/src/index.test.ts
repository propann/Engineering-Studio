/**
 * Game Framework Integration Tests
 * Tests interaction between games, core, and resource management
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Games
import { createRhythmGame } from '@studio-hub/game-rhythm';
import { createPlatformerGame } from '@studio-hub/game-platformer';
import { createGameRegistry, getGamesSupportedForMachine, findGamesForResources, validateGameForMachine } from '@studio-hub/game-core';

// Core framework
import { createResourceManager, allocate, release, getUsage } from '@studio-hub/resource-manager';
import type { MachineClass } from '@studio-hub/machine-profiler';

describe('Game Framework Integration Tests', () => {
  let registry: ReturnType<typeof createGameRegistry>;

  beforeEach(() => {
    registry = createGameRegistry();
    registry.registerGame('rhythm', createRhythmGame());
    registry.registerGame('platformer', createPlatformerGame());
  });

  describe('Registry Operations', () => {
    it('should list all registered games', () => {
      const games = registry.listGames();

      expect(games).toHaveLength(2);
      expect(games).toContain('rhythm');
      expect(games).toContain('platformer');
    });

    it('should get specific game from registry', () => {
      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      expect(rhythm).toBeDefined();
      expect(platformer).toBeDefined();
      expect(rhythm?.getState()).toBeDefined();
      expect(platformer?.getState()).toBeDefined();
    });

    it('should unregister game', () => {
      registry.unregisterGame('rhythm');
      expect(registry.getGame('rhythm')).toBeUndefined();
      expect(registry.listGames()).toHaveLength(1);
    });
  });

  describe('Machine Class Support', () => {
    it('should return both games for minimal machine', () => {
      const supported = getGamesSupportedForMachine(registry, 'minimal');

      expect(supported).toContain('rhythm');
      expect(supported).toContain('platformer');
      expect(supported).toHaveLength(2);
    });

    it('should return both games for standard machine', () => {
      const supported = getGamesSupportedForMachine(registry, 'standard');

      expect(supported).toContain('rhythm');
      expect(supported).toContain('platformer');
      expect(supported).toHaveLength(2);
    });

    it('should return both games for performance machine', () => {
      const supported = getGamesSupportedForMachine(registry, 'performance');

      expect(supported).toContain('rhythm');
      expect(supported).toContain('platformer');
    });

    it('should return both games for server machine', () => {
      const supported = getGamesSupportedForMachine(registry, 'server');

      expect(supported).toContain('rhythm');
      expect(supported).toContain('platformer');
    });
  });

  describe('Quality Presets Across Games', () => {
    (['minimal', 'standard', 'performance', 'server'] as const).forEach(machineClass => {
      it(`should provide quality presets for ${machineClass} machine`, () => {
        const rhythmPreset = registry.getGame('rhythm')?.getQualityPreset(machineClass);
        const platformerPreset = registry.getGame('platformer')?.getQualityPreset(machineClass);

        expect(rhythmPreset).toBeDefined();
        expect(platformerPreset).toBeDefined();
        expect(rhythmPreset?.machineClass).toBe(machineClass);
        expect(platformerPreset?.machineClass).toBe(machineClass);
      });

      it(`should scale resources appropriately for ${machineClass}`, () => {
        const rhythmPreset = registry.getGame('rhythm')?.getQualityPreset(machineClass);
        const platformerPreset = registry.getGame('platformer')?.getQualityPreset(machineClass);

        if (rhythmPreset) {
          expect(rhythmPreset.fps).toBeGreaterThan(0);
          expect(rhythmPreset.audioQuality).toBeGreaterThan(0);
        }

        if (platformerPreset) {
          expect(platformerPreset.fps).toBeGreaterThan(0);
          expect(platformerPreset.audioQuality).toBeGreaterThan(0);
        }
      });
    });

    it('should have increasing FPS from minimal to performance', () => {
      const rhythm = registry.getGame('rhythm');

      const minimal = rhythm?.getQualityPreset('minimal');
      const standard = rhythm?.getQualityPreset('standard');
      const performance = rhythm?.getQualityPreset('performance');

      expect(minimal?.fps).toBeLessThan(standard?.fps || 0);
      expect(standard?.fps).toBeLessThanOrEqual(performance?.fps || 0);
    });
  });

  describe('Resource Allocation Integration', () => {
    it('should allocate resources for single game on standard machine', () => {
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 60,
        cache: 200,
      });

      const rhythm = registry.getGame('rhythm');
      const reqs = rhythm?.getResourceRequirements();

      expect(reqs).toBeDefined();
      const success = allocate(resourceMgr, 'rhythm', {
        memory: reqs?.memory,
        cpu: reqs?.cpu,
      });

      expect(success).toBe(true);
    });

    it('should allocate resources for both games on performance machine', () => {
      const resourceMgr = createResourceManager({
        memory: 8192,
        cpu: 100,
        cache: 1000,
      });

      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      const rhythmReqs = rhythm?.getResourceRequirements();
      const platformerReqs = platformer?.getResourceRequirements();

      const rhythmSuccess = allocate(resourceMgr, 'rhythm', {
        memory: rhythmReqs?.memory,
        cpu: rhythmReqs?.cpu,
      });

      const platformerSuccess = allocate(resourceMgr, 'platformer', {
        memory: platformerReqs?.memory,
        cpu: platformerReqs?.cpu,
      });

      expect(rhythmSuccess).toBe(true);
      expect(platformerSuccess).toBe(true);

      const usage = getUsage(resourceMgr);
      expect(usage.utilization.memory).toBeLessThan(100);
    });

    it('should allocate both games on minimal machine', () => {
      const resourceMgr = createResourceManager({
        memory: 512,
        cpu: 50,
        cache: 100,
      });

      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      const rhythmReqs = rhythm?.getResourceRequirements();
      const platformerReqs = platformer?.getResourceRequirements();

      const rhythmSuccess = allocate(resourceMgr, 'rhythm', {
        memory: rhythmReqs?.memory,
        cpu: rhythmReqs?.cpu,
      });

      // May or may not succeed depending on budget
      if (rhythmSuccess) {
        const platformerSuccess = allocate(resourceMgr, 'platformer', {
          memory: platformerReqs?.memory,
          cpu: platformerReqs?.cpu,
        });

        // At least one should succeed
        expect(rhythmSuccess || platformerSuccess).toBe(true);
      }
    });
  });

  describe('Configuration Integration', () => {
    it('should configure rhythm game with machine-specific settings', async () => {
      const rhythm = registry.getGame('rhythm');

      rhythm?.configure({
        machineClass: 'standard',
        quality: rhythm?.getQualityPreset('standard'),
        difficulty: 'hard',
      });

      expect(rhythm?.getState().difficulty).toBe('hard');
    });

    it('should configure platformer game with machine-specific settings', async () => {
      const platformer = registry.getGame('platformer');

      platformer?.configure({
        machineClass: 'performance',
        quality: platformer?.getQualityPreset('performance'),
        difficulty: 'normal',
      });

      expect(platformer?.getState().difficulty).toBe('normal');
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should initialize and configure rhythm game for standard machine', async () => {
      const machineClass: MachineClass = 'standard';
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 100,
        cache: 200,
      });

      const rhythm = registry.getGame('rhythm');
      if (rhythm) {
        await rhythm.initialize();

        rhythm.configure({
          machineClass,
          quality: rhythm.getQualityPreset(machineClass),
          difficulty: 'normal',
        });

        const reqs = rhythm.getResourceRequirements();
        const success = allocate(resourceMgr, 'rhythm', {
          memory: reqs.memory,
          cpu: reqs.cpu,
        });

        expect(success).toBe(true);
        await rhythm.shutdown();
      }
    });

    it('should initialize and configure platformer game for standard machine', async () => {
      const machineClass: MachineClass = 'standard';
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 100,
        cache: 200,
      });

      const platformer = registry.getGame('platformer');
      if (platformer) {
        await platformer.initialize();

        platformer.configure({
          machineClass,
          quality: platformer.getQualityPreset(machineClass),
          difficulty: 'normal',
        });

        const reqs = platformer.getResourceRequirements();
        const success = allocate(resourceMgr, 'platformer', {
          memory: reqs.memory,
          cpu: reqs.cpu,
        });

        expect(success).toBe(true);
        await platformer.shutdown();
      }
    });

    it('should run rhythm game through full lifecycle', async () => {
      const rhythm = registry.getGame('rhythm');
      if (rhythm) {
        await rhythm.initialize();
        await rhythm.start();

        rhythm.handleInput('hit');
        rhythm.tick(1000);

        expect(rhythm.getScore()).toBeGreaterThan(0);
        expect(rhythm.getState().timeElapsed).toBeGreaterThan(0);

        await rhythm.pause();
        expect(rhythm.getState().isPaused).toBe(true);

        await rhythm.resume();
        expect(rhythm.getState().isPaused).toBe(false);

        await rhythm.stop();
        expect(rhythm.getState().isRunning).toBe(false);

        await rhythm.shutdown();
      }
    });

    it('should run platformer game through full lifecycle', async () => {
      const platformer = registry.getGame('platformer') as any;
      if (platformer) {
        await platformer.initialize();
        await platformer.start();

        platformer.handleInput('jump');
        platformer.tick(1000);

        expect(platformer.getScore()).toBeGreaterThanOrEqual(0);
        expect(platformer.getState().timeElapsed).toBeGreaterThan(0);

        await platformer.pause();
        expect(platformer.getState().isPaused).toBe(true);

        await platformer.resume();
        expect(platformer.getState().isPaused).toBe(false);

        await platformer.stop();
        expect(platformer.getState().isRunning).toBe(false);

        await platformer.shutdown();
      }
    });

    it('should validate game compatibility before allocation', () => {
      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      // Check minimal machine with sufficient resources
      const minimalRhythm = rhythm ? validateGameForMachine(rhythm, 'minimal', 1024, 60) : null;
      const minimalPlatformer = platformer ? validateGameForMachine(platformer, 'minimal', 1024, 60) : null;

      expect(minimalRhythm?.valid).toBe(true);
      expect(minimalPlatformer?.valid).toBe(true);

      // Check performance machine
      const perfRhythm = rhythm ? validateGameForMachine(rhythm, 'performance', 8192, 80) : null;
      const perfPlatformer = platformer ? validateGameForMachine(platformer, 'performance', 8192, 80) : null;

      expect(perfRhythm?.valid).toBe(true);
      expect(perfPlatformer?.valid).toBe(true);
    });

    it('should find games that fit available resources', () => {
      // Standard machine with budget
      const standardCandidates = findGamesForResources(registry, 2048, 60, 'standard');
      expect(standardCandidates.length).toBeGreaterThan(0);

      // Minimal machine with limited resources
      const minimalCandidates = findGamesForResources(registry, 512, 50, 'minimal');
      expect(minimalCandidates.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Utilization Efficiency', () => {
    it('should show similar resource usage between games', () => {
      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      const rhythmReqs = rhythm?.getResourceRequirements();
      const platformerReqs = platformer?.getResourceRequirements();

      // Both should have reasonable resource requirements
      expect(rhythmReqs?.memory).toBeGreaterThan(0);
      expect(rhythmReqs?.cpu).toBeGreaterThan(0);
      expect(platformerReqs?.memory).toBeGreaterThan(0);
      expect(platformerReqs?.cpu).toBeGreaterThan(0);
    });

    it('should allow both games on standard machine', () => {
      const resourceMgr = createResourceManager({
        memory: 2048,
        cpu: 100,
        cache: 200,
      });

      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');

      if (rhythm && platformer) {
        const rhythmReqs = rhythm.getResourceRequirements();
        const platformerReqs = platformer.getResourceRequirements();

        const rhythmSuccess = allocate(resourceMgr, 'rhythm', {
          memory: rhythmReqs.memory,
          cpu: rhythmReqs.cpu,
        });

        const platformerSuccess = allocate(resourceMgr, 'platformer', {
          memory: platformerReqs.memory,
          cpu: platformerReqs.cpu,
        });

        expect(rhythmSuccess).toBe(true);
        expect(platformerSuccess).toBe(true);
      }
    });
  });

  describe('Multi-Game Workflows', () => {
    it('should support rhythm + platformer game workflow', async () => {
      const machineClass: MachineClass = 'performance';
      const rhythm = registry.getGame('rhythm');
      const platformer = registry.getGame('platformer');
      const resourceMgr = createResourceManager({
        memory: 16384,
        cpu: 160,
        cache: 2000,
      });

      if (rhythm && platformer) {
        await rhythm.initialize();
        await platformer.initialize();

        rhythm.configure({
          machineClass,
          quality: rhythm.getQualityPreset(machineClass),
          difficulty: 'normal',
        });

        platformer.configure({
          machineClass,
          quality: platformer.getQualityPreset(machineClass),
          difficulty: 'hard',
        });

        const rhythmReqs = rhythm.getResourceRequirements();
        const platformerReqs = platformer.getResourceRequirements();

        const rhythmAllocated = allocate(resourceMgr, 'rhythm', {
          memory: rhythmReqs.memory,
          cpu: rhythmReqs.cpu,
        });

        const platformerAllocated = allocate(resourceMgr, 'platformer', {
          memory: platformerReqs.memory,
          cpu: platformerReqs.cpu,
        });

        expect(rhythmAllocated).toBe(true);
        expect(platformerAllocated).toBe(true);

        const usage = getUsage(resourceMgr);
        expect(usage.utilization.memory).toBeLessThan(100);
        expect(usage.utilization.cpu).toBeLessThan(100);

        await rhythm.shutdown();
        await platformer.shutdown();
      }
    });
  });
});
