import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { isoToThree } from './ThreeRenderer';
import type { Agent } from '../../types/agent';

const STATUS_COLOURS: Record<string, number> = {
  working:  0x6366f1,   // indigo — accent colour from tokens
  idle:     0x1e2433,   // dark surface
  error:    0xef4444,   // red
  waiting:  0xf59e0b,   // amber
};

const DESK_GEOMETRY = new THREE.BoxGeometry(28, 4, 20);

export class AgentDesk {
  readonly group: THREE.Group;
  private deskMesh: THREE.Mesh;
  private deskMat: THREE.MeshStandardMaterial;
  private glowLight: THREE.PointLight;
  private label: CSS2DObject;
  private labelDiv: HTMLDivElement;

  constructor(private scene: THREE.Scene, agent: Agent) {
    this.group = new THREE.Group();

    // Desk body
    this.deskMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f2e,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.deskMesh = new THREE.Mesh(DESK_GEOMETRY, this.deskMat);
    this.deskMesh.userData.agentId = agent.id;
    this.group.add(this.deskMesh);

    // Glow ring under desk
    this.glowLight = new THREE.PointLight(
      STATUS_COLOURS[agent.status] ?? STATUS_COLOURS.idle,
      agent.status === 'working' ? 2 : 0.3,
      80,
    );
    this.glowLight.position.set(0, 6, 0);
    this.group.add(this.glowLight);

    // CSS2D label (crisp text overlay, no texture baking needed)
    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'oav-desk-label';
    this.labelDiv.style.cssText = `
      color: #fafafa; font-size: 11px; font-family: 'Inter', sans-serif;
      background: rgba(10,10,10,0.75); padding: 2px 6px; border-radius: 4px;
      pointer-events: none; white-space: nowrap;
    `;
    this.labelDiv.textContent = agent.name;
    this.label = new CSS2DObject(this.labelDiv);
    this.label.position.set(0, 16, 0);
    this.group.add(this.label);

    // Position desk in Three.js world using isoToThree adapter
    const pos = (agent as any).position ?? { x: 0, y: 0 };
    const wp = isoToThree(pos.x, pos.y);
    this.group.position.set(wp.x, wp.y, wp.z);

    scene.add(this.group);
  }

  update(agent: Agent): void {
    // Update glow colour and intensity based on new status
    const colour = STATUS_COLOURS[agent.status] ?? STATUS_COLOURS.idle;
    this.glowLight.color.setHex(colour);
    this.glowLight.intensity = agent.status === 'working'
      ? 1.0 + ((agent as any).tokens_per_second ?? 0) * 0.5
      : agent.status === 'error' ? 1.5 : 0.3;

    // Update emissive on desk mesh to match status
    this.deskMat.emissive.setHex(colour);
    this.deskMat.emissiveIntensity =
      agent.status === 'working' ? 0.15 : agent.status === 'error' ? 0.4 : 0;

    // Update label
    this.labelDiv.textContent = agent.name;

    // Move if position changed
    const pos = (agent as any).position ?? { x: 0, y: 0 };
    const wp = isoToThree(pos.x, pos.y);
    this.group.position.set(wp.x, wp.y, wp.z);
  }

  dispose(): void {
    this.scene.remove(this.group);
    // DESK_GEOMETRY is shared — do NOT dispose it
    this.deskMat.dispose();
    this.labelDiv.remove();
  }
}
