// Sprint 7 — Webhook delivery log

import { useState } from 'react';
import { ChevronRight, ChevronDown, Loader2, Send, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useWebhookDeliveries, useTestWebhook } from '../../hooks/useWebhooks';
import type { WebhookDelivery, WebhookDeliveryStatus } from '../../types/webhook';

const STATUS_STYLES: Record<WebhookDeliveryStatus, string> = {
  success: 'bg-oav-success/15 text-oav-success',
  failed: 'bg-oav-error/15 text-oav-error',
  pending: 'bg-yellow-500/15 text-yellow-400',
};

function DeliveryRow({ delivery }: { delivery: WebhookDelivery }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-oav-border/50 last:border-0 hover:bg-oav-surface-hover/20 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand toggle + event type */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-oav-muted shrink-0" aria-hidden="true" />
              : <ChevronRight className="w-3.5 h-3.5 text-oav-muted shrink-0" aria-hidden="true" />
            }
            <code className="text-xs text-oav-text font-mono">{delivery.event_type}</code>
          </div>
        </td>

        {/* Status badge */}
        <td className="px-3 py-2.5">
          <span
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              STATUS_STYLES[delivery.status],
            )}
          >
            {delivery.status}
          </span>
        </td>

        {/* Response code */}
        <td className="px-3 py-2.5 text-xs text-oav-muted whitespace-nowrap">
          {delivery.response_code ?? '—'}
        </td>

        {/* Attempts */}
        <td className="px-3 py-2.5 text-xs text-oav-muted whitespace-nowrap">
          {delivery.attempts}
        </td>

        {/* Timestamp */}
        <td className="px-3 py-2.5 text-xs text-oav-muted whitespace-nowrap">
          {new Date(delivery.created_at).toLocaleString()}
        </td>
      </tr>

      {/* Expandable payload */}
      {expanded && (
        <tr className="bg-oav-bg/40">
          <td colSpan={5} className="px-4 pb-3 pt-2">
            <p className="text-xs text-oav-muted mb-1.5 font-medium uppercase tracking-wide">
              Payload
            </p>
            <pre className="text-xs font-mono bg-oav-surface border border-oav-border rounded-lg p-3 overflow-x-auto max-h-48 text-oav-text">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
            {delivery.next_retry_at && delivery.status === 'pending' && (
              <p className="text-xs text-oav-muted mt-2">
                Next retry at: {new Date(delivery.next_retry_at).toLocaleString()}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

interface DeliveryLogProps {
  webhookId: string;
  webhookName: string;
}

export function DeliveryLog({ webhookId, webhookName }: DeliveryLogProps) {
  const { data: deliveries = [], isLoading, refetch, isFetching } = useWebhookDeliveries(webhookId);
  const testMutation = useTestWebhook();
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTestResult(null);
    try {
      await testMutation.mutateAsync(webhookId);
      setTestResult({ ok: true, message: 'Test delivery queued.' });
      setTimeout(() => void refetch(), 1500);
    } catch {
      setTestResult({ ok: false, message: 'Failed to send test delivery.' });
    }
  };

  return (
    <div className="mt-2 space-y-3" data-testid={`delivery-log-${webhookId}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-oav-muted uppercase tracking-wide">
          Delivery Log — {webhookName}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-md text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover transition-colors disabled:opacity-50"
            aria-label="Refresh delivery log"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} aria-hidden="true" />
          </button>
          <button
            onClick={() => void handleTest()}
            disabled={testMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-oav-text border border-oav-border rounded-md px-2.5 py-1.5 hover:bg-oav-surface-hover transition-colors disabled:opacity-50"
            aria-label={`Send test event to webhook ${webhookName}`}
          >
            {testMutation.isPending
              ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              : <Send className="w-3 h-3" aria-hidden="true" />
            }
            Test
          </button>
        </div>
      </div>

      {/* Test result feedback */}
      {testResult && (
        <p
          role="status"
          className={clsx(
            'text-xs px-3 py-2 rounded-lg',
            testResult.ok ? 'bg-oav-success/10 text-oav-success' : 'bg-oav-error/10 text-oav-error',
          )}
        >
          {testResult.message}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-oav-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Loading deliveries...
        </div>
      ) : deliveries.length === 0 ? (
        <p className="text-xs text-oav-muted py-3">No deliveries yet.</p>
      ) : (
        <div className="border border-oav-border rounded-lg overflow-hidden">
          <table className="w-full" aria-label={`Delivery log for ${webhookName}`}>
            <thead>
              <tr className="bg-oav-bg/60 border-b border-oav-border">
                <th className="px-3 py-2 text-left text-xs font-medium text-oav-muted">Event</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-oav-muted">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-oav-muted">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-oav-muted">Attempts</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-oav-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <DeliveryRow key={d.id} delivery={d} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
