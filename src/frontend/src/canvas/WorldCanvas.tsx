import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { WorldRenderer } from './world/WorldRenderer';
import { useAgentStore } from '../stores/agentStore';

interface Props {
  workspaceId: string;
}

export function WorldCanvas({ workspaceId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const agents = useAgentStore((s) => s.agents);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    const app = new Application();
    appRef.current = app;

    app
      .init({
        resizeTo: containerRef.current,
        backgroundColor: 0x0f1117,
        antialias: true,
      })
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.appendChild(app.canvas);
        const renderer = new WorldRenderer(app);
        rendererRef.current = renderer;
        renderer.init();
      });

    return () => {
      cancelled = true;
      appRef.current?.destroy(true);
      appRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.syncAgents(Object.values(agents));
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
      data-workspace={workspaceId}
    />
  );
}
