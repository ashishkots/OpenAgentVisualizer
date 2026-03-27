import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportButton } from '../ExportButton';

// Stub ExportDialog so we don't need the full tree
vi.mock('../ExportDialog', () => ({
  ExportDialog: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="export-dialog">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('ExportButton', () => {
  it('renders button with default label', () => {
    render(<ExportButton endpoint="/api/export/agents" filename="agents" />);
    expect(screen.getByRole('button', { name: /export/i })).toBeTruthy();
  });

  it('opens dialog on click', () => {
    render(<ExportButton endpoint="/api/export/agents" filename="agents" />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByTestId('export-dialog')).toBeTruthy();
  });

  it('closes dialog when onClose is called', () => {
    render(<ExportButton endpoint="/api/export/agents" filename="agents" />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('export-dialog')).toBeNull();
  });
});
