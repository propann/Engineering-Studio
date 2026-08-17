import { GameEngine, GameState, GameConfig, DifficultyLevel, QualityPreset, ResourceAllocation, createQualityPreset } from '@studio-hub/game-core';
import type { MachineClass } from '@studio-hub/machine-profiler';

export class RhythmGameEngine implements GameEngine {
  private state: GameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    difficulty: 'normal',
    timeElapsed: 0,
  };
  private currentPreset?: QualityPreset;
  private bpm = 120;

  async initialize(): Promise<void> {
    this.state.isRunning = false;
  }

  async shutdown(): Promise<void> {
    this.state.isRunning = false;
  }

  async start(): Promise<void> {
    this.state.isRunning = true;
    this.state.isPaused = false;
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
      name: 'rhythm-game',
      memory: this.currentPreset?.memoryUsageMB || 256,
      cpu: this.currentPreset?.cpuUsagePercent || 40,
      priority: 70,
    };
  }

  getResourceUsage(): ResourceAllocation {
    return {
      name: 'rhythm-game',
      memory: Math.round((this.getResourceRequirements().memory * 0.6)),
      cpu: Math.round((this.getResourceRequirements().cpu * 0.6)),
      priority: 70,
    };
  }

  tick(deltaMs: number): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.timeElapsed += deltaMs;
    }
  }

  handleInput(input: string): void {
    if (input === 'hit' && this.state.isRunning) {
      this.state.score += 10;
    }
  }

  getScore(): number {
    return this.state.score;
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    this.state.difficulty = difficulty;
    this.bpm = difficulty === 'easy' ? 80 : difficulty === 'normal' ? 120 : difficulty === 'hard' ? 150 : 180;
  }
}

export function createRhythmGame(): GameEngine {
  return new RhythmGameEngine();
}
