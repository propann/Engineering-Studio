# 🎛️ OP-1 DISK MODE ANALYSIS TOOLS

> **Project:** OP-1 Disk Mode Scanner & Analyzer  
> **Purpose:** Scan, analyze, and extract OP-1 sounds from machine in disk mode  
> **Status:** 📋 Planning

---

## 📋 OVERVIEW

Quand l'OP-1 est connecté en **USB Disk Mode**, on peut:
1. ✅ Accéder aux fichiers internes
2. ✅ Analyser la structure des données
3. ✅ Extraire les samples/sons
4. ✅ Reverse-engineer les formats
5. ✅ Créer une base de données

---

## 📁 OP-1 DISK MODE STRUCTURE

### Expected File Structure

```
OP-1 (USB Drive)/
├── tape/                    # Tape recordings
│   ├── project1.tape
│   ├── project2.tape
│   └── ...
│
├── synth/                   # Synthesizer patches
│   ├── patch001.pch
│   ├── patch002.pch
│   └── ...
│
├── drum/                    # Drum kits
│   ├── drumkit001.drm
│   └── ...
│
├── samples/                 # Sample library
│   ├── sample001.wav
│   ├── sample002.wav
│   └── ...
│
├── firmware/                # Firmware version
│   └── op1_fw_*.bin
│
└── [other data]/
    ├── config.cfg
    ├── metadata.db
    └── ...
```

### Data Formats

#### `.tape` Format (Recording)
```
Header: "TAPE" or similar magic number
Contents:
├─ Recording metadata (tempo, duration, format)
├─ 4-track audio data (WAV or custom)
├─ Markers/regions
└─ Effects settings
```

#### `.pch` Format (Synth Patch)
```
Header: "PATCH" or similar
Contents:
├─ Synth type identifier
├─ Parameter values (100+ parameters)
├─ Operator configurations (for FM)
├─ Envelope settings
└─ Effects chain
```

#### `.drm` Format (Drum Kit)
```
Header: "DRUM" or similar
Contents:
├─ 16 drum pad definitions
├─ Sample references per pad
├─ Velocity mapping
└─ Audio properties (pitch, length)
```

---

## 🛠️ TOOL #1: OP-1 DISK SCANNER

### Purpose
Scan OP-1 drive and catalog all files

### Implementation (Node.js)

**File:** `tools/op1-scanner.js`

```javascript
const fs = require('fs');
const path = require('path');

class OP1Scanner {
  constructor(diskPath) {
    this.diskPath = diskPath;
    this.catalog = {
      tapes: [],
      patches: [],
      drumkits: [],
      samples: [],
      firmware: null,
      metadata: null
    };
  }

  scan() {
    console.log(`Scanning OP-1 at: ${this.diskPath}`);
    
    // Scan tape directory
    this.scanDirectory('tape', this.catalog.tapes);
    
    // Scan synth directory
    this.scanDirectory('synth', this.catalog.patches);
    
    // Scan drum directory
    this.scanDirectory('drum', this.catalog.drumkits);
    
    // Scan samples directory
    this.scanDirectory('samples', this.catalog.samples);
    
    // Scan firmware
    this.scanFirmware();
    
    return this.catalog;
  }

  scanDirectory(dir, target) {
    const dirPath = path.join(this.diskPath, dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`  ⚠️  Directory not found: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      target.push({
        name: file,
        path: filePath,
        size: stat.size,
        modified: stat.mtime,
        type: path.extname(file)
      });
    });

    console.log(`  ✅ Found ${files.length} files in ${dir}/`);
  }

  scanFirmware() {
    const fwPath = path.join(this.diskPath, 'firmware');
    
    if (fs.existsSync(fwPath)) {
      const files = fs.readdirSync(fwPath);
      const binFile = files.find(f => f.endsWith('.bin'));
      
      if (binFile) {
        const filePath = path.join(fwPath, binFile);
        const stat = fs.statSync(filePath);
        
        this.catalog.firmware = {
          file: binFile,
          path: filePath,
          size: stat.size,
          version: this.extractFirmwareVersion(filePath)
        };
        
        console.log(`  ✅ Firmware found: ${binFile}`);
      }
    }
  }

  extractFirmwareVersion(filePath) {
    // Read first 1KB to find version string
    const buffer = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);
    
    // Look for version pattern (e.g., "v1.2.3" or similar)
    const str = buffer.toString('utf8', 0, 1024);
    const versionMatch = str.match(/v?\d+\.\d+\.\d+/);
    
    return versionMatch ? versionMatch[0] : 'unknown';
  }

  exportCatalog(outputFile) {
    fs.writeFileSync(
      outputFile,
      JSON.stringify(this.catalog, null, 2)
    );
    
    console.log(`\n✅ Catalog exported to: ${outputFile}`);
  }
}

// Usage
const scanner = new OP1Scanner('/Volumes/OP-1'); // macOS mount point
const catalog = scanner.scan();
scanner.exportCatalog('./op1-catalog.json');
```

### Usage

```bash
node tools/op1-scanner.js
# Output: op1-catalog.json
```

---

## 🛠️ TOOL #2: AUDIO SAMPLE EXTRACTOR

### Purpose
Extract and analyze all audio samples from OP-1

### Features
- Extract all `.wav` samples
- Analyze metadata (duration, sample rate, channels)
- Generate waveform thumbnails
- Create searchable database

**File:** `tools/sample-extractor.js`

```javascript
const fs = require('fs');
const path = require('path');
const WaveFile = require('wavefile').WaveFile;

class SampleExtractor {
  constructor(op1Path) {
    this.op1Path = op1Path;
    this.samples = [];
  }

  extractAllSamples() {
    const samplesDir = path.join(this.op1Path, 'samples');
    
    if (!fs.existsSync(samplesDir)) {
      console.log('❌ Samples directory not found');
      return;
    }

    const files = fs.readdirSync(samplesDir);
    
    files.forEach((file, index) => {
      if (file.endsWith('.wav')) {
        const filePath = path.join(samplesDir, file);
        const sampleData = this.analyzeSample(filePath);
        
        this.samples.push({
          id: index,
          filename: file,
          ...sampleData
        });
        
        console.log(`  ✅ ${file} - ${sampleData.duration.toFixed(2)}s`);
      }
    });

    return this.samples;
  }

  analyzeSample(filePath) {
    const buffer = fs.readFileSync(filePath);
    const wav = new WaveFile(buffer);

    const duration = (wav.data.samples.length / wav.fmt.sampleRate);
    
    return {
      path: filePath,
      size: buffer.length,
      format: {
        sampleRate: wav.fmt.sampleRate,
        channels: wav.fmt.numChannels,
        bitDepth: wav.fmt.bitsPerSample,
        duration: duration
      },
      metadata: {
        compressed: wav.isRIFF(),
        tags: wav.listTag || {}
      }
    };
  }

  generateDatabase() {
    const db = {
      exportedAt: new Date().toISOString(),
      totalSamples: this.samples.length,
      totalSize: this.samples.reduce((sum, s) => sum + s.size, 0),
      samples: this.samples
    };

    fs.writeFileSync(
      './op1-samples-db.json',
      JSON.stringify(db, null, 2)
    );

    console.log(`\n✅ Database created: ${this.samples.length} samples`);
  }
}

const extractor = new SampleExtractor('/Volumes/OP-1');
extractor.extractAllSamples();
extractor.generateDatabase();
```

---

## 🛠️ TOOL #3: PATCH ANALYZER

### Purpose
Analyze synthesizer patches and extract parameters

**File:** `tools/patch-analyzer.js`

```javascript
const fs = require('fs');
const path = require('path');

class PatchAnalyzer {
  constructor(op1Path) {
    this.op1Path = op1Path;
    this.patches = [];
  }

  analyzePatch(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    // Read patch header
    const magic = buffer.toString('utf8', 0, 4);
    const version = buffer.readUInt8(4);
    
    return {
      magic,
      version,
      size: buffer.length,
      parameters: this.extractParameters(buffer),
      hash: this.calculateHash(buffer)
    };
  }

  extractParameters(buffer) {
    // Parse parameter section
    // This requires understanding the OP-1 patch binary format
    
    const params = {};
    
    // Example: OP-1 typically has:
    // - Operator parameters (pitch, level, etc.)
    // - Envelope settings (A, D, S, R)
    // - Effects parameters
    
    return params;
  }

  calculateHash(buffer) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 8);
  }

  extractAllPatches() {
    const patchDir = path.join(this.op1Path, 'synth');
    
    if (!fs.existsSync(patchDir)) {
      console.log('❌ Patch directory not found');
      return;
    }

    const files = fs.readdirSync(patchDir);
    
    files.forEach((file) => {
      if (file.endsWith('.pch')) {
        const filePath = path.join(patchDir, file);
        const patchData = this.analyzePatch(filePath);
        
        this.patches.push({
          filename: file,
          ...patchData
        });
        
        console.log(`  ✅ ${file} (v${patchData.version})`);
      }
    });
  }

  generatePatchLibrary() {
    const library = {
      exportedAt: new Date().toISOString(),
      totalPatches: this.patches.length,
      patches: this.patches
    };

    fs.writeFileSync(
      './op1-patches-library.json',
      JSON.stringify(library, null, 2)
    );

    console.log(`\n✅ Patch library created: ${this.patches.length} patches`);
  }
}

const analyzer = new PatchAnalyzer('/Volumes/OP-1');
analyzer.extractAllPatches();
analyzer.generatePatchLibrary();
```

---

## 🛠️ TOOL #4: FIRMWARE EXTRACTOR

### Purpose
Extract and analyze firmware binary

**File:** `tools/firmware-extractor.js`

```javascript
const fs = require('fs');
const path = require('path');

class FirmwareExtractor {
  constructor(op1Path) {
    this.op1Path = op1Path;
  }

  extract() {
    const fwPath = path.join(this.op1Path, 'firmware');
    const binFile = fs.readdirSync(fwPath).find(f => f.endsWith('.bin'));
    
    if (!binFile) {
      console.log('❌ Firmware file not found');
      return;
    }

    const filePath = path.join(fwPath, binFile);
    const buffer = fs.readFileSync(filePath);

    const firmware = {
      filename: binFile,
      size: buffer.length,
      checksum: this.calculateChecksum(buffer),
      version: this.extractVersion(buffer),
      buildDate: this.extractBuildDate(buffer),
      sections: this.identifySections(buffer)
    };

    return firmware;
  }

  calculateChecksum(buffer) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  extractVersion(buffer) {
    // Look for version string in firmware
    const str = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    const match = str.match(/v?\d+\.\d+\.\d+/);
    return match ? match[0] : 'unknown';
  }

  extractBuildDate(buffer) {
    // Look for date string
    const str = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    const match = str.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : 'unknown';
  }

  identifySections(buffer) {
    // Identify firmware sections (bootloader, kernel, apps, etc.)
    const sections = [];
    
    // Common section markers
    const markers = [
      { name: 'Bootloader', magic: '0xA5A5' },
      { name: 'Kernel', magic: '0x5A5A' },
      { name: 'Applications', magic: '0xDEAD' }
    ];

    return sections;
  }

  exportReport() {
    const firmware = this.extract();
    
    const report = {
      title: 'OP-1 Firmware Analysis',
      exportedAt: new Date().toISOString(),
      firmware: firmware
    };

    fs.writeFileSync(
      './op1-firmware-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log(`\n✅ Firmware report exported`);
    console.log(`   Version: ${firmware.version}`);
    console.log(`   Size: ${firmware.size} bytes`);
  }
}

const extractor = new FirmwareExtractor('/Volumes/OP-1');
extractor.exportReport();
```

---

## 🛠️ TOOL #5: UNIFIED OP-1 ANALYZER

### Purpose
Master tool that runs all analysis tasks

**File:** `tools/op1-analyzer.js`

```javascript
const OP1Scanner = require('./op1-scanner');
const SampleExtractor = require('./sample-extractor');
const PatchAnalyzer = require('./patch-analyzer');
const FirmwareExtractor = require('./firmware-extractor');

class OP1Analyzer {
  constructor(diskPath) {
    this.diskPath = diskPath;
    this.report = {
      timestamp: new Date().toISOString(),
      diskPath: diskPath,
      components: {}
    };
  }

  analyzeAll() {
    console.log('🎛️  OP-1 COMPLETE ANALYSIS\n');
    console.log('='.repeat(50) + '\n');

    // 1. Scan disk
    console.log('📁 Scanning OP-1 disk...');
    const scanner = new OP1Scanner(this.diskPath);
    this.report.components.catalog = scanner.scan();
    
    // 2. Extract samples
    console.log('\n🎵 Extracting samples...');
    const extractor = new SampleExtractor(this.diskPath);
    this.report.components.samples = extractor.extractAllSamples();
    
    // 3. Analyze patches
    console.log('\n🎛️  Analyzing patches...');
    const analyzer = new PatchAnalyzer(this.diskPath);
    this.report.components.patches = analyzer.extractAllPatches();
    
    // 4. Extract firmware
    console.log('\n⚙️  Analyzing firmware...');
    const fwExtractor = new FirmwareExtractor(this.diskPath);
    this.report.components.firmware = fwExtractor.extract();

    // 5. Generate summary
    this.generateSummary();

    return this.report;
  }

  generateSummary() {
    const summary = {
      totalSamples: this.report.components.samples.length,
      totalPatches: this.report.components.patches.length,
      firmwareVersion: this.report.components.firmware.version,
      totalSize: this.calculateTotalSize()
    };

    this.report.summary = summary;

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 ANALYSIS SUMMARY\n');
    console.log(`  Samples: ${summary.totalSamples}`);
    console.log(`  Patches: ${summary.totalPatches}`);
    console.log(`  Firmware: ${summary.firmwareVersion}`);
    console.log(`  Total Size: ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  }

  calculateTotalSize() {
    let total = 0;
    
    if (this.report.components.samples) {
      total += this.report.components.samples.reduce((sum, s) => sum + (s.size || 0), 0);
    }
    
    if (this.report.components.firmware) {
      total += this.report.components.firmware.size || 0;
    }
    
    return total;
  }

  exportReport() {
    const filename = `op1-analysis-${Date.now()}.json`;
    
    require('fs').writeFileSync(
      filename,
      JSON.stringify(this.report, null, 2)
    );

    console.log(`✅ Full report exported: ${filename}`);
  }
}

// Usage
const analyzer = new OP1Analyzer('/Volumes/OP-1');
const report = analyzer.analyzeAll();
analyzer.exportReport();
```

---

## 📊 INTEGRATION WITH SOUND EDITOR

### Connect to Sound Editor

```javascript
// In Sound Editor: packages/sound-editor/src/services/op1Import.ts

import OP1Analyzer from '../../../tools/op1-analyzer';

export async function importFromOP1Disk(diskPath: string) {
  const analyzer = new OP1Analyzer(diskPath);
  const report = analyzer.analyzeAll();

  // Import samples
  report.components.samples.forEach(sample => {
    addSampleToProject(sample);
  });

  // Import patches
  report.components.patches.forEach(patch => {
    addPatchToLibrary(patch);
  });

  return report;
}
```

---

## 🚀 NEXT STEPS

### Immediate
- [ ] Create tools directory structure
- [ ] Implement OP1Scanner (30 min)
- [ ] Implement SampleExtractor (1 hour)
- [ ] Test with real OP-1 disk

### Short-term
- [ ] Implement PatchAnalyzer
- [ ] Implement FirmwareExtractor
- [ ] Create unified OP1Analyzer
- [ ] Build analysis reports

### Long-term
- [ ] Reverse-engineer patch format
- [ ] Reverse-engineer firmware structure
- [ ] Create importers for Sound Editor
- [ ] Build management UI

---

**Status:** 📋 **READY TO IMPLEMENT**

C'est un vrai projet de reverse-engineering! On peut scanner, analyser et extraire les données de l'OP-1.
