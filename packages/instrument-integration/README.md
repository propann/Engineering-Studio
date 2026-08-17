# 🔗 @studio-hub/instrument-integration

Integration tests for the instrument adapter system and core adaptive framework.

This package contains **no production code**—only comprehensive integration tests verifying that:
- Adapters work together via the registry
- Quality presets scale correctly across machine classes
- Resource allocation respects budgets
- Feature flags align with adapter capabilities
- End-to-end workflows function as designed

## Tests

```bash
npm test -w packages/instrument-integration
```

### Test Coverage

- **Registry operations**: Adapter registration, listing, retrieval
- **Machine class filtering**: Adapter availability per machine class
- **Quality presets**: Cross-adapter preset consistency and scaling
- **Resource allocation**: Single and multi-adapter allocation scenarios
- **Feature integration**: Adapter features with global feature flags
- **End-to-end workflows**: Complete initialization → configuration → allocation cycles
- **Resource efficiency**: Comparative resource usage and budget fitting

## Running

```bash
# Run only integration tests
npm test -w packages/instrument-integration

# Run all tests including integration
npm run test:all

# Watch mode
npm test -w packages/instrument-integration -- --watch
```

## What's Tested

✅ Registry: Register/list/get adapters  
✅ Machine classes: Correct adapter availability (e.g., OP-1 on minimal? No. EP-133? Yes.)  
✅ Quality presets: Consistent scaling from minimal to server across adapters  
✅ Resources: Allocation succeeds/fails correctly per machine budget  
✅ Features: Adapter features align with framework feature flags  
✅ Workflows: Real-world usage (synth + drums on performance machine)  
✅ Efficiency: Resource requirements realistic and comparable  

## License

MIT
