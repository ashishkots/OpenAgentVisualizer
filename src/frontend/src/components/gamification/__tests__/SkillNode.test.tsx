import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillNode } from '../SkillNode';
import type { SkillNode as SkillNodeType } from '../../../types/skill';

const baseNode: SkillNodeType = {
  id: 'node-1',
  tree_id: 'tree-1',
  name: 'Quick Start',
  description: 'Reduces startup time.',
  parent_id: null,
  level_required: 1,
  cost: 50,
  stat_bonus: { speed_multiplier: 1.1 },
  icon: '⚡',
  tier: 1,
};

describe('SkillNode', () => {
  it('renders node name', () => {
    render(<SkillNode node={baseNode} state="available" />);
    expect(screen.getByText('Quick Start')).toBeTruthy();
  });

  it('renders lock icon when locked', () => {
    render(<SkillNode node={baseNode} state="locked" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
    expect(btn.getAttribute('disabled')).toBeDefined();
  });

  it('renders as disabled button when locked', () => {
    render(<SkillNode node={baseNode} state="locked" />);
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onClick when available node is clicked', () => {
    const onClick = vi.fn();
    render(<SkillNode node={baseNode} state="available" onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledWith(baseNode);
  });

  it('does not call onClick when locked node is clicked', () => {
    const onClick = vi.fn();
    render(<SkillNode node={baseNode} state="locked" onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders correct aria-label for available state', () => {
    render(<SkillNode node={baseNode} state="available" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toContain('Quick Start');
    expect(btn.getAttribute('aria-label')).toContain('available');
    expect(btn.getAttribute('aria-label')).toContain('50 tokens');
  });

  it('renders correct aria-label for unlocked state', () => {
    render(<SkillNode node={baseNode} state="unlocked" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toContain('Quick Start');
    expect(btn.getAttribute('aria-label')).toContain('unlocked');
  });

  it('is not interactive when unlocked', () => {
    const onClick = vi.fn();
    render(<SkillNode node={baseNode} state="unlocked" onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
