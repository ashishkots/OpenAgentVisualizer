import { useEffect } from 'react';
import { WorldCanvas } from '../canvas/WorldCanvas';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAgents } from '../hooks/useAgents';
import { useAgentStore } from '../stores/agentStore';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'World' }];

export function VirtualWorldPage() {
  const workspaceId = localStorage.getItem('oav_workspace') ?? '';
  useWebSocket(workspaceId || null);

  // Seed store with API agents on first load
  const { data: agents, isLoading } = useAgents();
  const upsertAgent = useAgentStore((s) => s.upsertAgent);

  useEffect(() => {
    if (agents) {
      for (const agent of agents) {
        upsertAgent(agent);
      }
    }
  }, [agents, upsertAgent]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar / HUD overlay */}
      <div className="absolute top-4 left-20 z-30 hidden md:block">
        <Breadcrumb items={BREADCRUMB} />
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-oav-bg/60">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Canvas — full viewport */}
      <div className="flex-1 relative">
        {workspaceId ? (
          <WorldCanvas workspaceId={workspaceId} />
        ) : (
          <div className="flex items-center justify-center h-full text-oav-muted text-sm">
            No workspace configured
          </div>
        )}
      </div>
    </div>
  );
}
