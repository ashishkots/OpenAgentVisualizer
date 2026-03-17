import * as THREE from 'three';

export class ThreeMiniMap {
  readonly canvas: HTMLCanvasElement;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private onPan?: (worldX: number, worldZ: number) => void;

  constructor(private scene: THREE.Scene, size = 160) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.cssText = `
      position: absolute; bottom: 16px; right: 16px;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
      opacity: 0.85; cursor: crosshair;
    `;

    this.camera = new THREE.OrthographicCamera(-300, 300, 300, -300, 1, 2000);
    this.camera.position.set(0, 1000, 0);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
    this.renderer.setSize(size, size);
    this.renderer.setClearColor(0x0a0a0a);

    // Click-to-pan: map canvas click → world XZ → notify main camera
    this.canvas.addEventListener('click', (e: MouseEvent) => {
      if (!this.onPan) return;
      const rect = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const worldX = nx * 300;
      const worldZ = -ny * 300;
      this.onPan(worldX, worldZ);
    });
  }

  setOnPan(cb: (worldX: number, worldZ: number) => void): void {
    this.onPan = cb;
  }

  tick(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.canvas.remove();
  }
}
