# Engineering Studio 🎛️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20DSP-00ed95.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Web MIDI](https://img.shields.io/badge/MIDI-Web%20MIDI%20API-38bdf8.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
[![Local-First](https://img.shields.io/badge/Architecture-Local--First-ff5a1f.svg)](#)

[🇫🇷 Français](./README.fr.md) • [🇬🇧 English](./README.en.md) • [🇪🇸 Español](./README.es.md)

---

## 🌐 Provisional Online Address / Adresse Provisoire / Dirección Provisional
- **Live Online Hub:** [https://engineering-studio.duckdns.org](https://engineering-studio.duckdns.org)
- **GitHub Repository:** [https://github.com/propann/Engineering-Studio](https://github.com/propann/Engineering-Studio)

---

## ⚡ Overview / Présentation / Resumen

### English 🇬🇧
**Engineering Studio** is a browser-based, local-first studio workspace and DSP hardware synthesis rack for Teenage Engineering instruments (OP-1, OP-1 field, EP-133 K.O. II) and Eurorack modular synthesizers. It works 100% offline in your browser with zero data sent to external servers.

- **15 Audio Engines:** Mutable Instruments (Plaits, Braids, Rings, Clouds, Elements), Dexed DX7 FM, Surge XT, Open303 Acid Bass, pl_synth GameBoy chiptune, amsynth, ZynAddSubFX, Helm, FluidSynth SF2, AMY Engine, Faust DSP.
- **Pixel Art Hardware Faceplates:** Dedicated interactive pixel art representations of simulated hardware & Eurorack modules with live knobs, patch jacks, and OLED displays.
- **Strudel Live Coding:** Algorithmic music patterns with engine presets and audio rack integration.
- **Hardware Integration:** Bit-for-bit verified backups, sample fabrication (WAV/AIFF PCM16), and Web MIDI routing.

---

### Français 🇫🇷
**Engineering Studio** est un atelier local-first dans le navigateur pour les machines Teenage Engineering (OP-1, OP-1 field, EP-133 K.O. II) et la synthèse modulaire Eurorack. Fonctionne à 100% dans le navigateur sans transmission de données privées.

- **15 Moteurs de Synthèse :** Mutable Instruments (Plaits, Braids, Rings, Clouds, Elements), Dexed DX7 FM, Surge XT, Open303 Acid Bass, pl_synth chiptune GameBoy, amsynth, ZynAddSubFX, Helm, FluidSynth SF2, AMY Engine, Faust DSP.
- **Cartes Pixel Art Matérielles :** Rendu pixel art des façades Eurorack et machines simulées avec potentiomètres temps réel, jacks et indicateurs LED.
- **Live Coding Strudel :** Motifs algorithmiques complets avec presets de genres et documentation intégrée.
- **Intégration Matérielle :** Sauvegardes vérifiées au bit près, fabrication de samples (WAV/AIFF PCM16) et relais Web MIDI.

---

### Español 🇪🇸
**Engineering Studio** es un taller local-first en el navegador para instrumentos de Teenage Engineering (OP-1, OP-1 field, EP-133 K.O. II) y sintetizadores modulares Eurorack. Funciona 100% en el navegador sin enviar datos a servidores externos.

- **15 Motores de Síntesis:** Mutable Instruments (Plaits, Braids, Rings, Clouds, Elements), Dexed DX7 FM, Surge XT, Open303 Acid Bass, pl_synth GameBoy chiptune, amsynth, ZynAddSubFX, Helm, FluidSynth SF2, AMY Engine, Faust DSP.
- **Tarjetas Pixel Art Hardware:** Representaciones visuales pixel art de módulos Eurorack con potenciómetros en vivo, jacks y pantallas OLED.
- **Live Coding Strudel:** Patrones de música algorítmica con preajustes de género y documentación interactiva.
- **Integración Hardware:** Copias de seguridad verificadas, fabricación de muestras (WAV/AIFF PCM16) y conexión Web MIDI.

---

## 🎛️ Architecture : The Three Racks

| Rack | Domain | Location |
|---|---|---|
| **MIDI Sync** | Note generation, 30 musical scales, arpeggiator, transport clock | `packages/musique/`, `MidiSyncPanel` |
| **Audio Engines** | 15 DSP synthesis engines, 76 factory patches, offline sample export | `pages/AudioPluginRack.tsx`, `EnginePixelHardwareCard.tsx` |
| **DSP Effects** | Overdrive, 3-band parametric EQ, chorus/flanger modulation, multi-tap delay | `core/audio/effets.ts`, `racks/RackEffets.tsx` |

---

## 🚀 Quickstart / Lancement Rapide

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser
http://localhost:3000
```
