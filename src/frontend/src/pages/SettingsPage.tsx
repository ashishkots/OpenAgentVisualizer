import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../services/api';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { clsx } from 'clsx';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }];

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const workspaceId = localStorage.getItem('oav_workspace');
      if (!workspaceId) return null;
      const { data } = await apiClient.get<Workspace>(`/api/workspaces/${workspaceId}`);
      return data;
    },
  });

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiKey[]>('/api/keys');
      return data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post<{ key: ApiKey; plaintext: string }>('/api/keys', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowCreateModal(false);
      setNewKeyName('');
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiClient.delete(`/api/keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-2xl space-y-8 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Settings</h1>

      {/* Workspace Section */}
      <section aria-labelledby="workspace-heading">
        <h2 id="workspace-heading" className="text-lg font-semibold text-oav-text mb-4">
          Workspace
        </h2>
        <div className="bg-oav-surface border border-oav-border rounded-xl p-4 space-y-3">
          {wsLoading ? (
            <LoadingSpinner />
          ) : workspace ? (
            <>
              <div>
                <p className="text-xs text-oav-muted mb-1">Name</p>
                <p className="text-sm text-oav-text font-medium">{workspace.name}</p>
              </div>
              <div>
                <p className="text-xs text-oav-muted mb-1">Slug</p>
                <p className="text-xs font-mono text-oav-accent">{workspace.slug}</p>
              </div>
              <div>
                <p className="text-xs text-oav-muted mb-1">ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-oav-muted">{workspace.id}</p>
                  <button
                    onClick={() => handleCopy(workspace.id, 'workspace-id')}
                    className="text-oav-muted hover:text-oav-text transition-colors"
                    aria-label="Copy workspace ID"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  {copiedId === 'workspace-id' && (
                    <span className="text-xs text-oav-success">Copied!</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-oav-muted mb-1">Created</p>
                <p className="text-xs text-oav-muted">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-oav-muted">No workspace information available</p>
          )}
        </div>
      </section>

      {/* API Keys Section */}
      <section aria-labelledby="api-keys-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="api-keys-heading" className="text-lg font-semibold text-oav-text">
            API Keys
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-3 py-2 hover:bg-oav-accent/80 transition-colors min-h-[44px]"
            aria-label="Create new API key"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Key
          </button>
        </div>

        {keysLoading ? (
          <LoadingSpinner />
        ) : apiKeys.length === 0 ? (
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4 text-center text-sm text-oav-muted">
            No API keys yet. Create one to authenticate SDK requests.
          </div>
        ) : (
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 border-b border-oav-border last:border-0',
                  key.revoked && 'opacity-50',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-oav-text">{key.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-oav-muted">
                      {key.prefix}...
                    </p>
                    <button
                      onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                      className="text-oav-muted hover:text-oav-text"
                      aria-label={revealedKey === key.id ? 'Hide key' : 'Show key prefix'}
                    >
                      {revealedKey === key.id
                        ? <EyeOff className="w-3 h-3" aria-hidden="true" />
                        : <Eye className="w-3 h-3" aria-hidden="true" />
                      }
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-oav-muted">
                    {key.last_used_at
                      ? `Used ${new Date(key.last_used_at).toLocaleDateString()}`
                      : 'Never used'}
                  </p>
                  {key.revoked && (
                    <span className="text-xs text-oav-error font-medium">Revoked</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(key.prefix, key.id)}
                  className="text-oav-muted hover:text-oav-text transition-colors"
                  aria-label={`Copy API key prefix for ${key.name}`}
                >
                  {copiedId === key.id
                    ? <span className="text-xs text-oav-success">Copied!</span>
                    : <Copy className="w-4 h-4" aria-hidden="true" />
                  }
                </button>
                {!key.revoked && (
                  <button
                    onClick={() => revokeKeyMutation.mutate(key.id)}
                    className="text-oav-muted hover:text-oav-error transition-colors"
                    aria-label={`Revoke API key: ${key.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-key-title"
        >
          <div className="bg-oav-surface border border-oav-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 id="create-key-title" className="text-lg font-semibold text-oav-text mb-4">
              Create API Key
            </h3>
            <label className="block mb-4">
              <p className="text-xs text-oav-muted mb-1">Key Name</p>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production SDK"
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                autoFocus
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreateModal(false); setNewKeyName(''); }}
                className="text-sm text-oav-muted hover:text-oav-text border border-oav-border rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
                className="text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
