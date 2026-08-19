# 🎼 STUDIO HUB ARCHITECTURE

**Comprehensive Overview of the Rack Central System**

---

## 📚 Quick Navigation

- **Quick Start**: See [STARTUP_GUIDE.md](../../STARTUP_GUIDE.md)
- **Rack Orchestration**: See [RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md](../../RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md)
- **Implementation Details**: See below

---

## 🎛️ Rack Central Architecture

### System Overview

**Studio Hub** operates as a **Rack Central (Unified Chassis)** system instead of three isolated applications:

```
┌──────────────────────────────────────────────────────┐
│           STUDIO HUB: THE CENTRAL CHASSIS            │
│                                                      │
│  ├─ Master MIDI Clock (24 PPQN)                    │
│  ├─ Profile & Settings Manager                     │
│  ├─ Vault & Backup Engine (SHA-256)                │
│  ├─ Sound Library & Audio Analysis                 │
│  └─ Workspace Manager (File System Access)         │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┴───────────┐
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│  OP-1 STUDIO     │  │  EP-133 STUDIO   │
│  (Rack Module)   │  │  (Rack Module)   │
└──────────────────┘  └──────────────────┘
```

---

## 🔌 MIDI Bridge (@studio-hub/midi-bridge)

The central orchestration system coordinating all services.

### Core Message Types

```typescript
// 1. TRANSPORT MESSAGE (Tempo/Synchronization)
interface HubTransportMessage {
  type: "hub-transport";
  action: "start" | "stop";
  bpm: number;              // 40-240 BPM
  timestamp: number;        // Exact timing
}

// 2. NOTE MESSAGE (Musical Notes)
interface HubNoteMessage {
  type: "hub-note";
  action: "note-on" | "note-off";
  note: number;            // 0-127 MIDI note
  velocity: number;        // 0-127 force
  channel: number;         // 0-15 MIDI channel
  timestamp: number;       // Precise timing
}

// 3. PANIC MESSAGE (Emergency Reset)
interface HubPanicMessage {
  type: "hub-panic";
  timestamp: number;  // All-Notes-Off on all channels
}
```

### MIDI Clock (24 PPQN)

Synchronizes all services to a common tempo:

```
Tempo: 120 BPM = 500ms per beat
Clock ticks: 24 per beat (PPQN = Pulses Per Quarter Note)
Interval: 500ms / 24 = ~20.83ms between ticks

Services receive clock updates at regular intervals,
maintaining perfect synchronization across the system.
```

---

## 🎭 Service Architecture

### OP-1 Studio Module

**Role**: Classic synthesizer and tape interface

```
Features:
├─ Tape & Album Studio (recording/playback)
├─ Synth & Drum Patch Editor
├─ Sample Editor (AIFF 44.1kHz/16-bit)
├─ Display Pixel & Theme Editor
└─ Firmware Lab & Modding Tools

Communication:
├─ Receives: MIDI notes, transport messages
├─ Sends: MIDI data, control changes
└─ Sync: Follows Master MIDI Clock
```

### EP-133 Studio Module

**Role**: Sampler and rhythm production

```
Features:
├─ Pattern & Song Studio
├─ Pad & Sound Manager (64/128 Mo)
├─ SysEx & Machine Diagnostic
├─ Rhythm Hero (Finger Drumming Lab)
└─ Project Clone & Transfer Engine

Communication:
├─ Receives: MIDI notes, transport messages
├─ Sends: MIDI data, SysEx messages
└─ Sync: Follows Master MIDI Clock
```

### Audio Plugin Rack (Studio Hub)

**Role**: Digital Eurorack with 15 synthesis engines

```
Mutable Instruments Suite:
├─ PLAITS (16-Engine Macro Oscillator)
├─ BRAIDS (33-Model Macro Synth)
├─ RINGS (Resonator & Physical Modeling)
├─ CLOUDS (Granular Texture Synthesizer)
└─ ELEMENTS (Modal Physical Modeling)

Open Source Engines:
├─ DEXED FM (6-Op FM Synthesis)
├─ SURGE XT (Hybrid Wavetable)
├─ ZYNADDSUBFX (Additive Synthesis)
├─ HELM (Polyphonic Modulation)
├─ FLUIDSYNTH (SoundFont Player)
├─ AMSYNTH (Dual VCO Analog)
├─ AMY C/JS (Additive Engine)
├─ PL_SYNTH (8-Bit Chiptune)
├─ OPEN303 (TB-303 Acid Emulator)
└─ FAUST DSP (Compiled DSP Engine)
```

---

## 🔄 Data Flow

### Normal Operation

```
User Input (Keyboard/MIDI/Mouse)
    ↓
Service A processes request
    ↓
Sends MIDI note via MIDI Bridge
    ↓
All services receive:
    ├─ Note message
    ├─ Clock tick
    └─ Status update
    ↓
Services update internal state
    ↓
Audio output + UI update
```

### Synchronization Loop (1 Beat)

```
Beat Start (0ms)
├─ Transport: "start" / BPM=120
├─ All services: acknowledge
│
├─ Clock Tick 1 (0ms)
├─ Clock Tick 2 (20.83ms)
├─ Clock Tick 3 (41.66ms)
├─ Clock Tick 4 (62.5ms)
│
├─ User plays note
├─ All services synthesize/process
│
├─ User releases note
├─ All services stop note
│
└─ Beat End (500ms) → Ready for next beat
```

---

## 🎼 Orchestration Concept

See [RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md](../../RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md) for detailed explanation of:

- **Musical Orchestration** applied to services
- **Harmony Detection** (health monitoring)
- **Dissonance Protocol** (error handling)
- **Panic Recovery** (emergency reset)

---

## 📦 Shared Packages

### @studio-hub/midi-bridge

```typescript
export interface HubTransportMessage
export interface HubNoteMessage
export interface HubPanicMessage
export interface MidiPacket
export interface ClockWindow

// Core functions
buildMidiNotePacket()
buildMidiPanicPackets()
buildMidiRealtimePacket()
buildMidiClockWindow()
parseMidiNotePacket()
createHubTransportMessage()
createHubNoteMessage()
createHubPanicMessage()
```

### @studio-hub/audio-bridge

Audio analysis and synthesis utilities:

```typescript
analyzeWavBuffer()
analyzeAiffBuffer()
encodeMonoAiff16Bit()
detectAudioDuplicatesSha256()
```

---

## 🏗️ Layer Architecture

```
┌────────────────────────────────────────┐
│  USER INTERFACE LAYER                  │
│  (React UI, keyboard, MIDI input)      │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  APPLICATION LAYER                     │
│  (OP-1, EP-133, Audio Rack)            │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  ORCHESTRATION LAYER                   │
│  (@studio-hub/midi-bridge)             │
│  - Transport routing                   │
│  - Note distribution                   │
│  - Clock synchronization               │
│  - Panic management                    │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  MIDI PROTOCOL LAYER                   │
│  (MIDI 1.0 standard)                   │
│  - Status bytes                        │
│  - Note data                           │
│  - Velocity                            │
│  - Channel routing                     │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  AUDIO ENGINE LAYER                    │
│  (Web Audio API)                       │
│  - Real-time synthesis                 │
│  - DSP processing                      │
│  - Output routing                      │
└────────────────────────────────────────┘
```

---

## ✅ Key Design Principles

1. **Modularity** - Services are independent, communicate via MIDI
2. **Synchronization** - All services follow Master Clock
3. **Loose Coupling** - Standard MIDI protocol for compatibility
4. **Real-time Performance** - < 50ms latency requirement
5. **Graceful Degradation** - Panic protocol for error recovery
6. **Extensibility** - Easy to add new services/engines

---

## 📊 Current Status

- ✅ Monorepo structure unified
- ✅ Dependencies synchronized (npm)
- ✅ MIDI Bridge functional
- ✅ All three studio apps running
- ✅ Architecture documented
- 🔄 Monitoring dashboard in development

---

## 📚 Related Documentation

- [RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md](../../RACK_SERVICE_ORCHESTRA_ARCHITECTURE.md) - Musical orchestration concept
- [STARTUP_GUIDE.md](../../STARTUP_GUIDE.md) - Quick start instructions
- [README.md](../../README.md) - Project overview
- [packages/midi-bridge/index.ts](../../packages/midi-bridge/index.ts) - Source code

---

**Last Updated**: 2026-08-19  
**Status**: Production Ready ✅
