import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SlideInPanel } from '../SlideInPanel';

// GSAP is auto-mocked in test environment; animateSafe no-ops when reduce motion is set
vi.mock('../../../canvas/animations/gsapAnimations', () => ({
  animateSafe: (fn: () => void) => fn(),
}));

vi.mock('gsap', () => ({
  gsap: {
    set: vi.fn(),
    to: vi.fn((target, opts) => {
      if (opts.onComplete) opts.onComplete();
    }),
  },
}));

describe('SlideInPanel', () => {
  it('does not render when open=false initially', () => {
    render(
      <SlideInPanel open={false} onClose={() => {}} title="Test Panel">
        <p>Content</p>
      </SlideInPanel>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open=true', () => {
    render(
      <SlideInPanel open={true} onClose={() => {}} title="Test Panel">
        <p>Panel content</p>
      </SlideInPanel>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('shows the title', () => {
    render(
      <SlideInPanel open={true} onClose={() => {}} title="Span Detail">
        <p>Content</p>
      </SlideInPanel>,
    );
    expect(screen.getByText('Span Detail')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <SlideInPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideInPanel>,
    );
    fireEvent.click(screen.getByTestId('slide-panel-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <SlideInPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideInPanel>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <SlideInPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideInPanel>,
    );
    fireEvent.click(screen.getByTestId('slide-panel-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('applies 360px width by default', () => {
    render(
      <SlideInPanel open={true} onClose={() => {}} title="Test Panel">
        <p>Content</p>
      </SlideInPanel>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('w-[360px]');
  });

  it('applies 320px width when width="320"', () => {
    render(
      <SlideInPanel open={true} onClose={() => {}} title="Test Panel" width="320">
        <p>Content</p>
      </SlideInPanel>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('w-80');
  });
});
