import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspace } from '../useWorkspace';

describe('useWorkspace', () => {
  it('returns a workspaceId string', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(typeof result.current.workspaceId).toBe('string');
  });

  it('returns a valid tier value', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(['free', 'team', 'pro', 'enterprise']).toContain(result.current.tier);
  });

  it('returns a name string', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(typeof result.current.name).toBe('string');
  });
});
