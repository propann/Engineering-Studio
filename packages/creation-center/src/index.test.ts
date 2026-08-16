import { describe, it, expect } from 'vitest';
import { createCreationCenter } from './index';

describe('Creation Center', () => {
  it('should create and retrieve entities', () => {
    const center = createCreationCenter();
    center.registerTemplate('display', {
      defaultValues: { color: '#000' },
      validator: () => ({ valid: true }),
    });

    const entity = center.create('display', { name: 'Screen 1' });
    expect(entity.name).toBe('Screen 1');
    expect(center.get(entity.id)).toBeDefined();
  });

  it('should list entities by type', () => {
    const center = createCreationCenter();
    center.registerTemplate('display', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    center.create('display', { name: 'A' });
    expect(center.list('display').length).toBeGreaterThan(0);
  });

  it('should update entities', () => {
    const center = createCreationCenter();
    center.registerTemplate('display', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const entity = center.create('display', { name: 'Original' });
    const updated = center.update(entity.id, { name: 'Updated' });
    expect(updated.name).toBe('Updated');
  });

  it('should delete entities', () => {
    const center = createCreationCenter();
    center.registerTemplate('display', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const entity = center.create('display', { name: 'Temp' });
    center.delete(entity.id);
    expect(center.get(entity.id)).toBeUndefined();
  });

  it('should export and import', () => {
    const center1 = createCreationCenter();
    center1.registerTemplate('display', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    center1.create('display', { name: 'A' });
    const exported = center1.export();
    expect(exported.length).toBeGreaterThan(0);

    const center2 = createCreationCenter();
    center2.import(exported);
    expect(center2.list().length).toBeGreaterThan(0);
  });
});
