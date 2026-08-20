# 🗺️ PROJECT ROADMAP

**Consolidated roadmap for Engineering-Studio**

---

## 📋 Quick Links

- **Current Status**: See [STATUS.md](#current-status)
- **Architecture**: See [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)
- **Getting Started**: See [STARTUP_GUIDE.md](../STARTUP_GUIDE.md)

---

## 🎯 Project Vision

A unified suite for Teenage Engineering instruments (OP-1, EP-133) integrated with a digital Eurorack audio system via MIDI orchestration.

---

## ✅ Completed Phases

### Phase 1: Foundation & Monorepo Setup (✅ COMPLETE)
- [x] Git consolidation from multiple repos
- [x] NPM dependencies synchronized
- [x] Monorepo structure (apps + packages)
- [x] MIDI Bridge package created
- [x] Audio Bridge package created

**Status**: Production Ready  
**Date Completed**: 2026-08-16

---

### Phase 2: Service Integration (✅ COMPLETE)
- [x] OP-1 Studio app integrated
- [x] EP-133 Studio app integrated
- [x] Studio Hub audio app integrated
- [x] MIDI routing between services
- [x] Master MIDI Clock synchronization
- [x] Version alignment (npm)

**Status**: Production Ready  
**Date Completed**: 2026-08-19

---

### Phase 3: Architecture Documentation (✅ COMPLETE)
- [x] Rack Central architecture documented
- [x] MIDI Bridge specs documented
- [x] Musical orchestration concept defined
- [x] Service health monitoring designed
- [x] Emergency protocols (panic) documented

**Status**: Production Ready  
**Date Completed**: 2026-08-19

---

### Phase 4.1: Code Quality (✅ COMPLETE)
- [x] Dead code removal
- [x] Unused dependency cleanup
- [x] TypeScript strict mode enforcement
- [x] Logger unified across all apps
- [x] Security audit passed (0 vulnerabilities)

**Status**: Production Ready  
**Date Completed**: 2026-08-19  
**Quality Improvement**: 60% → 90%

---

## 🔄 Current Phase: Phase 4 - Optimization & Polish

### Phase 4.2: Documentation Consolidation (🔄 IN PROGRESS)
- [x] Archive old audit documents (14 files)
- [x] Create consolidated ARCHITECTURE.md
- [x] Create consolidated ROADMAP.md (this file)
- [ ] Create consolidated STATUS.md
- [ ] Organize guides in /docs/guides/
- [ ] Clean up root directory (remove 46 .md files → ~8)

**Est. Completion**: 2026-08-22

### Phase 4.3: Backup Lab & Local Data Reliability (🔄 PRIORITY)

The Backup Lab becomes the first complete product workflow of the Hub. It is the reference implementation for local-first data handling, clear machine states and safe file operations.

#### Objective
- Make the OP-1 and EP-133 backup journeys understandable, verifiable and safe before expanding to other machine tools.
- Keep the interface honest about the difference between a local folder scan and direct hardware communication.
- Use the Backup Lab as the UX model for all future machine operations.

#### Order of work
- [x] Two-column Backup Lab for OP-1 and EP-133
- [x] Shared local workspace with machine-specific backup paths
- [x] Selective category backup
- [x] Local snapshots with manifest and SHA-256 verification
- [x] Restore reports and progress feedback
- [ ] Make the central workspace selector visible and understandable from both machine columns
- [ ] Add explicit provenance badges: MACHINE, LOCAL, PROFILE, DEMO, EXPERIMENTAL, VERIFIED
- [ ] Rename and separate the states “scan local folder” and “read machine” in the interface
- [ ] Show detected categories, file counts and estimated size before backup
- [ ] Add clear backup states: prepared, running, complete, verified, partial and failed
- [x] Add a restore preparation screen with comparison before writing — preflight lists
      what will be created and what will be replaced, with sizes, before the first write.
      Cancelling at that point leaves the target untouched.
- [x] Create an automatic return point before overwriting files during restore — files
      about to be replaced are copied into `_point-de-retour/<timestamp>/` inside the
      target, preserving their original tree, before anything is written. The path is
      reported on success and on failure — a restore that stops midway previously left
      the target half-overwritten with no indication of where the originals went.
- [~] Report overwritten, skipped, incompatible and unchanged files — created and
      replaced counts are reported; skipped and incompatible are not yet distinguished.
- [ ] Add Simple / Workshop density modes
- [ ] Add tests for empty workspace, permission loss, partial scan, interrupted copy and restore safety
      - Test infrastructure is now in place: vitest configured for studio-hub, `test`
        and `test:watch` scripts, test step wired into CI, verified inside the
        `oven/bun` container the workflow uses. 114 tests currently pass.
- [~] Validate OP-1 and EP-133 flows with real hardware before declaring hardware support complete
      - [x] OP-1 Disk Mode read path validated on real hardware (2026-08-20): device mounted
            read-only, 66 files / 270 MB copied and compared byte-for-byte with `cmp`,
            zero divergence. Categories present: tape, album, drum, synth.
      - [ ] OP-1 restore path — not attempted; no return point exists yet (see below)
      - [ ] EP-133 — no mass-storage mode; its sounds are reachable only through SysEx
            (`listMachineSounds`), so validation requires the browser with SysEx granted

#### Product rule
The interface must never imply that a machine was read or written when the application only inspected or copied a local folder. Every operation must state its source, destination, risk and verification result.

**Acceptance target**: a new user can identify the machine, destination, selected content and operation risk in under five seconds; no restore can start without a comparison and explicit confirmation.

**Estimated sequence**: reliability foundations → restore safety → real hardware validation → visual polish.

---

### Phase 4.3b: Audio Engine & Test Foundations (✅ DONE — 2026-08-20)

Delivered alongside the Backup Lab study, recorded here because none of it
appeared on the roadmap.

#### Audio engine
- [x] Every one of the 83 rack parameters now reaches the sound. An audit found
      33 controls that moved without changing anything: `pl_synth` was a bare
      square wave despite advertising bitcrush, sample-rate division, arpeggio,
      duty cycle and glitch; `faust_dsp` advertised a wavefolder and folded
      nothing; `mi_clouds` had no grains at all.
- [x] Six shared DSP building blocks extracted to `core/audio/dsp.ts`: impulse
      response, bitcrush curve, saturation and wavefolding curves, pulse wave,
      LFO attachment, damped feedback loop. One block serves several engines.
- [x] ADSR envelope on a native `GainNode`, replacing a constant gain cut short
      — that discontinuity clicked on every note.
- [x] Note-off, polyphony and key-repeat suppression. MIDI channel mask fixed:
      only channel 1 was recognised. Velocity-zero note-off now handled, which
      is what the EP-133 actually sends.
- [x] Oscilloscope reads a real `AnalyserNode`. It previously drew hardcoded
      sine formulas bearing no relation to the sound.

#### Tests
- [x] vitest configured for studio-hub, scoped so ep133-studio keeps its own
      suites. CI runs it; verified inside the `oven/bun` container.
- [x] 114 tests: DSP blocks, profile persistence, patch search, keyboard
      layout, MIDI control mapping, and a structural guard on the rack.
- [x] Every group verified by sabotage — each deliberate break fails its own
      test and no other. A test that cannot fail proves nothing.
- [x] The structural guard exists because the rack file was once pushed
      truncated, 478 lines short, with tool output pasted into line 1 and the
      DSP gone. Typecheck passed, build passed, the app launched. It also
      caught three parameters an earlier manual audit had missed: `dxAlgorithm`,
      `surgeWavetable` and `fluidPreset` were read only to fill a toast string.

#### Infrastructure
- [x] Coolify deploy steps removed from CI. They called three secrets that were
      never set, and duplicated what Coolify already does by watching the repo.
- [x] Single lockfile. `package-lock.json` removed and gitignored; Dockerfile
      and CI both read `bun.lock`.
- [x] Self-signed HTTPS dropped from the dev server. Chrome blocks powerful
      features on a certificate-error origin, which made Web MIDI report no
      devices at all — with no error. `http://localhost` is a secure context
      without a certificate.

---

### Phase 4.4: Performance Optimization (⏳ PLANNED)
- [ ] MIDI latency profiling (< 20ms target)
- [ ] Audio synthesis optimization
- [ ] React component memoization
- [ ] Bundle size analysis & optimization
- [ ] Load time profiling

**Est. Start**: 2026-08-23  
**Est. Completion**: 2026-09-01

### Phase 4.5: Health Monitoring Dashboard (⏳ PLANNED)
- [ ] Service health status UI
- [ ] MIDI Clock visualization
- [ ] Dissonance detection alerts
- [ ] Real-time latency display
- [ ] Panic event logging

**Est. Start**: 2026-08-26  
**Est. Completion**: 2026-09-08

---

## 🚀 Future Phases: Phase 5+

### Phase 5: Advanced Features (🔮 PLANNED)
- [x] MIDI mapping customization UI — delivered 2026-08-20, reachable from
      Settings. OP-1 uses `StudioMachinePanel` in config mode; EP-133 uses
      `MachineTestPage`. Both learn by listening: pick a control, actuate it on
      the machine, the incoming message becomes its signature. Assignments
      persist per machine.
- [ ] Advanced patch management system
- [ ] Cloud synchronization (optional)
- [ ] Extended plugin ecosystem
- [ ] Cross-device networking

**Est. Start**: 2026-09-10

### Phase 6: Production Hardening (🔮 PLANNED)
- [ ] Security audit
- [ ] Performance benchmarking
- [ ] Release candidate builds
- [ ] User testing program
- [ ] Final polish & release

**Est. Start**: 2026-10-01

---

## 📊 Current Status

### Services Status

| Service | Status | Last Update |
|---------|--------|-------------|
| OP-1 Studio | ✅ Running | 2026-08-19 |
| EP-133 Studio | ✅ Running | 2026-08-19 |
| Audio Rack (15 engines) | ✅ Running | 2026-08-19 |
| MIDI Bridge | ✅ Functional | 2026-08-19 |
| Master Clock | ✅ Synced (24 PPQN) | 2026-08-19 |

### Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Architecture | ✅ Complete | Documented & aligned |
| Dependencies | ✅ Synchronized | All at compatible versions |
| Testing | ⏳ In Progress | E2E tests for main flows |
| Documentation | 🔄 Consolidating | 46 → 8 files planned |
| Performance | ⏳ Planned | Latency optimization |

---

## 🎯 Key Metrics & Targets

### Synchronization
- **MIDI Clock**: 24 PPQN (standard)
- **Latency Target**: < 50ms (currently < 20ms)
- **BPM Range**: 40-240 BPM
- **Services**: 3 main apps + extensible

### Architecture
- **Lines of Code**: ~45,000
- **TypeScript Coverage**: 92%
- **Test Coverage**: Target 80%+
- **Bundle Size**: Target < 2MB

---

## 📅 Timeline Summary

```
2026-08-14    Phase 1: Foundation       ✅
2026-08-16    Phase 2: Integration      ✅
2026-08-19    Phase 3: Documentation    ✅
2026-08-19    Phase 4.1: Code Quality   ✅
2026-08-22    Phase 4.2: Doc Polish     🔄
2026-09-01    Phase 4.3: Performance    ⏳
2026-09-08    Phase 4.4: Monitoring     ⏳
2026-09-30    Phase 5: Advanced         🔮
2026-10-31    Phase 6: Production       🔮
```

---

## 🎼 Musical Metaphor Progress

The project applies orchestration principles to service architecture:

```
✅ Infrastructure (The Concert Hall) - Complete
   └─ Monorepo, packages, basic integration

✅ Score (The Composition) - Complete
   └─ Architecture design, MIDI Bridge specs

✅ Ensemble (The Musicians) - Complete
   └─ All three apps integrated and communicating

✅ Rehearsal - Warm-up (Code Cleanup) - Complete
   └─ Type safety, logging, code quality

🔄 Rehearsal - Performance (Optimization) - In Progress
   └─ Performance tuning, monitoring, bug fixes

⏳ Concert (Production) - Planned
   └─ Release, user testing, feature expansion
```

---

## 🔗 Related Documents

- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - Technical architecture
- [RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md](../RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md) - Musical concept
- [STATUS.md](#current-status) - Current detailed status
- [STARTUP_GUIDE.md](../STARTUP_GUIDE.md) - Getting started

---

## 📝 Notes

- All phases build on previous work
- Parallel workstreams possible where noted
- Dates are estimates based on current velocity
- Scope can be adjusted based on feedback

---

**Last Updated**: 2026-08-20  
**Next Review**: 2026-08-25  
**Owner**: Engineering Team
