/**
 * Resource Manager Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createResourceManager,
  createFromConfig,
  allocate,
  release,
  canAllocate,
  getAllocated,
  getAvailable,
  getUsage,
  getAllocationInfo,
  getAllAllocations,
  isResourceCritical,
  suggestFreeable,
  getSummary,
  subscribe,
} from './index';

describe('Resource Manager', () => {
  describe('createResourceManager & createFromConfig', () => {
    it('should create manager with budget', () => {
      const store = createResourceManager({
        memory: 2048,
        cpu: 60,
        cache: 200,
      });

      expect(store.budget.memory).toBe(2048);
      expect(store.budget.cpu).toBe(60);
      expect(store.allocations.size).toBe(0);
    });

    it('should create from config', () => {
      const store = createFromConfig({
        maxMemoryMB: 4096,
        maxCpuPercent: 80,
        cacheSize: 500,
      });

      expect(store.budget.memory).toBe(4096);
      expect(store.budget.cpu).toBe(80);
    });
  });

  describe('allocate & release', () => {
    it('should allocate resources', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      const result = allocate(store, 'audio', { memory: 512, cpu: 20 });

      expect(result).toBe(true);
      expect(store.allocations.size).toBe(1);
    });

    it('should reject allocation if insufficient memory', () => {
      const store = createResourceManager({ memory: 512, cpu: 60, cache: 200 });

      const result = allocate(store, 'heavy', { memory: 1024, cpu: 20 });

      expect(result).toBe(false);
      expect(store.allocations.size).toBe(0);
    });

    it('should reject allocation if insufficient cpu', () => {
      const store = createResourceManager({ memory: 2048, cpu: 30, cache: 200 });

      const result = allocate(store, 'cpu-heavy', { memory: 100, cpu: 60 });

      expect(result).toBe(false);
    });

    it('should release resources', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });
      expect(store.allocations.size).toBe(1);

      release(store, 'audio');
      expect(store.allocations.size).toBe(0);
    });

    it('should return false when releasing nonexistent allocation', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      const result = release(store, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('canAllocate', () => {
    it('should allow allocation if resources available', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      const result = canAllocate(store, { memory: 512, cpu: 20 });

      expect(result).toBe(true);
    });

    it('should deny allocation if insufficient memory', () => {
      const store = createResourceManager({ memory: 512, cpu: 60, cache: 200 });

      const result = canAllocate(store, { memory: 1024, cpu: 20 });

      expect(result).toBe(false);
    });

    it('should account for existing allocations', () => {
      const store = createResourceManager({ memory: 1024, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });
      const result = canAllocate(store, { memory: 512, cpu: 20 });

      expect(result).toBe(true);

      const result2 = canAllocate(store, { memory: 513, cpu: 20 });
      expect(result2).toBe(false);
    });
  });

  describe('getAllocated & getAvailable', () => {
    it('should report allocated resources', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });
      allocate(store, 'effects', { memory: 256, cpu: 10 });

      const allocated = getAllocated(store);

      expect(allocated.memory).toBe(768);
      expect(allocated.cpu).toBe(30);
    });

    it('should report available resources', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });

      const available = getAvailable(store);

      expect(available.memory).toBe(1536);
      expect(available.cpu).toBe(40);
    });
  });

  describe('getUsage', () => {
    it('should calculate utilization', () => {
      const store = createResourceManager({ memory: 1000, cpu: 100, cache: 200 });

      allocate(store, 'audio', { memory: 500, cpu: 50 });

      const usage = getUsage(store);

      expect(usage.allocated.memory).toBe(500);
      expect(usage.utilization.memory).toBe(50);
      expect(usage.utilization.cpu).toBe(50);
    });

    it('should cap utilization at 100%', () => {
      const store = createResourceManager({ memory: 1000, cpu: 100, cache: 200 });

      allocate(store, 'audio', { memory: 800, cpu: 80 });

      const usage = getUsage(store);

      expect(usage.utilization.memory).toBeLessThanOrEqual(100);
      expect(usage.utilization.cpu).toBeLessThanOrEqual(100);
    });
  });

  describe('getAllocationInfo & getAllAllocations', () => {
    it('should get allocation info', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 }, 100);

      const info = getAllocationInfo(store, 'audio');

      expect(info).toBeDefined();
      expect(info?.name).toBe('audio');
      expect(info?.memory).toBe(512);
      expect(info?.priority).toBe(100);
    });

    it('should get all allocations sorted by priority', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 100, cpu: 10 }, 50);
      allocate(store, 'effects', { memory: 100, cpu: 10 }, 100);

      const all = getAllAllocations(store);

      expect(all.length).toBe(2);
      expect(all[0].name).toBe('effects'); // Higher priority first
      expect(all[1].name).toBe('audio');
    });
  });

  describe('isResourceCritical', () => {
    it('should detect critical memory usage', () => {
      const store = createResourceManager({ memory: 1000, cpu: 100, cache: 200 });

      allocate(store, 'heavy', { memory: 950, cpu: 10 });

      expect(isResourceCritical(store, 90)).toBe(true);
    });

    it('should detect critical CPU usage', () => {
      const store = createResourceManager({ memory: 1000, cpu: 100, cache: 200 });

      allocate(store, 'compute', { memory: 10, cpu: 95 });

      expect(isResourceCritical(store, 90)).toBe(true);
    });

    it('should not report critical if below threshold', () => {
      const store = createResourceManager({ memory: 1000, cpu: 100, cache: 200 });

      allocate(store, 'light', { memory: 100, cpu: 30 });

      expect(isResourceCritical(store, 90)).toBe(false);
    });
  });

  describe('suggestFreeable', () => {
    it('should suggest low-priority allocations for release', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'core', { memory: 100, cpu: 10 }, 100);
      allocate(store, 'optional', { memory: 100, cpu: 10 }, 10);

      const freeable = suggestFreeable(store, 50);

      expect(freeable).toContain('optional');
      expect(freeable).not.toContain('core');
    });
  });

  describe('getSummary', () => {
    it('should generate resource summary', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });

      const summary = getSummary(store);

      expect(summary.budget).toBeDefined();
      expect(summary.allocated).toBeDefined();
      expect(summary.utilization).toBeDefined();
      expect(summary.allocations).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('should notify on allocation', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      const events: string[] = [];
      const unsubscribe = subscribe(store, event => {
        events.push(event.type);
      });

      allocate(store, 'audio', { memory: 512, cpu: 20 });

      expect(events).toContain('allocate');

      unsubscribe();
    });

    it('should notify on release', () => {
      const store = createResourceManager({ memory: 2048, cpu: 60, cache: 200 });

      allocate(store, 'audio', { memory: 512, cpu: 20 });

      const events: string[] = [];
      subscribe(store, event => {
        events.push(event.type);
      });

      release(store, 'audio');

      expect(events).toContain('release');
    });

    it('should notify on exceeded resources', () => {
      const store = createResourceManager({ memory: 512, cpu: 60, cache: 200 });

      const events: string[] = [];
      subscribe(store, event => {
        events.push(event.type);
      });

      allocate(store, 'heavy', { memory: 1024, cpu: 20 });

      expect(events).toContain('exceeded');
    });
  });
});
