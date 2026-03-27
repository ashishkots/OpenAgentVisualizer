export interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

/**
 * Simple force-directed layout.
 * For 50 agents at 50 iterations: completes in <10ms.
 */
export function computeForceLayout(
  agents: { id: string }[],
  width: number,
  height: number,
  iterations = 50,
): LayoutNode[] {
  if (agents.length === 0) return [];

  const nodes: LayoutNode[] = agents.map((a, i) => ({
    id: a.id,
    x: (i % 10) * 80 + width / 4,
    y: Math.floor(i / 10) * 80 + height / 4,
  }));

  const repulsion = 5000;
  const damping = 0.9;
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = nodes.map(() => ({ fx: 0, fy: 0 }));

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces[i].fx += fx;
        forces[i].fy += fy;
        forces[j].fx -= fx;
        forces[j].fy -= fy;
      }
    }

    // Center gravity
    for (let i = 0; i < nodes.length; i++) {
      forces[i].fx += (cx - nodes[i].x) * 0.01;
      forces[i].fy += (cy - nodes[i].y) * 0.01;
    }

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x += forces[i].fx * damping;
      nodes[i].y += forces[i].fy * damping;
    }
  }

  return nodes;
}
