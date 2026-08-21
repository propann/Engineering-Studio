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
- [x] Show detected categories, file counts and estimated size before backup — the scan
      now reports each category separately as present, empty or absent, with its own
      file count and size. The previous scan summed everything into one total and
      swallowed missing categories, so an amputated backup read as complete.
- [x] Add clear backup states: prepared, running, complete, verified, partial and failed —
      seven phases including `idle`. `complete` and `verified` stay distinct: copying and
      verifying each file does not prove the snapshot re-reads. An `ecritureCommencee` flag
      sits orthogonal to the phase, because a restore that fails *during* the return point
      finalised no file — `failed` — yet the target was modified. Contract published in
      docs/backup/CONTRAT_INTEGRATION.md for the UI to render without duplicating logic.
- [x] Add a restore preparation screen with comparison before writing — preflight lists
      what will be created and what will be replaced, with sizes, before the first write.
      Cancelling at that point leaves the target untouched.
- [x] Create an automatic return point before overwriting files during restore — files
      about to be replaced are copied into `_point-de-retour/<timestamp>/` inside the
      target, preserving their original tree, before anything is written. The path is
      reported on success and on failure — a restore that stops midway previously left
      the target half-overwritten with no indication of where the originals went.
- [x] Report overwritten, skipped, incompatible and unchanged files — the report now
      carries `ventilation { crees, remplaces, inchanges }`, and on failure a full
      `echec` block naming the interrupted file and the incomplete categories. `files`
      lists only what was actually finalised and verified, never intentions — that is
      what makes a partial report usable. Previously no report was produced at all on
      partial failure.
- [ ] Add Simple / Workshop density modes
- [x] Add tests for empty workspace, permission loss, partial scan, interrupted copy and restore safety
      - [x] empty workspace, permission loss, partial scan — covered by the source scan suite
      - [x] restore safety — preflight and return point, 24 tests
      - [x] interrupted copy mid-write — 13 tests on `copyFile` with a fake filesystem
            that truncates, corrupts, or throws during write and close. The read-back
            check proves load-bearing: removing it fails five tests, and comparing only
            length fails exactly the corrupted-same-size case.
      - Test infrastructure is now in place: vitest configured for studio-hub, `test`
        and `test:watch` scripts, test step wired into CI, verified inside the
        `oven/bun` container the workflow uses. 114 tests currently pass.
- [~] Validate OP-1 and EP-133 flows with real hardware before declaring hardware support complete
      - [x] OP-1 Disk Mode read path validated on real hardware (2026-08-20): device mounted
            read-only, 66 files / 270 MB copied and compared byte-for-byte with `cmp`,
            zero divergence. Categories present: tape, album, drum, synth.
      - [ ] OP-1 restore path — still not attempted on hardware. The return point now
            exists; the disk is deliberately mounted read-only during testing.
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

#### Workspace folder survives a reload (2026-08-21)
- [x] Permission checked before adopting a restored folder handle. IndexedDB gives the
      handle back across visits, but never the permission: the browser revokes access
      when the tab closes unless the user explicitly allowed every visit.
      BackupLab.tsx adopted the restored handle unconditionally, so after a reload the
      UI announced "ESPACE MAÎTRE: <folder>" while the read effect called
      requestPermission from inside a useEffect — with no transient user activation,
      where the browser resolves "prompt" without showing anything. Result on screen:
      a connected workspace, a red "L'accès au dossier a été refusé" banner, and an
      empty snapshot list. The only way out was to re-pick the same folder by hand.
      Added `hasStoredPermission` (silent query, safe at page load) and
      `requestStoredPermission` (needs a click) — the same split apps/ep133-studio had
      already established. BackupLab now only adopts a handle whose permission still
      holds; "Connecter" reclaims the remembered folder inside the click gesture
      instead of reopening the picker.
      Guard worth naming: the reclaim only fires when nothing is connected. That button
      reads "Changer" once a workspace is active, and without the guard it would have
      silently re-adopted the folder already stored — i.e. refused to change.
      Verified by sabotage, three guards, each failing only its own test.
      Note: the permission helpers now exist in both apps. ep133-studio sits outside
      the tsconfig include, so its copy is not typechecked; sharing them through
      packages/ is the clean follow-up.

#### Patch search wired to the rack (2026-08-21)
- [x] Patch search connected — the rack holds 91 factory patches across 15 engines
      plus the user's own, and had no way to search them: you scrolled. Meanwhile
      `PatchSearchEngine` sat in modules/audio-rack-01-patch-search, fully written
      and covered by 159 lines of green tests, imported by nobody.
      It searched a parallel Zustand store (core/store/audioRackStore.ts) persisted
      under "studio-hub-audio-rack", while the rack persists user patches under
      "studio_hub_user_patches" — a different key, so the store was always empty.
      A tested search that could never find anything, next to 91 unsearchable patches.
      Now wired straight into AudioPluginRack via `filtrerPatches`, over the real
      factory + user lists. Verified by sabotage: unfiltering one of the two engine
      lists fails exactly two tests, and making an empty search return everything
      fails exactly two more.
- [ ] Dead duplicates left to decide — PatchSearchModule.tsx (429 lines) and
      audioRackStore.ts (470 lines) are now redundant and have no consumer. Not
      removed here: the panel is UI, which belongs to the other track per
      CONTRAT_INTEGRATION.md. Either the panel gets pointed at the rack's real
      patches and the store goes, or both files go. A warning header was added to
      PatchSearchModule.tsx so the next reader is not misled.

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

### Phase 4.4: Performance Optimization (🔶 4/5 — remaining item needs hardware)
- [ ] MIDI latency profiling (< 20ms target) — blocked: needs a connected machine.
      Deferred to the next session with hardware on the bench, together with the
      OP-1 restore validation (see Phase 4.3).
- [x] Audio synthesis optimization — investigated and closed with nothing to change.
      Three hypotheses were measured rather than assumed:
      (1) buildBitcrushCurve and buildSaturationCurve rebuild 4096-element Float32Arrays
      on every note — measured at 13.5 us and 50.7 us per call, i.e. 6.4 ms of redundant
      work per 100 notes. Memoizing would have added module-level state to a purely
      functional file to save 6 ms. Not worth it. (Note for anyone revisiting:
      buildImpulseResponse must NOT be memoized — dsp-nodes.test.ts:94 averages 40 random
      draws and would become flaky.)
      (2) 71 AudioNodes are created per note and only one is ever disconnected — but that
      one is env, the last node before the master bus. Cutting it severs the subgraph's
      only path to the destination, making all 71 collectable at once. Both exit paths
      (VaultPanel-style held voices at :490, one-shots at :1415) do it. Correct as-is.
      (3) No rack setState remains in playPluginNote; the diagnostic and toast writes go
      through imperative refs that compare before writing.
      Conclusion: the real win was already taken by the RackDiagnostic/RackToast
      extraction below. There is no remaining synthesis bottleneck to remove.
- [x] React component memoization — AudioPluginRack holds 99 useState and 1160 lines of
      JSX. Four diagnostic values and the toast lived in that state, so every note and
      every incoming MIDI message re-rendered the whole tree: six full renders per note.
      Extracted into RackDiagnostic and RackToast, which hold their own state and are
      driven by imperative refs. Down to two, both justified (key pressed / released).
      This matters more than usual here: the rendering thread also schedules Web Audio
      events, and a long render delays note queueing.
- [x] Bundle size analysis & optimization — the 24 route pages were all statically
      imported, so the landing page shipped the whole application, including two full
      DAWs (ep133-studio 8800 lines, op1-studio 9500) a visitor might never open.
      Converted to React.lazy + Suspense: initial JS 1140 kB -> 205 kB, 316 kB -> 65 kB
      gzipped, CSS 253 kB -> 107 kB. Landing stays eagerly imported — it is the first
      view, deferring it would only add a spinner.
      Note: the 2 MB wavConvert chunk was already correctly deferred and documented;
      it was not the problem.
- [x] Load time profiling — measured on the production build, 2026-08-21.
      Critical path is exactly two files: index-*.js (200.7 kB / 62.6 kB gzip) and
      index-*.css (104.6 kB / 20.5 kB gzip) = 305.3 kB raw, 83.1 kB gzipped.
      index.html emits no stray modulepreload, so no lazy route is pulled in early —
      verified by grepping the entry chunk: it contains the string
      "AudioPluginRack-*.js" (the lazy reference) and zero lines of rack code.
      Transfer time for the critical path, versus before the lazy-route split:
        slow 3G (1.6 Mbps)  1618 ms -> 425 ms
        4G (9 Mbps)          288 ms ->  76 ms
        fibre (50 Mbps)       52 ms ->  14 ms
      Cross-check worth recording: Tone.js is still a dependency (7.2 MB installed,
      package.json:20) and is genuinely used — by apps/ep133-studio AudioEngine.ts:1,
      not by the rack, which dropped it for a native GainNode envelope. It lands in the
      EP133StudioPage chunk (504 kB / 141 kB gzip), which is lazy. It is NOT on the
      critical path; a substring grep for "tone" in the minified entry says otherwise
      and is a false positive.
      Not measured: parse/execute and first-paint timings, which need a real browser.
      Bytes are what this profiling covers.

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
