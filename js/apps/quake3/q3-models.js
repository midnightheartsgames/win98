(function (Q) {
  'use strict';
  const M4 = Q.M4;
  const hexc = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

  class MB {
    constructor() { this.p = []; this.n = []; this.c = []; this.glow = []; }
    tri(a, b, c, col, g) {
      const n = Q.vnorm(Q.vcross(Q.vsub(b, a), Q.vsub(c, a)));
      for (const v of [a, b, c]) { this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]); this.c.push(col[0], col[1], col[2]); this.glow.push(g || 0); }
    }
    quad(a, b, c, d, col, g) { this.tri(a, b, c, col, g); this.tri(a, c, d, col, g); }
    box(cx, cy, cz, sx, sy, sz, col, o) {
      o = o || {};
      const tx = o.tx === undefined ? 1 : o.tx, ty = o.ty === undefined ? 1 : o.ty;
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const ox = o.ox || 0;
      const b = [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz]].map(v => [cx + v[0], cy + v[1], cz + v[2]]);
      const t = [[-hx * tx + ox, -hy * ty, hz], [hx * tx + ox, -hy * ty, hz], [hx * tx + ox, hy * ty, hz], [-hx * tx + ox, hy * ty, hz]].map(v => [cx + v[0], cy + v[1], cz + v[2]]);
      const g = o.glow || 0;
      const top = o.top || col, side = col;
      const sh = o.flat ? 1 : 0.86;
      this.quad(t[0], t[1], t[2], t[3], top, g);
      this.quad(b[3], b[2], b[1], b[0], scl(col, 0.7), g);
      this.quad(b[0], b[1], t[1], t[0], scl(side, sh), g);
      this.quad(b[1], b[2], t[2], t[1], side, g);
      this.quad(b[2], b[3], t[3], t[2], scl(side, sh), g);
      this.quad(b[3], b[0], t[0], t[3], scl(side, 0.93), g);
      return this;
    }
    cyl(a, b, r0, r1, sides, col, o) {
      o = o || {};
      const ax = Q.vnorm(Q.vsub(b, a));
      let u = Math.abs(ax[2]) < 0.9 ? Q.vnorm(Q.vcross(ax, [0, 0, 1])) : Q.vnorm(Q.vcross(ax, [1, 0, 0]));
      const v = Q.vcross(ax, u);
      const ring = (c, r, k) => { const an = k / sides * Q.TAU + (o.rot || 0); return Q.vadd(c, Q.vadd(Q.vscale(u, Math.cos(an) * r), Q.vscale(v, Math.sin(an) * r))); };
      const g = o.glow || 0;
      for (let k = 0; k < sides; k++) {
        const p0 = ring(a, r0, k), p1 = ring(a, r0, k + 1), p2 = ring(b, r1, k + 1), p3 = ring(b, r1, k);
        this.quad(p0, p3, p2, p1, k % 2 ? col : scl(col, 0.92), g);
        if (o.caps !== false) {
          if (r1 > 0.01) this.tri(b, p3, p2, o.capCol || col, g);
          if (r0 > 0.01) this.tri(a, p1, p0, o.capCol || scl(col, 0.8), g);
        }
      }
      return this;
    }
    sphere(c, rx, ry, rz, segs, rings, col, o) {
      o = o || {};
      const g = o.glow || 0;
      const pt = (i, j) => {
        const th = j / rings * Math.PI, ph = i / segs * Q.TAU;
        return [c[0] + Math.sin(th) * Math.cos(ph) * rx, c[1] + Math.sin(th) * Math.sin(ph) * ry, c[2] + Math.cos(th) * rz];
      };
      for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
        const a = pt(i, j), b = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
        const colr = o.band && j >= o.band[0] && j < o.band[1] ? o.bandCol : col;
        if (j === 0) this.tri(a, d, cc, colr, g);
        else if (j === rings - 1) this.tri(a, cc, b, colr, g);
        else this.quad(a, d, cc, b, colr, g);
      }
      return this;
    }
    finish() {
      return { pos: new Float32Array(this.p), nrm: new Float32Array(this.n), col: new Float32Array(this.c), glow: new Float32Array(this.glow), count: this.p.length / 3 };
    }
  }
  Q.MB = MB;

  const TEAM = { red: { suit: '#6a1a14', armor: '#b02a1e' }, blue: { suit: '#1a2860', armor: '#2848b8' } };
  const STONE = '#8a7c6c';

  function charDims(arch) {
    const d = { hipZ: 3, hipW: 4.6, thigh: 14, shin: 13, torsoH: 21, shoulderZ: 18, shoulderW: 9.5, uarm: 11, farm: 10, neckZ: 21, headH: 10, chestW: 17, chestD: 10, waistW: 12, limb: 3.2, lean: 0 };
    if (arch === 'female') Object.assign(d, { shoulderW: 8, chestW: 13, chestD: 8, waistW: 10, limb: 2.6, headH: 9 });
    if (arch === 'heavy') Object.assign(d, { hipW: 6, thigh: 12, shin: 13, torsoH: 22, shoulderW: 12, chestW: 24, chestD: 16, waistW: 20, limb: 4.4, headH: 9, hipZ: 2 });
    if (arch === 'creature') Object.assign(d, { lean: 0.35, uarm: 13, farm: 12, chestW: 18, limb: 3.4 });
    if (arch === 'bones') Object.assign(d, { limb: 1.6, chestW: 13, chestD: 8, waistW: 5 });
    if (arch === 'skater') Object.assign(d, { hipZ: 7, thigh: 13, shin: 12, chestW: 13, limb: 2.4 });
    if (arch === 'orbb') Object.assign(d, { hipZ: 6, thigh: 13, shin: 14, torsoH: 0, shoulderW: 11, shoulderZ: 4, uarm: 8, farm: 8, neckZ: 0, headH: 0, limb: 2.6 });
    return d;
  }

  function buildHead(mb, look, c, d) {
    const skin = c.skin, hair = c.hair, h = d.headH, w = h * 0.78;
    const type = look.head;
    if (type === 'skull') {
      mb.box(0.5, 0, h * 0.5, w, w * 0.9, h * 0.95, skin, { tx: 0.8, ty: 0.85 });
      mb.box(w * 0.46, 1.8, h * 0.55, 1, 2.2, 2.2, [0.05, 0.03, 0.02]);
      mb.box(w * 0.46, -1.8, h * 0.55, 1, 2.2, 2.2, [0.05, 0.03, 0.02]);
      mb.box(w * 0.4, 0, h * 0.14, 2, w * 0.6, 2, scl(skin, 0.8));
      return;
    }
    if (type === 'insect') {
      mb.sphere([1.5, 0, h * 0.45], w * 0.75, w * 0.62, h * 0.55, 8, 5, skin);
      mb.sphere([w * 0.5, 2.6, h * 0.62], 2, 2.2, 2.2, 6, 4, [0.9, 0.7, 0.1], { glow: 0.6 });
      mb.sphere([w * 0.5, -2.6, h * 0.62], 2, 2.2, 2.2, 6, 4, [0.9, 0.7, 0.1], { glow: 0.6 });
      mb.cyl([w * 0.6, 1.5, h * 0.15], [w * 1.2, 2.5, -1], 1, 0.3, 4, scl(skin, 0.7));
      mb.cyl([w * 0.6, -1.5, h * 0.15], [w * 1.2, -2.5, -1], 1, 0.3, 4, scl(skin, 0.7));
      mb.cyl([0, 2, h * 0.9], [-4, 4, h * 1.5], 0.6, 0.2, 4, scl(skin, 0.6));
      mb.cyl([0, -2, h * 0.9], [-4, -4, h * 1.5], 0.6, 0.2, 4, scl(skin, 0.6));
      return;
    }
    if (type === 'reptile') {
      mb.box(2.5, 0, h * 0.45, w * 1.5, w * 0.8, h * 0.8, skin, { tx: 0.9, ty: 0.8 });
      mb.box(w * 0.9, 0, h * 0.3, w * 0.7, w * 0.6, h * 0.35, scl(skin, 0.9));
      mb.box(w * 0.55, 2.2, h * 0.62, 1, 1.4, 1.2, [0.95, 0.8, 0.1], { glow: 0.5 });
      mb.box(w * 0.55, -2.2, h * 0.62, 1, 1.4, 1.2, [0.95, 0.8, 0.1], { glow: 0.5 });
      return;
    }
    mb.box(0.4, 0, h * 0.5, w, w * 0.84, h, skin, { tx: 0.86, ty: 0.9 });
    mb.box(w * 0.5, 1.6, h * 0.58, 0.6, 1.8, 0.9, [0.08, 0.06, 0.05]);
    mb.box(w * 0.5, -1.6, h * 0.58, 0.6, 1.8, 0.9, [0.08, 0.06, 0.05]);
    mb.box(w * 0.5, 0, h * 0.22, 0.6, 2.6, 0.7, scl(skin, 0.55));
    if (type === 'beret') mb.box(-0.5, 0.8, h * 1.02, w * 1.12, w * 1.02, 2.2, hair, { tx: 0.9, ty: 0.9 });
    if (type === 'helmet' || type === 'visor') {
      const hc = look.helmetColor ? hexc(look.helmetColor) : c.armor;
      mb.box(-0.2, 0, h * 0.62, w * 1.18, w * 1.06, h * 0.95, hc, { tx: 0.86, ty: 0.86 });
      mb.box(w * 0.58, 0, h * 0.56, 0.8, w * 0.8, 2.2, type === 'visor' ? [1, 0.2, 0.1] : [0.1, 0.2, 0.15], { glow: type === 'visor' ? 1 : 0.3 });
    }
    if (type === 'goggles') mb.box(w * 0.5, 0, h * 0.6, 1.4, w * 0.95, 2, [0.1, 0.1, 0.1]).box(w * 0.55, 1.8, h * 0.6, 0.5, 1.6, 1.4, [0.9, 0.5, 0.1], { glow: 0.8 }).box(w * 0.55, -1.8, h * 0.6, 0.5, 1.6, 1.4, [0.9, 0.5, 0.1], { glow: 0.8 });
    if (type === 'mohawk') mb.box(-0.5, 0, h * 1.12, w * 0.9, 1.8, 5, hair, { tx: 1.1 });
    if (type === 'cap') mb.box(-0.3, 0, h * 0.98, w * 1.08, w * 0.98, 2.2, hair).box(w * 0.55, 0, h * 0.9, 3, w * 0.8, 0.6, hair);
    if (type === 'longhair') mb.box(-1.8, 0, h * 0.5, w * 0.7, w * 1.02, h * 1.25, hair).box(-0.2, 0, h * 1.0, w * 1.04, w * 0.98, 1.6, hair);
    if (type === 'bun') mb.box(-0.4, 0, h * 0.98, w * 1.02, w * 0.94, 2, hair).sphere([-w * 0.45, 0, h * 0.95], 2.4, 2.4, 2.4, 6, 4, hair);
    if (type === 'feathers') {
      for (let i = -3; i <= 3; i++) mb.cyl([-1, i * 1.3, h * 0.9], [-4 - Math.abs(i), i * 2.6, h * 1.9 - Math.abs(i) * 0.6], 0.8, 0.2, 4, i % 2 ? hair : c.trim);
      mb.box(-0.2, 0, h * 0.95, w * 1.04, w * 0.96, 1.4, c.trim);
    }
    if (type === 'hood') mb.box(-1, 0, h * 0.62, w * 1.3, w * 1.2, h * 1.12, c.armor, { tx: 0.7, ty: 0.75, ox: -1 });
    if (look.extra.includes('cigar')) mb.box(w * 0.62, -1.2, h * 0.22, 3.6, 0.8, 0.8, [0.45, 0.28, 0.15]).box(w * 0.62 + 1.9, -1.2, h * 0.22, 0.4, 0.8, 0.8, [1, 0.4, 0.1], { glow: 1 });
    if (look.extra.includes('beard')) mb.box(w * 0.36, 0, h * 0.12, 2.6, w * 0.8, 4, hair);
  }

  function buildCharacter(look, team, stone) {
    const d = charDims(look.arch);
    const pal = stone ? { suit: STONE, armor: STONE, trim: STONE, skin: STONE, hair: STONE } : Object.assign({}, look, team && TEAM[team] ? TEAM[team] : {});
    const c = { suit: hexc(pal.suit), armor: hexc(pal.armor), trim: hexc(pal.trim), skin: hexc(pal.skin), hair: hexc(pal.hair || '#222222') };
    if (stone) for (const k of Object.keys(c)) c[k] = mixc(c[k], [0.5, 0.46, 0.42], 0.3);
    const parts = {};
    const L = d.limb, arch = look.arch;
    const boot = scl(c.armor, 0.7);
    const mk = fn => { const mb = new MB(); fn(mb); return mb.finish(); };
    parts.thigh = mk(mb => {
      if (arch === 'bones') mb.cyl([0, 0, 0], [0, 0, -d.thigh], L * 0.7, L * 0.6, 5, c.skin);
      else mb.box(0, 0, -d.thigh / 2, L * 1.9, L * 1.9, d.thigh, c.suit, { tx: 0.9, ty: 0.9 });
      if (arch === 'armor' || arch === 'heavy') mb.box(1.2, 0, -d.thigh * 0.45, L * 0.6, L * 1.7, d.thigh * 0.6, c.armor);
    });
    parts.shin = mk(mb => {
      if (arch === 'bones') mb.cyl([0, 0, 0], [0, 0, -d.shin], L * 0.6, L * 0.5, 5, c.skin);
      else mb.box(0, 0, -d.shin / 2, L * 1.7, L * 1.7, d.shin, arch === 'female' ? c.suit : boot, { tx: 1.05, ty: 1.05 });
      const fc = arch === 'orbb' ? c.suit : boot;
      mb.box(2, 0, -d.shin - 1, L * 2.6, L * 1.8, 2.4, fc);
      if (look.extra.includes('skates')) {
        mb.box(1.6, 0, -d.shin - 3, L * 3.2, 1.4, 1.2, [0.2, 0.2, 0.2]);
        for (const x of [-2, 0.7, 3.4]) mb.box(x, 0, -d.shin - 4, 1.6, 1.4, 1.6, [0.9, 0.3, 0.6]);
      }
    });
    parts.pelvis = mk(mb => {
      if (arch === 'orbb') return;
      if (arch === 'robe') { mb.cyl([0, 0, 2], [0, 0, -d.thigh - d.shin - 1], d.waistW * 0.55, d.waistW * 0.95, 8, c.armor); return; }
      mb.box(0, 0, 0, d.chestD * 0.9, d.waistW, 7, arch === 'bones' ? c.skin : c.suit);
      mb.box(0, 0, 2.5, d.chestD * 0.95, d.waistW * 1.02, 2, c.trim);
    });
    parts.torso = mk(mb => {
      if (arch === 'orbb') {
        mb.sphere([0, 0, 10], 12, 12, 12, 12, 8, c.skin);
        mb.sphere([9.2, 0, 11], 5.4, 5.4, 5.4, 10, 6, [0.85, 0.35, 0.1], { glow: 0.35 });
        mb.sphere([12.6, 0, 11], 2.4, 2.4, 2.4, 8, 4, [0.05, 0.03, 0.02]);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Q.TAU; mb.cyl([Math.cos(a) * 8, Math.sin(a) * 8, 3], [Math.cos(a) * 11, Math.sin(a) * 11, -1], 1.4, 0.6, 4, c.armor); }
        return;
      }
      if (arch === 'bones') {
        mb.cyl([0, 0, 2], [0, 0, d.torsoH - 2], 1.2, 1.2, 5, c.skin);
        for (let i = 0; i < 5; i++) mb.box(1, 0, 8 + i * 2.6, d.chestD * 0.7, d.chestW * (0.9 - i * 0.05), 1, c.skin);
        mb.box(0, 0, d.shoulderZ, 3, d.shoulderW * 2.2, 2, c.skin);
        return;
      }
      const chest = arch === 'female' ? c.armor : c.armor;
      mb.box(0, 0, 6, d.chestD * 0.8, d.waistW, 10, c.suit, { tx: 1.1, ty: 1.2 });
      mb.box(0.3, 0, 15.5, d.chestD, d.chestW, 11, chest, { tx: 0.95, ty: 1.05 });
      if (arch === 'heavy') mb.box(4, 0, 6, 8, d.waistW * 0.9, 9, look.female ? c.suit : c.skin, { tx: 0.8 });
      if (arch === 'female') { mb.box(4, 2.6, 15, 3, 4, 4, chest); mb.box(4, -2.6, 15, 3, 4, 4, chest); }
      mb.box(d.chestD * 0.42, 0, 13, 1, d.chestW * 0.5, 7, c.trim);
      if (look.extra.includes('pads') || arch === 'heavy') {
        mb.box(0, d.shoulderW + 1, d.shoulderZ + 2, 8, 6, 4, c.armor, { tx: 0.8, ty: 0.7 });
        mb.box(0, -d.shoulderW - 1, d.shoulderZ + 2, 8, 6, 4, c.armor, { tx: 0.8, ty: 0.7 });
      }
      if (look.extra.includes('blades')) {
        mb.cyl([0, d.shoulderW + 2, d.shoulderZ + 4], [-2, d.shoulderW + 7, d.shoulderZ + 12], 1.4, 0.1, 4, [0.8, 0.8, 0.85]);
        mb.cyl([0, -d.shoulderW - 2, d.shoulderZ + 4], [-2, -d.shoulderW - 7, d.shoulderZ + 12], 1.4, 0.1, 4, [0.8, 0.8, 0.85]);
      }
      if (look.extra.includes('tank')) mb.cyl([-d.chestD * 0.6 - 2, 0, 6], [-d.chestD * 0.6 - 2, 0, 20], 4, 4, 8, c.trim);
      if (look.extra.includes('cyber')) mb.box(d.chestD * 0.45, -4, 18, 1.2, 4, 4, [0.9, 0.1, 0.1], { glow: 0.9 });
      if (look.extra.includes('vest')) mb.box(-0.5, 0, 16, d.chestD * 1.08, d.chestW * 1.04, 10, [0.18, 0.14, 0.1], { tx: 0.95 });
      if (look.extra.includes('stripes')) for (let i = 0; i < 3; i++) mb.box(d.chestD * 0.5, 0, 11 + i * 3.5, 0.6, d.chestW * 0.9, 1.2, [0.05, 0.05, 0.05]);
      if (arch === 'winged') {
        for (const s of [1, -1]) {
          mb.tri([-d.chestD * 0.5, s * 3, 20], [-10, s * 24, 34], [-8, s * 20, 4], c.trim);
          mb.tri([-d.chestD * 0.5, s * 3, 20], [-8, s * 20, 4], [-10, s * 24, 34], scl(c.trim, 0.7));
        }
      }
      if (arch === 'creature' && look.extra.includes('tail')) mb.cyl([-d.chestD * 0.4, 0, 1], [-18, 0, -14], 3, 0.5, 5, c.skin);
      if (arch === 'robe') mb.box(0, 0, 14, d.chestD * 1.15, d.chestW * 1.08, 16, c.armor, { tx: 0.95 });
    });
    parts.head = mk(mb => { if (arch !== 'orbb') buildHead(mb, look, c, d); });
    parts.uarm = mk(mb => {
      if (arch === 'bones') mb.cyl([0, 0, 0], [0, 0, -d.uarm], L * 0.55, L * 0.5, 5, c.skin);
      else mb.box(0, 0, -d.uarm / 2, L * 1.6, L * 1.6, d.uarm, arch === 'orbb' ? c.armor : c.suit);
    });
    parts.farm = mk(mb => {
      if (arch === 'bones') mb.cyl([0, 0, 0], [0, 0, -d.farm], L * 0.5, L * 0.45, 5, c.skin);
      else mb.box(0, 0, -d.farm / 2, L * 1.45, L * 1.45, d.farm, arch === 'female' || arch === 'heavy' ? c.skin : c.armor, { tx: 1.1, ty: 1.1 });
      mb.box(0, 0, -d.farm - 1.5, L * 1.3, L * 1.3, 3, arch === 'creature' ? c.skin : c.skin);
    });
    if (arch === 'skater') parts.board = mk(mb => { mb.box(2, 0, 0, 30, 10, 2, c.trim).box(2, 0, -1.4, 26, 8, 1, [0.3, 0.9, 1], { glow: 1 }); });
    return { look, d, parts, arch, key: (look.arch + look.head + look.suit + (team || '') + (stone ? 's' : '')) };
  }

  const charCache = new Map();
  Q.getCharacter = function (look, team, stone) {
    const key = JSON.stringify([look, team || '', !!stone]);
    if (!charCache.has(key)) charCache.set(key, buildCharacter(look, team, stone));
    return charCache.get(key);
  };

  function swing(m, a) { return M4.rotY(m, -a); }

  Q.poseCharacter = function (ch, st, out) {
    const d = ch.d, P = ch.parts;
    out.length = 0;
    const push = (mesh, m, extra) => { if (mesh.count) out.push(Object.assign({ mesh, m }, extra || {})); };
    let root = M4.translate(M4.ident(), st.pos[0], st.pos[1], st.pos[2]);
    let legYaw = st.legYaw, torsoYaw = st.yaw;
    const t = st.t || 0;
    let phase = st.phase || 0;
    let thL = 0, thR = 0, knL = 0.1, knR = 0.1, bob = 0, lean = d.lean, low = 0;
    const mv = st.moveSpeed || 0;
    if (st.dead) {
      const k = Math.min(1, st.deathT / 0.7);
      const e = k * k * (3 - 2 * k);
      root = M4.translate(root, 0, 0, -24);
      root = M4.rotZ(root, legYaw);
      if (st.deathAnim === 0) root = M4.rotY(root, -e * 1.5);
      else if (st.deathAnim === 1) root = M4.rotY(root, e * 1.45);
      else { root = M4.rotZ(root, e * 1.2); root = M4.rotX(root, e * 1.5); }
      root = M4.translate(root, 0, 0, 24 - e * 6);
      legYaw = 0; torsoYaw = 0;
      thL = e * 0.4; thR = -e * 0.2; knL = e * 0.6; knR = 0.2;
    } else {
      root = M4.rotZ(root, legYaw);
      if (!st.onGround) { thL = 0.7; thR = 0.35; knL = 1.2; knR = 0.9; }
      else if (st.crouch) {
        low = 11;
        const s = mv > 10 ? Math.sin(phase * Q.TAU) * 0.35 : 0;
        thL = 1.15 + s; thR = 1.15 - s; knL = 2.0; knR = 2.0; lean += 0.25;
      } else if (mv > 20) {
        const back = st.back ? -1 : 1;
        const amp = Math.min(1, mv / 300);
        const s = Math.sin(phase * Q.TAU) * back;
        thL = s * 0.8 * amp; thR = -s * 0.8 * amp;
        knL = (0.15 + Math.max(0, -Math.cos(phase * Q.TAU)) * 1.2) * amp + 0.1;
        knR = (0.15 + Math.max(0, Math.cos(phase * Q.TAU)) * 1.2) * amp + 0.1;
        bob = Math.abs(Math.sin(phase * Q.TAU)) * 1.6 * amp;
        lean += 0.1 * amp * back;
      } else {
        bob = Math.sin(t * 2) * 0.3;
      }
      if (st.landT !== undefined && st.landT < 0.25) { const k = 1 - st.landT / 0.25; low += 5 * k; knL += 0.6 * k; knR += 0.6 * k; thL += 0.3 * k; thR += 0.3 * k; }
    }
    const hipZ = d.hipZ + bob - low;
    const pelvisM = M4.translate(root, 0, 0, hipZ);
    push(P.pelvis, pelvisM);
    if (P.board) push(P.board, M4.translate(root, 0, 0, -22 - low));
    for (const s of [1, -1]) {
      const th = s > 0 ? thL : thR, kn = s > 0 ? knL : knR;
      let tm = M4.translate(pelvisM, 0, d.hipW * s, -1);
      tm = swing(tm, th);
      push(P.thigh, tm);
      let sm = M4.translate(tm, 0, 0, -d.thigh);
      sm = swing(sm, -kn);
      push(P.shin, sm);
    }
    let tor = M4.rotZ(pelvisM, Q.angDiff(legYaw, torsoYaw));
    const pitch = st.dead ? 0 : Q.clamp(st.pitch || 0, -1.2, 1.2);
    const attack = st.attackT !== undefined && st.attackT < 0.15 ? 1 - st.attackT / 0.15 : 0;
    tor = M4.translate(tor, 0, 0, 2);
    tor = M4.rotY(tor, lean + pitch * 0.35 - attack * 0.08);
    push(P.torso, tor);
    if (ch.arch !== 'orbb') {
      let hm = M4.translate(tor, 0, 0, d.neckZ);
      hm = M4.rotY(hm, pitch * 0.45);
      push(P.head, hm, { head: true });
    }
    const gesture = st.gestureT !== undefined && st.gestureT < 1.6;
    const aimP = st.dead ? 0 : pitch * 0.6;
    const holdR = [1.05 - aimP - attack * 0.15, 0.7], holdL = [1.15 - aimP, 1.0];
    for (const s of [-1, 1]) {
      let am = M4.translate(tor, 0, d.shoulderW * s, d.shoulderZ);
      let a1, a2, spread;
      if (st.dead) { a1 = s > 0 ? -0.6 : 0.9; a2 = 0.3; spread = 0.5; }
      else if (gesture && s < 0) { a1 = 2.9; a2 = 0.2; spread = 0.2; }
      else if (s < 0) { a1 = holdR[0]; a2 = holdR[1]; spread = 0.12; }
      else { a1 = holdL[0]; a2 = holdL[1]; spread = -0.35; }
      am = M4.rotX(am, spread * s);
      am = swing(am, a1);
      push(P.uarm, am);
      let fm = M4.translate(am, 0, 0, -d.uarm);
      fm = swing(fm, a2);
      push(P.farm, fm);
      if (s < 0) {
        const hand = M4.point(fm, [0, 0, -d.farm - 1]);
        const wm = M4.rotY(tor, gesture ? -1.3 : pitch * 0.65 + attack * 0.1);
        wm[12] = hand[0]; wm[13] = hand[1]; wm[14] = hand[2];
        out.weaponMatrix = wm;
      }
    }
    return out;
  };

  function weaponMesh(w) {
    const mb = new MB();
    const gm = [0.3, 0.31, 0.34], dk = [0.12, 0.12, 0.14], lt = [0.62, 0.63, 0.66], st = [0.46, 0.47, 0.5];
    const ring = (x0, x1, r, c, z, y) => mb.cyl([x0, y || 0, z || 0], [x1, y || 0, z || 0], r, r, 10, c);
    switch (w) {
      case 1: {
        mb.box(-1, 0, 0, 9, 7, 7, [0.45, 0.4, 0.34], { tx: 0.9, ty: 0.85 });
        mb.box(-5, 0, 0, 5, 6, 6, [0.3, 0.26, 0.22]);
        mb.box(3, 0, 3.8, 6, 5, 1.6, lt);
        mb.box(3, 3.8, 0, 6, 1.4, 5, lt);
        mb.box(3, -3.8, 0, 6, 1.4, 5, lt);
        mb.cyl([4, 0, 0], [9, 0, 0], 1.3, 1.3, 6, dk);
        mb.cyl([9.5, -0.8, 0], [9.5, 0.8, 0], 6.4, 6.4, 16, [0.72, 0.78, 0.9], { glow: 0.25 });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Q.TAU; mb.box(9.5 + Math.cos(a) * 6.8, 0, Math.sin(a) * 6.8, 1.6, 1.2, 1.6, [0.85, 0.88, 0.95]); }
        mb.cyl([9.5, -1.2, 0], [9.5, 1.2, 0], 1.6, 1.6, 8, [0.3, 0.5, 1], { glow: 1 });
        break;
      }
      case 2: {
        mb.box(3, 0, 0.5, 16, 4.4, 5.4, gm, { tx: 0.95 });
        mb.box(4, 0, 3.6, 12, 2.4, 1.2, dk);
        ring(10, 24, 2.3, st);
        for (let x = 12; x < 23; x += 2.5) ring(x, x + 0.8, 2.6, dk);
        ring(23.8, 26, 1.1, dk);
        mb.box(5, 0, -3.8, 4, 2.6, 6, dk, { tx: 1.2, ox: -0.8 });
        mb.box(-2.5, 0, -3.2, 3, 3, 5.6, [0.22, 0.2, 0.2], { ox: -1 });
        mb.box(-6, 0, 0.8, 5, 3.4, 3.6, gm);
        mb.box(8, 0, 3.6, 1.4, 0.8, 1.6, [1, 0.8, 0.2], { glow: 0.8 });
        break;
      }
      case 3: {
        mb.box(1, 0, 0, 12, 5.4, 5, [0.4, 0.3, 0.2]);
        mb.box(-5.5, 0, -1, 7, 3.6, 4, [0.35, 0.24, 0.15], { tx: 0.8 });
        ring(6, 22, 1.55, st, 1.4, 1.5);
        ring(6, 22, 1.55, st, 1.4, -1.5);
        ring(21.6, 22.6, 1.7, dk, 1.4, 1.5);
        ring(21.6, 22.6, 1.7, dk, 1.4, -1.5);
        mb.box(13, 0, -1.2, 8, 4, 2.4, [0.3, 0.22, 0.14]);
        mb.box(3, 0, -3.8, 2.6, 2.2, 5, dk, { ox: -0.6 });
        mb.box(8, 0, 3.2, 3, 1, 1, [1, 0.55, 0.1], { glow: 0.7 });
        break;
      }
      case 4: {
        mb.box(-2, 0, 0, 10, 5, 5.6, [0.3, 0.36, 0.26]);
        mb.cyl([2, 0, 0.6], [12, 0, 0.6], 4.6, 4.6, 12, [0.34, 0.42, 0.3]);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Q.TAU; ring(11.8, 12.4, 1.2, dk, 0.6 + Math.sin(a) * 2.8, Math.cos(a) * 2.8); }
        ring(12, 19, 2.3, dk, 0.6);
        ring(18.6, 20, 2.8, st, 0.6);
        mb.box(2, 0, -4.6, 3, 2.4, 5, dk);
        mb.box(-7, 0, -0.5, 5, 3, 4, [0.22, 0.26, 0.2]);
        mb.cyl([4, 0, 5.3], [10, 0, 5.3], 0.7, 0.7, 6, [0.4, 1, 0.3], { glow: 0.9 });
        break;
      }
      case 5: {
        mb.cyl([-8, 0, 1.5], [22, 0, 1.5], 3.1, 3.1, 12, [0.42, 0.36, 0.32]);
        mb.cyl([22, 0, 1.5], [25, 0, 1.5], 3.8, 3.4, 12, dk);
        mb.cyl([-10, 0, 1.5], [-8, 0, 1.5], 3.6, 3.1, 12, dk);
        mb.box(2, 0, -2.6, 16, 4.4, 3, [0.3, 0.27, 0.25]);
        mb.box(3, 0, -5.5, 3, 2.4, 5.4, dk, { ox: -0.6 });
        mb.box(8, 0, 5.4, 8, 1.6, 2.2, [0.65, 0.12, 0.08]);
        mb.box(12, 0, 7, 1.2, 1, 1.4, [1, 0.3, 0.2], { glow: 0.9 });
        for (const x of [-2, 8, 16]) ring(x, x + 1, 3.4, [0.55, 0.12, 0.08], 1.5);
        break;
      }
      case 6: {
        mb.box(2, 0, 0, 13, 6, 6, [0.5, 0.52, 0.58], { tx: 0.9 });
        mb.cyl([8, 0, 0.5], [14, 0, 0.5], 3, 3, 10, [0.3, 0.32, 0.4]);
        for (let x = 8.5; x < 14; x += 1.4) ring(x, x + 0.5, 3.4, [0.5, 0.65, 1], 0.5);
        mb.cyl([9, 0, 0.5], [13.5, 0, 0.5], 1.7, 1.7, 8, [0.6, 0.8, 1], { glow: 1 });
        for (let i = 0; i < 3; i++) { const a = i / 3 * Q.TAU + 0.5; mb.cyl([14, Math.cos(a) * 1.8, 0.5 + Math.sin(a) * 1.8], [22, Math.cos(a) * 2.4, 0.5 + Math.sin(a) * 2.4], 0.6, 0.35, 5, lt, { glow: 0.3 }); }
        mb.box(1, 0, -4.2, 3, 2.6, 5, dk, { ox: -0.6 });
        mb.box(-5, 0, 0, 4, 4, 4, [0.4, 0.42, 0.48]);
        break;
      }
      case 7: {
        mb.box(1, 0, 0, 15, 4.4, 5.2, [0.2, 0.24, 0.22], { tx: 0.95 });
        mb.box(20, 0, 2.1, 26, 1.2, 1.2, dk);
        mb.box(20, 0, -1.3, 26, 1.2, 1.2, dk);
        mb.box(19, 0, 0.4, 24, 0.9, 1.4, [0.3, 1, 0.4], { glow: 1 });
        for (let x = 9; x < 31; x += 4) mb.box(x, 0, 0.4, 0.8, 3, 5.6, [0.26, 0.3, 0.28]);
        mb.box(-7, 0, -0.5, 9, 3.4, 4.2, dk, { tx: 0.9 });
        mb.box(3, 0, -4.2, 3, 2.4, 5, dk, { ox: -0.6 });
        mb.box(4, 0, 3.6, 6, 1.6, 1.6, [0.3, 1, 0.4], { glow: 0.8 });
        break;
      }
      case 8: {
        mb.box(1, 0, 0, 12, 5.6, 5.6, [0.32, 0.3, 0.4], { tx: 0.92 });
        mb.sphere([7, 0, 0.8], 4.6, 4.2, 4.2, 10, 7, [0.5, 0.32, 0.95], { glow: 0.85 });
        ring(9, 19, 1.7, st, 0.8);
        for (let x = 12; x < 19; x += 1.6) ring(x, x + 0.6, 2.3, [0.45, 0.3, 0.8], 0.8);
        mb.box(1, 0, -4.3, 3, 2.6, 5, dk, { ox: -0.6 });
        mb.box(-5, 0, 0, 4, 3.6, 4, [0.28, 0.26, 0.34]);
        break;
      }
      case 9: {
        mb.box(3, 0, 0, 22, 9, 9, [0.3, 0.33, 0.3], { tx: 0.9, ty: 0.9 });
        mb.box(15, 0, 0, 6, 7, 7, [0.25, 1, 0.3], { glow: 1 });
        mb.box(19, 0, 0, 5, 10, 10, dk);
        for (const y of [-4.8, 4.8]) mb.box(4, y, 0, 16, 0.8, 6, [0.2, 0.7, 0.25], { glow: 0.5 });
        mb.box(-8, 0, -1, 7, 5, 6, dk);
        mb.box(4, 0, -6.5, 3, 2.8, 5, dk, { ox: -0.6 });
        mb.box(2, 0, 5.6, 10, 3, 2, [0.35, 0.38, 0.35]);
        break;
      }
      default:
        mb.box(0, 0, 0, 6, 3, 3, gm);
    }
    return mb.finish();
  }

  const wcache = {};
  Q.weaponMesh = w => wcache[w] || (wcache[w] = weaponMesh(w));

  function itemMesh(key) {
    const def = Q.ITEMS[key];
    const mb = new MB();
    if (def.type === 'weapon') return Q.weaponMesh(def.wp);
    if (def.type === 'ammo') {
      const col = Q.WEAPONS[def.wp].color;
      mb.box(0, 0, -6, 12, 12, 10, [0.32, 0.32, 0.3]);
      mb.box(0, 0, -6, 12.4, 12.4, 3, col, { glow: 0.3 });
      mb.box(0, 0, 0, 10, 10, 2, [0.2, 0.2, 0.2]);
      return mb.finish();
    }
    if (def.type === 'health') {
      const r = def.amount === 100 ? 10 : def.amount === 5 ? 5 : def.amount === 50 ? 9 : 8;
      const col = def.color;
      mb.box(0, 0, 0, r * 0.4, r * 0.4, r * 1.3, [1, 1, 1], { glow: 0.4 });
      mb.box(0, 0, 0, r * 0.4, r * 1.3, r * 0.4, [1, 1, 1], { glow: 0.4 });
      mb.sphere([0, 0, 0], r * 0.45, r * 0.45, r * 0.45, 8, 5, col, { glow: 0.8 });
      return mb.finish();
    }
    if (def.type === 'armor') {
      if (def.amount === 5) {
        const c = [0.55, 0.7, 0.3];
        mb.cyl([0, 0, -6], [0, 0, 6], 4, 0, 6, c, { glow: 0.3 });
        mb.cyl([0, 0, -6], [0, 0, -9], 4, 0, 6, scl(c, 0.7));
        return mb.finish();
      }
      const c = def.color;
      mb.box(0, 0, 0, 8, 18, 16, c, { tx: 0.8, ty: 0.75 });
      mb.box(0, 7, 8, 9, 8, 5, scl(c, 0.8), { tx: 0.7 });
      mb.box(0, -7, 8, 9, 8, 5, scl(c, 0.8), { tx: 0.7 });
      mb.box(4.5, 0, 2, 1, 8, 10, [0.2, 0.2, 0.2]);
      return mb.finish();
    }
    if (def.type === 'powerup') {
      const c = def.color;
      if (def.pw === 'quad') {
        mb.box(0, 0, 0, 10, 10, 10, c, { glow: 0.9 });
        mb.cyl([0, 0, -9], [0, 0, 9], 2.4, 2.4, 6, [0.8, 0.9, 1], { glow: 1 });
      } else if (def.pw === 'haste') {
        mb.cyl([0, 0, -8], [0, 0, 8], 6, 3, 6, c, { glow: 0.8 });
        mb.tri([0, 0, 0], [0, 13, 6], [0, 5, -5], c, 0.8); mb.tri([0, 0, 0], [0, 5, -5], [0, 13, 6], c, 0.8);
        mb.tri([0, 0, 0], [0, -13, 6], [0, -5, -5], c, 0.8); mb.tri([0, 0, 0], [0, -5, -5], [0, -13, 6], c, 0.8);
      } else if (def.pw === 'battlesuit') {
        mb.sphere([0, 0, 2], 8, 8, 7, 8, 5, c, { glow: 0.6 });
        mb.box(4, 0, 0, 4, 10, 3, [0.2, 0.2, 0.2]);
      } else if (def.pw === 'invis') {
        mb.sphere([0, 0, 0], 8, 8, 8, 10, 6, [0.8, 0.8, 0.9], { glow: 0.5 });
        mb.cyl([0, 0, -1], [0, 0, 1], 11, 11, 16, [0.5, 0.5, 0.6], { glow: 0.5 });
      } else {
        mb.sphere([0, 0, 0], 8, 8, 8, 10, 6, c, { glow: 0.8 });
        mb.box(0, 0, 0, 3, 3, 12, [1, 1, 1], { glow: 0.6 });
        mb.box(0, 0, 0, 3, 12, 3, [1, 1, 1], { glow: 0.6 });
      }
      return mb.finish();
    }
    if (def.type === 'holdable') {
      if (def.hold === 'medkit') {
        mb.box(0, 0, 0, 12, 14, 10, [0.9, 0.9, 0.9]);
        mb.box(6.1, 0, 0, 0.4, 8, 2.4, [0.9, 0.1, 0.1], { glow: 0.5 });
        mb.box(6.1, 0, 0, 0.4, 2.4, 8, [0.9, 0.1, 0.1], { glow: 0.5 });
      } else {
        mb.cyl([0, 0, -7], [0, 0, 7], 5, 5, 8, [0.4, 0.4, 0.45]);
        mb.sphere([0, 0, 0], 4, 4, 9, 8, 5, [0.3, 0.9, 1], { glow: 1 });
      }
      return mb.finish();
    }
    return mb.box(0, 0, 0, 8, 8, 8, [1, 0, 1]).finish();
  }
  const icache = {};
  Q.itemMesh = k => icache[k] || (icache[k] = itemMesh(k));

  Q.projectileMesh = function (kind) {
    const k = 'proj_' + kind;
    if (icache[k]) return icache[k];
    const mb = new MB();
    if (kind === 'rocket') {
      mb.cyl([-6, 0, 0], [6, 0, 0], 1.6, 1.6, 6, [0.5, 0.45, 0.4]);
      mb.cyl([6, 0, 0], [9, 0, 0], 1.6, 0, 6, [0.7, 0.2, 0.1]);
      mb.box(-5, 0, 0, 3, 5, 0.4, [0.3, 0.3, 0.3]).box(-5, 0, 0, 3, 0.4, 5, [0.3, 0.3, 0.3]);
    } else {
      mb.sphere([0, 0, 0], 3, 3, 3.6, 8, 5, [0.25, 0.32, 0.22]);
      mb.box(0, 0, 3, 1.2, 1.2, 2, [0.6, 0.6, 0.6]);
    }
    return (icache[k] = mb.finish());
  };

  Q.gibMeshes = function () {
    if (icache.gibs) return icache.gibs;
    const list = [];
    const f = [0.5, 0.06, 0.04], b = [0.8, 0.72, 0.6];
    list.push(new MB().sphere([0, 0, 0], 4.5, 4, 5, 8, 5, b).box(2.5, 0, -2, 3, 5, 3, b).finish());
    list.push(new MB().box(0, 0, 0, 7, 9, 6, f).finish());
    list.push(new MB().cyl([0, 0, -5], [0, 0, 5], 2, 1.6, 5, f).finish());
    list.push(new MB().box(0, 0, 0, 4, 4, 4, [0.6, 0.1, 0.08]).finish());
    list.push(new MB().cyl([0, 0, -4], [0, 0, 4], 1.4, 1.4, 5, b).finish());
    return (icache.gibs = list);
  };

  Q.emblemMesh = function () {
    if (icache.emblem) return icache.emblem;
    const mb = new MB();
    const red = [0.66, 0.07, 0.05], dark = [0.28, 0.02, 0.02], hi = [0.85, 0.25, 0.18];
    const N = 48, R0 = 38, R1 = 50, H = 4.5;
    const p = (r, a, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Q.TAU, a1 = (i + 1) / N * Q.TAU;
      mb.quad(p(R1, a0, -H), p(R1, a1, -H), p(R1, a1, H), p(R1, a0, H), red);
      mb.quad(p(R0, a0, H), p(R0, a1, H), p(R0, a1, -H), p(R0, a0, -H), dark);
      mb.quad(p(R1, a0, H), p(R1, a1, H), p(R0, a1, H), p(R0, a0, H), hi);
      mb.quad(p(R0, a0, -H), p(R0, a1, -H), p(R1, a1, -H), p(R1, a0, -H), dark);
    }
    const top = 26, bot = -104, w0 = 11, t0 = 4;
    const A = [0, -w0, top], B = [0, w0, top], Cc = [t0, 0, top], D = [-t0, 0, top], Tp = [0, 0, bot];
    mb.tri(A, Cc, Tp, red); mb.tri(Cc, B, Tp, hi); mb.tri(B, D, Tp, red); mb.tri(D, A, Tp, dark);
    mb.tri(A, B, Cc, hi); mb.tri(A, D, B, dark);
    for (const s of [-1, 1]) {
      const a = [0, s * w0, top], b = [0, s * 30, top + 18], c = [t0, s * 24, top + 12], d = [-t0, s * 24, top + 12];
      mb.tri(a, c, b, red); mb.tri(a, b, d, dark); mb.tri(a, d, c, hi);
    }
    return (icache.emblem = mb.finish());
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
