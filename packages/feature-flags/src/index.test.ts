/**
 * Feature Flags Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createFlagsStore,
  initializeDefaultFlags,
  setupFlagsForMachine,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  toggleFeature,
  getEnabledFeatures,
  getFeatureInfo,
  getAllFeatures,
  subscribe,
  getStatistics,
  exportFlags,
  importFlags,
} from './index';

describe('Feature Flags', () => {
  describe('createFlagsStore & initializeDefaultFlags', () => {
    it('should create empty store', () => {
      const store = createFlagsStore();

      expect(store.flags.size).toBe(0);
      expect(store.listeners.size).toBe(0);
    });

    it('should initialize default flags', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      expect(store.flags.size).toBeGreaterThan(0);
      expect(store.flags.has('basicAudio')).toBe(true);
      expect(store.flags.has('advancedEffects')).toBe(true);
    });
  });

  describe('setupFlagsForMachine', () => {
    it('should enable basic features on minimal', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'minimal');

      expect(getFeatureInfo(store, 'basicAudio')?.enabled).toBe(true);
      expect(getFeatureInfo(store, 'effectsChain')?.enabled).toBe(false);
    });

    it('should enable standard features on standard', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'standard');

      expect(getFeatureInfo(store, 'effectsChain')?.enabled).toBe(true);
      expect(getFeatureInfo(store, 'advancedEffects')?.enabled).toBe(false);
    });

    it('should enable performance features on performance', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'performance');

      expect(getFeatureInfo(store, 'advancedEffects')?.enabled).toBe(true);
      expect(getFeatureInfo(store, 'multiUserSupport')?.enabled).toBe(false);
    });

    it('should enable all features on server', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'server');

      expect(getFeatureInfo(store, 'advancedEffects')?.enabled).toBe(true);
      expect(getFeatureInfo(store, 'multiUserSupport')?.enabled).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled feature', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      expect(isFeatureEnabled(store, 'basicAudio')).toBe(true);
    });

    it('should return false for missing feature', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      expect(isFeatureEnabled(store, 'nonexistent')).toBe(false);
    });

    it('should respect feature dependencies', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'performance');

      // advancedEffects depends on effectsChain
      disableFeature(store, 'effectsChain');

      expect(isFeatureEnabled(store, 'advancedEffects')).toBe(false);
    });
  });

  describe('enableFeature / disableFeature', () => {
    it('should enable feature', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'minimal');

      disableFeature(store, 'basicAudio');
      expect(getFeatureInfo(store, 'basicAudio')?.enabled).toBe(false);

      enableFeature(store, 'basicAudio');
      expect(getFeatureInfo(store, 'basicAudio')?.enabled).toBe(true);
    });

    it('should disable feature', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      expect(getFeatureInfo(store, 'basicAudio')?.enabled).toBe(true);

      disableFeature(store, 'basicAudio');
      expect(getFeatureInfo(store, 'basicAudio')?.enabled).toBe(false);
    });
  });

  describe('toggleFeature', () => {
    it('should toggle feature state', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      const initialState = getFeatureInfo(store, 'basicAudio')?.enabled;
      toggleFeature(store, 'basicAudio');
      const newState = getFeatureInfo(store, 'basicAudio')?.enabled;

      expect(newState).not.toBe(initialState);
    });
  });

  describe('subscribe & listeners', () => {
    it('should notify listeners on change', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      const calls: Array<[string, boolean, string]> = [];
      const unsubscribe = subscribe(store, (flag, enabled, reason) => {
        calls.push([flag, enabled, reason]);
      });

      disableFeature(store, 'basicAudio', 'test-reason');

      expect(calls.length).toBe(1);
      expect(calls[0]).toEqual(['basicAudio', false, 'test-reason']);

      unsubscribe();
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return list of enabled features', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'standard');

      const enabled = getEnabledFeatures(store);

      expect(enabled).toContain('basicAudio');
      expect(enabled).toContain('effectsChain');
      expect(enabled.length).toBeGreaterThan(0);
    });

    it('should exclude disabled features', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'minimal');

      const enabled = getEnabledFeatures(store);

      expect(enabled).not.toContain('advancedEffects');
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'standard');

      const stats = getStatistics(store);

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled).toBeGreaterThan(0);
      expect(stats.percentage).toBeGreaterThan(0);
      expect(stats.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('exportFlags / importFlags', () => {
    it('should export and import configuration', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);
      setupFlagsForMachine(store, 'performance');

      const exported = exportFlags(store);
      expect(exported.basicAudio).toBe(true);

      const store2 = createFlagsStore();
      initializeDefaultFlags(store2);
      importFlags(store2, exported);

      const exported2 = exportFlags(store2);
      expect(exported2).toEqual(exported);
    });
  });

  describe('getFeatureInfo / getAllFeatures', () => {
    it('should get feature info', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      const info = getFeatureInfo(store, 'basicAudio');
      expect(info).toBeDefined();
      expect(info?.name).toBe('basicAudio');
    });

    it('should get all features', () => {
      const store = createFlagsStore();
      initializeDefaultFlags(store);

      const all = getAllFeatures(store);
      expect(all.length).toBeGreaterThan(0);
      expect(all[0].name).toBeDefined();
    });
  });
});
