/**
 * Resource Manager - Studio Hub Adaptive Framework
 * Tracks and allocates runtime resources based on machine capabilities
 */

export interface ResourceBudget {
  memory: number; // MB
  cpu: number; // Percent (0-100)
  cache: number; // MB
}

export interface ResourceAllocation {
  name: string;
  memory: number; // MB
  cpu: number; // Percent
  timestamp: number;
  priority?: number;
}

export interface ResourceUsage {
  allocated: ResourceBudget;
  available: ResourceBudget;
  utilization: {
    memory: number; // Percent
    cpu: number; // Percent
    cache: number; // Percent
  };
}

export interface ResourceManagerStore {
  budget: ResourceBudget;
  allocations: Map<string, ResourceAllocation>;
  listeners: Set<ResourceListener>;
}

export type ResourceListener = (event: ResourceEvent) => void;

export interface ResourceEvent {
  type: 'allocate' | 'release' | 'warning' | 'exceeded';
  allocation?: string;
  message: string;
  usage?: ResourceUsage;
}

/**
 * Create a new resource manager
 */
export function createResourceManager(budget: ResourceBudget): ResourceManagerStore {
  return {
    budget: { ...budget },
    allocations: new Map(),
    listeners: new Set(),
  };
}

/**
 * Create resource manager from config
 */
export function createFromConfig(config: {
  maxMemoryMB: number;
  maxCpuPercent: number;
  cacheSize: number;
}): ResourceManagerStore {
  return createResourceManager({
    memory: config.maxMemoryMB,
    cpu: config.maxCpuPercent,
    cache: config.cacheSize,
  });
}

/**
 * Allocate resources for a named component
 */
export function allocate(
  store: ResourceManagerStore,
  name: string,
  request: { memory?: number; cpu?: number },
  priority: number = 50
): boolean {
  const memoryNeeded = request.memory || 0;
  const cpuNeeded = request.cpu || 0;

  // Check if allocation is possible
  if (!canAllocate(store, { memory: memoryNeeded, cpu: cpuNeeded })) {
    notifyListeners(store, {
      type: 'exceeded',
      allocation: name,
      message: `Cannot allocate ${memoryNeeded}MB memory, ${cpuNeeded}% CPU for ${name}`,
      usage: getUsage(store),
    });
    return false;
  }

  // Create allocation
  const allocation: ResourceAllocation = {
    name,
    memory: memoryNeeded,
    cpu: cpuNeeded,
    priority,
    timestamp: Date.now(),
  };

  store.allocations.set(name, allocation);

  notifyListeners(store, {
    type: 'allocate',
    allocation: name,
    message: `Allocated ${memoryNeeded}MB memory, ${cpuNeeded}% CPU for ${name}`,
    usage: getUsage(store),
  });

  return true;
}

/**
 * Release allocated resources
 */
export function release(store: ResourceManagerStore, name: string): boolean {
  const allocation = store.allocations.get(name);

  if (!allocation) {
    return false;
  }

  store.allocations.delete(name);

  notifyListeners(store, {
    type: 'release',
    allocation: name,
    message: `Released ${allocation.memory}MB memory, ${allocation.cpu}% CPU from ${name}`,
    usage: getUsage(store),
  });

  return true;
}

/**
 * Check if resources can be allocated
 */
export function canAllocate(
  store: ResourceManagerStore,
  request: { memory?: number; cpu?: number }
): boolean {
  const available = getAvailable(store);

  const memoryNeeded = request.memory || 0;
  const cpuNeeded = request.cpu || 0;

  return available.memory >= memoryNeeded && available.cpu >= cpuNeeded;
}

/**
 * Get currently allocated resources
 */
export function getAllocated(store: ResourceManagerStore): ResourceBudget {
  let totalMemory = 0;
  let totalCpu = 0;

  for (const allocation of store.allocations.values()) {
    totalMemory += allocation.memory;
    totalCpu += allocation.cpu;
  }

  return {
    memory: totalMemory,
    cpu: totalCpu,
    cache: 0, // Cache is not currently tracked per allocation
  };
}

/**
 * Get available resources
 */
export function getAvailable(store: ResourceManagerStore): ResourceBudget {
  const allocated = getAllocated(store);

  return {
    memory: Math.max(0, store.budget.memory - allocated.memory),
    cpu: Math.max(0, store.budget.cpu - allocated.cpu),
    cache: Math.max(0, store.budget.cache - allocated.memory), // Use allocated memory as proxy for cache usage
  };
}

/**
 * Get resource usage statistics
 */
export function getUsage(store: ResourceManagerStore): ResourceUsage {
  const allocated = getAllocated(store);
  const available = getAvailable(store);

  const memoryUtilization = (allocated.memory / store.budget.memory) * 100;
  const cpuUtilization = (allocated.cpu / store.budget.cpu) * 100;
  const cacheUtilization = (allocated.memory / store.budget.cache) * 100;

  return {
    allocated,
    available,
    utilization: {
      memory: Math.min(100, memoryUtilization),
      cpu: Math.min(100, cpuUtilization),
      cache: Math.min(100, cacheUtilization),
    },
  };
}

/**
 * Get information about a specific allocation
 */
export function getAllocationInfo(
  store: ResourceManagerStore,
  name: string
): ResourceAllocation | undefined {
  return store.allocations.get(name);
}

/**
 * Get all active allocations
 */
export function getAllAllocations(store: ResourceManagerStore): ResourceAllocation[] {
  return Array.from(store.allocations.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Check if utilization exceeds threshold
 */
export function isResourceCritical(store: ResourceManagerStore, threshold: number = 90): boolean {
  const usage = getUsage(store);

  return (
    usage.utilization.memory > threshold ||
    usage.utilization.cpu > threshold ||
    usage.utilization.cache > threshold
  );
}

/**
 * Suggest resources that could be freed
 */
export function suggestFreeable(
  store: ResourceManagerStore,
  minimumPriority: number = 0
): string[] {
  const freeable: string[] = [];

  for (const allocation of store.allocations.values()) {
    if ((allocation.priority || 0) <= minimumPriority) {
      freeable.push(allocation.name);
    }
  }

  return freeable.sort(
    (a, b) =>
      ((store.allocations.get(a)?.priority || 0) as number) -
      ((store.allocations.get(b)?.priority || 0) as number)
  );
}

/**
 * Get resource summary for logging
 */
export function getSummary(store: ResourceManagerStore): Record<string, unknown> {
  const usage = getUsage(store);
  const allocations = getAllAllocations(store);

  return {
    budget: store.budget,
    allocated: usage.allocated,
    available: usage.available,
    utilization: usage.utilization,
    allocations: allocations.length,
    critical: isResourceCritical(store),
  };
}

/**
 * Subscribe to resource events
 */
export function subscribe(
  store: ResourceManagerStore,
  listener: ResourceListener
): () => void {
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
}

/**
 * Notify listeners of resource events
 */
function notifyListeners(store: ResourceManagerStore, event: ResourceEvent): void {
  for (const listener of store.listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error(`Error in resource listener: ${error}`);
    }
  }
}
