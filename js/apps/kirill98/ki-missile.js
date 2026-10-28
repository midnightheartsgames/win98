(function (K) {
  'use strict';

  const G = 9.81, CAP = 200, SELF = 0.15, SWITCH = 0.4, COOL = Object.freeze({ bow: 0.8, crossbow: 0.35, taxe: 0.6, javelin: 0.6 }), PULL = 1, SUBS = 4;
  const MODES = Object.freeze(['melee', 'bow', 'crossbow', 'taxe', 'javelin']);
  const MESH = Object.freeze({ bow: 'w.bow', crossbow: 'w.crossbow', taxe: 'w.taxe', javelin: 'w.javelin' });

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const comb = (b, f, r, u) => [b.fwd[0] * f + b.right[0] * r + b.up[0] * u, b.fwd[1] * f + b.right[1] * r + b.up[1] * u, b.fwd[2] * f + b.right[2] * r + b.up[2] * u];

  const L = id => K.Data.LAUNCHERS[id], MS = id => K.Data.MISSILES[id];
  const stockOf = who => who.bag || who.sack || [];
  const count = (who, id) => { const s = stockOf(who).find(x => x.id === id); return s ? s.n : 0; };
  const take = (who, id, n) => {
    const st = stockOf(who), s = st.find(x => x.id === id);
    if (!s || s.n < (n || 1)) return false;
    s.n -= n || 1;
    if (!s.n) st.splice(st.indexOf(s), 1);
    return true;
  };
  const give = (who, id, n) => {
    const st = stockOf(who), s = st.find(x => x.id === id);
    if (s) s.n += n || 1; else st.push({ id, n: n || 1 });
  };

  function usable(who, mode) {
    const F = who.fight, c = K.Wounds ? K.Wounds.caps(who.kit) : { bow: true, weapon: true, twoHanded: true };
    if (mode === 'melee') return true;
    const spec = L(mode);
    if (!spec) return false;
    if (mode === 'bow') return count(who, 'bow') > 0 && count(who, 'arrow') > 0 && c.bow && !F.shield;
    if (mode === 'crossbow') return count(who, 'crossbow') > 0 && (F.loaded || count(who, 'bolt') > 0) && c.weapon;
    return count(who, MS(spec.missile).ammo) > 0 && c.weapon;
  }

  const modes = who => MODES.filter(m => usable(who, m));

  function setMode(who, mode) {
    const F = who.fight;
    if (!F || F.down || !usable(who, mode) || F.mode === mode) return false;
    F.mode = mode;
    F.draw = null;
    F.reload = null;
    F.act = null;
    F.guard = null;
    F.switching = SWITCH;
    return true;
  }

  const ranged = F => !!F && !!F.mode && F.mode !== 'melee';

  const drawTime = (who, mode) => mode === 'bow' && who.kit.side === 'elf' ? L('bow').elf : L(mode).draw;

  function press(who) {
    const F = who.fight;
    if (!ranged(F) || F.down || F.stun > 0 || F.binding || F.switching > 0 || F.cool > 0 || F.draw || F.reload) return false;
    if (F.mode === 'crossbow') {
      if (F.loaded) { F.draw = { t: 0, fire: true }; return true; }
      return reload(who);
    }
    F.draw = { t: 0 };
    return true;
  }

  function reload(who) {
    const F = who.fight, c = K.Wounds ? K.Wounds.caps(who.kit) : { twoHanded: true };
    if (F.mode !== 'crossbow' || F.loaded || F.reload || !count(who, 'bolt')) return false;
    if (!c.twoHanded) return false;
    F.reload = { t: 0, time: L('crossbow').reload };
    return true;
  }

  const cancel = F => { if (F) { F.draw = null; F.reload = null; } };

  function release(who, S, rnd) {
    const F = who.fight, D = F.draw;
    if (!ranged(F) || !D) return null;
    F.draw = null;
    const spec = L(F.mode), power = F.mode === 'crossbow' ? 1 : K.clamp(D.t / drawTime(who, F.mode), 0, 1);
    if (F.mode !== 'crossbow' && power < 0.15) return null;
    const m = MS(spec.missile);
    if (F.mode === 'crossbow') F.loaded = false;
    else if (!take(who, m.ammo)) return null;
    if (who.mv) { who.mv.stamina = Math.max(0, who.mv.stamina - spec.cost); if (who.mv.stamina <= 0) who.mv.tired = true; }
    F.cool = COOL[F.mode];
    const shot = launch(S, who, spec.missile, power, rnd);
    if (F.mode !== 'bow' && F.mode !== 'crossbow' && !count(who, m.ammo)) { F.mode = 'melee'; F.switching = SWITCH; }
    return shot;
  }

  function launch(S, who, kind, power, rnd) {
    const F = who.fight, m = MS(kind), b = K.basis(F.aim.yaw, F.aim.pitch), r = rnd || Math.random;
    const moving = who.mv ? K.clamp(who.mv.speed / 4, 0, 1) : 0, tired = who.mv && who.mv.tired ? 1.6 : 1;
    const skill = (K.Data.EXP[F.exp] || K.Data.EXP.soldier).acc;
    const spread = m.spread * (1 + 2.5 * moving) * tired * (1.6 - skill), a = r() * Math.PI * 2, e = Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * spread;
    const dir = norm(add(b.fwd, add(mul(b.right, Math.cos(a) * e), mul(b.up, Math.sin(a) * e))));
    const speed = m.speed[0] + (m.speed[1] - m.speed[0]) * power;
    const side = F.hand === 'l' ? -1 : 1, from = add(F.aim.eye, kind === 'arrow' || kind === 'bolt' ? comb(b, 0.3, 0, 0) : comb(b, 0.25, 0.12 * side, 0.05));
    const base = who.mv ? who.mv.vel : [0, 0, 0];
    const shot = { id: S.nextId++, kind, owner: who === S.player ? 'player' : who.id, pos: from, prev: from.slice(), vel: add(mul(dir, speed), mul(base, 0.6)), t: 0, spin: 0, exp: F.exp };
    (S.missiles = S.missiles || []).push(shot);
    return shot;
  }

  function tick(S, dt) {
    const who = [];
    if (S.player && S.player.fight) who.push(S.player);
    for (const p of S.people) if (p.fight) who.push(p);
    for (const p of who) {
      const F = p.fight;
      if (F.switching > 0) F.switching = Math.max(0, F.switching - dt);
      if (F.cool > 0) F.cool = Math.max(0, F.cool - dt);
      if (F.draw) F.draw.t += dt;
      if (F.reload) {
        F.reload.t += dt;
        if (F.reload.t >= F.reload.time) { if (take(p, 'bolt')) F.loaded = true; F.reload = null; }
      }
      if (F.pulling) {
        F.pulling.t += dt;
        if (F.pulling.t >= PULL) { unload(S, p); F.pulling = null; }
      }
      if (ranged(F) && !usable(p, F.mode) && !F.draw && !F.cool) F.mode = 'melee';
    }
  }

  const ownerOf = (S, o) => o === 'player' ? S.player : S.people.find(p => p.id === o) || null;

  function hitTest(S, m, a, b, W) {
    const spec = K.Data.SHOTS[m.kind], seg = sub(b, a), sl = len(seg) || 1e-6;
    let best = null;
    const take = (s, h) => { if (s >= 0 && s <= 1 && (!best || s < best.s)) best = Object.assign({ s }, h); };
    const owner = m.owner, list = [];
    if (S.player && S.player.fight && !S.player.fight.down) list.push(S.player);
    for (const p of S.people) list.push(p);
    for (const p of S.beasts || []) if (!p.fight.down) list.push(p);
    for (const p of list) {
      if (!p.frames) continue;
      if ((p === S.player ? 'player' : p.id) === owner && m.t < SELF) continue;
      const q = p.mv.pos;
      if (Math.hypot(q[0] - (a[0] + b[0]) / 2, q[2] - (a[2] + b[2]) / 2) > sl / 2 + 1.6) continue;
      const F = p.fight;
      if (F && F.shield && !(p.kit.cut || {}).lFore && !F.down) {
        const disc = K.Combat.shieldDisc(F), den = dot(seg, disc.n);
        if (Math.abs(den) > 1e-9) {
          const s = dot(sub(disc.c, a), disc.n) / den, x = add(a, mul(seg, s));
          if (s >= 0 && s <= 1 && len(sub(x, disc.c)) <= disc.r) take(s, { who: p, shield: true, at: x });
        }
      }
      if (spec.eye && F) for (const e of K.Combat.eyePoints(p)) {
        const sd = K.Combat.segDist(a, b, e.at, e.at);
        if (sd.d <= 0.03) take(Math.max(0, sd.s - 0.08 / sl), { who: p, part: 0, tag: 'eye', eye: e.side, at: e.at, onBlade: true });
      }
      for (const [part, c0, c1, r, tag] of K.Body.capsules(p.kit, p.frames)) {
        const sd = K.Combat.segDist(a, b, c0, c1);
        if (sd.d <= r) take(Math.max(0, sd.s - Math.sqrt(Math.max(0, r * r - sd.d * sd.d)) / sl), { who: p, part, tag, at: sd.at, onBlade: true });
      }
    }
    for (const bd of S.bodies) {
      const an = K.Body.anchorOf(bd);
      if (Math.hypot(an[0] - (a[0] + b[0]) / 2, an[2] - (a[2] + b[2]) / 2) > sl / 2 + 1.6) continue;
      for (const [part, c0, c1, r, tag] of K.Body.capsules(bd.kit, bd.frames)) {
        const sd = K.Combat.segDist(a, b, c0, c1);
        if (sd.d <= r) take(sd.s, { who: bd, body: true, part, tag, at: sd.at, onBlade: true });
      }
    }
    if (W.flora) {
      const F = W.flora, T = F.trees, mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
      F.trunksNear(mx, mz, sl / 2 + 0.5, t => {
        const g = W.terrain.heightAt(T.X[t], T.Z[t]), top = g + T.H[t] * 0.8, rad = T.RAD[t];
        const sd = K.Combat.segDist(a, b, [T.X[t], g, T.Z[t]], [T.X[t], top, T.Z[t]]);
        if (sd.d <= rad) take(sd.s, { tree: t, at: sd.at });
      });
    }
    const mid = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2], nearby = W.near(mid[0], mid[1], sl / 2 + 1);
    for (const bx of W.dynNear && W.dyn.length ? nearby.concat(W.dynNear(mid[0], mid[1], sl / 2 + 1)) : nearby) {
      for (let k = 1; k <= 6; k++) {
        const s = k / 6, x = add(a, mul(seg, s)), dx = x[0] - bx.x, dz = x[2] - bx.z, u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
        if (Math.abs(u) <= bx.hw && Math.abs(v) <= bx.hd && x[1] >= bx.y0 && x[1] <= bx.y1) { take(s - 1 / 12, { wall: true, at: add(a, mul(seg, s - 1 / 12)) }); break; }
      }
    }
    const ga = a[1] - W.terrain.heightAt(a[0], a[2]), gb = b[1] - W.terrain.heightAt(b[0], b[2]);
    if (gb <= 0) take(ga > 0 ? ga / (ga - gb) : 0, { ground: true });
    return best;
  }

  function attach(S, m, host, part, at, dir) {
    const fr = host.frames, o = part * 12, rel = sub(at, [fr[o + 9], fr[o + 10], fr[o + 11]]);
    const local = v => [v[0] * fr[o] + v[1] * fr[o + 1] + v[2] * fr[o + 2], v[0] * fr[o + 3] + v[1] * fr[o + 4] + v[2] * fr[o + 5], v[0] * fr[o + 6] + v[1] * fr[o + 7] + v[2] * fr[o + 8]];
    stick(S, { id: m.id, kind: m.kind, host: host.id === undefined ? 'player' : host === S.player ? 'player' : host.id, part, l: local(rel), d: local(dir), born: S.time });
  }

  function stick(S, s) {
    const list = S.stuck = S.stuck || [];
    list.push(s);
    if (list.length > CAP) list.splice(0, list.length - CAP);
  }

  function land(S, m, at, dir, speed) {
    const spec = MS(m.kind);
    if (spec.stick) { stick(S, { id: m.id, kind: m.kind, host: null, pos: add(at, mul(dir, -spec.len * 0.65)), dir, born: S.time }); return; }
    const y = norm(dir), x = norm(Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [-y[2], 0, y[0]]), z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
    const frame = new Float32Array([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], at[0] - y[0] * 0.2, at[1] - y[1] * 0.2 + 0.05, at[2] - y[2] * 0.2]);
    S.items.push(K.Body.drop(spec.ammo, frame, { uid: S.nextId++, vel: mul(dir, Math.min(3, speed * 0.15)), born: S.time }));
  }

  function struck(S, m, hit, dir, speed, rnd, events) {
    const spec = MS(m.kind), shooter = ownerOf(S, m.owner), def = hit.who, D = def.fight;
    if (hit.shield) {
      events.push({ kind: 'block', who: shooter || def, to: def, at: hit.at, material: 'wood', missile: m.kind });
      const arm = D.hand === 'l' ? 6 : 5;
      if (m.kind === 'javelin') { D.shieldLoad = (D.shieldLoad || 0) + 1; attach(S, m, def, arm, hit.at, dir); }
      else if (spec.stick) attach(S, m, def, arm, hit.at, dir);
      else land(S, m, hit.at, mul(dir, -1), speed * 0.3);
      return;
    }
    const spin = m.kind === 'taxe' ? Math.cos(m.spin) : 1, kind = m.kind === 'taxe' ? (spin > 0.2 ? 'chop' : 'crush') : 'stab';
    const att = { fight: { weapon: m.kind, act: { kind: 'shot', power: K.clamp(speed / spec.ref, 0.3, 1.2) }, exp: m.exp || 'soldier', aim: { eye: sub(hit.at, mul(dir, 2)) }, shield: false }, mv: { tired: false } };
    if (def.beast) {
      const r = K.Beasts.struck(S, att, def, hit, kind, events, rnd || Math.random, shooter);
      if (def.fight.hostile === null && shooter) def.fight.hostile = shooter;
      attach(S, m, def, r.part, hit.at, dir);
      return;
    }
    const r = K.Combat.strike(att, def, Object.assign({}, hit), kind, rnd || Math.random);
    if (hit.body) {
      events.push({ kind: 'hit', who: shooter, to: def, at: hit.at, dir, part: r.part, type: r.type, damage: 0, material: r.material, body: true, missile: m.kind });
      if (r.cut !== null) {
        const parts = K.Combat.severs(def.kit, r.cut).filter(p => !(def.kit.cut || {})[K.Body.PARTS[p]]);
        if (parts.length) events.push({ kind: 'cut', who: shooter, to: def, at: hit.at, dir, parts, iron: false, body: true });
      }
      K.Body.nudge(def, hit.at, dir, 0.6, 0.35);
    } else {
      D.life -= r.damage;
      D.hitBy = shooter;
      D.hitTime = S.time;
      if (K.Wounds) K.Wounds.hurt(def, r);
      if (shooter && D.hostile === null && def !== S.player && def.kit.side !== 'straw') D.hostile = shooter;
      events.push({ kind: 'hit', who: shooter, to: def, at: hit.at, dir, part: r.part, type: r.type, damage: r.damage, material: r.material, heavy: r.damage >= 14 || r.cut !== null, missile: m.kind });
      if (r.eye) {
        def.kit.eyes = Object.assign({}, def.kit.eyes, { [r.eye]: true });
        events.push({ kind: 'eye', who: shooter, to: def, at: hit.at, side: r.eye });
      }
      if (r.cut !== null) {
        const parts = K.Combat.severs(def.kit, r.cut).filter(p => !(def.kit.cut || {})[K.Body.PARTS[p]]);
        if (parts.length) events.push({ kind: 'cut', who: shooter, to: def, at: hit.at, dir, parts, iron: parts.every(p => (def.kit.pros || {})[K.Body.PARTS[p]]) });
      }
    }
    if (r.type === 'crush' || r.type === 'blunt' || r.material === 'plate' && m.kind === 'arrow' && (rnd || Math.random)() < 0.6) land(S, m, hit.at, mul(dir, -0.4), speed * 0.4);
    else attach(S, m, def, r.part, hit.at, dir);
  }

  function step(S, dt, W, rnd) {
    tick(S, dt);
    const events = [], keep = [], air = K.Weather ? K.Weather.arrow(K.Weather.at(S)) : { push: [0, 0], drop: 1 };
    for (const m of S.missiles || []) {
      const spec = MS(m.kind);
      let done = false;
      for (let k = 0; k < SUBS && !done; k++) {
        const h = dt / SUBS, sp = len(m.vel);
        m.vel[1] -= G * air.drop * h;
        m.vel[0] += air.push[0] * h;
        m.vel[2] += air.push[1] * h;
        const drag = Math.max(0, 1 - spec.drag * sp * h);
        m.vel = mul(m.vel, drag);
        const a = m.pos.slice(), b = add(a, mul(m.vel, h));
        m.t += h;
        m.spin += (spec.spin || 0) * h;
        const hit = hitTest(S, m, a, b, W);
        if (hit) {
          const at = hit.at || add(a, mul(sub(b, a), hit.s)), dir = norm(m.vel), speed = len(m.vel);
          if (hit.who) struck(S, m, Object.assign(hit, { at }), dir, speed, rnd, events);
          else if (hit.tree !== undefined || hit.wall) { events.push({ kind: 'thud', at, material: 'wood', missile: m.kind }); land(S, m, at, spec.stick ? dir : mul(dir, -0.3), speed); }
          else if (W.terrain.waterAt(at[0], at[2]) > at[1]) events.push({ kind: 'splash', at, missile: m.kind });
          else { events.push({ kind: 'thud', at, material: 'ground', missile: m.kind }); land(S, m, at, dir, speed); }
          done = true;
        } else {
          m.prev = a;
          m.pos = b;
        }
      }
      if (!done && m.t < 8 && m.pos[1] > -50) keep.push(m);
    }
    S.missiles = keep;
    return events;
  }

  function hostOf(S, s) {
    if (s.host === null) return null;
    if (s.host === 'player') return S.player;
    return S.people.find(p => p.id === s.host) || S.bodies.find(b => b.id === s.host) || (S.beasts || []).find(b => b.id === s.host) || (S.carcasses || []).find(c => c.id === s.host && !c.piece) || null;
  }

  function placeStuck(S, s) {
    const spec = MS(s.kind);
    if (s.host === null) return { pos: s.pos, dir: s.dir };
    const h = hostOf(S, s);
    if (!h || !h.frames) return null;
    const fr = h.frames, o = s.part * 12, w = v => [fr[o] * v[0] + fr[o + 3] * v[1] + fr[o + 6] * v[2], fr[o + 1] * v[0] + fr[o + 4] * v[1] + fr[o + 7] * v[2], fr[o + 2] * v[0] + fr[o + 5] * v[1] + fr[o + 8] * v[2]];
    const tip = add([fr[o + 9], fr[o + 10], fr[o + 11]], w(s.l)), dir = norm(w(s.d));
    return { pos: add(tip, mul(dir, -spec.len * 0.7)), dir };
  }

  const frameOf = (pos, dir, roll, out) => {
    const y = norm(dir), ref = Math.abs(y[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    let z = norm([ref[1] * y[2] - ref[2] * y[1], ref[2] * y[0] - ref[0] * y[2], ref[0] * y[1] - ref[1] * y[0]]);
    let x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll), nx = add(mul(x, c), mul(z, s)), nz = add(mul(z, c), mul(x, -s)); x = nx; z = nz; }
    const f = out || new Float32Array(12);
    f.set([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], pos[0], pos[1], pos[2]]);
    return f;
  };

  function gear(S) {
    const out = [];
    for (const m of S.missiles || []) {
      const v = norm(m.vel), upP = norm(sub([0, 1, 0], mul(v, v[1]))), dir = m.kind === 'taxe' ? add(mul(upP, Math.cos(m.spin)), mul(v, Math.sin(m.spin))) : v;
      out.push(['w.' + m.kind, frameOf(m.pos, dir, 0, m.frame || (m.frame = new Float32Array(12)))]);
    }
    S.stuck = (S.stuck || []).filter(s => s.host === null || hostOf(S, s));
    for (const s of S.stuck) {
      const p = placeStuck(S, s);
      if (p) out.push(['w.' + s.kind, frameOf(p.pos, p.dir, 0, s.frame || (s.frame = new Float32Array(12)))]);
    }
    return out;
  }

  function pickNear(S, eye, dir, reach) {
    let best = null, bd = reach;
    for (const s of S.stuck || []) {
      if (s.host !== null) continue;
      const tip = add(s.pos, mul(s.dir, MS(s.kind).len * 0.6)), sd = K.Combat.segDist(eye, add(eye, mul(dir, reach)), s.pos, tip);
      if (sd.d < 0.15 && sd.s * reach < bd) { bd = sd.s * reach; best = s; }
    }
    return best;
  }

  function collect(S, who, s) {
    const list = S.stuck || [], i = list.indexOf(s);
    if (i < 0) return null;
    list.splice(i, 1);
    give(who, MS(s.kind).ammo, 1);
    return MS(s.kind).ammo;
  }

  const inBody = (S, b) => (S.stuck || []).filter(s => s.host === b.id && hostOf(S, s) === b);

  function unload(S, who) {
    const F = who.fight, id = who === S.player ? 'player' : who.id, arm = F.hand === 'l' ? 6 : 5;
    const out = (S.stuck || []).filter(s => s.host === id && s.part === arm && s.kind === 'javelin');
    for (const s of out) {
      const p = placeStuck(S, s);
      S.stuck.splice(S.stuck.indexOf(s), 1);
      if (p) land(S, { kind: 'javelin', id: s.id }, add(p.pos, mul(p.dir, 0.8)), mul(p.dir, -1), 2);
    }
    F.shieldLoad = 0;
    return out.length;
  }

  function pull(who) {
    const F = who.fight;
    if (!F || !F.shieldLoad || F.pulling || F.down) return false;
    F.pulling = { t: 0 };
    F.guard = null;
    return true;
  }

  function pose(F) {
    const b = K.basis(F.aim.yaw, F.aim.pitch), e = F.aim.eye, s = F.hand === 'l' ? -1 : 1, D = F.draw, mode = F.mode;
    const at = (f, r, u) => add(e, comb(b, f, r * s, u));
    if (mode === 'bow') {
      const k = D ? K.clamp(D.t / 0.8, 0, 1) : 0, up = norm(add(b.up, mul(b.right, -0.38 * s))), stave = at(0.64, -0.2, -0.12 - 0.1 * (1 - k));
      const hand = add(stave, comb(b, -0.12 - 0.48 * k, (0.12 + 0.06 * k) * s, 0.04 + 0.05 * k));
      return { grip: hand, grip2: stave, d: b.fwd, edge: up, gearO: stave, gearY: up, gearF: b.fwd, nock: D ? { o: hand, y: b.fwd } : null, phase: 'aim', choke: 0 };
    }
    if (mode === 'crossbow') {
      const low = F.reload ? 1 : 0, grip = at(0.28 - 0.08 * low, 0.11, -0.16 - 0.22 * low), d = norm(add(b.fwd, mul(b.up, -0.9 * low)));
      return { grip, grip2: add(grip, mul(d, 0.28)), d, edge: b.up, gearO: grip, gearY: d, gearF: b.up, phase: 'aim', choke: 0, loaded: !!F.loaded };
    }
    const k = D ? K.clamp(D.t / (mode === 'taxe' ? 0.5 : 0.6), 0, 1) : 0;
    if (F.cool > 0) return { grip: at(0.45, 0.2, -0.25), d: b.fwd, edge: b.up, phase: 'aim', choke: 0, empty: true };
    if (mode === 'taxe') {
      const grip = at(0.1 - 0.3 * k, 0.26, 0.02 + 0.12 * k), d = norm(add(mul(b.up, 0.8), mul(b.fwd, 0.6 - 1.2 * k)));
      return { grip, d, edge: b.fwd, gearO: grip, gearY: d, gearF: b.fwd, phase: 'aim', choke: 0 };
    }
    const grip = at(0.05 - 0.25 * k, 0.22, 0.05 + 0.06 * k), d = norm(add(b.fwd, mul(b.up, 0.08)));
    return { grip, d, edge: b.up, gearO: add(grip, mul(d, -0.55)), gearY: d, gearF: b.up, phase: 'aim', choke: 0 };
  }

  K.Missile = { CAP, MODES, MESH, SWITCH, count, take, give, usable, modes, setMode, ranged, drawTime, press, release, reload, cancel, launch, step, gear, pickNear, collect, inBody, unload, pull, pose, placeStuck, frameOf };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
