const fs = require('fs');
const path = require('path');

const BAD = /undefined|NaN|null|\[object/;

function plainBattle(H, o, n, team, grp) {
  const g = new H.Game({ seed: 100 + n });
  g.script = null; g.pending = null; g.cg = null; g.events.length = 0;
  if (o.mcPath) g.state.mcPath = o.mcPath;
  for (const k of team) if (!g.state.roster[k]) g.debugChar(k, o.lvl || 60, 0, 0);
  return new H.Battle({ party: g.fhSpecs(team), seed: 1 + n, waves: [grp.map(id => id + ':' + (o.foeLvl || 50))], lvl: o.foeLvl || 50, su: o.su || null });
}

function modeGame(H, n, team) {
  const g = new H.Game({ seed: 300 + n });
  g.script = null; g.pending = null; g.cg = null; g.events.length = 0;
  for (const k of team) if (!g.state.roster[k]) g.debugChar(k, 80, 0, 0);
  return g;
}

function pfBattle(H, n, team) {
  return new H.Battle(modeGame(H, n, team).pfOpts(1 + (n % 4), n % 2, team, 1 + n));
}

function cwBattle(H, n) {
  const g = modeGame(H, n, []), r = g.cwNew({ tier: n % 3, seed: 7 + n });
  for (const z of ['on', 'off', 'bench']) r.board[z].fill(null);
  r.envPick = null;
  const ids = Object.keys(r.pool).filter(id => r.pool[id] >= 3).sort();
  const put = (z, i, id, star) => { r.board[z][i] = { uid: ++r.uid, id, star }; r.pool[id] -= Math.pow(3, star - 1); };
  for (let i = 0; i < 4; i++) put('on', i, ids[(n * 6 + i) % ids.length], i === 0 ? 2 : 1);
  for (let i = 0; i < 2; i++) put('off', i, ids[(n * 6 + 4 + i) % ids.length], 1);
  const fights = r.nodes.map((k, i) => i).filter(i => r.nodes[i] === 'fight' || r.nodes[i] === 'boss');
  Object.assign(r, { lvl: 6, exp: 9, gold: 23, streak: 2, hp: 82, node: fights[n % fights.length] });
  return g.cwFight();
}

function audit(H, o = {}) {
  const kits = o.kits || Object.keys(H.CHARS).filter(k => k !== 'trail_p');
  const foes = o.foes || Object.keys(H.ENEMIES).filter(id => !H.ENEMIES[id].proto);
  const seen = new Map(), problems = new Map(), odd = new Map();
  let battles = 0, steps = 0;
  const note = (map, key, sample) => { const r = map.get(key); if (r) r.n++; else map.set(key, { n: 1, sample }); };
  const check = (b, u) => {
    const st = H.BD.statuses(u, b);
    for (const g of ['buff', 'debuff', 'other']) {
      for (const r of st[g]) {
        const key = (u.side === 'enemy' ? 'foe' : 'ally') + ' | ' + g + ' | ' + r.kind + ' | ' + (r.s || '') + ' | ' + r.name;
        note(seen, key, r.text);
        if (!r.text || BAD.test(r.text) || BAD.test(r.right || '') || BAD.test(r.name)) note(problems, key, (r.text || '(нет текста)') + ' / ' + (r.right || ''));
      }
    }
    for (const x of u.buffs) {
      if (!x.v || !H.BD.STAT[x.s]) continue;
      const harm = H.BD.hurts(x), key = (u.side === 'enemy' ? 'foe' : 'ally') + ' | ' + x.s + ' | ' + x.name;
      if (harm && !x.debuff && !x.perm) note(odd, key, 'вредит владельцу без debuff, его снимет «Усиление снято» (v ' + x.v + ')');
      if (!harm && x.debuff) note(odd, key, 'помогает владельцу, а помечен debuff (v ' + x.v + ')');
    }
  };
  const teams = [];
  for (let i = 0; i < kits.length; i += 4) teams.push([0, 1, 2, 3].map(j => kits[(i + j) % kits.length]));
  const groups = [];
  for (let i = 0; i < foes.length; i += 2) groups.push([foes[i], foes[(i + 1) % foes.length]]);
  const runs = o.runs || teams.length * 4;
  for (let n = 0; n < Math.min(runs, o.max || 1e9); n++) {
    const team = teams[n % teams.length], grp = groups[(n * 7) % groups.length];
    let b;
    try { b = o.make ? o.make(n, team) : plainBattle(H, o, n, team, grp); b.start(); } catch (e) { note(problems, 'start | ' + (o.mode || '') + ' | ' + team.join(',') + ' | ' + grp.join(','), String(e && e.message)); continue; }
    battles++;
    for (let s = 0; s < (o.steps || 1500) && !b.over; s++) {
      try { b.autoStep(); b.drain(); } catch (e) { note(problems, 'step | ' + team.join(',') + ' | ' + grp.join(','), String(e && e.message)); break; }
      steps++;
      if (b.phase !== 'input') continue;
      for (const u of [...b.allies, ...b.enemies]) {
        try { check(b, u); } catch (e) { note(problems, 'model | ' + u.name, String(e && e.stack).split('\n').slice(0, 2).join(' ')); }
      }
    }
  }
  return { battles, steps, seen, problems, odd };
}

function staticKeys(root) {
  const keys = new Set();
  for (const f of fs.readdirSync(path.join(root, 'js/apps/hsr98'))) {
    if (!f.endsWith('.js') || f.includes('pix')) continue;
    const s = fs.readFileSync(path.join(root, 'js/apps/hsr98', f), 'utf8');
    for (const m of s.matchAll(/\{[^{}]{0,260}?\bs: '([A-Za-z]+)'[^{}]{0,260}?\}/g)) if (/\b(turns|v):/.test(m[0])) keys.add(m[1]);
  }
  return [...keys].sort();
}

function uncovered(H, keys) {
  return keys.filter(k => !H.BD.STAT[k] && !H.BD.MARK[k]);
}

function modes(H, quick) {
  const n = quick ? 2 : 8, out = [];
  for (const path of Object.keys(H.SU.PATHS)) {
    const bless = H.SU.BLESSINGS.filter(d => d.path === path).map(d => ({ id: d.id, lvl: 2 }));
    out.push({ mode: 'su ' + path, su: { path, bless, curios: H.SU.CURIOS.map(d => ({ id: d.id })) }, runs: n, max: n, lvl: 60, foeLvl: 70 });
  }
  out.push({ mode: 'pf', kits: ['himeko', 'herta', 'asta', 'natasha', 'serval', 'bailu', 'kafka', 'pela', 'sampo', 'qingque', 'jingliu', 'seele'], make: (i, team) => pfBattle(H, i, team), runs: n * 3, max: n * 3 });
  out.push({ mode: 'cw', make: i => cwBattle(H, i), runs: n * 3, max: n * 3 });
  return out;
}

function auditAll(H, o = {}) {
  const a = audit(H, { max: o.quick ? 40 : 1e9, runs: o.quick ? 40 : 640 });
  const merge = r => {
    a.battles += r.battles; a.steps += r.steps;
    for (const [k, v] of r.seen) if (!a.seen.has(k)) a.seen.set(k, v);
    for (const [k, v] of r.problems) a.problems.set(k, v);
    for (const [k, v] of r.odd) if (!a.odd.has(k)) a.odd.set(k, v);
  };
  merge(audit(H, { kits: ['trail', 'march', 'danheng', 'himeko'], mcPath: 'trail_p', max: o.quick ? 4 : 20, runs: o.quick ? 4 : 20 }));
  for (const m of modes(H, o.quick)) merge(audit(H, m));
  return a;
}

module.exports = { audit, auditAll, modes, staticKeys, uncovered };

if (require.main === module) {
  const ROOT = path.join(__dirname, '..'), DIR = path.join(ROOT, 'js/apps/hsr98');
  const noop = () => { };
  const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? s => ({ width: String(s).length * 6 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : k === 'getImageData' || k === 'createImageData' ? (a, b, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, (w || a) * (h || b)) * 4) }) : k === 'createPattern' ? () => ({}) : noop), set: () => true });
  Object.assign(globalThis, {
    document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctx, addEventListener: noop, appendChild: noop }), querySelector: () => null, addEventListener: noop, removeEventListener: noop },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, requestAnimationFrame: () => 1, cancelAnimationFrame: noop
  });
  const page = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  const listed = [...page.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  const H = require(path.join(DIR, 'hsr-core.js'));
  for (const f of listed.filter(x => x !== 'hsr-bug' && x !== 'hsr-ui-bug')) require(path.join(DIR, f + '.js'));
  const quick = process.argv.includes('--quick');
  const t0 = Date.now();
  const a = auditAll(H, { quick });
  const miss = uncovered(H, staticKeys(ROOT));
  console.log('battles ' + a.battles + ', steps ' + a.steps + ', statuses ' + a.seen.size + ', ' + Math.round((Date.now() - t0) / 1000) + ' s');
  console.log('\nproblems: ' + a.problems.size);
  for (const [k, v] of a.problems) console.log('  ' + k + '  ×' + v.n + '  ' + v.sample);
  console.log('\nodd groups: ' + a.odd.size);
  for (const [k, v] of a.odd) console.log('  ' + k + '  ×' + v.n + '  ' + v.sample);
  console.log('\nbuff keys in source without text: ' + (miss.join(', ') || 'none'));
  if (process.argv.includes('--all')) { console.log('\nall statuses:'); for (const [k, v] of [...a.seen].sort()) console.log('  ' + k + '  ×' + v.n + '  ' + v.sample); }
}
