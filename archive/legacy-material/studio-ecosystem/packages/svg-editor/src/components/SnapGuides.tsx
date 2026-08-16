/**
 * Smart Guides Component - Visual alignment guides when dragging
 */

import { useEffect, useRef } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import './SnapGuides.css';

interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
}

export const SnapGuides = () => {
  const { selectedShapeIds, layers, currentLayerId, canvas } =
    useDrawingStore();
  const [guides, setGuides] = React.useState<Guide[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate guides based on shapes
  useEffect(() => {
    if (selectedShapeIds.length === 0) {
      setGuides([]);
      return;
    }

    const currentLayer = layers.find((l) => l.id === currentLayerId);
    if (!currentLayer) return;

    const allShapes = currentLayer.shapes;
    const newGuides: Guide[] = [];

    // Vertical guides (alignment points)
    const xPositions = new Set<number>();
    allShapes.forEach((shape) => {
      shape.points.forEach((p) => {
        xPositions.add(p.x);
      });
    });

    const selectedXPositions = new Set<number>();
    allShapes
      .filter((s) => selectedShapeIds.includes(s.id))
      .forEach((shape) => {
        shape.points.forEach((p) => {
          selectedXPositions.add(p.x);
        });
      });

    xPositions.forEach((x) => {
      if (!selectedXPositions.has(x)) {
        newGuides.push({
          type: 'vertical',
          position: x,
          color: '#6366f1',
        });
      }
    });

    // Horizontal guides (alignment points)
    const yPositions = new Set<number>();
    allShapes.forEach((shape) => {
      shape.points.forEach((p) => {
        yPositions.add(p.y);
      });
    });

    const selectedYPositions = new Set<number>();
    allShapes
      .filter((s) => selectedShapeIds.includes(s.id))
      .forEach((shape) => {
        shape.points.forEach((p) => {
          selectedYPositions.add(p.y);
        });
      });

    yPositions.forEach((y) => {
      if (!selectedYPositions.has(y)) {
        newGuides.push({
          type: 'horizontal',
          position: y,
          color: '#8b5cf6',
        });
      }
    });

    setGuides(newGuides);
  }, [selectedShapeIds, layers, currentLayerId]);

  // Draw guides on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || guides.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = canvas.width;
    canvasRef.current.height = canvas.height;

    guides.forEach((guide) => {
      ctx.strokeStyle = guide.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.globalAlpha = 0.3;

      if (guide.type === 'vertical') {
        ctx.beginPath();
        ctx.moveTo(guide.position, 0);
        ctx.lineTo(guide.position, canvas.height);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, guide.position);
        ctx.lineTo(canvas.width, guide.position);
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }, [guides, canvas.width, canvas.height]);

  return (
    <canvas
      ref={canvasRef}
      className="snap-guides"
      width={canvas.width}
      height={canvas.height}
    />
  );
};

import React from 'react';
