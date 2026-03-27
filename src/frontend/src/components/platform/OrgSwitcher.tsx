// Sprint 7 — Organization switcher dropdown in the header

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrgs, useCreateOrg } from '../../hooks/useOrganizations';
import { useOrgStore } from '../../stores/orgStore';

export function OrgSwitcher() {
  const navigate = useNavigate();
  const { data: orgs = [], isLoading } = useOrgs();
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const setCurrentOrgId = useOrgStore((s) => s.setCurrentOrgId);
  const getCurrentOrg = useOrgStore((s) => s.getCurrentOrg);
  const createOrgMutation = useCreateOrg();

  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [createError, setCreateError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateForm(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Auto-derive slug from name
  const handleNameChange = (name: string) => {
    setNewOrgName(name);
    setNewOrgSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleCreate = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      setCreateError('Name and slug are required.');
      return;
    }
    setCreateError('');
    try {
      await createOrgMutation.mutateAsync({ name: newOrgName.trim(), slug: newOrgSlug.trim() });
      setNewOrgName('');
      setNewOrgSlug('');
      setShowCreateForm(false);
      setOpen(false);
      navigate('/org/settings');
    } catch {
      setCreateError('Failed to create organization. Slug may already be taken.');
    }
  };

  const currentOrg = getCurrentOrg();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-oav-muted text-xs px-2 py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setShowCreateForm(false); }}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
          'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
          open && 'bg-oav-surface-hover text-oav-text',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch organization"
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {currentOrg?.name ?? 'No Organization'}
        </span>
        <ChevronDown
          className={clsx('w-3 h-3 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Organizations"
          className={clsx(
            'absolute right-0 mt-1.5 w-56 bg-oav-surface border border-oav-border rounded-xl shadow-xl z-50',
            'py-1 overflow-hidden',
          )}
        >
          {/* Org list */}
          {orgs.length === 0 ? (
            <div className="px-4 py-3 text-xs text-oav-muted">No organizations yet.</div>
          ) : (
            orgs.map((org) => (
              <button
                key={org.id}
                role="option"
                aria-selected={org.id === currentOrgId}
                onClick={() => {
                  setCurrentOrgId(org.id);
                  setOpen(false);
                  navigate('/org/settings');
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors',
                  'hover:bg-oav-surface-hover focus-visible:bg-oav-surface-hover focus-visible:outline-none',
                  org.id === currentOrgId ? 'text-oav-accent' : 'text-oav-text',
                )}
              >
                <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs">{org.name}</p>
                  <p className="truncate text-xs text-oav-muted">{org.plan}</p>
                </div>
                {org.id === currentOrgId && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-oav-accent" aria-hidden="true" />
                )}
              </button>
            ))
          )}

          <div className="border-t border-oav-border mt-1 pt-1">
            {/* Create organization */}
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors',
                  'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
                  'focus-visible:bg-oav-surface-hover focus-visible:outline-none',
                )}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Create Organization
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                {createError && (
                  <p role="alert" className="text-xs text-oav-error">{createError}</p>
                )}
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Organization name"
                  autoFocus
                  className="w-full bg-oav-bg border border-oav-border rounded-lg px-2 py-1.5 text-xs text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                  aria-label="Organization name"
                />
                <input
                  type="text"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="slug"
                  className="w-full bg-oav-bg border border-oav-border rounded-lg px-2 py-1.5 text-xs font-mono text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                  aria-label="Organization slug"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setCreateError(''); }}
                    className="flex-1 text-xs text-oav-muted border border-oav-border rounded-lg py-1 hover:text-oav-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={createOrgMutation.isPending}
                    className="flex-1 text-xs text-white bg-oav-accent rounded-lg py-1 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
                  >
                    {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
