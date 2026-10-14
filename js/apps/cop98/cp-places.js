(function (C) {
  'use strict';
  const { lerp, clamp } = C;
  const FLAG = C.FLAG;
  const P = C.MAP.POI;

  function hullWidth(spec, x) {
    if (x <= spec.sternX) return spec.sternW;
    if (x < spec.sternFull) return lerp(spec.sternW, spec.w, (x - spec.sternX) / (spec.sternFull - spec.sternX));
    if (x <= spec.bowStart) return spec.w;
    const t = clamp((x - spec.bowStart) / (spec.bowX - spec.bowStart), 0, 1);
    return spec.w * Math.sqrt(Math.max(0, 1 - t * t));
  }

  function buildHull(b, spec) {
    const W = x => hullWidth(spec, x);
    const xs = new Set([spec.x0, spec.x1]);
    for (let x = Math.ceil(spec.x0 / 4) * 4; x < spec.x1; x += 4) xs.add(x);
    for (const k of spec.stations || []) if (k > spec.x0 && k < spec.x1) xs.add(k);
    for (const o of spec.openings || []) { xs.add(o.x0); xs.add(o.x1); }
    if (spec.bowStart > spec.x0 && spec.bowStart < spec.x1) for (let x = spec.bowStart; x < spec.x1; x += 2) xs.add(x);
    const st = [...xs].filter(x => x >= spec.x0 && x <= spec.x1).sort((a, b) => a - b);
    const zb = spec.bottom, zt = spec.top, band = spec.band, deck = spec.deck, floor = spec.floor, inner = spec.inner;
    const openingAt = (side, xa, xb) => (spec.openings || []).filter(o => o.side === side && o.x0 <= xa + 1e-6 && o.x1 >= xb - 1e-6);
    const sideStrip = (side, xa, xb, z0, z1, tex, flags, inset = 0, reverse = false) => {
      const sgn = side === 'n' ? 1 : -1;
      const ya = sgn * (W(xa) - inset), yb = sgn * (W(xb) - inset);
      if (Math.abs(ya) < 0.01 && Math.abs(yb) < 0.01) return;
      let pts = side === 's' ? [[xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1]] : [[xb, yb, z0], [xa, ya, z0], [xa, ya, z1], [xb, yb, z1]];
      if (reverse) pts = [pts[1], pts[0], pts[3], pts[2]];
      const len = Math.hypot(xb - xa, yb - ya);
      const u0 = (side === 's' ? xa : -xb) / 2;
      b.quad(pts, tex, { uvs: [[u0, (zt - z0) / 2.5], [u0 + len / 2, (zt - z0) / 2.5], [u0 + len / 2, (zt - z1) / 2.5], [u0, (zt - z1) / 2.5]], flags });
    };
    for (let i = 0; i + 1 < st.length; i++) {
      const xa = st[i], xb = st[i + 1];
      for (const side of ['s', 'n']) {
        const ops = openingAt(side, xa, xb);
        const ranges = [[zb, band, 'hullred'], [band, zt, spec.tex || 'hull']];
        for (const [z0, z1, tex] of ranges) {
          let segs = [[z0, z1]];
          for (const o of ops) segs = segs.flatMap(([a, c]) => (o.z1 <= a || o.z0 >= c) ? [[a, c]] : [[a, Math.max(a, o.z0)], [Math.min(c, o.z1), c]].filter(([p, q]) => q - p > 0.01));
          for (const [p, q] of segs) sideStrip(side, xa, xb, p, q, tex, 0);
        }
        const innerIn = xa >= inner[0] - 1e-6 && xb <= inner[1] + 1e-6;
        let isegs = [];
        if (innerIn) isegs.push([floor, spec.ceiling]);
        isegs.push([deck, zt]);
        for (const o of ops) isegs = isegs.flatMap(([a, c]) => (o.z1 <= a || o.z0 >= c) ? [[a, c]] : [[a, Math.max(a, o.z0)], [Math.min(c, o.z1), c]].filter(([p, q]) => q - p > 0.01));
        for (const [p, q] of isegs) sideStrip(side, xa, xb, p, q, p >= deck ? (spec.tex || 'hull') : 'rust', p >= deck ? 0 : FLAG.INDOOR, 0.3, true);
        const ya = (side === 'n' ? 1 : -1) * W(xa), yb2 = (side === 'n' ? 1 : -1) * W(xb), ia = (side === 'n' ? 1 : -1) * (W(xa) - 0.3), ib = (side === 'n' ? 1 : -1) * (W(xb) - 0.3);
        const capOps = ops.filter(o => o.z1 >= zt);
        if (!capOps.length) b.quad(side === 's' ? [[xa, ya, zt], [xb, yb2, zt], [xb, ib, zt], [xa, ia, zt]] : [[xb, yb2, zt], [xa, ya, zt], [xa, ia, zt], [xb, ib, zt]], 'metal', { planar: true, uv: 1 });
        for (const o of ops) {
          if (Math.abs(o.x0 - xa) < 1e-6) b.quad(side === 's' ? [[xa, ia, o.z0], [xa, ya, o.z0], [xa, ya, Math.min(o.z1, zt)], [xa, ia, Math.min(o.z1, zt)]] : [[xa, ya, o.z0], [xa, ia, o.z0], [xa, ia, Math.min(o.z1, zt)], [xa, ya, Math.min(o.z1, zt)]], 'rust', { flags: FLAG.TWO_SIDED });
          if (Math.abs(o.x1 - xb) < 1e-6) b.quad(side === 's' ? [[xb, yb2, o.z0], [xb, ib, o.z0], [xb, ib, Math.min(o.z1, zt)], [xb, yb2, Math.min(o.z1, zt)]] : [[xb, ib, o.z0], [xb, yb2, o.z0], [xb, yb2, Math.min(o.z1, zt)], [xb, ib, Math.min(o.z1, zt)]], 'rust', { flags: FLAG.TWO_SIDED });
          if (o.z1 < zt) b.quad([[xa, ia, o.z1], [xb, ib, o.z1], [xb, yb2, o.z1], [xa, ya, o.z1]], 'rust', { flags: FLAG.TWO_SIDED });
          if (o.z0 > zb) b.quad([[xa, ya, o.z0], [xb, yb2, o.z0], [xb, ib, o.z0], [xa, ia, o.z0]], 'rust', { flags: FLAG.TWO_SIDED });
        }
        const len = Math.hypot(xb - xa, yb2 - ya);
        if (len > 0.05) {
          const yaw = Math.atan2(yb2 - ya, xb - xa);
          const ny = side === 'n' ? -0.18 : 0.18;
          let segs = [[zb, zt]];
          for (const o of ops) segs = segs.flatMap(([a, c]) => (o.z1 <= a || o.z0 >= c) ? [[a, c]] : [[a, Math.max(a, o.z0)], [Math.min(c, o.z1), c]].filter(([p, q]) => q - p > 0.01));
          for (const [p, q] of segs) b.collider((xa + xb) / 2 - Math.sin(yaw) * ny, (ya + yb2) / 2 + Math.cos(yaw) * ny, p, len + 0.1, 0.4, q - p, yaw, 'metal', false);
        }
      }
    }
    if (spec.closedStern !== false && W(spec.x0) > 0.05) {
      const w0 = W(spec.x0);
      b.quad([[spec.x0, w0, zb], [spec.x0, -w0, zb], [spec.x0, -w0, zt], [spec.x0, w0, zt]], spec.tex || 'hull', { uv: 2.5 });
      b.collider(spec.x0 + 0.2, 0, zb, 0.4, w0 * 2, zt - zb, 0, 'metal', false);
    }
    if (spec.openEnd) {
      const w1 = W(spec.x1);
      b.quad([[spec.x1, -w1, zb], [spec.x1, w1, zb], [spec.x1, w1, floor], [spec.x1, -w1, floor]], 'rust', { uv: 2 });
    }
    const holes = spec.holes || [];
    const deckStrip = (xa, xb, ya0, ya1, yb0, yb1, z, tex, flags, top) => {
      const pts = top ? [[xa, ya0, z], [xb, yb0, z], [xb, yb1, z], [xa, ya1, z]] : [[xa, ya1, z], [xb, yb1, z], [xb, yb0, z], [xa, ya0, z]];
      b.quad(pts, tex, { planar: true, uv: 2, flags });
    };
    for (let i = 0; i + 1 < st.length; i++) {
      const xa = st[i], xb = st[i + 1], wa = W(xa), wb = W(xb);
      const hs = holes.filter(h => h.x0 <= xa + 1e-6 && h.x1 >= xb - 1e-6);
      const spans = [];
      if (!hs.length) spans.push([-1, 1]);
      else { const h = hs[0]; spans.push([-1, h.y0 / Math.max(wa, wb)], [h.y1 / Math.max(wa, wb), 1]); }
      for (const [s0, s1] of spans) {
        const clampY = (s, w) => clamp(s * Math.max(wa, wb), -w, w);
        deckStrip(xa, xb, clampY(s0, wa), clampY(s1, wa), clampY(s0, wb), clampY(s1, wb), deck, 'deck', 0, true);
        const innerIn = xa >= inner[0] - 1e-6 && xb <= inner[1] + 1e-6;
        if (innerIn) {
          deckStrip(xa, xb, clampY(s0, wa - 0.3), clampY(s1, wa - 0.3), clampY(s0, wb - 0.3), clampY(s1, wb - 0.3), spec.ceiling, 'rust', FLAG.INDOOR, false);
          if (!spec.noFloor) deckStrip(xa, xb, -wa + 0.3, wa - 0.3, -wb + 0.3, wb - 0.3, floor, spec.floorTex || 'deck', FLAG.INDOOR, true);
        }
      }
    }
    const wmax = spec.w;
    let dx = spec.x0;
    const cuts = holes.slice().sort((a, c) => a.x0 - c.x0);
    for (const h of cuts) {
      if (h.x0 > dx) b.collider((dx + h.x0) / 2, 0, spec.ceiling, h.x0 - dx, wmax * 2, deck - spec.ceiling, 0, 'metal', true);
      const southW = h.y0 + wmax, northW = wmax - h.y1;
      if (southW > 0.1) b.collider((h.x0 + h.x1) / 2, (-wmax + h.y0) / 2, spec.ceiling, h.x1 - h.x0, southW, deck - spec.ceiling, 0, 'metal', true);
      if (northW > 0.1) b.collider((h.x0 + h.x1) / 2, (h.y1 + wmax) / 2, spec.ceiling, h.x1 - h.x0, northW, deck - spec.ceiling, 0, 'metal', true);
      dx = h.x1;
    }
    if (dx < spec.x1) b.collider((dx + spec.x1) / 2, 0, spec.ceiling, spec.x1 - dx, wmax * 2, deck - spec.ceiling, 0, 'metal', true);
    if (!spec.noFloor) b.collider((inner[0] + inner[1]) / 2, 0, zb, inner[1] - inner[0], wmax * 2, floor - zb, 0, 'metal', true);
    for (const bh of spec.bulkheads || []) {
      const wi = Math.min(W(bh.x - 0.2), W(bh.x + 0.2)) - 0.3;
      b.wall(bh.x, -wi, bh.x, wi, floor, spec.ceiling - floor, 0.25, 'rust', { openings: bh.door ? [{ a: wi + bh.door[0], b: wi + bh.door[1], z0: 0, z1: 2.3 }] : [], inside: 'both', uv: 2 });
    }
    return W;
  }

  function crate(b, x, y, z, s = 1, yaw = 0, tex = 'planks') { b.box(x, y, z, s, s, s, yaw, tex, { uv: s, mat: 'wood', faces: ['n', 's', 'e', 'w', 't'] }); }
  function barrel(b, x, y, z, tex = 'rust') { b.cylinder(x, y, z, 0.32, 0.9, tex, { seg: 8, uv: 1 }); }
  function table(b, x, y, z, yaw = 0, indoor = true) {
    const f = indoor ? 'nsewtb' : '';
    b.box(x, y, z + 0.72, 1.4, 0.8, 0.06, yaw, 'planks', { indoor: f, uv: 1, collide: false });
    b.push(x, y, z, yaw);
    for (const [dx, dy] of [[-0.6, -0.32], [0.6, -0.32], [-0.6, 0.32], [0.6, 0.32]]) b.box(dx, dy, 0, 0.07, 0.07, 0.72, 0, 'darkplanks', { indoor: f, collide: false, faces: ['n', 's', 'e', 'w'] });
    b.pop();
    b.collider(x, y, z, 1.4, 0.8, 0.78, yaw, 'wood', true);
  }
  function bed(b, x, y, z, yaw = 0) {
    b.box(x, y, z, 2.0, 0.9, 0.45, yaw, 'metal', { indoor: 'nsewtb', top: 'cloth', uv: 1 });
  }
  function carWreck(b, x, y, z, yaw, kind = 'car') {
    b.push(x, y, z, yaw);
    if (kind === 'truck') {
      b.box(1.6, 0, 0.6, 2.2, 2.3, 1.9, 0, 'rust', { top: 'rust' });
      b.box(-1.8, 0, 0.9, 4.6, 2.4, 0.3, 0, 'rust');
      b.box(-1.8, 1.15, 1.2, 4.6, 0.1, 0.8, 0, 'darkplanks', { collide: false });
      b.box(-1.8, -1.15, 1.2, 4.6, 0.1, 0.8, 0, 'darkplanks', { collide: false });
      for (const [wx, wy] of [[1.6, 1.1], [1.6, -1.1], [-2.6, 1.1], [-2.6, -1.1]]) b.hcylinder(wx, wy, 0, 0.5, 0.35, Math.PI / 2, 'rubber', { collide: false, seg: 8 });
    } else if (kind === 'bus') {
      b.box(0, 0, 0.35, 9, 2.5, 2.6, 0, 'rust', { top: 'roof' });
      for (let k = -3; k <= 3; k++) b.quad([[k * 1.2 - 0.45, -1.26, 1.5], [k * 1.2 + 0.45, -1.26, 1.5], [k * 1.2 + 0.45, -1.26, 2.4], [k * 1.2 - 0.45, -1.26, 2.4]], 'window', { uvs: [[0, 1], [1, 1], [1, 0], [0, 0]] });
    } else {
      b.box(0, 0, 0.3, 4.0, 1.7, 0.75, 0, 'rust', { top: 'rust' });
      b.box(-0.3, 0, 1.05, 2.0, 1.5, 0.6, 0, 'rust', { top: 'rust' });
      for (const [wx, wy] of [[1.3, 0.8], [1.3, -0.8], [-1.3, 0.8], [-1.3, -0.8]]) b.hcylinder(wx, wy, 0, 0.32, 0.25, Math.PI / 2, 'rubber', { collide: false, seg: 8 });
    }
    b.pop();
  }
  function container(b, x, y, z, yaw, tex = 'corrugated') { b.box(x, y, z, 6, 2.4, 2.5, yaw, tex, { top: 'rust', uv: 2.5, mat: 'metal' }); }
  function logPile(b, x, y, z, yaw) {
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) b.hcylinder(x + Math.cos(yaw + Math.PI / 2) * (k - (3 - r) / 2) * 0.6, y + Math.sin(yaw + Math.PI / 2) * (k - (3 - r) / 2) * 0.6, z + r * 0.5, 0.28, 6, yaw, 'logs', { collide: false, seg: 7 });
    b.collider(x, y, z, 6, 2.4, 1.4, yaw, 'wood', true);
  }
  function fenceLine(b, pts, z, h, tex, gaps = []) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const ops = gaps.filter(g => g.seg === i).map(g => ({ a: g.a, b: g.b, z0: 0, z1: h + 1 }));
      b.wall(x0, y0, x1, y1, z, h, 0.2, tex, { openings: ops, uv: h });
    }
  }
  function heliWreck(b, x, y, z, yaw, opts = {}) {
    b.push(x, y, z, yaw);
    const roll = opts.roll || 0;
    const secs = [[-1.2, 0.6, 1.0], [0.6, 1.1, 1.7], [3.2, 1.2, 1.9], [6.0, 1.15, 1.8], [7.4, 0.8, 1.3], [8.4, 0.3, 0.8]];
    for (let i = 0; i + 1 < secs.length; i++) {
      const [xa, wa, ha] = secs[i], [xb, wb, hb] = secs[i + 1];
      const za = 0.5 + roll * 0, zb2 = 0.5;
      b.quad([[xa, -wa, za], [xb, -wb, zb2], [xb, -wb, zb2 + hb], [xa, -wa, za + ha]], 'heli', { uv: 2.2 });
      b.quad([[xb, wb, zb2], [xa, wa, za], [xa, wa, za + ha], [xb, wb, zb2 + hb]], 'heli', { uv: 2.2 });
      b.quad([[xa, -wa, za + ha], [xb, -wb, zb2 + hb], [xb, wb, zb2 + hb], [xa, wa, za + ha]], 'heli', { uv: 2.2 });
      b.quad([[xa, wa, za], [xb, wb, zb2], [xb, -wb, zb2], [xa, -wa, za]], 'heli', { uv: 2.2, flags: FLAG.INDOOR });
    }
    b.quad([[8.4, -0.3, 0.5], [8.4, 0.3, 0.5], [8.4, 0.3, 1.3], [8.4, -0.3, 1.3]], 'window', { uvs: [[0, 1], [1, 1], [1, 0], [0, 0]] });
    b.quad([[-1.2, 0.6, 0.5], [-1.2, -0.6, 0.5], [-1.2, -0.6, 1.5], [-1.2, 0.6, 1.5]], 'rust', { flags: FLAG.TWO_SIDED });
    b.quad([[3.4, -1.21, 0.6], [4.8, -1.19, 0.6], [4.8, -1.19, 2.1], [3.4, -1.21, 2.1]], 'rust', { light: 0.25, flags: FLAG.TWO_SIDED });
    if (!opts.noTail) {
      b.beam(-1.2, 0, 1.4, -7.5, opts.tailBend || 0, 1.9, 0.5, 'heli');
      b.beam(-7.5, opts.tailBend || 0, 1.9, -8.2, opts.tailBend || 0, 3.2, 0.35, 'heli');
    }
    const blades = opts.blades || [[2, 0, 2.7, 30], [2, 0, 2.7, 150], [2, 0, 2.7, 260]];
    for (const [bx, by, bz, ang] of blades) {
      const a = ang * Math.PI / 180, l = opts.bladeLen || 6;
      b.beam(bx, by, bz, bx + Math.cos(a) * l, by + Math.sin(a) * l, bz - 0.4 - (opts.droop || 0.8), 0.28, 'rubber');
    }
    b.box(2, 0, 2.3, 1.6, 1.2, 0.5, 0, 'metal', { collide: false });
    b.pop();
    b.push(x, y, z, yaw); b.collider(3.4, 0, 0, 9.6, 2.4, 2.4, 0, 'metal', true); b.pop();
  }

  const M = C.MAP, TAU = C.TAU;

  function tube(b, a, c, r, tex, seg = 6) {
    const dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], len = Math.hypot(dx, dy, dz);
    if (len < 0.01) return;
    const ux = dx / len, uy = dy / len, uz = dz / len;
    let px = -uy, py = ux;
    const pl = Math.hypot(px, py);
    if (pl < 1e-3) { px = 1; py = 0; } else { px /= pl; py /= pl; }
    const qx = -uz * py, qy = uz * px, qz = ux * py - uy * px;
    const off = th => [(px * Math.cos(th) + qx * Math.sin(th)) * r, (py * Math.cos(th) + qy * Math.sin(th)) * r, qz * Math.sin(th) * r];
    for (let i = 0; i < seg; i++) {
      const o0 = off(i / seg * TAU), o1 = off((i + 1) / seg * TAU);
      const P = [[a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]], [c[0] + o1[0], c[1] + o1[1], c[2] + o1[2]], [c[0] + o0[0], c[1] + o0[1], c[2] + o0[2]], [a[0] + o0[0], a[1] + o0[1], a[2] + o0[2]]];
      b.quad(P, tex, { uvs: [[0, i / seg], [len / 2, i / seg], [len / 2, (i + 1) / seg], [0, (i + 1) / seg]] });
    }
  }

  function resample(pts, step) {
    const out = [];
    for (let k = 0; k + 1 < pts.length; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / step));
      for (let i = 0; i < n; i++) out.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n]);
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function pipeline(b, T) {
    const N = M.SIZE, R = 0.32;
    const roadNear = (x, y) => { let v = 0; for (let dy = -4; dy <= 4; dy += 2) for (let dx = -4; dx <= 4; dx += 2) { const ix = Math.round(x + dx), iy = Math.round(y + dy); if (ix < 0 || iy < 0 || ix >= N || iy >= N) continue; v = Math.max(v, T.road[iy * N + ix]); } return v; };
    for (const run of M.PIPELINE) {
      const pts = resample(run.pts, 3), n = pts.length;
      const raw = pts.map(([x, y]) => roadNear(x, y) > 0.45 ? 1 : 0);
      const arch = raw.map((_, i) => { let m = 0; for (let k = -6; k <= 6; k++) { const j = i + k; if (j >= 0 && j < n && raw[j]) m = Math.max(m, 1 - Math.max(0, Math.abs(k) - 2) / 4); } return C.smoothstep(0, 1, m); });
      if (run.endZ != null) for (let i = Math.max(0, n - 8); i < n; i++) arch[i] = 0;
      if (run.startZ != null) for (let i = 0; i < Math.min(n, 8); i++) arch[i] = 0;
      const zs = pts.map(([x, y], i) => {
        const g = Math.max(T.heightAt(x, y), 0);
        let z = g + 0.85 + arch[i] * 4.7;
        if (run.sink === 'end' && i > n - 5) z = lerp(z, g - 0.7, (i - (n - 5)) / 4);
        if (run.sink === 'start' && i < 4) z = lerp(g - 0.7, z, i / 4);
        if (run.endZ != null && i > n - 6) z = lerp(z, run.endZ, (i - (n - 6)) / 5);
        if (run.startZ != null && i < 5) z = lerp(run.startZ, z, i / 5);
        return z;
      });
      const P = pts.map((p, i) => [p[0], p[1], zs[i]]);
      for (let i = 0; i + 1 < n; i++) tube(b, P[i], P[i + 1], R, 'rust', 6);
      for (let i = 0; i + 1 < n; i += 2) {
        const j = Math.min(n - 1, i + 2), a = P[i], c = P[j], len = Math.hypot(c[0] - a[0], c[1] - a[1]), z0 = Math.min(a[2], c[2]) - R, z1 = Math.max(a[2], c[2]) + R;
        b.collider((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, z0, len + 0.05, R * 2, z1 - z0, Math.atan2(c[1] - a[1], c[0] - a[0]), 'metal', true, Math.abs(a[2] - c[2]) > 0.05 ? { h0: a[2] + R, h1: c[2] + R } : null);
      }
      for (let i = 1; i + 1 < n; i += 2) {
        const [x, y, z] = P[i], g = T.heightAt(x, y);
        if (z - R - g < 0.15) continue;
        const nx = P[i + 1][0] - P[i - 1][0], ny = P[i + 1][1] - P[i - 1][1], nl = Math.hypot(nx, ny) || 1, sx = -ny / nl, sy = nx / nl;
        if (arch[i] > 0.5) {
          for (const s of [-1, 1]) b.beam(x + sx * 0.7 * s, y + sy * 0.7 * s, g - 0.3, x + sx * 0.35 * s, y + sy * 0.35 * s, z - R, 0.14, 'metal');
          b.beam(x - sx * 0.8, y - sy * 0.8, z - R - 0.05, x + sx * 0.8, y + sy * 0.8, z - R - 0.05, 0.12, 'metal');
        } else {
          b.beam(x, y, g - 0.3, x, y, z - R, 0.12, 'metal');
          b.beam(x - sx * 0.35, y - sy * 0.35, z - R - 0.04, x + sx * 0.35, y + sy * 0.35, z - R - 0.04, 0.1, 'metal');
        }
      }
      for (const [flag, at] of [['end', n - 1], ['start', 0]]) if (run.sink === flag) { const [x, y] = pts[at], g = T.heightAt(x, y); b.box(x, y, g - 0.4, 2.2, 2.2, 0.9, 0, 'concrete', { top: 'concrete' }); }
    }
  }

  function vehicle(b, x, y, z, yaw, kind) {
    b.push(x, y, z, yaw);
    if (kind === 'uaz') {
      b.box(0, 0, 0.45, 3.9, 1.75, 0.8, 0, 'olive', { top: 'olive', uv: 2 });
      b.box(-0.55, 0, 1.25, 2.3, 1.7, 0.75, 0, 'tarp', { top: 'tarp', uv: 2 });
      b.box(1.0, 0, 1.25, 0.08, 1.6, 0.55, 0, 'window', { collide: false, faces: ['e'] });
      for (const [wx, wy] of [[1.3, 0.85], [1.3, -0.85], [-1.2, 0.85], [-1.2, -0.85]]) b.hcylinder(wx, wy, 0, 0.4, 0.28, Math.PI / 2, 'rubber', { collide: false, seg: 8 });
    } else if (kind === 'zil') {
      b.box(2.6, 0, 0.7, 2.2, 2.4, 1.9, 0, 'olive', { top: 'olive' });
      b.box(-1.4, 0, 0.9, 5.6, 2.5, 0.3, 0, 'rust');
      b.box(-1.6, 0, 1.2, 4.4, 2.3, 2.1, 0, 'olive', { top: 'tarp', uv: 2 });
      b.box(-1.6, -1.16, 1.6, 1.2, 0.05, 1.0, 0, 'sign', { collide: false, faces: ['s'] });
      for (const [wx, wy] of [[2.6, 1.15], [2.6, -1.15], [-0.6, 1.15], [-0.6, -1.15], [-2.6, 1.15], [-2.6, -1.15]]) b.hcylinder(wx, wy, 0, 0.55, 0.36, Math.PI / 2, 'rubber', { collide: false, seg: 8 });
    } else if (kind === 'btr') {
      b.box(0, 0, 0.6, 7.2, 2.8, 1.4, 0, 'olive', { top: 'olive', uv: 2 });
      b.box(0.6, 0, 2.0, 3.6, 2.2, 0.5, 0, 'olive', { top: 'olive' });
      b.cylinder(0.9, 0, 2.5, 0.6, 0.5, 'olive', { seg: 8, collide: false });
      b.beam(0.9, 0, 2.8, 3.4, 0, 2.9, 0.16, 'metal');
      for (const wx of [-2.6, -0.9, 0.9, 2.6]) for (const wy of [1.35, -1.35]) b.hcylinder(wx, wy, 0, 0.6, 0.4, Math.PI / 2, 'rubber', { collide: false, seg: 8 });
    } else if (kind === 'tractor') {
      b.box(0.8, 0, 0.7, 2.2, 1.2, 1.0, 0, 'rust', { top: 'rust' });
      b.box(-0.8, 0, 0.7, 1.4, 1.4, 1.8, 0, 'rust', { top: 'roof' });
      for (const s of [1, -1]) { b.hcylinder(-0.9, s * 0.95, 0, 0.8, 0.5, Math.PI / 2, 'rubber', { collide: false, seg: 10 }); b.hcylinder(1.2, s * 0.8, 0, 0.45, 0.3, Math.PI / 2, 'rubber', { collide: false, seg: 8 }); }
    }
    b.pop();
  }

  function gantry(b, x, y, z, yaw, h) {
    b.push(x, y, z, yaw);
    for (const s of [-1, 1]) {
      for (const f of [-1, 1]) b.beam(f * 0.9, s * 3.2, 0, f * 0.12, s * 3.2, h, 0.2, 'rust');
      b.beam(-0.55, s * 3.2, h * 0.4, 0.55, s * 3.2, h * 0.4, 0.12, 'rust');
      b.beam(-0.7, s * 3.2, h * 0.15, 0.3, s * 3.2, h * 0.62, 0.1, 'rust');
    }
    b.beam(0, -3.6, h, 0, 3.6, h, 0.35, 'rust');
    b.beam(0, -3.6, h - 1.2, 0, 3.6, h - 1.2, 0.2, 'rust');
    for (const s of [-2.2, 0, 2.2]) b.beam(0, s, h - 0.2, 0, s, h - 1.4, 0.12, 'metal');
    for (const s of [-1, 1]) b.collider(0, s * 3.2, 0, 1.2, 0.5, h * 0.6, 0, 'metal', false);
    b.pop();
  }

  function transformer(b, x, y, z, yaw) {
    b.push(x, y, z, yaw);
    b.box(0, 0, 0, 3.4, 2.4, 0.4, 0, 'concrete');
    b.box(0, 0, 0.4, 2.6, 1.8, 2.2, 0, 'rust', { top: 'metal' });
    for (let k = -1; k <= 1; k++) b.box(k * 0.8, 1.05, 0.6, 0.12, 0.3, 1.8, 0, 'metal', { collide: false });
    for (let k = -1; k <= 1; k++) { b.cylinder(k * 0.8, 0, 2.6, 0.14, 1.1, 'metal', { seg: 6, collide: false }); b.cylinder(k * 0.8, 0, 3.7, 0.25, 0.15, 'concrete', { seg: 6, collide: false }); }
    b.pop();
  }

  function burntHouse(b, x, y, z, yaw, w, d, seed, opts = {}) {
    const rnd = C.makeRandom(seed);
    b.push(x, y, z, yaw);
    const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
    for (let k = 0; k < 4; k++) {
      const [x0, y0] = corners[k], [x1, y1] = corners[(k + 1) % 4], len = Math.hypot(x1 - x0, y1 - y0);
      const segs = Math.max(2, Math.round(len / 2.2));
      for (let i = 0; i < segs; i++) {
        if (k === 0 && i === Math.floor(segs / 2)) continue;
        if (rnd() < 0.18) continue;
        const t0 = i / segs, t1 = (i + 1) / segs, h = 0.6 + rnd() * (opts.tall || 2.2);
        b.wall(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1, 0, h, 0.3, 'charred', { uv: 2 });
      }
    }
    b.box(0, 0, 0.02, w - 0.4, d - 0.4, 0.06, 0, 'charred', { faces: ['t'], collide: false });
    for (let k = 0; k < 4; k++) { const a = rnd() * TAU; b.beam(Math.cos(a) * w * 0.3, Math.sin(a) * d * 0.3, 0.1, Math.cos(a + 1) * w * 0.4, Math.sin(a + 1) * d * 0.4, 0.4 + rnd() * 1.6, 0.18, 'charred'); }
    if (opts.chimney) { b.box(w * 0.25, d * 0.15, 0, 1.0, 1.0, 4.2, 0, 'brick', { top: 'brick' }); }
    if (opts.attic) {
      for (const sx of [-w / 2 + 0.3, w / 2 - 0.3]) for (const sy of [-d / 2 + 0.3, d / 2 - 0.3]) b.box(sx, sy, 0, 0.3, 0.3, 2.8, 0, 'charred', { mat: 'wood' });
      b.box(0, 0, 2.8, w, d, 0.2, 0, 'charred', { top: 'darkplanks', mat: 'wood' });
      b.ramp(-w / 2 + 2.2, d / 2 - 1.3, 0, 3.6, 1.0, 2.8, Math.PI, 'darkplanks', { side: 'charred' });
      for (let k = 0; k < 5; k++) { const t = k / 4; b.beam(-w / 2 + t * w, -d / 2, 3.0, -w / 2 + t * w, 0, 4.8 + (k % 2) * 0.4, 0.16, 'charred'); b.beam(-w / 2 + t * w, d / 2, 3.0, -w / 2 + t * w, 0, 4.8, 0.16, 'charred'); }
    }
    b.pop();
  }

  function cabin(b, x, y, z, yaw, w, d, opts = {}) {
    b.push(x, y, z, yaw);
    b.room(0, 0, 0, w, d, 2.5, 0, { wall: opts.wall || 'planks', doors: { s: [opts.door || 0] }, windows: { e: [0], w: [0], n: [-1, 1] }, roof: opts.roof === false ? false : 'gable', roofTex: opts.roofTex || 'roof', floorTex: 'darkplanks', ceilTex: 'darkplanks', ridge: 1.3, gableTex: 'planks', zoneInfo: opts.zone || { name: 'Домик', shelter: true, dark: 0.45 } });
    if (opts.bunks) { bed(b, -w / 2 + 1.2, d / 2 - 0.7, 0, 0); bed(b, w / 2 - 1.2, d / 2 - 0.7, 0, 0); }
    b.pop();
  }

  function concreteFence(b, pts, z, gaps = [], fallen = []) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0), yaw = Math.atan2(y1 - y0, x1 - x0);
      const n = Math.max(1, Math.round(len / 3));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        if (gaps.some(([s, a, c]) => s === i && t * len > a && t * len < c)) continue;
        const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
        if (fallen.some(([s, kk]) => s === i && kk === k)) { b.box(cx - Math.sin(yaw) * 1.2, cy + Math.cos(yaw) * 1.2, z, len / n, 2.4, 0.2, yaw, 'fence', { top: 'fence' }); continue; }
        b.box(cx, cy, z, len / n - 0.05, 0.2, 2.4, yaw, 'fence', { top: 'concrete', uv: 2.4 });
      }
    }
  }

  function walkway(b, x0, y0, x1, y1, z, w, T) {
    const len = Math.hypot(x1 - x0, y1 - y0), yaw = Math.atan2(y1 - y0, x1 - x0);
    b.push(x0, y0, 0, yaw);
    for (let s = 0; s < len; s += 2) {
      const l = Math.min(2.05, len - s);
      b.box(s + l / 2, 0, z - 0.2, l, w, 0.2, 0, 'planks', { top: 'planks', uv: 1, faces: ['n', 's', 't', 'b'], collide: false });
      if (Math.round(s) % 6 === 0) for (const dy of [-w / 2 + 0.1, w / 2 - 0.1]) b.box(s + 1, dy, -2.5, 0.2, 0.2, z + 2.2, 0, 'logs', { collide: false });
    }
    b.collider(len / 2, 0, -2.5, len, w, z + 2.5, 0, 'wood', true);
    b.pop();
  }

  function mast(b, x, y, z, h) {
    b.beam(x, y, z - 0.3, x, y, z + h, 0.16, 'metal');
    b.beam(x - 0.5, y, z + h - 0.3, x + 0.5, y, z + h - 0.3, 0.08, 'metal');
    b.collider(x, y, z, 0.3, 0.3, h, 0, 'metal', false);
  }

  const PLACES = {
    skadovsk(b) {
      const o = P.skadovsk, gz = 0.7;
      b.push(o.x, o.y, gz, o.yaw);
      const spec = {
        x0: -42, x1: 42, sternX: -42, sternW: 5.2, sternFull: -32, w: 7, bowStart: 26, bowX: 42.5,
        bottom: -0.6, band: 2.2, top: 7.4, deck: 6.5, ceiling: 6.3, floor: 1.0, inner: [-38, 30],
        stations: [-38, -32, -28, -14, -12, -10, -5, 0.5, 4, 18, 26, 30],
        openings: [{ side: 's', x0: -12, x1: -10, z0: 1.0, z1: 3.4 }, { side: 'n', x0: -25.5, x1: -23.5, z0: 6.5, z1: 7.5 }],
        holes: [{ x0: -5, x1: 0.5, y0: 4.4, y1: 7 }],
        bulkheads: [{ x: -38 }, { x: -28, door: [-0.8, 0.8] }, { x: -14, door: [-0.8, 0.8] }, { x: 4, door: [-0.8, 0.8] }, { x: 18, door: [-0.8, 0.8] }, { x: 30 }]
      };
      buildHull(b, spec);
      b.ramp(-11, -8.6, 0, 3.0, 2.0, 1.0, Math.PI / 2, 'grate', { rails: true, side: 'metal' });
      b.ramp(-6, 5.6, 1.0, 12.4, 1.6, 5.5, 0, 'grate', { indoor: true, side: 'rust', rails: true });
      b.ramp(-14.5, 8.35, 0, 17.8, 1.5, 6.5, Math.PI, 'grate', { side: 'metal', rails: true });
      b.box(-24.5, 7.35, 6.2, 2.6, 0.7, 0.3, 0, 'grate', { top: 'grate' });
      b.push(-35, 0, 6.5, 0);
      b.room(0, 0, 0, 9, 8.6, 3.4, 0, { wall: 'hull', doors: { e: [0] }, windows: { n: [-2.5, 2.5], s: [-2.5, 2.5], w: [0] }, roof: 'flat', roofTex: 'rust', floorTex: 'deck', ceilTex: 'rust', zoneInfo: { name: 'Мостик', shelter: true, base: 'skadovsk' } });
      b.cylinder(-2, 0, 3.7, 1.2, 4.2, 'hullred', { seg: 10, uv: 2 });
      b.beam(2.5, 0, 3.7, 2.5, 0, 8.5, 0.2, 'metal');
      b.beam(1.2, 0, 7.8, 3.8, 0, 7.8, 0.15, 'metal');
      table(b, 1.5, -2.6, 0, 0);
      crate(b, -3.2, 3.2, 0, 0.9);
      b.marker('stash_bridge', -3.2, 2.2, 0.1);
      b.marker('guard_bridge', 2.6, 2.4, 0);
      b.lamp(0, 0, 3.3, 0.4);
      b.pop();
      b.beam(32, 0, 6.5, 32, 0, 22, 0.35, 'metal');
      b.beam(32, -3, 19, 32, 3, 19, 0.2, 'metal');
      b.lamp(32, 0, 22.3, 0.5, [1, 0.25, 0.2], { indoor: false, beacon: true });
      b.beam(10, -4, 6.5, 10, 0, 13, 0.25, 'rust');
      b.beam(10, 4, 6.5, 10, 0, 13, 0.25, 'rust');
      b.beam(10, 0, 12.5, 24, 0, 8.5, 0.2, 'rust');
      b.box(10, 0, 6.5, 3, 3, 1.4, 0, 'hullred', { top: 'metal' });
      for (const [x, y] of [[20, -3], [22, 3], [-18, 4], [-20, -4]]) crate(b, x, y, 6.5, 1.1, 0.3);
      barrel(b, 14, 4.5, 6.5); barrel(b, 14.8, 4.2, 6.5);
      b.marker('guard_deck1', 24, -2, 6.5, 0);
      b.marker('guard_deck2', -24, -4, 6.5, Math.PI);
      b.marker('deck_view', 36, 0, 6.5, 0);
      b.push(0, 0, 1.0, 0);
      b.box(1.2, -1.0, 0, 1.0, 5.5, 1.1, 0, 'darkplanks', { indoor: 'nsewt', top: 'planks', uv: 1 });
      b.box(3.6, -2.5, 0, 0.5, 2.6, 2.6, 0, 'bar', { indoor: 'nsewt', uv: 1.3, faces: ['w', 't'] });
      b.marker('beard', 2.6, -2.2, 0, Math.PI);
      table(b, -8, -3.5, 0); table(b, -8, 1.6, 0, 0.2); table(b, -3.5, -4.6, 0, 0);
      b.marker('bar1', -8, -4.6, 0, Math.PI / 2); b.marker('bar2', -8, -2.4, 0, -Math.PI / 2); b.marker('bar3', -7, 2.6, 0, -Math.PI / 2);
      b.marker('bar4', -3.5, -5.6, 0, Math.PI / 2); b.marker('bar5', -9.5, 1.5, 0, 0); b.marker('bar_guitar', -12.5, -1.5, 0, 0);
      b.lamp(-8, -1, 5.2, 0.45); b.lamp(0, -2, 5.2, 0.45); b.lamp(-4, 3, 5.2, 0.3, [1, 0.8, 0.5], { flicker: true });
      b.zone(-5, 0, 0, 18, 13.4, 5.3, 0, { name: 'Бар «Скадовск»', shelter: true, base: 'skadovsk', safe: true });
      b.marker('entrance_in', -11, -4.5, 0, Math.PI / 2);
      crate(b, 11, 5, 0, 1.2); crate(b, 12.3, 5.2, 0, 0.9, 0.4); crate(b, 11.2, 5.2, 1.2, 0.8, 0.2);
      table(b, 9, -3, 0, Math.PI / 2);
      b.box(15.5, -5.2, 0, 3, 1.0, 2.2, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('owl', 9.8, -3, 0, Math.PI);
      b.marker('nimble', 14, 3.5, 0, -Math.PI / 2);
      b.marker('owl_guard', 6, 4.5, 0, 0);
      b.lamp(10, 0, 5.2, 0.4);
      b.zone(11, 0, 0, 14, 13.4, 5.3, 0, { name: 'Каюта Сыча', shelter: true, base: 'skadovsk', safe: true });
      bed(b, 21, -5.4, 0, 0); bed(b, 25, -5, 0, 0.3); bed(b, 21, 5.2, 0, 0); bed(b, 25.5, 4.6, 0, -0.3);
      b.marker('sleep', 21.5, -4.4, 0, 0);
      b.marker('zveroboy', 26.5, 0, 0, Math.PI);
      b.marker('lotsman_home', 23, 3.6, 0, -Math.PI / 2);
      b.lamp(24, 0, 5.2, 0.3, [1, 0.8, 0.5], { flicker: true });
      b.zone(24, 0, 0, 12, 12, 5.3, 0, { name: 'Кубрик', shelter: true, base: 'skadovsk', safe: true, sleep: true });
      b.box(-21, -4.6, 0, 3, 1.4, 1.0, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.box(-19, 4.8, 0, 2.2, 1.2, 1.9, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      table(b, -22, 0.5, 0, 0.1);
      b.marker('sultan', -24.5, 0.5, 0, 0);
      b.marker('bandit1', -20, 2.6, 0, -2.4); b.marker('bandit2', -19.5, -2.8, 0, 2.2); b.marker('bandit3', -15.5, 1.5, 0, Math.PI);
      b.lamp(-21, 0, 5.2, 0.35, [1, 0.7, 0.45], { flicker: true });
      b.zone(-21, 0, 0, 14, 13.4, 5.3, 0, { name: 'Трюм Султана', shelter: true, base: 'skadovsk', safe: true });
      b.box(-35, 2.5, 0, 3.2, 2.2, 1.6, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.box(-31, -4.2, 0, 1.4, 1.6, 0.95, 0, 'darkplanks', { indoor: 'nsewt', top: 'metal', uv: 1 });
      b.hcylinder(-34.5, -2.5, 0, 0.9, 3.2, 0, 'rust', { flags: FLAG.INDOOR });
      b.marker('cardan', -31, -3, 0, 0);
      b.marker('workbench', -31, -4.2, 1.0, 0);
      b.lamp(-33, 0, 5.2, 0.4);
      b.zone(-33, 0, 0, 10, 11, 5.3, 0, { name: 'Мастерская Кардана', shelter: true, base: 'skadovsk', safe: true });
      b.pop();
      b.marker('outside_door', -11, -12.5, 0, -Math.PI / 2);
      b.marker('campfire_skadovsk', -22, -16, 0, 0);
      b.marker('guard_out1', -14, -14, 0, -Math.PI / 2);
      b.marker('guard_out2', 12, -12, 0, -Math.PI / 2);
      barrel(b, -16, -12, 0); barrel(b, -16.8, -12.4, 0);
      vehicle(b, 22, -18, 0, 0.4, 'zil');
      b.box(-30, -14, 0, 0.3, 6, 1.1, 0, 'planks', { uv: 1.1 });
      b.lamp(-11, -10.4, 3.2, 0.35, [1, 0.8, 0.5], { indoor: false });
      b.zone(-11, -9, 0, 8, 6, 4, 0, { name: 'Вход', base: 'skadovsk', safe: true, indoor: false });
      b.pop();
      b.push(615, 699, -0.4, 2.1);
      buildHull(b, { x0: -8, x1: 8, sternX: -8, sternW: 2.4, sternFull: -6, w: 3, bowStart: 4, bowX: 8.3, bottom: -1, band: 0.4, top: 1.8, deck: 1.0, ceiling: 0.9, floor: 0.2, inner: [99, 99], stations: [], openings: [], holes: [{ x0: -6, x1: 3, y0: -2.4, y1: 2.4 }], bulkheads: [], noFloor: true, tex: 'rust' });
      b.pop();
    },

    shevchenko(b) {
      const o = P.shevchenko;
      b.push(o.x, o.y, 0, o.yaw);
      const specA = {
        x0: -30, x1: 7, sternX: -30, sternW: 4.4, sternFull: -22, w: 6, bowStart: 18, bowX: 30,
        bottom: -3.0, band: -0.2, top: 4.3, deck: 3.5, ceiling: 3.3, floor: -0.55, inner: [-27, 7],
        stations: [-27, -16, -14, -8, -6, 2, 7], openEnd: true,
        openings: [{ side: 's', x0: -8, x1: -6, z0: -0.55, z1: 1.8 }],
        holes: [{ x0: -14, x1: -11, y0: 2.6, y1: 6 }],
        bulkheads: [{ x: -27 }, { x: -16, door: [-0.8, 0.8] }], tex: 'hull'
      };
      buildHull(b, specA);
      b.ramp(-17.5, 3.6, -0.55, 8, 1.4, 4.05, 0, 'grate', { indoor: true, side: 'rust' });
      b.push(-24, 0, 3.5, 0);
      b.room(0, 0, 0, 6, 6, 3.0, 0, { wall: 'hull', doors: { e: [0] }, windows: { n: [0], s: [0] }, roof: 'flat', roofTex: 'rust', floorTex: 'deck', ceilTex: 'rust', zoneInfo: { name: 'Рубка «Шевченко»', shelter: true } });
      b.marker('shev_stash', -2, 2, 0.1);
      b.marker('camp_shev', 0.5, -1, 0);
      b.pop();
      b.marker('shev_engine', -24, -3, -0.2);
      b.marker('shev_zharka', -22, 1.5, -0.55);
      b.zone(-21.5, 0, -0.55, 10, 8, 3.8, 0, { name: 'Машинное отделение', shelter: true, dark: 0.45 });
      b.zone(-4.5, 0, -0.55, 22, 10, 3.8, 0, { name: 'Трюм «Шевченко»', shelter: true, dark: 0.6 });
      b.hcylinder(-22, -2, -0.55, 0.9, 3.6, 0, 'rust', { flags: FLAG.INDOOR });
      crate(b, -2, 3.5, -0.55, 1.1); crate(b, 0, 3.8, -0.55, 1.1, 0.4); crate(b, -1, 3.6, 0.55, 0.9);
      container(b, -6, -2.2, 3.5, 0.05, 'rust'); container(b, -16, 2.4, 3.5, -0.03);
      b.lamp(-21, 0, 3.0, 0.3, [1, 0.6, 0.3], { flicker: true });
      b.pop();
      b.push(o.x, o.y, 0, o.yaw);
      b.push(11, 0.8, 0.05, 0.12);
      const specB = {
        x0: 0, x1: 19, sternX: -10, sternW: 6, sternFull: -9, w: 6, bowStart: 7, bowX: 19.5,
        bottom: -3.0, band: -0.2, top: 4.4, deck: 3.6, ceiling: 3.4, floor: -0.5, inner: [0, 12],
        stations: [0, 4, 7, 12], closedStern: false, openings: [], holes: [], bulkheads: [{ x: 12 }]
      };
      buildHull(b, specB);
      b.marker('lotsman_trap', 6, 0, -0.5, Math.PI);
      b.zone(6, 0, -0.5, 12, 10, 3.8, 0, { name: 'Носовой отсек', shelter: true, dark: 0.5 });
      b.pop();
      b.pop();
      for (const [x, y, a, Lb] of [[561, 534, 0.55, 14], [527, 535, 1.4, 7], [540, 532, -0.2, 6]]) {
        b.push(x, y, -0.5, a);
        buildHull(b, { x0: -Lb / 2, x1: Lb / 2, sternX: -Lb / 2, sternW: 1.6, sternFull: -Lb / 2 + 1, w: Lb > 10 ? 3.4 : 1.8, bowStart: Lb / 2 - 2, bowX: Lb / 2 + 0.1, bottom: -0.8, band: 0.1, top: 1.2, deck: 0.3, ceiling: 0.2, floor: 0.0, inner: [99, 99], stations: [], openings: [], holes: [{ x0: -Lb / 2 + 0.5, x1: Lb / 2 - 1, y0: -1.2, y1: 1.2 }], bulkheads: [], noFloor: true, tex: 'rust' });
        b.pop();
      }
    },

    noah(b, T) {
      const o = P.noah;
      b.push(o.x, o.y, 0, 0);
      b.box(0, 0, -1.4, 30, 9, 2.8, 0, 'rust', { top: 'deck', uv: 2 });
      b.box(0, 0, 1.4, 30.2, 9.2, 0.6, 0, 'hullred', { faces: ['n', 's', 'e', 'w'], collide: false });
      b.push(-4, 0, 1.4, 0);
      b.room(0, 0, 0, 9, 6, 2.6, 0, { wall: 'planks', doors: { e: [0] }, windows: { n: [-2], s: [2] }, roof: 'gable', roofTex: 'roof', floorTex: 'darkplanks', ceilTex: 'darkplanks', ridge: 1.4, gableTex: 'planks', zoneInfo: { name: 'Хижина Ноя', shelter: true, safe: true } });
      table(b, -2.5, 1.5, 0, 0);
      bed(b, -2.8, -1.8, 0, 0);
      b.marker('noah', 0.5, 1.2, 0, Math.PI);
      b.marker('noah_stash', -3.5, 2.2, 0.1);
      b.lamp(0, 0, 2.5, 0.3, [1, 0.8, 0.5], { flicker: true });
      b.pop();
      for (const sx of [-15, 15]) for (const sy of [-4.5, 4.5]) b.box(sx * 0.98, sy * 0.98, 1.4, 0.15, 0.15, 1.2, 0, 'metal', { collide: false });
      b.wall(-14.8, 4.4, 14.8, 4.4, 1.4, 1.0, 0.1, 'planks', { collide: true });
      b.wall(14.8, -4.4, 14.8, 4.4, 1.4, 1.0, 0.1, 'planks');
      b.wall(-14.8, -4.4, -14.8, 4.4, 1.4, 1.0, 0.1, 'planks');
      b.wall(-14.8, -4.4, 14.8, -4.4, 1.4, 1.0, 0.1, 'planks', { openings: [{ a: 18.8, b: 21.2, z0: 0, z1: 2 }] });
      barrel(b, 8, 3, 1.4); crate(b, 10, 2.5, 1.4, 1.1); crate(b, 11.2, 2.7, 1.4, 0.8, 0.5);
      b.marker('noah_deck', 6, 0, 1.4, 0);
      b.marker('noah_dog', 5, -1.5, 1.4, 0);
      b.pop();
      walkway(b, o.x + 5, o.y - 4.6, o.x + 5, o.y - 16, 1.4, 1.8, T);
      b.marker('noah_pier', o.x + 5, o.y - 18, 1.4);
    },

    stoyanka(b, T) {
      const o = P.stoyanka, gz = 1.4;
      b.push(o.x, o.y, gz, 0);
      b.box(0, 25.6, -3.0, 50, 1.4, 3.0, 0, 'concrete', { top: 'concrete', uv: 3 });
      for (let k = -4; k <= 4; k++) b.cylinder(k * 5.5, 26.4, -0.2, 0.25, 0.6, 'metal', { seg: 6, collide: false });
      container(b, -12, 6, 0, 0.1, 'rust'); container(b, -12, 3.4, 0, 0.12); container(b, 10, -6, 0, 1.45, 'corrugated');
      b.box(-14.9, 6, 0, 0.1, 2.0, 2.2, 0.1, 'rust', { collide: false });
      b.marker('stoyanka_case', -14, 6.1, 0.1);
      crate(b, 4, 8, 0, 1.1, 0.3); crate(b, 5.2, 8.3, 0, 0.9, 0.7); barrel(b, 8, 10, 0);
      vehicle(b, 14, 10, 0, 2.6, 'uaz');
      b.marker('camp_stoyanka', 0, -4, 0);
      b.pop();
    },

    cranes(b, T) {
      const o = P.cranes, gz = 2.2;
      b.push(702, 528, 0, 0);
      b.box(-12.6, 0, -2.4, 1.2, 88, gz + 2.4, 0, 'concrete', { top: 'concrete', uv: 3 });
      for (const y of [-44, -22, 0, 22, 44]) b.cylinder(-12.6, y, gz, 0.3, 0.6, 'metal', { seg: 6, collide: false });
      for (const s of [-1, 1]) b.box(-6.5 + s * 3.2, 0, gz, 0.4, 86, 0.15, 0, 'rails', { collide: false });
      b.pop();
      const crane = (cy, tall, cabin) => {
        b.push(695.5, cy, gz, Math.PI);
        for (const [x, y] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) b.beam(x, y, 0, x * 0.45, y * 0.45, 12, 0.4, 'stripes');
        b.box(0, 0, 12, 4.2, 4.2, 0.4, 0, 'metal', { top: 'grate' });
        b.lattice(0, 0, 12.4, 1.6, 1.4, tall ? 8 : 6, 'rust', { step: 2 });
        b.box(0, 0, tall ? 20.4 : 18.4, 3.4, 3.0, 2.6, 0, 'rust', { top: 'rust', indoor: '' });
        b.beam(0, 0, tall ? 22 : 20, tall ? 24 : 20, 0, tall ? 27 : 23, 0.5, 'rust');
        b.beam(0, 0, tall ? 22 : 20, -6, 0, tall ? 22.5 : 20.5, 0.5, 'rust');
        b.box(-6.5, 0, tall ? 21.2 : 19.2, 2, 2, 2, 0, 'concrete', { collide: false });
        b.beam(tall ? 22 : 18, 0, tall ? 26.5 : 22.5, tall ? 22 : 18, 0, 5, 0.06, 'metal');
        if (cabin) {
          b.ramp(0, -4.4, 0, 8, 1.2, 4, 0, 'grate', { side: 'metal', rails: true });
          b.box(5.1, -4.4, 3.8, 2.2, 1.4, 0.2, 0, 'grate', { top: 'grate' });
          b.ramp(0, -5.9, 4, 8, 1.2, 4, Math.PI, 'grate', { side: 'metal', rails: true });
          b.box(-5.1, -5.2, 7.8, 2.2, 2.8, 0.2, 0, 'grate', { top: 'grate' });
          b.ramp(0, -4.4, 8, 8, 1.2, 4.2, 0, 'grate', { side: 'metal', rails: true });
          b.box(4.8, -3.2, 12, 1.8, 3.4, 0.2, 0, 'grate', { top: 'grate' });
          b.ramp(1.4, -1.1, 12.4, 1.4, 1.0, 0.1, 0, 'grate', {});
          b.box(0, 0, 12.4, 1.2, 1.2, 0.2, 0, 'grate', { top: 'grate', collide: false });
          b.ramp(0.2, 2.2, 12.4, 5.5, 0.9, 8.0, Math.PI / 2, 'grate', { side: 'metal' });
          b.marker('crane_cabin', 0, 0, 20.6, 0);
          b.marker('crane_artifact', 1.2, 0.8, 20.6);
          b.zone(0, 0, 20.4, 3.2, 2.8, 2.6, 0, { name: 'Кабина крана', shelter: true });
        }
        b.pop();
      };
      crane(548, true, true); crane(507, false, false);
      b.push(713, 528, gz, -0.05);
      b.room(0, 0, 0, 8, 6, 2.8, 0, { wall: 'whitebrick', doors: { w: [0] }, windows: { s: [1.5], n: [-1.5] }, roof: 'flat', roofTex: 'roof', floorTex: 'tile', zoneInfo: { name: 'Домик у кранов', shelter: true, dark: 0.35 } });
      table(b, 1.8, 1.5, 0, 0); bed(b, 2.2, -1.8, 0, 0);
      b.box(-2.8, 2.2, 0, 1.6, 0.6, 1.9, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('port_stash', -2.6, 1.6, 0.1);
      b.marker('port_inside', 0, 0, 0);
      b.lamp(0, 0, 2.7, 0.3, [0.8, 1, 0.8], { flicker: true });
      b.pop();
      container(b, 716, 545, gz, 1.5); container(b, 719, 545.2, gz, 1.52, 'rust'); container(b, 717.4, 545.1, gz + 2.5, 1.55);
      container(b, 714, 512, gz, 0.1, 'rust');
      vehicle(b, 709, 497, gz, 1.75, 'zil');
      b.marker('camp_cranes', 706, 488, gz);
    },

    forestry(b, T) {
      const o = P.forestry, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.push(-14, 52, 0, 0);
      b.room(0, 0, 0, 22, 12, 3.2, 0, { wall: 'whitebrick', doors: { s: [-6, 5] }, windows: { s: [-1, 9], n: [-8, -3, 3, 8], e: [0], w: [0] }, roof: 'gable', roofTex: 'slate', floorTex: 'planks', ridge: 2.6, zoneInfo: { name: 'Контора лесничества', shelter: true, dark: 0.3 } });
      b.box(-2, 0, 0, 0.25, 11.6, 3.2, 0, 'plaster', { indoor: 'nsewt', mat: 'concrete' });
      table(b, -6, 3, 0, 0); table(b, 6, 3.4, 0, 0.1);
      b.box(9.6, -4.2, 0, 1.4, 1.4, 1.8, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('forestry_office', -6, 1.6, 0, Math.PI / 2);
      b.pop();
      b.push(28, 48, 0, 0);
      b.room(0, 0, 0, 20, 16, 5, 0, { wall: 'panel', doors: { s: [0] }, windows: { e: [-3, 3], w: [-3, 3] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 2, zoneInfo: { name: 'Гараж лесничества', shelter: true, dark: 0.5 } });
      vehicle(b, -3, 1, 0, 0.1, 'tractor');
      b.pop();
      b.push(25, -1, 0, Math.PI / 2);
      b.room(0, 0, 0, 40, 13, 5.5, 0, { wall: 'whitebrick', doors: { s: [-12, 6], n: [14] }, windows: { s: [-4, 0, 12, 16], n: [-14, -8, -2, 4] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 1.4, zoneInfo: { name: 'Цех лесничества', shelter: true, dark: 0.4 } });
      for (const x of [-12, -4, 4, 12]) b.box(x, 3.5, 0, 4, 2.2, 1.4, 0, 'metal', { indoor: 'nsewt', top: 'rust', uv: 1 });
      b.box(-12, 3.5, 1.4, 0.8, 0.8, 0.4, 0, 'sign', { indoor: 'nsewt', collide: false });
      b.marker('forestry_stash', -13.6, 4.9, 0.1);
      b.pop();
      b.push(-13, -30, 0, Math.PI / 2);
      b.room(0, 0, 0, 44, 15, 4.6, 0, { wall: 'brick', doors: { s: [-16, 10], n: [0] }, windows: { s: [-8, 0, 16], n: [-14, -7, 7, 14] }, roof: 'gable', roofTex: 'roof', floorTex: 'concrete', ridge: 3, doorW: 1.4, zoneInfo: { name: 'Склад лесничества', shelter: true, dark: 0.5 } });
      logPile(b, -10, 3, 0, 0); logPile(b, 6, 3, 0, 0);
      b.pop();
      b.push(16, -40, 0, 0);
      b.room(0, 0, 0, 20, 16, 4.2, 0, { wall: 'planks', doors: { w: [0], e: [3] }, windows: { n: [-4, 4], s: [-4, 4] }, roof: 'gable', roofTex: 'roof', floorTex: 'darkplanks', ridge: 3.2, gableTex: 'planks', zoneInfo: { name: 'Амбар с печами', shelter: true, dark: 0.55 } });
      for (const x of [-6, 0, 6]) { b.box(x, 4.6, 0, 3, 2.6, 2.2, 0, 'brick', { indoor: 'nsewt', top: 'brick', uv: 1 }); b.box(x, 5.4, 2.2, 0.9, 0.9, 4.6, 0, 'brick', { indoor: 'nsewt', collide: false }); }
      b.pop();
      b.push(40, -56, 0, 0);
      b.room(0, 0, 0, 22, 18, 5, 0, { wall: 'corrugated', doors: { n: [-5] }, windows: { e: [0] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 2, zoneInfo: { name: 'Ангар лесничества', shelter: true, dark: 0.5 } });
      container(b, 3, 3, 0, 0.05); crate(b, -6, 5, 0, 1.2); crate(b, -7.3, 5.2, 0, 1.0, 0.4);
      b.pop();
      b.push(-50, -30, 0, 0);
      b.box(0, 0, 3.2, 10, 40, 0.3, 0, 'corrugated', { top: 'roof', collide: false });
      for (const y of [-18, -6, 6, 18]) for (const x of [-4.6, 4.6]) b.beam(x, y, 0, x, y, 3.2, 0.25, 'rust');
      vehicle(b, 0, -8, 0, Math.PI / 2, 'tractor'); b.box(0, 8, 0, 3, 5, 1.6, 0, 'rust', { top: 'metal' });
      b.pop();
      vehicle(b, 2, -30, 0, 1.6, 'zil');
      b.marker('forestry_truck', 2, -32, 1.6);
      fenceLine(b, [[-60, 34], [-60, 66], [56, 66], [56, -66], [-60, -66], [-60, 18]], 0, 1.8, 'fence', [{ seg: 2, a: 40, b: 50 }, { seg: 3, a: 58, b: 69 }]);
      b.marker('forestry_yard', -12, 18, 0);
      b.marker('camp_forestry', -20, 26, 0);
      b.pop();
    },

    bridge(b, T) {
      const B = M.BRIDGE, x = B.x, half = B.w / 2, z = B.z, [g0, g1] = B.gap;
      const deck = (ya, yb, xa, xc) => b.box(x + (xa + xc) / 2, (ya + yb) / 2, z - 0.8, xc - xa, yb - ya, 0.8, 0, 'concrete', { top: 'concrete', uv: 3, mat: 'concrete' });
      deck(B.y0, g0, -half, half); deck(g0, g1, 0.6, half); deck(g1, B.y1, -half, half);
      for (const [ya, yb] of [[B.y0, g0 - 1.5], [g1 + 1.2, B.y1]]) b.box(x - half + 0.15, (ya + yb) / 2, z, 0.3, yb - ya, 0.9, 0, 'concrete', { top: 'concrete', mat: 'concrete' });
      b.box(x + half - 0.15, (B.y0 + B.y1) / 2, z, 0.3, B.y1 - B.y0, 0.9, 0, 'concrete', { top: 'concrete', mat: 'concrete' });
      for (const s of [-1, 1]) b.beam(x + s * (half - 0.5), B.y0, z - 1.1, x + s * (half - 0.5), B.y1, z - 1.1, 0.7, 'rust');
      for (let y = B.y0 + 12; y < B.y1 - 6; y += 22) {
        const g = T.heightAt(x, y);
        if (g > z - 2.5) continue;
        b.box(x, y, g - 0.6, 2.2, B.w - 1.2, z - 0.8 - g + 0.6, 0, 'concrete', { top: 'concrete' });
        b.box(x, y, z - 1.6, 2.8, B.w + 0.4, 0.8, 0, 'concrete', { collide: false });
      }
      for (const [ya, za, yb, zb, a] of [[g0 - 0.2, z - 0.4, g0 + 3.6, z - 3.4, 0.6], [g1 + 0.2, z - 0.4, g1 - 3.4, z - 3.0, -0.4]]) b.beam(x - 2.2, ya, za, x - 2.4 + a, yb, zb, 1.2, 'concrete');
      const px = x - half + 0.9;
      for (const y of [g0 - 0.6, g1 + 0.6]) b.beam(px, y, z - 0.9, px, y, z + 0.25, 0.14, 'metal');
      for (let y = B.y1; y > B.y0; y -= 6) tube(b, [px, y, z + 0.55], [px, y - 6, z + 0.55], 0.32, 'rust', 6);
      for (let y = B.y1 - 3; y > B.y0; y -= 6) b.beam(px, y, z, px, y, z + 0.25, 0.14, 'metal');
      b.collider(px, (B.y0 + B.y1) / 2, z, 0.7, B.y1 - B.y0, 0.88, 0, 'metal', true);
      vehicle(b, x - 1.5, 290, z, Math.PI / 2 + 0.06, 'uaz');
      vehicle(b, x - 1.2, 310, z, Math.PI / 2 - 0.04, 'btr');
      vehicle(b, x - 1.6, 384, z, Math.PI / 2 + 0.02, 'zil');
      vehicle(b, x - 1.4, 412, z, Math.PI / 2 + 0.08, 'uaz');
      b.marker('bridge_truck', x - 1.6, 382, z + 1.3);
      const fz = T.heightAt(x - 3, g0 + 4);
      vehicle(b, x - 3, g0 + 4, Math.max(fz, -0.4), 1.2, 'uaz');
      b.marker('bridge_fallen', x - 1.2, g0 + 4, Math.max(fz, -0.4) + 0.6);
      for (const [ya, yb] of [[B.y0, B.y0 + 1], [B.y1 - 1, B.y1]]) { const g = Math.min(T.heightAt(x, ya), T.heightAt(x, yb)); if (g < z - 1) b.box(x, (ya + yb) / 2, g - 0.5, B.w + 1, 1.2, z - g + 0.5, 0, 'concrete', { top: 'concrete' }); }
    },

    station(b, T) {
      const o = P.station, gz = 3.2;
      b.push(o.x, o.y, gz, 0);
      const cy = 26, hw = 56.5, hd = 20.5;
      for (const [ax, ay, bx, by] of [[-hw, -hd, hw, -hd], [hw, -hd, hw, hd], [hw, hd, -hw, hd], [-hw, hd, -hw, -hd]]) b.wall(ax, cy + ay, bx, cy + by, -0.2, 0.9, 0.6, 'concrete', {});
      for (let k = -4; k <= 4; k++) b.box(k * 12, cy + hd, 0.7, 0.15, 0.15, 1.0, 0, 'metal', { collide: false });
      b.box(44, cy + 15, -3.4, 9, 7, 4.1, 0, 'concrete', { top: 'grate' });
      b.push(-2, -4, 0, 0);
      b.room(0, 0, 0, 40, 10, 4.2, 0, { wall: 'panel', doors: { s: [-12, 10], n: [0] }, windows: { s: [-16, -4, 4, 16], n: [-14, -8, 8, 14] }, roof: false, floorTex: 'tile', ceilTex: 'plaster', zoneInfo: { name: 'Фильтровальный корпус', shelter: true, dark: 0.35 } });
      b.box(0, 0, 4.2, 40.6, 10.6, 5, 0, 'panel', { top: 'roof', faces: ['n', 's', 'e', 'w', 't'] });
      b.quad([[-20, 5, 4.2], [20, 5, 4.2], [20, -5, 4.2], [-20, -5, 4.2]], 'plaster', { planar: true, flags: FLAG.INDOOR });
      for (const x of [-14, -6, 2, 10]) b.cylinder(x, 1.8, 0, 1.4, 3.4, 'rust', { seg: 10, flags: FLAG.INDOOR, capTex: 'metal' });
      b.marker('wps_merc1', -10, -2.5, 0, -Math.PI / 2);
      b.marker('wps_stash', 17.6, 3.6, 0.1);
      crate(b, 17.6, 3.6, 0, 0.8);
      b.lamp(-8, 0, 4.0, 0.3, [1, 0.8, 0.6], { flicker: true });
      b.pop();
      for (const x of [-12, -6, 0]) { b.cylinder(x, -14, 0, 1.6, 5, 'rust', { seg: 10, capTex: 'metal' }); b.beam(x, -12.4, 4.6, x, -9.2, 4.6, 0.3, 'rust'); }
      b.push(10, -37, 0, 0);
      b.room(0, 0, 0, 52, 12, 4.4, 0, { wall: 'whitebrick', doors: { n: [-18, 12], s: [0] }, windows: { n: [-10, -2, 4, 20], s: [-20, -12, 12, 20], e: [0], w: [0] }, roof: false, floorTex: 'tile', ceilTex: 'plaster', zoneInfo: { name: 'Главный корпус станции', shelter: true, dark: 0.3 } });
      b.box(0, 0, 4.4, 52.6, 12.6, 6.6, 0, 'whitebrick', { top: 'roof', faces: ['n', 's', 'e', 'w', 't'] });
      b.quad([[-26, 6, 4.4], [26, 6, 4.4], [26, -6, 4.4], [-26, -6, 4.4]], 'plaster', { planar: true, flags: FLAG.INDOOR });
      for (let k = -2; k <= 2; k++) b.box(k * 9, 3.2, 0, 4, 2, 1.6, 0, 'metal', { indoor: 'nsewt', top: 'rust', uv: 1 });
      b.marker('wps_merc2', -6, -2, 0, Math.PI / 2);
      b.marker('wps_laptop', 18, 3.2, 0.8);
      table(b, 18, 3.4, 0, 0);
      b.lamp(0, 0, 4.2, 0.35); b.lamp(-18, 0, 4.2, 0.3, [1, 0.8, 0.5], { flicker: true });
      b.pop();
      for (const s of [-1, 1]) b.box(44 + s * 9.5, 76, -3.4, 1.2, 46, 4.2, 0, 'concrete', { top: 'concrete' });
      concreteFence(b, [[-88, 52], [-88, -62], [88, -62], [88, 52], [-70, 52]], 0, [[1, 34, 48], [2, 20, 28]], [[0, 10], [1, 30], [2, 6], [3, 3], [3, 31]]);
      b.marker('wps_merc3', -80, 40, 0, Math.PI / 2);
      b.marker('wps_merc4', 70, -50, 0, 0);
      b.marker('station_gate', -79, 48, 0, -Math.PI / 2);
      b.pop();
      for (const x of [781, 786, 791]) tube(b, [x, 145, gz + 0.45], [x, 92, T.heightAt(x, 92) + 0.45], 0.45, 'rust', 6);
      for (const x of [781, 786, 791]) b.collider(x, 118, Math.min(gz, T.heightAt(x, 92)), 1.0, 53, Math.max(gz, T.heightAt(x, 92)) - Math.min(gz, T.heightAt(x, 92)) + 0.9, Math.PI / 2, 'metal', false);
      b.box(786, 88, T.heightAt(786, 88) - 1.5, 14, 6, 2.6, 0, 'concrete', { top: 'grate' });
    },

    substation(b, T) {
      const o = P.substation, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.push(0, 10, 0, 0);
      const L = 26, Wd = 12;
      b.room(0, 0, 0, L, Wd, 3.4, 0, { wall: 'brick', doors: { s: [-8, 6] }, windows: { s: [-2, 10], n: [-9, -3, 3, 9], e: [0], w: [0] }, floorTex: 'tile', ceilTex: 'plaster', roof: false, zoneInfo: { name: 'Контора подстанции, 1 этаж', shelter: true } });
      b.box(-4, 0, 0, 0.25, Wd - 0.3, 3.4, 0, 'plaster', { indoor: 'nsewt', mat: 'concrete' });
      b.push(0, 0, 3.4, 0);
      b.box(0, -3.2, -0.2, L - 0.2, Wd / 2 - 0.4, 0.2, 0, 'concrete', { indoor: 'b', top: 'tile', faces: ['t', 'b'] });
      b.box(-2, 3.6, -0.2, L - 4.2, Wd / 2 - 1.6, 0.2, 0, 'concrete', { indoor: 'b', top: 'tile', faces: ['t', 'b'] });
      b.box(0, 0, -0.2, L - 0.2, 0.6, 0.2, 0, 'concrete', { indoor: 'b', top: 'tile', faces: ['t', 'b'] });
      b.box(10.5, 4.4, -0.2, 4, 3.2, 0.2, 0, 'concrete', { indoor: 'tb', top: 'tile', faces: ['t', 'b'], collide: false });
      b.room(0, 0, 0, L, Wd, 3.2, 0, { wall: 'brick', doors: {}, windows: { s: [-10, -4, 2, 8], n: [-9, -3, 3, 9], e: [0], w: [0] }, floor: false, ceilTex: 'plaster', roof: 'flat', roofTex: 'roof', zoneInfo: { name: 'Контора подстанции, 2 этаж', shelter: true } });
      b.pop();
      b.ramp(9.6, 4.4, 0, 6, 1.4, 3.4, Math.PI, 'concrete', { indoor: true, side: 'concrete', rails: true });
      b.marker('tesak', -8, 2, 3.4, -Math.PI / 2);
      b.marker('merc_up1', 4, -3, 3.4, -Math.PI / 2);
      b.marker('merc_up2', -10, -3.6, 3.4, -Math.PI / 2);
      table(b, -8, 3.5, 3.4, 0);
      b.marker('blackbox', -10, 3.8, 0.8);
      crate(b, -10.5, 4, 0, 0.8, 0, 'metal');
      crate(b, -11.5, 4, 0, 0.8, 0.2, 'metal');
      b.box(-11.6, -1.5, 0, 1.0, 2.2, 1.9, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('merc_in1', 2, 2, 0, -Math.PI / 2);
      b.marker('merc_in2', -6, -3.5, 0, 0);
      b.lamp(-8, 0, 3.1, 0.35); b.lamp(4, 0, 3.1, 0.35); b.lamp(-4, 0, 6.5, 0.35);
      b.pop();
      b.push(0, -18, 0, 0);
      b.room(0, 0, 0, 48, 12, 5.2, 0, { wall: 'whitebrick', doors: { n: [-14, 10] }, windows: { n: [-20, -4, 4, 20], s: [-18, -10, -2, 6, 14] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 1.4, zoneInfo: { name: 'Цех подстанции', shelter: true, dark: 0.4 } });
      for (const x of [-16, -6, 4, 14]) b.box(x, -3, 0, 5, 2.4, 1.8, 0, 'metal', { indoor: 'nsewt', top: 'rust', uv: 1 });
      b.marker('sub_hall', 0, 1, 0);
      b.pop();
      b.push(52, -6, 0, 0);
      b.room(0, 0, 0, 20, 20, 5.6, 0, { wall: 'panel', doors: { w: [-4] }, windows: { e: [-4, 4], n: [0] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 1.6, zoneInfo: { name: 'Склад подстанции', shelter: true, dark: 0.5 } });
      container(b, 2, 4, 0, 0.1); crate(b, -5, -6, 0, 1.2); crate(b, -6.2, -5.6, 0, 1.0, 0.3);
      b.pop();
      b.push(-56, 52, 0, Math.PI / 2);
      b.room(0, 0, 0, 40, 14, 5, 0, { wall: 'whitebrick', doors: { n: [-10, 12] }, windows: { n: [-16, 0, 6], s: [-14, -4, 6, 14] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', doorW: 1.6, zoneInfo: { name: 'Ремонтный цех', shelter: true, dark: 0.5 } });
      vehicle(b, -8, 1, 0, 0, 'zil');
      b.pop();
      b.push(-54, 104, 0, Math.PI / 2);
      b.room(0, 0, 0, 30, 14, 4.6, 0, { wall: 'panel', doors: { n: [6] }, windows: { n: [-8, -2], s: [-6, 6] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', zoneInfo: { name: 'Гаражи подстанции', shelter: true, dark: 0.55 } });
      b.pop();
      b.push(-34, 24, 0, 0);
      for (const [x, y] of [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]]) b.box(x, y, 0, 0.3, 0.3, 5.0, 0, 'metal', { mat: 'metal' });
      b.box(0, 0, 5.0, 3.2, 3.2, 0.2, 0, 'metal', { top: 'grate' });
      b.box(0, -1.6, 5.2, 3.2, 0.1, 1.0, 0, 'metal', { collide: false });
      b.box(0, 0, 7.4, 3.6, 3.6, 0.15, 0, 'corrugated', { collide: false });
      b.ramp(3.8, 0.9, 0, 6.0, 1.0, 5.2, Math.PI, 'grate', { side: 'metal', rails: true });
      b.marker('merc_tower', 0, 0, 5.2, Math.PI / 2);
      b.pop();
      vehicle(b, 22, -4, 0, 0.2, 'uaz');
      b.marker('merc_gate1', -26, 34, 0, Math.PI / 2);
      b.marker('merc_gate2', 30, 34, 0, Math.PI / 2);
      b.marker('merc_yard1', 14, 0, 0, Math.PI / 2);
      b.marker('merc_yard2', -16, -4, 0, Math.PI);
      b.marker('station_back', 10, -34, 0, -Math.PI / 2);
      b.marker('sub_gate', 0, 30, 0, -Math.PI / 2);
      b.pop();
    },

    ironforest(b, T) {
      const o = P.ironforest, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      fenceLine(b, [[-50, -38], [48, -38], [48, 40], [-50, 40], [-50, -38]], 0, 2.2, 'fence', [{ seg: 0, a: 8, b: 16 }, { seg: 2, a: 60, b: 70 }, { seg: 3, a: 30, b: 40 }]);
      for (const gx of [-36, -20, -4, 12, 28]) for (const gy of [-22, -5, 12, 29]) {
        if ((gx === -36 && gy === -22) || (gx === -20 && gy === 29)) continue;
        if ((gx + gy) % 3 === 0) transformer(b, gx, gy, 0, 0);
        else gantry(b, gx, gy, 0, Math.PI / 2, 9 + ((gx * 7 + gy) & 3));
      }
      for (const gy of [-5, 12]) for (const s of [-2.2, 0, 2.2]) b.beam(-36, gy + s, 9.6, 28, gy + s, 9.4, 0.05, 'metal');
      b.lattice(38, 30, 0, 5, 1.2, 42, 'stripes', { step: 4, beam: 0.25 });
      b.lamp(38, 30, 42.4, 0.6, [1, 0.2, 0.15], { indoor: false, beacon: true });
      b.push(-40, -30, 0, 0);
      b.room(0, 0, 0, 8, 6, 3, 0, { wall: 'concrete', doors: { n: [1.5] }, windows: { e: [0] }, roof: 'flat', roofTex: 'concrete', floorTex: 'concrete', zoneInfo: { name: 'Аппаратная', shelter: true, dark: 0.5 } });
      b.box(-2.4, -1.9, 0, 2.2, 1.0, 1.5, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.box(-2.4, -1.42, 1.0, 1.4, 0.05, 0.4, 0, 'screen', { indoor: '', flags: FLAG.EMISSIVE, collide: false, faces: ['n'] });
      b.marker('transmitter', -2.4, -0.7, 0, -Math.PI / 2);
      b.box(2.6, -2.0, 0, 1.6, 0.6, 1.0, 0, 'darkplanks', { indoor: 'nsewt', uv: 1 });
      b.box(2.8, 1.8, -0.01, 1.6, 1.6, 0.05, 0, 'grate', { indoor: 'nsewt', collide: false, faces: ['t'] });
      b.lamp(0, 0, 2.9, 0.3, [0.7, 1, 0.7], { flicker: true });
      b.pop();
      vehicle(b, 12, -32, 0, 0.1, 'zil');
      b.marker('battery', 9.4, -32, 1.6);
      b.marker('iron_center', 0, 0, 0);
      b.pop();
      const s2 = P.skat2, sz = T.heightAt(s2.x, s2.y);
      b.push(s2.x, s2.y, sz, -0.5);
      heliWreck(b, 0, 0, 0.2, 0, { tailBend: -0.8, blades: [[2, 0, 2.6, 60], [2, 0, 2.6, 170], [2, 0, 2.6, 290]], droop: 1.4 });
      b.beam(2, 0, 2.8, 4, 6, 9.6, 0.05, 'metal'); b.beam(-3, 0, 2.2, -5, 5, 9.6, 0.05, 'metal'); b.beam(6, 0, 2, 9, -4, 9.6, 0.05, 'metal');
      b.marker('skat2_body', 6, -3.5, 0);
      b.marker('skat2_log', 3.6, 0.2, 0.9);
      b.marker('skat2_tail', -9, 1, 0.4);
      b.pop();
    },

    gallery(b, T) {
      const o = P.gallery, yaw = Math.PI + 0.593;
      b.push(o.x, o.y, 4.6, yaw);
      const L = 44;
      b.wall(-8, -4.5, L, -4.5, 0, 6, 0.6, 'concrete', { inside: 'left', uv: 3 });
      b.wall(L, 4.5, -8, 4.5, 0, 6, 0.6, 'concrete', { inside: 'left', uv: 3 });
      b.box((L - 8) / 2, 0, 6, L + 8, 9.6, 1.0, 0, 'concrete', { top: 'earth', indoor: 'b', faces: ['t', 'b', 'w'] });
      b.box(-8.3, 0, 6, 0.6, 12, 2, 0, 'graffiti', { top: 'concrete' });
      b.quad([[-8, -4.2, 0.05], [L, -4.2, 0.05], [L, 4.2, 0.05], [-8, 4.2, 0.05]], 'rails', { uvs: [[0, 0], [(L + 8) / 4, 0], [(L + 8) / 4, 1], [0, 1]].map(([u, v]) => [v, u]), flags: FLAG.INDOOR });
      b.quad([[L, -4.5, 0], [L, 4.5, 0], [L, 4.5, 6], [L, -4.5, 6]], 'concrete', { flags: FLAG.INDOOR | FLAG.TWO_SIDED, light: 0.1 });
      b.zone(L / 2 - 4, 0, 0, L + 7, 8.4, 6, 0, { name: 'Тоннель на Юпитер', shelter: true, dark: 0.18 });
      b.marker('tunnel_end', L - 6, 0, 0);
      b.marker('tunnel_mouth', -10, 0, 0);
      for (let k = 0; k < L; k += 10) b.lamp(k, 3.8, 5.6, 0.25, [1, 0.6, 0.35], { flicker: k % 20 === 0 });
      b.pop();
      const R = M.RAILWAY.pts;
      for (const [t, a] of [[0.25, 0], [0.5, 0.04]]) {
        const k = Math.floor(t * (R.length - 1)), f = t * (R.length - 1) - k, x = lerp(R[k][0], R[k + 1][0], f), y = lerp(R[k][1], R[k + 1][1], f);
        const yw = Math.atan2(R[k + 1][1] - R[k][1], R[k + 1][0] - R[k][0]) + a, z = T.heightAt(x, y);
        b.push(x, y, z, yw); b.box(0, 0, 0.8, 11, 2.9, 2.9, 0, 'rust', { top: 'rust', uv: 3 }); for (const s of [-3.5, 3.5]) b.box(s, 0, 0, 1.6, 2.0, 0.8, 0, 'metal', { collide: false }); b.pop();
      }
      const ca = [o.x + 20, o.y + 16];
      b.marker('chimera_arena', ca[0], ca[1], T.heightAt(ca[0], ca[1]));
    },

    sawmill(b, T) {
      const o = P.sawmill, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.push(-17, -29, 0, 0);
      b.room(0, 0, 0, 22, 12, 5, 0, { wall: 'corrugated', doors: { n: [-6], e: [0] }, windows: { s: [-5, 5], n: [4] }, roof: 'gable', roofTex: 'roof', floorTex: 'darkplanks', ridge: 2.4, gableTex: 'corrugated', doorW: 1.6, zoneInfo: { name: 'Цех лесопилки', shelter: true, dark: 0.55 } });
      b.box(-3, -2, 0, 8, 1.2, 0.9, 0, 'metal', { indoor: 'nsewt', top: 'rust', uv: 1 });
      b.box(-3, -2, 0.9, 1.4, 0.1, 1.3, 0, 'metal', { indoor: 'nsewt', collide: false });
      vehicle(b, 6, 2.6, 0, 0, 'tractor');
      b.marker('saw_stash', 5.6, 2.6, 1.5);
      b.marker('saw_zombie1', -2, 2, 0);
      b.pop();
      b.push(2, -34, 0, 0);
      b.box(0, 0, 3.4, 14, 8, 0.3, 0, 'corrugated', { top: 'roof', collide: false });
      for (const x of [-6.6, 0, 6.6]) for (const y of [-3.6, 3.6]) b.beam(x, y, 0, x, y, 3.4, 0.22, 'logs');
      logPile(b, -3, 0, 0, 0); logPile(b, 4, 0, 0, 0);
      b.pop();
      b.push(23, -27, 0, 0);
      b.room(0, 0, 0, 14, 10, 3.0, 0, { wall: 'whitebrick', doors: { w: [-1], n: [-3] }, windows: { s: [-3, 3], n: [3], e: [0] }, roof: false, floorTex: 'planks', ceilTex: 'darkplanks', zoneInfo: { name: 'Контора лесопилки', shelter: true, dark: 0.35 } });
      for (const [x, y, w, d] of [[0, 1.4, 14.4, 7.6], [-3.1, -3.8, 8.2, 2.8], [6.3, -3.8, 1.8, 2.8]]) b.box(x, y, 3.0, w, d, 0.2, 0, 'darkplanks', { indoor: 'b', top: 'darkplanks', faces: ['t', 'b'], mat: 'wood' });
      b.ramp(3.2, -3.6, 0, 4.2, 1.0, 3.0, 0, 'darkplanks', { indoor: true, side: 'planks' });
      const ez = 4.2, rz = 6.6;
      for (const [ax, ay, bx, by] of [[-7, -5, 7, -5], [7, -5, 7, 5], [7, 5, -7, 5], [-7, 5, -7, -5]]) b.wall(ax, ay, bx, by, 3.2, ez - 3.2, 0.3, 'whitebrick', { inside: 'left' });
      b.quad([[-7.3, -5.3, ez], [7.3, -5.3, ez], [7.3, 0, rz], [-7.3, 0, rz]], 'roof', { uv: 2.5 });
      b.quad([[7.3, 5.3, ez], [-7.3, 5.3, ez], [-7.3, 0, rz], [7.3, 0, rz]], 'roof', { uv: 2.5 });
      b.quad([[-7.3, 0, rz], [7.3, 0, rz], [7.3, -5.3, ez], [-7.3, -5.3, ez]], 'darkplanks', { flags: FLAG.INDOOR, light: 0.5 });
      b.quad([[7.3, 0, rz], [-7.3, 0, rz], [-7.3, 5.3, ez], [7.3, 5.3, ez]], 'darkplanks', { flags: FLAG.INDOOR, light: 0.5 });
      for (const sx of [-7, 7]) { const pts = sx < 0 ? [[sx, 5, ez], [sx, -5, ez], [sx, 0, rz]] : [[sx, -5, ez], [sx, 5, ez], [sx, 0, rz]]; const w = pts.map(q => b.world(q[0], q[1], q[2])); b.tri(w[0], w[1], w[2], [0, 1], [5, 1], [2.5, 0], 0.7, b.tex('planks'), FLAG.TWO_SIDED); }
      b.collider(0, 0, rz, 14.6, 10.6, 0.2, 0, 'wood', false);
      b.zone(0, 0, 3.0, 13, 9, rz - 3, 0, { name: 'Чердак конторы', shelter: true, dark: 0.5 });
      table(b, -4, 2.6, 3.2, 0);
      b.marker('tools_rough', -4.2, 2.6, 4.0);
      b.marker('saw_office_stash', 5.6, 3.6, 3.3);
      crate(b, 5.6, 3.6, 3.2, 0.8);
      b.marker('saw_office', -3, -1, 0, 0);
      b.marker('saw_zombie2', 2, 1, 0);
      b.pop();
      b.push(10, 30, 0, 0);
      b.room(0, 0, 0, 10, 20, 4.2, 0, { wall: 'brick', doors: {}, windows: { e: [-5, 5], w: [-5, 5] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', zone: false });
      b.pop();
      b.push(0, 32, 0, 0);
      b.cylinder(0, 0, 0, 2.4, 16, 'brick', { seg: 12, uv: 2, cap: false });
      b.cylinder(0, 0, 16, 4.2, 5, 'rust', { seg: 14, uv: 3, collide: false });
      b.box(0, -2.3, 0, 1.4, 0.3, 2.2, 0, 'door', { collide: false, faces: ['s'] });
      b.marker('tower_stash', 1.8, -2.8, 0.1);
      crate(b, 2.2, -3.2, 0, 0.8, 0.3);
      b.pop();
      b.push(-30, 6, 0, 0);
      b.room(0, 0, 0, 6, 6, 2.8, 0, { wall: 'concrete', doors: { e: [0] }, windows: {}, roof: 'flat', roofTex: 'concrete', floorTex: 'concrete', zoneInfo: { name: 'Насосная', shelter: true, dark: 0.5 } });
      b.hcylinder(0, 0, 0, 0.6, 3.6, 0, 'rust', { flags: FLAG.INDOOR });
      b.pop();
      fenceLine(b, [[-44, 34], [-44, -40], [42, -40], [42, 44], [-20, 44]], 0, 1.4, 'fence', [{ seg: 0, a: 26, b: 31 }, { seg: 0, a: 40, b: 48 }, { seg: 2, a: 30, b: 38 }, { seg: 1, a: 40, b: 46 }]);
      logPile(b, -24, -12, 0, 1.2); logPile(b, 28, 8, 0, 0.3);
      vehicle(b, -14, 14, 0, 0.8, 'zil');
      b.marker('saw_zombie3', 8, 10, 0);
      b.marker('saw_yard', 0, 0, 0);
      b.pop();
    },

    farmstead(b, T) {
      const o = P.farmstead, gz = T.heightAt(o.x, o.y);
      const at = (x, y) => T.heightAt(x, y);
      burntHouse(b, 476, 827, at(476, 827), 0.1, 11, 7, 11, { chimney: true });
      burntHouse(b, 466, 808, at(466, 808), -0.2, 9, 8, 12);
      burntHouse(b, 496, 800, at(496, 800), 0.05, 11, 9, 13, { attic: true, chimney: true });
      burntHouse(b, 458, 830, at(458, 830), 0.4, 6, 5, 14, { tall: 1.2 });
      burntHouse(b, 503, 826, at(503, 826), -0.15, 12, 8, 15, { tall: 1.6 });
      b.push(496, 800, at(496, 800), 0.05);
      b.zone(0, 0, 0, 10.4, 8.4, 2.6, 0, { name: 'Сгоревший дом', shelter: true, dark: 0.3 });
      b.marker('farm_attic', 2.5, 2, 3.0);
      b.pop();
      b.marker('farm_center', o.x, o.y, gz);
      b.push(522, 852, at(522, 852), 0.6);
      b.box(0, 0, 0, 4, 0.6, 2.6, 0, 'rock', { top: 'earth' });
      b.box(0, 3.4, 0, 4, 0.6, 2.6, 0, 'rock', { top: 'earth' });
      b.box(-1.7, 1.7, 2.4, 4.4, 4.2, 0.8, 0, 'earth', { top: 'earth' });
      for (const s of [-1.6, 1.6]) b.box(s, 1.7, 0, 0.2, 0.2, 2.4, 0, 'logs', { collide: false });
      b.zone(0, 1.7, 0, 3.4, 2.8, 2.4, 0, { name: 'Погреб у хутора', shelter: true, dark: 0.2 });
      b.marker('cellar_stash', -1.2, 1.7, 0.1);
      b.pop();
      const tp = [509, 791];
      b.marker('tp_farm', tp[0], tp[1], at(tp[0], tp[1]), 2.48);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.box(tp[0] + Math.cos(a) * 3.2, tp[1] + Math.sin(a) * 3.2, at(tp[0], tp[1]) - 0.2, 0.8, 0.8, 0.5 + (k % 3) * 0.3, a, 'rock', { collide: false }); }
    },

    plateau(b, T) {
      const s3 = P.skat3, z3 = T.heightAt(s3.x, s3.y);
      b.push(s3.x, s3.y, z3, 0.9);
      heliWreck(b, 0, 0, -0.3, 0, { tailBend: 1.2, blades: [[2, 0, 2.6, 20], [2, 0, 2.6, 140]], droop: 1.6 });
      b.marker('skat3_door', 4.2, -2.4, 0, Math.PI / 2);
      b.marker('skat3_body', 7, 4, 0);
      b.marker('skat3_note', 3.2, -0.3, 0.9);
      crate(b, -3, -3, 0, 0.7, 0.4, 'metal'); crate(b, -4.2, -2, 0, 0.6, 1.1, 'metal');
      b.pop();
      const cv = [566, 128], cz = T.heightAt(cv[0], cv[1]);
      b.push(cv[0], cv[1], cz, 0.7);
      b.wall(-5, -3, 5, -3, 0, 3, 1.2, 'rock', { uv: 3 });
      b.wall(5, 3.6, -5, 3.6, 0, 3, 1.2, 'rock', { uv: 3 });
      b.wall(-5, 3.6, -5, -3, 0, 3, 1.2, 'rock', { uv: 3 });
      b.box(0, 0.3, 3, 11.6, 8.4, 1.4, 0, 'rock', { top: 'earth' });
      b.zone(0.5, 0.3, 0, 9, 5.6, 3, 0, { name: 'Пещера снорков', shelter: true, dark: 0.15 });
      b.marker('plateau_cave', 0, 0.3, 0);
      b.marker('plateau_stash', -3.6, 2.4, 0.1);
      b.pop();
      const tp = [586, 184];
      b.marker('tp_plateau', tp[0], tp[1], T.heightAt(tp[0], tp[1]), -0.88);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.box(tp[0] + Math.cos(a) * 3.2, tp[1] + Math.sin(a) * 3.2, T.heightAt(tp[0], tp[1]) - 0.2, 0.8, 0.8, 0.5 + (k % 3) * 0.3, a, 'rock', { collide: false }); }
    },

    krug(b, T) {
      const o = P.krug, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      const L = 26, Wd = 22, H = 4.4;
      b.wall(-L / 2, -Wd / 2, L / 2, -Wd / 2, 0, H, 0.35, 'concrete', { inside: 'left', openings: [{ a: 4, b: 6, z0: 1.4, z1: 2.4, glass: true }, { a: 20, b: 22, z0: 1.4, z1: 2.4, glass: true }], uv: 3 });
      b.wall(L / 2, -Wd / 2, L / 2, Wd / 2, 0, H, 0.35, 'concrete', { inside: 'left', openings: [{ a: 9.6, b: 12.4, z0: 0, z1: 2.6 }], uv: 3 });
      b.wall(L / 2, Wd / 2, -L / 2, Wd / 2, 0, H, 0.35, 'concrete', { inside: 'left', openings: [{ a: 6, b: 8, z0: 1.4, z1: 2.4, glass: true }, { a: 18, b: 20, z0: 1.4, z1: 2.4, glass: true }], uv: 3 });
      b.wall(-L / 2, Wd / 2, -L / 2, -Wd / 2, 0, H, 0.35, 'concrete', { inside: 'left', openings: [{ a: 9.8, b: 12.2, z0: 0, z1: 2.6 }], uv: 3 });
      b.box(0, 0, H, L + 0.6, Wd + 0.6, 0.4, 0, 'concrete', { top: 'roof', faces: ['n', 's', 'e', 'w', 't'] });
      b.quad([[-L / 2, Wd / 2, H], [L / 2, Wd / 2, H], [L / 2, -Wd / 2, H], [-L / 2, -Wd / 2, H]], 'concrete', { planar: true, uv: 3, flags: FLAG.INDOOR });
      b.quad([[-L / 2, -Wd / 2, 0.03], [L / 2, -Wd / 2, 0.03], [L / 2, Wd / 2, 0.03], [-L / 2, Wd / 2, 0.03]], 'tile', { planar: true, uv: 2.5, flags: FLAG.INDOOR });
      b.zone(0, 0, 0, L - 0.6, Wd - 0.6, H, 0, { name: 'ВНЗ «Круг»', shelter: true, dark: 0.2, lair: true });
      b.wall(-5, -Wd / 2, -5, 3, 0, 3.2, 0.25, 'plaster', { inside: 'both', openings: [{ a: 4, b: 5.6, z0: 0, z1: 2.3 }] });
      b.wall(5, Wd / 2, 5, -4, 0, 3.2, 0.25, 'plaster', { inside: 'both', openings: [{ a: 8, b: 9.6, z0: 0, z1: 2.3 }] });
      for (const [x, y] of [[-10, -8], [-10, -4], [-10, 0], [9, 7], [9, 3]]) b.box(x, y, 0, 1.2, 2.6, 2.2, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.box(0, 8, 0, 6, 1.0, 2.2, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.box(-0.5, 7.48, 1.2, 3, 0.05, 0.8, 0, 'poster', { indoor: '', collide: false, faces: ['s'] });
      b.marker('lair1', -8, -6, 0); b.marker('lair2', 1, -6, 0); b.marker('lair3', 9, -6, 0);
      b.marker('lair_bones', -9, 3, 0);
      b.marker('lair_stash', -11.4, 9.2, 0.1);
      b.marker('krug_door', L / 2 + 3, 0, 0, Math.PI);
      b.lamp(8, 0, 4.2, 0.3, [1, 0.8, 0.5], { flicker: true });
      b.lattice(0, 0, H + 0.4, 3, 0.8, 12, 'metal', { step: 3, beam: 0.16 });
      for (const a of [0, Math.PI / 2]) b.beam(Math.cos(a) * -4, Math.sin(a) * -4, H + 11.4, Math.cos(a) * 4, Math.sin(a) * 4, H + 11.4, 0.15, 'metal');
      vehicle(b, -L / 2 - 4, -5, 0, Math.PI / 2, 'uaz');
      b.pop();
      for (let k = 0; k < 44; k++) {
        const a = k / 44 * TAU, x = o.x + Math.cos(a) * 48, y = o.y + Math.sin(a) * 48;
        if (Math.abs(T.road[Math.round(y) * M.SIZE + Math.round(x)]) > 0.3) continue;
        mast(b, x, y, T.heightAt(x, y), 10);
        if (k % 2 === 0) { const a2 = (k + 1) / 44 * TAU; b.beam(x, y, T.heightAt(x, y) + 9.6, o.x + Math.cos(a2) * 48, o.y + Math.sin(a2) * 48, T.heightAt(o.x + Math.cos(a2) * 48, o.y + Math.sin(a2) * 48) + 9.6, 0.04, 'metal'); }
      }
    },

    izumrud(b, T) {
      const o = P.izumrud, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.push(0, 34, 0, 0);
      b.box(0, 0, 0, 14, 8, 1.0, 0, 'darkplanks', { top: 'planks', uv: 1.5 });
      b.ramp(0, -5, 0, 2, 3, 1.0, Math.PI / 2, 'planks', { side: 'darkplanks' });
      b.box(0, 3.85, 1.0, 14, 0.3, 4, 0, 'planks', { uv: 2 });
      for (const x of [-7, 7]) for (const y of [-3.8, 3.8]) b.beam(x, y, 1.0, x, y, 5.6, 0.25, 'logs');
      for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI, a1 = (k + 1) / 6 * Math.PI; b.quad([[-7.4, Math.cos(a0) * 4.4, 5 + Math.sin(a0) * 2.2], [7.4, Math.cos(a0) * 4.4, 5 + Math.sin(a0) * 2.2], [7.4, Math.cos(a1) * 4.4, 5 + Math.sin(a1) * 2.2], [-7.4, Math.cos(a1) * 4.4, 5 + Math.sin(a1) * 2.2]], 'corrugated', { flags: FLAG.TWO_SIDED, uv: 3 }); }
      b.collider(0, 0, 5, 14.8, 8.8, 2.4, 0, 'metal', false);
      b.marker('izum_stage', 0, 0, 1.0);
      b.pop();
      cabin(b, -2, 13, 0, 0.05, 7, 5, { door: 1.5, zone: { name: 'Корпус лагеря', shelter: true, dark: 0.45 }, bunks: true });
      cabin(b, -8, -1, 0, Math.PI / 2, 6, 5, { roofTex: 'slate', zone: { name: 'Домик вожатых', shelter: true, dark: 0.45 } });
      cabin(b, 8, 0, 0, -Math.PI / 2, 6, 5, { roof: false, zone: { name: 'Разрушенный домик', shelter: false, dark: 0.2 } });
      cabin(b, 10, -13, 0, -Math.PI / 2, 6, 5, { roofTex: 'slate', zone: { name: 'Домик №4', shelter: true, dark: 0.45 } });
      cabin(b, -10, -26, 0, Math.PI / 2, 7, 5, { zone: { name: 'Столовая', shelter: true, dark: 0.45 }, bunks: false });
      cabin(b, 7, -32, 0, Math.PI, 6, 5, { roof: false, zone: { name: 'Разрушенный домик', shelter: false, dark: 0.2 } });
      b.marker('izum_stash', -11.6, -27.6, 0.1);
      crate(b, -11.6, -27.6, 0, 0.8);
      b.push(0, -44, 0, 0);
      for (const s of [-3.2, 3.2]) b.beam(s, 0, 0, s, 0, 4.2, 0.22, 'metal');
      b.box(0, 0, 3.6, 7, 0.15, 1.0, 0, 'sign', { collide: false, faces: ['n', 's'], uv: 1 });
      b.pop();
      fenceLine(b, [[-18, -44], [-3.6, -44]], 0, 1.2, 'planks');
      fenceLine(b, [[3.6, -44], [18, -44], [18, -20]], 0, 1.2, 'planks');
      b.marker('chimera_lair', 4, -16, 0);
      b.marker('izum_center', 0, 0, 0);
      b.pop();
    },

    fuel(b, T) {
      const o = P.fuel, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.push(0, 9.5, 0, 0);
      for (const [x, y] of [[-7, -4.5], [7, -4.5], [-7, 4.5], [7, 4.5]]) b.box(x, y, 0, 0.5, 0.5, 4.4, 0, 'concrete', { mat: 'concrete' });
      b.box(0, 0, 4.4, 16, 11, 0.5, 0, 'concrete', { top: 'roof', uv: 3 });
      b.box(0, 0, 4.9, 16.2, 11.2, 0.4, 0, 'stripes', { faces: ['n', 's', 'e', 'w'], collide: false });
      for (const x of [-3, 3]) { b.box(x, 0, 0, 1.2, 0.8, 0.25, 0, 'concrete'); b.box(x, 0, 0.25, 0.7, 0.5, 1.6, 0, 'stripes', { top: 'metal' }); }
      b.pop();
      b.room(0, -6, 0, 14, 14, 3.3, 0, { wall: 'whitebrick', doors: { n: [-3] }, windows: { n: [3], w: [-3, 3], s: [0] }, roof: 'flat', roofTex: 'roof', floorTex: 'tile', zoneInfo: { name: 'Заправка', shelter: true, dark: 0.35 } });
      b.box(-4, -9, 0, 3, 0.8, 1.0, 0, 'darkplanks', { indoor: 'nsewt', top: 'planks', uv: 1 });
      b.marker('fuel_roof', 2, -8, 3.65);
      crate(b, 2.6, -8.6, 3.6, 0.8, 0.3);
      b.hcylinder(9.6, -8, 0, 1.3, 7, Math.PI / 2, 'rust', {});
      b.ramp(9.6, -13, 0, 3, 1.2, 2.5, Math.PI / 2, 'metal', { side: 'rust' });
      b.push(15, 6, -1.4, 0.35);
      b.box(0, 0, 0, 6, 5, 3.2, 0.25, 'whitebrick', { top: 'roof' });
      b.hcylinder(0, 0, 0.4, 1.1, 4.4, 0, 'rust', { collide: false });
      b.pop();
      vehicle(b, -9, 10, 0, 0.3, 'uaz');
      b.pop();
      const zx = 386.5, zy = 368, zz = T.heightAt(zx, zy);
      carWreck(b, zx, zy, zz, 1.4, 'car');
      b.marker('razlom_stash', zx, zy, zz + 0.8);
    },

    beton(b, T) {
      const o = P.beton, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      b.box(-4, 4, 0, 7, 7, 15, 0, 'corrugated', { top: 'rust', uv: 3 });
      b.box(-4, 4, 15, 4, 4, 3, 0, 'corrugated', { top: 'rust' });
      for (const [x, y] of [[6, 10], [6, 3]]) { b.cylinder(x, y, 4, 2.4, 9, 'metal', { seg: 12, capTex: 'rust' }); for (const s of [-1.6, 1.6]) for (const t of [-1.6, 1.6]) b.beam(x + s, y + t, 0, x + s, y + t, 4.2, 0.2, 'rust'); }
      b.beam(-4, -2, 0.3, -4, 0.6, 12, 1.2, 'rust');
      b.push(2, -11, 0, 0);
      b.room(0, 0, 0, 16, 10, 3.6, 0, { wall: 'panel', doors: { n: [-4] }, windows: { s: [-4, 4], e: [0] }, roof: 'flat', roofTex: 'roof', floorTex: 'concrete', zoneInfo: { name: 'Бетонный узел', shelter: true, dark: 0.45 } });
      b.box(5, 3, 0, 4, 2, 1.6, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('beton_stash', 6.2, 3.6, 1.7);
      b.pop();
      vehicle(b, 10, -18, 0, 0.5, 'zil');
      b.pop();
    },

    oakpine(b, T) {
      const o = P.oakpine, gz = T.heightAt(o.x, o.y);
      const rnd = C.makeRandom(91);
      b.push(o.x, o.y, gz, 0);
      b.beam(0, 0, -0.5, 0.6, 0.4, 7.5, 1.6, 'logs');
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * TAU + rnd() * 0.3, r = 10 + rnd() * 3;
        const mx = Math.cos(a) * r * 0.55, my = Math.sin(a) * r * 0.55, ex = Math.cos(a + 0.25) * r, ey = Math.sin(a + 0.25) * r;
        b.beam(0.5, 0.3, 7, mx, my, 9.5 + rnd() * 1.2, 0.7, 'logs');
        b.beam(mx, my, 9.5, ex, ey, T.heightAt(o.x + ex, o.y + ey) - gz + 0.2, 0.5, 'logs');
        b.collider(ex, ey, T.heightAt(o.x + ex, o.y + ey) - gz - 0.5, 0.6, 0.6, 2.4, 0, 'wood', false);
      }
      b.pop();
    },

    dredge(b, T) {
      const o = P.dredge;
      b.push(o.x, o.y, 0, Math.PI / 2);
      b.box(0, 0, -1.2, 32, 11, 2.6, 0, 'hullred', { top: 'deck', uv: 2 });
      b.push(-5, 0, 1.4, 0);
      b.room(0, 0, 0, 10, 8, 3.0, 0, { wall: 'hull', doors: { w: [0], n: [1.5] }, windows: { s: [-2.5, 2.5], e: [0] }, roof: false, floorTex: 'deck', ceilTex: 'rust', zoneInfo: { name: 'Земснаряд, машинный зал', shelter: true, dark: 0.5 } });
      b.box(2, 2.6, 0, 3, 1.8, 1.6, 0, 'metal', { indoor: 'nsewt', uv: 1 });
      b.marker('tools_fine', 2, 2.4, 1.6);
      b.marker('dredge_in', -2, -1, 0);
      b.push(0, 0, 3.0, 0);
      b.box(-2.3, 0, -0.2, 5.2, 8, 0.2, 0, 'rust', { indoor: 'b', top: 'deck', faces: ['t', 'b'] });
      b.box(3.3, -1.2, -0.2, 3.2, 5.6, 0.2, 0, 'rust', { indoor: 'b', top: 'deck', faces: ['t', 'b'] });
      b.box(3.3, 3.4, -0.2, 3.2, 1.2, 0.2, 0, 'rust', { indoor: 'b', top: 'deck', faces: ['t', 'b'] });
      b.room(0, 0, 0, 10, 8, 2.8, 0, { wall: 'hull', doors: {}, windows: { n: [-2.5, 0, 2.5], s: [-2.5, 0, 2.5], e: [0], w: [0] }, floor: false, ceilTex: 'rust', roof: 'flat', roofTex: 'rust', zoneInfo: { name: 'Земснаряд, рубка', shelter: true } });
      b.marker('dredge_top', -2, 0, 0, 0);
      b.pop();
      b.ramp(2.3, 2.5, 0, 4.4, 1.0, 2.8, Math.PI / 2, 'grate', { indoor: true, side: 'rust', rails: true });
      b.pop();
      b.push(10, 0, 1.4, 0);
      b.lattice(0, 0, 0, 3, 2, 9, 'rust', { step: 2.5 });
      b.beam(0, 0, 9, 14, 0, -3, 0.9, 'rust');
      b.beam(0, 1.2, 9, 14, 1.2, -3, 0.3, 'rust');
      for (let k = 0; k < 7; k++) { const t = k / 6; b.box(t * 14, 0.8, 9 - t * 12 - 0.4, 0.9, 1.2, 0.8, 0, 'rust', { collide: false }); }
      b.pop();
      barrel(b, -13, 4, 1.4); barrel(b, -12.4, 3.2, 1.4); crate(b, -13, -3.6, 1.4, 1.1);
      b.marker('dredge_deck1', -12, 0, 1.4, Math.PI); b.marker('dredge_deck2', 6, -3.6, 1.4, 0);
      b.push(2, 10, 0, 0);
      b.box(0, 0, -1, 14, 9, 1.95, 0, 'rust', { top: 'deck', uv: 2 });
      crate(b, -3, 1, 0.95, 1.1); crate(b, 2, -2, 0.95, 1.0, 0.4); barrel(b, 4, 2, 0.95);
      b.pop();
      b.pop();
      const pa = [819, 769], pb = [853, 727];
      walkway(b, pa[0], pa[1], pb[0], pb[1], 0.95, 2.4, T);
      b.marker('dredge_pier', pa[0] + 2, pa[1] - 2, 0.95);
    },

    swamp(b, T) {
      const o = P.swamp;
      const hx = 152, hy = 690, hz = Math.max(T.heightAt(hx, hy), -0.4);
      b.push(hx, hy, hz - 0.2, 2.4);
      heliWreck(b, 0, 0, 0, 0, { tailBend: 2.2, blades: [[2, 0, 2.2, 90], [2, 0, 2.2, 220]], droop: 2.0, noTail: false });
      b.marker('skat5_cabin', 3.4, -0.2, 0.9);
      b.pop();
      const cv = [158, 600], cz = T.heightAt(cv[0], cv[1]);
      b.push(cv[0], cv[1], cz, Math.PI / 2 + 0.3);
      b.wall(-6, -1.6, 6, -1.6, 0, 2.4, 0.4, 'concrete', { inside: 'left' });
      b.wall(6, 1.6, -6, 1.6, 0, 2.4, 0.4, 'concrete', { inside: 'left' });
      b.box(0, 0, 2.4, 12.8, 4, 0.5, 0, 'concrete', { top: 'earth' });
      b.quad([[6, -1.6, 0], [6, 1.6, 0], [6, 1.6, 2.4], [6, -1.6, 2.4]], 'concrete', { flags: FLAG.INDOOR | FLAG.TWO_SIDED, light: 0.2 });
      b.zone(-0.5, 0, 0, 12, 3, 2.4, 0, { name: 'Коллектор у Топи', shelter: true, dark: 0.2 });
      b.pop();
    },

    lake(b, T) {
      const px = 496, y0 = 892, y1 = 914;
      b.push(px, y0, 0, Math.PI / 2);
      for (let x = 0; x < y1 - y0; x += 2) {
        b.box(x + 1, 0, 0.75, 2.05, 2, 0.2, 0, 'planks', { top: 'planks', uv: 1, faces: ['n', 's', 't', 'b'], collide: false });
        if (x % 6 === 0) for (const dy of [-0.9, 0.9]) b.box(x + 1, dy, -2.5, 0.2, 0.2, 3.3, 0, 'logs', { collide: false });
      }
      b.collider((y1 - y0) / 2, 0, -2.5, y1 - y0, 2, 3.45, 0, 'wood', true);
      b.pop();
      b.push(px + 3, y1 - 4, -0.2, 0.3);
      buildHull(b, { x0: -3, x1: 3, sternX: -3, sternW: 1.0, sternFull: -2.5, w: 1.2, bowStart: 1.5, bowX: 3.1, bottom: -0.5, band: 0.2, top: 0.9, deck: 0.25, ceiling: 0.2, floor: 0.0, inner: [99, 99], stations: [], openings: [], holes: [{ x0: -2.5, x1: 1.5, y0: -0.8, y1: 0.8 }], bulkheads: [], noFloor: true, tex: 'hull' });
      b.pop();
      b.marker('lake_pier', px, y0 - 2, T.heightAt(px, y0 - 2));
      b.marker('camp_lake', px - 12, y0 - 8, T.heightAt(px - 12, y0 - 8));
    },

    start(b, T) {
      const o = P.start, gz = T.heightAt(o.x, o.y);
      b.push(o.x, o.y, gz, 0);
      carWreck(b, 4, 6, 0, 1.2, 'car');
      b.box(-5, 6, 0, 0.12, 0.12, 2.2, 0, 'metal', { collide: false });
      b.box(-5, 6.05, 1.5, 1.0, 0.05, 0.9, 0, 'sign', { collide: false, faces: ['n', 's'], uv: 1 });
      b.marker('player_start', -1, -2, 0, Math.PI + 0.2);
      b.pop();
      const bx = 846, by = 646;
      carWreck(b, bx, by, T.heightAt(bx, by), 0.15, 'bus');
      b.marker('tutorial_bus', bx, by, T.heightAt(bx, by));
    },

    misc(b, T) {
      pipeline(b, T);
      const put = (fn, x, y, ...rest) => fn(b, x, y, T.heightAt(x, y), ...rest);
      put(carWreck, 236, 760, 1.5, 'car');
      put(carWreck, 470, 268, 0.1, 'truck');
      put(carWreck, 520, 350, 1.1, 'car');
      put(carWreck, 806, 612, 1.4, 'truck');
      put(carWreck, 345, 425, 0.05, 'car');
      put(vehicle, 600, 262, -0.05, 'btr');
      for (const [x, y, s, a] of [[443, 352, 2.2, 0.3], [451, 389, 1.6, 1.1], [409, 336, 1.8, 2.2], [457, 362, 1.4, 0.8]]) b.box(x, y, T.heightAt(x, y) - 0.3, s * 1.4, s, s, a, 'rock', { top: 'rock' });
      const camps = [['camp_claw', 452, 396], ['camp_oakpine', 226, 420]];
      for (const [n, x, y] of camps) { b.marker(n, x, y, T.heightAt(x, y)); crate(b, x + 2.2, y + 1.4, T.heightAt(x + 2.2, y + 1.4), 0.6); }
      const lairs = [['forestry', 925, 610], ['fuel', 330, 345], ['izumrud', 395, 650], ['stoyanka', 700, 350], ['oakpine', 275, 420], ['northshore', 610, 878], ['ne', 905, 830], ['south', 470, 230], ['plateau', 642, 132], ['swamp', 120, 610], ['beton', 430, 200], ['east', 930, 420]];
      for (const [n, x, y] of lairs) b.marker('lair_' + n, x, y, T.heightAt(x, y));
    }
  };

  function buildPlaces(texIndex, terrain) {
    const b = new C.Builder(texIndex);
    for (const k of Object.keys(PLACES)) PLACES[k](b, terrain);
    return b;
  }

  C.buildPlaces = buildPlaces;
  C.PLACES = PLACES;
})(globalThis.Cop98 = globalThis.Cop98 || {});
