import { describe, it, expect } from 'vitest';
import { createSaveManager } from './index';

describe('Save Manager', () => {
  it('should save and retrieve data', () => {
    const mgr = createSaveManager();
    const save = mgr.save('project', 'op1', 'My Project', { bpm: 120 });
    expect(save.name).toBe('My Project');
    expect(mgr.get(save.id)?.data.bpm).toBe(120);
  });

  it('should list saves', () => {
    const mgr = createSaveManager();
    mgr.save('project', 'op1', 'P1', {});
    mgr.save('device', 'ep133', 'D1', {});
    expect(mgr.list().length).toBe(2);
  });

  it('should filter saves', () => {
    const mgr = createSaveManager();
    mgr.save('project', 'op1', 'P1', {});
    mgr.save('device', 'op1', 'D1', {});
    const projects = mgr.list({ type: 'project' });
    expect(projects.length).toBe(1);
  });

  it('should delete saves', () => {
    const mgr = createSaveManager();
    const save = mgr.save('project', 'op1', 'P1', {});
    mgr.delete(save.id);
    expect(mgr.get(save.id)).toBeUndefined();
  });

  it('should verify integrity', () => {
    const mgr = createSaveManager();
    mgr.save('project', 'op1', 'P1', {});
    const result = mgr.verify();
    expect(result.valid).toBe(true);
  });

  it('should export/import', () => {
    const mgr1 = createSaveManager();
    mgr1.save('project', 'op1', 'P1', {});
    const exported = mgr1.export();

    const mgr2 = createSaveManager();
    mgr2.import(exported.saves);
    expect(mgr2.list().length).toBe(1);
  });
});
