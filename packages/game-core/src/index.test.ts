import { describe, it, expect } from 'vitest';
import { createGameRegistry, getGamesSupportedForMachine, createQualityPreset, validateGameForMachine } from './index';
import type { GameEngine, MachineClass } from './index';

function createMockGame(name: string, minClass: MachineClass = 'standard'): GameEngine {
  return {
    initialize: async () => {},
    shutdown: async () => {},
    start: async () => {},
    pause: async () => {},
    resume: async () => {},
    stop: async () => {},
    getState: () => ({ isRunning: false, isPaused: false, score: 0, difficulty: 'normal', timeElapsed: 0 }),
    configure: () => {},
    getQualityPreset: (mc) => createQualityPreset(mc),
    setQualityPreset: () => {},
    getResourceRequirements: () => ({ name, memory: 256, cpu: 40, priority: 50 }),
    getResourceUsage: () => ({ name, memory: 100, cpu: 20, priority: 50 }),
    tick: () => {},
    handleInput: () => {},
    getScore: () => 0,
    setDifficulty: () => {},
  };
}

describe('Game Core', () => {
  it('should create game registry', () => {
    const registry = createGameRegistry();
    expect(registry.games.size).toBe(0);
  });

  it('should register and list games', () => {
    const registry = createGameRegistry();
    registry.registerGame('rhythm', createMockGame('rhythm'));
    expect(registry.listGames()).toContain('rhythm');
  });

  it('should create quality presets', () => {
    const preset = createQualityPreset('standard');
    expect(preset.fps).toBe(60);
    expect(preset.machineClass).toBe('standard');
  });

  it('should validate games for machine', () => {
    const game = createMockGame('test');
    const result = validateGameForMachine(game, 'standard', 2048, 60);
    expect(result.valid).toBe(true);
  });

  it('should find games for resources', () => {
    const registry = createGameRegistry();
    registry.registerGame('rhythm', createMockGame('rhythm'));
    const games = getGamesSupportedForMachine(registry, 'standard');
    expect(games).toContain('rhythm');
  });
});
