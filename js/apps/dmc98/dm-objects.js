(function (S) {
  'use strict';
  const { wrapAng } = S;
  const DT = 1 / 60, PI = Math.PI;

  function foeShot(g, src, kind, speed, dmg, o = {}) {
    const p = g.player, sx = src.x + Math.sin(src.face) * 0.8 + Math.cos(src.face) * (o.side || 0), sy = src.y + (o.hy != null ? o.hy : 1.4), sz = src.z + Math.cos(src.face) * 0.8 - Math.sin(src.face) * (o.side || 0);
    const tx = p.x, ty = p.y + 1, tz = p.z;
    let dx = tx - sx, dy = ty - sy, dz = tz - sz; const d = Math.hypot(dx, dy, dz) || 1;
    dx /= d; dy /= d; dz /= d;
    if (o.spread) { const a = Math.atan2(dx, dz) + o.spread, l = Math.hypot(dx, dz); dx = Math.sin(a) * l; dz = Math.cos(a) * l; }
    g.shots.push({ kind, team: 'foe', x: sx, y: sy, z: sz, vx: dx * speed, vy: dy * speed, vz: dz * speed, life: 3, r: kind === 'fireball' ? 0.6 : 0.3, dmg, src });
    if (kind === 'bullet') { g.sfx('gunE', sx, sy, sz, 0.7); g.ev({ t: 'muzzle', x: sx, y: sy, z: sz }); }
  }
  function meteor(g, x, z, delay) { const y = g.W.groundAt(x, z, 0.3, 40); g.shots.push({ kind: 'meteor', team: 'foe', x, y: (isFinite(y) ? y : 0) + 18, z, gy: isFinite(y) ? y : 0, delay, t: 0, vx: 0, vy: 0, vz: 0, life: 5, r: 2, dmg: 12 }); }
  function spearRain(g, x, z, delay) { const y = g.W.groundAt(x, z, 0.3, 40); g.shots.push({ kind: 'rain', team: 'foe', x, y: (isFinite(y) ? y : 0) + 16, z, gy: isFinite(y) ? y : 0, delay, t: 0, vx: 0, vy: 0, vz: 0, life: 5, r: 1.6, dmg: 11 }); }
  function fireWave(g, e) {
    const p = g.player, a = Math.atan2(p.x - e.x, p.z - e.z);
    g.shots.push({ kind: 'wave', team: 'foe', x: e.x + Math.sin(a) * 3, y: e.y, z: e.z + Math.cos(a) * 3, vx: Math.sin(a) * 12, vy: 0, vz: Math.cos(a) * 12, life: 2.4, r: 1.8, dmg: 14, face: a });
  }

  function explode(g, x, y, z, r, dmg, team, o = {}) {
    g.ev({ t: 'explode', x, y, z, r, kind: o.kind || 'fire' }); g.sfx(o.sfx || 'boom', x, y, z, Math.min(1, r / 2));
    if (team === 'foe') { const p = g.player; if (Math.hypot(p.x - x, p.z - z) < r + 0.3 && p.y < y + r && p.y + 1.8 > y - r) S.hurtPlayer(g, dmg, { x, z }, { knock: true, kb: 7, up: 5, kind: o.kind }); }
    else for (const e of g.foes) if (!e.dead && !e.spawnT && !e.hidden && Math.hypot(e.x - x, e.z - z) < r + e.r && Math.abs(e.y + e.h / 2 - y) < r + e.h / 2) S.hitFoe(g, e, Object.assign({ dmg, kb: 4, up: o.up || 0, stun: 0.6, key: o.key || 'charge', fromX: x, fromZ: z }, o.hit || {}));
  }

  function updateShots(g) {
    const W = g.W, p = g.player;
    for (const s of g.shots) {
      s.life -= DT;
      if (s.kind === 'meteor' || s.kind === 'rain') {
        s.t += DT;
        if (s.t < s.delay) { if (Math.floor(s.t * 10) !== Math.floor((s.t - DT) * 10)) g.ev({ t: 'warnRing', x: s.x, y: s.gy, z: s.z, r: s.r }); continue; }
        s.vy -= 60 * DT; s.y += s.vy * DT;
        if (s.y <= s.gy) { s.dead = true; explode(g, s.x, s.gy + 0.3, s.z, s.r, s.dmg, 'foe', { kind: s.kind === 'rain' ? 'holy' : 'fire' }); }
        continue;
      }
      if (s.kind === 'wave') {
        s.x += s.vx * DT; s.z += s.vz * DT;
        g.ev({ t: 'fireTrail', x: s.x, y: s.y, z: s.z, face: s.face });
        if (!s.hit) { const dx = p.x - s.x, dz = p.z - s.z, lon = dx * Math.sin(s.face) + dz * Math.cos(s.face), lat = dx * Math.cos(s.face) - dz * Math.sin(s.face); if (Math.abs(lon) < 0.8 && Math.abs(lat) < 2 && p.y < s.y + 1.2) s.hit = S.hurtPlayer(g, s.dmg, s, { knock: true, kb: 6, up: 6, kind: 'fire' }); }
        const gy = W.groundAt(s.x, s.z, 0.3, s.y + 1); if (!isFinite(gy) || Math.abs(gy - s.y) > 1) s.dead = true;
        if (s.life <= 0) s.dead = true;
        continue;
      }
      const ox = s.x, oy = s.y, oz = s.z;
      s.x += s.vx * DT; s.y += s.vy * DT; s.z += s.vz * DT;
      const sp = Math.hypot(s.vx, s.vy, s.vz) || 1, step = sp * DT;
      const wall = W.ray(ox, oy, oz, s.vx / sp, s.vy / sp, s.vz / sp, step);
      if (s.team === 'foe') {
        if (Math.hypot(p.x - s.x, p.z - s.z) < s.r + p.r && s.y > p.y - 0.2 && s.y < p.y + p.h + 0.2) {
          s.dead = true;
          if (s.kind === 'spear') { explode(g, s.x, s.y, s.z, 1.5, s.dmg, 'foe', { kind: 'holy' }); continue; }
          const ok = S.hurtPlayer(g, s.dmg, s.src || s, { knock: s.kind === 'fireball', kb: s.kind === 'fireball' ? 8 : 2, kind: s.kind === 'ice' ? 'ice' : 'hit' });
          if (ok && s.kind === 'ice' && g.rng() < 0.3) { p.frozen = 1.1; g.msg('Неро заморожен! Жмите Пробел.', 1.5); }
          if (s.kind === 'fireball') explode(g, s.x, s.y, s.z, 0.1, 0, 'foe');
          continue;
        }
      } else {
        if (s.kind === 'glad') {
          if (s.z >= 9.55 && s.y > 4 && s.y < 9.5 && Math.abs(s.x) < 7) { s.dead = true; if (g.boss && S.FOE_AI.agnus) S.FOE_AI.agnus.glassHit(g, g.boss); continue; }
        }
        for (const e of g.foes) {
          if (e.dead || e.spawnT || e.hidden) continue;
          if (Math.hypot(e.x - s.x, e.z - s.z) < s.r + e.r && s.y > e.y - 0.3 && s.y < e.y + e.h + 0.3) {
            s.dead = true;
            if (s.kind === 'charge') { const G = S.DATA.GUN; explode(g, s.x, s.y, s.z, G.crad[s.lv - 1], G.cdmg[s.lv - 1] * (p.dtOn ? 1.3 : 1), 'hero', { kind: 'charge', sfx: 'boomS', key: 'charge', up: s.lv >= 2 ? 4 : 0 }); }
            break;
          }
        }
        if (s.dead) continue;
      }
      if (wall < step || s.life <= 0) {
        s.dead = true;
        if (s.kind === 'charge') { const G = S.DATA.GUN; explode(g, s.x, s.y, s.z, G.crad[s.lv - 1], G.cdmg[s.lv - 1], 'hero', { kind: 'charge', sfx: 'boomS', key: 'charge' }); hitObjectsAt(g, s.x, s.y, s.z, 1.5); }
        else if (s.kind === 'fireball' || s.kind === 'spear') explode(g, s.x, s.y, s.z, s.kind === 'spear' ? 1.5 : 1.2, s.dmg, 'foe', { kind: s.kind === 'spear' ? 'holy' : 'fire' });
        else if (s.kind === 'ice') g.ev({ t: 'shatter', x: s.x, y: s.y, z: s.z, small: true });
        else if (s.kind === 'glad') g.ev({ t: 'hit', x: s.x, y: s.y, z: s.z, kind: 'metal' });
        else g.ev({ t: 'hit', x: s.x, y: s.y, z: s.z, kind: 'spark' });
      }
    }
    g.shots = g.shots.filter(s => !s.dead);
  }

  function breakObj(g, o) {
    o.dead = true; g.aState(g.areaId).breaks[o.key] = true;
    g.dropOrbs(o.x, o.y + 0.5, o.z, o.b.orbs, 'red');
    if (g.rng() < 0.12) g.dropOrbs(o.x, o.y + 0.5, o.z, 1, 'green', 10);
    g.ev({ t: 'break', x: o.x, y: o.y, z: o.z, kind: o.b.kind }); g.sfx(o.b.kind === 'vase' || o.b.kind === 'tombstone' || o.b.kind === 'rockpile' ? 'breakstone' : 'breakwood', o.x, o.y, o.z);
    g.styleHit('break', 3, false);
  }
  function hitSwitch(g, o) {
    if (!o.on) return;
    o.on = false; g.flags[o.flag] = true;
    for (const b of g.barriers) if (b.bar.flag === o.flag) b.on = false;
    g.ev({ t: 'hit', x: o.x, y: o.y + 0.9, z: o.z, kind: 'spark', big: true }); g.sfx('machine', o.x, o.y, o.z);
    g.msg('Механизм сработал. Решётка поднялась.', 3);
  }
  function hitObj(g, o, fromX, fromZ, sword) {
    switch (o.kind) {
      case 'break': breakObj(g, o); return true;
      case 'switch': hitSwitch(g, o); return true;
      case 'gyro': if (!sword) return false; { const dx = o.x - fromX, dz = o.z - fromZ, d = Math.hypot(dx, dz) || 1; o.vx = dx / d * 11; o.vz = dz / d * 11; o.moving = true; g.sfx('gyro', o.x, o.y, o.z); g.ev({ t: 'hit', x: o.x, y: o.y + 0.6, z: o.z, kind: 'metal' }); } return true;
      case 'die': if (!sword) return false; rollDie(g, o); return true;
      case 'cannon': if (!sword || o.dead) return false; o.hp--; o.flash = 0.15; g.ev({ t: 'hit', x: o.x, y: o.y + 1.2, z: o.z, kind: 'metal', big: true }); g.sfx('clang', o.x, o.y + 1, o.z); if (o.hp <= 0) { o.dead = true; g.flags[o.flag] = true; for (const b of g.barriers) if (b.bar.flag === o.flag) b.on = false; explode(g, o.x, o.y + 1, o.z, 2.5, 0, 'foe'); g.msg('Пушка уничтожена.', 2.5); g.styleHit('cannon', 40, false); } return true;
      default: return false;
    }
  }
  function swordObjects(g, h) {
    const p = g.player, fx = Math.sin(p.face), fz = Math.cos(p.face), cosA = Math.cos(((h.arc || 150) / 2) * PI / 180);
    let n = 0;
    for (const o of g.objs) {
      if (o.dead || !['break', 'switch', 'gyro', 'die', 'cannon'].includes(o.kind)) continue;
      const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
      if (d - (o.r || 0.6) > (h.reach || 2.7)) continue;
      if ((h.arc || 150) < 360 && d > 0.5 && (dx * fx + dz * fz) / d < cosA) continue;
      if (Math.abs(o.y - p.y) > 2.6) continue;
      if (hitObj(g, o, p.x, p.z, true)) n++;
    }
    return n;
  }
  function hitObjectsAt(g, x, y, z, r) { for (const o of g.objs) if (!o.dead && (o.kind === 'break' || o.kind === 'switch') && Math.hypot(o.x - x, o.z - z) < r + 0.6 && Math.abs(o.y - y) < 2.5) hitObj(g, o, x, z, false); }
  function shootObjects(g, ox, oy, oz, hx, hy, hz) {
    const dx = hx - ox, dy = hy - oy, dz = hz - oz, L = Math.hypot(dx, dy, dz) || 1;
    let best = null, bt = Infinity;
    for (const o of g.objs) {
      if (o.dead || (o.kind !== 'break' && o.kind !== 'switch')) continue;
      const cy = o.y + (o.kind === 'switch' ? 0.9 : 0.5), t = ((o.x - ox) * dx + (cy - oy) * dy + (o.z - oz) * dz) / L;
      if (t < 0 || t > L) continue;
      const px = ox + dx / L * t, py = oy + dy / L * t, pz = oz + dz / L * t;
      if (Math.hypot(o.x - px, cy - py, o.z - pz) < 0.8 && t < bt) { bt = t; best = o; }
    }
    if (best) hitObj(g, best, ox, oz, false);
  }

  function inHazard(g, x, z) { for (const h of g.def.hazards) { const q = h.zone; if (x >= q[0] && x <= q[2] && z >= q[1] && z <= q[3]) return h; } return null; }

  function throwHeld(g) {
    const p = g.player, e = p.holding; if (!e) return;
    p.holding = null; e.gone = true; e.dead = true;
    const tx = 0, ty = 6.8, tz = 10, sx = p.x, sy = p.y + 1.7, sz = p.z, dx = tx - sx, dy = ty - sy, dz = tz - sz, d = Math.hypot(dx, dy, dz) || 1;
    g.shots.push({ kind: 'glad', team: 'hero', x: sx, y: sy, z: sz, vx: dx / d * 34, vy: dy / d * 34, vz: dz / d * 34, life: 2, r: 0.4 });
    S.pSpecial(g, 'buster', 0.45); g.sfx('throw', p.x, p.y + 1, p.z); g.styleHit('throw', 25, !p.ground);
    S.faceTo(p, tx, tz);
  }
  function dropHeld(g) { const p = g.player, e = p.holding; if (!e) return; p.holding = null; e.st = 'hurt'; e.stT = 0; e.stun = 0.5; }

  function spawnGyro(g, m) {
    if (g.objs.some(o => o.kind === 'gyro' && !o.dead)) return;
    g.objs.push({ kind: 'gyro', x: m.out[0], y: 0, z: m.out[1], vx: 0, vz: 0, r: 0.9, spin: 0, moving: false, t: 0 });
    g.sfx('machine', m.x, 1, m.z); g.msg('Гироклинок запущен. Ударьте его мечом, чтобы толкнуть.', 2.5);
  }

  function rollDie(g, o) {
    const B = g.board; if (!B || B.busy || g.fight) return;
    B.busy = true; B.rollT = 0; B.result = 1 + Math.floor(g.rng() * 3); o.rolling = 1.1;
    if (!B.free) B.rolls--; B.free = false;
    g.sfx('dice', o.x, o.y, o.z); g.ev({ t: 'hit', x: o.x, y: o.y, z: o.z, kind: 'spark' });
  }
  function squarePos(B, i) { const a = PI + i * (PI * 2 / B.kinds.length); return [Math.sin(a) * B.r, Math.cos(a) * B.r]; }
  function boardHop(g) {
    const p = g.player, B = g.board, h = B.hop;
    h.t += DT;
    const u = Math.min(1, h.t / 0.5);
    p.x = h.x0 + (h.x1 - h.x0) * u; p.z = h.z0 + (h.z1 - h.z0) * u; p.y = 0.3 + Math.sin(u * PI) * 2.2;
    p.face = Math.atan2(h.x1 - h.x0, h.z1 - h.z0); p.anim = 'hop'; p.animU = u; p.vx = p.vz = 0; p.vy = 0;
    if (u >= 1) {
      B.pos++; B.left--; g.sfx('land', p.x, p.y, p.z, 0.7);
      if (B.left > 0 && B.pos < B.kinds.length - 1) { const [x, z] = squarePos(B, B.pos + 1); B.hop = { t: 0, x0: p.x, z0: p.z, x1: x, z1: z }; }
      else { p.st = 'move'; p.special = null; p.ground = true; p.y = 0.3; squareEffect(g); }
    }
  }
  function squareEffect(g) {
    const B = g.board, k = B.kinds[B.pos], p = g.player;
    const die = g.objs.find(o => o.kind === 'die'); const [sx, sz] = squarePos(B, B.pos); die.x = sx * 0.72; die.z = sz * 0.72;
    B.busy = false;
    if (k === 'goal') { g.flags[B.flag] = true; for (const b of g.barriers) if (b.bar.flag === B.flag) b.on = false; g.dropOrbs(p.x, p.y, p.z, 90, 'red'); g.msg('ФИНИШ! Дверь открыта.', 3); g.sfx('fanfare'); B.done = true; return; }
    if (k === 'red') {
      const a = g.rng() * PI * 2, n = B.fights++, list = n % 2 ? ['mephisto', 'scarecrow', 'scarecrow'] : ['scarecrow', 'scarecrowLeg', 'frost'];
      const waves = [list.map((t, i) => ({ type: t, x: p.x * 0.6 + Math.sin(a + i * 2.1) * 5, z: p.z * 0.6 + Math.cos(a + i * 2.1) * 5 }))];
      const def = { id: 'board' + n, zone: [-20, -20, 20, 20], waves, seal: true };
      g.extraFights.push(def); g.startFight(def.id); g.msg('Красная клетка: бой!', 2);
    } else if (k === 'blue') {
      if (B.pos === B.frag && !g.save.took.frag_m6a) { g.objs.push({ kind: 'item', id: 'frag_m6a', x: p.x, y: p.y + 1.2, z: p.z, r: 1 }); g.msg('Синяя клетка: осколок синей сферы!', 2.5); }
      else { g.dropOrbs(p.x, p.y, p.z, 45, 'red'); g.msg('Синяя клетка: красные сферы.', 2); }
    } else if (k === 'yellow') { B.free = true; g.msg('Жёлтая клетка: бросок бесплатно!', 2); later(g, 0.8, () => { if (die) rollDie(g, die); }); }
    else g.msg('Пустая клетка.', 1.5);
    if (!B.done && B.rolls <= 0 && k !== 'yellow') { g.msg('Броски кончились. Игра начинается сначала!', 3); B.rolls = B.max; B.pos = 0; later(g, 1.2, () => { if (!g.fight) { const [x, z] = squarePos(B, 0); p.x = x; p.z = z; p.y = 0.3; const [a, b] = squarePos(B, 0); die.x = a * 0.72; die.z = b * 0.72; g.ev({ t: 'flash', c: [1, 1, 1], a: 0.6 }); } else B.resetAfterFight = true; }); }
  }
  function later(g, t, fn) { (g.timers || (g.timers = [])).push({ t, fn }); }

  function woodsDoor(g, d) {
    const W = g.woods, dir = d.woods;
    if (g.fight) return;
    if (dir === 's') { if (W.step === 0) { g.goDoor(d.to); return; } W.step = 0; g.msg('Туман сгущается... Вы снова у камня.', 3); g.goDoor('lostwoods:start', 'fog'); return; }
    if (W.trapT) { W.trapT = false; W.step = 0; g.msg('Туман сгущается... Вы снова у камня.', 3); g.goDoor('lostwoods:start', 'fog'); return; }
    if (dir === W.seq[W.step]) {
      W.step++;
      if (W.step >= W.seq.length) { g.goDoor(W.to, 'fog'); return; }
      g.msg('Туман расступается...', 2.5); g.goDoor('lostwoods:start', 'fog'); return;
    }
    if (W.step === W.trap[0] && dir === W.trap[1] && !g.save.took[W.frag] && !W.trapDone) { W.trapT = true; g.msg('Засада!', 2); g.goDoor('lostwoods:start', 'fog'); return; }
    W.step = 0; g.msg('Туман сгущается... Вы снова у камня.', 3); g.goDoor('lostwoods:start', 'fog');
  }

  function initSpecial(g, sp) {
    switch (sp.kind) {
      case 'boss': g.objs.push({ kind: 'bossZone', sp }); break;
      case 'hint': g.objs.push({ kind: 'hint', sp, seen: false }); break;
      case 'gyroMachine': g.objs.push({ kind: 'gyroMachine', x: sp.x, y: 0, z: sp.z, face: sp.face, out: sp.out }); break;
      case 'socket': g.objs.push({ kind: 'socket', id: sp.id, x: sp.x, y: 0, z: sp.z, filled: !!g.flags['sock_' + sp.id] }); break;
      case 'cannon': if (!g.flags[sp.flag]) g.objs.push({ kind: 'cannon', x: sp.x, y: 0, z: sp.z, face: sp.face, every: sp.every, speed: sp.speed, dmg: sp.dmg, hp: sp.hp, flag: sp.flag, r: 1.2, t: 1.5 }); break;
      case 'board': {
        if (!g.board) g.board = { r: sp.r, kinds: sp.kinds, rolls: sp.rolls, max: sp.rolls, frag: sp.frag, flag: sp.flag, pos: 0, fights: 0, done: !!g.flags[sp.flag] };
        const B = g.board; B.busy = false; B.hop = null;
        const [x, z] = squarePos(B, B.pos);
        g.objs.push({ kind: 'die', x: x * 0.72, y: 1.5, z: z * 0.72, r: 1, rolling: 0 });
        g.objs.push({ kind: 'boardVis' });
        break;
      }
      case 'woods': {
        if (!g.woods) g.woods = { seq: sp.seq, trap: sp.trap, frag: sp.frag, to: sp.to, step: 0 };
        const W = g.woods;
        g.woodsHint = W.trapT ? null : W.seq[W.step];
        if (W.trapT && !W.trapDone) {
          const f = { id: 'woodsTrap', zone: [-16, -16, 16, 16], waves: [[{ type: 'assault', x: -6, z: 6 }, { type: 'assault', x: 6, z: 6 }, { type: 'assault', x: 0, z: 10 }]], seal: true };
          g.extraFights.push(f);
          later(g, 0.6, () => { g.startFight('woodsTrap'); });
          g.objs.push({ kind: 'item', id: W.frag, x: 0, y: 1.2, z: 2, r: 1 });
        }
        break;
      }
      default: break;
    }
  }

  function updateObjects(g) {
    const p = g.player;
    if (g.timers) { for (const t of g.timers) { t.t -= DT; if (t.t <= 0 && !t.done) { t.done = true; t.fn(); } } g.timers = g.timers.filter(t => !t.done); }
    g.nearStatue = null;
    for (const o of g.objs) {
      if (o.dead) continue;
      switch (o.kind) {
        case 'cluster': if (Math.hypot(p.x - o.x, p.y + 1 - o.y, p.z - o.z) < 1.5) { o.dead = true; g.aState(g.areaId).orbs[o.i] = true; g.dropOrbs(o.x, o.y - 0.5, o.z, o.n * 10, 'red'); g.sfx('orbbig', o.x, o.y, o.z); } break;
        case 'item': if (Math.hypot(p.x - o.x, p.z - o.z) < 1.9 && Math.abs(p.y + 1 - o.y) < 1.8) collectItem(g, o); break;
        case 'statue': if (Math.hypot(p.x - o.x, p.z - o.z) < 2.8 && !g.fight && !g.boss) g.nearStatue = o; break;
        case 'gyro': {
          o.spin += DT * (o.moving ? 30 : 12); o.t += DT;
          if (!o.moving) break;
          const ox = o.x, oz = o.z; o.x += o.vx * DT; o.z += o.vz * DT;
          const probe = { x: o.x, z: o.z, y: 0, r: 0.5, h: 1.2 }; g.W.collide(probe);
          for (const s of g.objs) if (s.kind === 'socket' && !s.filled && Math.hypot(s.x - o.x, s.z - o.z) < 1.2) {
            s.filled = true; g.flags['sock_' + s.id] = true; o.dead = true; g.sfx('socket', s.x, 0, s.z); g.ev({ t: 'hit', x: s.x, y: 0.5, z: s.z, kind: 'spark', big: true });
            const all = g.objs.filter(q => q.kind === 'socket'); if (all.every(q => q.filled)) { g.flags.hallGate = true; for (const b of g.barriers) if (b.bar.flag === 'hallGate') b.on = false; g.msg('Оба гнезда заполнены. Решётка поднята!', 3.5); g.sfx('machine'); }
            else g.msg('Гнездо заполнено. Осталось ещё одно.', 2.5);
          }
          if (o.dead) break;
          if (Math.abs(probe.x - o.x) > 0.01 || Math.abs(probe.z - o.z) > 0.01) { o.dead = true; g.ev({ t: 'hit', x: ox, y: 0.6, z: oz, kind: 'metal', big: true }); g.sfx('clang', ox, 0.6, oz); break; }
          for (const e of g.foes) if (!e.dead && !e.spawnT && Math.hypot(e.x - o.x, e.z - o.z) < e.r + 0.9 && !(o.hitIds || (o.hitIds = new Set())).has(e.id)) { o.hitIds.add(e.id); S.hitFoe(g, e, { dmg: 70, knock: true, kb: 7, up: 3, key: 'gyro', raw: true, fromX: ox, fromZ: oz }); g.styleHit('gyro', 40, false); }
          if (Math.hypot(p.x - o.x, p.z - o.z) < 0.9 && o.t > 0.4) { S.hurtPlayer(g, 8, o, { kb: 5 }); }
          break;
        }
        case 'cannon': {
          o.flash = Math.max(0, (o.flash || 0) - DT);
          o.t -= DT;
          if (o.t <= 0 && p.z < o.z - 2 && Math.abs(p.x) < 3.5) { o.t = o.every; g.shots.push({ kind: 'fireball', team: 'foe', x: o.x, y: 1.3, z: o.z - 2.2, vx: 0, vy: 0, vz: -o.speed, life: 6, r: 0.7, dmg: o.dmg }); g.sfx('cannon', o.x, 1.3, o.z); g.ev({ t: 'muzzle', x: o.x, y: 1.3, z: o.z - 2.4, big: true }); }
          break;
        }
        case 'die': {
          if (o.rolling > 0) { o.rolling -= DT; if (o.rolling <= 0) { const B = g.board; g.msg('Выпало: ' + B.result, 1.5); B.left = B.result; const [x, z] = squarePos(B, B.pos + 1); p.st = 'board'; p.special = 'hop'; p.mt = 0; B.hop = { t: 0, x0: p.x, z0: p.z, x1: x, z1: z }; g.sfx('jump', p.x, p.y, p.z); } }
          break;
        }
        default: break;
      }
    }
    g.objs = g.objs.filter(o => !o.dead || o.kind === 'cannon');
    if (g.board && g.board.resetAfterFight && !g.fight) { const B = g.board; B.resetAfterFight = false; const [x, z] = squarePos(B, 0); p.x = x; p.z = z; p.y = 0.3; const die = g.objs.find(o => o.kind === 'die'); if (die) { die.x = x * 0.72; die.z = z * 0.72; } }
  }

  function collectItem(g, o) {
    o.dead = true;
    const as = g.aState(g.areaId); as.items[o.id] = true;
    if (o.id.startsWith('frag')) {
      g.save.took[o.id] = true; g.save.frags++;
      const full = g.save.frags % 4 === 0;
      if (full) { g.player.hp = g.maxHp; g.msg('Синяя сфера собрана! Здоровье +10.', 3.5); g.sfx('fanfare'); }
      else g.msg(`Осколок синей сферы (${g.save.frags % 4}/4)`, 3);
      g.sfx('frag', o.x, o.y, o.z);
      if (g.woods && o.id === g.woods.frag) g.woods.trapDone = true;
      return;
    }
    g.flags[o.id] = true; g.sfx('keyitem', o.x, o.y, o.z);
    g.hook('item_' + o.id);
  }

  function inZone(p, z) { return p.x >= z[0] && p.x <= z[2] && p.z >= z[1] && p.z <= z[3]; }
  function updateTriggers(g) {
    const p = g.player;
    if (!g.fight) for (const f of g.def.fights) {
      if ((f.auto === false && !g.flags['started_' + f.id]) || g.aState(g.areaId).fights[f.id]) continue;
      if (inZone(p, f.zone)) { g.startFight(f.id); break; }
    }
    for (const o of g.objs) {
      if (o.kind === 'bossZone' && !o.started) {
        const sp = o.sp;
        if (g.flags['boss_' + sp.id]) { o.started = true; continue; }
        if (sp.auto ? g.flags.introDone : inZone(p, sp.zone)) {
          o.started = true;
          const go = () => S.startBoss(g, sp.id, sp);
          if (sp.cut && !g.flags['seen_' + sp.cut]) { g.flags['seen_' + sp.cut] = true; g.startCut(sp.cut, go); } else go();
        }
      }
      if (o.kind === 'hint' && !o.seen) {
        const sp = o.sp;
        if ((sp.need && !g.flags[sp.need]) || (sp.unless && g.flags[sp.unless])) continue;
        if (inZone(p, sp.zone)) { o.seen = true; g.msg(sp.text, 6, 'tip'); }
      }
    }
    const hz = p.ground ? inHazard(g, p.x, p.z) : null;
    if (hz) { g.hazT -= DT; if (g.hazT <= 0) { g.hazT = 0.5; S.hurtPlayer(g, hz.dps * 0.5, null, { kind: 'fire' }); if (p.st === 'hurt') p.st = 'move'; g.ev({ t: 'hit', x: p.x, y: p.y + 0.3, z: p.z, kind: 'fire' }); } }
    else g.hazT = 0;
  }

  S.foeShot = foeShot; S.meteor = meteor; S.spearRain = spearRain; S.fireWave = fireWave; S.updateShots = updateShots; S.explode = explode;
  S.swordObjects = swordObjects; S.shootObjects = shootObjects; S.inHazard = inHazard; S.throwHeld = throwHeld; S.dropHeld = dropHeld;
  S.spawnGyro = spawnGyro; S.boardHop = boardHop; S.squarePos = squarePos; S.woodsDoor = woodsDoor; S.initSpecial = initSpecial;
  S.updateObjects = updateObjects; S.updateTriggers = updateTriggers; S.later = later;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
