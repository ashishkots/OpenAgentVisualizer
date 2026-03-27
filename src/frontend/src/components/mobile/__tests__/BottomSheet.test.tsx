import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BottomSheet } from '../BottomSheet';

// matchMedia mock
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

beforeEach(() => {
  mockMatchMedia(true); // prefers-reduced-motion: reduce → no CSS transition delays
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.style.overflow = '';
});

describe('BottomSheet', () => {
  it('does not render when isOpen=false', () => {
    render(
      <BottomSheet isOpen={false} onClose={() => {}}>
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.queryByTestId('bottom-sheet')).not.toBeInTheDocument();
  });

  it('renders when isOpen=true', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}}>
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Agent Details">
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.getByText('Agent Details')).toBeInTheDocument();
  });

  it('does not render close button when title is not provided', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.queryByTestId('bottom-sheet-close')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    fireEvent.click(screen.getByTestId('bottom-sheet-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Accessible Sheet">
        <p>Content</p>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('sets body overflow hidden when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = render(
      <BottomSheet isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <BottomSheet isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('renders drag handle', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}}>
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.getByTestId('bottom-sheet-handle')).toBeInTheDocument();
  });
});
