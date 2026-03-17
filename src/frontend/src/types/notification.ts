export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  created_at: string;
}
