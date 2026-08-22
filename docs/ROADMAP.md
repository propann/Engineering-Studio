# 🗺️ PROJECT ROADMAP

**Consolidated roadmap for Engineering-Studio**

---

## 📋 Quick Links

- **Physical tests**: [TESTS_PHYSIQUES.md](TESTS_PHYSIQUES.md) — what the 366
  automated tests cannot prove. A sample that sounds wrong, a file the OP-1
  refuses, a latency you can feel: none of those fail a test suite.

- **Current Status**: See [STATUS.md](#current-status)
- **Architecture**: See [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)
- **Getting Started**: See [STARTUP_GUIDE.md](guides/STARTUP_GUIDE.md)

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

### Phase 4.2: Documentation Consolidation (🔶 1 item left)
- [x] Archive old audit documents (14 files)
- [x] Create consolidated ARCHITECTURE.md
- [x] Create consolidated ROADMAP.md (this file)
- [x] Create consolidated STATUS.md — exists and refreshed 2026-08-21. It carries the
      truth table and names explicitly what must NOT be declared validated: restore
      *through the application* towards a machine. The write mechanism is proven; its
      orchestration is not.
- [ ] Organize guides in /docs/guides/
- [x] Clean up root directory — 9 .md files remain at root (README, INDEX,
      GETTING_STARTED, DEPLOIEMENT, MODULES_STATUS, AUDIO_RACK_README,
      AUDIO_RACK_ROADMAP) — 7, under the ~8 target. The four deployment documents
      (1618 lines across DEPLOYMENT, DEPLOY_README, DEPLOY_SECRETS and
      docs/guides/COOLIFY_DEPLOYMENT) were merged into a single DEPLOIEMENT.md on
      2026-08-21, dropping what described machinery this project does not have.

**Dernière passe d'alignement** : 2026-08-21

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
- [x] Rename and separate the states “scan local folder” and “read machine” (2026-08-21).
      The labels now say the DIRECTION — "Copier OP‑1 → cet ordinateur", "Écrire cet
      ordinateur → OP‑1" — and the storage folder is named for what it is,
      "SAUVEGARDES · CET ORDINATEUR", never for a machine. Naming it after the OP-1
      would have made the user pick the machine as the destination of its own backup:
      it would write over itself.
      The label adapts per machine, and the EP-133 shows "Dossier EP‑133", never
      "Disque" — it has no mass-storage mode at all, so the word would be a lie.
      Four tests lock this against regression: it carries the product rule, not a
      writing preference.
      Jargon removed with it — snapshot, réinjecter, workspace. Six more tests keep it
      from creeping back through a copy-paste from an old label.
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
        `oven/bun` container the workflow uses. 515 tests passed at that point.
- [~] Validate OP-1 and EP-133 flows with real hardware before declaring hardware support complete
      - [x] OP-1 Disk Mode read path validated on real hardware (2026-08-20): device mounted
            read-only, 66 files / 270 MB copied and compared byte-for-byte with `cmp`,
            zero divergence. Categories present: tape, album, drum, synth.
      - [x] OP-1 write path validated on real hardware (2026-08-21): a full verified
            backup first (66 files, byte-compared, zero divergence), then a different
            version of `synth/user/8.aif` written to the device — same size, different
            content, the case a size comparison would miss. Unmounted and remounted
            before re-reading, so the check reads the device and not the kernel cache;
            that step is the one that gets skipped, and skipping it makes the whole
            verification meaningless. Original restored afterwards, 66 files re-checked,
            zero divergence. The OP-1 re-scans its volume on each disconnect and reports
            normally after these writes, so writing from Linux does not confuse it.
      - [ ] OP-1 restore path *through the application* — the mechanism is proven, its
            orchestration (prevolRestauration, return point, restoreBackup loop) is not.
            Fixtures are ready in `_essai-coffre/`, built on 7 genuinely divergent files.
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
- [x] 515 tests at the time: DSP blocks, profile persistence, patch search, keyboard
      layout, MIDI control mapping, and a structural guard on the rack.
- [x] Every group verified by sabotage — each deliberate break fails its own
      test and no other. A test that cannot fail proves nothing.
- [x] The structural guard exists because the rack file was once pushed
      truncated, 478 lines short, with tool output pasted into line 1 and the
      DSP gone. Typecheck passed, build passed, the app launched. It also
      caught three parameters an earlier manual audit had missed: `dxAlgorithm`,
      `surgeWavetable` and `fluidPreset` were read only to fill a toast string.

#### ProfileCreator — profile now recoverable from the workspace folder (2026-08-21)
- [x] The profile was written to two places and read back from one. It goes to
      localStorage *and* to `profile_<NAME>.json` inside the chosen folder — but nothing
      ever opened that file. Clearing browser data wiped the profile (expected), and
      re-selecting the folder found the file sitting there without ever reading it, so
      everything had to be retyped. The "delete local profile" button even promised that
      "the file already written to the folder stays intact": the intent was always that
      it serve as a fallback; the read-back function had simply never been written.
      Added as pure, tested functions in core/profile.ts: `nomFichierProfil`,
      `estFichierProfil`, `profilsDuDossier`, `lireProfilDepuisTexte`,
      `profilLePlusRecent`.
      Two behaviours, deliberately different: an empty form loads straight away (that is
      what the user came for), a form with data asks first (overwriting typing would be
      destructive). On mount, the folder is only consulted when localStorage came back
      empty — otherwise it would prompt on every page load for nothing.
      `lireProfilDepuisTexte` never touches localStorage, unlike `readProfile`, which
      *erases* the local profile when it cannot parse it. Applying that to a folder file
      would destroy the browser copy — the only still-valid one — because of a corrupt
      file elsewhere. A test locks this.
- [x] Same permission bug as BackupLab, fixed here too. The handle was restored from
      IndexedDB and used immediately, with no check; "Choisir un dossier" now reclaims
      the remembered folder inside the click gesture instead of forcing a re-pick.
- [x] Stale advice removed from the picker's error message. It told the user to open
      `https://localhost` and accept a self-signed certificate — the exact configuration
      that was removed because it made Web MIDI silent. `http://localhost` is a secure
      context with no certificate at all.

#### Not a bug: folder picker and Web MIDI need a secure context
- The picker "not working" on the deployed server is the URL, not the code.
  `showDirectoryPicker` is *undefined* — not merely blocked — outside a secure context,
  and `http://192.168.2.59:3000` is not one. Already documented at
  docs/FOLDER_PICKER.md:34; re-confirmed 2026-08-21 (that host answers 200 on http,
  nothing on https).
  **Web MIDI has the identical requirement**, so testing MIDI latency on that URL will
  report no devices, with no error message. Use `http://localhost:3000` on the machine
  itself, or a deployment with real TLS. Self-signed HTTPS does NOT work either —
  Chrome grants isSecureContext on a cert-error origin but refuses powerful features
  there, which cost a whole debugging session once already.

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
- [x] Handle store shared through `packages/fs-handles` (2026-08-21). The two apps
      each carried their own copy, and ep133-studio's sits **outside the tsconfig
      include** — a divergence between them, in permission code, would have been caught
      by neither the typecheck nor the tests.
      The database name stays per-app (`studio-hub-handles` vs
      `ep133-rhythm-hero-handles`): they remember different folders, and merging them
      would mean opening one app changed the other's folder. Hence a factory taking the
      name, not a single shared store. Both app-level files became thin wrappers keeping
      their historical export names, so no call site changed.
      Gotcha worth recording: an `@studio-hub/*` alias must be declared in **three**
      places — vite.config.ts, tsconfig.json paths, and vitest.config.ts, which keeps
      its own alias list. Missing the third passes typecheck and build while five test
      files fail on `Cannot find package`.

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
- [x] Favourites and tags wired into the rack (2026-08-21). `PatchSearchEngine`
      carried nine functions; only `search` was used. Favourites, tags and the
      favourites filter are now live, integrated into the existing patch list rather
      than through the separate `Patch Browser` panel — the rack already had a working
      list with search in it.
      The 91 factory patches are **constants in the source**: you cannot write a
      favourite onto them, and copying them to do so would duplicate every patch on the
      first star click. Hence `core/patchMeta.ts`, a dictionary keyed by patch id,
      merged at display time. 30 tests, and `fusionnerMetas` never mutates what it
      receives — a mutated factory patch would contaminate every list referencing it,
      and the defect would only show up elsewhere, later.
      Removed on the way: the rack declared its own `PatchPreset`, a strict subset of
      the shared one, missing `tags` and `isFavorite`. Two definitions of the same
      object, one of them amputated — that is what made a favourite impossible to
      display without changing type. The engine list was duplicated too, identically,
      engine for engine (verified before merging).
- [x] Dead duplicates removed (2026-08-21) — PatchSearchModule.tsx (452 lines) and
      audioRackStore.ts (470 lines), once their useful functions were integrated into
      the rack's own patch list: search, favourites, tags. The ENGINE stays; it is what
      delivers them. 922 lines gone, no consumer left behind.

#### Infrastructure
- [x] Coolify deploy steps removed from CI. They called three secrets that were
      never set, and duplicated what Coolify already does by watching the repo.
- [x] Single lockfile. `package-lock.json` untracked and gitignored; Dockerfile
      and CI both read `bun.lock`.
      **This line was false for a day and is worth keeping as a warning.** The
      commit that claimed to fix this (29e89d7, "Règle les trois dettes
      d'infrastructure") in fact *added* 6078 lines of package-lock.json. The
      mechanism: npm regenerates the file the moment you run `npm test` or
      `npm run build`, and a subsequent `git add -A` sweeps it straight back in.
      Deleting it is not enough — only the `.gitignore` entry makes the fix hold.
      Caught 2026-08-21 while aligning the docs against the actual repo, which is
      the only reason it surfaced: nothing in the build or the tests complains.
- [x] Self-signed HTTPS dropped from the dev server. Chrome blocks powerful
      features on a certificate-error origin, which made Web MIDI report no
      devices at all — with no error. `http://localhost` is a secure context
      without a certificate.

---

### Phase 4.4: Performance Optimization (✅ COMPLETE — 2026-08-21)
- [x] MIDI latency profiling (< 20ms target) — confirmed 2026-08-21.
      System floor, measured through the ALSA sequencer with a generated 60-note
      cadence played through Midi Through and timestamped on arrival:
        mean interval   110.42 ms against a 110.42 ms nominal (0.01 ms off)
        jitter          0.53 ms std dev, 1.02 ms worst deviation, 1.85 ms spread
      That is an UPPER bound: the measuring loop spawned a process per event, so its
      own cost is included. The OS therefore spends roughly 1 ms of the 20 ms budget,
      leaving ~19 ms for the browser and the app.
      Careful with the nominal: the generated file interleaves a 10-tick note-off, so
      consecutive note-ons are 106 ticks (110.42 ms) apart, not 96 (100 ms). Comparing
      against 100 ms shows a phantom 10 ms drift — that is the measurement being read
      wrong, not latency.
      Transport measured on the real device too — 30 s of someone actually playing the
      EP-133: 166 messages, 60 distinct strikes, notes 36-47.
        inter-message delay   7.0 us median, 58 us at the 95th percentile
        19-note burst         delivered in 0.301 ms, 16.7 us per message
      Nineteen simultaneous notes fit in 1.5% of the budget. Transport is not the
      subject; everything that costs sits after it, in the browser and the app.
      (Read the median, not the mean: the mean is 94 us, dragged by a single 3.3 ms gap
      that is a separate strike, not a delivery delay.)
      **Confirmed at the instrument**: the user reports it as instantaneous on the OP-1,
      playing through the deployed server. No perceptible latency.
      That is consistent with the measurements — 0.3 ms of transport for 19 simultaneous
      notes, ~1 ms of system floor — the 20 ms budget is never approached.
      The rack still displays a live `LATENCE MIDI` line splitting browser queue,
      processing and output buffer. Reading the exact figure stays optional: useful only
      if the latency ever becomes perceptible.
      Reproduce: see docs/MESURE_LATENCE_MIDI.md.
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
**Livré**: 2026-08-21

### Phase 4.6: The Rack Becomes a Production Tool (✅ DELIVERED — 2026-08-21)

Not on the original roadmap. It grew out of a single observation: the rack had 15
engines, 91 patches, and **no output**. It made sound you could only hear, never
keep. Everything below follows from removing that lock.

#### The keystone: engines independent of the audio context

`construireVoix` — 741 lines — was extracted from `playPluginNote`. The change fits
in one sentence: it now **receives** its context instead of fetching one, and
connects to no destination.

That opened two doors at once, and neither was possible before:
- rendering to a file with an `OfflineAudioContext`, faster than real time. A 49-note
  pack would otherwise take as many seconds as it lasts.
- layering. The function reads `p.activeEngine` and returns a free output, so several
  calls and a sum are enough.

Six tests lock the independence — no `getAudioContext`, no `masterBusRef`, no UI ref,
no browser timer. A regression on any of those would close both doors while the rack
kept playing perfectly in live, so nothing else would signal it.

#### What it made possible

- [x] **Sample factory.** One note or a chromatic C3–C7 pack, rendered offline,
      encoded to the target machine's format, written and **read back** for
      verification. Confirmed by ear: it sounds right.
      A wrinkle the plan had missed: `OfflineAudioContext` needs its length at
      creation, but how long an engine actually sounds is only known after building
      the voice — Rings is excited by a 20 ms impulse and rings far longer. Hence two
      passes: a one-frame probe, then the real render, correctly sized.
- [x] **Patch layering.** Each layer applies its OWN settings and engine. It first
      layered *engines*, reusing one parameter set — the right engine with the wrong
      settings, a sound resembling neither patch. Level is compensated by the square
      root of the layer count: uncorrelated sources add in power, not amplitude.
- [x] **One waveform per layer**, in distinct colours, active patch drawn on top.
      Summing them would have been correct and useless — you would no longer see what
      each patch contributes.
- [x] **Global effects**: delay and three-band EQ, applied after the engines so they
      cover the whole stack. They cross the offline render too — a fabricated sample
      carries the same effects as what you hear. Feedback is capped at 0.85 so a
      slider at 100% cannot produce a runaway.
- [x] **Favourites and tags** on patches, merged at display time because the 91
      factory patches are constants in the source and cannot be written to.

#### Shared packages, studios lightened

- [x] `packages/audio-formats` — AIFF reading, encoders, machine specs. The AIFF
      parser existed in **two copies**, one of them in a directory the typecheck does
      not inspect, free to diverge silently. Compared token by token before merging:
      logically identical.
- [x] `packages/fs-handles` — remembered folders and permissions, shared by both apps.
- [x] 922 lines of dead code removed once their useful parts were integrated.

#### The rack opens inside the studios (2026-08-21)

- [x] **A shared MIDI dispatcher — `packages/midi-dispatch`.** The blocking
      obstacle, and a defect that already existed between hub pages.
      `input.onmidimessage` is a *property*, not an `addEventListener`: last
      writer wins, silently. **Five** consumers wrote it — the rack, both hub
      MIDI pages, ep133's `useWebMidi`, op1's page. I first counted three; the
      two hub pages had escaped me.
      Worse than the competition, every cleanup did
      `inputs.forEach(i => i.onmidimessage = null)` — erasing *everyone else's*
      handlers. Closing one panel cut the MIDI of the page that remained. That
      is exactly the failure diagnosed this morning between two settings pages.
      All five migrated. A structural test now forbids any direct write outside
      the dispatcher: the fault is an *access*, not a type, so nothing catches
      it at compile time and it only shows in use — when two features each work
      perfectly on their own.
- [x] **The rack is embeddable.** `enTiroir` drops the TopBar (it calls
      `navigateMaquette`, so a click inside would unmount the host) and releases
      `100vh`/`100vw`. `clavierActif` gates the keyboard listeners, which sit on
      `window` — a background rack would play notes under the fingers of someone
      editing patterns.
      Two real key conflicts closed: modified keys are now ignored (ep133 uses
      Ctrl+D and Ctrl+Q, while `d` and `q` are piano keys — Ctrl+D duplicated
      *and* played an E), and `isContentEditable` joined the field guards.
      `onClose` finally wired: destructured since forever, never used, while the
      hub passed it.
- [x] **EP-133: a RACK tab** beside PATTERNS and SONG. The view selector already
      existed; grafting onto it avoided inventing another navigation. Vite keeps
      the rack in its own 91 kB chunk, shared between the hub route and the
      studio.
  - [x] **OP-1: the same panel** (2026-08-22), on the model of the two existing
        collapsible panels. One deliberate difference: it starts *folded*, unlike
        the OLED screen and the machine keyboard. The rack mounts an AudioContext
        and puts its key listeners on `window`; unfolded by default it would play
        notes under the fingers of someone driving the machine.
        The CSS rule is not cosmetic: the embedded rack asks for `height: 100%`
        and the OP-1 page is a scrolling column, so without an explicit height on
        the parent the panel exists and renders a rack of zero height — invisible
        to typecheck and build alike.
  - [x] **The rack closes its AudioContext** (2026-08-22). It created one per
        mount and never closed it; in a studio drawer each opening added one, and
        Chrome caps around six per document. At the seventh: no sound, no error.
        Deliberately a separate effect from the keyboard/MIDI cleanup, which
        depends on `clavierActif` and re-runs on every drawer toggle — closing the
        context there would have killed it mid-session, the inverse fault and a
        worse one. The bus, analyser and reverb refs are nulled alongside the
        context: React strict mode re-runs the effect on the *same* instance, so
        with the same refs.
  - [x] **Delay locked to the host studio's tempo** (2026-08-22). The plan called
        this "a free win: the rack starts and stops with the studios, at the same
        BPM". That was wrong, and it is corrected rather than simulated: the rack
        has no transport. No play, no stop, no playhead. There is nothing to
        start. What genuinely depends on tempo is the delay time and the arp
        speed. The delay is wired; the arp waits for module 5, which rebuilds the
        arpeggiator entirely.
        `core/audio/tempo.ts` — pure BPM + division → ms, dotted and triplet
        included, 14 tests. Two of them were instructive by being wrong first: the
        20 ms floor never fires (at the highest tempo and shortest division we are
        still at 33 ms, so the `Math.max` is defensive, not functional), and the
        menu groups by base value the way every sequencer does, not by strictly
        descending duration.

#### Three racks, three jobs (2026-08-22)

The architecture the user named: a **MIDI rack** that produces notes, an
**engines rack** that turns them into sound, an **effects rack** that treats it.
It decides where a feature goes, and the arpeggiator is the case that proves it
— placed in the engines rack it would only arpeggiate that rack; where it is, it
reaches everything that listens.

  - [x] **The engines rack was deaf.** Only the two studios listened for
        `hub:midi-note`. Anything the hub played reached the OP-1 and the EP-133
        but not the rack — the only instrument the hub has with no hardware
        plugged in. Fixed, with a distinct voice prefix (`hub:` rather than
        `midi:`) so a note played on the keyboard *and* arpeggiated does not cut
        itself off.
  - [x] **Arpeggiator and scales in the MIDI rack** (module 5). Eleven scales
        including both pentatonics, six patterns, all pure in
        `core/midi/musique.ts`. Two details that are audible: the octave wrap
        (a B in C major pentatonic is 2 semitones from A but only 1 from the C
        above — ignoring it flattens every leading tone), and up-down running
        2n-2 steps rather than 2n, so the extremes don't sound twice in a row.
        A real fault the tests caught, in my own guard: normalising a negative
        index by adding `Number.MAX_SAFE_INTEGER` before the modulo pushed the
        sum out of representable range, and index 2 became 1. The protection
        broke the ordinary case.
        What matters in the panel is leaving no note hanging: every step
        releases the previous one, stopping clears the timer *and* releases,
        PANIC kills the arpeggiator before anything else, and unmount writes
        note-offs straight to the ports — `broadcastNote` depends on React state
        that is already gone.
  - [x] **Effects rack extracted** (`core/audio/effets.ts`), with saturation
        (module 8) and chorus (module 9). It existed in the UI but not in the
        code: the chain lived in the middle of the engines rack's 3900 lines, so
        the separation was a label. The DSP for both new effects was already in
        `dsp.ts` — `buildSaturationCurve`, `attachLfo` — with nothing calling it.
        The real gain is in the tests. The invariants used to be checked by
        *reading* the source: the old test looked for the literal string
        `Math.min(0.85, Math.max(0, p.fxDelayFeedback / 100))`, so reordering the
        two bounds (harmless) would fail it while raising the ceiling to 0.95
        (not harmless) meant editing the test at the same spot — no friction at
        all. The new one checks what matters: feedback stays strictly below 1
        for every slider value.
  - [x] **Every rack carries its own interface** (2026-08-22). The user's word for
        it was balance — *c'est comme de la musique, il faut de l'équilibre* —
        and the imbalance was concrete: the effects logic had been extracted but
        its 94 lines of controls still lived in the middle of the engines rack.
        The separation existed by half, and nothing stopped the next one from
        moving back in. A test forbids it now: no `fx-groupe` may reappear in the
        engines rack.
        The interface racks are **controlled, not autonomous** — they receive
        their values and return their changes. Not a convenience: patches write
        effect settings, so the engines rack has to push them down. A component
        owning its own state would show the previous setting after a patch
        change. Same shape as `SelecteurGamme`.
  - [x] **All the scales** (2026-08-22) — 29 in `packages/musique`, shared so the
        studios can reach them, which is the precondition for the selector being
        placeable anywhere. Full major modes, harmonic and melodic minor, the
        symmetric scales, nine world scales, three jazz. One correction on the
        way: what was labelled "japonaise (in sen)" was in fact miyako-bushi —
        right degrees, wrong name. Both now exist under their own.
        `ORDRE_GAMMES` is *derived* from the families: two lists would diverge on
        the first scale added, and the missing one would simply be absent from
        the menu with no error anywhere. The tests check musical correctness, not
        just shape — modes against rotations of the major scale, symmetric scales
        against their own transposition.
  - [ ] **Flanger and phaser** — the chorus is in, the other two modulations are
        not.
  - [ ] **Multi-tap delay** (module 2) — single tap plus tempo SYNC today.
  - [ ] **ADSR controls** (module 4) — the envelope exists, the knobs don't.

#### Dead code swept from the studios (2026-08-21)

752 lines removed, verified unreferenced — static imports, dynamic imports and
string mentions all checked, since `apps/ep133-studio` sits outside the tsconfig
include and nothing there would have flagged them.

| File | Lines | What it was |
|---|---|---|
| `ep133/SynthEngineDrawer.tsx` | 389 | a **third** patch system — 25 patches across 6 engines, describing sound it never produced |
| `ep133/audioFormatUnified.ts` | 152 | a format-agnostic wrapper over WAV and AIFF |
| `ep133/SlimKeyboardBar.tsx` | 90 | |
| `op1/chatgpt-auth.ts` | 86 | |
| four smaller files | 35 | |

Two of them are worth a note rather than a silent delete:

`SynthEngineDrawer` described Dexed FM, Moog Ladder, TB-303, NES, Karplus-Strong
and Wavetable — engines the rack **actually implements**, and plays. Keeping a
parallel catalogue that produces no sound would have made the rack look
redundant while being the only one that works.

`audioFormatUnified` announced itself as "enabling future interoperability
between OP-1 and EP-133 sound libraries". That is exactly what
`packages/audio-formats` now does — the intention was right, it was simply
realised elsewhere. Deleting the stub is what makes the package the single
answer to that question.

#### Still open

- [ ] The rack as a **component reusable from the studios**, so several can be chosen
      to compose with. It is a page today, not a component — the same kind of
      extraction as the engines, at page level.
- [ ] Multi-tap delay, ADSR controls, arpeggiator — modules 2, 4, 5. See
      MODULES_STATUS.md.
- [ ] Writing the OP-1 `APPL`/`op-1` chunk, for drum kits with markers. Reading it
      already works (`drumMarkersInSeconds`).

---

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
2026-08-14    Phase 1   Foundation & Monorepo        ✅
2026-08-16    Phase 2   Service Integration          ✅
2026-08-19    Phase 3   Architecture Documentation   ✅
2026-08-19    Phase 4.1 Code Quality                 ✅
2026-08-21    Phase 4.2 Documentation Consolidation  🔶 2 items left
2026-08-21    Phase 4.3 Backup Lab & Data Safety     🔶 UI items left
2026-08-20    Phase 4.3b Audio Engine & Tests        ✅
2026-08-21    Phase 4.4 Performance Optimization     ✅
2026-08-21    Phase 4.6 Rack as Production Tool      ✅
   —          Phase 4.5 Health Monitoring            ⏳
   —          Phase 5   Advanced Features            🔮
   —          Phase 6   Production Hardening         🔮
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
- [RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md](architecture/RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md) - Musical concept
- [STATUS.md](#current-status) - Current detailed status
- [STARTUP_GUIDE.md](guides/STARTUP_GUIDE.md) - Getting started

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
