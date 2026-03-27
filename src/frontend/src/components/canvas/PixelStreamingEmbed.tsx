import { useEffect, useRef } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { PixelStreamingBridge } from './PixelStreamingBridge';

interface Props {
  signallingUrl: string;    // ws://localhost:8888 or wss://...
  workspaceId: string;
  quality?: 'auto' | 'high' | 'low';
}

const bridge = new PixelStreamingBridge();

export function PixelStreamingEmbed({ signallingUrl, workspaceId, quality = 'auto' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const agents = useAgentStore((s) => s.agents);

  // Push agent state updates to UE5 via data channel
  useEffect(() => {
    if (!channelRef.current || channelRef.current.readyState !== 'open') return;
    channelRef.current.send(bridge.encodeBulkState(Object.values(agents)));
  }, [agents]);

  if (!signallingUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[var(--oav-bg)]">
        <p className="text-[var(--oav-muted)] text-sm">
          Pixel Streaming requires a running UE5 process and signalling server.
        </p>
        <code className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-accent)] px-3 py-2 rounded-lg">
          docker compose --profile pro up signalling-server
        </code>
        <p className="text-[var(--oav-muted)] text-xs">
          Then set <code>OAV_PS_SIGNALLING_URL</code> in your environment.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black"
      data-ps-container
      data-workspace={workspaceId}
    >
      <iframe
        src={`/pixel-streaming/embed?signallingUrl=${encodeURIComponent(signallingUrl)}&quality=${quality}`}
        className="w-full h-full border-0"
        allow="autoplay; camera; microphone"
        title="UE5 Virtual World"
      />
      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => containerRef.current?.requestFullscreen?.()}
          className="text-xs px-2 py-1 rounded bg-black/60 text-white"
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
}
