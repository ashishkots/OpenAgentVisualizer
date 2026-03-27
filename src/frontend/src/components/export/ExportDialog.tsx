import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useExport } from '../../hooks/useExport';
import type { ExportFormat, ExportOptions } from '../../types/export';

interface Props {
  endpoint: string;
  filename: string;
  hasDateRange?: boolean;
  onClose: () => void;
}

export function ExportDialog({ endpoint, filename, hasDateRange = false, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const { download, isLoading, error } = useExport(endpoint, filename);

  const handleExport = async () => {
    const options: ExportOptions = { format };
    if (hasDateRange) {
      if (start) options.start = new Date(start).toISOString();
      if (end)   options.end   = new Date(end).toISOString();
    }
    await download(options);
    if (!error) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="export-dialog-title" className="text-base font-semibold text-oav-text">
            Export Data
          </h2>
          <button
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Format selector */}
        <fieldset>
          <legend className="text-xs text-oav-muted mb-2 font-medium">Format</legend>
          <div className="flex gap-3">
            {(['csv', 'json'] as ExportFormat[]).map((f) => (
              <label
                key={f}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
                  format === f
                    ? 'border-oav-accent bg-oav-accent/10 text-oav-accent'
                    : 'border-oav-border text-oav-muted hover:text-oav-text hover:border-oav-muted',
                )}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="sr-only"
                />
                <span className="text-sm font-medium uppercase">{f}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date range */}
        {hasDateRange && (
          <fieldset className="space-y-3">
            <legend className="text-xs text-oav-muted mb-2 font-medium">Date Range (optional)</legend>
            <label className="block">
              <span className="text-xs text-oav-muted block mb-1">Start</span>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs text-oav-muted block mb-1">End</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
            </label>
          </fieldset>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-oav-error bg-oav-error/10 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-oav-muted border border-oav-border hover:text-oav-text hover:bg-oav-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            aria-label={`Export as ${format.toUpperCase()}`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
