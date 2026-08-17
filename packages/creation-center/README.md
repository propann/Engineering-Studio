# 🎨 @studio-hub/creation-center

Centralized creation system for all studio entities. Offloads creation processes from individual tools into a unified hub.

## Features

- 🎯 Unified creation interface
- 📦 Entity registry & management
- ✅ Validation system
- 💾 Import/export
- 🔄 Template-based creation

## Quick Start

```typescript
import { createCreationCenter } from '@studio-hub/creation-center';

const center = createCreationCenter();

// Register template
center.registerTemplate('display', {
  defaultValues: { color: '#000' },
  validator: (data) => ({ valid: true }),
});

// Create entity
const entity = center.create('display', { name: 'Screen 1' });

// List entities
const displays = center.list('display');
```

## Related Packages

- @studio-hub/config-engine
- @studio-hub/resource-manager

## License

MIT
