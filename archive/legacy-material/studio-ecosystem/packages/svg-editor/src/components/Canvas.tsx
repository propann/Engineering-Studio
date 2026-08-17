/**
 * Canvas Component - SVG Drawing Canvas
 * Integrates Fabric.js for shape rendering and interaction
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Polygon, Line, Text as FabricText } from 'fabric';
import { useDrawingStore } from '../store/drawingStore';
import type { DrawingShape, ShapeType } from '../types';
import './Canvas.css';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    canvas: canvasState,
    layers,
    currentTool,
    currentStyle,
    selectedShapeIds,
    isDrawing,
    mousePos,
    addShape,
    updateShape,
    selectShape,
    deselectAll,
    setZoom,
    setPan,
  } = useDrawingStore();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: canvasState.width,
      height: canvasState.height,
      backgroundColor: canvasState.backgroundColor,
      selection: false,
      defaultCursor: 'default',
    });

    fabricCanvasRef.current = fabricCanvas;

    // Render grid
    renderGrid(fabricCanvas, canvasState.gridSize);

    // Setup events
    setupCanvasEvents(fabricCanvas);

    setIsInitialized(true);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Render all shapes from Zustand store
  useEffect(() => {
    if (!fabricCanvasRef.current || !isInitialized) return;

    const fabricCanvas = fabricCanvasRef.current;
    fabricCanvas.clear();

    // Redraw grid
    renderGrid(fabricCanvas, canvasState.gridSize);

    // Draw all visible shapes from visible layers
    layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.shapes.forEach((shape) => {
        if (!shape.visible) return;
        renderShape(fabricCanvas, shape);
      });
    });

    // Highlight selected shapes
    selectedShapeIds.forEach((shapeId) => {
      const fabricObj = fabricCanvas.getObjects().find((obj: any) => obj.shapeId === shapeId);
      if (fabricObj) {
        fabricObj.set({ stroke: '#06b6d4', strokeWidth: 3 });
      }
    });

    fabricCanvas.renderAll();
  }, [layers, selectedShapeIds, isInitialized, canvasState.backgroundColor]);

  // Handle mouse events
  const setupCanvasEvents = (fabricCanvas: FabricCanvas) => {
    let startX = 0;
    let startY = 0;
    let isDrawingShape = false;
    let currentPath: any[] = [];

    fabricCanvas.on('mouse:down', (e: any) => {
      const pointer = fabricCanvas.getPointer(e.e);
      startX = pointer.x;
      startY = pointer.y;

      if (currentTool === 'selection') {
        // Check for shape selection
        if (e.target && (e.target as any).shapeId) {
          const shapeId = (e.target as any).shapeId;
          selectShape(shapeId, e.e.ctrlKey || e.e.metaKey);
        } else {
          deselectAll();
        }
      } else if (
        currentTool === 'rectangle' ||
        currentTool === 'circle' ||
        currentTool === 'line'
      ) {
        isDrawingShape = true;
      } else if (currentTool === 'pen' || currentTool === 'eraser') {
        isDrawingShape = true;
        currentPath = [{ x: startX, y: startY }];
      }
    });

    fabricCanvas.on('mouse:move', (e: any) => {
      const pointer = fabricCanvas.getPointer(e.e);

      if (!isDrawingShape) return;

      if (currentTool === 'pen' || currentTool === 'eraser') {
        currentPath.push({ x: pointer.x, y: pointer.y });
      }
    });

    fabricCanvas.on('mouse:up', (e: any) => {
      const pointer = fabricCanvas.getPointer(e.e);

      if (isDrawingShape) {
        if (currentTool === 'rectangle') {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          const left = Math.min(startX, pointer.x);
          const top = Math.min(startY, pointer.y);

          addShape({
            id: `shape-${Date.now()}`,
            type: 'rectangle',
            points: [{ x: left, y: top }],
            style: currentStyle,
            visible: true,
            locked: false,
            createdAt: Date.now(),
          });
        } else if (currentTool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
          ) / 2;

          addShape({
            id: `shape-${Date.now()}`,
            type: 'circle',
            points: [{ x: (startX + pointer.x) / 2, y: (startY + pointer.y) / 2 }],
            style: currentStyle,
            visible: true,
            locked: false,
            createdAt: Date.now(),
          });
        } else if (currentTool === 'line') {
          addShape({
            id: `shape-${Date.now()}`,
            type: 'line',
            points: [
              { x: startX, y: startY },
              { x: pointer.x, y: pointer.y },
            ],
            style: currentStyle,
            visible: true,
            locked: false,
            createdAt: Date.now(),
          });
        } else if (currentTool === 'pen' || currentTool === 'eraser') {
          addShape({
            id: `shape-${Date.now()}`,
            type: 'path',
            points: currentPath,
            style: currentStyle,
            visible: true,
            locked: false,
            createdAt: Date.now(),
          });
        }
      }

      isDrawingShape = false;
      currentPath = [];
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedShapeIds.forEach((id) => {
          const { deleteShape } = useDrawingStore.getState();
          deleteShape(id);
        });
      }
    });
  };

  const renderShape = (fabricCanvas: FabricCanvas, shape: DrawingShape) => {
    let fabricObj: any;

    switch (shape.type) {
      case 'rectangle': {
        const point = shape.points[0];
        fabricObj = new Rect({
          left: point.x,
          top: point.y,
          width: 100,
          height: 100,
          fill: shape.style.fill,
          stroke: shape.style.stroke,
          strokeWidth: shape.style.strokeWidth,
          opacity: shape.style.opacity,
          angle: shape.style.rotation,
        });
        break;
      }

      case 'circle': {
        const point = shape.points[0];
        fabricObj = new Circle({
          left: point.x,
          top: point.y,
          radius: 50,
          fill: shape.style.fill,
          stroke: shape.style.stroke,
          strokeWidth: shape.style.strokeWidth,
          opacity: shape.style.opacity,
        });
        break;
      }

      case 'line': {
        const points = shape.points;
        if (points.length >= 2) {
          fabricObj = new Line([points[0].x, points[0].y, points[1].x, points[1].y], {
            stroke: shape.style.stroke,
            strokeWidth: shape.style.strokeWidth,
            opacity: shape.style.opacity,
          });
        }
        break;
      }

      case 'text': {
        const point = shape.points[0];
        fabricObj = new FabricText(shape.text || 'Text', {
          left: point.x,
          top: point.y,
          fontSize: shape.fontSize || 16,
          fontFamily: shape.fontFamily || 'Arial',
          fill: shape.style.fill,
          opacity: shape.style.opacity,
        });
        break;
      }

      case 'path': {
        // Simple path rendering
        break;
      }

      case 'polygon': {
        const points = shape.points.map((p) => [p.x, p.y]);
        fabricObj = new Polygon(points as any, {
          fill: shape.style.fill,
          stroke: shape.style.stroke,
          strokeWidth: shape.style.strokeWidth,
          opacity: shape.style.opacity,
        });
        break;
      }

      default:
        return;
    }

    if (fabricObj) {
      (fabricObj as any).shapeId = shape.id;
      fabricObj.selectable = currentTool === 'selection';
      fabricCanvas.add(fabricObj);
    }
  };

  const renderGrid = (fabricCanvas: FabricCanvas, gridSize: number) => {
    if (!canvasState.showGrid) return;

    const ctx = fabricCanvas.getContext();
    const width = fabricCanvas.width || 1920;
    const height = fabricCanvas.height || 1080;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Handle zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.setZoom(canvasState.zoom);
    canvas.renderAll();
  }, [canvasState.zoom]);

  // Handle pan
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.setViewportTransform([1, 0, 0, 1, canvasState.panX, canvasState.panY]);
    canvas.renderAll();
  }, [canvasState.panX, canvasState.panY]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom(Math.min(5, canvasState.zoom + 0.1));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(Math.max(0.1, canvasState.zoom - 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }
      }

      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeIds.length > 0) {
        e.preventDefault();
        selectedShapeIds.forEach((id) => {
          const { deleteShape } = useDrawingStore.getState();
          deleteShape(id);
        });
      }

      // Deselect all
      if (e.key === 'Escape') {
        deselectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds, canvasState.zoom]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas"
        data-testid="drawing-canvas"
      />
      <div className="canvas-info">
        <span>Zoom: {Math.round(canvasState.zoom * 100)}%</span>
        <span>Selected: {selectedShapeIds.length}</span>
        <span>Tool: {currentTool}</span>
      </div>
    </div>
  );
};
