import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GradeBadge } from '../GradeBadge';

describe('GradeBadge', () => {
  it('renders the correct grade letter', () => {
    render(<GradeBadge grade="A" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies correct aria-label', () => {
    render(<GradeBadge grade="B" />);
    expect(screen.getByLabelText('Grade B')).toBeInTheDocument();
  });

  it.each(['A', 'B', 'C', 'D', 'F'] as const)('renders grade %s', (grade) => {
    render(<GradeBadge grade={grade} />);
    expect(screen.getByText(grade)).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    render(<GradeBadge grade="A" size="sm" />);
    const badge = screen.getByLabelText('Grade A');
    expect(badge).toHaveClass('w-6', 'h-6');
  });

  it('applies lg size classes', () => {
    render(<GradeBadge grade="A" size="lg" />);
    const badge = screen.getByLabelText('Grade A');
    expect(badge).toHaveClass('w-12', 'h-12');
  });

  it('applies success color for grade A', () => {
    render(<GradeBadge grade="A" />);
    const badge = screen.getByLabelText('Grade A');
    expect(badge).toHaveClass('text-oav-success');
  });

  it('applies error color for grade F', () => {
    render(<GradeBadge grade="F" />);
    const badge = screen.getByLabelText('Grade F');
    expect(badge).toHaveClass('text-oav-error');
  });
});
