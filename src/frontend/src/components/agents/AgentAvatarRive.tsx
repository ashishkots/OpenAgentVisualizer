import { useEffect } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import type { AgentStatus } from '../../types/agent';

const KNOWN_AVATARS = ['default', 'researcher', 'coder', 'analyst', 'coordinator'];
const STATUS_TO_IDX: Record<AgentStatus, string> = {
  idle: 'idle', working: 'working', thinking: 'thinking',
  communicating: 'communicating', error: 'error',
};

interface Props {
  avatarId: string;
  status: AgentStatus;
  xpLevel: number;
  isSelected: boolean;
  onCelebrate?: boolean;
  size?: number;
}

export function AgentAvatarRive({ avatarId, status, xpLevel, isSelected, onCelebrate, size = 48 }: Props) {
  const known = KNOWN_AVATARS.includes(avatarId);

  const { rive, RiveComponent } = useRive({
    src: known ? `/avatars/${avatarId}.riv` : undefined,
    stateMachines: 'MainMachine',
    autoplay: true,
  });

  const statusInput    = useStateMachineInput(rive, 'MainMachine', 'status');
  const xpInput        = useStateMachineInput(rive, 'MainMachine', 'xpLevel');
  const selectedInput  = useStateMachineInput(rive, 'MainMachine', 'isSelected');
  const celebrateInput = useStateMachineInput(rive, 'MainMachine', 'triggerCelebrate');

  useEffect(() => { if (statusInput)   statusInput.value   = STATUS_TO_IDX[status] ?? 'idle'; }, [status, statusInput]);
  useEffect(() => { if (xpInput)       xpInput.value       = xpLevel; }, [xpLevel, xpInput]);
  useEffect(() => { if (selectedInput) selectedInput.value = isSelected; }, [isSelected, selectedInput]);
  useEffect(() => { if (onCelebrate && celebrateInput) celebrateInput.fire?.(); }, [onCelebrate, celebrateInput]);

  if (!known) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="var(--oav-surface-2)" stroke="var(--oav-accent)" strokeWidth="2"/>
        <text x="24" y="30" textAnchor="middle" fontSize="18" fill="var(--oav-accent)">⬡</text>
      </svg>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      boxShadow: isSelected ? `0 0 0 2px var(--oav-accent)` : undefined }}>
      <RiveComponent />
    </div>
  );
}
