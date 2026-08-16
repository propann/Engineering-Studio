/**
 * Config Engine - Studio Hub Adaptive Framework
 * Manages application configuration based on machine profile and feature flags
 */

export type MachineClass = 'minimal' | 'standard' | 'performance' | 'server';

export interface BaseConfig {
  machineClass: MachineClass;
  maxMemoryMB: number;
  maxCpuPercent: number;
  cacheSize: number;
  graphicsQuality: 'minimal' | 'standard' | 'high' | 'ultra';
  audioQuality: number; // Hz
}

export interface AppConfig extends BaseConfig {
  appName: string;
  version: string;
  features: Record<string, boolean>;
  plugins: PluginConfig[];
  storage: StorageConfig;
  logging: LoggingConfig;
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  priority: number;
  resources?: {
    memory?: number;
    cpu?: number;
  };
}

export interface StorageConfig {
  type: 'memory' | 'indexeddb' | 'localStorage' | 'hybrid';
  maxSizeMB: number;
  cacheStrategy: 'LRU' | 'LFU' | 'FIFO';
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  maxLogsMB: number;
}

/**
 * Configuration profiles for each machine class
 */
export const MACHINE_CONFIGS = {
  minimal: {
    maxMemoryMB: 512,
    maxCpuPercent: 30,
    cacheSize: 50,
    graphicsQuality: 'minimal' as const,
    audioQuality: 22050,
  },
  standard: {
    maxMemoryMB: 2048,
    maxCpuPercent: 60,
    cacheSize: 200,
    graphicsQuality: 'standard' as const,
    audioQuality: 44100,
  },
  performance: {
    maxMemoryMB: 8192,
    maxCpuPercent: 80,
    cacheSize: 1000,
    graphicsQuality: 'high' as const,
    audioQuality: 48000,
  },
  server: {
    maxMemoryMB: 16384,
    maxCpuPercent: 90,
    cacheSize: 5000,
    graphicsQuality: 'ultra' as const,
    audioQuality: 96000,
  },
};

/**
 * Default configuration factory
 */
export function createDefaultConfig(
  appName: string,
  machineClass: MachineClass = 'standard'
): AppConfig {
  const baseConfig = MACHINE_CONFIGS[machineClass];

  return {
    appName,
    version: '0.1.0',
    machineClass,
    ...baseConfig,
    features: getDefaultFeatures(machineClass),
    plugins: [],
    storage: {
      type: machineClass === 'minimal' ? 'memory' : 'hybrid',
      maxSizeMB: baseConfig.cacheSize,
      cacheStrategy: 'LRU',
    },
    logging: {
      level: machineClass === 'minimal' ? 'warn' : 'info',
      enableConsole: true,
      enableRemote: machineClass === 'server',
      maxLogsMB: machineClass === 'minimal' ? 10 : 50,
    },
  };
}

/**
 * Get feature flags appropriate for machine class
 */
export function getDefaultFeatures(machineClass: MachineClass): Record<string, boolean> {
  return {
    // Basic features (all machines)
    basicAudio: true,
    fileOperations: true,
    midiSupport: true,

    // Standard+ features
    effectsChain: machineClass !== 'minimal',
    multitrack: machineClass !== 'minimal',
    visualization: machineClass !== 'minimal',
    cloudSync: machineClass !== 'minimal',

    // Performance+ features
    advancedEffects: machineClass === 'performance' || machineClass === 'server',
    recordingPlayback: machineClass === 'performance' || machineClass === 'server',
    thirdPartyPlugins: machineClass === 'performance' || machineClass === 'server',
    realTimeMonitoring: machineClass === 'performance' || machineClass === 'server',

    // Server+ features
    multiUserSupport: machineClass === 'server',
    analyticsCollection: machineClass === 'server',
    automaticBackup: machineClass === 'server',
  };
}

/**
 * Merge user configuration with defaults
 */
export function mergeConfigs(
  defaults: AppConfig,
  userConfig: Partial<AppConfig>
): AppConfig {
  return {
    ...defaults,
    ...userConfig,
    features: {
      ...defaults.features,
      ...(userConfig.features || {}),
    },
    plugins: userConfig.plugins || defaults.plugins,
    storage: {
      ...defaults.storage,
      ...(userConfig.storage || {}),
    },
    logging: {
      ...defaults.logging,
      ...(userConfig.logging || {}),
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.appName) {
    errors.push('appName is required');
  }

  if (config.maxMemoryMB < 100) {
    errors.push('maxMemoryMB must be at least 100');
  }

  if (config.maxCpuPercent < 5 || config.maxCpuPercent > 100) {
    errors.push('maxCpuPercent must be between 5 and 100');
  }

  if (config.audioQuality < 8000 || config.audioQuality > 192000) {
    errors.push('audioQuality must be between 8000 and 192000 Hz');
  }

  if (config.plugins && !Array.isArray(config.plugins)) {
    errors.push('plugins must be an array');
  }

  if (config.storage.maxSizeMB < 1) {
    errors.push('storage.maxSizeMB must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Optimize configuration for specific constraints
 */
export function optimizeConfigForConstraints(
  config: AppConfig,
  constraints: {
    maxMemory?: number;
    maxCpuPercent?: number;
    networkOnly?: boolean;
  }
): AppConfig {
  const optimized = { ...config };

  if (constraints.maxMemory && constraints.maxMemory < config.maxMemoryMB) {
    optimized.maxMemoryMB = constraints.maxMemory;
    optimized.cacheSize = Math.floor(constraints.maxMemory * 0.2);
  }

  if (constraints.maxCpuPercent && constraints.maxCpuPercent < config.maxCpuPercent) {
    optimized.maxCpuPercent = constraints.maxCpuPercent;
  }

  if (constraints.networkOnly) {
    optimized.storage.type = 'memory';
    optimized.logging.enableRemote = true;
  }

  return optimized;
}

/**
 * Export current configuration
 */
export function exportConfig(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON
 */
export function importConfig(json: string): AppConfig {
  try {
    return JSON.parse(json) as AppConfig;
  } catch (error) {
    throw new Error(`Failed to parse configuration: ${error}`);
  }
}

/**
 * Get configuration summary for logging/debugging
 */
export function getConfigSummary(config: AppConfig): Record<string, unknown> {
  return {
    app: config.appName,
    machine: config.machineClass,
    memory: `${config.maxMemoryMB}MB`,
    cpu: `${config.maxCpuPercent}%`,
    audio: `${config.audioQuality}Hz`,
    graphics: config.graphicsQuality,
    storage: config.storage.type,
    featuresEnabled: Object.values(config.features).filter(Boolean).length,
    pluginsEnabled: config.plugins.filter(p => p.enabled).length,
  };
}
