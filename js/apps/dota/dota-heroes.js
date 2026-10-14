(function (D) {
  'use strict';
  const { DT } = D.DATA;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const K = {};
  const enemyTargets = (g, h, x, y, r, o = {}) => g.enemiesIn(h.team, x, y, r, Object.assign({ anyVis: true }, o));
  const lvl = (g, h, s) => Math.max(1, g.rank(h, s));

  function leap(g, u, ex, ey, dur, arc, onEnd) {
    g.interrupt(u, false);
    u.pushFx = { sx: u.x, sy: u.y, ex, ey, t: 0, dur, free: true, arc: arc || 0, onEnd };
    g.projectiles.forEach(p => { if (p.target === u && p.dodge) p.lost = true; });
  }
  function wave(g, h, o, len, width, speed, onHit, extra = {}) {
    const ang = Math.atan2(o.y - h.y, o.x - h.x); const hit = new Set();
    g.projectile(Object.assign({ kind: extra.kind || 'wave', x: h.x, y: h.y, ang, len, speed, width, team: h.team, src: h,
      onStep: (p) => { for (const e of enemyTargets(g, h, p.x, p.y, width / 2 + 30)) if (!hit.has(e)) { hit.add(e); onHit(e, p); } } }, extra));
  }

  K.techies = {
    cast: [
      (g, h, o) => {
        const [x, y] = K.techies.clampPoint(g, h, o, g.abRange(h, 0));
        K.techies.landMine(g, h, x, y);
        g.sfx('mine_plant', x, y);
      },
      (g, h, o) => {
        const [x, y] = K.techies.clampPoint(g, h, o, g.abRange(h, 1));
        K.techies.stasisTrap(g, h, x, y);
        g.sfx('mine_plant', x, y);
      },
      (g, h, o) => {
        const [x, y] = K.techies.clampPoint(g, h, o, g.abRange(h, 2));
        h.x = x; h.y = y;
        K.techies.blast(g, h, x, y, g.av(h, 2, 'dmg'), g.av(h, 2, 'partial'), g.av(h, 2, 'full'), g.av(h, 2, 'radius'), false, 'suicide_squad');
        g.fx('explosion', { x, y, r: g.av(h, 2, 'radius'), big: true }); g.sfx('suicide', x, y);
        g.kill(h, null, { suicide: true, ability: 'suicide_squad' });
      },
      (g, h, o) => {
        const [x, y] = K.techies.clampPoint(g, h, o, g.abRange(h, 3));
        K.techies.remoteMine(g, h, x, y);
        g.sfx('remote_plant', x, y);
      },
      (g, h, o) => {
        const r = g.av(h, 4, 'radius'), mines = K.techies.remotesNear(g, h, o.x, o.y, r);
        mines.forEach((m, i) => g.later(i * 0.04, () => K.techies.detonate(g, h, m)));
        g.fx('ring', { x: o.x, y: o.y, r, color: '#ff4020' }); g.sfx('detonate', o.x, o.y);
      },
      (g, h, o) => {
        for (const u of g.units) if (u.kind === 'sign' && u.owner === h.id && !u.dead) g.kill(u, null);
        const [x, y] = g.map.nearestWalkable(...K.techies.clampPoint(g, h, o, g.abRange(h, 5)), 300);
        const s = g.mkUnit('sign', h.team, x, y, { r: 14, hp: 1, maxHp: 1, owner: h.id, ownerU: h, wardHits: true });
        Object.assign(s.base, { ms: 0, range: 0, vision: [0, 0] }); g.recalc(s); s.hp = 1;
        g.sfx('mine_plant', x, y);
      }
    ],
    clampPoint(g, h, o, range) {
      let x = o.x, y = o.y; const d = Math.hypot(x - h.x, y - h.y);
      if (range && d > range) { x = h.x + (x - h.x) / d * range; y = h.y + (y - h.y) / d * range; }
      return [x, y];
    },
    placeCharge(g, h, type, x, y, extra) {
      const [mx, my] = g.map.nearestWalkable(x, y, 200);
      const m = g.mkUnit('mine', h.team, mx, my, Object.assign({ mineType: type, r: 10, hp: 1, maxHp: 1, owner: h.id, ownerU: h, trig: 0, revealed: false, wardHits: true }, extra));
      Object.assign(m.base, { ms: 0, range: 0, vision: [0, 0] }); g.recalc(m); m.hp = 1;
      return m;
    },
    triggeredBy(g, u, r) {
      return g.unitsIn(u.x, u.y, r, e => e.team !== u.team && !e.dead && !e.structure && !g.isWardLike(e) && !(e.kind === 'courier' && e.flying) && !g.isInvuln(e) && !(e.pushFx && e.pushFx.arc)).length > 0;
    },
    blast(g, h, x, y, full, partial, fullR, radius, buildings, ability) {
      for (const e of g.unitsIn(x, y, radius, u => u.team !== h.team && !u.dead && !g.isWardLike(u) && !(u.kind === 'courier' && u.flying) && (buildings || !u.structure))) {
        const d = Math.hypot(e.x - x, e.y - y) - (e.structure ? e.r : 0);
        g.dmg(h, e, d <= fullR ? full : partial, 'comp', { ability, bld: true });
      }
    },
    landMine(g, h, x, y) {
      const mine = K.techies.placeCharge(g, h, 'land', x, y, { armAt: g.time + g.av(h, 0, 'arm') });
      const own = g.units.filter(u => u.kind === 'mine' && u.mineType === 'land' && u.owner === h.id && !u.dead);
      const max = g.av(h, 0, 'max');
      while (own.length > max) { const old = own.shift(); old.dead = true; old.hp = 0; old.removeAt = g.time; }
      mine.tick = (gg, u) => {
        if (gg.time < u.armAt || !K.techies.triggeredBy(gg, u, gg.av(h, 0, 'full'))) return;
        K.techies.blast(gg, h, u.x, u.y, gg.av(h, 0, 'dmg'), gg.av(h, 0, 'partial'), gg.av(h, 0, 'full'), gg.av(h, 0, 'radius'), true, 'land_mines');
        gg.fx('explosion', { x: u.x, y: u.y, r: gg.av(h, 0, 'radius') }); gg.sfx('mine_boom', u.x, u.y);
        u.hp = 0; u.dead = true; u.removeAt = gg.time + 0.2;
      };
      return mine;
    },
    stasisTrap(g, h, x, y) {
      const trap = K.techies.placeCharge(g, h, 'stasis', x, y, { armAt: g.time + g.av(h, 1, 'arm'), expires: g.time + g.av(h, 1, 'dur') });
      trap.tick = (gg, u) => {
        if (gg.time < u.armAt) return;
        if (!u.trig) {
          if (!K.techies.triggeredBy(gg, u, gg.av(h, 1, 'trigger'))) return;
          u.trig = gg.time + gg.av(h, 1, 'delay'); u.revealed = true;
          gg.sfx('mine_beep', u.x, u.y); gg.fx('mine_trigger', { x: u.x, y: u.y, r: gg.av(h, 1, 'radius'), dur: gg.av(h, 1, 'delay') });
          return;
        }
        if (gg.time < u.trig) return;
        const stun = gg.av(h, 1, 'stun');
        for (const e of gg.unitsIn(u.x, u.y, gg.av(h, 1, 'radius'), v => v.team !== u.team && !v.dead && !v.structure && !gg.isWardLike(v) && v.kind !== 'courier')) gg.stun(e, stun, h);
        gg.fx('nova', { x: u.x, y: u.y, r: gg.av(h, 1, 'radius'), color: 'stasis' }); gg.sfx('stasis', u.x, u.y);
        u.hp = 0; u.dead = true; u.removeAt = gg.time + 0.2;
      };
      return trap;
    },
    remoteMine(g, h, x, y) {
      const m = K.techies.placeCharge(g, h, 'remote', x, y, { expires: g.time + g.av(h, 3, 'dur') });
      const v = g.av(h, 3, 'vision'); m.base.vision = [v, v];
      return m;
    },
    remotesNear(g, h, x, y, r) { return g.units.filter(u => u.kind === 'mine' && u.mineType === 'remote' && u.owner === h.id && !u.dead && Math.hypot(u.x - x, u.y - y) <= r); },
    remoteDamage(g, h) { return g.av(h, 3, 'dmg') + (g.hasScepter(h) ? 150 : 0); },
    detonate(g, h, m) {
      if (m.dead) return;
      const r = g.av(h, 3, 'radius'), dmg = K.techies.remoteDamage(g, h);
      for (const e of g.enemiesIn(h.team, m.x, m.y, r, { anyVis: true })) g.dmg(h, e, dmg, 'mag', { ability: 'remote_mines' });
      g.fx('explosion', { x: m.x, y: m.y, r, big: true }); g.sfx('mine_boom', m.x, m.y);
      m.hp = 0; m.dead = true; m.removeAt = g.time + 0.2;
    }
  };

  K.enigma = {
    cast: [
      (g, h, o) => {
        const t = o.target, hits = g.av(h, 0, 'hits'), iv = g.av(h, 0, 'interval');
        g.addStatus(t, { tag: 'malefice', t: hits * iv, debuff: true, malefice: true });
        for (let i = 0; i < hits; i++) g.later(i * iv + 0.01, () => { if (t.dead || g.isImmune(t)) return; g.stun(t, g.av(h, 0, 'stun'), h); g.dmg(h, t, g.av(h, 0, 'dmg'), 'mag', { ability: 'malefice' }); g.fx('malefice', { x: t.x, y: t.y }); g.sfx('malefice', t.x, t.y); });
      },
      (g, h, o) => {
        const t = o.target; let x = t.x, y = t.y;
        if (t === h) { g.dmg(null, h, h.hp * 0.25, 'pure', { nonLethal: true, hpRemoval: true, quiet: true }); }
        else { t.noBounty = true; g.kill(t, h); }
        const n = g.av(h, 1, 'count');
        for (let i = 0; i < n; i++) K.enigma.eidolon(g, h, x + Math.cos(i * 2.1) * 60, y + Math.sin(i * 2.1) * 60, 0);
        g.fx('eidolon', { x, y }); g.sfx('conversion', x, y);
      },
      (g, h, o) => {
        const r = g.av(h, 2, 'radius'), pct = g.av(h, 2, 'pct');
        for (const t of g.map.treesNear(o.x, o.y, r)) g.destroyTree(t);
        let acc = 0;
        g.areas.push({ kind: 'midnight_pulse', x: o.x, y: o.y, r, team: h.team, until: g.time + g.av(h, 2, 'dur'), tick: (gg, a) => {
          acc += DT; if (acc < 1) return; acc -= 1;
          for (const e of gg.unitsIn(a.x, a.y, a.r, u => u.team !== h.team && !u.structure && !gg.isWardLike(u) && u.kind !== 'courier' && !gg.isInvuln(u))) gg.dmg(h, e, e.maxHp * pct / 100, 'pure', { ability: 'midnight_pulse' });
        } });
        g.sfx('pulse', o.x, o.y);
      },
      (g, h, o) => {
        const x = o.x, y = o.y, r = g.av(h, 3, 'radius'), dps = g.av(h, 3, 'dmg'), dur = g.av(h, 3, 'dur');
        const pulsePct = g.hasScepter(h) && h.ranks[2] ? g.av(h, 2, 'pct') : 0;
        const area = { kind: 'black_hole', x, y, r, team: h.team, until: g.time + dur + 0.1 };
        g.areas.push(area);
        const caught = new Set();
        g.channelStart(h, dur, () => {
          for (const e of g.unitsIn(x, y, r, u => u.team !== h.team && !u.structure && !g.isWardLike(u) && u.kind !== 'courier' && !u.invulnerable && u.kind !== 'roshan')) {
            caught.add(e);
            g.addStatus(e, { tag: 'bh', t: 0.15, bh: true, debuff: true, pierce: true, undispellable: true });
            e.atk = null; if (e.channel) g.stopChannel(e, true);
            const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy);
            if (d > 20) { const sp = 40 * DT, a = Math.atan2(dy, dx) + 0.6; e.x += Math.cos(a) * sp; e.y += Math.sin(a) * sp; }
            g.dmg(h, e, dps * DT, 'pure', { ability: 'black_hole', quiet: true, pierce: true });
            if (pulsePct) g.dmg(h, e, e.maxHp * pulsePct / 100 * DT, 'pure', { ability: 'midnight_pulse', quiet: true });
          }
        }, () => { area.until = g.time; for (const e of caught) g.removeStatus(e, 'bh'); });
        g.sfx('black_hole', x, y); g.emit({ type: 'announce', key: 'blackHole', unit: h.id });
      }
    ],
    eidolon(g, h, x, y, gen) {
      const [ex, ey] = g.map.nearestWalkable(x, y, 200);
      const hp = g.av(h, 1, 'hp'), dmg = g.av(h, 1, 'dmg');
      const e = g.mkUnit('eidolon', h.team, ex, ey, { r: 16, hp, maxHp: hp, owner: h.id, ownerU: h, summon: true, expires: g.time + g.av(h, 1, 'dur'), gold: [12, 18], xp: 18, gen, hits: 0, split: g.av(h, 1, 'split') });
      Object.assign(e.base, { dmg: [dmg, dmg], armor: 0, ms: 420, range: 450, bat: 1.4, ap: 0.4, proj: 900, vision: [1200, 800], turn: 0.8 });
      g.recalc(e); e.hp = e.maxHp;
      e.onHitSplit = (gg, u) => { if (u.gen > 0) return; u.hits++; if (u.hits >= u.split) { u.hits = -99; u.hp = u.maxHp; K.enigma.eidolon(gg, h, u.x + 40, u.y + 40, 1); gg.fx('eidolon', { x: u.x, y: u.y }); } };
      return e;
    }
  };

  K.sven = {
    cast: [
      (g, h, o) => {
        const t = o.target;
        g.projectile({ kind: 'hammer', src: h, target: t, x: h.x, y: h.y, speed: 1000, team: h.team, dodge: true, onHit: (tt) => {
          const r = g.av(h, 0, 'radius');
          for (const e of enemyTargets(g, h, tt.x, tt.y, r, { noImmune: true })) { g.dmg(h, e, g.av(h, 0, 'dmg'), 'mag', { ability: 'storm_hammer' }); g.stun(e, g.av(h, 0, 'stun'), h); }
          g.fx('ring', { x: tt.x, y: tt.y, r, color: '#a0c0ff' }); g.sfx('hammer_hit', tt.x, tt.y);
        } });
        g.sfx('hammer', h.x, h.y);
      },
      null,
      (g, h) => {
        for (const a of g.alliesIn(h.team, h.x, h.y, g.av(h, 2, 'radius'), { heroesOnly: true })) {
          g.addStatus(a, { tag: 'warcry', t: g.av(h, 2, 'dur'), armor: g.av(h, 2, 'armor'), ms: g.av(h, 2, 'ms'), buff: true });
          if (g.hasShard(h)) g.addStatus(a, { tag: 'warcry_shield', t: g.av(h, 2, 'dur'), shield: 300, buff: true });
        }
        g.fx('ring', { x: h.x, y: h.y, r: 300, color: '#ffd060' }); g.sfx('warcry', h.x, h.y);
      },
      (g, h) => { g.addStatus(h, { tag: 'gods_strength', t: g.av(h, 3, 'dur'), dmgPct: g.av(h, 3, 'dmg'), str: g.hasScepter(h) ? 40 : 0, buff: true, glow: '#ff4020' }); g.sfx('gods_strength', h.x, h.y); }
    ]
  };

  K.crystal_maiden = {
    cast: [
      (g, h, o) => {
        const r = g.av(h, 0, 'radius'), sl = g.av(h, 0, 'slow');
        for (const e of enemyTargets(g, h, o.x, o.y, r, { noImmune: true })) {
          g.dmg(h, e, g.av(h, 0, 'dmg'), 'mag', { ability: 'crystal_nova' });
          g.addStatus(e, { tag: 'nova', t: g.av(h, 0, 'dur'), slow: sl, asSlow: sl, debuff: true, chill: true });
          if (g.hasShard(h)) g.addStatus(e, { tag: 'nova_root', t: 1, root: true, debuff: true });
        }
        g.fx('nova', { x: o.x, y: o.y, r }); g.sfx('nova', o.x, o.y);
      },
      (g, h, o) => {
        const t = o.target, dur = g.av(h, 1, 'dur');
        g.addStatus(t, { tag: 'frostbite', t: dur, root: true, disarm: true, dps: g.av(h, 1, 'dmg') / dur, dtype: 'mag', src: h.id, debuff: true, frozenFx: true });
        g.interrupt(t, false); g.sfx('frostbite', t.x, t.y);
      },
      null,
      (g, h) => {
        const r = g.av(h, 3, 'radius'), dmg = g.av(h, 3, 'dmg'); let acc = 0;
        g.addStatus(h, { tag: 'ff_armor', t: g.av(h, 3, 'dur'), armor: g.av(h, 3, 'armor'), buff: true });
        const area = { kind: 'freezing_field', x: h.x, y: h.y, r, team: h.team, until: g.time + g.av(h, 3, 'dur'), follow: h };
        g.areas.push(area);
        g.channelStart(h, g.av(h, 3, 'dur'), () => {
          area.x = h.x; area.y = h.y;
          for (const e of enemyTargets(g, h, h.x, h.y, r)) g.addStatus(e, { tag: 'ff_slow', t: 1, slow: g.av(h, 3, 'slow'), asSlow: 60, debuff: true, chill: true });
          acc += DT;
          while (acc >= 0.1) {
            acc -= 0.1;
            const a = g.rng() * Math.PI * 2, d = 200 + g.rng() * (r - 250), x = h.x + Math.cos(a) * d, y = h.y + Math.sin(a) * d;
            for (const e of enemyTargets(g, h, x, y, 300)) g.dmg(h, e, dmg, 'mag', { ability: 'freezing_field', quiet: true });
            g.fx('ice_blast', { x, y });
          }
        }, () => { area.until = g.time; g.removeStatus(h, 'ff_armor'); }, { move: g.hasScepter(h) });
        g.sfx('freezing_field', h.x, h.y);
      }
    ]
  };

  K.sniper = {
    cast: [
      (g, h, o) => {
        const r = g.av(h, 0, 'radius'), dps = g.av(h, 0, 'dps'), sl = g.av(h, 0, 'slow'), delay = g.av(h, 0, 'delay');
        g.fx('shrapnel_fall', { x: o.x, y: o.y, r, delay });
        g.areas.push({ kind: 'shrapnel', x: o.x, y: o.y, r, team: h.team, start: g.time + delay, until: g.time + delay + g.av(h, 0, 'dur'), vision: 450, tick: (gg, a) => {
          if (gg.time < a.start) return;
          for (const e of gg.enemiesIn(h.team, a.x, a.y, a.r, { anyVis: true, noImmune: true })) { gg.dmg(h, e, dps * DT, 'mag', { ability: 'shrapnel', quiet: true }); gg.addStatus(e, { tag: 'shrapnel', t: 0.5, slow: sl, debuff: true }); }
        } });
        g.sfx('shrapnel', h.x, h.y);
      },
      null, null,
      (g, h, o) => {
        const t = o.target;
        g.projectile({ kind: 'assassinate', src: h, target: t, x: h.x, y: h.y, speed: 2500, team: h.team, dodge: true, onHit: (tt) => {
          if (g.hasScepter(h)) { const d = (h.st.dmgMin + h.st.dmgMax) / 2 + (h.st.dmgBonus || 0); g.dmg(h, tt, d * 2.8, 'phys', { ability: 'assassinate', crit: true }); }
          else g.dmg(h, tt, g.av(h, 3, 'dmg'), 'mag', { ability: 'assassinate' });
          g.stun(tt, 0.1, h); g.sfx('assassinate_hit', tt.x, tt.y);
        } });
        g.sfx('assassinate', h.x, h.y);
      }
    ],
    onCastStart(g, h, slot, o) { if (slot === 3 && o.target) { g.addStatus(o.target, { tag: 'aimed', t: 2.6, reveal: true, crosshair: true, debuff: true }); g.sfx('aim', o.target.x, o.target.y); } },
    onAttack(g, h, t) {
      if (!h.ranks[1] || t.structure) return null;
      const ch = g.av(h, 1, 'chance') / 100;
      if (g.rng() < ch) { g.addStatus(t, { tag: 'headshot', t: 0.25, slow: 100, debuff: true }); g.float(t, 'HEADSHOT', '#ffd040'); return { bonus: g.av(h, 1, 'dmg') }; }
      return null;
    }
  };

  K.axe = {
    cast: [
      (g, h) => {
        const r = g.av(h, 0, 'radius'), dur = g.av(h, 0, 'dur');
        for (const e of g.unitsIn(h.x, h.y, r, u => u.team !== h.team && !u.structure && !g.isWardLike(u) && u.kind !== 'courier' && !g.isInvuln(u) && !g.isImmune(u))) {
          g.addStatus(e, { tag: 'taunt', t: dur, taunt: true, src: h.id, debuff: true });
          e.atk = null; if (e.channel) g.stopChannel(e, true); if (e.kind === 'hero') e.order = { type: 'attack', target: h };
        }
        g.addStatus(h, { tag: 'call_armor', t: dur, armor: g.av(h, 0, 'armor'), as: g.hasShard(h) ? 30 : 0, buff: true });
        g.fx('ring', { x: h.x, y: h.y, r, color: '#ff3020' }); g.sfx('berserkers_call', h.x, h.y);
      },
      (g, h, o) => { g.addStatus(o.target, { tag: 'battle_hunger', t: g.av(h, 1, 'dur'), dps: g.av(h, 1, 'dps'), dtype: 'mag', slow: g.av(h, 1, 'slow'), hunger: true, src: h.id, debuff: true }); g.sfx('battle_hunger', o.target.x, o.target.y); },
      null,
      (g, h, o) => {
        const t = o.target, th = g.av(h, 3, 'threshold') + (g.hasScepter(h) ? 100 : 0);
        g.fx('cull', { x: t.x, y: t.y });
        if (t.hp <= th) {
          g.kill(t, h, { ability: 'culling_blade' }); g.sfx('culling_kill', t.x, t.y);
          if (t.kind === 'hero') { h.cds[3] = 0; for (const a of g.alliesIn(h.team, h.x, h.y, 900, { heroesOnly: true })) g.addStatus(a, { tag: 'cull_speed', t: 6, ms: g.av(h, 3, 'ms'), as: 30, buff: true }); }
        } else { g.dmg(h, t, g.av(h, 3, 'dmg'), 'mag', { ability: 'culling_blade', pierce: true }); g.sfx('culling', t.x, t.y); }
      }
    ],
    onAttacked(g, h, att) {
      if (!h.ranks[2] || h.dead || att.team === h.team || (h.k.helixCd || 0) > g.time || g.isStunned(h) || g.has(h, 'hex')) return;
      h.k.helixP = (h.k.helixP || 0) + 0.06;
      const ch = g.av(h, 2, 'chance') / 100;
      if (g.rng() < Math.min(1, h.k.helixP * ch / 0.2 * 1.05)) {
        h.k.helixP = 0; h.k.helixCd = g.time + 0.3;
        for (const e of g.unitsIn(h.x, h.y, g.av(h, 2, 'radius'), u => u.team !== h.team && !u.structure && !g.isWardLike(u) && u.kind !== 'courier' && !g.isInvuln(u))) g.dmg(h, e, g.av(h, 2, 'dmg'), 'pure', { ability: 'counter_helix' });
        h.anim.spinT = g.time; g.sfx('helix', h.x, h.y); g.fx('helix', { x: h.x, y: h.y });
      }
    }
  };

  K.lina = {
    cast: [
      (g, h, o) => {
        wave(g, h, o, g.av(h, 0, 'len'), g.av(h, 0, 'width'), 1200, (e) => g.dmg(h, e, g.av(h, 0, 'dmg'), 'mag', { ability: 'dragon_slave' }), { kind: 'dragon_slave' });
        if (g.hasShard(h)) { const ang = Math.atan2(o.y - h.y, o.x - h.x); for (let i = 1; i <= 4; i++) { const x = h.x + Math.cos(ang) * i * 250, y = h.y + Math.sin(ang) * i * 250; g.areas.push({ kind: 'fire_trail', x, y, r: 140, team: h.team, until: g.time + 4, tick: (gg, a) => { for (const e of gg.enemiesIn(h.team, a.x, a.y, a.r, { anyVis: true, noImmune: true })) gg.dmg(h, e, 60 * DT, 'mag', { quiet: true }); } }); } }
        g.sfx('dragon_slave', h.x, h.y);
      },
      (g, h, o) => {
        const r = g.av(h, 1, 'radius');
        g.fx('lsa_warn', { x: o.x, y: o.y, r, t: g.av(h, 1, 'delay') });
        g.later(g.av(h, 1, 'delay'), () => {
          for (const e of enemyTargets(g, h, o.x, o.y, r, { noImmune: true })) { g.dmg(h, e, g.av(h, 1, 'dmg'), 'mag', { ability: 'light_strike_array' }); g.stun(e, g.av(h, 1, 'stun'), h); }
          g.fx('lsa', { x: o.x, y: o.y, r }); g.sfx('lsa', o.x, o.y);
        });
      },
      null,
      (g, h, o) => {
        const t = o.target, pure = g.hasScepter(h);
        g.fx('laguna', { x: h.x, y: h.y, x2: t.x, y2: t.y }); g.sfx('laguna', t.x, t.y);
        g.later(g.av(h, 3, 'delay'), () => { if (!t.dead) g.dmg(h, t, g.av(h, 3, 'dmg'), pure ? 'pure' : 'mag', { ability: 'laguna_blade', pierce: pure }); });
      }
    ]
  };

  K.juggernaut = {
    cast: [
      (g, h) => {
        g.dispel(h); const r = g.av(h, 0, 'radius'), dps = g.av(h, 0, 'dps');
        g.addStatus(h, { tag: 'blade_fury', t: g.av(h, 0, 'dur'), immune: true, disarm: true, spin: true, buff: true, mr: 100, tick: (gg, u) => {
          for (const e of gg.unitsIn(u.x, u.y, r, x => x.team !== u.team && !x.structure && !gg.isWardLike(x) && x.kind !== 'courier' && !gg.isInvuln(x))) gg.dmg(u, e, dps * DT, 'mag', { ability: 'blade_fury', quiet: true });
        } });
        g.sfx('blade_fury', h.x, h.y);
      },
      (g, h, o) => {
        const [x, y] = g.map.nearestWalkable(o.x, o.y, 200), pct = g.av(h, 1, 'pct'), r = g.av(h, 1, 'radius');
        const w = g.mkUnit('hward', h.team, x, y, { r: 14, hp: 2, maxHp: 2, owner: h.id, ownerU: h, expires: g.time + g.av(h, 1, 'dur'), wardHits: true });
        Object.assign(w.base, { ms: 0, range: 0, vision: [500, 500] }); g.recalc(w); w.hp = 2;
        w.tick = (gg, u) => {
          if (gg.hasShard(h) && !h.dead && dist(u, h) > 150) { const a = Math.atan2(h.y - u.y, h.x - u.x); u.x += Math.cos(a) * 420 * DT; u.y += Math.sin(a) * 420 * DT; }
          for (const a of gg.alliesIn(u.team, u.x, u.y, r)) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * pct / 100 * DT);
        };
        g.sfx('healing_ward', x, y);
      },
      null,
      (g, h, o) => {
        let n = g.av(h, 3, 'jumps') + (g.hasScepter(h) ? 3 : 0), cur = o.target; const r = g.av(h, 3, 'radius');
        g.addStatus(h, { tag: 'omnislash', t: n * 0.35 + 0.4, invuln: true, busy: true, buff: true, omni: true });
        const slash = () => {
          if (h.dead) return;
          if (!cur || cur.dead || g.isInvuln(cur)) { const cands = g.enemiesIn(h.team, h.x, h.y, r, { anyVis: false }); cur = cands[Math.floor(g.rng() * cands.length)]; }
          if (!cur || n <= 0) { g.removeStatus(h, 'omnislash'); return; }
          const a = g.rng() * Math.PI * 2; const [x, y] = g.map.nearestWalkable(cur.x + Math.cos(a) * 60, cur.y + Math.sin(a) * 60, 150);
          g.fx('omni_trail', { x: h.x, y: h.y, x2: x, y2: y }); g.teleport(h, x, y); h.face = Math.atan2(cur.y - y, cur.x - x);
          g.attackLands(h, cur, { trueStrike: true }); h.anim.atkT = g.time; g.sfx('omnislash', x, y);
          n--; cur = null;
          if (n > 0) g.later(0.35, slash); else g.later(0.2, () => g.removeStatus(h, 'omnislash'));
        };
        slash();
      }
    ],
    onAttack(g, h, t) {
      if (!h.ranks[2]) return null;
      if (g.rng() < g.av(h, 2, 'chance') / 100) return { crit: g.av(h, 2, 'crit') };
      return null;
    }
  };

  K.pudge = {
    cast: [
      (g, h, o) => {
        const len = g.av(h, 0, 'len'), width = g.av(h, 0, 'width'), ang = Math.atan2(o.y - h.y, o.x - h.x);
        const p = { kind: 'hook', x: h.x, y: h.y, ang, len, speed: 1450, width, team: h.team, src: h, chain: true,
          onStep: (pp) => {
            const hit = g.unitsIn(pp.x, pp.y, width / 2 + 24, u => u !== h && !u.structure && !g.isWardLike(u) && u.kind !== 'courier' && !u.dead && !g.isInvuln(u) && u.kind !== 'roshan' && (u.team === h.team ? u.kind === 'hero' : true))[0];
            if (!hit) return;
            pp.dead = true;
            if (hit.team !== h.team) g.dmg(h, hit, g.av(h, 0, 'dmg'), 'pure', { ability: 'meat_hook' });
            const d = dist(hit, h), a = Math.atan2(h.y - hit.y, h.x - hit.x), stop = Math.max(0, d - 80);
            g.addStatus(hit, { tag: 'hooked', t: stop / 1450 + 0.1, stun: hit.team !== h.team, debuff: hit.team !== h.team, pierce: true });
            leap(g, hit, hit.x + Math.cos(a) * stop, hit.y + Math.sin(a) * stop, stop / 1450, 0);
            g.fx('hook_back', { x: hit.x, y: hit.y, x2: h.x, y2: h.y, unit: hit.id, src: h.id, dur: stop / 1450 });
            g.sfx('hook_hit', hit.x, hit.y);
          },
          onEnd: (pp) => { g.fx('hook_back', { x: pp.x, y: pp.y, x2: h.x, y2: h.y, src: h.id, dur: pp.travel / 1450 }); }
        };
        g.projectile(p); g.sfx('hook', h.x, h.y);
      },
      (g, h) => {
        if (g.has(h, 'rot')) { g.removeStatus(h, 'rot'); g.sfx('rot_off', h.x, h.y); return; }
        const r = g.av(h, 1, 'radius');
        g.addStatus(h, { tag: 'rot', t: 1e9, rot: true, buff: true, tick: (gg, u) => {
          const dps = gg.av(u, 1, 'dps');
          for (const e of gg.enemiesIn(u.team, u.x, u.y, r, { anyVis: true, noImmune: true })) { gg.dmg(u, e, dps * DT, 'mag', { ability: 'rot', quiet: true }); gg.addStatus(e, { tag: 'rot_slow', t: 0.3, slow: gg.av(u, 1, 'slow'), debuff: true }); }
          gg.dmg(u, u, dps * DT, 'mag', { nonLethal: true, quiet: true });
        } });
        g.sfx('rot', h.x, h.y);
      },
      null,
      (g, h, o) => {
        const t = o.target, dur = g.av(h, 3, 'dur') + (g.hasScepter(h) ? 2 : 0);
        g.addStatus(t, { tag: 'dismember', t: dur + 0.1, stun: true, debuff: true, src: h.id });
        g.channelStart(h, dur, () => {
          if (t.dead || dist(t, h) > 400) { g.stopChannel(h, true); return; }
          const d = (g.av(h, 3, 'dps') + h.str * g.av(h, 3, 'strPct') / 100) * DT;
          const dealt = g.dmg(h, t, d, 'mag', { ability: 'dismember', quiet: true }); h.hp = Math.min(h.maxHp, h.hp + dealt);
        }, () => g.removeStatus(t, 'dismember'));
        g.sfx('dismember', t.x, t.y);
      }
    ],
    stats(g, h, acc) { if (h.ranks[2]) acc.mr += g.av(h, 2, 'mr'); }
  };

  K.lion = {
    cast: [
      (g, h, o) => {
        wave(g, h, o, g.av(h, 0, 'len'), g.av(h, 0, 'width'), 1600, (e) => {
          if (g.isImmune(e)) return;
          g.dmg(h, e, g.av(h, 0, 'dmg'), 'mag', { ability: 'earth_spike' }); g.stun(e, g.av(h, 0, 'stun'), h); e.knockT = g.time;
        }, { kind: 'earth_spike' });
        g.sfx('earth_spike', h.x, h.y);
      },
      (g, h, o) => {
        const dur = g.av(h, 1, 'dur');
        if (g.hasShard(h)) { for (const e of enemyTargets(g, h, o.target.x, o.target.y, 300, { noImmune: true, heroesOnly: false })) g.hex(e, dur, h); }
        else g.hex(o.target, dur, h);
      },
      (g, h, o) => {
        const t = o.target;
        if (t.illusion) { g.kill(t, h); return; }
        g.channelStart(h, g.av(h, 2, 'dur'), () => {
          if (t.dead || dist(t, h) > 1150 || !g.canSee(h.team, t)) { g.stopChannel(h, true); return; }
          const d = Math.min(t.mp, g.av(h, 2, 'drain') * DT); t.mp -= d; h.mp = Math.min(h.maxMp, h.mp + d);
          g.addStatus(t, { tag: 'drain_slow', t: 0.2, slow: g.av(h, 2, 'slow'), debuff: true });
        }, null, { beam: t.id });
        g.sfx('mana_drain', t.x, t.y);
      },
      (g, h, o) => {
        const t = o.target, dmg = g.av(h, 3, 'dmg') + h.fingerKills * g.av(h, 3, 'perKill');
        const targets = g.hasScepter(h) ? enemyTargets(g, h, t.x, t.y, 300, { heroesOnly: false }) : [t];
        for (const e of targets) g.fx('finger', { x: h.x, y: h.y, x2: e.x, y2: e.y });
        g.sfx('finger', t.x, t.y);
        g.later(g.av(h, 3, 'delay'), () => { for (const e of targets) if (!e.dead) g.dmg(h, e, dmg, 'mag', { ability: 'finger_of_death' }); });
      }
    ]
  };

  D.KITS = Object.assign(D.KITS || {}, K);
  D.leap = leap;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
