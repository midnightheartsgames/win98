const HEAVY = ['praetorian', 'legionary', 'triarii', 'princeps', 'hastati', 'auxilia', 'levyspear', 'togamilitia'];
const SKIRM = ['velites', 'javelinmen'];
const CAV = ['auxcav', 'westnobles', 'westlc'];
const SHARE = [['heavy', 0.5], ['skirm', 0.2], ['cav', 0.2], ['bow', 0.1]];

function stageArmy(L, lv, seed) {
  const before = L.LEVELS.slice(0, lv.n - 1);
  const unlocked = new Set(L.START_UNLOCKED);
  let glory = 0;
  for (const o of before) {
    for (const k of o.unlocks || []) unlocked.add(k);
    glory += o.reward.glory * 1.1;
  }
  const budget = 300 + glory * 0.7;
  const count = Math.min(lv.cap, 16, Math.round(4 + lv.n / 2.5)) - 1;
  const best = list => list.find(k => unlocked.has(k));
  const pools = {
    heavy: HEAVY.filter(k => unlocked.has(k)),
    skirm: SKIRM.filter(k => unlocked.has(k)),
    cav: CAV.filter(k => unlocked.has(k)),
    bow: unlocked.has('auxarchers') ? ['auxarchers'] : SKIRM.filter(k => unlocked.has(k))
  };
  const slots = [];
  for (const [role, share] of SHARE) {
    const n = Math.max(role === 'heavy' ? 1 : 0, Math.round(count * share));
    for (let i = 0; i < n; i++) slots.push(role);
  }
  while (slots.length < count) slots.push('heavy');
  slots.length = count;
  if (unlocked.has('elephant') && count >= 10) slots[slots.length - 1] = 'ele';
  let left = budget;
  const keys = [];
  slots.forEach((role, i) => {
    const pool = role === 'ele' ? ['elephant'] : pools[role];
    const tier = pool.find(k => L.UNITS[k].cost <= left / Math.max(1, count - i) * 1.6) || pool[pool.length - 1] || best(HEAVY);
    left -= L.UNITS[tier].cost;
    keys.push(tier);
  });
  const vet = L.clamp(1 + Math.floor((lv.n - 1) / 5), 1, L.MAX_LEVEL);
  const p = L.Army.newProfile('Эталон', 1);
  p.squads = [];
  const legate = L.Army.addSquad(p, 'legate');
  L.Army.autoSkills(legate, vet, L.rng(seed * 31));
  keys.forEach((k, i) => {
    const sq = L.Army.addSquad(p, k);
    L.Army.autoSkills(sq, Math.max(1, vet - (i % 2 ? 2 : 0)), L.rng(seed * 31 + i + 1));
  });
  p.unlocked = Array.from(unlocked);
  return p;
}

module.exports = stageArmy;
