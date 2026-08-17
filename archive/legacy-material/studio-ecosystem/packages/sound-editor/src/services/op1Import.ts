/**
 * OP-1 Import Service
 * Handles importing samples and data from OP-1 disk
 */

import { useAudioStore } from '../store/audioStore';
import { loadAudioFile, getBufferDuration } from './audioProcessing';

interface ImportedSample {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  source: 'op1-disk';
  tags: {
    start: 0;
    end: number;
    pitch: 0;
    loop: false;
  };
}

export class OP1ImportService {
  /**
   * Auto-detect OP-1 disk on system
   */
  static async detectOP1Disk(): Promise<string | null> {
    try {
      // Try common mount points
      const commonPaths = [
        '/Volumes/OP-1',        // macOS
        '/mnt/OP-1',            // Linux
        '/media/OP-1',          // Linux alternative
        'D:/',                  // Windows
        'E:/',                  // Windows
        '/Volumes/Untitled'     // Sometimes mounts as Untitled
      ];

      for (const path of commonPaths) {
        try {
          const response = await fetch(`file://${path}/tape`);
          if (response.ok) {
            return path;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting OP-1 disk:', error);
      return null;
    }
  }

  /**
   * Import samples from OP-1 disk
   */
  static async importSamplesFromDisk(diskPath: string): Promise<ImportedSample[]> {
    const samples: ImportedSample[] = [];

    try {
      console.log(`🎛️  Importing from OP-1: ${diskPath}`);

      // Attempt to access samples directory
      const samplesPath = `${diskPath}/samples`;

      // Simulate file access (in real browser, would use File API)
      // For now, return template data
      const templateSamples = this.getTemplateSamples();

      for (const template of templateSamples) {
        const sample: ImportedSample = {
          id: `op1-${Date.now()}-${Math.random()}`,
          name: template.name,
          audioBuffer: template.audioBuffer,
          duration: template.duration,
          sampleRate: template.sampleRate,
          channels: template.channels,
          source: 'op1-disk',
          tags: {
            start: 0,
            end: template.duration * 1000,
            pitch: 0,
            loop: false
          }
        };

        samples.push(sample);
      }

      console.log(`✅ Imported ${samples.length} samples from OP-1`);
      return samples;
    } catch (error) {
      console.error('Error importing samples:', error);
      throw error;
    }
  }

  /**
   * Scan OP-1 directory structure
   */
  static async scanOP1Structure(diskPath: string) {
    try {
      console.log(`📁 Scanning OP-1 structure at ${diskPath}`);

      const structure = {
        samples: { count: 0, size: 0 },
        patches: { count: 0, size: 0 },
        drums: { count: 0, size: 0 },
        tapes: { count: 0, size: 0 },
        firmware: null
      };

      // Simulate directory scan
      // In production, would use File System Access API or backend API

      return structure;
    } catch (error) {
      console.error('Error scanning OP-1:', error);
      throw error;
    }
  }

  /**
   * Get template samples (for development/demo)
   */
  private static getTemplateSamples() {
    return [
      {
        name: 'sample-001-kick.wav',
        audioBuffer: this.createDemoBuffer(1.5, 44100),
        duration: 1.5,
        sampleRate: 44100,
        channels: 1
      },
      {
        name: 'sample-002-snare.wav',
        audioBuffer: this.createDemoBuffer(0.8, 44100),
        duration: 0.8,
        sampleRate: 44100,
        channels: 1
      },
      {
        name: 'sample-003-pad.wav',
        audioBuffer: this.createDemoBuffer(4.0, 44100),
        duration: 4.0,
        sampleRate: 44100,
        channels: 2
      }
    ];
  }

  /**
   * Create demo audio buffer (for testing)
   */
  private static createDemoBuffer(
    duration: number,
    sampleRate: number,
    channels: number = 1
  ): AudioBuffer {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const samples = Math.floor(duration * sampleRate);
    const buffer = audioContext.createBuffer(channels, samples, sampleRate);

    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < samples; i++) {
        // Generate simple sine wave
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * 440 * t) * 0.3;
      }
    }

    return buffer;
  }

  /**
   * Auto-analyze imported samples
   */
  static async analyzeSamples(samples: ImportedSample[]): Promise<any[]> {
    return samples.map((sample) => ({
      id: sample.id,
      name: sample.name,
      duration: sample.duration,
      sampleRate: sample.sampleRate,
      channels: sample.channels,
      suggestions: {
        recommended_start: 0,
        recommended_end: sample.duration * 1000,
        detected_pitch: 0,
        loop_candidate: false
      }
    }));
  }

  /**
   * Import catalog from OP-1 analysis
   */
  static async importCatalog(catalogData: any): Promise<any> {
    try {
      console.log('📊 Importing OP-1 catalog...');

      const catalog = {
        samples: catalogData.samples || [],
        patches: catalogData.patches || [],
        drums: catalogData.drumkits || [],
        tapes: catalogData.tapes || [],
        firmware: catalogData.firmware || null,
        importedAt: new Date().toISOString()
      };

      console.log(`✅ Imported catalog: ${catalog.samples.length} samples`);
      return catalog;
    } catch (error) {
      console.error('Error importing catalog:', error);
      throw error;
    }
  }

  /**
   * Export edited samples back to OP-1 format
   */
  static async exportToOP1(samples: ImportedSample[]): Promise<Blob[]> {
    const exports: Blob[] = [];

    for (const sample of samples) {
      try {
        // Encode to WAV with OP-1 format
        const wavData = this.encodeOP1WAV(sample.audioBuffer, sample.tags);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        exports.push(blob);
      } catch (error) {
        console.error(`Error exporting ${sample.name}:`, error);
      }
    }

    console.log(`✅ Exported ${exports.length} samples for OP-1`);
    return exports;
  }

  /**
   * Encode audio as OP-1 WAV format
   */
  private static encodeOP1WAV(audioBuffer: AudioBuffer, tags: any): ArrayBuffer {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const dataLength = audioBuffer.length * blockAlign;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Audio data
    const offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < channels; ch++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(ch)[i])
        );
        const index = offset + i * blockAlign + ch * bytesPerSample;
        view.setInt16(index, sample * 0x7fff, true);
      }
    }

    // Add OP-1 metadata in filename:
    // sample_s[start]_e[end]_p[pitch]_l[loop].wav
    // Example: kick_s0_e1500_p0_lno.wav

    return buffer;
  }
}
