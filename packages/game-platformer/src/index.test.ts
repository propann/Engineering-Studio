import { describe, it, expect } from 'vitest';
import { PlatformerGameEngine, createPlatformerGame } from './index';

describe('Platformer Game', () => {
  it('should initialize', async () => {
    const game = createPlatformerGame();
    await game.initialize();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should start and stop', async () => {
    const game = createPlatformerGame();
    await game.start();
    expect(game.getState().isRunning).toBe(true);
    await game.stop();
    expect(game.getState().isRunning).toBe(false);
  });

  it('should handle pause/resume', async () => {
    const game = createPlatformerGame();
    await game.start();
    await game.pause();
    expect(game.getState().isPaused).toBe(true);
    await game.resume();
    expect(game.getState().isPaused).toBe(false);
  });

  it('should start with 3 lives', async () => {
    const game = createPlatformerGame() as any;
    await game.initialize();
    expect(game.getLives()).toBe(3);
  });

  it('should start at level 1', async () => {
    const game = createPlatformerGame() as any;
    await game.initialize();
    expect(game.getLevel()).toBe(1);
  });

  it('should handle jump input', async () => {
    const game = createPlatformerGame() as any;
    await game.start();
    const beforeJump = (game.getState() as any).velocityY;
    game.handleInput('jump');
    const afterJump = (game.getState() as any).velocityY;
    expect(afterJump).toBeLessThan(beforeJump);
    expect(game.getScore()).toBe(5);
  });

  it('should handle left/right movement', async () => {
    const game = createPlatformerGame() as any;
    await game.start();
    const beforeX = (game.getState() as any).playerX;
    game.handleInput('right');
    game.tick(100);
    const afterX = (game.getState() as any).playerX;
    expect(afterX).toBeGreaterThan(beforeX);
  });

  it('should apply gravity over time', async () => {
    const game = createPlatformerGame() as any;
    await game.start();
    game.handleInput('jump');
    const beforeGravity = (game.getState() as any).velocityY;
    game.tick(100);
    const afterGravity = (game.getState() as any).velocityY;
    expect(afterGravity).toBeGreaterThan(beforeGravity);
  });

  it('should track time elapsed', () => {
    const game = createPlatformerGame();
    game.tick(1000);
    // Paused by default, so no time increase
    expect(game.getState().timeElapsed).toBe(0);
  });

  it('should set difficulty', () => {
    const game = createPlatformerGame();
    game.setDifficulty('hard');
    expect(game.getState().difficulty).toBe('hard');
  });

  it('should provide quality presets', () => {
    const game = createPlatformerGame();
    const preset = game.getQualityPreset('performance');
    expect(preset.fps).toBeGreaterThan(0);
  });

  it('should report resources', () => {
    const game = createPlatformerGame();
    const reqs = game.getResourceRequirements();
    expect(reqs.memory).toBeGreaterThan(0);
    expect(reqs.cpu).toBeGreaterThan(0);
  });

  it('should advance level', async () => {
    const game = createPlatformerGame() as any;
    await game.initialize();
    const initialLevel = game.getLevel();
    game.advanceLevel();
    expect(game.getLevel()).toBe(initialLevel + 1);
  });

  it('should stop movement when stop input received', async () => {
    const game = createPlatformerGame() as any;
    await game.start();
    game.handleInput('right');
    game.handleInput('stop');
    expect((game.getState() as any).velocityX).toBe(0);
  });
});
