/**
 * Config Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultConfig,
  getDefaultFeatures,
  mergeConfigs,
  validateConfig,
  optimizeConfigForConstraints,
  exportConfig,
  importConfig,
  getConfigSummary,
} from './index';

describe('Config Engine', () => {
  describe('createDefaultConfig', () => {
    it('should create minimal config', () => {
      const config = createDefaultConfig('test-app', 'minimal');

      expect(config.appName).toBe('test-app');
      expect(config.machineClass).toBe('minimal');
      expect(config.maxMemoryMB).toBe(512);
      expect(config.audioQuality).toBe(22050);
    });

    it('should create standard config', () => {
      const config = createDefaultConfig('test-app', 'standard');

      expect(config.maxMemoryMB).toBe(2048);
      expect(config.maxCpuPercent).toBe(60);
      expect(config.audioQuality).toBe(44100);
    });

    it('should create performance config', () => {
      const config = createDefaultConfig('test-app', 'performance');

      expect(config.maxMemoryMB).toBe(8192);
      expect(config.audioQuality).toBe(48000);
    });

    it('should create server config', () => {
      const config = createDefaultConfig('test-app', 'server');

      expect(config.maxMemoryMB).toBe(16384);
      expect(config.maxCpuPercent).toBe(90);
    });
  });

  describe('getDefaultFeatures', () => {
    it('should enable basic features on minimal', () => {
      const features = getDefaultFeatures('minimal');

      expect(features.basicAudio).toBe(true);
      expect(features.fileOperations).toBe(true);
      expect(features.effectsChain).toBe(false);
    });

    it('should enable standard features on standard', () => {
      const features = getDefaultFeatures('standard');

      expect(features.effectsChain).toBe(true);
      expect(features.advancedEffects).toBe(false);
    });

    it('should enable advanced features on performance', () => {
      const features = getDefaultFeatures('performance');

      expect(features.advancedEffects).toBe(true);
      expect(features.thirdPartyPlugins).toBe(true);
    });

    it('should enable all features on server', () => {
      const features = getDefaultFeatures('server');

      expect(features.multiUserSupport).toBe(true);
      expect(features.analyticsCollection).toBe(true);
      expect(features.automaticBackup).toBe(true);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge user config with defaults', () => {
      const defaults = createDefaultConfig('app', 'standard');
      const user = { maxMemoryMB: 4096, appName: 'custom-app' };

      const merged = mergeConfigs(defaults, user);

      expect(merged.appName).toBe('custom-app');
      expect(merged.maxMemoryMB).toBe(4096);
      expect(merged.machineClass).toBe('standard'); // From defaults
    });

    it('should merge feature flags', () => {
      const defaults = createDefaultConfig('app', 'standard');
      const user = { features: { basicAudio: false, advancedEffects: true } };

      const merged = mergeConfigs(defaults, user);

      expect(merged.features.basicAudio).toBe(false);
      expect(merged.features.advancedEffects).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = createDefaultConfig('app', 'standard');
      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid memory', () => {
      const config = createDefaultConfig('app', 'standard');
      config.maxMemoryMB = 50;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid CPU', () => {
      const config = createDefaultConfig('app', 'standard');
      config.maxCpuPercent = 150;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });
  });

  describe('optimizeConfigForConstraints', () => {
    it('should reduce memory if constrained', () => {
      const config = createDefaultConfig('app', 'standard');
      const optimized = optimizeConfigForConstraints(config, { maxMemory: 512 });

      expect(optimized.maxMemoryMB).toBe(512);
      expect(optimized.cacheSize).toBeLessThanOrEqual(512);
    });

    it('should reduce CPU if constrained', () => {
      const config = createDefaultConfig('app', 'standard');
      const optimized = optimizeConfigForConstraints(config, { maxCpuPercent: 30 });

      expect(optimized.maxCpuPercent).toBe(30);
    });

    it('should switch to memory storage for network-only', () => {
      const config = createDefaultConfig('app', 'standard');
      const optimized = optimizeConfigForConstraints(config, { networkOnly: true });

      expect(optimized.storage.type).toBe('memory');
      expect(optimized.logging.enableRemote).toBe(true);
    });
  });

  describe('exportConfig / importConfig', () => {
    it('should export and re-import config', () => {
      const config = createDefaultConfig('test-app', 'performance');
      const json = exportConfig(config);
      const reimported = importConfig(json);

      expect(reimported.appName).toBe(config.appName);
      expect(reimported.machineClass).toBe(config.machineClass);
      expect(reimported.maxMemoryMB).toBe(config.maxMemoryMB);
    });

    it('should throw on invalid JSON', () => {
      expect(() => importConfig('invalid json')).toThrow();
    });
  });

  describe('getConfigSummary', () => {
    it('should generate summary', () => {
      const config = createDefaultConfig('app', 'standard');
      const summary = getConfigSummary(config);

      expect(summary.app).toBe('app');
      expect(summary.machine).toBe('standard');
      expect(summary.memory).toBe('2048MB');
      expect(summary.cpu).toBe('60%');
    });
  });
});
