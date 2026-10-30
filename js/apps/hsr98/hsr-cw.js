(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN, T = H.TUNING;
  const ZONES = ['on', 'off', 'bench'];
  const SIZE = { on: TUN.onField, off: TUN.offField, bench: TUN.bench };
  const COMBAT = ['fight', 'enc', 'boss'];

  const rnd = run => {
    let t = (run.rng = (run.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rint = (run, n) => Math.floor(rnd(run) * n);
  const pick = (run, list) => list[rint(run, list.length)];
  const range = (run, [lo, hi]) => lo + rint(run, hi - lo + 1);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const copiesOf = star => Math.pow(3, star - 1);
  const foeHp = (id, lvl, mul) => Math.round(T.enemyHp * H.ENEMIES[id].hp * H.grow(lvl) * (mul || 1));
  const idOf = s => String(s).split(':')[0];

  const costOf = u => (u.lv ? 5 : CW.UNITS[u.id].cost);
  const lvlMax = run => Math.min(TUN.maxLevel, (run && run.lvlCap) || TUN.maxLevel);
  const benchFree = run => { const b = run.board.bench, cap = Math.min(b.length, run.benchCap || b.length); for (let i = 0; i < cap; i++) if (!b[i]) return i; return -1; };

  function sellValue(u) {
    const cost = costOf(u), n = copiesOf(u.star);
    if (u.star === 1) return cost;
    return cost === 1 ? n : n * cost - 1;
  }

  const unitBonds = (u, ex) => {
    const d = CW.UNITS[u.id], out = d ? d.bonds.slice() : [];
    for (const it of u.items || []) { const b = CW.ITEMS[it.id] && CW.ITEMS[it.id].bond; if (b && !out.includes(b)) out.push(b); }
    if (!ex) return out;
    if (u.id === 'bronya' && ex.form === 'underworld' && out.includes('belobog')) out.splice(out.indexOf('belobog'), 1, 'underworld');
    if (u.id === 'yu') for (const k of (ex.wild || []).slice(0, u.star >= 3 ? 2 : 1)) if (!out.includes(k)) out.push(k);
    if (ex.mentor && CW.BONDS.mentor.members.includes(u.id) && !out.includes('mentor')) out.push('mentor');
    return out;
  };

  function keeperForm(units) {
    const n = k => new Set(units.filter(u => u.id !== 'bronya' && unitBonds(u).includes(k)).map(u => u.id)).size;
    return n('underworld') > n('belobog') ? 'underworld' : 'belobog';
  }

  function bondState(units, ex) {
    const e = Object.assign({ form: keeperForm(units) }, ex || {}), out = {};
    const list = e.peppy && e.peppy.length ? units.concat({ id: 'peppy', items: e.peppy }) : units;
    for (const [key, b] of Object.entries(CW.BONDS)) {
      const members = [...new Set(list.filter(u => unitBonds(u, e).includes(key)).map(u => u.id))];
      const n = members.length + ((e.plus && e.plus[key]) || 0);
      let tier = -1;
      b.steps.forEach((s, i) => { if (n >= s) tier = i; });
      out[key] = { n, tier, next: b.steps[tier + 1] || null, members };
    }
    return out;
  }

  function rankIndex(tier, sub) {
    let i = 0;
    for (let t = 0; t < tier; t++) i += CW.RANKS[t].subs;
    return i + clamp(sub, 1, CW.RANKS[tier].subs) - 1;
  }

  function rankDiff(tier, sub) {
    const R = CW.RANKS[tier];
    return R.diff + (sub - 1) + (R.code === 'A8' && sub >= 11 ? 3 : 0);
  }

  Object.assign(H.Game.prototype, {
    cw() {
      const s = this.state;
      if (!s.cw) s.cw = { run: null, hist: [], seen: {}, pick: { mode: 'standard', tier: 0, sub: 1 } };
      if (!s.cw.pick) s.cw.pick = { mode: 'standard', tier: 0, sub: 1 };
      return s.cw;
    },

    cwRun() {
      const run = this.cw().run;
      if (run && !run.bond) Object.assign(run, { step: run.step || 0, items: run.items || [], bond: { dna: 0, dnaAt: 0, geo: 0, geoAt: 0, echoes: [], orders: null, order: null, advPlane: -1, debt: null, jury: {} } });
      if (run && run.phase === 'battle' && !this.battle) run.phase = run.fight && run.fight.replay ? 'replay' : 'prep';
      return run;
    },

    cwRank(tier, sub) {
      const R = CW.RANKS[tier], row = CW.RANK_STATS[rankIndex(tier, sub)];
      return { tier, sub, code: R.code + '-' + sub, name: R.name, diff: rankDiff(tier, sub), row };
    },

    cwRankRules(tier) {
      const out = [];
      for (let t = 0; t <= tier; t++) out.push(...CW.RANKS[t].rules.map(text => ({ text, code: CW.RANKS[t].code, live: !/аффикс|Ключ/.test(text) })));
      return out;
    },

    cwNew(o = {}) {
      const mode = CW.MODES[o.mode] ? o.mode : 'standard', M = CW.MODES[mode];
      const tier = clamp(o.tier | 0, 0, CW.RANKS.length - 1), sub = clamp(o.sub || 1, 1, CW.RANKS[tier].subs);
      const seed = o.seed || this.rng.int(1e9) + 1;
      const hp = tier >= 5 ? TUN.startHpA5 : TUN.startHp;
      const run = {
        seed, rng: seed, mode, tier, sub, diff: rankDiff(tier, sub), opps: [], plane: 0, node: 0, nodes: [], nodeOpp: [], frenzy: [], strat: -1,
        hp, hpMax: hp, gold: M.gold, exp: 0, lvl: M.lvl, streak: 0, free: 0, lock: false, harvest: 0,
        shop: [], pool: {}, board: { on: Array(SIZE.on).fill(null), off: Array(SIZE.off).fill(null), bench: Array(SIZE.bench).fill(null) },
        uid: 0, phase: 'prep', offer: null, branches: null, fight: null, dmg: {}, spent: 0, earned: 0, wins: 0, losses: 0, fights: 0, last: null, bonus: null, step: 0, items: [],
        bond: { dna: 0, dnaAt: 0, geo: 0, geoAt: 0, echoes: [], orders: null, order: null, advPlane: -1, debt: null, jury: {} }
      };
      const opps = Object.keys(CW.OPPONENTS);
      while (opps.length && run.opps.length < 3) run.opps.push(opps.splice(rint(run, opps.length), 1)[0]);
      for (const id of CW.POOL) run.pool[id] = TUN.pool[CW.UNITS[id].cost];
      for (let i = 0; i < TUN.startUnits; i++) {
        const id = this.cwDraw(run, rnd(run) < 0.7 ? 1 : 2, i ? null : d => d.role === 'a' && d.pos !== 'off');
        if (!id) continue;
        run.pool[id]--;
        const u = { uid: ++run.uid, id, star: 1 };
        const row = CW.UNITS[id].pos === 'off' ? 'off' : 'on';
        const zone = run.board[row].indexOf(null) >= 0 ? row : 'off';
        run.board[zone][run.board[zone].indexOf(null)] = u;
      }
      run.inv = []; run.iuid = 0;
      this.cwInvAdd(run, tier >= 6 ? 'key' : 'keyP');
      this.cwEnterPlane(run);
      this.cwRollShop(run);
      this.cwBeginNode(run);
      const C = this.cw();
      C.pick = { mode, tier, sub };
      C.run = run;
      return run;
    },

    cwEnterPlane(run) {
      const M = CW.MODES[run.mode];
      run.nodes = M.planes[run.plane].map(k => (k === 'enc' && run.tier < 2 ? 'fight' : k));
      run.node = 0;
      run.nodeOpp = run.nodes.map(k => (k === 'boss' ? run.opps[run.plane] : COMBAT.includes(k) ? pick(run, run.opps) : k === 'reward' ? 'venture' : null));
      run.strat = run.nodes.indexOf('fight');
      run.frenzy = [];
      if (run.tier >= 7) {
        const spots = run.nodes.map((k, i) => i).filter(i => run.nodes[i] !== 'reward');
        for (let n = 0; n < TUN.frenzy.max && spots.length; n++) {
          let i = spots.splice(rint(run, spots.length), 1)[0];
          while (i < run.nodes.length && !COMBAT.includes(run.nodes[i])) i++;
          if (i < run.nodes.length && !run.frenzy.includes(i)) run.frenzy.push(i);
        }
      }
    },

    cwBeginNode(run) {
      run.phase = 'prep';
      run.bonus = null;
      this.cwNodeItems(run);
      const bd = run.bond, st = this.cwBonds(run);
      bd.order = null;
      bd.orders = st.hares.tier >= 0 && CW.NODE[this.cwNodeKind(run)].fight ? this.cwRollOrders(run) : null;
      if (bd.debt && run.step >= bd.debt.due) {
        const pay = Math.min(run.gold, bd.debt.amount), rest = bd.debt.amount - pay;
        run.gold -= pay;
        run.hp = Math.max(1, run.hp - rest);
        run.debtPaid = { gold: pay, hp: rest };
        bd.debt = null;
      }
      const M = CW.MODES[run.mode];
      if (M.nodeGold) {
        run.gold += M.nodeGold;
        run.earned += M.nodeGold;
        run.bonus = { gold: M.nodeGold, exp: M.nodeExp, ups: this.cwAddExp(run, M.nodeExp) };
      }
    },

    cwRollOrders(run) {
      const ids = CW.ORDERS.map(o => o.id), out = [];
      while (out.length < 3 && ids.length) out.push(ids.splice(rint(run, ids.length), 1)[0]);
      return out;
    },

    cwPickOrder(id) {
      const run = this.cwRun();
      if (!run || !run.bond.orders || !run.bond.orders.includes(id) || run.phase !== 'prep') return false;
      run.bond.order = id;
      return true;
    },

    cwCanAdvance(run) { return !!run && this.cwBonds(run).hares.tier >= 1 && run.bond.advPlane !== run.plane && !run.bond.debt; },

    cwTakeAdvance() {
      const run = this.cwRun(), H2 = CW.BONDS.hares;
      if (!this.cwCanAdvance(run) || run.phase !== 'prep') return false;
      run.gold += H2.advance;
      run.earned += H2.advance;
      run.bond.advPlane = run.plane;
      run.bond.debt = { due: run.step + H2.debtNodes, amount: H2.debt };
      return true;
    },

    cwGrant(run, g, rec, why) {
      const name = id => H.CHARS[CW.UNITS[id].kitOn].name, give = id => { if (this.cwRoomFor(run, id)) { this.cwGive(run, id); rec.bondHeroes.push(name(id)); } else rec.bondGold += CW.UNITS[id].cost; };
      if (g.gold) rec.bondGold += g.gold;
      if (g.free) run.free += g.free;
      if (g.exp) rec.bondUps = (rec.bondUps || 0) + this.cwAddExp(run, g.exp);
      for (const c of g.heroes || []) { const id = this.cwDraw(run, c); if (id) give(id); }
      if (g.hero && run.pool[g.hero] > 0) give(g.hero);
      for (const it of g.items || []) { this.cwGift(run, it); rec.bondItems = (rec.bondItems || 0) + 1; }
      if (g.allFive) for (const id of CW.POOL.filter(x => CW.UNITS[x].cost === 5)) {
        if (run.pool[id] < 3 || benchFree(run) < 0) { rec.bondGold += 5; continue; }
        run.pool[id] -= 3;
        run.board.bench[benchFree(run)] = { uid: ++run.uid, id, star: 2 };
        rec.bondHeroes.push(name(id) + ' 2★');
      }
      rec.bondLines.push(why);
    },

    cwBondRewards(run, rec) {
      const f = run.fight, t = f.tiers || {}, B = CW.BONDS, bd = run.bond;
      rec.bondLines = []; rec.bondHeroes = []; rec.bondGold = 0;
      if (t.scholars != null) {
        const gain = Math.round(f.members.scholars.reduce((a, s) => a + B.scholars.dna[s - 1], 0) * B.scholars.dnaMul[t.scholars]);
        bd.dna += gain;
        rec.dna = gain;
        while (bd.dnaAt < B.scholars.rewards.length && bd.dna >= B.scholars.rewards[bd.dnaAt][0]) { const [need, g] = B.scholars.rewards[bd.dnaAt++]; this.cwGrant(run, g, rec, 'ДНК ' + need); }
      }
      if (t.underworld != null && rec.kind !== 'reward') {
        const gain = B.underworld.geo[t.underworld] * (f.win && !f.near ? 2 : 1);
        bd.geo += gain;
        rec.geo = gain;
        while (bd.geoAt < B.underworld.rewards.length && bd.geo >= B.underworld.rewards[bd.geoAt][0]) { const [need, g] = B.underworld.rewards[bd.geoAt++]; this.cwGrant(run, g, rec, 'Жила ' + need); }
      }
      if (t.fractsidus != null && f.echoGot && f.echoGot.length) {
        bd.echoes = bd.echoes.concat(f.echoGot).slice(-B.fractsidus.keep[t.fractsidus]);
        rec.echoes = f.echoGot.length;
      }
      if (t.hares != null && bd.order) {
        const o = bd.order, done = o === 'breaks' ? f.breaks >= 4 : o === 'fast' ? f.win && f.left != null && f.left >= 60 : o === 'chainElite' ? f.chainElite : o === 'noNear' ? f.win && !f.near : f.allDmg > 0 && f.offDmg / f.allDmg >= 0.3;
        rec.order = { id: o, done };
        if (done) { rec.bondGold += B.hares.pay[t.hares]; run.free += B.hares.free[t.hares]; }
      }
      if (t.conton != null && t.conton >= 1 && f.jury) bd.jury[run.plane] = Math.max(bd.jury[run.plane] || 0, f.jury);
      if (f.spCoins) rec.bondGold += f.spCoins;
      if (f.kitCoins) rec.bondGold += f.kitCoins;
      if (rec.kind === 'boss' && bd.jury[run.plane]) { rec.ores = (rec.ores || []).concat(this.cwOpenOres(run, ['ore2'])); rec.jury = true; }
      rec.coins += rec.bondGold;
    },

    cwQuit() {
      const run = this.cwRun();
      if (!run) return null;
      return this.cwClose(run, false);
    },

    cwClose(run, cleared) {
      const C = this.cw();
      const best = Object.entries(run.dmg).sort((a, b) => b[1] - a[1])[0];
      const total = CW.MODES[run.mode].planes.reduce((a, p) => a + p.length, 0);
      const done = CW.MODES[run.mode].planes.slice(0, run.plane).reduce((a, p) => a + p.length, 0) + Math.min(run.node, run.nodes.length);
      const sum = {
        cleared, mode: run.mode, rank: this.cwRank(run.tier, run.sub).code, hp: run.hp, hpMax: run.hpMax, plane: run.plane, node: done, nodes: total, wins: run.wins, losses: run.losses,
        spent: run.spent, earned: run.earned, best: best ? { id: best[0], dmg: Math.round(best[1]) } : null, lvl: run.lvl, team: this.cwDeployed(run).map(u => ({ id: u.id, star: u.star })),
        dmg: Object.entries(run.dmg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, v]) => ({ id, v: Math.round(v) })),
        bonds: Object.entries(this.cwBonds(run)).filter(([, s]) => s.tier >= 0).map(([k, s]) => ({ k, tier: s.tier })),
        strats: (run.strats || []).map(s => ({ id: s.id, q: s.q })), envs: (run.envs || []).slice(), affixes: (run.affixes || []).slice(),
        rankGain: cleared && run.mode === 'standard' ? (run.hp >= 70 ? 3 : run.hp >= 40 ? 2 : 1) : 0
      };
      C.hist.unshift(Object.assign({ at: Date.now() }, sum));
      C.hist = C.hist.slice(0, 20);
      C.run = null;
      if (cleared && this.profileCwWin) this.profileCwWin(sum.rank);
      return sum;
    },

    cwDraw(run, cost, only) {
      const ids = CW.POOL.filter(id => CW.UNITS[id].cost === cost && run.pool[id] > 0 && (!only || only(CW.UNITS[id])));
      if (!ids.length) return null;
      let r = rnd(run) * ids.reduce((a, id) => a + run.pool[id], 0);
      for (const id of ids) { r -= run.pool[id]; if (r < 0) return id; }
      return ids[ids.length - 1];
    },

    cwCostRoll(run, lvl) {
      const odds = TUN.shopOdds[Math.min(TUN.shopOdds.length - 1, lvl)].slice();
      const have = c => CW.POOL.some(id => CW.UNITS[id].cost === c && run.pool[id] > 0);
      for (let c = 5; c >= 1; c--) if (!have(c) && odds[c - 1]) { let to = c - 1; while (to >= 1 && !have(to)) to--; if (to >= 1) odds[to - 1] += odds[c - 1]; odds[c - 1] = 0; }
      const total = odds.reduce((a, b) => a + b, 0);
      if (!total) return 0;
      let r = rnd(run) * total;
      for (let c = 1; c <= 5; c++) { r -= odds[c - 1]; if (r < 0) return c; }
      return 1;
    },

    cwOdds(run) {
      const odds = TUN.shopOdds[Math.min(TUN.shopOdds.length - 1, run.lvl)];
      return odds.map((v, i) => ({ cost: i + 1, v, here: true })).filter(o => o.v > 0);
    },

    cwRollShop(run) {
      run.shop = [];
      for (let i = 0; i < TUN.shopSize; i++) {
        const cost = this.cwCostRoll(run, run.lvl);
        run.shop.push(cost ? this.cwDraw(run, cost) : null);
      }
    },

    cwPrepOpen(run, what) {
      if (!run) return false;
      if (run.phase === 'prep') return true;
      return run.phase === 'replay' && what === 'move';
    },

    cwRefresh() {
      const run = this.cwRun();
      if (!this.cwPrepOpen(run)) return false;
      if (run.free > 0) run.free--;
      else {
        if (run.gold < TUN.refreshCost) return false;
        run.gold -= TUN.refreshCost;
        run.spent += TUN.refreshCost;
      }
      run.lock = false;
      this.cwRollShop(run);
      return true;
    },

    cwToggleLock() {
      const run = this.cwRun();
      if (!this.cwPrepOpen(run)) return false;
      run.lock = !run.lock;
      return run.lock;
    },

    cwNeed(run) {
      if (run.lvl >= lvlMax(run)) return 0;
      const n = TUN.levelExp[run.lvl];
      return run.tier >= 5 ? Math.ceil(n * TUN.rankExpMul) : n;
    },

    cwAddExp(run, n) {
      let ups = 0;
      run.exp += n;
      while (run.lvl < lvlMax(run) && run.exp >= this.cwNeed(run)) { run.exp -= this.cwNeed(run); run.lvl++; ups++; }
      if (run.lvl >= lvlMax(run)) run.exp = 0;
      return ups;
    },

    cwBuyExp() {
      const run = this.cwRun();
      if (!this.cwPrepOpen(run) || run.lvl >= lvlMax(run) || run.gold < TUN.expCost) return null;
      run.gold -= TUN.expCost;
      run.spent += TUN.expCost;
      return { ups: this.cwAddExp(run, TUN.expPerBuy) };
    },

    cwUnits(run) {
      const out = [];
      for (const z of ZONES) run.board[z].forEach((u, i) => { if (u) out.push({ zone: z, i, u }); });
      return out;
    },

    cwDeployed(run) { return run.board.on.concat(run.board.off).filter(Boolean); },

    cwTeamSize(run) { return Math.min(CW.TEAM_CAP, run.lvl + this.cwGems(run)); },

    cwBonds(run) { return bondState(this.cwDeployed(run), this.cwBondEx ? this.cwBondEx(run) : null); },

    cwSellValue(u) { return sellValue(u); },

    cwRoomFor(run, id) { return benchFree(run) >= 0 || this.cwUnits(run).filter(x => x.u.id === id && x.u.star === 1).length >= 2; },

    cwCanBuy(i) {
      const run = this.cwRun(), id = run && run.shop[i];
      if (!id) return 'empty';
      if (!this.cwPrepOpen(run)) return 'replay';
      if (run.gold < CW.UNITS[id].cost) return 'gold';
      if (!this.cwRoomFor(run, id)) return 'bench';
      return null;
    },

    cwGive(run, id) {
      run.pool[id]--;
      const u = { uid: ++run.uid, id, star: 1 };
      const at = benchFree(run);
      if (at >= 0) run.board.bench[at] = u;
      else run.extra = u;
      return { u, merged: this.cwMerge(run) };
    },

    cwBuy(i) {
      const run = this.cwRun();
      if (this.cwCanBuy(i)) return null;
      const id = run.shop[i], cost = CW.UNITS[id].cost;
      run.gold -= cost;
      run.spent += cost;
      run.shop[i] = null;
      return this.cwGive(run, id);
    },

    cwSell(zone, i) {
      const run = this.cwRun(), u = run && run.board[zone] && run.board[zone][i];
      if (!u || !this.cwPrepOpen(run)) return 0;
      const v = sellValue(u);
      run.gold += v;
      run.pool[u.id] += copiesOf(u.star);
      run.board[zone][i] = null;
      for (const it of u.items || []) this.cwInv(run).push(it);
      return v;
    },

    cwMove(fz, fi, tz, ti) {
      const run = this.cwRun();
      if (!this.cwPrepOpen(run, 'move')) return 'phase';
      const b = run.board, a = b[fz][fi], t = b[tz][ti];
      if (!a || (fz === tz && fi === ti)) return 'same';
      const deploy = z => z === 'on' || z === 'off';
      if (!deploy(fz) && deploy(tz) && !t && this.cwDeployed(run).length >= this.cwTeamSize(run)) return 'team';
      b[fz][fi] = t;
      b[tz][ti] = a;
      return null;
    },

    cwPlace(fz, fi) {
      const run = this.cwRun(), u = run && run.board[fz][fi];
      if (!u) return 'empty';
      const pos = CW.UNITS[u.id].pos;
      const order = fz === 'bench' ? (pos === 'off' ? ['off', 'on'] : ['on', 'off']) : fz === 'on' ? ['off'] : ['on'];
      for (const z of order) {
        const at = run.board[z].indexOf(null);
        if (at >= 0) return this.cwMove(fz, fi, z, at);
      }
      return 'full';
    },

    cwMerge(run) {
      const out = [];
      for (let guard = 0; guard < 20; guard++) {
        const list = this.cwUnits(run);
        if (run.extra) list.push({ zone: 'extra', i: 0, u: run.extra });
        const groups = new Map();
        for (const x of list) {
          if (x.u.star >= TUN.maxStar[costOf(x.u)]) continue;
          const k = x.u.id + ':' + x.u.star;
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(x);
        }
        const g = [...groups.values()].find(v => v.length >= 3);
        if (!g) break;
        g.sort((a, b) => (b.u.lv ? 1 : 0) - (a.u.lv ? 1 : 0) || ZONES.concat('extra').indexOf(a.zone) - ZONES.concat('extra').indexOf(b.zone) || a.i - b.i);
        const keep = g[0];
        const carried = g.slice(0, 3).flatMap(x => x.u.items || []);
        keep.u.items = carried.slice(0, 3);
        for (const it of carried.slice(3)) this.cwInv(run).push(it);
        for (const x of g.slice(1, 3)) { if (x.zone === 'extra') run.extra = null; else run.board[x.zone][x.i] = null; }
        if (keep.zone === 'extra') {
          const at = benchFree(run);
          run.extra = null;
          if (at >= 0) run.board.bench[at] = keep.u;
        }
        keep.u.star++;
        out.push({ id: keep.u.id, star: keep.u.star });
      }
      if (run.extra) { const at = benchFree(run); if (at >= 0) run.board.bench[at] = run.extra; run.extra = null; }
      return out;
    },

    cwNodeKind(run) { return run.nodes[run.node]; },

    cwOpp(run, node) {
      const k = run.nodeOpp[node == null ? run.node : node];
      return k === 'venture' ? CW.VENTURE : CW.OPPONENTS[k] || null;
    },

    cwBaseMul(run, node) {
      const at = node == null ? run.node : node, row = CW.PLANE_MUL[run.plane];
      const combat = run.nodes.map((k, i) => i).filter(i => COMBAT.includes(run.nodes[i]));
      const n = combat.length;
      let v = row[0];
      combat.forEach((i, j) => { if (i <= at) v = row[n === row.length ? j : Math.round(j * (row.length - 1) / Math.max(1, n - 1))]; });
      return v;
    },

    cwCountdown(run, kind) {
      if (kind === 'boss') return TUN.countdown.boss[run.plane];
      if (kind === 'fight' || kind === 'enc') return TUN.countdown.fight[run.plane];
      return null;
    },

    cwInterest(gold, run) { return run && !CW.MODES[run.mode].interest ? 0 : Math.min(run && run.interestCap != null ? run.interestCap : TUN.interestCap, Math.floor(gold / TUN.interestStep)); },

    cwStreakGold(streak) { return TUN.streakGold[Math.min(TUN.streakGold.length - 1, streak)]; },

    cwFinalEnc(run) {
      const M = CW.MODES[run.mode];
      return run.plane === M.planes.length - 1 && run.nodes.lastIndexOf('enc') === run.node;
    },

    cwLastReward(run) {
      const M = CW.MODES[run.mode];
      return run.plane === M.planes.length - 1 && run.nodes.lastIndexOf('reward') === run.node;
    },

    cwPreview(run) {
      const kind = this.cwNodeKind(run), pay = !!CW.NODE[kind].pay;
      return {
        kind, opp: this.cwOpp(run), frenzy: run.frenzy.includes(run.node), strat: run.strat === run.node, harvest: kind === 'reward' && run.harvest > 0,
        interest: pay ? this.cwInterest(run.gold, run) : 0, streak: pay ? this.cwStreakGold(run.streak + 1) : 0, base: pay ? TUN.baseGold : 0, countdown: this.cwCountdown(run, kind)
      };
    },

    cwGo() {
      const run = this.cwRun();
      if (!run || (run.phase !== 'prep' && run.phase !== 'replay')) return 'phase';
      const kind = this.cwNodeKind(run);
      if (run.phase === 'replay') { if (!run.board.on.some(Boolean)) return 'field'; return this.cwFight(run.fight.branch) ? null : 'battle'; }
      if (kind === 'supply') { run.phase = 'supply'; run.offer = this.cwOffer(run); run.offerItems = run.offer.map(() => pick(run, CW.BASICS)); return null; }
      if (!run.board.on.some(Boolean)) return 'field';
      if (kind === 'enc') { run.phase = 'enc'; run.branches = this.cwBranches(run); return null; }
      return this.cwFight() ? null : 'battle';
    },

    cwBranches(run) {
      if (this.cwFinalEnc(run)) return [0, 1, 2, 3];
      const easy = rint(run, 2), hard = 2 + rint(run, 2);
      return [easy, hard];
    },

    cwPickBranch(i) {
      const run = this.cwRun();
      if (!run || run.phase !== 'enc' || run.branches[i] == null) return null;
      return this.cwFight(run.branches[i]);
    },

    cwHarvest() {
      const run = this.cwRun();
      if (!run || run.phase !== 'prep' || this.cwNodeKind(run) !== 'reward' || !run.harvest) return null;
      const rec = { kind: 'reward', win: true, harvest: true, progress: 1, node: run.node, plane: run.plane, base: 0, streak: 0, interest: 0, coins: TUN.harvestGold[run.plane], total: 0, exp: 0, hpLoss: 0, near: 0, ores: [] };
      rec.ores = this.cwOpenOres(run, ['ore1']);
      this.cwPay(run, rec);
      return this.cwFinish(run, rec);
    },

    cwOffer(run) {
      const out = [];
      for (let i = 0; i < 5; i++) {
        const cost = this.cwCostRoll(run, Math.min(TUN.maxLevel, run.lvl + 1));
        const id = cost ? this.cwDraw(run, cost) : null;
        if (id && !out.includes(id)) out.push(id);
        else if (id) { const alt = this.cwDraw(run, cost); if (alt && !out.includes(alt)) out.push(alt); }
      }
      return out;
    },

    cwTakeOffer(i) {
      const run = this.cwRun();
      if (!run || run.phase !== 'supply') return null;
      const id = run.offer[i];
      if (!id) return null;
      if (!this.cwRoomFor(run, id)) return { full: true };
      const got = this.cwGive(run, id);
      const gear = run.offerItems && run.offerItems[i];
      if (gear) this.cwInvAdd(run, gear);
      got.item = gear || null;
      run.offer = null;
      run.offerItems = null;
      run.last = { kind: 'supply', id };
      this.cwAdvance(run);
      return got;
    },

    cwSkipOffer() {
      const run = this.cwRun();
      if (!run || run.phase !== 'supply') return false;
      run.offer = null;
      run.last = { kind: 'supply', id: null };
      this.cwAdvance(run);
      return true;
    },

    cwWaves(run, kind) {
      const O = this.cwOpp(run), lv = ':' + TUN.lvl, n = (lo, hi) => lo + rint(run, hi - lo + 1);
      const pool = kind === 'reward' ? [...new Set(run.opps.flatMap(k => CW.OPPONENTS[k].normal))] : O.normal;
      const normals = k => Array.from({ length: k }, () => pick(run, pool) + lv);
      if (kind === 'boss') return O.phases.slice(0, run.plane === 2 ? 3 : 2).map(w => w.map(id => id + lv));
      if (kind === 'reward') { const w = normals(n(3, 4)); if (this.cwLastReward(run)) w.splice(1, 0, 'trotter' + lv); return [w]; }
      const ord = run.nodes.slice(0, run.node).filter(k => k === 'fight' || k === 'enc').length;
      const elite = () => { const w = normals(2); w.splice(1, 0, pick(run, O.elite) + lv); return w; };
      if (run.plane === 0 && ord < 2 && kind === 'fight') return [normals(2), normals(n(2, 3))];
      if (ord < 1 && kind === 'fight') return [normals(3), normals(3)];
      return [normals(3), elite()];
    },

    cwFoeMods(run, kind, branch) {
      const p = run.plane, mul = this.cwBaseMul(run), grow = mul / CW.PLANE_MUL[p][0];
      const row = CW.RANK_STATS[rankIndex(run.tier, run.sub)], diff = branch != null ? CW.BRANCHES[branch].diff : 0;
      const fz = run.frenzy.includes(run.node) && kind !== 'reward';
      const base = kind === 'reward' ? TUN.rewardFoeHp : kind === 'boss' ? TUN.bossHp : TUN.foeHp;
      return {
        hp: base * (TUN.tierHp[run.tier] || 1) * (kind === 'boss' ? TUN.bossPlaneHp : TUN.planeHp)[p] * grow * (1 + row[p * 3 + 1] / 100 * TUN.rankHpK) * (1 + diff * TUN.diffHp) * (fz ? TUN.frenzy.hp : 1),
        atk: TUN.foeAtk * TUN.planeAtk[p] * grow * (1 + row[p * 3] / 100 * TUN.rankAtkK) * (1 + diff * TUN.diffAtk) * (fz ? TUN.frenzy.atk : 1),
        spd: 1 + row[p * 3 + 2] / 100 * TUN.rankSpdK, frenzy: fz
      };
    },

    cwStars(run, waves, kind) {
      const S = TUN.starOdds, frac = run.node / Math.max(1, run.nodes.length - 1);
      return waves.map(w => w.map(s => {
        const d = H.ENEMIES[idOf(s)];
        if (run.tier < 1 || kind === 'reward' || d.boss) return 1;
        const p3 = run.plane ? clamp(S.p3Plane * run.plane + S.p3Node * frac + S.p3Tier * run.tier - S.p3Off, 0, S.p3Top) : 0;
        const p2 = clamp(S.base + S.plane * run.plane + S.node * frac + S.tier * run.tier, 0, S.top);
        const r = rnd(run);
        return r < p3 ? 3 : r < p3 + p2 ? 2 : 1;
      }));
    },

    cwStats(u, place) {
      const d0 = CW.UNITS[u.id], d = u.lv ? Object.assign({}, d0, { cost: 5 }) : d0, kit = place === 'off' ? d.kitOff : d.kitOn, key = u.id;
      const r = this.state.roster[key], mine = !!r && this.kitOf(key) === kit;
      const eid = mine ? r.eid || 0 : 0, G = TUN.gear;
      const b = this.baseStats(kit, TUN.lvl, eid);
      const st = Object.assign({}, b, { hp: b.hp * (1 + G.hp), atk: b.atk * (1 + G.atk), def: b.def * (1 + G.def), critR: b.critR + G.critR, critD: b.critD + G.critD, spd: b.spd + G.spd });
      if (mine) {
        const cs = this.charStats(key);
        for (const k of Object.keys(st)) if (typeof cs[k] === 'number' && cs[k] > st[k]) st[k] = cs[k];
      }
      const S = CW.STARS[d.cost], s = u.star - 1;
      st.hp = Math.round(st.hp * (1 + (d.hpHero ? S.hpH : S.hp)[s]));
      st.spd = Math.round(st.spd * (1 + S.spd[s]) * 10) / 10;
      st.atk = Math.round(st.atk); st.def = Math.round(st.def);
      const powRow = d.hpHero ? S.powH : S.pow, base1 = d.hpHero ? CW.STARS[1].powH : CW.STARS[1].pow;
      const pow = place === 'on' && d.pos === 'off' ? base1[s] : powRow[s];
      const healPow = d.role === 'l' ? CW.HEAL_POW[d.cost][s] : 60;
      const shieldPow = d.role === 's' ? CW.SHIELD_POW[d.cost][s] : 60;
      return {
        kit, stats: st, eid, pow, healPow, shieldPow,
        tr: mine ? this.traceSpec(key, TUN.lvl) : this.traceTrialSpec(kit, TUN.lvl),
        cone: mine ? this.coneEffect(key) : null,
        sets: mine ? this.planarSets(key) : null,
        wrong: (place === 'on' && d.pos === 'off') || (place === 'off' && d.pos === 'on')
      };
    },

    cwCompile(run, kind) {
      const bonds = this.cwBonds(run), units = {}, party = [], off = [], squad = this.cwSquadItems(run);
      const tierOf = k => bonds[k] ? bonds[k].tier : -1;
      const byId = {};
      for (const u of this.cwDeployed(run)) byId[u.uid] = u;
      const inBond = (id, k) => tierOf(k) >= 0 && bonds[k].members.includes(id);
      const B = CW.BONDS, deployed = this.cwDeployed(run), gifts = { dr: 0, onPow: 0, offPow: 0, spd: 0, lucky: 0 };
      const bex = Object.assign({ form: keeperForm(deployed) }, this.cwBondEx ? this.cwBondEx(run) : {});
      const tv = tierOf('travelers');
      if (tv >= 0) for (const id of bonds.travelers.members) { const g = B.travelers.gift[id]; if (g) gifts[g[0]] += g[1] * B.travelers.mul[tv]; }
      const cells = tierOf('energy') >= 3 ? null : tierOf('energy') >= 1 ? [run.board.on[0], run.board.off[0]].filter(Boolean) : [];
      const POW = ['scholars', 'underworld', 'inaba', 'section6', 'hares', 'fractsidus', 'conton', 'break', 'debuff'];
      const add = (u, place) => {
        const s = this.cwStats(u, place), d = CW.UNITS[u.id], mine = k => inBond(u.id, k);
        let hpK = 1 + (tierOf('heal') >= 0 ? B.heal.hp : 0);
        if (mine('hunters')) hpK += B.hunters.hp[tierOf('hunters')];
        if (mine('hpburn')) hpK += B.hpburn.hp[tierOf('hpburn')];
        s.stats.hp = Math.round(s.stats.hp * hpK);
        let spdK = 1;
        if (mine('xianzhou')) spdK += B.xianzhou.spd[tierOf('xianzhou')];
        if (tierOf('sp') >= 0) spdK += B.sp.spd[tierOf('sp')];
        spdK += gifts.spd * (mine('travelers') ? 2 : 1);
        s.stats.spd = Math.round(s.stats.spd * spdK * 10) / 10;
        let powPlus = 0;
        for (const k of POW) if (mine(k)) powPlus += B[k].pow[tierOf(k)];
        powPlus += (place === 'on' ? gifts.onPow : gifts.offPow) * (mine('travelers') ? 2 : 1);
        const it = this.cwApplyItems(run, u, place, s, this.cwItemStats(u, place, squad), squad);
        units[u.uid] = {
          uid: u.uid, id: u.id, star: u.star, cost: costOf(u), lv: !!u.lv, pos: d.pos, role: d.role, place, pow: s.pow, healPow: s.healPow + it.heal * 100, shieldPow: s.shieldPow + it.shield * 100, wrong: s.wrong,
          bonds: Object.keys(CW.BONDS).filter(k => inBond(u.id, k) && unitBondsOf(u, bex).includes(k)), powPlus: powPlus + it.pow, cell: cells === null || cells.includes(u), it,
          eid: s.eid || 0, hammer: u.hammer || 0, sigOwn: 0, sigSquad: 0
        };
        const sig = s.cone && H.CONES[s.cone.id] && H.CONES[s.cone.id].sig === u.id && place === 'off' && !s.wrong ? Math.min(5, s.cone.sup || 1) - 1 : -1;
        if (sig >= 0) { if (d.role === 'a' || u.id === 'silverwolf') units[u.uid].sigOwn = TUN.sigOwn[sig]; if (d.role !== 'a' || u.id === 'silverwolf') units[u.uid].sigSquad = TUN.sigSquad[sig] * (u.id === 'silverwolf' ? 2 / 3 : 1); }
        return s;
      };
      for (const u of run.board.on) {
        if (!u) continue;
        const s = add(u, 'on'), kit = H.CHARS[s.kit];
        party.push({ key: 'cw' + u.uid, charId: s.kit, name: kit.name, lvl: TUN.lvl, stats: s.stats, hp: s.stats.hp, energy: Math.min(kit.energy, Math.round(kit.energy * TUN.energyStart + units[u.uid].it.en)), cone: s.cone, sets: s.sets, tr: s.tr, eid: s.eid, trial: true, cw: u.uid });
      }
      for (const u of run.board.off) {
        if (!u) continue;
        const s = add(u, 'off');
        if (CW.UNITS[u.id].pos === 'on') continue;
        off.push({ uid: u.uid, kit: s.kit, stats: s.stats });
      }
      const tiers = {};
      for (const k of Object.keys(CW.BONDS)) if (tierOf(k) >= 0) tiers[k] = tierOf(k);
      const cats = tierOf('scholars') >= 0 ? deployed.filter(u => inBond(u.id, 'scholars')).reduce((a, u) => a + u.star, 0) : 0;
      return {
        kind, plane: run.plane, node: run.node, countdown: this.cwCountdown(run, kind), limit: kind === 'reward' ? 600 : null,
        near: run.tier >= 3 ? TUN.nearDeathA3 : TUN.nearDeathAv, base: TUN.baseDmg * this.cwBaseMul(run), tiers, units, off, party,
        bronyaForm: bex.form, gifts: tv >= 0 ? gifts : null, cats, fuxuan: deployed.some(u => u.id === 'fuxuan'), echoes: tierOf('fractsidus') >= 0 ? (run.bond.echoes || []).slice() : []
      };
    },

    cwFight(branch) {
      const run = this.cwRun();
      if (!run || this.battle) return null;
      const kind = this.cwNodeKind(run), O = this.cwOpp(run), replay = run.phase === 'replay' && run.fight;
      const cw = this.cwCompile(run, kind);
      const mods = replay ? run.fight.mods : this.cwFoeMods(run, kind, branch);
      const waves = replay ? run.fight.waves : this.cwWaves(run, kind);
      const stars = replay ? run.fight.stars : this.cwStars(run, waves, kind);
      const seed = replay ? run.fight.seed : this.rng.int(1e9) + 1;
      const phaseFx = kind === 'boss' ? O.fx.slice(0, waves.length) : waves.map(() => null);
      Object.assign(cw, { waves, stars, phaseFx, foeHp: mods.hp, spdMul: mods.spd, frenzy: mods.frenzy, branch: branch == null ? null : branch, big: kind === 'reward' ? waves[0].findIndex(s => idOf(s) === 'trotter') : -1 });
      run.fight = { kind, waves, stars, mods, seed, branch: cw.branch, replay: false };
      run.phase = 'battle';
      const b = this.startBattle({
        waves, lvl: TUN.lvl, party: cw.party, techs: cw.techs || [], noFlee: true, noContact: true, boss: kind === 'boss', seed,
        bg: kind === 'boss' ? O.bg[1] : O.bg[0], music: kind === 'boss' ? O.music : kind === 'reward' ? 'battle' : 'order', foeHp: mods.hp, foeAtk: mods.atk, cw: { kind }
      });
      b.cw = cw;
      return b;
    },

    cwProgress(b) {
      const cw = b.cw, lv = TUN.lvl, k = (b.cwInfo && b.cwInfo.hpK) || 1;
      const exp = (w, i) => w.reduce((a, s, j) => a + foeHp(idOf(s), lv, cw.foeHp) * k * TUN.starHp[(cw.stars[i][j] || 1) - 1], 0);
      let total = 0, done = 0;
      cw.waves.forEach((w, i) => {
        if (i < b.wave) { const v = exp(w, i); total += v; done += v; }
        else if (i === b.wave) for (const e of b.enemies) { total += e.maxHp; done += e.maxHp - Math.max(0, e.hp); }
        else total += exp(w, i);
      });
      return total ? clamp(done / total, 0, 1) : 1;
    },

    cwOpenOres(run, list) {
      const out = [];
      for (const kind of list) {
        const O = CW.ORES[kind], r = { ore: kind, gold: 0, hero: null, item: null };
        let roll = rnd(run), pickN = 0;
        while (pickN < O.odds.length - 1 && roll >= O.odds[pickN]) { roll -= O.odds[pickN]; pickN++; }
        if (pickN === 0) r.gold = range(run, O.gold);
        else if (pickN === 1) { const it = this.cwRandItem(run, O.item); this.cwInvAdd(run, it.id, it.sp); r.item = it; }
        else if (pickN === 2) {
          const id = this.cwDraw(run, pick(run, O.heroCost));
          if (id && O.star === 2 && run.pool[id] >= 3 && benchFree(run) >= 0) { run.pool[id] -= 3; run.board.bench[benchFree(run)] = { uid: ++run.uid, id, star: 2 }; r.hero = id; r.star = 2; }
          else if (id && this.cwRoomFor(run, id)) { const got = this.cwGive(run, id); r.hero = id; r.merged = got.merged; }
          else r.gold = range(run, O.gold);
        } else {
          const id = O.gem ? 'gem' : pick(run, ['red', 'blue']);
          this.cwInvAdd(run, id); r.item = { id, sp: false };
        }
        out.push(r);
      }
      return out;
    },

    cwBranchReward(run, rec, branch) {
      const B = CW.BRANCHES[branch];
      rec.branch = branch;
      rec.coins += B.gold + run.plane * 2;
      if (B.exp) rec.encExp = B.exp;
      if (B.free) { run.free += B.free; rec.free = B.free; }
      if (branch === 2) { const it = this.cwRandItem(run, 'basic'); this.cwInvAdd(run, it.id); rec.item = it; }
      if (branch === 3) { const id = rnd(run) < 0.5 ? 'gem' : 'boxAdv'; this.cwInvAdd(run, id); rec.item = { id, sp: false }; }
      if (B.hero) {
        const id = this.cwDraw(run, pick(run, B.hero));
        if (id && this.cwRoomFor(run, id)) { const got = this.cwGive(run, id); rec.hero = id; rec.merged = got.merged; }
        else if (id) rec.coins += CW.UNITS[id].cost;
      }
    },

    cwPay(run, rec) {
      rec.total = rec.base + rec.streak + rec.interest + rec.coins + rec.ores.reduce((a, o) => a + o.gold, 0);
      if (rec.frenzy && rec.win) { rec.frenzyGold = Math.round(rec.total * (TUN.frenzy.gold - 1)); rec.total += rec.frenzyGold; }
      run.gold += rec.total;
      run.earned += rec.total;
      if (rec.encExp) rec.ups = (rec.ups || 0) + this.cwAddExp(run, rec.encExp);
    },

    cwResolve(run) {
      const kind = run.fight.kind, win = !!run.fight.win, progress = run.fight.progress;
      const rec = {
        kind, win, progress, node: run.node, plane: run.plane, base: 0, streak: 0, interest: 0, coins: 0, total: 0, exp: 0, hpLoss: 0, near: run.fight.near || 0, ores: [],
        frenzy: run.frenzy.includes(run.node), strat: run.strat === run.node, opp: (this.cwOpp(run) || {}).short
      };
      if (kind === 'reward') {
        const kills = run.fight.kills || [];
        rec.coins = kills.reduce(a => a + range(run, TUN.rewardCoins), 0);
        const ores = [];
        for (const id of kills) if (id !== 'trotter' && rnd(run) < TUN.oreChance) ores.push(rnd(run) < 0.2 ? 'ore2' : 'ore1');
        for (let i = 0; i < (run.fight.bigOres || 0); i++) ores.push('ore1');
        if (run.fight.bigKill) ores.push('ore3');
        rec.ores = this.cwOpenOres(run, ores);
        run.harvest++;
      } else {
        rec.interest = this.cwInterest(run.gold, run);
        rec.base = TUN.baseGold;
        run.fights++;
        if (win) { run.streak++; run.wins++; rec.streak = this.cwStreakGold(run.streak); }
        else {
          run.streak = 0;
          run.losses++;
          const base = TUN.hpLoss[kind === 'boss' ? 'boss' : 'fight'][run.plane];
          rec.hpLoss = base + Math.ceil(base * (1 - progress));
          const minNeed = (kind === 'boss' && run.tier >= 3) || (kind === 'enc' && run.tier >= 4);
          if (minNeed && progress < TUN.minProgress) { rec.hpLoss *= TUN.minProgressMul; rec.minFail = true; }
          run.hp = Math.max(0, run.hp - rec.hpLoss);
        }
        rec.exp = TUN.expPerFight;
        rec.ups = this.cwAddExp(run, rec.exp);
        if (kind === 'enc' && run.fight.branch != null && (win || run.tier < 4 || progress >= TUN.minProgress)) this.cwBranchReward(run, rec, run.fight.branch);
      }
      if (run.fight.tiers) this.cwBondRewards(run, rec);
      this.cwPay(run, rec);
      return this.cwFinish(run, rec);
    },

    cwFinish(run, rec) {
      rec.hp = run.hp;
      rec.streakNow = run.streak;
      run.last = rec;
      run.fight = null;
      const planes = CW.MODES[run.mode].planes.length;
      if (run.hp <= 0) { rec.end = this.cwClose(run, false); return rec; }
      if (rec.kind === 'boss') rec.planeDone = run.plane + 1;
      if (rec.kind === 'boss' && run.plane === planes - 1) { rec.end = this.cwClose(run, rec.win); return rec; }
      this.cwAdvance(run);
      return rec;
    },

    cwEndBattle(b, ctx, out) {
      const run = this.cw().run, r = b.result;
      this.battle = null;
      this.battleCtx = null;
      if (!run || !run.fight) return out;
      const I = b.cwInfo || {};
      for (const [uid, v] of Object.entries(I.dmg || {})) { const u = b.cw.units[uid]; if (u) run.dmg[u.id] = (run.dmg[u.id] || 0) + v; }
      for (const [uid, n] of Object.entries(I.hammer || {})) { const x = this.cwUnits(run).find(q => String(q.u.uid) === String(uid)); if (x) x.u.hammer = (x.u.hammer || 0) + n; }
      Object.assign(run.fight, {
        win: !!r.win, progress: r.win ? 1 : this.cwProgress(b), near: I.near || 0, kills: (b.cwKills || []).slice(), bigOres: I.bigOres || 0, bigKill: !!I.bigKill,
        tiers: Object.assign({}, b.cw.tiers), kitCoins: I.kitCoins || 0, echoGot: I.echoGot || [], breaks: I.breaks || 0, left: I.left, chainElite: !!I.chainElite, offDmg: I.offDmg || 0, allDmg: I.allDmg || 0, spCoins: I.spCoins || 0, jury: I.jury || 0,
        members: { scholars: Object.values(b.cw.units).filter(u => u.bonds.includes('scholars')).map(u => u.star) }
      });
      if (!r.win && run.fight.kind !== 'reward') {
        run.phase = 'lost';
        out.cw = { kind: run.fight.kind, win: false, choice: true, progress: run.fight.progress, near: run.fight.near };
        out.lost = true;
        return out;
      }
      out.cw = this.cwResolve(run);
      return out;
    },

    cwAccept() {
      const run = this.cwRun();
      if (!run || run.phase !== 'lost' || !run.fight) return null;
      return this.cwResolve(run);
    },

    cwReplay() {
      const run = this.cwRun();
      if (!run || run.phase !== 'lost' || !run.fight) return false;
      run.phase = 'replay';
      run.fight.replay = true;
      return true;
    },

    cwAdvance(run) {
      run.node++;
      run.step++;
      if (run.node >= run.nodes.length) {
        run.plane++;
        this.cwEnterPlane(run);
      }
      if (run.lock) run.lock = false;
      else this.cwRollShop(run);
      this.cwBeginNode(run);
      this.emit({ t: 'autosave' });
    }
  });

  const P = H.Game.prototype;
  const endBattle0 = P.endBattle;
  P.endBattle = function () {
    const b = this.battle, ctx = this.battleCtx;
    if (b && b.over && b.cw && ctx && ctx.o && ctx.o.cw) {
      const out = { win: b.result.win, fled: false, lines: [], levelUps: [] };
      return this.cwEndBattle(b, ctx, out);
    }
    return endBattle0.call(this);
  };

  const unitBondsOf = unitBonds;
  Object.assign(CW, { sellValue, bondState, keeperForm, costOf, lvlMax, benchFree, rnd, rankIndex, rankDiff, unitBonds });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
