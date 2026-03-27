// Sprint 7 — SSO configuration form

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useSSOConfig, useUpdateSSOConfig, useDeleteSSOConfig, useTestSSO } from '../../hooks/useSSO';
import type { SSOProviderType, SSOConfigInput } from '../../types/sso';

const PROVIDER_OPTIONS: { value: SSOProviderType; label: string; description: string }[] = [
  { value: 'saml', label: 'SAML 2.0', description: 'Service Provider initiated SSO via XML assertions' },
  { value: 'oidc', label: 'OpenID Connect', description: 'OAuth 2.0 based identity layer (Google, Okta, Azure AD)' },
];

export function SSOConfigForm() {
  const { data: config, isLoading } = useSSOConfig();
  const updateMutation = useUpdateSSOConfig();
  const deleteMutation = useDeleteSSOConfig();
  const testMutation = useTestSSO();

  const [providerType, setProviderType] = useState<SSOProviderType>('saml');
  const [enabled, setEnabled] = useState(false);

  // SAML fields
  const [entityId, setEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [certificate, setCertificate] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');

  // OIDC fields
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [issuer, setIssuer] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setProviderType(config.provider_type);
      setEnabled(config.enabled);
      setEntityId(config.entity_id ?? '');
      setSsoUrl(config.sso_url ?? '');
      setCertificate(config.certificate ?? '');
      setMetadataUrl(config.metadata_url ?? '');
      setClientId(config.client_id ?? '');
      setClientSecret(''); // never prefill secret
      setIssuer(config.issuer ?? '');
    }
  }, [config]);

  const buildInput = (): SSOConfigInput => ({
    provider_type: providerType,
    enabled,
    ...(providerType === 'saml'
      ? { entity_id: entityId, sso_url: ssoUrl, certificate, metadata_url: metadataUrl }
      : { client_id: clientId, client_secret: clientSecret || undefined, issuer }),
  });

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateMutation.mutateAsync(buildInput());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save SSO configuration.');
    }
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  const handleDisable = async () => {
    try {
      await updateMutation.mutateAsync({ ...buildInput(), enabled: false });
      setEnabled(false);
    } catch {
      setSaveError('Failed to disable SSO.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove SSO configuration? This will disable SSO login for your workspace.')) return;
    try {
      await deleteMutation.mutateAsync();
    } catch {
      setSaveError('Failed to remove SSO configuration.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-oav-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading SSO configuration...
      </div>
    );
  }

  const isSaving = updateMutation.isPending;
  const isTesting = testMutation.isPending;

  return (
    <div className="space-y-6" data-testid="sso-config-form">
      {/* Provider type selector */}
      <fieldset>
        <legend className="text-sm font-medium text-oav-text mb-3">Provider Type</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROVIDER_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={providerType === value}
              onClick={() => setProviderType(value)}
              className={clsx(
                'text-left p-4 rounded-xl border-2 transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                providerType === value
                  ? 'border-oav-accent bg-oav-accent/5'
                  : 'border-oav-border bg-oav-surface hover:border-oav-accent/50',
              )}
            >
              <p className="text-sm font-semibold text-oav-text">{label}</p>
              <p className="text-xs text-oav-muted mt-0.5">{description}</p>
            </button>
          ))}
        </div>
      </fieldset>

      {/* SAML fields */}
      {providerType === 'saml' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="sso-entity-id" className="block text-xs text-oav-muted mb-1">
              Entity ID (SP Entity ID)
            </label>
            <input
              id="sso-entity-id"
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="https://your-app.example.com/saml/metadata"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>

          <div>
            <label htmlFor="sso-sso-url" className="block text-xs text-oav-muted mb-1">
              SSO URL (IdP Single Sign-On URL)
            </label>
            <input
              id="sso-sso-url"
              type="url"
              value={ssoUrl}
              onChange={(e) => setSsoUrl(e.target.value)}
              placeholder="https://idp.example.com/sso/saml"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>

          <div>
            <label htmlFor="sso-metadata-url" className="block text-xs text-oav-muted mb-1">
              Metadata URL (optional — auto-populate from IdP)
            </label>
            <input
              id="sso-metadata-url"
              type="url"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              placeholder="https://idp.example.com/saml/metadata"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>

          <div>
            <label htmlFor="sso-certificate" className="block text-xs text-oav-muted mb-1">
              X.509 Certificate (PEM format)
            </label>
            <textarea
              id="sso-certificate"
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              rows={6}
              placeholder="-----BEGIN CERTIFICATE-----&#10;MIIBIjANBgkq...&#10;-----END CERTIFICATE-----"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-xs font-mono text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent resize-y"
            />
          </div>
        </div>
      )}

      {/* OIDC fields */}
      {providerType === 'oidc' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="sso-client-id" className="block text-xs text-oav-muted mb-1">
              Client ID
            </label>
            <input
              id="sso-client-id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="your-client-id"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>

          <div>
            <label htmlFor="sso-client-secret" className="block text-xs text-oav-muted mb-1">
              Client Secret {config?.client_id && <span className="text-oav-accent">(leave blank to keep existing)</span>}
            </label>
            <input
              id="sso-client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={config?.client_id ? '••••••••' : 'your-client-secret'}
              autoComplete="new-password"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>

          <div>
            <label htmlFor="sso-issuer" className="block text-xs text-oav-muted mb-1">
              Issuer URL
            </label>
            <input
              id="sso-issuer"
              type="url"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="https://accounts.google.com"
              className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            />
          </div>
        </div>
      )}

      {/* Enable/disable toggle */}
      <div className="flex items-center justify-between py-3 border-t border-oav-border">
        <div>
          <p className="text-sm font-medium text-oav-text">Enable SSO</p>
          <p className="text-xs text-oav-muted mt-0.5">
            When enabled, users can sign in with their organization identity provider.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle SSO enabled"
          onClick={() => setEnabled((v) => !v)}
          className={clsx(
            'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
            'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
            enabled ? 'bg-oav-accent' : 'bg-oav-border',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      {/* Feedback messages */}
      {saveError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-oav-error">
          <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-oav-success">
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          SSO configuration saved.
        </p>
      )}
      {testMutation.data && (
        <div
          role="status"
          className={clsx(
            'flex items-center gap-1.5 text-sm rounded-lg p-3',
            testMutation.data.success
              ? 'bg-oav-success/10 text-oav-success'
              : 'bg-oav-error/10 text-oav-error',
          )}
        >
          {testMutation.data.success
            ? <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            : <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {testMutation.data.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting || isSaving}
          className={clsx(
            'flex items-center gap-2 text-sm border border-oav-border rounded-lg px-4 py-2 transition-colors',
            'text-oav-muted hover:text-oav-text disabled:opacity-50',
          )}
          aria-label="Test SSO connection"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Shield className="w-4 h-4" aria-hidden="true" />
          )}
          Test Connection
        </button>

        {enabled && (
          <button
            type="button"
            onClick={handleDisable}
            disabled={isSaving}
            className="text-sm text-oav-error border border-oav-error/30 rounded-lg px-4 py-2 hover:bg-oav-error/10 transition-colors disabled:opacity-50"
          >
            Disable SSO
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
          aria-label="Save SSO configuration"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Save Configuration
        </button>

        {config && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-sm text-oav-error hover:underline disabled:opacity-50"
            aria-label="Remove SSO configuration"
          >
            Remove
          </button>
        )}
      </div>

      {/* ACS endpoint info */}
      <details className="mt-2">
        <summary className="flex items-center gap-1.5 text-xs text-oav-muted cursor-pointer hover:text-oav-text select-none">
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          Service Provider endpoints (configure in your IdP)
        </summary>
        <div className="mt-3 space-y-2 pl-5">
          <div>
            <p className="text-xs text-oav-muted mb-0.5">ACS URL (SAML callback)</p>
            <code className="text-xs font-mono text-oav-accent bg-oav-bg px-2 py-1 rounded">
              {window.location.origin}/api/v1/auth/sso/callback/saml
            </code>
          </div>
          <div>
            <p className="text-xs text-oav-muted mb-0.5">Redirect URI (OIDC callback)</p>
            <code className="text-xs font-mono text-oav-accent bg-oav-bg px-2 py-1 rounded">
              {window.location.origin}/api/v1/auth/sso/callback/oidc
            </code>
          </div>
        </div>
      </details>
    </div>
  );
}
