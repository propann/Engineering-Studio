import { GameEngine, GameState, GameConfig, DifficultyLevel, QualityPreset, ResourceAllocation, createQualityPreset } from '@studio-hub/game-core';
import type { MachineClass } from '@studio-hub/machine-profiler';

export interface PlatformerState extends GameState {
  playerX: number;
  playerY: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  lives: number;
  level: number;
}

export class PlatformerGameEngine implements GameEngine {
  private state: PlatformerState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    difficulty: 'normal',
    timeElapsed: 0,
    playerX: 0,
    playerY: 100,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    lives: 3,
    level: 1,
  };
  private currentPreset?: QualityPreset;
  private gravity = 9.8;

  async initialize(): Promise<void> {
    this.state.isRunning = false;
    this.resetPlayerPosition();
  }

  async shutdown(): Promise<void> {
    this.state.isRunning = false;
  }

  async start(): Promise<void> {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.resetPlayerPosition();
  }

  async pause(): Promise<void> {
    this.state.isPaused = true;
  }

  async resume(): Promise<void> {
    this.state.isPaused = false;
  }

  async stop(): Promise<void> {
    this.state.isRunning = false;
  }

  getState(): GameState {
    return { ...this.state };
  }

  configure(config: GameConfig): void {
    if (config.difficulty) {
      this.state.difficulty = config.difficulty;
    }
    if (config.quality) {
      this.currentPreset = config.quality;
    }
  }

  getQualityPreset(machineClass: MachineClass): QualityPreset {
    return createQualityPreset(machineClass, {
      fps: machineClass === 'minimal' ? 30 : machineClass === 'standard' ? 60 : 120,
    });
  }

  setQualityPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
  }

  getResourceRequirements(): ResourceAllocation {
    return {
      name: 'platformer-game',
      memory: this.currentPreset?.memoryUsageMB || 256,
      cpu: this.currentPreset?.cpuUsagePercent || 45,
      priority: 70,
    };
  }

  getResourceUsage(): ResourceAllocation {
    return {
      name: 'platformer-game',
      memory: Math.round((this.getResourceRequirements().memory * 0.65)),
      cpu: Math.round((this.getResourceRequirements().cpu * 0.65)),
      priority: 70,
    };
  }

  tick(deltaMs: number): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.timeElapsed += deltaMs;

      // Apply gravity
      this.state.velocityY += this.gravity * (deltaMs / 1000);

      // Update position
      this.state.playerX += this.state.velocityX;
      this.state.playerY += this.state.velocityY;

      // Platform collision (simplified)
      if (this.state.playerY >= 100) {
        this.state.playerY = 100;
        this.state.velocityY = 0;
        this.state.isJumping = false;
      }

      // Boundary check
      if (this.state.playerX < 0) this.state.playerX = 0;
      if (this.state.playerX > 800) this.state.playerX = 800;

      // Fall detection (lose life)
      if (this.state.playerY > 600) {
        this.state.lives -= 1;
        this.resetPlayerPosition();
        if (this.state.lives <= 0) {
          this.state.isRunning = false;
        }
      }
    }
  }

  handleInput(input: string): void {
    if (!this.state.isRunning) return;

    switch (input) {
      case 'jump':
        if (!this.state.isJumping && this.state.playerY >= 100) {
          this.state.velocityY = -15;
          this.state.isJumping = true;
          this.state.score += 5;
        }
        break;
      case 'left':
        this.state.velocityX = -5;
        break;
      case 'right':
        this.state.velocityX = 5;
        break;
      case 'stop':
        this.state.velocityX = 0;
        break;
    }
  }

  getScore(): number {
    return this.state.score;
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    this.state.difficulty = difficulty;
    // Adjust gravity based on difficulty
    this.gravity = difficulty === 'easy' ? 7.0 : difficulty === 'normal' ? 9.8 : difficulty === 'hard' ? 12.0 : 15.0;
  }

  private resetPlayerPosition(): void {
    this.state.playerX = 400;
    this.state.playerY = 100;
    this.state.velocityX = 0;
    this.state.velocityY = 0;
    this.state.isJumping = false;
  }

  getLives(): number {
    return this.state.lives;
  }

  getLevel(): number {
    return this.state.level;
  }

  advanceLevel(): void {
    this.state.level += 1;
    this.state.score += 100;
    this.resetPlayerPosition();
  }
}

export function createPlatformerGame(): GameEngine {
  return new PlatformerGameEngine();
}
