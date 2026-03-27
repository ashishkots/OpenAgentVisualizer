import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useWallet } from '../../hooks/useWallet';
import { useEconomyStore } from '../../stores/economyStore';
import type { Transaction } from '../../types/economy';

const TRANSACTION_LABELS: Record<string, string> = {
  quest_reward:      'Quest Reward',
  achievement_reward:'Achievement',
  login_bonus:       'Login Bonus',
  level_bonus:       'Level Up',
  purchase:          'Purchase',
  tournament_entry:  'Tournament Entry',
  tournament_prize:  'Tournament Prize',
  refund:            'Refund',
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-oav-border last:border-0">
      <div
        className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
          isCredit ? 'bg-oav-success/20' : 'bg-oav-error/20',
        )}
        aria-hidden="true"
      >
        {isCredit ? (
          <TrendingUp className="w-3 h-3 text-oav-success" aria-hidden="true" />
        ) : (
          <TrendingDown className="w-3 h-3 text-oav-error" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-oav-text truncate">
          {TRANSACTION_LABELS[tx.type] ?? tx.type}
        </p>
        <p className="text-[10px] text-oav-muted">
          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
        </p>
      </div>
      <span
        className={clsx(
          'text-xs font-semibold tabular-nums shrink-0',
          isCredit ? 'text-oav-success' : 'text-oav-error',
        )}
      >
        {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
      </span>
    </div>
  );
}

export function WalletDropdown() {
  const { data: wallet } = useWallet();
  const close = useEconomyStore((s) => s.closeWalletDropdown);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recentTransactions = (wallet?.recent_transactions ?? []).slice(0, 5);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Wallet"
      className={clsx(
        'absolute right-0 top-full mt-2 w-72',
        'bg-oav-surface border border-oav-border rounded-xl shadow-lg z-50',
        'animate-fade-in-up',
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-oav-border">
        <p className="text-xs text-oav-muted font-medium uppercase tracking-wide">Balance</p>
        <p className="text-2xl font-bold text-oav-gold tabular-nums">
          {(wallet?.balance ?? 0).toLocaleString()}
          <span className="text-sm font-normal text-oav-muted ml-1">tokens</span>
        </p>
      </div>

      {/* Recent transactions */}
      <div className="px-4 py-2">
        <p className="text-xs text-oav-muted font-medium uppercase tracking-wide mb-2">
          Recent
        </p>
        {recentTransactions.length === 0 ? (
          <p className="text-xs text-oav-muted py-3 text-center">No transactions yet</p>
        ) : (
          recentTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>

      {/* View All link */}
      <div className="px-4 py-2 border-t border-oav-border">
        <Link
          to="/wallet"
          onClick={close}
          className="text-xs text-oav-accent hover:text-oav-accent/80 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none rounded"
        >
          View all transactions →
        </Link>
      </div>
    </div>
  );
}
