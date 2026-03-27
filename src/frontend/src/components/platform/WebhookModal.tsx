// Sprint 7 — Webhook create/edit modal

import { useState, useEffect, useId } from 'react';
import { X, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateWebhook, useUpdateWebhook } from '../../hooks/useWebhooks';
import type { Webhook, WebhookCreate, WebhookEventType } from '../../types/webhook';

const ALL_EVENTS: { value: WebhookEventType; label: string }[] = [
  { value: 'agent.created',        label: 'Agent Created'         },
  { value: 'agent.status_changed', label: 'Agent Status Changed'  },
  { value: 'task.completed',       label: 'Task Completed'        },
  { value: 'alert.triggered',      label: 'Alert Triggered'       },
  { value: 'achievement.unlocked', label: 'Achievement Unlocked'  },
  { value: 'level_up',             label: 'Level Up'              },
  { value: 'challenge.completed',  label: 'Challenge Completed'   },
  { value: 'tournament.finalized', label: 'Tournament Finalized'  },
];

interface WebhookModalProps {
  webhook?: Webhook | null;
  onClose: () => void;
}

export function WebhookModal({ webhook, onClose }: WebhookModalProps) {
  const isEdit = !!webhook;
  const titleId = useId();

  const [name, setName] = useState(webhook?.name ?? '');
  const [url, setUrl]   = useState(webhook?.url  ?? '');
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(
    new Set(webhook?.events ?? []),
  );

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret]   = useState(false);
  const [formError, setFormError]         = useState('');

  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook(webhook?.id ?? '');

  // Sync edit values when webhook prop changes
  useEffect(() => {
    if (webhook) {
      setName(webhook.name);
      setUrl(webhook.url);
      setSelectedEvents(new Set(webhook.events));
    }
  }, [webhook]);

  const toggleEvent = (ev: WebhookEventType) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(ev)) next.delete(ev);
      else next.add(ev);
      return next;
    });
  };

  const isValid = name.trim() && url.trim() && selectedEvents.size > 0;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          name: name.trim(),
          url: url.trim(),
          events: [...selectedEvents],
        });
        onClose();
      } else {
        const payload: WebhookCreate = {
          name: name.trim(),
          url: url.trim(),
          events: [...selectedEvents],
        };
        const result = await createMutation.mutateAsync(payload);
        setCreatedSecret(result.secret);
      }
    } catch {
      setFormError('Failed to save webhook. Please check the URL and try again.');
    }
  };

  const handleCopySecret = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-oav-border">
          <h2 id={titleId} className="text-base font-semibold text-oav-text">
            {isEdit ? 'Edit Webhook' : 'Create Webhook'}
          </h2>
          <button
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Secret shown-once panel (post-create) */}
        {createdSecret && (
          <div className="px-6 pt-5 pb-2" role="alert">
            <div className="bg-oav-success/10 border border-oav-success/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-oav-success shrink-0" aria-hidden="true" />
                <p className="text-sm font-semibold text-oav-success">Webhook created!</p>
              </div>
              <p className="text-xs text-oav-muted">
                Copy this signing secret now. It will <strong>not</strong> be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-oav-text truncate">
                  {createdSecret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="shrink-0 p-2 rounded-lg bg-oav-bg border border-oav-border text-oav-muted hover:text-oav-text transition-colors"
                  aria-label="Copy webhook secret"
                >
                  {copiedSecret
                    ? <CheckCircle className="w-4 h-4 text-oav-success" aria-hidden="true" />
                    : <Copy className="w-4 h-4" aria-hidden="true" />
                  }
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Form (hidden after successful create) */}
        {!createdSecret && (
          <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-5" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="wh-name" className="block text-xs text-oav-muted mb-1">
                Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="wh-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Slack Alerts"
                required
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="wh-url" className="block text-xs text-oav-muted mb-1">
                Endpoint URL <span aria-hidden="true">*</span>
              </label>
              <input
                id="wh-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhooks/oav"
                required
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
            </div>

            {/* Event type checkboxes */}
            <fieldset>
              <legend className="text-xs text-oav-muted mb-2">
                Event Types <span aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_EVENTS.map(({ value, label }) => {
                  const checked = selectedEvents.has(value);
                  return (
                    <label
                      key={value}
                      className={clsx(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none',
                        checked
                          ? 'border-oav-accent bg-oav-accent/8 text-oav-text'
                          : 'border-oav-border bg-oav-bg/50 text-oav-muted hover:border-oav-accent/40',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(value)}
                        className="accent-oav-accent w-3.5 h-3.5"
                        aria-label={label}
                      />
                      <span className="text-xs font-medium">{label}</span>
                    </label>
                  );
                })}
              </div>
              {selectedEvents.size === 0 && (
                <p className="text-xs text-oav-error mt-1.5">Select at least one event type.</p>
              )}
            </fieldset>

            {/* Error */}
            {formError && (
              <p role="alert" className="text-xs text-oav-error">
                {formError}
              </p>
            )}

            {/* Footer actions */}
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-oav-muted border border-oav-border rounded-lg px-4 py-2 hover:text-oav-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isPending}
                className="flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {isEdit ? 'Save Changes' : 'Create Webhook'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
