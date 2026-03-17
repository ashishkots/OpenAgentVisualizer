const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavAlerts() {
  try {
    const alerts = await fetch(`${E}/api/alerts?limit=20`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    if (!alerts.length) { console.log('\n⬡ No active alerts\n'); return; }
    console.log(`\n⬡ Active Alerts (${alerts.length}):\n`);
    for (const a of alerts) console.log(`  [${a.severity?.toUpperCase()}] ${a.message}  — ${a.id}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
