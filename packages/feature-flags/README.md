# 🚩 @studio-hub/feature-flags

Feature flag system for adaptive feature management based on machine capabilities and user permissions.

## Features

- 🎯 **Machine-Based Features**: Auto-enable/disable based on machine class
- 🔗 **Feature Dependencies**: Enforce feature chains (e.g., advanced effects require effects)
- ⚠️ **Conflict Management**: Prevent incompatible features from running simultaneously
- 🔔 **Change Listeners**: Subscribe to feature flag changes
- 📊 **Statistics**: Get overview of enabled/disabled features
- 💾 **Import/Export**: Save and load feature configurations
- ✅ **Zero Dependencies**: Uses only native APIs

## Installation

```bash
npm install @studio-hub/feature-flags
```

## Usage

### Initialize Feature Flags

```typescript
import {
  createFlagsStore,
  initializeDefaultFlags,
  setupFlagsForMachine,
} from '@studio-hub/feature-flags';

// Create store
const store = createFlagsStore();

// Initialize with defaults
initializeDefaultFlags(store);

// Configure for machine class
setupFlagsForMachine(store, 'performance');
```

### Check Feature Status

```typescript
import { isFeatureEnabled } from '@studio-hub/feature-flags';

if (isFeatureEnabled(store, 'advancedEffects')) {
  // Load advanced effects module
  enableAdvancedEffects();
}
```

### Enable/Disable Features

```typescript
import { enableFeature, disableFeature } from '@studio-hub/feature-flags';

// Enable a feature
enableFeature(store, 'visualization', 'user-request');

// Disable a feature
disableFeature(store, 'cloudSync', 'offline-mode');

// Toggle a feature
toggleFeature(store, 'recording');
```

### Subscribe to Changes

```typescript
import { subscribe } from '@studio-hub/feature-flags';

const unsubscribe = subscribe(store, (flag, enabled, reason) => {
  console.log(`${flag} ${enabled ? 'enabled' : 'disabled'} (${reason})`);
});

// Later: unsubscribe()
```

### Get Statistics

```typescript
import { getStatistics } from '@studio-hub/feature-flags';

const stats = getStatistics(store);
console.log(`${stats.enabled}/${stats.total} features enabled`);
```

### Export/Import Flags

```typescript
import { exportFlags, importFlags } from '@studio-hub/feature-flags';

// Export to JSON
const config = exportFlags(store);
const json = JSON.stringify(config);

// Import from JSON
const loaded = JSON.parse(json);
importFlags(store, loaded);
```

## API

### `createFlagsStore()`

Create a new feature flags store.

**Returns**: `FeatureFlagsStore`

### `initializeDefaultFlags(store)`

Initialize store with default feature flags.

**Parameters**:
- `store: FeatureFlagsStore`

### `setupFlagsForMachine(store, machineClass)`

Configure flags based on machine class.

**Parameters**:
- `store: FeatureFlagsStore`
- `machineClass: MachineClass` - 'minimal', 'standard', 'performance', 'server'

### `isFeatureEnabled(store, feature)`

Check if a feature is enabled (including dependencies).

**Parameters**:
- `store: FeatureFlagsStore`
- `feature: string`

**Returns**: `boolean`

### `enableFeature(store, feature, reason?)`

Enable a feature flag.

**Parameters**:
- `store: FeatureFlagsStore`
- `feature: string`
- `reason: string` - Reason for change (optional)

### `disableFeature(store, feature, reason?)`

Disable a feature flag.

**Parameters**:
- `store: FeatureFlagsStore`
- `feature: string`
- `reason: string` - Reason for change (optional)

### `toggleFeature(store, feature, reason?)`

Toggle a feature flag.

**Parameters**:
- `store: FeatureFlagsStore`
- `feature: string`
- `reason: string` - Reason for change (optional)

**Returns**: `boolean` - New state

### `getEnabledFeatures(store)`

Get list of all enabled features.

**Parameters**:
- `store: FeatureFlagsStore`

**Returns**: `string[]`

### `getFeatureInfo(store, feature)`

Get detailed information about a feature.

**Parameters**:
- `store: FeatureFlagsStore`
- `feature: string`

**Returns**: `FeatureFlag | undefined`

### `getAllFeatures(store)`

Get all features.

**Parameters**:
- `store: FeatureFlagsStore`

**Returns**: `FeatureFlag[]`

### `subscribe(store, listener)`

Subscribe to feature flag changes.

**Parameters**:
- `store: FeatureFlagsStore`
- `listener: (flag, enabled, reason) => void`

**Returns**: Unsubscribe function

### `getStatistics(store)`

Get feature statistics.

**Parameters**:
- `store: FeatureFlagsStore`

**Returns**: `{ total, enabled, disabled, percentage, ... }`

### `exportFlags(store)`

Export flags configuration.

**Parameters**:
- `store: FeatureFlagsStore`

**Returns**: `Record<string, boolean>`

### `importFlags(store, config)`

Import flags configuration.

**Parameters**:
- `store: FeatureFlagsStore`
- `config: Record<string, boolean>`

## Features by Machine Class

### Minimal
- Basic audio
- File operations
- MIDI support

### Standard
- All minimal features
- Effects chain
- Multitrack
- Visualization
- Cloud sync

### Performance
- All standard features
- Advanced effects
- Recording/playback
- Third-party plugins
- Real-time monitoring

### Server
- All performance features
- Multi-user support
- Analytics collection
- Automatic backup

## Feature Dependencies

Some features depend on others:
- `advancedEffects` requires `effectsChain`

If a dependency is disabled, dependent features are automatically disabled.

## Conflict Management

When a feature is disabled and has conflicting features, those conflicts are also disabled automatically.

## Examples

### Initialize Studio with Adaptive Features

```typescript
import { createFlagsStore, initializeDefaultFlags, setupFlagsForMachine } from '@studio-hub/feature-flags';
import { getEnabledFeatures } from '@studio-hub/feature-flags';

async function initializeStudio(machineClass) {
  const store = createFlagsStore();
  initializeDefaultFlags(store);
  setupFlagsForMachine(store, machineClass);

  const enabled = getEnabledFeatures(store);
  console.log(`Initialized with ${enabled.length} features`);

  return store;
}
```

### Runtime Feature Monitoring

```typescript
import { subscribe, getStatistics } from '@studio-hub/feature-flags';

const unsubscribe = subscribe(store, (flag, enabled, reason) => {
  console.log(`Feature changed: ${flag} → ${enabled} (${reason})`);
  
  const stats = getStatistics(store);
  console.log(`Active features: ${stats.enabled}/${stats.total}`);
});
```

### User Preference Override

```typescript
import { enableFeature, disableFeature } from '@studio-hub/feature-flags';

function applyUserPreferences(store, preferences) {
  for (const [feature, enabled] of Object.entries(preferences)) {
    if (enabled) {
      enableFeature(store, feature, 'user-preference');
    } else {
      disableFeature(store, feature, 'user-preference');
    }
  }
}
```

## Testing

```bash
npm test -w packages/feature-flags
```

## License

MIT
