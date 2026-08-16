/**
 * SVG Editor Type Definitions
 */

export type ToolType = 'selection' | 'rectangle' | 'circle' | 'polygon' | 'pen' | 'text' | 'eraser' | 'line';

export type ShapeType = 'rectangle' | 'circle' | 'polygon' | 'line' | 'text' | 'path';

export interface Point {
  x: number;
  y: number;
}

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
}

export interface DrawingShape {
  id: string;
  type: ShapeType;
  points: Point[];
  style: ShapeStyle;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  visible: boolean;
  locked: boolean;
  createdAt: number;
}

export interface Layer {
  id: string;
  name: string;
  shapes: DrawingShape[];
  visible: boolean;
  opacity: number;
  blendMode: string;
}

export interface Canvas {
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface EditorState {
  canvas: Canvas;
  layers: Layer[];
  currentLayerId: string;
  selectedShapeIds: string[];
  currentTool: ToolType;
  currentStyle: ShapeStyle;
  history: DrawingShape[][];
  historyIndex: number;
  isDrawing: boolean;
  mousePos: Point;
}

export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf';
  filename: string;
  scale: number;
  quality: number;
}
