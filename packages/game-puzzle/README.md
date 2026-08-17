# 🧩 @studio-hub/game-puzzle

Puzzle game implementation for Studio Hub adaptive game framework. Tile-matching puzzle game with adaptive difficulty and grid sizing.

## Features

- 🎯 **Tile Matching**: Classic memory/match-the-pair gameplay
- 🎚️ **Adaptive Difficulty**: Easy (3x3) → Extreme (6x6) grids
- 🎮 **Move-based Challenges**: Limited moves per level (10-30)
- 📊 **Level Progression**: Automatic advancement on completion
- ⚡ **Resource Efficient**: Scales across all machine classes
- 🔊 **Quality Presets**: Scales with machine capabilities

## Installation

```bash
npm install @studio-hub/game-puzzle
```

## Quick Start

```typescript
import { createPuzzleGame } from '@studio-hub/game-puzzle';

async function initializePuzzle() {
  const puzzle = createPuzzleGame();
  
  await puzzle.initialize();
  
  puzzle.configure({
    machineClass: 'standard',
    difficulty: 'normal',
    quality: puzzle.getQualityPreset('standard'),
  });
  
  await puzzle.start();
  
  return puzzle;
}
```

## Machine Class Support

| Class | Support | FPS | Memory | CPU |
|-------|---------|-----|--------|-----|
| Minimal | ✅ Yes | 30 | 256 MB | 35% |
| Standard | ✅ Yes | 60 | 256 MB | 35% |
| Performance | ✅ Yes | 120 | 512 MB | 50% |
| Server | ✅ Yes | 120+ | 1 GB | 60% |

## Difficulty Levels

### Easy
- **Grid**: 3x3 (9 tiles)
- **Moves**: 30
- **Ideal for**: Casual players

### Normal
- **Grid**: 4x4 (16 tiles)
- **Moves**: 20
- **Ideal for**: Standard gameplay

### Hard
- **Grid**: 5x5 (25 tiles)
- **Moves**: 15
- **Ideal for**: Skilled players

### Extreme
- **Grid**: 6x6 (36 tiles)
- **Moves**: 10
- **Ideal for**: Expert players

## Game Controls

- `select-{index}` — Select a tile (0-based index)
- `shuffle` — Shuffle current grid (costs 1 move)
- `hint` — Show hint (costs 0.5 move)

## Game Mechanics

### Tile Matching
- Select two tiles
- If they match: +10 points, tiles removed
- If they don't match: tiles reset, +1 move
- Complete grid: advance to next level, +100 bonus

### Scoring
- Match: +10 points
- Level complete: +500 bonus
- Level advance: +100 points
- Final score: sum of all matches

### Levels
- Each level increases difficulty
- New grid shuffled on advance
- Move counter resets
- Score accumulates

## API

### `createPuzzleGame()`

Create a puzzle game instance.

**Returns**: `GameEngine`

### Lifecycle Methods

- `initialize()` — Initialize game
- `shutdown()` — Shutdown game
- `start()` — Start game
- `pause()` — Pause game
- `resume()` — Resume game
- `stop()` — Stop game

### State Management

- `getState()` — Get current game state
- `getScore()` — Get player score
- `getMoves()` — Get moves used
- `getMatches()` — Get tiles matched
- `getLevel()` — Get current level

### Configuration

- `configure(config)` — Apply configuration
- `getQualityPreset(machineClass)` — Get quality preset
- `setQualityPreset(preset)` — Set quality preset
- `setDifficulty(difficulty)` — Set game difficulty

### Gameplay

- `tick(deltaMs)` — Update game state
- `handleInput(input)` — Handle player input

## Examples

### Basic Game Loop

```typescript
import { createPuzzleGame } from '@studio-hub/game-puzzle';

async function playPuzzle() {
  const game = createPuzzleGame();
  await game.initialize();
  
  await game.start();
  
  // Game loop
  let lastTime = Date.now();
  const gameLoop = setInterval(async () => {
    const now = Date.now();
    const deltaMs = now - lastTime;
    lastTime = now;
    
    game.tick(deltaMs);
    const state = game.getState();
    
    if (!state.isRunning) {
      clearInterval(gameLoop);
      console.log(`Game Over! Final Score: ${game.getScore()}`);
    }
  }, 16); // ~60 FPS
}
```

### Difficulty Selection

```typescript
import { createPuzzleGame } from '@studio-hub/game-puzzle';

async function difficultySelection(machineClass) {
  const game = createPuzzleGame();
  await game.initialize();
  
  // Select difficulty based on machine
  const difficulty = machineClass === 'minimal' ? 'easy' :
                    machineClass === 'standard' ? 'normal' :
                    'hard';
  
  game.setDifficulty(difficulty);
  await game.start();
  
  return game;
}
```

## Testing

```bash
npm test -w packages/game-puzzle
```

## Tile Values

Tiles contain numeric values (0-N) representing pairs:
- Two tiles with same value = match
- When matched: removed from grid
- Grid shuffled at start of each level

## Hints System

- Highlight random matching pair (costs 0.5 move)
- Great for stuck players
- Minimal performance impact

## Related Packages

- `@studio-hub/game-core` — Game engine interface
- `@studio-hub/game-rhythm` — Rhythm game
- `@studio-hub/game-platformer` — Platformer game
- `@studio-hub/machine-profiler` — Machine detection
- `@studio-hub/config-engine` — Configuration management

## License

MIT
