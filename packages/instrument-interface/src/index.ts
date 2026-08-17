/**
 * Instrument Interface - Studio Hub Adaptive Framework
 * Generic adapter pattern for unified instrument support (OP-1, EP-133, etc.)
 */

export type MachineClass = 'minimal' | 'standard' | 'performance' | 'server';
export type AudioFormat = 'wav' | 'aiff' | 'mp3' | 'ogg';
export type EffectsQuality = 'low' | 'medium' | 'high';

export interface MidiPort {
  id: string;
  name: string;
  direction: 'in' | 'out';
  isConnected: boolean;
}

export interface AudioOutput {
  id: string;
  name: string;
  channels: number;
  sampleRate: number;
}

export interface InstrumentCapabilities {
  name: string;
  vendor: string;
  version: string;
  minMachineClass: MachineClass;
  requiredMemoryMB: number;
  requiredCpuPercent: number;
  maxVoicesPerClass: Record<MachineClass, number>;
  supportedAudioFormats: AudioFormat[];
  supportedFeatures: string[];
  hasBuiltInEffects: boolean;
  midiCapabilities: {
    inputSupported: boolean;
    outputSupported: boolean;
    ccControlled: boolean;
  };
}

export interface QualityPreset {
  name: string;
  machineClass: MachineClass;
  voicePolyphony: number;
  effectsQuality: EffectsQuality;
  bufferSize: number;
  sampleRate: number;
  cpuUsagePercent: number;
  memoryUsageMB: number;
}

export interface ResourceAllocation {
  name: string;
  memory: number;
  cpu: number;
  priority: number;
}

export interface InstrumentState {
  isInitialized: boolean;
  isRunning: boolean;
  currentPreset?: QualityPreset;
  activeVoices: number;
  cpuLoad: number;
}

export interface InstrumentAdapter {
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Query
  getCapabilities(): InstrumentCapabilities;
  getState(): InstrumentState;
  isSupported(machineClass: MachineClass): boolean;

  // Configuration
  configure(config: InstrumentConfig): void;
  getQualityPreset(machineClass: MachineClass): QualityPreset;
  setQualityPreset(preset: QualityPreset): void;

  // Resources
  getResourceRequirements(): ResourceAllocation;
  getResourceUsage(): ResourceAllocation;

  // Audio I/O
  getAvailableMidiPorts(): MidiPort[];
  getAvailableAudioOutputs(): AudioOutput[];
  setAudioOutput(outputId: string): void;

  // Features
  enableFeature(feature: string): boolean;
  disableFeature(feature: string): boolean;
  isFeatureEnabled(feature: string): boolean;

  // Audio Processing
  process?(audioData: Float32Array): Float32Array;
}

export interface InstrumentConfig {
  machineClass: MachineClass;
  quality?: QualityPreset;
  enabledFeatures?: string[];
  midiInputPort?: string;
  audioOutputPort?: string;
}

export interface AdapterRegistry {
  adapters: Map<string, InstrumentAdapter>;
  registerAdapter(name: string, adapter: InstrumentAdapter): void;
  unregisterAdapter(name: string): void;
  getAdapter(name: string): InstrumentAdapter | undefined;
  listAdapters(): string[];
}

/**
 * Create a new adapter registry
 */
export function createAdapterRegistry(): AdapterRegistry {
  return {
    adapters: new Map(),
    registerAdapter(name: string, adapter: InstrumentAdapter): void {
      this.adapters.set(name, adapter);
    },
    unregisterAdapter(name: string): void {
      this.adapters.delete(name);
    },
    getAdapter(name: string): InstrumentAdapter | undefined {
      return this.adapters.get(name);
    },
    listAdapters(): string[] {
      return Array.from(this.adapters.keys());
    },
  };
}

/**
 * Get adapters supported on a machine class
 */
export function getAdaptersSupportedForMachine(
  registry: AdapterRegistry,
  machineClass: MachineClass
): string[] {
  const supported: string[] = [];

  for (const [name, adapter] of registry.adapters) {
    if (adapter.isSupported(machineClass)) {
      supported.push(name);
    }
  }

  return supported;
}

/**
 * Get total resource requirements for all active adapters
 */
export function getTotalResourceRequirements(
  adapters: InstrumentAdapter[]
): ResourceAllocation {
  let totalMemory = 0;
  let totalCpu = 0;
  let highestPriority = 0;

  for (const adapter of adapters) {
    const reqs = adapter.getResourceRequirements();
    totalMemory += reqs.memory;
    totalCpu += reqs.cpu;
    highestPriority = Math.max(highestPriority, reqs.priority);
  }

  return {
    name: 'all-adapters',
    memory: totalMemory,
    cpu: totalCpu,
    priority: highestPriority,
  };
}

/**
 * Find adapters that would fit in available resources
 */
export function findAdaptersForResources(
  registry: AdapterRegistry,
  availableMemory: number,
  availableCpu: number,
  machineClass: MachineClass
): string[] {
  const candidates: string[] = [];

  for (const name of getAdaptersSupportedForMachine(registry, machineClass)) {
    const adapter = registry.getAdapter(name);
    if (adapter) {
      const reqs = adapter.getResourceRequirements();
      if (reqs.memory <= availableMemory && reqs.cpu <= availableCpu) {
        candidates.push(name);
      }
    }
  }

  return candidates;
}

/**
 * Create a quality preset for a machine class
 */
export function createQualityPreset(
  machineClass: MachineClass,
  basePreset: Partial<QualityPreset>
): QualityPreset {
  const defaults: Record<MachineClass, Partial<QualityPreset>> = {
    minimal: {
      voicePolyphony: 4,
      effectsQuality: 'low' as const,
      bufferSize: 512,
      sampleRate: 22050,
      cpuUsagePercent: 25,
      memoryUsageMB: 100,
    },
    standard: {
      voicePolyphony: 8,
      effectsQuality: 'medium' as const,
      bufferSize: 256,
      sampleRate: 44100,
      cpuUsagePercent: 50,
      memoryUsageMB: 256,
    },
    performance: {
      voicePolyphony: 16,
      effectsQuality: 'high' as const,
      bufferSize: 128,
      sampleRate: 48000,
      cpuUsagePercent: 70,
      memoryUsageMB: 512,
    },
    server: {
      voicePolyphony: 32,
      effectsQuality: 'high' as const,
      bufferSize: 64,
      sampleRate: 96000,
      cpuUsagePercent: 85,
      memoryUsageMB: 1024,
    },
  };

  return {
    name: `preset-${machineClass}`,
    machineClass,
    ...defaults[machineClass],
    ...basePreset,
  } as QualityPreset;
}

/**
 * Validate an adapter against requirements
 */
export function validateAdapterForMachine(
  adapter: InstrumentAdapter,
  machineClass: MachineClass,
  availableMemory: number,
  availableCpu: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!adapter.isSupported(machineClass)) {
    errors.push(`Adapter not supported on ${machineClass} machines`);
  }

  const reqs = adapter.getResourceRequirements();

  if (reqs.memory > availableMemory) {
    errors.push(
      `Insufficient memory: needs ${reqs.memory}MB, have ${availableMemory}MB`
    );
  }

  if (reqs.cpu > availableCpu) {
    errors.push(
      `Insufficient CPU: needs ${reqs.cpu}%, have ${availableCpu}%`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
