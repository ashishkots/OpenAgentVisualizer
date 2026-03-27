import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiDocsPage } from '../ApiDocsPage';

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('ApiDocsPage', () => {
  it('renders page with tab bar', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    expect(screen.getByText('API Documentation')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /interactive docs/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /sdk snippets/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /changelog/i })).toBeTruthy();
  });

  it('shows Swagger iframe by default', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    const iframe = screen.getByTitle(/swagger/i);
    expect(iframe).toBeTruthy();
  });

  it('switches to SDK Snippets tab', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /sdk snippets/i }));
    expect(screen.getByText('SDK Code Snippets')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^python$/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /typescript/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /curl/i })).toBeTruthy();
  });

  it('switches to Changelog tab', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /changelog/i }));
    expect(screen.getByText('API Changelog')).toBeTruthy();
    expect(screen.getByText('v1.7.0')).toBeTruthy();
  });

  it('shows Python snippet by default in SDK tab', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /sdk snippets/i }));
    expect(screen.getByLabelText(/python code snippet/i)).toBeTruthy();
  });

  it('switches SDK language tabs', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /sdk snippets/i }));
    fireEvent.click(screen.getByRole('tab', { name: /typescript/i }));
    expect(screen.getByLabelText(/typescript code snippet/i)).toBeTruthy();
  });

  it('has copy button in SDK tab', () => {
    render(<Wrap><ApiDocsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /sdk snippets/i }));
    expect(screen.getByRole('button', { name: /copy code snippet/i })).toBeTruthy();
  });
});
