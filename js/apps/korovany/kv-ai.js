(function (K) {
  'use strict';
  const { clamp, lerp, wrapA, angTo } = K;
  const D = K.DATA, IT = D.ITEMS;

  const GARRISON = {
    town: [
      { kind: 'militia', n: 2, post: ['town_square', 'militia_post'] },
      { kind: 'militia', n: 2, route: 'town' },
      { kind: 'townsman', n: 6, wander: 'town' },
      { kind: 'townswoman', n: 5, wander: 'town' },
      { kind: 'merchant', n: 3, post: ['stall1', 'stall2', 'stall3'] },
      { kind: 'healer', n: 1, post: ['shop_healer'] }, { kind: 'prosthetist', n: 1, post: ['shop_pros'] }, { kind: 'smith', n: 1, post: ['shop_smith'] },
      { kind: 'trader', n: 1, post: ['shop_store'] }, { kind: 'innkeeper', n: 1, post: ['shop_inn'] }, { kind: 'headman', n: 1, post: ['shop_headman'] },
      { kind: 'veteran_beggar', n: 1, post: ['town_square'], off: [2.5, 1.5] },
      { kind: 'cow', n: 6, graze: 'cowpen' }
    ],
    farm: [{ kind: 'townsman', n: 2, wander: 'farm', r: 18 }, { kind: 'cow', n: 4, graze: 'farm' }],
    palace: [
      { kind: 'guard', n: 2, post: ['gate_post', 'gate_post2'], noPlayerPost: true },
      { kind: 'guard', n: 2, post: ['gate_in', 'keep_door'] },
      { kind: 'spearman', n: 3, route: 'yard' },
      { kind: 'guard', n: 2, route: 'wall', wall: true },
      { kind: 'xbowman', n: 3, wallPost: true },
      { kind: 'guard', n: 4, post: ['throne_guard0', 'throne_guard1', 'throne_guard2', 'throne_guard3'] },
      { kind: 'commander', n: 1, post: ['commander'] }, { kind: 'emperor', n: 1, post: ['throne'] },
      { kind: 'palace_medic', n: 1, post: ['medic_emp'] }, { kind: 'quartermaster', n: 1, post: ['shop_quarter'] }
    ],
    ford: [{ kind: 'guard', n: 1, post: ['ford_post'] }, { kind: 'xbowman', n: 1, post: ['ford_post'], off: [3, 1] }],
    village: [
      { kind: 'warden', n: 6, route: 'village' },
      { kind: 'archer', n: 2, post: ['elder_platform', 'archery'] },
      { kind: 'archer', n: 2, wander: 'village', r: 30 },
      { kind: 'elder', n: 1, post: ['elder'] }, { kind: 'herbalist', n: 1, post: ['shop_herbs'] }, { kind: 'bowyer', n: 1, post: ['shop_bowyer'] }, { kind: 'carver', n: 1, post: ['shop_carver'] }
    ],
    camp: [{ kind: 'partisan', n: 3, wander: 'camp', r: 10 }],
    tower: [{ kind: 'archer', n: 1, post: ['tower'] }],
    fort: [
      { kind: 'blackguard', n: 3, route: 'fort' },
      { kind: 'blackguard', n: 2, post: ['fort_gate_in', 'keep_fort_door'] },
      { kind: 'veteran', n: 5, wander: 'fort_yard', r: 18 },
      { kind: 'evilxbow', n: 3, route: 'fortWall', wall: true },
      { kind: 'villain', n: 1, post: ['villain'], notIf: 'evil' },
      { kind: 'evilsmith', n: 1, post: ['shop_forge'] }, { kind: 'recruiter', n: 1, post: ['shop_recruit'] }, { kind: 'evilmedic', n: 1, post: ['shop_horsedoc'] }
    ]
  };

  function spotOf(g, id) { return g.world.spots[id]; }

  function populate(g) {
    const W = g.world;
    g.garrison = [];
    for (const place in GARRISON) {
      for (const def of GARRISON[place]) {
        if (def.notIf && def.notIf === g.pf) continue;
        for (let i = 0; i < def.n; i++) {
          const slot = { place, def, i, id: place + ':' + GARRISON[place].indexOf(def) + ':' + i, actor: null, wait: 0 };
          g.garrison.push(slot);
          spawnSlot(g, slot);
        }
      }
    }
    if (g.pf === 'evil') {
      const s = W.spots.fort_yard;
      for (let i = 0; i < 2; i++) { const r = g.spawn('blackguard', s.x - 4 + i * 3, s.z + 3, { role: 'soldier', home: 'fort', tags: ['army'] }); r.ai.order = 'follow'; r.ai.follow = g.player.id; }
    }
    for (let i = 0; i < 2; i++) spawnWolves(g, i === 0 ? [-430, -320] : [470, -40], 3);
    g.director = { supply: g.time + 50, smuggle: g.time + 14 * 60, merchant: g.time + 200, raid: g.time + 26 * 60, spy: g.time + 10 * 60, partisan: g.time + 20 * 60, wolves: g.time + 18 * 60, garrisonT: 0 };
  }

  function spawnSlot(g, slot) {
    const W = g.world, def = slot.def, i = slot.i;
    let x, z, y = null, ai = {};
    const P = W.places[slot.place] || W.places.fort;
    if (def.post) {
      const sp = spotOf(g, def.post[i % def.post.length]);
      x = sp.x + (def.off ? def.off[0] : 0); z = sp.z + (def.off ? def.off[1] : 0); y = sp.y;
      ai = { mode: 'post', post: { x, z, y, yaw: sp.yaw } };
    } else if (def.route) {
      const r = W.routes[def.route];
      const k = (i * 2) % r.length;
      x = r[k][0]; z = r[k][1];
      if (def.wall) y = W.routes[def.route + 'Y'] || null;
      ai = { mode: 'route', route: def.route, ri: k };
    } else if (def.wallPost) {
      const r = W.routes.wall, k = (i * 2 + 1) % r.length;
      x = r[k][0]; z = r[k][1]; y = W.routes.wallY;
      ai = { mode: 'post', post: { x, z, y, yaw: angTo(x, z, P.x, P.z + 400) } };
    } else if (def.wander) {
      const sp = spotOf(g, def.wander) || W.places[def.wander];
      const base = sp ? sp : P;
      const ang = g.R() * 6.28, rr = g.R() * (def.r || 8);
      x = base.x + Math.cos(ang) * rr; z = base.z + Math.sin(ang) * rr;
      ai = def.wander === 'town' ? { mode: 'route', route: 'town', ri: Math.floor(g.R() * W.routes.town.length), wanderer: true } : { mode: 'wander', center: { x: base.x, z: base.z }, r: def.r || 10 };
    } else if (def.graze) {
      const sp = spotOf(g, def.graze);
      x = sp.x + (g.R() - 0.5) * 12; z = sp.z + (g.R() - 0.5) * 12;
      ai = { mode: 'graze', center: { x: sp.x, z: sp.z }, r: 9 };
    }
    if (W.blockedAt(x, z) && y == null) { const p = freeNear(W, x, z); x = p[0]; z = p[1]; }
    const a = g.spawn(def.kind, x, z, { home: slot.place, ai, y: y != null ? y : undefined });
    if (ai.post) a.yaw = ai.post.yaw || 0;
    a.garrison = slot.id; slot.actor = a.id;
    return a;
  }

  function freeNear(W, x, z) {
    for (let r = 1; r < 12; r++) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, px = x + Math.cos(a) * r * 1.5, pz = z + Math.sin(a) * r * 1.5; if (!W.blockedAt(px, pz)) return [px, pz]; }
    return [x, z];
  }

  function spawnWolves(g, at, n) {
    const ids = [];
    for (let i = 0; i < n; i++) {
      const w = g.spawn('wolf', at[0] + (g.R() - 0.5) * 8, at[1] + (g.R() - 0.5) * 8, { ai: { mode: 'pack', center: { x: at[0], z: at[1] }, r: 60 } });
      ids.push(w.id);
    }
    return ids;
  }

  function moveTo(g, a, x, z, speed, stopAt) {
    const W = g.world;
    const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
    if (d < (stopAt || 0.6)) { a.want = { x: 0, z: 0 }; a.ai.path = null; return true; }
    let tx = x, tz = z;
    const ai = a.ai;
    const onWall = a.y > W.height(a.x, a.z) + 2;
    if (!onWall && d > 3 && !W.lineClear(a.x, a.z, x, z)) {
      if (!ai.path || ai.pathT <= 0 || Math.hypot(ai.pathGoal[0] - x, ai.pathGoal[1] - z) > 3 || ai.pathEpoch !== W.navEpoch) {
        const r = W.findPath(a.x, a.z, x, z, d > 120 ? 6000 : 2500);
        ai.path = r ? r.pts : null; ai.pathI = 1; ai.pathT = 2.5 + g.R(); ai.pathGoal = [x, z]; ai.pathEpoch = W.navEpoch;
      }
      if (ai.path && ai.pathI < ai.path.length) {
        let p = ai.path[ai.pathI];
        if (Math.hypot(p[0] - a.x, p[1] - a.z) < 1.4 && ai.pathI < ai.path.length - 1) { ai.pathI++; p = ai.path[ai.pathI]; }
        tx = p[0]; tz = p[1];
      }
    } else ai.path = null;
    if (a.stuck) { ai.stuckT = (ai.stuckT || 0) + 0.2; if (ai.stuckT > 1.2) { ai.path = null; ai.pathT = 0; ai.side = (g.R() - 0.5) * 2; ai.stuckT = 0; } } else ai.stuckT = 0;
    const ex = tx - a.x, ez = tz - a.z, el = Math.hypot(ex, ez) || 1;
    let vx = ex / el, vz = ez / el;
    if (ai.side) { vx += -vz * ai.side * 0.8; vz += vx * ai.side * 0.8; const l = Math.hypot(vx, vz) || 1; vx /= l; vz /= l; ai.side *= 0.9; if (Math.abs(ai.side) < 0.05) ai.side = 0; }
    const m = g.mobility(a);
    const sp = speed === 'walk' ? m.walk : speed === 'sprint' ? m.sprint : m.run;
    const slow = stopAt && d < stopAt + 0.8 ? Math.max(0.35, (d - stopAt) / 0.8) : 1;
    a.want = { x: vx * sp * slow, z: vz * sp * slow };
    return false;
  }

  function visibleRange(g, a) {
    const night = g.isNight() ? 0.55 : 1;
    let r = (a.quad ? 30 : 42) * night;
    if (!g.sees(a, 'L') || !g.sees(a, 'R')) r *= 0.75;
    if (g.blind(a)) r = 4;
    return r;
  }

  function perceive(g, a) {
    const W = g.world, p = g.player;
    const range = visibleRange(g, a);
    let best = null, bd = Infinity;
    const list = g.near(a.x, a.z, range, g._perc || (g._perc = []));
    const fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
    for (const b of list) {
      if (b === a || b.dead) continue;
      if (b.player) { stealthCheck(g, a, b, range); if (!g.hostile(a, b)) continue; }
      else if (!g.hostile(a, b)) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      let eff = d;
      if (!b.player && d > 4) {
        const dot = (dx * fx + dz * fz) / (d || 1);
        if (dot < -0.2 && !a.hostile.has(b.id) && a.ai.state !== 'fight') continue;
        if (d > 8 && !W.sightClear(a.x, a.y + 1.6, a.z, b.x, b.y + 1.4, b.z)) continue;
        const dens = W.treeDensity(b.x, b.z);
        if (d > range * (1 - Math.min(0.55, dens * 0.25))) continue;
      }
      if (b.tags.has('decoy')) eff *= 0.6;
      if (b.player) eff *= 0.85;
      if (eff < bd) { bd = eff; best = b; }
    }
    return best;
  }

  function stealthCheck(g, a, p, range) {
    if (a.quad && a.kind === 'cow') return;
    const aw = a.aware.get(p.id) || { s: 0, known: false };
    if (aw.known) { aw.lost = (aw.lost || 0); a.aware.set(p.id, aw); return; }
    const enemyFac = D.RELATIONS[a.fac] && D.RELATIONS[a.fac][g.pf] < 0 && a.fac !== g.pf;
    if (!enemyFac || a.fac === 'wild') { if (a.fac === 'wild') { aw.known = true; a.aware.set(p.id, aw); } return; }
    const W = g.world, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
    const fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw), dot = (dx * fx + dz * fz) / (d || 1);
    let r = range * (p.crouch ? 0.5 : 1) * (1 - p.skills.stealth / 260);
    const fast = Math.hypot(p.vx, p.vz) > 5.5;
    if (fast) r *= 1.25;
    const dens = W.treeDensity(p.x, p.z);
    r *= 1 - Math.min(0.6, dens * 0.3);
    if (p.equip.torso === 'elfleather' && W.zoneAt(p.x, p.z) === 'elf') r *= 0.8;
    const disg = p.equip.head === 'hood' && !p.drawn && !p.atk && !fast && !p.torch;
    const restricted = inside(g, p.x, p.z, 'palace') || inside(g, p.x, p.z, 'fort');
    if (disg) r = Math.min(r, restricted ? 9 : 4.5);
    if (d > r) { aw.s = Math.max(0, aw.s - 0.15); a.aware.set(p.id, aw); return; }
    if (d > 3 && dot < 0.35) { aw.s = Math.max(0, aw.s - 0.05); a.aware.set(p.id, aw); return; }
    if (d > 6 && !W.sightClear(a.x, a.y + 1.6, a.z, p.x, p.y + 1.2, p.z)) return;
    const rate = (1 - d / (r + 0.01)) * 1.0 + 0.25;
    aw.s = Math.min(1.2, aw.s + rate * (disg ? 0.45 : 1) * 0.3);
    if (aw.s >= 1) {
      aw.known = true;
      g.emit('spotted', { id: a.id });
      for (const b of g.near(a.x, a.z, 25, [])) if (b.fac === a.fac && !b.dead && !b.player) { const bw = b.aware.get(p.id) || {}; bw.known = true; bw.s = 1; b.aware.set(p.id, bw); }
      if (a.dist2p < 40 * 40) g.emit('sfx', { s: 'alarm', x: a.x, z: a.z, fac: a.fac });
    }
    a.aware.set(p.id, aw);
  }

  function inside(g, x, z, place) {
    const P = g.world.places[place];
    if (place === 'palace') return Math.abs(x - P.x) < 56 && Math.abs(z - P.z) < 46;
    if (place === 'fort') return Math.abs(x - P.x) < 36 && Math.abs(z - P.z) < 30;
    return Math.hypot(x - P.x, z - P.z) < P.r;
  }

  function fight(g, a, t, dt) {
    const ai = a.ai, d = Math.hypot(t.x - a.x, t.z - a.z);
    a.faceT = t;
    a.drawn = true;
    const w = g.weaponOf(a);
    const ranged = a.equip.ranged && a.ammoMax && g.has(a, 'arrows');
    const mob = g.mobility(a);
    if (a.role === 'archer' || (ranged && d > 7 && (a.kind === 'warden' || a.kind === 'partisan'))) {
      if (d > 6 && ranged) {
        a.slot = 'ranged';
        aimAt(g, a, t);
        if (d > 45) moveTo(g, a, t.x, t.z, 'run', 30);
        else a.want = { x: 0, z: 0 };
        const w2 = g.weaponOf(a);
        if (w2 && (w2.kind === 'bow' || w2.kind === 'xbow')) {
          if (w2.kind === 'bow') { ai.drawT = (ai.drawT || 0) + dt; a.wantAttack = ai.drawT < 1.0 + g.R() * 0.4; if (!a.wantAttack) ai.drawT = -0.4 - g.R() * 0.8; }
          else a.wantAttack = true;
        }
        return;
      }
      a.slot = 'melee';
    } else a.slot = 'melee';
    const reach = w ? Math.max(0.9, w.reach || 1.4) : 1;
    a.wantAttack = false;
    if (d > reach * 0.85) {
      const fleeing = Math.hypot(t.vx, t.vz) > 2 && ((t.x - a.x) * t.vx + (t.z - a.z) * t.vz) > 0;
      moveTo(g, a, t.x, t.z, fleeing && d > 2 ? 'sprint' : 'run', reach * 0.75);
      a.wantBlock = false;
      if (d < reach + 1.2 && g.R() < 0.02) a.wantAttack = true;
    } else {
      ai.circle = ai.circle || (g.R() < 0.5 ? 1 : -1);
      const rx = Math.cos(a.yaw), rz = Math.sin(a.yaw);
      const back = d < reach * 0.5 ? -1.2 : 0;
      const fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
      a.want = { x: rx * ai.circle * 0.9 + fx * back, z: rz * ai.circle * 0.9 + fz * back };
      if (g.R() < 0.01) ai.circle *= -1;
      ai.atkT = (ai.atkT || 0) - dt;
      const threat = t.atk && t.atk.t < 0.45;
      const sk = (a.skills.block || 20) / 100;
      if (threat && !a.atk && g.R() < 0.35 + sk * 0.5 && !ai.noBlock) { ai.blockT = 0.35 + g.R() * 0.4; ai.noBlock = true; }
      if (!t.atk) ai.noBlock = false;
      if (ai.blockT > 0) { ai.blockT -= dt; a.wantBlock = true; }
      else {
        a.wantBlock = false;
        if (ai.atkT <= 0 && !a.atk && a.cd <= 0) {
          const r = g.R();
          a.aim = t.blocking ? (r < 0.6 ? -0.9 : 0.85) : r < 0.5 ? 0 : r < 0.75 ? 0.8 : -0.85;
          if (t.quad) a.aim = -0.2;
          a.wantAttack = true;
          ai.atkT = 0.5 + g.R() * (1.3 - (a.skills.melee || 30) / 120);
        }
      }
    }
  }

  function aimAt(g, a, t) {
    const sp = a.equip.ranged === 'xbow' ? 72 : 60;
    const tx = t.x + t.vx * 0.3, tz = t.z + t.vz * 0.3, ty = t.y + (t.quad ? 0.8 : 1.3);
    const dx = tx - a.x, dz = tz - a.z, dist = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, -dz);
    const tt = dist / sp, drop = 0.5 * 9.8 * tt * tt;
    const pitch = Math.atan2(ty - (a.y + 1.45) + drop, dist);
    a.aimAt = { yaw, pitch }; a.pitch = pitch;
  }

  function think(g, a, dt) {
    const ai = a.ai;
    ai.t = (ai.t || 0) - dt;
    a.wantAttack = false;
    if (a.action && a.action.lock) { a.want = { x: 0, z: 0 }; return; }
    if (a.wagonSeat) { a.want = { x: 0, z: 0 }; return; }
    if (a.arrested) { a.want = { x: 0, z: 0 }; a.crouch = true; a.drawn = false; return; }
    if (a.harness) { a.want = { x: 0, z: 0 }; return; }
    if (ai.t <= 0 || !ai.target) {
      ai.t = 0.25 + g.R() * 0.15;
      if (!a.quad || a.kind === 'wolf') {
        const t = perceive(g, a);
        ai.target = t ? t.id : null;
      } else if (a.kind === 'cow' && a.hostile.size) ai.flee = 6;
    }
    let t = ai.target ? g.byId.get(ai.target) : null;
    if (t && (t.dead || !g.hostile(a, t))) { t = null; ai.target = null; }
    if (a.bleed > 0 && !t) { if (g.has(a, 'bandage') && !a.action) { g.useBandage(a); return; } }
    if (a.bleed > 0 && t && g.has(a, 'bandage') && Math.hypot(t.x - a.x, t.z - a.z) > 10 && !a.action) { g.useBandage(a); return; }
    if (a.hp < a.maxHp * 0.3 && g.has(a, 'potion') && !a.action) g.usePotion(a);
    const civ = a.role === 'civ' || a.role === 'merchant' || a.role === 'service' || a.role === 'driver' || a.kind === 'cow' || a.role === 'medic' && !t;
    const crippled = g.mobility(a).mode === 'crawl';
    if (t && (civ || (crippled && a.role !== 'boss') || (a.hp < a.maxHp * 0.18 && a.role !== 'boss' && !a.tags.has('army')))) {
      if (a.role === 'service' && Math.hypot(t.x - a.x, t.z - a.z) < 2 && a.hostile.has(t.id)) { fight(g, a, t, dt); return; }
      const dx = a.x - t.x, dz = a.z - t.z, dl = Math.hypot(dx, dz) || 1;
      a.faceT = null;
      moveTo(g, a, a.x + dx / dl * 10, a.z + dz / dl * 10, 'run', 0.5);
      if (!ai.screamed && !a.quad && dl < 15) { ai.screamed = true; g.emit('sfx', { s: a.female ? 'scream_f' : 'help', x: a.x, z: a.z }); }
      return;
    }
    if (a.kind === 'cow' && ai.flee > 0) { ai.flee -= dt; const ang = (a.id * 1.7) % 6.28; moveTo(g, a, a.x + Math.cos(ang) * 8, a.z + Math.sin(ang) * 8, 'run', 0.5); return; }
    if (t) { ai.state = 'fight'; fight(g, a, t, dt); return; }
    a.faceT = null; a.wantBlock = false;
    if (ai.state === 'fight') { ai.state = 'idle'; ai.calm = 4; a.drawn = a.role === 'soldier' || a.role === 'archer' ? a.drawn : false; }
    if (ai.calm > 0) { ai.calm -= dt; if (ai.calm <= 0 && !a.tags.has('army')) a.drawn = false; }
    if (a.role === 'medic' && medic(g, a, dt)) return;
    if (a.tags.has('army') && !a.player) { armyThink(g, a, dt); return; }
    if (ai.squad) { const sq = g.squads.find(s => s.id === ai.squad); if (sq) { squadMember(g, a, sq, dt); return; } }
    if (ai.wagon) { const w = g.wagons.find(x => x.id === ai.wagon); if (w && !w.gone) { escort(g, a, w, dt); return; } ai.wagon = null; }
    if (ai.goTo) { if (moveTo(g, a, ai.goTo.x, ai.goTo.z, ai.goTo.speed || 'walk', 1.5)) { const cb = ai.goTo; ai.goTo = null; if (cb.then) ai.mode = cb.then; } return; }
    if (ai.follow) { const l = g.byId.get(ai.follow); if (l && !l.dead) { const d = Math.hypot(l.x - a.x, l.z - a.z); if (d > 4) moveTo(g, a, l.x, l.z, d > 10 ? 'run' : 'walk', 3); else a.want = { x: 0, z: 0 }; return; } ai.follow = null; }
    if (a.disguised && ai.spyTarget) { spyThink(g, a, dt); return; }
    idle(g, a, dt);
  }

  function idle(g, a, dt) {
    const ai = a.ai, W = g.world;
    if (ai.mode === 'post' && ai.post) {
      const p = ai.post;
      if (Math.hypot(p.x - a.x, p.z - a.z) > 0.8) moveTo(g, a, p.x, p.z, 'walk', 0.6);
      else { a.want = { x: 0, z: 0 }; a.yaw += clamp(wrapA((p.yaw || 0) - a.yaw), -2 * dt, 2 * dt); }
      return;
    }
    if (ai.mode === 'route' && ai.route) {
      const r = W.routes[ai.route]; if (!r) { ai.mode = null; return; }
      const p = r[ai.ri % r.length];
      if (ai.pause > 0) { ai.pause -= dt; a.want = { x: 0, z: 0 }; return; }
      if (moveTo(g, a, p[0], p[1], 'walk', 1.2)) { ai.ri = (ai.ri + 1) % r.length; ai.pause = ai.wanderer ? 2 + g.R() * 6 : 0.5 + g.R() * 2; }
      return;
    }
    if (ai.mode === 'wander' || ai.mode === 'graze' || ai.mode === 'pack') {
      if (!ai.dest || ai.pause <= -20) { const ang = g.R() * 6.28, rr = g.R() * ai.r; ai.dest = [ai.center.x + Math.cos(ang) * rr, ai.center.z + Math.sin(ang) * rr]; ai.pause = 0; }
      if (ai.pause > 0) { ai.pause -= dt; a.want = { x: 0, z: 0 }; if (a.kind === 'cow') a.anim.graze = Math.min(1, (a.anim.graze || 0) + dt); return; }
      if (a.kind === 'cow') a.anim.graze = Math.max(0, (a.anim.graze || 0) - dt * 2);
      ai.pause -= dt;
      if (moveTo(g, a, ai.dest[0], ai.dest[1], 'walk', 1)) { ai.dest = null; ai.pause = a.kind === 'cow' ? 6 + g.R() * 14 : 2 + g.R() * 8; }
      return;
    }
    a.want = { x: 0, z: 0 };
  }

  function medic(g, a, dt) {
    if (!g.has(a, 'bandage')) g.give(a, 'bandage', 3, true);
    const ai = a.ai;
    if (!ai.patient || ai.t <= 0.05) {
      let best = null, bd = 35;
      for (const b of g.near(a.x, a.z, 35, [])) {
        if (b.dead || b === a || b.quad) continue;
        if (g.memberOf(b) !== a.fac || g.hostile(a, b)) continue;
        if (!(b.bleed > 0 && b.stumps.some(s => !s.bandaged))) continue;
        const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < bd) { bd = d; best = b; }
      }
      ai.patient = best ? best.id : null;
    }
    const pt = ai.patient ? g.byId.get(ai.patient) : null;
    if (!pt || pt.dead || !(pt.bleed > 0)) { ai.patient = null; return false; }
    a.drawn = false;
    if (!moveTo(g, a, pt.x, pt.z, 'run', 1.4)) return true;
    a.faceT = pt;
    if (!a.action) {
      if (pt.player && !ai.told) { ai.told = true; g.msg(a.name + ' (' + a.title.toLowerCase() + '): «Держись, сейчас перевяжу!»', '#c8e0a0'); }
      a.action = { kind: 'bandage', t: 0, dur: 3, lock: true, done: () => {
        if (pt.dead) return;
        const st = pt.stumps.find(s => !s.bandaged); if (!st) return;
        st.bandaged = true;
        pt.bleed = pt.stumps.every(s => s.bandaged) ? 0 : Math.max(0, pt.bleed - 1.2);
        pt.hp = Math.max(pt.hp, 15);
        g.emit('sfx', { s: 'cloth', x: pt.x, z: pt.z });
        if (pt.player) { g.msg(a.name + ' перевязал вам рану.', '#c8e0a0'); g.emit('medic', { id: a.id }); }
      } };
    }
    return true;
  }

  function spyThink(g, a, dt) {
    const ai = a.ai;
    const T = g.world.places[ai.spyTarget] || g.world.places.town;
    if (!ai.dest || Math.hypot(ai.dest[0] - a.x, ai.dest[1] - a.z) < 1.5) {
      ai.pause = 3 + g.R() * 8;
      const ang = g.R() * 6.28, rr = g.R() * (ai.spyTarget === 'palace' ? 30 : 40);
      ai.dest = [T.x + Math.cos(ang) * rr, T.z + Math.sin(ang) * rr];
    }
    if (ai.pause > 0) { ai.pause -= dt; a.want = { x: 0, z: 0 }; return; }
    moveTo(g, a, ai.dest[0], ai.dest[1], 'walk', 1.2);
    if (ai.spyTarget === 'palace' && !a.revealed) {
      for (const b of g.near(a.x, a.z, 4, [])) if (b.fac === 'emp' && !b.dead && b.role === 'soldier' && g.R() < 0.004) { reveal(g, a, b); break; }
    }
  }

  function reveal(g, spy, by) {
    if (spy.revealed) return;
    spy.revealed = true; spy.disguised = false;
    spy.title = 'Эльф-шпион';
    if (spy.equip.head === 'hood') spy.equip.head = null;
    spy.drawn = true;
    if (by) spy.hostile.add(by.id);
    g.emit('reveal', { id: spy.id, by: by ? by.id : null });
    for (const b of g.near(spy.x, spy.z, 25, [])) if (!b.dead && !b.player && g.hostile(b, spy)) b.ai.target = spy.id;
  }

  function escort(g, a, w, dt) {
    const k = w.guards.indexOf(a.id);
    const side = k % 2 ? 1 : -1, back = Math.floor(k / 2) * 2.4 - 1.0;
    const fx = Math.sin(w.yaw), fz = -Math.cos(w.yaw), rx = Math.cos(w.yaw), rz = Math.sin(w.yaw);
    const tx = w.x + rx * side * 2.2 - fx * back, tz = w.z + rz * side * 2.2 - fz * back;
    a.drawn = w.alarm > 0;
    const d = Math.hypot(tx - a.x, tz - a.z);
    if (d > 0.8) moveTo(g, a, tx, tz, d > 4 ? 'run' : 'walk', 0.6); else a.want = { x: 0, z: 0 };
  }

  function armyThink(g, a, dt) {
    const ai = a.ai, p = g.player;
    const o = ai.order || 'follow';
    a.drawn = true;
    if (o === 'follow') {
      const k = ai.slotK != null ? ai.slotK : (ai.slotK = g.army().indexOf(a));
      const ang = p.yaw + Math.PI + (k % 2 ? 1 : -1) * (0.5 + Math.floor(k / 2) * 0.35), rr = 3 + Math.floor(k / 2) * 1.4;
      const tx = p.x + Math.sin(ang) * rr, tz = p.z - Math.cos(ang) * rr;
      const d = Math.hypot(tx - a.x, tz - a.z);
      if (d > 1.2) moveTo(g, a, tx, tz, d > 6 ? 'run' : 'walk', 0.8); else a.want = { x: 0, z: 0 };
      return;
    }
    if (o === 'hold') { const h = ai.holdAt; if (h && Math.hypot(h.x - a.x, h.z - a.z) > 1.2) moveTo(g, a, h.x, h.z, 'run', 1); else a.want = { x: 0, z: 0 }; return; }
    if (o === 'attack') {
      const t = g.byId.get(ai.orderTarget);
      if (t && !t.dead) { a.hostile.add(t.id); ai.target = t.id; fight(g, a, t, dt); return; }
      ai.order = 'hunt';
    }
    if (o === 'hunt') {
      const near = g.near(a.x, a.z, 70, []).filter(b => g.hostile(a, b) && !b.dead);
      if (near.length) { near.sort((x, y) => Math.hypot(x.x - a.x, x.z - a.z) - Math.hypot(y.x - a.x, y.z - a.z)); const t = near[0]; ai.target = t.id; a.hostile.add(t.id); fight(g, a, t, dt); return; }
      const d = Math.hypot(p.x - a.x, p.z - a.z); if (d > 12) moveTo(g, a, p.x, p.z, 'run', 8); else a.want = { x: 0, z: 0 };
      return;
    }
    if (o === 'palace') { assault(g, a, 'palace', dt); return; }
  }

  function assault(g, a, place, dt) {
    const W = g.world, ai = a.ai;
    const gateId = place === 'palace' ? 'palace_gate' : 'fort_gate';
    const gate = W.gates[gateId];
    const out = place === 'palace' ? W.spots.gate_out : W.spots.fort_gate_out;
    const inside = place === 'palace' ? W.spots.palace_yard : W.spots.fort_yard;
    const final = place === 'palace' ? W.spots.throne : W.spots.villain;
    if (!ai.route || ai.routeFor !== place) {
      const from = W.nearestNode(a.x, a.z), to = place === 'palace' ? 'palace' : 'fort';
      ai.route = W.roadRoute(from, to) || [[out.x, out.z]]; ai.ri = 0; ai.routeFor = place;
    }
    const near = g.near(a.x, a.z, 30, []).filter(b => g.hostile(a, b) && !b.dead);
    if (near.length) { near.sort((x, y) => Math.hypot(x.x - a.x, x.z - a.z) - Math.hypot(y.x - a.x, y.z - a.z)); const t = near[0]; ai.target = t.id; fight(g, a, t, dt); return; }
    if (ai.ri < ai.route.length) {
      const p = ai.route[ai.ri];
      if (moveTo(g, a, p[0], p[1], 'run', 4)) ai.ri++;
      if (Math.hypot(out.x - a.x, out.z - a.z) < 25) ai.ri = ai.route.length;
      return;
    }
    if (gate.closed && gate.hp > 0) {
      const gx = out.x, gz = out.z;
      const gp = place === 'palace' ? [W.spots.gate_in.x, W.spots.gate_in.z] : [W.spots.fort_gate_in.x, W.spots.fort_gate_in.z];
      const mx = lerp(gx, gp[0], 0.55), mz = lerp(gz, gp[1], 0.55);
      if (!moveTo(g, a, mx + ((a.id % 5) - 2) * 1.0, mz + ((a.id % 3) - 1) * 0.6, 'run', 1.2)) return;
      a.faceT = { x: gp[0], z: gp[1] };
      a.slot = 'melee';
      if (!a.atk && a.cd <= 0 && g.R() < 0.4) { a.aim = 0; a.wantAttack = true; }
      return;
    }
    const tgt = ai.inside ? final : inside;
    if (moveTo(g, a, tgt.x + ((a.id % 5) - 2), tgt.z + ((a.id % 3) - 1), 'run', 2)) ai.inside = true;
  }

  function squadMember(g, a, sq, dt) {
    const ai = a.ai;
    if (sq.kind === 'assault') { assault(g, a, sq.target, dt); return; }
    const leader = g.byId.get(sq.leader);
    a.drawn = sq.state !== 'muster';
    if (sq.state === 'attack') {
      const T = g.world.places[sq.target];
      if (a.torch !== undefined && sq.burn && g.has(a, 'torch')) {
        const W = g.world;
        if (!ai.burnT) {
          let best = null, bd = 60;
          for (const id in W.burn) { const b = W.burn[id]; if (b.state !== 'ok' || !id.startsWith(sq.burnPrefix || 'elf_')) continue; const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < bd) { bd = d; best = b; } }
          if (best) ai.burnT = best.id;
        }
        const b = ai.burnT ? W.burn[ai.burnT] : null;
        if (b && b.state === 'ok') {
          a.torch = true;
          if (moveTo(g, a, b.x + 3, b.z + 3, 'run', 2.5)) { g.ignite(b.id, a); g.take(a, 'torch'); a.torch = false; ai.burnT = null; }
          return;
        }
        ai.burnT = null;
      }
      if (!ai.dest || Math.hypot(ai.dest[0] - a.x, ai.dest[1] - a.z) < 2) { const ang = g.R() * 6.28, rr = g.R() * T.r * 0.7; ai.dest = [T.x + Math.cos(ang) * rr, T.z + Math.sin(ang) * rr]; }
      moveTo(g, a, ai.dest[0], ai.dest[1], 'run', 1.5);
      return;
    }
    if (a.id === sq.leader || !leader || leader.dead) {
      const pts = sq.state === 'return' ? sq.back : sq.route;
      if (!pts) return;
      if (sq.idx >= pts.length) { a.want = { x: 0, z: 0 }; return; }
      const p = pts[sq.idx];
      const slow = sq.members.some(id => { const m = g.byId.get(id); return m && !m.dead && Math.hypot(m.x - a.x, m.z - a.z) > 14; });
      if (moveTo(g, a, p[0], p[1], slow ? 'walk' : sq.state === 'muster' ? 'walk' : 'run', 3)) sq.idx++;
      return;
    }
    const k = sq.members.indexOf(a.id);
    const ang = leader.yaw + Math.PI + (k % 2 ? 1 : -1) * (0.35 + Math.floor(k / 2) * 0.25), rr = 2.5 + Math.floor(k / 2) * 1.6;
    const tx = leader.x + Math.sin(ang) * rr, tz = leader.z - Math.cos(ang) * rr;
    const d = Math.hypot(tx - a.x, tz - a.z);
    if (d > 1) moveTo(g, a, tx, tz, d > 5 ? 'run' : 'walk', 0.8); else a.want = { x: 0, z: 0 };
  }

  const SQUAD_KINDS = {
    emp: ['guard', 'guard', 'spearman', 'xbowman', 'guard', 'spearman', 'guard', 'spearman'],
    evil: ['blackguard', 'veteran', 'blackguard', 'evilxbow', 'veteran', 'blackguard', 'veteran', 'recruit'],
    elf: ['partisan', 'partisan', 'archer', 'warden', 'partisan', 'archer']
  };
  const HOME = { emp: 'palace', evil: 'fort', elf: 'camp' };
  const HOME_NODE = { emp: 'palace', evil: 'fort', elf: 'camp' };

  function launchSquad(g, fac, target, n, opts = {}) {
    const W = g.world;
    const kind = opts.kind || 'raid';
    const fromNode = opts.from || HOME_NODE[fac];
    const toNode = opts.toNode || target;
    let route = W.roadRoute(fromNode, toNode);
    if (!route) return null;
    if (opts.extra) route = route.concat(opts.extra);
    const start = opts.startAt || route[0];
    const id = 'sq' + (g.nextId++);
    let idx0 = 0;
    if (opts.startAt) { let bd = Infinity; route.forEach((p, i) => { const d = Math.hypot(p[0] - start[0], p[1] - start[1]); if (d < bd) { bd = d; idx0 = i; } }); }
    const sq = { id, fac, kind, target, route, back: route.slice().reverse(), idx: idx0, state: 'march', members: [], leader: null, t: 0, burn: !!opts.burn, burnPrefix: opts.burnPrefix || 'elf_', tag: opts.tag || null, life: opts.life || 240 };
    const kinds = SQUAD_KINDS[fac];
    for (let i = 0; i < n; i++) {
      const k = opts.kinds ? opts.kinds[i % opts.kinds.length] : kinds[i % kinds.length];
      const p = freeNear(W, start[0] + (g.R() - 0.5) * 6, start[1] + (g.R() - 0.5) * 6);
      const a = g.spawn(k, p[0], p[1], { home: HOME[fac], tags: opts.tag ? [opts.tag, 'raider'] : ['raider'] });
      a.ai.squad = id; a.drawn = true;
      if (sq.burn) g.give(a, 'torch', 1, true);
      sq.members.push(a.id);
      if (!sq.leader) sq.leader = a.id;
    }
    g.pools[fac] = Math.max(0, (g.pools[fac] || 0) - n * 2);
    g.squads.push(sq);
    g.emit('squad', { id, fac, target, kind, n, tag: opts.tag || null });
    return sq;
  }

  function updateSquads(g, dt) {
    for (const sq of g.squads) {
      if (sq.done) continue;
      sq.t += dt;
      const alive = sq.members.map(id => g.byId.get(id)).filter(a => a && !a.dead);
      if (!alive.length) { sq.done = true; g.emit('squadDead', { id: sq.id, fac: sq.fac, target: sq.target, tag: sq.tag }); continue; }
      if (!g.byId.get(sq.leader) || g.byId.get(sq.leader).dead) sq.leader = alive[0].id;
      const L = g.byId.get(sq.leader), T = g.world.places[sq.target];
      if (sq.kind === 'assault') { if (sq.t > sq.life * 3) sq.done = true; continue; }
      if (sq.state === 'march' && T && Math.hypot(L.x - T.x, L.z - T.z) < T.r + 15) { sq.state = 'attack'; sq.attackT = 0; g.emit('raidArrive', { id: sq.id, fac: sq.fac, target: sq.target, tag: sq.tag }); }
      if (sq.state === 'attack') {
        sq.attackT += dt;
        const lost = alive.length < Math.max(1, sq.members.length * 0.35);
        if (lost || sq.attackT > sq.life) { sq.state = 'return'; sq.idx = 0; g.emit('raidEnd', { id: sq.id, fac: sq.fac, target: sq.target, tag: sq.tag, beaten: lost }); }
      }
      if (sq.state === 'return' && (sq.idx >= sq.back.length || sq.t > sq.life * 4)) {
        for (const a of alive) if (a.dist2p > 90 * 90 || sq.idx >= sq.back.length) { g.remove(a); g.pools[sq.fac] = Math.min(100, g.pools[sq.fac] + 2); }
        if (sq.members.every(id => !g.byId.get(id) || g.byId.get(id).dead)) sq.done = true;
      }
    }
    g.squads = g.squads.filter(s => !s.done || s.keep);
  }

  const CARGO = {
    supply: { fac: 'emp', from: 'town', to: 'palace', items: [['grain', 3], ['wine', 2], ['cloth', 1]], gold: [90, 200], guards: ['guard', 'spearman', 'guard'], wagons: 2, name: 'Казённый корован' },
    smuggle: { fac: 'evil', from: 'town', to: 'fort', items: [['nails', 2], ['ingot', 2], ['salt', 1]], gold: [40, 110], guards: ['veteran', 'recruit'], wagons: 1, name: 'Корован контрабандистов' },
    merchant: { fac: 'folk', from: 'palace', to: 'town', items: [['cloth', 2], ['salt', 2], ['wine', 1], ['ring', 1]], gold: [30, 80], guards: ['caravan_guard', 'caravan_guard'], wagons: 2, name: 'Купеческий корован' }
  };

  function launchCaravan(g, kind, opts = {}) {
    const C = CARGO[kind], W = g.world;
    const route = W.roadRoute(C.from, C.to);
    if (!route) return null;
    const id = 'cv' + (g.nextId++);
    const group = [];
    const n = opts.wagons || C.wagons;
    const guardsIds = [];
    for (let i = 0; i < n; i++) {
      const start = route[Math.min(route.length - 1, 0)];
      const w = { id: id + '_' + i, group: id, kind, fac: C.fac, name: C.name, route, idx: 1, x: start[0], z: start[1] - 0, y: 0, yaw: 0, speed: 2.1, cows: [], driver: null, guards: guardsIds, robbed: false, alarm: 0, gone: false, lag: i * 9, wait: i * 4.5, t: 0, tag: opts.tag || null };
      w.cargo = { name: 'Груз корована', items: C.items.map(([a, b]) => [a, b + Math.floor(g.R() * 2)]), gold: i === 0 ? Math.floor(C.gold[0] + g.R() * (C.gold[1] - C.gold[0])) : 0, wagon: w, fac: C.fac };
      w.y = W.height(w.x, w.z);
      const nc = 2;
      for (let k = 0; k < nc; k++) { const c = g.spawn('cow', w.x, w.z, { ai: { mode: 'harness' } }); c.harness = w.id; c.fac = 'folk'; w.cows.push(c.id); }
      const dr = g.spawn('driver', w.x, w.z, { role: 'driver' }); dr.wagonSeat = w.id; w.driver = dr.id; dr.fac = C.fac === 'emp' ? 'folk' : C.fac === 'evil' ? 'evil' : 'folk';
      if (C.fac === 'evil') dr.kind = 'driver';
      g.wagons.push(w); group.push(w);
    }
    const ng = opts.guards != null ? opts.guards : C.guards.length;
    for (let i = 0; i < ng; i++) {
      const k = C.guards[i % C.guards.length];
      const s = route[0];
      const a = g.spawn(k, s[0] + (g.R() - 0.5) * 4, s[1] + (g.R() - 0.5) * 4, { tags: ['caravan'] });
      a.ai.wagon = group[0].id;
      guardsIds.push(a.id);
    }
    for (const w of group) w.guards = guardsIds;
    g.emit('caravan', { id, kind, fac: C.fac, from: C.from, to: C.to, tag: opts.tag || null });
    return group;
  }

  function wagon(g, w, dt) {
    if (w.gone) return;
    const W = g.world;
    w.t += dt;
    const drv = g.byId.get(w.driver);
    const cows = w.cows.map(id => g.byId.get(id)).filter(c => c && !c.dead);
    const enemies = g.near(w.x, w.z, 22, []).filter(b => !b.dead && !b.quad && (w.guards.some(id => { const gd = g.byId.get(id); return gd && !gd.dead && g.hostile(gd, b); }) || b.hostile.has(w.driver) || (b.player && w.robbed)));
    if (enemies.length) { w.alarm = 6; for (const id of w.guards) { const gd = g.byId.get(id); if (gd && !gd.dead && !gd.ai.target) gd.ai.target = enemies[0].id; } }
    else w.alarm = Math.max(0, w.alarm - dt);
    if (w.wait > 0) w.wait -= dt;
    let moving = drv && !drv.dead && cows.length > 0 && w.alarm <= 0 && !w.robbed && w.wait <= 0;
    if (drv && !drv.dead && drv.hostile.size && w.alarm > 0) { drv.wagonSeat = null; drv.role = 'driver'; }
    if (moving && w.idx < w.route.length) {
      const p = w.route[w.idx];
      const dx = p[0] - w.x, dz = p[1] - w.z, d = Math.hypot(dx, dz);
      const want = Math.atan2(dx, -dz);
      w.yaw += clamp(wrapA(want - w.yaw), -1.2 * dt, 1.2 * dt);
      const sp = w.speed * (cows.length === 1 ? 0.6 : 1);
      w.x += Math.sin(w.yaw) * sp * dt; w.z -= Math.cos(w.yaw) * sp * dt;
      if (d < 3) w.idx++;
      w.moving = true;
    } else w.moving = false;
    w.y = W.height(w.x, w.z);
    const n = W.normal(w.x, w.z);
    w.pitch = -(n[0] * Math.sin(w.yaw) - n[2] * Math.cos(w.yaw)) * 0.9;
    const fx = Math.sin(w.yaw), fz = -Math.cos(w.yaw), rx = Math.cos(w.yaw), rz = Math.sin(w.yaw);
    cows.forEach((c, k) => {
      if (c.harness !== w.id) return;
      if (c.hostile.size) { c.harness = null; c.ai = { mode: 'wander', center: { x: c.x, z: c.z }, r: 12, flee: 5 }; return; }
      const side = k % 2 ? 0.55 : -0.55;
      c.x = w.x + fx * 3.6 + rx * side; c.z = w.z + fz * 3.6 + rz * side;
      c.y = W.height(c.x, c.z); c.yaw = w.yaw; c.vx = 0; c.vz = 0;
      c.anim.speed = w.moving ? 0.9 : 0; c.anim.phase += (w.moving ? 2.1 : 0) * dt * 3.4;
    });
    if (drv && !drv.dead && drv.wagonSeat === w.id) {
      drv.x = w.x + fx * 1.6; drv.z = w.z + fz * 1.6; drv.y = w.y + 0.55; drv.yaw = w.yaw; drv.vx = drv.vz = 0; drv.vy = 0;
      drv.chairSeat = true;
    } else if (drv) drv.chairSeat = false;
    if (w.idx >= w.route.length && !w.arrived) {
      w.arrived = true; w.arriveT = w.t;
      g.emit('caravanArrive', { id: w.group, kind: w.kind, fac: w.fac, tag: w.tag, robbed: w.robbed });
    }
    if (w.arrived && w.t - w.arriveT > 40) {
      const pd = Math.hypot(g.player.x - w.x, g.player.z - w.z);
      if (pd > 70) {
        w.gone = true;
        for (const id of [...w.cows, w.driver]) { const a = g.byId.get(id); if (a && !a.dead) g.remove(a); }
        if (g.wagons.filter(x => x.group === w.group && !x.gone).length === 0) for (const id of w.guards) { const a = g.byId.get(id); if (a && !a.dead) g.remove(a); }
      }
    }
  }

  function wagonSkip(g, w, mins) {
    if (w.gone || w.robbed || !w.moving && w.alarm > 0) return;
    let dist = mins * 60 * w.speed * 0.8;
    while (dist > 0 && w.idx < w.route.length) {
      const p = w.route[w.idx], d = Math.hypot(p[0] - w.x, p[1] - w.z);
      if (d <= dist) { w.x = p[0]; w.z = p[1]; dist -= d; w.idx++; } else { const k = dist / d; w.x += (p[0] - w.x) * k; w.z += (p[1] - w.z) * k; dist = 0; }
    }
    if (w.idx < w.route.length) { const p = w.route[w.idx]; w.yaw = Math.atan2(p[0] - w.x, -(p[1] - w.z)); }
    for (const id of w.guards) { const a = g.byId.get(id); if (a && !a.dead) { a.x = w.x + (g.R() - 0.5) * 4; a.z = w.z + (g.R() - 0.5) * 4; a.y = g.world.height(a.x, a.z); } }
  }

  function director(g, dt) {
    const d = g.director; if (!d) return;
    updateSquads(g, dt);
    const T = g.time;
    const busy = g.quest && g.quest.calm > T;
    if (T > d.supply) { d.supply = T + 8 * 60 + g.R() * 120; if (g.wagons.filter(w => w.kind === 'supply' && !w.gone).length < 3) launchCaravan(g, 'supply'); }
    if (T > d.merchant) { d.merchant = T + 11 * 60 + g.R() * 200; if (g.wagons.filter(w => w.kind === 'merchant' && !w.gone).length < 3) launchCaravan(g, 'merchant'); }
    if (T > d.smuggle) { d.smuggle = T + 20 * 60 + g.R() * 240; if (g.wagons.filter(w => w.kind === 'smuggle' && !w.gone).length < 2) launchCaravan(g, 'smuggle'); }
    if (T > d.raid && !busy) {
      d.raid = T + 28 * 60 + g.R() * 14 * 60;
      const opts = [];
      if (g.pools.emp > 25) opts.push(['emp', 'village', 5, { burn: true }]);
      if (g.pools.evil > 25) opts.push(['evil', 'village', 5, { burn: true }]);
      if (g.pools.evil > 35) opts.push(['evil', 'palace', 5, { kind: 'raid' }]);
      if (g.pools.emp > 35) opts.push(['emp', 'fort', 5, { kind: 'raid' }]);
      if (opts.length) { const o = opts[Math.floor(g.R() * opts.length)]; launchSquad(g, o[0], o[1], o[2], o[3]); }
    }
    if (T > d.partisan && !busy) {
      d.partisan = T + 22 * 60 + g.R() * 10 * 60;
      if (g.pools.elf > 20) launchSquad(g, 'elf', g.R() < 0.6 ? 'fort' : 'palace', 3, { kinds: ['partisan', 'partisan', 'archer'], life: 150 });
    }
    if (T > d.spy) {
      d.spy = T + 16 * 60 + g.R() * 8 * 60;
      const live = g.actors.filter(a => a.kind === 'spy' && !a.dead).length;
      if (live < 2) spawnSpy(g, g.R() < 0.5 ? 'town' : 'palace');
    }
    if (T > d.wolves) {
      d.wolves = T + 30 * 60;
      const wolves = g.actors.filter(a => a.kind === 'wolf' && !a.dead).length;
      if (wolves < 6) spawnWolves(g, g.R() < 0.5 ? [-430 + g.R() * 60, -300 + g.R() * 200] : [470, -60 + g.R() * 120], 3);
    }
    d.garrisonT = (d.garrisonT || 0) + dt;
    if (d.garrisonT > 20) { d.garrisonT = 0; refill(g); }
  }

  function refill(g) {
    if (!g.garrison) return;
    const p = g.player;
    for (const slot of g.garrison) {
      const a = slot.actor ? g.byId.get(slot.actor) : null;
      if (a && !a.dead) continue;
      const fac = D.KINDS[slot.def.kind].fac;
      if (D.KINDS[slot.def.kind].role === 'boss') continue;
      if (fac !== 'folk' && (g.pools[fac] || 0) < 4) continue;
      slot.wait = (slot.wait || 0) + 20;
      if (slot.wait < 180) continue;
      const P = g.world.places[slot.place];
      if (P && Math.hypot(P.x - p.x, P.z - p.z) < 110) continue;
      slot.wait = 0;
      spawnSlot(g, slot);
      if (fac !== 'folk') g.pools[fac] = Math.max(0, g.pools[fac] - 2);
    }
  }

  function spawnSpy(g, where, opts = {}) {
    const W = g.world;
    const from = where === 'palace' ? W.spots.gate_out : W.spots.town_square;
    const ang = g.R() * 6.28;
    const x = (opts.near ? opts.near.x : from.x) + Math.cos(ang) * 6, z = (opts.near ? opts.near.z : from.z) + Math.sin(ang) * 6;
    const a = g.spawn('spy', x, z, { tags: opts.tag ? ['spy', opts.tag] : ['spy'] });
    a.ai.spyTarget = where;
    a.name = g.R.pick(D.NAMES.folkM);
    g.emit('spy', { id: a.id, where, tag: opts.tag || null });
    return a;
  }

  function resetPos(g, a) {
    const ai = a.ai;
    if (a.wagonSeat || a.harness || a.tags.has('army') || ai.squad || ai.wagon) return;
    if (a.dist2p != null && a.dist2p < 60 * 60) return;
    if (ai.mode === 'post' && ai.post) { a.x = ai.post.x; a.z = ai.post.z; a.y = ai.post.y != null ? ai.post.y : g.world.groundAt(a.x, a.z); }
    ai.target = null; ai.state = 'idle'; a.want = { x: 0, z: 0 };
  }

  function serAI(a) {
    const ai = a.ai;
    return { mode: ai.mode, post: ai.post, route: ai.route, ri: ai.ri, center: ai.center, r: ai.r, wanderer: ai.wanderer, squad: ai.squad, wagon: ai.wagon, follow: ai.follow, order: ai.order, holdAt: ai.holdAt, spyTarget: ai.spyTarget, garrison: a.garrison, harness: a.harness, wagonSeat: a.wagonSeat, revealed: a.revealed };
  }
  function deserAI(g, a, s) {
    a.ai = { state: 'idle', t: 0, mode: s.mode, post: s.post, route: s.route, ri: s.ri || 0, center: s.center, r: s.r, wanderer: s.wanderer, squad: s.squad, wagon: s.wagon, follow: s.follow, order: s.order, holdAt: s.holdAt, spyTarget: s.spyTarget };
    a.garrison = s.garrison; a.harness = s.harness || null; a.wagonSeat = s.wagonSeat || null; a.revealed = !!s.revealed;
  }
  function serWagon(w) { return { id: w.id, group: w.group, kind: w.kind, fac: w.fac, name: w.name, route: w.route, idx: w.idx, x: w.x, z: w.z, yaw: w.yaw, speed: w.speed, cows: w.cows, driver: w.driver, guards: w.guards, robbed: w.robbed, cargo: { name: w.cargo.name, items: w.cargo.items, gold: w.cargo.gold, fac: w.cargo.fac }, tag: w.tag, arrived: w.arrived, t: w.t, arriveT: w.arriveT }; }
  function deserWagon(g, s) {
    const w = Object.assign({ alarm: 0, gone: false, wait: 0, lag: 0 }, s);
    w.cargo = Object.assign({}, s.cargo, { wagon: w });
    w.y = g.world.height(w.x, w.z);
    return w;
  }
  function serSquad(s) { return { id: s.id, fac: s.fac, kind: s.kind, target: s.target, route: s.route, back: s.back, idx: s.idx, state: s.state, members: s.members, leader: s.leader, t: s.t, burn: s.burn, burnPrefix: s.burnPrefix, tag: s.tag, life: s.life, attackT: s.attackT || 0 }; }
  function deserSquad(g, s) { return Object.assign({}, s); }

  function rebuildGarrison(g) {
    g.garrison = [];
    for (const place in GARRISON) for (const def of GARRISON[place]) {
      if (def.notIf && def.notIf === g.pf) continue;
      for (let i = 0; i < def.n; i++) {
        const id = place + ':' + GARRISON[place].indexOf(def) + ':' + i;
        const a = g.actors.find(x => x.garrison === id && !x.dead);
        g.garrison.push({ place, def, i, id, actor: a ? a.id : null, wait: 0 });
      }
    }
  }

  K.AI = { populate, think, moveTo, perceive, fight, director, wagon, wagonSkip, launchSquad, launchCaravan, spawnSpy, reveal, inside, resetPos, serAI, deserAI, serWagon, deserWagon, serSquad, deserSquad, rebuildGarrison, spawnWolves, GARRISON, CARGO, freeNear };
})(globalThis.Korovany = globalThis.Korovany || {});
