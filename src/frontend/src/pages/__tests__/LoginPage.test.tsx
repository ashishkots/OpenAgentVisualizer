import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders "Sign in with SSO" button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in with sso/i })).toBeTruthy();
  });

  it('shows workspace slug input after clicking SSO button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /sign in with sso/i }));
    expect(screen.getByLabelText(/workspace slug/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /continue with sso/i })).toBeTruthy();
  });

  it('can navigate back from SSO form to credentials', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /sign in with sso/i }));
    expect(screen.getByLabelText(/workspace slug/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /back to email sign in/i }));
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
  });
});
