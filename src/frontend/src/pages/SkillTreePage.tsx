import { useState } from 'react';
import { X, Coins, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useSkillTrees, useAgentSkills, useUnlockSkill } from '../hooks/useSkills';
import { useWallet } from '../hooks/useWallet';
import { useAgentStore } from '../stores/agentStore';
import { SkillNode } from '../components/gamification/SkillNode';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { SkillNode as SkillNodeType, SkillNodeState } from '../types/skill';

interface UnlockModal {
  node: SkillNodeType;
  agentId: string;
}

export function SkillTreePage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [unlockModal, setUnlockModal] = useState<UnlockModal | null>(null);

  const agents = useAgentStore((s) => Object.values(s.agents));
  const { data: skillTrees = [], isLoading: treesLoading } = useSkillTrees();
  const { data: agentSkills = [], isLoading: skillsLoading } = useAgentSkills(
    selectedAgentId || undefined,
  );
  const { data: wallet } = useWallet();
  const { mutate: unlockSkill, isPending: isUnlocking } = useUnlockSkill();

  const unlockedNodeIds = new Set(agentSkills.map((s) => s.node_id));

  function getNodeState(node: SkillNodeType): SkillNodeState {
    if (unlockedNodeIds.has(node.id)) return 'unlocked';
    if (!selectedAgentId) return 'locked';

    const agent = agents.find((a) => a.id === selectedAgentId);
    if (!agent) return 'locked';

    // Check level requirement
    if (agent.level < node.level_required) return 'locked';

    // Check parent unlocked (if has parent)
    if (node.parent_id && !unlockedNodeIds.has(node.parent_id)) return 'locked';

    return 'available';
  }

  function handleNodeClick(node: SkillNodeType) {
    if (!selectedAgentId) return;
    setUnlockModal({ node, agentId: selectedAgentId });
  }

  function handleConfirmUnlock() {
    if (!unlockModal) return;
    unlockSkill(
      { agentId: unlockModal.agentId, nodeId: unlockModal.node.id },
      { onSuccess: () => setUnlockModal(null) },
    );
  }

  const canAfford = wallet ? wallet.balance >= (unlockModal?.node.cost ?? 0) : false;

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-oav-text">Skill Trees</h1>
          <p className="text-oav-muted text-sm mt-1">
            Unlock skills to boost agent performance.
          </p>
        </div>

        {/* Agent selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="skill-agent-select" className="text-sm text-oav-muted whitespace-nowrap">
            Agent:
          </label>
          <select
            id="skill-agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className={clsx(
              'bg-oav-surface border border-oav-border rounded-lg px-3 py-1.5 text-sm text-oav-text',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
            )}
          >
            <option value="">Select agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (Lv. {a.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Wallet balance hint */}
      {selectedAgentId && wallet && (
        <div className="flex items-center gap-2 text-sm text-oav-gold">
          <Coins className="w-4 h-4" aria-hidden="true" />
          <span>Balance: <strong>{wallet.balance.toLocaleString()}</strong> tokens</span>
        </div>
      )}

      {/* Trees */}
      {treesLoading || (selectedAgentId && skillsLoading) ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : skillTrees.length === 0 ? (
        <EmptyState message="No skill trees available." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillTrees.map((tree) => {
            // Group nodes by tier
            const byTier = tree.nodes.reduce<Record<number, SkillNodeType[]>>((acc, node) => {
              if (!acc[node.tier]) acc[node.tier] = [];
              acc[node.tier].push(node);
              return acc;
            }, {});
            const tiers = Object.keys(byTier)
              .map(Number)
              .sort((a, b) => a - b);

            return (
              <div
                key={tree.id}
                className="bg-oav-surface border border-oav-border rounded-xl p-4"
                aria-label={`${tree.name} skill tree`}
              >
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-oav-text">{tree.name}</p>
                  <p className="text-xs text-oav-muted">{tree.description}</p>
                </div>

                {/* Tiers with connector lines */}
                <div className="flex flex-col items-center gap-0">
                  {tiers.map((tier, tierIdx) => (
                    <div key={tier} className="flex flex-col items-center w-full">
                      <div className="flex justify-center gap-4 flex-wrap">
                        {byTier[tier].map((node) => (
                          <SkillNode
                            key={node.id}
                            node={node}
                            state={getNodeState(node)}
                            onClick={handleNodeClick}
                          />
                        ))}
                      </div>
                      {/* Connector line between tiers */}
                      {tierIdx < tiers.length - 1 && (
                        <div
                          className="w-px h-6 bg-oav-border my-1"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!selectedAgentId && skillTrees.length > 0 && (
        <p className="text-center text-sm text-oav-muted">
          Select an agent above to see their skill progress and unlock new skills.
        </p>
      )}

      {/* Unlock Modal */}
      {unlockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label={`Unlock ${unlockModal.node.name}`}
        >
          <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-oav-text">Unlock Skill</h2>
                <p className="text-sm text-oav-muted mt-0.5">{unlockModal.node.name}</p>
              </div>
              <button
                onClick={() => setUnlockModal(null)}
                aria-label="Close unlock dialog"
                className="text-oav-muted hover:text-oav-text transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none rounded"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-oav-text">{unlockModal.node.description}</p>

            {/* Requirements */}
            <div className="bg-oav-bg rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-oav-muted">Cost</span>
                <span className="text-oav-gold font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" aria-hidden="true" />
                  {unlockModal.node.cost.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-oav-muted">Level required</span>
                <span className="text-oav-text font-medium">Lv. {unlockModal.node.level_required}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-oav-muted">Your balance</span>
                <span
                  className={clsx(
                    'font-medium',
                    canAfford ? 'text-oav-success' : 'text-oav-error',
                  )}
                >
                  {wallet?.balance.toLocaleString() ?? 0} tokens
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 text-xs text-oav-error">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Insufficient tokens to unlock this skill.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setUnlockModal(null)}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-oav-border',
                  'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={!canAfford || isUnlocking}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                  canAfford && !isUnlocking
                    ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                    : 'bg-oav-border text-oav-muted cursor-not-allowed',
                )}
              >
                {isUnlocking ? 'Unlocking...' : 'Confirm Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
