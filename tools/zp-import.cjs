'use strict';
const fs = require('fs');

const FRAME = { lat: 47.835, lon: 35.105, h: 0.25, v: 0.5, base: 16 };
const BOUNDS = [-1152, -1152, 1088, 1984];
const CELL = 2;
const DEM_STEP = 8;
const KX = 111320 * Math.cos(FRAME.lat * Math.PI / 180), KY = 110540;

const COVER = { none: 0, grass: 1, field: 2, scrub: 3, park: 4, wood: 5, wetland: 6, sand: 7, rock: 8, urban: 9, industrial: 10, landfill: 11, cemetery: 12, pitch: 13, garden: 14, water: 15 };

const ROAD_KIND = {
  motorway: 'P', trunk: 'P', primary: 'P', primary_link: 'P', trunk_link: 'P',
  secondary: 'S', secondary_link: 'S', tertiary: 'T', tertiary_link: 'T',
  unclassified: 'R', residential: 'R', living_street: 'R', pedestrian: 'W', service: 'V',
  track: 'K', footway: 'F', path: 'F', cycleway: 'F', bridleway: 'F', steps: 'X'
};
const ROAD_W = { P: 16, S: 12, T: 9, R: 6.5, W: 7, V: 4.5, K: 3.2, F: 1.8, X: 2.4 };

const RENAME = {
  'проспект Соборний': 'проспект Ленина', 'Соборний проспект': 'проспект Ленина', 'Вознесенівський узвіз': 'Вознесеновский спуск',
  'вулиця Перемоги': 'улица Победы', 'бульвар Шевченка': 'бульвар Шевченко', 'проспект Маяковського': 'проспект Маяковского',
  'вулиця Незалежної України': 'улица 40 лет Советской Украины', 'набережна магістраль': 'Набережная магистраль', 'Набережна вулиця': 'Набережная улица',
  'вулиця Січі': 'улица Сечи', 'Січі вулиця': 'улица Сечи', 'I міст Преображенського': 'мост Преображенского', 'II міст Преображенського': 'второй мост Преображенского',
  'Арковий міст': 'Арочный мост', 'Вантовий міст': 'Вантовый мост', 'Балковий міст': 'Балочный мост', 'ДніпроГЕС': 'плотина ДнепроГЭС', 'Аванкамерний міст': 'Аванкамерный мост',
  'вулиця Яценка': 'улица Яценко', 'вулиця Сталеварів': 'улица Сталеваров', 'проспект Металургів': 'проспект Металлургов', 'вулиця Алюмінієва': 'Алюминиевая улица',
  'вулиця Гоголя': 'улица Гоголя', 'Центральний бульвар': 'Центральный бульвар', 'вулиця Патріотична': 'Патриотическая улица', 'вулиця Леоніда Жаботинського': 'улица Правды',
  'вулиця Скіфська': 'Скифская улица', 'вулиця Миру': 'улица Мира', 'вулиця Дмитра Донцова': 'улица Чекистов', 'Поштова вулиця': 'Почтовая улица',
  'Сергія Тюленіна вулиця': 'улица Тюленина', 'вулиця Нижньодніпровська': 'Нижнеднепровская улица', 'вулиця Рекордна': 'Рекордная улица',
  'вулиця Заводська': 'Заводская улица', 'вулиця Сєдова': 'улица Седова', 'Сєдова вулиця': 'улица Седова', 'вулиця Шкільна': 'улица Героев Сталинграда',
  'вулиця Наукового Містечка': 'улица Научного Городка', 'Наукового Містечка вулиця': 'улица Научного Городка', 'Тарасова Стежка': 'Тарасова тропа',
  'вулиця Ігоря Сікорського': 'улица Куйбышева', 'вулиця Чумацький Шлях': 'улица Котовского', 'вулиця Миколи Киценка': 'улица Щорса'
};

function args() {
  const a = process.argv.slice(2);
  const flags = new Set(a.filter(x => x.startsWith('--')));
  const pos = a.filter(x => !x.startsWith('--'));
  if (pos.length < 4) throw new Error('usage: node tools/zp-import.cjs <osm.json> <district.json> <dem.json> <out.js> [--report]');
  return { osm: pos[0], district: pos[1], dem: pos[2], out: pos[3], report: flags.has('--report') };
}

const proj = (lat, lon) => [(lon - FRAME.lon) * KX * FRAME.h, -(lat - FRAME.lat) * KY * FRAME.h];
const projReal = (lat, lon) => [(lon - FRAME.lon) * KX, -(lat - FRAME.lat) * KY];
const geomPts = g => (g || []).filter(Boolean).map(p => proj(p.lat, p.lon));
const geomReal = g => (g || []).filter(Boolean).map(p => projReal(p.lat, p.lon));
const isClosed = g => { if (!g || g.length < 4) return false; const a = g[0], b = g[g.length - 1]; return a && b && a.lat === b.lat && a.lon === b.lon; };
const area = r => { let s = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
const centroid = r => { let a = 0, x = 0, y = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; const c = p[0] * q[1] - q[0] * p[1]; a += c; x += (p[0] + q[0]) * c; y += (p[1] + q[1]) * c; } if (Math.abs(a) < 1e-9) { let sx = 0, sy = 0; for (const p of r) { sx += p[0]; sy += p[1]; } return [sx / r.length, sy / r.length]; } return [x / (3 * a), y / (3 * a)]; };

function assemble(members, role) {
  const segs = members.filter(m => m.type === 'way' && m.role === role && m.geometry).map(m => m.geometry.filter(Boolean));
  const key = p => p.lat.toFixed(7) + ',' + p.lon.toFixed(7);
  const rings = [];
  const pool = segs.slice();
  while (pool.length) {
    let ring = pool.shift().slice();
    for (let guard = 0; guard < 20000 && key(ring[0]) !== key(ring[ring.length - 1]); guard++) {
      const end = key(ring[ring.length - 1]);
      let found = -1, rev = false;
      for (let i = 0; i < pool.length; i++) {
        if (key(pool[i][0]) === end) { found = i; break; }
        if (key(pool[i][pool[i].length - 1]) === end) { found = i; rev = true; break; }
      }
      if (found < 0) break;
      const s = pool.splice(found, 1)[0];
      ring = ring.concat((rev ? s.slice().reverse() : s).slice(1));
    }
    if (ring.length >= 4) rings.push(ring);
  }
  return rings;
}

function ringsOf(e) {
  if (e.type === 'way') return isClosed(e.geometry) ? [e.geometry.filter(Boolean)] : [];
  if (e.type === 'relation') return assemble(e.members, 'outer').concat(assemble(e.members, 'inner'));
  return [];
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = L < 1e-6 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}

class Grid {
  constructor(cell) {
    this.cell = cell;
    this.cols = Math.round((BOUNDS[2] - BOUNDS[0]) / cell);
    this.rows = Math.round((BOUNDS[3] - BOUNDS[1]) / cell);
    this.a = new Uint8Array(this.cols * this.rows);
  }
  fill(rings, v, pred) {
    let zmin = Infinity, zmax = -Infinity;
    for (const r of rings) for (const p of r) { if (p[1] < zmin) zmin = p[1]; if (p[1] > zmax) zmax = p[1]; }
    const r0 = Math.max(0, Math.floor((zmin - BOUNDS[1]) / this.cell)), r1 = Math.min(this.rows - 1, Math.ceil((zmax - BOUNDS[1]) / this.cell));
    for (let row = r0; row <= r1; row++) {
      const z = BOUNDS[1] + (row + 0.5) * this.cell, xs = [];
      for (const r of rings) for (let i = 0; i < r.length; i++) {
        const a = r[i], b = r[(i + 1) % r.length];
        if ((a[1] <= z) !== (b[1] <= z)) xs.push(a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c0 = Math.max(0, Math.ceil((xs[k] - BOUNDS[0]) / this.cell - 0.5)), c1 = Math.min(this.cols - 1, Math.floor((xs[k + 1] - BOUNDS[0]) / this.cell - 0.5));
        for (let c = c0; c <= c1; c++) { const i = row * this.cols + c; if (!pred || pred(this.a[i])) this.a[i] = v; }
      }
    }
  }
  at(x, z) {
    const c = Math.floor((x - BOUNDS[0]) / this.cell), r = Math.floor((z - BOUNDS[1]) / this.cell);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return 0;
    return this.a[r * this.cols + c];
  }
}

function coverOf(t) {
  if (t.natural === 'water' || t.waterway === 'riverbank' || t.waterway === 'dock' || (t.water && t.natural !== 'wetland')) return 'water';
  if (t.natural === 'wetland') return 'wetland';
  if (t.natural === 'beach' || t.natural === 'sand') return 'sand';
  if (t.natural === 'bare_rock' || t.natural === 'rock' || t.natural === 'scree') return 'rock';
  if (t.natural === 'wood' || t.landuse === 'forest') return 'wood';
  if (t.natural === 'scrub') return 'scrub';
  if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'village_green' || t.landuse === 'recreation_ground') return 'park';
  if (t.leisure === 'pitch' || t.leisure === 'stadium' || t.leisure === 'track') return 'pitch';
  if (t.landuse === 'cemetery' || t.amenity === 'grave_yard') return 'cemetery';
  if (t.landuse === 'farmland' || t.landuse === 'orchard' || t.landuse === 'vineyard' || t.landuse === 'plant_nursery') return 'field';
  if (t.landuse === 'allotments') return 'garden';
  if (t.natural === 'grassland' || t.natural === 'heath' || t.landuse === 'grass' || t.landuse === 'meadow' || t.landuse === 'flowerbed') return 'grass';
  if (t.landuse === 'landfill' || t.landuse === 'quarry' || t.landuse === 'brownfield') return 'landfill';
  if (t.landuse === 'industrial' || t.landuse === 'railway' || t.landuse === 'construction' || t.landuse === 'garages' || t.landuse === 'depot') return 'industrial';
  if (t.landuse === 'residential' || t.landuse === 'commercial' || t.landuse === 'retail' || t.amenity === 'parking' || t.landuse === 'education' || t.amenity === 'school' || t.amenity === 'hospital') return 'urban';
  return null;
}

const COVER_ORDER = ['urban', 'industrial', 'landfill', 'garden', 'field', 'grass', 'scrub', 'park', 'cemetery', 'pitch', 'wood', 'wetland', 'sand', 'rock', 'water'];

function varint(out, v) { while (v >= 128) { out.push((v & 127) | 128); v = Math.floor(v / 128); } out.push(v); }

function encodeRLE(grid) {
  const bytes = [];
  for (let r = 0; r < grid.rows; r++) {
    let c = 0;
    while (c < grid.cols) {
      const v = grid.a[r * grid.cols + c];
      let n = 1;
      while (c + n < grid.cols && grid.a[r * grid.cols + c + n] === v) n++;
      bytes.push(v);
      varint(bytes, n);
      c += n;
    }
  }
  return Buffer.from(bytes).toString('base64');
}

function loadDem(file) {
  const D = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sample = (lat, lon) => {
    const fr = Math.max(0, Math.min(D.rows - 1.001, (D.LAT1 - lat) / D.dLat)), fc = Math.max(0, Math.min(D.cols - 1.001, (lon - D.LON0) / D.dLon));
    const r = Math.floor(fr), c = Math.floor(fc), tr = fr - r, tc = fc - c;
    const g = (rr, cc) => { const v = D.h[rr * D.cols + cc]; return v == null || v < 0 ? FRAME.base : v; };
    return (g(r, c) * (1 - tc) + g(r, c + 1) * tc) * (1 - tr) + (g(r + 1, c) * (1 - tc) + g(r + 1, c + 1) * tc) * tr;
  };
  const cols = Math.round((BOUNDS[2] - BOUNDS[0]) / DEM_STEP) + 1, rows = Math.round((BOUNDS[3] - BOUNDS[1]) / DEM_STEP) + 1;
  const out = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const gx = BOUNDS[0] + c * DEM_STEP, gz = BOUNDS[1] + r * DEM_STEP;
    const ex = gx / FRAME.h, ey = gz / FRAME.h;
    const lon = FRAME.lon + ex / KX, lat = FRAME.lat - ey / KY;
    const h = (sample(lat, lon) - FRAME.base) * FRAME.v;
    out[r * cols + c] = Math.max(0, Math.min(255, Math.round(h * 4)));
  }
  return { step: DEM_STEP, cols, rows, data: Buffer.from(out).toString('base64') };
}

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
  let t = ((px - ax) * dx + (pz - az) * dz) / L2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t, qz = az + dz * t;
  return [Math.hypot(px - qx, pz - qz), qx, qz, dx / Math.sqrt(L2), dz / Math.sqrt(L2)];
}

function polyOverlap(a, b) {
  const axes = [];
  for (const P of [a, b]) for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; const nx = -(q[1] - p[1]), nz = q[0] - p[0]; const L = Math.hypot(nx, nz) || 1; axes.push([nx / L, nz / L]); }
  let minOver = Infinity;
  for (const [nx, nz] of axes) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of a) { const d = p[0] * nx + p[1] * nz; if (d < a0) a0 = d; if (d > a1) a1 = d; }
    for (const p of b) { const d = p[0] * nx + p[1] * nz; if (d < b0) b0 = d; if (d > b1) b1 = d; }
    const o = Math.min(a1, b1) - Math.max(a0, b0);
    if (o <= 0) return 0;
    if (o < minOver) minOver = o;
  }
  return minOver;
}

function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function main() {
  const A = args();
  const osm = JSON.parse(fs.readFileSync(A.osm, 'utf8'));
  const district = JSON.parse(fs.readFileSync(A.district, 'utf8')).elements[0];
  const distRings = assemble(district.members, 'outer').map(r => r.map(p => proj(p.lat, p.lon)));
  const distPoly = distRings.sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0];
  const inDistrict = (x, z) => pointInPoly(x, z, distPoly);

  const names = [], nameIdx = new Map();
  const nm = s => { if (!s) return -1; s = RENAME[s] || s; if (!nameIdx.has(s)) { nameIdx.set(s, names.length); names.push(s); } return nameIdx.get(s); };

  const cover = new Grid(CELL);
  const byCover = {};
  for (const e of osm.elements) {
    if (e.type === 'node') continue;
    const t = e.tags || {};
    if (t.building) continue;
    const k = coverOf(t);
    if (!k) continue;
    const rings = ringsOf(e);
    if (!rings.length) continue;
    (byCover[k] = byCover[k] || []).push(rings.map(r => r.map(p => proj(p.lat, p.lon))));
  }
  for (const k of COVER_ORDER) for (const rings of byCover[k] || []) cover.fill(rings, COVER[k]);

  const roads = [], roadSegs = [];
  const bin = (x, z) => Math.floor((x - BOUNDS[0]) / 32) + ',' + Math.floor((z - BOUNDS[1]) / 32);
  const segHash = new Map();
  const addSeg = (s) => {
    const x0 = Math.min(s[0], s[2]) - s[4] - 4, x1 = Math.max(s[0], s[2]) + s[4] + 4, z0 = Math.min(s[1], s[3]) - s[4] - 4, z1 = Math.max(s[1], s[3]) + s[4] + 4;
    for (let x = Math.floor((x0 - BOUNDS[0]) / 32); x <= Math.floor((x1 - BOUNDS[0]) / 32); x++) for (let z = Math.floor((z0 - BOUNDS[1]) / 32); z <= Math.floor((z1 - BOUNDS[1]) / 32); z++) {
      const k = x + ',' + z;
      if (!segHash.has(k)) segHash.set(k, []);
      segHash.get(k).push(s);
    }
  };
  const inBounds = (x, z, pad = 0) => x >= BOUNDS[0] - pad && z >= BOUNDS[1] - pad && x <= BOUNDS[2] + pad && z <= BOUNDS[3] + pad;
  const keepRoad = (t, pts, kind) => {
    if (t.area === 'yes') return false;
    if (t.access === 'private' && kind === 'V') return false;
    if (!pts.some(p => inBounds(p[0], p[1], 50))) return false;
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const mid = pts[Math.floor(pts.length / 2)];
    const urban = cover.at(mid[0], mid[1]) === COVER.urban || cover.at(mid[0], mid[1]) === COVER.industrial;
    if (kind === 'V') return !urban && len > 25 && !t.service;
    if (kind === 'F') return !urban && len > 18 && t.highway !== 'cycleway';
    if (kind === 'X') return len > 3;
    if (kind === 'R') return !!t.name && len > 30;
    if (kind === 'K') return len > 15;
    return true;
  };
  for (const e of osm.elements) {
    if (e.type !== 'way') continue;
    const t = e.tags || {};
    const kind = ROAD_KIND[t.highway];
    if (!kind) continue;
    const pts = simplify(geomPts(e.geometry), 0.5);
    if (pts.length < 2 || !keepRoad(t, pts, kind)) continue;
    const layer = +(t.layer || 0) || 0;
    const bridge = t.bridge && t.bridge !== 'no' ? 1 : 0;
    const w = ROAD_W[kind] * (t.lanes && kind === 'P' ? Math.min(1.3, 0.6 + 0.12 * +t.lanes) : 1);
    roads.push({ k: kind, w, n: nm(t.name), layer, bridge, pts, surf: t.surface || '' });
    if (!bridge && kind !== 'F' && kind !== 'X' && kind !== 'K') for (let i = 1; i < pts.length; i++) addSeg([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w / 2]);
  }

  const rails = [];
  for (const e of osm.elements) {
    if (e.type !== 'way') continue;
    const t = e.tags || {};
    if (!(t.railway === 'rail' || t.railway === 'tram' || t.railway === 'narrow_gauge' || t.railway === 'disused')) continue;
    if (t.service === 'yard' || t.service === 'siding') continue;
    const pts = simplify(geomPts(e.geometry), 0.4);
    if (pts.length < 2 || !pts.some(p => inBounds(p[0], p[1], 30))) continue;
    rails.push({ k: t.railway === 'tram' ? 't' : t.railway === 'disused' ? 'd' : 'r', layer: +(t.layer || 0) || 0, bridge: t.bridge && t.bridge !== 'no' ? 1 : 0, pts, svc: t.service || '' });
  }

  const cliffs = [];
  for (const e of osm.elements) {
    if (e.type !== 'way') continue;
    const t = e.tags || {};
    if (t.natural !== 'cliff' && t.natural !== 'earth_bank' && t.man_made !== 'embankment') continue;
    const pts = simplify(geomPts(e.geometry), 0.6);
    if (pts.length < 2 || !pts.some(p => inBounds(p[0], p[1]))) continue;
    cliffs.push({ n: nm(t.name), pts, k: t.natural === 'cliff' ? 'c' : 'e' });
  }

  const bridges = [];
  for (const e of osm.elements) {
    if (e.type !== 'way') continue;
    const t = e.tags || {};
    if (t.man_made !== 'bridge' || !isClosed(e.geometry)) continue;
    const pts = simplify(geomPts(e.geometry), 0.5);
    if (!pts.some(p => inBounds(p[0], p[1]))) continue;
    bridges.push({ n: nm(t.name), pts: pts.slice(0, -1) });
  }

  const blds = [];
  for (const e of osm.elements) {
    if (e.type === 'node') continue;
    const t = e.tags || {};
    if (!t.building || t.building === 'no' || t.building === 'roof' || t.building === 'construction') continue;
    const rings = e.type === 'way' ? (isClosed(e.geometry) ? [e.geometry.filter(Boolean)] : []) : assemble(e.members, 'outer');
    if (!rings.length) continue;
    const real = simplify(geomReal(rings[0]), 0.4).slice(0, -1);
    if (real.length < 3) continue;
    const ar = Math.abs(area(real));
    if (ar < 30) continue;
    const c = centroid(real);
    const gc = [c[0] * FRAME.h, c[1] * FRAME.h];
    if (!inBounds(gc[0], gc[1], -4)) continue;
    const levels = +(t['building:levels'] || 0) || 0;
    const named = !!(t.name || t.amenity || t.tourism || t.leisure || t.historic);
    blds.push({ e, t, real, ar, c, gc, levels, named, inside: inDistrict(gc[0], gc[1]) });
  }
  const typeRank = t => {
    if (t.amenity === 'townhall' || t.office === 'government' || t.amenity === 'theatre' || t.shop === 'mall' || t.tourism === 'hotel' || t.tourism === 'museum' || t.amenity === 'arts_centre' || t.amenity === 'cinema') return 4;
    if (t.amenity === 'hospital' || t.amenity === 'school' || t.amenity === 'university' || t.amenity === 'college' || t.leisure === 'sports_centre' || t.amenity === 'marketplace') return 3;
    if (t.building === 'apartments' || t.building === 'residential' || t.building === 'commercial' || t.building === 'public' || t.building === 'retail' || t.building === 'dormitory') return 2;
    if (t.building === 'industrial' || t.building === 'warehouse') return 1.5;
    return 1;
  };
  blds.sort((a, b) => (b.inside - a.inside) || (typeRank(b.t) * Math.sqrt(b.ar) * (1 + b.levels * 0.15)) - (typeRank(a.t) * Math.sqrt(a.ar) * (1 + a.levels * 0.15)));

  const placed = [];
  const pHash = new Map();
  const pKey = (x, z) => Math.floor(x / 24) + ',' + Math.floor(z / 24);
  const nearPlaced = (poly) => {
    const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
    const out = new Set();
    for (let x = Math.floor((Math.min(...xs) - 6) / 24); x <= Math.floor((Math.max(...xs) + 6) / 24); x++) for (let z = Math.floor((Math.min(...zs) - 6) / 24); z <= Math.floor((Math.max(...zs) + 6) / 24); z++) for (const b of pHash.get(x + ',' + z) || []) out.add(b);
    return out;
  };
  const register = (b) => {
    const xs = b.hull.map(p => p[0]), zs = b.hull.map(p => p[1]);
    for (let x = Math.floor(Math.min(...xs) / 24); x <= Math.floor(Math.max(...xs) / 24); x++) for (let z = Math.floor(Math.min(...zs) / 24); z <= Math.floor(Math.max(...zs) / 24); z++) { const k = x + ',' + z; if (!pHash.has(k)) pHash.set(k, []); pHash.get(k).push(b); }
  };
  const roadPush = (poly) => {
    let mx = 0, mz = 0, hit = false;
    const segs = new Set();
    for (const p of poly) for (const s of segHash.get(bin(p[0], p[1])) || []) segs.add(s);
    const c = centroid(poly);
    for (const s of segs) {
      const [, qx, qz] = segDist(c[0], c[1], s[0], s[1], s[2], s[3]);
      let worst = 0;
      for (const p of poly) { const [dp] = segDist(p[0], p[1], s[0], s[1], s[2], s[3]); const need = s[4] + 2.5 - dp; if (need > worst) worst = need; }
      if (worst > 0) {
        hit = true;
        let nx = c[0] - qx, nz = c[1] - qz;
        const L = Math.hypot(nx, nz);
        if (L < 1e-3) { const dx = s[2] - s[0], dz = s[3] - s[1], LL = Math.hypot(dx, dz) || 1; nx = -dz / LL; nz = dx / LL; } else { nx /= L; nz /= L; }
        mx += nx * (worst + 0.5); mz += nz * (worst + 0.5);
      }
    }
    return hit ? [mx, mz] : null;
  };
  const onLand = (poly) => poly.every(p => { const v = cover.at(p[0], p[1]); return v !== COVER.water; }) && cover.at(...centroid(poly)) !== COVER.water;
  let stats = { tried: 0, placed: 0, road: 0, overlap: 0, water: 0 };
  for (const b of blds) {
    if (!b.inside && b.ar < 900 && !b.named) continue;
    stats.tried++;
    const longest = Math.max(...b.real.map((p, i) => Math.hypot(p[0] - b.real[(i + 1) % b.real.length][0], p[1] - b.real[(i + 1) % b.real.length][1])));
    const k = longest > 140 ? 0.5 : longest > 90 ? 0.62 : longest > 60 ? 0.75 : longest > 35 ? 0.88 : 1;
    let poly = b.real.map(p => [b.gc[0] + (p[0] - b.c[0]) * k, b.gc[1] + (p[1] - b.c[1]) * k]);
    for (let it = 0; it < 4; it++) {
      const push = roadPush(poly);
      if (!push) break;
      poly = poly.map(p => [p[0] + push[0], p[1] + push[1]]);
    }
    if (roadPush(poly)) { stats.road++; continue; }
    if (!onLand(poly)) { stats.water++; continue; }
    let hull = convexHull(poly);
    let ok = true;
    for (let tries = 0; tries < 3; tries++) {
      ok = true;
      for (const o of nearPlaced(hull)) {
        const ov = polyOverlap(hull, o.hull.map(p => p));
        if (ov > 0 || polyOverlap(hull.map(p => p), o.pad) > 0) {
          ok = false;
          const ca = centroid(hull), cb = centroid(o.hull);
          let dx = ca[0] - cb[0], dz = ca[1] - cb[1];
          const L = Math.hypot(dx, dz) || 1;
          dx /= L; dz /= L;
          const step = Math.min(6, (ov || 2) + 2.5);
          poly = poly.map(p => [p[0] + dx * step, p[1] + dz * step]);
          hull = convexHull(poly);
          break;
        }
      }
      if (ok) break;
    }
    if (!ok || roadPush(poly) || !onLand(poly)) { stats.overlap++; continue; }
    const cpoly = centroid(hull);
    const pad = hull.map(p => { const dx = p[0] - cpoly[0], dz = p[1] - cpoly[1], L = Math.hypot(dx, dz) || 1; return [p[0] + dx / L * 2.2, p[1] + dz / L * 2.2]; });
    const rec = { poly, hull, pad, b, k };
    placed.push(rec);
    register(rec);
    stats.placed++;
  }

  const btype = t => {
    if (t.building === 'house' || t.building === 'detached' || t.building === 'semidetached_house' || t.building === 'bungalow') return 'h';
    if (t.building === 'garages' || t.building === 'garage' || t.building === 'shed') return 'g';
    if (t.building === 'industrial' || t.building === 'warehouse' || t.landuse === 'industrial' || t.building === 'service') return 'i';
    if (t.building === 'church' || t.amenity === 'place_of_worship') return 'c';
    if (t.building === 'school' || t.amenity === 'school' || t.amenity === 'kindergarten' || t.building === 'kindergarten' || t.amenity === 'university' || t.amenity === 'college') return 's';
    if (t.building === 'hospital' || t.amenity === 'hospital' || t.amenity === 'clinic') return 'm';
    if (t.building === 'apartments' || t.building === 'residential' || t.building === 'dormitory') return 'a';
    if (t.building === 'ruins') return 'r';
    return 'p';
  };
  const R = v => Math.round(v * 10);
  const flat = pts => { const o = []; let px = 0, pz = 0; pts.forEach((p, i) => { const x = R(p[0]), z = R(p[1]); o.push(i ? x - px : x, i ? z - pz : z); px = x; pz = z; }); return o; };

  const pois = [];
  for (const e of osm.elements) {
    const t = e.tags || {};
    if (!t.name) continue;
    if (!(t.historic || t.tourism || t.natural === 'cave_entrance' || t.natural === 'peak' || t.natural === 'tree' || t.amenity === 'theatre' || t.amenity === 'cinema' || t.amenity === 'townhall' || t.amenity === 'marketplace' || t.place === 'square' || t.leisure === 'park' || t.place === 'islet' || t.place === 'island')) continue;
    let p;
    if (e.type === 'node') p = proj(e.lat, e.lon);
    else if (e.bounds) p = proj((e.bounds.minlat + e.bounds.maxlat) / 2, (e.bounds.minlon + e.bounds.maxlon) / 2);
    else continue;
    if (!inBounds(p[0], p[1])) continue;
    pois.push([nm(t.name), R(p[0]), R(p[1]), t.historic || t.tourism || t.natural || t.amenity || t.place || t.leisure]);
  }

  const dem = loadDem(A.dem);
  const geo = {
    frame: FRAME, bounds: BOUNDS,
    dem,
    cover: { cell: CELL, cols: cover.cols, rows: cover.rows, rle: encodeRLE(cover) },
    names,
    roads: roads.map(r => [r.k, Math.round(r.w * 10), r.n, r.layer, r.bridge, flat(r.pts)]),
    rails: rails.map(r => [r.k, r.layer, r.bridge, flat(r.pts)]),
    cliffs: cliffs.map(c => [c.k, c.n, flat(c.pts)]),
    bridges: bridges.map(b => [b.n, flat(b.pts)]),
    buildings: placed.map(p => {
      const t = p.b.t;
      const lv = p.b.levels || (btype(t) === 'h' ? 1 : btype(t) === 'g' ? 1 : btype(t) === 'i' ? 2 : btype(t) === 'a' ? 5 : 3);
      return [btype(t), lv, nm(t.name), p.b.inside ? 1 : 0, p.b.e.id, flat(p.poly)];
    }),
    district: flat(simplify(distPoly, 2)),
    pois
  };
  const body = '(function (Z) {\n  \'use strict\';\n  Z.GEO = ' + JSON.stringify(geo) + ';\n})(globalThis.FalloutZP = globalThis.FalloutZP || {});\n';
  fs.writeFileSync(A.out, body);
  if (A.report) {
    console.log('cover', cover.cols + 'x' + cover.rows, 'roads', roads.length, 'rails', rails.length, 'cliffs', cliffs.length, 'bridges', bridges.length, 'buildings', placed.length, JSON.stringify(stats), 'pois', pois.length, 'bytes', body.length);
    const kinds = {};
    for (const r of roads) kinds[r.k] = (kinds[r.k] || 0) + 1;
    console.log('road kinds', JSON.stringify(kinds));
  }
}

main();
