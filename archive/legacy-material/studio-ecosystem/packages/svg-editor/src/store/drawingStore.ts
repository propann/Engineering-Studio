/**
 * Drawing Editor State Store (Zustand)
 * Manages canvas, layers, shapes, and tools
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorState, DrawingShape, Layer, ToolType, ShapeStyle, Point, Canvas } from '../types';

const DEFAULT_STYLE: ShapeStyle = {
  fill: '#4f46e5',
  stroke: '#1f2937',
  strokeWidth: 2,
  opacity: 1,
  rotation: 0,
};

const DEFAULT_CANVAS: Canvas = {
  width: 1920,
  height: 1080,
  backgroundColor: '#ffffff',
  showGrid: true,
  gridSize: 20,
  zoom: 1,
  panX: 0,
  panY: 0,
};

interface DrawingStore extends EditorState {
  // Tool actions
  setCurrentTool: (tool: ToolType) => void;
  setCurrentStyle: (style: Partial<ShapeStyle>) => void;

  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setGridVisible: (visible: boolean) => void;
  toggleGrid: () => void;

  // Shape actions
  addShape: (shape: DrawingShape) => void;
  updateShape: (id: string, updates: Partial<DrawingShape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string, multiSelect?: boolean) => void;
  deselectAll: () => void;
  duplicateShape: (id: string) => void;

  // Layer actions
  createLayer: (name: string) => void;
  deleteLayer: (id: string) => void;
  setCurrentLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerVisibility: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Export
  getExportData: () => DrawingShape[];
  clear: () => void;
}

export const useDrawingStore = create<DrawingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      canvas: DEFAULT_CANVAS,
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
      currentTool: 'selection',
      currentStyle: DEFAULT_STYLE,
      history: [],
      historyIndex: -1,
      isDrawing: false,
      mousePos: { x: 0, y: 0 },

      // Tool actions
      setCurrentTool: (tool) => set({ currentTool: tool }),

      setCurrentStyle: (style) =>
        set((state) => ({
          currentStyle: { ...state.currentStyle, ...style },
        })),

      // Canvas actions
      setZoom: (zoom) =>
        set((state) => ({
          canvas: { ...state.canvas, zoom: Math.max(0.1, Math.min(5, zoom)) },
        })),

      setPan: (x, y) =>
        set((state) => ({
          canvas: { ...state.canvas, panX: x, panY: y },
        })),

      setGridVisible: (visible) =>
        set((state) => ({
          canvas: { ...state.canvas, showGrid: visible },
        })),

      toggleGrid: () =>
        set((state) => ({
          canvas: { ...state.canvas, showGrid: !state.canvas.showGrid },
        })),

      // Shape actions
      addShape: (shape) => {
        set((state) => {
          const currentLayer = state.layers.find((l) => l.id === state.currentLayerId);
          if (!currentLayer) return state;

          const newLayers = state.layers.map((l) =>
            l.id === state.currentLayerId
              ? { ...l, shapes: [...l.shapes, shape] }
              : l
          );

          return {
            layers: newLayers,
            history: [...state.history.slice(0, state.historyIndex + 1), []],
            historyIndex: state.historyIndex + 1,
          };
        });
      },

      updateShape: (id, updates) => {
        set((state) => {
          const newLayers = state.layers.map((layer) => ({
            ...layer,
            shapes: layer.shapes.map((shape) =>
              shape.id === id ? { ...shape, ...updates } : shape
            ),
          }));

          return { layers: newLayers };
        });
      },

      deleteShape: (id) => {
        set((state) => {
          const newLayers = state.layers.map((layer) => ({
            ...layer,
            shapes: layer.shapes.filter((shape) => shape.id !== id),
          }));

          return {
            layers: newLayers,
            selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
          };
        });
      },

      selectShape: (id, multiSelect = false) => {
        set((state) => ({
          selectedShapeIds: multiSelect
            ? [...state.selectedShapeIds, id]
            : [id],
        }));
      },

      deselectAll: () => set({ selectedShapeIds: [] }),

      duplicateShape: (id) => {
        const state = get();
        const layer = state.layers.find((l) => l.id === state.currentLayerId);
        if (!layer) return;

        const shape = layer.shapes.find((s) => s.id === id);
        if (!shape) return;

        const newShape: DrawingShape = {
          ...shape,
          id: `shape-${Date.now()}`,
          createdAt: Date.now(),
        };

        get().addShape(newShape);
      },

      // Layer actions
      createLayer: (name) => {
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name,
          shapes: [],
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          currentLayerId: newLayer.id,
        }));
      },

      deleteLayer: (id) => {
        set((state) => {
          if (state.layers.length === 1) return state;

          const newLayers = state.layers.filter((l) => l.id !== id);
          const newCurrentLayer =
            state.currentLayerId === id ? newLayers[0].id : state.currentLayerId;

          return {
            layers: newLayers,
            currentLayerId: newCurrentLayer,
          };
        });
      },

      setCurrentLayer: (id) => set({ currentLayerId: id }),

      renameLayer: (id, name) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === id ? { ...l, name } : l
          ),
        }));
      },

      toggleLayerVisibility: (id) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === id ? { ...l, visible: !l.visible } : l
          ),
        }));
      },

      // History
      undo: () => {
        set((state) => ({
          historyIndex: Math.max(0, state.historyIndex - 1),
        }));
      },

      redo: () => {
        set((state) => ({
          historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1),
        }));
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 });
      },

      // Export
      getExportData: () => {
        const state = get();
        return state.layers
          .filter((layer) => layer.visible)
          .flatMap((layer) => layer.shapes.filter((shape) => shape.visible));
      },

      clear: () => {
        set({
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
          history: [],
          historyIndex: -1,
        });
      },
    }),
    {
      name: 'svg-editor-store',
      partialize: (state) => ({
        layers: state.layers,
        canvas: state.canvas,
        currentTool: state.currentTool,
        currentStyle: state.currentStyle,
      }),
    }
  )
);
