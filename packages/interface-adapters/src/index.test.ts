import { describe, it, expect } from 'vitest';
import { createOP1Adapter, createEP133Adapter } from './index';
import { createCreationCenter } from '@studio-hub/creation-center';
import { createSaveManager } from '@studio-hub/save-manager';

describe('Interface Adapters', () => {
  it('should rewire OP-1 to central systems', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const op1 = createOP1Adapter(cc, sm);

    cc.registerTemplate('synth', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const displayId = op1.saveDisplay('Screen 1', { color: '#fff' });
    expect(displayId).toBeDefined();
    expect(op1.loadDisplay(displayId)?.color).toBe('#fff');
  });

  it('should create OP-1 project via creation-center', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const op1 = createOP1Adapter(cc, sm);

    cc.registerTemplate('synth', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const projectId = op1.createProject('My Project', { bpm: 120 });
    expect(projectId).toBeDefined();
  });

  it('should rewire EP-133 to central systems', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const ep133 = createEP133Adapter(cc, sm);

    cc.registerTemplate('drum', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const patternId = ep133.savePattern('Beat 1', { tempo: 120 });
    expect(patternId).toBeDefined();
    expect(ep133.loadPattern(patternId)?.tempo).toBe(120);
  });

  it('should create EP-133 drum machine via creation-center', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const ep133 = createEP133Adapter(cc, sm);

    cc.registerTemplate('drum', {
      defaultValues: {},
      validator: () => ({ valid: true }),
    });

    const drumId = ep133.createDrumMachine('Drums', { voices: 8 });
    expect(drumId).toBeDefined();
  });

  it('should list saves per interface', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const op1 = createOP1Adapter(cc, sm);
    const ep133 = createEP133Adapter(cc, sm);

    op1.saveDisplay('OP1 Display', {});
    ep133.savePattern('EP133 Pattern', {});

    const op1Saves = op1.listSaves();
    const ep133Saves = ep133.listSaves();

    expect(op1Saves.length).toBeGreaterThan(0);
    expect(ep133Saves.length).toBeGreaterThan(0);
  });

  it('should verify EP-133 data integrity', () => {
    const cc = createCreationCenter();
    const sm = createSaveManager();
    const ep133 = createEP133Adapter(cc, sm);

    ep133.savePattern('Pattern', {});
    const result = ep133.verifyIntegrity();

    expect(result.valid).toBe(true);
  });
});
