export type NotificationSeverity = 'info' | 'warning' | 'critical';

// Legacy type used by gamification store
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  created_at: string;
}

// Sprint 5: API notification type
export type NotificationType = 'achievement' | 'alert' | 'system' | 'collaboration';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
}
