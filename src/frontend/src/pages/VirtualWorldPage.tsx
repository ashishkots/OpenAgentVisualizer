import { WorldCanvas } from '../canvas/WorldCanvas';
import { useWebSocket } from '../hooks/useWebSocket';

export function VirtualWorldPage() {
  const workspaceId = localStorage.getItem('oav_workspace') ?? '';
  useWebSocket(workspaceId || null);
  return (
    <div className="w-full h-full">
      {workspaceId && <WorldCanvas workspaceId={workspaceId} />}
    </div>
  );
}
