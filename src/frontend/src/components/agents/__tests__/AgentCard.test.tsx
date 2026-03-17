import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../AgentAvatarRive', () => ({ AgentAvatarRive: () => <div data-testid="avatar" /> }));
import { AgentCard } from '../AgentCard';
const agent = { id:'1', workspace_id:'w', name:'TestAgent', role:'dev', framework:'langchain',
  avatar_id:'default', status:'idle' as const, level:1, xp_total:100,
  total_tokens:5000, total_cost_usd:0.05, created_at:'', updated_at:'' };

describe('AgentCard', () => {
  it('renders agent name', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('TestAgent')).toBeTruthy();
  });
  it('renders avatar', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });
});
