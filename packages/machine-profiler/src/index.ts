/**
 * Machine Profiler - Studio Hub Adaptive Framework
 * Detects and classifies machine capabilities for adaptive configuration
 */

export type MachineClass = 'minimal' | 'standard' | 'performance' | 'server';

type NodeRequire = (moduleName: string) => {
  cpus(): Array<{ speed?: number }>;
  totalmem(): number;
  freemem(): number;
  platform(): string;
};

const nodeRequire = (globalThis as typeof globalThis & { require?: NodeRequire }).require;

export interface CPUInfo {
  cores: number;
  threads: number;
  speed: number; // GHz
}

export interface MemoryInfo {
  total: number; // MB
  available: number; // MB
}

export interface StorageInfo {
  total: number; // MB
  available: number; // MB
  type: 'HDD' | 'SSD' | 'NVMe' | 'unknown';
}

export interface GPUInfo {
  name: string;
  vram: number; // MB
  type: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'other';
}

export interface MachineProfile {
  cpu: CPUInfo;
  memory: MemoryInfo;
  storage: StorageInfo;
  gpu?: GPUInfo;
  platform: 'darwin' | 'linux' | 'win32' | 'unknown';
  machineClass: MachineClass;
  timestamp: number;
}

/**
 * Detect current machine capabilities
 */
export async function detectMachine(): Promise<MachineProfile> {
  const cpuInfo = detectCPU();
  const memoryInfo = detectMemory();
  const storageInfo = await detectStorage();
  const platform = detectPlatform();
  const machineClass = classifyMachine(cpuInfo, memoryInfo, platform);

  return {
    cpu: cpuInfo,
    memory: memoryInfo,
    storage: storageInfo,
    platform,
    machineClass,
    timestamp: Date.now(),
  };
}

/**
 * Detect CPU information
 */
function detectCPU(): CPUInfo {
  // In browser/browser-like environment
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return {
      cores: navigator.hardwareConcurrency,
      threads: navigator.hardwareConcurrency,
      speed: 2.0, // Default estimate
    };
  }

  // Node.js environment
  if (nodeRequire) {
    try {
      const os = nodeRequire('os');
      const cpuCount = os.cpus().length;
      const cpuSpeed = os.cpus()[0]?.speed / 1000 || 2.0;
      return {
        cores: cpuCount,
        threads: cpuCount,
        speed: cpuSpeed,
      };
    } catch {
      // Fallback
    }
  }

  return { cores: 4, threads: 4, speed: 2.0 };
}

/**
 * Detect memory information
 */
function detectMemory(): MemoryInfo {
  // Browser environment
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memInfo = (performance as any).memory;
    return {
      total: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
      available: Math.round((memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize) / 1024 / 1024),
    };
  }

  // Node.js environment
  if (nodeRequire) {
    try {
      const os = nodeRequire('os');
      return {
        total: Math.round(os.totalmem() / 1024 / 1024),
        available: Math.round(os.freemem() / 1024 / 1024),
      };
    } catch {
      // Fallback
    }
  }

  return { total: 4096, available: 2048 };
}

/**
 * Detect storage information
 */
async function detectStorage(): Promise<StorageInfo> {
  // Try Storage API (browser)
  if (typeof navigator !== 'undefined' && (navigator as any).storage?.estimate) {
    try {
      const estimate = await (navigator as any).storage.estimate();
      return {
        total: Math.round(estimate.quota / 1024 / 1024),
        available: Math.round((estimate.quota - estimate.usage) / 1024 / 1024),
        type: 'unknown',
      };
    } catch {
      // Fallback
    }
  }

  // Default
  return {
    total: 256000,
    available: 100000,
    type: 'unknown',
  };
}

/**
 * Detect platform
 */
function detectPlatform(): 'darwin' | 'linux' | 'win32' | 'unknown' {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('darwin') || ua.includes('mac')) return 'darwin';
    if (ua.includes('linux')) return 'linux';
    if (ua.includes('win')) return 'win32';
  }

  if (nodeRequire) {
    try {
      const os = nodeRequire('os');
      const platform = os.platform();
      if (['darwin', 'linux', 'win32'].includes(platform)) {
        return platform as 'darwin' | 'linux' | 'win32';
      }
    } catch {
      // Fallback
    }
  }

  return 'unknown';
}

/**
 * Classify machine based on capabilities
 */
function classifyMachine(
  cpu: CPUInfo,
  memory: MemoryInfo,
  platform: string
): MachineClass {
  const score = cpu.cores * memory.total;

  // Server: 8+ cores AND 16GB+ RAM
  if (cpu.cores >= 8 && memory.total >= 16000) {
    return 'server';
  }

  // Performance: 6+ cores AND 8GB+ RAM
  if (cpu.cores >= 6 && memory.total >= 8000) {
    return 'performance';
  }

  // Standard: 4+ cores AND 2GB+ RAM
  if (cpu.cores >= 4 && memory.total >= 2000) {
    return 'standard';
  }

  // Minimal: everything else
  return 'minimal';
}

/**
 * Get recommended configuration for machine class
 */
export function getRecommendedConfig(machineClass: MachineClass) {
  const configs = {
    minimal: {
      maxMemoryMB: 512,
      maxCpuPercent: 30,
      cacheSize: 50,
      graphics: 'minimal' as const,
      audioQuality: 22050,
    },
    standard: {
      maxMemoryMB: 2048,
      maxCpuPercent: 60,
      cacheSize: 200,
      graphics: 'standard' as const,
      audioQuality: 44100,
    },
    performance: {
      maxMemoryMB: 8192,
      maxCpuPercent: 80,
      cacheSize: 1000,
      graphics: 'high' as const,
      audioQuality: 48000,
    },
    server: {
      maxMemoryMB: 16384,
      maxCpuPercent: 90,
      cacheSize: 5000,
      graphics: 'ultra' as const,
      audioQuality: 96000,
    },
  };

  return configs[machineClass];
}
