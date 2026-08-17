/**
 * Machine Profiler Tests
 */

import { describe, it, expect } from 'vitest';
import {
  detectMachine,
  getRecommendedConfig,
  MachineClass,
} from './index';

describe('Machine Profiler', () => {
  describe('detectMachine', () => {
    it('should detect machine profile', async () => {
      const profile = await detectMachine();

      expect(profile).toBeDefined();
      expect(profile.cpu).toBeDefined();
      expect(profile.cpu.cores).toBeGreaterThan(0);
      expect(profile.cpu.threads).toBeGreaterThan(0);
      expect(profile.cpu.speed).toBeGreaterThan(0);
    });

    it('should detect memory info', async () => {
      const profile = await detectMachine();

      expect(profile.memory).toBeDefined();
      expect(profile.memory.total).toBeGreaterThan(0);
      expect(profile.memory.available).toBeGreaterThan(0);
    });

    it('should detect storage info', async () => {
      const profile = await detectMachine();

      expect(profile.storage).toBeDefined();
      expect(profile.storage.total).toBeGreaterThan(0);
      expect(profile.storage.available).toBeGreaterThan(0);
    });

    it('should detect platform', async () => {
      const profile = await detectMachine();

      expect(profile.platform).toMatch(/darwin|linux|win32|unknown/);
    });

    it('should classify machine', async () => {
      const profile = await detectMachine();

      expect(['minimal', 'standard', 'performance', 'server']).toContain(
        profile.machineClass
      );
    });

    it('should have timestamp', async () => {
      const profile = await detectMachine();

      expect(profile.timestamp).toBeGreaterThan(0);
      expect(profile.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getRecommendedConfig', () => {
    describe('minimal machine', () => {
      it('should return minimal config', () => {
        const config = getRecommendedConfig('minimal');

        expect(config.maxMemoryMB).toBeLessThanOrEqual(512);
        expect(config.maxCpuPercent).toBeLessThanOrEqual(30);
        expect(config.audioQuality).toBe(22050);
      });
    });

    describe('standard machine', () => {
      it('should return standard config', () => {
        const config = getRecommendedConfig('standard');

        expect(config.maxMemoryMB).toBe(2048);
        expect(config.maxCpuPercent).toBe(60);
        expect(config.audioQuality).toBe(44100);
      });
    });

    describe('performance machine', () => {
      it('should return performance config', () => {
        const config = getRecommendedConfig('performance');

        expect(config.maxMemoryMB).toBe(8192);
        expect(config.maxCpuPercent).toBe(80);
        expect(config.audioQuality).toBe(48000);
      });
    });

    describe('server machine', () => {
      it('should return server config', () => {
        const config = getRecommendedConfig('server');

        expect(config.maxMemoryMB).toBe(16384);
        expect(config.maxCpuPercent).toBe(90);
        expect(config.audioQuality).toBe(96000);
      });
    });

    it('should return correct graphics levels', () => {
      expect(getRecommendedConfig('minimal').graphics).toBe('minimal');
      expect(getRecommendedConfig('standard').graphics).toBe('standard');
      expect(getRecommendedConfig('performance').graphics).toBe('high');
      expect(getRecommendedConfig('server').graphics).toBe('ultra');
    });
  });
});
