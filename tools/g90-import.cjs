'use strict';
const fs = require('fs');
const path = require('path');

const ROAD_CLS = { motorway: 0, trunk: 0, primary: 0, primary_link: 0, trunk_link: 0, motorway_link: 0, secondary: 1, secondary_link: 1, tertiary: 2, tertiary_link: 2, unclassified: 3, residential: 3, living_street: 3, service: 4 };
const SIDE_W = [4.6, 4.2, 3.6, 2.8];
const AREA_KIND = { water: 'w', park: 'p', grass: 'g', wood: 'f', plaza: 'q', parking: 'k', dirt: 'c', rail: 'r', pitch: 's', sand: 'b', yard: 'y' };

function args() {
  const a = process.argv.slice(2);
  const flags = new Set(a.filter(x => x.startsWith('--')));
  const pos = a.filter(x => !x.startsWith('--'));
  return { cfgFile: pos[0] || path.join(__dirname, 'g90-center.json'), osmFile: pos[1], outFile: pos[2], report: flags.has('--report') };
}

function loadOsm(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nodes = new Map(), ways = new Map(), rels = [];
  for (const e of d.elements) {
    if (e.type === 'node') { if (!nodes.has(e.id) || e.tags) nodes.set(e.id, e); }
    else if (e.type === 'way') { if (!ways.has(e.id) || e.tags) ways.set(e.id, e); }
    else if (e.type === 'relation') rels.push(e);
  }
  return { nodes, ways, rels };
}

function makeFrame(cfg) {
  const { lat, lon, rot } = cfg.frame;
  const KX = 111320 * Math.cos(lat * Math.PI / 180), KY = 110540;
  const r = rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return {
    m(la, lo) { const x = (lo - lon) * KX, y = -(la - lat) * KY; return [x * c - y * s, x * s + y * c]; },
    geo(x, y) { const ex = x * c + y * s, ey = -x * s + y * c; return [lat - ey / KY, lon + ex / KX]; }
  };
}

const area2 = r => { let a = 0; for (let i = 0, n = r.length; i < n; i++) { const p = r[i], q = r[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
const centroid = r => { let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length]; };
const bboxOf = pts => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; };

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function offsetPoly(poly, d) {
  const n = poly.length;
  const sgn = area2(poly) > 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n], b = poly[i], c = poly[(i + 1) % n];
    const e1 = norm([b[0] - a[0], b[1] - a[1]]), e2 = norm([c[0] - b[0], c[1] - b[1]]);
    const n1 = [e1[1] * sgn, -e1[0] * sgn], n2 = [e2[1] * sgn, -e2[0] * sgn];
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml; my /= ml;
    const cosh = mx * n1[0] + my * n1[1];
    const k = d / Math.max(0.35, cosh);
    out.push([b[0] + mx * k, b[1] + my * k]);
  }
  return out;
}
function norm(v) { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

function clipRing(ring, x0, y0, x1, y1) {
  let out = ring;
  const edges = [[p => p[0] >= x0, (a, b) => { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + (b[1] - a[1]) * t]; }],
    [p => p[0] <= x1, (a, b) => { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + (b[1] - a[1]) * t]; }],
    [p => p[1] >= y0, (a, b) => { const t = (y0 - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y0]; }],
    [p => p[1] <= y1, (a, b) => { const t = (y1 - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y1]; }]];
  for (const [inside, cut] of edges) {
    const src = out; out = [];
    if (!src.length) break;
    for (let i = 0; i < src.length; i++) {
      const cur = src[i], prev = src[(i - 1 + src.length) % src.length];
      const ci = inside(cur), pi = inside(prev);
      if (ci) { if (!pi) out.push(cut(prev, cur)); out.push(cur); }
      else if (pi) out.push(cut(prev, cur));
    }
  }
  return out;
}

function clipLine(pts, x0, y0, x1, y1) {
  const parts = [];
  let cur = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    let t0 = 0, t1 = 1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    let ok = true;
    for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
      if (p === 0) { if (q < 0) { ok = false; break; } continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; }
      else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
    }
    if (!ok) { if (cur) { parts.push(cur); cur = null; } continue; }
    const A = t0 > 0 ? [a[0] + dx * t0, a[1] + dy * t0] : a, B = t1 < 1 ? [a[0] + dx * t1, a[1] + dy * t1] : b;
    if (!cur) cur = [A];
    cur.push(B);
    if (t1 < 1) { parts.push(cur); cur = null; }
  }
  if (cur) parts.push(cur);
  return parts.filter(p => p.length >= 2);
}

function simplify(pts, tol, closed) {
  if (pts.length <= 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const a = pts[i], b = pts[j];
    let best = -1, bd = tol;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], a, b);
      if (d > bd) { bd = d; best = k; }
    }
    if (best >= 0) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  const out = pts.filter((p, k) => keep[k]);
  if (closed && out.length < 4) return pts;
  return out;
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}

function segX(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (t <= 1e-9 || t >= 1 - 1e-9 || u < 0 || u > 1) return null;
  return t;
}

function splitByPoly(pts, poly) {
  const out = [];
  let cur = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const ts = [];
    for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) { const t = segX(a, b, poly[j], poly[k]); if (t != null) ts.push(t); }
    ts.sort((x, y) => x - y);
    for (const t of ts) { const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; cur.push(p); out.push(cur); cur = [p]; }
    cur.push(b);
  }
  out.push(cur);
  return out.filter(p => p.length >= 2).map(p => {
    const mid = pointAlong(p, 0.5);
    return { pts: p, inside: inPoly(mid[0], mid[1], poly) };
  });
}
function lineLen(p) { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; }
function pointAlong(p, f) {
  const L = lineLen(p) * f;
  let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc + d >= L) { const t = d ? (L - acc) / d : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; }
    acc += d;
  }
  return p[p.length - 1];
}

function assembleRings(lists) {
  const segs = lists.map(n => n.slice());
  const rings = [];
  while (segs.length) {
    let ring = segs.shift();
    let guard = 0;
    while (ring[0] !== ring[ring.length - 1] && guard++ < 5000) {
      const end = ring[ring.length - 1];
      const k = segs.findIndex(s => s[0] === end || s[s.length - 1] === end);
      if (k < 0) break;
      let s = segs.splice(k, 1)[0];
      if (s[0] !== end) s = s.slice().reverse();
      ring = ring.concat(s.slice(1));
    }
    if (ring.length >= 4 && ring[0] === ring[ring.length - 1]) rings.push(ring);
  }
  return rings;
}

const b36 = n => (n < 0 ? '-' : '') + Math.abs(n).toString(36);
function encPts(pts) {
  const out = [];
  let px = 0, py = 0;
  for (let i = 0; i < pts.length; i++) {
    const x = Math.round(pts[i][0]), y = Math.round(pts[i][1]);
    if (i && x === px && y === py) continue;
    out.push(i ? b36(x - px) + ',' + b36(y - py) : b36(x) + ',' + b36(y));
    px = x; py = y;
  }
  return out.join(',');
}

function yearOf(t) { const m = /(\d{4})/.exec(t.start_date || t['building:start_date'] || ''); return m ? +m[1] : 0; }

const COLOR_NAMES = { white: '#ece8de', beige: '#dccaa0', yellow: '#e2c878', grey: '#a8a8a4', gray: '#a8a8a4', red: '#b45a44', brown: '#8a5a3c', pink: '#dca8a0', green: '#9ab894', blue: '#9ab0c8', orange: '#e0a060', lightgrey: '#c4c4c0', darkgrey: '#6a6a68', black: '#3a3a3a', maroon: '#7a3a30', cream: '#efe4c4', silver: '#c0c0c0', tan: '#d2b48c', purple: '#9a8ab4' };
function colorOf(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s)) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  return COLOR_NAMES[s] || null;
}

function levelsOf(t, areaM2) {
  const lv = parseFloat(t['building:levels']);
  const rl = parseFloat(t['roof:levels']) || 0;
  if (lv > 0) return Math.max(1, Math.round(lv + rl * 0.5));
  const h = parseFloat(t.height);
  if (h > 0) return Math.max(1, Math.round(h / 3.2));
  const b = t.building;
  if (b === 'garage' || b === 'garages' || b === 'shed' || b === 'kiosk' || b === 'roof' || b === 'hut' || b === 'service' || b === 'greenhouse' || b === 'toilets' || b === 'carport' || b === 'transformer_tower') return 1;
  if (b === 'house' || b === 'detached' || b === 'semidetached_house') return areaM2 > 160 ? 2 : 1;
  if (b === 'apartments') return areaM2 > 900 ? 5 : 4;
  if (b === 'church' || b === 'cathedral' || b === 'chapel') return 3;
  if (b === 'industrial' || b === 'warehouse' || b === 'hangar') return 2;
  if (b === 'school' || b === 'kindergarten') return b === 'school' ? 3 : 2;
  if (areaM2 < 60) return 1;
  if (areaM2 < 250) return 2;
  return 3;
}

function styleOf(t, lv, areaM2, year) {
  const b = t.building, nm = (t.name || '').toLowerCase();
  const mat = t['building:material'] || '';
  if (b === 'church' || b === 'cathedral' || b === 'chapel' || t.amenity === 'place_of_worship') return 'r';
  if (b === 'garage' || b === 'garages' || b === 'shed' || b === 'kiosk' || b === 'roof' || b === 'hut' || b === 'carport' || b === 'greenhouse' || b === 'toilets' || b === 'transformer_tower' || (b === 'service' && lv <= 2)) return 'g';
  if (b === 'industrial' || b === 'warehouse' || b === 'hangar' || b === 'manufacture' || b === 'gasometer' || b === 'service' || b === 'transportation') return 'i';
  if (mat === 'wood') return 'w';
  if (year && year < 1918) return lv <= 2 && (b === 'house' || b === 'detached') ? 'w' : 'o';
  if (year && year < 1938) return 'c';
  if (year && year < 1958) return 's';
  if (year && year < 1971) return lv >= 9 ? 'p' : 'k';
  if (year && year <= 1991) return lv >= 7 ? 'p' : 'q';
  const shape = t['roof:shape'] || '';
  const pub = /^(office|government|university|college|school|hospital|commercial|civic|public|hotel|retail|train_station|theatre|sports_centre|stadium|kindergarten|dormitory|fire_station)$/.test(b);
  if (lv <= 2 && (b === 'house' || b === 'detached' || b === 'semidetached_house')) return 'w';
  if (lv <= 3 && (shape === 'hipped' || shape === 'gabled' || shape === 'pyramidal')) return 'o';
  if (lv <= 2 && areaM2 < 700) return 'o';
  if (lv >= 9) return pub ? 'q' : 'p';
  if ((shape === 'hipped' || shape === 'gabled') && lv >= 4) return 's';
  if (pub) return lv <= 3 ? 'o' : 'q';
  if (lv === 5 && b === 'apartments') return 'k';
  if (lv >= 4 && lv <= 8) return b === 'apartments' && areaM2 < 1300 ? 'k' : 's';
  return 'o';
}

function roofOf(t, style, lv) {
  const s = t['roof:shape'] || '';
  if (s === 'hipped' || s === 'half-hipped') return 'h';
  if (s === 'gabled' || s === 'saltbox' || s === 'gambrel' || s === 'mansard') return 'g';
  if (s === 'pyramidal') return 'p';
  if (s === 'dome' || s === 'onion') return 'd';
  if (s === 'skillion') return 'f';
  if (s === 'flat') return 'f';
  if (style === 'w') return 'g';
  if (style === 'o') return lv <= 3 ? 'h' : 'f';
  if (style === 's') return 'h';
  if (style === 'r') return 'h';
  return 'f';
}

function healDeadEnds(roadPx, maxM, M, play) {
  const key = p => Math.round(p[0]) + ',' + Math.round(p[1]);
  const count = new Map();
  for (const r of roadPx) for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) count.set(key(e), (count.get(key(e)) || 0) + 1);
  let healed = 0;
  const maxD = maxM * M;
  for (const r of roadPx) {
    if (!r.inside) continue;
    for (const end of [0, 1]) {
      const pts = r.pts;
      const e = end ? pts[pts.length - 1] : pts[0];
      if (count.get(key(e)) !== 1) continue;
      const prev = end ? pts[pts.length - 2] : pts[1];
      const dx = e[0] - prev[0], dy = e[1] - prev[1], dl = Math.hypot(dx, dy) || 1;
      let best = null;
      for (const o of roadPx) {
        if (o === r || !o.inside) continue;
        for (let i = 0; i < o.pts.length - 1; i++) {
          const a = o.pts[i], b = o.pts[i + 1];
          const ex = b[0] - a[0], ey = b[1] - a[1], l2 = ex * ex + ey * ey;
          if (!l2) continue;
          const t = Math.max(0, Math.min(1, ((e[0] - a[0]) * ex + (e[1] - a[1]) * ey) / l2));
          const q = [a[0] + ex * t, a[1] + ey * t];
          const d = Math.hypot(q[0] - e[0], q[1] - e[1]);
          if (d > maxD || d < 0.5) continue;
          const fwd = ((q[0] - e[0]) * dx + (q[1] - e[1]) * dy) / (d * dl);
          if (fwd < 0.2) continue;
          if (!best || d < best.d) best = { o, i, t, q, d };
        }
      }
      if (!best) continue;
      const { o, i, q } = best;
      const near0 = Math.hypot(q[0] - o.pts[0][0], q[1] - o.pts[0][1]) < 2 * M, near1 = Math.hypot(q[0] - o.pts[o.pts.length - 1][0], q[1] - o.pts[o.pts.length - 1][1]) < 2 * M;
      let target = q;
      if (near0) target = o.pts[0];
      else if (near1) target = o.pts[o.pts.length - 1];
      else {
        const a = o.pts.slice(0, i + 1).concat([q]), b = [q].concat(o.pts.slice(i + 1));
        o.pts = a;
        roadPx.push({ s: o.s, pts: b, inside: o.inside });
        count.set(key(q), 2);
      }
      if (end) r.pts.push(target.slice()); else r.pts.unshift(target.slice());
      count.set(key(e), 0);
      count.set(key(target), (count.get(key(target)) || 0) + 1);
      healed++;
    }
  }
  return healed;
}

function privateSector(o) {
  const { M, removed, kept, roads, blockAreas, railLines, emit } = o;
  const G = 40 * M;
  const grid = new Map();
  const put = (key, v) => { let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(v); };
  const cells = bb => { const out = []; for (let gy = Math.floor(bb[1] / G); gy <= Math.floor(bb[3] / G); gy++) for (let gx = Math.floor(bb[0] / G); gx <= Math.floor(bb[2] / G); gx++) out.push(gx + ',' + gy); return out; };
  const addPoly = (p, t) => { const bb = bboxOf(p); for (const k of cells(bb)) put(k, { t, p, bb }); };
  const addLine = (pts, hw, t) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const bb = [Math.min(a[0], b[0]) - hw, Math.min(a[1], b[1]) - hw, Math.max(a[0], b[0]) + hw, Math.max(a[1], b[1]) + hw];
      for (const k of cells(bb)) put(k, { t, a, b, hw, bb });
    }
  };
  for (const p of kept) addPoly(p, 'b');
  for (const p of blockAreas) addPoly(p, 'a');
  for (const r of roads) addLine(r.pts, (r.s.width / 2 + (r.s.sl || r.s.sr ? SIDE_W[r.s.cls] : 0.6)) * M, 'r');
  for (const l of railLines) addLine(l, 4 * M, 'r');
  const hit = (x, y) => {
    for (const it of grid.get(Math.floor(x / G) + ',' + Math.floor(y / G)) || []) {
      if (x < it.bb[0] || x > it.bb[2] || y < it.bb[1] || y > it.bb[3]) continue;
      if (it.a) { if (segDist([x, y], it.a, it.b) < it.hw) return it.t; }
      else if (inPoly(x, y, it.p)) return it.t;
    }
    return '';
  };
  const zones = removed.map(p => ({ p, bb: bboxOf(p), used: 0 }));
  const zoneAt = (x, y, d) => {
    for (const z of zones) {
      if (x < z.bb[0] - d || x > z.bb[2] + d || y < z.bb[1] - d || y > z.bb[3] + d) continue;
      if (inPoly(x, y, z.p)) return z;
      for (let k = 0; k < z.p.length; k++) if (segDist([x, y], z.p[k], z.p[(k + 1) % z.p.length]) < d) return z;
    }
    return null;
  };
  let seed = 1990;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const rects = [];
  const rgrid = new Map();
  const at = (c, u, n, a, b) => [c[0] + u[0] * a + n[0] * b, c[1] + u[1] * a + n[1] * b];
  const corners = R => [at(R.c, R.u, R.n, -R.hw, -R.hd), at(R.c, R.u, R.n, R.hw, -R.hd), at(R.c, R.u, R.n, R.hw, R.hd), at(R.c, R.u, R.n, -R.hw, R.hd)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const obb = (A, B, pad) => {
    const d = [B.c[0] - A.c[0], B.c[1] - A.c[1]];
    for (const ax of [A.u, A.n, B.u, B.n]) {
      const ra = (A.hw + pad) * Math.abs(dot(A.u, ax)) + (A.hd + pad) * Math.abs(dot(A.n, ax));
      const rb = B.hw * Math.abs(dot(B.u, ax)) + B.hd * Math.abs(dot(B.n, ax));
      if (Math.abs(dot(d, ax)) > ra + rb) return false;
    }
    return true;
  };
  const rkeys = R => { const r = R.hw + R.hd; return cells([R.c[0] - r, R.c[1] - r, R.c[0] + r, R.c[1] + r]); };
  const free = (R, pad, gap) => {
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const q = at(R.c, R.u, R.n, a * (R.hw + pad), b * (R.hd + pad));
      if (hit(q[0], q[1])) return false;
    }
    for (const k of rkeys(R)) for (const S of rgrid.get(k) || []) if (obb(R, S, gap)) return false;
    return true;
  };
  const take = R => { rects.push(R); for (const k of rkeys(R)) { let a = rgrid.get(k); if (!a) rgrid.set(k, a = []); a.push(R); } };
  const reach = (from, n, max) => {
    for (let d = 1.5 * M; d <= max; d += 1.5 * M) if (hit(from[0] + n[0] * d, from[1] + n[1] * d)) return d - 1.5 * M;
    return max;
  };
  const fences = [], gardens = [], trees = [];
  let houses = 0, rows = 0, sheds = 0, garages = 0;
  const frontage = (r, side) => {
    const pts = r.pts, L = lineLen(pts), cls = r.s.cls;
    if (L < 24 * M || r.s.bridge) return;
    const brick = cls <= 1;
    const walk = side > 0 ? r.s.sr : r.s.sl;
    let s = 6 * M, prevRight = null;
    const flushRight = () => { if (prevRight) fences.push(prevRight); prevRight = null; };
    while (s < L - 6 * M) {
      const plotW = (brick ? 10 + rnd() * 7 : 15 + rnd() * 6) * M;
      const mid = s + plotW / 2;
      s += plotW;
      if (mid > L - 6 * M) break;
      const p = pointAlong(pts, mid / L), pa = pointAlong(pts, Math.max(0, mid - M) / L), pb = pointAlong(pts, Math.min(L, mid + M) / L);
      const u = norm([pb[0] - pa[0], pb[1] - pa[1]]);
      const n = [-u[1] * side, u[0] * side];
      const base = (r.s.width / 2 + (walk ? SIDE_W[cls] : 0.6)) * M + (brick ? 0.8 : 1.2 + rnd() * 2.2) * M;
      const front = at(p, u, n, 0, base);
      if (!zoneAt(front[0] + n[0] * 5 * M, front[1] + n[1] * 5 * M, 7 * M)) { flushRight(); continue; }
      if (brick) {
        const hw = plotW / 2 - 0.15 * M, hd = (5.5 + rnd() * 3) * M;
        const R = { c: at(front, u, n, 0, hd), u, n, hw, hd };
        if (!free(R, 0.3 * M, 0.05 * M)) continue;
        take(R);
        const z = zoneAt(R.c[0], R.c[1], 10 * M); if (z) z.used++;
        emit(rnd() < 0.7 ? 2 : 3, 'o', rnd() < 0.55 ? 'h' : 'g', '', '', '', '', [corners(R)]);
        rows++;
        continue;
      }
      const hw = (3.8 + rnd() * 1.8) * M, hd = (3.2 + rnd() * 1.6) * M;
      const shift = (rnd() < 0.5 ? -1 : 1) * Math.max(0, plotW / 2 - hw - 1.8 * M);
      const R = { c: at(front, u, n, shift, hd), u, n, hw, hd };
      if (!free(R, 0.6 * M, 1.6 * M)) { flushRight(); continue; }
      take(R);
      const z = zoneAt(R.c[0], R.c[1], 10 * M); if (z) z.used++;
      const lv = rnd() < 0.78 ? 1 : 2;
      emit(lv, lv === 2 && rnd() < 0.5 ? 'o' : 'w', rnd() < 0.7 ? 'g' : 'h', '', '', '', '', [corners(R)]);
      houses++;
      const fl = at(front, u, n, -plotW / 2, 0), fr = at(front, u, n, plotW / 2, 0);
      const maxD = (22 + rnd() * 10) * M;
      const depth = Math.min(reach(at(fl, u, n, 0.6 * M, 0), n, maxD), reach(front, n, maxD), reach(at(fr, u, n, -0.6 * M, 0), n, maxD));
      const hl = at(R.c, u, n, -hw, -hd), hr = at(R.c, u, n, hw, -hd);
      if (depth < 12 * M) {
        fences.push([fl, hl], [hr, fr]);
        flushRight();
        continue;
      }
      const bl = at(fl, u, n, 0, depth), br = at(fr, u, n, 0, depth);
      if (!prevRight) fences.push([fl, bl]);
      prevRight = [fr, br];
      fences.push([fl, hl], [hr, fr], [bl, br]);
      gardens.push([fl, fr, br, bl]);
      const sideSh = shift > 0 ? -1 : 1;
      const S = { c: at(front, u, n, sideSh * (plotW / 2 - 2.6 * M), depth * (0.45 + rnd() * 0.25)), u, n, hw: (1.4 + rnd() * 0.7) * M, hd: (1.8 + rnd() * 0.8) * M };
      if (free(S, 0.2 * M, 1 * M)) { take(S); emit(1, rnd() < 0.5 ? 'w' : 'g', rnd() < 0.6 ? 'g' : 'f', '', '', '', '', [corners(S)]); sheds++; }
      const nt = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < nt; k++) {
        const t = at(front, u, n, (rnd() - 0.5) * (plotW - 3 * M), depth * (0.55 + rnd() * 0.4));
        if (rects.some(Q => Math.hypot(Q.c[0] - t[0], Q.c[1] - t[1]) < Q.hw + Q.hd)) continue;
        trees.push(t);
      }
    }
    flushRight();
  };
  for (const r of roads) { frontage(r, 1); frontage(r, -1); }
  let barracks = 0;
  const fill = (z, kind) => {
    const p = z.p;
    let best = 0, u = [1, 0];
    for (let k = 0; k < p.length; k++) { const a = p[k], b = p[(k + 1) % p.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; u = norm([b[0] - a[0], b[1] - a[1]]); } }
    const n = [-u[1], u[0]];
    const c = centroid(p);
    let s0 = Infinity, s1 = -Infinity, t0 = Infinity, t1 = -Infinity;
    for (const q of p) { const d = [q[0] - c[0], q[1] - c[1]]; s0 = Math.min(s0, dot(d, u)); s1 = Math.max(s1, dot(d, u)); t0 = Math.min(t0, dot(d, n)); t1 = Math.max(t1, dot(d, n)); }
    const inside = q => inPoly(q[0], q[1], p) || p.some((a, k) => segDist(q, a, p[(k + 1) % p.length]) < 4 * M);
    if (kind === 'garages') {
      const lines = t1 - t0 >= 19 * M ? [(t0 + t1) / 2 - 6.5 * M, (t0 + t1) / 2 + 6.5 * M] : [(t0 + t1) / 2];
      for (const t of lines) {
        let row = 0;
        for (let s = s0 + 2 * M; s <= s1 - 2 * M && row < 14; s += 3.6 * M) {
          const R = { c: at(c, u, n, s, t), u, n, hw: 1.7 * M, hd: 3 * M };
          if (!inside(R.c) || !free(R, 0.2 * M, 0.08 * M)) continue;
          take(R); emit(1, 'g', 'f', '', '', '', '', [corners(R)]); garages++; row++;
        }
      }
      return;
    }
    if (kind === 'barracks') {
      for (let t = t0 + 6 * M; t <= t1 - 5 * M || t === t0 + 6 * M; t += 24 * M) {
        const len = Math.min(34 * M, s1 - s0 - 2 * M);
        if (len < 14 * M) return;
        const R = { c: at(c, u, n, (s0 + s1) / 2, Math.min(t, (t0 + t1) / 2)), u, n, hw: len / 2, hd: (4.5 + rnd()) * M };
        if (!inside(R.c) || !free(R, 1 * M, 3 * M)) continue;
        take(R); emit(2, 'w', rnd() < 0.7 ? 'g' : 'h', '', '', '', '', [corners(R)]); barracks++;
        if (t1 - t0 < 30 * M) return;
      }
      return;
    }
    let made = 0;
    for (let t = t0 + 5 * M; t <= t1 - 4 * M && made < 4; t += 14 * M) for (let s = s0 + 5 * M; s <= s1 - 4 * M && made < 4; s += 15 * M) {
      const R = { c: at(c, u, n, s, t), u, n, hw: (3.6 + rnd() * 1.6) * M, hd: (3 + rnd() * 1.4) * M };
      if (!inside(R.c) || !free(R, 0.8 * M, 2 * M)) continue;
      take(R); emit(1, 'w', rnd() < 0.7 ? 'g' : 'h', '', '', '', '', [corners(R)]); houses++; made++;
    }
  };
  for (const z of zones) {
    if (z.used) continue;
    const areaM2 = Math.abs(area2(z.p)) / (M * M);
    if (areaM2 < 150) continue;
    const r = rnd();
    if (areaM2 < 700) fill(z, 'houses');
    else if (areaM2 < 2500) fill(z, r < 0.5 ? 'barracks' : r < 0.8 ? 'garages' : 'none');
    else fill(z, r < 0.4 ? 'barracks' : r < 0.7 ? 'garages' : 'none');
  }
  return { fences, gardens, trees, houses, rows, sheds, garages, barracks };
}

function main() {
  const A = args();
  const cfg = JSON.parse(fs.readFileSync(A.cfgFile, 'utf8'));
  const osmFile = A.osmFile || cfg.osm;
  const outFile = A.outFile || path.join(__dirname, '..', 'js', 'apps', 'gta90', cfg.out);
  const osm = loadOsm(osmFile);
  const F = makeFrame(cfg);
  const M = cfg.scale;
  const playM = offsetPoly(cfg.play, cfg.pad);
  const marginM = offsetPoly(cfg.play, cfg.pad + cfg.margin);
  const [mx0, my0, mx1, my1] = bboxOf(marginM);
  const OX = Math.floor(mx0), OY = Math.floor(my0);
  const W = Math.ceil((mx1 - OX) * M), H = Math.ceil((my1 - OY) * M);
  const toPx = ([x, y]) => [(x - OX) * M, (y - OY) * M];
  const nodePx = id => { const n = osm.nodes.get(id); if (!n) return null; return toPx(F.m(n.lat, n.lon)); };
  const play = playM.map(toPx), margin = marginM.map(toPx);
  const inMargin = (x, y) => inPoly(x, y, margin);
  const names = [], nameIdx = new Map();
  const nm = s => { if (!s) return -1; if (!nameIdx.has(s)) { nameIdx.set(s, names.length); names.push(s); } return nameIdx.get(s); };
  const rename = s => (s && cfg.renames[s]) || s || '';
  const stats = {};
  const bump = k => { stats[k] = (stats[k] || 0) + 1; };

  const streetWays = [], serviceWays = [];
  for (const w of osm.ways.values()) {
    const t = w.tags || {};
    let hw = t.highway;
    if (!hw || t.area === 'yes') continue;
    const name = rename(t.name);
    if (cfg.dropRoadNames.includes(t.name) || cfg.dropRoadNames.includes(name)) { bump('road dropped by name'); continue; }
    if ((cfg.dropRoads || []).includes(w.id)) { bump('road dropped by id'); continue; }
    if (hw === 'pedestrian' && cfg.roadify.includes(name)) hw = 'residential';
    if (!(hw in ROAD_CLS)) continue;
    if (t.tunnel === 'yes' || t.tunnel === 'building_passage' || (parseInt(t.layer) < 0)) continue;
    const cls = ROAD_CLS[hw];
    if (cls === 4) { if (t.service === 'parking_aisle' || t.service === 'drive-through' || t.access === 'no') continue; serviceWays.push({ w, t, name }); continue; }
    let nodes = w.nodes.slice();
    const ow = t.oneway === 'yes' || t.oneway === 'true' || t.oneway === '1' || t.junction === 'roundabout' || t.junction === 'circular';
    if (t.oneway === '-1') nodes.reverse();
    const lanes = parseInt(t.lanes) || 0;
    let lf, lb;
    if (ow || t.oneway === '-1') { lf = lanes || (cls === 0 ? 2 : 1); lb = 0; }
    else {
      const f = parseInt(t['lanes:forward']), b = parseInt(t['lanes:backward']);
      if (f > 0 && b > 0) { lf = f; lb = b; }
      else if (lanes >= 2) { lf = Math.ceil(lanes / 2); lb = Math.floor(lanes / 2); }
      else lf = lb = cls === 0 ? 2 : 1;
    }
    lf = Math.max(1, Math.min(4, lf)); lb = Math.max(0, Math.min(4, lb));
    let width = parseFloat(t.width);
    if (!(width >= 4 && width <= 40)) width = (lf + lb) * 3.4 + (cls === 3 && lb ? 0.8 : 0);
    const sw = t.sidewalk || t['sidewalk:both'] || '';
    let sl = true, sr = true;
    if (sw === 'no' || sw === 'none') sl = sr = false;
    else if (sw === 'left') sr = false;
    else if (sw === 'right') sl = false;
    if (t['sidewalk:left'] === 'no') sl = false;
    if (t['sidewalk:right'] === 'no') sr = false;
    if (t.oneway === '-1') { const k = sl; sl = sr; sr = k; }
    streetWays.push({ id: w.id, nodes, name, cls, lf, lb, width, sl, sr, bridge: t.bridge === 'yes' || t.bridge === 'viaduct', ow: lb === 0, t });
  }

  const use = new Map();
  for (const s of streetWays) s.nodes.forEach((id, k) => use.set(id, (use.get(id) || 0) + (k === 0 || k === s.nodes.length - 1 ? 1 : 2)));
  const pieces = [];
  for (const s of streetWays) {
    let cur = [s.nodes[0]];
    for (let k = 1; k < s.nodes.length; k++) {
      const id = s.nodes[k];
      cur.push(id);
      if (k < s.nodes.length - 1 && use.get(id) >= 3) { pieces.push({ s, nodes: cur }); cur = [id]; }
    }
    pieces.push({ s, nodes: cur });
  }
  const sig = p => [p.s.name, p.s.cls, p.s.lf, p.s.lb, Math.round(p.s.width), p.s.sl, p.s.sr, p.s.bridge].join('|');
  const ends = new Map();
  const addEnd = (id, p) => { if (!ends.has(id)) ends.set(id, []); ends.get(id).push(p); };
  for (const p of pieces) { addEnd(p.nodes[0], p); addEnd(p.nodes[p.nodes.length - 1], p); }
  for (const p of pieces) p.alive = true;
  let merged = 0;
  for (const [id, list] of ends) {
    const live = list.filter(p => p.alive);
    if (live.length !== 2) continue;
    let [a, b] = live;
    if (a === b || sig(a) !== sig(b)) continue;
    const aEnd = a.nodes[a.nodes.length - 1] === id, bStart = b.nodes[0] === id;
    const aStart = a.nodes[0] === id, bEnd = b.nodes[b.nodes.length - 1] === id;
    let nodes;
    if (aEnd && bStart) nodes = a.nodes.concat(b.nodes.slice(1));
    else if (bEnd && aStart) nodes = b.nodes.concat(a.nodes.slice(1));
    else if (a.s.ow) continue;
    else if (aEnd && bEnd) nodes = a.nodes.concat(b.nodes.slice().reverse().slice(1));
    else nodes = a.nodes.slice().reverse().concat(b.nodes.slice(1));
    if (nodes[0] === nodes[nodes.length - 1]) continue;
    const np = { s: a.s, nodes, alive: true };
    a.alive = b.alive = false;
    for (const e of [nodes[0], nodes[nodes.length - 1]]) { const l = ends.get(e); l.push(np); }
    pieces.push(np);
    merged++;
  }
  const roadsOut = [];
  const roadPx = [];
  for (const p of pieces) {
    if (!p.alive) continue;
    const pts = p.nodes.map(nodePx).filter(Boolean);
    if (pts.length < 2) continue;
    for (const part of clipLine(pts, 0, 0, W, H)) {
      const sp = simplify(part, 0.4 * M);
      for (const q of splitByPoly(sp, play)) {
        if (lineLen(q.pts) < 1) continue;
        const mid = pointAlong(q.pts, 0.5);
        if (!q.inside && !inMargin(mid[0], mid[1])) continue;
        roadPx.push({ s: p.s, pts: q.pts, inside: q.inside });
      }
    }
  }
  const healed = healDeadEnds(roadPx, cfg.heal || 12, M, play);
  bump('dead ends healed: ' + healed);
  const partnerLeft = r => {
    if (!r.s.ow || !r.s.name) return false;
    const mid = pointAlong(r.pts, 0.5);
    const a = pointAlong(r.pts, 0.45), b = pointAlong(r.pts, 0.55);
    const d = norm([b[0] - a[0], b[1] - a[1]]);
    const left = [d[1], -d[0]];
    for (const o of roadPx) {
      if (o === r || !o.s.ow || o.s.name !== r.s.name) continue;
      for (let k = 0; k < o.pts.length - 1; k++) {
        const pa = o.pts[k], pb = o.pts[k + 1];
        const dist = segDist(mid, pa, pb);
        if (dist > 48 * M || dist < 2 * M) continue;
        const od = norm([pb[0] - pa[0], pb[1] - pa[1]]);
        if (od[0] * d[0] + od[1] * d[1] > -0.7) continue;
        const cx = (pa[0] + pb[0]) / 2 - mid[0], cy = (pa[1] + pb[1]) / 2 - mid[1];
        if (cx * left[0] + cy * left[1] > 0) return true;
      }
    }
    return false;
  };
  for (const r of roadPx) {
    const s = r.s;
    const median = partnerLeft(r);
    const flags = (s.bridge ? 1 : 0) | (r.inside ? 2 : 0) | (s.sl && !median ? 4 : 0) | (s.sr ? 8 : 0) | (median ? 16 : 0);
    roadsOut.push([nm(s.name), s.cls, s.lf, s.lb, Math.round(s.width * M), Math.round(SIDE_W[s.cls] * M), flags].map(b36).join(',') + ':' + encPts(r.pts));
    bump('road ' + (r.inside ? 'play' : 'margin'));
  }
  const serviceOut = [];
  for (const { w, t } of serviceWays) {
    const pts = w.nodes.map(nodePx).filter(Boolean);
    if (pts.length < 2) continue;
    for (const part of clipLine(pts, 0, 0, W, H)) {
      const mid = pointAlong(part, 0.5);
      if (!inMargin(mid[0], mid[1])) continue;
      const wd = parseFloat(t.width) > 2 && parseFloat(t.width) < 12 ? parseFloat(t.width) : 3.6;
      serviceOut.push(b36(Math.round(wd * M)) + ':' + encPts(simplify(part, 0.4 * M)));
      bump('service');
    }
  }

  const removed = [], review = [], keepIds = new Set(cfg.keepBuildings || []), dropIds = new Set(cfg.dropBuildings || []);
  const modern = cfg.modernNames || [];
  const isModern = t => { const s = [t.name, t.brand, t.operator, t['name:en'], t.old_name ? '' : ''].filter(Boolean).join(' | '); return modern.find(m => s.includes(m)); };
  const buildingSrc = [];
  for (const w of osm.ways.values()) {
    const t = w.tags || {};
    if (!t.building || t.building === 'no' || t['building:part']) continue;
    if (w.nodes.length < 4 || w.nodes[0] !== w.nodes[w.nodes.length - 1]) continue;
    buildingSrc.push({ id: 'w' + w.id, t, rings: [w.nodes] });
  }
  for (const r of osm.rels) {
    const t = r.tags || {};
    if (!t.building || t.type !== 'multipolygon') continue;
    const outer = [], inner = [];
    for (const m of r.members || []) { if (m.type !== 'way') continue; const w = osm.ways.get(m.ref); if (!w) continue; (m.role === 'inner' ? inner : outer).push(w.nodes); }
    const o = assembleRings(outer), i = assembleRings(inner);
    for (const ring of o) buildingSrc.push({ id: 'r' + r.id, t, rings: [ring].concat(i) });
  }
  const buildingsOut = [];
  const bInfo = [];
  const overrides = cfg.override || {};
  const specRing = spec => {
    if (spec.geo) return spec.geo.map(([la, lo]) => toPx(F.m(la, lo)));
    const [cx, cy] = toPx(F.m(spec.center[0], spec.center[1]));
    if (spec.radius) { const n = spec.sides || 16; return Array.from({ length: n }, (_, k) => [cx + Math.cos(k / n * Math.PI * 2) * spec.radius * M, cy + Math.sin(k / n * Math.PI * 2) * spec.radius * M]); }
    const hw = spec.w / 2 * M, hh = spec.h / 2 * M;
    return [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]];
  };
  const addedAreaRings = (cfg.addAreas || []).map(a => specRing(a.rect || a));
  const keptPolys = [], removedPolys = [];
  const emitBuilding = (lv, style, roof, name, wall, roofC, kind, rings) => {
    buildingsOut.push([lv, style, roof, nm(name || ''), wall || '', roofC || '', kind || ''].join(',') + ':' + rings.map(encPts).join(';'));
  };
  for (const b of buildingSrc) {
    const rings = b.rings.map(r => r.map(nodePx).filter(Boolean)).filter(r => r.length >= 4);
    if (!rings.length) continue;
    const outer = rings[0].slice(0, -1);
    const c = centroid(outer);
    if (!inMargin(c[0], c[1])) continue;
    const t = b.t;
    const areaM2 = Math.abs(area2(outer)) / (M * M);
    const ov = overrides[b.id] || {};
    const lv = ov.levels || levelsOf(t, areaM2);
    const year = yearOf(t);
    let why = '';
    if (dropIds.has(b.id)) why = 'manual';
    else if (keepIds.has(b.id)) why = '';
    else if (t.building === 'construction' || t.building === 'ruins') why = t.building;
    else if (year > cfg.year) why = 'year ' + year;
    else if (isModern(t)) why = 'name ' + isModern(t);
    else if (lv >= 17) why = 'tall ' + lv;
    const ll = F.geo(c[0] / M + OX, c[1] / M + OY);
    const rec = { id: b.id, name: t.name || '', lv, year, area: Math.round(areaM2), b: t.building, addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), lat: +ll[0].toFixed(6), lon: +ll[1].toFixed(6), inside: inPoly(c[0], c[1], play) };
    if (A.report) rec.geo = b.rings[0].map(id => osm.nodes.get(id)).filter(Boolean).map(n => [+n.lat.toFixed(6), +n.lon.toFixed(6)]);
    if (why) {
      removed.push(Object.assign({ why }, rec));
      bump('building removed: ' + why.split(' ')[0]);
      if (why !== 'ruins' && rec.inside) removedPolys.push(outer);
      continue;
    }
    if (lv >= 8 || areaM2 >= 1800 || (year >= 1976)) review.push(rec);
    const style = ov.style || styleOf(t, lv, areaM2, year);
    const roof = ov.roof || roofOf(t, style, lv);
    const outRings = [];
    for (let k = 0; k < rings.length; k++) {
      let r = rings[k].slice(0, -1);
      r = simplify(r.concat([r[0]]), 0.25 * M, true).slice(0, -1);
      if (r.length < 3) continue;
      const a = area2(r);
      if (k === 0 ? a < 0 : a > 0) r.reverse();
      outRings.push(r);
    }
    if (!outRings.length) continue;
    keptPolys.push(outRings[0]);
    emitBuilding(lv, style, roof, ov.name || t.name, ov.wall || colorOf(t['building:colour']), ov.roofColor || colorOf(t['roof:colour']), ov.kind, outRings);
    bInfo.push(rec);
    bump('building kept');
  }
  for (const add of cfg.addBuildings || []) {
    const ring = specRing(add);
    if (area2(ring) < 0) ring.reverse();
    keptPolys.push(ring);
    emitBuilding(add.levels, add.style || 'q', add.roof || 'f', add.name, add.wall, add.roofColor, add.kind, [ring]);
    bump('building added');
  }

  const areasOut = [];
  const blockAreas = [], railLines = [];
  const pushArea = (kind, rings) => {
    const out = [];
    for (let k = 0; k < rings.length; k++) {
      let r = rings[k].map(nodePx).filter(Boolean);
      if (r.length < 4) continue;
      r = clipRing(r.slice(0, -1), -20, -20, W + 20, H + 20);
      if (r.length < 3) continue;
      r = simplify(r.concat([r[0]]), 0.3 * M, true).slice(0, -1);
      if (r.length < 3) continue;
      out.push(encPts(r));
      if (k === 0 && (kind === 'w' || kind === 'q' || kind === 's' || kind === 'r')) blockAreas.push(r);
    }
    if (!out.length) return;
    const bb = bboxOf(rings[0].map(nodePx).filter(Boolean));
    if (bb[2] < 0 || bb[3] < 0 || bb[0] > W || bb[1] > H) return;
    areasOut.push(kind + ':' + out.join(';'));
    bump('area ' + kind);
  };
  const areaKind = t => {
    if (t.natural === 'water' || t.waterway === 'riverbank' || t.landuse === 'reservoir' || t.landuse === 'basin' || t.water) return 'w';
    if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'recreation_ground' || t.landuse === 'village_green' || t.leisure === 'dog_park') return 'p';
    if (t.landuse === 'grass' || t.landuse === 'flowerbed' || t.natural === 'grassland' || t.landuse === 'meadow' || t.natural === 'scrub' || t.landuse === 'cemetery' || t.landuse === 'allotments') return 'g';
    if (t.natural === 'wood' || t.landuse === 'forest') return 'f';
    if ((t.highway === 'pedestrian' && t.area === 'yes') || t['area:highway'] === 'pedestrian' || t.place === 'square' || t.amenity === 'marketplace') return 'q';
    if (t.amenity === 'parking' && t.parking !== 'underground' && t.parking !== 'multi-storey') return 'k';
    if (t.landuse === 'railway') return 'r';
    if (t.leisure === 'pitch' || t.leisure === 'stadium' || t.leisure === 'track' || t.leisure === 'sports_centre') return 's';
    if (t.natural === 'sand' || t.natural === 'beach') return 'b';
    return null;
  };
  for (const w of osm.ways.values()) {
    const t = w.tags || {};
    if (t.building) continue;
    const k = areaKind(t);
    if (!k || w.nodes[0] !== w.nodes[w.nodes.length - 1]) continue;
    pushArea(k, [w.nodes]);
  }
  for (const r of osm.rels) {
    const t = r.tags || {};
    if (t.type !== 'multipolygon' || t.building) continue;
    const k = areaKind(t);
    if (!k) continue;
    const outer = [], inner = [];
    for (const m of r.members || []) { if (m.type !== 'way') continue; const w = osm.ways.get(m.ref); if (!w) continue; (m.role === 'inner' ? inner : outer).push(w.nodes); }
    const o = assembleRings(outer), i = assembleRings(inner);
    for (const ring of o) pushArea(k, [ring].concat(i.filter(ir => { const p = osm.nodes.get(ir[0]); return p; })));
  }

  for (const a of cfg.addAreas || []) { const ring = specRing(a.rect || a); areasOut.push(a.kind + (a.name ? ',' + b36(nm(a.name)) : '') + ':' + encPts(ring)); bump('area added ' + a.kind); }
  const railsOut = [], barriersOut = [], treesPts = [], poisOut = [];
  for (const w of osm.ways.values()) {
    const t = w.tags || {};
    const lineOut = (kind, list) => {
      const pts = w.nodes.map(nodePx).filter(Boolean);
      if (pts.length < 2) return;
      for (const part of clipLine(pts, 0, 0, W, H)) {
        const mid = pointAlong(part, 0.5);
        if (!inMargin(mid[0], mid[1])) continue;
        const sp = simplify(part, 0.25 * M);
        list.push(kind + ':' + encPts(sp));
        if (list === railsOut && kind === 'r') railLines.push(sp);
        bump(kind === 't' || kind === 'r' ? 'rail ' + kind : 'barrier ' + kind);
      }
    };
    if (t.railway === 'tram' && !t.disused && !t.abandoned && !t['disused:railway'] && t.service !== 'yard') lineOut('t', railsOut);
    else if (t.railway === 'rail' || t.railway === 'narrow_gauge') lineOut('r', railsOut);
    if (t.barrier === 'wall' || t.barrier === 'city_wall') lineOut('w', barriersOut);
    else if (t.barrier === 'fence') lineOut('f', barriersOut);
    else if (t.barrier === 'retaining_wall') lineOut('r', barriersOut);
    if (t.natural === 'tree_row') {
      const pts = w.nodes.map(nodePx).filter(Boolean);
      const L = lineLen(pts);
      for (let d = 0; d <= L; d += 5.5 * M) { const p = pointAlong(pts, L ? d / L : 0); if (inMargin(p[0], p[1])) treesPts.push(p); }
    }
  }
  for (const b of cfg.addBarriers || []) { const ring = specRing(b.rect || b); barriersOut.push(b.kind + ':' + encPts(ring.concat([ring[0]]))); bump('barrier added'); }
  if (cfg.infill) {
    for (const p of addedAreaRings) blockAreas.push(p);
    const emitRect = (lv, style, roof, name, wall, roofC, kind, rings) => emitBuilding(lv, style, roof, name, wall, roofC, kind, rings.map(r => area2(r) < 0 ? r.slice().reverse() : r));
    const ps = privateSector({ M, removed: removedPolys, kept: keptPolys, roads: roadPx, blockAreas, railLines, emit: emitRect });
    for (const f of ps.fences) barriersOut.push('p:' + encPts(f));
    for (const g of ps.gardens) areasOut.push('v:' + encPts(g));
    for (const t of ps.trees) treesPts.push(t);
    bump('infill houses: ' + ps.houses); bump('infill row houses: ' + ps.rows); bump('infill sheds: ' + ps.sheds); bump('infill garages: ' + ps.garages); bump('infill barracks: ' + ps.barracks); bump('infill fences: ' + ps.fences.length); bump('infill gardens: ' + ps.gardens.length);
  }
  const poiKinds = [];
  for (const n of osm.nodes.values()) {
    const t = n.tags;
    if (!t) continue;
    const p = toPx(F.m(n.lat, n.lon));
    if (!inMargin(p[0], p[1])) continue;
    if (t.natural === 'tree') { treesPts.push(p); continue; }
    let kind = null;
    if (t.highway === 'traffic_signals') kind = 'sig';
    else if (t.highway === 'crossing') kind = 'cross';
    else if (t.railway === 'tram_stop' || (t.public_transport === 'stop_position' && t.tram === 'yes')) kind = 'tram';
    else if (t.highway === 'bus_stop') kind = t.trolleybus === 'yes' ? 'trolley' : 'bus';
    else if (t.historic === 'monument' || t.historic === 'memorial') kind = 'monument';
    else if (t.amenity === 'fountain') kind = 'fountain';
    else if (t.shop) kind = 'shop:' + t.shop;
    else if (t.amenity && /^(cafe|restaurant|fast_food|bar|pub|bank|pharmacy|post_office|cinema|theatre|police|hospital|clinic|fuel|library|marketplace|bureau_de_change)$/.test(t.amenity)) kind = 'am:' + t.amenity;
    if (!kind) continue;
    poisOut.push([kind, nm(t.name || '')].join(',') + ':' + encPts([p]));
    bump('poi ' + kind.split(':')[0]);
  }

  const data = {
    id: cfg.id, name: cfg.name, scale: M, origin: [OX, OY], frame: cfg.frame, size: [W, H],
    play: encPts(play), margin: encPts(margin), names,
    roads: roadsOut, service: serviceOut, buildings: buildingsOut, areas: areasOut, rails: railsOut, barriers: barriersOut,
    trees: encPts(treesPts.map(p => [Math.round(p[0]), Math.round(p[1])])), pois: poisOut
  };
  const js = '(function (G) {\n  \'use strict\';\n  G.DISTRICTS = G.DISTRICTS || [];\n  G.DISTRICTS.push(' + JSON.stringify(data) + ');\n  if (typeof module !== \'undefined\' && module.exports) module.exports = G;\n})(globalThis.Gta90 = globalThis.Gta90 || {});\n';
  fs.writeFileSync(outFile, js);
  console.log('wrote', outFile, (js.length / 1024).toFixed(0) + ' KB', 'size', W + 'x' + H, 'merged', merged);
  console.log(Object.entries(stats).sort().map(([k, v]) => k + ': ' + v).join('\n'));
  if (A.report) {
    const rep = path.join(path.dirname(osmFile), cfg.id + '-review.json');
    fs.writeFileSync(rep, JSON.stringify({ removed, review, kept: bInfo, frame: cfg.frame, origin: [OX, OY], scale: M }));
    console.log('review', rep, 'removed', removed.length, 'to review', review.length);
  }
}

main();
