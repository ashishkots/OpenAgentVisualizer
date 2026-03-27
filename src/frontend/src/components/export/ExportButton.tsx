import { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportDialog } from './ExportDialog';

interface Props {
  endpoint: string;
  filename: string;
  hasDateRange?: boolean;
  label?: string;
}

export function ExportButton({ endpoint, filename, hasDateRange = false, label = 'Export' }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2 text-sm text-oav-muted hover:text-oav-text border border-oav-border rounded-lg px-3 py-2 hover:bg-oav-surface-hover transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none"
        aria-label={`${label} — opens export dialog`}
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        <span>{label}</span>
      </button>

      {dialogOpen && (
        <ExportDialog
          endpoint={endpoint}
          filename={filename}
          hasDateRange={hasDateRange}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
