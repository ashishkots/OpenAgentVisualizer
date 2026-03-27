import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Copy, Rocket, Plug, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAgentStore } from '../../stores/agentStore';
import { apiClient } from '../../services/api';

// ------------------------------------------------------------------
// Confetti canvas rendered on success
// ------------------------------------------------------------------
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 2,
      r: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const timer = setTimeout(() => cancelAnimationFrame(animId), 3000);
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      aria-hidden="true"
    />
  );
}

// ------------------------------------------------------------------
// Code snippet copy block
// ------------------------------------------------------------------
function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg bg-oav-bg border border-oav-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-oav-border">
        <span className="text-xs text-oav-muted font-medium">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-oav-muted hover:text-oav-text transition-colors min-h-[28px] px-1"
          aria-label={`Copy ${label} snippet`}
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-oav-success" aria-hidden="true" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy</>
          )}
        </button>
      </div>
      <pre className="text-xs text-oav-accent p-3 overflow-x-auto font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

// ------------------------------------------------------------------
// Step indicators
// ------------------------------------------------------------------
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={clsx(
            'h-1.5 rounded-full transition-all duration-300',
            i + 1 === current ? 'w-8 bg-oav-accent' : i + 1 < current ? 'w-4 bg-oav-success' : 'w-4 bg-oav-border',
          )}
        />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Wizard
// ------------------------------------------------------------------
interface Props {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const { completed, complete } = useOnboardingStore();
  const storeAgents = useAgentStore((s) => s.agents);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [verifyState, setVerifyState] = useState<'polling' | 'success' | 'timeout'>('polling');
  const [showConfetti, setShowConfetti] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 30; // 30 × 2s = 60s

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Start polling when on step 3
  useEffect(() => {
    if (step !== 3 || verifyState !== 'polling') return;

    const poll = async () => {
      pollCountRef.current += 1;
      try {
        const res = await apiClient.get<unknown[]>('/api/agents');
        const agents = Array.isArray(res.data) ? res.data : [];
        if (agents.length > 0 || Object.keys(storeAgents).length > 0) {
          stopPolling();
          setVerifyState('success');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          return;
        }
      } catch {
        // ignore — keep polling
      }
      if (pollCountRef.current >= MAX_POLLS) {
        stopPolling();
        setVerifyState('timeout');
      }
    };

    pollIntervalRef.current = setInterval(poll, 2000);
    return () => stopPolling();
  }, [step, verifyState, storeAgents, stopPolling]);

  // If wizard already done, don't show
  if (completed) return null;

  const handleFinish = () => {
    complete();
    onComplete?.();
  };

  const workspaceId = localStorage.getItem('oav_workspace') ?? '';

  const SDK_SNIPPET = `pip install oav-sdk

# In your Python code:
from oav_sdk import OAVClient

client = OAVClient(
    workspace_id="${workspaceId || 'YOUR_WORKSPACE_ID'}",
    api_key="YOUR_API_KEY",
)
client.register_agent(name="my-agent", framework="langchain")`;

  const CURL_SNIPPET = `curl -X POST https://YOUR_DOMAIN/api/agents \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-agent","framework":"langchain","role":"assistant"}'`;

  const OTLP_SNIPPET = `# OTEL Collector config (otel-collector.yaml):
exporters:
  otlphttp:
    endpoint: "https://YOUR_DOMAIN/api/otel"
    headers:
      Authorization: "Bearer YOUR_API_KEY"

service:
  pipelines:
    traces:
      exporters: [otlphttp]`;

  return (
    <>
      {showConfetti && <Confetti />}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="w-full max-w-lg bg-oav-surface border border-oav-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 space-y-4">
            <StepDots current={step} total={3} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-oav-accent/20 flex items-center justify-center shrink-0">
                {step === 1 && <Rocket className="w-5 h-5 text-oav-accent" aria-hidden="true" />}
                {step === 2 && <Plug className="w-5 h-5 text-oav-accent" aria-hidden="true" />}
                {step === 3 && <ShieldCheck className="w-5 h-5 text-oav-accent" aria-hidden="true" />}
              </div>
              <h2 id="onboarding-title" className="text-lg font-bold text-oav-text">
                {step === 1 && 'Welcome to OpenAgentVisualizer'}
                {step === 2 && 'Connect your agents'}
                {step === 3 && 'Verify connection'}
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 pb-8 space-y-5">
            {/* Step 1 — Welcome */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-oav-muted">
                  Your gamified command center for AI agent workflows. Let's get your workspace set up in under a minute.
                </p>
                <label className="block">
                  <span className="text-xs text-oav-muted mb-1 block">Workspace name</span>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. My AI Team"
                    className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2.5 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                    autoFocus
                  />
                </label>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
                >
                  Get Started
                </button>
                <button
                  onClick={handleFinish}
                  className="w-full text-xs text-oav-muted hover:text-oav-text transition-colors py-1"
                >
                  Skip onboarding
                </button>
              </div>
            )}

            {/* Step 2 — Connect */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-oav-muted">
                  Choose how to connect your AI agents. Copy one of the snippets below and run it in your project.
                </p>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  <CodeBlock label="Python SDK" code={SDK_SNIPPET} />
                  <CodeBlock label="REST API (cURL)" code={CURL_SNIPPET} />
                  <CodeBlock label="OTLP / OpenTelemetry" code={OTLP_SNIPPET} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-oav-muted border border-oav-border hover:text-oav-text hover:bg-oav-surface-hover transition-colors min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { setStep(3); setVerifyState('polling'); pollCountRef.current = 0; }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
                  >
                    I've connected — Verify
                  </button>
                </div>
                <button
                  onClick={handleFinish}
                  className="w-full text-xs text-oav-muted hover:text-oav-text transition-colors py-1"
                >
                  Skip for now
                </button>
              </div>
            )}

            {/* Step 3 — Verify */}
            {step === 3 && (
              <div className="space-y-5">
                {verifyState === 'polling' && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-4 border-oav-border" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-oav-accent animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-oav-text">Waiting for your first agent...</p>
                      <p className="text-xs text-oav-muted mt-1">Checking every 2 seconds (60s timeout)</p>
                    </div>
                  </div>
                )}

                {verifyState === 'success' && (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-oav-success/20 flex items-center justify-center">
                      <Check className="w-7 h-7 text-oav-success" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-oav-text">Agent detected!</p>
                      <p className="text-xs text-oav-muted mt-1">Your workspace is live. Let's go!</p>
                    </div>
                    <button
                      onClick={handleFinish}
                      className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}

                {verifyState === 'timeout' && (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <p className="text-sm text-oav-muted">
                      No agent detected yet. You can come back and verify later from the dashboard.
                    </p>
                    <button
                      onClick={handleFinish}
                      className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-oav-accent hover:bg-oav-accent/80 transition-colors min-h-[44px]"
                    >
                      Skip for now
                    </button>
                  </div>
                )}

                {verifyState === 'polling' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-oav-muted border border-oav-border hover:text-oav-text hover:bg-oav-surface-hover transition-colors min-h-[44px]"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFinish}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-oav-muted border border-oav-border hover:text-oav-text hover:bg-oav-surface-hover transition-colors min-h-[44px]"
                    >
                      Skip for now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
