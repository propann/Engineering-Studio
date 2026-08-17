/**
 * Clipboard Service - Copy/Paste functionality
 */

import type { DrawingShape } from '../types';

class ClipboardService {
  private clipboard: DrawingShape[] = [];

  /**
   * Copy shapes to clipboard
   */
  copy(shapes: DrawingShape[]): void {
    this.clipboard = JSON.parse(JSON.stringify(shapes));
    console.log(`✓ Copied ${shapes.length} shape(s) to clipboard`);
  }

  /**
   * Paste shapes from clipboard with offset
   */
  paste(offsetX: number = 20, offsetY: number = 20): DrawingShape[] {
    if (this.clipboard.length === 0) {
      console.warn('Clipboard is empty');
      return [];
    }

    const pasted: DrawingShape[] = this.clipboard.map((shape) => ({
      ...shape,
      id: `shape-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      points: shape.points.map((p) => ({
        x: p.x + offsetX,
        y: p.y + offsetY,
      })),
    }));

    console.log(`✓ Pasted ${pasted.length} shape(s) from clipboard`);
    return pasted;
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = [];
    console.log('✓ Clipboard cleared');
  }

  /**
   * Check if clipboard has content
   */
  hasContent(): boolean {
    return this.clipboard.length > 0;
  }

  /**
   * Get clipboard content count
   */
  getCount(): number {
    return this.clipboard.length;
  }
}

export const clipboardService = new ClipboardService();
