# 🛠️ Module Development Guide

Guide complet pour développer de nouveaux modules Audio Rack de manière cohérente et maintainable.

---

## 📁 Structure Standard d'un Module

```
apps/studio-hub/src/modules/audio-rack-XX-name/
├── XXProcessor.ts          # Web Audio logic
├── XXModule.tsx            # React UI component
├── XX.test.ts              # Unit tests
├── types.ts                # TypeScript interfaces
├── README.md               # Module documentation
└── styles.css              # Component styling
```

---

## 1️⃣ Créer le Fichier Types

**Fichier**: `types.ts`

```typescript
/**
 * [Module Name] Type Definitions
 */

export interface [Name]Params {
  // Parameter definitions
  param1: number;
  param2: string;
  // ...
}

export interface [Name]Config {
  enabled: boolean;
  bypass: boolean;
}
```

---

## 2️⃣ Créer le Processeur Web Audio

**Fichier**: `[Name]Processor.ts`

```typescript
import { AudioProcessor } from "@studio-hub/types/audio";
import { [Name]Params } from "./types";

/**
 * [Name] Audio Processor
 * Implements [purpose]
 */
export class [Name]Processor implements AudioProcessor {
  private ctx: AudioContext;
  private params: [Name]Params;
  private nodes: Map<string, AudioNode> = new Map();
  private outputGain: GainNode;

  constructor(audioContext: AudioContext, initialParams?: Partial<[Name]Params>) {
    this.ctx = audioContext;
    this.params = {
      // defaults
      ...initialParams,
    };

    // Initialize Web Audio nodes
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.value = 1.0;
  }

  /**
   * Connect this processor into the audio graph
   */
  process(input: AudioNode, output: AudioNode): void {
    // Connect input -> internal nodes -> output
    input.connect(this.outputGain);
    this.outputGain.connect(output);
  }

  /**
   * Update a parameter
   */
  setParameter(key: keyof [Name]Params, value: any): void {
    this.params[key] = value;
    this.updateAudioGraph();
  }

  /**
   * Get current parameter value
   */
  getParameter(key: keyof [Name]Params): any {
    return this.params[key];
  }

  /**
   * Update internal audio nodes based on current params
   */
  private updateAudioGraph(): void {
    // Apply parameter changes to Web Audio nodes
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.nodes.forEach((node) => {
      if ("disconnect" in node) {
        node.disconnect();
      }
    });
    this.nodes.clear();
  }
}
```

---

## 3️⃣ Créer le Composant React

**Fichier**: `[Name]Module.tsx`

```typescript
import React, { useState, useEffect } from "react";
import { useAudioRackStore } from "@studio-hub/core/store";
import { Slider } from "@studio-hub/components/common";
import { [Name]Params } from "./types";
import { log } from "@studio-hub/core/logger";

/**
 * [Name] Module Component
 * UI for [Purpose]
 */
export function [Name]Module() {
  const [params, setParams] = useState<[Name]Params>({
    // defaults
  });

  // Use Zustand store for persistence
  const store = useAudioRackStore();

  const handleParamChange = (key: keyof [Name]Params, value: any) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    // Update global store
    store.setEngineParam(`[name]_${key}`, value);
    log.debug(`[${Name}Module] Updated: ${key} = ${value}`);
  };

  return (
    <div className="audio-rack-module [name]-module">
      <h3>[Module Name]</h3>

      <div className="module-controls">
        <Slider
          label="Parameter 1"
          min={0}
          max={100}
          step={1}
          value={params.param1}
          onChange={(v) => handleParamChange("param1", v)}
        />

        <Slider
          label="Parameter 2"
          min={0}
          max={100}
          step={1}
          value={params.param2}
          onChange={(v) => handleParamChange("param2", v)}
        />
      </div>

      <div className="module-info">
        <small>Status: OK | CPU: ~2%</small>
      </div>
    </div>
  );
}

export default [Name]Module;
```

---

## 4️⃣ Créer les Tests

**Fichier**: `[Name].test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { [Name]Processor } from "./[Name]Processor";

describe("[Name]Processor", () => {
  let processor: [Name]Processor;
  let audioContext: AudioContext;

  beforeEach(() => {
    // Create offline audio context for testing
    audioContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
      2,
      44100,
      44100
    );
    processor = new [Name]Processor(audioContext);
  });

  it("should initialize with default parameters", () => {
    expect(processor.getParameter("param1")).toBeDefined();
  });

  it("should update parameters", () => {
    processor.setParameter("param1", 50);
    expect(processor.getParameter("param1")).toBe(50);
  });

  it("should process audio without errors", () => {
    const input = audioContext.createBufferSource();
    const output = audioContext.createGain();

    expect(() => {
      processor.process(input, output);
    }).not.toThrow();
  });

  it("should cleanup resources", () => {
    expect(() => {
      processor.dispose();
    }).not.toThrow();
  });
});
```

---

## 5️⃣ Créer la Documentation

**Fichier**: `README.md`

```markdown
# [Module Name]

## Description
[Brief description of what this module does]

## Parameters
| Name | Range | Default | Description |
|------|-------|---------|-------------|
| param1 | 0-100 | 50 | Description |
| param2 | 0-100 | 50 | Description |

## Usage

```typescript
import { [Name]Processor } from "./[Name]Processor";

const processor = new [Name]Processor(audioContext);
processor.setParameter("param1", 75);
```

## Performance
- CPU Usage: ~X%
- Memory: ~XMB
- Latency: <10ms

## References
- [Link to research paper or documentation]
```

---

## 6️⃣ Intégrer dans le Composant Principal

**Fichier**: `apps/studio-hub/src/pages/AudioPluginRack.tsx`

```typescript
import { [Name]Module } from "@studio-hub/modules/audio-rack-XX-name";

export default function AudioPluginRack() {
  return (
    <div className="audio-plugin-rack">
      {/* ... */}
      <[Name]Module />
      {/* ... */}
    </div>
  );
}
```

---

## 🎨 Styling Guidelines

Tous les modules doivent suivre la structure CSS commune:

```css
.audio-rack-module {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  margin-bottom: 1rem;
}

.audio-rack-module h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.module-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.module-info {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.85rem;
}
```

---

## 🧪 Checklist de Validation

- [ ] Type definitions complètes
- [ ] Processeur Web Audio implémenté
- [ ] Composant React avec Zustand integration
- [ ] Tests unitaires (>80% coverage)
- [ ] Documentation README
- [ ] CSS styling cohérent
- [ ] Performance profilée (<10% CPU)
- [ ] Pas de memory leaks
- [ ] Fonctionne sur mobile
- [ ] Intégré dans AudioPluginRack
- [ ] Tested end-to-end avec d'autres modules

---

## 📊 Template Complet d'un Processeur

```typescript
import { AudioProcessor } from "@studio-hub/types/audio";

export class ExampleProcessor implements AudioProcessor {
  private ctx: AudioContext;
  private dry: GainNode;
  private wet: GainNode;
  private output: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.output = ctx.createGain();

    this.dry.gain.value = 0.5;
    this.wet.gain.value = 0.5;
    this.output.gain.value = 1.0;
  }

  process(input: AudioNode, output: AudioNode): void {
    input.connect(this.dry);
    input.connect(this.wet); // Imagine wet processing here

    this.dry.connect(this.output);
    this.wet.connect(this.output);
    this.output.connect(output);
  }

  setParameter(key: string, value: any): void {
    if (key === "mix") {
      this.dry.gain.value = (100 - value) / 100;
      this.wet.gain.value = value / 100;
    }
  }

  getParameter(key: string): any {
    if (key === "mix") {
      return (this.wet.gain.value / (this.wet.gain.value + this.dry.gain.value)) * 100;
    }
    return 0;
  }
}
```

---

## 🔗 Ressources Utiles

- [Web Audio API Spec](https://www.w3.org/TR/webaudio/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Audio Types](https://github.com/microsoft/TypeScript/blob/main/lib/lib.dom.d.ts)

---

**Dernière mise à jour**: 2026-08-20  
**Auteur**: Audio Rack Team
