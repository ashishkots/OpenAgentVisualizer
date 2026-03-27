import { useEffect, useRef, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import type { UE5ConnectionState, CameraMode, UE5StreamStats } from '../../types/ue5';

const CONNECTION_TIMEOUT_MS = 3000;

interface ConnectionStep {
  label: string;
  progress: number;
}

const CONNECTION_STEPS: ConnectionStep[] = [
  { label: 'Establishing WebRTC session', progress: 20 },
  { label: 'Exchanging SDP...', progress: 45 },
  { label: 'ICE negotiation...', progress: 70 },
  { label: 'Starting video stream...', progress: 90 },
];

interface PixelStreamViewerProps {
  signalingUrl: string;
  onConnectionChange?: (state: UE5ConnectionState) => void;
  onAgentSelect?: (agentId: string) => void;
  onFallback?: () => void;
}

export function PixelStreamViewer({
  signalingUrl,
  onConnectionChange,
  onAgentSelect,
  onFallback,
}: PixelStreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  const [connectionState, setConnectionState] = useState<UE5ConnectionState>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [streamStats, setStreamStats] = useState<UE5StreamStats>({
    fps: null,
    ping_ms: null,
    agent_count: 0,
    camera_mode: 'free',
  });
  const [selectedCameraMode, setSelectedCameraMode] = useState<CameraMode>('free');
  const [retryCountdown, setRetryCountdown] = useState(0);

  const updateState = useCallback((state: UE5ConnectionState) => {
    setConnectionState(state);
    onConnectionChange?.(state);
  }, [onConnectionChange]);

  const handleFallback = useCallback(() => {
    updateState('fallback');
    onFallback?.();
    cleanup();
  }, [updateState, onFallback]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    wsRef.current?.close();
    peerRef.current?.close();
    peerRef.current = null;
    wsRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    updateState('connecting');
    setStepIndex(0);

    timeoutRef.current = setTimeout(() => {
      handleFallback();
    }, CONNECTION_TIMEOUT_MS);

    try {
      // Advance steps for visual feedback
      const stepTimer = setInterval(() => {
        setStepIndex((prev) => {
          if (prev < CONNECTION_STEPS.length - 1) return prev + 1;
          clearInterval(stepTimer);
          return prev;
        });
      }, CONNECTION_TIMEOUT_MS / CONNECTION_STEPS.length);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          clearTimeout(timeoutRef.current!);
          clearInterval(stepTimer);
          updateState('connected');
          // Fade out overlay
          animateSafe(() => {
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, onComplete: () => {
              if (overlayRef.current) overlayRef.current.style.display = 'none';
            }});
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          if (retryCountRef.current < MAX_RETRIES) {
            updateState('reconnecting');
            scheduleRetry();
          } else {
            handleFallback();
          }
        }
      };

      const ws = new WebSocket(signalingUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'answer') {
          await pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
        } else if (msg.type === 'ice_candidate') {
          await pc.addIceCandidate(msg.candidate);
        } else if (msg.type === 'world_stats') {
          setStreamStats((prev) => ({ ...prev, ...msg.payload }));
        } else if (msg.type === 'agent_selected') {
          onAgentSelect?.(msg.payload.agent_id);
        } else if (msg.type === 'ping') {
          const start = Date.now();
          ws.send(JSON.stringify({ type: 'pong', payload: msg.payload }));
          setStreamStats((prev) => ({ ...prev, ping_ms: Date.now() - start }));
        }
      };

      ws.onerror = () => {
        handleFallback();
      };
    } catch {
      handleFallback();
    }
  }, [signalingUrl, updateState, handleFallback, onAgentSelect]);

  const scheduleRetry = useCallback(() => {
    retryCountRef.current += 1;
    let countdown = 8;
    setRetryCountdown(countdown);
    const interval = setInterval(() => {
      countdown -= 1;
      setRetryCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        connect();
      }
    }, 1000);
  }, [connect]);

  useEffect(() => {
    connect();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendCameraMode = (mode: CameraMode) => {
    setSelectedCameraMode(mode);
    wsRef.current?.send(JSON.stringify({ type: 'camera_mode_changed', payload: { mode } }));
  };

  const getFpsClass = (fps: number | null) => {
    if (fps === null) return 'text-oav-muted';
    if (fps >= 28) return 'text-oav-success';
    if (fps >= 15) return 'text-oav-warning';
    return 'text-oav-error';
  };

  const getPingClass = (ping: number | null) => {
    if (ping === null) return 'text-oav-muted';
    if (ping <= 100) return 'text-oav-success';
    if (ping <= 250) return 'text-oav-warning';
    return 'text-oav-error';
  };

  const currentStep = CONNECTION_STEPS[stepIndex] ?? CONNECTION_STEPS[0];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" data-testid="pixel-stream-viewer">
      {/* WebRTC video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        aria-label="3D world stream"
      />

      {/* Connecting overlay */}
      {(connectionState === 'connecting' || connectionState === 'idle') && (
        <div
          ref={overlayRef}
          className="absolute inset-0 flex flex-col items-center justify-center bg-oav-bg/95 backdrop-blur-sm z-30"
          data-testid="ue5-connecting-overlay"
        >
          <div className="w-12 h-12 rounded-full border-4 border-oav-border border-t-oav-3d animate-spin mb-4" />
          <p className="text-sm font-medium text-oav-text mb-1">Connecting to 3D server...</p>
          <p className="text-xs text-oav-muted">{currentStep.label}</p>
          <div className="mt-4 w-48 h-1 bg-oav-border rounded-full overflow-hidden">
            <div
              className="h-full bg-oav-3d rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reconnecting overlay */}
      {connectionState === 'reconnecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-oav-bg/70 backdrop-blur-md z-30">
          <div className="bg-oav-surface-elevated border border-oav-border rounded-xl p-6 flex flex-col items-center gap-4 shadow-xl max-w-xs w-full mx-4">
            <div className="w-10 h-10 rounded-full border-4 border-oav-border border-t-oav-warning animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-oav-text">Reconnecting to 3D server...</p>
              <p className="text-xs text-oav-muted mt-1">
                Retrying in {retryCountdown}s... (attempt {retryCountRef.current} of {MAX_RETRIES})
              </p>
            </div>
            <button
              onClick={handleFallback}
              className="text-sm text-oav-accent hover:underline focus-visible:ring-2 focus-visible:ring-oav-accent rounded"
              data-testid="switch-to-2d"
            >
              Switch to 2D view
            </button>
          </div>
        </div>
      )}

      {/* Status bar (bottom overlay, visible when connected) */}
      {connectionState === 'connected' && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-4 bg-oav-surface/80 backdrop-blur-sm border border-oav-border rounded-xl px-4 py-2 text-xs text-oav-muted">
          <select
            value={selectedCameraMode}
            onChange={(e) => sendCameraMode(e.target.value as CameraMode)}
            className="bg-transparent text-oav-text text-xs font-medium border-none outline-none cursor-pointer appearance-none hover:text-oav-accent transition-colors"
            aria-label="Camera mode"
            data-testid="camera-mode-select"
          >
            <option value="free">Free Camera</option>
            <option value="overview">Overview</option>
            <option value="follow_agent">Follow Agent</option>
          </select>
          <span className="w-px h-3 bg-oav-border" />
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span className="text-oav-text font-semibold tabular-nums">{streamStats.agent_count}</span>
            <span>agents</span>
          </span>
          <span className="flex items-center gap-1">
            <span>FPS:</span>
            <span className={clsx('font-semibold tabular-nums', getFpsClass(streamStats.fps))}>
              {streamStats.fps ?? '—'}
            </span>
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <span>Ping:</span>
            <span className={clsx('font-semibold tabular-nums', getPingClass(streamStats.ping_ms))}>
              {streamStats.ping_ms ?? '—'}
            </span>
            <span>ms</span>
          </span>
        </div>
      )}
    </div>
  );
}
