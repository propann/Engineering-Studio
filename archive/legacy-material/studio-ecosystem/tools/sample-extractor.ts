/**
 * OP-1 Sample Extractor
 * Extracts and analyzes all audio samples from OP-1
 */

import fs from 'fs';
import path from 'path';

interface WAVMetadata {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  duration: number; // in seconds
  format: string;
}

interface SampleInfo {
  id: number;
  filename: string;
  path: string;
  size: number;
  metadata: WAVMetadata;
  peaks?: {
    left: number;
    right?: number;
  };
}

export class SampleExtractor {
  private op1Path: string;
  private samples: SampleInfo[] = [];

  constructor(op1Path: string) {
    this.op1Path = op1Path;
  }

  /**
   * Extract all samples from OP-1
   */
  public extractAllSamples(): SampleInfo[] {
    const samplesDir = path.join(this.op1Path, 'samples');

    if (!fs.existsSync(samplesDir)) {
      console.log('❌ Samples directory not found');
      return [];
    }

    console.log('🎵 Extracting samples...\n');

    try {
      const files = fs.readdirSync(samplesDir);
      let sampleCount = 0;

      files.forEach((file) => {
        if (file.endsWith('.wav')) {
          const filePath = path.join(samplesDir, file);
          const sampleData = this.analyzeSample(filePath);

          if (sampleData) {
            this.samples.push({
              id: sampleCount++,
              filename: file,
              path: filePath,
              size: fs.statSync(filePath).size,
              metadata: sampleData
            });

            console.log(
              `  ✅ ${file} - ${sampleData.duration.toFixed(2)}s @ ${sampleData.sampleRate}Hz`
            );
          }
        }
      });

      console.log(`\n✅ Extracted ${sampleCount} samples\n`);
    } catch (error) {
      console.error('❌ Extraction error:', error);
    }

    return this.samples;
  }

  /**
   * Analyze a WAV file
   */
  private analyzeSample(filePath: string): WAVMetadata | null {
    try {
      const buffer = fs.readFileSync(filePath);

      // Parse WAV header
      const riffHeader = buffer.toString('utf8', 0, 4);
      if (riffHeader !== 'RIFF') {
        console.error(`  ❌ Invalid WAV file: ${path.basename(filePath)}`);
        return null;
      }

      // Get subchunk1 position (fmt chunk)
      const fmtPos = 12;
      const audioFormat = buffer.readUInt16LE(fmtPos + 8);
      const channels = buffer.readUInt16LE(fmtPos + 8 + 2);
      const sampleRate = buffer.readUInt32LE(fmtPos + 8 + 4);
      const bitDepth = buffer.readUInt16LE(fmtPos + 8 + 14);

      // Find data chunk
      let dataSize = 0;
      let pos = 12;
      while (pos < buffer.length) {
        const chunkId = buffer.toString('utf8', pos, pos + 4);
        const chunkSize = buffer.readUInt32LE(pos + 4);

        if (chunkId === 'data') {
          dataSize = chunkSize;
          break;
        }

        pos += 8 + chunkSize;
      }

      const duration = dataSize / (sampleRate * channels * (bitDepth / 8));

      return {
        sampleRate,
        channels,
        bitDepth,
        duration,
        format: audioFormat === 1 ? 'PCM' : 'Compressed'
      };
    } catch (error) {
      console.error(`  ❌ Error analyzing ${path.basename(filePath)}:`, error);
      return null;
    }
  }

  /**
   * Calculate peak levels
   */
  private calculatePeaks(
    buffer: Buffer,
    metadata: WAVMetadata
  ): { left: number; right?: number } {
    let peakLeft = 0;
    let peakRight = 0;

    const bytesPerSample = metadata.bitDepth / 8;
    const offset = 44; // WAV data starts at 44

    for (let i = offset; i < buffer.length; i += bytesPerSample) {
      if (metadata.bitDepth === 16) {
        const sample = Math.abs(buffer.readInt16LE(i));
        peakLeft = Math.max(peakLeft, sample);
      } else if (metadata.bitDepth === 24) {
        let sample = buffer[i] | (buffer[i + 1] << 8) | (buffer[i + 2] << 16);
        if (sample & 0x800000) sample |= ~0xffffff;
        peakLeft = Math.max(peakLeft, Math.abs(sample));
      }
    }

    return {
      left: peakLeft / 32768,
      right: metadata.channels > 1 ? peakRight / 32768 : undefined
    };
  }

  /**
   * Generate sample database
   */
  public generateDatabase(outputPath: string = './op1-samples-db.json'): void {
    const db = {
      exportedAt: new Date().toISOString(),
      totalSamples: this.samples.length,
      totalSize: this.samples.reduce((sum, s) => sum + s.size, 0),
      totalDuration: this.samples.reduce((sum, s) => sum + s.metadata.duration, 0),
      samples: this.samples.map((s) => ({
        ...s,
        size: s.size,
        sizeMB: (s.size / 1024 / 1024).toFixed(2),
        duration: s.metadata.duration.toFixed(2)
      }))
    };

    try {
      fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));
      console.log(`✅ Sample database exported: ${outputPath}`);
      console.log(`   Total: ${db.totalSamples} samples`);
      console.log(`   Size: ${(db.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Duration: ${db.totalDuration.toFixed(2)}s\n`);
    } catch (error) {
      console.error('❌ Export error:', error);
    }
  }

  /**
   * Get samples grouped by duration
   */
  public groupByDuration() {
    const groups = {
      short: this.samples.filter((s) => s.metadata.duration < 1),
      medium: this.samples.filter((s) => s.metadata.duration >= 1 && s.metadata.duration < 5),
      long: this.samples.filter((s) => s.metadata.duration >= 5)
    };

    return {
      short: groups.short.length,
      medium: groups.medium.length,
      long: groups.long.length
    };
  }

  /**
   * Get samples by sample rate
   */
  public groupBySampleRate() {
    const groups: { [key: number]: number } = {};

    this.samples.forEach((s) => {
      const rate = s.metadata.sampleRate;
      groups[rate] = (groups[rate] || 0) + 1;
    });

    return groups;
  }

  /**
   * Export as CSV for analysis
   */
  public exportAsCSV(outputPath: string = './op1-samples.csv'): void {
    const headers = ['ID', 'Filename', 'Duration (s)', 'Sample Rate', 'Channels', 'Size (KB)'];
    const rows = this.samples.map((s) => [
      s.id,
      s.filename,
      s.metadata.duration.toFixed(2),
      s.metadata.sampleRate,
      s.metadata.channels,
      (s.size / 1024).toFixed(2)
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    try {
      fs.writeFileSync(outputPath, csv);
      console.log(`✅ CSV exported: ${outputPath}\n`);
    } catch (error) {
      console.error('❌ CSV export error:', error);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const diskPath = process.argv[2] || '/Volumes/OP-1';
  const extractor = new SampleExtractor(diskPath);

  extractor.extractAllSamples();
  extractor.generateDatabase();
  extractor.exportAsCSV();

  console.log('📊 Sample distribution:');
  console.log('  By duration:', extractor.groupByDuration());
  console.log('  By sample rate:', extractor.groupBySampleRate());
}
