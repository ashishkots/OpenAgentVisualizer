const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
const h = { Authorization: `Bearer ${K}` };

module.exports = async function oavStatus() {
  try {
    const [metrics, alerts] = await Promise.all([
      fetch(`${E}/api/dashboard/metrics?period=day`, { headers: h }).then(r => r.json()),
      fetch(`${E}/api/alerts?limit=5`, { headers: h }).then(r => r.json()),
    ]);
    console.log(`\n⬡ OpenAgentVisualizer — Workspace Status`);
    console.log(`Agents: ${metrics.agent_count ?? 0}  |  Cost today: $${(metrics.total_cost ?? 0).toFixed(2)}  |  Tokens: ${(metrics.total_tokens ?? 0).toLocaleString()}`);
    if (alerts.length) console.log(`Active alerts: ${alerts.length} (run /oav alerts to triage)`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
