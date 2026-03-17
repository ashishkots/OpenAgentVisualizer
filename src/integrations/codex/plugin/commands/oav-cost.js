const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavCost() {
  try {
    const bd = await fetch(`${E}/api/costs/breakdown?period=day`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    console.log(`\n⬡ Cost Breakdown (today):`);
    console.log(`Total: $${(bd.total ?? 0).toFixed(4)}`);
    const byAgent = bd.by_agent ?? {};
    for (const [id, cost] of Object.entries(byAgent).sort(([,a],[,b]) => Number(b) - Number(a)).slice(0, 5))
      console.log(`  ${id}: $${Number(cost).toFixed(4)}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
