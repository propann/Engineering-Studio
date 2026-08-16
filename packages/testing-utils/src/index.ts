/**
 * Testing Utilities - Fixtures and helpers for Studio Hub tests
 */

import { createDefaultConfig } from '@studio-hub/config-engine';
import type { MachineClass } from '@studio-hub/machine-profiler';

/**
 * Create test config for a machine class
 */
export function createTestConfig(machineClass: MachineClass = 'standard') {
  return createDefaultConfig('test-studio', machineClass);
}

/**
 * Create test fixture for all machine classes
 */
export function createMachineClassFixtures() {
  const classes: MachineClass[] = ['minimal', 'standard', 'performance', 'server'];
  return {
    minimal: createTestConfig('minimal'),
    standard: createTestConfig('standard'),
    performance: createTestConfig('performance'),
    server: createTestConfig('server'),
    all: classes.map(cls => createTestConfig(cls)),
  };
}

/**
 * Assert approximate equality
 */
export function assertApproximate(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`Expected ${expected} ±${tolerance}, got ${actual}`);
  }
}

/**
 * Create mock resource budget
 */
export function createTestResourceBudget(machineClass: MachineClass) {
  const budgets = {
    minimal: { memory: 256, cpu: 25, cache: 50 },
    standard: { memory: 2048, cpu: 100, cache: 200 },
    performance: { memory: 8192, cpu: 200, cache: 1000 },
    server: { memory: 16384, cpu: 400, cache: 2000 },
  };
  return budgets[machineClass];
}

/**
 * Create array of test data
 */
export function createTestArray<T>(length: number, factory: (i: number) => T): T[] {
  return Array.from({ length }, (_, i) => factory(i));
}

/**
 * Measure execution time
 */
export function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

/**
 * Measure async execution time
 */
export async function measureTimeAsync(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/**
 * Create mock adapter capabilities
 */
export function createMockCapabilities(overrides: any = {}) {
  return {
    name: 'Mock Adapter',
    vendor: 'Test',
    version: '1.0.0',
    minMachineClass: 'minimal' as const,
    requiredMemoryMB: 64,
    requiredCpuPercent: 10,
    maxVoicesPerClass: {
      minimal: 1,
      standard: 4,
      performance: 16,
      server: 32,
    },
    supportedAudioFormats: ['wav', 'ogg'],
    supportedFeatures: ['test'],
    hasBuiltInEffects: false,
    midiCapabilities: {
      inputSupported: true,
      outputSupported: true,
      ccControlled: false,
    },
    ...overrides,
  };
}

/**
 * Wait for condition
 */
export async function waitFor(condition: () => boolean, timeoutMs: number = 1000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Deep freeze object for immutability testing
 */
export function deepFreeze(obj: any): any {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}
