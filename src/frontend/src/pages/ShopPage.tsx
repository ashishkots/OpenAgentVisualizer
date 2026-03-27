import { useState } from 'react';
import { Coins, ShoppingCart, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useShopItems, useBuyItem } from '../hooks/useShop';
import { useWallet } from '../hooks/useWallet';
import { useEconomyStore } from '../stores/economyStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { ShopItem, ItemCategory, ItemRarity } from '../types/economy';

const CATEGORY_TABS: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'cosmetic',  label: 'Cosmetics' },
  { id: 'boost',     label: 'Boosts'    },
  { id: 'title',     label: 'Titles'    },
];

const RARITY_RING: Record<ItemRarity, string> = {
  common:    'ring-2 ring-gray-400',
  rare:      'ring-2 ring-blue-500',
  epic:      'ring-2 ring-purple-500',
  legendary: 'ring-2 ring-yellow-500',
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  common:    'Common',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

const RARITY_TEXT: Record<ItemRarity, string> = {
  common:    'text-gray-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-yellow-400',
};

interface BuyModal {
  item: ShopItem;
}

export function ShopPage() {
  const [buyModal, setBuyModal] = useState<BuyModal | null>(null);
  const shopCategory = useEconomyStore((s) => s.shopCategory);
  const setShopCategory = useEconomyStore((s) => s.setShopCategory);

  const { data: items = [], isLoading } = useShopItems();
  const { data: wallet } = useWallet();
  const { mutate: buyItem, isPending: isBuying } = useBuyItem();

  const filtered = shopCategory === 'all'
    ? items
    : items.filter((i) => i.category === shopCategory);

  function handleConfirmBuy() {
    if (!buyModal) return;
    buyItem(buyModal.item.id, {
      onSuccess: () => setBuyModal(null),
    });
  }

  const canAfford = wallet
    ? wallet.balance >= (buyModal?.item.price ?? 0)
    : false;

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-oav-text">Shop</h1>
          <p className="text-oav-muted text-sm mt-1">
            Spend tokens to unlock cosmetics, boosts, and titles.
          </p>
        </div>
        {wallet && (
          <div className="flex items-center gap-1.5 text-sm text-oav-gold font-medium">
            <Coins className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">{wallet.balance.toLocaleString()} tokens</span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="border-b border-oav-border">
        <div className="flex gap-1" role="tablist" aria-label="Item categories">
          {CATEGORY_TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={shopCategory === id}
              aria-controls={`shop-panel-${id}`}
              onClick={() => setShopCategory(id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                'border-b-2 -mb-px focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                shopCategory === id
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
        id={`shop-panel-${shopCategory}`}
        aria-label={`${shopCategory} items`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No items available in this category." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                walletBalance={wallet?.balance ?? 0}
                onBuy={() => setBuyModal({ item })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Buy Confirmation Modal */}
      {buyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label={`Purchase ${buyModal.item.name}`}
        >
          <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-oav-text">Confirm Purchase</h2>
                <p className={clsx('text-sm font-medium mt-0.5', RARITY_TEXT[buyModal.item.rarity])}>
                  {buyModal.item.name}
                </p>
              </div>
              <button
                onClick={() => setBuyModal(null)}
                aria-label="Close purchase dialog"
                className="text-oav-muted hover:text-oav-text transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none rounded"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-oav-muted">{buyModal.item.description}</p>

            <div className="bg-oav-bg rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-oav-muted">Price</span>
                <span className="text-oav-gold font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" aria-hidden="true" />
                  {buyModal.item.price.toLocaleString()} tokens
                </span>
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
              {canAfford && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-oav-muted">After purchase</span>
                  <span className="text-oav-text font-medium">
                    {((wallet?.balance ?? 0) - buyModal.item.price).toLocaleString()} tokens
                  </span>
                </div>
              )}
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 text-xs text-oav-error">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Insufficient tokens.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setBuyModal(null)}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-oav-border',
                  'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={!canAfford || isBuying}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                  canAfford && !isBuying
                    ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                    : 'bg-oav-border text-oav-muted cursor-not-allowed',
                )}
              >
                {isBuying ? 'Buying...' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ShopItemCardProps {
  item: ShopItem;
  walletBalance: number;
  onBuy: () => void;
}

function ShopItemCard({ item, walletBalance, onBuy }: ShopItemCardProps) {
  const canAfford = walletBalance >= item.price;

  return (
    <article
      className={clsx(
        'bg-oav-surface rounded-xl p-4 flex flex-col gap-3',
        RARITY_RING[item.rarity],
        'transition-all hover:bg-oav-surface-hover',
      )}
      aria-label={`${item.name}, ${RARITY_LABEL[item.rarity]}`}
    >
      {/* Icon + rarity */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-oav-bg flex items-center justify-center text-2xl">
          {item.icon || '✦'}
        </div>
        <span
          className={clsx(
            'text-[10px] font-semibold uppercase tracking-wide',
            RARITY_TEXT[item.rarity],
          )}
        >
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-oav-text truncate">{item.name}</p>
        <p className="text-xs text-oav-muted mt-0.5 line-clamp-2">{item.description}</p>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between mt-auto">
        <span className="flex items-center gap-1 text-sm font-semibold text-oav-gold">
          <Coins className="w-3.5 h-3.5" aria-hidden="true" />
          {item.price.toLocaleString()}
        </span>

        {item.owned ? (
          <span className="flex items-center gap-1 text-xs text-oav-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Owned
          </span>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canAfford}
            aria-label={
              canAfford
                ? `Buy ${item.name} for ${item.price} tokens`
                : `${item.name} — insufficient tokens`
            }
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              canAfford
                ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                : 'bg-oav-border text-oav-muted cursor-not-allowed',
            )}
          >
            <ShoppingCart className="w-3 h-3" aria-hidden="true" />
            Buy
          </button>
        )}
      </div>
    </article>
  );
}
