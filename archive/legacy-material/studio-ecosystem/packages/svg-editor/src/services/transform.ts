/**
 * Transform Service - Rotate, Scale, Flip shapes
 */

import type { DrawingShape } from '../types';

export type FlipDirection = 'horizontal' | 'vertical';

class TransformService {
  /**
   * Rotate shape around its center
   */
  rotateShape(shape: DrawingShape, angle: number): DrawingShape {
    const newRotation = (shape.style.rotation + angle) % 360;

    return {
      ...shape,
      style: {
        ...shape.style,
        rotation: newRotation,
      },
    };
  }

  /**
   * Rotate multiple shapes around their collective center
   */
  rotateShapes(shapes: DrawingShape[], angle: number): DrawingShape[] {
    // Get collective center
    let centerX = 0,
      centerY = 0;

    shapes.forEach((shape) => {
      shape.points.forEach((p) => {
        centerX += p.x;
        centerY += p.y;
      });
    });

    const totalPoints = shapes.reduce((sum, s) => sum + s.points.length, 0);
    centerX /= totalPoints;
    centerY /= totalPoints;

    // Rotate each shape around center
    const rad = (angle * Math.PI) / 180;

    return shapes.map((shape) => ({
      ...shape,
      points: shape.points.map((p) => {
        const x = p.x - centerX;
        const y = p.y - centerY;
        return {
          x: x * Math.cos(rad) - y * Math.sin(rad) + centerX,
          y: x * Math.sin(rad) + y * Math.cos(rad) + centerY,
        };
      }),
      style: {
        ...shape.style,
        rotation: (shape.style.rotation + angle) % 360,
      },
    }));
  }

  /**
   * Scale shape
   */
  scaleShape(
    shape: DrawingShape,
    scaleX: number,
    scaleY: number = scaleX
  ): DrawingShape {
    // Get shape center
    let centerX = 0,
      centerY = 0;

    shape.points.forEach((p) => {
      centerX += p.x;
      centerY += p.y;
    });

    centerX /= shape.points.length;
    centerY /= shape.points.length;

    return {
      ...shape,
      points: shape.points.map((p) => ({
        x: centerX + (p.x - centerX) * scaleX,
        y: centerY + (p.y - centerY) * scaleY,
      })),
    };
  }

  /**
   * Flip shape horizontally or vertically
   */
  flipShape(shape: DrawingShape, direction: FlipDirection): DrawingShape {
    // Get shape bounds
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    shape.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    if (direction === 'horizontal') {
      const centerX = (minX + maxX) / 2;
      return {
        ...shape,
        points: shape.points.map((p) => ({
          x: 2 * centerX - p.x,
          y: p.y,
        })),
      };
    } else {
      const centerY = (minY + maxY) / 2;
      return {
        ...shape,
        points: shape.points.map((p) => ({
          x: p.x,
          y: 2 * centerY - p.y,
        })),
      };
    }
  }

  /**
   * Flip multiple shapes
   */
  flipShapes(
    shapes: DrawingShape[],
    direction: FlipDirection
  ): DrawingShape[] {
    return shapes.map((shape) => this.flipShape(shape, direction));
  }

  /**
   * Get shape dimensions
   */
  getDimensions(shape: DrawingShape): { width: number; height: number } {
    if (shape.points.length === 0) {
      return { width: 0, height: 0 };
    }

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    shape.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Get shape center
   */
  getCenter(shape: DrawingShape): { x: number; y: number } {
    if (shape.points.length === 0) {
      return { x: 0, y: 0 };
    }

    let centerX = 0,
      centerY = 0;

    shape.points.forEach((p) => {
      centerX += p.x;
      centerY += p.y;
    });

    return {
      x: centerX / shape.points.length,
      y: centerY / shape.points.length,
    };
  }

  /**
   * Apply transformation matrix (advanced)
   */
  applyMatrix(
    shape: DrawingShape,
    matrix: [number, number, number, number, number, number]
  ): DrawingShape {
    const [a, b, c, d, e, f] = matrix;

    return {
      ...shape,
      points: shape.points.map((p) => ({
        x: a * p.x + c * p.y + e,
        y: b * p.x + d * p.y + f,
      })),
    };
  }
}

export const transformService = new TransformService();
