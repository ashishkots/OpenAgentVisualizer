import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
  beforeEach(() => {
    // Default: online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when navigator.onLine is true', () => {
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('renders immediately when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    render(<OfflineBanner />);
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });

  it('shows banner when offline event fires', () => {
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
  });

  it('hides banner when online event fires after going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    render(<OfflineBanner />);
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('has role="alert" for screen readers', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
