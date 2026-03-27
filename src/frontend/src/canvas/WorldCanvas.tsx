import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { useNavigate } from 'react-router-dom';
import { WorldRenderer } from './world/WorldRenderer';
import { useAgentStore } from '../stores/agentStore';
import { MachineManager } from '../machines/MachineManager';

interface Props {
  workspaceId: string;
}

/**
 * WorldCanvas — React bridge for the imperative PixiJS engine (ADR-001).
 * Thin component: creates Application + WorldRenderer + MachineManager,
 * then delegates all rendering to the imperative layer.
 */
export function WorldCanvas({ workspaceId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const machineManagerRef = useRef<MachineManager | null>(null);
  const navigate = useNavigate();

  const agents = useAgentStore((s) => s.agents);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let initialized = false;
    const app = new Application();
    appRef.current = app;

    // Create MachineManager with state-change callback
    const mm = new MachineManager((agentId, _from, to) => {
      // Trigger canvas effects on state transitions
      const renderer = rendererRef.current;
      if (!renderer) return;
      if (to === 'error') renderer.triggerError(agentId);
    });
    machineManagerRef.current = mm;

    app
      .init({
        resizeTo: containerRef.current,
        backgroundColor: 0x0f1117,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
      })
      .then(() => {
        if (cancelled || !containerRef.current) {
          try { app.destroy(true); } catch { /* ignore */ }
          return;
        }
        initialized = true;
        containerRef.current.appendChild(app.canvas);
        const renderer = new WorldRenderer(app);
        rendererRef.current = renderer;
        renderer.init();

        renderer.onAgentClick((agentId) => {
          useAgentStore.getState().setSelectedAgent(agentId);
        });

        renderer.onAgentDoubleClick((agentId) => {
          navigate(`/agents/${agentId}`);
        });
      });

    return () => {
      cancelled = true;
      if (initialized) {
        rendererRef.current?.destroy();
        try { appRef.current?.destroy(true); } catch { /* ignore */ }
      }
      machineManagerRef.current?.destroyAll();
      appRef.current = null;
      rendererRef.current = null;
      machineManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync agents to canvas when store updates
  useEffect(() => {
    const agentList = Object.values(agents);
    rendererRef.current?.syncAgents(agentList);

    // Ensure XState machines exist for all agents
    const mm = machineManagerRef.current;
    if (mm) {
      for (const agent of agentList) {
        if (!mm.has(agent.id)) {
          mm.create(agent.id, agent.status);
        }
      }
    }
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
      data-workspace={workspaceId}
      aria-label="Agent world canvas"
      role="img"
    />
  );
}
