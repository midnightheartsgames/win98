(function (D) {
  'use strict';
  const DD = D.DATA, { MAP } = DD;
  const KX = 0.27, KY = 0.135, KZ = 0.33, S = KX * Math.SQRT2;
  const TEX = 1600, TU = MAP / TEX;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return h.length === 4 ? [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17] : [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgb = (c, k = 1, add = 0) => `rgb(${Math.max(0, Math.min(255, c[0] * k + add)) | 0},${Math.max(0, Math.min(255, c[1] * k + add)) | 0},${Math.max(0, Math.min(255, c[2] * k + add)) | 0})`;
  const LIGHT = (() => { const v = [-0.55, -0.25, 0.8], l = Math.hypot(...v); return v.map(x => x / l); })();
  const CAM = [-0.612, 0.612, 0.5];

  function rotGroup(p, g, pose) {
    const G = pose[g]; if (!G) return p;
    let [a, b, z] = p; const pv = G.pivot;
    if (G.rot) { const da = a - pv[0], dz = z - pv[2], c = Math.cos(G.rot), s = Math.sin(G.rot); a = pv[0] + da * c + dz * s; z = pv[2] - da * s + dz * c; }
    if (G.roll) { const db = b - pv[1], dz = z - pv[2], c = Math.cos(G.roll), s = Math.sin(G.roll); b = pv[1] + db * c - dz * s; z = pv[2] + db * s + dz * c; }
    if (G.yaw) { const da = a - pv[0], db = b - pv[1], c = Math.cos(G.yaw), s = Math.sin(G.yaw); a = pv[0] + da * c - db * s; b = pv[1] + da * s + db * c; }
    if (G.dz) z += G.dz; if (G.da) a += G.da;
    return [a, b, z];
  }
  class Poser {
    constructor(face, scale, pose) { this.c = Math.cos(face); this.s = Math.sin(face); this.k = scale; this.pose = pose || {}; }
    w(p, g) {
      let q = g ? rotGroup(p, g, this.pose) : p;
      if (this.pose.all && g !== 'shadow') q = rotGroup(q, 'all', this.pose);
      const k = this.k; return [(q[0] * this.c - q[1] * this.s) * k, (q[0] * this.s + q[1] * this.c) * k, q[2] * k];
    }
    dir(v, g) { const o = this.w([0, 0, 0], g), p = this.w(v, g); return [p[0] - o[0], p[1] - o[1], p[2] - o[2]]; }
  }
  const scr = (w, ox, oy) => [ox + (w[0] + w[1]) * KX, oy + (w[1] - w[0]) * KY - w[2] * KZ];
  const depth = (w) => (w[1] - w[0]) * 0.612 + w[2] * 0.5;
  const shade = (n) => { const l = Math.hypot(n[0], n[1], n[2]) || 1; return 0.5 + 0.62 * Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l); };
  const facing = (n) => n[0] * CAM[0] + n[1] * CAM[1] + n[2] * CAM[2];
  function prismFaces(P, pr, center, r, h, n, rTop, g, yaw = 0) {
    const bot = [], top = []; const rt = rTop == null ? r : rTop;
    for (let i = 0; i < n; i++) { const a = yaw + i / n * Math.PI * 2 + Math.PI / n; bot.push(pr.w([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r, center[2]], g)); top.push(pr.w([center[0] + Math.cos(a) * rt, center[1] + Math.sin(a) * rt, center[2] + h], g)); }
    const faces = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push(rt > 0.01 ? [bot[i], bot[j], top[j], top[i]] : [bot[i], bot[j], top[i]]); }
    if (rt > 0.01) faces.push(top.slice().reverse());
    faces.push(bot.slice());
    if (h < 0) faces.forEach(f => f.reverse());
    return faces;
  }
  function boxFaces(pr, c, s, g, yaw = 0, pitch = 0) {
    const [la, lb, lz] = s.map(v => v / 2), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const v = (i, j, k) => { const a0 = i * la, b0 = j * lb, z0 = k * lz, a = a0 * cp + z0 * sp, z = z0 * cp - a0 * sp; return pr.w([c[0] + (a * cy - b0 * sy), c[1] + (a * sy + b0 * cy), c[2] + z], g); };
    const V = { nnn: v(-1, -1, -1), pnn: v(1, -1, -1), ppn: v(1, 1, -1), npn: v(-1, 1, -1), nnp: v(-1, -1, 1), pnp: v(1, -1, 1), ppp: v(1, 1, 1), npp: v(-1, 1, 1) };
    return [[V.nnp, V.pnp, V.ppp, V.npp], [V.nnn, V.npn, V.ppn, V.pnn], [V.pnn, V.ppn, V.ppp, V.pnp], [V.nnn, V.nnp, V.npp, V.npn], [V.npn, V.npp, V.ppp, V.ppn], [V.nnn, V.pnn, V.pnp, V.nnp]];
  }
  const polyNormal = (f) => { const a = f[0], b = f[1], c = f[2]; const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
  function renderModel(ctx, model, ox, oy, face, pose, scale, tint, layer) {
    const pr = new Poser(face, (model.scale || 1) * scale, pose);
    const items = [];
    for (const P of model.parts) {
      const t = P[0];
      if ((t === 'glow') !== (layer === 'glow') && layer) continue;
      if (t === 'glow') {
        if (tint) continue;
        const cc = pr.w(P[1], P[4]), col = hex(P[3]), r = P[2] * pr.k * S * 1.4, hid = depth(cc) < depth(pr.w([0, 0, P[1][2]])) - 5 * pr.k, al = hid ? 0.3 : 1;
        items.push({ d: 1e6, draw: () => { const [x, y] = scr(cc, ox, oy), gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.8 * al})`); gr.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},${0.35 * al})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); } });
        continue;
      }
      if (t === 'poly') {
        const g = P[3], col = hex(P[2]), f = P[1].map(v => pr.w(v, g));
        let n = polyNormal(f); const back = facing(n) <= 0; if (back) n = [-n[0], -n[1], -n[2]];
        const k = shade(n) * (back ? 0.78 : 1), d = f.reduce((s, v) => s + depth(v), 0) / f.length + (P[4] || 0);
        items.push({ d, draw: () => { ctx.fillStyle = tint || rgb(col, k); ctx.strokeStyle = tint || rgb(col, k * 0.7); ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.beginPath(); f.forEach((v, i) => { const [x, y] = scr(v, ox, oy); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
        continue;
      }
      if (t === 'disk') { const c = pr.w(P[1]); items.push({ d: -1e5, draw: () => { const [x, y] = scr(c, ox, oy); ctx.fillStyle = P[3]; ctx.beginPath(); ctx.ellipse(x, y, P[2] * pr.k * S, P[2] * pr.k * S * 0.5, 0, 0, 7); ctx.fill(); } }); continue; }
      if (t === 'ball' || t === 'ell') {
        const c = pr.w(P[1], P[4 - (t === 'ball' ? 0 : 0)]);
        const g = P[4]; const cc = pr.w(P[1], g);
        const col = hex(P[3]);
        let ra, rb, rz; if (t === 'ball') ra = rb = rz = P[2]; else [ra, rb, rz] = P[2];
        items.push({ d: depth(cc), draw: () => {
          const [x, y] = scr(cc, ox, oy);
          const ax = pr.dir([ra, 0, 0], g), bx = pr.dir([0, rb, 0], g), zx = pr.dir([0, 0, rz], g);
          const p = (v) => [(v[0] + v[1]) * KX, (v[1] - v[0]) * KY - v[2] * KZ];
          const A = p(ax), B = p(bx), Z = p(zx);
          const cxx = A[0] * A[0] + B[0] * B[0] + Z[0] * Z[0], cyy = A[1] * A[1] + B[1] * B[1] + Z[1] * Z[1], cxy = A[0] * A[1] + B[0] * B[1] + Z[0] * Z[1];
          const tr = cxx + cyy, det = cxx * cyy - cxy * cxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
          const l1 = tr / 2 + disc, l2 = Math.max(0.01, tr / 2 - disc), ang = Math.atan2(l1 - cxx, cxy || 1e-6);
          const r1 = Math.sqrt(l1), r2 = Math.sqrt(l2), rm = Math.max(r1, r2);
          const gr = ctx.createRadialGradient(x - rm * 0.35, y - rm * 0.4, rm * 0.1, x, y, rm * 1.05);
          gr.addColorStop(0, rgb(col, 1.35, 18)); gr.addColorStop(0.5, rgb(col, 1)); gr.addColorStop(1, rgb(col, 0.45));
          ctx.fillStyle = tint || gr; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, r1), Math.max(0.5, r2), Math.abs(cxy) < 1e-6 ? (cxx >= cyy ? 0 : Math.PI / 2) : ang, 0, 7); ctx.fill();
        } });
      } else if (t === 'cap') {
        const g = P[5], a = pr.w(P[1], g), b = pr.w(P[2], g), col = hex(P[4]), r = P[3] * pr.k;
        items.push({ d: (depth(a) + depth(b)) / 2, draw: () => {
          const [x1, y1] = scr(a, ox, oy), [x2, y2] = scr(b, ox, oy);
          ctx.lineCap = 'round'; const w = Math.max(1, r * 2 * S);
          ctx.strokeStyle = tint || rgb(col, 0.55); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          if (!tint) { ctx.strokeStyle = rgb(col, 1); ctx.lineWidth = w * 0.7; ctx.beginPath(); ctx.moveTo(x1 - w * 0.08, y1 - w * 0.1); ctx.lineTo(x2 - w * 0.08, y2 - w * 0.1); ctx.stroke();
            ctx.strokeStyle = rgb(col, 1.3, 20); ctx.lineWidth = w * 0.25; ctx.beginPath(); ctx.moveTo(x1 - w * 0.2, y1 - w * 0.22); ctx.lineTo(x2 - w * 0.2, y2 - w * 0.22); ctx.stroke(); }
        } });
      } else {
        let faces, col = hex(P[t === 'box' ? 3 : 4]), g = P[t === 'box' ? 4 : 5];
        if (t === 'box') faces = boxFaces(pr, P[1], P[2], g, P[5] || 0, P[6] || 0);
        else if (t === 'cone') faces = prismFaces(null, pr, P[1], P[2], P[3], P[6] || 8, 0, g, P[7] || 0);
        else faces = prismFaces(null, pr, P[1], P[2], P[3], P[6] || 8, P[7] == null ? P[2] : P[7], g, P[8] || 0);
        for (const f of faces) {
          const n = polyNormal(f); if (facing(n) <= 0.001) continue;
          const d = f.reduce((s, v) => s + depth(v), 0) / f.length;
          const k = shade(n);
          items.push({ d, draw: () => { ctx.fillStyle = tint || rgb(col, k); ctx.strokeStyle = tint || rgb(col, k * 0.8); ctx.lineWidth = 0.6; ctx.beginPath(); f.forEach((v, i) => { const [x, y] = scr(v, ox, oy); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
        }
      }
    }
    items.sort((p, q) => p.d - q.d);
    for (const it of items) it.draw();
  }

  function humanoid(o) {
    const s = o.h || 1, P = [], hw = o.w || 1;
    const legs = o.legs || '#554433', body = o.body || '#886644', skin = o.skin || '#e0b090', arms = o.arms || skin, boots = o.boots || '#332211';
    const hip = 44 * s, sh = 88 * s, knee = hip * 0.5, el = sh - 18 * s, hz = sh - 36 * s;
    for (const [g, y] of [['legL', -9 * hw], ['legR', 9 * hw]]) {
      P.push(['cap', [0, y, hip], [1.5, y, knee], 7.4 * hw, legs, g], ['cap', [1.5, y, knee], [0, y, 9], 6.2 * hw, o.shins || legs, g]);
      P.push(['ell', [5, y, 5], [10.5, 6.4, 5.4], boots, g]);
    }
    P.push(['ell', [0, 0, hip + 3], [11 * hw, 15 * hw, 9], o.hips || legs, 'body']);
    P.push(['ell', [0, 0, hip + (sh - hip) * 0.38], [10.5 * hw, 14 * hw, (sh - hip) * 0.36 + 4], o.waist || body, 'body']);
    P.push(['ell', [0.5, 0, sh - 12 * s], [12.5 * hw, 17 * hw, 17 * s], body, 'body']);
    if (o.belt) P.push(['ell', [0, 0, hip + 6], [12 * hw, 16 * hw, 4.5], o.belt, 'body']);
    if (o.head !== false) P.push(['cap', [0.5, 0, sh - 2], [1.5, 0, sh + 8 * s], 4.6 * hw, skin, 'body']);
    for (const [g, k] of [['armL', -1], ['armR', 1]]) {
      const y0 = 19 * hw * k, y1 = 22 * hw * k, y2 = 23 * hw * k;
      P.push(['cap', [0, y0, sh], [2, y1, el], 5.6 * hw, arms, g], ['cap', [2, y1, el], [7, y2, hz + 3], 4.8 * hw, o.forearms || arms, g]);
      P.push(['ball', [7, y2, hz], 5 * hw, o.hands || skin, g]);
      if (o.pads) P.push(['ball', [0, y0, sh + 2], 8 * hw, o.pads, g]);
    }
    if (o.head !== false) P.push(['ball', [2, 0, sh + 17 * s], 11 * (o.headS || 1), skin, 'head']);
    const pose = { hip, sh, hand: [7, 23 * hw, hz], handL: [7, -23 * hw, hz], head: [2, 0, sh + 17 * s], s, hw };
    return { P, pose, s };
  }
  const hm = (H, extra) => Object.assign({ parts: H.P, hip: H.pose.hip, sh: H.pose.sh }, extra);
  function quad(o) {
    const s = o.h || 1, P = [], col = o.body, leg = o.legs || col, L = o.len || 1;
    const hz = 30 * s;
    for (const [a, b, g] of [[16 * L, -9, 'legL'], [16 * L, 9, 'legR'], [-16 * L, -9, 'legR'], [-16 * L, 9, 'legL']]) P.push(['cap', [a * s, b * s, hz], [a * s, b * s, 3], 5.5 * s, leg, g === 'legL' ? (a > 0 ? 'legL' : 'legR2') : (a > 0 ? 'legR' : 'legL2')]);
    P.push(['ell', [0, 0, hz + 8 * s], [26 * s * L, 13 * s, 12 * s], col, 'body']);
    P.push(['ell', [30 * s * L, 0, hz + 18 * s], [11 * s, 8 * s, 8 * s], o.head || col, 'head']);
    if (o.snout) P.push(['ell', [40 * s * L, 0, hz + 15 * s], [6 * s, 4.5 * s, 4 * s], o.snout, 'head']);
    if (o.ears) P.push(['cone', [30 * s * L, -5 * s, hz + 24 * s], 3 * s, 8 * s, o.ears, 'head', 4], ['cone', [30 * s * L, 5 * s, hz + 24 * s], 3 * s, 8 * s, o.ears, 'head', 4]);
    if (o.tail) P.push(['cap', [-26 * s * L, 0, hz + 10 * s], [-38 * s * L, 0, hz + 2 * s], 3 * s, o.tail, 'body']);
    return { P, s };
  }
  const weaponGroup = (parts, g = 'armR') => parts.map(p => { const q = p.slice(); if (q[0] === 'cap') q[5] = g; else if (q[0] === 'box') q[4] = g; else if (q[0] === 'cone' || q[0] === 'cyl') q[5] = g; else if (q[0] === 'poly') q[3] = g; else q[4] = g; return q; });
  function sword(hand, len, col = '#c8ccd8', hilt = '#6a4a20', w = 3) { const [a, b, z] = hand; return weaponGroup([['cap', [a - 4, b, z + 2], [a + 6, b, z - 4], 2.5, hilt], ['box', [a + 8 + len / 2, b, z - 2], [len, w, 1.5], col, null, 0]]); }

  const MODELS = {};
  function def(id, m) { m.glows = m.parts.some(p => p[0] === 'glow'); MODELS[id] = m; return m; }
  const along = (hand, d, pitch, dz = 0, dy = 0) => [hand[0] + d * Math.cos(pitch), hand[1] + dy, hand[2] - d * Math.sin(pitch) + dz];
  function blade(hand, o) {
    const g = o.g || 'armR', p = o.pitch == null ? 0.3 : o.pitch, len = o.len, w = o.w || 5, t = o.t || 1.8, at = (d, dz) => along(hand, d, p, dz);
    const P = [['cap', at(-8, 0), at(2, 0), 2.3, o.grip || '#3a2a18', g], ['box', at(3, 0), [2.6, t + 2.4, w + (o.guardW || 8)], o.guard || '#8a7040', g, 0, p]];
    P.push(['box', at(4 + len / 2, 0), [len, t, w], o.col, g, 0, p], ['box', at(4 + len / 2, w * 0.3), [len * 0.97, t + 0.3, w * 0.28], o.edge || '#ffffff', g, 0, p]);
    if (o.tip !== false) P.push(['box', at(5 + len, -w * 0.1), [6, t, w * 0.55], o.col, g, 0, p + 0.25]);
    if (o.gem) P.push(['ball', at(3, 0), 2.4, o.gem, g]);
    if (o.pommel) P.push(['ball', at(-9, 0), 2.6, o.pommel, g]);
    if (o.glow) P.push(['glow', at(4 + len * 0.55, 0), o.glowR || 18, o.glow, g]);
    return P;
  }
  function cape(o) {
    const g = o.g || 'body', xT = o.x, wT = o.wTop, zT = o.zTop, xB = o.x - (o.flare || 10), wB = o.wBot, zB = o.zBot, xm = (xT + xB) / 2 - (o.bulge || 3), wm = (wT + wB) / 2 + 1, zm = (zT + zB) / 2;
    const P = [['poly', [[xT, -wT, zT], [xT, wT, zT], [xm, wm, zm], [xm, -wm, zm]], o.col, g, -4], ['poly', [[xm, -wm, zm], [xm, wm, zm], [xB, wB, zB], [xB, -wB, zB]], o.col2 || o.col, g, -4]];
    if (o.trim) P.push(['poly', [[xB + 0.2, -wB, zB + 5], [xB + 0.2, wB, zB + 5], [xB, wB, zB], [xB, -wB, zB]], o.trim, g, -3]);
    if (o.jag) { const n = 5; for (let i = 0; i < n; i++) { const y0 = -wB + i * 2 * wB / n, y1 = y0 + 2 * wB / n; P.push(['poly', [[xB, y0, zB], [xB, y1, zB], [xB - 1, (y0 + y1) / 2, zB - o.jag * (0.6 + (i % 2) * 0.6)]], o.col2 || o.col, g, -4]); } }
    return P;
  }
  const horn = (pts, r0, col, g = 'head') => pts.slice(1).map((p, i) => ['cap', pts[i], p, Math.max(0.8, r0 * (1 - i / (pts.length - 1) * 0.7)), col, g]);
  const GROUP_AT = { cap: 5, ball: 4, ell: 4, box: 4, cone: 5, cyl: 5, poly: 3, glow: 4 };
  const mirror = (parts) => parts.concat(parts.map(p => {
    const q = JSON.parse(JSON.stringify(p)), fy = (v) => [v[0], -v[1], v[2]], gi = GROUP_AT[q[0]];
    q[1] = q[0] === 'poly' ? q[1].map(fy) : fy(q[1]);
    if (q[0] === 'cap') q[2] = fy(q[2]);
    if (q[0] === 'box') q[5] = -(q[5] || 0);
    if (q[0] === 'cone' && q[7]) q[7] = -q[7];
    if (q[gi] === 'armR') q[gi] = 'armL'; else if (q[gi] === 'armL') q[gi] = 'armR';
    return q;
  }));
  const ring = (c, r, n, br, col, g, tilt = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return ['ball', [c[0] + Math.cos(a) * r * Math.cos(tilt), c[1] + Math.sin(a) * r, c[2] + Math.cos(a) * r * Math.sin(tilt)], br, col, g]; });
  const crownOf = (c, r, n, h, col, g = 'head') => [['ell', c, [r, r, 2.6], col, g], ...Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return ['cone', [c[0] + Math.cos(a) * r * 0.92, c[1] + Math.sin(a) * r * 0.92, c[2]], 2.2, h * (i % 2 ? 0.7 : 1), col, g, 4]; })];
  function wing(root, span, h, col, col2, g = 'body') {
    const [x, y, z] = root;
    return [['poly', [[x, y, z], [x - 10, y + span * 0.55, z + h], [x - 16, y + span, z + h * 0.8], [x - 12, y + span * 0.6, z + h * 0.1]], col, g, -6],
      ['poly', [[x, y, z], [x - 12, y + span * 0.6, z + h * 0.1], [x - 16, y + span * 0.85, z - h * 0.2], [x - 8, y + span * 0.35, z - h * 0.45]], col2 || col, g, -6]];
  }

  const HERO_ART = {
    techies: {
      meta: { scale: 1, atk: 'throw', hover: 0, h: 80, wheels: true, bust: [52, 62], outline: true },
      base() {
        const P = [];
        P.push(['box', [0, 0, 22], [56, 36, 14], '#7a5028'], ['box', [0, 0, 31], [58, 38, 3], '#9a6a38'], ['box', [27, 0, 26], [4, 38, 6], '#5a3818'], ['box', [-27, 0, 26], [4, 38, 6], '#5a3818']);
        for (const [a, b] of [[18, -21], [18, 21], [-18, -21], [-18, 21]]) P.push(['cyl', [a, b - 3, 12], 11, 6, '#4a3018', 'wheel', 10], ['cyl', [a, b - 1, 12], 3, 3, '#a08050', 'wheel', 6]);
        P.push(['cap', [30, 0, 22], [42, 0, 18], 1.6, '#5a3818']);
        for (const [a, b, c, g] of [[14, -10, '#6a9a3a', 'armL'], [14, 10, '#5a8a30', 'armR'], [0, 0, '#7aaa40', 'head']]) {
          P.push(['ell', [a, b, 42], [8, 8, 10], '#8a4a2a', g], ['ell', [a, b, 38], [8.5, 8.5, 3], '#3a2a18', g], ['ball', [a + 2, b, 58], 8, c, g]);
          P.push(['cone', [a + 1, b - 7, 60], 2.5, 9, c, g, 4, -0.5], ['cone', [a + 1, b + 7, 60], 2.5, 9, c, g, 4, 0.5]);
          P.push(['ell', [a + 9, b, 56], [2, 3, 2], '#4a6a2a', g]);
        }
        return { P };
      },
      slots: {
        weapon: {
          default: () => [['cap', [18, 10, 50], [30, 12, 60], 1.5, '#5a3a18', 'armR'], ['ball', [31, 12, 62], 3.5, '#ff8020', 'armR'], ['ball', [31, 12, 65], 2, '#ffe060', 'armR']],
          dynamite: () => [...[-2.5, 0, 2.5].map(d => ['cap', [22, 10 + d, 48], [26, 10 + d, 62], 2.2, '#c02818', 'armR']), ['ell', [24, 10, 55], [3, 5.5, 1.5], '#e0d0a0', 'armR'], ['cap', [26, 10, 62], [30, 14, 68], 0.8, '#303030', 'armR'], ['ball', [30, 14, 69], 2, '#ffd040', 'armR']],
          wrench: () => [['cap', [18, 10, 46], [34, 12, 66], 2.2, '#8a8a92', 'armR'], ['box', [36, 12, 69], [8, 3, 5], '#a0a0a8', 'armR', 0.6], ['box', [38, 14, 73], [3, 3, 7], '#a0a0a8', 'armR'], ['box', [38, 9, 72], [3, 3, 7], '#a0a0a8', 'armR'], ['cap', [18, 10, 46], [22, 10, 51], 2.6, '#c02818', 'armR']],
          launcher: () => [['cyl', [14, 12, 62], 5, 4, '#4a5a3a', 'armR', 8], ['cap', [-4, 12, 60], [32, 12, 70], 4.4, '#4a5a3a', 'armR'], ['cap', [30, 12, 69.5], [34, 12, 71], 5, '#303030', 'armR'], ['cone', [34, 12, 67], 3, 8, '#e04020', 'armR', 6], ['box', [8, 12, 56], [4, 3, 8], '#303030', 'armR'], ['glow', [-6, 12, 59], 10, '#ff8020', 'armR'], ['glow', [35, 12, 72], 7, '#ffb040', 'armR']]
        },
        head: {
          default: () => [[14, -10, 'armL'], [14, 10, 'armR'], [0, 0, 'head']].flatMap(([a, b, g]) => [['ell', [a + 7, b, 61], [2, 6, 2.2], '#303030', g], ['ball', [a + 8.5, b - 2.5, 61], 1.8, '#90e0ff', g], ['ball', [a + 8.5, b + 2.5, 61], 1.8, '#90e0ff', g]]),
          miner: () => [[14, -10, 'armL'], [14, 10, 'armR'], [0, 0, 'head']].flatMap(([a, b, g]) => [['ell', [a + 2, b, 64], [9, 9, 5], '#e0b020', g], ['ell', [a + 2, b, 62], [11, 11, 1.5], '#c09010', g], ['ball', [a + 10, b, 65], 2.4, '#fff4a0', g], ['ell', [a + 8, b, 58], [2, 5, 1.8], '#303030', g]]),
          tophat: () => [[14, -10, 'armL'], [14, 10, 'armR'], [0, 0, 'head']].flatMap(([a, b, g]) => [['cyl', [a + 2, b, 62], 10, 2, '#1a1a1e', g, 10], ['cyl', [a + 2, b, 64], 6.5, 12, '#202026', g, 10], ['cyl', [a + 2, b, 65], 6.8, 2.5, '#a02020', g, 10], ['ell', [a + 8, b, 58], [2, 5, 1.8], '#303030', g]]),
          pirate: () => [[14, -10, 'armL'], [14, 10, 'armR'], [0, 0, 'head']].flatMap(([a, b, g]) => [['ell', [a + 2, b, 64], [8, 9, 4], '#2a1a14', g], ['cap', [a + 2, b - 10, 66], [a + 2, b + 10, 66], 2.6, '#2a1a14', g], ['cap', [a - 6, b, 66], [a + 9, b, 66], 2.4, '#2a1a14', g], ['ball', [a + 8, b, 67], 1.6, '#e0e0d0', g], ['ball', [a + 9, b - 2.5, 58], 2, '#101010', g]])
        },
        back: {
          default: () => [['cyl', [-12, 0, 33], 12, 26, '#8a5a2a', null, 10], ['cyl', [-12, 0, 39], 12.5, 2, '#303030', null, 10], ['cyl', [-12, 0, 52], 12.5, 2, '#303030', null, 10], ['cap', [-12, 0, 59], [-10, 3, 70], 1.5, '#e0e0a0'], ['ball', [-10, 3, 71], 3, '#ffb020']],
          crates: () => [['box', [-14, -6, 40], [18, 18, 16], '#a07038', null, 0.2], ['box', [-12, 8, 38], [16, 14, 12], '#8a6030', null, -0.3], ['box', [-13, 0, 56], [14, 14, 12], '#b08040', null, 0.5], ['box', [-5.8, 0, 56], [0.8, 12, 2.5], '#c02818', null, 0.5], ['box', [-4.6, -6, 40], [0.8, 16, 3], '#c02818', null, 0.2]],
          bigbomb: () => [['ball', [-12, 0, 52], 21, '#2a2a30'], ['cyl', [-10, 2, 71], 5, 5, '#505058', null, 8], ['cap', [-10, 2, 76], [-4, 8, 86], 1.3, '#d0c090'], ['ball', [-4, 8, 87], 3, '#ffd040'], ['ell', [-6, -8, 64], [5, 5, 4], '#5a5a66']],
          cannon: () => [['cyl', [-16, -12, 34], 8, 4, '#4a3018', null, 10], ['cyl', [-16, 12, 34], 8, 4, '#4a3018', null, 10], ['cap', [-20, 0, 38], [4, 0, 66], 7, '#3a3a42'], ['cap', [2, 0, 63], [6, 0, 68], 8, '#2a2a30'], ['ball', [-22, 0, 36], 7, '#3a3a42'], ['cyl', [-8, 0, 50], 8.5, 2.5, '#c89030', null, 10]]
        }
      }
    },
    enigma: {
      meta: { scale: 1.1, atk: 'swing', hover: 14, h: 150, bust: [96, 70], outline: true },
      base() {
        const P = [];
        P.push(['ell', [0, 0, 60], [16, 18, 30], '#2a1a4a', 'body'], ['ell', [0, 0, 38], [12, 14, 18], '#1a1030', 'body'], ['ell', [5, 0, 70], [8, 12, 14], '#3a2464', 'body']);
        P.push(['cone', [-2, 0, 20], 12, -22, '#140a28', 'body', 6]);
        P.push(['ball', [3, 0, 100], 13, '#3a2a6a', 'head'], ['ell', [12, 0, 100], [2, 8, 3], '#e0d0ff', 'head'], ['ell', [11, 0, 92], [3, 7, 3], '#1a1030', 'head']);
        P.push(['cap', [0, -20, 82], [8, -27, 66], 6, '#2a1a4a', 'armL'], ['cap', [8, -27, 66], [14, -31, 54], 5, '#3a2464', 'armL']);
        P.push(['cap', [0, 20, 82], [8, 27, 66], 6, '#2a1a4a', 'armR'], ['cap', [8, 27, 66], [14, 31, 54], 5, '#3a2464', 'armR']);
        return { P };
      },
      slots: {
        weapon: {
          default: () => [['ball', [16, -31, 50], 6, '#9a7aff', 'armL'], ['ball', [16, 31, 50], 6, '#9a7aff', 'armR'], ['ball', [15, -32, 52], 2.4, '#e8e0ff', 'armL'], ['ball', [15, 30, 52], 2.4, '#e8e0ff', 'armR']],
          shards: () => mirror([['ball', [16, 31, 50], 5, '#9a7aff', 'armR'], ['cone', [18, 34, 36], 3, 14, '#c0a0ff', 'armR', 4], ['cone', [12, 30, 30], 2.2, 10, '#a080ff', 'armR', 4, 0.6], ['cone', [22, 28, 32], 2, 9, '#e0d0ff', 'armR', 4, 1.1]]),
          claws: () => mirror([['ball', [16, 31, 50], 5.5, '#3a2464', 'armR'], ...[-3, 0, 3].map(d => ['cap', [18, 31 + d, 48], [30, 32 + d * 1.6, 38], 1.4, '#d0c0ff', 'armR']), ...[-3, 0, 3].map(d => ['cap', [30, 32 + d * 1.6, 38], [34, 32 + d * 1.8, 42], 1, '#ffffff', 'armR'])]),
          singularity: () => mirror([['ball', [18, 32, 50], 7, '#050208', 'armR'], ...ring([18, 32, 50], 10, 8, 1.6, '#c090ff', 'armR', 0.6), ['glow', [18, 32, 50], 16, '#8040ff', 'armR']])
        },
        head: {
          default: () => mirror([['cap', [0, 10, 108], [-8, 24, 132], 4, '#5a3a9a', 'head'], ['cap', [-8, 24, 132], [4, 30, 150], 2.5, '#8a6ada', 'head']]),
          crown: () => [...crownOf([3, 0, 112], 11, 7, 14, '#b090ff'), ...mirror([['cone', [0, 8, 110], 3, 22, '#d0c0ff', 'head', 4, 0.3]])],
          split: () => mirror([['cap', [0, 9, 108], [-6, 22, 128], 4, '#5a3a9a', 'head'], ['cap', [-6, 22, 128], [2, 26, 146], 2.4, '#8a6ada', 'head'], ['cap', [-6, 22, 128], [-18, 34, 140], 2.2, '#8a6ada', 'head'], ['cap', [-3, 16, 118], [-14, 22, 116], 2, '#6a4aaa', 'head']]),
          halo: () => [...mirror([['cap', [0, 10, 108], [-6, 18, 124], 3.5, '#5a3a9a', 'head']]), ...ring([-2, 0, 136], 18, 16, 2, '#ffffff', 'head', 0.25), ['glow', [-2, 0, 136], 22, '#a070ff', 'head']]
        },
        back: {
          default: () => Array.from({ length: 9 }, (_, i) => { const a = i * 2.39, r = 12 + (i % 3) * 4; return ['ball', [Math.cos(a) * r * 0.8, Math.sin(a) * r, 40 + (i * 7) % 50], 1.8, i % 2 ? '#ffffff' : '#c0b0ff', 'body']; }),
          rocks: () => Array.from({ length: 6 }, (_, i) => { const a = i * 1.05 + 0.3, r = 26; return ['box', [Math.cos(a) * r - 6, Math.sin(a) * r, 50 + (i % 3) * 18], [7 + (i % 2) * 3, 6, 6], i % 2 ? '#4a3a6a' : '#5a4a7a', 'body', a]; }),
          nebula: () => [...cape({ x: -12, wTop: 16, zTop: 90, wBot: 26, zBot: 18, col: '#3a1a6a', col2: '#6a2a8a', flare: 14 }), ...Array.from({ length: 7 }, (_, i) => ['ball', [-22 - (i % 2) * 2, -18 + i * 6, 30 + (i * 13) % 50], 1.5, '#ffffff', 'body'])],
          rings: () => [...ring([0, 0, 64], 30, 18, 1.8, '#d0c0ff', 'body', 0.45), ...ring([0, 0, 64], 36, 14, 1.3, '#8a70ff', 'body', -0.35), ['glow', [0, 0, 64], 20, '#5020c0', 'body']]
        }
      }
    },
    sven: {
      meta: { scale: 1.05, atk: 'swing', h: 150, bust: [110, 62], outline: true },
      base() {
        const H = humanoid({ h: 1.1, w: 1.15, body: '#4c5d92', waist: '#3a4a78', legs: '#34405e', shins: '#7888b8', arms: '#4c5d92', forearms: '#8898c8', hands: '#6a78a8', skin: '#d8a880', boots: '#262634', belt: '#6a4a2a', head: false });
        H.P.push(['ell', [7, 0, 84], [7, 13, 12], '#9aaad8', 'body'], ['box', [12.5, 0, 54], [3, 7, 6], '#d8b860', 'body'], ['cap', [0.5, 0, 94], [1.5, 0, 104], 5, '#d8a880', 'body']);
        H.P.push(['ball', [0, -21.8, 99], 9, '#9aaad8', 'armL'], ['ball', [0, 21.8, 99], 9, '#9aaad8', 'armR'], ['ball', [0, -22, 101], 4, '#c8d0f0', 'armL'], ['ball', [0, 22, 101], 4, '#c8d0f0', 'armR']);
        return H;
      },
      slots: {
        weapon: {
          default: (H) => blade(H.pose.hand, { len: 62, w: 8, t: 2.2, col: '#c0c8d8', edge: '#f0f4ff', guard: '#7a6a50', grip: '#4a3018', pommel: '#8a7050' }),
          gilded: (H) => blade(H.pose.hand, { len: 62, w: 8, t: 2.2, col: '#d8b048', edge: '#fff0a0', guard: '#8a2020', grip: '#3a1a10', gem: '#ff3030', pommel: '#e0c060' }),
          frost: (H) => [...blade(H.pose.hand, { len: 66, w: 8.5, t: 2.2, col: '#90d0f0', edge: '#e8fcff', guard: '#3a5a9a', grip: '#20304a', gem: '#60ffff', pommel: '#a0e0ff', glow: '#60c8ff', glowR: 16 }), ['cone', along(H.pose.hand, 30, 0.3, 4), 2.4, 9, '#e0f8ff', 'armR', 4], ['cone', along(H.pose.hand, 48, 0.3, 3), 2, 7, '#e0f8ff', 'armR', 4]],
          dragonbone: (H) => [...blade(H.pose.hand, { len: 72, w: 9, t: 2.6, col: '#e4dcc4', edge: '#fffaf0', guard: '#5a1a10', grip: '#2a1008', gem: '#ff5020', pommel: '#c8b890', glow: '#ff5020', glowR: 20 }), ...[18, 32, 46, 60].map(d => ['cone', along(H.pose.hand, d, 0.3, 4), 2.6, 8, '#c8b890', 'armR', 4, 0.4]), ['glow', along(H.pose.hand, 3, 0.3), 9, '#ff8030', 'armR']]
        },
        head: {
          default: () => [['ball', [2, 0, 117], 12.5, '#8a9ac8', 'head'], ['box', [11.5, 0, 115], [2, 12, 4], '#101018', 'head'], ['box', [12, 0, 109], [2, 3, 8], '#101018', 'head'], ...horn([[0, -11, 122], [-2, -19, 131], [-8, -21, 146]], 3.3, '#e8e0c0'), ...horn([[0, 11, 122], [-2, 19, 131], [-8, 21, 146]], 3.3, '#e8e0c0'), ['cap', [-3, 0, 129], [-12, 0, 136], 3, '#c03020', 'head']],
          winged: () => [['ball', [2, 0, 117], 12.5, '#c8ccd8', 'head'], ['box', [11.5, 0, 115], [2, 12, 4], '#101018', 'head'], ['box', [3, 0, 129], [18, 2.4, 3], '#e0c060', 'head'], ...mirror([['poly', [[-1, 11, 118], [-6, 17, 146], [-14, 24, 138], [-12, 16, 118]], '#f4f4f0', 'head'], ['poly', [[-6, 13, 120], [-14, 24, 138], [-18, 22, 124], [-12, 15, 116]], '#d8d8d0', 'head']])],
          skull: () => [['ball', [2, 0, 117], 12.5, '#e8e0c8', 'head'], ['ell', [12, -4.5, 118], [2, 3, 3], '#1a1010', 'head'], ['ell', [12, 4.5, 118], [2, 3, 3], '#1a1010', 'head'], ['ell', [13.5, 0, 113], [1, 1.5, 2], '#1a1010', 'head'], ['box', [9, 0, 106], [8, 13, 5], '#d8d0b8', 'head'], ...[-4, -1.3, 1.3, 4].map(y => ['box', [13.2, y, 107], [1, 1.6, 3], '#fffaf0', 'head']), ...horn([[0, -11, 122], [0, -20, 128], [-4, -26, 140]], 3.4, '#2a2020'), ...horn([[0, 11, 122], [0, 20, 128], [-4, 26, 140]], 3.4, '#2a2020')],
          crown: () => [['ball', [2, 0, 117], 12.5, '#c89838', 'head'], ['box', [11.5, 0, 115], [2, 12, 4], '#101018', 'head'], ['box', [12, 0, 109], [2, 3, 8], '#101018', 'head'], ...crownOf([2, 0, 127], 11, 8, 10, '#f0d060'), ['ball', [13, 0, 125], 2.6, '#ff2030', 'head'], ['cap', [-4, 0, 130], [-16, 0, 124], 3.4, '#c02020', 'head'], ['cap', [-16, 0, 124], [-22, 0, 112], 2.4, '#e03030', 'head']]
        },
        back: {
          default: () => cape({ x: -12, wTop: 16, zTop: 98, wBot: 22, zBot: 24, col: '#2a3a8a', col2: '#22307a', trim: '#8a9ac8' }),
          crimson: () => cape({ x: -12, wTop: 16, zTop: 98, wBot: 24, zBot: 20, col: '#9a1a1a', col2: '#801414', trim: '#e0c060' }),
          fur: () => [...cape({ x: -12, wTop: 16, zTop: 98, wBot: 22, zBot: 30, col: '#5a3a20', col2: '#4a2e18' }), ['ell', [-3, -16, 101], [11, 12, 7], '#9a7a58', 'body'], ['ell', [-3, 16, 101], [11, 12, 7], '#9a7a58', 'body'], ['ell', [-9, 0, 100], [8, 18, 7], '#aa8a66', 'body']],
          banner: () => [...cape({ x: -12, wTop: 16, zTop: 98, wBot: 22, zBot: 24, col: '#2a3a8a', col2: '#22307a', trim: '#e0c060' }), ['cap', [-16, 8, 50], [-18, 10, 176], 1.8, '#5a3a1a', 'body'], ['ball', [-18, 10, 178], 3, '#e0c060', 'body'], ['poly', [[-18, 10, 172], [-18, 34, 169], [-18, 30, 156], [-18, 34, 143], [-18, 10, 146]], '#b02020', 'body'], ['poly', [[-18.3, 15, 164], [-18.3, 24, 162], [-18.3, 24, 152], [-18.3, 15, 154]], '#e0c060', 'body']]
        }
      }
    },
    crystal_maiden: {
      meta: { scale: 1, atk: 'cast', h: 125, bust: [102, 56], outline: true },
      base() {
        const H = humanoid({ w: 0.95, body: '#4a8ad0', waist: '#3a78c0', legs: '#3a6aa0', arms: '#e8eef8', forearms: '#d8e4f4', skin: '#f0d0c0', boots: '#e0e8f0', belt: '#ffffff', headS: 0.86 });
        H.P.push(['cone', [0, 0, 6], 20, 46, '#3a7ac0', 'body', 8, 12], ['cone', [0, 0, 6], 20.5, 5, '#e8f0ff', 'body', 8, 19], ['ell', [-2, 0, 90], [12, 16, 6.5], '#f0f4ff', 'body']);
        H.P.push(['ell', [11, -3, 107], [1, 1.6, 1.4], '#2a4a8a', 'head'], ['ell', [11, 3, 107], [1, 1.6, 1.4], '#2a4a8a', 'head']);
        return H;
      },
      slots: {
        weapon: {
          default: () => [['cap', [7, 22, 92], [7, 22, 18], 2, '#a0c0e0', 'armR'], ['ball', [7, 22, 98], 6, '#b0f0ff', 'armR'], ['cone', [7, 22, 102], 3, 9, '#e0faff', 'armR', 5]],
          lantern: () => [['cap', [7, 22, 96], [7, 22, 18], 2.1, '#7a5a38', 'armR'], ['cap', [7, 22, 96], [14, 22, 100], 1.4, '#7a5a38', 'armR'], ['cap', [14, 22, 100], [14, 22, 94], 0.6, '#303030', 'armR'], ['box', [14, 22, 89], [6, 6, 8], '#fff0a0', 'armR'], ['box', [14, 22, 93.5], [7, 7, 1.5], '#3a3030', 'armR'], ['box', [14, 22, 84.5], [7, 7, 1.5], '#3a3030', 'armR']],
          snowflake: () => [['cap', [7, 22, 92], [7, 22, 18], 2, '#d8e8f8', 'armR'], ['ball', [7, 22, 102], 3, '#ffffff', 'armR'], ...[0, 1, 2].map(i => { const a = i * Math.PI / 3; return ['cap', [7 + Math.cos(a) * 12, 22, 102 + Math.sin(a) * 12], [7 - Math.cos(a) * 12, 22, 102 - Math.sin(a) * 12], 1.3, '#c0f0ff', 'armR']; }), ...[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return ['ball', [7 + Math.cos(a) * 12, 22, 102 + Math.sin(a) * 12], 1.8, '#e8fcff', 'armR']; })],
          glacier: () => [['cap', [7, 22, 92], [7, 22, 16], 2.3, '#80b0e0', 'armR'], ['cone', [7, 22, 92], 5, 20, '#a8e8ff', 'armR', 5], ['cone', [4, 18, 90], 3.2, 13, '#d0f4ff', 'armR', 5, 0.4], ['cone', [10, 26, 90], 3, 12, '#80d0ff', 'armR', 5, 0.9], ['cone', [7, 22, 18], 3, -8, '#a8e8ff', 'armR', 5], ['glow', [7, 22, 100], 18, '#70d8ff', 'armR']]
        },
        head: {
          default: () => [['ell', [-3, 0, 108], [11, 12, 12], '#f0e0a0', 'head'], ['cone', [-2, 0, 112], 11, 16, '#5a9ae0', 'head', 6], ['ell', [-1, 0, 113], [11.5, 12.5, 3], '#e8f0ff', 'head']],
          furhat: () => [['ell', [-3, 0, 106], [11, 12, 12], '#f0e0a0', 'head'], ['ell', [0, 0, 115], [12, 13, 8], '#f4f8ff', 'head'], ['ell', [1, 0, 113], [13, 14, 3.5], '#d8e0ec', 'head'], ['ball', [-2, 0, 124], 4, '#ffffff', 'head'], ['ell', [2, -12, 106], [4, 3, 8], '#f4f8ff', 'head'], ['ell', [2, 12, 106], [4, 3, 8], '#f4f8ff', 'head']],
          tiara: () => [['ell', [-3, 0, 108], [11, 12, 12], '#f0e0a0', 'head'], ['cap', [-8, 0, 108], [-14, 0, 88], 5, '#f0e0a0', 'head'], ['ell', [2, 0, 113], [10, 11, 2], '#c8e8ff', 'head'], ['cone', [11, 0, 113], 2.5, 11, '#e0faff', 'head', 4], ['cone', [9, -5, 113], 1.8, 7, '#b0e8ff', 'head', 4], ['cone', [9, 5, 113], 1.8, 7, '#b0e8ff', 'head', 4], ['ball', [11.5, 0, 114], 1.6, '#60c0ff', 'head']],
          cowl: () => [['ell', [-3, 0, 108], [11, 12, 12], '#f0e0a0', 'head'], ['ell', [-3, 0, 110], [13, 14, 14], '#3a70c0', 'head'], ['cone', [-6, 0, 118], 10, 18, '#2a60b0', 'head', 6, 0.3], ['ell', [-1, 0, 110], [13.5, 14.5, 3], '#ffffff', 'head'], ...[0, 1, 2].map(i => { const a = i * Math.PI / 3; return ['cap', [-8, Math.cos(a) * 9, 134 + Math.sin(a) * 9], [-8, -Math.cos(a) * 9, 134 - Math.sin(a) * 9], 1.2, '#e0f8ff', 'head']; }), ['glow', [-8, 0, 134], 12, '#80e0ff', 'head']]
        },
        back: {
          default: () => cape({ x: -10, wTop: 14, zTop: 90, wBot: 20, zBot: 28, col: '#dae6f6', col2: '#c4d4ea', trim: '#ffffff' }),
          mantle: () => [...cape({ x: -10, wTop: 14, zTop: 90, wBot: 17, zBot: 50, col: '#f4f8ff', col2: '#e0e8f4' }), ['ell', [-1, -14, 91], [9, 10, 6], '#ffffff', 'body'], ['ell', [-1, 14, 91], [9, 10, 6], '#ffffff', 'body']],
          royal: () => cape({ x: -10, wTop: 15, zTop: 90, wBot: 26, zBot: 6, col: '#2a3a8a', col2: '#22307a', trim: '#ffffff', flare: 16 }),
          wings: () => [...mirror(wing([-10, 6, 84], 34, 34, '#b0e8ff', '#d8f6ff')), ['glow', [-18, 0, 90], 18, '#80d8ff', 'body']]
        }
      }
    },
    sniper: {
      meta: { scale: 1, atk: 'shoot', h: 95, bust: [74, 46], outline: true },
      base() {
        const H = humanoid({ h: 0.78, w: 1.2, body: '#8a6a3a', waist: '#7a5a30', legs: '#5a4a2a', arms: '#8a6a3a', forearms: '#6a4a2a', skin: '#e0a880', boots: '#3a2a18', belt: '#3a2a18', head: false });
        H.P.push(['ell', [6, 0, 72], [7, 11, 10], '#d0c0a0', 'head'], ['ball', [2, 0, 83], 9, '#e0a880', 'head'], ['ball', [11, 0, 81], 3, '#d09070', 'head'], ['ell', [8, 0, 68], [4, 7, 6], '#c8b890', 'head']);
        H.P.push(['cap', [13, -10, 56], [13, 10, 56], 1.6, '#5a3a20', 'body'], ...[-6, -2, 2, 6].map(y => ['box', [13.5, y, 56], [1.5, 1.6, 4], '#d0a040', 'body']));
        return H;
      },
      slots: {
        weapon: {
          default: (H) => { const [a, b, z] = H.pose.hand; return [['cap', [a - 14, b, z + 2], [a + 18, b, z + 8], 2.8, '#5a3a20', 'armR'], ['cap', [a + 12, b, z + 8], [a + 62, b, z + 14], 1.8, '#4a4a52', 'armR'], ['box', [a + 10, b + 1, z + 12], [12, 2.6, 3.6], '#303038', 'armR', 0, -0.12], ['ball', [a + 16, b + 1, z + 12], 1.6, '#80e0ff', 'armR']]; },
          blunderbuss: (H) => { const [a, b, z] = H.pose.hand; return [['cap', [a - 12, b, z + 2], [a + 14, b, z + 7], 3, '#6a4020', 'armR'], ['cap', [a + 10, b, z + 7], [a + 38, b, z + 11], 2.4, '#b08838', 'armR'], ['cap', [a + 36, b, z + 10.5], [a + 42, b, z + 12], 4.4, '#c89840', 'armR'], ['cap', [a + 41, b, z + 11.8], [a + 43, b, z + 12.2], 3, '#2a2010', 'armR']]; },
          brass: (H) => { const [a, b, z] = H.pose.hand; return [['cap', [a - 14, b, z + 2], [a + 18, b, z + 8], 2.8, '#3a2414', 'armR'], ['cap', [a + 12, b, z + 8], [a + 70, b, z + 15], 2, '#d0a848', 'armR'], ['cap', [a + 4, b + 1, z + 14], [a + 26, b + 1, z + 17], 2.2, '#b08030', 'armR'], ['ball', [a + 27, b + 1, z + 17], 2.4, '#80e0ff', 'armR'], ['cap', [a + 66, b, z + 14.5], [a + 70, b, z + 15], 2.6, '#a07828', 'armR']]; },
          dragon: (H) => { const [a, b, z] = H.pose.hand; return [['cap', [a - 14, b, z + 2], [a + 18, b, z + 8], 2.8, '#4a1a10', 'armR'], ['cap', [a + 12, b, z + 8], [a + 56, b, z + 13], 2.1, '#3a3a42', 'armR'], ['ell', [a + 62, b, z + 14], [7, 4, 4], '#8a2a18', 'armR'], ['cone', [a + 62, b - 2, z + 16], 1.4, 6, '#e8e0c8', 'armR', 4, -0.4], ['cone', [a + 62, b + 2, z + 16], 1.4, 6, '#e8e0c8', 'armR', 4, 0.4], ['ball', [a + 64, b + 3, z + 16], 1.2, '#ffe040', 'armR'], ['glow', [a + 69, b, z + 14], 12, '#ff6020', 'armR']]; }
        },
        head: {
          default: () => [['ell', [0, 0, 90], [10.5, 10.5, 5], '#6a4a2a', 'head'], ['ell', [3, 0, 88], [11, 11, 1.6], '#5a3a20', 'head'], ['ell', [9, 0, 86], [2, 7, 2.5], '#80e0ff', 'head']],
          aviator: () => [['ell', [0, 0, 88], [11, 11, 7], '#6a4020', 'head'], ['ell', [3, -9, 80], [4, 2.5, 7], '#6a4020', 'head'], ['ell', [3, 9, 80], [4, 2.5, 7], '#6a4020', 'head'], ['ell', [6, 0, 93], [3, 9, 2.5], '#3a3a3a', 'head'], ['ball', [8, -4, 93.5], 2.4, '#ffc040', 'head'], ['ball', [8, 4, 93.5], 2.4, '#ffc040', 'head']],
          horned: () => [['ell', [0, 0, 89], [10.5, 10.5, 7], '#8a8a92', 'head'], ['ell', [2, 0, 85], [11, 11, 1.5], '#c8a040', 'head'], ...horn([[0, -9, 90], [-1, -17, 96], [3, -20, 106]], 2.6, '#e8e0c8'), ...horn([[0, 9, 90], [-1, 17, 96], [3, 20, 106]], 2.6, '#e8e0c8'), ['ell', [9, 0, 86], [2, 7, 2.5], '#80e0ff', 'head']],
          tricorn: () => [['ell', [0, 0, 91], [9.5, 10, 5], '#2a1a14', 'head'], ['cap', [2, -12, 92], [8, 0, 90], 2.6, '#2a1a14', 'head'], ['cap', [8, 0, 90], [2, 12, 92], 2.6, '#2a1a14', 'head'], ['cap', [2, -12, 92], [-8, 0, 94], 2.6, '#2a1a14', 'head'], ['cap', [-8, 0, 94], [2, 12, 92], 2.6, '#2a1a14', 'head'], ['poly', [[-4, 4, 95], [-14, 9, 112], [-12, 12, 110], [-2, 7, 95]], '#e04030', 'head'], ['ell', [9, 0, 86], [2, 7, 2.5], '#80e0ff', 'head']]
        },
        back: {
          default: () => [['box', [-13, 0, 56], [9, 18, 20], '#6a5030', 'body'], ['box', [-13, 0, 66], [10, 19, 3], '#5a4020', 'body'], ...[-5, 0, 5].map(y => ['cap', [-17, y, 50], [-17, y, 62], 1.2, '#d0a040', 'body'])],
          keg: () => [['cyl', [-15, 0, 44], 10, 26, '#8a5a2a', null, 10], ['cyl', [-15, 0, 47], 10.5, 2, '#3a3a3a', null, 10], ['cyl', [-15, 0, 64], 10.5, 2, '#3a3a3a', null, 10], ['cap', [-5, 0, 56], [-2, 0, 56], 1.5, '#c0a060', 'body']],
          bedroll: () => [['box', [-13, 0, 56], [9, 18, 20], '#6a5030', 'body'], ['cap', [-14, -14, 70], [-14, 14, 70], 5.5, '#4a7a4a', 'body'], ['cap', [-14, -9, 70], [-14, -8, 70], 6, '#3a2a18', 'body'], ['cap', [-14, 8, 70], [-14, 9, 70], 6, '#3a2a18', 'body'], ['cyl', [-19, 0, 50], 6, 1.5, '#303030', null, 10], ['cap', [-19, 0, 51], [-19, 0, 38], 1.2, '#303030', 'body']],
          flag: () => [['box', [-13, 0, 56], [9, 18, 20], '#6a5030', 'body'], ['cap', [-16, 6, 50], [-18, 7, 128], 1.4, '#5a3a1a', 'body'], ['poly', [[-18, 7, 126], [-18, 26, 122], [-18, 24, 112], [-18, 7, 108]], '#2a5a9a', 'body'], ['poly', [[-18.3, 12, 121], [-18.3, 20, 119], [-18.3, 20, 113], [-18.3, 12, 114]], '#f0e0a0', 'body']]
        }
      }
    },
    axe: {
      meta: { scale: 1.1, atk: 'swing', h: 155, bust: [116, 60], outline: true },
      base() {
        const H = humanoid({ h: 1.15, w: 1.3, body: '#b83a2a', waist: '#a02e20', legs: '#3a2a20', shins: '#4a3428', arms: '#c84a3a', forearms: '#3a2a20', hands: '#c84a3a', skin: '#c84a3a', boots: '#2a1a10', belt: '#2a2a2a', hips: '#4a3020' });
        H.P.push(['ell', [10, -6, 90], [5, 7, 6], '#d05444', 'body'], ['ell', [10, 6, 90], [5, 7, 6], '#d05444', 'body'], ['ball', [14, 0, 57], 3.6, '#d8d0c0', 'body']);
        H.P.push(['ell', [13, -4, 123], [1.4, 2.4, 1.4], '#ffe060', 'head'], ['ell', [13, 4, 123], [1.4, 2.4, 1.4], '#ffe060', 'head'], ['ell', [11, 0, 113], [4.5, 8, 4.5], '#1a1010', 'head'], ['ell', [12.5, 0, 119], [2, 2, 2.5], '#b03a2a', 'head']);
        return H;
      },
      slots: {
        weapon: {
          default: (H) => { const h = H.pose.hand; return [['cap', [h[0] - 6, h[1], h[2] + 8], [h[0] + 32, h[1], h[2] - 16], 2.6, '#5a3a18', 'armR'], ['box', [h[0] + 30, h[1], h[2] - 12], [12, 2.6, 28], '#9a9aa2', 'armR', 0, 0.55], ['box', [h[0] + 35, h[1], h[2] - 9], [3, 3, 29], '#e0e0e8', 'armR', 0, 0.55]]; },
          double: (H) => { const h = H.pose.hand; return [['cap', [h[0] - 6, h[1], h[2] + 8], [h[0] + 34, h[1], h[2] - 17], 2.6, '#4a3018', 'armR'], ['box', [h[0] + 30, h[1], h[2] - 12], [26, 2.6, 22], '#8a8a92', 'armR', 0, 0.55], ['box', [h[0] + 42, h[1], h[2] - 20], [3, 3, 24], '#e0e0e8', 'armR', 0, 0.55], ['box', [h[0] + 19, h[1], h[2] - 3], [3, 3, 24], '#e0e0e8', 'armR', 0, 0.55], ['ball', [h[0] + 30, h[1], h[2] - 12], 3, '#c89030', 'armR']]; },
          bone: (H) => { const h = H.pose.hand; return [['cap', [h[0] - 6, h[1], h[2] + 8], [h[0] + 32, h[1], h[2] - 16], 2.8, '#d8d0b8', 'armR'], ['ball', [h[0] - 6, h[1], h[2] + 8], 3.4, '#e8e0c8', 'armR'], ['box', [h[0] + 30, h[1], h[2] - 12], [13, 2.8, 30], '#e8e0c8', 'armR', 0, 0.55], ...[0, 1, 2, 3].map(i => ['cone', [h[0] + 38 + i * 1.6, h[1], h[2] - 22 + i * 7], 1.8, 5, '#fffaf0', 'armR', 4, 0.6])]; },
          inferno: (H) => { const h = H.pose.hand; return [['cap', [h[0] - 6, h[1], h[2] + 8], [h[0] + 32, h[1], h[2] - 16], 2.6, '#1a1210', 'armR'], ['box', [h[0] + 30, h[1], h[2] - 12], [14, 2.8, 30], '#2a2020', 'armR', 0, 0.55], ['box', [h[0] + 36, h[1], h[2] - 9], [3.4, 3.2, 31], '#ff7020', 'armR', 0, 0.55], ['glow', [h[0] + 36, h[1], h[2] - 12], 18, '#ff5010', 'armR'], ['glow', [h[0] + 30, h[1], h[2] + 2], 9, '#ff9030', 'armR']]; }
        },
        head: {
          default: () => [['ell', [3, 0, 127], [12.4, 12.4, 2.4], '#6a1010', 'head'], ['cap', [-2, 0, 132], [-8, 0, 146], 5, '#101010', 'head'], ['ball', [-9, 0, 148], 4.4, '#101010', 'head']],
          horned: () => [['ell', [2, 0, 127], [13, 13, 8], '#6a6a72', 'head'], ['ell', [3, 0, 124], [13.4, 13.4, 1.8], '#4a4a52', 'head'], ['box', [14, 0, 121], [2, 2.6, 7], '#4a4a52', 'head'], ...horn([[0, -12, 128], [-2, -24, 134], [4, -32, 146], [12, -32, 154]], 3.8, '#e8dcc0'), ...horn([[0, 12, 128], [-2, 24, 134], [4, 32, 146], [12, 32, 154]], 3.8, '#e8dcc0')],
          warcrown: () => [['cap', [-2, 0, 132], [-8, 0, 144], 4.5, '#101010', 'head'], ...crownOf([3, 0, 128], 12.4, 9, 12, '#c88c30'), ['ball', [15, 0, 128], 2.6, '#40c0ff', 'head']],
          mask: () => [['ell', [10, 0, 121], [5, 12.5, 13], '#2a1818', 'head'], ['ell', [13, 0, 127], [2.5, 11, 4], '#401a1a', 'head'], ...mirror([['cone', [4, 9, 130], 3, 16, '#1a1010', 'head', 4, 0.4], ['cone', [0, 11, 124], 2.5, 12, '#1a1010', 'head', 4]]), ['ball', [14.5, -4, 123], 1.8, '#ff4020', 'head'], ['ball', [14.5, 4, 123], 1.8, '#ff4020', 'head'], ['glow', [15, -4, 123], 6, '#ff2010', 'head'], ['glow', [15, 4, 123], 6, '#ff2010', 'head'], ['cap', [-2, 0, 132], [-8, 0, 146], 5, '#101010', 'head']]
        },
        back: {
          default: () => [['ball', [0, -25, 104], 9.5, '#5a5a5a', 'armL'], ['ball', [0, 25, 104], 9.5, '#5a5a5a', 'armR'], ['ball', [3, -25, 108], 3, '#8a8a8a', 'armL'], ['ball', [3, 25, 108], 3, '#8a8a8a', 'armR']],
          spiked: () => mirror([['ball', [0, 25, 104], 10, '#4a4a4e', 'armR'], ['cone', [-2, 25, 110], 2.6, 14, '#d8d0c0', 'armR', 4], ['cone', [4, 29, 106], 2.2, 11, '#d8d0c0', 'armR', 4], ['cone', [-6, 29, 104], 2.2, 11, '#d8d0c0', 'armR', 4]]),
          fur: () => [['ell', [-4, 0, 104], [12, 30, 9], '#6a4a30', 'body'], ['ell', [-2, -22, 105], [10, 10, 8], '#7a5a3a', 'armL'], ['ell', [-2, 22, 105], [10, 10, 8], '#7a5a3a', 'armR'], ['ell', [-10, 0, 96], [6, 22, 10], '#5a3a24', 'body'], ['ball', [8, -20, 100], 3, '#e8e0c8', 'armL'], ['ball', [8, 20, 100], 3, '#e8e0c8', 'armR']],
          banners: () => [['ball', [0, -25, 104], 9.5, '#5a5a5a', 'armL'], ['ball', [0, 25, 104], 9.5, '#5a5a5a', 'armR'], ...mirror([['cap', [-16, 12, 60], [-20, 16, 176], 1.8, '#3a2418', 'body'], ['poly', [[-20, 16, 172], [-20, 30, 168], [-20, 28, 146], [-20, 16, 150]], '#b01818', 'body'], ['poly', [[-20.3, 18, 164], [-20.3, 26, 162], [-20.3, 26, 156], [-20.3, 18, 158]], '#1a1010', 'body']])]
        }
      }
    },
    lina: {
      meta: { scale: 1, atk: 'cast', h: 135, bust: [102, 56], outline: true },
      base() {
        const H = humanoid({ w: 0.9, body: '#c83020', waist: '#a82818', legs: '#8a2018', arms: '#f0c0a0', forearms: '#f0c8a8', skin: '#f0c8a8', boots: '#5a1a10', belt: '#f0a020', headS: 0.92 });
        H.P.push(['ell', [11, -3.4, 106], [1, 1.8, 1.4], '#3a1a10', 'head'], ['ell', [11, 3.4, 106], [1, 1.8, 1.4], '#3a1a10', 'head'], ['ell', [8, 0, 88], [5, 12, 4], '#e0a020', 'body']);
        return H;
      },
      slots: {
        weapon: {
          default: () => [['ball', [7, 20.7, 50], 6, '#ffb030', 'armR'], ['ball', [7, -20.7, 50], 6, '#ffb030', 'armL'], ['ball', [7, 20.7, 51], 3, '#fff0a0', 'armR'], ['ball', [7, -20.7, 51], 3, '#fff0a0', 'armL']],
          fans: () => mirror([['ball', [7, 20.7, 52], 4.5, '#f0c8a8', 'armR'], ['poly', [[8, 21, 50], [10, 16, 70], [14, 26, 72], [16, 34, 64], [12, 28, 50]], '#ff5020', 'armR'], ['poly', [[8.5, 21, 51], [11, 19, 66], [13.5, 26, 67], [14, 30, 61], [11, 26, 51]], '#ffc040', 'armR']]),
          sun: () => [['ball', [7, 20.7, 50], 5, '#ffb030', 'armR'], ['ball', [7, -20.7, 50], 5, '#ffb030', 'armL'], ['ball', [-6, 30, 64], 9, '#ffd040', 'armR'], ...ring([-6, 30, 64], 13, 12, 2.2, '#ff7020', 'armR', 1.2), ['glow', [-6, 30, 64], 20, '#ffa020', 'armR']],
          dragon: () => [['ball', [7, -20.7, 50], 6, '#ffb030', 'armL'], ...Array.from({ length: 9 }, (_, i) => { const t = i / 8, a = t * Math.PI * 3.2; return ['ball', [4 + Math.cos(a) * 9, 22 + Math.sin(a) * 9, 46 + t * 44], 4.6 - t * 2.4, i % 2 ? '#ff5010' : '#ffb030', 'armR']; }), ['ell', [10, 30, 92], [6, 4, 4], '#ff6020', 'armR'], ['ball', [14, 31, 94], 1.4, '#ffffff', 'armR'], ['glow', [8, 26, 70], 22, '#ff6010', 'armR']]
        },
        head: {
          default: () => [['ell', [-4, 0, 111], [10, 12, 9], '#ff5020', 'head'], ['cone', [-8, 0, 115], 7, 24, '#ff8030', 'head', 5, 1.5], ...mirror([['cap', [-6, 8, 113], [-14, 13, 128], 3, '#ff7020', 'head']])],
          braid: () => [['ell', [-4, 0, 111], [10, 12, 9], '#ff5020', 'head'], ['cone', [-8, 0, 115], 6, 16, '#ff8030', 'head', 5, 1.5], ...Array.from({ length: 6 }, (_, i) => ['ball', [-11 - i * 1.2, 0, 104 - i * 8], 4 - i * 0.3, i % 2 ? '#ff6020' : '#e04010', 'body']), ['ball', [-18, 0, 56], 2.6, '#f0c040', 'body']],
          crown: () => [['ell', [-4, 0, 111], [10, 12, 9], '#ff5020', 'head'], ['cone', [-8, 0, 115], 7, 24, '#ff8030', 'head', 5, 1.5], ['ell', [3, 0, 112], [10.2, 11, 2], '#e0b040', 'head'], ['cone', [12, 0, 112], 2, 8, '#f0c050', 'head', 4], ['ball', [12.5, 0, 114], 2, '#ff1020', 'head']],
          phoenix: () => [['ell', [-4, 0, 111], [10, 12, 9], '#ff5020', 'head'], ...[-12, -6, 0, 6, 12].map((y, i) => ['poly', [[-4, y * 0.5, 116], [-12 - Math.abs(y) * 0.3, y * 1.4, 138 - Math.abs(y) * 0.7], [-18, y * 1.1, 130 - Math.abs(y) * 0.6], [-9, y * 0.5, 114]], i % 2 ? '#ffd040' : '#ff6020', 'head']), ['glow', [-12, 0, 130], 16, '#ff8020', 'head']]
        },
        back: {
          default: () => [['cone', [0, 0, 20], 16, 30, '#b82818', 'body', 8, 11], ['cone', [0, 0, 20], 16.5, 3, '#f0a020', 'body', 8, 16]],
          sash: () => [['cone', [0, 0, 20], 16, 30, '#b82818', 'body', 8, 11], ['poly', [[-8, 8, 50], [-10, 13, 50], [-16, 16, 20], [-12, 10, 18]], '#f0b030', 'body'], ['ell', [0, 0, 50], [11.5, 15, 3], '#f0b030', 'body'], ['ball', [9, 8, 50], 3, '#ff4020', 'body']],
          cloak: () => [['cone', [0, 0, 20], 16, 30, '#b82818', 'body', 8, 11], ...cape({ x: -9, wTop: 13, zTop: 88, wBot: 22, zBot: 12, col: '#3a2220', col2: '#2a1816', trim: '#ff6020', flare: 12 })],
          wings: () => [['cone', [0, 0, 20], 16, 30, '#b82818', 'body', 8, 11], ...mirror(wing([-9, 6, 82], 36, 30, '#ff5010', '#ffb030')), ['glow', [-18, 0, 86], 20, '#ff6010', 'body']]
        }
      }
    },
    juggernaut: {
      meta: { scale: 1, atk: 'swing', h: 135, bust: [102, 56], spin: true, outline: true },
      base() {
        const H = humanoid({ body: '#e8c090', waist: '#d8b080', legs: '#e08a30', shins: '#c87820', arms: '#e8c090', forearms: '#a03020', skin: '#e8c090', boots: '#6a4a2a', belt: '#8a2a1a' });
        H.P.push(['ell', [0, 0, 56], [13, 17, 12], '#e08a30', 'body'], ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2; return ['cap', [Math.cos(a) * 12, Math.sin(a) * 15, 50], [Math.cos(a) * 15, Math.sin(a) * 18, 30], 2.2, i % 2 ? '#c8a050' : '#b08a40', 'body']; }));
        return H;
      },
      slots: {
        weapon: {
          default: (H) => blade(H.pose.hand, { len: 50, w: 3.4, t: 1.2, col: '#dce4ee', edge: '#ffffff', guard: '#303030', guardW: 3, grip: '#2a2a2a', pitch: 0.15 }),
          jade: (H) => blade(H.pose.hand, { len: 50, w: 3.8, t: 1.3, col: '#50c088', edge: '#c0ffe0', guard: '#c8a040', guardW: 3, grip: '#1a3a2a', pitch: 0.15, gem: '#40ff90' }),
          dragon: (H) => [...blade(H.pose.hand, { len: 54, w: 4.4, t: 1.4, col: '#e0c060', edge: '#fff4c0', guard: '#a02018', guardW: 6, grip: '#5a1a10', pitch: 0.1, gem: '#ff3020' }), ['cap', along(H.pose.hand, -8, 0.1), along(H.pose.hand, -8, 0.1, -14), 1.2, '#e02018', 'armR'], ['ball', along(H.pose.hand, -8, 0.1, -15), 2.2, '#e02018', 'armR']],
          sunfire: (H) => blade(H.pose.hand, { len: 56, w: 4.2, t: 1.4, col: '#ffd070', edge: '#fffbe0', guard: '#c05010', guardW: 5, grip: '#3a1a10', pitch: 0.12, gem: '#ff8020', glow: '#ff9020', glowR: 20 })
        },
        head: {
          default: () => [['ell', [4, 0, 106], [9, 13, 16], '#e0e0d0', 'head'], ['ell', [12.5, 0, 108], [2, 10, 2], '#101010', 'head'], ['cone', [0, 0, 118], 5, 26, '#c03020', 'head', 4], ['ell', [12, 0, 98], [1.4, 6, 1.2], '#a02818', 'head']],
          oni: () => [['ell', [4, 0, 106], [9, 13, 16], '#c02818', 'head'], ['ell', [12.5, -4, 109], [2, 3, 2], '#ffe040', 'head'], ['ell', [12.5, 4, 109], [2, 3, 2], '#ffe040', 'head'], ['box', [12, 0, 99], [2, 10, 3], '#fffaf0', 'head'], ...mirror([['cone', [4, 8, 116], 2.6, 14, '#f0e8d0', 'head', 4, 0.3]]), ['cone', [-2, 0, 118], 4, 18, '#101010', 'head', 4]],
          gold: () => [['ell', [4, 0, 106], [9, 13, 16], '#e0b840', 'head'], ['ell', [12.5, 0, 108], [2, 10, 2], '#101010', 'head'], ['cone', [0, 0, 118], 5, 30, '#c03020', 'head', 4], ['ball', [12.8, 0, 114], 1.8, '#40c0ff', 'head'], ['ell', [11, 0, 96], [3, 9, 3], '#c89830', 'head']],
          bamboo: () => [['ell', [4, 0, 106], [9, 13, 16], '#e0e0d0', 'head'], ['ell', [12.5, 0, 108], [2, 10, 2], '#101010', 'head'], ['cone', [2, 0, 117], 26, 11, '#d8c080', 'head', 12], ['cyl', [2, 0, 117], 26.5, 1.5, '#b09850', 'head', 12], ['cyl', [2, 0, 119], 9, 1.2, '#a02818', 'head', 10]]
        },
        back: {
          default: () => [['cap', [12, -14, 94], [14, 14, 60], 2, '#c03020', 'body'], ['cap', [-10, -14, 94], [-12, 14, 60], 2, '#c03020', 'body']],
          banner: () => [['cap', [12, -14, 94], [14, 14, 60], 2, '#c03020', 'body'], ['cap', [-12, -6, 60], [-14, -6, 150], 1.5, '#6a4a2a', 'body'], ['poly', [[-14, -6, 148], [-14, -20, 146], [-14, -18, 120], [-14, -6, 122]], '#e0c060', 'body'], ['poly', [[-14.3, -9, 142], [-14.3, -16, 141], [-14.3, -16, 130], [-14.3, -9, 131]], '#c03020', 'body']],
          scabbards: () => [['cap', [12, -14, 94], [14, 14, 60], 2, '#c03020', 'body'], ['cap', [-14, -18, 108], [-14, 16, 50], 3, '#3a2a1a', 'body'], ['cap', [-15, 16, 108], [-15, -14, 54], 2.6, '#5a1a10', 'body'], ['ball', [-14, -18, 108], 2.6, '#c8a040', 'body'], ['ball', [-15, 16, 108], 2.4, '#c8a040', 'body']],
          shoulder: () => [['cap', [12, -14, 94], [14, 14, 60], 2, '#c03020', 'body'], ['ell', [0, -20, 92], [10, 10, 7], '#c89830', 'armL'], ['ell', [0, -20, 95], [7, 7, 5], '#a02818', 'armL'], ...[-4, 0, 4].map(d => ['cap', [4 + d, -26, 86], [5 + d, -28, 66], 1.2, '#e03020', 'armL'])]
        }
      }
    },
    pudge: {
      meta: { scale: 1.12, atk: 'swing', h: 140, bust: [98, 64], outline: true },
      base() {
        const H = humanoid({ h: 1.05, w: 1.5, body: '#b8c8a0', waist: '#aabb92', legs: '#6a5a4a', arms: '#b8c8a0', forearms: '#a8b890', skin: '#b8c8a0', boots: '#3a2a1a', belt: '#6a3a1a', head: false });
        H.P.push(['ell', [4, 0, 70], [22, 26, 30], '#b8c8a0', 'body'], ['ell', [11, 0, 62], [11, 20, 17], '#a8b890', 'body']);
        H.P.push(['cap', [22, -8, 80], [24, 8, 66], 0.9, '#6a2a2a', 'body'], ...[-4, 0, 4].map(d => ['cap', [23, d * 1.2 - 3, 74 - d * 1.6], [23.5, d * 1.2 + 3, 74 - d * 1.6], 0.7, '#6a2a2a', 'body']));
        H.P.push(...weaponGroup([['cap', [8, 34, 58], [12, 34, 48], 2.5, '#4a3018'], ['box', [16, 34, 36], [18, 3, 22], '#9aa0a8', null, 0], ['box', [24, 34, 36], [2, 3.4, 22], '#d8dce0', null, 0], ['ball', [12, 34, 44], 1.4, '#e0e0e0']]));
        return H;
      },
      slots: {
        weapon: {
          default: () => [['cap', [8, -34, 58], [16, -38, 44], 1.2, '#606068', 'armL'], ['cap', [16, -38, 44], [22, -38, 36], 1.2, '#606068', 'armL'], ['cap', [22, -38, 36], [26, -36, 26], 2.2, '#808088', 'armL'], ['cap', [26, -36, 26], [20, -33, 20], 2, '#808088', 'armL'], ['cone', [19, -33, 20], 1.8, 5, '#c0c0c8', 'armL', 4]],
          anchor: () => [['cap', [8, -34, 58], [20, -38, 38], 1.3, '#505058', 'armL'], ['cap', [20, -38, 38], [22, -38, 22], 2.4, '#6a6a72', 'armL'], ['cap', [16, -38, 34], [28, -38, 34], 1.8, '#6a6a72', 'armL'], ['cap', [22, -38, 22], [12, -38, 26], 2.2, '#6a6a72', 'armL'], ['cap', [22, -38, 22], [32, -38, 26], 2.2, '#6a6a72', 'armL'], ['ball', [22, -38, 40], 2.4, '#7a7a82', 'armL']],
          bone: () => [['cap', [8, -34, 58], [18, -38, 40], 1.4, '#8a7a60', 'armL'], ['cap', [18, -38, 40], [24, -37, 24], 3, '#e8e0c8', 'armL'], ['cap', [24, -37, 24], [16, -33, 16], 2.6, '#e8e0c8', 'armL'], ['cone', [15, -33, 16], 2.2, 7, '#fffaf0', 'armL', 4], ['ball', [18, -38, 40], 3.2, '#d8d0b8', 'armL']],
          dragon: () => [['cap', [8, -34, 58], [18, -38, 40], 1.4, '#c89830', 'armL'], ['cap', [18, -38, 40], [26, -37, 24], 3, '#e8c050', 'armL'], ['cap', [26, -37, 24], [18, -32, 15], 2.6, '#e8c050', 'armL'], ['ell', [17, -32, 15], [4, 3, 3], '#d0a030', 'armL'], ['ball', [16, -34, 16], 1, '#ff2020', 'armL'], ['ball', [18, -38, 40], 3.4, '#e8c050', 'armL'], ['glow', [22, -35, 24], 14, '#ffc040', 'armL']]
        },
        head: {
          default: () => [['ball', [9, 0, 106], 10.5, '#b8c8a0', 'head'], ['ell', [17, 0, 101], [3, 7, 3], '#6a2020', 'head'], ['ell', [16, -4, 109], [1.2, 1.6, 1.6], '#1a1a10', 'head'], ['ell', [16, 4, 109], [1.2, 1.6, 1.6], '#1a1a10', 'head']],
          cap: () => [['ball', [9, 0, 106], 10.5, '#b8c8a0', 'head'], ['ell', [17, 0, 101], [3, 7, 3], '#6a2020', 'head'], ['ell', [7, 0, 115], [10.5, 11.5, 6], '#e8e0d0', 'head'], ['ell', [9, 0, 112], [11, 12, 2], '#c8c0b0', 'head'], ['ell', [16, -4, 108], [1.2, 1.6, 1.6], '#1a1a10', 'head'], ['ell', [16, 4, 108], [1.2, 1.6, 1.6], '#1a1a10', 'head']],
          helm: () => [['ball', [9, 0, 106], 10.5, '#b8c8a0', 'head'], ['ell', [17, 0, 101], [3, 7, 3], '#6a2020', 'head'], ['ell', [8, 0, 113], [11.5, 11.5, 8], '#707078', 'head'], ['ell', [9, 0, 109], [12, 12, 1.6], '#5a5a62', 'head'], ...[-6, 0, 6].map(y => ['ball', [18, y, 110], 1.2, '#b0b0b8', 'head']), ['cone', [8, 0, 120], 2, 6, '#808088', 'head', 4]],
          horned: () => [['ball', [9, 0, 107], 11, '#2a2020', 'head'], ['ell', [18, 0, 100], [3, 7, 3], '#6a2020', 'head'], ['ball', [18, -4, 109], 1.5, '#ff4020', 'head'], ['ball', [18, 4, 109], 1.5, '#ff4020', 'head'], ['glow', [19, -4, 109], 5, '#ff3010', 'head'], ['glow', [19, 4, 109], 5, '#ff3010', 'head'], ...horn([[6, -8, 114], [6, -16, 122], [12, -18, 132]], 3, '#d8d0b8'), ...horn([[6, 8, 114], [6, 16, 122], [12, 18, 132]], 3, '#d8d0b8')]
        },
        back: {
          default: () => [['cap', [18, -22, 90], [22, 20, 58], 1.6, '#5a3018', 'body'], ['cap', [-16, -22, 90], [-20, 20, 58], 1.6, '#5a3018', 'body']],
          fish: () => [['cap', [18, -22, 90], [22, 20, 58], 1.6, '#5a3018', 'body'], ['cap', [-18, 14, 70], [-24, 14, 60], 0.6, '#a09070', 'body'], ['ell', [-25, 14, 48], [3, 4.5, 12], '#8aa8b8', 'body'], ['cone', [-25, 14, 37], 4, -6, '#6a8a9a', 'body', 4], ['ball', [-25.5, 15, 57], 1, '#101010', 'body']],
          spikes: () => [['cap', [18, -22, 90], [22, 20, 58], 1.6, '#5a3018', 'body'], ...[[-14, 0, 92], [-18, -10, 82], [-18, 10, 82], [-20, 0, 72], [-4, -22, 98], [-4, 22, 98]].map(p => ['cone', p, 3.2, 14, '#d8d0c0', 'body', 4])],
          rack: () => [['cap', [18, -22, 90], [22, 20, 58], 1.6, '#5a3018', 'body'], ['cap', [-22, -18, 50], [-22, -18, 128], 2, '#6a4a2a', 'body'], ['cap', [-22, 18, 50], [-22, 18, 128], 2, '#6a4a2a', 'body'], ['cap', [-22, -20, 124], [-22, 20, 124], 2, '#6a4a2a', 'body'], ...[-10, 2, 13].map((y, i) => ['cap', [-22, y, 124], [-22, y, 116], 0.6, '#909090', 'body']), ...[-10, 2, 13].map((y, i) => ['ell', [-22, y, 108 - i * 2], [4, 5, 8], i % 2 ? '#c04040' : '#a83030', 'body'])]
        }
      }
    },
    lion: {
      meta: { scale: 1, atk: 'cast', h: 130, bust: [102, 56], outline: true },
      base() {
        const H = humanoid({ body: '#3a2a3a', waist: '#2e2030', legs: '#2a1a2a', arms: '#3a2a3a', forearms: '#8a5a4a', skin: '#8a5a4a', boots: '#1a1010', belt: '#8a2a2a', pads: '#5a2a3a' });
        H.P.push(['cone', [0, 0, 6], 20, 50, '#2a1a2a', 'body', 7, 13], ['ell', [11, -3.5, 108], [1.4, 2, 1.4], '#ff3020', 'head'], ['ell', [11, 3.5, 108], [1.4, 2, 1.4], '#ff3020', 'head'], ['ell', [9, 0, 99], [3, 5, 4], '#2a1a1a', 'head']);
        H.P.push(['ball', [7, 23, 50], 7, '#ff3020', 'armR'], ['ball', [7, 23, 50], 4, '#ffa080', 'armR']);
        return H;
      },
      slots: {
        weapon: {
          default: () => [['cap', [7, -23, 92], [7, -23, 18], 2, '#5a3a2a', 'armL'], ['cone', [7, -23, 92], 4, 12, '#a02020', 'armL', 5], ['ball', [7, -23, 98], 2.2, '#ff6040', 'armL']],
          bone: () => [['cap', [7, -23, 92], [7, -23, 18], 2.3, '#d8d0b8', 'armL'], ['ball', [7, -23, 98], 6, '#e8e0c8', 'armL'], ['ell', [12, -21, 98], [1.4, 1.6, 1.8], '#1a1010', 'armL'], ['ell', [12, -25, 98], [1.4, 1.6, 1.8], '#1a1010', 'armL'], ['ell', [11, -23, 93], [2, 4, 2], '#c8c0a8', 'armL']],
          twisted: () => [...Array.from({ length: 7 }, (_, i) => ['cap', [7 + (i % 2 ? 2.5 : -2.5), -23, 18 + i * 11], [7 + (i % 2 ? -2.5 : 2.5), -23, 29 + i * 11], 1.9, '#4a2a3a', 'armL']), ['ball', [7, -23, 100], 4.4, '#c040ff', 'armL'], ['cap', [7, -21, 96], [7, -17, 106], 1.2, '#4a2a3a', 'armL'], ['cap', [7, -25, 96], [7, -29, 106], 1.2, '#4a2a3a', 'armL'], ['glow', [7, -23, 100], 10, '#a030ff', 'armL']],
          demonhand: () => [['cap', [7, -23, 92], [7, -23, 18], 2, '#5a3a2a', 'armL'], ['cone', [7, -23, 92], 4, 12, '#a02020', 'armL', 5], ['ball', [8, 24, 50], 9, '#c02818', 'armR'], ...[-5, -1.6, 1.6, 5].map((d, i) => ['cap', [12, 24 + d, 48], [22, 25 + d * 1.5, 38 - (i % 2) * 3], 1.8, '#a01810', 'armR']), ...[-5, -1.6, 1.6, 5].map((d, i) => ['cone', [22, 25 + d * 1.5, 34 - (i % 2) * 3], 1.4, 5, '#ffe0c0', 'armR', 4]), ['glow', [12, 24, 46], 18, '#ff2010', 'armR']]
        },
        head: {
          default: () => [...horn([[0, -8, 112], [-2, -12, 122], [-7, -10, 132]], 3, '#d0c0a0'), ...horn([[0, 8, 112], [-2, 12, 122], [-7, 10, 132]], 3, '#d0c0a0')],
          curled: () => mirror(horn([[0, 8, 112], [-4, 15, 120], [-10, 16, 112], [-8, 14, 104], [-2, 15, 104]], 4, '#c8b890')),
          crown: () => [...crownOf([2, 0, 114], 10.5, 8, 13, '#e8e0c8'), ['ball', [12.5, 0, 115], 2, '#ff3020', 'head']],
          skull: () => [['ell', [7, 0, 106], [7, 11.5, 12], '#e8e0c8', 'head'], ['ell', [12.5, -4, 108], [1.6, 2.4, 2.4], '#1a1010', 'head'], ['ell', [12.5, 4, 108], [1.6, 2.4, 2.4], '#1a1010', 'head'], ['glow', [13, -4, 108], 5, '#ff3020', 'head'], ['glow', [13, 4, 108], 5, '#ff3020', 'head'], ...[-3, -1, 1, 3].map(y => ['box', [13, y, 99], [1, 1.4, 3], '#fffaf0', 'head']), ...horn([[0, -8, 114], [-4, -16, 124], [-2, -24, 134]], 3, '#2a2020'), ...horn([[0, 8, 114], [-4, 16, 124], [-2, 24, 134]], 3, '#2a2020')]
        },
        back: {
          default: () => cape({ x: -10, wTop: 14, zTop: 92, wBot: 20, zBot: 14, col: '#3a1a2a', col2: '#2e1422', trim: '#8a2a2a' }),
          tattered: () => cape({ x: -10, wTop: 14, zTop: 92, wBot: 22, zBot: 24, col: '#2e2a26', col2: '#24201c', jag: 12 }),
          spikes: () => [...cape({ x: -10, wTop: 14, zTop: 92, wBot: 20, zBot: 14, col: '#3a1a2a', col2: '#2e1422' }), ...[98, 86, 74, 62].map((z, i) => ['cone', [-15 - i * 0.8, 0, z], 3 - i * 0.3, 14 - i * 1.5, '#d8d0b8', 'body', 4])],
          wings: () => [...mirror(wing([-9, 6, 88], 40, 36, '#4a1a1a', '#3a1010')), ...mirror([['cap', [-9, 6, 88], [-19, 26, 124], 1.6, '#2a0a0a', 'body'], ['cap', [-19, 26, 124], [-25, 46, 116], 1.2, '#2a0a0a', 'body']])]
        }
      }
    }
  };
  function lookKey(look) { return ['weapon', 'head', 'back'].map(s => (look && look[s]) || 'default').join('.'); }
  function heroModel(hid, look) {
    buildModels();
    const key = lookKey(look), id = key === 'default.default.default' ? hid : hid + '#' + key;
    if (MODELS[id]) return id;
    const art = HERO_ART[hid], H = art.base(), P = H.P.slice();
    for (const slot of ['weapon', 'head', 'back']) { const set = art.slots[slot], fn = set[(look && look[slot]) || 'default'] || set.default; P.push(...fn(H)); }
    def(id, Object.assign({ parts: P, hid, hip: H.pose ? H.pose.hip : undefined, sh: H.pose ? H.pose.sh : undefined }, art.meta));
    return id;
  }
  const hasStyle = (hid, slot, style) => !!(HERO_ART[hid] && HERO_ART[hid].slots[slot] && HERO_ART[hid].slots[slot][style]);
  function heroModels() { for (const hid of Object.keys(HERO_ART)) heroModel(hid, null); }
  function creepModels() {
    for (const t of [0, 1]) {
      const R = t === 0;
      {
        const H = humanoid({ h: 0.8, body: R ? '#5a8a3a' : '#6a2a2a', legs: R ? '#4a5a3a' : '#3a2020', arms: R ? '#6a9a4a' : '#8a7a6a', skin: R ? '#c8a878' : '#b0a898', boots: '#2a2018', pads: R ? '#d0d8c0' : '#3a3a3a' });
        const P = H.P; P.push(['ball', [2, 0, 88], 9, R ? '#d0d8c0' : '#4a4040', 'head']);
        if (!R) P.push(['cone', [0, 0, 94], 4, 10, '#e0d8c8', 'head', 4]);
        P.push(...sword(H.pose.hand, 30, R ? '#d8d8c8' : '#8a8a8a', '#4a3018', 3));
        P.push(...weaponGroup([['box', [8, -24, 56], [3, 20, 26], R ? '#e0e0c0' : '#5a2a2a', null, 0]], 'armL'));
        def('creep_melee_' + t, hm(H, { scale: 1, atk: 'swing', h: 100 }));
      }
      {
        const H = humanoid({ h: 0.8, body: R ? '#3a6ac0' : '#4a2a5a', legs: R ? '#2a4a8a' : '#2a1a3a', arms: R ? '#3a6ac0' : '#4a2a5a', skin: R ? '#e0c0a0' : '#8a9a8a', boots: '#201818' });
        const P = H.P; P.push(['cone', [0, 0, 6], 14, 34, R ? '#2a5aa0' : '#3a1a4a', 'body', 7, 9], ['cone', [0, 0, 92], 9, 16, R ? '#3a6ac0' : '#4a2a5a', 'head', 6]);
        P.push(...weaponGroup([['cap', [7, 18, 76], [7, 18, 14], 1.8, '#6a4a2a'], ['ball', [7, 18, 80], 5, R ? '#80ff80' : '#ff4040']]));
        def('creep_ranged_' + t, hm(H, { scale: 1, atk: 'cast', h: 100 }));
      }
      {
        const P = [];
        P.push(['box', [0, 0, 18], [60, 34, 12], R ? '#8a6a3a' : '#4a3028'], ['box', [-6, 0, 28], [40, 8, 10], R ? '#6a5028' : '#3a2018']);
        for (const [a, b] of [[20, -19], [20, 19], [-20, -19], [-20, 19]]) P.push(['cyl', [a, b - 3, 11], 10, 6, R ? '#4a3018' : '#2a1a10', null, 8]);
        P.push(['cap', [-6, 0, 32], [30, 0, 70], 3, R ? '#7a5a30' : '#3a2a20', 'armR'], ['ball', [32, 0, 74], 8, R ? '#8a8a7a' : '#aa4a2a', 'armR']);
        def('creep_siege_' + t, { parts: P, scale: 1, atk: 'catapult', h: 80 });
      }
    }
    def('creep_melee_super_0', MODELS.creep_melee_0); def('creep_melee_super_1', MODELS.creep_melee_1);
    def('creep_ranged_super_0', MODELS.creep_ranged_0); def('creep_ranged_super_1', MODELS.creep_ranged_1);
    def('creep_melee_mega_0', MODELS.creep_melee_0); def('creep_melee_mega_1', MODELS.creep_melee_1);
    def('creep_ranged_mega_0', MODELS.creep_ranged_0); def('creep_ranged_mega_1', MODELS.creep_ranged_1);
  }
  function neutralModels() {
    { const H = humanoid({ h: 0.6, body: '#8a6a4a', legs: '#6a5a3a', arms: '#a08060', skin: '#a08060' }); H.P.push(['ell', [6, 0, 70], [9, 7, 7], '#a08060', 'head'], ['cone', [0, -6, 74], 2.5, 7, '#a08060', 'head', 4], ['cone', [0, 6, 74], 2.5, 7, '#a08060', 'head', 4]); H.P.push(...sword(H.pose.hand, 16, '#8a8a80')); def('kobold', hm(H, { atk: 'swing', h: 70 })); }
    { const H = humanoid({ h: 0.7, body: '#aa7a3a', legs: '#6a5a3a', arms: '#a08060', skin: '#b09070', pads: '#8a6a4a' }); H.P.push(['ell', [6, 0, 80], [10, 8, 8], '#b09070', 'head'], ['cone', [0, 0, 88], 5, 8, '#c8a030', 'head', 4]); H.P.push(...sword(H.pose.hand, 22, '#a0a098')); def('kobold_foreman', hm(H, { atk: 'swing', h: 80 })); }
    { const H = humanoid({ h: 0.95, body: '#6a8a9a', legs: '#4a5a6a', arms: '#7a9aaa', skin: '#7a9aaa' }); H.P.push(['ell', [8, 0, 104], [11, 8, 9], '#7a9aaa', 'head'], ['ell', [16, 0, 100], [5, 3, 5], '#8aaaba', 'head'], ['cone', [-2, 0, 110], 6, 12, '#c04020', 'head', 4]); H.P.push(...weaponGroup([['cap', [7, 23, 60], [30, 23, 70], 2, '#6a4a2a'], ['cone', [30, 23, 70], 3, 8, '#c0c0c0']])); def('troll', hm(H, { atk: 'throw', h: 115 })); }
    { const Q = quad({ h: 1, body: '#8a8a8a', legs: '#6a6a6a', head: '#9a9a9a', snout: '#aaaaaa', ears: '#6a6a6a', tail: '#7a7a7a' }); def('wolf', { parts: Q.P, atk: 'bite', h: 60, quad: true }); }
    { const Q = quad({ h: 1.2, body: '#5a5a6a', legs: '#4a4a5a', head: '#6a6a7a', snout: '#7a7a8a', ears: '#3a3a4a', tail: '#4a4a5a' }); def('alpha_wolf', { parts: Q.P, atk: 'bite', h: 70, quad: true }); }
    { const H = humanoid({ h: 0.85, body: '#7a4a2a', legs: '#5a3a1a', arms: '#b08060', skin: '#b08060' }); H.P.push(['ball', [2, 0, 98], 9, '#b08060', 'head'], ['cone', [0, -6, 104], 2.5, 12, '#e0d0b0', 'head', 4, -0.5], ['cone', [0, 6, 104], 2.5, 12, '#e0d0b0', 'head', 4, 0.5]); def('satyr', hm(H, { atk: 'cast', h: 105 })); }
    { const H = humanoid({ h: 1.15, w: 1.3, body: '#5a2a1a', legs: '#3a1a10', arms: '#c07050', skin: '#c07050' }); H.P.push(['ball', [2, 0, 126], 12, '#c07050', 'head'], ['cone', [0, -8, 132], 3.5, 18, '#e0d0b0', 'head', 4, -0.6], ['cone', [0, 8, 132], 3.5, 18, '#e0d0b0', 'head', 4, 0.6]); def('satyr_big', hm(H, { atk: 'cast', h: 140 })); }
    for (const [id, sc, col] of [['centaur', 0.9, '#8a5a3a'], ['centaur_big', 1.2, '#6a3a2a']]) {
      const Q = quad({ h: sc, body: col, legs: '#4a3020', tail: '#2a1a10' }); const P = Q.P.filter(p => p[4] !== 'head' && p[5] !== 'head');
      P.push(['ell', [24 * sc, 0, 64 * sc], [9 * sc, 12 * sc, 18 * sc], '#b08060', 'body'], ['ball', [26 * sc, 0, 88 * sc], 8 * sc, '#b08060', 'head'], ['cap', [26 * sc, 12 * sc, 76 * sc], [44 * sc, 16 * sc, 66 * sc], 4 * sc, '#b08060', 'armR'], ['cap', [26 * sc, -12 * sc, 76 * sc], [44 * sc, -16 * sc, 66 * sc], 4 * sc, '#b08060', 'armL']);
      P.push(...weaponGroup([['cap', [44 * sc, 16 * sc, 70 * sc], [44 * sc, 16 * sc, 30 * sc], 2 * sc, '#5a3a18'], ['box', [44 * sc, 16 * sc, 72 * sc], [14 * sc, 3, 10 * sc], '#9a9a9a', null, 0]]));
      def(id, { parts: P, atk: 'swing', h: 100 * sc, quad: true });
    }
    { const Q = quad({ h: 1.35, len: 0.8, body: '#5a3a2a', legs: '#3a2a1a', head: '#6a4a3a', snout: '#8a6a5a', ears: '#3a2a1a' }); Q.P.push(['ell', [4, 0, 58], [18, 16, 14], '#6a4a3a', 'body']); def('hellbear', { parts: Q.P, atk: 'bite', h: 90, quad: true }); }
    { const H = humanoid({ h: 1.25, w: 1.6, body: '#7a7a78', legs: '#6a6a68', arms: '#8a8a88', skin: '#8a8a88', boots: '#5a5a58', pads: '#9a9a98' }); H.P.push(['box', [0, 0, 130], [16, 18, 16], '#8a8a88', 'head'], ['ell', [9, 0, 132], [2, 8, 2], '#60ff90', 'head']); def('golem', hm(H, { atk: 'swing', h: 160 })); }
    for (const [id, sc, col] of [['drake', 1, '#2a2a3a'], ['dragon', 1.5, '#1a1a2a']]) {
      const Q = quad({ h: sc, body: col, legs: '#101018', head: '#3a3a4a', snout: '#4a4a5a', tail: col });
      Q.P.push(['cap', [0, -10 * sc, 50 * sc], [-6, -46 * sc, 70 * sc], 2 * sc, '#4a2a2a', 'armL'], ['cap', [0, 10 * sc, 50 * sc], [-6, 46 * sc, 70 * sc], 2 * sc, '#4a2a2a', 'armR']);
      Q.P.push(['box', [-4, -30 * sc, 60 * sc], [22 * sc, 34 * sc, 2], '#5a2a2a', 'armL', 0], ['box', [-4, 30 * sc, 60 * sc], [22 * sc, 34 * sc, 2], '#5a2a2a', 'armR', 0]);
      def(id, { parts: Q.P, atk: 'bite', h: 80 * sc, quad: true });
    }
    {
      const H = humanoid({ h: 1.6, w: 1.8, body: '#6a5a4a', legs: '#4a3a2a', arms: '#7a6a5a', skin: '#7a6a5a', boots: '#3a2a1a', pads: '#8a7a6a' });
      H.P.push(['ball', [8, 0, 172], 17, '#7a6a5a', 'head'], ['ell', [22, 0, 164], [7, 11, 7], '#8a7a6a', 'head'], ['cone', [4, -12, 182], 5, 22, '#e8e0c8', 'head', 5, -0.7], ['cone', [4, 12, 182], 5, 22, '#e8e0c8', 'head', 5, 0.7], ['ell', [20, 0, 176], [2, 12, 2.5], '#ffd020', 'head']);
      def('roshan', hm(H, { atk: 'swing', h: 200 }));
    }
    {
      for (const fly of [0, 1]) {
        const Q = quad({ h: 0.6, body: '#8a8a90', legs: '#6a6a70', head: '#9a9aa0', snout: '#c0c0c0', ears: '#6a6a70', tail: '#6a6a70' });
        Q.P.push(['box', [0, 0, 36], [18, 22, 10], '#8a5a2a', 'body']);
        if (fly) Q.P.push(['box', [0, -18, 40], [16, 20, 1.5], '#f0f0ff', 'armL', 0], ['box', [0, 18, 40], [16, 20, 1.5], '#f0f0ff', 'armR', 0]);
        def('courier' + (fly ? '_fly' : ''), { parts: Q.P, atk: 'bite', h: 50, quad: true, hover: fly ? 60 : 0 });
      }
    }
    {
      const P = [['ell', [0, 0, 50], [10, 10, 18], '#7a4ae0', 'body'], ['ball', [2, 0, 72], 9, '#a080ff', 'head'], ['cone', [-2, 0, 30], 9, -26, '#5a2ab0', 'body', 6], ['ball', [9, 0, 73], 2.5, '#ffffff', 'head']];
      def('eidolon', { parts: P, atk: 'cast', h: 80, hover: 12 });
    }
  }
  function staticModels() {
    const pine = (col, trunk, h, w) => [['cyl', [0, 0, 0], 4, 20, trunk, null, 6], ['cone', [0, 0, 16], w, h * 0.5, col, null, 7], ['cone', [0, 0, 16 + h * 0.3], w * 0.8, h * 0.45, col, null, 7, 0.4], ['cone', [0, 0, 16 + h * 0.58], w * 0.55, h * 0.42, col, null, 7, 0.8]];
    const oak = (col, col2, trunk) => [['cyl', [0, 0, 0], 5, 34, trunk, null, 6, 3.5], ['ball', [0, 0, 56], 22, col], ['ball', [8, -12, 46], 15, col2], ['ball', [-8, 12, 50], 16, col2], ['ball', [4, 6, 72], 14, col]];
    const dead = (trunk, leaf) => [['cyl', [0, 0, 0], 5, 50, trunk, null, 5, 2.5], ['cap', [0, 0, 36], [10, -14, 60], 2.5, trunk], ['cap', [0, 0, 44], [-8, 12, 68], 2.2, trunk], ['cap', [0, 0, 50], [4, 4, 78], 2, trunk], ...(leaf ? [['ball', [10, -14, 62], 8, leaf], ['ball', [-8, 12, 70], 9, leaf], ['ball', [4, 4, 80], 7, leaf]] : [])];
    def('tree_0_0', { parts: pine('#2a6a2a', '#5a3a1a', 110, 26), outline: false }); def('tree_0_1', { parts: pine('#3a7a32', '#5a3a1a', 95, 24), outline: false });
    def('tree_0_2', { parts: oak('#3a8a30', '#2a7028', '#5a3a1a'), outline: false }); def('tree_0_3', { parts: oak('#4a8a2a', '#3a7a2a', '#6a4a2a'), outline: false });
    def('tree_1_0', { parts: pine('#3a4a2a', '#2a1a10', 105, 25), outline: false }); def('tree_1_1', { parts: dead('#3a2a20', '#7a2a1a'), outline: false });
    def('tree_1_2', { parts: dead('#2a2020', null), outline: false }); def('tree_1_3', { parts: oak('#5a3a2a', '#6a2a1a', '#2a1a10'), outline: false });
    for (const t of [0, 1]) {
      const R = t === 0;
      for (let tier = 1; tier <= 4; tier++) {
        const k = 0.85 + tier * 0.08, P = [];
        if (R) {
          P.push(['cyl', [0, 0, 0], 40 * k, 20, '#b8b0a0', null, 8, 36 * k], ['cyl', [0, 0, 20], 26 * k, 120 * k, '#d8d0c0', null, 8, 20 * k], ['cyl', [0, 0, 20 + 120 * k], 30 * k, 12, '#a8a090', null, 8]);
          P.push(['cone', [0, 0, 32 + 120 * k], 14 * k, 34 * k, '#40e080', null, 5], ['cone', [0, 0, 32 + 120 * k], 14 * k, -12, '#30b060', null, 5]);
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; P.push(['box', [Math.cos(a) * 30 * k, Math.sin(a) * 30 * k, 60], [8, 8, 70 * k], '#c8c0b0', null, a]); }
        } else {
          P.push(['cyl', [0, 0, 0], 42 * k, 18, '#3a2a28', null, 6, 36 * k], ['cyl', [0, 0, 18], 26 * k, 124 * k, '#4a3030', null, 6, 12 * k]);
          P.push(['ball', [0, 0, 30 + 124 * k], 14 * k, '#ff4020']);
          for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; P.push(['cone', [Math.cos(a) * 26 * k, Math.sin(a) * 26 * k, 40], 7, 90 * k, '#2a1a18', null, 4]); }
        }
        def(`tower_${t}_${tier}`, { parts: P, h: 190 * k });
      }
      for (const type of ['melee', 'ranged']) {
        const P = [];
        if (R) { P.push(['box', [0, 0, 30], [150, 110, 60], type === 'melee' ? '#c8c0b0' : '#b8b8c8'], ['cone', [0, 0, 60], 95, 60, type === 'melee' ? '#3a7a3a' : '#3a5a9a', null, 4, 0.785]); for (const [a, b] of [[-70, -50], [70, -50], [-70, 50], [70, 50]]) P.push(['cyl', [a, b, 0], 10, 80, '#e0d8c8', null, 6]); }
        else { P.push(['box', [0, 0, 28], [150, 110, 56], '#3a2a28'], ['cone', [0, 0, 56], 90, 70, type === 'melee' ? '#6a1a10' : '#4a1a3a', null, 5]); for (const [a, b] of [[-70, -50], [70, -50], [-70, 50], [70, 50]]) P.push(['cone', [a, b, 0], 10, 100, '#2a1a18', null, 4]); }
        def(`rax_${t}_${type}`, { parts: P, h: 130 });
      }
      {
        const P = [];
        if (R) { P.push(['cyl', [0, 0, 0], 150, 30, '#c8c0a8', null, 10, 130], ['cyl', [0, 0, 30], 80, 150, '#e8e0d0', null, 8, 50], ['cone', [0, 0, 180], 60, 120, '#d8c890', null, 8]); P.push(['ball', [0, 0, 330], 34, '#60f0ff']); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; P.push(['cone', [Math.cos(a) * 110, Math.sin(a) * 110, 20], 16, 150, '#f0e8d8', null, 5]); } }
        else { P.push(['cyl', [0, 0, 0], 150, 30, '#2a1a18', null, 7, 130], ['cone', [0, 0, 30], 100, 280, '#3a2020', null, 7]); P.push(['ball', [0, 0, 210], 36, '#ff3010']); for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; P.push(['cone', [Math.cos(a) * 110, Math.sin(a) * 110, 20], 18, 170, '#1a1010', null, 4]); } }
        def(`ancient_${t}`, { parts: P, h: 380 });
      }
      def(`fountain_${t}`, { parts: [['cyl', [0, 0, 0], 120, 16, R ? '#c8c0b0' : '#3a2a28', null, 12], ['cyl', [0, 0, 16], 100, 4, R ? '#40c0ff' : '#ff3020', null, 12], ['cyl', [0, 0, 16], 20, 70, R ? '#e0d8c8' : '#4a3030', null, 8, 12], ['ball', [0, 0, 94], 18, R ? '#80ffc0' : '#ff6040']], h: 120 });
      def(`shop_${t}`, { parts: [['box', [0, 0, 20], [70, 60, 40], R ? '#8a6a3a' : '#4a3a2a'], ['cone', [0, 0, 40], 60, 50, R ? '#c83a2a' : '#5a2a4a', null, 4, 0.785], ['ball', [36, 0, 30], 10, '#e0b080']], h: 100 });
    }
    def('secret_shop', { parts: [['cyl', [0, 0, 0], 60, 10, '#5a5a6a', null, 8], ['box', [0, -40, 50], [16, 16, 100], '#6a6a7a'], ['box', [0, 40, 50], [16, 16, 100], '#6a6a7a'], ['box', [0, 0, 104], [18, 100, 14], '#7a7a8a'], ['ball', [0, 0, 60], 14, '#c060ff']], h: 130 });
    def('ward_obs', { parts: [['cap', [0, 0, 0], [0, 0, 50], 2, '#6a4a2a'], ['ball', [0, 0, 56], 8, '#f0e060'], ['ball', [6, 0, 57], 3.5, '#202020']], h: 70 });
    def('ward_sentry', { parts: [['cap', [0, 0, 0], [0, 0, 50], 2, '#6a4a2a'], ['ball', [0, 0, 56], 8, '#60a0ff'], ['ball', [6, 0, 57], 3.5, '#202020']], h: 70 });
    def('mine_land', { parts: [['cyl', [0, 0, 0], 14, 6, '#3a3a3a', null, 8, 12], ['ball', [0, 0, 8], 5, '#ff3020']], h: 16 });
    def('mine_stasis', { parts: [['cyl', [0, 0, 0], 12, 10, '#4a4a5a', null, 6, 8], ['cone', [0, 0, 10], 7, 14, '#60c0ff', null, 6], ['ball', [0, 0, 26], 4, '#c0f0ff']], h: 34 });
    def('mine_remote', { parts: [['box', [0, 0, 7], [22, 16, 14], '#8a2a1a'], ['box', [0, 0, 15], [10, 10, 3], '#303030'], ['cap', [3, 5, 16], [3, 5, 34], 1.2, '#909090'], ['ball', [3, 5, 35], 2.5, '#ff4020']], h: 40 });
    def('sign', { parts: [['cap', [0, 0, 0], [0, 0, 44], 2, '#5a3a1a'], ['box', [0, 0, 48], [3, 34, 20], '#c8a860'], ['box', [2, 0, 48], [1, 20, 6], '#c02020']], h: 60 });
    def('hward', { parts: [['cyl', [0, 0, 0], 8, 40, '#8a6a3a', null, 6, 5], ['ball', [0, 0, 46], 9, '#80ff80'], ['cone', [0, 0, 52], 6, 14, '#e0e060', null, 5]], h: 70 });
  }
  let built = false;
  function buildModels() { if (built) return; built = true; heroModels(); creepModels(); neutralModels(); staticModels(); }

  function poseFor(model, anim, t) {
    const P = {}; const m = model;
    const hip = m.hip || 44, sh = m.sh || 88;
    const set = (g, pivot, rot, extra) => { P[g] = Object.assign({ pivot, rot }, extra || {}); };
    if (anim === 'walk') {
      const s = Math.sin(t * Math.PI * 2);
      if (m.quad) { set('legL', [16, 0, 30], s * 0.6); set('legR', [16, 0, 30], -s * 0.6); set('legL2', [-16, 0, 30], -s * 0.6); set('legR2', [-16, 0, 30], s * 0.6); set('body', [0, 0, 0], 0, { dz: Math.abs(Math.cos(t * Math.PI * 2)) * 2 }); set('head', [0, 0, 0], 0, { dz: Math.abs(Math.cos(t * Math.PI * 2)) * 2 }); }
      else { set('legL', [0, -9, hip], s * 0.7); set('legR', [0, 9, hip], -s * 0.7); set('armL', [0, -19, sh], -s * 0.5); set('armR', [0, 19, sh], s * 0.5); const b = Math.abs(Math.cos(t * Math.PI * 2)) * 3; set('body', [0, 0, 0], 0, { dz: b }); set('head', [0, 0, 0], 0, { dz: b }); P.armL.dz = b; P.armR.dz = b; }
      if (m.wheels) set('wheel', [0, 0, 12], t * 6.28);
    } else if (anim === 'attack') {
      const k = t;
      if (m.atk === 'swing') { const r = k < 0.45 ? -2.2 * (k / 0.45) : -2.2 + 3.1 * Math.min(1, (k - 0.45) / 0.2); set('armR', [0, 19, sh], r); set('body', [0, 0, 0], 0, { da: k > 0.45 && k < 0.8 ? 4 : 0 }); if (m.quad) set('head', [20, 0, 40], k > 0.4 && k < 0.7 ? -0.4 : 0.2); }
      else if (m.atk === 'shoot') { set('armR', [0, 19, sh], -1.45); set('armL', [0, -19, sh], -1.3); set('body', [0, 0, 0], 0, { da: k > 0.3 && k < 0.5 ? -3 : 0 }); }
      else if (m.atk === 'throw') { const r = k < 0.5 ? -2.6 * (k / 0.5) : -2.6 + 3 * Math.min(1, (k - 0.5) / 0.2); set('armR', [0, 10, 60], r); }
      else if (m.atk === 'catapult') { set('armR', [-6, 0, 32], k < 0.5 ? 0.9 * k * 2 : 0.9 - 2 * (k - 0.5)); }
      else if (m.atk === 'bite') { set('head', [20, 0, 40], k > 0.3 && k < 0.6 ? -0.5 : 0.15, { da: k > 0.3 && k < 0.6 ? 6 : 0 }); set('body', [0, 0, 0], 0, { da: k > 0.3 && k < 0.6 ? 5 : 0 }); }
      else { set('armR', [0, 19, sh], -1.6 * Math.sin(k * Math.PI)); set('armL', [0, -19, sh], -1.3 * Math.sin(k * Math.PI)); }
    } else if (anim === 'cast') {
      const k = Math.sin(t * Math.PI);
      set('armR', [0, 19, sh], -2.7 * k); set('armL', [0, -19, sh], -2.7 * k); set('head', [0, 0, 0], 0, { dz: k * 2 });
    } else if (anim === 'spin') {
      P.all = { pivot: [0, 0, 0], yaw: t * Math.PI * 2 }; set('armR', [0, 19, sh], -1.5); set('armL', [0, -19, sh], -1.5);
    } else {
      const b = Math.sin(t * Math.PI * 2) * 1.2; set('body', [0, 0, 0], 0, { dz: b * 0.5 }); set('head', [0, 0, 0], 0, { dz: b });
    }
    if (m.hover) { const hv = m.hover + Math.sin(t * Math.PI * 2) * 3; P.all = Object.assign(P.all || { pivot: [0, 0, 0] }, { dz: hv }); }
    return P;
  }
  const FRAMES = { idle: 4, walk: 8, attack: 6, cast: 4, spin: 8 };
  const DIRS = 16;
  function outlined(src, alpha = 0.8) {
    const o = mk(src.width, src.height), c = o.getContext('2d');
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.drawImage(src, dx, dy);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = `rgba(14,10,6,${alpha})`; c.fillRect(0, 0, o.width, o.height);
    c.globalCompositeOperation = 'source-over'; c.drawImage(src, 0, 0);
    return o;
  }
  function paintModel(ctx, m, ox, oy, face, pose, scale) {
    if (m.outline === false) { renderModel(ctx, m, ox, oy, face, pose, scale); return; }
    const cv = ctx.canvas, tmp = mk(cv.width, cv.height), tc = tmp.getContext('2d');
    tc.setTransform(ctx.getTransform());
    renderModel(tc, m, ox, oy, face, pose, scale, null, 'solid');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(outlined(tmp), 0, 0); ctx.restore();
    if (m.glows) renderModel(ctx, m, ox, oy, face, pose, scale, null, 'glow');
  }
  class SpriteCache {
    constructor() { this.c = new Map(); this.count = 0; }
    get(modelId, dirF, anim, t, scale = 1) {
      const m = MODELS[modelId]; if (!m) return null;
      const nf = FRAMES[anim] || 1, fi = Math.floor(((t % 1) + 1) % 1 * nf) % nf;
      const di = ((Math.round(dirF / (Math.PI * 2) * DIRS) % DIRS) + DIRS) % DIRS;
      const key = modelId + '|' + di + '|' + anim + '|' + fi + '|' + scale;
      let s = this.c.get(key);
      if (!s) {
        const B = m.bounds || (m.bounds = modelBounds(m)), sc = (m.scale || 1) * scale;
        const W = Math.ceil(B.r * sc * S * 2.3 + 24), H = Math.ceil(B.top * sc * KZ + B.r * sc * S * 0.6 + 30), ox = W / 2, oy = H - Math.ceil(B.r * sc * S * 0.5 + 10), h = B.top * sc * KZ;
        const cv = mk(W, H);
        paintModel(cv.getContext('2d'), m, ox, oy, di / DIRS * Math.PI * 2, poseFor(m, anim, fi / nf), scale);
        s = { cv, ox, oy, h }; this.c.set(key, s); this.count++;
      }
      return s;
    }
    static(modelId) { return this.get(modelId, Math.PI * 0.75, 'idle', 0); }
  }
  function modelBounds(m) {
    let r = 20, top = 30;
    for (const P of m.parts) {
      const t = P[0]; let c = P[1], ext = 0, zt;
      if (t === 'poly') { for (const v of P[1]) { r = Math.max(r, Math.hypot(v[0], v[1])); top = Math.max(top, v[2]); } continue; }
      zt = c[2];
      if (t === 'ball' || t === 'glow') { ext = P[2]; zt += P[2]; } else if (t === 'ell') { ext = Math.max(P[2][0], P[2][1]); zt += P[2][2]; }
      else if (t === 'cap') { ext = P[3]; r = Math.max(r, Math.hypot(P[2][0], P[2][1]) + P[3]); zt = Math.max(zt, P[2][2]) + P[3]; }
      else if (t === 'box') { ext = Math.hypot(P[2][0], P[2][1], P[2][2]) / 2; zt += Math.max(P[2][2], P[2][0]) / 2; } else if (t === 'cone' || t === 'cyl') { ext = P[2]; zt += Math.max(0, P[3]); } else if (t === 'disk') ext = P[2];
      r = Math.max(r, Math.hypot(c[0], c[1]) + ext); top = Math.max(top, zt);
    }
    top += (m.hover || 0) + 30; r += 12;
    return { r, top };
  }
  const ATTR_TONE = { str: '#b8402a', agi: '#3a9a44', int: '#3a6ad0' };
  function renderPortrait(modelId, w = 64, h = w, o = {}) {
    buildModels();
    const m = MODELS[modelId] || MODELS[String(modelId).split('#')[0]], cv = mk(w, h), ctx = cv.getContext('2d');
    const hero = m.hid && DD.HEROES[m.hid], tone = hex(ATTR_TONE[hero ? hero.attr : ''] || '#806040');
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, rgb(tone, 0.32)); bg.addColorStop(1, '#080604'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const gl = ctx.createRadialGradient(w * 0.5, h * 0.42, 1, w * 0.5, h * 0.42, Math.max(w, h) * 0.62); gl.addColorStop(0, rgb(tone, 0.95, 30)); gl.addColorStop(0.55, rgb(tone, 0.4)); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,200,0.05)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(w * 0.5, -h * 0.2); ctx.lineTo(w * (0.1 + i * 0.2) - w * 0.06, h); ctx.lineTo(w * (0.1 + i * 0.2) + w * 0.06, h); ctx.closePath(); ctx.fill(); }
    const sc = m.scale || 1, full = o.focus === 'full' || o.focus === 'back';
    const bust = full ? [(m.h || 120) * 0.52, (m.h || 120) * 1.2] : (m.bust || [(m.h || 120) * 0.75, (m.h || 120) * 0.6]);
    const k = (full ? h : Math.max(h, w * 0.72)) / (bust[1] * sc * KZ);
    const oy = h * (full ? 0.5 : 0.52) + (bust[0] + (m.hover || 0)) * sc * k * KZ;
    paintModel(ctx, m, w / 2, oy, o.focus === 'back' ? Math.PI * 1.55 : Math.PI * 0.62, poseFor(m, 'idle', 0.25), k);
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    return cv;
  }

  function buildTerrain(map) {
    const cv = mk(TEX, TEX), ctx = cv.getContext('2d');
    const img = ctx.createImageData(TEX, TEX), d = img.data;
    const N = 200, coarse = new Float32Array((N + 1) * (N + 1));
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) coarse[j * (N + 1) + i] = D.fbm(i * 0.18, j * 0.18);
    const cn = (u, v) => { const x = u / TEX * N, y = v / TEX * N, xi = Math.min(N - 1, x | 0), yi = Math.min(N - 1, y | 0), fx = x - xi, fy = y - yi, i = yi * (N + 1) + xi; return (coarse[i] * (1 - fx) + coarse[i + 1] * fx) * (1 - fy) + (coarse[i + N + 1] * (1 - fx) + coarse[i + N + 2] * fx) * fy; };
    const GR = [[70, 112, 44], [96, 132, 52], [58, 96, 40]], DR = [[88, 70, 58], [110, 86, 64], [66, 52, 46]];
    for (let v = 0; v < TEX; v++) for (let u = 0; u < TEX; u++) {
      const x = (u + 0.5) * TU, y = (v + 0.5) * TU, n = cn(u, v), hsh = D.hash2(u, v);
      const side = Math.max(0, Math.min(1, ((x - y) / 1400) + 0.5));
      let r, g, b;
      const gi = n < 0.45 ? 0 : n < 0.62 ? 1 : 2, A = GR[gi], B = DR[gi];
      r = A[0] + (B[0] - A[0]) * side; g = A[1] + (B[1] - A[1]) * side; b = A[2] + (B[2] - A[2]) * side;
      const k = 0.9 + hsh * 0.2; r *= k; g *= k; b *= k;
      const dr = Math.hypot(x, y - MAP), dd = Math.hypot(x - MAP, y);
      if (dr < 4200 || dd < 4200) {
        const R = dr < 4200; const tile = ((Math.floor(x / 160) + Math.floor(y / 160)) & 1) ? 1 : 0.9;
        const cr = R ? [176, 168, 146] : [62, 50, 52];
        r = cr[0] * tile * k; g = cr[1] * tile * k; b = cr[2] * tile * k;
        if (!R && hsh > 0.985) { r = 220; g = 70; b = 20; }
        const e = (R ? dr : dd); if (e > 3900) { const t = (e - 3900) / 300; r = r * (1 - t) + 70 * t; g = g * (1 - t) + 60 * t; b = b * (1 - t) + 50 * t; }
      }
      const rd = map.riverDist(x, y);
      if (rd < 520 && x + y > 1200 && x + y < MAP * 2 - 1200 && dr >= 4200 && dd >= 4200) {
        if (rd < 470) { const deep = Math.max(0, 1 - rd / 470); r = 40 + 20 * (1 - deep) + hsh * 10; g = 96 + 30 * (1 - deep) + hsh * 12; b = 120 + 40 * deep + hsh * 10; if (hsh > 0.97) { r += 60; g += 60; b += 50; } }
        else { r = 120 + hsh * 20; g = 110 + hsh * 16; b = 80; }
      }
      const i = (v * TEX + u) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (pts, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w / TU; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] / TU, p[1] / TU) : ctx.moveTo(p[0] / TU, p[1] / TU)); ctx.stroke(); };
    for (const pl of map.paths) { stroke(pl, 300, 'rgba(90,72,44,0.55)'); stroke(pl, 200, 'rgba(120,96,60,0.5)'); }
    for (const k in map.lanes) { stroke(map.lanes[k], 560, 'rgba(96,78,50,0.8)'); stroke(map.lanes[k], 420, 'rgba(146,122,84,0.9)'); stroke(map.lanes[k], 250, 'rgba(160,138,98,0.6)'); }
    for (let i = 0; i < 26000; i++) { const u = D.hash2(i, 7) * TEX, v = D.hash2(i, 11) * TEX, x = u * TU, y = v * TU; let on = false; for (const k in map.lanes) if (D.polyDist(x, y, map.lanes[k]) < 220) { on = true; break; } if (!on) continue; ctx.fillStyle = D.hash2(i, 3) > 0.5 ? 'rgba(80,64,40,0.5)' : 'rgba(190,170,130,0.5)'; ctx.fillRect(u, v, 2, 1); }
    const Nn = map.N, cs = 64 / TU;
    for (let cy = 0; cy < Nn; cy++) for (let cx = 0; cx < Nn; cx++) {
      const i = cy * Nn + cx; if (!map.block[i] || cx < 3 || cy < 3 || cx >= Nn - 3 || cy >= Nn - 3) continue;
      const hs = D.hash2(cx, cy);
      ctx.fillStyle = rgb([92, 80, 70], 0.8 + hs * 0.4); ctx.fillRect(cx * cs, cy * cs, cs + 1, cs + 1);
      ctx.fillStyle = 'rgba(40,30,24,0.6)'; ctx.fillRect(cx * cs + cs * 0.5, cy * cs + cs * 0.4, cs * 0.5, cs * 0.6);
      ctx.fillStyle = 'rgba(200,190,170,0.35)'; ctx.fillRect(cx * cs, cy * cs, cs * 0.4, cs * 0.3);
    }
    for (const t of map.trees) { ctx.fillStyle = t.side ? 'rgba(30,20,16,0.28)' : 'rgba(20,40,14,0.3)'; ctx.beginPath(); ctx.arc(t.x / TU, t.y / TU, 90 / TU, 0, 7); ctx.fill(); }
    for (let i = 0; i < 9000; i++) {
      const u = D.hash2(i, 91) * TEX, v = D.hash2(i, 93) * TEX, x = u * TU, y = v * TU;
      if (map.heightAt(x, y) !== 1 || map.riverDist(x, y) < 560) continue;
      const side = x - y > 0, r = D.hash2(i, 5);
      if (!side) ctx.fillStyle = r < 0.3 ? '#e8e070' : r < 0.5 ? '#f0f0f0' : r < 0.7 ? '#c060c0' : '#8a8a78';
      else ctx.fillStyle = r < 0.25 ? '#c04010' : r < 0.6 ? '#4a3a34' : '#8a7a6a';
      ctx.fillRect(u, v, r < 0.6 ? 1 : 2, 1);
    }
    ctx.strokeStyle = 'rgba(60,50,40,0.9)'; ctx.lineWidth = 50 / TU * 3; ctx.beginPath(); ctx.arc(map.roshan[0] / TU, map.roshan[1] / TU, 430 / TU, 0.9, 0.9 + Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = 'rgba(40,34,28,0.5)'; ctx.beginPath(); ctx.arc(map.roshan[0] / TU, map.roshan[1] / TU, 380 / TU, 0, 7); ctx.fill();
    for (const p of map.powerRunes.concat(map.bountyRunes)) { ctx.strokeStyle = 'rgba(230,220,160,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0] / TU, p[1] / TU, 70 / TU * 1.2, 0, 7); ctx.stroke(); }
    for (const p of map.secret) { ctx.fillStyle = 'rgba(80,80,100,0.6)'; ctx.beginPath(); ctx.arc(p[0] / TU, p[1] / TU, 200 / TU, 0, 7); ctx.fill(); }
    return cv;
  }

  const GL = {
    sword(c, a) { c.fillStyle = a[1]; c.beginPath(); c.moveTo(46, 8); c.lineTo(54, 10); c.lineTo(22, 44); c.lineTo(18, 40); c.closePath(); c.fill(); c.fillStyle = a[2]; c.fillRect(12, 40, 16, 5); c.save(); c.translate(20, 42); c.rotate(-0.8); c.fillRect(-3, 0, 6, 16); c.restore(); },
    axe(c, a) { c.strokeStyle = a[2]; c.lineWidth = 5; c.beginPath(); c.moveTo(14, 54); c.lineTo(44, 14); c.stroke(); c.fillStyle = a[1]; c.beginPath(); c.moveTo(36, 8); c.quadraticCurveTo(62, 14, 56, 36); c.lineTo(42, 22); c.closePath(); c.fill(); },
    bomb(c, a) { c.fillStyle = a[1]; c.beginPath(); c.arc(28, 38, 17, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(22, 32, 5, 0, 7); c.fill(); c.strokeStyle = '#d0c090'; c.lineWidth = 3; c.beginPath(); c.moveTo(38, 24); c.quadraticCurveTo(46, 12, 52, 14); c.stroke(); c.fillStyle = '#ffd040'; c.beginPath(); c.arc(53, 12, 5, 0, 7); c.fill(); },
    mine(c, a) { c.fillStyle = a[1]; c.beginPath(); c.ellipse(32, 40, 22, 10, 0, 0, 7); c.fill(); c.fillStyle = a[2]; c.beginPath(); c.ellipse(32, 36, 16, 7, 0, 0, 7); c.fill(); c.fillStyle = '#ff3020'; c.beginPath(); c.arc(32, 33, 4, 0, 7); c.fill(); c.strokeStyle = '#ffd040'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(32 + Math.cos(i * 1.57 + 0.8) * 8, 22 + Math.sin(i * 1.57 + 0.8) * 5); c.lineTo(32 + Math.cos(i * 1.57 + 0.8) * 16, 16 + Math.sin(i * 1.57 + 0.8) * 8); c.stroke(); } },
    bolt(c, a) { c.fillStyle = a[1]; c.beginPath(); c.moveTo(38, 4); c.lineTo(16, 36); c.lineTo(30, 36); c.lineTo(22, 60); c.lineTo(48, 24); c.lineTo(34, 24); c.closePath(); c.fill(); },
    rocket(c, a) { c.fillStyle = a[2]; c.beginPath(); c.moveTo(20, 50); c.lineTo(32, 10); c.lineTo(44, 50); c.closePath(); c.fill(); c.fillStyle = a[1]; c.beginPath(); c.moveTo(24, 50); c.lineTo(32, 62); c.lineTo(40, 50); c.fill(); c.fillStyle = '#ffd040'; c.beginPath(); c.arc(32, 30, 5, 0, 7); c.fill(); },
    vortex(c, a) { c.strokeStyle = a[1]; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); for (let t = 0; t < 12; t += 0.2) { const r = 2 + t * 2.2, an = t + i * 2.1; const x = 32 + Math.cos(an) * r, y = 32 + Math.sin(an) * r; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.fillStyle = '#000'; c.beginPath(); c.arc(32, 32, 7, 0, 7); c.fill(); },
    swirl(c, a) { c.strokeStyle = a[1]; c.lineWidth = 4; c.beginPath(); for (let t = 0; t < 14; t += 0.2) { const r = 1 + t * 1.8, x = 32 + Math.cos(t) * r, y = 32 + Math.sin(t) * r; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); },
    stars(c, a) { c.fillStyle = a[1]; for (let i = 0; i < 9; i++) { const x = 10 + D.hash2(i, 1) * 44, y = 10 + D.hash2(i, 2) * 44, r = 1.5 + D.hash2(i, 3) * 3; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } },
    eye(c, a) { c.fillStyle = a[1]; c.beginPath(); c.ellipse(32, 32, 24, 14, 0, 0, 7); c.fill(); c.fillStyle = a[2]; c.beginPath(); c.arc(32, 32, 9, 0, 7); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(32, 32, 4, 0, 7); c.fill(); },
    shield(c, a) { c.fillStyle = a[1]; c.beginPath(); c.moveTo(32, 6); c.lineTo(54, 14); c.quadraticCurveTo(54, 44, 32, 58); c.quadraticCurveTo(10, 44, 10, 14); c.closePath(); c.fill(); c.fillStyle = a[2]; c.fillRect(29, 12, 6, 40); c.fillRect(16, 24, 32, 6); },
    tree(c, a) { c.fillStyle = '#6a4a2a'; c.fillRect(28, 40, 8, 18); c.fillStyle = a[1]; c.beginPath(); c.moveTo(32, 4); c.lineTo(52, 30); c.lineTo(12, 30); c.fill(); c.beginPath(); c.moveTo(32, 16); c.lineTo(56, 46); c.lineTo(8, 46); c.fill(); },
    fire(c, a) { c.fillStyle = a[2]; c.beginPath(); c.moveTo(32, 4); c.quadraticCurveTo(54, 30, 46, 50); c.quadraticCurveTo(32, 64, 18, 50); c.quadraticCurveTo(10, 30, 32, 4); c.fill(); c.fillStyle = a[1]; c.beginPath(); c.moveTo(32, 22); c.quadraticCurveTo(44, 38, 40, 50); c.quadraticCurveTo(32, 58, 24, 50); c.quadraticCurveTo(20, 38, 32, 22); c.fill(); },
    ice(c, a) { c.strokeStyle = a[1]; c.lineWidth = 4; for (let i = 0; i < 3; i++) { const an = i * Math.PI / 3; c.beginPath(); c.moveTo(32 - Math.cos(an) * 24, 32 - Math.sin(an) * 24); c.lineTo(32 + Math.cos(an) * 24, 32 + Math.sin(an) * 24); c.stroke(); } c.fillStyle = a[2]; c.beginPath(); c.arc(32, 32, 6, 0, 7); c.fill(); },
    skull(c, a) { c.fillStyle = a[1]; c.beginPath(); c.arc(32, 28, 18, 0, 7); c.fill(); c.fillRect(22, 38, 20, 14); c.fillStyle = '#000'; c.beginPath(); c.arc(25, 28, 5, 0, 7); c.arc(39, 28, 5, 0, 7); c.fill(); c.fillRect(26, 46, 3, 6); c.fillRect(35, 46, 3, 6); },
    hook(c, a) { c.strokeStyle = a[2]; c.lineWidth = 3; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(8, 8); c.lineTo(32, 30); c.stroke(); c.setLineDash([]); c.strokeStyle = a[1]; c.lineWidth = 6; c.beginPath(); c.moveTo(32, 26); c.lineTo(38, 42); c.arc(30, 44, 9, 0, Math.PI * 1.1); c.stroke(); },
    fist(c, a) { c.fillStyle = a[1]; c.beginPath(); c.roundRect ? c.roundRect(16, 18, 32, 30, 8) : c.rect(16, 18, 32, 30); c.fill(); c.fillStyle = a[2]; for (let i = 0; i < 4; i++) c.fillRect(18 + i * 8, 16, 6, 10); },
    heart(c, a) { c.fillStyle = a[1]; c.beginPath(); c.moveTo(32, 56); c.bezierCurveTo(4, 36, 10, 8, 32, 22); c.bezierCurveTo(54, 8, 60, 36, 32, 56); c.fill(); },
    cross(c, a) { c.fillStyle = a[1]; c.fillRect(26, 10, 12, 44); c.fillRect(10, 26, 44, 12); },
    hammer(c, a) { c.strokeStyle = a[2]; c.lineWidth = 5; c.beginPath(); c.moveTo(18, 56); c.lineTo(38, 24); c.stroke(); c.fillStyle = a[1]; c.save(); c.translate(40, 20); c.rotate(0.55); c.fillRect(-16, -8, 32, 16); c.restore(); },
    aura(c, a) { c.strokeStyle = a[1]; for (let i = 1; i <= 3; i++) { c.lineWidth = 3; c.globalAlpha = 1 - i * 0.2; c.beginPath(); c.arc(32, 32, i * 8, 0, 7); c.stroke(); } c.globalAlpha = 1; c.fillStyle = a[2]; c.beginPath(); c.arc(32, 32, 5, 0, 7); c.fill(); },
    frog(c, a) { c.fillStyle = a[1]; c.beginPath(); c.ellipse(32, 38, 20, 14, 0, 0, 7); c.fill(); c.beginPath(); c.arc(22, 24, 7, 0, 7); c.arc(42, 24, 7, 0, 7); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(22, 23, 3, 0, 7); c.arc(42, 23, 3, 0, 7); c.fill(); },
    spike(c, a) { c.fillStyle = a[1]; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(8 + i * 13, 58); c.lineTo(14 + i * 13, 14 + (i % 2) * 12); c.lineTo(20 + i * 13, 58); c.fill(); } },
    finger(c, a) { c.fillStyle = a[1]; c.fillRect(28, 8, 8, 30); c.fillRect(18, 34, 28, 22); c.fillStyle = a[2]; c.beginPath(); c.arc(32, 8, 6, 0, 7); c.fill(); },
    drop(c, a) { c.fillStyle = a[1]; c.beginPath(); c.moveTo(32, 6); c.quadraticCurveTo(52, 34, 44, 48); c.quadraticCurveTo(32, 62, 20, 48); c.quadraticCurveTo(12, 34, 32, 6); c.fill(); },
    gun(c, a) { c.fillStyle = a[2]; c.fillRect(6, 30, 52, 6); c.fillStyle = a[1]; c.beginPath(); c.moveTo(6, 32); c.lineTo(20, 32); c.lineTo(16, 48); c.lineTo(6, 48); c.fill(); c.fillRect(30, 24, 12, 6); },
    cloud(c, a) { c.fillStyle = a[1]; c.beginPath(); c.arc(22, 36, 12, 0, 7); c.arc(34, 28, 14, 0, 7); c.arc(46, 36, 11, 0, 7); c.fill(); c.strokeStyle = a[2]; c.lineWidth = 3; c.beginPath(); c.moveTo(18, 52); c.quadraticCurveTo(32, 44, 48, 54); c.stroke(); },
    letter(c, a) { c.fillStyle = a[1]; c.font = 'bold 30px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(a[3] || '?', 32, 34); }
  };
  const ICONS = {
    land_mines: ['mine', '#2a2a1a', '#3a3a3a', '#5a5a5a'], stasis_trap: ['ice', '#10203a', '#80d0ff', '#e0f8ff'], suicide_squad: ['bomb', '#4a1008', '#202020', '#ff6020'], remote_mines: ['rocket', '#3a1008', '#c03020', '#6a4a2a'], focused_detonate: ['bolt', '#3a1a08', '#ffb040', '#fff'], minefield_sign: ['letter', '#5a4a20', '#ff3020', '#000', '!'],
    malefice: ['stars', '#1a0a30', '#c0a0ff', '#fff'], demonic_conversion: ['swirl', '#2a0a3a', '#a060ff', '#fff'], midnight_pulse: ['aura', '#10081a', '#8040e0', '#e0c0ff'], black_hole: ['vortex', '#0a0418', '#b080ff', '#fff'],
    storm_hammer: ['hammer', '#1a2a4a', '#a0c0ff', '#6a4a2a'], great_cleave: ['sword', '#3a2a2a', '#d0d8e8', '#6a4a20'], warcry: ['shield', '#4a3a10', '#e0c060', '#8a2a1a'], gods_strength: ['fist', '#4a1010', '#ff5030', '#ffd0a0'],
    crystal_nova: ['ice', '#10304a', '#c0f0ff', '#80c0ff'], frostbite: ['ice', '#0a2040', '#80c0ff', '#ffffff'], arcane_aura: ['aura', '#102040', '#80a0ff', '#fff'], freezing_field: ['cloud', '#183050', '#e0f0ff', '#80c0ff'],
    shrapnel: ['stars', '#3a2a10', '#ffc040', '#fff'], headshot: ['eye', '#3a1010', '#f0e0d0', '#c02020'], take_aim: ['gun', '#2a2a2a', '#6a4a2a', '#8a8a90'], assassinate: ['eye', '#200808', '#ff4020', '#ffd040'],
    berserkers_call: ['shield', '#4a0a0a', '#ff3020', '#401010'], battle_hunger: ['skull', '#3a1010', '#e0d0c0', '#fff'], counter_helix: ['axe', '#3a1a10', '#c0c0c8', '#6a4a20'], culling_blade: ['axe', '#2a0808', '#ff2020', '#3a2a10'],
    dragon_slave: ['fire', '#3a1008', '#ffe060', '#ff5010'], light_strike_array: ['fire', '#3a2008', '#fff0a0', '#ff8020'], fiery_soul: ['fire', '#2a0808', '#ffa040', '#c02010'], laguna_blade: ['bolt', '#2a0a10', '#ff6040', '#fff'],
    blade_fury: ['swirl', '#3a2a10', '#ffd080', '#fff'], healing_ward: ['cross', '#103a10', '#60ff60', '#fff'], blade_dance: ['sword', '#3a2010', '#fff0c0', '#6a4a20'], omnislash: ['sword', '#2a1030', '#ffffff', '#a080ff'],
    meat_hook: ['hook', '#2a1a1a', '#c0c0c8', '#8a6a4a'], rot: ['cloud', '#1a2a0a', '#80a040', '#405010'], flesh_heap: ['heart', '#2a0a0a', '#c04040', '#fff'], dismember: ['skull', '#3a0808', '#e06060', '#fff'],
    earth_spike: ['spike', '#2a1a10', '#a08060', '#fff'], hex: ['frog', '#0a2a10', '#60c040', '#fff'], mana_drain: ['drop', '#0a1030', '#4080ff', '#fff'], finger_of_death: ['finger', '#300808', '#ff4030', '#ffd040'],
    talent: ['tree', '#2a2010', '#e0c060']
  };
  function drawIcon(id, w, h) {
    const cv = mk(w, h), c = cv.getContext('2d'), a = ICONS[id] || ['letter', '#2a2a2a', '#ccc', '#000', (id || '?')[0].toUpperCase()];
    const g = c.createLinearGradient(0, 0, w, h); const b = hex(a[1]); g.addColorStop(0, rgb(b, 1.8, 20)); g.addColorStop(1, rgb(b, 0.7)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save(); const k = Math.min(w, h) / 64; c.translate((w - 64 * k) / 2, (h - 64 * k) / 2); c.scale(k, k);
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowOffsetX = 2; c.shadowOffsetY = 2;
    (GL[a[0]] || GL.letter)(c, [a[0], a[2], a[3], a[4]]);
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, w - 1, h - 1);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(1, 1, w - 2, 2);
    return cv;
  }
  function buildIcons() {
    const A = {}, I = {};
    for (const hid of DD.HERO_ORDER) { const h = DD.HEROES[hid]; for (const ab of h.abilities.concat(h.extra || [], h.scepter ? [h.scepter] : [])) A[ab.key] = drawIcon(ab.key, 48, 48); }
    for (const id in DD.ITEMS) I[id] = D.ItemArt.draw(id);
    A.talent = drawIcon('talent', 48, 48);
    return { abil: A, item: I };
  }
  function buildMinimap(tex, w, h) {
    const cv = mk(w, h), c = cv.getContext('2d');
    const kx = w / (2 * TEX), ky = h / (2 * TEX);
    c.imageSmoothingEnabled = true; c.setTransform(kx, -ky, kx, ky, 0, h / 2); c.drawImage(tex, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0);
    return cv;
  }

  D.GFX = { KX, KY, KZ, S, TEX, TU, MODELS, HERO_ART, buildModels, heroModel, hasStyle, SpriteCache, renderModel, paintModel, poseFor, renderPortrait, buildTerrain, buildIcons, drawIcon, buildMinimap, DIRS, hex, rgb, mk };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
