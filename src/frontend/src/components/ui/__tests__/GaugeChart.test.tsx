import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GaugeChart, scoreToGrade } from '../GaugeChart';

describe('scoreToGrade', () => {
  it.each([
    [100, 'A'],
    [90, 'A'],
    [89, 'B'],
    [80, 'B'],
    [79, 'C'],
    [70, 'C'],
    [69, 'D'],
    [60, 'D'],
    [59, 'F'],
    [0, 'F'],
  ] as const)('score %i => grade %s', (score, grade) => {
    expect(scoreToGrade(score)).toBe(grade);
  });
});

describe('GaugeChart', () => {
  it('renders the score number', () => {
    render(<GaugeChart score={87} grade="B" />);
    expect(screen.getByText('87')).toBeInTheDocument();
  });

  it('renders the grade letter', () => {
    render(<GaugeChart score={87} grade="B" />);
    expect(screen.getByText('Grade B')).toBeInTheDocument();
  });

  it('renders lastUpdated when provided', () => {
    render(<GaugeChart score={87} grade="B" lastUpdated="Mar 27, 2026" />);
    expect(screen.getByText('Last updated: Mar 27, 2026')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<GaugeChart score={87} grade="B" />);
    expect(screen.getByLabelText('Compliance score 87, grade B')).toBeInTheDocument();
  });
});
