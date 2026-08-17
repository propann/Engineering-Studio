# 📋 Phase 4 Week 3-4 Plan - Instrument Adapters

**Target Date**: 2026-08-22 to 2026-09-05  
**Current Date**: 2026-08-15  
**Status**: PLANNED (Ready to Start)

---

## 🎯 Objective

Create unified instrument adapter pattern enabling OP-1 Studio and EP-133 Studio (and future instruments) to work seamlessly with the adaptive framework core (`machine-profiler`, `config-engine`, `feature-flags`, `resource-manager`).

**Success Criteria**:
- ✅ Generic instrument interface defined
- ✅ OP-1 adapter created
- ✅ EP-133 adapter created
- ✅ Both adapters tested with all 4 machine classes
- ✅ Comprehensive documentation
- ✅ Full integration tests

---

## 📦 Packages to Create (Week 3-4)

### 1. @studio-hub/instrument-interface (Week 3, Day 1-2)

**Purpose**: Define the contract all instruments must implement.

**Key Types & Interfaces**:
```typescript
interface InstrumentCapabilities {
  name: string;
  vendor: string;
  minMachineClass: MachineClass;
  requiredMemoryMB: number;
  requiredCpuPercent: number;
  maxVoices: Record<MachineClass, number>;
  audioFormats: string[];
  features: string[];
}

interface InstrumentAdapter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Query
  getCapabilities(): InstrumentCapabilities;
  isSupported(machineClass: MachineClass): boolean;
  
  // Configuration
  configure(config: AppConfig): void;
  getQualityPreset(machineClass: MachineClass): QualityPreset;
  
  // Performance
  getResourceRequirements(): ResourceAllocation;
  
  // Audio I/O
  getAvailableMidiPorts(): MidiPort[];
  getAvailableAudioOutputs(): AudioOutput[];
}

interface QualityPreset {
  voicePolyphony: number;
  effectsQuality: 'low' | 'medium' | 'high';
  bufferSize: number;
  sampleRate: number;
}
```

**Expected Exports**:
- `InstrumentAdapter` interface
- `InstrumentCapabilities` interface
- `QualityPreset` type
- `createAdapterRegistry()` function
- `registerAdapter()` function

**Tests**: 12 (interface structure, registry operations)

---

### 2. @studio-hub/instrument-op1 (Week 3, Day 3-4)

**Purpose**: Adapter for OP-1 Synthesizer (from existing `apps/op1-studio`).

**Key Features**:
- Minimal: 4 voices, basic effects, 44.1 kHz
- Standard: 8 voices, standard effects, 48 kHz
- Performance: 16 voices, advanced effects, 96 kHz
- Server: 32 voices, ultra effects, 192 kHz

**Implementation**:
```typescript
export class OP1Adapter implements InstrumentAdapter {
  // Implement interface based on existing OP-1 code
  // Reuse:
  // - Audio codec from apps/op1-studio/src/aiff-codec.ts
  // - MIDI handling from apps/op1-studio/src/midi/
  // - Preset management from apps/op1-studio/src/presets/
}

export function createOP1Adapter(): InstrumentAdapter {
  return new OP1Adapter();
}
```

**Integration Points**:
- Machine profiler → Select quality preset
- Config engine → Apply machine-specific config
- Feature flags → Enable/disable OP-1 specific features
- Resource manager → Allocate needed resources

**Tests**: 16 (capability queries, configuration, resource allocation, audio I/O)

---

### 3. @studio-hub/instrument-ep133 (Week 3-4, Day 5-6)

**Purpose**: Adapter for Korg EP-133 Go (from existing `apps/ep133-studio`).

**Key Features**:
- Minimal: Basic rhythm, 22.05 kHz, no effects
- Standard: Full rhythms, 44.1 kHz, basic effects
- Performance: All rhythms + patterns, 48 kHz, advanced effects
- Server: Full feature set, 96 kHz

**Implementation**:
```typescript
export class EP133Adapter implements InstrumentAdapter {
  // Implement interface based on existing EP-133 code
  // Reuse:
  // - Rhythm engine from apps/ep133-studio/src/engine/
  // - Transport control from apps/ep133-studio/src/transport/
  // - Audio processing from apps/ep133-studio/src/audio/
}

export function createEP133Adapter(): InstrumentAdapter {
  return new EP133Adapter();
}
```

**Integration Points**:
- Same as OP-1, plus Tone.js audio generation

**Tests**: 16 (same coverage as OP-1)

---

### 4. @studio-hub/instrument-synth (Week 4, Day 7 - Optional)

**Purpose**: Generic synthesizer adapter (template for third-party instruments).

**Features**:
- Wavetable synthesis
- Envelope ADSR
- LFO modulation
- Polyphonic voices

**Purpose**: Example implementation for others to follow.

---

## 🔗 Integration Testing (Week 4)

### Test Matrix

```
                 Minimal  Standard  Performance  Server
OP-1 Adapter       ✓        ✓          ✓          ✓
EP-133 Adapter     ✓        ✓          ✓          ✓
Synth Adapter      ✓        ✓          ✓          ✓

Tests per combo: 8
Total: 3 × 4 × 8 = 96 integration tests
```

### Integration Test Scenarios

1. **Initialization**
   - Adapter initializes on all machine classes
   - Resources properly allocated

2. **Configuration**
   - Machine-specific quality presets applied
   - Feature flags respected

3. **Audio I/O**
   - MIDI input/output working
   - Audio output format correct

4. **Resource Management**
   - No resource allocation errors
   - Cleanup on shutdown

5. **Performance**
   - CPU/memory usage within budget
   - No dropouts on worst machine class

---

## 📊 Work Breakdown

### Week 3 (Days 1-5)

**Day 1-2: Instrument Interface**
- [ ] Define InstrumentAdapter interface
- [ ] Create @studio-hub/instrument-interface package
- [ ] Write 12 unit tests
- [ ] Document API

**Day 3-4: OP-1 Adapter**
- [ ] Extract OP-1 code to adapter pattern
- [ ] Implement quality presets
- [ ] Write 16 unit tests
- [ ] Document configuration

**Day 5-6: EP-133 Adapter**
- [ ] Extract EP-133 code to adapter pattern
- [ ] Implement quality presets
- [ ] Write 16 unit tests
- [ ] Document configuration

### Week 4 (Days 6-10)

**Day 6-7: Integration Testing**
- [ ] Write 96 integration tests
- [ ] Test all machine class combinations
- [ ] Test adapter registry operations
- [ ] Test feature flag interactions

**Day 8-9: Documentation & Examples**
- [ ] Complete API documentation
- [ ] Write adapter creation guide
- [ ] Create third-party adapter template
- [ ] Document quality presets

**Day 10: Git Cleanup & PRs**
- [ ] Clean commit messages
- [ ] Create feature branch
- [ ] PR to phase4/adaptive-framework
- [ ] Code review & merge

---

## ✅ Deliverables Checklist (Week 3-4)

- [ ] @studio-hub/instrument-interface (12 tests)
- [ ] @studio-hub/instrument-op1 (16 tests + 48 integration)
- [ ] @studio-hub/instrument-ep133 (16 tests + 48 integration)
- [ ] @studio-hub/instrument-synth (16 tests + 24 integration) — Optional
- [ ] Integration test suite (96 tests)
- [ ] Complete API documentation
- [ ] Adapter creation guide
- [ ] Quality preset documentation
- [ ] Working examples for each adapter
- [ ] All tests passing (>150 total)
- [ ] TypeScript strict mode
- [ ] Zero new external dependencies

---

## 🔍 Code Reuse Strategy

### From apps/op1-studio
- AIFF codec implementation → `@studio-hub/audio-bridge`
- MIDI handler → `@studio-hub/midi-bridge` (future)
- Preset management → Instrument adapter methods
- Effects chain → Quality preset selection

### From apps/ep133-studio
- Rhythm engine → Core instrument logic
- Audio processing → Quality preset optimization
- Transport controls → Instrument interface
- Tone.js integration → Quality preset configuration

### New in adapters
- Machine class detection logic
- Quality preset selection
- Resource requirement calculation
- Feature flag binding

---

## 📚 Documentation Plan

### Adapter Creation Guide
1. Implement `InstrumentAdapter` interface
2. Define capabilities (machine class requirements)
3. Create quality presets for each machine class
4. Register with adapter registry
5. Test with integration suite

### Quality Preset Documentation
- CPU/memory requirements per class
- Audio quality specifications
- Feature availability per class
- Example configurations

### Integration Guide
- How adapters work with config engine
- How feature flags control adapter features
- How resource manager limits adapter usage
- How machine profiler selects quality

---

## 🎯 Success Metrics

✅ **Completion**:
- All 3-4 adapter packages created
- All tests passing (>150)
- Documentation complete

✅ **Quality**:
- TypeScript strict mode
- 100% test coverage per package
- Code reuse from existing studios
- No new external dependencies

✅ **Integration**:
- Adapters work with all 4 machine classes
- Feature flags properly integrated
- Resource management working
- Audio I/O tested

✅ **Performance**:
- OP-1 maintains 60 FPS on standard machine
- EP-133 maintains rhythm timing on minimal
- No resource allocation errors
- Clean shutdown without leaks

---

## 🚀 Ready to Start

Current status: Ready for Week 3 kickoff  
Prerequisite: Phase 4 Week 1-2 complete ✅

---

**Next**: Start implementing @studio-hub/instrument-interface on 2026-08-22
