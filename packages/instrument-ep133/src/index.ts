/**
 * Korg EP-133 GO Adapter - Studio Hub Instrument Interface
 * Unified EP-133 support across all machine classes
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

export class EP133Adapter implements InstrumentAdapter {
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
  private bpm = 120; // Default BPM

  async initialize(): Promise<void> {
    // Simulated initialization
    // In real implementation, would load EP-133 engine
    this.state.isInitialized = true;
  }

  async shutdown(): Promise<void> {
    this.state.isInitialized = false;
    this.state.isRunning = false;
    this.state.activeVoices = 0;
  }

  getCapabilities(): InstrumentCapabilities {
    return {
      name: 'Korg EP-133 GO',
      vendor: 'Korg',
      version: '1.0.0',
      minMachineClass: 'minimal',
      requiredMemoryMB: 128,
      requiredCpuPercent: 25,
      maxVoicesPerClass: {
        minimal: 4,
        standard: 8,
        performance: 16,
        server: 32,
      },
      supportedAudioFormats: ['wav', 'ogg'],
      supportedFeatures: [
        'reverb',
        'compressor',
        'delay',
        'rhythms',
        'patterns',
        'chaining',
        'sampling',
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
    // EP-133 works on all machines
    return true;
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
      minimal: {
        voicePolyphony: 4,
        effectsQuality: 'low',
        bufferSize: 512,
        sampleRate: 22050,
        cpuUsagePercent: 20,
        memoryUsageMB: 64,
      },
      standard: {
        voicePolyphony: 8,
        effectsQuality: 'medium',
        bufferSize: 256,
        sampleRate: 44100,
        cpuUsagePercent: 30,
        memoryUsageMB: 128,
      },
      performance: {
        voicePolyphony: 16,
        effectsQuality: 'high',
        bufferSize: 128,
        sampleRate: 48000,
        cpuUsagePercent: 45,
        memoryUsageMB: 256,
      },
      server: {
        voicePolyphony: 32,
        effectsQuality: 'high',
        bufferSize: 64,
        sampleRate: 96000,
        cpuUsagePercent: 60,
        memoryUsageMB: 512,
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
        name: 'ep133',
        memory: 128,
        cpu: 25,
        priority: 70,
      };
    }

    return {
      name: 'ep133',
      memory: preset.memoryUsageMB,
      cpu: preset.cpuUsagePercent,
      priority: 70,
    };
  }

  getResourceUsage(): ResourceAllocation {
    // Calculate based on current state
    const baseUsage = 0.5; // 50% of allocated resources
    const preset = this.state.currentPreset;

    if (!preset) {
      return {
        name: 'ep133',
        memory: 64,
        cpu: 12,
        priority: 70,
      };
    }

    return {
      name: 'ep133',
      memory: Math.round(preset.memoryUsageMB * baseUsage),
      cpu: Math.round(preset.cpuUsagePercent * baseUsage),
      priority: 70,
    };
  }

  getAvailableMidiPorts(): MidiPort[] {
    return [
      {
        id: 'ep133-midi-in',
        name: 'EP-133 MIDI In',
        direction: 'in',
        isConnected: this.selectedMidiInput === 'ep133-midi-in',
      },
      {
        id: 'ep133-sync-out',
        name: 'EP-133 Sync Out',
        direction: 'out',
        isConnected: this.selectedMidiInput === 'ep133-sync-out',
      },
    ];
  }

  getAvailableAudioOutputs(): AudioOutput[] {
    return [
      {
        id: 'ep133-main',
        name: 'EP-133 Main',
        channels: 2,
        sampleRate: this.state.currentPreset?.sampleRate || 44100,
      },
      {
        id: 'ep133-headphone',
        name: 'EP-133 Headphone',
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
 * Create EP-133 adapter instance
 */
export function createEP133Adapter(): InstrumentAdapter {
  return new EP133Adapter();
}

/**
 * EP-133 specific configuration
 */
export interface EP133Config extends InstrumentConfig {
  enableRhythms?: boolean;
  enablePatterns?: boolean;
  enableChaining?: boolean;
  enableSampling?: boolean;
  defaultBPM?: number;
}

/**
 * EP-133 specific quality presets
 */
export const EP133_QUALITY_PRESETS = {
  minimal_basic: createQualityPreset('minimal', {
    name: 'EP-133 Basic (Minimal)',
    voicePolyphony: 4,
    effectsQuality: 'low' as const,
    bufferSize: 512,
    sampleRate: 22050,
    cpuUsagePercent: 15,
    memoryUsageMB: 64,
  }),

  standard_balanced: createQualityPreset('standard', {
    name: 'EP-133 Balanced (Standard)',
    voicePolyphony: 8,
    effectsQuality: 'medium' as const,
    bufferSize: 256,
    sampleRate: 44100,
    cpuUsagePercent: 30,
    memoryUsageMB: 128,
  }),

  performance_pro: createQualityPreset('performance', {
    name: 'EP-133 Pro (Performance)',
    voicePolyphony: 16,
    effectsQuality: 'high' as const,
    bufferSize: 128,
    sampleRate: 48000,
    cpuUsagePercent: 45,
    memoryUsageMB: 256,
  }),

  server_ultra: createQualityPreset('server', {
    name: 'EP-133 Ultra (Server)',
    voicePolyphony: 32,
    effectsQuality: 'high' as const,
    bufferSize: 64,
    sampleRate: 96000,
    cpuUsagePercent: 60,
    memoryUsageMB: 512,
  }),
};

/**
 * Configure EP-133 with specific features
 */
export function configureEP133(adapter: InstrumentAdapter, config: EP133Config): void {
  // Apply base configuration
  adapter.configure(config);

  // Apply EP-133 specific feature configuration
  if (config.enableRhythms !== false) {
    adapter.enableFeature('rhythms');
  }
  if (config.enablePatterns !== false) {
    adapter.enableFeature('patterns');
  }
  if (config.enableChaining === true) {
    adapter.enableFeature('chaining');
  }
  if (config.enableSampling === true) {
    adapter.enableFeature('sampling');
  }
}
