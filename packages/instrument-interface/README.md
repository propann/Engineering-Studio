# 🎹 @studio-hub/instrument-interface

Generic instrument adapter interface for unified audio device support across Studio Hub ecosystem.

## Features

- 🎯 **Unified Interface**: Single pattern for all instruments (OP-1, EP-133, synths, etc.)
- 🔌 **Adapter Registry**: Manage multiple instruments simultaneously
- 🎚️ **Quality Presets**: Auto-select configurations per machine class
- 💾 **Resource Management**: Calculate and validate resource requirements
- 🎛️ **MIDI/Audio I/O**: Query and configure inputs/outputs
- ⚡ **Feature Flags**: Enable/disable instrument features
- ✅ **Validation**: Verify adapter compatibility with machine constraints

## Installation

```bash
npm install @studio-hub/instrument-interface
```

## Usage

### Implement an Adapter

```typescript
import {
  InstrumentAdapter,
  InstrumentCapabilities,
  InstrumentState,
  QualityPreset,
  createQualityPreset,
} from '@studio-hub/instrument-interface';

export class MyInstrumentAdapter implements InstrumentAdapter {
  async initialize() {
    // Load instrument, allocate resources
  }

  async shutdown() {
    // Clean up, deallocate resources
  }

  getCapabilities(): InstrumentCapabilities {
    return {
      name: 'My Instrument',
      vendor: 'My Company',
      version: '1.0.0',
      minMachineClass: 'standard',
      requiredMemoryMB: 256,
      requiredCpuPercent: 30,
      maxVoicesPerClass: {
        minimal: 4,
        standard: 8,
        performance: 16,
        server: 32,
      },
      supportedAudioFormats: ['wav', 'aiff'],
      supportedFeatures: ['reverb', 'delay'],
      hasBuiltInEffects: true,
      midiCapabilities: {
        inputSupported: true,
        outputSupported: true,
        ccControlled: true,
      },
    };
  }

  getState(): InstrumentState {
    return {
      isInitialized: true,
      isRunning: false,
      activeVoices: 0,
      cpuLoad: 0,
    };
  }

  isSupported(machineClass: MachineClass): boolean {
    // Check if instrument works on this machine
    return machineClass !== 'minimal';
  }

  configure(config: InstrumentConfig): void {
    // Apply configuration
  }

  getQualityPreset(machineClass: MachineClass): QualityPreset {
    return createQualityPreset(machineClass, {
      // Custom overrides
    });
  }

  // ... other interface methods
}
```

### Register and Use Adapters

```typescript
import { createAdapterRegistry } from '@studio-hub/instrument-interface';

const registry = createAdapterRegistry();

// Register adapters
registry.registerAdapter('op1', new OP1Adapter());
registry.registerAdapter('ep133', new EP133Adapter());

// List all adapters
const available = registry.listAdapters();
console.log('Available instruments:', available);

// Get specific adapter
const op1 = registry.getAdapter('op1');
await op1.initialize();
```

### Find Adapters for Machine

```typescript
import {
  getAdaptersSupportedForMachine,
  findAdaptersForResources,
} from '@studio-hub/instrument-interface';

// Get all adapters that work on this machine class
const supported = getAdaptersSupportedForMachine(registry, 'performance');

// Find adapters that fit in available resources
const candidates = findAdaptersForResources(
  registry,
  4096,  // Available memory (MB)
  80,    // Available CPU (%)
  'performance'
);
```

### Validate Adapter Compatibility

```typescript
import { validateAdapterForMachine } from '@studio-hub/instrument-interface';

const result = validateAdapterForMachine(
  adapter,
  'standard',
  2048,  // Available memory
  60     // Available CPU
);

if (!result.valid) {
  console.error('Adapter not compatible:', result.errors);
}
```

## API

### Interfaces

#### `InstrumentAdapter`

Main interface all instruments must implement:

```typescript
interface InstrumentAdapter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Query
  getCapabilities(): InstrumentCapabilities;
  getState(): InstrumentState;
  isSupported(machineClass: MachineClass): boolean;

  // Configuration
  configure(config: InstrumentConfig): void;
  getQualityPreset(machineClass: MachineClass): QualityPreset;
  setQualityPreset(preset: QualityPreset): void;

  // Resources
  getResourceRequirements(): ResourceAllocation;
  getResourceUsage(): ResourceAllocation;

  // Audio I/O
  getAvailableMidiPorts(): MidiPort[];
  getAvailableAudioOutputs(): AudioOutput[];
  setAudioOutput(outputId: string): void;

  // Features
  enableFeature(feature: string): boolean;
  disableFeature(feature: string): boolean;
  isFeatureEnabled(feature: string): boolean;

  // Audio Processing (optional)
  process?(audioData: Float32Array): Float32Array;
}
```

#### `InstrumentCapabilities`

Describes what an instrument can do:

```typescript
interface InstrumentCapabilities {
  name: string;
  vendor: string;
  version: string;
  minMachineClass: MachineClass;
  requiredMemoryMB: number;
  requiredCpuPercent: number;
  maxVoicesPerClass: Record<MachineClass, number>;
  supportedAudioFormats: AudioFormat[];
  supportedFeatures: string[];
  hasBuiltInEffects: boolean;
  midiCapabilities: {
    inputSupported: boolean;
    outputSupported: boolean;
    ccControlled: boolean;
  };
}
```

#### `QualityPreset`

Machine-specific quality configuration:

```typescript
interface QualityPreset {
  name: string;
  machineClass: MachineClass;
  voicePolyphony: number;
  effectsQuality: EffectsQuality;
  bufferSize: number;
  sampleRate: number;
  cpuUsagePercent: number;
  memoryUsageMB: number;
}
```

### Functions

#### `createAdapterRegistry()`

Create a new adapter registry.

**Returns**: `AdapterRegistry`

#### `getAdaptersSupportedForMachine(registry, machineClass)`

Get adapters supported on a machine class.

**Parameters**:
- `registry: AdapterRegistry`
- `machineClass: MachineClass`

**Returns**: `string[]`

#### `findAdaptersForResources(registry, memory, cpu, machineClass)`

Find adapters that fit in available resources.

**Parameters**:
- `registry: AdapterRegistry`
- `availableMemory: number` (MB)
- `availableCpu: number` (%)
- `machineClass: MachineClass`

**Returns**: `string[]`

#### `getTotalResourceRequirements(adapters)`

Sum resource requirements of multiple adapters.

**Parameters**:
- `adapters: InstrumentAdapter[]`

**Returns**: `ResourceAllocation`

#### `createQualityPreset(machineClass, overrides)`

Create a quality preset for a machine class.

**Parameters**:
- `machineClass: MachineClass`
- `overrides: Partial<QualityPreset>` (optional)

**Returns**: `QualityPreset`

#### `validateAdapterForMachine(adapter, machineClass, memory, cpu)`

Validate adapter compatibility with constraints.

**Parameters**:
- `adapter: InstrumentAdapter`
- `machineClass: MachineClass`
- `availableMemory: number` (MB)
- `availableCpu: number` (%)

**Returns**: `{ valid: boolean; errors: string[] }`

## Machine Classes

### Minimal
- Max 4 voices
- Low effects quality
- 22.05 kHz sample rate
- ~100 MB memory

### Standard
- Max 8 voices
- Medium effects quality
- 44.1 kHz sample rate
- ~256 MB memory

### Performance
- Max 16 voices
- High effects quality
- 48 kHz sample rate
- ~512 MB memory

### Server
- Max 32 voices
- High effects quality
- 96+ kHz sample rate
- ~1 GB memory

## Examples

### Creating an OP-1 Adapter

```typescript
import { InstrumentAdapter } from '@studio-hub/instrument-interface';

export class OP1Adapter implements InstrumentAdapter {
  async initialize() {
    // Load OP-1 synth engine
  }

  isSupported(machineClass) {
    // OP-1 requires standard or better
    return machineClass !== 'minimal';
  }

  getQualityPreset(machineClass) {
    // Return presets optimized for OP-1
  }

  // ... implement other methods
}
```

### Registry with Fallbacks

```typescript
import { findAdaptersForResources } from '@studio-hub/instrument-interface';

function selectBestAdapter(registry, machineClass, resources) {
  // Try to find adapters that fit
  let adapters = findAdaptersForResources(
    registry,
    resources.memory,
    resources.cpu,
    machineClass
  );

  if (adapters.length === 0) {
    // Fallback: get any adapter supported on this machine
    adapters = getAdaptersSupportedForMachine(registry, machineClass);
  }

  return adapters[0];
}
```

## Testing

```bash
npm test -w packages/instrument-interface
```

## License

MIT
