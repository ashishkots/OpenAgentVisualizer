import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { FallbackBanner } from '../components/ui/FallbackBanner';
import { PixelStreamViewer } from '../components/world3d/PixelStreamViewer';
import { SlideInPanel } from '../components/ui/SlideInPanel';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { useAgentStore } from '../stores/agentStore';
import type { Agent } from '../types/agent';
import type { UE5ConnectionState } from '../types/ue5';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: '3D World' }];
const UE5_SIGNALING_URL = import.meta.env.VITE_UE5_SIGNALING_URL || 'ws://localhost:8889/ws/ue5';
const UE5_ENABLED = import.meta.env.VITE_UE5_ENABLED !== 'false';
const GUIDE_KEY = 'oav_3d_guide_shown';
const FALLBACK_KEY = 'oav_fallback_banner_dismissed';

export function World3DPage() {
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState<UE5ConnectionState>('idle');
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agents = useAgentStore((s) => s.agents);
  const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;

  // Desktop-only guard
  useEffect(() => {
    if (window.innerWidth < 768) {
      navigate('/world', { replace: true });
    }
  }, [navigate]);

  // Show controls guide on first visit
  useEffect(() => {
    if (!localStorage.getItem(GUIDE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  const handleDismissGuide = () => {
    localStorage.setItem(GUIDE_KEY, 'true');
    setShowGuide(false);
  };

  const handleConnectionChange = (state: UE5ConnectionState) => {
    setConnectionState(state);
  };

  const handleFallback = () => {
    const dismissed = sessionStorage.getItem(FALLBACK_KEY);
    if (!dismissed) setShowFallbackBanner(true);
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem(FALLBACK_KEY, 'true');
    setShowFallbackBanner(false);
  };

  const isFallback = connectionState === 'fallback' || !UE5_ENABLED;

  return (
    <div className="flex flex-col h-full relative" data-testid="world3d-page">
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 z-30">
        <Breadcrumb items={BREADCRUMB} />
        {/* 2D/3D Toggle */}
        <div className="inline-flex rounded-lg overflow-hidden border border-oav-border bg-oav-surface">
          <Link
            to="/world"
            className="px-3 py-1.5 text-xs font-medium transition-colors text-oav-muted hover:text-oav-text"
            data-testid="toggle-2d"
          >
            <Globe className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            2D
          </Link>
          <span className="px-3 py-1.5 text-xs font-medium bg-oav-accent text-white">
            <Box className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            3D
          </span>
        </div>
      </div>

      {/* Fallback banner */}
      {showFallbackBanner && (
        <FallbackBanner
          productName="3D Viewer"
          variant="3d"
          dismissible
          onDismiss={handleDismissBanner}
          className="mx-4 mb-2"
        />
      )}

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {!isFallback && UE5_ENABLED ? (
          <PixelStreamViewer
            signalingUrl={UE5_SIGNALING_URL}
            onConnectionChange={handleConnectionChange}
            onAgentSelect={setSelectedAgentId}
            onFallback={handleFallback}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-oav-muted text-sm">
            2D canvas fallback (WorldCanvas)
          </div>
        )}

        {/* Controls guide overlay (first visit) */}
        {showGuide && (
          <div
            className="absolute inset-0 flex items-center justify-center z-40 bg-oav-bg/50 backdrop-blur-sm"
            data-testid="controls-guide"
          >
            <div className="bg-oav-surface-elevated border border-oav-border rounded-xl p-6 shadow-xl max-w-xs w-full mx-4">
              <h2 className="text-sm font-semibold text-oav-text mb-4">3D Controls</h2>
              <dl className="space-y-2 text-xs">
                {[
                  { key: 'WASD', desc: 'Move camera' },
                  { key: 'Mouse', desc: 'Look around' },
                  { key: 'Scroll', desc: 'Zoom in / out' },
                  { key: 'Click', desc: 'Select agent' },
                  { key: 'Esc', desc: 'Deselect' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex gap-3">
                    <dt className="font-mono text-oav-3d w-16 shrink-0">{key}</dt>
                    <dd className="text-oav-muted">{desc}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={handleDismissGuide}
                className="mt-5 w-full bg-oav-accent text-white rounded-lg py-2 text-sm font-medium hover:bg-oav-accent/90 transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-surface-elevated"
                data-testid="dismiss-guide"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Agent detail slide-in panel */}
      <SlideInPanel
        open={!!selectedAgent}
        onClose={() => setSelectedAgentId(null)}
        title={selectedAgent?.name ?? 'Agent Details'}
        width="320"
        data-testid="agent-sidebar-3d"
      >
        {selectedAgent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AgentAvatar name={selectedAgent.name} level={selectedAgent.level} status={selectedAgent.status} size="lg" />
              <div>
                <p className="text-sm font-semibold text-oav-text">{selectedAgent.name}</p>
                <StatusBadge status={selectedAgent.status} />
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-oav-muted">Level</span>
                <span className="text-oav-text font-medium">{selectedAgent.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-oav-muted">XP</span>
                <span className="text-oav-text font-medium tabular-nums">
                  {selectedAgent.xp_total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-oav-muted">Role</span>
                <span className="text-oav-text font-medium">{selectedAgent.role}</span>
              </div>
            </div>
            <Link
              to={`/agents/${selectedAgent.id}`}
              className="block text-center text-sm text-oav-accent hover:underline"
              data-testid="view-full-profile"
            >
              View Full Profile →
            </Link>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
