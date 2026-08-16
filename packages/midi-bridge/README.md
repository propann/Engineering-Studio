# 🌉 @studio-hub/midi-bridge

MIDI synchronization bridge for Studio Hub instruments. Enables OP-1 and EP-133 to work together seamlessly with synchronized MIDI events and clock signals.

## Features

- 🔗 **Instrument Synchronization**: Connect OP-1 and EP-133
- ⏱️ **Clock Synchronization**: Unified BPM/tempo across instruments
- 📨 **Event Routing**: Smart MIDI event distribution
- ⏳ **Latency Compensation**: Adjustable timing offset
- 🎛️ **Master Device Selection**: Choose which instrument leads

## Installation

```bash
npm install @studio-hub/midi-bridge
```

## Quick Start

```typescript
import { createMidiBridge } from '@studio-hub/midi-bridge';
import { createOP1Adapter } from '@studio-hub/instrument-op1';
import { createEP133Adapter } from '@studio-hub/instrument-ep133';

const bridge = createMidiBridge({
  masterDevice: 'op1',
  enableClockSync: true,
  enableEventRouting: true,
});

const op1 = createOP1Adapter();
const ep133 = createEP133Adapter();

bridge.connectOP1(op1);
bridge.connectEP133(ep133);

bridge.start();
bridge.sendClock(120);
```

## API

### `createMidiBridge(config?)`

Create a new MIDI bridge.

**Config Options**:
- `masterDevice`: 'op1' | 'ep133' (default: 'op1')
- `enableClockSync`: boolean (default: true)
- `enableEventRouting`: boolean (default: true)
- `latencyMs`: number (default: 0)

### Methods

- `connectOP1(adapter)` — Connect OP-1 adapter
- `connectEP133(adapter)` — Connect EP-133 adapter
- `start()` — Start synchronization
- `stop()` — Stop synchronization
- `routeEvent(event)` — Send MIDI event
- `sendClock(bpm)` — Send clock signal
- `getClockRate()` — Get current BPM
- `getStatus()` — Get bridge status
- `getQueueSize()` — Get pending events
- `clearQueue()` — Clear event queue

## Related Packages

- `@studio-hub/instrument-interface` — Adapter interface
- `@studio-hub/instrument-op1` — OP-1 adapter
- `@studio-hub/instrument-ep133` — EP-133 adapter

## License

MIT
