import * as THREE from 'three';

interface Vec3 { x: number; y: number; z: number; }

interface ParticleBurst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;       // remaining frames
  maxLife: number;
}

const PARTICLE_COUNT = 30;

export class ThreeParticles {
  private bursts: ParticleBurst[] = [];

  constructor(private scene: THREE.Scene) {}

  /** Gold sparkles rising from a point (XP gain). */
  emitXPGain(pos: Vec3): void {
    this._burst(pos, 0xffd700, PARTICLE_COUNT, 20, 0.6);
  }

  /** Gold confetti explosion (level-up). */
  emitLevelUp(pos: Vec3): void {
    this._burst(pos, 0xffd700, PARTICLE_COUNT, 40, 1.5);
    this._burst(pos, 0xa855f7, PARTICLE_COUNT, 35, 1.5);
  }

  /** Red pulse ring (agent error). */
  emitError(pos: Vec3): void {
    this._burst(pos, 0xef4444, PARTICLE_COUNT, 25, 0.8);
  }

  /** Blue arc from one agent to another (handoff). */
  emitHandoff(from: Vec3, to: Vec3): void {
    // Midpoint arc: emit from midpoint toward both endpoints
    const mid = { x: (from.x + to.x) / 2, y: 8, z: (from.z + to.z) / 2 };
    this._burst(mid, 0x6366f1, PARTICLE_COUNT, 30, 0.5);
  }

  private _burst(pos: Vec3, colour: number, count: number, speed: number, lifeSec: number): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;
      velocities[i * 3]     = Math.cos(angle) * Math.cos(elevation) * speed;
      velocities[i * 3 + 1] = Math.sin(elevation) * speed + speed * 0.5;
      velocities[i * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: colour,
      size: 3,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const maxLife = Math.round(lifeSec * 60);
    this.bursts.push({ points, velocities, life: maxLife, maxLife });
  }

  /** Call once per render frame to advance particle physics. */
  tick(): void {
    const dead: ParticleBurst[] = [];
    for (const burst of this.bursts) {
      burst.life--;
      const t = burst.life / burst.maxLife;
      (burst.points.material as THREE.PointsMaterial).opacity = t;

      const pos = burst.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += burst.velocities[i * 3]     * 0.016;
        arr[i * 3 + 1] += burst.velocities[i * 3 + 1] * 0.016;
        arr[i * 3 + 1] -= 0.1;  // gravity
        arr[i * 3 + 2] += burst.velocities[i * 3 + 2] * 0.016;
      }
      pos.needsUpdate = true;

      if (burst.life <= 0) dead.push(burst);
    }

    for (const d of dead) {
      this.scene.remove(d.points);
      d.points.geometry.dispose();
      (d.points.material as THREE.Material).dispose();
      this.bursts.splice(this.bursts.indexOf(d), 1);
    }
  }

  dispose(): void {
    for (const burst of this.bursts) {
      this.scene.remove(burst.points);
      burst.points.geometry.dispose();
      (burst.points.material as THREE.Material).dispose();
    }
    this.bursts = [];
  }
}
