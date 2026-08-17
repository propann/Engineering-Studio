/**
 * Services Tests
 * Test alignment, transform, clipboard, and file storage services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { alignmentService } from '../services/alignment';
import { transformService } from '../services/transform';
import { clipboardService } from '../services/clipboard';
import type { DrawingShape } from '../types';

// Helper to create test shapes
const createTestShape = (x: number, y: number, id: string = 'shape-1'): DrawingShape => ({
  id,
  type: 'rectangle',
  points: [{ x, y }],
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
});

describe('Alignment Service', () => {
  it('should align shapes left', () => {
    const shapes = [
      createTestShape(100, 0, 'shape-1'),
      createTestShape(200, 0, 'shape-2'),
      createTestShape(300, 0, 'shape-3'),
    ];

    const aligned = alignmentService.align(shapes, 'left');

    // All shapes should have same x position (minimum)
    aligned.forEach(shape => {
      expect(shape.points[0].x).toBe(100);
    });
  });

  it('should align shapes right', () => {
    const shapes = [
      createTestShape(100, 0, 'shape-1'),
      createTestShape(200, 0, 'shape-2'),
      createTestShape(300, 0, 'shape-3'),
    ];

    const aligned = alignmentService.align(shapes, 'right');

    // All shapes should have same x position (maximum)
    aligned.forEach(shape => {
      expect(shape.points[0].x).toBe(300);
    });
  });

  it('should distribute shapes horizontally', () => {
    const shapes = [
      createTestShape(0, 0, 'shape-1'),
      createTestShape(100, 0, 'shape-2'),
      createTestShape(200, 0, 'shape-3'),
    ];

    const distributed = alignmentService.distribute(shapes, 'distribute-h-centers');

    // Shapes should be evenly spaced
    expect(distributed).toHaveLength(3);
  });
});

describe('Transform Service', () => {
  it('should rotate shape', () => {
    const shape = createTestShape(100, 100);
    const rotated = transformService.rotateShape(shape, 90);

    expect(rotated.style.rotation).toBe(90);
    expect(rotated.id).toBe(shape.id);
  });

  it('should flip shape horizontally', () => {
    const shape = createTestShape(100, 100);
    const flipped = transformService.flipShape(shape, 'horizontal');

    expect(flipped.points[0].x).not.toBe(shape.points[0].x);
    expect(flipped.points[0].y).toBe(shape.points[0].y);
  });

  it('should flip shape vertically', () => {
    const shape = createTestShape(100, 100);
    const flipped = transformService.flipShape(shape, 'vertical');

    expect(flipped.points[0].x).toBe(shape.points[0].x);
    expect(flipped.points[0].y).not.toBe(shape.points[0].y);
  });

  it('should scale shape', () => {
    const shape = createTestShape(100, 100);
    const scaled = transformService.scaleShape(shape, 1.5);

    expect(scaled.points).toHaveLength(shape.points.length);
  });

  it('should get shape dimensions', () => {
    const shape = createTestShape(0, 0);
    const dims = transformService.getDimensions(shape);

    expect(dims.width).toBeGreaterThanOrEqual(0);
    expect(dims.height).toBeGreaterThanOrEqual(0);
  });

  it('should get shape center', () => {
    const shape = createTestShape(100, 100);
    const center = transformService.getCenter(shape);

    expect(center).toHaveProperty('x');
    expect(center).toHaveProperty('y');
  });
});

describe('Clipboard Service', () => {
  beforeEach(() => {
    clipboardService.clear();
  });

  it('should copy shapes to clipboard', () => {
    const shapes = [
      createTestShape(0, 0, 'shape-1'),
      createTestShape(100, 100, 'shape-2'),
    ];

    clipboardService.copy(shapes);

    expect(clipboardService.hasContent()).toBe(true);
    expect(clipboardService.getCount()).toBe(2);
  });

  it('should paste with offset', () => {
    const shapes = [createTestShape(0, 0, 'shape-1')];
    clipboardService.copy(shapes);

    const pasted = clipboardService.paste(50, 50);

    expect(pasted).toHaveLength(1);
    expect(pasted[0].points[0].x).toBe(50);
    expect(pasted[0].points[0].y).toBe(50);
  });

  it('should return empty array when clipboard empty', () => {
    const pasted = clipboardService.paste();

    expect(pasted).toHaveLength(0);
  });

  it('should clear clipboard', () => {
    const shapes = [createTestShape(0, 0)];
    clipboardService.copy(shapes);

    clipboardService.clear();

    expect(clipboardService.hasContent()).toBe(false);
    expect(clipboardService.getCount()).toBe(0);
  });
});

describe('Performance', () => {
  it('should align 100 shapes efficiently', () => {
    const shapes = Array.from({ length: 100 }, (_, i) =>
      createTestShape(i * 10, 0, `shape-${i}`)
    );

    const start = performance.now();
    alignmentService.align(shapes, 'left');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Should complete in < 50ms
  });

  it('should transform 100 shapes efficiently', () => {
    const shapes = Array.from({ length: 100 }, (_, i) =>
      createTestShape(i * 10, i * 10, `shape-${i}`)
    );

    const start = performance.now();
    shapes.forEach(shape => transformService.rotateShape(shape, 45));
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });
});
