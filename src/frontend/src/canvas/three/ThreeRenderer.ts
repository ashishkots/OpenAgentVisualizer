import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OfficeFloor } from './OfficeFloor';
import { AgentDesk } from './AgentDesk';
import { ThreeParticles } from './ThreeParticles';
import type { Agent } from '../../types/agent';

export function isoToThree(isoX: number, isoY: number): { x: number; y: number; z: number } {
  return { x: (isoX - isoY) * 32, y: 0, z: (isoX + isoY) * 16 };
}

export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private floor: OfficeFloor;
  private particles: ThreeParticles;
  private desks = new Map<string, AgentDesk>();
  private frameId: number | null = null;
  private onSelectAgent?: (agentId: string) => void;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(private container: HTMLDivElement) {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const aspect = w / h;
    const viewSize = 300;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1117);

    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect, viewSize * aspect,
      viewSize, -viewSize,
      0.1, 10000,
    );
    this.camera.position.set(300, 400, 300);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    container.appendChild(this.labelRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    (this.controls as any).minZoom = 0.3;
    (this.controls as any).maxZoom = 3;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(200, 400, 100);
    this.scene.add(dir);

    this.floor = new OfficeFloor(this.scene);
    this.particles = new ThreeParticles(this.scene);

    this.renderer.domElement.addEventListener('click', this._onClick.bind(this));

    const ro = new ResizeObserver(() => this._onResize());
    ro.observe(container);

    this._startLoop();
  }

  setOnSelectAgent(cb: (agentId: string) => void): void {
    this.onSelectAgent = cb;
  }

  syncAgents(agents: Agent[]): void {
    const incomingIds = new Set(agents.map((a) => a.id));

    for (const agent of agents) {
      if (this.desks.has(agent.id)) {
        this.desks.get(agent.id)!.update(agent);
      } else {
        const desk = new AgentDesk(this.scene, agent);
        this.desks.set(agent.id, desk);
      }
    }

    for (const [id, desk] of this.desks) {
      if (!incomingIds.has(id)) {
        desk.dispose();
        this.desks.delete(id);
      }
    }
  }

  emitXPGain(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitXPGain(desk.group.position);
  }

  emitLevelUp(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitLevelUp(desk.group.position);
  }

  emitError(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitError(desk.group.position);
  }

  emitHandoff(fromId: string, toId: string): void {
    const from = this.desks.get(fromId);
    const to = this.desks.get(toId);
    if (from && to) this.particles.emitHandoff(from.group.position, to.group.position);
  }

  private _startLoop(): void {
    const loop = () => {
      this.frameId = requestAnimationFrame(loop);
      this.controls.update();
      this.particles.tick();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    loop();
  }

  private _onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / h;
    const viewSize = 300;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  private _onClick(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.desks.values()).map((d) => (d as any).deskMesh as THREE.Mesh);
    const hits = this.raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      const agentId = hits[0].object.userData.agentId as string;
      this.onSelectAgent?.(agentId);
    }
  }

  dispose(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    for (const desk of this.desks.values()) desk.dispose();
    this.desks.clear();
    this.floor.dispose();
    this.particles.dispose();
    this.renderer.dispose();
    try { this.renderer.domElement.remove(); } catch {}
    try { this.labelRenderer.domElement.remove(); } catch {}
  }
}
