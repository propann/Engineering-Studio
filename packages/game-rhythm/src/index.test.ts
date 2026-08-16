import { describe, it, expect } from 'vitest';
import { RhythmGameEngine, createRhythmGame } from './index';

describe('Rhythm Game', () => {
  it('should initialize', async () => {
    const game = createRhythmGame();
    await game.initialize();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should start and stop', async () => {
    const game = createRhythmGame();
    await game.start();
    expect(game.getState().isRunning).toBe(true);
    await game.stop();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should handle pause/resume', async () => {
    const game = createRhythmGame();
    await game.start();
    await game.pause();
    expect(game.getState().isPaused).toBe(true);
    await game.resume();
    expect(game.getState().isPaused).toBe(false);
  });

  it('should update score on input', async () => {
    const game = createRhythmGame();
    await game.start();
    game.handleInput('hit');
    expect(game.getScore()).toBe(10);
  });

  it('should track time', () => {
    const game = createRhythmGame();
    game.tick(1000);
    // Paused by default, so no time increase
    expect(game.getState().timeElapsed).toBe(0);
  });

  it('should set difficulty', () => {
    const game = createRhythmGame();
    game.setDifficulty('hard');
    expect(game.getState().difficulty).toBe('hard');
  });

  it('should provide quality presets', () => {
    const game = createRhythmGame();
    const preset = game.getQualityPreset('performance');
    expect(preset.fps).toBeGreaterThan(0);
  });

  it('should report resources', () => {
    const game = createRhythmGame();
    const reqs = game.getResourceRequirements();
    expect(reqs.memory).toBeGreaterThan(0);
    expect(reqs.cpu).toBeGreaterThan(0);
  });
});
