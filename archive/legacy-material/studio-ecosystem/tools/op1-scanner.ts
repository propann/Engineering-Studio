/**
 * OP-1 Disk Mode Scanner
 * Scans OP-1 filesystem and catalogs all files
 */

import fs from 'fs';
import path from 'path';

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: Date;
  type: string;
}

interface OP1Catalog {
  tapes: FileEntry[];
  patches: FileEntry[];
  drumkits: FileEntry[];
  samples: FileEntry[];
  firmware: FileEntry | null;
  metadata: {
    scannedAt: Date;
    totalFiles: number;
    totalSize: number;
  };
}

export class OP1Scanner {
  private diskPath: string;
  private catalog: OP1Catalog;

  constructor(diskPath: string) {
    this.diskPath = diskPath;
    this.catalog = {
      tapes: [],
      patches: [],
      drumkits: [],
      samples: [],
      firmware: null,
      metadata: {
        scannedAt: new Date(),
        totalFiles: 0,
        totalSize: 0
      }
    };
  }

  /**
   * Main scan function
   */
  public scan(): OP1Catalog {
    console.log(`🎛️  Scanning OP-1 at: ${this.diskPath}\n`);

    try {
      this.scanDirectory('tape', this.catalog.tapes);
      this.scanDirectory('synth', this.catalog.patches);
      this.scanDirectory('drum', this.catalog.drumkits);
      this.scanDirectory('samples', this.catalog.samples);
      this.scanFirmware();
      this.updateMetadata();
      this.printSummary();
    } catch (error) {
      console.error('❌ Scan error:', error);
    }

    return this.catalog;
  }

  /**
   * Scan a directory and collect files
   */
  private scanDirectory(dirName: string, target: FileEntry[]): void {
    const dirPath = path.join(this.diskPath, dirName);

    if (!fs.existsSync(dirPath)) {
      console.log(`  ⚠️  Directory not found: ${dirName}`);
      return;
    }

    try {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        try {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isFile()) {
            target.push({
              name: file,
              path: filePath,
              size: stat.size,
              modified: stat.mtime,
              type: path.extname(file)
            });

            this.catalog.metadata.totalSize += stat.size;
          }
        } catch (err) {
          console.error(`    Error processing ${file}:`, err);
        }
      });

      console.log(`  ✅ Found ${files.length} files in /${dirName}`);
    } catch (error) {
      console.error(`  ❌ Error scanning ${dirName}:`, error);
    }
  }

  /**
   * Scan firmware directory
   */
  private scanFirmware(): void {
    const fwPath = path.join(this.diskPath, 'firmware');

    if (!fs.existsSync(fwPath)) {
      console.log(`  ⚠️  Firmware directory not found`);
      return;
    }

    try {
      const files = fs.readdirSync(fwPath);
      const binFile = files.find((f) => f.endsWith('.bin'));

      if (binFile) {
        const filePath = path.join(fwPath, binFile);
        const stat = fs.statSync(filePath);

        this.catalog.firmware = {
          name: binFile,
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          type: '.bin'
        };

        this.catalog.metadata.totalSize += stat.size;
        console.log(`  ✅ Firmware found: ${binFile}`);
      }
    } catch (error) {
      console.error('  ❌ Error scanning firmware:', error);
    }
  }

  /**
   * Update metadata
   */
  private updateMetadata(): void {
    this.catalog.metadata.totalFiles =
      this.catalog.tapes.length +
      this.catalog.patches.length +
      this.catalog.drumkits.length +
      this.catalog.samples.length +
      (this.catalog.firmware ? 1 : 0);
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    const { totalFiles, totalSize } = this.catalog.metadata;
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 SCAN SUMMARY\n');
    console.log(`  Tape recordings:  ${this.catalog.tapes.length}`);
    console.log(`  Synth patches:    ${this.catalog.patches.length}`);
    console.log(`  Drum kits:        ${this.catalog.drumkits.length}`);
    console.log(`  Samples:          ${this.catalog.samples.length}`);
    console.log(`  Firmware:         ${this.catalog.firmware ? '✅' : '❌'}`);
    console.log(`  ─────────────────`);
    console.log(`  Total files:      ${totalFiles}`);
    console.log(`  Total size:       ${sizeMB} MB\n`);
  }

  /**
   * Export catalog to JSON
   */
  public exportCatalog(outputPath: string): void {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.catalog, null, 2));
      console.log(`\n✅ Catalog exported to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Export error:', error);
    }
  }

  /**
   * Get samples with analysis
   */
  public getSamplesWithStats() {
    return {
      count: this.catalog.samples.length,
      files: this.catalog.samples.map((s) => ({
        name: s.name,
        size: s.size,
        sizeMB: (s.size / 1024 / 1024).toFixed(2),
        modified: s.modified
      }))
    };
  }

  /**
   * Get patches with stats
   */
  public getPatchesWithStats() {
    return {
      count: this.catalog.patches.length,
      files: this.catalog.patches.map((p) => ({
        name: p.name,
        modified: p.modified
      }))
    };
  }
}

// CLI Usage
if (require.main === module) {
  const diskPath = process.argv[2] || '/Volumes/OP-1';
  const scanner = new OP1Scanner(diskPath);
  const catalog = scanner.scan();
  scanner.exportCatalog('./op1-catalog.json');

  console.log('\nSamples:', scanner.getSamplesWithStats());
  console.log('\nPatches:', scanner.getPatchesWithStats());
}
