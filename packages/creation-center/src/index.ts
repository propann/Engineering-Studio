/**
 * Creation Center - Unified Entity Creation System
 * Centralizes all creation processes from individual tools
 */

export type EntityType = 'display' | 'synth' | 'drum' | 'game' | 'character';

export interface CreatedEntity {
  id: string;
  type: EntityType;
  name: string;
  data: Record<string, any>;
  createdAt: number;
  version: string;
}

export interface CreationTemplate {
  type: EntityType;
  defaultValues: Record<string, any>;
  validator: (data: Record<string, any>) => { valid: boolean; errors?: string[] };
}

export class CreationCenter {
  private entities: Map<string, CreatedEntity> = new Map();
  private templates: Map<EntityType, CreationTemplate> = new Map();

  /**
   * Register a creation template
   */
  registerTemplate(type: EntityType, template: CreationTemplate): void {
    this.templates.set(type, template);
  }

  /**
   * Create new entity
   */
  create(type: EntityType, data: Record<string, any>): CreatedEntity {
    const template = this.templates.get(type);
    if (!template) throw new Error(`No template for ${type}`);

    const validation = template.validator(data);
    if (!validation.valid) throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);

    const entity: CreatedEntity = {
      id: `${type}-${Date.now()}`,
      type,
      name: data.name || `New ${type}`,
      data: { ...template.defaultValues, ...data },
      createdAt: Date.now(),
      version: '1.0.0',
    };

    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Get entity
   */
  get(id: string): CreatedEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * List entities by type
   */
  list(type?: EntityType): CreatedEntity[] {
    if (!type) return Array.from(this.entities.values());
    return Array.from(this.entities.values()).filter(e => e.type === type);
  }

  /**
   * Update entity
   */
  update(id: string, data: Partial<CreatedEntity>): CreatedEntity {
    const entity = this.entities.get(id);
    if (!entity) throw new Error(`Entity ${id} not found`);

    const updated = { ...entity, ...data, data: { ...entity.data, ...data.data } };
    this.entities.set(id, updated);
    return updated;
  }

  /**
   * Delete entity
   */
  delete(id: string): boolean {
    return this.entities.delete(id);
  }

  /**
   * Export all entities
   */
  export(): CreatedEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Import entities
   */
  import(entities: CreatedEntity[]): void {
    entities.forEach(e => this.entities.set(e.id, e));
  }

  /**
   * Clear all
   */
  clear(): void {
    this.entities.clear();
  }
}

export function createCreationCenter(): CreationCenter {
  return new CreationCenter();
}
