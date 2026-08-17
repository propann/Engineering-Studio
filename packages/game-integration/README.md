# 🧪 @studio-hub/game-integration

Cross-package integration tests for Studio Hub game framework. Validates interaction between games, core interfaces, and resource management systems.

## Purpose

This package contains no production code—only comprehensive integration tests that verify:
- Game registry operations and lifecycle
- Machine class compatibility across game types
- Quality preset scaling consistency
- Resource allocation and utilization
- End-to-end game workflows
- Multi-game configurations

## Test Coverage

### Registry Operations
- List, register, and unregister games
- Game retrieval and validation
- Registry lifecycle management

### Machine Class Support
- Minimal (64 MB, 15% CPU)
- Standard (384 MB, 70% CPU)
- Performance (768 MB, 105% CPU)
- Server (1.5 GB, 135% CPU)

### Quality Presets
- FPS scaling across machine classes (30→144 FPS)
- Audio quality scaling (22kHz→96kHz)
- Memory allocation consistency
- CPU utilization tracking

### Resource Allocation
- Allocate games across resource budgets
- Track utilization and remaining capacity
- Validate compatibility before allocation
- Find games matching available resources

### Lifecycle Testing
- Initialize → Configure → Start → Stop → Shutdown
- Pause/resume functionality
- Score tracking and state management
- Multi-game simultaneous operation

## Test Organization

```
integration/
├── Registry Operations    (3 tests)
├── Machine Class Support  (4 tests)
├── Quality Presets        (4 tests)
├── Resource Allocation    (3 tests)
├── Configuration          (2 tests)
├── End-to-End Scenarios   (7 tests)
├── Efficiency             (2 tests)
└── Multi-Game Workflows   (1 test)
```

**Total: 26 integration tests**

## Running Tests

```bash
# Test game-integration package
npm test -w packages/game-integration

# Run all framework tests
npm run test:all
```

## Example Integration Test

```typescript
it('should support rhythm + platformer workflow', async () => {
  const machineClass = 'performance';
  const rhythm = registry.getGame('rhythm');
  const platformer = registry.getGame('platformer');
  const resourceMgr = createResourceManager({
    memory: 16384,
    cpu: 160,
    cache: 2000,
  });

  // Initialize both games
  await rhythm.initialize();
  await platformer.initialize();

  // Configure for performance machine
  rhythm.configure({
    machineClass,
    quality: rhythm.getQualityPreset(machineClass),
    difficulty: 'normal',
  });

  platformer.configure({
    machineClass,
    quality: platformer.getQualityPreset(machineClass),
    difficulty: 'hard',
  });

  // Allocate resources for both
  const rhythmSuccess = allocate(resourceMgr, 'rhythm', {
    memory: rhythm.getResourceRequirements().memory,
    cpu: rhythm.getResourceRequirements().cpu,
  });

  const platformerSuccess = allocate(resourceMgr, 'platformer', {
    memory: platformer.getResourceRequirements().memory,
    cpu: platformer.getResourceRequirements().cpu,
  });

  expect(rhythmSuccess && platformerSuccess).toBe(true);

  // Cleanup
  await rhythm.shutdown();
  await platformer.shutdown();
});
```

## Dependencies

- `@studio-hub/game-core` — Game engine interface
- `@studio-hub/game-rhythm` — Rhythm game implementation
- `@studio-hub/game-platformer` — Platformer game implementation
- `@studio-hub/resource-manager` — Resource allocation
- `@studio-hub/machine-profiler` — Machine detection

## Related Packages

- `@studio-hub/instrument-integration` — Instrument adapter integration tests
- `@studio-hub/game-core` — Core game framework
- `@studio-hub/game-rhythm` — Rhythm game
- `@studio-hub/game-platformer` — Platformer game

## Test Results

All 26 integration tests verify:
- ✅ Registry consistency across operations
- ✅ Machine class compatibility (all 4 classes)
- ✅ Quality preset scaling (30→144 FPS, 22kHz→96kHz)
- ✅ Resource allocation constraints
- ✅ Game lifecycle management
- ✅ Multi-game simultaneous operation
- ✅ End-to-end workflows (init→config→run→shutdown)

## License

MIT
