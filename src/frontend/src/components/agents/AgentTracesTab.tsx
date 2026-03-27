import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useAgentTraces } from '../../hooks/useTraces';

interface AgentTracesTabProps {
  agentId: string;
}

export function AgentTracesTab({ agentId }: AgentTracesTabProps) {
  const navigate = useNavigate();
  const traceStatus = useIntegrationStore((s) => s.getStatus('opentrace'));
  const { data, isLoading, isError } = useAgentTraces(agentId);

  if (traceStatus === 'not_configured' || isError) {
    return (
      <div className="bg-oav-surface/50 border border-oav-border/50 rounded-xl px-4 py-3 text-xs text-oav-muted">
        Configure OpenTrace in{' '}
        <Link to="/settings?tab=integrations" className="text-oav-accent hover:underline">
          Settings
        </Link>{' '}
        to view distributed traces.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const traces = data?.traces ?? [];

  return (
    <div className="space-y-3">
      {traces.length === 0 ? (
        <p className="text-sm text-oav-muted text-center py-8">
          No traces found for this agent.
        </p>
      ) : (
        <>
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-oav-bg/50 border-b border-oav-border">
                  <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2">
                    Trace ID
                  </th>
                  <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2 hidden sm:table-cell">
                    Operation
                  </th>
                  <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2">
                    Duration
                  </th>
                  <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2 hidden md:table-cell">
                    Spans
                  </th>
                  <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oav-border/50">
                {traces.map((trace) => (
                  <tr
                    key={trace.trace_id}
                    className={clsx(
                      'hover:bg-oav-surface-hover cursor-pointer transition-colors',
                      trace.error_count > 0 && 'border-l-2 border-l-oav-error',
                    )}
                    onClick={() => navigate(`/traces?trace_id=${trace.trace_id}`)}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-oav-accent">
                      {trace.trace_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-xs text-oav-text hidden sm:table-cell">
                      {trace.root_operation}
                    </td>
                    <td className="px-4 py-3 text-xs text-oav-text tabular-nums text-right">
                      {trace.duration_ms}ms
                    </td>
                    <td className="px-4 py-3 text-xs text-oav-text tabular-nums text-right hidden md:table-cell">
                      {trace.span_count}
                    </td>
                    <td className="px-4 py-3">
                      {trace.error_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-oav-error/20 text-oav-error text-[10px] font-medium">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          {trace.error_count} err
                        </span>
                      ) : (
                        <span className="text-xs text-oav-success">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            to={`/traces?agent=${agentId}`}
            className="inline-flex items-center gap-1.5 text-sm text-oav-accent hover:underline"
          >
            View in Trace Explorer
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}
