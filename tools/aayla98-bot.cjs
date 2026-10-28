const path = require('path');

const ROOT = path.join(__dirname, '..');
for (const f of ['ay-core', 'ay-data', 'ay-script', 'ay-ch0', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle']) require(path.join(ROOT, 'js/apps/aayla98', f + '.js'));
const A = globalThis.Aayla98;

function choose(b) {
  const u = b.current(), cmds = b.commands(u);
  const can = id => (cmds.find(c => c.id === id) || {}).enabled;
  const E = b.enemies(), front = E.filter(e => e.row === 'front'), back = E.filter(e => e.row === 'back');
  const lowest = arr => arr.slice().sort((a, c) => a.hp - c.hp)[0];
  const hurt = b.heroes().filter(h => h.hp < h.maxhp * 0.35);
  if (hurt.length && can('item:bacta')) return { skill: 'item:bacta', target: hurt[0].id };
  if (u.id === 'aayla') {
    if (can('brace') && back.length && (back.some(e => e.boss) || back.length >= 2)) return { skill: 'brace', target: 'none' };
    const shooters = E.filter(e => e.ai === 'shooter' && !e.disarmed);
    const tl = b.timeline(8), mine = tl.indexOf('aayla', 1);
    const soon = tl.slice(1, mine < 0 ? 8 : mine).filter(id => shooters.some(s => s.id === id)).length;
    if (can('deflect') && soon >= 2 && !b.botDeflected) { b.botDeflected = true; return { skill: 'deflect', target: 'aayla' }; }
    b.botDeflected = false;
    if (b.hazard && b.hazard !== 'brace' && can('push')) {
      const t = back.find(e => !e.boss && e.weight !== 'heavy');
      if (t) return { skill: 'push', target: t.id };
      const f = front.find(e => !e.boss && e.weight !== 'heavy');
      if (f && b.freeSlot('back') !== null) return { skill: 'push', target: f.id };
    }
    const weakToStrike = front.find(e => b.mult(e, 'strike') > 1 && !e.breach);
    if (weakToStrike && can('push') && u.fp >= 30 && b.freeSlot('back') === null) return { skill: 'push', target: weakToStrike.id };
    if (can('whirl') && front.length >= 2) return { skill: 'whirl', target: 'frontAll' };
    if (front.length) {
      const t = front.find(e => e.breach) || lowest(front);
      if (can('combo') && t.hp > 45) return { skill: 'combo', target: t.id };
      if (can('blade')) return { skill: 'blade', target: t.id };
    }
    if (back.length) {
      if (can('throw') && back.length >= 2) return { skill: 'throw', target: 'back' };
      if (can('leap')) return { skill: 'leap', target: lowest(back).id };
      const stays = back.find(e => e.boss || (e.ai === 'shooter' && !e.disarmed));
      if (can('pull') && stays) return { skill: 'pull', target: stays.id };
      if (can('blade') && front.length) return { skill: 'blade', target: lowest(front).id };
    }
    if (can('deflect') && shooters.length && !b.botDeflected) { b.botDeflected = true; return { skill: 'deflect', target: 'aayla' }; }
    if (can('focus') && u.fp < u.maxfp * 0.7) return { skill: 'focus', target: 'aayla' };
    if (can('guard')) return { skill: 'guard', target: 'aayla' };
  } else {
    const boss = E.find(e => e.boss);
    if (boss && !boss.botRead && can('read')) { boss.botRead = true; return { skill: 'read', target: boss.id }; }
    const shock = E.filter(e => b.mult(e, 'shock') > 1);
    if (can('vlightning') && shock.length) return { skill: 'vlightning', target: lowest(shock).id };
    if (front.length && can('blade')) return { skill: 'blade', target: lowest(front).id };
    if (can('vlightning')) return { skill: 'vlightning', target: lowest(E).id };
    if (can('push') && back.length) return { skill: 'push', target: lowest(back).id };
  }
  const c = cmds.find(x => x.enabled && x.id === 'guard') || cmds.find(x => x.enabled && x.id !== 'flee' && !x.id.startsWith('item:'));
  return { skill: c.id, target: b.targets(u, c.id)[0] };
}

function fight(group, seed, opts) {
  opts = opts || {};
  const S = opts.S || Object.assign(A.newState(), { items: {} });
  A.Party.ensure(S);
  const b = new A.Battle({ S, group, seed, advantage: opts.advantage || 'none', difficulty: opts.difficulty });
  b.begin();
  let guard = 0;
  while (!b.over && guard++ < 600) {
    const c = choose(b);
    b.act(c.skill, c.target, c.extra);
  }
  const heroes = b.units.filter(u => u.side === 'party');
  const hp = heroes.reduce((s, u) => s + u.hp, 0) / heroes.reduce((s, u) => s + u.maxhp, 0);
  const fpUsed = heroes.reduce((s, u) => s + (u.maxfp - u.fp), 0);
  const res = { over: b.over || 'stuck', aayla: b.turns.aayla || 0, vos: b.turns.vos || 0, hp, fpUsed, talked: b.talked };
  if (opts.keep) b.finish();
  return res;
}

function chain(groups, seed) {
  const S = Object.assign(A.newState(), { items: {} });
  A.Party.ensure(S);
  S.items = {};
  let n = 0;
  for (let i = 0; i < 40; i++) {
    const g = groups[i % groups.length];
    const r = fight(g, seed + i, { S, keep: true });
    if (r.over !== 'win') break;
    n++;
    const a = S.party.find(m => m.id === 'aayla');
    if (a.fp < A.SKILLS.push.fp) break;
  }
  return n;
}

function report(group, n, opts) {
  const runs = [];
  for (let s = 1; s <= n; s++) runs.push(fight(group, s, opts));
  const wins = runs.filter(r => r.over === 'win');
  const med = arr => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
  return {
    group, n, win: wins.length / n,
    aayla: med(wins.map(r => r.aayla)), aaylaMax: Math.max(0, ...wins.map(r => r.aayla)), aaylaMin: Math.min(...wins.map(r => r.aayla)),
    hp: wins.reduce((s, r) => s + r.hp, 0) / Math.max(1, wins.length), fp: med(wins.map(r => r.fpUsed)), stuck: runs.filter(r => r.over === 'stuck').length
  };
}

const TS = A.Maps.TILE;
const ROUTES = {
  lessu_market: w => {
    for (const [x, y] of [[9, 9], [17, 9], [25, 9], [14, 17], [9, 15], [21, 20]]) w.use(x, y, 'up');
    w.goTo(29, 17);
    w.act({ sense: true });
    w.use(29, 16, 'up');
    w.use(12, 18, 'down');
    w.goTo(33, 12);
    w.face('up');
    w.act({ pull: true });
    w.goTo(33, 5);
    w.face('up');
    w.act({ interact: true });
  },
  ryll_tunnels: w => {
    w.goTo(20, 3);
    w.idle(400);
    w.act({ sense: true });
    w.use(20, 3, 'down');
    w.use(29, 3, 'right');
    w.use(14, 25, 'down');
    w.goTo(23, 25);
    w.idle(400);
    w.act({ sense: true });
    w.face('right');
    w.act({ interact: true });
    w.idle(60);
    w.goTo(30, 25);
    w.idle(400);
    w.act({ sense: true });
    w.face('down');
    w.act({ interact: true });
    w.goTo(31, 25);
    w.face('right');
    w.act({ push: true });
    w.use(41, 26, 'down');
    w.goTo(38, 24);
    w.goTo(38, 21);
    w.goTo(35, 22);
    w.face('right');
    w.act({ push: true });
    w.goTo(29, 21);
    w.face('left');
    w.act({ pull: true });
    w.goTo(22, 21);
    w.goTo(30, 20);
    w.use(43, 20, 'right');
  },
  ryll_mine: w => {
    w.use(10, 4, 'up');
    w.use(5, 4, 'down');
    w.use(15, 10, 'up');
    w.use(20, 12, 'right');
    w.use(9, 10, 'up');
    w.goTo(22, 11);
    w.idle(400);
    w.act({ sense: true });
    w.face('right');
    w.act({ push: true });
    w.use(24, 11, 'right');
    w.goTo(13, 16);
    w.use(28, 18, 'up');
    w.goTo(36, 18);
    w.goTo(38, 18);
    w.use(40, 15, 'up');
    w.use(42, 15, 'up');
    w.goTo(40, 22);
    w.goTo(43, 24);
    w.face('left');
    w.act({ push: true });
    w.goTo(36, 24);
    w.goTo(35, 22);
    w.face('left');
    w.act({ push: true });
    w.goTo(29, 28);
    w.use(27, 30, 'up');
    w.use(34, 29, 'right');
  }
};

class Left { constructor(to) { this.to = to; } }
class Done { }

function battleWin(S, group, advantage, seed, res) {
  A.Party.ensure(S);
  for (let tries = 0; tries < 6; tries++) {
    const b = new A.Battle({ S, group, seed: seed + tries * 101, advantage: advantage || 'none' });
    b.begin();
    let guard = 0;
    while (!b.over && guard++ < 600) {
      const c = choose(b);
      b.act(c.skill, c.target, c.extra);
    }
    res.fights++;
    if (b.over === 'win') { b.finish(); return true; }
    res.retries++;
  }
  throw new Error('bot lost ' + group + ' six times in a row');
}

function story(seed, opts) {
  opts = opts || {};
  const rnd = A.rng(seed), S = A.newState(), sc = A.Scripts.pro;
  const st = new A.Script.Story(A.Script.parse(sc.src, sc.file), S, sc.start);
  const res = { seed, end: false, maps: [], seen: new Set(), scenes: [], fights: 0, retries: 0, frames: 0, S };
  let field = null;
  const drive = () => {
    for (let guard = 0; guard < 2000; guard++) {
      const e = st.next();
      if (e.type === 'say') continue;
      if (e.type === 'choice') {
        const k = Math.floor(rnd() * e.options.length), poses = e.lekku ? ['calm', 'show', ...e.lekku.gestures] : [undefined];
        st.choose(k, poses[Math.floor(rnd() * poses.length)]);
        continue;
      }
      if (e.type === 'battle') { battleWin(S, e.group, e.advantage, seed * 7 + res.fights, res); continue; }
      if (e.type === 'forget') { A.Party.forget(S); continue; }
      if (e.type === 'map') throw new Left({ id: e.id, at: e.at });
      if (e.type === 'field') { if (field) field.refresh(); return; }
      if (e.type === 'end') throw new Done();
    }
    throw new Error('story loops in ' + st.pc.label);
  };
  const settle = evs => {
    for (const ev of evs) {
      const where = field.map.id + ':' + (ev.obj || ev.to || ev.label || '');
      if (['lines', 'meditate', 'jump', 'scene', 'exit', 'collapse', 'break', 'fill'].includes(ev.type)) res.seen.add(where);
      if (ev.type === 'meditate') A.Party.rest(S);
      if (ev.type === 'encounter') {
        battleWin(S, ev.group, ev.advantage, seed * 13 + res.fights, res);
        field.resolve(ev.obj, 'won');
      }
      if (ev.type === 'scene') { res.scenes.push(ev.label); st.jump(ev.label); drive(); }
      if (ev.type === 'exit') throw new Left({ id: ev.to, at: ev.at });
    }
  };
  const w = {
    act(inp) {
      field.step(1 / 60, inp || {});
      if (++res.frames > (opts.frames || 200000)) throw new Error('field loops on ' + field.map.id);
      settle(field.take());
    },
    idle(n) { for (let i = 0; i < n; i++) w.act({}); },
    place(x, y) { field.p.x = x * TS + 8; field.p.y = y * TS + 14; field.trail = []; },
    face(dir) { w.act({ dx: dir === 'right' ? 1 : dir === 'left' ? -1 : 0, dy: dir === 'down' ? 1 : dir === 'up' ? -1 : 0 }); },
    goTo(tx, ty) {
      for (let tries = 0; tries < 8; tries++) {
        const route = field.path(field.playerTile(), [tx, ty]);
        if (!route) throw new Error(`bot: no path on ${field.map.id} to ${tx},${ty}`);
        let clear = true;
        for (const [x, y] of route.slice(1)) {
          const gx = x * TS + 8, gy = y * TS + 14;
          let n = 0;
          while (Math.hypot(gx - field.p.x, gy - field.p.y) > 1.5) {
            const dx = gx - field.p.x, dy = gy - field.p.y, d = Math.hypot(dx, dy);
            w.act({ dx: Math.abs(dx) > 0.8 ? dx / d : 0, dy: Math.abs(dy) > 0.8 ? dy / d : 0 });
            if (++n > 240) { clear = false; break; }
          }
          if (!clear) break;
        }
        if (clear) { w.place(tx, ty); return; }
      }
      throw new Error(`bot: stuck on ${field.map.id} going to ${tx},${ty}`);
    },
    use(x, y, dir) { w.goTo(x, y); w.face(dir); w.act({ interact: true }); }
  };
  const runMap = to => {
    if (!field) field = new A.Field(S, to.id, to.at);
    else field.load(to.id, to.at);
    res.maps.push(to.id);
    settle(field.take());
    if (!ROUTES[to.id]) throw new Error('no route for ' + to.id);
    ROUTES[to.id](w);
    throw new Error('the route of ' + to.id + ' ended without leaving the map');
  };
  let go = null;
  try { drive(); } catch (x) { if (x instanceof Left) go = x.to; else if (x instanceof Done) res.end = true; else throw x; }
  for (let hop = 0; hop < 12 && go; hop++) {
    try { runMap(go); } catch (x) {
      if (x instanceof Left) { go = x.to; continue; }
      if (x instanceof Done) { res.end = true; go = null; continue; }
      throw x;
    }
  }
  return res;
}

module.exports = { A, choose, fight, chain, report, story, ROUTES };

if (require.main === module) {
  const mode = process.argv[2] || 'battles';
  const arg = k => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : null; };
  const n = +(arg('n') || 200);
  if (mode === 'battles') {
    for (const g of Object.keys(A.GROUPS)) {
      const r = report(g, n, { difficulty: arg('difficulty') || 'normal' });
      console.log(`${g.padEnd(13)} win ${(r.win * 100).toFixed(1)}%  Aayla turns median ${r.aayla} (${r.aaylaMin}-${r.aaylaMax})  HP left ${(r.hp * 100).toFixed(1)}%  Force used ${r.fp}  stuck ${r.stuck}`);
    }
    const tunnels = ['smugglers_a', 'smugglers_b', 'smugglers_c', 'smugglers_d'];
    const chains = Array.from({ length: 50 }, (_, i) => chain(tunnels, 1000 + i * 50)).sort((x, y) => x - y);
    console.log(`fights before Aayla runs out of Force (no rest): median ${chains[25]} (${chains[0]}-${chains[49]})`);
  }
  if (mode === 'story') {
    const t0 = Date.now(), runs = [];
    for (let s = 1; s <= n; s++) runs.push(story(s));
    const count = (pick) => runs.reduce((m, r) => { const k = pick(r); m[k] = (m[k] || 0) + 1; return m; }, {});
    console.log(`prologue: ${runs.filter(r => r.end).length}/${n} reach the title, ${((Date.now() - t0) / n).toFixed(0)} ms per run`);
    console.log(`fights per run: ${(runs.reduce((s, r) => s + r.fights, 0) / n).toFixed(1)}, lost and replayed: ${runs.reduce((s, r) => s + r.retries, 0)}`);
    console.log('Darkness at the end: ' + JSON.stringify(count(r => r.S.dark)));
    console.log('tone at Pol: ' + JSON.stringify(count(r => r.S.flags.pol_tone)) + ', Secura bond: ' + JSON.stringify(count(r => r.S.bonds.secura || 0)));
    console.log('Asante: ' + JSON.stringify(count(r => r.S.flags.asante_tone)) + ', level after the prologue: ' + JSON.stringify(count(r => r.S.party.map(m => m.id + m.level).join())));
  }
}
