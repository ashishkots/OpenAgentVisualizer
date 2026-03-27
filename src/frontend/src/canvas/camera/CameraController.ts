import type { Container } from 'pixi.js';

/**
 * CameraController — handles pan/zoom on the WorldContainer.
 * Pan/zoom transforms are applied to a single Container node (ADR-001).
 *
 * Touch support:
 *  - Single pointer: pan (same as mouse drag)
 *  - Two pointers:   pinch-to-zoom (distance delta mapped to scale)
 */
export class CameraController {
  private world: Container;
  private canvas: HTMLCanvasElement;
  private minZoom = 0.25;
  private maxZoom = 4.0;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  public dirty = false;

  /** Active pointer tracking for pinch-to-zoom */
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private lastPinchDist = 0;

  // Pre-bound handlers so the same reference is used for add and remove
  private _onWheel: (e: WheelEvent) => void;
  private _onPointerDown: (e: PointerEvent) => void;
  private _onPointerMove: (e: PointerEvent) => void;
  private _onPointerUp: (e: PointerEvent) => void;

  constructor(world: Container, canvas: HTMLCanvasElement) {
    this.world = world;
    this.canvas = canvas;
    this._onWheel = this.onWheel.bind(this);
    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const currentScale = this.world.scale.x;
    const newScale = Math.min(this.maxZoom, Math.max(this.minZoom, currentScale * factor));

    // Zoom toward mouse position
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    const worldX = (mouseX - this.world.x) / currentScale;
    const worldY = (mouseY - this.world.y) / currentScale;

    this.world.scale.set(newScale);
    this.world.x = mouseX - worldX * newScale;
    this.world.y = mouseY - worldY * newScale;
    this.dirty = true;
  }

  private onPointerDown(e: PointerEvent): void {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.canvas.setPointerCapture(e.pointerId);

    if (this.activePointers.size === 1) {
      // Single pointer — start pan
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.worldStart = { x: this.world.x, y: this.world.y };
    } else if (this.activePointers.size === 2) {
      // Second pointer arrived — switch to pinch; cancel ongoing pan
      this.isDragging = false;
      this.lastPinchDist = this.getPinchDistance();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 2) {
      // Pinch-to-zoom
      const dist = this.getPinchDistance();
      if (this.lastPinchDist > 0) {
        const factor = dist / this.lastPinchDist;
        const currentScale = this.world.scale.x;
        const newScale = Math.min(this.maxZoom, Math.max(this.minZoom, currentScale * factor));

        // Zoom toward midpoint of the two fingers
        const mid = this.getPinchMidpoint();
        const worldX = (mid.x - this.world.x) / currentScale;
        const worldY = (mid.y - this.world.y) / currentScale;

        this.world.scale.set(newScale);
        this.world.x = mid.x - worldX * newScale;
        this.world.y = mid.y - worldY * newScale;
        this.dirty = true;
      }
      this.lastPinchDist = dist;
      return;
    }

    if (this.isDragging) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.world.x = this.worldStart.x + dx;
      this.world.y = this.worldStart.y + dy;
      this.dirty = true;
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.activePointers.delete(e.pointerId);
    try { this.canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }

    if (this.activePointers.size < 2) {
      this.lastPinchDist = 0;
    }
    if (this.activePointers.size === 0) {
      this.isDragging = false;
    } else if (this.activePointers.size === 1) {
      // One finger remained — resume pan from current position
      const [remaining] = this.activePointers.values();
      this.isDragging = true;
      this.dragStart = { x: remaining.x, y: remaining.y };
      this.worldStart = { x: this.world.x, y: this.world.y };
    }
  }

  /** Distance between the two active touch pointers. */
  private getPinchDistance(): number {
    const pts = [...this.activePointers.values()];
    if (pts.length < 2) return 0;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Midpoint (canvas-relative) between the two active touch pointers. */
  private getPinchMidpoint(): { x: number; y: number } {
    const pts = [...this.activePointers.values()];
    if (pts.length < 2) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (pts[0].x + pts[1].x) / 2 - rect.left,
      y: (pts[0].y + pts[1].y) / 2 - rect.top,
    };
  }

  /** Returns viewport bounds in world coordinates for culling. */
  getViewportBounds(screenW: number, screenH: number): {
    left: number; top: number; right: number; bottom: number;
  } {
    const scale = this.world.scale.x;
    const left   = -this.world.x / scale;
    const top    = -this.world.y / scale;
    const right  = left + screenW / scale;
    const bottom = top  + screenH / scale;
    return { left, top, right, bottom };
  }

  get scale(): number {
    return this.world.scale.x;
  }

  centerOn(x: number, y: number, screenW: number, screenH: number): void {
    const scale = this.world.scale.x;
    this.world.x = screenW / 2 - x * scale;
    this.world.y = screenH / 2 - y * scale;
    this.dirty = true;
  }

  destroy(): void {
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
  }
}
