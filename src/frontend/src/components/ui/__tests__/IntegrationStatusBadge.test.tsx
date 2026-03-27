import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntegrationStatusBadge } from '../IntegrationStatusBadge';

describe('IntegrationStatusBadge', () => {
  it('shows Connected label for connected status', () => {
    render(<IntegrationStatusBadge status="connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows Disconnected label for disconnected status', () => {
    render(<IntegrationStatusBadge status="disconnected" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows Degraded label for degraded status', () => {
    render(<IntegrationStatusBadge status="degraded" />);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('shows Not Configured label for not_configured status', () => {
    render(<IntegrationStatusBadge status="not_configured" />);
    expect(screen.getByText('Not Configured')).toBeInTheDocument();
  });

  it('shows last check time when connected', () => {
    render(<IntegrationStatusBadge status="connected" lastCheck="14:32" />);
    expect(screen.getByText('(last check: 14:32)')).toBeInTheDocument();
  });

  it('does not show last check when disconnected', () => {
    render(<IntegrationStatusBadge status="disconnected" lastCheck="14:32" />);
    expect(screen.queryByText('(last check: 14:32)')).not.toBeInTheDocument();
  });

  it('has correct aria role', () => {
    render(<IntegrationStatusBadge status="connected" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
