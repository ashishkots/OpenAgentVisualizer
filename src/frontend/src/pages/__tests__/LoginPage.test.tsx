import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: { access_token: 'tok', workspace_id: 'ws1' } }),
  },
}));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
  });

  it('submit button is present', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });
});
