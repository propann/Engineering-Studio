/**
 * Alignment & Distribution Service
 * Align and distribute shapes on canvas
 */

import type { DrawingShape } from '../types';

export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributeType =
  | 'distribute-h-spacing'
  | 'distribute-v-spacing'
  | 'distribute-h-centers'
  | 'distribute-v-centers';

class AlignmentService {
  /**
   * Get bounds of shapes
   */
  private getBounds(shapes: DrawingShape[]) {
    if (shapes.length === 0) return null;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    shapes.forEach((shape) => {
      shape.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Get center point of shapes
   */
  private getCenter(shapes: DrawingShape[]) {
    const bounds = this.getBounds(shapes);
    if (!bounds) return null;

    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }

  /**
   * Get individual shape bounds
   */
  private getShapeBounds(shape: DrawingShape) {
    if (shape.points.length === 0) return null;

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

    return { minX, maxX, minY, maxY };
  }

  /**
   * Align shapes
   */
  align(shapes: DrawingShape[], type: AlignType): DrawingShape[] {
    const bounds = this.getBounds(shapes);
    if (!bounds) return shapes;

    return shapes.map((shape) => {
      const shapeBounds = this.getShapeBounds(shape);
      if (!shapeBounds) return shape;

      let offsetX = 0,
        offsetY = 0;

      switch (type) {
        case 'left':
          offsetX = bounds.minX - shapeBounds.minX;
          break;
        case 'center':
          const centerX = (bounds.minX + bounds.maxX) / 2;
          const shapeCenter = (shapeBounds.minX + shapeBounds.maxX) / 2;
          offsetX = centerX - shapeCenter;
          break;
        case 'right':
          offsetX = bounds.maxX - shapeBounds.maxX;
          break;
        case 'top':
          offsetY = bounds.minY - shapeBounds.minY;
          break;
        case 'middle':
          const middleY = (bounds.minY + bounds.maxY) / 2;
          const shapeMiddle = (shapeBounds.minY + shapeBounds.maxY) / 2;
          offsetY = middleY - shapeMiddle;
          break;
        case 'bottom':
          offsetY = bounds.maxY - shapeBounds.maxY;
          break;
      }

      return {
        ...shape,
        points: shape.points.map((p) => ({
          x: p.x + offsetX,
          y: p.y + offsetY,
        })),
      };
    });
  }

  /**
   * Distribute shapes evenly
   */
  distribute(shapes: DrawingShape[], type: DistributeType): DrawingShape[] {
    if (shapes.length < 2) return shapes;

    const bounds = this.getBounds(shapes);
    if (!bounds) return shapes;

    const sorted = [...shapes];

    switch (type) {
      case 'distribute-h-centers': {
        sorted.sort((a, b) => {
          const aCenter =
            (this.getShapeBounds(a)?.minX ?? 0) +
            ((this.getShapeBounds(a)?.maxX ?? 0) -
              (this.getShapeBounds(a)?.minX ?? 0)) /
              2;
          const bCenter =
            (this.getShapeBounds(b)?.minX ?? 0) +
            ((this.getShapeBounds(b)?.maxX ?? 0) -
              (this.getShapeBounds(b)?.minX ?? 0)) /
              2;
          return aCenter - bCenter;
        });

        const spacing =
          (bounds.maxX - bounds.minX) / (sorted.length - 1);

        return sorted.map((shape, idx) => {
          const shapeBounds = this.getShapeBounds(shape)!;
          const shapeWidth = shapeBounds.maxX - shapeBounds.minX;
          const targetX = bounds.minX + spacing * idx;
          const offsetX = targetX - (shapeBounds.minX + shapeWidth / 2);

          return {
            ...shape,
            points: shape.points.map((p) => ({
              x: p.x + offsetX,
              y: p.y,
            })),
          };
        });
      }

      case 'distribute-v-centers': {
        sorted.sort((a, b) => {
          const aCenter =
            (this.getShapeBounds(a)?.minY ?? 0) +
            ((this.getShapeBounds(a)?.maxY ?? 0) -
              (this.getShapeBounds(a)?.minY ?? 0)) /
              2;
          const bCenter =
            (this.getShapeBounds(b)?.minY ?? 0) +
            ((this.getShapeBounds(b)?.maxY ?? 0) -
              (this.getShapeBounds(b)?.minY ?? 0)) /
              2;
          return aCenter - bCenter;
        });

        const spacing =
          (bounds.maxY - bounds.minY) / (sorted.length - 1);

        return sorted.map((shape, idx) => {
          const shapeBounds = this.getShapeBounds(shape)!;
          const shapeHeight = shapeBounds.maxY - shapeBounds.minY;
          const targetY = bounds.minY + spacing * idx;
          const offsetY = targetY - (shapeBounds.minY + shapeHeight / 2);

          return {
            ...shape,
            points: shape.points.map((p) => ({
              x: p.x,
              y: p.y + offsetY,
            })),
          };
        });
      }

      default:
        return shapes;
    }
  }
}

export const alignmentService = new AlignmentService();
