export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  start?: string;
  end?: string;
  interval?: 'hourly' | 'daily';
}
