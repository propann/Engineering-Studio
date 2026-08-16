/**
 * Interface Adapters - Rewire existing interfaces to central systems
 * Adapts OP-1, EP-133 to use Creation Center & Save Manager
 */

import type { CreationCenter } from '@studio-hub/creation-center';
import type { SaveManager } from '@studio-hub/save-manager';

/**
 * OP-1 Interface Adapter
 * Rewires OP-1 to use central creation & save systems
 */
export class OP1InterfaceAdapter {
  constructor(
    private creationCenter: CreationCenter,
    private saveManager: SaveManager
  ) {}

  /**
   * Save display (rewired to save-manager)
   */
  saveDisplay(name: string, data: Record<string, any>): string {
    const save = this.saveManager.save('device', 'op1', name, data);
    return save.id;
  }

  /**
   * Create project (rewired to creation-center)
   */
  createProject(name: string, config: Record<string, any>): string {
    const entity = this.creationCenter.create('synth', {
      name,
      tool: 'op1',
      ...config,
    });
    return entity.id;
  }

  /**
   * Load display from saves
   */
  loadDisplay(id: string): Record<string, any> | null {
    const save = this.saveManager.get(id);
    return save ? save.data : null;
  }

  /**
   * List all OP-1 saves
   */
  listSaves() {
    return this.saveManager.list({ tool: 'op1' });
  }
}

/**
 * EP-133 Interface Adapter
 * Rewires EP-133 to use central creation & save systems
 */
export class EP133InterfaceAdapter {
  constructor(
    private creationCenter: CreationCenter,
    private saveManager: SaveManager
  ) {}

  /**
   * Save pattern (rewired to save-manager)
   */
  savePattern(name: string, pattern: Record<string, any>): string {
    const save = this.saveManager.save('project', 'ep133', name, pattern);
    return save.id;
  }

  /**
   * Create drum machine (rewired to creation-center)
   */
  createDrumMachine(name: string, config: Record<string, any>): string {
    const entity = this.creationCenter.create('drum', {
      name,
      tool: 'ep133',
      ...config,
    });
    return entity.id;
  }

  /**
   * Load pattern from saves
   */
  loadPattern(id: string): Record<string, any> | null {
    const save = this.saveManager.get(id);
    return save ? save.data : null;
  }

  /**
   * List all EP-133 saves
   */
  listSaves() {
    return this.saveManager.list({ tool: 'ep133' });
  }

  /**
   * Verify all EP-133 data integrity
   */
  verifyIntegrity() {
    return this.saveManager.verify();
  }
}

/**
 * Factory functions
 */
export function createOP1Adapter(
  creationCenter: CreationCenter,
  saveManager: SaveManager
): OP1InterfaceAdapter {
  return new OP1InterfaceAdapter(creationCenter, saveManager);
}

export function createEP133Adapter(
  creationCenter: CreationCenter,
  saveManager: SaveManager
): EP133InterfaceAdapter {
  return new EP133InterfaceAdapter(creationCenter, saveManager);
}
