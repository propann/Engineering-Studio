# 🎹 @studio-hub/instrument-op1

OP-1 Synthesizer adapter for Studio Hub adaptive framework. Unified support across all machine classes.

## Features

- 🎯 **Adaptive Quality**: Auto-configure for minimal, standard, performance, or server machines
- 🎚️ **Machine-Specific Presets**: Optimized settings for each machine class
- 🎛️ **Complete MIDI Support**: Input and output with CC control
- 🔊 **Multiple Audio Outputs**: Main output and headphone outputs
- ⚡ **Rich Effects**: Reverb, delay, compression, EQ, tape, vinyl simulations
- 💾 **Resource Aware**: Tracks CPU and memory usage per machine class
- ✅ **Zero Configuration**: Works out of the box with sensible defaults

## Installation

```bash
npm install @studio-hub/instrument-op1
```

## Usage

### Basic Usage

```typescript
import { createOP1Adapter } from '@studio-hub/instrument-op1';

const op1 = createOP1Adapter();
await op1.initialize();

// Check if supported
if (op1.isSupported('performance')) {
  // Configure for this machine
  const preset = op1.getQualityPreset('performance');
  op1.configure({
    machineClass: 'performance',
    quality: preset,
  });
}

await op1.shutdown();
```

### With Instrument Registry

```typescript
import { createAdapterRegistry } from '@studio-hub/instrument-interface';
import { createOP1Adapter } from '@studio-hub/instrument-op1';

const registry = createAdapterRegistry();
registry.registerAdapter('op1', createOP1Adapter());

// Find adapters for this machine
const supported = getAdaptersSupportedForMachine(registry, 'standard');
if (supported.includes('op1')) {
  const op1 = registry.getAdapter('op1');
  await op1.initialize();
}
```

### OP-1 Specific Configuration

```typescript
import { configureOP1 } from '@studio-hub/instrument-op1';

configureOP1(op1, {
  machineClass: 'performance',
  enableSynthEngine: true,
  enableDrumMachine: true,
  enableTapeSimulation: true,
  enableVinylSimulation: false,
});
```

### Quality Presets

```typescript
import { OP1_QUALITY_PRESETS } from '@studio-hub/instrument-op1';

// Use predefined quality presets
op1.setQualityPreset(OP1_QUALITY_PRESETS.standard_balanced);
```

### Enable/Disable Features

```typescript
// Enable specific effects
op1.enableFeature('reverb');
op1.enableFeature('delay');
op1.enableFeature('tape');

// Check if feature is enabled
if (op1.isFeatureEnabled('reverb')) {
  // Use reverb effect
}

// Disable feature
op1.disableFeature('vinyl');
```

### MIDI Configuration

```typescript
// Get available MIDI ports
const midiPorts = op1.getAvailableMidiPorts();

midiPorts.forEach(port => {
  console.log(`${port.name} (${port.direction}): ${port.isConnected ? 'Connected' : 'Disconnected'}`);
});
```

### Audio Output Configuration

```typescript
// Get available audio outputs
const outputs = op1.getAvailableAudioOutputs();

// Set audio output
op1.setAudioOutput(outputs[0].id); // Main output
```

## Quality Presets

### Standard (Balanced)
- **Voices**: 8 polyphony
- **Effects**: Medium quality
- **Sample Rate**: 44.1 kHz
- **Buffer**: 256 samples
- **Memory**: 256 MB
- **CPU**: 40%

### Performance (Pro)
- **Voices**: 16 polyphony
- **Effects**: High quality
- **Sample Rate**: 48 kHz
- **Buffer**: 128 samples
- **Memory**: 512 MB
- **CPU**: 60%

### Server (Ultra)
- **Voices**: 32 polyphony
- **Effects**: High quality
- **Sample Rate**: 96 kHz
- **Buffer**: 64 samples
- **Memory**: 1024 MB
- **CPU**: 75%

## API

### `createOP1Adapter()`

Create an OP-1 adapter instance.

**Returns**: `InstrumentAdapter`

### `configureOP1(adapter, config)`

Apply OP-1 specific configuration.

**Parameters**:
- `adapter: InstrumentAdapter`
- `config: OP1Config`

### `OP1_QUALITY_PRESETS`

Predefined quality presets for OP-1:
- `minimal_classic` — Low resource usage
- `standard_balanced` — Balanced performance
- `performance_pro` — High quality
- `server_ultra` — Maximum quality

## Supported Features

- `reverb` — Reverb effect
- `delay` — Delay effect
- `compression` — Compression effect
- `eq` — Equalizer
- `tape` — Tape simulation
- `vinyl` — Vinyl simulation
- `synth-engine` — Synthesizer engine
- `drum-machine` — Drum machine

## Machine Class Support

| Class | Support | Max Voices | Effects |
|-------|---------|-----------|---------|
| Minimal | ❌ No | — | — |
| Standard | ✅ Yes | 8 | Medium |
| Performance | ✅ Yes | 16 | High |
| Server | ✅ Yes | 32 | High |

## Resource Requirements

| Class | Memory | CPU | Buffer |
|-------|--------|-----|--------|
| Standard | 256 MB | 40% | 256 |
| Performance | 512 MB | 60% | 128 |
| Server | 1 GB | 75% | 64 |

## MIDI Capabilities

- ✅ MIDI Input
- ✅ MIDI Output
- ✅ CC Control (continuous controller messages)

## Examples

### Initialize and Use OP-1

```typescript
import { createOP1Adapter } from '@studio-hub/instrument-op1';
import { detectMachine } from '@studio-hub/machine-profiler';

async function initializeOP1() {
  // Detect machine
  const profile = await detectMachine();
  
  // Create adapter
  const op1 = createOP1Adapter();
  
  // Check compatibility
  if (!op1.isSupported(profile.machineClass)) {
    console.error('OP-1 not supported on this machine');
    return;
  }
  
  // Initialize
  await op1.initialize();
  
  // Configure for this machine
  op1.configure({
    machineClass: profile.machineClass,
    quality: op1.getQualityPreset(profile.machineClass),
    enabledFeatures: ['reverb', 'delay', 'synth-engine', 'drum-machine'],
  });
  
  return op1;
}
```

### Dynamic Feature Management

```typescript
function adaptFeaturesForLoad(op1, cpuLoad) {
  if (cpuLoad > 80) {
    // High CPU load - disable expensive effects
    op1.disableFeature('reverb');
    op1.disableFeature('tape');
  } else if (cpuLoad < 50) {
    // Low CPU load - enable all effects
    op1.enableFeature('reverb');
    op1.enableFeature('tape');
  }
}
```

## Testing

```bash
npm test -w packages/instrument-op1
```

## Related Packages

- `@studio-hub/instrument-interface` — Base adapter interface
- `@studio-hub/machine-profiler` — Machine detection
- `@studio-hub/config-engine` — Configuration management
- `@studio-hub/resource-manager` — Resource allocation

## License

MIT
