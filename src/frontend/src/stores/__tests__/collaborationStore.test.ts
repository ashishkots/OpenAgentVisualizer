import { describe, it, expect, beforeEach } from 'vitest';
import { useCollaborationStore } from '../collaborationStore';
import type { WorkspaceInvite, ActivityEntry } from '../../types/collaboration';

const makeInvite = (id: string): WorkspaceInvite => ({
  id,
  email: `user-${id}@example.com`,
  role: 'member',
  status: 'pending',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
});

const makeActivity = (id: string): ActivityEntry => ({
  id,
  user_id: 'user-1',
  action: 'agent_created',
  target_type: 'agent',
  target_id: 'agent-1',
  extra_data: null,
  created_at: new Date().toISOString(),
});

describe('useCollaborationStore', () => {
  beforeEach(() => {
    useCollaborationStore.setState({ invites: [], activity: [], isActivityOpen: false });
  });

  it('setInvites replaces invite list', () => {
    useCollaborationStore.getState().setInvites([makeInvite('i1'), makeInvite('i2')]);
    expect(useCollaborationStore.getState().invites).toHaveLength(2);
  });

  it('addInvite prepends to list', () => {
    useCollaborationStore.getState().setInvites([makeInvite('i1')]);
    useCollaborationStore.getState().addInvite(makeInvite('i2'));
    const invites = useCollaborationStore.getState().invites;
    expect(invites).toHaveLength(2);
    expect(invites[0].id).toBe('i2');
  });

  it('removeInvite removes by id', () => {
    useCollaborationStore.getState().setInvites([makeInvite('i1'), makeInvite('i2')]);
    useCollaborationStore.getState().removeInvite('i1');
    const invites = useCollaborationStore.getState().invites;
    expect(invites).toHaveLength(1);
    expect(invites[0].id).toBe('i2');
  });

  it('setActivity replaces activity list', () => {
    useCollaborationStore.getState().setActivity([makeActivity('a1')]);
    expect(useCollaborationStore.getState().activity).toHaveLength(1);
  });

  it('toggleActivity flips isActivityOpen', () => {
    expect(useCollaborationStore.getState().isActivityOpen).toBe(false);
    useCollaborationStore.getState().toggleActivity();
    expect(useCollaborationStore.getState().isActivityOpen).toBe(true);
    useCollaborationStore.getState().toggleActivity();
    expect(useCollaborationStore.getState().isActivityOpen).toBe(false);
  });
});
