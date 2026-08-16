# 🔌 @studio-hub/interface-adapters

Adapters to rewire existing OP-1 and EP-133 interfaces to use central systems (Creation Center & Save Manager) without changing interface signatures.

## Features

- 🔌 Non-breaking adapter pattern
- 🎹 OP-1 interface → central systems
- 🥁 EP-133 interface → central systems
- 📦 Backward compatible
- ✅ Zero interface changes

## Usage

```typescript
import { createOP1Adapter, createEP133Adapter } from '@studio-hub/interface-adapters';
import { createCreationCenter } from '@studio-hub/creation-center';
import { createSaveManager } from '@studio-hub/save-manager';

const cc = createCreationCenter();
const sm = createSaveManager();

// Rewire OP-1
const op1 = createOP1Adapter(cc, sm);
op1.saveDisplay('Screen 1', { color: '#fff' });

// Rewire EP-133
const ep133 = createEP133Adapter(cc, sm);
ep133.savePattern('Beat', { tempo: 120 });
```

## Related Packages

- @studio-hub/creation-center
- @studio-hub/save-manager

## License

MIT
