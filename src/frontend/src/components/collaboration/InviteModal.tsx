import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateInvite } from '../../hooks/useCollaboration';
import type { WorkspaceInvite } from '../../types/collaboration';

type Role = WorkspaceInvite['role'];

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'admin',  label: 'Admin',  description: 'Full access including settings' },
  { value: 'member', label: 'Member', description: 'Can view and manage agents' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

interface Props {
  onClose: () => void;
}

export function InviteModal({ onClose }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: createInvite, isPending, error } = useCreateInvite();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite(
      { email: email.trim(), role },
      {
        onSuccess: (data) => {
          setInviteUrl(data.invite_url);
        },
      },
    );
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="invite-modal-title" className="text-base font-semibold text-oav-text">
            Invite Member
          </h2>
          <button
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close invite modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {inviteUrl ? (
          /* Success state — show generated link */
          <div className="space-y-4">
            <p className="text-sm text-oav-muted">
              Invite link generated. Share it with the recipient.
            </p>
            <div className="flex items-center gap-2 bg-oav-bg border border-oav-border rounded-lg p-3">
              <p className="flex-1 text-xs font-mono text-oav-accent truncate">{inviteUrl}</p>
              <button
                onClick={handleCopy}
                className="text-oav-muted hover:text-oav-text transition-colors shrink-0"
                aria-label="Copy invite link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-oav-success" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {copied && <p className="text-xs text-oav-success">Copied to clipboard!</p>}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-oav-muted block mb-1.5">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                autoFocus
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2.5 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
            </label>

            <fieldset>
              <legend className="text-xs text-oav-muted mb-2">Role</legend>
              <div className="space-y-2">
                {ROLE_OPTIONS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={clsx(
                      'flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                      role === value
                        ? 'border-oav-accent bg-oav-accent/10'
                        : 'border-oav-border hover:border-oav-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-oav-text">{label}</p>
                      <p className="text-xs text-oav-muted">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="text-xs text-oav-error bg-oav-error/10 rounded-lg px-3 py-2" role="alert">
                Failed to create invite. Please try again.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-oav-muted border border-oav-border hover:text-oav-text hover:bg-oav-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
