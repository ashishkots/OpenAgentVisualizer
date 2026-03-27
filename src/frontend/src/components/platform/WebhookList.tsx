// Sprint 7 — Webhook list table

import { useState } from 'react';
import { Pencil, Trash2, Activity, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useDeleteWebhook, useUpdateWebhook } from '../../hooks/useWebhooks';
import { DeliveryLog } from './DeliveryLog';
import type { Webhook } from '../../types/webhook';

interface WebhookListProps {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
}

function WebhookRow({ webhook, onEdit }: { webhook: Webhook; onEdit: (w: Webhook) => void }) {
  const [showLog, setShowLog] = useState(false);
  const deleteMutation = useDeleteWebhook();
  const updateMutation = useUpdateWebhook(webhook.id);

  const handleToggleActive = () => {
    updateMutation.mutate({ active: !webhook.active });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete webhook "${webhook.name}"? This will also remove all delivery history.`)) return;
    deleteMutation.mutate(webhook.id);
  };

  return (
    <>
      <tr className="border-b border-oav-border last:border-0 hover:bg-oav-surface-hover/30 transition-colors">
        {/* Name + URL */}
        <td className="px-4 py-3 min-w-0">
          <p className="text-sm font-medium text-oav-text truncate">{webhook.name}</p>
          <p className="text-xs font-mono text-oav-muted truncate max-w-xs">{webhook.url}</p>
        </td>

        {/* Events */}
        <td className="px-4 py-3 text-sm text-oav-muted whitespace-nowrap">
          {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
        </td>

        {/* Active toggle */}
        <td className="px-4 py-3">
          <button
            role="switch"
            aria-checked={webhook.active}
            aria-label={`${webhook.active ? 'Deactivate' : 'Activate'} webhook ${webhook.name}`}
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
            className={clsx(
              'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              'disabled:opacity-50',
              webhook.active ? 'bg-oav-accent' : 'bg-oav-border',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                webhook.active ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowLog((v) => !v)}
              className={clsx(
                'p-1.5 rounded-md text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover transition-colors',
                showLog && 'text-oav-accent bg-oav-accent/10',
              )}
              aria-label={`${showLog ? 'Hide' : 'Show'} delivery log for ${webhook.name}`}
              aria-expanded={showLog}
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => onEdit(webhook)}
              className="p-1.5 rounded-md text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover transition-colors"
              aria-label={`Edit webhook ${webhook.name}`}
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-md text-oav-muted hover:text-oav-error hover:bg-oav-error/10 transition-colors disabled:opacity-50"
              aria-label={`Delete webhook ${webhook.name}`}
            >
              {deleteMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                : <Trash2 className="w-4 h-4" aria-hidden="true" />
              }
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable delivery log */}
      {showLog && (
        <tr>
          <td colSpan={4} className="px-4 pb-4 bg-oav-bg/30">
            <DeliveryLog webhookId={webhook.id} webhookName={webhook.name} />
          </td>
        </tr>
      )}
    </>
  );
}

export function WebhookList({ webhooks, onEdit }: WebhookListProps) {
  if (webhooks.length === 0) {
    return (
      <div className="bg-oav-surface border border-oav-border rounded-xl p-8 text-center">
        <p className="text-sm text-oav-muted">No webhooks configured yet.</p>
        <p className="text-xs text-oav-muted mt-1">
          Create one to receive real-time event notifications at your endpoint.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Webhooks">
          <thead>
            <tr className="border-b border-oav-border bg-oav-bg/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-oav-muted uppercase tracking-wide">
                Webhook
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-oav-muted uppercase tracking-wide">
                Events
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-oav-muted uppercase tracking-wide">
                Active
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-oav-muted uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((wh) => (
              <WebhookRow key={wh.id} webhook={wh} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
