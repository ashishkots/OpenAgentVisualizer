import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CostChart } from '../CostChart';

// Mock recharts to avoid canvas issues
vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Bar: () => null,
  Cell: () => null,
}));

const mockData = [
  { date: '2026-03-01', cost: 1.23 },
  { date: '2026-03-02', cost: 0.89 },
];

describe('CostChart', () => {
  it('renders chart container', () => {
    const { container } = render(<CostChart data={mockData} />);
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
  });
});
