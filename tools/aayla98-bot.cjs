const path = require('path');

const ROOT = path.join(__dirname, '..');
for (const f of ['ay-core', 'ay-data', 'ay-memory', 'ay-script', 'ay-ch0', 'ay-ch1', 'ay-ch2', 'ay-int', 'ay-ch3', 'ay-ch4', 'ay-ch5', 'ay-ch6', 'ay-ch7', 'ay-bonds-text', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle', 'ay-duels', 'ay-respite', 'ay-cover', 'ay-flight', 'ay-save']) require(path.join(ROOT, 'js/apps/aayla98', f + '.js'));
const A = globalThis.Aayla98;

function choose(b) {
  const u = b.current(), cmds = b.commands(u);
  const can = id => (cmds.find(c => c.id === id) || {}).enabled;
  if (b.groupId === 'stark_cave') {
    if (can('seal')) return { skill: 'seal', target: 'none' };
    const E = b.enemies(), rows = ['front', 'back'].map(r => [r, E.filter(e => e.row === r).length]).sort((a, c) => c[1] - a[1]);
    if (u.key === 'plo' && can('telepathy') && rows[0][1] >= 2) return { skill: 'telepathy', target: rows[0][0] };
    if (u.key === 'tholme' && !u.hidden && can('shadow') && b.rnd01() < 0.4) return { skill: 'shadow', target: u.id };
    const front = E.filter(e => e.row === 'front').sort((a, c) => a.hp - c.hp);
    if (front.length && can('blade')) return { skill: 'blade', target: front[0].id };
    if (E.length && can('push')) return { skill: 'push', target: E[0].id };
    return { skill: 'guard', target: u.id };
  }
  if (b.groupId === 'duel_sanctum') return can('lower') ? { skill: 'lower', target: u.id } : { skill: 'guard', target: u.id };
  if (b.groupId === 'vos_dark') {
    const own = cmds.filter(c => c.enabled && /^(mind:|frag:|bond:|voice)/.test(c.id));
    const pick = own.find(c => c.id.startsWith('mind:')) || own.find(c => c.id.startsWith('frag:')) || own.find(c => c.id === 'bond:vos') || own.find(c => c.id === 'voice');
    if (u.hp < u.maxhp * 0.35 && can('item:bacta')) return { skill: 'item:bacta', target: u.id };
    if (pick) return { skill: pick.id, target: 'none' };
  }
  if (b.groupId === 'endor_beast' && u.id === 'aayla') {
    if (b.under && can('ceiling')) return { skill: 'ceiling', target: 'none' };
    if (u.hp < u.maxhp * 0.35 && can('item:bacta')) return { skill: 'item:bacta', target: u.id };
  }
  if ((u.key === 'ekria' || (u.id === 'aayla' && b.rnd01() < 0.35)) && can('hack')) {
    const d = b.enemies().filter(e => b.targets(u, 'hack').includes(e.id)).sort((x, y) => y.hp - x.hp)[0];
    if (d && b.enemies().length > 1) return { skill: 'hack', target: d.id };
  }
  if (u.key === 'bly' && can('volley') && b.enemies().length >= 2) return { skill: 'volley', target: 'none' };
  if (u.key === 'barriss' && can('heal')) {
    const low = b.heroes().filter(h => h.hp < h.maxhp * 0.5).sort((x, y) => x.hp - y.hp)[0];
    if (low) return { skill: 'heal', target: low.id };
  }
  if (u.key === 'zonder' && can('tkthrow') && b.rnd01() < 0.5) {
    const t = b.enemies()[0];
    if (t) return { skill: 'tkthrow', target: t.id };
  }
  if (b.groupId === 'bok_gate' && u.id === 'aayla') {
    const k = b.units.find(e => e.key === 'bok_final' && b.active(e));
    if (k && b.raged && k.row === 'back' && can('push')) return { skill: 'push', target: k.id };
    if (k && b.raged && k.row === 'front' && can('guard')) return { skill: 'guard', target: u.id };
    if (k && can('fists')) return { skill: 'fists', target: k.id };
  }
  if (b.group.gentle && u.key === 'tholme' && can('talk') && b.rnd01() < 0.4) {
    const t = b.enemies().find(e => b.targets(u, 'talk').includes(e.id));
    const ap = t && b.approaches(t).find(x => x.enabled && (x.id === 'persuade' || x.id === 'mind'));
    if (ap) return { skill: 'talk', target: t.id, extra: { approach: ap.id } };
  }
  if (b.groupId === 'vos_honoghr' && u.id === 'aayla' && can('cover:bly') && b.rnd01() < 0.5) return { skill: 'cover:bly', target: u.id };
  if (u.key === 'bly') {
    const E = b.enemies().filter(e => !e.hidden), rows = ['front', 'back'].map(r => [r, E.filter(e => e.row === r).length]).sort((a, c) => c[1] - a[1]);
    const a = b.aayla();
    if (a && a.hp < a.maxhp * 0.5 && can('bcover') && !u.covering) return { skill: 'bcover', target: 'none' };
    if (can('grenade') && rows[0][1] >= 2) return { skill: 'grenade', target: rows[0][0] };
    if (can('suppress') && E.length >= 2 && !E.some(e => e.status.suppressed) && b.rnd01() < 0.4) return { skill: 'suppress', target: 'none' };
    const low = E.slice().sort((x, y) => x.hp - y.hp)[0];
    if (low && can('bshot')) return { skill: 'bshot', target: low.id };
  }
  if (b.groupId === 'traa_duel' && u.id === 'aayla' && u.hp < u.maxhp * 0.5 && can('guard')) return { skill: 'guard', target: u.id };
  if (b.groupId === 'karkko_boss') {
    const k = b.units.find(e => e.key === 'karkko');
    if (k && k.hidden && can('read')) return { skill: 'read', target: b.targets(u, 'read')[0] };
    if (k && !k.hidden && can('vlightning')) return { skill: 'vlightning', target: k.id };
    if (k && !k.hidden && can('blade') && b.targets(u, 'blade').includes(k.id)) return { skill: 'blade', target: k.id };
  }
  if (b.groupId === 'zenex_bridge' && u.id === 'aayla' && b.daze >= 60 && can('focus')) return { skill: 'focus', target: u.id };
  if (can('antenna')) return { skill: 'antenna', target: 'none' };
  if (can('pullsaber')) return { skill: 'pullsaber', target: 'none' };
  if (b.groupId === 'aurra_duel' && u.id === 'aayla' && b.fear >= 50 && can('focus')) return { skill: 'focus', target: u.id };
  if (u.key === 'shonju' && can('spalm') && b.inRow('front').length) return { skill: 'spalm', target: b.inRow('front')[0].id };
  if ((u.key === 'clone_elite' || u.key === 'clone_327' || u.key === 'clone501') && can('cshot') && b.enemies().length) return { skill: 'cshot', target: b.enemies().slice().sort((a, c) => a.hp - c.hp)[0].id };
  if (u.key === 'traa') {
    const wounded = b.heroes().some(h => h.hp < h.maxhp * 0.7 && !h.status.regen), strong = b.enemies().filter(e => !e.status.rooted).sort((a, c) => c.hp - a.hp)[0];
    if (wounded && strong && can('roots')) return { skill: 'roots', target: strong.id };
  }
  if (u.id === 'aayla' && can('heal')) {
    const low = b.heroes().filter(h => h.hp < h.maxhp * 0.4).sort((a, c) => a.hp - c.hp)[0];
    if (low) return { skill: 'heal', target: low.id };
  }
  if (b.groupId === 'hypori' && u.id === 'aayla') {
    const weak = b.heroes().filter(h => h.id !== 'aayla' && h.hp < h.maxhp * 0.5 && b.covered !== h.id).sort((a, c) => a.hp - c.hp)[0];
    if (weak && can('cover:' + weak.id)) return { skill: 'cover:' + weak.id, target: u.id };
  }
  if (u.key === 'kit' && can('shiicho') && b.inRow('front').length >= 2) return { skill: 'shiicho', target: 'frontAll' };
  if ((u.key === 'kiadi' || u.key === 'shaak') && b.rnd01() < 0.5) {
    const own = u.key === 'kiadi' ? 'mundipush' : 'tkthrow', t = b.enemies()[0];
    if (t && can(own)) return { skill: own, target: t.id };
  }
  if (u.key === 'villie') {
    const E = b.enemies().filter(e => !e.hidden), rows = ['front', 'back'].map(r => [r, E.filter(e => e.row === r).length]).sort((a, c) => c[1] - a[1]);
    if (can('bet') && !b.bet) return { skill: 'bet', target: b.rnd01() < 0.5 ? 'fast' : 'clean' };
    if (can('thermal') && rows[0][1] >= 2) return { skill: 'thermal', target: rows[0][0] };
    if (can('flash') && E.filter(e => e.ai === 'shooter').length >= 2) return { skill: 'flash', target: 'none' };
    const low = E.slice().sort((a, c) => a.hp - c.hp)[0];
    if (low && can('vshot')) return { skill: 'vshot', target: low.id };
  }
  if (u.key === 'secura_guard') {
    const t = b.inRow('front').sort((a, c) => a.hp - c.hp)[0];
    if (t && can('zapstaff')) return { skill: 'zapstaff', target: t.id };
    return { skill: 'guard', target: u.id };
  }
  if (u.retinue) {
    const prey = b.enemies().filter(e => !e.hidden && !e.fake).sort((a, c) => a.hp - c.hp)[0];
    if (prey && can('hunger')) return { skill: 'hunger', target: prey.id };
  }
  if (u.id === 'aayla' && b.S.chapter === 'ch2' && b.groupId !== 'duel_cantina') {
    const E2 = b.enemies().filter(e => !e.hidden && !e.fake), coin = b.rnd01();
    const crowd = ['front', 'back'].find(r => E2.filter(e => e.row === r).length >= 2);
    if (crowd && can('terror') && coin < 0.25) return { skill: 'terror', target: crowd };
    const big = E2.slice().sort((a, c) => c.hp - a.hp)[0];
    if (big && can('klightning') && coin > 0.7) return { skill: 'klightning', target: big.id };
    if (can('command') && coin > 0.5 && coin < 0.62) return { skill: 'command', target: 'none' };
  }
  const E = b.enemies(), front = E.filter(e => e.row === 'front'), back = E.filter(e => e.row === 'back');
  const lowest = arr => arr.slice().sort((a, c) => a.hp - c.hp)[0];
  const hurt = b.heroes().filter(h => h.hp < h.maxhp * 0.35);
  if (hurt.length && can('item:bacta')) return { skill: 'item:bacta', target: hurt[0].id };
  if (u.id === 'aayla') {
    if (can('bet') && !b.bet && !(b.turns.aayla > 1) && b.rnd01() < 0.4) return { skill: 'bet', target: b.rnd01() < 0.5 ? 'fast' : 'clean' };
    const cort = e => (A.ENEMY_KINDS[e.kind] || {}).cortosis;
    const hard = E.filter(cort).sort((a, c) => a.hp - c.hp)[0];
    if (hard) {
      if (hard.row === 'back') {
        if (b.hazard && b.hazard !== 'brace' && can('push') && !(hard.hazardCool > 0)) return { skill: 'push', target: hard.id };
        if (can('pull') && b.freeSlot('front') !== null) return { skill: 'pull', target: hard.id };
      } else {
        if (b.hazard && b.hazard !== 'brace' && can('push') && b.freeSlot('back') !== null && b.rnd01() < 0.3) return { skill: 'push', target: hard.id };
        if (can('djemso') && b.rnd01() < 0.25) return { skill: 'djemso', target: u.id };
        if (can('fists')) return { skill: 'fists', target: hard.id };
      }
    }
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
    if (can('barrier') && shooters.length >= 2 && !b.barrier && b.rnd01() < 0.5) return { skill: 'barrier', target: 'none' };
    if (can('twinwhirl') && front.length >= 2) return { skill: 'twinwhirl', target: 'frontAll' };
    if (can('duo') && E.length && b.rnd01() < 0.5) return { skill: 'duo', target: lowest(E.filter(e => b.targets(u, 'duo').includes(e.id))).id };
    if (can('whirl') && front.length >= 2) return { skill: 'whirl', target: 'frontAll' };
    const talkTo = E.find(e => e.kind === 'sentient' && !e.talked && !e.rage && b.approaches(e).some(a => a.id === 'persuade' && a.enabled));
    if (talkTo && can('talk')) return { skill: 'talk', target: talkTo.id, extra: { approach: 'persuade' } };
    if (front.length) {
      const t = front.find(e => e.breach) || lowest(front);
      if (can('combo') && t.hp > 45) return { skill: 'combo', target: t.id };
      if (can('blade')) return { skill: 'blade', target: t.id };
      if (can('fists')) return { skill: 'fists', target: t.id };
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

function reply(b) {
  const q = b.ask, ids = q.options.map(o => o.id), r = b.rnd01();
  if (ids.includes('abandon')) return r < 0.6 ? 'abandon' : r < 0.85 ? 'calm' : 'anger';
  if (ids.includes('laugh')) return r < 0.7 ? 'laugh' : r < 0.85 ? 'struggle' : 'beg';
  if (ids.includes('father')) return r < 0.7 ? 'father' : r < 0.85 ? 'yield' : 'silent';
  return ids[0];
}

function fight(group, seed, opts) {
  opts = opts || {};
  const S = opts.S || Object.assign(A.newState(), { items: {} });
  A.Party.ensure(S);
  const b = new A.Battle({ S, group, seed, advantage: opts.advantage || 'none', difficulty: opts.difficulty });
  b.begin();
  let guard = 0;
  while (!b.over && guard++ < 600) {
    if (b.ask) { b.answer(reply(b)); continue; }
    const c = choose(b);
    b.act(c.skill, c.target, c.extra);
  }
  const heroes = b.units.filter(u => u.side === 'party');
  const hp = heroes.reduce((s, u) => s + u.hp, 0) / heroes.reduce((s, u) => s + u.maxhp, 0);
  const fpUsed = heroes.reduce((s, u) => s + (u.maxfp - u.fp), 0);
  const res = { over: b.over || 'stuck', aayla: b.turns.aayla || 0, vos: b.turns.vos || 0, party: Object.values(b.turns).reduce((x, y) => x + y, 0), hp, fpUsed, talked: b.talked };
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
  const wins = runs.filter(r => r.over === 'win' || r.over === 'end');
  const med = arr => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
  return {
    group, n, win: wins.length / n,
    aayla: med(wins.map(r => r.aayla)), aaylaMax: Math.max(0, ...wins.map(r => r.aayla)), aaylaMin: Math.min(...wins.map(r => r.aayla)),
    party: med(wins.map(r => r.party)), hp: wins.reduce((s, r) => s + r.hp, 0) / Math.max(1, wins.length), fp: med(wins.map(r => r.fpUsed)), stuck: runs.filter(r => r.over === 'stuck').length
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

const CH1_ACTS = {
  a: { at: [19, 5, 'up'], done: 'done_rehearse' },
  i: { at: [5, 14, 'up'], done: 'done_nima' },
  b: { at: [8, 18, 'up'], done: 'done_bala' },
  j: { at: [17, 15, 'up'], done: 'done_guest' },
  k: { at: [30, 15, 'up'], done: 'done_guest' },
  y: { at: [23, 13, 'up'], done: 'done_pol' },
  l: { at: [38, 3, 'up'], done: 'done_balcony' },
  e: { at: [41, 14, 'up'] },
  f: { at: [41, 8, 'down'] },
  h: { at: [15, 24, 'down'] }
};

ROUTES.pol_estate = w => {
  if (w.S.flags.escape) {
    w.goTo(37, 8);
    w.goTo(6, 9);
    w.use(3, 19, 'down');
    return;
  }
  for (let guard = 0; guard < 60; guard++) {
    const f = w.field(), here = new Set(f.objs.map(o => o.letter));
    const open = Object.entries(CH1_ACTS).filter(([k, a]) => here.has(k) && !(a.done && w.S.flags[a.done]));
    if (!open.length) throw new Error('bot: nothing to do on day ' + w.S.flags.day);
    const [, a] = open[Math.floor(w.rnd() * open.length)];
    w.use(...a.at);
  }
  throw new Error('bot: the day does not end');
};

ROUTES.kiffex_temple = w => {
  if (!w.S.flags.temple_open) w.use(20, 25, 'up');
  w.goTo(20, 21);
  w.goTo(20, 10);
  w.use(19, 4, 'up');
};

ROUTES.kiffex_post = w => {
  w.use(6, 6, 'up');
  w.hunt();
  w.use(24, 9, 'up');
};

ROUTES.kiffex_hills = w => {
  const spots = [[10, 7], [14, 14], [22, 8], [28, 14], [34, 8], [6, 18]];
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(w.rnd() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  for (const [x, y] of spots.slice(0, 2)) w.use(x, y + 1, 'up');
  w.use(38, 18, 'up');
};

ROUTES.rock_gardens = w => {
  w.goTo(31, 9);
  w.goTo(36, 3);
  w.face('up');
  w.act({ interact: true });
};

ROUTES.lylek_caves = w => {
  w.goTo(6, 9);
  w.use(4, 15, 'up');
  w.use(42, 8, 'up');
  w.goTo(44, 27);
};

ROUTES.port_road = w => {
  w.goTo(52, 7);
  w.face('up');
  w.act({ interact: true });
};

ROUTES.fenn_house = w => {
  const S = w.S, bold = w.rnd() < 0.35, calm = () => { for (let k = 0; k < 40 && !bold && w.field().watched(); k++) w.idle(15); };
  w.use(4, 16, 'up');
  w.use(33, 16, 'up');
  w.use(17, 17, 'up');
  w.use(22, 8, 'up');
  for (let k = 0; k < 6 && !S.flags.intel_screen; k++) {
    w.goTo(36, 3);
    calm();
    w.face('right');
    w.act({ interact: true });
    w.idle(30);
  }
  if (!S.flags.intel_study) {
    w.goTo(13, 9);
    calm();
    w.goTo(6, 4);
    w.face('up');
    w.act({ interact: true });
  }
  w.goTo(39, 20);
  w.face('right');
  w.act({ interact: true });
};

ROUTES.ordmantell_junk = w => {
  w.use(10, 17, 'up');
  w.goTo(7, 11);
  w.goTo(7, 9);
  w.use(21, 5, 'right');
  if (w.rnd() < 0.5) w.hunt();
  w.use(35, 5, 'up');
};

ROUTES.kintan_wastes = w => {
  w.hunt();
  w.goTo(16, 19);
  w.goTo(18, 19);
  w.use(26, 16, 'up');
  w.goTo(27, 12);
  if (w.rnd() < 0.5) {
    w.goTo(27, 10);
    w.act({ sense: true });
  }
  w.goTo(27, 8);
  w.use(41, 11, 'down');
};

ROUTES.kintan_fortress = w => {
  w.goTo(8, 21);
  w.use(15, 11, 'up');
  if (w.rnd() < 0.6) for (let i = 0; i < 4 && w.field().enemiesLeft(); i++) { w.hunt(1); w.use(15, 11, 'up'); }
  w.use(15, 11, 'up');
  w.use(37, 4, 'up');
};

ROUTES.wheel_levels = w => {
  const S = w.S, before = () => !S.flags.met_korto;
  if (before()) {
    if (w.rnd() < 0.5) w.use(16, 19, 'up');
    if (!S.flags.fixed_cooler) w.use(11, 5, 'right');
    if (before() && !S.flags.intel_korto) w.use(6, 4, 'up');
    if (before() && !S.flags.intel_guide) w.use(12, 15, 'up');
    if (before() && !S.flags.fixed_lift) w.use(40, 5, 'right');
    if (before() && !S.flags.fixed_fan && w.rnd() < 0.5) w.use(26, 20, 'right');
    if (before()) w.use(40, 21, 'right');
  }
  w.use(32, 21, 'down');
};

ROUTES.kamino_tipoca = w => {
  const S = w.S;
  if (w.rnd() < 0.5) w.use(4, 4, 'up');
  w.use(29, 10, 'up');
  if (w.rnd() < 0.5) {
    w.goTo(25, 11);
    w.act({ sense: true });
    w.face('down');
    w.act({ interact: true });
  }
  if (!S.flags.alarm) w.goTo(28, 16);
  w.hunt();
  w.goTo(36, 18);
  w.act({ interact: true });
  w.goTo(43, 9);
};

ROUTES.devaron_suite = w => {
  const S = w.S, open = () => !S.flags.cover_tuulaa && S.cover;
  w.use(5, 5, 'up');
  if (open() && !S.flags.intel_route) w.use(10, 19, 'up');
  if (open() && !S.flags.intel_mountains) w.use(4, 19, 'up');
  if (open() && w.rnd() < 0.5) w.use(22, 15, 'up');
  if (open() && w.rnd() < 0.5) w.use(11, 5, 'up');
  if (open() && !S.flags.intel_hunter) w.use(39, 15, 'right');
  if (open()) w.use(4, 19, 'up');
  throw new Error('bot: the Devaron cover did not end');
};

ROUTES.devaron_base = w => {
  w.hunt();
  w.goTo(26, 16);
  w.act({ interact: true });
  w.goTo(35, 19);
  w.face('right');
  w.act({ push: true });
  w.goTo(40, 19);
  w.goTo(43, 22);
};

ROUTES.duum_hq = w => {
  w.goTo(11, 19);
  w.act({ sense: true });
  w.face('right');
  w.act({ push: true });
  w.use(25, 18, 'right');
  w.goTo(30, 18);
  w.goTo(35, 5);
};

ROUTES.honoghr_forest = w => {
  w.use(6, 6, 'up');
  w.goTo(17, 13);
  w.act({ sense: true });
  w.hunt();
  w.goTo(39, 20);
  w.goTo(39, 21);
};

ROUTES.honoghr_temple = w => {
  if (w.rnd() < 0.5) w.use(6, 17, 'down');
  w.hunt();
  w.use(10, 10, 'up');
  w.use(20, 7, 'up');
  w.goTo(20, 7);
  w.face('up');
  w.act({ pull: true });
};

ROUTES.anzat_dock = w => {
  w.goTo(3, 3);
  w.goTo(33, 3);
  w.goTo(33, 9);
  w.use(30, 9, 'up');
  w.goTo(31, 9);
  w.goTo(32, 10);
};

ROUTES.saleucami_caverns = w => {
  w.goTo(10, 22);
  w.use(8, 20, 'up');
  w.goTo(21, 22);
  w.use(26, 17, 'up');
  w.hunt();
  w.use(22, 4, 'up');
  w.use(33, 4, 'up');
  w.use(42, 7, 'up');
};

ROUTES.vos_mind = w => {
  if (w.rnd() < 0.85) w.use(10, 20, 'up');
  if (w.rnd() < 0.85) w.use(28, 21, 'up');
  if (w.rnd() < 0.85) w.use(24, 12, 'up');
  if (w.rnd() < 0.85) w.use(14, 4, 'up');
  w.goTo(36, 4);
  w.goTo(36, 3);
};

ROUTES.endor_forest = w => {
  w.use(4, 17, 'up');
  w.use(29, 5, 'up');
};

ROUTES.endor_mountain = w => {
  w.goTo(16, 20);
  w.goTo(20, 15);
  w.goTo(14, 8);
  w.goTo(36, 5);
  w.goTo(36, 4);
};

ROUTES.felucia_jungle = w => {
  w.hunt();
  w.use(8, 11, 'up');
  w.use(22, 14, 'up');
  w.use(30, 14, 'up');
  w.use(36, 13, 'up');
  w.goTo(40, 5);
  w.goTo(40, 4);
};

ROUTES.nigkoe_prison = w => {
  w.hunt();
  w.use(3, 14, 'up');
  w.goTo(20, 22);
  w.goTo(20, 23);
  w.use(20, 4, 'up');
};

ROUTES.kwayteow_water = w => {
  w.goTo(31, 4);
  w.goTo(32, 4);
};

ROUTES.kwayteow_escape = w => {
  w.use(18, 19, 'down');
  w.goTo(9, 5);
  w.goTo(9, 4);
};

function battleWin(S, group, advantage, seed, res) {
  A.Party.ensure(S);
  for (let tries = 0; tries < 6; tries++) {
    const b = new A.Battle({ S, group, seed: seed + tries * 101, advantage: advantage || 'none', retry: tries });
    b.begin();
    let guard = 0;
    while (!b.over && guard++ < 600) {
      if (b.ask) { res.asks.push(b.ask.id); b.answer(reply(b)); continue; }
      const c = choose(b);
      b.act(c.skill, c.target, c.extra);
    }
    res.fights++;
    if (b.instinctUsed) res.instinct++;
    if (b.bet) res.bets.push(b.bet.kind);
    if (b.over === 'win' || b.over === 'end') { const f = b.finish(); if (b.bet) res.bets[res.bets.length - 1] += f.betWon ? ':won' : ':lost'; return true; }
    res.retries++;
  }
  throw new Error('bot lost ' + group + ' six times in a row');
}

const PICKS = new WeakMap();

function pilot(f) {
  const K = A.FLIGHT, S = K.ship, s = f.ship, def = f.def;
  const v = def.speed * (s.ion > 0 ? S.ionSlow : 1);
  const th = [];
  for (const b of f.bolts) th.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r + S.r + 3, w: b.wait || 0, end: 9 });
  for (const o of f.foes) {
    if (o.wait > 0.6) continue;
    const k = K.foes[o.kind];
    if (k.decor || k.ground) continue;
    const w = Math.max(0, o.wait || 0);
    if (o.kind === 'geyser') {
      th.push({ x: o.x, y: o.y, vx: 0, vy: f.speed, r: o.r + S.r + 5, w: Math.max(0, w + k.warn - o.t - 0.25), end: w + k.warn + k.burst - o.t });
      continue;
    }
    if (o.mode === 'boss') {
      if (o.phase === 'aim' || o.phase === 'dive') th.push({ x: o.x, y: o.y, vx: 0, vy: 250, r: o.r + S.r + 7, w: o.phase === 'aim' ? o.at : 0, end: 9 });
      else if (o.phase === 'in' || o.phase === 'fight') th.push({ x: o.x, y: o.y, vx: 0, vy: 0, r: o.r + S.r + 6, w: 0, end: 9 });
      continue;
    }
    let vx = o.vx || 0, vy = o.vy || 0, hold = 0;
    if (o.mode === 'ground') { vx = 0; vy = f.speed; }
    if (o.mode === 'hover') { vx = 0; vy = 0; }
    if (o.mode === 'dive' && !o.aimed) {
      const d = Math.hypot(s.x - o.x, s.y - o.y) || 1;
      vx = (s.x - o.x) / d * o.sp;
      vy = Math.max(o.sp * 0.6, (s.y - o.y) / d * o.sp);
      hold = Math.max(0, 0.5 - o.t);
    }
    th.push({ x: o.x, y: o.y, vx, vy, r: o.r + S.r + 4, w: w + hold, end: 9 });
  }
  const g = def.goal.type, shootable = f.foes.filter(o => !(o.wait > 0) && f.hittable(o) && !(o.kind === 'cannon' && f.dome) && o.y < s.y - 8 && o.y > -4);
  let pick = null;
  if (g === 'hold') {
    const soon = o => (s.y - 8 - o.y) / Math.max(20, o.vy || 0) - Math.abs(o.x - s.x) / v;
    const fighters = shootable.filter(o => K.foes[o.kind].fighter && o.mode !== 'leave'), catchable = fighters.filter(o => soon(o) > 0);
    const kept = PICKS.get(f);
    pick = kept && catchable.includes(kept) ? kept : (catchable.length ? catchable : fighters).sort((a, c) => soon(a) - soon(c))[0];
  }
  if (!pick && g === 'cannons' && !f.dome) pick = shootable.filter(o => o.kind === 'cannon').sort((a, c) => Math.abs(a.x - s.x) - Math.abs(c.x - s.x))[0];
  if (!pick) pick = shootable.sort((a, c) => Math.abs(a.x - s.x) - Math.abs(c.x - s.x))[0];
  PICKS.set(f, pick);
  const tx = pick ? pick.x + (pick.vx || 0) * (s.y - pick.y) / K.shot.speed : K.w / 2, ty = g === 'hold' ? 135 : 180;
  const TIMES = [0.06, 0.14, 0.24, 0.36, 0.5, 0.66];
  let best = null;
  for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
    const n = Math.hypot(dx, dy) || 1;
    let risk = 0;
    for (const tau of TIMES) {
      const px = A.clamp(s.x + dx / n * v * tau, S.side, K.w - S.side), py = A.clamp(s.y + dy / n * v * tau, S.top, S.bottom);
      for (const h of th) {
        if (tau < h.w || tau > h.end) continue;
        const e = tau - h.w, d = Math.hypot(px - (h.x + h.vx * e), py - (h.y + h.vy * e));
        if (d < h.r) risk += 100 / (1 + tau * 3);
        else if (d < h.r + 10) risk += (h.r + 10 - d) * 0.8 / (1 + tau * 2);
      }
    }
    const qx = A.clamp(s.x + dx / n * v * 0.24, S.side, K.w - S.side), qy = A.clamp(s.y + dy / n * v * 0.24, S.top, S.bottom);
    const cost = risk + Math.abs(qx - tx) * 0.12 + Math.abs(qy - ty) * 0.05;
    if (!best || cost < best.cost) best = { dx, dy, cost, risk };
  }
  const dash = best.risk >= 60 && s.dashCool <= 0 && s.ion <= 0;
  return { dx: best.dx, dy: best.dy, fire: true, dash };
}

function sway(f) {
  return { dx: Math.sin(f.t * 0.8) > 0 ? 1 : -1, dy: 0, fire: true, dash: false };
}

function flight(id, seed, opts) {
  opts = opts || {};
  const f = new A.Flight({ id, seed, difficulty: opts.difficulty || 'normal', help: opts.help });
  const drive = opts.pilot || pilot;
  let inp = null;
  for (let i = 0; i < 60 * 600 && !f.over; i++) {
    if (i % 2 === 0) inp = drive(f);
    f.step(A.STEP, inp);
    inp.dash = false;
    f.take();
  }
  return { id, over: f.over, reason: f.reason, t: f.t, shield: f.ship.shield / f.ship.max, stats: f.stats, leaked: f.stats.leaked };
}

function flightWin(S, id, seed, res) {
  const help = A.DIFFICULTY[S.difficulty || 'normal'].help;
  for (let tries = 0; tries < 6; tries++) {
    const r = flight(id, seed + tries * 101, { difficulty: S.difficulty || 'normal', help: help && tries >= 2 });
    res.flights.push(r);
    if (r.over === 'win') return r;
    res.flightRetries++;
  }
  throw new Error('bot lost the flight ' + id + ' six times in a row');
}

function story(seed, opts) {
  opts = opts || {};
  const rnd = A.rng(seed), S = A.newState(), P = A.Script.build();
  let first = A.Scripts.pro.start;
  if (['ch1', 'ch2', 'int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'].includes(opts.start)) {
    A.Party.preset(S, opts.start, ['polite', 'cold', 'father'][seed % 3]);
    first = opts.start + '_start';
  }
  if (opts.setup) opts.setup(S);
  const st = new A.Script.Story(P, S, first);
  const drink = new Set(opts.drink || []);
  const res = { seed, end: false, maps: [], seen: new Set(), scenes: [], fights: 0, retries: 0, frames: 0, instinct: 0, maxSuspicion: 0, palace: [], activities: [], bets: [], maxSus: 0, exposed: false, flights: [], flightRetries: 0, repairs: [], asks: [], levels: {}, by: {}, S };
  let field = null;
  const activity = () => {
    const R = S.respite;
    if (!R || R.left <= 0) return false;
    const place = A.Respite.place(R.id), all = place.rooms.flatMap(room => A.Respite.options(S, R.id, room.id)).filter(o => o.enabled);
    const want = opts.plan && opts.plan[R.id] && opts.plan[R.id][R.count - R.left];
    const o = (want && all.find(x => x.act + (x.id ? ':' + x.id : '') === want)) || all[Math.floor(rnd() * all.length)];
    res.activities.push(o.act + (o.id ? ':' + o.id : ''));
    (res.by[R.id] = res.by[R.id] || []).push(o.act);
    const r = A.Respite.apply(S, o);
    st.call(r.label, r.ret);
    return true;
  };
  const arrange = () => {
    const order = A.Memory.solve().map(id => (A.Memory.has(S, id) ? id : null));
    const swaps = opts.palace === 'solve' ? 0 : Math.floor(rnd() * 5);
    for (let k = 0; k < swaps; k++) {
      const i = Math.floor(rnd() * order.length), j = Math.floor(rnd() * order.length);
      [order[i], order[j]] = [order[j], order[i]];
    }
    res.palace.push(A.Memory.arrange(S, order));
  };
  const drive = () => {
    for (let guard = 0; guard < 4000; guard++) {
      const e = st.next();
      res.maxSuspicion = Math.max(res.maxSuspicion, S.flags.suspicion || 0);
      if (e.type === 'say' || e.type === 'recall') continue;
      if (e.type === 'chapter') {
        res.levels[e.id] = S.party.length ? S.party[0].level : 0;
        if (opts.stop === e.id) throw new Done();
        continue;
      }
      if (e.type === 'choice') {
        if (st.pc.label === 'ch1_dose') {
          st.choose(drink.has(S.flags.day) ? 0 : 1, 'calm');
          continue;
        }
        const forced = opts.pick && opts.pick[st.pc.label];
        const k = forced !== undefined ? forced : Math.floor(rnd() * e.options.length), poses = e.lekku ? ['calm', 'show', ...e.lekku.gestures] : [undefined];
        st.choose(k, poses[Math.floor(rnd() * poses.length)]);
        continue;
      }
      if (e.type === 'battle') { battleWin(S, e.group, e.advantage, seed * 7 + res.fights, res); continue; }
      if (e.type === 'flight') { flightWin(S, e.id, seed * 17 + res.flights.length, res); continue; }
      if (e.type === 'memory') { if (e.what === 'palace') arrange(); continue; }
      if (e.type === 'cover') continue;
      if (e.type === 'respite') { A.Respite.start(S, e.id); activity(); continue; }
      if (e.type === 'return') { if (e.ui === 'respite' && !activity()) A.Respite.finish(S); continue; }
      if (e.type === 'forget') { A.Party.forget(S); continue; }
      if (e.type === 'map') throw new Left({ id: e.id, at: e.at });
      if (e.type === 'field') { if (field) field.refresh(); return; }
      if (e.type === 'end') throw new Done();
      if (e.type === 'credits') { res.ending = S.flags.ending; throw new Done(); }
    }
    throw new Error('story loops in ' + st.pc.label);
  };
  const settle = evs => {
    for (const ev of evs) {
      const where = field.map.id + ':' + (ev.obj || ev.to || ev.label || '');
      if (['lines', 'meditate', 'jump', 'scene', 'exit', 'collapse', 'break', 'fill'].includes(ev.type)) res.seen.add(where);
      if (ev.type === 'meditate' || ev.type === 'rest') A.Party.rest(S);
      if (ev.type === 'cover') {
        const r = A.Cover.add(S, ev.add, ev.why);
        if (r) res.maxSus = Math.max(res.maxSus, r.sus);
        if (r && r.exposed) { res.exposed = true; st.jump(A.Cover.def(S).exposed); drive(); }
      }
      if (ev.type === 'repair') {
        const def = A.REPAIRS[ev.puzzle], rot = A.Repair.start(ev.puzzle);
        for (const [x, y] of A.Repair.solve(def, rot)) A.Repair.turn(rot, x, y);
        if (!A.Repair.solved(def, rot)) throw new Error('bot could not fix ' + ev.puzzle);
        res.repairs.push(ev.puzzle);
        field.fixed(ev.obj);
      }
      if (ev.type === 'encounter') {
        battleWin(S, ev.group, ev.advantage, seed * 13 + res.fights, res);
        field.resolve(ev.obj, 'won');
      }
      if (ev.type === 'scene') { res.scenes.push(ev.label); st.jump(ev.label); drive(); }
      if (ev.type === 'exit') throw new Left({ id: ev.to, at: ev.at });
    }
  };
  const w = {
    S, rnd,
    field: () => field,
    act(inp) {
      if (S.cover && field.coverActive()) {
        const r = A.Cover.tick(S, 1 / 60);
        if (r) res.maxSus = Math.max(res.maxSus, r.sus);
        if (r && r.exposed) { res.exposed = true; st.jump(A.Cover.def(S).exposed); drive(); }
      }
      field.step(1 / 60, inp || {});
      if (++res.frames > (opts.frames || 400000)) throw new Error('field loops on ' + field.map.id);
      settle(field.take());
    },
    idle(n) { for (let i = 0; i < n; i++) w.act({}); },
    place(x, y) { field.p.x = x * TS + 8; field.p.y = y * TS + 14; field.trail = []; },
    face(dir) { w.act({ dx: dir === 'right' ? 1 : dir === 'left' ? -1 : 0, dy: dir === 'down' ? 1 : dir === 'up' ? -1 : 0 }); },
    goTo(tx, ty) {
      for (let tries = 0; tries < 12; tries++) {
        const route = field.path(field.playerTile(), [tx, ty]);
        if (!route) { w.idle(30); continue; }
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
    use(x, y, dir) { w.goTo(x, y); w.face(dir); w.act({ interact: true }); },
    hunt(max) {
      for (let guard = 0; guard < (max || 40) && field.enemiesLeft(); guard++) {
        const [px, py] = field.playerTile();
        const e = field.objs.filter(o => o.type === 'enemy').sort((a, c) => Math.hypot(a.px - px * TS, a.py - py * TS) - Math.hypot(c.px - px * TS, c.py - py * TS))[0];
        const tx = Math.floor(e.px / TS), ty = Math.floor((e.py - 3) / TS);
        try { w.goTo(tx, ty); } catch (x) { if (!(x instanceof Error) || !/stuck|no path/.test(x.message)) throw x; }
        w.idle(90);
      }
    }
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
  for (let hop = 0; hop < 80 && go; hop++) {
    try { runMap(go); } catch (x) {
      if (x instanceof Left) { go = x.to; continue; }
      if (x instanceof Done) { res.end = true; go = null; continue; }
      throw x;
    }
  }
  return res;
}


function maxBonds() {
  const order = A.RESPITE_ORDER, ids = Object.keys(A.BONDS);
  const plotAt = (id, rank) => order.indexOf(A.BONDS[id].ranks[rank - 1].before);
  const can = subset => {
    const memo = new Set();
    const go = (ri, ranks) => {
      const key = ri + ':' + ranks.join(',');
      if (memo.has(key)) return false;
      memo.add(key);
      const cur = ranks.slice();
      subset.forEach((id, k) => {
        let r = cur[k];
        while (r < A.BONDS[id].ranks.length && A.BONDS[id].ranks[r].from === 'plot' && plotAt(id, r + 1) <= ri) r++;
        cur[k] = r;
      });
      if (ri >= order.length) return subset.every((id, k) => cur[k] >= A.BONDS[id].ranks.length);
      const rid = order[ri], cap = A.RESPITES[rid].count;
      const ready = subset.map((id, k) => [id, k]).filter(([id, k]) => {
        const spec = A.BONDS[id].ranks[cur[k]];
        return cur[k] >= 1 && spec && spec.from === 'respite' && spec.at.includes(rid);
      });
      const pick = (from, left, next) => {
        if (go(ri + 1, next)) return true;
        if (!left) return false;
        for (let i = from; i < ready.length; i++) {
          const [, k] = ready[i], n2 = next.slice();
          n2[k]++;
          if (pick(i + 1, left - 1, n2)) return true;
        }
        return false;
      };
      return pick(0, cap, cur);
    };
    return go(0, subset.map(() => 0));
  };
  let best = [];
  for (let mask = 1; mask < 1 << ids.length; mask++) {
    const subset = ids.filter((id, i) => mask & (1 << i));
    if (subset.length <= best.length) continue;
    if (can(subset)) best = subset;
  }
  return { count: best.length, of: ids.length, bonds: best, blyMax: can(['bly']) };
}

function respiteP1() {
  const base = () => {
    const S = A.newState();
    A.Party.preset(S, 'int');
    S.chapter = 'int';
    A.Bonds.own(S, 'tholme').rank = 1;
    A.Respite.start(S, 'p1');
    return S;
  };
  const layouts = [];
  const walk = (S, path) => {
    if (!S.respite || S.respite.left <= 0) { layouts.push({ path, S }); return; }
    const all = A.Respite.place('p1').rooms.flatMap(room => A.Respite.options(S, 'p1', room.id)).filter(o => o.enabled);
    for (const o of all) {
      const S2 = JSON.parse(JSON.stringify(S));
      A.Respite.apply(S2, o);
      walk(S2, path.concat(o.act + (o.id ? ':' + o.id : '')));
    }
  };
  walk(base(), []);
  const uniq = new Map();
  for (const l of layouts) uniq.set(l.path.slice().sort().join(' + '), l);
  return [...uniq.values()];
}

function endings() {
  const ready = S => {
    A.Bonds.own(S, 'bly').rank = 4;
    S.flags.honoghr_deflected = true;
    S.flags.bly_told = true;
  };
  const plan = { p9: ['bond:bly', 'bond:ekria'], p10: ['bond:ekria', 'meditate', 'meditate'] };
  const runs = {
    felucia: story(41, { start: 'ch7', pick: { ch7_decide: 1, ch7_turn: 1 }, plan }),
    other: story(42, { start: 'ch7', setup: ready, pick: { ch7_decide: 1, ch7_turn: 0 }, plan }),
    dark: story(43, { start: 'ch7', setup: S => { S.dark = 100; }, pick: { ch7_decide: 1 }, plan: { p9: ['bond:bly', 'bond:ekria'], p10: ['bond:ekria', 'train:deflect3', 'train:barrier'] } }),
    endor: story(44, { start: 'ch7', pick: { ch7_decide: 0, ch7_turn: 1 }, plan: { p10: ['bond:bly', 'bond:ekria', 'meditate'] } })
  };
  return runs;
}

module.exports = { A, choose, reply, fight, chain, report, story, ROUTES, maxBonds, respiteP1, pilot, sway, flight, endings };

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
  if (mode === 'flights') {
    const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    for (const id of Object.keys(A.FLIGHTS)) {
      for (const diff of ['story', 'normal', 'master']) {
        const runs = Array.from({ length: n }, (_, i) => flight(id, 500 + i * 37, { difficulty: diff }));
        const won = runs.filter(r => r.over === 'win');
        console.log(`${id.padEnd(10)} ${diff.padEnd(6)} bot wins ${won.length}/${n}, time ${med(runs.map(r => r.t)).toFixed(0)} s (${Math.min(...runs.map(r => r.t)).toFixed(0)}-${Math.max(...runs.map(r => r.t)).toFixed(0)}), shields left ${(med(won.map(r => r.shield)) * 100 || 0).toFixed(0)} %, hits ${med(runs.map(r => r.stats.hits))}, dashes ${med(runs.map(r => r.stats.dashes))}, kills ${med(runs.map(r => r.stats.kills))}, leaked ${med(runs.map(r => r.leaked))}, lost: ${JSON.stringify(runs.filter(r => r.over !== 'win').map(r => r.reason + '@' + r.t.toFixed(0)))}`);
      }
      const lazy = Array.from({ length: n }, (_, i) => flight(id, 500 + i * 37, { pilot: sway }));
      console.log(`${id.padEnd(10)} sway pilot (no dodging) wins ${lazy.filter(r => r.over === 'win').length}/${n}, lost at ${med(lazy.map(r => r.t)).toFixed(0)} s`);
    }
  }
  if (mode === 'endings') {
    const r = endings();
    for (const [k, v] of Object.entries(r)) console.log(`${k.padEnd(8)} ending ${v.ending}, maps ${v.maps.join(',')}, bly ${A.Bonds.rank(v.S, 'bly')}, ekria ${A.Bonds.rank(v.S, 'ekria')}, dark ${v.S.dark}, endor ${!!v.S.flags.endor}, heart ${!!v.S.flags.heart_given}, level ${v.S.party[0].level}`);
  }
  if (mode === 'respite') {
    const p1 = respiteP1(), count = f => p1.reduce((m, l) => { const k = f(l); m[k] = (m[k] || 0) + 1; return m; }, {});
    console.log(`P1: ${p1.length} different sets of three activities`);
    console.log('Tholme rank after P1: ' + JSON.stringify(count(l => l.S.bonds.tholme.rank)) + ', Darkness after P1 (from 30): ' + JSON.stringify(count(l => l.S.dark)));
    console.log('trainings taken: ' + JSON.stringify(count(l => l.path.filter(p => p.startsWith('train')).length)) + ', archive read: ' + p1.filter(l => l.S.flags.archive_ch3).length + ', level after P1: ' + JSON.stringify(count(l => l.S.party[0].level)));
    const mb = maxBonds();
    console.log(`all respites P1-P10 by the plan tables: at most ${mb.count} of ${mb.of} bonds reach the top rank in one run (${mb.bonds.join(', ')}); Bly can reach rank 5: ${mb.blyMax}`);
  }
  if (mode === 'story') {
    const t0 = Date.now(), runs = [];
    for (let s = 1; s <= n; s++) {
      const pick = A.rng(s * 31 + 7), drink = [1, 2, 3, 4, 5].filter(() => pick() < 0.4);
      runs.push(story(s, { drink }));
    }
    const count = (f) => runs.reduce((m, r) => { const k = f(r); m[k] = (m[k] || 0) + 1; return m; }, {});
    console.log(`prologue to the credits: ${runs.filter(r => r.end && r.ending).length}/${n} reach the credits, ${((Date.now() - t0) / n).toFixed(0)} ms per run`);
    console.log(`fights per run: ${(runs.reduce((s, r) => s + r.fights, 0) / n).toFixed(1)}, lost and replayed: ${runs.reduce((s, r) => s + r.retries, 0)}, instinct per run: ${(runs.reduce((s, r) => s + r.instinct, 0) / n).toFixed(1)}`);
    console.log('tone at Pol: ' + JSON.stringify(count(r => r.S.flags.pol_tone)) + ', Secura bond points: ' + JSON.stringify(count(r => (r.S.bonds.secura || {}).pts || 0)) + ', Asante: ' + JSON.stringify(count(r => r.S.flags.asante_tone)));
    console.log('doses drunk: ' + JSON.stringify(count(r => r.S.flags.doses)) + ', tunic found in chapter 1: ' + runs.filter(r => !r.S.faded.includes(2)).length + ', all fragments back after the interlude: ' + runs.filter(r => r.S.memory.length === 11).length);
    console.log('Pol suspicion reached 100: ' + runs.filter(r => r.maxSuspicion >= 100).length + ', feeling: ' + JSON.stringify(count(r => r.S.flags.feeling)) + ', took the sabre: ' + runs.filter(r => ((r.S.bonds.vos || {}).pts || 0) > 0).length + ', warned: ' + JSON.stringify(count(r => r.S.flags.warned)));
    console.log('level at the end: ' + JSON.stringify(count(r => r.S.party[0].level)) + ', Darkness after the interlude: ' + JSON.stringify(count(r => Math.floor(r.S.dark / 10) * 10)));
    console.log('post: ' + JSON.stringify(count(r => r.S.flags.post)) + ', offered herself: ' + runs.filter(r => r.S.flags.offered).length + ', pale fragments after the interlude: ' + JSON.stringify(count(r => r.S.faded.length)) + ', bond with Tra Saa: ' + runs.filter(r => A.Bonds.rank(r.S, 'traa') === 1).length);
    const bets = runs.flatMap(r => r.bets), won = k => bets.filter(x => x.startsWith(k) && x.endsWith('won')).length, all = k => bets.filter(x => x.startsWith(k)).length;
    console.log(`chapter 3: bets fast ${won('fast')}/${all('fast')}, clean ${won('clean')}/${all('clean')}, exposed ${runs.filter(r => r.exposed).length}, highest suspicion ` + JSON.stringify(count(r => Math.floor(r.maxSus / 25) * 25)) + ', ranks Vos/Villie/Secura/Tholme: ' + JSON.stringify(count(r => ['vos', 'villie', 'secura', 'tholme'].map(id => A.Bonds.rank(r.S, id)).join('/'))));
    console.log('chapter 4: repairs ' + JSON.stringify(count(r => r.repairs.join('+'))) + ', ranks Vos/Kit/Bly: ' + JSON.stringify(count(r => ['vos', 'kit', 'bly'].map(id => A.Bonds.rank(r.S, id)).join('/'))) + ', sparring: ' + JSON.stringify(count(r => r.S.flags.duel_spar)) + ', masters kept on Hypori: ' + JSON.stringify(count(r => r.S.flags.duel_hypori_kept)) + ', Kamino flight retries: ' + runs.reduce((x, r) => x + r.flightRetries, 0) + ', level at the end of chapter 4: ' + JSON.stringify(count(r => r.levels.ch5 || r.S.party[0].level)) + ', P4: ' + JSON.stringify(count(r => (r.by.p4 || []).slice().sort().join('+'))));
    console.log('chapter 5: highest suspicion ' + JSON.stringify(count(r => Math.floor(r.maxSus / 25) * 25)) + ', exposed ' + runs.filter(r => r.S.flags.cover_tuulaa === 'exposed').length + ', purchases ' + JSON.stringify(count(r => ['jewel_earrings', 'jewel_pin', 'bought_gown'].filter(k => r.S.flags[k]).length)) + ', Aurra questions ' + JSON.stringify(count(r => r.asks.filter(x => x.startsWith('aurra')).length)) + ', lekku grabs ' + JSON.stringify(count(r => r.asks.filter(x => x === 'lekku').length)) + ', ranks Traa/Kit/Bly/Secura: ' + JSON.stringify(count(r => ['traa', 'kit', 'bly', 'secura'].map(id => A.Bonds.rank(r.S, id)).join('/'))) + ', P5: ' + JSON.stringify(count(r => (r.by.p5 || []).slice().sort().join('+'))) + ', P6: ' + JSON.stringify(count(r => (r.by.p6 || []).slice().sort().join('+'))) + ', Kit let go ' + runs.filter(r => A.Bonds.get(r.S, 'kit').letgo > 0).length + ', held ' + runs.filter(r => r.S.flags.kit_held).length + ', level at the end of chapter 5 ' + JSON.stringify(count(r => r.levels.ch6 || r.S.party[0].level)));
    console.log('chapter 7: endings ' + JSON.stringify(count(r => r.ending)) + ', Endor ' + runs.filter(r => r.S.flags.endor).length + ', ranks Bly/Ekria: ' + JSON.stringify(count(r => ['bly', 'ekria'].map(id => A.Bonds.rank(r.S, id)).join('/'))) + ', heart given ' + runs.filter(r => r.S.flags.heart_given).length + ', Darkness at the end ' + JSON.stringify(count(r => Math.floor(r.S.dark / 10) * 10)) + ', level ' + JSON.stringify(count(r => r.S.party[0].level)) + ', P9: ' + JSON.stringify(count(r => (r.by.p9 || []).slice().sort().join('+'))) + ', P10: ' + JSON.stringify(count(r => (r.by.p10 || []).slice().sort().join('+'))));
    console.log('chapter 6: level at the end of chapter 6 ' + JSON.stringify(count(r => r.levels.ch7 || r.S.party[0].level)) + ', Honoghr held ' + JSON.stringify(count(r => r.S.flags.duel_honoghr_turns)) + ', Bly covered ' + runs.filter(r => r.S.flags.duel_honoghr_bly === 'covered').length + ', shots deflected ' + runs.filter(r => r.S.flags.honoghr_deflected).length + ', Bly told why ' + runs.filter(r => r.S.flags.bly_told).length + ', Bok answers ' + runs.filter(r => r.asks.includes('bok')).length + ', mind memories ' + JSON.stringify(count(r => ['mind_medallion', 'mind_sanctum', 'mind_balcony', 'mind_kiffu'].filter(k => r.S.flags[k]).length)) + ', ranks Vos/Tholme/Bly/Kit: ' + JSON.stringify(count(r => ['vos', 'tholme', 'bly', 'kit'].map(id => A.Bonds.rank(r.S, id)).join('/'))) + ', Vos released ' + runs.filter(r => A.Bonds.released(r.S, 'vos')).length + ', P7: ' + JSON.stringify(count(r => (r.by.p7 || []).slice().sort().join('+'))) + ', P8: ' + JSON.stringify(count(r => (r.by.p8 || []).slice().sort().join('+'))));
    console.log('palace Will: ' + JSON.stringify(count(r => A.Memory.will(r.S))) + ', Tholme rank at the end: ' + JSON.stringify(count(r => A.Bonds.rank(r.S, 'tholme'))) + ', P1 activities: ' + JSON.stringify(count(r => (r.by.p1 || []).slice().sort().join('+'))));
  }
}
