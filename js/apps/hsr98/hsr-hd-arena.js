(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN, TS = 32;
  const DT = 1 / TUN.hz;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lin = (p, n) => p[0] + p[1] * n;
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ROLE_LINE = { q: 'Навык', e: 'Техника', r: 'Абсолютная техника' };

  let gridCache = null;
  function gridOf() {
    if (gridCache) return gridCache;
    const M = HD.perron(), w = M.w, h = M.h, solid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = H.TILES[M.tiles[y][x]]; solid[y * w + x] = !t || t.solid ? 1 : 0; }
    const free = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !solid[y * w + x];
    const step = (x, y, dx, dy) => free(x + dx, y + dy) && (!dx || !dy || (free(x + dx, y) && free(x, y + dy)));
    const flow = new Float32Array(w * h).fill(Infinity), B = M.base, open = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!free(x, y)) continue;
      if (D8.some(([dx, dy]) => x + dx >= B.x0 && x + dx < B.x1 && y + dy >= B.y0 && y + dy < B.y1)) { flow[y * w + x] = 0; open.push(y * w + x); }
    }
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (flow[open[i]] < flow[open[bi]]) bi = i;
      const c = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      const cx = c % w, cy = (c - cx) / w;
      for (const [dx, dy] of D8) {
        if (!step(cx, cy, dx, dy)) continue;
        const n = (cy + dy) * w + cx + dx, d = flow[c] + (dx && dy ? 1.4142 : 1);
        if (d < flow[n]) { if (flow[n] === Infinity) open.push(n); flow[n] = d; }
      }
    }
    gridCache = { M, w, h, solid, flow, free, step };
    return gridCache;
  }

  function astar(G, sx, sy, tx, ty, limit) {
    const { w, step, free } = G;
    if (!free(tx, ty) || !free(sx, sy)) return null;
    const start = sy * w + sx, goal = ty * w + tx;
    if (start === goal) return [];
    const g = new Map([[start, 0]]), from = new Map(), heap = [[0, start]], closed = new Set();
    const hOf = i => { const x = i % w, y = (i - x) / w, dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy); };
    const push = it => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    let n = 0;
    while (heap.length && n < limit) {
      const [, c] = pop();
      if (closed.has(c)) continue;
      closed.add(c); n++;
      if (c === goal) {
        const out = [];
        for (let k = goal; k !== start; k = from.get(k)) out.push(k);
        return out.reverse().map(k => ({ x: (k % w) * TS + 16, y: Math.floor(k / w) * TS + 16 }));
      }
      const cx = c % w, cy = (c - cx) / w;
      for (const [dx, dy] of D8) {
        if (!step(cx, cy, dx, dy)) continue;
        const nb = (cy + dy) * w + cx + dx, ng = g.get(c) + (dx && dy ? 1.4142 : 1);
        if (closed.has(nb) || (g.has(nb) && g.get(nb) <= ng)) continue;
        g.set(nb, ng); from.set(nb, c); push([ng + hOf(nb), nb]);
      }
    }
    return null;
  }

  function heroAttrs(id, lvl) {
    const k = H.CHARS[id], d = HD.HEROES[id], b = k.base, n = lvl - 1, r1 = v => Math.round(v * 10) / 10;
    const a = {
      str: Math.round(8 + b.hp / 15) + n * r1(1.4 + (b.hp - 120) / 100),
      agi: Math.round(b.spd / 6) + n * r1(1.2 + (b.spd - 90) / 30),
      int: Math.round(8 + k.energy / 12) + n * r1(1.2 + (k.energy - 90) / 100)
    };
    a[d.main] = TUN.mainStart + TUN.mainGrow * n;
    return a;
  }

  function heroStats(id, lvl, bonus) {
    const k = H.CHARS[id], d = HD.HEROES[id], b = k.base, a = heroAttrs(id, lvl);
    if (bonus) a[d.main] += bonus;
    return {
      str: a.str, agi: a.agi, int: a.int, main: d.main,
      hpMax: 100 + b.hp + TUN.hpPerStr * a.str, regen: TUN.regenBase + TUN.regenPerStr * a.str,
      armor: b.def / 20 + TUN.armorPerAgi * a.agi, enMax: TUN.enBase + TUN.enPerInt * a.int, enRegen: TUN.enRegenBase + TUN.enRegenPerInt * a.int,
      dmg: b.atk / 3 + a[d.main], bat: d.melee ? TUN.batMelee : TUN.batRanged, spd: 150 + (b.spd - 90) * 1.5, range: d.range
    };
  }

  function foeStats(id, lvl, diff) {
    const e = H.ENEMIES[id], f = HD.FOES[id], n = Math.max(0, lvl - 1);
    const a = { str: (TUN.foeStrBase + TUN.foeStrGrow * n) * e.hp, agi: (e.spd - 80) / TUN.foeAgiDiv + TUN.foeAgiGrow * n, int: TUN.foeIntBase + TUN.foeIntGrow * n };
    const boss = !!e.boss, elite = !!e.elite;
    const hp = (TUN.foeHpK * e.hp + TUN.hpPerStr * a.str) * diff.hp * TUN.foeHp * (boss ? TUN.bossHp * (f.hpK || 1) : 1) * (elite ? TUN.eliteHp : 1);
    return {
      str: a.str, agi: a.agi, int: a.int, main: f.main, hpMax: Math.round(hp),
      dmg: (TUN.foeDmgK * e.atk * (1 + TUN.foeDmgGrow * n) + a[f.main]) * diff.dmg * TUN.foeDmg * (boss ? TUN.bossDmg * (f.dmgK || 1) : 1),
      armor: HD.ARMOR0[f.armor] + TUN.armorPerAgi * a.agi, spd: TUN.foeSpdBase + (e.spd - 80) * TUN.foeSpdK,
      bat: TUN.foeBat * 100 / e.spd, range: f.range || TUN.foeMelee, tough: e.tough
    };
  }

  const armorMul = a => (a >= 0 ? TUN.armorK / (TUN.armorK + a) : 2 - TUN.armorK / (TUN.armorK - a));
  const expNext = lvl => lin(TUN.expNext, lvl);
  const abilCap = (slot, lvl) => (slot === 'r' ? TUN.ultAt.filter(x => x <= lvl).length : Math.min(5, Math.ceil(lvl / 2)));

  class Arena {
    constructor(o) {
      const run = o.run;
      this.run = run;
      this.G = gridOf(); this.M = this.G.M;
      this.diff = HD.DIFFS[run.diff] || HD.DIFFS.normal;
      this.threats = run.threats;
      this.wave = run.wave;
      this.uid = 0; this.tick = 0; this.time = 0;
      this.units = []; this.shots = []; this.areas = []; this.events = []; this.queue = [];
      this.rng = H.makeRandom((run.seed * 7919 + run.wave * 104729) >>> 0);
      this.stats = Object.assign({ kills: 0, dmg: 0, heal: 0, gold: 0, spent: 0, raid: 0, time: 0, tfell: 0, bossMin: null }, run.stats);
      this.glow = { n: 0, w: 0, e: 0 };
      this.breakNo = 0; this.over = null; this.sched = []; this.waveFoes = 0; this.leaked = false;
      const M = this.M, B = M.base;
      this.base = this.add({ side: 'ally', kind: 'base', key: 'base', x: (B.x0 + B.x1) / 2 * TS, y: (B.y0 + B.y1) / 2 * TS, r: 0, rect: { x0: B.x0 * TS, y0: B.y0 * TS, x1: B.x1 * TS, y1: B.y1 * TS }, armorType: 'heavy', hpMax: this.diff.base, hp: run.base.hp, fixed: true, aggro: TUN.aggroBase, str: 0, agi: 0, int: 0 });
      this.turrets = M.turrets.map(([tx, ty], i) => {
        const t = this.add({ side: 'ally', kind: 'turret', key: 'turret' + i, idx: i, x: tx * TS + 16, y: ty * TS + 16, r: 16, armorType: 'heavy', atkType: 'magic', range: TUN.tRange, fixed: true, aggro: TUN.aggroTurret, str: 0, agi: 0, int: 0, atkCd: 0 });
        this.towerStats(t);
        const saved = run.towers[i];
        t.hp = saved == null ? t.hpMax : Math.min(t.hpMax, saved);
        t.dead = t.hp <= 0;
        return t;
      });
      this.baseStats();
      const p = run.players[0];
      const hero = this.add({ side: 'ally', kind: 'hero', key: p.hero, x: M.spawn[0] * TS + 16, y: M.spawn[1] * TS + 16, r: 11, aggro: H.PATHS[H.CHARS[p.hero].path].aggro, cd: { q: 0, e: 0, r: 0 }, atkCd: 0, still: 1, lossAcc: 0, voiceT: -99, recallCd: 0, recall: 0, respawn: 0, moveDir: null, path: null, standAt: null, hold: false, sel: null, forced: null, tal: {} });
      Object.assign(hero, { lvl: p.lvl, exp: p.exp, pts: p.pts, abil: Object.assign({ q: 0, e: 0, t: 0, r: 0 }, p.abil), picks: Object.assign({}, p.picks), gold: p.gold, items: p.items.map(it => (it ? Object.assign({}, it) : null)), cone: p.cone, deaths: p.deaths, bought: !!p.buyback, pl: 0 });
      if (hero.cone) hero.cone = Object.assign({}, hero.cone);
      if (HD.equip) HD.equip(this, hero, true); else this.heroStatsApply(hero, true);
      this.heroes = [hero];
      this.hero = hero;
      this.phase = run.phase === 'done' ? 'done' : 'break';
      this.breakT = this.wave === 1 ? TUN.firstBreak : this.diff.breakT;
    }

    add(u) {
      const o = Object.assign({ uid: ++this.uid, fx: [], dead: false, px: u.x, py: u.y, dir: 'down', vx: 0, vy: 0, armor: 0, hpMax: 1, hp: 1, en: 0, enMax: 0 }, u);
      if (o.hp == null) o.hp = o.hpMax;
      this.units.push(o);
      return o;
    }

    emit(e) { this.events.push(e); if (this.events.length > 600) this.events.splice(0, this.events.length - 600); }

    towerStats(t) {
      const max = Math.round(lin(TUN.tHp, this.wave));
      if (t.hpMax && !t.dead) t.hp += max - t.hpMax;
      t.hpMax = max; t.dmg = lin(TUN.tDmg, this.wave); t.armor = HD.ARMOR0.heavy; t.bat = TUN.tBat;
    }

    baseStats() { this.base.armor = lin(TUN.baseArmor, this.wave); }

    heroStatsApply(h, fresh) {
      const E = h.eq || {}, s = heroStats(h.key, h.lvl, E.attr || 0), oldMax = h.hpMax, oldEn = h.enMax;
      s.hpMax = s.hpMax * (1 + (E.hpP || 0)) + (E.hp || 0);
      s.armor = (s.armor + (E.armor || 0)) * (1 + (E.armorP || 0));
      Object.assign(h, { str: s.str, agi: s.agi, int: s.int, main: s.main, regen: s.regen, armor0: s.armor, enRegen: s.enRegen, dmg: s.dmg, bat: s.bat, spd0: s.spd, range: s.range, atkType: HD.HEROES[h.key].atk, armorType: HD.HEROES[h.key].armor, elem: H.CHARS[h.key].elem, melee: HD.HEROES[h.key].melee });
      h.hpMax = s.hpMax; h.enMax = s.enMax;
      if (fresh) { h.hp = h.hpMax; h.en = 0; } else { h.hp = Math.min(h.hpMax, h.hp + Math.max(0, h.hpMax - oldMax)); h.en = Math.min(h.enMax, h.en + Math.max(0, h.enMax - oldEn)); }
    }

    cmd(c) { this.queue.push(Object.assign({ p: 0 }, c)); }

    mods(h) { return h.mods || [HD.KITS[h.key]]; }

    each(h, name, ...args) { for (const M of this.mods(h)) if (M && M[name]) M[name](this, h, ...args); }

    fold(h, name, base, ...args) { let v = base; for (const M of this.mods(h)) if (M && M[name]) v = M.add ? v + M[name](this, h, ...args) : v * M[name](this, h, ...args); return v; }

    plus(h, name, ...args) { let v = 0; for (const M of this.mods(h)) if (M && M[name]) v += M[name](this, h, ...args); return v; }

    sum(u, k) { let v = 0; for (const f of u.fx) if (f.k === k) v += f.v * (f.stacks || 1); return v; }
    has(u, k) { return u.fx.some(f => f.k === k); }

    addFx(u, f) {
      if (u.dead) return null;
      if (f.k === 'stun') { const im = u.fx.find(x => x.k === 'ccImmune'); if (im) { if (im.once) u.fx.splice(u.fx.indexOf(im), 1); return null; } }
      if (f.k === 'slow' && u.fx.some(x => x.k === 'slowImmune')) return null;
      if (f.k === 'shield' && this.caster) f = Object.assign({}, f, { v: f.v * (1 + this.sum(this.caster, 'shieldP')) });
      if (f.k === 'shield') {
        const s = u.fx.find(x => x.k === 'shield');
        if (s) { if (f.v >= s.v) Object.assign(s, f); return s; }
      }
      const old = u.fx.find(x => x.n === f.n);
      if (old) {
        old.t = Math.max(old.t, f.t); old.v = f.v;
        if (f.max) old.stacks = Math.min(f.max, (old.stacks || 1) + 1);
        return old;
      }
      const n = Object.assign({ tickT: 1 }, f);
      if (f.max) n.stacks = 1;
      u.fx.push(n);
      return n;
    }

    stunned(u) { return u.fx.some(f => f.k === 'stun'); }
    armorOf(u) { return (u.armor0 != null ? u.armor0 : u.armor) + this.sum(u, 'armor'); }
    armorType(u) { return u.armorType === 'divine' && u.brokenT > 0 ? 'heavy' : u.armorType; }
    atkOf(u) { return (u.dmg + this.sum(u, 'atkFlat')) * (1 + this.sum(u, 'atk')); }
    moveSpd(u) { return Math.max(0, (u.spd0 != null ? u.spd0 : u.spd) * (1 + this.sum(u, 'mspd') - this.sum(u, 'slow'))); }
    interval(u) { return u.bat / Math.max(0.2, 1 + ((u.agi || 0) + 100 * (this.sum(u, 'aspd') - this.sum(u, 'slow'))) / 100); }
    chance(src, tgt, base) { const res = tgt.kind === 'boss' ? TUN.resBoss : tgt.side === 'foe' ? TUN.resFoe : this.sum(tgt, 'res'); return base * (1 + (src ? this.sum(src, 'ehr') : 0)) * (1 - res); }

    gap(a, b) {
      if (b.rect) { const x = clamp(a.x, b.rect.x0, b.rect.x1), y = clamp(a.y, b.rect.y0, b.rect.y1); return Math.hypot(a.x - x, a.y - y); }
      return Math.hypot(a.x - b.x, a.y - b.y) - (b.r || 0);
    }

    inPlaza(u) { const P = this.M.plaza, x = u.x / TS, y = u.y / TS; return x >= P.x0 && x < P.x1 && y >= P.y0 && y < P.y1; }
    nearShop(u) { const S = this.M.shop; return this.inPlaza(u) && Math.hypot(u.x - S[0] * TS, u.y - (S[1] * TS + 16)) <= TUN.shopR; }

    foes() { return this.units.filter(u => u.side === 'foe' && !u.dead); }
    byId(id) { return this.units.find(u => u.uid === id && !u.dead) || null; }

    inShape(a, u) {
      const p = u.rect ? { x: clamp(a.x, u.rect.x0, u.rect.x1), y: clamp(a.y, u.rect.y0, u.rect.y1) } : u;
      const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy), ur = u.rect ? 0 : u.r || 0;
      if (a.shape === 'line') {
        const c = Math.cos(a.ang), s = Math.sin(a.ang), along = dx * c + dy * s, side = Math.abs(-dx * s + dy * c);
        return along >= -ur && along <= a.len + ur && side <= a.w / 2 + ur;
      }
      if (d - ur > a.r) return false;
      if (a.shape === 'cone') {
        if (d < ur) return true;
        let da = Math.atan2(dy, dx) - a.ang;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        return Math.abs(da) <= a.arc / 2 + Math.asin(Math.min(1, ur / Math.max(1, d)));
      }
      return true;
    }

    unitsIn(shape, side) { return this.units.filter(u => !u.dead && u.side === side && this.inShape(shape, u)); }

    nearestFoe(x, y, r, filter) {
      let best = null, bd = r;
      for (const u of this.units) {
        if (u.dead || u.side !== 'foe' || (filter && !filter(u))) continue;
        const d = Math.hypot(u.x - x, u.y - y) - u.r;
        if (d <= bd) { bd = d; best = u; }
      }
      return best;
    }

    solidAt(x, y) { const G = this.G, cx = Math.floor(x / TS), cy = Math.floor(y / TS); return !G.free(cx, cy); }

    clearLine(x0, y0, x1, y1, r) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 8)), nx = d ? -(y1 - y0) / d : 0, ny = d ? (x1 - x0) / d : 0;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        if (this.solidAt(x, y) || (r && (this.solidAt(x + nx * r, y + ny * r) || this.solidAt(x - nx * r, y - ny * r)))) return false;
      }
      return true;
    }

    collide(u) {
      const G = this.G, r = u.r;
      for (let pass = 0; pass < 2; pass++) {
        const x0 = Math.floor((u.x - r) / TS), x1 = Math.floor((u.x + r) / TS), y0 = Math.floor((u.y - r) / TS), y1 = Math.floor((u.y + r) / TS);
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
          if (G.free(cx, cy)) continue;
          const px = clamp(u.x, cx * TS, cx * TS + TS), py = clamp(u.y, cy * TS, cy * TS + TS), dx = u.x - px, dy = u.y - py, d = Math.hypot(dx, dy);
          if (d >= r) continue;
          if (d > 0.001) { u.x += dx / d * (r - d); u.y += dy / d * (r - d); }
          else {
            const ox = u.x - (cx * TS + 16), oy = u.y - (cy * TS + 16);
            if (Math.abs(ox) > Math.abs(oy)) u.x = ox > 0 ? cx * TS + TS + r : cx * TS - r; else u.y = oy > 0 ? cy * TS + TS + r : cy * TS - r;
          }
        }
      }
      u.x = clamp(u.x, r, this.M.w * TS - r); u.y = clamp(u.y, r, this.M.h * TS - r);
    }

    stepTo(u, tx, ty, spd) {
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
      if (d < 0.5) return true;
      const s = Math.min(d, spd * DT);
      u.x += dx / d * s; u.y += dy / d * s;
      u.vx = dx / d; u.vy = dy / d;
      this.face(u, dx, dy);
      this.collide(u);
      return d <= s + 0.5;
    }

    face(u, dx, dy) { if (Math.abs(dx) > Math.abs(dy)) u.dir = dx > 0 ? 'right' : 'left'; else if (dy) u.dir = dy > 0 ? 'down' : 'up'; }

    dash(u, tx, ty, maxD, stopAt) {
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy), go = Math.min(maxD, Math.max(0, d - (stopAt || 0)));
      if (d < 1) return;
      const n = Math.ceil(go / 6);
      for (let i = 0; i < n; i++) {
        const ox = u.x, oy = u.y;
        u.x += dx / d * go / n; u.y += dy / d * go / n;
        this.collide(u);
        if (Math.hypot(u.x - ox, u.y - oy) < go / n * 0.3) break;
      }
      this.face(u, dx, dy);
      u.px = u.x; u.py = u.y;
    }

    push(u, fx, fy, d) {
      if (u.fixed || u.kind === 'boss' || u.dead) return;
      const dx = u.x - fx, dy = u.y - fy, l = Math.hypot(dx, dy) || 1, n = Math.ceil(d / 6);
      for (let i = 0; i < n; i++) { u.x += dx / l * d / n; u.y += dy / l * d / n; this.collide(u); }
    }

    flowTarget(u) {
      const G = this.G, w = G.w, cx = Math.floor(u.x / TS), cy = Math.floor(u.y / TS), here = G.flow[cy * w + cx];
      if (here === 0 || !isFinite(here)) {
        if (here === 0) { const B = this.base.rect; return { x: clamp(u.x, B.x0, B.x1), y: clamp(u.y, B.y0, B.y1) }; }
        let best = null, bd = Infinity;
        for (const [dx, dy] of D8) { const f = G.flow[(cy + dy) * w + cx + dx]; if (G.free(cx + dx, cy + dy) && f < bd) { bd = f; best = [cx + dx, cy + dy]; } }
        return best ? { x: best[0] * TS + 16, y: best[1] * TS + 16 } : { x: u.x, y: u.y };
      }
      const next = (x, y) => {
        let best = null, bd = G.flow[y * w + x];
        for (const [dx, dy] of D8) { if (!G.step(x, y, dx, dy)) continue; const f = G.flow[(y + dy) * w + x + dx]; if (f < bd) { bd = f; best = [x + dx, y + dy]; } }
        return best;
      };
      const n1 = next(cx, cy);
      if (!n1) return { x: u.x, y: u.y };
      const n2 = next(n1[0], n1[1]);
      if (n2 && this.clearLine(u.x, u.y, n2[0] * TS + 16, n2[1] * TS + 16, u.r)) return { x: n2[0] * TS + 16, y: n2[1] * TS + 16 };
      return { x: n1[0] * TS + 16, y: n1[1] * TS + 16 };
    }

    pathTo(u, x, y, limit) {
      const G = this.G, p = astar(G, Math.floor(u.x / TS), Math.floor(u.y / TS), Math.floor(x / TS), Math.floor(y / TS), limit);
      if (!p) return null;
      if (p.length) p[p.length - 1] = { x, y }; else p.push({ x, y });
      return p;
    }

    follow(u, path, spd) {
      while (path.length > 1 && this.clearLine(u.x, u.y, path[1].x, path[1].y, u.r - 2)) path.shift();
      const p = path[0];
      if (this.stepTo(u, p.x, p.y, spd)) path.shift();
      return !path.length;
    }

    rift(key) { const r = this.M.rifts[key]; return { x: r[0] * TS + 16, y: r[1] * TS + 16 }; }

    say(u, label) {
      const info = H.INFO && H.INFO[u.key];
      if (!info || !info.battle) return;
      const list = info.battle.filter(l => l.t === label && !l.need);
      if (!list.length) return;
      u.voiceT = this.time;
      this.emit({ t: 'say', uid: u.uid, text: list[this.rng.int(list.length)].text });
    }

    hit(src, tgt, o) {
      if (!tgt || tgt.dead || tgt.invuln) return 0;
      let amt = o.amt != null ? o.amt : o.m * this.atkOf(src);
      const type = o.type || (src && src.atkType) || 'weapon', elem = o.elem || (src && src.elem) || 'phys';
      let crit = false;
      const hero = src && src.kind === 'hero';
      if (src && !o.noCrit) {
        amt *= 1 + this.sum(src, 'dmg') + (o.kind ? this.sum(src, 'dmg_' + o.kind) : 0) + this.sum(src, 'dmgE_' + elem) + (tgt.brokenT > 0 ? this.sum(src, 'dmgBroken') : 0);
        const cc = TUN.critC + this.sum(src, 'crit') + (o.crit || 0) + (hero ? this.plus(src, 'critBonus', tgt, o) : 0);
        if (this.rng() < cc) { crit = true; amt *= 1 + TUN.critD + this.sum(src, 'critD') + (o.critD || 0) + (hero ? this.plus(src, 'critDBonus', tgt, o) : 0); }
        if (hero) for (const M of this.mods(src)) if (M && M.dmgMul && !M.eq) amt *= M.dmgMul(this, src, tgt, o);
      }
      if (hero && o.kind !== 'break' && o.kind !== 'redirect') for (const M of this.mods(src)) if (M && M.dmgMul && M.eq) amt *= M.dmgMul(this, src, tgt, o);
      this.lastCrit = crit;
      if (src && src.kind === 'hero') { const HR = HD.HEROES[src.key]; amt *= (HR.amp || 1) * (this.diff === HD.DIFFS.hard && HR.ampHard || 1); }
      amt *= HD.ATK_ARMOR[type][this.armorType(tgt)];
      amt *= armorMul(this.armorOf(tgt) * (1 - (o.pen || 0) - (src ? this.sum(src, 'pen') : 0) - (hero ? this.plus(src, 'penBonus', tgt, o) : 0)));
      const weak = (tgt.weak && tgt.weak.includes(elem)) || tgt.fx.some(f => f.k === 'weakAdd' && f.elem === elem);
      if (weak) amt *= TUN.weakMul; else if (tgt.resist && tgt.resist.includes(elem)) amt *= TUN.resistMul;
      let vuln = 1 + this.sum(tgt, 'vuln') - this.sum(tgt, 'dr') + (tgt.brokenT > 0 ? TUN.brokenVuln : 0) + (o.kind === 'dot' ? this.sum(tgt, 'dotVuln') : 0);
      for (const f of tgt.fx) if (f.k === 'elemVuln' && f.elem === elem) vuln += f.v;
      if (src && src.side === 'foe' && tgt.side === 'ally') vuln -= this.sum(src, 'weaken');
      if (src && src.kind === 'boss' && tgt.kind === 'base') amt *= TUN.bossBaseMul;
      amt *= Math.max(0.1, vuln);
      let dealt = Math.max(1, Math.round(amt));
      if (tgt.side === 'ally' && src && src.side === 'foe') for (const h of this.heroes) for (const M of this.mods(h)) if (M && M.redirect && !h.dead && h !== tgt) dealt = M.redirect(this, h, tgt, dealt);
      const sh = tgt.fx.find(f => f.k === 'shield');
      let absorbed = 0;
      if (sh) { absorbed = Math.min(sh.v, dealt); sh.v -= absorbed; dealt -= absorbed; if (sh.v <= 0) tgt.fx.splice(tgt.fx.indexOf(sh), 1); }
      const before = tgt.hp;
      tgt.hp -= dealt;
      if (src && (src.kind === 'hero' || src.owner)) this.stats.dmg += dealt + absorbed;
      this.emit({ t: 'num', x: tgt.x, y: tgt.y - (tgt.r || 20) - 14, v: dealt + absorbed, crit, kind: o.kind === 'dot' ? 'dot' : absorbed && !dealt ? 'shield' : 'dmg', elem, uid: tgt.uid, ally: tgt.side === 'ally' });
      if (tgt.kind === 'hero') {
        tgt.lossAcc += (dealt / tgt.hpMax) * 100;
        while (tgt.lossAcc >= TUN.enLossPct) { tgt.lossAcc -= TUN.enLossPct; tgt.en = Math.min(tgt.enMax, tgt.en + 1); }
        if (tgt.recall > 0) { tgt.recall = 0; this.emit({ t: 'msg', text: 'Возврат прерван' }); }
        if (tgt.chan) { tgt.chan = null; this.emit({ t: 'msg', text: 'Канал прерван' }); }
        if (dealt > 0) this.each(tgt, 'onLose', dealt);
        if (src && src.side === 'foe') this.each(tgt, 'onHurt', src, dealt, o);
      }
      if ((tgt.kind === 'base' || tgt.kind === 'turret') && src) {
        this.emit({ t: 'struck', uid: tgt.uid, x: tgt.x, y: tgt.y, sx: src.x, sy: src.y });
        if (src.side === 'foe' && this.phase === 'wave') this.leaked = true;
      }
      if (tgt.side === 'ally' && src && src.side === 'foe') for (const h of this.heroes) if (!h.dead) this.each(h, 'onAllyHurt', tgt, src, dealt + absorbed);
      if (src && src.side === 'ally' && tgt.side === 'foe' && o.kind !== 'dot' && o.kind !== 'break') for (const h of this.heroes) if (!h.dead) this.each(h, 'onAllyAttack', src, tgt, o);
      if (tgt.side === 'foe' && tgt.hp > 0) for (const h of this.heroes) if (!h.dead) this.each(h, 'onFoeHurt', tgt, before, src, o);
      if (tgt.side === 'foe' && tgt.hp > 0 && tgt.toughMax && !o.noTough && tgt.brokenT <= 0 && o.tough && !tgt.fx.some(f => f.guard)) {
        tgt.tough -= o.tough * (weak || o.forceTough ? 1 : TUN.toughNoWeak) * (1 + (src ? this.sum(src, 'toughP') : 0));
        if (tgt.tough <= 0) this.breakFoe(src, tgt);
      }
      if (src && src.kind === 'hero') this.each(src, 'onHit', tgt, o, dealt);
      if (tgt.side === 'foe' && tgt.pig) tgt.pigHits = (tgt.pigHits || 0) + 1;
      if (tgt.hp <= 0) this.die(tgt, src, o);
      return dealt + absorbed;
    }

    heal(src, tgt, amt) {
      if (!tgt || tgt.dead) return 0;
      const mul = src && src.kind === 'hero' ? this.fold(src, 'healMul', 1, tgt) : 1;
      const v = Math.max(0, Math.min(tgt.hpMax - tgt.hp, amt * mul * (1 + (src ? this.sum(src, 'healP') : 0) + this.sum(tgt, 'healIn'))));
      tgt.hp += v;
      if (src && src.kind === 'hero') { this.stats.heal += v; if (v > 0) this.each(src, 'onHeal', tgt, v); }
      if (v >= 1) this.emit({ t: 'num', x: tgt.x, y: tgt.y - (tgt.r || 20) - 14, v: Math.round(v), kind: 'heal', uid: tgt.uid });
      return v;
    }

    breakFoe(src, f) {
      f.tough = 0;
      f.brokenT = TUN.toughBack;
      const stun = f.kind === 'boss' ? TUN.stunBoss : f.elite ? TUN.stunElite : TUN.stunNormal;
      const elem = (src && src.elem) || 'phys', eff = H.BREAK_EFFECT[elem];
      this.addFx(f, { n: 'Пробитие', k: 'stun', v: 1, t: stun + (elem === 'ice' ? TUN.freezeExtra : 0) });
      if (f.act && f.act.cancel) this.cancelAct(f);
      const base = H.breakBase(f.lvl) * H.ELEMENTS[elem].coef * (1 + (src ? this.sum(src, 'breakEff') : 0));
      if (['phys', 'fire', 'elec', 'wind'].includes(elem)) this.addFx(f, { n: eff, k: 'dot', v: 0, dps: base * TUN.breakDot, elem, t: TUN.breakDotT, src });
      if (elem === 'quant') { this.addFx(f, { n: eff, k: 'slow', v: TUN.entangleSlow, t: 4 }); this.later(2, () => this.hit(src, f, { amt: base * 0.6, type: 'magic', elem, kind: 'dot', noCrit: true, noTough: true })); }
      if (elem === 'imag') this.addFx(f, { n: eff, k: 'slow', v: TUN.imprisonSlow, t: 4 });
      this.emit({ t: 'break', uid: f.uid, x: f.x, y: f.y, text: eff });
      this.hit(src, f, { amt: base, type: 'magic', elem, kind: 'break', noCrit: true, noTough: true });
      if (src && src.kind === 'hero') { const K = HD.KITS[src.key], t = src.abil && src.abil.t; if (K && K.t && K.t.onBreak && t) K.t.onBreak(this, src, this.lvlK('t', t), f); }
      for (const h of this.heroes) if (!h.dead && !f.dead) this.each(h, 'onAnyBreak', f, src);
    }

    later(t, fn) { (this.timers = this.timers || []).push({ t, fn }); }

    cancelAct(u) {
      if (!u.act) return;
      for (const a of u.act.areas || []) { const i = this.areas.indexOf(a); if (i >= 0) this.areas.splice(i, 1); }
      u.act = null;
      this.emit({ t: 'msg', text: 'Подготовка сорвана', x: u.x, y: u.y - 40 });
    }

    die(u, src, o) {
      if (u.dead) return;
      if (u.side === 'ally') for (const h of this.heroes) for (const M of this.mods(h)) if (M && M.saveAlly && (!h.dead || h === u) && M.saveAlly(this, h, u)) { if (u.hp <= 0) u.hp = 1; return; }
      if (u.kind === 'hero') {
        const cap = u.items.findIndex(it => it && it.id === 'revive');
        if (cap >= 0) {
          u.items[cap] = null;
          u.hp = Math.round(u.hpMax * TUN.reviveHp);
          this.emit({ t: 'msg', text: 'Капсула реанимации', x: u.x, y: u.y - 40 });
          return;
        }
        u.hp = 0; u.dead = true; u.deaths++;
        u.respawn = (lin(TUN.respawn, u.lvl)) * this.diff.respawn;
        u.recall = 0; u.path = null; u.moveDir = null; u.forced = null;
        u.fx = [];
        this.say(u, 'Поражение');
        this.emit({ t: 'herodie', uid: u.uid });
        return;
      }
      u.hp = 0; u.dead = true;
      if (u.kind === 'turret') { this.stats.tfell = (this.stats.tfell || 0) + 1; this.emit({ t: 'msg', text: 'Турель пала', x: u.x, y: u.y - 30 }); return; }
      if (u.kind === 'base') { this.over = 'lose'; return; }
      if (u.side !== 'foe') return;
      if (u.act) { for (const a of u.act.areas || []) { const i = this.areas.indexOf(a); if (i >= 0) this.areas.splice(i, 1); } u.act = null; }
      if (u.kind === 'boss' && u.bornT != null) { const d = Math.round(this.time - u.bornT); this.stats.bossMin = this.stats.bossMin == null ? d : Math.min(this.stats.bossMin, d); }
      const h = this.hero, byHero = src && (src.kind === 'hero' || src.owner === h.uid);
      const w = this.wave, near = !h.dead && Math.hypot(h.x - u.x, h.y - u.y) <= TUN.expR;
      const raid = Object.keys(this.M.rifts).some(k => { const r = this.rift(k); return Math.hypot(r.x - u.x, r.y - u.y) <= TUN.raidR; });
      let gold = u.key === 'trotter_big' ? TUN.bigPigKill : u.pig ? lin(TUN.pigGold, w) : u.kind === 'boss' ? TUN.goldBoss : u.elite ? lin(TUN.goldElite, w) : lin(TUN.goldNormal, w);
      let exp = u.kind === 'boss' ? TUN.expBoss : u.elite ? lin(TUN.expElite, w) : lin(TUN.expNormal, w);
      if (!byHero) gold *= TUN.goldShare; else gold *= 1 + this.sum(h, 'goldP');
      if (raid && byHero) { gold *= 1 + TUN.raidGold; exp *= 1 + TUN.raidExp; }
      gold = Math.round(gold * this.diff.gold);
      if (byHero) this.stats.kills++;
      this.giveGold(h, gold, raid && byHero ? 'raid' : null, u);
      if (byHero || near) this.giveExp(h, exp);
      if (byHero && src.kind === 'hero') {
        h.en = Math.min(h.enMax, h.en + TUN.enKill);
        const K = HD.KITS[h.key];
        if (K && K.t && K.t.onKill && h.abil.t) K.t.onKill(this, h, this.lvlK('t', h.abil.t), u, o);
        this.each(h, 'onKill', u, o);
      }
      for (const hh of this.heroes) this.each(hh, 'onFoeDie', u, src, o);
      if (u.onDeath) u.onDeath(this, u);
    }

    giveGold(h, v, tag, at) {
      if (v <= 0) return;
      h.gold += v; this.stats.gold += v;
      if (tag === 'raid') this.stats.raid += v;
      this.emit({ t: 'gold', v, raid: tag === 'raid', x: at ? at.x : h.x, y: at ? at.y - 30 : h.y - 40 });
    }

    giveExp(h, v) {
      if (h.lvl >= 20) return;
      h.exp += Math.round(v);
      while (h.lvl < 20 && h.exp >= expNext(h.lvl)) {
        h.exp -= expNext(h.lvl); h.lvl++;
        if (h.lvl !== 10 && h.lvl !== 20) h.pts++;
        this.heroStatsApply(h, false);
        this.emit({ t: 'level', lvl: h.lvl });
      }
      if (h.lvl >= 20) h.exp = 0;
    }

    lvlK(slot, l) { return slot === 'r' ? TUN.ultLvl[l - 1] : TUN.abilLvl[l - 1]; }

    canUp(h, slot) { return h.pts > 0 && h.abil[slot] < abilCap(slot, h.lvl); }

    up(h, slot) {
      if (!this.canUp(h, slot)) return false;
      h.abil[slot]++; h.pts--;
      this.emit({ t: 'up', slot });
      return true;
    }

    spendHp(u, v) {
      const a = Math.min(u.hp - 1, v);
      if (a <= 0) return 0;
      u.hp -= a;
      this.emit({ t: 'num', x: u.x, y: u.y - u.r - 14, v: Math.round(a), kind: 'cost', uid: u.uid, ally: true });
      this.each(u, 'onLose', a, true);
      return a;
    }

    charges(h, slot) { const K = HD.KITS[h.key][slot]; return K && K.charges ? K.charges(h) : 1; }

    cdLeft(h, slot) { const K = HD.KITS[h.key][slot]; return Math.max(0, h.cd[slot] - (this.charges(h, slot) - 1) * K.cd); }

    needPick(h) { return [10, 20].find(l => h.lvl >= l && h.picks[l] == null) || 0; }

    pick(h, lvl, i) {
      const K = HD.KITS[h.key], list = lvl === 10 ? K.tr : K.ei;
      if (!list || !list[i] || h.lvl < lvl || h.picks[lvl] != null) { this.emit({ t: 'deny', why: '' }); return false; }
      h.picks[lvl] = i;
      this.emit({ t: 'pick', lvl, name: list[i].name });
      if (K.onPick) K.onPick(this, h, lvl, i);
      return true;
    }

    costOf(h, slot) { const K = HD.KITS[h.key][slot]; return slot === 'r' ? H.CHARS[h.key].energy : K.cost; }

    resolveAim(h, K, aim) {
      aim = aim || {};
      const range = K.range || 260;
      if (K.aim === 'target') {
        let t = aim.id != null ? this.byId(aim.id) : null;
        if (t && (t.side !== 'foe' || Math.hypot(t.x - h.x, t.y - h.y) - t.r > range)) t = null;
        if (!t && h.sel != null) { const s = this.byId(h.sel); if (s && s.side === 'foe' && Math.hypot(s.x - h.x, s.y - h.y) - s.r <= range) t = s; }
        if (!t) t = this.nearestFoe(h.x, h.y, range);
        return t ? { id: t.uid, x: t.x, y: t.y, t } : null;
      }
      if (K.aim === 'ally') {
        const ok = v => v && !v.dead && v.side === 'ally' && this.gap(h, v) <= range;
        let t = aim.id != null ? this.byId(aim.id) : null;
        if (!ok(t) && aim.x != null) t = this.units.filter(v => ok(v) && this.gap({ x: aim.x, y: aim.y }, v) <= 40)[0] || null;
        if (!ok(t)) t = this.units.filter(v => ok(v) && v.hp < v.hpMax).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0] || h;
        return { id: t.uid, x: t.x, y: t.y, t };
      }
      if (K.aim === 'point') {
        let x = aim.x, y = aim.y;
        if (x == null) {
          const s = h.sel != null ? this.byId(h.sel) : null, t = s && s.side === 'foe' ? s : this.nearestFoe(h.x, h.y, Math.max(range, 300));
          if (t) { x = t.x; y = t.y; } else { const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[h.dir]; x = h.x + d[0] * 80; y = h.y + d[1] * 80; }
        }
        const dx = x - h.x, dy = y - h.y, d = Math.hypot(dx, dy);
        if (d > range) { x = h.x + dx / d * range; y = h.y + dy / d * range; }
        return { x, y };
      }
      return { x: h.x, y: h.y };
    }

    cast(h, slot, aim) {
      const K = HD.KITS[h.key] && HD.KITS[h.key][slot], l = h.abil[slot];
      const no = why => { this.emit({ t: 'deny', slot, why }); return false; };
      if (!K || h.dead) return no('');
      if (!l) return no('Способность не изучена');
      if (this.stunned(h)) return no('Герой оглушён');
      if (this.cdLeft(h, slot) > 1e-9) return no('Перезарядка');
      const cost = this.costOf(h, slot);
      if (h.en < cost) return no('Мало энергии');
      const a = this.resolveAim(h, K, aim);
      if (!a) return no('Нет цели рядом');
      this.each(h, 'preCast', slot);
      this.caster = h;
      const res = K.cast(this, h, this.lvlK(slot, l), a, l);
      this.caster = null;
      if (res === false) return no('');
      this.each(h, 'onCast', slot, a);
      h.en -= cost;
      h.cd[slot] = Math.max(0, h.cd[slot]) + K.cd;
      h.recall = 0; h.still = 0;
      this.emit({ t: 'cast', slot, uid: h.uid, x: a.x, y: a.y });
      if (slot === 'r' || (this.time - h.voiceT >= TUN.voiceGap && this.rng() < TUN.voiceChance)) this.say(h, ROLE_LINE[slot]);
      return true;
    }

    addArea(a) { const o = Object.assign({ t: 0, delay: 0, tickT: 0, age: 0, hitDone: false }, a); this.areas.push(o); return o; }

    shoot(src, tgt, o) {
      this.shots.push({ x: src.x, y: src.y - (src.kind === 'turret' ? 20 : 14), tgt: tgt.uid, src: src.uid, srcU: src, o, elem: o.elem || src.elem || 'phys', spd: TUN.projSpd, kind: src.kind });
    }

    basicAttack(u, t) {
      const o = { m: 1, kind: 'basic', tough: H.TUNING.toughBasic, basic: true };
      if (u.kind === 'turret') { o.m = 1; o.type = 'magic'; o.elem = 'quant'; this.shoot(u, t, o); this.emit({ t: 'tshot', uid: u.uid }); return; }
      if (u.side === 'foe') {
        const e = H.ENEMIES[u.key], sk = e.skills && e.skills[0];
        o.elem = (sk && sk.e) || 'phys'; o.tough = 0;
        const fx = HD.FOES[u.key].atkFx;
        if (fx) o.after = (A, v) => HD.foeFx(A, u, v, fx);
        if (u.range >= TUN.shootFrom) this.shoot(u, t, o); else { const d = this.hit(u, t, o); if (o.after) o.after(this, t, d); this.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y }); }
        return;
      }
      const K = HD.KITS[u.key];
      if (K && K.basic) { K.basic(this, u, t, o); return; }
      if (u.melee) { this.hit(u, t, o); u.en = Math.min(u.enMax, u.en + TUN.enHit); this.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y, elem: u.elem }); }
      else this.shoot(u, t, o);
    }

    inRange(u, t) { return this.gap(u, t) <= u.range; }

    step() {
      if (this.over || this.phase === 'done') return;
      this.tick++; this.time += DT;
      for (const u of this.units) { u.px = u.x; u.py = u.y; }
      this.applyCmds();
      this.updateEffects();
      this.thinkFoes();
      this.moveUnits();
      this.separate();
      this.attacks();
      this.updateShots();
      this.updateAreas();
      this.updateWave();
      this.units = this.units.filter(u => !u.dead || u.kind === 'hero' || u.kind === 'turret' || u.kind === 'base');
      if (this.base.dead || this.base.hp <= 0) this.over = 'lose';
    }

    applyCmds() {
      const q = this.queue; this.queue = [];
      for (const c of q) {
        const h = this.heroes[c.p];
        if (!h) continue;
        switch (c.t) {
          case 'move': {
            const l = Math.hypot(c.dx || 0, c.dy || 0);
            h.moveDir = l ? { x: c.dx / l, y: c.dy / l } : null;
            if (l) { h.path = null; h.forced = null; h.recall = 0; h.chan = null; } else h.standAt = { x: h.x, y: h.y };
            break;
          }
          case 'goto': if (!h.dead) { h.path = this.pathTo(h, c.x, c.y, TUN.heroPathLimit); h.forced = null; h.moveDir = null; h.recall = 0; } break;
          case 'attack': { const t = this.byId(c.id); if (t && t.side === 'foe') { h.forced = t.uid; h.sel = t.uid; h.path = null; h.moveDir = null; } break; }
          case 'target': { const t = c.id == null ? null : this.byId(c.id); h.sel = t && t.side === 'foe' ? t.uid : null; break; }
          case 'stop': h.path = null; h.forced = null; h.moveDir = null; h.standAt = { x: h.x, y: h.y }; break;
          case 'hold': h.hold = c.on != null ? !!c.on : !h.hold; h.standAt = { x: h.x, y: h.y }; break;
          case 'cast': this.cast(h, c.slot, c); break;
          case 'up': this.up(h, c.slot); break;
          case 'pick': this.pick(h, c.lvl || this.needPick(h), c.i); break;
          case 'use': if (HD.useItem) HD.useItem(this, h, c.i, c); break;
          case 'buy': if (HD.buyItem) HD.buyItem(this, h, c.id, c); break;
          case 'upgrade': if (HD.upgrade) HD.upgrade(this, h, c.i); break;
          case 'sell': if (HD.sellItem) HD.sellItem(this, h, c.i); break;
          case 'recall':
            if (!h.dead && h.recallCd <= 0 && h.recall <= 0) { h.recall = TUN.recallT; h.path = null; h.moveDir = null; h.forced = null; this.emit({ t: 'msg', text: 'Возврат на площадь' }); }
            break;
          case 'buyback': this.buyback(h); break;
          case 'early': this.early(); break;
          case 'restore': this.restore(h, c.i); break;
        }
      }
    }

    buyback(h) {
      const cost = Math.round(lin(TUN.buyback, h.lvl));
      if (!h.dead || h.bought || h.gold < cost) { this.emit({ t: 'deny', why: !h.dead ? '' : h.bought ? 'Срочный вызов уже был в этой волне' : 'Мало золота' }); return false; }
      h.gold -= cost; this.stats.spent += cost; h.bought = true;
      this.respawnHero(h);
      this.say(h, 'Возвращение в бой');
      return true;
    }

    respawnHero(h) {
      const S = this.M.spawn;
      Object.assign(h, { dead: false, hp: h.hpMax, en: Math.max(h.en, 0), x: S[0] * TS + 16, y: S[1] * TS + 16, respawn: 0, path: null, moveDir: null, forced: null, standAt: null });
      h.px = h.x; h.py = h.y;
      if (HD.equip) HD.equip(this, h);
      this.each(h, 'onRespawn');
      this.emit({ t: 'respawn', uid: h.uid });
    }

    early() {
      if (this.phase !== 'break') return false;
      const g = Math.ceil(this.breakT) * TUN.earlyGold;
      this.giveGold(this.hero, g, 'early');
      this.startWave();
      return true;
    }

    restoreCost() { return Math.round(lin(TUN.tRestore, this.wave)); }

    restore(h, i) {
      const t = this.turrets[i], cost = this.restoreCost();
      if (!t || !t.dead || this.phase !== 'break' || h.dead || Math.hypot(h.x - t.x, h.y - t.y) > 96 || h.gold < cost) { this.emit({ t: 'deny', why: !t || !t.dead ? '' : this.phase !== 'break' ? 'Только в перерыве' : h.gold < cost ? 'Мало золота' : 'Подойдите к турели' }); return false; }
      h.gold -= cost; this.stats.spent += cost;
      t.dead = false; t.hp = t.hpMax; t.fx = [];
      this.emit({ t: 'msg', text: 'Турель восстановлена', x: t.x, y: t.y - 30 });
      return true;
    }

    updateEffects() {
      for (const tm of this.timers || []) tm.t -= DT;
      if (this.timers && this.timers.length) {
        const due = this.timers.filter(tm => tm.t <= 0);
        this.timers = this.timers.filter(tm => tm.t > 0);
        for (const tm of due) tm.fn();
      }
      for (const u of this.units) {
        if (u.dead) continue;
        for (const f of u.fx) {
          f.t -= DT;
          if (f.k === 'dot' || f.k === 'hot') {
            f.tickT -= DT;
            if (f.tickT <= 0) {
              f.tickT += 1;
              if (f.k === 'dot') this.hit(f.src, u, { amt: f.dps, type: 'magic', elem: f.elem, kind: 'dot', noCrit: true, noTough: true });
              else this.heal(f.src, u, f.hps);
            }
          }
        }
        if (u.dead) continue;
        u.fx = u.fx.filter(f => f.t > 0 && !(f.k === 'shield' && f.v <= 0));
        if (u.side === 'foe' && u.toughMax && u.brokenT > 0) {
          u.brokenT -= DT;
          if (u.brokenT <= 0) { u.tough = u.toughMax; this.emit({ t: 'recover', uid: u.uid }); for (const h of this.heroes) if (!h.dead) this.each(h, 'onFoeRecover', u); }
        }
        if (u.skCd > 0) u.skCd -= DT;
        if (u.atkCd > 0) u.atkCd -= DT;
      }
      const inWave = this.phase === 'wave';
      if (!inWave) this.base.hp = Math.min(this.base.hpMax, this.base.hp + this.base.hpMax * TUN.baseRegen * DT);
      for (const h of this.heroes) {
        if (h.dead) { h.respawn -= DT; if (h.respawn <= 0) this.respawnHero(h); continue; }
        for (const s of ['q', 'e', 'r']) if (h.cd[s] > 0) h.cd[s] -= DT * (1 + this.sum(h, 'cdr'));
        if (h.recallCd > 0) h.recallCd -= DT;
        h.hp = Math.min(h.hpMax, h.hp + (h.regen + this.sum(h, 'regen')) * DT);
        h.en = Math.min(h.enMax, h.en + h.enRegen * (1 + this.sum(h, 'enRegenP')) * DT);
        if (this.inPlaza(h)) {
          if (!inWave) { h.hp = Math.min(h.hpMax, h.hp + h.hpMax / TUN.plazaFull * DT); h.en = Math.min(h.enMax, h.en + h.enMax / TUN.plazaFull * DT); }
          else { h.hp = Math.min(h.hpMax, h.hp + h.hpMax * TUN.plazaWave * DT); h.en = Math.min(h.enMax, h.en + h.enMax * TUN.plazaWave * DT); }
        }
        if (h.recall > 0) {
          h.recall -= DT;
          if (h.recall <= 0) { h.recall = 0; h.recallCd = TUN.recallCd; const S = this.M.spawn; h.x = S[0] * TS + 16; h.y = S[1] * TS + 16; h.px = h.x; h.py = h.y; h.standAt = null; this.emit({ t: 'msg', text: 'Герой на площади' }); }
        }
        if (h.chan) { h.chan.t -= DT; if (h.chan.t <= 0) { const ch = h.chan; h.chan = null; ch.fn(); } }
        this.each(h, 'tick');
      }
    }

    pickTarget(u) {
      let best = null, bw = 0;
      for (const a of this.units) {
        if (a.dead || a.side !== 'ally') continue;
        if (a.kind === 'hero' && this.has(a, 'invis')) continue;
        const g = this.gap(u, a);
        if (g > TUN.aggroR) continue;
        const wgt = (a.aggro || 100) * (1 + this.sum(a, 'aggroP')) / Math.max(8, g);
        if (wgt > bw) { bw = wgt; best = a; }
      }
      return best;
    }

    thinkFoes() {
      for (const u of this.units) {
        if (u.dead || u.side !== 'foe') continue;
        const AI = HD.FOE_AI[u.key];
        if (AI && AI.think) AI.think(this, u);
        if (u.pig || u.dead) continue;
        if (!AI && HD.foeTick) HD.foeTick(this, u);
        let t = u.tgt != null ? this.byId(u.tgt) : null;
        if (t && t.kind === 'hero' && this.has(t, 'invis')) t = null;
        const taunt = u.fx.find(f => f.k === 'taunt' && f.src && !f.src.dead);
        if (taunt) t = taunt.src;
        u.rt -= DT;
        if (!taunt && u.rt <= 0 && u.ignore <= 0) {
          u.rt = TUN.retarget;
          const n = this.pickTarget(u);
          if (n && n !== t) { if (!t) u.leashAt = { x: u.x, y: u.y }; t = n; }
        }
        if (u.ignore > 0) u.ignore -= DT;
        if (t && t.kind !== 'base' && u.leashAt && Math.hypot(u.x - u.leashAt.x, u.y - u.leashAt.y) > TUN.leash && !taunt) { t = null; u.ignore = 2; u.leashAt = null; }
        if (!t && this.gap(u, this.base) <= u.range + 2) t = this.base;
        if (!t) u.leashAt = null;
        u.tgt = t ? t.uid : null;
      }
    }

    moveUnits() {
      for (const u of this.units) {
        if (u.dead || u.fixed) continue;
        u.moving = false;
        if (u.kind === 'hero') { this.moveHero(u); continue; }
        if (this.stunned(u) || u.act) continue;
        const spd = this.moveSpd(u);
        if (u.pig) { this.movePig(u, spd); continue; }
        const t = u.tgt != null ? this.byId(u.tgt) : null;
        if (t && this.inRange(u, t)) { this.face(u, t.x - u.x, t.y - u.y); continue; }
        u.moving = true;
        if (t && t.kind !== 'base') {
          if (this.clearLine(u.x, u.y, t.x, t.y, u.r - 2)) { u.path = null; this.stepTo(u, t.x, t.y, spd); continue; }
          u.pathT = (u.pathT || 0) - DT;
          if (!u.path || u.pathT <= 0) { u.path = this.pathTo(u, t.x, t.y, TUN.chaseLimit); u.pathT = 0.5; }
          if (u.path && u.path.length) { this.follow(u, u.path, spd); continue; }
        }
        const p = this.flowTarget(u);
        this.stepTo(u, p.x, p.y, spd);
      }
    }

    movePig(u, spd) {
      if (u.pigHits >= TUN.pigFlee && !u.fled) { u.fled = true; this.addFx(u, { n: 'Рывок', k: 'mspd', v: 1, t: 1.5 }); }
      if (!u.path || !u.path.length) {
        const r = this.rift(u.goal);
        if (Math.hypot(u.x - r.x, u.y - r.y) < 24) { u.dead = true; u.escaped = true; this.emit({ t: 'msg', text: 'Свинка-копилка убежала', x: u.x, y: u.y - 30 }); return; }
        u.path = this.pathTo(u, r.x, r.y, 4000) || [r];
      }
      u.moving = true;
      this.follow(u, u.path, spd);
    }

    moveHero(h) {
      if (h.dead || this.stunned(h) || this.has(h, 'root') || h.recall > 0 || h.chan) { h.still += DT; return; }
      const spd = this.moveSpd(h);
      if (h.moveDir) {
        this.stepTo(h, h.x + h.moveDir.x * 40, h.y + h.moveDir.y * 40, spd);
        h.moving = true; h.still = 0; h.standAt = null;
        return;
      }
      if (h.path) {
        if (!h.path.length || this.follow(h, h.path, spd)) { h.path = null; h.standAt = { x: h.x, y: h.y }; }
        h.moving = true; h.still = 0;
        return;
      }
      const f = h.forced != null ? this.byId(h.forced) : null;
      if (h.forced != null && !f) h.forced = null;
      if (f) {
        if (!this.inRange(h, f)) {
          if (this.clearLine(h.x, h.y, f.x, f.y, h.r - 2)) { h.chase = null; this.stepTo(h, f.x, f.y, spd); }
          else {
            h.chaseT = (h.chaseT || 0) - DT;
            if (!h.chase || h.chaseT <= 0) { h.chase = this.pathTo(h, f.x, f.y, TUN.heroPathLimit); h.chaseT = 0.5; }
            if (h.chase && h.chase.length) this.follow(h, h.chase, spd);
          }
          h.moving = true; h.still = 0;
          return;
        }
        h.still += DT;
        return;
      }
      if (!h.standAt) h.standAt = { x: h.x, y: h.y };
      if (!h.hold) {
        const t = this.autoTarget(h, h.range + TUN.holdChase);
        if (t && !this.inRange(h, t)) {
          const dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy), nx = h.x + dx / d * spd * DT, ny = h.y + dy / d * spd * DT;
          if (Math.hypot(nx - h.standAt.x, ny - h.standAt.y) <= TUN.holdChase && this.clearLine(h.x, h.y, t.x, t.y, h.r - 2)) { this.stepTo(h, t.x, t.y, spd); h.moving = true; h.still = 0; return; }
        }
      }
      h.still += DT;
    }

    autoTarget(h, r) {
      const s = h.sel != null ? this.byId(h.sel) : null;
      if (s && s.side === 'foe' && this.gap(h, s) <= r) return s;
      if (h.sel != null && (!s || Math.hypot(s.x - h.x, s.y - h.y) > 600)) h.sel = null;
      let best = null, bd = r;
      for (const u of this.units) {
        if (u.dead || u.side !== 'foe') continue;
        const d = this.gap(h, u);
        if (d <= bd) { bd = d; best = u; }
      }
      return best;
    }

    separate() {
      const cell = 64, B = new Map(), list = this.units.filter(u => !u.dead && !u.rect && u.r);
      for (const u of list) { const k = Math.floor(u.x / cell) + ',' + Math.floor(u.y / cell); if (!B.has(k)) B.set(k, []); B.get(k).push(u); }
      const moved = new Set();
      for (const a of list) {
        if (a.fixed) continue;
        const cx = Math.floor(a.x / cell), cy = Math.floor(a.y / cell);
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          for (const b of B.get((cx + ox) + ',' + (cy + oy)) || []) {
            if (b.uid <= a.uid && !b.fixed) continue;
            if (b === a) continue;
            const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy), min = a.r + b.r;
            if (d >= min) continue;
            const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0, over = min - d;
            const af = b.fixed || b.kind === 'boss' ? 1 : a.kind === 'boss' ? 0 : 0.5;
            if (a.kind !== 'boss') { a.x += nx * over * af; a.y += ny * over * af; moved.add(a); }
            if (!b.fixed && b.kind !== 'boss') { b.x -= nx * over * (1 - af); b.y -= ny * over * (1 - af); moved.add(b); }
          }
        }
      }
      for (const u of moved) this.collide(u);
    }

    attacks() {
      for (const u of this.units) {
        if (u.dead || u.kind === 'base' || u.pig) continue;
        if (this.stunned(u)) continue;
        if (u.kind === 'turret') {
          if (u.atkCd > 0) continue;
          let best = null, bd = Infinity;
          for (const f of this.units) {
            if (f.dead || f.side !== 'foe') continue;
            const g = this.gap(u, f);
            if (g > u.range) continue;
            const score = g - (f.elite || f.kind === 'boss' ? 1000 : 0);
            if (score < bd) { bd = score; best = f; }
          }
          u.tgt = best ? best.uid : null;
          if (best) { this.basicAttack(u, best); u.atkCd = this.interval(u); }
          continue;
        }
        if (u.kind === 'hero') {
          if (u.moving || u.recall > 0 || u.still < TUN.resumeAtk || u.atkCd > 0) continue;
          let t = u.forced != null ? this.byId(u.forced) : null;
          if (!t || !this.inRange(u, t)) t = this.autoTarget(u, u.range);
          if (!t || !this.inRange(u, t)) continue;
          this.face(u, t.x - u.x, t.y - u.y);
          this.basicAttack(u, t);
          u.atkCd = this.interval(u);
          continue;
        }
        if (u.act) {
          u.act.t -= DT;
          if (u.act.t <= 0) { const a = u.act; u.act = null; a.fn(); }
          continue;
        }
        const AI = HD.FOE_AI[u.key];
        if (AI && AI.act && AI.act(this, u)) continue;
        const t = u.tgt != null ? this.byId(u.tgt) : null;
        if (!t || !this.inRange(u, t) || u.atkCd > 0) continue;
        u.atkCd = this.interval(u);
        if (HD.foeSkill && HD.foeSkill(this, u, t)) continue;
        this.basicAttack(u, t);
      }
    }

    updateShots() {
      const keep = [];
      for (const s of this.shots) {
        const t = this.byId(s.tgt);
        if (!t) continue;
        const ty = t.y - (t.rect ? 0 : 12), dx = t.x - s.x, dy = ty - s.y, d = Math.hypot(dx, dy), st = s.spd * DT;
        if (d <= st + 6) {
          const src = s.srcU;
          const dealt = this.hit(src, t, s.o);
          if (s.o.basic && src && src.kind === 'hero') src.en = Math.min(src.enMax, src.en + TUN.enHit);
          if (s.o.after) s.o.after(this, t, dealt);
          continue;
        }
        s.x += dx / d * st; s.y += dy / d * st; s.ang = Math.atan2(dy, dx);
        keep.push(s);
      }
      this.shots = keep;
    }

    updateAreas() {
      const keep = [];
      for (const a of this.areas) {
        a.age += DT;
        if (a.follow != null) { const f = this.units.find(u => u.uid === a.follow); if (f && !f.dead) { a.x = f.x; a.y = f.y; } else if (a.followOnly) continue; }
        if (a.delay > 0) {
          a.delay -= DT;
          if (a.delay > 0) { keep.push(a); continue; }
          if (a.onHit) for (const u of this.unitsIn(a, a.side)) a.onHit(this, u, a);
          if (a.onFire) a.onFire(this, a);
          if (!a.t) continue;
        }
        if (a.onTick) {
          a.tickT -= DT;
          if (a.tickT <= 0) { a.tickT += a.every || 0.25; a.onTick(this, a); }
        }
        a.t -= DT;
        if (a.t > 0) keep.push(a);
      }
      this.areas = keep;
    }

    startWave() {
      this.phase = 'wave';
      this.waveT = 0; this.secT = 0; this.leaked = false;
      this.rng = H.makeRandom((this.run.seed * 7919 + this.wave * 104729 + 17) >>> 0);
      this.hero.bought = false;
      for (const h of this.heroes) this.each(h, 'onWave');
      this.sched = HD.buildWave ? HD.buildWave(this) : [];
      this.waveFoes = 0;
      const W = HD.WAVES[this.wave - 1];
      this.emit({ t: 'wave', n: this.wave, boss: !!(W && W.boss) });
      this.emit({ t: 'sfx', id: 'whoosh' });
      if (this.onWave) this.onWave(this);
    }

    spawnFoe(id, key, o = {}) {
      const r = this.rift(key), lvl = this.wave + this.diff.lvl, s = foeStats(id, lvl, this.diff), e = H.ENEMIES[id], f = HD.FOES[id];
      const boss = !!e.boss, elite = !!e.elite;
      const u = this.add(Object.assign({
        side: 'foe', kind: boss ? 'boss' : 'foe', key: id, elite, lvl, pig: !!f.pig,
        x: r.x + (this.rng() - 0.5) * 24, y: r.y + (this.rng() - 0.5) * 16, r: boss ? 26 : elite ? 15 : 11,
        str: s.str, agi: s.agi, int: s.int, main: s.main, hpMax: s.hpMax, hp: s.hpMax, dmg: s.dmg, armor: s.armor, armorType: f.armor, atkType: f.atk,
        spd: s.spd, bat: s.bat, range: s.range, toughMax: s.tough, tough: s.tough, brokenT: 0, weak: e.weak, resist: e.resist,
        aggroRift: key, rift: key, tgt: null, rt: 0, ignore: 0, atkCd: 0.5, skCd: TUN.foeSkillCd[0] + this.rng() * (TUN.foeSkillCd[1] - TUN.foeSkillCd[0]), hits: 0, wave: true, elem: (e.skills && e.skills[0] && e.skills[0].e) || 'phys'
      }, o));
      if (boss) u.bornT = this.time;
      if (u.pig) { u.spd = TUN.pigSpd; u.hpMax = u.hp = Math.round(s.hpMax); u.pigHits = 0; u.goal = o.goal; }
      else {
        const T = HD.THREATS[HD.FOE_THREAT[id]], late = this.wave >= TUN.lateFrom && !boss;
        u.hpMax = u.hp = Math.round(u.hpMax * (T && !boss ? T.hpK : 1) * (late ? TUN.lateHp : 1) * (o.big ? f.bigHpK || 1 : 1));
        u.dmg *= (T && !boss ? T.dmgK : 1) * (late ? TUN.lateDmg : 1);
      }
      this.collide(u);
      u.px = u.x; u.py = u.y;
      const AI = HD.FOE_AI[id];
      if (AI && AI.init) AI.init(this, u);
      return u;
    }

    updateWave() {
      for (const k of Object.keys(this.glow)) if (this.glow[k] > 0) this.glow[k] -= DT;
      if (this.phase === 'break') {
        this.breakT -= DT;
        if (this.breakT <= 0) this.startWave();
        return;
      }
      if (this.phase !== 'wave') return;
      this.waveT += DT; this.stats.time += DT;
      this.secT += DT;
      if (this.secT >= 1) { this.secT -= 1; this.hero.gold += TUN.goldSec; this.stats.gold += TUN.goldSec; }
      for (const g of this.sched) {
        if (g.done) continue;
        if (!g.glowed && this.waveT >= g.t - TUN.riftGlow) { g.glowed = true; this.glow[g.rift] = TUN.riftGlow; this.emit({ t: 'rift', key: g.rift }); }
        if (this.waveT >= g.t) { g.done = true; for (const id of g.ids) this.spawnFoe(id, g.rift, g.o ? Object.assign({}, g.o) : {}); if (g.onSpawn) g.onSpawn(this); }
      }
      if (this.sched.every(g => g.done) && !this.units.some(u => !u.dead && u.side === 'foe' && u.wave)) this.clearWave();
    }

    clearWave() {
      const h = this.hero, w = this.wave;
      let gold = lin(TUN.goldWave, w);
      if (!this.leaked) gold *= 1 + TUN.cleanBonus;
      this.giveGold(h, Math.round(gold * this.diff.gold), 'wave');
      this.giveExp(h, lin(TUN.expWave, w));
      this.emit({ t: 'cleared', n: w, clean: !this.leaked });
      for (const hh of this.heroes) this.each(hh, 'onWaveEnd');
      if (w >= HD.WAVES.length) { this.over = 'win'; this.phase = 'done'; return; }
      this.wave++;
      if (this.jumpTo) { this.wave = Math.max(1, Math.min(HD.WAVES.length, this.jumpTo)); this.jumpTo = null; }
      this.phase = 'break';
      this.breakNo++;
      this.breakT = this.diff.breakT;
      for (const t of this.turrets) this.towerStats(t);
      this.baseStats();
      this.areas = this.areas.filter(a => a.side === 'foe' && !a.warn);
      this.emit({ t: 'break', n: this.wave });
      for (const hh of this.heroes) { for (const it of hh.items) if (it && HD.DEVICES[it.id] && HD.DEVICES[it.id].charges) it.ch = HD.DEVICES[it.id].charges; this.each(hh, 'onBreakStart'); }
      if (this.onBreak) this.onBreak(this);
    }

    toRun(run) {
      const h = this.hero, p = run.players[0];
      const keep = it => { const c = Object.assign({}, it); delete c.at; delete c.phase; delete c.cdT; return c; };
      Object.assign(p, { hero: h.key, lvl: h.lvl, exp: h.exp, pts: h.pts, abil: Object.assign({}, h.abil), picks: Object.assign({}, h.picks), gold: h.gold, items: h.items.map(it => (it ? keep(it) : null)), cone: h.cone ? keep(h.cone) : null, deaths: h.deaths, buyback: h.bought });
      run.base.hp = Math.max(0, Math.round(this.base.hp));
      run.towers = this.turrets.map(t => (t.dead ? 0 : Math.round(t.hp)));
      run.stats = Object.assign({}, this.stats);
      run.wave = this.wave;
      run.phase = this.over ? 'done' : this.phase;
      return run;
    }
  }

  const tr = (u, i) => u.picks[10] === i, ei = (u, i) => u.picks[20] === i;
  const DEBUFF = new Set(['slow', 'dot', 'vuln', 'elemVuln', 'stun', 'weakAdd', 'weaken', 'dotVuln']);
  const debuffs = u => u.fx.filter(f => f.deb || DEBUFF.has(f.k));
  Object.assign(HD, { tr, ei, debuffs, Arena, gridOf, astar, heroAttrs, heroStats, foeStats, armorMul, expNext, abilCap, DT });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
