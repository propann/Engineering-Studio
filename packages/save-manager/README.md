# 💾 @studio-hub/save-manager

Unified save and data persistence for studio-hub. Centralizes all saves from OP-1, EP-133, and other tools.

## Features

- 📦 Centralized save storage
- 🔍 Audit & integrity verification
- 📊 Save indexing & statistics
- ✅ Import/export functionality
- 🏷️ Type & tool filtering

## Quick Start

```typescript
import { createSaveManager } from '@studio-hub/save-manager';

const mgr = createSaveManager();

// Save data
const save = mgr.save('project', 'op1', 'My Project', { bpm: 120 });

// List saves
const projects = mgr.list({ type: 'project' });

// Verify integrity
const result = mgr.verify();

// Export all
const { saves, index } = mgr.export();
```

## Related Packages

- @studio-hub/creation-center
- @studio-hub/config-engine

## License

MIT
