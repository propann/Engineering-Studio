import { GameEngine, GameState, GameConfig, DifficultyLevel, QualityPreset, ResourceAllocation, createQualityPreset } from '@studio-hub/game-core';
import type { MachineClass } from '@studio-hub/machine-profiler';

export interface PuzzleState extends GameState {
  gridSize: number;
  tiles: number[];
  selectedTiles: number[];
  moves: number;
  matches: number;
  level: number;
}

export class PuzzleGameEngine implements GameEngine {
  private state: PuzzleState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    difficulty: 'normal',
    timeElapsed: 0,
    gridSize: 4,
    tiles: [],
    selectedTiles: [],
    moves: 0,
    matches: 0,
    level: 1,
  };
  private currentPreset?: QualityPreset;
  private moveLimit = 20;

  async initialize(): Promise<void> {
    this.state.isRunning = false;
    this.initializeGrid();
  }

  async shutdown(): Promise<void> {
    this.state.isRunning = false;
  }

  async start(): Promise<void> {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.moves = 0;
    this.state.matches = 0;
    this.initializeGrid();
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
      this.setDifficultySettings();
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
      name: 'puzzle-game',
      memory: this.currentPreset?.memoryUsageMB || 256,
      cpu: this.currentPreset?.cpuUsagePercent || 35,
      priority: 70,
    };
  }

  getResourceUsage(): ResourceAllocation {
    return {
      name: 'puzzle-game',
      memory: Math.round((this.getResourceRequirements().memory * 0.5)),
      cpu: Math.round((this.getResourceRequirements().cpu * 0.5)),
      priority: 70,
    };
  }

  tick(deltaMs: number): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.timeElapsed += deltaMs;

      // Check if out of moves
      if (this.state.moves >= this.moveLimit) {
        this.state.isRunning = false;
      }

      // Check win condition
      if (this.state.matches >= this.state.gridSize * this.state.gridSize / 2) {
        this.state.score += 500; // Bonus for completing level
        this.advanceLevel();
      }
    }
  }

  handleInput(input: string): void {
    if (!this.state.isRunning || this.state.moves >= this.moveLimit) return;

    if (input.startsWith('select-')) {
      const tileIndex = parseInt(input.split('-')[1]);
      this.selectTile(tileIndex);
    } else if (input === 'shuffle') {
      this.shuffleGrid();
      this.state.moves += 1;
    } else if (input === 'hint') {
      this.state.moves += 0.5; // Hint costs half a move
    }
  }

  getScore(): number {
    return this.state.score;
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    this.state.difficulty = difficulty;
    this.setDifficultySettings();
  }

  private setDifficultySettings(): void {
    switch (this.state.difficulty) {
      case 'easy':
        this.moveLimit = 30;
        this.state.gridSize = 3;
        break;
      case 'normal':
        this.moveLimit = 20;
        this.state.gridSize = 4;
        break;
      case 'hard':
        this.moveLimit = 15;
        this.state.gridSize = 5;
        break;
      case 'extreme':
        this.moveLimit = 10;
        this.state.gridSize = 6;
        break;
    }
  }

  private initializeGrid(): void {
    const size = this.state.gridSize * this.state.gridSize;
    this.state.tiles = Array.from({ length: size }, (_, i) => i % (size / 2));
    this.shuffleGrid();
  }

  private shuffleGrid(): void {
    for (let i = this.state.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.state.tiles[i], this.state.tiles[j]] = [this.state.tiles[j], this.state.tiles[i]];
    }
  }

  private selectTile(index: number): void {
    if (this.state.selectedTiles.includes(index)) {
      this.state.selectedTiles = this.state.selectedTiles.filter(i => i !== index);
      return;
    }

    this.state.selectedTiles.push(index);

    if (this.state.selectedTiles.length === 2) {
      this.checkMatch();
      this.state.moves += 1;
    }
  }

  private checkMatch(): void {
    const [index1, index2] = this.state.selectedTiles;
    if (this.state.tiles[index1] === this.state.tiles[index2]) {
      // Match found
      this.state.score += 10;
      this.state.matches += 1;
      this.state.tiles[index1] = -1;
      this.state.tiles[index2] = -1;
    }
    this.state.selectedTiles = [];
  }

  private advanceLevel(): void {
    this.state.level += 1;
    this.state.score += 100;
    this.state.matches = 0;
    this.state.moves = 0;
    this.initializeGrid();
  }

  getMoves(): number {
    return this.state.moves;
  }

  getMatches(): number {
    return this.state.matches;
  }

  getLevel(): number {
    return this.state.level;
  }
}

export function createPuzzleGame(): GameEngine {
  return new PuzzleGameEngine();
}
