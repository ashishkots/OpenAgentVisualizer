import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Plug, CheckCircle2, XCircle, Activity, Share2, BookOpen, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { IntegrationStatusBadge } from '../ui/IntegrationStatusBadge';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useIntegrationTest, useSaveIntegration } from '../../hooks/useIntegrations';
import type { IntegrationType, IntegrationStatus } from '../../types/integration';

const PRODUCT_META: Record<IntegrationType, { name: string; icon: React.ComponentType<{ className?: string }>; iconColor: string; placeholder: string }> = {
  opentrace:  { name: 'OpenTrace',  icon: Activity,  iconColor: 'text-oav-trace',     placeholder: 'http://opentrace:8000/api'  },
  openmesh:   { name: 'OpenMesh',   icon: Share2,    iconColor: 'text-oav-mesh',      placeholder: 'http://openmesh:8001/api'   },
  openmind:   { name: 'OpenMind',   icon: BookOpen,  iconColor: 'text-oav-knowledge', placeholder: 'http://openmind:8002/api'   },
  openshield: { name: 'OpenShield', icon: Shield,    iconColor: 'text-oav-shield',    placeholder: 'http://openshield:8003/api' },
};

type TestButtonState = 'idle' | 'testing' | 'success' | 'failure';

interface IntegrationConfigCardProps {
  product: IntegrationType;
}

export function IntegrationConfigCard({ product }: IntegrationConfigCardProps) {
  const config = useIntegrationStore((s) => s.configs[product]);
  const testResult = useIntegrationStore((s) => s.testResults[product]);
  const testingProduct = useIntegrationStore((s) => s.testingProduct);

  const [url, setUrl] = useState(config?.base_url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestButtonState>('idle');

  const testMutation = useIntegrationTest();
  const saveMutation = useSaveIntegration();

  const isTesting = testingProduct === product;
  const isDirty =
    url !== (config?.base_url ?? '') ||
    apiKey !== '' ||
    enabled !== (config?.enabled ?? false);

  // Sync saved config changes
  useEffect(() => {
    if (config) {
      setUrl(config.base_url);
      setEnabled(config.enabled);
    }
  }, [config]);

  // Update test button state from result
  useEffect(() => {
    if (isTesting) {
      setTestState('testing');
    } else if (testResult) {
      setTestState(testResult.success ? 'success' : 'failure');
      if (testResult.success) {
        const timer = setTimeout(() => setTestState('idle'), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isTesting, testResult]);

  const handleTest = () => {
    testMutation.mutate({ product, config: { base_url: url, api_key: apiKey, enabled } });
  };

  const handleSave = () => {
    saveMutation.mutate({ product, config: { base_url: url, api_key: apiKey, enabled } });
  };

  const meta = PRODUCT_META[product];
  const ProductIcon = meta.icon;
  const integrationStatus: IntegrationStatus = config?.status ?? 'not_configured';

  const testButtonContent = {
    idle: <><Plug className="w-4 h-4" aria-hidden="true" /> Test Connection</>,
    testing: <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Testing...</>,
    success: <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Connected</>,
    failure: <><XCircle className="w-4 h-4" aria-hidden="true" /> Failed</>,
  };

  const testButtonClass = {
    idle: 'bg-oav-surface border-oav-border text-oav-text hover:bg-oav-surface-hover',
    testing: 'bg-oav-surface border-oav-border text-oav-muted opacity-70 cursor-not-allowed',
    success: 'bg-oav-success/10 border-oav-success/40 text-oav-success',
    failure: 'bg-oav-error/10 border-oav-error/40 text-oav-error',
  };

  return (
    <div
      className="bg-oav-surface border border-oav-border rounded-xl p-5 space-y-4"
      data-testid={`integration-card-${product}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-oav-bg border border-oav-border flex items-center justify-center shrink-0">
          <ProductIcon className={clsx('w-[18px] h-[18px]', meta.iconColor)} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-oav-text">{meta.name}</p>
          <IntegrationStatusBadge status={integrationStatus} />
        </div>
        {/* Toggle */}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${meta.name}`}
          onClick={() => setEnabled((v) => !v)}
          className={clsx(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            'focus-visible:ring-2 focus-visible:ring-oav-accent',
            enabled ? 'bg-oav-accent' : 'bg-oav-border',
          )}
          data-testid={`toggle-${product}`}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      <div className="border-t border-oav-border/50" />

      {/* Base URL */}
      <div className="space-y-1.5">
        <label className="text-xs text-oav-muted font-medium" htmlFor={`${product}-url`}>
          Base URL
        </label>
        <input
          id={`${product}-url`}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={meta.placeholder}
          disabled={!enabled}
          className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm font-mono text-oav-text placeholder:text-oav-muted/50 focus:border-oav-accent focus:ring-1 focus:ring-oav-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid={`${product}-url-input`}
        />
        {testState === 'failure' && testResult?.error && (
          <p className="text-xs text-oav-error mt-1">{testResult.error}</p>
        )}
      </div>

      {/* API Key */}
      <div className="space-y-1.5">
        <label className="text-xs text-oav-muted font-medium" htmlFor={`${product}-key`}>
          API Key
        </label>
        <div className="relative">
          <input
            id={`${product}-key`}
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-••••••••••••"
            autoComplete="off"
            disabled={!enabled}
            className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm font-mono text-oav-text pr-10 placeholder:text-oav-muted/50 focus:border-oav-accent focus:ring-1 focus:ring-oav-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`${product}-key-input`}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-oav-muted hover:text-oav-text transition-colors p-1 focus-visible:ring-2 focus-visible:ring-oav-accent rounded"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            tabIndex={-1}
          >
            {showKey ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleTest}
          disabled={testState === 'testing' || !enabled || !url}
          className={clsx(
            'flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors min-w-[130px] justify-center',
            'focus-visible:ring-2 focus-visible:ring-oav-accent',
            testButtonClass[testState],
          )}
          data-testid={`test-${product}`}
        >
          {testButtonContent[testState]}
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className="bg-oav-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-oav-accent/90 transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-surface disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid={`save-${product}`}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
