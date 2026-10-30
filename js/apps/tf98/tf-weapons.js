(function (T) {
  'use strict';
  const { hu } = T;
  const TAU = Math.PI * 2;
  const HITSCAN_RANGE = 160;
  const MELEE_COS = 0.7;
  const HEAD_ZONE = 0.28;

  const smooth = t => t * t * (3 - 2 * t);
  T.distanceFactor = dHu => 0.5 + smooth(1 - Math.min(dHu, 921.6) / 1024);

  T.rangeFactor = function (def, dHu) {
    if (def.ramp === undefined) return 1;
    const d = T.distanceFactor(dHu);
    return d > 1 ? 1 + def.ramp * (d - 1) : d;
  };

  T.hitDamage = function (def, dHu, boost) {
    if (boost === 'crit') return def.dmg * 3;
    const f = T.rangeFactor(def, dHu);
    return def.dmg * (boost === 'mini' ? Math.max(f, 1) * 1.35 : f);
  };

  T.flameDamage = function (def, frac, ramp, boost) {
    if (boost === 'crit') return def.dmg * 3 * ramp;
    if (boost === 'mini') return def.dmg * 1.35 * ramp;
    return def.dmg * (2 - T.clamp(frac, 0, 1)) * ramp;
  };

  T.rifleDamage = function (def, charge, head, boost) {
    const body = def.dmg + (def.dmgFull - def.dmg) * charge;
    if (head || boost === 'crit') return body * 3;
    return boost === 'mini' ? body * 1.35 : body;
  };

  T.overFor = hp => Math.floor(hp * 1.5 / 5) * 5;

  T.kitMods = function (def) {
    const mods = { hpDelta: 0, resist: {}, turnMul: 1, meleeKillFill: 0, charge: null, watch: false, padThief: false, seesEnemies: false, metal: 0 };
    for (const id of (def.slots || []).concat(def.passive || [])) {
      const w = T.WEAPONS[id];
      mods.hpDelta += w.hpDelta || 0;
      if (w.resist) Object.assign(mods.resist, w.resist);
      if (w.turnMul) mods.turnMul *= w.turnMul;
      if (w.meleeKillFill) mods.meleeKillFill = w.meleeKillFill;
      if (w.charge) mods.charge = w.charge;
      if (w.watch) mods.watch = true;
      if (w.padThief) mods.padThief = true;
      if (w.seesEnemies) mods.seesEnemies = true;
      if (w.metal) mods.metal = Math.max(mods.metal, w.metal);
    }
    return mods;
  };

  T.WEAPONS = {
    sawn: {
      id: 'sawn', name: 'Обрез посыльного', kind: 'pellets', dmg: 6, pellets: 10, spread: 1 / 30, ramp: 1.5, interval: 0.625, clip: 6, reserve: 32, reload: [0.7, 0.5],
      view: [[0.05, 0.05, 0.42, -0.03, 0, 0, 0.3], [0.05, 0.05, 0.42, 0.03, 0, 0, 0.3], [0.1, 0.09, 0.2, 0, -0.03, -0.26, 0.42]]
    },
    pistol: {
      id: 'pistol', name: 'Служебный пистолет', kind: 'bullet', dmg: 15, spread: 1 / 50, settle: 1.25, ramp: 1, interval: 0.15, clip: 12, reserve: 36, reload: [1.005],
      view: [[0.05, 0.08, 0.22, 0, 0, 0, 0.22], [0.05, 0.14, 0.06, 0, -0.08, -0.07, 0.34]]
    },
    pump: {
      id: 'pump', name: 'Велонасос', kind: 'melee', dmg: 35, interval: 0.5, range: hu(72), delay: 0.2,
      view: [[0.05, 0.05, 0.62, 0, 0.02, 0.06, 0.55], [0.16, 0.04, 0.04, 0, 0.02, -0.26, 0.3]]
    },
    tube: {
      id: 'tube', name: 'Трубомёт', kind: 'projectile', flight: 'rocket', dmg: 90, ramp: 0.5, speed: hu(1100), radius: hu(146), interval: 0.8, clip: 4, reserve: 20, reload: [0.92, 0.8],
      self: { air: 0.6, min: 27, airMax: 46, groundMax: 89 },
      view: [[0.11, 0.11, 0.72, 0, 0.02, 0.02, 0.36], [0.15, 0.15, 0.05, 0, 0.02, 0.36, 0.5], [0.05, 0.12, 0.09, 0, -0.08, -0.08, 0.26]]
    },
    shotgun: {
      id: 'shotgun', name: 'Дробовик', kind: 'pellets', dmg: 6, pellets: 10, spread: 1 / 30, ramp: 1, interval: 0.625, clip: 6, reserve: 32, reload: [1.005, 0.51],
      view: [[0.06, 0.06, 0.6, 0, 0, 0.06, 0.28], [0.08, 0.05, 0.22, 0, -0.06, 0.06, 0.42], [0.08, 0.1, 0.18, 0, -0.03, -0.28, 0.42]]
    },
    gaff: {
      id: 'gaff', name: 'Багор', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2,
      view: [[0.05, 0.05, 0.74, 0, 0.02, 0.1, 0.42], [0.04, 0.14, 0.06, 0, 0.08, 0.46, 0.25], [0.04, 0.05, 0.1, 0, 0.13, 0.42, 0.25]]
    },
    torch: {
      id: 'torch', name: 'Резак', kind: 'stream', dmg: 6.5, rate: 0.075, range: hu(350), width: 0.2, widen: 0.1, rampTime: 0.9, ammoRate: 12.5, reserve: 200,
      burnAdd: 0.25, burnMin: 3, burnMax: 10,
      blastCost: 20, blastCd: 0.75, blastRange: hu(256), blastCos: 0.5, blastPush: 10, blastLift: 3.5, blastMine: 9,
      view: [[0.08, 0.08, 0.6, 0, 0.02, 0.08, 0.3], [0.13, 0.13, 0.05, 0, 0.02, 0.38, 0.5], [0.14, 0.14, 0.3, 0.02, -0.1, -0.2, 0.4]]
    },
    hammer: {
      id: 'hammer', name: 'Молоток сварщика', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2,
      view: [[0.05, 0.05, 0.5, 0, 0.02, 0.02, 0.5], [0.08, 0.16, 0.08, 0, 0.05, 0.26, 0.25]]
    },
    lobber: {
      id: 'lobber', name: 'Кегельник', kind: 'projectile', flight: 'grenade', dmg: 100, splash: 60, speed: hu(1216), lift: 0.08, gravity: 0.7, bounce: 0.3, fuse: 2.3, radius: hu(146), interval: 0.6, clip: 4, reserve: 16, reload: [1.24, 0.6],
      self: { air: 0.75, min: 38, airMax: 73, groundMax: 73 },
      view: [[0.15, 0.15, 0.56, 0, 0.02, 0.02, 0.32], [0.17, 0.08, 0.14, 0, -0.1, -0.12, 0.42]]
    },
    plunger: {
      id: 'plunger', name: 'Вантузомёт', kind: 'charge', flight: 'mine', dmg: 120, ramp: 0.4, flatAfter: 5, knock: 0.915, speed: hu(805), chargeMul: 2.3, chargeTime: 4, lift: 0.08, gravity: 0.6, bounce: 0.4, arm: 0.7, maxMines: 8, radius: hu(146), interval: 0.6, clip: 8, reserve: 24, reload: [1.09, 0.67],
      self: { air: 0.75, min: 45, airMax: 90, groundMax: 114 },
      view: [[0.1, 0.1, 0.5, 0, 0.02, 0.02, 0.34], [0.18, 0.18, 0.04, 0, 0.02, 0.28, 0.2], [0.07, 0.12, 0.1, 0, -0.08, -0.1, 0.42]]
    },
    pick: {
      id: 'pick', name: 'Кайло', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2,
      view: [[0.05, 0.05, 0.58, 0, 0.02, 0.04, 0.45], [0.05, 0.05, 0.3, 0, 0.1, 0.3, 0.25]]
    },
    carousel: {
      id: 'carousel', name: 'Карусель', kind: 'spin', dmg: 9, pellets: 4, spread: 1 / 25, spreadStart: 2.5, ramp: 1, interval: 0.105, reserve: 200, spinUp: 0.75, spinDown: 1.15, spunSpeed: hu(110),
      view: [[0.24, 0.24, 0.62, -0.02, -0.02, 0.05, 0.3], [0.05, 0.05, 0.3, -0.02, -0.02, 0.48, 0.5], [0.08, 0.16, 0.14, 0, -0.14, -0.1, 0.42]]
    },
    sandwich: {
      id: 'sandwich', name: 'Сэндвич', kind: 'food', eatTime: 4.25, heal: 300, cooldown: 30, throwSpeed: 7, dropSize: 0.5, dropLife: 30,
      view: [[0.26, 0.05, 0.16, 0, 0, 0.05, 0.75], [0.25, 0.05, 0.15, 0, 0.05, 0.05, 0.45], [0.26, 0.04, 0.16, 0, 0.1, 0.05, 0.75]]
    },
    fists: {
      id: 'fists', name: 'Кулаки', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2, altSwing: true,
      view: [[0.12, 0.12, 0.16, 0, 0, 0.12, 0.55], [0.1, 0.1, 0.3, 0, -0.02, -0.08, 0.45]]
    },
    drench: {
      id: 'drench', name: 'Шприцемёт', kind: 'projectile', flight: 'needle', dmg: 10, ramp: 0.4, speed: hu(990), gravity: 0.3, interval: 0.105, clip: 40, reserve: 150, reload: [1.305],
      view: [[0.07, 0.07, 0.44, 0, 0.02, 0.02, 0.6], [0.02, 0.02, 0.18, 0, 0.02, 0.32, 0.25], [0.06, 0.12, 0.08, 0, -0.08, -0.08, 0.35]]
    },
    hose: {
      id: 'hose', name: 'Шланг живой воды', kind: 'beam', range: hu(450), breakAt: hu(540), aimR: 0.45,
      view: [[0.08, 0.08, 0.34, 0, 0.02, 0.06, 0.32], [0.14, 0.14, 0.04, 0, 0.02, 0.24, 0.5], [0.05, 0.14, 0.1, 0, -0.08, -0.05, 0.3]]
    },
    hacksaw: {
      id: 'hacksaw', name: 'Ножовка', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2,
      view: [[0.02, 0.1, 0.5, 0, 0.02, 0.1, 0.7], [0.05, 0.12, 0.12, 0, -0.02, -0.18, 0.3]]
    },
    rifle: {
      id: 'rifle', name: 'Винтовка с медной трубой', kind: 'scope', dmg: 50, dmgFull: 150, interval: 1.5, reserve: 25, chargeTime: 3, chargeDelay: 0.3, afterShot: 1, headAfter: 0.2, scopedSpeed: hu(80), zoom: 0.35,
      view: [[0.05, 0.06, 0.86, 0, 0, 0.14, 0.3], [0.05, 0.05, 0.24, 0, 0.07, 0.08, 0.6], [0.07, 0.1, 0.22, 0, -0.04, -0.28, 0.42]]
    },
    smg: {
      id: 'smg', name: 'Пистолет-пулемёт', kind: 'bullet', dmg: 8, spread: 1 / 80, settle: 1.25, ramp: 1, interval: 0.105, clip: 25, reserve: 75, reload: [1.1],
      view: [[0.06, 0.08, 0.3, 0, 0, 0.02, 0.24], [0.04, 0.12, 0.05, 0, -0.08, 0.04, 0.3], [0.05, 0.12, 0.06, 0, -0.08, -0.08, 0.35]]
    },
    wrench: {
      id: 'wrench', name: 'Газовый ключ', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2, wrench: true, metal: 200,
      view: [[0.06, 0.06, 0.56, 0, 0.02, 0.06, 0.32], [0.14, 0.05, 0.1, 0, 0.04, 0.34, 0.28], [0.05, 0.08, 0.05, 0.05, 0.08, 0.38, 0.28]]
    },
    build: {
      id: 'build', name: 'Накладная', kind: 'place', metal: 200,
      view: [[0.22, 0.02, 0.3, 0, -0.02, 0.02, 0.85], [0.2, 0.03, 0.04, 0, 0, 0.16, 0.4]]
    },
    scrap: {
      id: 'scrap', name: 'Акт списания', kind: 'place', scrap: true, metal: 200,
      view: [[0.22, 0.02, 0.3, 0, -0.02, 0.02, 0.8], [0.2, 0.03, 0.04, 0, 0, 0.16, 0.55]]
    },
    revolver: {
      id: 'revolver', name: 'Служебный наган', kind: 'bullet', dmg: 40, spread: 1 / 80, settle: 1.25, ramp: 1, interval: 0.5, clip: 6, reserve: 24, reload: [1.133],
      view: [[0.05, 0.07, 0.26, 0, 0, 0.02, 0.3], [0.07, 0.07, 0.1, 0, 0, -0.02, 0.4], [0.05, 0.14, 0.06, 0, -0.09, -0.08, 0.32]]
    },
    seal: {
      id: 'seal', name: 'Пломба', kind: 'place', seal: true, range: hu(72),
      view: [[0.12, 0.12, 0.05, 0, 0.02, 0.1, 0.6], [0.03, 0.03, 0.3, 0, 0, -0.08, 0.35]]
    },
    penknife: {
      id: 'penknife', name: 'Перочинный нож', kind: 'melee', dmg: 40, interval: 0.8, range: hu(72), delay: 0, backstab: true, backstabMul: 6,
      view: [[0.015, 0.05, 0.26, 0, 0.02, 0.1, 0.8], [0.03, 0.05, 0.14, 0, 0, -0.08, 0.3]]
    },
    forms: {
      id: 'forms', name: 'Папка с удостоверениями', kind: 'self', padThief: true, seesEnemies: true,
      view: [[0.26, 0.03, 0.2, 0, -0.02, 0.04, 0.42], [0.22, 0.02, 0.17, 0, 0.01, 0.04, 0.85]]
    },
    watch: { id: 'watch', name: 'Карманные часы', kind: 'passive', watch: true, view: [] },
    spurs: { id: 'spurs', name: 'Сапоги со шпорами', kind: 'passive', hpDelta: 25, turnMul: 3, meleeKillFill: 0.25, view: [] },
    lid: {
      id: 'lid', name: 'Крышка люка', kind: 'passive', resist: { fire: 0.5, blast: 0.7 }, view: [],
      charge: { time: 1.5, speed: hu(750), cool: 12, turn: Math.PI / 4, ram: 50, ramPerNotch: 5, miniAt: 0.25, critAt: 0.6, crateFill: { 0.2: 1 / 8, 0.5: 1 / 5, 1: 1 / 3 } }
    },
    sword: {
      id: 'sword', name: 'Экспонат № 117', kind: 'melee', dmg: 65, interval: 0.8, range: hu(108), delay: 0.2, hpDelta: -25,
      notches: { max: 4, hp: 15, speedPct: 0.08, cap: hu(370), heal: 15 },
      view: [[0.05, 0.1, 0.9, 0, 0.04, 0.2, 0.7], [0.24, 0.04, 0.05, 0, 0, -0.24, 0.3], [0.05, 0.05, 0.2, 0, 0, -0.36, 0.25]]
    },
    pchak: {
      id: 'pchak', name: 'Пчак', kind: 'melee', dmg: 65, interval: 0.8, range: hu(72), delay: 0.2,
      view: [[0.02, 0.06, 0.34, 0, 0.02, 0.1, 0.75], [0.04, 0.05, 0.12, 0, 0.01, -0.12, 0.28]]
    }
  };

  function shootRays(g, h, def, count, spread, boost, mul) {
    const eye = g.eye(h), b = T.aimBasis(h.yaw, h.pitch);
    const tally = new Map();
    for (let i = 0; i < count; i++) {
      let dx = b.f.x, dy = b.f.y, dz = b.f.z;
      if (spread > 0) {
        const a = g.rand() * TAU, r = Math.sqrt(g.rand()) * spread;
        const ox = Math.cos(a) * r, oy = Math.sin(a) * r;
        dx += b.r.x * ox + b.u.x * oy;
        dy += b.r.y * ox + b.u.y * oy;
        dz += b.r.z * ox + b.u.z * oy;
        const l = Math.hypot(dx, dy, dz);
        dx /= l; dy /= l; dz /= l;
      }
      const hit = g.trace(h, eye.x, eye.y, eye.z, dx, dy, dz, HITSCAN_RANGE);
      const t = hit ? hit.t : HITSCAN_RANGE;
      g.events.push({ type: 'tracer', hero: h.id, x: eye.x + dx * t, y: eye.y + dy * t, z: eye.z + dz * t, boost });
      if (hit && hit.mine) g.breakMine(hit.mine);
      if (hit && hit.body) tally.set(hit.body, (tally.get(hit.body) || 0) + 1);
    }
    for (const [target, n] of tally) g.damage(target, T.hitDamage(def, g.distanceHu(h, target), boost) * n * mul, { by: h, def, boost });
  }

  function flameHit(g, h, def) {
    const eye = g.eye(h), d = T.dir(h.yaw, h.pitch);
    const boost = g.boostOf(h);
    for (const t of g.victims) {
      if (t === h || !t.alive || t.team === h.team) continue;
      const flat = Math.hypot(t.pos.x - eye.x, t.pos.z - eye.z);
      const cy = T.clamp(eye.y + d.y * flat, t.pos.y, t.pos.y + t.h);
      const dx = t.pos.x - eye.x, dy = cy - eye.y, dz = t.pos.z - eye.z;
      const along = dx * d.x + dy * d.y + dz * d.z;
      if (along < -t.r || along > def.range + t.r) continue;
      const perp = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - along * along));
      if (perp > def.width + Math.max(along, 0) * def.widen + t.r) continue;
      if (!g.world.clear(eye.x, eye.y, eye.z, t.pos.x, cy, t.pos.z)) continue;
      const mark = h.flameOn.get(t);
      const first = mark && g.t - mark.last <= T.RULES.flameForget ? mark.first : g.t;
      h.flameOn.set(t, { first, last: g.t });
      const ramp = 0.5 + 0.5 * Math.min(1, (g.t - first) / def.rampTime);
      g.damage(t, T.flameDamage(def, along / def.range, ramp, boost), { by: h, def, boost, element: 'fire' });
      g.ignite(t, h, def);
    }
  }

  function releaseMine(g, h, a) {
    const def = a.def;
    const speed = def.speed * (1 + (def.chargeMul - 1) * h.chargeT / def.chargeTime);
    const boost = g.boostOf(h);
    a.clip--;
    a.lastShot = g.t;
    h.fireCd = def.interval;
    h.chargeT = 0;
    g.events.push({ type: 'shot', hero: h.id, weapon: def.id, boost });
    g.addMine(h, def, boost, speed);
  }

  T.KINDS = {
    passive: {},
    bullet: {
      attack(g, h, a, boost) {
        const spread = g.t - a.lastShot >= a.def.settle ? 0 : a.def.spread;
        shootRays(g, h, a.def, 1, spread, boost, 1);
      }
    },
    pellets: {
      attack(g, h, a, boost) { shootRays(g, h, a.def, a.def.pellets, a.def.spread, boost, 1); }
    },
    projectile: {
      attack(g, h, a, boost) { g.launch(h, a.def, boost, a.def.speed); }
    },
    melee: {
      attack(g, h, a, boost) {
        if (a.def.delay) h.swing = { t: a.def.delay, def: a.def, boost };
        else this.resolve(g, h, a.def, boost);
      },
      inRear(h, t) {
        return (h.pos.x - t.pos.x) * Math.sin(t.yaw) + (h.pos.z - t.pos.z) * Math.cos(t.yaw) < 0;
      },
      target(g, h, def) {
        const eye = g.eye(h), d = T.dir(h.yaw, h.pitch);
        let best = null, bestDist = Infinity;
        for (const t of g.victims) {
          if (t === h || !t.alive || t.team === h.team) continue;
          const cy = T.clamp(eye.y + d.y * def.range, t.pos.y, t.pos.y + t.h);
          const dx = t.pos.x - eye.x, dy = cy - eye.y, dz = t.pos.z - eye.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist - t.r > def.range) continue;
          if (dist > t.r && (dx * d.x + dy * d.y + dz * d.z) / dist < MELEE_COS) continue;
          if (!g.world.clear(eye.x, eye.y, eye.z, t.pos.x, cy, t.pos.z)) continue;
          if (dist < bestDist) { bestDist = dist; best = t; }
        }
        return best;
      },
      resolve(g, h, def, boost) {
        const eye = g.eye(h), d = T.dir(h.yaw, h.pitch);
        if (def.wrench) {
          const b = T.Build.aimed(g, h, def.range);
          if (b) {
            g.events.push({ type: 'melee', hero: h.id, weapon: def.id, hit: false, wall: true });
            T.Build.wrench(g, h, b, def);
            return;
          }
        }
        const best = this.target(g, h, def);
        const wall = !best && !!g.world.raycast(eye.x, eye.y, eye.z, d.x, d.y, d.z, def.range);
        g.events.push({ type: 'melee', hero: h.id, weapon: def.id, hit: !!best, wall });
        if (best && def.backstab && !best.isBuilding && this.inRear(h, best)) {
          g.events.push({ type: 'backstab', hero: h.id, dst: best.id });
          g.damage(best, Math.max(best.hp, 1) * def.backstabMul, { by: h, def, boost: 'crit', backstab: true });
        } else if (best) {
          g.damage(best, T.hitDamage(def, 0, boost), { by: h, def, boost });
        } else {
          g.smashMineAt(h, eye, d, def.range);
        }
      },
      alt(g, h, a) { if (a.def.wrench) T.Build.pick(g, h); }
    },
    stream: {
      usesAlt: true,
      update(g, h, a, inp, dt) {
        const def = a.def;
        h.flaming = false;
        if (h.deployT > 0) return;
        if (inp.fire2 && h.fireCd <= 0 && a.reserve >= def.blastCost) {
          a.reserve -= def.blastCost;
          h.fireCd = def.blastCd;
          g.airblast(h, def);
          return;
        }
        if (!inp.fire || h.fireCd > 0 || a.reserve <= 0) return;
        h.flaming = true;
        a.drain += def.ammoRate * dt;
        while (a.drain >= 1 && a.reserve > 0) { a.drain -= 1; a.reserve--; }
        h.streamT -= dt;
        if (h.streamT <= 0) {
          h.streamT = def.rate;
          flameHit(g, h, def);
        }
      },
      leave(g, h) { h.flaming = false; }
    },
    charge: {
      update(g, h, a, inp, dt) {
        const def = a.def;
        if (h.deployT > 0) return;
        if (inp.fire && h.fireCd <= 0 && a.clip > 0) {
          h.reloading = false;
          h.chargeT = Math.min(def.chargeTime, h.chargeT + dt);
          if (h.chargeT >= def.chargeTime) releaseMine(g, h, a);
        } else if (h.chargeT > 0) {
          releaseMine(g, h, a);
        }
      },
      leave(g, h) { h.chargeT = 0; }
    },
    spin: {
      usesAlt: true,
      update(g, h, a, inp, dt) {
        const def = a.def;
        if ((inp.fire || inp.fire2) && h.deployT <= 0) {
          h.spinUp = Math.min(def.spinUp, h.spinUp + dt);
          h.spinDown = def.spinDown;
        } else if (h.spinUp > 0) {
          h.spinDown -= dt;
          if (h.spinDown <= 0) { h.spinUp = 0; h.spunAge = 0; }
        }
        if (h.spinUp > 0) { h.speedCap = def.spunSpeed; h.noJump = true; }
        if (h.spinUp < def.spinUp) return;
        h.spunAge += dt;
        if (!inp.fire || h.fireCd > 0) return;
        if (a.reserve <= 0) {
          h.fireCd = T.RULES.dryDelay;
          g.events.push({ type: 'dry', hero: h.id, weapon: def.id });
          return;
        }
        const k = Math.min(1, h.spunAge);
        const boost = g.boostOf(h);
        a.reserve--;
        h.fireCd = def.interval;
        g.events.push({ type: 'shot', hero: h.id, weapon: def.id, boost });
        shootRays(g, h, def, def.pellets, def.spread * (def.spreadStart + (1 - def.spreadStart) * k), boost, 0.5 + 0.5 * k);
      },
      leave(g, h) { h.spinUp = 0; h.spinDown = 0; h.spunAge = 0; }
    },
    food: {
      usesAlt: true,
      update(g, h, a, inp, dt, alt) {
        const def = a.def;
        if (h.deployT > 0 || a.cooldown > 0) return;
        if (inp.fire && h.onGround && h.level < 2) {
          a.wasted = h.hp >= h.maxHp;
          h.eatT = def.eatTime;
          h.eatArm = a;
          g.events.push({ type: 'eat', hero: h.id });
        } else if (alt) {
          g.throwFood(h, a);
        }
      }
    },
    beam: {
      usesAlt: true,
      update(g, h, a, inp, dt, alt) {
        const def = a.def;
        if (alt && a.charge >= 1 && h.uberT <= 0 && !h.flag) {
          h.uberT = T.RULES.uberTime;
          a.charge = 0;
          g.events.push({ type: 'uber', hero: h.id });
        }
        if (!inp.fire || h.deployT > 0) { h.patient = null; return; }
        if (!h.patient) h.patient = g.findPatient(h, def);
        const t = h.patient;
        if (!t) return;
        if (!t.alive || t.team !== h.team || Math.hypot(t.pos.x - h.pos.x, t.pos.y - h.pos.y, t.pos.z - h.pos.z) > def.breakAt) { h.patient = null; return; }
        const healed = g.heal(t, g.healRate(t) * dt, t.overHp);
        if (h.uberT <= 0) {
          const slow = t.hp >= t.maxHp * T.RULES.uberSlowAt ? 0.5 : 1;
          a.charge = Math.min(1, a.charge + T.RULES.uberBuild * slow * dt);
        } else if (!t.flag) {
          t.uberT = Math.max(t.uberT, T.RULES.patientKeep);
        }
        h.healing = healed > 0;
      },
      leave(g, h) { h.patient = null; }
    },
    scope: {
      usesAlt: true,
      update(g, h, a, inp, dt, alt) {
        const def = a.def;
        if (h.deployT > 0) return;
        if (alt && h.onGround) {
          h.scoped = !h.scoped;
          h.scopeT = 0;
          h.scopeCharge = 0;
          h.scopeDelay = def.chargeDelay;
        }
        if (!h.onGround) h.scoped = false;
        if (h.scoped) {
          h.speedCap = def.scopedSpeed;
          h.scopeT += dt;
          if (h.scopeDelay > 0) h.scopeDelay -= dt;
          else h.scopeCharge = Math.min(1, h.scopeCharge + dt / def.chargeTime);
        }
        if (!inp.fire || h.fireCd > 0 || a.reserve <= 0) return;
        a.reserve--;
        h.fireCd = def.interval;
        const boost = g.boostOf(h);
        g.events.push({ type: 'shot', hero: h.id, weapon: def.id, boost });
        const eye = g.eye(h), d = T.dir(h.yaw, h.pitch);
        const hit = g.trace(h, eye.x, eye.y, eye.z, d.x, d.y, d.z, HITSCAN_RANGE);
        const t = hit ? hit.t : HITSCAN_RANGE;
        g.events.push({ type: 'tracer', hero: h.id, x: eye.x + d.x * t, y: eye.y + d.y * t, z: eye.z + d.z * t, boost });
        if (hit && hit.mine) g.breakMine(hit.mine);
        if (hit && hit.body) {
          const y = eye.y + d.y * t;
          const head = !hit.body.isBuilding && h.scoped && h.scopeT >= def.headAfter && y >= hit.body.pos.y + hit.body.h - HEAD_ZONE;
          const charge = h.scoped ? h.scopeCharge : 0;
          g.damage(hit.body, T.rifleDamage(def, charge, head, boost), { by: h, def, boost: head ? 'crit' : boost, head });
        }
        h.scopeCharge = 0;
        h.scopeDelay = def.afterShot;
      },
      leave(g, h) { h.scoped = false; h.scopeCharge = 0; }
    },
    self: {
      usesAlt: true,
      update(g, h, a, inp, dt, alt) {
        if (h.deployT > 0) return;
        if (alt) h.formTeam = T.enemyOf(h.formTeam);
        if (inp.pick) g.startDisguise(h, T.MERC_ORDER[inp.pick - 1], h.formTeam);
      }
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
