(function (H) {
  'use strict';
  const PF = H.PF, TUN = PF.TUN, T = H.TUNING, BP = H.Battle.prototype;
  const { alive } = H.battleStat;
  const boundary = c => TUN.firstCycle + TUN.cycle * (c - 1);

  function bagOf(wave, rng) {
    const bag = [];
    for (const [id, n] of wave.pool) for (let i = 0; i < n; i++) bag.push(id);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    const boss = bag.findIndex(id => H.ENEMIES[id].boss);
    if (boss > 0) bag.unshift(bag.splice(boss, 1)[0]);
    return bag;
  }

  function firstLine(bag, wave) {
    const line = [];
    let big = 0;
    while (line.length < wave.max && bag.length) {
      const i = big >= TUN.maxSpecial ? bag.findIndex(id => !PF.special(id)) : 0;
      if (i < 0) break;
      const id = bag.splice(i, 1)[0];
      if (PF.special(id)) big++;
      line.push(id);
    }
    if (H.ENEMIES[line[0]] && H.ENEMIES[line[0]].boss) line.splice(Math.min(line.length - 1, Math.floor(wave.max / 2)), 0, line.shift());
    return line;
  }

  function dress(b, u, slot) {
    const O = b.opts.pf, P = b.pf, wave = O.waves[b.wave], d = u.data, big = !!(d.boss || d.elite), patch = { pfGhost: !big, pfRim: big };
    u.pfSlot = slot;
    u.pfMax = wave.max;
    u.pfBossWave = wave.pool.some(([id]) => H.ENEMIES[id].boss);
    u.pfVal = P.vals[u.id];
    u.pfLeft = u.pfVal.d;
    u.pfEloq = !!d.boss;
    if (d.skills.some(s => s.t === 'summon')) patch.skills = d.skills.map(s => (s.t === 'summon' ? Object.assign({}, s, { max: -1 }) : s));
    if (u.id === 'pf_trotter') patch.weak = O.rec;
    u.data = Object.assign({}, d, patch);
    u.weak = u.data.weak;
  }

  PF.FX = {
    shatter: {
      ult({ src, tgt }) { this.pfShatAdd(tgt, src); },
      foeTurn({ u }) { this.pfShatBlast(u); },
      kill({ u }) { this.pfShatBlast(u); }
    },
    erupt: {
      ult({ src, tgt }) { this.pfShatAdd(tgt, src); }
    },
    excite: {
      spawn({ u }) { if (this.rng.chance(TUN.exciteChance)) this.pfShatAdd(u, null); }
    },
    rupture: {
      kill({ u, src }) {
        const P = this.pf;
        if (!u.pfShat || P.rupture >= TUN.ruptureMax) return;
        P.rupture++;
        const v = Math.round(P.rupture * TUN.ruptureStep * 1000) / 1000;
        for (const a of this.livingAllies) this.addBuff(a, { s: 'ultP', v, turns: 999, perm: true, name: 'Раскалывание' }, true);
        const who = src && alive(src) ? src : this.livingAllies[0];
        if (who) this.push({ t: 'status', u: who, text: 'Раскалывание ×' + P.rupture });
      }
    },
    sharp: {
      calc(src, tgt, o) {
        if (o.dot && tgt.side === 'enemy') return (1 + TUN.dotUp) * TUN.dotHp * (this.opts.foeHp || 1);
        return src.side === 'enemy' && src.dots.length ? 1 - TUN.dotFoeCut : 1;
      },
      strike({ tgt }) { if (tgt.dots.length) this.advance(tgt, TUN.dotAdv); }
    },
    slander: {
      dot({ u, src, o }) {
        for (const e of this.living.filter(x => Math.abs(x.pfSlot - u.pfSlot) === 1)) this.pfHeldHit(src, e, { fixed: o.fixed * TUN.slander, e: o.e, isDot: true, dot: true, pfEcho: true, label: 'Клевета' });
      }
    },
    rumor: {
      strike({ src, tgt }) { this.addDot(src, tgt, 'shear', TUN.rumor * T.enemyHp * H.grow(tgt.lvl), TUN.rumorTurns); }
    },
    defame: {
      dot() {
        const list = this.livingAllies;
        if (!list.length) return;
        const who = list.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
        this.heal(null, who, who.maxHp * TUN.defameHeal);
        this.advance(who, TUN.defameAdv);
      }
    }
  };

  Object.assign(BP, {
    pfFx(hook, ctx) {
      for (const id of this.pf.fx) {
        const f = PF.FX[id] && PF.FX[id][hook];
        if (f) f.call(this, ctx);
      }
    },

    pfShatAdd(u, src) {
      const st = u.pfShat || (u.pfShat = { n: 0, src: null });
      if (src) st.src = src;
      if (st.n >= TUN.shatter.length - 1) return;
      st.n++;
      this.push({ t: 'pfshat', u, n: st.n });
    },

    pfShatBlast(u) {
      const st = u.pfShat;
      if (!st) return;
      const src = st.src && alive(st.src) ? st.src : this.livingAllies[0];
      if (!src) return;
      const raw = TUN.shatter[st.n] * T.enemyHp * H.grow(u.lvl) * (this.opts.foeHp || 1);
      const near = this.living.filter(e => e === u || Math.abs(e.pfSlot - u.pfSlot) === 1);
      for (const e of near) this.pfHeldHit(src, e, { raw, e: src.elem, isDot: true, label: 'Раскол' });
    },

    pfHeldHit(src, u, o) {
      const at = this.ev.length;
      this.hit(src, u, 0, o);
      for (let i = at; i < this.ev.length; i++) if (this.ev[i].t === 'dmg' && this.ev[i].u === u) this.ev[i].hold = TUN.shatterHold;
    },

    pfStrike(src, tgt) {
      const P = this.pf;
      if (P.strikeAct !== this.actSerial) { P.strikeAct = this.actSerial; P.strikeSeen = new Set(); }
      if (P.strikeSeen.has(tgt)) return;
      P.strikeSeen.add(tgt);
      this.pfFx('strike', { src, tgt });
    },

    pfUltHit(src, tgt) {
      const P = this.pf;
      if (P.ultAct !== this.actSerial) { P.ultAct = this.actSerial; P.ultSeen = new Set(); }
      if (P.ultSeen.has(tgt)) return;
      P.ultSeen.add(tgt);
      this.pfFx('ult', { src, tgt });
    },

    pfPull() {
      const P = this.pf;
      if (!P.bag.length) return null;
      const big = this.living.filter(u => PF.special(u.id)).length;
      const i = big >= TUN.maxSpecial ? P.bag.findIndex(id => !PF.special(id)) : 0;
      return i < 0 ? null : P.bag.splice(i, 1)[0];
    },

    pfRefill() {
      const P = this.pf;
      for (let i = 0; i < this.enemies.length && P.bag.length; i++) {
        const u = this.enemies[i];
        if (alive(u) || u.pfExtra) continue;
        const id = this.pfPull();
        if (!id) return;
        P.spawning = true;
        const e = this.spawnFoe(id, this.opts.pf.lvl, this.current);
        P.spawning = false;
        const hp = Math.round(e.maxHp * (this.opts.foeHp || 1));
        e.maxHp = hp;
        e.hp = hp;
        e.base.hp = hp;
        this.ev[this.ev.length - 1].hold = TUN.spawnHold;
        dress(this, e, u.pfSlot);
        this.enemies.pop();
        this.enemies[i] = e;
        this.pfFx('spawn', { u: e });
      }
    },

    pfGain(u, v) {
      const P = this.pf;
      if (v <= 0) return;
      P.score += v;
      P.byWave[this.wave] += v;
      this.push({ t: 'pfscore', v, u });
    },

    pfKill(u, src) {
      const P = this.pf;
      if (!u.pfVal) return;
      const v = u.pfVal.k + u.pfLeft;
      P.kills[this.wave]++;
      this.pfGain(u, v);
      u.pfLeft = 0;
      P.half = !!(src && src.side === 'ally');
      this.push({ t: 'pfkill', u, v: Math.round(v) });
      if (P.kills[this.wave] >= TUN.eloq) this.pfEloqOff();
    },

    pfEloqOff() {
      for (const u of this.living) {
        if (!u.pfEloq) continue;
        u.pfEloq = false;
        this.addBuff(u, { s: 'vuln', v: TUN.eloqVuln, turns: 999, perm: true, debuff: true, name: 'Без Риторики' }, true);
        this.push({ t: 'pfeloq', u, hold: TUN.eloqHold });
      }
    },

    pfTick(d) {
      const P = this.pf;
      if (this.over) return;
      P.t += d;
      while (P.t >= boundary(P.cyc) - 1e-9) {
        P.cyc++;
        if (P.cyc > this.opts.pf.cycles) {
          P.end = 'cycles';
          this.push({ t: 'text', text: 'Циклы закончились.', warn: true });
          this.finish(false);
          return;
        }
        this.push({ t: 'pfcycle', n: P.cyc });
      }
    },

    pfCycleAv() {
      const P = this.pf;
      return Math.max(0, boundary(P.cyc) - P.t);
    }
  });

  const orderSnap0 = BP.orderSnap;
  BP.orderSnap = function (cur) {
    const snap = orderSnap0.call(this, cur);
    if (this.opts.pf && this.pf) snap.pfAv = this.pfCycleAv();
    return snap;
  };

  const spawnWave0 = BP.spawnWave;
  BP.spawnWave = function (first) {
    const O = this.opts.pf;
    if (!O) return spawnWave0.call(this, first);
    if (!this.pf) this.pf = { t: 0, cyc: 1, score: 0, byWave: O.waves.map(() => 0), kills: O.waves.map(() => 0), bag: [], vals: null, end: null, half: false, spawning: false, fx: [O.whim, O.caco].filter(Boolean), rupture: 0, ultAct: 0, ultSeen: null, strikeAct: 0, strikeSeen: null };
    const wave = O.waves[this.wave];
    this.pf.vals = PF.valuesOf(wave, this.wave);
    this.pf.bag = bagOf(wave, this.rng);
    this.waves[this.wave] = firstLine(this.pf.bag, wave).map(id => id + ':' + O.lvl);
    const out = spawnWave0.call(this, first);
    this.enemies.forEach((u, i) => { dress(this, u, i); this.pfFx('spawn', { u }); });
    return out;
  };

  const spawnFoe0 = BP.spawnFoe;
  BP.spawnFoe = function (id, lvl, by) {
    const e = spawnFoe0.call(this, id, lvl, by);
    if (this.opts.pf && !this.pf.spawning) {
      e.pfExtra = true;
      e.pfSlot = this.enemies.length - 1;
      e.pfMax = this.opts.pf.waves[this.wave].max;
    }
    return e;
  };

  const cleanup0 = BP.cleanup;
  BP.cleanup = function () {
    if (this.opts.pf && !this.over && this.pf) this.pfRefill();
    return cleanup0.call(this);
  };

  const hit0 = BP.hit;
  BP.hit = function (src, tgt, mult, o = {}) {
    if (!this.opts.pf || tgt.side !== 'enemy') return hit0.call(this, src, tgt, mult, o);
    const P = this.pf, ultish = o.kind === 'ult' || o.kind === 'fusion';
    if (ultish && src.side === 'ally' && alive(tgt)) this.pfUltHit(src, tgt);
    if (o.kind === 'fusion' && P.rupture) o = Object.assign({}, o, { extraBonus: (o.extraBonus || 0) + P.rupture * TUN.ruptureStep });
    const before = tgt.hp, r = hit0.call(this, src, tgt, mult, o);
    if (tgt.pfVal && tgt.pfLeft > 0 && tgt.hp < before) {
      const v = Math.min(tgt.pfLeft, tgt.pfVal.d * (before - tgt.hp) / tgt.maxHp);
      tgt.pfLeft -= v;
      this.pfGain(tgt, v);
    }
    if (src.side === 'ally' && !o.isDot && alive(tgt) && !this.over) this.pfStrike(src, tgt);
    if (o.dot && !o.pfEcho && !this.over) this.pfFx('dot', { u: tgt, src, o });
    return r;
  };

  const dmgCalc0 = BP.dmgCalc;
  BP.dmgCalc = function (src, tgt, mult, o, crit) {
    const v = dmgCalc0.call(this, src, tgt, mult, o, crit), P = this.opts.pf && this.pf;
    if (!P) return v;
    let k = 1;
    for (const id of P.fx) if (PF.FX[id] && PF.FX[id].calc) k *= PF.FX[id].calc.call(this, src, tgt, o);
    return k === 1 ? v : Math.max(1, Math.round(v * k));
  };

  const memo0 = BP.memo;
  BP.memo = function (on, ctx) {
    memo0.call(this, on, ctx);
    if (!this.opts.pf || !this.pf) return;
    if (on === 'tick') this.pfTick(ctx.d);
    else if (on === 'kill') this.pfKill(ctx.u, ctx.src);
  };

  const onZero0 = BP.onZero;
  BP.onZero = function (tgt, src) {
    if (!this.opts.pf || tgt.side !== 'enemy') return onZero0.call(this, tgt, src);
    if (tgt.dead || tgt.gone) return;
    if (tgt.pfEloq) {
      tgt.hp = 1;
      this.push({ t: 'pfhold', u: tgt });
      return;
    }
    onZero0.call(this, tgt, src);
    if (tgt.dead && !this.over) this.pfFx('kill', { u: tgt, src });
  };

  const enemyTurn0 = BP.enemyTurn;
  BP.enemyTurn = function (u) {
    if (!this.opts.pf) return enemyTurn0.call(this, u);
    this.pfFx('foeTurn', { u });
    if (alive(u) && !this.over) return enemyTurn0.call(this, u);
  };

  const gainEnergy0 = BP.gainEnergy;
  BP.gainEnergy = function (u, v) {
    const P = this.opts.pf && this.pf;
    if (P && P.half && v === T.energyKill) { P.half = false; v *= TUN.energyKill; }
    return gainEnergy0.call(this, u, v);
  };

  const autoTarget0 = BP.autoTarget;
  BP.autoTarget = function (u) {
    const t = autoTarget0.call(this, u);
    if (!t || !t.pfEloq || t.hp > 1) return t;
    const rest = this.living.filter(e => !e.pfEloq);
    return rest.length ? rest.reduce((a, b) => (b.hp < a.hp ? b : a)) : t;
  };

  const finish0 = BP.finish;
  BP.finish = function (win) {
    if (this.opts.pf && this.pf && !this.pf.end) this.pf.end = win ? 'clear' : 'wiped';
    return finish0.call(this, win);
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
