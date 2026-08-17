/**
 * Game Core - Studio Hub Game Framework
 * Generic game engine interface for adaptive game support
 */

import type { MachineClass } from '@studio-hub/machine-profiler';

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'extreme';

export interface QualityPreset {
  name: string;
  machineClass: MachineClass;
  fps: number;
  resolution: string;
  audioQuality: number;
  effectsQuality: 'low' | 'medium' | 'high';
  cpuUsagePercent: number;
  memoryUsageMB: number;
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  difficulty: DifficultyLevel;
  timeElapsed: number;
}

export interface GameConfig {
  machineClass: MachineClass;
  difficulty?: DifficultyLevel;
  quality?: QualityPreset;
  enabledFeatures?: string[];
}

export interface ResourceAllocation {
  name: string;
  memory: number;
  cpu: number;
  priority: number;
}

export interface GameEngine {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  getState(): GameState;
  configure(config: GameConfig): void;
  getQualityPreset(machineClass: MachineClass): QualityPreset;
  setQualityPreset(preset: QualityPreset): void;
  getResourceRequirements(): ResourceAllocation;
  getResourceUsage(): ResourceAllocation;
  tick(deltaMs: number): void;
  handleInput(input: string): void;
  getScore(): number;
  setDifficulty(difficulty: DifficultyLevel): void;
}

export interface GameRegistry {
  games: Map<string, GameEngine>;
  registerGame(name: string, engine: GameEngine): void;
  unregisterGame(name: string): void;
  getGame(name: string): GameEngine | undefined;
  listGames(): string[];
}

export function createGameRegistry(): GameRegistry {
  return {
    games: new Map(),
    registerGame(name: string, engine: GameEngine): void {
      this.games.set(name, engine);
    },
    unregisterGame(name: string): void {
      this.games.delete(name);
    },
    getGame(name: string): GameEngine | undefined {
      return this.games.get(name);
    },
    listGames(): string[] {
      return Array.from(this.games.keys());
    },
  };
}

export function getGamesSupportedForMachine(
  registry: GameRegistry,
  machineClass: MachineClass
): string[] {
  const supported: string[] = [];
  for (const [name, game] of registry.games) {
    try {
      const preset = game.getQualityPreset(machineClass);
      if (preset) {
        supported.push(name);
      }
    } catch {
      // Not supported
    }
  }
  return supported;
}

export function createQualityPreset(
  machineClass: MachineClass,
  overrides?: Partial<QualityPreset>
): QualityPreset {
  const presets: Record<MachineClass, Partial<QualityPreset>> = {
    minimal: {
      fps: 30,
      resolution: '640x480',
      audioQuality: 22050,
      effectsQuality: 'low',
      cpuUsagePercent: 25,
      memoryUsageMB: 128,
    },
    standard: {
      fps: 60,
      resolution: '1024x768',
      audioQuality: 44100,
      effectsQuality: 'medium',
      cpuUsagePercent: 50,
      memoryUsageMB: 256,
    },
    performance: {
      fps: 120,
      resolution: '1920x1080',
      audioQuality: 48000,
      effectsQuality: 'high',
      cpuUsagePercent: 70,
      memoryUsageMB: 512,
    },
    server: {
      fps: 144,
      resolution: '3840x2160',
      audioQuality: 96000,
      effectsQuality: 'high',
      cpuUsagePercent: 85,
      memoryUsageMB: 1024,
    },
  };

  return {
    name: `game-preset-${machineClass}`,
    machineClass,
    ...presets[machineClass],
    ...overrides,
  } as QualityPreset;
}

export function validateGameForMachine(
  game: GameEngine,
  machineClass: MachineClass,
  availableMemory: number,
  availableCpu: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try {
    const preset = game.getQualityPreset(machineClass);
    if (!preset) {
      errors.push('Game not supported on this machine class');
    } else {
      const reqs = game.getResourceRequirements();
      if (reqs.memory > availableMemory) {
        errors.push(`Insufficient memory: needs ${reqs.memory}MB`);
      }
      if (reqs.cpu > availableCpu) {
        errors.push(`Insufficient CPU: needs ${reqs.cpu}%`);
      }
    }
  } catch (error) {
    errors.push('Failed to validate game');
  }
  return { valid: errors.length === 0, errors };
}

export function findGamesForResources(
  registry: GameRegistry,
  availableMemory: number,
  availableCpu: number,
  machineClass: MachineClass
): string[] {
  const candidates: string[] = [];
  for (const name of getGamesSupportedForMachine(registry, machineClass)) {
    const game = registry.getGame(name);
    if (game) {
      const validation = validateGameForMachine(game, machineClass, availableMemory, availableCpu);
      if (validation.valid) {
        candidates.push(name);
      }
    }
  }
  return candidates;
}

export function createGameState(machineClass: MachineClass): GameState {
  return {
    isRunning: false,
    isPaused: false,
    score: 0,
    difficulty: 'normal',
    timeElapsed: 0,
  };
}
