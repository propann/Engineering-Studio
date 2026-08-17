/**
 * OP-1 Synthesizer Adapter - Studio Hub Instrument Interface
 * Unified OP-1 support across all machine classes
 */

import type {
  InstrumentAdapter,
  InstrumentCapabilities,
  InstrumentState,
  InstrumentConfig,
  QualityPreset,
  ResourceAllocation,
  MidiPort,
  AudioOutput,
  MachineClass,
} from '@studio-hub/instrument-interface';
import { createQualityPreset } from '@studio-hub/instrument-interface';

export class OP1Adapter implements InstrumentAdapter {
  private state: InstrumentState = {
    isInitialized: false,
    isRunning: false,
    currentPreset: undefined,
    activeVoices: 0,
    cpuLoad: 0,
  };

  private enabledFeatures: Set<string> = new Set();
  private selectedAudioOutput?: string;
  private selectedMidiInput?: string;

  async initialize(): Promise<void> {
    // Simulated initialization
    // In real implementation, would load OP-1 engine
    this.state.isInitialized = true;
  }

  async shutdown(): Promise<void> {
    this.state.isInitialized = false;
    this.state.isRunning = false;
    this.state.activeVoices = 0;
  }

  getCapabilities(): InstrumentCapabilities {
    return {
      name: 'OP-1 Synthesizer',
      vendor: 'Teenage Engineering',
      version: '1.2.0',
      minMachineClass: 'standard',
      requiredMemoryMB: 256,
      requiredCpuPercent: 35,
      maxVoicesPerClass: {
        minimal: 0, // Not supported
        standard: 8,
        performance: 16,
        server: 32,
      },
      supportedAudioFormats: ['wav', 'aiff', 'mp3'],
      supportedFeatures: [
        'reverb',
        'delay',
        'compression',
        'eq',
        'tape',
        'vinyl',
        'synth-engine',
        'drum-machine',
      ],
      hasBuiltInEffects: true,
      midiCapabilities: {
        inputSupported: true,
        outputSupported: true,
        ccControlled: true,
      },
    };
  }

  getState(): InstrumentState {
    return { ...this.state };
  }

  isSupported(machineClass: MachineClass): boolean {
    // OP-1 requires standard or better
    return machineClass !== 'minimal';
  }

  configure(config: InstrumentConfig): void {
    if (config.quality) {
      this.state.currentPreset = config.quality;
    }

    if (config.enabledFeatures) {
      this.enabledFeatures.clear();
      for (const feature of config.enabledFeatures) {
        this.enabledFeatures.add(feature);
      }
    }

    if (config.midiInputPort) {
      this.selectedMidiInput = config.midiInputPort;
    }

    if (config.audioOutputPort) {
      this.selectedAudioOutput = config.audioOutputPort;
    }
  }

  getQualityPreset(machineClass: MachineClass): QualityPreset {
    const presets: Record<MachineClass, Partial<QualityPreset>> = {
      minimal: {}, // Not supported
      standard: {
        voicePolyphony: 8,
        effectsQuality: 'medium',
        bufferSize: 256,
        sampleRate: 44100,
        cpuUsagePercent: 40,
        memoryUsageMB: 256,
      },
      performance: {
        voicePolyphony: 16,
        effectsQuality: 'high',
        bufferSize: 128,
        sampleRate: 48000,
        cpuUsagePercent: 60,
        memoryUsageMB: 512,
      },
      server: {
        voicePolyphony: 32,
        effectsQuality: 'high',
        bufferSize: 64,
        sampleRate: 96000,
        cpuUsagePercent: 75,
        memoryUsageMB: 1024,
      },
    };

    return createQualityPreset(machineClass, presets[machineClass] || {});
  }

  setQualityPreset(preset: QualityPreset): void {
    this.state.currentPreset = preset;
  }

  getResourceRequirements(): ResourceAllocation {
    const preset = this.state.currentPreset;
    if (!preset) {
      return {
        name: 'op1',
        memory: 256,
        cpu: 35,
        priority: 80,
      };
    }

    return {
      name: 'op1',
      memory: preset.memoryUsageMB,
      cpu: preset.cpuUsagePercent,
      priority: 80,
    };
  }

  getResourceUsage(): ResourceAllocation {
    // Calculate based on current state
    const baseUsage = 0.6; // 60% of allocated resources
    const preset = this.state.currentPreset;

    if (!preset) {
      return {
        name: 'op1',
        memory: 150,
        cpu: 20,
        priority: 80,
      };
    }

    return {
      name: 'op1',
      memory: Math.round(preset.memoryUsageMB * baseUsage),
      cpu: Math.round(preset.cpuUsagePercent * baseUsage),
      priority: 80,
    };
  }

  getAvailableMidiPorts(): MidiPort[] {
    return [
      {
        id: 'op1-midi-in',
        name: 'OP-1 MIDI In',
        direction: 'in',
        isConnected: this.selectedMidiInput === 'op1-midi-in',
      },
      {
        id: 'op1-midi-out',
        name: 'OP-1 MIDI Out',
        direction: 'out',
        isConnected: this.selectedMidiInput === 'op1-midi-out',
      },
    ];
  }

  getAvailableAudioOutputs(): AudioOutput[] {
    return [
      {
        id: 'op1-main',
        name: 'OP-1 Main',
        channels: 2,
        sampleRate: this.state.currentPreset?.sampleRate || 44100,
      },
      {
        id: 'op1-headphone',
        name: 'OP-1 Headphone',
        channels: 2,
        sampleRate: this.state.currentPreset?.sampleRate || 44100,
      },
    ];
  }

  setAudioOutput(outputId: string): void {
    this.selectedAudioOutput = outputId;
  }

  enableFeature(feature: string): boolean {
    const supported = this.getCapabilities().supportedFeatures;
    if (!supported.includes(feature)) {
      return false;
    }

    this.enabledFeatures.add(feature);
    return true;
  }

  disableFeature(feature: string): boolean {
    this.enabledFeatures.delete(feature);
    return true;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.enabledFeatures.has(feature);
  }
}

/**
 * Create OP-1 adapter instance
 */
export function createOP1Adapter(): InstrumentAdapter {
  return new OP1Adapter();
}

/**
 * OP-1 specific configuration
 */
export interface OP1Config extends InstrumentConfig {
  enableSynthEngine?: boolean;
  enableDrumMachine?: boolean;
  enableTapeSimulation?: boolean;
  enableVinylSimulation?: boolean;
}

/**
 * OP-1 specific quality presets
 */
export const OP1_QUALITY_PRESETS = {
  minimal_classic: createQualityPreset('standard', {
    name: 'OP-1 Classic (Minimal)',
    voicePolyphony: 4,
    effectsQuality: 'low' as const,
    bufferSize: 512,
    sampleRate: 22050,
    cpuUsagePercent: 25,
    memoryUsageMB: 128,
  }),

  standard_balanced: createQualityPreset('standard', {
    name: 'OP-1 Balanced (Standard)',
    voicePolyphony: 8,
    effectsQuality: 'medium' as const,
    bufferSize: 256,
    sampleRate: 44100,
    cpuUsagePercent: 40,
    memoryUsageMB: 256,
  }),

  performance_pro: createQualityPreset('performance', {
    name: 'OP-1 Pro (Performance)',
    voicePolyphony: 16,
    effectsQuality: 'high' as const,
    bufferSize: 128,
    sampleRate: 48000,
    cpuUsagePercent: 60,
    memoryUsageMB: 512,
  }),

  server_ultra: createQualityPreset('server', {
    name: 'OP-1 Ultra (Server)',
    voicePolyphony: 32,
    effectsQuality: 'high' as const,
    bufferSize: 64,
    sampleRate: 96000,
    cpuUsagePercent: 75,
    memoryUsageMB: 1024,
  }),
};

/**
 * Configure OP-1 with specific features
 */
export function configureOP1(adapter: InstrumentAdapter, config: OP1Config): void {
  // Apply base configuration
  adapter.configure(config);

  // Apply OP-1 specific feature configuration
  if (config.enableSynthEngine !== false) {
    adapter.enableFeature('synth-engine');
  }
  if (config.enableDrumMachine !== false) {
    adapter.enableFeature('drum-machine');
  }
  if (config.enableTapeSimulation === true) {
    adapter.enableFeature('tape');
  }
  if (config.enableVinylSimulation === true) {
    adapter.enableFeature('vinyl');
  }
}
