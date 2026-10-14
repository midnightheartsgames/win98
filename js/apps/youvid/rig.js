(function () {
  const { M4, V3, rgb } = window.P3D;
  const { PI, S, C, clamp } = window.YouVidKit;

  function basisM(o, x, y, z) {
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  function perp(v, axis) {
    return V3.sub(v, V3.mul(axis, V3.dot(v, axis)));
  }

  function anyPerp(axis) {
    const p = perp(Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], axis);
    return V3.norm(p);
  }

  function frame(up, fwd) {
    const y = V3.norm(up);
    let z = perp(fwd, y);
    z = V3.len(z) < 1e-4 ? anyPerp(y) : V3.norm(z);
    return { x: V3.cross(y, z), y, z };
  }

  function boneM(from, to, zHint) {
    const y = V3.norm(V3.sub(from, to));
    let z = perp(zHint, y);
    z = V3.len(z) < 1e-4 ? anyPerp(y) : V3.norm(z);
    return basisM(from, V3.cross(y, z), y, z);
  }

  function ik(a, target, l1, l2, pole) {
    const d = V3.sub(target, a);
    const raw = V3.len(d);
    const dir = raw > 1e-5 ? V3.mul(d, 1 / raw) : [0, -1, 0];
    const len = clamp(raw, Math.abs(l1 - l2) + 0.002, l1 + l2 - 0.002);
    const x = (l1 * l1 - l2 * l2 + len * len) / (2 * len);
    const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    let p = perp(pole, dir);
    p = V3.len(p) < 1e-4 ? anyPerp(dir) : V3.norm(p);
    return { mid: V3.add(V3.add(a, V3.mul(dir, x)), V3.mul(p, h)), end: V3.add(a, V3.mul(dir, len)), bend: p };
  }

  function solve(p, D) {
    const f = frame(p.up || [0, 1, 0], p.fwd || [0, 0, 1]);
    const pelvis = basisM(p.p || [0, 1, 0], f.x, f.y, f.z);
    const sp = p.sp || [0, 0, 0];
    const chest = M4.chain(pelvis, M4.translate(0, D.chestY, 0), M4.rotY(sp[1]), M4.rotX(sp[0]), M4.rotZ(sp[2]));
    const nk = p.nk || [0, 0, 0];
    const neck = M4.chain(chest, M4.translate(0, D.neckY, 0.01), M4.rotY(nk[1]), M4.rotX(nk[0]), M4.rotZ(nk[2]));
    const head = M4.mul(neck, M4.translate(0, D.headY, 0.035));
    const out = { pelvis, chest, neck, head, pts: {} };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sh = M4.point(chest, [k * D.shX, D.shY, -0.01]);
      const wrist = p['h' + s + 'w'] || M4.point(chest, p['h' + s] || [k * 0.34, -0.22, 0.06]);
      const pole = p['e' + s + 'w'] ? V3.sub(p['e' + s + 'w'], sh) : M4.dir(chest, p['e' + s] || [k * 0.5, -0.1, -0.7]);
      const arm = ik(sh, wrist, D.upper, D.fore, pole);
      const front = V3.mul(arm.bend, -1);
      out['upper' + s] = boneM(sh, arm.mid, front);
      const fore = boneM(arm.mid, arm.end, front);
      out['fore' + s] = fore;
      const w = p['w' + s] || [0, 0, 0];
      out['hand' + s] = M4.chain(basisM(arm.end, [fore[0], fore[1], fore[2]], [fore[4], fore[5], fore[6]], [fore[8], fore[9], fore[10]]), M4.rotX(w[0]), M4.rotY(k * w[1]), M4.rotZ(k * w[2]));
      out.pts['shoulder' + s] = sh;
      out.pts['elbow' + s] = arm.mid;
      out.pts['wrist' + s] = arm.end;
      const hip = M4.point(pelvis, [k * D.hipX, D.hipY, 0]);
      const target = p['f' + s + 'w'] || M4.point(pelvis, p['f' + s] || [k * 0.14, -0.88, 0.04]);
      const ankle = [target[0], Math.max(0.07, target[1]), target[2]];
      const kneePole = p['k' + s + 'w'] ? V3.sub(p['k' + s + 'w'], hip) : M4.dir(pelvis, p['k' + s] || [k * 0.15, 0, 1]);
      const leg = ik(hip, ankle, D.thigh, D.shin, kneePole);
      out['thigh' + s] = boneM(hip, leg.mid, leg.bend);
      const shin = boneM(leg.mid, leg.end, leg.bend);
      out['shin' + s] = shin;
      out['foot' + s] = M4.chain(basisM(leg.end, [shin[0], shin[1], shin[2]], [shin[4], shin[5], shin[6]], [shin[8], shin[9], shin[10]]), M4.rotX(p['a' + s] || 0));
      out.pts['hip' + s] = hip;
      out.pts['knee' + s] = leg.mid;
      out.pts['ankle' + s] = leg.end;
    });
    out.pts.head = M4.point(head, [0, 0, 0]);
    out.pts.chest = M4.point(chest, [0, 0.12, 0.08]);
    out.pts.pelvis = M4.point(pelvis, [0, 0, 0]);
    return out;
  }

  function loft(b, rings, sides, opts) {
    const o = opts || {};
    const ang = (i) => (i / sides) * PI * 2 + (o.phase || 0);
    const pt = (r, i) => [(r.cx || 0) + S(ang(i)) * r.rx, r.y, (r.cz || 0) + C(ang(i)) * r.rz];
    const nr = (r, i, slope) => V3.norm([S(ang(i)) / r.rx, slope, C(ang(i)) / r.rz]);
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      const dy = r1.y - r0.y;
      if (Math.abs(dy) < 1e-6) continue;
      const slope = (((r0.rx + r0.rz) - (r1.rx + r1.rz)) / 2) / dy;
      const c0 = rgb(r0.col), c1 = rgb(o.hard ? r0.col : r1.col);
      for (let i = 0; i < sides; i++) {
        const uv = o.uv ? [[i / sides, j / (rings.length - 1)], [(i + 1) / sides, j / (rings.length - 1)], [(i + 1) / sides, (j + 1) / (rings.length - 1)], [i / sides, (j + 1) / (rings.length - 1)]] : null;
        b.quad(pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i), [c0, c0, c1, c1], uv, [nr(r0, i, slope), nr(r0, i + 1, slope), nr(r1, i + 1, slope), nr(r1, i, slope)]);
      }
    }
    const cap = (r, dirY) => {
      const c = [r.cx || 0, r.y, r.cz || 0];
      const n = [0, dirY, 0];
      for (let i = 0; i < sides; i++) b.tri(c, pt(r, i), pt(r, i + 1), rgb(r.col), null, [n, n, n]);
    };
    if (o.capBottom) cap(rings[0], -1);
    if (o.capTop) cap(rings[rings.length - 1], 1);
    return b;
  }

  function ring(y, rx, rz, cz, col) {
    return { y, rx, rz, cz: cz || 0, col };
  }

  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const MOTION_KEYS = ['p', 'up', 'fwd', 'sp', 'nk', 'hLw', 'eLw', 'hRw', 'eRw', 'fLw', 'kLw', 'fRw', 'kRw'];

  function pair(s, i) {
    return ALPHA.indexOf(s[i]) * 62 + ALPHA.indexOf(s[i + 1]);
  }

  function decodeMotion(m) {
    if (!m) return [];
    const n = m.channels;
    const step = 2 + n * 2;
    return m.segs.map(seg => {
      const keys = [];
      for (let i = 0; i + step <= seg.data.length; i += step) {
        const v = new Float32Array(n);
        for (let c = 0; c < n; c++) v[c] = (pair(seg.data, i + 2 + c * 2) - 1922) / 600;
        keys.push({ t: seg.t0 + pair(seg.data, i) / 30, v });
      }
      return { t0: seg.t0, t1: seg.t1, keys };
    });
  }

  function motion(data) {
    const segs = decodeMotion(data);
    return (t) => {
      const seg = segs.find(s => t >= s.t0 && t < s.t1);
      if (!seg || seg.keys.length < 2) return null;
      const ks = seg.keys;
      let lo = 0, hi = ks.length - 2;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (ks[mid].t <= t) lo = mid; else hi = mid - 1;
      }
      const a = ks[lo], b = ks[lo + 1];
      const h = b.t - a.t;
      const u = clamp((t - a.t) / h, 0, 1);
      const pa = ks[Math.max(0, lo - 1)], pb = ks[Math.min(ks.length - 1, lo + 2)];
      const u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      const out = new Float32Array(a.v.length);
      for (let c = 0; c < out.length; c++) {
        const m0 = ((b.v[c] - pa.v[c]) / (b.t - pa.t)) * h;
        const m1 = ((pb.v[c] - a.v[c]) / (pb.t - a.t)) * h;
        out[c] = h00 * a.v[c] + h10 * m0 + h01 * b.v[c] + h11 * m1;
      }
      return out;
    };
  }

  function applyMotion(pose, v, skip) {
    MOTION_KEYS.forEach((key, i) => {
      if (skip && skip(key)) return;
      pose[key] = [v[i * 3], v[i * 3 + 1], v[i * 3 + 2]];
    });
    return pose;
  }

  window.YouVidRig = { basisM, frame, boneM, ik, solve, loft, ring, MOTION_KEYS, motion, applyMotion };
})();
