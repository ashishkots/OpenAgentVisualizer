const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavWatch() {
  console.log('\n⬡ OAV live event stream (Ctrl+C to stop)\n');
  try {
    const http = require('http');
    const url = new URL(`${E}/api/events/stream`);
    http.get({ host: url.hostname, port: url.port || 8000, path: url.pathname, headers: { Authorization: `Bearer ${K}` } }, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter((l) => l.startsWith('data:'));
        for (const line of lines) {
          try { const evt = JSON.parse(line.slice(5)); console.log(`  [${evt.type}] ${evt.agent_id} — ${JSON.stringify(evt.data)}`); }
          catch { /* ignore parse errors */ }
        }
      });
    }).on('error', (e) => console.error(`OAV stream error: ${e.message}`));
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
