const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

describe('Codex telemetry middleware', () => {
  it('exports onToolStart, onToolEnd, onToolError', () => {
    const m = require('../middleware/telemetry.js');
    assert.equal(typeof m.onToolStart, 'function');
    assert.equal(typeof m.onToolEnd, 'function');
    assert.equal(typeof m.onToolError, 'function');
  });

  it('onToolStart sets _tool and _start', () => {
    const m = require('../middleware/telemetry.js');
    m.onToolStart({ tool: 'bash' });
    assert.equal(m._tool, 'bash');
    assert.ok(m._start > 0);
  });

  it('plugin.json is valid JSON with required fields', () => {
    const manifest = require('../plugin.json');
    assert.ok(manifest.name);
    assert.ok(manifest.commands);
    assert.ok(manifest.entrypoint);
  });
});
