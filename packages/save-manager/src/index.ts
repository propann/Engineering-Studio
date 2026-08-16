/**
 * Save Manager - Unified Data Persistence System
 * Centralizes all saves from OP-1, EP-133, and other tools
 */

export type SaveType = 'project' | 'device' | 'settings' | 'snapshot' | 'exercise';

export interface SaveData {
  id: string;
  type: SaveType;
  tool: 'op1' | 'ep133' | 'studio-hub';
  name: string;
  timestamp: number;
  version: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SaveIndex {
  total: number;
  byType: Record<SaveType, number>;
  byTool: Record<string, number>;
  lastModified: number;
}

export class SaveManager {
  private saves: Map<string, SaveData> = new Map();
  private index: SaveIndex = {
    total: 0,
    byType: { project: 0, device: 0, settings: 0, snapshot: 0, exercise: 0 },
    byTool: { op1: 0, ep133: 0, 'studio-hub': 0 },
    lastModified: 0,
  };

  /**
   * Save data
   */
  save(type: SaveType, tool: 'op1' | 'ep133' | 'studio-hub', name: string, data: Record<string, any>): SaveData {
    const id = `${tool}-${type}-${Date.now()}`;
    const save: SaveData = {
      id,
      type,
      tool,
      name,
      timestamp: Date.now(),
      version: '1.0.0',
      data,
    };

    this.saves.set(id, save);
    this.updateIndex();
    return save;
  }

  /**
   * Get save
   */
  get(id: string): SaveData | undefined {
    return this.saves.get(id);
  }

  /**
   * List saves
   */
  list(filter?: { type?: SaveType; tool?: string }): SaveData[] {
    let results = Array.from(this.saves.values());
    if (filter?.type) results = results.filter(s => s.type === filter.type);
    if (filter?.tool) results = results.filter(s => s.tool === filter.tool);
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete save
   */
  delete(id: string): boolean {
    const deleted = this.saves.delete(id);
    if (deleted) this.updateIndex();
    return deleted;
  }

  /**
   * Export all saves
   */
  export(): { saves: SaveData[]; index: SaveIndex } {
    return { saves: Array.from(this.saves.values()), index: this.index };
  }

  /**
   * Import saves
   */
  import(saves: SaveData[]): void {
    saves.forEach(s => this.saves.set(s.id, s));
    this.updateIndex();
  }

  /**
   * Get index
   */
  getIndex(): SaveIndex {
    return { ...this.index };
  }

  /**
   * Verify data integrity
   */
  verify(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.saves.forEach((save, id) => {
      if (!save.id || !save.type || !save.data) {
        errors.push(`Invalid save ${id}: missing required fields`);
      }
      if (!['project', 'device', 'settings', 'snapshot', 'exercise'].includes(save.type)) {
        errors.push(`Invalid save ${id}: unknown type ${save.type}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Update index
   */
  private updateIndex(): void {
    this.index.total = this.saves.size;
    this.index.lastModified = Date.now();
    this.index.byType = { project: 0, device: 0, settings: 0, snapshot: 0, exercise: 0 };
    this.index.byTool = { op1: 0, ep133: 0, 'studio-hub': 0 };

    this.saves.forEach(save => {
      this.index.byType[save.type]++;
      this.index.byTool[save.tool]++;
    });
  }
}

export function createSaveManager(): SaveManager {
  return new SaveManager();
}
