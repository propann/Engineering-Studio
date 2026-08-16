/**
 * Feature Flags System - Studio Hub Adaptive Framework
 * Manages feature availability based on machine capabilities and user preferences
 */

export type MachineClass = 'minimal' | 'standard' | 'performance' | 'server';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  minMachineClass?: MachineClass;
  requiresPermission?: boolean;
  priority?: number;
  dependencies?: string[]; // Other feature names this depends on
  conflict?: string[]; // Features that conflict with this one
}

export interface FeatureFlagsStore {
  flags: Map<string, FeatureFlag>;
  listeners: Set<FeatureFlagsListener>;
}

export type FeatureFlagsListener = (
  flag: string,
  enabled: boolean,
  reason: string
) => void;

/**
 * Create a new feature flags store
 */
export function createFlagsStore(): FeatureFlagsStore {
  return {
    flags: new Map(),
    listeners: new Set(),
  };
}

/**
 * Initialize default feature flags
 */
export function initializeDefaultFlags(store: FeatureFlagsStore): void {
  const defaults: Record<string, FeatureFlag> = {
    // Basic features
    basicAudio: {
      name: 'basicAudio',
      enabled: true,
      priority: 100,
    },
    fileOperations: {
      name: 'fileOperations',
      enabled: true,
      priority: 100,
    },
    midiSupport: {
      name: 'midiSupport',
      enabled: true,
      priority: 100,
    },

    // Standard features
    effectsChain: {
      name: 'effectsChain',
      enabled: true,
      minMachineClass: 'standard',
      priority: 80,
    },
    multitrack: {
      name: 'multitrack',
      enabled: true,
      minMachineClass: 'standard',
      priority: 80,
    },
    visualization: {
      name: 'visualization',
      enabled: true,
      minMachineClass: 'standard',
      priority: 70,
    },
    cloudSync: {
      name: 'cloudSync',
      enabled: true,
      minMachineClass: 'standard',
      priority: 60,
    },

    // Performance features
    advancedEffects: {
      name: 'advancedEffects',
      enabled: true,
      minMachineClass: 'performance',
      priority: 85,
      dependencies: ['effectsChain'],
    },
    recordingPlayback: {
      name: 'recordingPlayback',
      enabled: true,
      minMachineClass: 'performance',
      priority: 80,
    },
    thirdPartyPlugins: {
      name: 'thirdPartyPlugins',
      enabled: true,
      minMachineClass: 'performance',
      priority: 70,
      requiresPermission: true,
    },
    realTimeMonitoring: {
      name: 'realTimeMonitoring',
      enabled: true,
      minMachineClass: 'performance',
      priority: 75,
    },

    // Server features
    multiUserSupport: {
      name: 'multiUserSupport',
      enabled: true,
      minMachineClass: 'server',
      priority: 90,
    },
    analyticsCollection: {
      name: 'analyticsCollection',
      enabled: true,
      minMachineClass: 'server',
      priority: 60,
      requiresPermission: true,
    },
    automaticBackup: {
      name: 'automaticBackup',
      enabled: true,
      minMachineClass: 'server',
      priority: 85,
    },
  };

  for (const [name, flag] of Object.entries(defaults)) {
    store.flags.set(name, flag);
  }
}

/**
 * Set up feature flags based on machine class
 */
export function setupFlagsForMachine(
  store: FeatureFlagsStore,
  machineClass: MachineClass
): void {
  const machineHierarchy: Record<MachineClass, MachineClass[]> = {
    minimal: ['minimal'],
    standard: ['minimal', 'standard'],
    performance: ['minimal', 'standard', 'performance'],
    server: ['minimal', 'standard', 'performance', 'server'],
  };

  const allowedClasses = machineHierarchy[machineClass];

  for (const [, flag] of store.flags) {
    if (flag.minMachineClass && !allowedClasses.includes(flag.minMachineClass)) {
      flag.enabled = false;
    }
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(store: FeatureFlagsStore, feature: string): boolean {
  const flag = store.flags.get(feature);

  if (!flag) {
    return false;
  }

  // Check dependencies
  if (flag.dependencies) {
    for (const dep of flag.dependencies) {
      if (!isFeatureEnabled(store, dep)) {
        return false;
      }
    }
  }

  return flag.enabled;
}

/**
 * Enable a feature
 */
export function enableFeature(
  store: FeatureFlagsStore,
  feature: string,
  reason: string = 'manual'
): void {
  const flag = store.flags.get(feature);

  if (!flag) {
    console.warn(`Feature not found: ${feature}`);
    return;
  }

  const wasEnabled = flag.enabled;
  flag.enabled = true;

  if (!wasEnabled) {
    notifyListeners(store, feature, true, reason);
  }
}

/**
 * Disable a feature
 */
export function disableFeature(
  store: FeatureFlagsStore,
  feature: string,
  reason: string = 'manual'
): void {
  const flag = store.flags.get(feature);

  if (!flag) {
    console.warn(`Feature not found: ${feature}`);
    return;
  }

  const wasEnabled = flag.enabled;
  flag.enabled = false;

  if (wasEnabled) {
    // Disable conflicting features
    if (flag.conflict) {
      for (const conflicting of flag.conflict) {
        disableFeature(store, conflicting, `conflict with ${feature}`);
      }
    }

    notifyListeners(store, feature, false, reason);
  }
}

/**
 * Toggle a feature
 */
export function toggleFeature(
  store: FeatureFlagsStore,
  feature: string,
  reason: string = 'manual'
): boolean {
  const flag = store.flags.get(feature);

  if (!flag) {
    return false;
  }

  if (flag.enabled) {
    disableFeature(store, feature, reason);
  } else {
    enableFeature(store, feature, reason);
  }

  return flag.enabled;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(store: FeatureFlagsStore): string[] {
  const enabled: string[] = [];

  for (const [name, flag] of store.flags) {
    if (isFeatureEnabled(store, name)) {
      enabled.push(name);
    }
  }

  return enabled;
}

/**
 * Get feature flag info
 */
export function getFeatureInfo(
  store: FeatureFlagsStore,
  feature: string
): FeatureFlag | undefined {
  return store.flags.get(feature);
}

/**
 * Get all features
 */
export function getAllFeatures(store: FeatureFlagsStore): FeatureFlag[] {
  return Array.from(store.flags.values());
}

/**
 * Subscribe to feature flag changes
 */
export function subscribe(
  store: FeatureFlagsStore,
  listener: FeatureFlagsListener
): () => void {
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
}

/**
 * Get feature statistics
 */
export function getStatistics(store: FeatureFlagsStore): Record<string, unknown> {
  const features = Array.from(store.flags.values());
  const enabled = features.filter(f => isFeatureEnabled(store, f.name));

  return {
    total: features.length,
    enabled: enabled.length,
    disabled: features.length - enabled.length,
    percentage: Math.round((enabled.length / features.length) * 100),
    requirePermission: features.filter(f => f.requiresPermission).length,
    withDependencies: features.filter(f => f.dependencies?.length).length,
  };
}

/**
 * Export flags configuration
 */
export function exportFlags(store: FeatureFlagsStore): Record<string, boolean> {
  const config: Record<string, boolean> = {};

  for (const [name, flag] of store.flags) {
    config[name] = flag.enabled;
  }

  return config;
}

/**
 * Import flags configuration
 */
export function importFlags(
  store: FeatureFlagsStore,
  config: Record<string, boolean>
): void {
  for (const [name, enabled] of Object.entries(config)) {
    const flag = store.flags.get(name);
    if (flag) {
      flag.enabled = enabled;
    }
  }
}

/**
 * Notify listeners of changes
 */
function notifyListeners(
  store: FeatureFlagsStore,
  feature: string,
  enabled: boolean,
  reason: string
): void {
  for (const listener of store.listeners) {
    try {
      listener(feature, enabled, reason);
    } catch (error) {
      console.error(`Error in feature flag listener: ${error}`);
    }
  }
}
