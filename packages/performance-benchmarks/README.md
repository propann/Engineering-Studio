# ⚡ @studio-hub/performance-benchmarks

Performance benchmarks and regression tests for Studio Hub adaptive framework. Ensures all operations meet performance targets across all machine classes.

## Purpose

This package contains performance tests to:
- Verify all operations meet target response times
- Detect performance regressions
- Benchmark heavy operations
- Test behavior under load
- Verify memory efficiency

## Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Machine detection | < 50ms | ✅ |
| Config creation | < 10ms | ✅ |
| Config merge | < 5ms | ✅ |
| Feature flag check | < 1ms | ✅ |
| Resource allocation | < 5ms | ✅ |
| Registry lookup | < 1ms | ✅ |
| Quality preset scale | < 1ms | ✅ |
| Game initialize | < 5ms | ✅ |

## Test Coverage

### Unit Performance Tests
- Machine profiler: detection speed, config recommendations
- Config engine: creation, merging, export
- Feature flags: initialization, flag checks
- Resource manager: allocation efficiency
- Registries: lookups, iteration
- Games: initialization, preset scaling

### Load Testing
- Registry with 100+ items
- Multiple concurrent operations
- Repeated operations (1000+)

### Regression Testing
- Performance consistency across iterations
- No significant variance in operations
- Memory efficiency (no leaks)

### Benchmark Tests
- Operation timing measurement
- Variance analysis
- Consistency verification

## Running Tests

```bash
# Run all performance tests
npm test -w packages/performance-benchmarks

# Run benchmarks only
npm run bench -w packages/performance-benchmarks

# Run with verbose output
npm test -w packages/performance-benchmarks -- --reporter=verbose
```

## Performance Regression Detection

The test suite includes regression tests that:
1. Run operations multiple times
2. Measure execution time each time
3. Calculate average and variance
4. Fail if variance > 50%
5. Detect memory leaks

This ensures performance doesn't degrade across releases.

## Memory Efficiency

Includes tests for:
- No memory leaks in repeated operations
- Heap growth < 10MB for 1000 operations
- Efficient object allocation
- Proper garbage collection

## Dependencies

- `@studio-hub/machine-profiler` — Machine detection
- `@studio-hub/config-engine` — Configuration
- `@studio-hub/feature-flags` — Feature management
- `@studio-hub/resource-manager` — Resource allocation
- `@studio-hub/instrument-interface` — Adapter interface
- `@studio-hub/instrument-op1` — OP-1 adapter
- `@studio-hub/instrument-ep133` — EP-133 adapter
- `@studio-hub/game-core` — Game engine
- `@studio-hub/game-rhythm` — Rhythm game
- `@studio-hub/game-platformer` — Platformer game

## Integration

These benchmarks run as part of the main test suite to detect performance regressions early.

## License

MIT
