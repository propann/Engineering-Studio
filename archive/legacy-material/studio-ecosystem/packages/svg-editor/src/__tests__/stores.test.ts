/**
 * Zustand Store Tests
 * Test state management, actions, and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDrawingStore } from '../store/drawingStore';
import type { DrawingShape } from '../types';

describe('Drawing Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store before each test
    useDrawingStore.setState({
      layers: [
        {
          id: 'layer-1',
          name: 'Layer 1',
          shapes: [],
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
      ],
      currentLayerId: 'layer-1',
      selectedShapeIds: [],
    });
    localStorage.clear();
  });

  describe('Canvas Controls', () => {
    it('should initialize with default canvas', () => {
      const state = useDrawingStore.getState();
      expect(state.canvas.width).toBe(1920);
      expect(state.canvas.height).toBe(1080);
      expect(state.canvas.zoom).toBe(1);
    });

    it('should update zoom within bounds', () => {
      const { setZoom } = useDrawingStore.getState();

      setZoom(2);
      expect(useDrawingStore.getState().canvas.zoom).toBe(2);

      setZoom(10); // Should clamp to 5
      expect(useDrawingStore.getState().canvas.zoom).toBe(5);

      setZoom(0.05); // Should clamp to 0.1
      expect(useDrawingStore.getState().canvas.zoom).toBe(0.1);
    });

    it('should toggle grid visibility', () => {
      const { toggleGrid } = useDrawingStore.getState();
      const initial = useDrawingStore.getState().canvas.showGrid;

      toggleGrid();
      expect(useDrawingStore.getState().canvas.showGrid).toBe(!initial);

      toggleGrid();
      expect(useDrawingStore.getState().canvas.showGrid).toBe(initial);
    });

    it('should set pan position', () => {
      const { setPan } = useDrawingStore.getState();

      setPan(100, 200);
      const state = useDrawingStore.getState();
      expect(state.canvas.panX).toBe(100);
      expect(state.canvas.panY).toBe(200);
    });
  });

  describe('Shape Management', () => {
    it('should add shape to current layer', () => {
      const { addShape } = useDrawingStore.getState();
      const testShape: DrawingShape = {
        id: 'shape-1',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        style: {
          fill: '#000',
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };

      addShape(testShape);

      const state = useDrawingStore.getState();
      const currentLayer = state.layers.find(l => l.id === state.currentLayerId);
      expect(currentLayer?.shapes).toContainEqual(testShape);
    });

    it('should update shape properties', () => {
      const { addShape, updateShape } = useDrawingStore.getState();
      const testShape: DrawingShape = {
        id: 'shape-1',
        type: 'circle',
        points: [{ x: 100, y: 100 }],
        style: {
          fill: '#000',
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };

      addShape(testShape);
      updateShape('shape-1', { visible: false, style: { ...testShape.style, opacity: 0.5 } });

      const state = useDrawingStore.getState();
      const currentLayer = state.layers.find(l => l.id === state.currentLayerId);
      const updated = currentLayer?.shapes.find(s => s.id === 'shape-1');

      expect(updated?.visible).toBe(false);
      expect(updated?.style.opacity).toBe(0.5);
    });

    it('should delete shape', () => {
      const { addShape, deleteShape } = useDrawingStore.getState();
      const testShape: DrawingShape = {
        id: 'shape-1',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        style: {
          fill: '#000',
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };

      addShape(testShape);
      deleteShape('shape-1');

      const state = useDrawingStore.getState();
      const currentLayer = state.layers.find(l => l.id === state.currentLayerId);
      expect(currentLayer?.shapes.find(s => s.id === 'shape-1')).toBeUndefined();
    });

    it('should select and deselect shapes', () => {
      const { selectShape, deselectAll } = useDrawingStore.getState();

      selectShape('shape-1');
      expect(useDrawingStore.getState().selectedShapeIds).toContain('shape-1');

      selectShape('shape-2', true); // Multi-select
      expect(useDrawingStore.getState().selectedShapeIds).toHaveLength(2);

      deselectAll();
      expect(useDrawingStore.getState().selectedShapeIds).toHaveLength(0);
    });
  });

  describe('Layer Management', () => {
    it('should create new layer', () => {
      const { createLayer } = useDrawingStore.getState();

      createLayer('New Layer');

      const state = useDrawingStore.getState();
      const newLayer = state.layers.find(l => l.name === 'New Layer');
      expect(newLayer).toBeDefined();
      expect(newLayer?.shapes).toHaveLength(0);
    });

    it('should not delete last layer', () => {
      const { deleteLayer } = useDrawingStore.getState();
      const state = useDrawingStore.getState();
      const firstLayerId = state.layers[0].id;

      deleteLayer(firstLayerId);

      // Should still have the layer
      expect(useDrawingStore.getState().layers).toHaveLength(1);
    });

    it('should rename layer', () => {
      const { createLayer, renameLayer } = useDrawingStore.getState();
      createLayer('Test Layer');

      const state = useDrawingStore.getState();
      const layerId = state.layers.find(l => l.name === 'Test Layer')?.id;

      renameLayer(layerId!, 'Renamed Layer');

      const renamed = useDrawingStore.getState().layers.find(l => l.id === layerId);
      expect(renamed?.name).toBe('Renamed Layer');
    });

    it('should toggle layer visibility', () => {
      const { createLayer, toggleLayerVisibility } = useDrawingStore.getState();
      createLayer('Test Layer');

      const state = useDrawingStore.getState();
      const layerId = state.layers.find(l => l.name === 'Test Layer')?.id;
      const initialVisibility = state.layers.find(l => l.id === layerId)?.visible;

      toggleLayerVisibility(layerId!);

      const toggled = useDrawingStore.getState().layers.find(l => l.id === layerId);
      expect(toggled?.visible).toBe(!initialVisibility);
    });
  });

  describe('Tool Management', () => {
    it('should set current tool', () => {
      const { setCurrentTool } = useDrawingStore.getState();

      setCurrentTool('rectangle');
      expect(useDrawingStore.getState().currentTool).toBe('rectangle');

      setCurrentTool('circle');
      expect(useDrawingStore.getState().currentTool).toBe('circle');
    });

    it('should update style', () => {
      const { setCurrentStyle } = useDrawingStore.getState();
      const initialFill = useDrawingStore.getState().currentStyle.fill;

      setCurrentStyle({ fill: '#ff0000' });
      expect(useDrawingStore.getState().currentStyle.fill).toBe('#ff0000');
      expect(useDrawingStore.getState().currentStyle.stroke).toBe(initialFill === '#ff0000'
        ? initialFill
        : '#1f2937'); // Default stroke
    });
  });

  describe('History', () => {
    it('should clear history', () => {
      const { clearHistory } = useDrawingStore.getState();

      clearHistory();

      const state = useDrawingStore.getState();
      expect(state.history).toHaveLength(0);
      expect(state.historyIndex).toBe(-1);
    });
  });

  describe('Export', () => {
    it('should export visible shapes from visible layers', () => {
      const { addShape, createLayer, toggleLayerVisibility, getExportData } = useDrawingStore.getState();

      const shape: DrawingShape = {
        id: 'shape-1',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        style: {
          fill: '#000',
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };

      addShape(shape);
      const exported = getExportData();

      expect(exported).toContainEqual(shape);
    });
  });
});
