import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';

function renderWithRouter(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('renders the primary navigation tabs', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('Agents')).toBeInTheDocument();
    expect(screen.getByLabelText('Alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('More navigation options')).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByLabelText('Dashboard')).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive tabs with aria-current', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByLabelText('Canvas')).not.toHaveAttribute('aria-current');
    expect(screen.getByLabelText('Alerts')).not.toHaveAttribute('aria-current');
  });

  it('does not render "More" menu initially', () => {
    renderWithRouter();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the "More" menu when "More" tab is clicked', () => {
    renderWithRouter();
    fireEvent.click(screen.getByLabelText('More navigation options'));
    expect(screen.getByRole('menu', { name: 'More navigation options' })).toBeInTheDocument();
  });

  it('shows all "More" menu items when expanded', () => {
    renderWithRouter();
    fireEvent.click(screen.getByLabelText('More navigation options'));
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('closes the "More" menu when a menu item is clicked', () => {
    renderWithRouter();
    fireEvent.click(screen.getByLabelText('More navigation options'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the "More" menu when the backdrop overlay is clicked', () => {
    renderWithRouter();
    fireEvent.click(screen.getByLabelText('More navigation options'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    // The overlay is aria-hidden, access via test convention
    const overlay = document.querySelector('[aria-hidden="true"].fixed.inset-0.z-30');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded on the "More" button', () => {
    renderWithRouter();
    const moreBtn = screen.getByLabelText('More navigation options');
    expect(moreBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(moreBtn);
    expect(moreBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks a "More" item as active when its route is current', () => {
    renderWithRouter('/settings');
    fireEvent.click(screen.getByLabelText('More navigation options'));
    const settingsItem = screen.getByRole('menuitem', { name: /settings/i });
    expect(settingsItem).toHaveAttribute('aria-current', 'page');
  });
});
