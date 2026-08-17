# 🥁 @studio-hub/instrument-ep133

Korg EP-133 GO drum machine adapter for Studio Hub adaptive framework. Unified support across all machine classes.

## Features

- 🎯 **Universal Support**: Works on all machine classes (even minimal!)
- 🥁 **Drum Machine Focus**: Optimized for rhythm and pattern-based production
- 🎚️ **Lightweight**: Lower resource requirements than synthesizers
- 🎛️ **Complete MIDI Support**: Full MIDI synchronization support
- 🔊 **High-Quality Audio**: Supports 22 kHz to 96 kHz
- ⚡ **Minimal Overhead**: Great for resource-constrained systems
- ✅ **Auto-Configuration**: Smart presets for each machine class

## Installation

```bash
npm install @studio-hub/instrument-ep133
```

## Quick Start

```typescript
import { createEP133Adapter } from '@studio-hub/instrument-ep133';
import { detectMachine } from '@studio-hub/machine-profiler';

async function initializeEP133() {
  const profile = await detectMachine();
  const ep133 = createEP133Adapter();
  
  // EP-133 works on ALL machines
  await ep133.initialize();
  
  ep133.configure({
    machineClass: profile.machineClass,
    quality: ep133.getQualityPreset(profile.machineClass),
    enabledFeatures: ['rhythms', 'patterns', 'reverb'],
  });
  
  return ep133;
}
```

## Machine Class Support

| Class | Support | Voices | Effects | Buffer |
|-------|---------|--------|---------|--------|
| Minimal | ✅ Yes | 4 | Low | 512 |
| Standard | ✅ Yes | 8 | Medium | 256 |
| Performance | ✅ Yes | 16 | High | 128 |
| Server | ✅ Yes | 32 | High | 64 |

## Quality Presets

### Minimal (Basic)
- **Voices**: 4 polyphony
- **Effects**: Low quality
- **Sample Rate**: 22.05 kHz
- **Memory**: 64 MB
- **CPU**: 15%

### Standard (Balanced)
- **Voices**: 8 polyphony
- **Effects**: Medium quality
- **Sample Rate**: 44.1 kHz
- **Memory**: 128 MB
- **CPU**: 30%

### Performance (Pro)
- **Voices**: 16 polyphony
- **Effects**: High quality
- **Sample Rate**: 48 kHz
- **Memory**: 256 MB
- **CPU**: 45%

### Server (Ultra)
- **Voices**: 32 polyphony
- **Effects**: High quality
- **Sample Rate**: 96 kHz
- **Memory**: 512 MB
- **CPU**: 60%

## Supported Features

- `rhythms` — Built-in rhythm patterns
- `patterns` — Pattern recording and playback
- `reverb` — Reverb effect
- `compressor` — Compression effect
- `delay` — Delay effect
- `chaining` — Chain multiple rhythms
- `sampling` — Audio sampling capability

## API

### `createEP133Adapter()`

Create an EP-133 adapter instance.

**Returns**: `InstrumentAdapter`

### `configureEP133(adapter, config)`

Apply EP-133 specific configuration.

**Parameters**:
- `adapter: InstrumentAdapter`
- `config: EP133Config`

### `EP133_QUALITY_PRESETS`

Predefined quality presets:
- `minimal_basic` — Minimal resources
- `standard_balanced` — Balanced performance
- `performance_pro` — High quality
- `server_ultra` — Maximum quality

## Examples

### Dynamic Feature Management

```typescript
import { createEP133Adapter } from '@studio-hub/instrument-ep133';

async function adaptToResources(cpuLoad) {
  const ep133 = createEP133Adapter();
  await ep133.initialize();
  
  // Enable features based on CPU load
  ep133.enableFeature('rhythms');
  ep133.enableFeature('patterns');
  
  if (cpuLoad < 50) {
    ep133.enableFeature('reverb');
    ep133.enableFeature('delay');
  } else {
    ep133.disableFeature('reverb');
  }
}
```

### Multi-Machine Setup

```typescript
import { createEP133Adapter } from '@studio-hub/instrument-ep133';
import { createAdapterRegistry } from '@studio-hub/instrument-interface';

const registry = createAdapterRegistry();
registry.registerAdapter('ep133', createEP133Adapter());

// Works on ANY machine class
const ep133 = registry.getAdapter('ep133');

// Adapts automatically
ep133.configure({
  machineClass: 'minimal', // Even works here!
  quality: ep133.getQualityPreset('minimal'),
});
```

## Why EP-133?

The Korg EP-133 GO is a compact drum machine that:
- Works on **minimal machines** (unlike OP-1)
- Uses significantly less resources
- Focuses on rhythm and pattern production
- Pairs perfectly with OP-1 for complete production setup
- Great for resource-constrained environments

## Testing

```bash
npm test -w packages/instrument-ep133
```

## Related Packages

- `@studio-hub/instrument-interface` — Base adapter interface
- `@studio-hub/instrument-op1` — OP-1 synthesizer adapter
- `@studio-hub/machine-profiler` — Machine detection
- `@studio-hub/config-engine` — Configuration management

## License

MIT
