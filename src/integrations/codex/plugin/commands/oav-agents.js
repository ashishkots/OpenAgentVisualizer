const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavAgents() {
  try {
    const agents = await fetch(`${E}/api/agents?workspace_id=default`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    console.log('\n⬡ Agents:\n');
    for (const a of agents) console.log(`  ${a.status === 'working' ? '●' : a.status === 'error' ? '✕' : '○'} ${a.name} (${a.id})  XP: ${a.xp ?? 0}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
