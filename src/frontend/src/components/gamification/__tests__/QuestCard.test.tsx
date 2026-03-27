import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestCard } from '../QuestCard';
import type { Quest, AgentQuestProgress } from '../../../types/quest';

const baseQuest: Quest = {
  id: 'quest-1',
  workspace_id: 'ws-1',
  name: 'Complete 10 tasks',
  description: 'Finish 10 tasks this cycle.',
  type: 'daily',
  steps: [
    { description: 'Complete 5 tasks', condition_type: 'tasks', condition_value: 5, completed: false },
    { description: 'Complete 10 tasks', condition_type: 'tasks', condition_value: 10, completed: false },
  ],
  xp_reward: 500,
  currency_reward: 50,
  icon: '⚡',
  active: true,
  reset_hours: 24,
  created_at: '2026-03-27T00:00:00Z',
};

describe('QuestCard', () => {
  it('renders quest name and description', () => {
    render(<QuestCard quest={baseQuest} />);
    expect(screen.getByText('Complete 10 tasks')).toBeTruthy();
    expect(screen.getByText('Finish 10 tasks this cycle.')).toBeTruthy();
  });

  it('renders Daily type badge', () => {
    render(<QuestCard quest={baseQuest} />);
    expect(screen.getByText('Daily')).toBeTruthy();
  });

  it('renders Weekly type badge for weekly quest', () => {
    render(<QuestCard quest={{ ...baseQuest, type: 'weekly' }} />);
    expect(screen.getByText('Weekly')).toBeTruthy();
  });

  it('renders Epic type badge for epic quest', () => {
    render(<QuestCard quest={{ ...baseQuest, type: 'epic' }} />);
    expect(screen.getByText('Epic')).toBeTruthy();
  });

  it('renders XP and token rewards', () => {
    render(<QuestCard quest={baseQuest} />);
    expect(screen.getByText('+500 XP')).toBeTruthy();
    expect(screen.getByText('+50')).toBeTruthy();
  });

  it('renders progress bar with correct aria attributes', () => {
    const progress: AgentQuestProgress = {
      id: 'p-1',
      agent_id: 'a-1',
      quest_id: 'quest-1',
      current_step: 1,
      completed: false,
      completed_at: null,
      last_reset_at: null,
      quest: baseQuest,
    };
    render(<QuestCard quest={baseQuest} progress={progress} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders step checklist', () => {
    render(<QuestCard quest={baseQuest} />);
    expect(screen.getByText('Complete 5 tasks')).toBeTruthy();
    expect(screen.getByText('Complete 10 tasks')).toBeTruthy();
  });

  it('renders disabled claim button when not complete', () => {
    const onClaim = vi.fn();
    render(<QuestCard quest={baseQuest} onClaim={onClaim} />);
    const btn = screen.getByRole('button', { name: /claim/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('renders enabled claim button when complete', () => {
    const onClaim = vi.fn();
    const progress: AgentQuestProgress = {
      id: 'p-1',
      agent_id: 'a-1',
      quest_id: 'quest-1',
      current_step: 2,
      completed: true,
      completed_at: '2026-03-27T12:00:00Z',
      last_reset_at: null,
      quest: baseQuest,
    };
    render(<QuestCard quest={baseQuest} progress={progress} onClaim={onClaim} />);
    const btn = screen.getByRole('button', { name: /claim/i });
    fireEvent.click(btn);
    expect(onClaim).toHaveBeenCalledWith('quest-1');
  });

  it('shows Complete badge when quest is done', () => {
    const progress: AgentQuestProgress = {
      id: 'p-1',
      agent_id: 'a-1',
      quest_id: 'quest-1',
      current_step: 2,
      completed: true,
      completed_at: '2026-03-27T12:00:00Z',
      last_reset_at: null,
      quest: baseQuest,
    };
    render(<QuestCard quest={baseQuest} progress={progress} />);
    expect(screen.getByText('Complete')).toBeTruthy();
  });
});
