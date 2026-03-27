import { useEffect, useRef } from 'react';
import { ThreeRenderer } from './ThreeRenderer';
import { useAgentStore } from '../../stores/agentStore';

interface Props {
  workspaceId: string;
  onSelectAgent?: (agentId: string) => void;
}

export function ThreeCanvas({ workspaceId, onSelectAgent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);

  // agents is Record<string, Agent> in the store
  const agents = useAgentStore((s) => s.agents);

  // Mount renderer once; dispose on unmount
  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new ThreeRenderer(containerRef.current);
    rendererRef.current = renderer;
    if (onSelectAgent) renderer.setOnSelectAgent(onSelectAgent);

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once — dispose on unmount

  // Sync agents whenever the store changes
  useEffect(() => {
    if (!rendererRef.current) return;
    // agents is Record<string, Agent> — convert to array for syncAgents
    const agentArray = Object.values(agents);
    rendererRef.current.syncAgents(agentArray);
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ touchAction: 'none' }}
      data-workspace={workspaceId}
    />
  );
}
