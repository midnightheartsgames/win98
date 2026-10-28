(function (K) {
  'use strict';

  const PARTS = Object.freeze(['head', 'chest', 'belly', 'lArm', 'rArm', 'lFore', 'rFore', 'lThigh', 'rThigh', 'lShin', 'rShin']);
  const PART_NAMES = Object.freeze(['голова', 'грудь', 'живот', 'левое плечо', 'правое плечо', 'левое предплечье', 'правое предплечье', 'левое бедро', 'правое бедро', 'левая голень', 'правая голень']);
  const PARENT = [1, 2, -1, 1, 1, 3, 4, 2, 2, 7, 8];
  const ORIGIN = [[0, 1.47, 0], [0, 1.12, 0], [0, 0.92, 0], [-0.185, 1.42, 0], [0.185, 1.42, 0], [-0.185, 1.12, 0], [0.185, 1.12, 0], [-0.095, 0.92, 0], [0.095, 0.92, 0], [-0.095, 0.5, 0], [0.095, 0.5, 0]];
  const SOLE = -0.5, HEEL = 0.045, TOE = -0.17;

  const PT = Object.freeze({ head: 0, neck: 1, lSh: 2, rSh: 3, lEl: 4, rEl: 5, lHand: 6, rHand: 7, waist: 8, lHip: 9, rHip: 10, lKnee: 11, rKnee: 12, lAnkle: 13, rAnkle: 14, nose: 15, lElF: 16, rElF: 17, lThumb: 18, rThumb: 19, lKneeF: 20, rKneeF: 21, lToe: 22, rToe: 23, sternum: 24, pubis: 25 });
  const POINTS = [
    [0, [0, 0.19, 0], 0.1, 2], [0, [0, 0, 0], 0.06, 2], [3, [0, 0, 0], 0.09, 2], [4, [0, 0, 0], 0.09, 2],
    [5, [0, 0, 0], 0.05, 1], [6, [0, 0, 0], 0.05, 1], [5, [0, -0.32, 0], 0.04, 0.8], [6, [0, -0.32, 0], 0.04, 0.8],
    [1, [0, 0, 0], 0.11, 4], [7, [0, 0, 0], 0.1, 3], [8, [0, 0, 0], 0.1, 3], [9, [0, 0, 0], 0.065, 1.5], [10, [0, 0, 0], 0.065, 1.5],
    [9, [0, -0.415, 0], 0.085, 1], [10, [0, -0.415, 0], 0.085, 1],
    [0, [0, 0.17, -0.11], 0.02, 0.5], [3, [0, -0.3, -0.06], 0.02, 0.4], [4, [0, -0.3, -0.06], 0.02, 0.4],
    [5, [0, -0.32, -0.06], 0.02, 0.4], [6, [0, -0.32, -0.06], 0.02, 0.4], [7, [0, -0.42, -0.07], 0.02, 0.5], [8, [0, -0.42, -0.07], 0.02, 0.5],
    [9, [0, -0.445, -0.14], 0.05, 0.5], [10, [0, -0.445, -0.14], 0.05, 0.5], [1, [0, 0.18, -0.11], 0.02, 1], [2, [0, 0.03, -0.1], 0.02, 1]
  ];
  const NP = POINTS.length;
  const GROUPS = [[0, 1, 15], [8, 1, 2, 3, 24], [9, 10, 8, 25], [2, 4, 16], [3, 5, 17], [4, 6, 18], [5, 7, 19], [9, 11, 20], [10, 12, 21], [11, 13, 22], [12, 14, 23]];
  const LIMBS = [[3, 2, 4, 16], [4, 3, 5, 17], [5, 4, 6, 18], [6, 5, 7, 19], [7, 9, 11, 20], [8, 10, 12, 21], [9, 11, 13, 22], [10, 12, 14, 23]];
  const CAPS = [
    [0, [0, 0.13, 0], [0, 0.25, 0], 0.095, 'skull'], [0, [0, -0.01, 0], [0, 0.1, 0], 0.05, 'neck'],
    [1, [-0.1, 0.24, 0], [0.1, 0.24, 0], 0.11, 'chest'], [1, [-0.07, 0.08, 0], [0.07, 0.08, 0], 0.1, 'chest'],
    [2, [-0.07, 0.02, 0], [0.07, 0.02, 0], 0.1, 'belly'], [2, [-0.05, 0.15, 0], [0.05, 0.15, 0], 0.095, 'belly'],
    [3, [0, -0.02, 0], [0, -0.28, 0], 0.05, 'arm'], [4, [0, -0.02, 0], [0, -0.28, 0], 0.05, 'arm'],
    [5, [0, -0.02, 0], [0, -0.36, 0], 0.04, 'fore'], [6, [0, -0.02, 0], [0, -0.36, 0], 0.04, 'fore'],
    [7, [0, -0.03, 0], [0, -0.4, 0], 0.075, 'thigh'], [8, [0, -0.03, 0], [0, -0.4, 0], 0.075, 'thigh'],
    [9, [0, -0.03, 0], [0, -0.4, 0], 0.055, 'shin'], [10, [0, -0.03, 0], [0, -0.4, 0], 0.055, 'shin'],
    [9, [0, -0.465, 0.02], [0, -0.465, -0.13], 0.035, 'foot'], [10, [0, -0.465, 0.02], [0, -0.465, -0.13], 0.035, 'foot']
  ];
  const ORIGIN_PT = [1, 8, -1, 2, 3, 4, 5, 9, 10, 11, 12];
  const OWNED = PARTS.map((n, p) => POINTS.map((q, i) => q[0] === p ? i : -1).filter(i => i >= 0));
  const FIGS = Object.freeze({ 'human.m': [1, 1], 'human.f': [0.95, 0.955], 'elf.m': [0.96, 1.045], 'elf.f': [0.92, 1.0] });
  const CAP = 160, PIECE_CAP = 120, ITEM_CAP = 120, CLEAR_RANGE = 150, G = 9.81, SUB = 1 / 120, ITER = 6, STATIC = 0.2 * SUB;

  const figKey = kit => K.Data.SIDES[kit.side].race + '.' + kit.fig;
  const figCache = new Map();

  const figure = kit => {
    const key = figKey(kit);
    if (figCache.has(key)) return figCache.get(key);
    const [sx, sy] = FIGS[key];
    const scale = p => [p[0] * sx, p[1] * sy, p[2] * sx];
    const origin = ORIGIN.map(scale);
    const offset = origin.map((o, i) => PARENT[i] < 0 ? o : [o[0] - origin[PARENT[i]][0], o[1] - origin[PARENT[i]][1], o[2] - origin[PARENT[i]][2]]);
    const local = POINTS.map(p => scale(p[1]));
    const rest = POINTS.map((p, i) => [origin[p[0]][0] + local[i][0], origin[p[0]][1] + local[i][1], origin[p[0]][2] + local[i][2]]);
    const dist = (a, b) => Math.hypot(rest[a][0] - rest[b][0], rest[a][1] - rest[b][1], rest[a][2] - rest[b][2]);
    const pairs = [], seen = new Set();
    for (const g of GROUPS) {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          const k = Math.min(g[i], g[j]) * 64 + Math.max(g[i], g[j]);
          if (seen.has(k)) continue;
          seen.add(k);
          pairs.push([g[i], g[j], dist(g[i], g[j])]);
        }
      }
    }
    const rel = (a, b, lo, hi) => [a, b, dist(a, b) + lo, dist(a, b) + hi];
    const min = (a, b, lo, hi) => [a, b, lo, hi === undefined ? 9 : dist(a, b) + hi];
    const ranges = [
      rel(0, 8, -0.12, 0.02), rel(15, 24, -0.08, 0.05), rel(0, 2, -0.08, 0.08), rel(0, 3, -0.08, 0.08),
      rel(1, 9, -0.14, 0.03), rel(1, 10, -0.14, 0.03), rel(24, 9, -0.12, 0.04), rel(24, 10, -0.12, 0.04), rel(2, 10, -0.07, 0.07), rel(3, 9, -0.07, 0.07),
      min(2, 6, 0.15, 0.002), min(3, 7, 0.15, 0.002), min(9, 13, 0.22, 0.002), min(10, 14, 0.22, 0.002),
      min(6, 16, 0, 0.004), min(7, 17, 0, 0.004), rel(13, 20, -0.004, 2), rel(14, 21, -0.004, 2), min(11, 25, 0.1, 0.045), min(12, 25, 0.1, 0.045),
      min(11, 12, 0.13), min(13, 14, 0.1)
    ];
    const inv = POINTS.map(p => 1 / p[3]);
    const radius = POINTS.map((p, i) => p[2] * (i === 0 || i === 15 ? sy : sx));
    const caps = CAPS.map(c => [c[0], scale(c[1]), scale(c[2]), c[3] * sx, c[4]]);
    const f = { key, sx, sy, origin, offset, local, rest, pairs, ranges, inv, radius, caps, sole: [SOLE * sy, HEEL * sx, TOE * sx] };
    figCache.set(key, f);
    return f;
  };

  const mul = (a, b) => {
    const o = new Array(9);
    for (let c = 0; c < 3; c++) {
      const x = b[c * 3], y = b[c * 3 + 1], z = b[c * 3 + 2];
      o[c * 3] = a[0] * x + a[3] * y + a[6] * z;
      o[c * 3 + 1] = a[1] * x + a[4] * y + a[7] * z;
      o[c * 3 + 2] = a[2] * x + a[5] * y + a[8] * z;
    }
    return o;
  };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; };
  const yawM = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const apply = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];

  const POSE_KEYS = Object.freeze(['pitch', 'roll', 'spine', 'twist', 'sway', 'neck', 'look', 'lSh', 'lOut', 'lEl', 'rSh', 'rOut', 'rEl', 'lHip', 'lHipOut', 'lKnee', 'rHip', 'rHipOut', 'rKnee', 'lift']);
  const restPose = () => {
    const p = {};
    for (const k of POSE_KEYS) p[k] = 0;
    p.plant = true;
    return p;
  };

  const writeFrame = (out, i, m, o) => {
    const b = i * 12;
    for (let k = 0; k < 9; k++) out[b + k] = m[k];
    out[b + 9] = o[0];
    out[b + 10] = o[1];
    out[b + 11] = o[2];
  };

  function fk(fig, pose, pos, yaw, out) {
    const frames = out || new Float32Array(132);
    const Y = yawM(yaw);
    const L = [
      mul(ry(pose.look), rx(-pose.neck)),
      mul(mul(ry(pose.twist), rx(-pose.spine)), rz(pose.sway)),
      mul(rx(-pose.pitch), rz(pose.roll)),
      mul(rx(pose.lSh), rz(-pose.lOut)), mul(rx(pose.rSh), rz(pose.rOut)),
      rx(pose.lEl), rx(pose.rEl),
      mul(rx(pose.lHip), rz(-pose.lHipOut)), mul(rx(pose.rHip), rz(pose.rHipOut)),
      rx(-pose.lKnee), rx(-pose.rKnee)
    ];
    const R = new Array(11), O = new Array(11);
    R[2] = mul(Y, L[2]);
    O[2] = [pos[0], pos[1] + fig.origin[2][1] + (pose.lift || 0), pos[2]];
    const order = [1, 0, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const i of order) {
      const p = PARENT[i];
      R[i] = mul(R[p], L[i]);
      const d = apply(R[p], fig.offset[i]);
      O[i] = [O[p][0] + d[0], O[p][1] + d[1], O[p][2] + d[2]];
    }
    const plant = pose.plant === true ? 1 : +pose.plant || 0;
    if (plant > 0) {
      let low = Infinity;
      for (const i of [9, 10]) {
        for (const z of [fig.sole[1], fig.sole[2]]) {
          const d = apply(R[i], [0, fig.sole[0], z]);
          low = Math.min(low, O[i][1] + d[1]);
        }
      }
      const shift = (pos[1] - low) * plant;
      for (const o of O) o[1] += shift;
    }
    for (let i = 0; i < 11; i++) writeFrame(frames, i, R[i], O[i]);
    return frames;
  }

  const point = (frames, i, l, out, o) => {
    const b = i * 12;
    out[o] = frames[b + 9] + frames[b] * l[0] + frames[b + 3] * l[1] + frames[b + 6] * l[2];
    out[o + 1] = frames[b + 10] + frames[b + 1] * l[0] + frames[b + 4] * l[1] + frames[b + 7] * l[2];
    out[o + 2] = frames[b + 11] + frames[b + 2] * l[0] + frames[b + 5] * l[1] + frames[b + 8] * l[2];
  };

  function particles(fig, frames, out) {
    const pts = out || new Float64Array(NP * 3);
    for (let i = 0; i < NP; i++) point(frames, POINTS[i][0], fig.local[i], pts, i * 3);
    return pts;
  }

  const sub3 = (p, a, b) => [p[a * 3] - p[b * 3], p[a * 3 + 1] - p[b * 3 + 1], p[a * 3 + 2] - p[b * 3 + 2]];
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const perp = (v, y) => { const d = dot(v, y); return norm([v[0] - y[0] * d, v[1] - y[1] * d, v[2] - y[2] * d]); };
  const at = (p, i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];

  const putAxes = (out, i, x, y, z, o) => writeFrame(out, i, [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]], o);

  function framesFrom(pts, out) {
    const frames = out || new Float32Array(132);
    {
      const y = norm(sub3(pts, PT.head, PT.neck)), z = perp(sub3(pts, PT.head, PT.nose), y);
      putAxes(frames, 0, cross(y, z), y, z, at(pts, PT.neck));
    }
    {
      const y = norm(sub3(pts, PT.neck, PT.waist)), x = perp(sub3(pts, PT.rSh, PT.lSh), y);
      putAxes(frames, 1, x, y, cross(x, y), at(pts, PT.waist));
    }
    {
      const mid = [(pts[27] + pts[30]) / 2, (pts[28] + pts[31]) / 2, (pts[29] + pts[32]) / 2];
      const y = norm([pts[24] - mid[0], pts[25] - mid[1], pts[26] - mid[2]]), x = perp(sub3(pts, PT.rHip, PT.lHip), y);
      putAxes(frames, 2, x, y, cross(x, y), mid);
    }
    for (const [part, a, b, f] of LIMBS) {
      const y = norm(sub3(pts, a, b)), z = perp(sub3(pts, b, f), y);
      putAxes(frames, part, cross(y, z), y, z, at(pts, a));
    }
    return frames;
  }

  const rnd01 = seed => K.rng(seed * 2654435761 >>> 0);

  function activeMask(kit, keep) {
    const cut = kit.cut || {}, on = new Uint8Array(NP);
    const present = p => keep ? keep.includes(p) : !cut[PARTS[p]];
    for (let p = 0; p < 11; p++) if (present(p)) for (const i of OWNED[p]) on[i] = 1;
    for (let p = 0; p < 11; p++) {
      if (present(p)) continue;
      const par = PARENT[p], o = ORIGIN_PT[p];
      if (par >= 0 && present(par) && o >= 0) on[o] = 1;
    }
    return on;
  }

  const runtime = b => {
    const key = (b.keep ? 'k' + b.keep.join('.') : 'c' + PARTS.map(p => (b.kit.cut || {})[p] ? 1 : 0).join('')) + figKey(b.kit);
    if (b.rt && b.rt.key === key) return b.rt;
    const fig = figure(b.kit), on = activeMask(b.kit, b.keep);
    b.rt = { key, fig, on, pairs: fig.pairs.filter(([p, q]) => on[p] && on[q]), ranges: fig.ranges.filter(([p, q]) => on[p] && on[q]) };
    return b.rt;
  };

  function fall(kit, frames, opts) {
    const o = opts || {}, fig = figure(kit), pts = particles(fig, frames), prev = new Float64Array(pts.length);
    const r = rnd01((o.id || 1) + 17);
    const vel = o.vel || [0, 0, 0];
    let push = o.push;
    if (!push) {
      const a = r() * Math.PI * 2;
      push = [Math.sin(a) * 1.6, 0, -Math.cos(a) * 1.6];
    }
    const fwd = [-frames[12 + 6], 0, -frames[12 + 8]];
    let feet = Infinity;
    for (let i = 0; i < NP; i++) feet = Math.min(feet, pts[i * 3 + 1]);
    for (let i = 0; i < NP; i++) {
      const h = pts[i * 3 + 1] - feet, w = K.clamp((h - 0.5) / 1.1, 0, 1.15);
      let vx = vel[0] + push[0] * w + (r() - 0.5) * 0.3, vy = vel[1] + push[1] * w + (r() - 0.5) * 0.2, vz = vel[2] + push[2] * w + (r() - 0.5) * 0.3;
      if (i === PT.lKnee || i === PT.rKnee || i === PT.lKneeF || i === PT.rKneeF) { vx += fwd[0] * 0.9; vz += fwd[2] * 0.9; vy -= 0.3; }
      if (i === PT.lHip || i === PT.rHip || i === PT.waist) vy -= 0.5;
      prev[i * 3] = pts[i * 3] - vx * SUB;
      prev[i * 3 + 1] = pts[i * 3 + 1] - vy * SUB;
      prev[i * 3 + 2] = pts[i * 3 + 2] - vz * SUB;
    }
    return { id: o.id || 0, kit, sack: o.sack || [], born: o.born || 0, t: 0, still: 0, frozen: false, pts, prev, frames: framesFrom(pts) };
  }

  function sever(who, parts, o) {
    const opts = o || {}, kit = who.kit, fig = figure(kit), pros = kit.pros || {};
    const pts = who.pts ? Float64Array.from(who.pts) : particles(fig, who.frames), prev = new Float64Array(pts.length);
    const iron = parts.every(p => pros[PARTS[p]]), vel = opts.vel || [0, 0, 0], dir = opts.dir || [0, 0, 0], r = rnd01((opts.id || 3) + 5);
    const kick = 1.4 + r() * 1.4;
    for (let i = 0; i < NP; i++) {
      const vx = vel[0] + dir[0] * kick + (r() - 0.5) * 0.6, vy = vel[1] + 1.2 + r() * 0.8, vz = vel[2] + dir[2] * kick + (r() - 0.5) * 0.6;
      prev[i * 3] = pts[i * 3] - vx * SUB;
      prev[i * 3 + 1] = pts[i * 3 + 1] - vy * SUB;
      prev[i * 3 + 2] = pts[i * 3 + 2] - vz * SUB;
    }
    const pk = copyKit(kit);
    pk.cut = {};
    PARTS.forEach((name, p) => { if (!parts.includes(p)) pk.cut[name] = iron ? 'healed' : 'fresh'; });
    pk.pros = {};
    for (const p of parts) if (pros[PARTS[p]]) pk.pros[PARTS[p]] = pros[PARTS[p]];
    if (!parts.includes(0)) { pk.head = null; pk.hair = 'bald'; pk.beard = false; }
    kit.cut = Object.assign({}, kit.cut);
    kit.pros = Object.assign({}, pros);
    for (const p of parts) {
      const name = PARTS[p];
      kit.cut[name] = pros[name] ? 'healed' : 'fresh';
      delete kit.pros[name];
    }
    const item = iron ? K.Data.PROS[(parts[0] === 5 || parts[0] === 6 ? 'fore.' : 'shin.') + pros[PARTS[parts[0]]]] : null;
    const root = parts.reduce((m, p) => parts.includes(PARENT[p]) ? m : p, parts[0]);
    return { id: opts.id || 0, kit: pk, keep: parts.slice(), anchor: ORIGIN_PT[root] >= 0 ? ORIGIN_PT[root] : 8, pts, prev, t: 0, still: 0, frozen: false, born: opts.born || 0, blood: !iron && kit.side !== 'straw', item, owner: item && opts.owner !== undefined ? opts.owner : null, frames: framesFrom(pts) };
  }

  const STICK = Object.freeze({ knife: 0.32, sickle: 0.5, sword: 0.85, axe: 0.6, mace: 0.55, spear: 2.4, bardiche: 1.7, shield: 0.6, crutch: 1.25, throwingAxe: 0.45, javelin: 1.4, bow: 1.3, crossbow: 0.7 });

  function drop(id, frame, o) {
    const opts = o || {}, L = STICK[id] || 0.6, vel = opts.vel || [0, 0, 0];
    const a = [frame[9], frame[10], frame[11]], y = [frame[3], frame[4], frame[5]];
    const start = id === 'spear' ? [a[0] - y[0] * 0.6, a[1] - y[1] * 0.6, a[2] - y[2] * 0.6] : id === 'shield' ? [a[0] - frame[0] * 0.3, a[1] - frame[1] * 0.3, a[2] - frame[2] * 0.3] : a;
    const axis = id === 'shield' ? [frame[0], frame[1], frame[2]] : y;
    const pts = new Float64Array([start[0], start[1], start[2], start[0] + axis[0] * L, start[1] + axis[1] * L, start[2] + axis[2] * L]);
    const prev = new Float64Array(6);
    for (let i = 0; i < 6; i++) prev[i] = pts[i] - (vel[i % 3] + (i % 3 === 1 ? 0.6 : 0)) * SUB;
    return { uid: opts.uid || 0, item: id, len: L, pts, prev, edge: [-frame[6], -frame[7], -frame[8]], t: 0, still: 0, frozen: false, born: opts.born || 0, anchor: 0 };
  }

  function simulateItem(it, dt, W) {
    if (it.frozen) return false;
    const n = Math.max(1, Math.round(dt / SUB)), p = it.pts, q = it.prev, T = W.terrain, r = 0.03;
    let fast = 0;
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < 6; i += 3) {
        const vx = (p[i] - q[i]) * 0.996, vy = (p[i + 1] - q[i + 1]) * 0.996, vz = (p[i + 2] - q[i + 2]) * 0.996;
        q[i] = p[i]; q[i + 1] = p[i + 1]; q[i + 2] = p[i + 2];
        p[i] += vx; p[i + 1] += vy - G * SUB * SUB; p[i + 2] += vz;
      }
      const hits = [false, false];
      for (let it2 = 0; it2 < 4; it2++) {
        solvePair(p, [1, 1], 0, 1, it.len, it.len);
        for (let k = 0; k < 2; k++) {
          const o = k * 3, h = W.groundAt ? W.groundAt(p[o], p[o + 2], p[o + 1] + 0.3) : T.heightAt(p[o], p[o + 2]);
          if (p[o + 1] < h + r) { p[o + 1] = h + r; hits[k] = true; }
        }
      }
      for (let k = 0; k < 2; k++) {
        const o = k * 3;
        let vx = p[o] - q[o], vy = p[o + 1] - q[o + 1], vz = p[o + 2] - q[o + 2];
        if (hits[k]) {
          if (vy < 0) vy = 0;
          if (Math.hypot(vx, vz) < STATIC) { vx = 0; vz = 0; } else { vx *= 0.45; vz *= 0.45; }
          q[o] = p[o] - vx; q[o + 1] = p[o + 1] - vy; q[o + 2] = p[o + 2] - vz;
        }
        fast = Math.max(fast, Math.hypot(vx, vy, vz) / SUB);
      }
    }
    it.t += dt;
    it.still = fast < 0.2 ? it.still + dt : 0;
    if ((it.t >= 0.8 && it.still >= 0.2) || it.t >= 4) { it.frozen = true; it.prev = null; return true; }
    return false;
  }

  function itemFrame(it, out) {
    const f = out || new Float32Array(12), p = it.pts;
    const y = norm([p[3] - p[0], p[4] - p[1], p[5] - p[2]]);
    if (it.item === 'shield') {
      const z = perp([0, -1, 0], y), x = cross(y, z);
      const c = [(p[0] + p[3]) / 2, (p[1] + p[4]) / 2, (p[2] + p[5]) / 2];
      f.set([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], c[0], c[1] + 0.02, c[2]]);
      return f;
    }
    let e = it.edge || [0, 1, 0];
    if (Math.abs(dot(e, y)) > 0.95) e = [0, 1, 0];
    const z = perp([-e[0], -e[1], -e[2]], y), x = cross(y, z);
    const g = it.item === 'spear' ? [p[0] + y[0] * 0.6, p[1] + y[1] * 0.6, p[2] + y[2] * 0.6] : [p[0], p[1], p[2]];
    f.set([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], g[0], g[1], g[2]]);
    return f;
  }

  const near = (b, W) => {
    const a = (b.anchor !== undefined ? b.anchor : 8) * 3, cx = b.pts[a], cz = b.pts[a + 2];
    if (b.near && Math.hypot(cx - b.near.x, cz - b.near.z) < 1.2) return b.near;
    const boxes = W.near ? W.near(cx, cz, 3.2) : [];
    const trunks = [];
    if (W.flora) {
      const F = W.flora, tr = F.trees;
      F.trunksNear(cx, cz, 3.2, i => trunks.push([tr.X[i], tr.Z[i], tr.RAD[i], tr.Y[i] + 8]));
      if (Math.hypot(cx - F.elder.x, cz - F.elder.z) < F.elder.r + 3.2) trunks.push([F.elder.x, F.elder.z, F.elder.r, Infinity]);
    }
    b.near = { x: cx, z: cz, boxes, trunks };
    return b.near;
  };

  const solvePair = (p, inv, a, b, lo, hi) => {
    const ax = a * 3, bx = b * 3;
    const dx = p[bx] - p[ax], dy = p[bx + 1] - p[ax + 1], dz = p[bx + 2] - p[ax + 2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < 1e-9) return;
    const target = d < lo ? lo : d > hi ? hi : d;
    if (target === d) return;
    const wa = inv[a], wb = inv[b], k = (d - target) / (d * (wa + wb));
    p[ax] += dx * k * wa; p[ax + 1] += dy * k * wa; p[ax + 2] += dz * k * wa;
    p[bx] -= dx * k * wb; p[bx + 1] -= dy * k * wb; p[bx + 2] -= dz * k * wb;
  };

  const collide = (b, fig, W, contact, on) => {
    const p = b.pts, T = W.terrain, nb = near(b, W);
    for (let i = 0; i < NP; i++) {
      if (!on[i]) { if (contact) contact[i * 4] = 0; continue; }
      const o = i * 3, r = fig.radius[i];
      let x = p[o], y = p[o + 1], z = p[o + 2];
      for (const t of nb.trunks) {
        if (y > t[3]) continue;
        const dx = x - t[0], dz = z - t[1], d = Math.hypot(dx, dz), m = t[2] + r;
        if (d < m && d > 1e-6) { x = t[0] + dx / d * m; z = t[1] + dz / d * m; }
      }
      let ny = 1, nx = 0, nz = 0, hit = false;
      for (const bx of nb.boxes) {
        if (y - r > bx.y1 || y + r < bx.y0) continue;
        const dx = x - bx.x, dz = z - bx.z, u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
        const ou = bx.hw + r - Math.abs(u), ov = bx.hd + r - Math.abs(v);
        if (ou <= 0 || ov <= 0) continue;
        const up = bx.y1 + r - y;
        if (up <= Math.min(ou, ov) || up < 0.45) {
          y = bx.y1 + r;
          hit = true; nx = 0; ny = 1; nz = 0;
        } else if (ou < ov) {
          const s = u >= 0 ? 1 : -1;
          x += bx.c * s * ou; z += bx.s * s * ou;
        } else {
          const s = v >= 0 ? 1 : -1;
          x += -bx.s * s * ov; z += bx.c * s * ov;
        }
      }
      const h = T.heightAt(x, z), n = T.normalAt(x, z), lift = r / Math.max(n[1], 0.5);
      if (y < h + lift) {
        y = h + lift;
        hit = true; nx = n[0]; ny = n[1]; nz = n[2];
      }
      p[o] = x; p[o + 1] = y; p[o + 2] = z;
      if (contact) {
        contact[i * 4] = hit ? 1 : 0;
        contact[i * 4 + 1] = nx; contact[i * 4 + 2] = ny; contact[i * 4 + 3] = nz;
      }
    }
  };

  const contactBuf = new Float64Array(NP * 4);

  function substep(b, rt, W) {
    const p = b.pts, q = b.prev, g = G * SUB * SUB, fig = rt.fig, on = rt.on;
    for (let i = 0; i < NP * 3; i += 3) {
      if (!on[i / 3]) continue;
      const vx = (p[i] - q[i]) * 0.998, vy = (p[i + 1] - q[i + 1]) * 0.998, vz = (p[i + 2] - q[i + 2]) * 0.998;
      q[i] = p[i]; q[i + 1] = p[i + 1]; q[i + 2] = p[i + 2];
      p[i] += vx; p[i + 1] += vy - g; p[i + 2] += vz;
    }
    for (let it = 0; it < ITER; it++) {
      for (const [a, c, len] of rt.pairs) solvePair(p, fig.inv, a, c, len, len);
      for (const [a, c, lo, hi] of rt.ranges) solvePair(p, fig.inv, a, c, lo, hi);
      collide(b, fig, W, it === ITER - 1 ? contactBuf : null, on);
    }
    let fast = 0;
    for (let i = 0; i < NP; i++) {
      if (!on[i]) continue;
      const o = i * 3;
      let vx = p[o] - q[o], vy = p[o + 1] - q[o + 1], vz = p[o + 2] - q[o + 2];
      if (contactBuf[i * 4]) {
        const nx = contactBuf[i * 4 + 1], ny = contactBuf[i * 4 + 2], nz = contactBuf[i * 4 + 3];
        const vn = vx * nx + vy * ny + vz * nz;
        let tx = vx - vn * nx, ty = vy - vn * ny, tz = vz - vn * nz;
        if (Math.hypot(tx, ty, tz) < STATIC) { tx = 0; ty = 0; tz = 0; } else { tx *= 0.5; ty *= 0.5; tz *= 0.5; }
        vx = tx; vy = ty; vz = tz;
        q[o] = p[o] - vx; q[o + 1] = p[o + 1] - vy; q[o + 2] = p[o + 2] - vz;
      }
      fast = Math.max(fast, Math.hypot(vx, vy, vz) / SUB);
    }
    return fast;
  }

  function simulate(b, dt, W) {
    if (b.frozen) return false;
    const rt = runtime(b), n = Math.max(1, Math.round(dt / SUB));
    let fast = 0;
    for (let s = 0; s < n; s++) fast = Math.max(fast, substep(b, rt, W));
    b.t += dt;
    b.still = fast < 0.25 ? b.still + dt : 0;
    framesFrom(b.pts, b.frames);
    if ((b.t >= 1.5 && b.still >= 0.25) || b.t >= 5) {
      b.frozen = true;
      b.prev = null;
      b.near = null;
      return true;
    }
    return false;
  }

  const settle = (b, W) => { while (!b.frozen) simulate(b, 1 / 60, W); return b; };

  function nudge(b, at, dir, speed, radius) {
    if (b.frozen) {
      b.frozen = false;
      b.prev = Float64Array.from(b.pts);
      b.t = 1;
      b.still = 0;
      b.near = null;
    } else if (b.t > 1) b.t = 1;
    const on = runtime(b).on, r = radius || 0.5;
    for (let i = 0; i < NP; i++) {
      if (!on[i]) continue;
      const o = i * 3, d = Math.hypot(b.pts[o] - at[0], b.pts[o + 1] - at[1], b.pts[o + 2] - at[2]);
      const k = Math.max(0, 1 - d / r) * speed * SUB;
      b.prev[o] -= dir[0] * k;
      b.prev[o + 1] -= dir[1] * k;
      b.prev[o + 2] -= dir[2] * k;
    }
    return b;
  }

  const anchorOf = b => { const a = (b.anchor !== undefined ? b.anchor : 8) * 3; return [b.pts[a], b.pts[a + 1], b.pts[a + 2]]; };

  const capsuleWorld = (frames, c) => {
    const a = [0, 0, 0], e = [0, 0, 0];
    point(frames, c[0], c[1], a, 0);
    point(frames, c[0], c[2], e, 0);
    return [a, e, c[3]];
  };

  const capsules = (kit, frames) => {
    if (kit.beast) return K.Beasts.capsules(kit, frames);
    const fig = figure(kit), cut = kit.cut || {};
    return fig.caps.filter(c => !cut[PARTS[c[0]]]).map(c => [c[0], ...capsuleWorld(frames, c), c[4]]);
  };

  const raySeg = (o, d, len, a, b, r) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
    const A = dot(d, d), B = dot(d, u), C = dot(u, u), Dd = dot(d, w), E = dot(u, w), den = A * C - B * B;
    let s = den > 1e-9 ? (B * E - C * Dd) / den : 0, t;
    s = K.clamp(s, 0, len);
    t = C > 1e-9 ? K.clamp((B * s + E) / C, 0, 1) : 0;
    s = K.clamp((B * t - Dd) / A, 0, len);
    const px = o[0] + d[0] * s - a[0] - u[0] * t, py = o[1] + d[1] * s - a[1] - u[1] * t, pz = o[2] + d[2] * s - a[2] - u[2] * t;
    return Math.hypot(px, py, pz) <= r ? s : -1;
  };

  function pick(list, eye, dir, reach) {
    let best = null, bd = reach;
    for (const b of list) {
      const fr = b.frames;
      if (Math.hypot(fr[33] - eye[0], fr[35] - eye[2]) > reach + 2) continue;
      for (const [, a, e, r] of capsules(b.kit, fr)) {
        const s = raySeg(eye, dir, bd, a, e, r);
        if (s >= 0 && s < bd) { bd = s; best = b; }
      }
    }
    return best ? { body: best, dist: bd } : null;
  }

  function trim(list, eye, visible, cap) {
    const removed = [], limit = cap || CAP;
    const far = b => { const a = (b.anchor !== undefined ? b.anchor : 8) * 3; return Math.hypot(b.pts[a] - eye[0], b.pts[a + 2] - eye[2]) > CLEAR_RANGE; };
    while (list.length > limit) {
      const i = list.findIndex(b => !b.carrier && far(b) && !visible(b));
      if (i < 0) break;
      removed.push(list.splice(i, 1)[0]);
    }
    return removed;
  }

  const pickOf = (rnd, list) => list[Math.floor(rnd() * list.length) % list.length];
  const weighted = (rnd, list) => {
    let x = rnd(), last = list[list.length - 1][0];
    for (const [v, w] of list) { if (x < w) return v; x -= w; }
    return last;
  };

  function kit(side, fig, rnd) {
    const S = K.Data.SIDES[side], f = fig || pickOf(rnd, S.figures);
    const heads = Array.isArray(S.heads) ? S.heads : S.heads[f];
    const k = {
      side: S.look || side, fig: f, face: Math.floor(rnd() * 4), skin: pickOf(rnd, S.skin).slice(), hair: pickOf(rnd, S.styles[f]), hairColor: pickOf(rnd, S.hair).slice(),
      beard: f === 'm' && rnd() < S.beard, head: weighted(rnd, heads), main: pickOf(rnd, S.main).slice(), accent: pickOf(rnd, S.accent).slice(), metal: pickOf(rnd, S.metal).slice(),
      armor: S.armor.filter(([, w]) => rnd() < w).map(([id]) => id), pros: {}, cut: {}, eyes: {}
    };
    for (const [part, kind, w] of S.pros) {
      if (rnd() >= w) continue;
      const key = (rnd() < 0.5 ? 'l' : 'r') + (part === 'fore' ? 'Fore' : 'Shin');
      if (!k.pros[key]) k.pros[key] = kind;
    }
    return k;
  }

  const HEROES = Object.freeze({
    'elf.m': { name: 'Эльф', kit: { side: 'elf', fig: 'm', face: 0, skin: [0.9, 0.76, 0.64], hair: 'long', hairColor: [0.55, 0.38, 0.22], beard: false, head: 'hood', main: [0.36, 0.27, 0.17], accent: [0.26, 0.36, 0.22], metal: [0.5, 0.5, 0.48], armor: [], pros: {}, cut: {}, eyes: {} } },
    'elf.f': { name: 'Эльфийка', kit: { side: 'elf', fig: 'f', face: 1, skin: [0.93, 0.8, 0.68], hair: 'braid', hairColor: [0.85, 0.75, 0.5], beard: false, head: null, main: [0.3, 0.32, 0.18], accent: [0.33, 0.38, 0.27], metal: [0.5, 0.5, 0.48], armor: [], pros: {}, cut: {}, eyes: {} } },
    'guard.m': { name: 'Стражник', kit: { side: 'guard', fig: 'm', face: 0, skin: [0.9, 0.75, 0.62], hair: 'crop', hairColor: [0.3, 0.22, 0.15], beard: false, head: 'crest', main: [0.92, 0.91, 0.86], accent: [0.68, 0.12, 0.1], metal: [0.72, 0.73, 0.74], armor: [], pros: {}, cut: {}, eyes: {} } },
    'guard.f': { name: 'Стражница', kit: { side: 'guard', fig: 'f', face: 0, skin: [0.95, 0.82, 0.7], hair: 'braid', hairColor: [0.5, 0.36, 0.22], beard: false, head: 'crest', main: [0.92, 0.91, 0.86], accent: [0.68, 0.12, 0.1], metal: [0.72, 0.73, 0.74], armor: [], pros: {}, cut: {}, eyes: {} } },
    villain: { name: 'Злой', kit: { side: 'villain', fig: 'm', face: 3, skin: [0.84, 0.7, 0.58], hair: 'short', hairColor: [0.16, 0.13, 0.1], beard: true, head: null, main: [0.17, 0.17, 0.19], accent: [0.22, 0.22, 0.24], metal: [0.33, 0.33, 0.34], armor: [], pros: { lFore: 'iron' }, cut: {}, eyes: {} } }
  });

  const HERO_GEAR = Object.freeze({ 'elf.m': ['sickle', false], 'elf.f': ['sickle', false], 'guard.m': ['sword', true], 'guard.f': ['sword', true], villain: ['axe', false] });

  const copyKit = k => JSON.parse(JSON.stringify(k));

  const sackFor = (side, rnd) => {
    const out = [];
    for (const [id, lo, hi] of K.Data.SACKS[side]) {
      const n = lo + Math.floor(rnd() * (hi - lo + 1));
      if (n > 0) out.push({ id, n });
    }
    return out;
  };

  const title = k => k.hero ? HEROES[k.hero].name : K.Data.SIDES[k.side].name[k.fig];

  const nearBody = (b, list, r) => (list || []).filter(x => {
    const a = (x.anchor || 0) * 3;
    return Math.hypot(x.pts[a] - b.pts[24], x.pts[a + 1] - b.pts[25], x.pts[a + 2] - b.pts[26]) < r;
  });

  function belongings(b, S) {
    const k = b.kit, out = [];
    if (S) {
      for (const it of nearBody(b, S.items, 1.8)) out.push({ key: 'item:' + it.uid, id: it.item, n: 1, group: it.item === 'shield' ? 'Броня' : 'Оружие', thing: it });
      for (const pc of nearBody(b, S.parts.filter(x => x.item), 1.8)) out.push({ key: 'piece:' + pc.id, id: pc.item, n: 1, group: 'Протезы', thing: pc });
      if (K.Missile) for (const s of K.Missile.inBody(S, b)) out.push({ key: 'stuck:' + s.id, id: K.Data.MISSILES[s.kind].ammo, n: 1, group: 'Стрелы и метательное', stuck: s });
    }
    if (k.head && K.Data.HELMS[k.head]) out.push({ key: 'head', id: K.Data.HELMS[k.head], n: 1, group: 'Броня' });
    for (const a of k.armor) out.push({ key: 'armor:' + a, id: a, n: 1, group: 'Броня' });
    for (const [part, kind] of Object.entries(k.pros)) out.push({ key: 'pros:' + part, id: K.Data.PROS[(part.endsWith('Fore') ? 'fore.' : 'shin.') + kind], n: 1, group: 'Протезы' });
    for (const s of b.sack) out.push({ key: 'sack:' + s.id, id: s.id, n: s.n, group: 'Сума' });
    return out;
  }

  const stash = (bag, id, n) => {
    const have = bag.find(s => s.id === id);
    if (have) have.n += n; else bag.push({ id, n });
  };

  function take(b, key, bag, S) {
    const item = belongings(b, S).find(x => x.key === key);
    if (!item) return null;
    const k = b.kit;
    if (item.stuck) {
      S.stuck.splice(S.stuck.indexOf(item.stuck), 1);
      stash(bag, item.id, 1);
      return item;
    }
    if (item.thing) {
      const list = key.startsWith('item:') ? S.items : S.parts;
      list.splice(list.indexOf(item.thing), 1);
    } else if (key === 'head') k.head = null;
    else if (key.startsWith('armor:')) k.armor = k.armor.filter(a => a !== item.id);
    else if (key.startsWith('pros:')) { const part = key.slice(5); delete k.pros[part]; k.cut[part] = 'healed'; }
    else b.sack = b.sack.filter(s => s.id !== item.id);
    stash(bag, item.id, item.n);
    b.version = (b.version || 0) + 1;
    return item;
  }

  const EXP_SHARE = [['recruit', 0.35], ['soldier', 0.45], ['veteran', 0.2]];

  function arm(side, id) {
    const lo = K.Data.LOADOUTS[side], r = K.rng(id * 977 + 13);
    if (!lo) return K.Combat.fighter({});
    const [weapon, shieldP] = weighted(r, lo.map(([w, s, p]) => [[w, s], p]));
    const hands = weapon ? K.Data.WEAPONS[weapon].hands : 1;
    return K.Combat.fighter({ weapon, shield: !!weapon && (hands === 1 || weapon === 'spear') && r() < shieldP, exp: weighted(r, EXP_SHARE) });
  }

  const rangedFor = (side, id) => {
    const r = K.rng(id * 313 + 5), out = [];
    for (const [launcher, share, ammo, lo, hi] of (K.Data.RANGED && K.Data.RANGED[side]) || []) {
      if (r() >= share) continue;
      const item = K.Data.LAUNCHERS[launcher].item;
      if (item !== ammo) out.push({ id: item, n: 1 });
      out.push({ id: ammo, n: lo + Math.floor(r() * (hi - lo + 1)) });
    }
    return out;
  };

  function person(id, k, x, z, yaw, W, act) {
    return { id, kit: k, mv: K.Move.body(W, x, z, yaw), act: act || { kind: 'stand', post: [x, z], face: yaw }, leg: 0, wait: 0, sack: sackFor(k.side, K.rng(id * 31 + 7)).concat(rangedFor(k.side, id)), fight: arm(k.side, id) };
  }

  const nameFor = (side, fig, id) => {
    const lists = K.Data.NAMES[side], list = lists ? lists[fig] || lists.m : null;
    return list ? list[(id * 7 + 3) % list.length] : null;
  };

  function member(id, side, x, z, yaw, W, act, fig) {
    const k = kit(side, fig || null, K.rng(id * 131 + 17));
    const p = person(id, k, x, z, yaw, W, act);
    p.team = side;
    p.name = nameFor(side, k.fig, id);
    p.debt = 0;
    return p;
  }

  function garrison(W, from) {
    const out = [];
    let id = from;
    for (const P of K.Places.POSTS) out.push(member(id++, P.side, P.at[0], P.at[1], P.face, W, { kind: 'stand', post: P.at.slice(), face: P.face }));
    for (const R of K.Places.PATROLS) {
      const [a, b] = R.route, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (a[0] - b[0]) / d, uz = (a[1] - b[1]) / d, yaw = Math.atan2(-ux, uz);
      for (let i = 0; i < R.n; i++) {
        const p = member(id++, R.side, a[0] + ux * i * 1.8, a[1] + uz * i * 1.8, yaw, W, { kind: 'walk', route: R.route.map(q => q.slice()) });
        p.leg = 1;
        out.push(p);
      }
    }
    return out;
  }

  function watchman(id, x, z, yaw, W, act) {
    const k = kit('watch', null, K.rng(id * 131 + 17));
    const p = person(id, k, x, z, yaw, W, act);
    p.fight = arm('watch', id);
    p.sack = sackFor('watch', K.rng(id * 31 + 7));
    p.team = 'watch';
    p.role = 'watch';
    p.name = nameFor('watch', k.fig, id);
    p.debt = 0;
    p.home = [x, z];
    return p;
  }

  function townsfolk(W, from) {
    const T = W.terrain, P = K.Places, o = P.town(T), out = [], Wa = P.WATCH;
    let id = from;
    for (const d of P.TOWNSFOLK) {
      const spot = Array.isArray(d.at) ? { at: d.at, face: 0 } : o.keepers[d.at];
      const act = d.route ? { kind: 'walk', route: d.route.map(q => q.slice()) } : { kind: 'stand', post: spot.at.slice(), face: spot.face };
      const p = member(id++, 'town', spot.at[0], spot.at[1], spot.face, W, act, d.fig);
      Object.assign(p.kit, d.look);
      p.kit.pros = Object.assign({}, d.look.pros || {});
      p.kit.cut = Object.assign({}, d.look.cut || {});
      p.name = d.name;
      p.role = d.role;
      if (d.shop) p.shop = d.shop;
      p.home = spot.at.slice();
      p.fight = K.Combat.fighter({});
      out.push(p);
    }
    for (const [x, z, face] of Wa.posts) out.push(watchman(id++, x, z, face, W, { kind: 'stand', post: [x, z], face }));
    const keep = o.keepers[Wa.house];
    out.push(watchman(id++, keep.at[0], keep.at[1], keep.face, W, { kind: 'stand', post: keep.at.slice(), face: keep.face }));
    for (let i = 0; i < Wa.walkers; i++) {
      const route = Wa.patrol.slice(i).concat(Wa.patrol.slice(0, i)).map(q => q.slice());
      const p = watchman(id++, route[0][0] + i * 0.3, route[0][1], 0, W, { kind: 'walk', route });
      p.leg = 1;
      out.push(p);
    }
    return out;
  }

  const nameOf = q => q && (q.name || (q.who && q.who.name)) || (q ? title(q.kit) : '');

  function strawman(id, x, z, yaw, W) {
    const k = { side: 'straw', fig: 'm', face: 0, skin: [0.78, 0.74, 0.6], hair: 'bald', hairColor: [0.7, 0.66, 0.5], beard: false, head: null, main: [0.55, 0.5, 0.42], accent: [0.4, 0.32, 0.22], metal: [0.5, 0.5, 0.48], armor: [], pros: {}, cut: {}, eyes: {} };
    const p = person(id, k, x, z, yaw, W, { kind: 'straw', post: [x, z], face: yaw });
    p.sack = [];
    p.fight = K.Combat.fighter({});
    p.fight.life = Infinity;
    p.regrow = {};
    return p;
  }

  const turn = (from, to, max) => {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return from + K.clamp(d, -max, max);
  };

  function drive(p, dt) {
    const a = p.act, mv = p.mv, inp = { fwd: 0, side: 0, yaw: mv.yaw };
    if (a.kind === 'straw') return inp;
    const goTo = (x, z, reach) => {
      const dx = x - mv.pos[0], dz = z - mv.pos[2], d = Math.hypot(dx, dz);
      if (d < reach) return true;
      inp.yaw = turn(mv.yaw, Math.atan2(dx, -dz), 5 * dt);
      inp.fwd = 1;
      return false;
    };
    if (a.kind === 'stand' || a.kind === 'hop') {
      mv.walk = true;
      if (goTo(a.post[0], a.post[1], 0.4)) {
        inp.yaw = turn(mv.yaw, a.face, 4 * dt);
        if (a.kind === 'hop') {
          p.wait -= dt;
          if (p.wait <= 0 && mv.onGround) { inp.jump = true; p.wait = 2.6; }
        }
      }
      return inp;
    }
    mv.walk = a.kind === 'walk';
    if (mv.crouch !== (a.kind === 'crouch')) inp.crouch = true;
    const r = a.route, target = r[p.leg % r.length];
    if (goTo(target[0], target[1], 1)) {
      p.leg = (p.leg + 1) % r.length;
      if (a.kind === 'leap' && mv.onGround) inp.jump = true;
    }
    return inp;
  }

  function separate(list) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i].pos, b = list[j].pos, dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz), m = 0.62;
        if (d >= m || d < 1e-6 || Math.abs(a[1] - b[1]) > 1.5) continue;
        const k = (m - d) / d / 2;
        a[0] -= dx * k; a[2] -= dz * k;
        b[0] += dx * k; b[2] += dz * k;
      }
    }
  }

  function drill(W, seed) {
    const P = K.Places.DRILL, rnd = K.rng(seed || 7), out = [];
    let id = 1;
    const fx = Math.sin(P.face), fz = -Math.cos(P.face), sx = Math.cos(P.face), sz = Math.sin(P.face);
    const local = (s, back) => [P.at[0] + sx * s - fx * back, P.at[1] + sz * s - fz * back];
    P.rows.forEach((side, row) => {
      const figs = K.Data.SIDES[side].figures;
      for (let c = 0; c < 5; c++) {
        const [x, z] = local((c - 2) * 1.35, row * 1.9);
        out.push(person(id++, kit(side, figs[c % figs.length], rnd), x, z, P.face, W));
      }
    });
    const loop = P.loop.map(([s, b]) => local(s, b));
    P.walkers.forEach(([side, fig, kind], i) => {
      const start = loop[i % loop.length];
      const p = person(id++, kit(side, fig, rnd), start[0], start[1], P.face, W, { kind, route: loop });
      p.leg = (i + 1) % loop.length;
      out.push(p);
    });
    for (const [x, z, yaw] of P.straw) out.push(strawman(id++, x, z, yaw, W));
    for (const [side, fig, s, b] of P.hoppers) {
      const [x, z] = local(s, b);
      out.push(person(id++, kit(side, fig, rnd), x, z, P.face, W, { kind: 'hop', post: [x, z], face: P.face }));
    }
    const T = W.terrain;
    P.slope.forEach(([x, z], i) => {
      const n = T.normalAt(x, z), face = Math.atan2(n[0], -n[2]);
      const side = P.rows[i % P.rows.length], figs = K.Data.SIDES[side].figures;
      out.push(person(id++, kit(side, figs[i % figs.length], rnd), x, z, face, W, { kind: 'stand', post: [x, z], face }));
    });
    return out;
  }

  K.Body = {
    PARTS, PART_NAMES, PARENT, POSE_KEYS, HEROES, HERO_GEAR, CAP, PIECE_CAP, ITEM_CAP, STICK,
    figure, fk, particles, framesFrom, restPose, fall, sever, drop, simulate, simulateItem, itemFrame, settle, nudge, anchorOf, capsules, pick, trim, kit, copyKit, sackFor, title,
    belongings, take, person, member, garrison, watchman, townsfolk, nameFor, nameOf, strawman, arm, drive, separate, drill, activeMask
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
