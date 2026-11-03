(function (H) {
  'use strict';
  const HD = H.HD, N = HD.N, TS = 32;
  const FNV = 2166136261, HASH_EVERY = 300, THINK_EVERY = 5;
  const GOLDEN_MID = [3, 6, 12, 14, 17, 19];
  const GOLDEN_DIFF = ['normal', 'hard', 'easy'];
  const GOLDEN_TICKS = { boss: 1200, mid: 900 };

  const mixText = (h, text) => {
    let v = h;
    for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
    return v >>> 0;
  };
  const hex = v => (v >>> 0).toString(16).padStart(8, '0');

  function setupArena(o) {
    const run = HD.newRun(o);
    if (o.wave) run.wave = o.wave;
    for (const p of run.players) {
      if (o.lvl) { p.lvl = o.lvl; p.pts = o.lvl; }
      if (o.gold != null) p.gold = o.gold;
    }
    return new HD.Arena({ run });
  }

  function recordCmds(A) {
    const log = [], cmd = A.cmd;
    A.cmd = c => { log.push([A.tick, JSON.parse(JSON.stringify(c))]); cmd.call(A, c); };
    return log;
  }

  function replayLog(A, log, ticks, onTick) {
    let at = 0;
    while (A.tick < ticks && !A.over) {
      while (at < log.length && log[at][0] === A.tick) A.cmd(log[at++][1]);
      A.step();
      A.events.length = 0;
      if (onTick) onTick(A);
    }
    return A;
  }

  function goldenScenarios() {
    const heroes = Object.keys(HD.HEROES), threats = Object.keys(HD.THREATS), out = [];
    heroes.forEach((hero, i) => {
      for (const variant of [0, 1]) {
        const k = i * 2 + variant, round = Math.floor(k / 4), kind = k % 4;
        const wave = kind === 0 ? 10 : kind === 2 ? 20 : GOLDEN_MID[k % GOLDEN_MID.length];
        const first = kind === 2 ? round + 1 : round;
        out.push({
          hero, seed: 1000 + k * 37, diff: GOLDEN_DIFF[k % 3], wave, lvl: 20, gold: 30000, tr: variant, ei: variant,
          threats: kind === 2 ? [threats[first % threats.length], threats[round % threats.length]] : [threats[first % threats.length], threats[(first + 1) % threats.length]],
          ticks: wave === 10 || wave === 20 ? GOLDEN_TICKS.boss : GOLDEN_TICKS.mid
        });
      }
    });
    return out;
  }

  function goldenCrewScenarios() {
    const heroes = Object.keys(HD.HEROES), threats = Object.keys(HD.THREATS), out = [];
    for (let k = 0; k < 12; k++) {
      const n = 2 + k % 3, crew = Array.from({ length: n }, (_, i) => heroes[(k * 5 + i * 3) % heroes.length]);
      out.push({ hero: crew[0], heroes: crew, seed: 5000 + k * 41, diff: GOLDEN_DIFF[k % 3], wave: [10, 20, 5, 15][k % 4], lvl: 20, gold: 30000, tr: k % 2, ei: (k >> 1) % 2, threats: [threats[k % threats.length], threats[(k + 1) % threats.length]], ticks: GOLDEN_TICKS.boss });
    }
    return out;
  }

  function goldenGoods(rng, h) {
    switch (rng.int(5)) {
      case 0:
      case 1: {
        const set = rng.pick(Object.keys(H.RELIC_SETS));
        return { t: 'buy', id: 'relic', set, slot: rng.pick(Object.keys(H.RELIC_SETS[set].pieces)) };
      }
      case 2: {
        const list = HD.conesFor(H.CHARS[h.key].path);
        return list.length ? { t: 'buy', id: 'cone', cone: rng.pick(list) } : null;
      }
      case 3: return { t: 'buy', id: rng.pick(Object.keys(HD.DEVICES)) };
      default: return { t: 'buy', id: rng.pick(Object.keys(HD.SUPPLIES)) };
    }
  }

  function goldenThink(A, rng, sc, p) {
    const h = A.heroes[p], cmd = c => A.cmd(Object.assign({}, c, { p }));
    for (const slot of ['r', 'q', 'e', 't']) if (A.canUp(h, slot)) { cmd({ t: 'up', slot }); break; }
    const pk = A.needPick(h);
    if (pk) cmd({ t: 'pick', lvl: pk, i: pk === 10 ? sc.tr : sc.ei });
    if (A.nearShop(h) && !h.dead && rng() < 0.5) { const c = goldenGoods(rng, h); if (c) cmd(c); }
    if (A.phase === 'break' && rng() < 0.05) cmd({ t: 'early' });
    let foe = null, best = Infinity;
    for (const f of A.foes()) { const d = N.hypot(f.x - h.x, f.y - h.y); if (d < best) { best = d; foe = f; } }
    const K = HD.KITS[h.key], roll = rng.int(16);
    if (roll < 7) {
      const slot = rng.pick(['q', 'e', 'r']), spec = K[slot];
      if (spec && spec.aim === 'ally') cmd({ t: 'cast', slot, id: rng.pick(A.units.filter(u => !u.dead && u.side === 'ally')).uid });
      else if (foe) cmd({ t: 'cast', slot, id: foe.uid, x: foe.x, y: foe.y });
      else cmd({ t: 'cast', slot });
      return;
    }
    switch (roll) {
      case 7: if (foe) cmd({ t: 'goto', x: foe.x, y: foe.y }); else { const r = A.M.rifts[rng.pick(['n', 'w', 'e'])]; cmd({ t: 'goto', x: r[0] * TS + 16, y: r[1] * TS + 48 }); } break;
      case 8:
      case 9: if (foe) cmd({ t: 'attack', id: foe.uid }); break;
      case 10: cmd({ t: 'move', dx: rng.int(3) - 1, dy: rng.int(3) - 1 }); break;
      case 11: cmd(rng() < 0.5 ? { t: 'stop' } : { t: 'hold' }); break;
      case 12: cmd(Object.assign({ t: 'use', i: rng.int(6) }, foe ? { id: foe.uid, x: foe.x, y: foe.y } : {})); break;
      case 13: cmd({ t: 'target', id: foe ? foe.uid : null }); break;
      case 14: if (h.dead) cmd({ t: 'buyback' }); else if (rng() < 0.15) cmd({ t: 'recall' }); else { const tur = A.turrets.find(t => t.dead); if (tur) cmd({ t: 'restore', i: tur.idx }); } break;
      default: if (A.nearShop(h)) cmd(rng() < 0.7 ? { t: 'upgrade', i: rng() < 0.2 ? 'cone' : rng.int(6) } : { t: 'sell', i: rng.int(6) });
    }
  }

  function goldenStart(sc) {
    return { sc, A: setupArena(sc), rng: H.makeRandom(sc.seed ^ 0x5bd1e995), hash: FNV };
  }

  function goldenNote(S, seen) {
    const A = S.A;
    for (const e of A.events) {
      if (e.t === 'cast') seen.add('cast:' + A.heroes[e.p || 0].key + ':' + e.slot);
      else if (e.t === 'boss') { const b = A.units.find(u => u.uid === e.uid); if (b) seen.add('boss:' + b.key); }
      else if (e.t === 'buy' || e.t === 'use') seen.add(e.t + ':' + e.id);
      else if (e.t === 'pick') seen.add('pick:' + A.heroes[e.p || 0].key + ':' + e.lvl);
    }
  }

  function goldenTick(S, seen) {
    const A = S.A;
    if (A.tick % THINK_EVERY === 0) for (let p = 0; p < A.heroes.length; p++) goldenThink(A, S.rng, S.sc, p);
    A.step();
    if (seen) goldenNote(S, seen);
    A.events.length = 0;
    if (A.tick % HASH_EVERY === 0) S.hash = mixText(S.hash, A.stateHash());
  }

  function goldenJob(crew) {
    const list = crew ? goldenCrewScenarios() : goldenScenarios(), job = {
      done: false, ticks: 0, hash: null, parts: [], seen: new Set(), total: list.reduce((n, sc) => n + sc.ticks, 0),
      step(budget) {
        let left = budget;
        while (left > 0 && !job.done) {
          if (!cur) { if (at >= list.length) { job.hash = hex(whole); job.done = true; break; } cur = goldenStart(list[at++]); }
          if (cur.A.over || cur.A.tick >= cur.sc.ticks) {
            const part = hex(mixText(cur.hash, cur.A.stateHash()));
            job.parts.push(part);
            whole = mixText(whole, part);
            cur = null;
            continue;
          }
          goldenTick(cur, job.seen);
          job.ticks++;
          left--;
        }
        return job.done;
      }
    };
    let at = 0, cur = null, whole = FNV;
    return job;
  }

  function goldenRun(crew) {
    const job = goldenJob(crew);
    while (!job.step(2000));
    return job;
  }

  function goldenCheck() {
    const solo = goldenJob(false), crew = goldenJob(true), check = {
      done: false, ticks: 0, total: solo.total + crew.total, same: false, hash: null, crewHash: null, parts: [],
      step(budget) {
        (solo.done ? crew : solo).step(budget);
        check.ticks = solo.ticks + crew.ticks;
        if (solo.done && crew.done) {
          check.done = true;
          check.hash = solo.hash; check.crewHash = crew.hash;
          check.parts = solo.parts.concat(crew.parts);
          check.same = solo.hash === HD.GOLDEN && crew.hash === HD.GOLDEN_CREW;
        }
        return check.done;
      }
    };
    return check;
  }

  const NET = { draftMs: 30000, hashEvery: 60, steady: 3, far: 90, quick: 1.5, burstMs: 12 };
  const SLOTS = ['q', 'e', 't', 'r'], FIELD_MAX = 20000;
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const num = v => typeof v === 'number' && isFinite(v);
  const inField = v => num(v) && v >= 0 && v <= FIELD_MAX;
  const cell = v => Number.isInteger(v) && v >= 0 && v < 6;
  const uid = v => Number.isInteger(v) && v >= 0;
  const aim = c => {
    const out = {};
    if (uid(c.id)) out.id = c.id;
    if (inField(c.x) && inField(c.y)) { out.x = c.x; out.y = c.y; }
    return out;
  };
  const CLEAN = {
    move: c => (num(c.dx) && num(c.dy) && Math.abs(c.dx) <= 1 && Math.abs(c.dy) <= 1 ? { dx: c.dx, dy: c.dy } : null),
    goto: c => (inField(c.x) && inField(c.y) ? { x: c.x, y: c.y } : null),
    attack: c => (uid(c.id) ? { id: c.id } : null),
    target: c => (c.id == null ? { id: null } : uid(c.id) ? { id: c.id } : null),
    stop: () => ({}),
    hold: c => (typeof c.on === 'boolean' ? { on: c.on } : {}),
    cast: c => (SLOTS.includes(c.slot) ? Object.assign({ slot: c.slot }, aim(c)) : null),
    up: c => (SLOTS.includes(c.slot) ? { slot: c.slot } : null),
    pick: c => (Number.isInteger(c.i) && c.i >= 0 && c.i < 2 ? (c.lvl === 10 || c.lvl === 20 ? { i: c.i, lvl: c.lvl } : { i: c.i }) : null),
    use: c => (cell(c.i) ? Object.assign({ i: c.i }, aim(c)) : null),
    buy: c => {
      if (c.id === 'relic') return own(H.RELIC_SETS, c.set) && own(H.RELIC_SETS[c.set].pieces, c.slot) ? { id: 'relic', set: c.set, slot: c.slot } : null;
      if (c.id === 'cone') return own(H.CONES, c.cone) ? { id: 'cone', cone: c.cone } : null;
      return own(HD.DEVICES, c.id) || own(HD.SUPPLIES, c.id) ? { id: c.id } : null;
    },
    upgrade: c => (c.i === 'cone' || cell(c.i) ? { i: c.i } : null),
    sell: c => (cell(c.i) ? { i: c.i } : null),
    recall: () => ({}),
    buyback: () => ({}),
    early: () => ({}),
    restore: c => (Number.isInteger(c.i) && c.i >= 0 && c.i < 3 ? { i: c.i } : null),
    away: c => ({ on: !!c.on }),
    refresh: c => (Number.isInteger(c.i) && c.i >= 0 && c.i < 3 ? { i: c.i } : null),
    take: c => (Number.isInteger(c.i) && c.i >= 0 && c.i < 3 ? { i: c.i } : null)
  };

  function netClean(c, seats) {
    if (!c || typeof c !== 'object' || !own(CLEAN, c.t) || !Number.isInteger(c.p) || c.p < 0 || c.p >= seats) return null;
    const out = CLEAN[c.t](c);
    return out ? Object.assign({ t: c.t, p: c.p }, out) : null;
  }

  class NetSession {
    constructor(o) {
      Object.assign(this, { code: o.code, seed: o.seed, diff: o.diff, seat: o.seat, ticks: o.ticks, turnMs: o.turnMs, names: o.names, send: o.send, onHash: o.onHash, clock: o.clock });
      this.count = o.names.length;
      this.draftTurns = Math.round(NET.draftMs / o.turnMs);
      this.onAck = null;
      this.threats = HD.rollThreats(o.seed);
      this.resyncs = 0;
      this.restart();
    }

    restart() {
      this.drafts = this.names.map((_, p) => HD.newRun({ seed: this.seed + p, diff: this.diff, threats: this.threats }));
      this.takes = this.names.map(() => null);
      this.awayAtStart = [];
      this.pending = new Map();
      this.n = 0; this.last = 0; this.left = 0; this.acc = 0;
      this.A = null; this.run = null; this.catching = false; this.waitLog = false; this.anyAway = false;
    }

    message(m) {
      if (m.op === 't') { if (!this.waitLog) this.feed(m); }
      else if (m.op === 'log') { this.waitLog = false; this.feedLog(m); }
    }

    feed(m) {
      if (m.n <= this.last) return;
      if (m.c) this.pending.set(m.n, m.c);
      this.last = m.n;
    }

    feedLog(m) {
      for (const e of m.turns) if (e[0] > this.n) this.pending.set(e[0], e.slice(1));
      if (m.upto > this.last) this.last = m.upto;
    }

    draftLeft() { return Math.round(Math.max(0, this.draftTurns - this.n) * this.turnMs / 10) / 100; }

    taken() { return this.takes.filter(Boolean); }

    take(p, i) {
      const card = this.drafts[p].draft.cards[i];
      this.takes[p] = card.hero;
      this.drafts[p].draft.pick = i;
      const taken = this.taken();
      this.drafts.forEach((R, q) => {
        if (this.takes[q]) return;
        for (const c of R.draft.cards) if (c.hero === card.hero) HD.draftSwap(R, c, taken);
      });
    }

    draftCmd(c) {
      if (c.t === 'away') { this.awayAtStart[c.p] = c.on; return; }
      if (this.takes[c.p]) return;
      if (c.t === 'refresh') HD.draftRefresh(this.drafts[c.p], c.i, this.taken());
      if (c.t === 'take') this.take(c.p, c.i);
    }

    startArena() {
      this.run = HD.newRun({ seed: this.seed, diff: this.diff, threats: this.threats, heroes: this.takes });
      this.A = new HD.Arena({ run: this.run });
      this.A.cmd = c => this.send(c);
      this.awayAtStart.forEach((on, p) => { if (on) this.A.queue.push({ t: 'away', on: true, p }); });
    }

    nextTurn() {
      this.n++;
      const cmds = this.pending.get(this.n) || [];
      this.pending.delete(this.n);
      if (cmds.some(raw => raw && raw.t === 'away' && raw.on)) this.anyAway = true;
      if (this.A) {
        for (const raw of cmds) {
          const c = netClean(raw, this.count);
          if (c) this.A.queue.push(c);
          if (this.onAck && raw && raw.p === this.seat && raw.seq != null) this.onAck(raw.seq);
        }
        this.left = this.ticks;
        return;
      }
      for (const raw of cmds) { const c = netClean(raw, this.count); if (c) this.draftCmd(c); }
      if (this.takes.every(Boolean)) { this.startArena(); return; }
      if (this.n < this.draftTurns) return;
      this.takes.forEach((hero, p) => { if (!hero) this.take(p, 0); });
      this.startArena();
    }

    credit() { return this.left + (this.last - this.n) * this.ticks; }

    stepOne(quiet) {
      if (!this.left) this.nextTurn();
      this.A.step();
      this.left--;
      if (quiet) this.A.events.length = 0;
      else if (this.A.tick % NET.hashEvery === 0 && this.onHash) this.onHash(this.A.tick, this.A.stateHash());
    }

    catchUp() {
      const t0 = this.clock();
      while (this.credit() > NET.steady && !this.A.over) {
        this.stepOne(true);
        if (this.clock() - t0 > NET.burstMs) break;
      }
      this.catching = this.credit() > NET.steady && !this.A.over;
      this.acc = 0;
    }

    advance(dt, drain) {
      while (!this.A && this.n < this.last) this.nextTurn();
      if (!this.A || this.A.over) return;
      const start = this.credit();
      if (this.catching || start >= NET.far) { this.catchUp(); return; }
      if (start <= 0) { this.acc = Math.min(this.acc + dt, HD.DT); return; }
      this.acc += dt * (start > NET.steady ? NET.quick : 1);
      while (this.acc >= HD.DT && this.credit() > 0 && !this.A.over) {
        this.stepOne(false);
        this.acc -= HD.DT;
        if (drain) drain();
      }
      if (this.credit() <= 0) this.acc = Math.min(this.acc, HD.DT);
    }
  }

  Object.assign(HD, { NET, netClean, NetSession, setupArena, recordCmds, replayLog, goldenScenarios, goldenCrewScenarios, goldenStart, goldenThink, goldenTick, goldenJob, goldenRun, goldenCheck });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
