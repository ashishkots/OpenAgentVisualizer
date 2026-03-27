import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { apiClient } from '../services/api';

type LoginMode = 'credentials' | 'sso';

export function LoginPage() {
  const [email, setEmail] = useState('kotsai@gmail.com');
  const [password, setPassword] = useState('kots@123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // SSO state
  const [mode, setMode] = useState<LoginMode>('credentials');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [ssoError, setSsoError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password });
      localStorage.setItem('oav_token', data.access_token);
      localStorage.setItem('oav_workspace', data.workspace_id);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSORedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = workspaceSlug.trim();
    if (!slug) {
      setSsoError('Please enter your workspace slug.');
      return;
    }
    setSsoError('');
    window.location.href = `/api/v1/auth/sso/${encodeURIComponent(slug)}/login`;
  };

  return (
    <div className="min-h-screen bg-oav-bg flex items-center justify-center px-4">
      <div className="bg-oav-surface border border-oav-border rounded-xl p-8 w-full max-w-md shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-oav-accent/20 text-oav-accent font-bold text-sm shrink-0">
            OAV
          </div>
          <h1 className="text-xl font-bold text-oav-text">OpenAgentVisualizer</h1>
        </div>

        {/* Credentials form */}
        {mode === 'credentials' && (
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in with credentials">
            {error && (
              <p role="alert" className="text-oav-error text-sm">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-oav-muted mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm text-oav-muted mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'w-full bg-oav-accent text-white rounded-lg py-2 font-semibold transition-colors',
                'hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2',
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Sign In
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 border-t border-oav-border" />
              <span className="text-xs text-oav-muted">or</span>
              <div className="flex-1 border-t border-oav-border" />
            </div>

            <button
              type="button"
              onClick={() => { setMode('sso'); setError(''); }}
              className={clsx(
                'w-full flex items-center justify-center gap-2 border border-oav-border rounded-lg py-2 text-sm font-medium',
                'text-oav-muted hover:text-oav-text hover:border-oav-accent/50 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              )}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Sign in with SSO
            </button>
          </form>
        )}

        {/* SSO form */}
        {mode === 'sso' && (
          <form onSubmit={handleSSORedirect} className="space-y-4" aria-label="Sign in with SSO">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setMode('credentials'); setSsoError(''); }}
                className="text-oav-muted hover:text-oav-text transition-colors"
                aria-label="Back to email sign in"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-semibold text-oav-text">Sign in with SSO</p>
            </div>

            <p className="text-sm text-oav-muted">
              Enter your workspace slug to be redirected to your organization's identity provider.
            </p>

            {ssoError && (
              <p role="alert" className="text-oav-error text-sm">
                {ssoError}
              </p>
            )}

            <div>
              <label htmlFor="workspace-slug" className="block text-sm text-oav-muted mb-1">
                Workspace Slug
              </label>
              <input
                id="workspace-slug"
                type="text"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value)}
                placeholder="my-company"
                autoFocus
                required
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              />
              <p className="text-xs text-oav-muted mt-1">
                Your workspace slug can be found in Settings under Workspace.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-oav-accent text-white rounded-lg py-2 font-semibold hover:bg-blue-600 transition-colors"
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Continue with SSO
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
