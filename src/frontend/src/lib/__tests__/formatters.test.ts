import { describe, it, expect } from 'vitest';
import { formatCost, formatTokens, formatDuration } from '../formatters';

describe('formatters', () => {
  it('formatCost formats dollars', () => expect(formatCost(1.234)).toBe('$1.23'));
  it('formatCost uses K for thousands', () => expect(formatCost(1500)).toBe('$1.50K'));
  it('formatTokens formats with commas', () => expect(formatTokens(1234567)).toBe('1,234,567'));
  it('formatDuration shows seconds', () => expect(formatDuration(1500)).toBe('1.5s'));
  it('formatDuration shows minutes', () => expect(formatDuration(65000)).toBe('1m 5s'));
});
