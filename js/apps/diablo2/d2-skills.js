(function (D) {
  'use strict';
  const { SKILLS, BASIC, ALLIES, clamp } = D;

  const MISSILES = {
    arrow: { spd: 17, life: 1.3, r: 0.28, look: 'arrow' },
    marrow: { spd: 14, life: 1.4, r: 0.28, look: 'arrow' },
    magicarrow: { spd: 17, life: 1.3, r: 0.28, look: 'magicarrow', glow: '#8a8aff' },
    firearrow: { spd: 16, life: 1.3, r: 0.28, look: 'firearrow', glow: '#ff8030' },
    mfirearrow: { spd: 14, life: 1.4, r: 0.28, look: 'firearrow', glow: '#ff8030' },
    coldarrow: { spd: 16, life: 1.3, r: 0.28, look: 'coldarrow', glow: '#80c0ff' },
    guided: { spd: 13, life: 2.6, r: 0.3, look: 'magicarrow', homing: 7, glow: '#b0b0ff' },
    javelin: { spd: 14, life: 1.2, r: 0.3, look: 'javelin' },
    lightjav: { spd: 18, life: 1.0, r: 0.3, look: 'lightjav', glow: '#a0c0ff' },
    lbolt: { spd: 20, life: 0.45, r: 0.3, look: 'lbolt', glow: '#c0d0ff' },
    firebolt: { spd: 13, life: 1.6, r: 0.32, look: 'firebolt', glow: '#ff8030' },
    mfirebolt: { spd: 10, life: 1.8, r: 0.32, look: 'firebolt', glow: '#ff8030' },
    fireball: { spd: 12, life: 1.8, r: 0.35, look: 'fireball', glow: '#ff7020' },
    icebolt: { spd: 11, life: 1.8, r: 0.32, look: 'icebolt', glow: '#80c0ff' },
    micebolt: { spd: 10, life: 1.8, r: 0.32, look: 'icebolt', glow: '#80c0ff' },
    cbolt: { spd: 5.5, life: 1.9, r: 0.32, look: 'cbolt', erratic: true, glow: '#a0b0ff' },
    tooth: { spd: 14, life: 0.9, r: 0.28, look: 'tooth' },
    bonespear: { spd: 16, life: 1.3, r: 0.38, look: 'bonespear', pierce: true, glow: '#e0e0ff' },
    holybolt: { spd: 13, life: 1.3, r: 0.38, look: 'holybolt', pierce: true, glow: '#ffffa0' },
    hammer: { spd: 0, life: 2.4, r: 0.5, look: 'hammer', spiral: true, multi: true, glow: '#c0c0ff' },
    bomb: { arc: true, flight: 0.55, look: 'bomb', r: 0.3 },
    web: { arc: true, flight: 0.5, look: 'web', r: 0.3 },
    rock: { arc: true, flight: 0.7, look: 'rock', r: 0.3 },
    sentinel: { spd: 7, life: 3.5, look: 'sentinel', sentinel: true, r: 0.45, multi: true },
    firestorm: { spd: 4.5, life: 1.8, look: 'fstorm', r: 0.45, multi: true, trail: 'fire', glow: '#ff7020' },
    boulder: { spd: 5, life: 2.2, look: 'boulder', r: 0.55, pierce: true, trail: 'fire', glow: '#ff6020' },
    tornado: { spd: 5.5, life: 2.6, look: 'tornado', wander: true, r: 0.7, multi: true },
    frozenorb: { spd: 6, life: 1.5, look: 'frozenorb', emit: 'iceshard', r: 0.4, glow: '#a0e0ff', noHit: true },
    iceshard: { spd: 10, life: 0.7, r: 0.28, look: 'iceshard', glow: '#a0e0ff' },
    nova_light: { spd: 11, life: 0.5, r: 0.45, look: 'nova_light', pierce: true, glow: '#b0c0ff' },
    nova_cold: { spd: 10, life: 0.55, r: 0.45, look: 'nova_cold', pierce: true, glow: '#a0e0ff' },
    nova_poison: { spd: 8, life: 0.75, r: 0.45, look: 'nova_poison', pierce: true, glow: '#60ff40' },
    nova_fire: { spd: 9, life: 0.4, r: 0.45, look: 'nova_fire', pierce: true, glow: '#ff7020' },
    quill: { spd: 12, life: 0.9, r: 0.26, look: 'quill' },
    mlball: { spd: 6, life: 2.2, r: 0.35, look: 'lball', glow: '#c0c0ff' },
    mpoison: { spd: 9, life: 1.0, r: 0.4, look: 'poison', pierce: true, glow: '#60ff40' },
    mbolt: { spd: 6, life: 1.4, r: 0.3, look: 'cbolt', erratic: true, glow: '#a0b0ff' }
  };

  function synBonus(e, sk) {
    if (!sk.syn || e.kind !== 'hero') return 0;
    let b = 0;
    for (const [id, pct] of sk.syn) b += (e.char.skills[id] || 0) * pct;
    return b;
  }

  function spellPack(e, sk, L, mul) {
    const pack = {};
    const k = (1 + synBonus(e, sk) / 100) * (mul || 1);
    for (const el in sk.dmg) {
      const v = D.val(sk.dmg[el], L);
      const key = el === 'phys' ? 'ph' : el;
      if (el === 'poison') { pack.poison = (v[0] + v[1]) / 2 * k; pack.pdur = sk.pdur || 2; }
      else pack[key] = [v[0] * k, v[1] * k];
    }
    if (sk.chill) pack.chill = D.val(sk.chill, L);
    if (pack.cold && !pack.chill) pack.chill = 3;
    return pack;
  }

  function range(g, e, sid, t) {
    const sk = SKILLS[sid] || BASIC[sid];
    if (!sk) return 1;
    if (sid === 'attack') {
      if (e.st && e.st.ranged) return 18;
      return g.reachOf(e);
    }
    if (sid === 'throw') return 15;
    switch (sk.kind) {
      case 'strike': return sk.leap ? 8.5 : sk.whirl ? 99 : g.reachOf(e);
      case 'shot': return sk.strafe ? 99 : 18;
      case 'stream': return D.sval(sk, 'range', D.skillLevel(e, sid)) * 0.9;
      case 'corpse': return 13;
      case 'summon': return sk.corpse ? 13 : 99;
      default: return 99;
    }
  }

  function weaponOk(e, sk) {
    const st = e.st;
    if (!sk.weapon) return true;
    const rb = st.rb;
    if (sk.weapon === 'bow') return st.ranged;
    if (sk.weapon === 'throw') return st.throwable;
    if (sk.weapon === 'spear') return !!(rb && (rb.type === 'spear' || rb.type === 'javelin' || rb.type === 'polearm'));
    if (sk.weapon === 'melee') return !st.ranged;
    return true;
  }

  function useAmmo(g, e, n) {
    const st = e.st;
    if (st.ranged) {
      const q = st.ammo;
      if (!q || q.qty <= 0) { g.overhead('Нет стрел'); return false; }
      q.qty -= n || 1;
      if (q.qty <= 0) { q.qty = 0; g.msg('Колчан пуст', D.COL.red); }
      return true;
    }
    return true;
  }

  function useThrown(g, e) {
    const it = e.st.rh;
    if (!it || !it.qty) { g.overhead('Нечего бросить'); return false; }
    it.qty--;
    if (it.qty <= 0) {
      const ch = e.char;
      for (const s of ['rh', 'rh2']) if (ch.equip[s] === it) delete ch.equip[s];
      g.msg('Метательное оружие закончилось', D.COL.red);
      g.recalc();
    }
    return true;
  }

  function begin(g, e, sid, o) {
    if (e.act) return false;
    const hero = e.kind === 'hero';
    const sk = SKILLS[sid] || BASIC[sid];
    if (!sk) return false;
    const basic = !!BASIC[sid];
    const L = hero ? (basic ? 1 : D.skillLevel(e, sid)) : (o.lvl || 1);
    if (!L) return false;
    if (hero && e.form && !basic && sk.kind !== 'form' && sk.form !== e.form) {
      if (sk.form) { g.overhead('Нужен другой облик'); return false; }
      endForm(g, e);
    }
    if (hero && !basic && sk.kind !== 'form' && sk.form && e.form !== sk.form) { g.overhead('Нужен облик зверя'); return false; }
    if (hero && !basic && !weaponOk(e, sk)) { g.overhead(sk.weapon === 'bow' ? 'Нужен лук' : sk.weapon === 'throw' ? 'Нужно метательное оружие' : sk.weapon === 'spear' ? 'Нужно копьё или дротик' : 'Нужно оружие ближнего боя'); return false; }
    if (hero && sk.needShield && !e.st.shield) { g.overhead('Нужен щит'); return false; }
    if (e.cd && e.cd[sid] > g.time) return false;
    const mc = hero && !basic ? D.manaCost(sk, L) : 0;
    if (hero && sk.kind !== 'stream' && e.mp < mc) { g.overhead('Не хватает маны'); g.sfx('nomana', e.x, e.y); return false; }
    const ctx = { g, e, sk, sid, L, x: o.x, y: o.y, target: o.target, still: o.still };
    const act = build(ctx);
    if (!act) return false;
    if (hero && sk.kind !== 'stream') e.mp -= mc;
    if (sk.cd && hero) e.cd[sid] = g.time + sk.cd / (1 + D.effPct(e.st.fcr, 120));
    g.startAct(e, act);
    if (act.onStart) act.onStart();
    return true;
  }

  function faceTarget(e, x, y) { if (x !== undefined) e.dir = Math.atan2(y - e.y, x - e.x); }

  function nearestInReach(g, e, reach) {
    let best = null, bd = 1e9;
    for (const m of g.enemiesNear(e.x, e.y, reach + 0.4, e.team)) {
      const d = Math.hypot(m.x - e.x, m.y - e.y);
      const a = Math.abs(((Math.atan2(m.y - e.y, m.x - e.x) - e.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (a < 1.2 && d < bd) { bd = d; best = m; }
    }
    return best;
  }

  function build(c) {
    const { g, e, sk, sid, L } = c;
    const st = e.st;
    faceTarget(e, c.x, c.y);
    if (sid === 'attack') {
      if (st.ranged) {
        return {
          anim: st.rb.type === 'xbow' ? 'xbow' : 'bow', dur: st.atkDur, fireAt: 0.6, x: c.x, y: c.y, target: c.target,
          run: () => { if (!useAmmo(g, e, 1)) return; fireShot(g, e, 'arrow', c, {}); g.sfx('bow', e.x, e.y); }
        };
      }
      const tgt = c.target || nearestInReach(g, e, g.reachOf(e));
      const finisher = e.charges && e.charges.n > 0 && tgt;
      return {
        anim: st.dual && Math.random() < 0.5 ? 'attack2' : 'attack', dur: st.atkDur, fireAt: 0.55, target: tgt, x: c.x, y: c.y,
        run: () => { g.sfx('swing', e.x, e.y); if (tgt) { const tiger = finisher ? tigerBonus(e) : 0; const hit = g.meleeHit(e, tgt, { ed: tiger }); if (hit && finisher) releaseCharges(g, e, tgt); } }
      };
    }
    if (sid === 'throw') {
      return { anim: 'throw', dur: st.atkDur * 1.1, fireAt: 0.55, x: c.x, y: c.y, target: c.target, run: () => { if (!useThrown(g, e)) return; fireShot(g, e, 'javelin', c, { throw: true }); g.sfx('throw', e.x, e.y); } };
    }
    switch (sk.kind) {
      case 'strike': return buildStrike(c);
      case 'shot': return buildShot(c);
      case 'bolt': return castAct(c, () => castBolt(c));
      case 'nova': return castAct(c, () => { nova(g, e, sk.el, null, L, 0, spellPack(e, sk, L)); g.sfx('nova_' + sk.el, e.x, e.y); });
      case 'meteor': return castAct(c, () => { g.effects.push({ k: 'meteor', x: c.x, y: c.y, t: 0, dur: 0.9, r: sk.r, team: e.team, src: e.id, pack: spellPack(e, sk, L), burn: D.val(sk.burn, L) }); g.sfx('meteor_cast', e.x, e.y); });
      case 'blizzard': return castAct(c, () => { g.effects.push({ k: 'blizzard', x: c.x, y: c.y, t: 0, dur: sk.dur, r: sk.r, tick: 0.1, tt: 0, team: e.team, src: e.id, pack: spellPack(e, sk, L, 0.25) }); g.sfx('blizzard', c.x, c.y); });
      case 'firewall': return castAct(c, () => fireWall(g, e, c.x, c.y, sk, L));
      case 'chain': return castAct(c, () => { const p = spellPack(e, sk, L); chain(g, e, c.x, c.y, p, Math.round(D.sval(sk, 'jumps', L))); g.sfx('chain', e.x, e.y); });
      case 'static': return castAct(c, () => staticField(g, e, D.sval(sk, 'r', L), sk.pct));
      case 'teleport': return castAct(c, () => teleport(g, e, c.x, c.y));
      case 'buff': return castAct(c, () => buff(g, e, sk, L));
      case 'curse': return castAct(c, () => curse(g, e, sk, L, c.x, c.y));
      case 'warcry': return Object.assign(castAct(c, () => warcry(g, e, sk, L)), { anim: 'special' });
      case 'summon': case 'trap': return castAct(c, () => summonSkill(g, e, sk, L, c));
      case 'corpse': return castAct(c, () => corpseSkill(g, e, sk, L, c));
      case 'stream': return streamAct(c);
      case 'form': return castAct(c, () => toggleForm(g, e, sk, L));
    }
    return null;
  }

  function castAct(c, fn) {
    const { e } = c;
    return { anim: 'cast', dur: e.kind === 'hero' ? e.st.castDur : 0.8, fireAt: 0.6, x: c.x, y: c.y, target: c.target, run: fn, lockDir: true };
  }

  function tigerBonus(e) {
    const ch = e.charges;
    if (!ch || ch.kind !== 'tiger') return 0;
    return D.val(SKILLS.tiger_strike.chargeEd, ch.lvl) * ch.n;
  }

  function releaseCharges(g, e, tgt) {
    const ch = e.charges;
    if (!ch || !ch.n) return;
    const L = ch.lvl;
    if (ch.kind === 'fire') {
      const d = D.val(SKILLS.fists_of_fire.chargeDmg, L);
      area(g, e, tgt.x, tgt.y, 2.4, { fire: [d[0] * ch.n, d[1] * ch.n] }, 'fire');
    } else if (ch.kind === 'thunder') {
      const d = D.val(SKILLS.claws_of_thunder.chargeDmg, L);
      nova(g, e, 'light', null, L, 0, { light: [d[0] * ch.n * 0.6, d[1] * ch.n * 0.6] });
    } else if (ch.kind === 'phoenix') {
      const d = D.val(SKILLS.phoenix_strike.chargeDmg, L);
      if (ch.n === 1) g.effects.push({ k: 'meteor', x: tgt.x, y: tgt.y, t: 0, dur: 0.7, r: 2.5, team: e.team, src: e.id, pack: { fire: [d[0] * 1.5, d[1] * 1.5] }, burn: [d[0] * 0.2, d[1] * 0.2] });
      else if (ch.n === 2) chain(g, e, tgt.x, tgt.y, { light: [1, d[1] * 2] }, 5);
      else nova(g, e, 'cold', null, L, 0, { cold: [d[0], d[1] * 1.4], chill: 4 });
    }
    g.sfx('release', e.x, e.y);
    e.charges = null;
  }

  function buildStrike(c) {
    const { g, e, sk, L } = c;
    const st = e.st;
    let tgt = c.target;
    if (sk.whirl) {
      const d = Math.min(9, Math.hypot(c.x - e.x, c.y - e.y));
      const dur = Math.max(0.45, d / 6.5);
      return { anim: 'spin', dur, fireAt: 2, whirl: true, wx: c.x, wy: c.y, hitCd: {}, tick: 0, ed: D.val(sk.ed, L), arPct: D.val(sk.ar, L), noBlock: true, x: c.x, y: c.y, lockDir: true };
    }
    if (!tgt) tgt = nearestInReach(g, e, g.reachOf(e) + (sk.leap ? 7 : 0));
    const hits = Math.max(1, Math.round(D.sval(sk, 'hits', L) || 1));
    const ed = D.val(sk.ed, L);
    const arPct = D.val(sk.ar, L);
    const add = {};
    if (sk.add) for (const k in sk.add) add[k] = D.val(sk.add[k], L);
    const baseDur = sk.kick ? st.atkDur * 1.05 : st.atkDur;
    const dur = sk.leap ? 0.75 : baseDur * (1 + 0.55 * (hits - 1));
    const hitTimes = [];
    for (let i = 0; i < hits; i++) hitTimes.push(hits === 1 ? (sk.leap ? 0.85 : 0.55) : (0.35 + 0.6 * i / (hits - 1)) * 0.95);
    const act = {
      anim: sk.kick ? 'kick' : sk.leap ? 'leap' : 'attack', dur, hitTimes, target: tgt, x: c.x, y: c.y, arPct,
      run: (gg, ee, a, k) => {
        let t = a.target;
        if (!t || t.dead) { t = nearestInReach(g, e, g.reachOf(e)); a.target = t; }
        g.sfx(sk.kick ? 'kick' : 'swing', e.x, e.y);
        if (!t) return;
        const finisher = (sk.finisher || !sk.charge) && e.charges && e.charges.n > 0;
        const edx = ed + (finisher ? tigerBonus(e) : 0);
        const o = { ed: edx, add, kick: !!sk.kick, offhand: sk.id === 'double_swing' && k % 2 === 1, knock: !!sk.knock, reach: sk.leap ? 2 : undefined };
        if (sk.charge === 'fire' || sk.charge === 'thunder' || sk.charge === 'phoenix') {
          const d = D.val(sk.chargeDmg, L);
          o.add = Object.assign({}, add, sk.charge === 'fire' ? { fire: [d[0] * 0.5, d[1] * 0.5] } : sk.charge === 'thunder' ? { light: [d[0] * 0.3, d[1] * 0.3] } : { fire: [d[0] * 0.3, d[1] * 0.3] });
        }
        const hit = g.meleeHit(e, t, o);
        if (!hit) return;
        if (sk.sacrifice) g.rawHurt(e, Math.max(1, e.hpMax * 0.02), null);
        if (sk.stun && !t.boss) { t.fx.stun = Math.max(t.fx.stun || 0, D.sval(sk, 'stun', L)); g.overheadFx(t, 'stun'); }
        if (sk.bolts) chargedBolts(g, e, t, Math.round(D.sval(sk, 'bolts', L)), D.val(sk.boltDmg, L));
        if (sk.charge) {
          if (!e.charges || e.charges.kind !== sk.charge) e.charges = { kind: sk.charge, n: 0, lvl: L, t: g.time };
          e.charges.n = Math.min(3, e.charges.n + 1);
          e.charges.t = g.time;
          e.charges.lvl = L;
          g.sfx('charge', e.x, e.y);
        } else if (finisher) releaseCharges(g, e, t);
      }
    };
    if (sk.leap && tgt) {
      const p = D.nearestWalkable(g.area, tgt.x - Math.cos(e.dir) * 0.9, tgt.y - Math.sin(e.dir) * 0.9, 3) || { x: e.x, y: e.y };
      Object.assign(act, { leap: true, lx0: e.x, ly0: e.y, lx1: p.x, ly1: p.y, noBlock: true });
    }
    return act;
  }

  function leapStep(g, e, a) {
    const p = Math.min(1, a.t / (a.dur * 0.8));
    e.x = a.lx0 + (a.lx1 - a.lx0) * p;
    e.y = a.ly0 + (a.ly1 - a.ly0) * p;
    e.z = Math.sin(p * Math.PI) * 1.4;
    if (p >= 1) e.z = 0;
  }

  function whirlStep(g, e, a, dt) {
    const dx = a.wx - e.x, dy = a.wy - e.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.2) { const s = Math.min(d, 6.5 * dt); if (!g.tryMove(e, e.x + dx / d * s, e.y + dy / d * s)) a.t = a.dur; }
    a.tick -= dt;
    if (a.tick <= 0) {
      a.tick = 0.18;
      g.sfx('whirl', e.x, e.y);
      for (const m of g.enemiesNear(e.x, e.y, 1.7, e.team)) {
        if ((a.hitCd[m.id] || 0) > g.time) continue;
        a.hitCd[m.id] = g.time + 0.45;
        g.meleeHit(e, m, { ed: a.ed, reach: 1.9 });
      }
    }
  }

  function fireShot(g, e, look, c, o) {
    const sk = c.sk;
    const L = c.L;
    const ang = Math.atan2(c.y - e.y, c.x - e.x);
    const pk = () => {
      const opts = { throw: o.throw, target: c.target, ed: sk ? D.val(sk.ed, L) : 0, dmgMul: sk && sk.dmgMul };
      if (sk && sk.add) { opts.add = {}; for (const k in sk.add) opts.add[k] = D.val(sk.add[k], L); }
      const p = g.heroWeaponPack(e, opts);
      if (sk && sk.convert === 'light') { const v = D.val(sk.conv, L); p.light = [v[0] + p.ph * 0.5, v[1] + p.ph]; p.ph = 0; }
      return p;
    };
    const m = MISSILES[look] ? look : 'arrow';
    const count = sk && sk.count ? Math.round(D.sval(sk, 'count', L)) : 1;
    const spread = sk && sk.spread ? sk.spread : 0;
    for (let i = 0; i < count; i++) {
      const a = ang + (i - (count - 1) / 2) * spread;
      const ms = spawn(g, m, e, e.x, e.y, a, pk(), { target: c.target, arPct: sk ? D.val(sk.ar, L) : 0 });
      if (sk && sk.explode) ms.explode = { r: sk.explode.r, pack: { fire: D.val(sk.explode.fire, L) } };
      if (sk && sk.trail) { ms.trail = sk.trail; ms.trailPack = { poison: (D.val(sk.trailDmg, L)[0] + D.val(sk.trailDmg, L)[1]) / 2, pdur: 2 }; }
      if (sk && sk.split) { ms.split = Math.round(D.sval(sk, 'split', L)); ms.splitPack = { light: D.val(sk.conv, L) }; }
      if (e.st && e.st.pierce && g.rng.next() < e.st.pierce / 100) ms.pierce = true;
    }
  }

  function buildShot(c) {
    const { g, e, sk, L } = c;
    const st = e.st;
    const throwIt = sk.weapon === 'throw';
    if (sk.strafe) {
      const n = Math.round(D.sval(sk, 'strafe', L));
      const targets = g.enemiesNear(e.x, e.y, 14, e.team).filter(m => D.losLine(g.area, e.x, e.y, m.x, m.y)).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(0, n);
      if (!targets.length) { g.overhead('Нет целей'); return null; }
      const hitTimes = [];
      const k = Math.max(targets.length, 3);
      for (let i = 0; i < k; i++) hitTimes.push(0.25 + 0.7 * i / k);
      return {
        anim: 'bow', dur: st.atkDur * (1 + k * 0.25), hitTimes, x: targets[0].x, y: targets[0].y,
        run: (gg, ee, a, i) => { const t = targets[i % targets.length]; if (t.dead) return; if (!useAmmo(g, e, 1)) return; e.dir = Math.atan2(t.y - e.y, t.x - e.x); fireShot(g, e, 'arrow', Object.assign({}, c, { x: t.x, y: t.y, target: t }), {}); g.sfx('bow', e.x, e.y); }
      };
    }
    return {
      anim: throwIt ? 'throw' : st.rb && st.rb.type === 'xbow' ? 'xbow' : 'bow', dur: st.atkDur * (throwIt ? 1.1 : 1), fireAt: 0.6, x: c.x, y: c.y, target: c.target,
      run: () => {
        if (throwIt) { if (!useThrown(g, e)) return; }
        else if (!sk.noAmmo && !useAmmo(g, e, 1)) return;
        fireShot(g, e, sk.m, c, { throw: throwIt });
        g.sfx(throwIt ? 'throw' : sk.m === 'magicarrow' || sk.m === 'guided' ? 'magic_arrow' : 'bow', e.x, e.y);
      }
    };
  }

  function castBolt(c) {
    const { g, e, sk, L } = c;
    const pack = spellPack(e, sk, L);
    const ang = Math.atan2(c.y - e.y, c.x - e.x);
    const count = sk.count ? Math.round(D.sval(sk, 'count', L)) : 1;
    const spread = sk.spread || 0;
    g.sfx('cast_' + (sk.m || sk.el), e.x, e.y);
    for (let i = 0; i < count; i++) {
      const a = count === 1 ? ang : sk.m === 'cbolt' ? ang + g.rng.range(-spread, spread) : ang + (i - (count - 1) / 2) * spread;
      const def = MISSILES[sk.m];
      const o = { target: c.target, tx: c.x, ty: c.y };
      if (def.arc && count > 1) {
        const d = Math.hypot(c.x - e.x, c.y - e.y), da = a - ang;
        const rx = c.x - e.x, ry = c.y - e.y;
        o.tx = e.x + rx * Math.cos(da) - ry * Math.sin(da) * 1.4 + g.rng.range(-0.4, 0.4);
        o.ty = e.y + rx * Math.sin(da) * 1.4 + ry * Math.cos(da) + g.rng.range(-0.4, 0.4);
        if (d < 1) { o.tx = c.x + Math.cos(a) * 1.2; o.ty = c.y + Math.sin(a) * 1.2; }
      }
      const m = spawn(g, sk.m, e, e.x, e.y, a, pack, o);
      if (sk.explode) m.explode = { r: sk.explode, pack };
      if (sk.pierce) m.pierce = true;
      if (sk.undeadOnly) { m.undeadOnly = true; m.heal = D.val(sk.heal, L); }
      if (sk.undeadBonus) m.undeadBonus = sk.undeadBonus;
      if (sk.knock) m.knock = true;
      if (def.arc && sk.m === 'web') m.webPack = { light: pack.light };
      if (sk.m === 'sentinel') { m.tx = c.x; m.ty = c.y; }
    }
  }

  function spawn(g, look, src, x, y, ang, pack, o) {
    const def = MISSILES[look];
    o = o || {};
    const m = {
      id: g.nid(), look, def, x, y, z: 1.0, ang, vx: Math.cos(ang) * def.spd, vy: Math.sin(ang) * def.spd, t: 0, life: def.life || 2,
      team: src.team, src: src.id, pack, hit: new Set(), hitCd: {}, target: o.target || null, sx: x, sy: y, tx: o.tx, ty: o.ty,
      lvl: src.lvl || 1, arPct: o.arPct || 0, pierce: !!def.pierce, emitT: 0, trailT: 0, seed: g.rng.next() * 1000
    };
    if (def.arc) { m.tx = o.tx !== undefined ? o.tx : x + Math.cos(ang) * 6; m.ty = o.ty !== undefined ? o.ty : y + Math.sin(ang) * 6; m.life = def.flight; }
    if (def.spiral) { m.ox = x; m.oy = y; m.a0 = ang; }
    g.missiles.push(m);
    return m;
  }

  function updateMissiles(g, dt) {
    const a = g.area;
    for (let i = g.missiles.length - 1; i >= 0; i--) {
      const m = g.missiles[i];
      const def = m.def;
      m.t += dt;
      let dead = false;
      if (def.arc) {
        const p = Math.min(1, m.t / def.flight);
        m.x = m.sx + (m.tx - m.sx) * p;
        m.y = m.sy + (m.ty - m.sy) * p;
        m.z = 0.8 + Math.sin(p * Math.PI) * 2;
        if (p >= 1) { arrive(g, m); dead = true; }
      } else {
        if (def.spiral) {
          const rad = 0.6 + m.t * 1.7;
          const an = m.a0 + m.t * 4.2;
          m.x = m.ox + Math.cos(an) * rad;
          m.y = m.oy + Math.sin(an) * rad;
        } else {
          if (def.homing && m.target && !m.target.dead) {
            const want = Math.atan2(m.target.y - m.y, m.target.x - m.x);
            let da = ((want - m.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            m.ang += clamp(da, -def.homing * dt, def.homing * dt);
          }
          if (def.erratic) m.ang += (g.rng.next() - 0.5) * 9 * dt;
          if (def.wander) m.ang += Math.sin(m.t * 3 + m.seed) * 1.1 * dt;
          if (def.sentinel) {
            const tx = m.back ? (g.ents.find(e => e.id === m.src) || m).x : m.tx, ty = m.back ? (g.ents.find(e => e.id === m.src) || m).y : m.ty;
            const d = Math.hypot(tx - m.x, ty - m.y);
            if (d < 0.5) m.back = !m.back;
            m.ang = Math.atan2(ty - m.y, tx - m.x);
          }
          m.vx = Math.cos(m.ang) * def.spd;
          m.vy = Math.sin(m.ang) * def.spd;
          const nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
          if (!D.flyable(a, Math.floor(nx), Math.floor(ny)) && !def.sentinel) {
            if (m.explode) explodeAt(g, m, m.x, m.y);
            if (def.emit) burst(g, m);
            dead = true;
          } else { m.x = nx; m.y = ny; }
        }
        if (def.emit) {
          m.emitT -= dt;
          if (m.emitT <= 0) { m.emitT = 0.06; const ang = m.t * 11 + m.seed; spawn(g, def.emit, srcOf(g, m), m.x, m.y, ang, scalePack(m.pack, 0.35), {}); }
        }
        if (m.trail) {
          m.trailT -= dt;
          if (m.trailT <= 0) { m.trailT = 0.35; g.effects.push({ k: m.trail, x: m.x, y: m.y, r: 0.9, t: 0, dur: 2, tick: 0.3, tt: 0, team: m.team, src: m.src, pack: m.trailPack }); }
        }
        if (def.trail && !m.trail) {
          m.trailT -= dt;
          if (m.trailT <= 0) { m.trailT = 0.25; g.effects.push({ k: 'fire', x: m.x, y: m.y, r: 0.7, t: 0, dur: 1.6, tick: 0.3, tt: 0, team: m.team, src: m.src, pack: scalePack(m.pack.fire ? { fire: m.pack.fire } : m.pack, 0.12) }); }
        }
        if (!dead && !def.noHit) dead = collide(g, m);
        if (m.t >= m.life && !dead) {
          if (m.explode) explodeAt(g, m, m.x, m.y);
          if (def.emit) burst(g, m);
          dead = true;
        }
      }
      if (dead) g.missiles.splice(i, 1);
    }
  }

  function scalePack(p, k) {
    const o = {};
    for (const key in p) {
      const v = p[key];
      if (Array.isArray(v)) o[key] = [v[0] * k, v[1] * k];
      else if (key === 'poison' || key === 'ph') o[key] = typeof v === 'number' ? v * k : v;
      else o[key] = v;
    }
    return o;
  }

  function srcOf(g, m) {
    return g.ents.find(e => e.id === m.src) || { id: m.src, team: m.team, lvl: m.lvl, x: m.x, y: m.y, kind: 'ghost' };
  }

  function collide(g, m) {
    const def = m.def;
    const src = srcOf(g, m);
    for (const e of g.ents) {
      if (e.dead || e.team === 2) continue;
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (d > def.r + e.r) continue;
      if (e.team === m.team) {
        if (m.heal && e.id !== m.src && !m.hit.has(e.id)) { m.hit.add(e.id); e.hp = Math.min(e.hpMax, e.hp + D.roll(g.rng, m.heal)); g.vfx.push({ k: 'heal', x: e.x, y: e.y, z: 1, t: 0, dur: 0.5 }); }
        continue;
      }
      if (def.multi) { if ((m.hitCd[e.id] || 0) > g.time) continue; m.hitCd[e.id] = g.time + 0.5; }
      else if (m.hit.has(e.id)) continue;
      m.hit.add(e.id);
      if (m.undeadOnly && !(e.mon && e.mon.undead)) continue;
      if (src.kind === 'hero' && m.look !== 'hammer' && !m.pack.light && !m.pack.fire && !m.pack.cold && !m.pack.magic && !m.pack.poison) {
        const hc = g.hitChance(Object.assign({}, src, { act: { arPct: m.arPct } }), e);
        if (g.rng.next() > hc) { if (!m.pierce) return true; continue; }
      }
      if (e.kind === 'hero' && e.st.shield && g.rng.next() < e.st.block / 100 * 0.8 && !m.pack.poison) {
        if (!e.act) { e.anim = { n: 'block', t: 0, dur: 0.28 }; e.act = { t: 0, dur: 0.28, fired: 1, block: true }; }
        g.sfx('block', e.x, e.y);
        return true;
      }
      g.damage(src, e, m.pack, { missile: true, undeadBonus: m.undeadBonus });
      if (m.knock) g.knock(src, e, 1.2);
      if (m.explode) { explodeAt(g, m, m.x, m.y); return true; }
      if (m.split) { splitBolts(g, m, e); }
      if (!m.pierce && !def.multi) return true;
    }
    return false;
  }

  function splitBolts(g, m, from) {
    const others = g.enemiesNear(from.x, from.y, 7, m.team).filter(o => o !== from).slice(0, m.split);
    const src = srcOf(g, m);
    for (const o of others) spawn(g, 'lbolt', src, from.x, from.y, Math.atan2(o.y - from.y, o.x - from.x), m.splitPack, {});
    g.vfx.push({ k: 'spark', x: from.x, y: from.y, z: 1, t: 0, dur: 0.4, c: '#c0d0ff' });
    g.sfx('hit_light', from.x, from.y);
  }

  function explodeAt(g, m, x, y) {
    const src = srcOf(g, m);
    const ex = m.explode;
    area(g, src, x, y, ex.r, ex.pack, ex.pack.cold ? 'cold' : 'fire');
  }

  function area(g, src, x, y, r, pack, el) {
    for (const e of g.enemiesNear(x, y, r, src.team)) g.damage(src, e, pack, { missile: true });
    g.vfx.push({ k: 'boom', el: el || 'fire', x, y, z: 0.5, t: 0, dur: 0.5, r });
    g.sfx('explode_' + (el || 'fire'), x, y);
  }

  function arrive(g, m) {
    const src = srcOf(g, m);
    if (m.look === 'bomb') area(g, src, m.x, m.y, 2.2, m.pack, 'fire');
    else if (m.look === 'web') g.effects.push({ k: 'web', x: m.x, y: m.y, r: 1.2, t: 0, dur: 3.2, tick: 0.35, tt: 0, team: m.team, src: m.src, pack: scalePack(m.webPack || m.pack, 0.35) });
    else if (m.look === 'rock') area(g, src, m.x, m.y, 1.3, m.pack, 'fire');
  }

  function burst(g, m) {
    const src = srcOf(g, m);
    for (let k = 0; k < 16; k++) spawn(g, 'iceshard', src, m.x, m.y, k / 16 * Math.PI * 2, scalePack(m.pack, 0.5), {});
    g.sfx('orb_burst', m.x, m.y);
  }

  function nova(g, src, el, dmg, L, rr, packIn) {
    const pack = packIn || (el === 'fire' ? { fire: dmg } : el === 'cold' ? { cold: dmg, chill: 3 } : el === 'poison' ? { poison: (dmg[0] + dmg[1]) / 2, pdur: 2 } : { light: dmg });
    const look = 'nova_' + (el === 'fire' ? 'fire' : el === 'cold' ? 'cold' : el === 'poison' ? 'poison' : 'light');
    const n = 40;
    for (let k = 0; k < n; k++) spawn(g, look, src, src.x, src.y, k / n * Math.PI * 2, pack, {});
    g.vfx.push({ k: 'ring', el, x: src.x, y: src.y, z: 0.3, t: 0, dur: 0.55, r: 5.5 });
  }

  function chain(g, src, x, y, pack, jumps) {
    const hitSet = new Set();
    let cur = null, bd = 3.5;
    for (const e of g.enemiesNear(x, y, 3.5, src.team)) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; cur = e; } }
    if (!cur) {
      const ang = Math.atan2(y - src.y, x - src.x);
      for (let s = 1; s < 12 && !cur; s += 0.7) {
        const px = src.x + Math.cos(ang) * s, py = src.y + Math.sin(ang) * s;
        if (!D.flyable(g.area, Math.floor(px), Math.floor(py))) break;
        cur = g.enemiesNear(px, py, 0.8, src.team)[0] || null;
      }
    }
    const pts = [{ x: src.x, y: src.y }];
    let n = 0;
    while (cur && n <= jumps) {
      hitSet.add(cur.id);
      pts.push({ x: cur.x, y: cur.y });
      g.damage(src, cur, pack, { missile: true });
      n++;
      let nx = null, nd = 6.5;
      for (const e of g.enemiesNear(cur.x, cur.y, 6.5, src.team)) { if (hitSet.has(e.id)) continue; const d = Math.hypot(e.x - cur.x, e.y - cur.y); if (d < nd) { nd = d; nx = e; } }
      cur = nx;
    }
    if (pts.length === 1) { const ang = Math.atan2(y - src.y, x - src.x); pts.push({ x: src.x + Math.cos(ang) * 6, y: src.y + Math.sin(ang) * 6 }); }
    g.vfx.push({ k: 'bolt', pts, t: 0, dur: 0.3 });
  }

  function chargedBolts(g, src, from, n, dmg) {
    for (let k = 0; k < n; k++) spawn(g, 'cbolt', src, from.x, from.y, g.rng.range(0, Math.PI * 2), { light: dmg }, {});
  }

  function monsterBolts(g, m) {
    const d = m.dmg;
    for (let k = 0; k < 5; k++) spawn(g, 'mbolt', m, m.x, m.y, g.rng.range(0, Math.PI * 2), { light: [1, d[1] * 1.2] }, {});
  }

  function staticField(g, e, r, pct) {
    for (const m of g.enemiesNear(e.x, e.y, r, e.team)) {
      if (m.hp <= m.hpMax * (g.diff === 0 ? 0.01 : 0.34) && m.boss) continue;
      const cut = m.hp * pct / 100 * (m.boss ? 0.5 : 1);
      g.damage(e, m, { light: [cut, cut] }, {});
    }
    g.vfx.push({ k: 'static', x: e.x, y: e.y, z: 0.3, t: 0, dur: 0.5, r });
    g.sfx('static', e.x, e.y);
  }

  function teleport(g, e, x, y) {
    const a = g.area;
    const d = Math.hypot(x - e.x, y - e.y);
    let tx = x, ty = y;
    if (d > 16) { tx = e.x + (x - e.x) / d * 16; ty = e.y + (y - e.y) / d * 16; }
    const p = D.nearestWalkable(a, tx, ty, 2);
    if (!p) { g.overhead('Сюда нельзя'); return; }
    g.vfx.push({ k: 'tele', x: e.x, y: e.y, z: 0, t: 0, dur: 0.4 });
    e.x = p.x; e.y = p.y; e.path = null;
    g.vfx.push({ k: 'tele', x: e.x, y: e.y, z: 0, t: 0, dur: 0.4 });
    g.sfx('teleport', e.x, e.y);
    if (e.order) e.order = null;
  }

  function fireWall(g, e, x, y, sk, L) {
    const len = D.sval(sk, 'len', L);
    const ang = Math.atan2(y - e.y, x - e.x) + Math.PI / 2;
    const dps = D.val(sk.dmg, L);
    const k = 1 + synBonus(e, sk) / 100;
    for (let s = -len / 2; s <= len / 2; s += 0.8) {
      const px = x + Math.cos(ang) * s, py = y + Math.sin(ang) * s;
      if (!D.walkable(g.area, Math.floor(px), Math.floor(py))) continue;
      g.effects.push({ k: 'firewall', x: px, y: py, r: 0.65, t: 0, dur: sk.dur, tick: 0.25, tt: 0, team: e.team, src: e.id, pack: { fire: [dps[0] * 0.25 * k, dps[1] * 0.25 * k] } });
    }
    g.sfx('firewall', x, y);
  }

  function buff(g, e, sk, L) {
    const b = e.fx.buffs;
    const dur = D.val(sk.dur, L) || 60;
    switch (sk.sub) {
      case 'frozen_armor': b.frozen_armor = { t: dur, edef: D.val(sk.edef, L), freeze: D.val(sk.freeze, L) }; break;
      case 'bone_armor': b.bone_armor = { t: Infinity, val: D.val(sk.absorb, L), max: D.val(sk.absorb, L) }; break;
      case 'burst': b.burst = { t: dur, ias: D.val(sk.ias, L), frw: D.val(sk.frw, L) }; break;
      case 'fade': b.fade = { t: dur, val: D.val(sk.resAll, L) }; break;
      case 'holy_shield': b.holy_shield = { t: dur, edef: D.val(sk.edef, L), block: D.val(sk.block, L) }; break;
    }
    g.sfx('buff_' + sk.sub, e.x, e.y);
    g.vfx.push({ k: 'buff', el: sk.el, x: e.x, y: e.y, z: 0, t: 0, dur: 0.8, follow: e.id });
    if (e.kind === 'hero') g.recalc();
  }

  function curse(g, e, sk, L, x, y) {
    const r = D.sval(sk, 'r', L);
    const dur = D.val(sk.dur, L);
    const val = D.val(sk.val, L);
    for (const m of g.enemiesNear(x, y, r, e.team)) {
      m.fx.curse = { type: sk.sub, t: m.boss ? dur * 0.6 : dur, val };
      D.AI.provoke(g, m, e);
    }
    g.vfx.push({ k: 'curse', sub: sk.sub, x, y, z: 0, t: 0, dur: 0.7, r });
    g.sfx('curse', x, y);
  }

  function warcry(g, e, sk, L) {
    const r = D.sval(sk, 'r', L);
    const dur = D.val(sk.dur, L);
    const val = D.val(sk.val, L);
    if (sk.sub === 'howl') for (const m of g.enemiesNear(e.x, e.y, r, e.team)) { if (!m.boss) m.fx.fear = dur; }
    if (sk.sub === 'battle_cry') for (const m of g.enemiesNear(e.x, e.y, r, e.team)) m.fx.buffs.battle_cry = { t: dur };
    if (sk.sub === 'shout' || sk.sub === 'battle_orders') {
      for (const a of g.alliesNear(e.x, e.y, r, e.team)) {
        a.fx.buffs[sk.sub] = { t: dur, val };
        if (sk.sub === 'battle_orders' && a.kind !== 'hero' && !a.boBonus) { a.boBonus = true; a.hpMax = Math.round(a.hpMax * (1 + val / 100)); }
      }
      if (e.kind === 'hero') { const pct = e.hp / e.hpMax; g.recalc(); if (sk.sub === 'battle_orders') e.hp = Math.max(e.hp, pct * e.hpMax); }
    }
    g.vfx.push({ k: 'warcry', x: e.x, y: e.y, z: 0, t: 0, dur: 0.7, r });
    g.sfx('warcry', e.x, e.y);
  }

  const GOLEMS = ['claygolem', 'bloodgolem', 'firegolem'];
  const SPIRITS = ['oaksage', 'wolverine'];

  function summonSkill(g, e, sk, L, c) {
    let x = c.x, y = c.y;
    if (sk.corpse) {
      const corpse = c.target && c.target.dead ? c.target : g.corpseNear(x, y, 2.5);
      if (!corpse || corpse.noCorpse) { g.overhead('Нужен труп'); return; }
      corpse.noCorpse = true;
      x = corpse.x; y = corpse.y;
    }
    const p = D.nearestWalkable(g.area, x, y, 3);
    if (!p) return;
    const mx = sk.max === 'raise' ? D.raiseMax(L) : Math.round(D.sval(sk, 'max', L));
    const same = u => g.pets.filter(pp => !pp.dead && (pp.unit === u || (sk.golem && GOLEMS.includes(pp.unit)) || (sk.spirit && SPIRITS.includes(pp.unit))));
    const cur = same(sk.unit);
    while (cur.length >= mx) { const old = cur.shift(); old.dead = true; old.noCorpse = true; old.deathT = 1.5; }
    const pet = makePet(g, e, sk.unit, L, p.x, p.y, sk);
    g.vfx.push({ k: 'summon', el: sk.el, x: p.x, y: p.y, z: 0, t: 0, dur: 0.7 });
    g.sfx('summon_' + sk.unit, p.x, p.y);
    return pet;
  }

  function makePet(g, owner, unit, L, x, y, sk) {
    const u = ALLIES[unit];
    const dm = [1, 1.6, 2.4][g.diff];
    const dmgM = [1, 1.7, 2.6][g.diff];
    const ol = owner.lvl || 1;
    const st = owner.st || {};
    const s = {
      skeleton: { hp: 22 + 9 * L + (st.skelLife || 0), dmg: [2 + L * 1.2 + (st.skelDmg || 0), 4 + L * 2 + (st.skelDmg || 0)], ar: 30 + 18 * L, def: 15 + 8 * L },
      skelmage: { hp: 14 + 6 * L + (st.skelLife || 0) * 0.5, dmg: [2 + L * 1.5 + (st.skelDmg || 0), 5 + L * 2.5 + (st.skelDmg || 0)], ar: 40, def: 10 + 5 * L },
      claygolem: { hp: 60 + 30 * L, dmg: [3 + 2 * L, 7 + 3 * L], ar: 40 + 20 * L, def: 30 + 12 * L },
      bloodgolem: { hp: 90 + 25 * L, dmg: [6 + 3 * L, 12 + 4.5 * L], ar: 50 + 22 * L, def: 30 + 10 * L },
      firegolem: { hp: 140 + 35 * L, dmg: [10 + 4 * L, 20 + 6 * L], ar: 60 + 25 * L, def: 40 + 14 * L },
      valkyrie: { hp: 100 + 35 * L, dmg: [8 + 4 * L, 18 + 6 * L], ar: 100 + 35 * L, def: 60 + 15 * L },
      decoy: { hp: 40 + 20 * L, dmg: [0, 0], ar: 0, def: 30 + 10 * L },
      shadow: { hp: 70 + 22 * L, dmg: [5 + 3 * L, 11 + 5 * L], ar: 80 + 30 * L, def: 40 + 12 * L },
      spiritwolf: { hp: 35 + 13 * L, dmg: [2 + 2 * L, 5 + 3 * L], ar: 50 + 22 * L, def: 20 + 9 * L },
      grizzly: { hp: 200 + 50 * L, dmg: [15 + 6 * L, 30 + 9 * L], ar: 90 + 30 * L, def: 60 + 18 * L },
      raven: { hp: 10, dmg: [2 + L, 4 + 2 * L], ar: 999, def: 999 },
      oaksage: { hp: 40 + 12 * L, dmg: [0, 0], ar: 0, def: 40 },
      wolverine: { hp: 40 + 12 * L, dmg: [0, 0], ar: 0, def: 40 },
      cbsentry: { hp: 999, dmg: [0, 0], ar: 0, def: 0 },
      lsentry: { hp: 999, dmg: [0, 0], ar: 0, def: 0 },
      volcano: { hp: 999, dmg: [0, 0], ar: 0, def: 0 }
    }[unit];
    const p = {
      id: g.nid(), kind: 'pet', team: owner.team, unit, owner: owner.id, name: u.name, x, y, r: u.r, dir: owner.dir || 0, speed: u.speed, range: u.range, atk: u.atk,
      model: u.model, tint: u.tint, fx: { buffs: {} }, anim: { n: 'appear', t: 0, dur: 0.5 }, act: null, path: null, stepPhase: 0, lvl: Math.max(ol, L),
      hpMax: Math.round(s.hp * dm), dmg: [s.dmg[0] * dmgM, s.dmg[1] * dmgM], ar: s.ar * (1 + ol / 20), def: s.def, skillLvl: L, float: !!u.float,
      ai: { st: 'follow', t: 0, cd: 0 }, resAll: Math.min(75, 20 + L * 2) - [0, 40, 100][g.diff], glow: u.glow, shadowy: u.shadow
    };
    p.hp = p.hpMax;
    if (unit === 'raven') { p.hits = 12; p.untargetable = true; }
    if (unit === 'decoy') { p.summonT = D.val(SKILLS.decoy.dur, L); p.model = 'amazon'; }
    if (unit === 'volcano') { p.summonT = D.val(SKILLS.volcano.dur, L); p.untargetable = true; p.pack = spellPack(owner, SKILLS.volcano, L); }
    if (unit === 'cbsentry' || unit === 'lsentry') {
      const skd = SKILLS[unit === 'cbsentry' ? 'charged_bolt_sentry' : 'lightning_sentry'];
      p.shots = skd.shots; p.untargetable = true; p.pack = spellPack(owner, skd, L); p.boltN = Math.round(D.sval(skd, 'boltCount', L)) || 5;
      const traps = g.pets.filter(pp => !pp.dead && (pp.unit === 'cbsentry' || pp.unit === 'lsentry'));
      while (traps.length >= 5) { const o = traps.shift(); o.dead = true; o.noCorpse = true; }
    }
    if (unit === 'skelmage') p.el = g.rng.pick(['fire', 'cold', 'light', 'poison']);
    if (unit === 'claygolem') p.slows = true;
    if (unit === 'shadow' || unit === 'valkyrie') p.resAll += 20;
    g.pets.push(p);
    g.area.ents.push(p);
    return p;
  }

  function corpseSkill(g, e, sk, L, c) {
    const corpse = c.target && c.target.dead ? c.target : g.corpseNear(c.x, c.y, 2.5);
    if (!corpse || corpse.noCorpse) { g.overhead('Нужен труп'); return; }
    corpse.noCorpse = true;
    if (sk.sub === 'explode') {
      const r = D.sval(sk, 'r', L);
      const lo = corpse.hpMax * sk.pct[0] / 100, hi = corpse.hpMax * sk.pct[1] / 100;
      area(g, e, corpse.x, corpse.y, r, { ph: [lo * 0.5, hi * 0.5], fire: [lo * 0.5, hi * 0.5] }, 'corpse');
      corpse.exploded = true;
    } else if (sk.sub === 'potion') {
      if (g.rng.next() < D.val(sk.chance, L) / 100) g.dropItem(D.potionFor(g.rng, corpse.lvl, g.rng.chance(0.15) ? 'r' : null), corpse.x, corpse.y);
      else g.overhead('Ничего нет');
      g.sfx('body', corpse.x, corpse.y);
    }
  }

  function streamAct(c) {
    const { g, e, sk, L } = c;
    const mps = D.manaCost(sk, L);
    const tick = 0.2;
    if (e.mp < mps * tick) { g.overhead('Не хватает маны'); return null; }
    return {
      anim: 'cast', dur: 0.22, fireAt: 0.1, x: c.x, y: c.y, lockDir: false, stream: true,
      run: () => {
        e.mp -= mps * tick;
        const rr = D.sval(sk, 'range', L);
        const dps = D.val(sk.dmg, L);
        const k = (1 + synBonus(e, sk) / 100) * tick;
        const pack = sk.el2 === 'fire' ? { fire: [dps[0] * k, dps[1] * k] } : { cold: [dps[0] * k, dps[1] * k], chill: 2 };
        const ang = Math.atan2(c.y - e.y, c.x - e.x);
        e.dir = ang;
        for (const m of g.enemiesNear(e.x, e.y, rr, e.team)) {
          const da = Math.abs(((Math.atan2(m.y - e.y, m.x - e.x) - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (da < 0.38 && D.losLine(g.area, e.x, e.y, m.x, m.y)) g.damage(e, m, pack, {});
        }
        g.vfx.push({ k: 'stream', el: sk.el2, x: e.x, y: e.y, ang, r: rr, t: 0, dur: 0.3 });
        if (g.rng.next() < 0.35) g.sfx(sk.el2 === 'fire' ? 'inferno' : 'arctic', e.x, e.y);
      }
    };
  }

  function toggleForm(g, e, sk, L) {
    if (e.form === sk.form) { endForm(g, e); return; }
    const pct = e.hp / e.hpMax;
    e.form = sk.form;
    e.model = sk.form === 'wolf' ? 'werewolf' : 'werebear';
    g.recalc();
    e.hp = Math.max(1, pct * e.hpMax);
    g.vfx.push({ k: 'summon', el: 'nature', x: e.x, y: e.y, z: 0, t: 0, dur: 0.7 });
    g.sfx('form', e.x, e.y);
  }

  function endForm(g, e) {
    if (!e.form) return;
    const pct = e.hp / e.hpMax;
    e.form = null;
    e.model = e.cls;
    g.recalc();
    e.hp = Math.max(1, pct * e.hpMax);
    g.sfx('form', e.x, e.y);
  }

  function updateEffects(g, dt) {
    for (let i = g.effects.length - 1; i >= 0; i--) {
      const f = g.effects[i];
      f.t += dt;
      const src = g.ents.find(e => e.id === f.src) || { id: f.src, team: f.team, x: f.x, y: f.y, lvl: 1, kind: 'ghost' };
      if (f.k === 'meteor') {
        if (f.t >= f.dur) {
          area(g, src, f.x, f.y, f.r, f.pack, 'fire');
          g.effects.push({ k: 'fire', x: f.x, y: f.y, r: f.r * 0.8, t: 0, dur: 3, tick: 0.3, tt: 0, team: f.team, src: f.src, pack: { fire: [f.burn[0] * 0.3, f.burn[1] * 0.3] } });
          g.vfx.push({ k: 'shake', t: 0, dur: 0.3 });
          g.effects.splice(i, 1);
        }
        continue;
      }
      if (f.k === 'blizzard') {
        f.tt -= dt;
        if (f.tt <= 0) {
          f.tt = f.tick;
          const a = g.rng.range(0, Math.PI * 2), r = Math.sqrt(g.rng.next()) * f.r;
          const px = f.x + Math.cos(a) * r, py = f.y + Math.sin(a) * r;
          g.vfx.push({ k: 'shard', x: px, y: py, z: 0, t: 0, dur: 0.45 });
          for (const m of g.enemiesNear(px, py, 1.1, f.team)) g.damage(src, m, f.pack, {});
        }
      } else if (f.pack) {
        f.tt -= dt;
        if (f.tt <= 0) {
          f.tt = f.tick;
          for (const m of g.enemiesNear(f.x, f.y, f.r, f.team)) {
            g.damage(src, m, f.pack, { dot: true });
            if (f.k === 'web' && g.rng.next() < 0.3) g.vfx.push({ k: 'spark', x: m.x, y: m.y, z: 0.5, t: 0, dur: 0.25, c: '#c0d0ff' });
          }
        }
      }
      if (f.t >= f.dur) g.effects.splice(i, 1);
    }
  }

  function updateAuras(g, dt) {
    const h = g.hero;
    g.auraT = (g.auraT || 0) - dt;
    if (g.auraT > 0) return;
    g.auraT = 0.5;
    const fx = {};
    const auras = [];
    const right = SKILLS[h.char.right];
    if (right && right.kind === 'aura' && !h.dead) { const L = D.skillLevel(h, right.id); if (L) auras.push({ sk: right, L, src: h }); }
    if (h.st.aura && !h.dead) auras.push({ sk: SKILLS[h.st.aura.id], L: h.st.aura.lvl, src: h });
    for (const p of g.pets) {
      if (p.dead) continue;
      if (p.unit === 'oaksage' && Math.hypot(p.x - h.x, p.y - h.y) < 14) fx.oak = Math.max(fx.oak || 0, 30 + p.skillLvl * 5);
      if (p.unit === 'wolverine' && Math.hypot(p.x - h.x, p.y - h.y) < 14) { fx.wolverineEd = 20 + p.skillLvl * 7; fx.wolverineAr = 25 + p.skillLvl * 7; }
      if (p.unit === 'firegolem') for (const m of g.enemiesNear(p.x, p.y, 4, p.team)) g.damage(p, m, { fire: [p.skillLvl * 2, p.skillLvl * 4] }, { dot: true });
    }
    for (const { sk, L, src } of auras) {
      const r = D.sval(sk, 'r', L) || 7;
      switch (sk.sub) {
        case 'might': fx.ed = (fx.ed || 0) + D.val(sk.ed, L); break;
        case 'fanaticism': fx.ed = (fx.ed || 0) + D.val(sk.ed, L); fx.fanatIas = D.val(sk.ias, L); fx.arPct = (fx.arPct || 0) + D.val(sk.arPct, L); break;
        case 'defiance': fx.edef = (fx.edef || 0) + D.val(sk.edef, L); break;
        case 'vigor': fx.frw = (fx.frw || 0) + D.val(sk.frw, L); break;
        case 'meditation': fx.manaRegen = (fx.manaRegen || 0) + D.val(sk.regen, L); break;
        case 'thorns': fx.thorns = D.val(sk.val, L); break;
        case 'holy_fire': {
          const d = D.val(sk.dps, L);
          fx.holyFireAdd = D.val(sk.add.fire, L);
          for (const m of g.enemiesNear(src.x, src.y, r, src.team)) g.damage(src, m, { fire: [d[0] * 0.5, d[1] * 0.5] }, { dot: true });
          if (g.rng.next() < 0.5) g.vfx.push({ k: 'aurapulse', el: 'fire', x: src.x, y: src.y, z: 0, t: 0, dur: 0.5, r });
          break;
        }
        case 'holy_freeze': {
          const d = D.val(sk.dps, L);
          const slow = D.val(sk.slow, L) / 100;
          for (const m of g.enemiesNear(src.x, src.y, r, src.team)) { g.damage(src, m, { cold: [d[0] * 0.5, d[1] * 0.5] }, { dot: true }); m.fx.chill = Math.max(m.fx.chill || 0, 0.7); m.fx.chillPct = Math.max(m.fx.chillPct || 0, slow); }
          if (g.rng.next() < 0.5) g.vfx.push({ k: 'aurapulse', el: 'cold', x: src.x, y: src.y, z: 0, t: 0, dur: 0.5, r });
          break;
        }
        case 'prayer': {
          const hv = D.val(sk.heal, L) * 0.5;
          for (const a of g.alliesNear(src.x, src.y, r, src.team)) if (a.hp < a.hpMax) a.hp = Math.min(a.hpMax, a.hp + hv);
          break;
        }
        case 'cleansing': {
          const cut = D.val(sk.cut, L) / 100;
          for (const a of g.alliesNear(src.x, src.y, r, src.team)) {
            if (a.fx.poison) a.fx.poison.t *= 1 - cut * 0.5;
            if (a.fx.curse) a.fx.curse.t *= 1 - cut * 0.5;
          }
          break;
        }
      }
    }
    h.activeAuras = auras.map(a => a.sk.id);
    const key = JSON.stringify(fx);
    if (key !== h.auraKey) { h.auraKey = key; h.auraFx = fx; g.recalc(); }
    if (h.charges && g.time - h.charges.t > 40) h.charges = null;
  }

  function monShoot(g, m, t) {
    const def = m.mon;
    const ang = Math.atan2(t.y - m.y, t.x - m.x);
    const pack = g.monsterPack(m);
    if (def.missile === 'mfirebolt' || def.missile === 'mfirearrow') { pack.fire = [pack.ph * 0.6, pack.ph * 1.1]; pack.ph *= def.missile === 'mfirebolt' ? 0 : 0.6; }
    if (def.missile === 'mlball') { pack.light = [1, pack.ph * 2]; pack.ph = 0; }
    const n = m.mods.includes('multishot') ? 3 : 1;
    for (let k = 0; k < n; k++) spawn(g, def.missile, m, m.x, m.y, ang + (k - (n - 1) / 2) * 0.22, pack, { target: t });
    g.sfx(def.missile === 'marrow' || def.missile === 'mfirearrow' ? 'bow' : def.missile === 'quill' ? 'quill' : 'cast_firebolt', m.x, m.y);
  }

  function andarielSpray(g, m, t) {
    const ang = Math.atan2(t.y - m.y, t.x - m.x);
    for (let k = 0; k < 9; k++) spawn(g, 'mpoison', m, m.x, m.y, ang + (k - 4) * 0.12, { poison: m.dmg[1] * 2.2, pdur: 3 }, {});
    g.sfx('andariel_spray', m.x, m.y);
  }

  function petShoot(g, p, t) {
    const ang = Math.atan2(t.y - p.y, t.x - p.x);
    if (p.unit === 'skelmage') {
      const el = p.el;
      const look = el === 'fire' ? 'mfirebolt' : el === 'cold' ? 'micebolt' : el === 'light' ? 'mlball' : 'mpoison';
      const d = p.dmg;
      const pack = el === 'poison' ? { poison: d[1] * 2, pdur: 2 } : { [el]: [d[0], d[1]] };
      if (el === 'cold') pack.chill = 2;
      spawn(g, look, p, p.x, p.y, ang, pack, { target: t });
      g.sfx('cast_firebolt', p.x, p.y);
    } else if (p.kind === 'merc') {
      const pack = g.petPack(p);
      spawn(g, p.merc.type === 'fire' ? 'firearrow' : 'coldarrow', p, p.x, p.y, ang, pack, { target: t });
      g.sfx('bow', p.x, p.y);
    }
  }

  function trapShoot(g, p, t) {
    if (p.unit === 'cbsentry') {
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      for (let k = 0; k < p.boltN; k++) spawn(g, 'cbolt', p, p.x, p.y, ang + g.rng.range(-0.5, 0.5), p.pack, {});
      g.sfx('cast_cbolt', p.x, p.y);
    } else {
      const src = p;
      g.damage(src, t, p.pack, { missile: true });
      g.vfx.push({ k: 'bolt', pts: [{ x: p.x, y: p.y }, { x: t.x, y: t.y }], t: 0, dur: 0.25 });
      g.sfx('chain', p.x, p.y);
    }
    p.shots--;
    if (p.shots <= 0) { p.dead = true; p.noCorpse = true; p.deathT = 1.5; }
  }

  function volcanoTick(g, p) {
    for (let k = 0; k < 2; k++) {
      const a = g.rng.range(0, Math.PI * 2), r = g.rng.range(1, 4.5);
      spawn(g, 'rock', p, p.x, p.y, a, p.pack, { tx: p.x + Math.cos(a) * r, ty: p.y + Math.sin(a) * r });
    }
    g.sfx('volcano', p.x, p.y);
  }

  const Skills = {
    MISSILES, range, begin, updateMissiles, updateEffects, updateAuras, nova, chain, spawn, monsterBolts, whirlStep, leapStep,
    monShoot, andarielSpray, petShoot, trapShoot, volcanoTick, spellPack, makePet, endForm, area, synBonus
  };
  D.Skills = Skills;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
