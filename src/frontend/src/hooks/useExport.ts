import { useState } from 'react';
import type { ExportOptions } from '../types/export';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('oav_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useExport(endpoint: string, filename: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (options: ExportOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('format', options.format);
      if (options.start) params.set('start', options.start);
      if (options.end)   params.set('end', options.end);
      if (options.interval) params.set('interval', options.interval);

      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const ext = options.format === 'csv' ? 'csv' : 'json';
      const timestamp = new Date().toISOString().slice(0, 10);
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${filename}-${timestamp}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading, error };
}
