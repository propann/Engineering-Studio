# 🎮 @studio-hub/game-platformer

Platformer game implementation for Studio Hub adaptive game framework. Side-scrolling platformer with player movement, jumping, and level progression.

## Features

- 🎯 **Adaptive Quality**: Machine-specific quality presets (30 FPS minimal → 120 FPS performance)
- 🕹️ **Player Physics**: Realistic gravity, jumping, and movement mechanics
- 🎚️ **Lives System**: Start with 3 lives, lose one when falling off platform
- 📊 **Level Progression**: Advance through levels with increasing difficulty
- ⚡ **Resource Efficient**: Scales resource usage across all machine classes
- 🔊 **Audio Support**: Quality scales with machine capabilities

## Installation

```bash
npm install @studio-hub/game-platformer
```

## Quick Start

```typescript
import { createPlatformerGame } from '@studio-hub/game-platformer';
import { detectMachine } from '@studio-hub/machine-profiler';

async function initializePlatformer() {
  const profile = await detectMachine();
  const platformer = createPlatformerGame();
  
  await platformer.initialize();
  
  platformer.configure({
    machineClass: profile.machineClass,
    difficulty: 'normal',
    quality: platformer.getQualityPreset(profile.machineClass),
  });
  
  await platformer.start();
  
  return platformer;
}
```

## Machine Class Support

| Class | Support | FPS | Memory | CPU |
|-------|---------|-----|--------|-----|
| Minimal | ✅ Yes | 30 | 256 MB | 25% |
| Standard | ✅ Yes | 60 | 256 MB | 45% |
| Performance | ✅ Yes | 120 | 512 MB | 70% |
| Server | ✅ Yes | 120+ | 1024 MB | 85% |

## Game Controls

- `jump` — Jump (on ground only)
- `left` — Move left
- `right` — Move right
- `stop` — Stop moving

## Game Mechanics

### Player Movement
- Smooth acceleration with velocity-based movement
- Bounded screen edges (x: 0-800, y: 0+)
- Gravity-based falling mechanic

### Jumping
- Jump only from ground (y >= 100)
- Velocity-based jump height
- Score +5 per jump

### Lives System
- Start with 3 lives
- Lose 1 life when falling beyond bottom (y > 600)
- Game ends when lives reach 0

### Level Progression
- Start at Level 1
- Advance with `advanceLevel()` method
- Score +100 per level advance
- Player resets to starting position

## Difficulty Levels

### Easy
- **Gravity**: 7.0 (slower fall)
- **Ideal for**: Casual players, learning

### Normal
- **Gravity**: 9.8 (realistic)
- **Ideal for**: Standard gameplay

### Hard
- **Gravity**: 12.0 (faster fall)
- **Ideal for**: Skilled players

### Extreme
- **Gravity**: 15.0 (very fast fall)
- **Ideal for**: Expert players

## API

### `createPlatformerGame()`

Create a platformer game instance.

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
- `getLives()` — Get remaining lives
- `getLevel()` — Get current level

### Configuration

- `configure(config)` — Apply configuration
- `getQualityPreset(machineClass)` — Get quality preset
- `setQualityPreset(preset)` — Set quality preset
- `setDifficulty(difficulty)` — Set game difficulty

### Gameplay

- `tick(deltaMs)` — Update game state
- `handleInput(input)` — Handle player input
- `advanceLevel()` — Progress to next level

## Examples

### Basic Game Loop

```typescript
import { createPlatformerGame } from '@studio-hub/game-platformer';

async function playGame() {
  const game = createPlatformerGame();
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

### Adaptive Difficulty

```typescript
import { createPlatformerGame } from '@studio-hub/game-platformer';

async function adaptiveDifficulty(machineClass) {
  const game = createPlatformerGame();
  await game.initialize();
  
  // Set difficulty based on machine capability
  const difficulty = machineClass === 'minimal' ? 'easy' : 
                    machineClass === 'standard' ? 'normal' :
                    'hard';
  
  game.setDifficulty(difficulty);
  await game.start();
}
```

## Testing

```bash
npm test -w packages/game-platformer
```

## Related Packages

- `@studio-hub/game-core` — Game engine interface
- `@studio-hub/game-rhythm` — Rhythm game implementation
- `@studio-hub/machine-profiler` — Machine detection
- `@studio-hub/config-engine` — Configuration management

## License

MIT
