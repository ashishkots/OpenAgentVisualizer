import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../../stores/agentStore';
import type { CommandPaletteItem } from '../../types/command-palette';

const PAGE_ITEMS: CommandPaletteItem[] = [
  { id: 'world',     label: 'Virtual World',  group: 'pages', icon: '⬡', action: () => {} },
  { id: 'dashboard', label: 'Dashboard',      group: 'pages', icon: '◈', action: () => {} },
  { id: 'alerts',    label: 'Alerts',         group: 'pages', icon: '⚠', action: () => {} },
  { id: 'replay',    label: 'Replay',         group: 'pages', icon: '▶', action: () => {} },
  { id: 'settings',  label: 'Settings',       group: 'pages', icon: '⚙', action: () => {} },
];

const PAGE_PATHS: Record<string, string> = {
  world: '/world',
  dashboard: '/dashboard',
  alerts: '/alerts',
  replay: '/replay',
  settings: '/settings',
};

const ACTION_ITEMS: CommandPaletteItem[] = [
  { id: 'export',         label: 'Export traces as CSV',       group: 'actions', icon: '↓', action: () => { window.open('/api/traces/export'); } },
  { id: 'replay-session', label: 'Open last session replay',   group: 'actions', icon: '▶', action: () => {} },
  { id: 'toggle-mode',    label: 'Toggle Professional / Gamified', group: 'actions', icon: '⬡', action: () => {} },
];

const RECENT_KEY = 'oav_cmd_recent';

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  const r = [id, ...loadRecent().filter(x => x !== id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const agents = useAgentStore((s) => s.agents);

  // Build agent items from store
  const agentItems: CommandPaletteItem[] = Object.values(agents).map((a) => ({
    id: `agent:${a.id}`,
    label: a.name,
    group: 'agents' as const,
    icon: a.status === 'working' ? '●' : '○',
    keywords: [a.framework, a.role],
    action: () => navigate(`/dashboard?agent=${a.id}`),
  }));

  const allItems = [...PAGE_ITEMS, ...agentItems, ...ACTION_ITEMS];

  const recentIds = loadRecent();
  const recentItems: CommandPaletteItem[] = recentIds
    .map(id => allItems.find(i => i.id === id))
    .filter(Boolean) as CommandPaletteItem[];

  // Filter based on query or fall back to recents / page items
  const filtered = query
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.keywords?.some(k => k?.toLowerCase().includes(query.toLowerCase()))
      )
    : recentItems.length > 0 ? recentItems : PAGE_ITEMS;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setIndex(0);
  }, []);

  // Global Ctrl+K / Cmd+K toggle + Escape close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setIndex(i => Math.min(i + 1, filtered.length - 1));
    if (e.key === 'ArrowUp')   setIndex(i => Math.max(i - 1, 0));
    if (e.key === 'Enter' && filtered[index]) execute(filtered[index]);
  };

  function execute(item: CommandPaletteItem) {
    pushRecent(item.id);
    if (item.group === 'pages' && PAGE_PATHS[item.id]) {
      navigate(PAGE_PATHS[item.id]);
    } else {
      item.action();
    }
    close();
  }

  // Group items by category (show 'recent' label when not searching)
  const grouped = filtered.reduce<Record<string, CommandPaletteItem[]>>((acc, item) => {
    const g = query
      ? item.group
      : recentIds.includes(item.id) ? 'recent' : item.group;
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  if (!open) return null;

  // Flat index counter for keyboard highlight tracking across groups
  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIndex(0); }}
          placeholder="Search pages, agents, actions…"
          className="w-full px-4 py-3 bg-transparent text-oav-text text-sm outline-none border-b"
          style={{ borderColor: 'var(--oav-border)' }}
          aria-label="Search command palette"
        />

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-oav-muted text-sm text-center">No results</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--oav-muted)' }}
                >
                  {group}
                </p>
                {items.map((item) => {
                  const myIdx = flatIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={() => execute(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                      style={{
                        background: myIdx === index ? 'var(--oav-selected)' : undefined,
                        color: 'var(--oav-text)',
                      }}
                    >
                      <span className="text-oav-muted">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-oav-muted text-xs capitalize">{item.group}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          className="px-4 py-2 border-t text-xs text-oav-muted flex gap-4"
          style={{ borderColor: 'var(--oav-border)' }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
