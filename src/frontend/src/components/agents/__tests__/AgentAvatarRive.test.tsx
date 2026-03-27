import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({ rive: null, RiveComponent: () => <canvas /> }),
  useStateMachineInput: () => null,
}));

import { AgentAvatarRive } from '../AgentAvatarRive';

describe('AgentAvatarRive', () => {
  it('renders without crash for all status values', () => {
    const statuses = ['idle','working','thinking','communicating','error'] as const;
    statuses.forEach(status => {
      const { unmount } = render(<AgentAvatarRive avatarId="default" status={status} xpLevel={1} isSelected={false} />);
      unmount();
    });
  });
  it('renders SVG fallback when avatarId is unknown', () => {
    const { container } = render(<AgentAvatarRive avatarId="unknown_xyz" status="idle" xpLevel={1} isSelected={false} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
