(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const G = Z.Game.prototype;
  const esc = s => Z.esc(s);

  G.vatsTargets = function () {
    const p = this.player, wd = p.weapon();
    const melee = wd.wtype === 'melee' || wd.wtype === 'unarmed';
    const maxD = melee ? 6 : wd.thrown ? 30 : Math.max(30, (wd.range || 40) * 1.8);
    const eye = this.eyeOf(p);
    const out = [];
    for (const a of this.cell.actors) {
      if (a === p || a.dead || a.hidden || a.companion) continue;
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d > maxD) continue;
      const ang = Math.abs(Z.angDiff(p.yaw, Z.yawOf(a.x - p.x, a.z - p.z)));
      if (ang > 1.1) continue;
      if (!this.cell.cw.los(eye[0], eye[1], eye[2], a.x, a.y + (a.height || 1.8) * 0.6, a.z)) continue;
      out.push({ a, d, ang, hostile: this.hostileToPlayer(a) });
    }
    out.sort((x, y) => (y.hostile - x.hostile) || (x.ang + x.d * 0.01) - (y.ang + y.d * 0.01));
    return out;
  };

  G.vatsChance = function (a, part) {
    const p = this.player, wd = p.weapon();
    const d = Math.hypot(a.x - p.x, a.z - p.z);
    const melee = wd.wtype === 'melee' || wd.wtype === 'unarmed';
    if (melee) return d <= (wd.range || 1.6) * 2.4 + (a.radius || 0.35) ? Z.clamp(0.95 * (part.vats + 0.25), 0.05, 0.95) : 0;
    const skill = p.sheet.skill(wd.skill || 'guns');
    const range = wd.range || 40;
    const distF = Z.clamp(1 - Math.max(0, d - range * 0.3) / (range * 1.5), 0.05, 1);
    let ch = (0.35 + skill / 100 * 0.6 + (p.sheet.stat('per') - 5) * 0.02) * distF * part.vats;
    if (p.sheet.has('voroshilov') && !wd.twoHand && wd.wtype !== 'throw') ch *= 1.25;
    if (p.sheet.has('stormtrooper') && wd.twoHand) ch *= 1.25;
    if (p.sheet.has('sniper') && part.id === 'head') ch *= 1.25;
    if (p.crippled.rarm || p.crippled.larm) ch *= 0.8;
    if (a.big) ch *= 1.2;
    if (a.cdef && a.cdef.flying) ch *= 0.8;
    if (a.underground) ch = 0;
    return Z.clamp(ch, 0.02, 0.95);
  };

  G.partPos = function (a, part) {
    const P = a.pose;
    if (P && P.def.index.head !== undefined && !a.cdef || P && a.cdef && a.cdef.rig === 'human') {
      const m = { head: 'head', torso: 'chest', larm: 'lfarm', rarm: 'rfarm', lleg: 'lshin', rleg: 'rshin', filter: 'chest' }[part.id];
      if (m && P.def.index[m] !== undefined) { const p = P.bonePos(m); return part.id === 'filter' ? [p[0] + Math.sin(a.yaw) * 0.22, p[1] - 0.05, p[2] - Math.cos(a.yaw) * 0.22] : p; }
    }
    const h = a.height || 1.8, f = (part.y0 + part.y1) / 2;
    const side = part.side || 0, rx = Math.cos(a.yaw), rz = Math.sin(a.yaw);
    const fwd = part.front ? 0.35 : 0;
    return [a.x + rx * side * (a.radius || 0.35) * 0.6 + Math.sin(a.yaw) * fwd * (a.radius || 0.35) * 2, a.y + h * f, a.z + rz * side * (a.radius || 0.35) * 0.6 - Math.cos(a.yaw) * fwd * (a.radius || 0.35) * 2];
  };

  U.startVats = function () {
    const g = this.game, p = g.player;
    const wd = p.weapon();
    if (p.swim) return;
    if (wd.mag && p.equip.weapon && (p.equip.weapon.loaded || 0) <= 0 && p.count(wd.ammo) <= 0) { g.msg('Нет патронов.', 'warn'); return; }
    const targets = g.vatsTargets();
    if (!targets.length) { g.msg('С.Т.Р.Е.Л.А.: целей не обнаружено.', 'warn'); if (this.audio) this.audio.uiSound('vatsNo'); return; }
    if (p.ap < wd.ap) { g.msg('С.Т.Р.Е.Л.А.: не хватает очков действия.', 'warn'); return; }
    const v = this.vats = { targets, ti: 0, pi: 0, queue: [], phase: 'select', camT: 0 };
    g.paused = true;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.mode = 'vats';
    const el = document.createElement('div');
    el.className = 'zp-talk';
    el.style.pointerEvents = 'auto';
    el.innerHTML = '<div class="npc zp-crt" style="width:min(520px,90%)"><div class="who">С.Т.Р.Е.Л.А.</div><div class="txt"></div></div><div class="opts zp-crt" style="width:min(520px,90%)"><div class="list"></div><div class="hint">←→ цель · ↑↓ часть тела · E — выстрел в очередь · Backspace — убрать · Enter — огонь · V — выход</div></div>';
    el.addEventListener('mousedown', e => e.stopPropagation());
    this.layer.appendChild(el);
    v.el = el;
    if (this.audio) this.audio.uiSound('vatsOn');
    this.vatsRender();
  };

  U.vatsCost = function () {
    const p = this.game.player, wd = p.weapon();
    return Math.round(wd.ap * (p.sheet.traits.includes('fastshot') ? 0.85 : 1));
  };

  U.vatsRender = function () {
    const v = this.vats, g = this.game, p = g.player;
    if (!v || !v.el) return;
    const t = v.targets[v.ti];
    if (!t) return;
    const parts = g.partsOf(t.a);
    v.pi = Z.clamp(v.pi, 0, parts.length - 1);
    const cost = this.vatsCost();
    const used = v.queue.length * cost;
    const anat = p.sheet.has('anatomy');
    v.el.querySelector('.txt').innerHTML = esc(t.a.name) + ' · ' + Math.round(t.d) + ' м' + (anat || t.hostile ? ' · ОЗ ' + Math.ceil(t.a.hp) + '/' + t.a.hpMax : '') + (anat ? ' · ПУ ' + Math.round(t.a.dt()) : '') + '<br>ОД: ' + Math.floor(p.ap - used) + ' / ' + p.sheet.maxAP() + ' · выстрел: ' + cost + ' ОД · в очереди: ' + v.queue.length;
    v.el.querySelector('.list').innerHTML = parts.map((pt, i) => {
      const ch = Math.round(g.vatsChance(t.a, pt) * 100);
      const q = v.queue.filter(x => x.a === t.a && x.part.id === pt.id).length;
      const crip = t.a.crippled && t.a.crippled[pt.id];
      return '<div class="row' + (i === v.pi ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(pt.name) + (crip ? ' <span class="dim">(покалечено)</span>' : '') + (q ? ' ×' + q : '') + '</span><span class="num">' + ch + '%</span></div>';
    }).join('');
    v.el.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (v.pi === +r.dataset.i) return; v.pi = +r.dataset.i; this.vatsRender(); }); r.addEventListener('click', () => { v.pi = +r.dataset.i; this.vatsQueue(); }); });
  };

  U.vatsQueue = function () {
    const v = this.vats, g = this.game, p = g.player, wd = p.weapon();
    const t = v.targets[v.ti];
    const cost = this.vatsCost();
    if (p.ap - (v.queue.length + 1) * cost < -0.01) { if (this.audio) this.audio.uiSound('vatsNo'); return; }
    if (wd.mag && p.equip.weapon) { const shots = v.queue.length + 1; if ((p.equip.weapon.loaded || 0) + p.count(wd.ammo) < shots) return; }
    if (wd.thrown && p.count(p.equip.weapon.id) < v.queue.length + 1) return;
    const part = g.partsOf(t.a)[v.pi];
    if (g.vatsChance(t.a, part) <= 0) return;
    v.queue.push({ a: t.a, part });
    if (this.audio) this.audio.uiSound('vatsQ');
    this.vatsRender();
  };

  U.vatsKey = function (e) {
    const v = this.vats;
    if (!v || v.phase !== 'select') return false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { v.ti = (v.ti + v.targets.length - 1) % v.targets.length; v.pi = 0; this.vatsRender(); return true; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { v.ti = (v.ti + 1) % v.targets.length; v.pi = 0; this.vatsRender(); return true; }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { v.pi--; this.vatsRender(); return true; }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { v.pi++; this.vatsRender(); return true; }
    if (e.code === 'KeyE') { this.vatsQueue(); return true; }
    if (e.code === 'Backspace') { v.queue.pop(); this.vatsRender(); return true; }
    if (e.code === 'Enter' || e.code === 'Space') { if (!v.queue.length) this.vatsQueue(); this.vatsExecute(); return true; }
    if (e.code === 'KeyV' || e.code === 'Escape') { this.vatsEnd(); return true; }
    return false;
  };

  U.vatsExecute = function () {
    const v = this.vats, g = this.game;
    if (!v.queue.length) { this.vatsEnd(); return; }
    v.phase = 'exec';
    v.el.remove();
    v.el = null;
    g.paused = false;
    g.timeScale = 0.3;
    g.vatsActive = true;
    v.wait = 0.25;
    v.shotI = 0;
    if (this.audio) this.audio.uiSound('vatsGo');
  };

  U.vatsEnd = function () {
    const v = this.vats, g = this.game;
    if (v && v.el) v.el.remove();
    this.vats = null;
    g.paused = false;
    g.timeScale = 1;
    g.vatsActive = false;
    this.mode = 'play';
    this.el.focus({ preventScroll: true });
  };

  U.vatsTick = function (dt) {
    const v = this.vats, g = this.game, p = g.player, c = this.cam;
    if (!v) return;
    const t = v.phase === 'select' ? v.targets[v.ti] && v.targets[v.ti].a : (v.queue[v.shotI] || v.queue[v.queue.length - 1] || {}).a;
    if (t) {
      const tp = g.partPos(t, v.phase === 'select' ? g.partsOf(t)[v.pi] : v.queue[Math.min(v.shotI, v.queue.length - 1)].part);
      const eye = g.eyeOf(p);
      if (v.phase === 'select') {
        const k = Math.min(1, dt * 5);
        const dir = [tp[0] - eye[0], tp[1] - eye[1], tp[2] - eye[2]], L = Math.hypot(...dir);
        c.x = Z.lerp(c.x, eye[0] + dir[0] / L * Math.min(L * 0.55, L - 2.2), k);
        c.y = Z.lerp(c.y, eye[1] + dir[1] / L * Math.min(L * 0.55, L - 2.2), k);
        c.z = Z.lerp(c.z, eye[2] + dir[2] / L * Math.min(L * 0.55, L - 2.2), k);
        c.yaw = Z.yawOf(tp[0] - c.x, tp[2] - c.z);
        c.pitch = Math.atan2(tp[1] - c.y, Math.hypot(tp[0] - c.x, tp[2] - c.z));
        c.fov = 0.7;
        return;
      }
      v.camT += dt;
      const side = Math.cos(p.yaw), sidez = Math.sin(p.yaw);
      const cx = p.x + side * 1.6 - Math.sin(p.yaw) * 1.4, cz = p.z + sidez * 1.6 + Math.cos(p.yaw) * 1.4;
      c.x = Z.lerp(c.x, cx, Math.min(1, dt * 3)); c.y = Z.lerp(c.y, p.y + 1.8, Math.min(1, dt * 3)); c.z = Z.lerp(c.z, cz, Math.min(1, dt * 3));
      const mx = (p.x + tp[0]) / 2, my = (p.y + 1.4 + tp[1]) / 2, mz = (p.z + tp[2]) / 2;
      c.yaw = Z.yawOf(mx - c.x, mz - c.z);
      c.pitch = Math.atan2(my - c.y, Math.hypot(mx - c.x, mz - c.z));
      c.fov = 1.0;
      p.yaw = Z.yawOf(tp[0] - p.x, tp[2] - p.z);
      this.view.yaw = p.yaw;
      p.pitch = Math.atan2(tp[1] - eye[1], Math.hypot(tp[0] - eye[0], tp[2] - eye[2]));
      this.view.pitch = p.pitch;
    }
    if (v.phase !== 'exec') return;
    g.update(dt, null);
    v.wait -= dt * g.timeScale;
    if (v.wait > 0 || !g.canAttack(p)) return;
    const q = v.queue[v.shotI];
    if (!q || p.dead) {
      v.done = (v.done || 0) + dt;
      if (v.done > 0.8 || p.dead) this.vatsEnd();
      return;
    }
    if (q.a.dead) { v.shotI++; return; }
    const wd = p.weapon();
    const tp = g.partPos(q.a, q.part);
    const eye = g.eyeOf(p);
    const hit = g.rng() < g.vatsChance(q.a, q.part);
    let dir = [tp[0] - eye[0], tp[1] - eye[1], tp[2] - eye[2]];
    const L = Math.hypot(...dir);
    dir = dir.map(x => x / L);
    p.ap -= this.vatsCost();
    if (wd.wtype === 'melee' || wd.wtype === 'unarmed') {
      if (hit) g.swing(p, wd, { target: q.a, part: q.part.id, dir }); else { g.swing(p, wd, { dir: [-dir[0], dir[1], -dir[2]] }); }
    } else if (wd.thrown) {
      g.throwItem(p, wd, { dir: g.lobDir(eye, tp, 15), speed: 15 });
    } else {
      const forceHit = hit ? { a: q.a, t: L, x: tp[0], y: tp[1], z: tp[2], part: q.part } : null;
      const mdir = hit ? dir : g.spreadDir(dir, 0.08);
      g.attack(p, { dir: mdir, spread: 0, vats: true, forceTarget: hit, forceHit });
      if (!hit && Math.random() < 0.5) g.msg('Промах.', 'info');
    }
    v.shotI++;
    v.wait = 0.15;
  };

  const baseKey = U.onPanelKey;
  U.onPanelKey = function (e) {
    if (this.mode === 'vats' && this.vatsKey(e)) { e.preventDefault(); return; }
    return baseKey.call(this, e);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
