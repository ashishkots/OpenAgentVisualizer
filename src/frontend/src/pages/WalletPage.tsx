import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useWallet, useTransactions } from '../hooks/useWallet';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { Transaction } from '../types/economy';

const TRANSACTION_LABELS: Record<string, string> = {
  quest_reward:       'Quest Reward',
  achievement_reward: 'Achievement',
  login_bonus:        'Login Bonus',
  level_bonus:        'Level Up',
  purchase:           'Purchase',
  tournament_entry:   'Tournament Entry',
  tournament_prize:   'Tournament Prize',
  refund:             'Refund',
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-oav-border last:border-0">
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isCredit ? 'bg-oav-success/20' : 'bg-oav-error/20',
        )}
        aria-hidden="true"
      >
        {isCredit ? (
          <TrendingUp className="w-4 h-4 text-oav-success" aria-hidden="true" />
        ) : (
          <TrendingDown className="w-4 h-4 text-oav-error" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-oav-text font-medium truncate">
          {TRANSACTION_LABELS[tx.type] ?? tx.type}
        </p>
        {tx.description && (
          <p className="text-xs text-oav-muted truncate">{tx.description}</p>
        )}
        <p className="text-xs text-oav-muted">
          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
        </p>
      </div>
      <span
        className={clsx(
          'text-sm font-bold tabular-nums shrink-0',
          isCredit ? 'text-oav-success' : 'text-oav-error',
        )}
      >
        {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
      </span>
    </div>
  );
}

export function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions = [], isLoading: txLoading } = useTransactions({ limit: 50 });

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-oav-text">Wallet</h1>
        <p className="text-oav-muted text-sm mt-1">Your token balance and transaction history.</p>
      </div>

      {/* Balance card */}
      <div className="bg-oav-surface border border-oav-border rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-oav-gold/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-oav-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-oav-muted">Available Balance</p>
            <p className="text-3xl font-bold text-oav-gold tabular-nums">
              {(wallet?.balance ?? 0).toLocaleString()}
              <span className="text-base font-normal text-oav-muted ml-2">tokens</span>
            </p>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-semibold text-oav-text mb-3">Transaction History</h2>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState message="No transactions yet. Complete quests and earn tokens!" />
        ) : (
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
