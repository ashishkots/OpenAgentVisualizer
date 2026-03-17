// src/pixel-streaming/signalling-server/server.js
// Minimal WebRTC signalling server for UE5 Pixel Streaming.
// Based on Epic's reference implementation, stripped to essentials.
const WebSocket = require('ws');

function createPeerRegistry() { return new Map(); }

function routeMessage(peers, fromId, raw) {
  try {
    const msg = JSON.parse(raw.toString());
    if (msg.to && peers.has(msg.to)) {
      // Route to specific peer
      peers.get(msg.to).send(JSON.stringify({ ...msg, from: fromId }));
    } else {
      // Broadcast to all other peers (UE5 peer discovery)
      for (const [pid, peer] of peers) {
        if (pid !== fromId && peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ ...msg, from: fromId }));
        }
      }
    }
  } catch { /* ignore parse errors */ }
}

// Only start server when run directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT ?? 8888;
  const peers = createPeerRegistry();
  const wss = new WebSocket.Server({ port: PORT });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    peers.set(id, ws);
    ws.send(JSON.stringify({ type: 'config', peerConnectionOptions: {} }));
    ws.on('message', (raw) => routeMessage(peers, id, raw));
    ws.on('close', () => peers.delete(id));
  });

  console.log(`OAV Pixel Streaming signalling server listening on :${PORT}`);
}

module.exports = { createPeerRegistry, routeMessage };
