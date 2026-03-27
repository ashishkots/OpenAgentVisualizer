import { Coins } from 'lucide-react';
import { clsx } from 'clsx';
import { useWallet } from '../../hooks/useWallet';
import { useEconomyStore } from '../../stores/economyStore';
import { WalletDropdown } from './WalletDropdown';

export function WalletBadge() {
  const { data: wallet } = useWallet();
  const isOpen = useEconomyStore((s) => s.isWalletDropdownOpen);
  const toggle = useEconomyStore((s) => s.toggleWalletDropdown);

  const balance = wallet?.balance ?? 0;

  return (
    <div className="relative" data-testid="wallet-badge">
      <button
        onClick={toggle}
        aria-label={`Wallet balance: ${balance.toLocaleString()} tokens`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={clsx(
          'flex items-center gap-1.5 px-2.5 h-9 rounded-lg transition-colors text-sm font-medium',
          'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
          isOpen
            ? 'bg-oav-surface-hover text-oav-gold'
            : 'text-oav-muted hover:text-oav-gold hover:bg-oav-surface-hover',
        )}
      >
        <Coins className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="tabular-nums">{balance.toLocaleString()}</span>
      </button>

      {isOpen && <WalletDropdown />}
    </div>
  );
}
