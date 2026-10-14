/**
 * League of Legends 98 — champion kits: ability casts, passives, on-hit effects and hints for the bot AI.
 * Each kit: init, cast[4](g, c, rank, tgt) -> false if invalid, tick, stats, attackMod, onHit, afterCast, onTakedown, ai[4].
 */
(function (L) {
  'use strict';
  const { DT } = L.DATA;
  const V = (c, slot) => c.def.abilities[slot].v;
  const at = (arr, r) => arr[Math.min(arr.length, r) - 1];
  const dirTo = (c, t) => { const dx = t.x - c.x, dy = t.y - c.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d, d]; };
  const hitFilter = (g, team) => u => u.team !== team && !u.structure && u.kind !== 'ward' && u.kind !== 'trap' && !g.has(u, 'untargetable') && !g.has(u, 'stasis');

  // Ryze's Desperate Power: spells splash around the target
  function spell(g, c, t, amt, type = 'magic', opt = {}) {
    const d = g.spellDmg(c, t, amt, type, opt);
    if (c.cid === 'ryze' && g.tagged(c, 'desperate') && !opt.noSplash) for (const e of g.enemiesIn(t.x, t.y, 220, c.team)) if (e !== t) g.spellDmg(c, e, amt * 0.5, type, { aoe: true, noSplash: true });
    return d;
  }

  const KITS = {};

  // ================================================================== LULU
  KITS.lulu = {
    cast: [
      (g, c, r, t) => { // Glitterlance
        const [dx, dy] = dirTo(c, t), v = V(c, 0);
        g.skillshot(c, c.x, c.y - 30, dx, dy, { speed: 1450, range: 925, width: 60, look: 'lance', color: '#ff80ff', onHit: (u) => {
          spell(g, c, u, at(v.d, r) + v.ap * c.st.ap);
          g.addStatus(u, { type: 'slow', amt: 0.8, t: 2, tag: 'luluQ', src: c, tick: s => { s.amt = 0.8 * Math.max(0, s.t / s.max); } });
          return false;
        } });
        g.sfx('lulu_q', c.x, c.y);
      },
      (g, c, r, t) => { // Whimsy
        const u = t.unit, v = V(c, 1);
        if (u.team === c.team) { g.buff(u, 'whimsy', at(v.t, r), { msPct: 0.3, ap: 25 }); g.fx('sparkle', { unit: u.id, color: '#ff80ff' }); }
        else { g.cc(u, 'poly', at(v.poly, r), c, { tag: 'poly' }); g.fx('poof', { x: u.x, y: u.y, color: '#ff80ff' }); }
        g.sfx('lulu_w', u.x, u.y);
      },
      (g, c, r, t) => { // Help, Pix!
        const u = t.unit, v = V(c, 2), amt = at(v.d, r) + v.ap * c.st.ap;
        if (u.team === c.team) { g.shield(u, amt, 6, 'pix'); g.fx('shield', { unit: u.id, color: '#ffe0ff' }); }
        else { g.homing(c, u, { speed: 1600, look: 'pix', onHit: () => { spell(g, c, u, amt); g.addStatus(u, { type: 'reveal', tag: 'pixReveal', t: 4 }); } }); }
        g.sfx('lulu_e', c.x, c.y);
      },
      (g, c, r, t) => { // Wild Growth
        const u = t.unit, v = V(c, 3);
        g.buff(u, 'wildGrowth', 7, { hp: at(v.hp, r) }, { grow: true });
        for (const e of g.enemiesIn(u.x, u.y, 350, c.team)) { g.cc(e, 'knockup', 0.75, c); }
        g.addStatus(u, { type: 'aura', tag: 'wgAura', t: 7, tick: s => { if (g.tickN % 6) return; for (const e of g.enemiesIn(u.x, u.y, 350, c.team)) g.slow(e, 0.3, 0.4, c, 'wgSlow'); } });
        g.fx('grow', { unit: u.id }); g.sfx('lulu_r', u.x, u.y);
      }
    ],
    onHit(g, c, t) {
      if (t.structure) return;
      const dmg = 8 + 4 * c.level + 0.15 * c.st.ap;
      g.homing(c, t, { speed: 1400, look: 'pix', delay: 0.1, onHit: () => g.damage(c, t, dmg, 'magic', {}) });
    },
    ai: [{ type: 'skillshot', speed: 1450, width: 60, range: 925, dmg: true, cc: true }, { type: 'poly', range: 650 }, { type: 'shield', range: 650, dmg: true }, { type: 'saveAlly', range: 900 }]
  };

  // ================================================================== JINX
  KITS.jinx = {
    init(g, c) { c.k.rocket = false; c.k.stacks = 0; c.k.stackT = 0; },
    excited(g, c) { g.buff(c, 'excited', 4, { msPct: 0.6, asp: 0.5 }); g.sfx('jinx_excited', c.x, c.y); },
    stats(g, c, st) {
      const r = c.ranks[0]; if (!r) return;
      const v = V(c, 0);
      if (c.k.rocket) st.range += at(v.rng, r);
      else if (c.k.stacks) st.as = Math.min(2.5, st.as + c.def.stats.as * at(v.as, r) * c.k.stacks);
    },
    tick(g, c) { if (c.k.stacks && (c.k.stackT -= DT) <= 0) { c.k.stacks--; c.k.stackT = 0.8; } },
    attackMod(g, c, t, dmg) {
      if (!c.k.rocket) return dmg;
      if (c.mp < 20) { c.k.rocket = false; return dmg; }
      c.mp -= 20; dmg *= 1.1;
      for (const e of g.enemiesIn(t.x, t.y, 250, c.team)) if (e !== t) g.damage(c, e, dmg, 'phys', { aoe: true });
      g.fx('boom', { x: t.x, y: t.y, r: 250 });
      return dmg;
    },
    onHit(g, c) { if (!c.k.rocket) { c.k.stacks = Math.min(3, c.k.stacks + 1); c.k.stackT = 2.5; } },
    cast: [
      (g, c) => { c.k.rocket = !c.k.rocket; c.k.stacks = 0; c.atkCd = Math.max(c.atkCd, 0.25); g.sfx('jinx_q', c.x, c.y); },
      (g, c, r, t) => { // Zap!
        const [dx, dy] = dirTo(c, t), v = V(c, 1);
        g.addStatus(c, { type: 'channel', t: 0.6 }); g.fx('charge', { unit: c.id, color: '#80e0ff', t: 0.6 });
        g.later(0.6, () => {
          if (c.dead) return;
          g.skillshot(c, c.x, c.y - 30, dx, dy, { speed: 3300, range: 1450, width: 60, look: 'zap', color: '#80e0ff', onHit: (u) => {
            spell(g, c, u, at(v.d, r) + v.adr * c.st.ad, 'phys'); g.slow(u, at(v.slow, r), 2, c, 'zap'); g.addStatus(u, { type: 'reveal', tag: 'zapReveal', t: 2 }); return true;
          } });
          g.sfx('jinx_w', c.x, c.y);
        });
      },
      (g, c, r, t) => { // Flame Chompers
        const [dx, dy] = dirTo(c, t), v = V(c, 2), nx = -dy, ny = dx;
        for (const k of [-1, 0, 1]) {
          const x = t.x + nx * k * 160, y = t.y + ny * k * 160;
          if (!g.map.walkable(x, y)) continue;
          g.mkUnit('trap', c.team, x, y, { r: 30, ownerRef: c, look: 'chomper', armT: 0.5, life: 5, trigger: 90, champsOnly: true, vis: [true, true], onTrigger: (hit) => {
            g.cc(hit, 'root', 1.5, c);
            for (const e of g.enemiesIn(hit.x, hit.y, 220, c.team, true)) spell(g, c, e, at(v.d, r) + v.ap * c.st.ap);
            g.fx('boom', { x: hit.x, y: hit.y, r: 220, color: '#ff8020' }); g.sfx('explode', hit.x, hit.y);
          } });
        }
        g.sfx('jinx_e', t.x, t.y);
      },
      (g, c, r, t) => { // Super Mega Death Rocket
        const [dx, dy] = dirTo(c, t), v = V(c, 3);
        g.addStatus(c, { type: 'channel', t: 0.6 }); g.sfx('jinx_r_charge', c.x, c.y);
        g.later(0.6, () => {
          if (c.dead) return;
          g.skillshot(c, c.x, c.y - 30, dx, dy, { speed: 1500, accel: 1200, maxSpeed: 2400, range: 30000, width: 140, champsOnly: true, global: true, look: 'megarocket', onHit: (u, p) => {
            const f = Math.min(1, 0.1 + 0.9 * p.traveled / 1500);
            const dmg = (at(v.d, r) + v.bad * c.bonusAd) * f + at(v.miss, r) * (u.maxHp - u.hp);
            spell(g, c, u, dmg, 'phys');
            for (const e of g.enemiesIn(u.x, u.y, 225, c.team)) if (e !== u) g.damage(c, e, dmg * 0.8, 'phys', { spell: true, aoe: true });
            g.fx('boom', { x: u.x, y: u.y, r: 300, color: '#ff4020', big: true }); g.sfx('explode_big', u.x, u.y, { global: true });
            return true;
          } });
          g.sfx('jinx_r', c.x, c.y, { global: true });
        });
      }
    ],
    ai: [{ type: 'jinxToggle' }, { type: 'skillshot', speed: 3300, delay: 0.6, width: 60, range: 1450, dmg: true, cc: true, stopsOnUnit: true }, { type: 'trapFeet', range: 900 }, { type: 'globalExecute' }]
  };

  // ================================================================== GAREN
  KITS.garen = {
    init(g, c) { c.k.lastHardDmg = -99; },
    tick(g, c) {
      if (g.time - (c.k.lastHardDmg || -99) > 8 && c.hp < c.maxHp) g.heal(c, c.maxHp * 0.015 * DT);
      if (c.k.spinT > 0) {
        c.k.spinT -= DT; c.k.spinTick -= DT;
        if (c.k.spinTick <= 0) {
          c.k.spinTick = 0.5; const v = V(c, 2), r = c.ranks[2];
          for (const e of g.enemiesIn(c.x, c.y, 330, c.team)) g.spellDmg(c, e, at(v.d, r) + v.adr * c.st.ad, 'phys', { aoe: true });
          g.sfx('garen_spin', c.x, c.y);
        }
      }
    },
    attackMod(g, c, t, dmg) {
      if (c.k.qUntil > g.time) { const v = V(c, 0); c.k.qUntil = 0; c.k.qHit = t; return dmg + at(v.d, c.ranks[0]) + (v.adr - 1) * c.st.ad; }
      return dmg;
    },
    onHit(g, c, t) { if (c.k.qHit === t) { c.k.qHit = null; if (!t.structure) g.cc(t, 'silence', 1.5, c); g.fx('spark', { x: t.x, y: t.y, color: '#ffe060' }); g.sfx('garen_q_hit', t.x, t.y); } },
    cast: [
      (g, c, r) => { g.removeStatus(c, s => s.type === 'slow'); g.buff(c, 'garenQ', at(V(c, 0).t, r), { msPct: 0.3 }); c.k.qUntil = g.time + 4.5; c.atkCd = 0; g.sfx('garen_q', c.x, c.y); },
      (g, c, r) => { g.addStatus(c, { type: 'dr', tag: 'courage', amt: 0.3, t: at(V(c, 1).t, r) }); g.buff(c, 'courageTen', at(V(c, 1).t, r), { ten: 0.3 }); g.fx('shield', { unit: c.id, color: '#ffe080' }); g.sfx('garen_w', c.x, c.y); },
      (g, c) => { c.k.spinT = 3; c.k.spinTick = 0; g.addStatus(c, { type: 'noAttack', tag: 'spin', t: 3 }); c.windup = 0; },
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 3);
        g.fx('sword', { unit: u.id }); g.sfx('garen_r', u.x, u.y);
        g.later(0.35, () => { if (!u.dead) g.spellDmg(c, u, at(v.d, r) + at(v.miss, r) * (u.maxHp - u.hp), 'true'); });
      }
    ],
    ai: [{ type: 'selfEngage' }, { type: 'selfDefense' }, { type: 'aoeSelf', r: 330, dmg: true }, { type: 'execute', range: 400 }]
  };

  // ================================================================== ANNIE
  KITS.annie = {
    init(g, c) { c.k.pyro = 0; c.k.stunReady = false; },
    afterCast(g, c, slot) {
      if (c.k.stunReady && slot !== 2) { c.k.stunReady = false; c.k.pyro = 0; }
      else if (!c.k.stunReady && ++c.k.pyro >= 4) { c.k.stunReady = true; g.sfx('annie_ready', c.x, c.y); }
    },
    cast: [
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 0), stun = c.k.stunReady, cost = c.def.abilities[0].cost[r - 1];
        g.homing(c, u, { speed: 1400, look: 'fireball', onHit: () => {
          spell(g, c, u, at(v.d, r) + v.ap * c.st.ap); if (stun) g.cc(u, 'stun', 1.5, c);
          if (u.dead) { c.mp = Math.min(c.maxMp, c.mp + cost); c.cds[0] *= 0.5; }
        } });
        g.sfx('annie_q', c.x, c.y);
      },
      (g, c, r, t) => {
        const [dx, dy] = dirTo(c, t), v = V(c, 1), stun = c.k.stunReady;
        for (const e of g.enemiesIn(c.x, c.y, 640, c.team)) {
          const ex = e.x - c.x, ey = e.y - c.y, d = Math.hypot(ex, ey) || 1;
          if ((ex * dx + ey * dy) / d < Math.cos(0.45)) continue;
          spell(g, c, e, at(v.d, r) + v.ap * c.st.ap, 'magic', { aoe: true }); if (stun) g.cc(e, 'stun', 1.5, c);
        }
        g.fx('cone', { x: c.x, y: c.y, dx, dy, r: 620, a: 0.45, color: '#ff7020' }); g.sfx('annie_w', c.x, c.y);
      },
      (g, c, r) => { const v = V(c, 2); g.shield(c, at(v.s, r) + v.ap * c.st.ap, 5, 'molten'); g.addStatus(c, { type: 'buffFx', tag: 'moltenShield', t: 5, ret: at(v.ret, r) + 0.2 * c.st.ap }); g.sfx('annie_e', c.x, c.y); },
      (g, c, r, t) => {
        const v = V(c, 3), stun = c.k.stunReady;
        for (const e of g.enemiesIn(t.x, t.y, 290, c.team)) { spell(g, c, e, at(v.d, r) + v.ap * c.st.ap, 'magic', { aoe: true }); if (stun) g.cc(e, 'stun', 1.5, c); }
        const old = g.units.find(u => u.kind === 'pet' && u.ownerRef === c && !u.dead); if (old) g.killUnit(old, null);
        const hp = at(v.hp, r);
        const p = g.mkUnit('pet', c.team, t.x, t.y, { petType: 'tibbers', r: 80, hp, maxHp: hp, ownerRef: c, life: 45, aura: [20, 30, 40][r - 1] + 0.2 * c.st.ap, baseMs: 350, baseAs: 0.8, baseAd: [80, 105, 130][r - 1] + 0.15 * c.st.ap });
        Object.assign(p.st, { ad: p.baseAd, as: 0.8, range: 150, armor: 30 + 10 * r, mr: 30 + 10 * r, ms: 350 });
        g.fx('boom', { x: t.x, y: t.y, r: 290, color: '#ff6010', big: true }); g.sfx('annie_r', t.x, t.y);
      }
    ],
    ai: [{ type: 'targetDmg', range: 625, dmg: true, farm: true }, { type: 'cone', range: 600, dmg: true }, { type: 'selfDefense' }, { type: 'aoePoint', range: 600, r: 290, dmg: true, cc: true, ult: true }]
  };

  // ================================================================== ASHE
  KITS.ashe = {
    onHit(g, c, t) { if (!t.structure) g.slow(t, 0.15 + 0.15 * (c.level - 1) / 17, 2, c, 'frost'); },
    attackMod(g, c, t, dmg) { return g.tagged(c, 'focus') ? dmg * 1.1 : dmg; },
    cast: [
      (g, c, r) => { g.buff(c, 'focus', 4, { asp: at(V(c, 0).as, r) }); g.sfx('ashe_q', c.x, c.y); },
      (g, c, r, t) => {
        const [dx, dy] = dirTo(c, t), v = V(c, 1), a0 = Math.atan2(dy, dx), hitSet = new Set();
        for (let i = 0; i < 9; i++) {
          const a = a0 + (i - 4) * (1.0 / 8);
          g.skillshot(c, c.x, c.y - 30, Math.cos(a), Math.sin(a), { speed: 1500, range: 1200, width: 20, look: 'arrow', color: '#c0f0ff', onHit: (u) => {
            if (hitSet.has(u.id)) return true; hitSet.add(u.id);
            spell(g, c, u, at(v.d, r) + v.adr * c.st.ad, 'phys'); g.slow(u, at(v.slow, r), 2, c, 'volley'); return true;
          } });
        }
        g.sfx('ashe_w', c.x, c.y);
      },
      (g, c, r, t) => { g.lob(c, t.x, t.y, { speed: 1400, look: 'hawk', onArrive: () => { g.revealArea(c.team, t.x, t.y, 1000, 5); g.fx('reveal', { x: t.x, y: t.y, r: 1000 }); } }); g.sfx('ashe_e', c.x, c.y); },
      (g, c, r, t) => {
        const [dx, dy] = dirTo(c, t), v = V(c, 3);
        g.skillshot(c, c.x, c.y - 30, dx, dy, { speed: 1600, range: 30000, width: 130, champsOnly: true, global: true, look: 'crystal', onHit: (u, p) => {
          spell(g, c, u, at(v.d, r) + v.ap * c.st.ap); g.cc(u, 'stun', 1 + 2.5 * Math.min(1, p.traveled / 2500), c);
          for (const e of g.enemiesIn(u.x, u.y, 250, c.team)) if (e !== u) g.spellDmg(c, e, (at(v.d, r) + v.ap * c.st.ap) * 0.5, 'magic', { aoe: true });
          g.fx('shatter', { x: u.x, y: u.y, r: 250 }); g.sfx('ashe_r_hit', u.x, u.y, { global: true }); return true;
        } });
        g.sfx('ashe_r', c.x, c.y, { global: true });
      }
    ],
    ai: [{ type: 'selfAttackBuff' }, { type: 'skillshot', speed: 1500, width: 120, range: 1100, dmg: true, cc: true, cone: true }, { type: 'scout' }, { type: 'globalCC' }]
  };

  // ================================================================== MASTER YI
  KITS.masteryi = {
    init(g, c) { c.k.hits = 0; },
    onHit(g, c, t) {
      if (c.cds[0] > 0) c.cds[0] = Math.max(0, c.cds[0] - 1);
      if (g.tagged(c, 'wuju') && c.ranks[2]) { const v = V(c, 2); g.damage(c, t, at(v.d, c.ranks[2]) + v.badr * c.bonusAd, 'true', {}); }
      if (++c.k.hits % 4 === 0) g.later(0.15, () => { if (!t.dead && !c.dead) { g.damage(c, t, c.st.ad * 0.5, 'phys', { attack: true }); g.fx('slash', { x: t.x, y: t.y }); } });
    },
    cast: [
      (g, c, r, t) => { // Alpha Strike
        const v = V(c, 0), first = t.unit, targets = [first];
        for (const e of g.enemiesIn(first.x, first.y, 600, c.team).sort((a, b) => L.dist(a, first) - L.dist(b, first))) { if (targets.length >= 4) break; if (!targets.includes(e) && e.vis[c.team]) targets.push(e); }
        g.addStatus(c, { type: 'untargetable', t: 0.2 * targets.length + 0.15 }); g.addStatus(c, { type: 'channel', t: 0.2 * targets.length + 0.1 });
        g.fx('flash', { x: c.x, y: c.y, color: '#80ff60' });
        targets.forEach((u, i) => g.later(0.2 * i + 0.05, () => {
          if (u.dead || c.dead) return;
          c.x = c.px = u.x - 60 * (i % 2 ? -1 : 1); c.y = c.py = u.y + 20; if (!g.map.walkable(c.x, c.y)) { c.x = c.px = u.x; c.y = c.py = u.y; }
          let dmg = at(v.d, r) + v.adr * c.st.ad; if (g.rng() < c.st.crit) dmg *= 1.6;
          if (u.kind !== 'champ') dmg += at(v.mb, r);
          g.spellDmg(c, u, dmg, 'phys'); g.fx('slash', { x: u.x, y: u.y, color: '#80ff60' }); g.sfx('yi_q', u.x, u.y);
        }));
        g.later(0.2 * targets.length + 0.1, () => { if (!c.dead && !first.dead && first.vis[c.team]) { c.x = c.px = first.x - 70; c.y = c.py = first.y; if (!g.map.walkable(c.x, c.y)) { c.x = c.px = first.x; c.y = c.py = first.y; } } });
      },
      (g, c, r) => { // Meditate
        const v = V(c, 1);
        c.order = null; c.path = null; c.windup = 0;
        const dr = g.addStatus(c, { type: 'dr', tag: 'meditate', amt: at(v.red, r), t: 4 });
        let tickT = 0;
        g.addStatus(c, { type: 'channel', tag: 'meditateC', t: 4, tick: () => { tickT += DT; if (tickT >= 0.5) { tickT = 0; g.heal(c, at(v.h, r) + v.ap * c.st.ap, c); } } });
        c.k.channel = { onEnd: () => { g.removeStatus(c, s => s === dr || s.tag === 'meditateC'); } };
        g.sfx('yi_w', c.x, c.y);
      },
      (g, c) => { g.buff(c, 'wuju', 5, {}); g.sfx('yi_e', c.x, c.y); },
      (g, c, r) => { const v = V(c, 3); g.buff(c, 'highlander', 10, { msPct: at(v.ms, r), asp: at(v.as, r) }); g.addStatus(c, { type: 'slowImmune', tag: 'hlImm', t: 10 }); g.removeStatus(c, s => s.type === 'slow'); g.sfx('yi_r', c.x, c.y); }
    ],
    onTakedown(g, c) {
      if (!c.ranks[3]) return;
      for (let i = 0; i < 3; i++) c.cds[i] *= 0.3;
      const h = g.tagged(c, 'highlander'); if (h) { h.t += 4; const im = g.tagged(c, 'hlImm'); if (im) im.t += 4; }
    },
    ai: [{ type: 'targetDmg', range: 600, dmg: true, farm: true, gapclose: true }, { type: 'channelHeal' }, { type: 'selfAttackBuff' }, { type: 'selfAttackBuff', ult: true }]
  };

  // ================================================================== MALPHITE
  KITS.malphite = {
    tick(g, c) {
      if (g.time - c.lastDmgT > 10 && !c.shields.some(s => s.tag === 'granite')) { g.shield(c, c.maxHp * 0.1, 9999, 'granite'); }
    },
    onHit(g, c, t) {
      if (!g.tagged(c, 'thunder') || t.structure) return;
      const v = V(c, 1), r = c.ranks[1], dmg = at(v.d, r) + v.ap * c.st.ap + 0.1 * c.st.armor;
      g.damage(c, t, dmg, 'phys', {});
      for (const e of g.enemiesIn(t.x, t.y, 200, c.team)) if (e !== t) g.damage(c, e, dmg, 'phys', { aoe: true });
      g.fx('boom', { x: t.x, y: t.y, r: 200, color: '#d0b080' });
    },
    cast: [
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 0);
        g.homing(c, u, { speed: 1200, look: 'shard', onHit: () => {
          spell(g, c, u, at(v.d, r) + v.ap * c.st.ap); g.slow(u, at(v.steal, r), 4, c, 'shard'); g.buff(c, 'shardMs', 4, { msPct: at(v.steal, r) });
        } });
        g.sfx('malph_q', c.x, c.y);
      },
      (g, c) => { g.buff(c, 'thunder', 6, {}); g.sfx('malph_w', c.x, c.y); },
      (g, c, r) => {
        const v = V(c, 2);
        for (const e of g.enemiesIn(c.x, c.y, 400, c.team)) { spell(g, c, e, at(v.d, r) + v.ap * c.st.ap + 0.3 * c.st.armor, 'magic', { aoe: true }); g.addStatus(e, { type: 'asSlow', tag: 'slam', amt: at(v.slow, r), t: 3 }); }
        g.fx('quake', { x: c.x, y: c.y, r: 400 }); g.sfx('malph_e', c.x, c.y);
      },
      (g, c, r, t) => {
        const v = V(c, 3); let [tx, ty] = [t.x, t.y];
        if (!g.map.walkable(tx, ty)) [tx, ty] = g.map.nearestWalkable(tx, ty);
        g.dash(c, tx, ty, 1800, { passWalls: true, onEnd: () => {
          for (const e of g.enemiesIn(c.x, c.y, 320, c.team)) { spell(g, c, e, at(v.d, r) + v.ap * c.st.ap, 'magic', { aoe: true }); g.cc(e, 'knockup', 1.5, c); }
          g.fx('quake', { x: c.x, y: c.y, r: 320, big: true }); g.sfx('malph_r', c.x, c.y);
        } });
        g.sfx('malph_charge', c.x, c.y);
      }
    ],
    ai: [{ type: 'targetDmg', range: 625, dmg: true, cc: true }, { type: 'selfAttackBuff' }, { type: 'aoeSelf', r: 400, dmg: true }, { type: 'aoePoint', range: 1000, r: 320, dmg: true, cc: true, ult: true, engage: true }]
  };

  // ================================================================== TEEMO
  KITS.teemo = {
    init(g, c) { c.k.stillT = 0; },
    tick(g, c) {
      if (c.anim.moving || c.windup > 0 || g.has(c, 'recall') || c.dash) { c.k.stillT = 0; if (c.anim.moving || c.dash) g.breakStealth(c); }
      else if ((c.k.stillT += DT) > 1.5 && !g.tagged(c, 'camo')) { g.addStatus(c, { type: 'stealth', tag: 'camo', t: 9999 }); g.fx('poof', { x: c.x, y: c.y, color: '#80a040' }); }
    },
    onUnstealth(g, c) { g.buff(c, 'guerrilla', 3, { asp: 0.4 }); c.k.stillT = 0; },
    afterCast(g, c) { g.breakStealth(c); c.k.stillT = 0; },
    stats(g, c, st) {
      const r = c.ranks[1]; if (!r) return;
      const ms = at(V(c, 1).ms, r);
      if (g.tagged(c, 'moveQuick')) st.ms *= 1 + ms * 2; else if (g.time - (c.k.lastHardDmg || -99) > 5) st.ms *= 1 + ms;
    },
    onHit(g, c, t) {
      const r = c.ranks[2]; if (!r || t.structure) return;
      const v = V(c, 2);
      g.damage(c, t, at(v.d, r) + v.ap * c.st.ap, 'magic', {});
      g.addStatus(t, { type: 'dot', tag: 'toxic' + c.id, t: 4, dps: at(v.dot, r) + 0.1 * c.st.ap, dtype: 'magic', src: c });
    },
    cast: [
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 0);
        g.homing(c, u, { speed: 1500, look: 'dart', onHit: () => { spell(g, c, u, at(v.d, r) + v.ap * c.st.ap); g.cc(u, 'blind', at(v.t, r), c); } });
        g.sfx('teemo_q', c.x, c.y);
      },
      (g, c) => { g.addStatus(c, { type: 'buffFx', tag: 'moveQuick', t: 3 }); g.sfx('teemo_w', c.x, c.y); },
      () => false,
      (g, c, r, t) => {
        const v = V(c, 3), dmg = at(v.d, r) + v.ap * c.st.ap;
        const x = t.x, y = t.y; if (!g.map.walkable(x, y)) return false;
        g.mkUnit('trap', c.team, x, y, { r: 30, ownerRef: c, look: 'shroom', armT: 1, life: 300, trigger: 90, champsOnly: true, stealth: true, vis: [c.team === 0, c.team === 1], onTrigger: () => {
          for (const e of g.enemiesIn(x, y, 320, c.team)) { g.addStatus(e, { type: 'dot', tag: 'shroom', t: 4, dps: dmg / 4, dtype: 'magic', src: c, spell: true }); g.slow(e, 0.4, 4, c, 'shroom'); }
          g.fx('cloud', { x, y, r: 320, color: '#80c040' }); g.sfx('shroom', x, y);
        } });
        g.sfx('teemo_r', x, y);
      }
    ],
    ai: [{ type: 'targetDmg', range: 680, dmg: true, cc: true }, { type: 'selfSpeed' }, { type: 'none' }, { type: 'trapPlace', range: 400 }]
  };

  // ================================================================== RYZE
  KITS.ryze = {
    afterCast(g, c, slot) { for (let i = 0; i < 3; i++) if (i !== slot && c.cds[i] > 0) c.cds[i] = Math.max(0, c.cds[i] - 1); },
    cast: [
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 0);
        g.homing(c, u, { speed: 1400, look: 'orb', color: '#60c0ff', onHit: () => spell(g, c, u, at(v.d, r) + v.ap * c.st.ap + v.mana * c.maxMp) });
        g.sfx('ryze_q', c.x, c.y);
      },
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 1);
        g.cc(u, 'root', at(v.t, r), c); spell(g, c, u, at(v.d, r) + v.ap * c.st.ap + v.mana * c.maxMp);
        g.fx('prison', { unit: u.id, t: at(v.t, r) }); g.sfx('ryze_w', u.x, u.y);
      },
      (g, c, r, t) => {
        const v = V(c, 2), dmg = at(v.d, r) + v.ap * c.st.ap + v.mana * c.mp;
        const bounce = (u, n, prev) => {
          g.homing(c, u, { speed: 1100, look: 'orb', color: '#a060ff', src: prev || c, x: (prev || c).x, y: (prev || c).y - 40, onHit: () => {
            spell(g, c, u, dmg); g.addStatus(u, { type: 'mrShred', tag: 'flux', amt: 15, t: 5 });
            if (n <= 1) return;
            const nxt = g.enemiesIn(u.x, u.y, 450, c.team).filter(e => e !== u && e.vis[c.team]).sort((a, b) => L.dist(a, u) - L.dist(b, u))[0];
            if (nxt) bounce(nxt, n - 1, u);
          } });
        };
        bounce(t.unit, 5, null);
        g.sfx('ryze_e', c.x, c.y);
      },
      (g, c, r) => { const v = V(c, 3); g.buff(c, 'desperate', at(v.t, r), { msFlat: at(v.ms, r), sv: at(v.sv, r) }); g.sfx('ryze_r', c.x, c.y); }
    ],
    ai: [{ type: 'targetDmg', range: 650, dmg: true, farm: true }, { type: 'targetDmg', range: 600, dmg: true, cc: true }, { type: 'targetDmg', range: 675, dmg: true }, { type: 'selfBuffFight' }]
  };

  // ================================================================== ALISTAR
  KITS.alistar = {
    afterCast(g, c) { c.k.trampleT = g.time + 3; },
    tick(g, c) {
      if (c.k.trampleT > g.time && g.tickN % 8 === 0) for (const e of g.enemiesIn(c.x, c.y, 250, c.team)) g.damage(c, e, 6 + c.level + 0.1 * c.st.ap, 'magic', { aoe: true });
    },
    cast: [
      (g, c, r) => {
        const v = V(c, 0);
        for (const e of g.enemiesIn(c.x, c.y, 380, c.team)) { spell(g, c, e, at(v.d, r) + v.ap * c.st.ap, 'magic', { aoe: true }); g.cc(e, 'knockup', 1, c); }
        g.fx('quake', { x: c.x, y: c.y, r: 380 }); g.sfx('ali_q', c.x, c.y);
      },
      (g, c, r, t) => {
        const u = t.unit, v = V(c, 1);
        g.dash(c, u.x, u.y, 1600, { follow: u, stopDist: c.r + u.r * 0.5, onEnd: () => {
          if (u.dead) return;
          spell(g, c, u, at(v.d, r) + v.ap * c.st.ap);
          const [dx, dy] = dirTo(c, u);
          g.cc(u, 'stun', 0.45, c);
          g.dash(u, u.x + dx * 650, u.y + dy * 650, 2000, {});
          g.fx('boom', { x: u.x, y: u.y, r: 100, color: '#ffffff' }); g.sfx('ali_w', u.x, u.y);
        } });
      },
      (g, c, r) => {
        const v = V(c, 2), h = at(v.h, r) + v.ap * c.st.ap;
        g.heal(c, h, c); for (const a of g.alliesIn(c.x, c.y, 575, c.team)) if (a !== c) g.heal(a, h * 0.5, c);
        g.fx('roar', { x: c.x, y: c.y, r: 575 }); g.sfx('ali_e', c.x, c.y);
      },
      (g, c, r) => { g.cleanse(c); g.buff(c, 'unbreakable', 7, { ad: at(V(c, 3).ad, r) }); g.addStatus(c, { type: 'dr', tag: 'unbreakableDr', amt: 0.7, t: 7 }); g.sfx('ali_r', c.x, c.y); }
    ],
    ai: [{ type: 'aoeSelf', r: 380, dmg: true, cc: true }, { type: 'targetDmg', range: 650, dmg: true, cc: true, knockback: true }, { type: 'healAoe' }, { type: 'selfDefense', ult: true }]
  };

  L.KITS = KITS;
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
