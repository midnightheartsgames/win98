(function (G) {
  'use strict';
  const { T, clamp, approach, GR, DRAG, SEG } = G;

  function carCircles(c) {
    const m = c.m;
    const r = m.W / 2;
    const span = Math.max(0, m.L / 2 - r);
    const n = span > 0 ? Math.ceil((span * 2) / (m.W * 0.8)) + 1 : 1;
    const fx = Math.cos(c.a), fy = Math.sin(c.a);
    const out = c._circ || (c._circ = []);
    out.length = n;
    for (let k = 0; k < n; k++) {
      const o = n === 1 ? 0 : -span + (2 * span * k) / (n - 1);
      const e = out[k] || (out[k] = { x: 0, y: 0, r, o });
      e.x = c.x + fx * o; e.y = c.y + fy * o; e.r = r; e.o = o;
    }
    return out;
  }

  function carCorners(c, pad) {
    const m = c.m, p = pad || 0;
    const fx = Math.cos(c.a), fy = Math.sin(c.a);
    const hl = m.L / 2 + p, hw = m.W / 2 + p;
    const pts = c._pts || (c._pts = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
    const set = (k, a, b) => { pts[k][0] = c.x + fx * a - fy * b; pts[k][1] = c.y + fy * a + fx * b; };
    set(0, hl, -hw); set(1, hl, hw); set(2, -hl, hw); set(3, -hl, -hw);
    set(4, hl, 0); set(5, -hl, 0); set(6, 0, hw); set(7, 0, -hw);
    return pts;
  }

  function localOf(c, px, py) {
    const fx = Math.cos(c.a), fy = Math.sin(c.a);
    const dx = px - c.x, dy = py - c.y;
    return [dx * fx + dy * fy, -dx * fy + dy * fx];
  }

  function insideCar(c, px, py, pad) {
    const [lx, ly] = localOf(c, px, py);
    return Math.abs(lx) <= c.m.L / 2 + (pad || 0) && Math.abs(ly) <= c.m.W / 2 + (pad || 0);
  }

  const Phys = {
    stepCar(c, dt) {
      const m = c.m;
      const ctl = c.ctl;
      const city = this.city;
      let fx = Math.cos(c.a), fy = Math.sin(c.a);
      let fwd = c.vx * fx + c.vy * fy;
      let lat = -c.vx * fy + c.vy * fx;
      const g = city.surfAt(c.x, c.y);
      let surf = m.boat ? 1 : DRAG[g] || 1;
      if (m.offroad) surf = 1 + (surf - 1) * 0.35;
      const broken = c.hp < c.maxHp * 0.25 ? 0.72 : 1;
      const live = !c.dead && c.driver && !c.sinking && !c.parkedHold;
      const thr = live ? ctl.thr : 0;
      const steer = live ? ctl.steer : 0;
      const hand = live ? ctl.hand : !c.driver;
      const vmax = m.max * broken * (c.boost || 1);
      if (thr > 0) {
        if (fwd < -8) fwd = Math.min(0, fwd + m.brake * thr * dt);
        else fwd += m.acc * thr * dt * Math.max(0, 1 - (fwd / vmax) * (fwd / vmax)) / Math.sqrt(surf);
      } else if (thr < 0) {
        if (fwd > 8) fwd = Math.max(0, fwd + m.brake * thr * dt);
        else fwd = Math.max(-m.rev, fwd + m.acc * 0.7 * thr * dt);
      } else fwd = approach(fwd, 0, (m.boat ? 30 : 55) * surf * dt);
      fwd -= fwd * 0.12 * surf * dt;
      if (hand && !m.boat) fwd = approach(fwd, 0, (c.driver ? 170 : 400) * dt);
      const sp = Math.abs(fwd);
      const sf = clamp(sp / 70, 0, 1) * Math.sign(fwd || 1);
      const hi = 1 - Math.min(0.4, (sp / m.max) * 0.4);
      c.a += (m.turn * steer * sf * hi * (hand ? 1.45 : 1)) * dt + c.av * dt;
      c.av *= Math.exp(-5 * dt);
      const grip = m.grip * (hand ? 0.14 : 1) * (g === GR.SAND || g === GR.GRASS ? 0.7 : 1);
      lat *= Math.max(0, 1 - grip * dt);
      fx = Math.cos(c.a); fy = Math.sin(c.a);
      c.vx = fx * fwd - fy * lat;
      c.vy = fy * fwd + fx * lat;
      c.fwd = fwd; c.lat = lat;
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (!m.boat && sp > 40 && (Math.abs(lat) > 55 || (thr < 0 && fwd > 120))) {
        c.skidT = (c.skidT || 0) + dt;
        if (c.skidT > 0.05) { c.skidT = 0; this.skid(c); }
        c.skidding = true;
      } else c.skidding = false;
      this.carVsWorld(c);
      if (!m.boat && city.surfAt(c.x, c.y) === GR.WATER && !c.dead) {
        c.sinking = (c.sinking || 0) + dt;
        c.vx *= 0.9; c.vy *= 0.9;
        if (c.sinking > 0.05 && !c.splashed) { c.splashed = true; this.event('splash', c.x, c.y); }
        if (c.sinking > 1.4) this.sinkCar(c);
      }
    },

    carVsWorld(c) {
      const city = this.city;
      const mask = c.m.boat ? (SEG.WATER | SEG.EDGE | SEG.FENCE | SEG.BUILDING) : (SEG.BUILDING | SEG.FENCE | SEG.WATER | SEG.EDGE);
      const circ = carCircles(c);
      let px = 0, py = 0, best = 0, nx = 0, ny = 0, hx = 0, hy = 0;
      const o = this._col || (this._col = { x: 0, y: 0, nx: 0, ny: 0, pen: 0, hit: 0 });
      for (const ci of circ) {
        city.collide(ci.x, ci.y, ci.r, mask, o);
        if (!o.hit) continue;
        if (Math.abs(o.x) > Math.abs(px)) px = o.x;
        if (Math.abs(o.y) > Math.abs(py)) py = o.y;
        if (o.pen > best) { best = o.pen; nx = o.nx; ny = o.ny; hx = ci.x; hy = ci.y; }
      }
      if (!best) return;
      px = clamp(px, -14, 14); py = clamp(py, -14, 14);
      c.x += px; c.y += py;
      const vn = c.vx * nx + c.vy * ny;
      if (vn < 0) {
        const e = c.m.boat ? 0.2 : 0.28;
        c.vx -= (1 + e) * vn * nx;
        c.vy -= (1 + e) * vn * ny;
        c.vx *= 0.92; c.vy *= 0.92;
        const rx = hx - c.x, ry = hy - c.y;
        c.av += clamp((rx * ny - ry * nx) * -vn * 0.0009 / Math.max(0.5, c.m.mass), -4, 4);
        if (-vn > 70) this.carDamage(c, (-vn - 70) * 0.12 / Math.sqrt(c.m.mass), null, 'wall');
        if (-vn > 45) this.event('crash', hx - nx * 10, hy - ny * 10, { v: -vn, car: c });
      }
      if (!c.m.boat && city.solidAt(c.x, c.y)) {
        const t = city.nearestPoint(c.x, c.y, (x, y) => !city.solidAt(x, y), 120);
        if (t) { c.x = t[0]; c.y = t[1]; c.vx *= 0.3; c.vy *= 0.3; }
      }
    },

    carVsCar(a, b) {
      const A = carCircles(a), B = carCircles(b);
      let best = null;
      for (const p of A) for (const q of B) {
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy, rr = p.r + q.r;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.01;
        const pen = rr - d;
        if (!best || pen > best.pen) best = { pen, nx: dx / d, ny: dy / d, px: (p.x + q.x) / 2, py: (p.y + q.y) / 2 };
      }
      if (!best) return;
      const ma = a.m.mass * (a.parked && !a.driver ? 1.6 : 1), mb = b.m.mass * (b.parked && !b.driver ? 1.6 : 1);
      const ia = 1 / ma, ib = 1 / mb, s = ia + ib;
      const { nx, ny, pen } = best;
      a.x += nx * pen * (ia / s); a.y += ny * pen * (ia / s);
      b.x -= nx * pen * (ib / s); b.y -= ny * pen * (ib / s);
      const rvx = a.vx - b.vx, rvy = a.vy - b.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn >= 0) return;
      const j = -(1.3) * vn / s;
      a.vx += j * nx * ia; a.vy += j * ny * ia;
      b.vx -= j * nx * ib; b.vy -= j * ny * ib;
      const rax = best.px - a.x, ray = best.py - a.y, rbx = best.px - b.x, rby = best.py - b.y;
      a.av += clamp((rax * ny - ray * nx) * j * ia * 0.0011, -5, 5);
      b.av -= clamp((rbx * ny - rby * nx) * j * ib * 0.0011, -5, 5);
      const imp = -vn;
      if (imp > 60) {
        const base = (imp - 60) * 0.1;
        this.carDamage(a, base * (mb / ma) * (b.m.tank ? 4 : 1) * (a.m.armored ? 0.8 : 1), b.driver, 'car');
        this.carDamage(b, base * (ma / mb) * (a.m.tank ? 4 : 1) * (b.m.armored ? 0.8 : 1), a.driver, 'car');
        this.event('crash', best.px, best.py, { v: imp, car: a, other: b });
        this.onCarsCollide(a, b, imp);
      }
    },

    carVsPed(c, p) {
      if (p.car || p.invisible || (p.dead && p.deadT > 0.3)) return;
      const [lx, ly] = localOf(c, p.x, p.y);
      const hl = c.m.L / 2 + 5, hw = c.m.W / 2 + 5;
      if (Math.abs(lx) > hl || Math.abs(ly) > hw) return;
      const sp = Math.hypot(c.vx, c.vy);
      if (p.dead) { if (sp > 40 && !p.squashed) { p.squashed = true; this.blood(p.x, p.y, 1.2); } return; }
      const fx = Math.cos(c.a), fy = Math.sin(c.a);
      const penX = hl - Math.abs(lx), penY = hw - Math.abs(ly);
      let nx, ny;
      if (penX < penY) { const s = Math.sign(lx) || 1; nx = fx * s; ny = fy * s; }
      else { const s = Math.sign(ly) || 1; nx = -fy * s; ny = fx * s; }
      const pen = Math.min(penX, penY);
      p.x += nx * pen; p.y += ny * pen;
      const rel = c.vx * nx + c.vy * ny;
      if (sp > 55 && rel < -30 || sp > 90) {
        if (p.hitCd > 0) return;
        p.hitCd = 0.5;
        const dmg = (sp - 30) * (c.m.mass > 2 ? 0.8 : 0.45);
        p.vx = c.vx * 0.7 + nx * 60; p.vy = c.vy * 0.7 + ny * 60;
        this.pedDamage(p, dmg, c.driver, 'car', c);
        if (!p.dead) { p.down = 1.1; }
        this.event('thud', p.x, p.y, { v: sp });
        c.vx *= 0.97; c.vy *= 0.97;
      }
    },

    stepPed(p, dt) {
      const r = 5;
      const city = this.city;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const o = this._pcol || (this._pcol = { x: 0, y: 0, nx: 0, ny: 0, pen: 0, hit: 0 });
      city.collide(p.x, p.y, r, SEG.BUILDING | SEG.FENCE | SEG.WATER | SEG.EDGE, o);
      if (o.hit) {
        p.x += o.x; p.y += o.y;
        if (Math.abs(o.nx) > 0.5) { p.blockedX = true; }
        if (Math.abs(o.ny) > 0.5) { p.blockedY = true; }
        const vn = p.vx * o.nx + p.vy * o.ny;
        if (vn < 0) { p.vx -= vn * o.nx; p.vy -= vn * o.ny; }
      }
      if (city.solidAt(p.x, p.y) || !city.playAt(p.x, p.y)) this.unstickPed(p);
      if (p.down > 0 || p.dead) { p.vx *= Math.exp(-6 * dt); p.vy *= Math.exp(-6 * dt); }
      const buf = this._ppb || (this._ppb = []);
      for (const k of city.propsNear(p.x, p.y, 16, buf)) {
        const pr = city.props[k];
        if (pr.type !== 'tree' && pr.type !== 'lamp') continue;
        const rr = pr.type === 'tree' ? 7 : 4;
        const dx = p.x - pr.x, dy = p.y - pr.y, d = Math.hypot(dx, dy);
        if (d < rr && d > 0.01) { p.x = pr.x + dx / d * rr; p.y = pr.y + dy / d * rr; }
      }
    },

    unstickPed(p) {
      const city = this.city;
      const t = city.nearestPoint(p.x, p.y, (x, y) => city.walkable(x, y), 160);
      if (t) { p.x = t[0]; p.y = t[1]; }
    },

    carVsProps(c) {
      if (c.m.boat) return;
      const city = this.city;
      const buf = this._cpb || (this._cpb = []);
      for (const k of city.propsNear(c.x, c.y, c.m.L + 100, buf)) {
        const pr = city.props[k];
        if (pr.down) continue;
        if (pr.type === 'kiosk' || pr.type === 'stallrow') { this.carVsStall(c, pr); continue; }
        if (pr.type !== 'tree' && pr.type !== 'lamp' && pr.type !== 'signal') continue;
        for (const ci of carCircles(c)) {
          const ddx = ci.x - pr.x, ddy = ci.y - pr.y, d = Math.hypot(ddx, ddy);
          const rr = ci.r + (pr.type === 'tree' ? 5 : 2);
          if (d >= rr) continue;
          const sp = Math.hypot(c.vx, c.vy);
          if (pr.type !== 'tree' && (sp > 40 || d < 0.5) || c.m.tank) { pr.down = true; pr.downA = sp > 1 ? Math.atan2(c.vy, c.vx) : c.a; this.event('crash', pr.x, pr.y, { v: 60 }); continue; }
          if (d < 0.01) continue;
          const nx = ddx / d, ny = ddy / d;
          c.x += nx * (rr - d); c.y += ny * (rr - d);
          const vn = c.vx * nx + c.vy * ny;
          if (vn < 0) { c.vx -= 1.3 * vn * nx; c.vy -= 1.3 * vn * ny; if (-vn > 80) { this.carDamage(c, (-vn - 80) * 0.12, null, 'wall'); this.event('crash', pr.x, pr.y, { v: -vn }); } }
          break;
        }
      }
    }
  };

  Phys.carVsStall = function (c, pr) {
    const ca = Math.cos(pr.a || 0), sa = Math.sin(pr.a || 0), hw = pr.w / 2, hd = pr.d / 2;
    for (const ci of carCircles(c)) {
      const dx = ci.x - pr.x, dy = ci.y - pr.y;
      const lu = dx * ca + dy * sa, lv = -dx * sa + dy * ca;
      const qu = Math.max(-hw, Math.min(hw, lu)), qv = Math.max(-hd, Math.min(hd, lv));
      let nu = lu - qu, nv = lv - qv, d = Math.hypot(nu, nv);
      if (d >= ci.r) continue;
      const sp = Math.hypot(c.vx, c.vy);
      if (sp > 130 || c.m.tank) { pr.down = true; pr.downA = Math.atan2(c.vy, c.vx); c.vx *= 0.82; c.vy *= 0.82; this.carDamage(c, 6, null, 'wall'); this.event('crash', pr.x, pr.y, { v: sp }); return; }
      if (d < 0.01) { if (hw - Math.abs(lu) < hd - Math.abs(lv)) { nu = Math.sign(lu) || 1; nv = 0; } else { nu = 0; nv = Math.sign(lv) || 1; } d = 0; }
      else { nu /= d; nv /= d; }
      const nx = nu * ca - nv * sa, ny = nu * sa + nv * ca, push = ci.r - d;
      c.x += nx * push; c.y += ny * push;
      const vn = c.vx * nx + c.vy * ny;
      if (vn < 0) { c.vx -= 1.3 * vn * nx; c.vy -= 1.3 * vn * ny; if (-vn > 80) this.event('crash', pr.x, pr.y, { v: -vn }); }
      return;
    }
  };

  Object.assign(G, { Phys, carCircles, carCorners, localOf, insideCar });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
