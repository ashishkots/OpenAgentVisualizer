// src/pixel-streaming/signalling-server/server.test.js
// Run with: node --test server.test.js
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const WebSocket = require('ws');

// Import routing logic directly (extracted from server.js)
const { routeMessage, createPeerRegistry } = require('./server');

describe('signalling server routing', () => {
  it('routes targeted messages to specific peer', () => {
    const peers = createPeerRegistry();
    const sent = [];
    const mockPeer = { send: (msg) => sent.push(JSON.parse(msg)), readyState: WebSocket.OPEN };
    peers.set('peer-2', mockPeer);

    routeMessage(peers, 'peer-1', JSON.stringify({ type: 'offer', to: 'peer-2', sdp: 'test' }));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, 'peer-1');
    assert.equal(sent[0].sdp, 'test');
  });

  it('broadcasts messages when no target specified', () => {
    const peers = createPeerRegistry();
    const sent = [];
    const mockPeer = { send: (msg) => sent.push(JSON.parse(msg)), readyState: WebSocket.OPEN };
    peers.set('peer-1', { send: () => {}, readyState: WebSocket.OPEN }); // sender
    peers.set('peer-2', mockPeer);

    routeMessage(peers, 'peer-1', JSON.stringify({ type: 'ice-candidate' }));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, 'peer-1');
  });
});
