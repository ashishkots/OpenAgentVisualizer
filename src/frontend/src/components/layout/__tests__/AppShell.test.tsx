import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppShell } from '../AppShell';

const Wrapper = () => <MemoryRouter><AppShell /></MemoryRouter>;

describe('AppShell', () => {
  it('renders nav links', () => {
    render(<Wrapper />);
    expect(screen.getByText('World')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
  it('collapses sidebar on toggle', () => {
    render(<Wrapper />);
    const toggle = screen.getByLabelText('toggle sidebar');
    fireEvent.click(toggle);
    expect(screen.getByTestId('sidebar')).toHaveClass('w-16');
  });
});
