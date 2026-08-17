# 🎛️ ÉTUDE TECHNIQUE DÉTAILLÉE - Sound Editor

---

## 📌 1. FORMAT DES SONS OP-1

### Structure des Tags OP-1

```
OP-1 utilise un système de TAGS (marqueurs) pour les samples.

FORMAT DE TAG:
─────────────
[TAG_TYPE] value1 value2 value3 ...

TYPES DE TAGS PRINCIPAUX:
```

#### Tag: START (Début du sample)
```
Syntaxe: [start] milliseconds
Exemple: [start] 100
Signification: Le sample commence à 100ms

Valeur par défaut: 0
Range: 0 - sample_length
Importance: CRITIQUE
```

#### Tag: END (Fin du sample)
```
Syntaxe: [end] milliseconds
Exemple: [end] 2500
Signification: Le sample finit à 2500ms

Valeur par défaut: duration complète
Range: start - sample_length
Importance: CRITIQUE
```

#### Tag: PITCH (Hauteur)
```
Syntaxe: [pitch] semitones
Exemple: [pitch] -12
Signification: Décale le pitch de -12 semitones (une octave baisse)

Range: -36 à +36 semitones
Valeur par défaut: 0
Importance: MOYENNE
```

#### Tag: LOOP (Boucle)
```
Syntaxe: [loop] start_ms end_ms
Exemple: [loop] 500 2000
Signification: Boucle le sample entre 500ms et 2000ms

Valeur par défaut: none
Importance: HAUTE
```

#### Tag: RATE (Vitesse de lecture)
```
Syntaxe: [rate] multiplier
Exemple: [rate] 1.5
Signification: Joue 1.5x plus rapide

Range: 0.5 - 2.0
Valeur par défaut: 1.0
Importance: BASSE
```

### Export Format OP-1

```
Nom de fichier: [NAME]_[TAGS].wav

Exemple:
kick_s100_e2500_p0_l500-2000.wav

Structure du fichier:
├── WAV Header (44.1kHz, 16-bit, mono)
├── Audio Data
└── Metadata (tags en filename ou en ID3)

Contraintes:
- Max 12 MB par sample
- 44.1 kHz recommandé
- Mono ou Stereo
- 16-bit ou 24-bit
```

### Exemple Complet

```
BEFORE: kick.wav (original)
   Duration: 2.5 secondes
   Format: 44.1kHz, 16-bit, stereo

APRÈS TAGGING:
   Nom: kick_s50_e2400_l500-2000_p0.wav
   
   Tags appliqués:
   - Start: 50ms (silence at beginning)
   - End: 2400ms (trim tail)
   - Loop: 500-2000ms (loop portion)
   - Pitch: 0 (no change)
   
   Longueur corrigée: 2350ms (50 → 2400)
```

---

## 🥁 2. FORMAT DES PATTERNS EP-133

### Structure Pattern EP-133

```
EP-133 utilise un système de PATTERNS (séquences) avec 16 pads.

STRUCTURE:
─────────
Pattern {
  name: string
  tempo: number (40-200 BPM)
  swing: number (0-100%)
  steps: Step[]
}

Step {
  stepIndex: 0-63 (16 pads × 4 beats)
  padIndex: 0-15
  sampleIndex: number
  velocity: 0-127
  swing: 0-100
  timing: "normal" | "swing"
}
```

### 16-Pad Layout

```
OP-1 original a layout différent, mais EP-133 a:

┌─────────────┬─────────────┐
│  PAD 0      │  PAD 1      │  Row 0 (A)
├─────────────┼─────────────┤
│  PAD 2      │  PAD 3      │  Row 1 (B)
├─────────────┼─────────────┤
│  PAD 4      │  PAD 5      │  Row 2 (C)
├─────────────┼─────────────┤
│  PAD 6      │  PAD 7      │  Row 3 (D)
└─────────────┴─────────────┘

Et 8 autres pads (8-15) selon la machine

Nomenclature:
- Groups: A, B, C, D (4 groups of 3 pads)
- Total: 16 pads disponibles
```

### Sequencer Grid

```
PATTERN SEQUENCER (EP-133):

Step:  1   2   3   4   5   6   7   8
      ┌───┬───┬───┬───┬───┬───┬───┬───┐
PAD0: │ ●  │   │ ●  │   │ ●  │   │   │
      ├───┼───┼───┼───┼───┼───┼───┼───┤
PAD1: │   │ ●  │   │ ●  │   │ ●  │   │
      ├───┼───┼───┼───┼───┼───┼───┼───┤
PAD2: │ ●  │ ●  │ ●  │ ●  │ ●  │ ●  │ ●  │
      ├───┼───┼───┼───┼───┼───┼───┼───┤
      ...
      
● = Sample triggerée
  = Silence

Chaque pattern peut avoir:
- 1, 2, 4 ou 8 steps
- Variable swing per step
- Variable velocity per step
```

### Export Format EP-133

```
Format: JSON

{
  "pattern": {
    "name": "Beat 1",
    "tempo": 120,
    "swing": 50,
    "steps": [
      {
        "stepIndex": 0,
        "padIndex": 0,
        "sampleIndex": 0,
        "velocity": 127,
        "swing": 50
      },
      {
        "stepIndex": 1,
        "padIndex": 1,
        "sampleIndex": 1,
        "velocity": 100,
        "swing": 50
      }
    ]
  }
}
```

---

## 🎯 3. ALGORITHME DE CALCUL AUTO DE TAGS

### Étape 1: Détection de Silence

```javascript
function detectSilence(audioBuffer, threshold = -60dB) {
  // Analyse le buffer pour détecter les zones silencieuses
  
  const channels = audioBuffer.getChannelData(0);
  let silenceStart = null;
  let silenceRegions = [];
  
  for (let i = 0; i < channels.length; i++) {
    const power = 20 * Math.log10(Math.abs(channels[i]));
    
    if (power < threshold) {
      if (!silenceStart) silenceStart = i;
    } else {
      if (silenceStart !== null) {
        silenceRegions.push({
          start: silenceStart,
          end: i
        });
        silenceStart = null;
      }
    }
  }
  
  return {
    regions: silenceRegions,
    recommendation: {
      trimStart: silenceRegions[0]?.end || 0,
      trimEnd: silenceRegions[silenceRegions.length-1]?.start || channels.length
    }
  };
}
```

### Étape 2: Détection de Peaks

```javascript
function detectPeaks(audioBuffer, threshold = 0.5) {
  // Trouve les points d'attaque (onset detection)
  
  const channels = audioBuffer.getChannelData(0);
  const peaks = [];
  
  // Calcul de l'énergie par frame
  const frameSize = 2048;
  for (let i = 0; i < channels.length; i += frameSize) {
    let energy = 0;
    for (let j = 0; j < frameSize; j++) {
      energy += channels[i + j] ** 2;
    }
    
    if (energy > threshold) {
      peaks.push({
        index: i,
        energy: Math.sqrt(energy)
      });
    }
  }
  
  return peaks;
}
```

### Étape 3: Détection de Loops

```javascript
function detectLoops(audioBuffer) {
  // Recherche les patterns répétitifs (pour autoriser boucle)
  
  const channels = audioBuffer.getChannelData(0);
  const correlations = crossCorrelation(channels);
  
  // Analyse les corrélations pour trouver des patterns
  const loopCandidates = [];
  
  for (let lag = 1000; lag < channels.length / 2; lag++) {
    if (correlations[lag] > 0.8) { // 80% de similarité
      loopCandidates.push({
        start: 0,
        end: lag,
        confidence: correlations[lag]
      });
    }
  }
  
  return loopCandidates.sort((a, b) => b.confidence - a.confidence)[0];
}
```

### Étape 4: Détection de Pitch

```javascript
function detectPitch(audioBuffer) {
  // Algorithme ACF (Auto-Correlation Function)
  // Détecte la hauteur fondamentale
  
  const channels = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Applique FFT ou ACF
  const fundamental = detectFundamental(channels, sampleRate);
  
  // Convertir Hz → semitones
  const refHz = 440; // LA 4
  const semitones = 12 * Math.log2(fundamental / refHz);
  
  return Math.round(semitones);
}

function detectFundamental(channels, sampleRate) {
  // Retourne fréquence fondamentale en Hz
  // Pour OP-1: range typique 40Hz - 5000Hz
  
  const fft = performFFT(channels);
  const peaks = findPeaks(fft);
  
  // La plus basse fréquence est généralement la fondamentale
  return peaks[0]?.frequency || 440;
}
```

### Auto-Calculation Result

```
RÉSULTAT DE L'ANALYSE AUTOMATIQUE:

Input: kick_original.wav (3 secondes)
├── Détection de silence:
│   ├── Start: 0-50ms (silence)
│   └── End: 2450-3000ms (tail)
│
├── Détection de peaks:
│   ├── Attack: 50ms
│   └── Release: 2400ms
│
├── Détection de loops:
│   ├── Pattern: 500-2000ms (1.5s)
│   └── Confidence: 85%
│
└── Détection de pitch:
    └── Fundamental: ~60Hz (E2)

TAGS SUGGÉRÉS:
[start] 50
[end] 2400
[loop] 500 2000
[pitch] 0
```

---

## 🖱️ 4. SYSTÈME DRAG-DROP

### Interaction Model

```
USER WORKFLOW:
───────────────

1. Upload audio file
   │
   ├─ File validated
   ├─ Waveform displayed
   └─ Auto-analysis runs (optional)

2. See markers automatically placed
   │
   ├─ Start marker (red)
   ├─ End marker (green)
   ├─ Loop markers (blue) - if detected
   └─ Attack marker (yellow) - if detected

3. Drag markers to adjust
   │
   ├─ Drag START marker left/right
   ├─ Drag END marker left/right
   ├─ Drag LOOP markers
   └─ Real-time preview

4. System auto-corrects
   │
   ├─ END > START (always)
   ├─ LOOP within START-END
   ├─ Duration recalculated
   └─ Tags updated

5. Export with calculated tags
```

### Marker Component

```typescript
interface Marker {
  id: string;
  type: 'start' | 'end' | 'loopStart' | 'loopEnd' | 'attack';
  position: number; // milliseconds
  color: string;
  draggable: boolean;
  constraints?: {
    min?: number;
    max?: number;
  };
}

interface MarkerProps {
  markers: Marker[];
  audioBuffer: AudioBuffer;
  onMarkerDrag: (id: string, newPosition: number) => void;
  onValidation: (isValid: boolean) => void;
}
```

### Validation Logic

```javascript
function validateMarkers(markers, audioBuffer) {
  const errors = [];
  const warnings = [];
  
  const start = markers.find(m => m.type === 'start').position;
  const end = markers.find(m => m.type === 'end').position;
  const loopStart = markers.find(m => m.type === 'loopStart')?.position;
  const loopEnd = markers.find(m => m.type === 'loopEnd')?.position;
  
  // Validations
  if (end <= start) {
    errors.push('End must be after Start');
  }
  
  if (loopStart && loopEnd) {
    if (loopEnd <= loopStart) {
      errors.push('Loop End must be after Loop Start');
    }
    if (loopStart < start || loopEnd > end) {
      errors.push('Loop must be within Start-End range');
    }
  }
  
  // Warnings
  if ((end - start) < 100) {
    warnings.push('Sample is very short (< 100ms)');
  }
  
  if ((end - start) > 30000) {
    warnings.push('Sample is very long (> 30s)');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}
```

---

## 📤 5. SYSTÈME D'EXPORT

### Export OP-1

```javascript
async function exportOP1Sample(audioBuffer, tags) {
  // Applique les tags et exporte en WAV
  
  // 1. Trim audio selon tags
  const trimmedBuffer = trimBuffer(audioBuffer, tags.start, tags.end);
  
  // 2. Applique pitch shift si nécessaire
  if (tags.pitch !== 0) {
    pitchShiftBuffer(trimmedBuffer, tags.pitch);
  }
  
  // 3. Normalise le volume
  normalizeBuffer(trimmedBuffer);
  
  // 4. Encode en WAV
  const wav = encodeWAV(trimmedBuffer);
  
  // 5. Crée filename avec tags
  const filename = `${tags.name}_s${tags.start}_e${tags.end}_p${tags.pitch}.wav`;
  
  // 6. Retourne Blob pour download
  return new Blob([wav], { type: 'audio/wav' });
}

function trimBuffer(audioBuffer, startMs, endMs) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = (startMs / 1000) * sampleRate;
  const endSample = (endMs / 1000) * sampleRate;
  
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const trimmed = context.createBuffer(
    audioBuffer.numberOfChannels,
    endSample - startSample,
    sampleRate
  );
  
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    trimmed.getChannelData(ch).set(data.slice(startSample, endSample));
  }
  
  return trimmed;
}
```

### Export EP-133 Pattern

```javascript
function exportEP133Pattern(pattern, samples) {
  // Exporte pattern au format EP-133
  
  const patternData = {
    version: "1.0",
    pattern: {
      name: pattern.name,
      tempo: pattern.tempo,
      swing: pattern.swing,
      barLength: pattern.length,
      steps: pattern.steps.map(step => ({
        step: step.stepIndex,
        padIndex: step.padIndex,
        sampleId: samples[step.sampleIndex].id,
        velocity: step.velocity,
        swing: step.swing
      }))
    }
  };
  
  const json = JSON.stringify(patternData, null, 2);
  return new Blob([json], { type: 'application/json' });
}
```

---

## 🔄 6. PIPELINE DE TRAITEMENT

```
INPUT (Audio File)
    │
    ├─→ [File Validation]
    │   ├─ Check: Format (WAV, MP3, OGG)
    │   ├─ Check: Size (< 50MB)
    │   └─ Check: Duration (< 60s recommended)
    │
    ├─→ [Decode to AudioBuffer]
    │   └─ Use Web Audio API or ffmpeg.wasm
    │
    ├─→ [Auto-Analysis] (optional)
    │   ├─ Silence detection
    │   ├─ Peak detection
    │   ├─ Loop detection
    │   ├─ Pitch detection
    │   └─ Generate suggestions
    │
    ├─→ [Display Waveform]
    │   ├─ Render with wavesurfer.js
    │   ├─ Place markers
    │   └─ Enable drag-drop
    │
    ├─→ [User Interaction]
    │   ├─ Drag markers
    │   ├─ Adjust tags manually
    │   └─ Preview playback
    │
    ├─→ [Validation]
    │   ├─ Check tag constraints
    │   └─ Show errors/warnings
    │
    ├─→ [Processing]
    │   ├─ Trim audio
    │   ├─ Apply pitch shift
    │   ├─ Normalize volume
    │   └─ Apply effects (optional)
    │
    └─→ [Export]
        ├─ Encode to WAV
        ├─ Add metadata
        ├─ Generate filename
        └─ Download or Upload

OUTPUT (Tagged Sample / Pattern)
```

---

## 🧪 7. TEST CASES

### Test OP-1 Sound

```
Input: "kick_sample.mp3" (2.5s, 44.1kHz)

Expected Output:
├─ Waveform displayed correctly ✓
├─ Auto-markers placed within 100ms ✓
├─ User can drag markers freely ✓
├─ Tags recalculated on drag ✓
├─ Export creates valid WAV file ✓
└─ Tags embedded in filename ✓

Edge Cases:
├─ Very short sample (< 100ms)
├─ Very long sample (> 30s)
├─ Completely silent sample
├─ Sample with DC offset
└─ Multi-channel audio
```

### Test EP-133 Pattern

```
Input: 4-beat pattern with 16 samples

Expected Output:
├─ Pattern grid displays correctly ✓
├─ Pads can be triggered ✓
├─ Velocity is controllable ✓
├─ Swing is adjustable ✓
├─ Playback timing accurate ✓
└─ Export as JSON valid ✓
```

---

## 📊 RÉSUMÉ TECHNIQUE

| Aspect | Valeur |
|--------|--------|
| **Complexité** | 🟠 MOYENNE-HAUTE |
| **Effort Estimé** | 4-6 semaines (solo) |
| **Stack** | React + Web Audio API + wavesurfer.js |
| **Librairies** | tone.js, ffmpeg.wasm, react-dnd |
| **Performance** | O(n log n) pour FFT |
| **Supporté** | Chrome 90+, Firefox 88+, Safari 15+ |
| **Storage** | IndexedDB pour projets locaux |

**Status:** 📋 **CONCEPTION COMPLÈTE**
