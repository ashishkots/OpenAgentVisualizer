// Sprint 7 — API Documentation page

import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'API Docs' },
];

type SdkTab = 'python' | 'typescript' | 'curl';

const SDK_EXAMPLES: Record<SdkTab, string> = {
  python: `import requests

BASE_URL = "https://your-instance.oav.io"
API_KEY  = "oav_sk_..."

# List agents
response = requests.get(
    f"{BASE_URL}/api/v1/agents",
    headers={"Authorization": f"Bearer {API_KEY}"},
)
agents = response.json()

# Create a webhook
webhook = requests.post(
    f"{BASE_URL}/api/v1/webhooks",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "name": "My Webhook",
        "url": "https://example.com/hooks/oav",
        "events": ["agent.status_changed", "alert.triggered"],
    },
).json()

print(f"Webhook created: {webhook['id']}")
print(f"Secret (save this!): {webhook['secret']}")`,

  typescript: `import axios from "axios";

const api = axios.create({
  baseURL: "https://your-instance.oav.io",
  headers: { Authorization: \`Bearer \${process.env.OAV_API_KEY}\` },
});

// List agents
const { data: agents } = await api.get("/api/v1/agents");

// Create a webhook
const { data: webhook } = await api.post("/api/v1/webhooks", {
  name: "My Webhook",
  url: "https://example.com/hooks/oav",
  events: ["agent.status_changed", "alert.triggered"],
});

console.log("Webhook ID:", webhook.id);
console.log("Secret (save this!):", webhook.secret);

// Verify incoming webhook signature
import { createHmac } from "crypto";

function verifySignature(secret: string, payload: string, signature: string): boolean {
  const expected = \`sha256=\${createHmac("sha256", secret).update(payload).digest("hex")}\`;
  return expected === signature;
}`,

  curl: `# Set your API key
API_KEY="oav_sk_..."
BASE_URL="https://your-instance.oav.io"

# List agents
curl -s "$BASE_URL/api/v1/agents" \\
  -H "Authorization: Bearer $API_KEY" | jq .

# Create a webhook
curl -s -X POST "$BASE_URL/api/v1/webhooks" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Webhook",
    "url": "https://example.com/hooks/oav",
    "events": ["agent.status_changed", "alert.triggered"]
  }' | jq .

# Send a test delivery
curl -s -X POST "$BASE_URL/api/v1/webhooks/{id}/test" \\
  -H "Authorization: Bearer $API_KEY" | jq .

# Browse plugin registry
curl -s "$BASE_URL/api/v1/plugins/registry?search=slack" \\
  -H "Authorization: Bearer $API_KEY" | jq .`,
};

const CHANGELOG = [
  {
    version: 'v1.7.0',
    date: '2026-03-27',
    changes: [
      'Added webhook system with HMAC-SHA256 signing and retry delivery',
      'Added plugin registry, install, enable/disable endpoints',
      'Added SSO (SAML 2.0 + OIDC) login and configuration endpoints',
      'Added multi-organization endpoints with member management',
      'Added cross-workspace agent sharing',
      'Added X-API-Version response header on all endpoints',
      'Added /api/v1/ prefix aliases for all existing endpoints',
    ],
  },
  {
    version: 'v1.6.0',
    date: '2026-02-15',
    changes: [
      'Added SSO configuration endpoints',
      'Added organization creation and member invite',
      'Added API key management endpoints',
      'Added integration config test endpoint',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-01-20',
    changes: [
      'Added gamification: achievements, XP, levels, quests, challenges',
      'Added tournament bracket system',
      'Added team management endpoints',
      'Added skill tree progression',
    ],
  },
];

type DocsTab = 'interactive' | 'sdk' | 'changelog';

const DOCS_TABS: { value: DocsTab; label: string }[] = [
  { value: 'interactive', label: 'Interactive Docs' },
  { value: 'sdk',         label: 'SDK Snippets'     },
  { value: 'changelog',   label: 'Changelog'        },
];

const SDK_TABS: { value: SdkTab; label: string }[] = [
  { value: 'python',     label: 'Python'     },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'curl',       label: 'cURL'       },
];

export function ApiDocsPage() {
  const [docsTab, setDocsTab]   = useState<DocsTab>('interactive');
  const [sdkTab, setSdkTab]     = useState<SdkTab>('python');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(SDK_EXAMPLES[sdkTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="flex flex-col h-full" data-testid="api-docs-page">
      {/* Fixed header area */}
      <div className="px-6 py-4 border-b border-oav-border bg-oav-surface/50 shrink-0 space-y-3">
        <Breadcrumb items={BREADCRUMB} />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-oav-text">API Documentation</h1>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-oav-accent hover:underline"
            aria-label="Open Swagger UI in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Open in new tab
          </a>
        </div>

        {/* Primary tab bar */}
        <div
          className="flex gap-1 bg-oav-bg rounded-lg p-1 border border-oav-border"
          role="tablist"
          aria-label="API documentation sections"
        >
          {DOCS_TABS.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={docsTab === value}
              onClick={() => setDocsTab(value)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                docsTab === value
                  ? 'bg-oav-accent text-white'
                  : 'text-oav-muted hover:text-oav-text',
              )}
              data-testid={`api-docs-tab-${value}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Interactive Docs (Swagger iframe) */}
        {docsTab === 'interactive' && (
          <iframe
            src="/docs"
            title="OpenAgentVisualizer API — Swagger UI"
            className="flex-1 border-0 w-full h-full"
            aria-label="Swagger API documentation"
          />
        )}

        {/* SDK Snippets */}
        {docsTab === 'sdk' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-oav-text mb-1">SDK Code Snippets</h2>
              <p className="text-sm text-oav-muted">
                Ready-to-run examples for common API operations. Replace{' '}
                <code className="text-xs font-mono bg-oav-surface px-1 rounded">oav_sk_...</code>{' '}
                with your actual API key from Settings.
              </p>
            </div>

            {/* SDK language tabs */}
            <div
              className="flex gap-1 bg-oav-bg rounded-lg p-1 border border-oav-border w-fit"
              role="tablist"
              aria-label="SDK language"
            >
              {SDK_TABS.map(({ value, label }) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={sdkTab === value}
                  onClick={() => setSdkTab(value)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    sdkTab === value
                      ? 'bg-oav-accent text-white'
                      : 'text-oav-muted hover:text-oav-text',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Code block */}
            <div className="relative">
              <button
                onClick={handleCopySnippet}
                className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-oav-muted hover:text-oav-text border border-oav-border bg-oav-surface rounded-md px-2.5 py-1.5 transition-colors z-10"
                aria-label="Copy code snippet"
              >
                {copiedSnippet
                  ? <><CheckCircle className="w-3.5 h-3.5 text-oav-success" aria-hidden="true" /> Copied</>
                  : <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy</>
                }
              </button>
              <pre
                className="bg-oav-surface border border-oav-border rounded-xl p-5 text-xs font-mono text-oav-text overflow-x-auto leading-relaxed"
                tabIndex={0}
                aria-label={`${sdkTab} code snippet`}
              >
                {SDK_EXAMPLES[sdkTab]}
              </pre>
            </div>

            {/* Quick links */}
            <div className="bg-oav-surface border border-oav-border rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-oav-text">Useful links</p>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-oav-accent hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    Swagger UI (full interactive reference)
                  </a>
                </li>
                <li>
                  <a
                    href="/openapi.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-oav-accent hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    OpenAPI JSON spec
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Changelog */}
        {docsTab === 'changelog' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-oav-text mb-1">API Changelog</h2>
              <p className="text-sm text-oav-muted">
                Version history and breaking changes for the OpenAgentVisualizer REST API.
              </p>
            </div>

            {CHANGELOG.map(({ version, date, changes }) => (
              <section key={version} aria-labelledby={`changelog-${version}`}>
                <div className="flex items-baseline gap-3 mb-3">
                  <h3
                    id={`changelog-${version}`}
                    className="text-sm font-semibold text-oav-text"
                  >
                    {version}
                  </h3>
                  <time
                    dateTime={date}
                    className="text-xs text-oav-muted"
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <ul className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden divide-y divide-oav-border/50">
                  {changes.map((change, i) => (
                    <li key={i} className="px-4 py-2.5 text-sm text-oav-muted flex items-start gap-2.5">
                      <span className="text-oav-accent shrink-0 mt-0.5" aria-hidden="true">+</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
