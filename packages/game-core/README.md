# 🎮 @studio-hub/game-core

Generic game engine interface for the Studio Hub adaptive game framework.

## Features

- 🎯 Unified game engine interface
- 🏁 Registry system for managing multiple games
- 🎚️ Machine-class adaptive quality presets
- 💾 Resource tracking and validation
- ⚡ Extensible design for game implementations

## Installation

```bash
npm install @studio-hub/game-core
```

## Quick Start

```typescript
import { createGameRegistry, createQualityPreset } from '@studio-hub/game-core';

const registry = createGameRegistry();
registry.registerGame('my-game', myGameEngine);

const preset = createQualityPreset('performance');
myGameEngine.setQualityPreset(preset);
```

## API

### `createGameRegistry()`
Create a new game registry.

### `createQualityPreset(machineClass, overrides?)`
Create quality preset for a machine class.

### `getGamesSupportedForMachine(registry, machineClass)`
Get games that work on a machine class.

### `validateGameForMachine(game, machineClass, memory, cpu)`
Validate game compatibility.

## License

MIT
