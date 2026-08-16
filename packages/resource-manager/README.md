# 💾 @studio-hub/resource-manager

Runtime resource budgeting and allocation for adaptive applications.

## Features

- 📊 **Resource Tracking**: Monitor memory, CPU, and cache usage
- 🎯 **Allocation Management**: Request and release resources with priorities
- 🚨 **Critical Monitoring**: Detect when utilization exceeds thresholds
- 🔔 **Change Notifications**: Subscribe to resource events
- 💡 **Smart Suggestions**: Identify low-priority allocations to free
- 📈 **Usage Statistics**: Get detailed utilization metrics
- ✅ **Zero Dependencies**: Uses only native APIs

## Installation

```bash
npm install @studio-hub/resource-manager
```

## Usage

### Create Resource Manager

```typescript
import { createResourceManager, createFromConfig } from '@studio-hub/resource-manager';

// From budget object
const store = createResourceManager({
  memory: 2048,  // MB
  cpu: 60,       // Percent
  cache: 200,    // MB
});

// From app config
const store2 = createFromConfig({
  maxMemoryMB: 8192,
  maxCpuPercent: 80,
  cacheSize: 1000,
});
```

### Allocate Resources

```typescript
import { allocate, canAllocate } from '@studio-hub/resource-manager';

// Check if resources available
if (canAllocate(store, { memory: 512, cpu: 20 })) {
  // Allocate with priority
  allocate(store, 'audio-engine', { memory: 512, cpu: 20 }, 100);
}
```

### Monitor Usage

```typescript
import { getUsage, isResourceCritical } from '@studio-hub/resource-manager';

const usage = getUsage(store);
console.log(`Memory: ${usage.utilization.memory}% used`);
console.log(`CPU: ${usage.utilization.cpu}% used`);

if (isResourceCritical(store, 85)) {
  console.warn('Resources critical!');
}
```

### Release Resources

```typescript
import { release } from '@studio-hub/resource-manager';

release(store, 'audio-engine');
```

### Subscribe to Events

```typescript
import { subscribe } from '@studio-hub/resource-manager';

const unsubscribe = subscribe(store, event => {
  if (event.type === 'exceeded') {
    console.error(event.message);
  } else if (event.type === 'critical') {
    console.warn('Resource usage critical');
  }
});
```

### Get Resource Summary

```typescript
import { getSummary, suggestFreeable } from '@studio-hub/resource-manager';

const summary = getSummary(store);
console.log(summary);

// Get allocations that could be freed
const freeable = suggestFreeable(store, minimumPriority);
```

## API

### `createResourceManager(budget)`

Create a new resource manager.

**Parameters**:
- `budget: { memory: number; cpu: number; cache: number }`

**Returns**: `ResourceManagerStore`

### `createFromConfig(config)`

Create resource manager from app configuration.

**Parameters**:
- `config: { maxMemoryMB: number; maxCpuPercent: number; cacheSize: number }`

**Returns**: `ResourceManagerStore`

### `allocate(store, name, request, priority?)`

Allocate resources for a component.

**Parameters**:
- `store: ResourceManagerStore`
- `name: string` - Component identifier
- `request: { memory?: number; cpu?: number }` - Resource needs
- `priority: number` - Priority (0-100, default 50)

**Returns**: `boolean` - Success

### `release(store, name)`

Release allocated resources.

**Parameters**:
- `store: ResourceManagerStore`
- `name: string` - Component identifier

**Returns**: `boolean` - Success

### `canAllocate(store, request)`

Check if resources can be allocated.

**Parameters**:
- `store: ResourceManagerStore`
- `request: { memory?: number; cpu?: number }`

**Returns**: `boolean`

### `getAllocated(store)`

Get currently allocated resources.

**Parameters**:
- `store: ResourceManagerStore`

**Returns**: `{ memory: number; cpu: number; cache: number }`

### `getAvailable(store)`

Get available resources.

**Parameters**:
- `store: ResourceManagerStore`

**Returns**: `{ memory: number; cpu: number; cache: number }`

### `getUsage(store)`

Get detailed usage statistics.

**Parameters**:
- `store: ResourceManagerStore`

**Returns**: 
```typescript
{
  allocated: ResourceBudget;
  available: ResourceBudget;
  utilization: {
    memory: number;  // 0-100%
    cpu: number;     // 0-100%
    cache: number;   // 0-100%
  };
}
```

### `getAllocationInfo(store, name)`

Get information about a specific allocation.

**Parameters**:
- `store: ResourceManagerStore`
- `name: string`

**Returns**: `ResourceAllocation | undefined`

### `getAllAllocations(store)`

Get all active allocations (sorted by priority).

**Parameters**:
- `store: ResourceManagerStore`

**Returns**: `ResourceAllocation[]`

### `isResourceCritical(store, threshold?)`

Check if utilization exceeds threshold.

**Parameters**:
- `store: ResourceManagerStore`
- `threshold: number` - Threshold percent (default 90)

**Returns**: `boolean`

### `suggestFreeable(store, minimumPriority?)`

Get allocations that could be freed.

**Parameters**:
- `store: ResourceManagerStore`
- `minimumPriority: number` - Minimum priority to free (default 0)

**Returns**: `string[]` - Allocation names

### `getSummary(store)`

Get resource summary for logging.

**Parameters**:
- `store: ResourceManagerStore`

**Returns**: `Record<string, unknown>`

### `subscribe(store, listener)`

Subscribe to resource events.

**Parameters**:
- `store: ResourceManagerStore`
- `listener: (event) => void`

**Returns**: Unsubscribe function

## Event Types

- `allocate` - Resource allocation successful
- `release` - Resource release successful
- `exceeded` - Allocation failed due to insufficient resources
- `warning` - Utilization high (>75%)

## Examples

### Adaptive Audio Engine

```typescript
import { createFromConfig, allocate, release } from '@studio-hub/resource-manager';

class AudioEngine {
  private store;

  constructor(config) {
    this.store = createFromConfig(config);
  }

  async enableAdvancedEffects() {
    if (allocate(this.store, 'effects', { memory: 256, cpu: 15 }, 80)) {
      // Load and enable effects
      loadAdvancedEffects();
    } else {
      console.warn('Insufficient resources for advanced effects');
    }
  }

  disableAdvancedEffects() {
    release(this.store, 'effects');
  }
}
```

### Resource Monitor

```typescript
import { createResourceManager, subscribe, isResourceCritical } from '@studio-hub/resource-manager';

function setupResourceMonitoring(store) {
  subscribe(store, event => {
    console.log(`[Resource] ${event.type}: ${event.message}`);

    if (isResourceCritical(store, 80)) {
      console.warn('System approaching resource limits');
    }
  });
}
```

### Dynamic Resource Allocation

```typescript
import { allocate, canAllocate, suggestFreeable } from '@studio-hub/resource-manager';

async function requestOptionalFeature(store, feature) {
  if (!canAllocate(store, { memory: 100, cpu: 10 })) {
    // Try to free low-priority resources
    const freeable = suggestFreeable(store, 25);
    for (const name of freeable) {
      release(store, name);
    }
  }

  allocate(store, feature, { memory: 100, cpu: 10 }, 50);
}
```

## Testing

```bash
npm test -w packages/resource-manager
```

## License

MIT
