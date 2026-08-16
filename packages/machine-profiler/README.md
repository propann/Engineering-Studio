# 🖥️ @studio-hub/machine-profiler

Detect and classify machine capabilities for adaptive framework configuration.

## Features

- 🔍 **CPU Detection**: Cores, threads, speed
- 💾 **Memory Detection**: Total and available RAM
- 💿 **Storage Detection**: Total and available storage
- 🎯 **Machine Classification**: minimal, standard, performance, server
- 🌐 **Cross-Platform**: Works in Node.js and browsers
- ⚡ **Zero Dependencies**: Uses native APIs only

## Installation

```bash
npm install @studio-hub/machine-profiler
```

## Usage

### Basic Detection

```typescript
import { detectMachine } from '@studio-hub/machine-profiler';

const profile = await detectMachine();

console.log(profile);
// {
//   cpu: { cores: 8, threads: 8, speed: 3.6 },
//   memory: { total: 16384, available: 8192 },
//   storage: { total: 256000, available: 100000, type: 'SSD' },
//   platform: 'linux',
//   machineClass: 'performance',
//   timestamp: 1692374400000
// }
```

### Classification

```typescript
import { detectMachine } from '@studio-hub/machine-profiler';

const profile = await detectMachine();

if (profile.machineClass === 'minimal') {
  console.log('Low-resource machine: enable minimal mode');
} else if (profile.machineClass === 'standard') {
  console.log('Standard machine: normal mode');
} else if (profile.machineClass === 'performance') {
  console.log('High-resource machine: enable premium features');
}
```

### Get Recommended Configuration

```typescript
import { detectMachine, getRecommendedConfig } from '@studio-hub/machine-profiler';

const profile = await detectMachine();
const config = getRecommendedConfig(profile.machineClass);

console.log(config);
// {
//   maxMemoryMB: 8192,
//   maxCpuPercent: 80,
//   cacheSize: 1000,
//   graphics: 'high',
//   audioQuality: 48000
// }

// Use config to initialize your app
initializeApp(config);
```

## API

### `detectMachine()`

Detects current machine capabilities.

**Returns**: `Promise<MachineProfile>`

```typescript
interface MachineProfile {
  cpu: CPUInfo;
  memory: MemoryInfo;
  storage: StorageInfo;
  gpu?: GPUInfo;
  platform: 'darwin' | 'linux' | 'win32' | 'unknown';
  machineClass: MachineClass;
  timestamp: number;
}
```

### `getRecommendedConfig(machineClass)`

Get recommended configuration for a machine class.

**Parameters**:
- `machineClass: MachineClass` - One of: 'minimal', 'standard', 'performance', 'server'

**Returns**:
```typescript
{
  maxMemoryMB: number;
  maxCpuPercent: number;
  cacheSize: number;
  graphics: 'minimal' | 'standard' | 'high' | 'ultra';
  audioQuality: number; // Hz
}
```

## Machine Classes

### Minimal
- **Specs**: 1-3 cores, < 2GB RAM
- **Use Case**: Low-power devices, Raspberry Pi
- **Config**: Limited memory, low CPU %, minimal graphics

### Standard
- **Specs**: 4 cores, 2-8GB RAM
- **Use Case**: Regular laptops, desktop computers
- **Config**: Moderate memory, standard CPU %, normal graphics

### Performance
- **Specs**: 6+ cores, 8GB+ RAM
- **Use Case**: Gaming PCs, workstations
- **Config**: High memory, higher CPU %, high-quality graphics

### Server
- **Specs**: 8+ cores, 16GB+ RAM
- **Use Case**: Cloud servers, production deployment
- **Config**: Maximum resources, premium features, ultra graphics

## Examples

### Initialize App Based on Machine

```typescript
import { detectMachine, getRecommendedConfig } from '@studio-hub/machine-profiler';

async function initializeStudio() {
  const profile = await detectMachine();
  const config = getRecommendedConfig(profile.machineClass);

  return {
    audioQuality: config.audioQuality,
    enableAdvancedEffects: profile.machineClass !== 'minimal',
    cacheSize: config.cacheSize,
    maxMemory: config.maxMemoryMB,
  };
}
```

### Adaptive Feature Flags

```typescript
import { detectMachine } from '@studio-hub/machine-profiler';

async function getFeatureFlags() {
  const profile = await detectMachine();

  return {
    enableMultitracking: profile.machineClass !== 'minimal',
    enableVisualization: profile.machineClass === 'performance' || profile.machineClass === 'server',
    enableCloudSync: profile.platform !== 'unknown',
    enableThirdPartyPlugins: profile.cpu.cores >= 6,
  };
}
```

### Resource Monitoring

```typescript
import { detectMachine, getRecommendedConfig } from '@studio-hub/machine-profiler';

async function monitorResources() {
  const profile = await detectMachine();
  const config = getRecommendedConfig(profile.machineClass);

  return {
    cpuHeadroom: config.maxCpuPercent / 100,
    memoryHeadroom: config.maxMemoryMB / profile.memory.total,
    storageHeadroom: profile.storage.available / profile.storage.total,
  };
}
```

## Testing

```bash
npm test -w packages/machine-profiler
```

## Browser Support

- Chrome 21+
- Firefox 18+
- Safari 11+
- Edge 79+

Note: Some APIs may be unavailable in private browsing mode or certain browser contexts.

## Performance

- Synchronous detection: < 1ms
- Async detection (storage): < 10ms
- Classification: < 1ms

## License

MIT
