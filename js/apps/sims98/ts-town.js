(function (S) {
  'use strict';
  const M = S.METRICS, H = S.House;
  const LIVE_RADIUS = 60, LIVE_KEEP = 70, LIVE_LIMIT = 30, LEVELS_EVERY = 0.5, TICK = 1, PLANS_PER_TICK = 6;
  const CAR_PAINTS = ['#a8352c', '#3c5a8c', '#c8c2a8', '#3e6048'], CAR_COLORS = CAR_PAINTS.length;
  const RIDE_PAINTS = { bus: '#e2ac1c', carpool: '#e8e4da', police: '#22325e', fire: '#c42a22', pizza: '#e0781c', repair: '#6a6e74' };
  S.RIDES = Object.fromEntries(Object.keys(RIDE_PAINTS).map((id, i) => [id, CAR_COLORS + i]));
  const BLEND_BAND = 8, ON_LOT_WEIGHT = 1e9, TOWN_TREES = 900, TOWN_BUSHES = 300, LANE = 1.1, PEOPLE = 95, GUITAR_VALUE = 120;

  const LOTS = [
    { id: 'main', kind: 'home', x: 326, z: 296, w: 34, d: 32, sample: 0 },
    { id: 'next', kind: 'home', x: 364, z: 296, w: 20, d: 18, sample: 1 },
    { id: 'lot2', kind: 'home', x: 326, z: 258, w: 30, d: 26, bw: 12, bd: 9, door: 's' },
    { id: 'lot3', kind: 'home', x: 360, z: 258, w: 30, d: 26, bw: 13, bd: 10, door: 's' },
    { id: 'lot4', kind: 'home', x: 394, z: 296, w: 30, d: 26, bw: 12, bd: 10, door: 'n' },
    { id: 'shop', kind: 'shop', name: 'Магазин', x: 286, z: 296, w: 28, d: 26, bw: 18, bd: 14, door: 'n', closed: true },
    { id: 'office', kind: 'work', name: 'Контора', x: 286, z: 258, w: 28, d: 26, bw: 20, bd: 16, door: 's', closed: true, floors: 3 },
    { id: 'park', kind: 'park', name: 'Парк', x: 240, z: 296, w: 40, d: 30, water: [['pond', 12.5, 10, 0], ['creek', 31, 17, 0]] },
    { id: 'lot8', kind: 'home', x: 330, z: 406, w: 28, d: 28, bw: 12, bd: 9, door: 's' },
    { id: 'lot9', kind: 'home', x: 362, z: 406, w: 28, d: 28, bw: 11, bd: 9, door: 's' },
    { id: 'lot10', kind: 'home', x: 330, z: 446, w: 28, d: 28, bw: 13, bd: 10, door: 'n' },
    { id: 'school', kind: 'school', name: 'Школа', x: 270, z: 446, w: 40, d: 30, bw: 26, bd: 16, door: 'n', closed: true, floors: 2 },
    { id: 'beach', kind: 'park', name: 'Пляж', x: 400, z: 446, w: 40, d: 30, paint: 'sand' },
    { id: 'lot13', kind: 'home', x: 186, z: 200, w: 26, d: 26, bw: 12, bd: 10, door: 'w' },
    { id: 'lot14', kind: 'home', x: 186, z: 240, w: 26, d: 26, bw: 11, bd: 10, door: 'w' },
    { id: 'lot15', kind: 'home', x: 146, z: 200, w: 26, d: 26, bw: 12, bd: 9, door: 'e' },
    { id: 'lot16', kind: 'home', x: 476, z: 200, w: 28, d: 26, bw: 13, bd: 10, door: 'w' },
    { id: 'lot17', kind: 'home', x: 476, z: 240, w: 28, d: 26, bw: 12, bd: 10, door: 'w' },
    { id: 'plant', kind: 'work', name: 'Склад', x: 436, z: 200, w: 30, d: 30, bw: 22, bd: 18, door: 'e', closed: true, floors: 2 },
    { id: 'lot19', kind: 'home', x: 436, z: 240, w: 30, d: 26, bw: 12, bd: 10, door: 'e' },
    { id: 'cityhall', kind: 'work', name: 'Ратуша', x: 332, z: 176, w: 26, d: 24, bw: 18, bd: 14, door: 'n', closed: true, floors: 2 },
    { id: 'hospital', kind: 'work', name: 'Больница', x: 508, z: 176, w: 26, d: 24, bw: 20, bd: 14, door: 'n', closed: true, floors: 3 },
    { id: 'police', kind: 'work', name: 'Участок', x: 552, z: 176, w: 26, d: 24, bw: 16, bd: 12, door: 'n', closed: true, floors: 2 },
    { id: 'lab', kind: 'work', name: 'Лаборатория', x: 216, z: 176, w: 26, d: 24, bw: 18, bd: 12, door: 'n', closed: true, floors: 2 },
    { id: 'base', kind: 'work', name: 'База', x: 40, z: 176, w: 26, d: 24, bw: 20, bd: 14, door: 'n', closed: true, floors: 1 },
    { id: 'stadium', kind: 'work', name: 'Стадион', x: 72, z: 176, w: 26, d: 24, bw: 22, bd: 18, door: 'n', closed: true, floors: 2 },
    { id: 'theatre', kind: 'work', name: 'Театр', x: 104, z: 176, w: 26, d: 24, bw: 18, bd: 16, door: 'n', closed: true, floors: 2 },
    { id: 'bistro', kind: 'work', name: 'Бистро', x: 324, z: 204, w: 26, d: 24, bw: 14, bd: 10, door: 'w', closed: true, floors: 1 },
    { id: 'diner', kind: 'work', name: 'Закусочная', x: 284, z: 200, w: 26, d: 24, bw: 14, bd: 10, door: 'e', closed: true, floors: 1 },
    { id: 'books', kind: 'work', name: 'Книжная', x: 284, z: 228, w: 26, d: 24, bw: 12, bd: 10, door: 'e', closed: true, floors: 1 },
    { id: 'spa', kind: 'work', name: 'Спа', x: 220, z: 256, w: 26, d: 24, bw: 16, bd: 12, door: 's', closed: true, floors: 1 },
    { id: 'crypt', kind: 'work', name: 'Склеп', x: 252, z: 256, w: 26, d: 24, bw: 10, bd: 8, door: 's', closed: true, floors: 1 }
  ];

  const GRAY = [
    { pattern: 'siding', colors: ['#bdbcb4', '#77766f', '#b0afa7'] },
    { pattern: 'plaster', colors: ['#c8c5b8', '#bbb8ab'] },
    { pattern: 'carpet', colors: ['#8f8d84', '#85837a'] },
    { pattern: 'brick', colors: ['#7f7a72', '#a8a59c', '#716c64'] },
    { pattern: 'solid', colors: ['#5f5b53'] },
    { pattern: 'solid', colors: ['#aaa89f'] },
    { pattern: 'solid', colors: ['#d8d6cc'] },
    { pattern: 'shingle', colors: ['#6f6c66', '#46443f', '#615e58'] },
    { pattern: 'gravel', colors: ['#88867e', '#74726a', '#9a988f'] },
    { pattern: 'plaster', colors: ['#a4a8a6', '#989c9a'] }
  ];
  const FORMS = ['hip', 'gable', 'gableCross', 'halfHip', 'pyramid', 'mansard', 'shed'];
  const BOX_LAMP = [1, 0.86, 0.66];

  const FIRST_M = ['Артём', 'Борис', 'Глеб', 'Денис', 'Егор', 'Иван', 'Кирилл', 'Лев', 'Макар', 'Никита', 'Олег', 'Павел', 'Роман', 'Семён', 'Тимофей', 'Фёдор', 'Юрий', 'Яков', 'Степан', 'Марк'];
  const FIRST_F = ['Алина', 'Вера', 'Галина', 'Дарья', 'Елена', 'Жанна', 'Зоя', 'Инна', 'Ксения', 'Лидия', 'Мария', 'Нина', 'Ольга', 'Полина', 'Рита', 'Софья', 'Таисия', 'Юлия', 'Яна', 'Ева'];
  const SKINS = ['#efd4bc', '#e8c2a4', '#dcae8c', '#c08f6c', '#8f6446', '#6a4830'];
  const HAIRS = ['#2a2228', '#3e2a1c', '#6a4426', '#a8743a', '#c49a58', '#7c7c7c'];
  const EYES = ['#3c5a7c', '#3f6e52', '#50504a', '#5c4028'];
  const SHIRTS = ['#55789f', '#b0504a', '#d09a3e', '#7ea85a', '#8a6aa8', '#c8c2b0', '#4a7a78', '#a8784a', '#3e3a48', '#c87a8a'];
  const TROUSERS = ['#3c4458', '#4c4a5a', '#4a6a5a', '#5a6a8a', '#2e2c36', '#6a5a4a', '#7a7468'];
  const SHOES = ['#2c2622', '#38282a', '#3a3030', '#1e1c20', '#c8c2b0'];

  const hourMin = (h, m) => h * 60 + (m || 0);

  const pickOf = (list, rng) => list[Math.floor(S.roll(rng) * list.length)];

  const flattenLots = (t, specs) => {
    const side = t.side, count = side * side, weight = new Float32Array(count), sum = new Float32Array(count), keep = new Float32Array(count).fill(1), band = BLEND_BAND;
    const bases = specs.map(lot => Math.max(0.75, Math.round(S.Terrain.heightAt(t, lot.x + lot.w / 2, lot.z + lot.d / 2) * 4) / 4));
    specs.forEach((lot, i) => {
      for (let z = Math.max(0, lot.z - band); z <= Math.min(M.town, lot.z + lot.d + band); z++) {
        for (let x = Math.max(0, lot.x - band); x <= Math.min(M.town, lot.x + lot.w + band); x++) {
          const dx = Math.max(lot.x - x, x - lot.x - lot.w, 0), dz = Math.max(lot.z - z, z - lot.z - lot.d, 0), d = Math.max(dx, dz);
          const k = S.smooth(0, band, d), at = x + z * side, w = d > 0 ? (1 - k) / (d * d) : ON_LOT_WEIGHT;
          weight[at] += w;
          sum[at] += w * bases[i];
          keep[at] = Math.min(keep[at], k);
        }
      }
      for (let z = lot.z; z < lot.z + lot.d; z++) {
        for (let x = lot.x; x < lot.x + lot.w; x++) t.paint[x + z * t.size] = S.PAINT[lot.paint || 'grass'];
      }
    });
    for (let at = 0; at < count; at++) {
      if (!weight[at]) continue;
      const base = sum[at] / weight[at];
      t.heights[at] = base + (t.heights[at] - base) * keep[at];
    }
    return bases;
  };

  const refreshChunks = (t, houses) => {
    const n = M.town / M.chunk, side = t.side;
    for (let cz = 0; cz < n; cz++) {
      for (let cx = 0; cx < n; cx++) {
        let low = Infinity, high = -Infinity;
        for (let z = cz * M.chunk; z <= (cz + 1) * M.chunk; z++) {
          for (let x = cx * M.chunk; x <= (cx + 1) * M.chunk; x++) {
            const v = t.heights[x + z * side];
            if (v < low) low = v;
            if (v > high) high = v;
          }
        }
        for (const h of houses) {
          if (h.x <= (cx + 1) * M.chunk && h.x + h.w >= cx * M.chunk && h.z <= (cz + 1) * M.chunk && h.z + h.d >= cz * M.chunk) {
            high = Math.max(high, H.floorY(h, h.floors.length));
          }
        }
        t.chunks[(cx + cz * n) * 2] = low;
        t.chunks[(cx + cz * n) * 2 + 1] = high;
      }
    }
  };

  const boxHouse = (doc, spec, base, index) => {
    const h = H.create({
      id: spec.id, x: spec.x, z: spec.z, w: spec.w, d: spec.d, base, lift: M.foundationStep, styles: GRAY,
      paints: { outside: spec.closed ? 2 : 1, cap: 5, band: 6, trim: 7, foundation: 4, flat: 9, stair: 3 },
      roof: { form: spec.closed ? 'flat' : FORMS[index % FORMS.length], style: 8 }
    });
    const x0 = Math.floor((spec.w - spec.bw) / 2), z0 = Math.floor((spec.d - spec.bd) / 2), x1 = x0 + spec.bw, z1 = z0 + spec.bd, floors = spec.floors || 1;
    for (let k = 0; k < floors; k++) {
      H.addRoom(h, k, x0, z0, x1, z1);
      const id = H.roomAt(h, k, x0 + 1.5, z0 + 1.5);
      H.paintRoom(h, k, id, 10);
      H.floorRoom(h, k, id, 3);
      H.addLamp(h, k, (x0 + x1) / 2, (z0 + z1) / 2, 1, BOX_LAMP);
    }
    const midX = Math.floor((x0 + x1) / 2), midZ = Math.floor((z0 + z1) / 2);
    const side = { n: [midX, z0, midX + 1, z0, 0, -1], s: [midX, z1, midX + 1, z1, 0, 1], w: [x0, midZ, x0, midZ + 1, -1, 0], e: [x1, midZ, x1, midZ + 1, 1, 0] }[spec.door];
    const model = doc.models.door, seg = H.addOpening(h, 0, side[0], side[1], side[2], side[3], 'door', model.cut, false);
    H.addSegItem(h, 'm_door', 0, seg);
    const glass = doc.models.window;
    for (let k = 0; k < floors; k++) {
      for (let x = x0 + 1; x < x1 - 1; x += 3) {
        for (const z of [z0, z1]) {
          const wall = H.wallAt(h, k, x, z, x + 1, z);
          if (wall && !wall.cut) H.addSegItem(h, 'm_window', k, H.addOpening(h, k, x, z, x + 1, z, 'window', glass.cut, glass.glass));
        }
      }
      for (let z = z0 + 1; z < z1 - 1; z += 3) {
        for (const x of [x0, x1]) {
          const wall = H.wallAt(h, k, x, z, x, z + 1);
          if (wall && !wall.cut) H.addSegItem(h, 'm_window', k, H.addOpening(h, k, x, z, x, z + 1, 'window', glass.cut, glass.glass));
        }
      }
    }
    const inner = spec.door === 'n' ? [side[0] + 0.5, side[1] + 0.5] : spec.door === 's' ? [side[0] + 0.5, side[1] - 0.5] : spec.door === 'w' ? [side[0] + 0.5, side[1] + 0.5] : [side[0] - 0.5, side[1] + 0.5];
    const outer = spec.door === 'n' ? [side[0] + 0.5, side[1] - 0.5] : spec.door === 's' ? [side[0] + 0.5, side[1] + 0.5] : spec.door === 'w' ? [side[0] - 0.5, side[1] + 0.5] : [side[0] + 0.5, side[1] + 0.5];
    return { h, inner, outer };
  };

  const decorate = (lot, rng) => {
    const h = lot.house, count = lot.kind === 'park' ? 12 : 3;
    for (let i = 0; i < count; i++) {
      const x = 1 + Math.floor(S.roll(rng) * (lot.w - 2)), z = 1 + Math.floor(S.roll(rng) * (lot.d - 2));
      if (h.floors.length && H.roomAt(h, 0, x + 0.5, z + 0.5) > 0) continue;
      H.addItem(h, S.roll(rng) < 0.6 ? 'm_tree' : 'm_bush', 0, x + 0.5, z + 0.5, Math.floor(S.roll(rng) * 4)).outdoor = true;
    }
  };

  const waterTiles = (kind, x, z) => {
    const k = S.KINDS[S.KIND_ID['m_' + kind]], out = [];
    for (let dz = -Math.ceil(k.d / 2); dz <= Math.ceil(k.d / 2); dz++) {
      for (let dx = -Math.ceil(k.w / 2); dx <= Math.ceil(k.w / 2); dx++) out.push([Math.floor(x + dx), Math.floor(z + dz)]);
    }
    return out;
  };

  const clearPath = (h, tiles) => {
    h.items = h.items.filter(item => !(item.outdoor && tiles.some(([x, z]) => Math.floor(item.x) === x && Math.floor(item.z) === z)));
  };

  const makeRoads = () => {
    const raw = S.Terrain.ROADS, nodes = [], index = new Map(), edges = [];
    const nodeOf = (x, z) => {
      const key = Math.round(x * 10) + ':' + Math.round(z * 10);
      if (!index.has(key)) {
        index.set(key, nodes.length);
        nodes.push([x, z]);
        edges.push([]);
      }
      return index.get(key);
    };
    const cross = (a, b) => {
      const [x1, z1, x2, z2] = a, [x3, z3, x4, z4] = b, d = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
      if (Math.abs(d) < 1e-9) return null;
      const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / d, u = ((x1 - x3) * (z1 - z2) - (z1 - z3) * (x1 - x2)) / d;
      if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
      return [x1 + t * (x2 - x1), z1 + t * (z2 - z1), t];
    };
    const segments = [];
    raw.forEach((r, i) => {
      const stops = [[r[0], r[1], 0], [r[2], r[3], 1]];
      raw.forEach((o, j) => {
        if (i === j) return;
        const p = cross(r, o);
        if (p) stops.push(p);
      });
      stops.sort((p, q) => p[2] - q[2]);
      for (let k = 0; k < stops.length - 1; k++) {
        const a = nodeOf(stops[k][0], stops[k][1]), b = nodeOf(stops[k + 1][0], stops[k + 1][1]);
        if (a === b) continue;
        const len = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]);
        edges[a].push([b, len]);
        edges[b].push([a, len]);
        segments.push([a, b]);
      }
    });
    return {
      nodes, edges, segments,

      nearest(x, z) {
        let best = null;
        for (const [a, b] of segments) {
          const [ax, az] = nodes[a], [bx, bz] = nodes[b], dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz;
          const t = S.clamp(((x - ax) * dx + (z - az) * dz) / len2, 0, 1), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(px - x, pz - z);
          if (!best || d < best.d) best = { x: px, z: pz, a, b, d, t };
        }
        return best;
      },

      route(from, to) {
        const count = nodes.length, dist = new Float64Array(count).fill(Infinity), prev = new Int32Array(count).fill(-1), done = new Uint8Array(count);
        const startCost = [[from.a, Math.hypot(nodes[from.a][0] - from.x, nodes[from.a][1] - from.z)], [from.b, Math.hypot(nodes[from.b][0] - from.x, nodes[from.b][1] - from.z)]];
        for (const [n, c] of startCost) {
          dist[n] = c;
          prev[n] = -2;
        }
        for (let step = 0; step < count; step++) {
          let u = -1;
          for (let i = 0; i < count; i++) {
            if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
          }
          if (u < 0) break;
          done[u] = 1;
          for (const [v, len] of edges[u]) {
            if (dist[u] + len < dist[v]) {
              dist[v] = dist[u] + len;
              prev[v] = u;
            }
          }
        }
        const endA = dist[to.a] + Math.hypot(nodes[to.a][0] - to.x, nodes[to.a][1] - to.z), endB = dist[to.b] + Math.hypot(nodes[to.b][0] - to.x, nodes[to.b][1] - to.z);
        const sameEdge = (from.a === to.a && from.b === to.b) || (from.a === to.b && from.b === to.a);
        if (sameEdge) return shiftLane([[from.x, from.z], [to.x, to.z]]);
        if (endA === Infinity && endB === Infinity) return [];
        const chain = [];
        for (let n = endA <= endB ? to.a : to.b; n >= 0; n = prev[n]) chain.push([nodes[n][0], nodes[n][1]]);
        chain.reverse();
        return shiftLane([[from.x, from.z], ...chain, [to.x, to.z]]);
      }
    };
  };

  const shiftLane = line => {
    const out = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
      const p = [line[i][0] - dz / len * LANE, line[i][1] + dx / len * LANE];
      if (!out.length || Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) > 0.1) out.push(p);
    }
    return out;
  };

  const lookFor = (sex, rng) => ({
    sex, skin: pickOf(SKINS, rng), hair: pickOf(HAIRS, rng), eyes: pickOf(EYES, rng), shirt: pickOf(SHIRTS, rng), trousers: pickOf(TROUSERS, rng), shoes: pickOf(SHOES, rng),
    sleeve: S.roll(rng) < 0.5 ? 'short' : 'long', legs: S.roll(rng) < 0.25 ? 'short' : 'long'
  });

  const dayFor = (sim, world, rng) => {
    const jobs = world.lots.filter(l => l.kind === 'work'), shops = world.lots.filter(l => l.kind === 'shop'), parks = world.lots.filter(l => l.kind === 'park'), school = world.lots.find(l => l.kind === 'school');
    const home = sim.home, jitter = () => Math.floor(S.roll(rng) * 45), day = [[0, home]];
    const free = () => (S.roll(rng) < 0.5 ? pickOf(parks, rng) : pickOf(shops, rng));
    if (sim.age === 'toddler') return day;
    if (sim.age === 'child' || sim.age === 'teen') {
      day.push([hourMin(7, 30) + jitter(), school], [hourMin(15) + jitter(), S.roll(rng) < 0.4 ? pickOf(parks, rng) : home], [hourMin(18) + jitter(), home]);
    } else if (S.roll(rng) < 0.75) {
      day.push([hourMin(8) + jitter(), pickOf(jobs, rng)], [hourMin(17) + jitter(), S.roll(rng) < 0.35 ? free() : home], [hourMin(19) + jitter(), home]);
    } else {
      day.push([hourMin(10) + jitter(), free()], [hourMin(12, 30) + jitter(), home], [hourMin(16) + jitter(), free()], [hourMin(18) + jitter(), home]);
    }
    return day;
  };

  const planOf = (sim, day) => (!S.Jobs.workdayOf(day) && sim.rest ? sim.rest : sim.day);

  const placeOf = (world, place, rng) => {
    if (place.kind === 'park') {
      const nav = place.nav;
      for (let i = 0; i < 12; i++) {
        const x = 1 + Math.floor(S.roll(rng) * (place.w - 2)), z = 1 + Math.floor(S.roll(rng) * (place.d - 2));
        if (nav.isFree(0, x, z)) return { x: place.x + x + 0.5, z: place.z + z + 0.5, floor: 0, lot: place, enter: null };
      }
    }
    return { x: place.doorOut[0], z: place.doorOut[1], floor: 0, lot: place, enter: place };
  };

  const dayIndexAt = (day, minute) => {
    let index = 0;
    for (let i = 0; i < day.length; i++) {
      if (minute >= day[i][0]) index = i;
    }
    return index;
  };

  S.Town = {
    LOTS, LIVE_RADIUS, LIVE_LIMIT, CAR_COLORS, PEOPLE, dayIndexAt, makeRoads, planOf,

    create(doc, seed) {
      S.Sample.registerKinds(doc);
      const terrain = S.Terrain.create(seed), rng = { rs: (seed * 7919 + 13) >>> 0 };
      const samples = S.Sample.houses(doc), lots = [], styleRows = S.Sample.STYLES.slice(), bases = flattenLots(terrain, LOTS);
      LOTS.forEach((spec, index) => {
        const lot = { index, id: spec.id, kind: spec.kind, name: spec.name || '', closed: !!spec.closed, x: spec.x, z: spec.z, w: spec.w, d: spec.d };
        lot.base = bases[index];
        if (spec.sample !== undefined) {
          const h = samples[spec.sample];
          h.base = lot.base;
          lot.house = h;
          const front = h.items.find(i => i.kind === 'm_door' && (i.seg.z0 === i.seg.z1) && H.sideRooms(h, h.floors[0], i.seg).includes(0));
          lot.doorOut = [spec.x + front.x, spec.z + front.z + 0.6];
          lot.doorIn = [spec.x + front.x, spec.z + front.z - 0.6];
        } else if (spec.kind === 'park') {
          lot.house = H.create({ id: spec.id, x: spec.x, z: spec.z, w: spec.w, d: spec.d, base: lot.base, styles: GRAY, paints: { outside: 1, cap: 5, band: 6, trim: 7, foundation: 4, flat: 9, stair: 3 }, roof: { form: 'flat', style: 8 } });
          H.floorOf(lot.house, 0);
          lot.doorOut = [spec.x + spec.w / 2, spec.z + spec.d / 2];
          lot.doorIn = lot.doorOut;
        } else {
          const { h, inner, outer } = boxHouse(doc, spec, lot.base, index);
          lot.house = h;
          lot.doorIn = [spec.x + inner[0], spec.z + inner[1]];
          lot.doorOut = [spec.x + outer[0], spec.z + outer[1]];
          decorate(lot, rng);
          clearPath(h, [[Math.floor(outer[0]), Math.floor(outer[1])]]);
        }
        if (spec.kind === 'park') decorate(lot, rng);
        if (spec.water) {
          for (const [kind, x, z, facing] of spec.water) {
            clearPath(lot.house, waterTiles(kind, x, z));
            H.addItem(lot.house, 'm_' + kind, 0, x, z, facing).outdoor = true;
          }
        }
        lots.push(lot);
      });
      const houses = lots.map(l => l.house);
      refreshChunks(terrain, houses);
      const surfaceRows = new Map();
      for (const h of houses) {
        if (!surfaceRows.has(h.styles)) {
          const first = styleRows.length;
          for (const s of h.styles) styleRows.push([s]);
          surfaceRows.set(h.styles, first);
        }
        const first = surfaceRows.get(h.styles);
        h.rowOf = h.styles.map((_, i) => first + i);
      }
      const carRows = [];
      for (const color of CAR_PAINTS.concat(Object.values(RIDE_PAINTS))) {
        carRows.push(styleRows.length);
        styleRows.push([{ pattern: 'solid', colors: [color] }]);
      }
      const items = [], blocked = [], lotCell = new Uint8Array(M.town * M.town);
      for (const lot of lots) {
        for (let z = lot.z; z < lot.z + lot.d; z++) {
          for (let x = lot.x; x < lot.x + lot.w; x++) lotCell[x + z * M.town] = 1;
        }
        const h = lot.house;
        for (const item of h.items) {
          const y = item.outdoor ? undefined : H.floorY(h, item.floor);
          items.push([item.kind, h.x + item.x, h.z + item.z, item.facing | (item.floor << 2), y, item]);
        }
      }
      const place = (kind, count) => {
        for (let done = 0, tries = 0; done < count && tries < count * 200; tries++) {
          const x = 8 + Math.floor(S.roll(rng) * (M.town - 16)), z = 8 + Math.floor(S.roll(rng) * (M.town - 16)), at = x + z * M.town;
          if (lotCell[at] || !S.Terrain.isOpenLand(terrain, x + 0.5, z + 0.5)) continue;
          const forest = terrain.paint[at] === S.PAINT.forest;
          if (!forest && S.roll(rng) > 0.1) continue;
          lotCell[at] = 1;
          blocked.push([x, z]);
          items.push([kind, x + 0.5, z + 0.5, Math.floor(S.roll(rng) * 4)]);
          done++;
        }
      };
      place('m_tree', TOWN_TREES);
      place('m_bush', TOWN_BUSHES);
      const scene = S.Dummy.pack(terrain, [], items, { rs: seed >>> 0 });
      scene.walkers.length = 0;
      scene.sample = true;
      scene.hasShadows = true;
      scene.houses = houses;
      scene.styleRows = styleRows;
      scene.carRows = carRows;
      scene.styled = [];
      for (const lot of lots) {
        lot.nav = new S.Nav(lot.house);
      }
      for (const h of houses) {
        for (const item of h.items) {
          const kind = S.KINDS[S.KIND_ID[item.kind]];
          if (kind.model === 'sofa' || kind.model === 'chair') scene.styled.push(item.index);
        }
      }
      const ground = new S.TownNav(terrain, lots, blocked);
      const world = {
        terrain, lots, ground, roads: makeRoads(), sims: [], live: [], family: [], events: [], taken: new Map(), doors: [], changed: new Set(), reflag: new Set(), reskin: new Set(), cars: [], funds: S.Sample.MONEY, books: [],
        clock: hourMin(8), day: 1, tickLeft: 0, levelsLeft: 0, rng, seed, focusX: M.town / 2, focusZ: M.town / 2, carRows
      };
      for (const lot of lots) {
        for (const item of lot.house.items) {
          if (item.seg && item.seg.cut && item.seg.cut.y0 === 0) world.doors.push({ item, lot, open: false, x: lot.x + item.x, z: lot.z + item.z, floor: item.floor });
        }
      }
      const main = lots[0];
      S.Sample.FAMILY.forEach(person => {
        const sim = S.Sim.create(Object.assign({ phase: S.roll(rng), live: true }, person, { x: main.x + person.x, z: main.z + person.z, floor: 0, home: main, hasCar: person.age === 'adult', needs: S.Acts.newNeeds() }));
        sim.lot = main;
        sim.bag = (person.bag || []).map(k => S.Econ.item(k, k, { v: k === 'guitar' ? GUITAR_VALUE : 0 }));
        sim.y = S.Sim.groundY(world, 0, main, sim.x, sim.z);
        world.sims.push(sim);
        S.Moods.add(sim, 'newHome');
        world.family.push(sim);
      });
      const traitRng = { rs: (seed * 104729 + 71) >>> 0 }, jobRng = { rs: (seed * 15485863 + 29) >>> 0 }, planRng = { rs: (seed * 32452843 + 17) >>> 0 };
      const homes = lots.filter(l => l.kind === 'home' && l !== main);
      const ages = ['adult', 'adult', 'adult', 'adult', 'adult', 'teen', 'child', 'child', 'toddler'];
      let n = 0;
      while (world.sims.length < PEOPLE) {
        const home = homes[n % homes.length], age = ages[Math.floor(S.roll(rng) * ages.length)], sex = S.roll(rng) < 0.5 ? 'm' : 'f';
        const name = pickOf(sex === 'm' ? FIRST_M : FIRST_F, rng) + ' ' + (n + 1);
        const sim = S.Sim.create({
          id: 'p' + n, name, age, sex, hair: sex === 'f' || S.roll(rng) < 0.1 ? 'long' : 'short', look: lookFor(sex, rng),
          x: home.doorIn[0], z: home.doorIn[1], floor: 0, yaw: S.roll(rng) * 6, phase: S.roll(rng), home, free: true,
          hasCar: age === 'adult' && S.roll(rng) < 0.6, carColor: Math.floor(S.roll(rng) * CAR_COLORS)
        });
        sim.inside = home;
        sim.lot = home;
        sim.traits = S.Traits.random(traitRng, age);
        sim.y = S.Sim.groundY(world, 0, home, sim.x, sim.z);
        sim.day = dayFor(sim, world, rng);
        sim.work = S.Jobs.assignTown(world, sim, jobRng);
        const plans = S.Jobs.townPlans(world, sim, planRng);
        sim.day = plans.week;
        sim.rest = plans.rest;
        world.sims.push(sim);
        n++;
      }
      world.live = world.sims.filter(s => s.live);
      S.Social.seed(world);
      S.Services.init(world);
      scene.sims = world.sims;
      scene.world = world;
      world.house = main.house;
      return scene;
    },

    setClock(world, minutes) {
      world.clock = ((minutes % S.DAY_MINUTES) + S.DAY_MINUTES) % S.DAY_MINUTES;
      for (const sim of world.sims) sim.dayIndex = -1;
    },

    hour: world => world.clock / 60,

    goalAt(world, x, z, floor, run) {
      const lot = world.ground.lotAt(x, z);
      if (lot && lot.closed) return { x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot, enter: lot, run };
      return { x, z, floor, lot, run };
    },

    syncLevels(world, fx, fz) {
      world.focusX = fx;
      world.focusZ = fz;
      const scored = [];
      for (const sim of world.sims) {
        const family = !sim.free, d = Math.hypot(sim.x - fx, sim.z - fz);
        if (family || d < LIVE_RADIUS || (sim.live && d < LIVE_KEEP)) scored.push([family ? -1 : d, sim]);
      }
      scored.sort((a, b) => a[0] - b[0]);
      const wanted = new Set();
      for (let i = 0; i < scored.length && i < LIVE_LIMIT; i++) wanted.add(scored[i][1]);
      for (const sim of world.sims) {
        if (wanted.has(sim)) S.Sim.toLive(world, sim);
        else S.Sim.toBusiness(world, sim);
      }
      world.live = world.sims.filter(s => s.live);
    },

    tick(world) {
      let plans = 0;
      const minute = world.clock;
      for (const sim of world.sims) {
        if (!sim.day || sim.visit || sim.duty) continue;
        const plan = planOf(sim, world.day);
        const index = dayIndexAt(plan, minute);
        if (index === sim.dayIndex) continue;
        if (plans >= PLANS_PER_TICK) break;
        const place = plan[index][1];
        sim.dayIndex = index;
        if (sim.inside === place) continue;
        plans++;
        S.Sim.go(world, sim, placeOf(world, place, world.rng));
      }
    },

    step(world, dt, fx, fz) {
      world.clock += dt;
      if (world.clock >= S.DAY_MINUTES) {
        world.clock -= S.DAY_MINUTES;
        world.day++;
      }
      world.levelsLeft -= dt;
      if (world.levelsLeft <= 0) {
        world.levelsLeft += LEVELS_EVERY;
        S.Town.syncLevels(world, fx, fz);
      }
      world.tickLeft -= dt;
      if (world.tickLeft <= 0) {
        world.tickLeft += TICK;
        S.Town.tick(world);
      }
      S.Sim.stepAll(world, dt);
      world.cars.length = 0;
      for (const sim of world.sims) {
        if (sim.car) world.cars.push(sim);
      }
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
