// Sprint 7 — Webhook types

export type WebhookEventType =
  | 'agent.created'
  | 'agent.status_changed'
  | 'task.completed'
  | 'alert.triggered'
  | 'achievement.unlocked'
  | 'level_up'
  | 'challenge.completed'
  | 'tournament.finalized';

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

export interface Webhook {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  created_at: string;
}

export interface WebhookCreate {
  name: string;
  url: string;
  events: WebhookEventType[];
}

export interface WebhookUpdate {
  name?: string;
  url?: string;
  events?: WebhookEventType[];
  active?: boolean;
}

export interface WebhookCreatedResponse extends Webhook {
  /** Plain-text secret — returned ONLY on creation, never again */
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  response_code: number | null;
  attempts: number;
  next_retry_at: string | null;
  created_at: string;
}
