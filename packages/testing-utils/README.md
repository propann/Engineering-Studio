# 🧪 @studio-hub/testing-utils

Testing utilities and fixtures for Studio Hub packages. Provides test factories, measurement tools, and mock builders.

## Features

- 📦 **Test Fixtures**: Pre-built configs for all machine classes
- ⏱️ **Performance Measurement**: Time execution of sync and async code
- 🎯 **Mock Builders**: Create mock objects easily
- ✔️ **Assertions**: Custom assertion helpers
- 🔧 **Utilities**: Array builders, wait functions, freezing

## Installation

```bash
npm install --save-dev @studio-hub/testing-utils
```

## Quick Start

```typescript
import {
  createTestConfig,
  createMachineClassFixtures,
  measureTime,
  createMockCapabilities,
} from '@studio-hub/testing-utils';

// Create test config
const config = createTestConfig('standard');

// Get fixtures for all machines
const fixtures = createMachineClassFixtures();

// Measure performance
const time = measureTime(() => {
  // code to measure
});

// Create mock
const caps = createMockCapabilities({ name: 'MyAdapter' });
```

## API

### Fixtures

- `createTestConfig(machineClass)` — Create test config
- `createMachineClassFixtures()` — Get configs for all classes
- `createTestResourceBudget(machineClass)` — Get resource budgets
- `createMockCapabilities(overrides)` — Create mock adapter capabilities

### Utilities

- `createTestArray(length, factory)` — Create array of test data
- `measureTime(fn)` — Measure sync execution time
- `measureTimeAsync(fn)` — Measure async execution time
- `waitFor(condition, timeout)` — Wait for condition
- `deepFreeze(obj)` — Make object immutable

### Assertions

- `assertApproximate(actual, expected, tolerance)` — Check approximate equality

## Related Packages

- `@studio-hub/config-engine` — Configuration management
- `@studio-hub/machine-profiler` — Machine detection

## License

MIT
