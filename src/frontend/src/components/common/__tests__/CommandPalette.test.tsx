import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  it('is hidden initially', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('opens on Ctrl+K', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('closes on Escape', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
