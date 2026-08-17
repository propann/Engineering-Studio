/**
 * Touch Gestures Service - Handle multi-touch interactions
 */

export interface GestureEvent {
  type: 'pan' | 'pinch' | 'rotate' | 'tap' | 'longpress';
  dx?: number;
  dy?: number;
  scale?: number;
  angle?: number;
  x?: number;
  y?: number;
}

export type GestureCallback = (event: GestureEvent) => void;

class TouchGesturesService {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartDistance = 0;
  private touchStartAngle = 0;
  private initialScale = 1;
  private initialRotation = 0;
  private longPressTimer: NodeJS.Timeout | null = null;
  private readonly LONG_PRESS_DELAY = 500;
  private readonly PAN_THRESHOLD = 10;

  /**
   * Initialize touch listeners
   */
  init(element: HTMLElement, callbacks: Partial<Record<GestureEvent['type'], GestureCallback>>): void {
    element.addEventListener('touchstart', (e) => this.handleTouchStart(e, callbacks));
    element.addEventListener('touchmove', (e) => this.handleTouchMove(e, callbacks));
    element.addEventListener('touchend', (e) => this.handleTouchEnd(e, callbacks));
    element.addEventListener('touchcancel', (e) => this.handleTouchCancel(e, callbacks));
  }

  /**
   * Get distance between two touch points
   */
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get angle between two touch points
   */
  private getAngle(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(
    e: TouchEvent,
    callbacks: Partial<Record<GestureEvent['type'], GestureCallback>>
  ): void {
    const touches = e.touches;

    if (touches.length === 1) {
      // Single touch - prepare for pan or long press
      this.touchStartX = touches[0].clientX;
      this.touchStartY = touches[0].clientY;

      // Start long press timer
      this.longPressTimer = setTimeout(() => {
        callbacks['longpress']?.({
          type: 'longpress',
          x: this.touchStartX,
          y: this.touchStartY,
        });
      }, this.LONG_PRESS_DELAY);
    } else if (touches.length === 2) {
      // Multi-touch - prepare for pinch or rotate
      this.touchStartDistance = this.getDistance(
        touches[0].clientX,
        touches[0].clientY,
        touches[1].clientX,
        touches[1].clientY
      );

      this.touchStartAngle = this.getAngle(
        touches[0].clientX,
        touches[0].clientY,
        touches[1].clientX,
        touches[1].clientY
      );

      this.initialScale = 1;
      this.initialRotation = 0;
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(
    e: TouchEvent,
    callbacks: Partial<Record<GestureEvent['type'], GestureCallback>>
  ): void {
    const touches = e.touches;

    if (touches.length === 1) {
      const currentX = touches[0].clientX;
      const currentY = touches[0].clientY;

      const dx = currentX - this.touchStartX;
      const dy = currentY - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Cancel long press if moved too much
      if (distance > this.PAN_THRESHOLD && this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // Only trigger pan if we've moved beyond threshold
      if (distance > this.PAN_THRESHOLD) {
        callbacks['pan']?.({
          type: 'pan',
          dx,
          dy,
          x: currentX,
          y: currentY,
        });
      }
    } else if (touches.length === 2) {
      // Pinch zoom
      const currentDistance = this.getDistance(
        touches[0].clientX,
        touches[0].clientY,
        touches[1].clientX,
        touches[1].clientY
      );

      const scale = currentDistance / this.touchStartDistance;

      callbacks['pinch']?.({
        type: 'pinch',
        scale,
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      });

      // Rotate
      const currentAngle = this.getAngle(
        touches[0].clientX,
        touches[0].clientY,
        touches[1].clientX,
        touches[1].clientY
      );

      const angleDiff = currentAngle - this.touchStartAngle;

      callbacks['rotate']?.({
        type: 'rotate',
        angle: angleDiff,
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      });
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(
    e: TouchEvent,
    callbacks: Partial<Record<GestureEvent['type'], GestureCallback>>
  ): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (e.touches.length === 0) {
      // All fingers lifted
      this.resetState();
    }
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(
    e: TouchEvent,
    callbacks: Partial<Record<GestureEvent['type'], GestureCallback>>
  ): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.resetState();
  }

  /**
   * Reset internal state
   */
  private resetState(): void {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartDistance = 0;
    this.touchStartAngle = 0;
    this.initialScale = 1;
    this.initialRotation = 0;
  }
}

export const touchGesturesService = new TouchGesturesService();
