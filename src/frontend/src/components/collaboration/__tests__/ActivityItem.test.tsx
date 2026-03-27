import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ActivityItem } from '../ActivityItem';
import type { ActivityEntry } from '../../../types/collaboration';

const makeEntry = (overrides?: Partial<ActivityEntry>): ActivityEntry => ({
  id: 'a1',
  user_id: 'u1',
  action: 'agent_created',
  target_type: 'agent',
  target_id: 'agent-007',
  extra_data: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('ActivityItem', () => {
  it('renders formatted action text', () => {
    render(
      <MemoryRouter>
        <ActivityItem entry={makeEntry()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/agent created/i)).toBeTruthy();
  });

  it('shows SYS initials for system events (null user_id)', () => {
    render(
      <MemoryRouter>
        <ActivityItem entry={makeEntry({ user_id: null })} />
      </MemoryRouter>,
    );
    expect(screen.getByText('SYS')).toBeTruthy();
  });

  it('renders time ago text', () => {
    render(
      <MemoryRouter>
        <ActivityItem entry={makeEntry()} />
      </MemoryRouter>,
    );
    // formatDistanceToNow renders something like "less than a minute ago"
    expect(screen.getByText(/ago/i)).toBeTruthy();
  });
});
