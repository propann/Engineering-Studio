import { describe, it, expect } from 'vitest';
import {
  createTestConfig,
  createMachineClassFixtures,
  assertApproximate,
  createTestResourceBudget,
  createTestArray,
  measureTime,
  measureTimeAsync,
  createMockCapabilities,
  waitFor,
  deepFreeze,
} from './index';

describe('Testing Utilities', () => {
  it('should create test config', () => {
    const config = createTestConfig('standard');
    expect(config).toBeDefined();
    expect(config.machineClass).toBe('standard');
  });

  it('should create fixtures for all machine classes', () => {
    const fixtures = createMachineClassFixtures();

    expect(fixtures.minimal).toBeDefined();
    expect(fixtures.standard).toBeDefined();
    expect(fixtures.performance).toBeDefined();
    expect(fixtures.server).toBeDefined();
    expect(fixtures.all).toHaveLength(4);
  });

  it('should assert approximate equality', () => {
    expect(() => assertApproximate(1.0, 1.001, 0.01)).not.toThrow();
    expect(() => assertApproximate(1.0, 1.5, 0.01)).toThrow();
  });

  it('should create resource budgets', () => {
    const budget = createTestResourceBudget('standard');

    expect(budget.memory).toBe(2048);
    expect(budget.cpu).toBe(100);
    expect(budget.cache).toBe(200);
  });

  it('should create test arrays', () => {
    const arr = createTestArray(5, i => i * 2);

    expect(arr).toHaveLength(5);
    expect(arr[0]).toBe(0);
    expect(arr[4]).toBe(8);
  });

  it('should measure execution time', () => {
    const time = measureTime(() => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
    });

    expect(time).toBeGreaterThan(0);
  });

  it('should measure async execution time', async () => {
    const time = await measureTimeAsync(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(time).toBeGreaterThanOrEqual(40); // Allow some timing variance
  });

  it('should create mock capabilities', () => {
    const caps = createMockCapabilities();

    expect(caps.name).toBe('Mock Adapter');
    expect(caps.maxVoicesPerClass.standard).toBe(4);
  });

  it('should support capability overrides', () => {
    const caps = createMockCapabilities({ name: 'Custom' });

    expect(caps.name).toBe('Custom');
  });

  it('should wait for condition', async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 50);

    await waitFor(() => ready, 1000);
    expect(ready).toBe(true);
  });

  it('should deep freeze objects', () => {
    const obj = { a: { b: 1 } };
    const frozen = deepFreeze(obj);

    // Object should be frozen (no error in non-strict mode)
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
  });
});
