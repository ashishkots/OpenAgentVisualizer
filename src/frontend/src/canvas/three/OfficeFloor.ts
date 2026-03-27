import * as THREE from 'three';

export class OfficeFloor {
  readonly mesh: THREE.GridHelper;
  readonly zoneSeparators: THREE.LineSegments;

  constructor(private scene: THREE.Scene, tilesX = 16, tilesY = 16) {
    // Floor grid — Three.js GridHelper is XZ plane (correct for our camera)
    this.mesh = new THREE.GridHelper(
      tilesX * 32,         // size matches iso tile scale
      tilesX,
      0x1e2433,            // center line colour (dark)
      0x1e2433,            // grid line colour
    );
    this.mesh.position.set(0, -0.5, tilesY * 16);
    scene.add(this.mesh);

    // Zone separator lines — dashed lines dividing sections of the office
    const pts: number[] = [];
    for (let i = 0; i <= tilesX; i += 4) {
      const x = (i - tilesX / 2) * 32;
      pts.push(x, 0, 0,  x, 0, tilesY * 32);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.zoneSeparators = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0x2a3040, transparent: true, opacity: 0.4 })
    );
    scene.add(this.zoneSeparators);
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.scene.remove(this.zoneSeparators);
    this.zoneSeparators.geometry.dispose();
    (this.zoneSeparators.material as THREE.Material).dispose();
  }
}
