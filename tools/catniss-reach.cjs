const path = require('node:path');
const ROOT = path.join(__dirname, '..');
for (const f of ['cn-core', 'cn-sim', 'cn-levels']) require(path.join(ROOT, 'js/apps/catniss', f + '.js'));
const C = globalThis.Catniss;
const { T, PH } = C;
const STEP = C.Sim.STEP;

function makeChecker(def) {
  const g = new C.Sim.Game(def, { lives: 999 });
  const lv = g.lv;
  for (const e of g.ents) {
    if (e.type !== 'plat') continue;
    if (e.axis === 'h') {
      const cy = Math.floor(e.oy / T);
      const c0 = Math.floor((e.ox + e.a) / T), c1 = Math.floor((e.ox + e.b) / T) + 2;
      for (let cx = c0; cx <= c1; cx++) if (lv.tiles[cy * lv.w + cx] === '.' || lv.tiles[cy * lv.w + cx] === ':') lv.tiles[cy * lv.w + cx] = '=';
    } else {
      const cx0 = Math.floor(e.ox / T);
      const r0 = Math.floor((e.oy + e.a) / T), r1 = Math.floor((e.oy + e.b) / T);
      for (let cy = r0; cy <= r1; cy++) for (let cx = cx0; cx < cx0 + 3; cx++) if (lv.tiles[cy * lv.w + cx] === '.' || lv.tiles[cy * lv.w + cx] === ':') lv.tiles[cy * lv.w + cx] = '=';
    }
  }
  for (const e of g.ents) if (e.type === 'sheep') e.speed = 0;
  const targets = { exit: [], fish: [], cage: [], arena: [], coin: [] };
  for (const e of g.ents) {
    if (e.type === 'exit') targets.exit.push(e);
    if (e.type === 'fish') targets.fish.push(e);
    if (e.type === 'cage') targets.cage.push(e);
    if (e.type === 'coin') targets.coin.push(e);
    if (e.type === 'van') targets.arena.push({ x: e.x0, y: e.y - 60, w: e.x1 - e.x0, h: 100 });
  }
  g.ents = g.ents.filter(e => e.type === 'sheep' || e.type === 'fan');
  g.flickOn = () => true;
  let failed = false;
  g.hurt = () => { failed = true; };
  g.kill = () => { failed = true; };
  g.emit = () => { };
  return { g, targets, fail: () => failed, reset: () => { failed = false; } };
}

function overlapR(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function analyse(def, opts = {}) {
  const ck = makeChecker(def);
  const { g, targets } = ck;
  const lv = g.lv;
  const nodes = new Map();
  const edges = new Map();
  const touched = { exit: new Set(), fish: new Set(), cage: new Set(), arena: new Set(), coin: new Set() };
  const key = (cx, fy) => cx + ',' + fy;
  const queue = [];
  const addNode = (cx, fy, from) => {
    const k = key(cx, fy);
    if (from) { if (!edges.has(from)) edges.set(from, new Set()); edges.get(from).add(k); }
    if (!nodes.has(k)) { nodes.set(k, { cx, fy }); queue.push(k); }
    return k;
  };

  const OFFS = [0, -6, 6, -3, 3];
  const place = (cx, fy, vx, face, fall) => {
    for (const o of fall ? [0] : OFFS) {
      g.crumble = new Map();
      g.t = 0;
      g.state = 'play';
      const p = g.makePlayer(cx * T + (T - PH.w) / 2 + o, (fy + 1) * T - PH.h);
      p.vx = vx; p.face = face;
      g.player = p;
      ck.reset();
      if (g.solidAt(Math.floor(p.x / T), fy) || g.solidAt(Math.floor((p.x + p.w - 0.01) / T), fy)) continue;
      const y0 = p.y;
      g.moveY(p, 0.5);
      if (!p.onGround) g.landOnBodies(p);
      if (p.onGround || fall) { if (fall) p.y = y0; return true; }
    }
    return false;
  };

  const checkTargets = (p, from) => {
    for (const name in targets) targets[name].forEach((t, i) => { if (overlapR(p, t)) touched[name].add(from + '#' + i); });
  };

  const simulate = (from, policy) => {
    const p = g.player;
    let tAir = 0, wasGround = true, leftGround = false, clings = 0, zig = policy.zig ? policy.dir : 0, zigT = -1, lockHold = 0;
    const maxT = policy.walk ? 0.7 : 2.4;
    const startCx = Math.floor((p.x + p.w / 2) / T);
    for (let t = 0; t < maxT; t += STEP) {
      const input = { left: false, right: false, up: false, down: !!policy.drop, jump: false, dash: false };
      let dir = policy.dir;
      if (zig) dir = zig;
      if (dir > 0) input.right = true; else if (dir < 0) input.left = true;
      let jp = false, dp = false;
      if (policy.walk) { }
      else if (policy.drop) { if (t < STEP * 1.5) jp = true; }
      else if (policy.fallOnly) { }
      else {
        if (t < STEP * 1.5) jp = true;
        input.jump = t < policy.hold;
        if (policy.dash !== undefined && Math.abs(t - policy.dash) < STEP * 0.6) dp = true;
      }
      if (zig && p.wall && zigT < 0 && clings < 9) { zigT = t + 0.03; }
      if (zigT >= 0 && t >= zigT) { jp = true; input.jump = true; zigT = -1; clings++; zig = -p.wallSide; lockHold = 0.32; }
      if (lockHold > 0) { lockHold -= STEP; input.jump = true; }
      g.lastInput = input;
      g.t += STEP;
      g.updateCrumble(STEP);
      g.updatePlayer(STEP, input, jp, dp);
      if (ck.fail()) return null;
      checkTargets(p, from);
      if (!p.onGround) { leftGround = true; tAir += STEP; }
      if (policy.walk) {
        const cxNow = Math.floor((p.x + p.w / 2) / T);
        if (p.onGround && cxNow !== startCx) return [cxNow, Math.floor((p.y + p.h - 1) / T)];
        if (leftGround && p.onGround) return [cxNow, Math.floor((p.y + p.h - 1) / T)];
        if (Math.abs(p.vx) < 1 && t > 0.3 && !leftGround) return null;
      } else if (leftGround && p.onGround && t > STEP * 3) {
        return [Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h - 1) / T)];
      }
      if (p.y > lv.h * T + 40) return null;
    }
    return null;
  };

  const policies = [];
  policies.push({ walk: true, dir: 1 }, { walk: true, dir: -1 }, { drop: true, dir: 0 });
  for (const dir of [-1, 0, 1]) {
    for (const run of dir ? [0, 1] : [0]) {
      for (const hold of [0.09, 1]) {
        for (const dash of [undefined, 0.1, 0.26, 0.42]) {
          for (const zig of [false, true]) {
            if (zig && !dir) continue;
            if (zig && dash !== undefined) continue;
            policies.push({ dir, run, hold, dash, zig, face: dir || 1 });
            if (!dir && dash !== undefined) policies.push({ dir, run, hold, dash, zig, face: -1 });
          }
        }
      }
    }
  }
  const startCx = Math.floor((g.start.x + PH.w / 2) / T), startFy = Math.floor((g.start.y + PH.h - 1) / T);
  addNode(startCx, startFy, null);
  let sims = 0;
  while (queue.length) {
    const k = queue.shift();
    const n = nodes.get(k);
    if (!place(n.cx, n.fy, 0, 1)) {
      for (const dir of [-1, 0, 1]) {
        place(n.cx, n.fy, dir * 40, dir || 1, true);
        const res = simulate(k, { dir, hold: 0, fallOnly: true });
        sims++;
        if (res) addNode(res[0], res[1], k);
      }
      continue;
    }
    for (const pol of policies) {
      if (!place(n.cx, n.fy, pol.run ? pol.dir * PH.run : 0, pol.face || (pol.dir || 1))) break;
      checkTargets(g.player, k);
      const res = simulate(k, pol);
      sims++;
      if (res) addNode(res[0], res[1], k);
    }
  }

  const rev = new Map();
  for (const [a, set] of edges) for (const b of set) { if (!rev.has(b)) rev.set(b, new Set()); rev.get(b).add(a); }
  const goalNames = targets.cage.length ? ['cage'] : targets.arena.length ? ['arena'] : ['exit'];
  const goalNodes = new Set();
  for (const name of goalNames) for (const s of touched[name]) goalNodes.add(s.split('#')[0]);
  const coreach = new Set(goalNodes);
  const q2 = [...goalNodes];
  while (q2.length) { const k = q2.pop(); for (const a of rev.get(k) || []) if (!coreach.has(a)) { coreach.add(a); q2.push(a); } }
  const softlocks = [...nodes.keys()].filter(k => !coreach.has(k));
  const fishNodes = new Set([...touched.fish].map(s => s.split('#')[0]));
  const fishBack = [...fishNodes].some(k => coreach.has(k));
  const coinsHit = new Set([...touched.coin].map(s => +s.split('#')[1]));
  const missingCoins = targets.coin.map((c, i) => coinsHit.has(i) ? null : [Math.floor(c.x / T), Math.floor(c.y / T)]).filter(Boolean);
  return {
    nodes: nodes.size, sims, missingCoins,
    goal: goalNodes.size > 0,
    fish: targets.fish.length ? fishNodes.size > 0 : null,
    fishBack: targets.fish.length ? fishBack : null,
    softlocks,
    nodeSet: nodes,
    lv
  };
}

function overlay(res) {
  const lv = res.lv;
  const rows = [];
  for (let y = 0; y < lv.h; y++) {
    let r = '';
    for (let x = 0; x < lv.w; x++) {
      const k = x + ',' + y;
      if (res.nodeSet.has(k)) r += res.softlocks.includes(k) ? '!' : '+';
      else r += lv.def.map[y][x] || '.';
    }
    rows.push(r);
  }
  return rows;
}

if (require.main === module) {
  const ids = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const show = process.argv.includes('-m');
  for (const def of C.Levels.LEVELS) {
    if (ids.length && !ids.includes(def.id)) continue;
    const t0 = Date.now();
    const r = analyse(def);
    console.log(`${def.id} nodes=${r.nodes} sims=${r.sims} goal=${r.goal} fish=${r.fish} fishBack=${r.fishBack} softlocks=${r.softlocks.length} missingCoins=${r.missingCoins.length} ${Date.now() - t0}ms`);
    if (r.missingCoins.length) console.log('  coins:', r.missingCoins.map(c => c.join(',')).join(' '));
    if (r.softlocks.length) console.log('  softlocks:', r.softlocks.slice(0, 20).join(' '));
    if (show) overlay(r).forEach((row, i) => console.log(String(i).padStart(2) + ' ' + row));
  }
}

module.exports = { analyse, overlay };
