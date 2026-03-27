import { useState } from 'react';
import { Package, CheckCircle2, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useInventory, useEquipItem, useUnequipItem } from '../hooks/useShop';
import { useAgentStore } from '../stores/agentStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { InventoryItem, ItemCategory, ItemRarity } from '../types/economy';

const CATEGORY_FILTERS: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all',      label: 'All'       },
  { id: 'cosmetic', label: 'Cosmetics' },
  { id: 'boost',    label: 'Boosts'    },
  { id: 'title',    label: 'Titles'    },
];

const RARITY_RING: Record<ItemRarity, string> = {
  common:    'ring-1 ring-gray-400/50',
  rare:      'ring-1 ring-blue-500/50',
  epic:      'ring-1 ring-purple-500/50',
  legendary: 'ring-1 ring-yellow-500/50',
};

const RARITY_TEXT: Record<ItemRarity, string> = {
  common:    'text-gray-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-yellow-400',
};

export function InventoryPage() {
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const { data: inventory = [], isLoading } = useInventory();
  const agents = useAgentStore((s) => Object.values(s.agents));
  const { mutate: equipItem, isPending: isEquipping } = useEquipItem();
  const { mutate: unequipItem, isPending: isUnequipping } = useUnequipItem();

  const filtered = categoryFilter === 'all'
    ? inventory
    : inventory.filter((inv) => inv.item.category === categoryFilter);

  function handleEquip(inventoryId: string, agentId: string) {
    setEquippingId(inventoryId);
    equipItem(
      { inventoryId, agentId },
      { onSettled: () => setEquippingId(null) },
    );
  }

  function handleUnequip(inventoryId: string) {
    setEquippingId(inventoryId);
    unequipItem(inventoryId, { onSettled: () => setEquippingId(null) });
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-oav-text">Inventory</h1>
          <p className="text-oav-muted text-sm mt-1">
            Manage and equip your owned items.
          </p>
        </div>
        <span className="text-sm text-oav-muted">
          {inventory.length} item{inventory.length !== 1 ? 's' : ''} owned
        </span>
      </div>

      {/* Category filter tabs */}
      <div className="border-b border-oav-border">
        <div className="flex gap-1" role="tablist" aria-label="Filter by category">
          {CATEGORY_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={categoryFilter === id}
              aria-controls={`inv-panel-${id}`}
              onClick={() => setCategoryFilter(id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                'border-b-2 -mb-px focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                categoryFilter === id
                  ? 'border-oav-accent text-oav-accent'
                  : 'border-transparent text-oav-muted hover:text-oav-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div
        role="tabpanel"
        id={`inv-panel-${categoryFilter}`}
        aria-label={`${categoryFilter} inventory`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={
              categoryFilter === 'all'
                ? 'Your inventory is empty. Visit the Shop to purchase items.'
                : `No ${categoryFilter} items in your inventory.`
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((inv) => (
              <InventoryCard
                key={inv.id}
                item={inv}
                agents={agents}
                isProcessing={equippingId === inv.id && (isEquipping || isUnequipping)}
                onEquip={(agentId) => handleEquip(inv.id, agentId)}
                onUnequip={() => handleUnequip(inv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface InventoryCardProps {
  item: InventoryItem;
  agents: Array<{ id: string; name: string }>;
  isProcessing: boolean;
  onEquip: (agentId: string) => void;
  onUnequip: () => void;
}

function InventoryCard({ item, agents, isProcessing, onEquip, onUnequip }: InventoryCardProps) {
  const [selectOpen, setSelectOpen] = useState(false);
  const equippedAgent = item.agent_id
    ? agents.find((a) => a.id === item.agent_id)
    : null;

  const rarity = item.item.rarity;

  return (
    <article
      className={clsx(
        'bg-oav-surface rounded-xl p-4 flex flex-col gap-3',
        RARITY_RING[rarity],
        'transition-all',
      )}
      aria-label={`${item.item.name}${item.equipped ? ', equipped' : ''}`}
    >
      {/* Icon + equipped badge */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-oav-bg flex items-center justify-center text-2xl">
          {item.item.icon || '✦'}
        </div>
        {item.equipped && (
          <span className="flex items-center gap-1 text-[10px] text-oav-success font-semibold uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            Equipped
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-oav-text truncate">{item.item.name}</p>
        <p className={clsx('text-[10px] font-medium uppercase tracking-wide', RARITY_TEXT[rarity])}>
          {rarity}
        </p>
        <p className="text-xs text-oav-muted mt-1 line-clamp-2">{item.item.description}</p>
      </div>

      {/* Equip controls */}
      {item.item.category !== 'boost' && (
        <div className="mt-auto">
          {item.equipped ? (
            <div className="space-y-2">
              {equippedAgent && (
                <p className="text-xs text-oav-muted truncate">
                  On: <span className="text-oav-text">{equippedAgent.name}</span>
                </p>
              )}
              <button
                onClick={onUnequip}
                disabled={isProcessing}
                aria-label={`Unequip ${item.item.name}`}
                className={clsx(
                  'w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-oav-border',
                  'text-oav-muted hover:text-oav-error hover:border-oav-error/50 transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                  isProcessing && 'cursor-not-allowed opacity-60',
                )}
              >
                {isProcessing ? 'Processing...' : 'Unequip'}
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setSelectOpen((v) => !v)}
                disabled={isProcessing || agents.length === 0}
                aria-label={`Equip ${item.item.name} on agent`}
                aria-expanded={selectOpen}
                aria-haspopup="listbox"
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium',
                  'bg-oav-accent/10 text-oav-accent border border-oav-accent/30',
                  'hover:bg-oav-accent/20 transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                  (isProcessing || agents.length === 0) && 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" aria-hidden="true" />
                  Equip
                </span>
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              </button>

              {/* Agent dropdown */}
              {selectOpen && agents.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Select agent to equip"
                  className={clsx(
                    'absolute bottom-full mb-1 left-0 right-0 z-20',
                    'bg-oav-surface border border-oav-border rounded-lg shadow-lg',
                    'max-h-40 overflow-y-auto',
                  )}
                >
                  {agents.map((agent) => (
                    <li key={agent.id}>
                      <button
                        role="option"
                        aria-selected={item.agent_id === agent.id}
                        onClick={() => {
                          setSelectOpen(false);
                          onEquip(agent.id);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-xs text-oav-text hover:bg-oav-surface-hover transition-colors',
                          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oav-accent focus-visible:outline-none',
                        )}
                      >
                        {agent.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
