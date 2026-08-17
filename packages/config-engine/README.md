# ⚙️ @studio-hub/config-engine

Configuration engine for adaptive application setup based on machine capabilities.

## Features

- 🎯 **Machine-Based Configuration**: Automatically create configs per machine class
- 🔧 **Feature Flags**: Enable/disable features based on resources
- 💾 **Storage Management**: Optimize storage strategy per machine
- 🔍 **Configuration Validation**: Verify configs are correct
- 📊 **Config Summary**: Get quick overview of current setup
- 🔄 **Config Merging**: Combine defaults with user overrides
- 📝 **Import/Export**: Save and load configurations

## Installation

```bash
npm install @studio-hub/config-engine
```

## Usage

### Create Default Configuration

```typescript
import { createDefaultConfig } from '@studio-hub/config-engine';

const config = createDefaultConfig('my-studio', 'performance');

console.log(config);
// {
//   appName: 'my-studio',
//   machineClass: 'performance',
//   maxMemoryMB: 8192,
//   maxCpuPercent: 80,
//   audioQuality: 48000,
//   features: { ... },
//   ...
// }
```

### Merge with User Configuration

```typescript
import { createDefaultConfig, mergeConfigs } from '@studio-hub/config-engine';

const defaults = createDefaultConfig('my-app', 'standard');
const userConfig = {
  maxMemoryMB: 4096,
  features: { advancedEffects: true },
};

const merged = mergeConfigs(defaults, userConfig);
```

### Validate Configuration

```typescript
import { validateConfig } from '@studio-hub/config-engine';

const result = validateConfig(config);

if (!result.valid) {
  console.error('Config errors:', result.errors);
}
```

### Optimize for Constraints

```typescript
import { optimizeConfigForConstraints } from '@studio-hub/config-engine';

const optimized = optimizeConfigForConstraints(config, {
  maxMemory: 1024,
  maxCpuPercent: 50,
  networkOnly: true,
});
```

### Export/Import Configuration

```typescript
import { exportConfig, importConfig } from '@studio-hub/config-engine';

// Export to JSON
const json = exportConfig(config);
localStorage.setItem('app-config', json);

// Import from JSON
const savedJson = localStorage.getItem('app-config');
const loadedConfig = importConfig(savedJson);
```

### Get Configuration Summary

```typescript
import { getConfigSummary } from '@studio-hub/config-engine';

const summary = getConfigSummary(config);
console.log(summary);
// {
//   app: 'my-studio',
//   machine: 'performance',
//   memory: '8192MB',
//   cpu: '80%',
//   audio: '48000Hz',
//   graphics: 'high',
//   ...
// }
```

## API

### `createDefaultConfig(appName, machineClass?)`

Create a default configuration for an application.

**Parameters**:
- `appName: string` - Name of the application
- `machineClass: MachineClass` - One of: 'minimal', 'standard', 'performance', 'server' (default: 'standard')

**Returns**: `AppConfig`

### `getDefaultFeatures(machineClass)`

Get feature flags appropriate for a machine class.

**Parameters**:
- `machineClass: MachineClass`

**Returns**: `Record<string, boolean>`

### `mergeConfigs(defaults, userConfig)`

Merge user configuration with defaults.

**Parameters**:
- `defaults: AppConfig`
- `userConfig: Partial<AppConfig>`

**Returns**: `AppConfig`

### `validateConfig(config)`

Validate a configuration object.

**Parameters**:
- `config: AppConfig`

**Returns**: `{ valid: boolean; errors: string[] }`

### `optimizeConfigForConstraints(config, constraints)`

Optimize configuration for specific runtime constraints.

**Parameters**:
- `config: AppConfig`
- `constraints: { maxMemory?, maxCpuPercent?, networkOnly? }`

**Returns**: `AppConfig`

### `exportConfig(config)`

Export configuration to JSON string.

**Parameters**:
- `config: AppConfig`

**Returns**: `string`

### `importConfig(json)`

Import configuration from JSON string.

**Parameters**:
- `json: string`

**Returns**: `AppConfig`

### `getConfigSummary(config)`

Get a summary of the configuration.

**Parameters**:
- `config: AppConfig`

**Returns**: `Record<string, unknown>`

## Machine Classes

### Minimal
- **Memory**: 512 MB
- **CPU**: 30%
- **Graphics**: Minimal
- **Audio**: 22 kHz
- **Storage**: Memory-based
- **Features**: Basic only

### Standard
- **Memory**: 2 GB
- **CPU**: 60%
- **Graphics**: Standard
- **Audio**: 44.1 kHz
- **Storage**: Hybrid
- **Features**: Most features enabled

### Performance
- **Memory**: 8 GB
- **CPU**: 80%
- **Graphics**: High quality
- **Audio**: 48 kHz
- **Storage**: Full cache
- **Features**: All features enabled

### Server
- **Memory**: 16 GB
- **CPU**: 90%
- **Graphics**: Ultra
- **Audio**: 96 kHz
- **Storage**: Maximum
- **Features**: All + multi-user support

## Configuration Structure

```typescript
interface AppConfig {
  appName: string;
  version: string;
  machineClass: MachineClass;
  maxMemoryMB: number;
  maxCpuPercent: number;
  cacheSize: number;
  graphicsQuality: 'minimal' | 'standard' | 'high' | 'ultra';
  audioQuality: number; // Hz
  features: Record<string, boolean>;
  plugins: PluginConfig[];
  storage: StorageConfig;
  logging: LoggingConfig;
}
```

## Testing

```bash
npm test -w packages/config-engine
```

## Examples

### Initialize Studio App

```typescript
import { createDefaultConfig, getConfigSummary } from '@studio-hub/config-engine';

async function initializeStudio(machineClass) {
  const config = createDefaultConfig('studio-hub', machineClass);
  const summary = getConfigSummary(config);
  
  console.log('Studio Configuration:', summary);
  
  return config;
}
```

### Adapt to Runtime Constraints

```typescript
import { createDefaultConfig, optimizeConfigForConstraints } from '@studio-hub/config-engine';

function adaptToRuntime(baseConfig) {
  // Check available memory
  const availableMemory = getAvailableMemory();
  
  return optimizeConfigForConstraints(baseConfig, {
    maxMemory: availableMemory * 0.8, // Use 80% of available
    networkOnly: !hasLocalStorage(),
  });
}
```

## License

MIT
