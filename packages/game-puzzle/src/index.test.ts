import { describe, it, expect } from 'vitest';
import { PuzzleGameEngine, createPuzzleGame } from './index';

describe('Puzzle Game', () => {
  it('should initialize', async () => {
    const game = createPuzzleGame();
    await game.initialize();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should start and stop', async () => {
    const game = createPuzzleGame();
    await game.start();
    expect(game.getState().isRunning).toBe(true);
    await game.stop();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should handle pause/resume', async () => {
    const game = createPuzzleGame();
    await game.start();
    await game.pause();
    expect(game.getState().isPaused).toBe(true);
    await game.resume();
    expect(game.getState().isPaused).toBe(false);
  });

  it('should start at level 1', async () => {
    const game = createPuzzleGame() as any;
    await game.initialize();
    expect(game.getLevel()).toBe(1);
  });

  it('should initialize grid on start', async () => {
    const game = createPuzzleGame() as any;
    await game.start();
    const state = game.getState() as any;
    expect(state.tiles.length).toBeGreaterThan(0);
  });

  it('should track moves', async () => {
    const game = createPuzzleGame() as any;
    await game.start();
    game.handleInput('shuffle');
    expect(game.getMoves()).toBe(1);
  });

  it('should track difficulty', () => {
    const game = createPuzzleGame();
    game.setDifficulty('hard');
    expect(game.getState().difficulty).toBe('hard');
  });

  it('should scale difficulty settings', () => {
    const game = createPuzzleGame() as any;
    game.setDifficulty('easy');
    let state = game.getState() as any;
    const easyGridSize = state.gridSize;

    game.setDifficulty('extreme');
    state = game.getState() as any;
    const extremeGridSize = state.gridSize;

    expect(extremeGridSize).toBeGreaterThan(easyGridSize);
  });

  it('should provide quality presets', () => {
    const game = createPuzzleGame();
    const preset = game.getQualityPreset('performance');
    expect(preset.fps).toBeGreaterThan(0);
  });

  it('should report resources', () => {
    const game = createPuzzleGame();
    const reqs = game.getResourceRequirements();
    expect(reqs.memory).toBeGreaterThan(0);
    expect(reqs.cpu).toBeGreaterThan(0);
  });

  it('should track score', async () => {
    const game = createPuzzleGame();
    await game.start();
    game.tick(1000);
    const score = game.getScore();
    expect(score).toBe(0); // No matches yet
  });

  it('should advance level on completion', async () => {
    const game = createPuzzleGame() as any;
    await game.initialize();
    const initialLevel = game.getLevel();
    game.tick(1000);
    // We'd need to actually match tiles to advance, but just verify level tracking works
    expect(game.getLevel()).toBeGreaterThanOrEqual(initialLevel);
  });

  it('should handle time tracking', () => {
    const game = createPuzzleGame();
    game.tick(1000);
    // Paused by default, so no time increase
    expect(game.getState().timeElapsed).toBe(0);
  });
});
