(function (N) {
  'use strict';

  const GT = N.GT;
  const WX = [-1, 1, -1, 1], WZ = [-1, -1, 1, 1];
  const CLASS = {
    car: { sag: 0.115, bump: 0.12, zeta: 0.3, arb: 0, armR: 0.5, armP: 0.8, peak: 0.1, fall: 0.075, air: 1 },
    high: { sag: 0.135, bump: 0.16, zeta: 0.3, arb: 0, armR: 0.6, armP: 0.8, peak: 0.11, fall: 0.07, air: 0.8 },
    truck: { sag: 0.085, bump: 0.11, zeta: 0.36, arb: 0, armR: 0.8, armP: 0.7, peak: 0.13, fall: 0.06, air: 0.5 },
    bike: { sag: 0.09, bump: 0.1, zeta: 0.4, arb: 0, armR: 0, armP: 0.8, peak: 0.12, fall: 0.06, air: 1.2 },
    apc: { sag: 0.1, bump: 0.13, zeta: 0.42, arb: 0.4, armR: 0.45, armP: 0.65, peak: 0.12, fall: 0.06, air: 0.3 },
    tank: { sag: 0.06, bump: 0.1, zeta: 0.5, arb: 0.6, armR: 0.4, armP: 0.75, peak: 0.1, fall: 0.05, air: 0.2 }
  };
  const DRIVE = { fwd: [0.5, 0.5, 0, 0], rwd: [0, 0, 0.5, 0.5], awd: [0.2, 0.2, 0.3, 0.3], track: [0.25, 0.25, 0.25, 0.25] };

  function surfaceGrip(t) {
    if (t === GT.GRASS || t === GT.FOREST || t === GT.FIELD || t === GT.PITCH) return 0.72;
    if (t === GT.DIRT || t === GT.SAND || t === GT.PATH) return 0.8;
    if (t === GT.RAIL) return 0.85;
    return 1;
  }

  function surfaceDrag(t) {
    if (t === GT.GRASS || t === GT.FOREST || t === GT.FIELD || t === GT.PITCH) return 1.6;
    if (t === GT.DIRT || t === GT.SAND || t === GT.PATH) return 0.9;
    return 0.25;
  }

  function classOf(s) {
    if (s.type === 'bike') return s.shape.sidecar ? 'car' : 'bike';
    if (s.type === 'tank' || s.type === 'apc') return s.type;
    if (s.type === 'truck' || s.type === 'bus') return 'truck';
    const b = s.shape.body;
    return b === 'suv' || b === 'jeep' || b === 'bread' || b === 'van' ? 'high' : 'car';
  }

  function handling(s) {
    if (s.hd) return s.hd;
    const sh = s.shape, K = CLASS[classOf(s)], o = (N.HANDLING && N.HANDLING[s.id]) || {}, m = s.mass;
    const bike = s.type === 'bike' && !sh.sidecar, track = s.drive === 'track';
    const tw = bike ? 0.36 : sh.sidecar ? sh.sidecar : sh.W * 0.84, wb = sh.wb;
    const h = o.h || (bike ? 0.55 : track ? 1.0 : sh.clr * 0.6 + sh.H * 0.25);
    const sag = K.sag * (o.soft || 1), k = m * N.G / (4 * sag), arb = K.arb + (o.stiff || 0);
    const n = o.gears || 4, vtop = s.vmax * 0.93, gearV = [];
    for (let i = 1; i <= n; i++) gearV.push(vtop * Math.pow(i / n, 0.72));
    const yb = Math.max(0.12, sh.clr * 0.75), yt = sh.H * 0.97, xb = sh.W * 0.46, xt = sh.W * 0.38, zb = sh.L * 0.47;
    let z0 = -sh.L / 2 + (sh.hood || 0) + (sh.ws || 0), z1 = sh.L / 2 - (sh.trunk || 0) - (sh.rw || 0);
    if (z1 - z0 < 0.6) { const zc = (z0 + z1) / 2; z0 = zc - 0.3; z1 = zc + 0.3; }
    const tb = o.tb || 0.5;
    s.hd = {
      bike, track, tw, wb, h, sag, bump: K.bump * (o.soft || 1), k, c: 2 * K.zeta * (o.damp || 1) * Math.sqrt(k * m / 4), karb: k * arb,
      armR: K.armR, armP: K.armP, peak: K.peak, fall: K.fall, air: K.air,
      Iy: s.inertia, Ip: m * (sh.L * sh.L + sh.H * sh.H) / 12, Ir: m * (sh.W * sh.W + sh.H * sh.H) / 12,
      mu: s.grip * 1.15, muF: tb / 0.5, muR: (1 - tb) / 0.5, n0: m * N.G / 4,
      gearV, vtop, kd: 0.00045, shift: s.type === 'car' || s.type === 'bike' ? 0.15 : 0.3, rev: s.vmax * 0.3,
      drive: DRIVE[s.drive] || DRIVE.rwd,
      hull: [[-xb, yb, -zb], [xb, yb, -zb], [-xb, yb, zb], [xb, yb, zb], [-xt, yt, z0], [xt, yt, z0], [-xt, yt, z1], [xt, yt, z1]],
      yc: Math.min(0.55, sh.H * 0.36),
      kinP: h * K.armP * 4 * sag / (N.G * wb * wb), kinR: h * K.armR * 4 * sag / (N.G * tw * tw * (1 + 2 * arb)),
      dmg: o.dmg || 1, rearEngine: o.engine === 'rear'
    };
    return s.hd;
  }

  function tire(x, slide) {
    const a = Math.abs(x), f = a < 1 ? a * (2 - a) : 1 - (1 - slide) * Math.min(1, (a - 1) / 1.8);
    return x < 0 ? -f : f;
  }

  const mkFrame = () => ({ R: new Float64Array(9), cx: 0, cy: 0, cz: 0, px: 0, pz: 0, qx: 0, qy: 0, qz: 0, ox: 0, oy: 0, oz: 0 });
  const FA = mkFrame(), FB = mkFrame();
  const W = { x: new Float64Array(4), y: new Float64Array(4), z: new Float64Array(4), g: new Float64Array(4), d: new Float64Array(4), n: new Float64Array(4) };

  function rot(yaw, pitch, roll, R) {
    const cx = Math.cos(pitch), sx = Math.sin(pitch), cy = Math.cos(yaw), sy = -Math.sin(yaw), cz = Math.cos(roll), sz = Math.sin(roll);
    R[0] = cy * cz + sy * sx * sz; R[1] = -cy * sz + sy * sx * cz; R[2] = sy * cx;
    R[3] = cx * sz; R[4] = cx * cz; R[5] = -sx;
    R[6] = -sy * cz + cy * sx * sz; R[7] = sy * sz + cy * sx * cz; R[8] = cy * cx;
  }

  function spin(v, f) {
    const wp = v.wp || 0, wr = v.wr || 0;
    f.ox = wp * f.px + wr * f.qx;
    f.oy = -v.wz + wr * f.qy;
    f.oz = wp * f.pz + wr * f.qz;
  }

  function frame(v, H, f) {
    rot(v.yaw, v.pitch || 0, v.roll || 0, f.R);
    const R = f.R;
    f.cx = v.x + H.h * R[1]; f.cy = v.y + H.h * R[4]; f.cz = v.z + H.h * R[7];
    f.px = Math.cos(v.yaw); f.pz = Math.sin(v.yaw);
    f.qx = R[2]; f.qy = R[5]; f.qz = R[8];
    spin(v, f);
    return f;
  }

  function invMass(v, H, f, rx, ry, rz, nx, ny, nz, heavy) {
    const cx = ry * nz - rz * ny, cy = rz * nx - rx * nz, cz = rx * ny - ry * nx;
    const b = cx * f.px + cz * f.pz, c = cx * f.qx + cy * f.qy + cz * f.qz;
    return (1 / v.spec.mass + cy * cy / H.Iy + b * b / H.Ip + c * c / H.Ir) / (heavy || 1);
  }

  function push(v, H, f, rx, ry, rz, jx, jy, jz, heavy) {
    const hv = heavy || 1, m = v.spec.mass * hv;
    v.vx += jx / m; v.vy += jy / m; v.vz += jz / m;
    const tx = ry * jz - rz * jy, ty = rz * jx - rx * jz, tz = rx * jy - ry * jx;
    v.wz -= ty / (H.Iy * hv);
    v.wp = (v.wp || 0) + (tx * f.px + tz * f.pz) / (H.Ip * hv);
    v.wr = (v.wr || 0) + (tx * f.qx + ty * f.qy + tz * f.qz) / (H.Ir * hv);
    spin(v, f);
  }

  function touch(v, H, f, rx, ry, rz, depth, mu, e, dt) {
    const vn = v.vy + f.oz * rx - f.ox * rz;
    const want = Math.max(vn < 0 ? -e * vn : 0, Math.min(2.5, Math.max(0, depth - 0.004) * 0.25 / dt));
    if (vn >= want) return 0;
    const j = (want - vn) / invMass(v, H, f, rx, ry, rz, 0, 1, 0);
    push(v, H, f, rx, ry, rz, 0, j, 0);
    if (mu > 0) {
      const tvx = v.vx + f.oy * rz - f.oz * ry, tvz = v.vz + f.ox * ry - f.oy * rx, tl = Math.hypot(tvx, tvz);
      if (tl > 1e-4) {
        const ux = tvx / tl, uz = tvz / tl;
        const jt = Math.min(tl / invMass(v, H, f, rx, ry, rz, ux, 0, uz), mu * j);
        push(v, H, f, rx, ry, rz, -ux * jt, 0, -uz * jt);
      }
    }
    return j;
  }

  function steering(v, s, H, steerIn, vf, vs, hand, alive, dt) {
    if (H.track) { v.steer = 0; return; }
    const lock = Math.min(s.steer / (1 + Math.abs(vf) * H.fall * 0.5), H.wb * H.mu * N.G * 1.05 / Math.max(vf * vf, 1) + H.peak * 1.25);
    let target = steerIn * lock;
    if (alive && vf > 4 && !hand) {
      const half = H.wb / 2, rear = Math.atan2(vs - v.wz * half, vf);
      if (Math.abs(rear) > 0.1) {
        if (Math.abs(steerIn) < 0.1) target = N.clamp(Math.atan2(vs + v.wz * half, vf), -s.steer * 0.8, s.steer * 0.8);
        else if (steerIn * rear > 0) target = Math.sign(steerIn) * Math.min(s.steer * 1.3, Math.max(Math.abs(steerIn) * lock, Math.abs(rear) * (0.8 + 0.4 * Math.abs(steerIn))));
      }
    }
    v.steer = N.approach(v.steer, target, dt * (Math.abs(target) < Math.abs(v.steer) ? 6 : 3.4));
  }

  function gearbox(v, H, vf, thr, burn, dt) {
    const n = H.gearV.length;
    if (!(v.gear >= -1)) v.gear = 1;
    v.shiftT = Math.max(0, (v.shiftT || 0) - dt);
    if (thr < -0.01 && vf < 0.8 && !burn) v.gear = -1;
    else if (v.gear < 1 && (thr > 0.01 || vf > 0.8)) v.gear = 1;
    let rpm;
    if (v.gear >= 1) {
      const sp = Math.max(0, vf);
      if (v.gear < n && sp > H.gearV[v.gear - 1] * 0.97 && thr > 0.01) { v.gear++; v.shiftT = H.shift; }
      while (v.gear > 1 && sp < H.gearV[v.gear - 2] * 0.6) v.gear--;
      rpm = 0.2 + 0.8 * Math.min(1.05, sp / H.gearV[v.gear - 1]);
    } else rpm = 0.2 + 0.8 * Math.min(1, Math.max(0, -vf) / H.rev);
    if (thr > 0.01 && Math.abs(vf) < 3) rpm = Math.max(rpm, 0.3 + 0.35 * thr);
    if (burn || v.spin) rpm = Math.max(rpm, 0.9);
    if (v.shiftT > 0) rpm *= 0.92;
    v.rpm = N.approach(v.rpm || 0.2, rpm, dt * 4);
  }

  function engine(v, s, H, vf, thr, burn) {
    if (v.gear >= 1 && thr > 0.01 && (vf > -0.8 || burn)) {
      const q = Math.max(0, vf) / H.vtop;
      if (q >= 1) return 0;
      return s.mass * s.acc * Math.pow(1 - q * q, 0.8) * thr * (v.damageFactor || 1) * (v.boost || 1) * (v.shiftT > 0 ? 0.4 : 1);
    }
    if (v.gear === -1 && thr < -0.01 && vf < 0.8) return -s.mass * s.acc * 0.55 * -thr * Math.max(0, 1 - Math.max(0, -vf) / H.rev);
    return 0;
  }

  function bikeLean(v, alive, vf, dt) {
    let target = v.roll;
    if (alive) target = N.clamp(-v.wz * Math.abs(vf) * 0.075, -0.75, 0.75);
    else if (Math.hypot(v.vx, v.vz) < 2.5) target = (v.roll < 0 ? -1 : 1) * 1.3;
    v.roll = N.approach(v.roll, target, dt * (alive ? 3.5 : 1.8));
    v.wr = 0;
  }

  function sinkStep(v, wa, dt) {
    v.sink = (v.sink || 0) + dt;
    const k = Math.max(0, 1 - dt * 2.5);
    v.vx *= k; v.vz *= k; v.wz *= k; v.wp *= k; v.wr *= k;
    v.vy = Math.max(v.vy - N.G * dt * 0.4, -1.2);
    v.x += v.vx * dt;
    v.z += v.vz * dt;
    v.y = Math.max(wa.bed, v.y + v.vy * dt);
    v.yaw = N.wrap(v.yaw + v.wz * dt);
    v.pitch = N.approach(v.pitch || 0, -0.3, dt * 0.2);
    v.roll = N.approach(v.roll || 0, 0, dt * 0.3);
    v.spd = v.vx * Math.sin(v.yaw) - v.vz * Math.cos(v.yaw);
    v.air = true;
    v.wheels = 0;
    v.slip = 0;
    v.spin = 0;
    v.wl = wa.level;
  }

  N.Phys = {
    handling,

    stepVehicle(v, city, dt, gripK) {
      const s = v.spec, H = handling(s), c = v.ctl, f = FA, R = f.R, m = s.mass;
      if (v.wp === undefined) { v.wp = 0; v.wr = 0; }
      if (!v.susp) v.susp = [0, 0, 0, 0];
      const surf = city.ground(v.x, v.z);
      const wa = surf === GT.WATER ? city.waterAt(v.x, v.z) : null;
      if (wa && wa.level - v.y > 0.45) { sinkStep(v, wa, dt); return; }
      const gk = gripK || 1;
      const alive = !v.dead && !!v.driver;
      const thr = alive ? c.thr : 0, steerIn = alive ? c.steer : 0;
      const hand = alive ? !!c.hand : !!v.dead;
      const burn = alive && !!c.burn && Math.abs(v.spd) < 4;
      const hx = Math.sin(v.yaw), hz = -Math.cos(v.yaw);
      const vf = v.vx * hx + v.vz * hz, vs = v.vz * hx - v.vx * hz, spd = Math.abs(vf);
      steering(v, s, H, steerIn, vf, vs, hand, alive, dt);
      gearbox(v, H, vf, thr, burn, dt);
      frame(v, H, f);
      const up = R[4];
      let fx = 0, fy = -m * N.G, fz = 0, tx = 0, ty = 0, tz = 0, wheels = 0;
      for (let i = 0; i < 4; i++) {
        const lx = WX[i] * H.tw * 0.5, lz = WZ[i] * H.wb * 0.5;
        const px = v.x + R[0] * lx + R[2] * lz, py = v.y + R[3] * lx + R[5] * lz, pz = v.z + R[6] * lx + R[8] * lz;
        const g = city.groundY(px, pz);
        W.x[i] = px; W.y[i] = py; W.z[i] = pz; W.g[i] = g;
        W.d[i] = up > 0.3 ? (g - py) * up : -9;
      }
      for (let i = 0; i < 4; i++) {
        const d = W.d[i];
        W.n[i] = 0;
        if (d <= -H.sag) { v.susp[i] = -H.sag; continue; }
        wheels++;
        const rx = W.x[i] - f.cx, rz = W.z[i] - f.cz;
        const pvy = v.vy + f.oz * rx - f.ox * rz, dj = W.d[i ^ 1];
        const n = Math.max(0, H.k * (d + H.sag) - H.c * pvy + (dj > -H.sag ? H.karb * (d - dj) : 0));
        W.n[i] = n;
        fy += n;
        tx -= rz * n;
        tz += rx * n;
        v.susp[i] = Math.min(d, H.bump);
      }
      const fe = engine(v, s, H, vf, thr, burn);
      const brk = thr > 0.01 && vf < -0.8 ? thr : thr < -0.01 && vf > 0.8 ? -thr : 0;
      const bt = m * s.brake * 1.12 * brk * gk;
      const grip = surfaceGrip(surf) * gk * (v.popped ? 0.6 : 1), mq = m / 4;
      let slip = 0, spinF = false, spinR = false, lockF = false, lockR = false;
      for (let i = 0; i < 4; i++) {
        const n = W.n[i];
        if (n <= 0) continue;
        const front = i < 2, share = H.drive[i];
        const a = v.yaw + (front ? v.steer : 0), ax = Math.sin(a), az = -Math.cos(a), bx = -az, bz = ax;
        const rx = W.x[i] - f.cx, ry = W.y[i] - f.cy, rz = W.z[i] - f.cz;
        const pvx = v.vx + f.oy * rz - f.oz * ry, pvz = v.vz + f.ox * ry - f.oy * rx;
        const vl = pvx * ax + pvz * az, vt = pvx * bx + pvz * bz;
        const cap = H.mu * (front ? H.muF : H.muR) * grip * N.clamp(1.05 - 0.05 * n / H.n0, 0.9, 1.05) * n;
        let fl, fs;
        if ((hand && !front && !H.track) || (burn && share < 0.25)) {
          const sl = Math.hypot(vl, vt);
          if (sl > 0.4) { const kf = cap * (burn ? 1 : 0.8) / sl; fl = -vl * kf; fs = -vt * kf; }
          else { fl = N.clamp(-vl * mq / dt, -cap, cap); fs = N.clamp(-vt * mq / dt, -cap, cap); }
          if (front) lockF = true; else lockR = true;
          if (sl > 2) slip = Math.max(slip, 0.6);
        } else {
          const drive = fe * share;
          const fb = bt * (front ? 0.31 : 0.19);
          let lon = drive;
          if (fb > 0) lon += Math.abs(vl) > 0.3 ? -Math.sign(vl) * fb : N.clamp(-vl * mq / dt, -fb, fb);
          let over = Math.abs(lon) > cap * 1.15;
          if (burn && drive > 0) { lon = cap * 0.25; over = true; }
          else if (over) lon = Math.sign(lon) * cap * 1.06;
          const al = Math.atan2(vt, Math.max(Math.abs(vl), 2.5));
          fs = H.track ? 0 : -cap * tire(al / H.peak, 0.8) * (over ? 0.72 : 1);
          const e = Math.hypot(drive !== 0 && Math.sign(lon) === Math.sign(drive) ? lon : lon * 0.75, fs) / cap;
          if (e > 1) { lon /= e; fs /= e; }
          fl = lon;
          if (over) {
            slip = Math.max(slip, burn ? 0.7 : 0.55);
            if (drive !== 0 && Math.sign(drive) === Math.sign(lon)) { if (front) spinF = true; else spinR = true; }
            else if (front) lockF = true; else lockR = true;
          }
          if (Math.abs(al) > H.peak) slip = Math.max(slip, Math.abs(al));
        }
        const lx = fl * ax, lz = fl * az, sx = fs * bx, sz = fs * bz;
        fx += lx + sx;
        fz += lz + sz;
        const ra = ry * H.armP, rb = ry * H.armR;
        tx += ra * lz + rb * sz;
        ty += rz * (lx + sx) - rx * (lz + sz);
        tz -= ra * lx + rb * sx;
      }
      if (wheels > 0) {
        const rr = surfaceDrag(surf) + (Math.abs(thr) < 0.05 ? 0.9 : 0);
        const dec = Math.sign(vf) * Math.min(spd / dt, rr) * m * wheels / 4;
        fx -= hx * dec;
        fz -= hz * dec;
        if (wheels > 2) {
          const gp = (W.g[0] + W.g[1] - W.g[2] - W.g[3]) / (2 * H.wb);
          if (Math.abs(W.g[0] - W.g[2] - W.g[1] + W.g[3]) < 0.05 && Math.abs(gp) < 0.4) { fx -= hx * m * N.G * gp; fz -= hz * m * N.G * gp; }
        }
      }
      const hs = Math.hypot(v.vx, v.vz);
      fx -= H.kd * m * hs * v.vx;
      fz -= H.kd * m * hs * v.vz;
      v.vx += fx / m * dt;
      v.vy += fy / m * dt;
      v.vz += fz / m * dt;
      v.wz -= ty / H.Iy * dt;
      v.wp += (tx * f.px + tz * f.pz) / H.Ip * dt;
      v.wr += (tx * f.qx + ty * f.qy + tz * f.qz) / H.Ir * dt;
      if (H.track) {
        if (wheels >= 2) {
          v.wz = N.approach(v.wz, steerIn * s.steer * (vf < -0.5 ? -1 : 1) / (1 + spd * 0.05), dt * 2.2);
          const lat = v.vz * hx - v.vx * hz, k = Math.min(1, dt * 20 * grip);
          v.vx += hz * lat * k;
          v.vz -= hx * lat * k;
          if (Math.abs(steerIn) > 0.1 && Math.abs(thr) < 0.05) { const d = Math.sign(vf) * Math.min(spd, 1.5 * dt); v.vx -= hx * d; v.vz -= hz * d; }
        }
      } else if (wheels >= 2) {
        v.wz *= 1 - dt * 0.3;
        if (hand && alive && spd > 3 && Math.abs(v.wz) < 2) v.wz += steerIn * 2.4 * Math.min(1, spd / 12) * dt;
        const rear = Math.atan2(vs - v.wz * H.wb / 2, Math.max(vf, 0.1));
        if (alive && !hand && vf > 4 && Math.abs(rear) > 0.1) v.wz += (N.clamp(vf * Math.tan(v.steer) / H.wb, -2.2, 2.2) - v.wz) * Math.min(1, dt * (steerIn * rear > 0.01 ? 3 : 1.6));
      }
      if (alive && wheels === 0) {
        if (!(v.hulls > 0)) {
          const k = H.air * dt;
          if (Math.abs(v.wr) < 3) v.wr -= steerIn * 3 * k;
          if (Math.abs(steerIn) < 0.1 && Math.abs(v.roll) < 1) v.wr -= (v.roll * 2.5 + v.wr * 1.6) * k;
          if (Math.abs(v.pitch) < 1) v.wp += ((N.clamp(Math.atan2(v.vy, Math.max(4, hs)) * 0.5, -0.45, 0.3) - v.pitch) * 2.5 - v.wp * 1.6) * k;
        } else if (Math.abs(up) < 0.55 && hs < 2.5 && Math.abs(steerIn) > 0.1) v.wr -= Math.sign(v.roll) * 14 * dt;
      }
      spin(v, f);
      let hulls = 0, hard = 0, land = 0;
      for (let i = 0; i < 4; i++) {
        const over = W.d[i] - H.bump;
        if (over > 0) land = Math.max(land, touch(v, H, f, W.x[i] - f.cx, W.y[i] - f.cy, W.z[i] - f.cz, over, 0, 0.1, dt));
      }
      for (let k = 0; k < H.hull.length; k++) {
        const q = H.hull[k];
        const qx = v.x + R[0] * q[0] + R[1] * q[1] + R[2] * q[2], qy = v.y + R[3] * q[0] + R[4] * q[1] + R[5] * q[2], qz = v.z + R[6] * q[0] + R[7] * q[1] + R[8] * q[2];
        const u = N.clamp(q[0] / H.tw + 0.5, -0.6, 1.6), t = N.clamp(q[2] / H.wb + 0.5, -0.6, 1.6);
        const g0 = W.g[0] + (W.g[1] - W.g[0]) * u, g1 = W.g[2] + (W.g[3] - W.g[2]) * u;
        const depth = g0 + (g1 - g0) * t - qy;
        if (depth <= 0) continue;
        hulls++;
        hard = Math.max(hard, touch(v, H, f, qx - f.cx, qy - f.cy, qz - f.cz, depth, 0.45, 0.15, dt));
      }
      v.hulls = hulls;
      const hit = Math.max(hard, land * 0.5) / m;
      if (hit > (v.hitDv || 0)) v.hitDv = hit;
      if (land / m > (v.landDv || 0)) v.landDv = land / m;
      const ncx = f.cx + v.vx * dt, ncy = f.cy + v.vy * dt, ncz = f.cz + v.vz * dt;
      v.yaw = N.wrap(v.yaw + v.wz * dt);
      v.pitch += v.wp * dt;
      v.roll = N.wrap(v.roll + v.wr * dt);
      if (Math.abs(v.pitch) > Math.PI / 2) { v.yaw = N.wrap(v.yaw + Math.PI); v.pitch = Math.sign(v.pitch) * Math.PI - v.pitch; v.roll = N.wrap(v.roll + Math.PI); v.wp = -v.wp; }
      if (H.bike) bikeLean(v, alive, vf, dt);
      rot(v.yaw, v.pitch, v.roll, R);
      v.x = ncx - H.h * R[1];
      v.y = ncy - H.h * R[4];
      v.z = ncz - H.h * R[7];
      v.air = wheels === 0 && hulls === 0;
      v.wheels = wheels;
      v.up = R[4];
      v.spd = v.vx * Math.sin(v.yaw) - v.vz * Math.cos(v.yaw);
      v.slip = slip;
      v.spin = spinF || spinR ? 1 : 0;
      const wr = s.shape.wr, ws = v.spd + 10 * Math.sign(fe || 1);
      v.wheelRot = (v.wheelRot || 0) + (lockF ? 0 : spinF ? ws : v.spd) * dt / wr;
      v.wheelRotR = (v.wheelRotR || 0) + (lockR ? 0 : spinR ? ws : v.spd) * dt / wr;
    },

    bodyKin(v, dt, ax, ay) {
      const H = handling(v.spec);
      if (v.wp === undefined) { v.wp = 0; v.wr = 0; }
      const tp = N.clamp(ax * H.kinP, -0.045, 0.035);
      v.wp += ((tp - (v.pitch || 0)) * 72 - v.wp * 7.6) * dt;
      v.pitch = (v.pitch || 0) + v.wp * dt;
      if (H.bike) { v.roll = N.approach(v.roll || 0, N.clamp(-ay * 0.075, -0.6, 0.6), dt * 2.5); v.wr = 0; }
      else {
        const tr = N.clamp(ay * H.kinR, -0.075, 0.075);
        v.wr += ((tr - (v.roll || 0)) * 81 - v.wr * 8.1) * dt;
        v.roll = (v.roll || 0) + v.wr * dt;
      }
      const sp = v.susp || (v.susp = [0, 0, 0, 0]), dp = v.pitch * H.wb * 0.5, dr = H.bike ? 0 : v.roll * H.tw * 0.5;
      sp[0] = -dp + dr; sp[1] = -dp - dr; sp[2] = dp + dr; sp[3] = dp - dr;
      v.up = Math.cos(v.pitch) * Math.cos(v.roll);
      v.wheels = 4;
      v.slip = 0;
      v.spin = 0;
    },

    wheelLift(v, x, z) {
      const sp = v.susp;
      if (!sp) return 0;
      const t = N.clamp(z / handling(v.spec).wb + 0.5, 0, 1), a = x < 0 ? sp[0] : sp[1], b = x < 0 ? sp[2] : sp[3];
      return Math.min(0.06, a + (b - a) * t);
    },

    point(v, lx, ly, lz, out) {
      const R = FB.R, o = out || {};
      rot(v.yaw, v.pitch || 0, v.roll || 0, R);
      o.x = v.x + R[0] * lx + R[1] * ly + R[2] * lz;
      o.y = v.y + R[3] * lx + R[4] * ly + R[5] * lz;
      o.z = v.z + R[6] * lx + R[7] * ly + R[8] * lz;
      return o;
    },

    blast(v, x, z, dv) {
      const H = handling(v.spec), f = frame(v, H, FB), m = v.spec.mass;
      let dx = v.x - x, dz = v.z - z;
      const L = Math.hypot(dx, dz);
      if (L < 0.6) { v.vy += dv * 0.3; return; }
      dx /= L; dz /= L;
      const px = v.x - dx * v.spec.hw * 0.7, pz = v.z - dz * v.spec.hw * 0.7;
      push(v, H, f, px - f.cx, v.y + 0.15 - f.cy, pz - f.cz, dx * dv * m, dv * 0.45 * m, dz * dv * m);
    },

    obbOf(v) {
      return N.obb(v.x, v.z, v.yaw, v.spec.hl, v.spec.hw);
    },

    collideVehicleStatic(v, city, world) {
      const o = N.Phys.obbOf(v);
      const r = Math.max(v.spec.hl, v.spec.hw) + 0.5;
      let hit = 0;
      const H = v.spec.shape.H;
      city.hash.query(v.x - r, v.z - r, v.x + r, v.z + r, it => {
        if (it.brk && world && world.broken.has(it.brk)) return;
        if (it.circle) {
          if (v.y > it.y1 - 0.2) return;
          const cc = N.circleObb(it.x, it.z, it.r, o);
          if (!cc) return;
          const nx = -cc.nx, nz = -cc.nz;
          if (it.brk && world && world.carHitsProp(v, it.brk, nx, nz, -(v.vx * nx + v.vz * nz))) return;
          const imp = N.Phys.resolveStatic(v, nx, nz, cc.depth, cc.px, cc.pz, 0.25);
          if (imp > hit) hit = imp;
          return;
        }
        if (it.y1 - 0.3 <= v.y || it.y0 >= v.y + H) return;
        let res, cp;
        if (it.poly) {
          res = N.satObbPoly(o, it.poly);
          if (!res) return;
          cp = N.contactObbPoly(o, it.poly, res.nx, res.nz);
        } else {
          const b = N.boxObb(it);
          res = N.satObb(o, b);
          if (!res) return;
          cp = N.contactPoint(o, b, res.nx, res.nz);
        }
        if (it.brk && world && world.carHitsProp(v, it.brk, res.nx, res.nz, -(v.vx * res.nx + v.vz * res.nz))) return;
        const imp = N.Phys.resolveStatic(v, res.nx, res.nz, res.depth, cp[0], cp[1], 0.2);
        o.x = v.x;
        o.z = v.z;
        if (imp > hit) hit = imp;
      });
      return hit;
    },

    resolveStatic(v, nx, nz, depth, px, pz, e) {
      v.x += nx * depth;
      v.z += nz * depth;
      const H = handling(v.spec), f = frame(v, H, FB);
      const rx = px - f.cx, ry = v.y + H.yc - f.cy, rz = pz - f.cz;
      const pvx = v.vx + f.oy * rz - f.oz * ry, pvz = v.vz + f.ox * ry - f.oy * rx;
      const vn = pvx * nx + pvz * nz;
      if (vn >= 0) return 0;
      const j = -(1 + e) * vn / invMass(v, H, f, rx, ry, rz, nx, 0, nz);
      push(v, H, f, rx, ry, rz, j * nx, 0, j * nz);
      const tx = -nz, tz = nx;
      const vt = (v.vx + f.oy * rz - f.oz * ry) * tx + (v.vz + f.ox * ry - f.oy * rx) * tz;
      const jt = N.clamp(-vt / invMass(v, H, f, rx, ry, rz, tx, 0, tz), -j * 0.35, j * 0.35);
      push(v, H, f, rx, ry, rz, jt * tx, 0, jt * tz);
      const dv = j / v.spec.mass;
      if (dv > (v.hitDv || 0)) v.hitDv = dv;
      if (Math.abs(vt) > 4 && Math.abs(vt) > (v.scrape || 0)) { v.scrape = Math.abs(vt); v.scrapeX = px; v.scrapeZ = pz; }
      return -vn;
    },

    collideVehicles(a, b) {
      if (Math.abs(a.y - b.y) > 2) return 0;
      const oa = N.Phys.obbOf(a), ob = N.Phys.obbOf(b);
      const res = N.satObb(oa, ob);
      if (!res) return 0;
      const cp = N.contactPoint(oa, ob, res.nx, res.nz);
      const nx = res.nx, nz = res.nz;
      const ha = a.heavy || 1, hb = b.heavy || 1;
      const ma = a.spec.mass * ha, mb = b.spec.mass * hb;
      const tot = ma + mb;
      a.x += nx * res.depth * mb / tot;
      a.z += nz * res.depth * mb / tot;
      b.x -= nx * res.depth * ma / tot;
      b.z -= nz * res.depth * ma / tot;
      const HA = handling(a.spec), HB = handling(b.spec), fa = frame(a, HA, FA), fb = frame(b, HB, FB);
      const py = Math.min(a.y + HA.yc, b.y + HB.yc);
      const rax = cp[0] - fa.cx, ray = py - fa.cy, raz = cp[1] - fa.cz, rbx = cp[0] - fb.cx, rby = py - fb.cy, rbz = cp[1] - fb.cz;
      const vax = a.vx + fa.oy * raz - fa.oz * ray, vaz = a.vz + fa.ox * ray - fa.oy * rax;
      const vbx = b.vx + fb.oy * rbz - fb.oz * rby, vbz = b.vz + fb.ox * rby - fb.oy * rbx;
      const vn = (vax - vbx) * nx + (vaz - vbz) * nz;
      if (vn >= 0) return 0;
      const j = -1.25 * vn / (invMass(a, HA, fa, rax, ray, raz, nx, 0, nz, ha) + invMass(b, HB, fb, rbx, rby, rbz, nx, 0, nz, hb));
      push(a, HA, fa, rax, ray, raz, j * nx, 0, j * nz, ha);
      push(b, HB, fb, rbx, rby, rbz, -j * nx, 0, -j * nz, hb);
      const tx = -nz, tz = nx;
      const vt = (a.vx + fa.oy * raz - fa.oz * ray - b.vx - fb.oy * rbz + fb.oz * rby) * tx + (a.vz + fa.ox * ray - fa.oy * rax - b.vz - fb.ox * rby + fb.oy * rbx) * tz;
      const jt = N.clamp(-vt / (invMass(a, HA, fa, rax, ray, raz, tx, 0, tz, ha) + invMass(b, HB, fb, rbx, rby, rbz, tx, 0, tz, hb)), -j * 0.3, j * 0.3);
      push(a, HA, fa, rax, ray, raz, jt * tx, 0, jt * tz, ha);
      push(b, HB, fb, rbx, rby, rbz, -jt * tx, 0, -jt * tz, hb);
      if (j / ma > (a.hitDv || 0)) { a.hitDv = j / ma; a.hitBy = b; }
      if (j / mb > (b.hitDv || 0)) { b.hitDv = j / mb; b.hitBy = a; }
      return -vn;
    },

    stepPed(p, city, dt, world) {
      const swim = !!p.swim && !p.dead;
      let tx = p.wantVx || 0, tz = p.wantVz || 0;
      if (swim) { tx *= 0.14; tz *= 0.14; }
      else if (p.wade > 0.05) { const k = N.clamp(1 - p.wade * 0.55, 0.32, 1); tx *= k; tz *= k; }
      const acc = swim ? 1.6 : p.onGround ? (p.state === 'down' || p.state === 'dead' ? 9 : 26) : p.wade > 0.3 ? 4 : 2;
      const dvx = tx - p.vx, dvz = tz - p.vz;
      const dl = Math.hypot(dvx, dvz);
      if (dl > 0) {
        const k = Math.min(1, acc * dt / dl);
        p.vx += dvx * k;
        p.vz += dvz * k;
      }
      if (p.wade > 0.3 && !p.onGround && !swim) { const k = Math.max(0, 1 - dt * 2.5); p.vx *= k; p.vz *= k; }
      const ox = p.x, oz = p.z;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      N.Phys.collidePedStatic(p, city, world);
      let wa = city.ground(p.x, p.z) === GT.WATER ? city.waterAt(p.x, p.z) : null;
      if (wa && !p.isPlayer && !p.dead && !swim && p.state !== 'down' && wa.level - wa.bed > 0.7 && !(p.deepAt > 0.7)) {
        p.x = ox; p.z = oz; p.vx = 0; p.vz = 0; p.blocked = 0.4;
        wa = city.ground(p.x, p.z) === GT.WATER ? city.waterAt(p.x, p.z) : null;
      }
      const M = world && world.metro;
      let gy = M && M.has(p.x, p.z) ? M.floorY(p.x, p.z, p.y) : city.groundY(p.x, p.z);
      const roof = city.roofAt(p.x, p.z);
      const onRoof = roof > 0 && roof > gy && p.y > roof - 0.7;
      if (onRoof) gy = roof;
      if (p.deck !== undefined && p.deck !== null) gy = Math.max(gy, p.deck);
      p.gy = gy;
      const lvl = wa && !onRoof && !(p.deck > 0) ? wa.level : null;
      if (swim && lvl !== null) {
        const s = p.swim;
        if (s.under) p.y = Math.max(gy, p.y - dt * 0.9);
        else p.y = N.lerp(p.y, Math.max(gy, lvl - 1.42 + Math.sin(s.t * 5.3) * 0.06), Math.min(1, dt * 5));
        p.vy = 0;
        p.onGround = false;
      } else if (p.dead && lvl !== null && p.y < lvl - 0.25) {
        p.y = Math.max(gy, p.y - dt * 0.45);
        p.vy = 0;
        p.onGround = p.y <= gy + 0.01;
        const k = Math.max(0, 1 - dt * 3);
        p.vx *= k; p.vz *= k;
      } else if (p.y > gy + 0.05 || p.vy > 0) {
        p.vy -= N.G * dt;
        if (lvl !== null && p.y < lvl && p.vy < 0) p.vy *= Math.max(0, 1 - dt * 7);
        p.y += p.vy * dt;
        p.onGround = false;
        if (p.y <= gy) {
          const impact = -p.vy;
          p.y = gy;
          p.vy = 0;
          p.onGround = true;
          p.landImpact = lvl !== null && lvl - gy > 0.6 ? 0 : impact;
        }
      } else {
        p.y = gy;
        p.vy = 0;
        p.onGround = true;
      }
      p.wl = lvl;
      p.deepAt = lvl !== null ? Math.max(0, lvl - gy) : 0;
      p.wade = lvl !== null ? Math.max(0, lvl - p.y) : 0;
      p.inWater = p.wade > 0.05;
    },

    collidePedStatic(p, city, world) {
      const r = p.r || 0.34;
      city.hash.query(p.x - r - 0.5, p.z - r - 0.5, p.x + r + 0.5, p.z + r + 0.5, it => {
        if (it.brk && world && world.broken.has(it.brk)) return;
        if (it.circle) {
          if (p.y > it.y1 - 0.3) return;
          const dx = p.x - it.x, dz = p.z - it.z;
          const d = Math.hypot(dx, dz), m = r + it.r;
          if (d >= m || d < 1e-6) return;
          if (it.brk && world && N.BREAK[it.brk.kind].foot && world.pedHitsProp(p, it.brk, dx / d, dz / d)) return;
          p.x = it.x + dx / d * m;
          p.z = it.z + dz / d * m;
          return;
        }
        if (p.y > it.y1 - 0.45 || p.y + 1.7 < it.y0) return;
        const c = it.poly ? N.circlePoly(p.x, p.z, r, it.poly) : N.circleBox(p.x, p.z, r, it);
        if (!c) return;
        if (it.brk && world && N.BREAK[it.brk.kind].foot && world.pedHitsProp(p, it.brk, c.nx, c.nz)) return;
        p.x += c.nx * c.depth;
        p.z += c.nz * c.depth;
        const vn = p.vx * c.nx + p.vz * c.nz;
        if (vn < 0) { p.vx -= vn * c.nx; p.vz -= vn * c.nz; }
        p.blocked = 0.3;
      });
    },

    rayStatic(city, ox, oy, oz, dx, dy, dz, tmax, world, skipLow) {
      let best = tmax;
      let hitIt = null;
      const x1 = ox + dx * tmax, z1 = oz + dz * tmax;
      const len = Math.hypot(dx * tmax, dz * tmax);
      const steps = Math.max(1, Math.ceil(len / 24));
      for (let k = 0; k < steps; k++) {
        const a0 = k / steps, a1 = (k + 1) / steps;
        const sx0 = ox + (x1 - ox) * a0, sz0 = oz + (z1 - oz) * a0, sx1 = ox + (x1 - ox) * a1, sz1 = oz + (z1 - oz) * a1;
        city.hash.query(Math.min(sx0, sx1) - 1, Math.min(sz0, sz1) - 1, Math.max(sx0, sx1) + 1, Math.max(sz0, sz1) + 1, it => {
          if (world && it.brk && world.broken.has(it.brk)) return;
          if (it.circle) {
            if (it.kind === 'tree' && skipLow) return;
            const t = N.rayCylinder(ox, oy, oz, dx, dy, dz, it.x, it.z, it.r, 0, it.y1, best);
            if (t >= 0 && t < best) { best = t; hitIt = it; }
            return;
          }
          if (skipLow && it.y1 < 1.3) return;
          const t = it.poly ? N.rayPoly(ox, oy, oz, dx, dy, dz, it.poly, it.y0, it.y1, best) : N.rayBox(ox, oy, oz, dx, dy, dz, it.x0, it.y0, it.z0, it.x1, it.y1, it.z1, best);
          if (t >= 0 && t < best) { best = t; hitIt = it; }
        });
        if (hitIt && best <= tmax * a1 + 0.5) break;
      }
      if (dy < 0 && !(city.metroLine && city.metroLine.has(ox, oz))) {
        const tg = (0.05 - oy) / dy;
        if (tg > 0 && tg < best) { best = tg; hitIt = { ground: true }; }
      }
      return hitIt ? { t: best, it: hitIt } : null;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
