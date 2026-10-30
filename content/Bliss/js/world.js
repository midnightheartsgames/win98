'use strict';
// Мир: настройки полёта, палитры, рельеф, раскладка ориентиров, облака, термики, кадры.

// Все «ручки» баланса полёта в одном месте (см. DESIGN.md → «Метрики игрока»).
const TUNING = {
  vMin: 9, vCruise: 16, vBoost: 34,
  gravity: 9.8 * 0.85,     // доля g вдоль траектории: пикирование разгоняет
  drag: 0.0016,            // a = drag * v², предел пикирования ~70 м/с
  cruiseGain: 0.6, boostAccel: 9, brakeDecel: 7,
  mouseSens: 0.0022, keyTurn: 1.3, keyPitch: 0.9,
  yawFollow: 2.2, pitchFollow: 2.6, maxYawRate: 1.0, maxPitchRate: 1.0,
  pitchMax: 1.2, bankMax: 0.96, bankGain: 0.85,
  minClear: 1.8,
  thermalLift: 6.5, thermalRadius: 70,
  ceiling: 850, boundary: 2500,
  fovBase: 60, fovBoost: 16,
};

// Освещение днём и в «золотой час» (награда за полный альбом).
const PALETTES = {
  day: {
    sunDir: v3.norm([-0.55, 0.62, 0.56]), sunCol: [3.1, 2.95, 2.7],
    zenith: [0.014, 0.085, 0.5], skyMid: [0.1, 0.27, 0.74], horizon: [0.36, 0.58, 0.93], haze: [0.58, 0.71, 0.9],
    ambSky: [0.3, 0.42, 0.68], ambGround: [0.16, 0.2, 0.08],
    cloudLit: [1.35, 1.35, 1.38], cloudShade: [0.5, 0.57, 0.72], exposure: 1.0,
  },
  golden: {
    sunDir: v3.norm([-0.78, 0.26, 0.6]), sunCol: [4.0, 2.3, 0.9],
    zenith: [0.04, 0.11, 0.38], skyMid: [0.66, 0.58, 0.5], horizon: [1.3, 0.74, 0.32], haze: [1.0, 0.72, 0.45],
    ambSky: [0.42, 0.34, 0.28], ambGround: [0.2, 0.14, 0.06],
    cloudLit: [1.75, 1.08, 0.62], cloudShade: [0.52, 0.4, 0.44], exposure: 1.15,
  },
};
function mixPalette(t) {
  const a = PALETTES.day, b = PALETTES.golden, o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? v3.lerp(a[k], b[k], t) : lerp(a[k], b[k], t);
  o.sunDir = v3.norm(o.sunDir);
  return o;
}

const WORLD = {
  hmHalf: 2600, hmStep: 10, hmN: 521,      // равномерная сетка высот (центр долины)
  gmHalf: 2560, gmSize: 2048,              // карта земли: тени деревьев, дорога
  hero: [-60, -400],                       // главный холм
  oak: [1300, -150],                       // одинокий дуб
  vineyard: { c: [-1150, 420], u: [0.782, -0.623], v: [0.623, 0.782], halfLen: 220, halfWid: 150, rowStep: 3 },
  wind: v3.norm([1, 0, 0.3]),
  cloudDrift: 0.8,
  roadPts: [[-2700, 900], [-2100, 760], [-1600, 690], [-1250, 650], [-900, 520], [-520, 330], [-200, 240],
    [120, 225], [450, 240], [800, 170], [1100, 60], [1450, 40], [1800, 160], [2200, 330], [2700, 470]],
};

// ---------- рельеф ----------
function vineyardLocal(x, z) {
  const V = WORLD.vineyard, dx = x - V.c[0], dz = z - V.c[1];
  return [dx * V.u[0] + dz * V.u[1], dx * V.v[0] + dz * V.v[1]];
}
function vineyardMask(x, z, soft = 25) {
  const V = WORLD.vineyard, [a, b] = vineyardLocal(x, z);
  return (1 - smoothstep(V.halfLen - soft, V.halfLen + soft, Math.abs(a))) *
    (1 - smoothstep(V.halfWid - soft, V.halfWid + soft, Math.abs(b)));
}
const bump = (x, z, cx, cz, sx, sz) => Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));

function H(x, z) {
  // Мягкие холмы с искажённым доменом — без острых гребней.
  const wx = x + 140 * Noise.n2(x * 0.0011 + 3.1, z * 0.0011 + 7.7);
  const wz = z + 140 * Noise.n2(x * 0.0011 + 11.3, z * 0.0011 + 1.9);
  let h = 30 * Noise.fbm(wx * 0.0013, wz * 0.0013, 4);
  h += 8 * Noise.fbm(x * 0.0042 + 5.3, z * 0.0042 + 9.1, 3);
  h = h > 0 ? h : h * 0.45;
  // Главный холм и стартовый луг: гладко, как на обоях.
  const calm = bump(x, z, 0, -200, 900, 650);
  h *= 1 - 0.9 * calm;
  h += 92 * bump(x, z, -120, -400, 430, 300);
  h += 58 * bump(x, z, 330, -430, 380, 280);
  h += 26 * bump(x, z, -560, -330, 220, 200);
  h += 14 * bump(x, z, 0, -150, 700, 330);          // пологий подъём от луга к гребню
  // Холмы с дубовой рощей на северо-западе — видны в левом провале гребня.
  h += 48 * bump(x, z, -1350, -1150, 420, 380);
  // Пригорок одинокого дуба.
  h += 30 * bump(x, z, WORLD.oak[0], WORLD.oak[1], 170, 170);
  // Виноградники выровнены в пологую плоскость.
  const vm = vineyardMask(x, z, 70);
  if (vm > 0) {
    const [a] = vineyardLocal(x, z);
    h = h * (1 - vm) + (2 + 0.02 * a) * vm;
  }
  // Кольцо гор на границе мира.
  const r = Math.hypot(x, z);
  const ring = smoothstep(2700, 4300, r);
  if (ring > 0) h += ring * (150 + 340 * Noise.ridged(x * 0.0006 + 10, z * 0.0006 - 4, 5));
  return h;
}

// Сетка высот (та же, что в текстуре для травы) и высота земли с интерполяцией как у треугольников меша.
let HM = null;
function buildHeightmap() {
  const N = WORLD.hmN, s = WORLD.hmStep, o = -WORLD.hmHalf;
  HM = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) HM[j * N + i] = H(o + i * s, o + j * s);
  return HM;
}
function groundHeight(x, z) {
  const N = WORLD.hmN, s = WORLD.hmStep;
  const fx = (x + WORLD.hmHalf) / s, fz = (z + WORLD.hmHalf) / s;
  if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return H(x, z);
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
  const h00 = HM[j * N + i], h10 = HM[j * N + i + 1], h01 = HM[(j + 1) * N + i], h11 = HM[(j + 1) * N + i + 1];
  return tx > tz ? h00 + (h10 - h00) * tx + (h11 - h10) * tz : h00 + (h11 - h01) * tx + (h01 - h00) * tz;
}

// Меш рельефа: тензорная сетка, 10 м в центре и геометрически реже к краю. Без трещин между чанками.
function buildTerrainChunks() {
  const inner = [];
  for (let i = -260; i <= 260; i++) inner.push(i * 10);
  const outer = [];
  for (let x = 2600, s = 10; x < 13000;) { s *= 1.045; x += s; outer.push(Math.round(x)); }
  const ax = [...outer.map((v) => -v).reverse(), ...inner, ...outer];
  const n = ax.length;
  const hs = new Float32Array(n * n);
  const N = WORLD.hmN;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = ax[i], z = ax[j];
      const inside = Math.abs(x) <= 2600 && Math.abs(z) <= 2600;
      hs[j * n + i] = inside ? HM[((z + 2600) / 10) * N + (x + 2600) / 10] : H(x, z);
    }
  }
  const C = 64, chunks = [];
  for (let cj = 0; cj < n - 1; cj += C) {
    for (let ci = 0; ci < n - 1; ci += C) {
      const w = Math.min(C, n - 1 - ci) + 1, d = Math.min(C, n - 1 - cj) + 1;
      const data = new Float32Array(w * d * 6);
      let minY = 1e9, maxY = -1e9;
      for (let jj = 0; jj < d; jj++) {
        for (let ii = 0; ii < w; ii++) {
          const i = ci + ii, j = cj + jj, k = (jj * w + ii) * 6;
          const h = hs[j * n + i];
          const il = Math.max(i - 1, 0), ir = Math.min(i + 1, n - 1), jl = Math.max(j - 1, 0), jr = Math.min(j + 1, n - 1);
          const dx = (hs[j * n + ir] - hs[j * n + il]) / (ax[ir] - ax[il]);
          const dz = (hs[jr * n + i] - hs[jl * n + i]) / (ax[jr] - ax[jl]);
          const nl = Math.hypot(dx, 1, dz);
          data[k] = ax[i]; data[k + 1] = h; data[k + 2] = ax[j];
          data[k + 3] = -dx / nl; data[k + 4] = 1 / nl; data[k + 5] = -dz / nl;
          if (h < minY) minY = h; if (h > maxY) maxY = h;
        }
      }
      const idx = new Uint16Array((w - 1) * (d - 1) * 6);
      let p = 0;
      for (let jj = 0; jj < d - 1; jj++) {
        for (let ii = 0; ii < w - 1; ii++) {
          const a = jj * w + ii, b = a + 1, c = a + w, e = c + 1;
          idx[p++] = a; idx[p++] = e; idx[p++] = b;   // диагональ 00→11, как в groundHeight
          idx[p++] = a; idx[p++] = c; idx[p++] = e;
        }
      }
      const x0 = ax[ci], x1 = ax[ci + w - 1], z0 = ax[cj], z1 = ax[cj + d - 1];
      const cx = (x0 + x1) / 2, cy = (minY + maxY) / 2, cz = (z0 + z1) / 2;
      chunks.push({ data, idx, center: [cx, cy, cz], radius: Math.hypot(x1 - x0, maxY - minY, z1 - z0) / 2 });
    }
  }
  return chunks;
}

// ---------- дорога ----------
function roadPolyline() {
  const P = WORLD.roadPts, out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
    for (let t = 0; t < 1; t += 0.05) {
      const t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
function distToPolyline(pts, x, z) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

// ---------- деревья ----------
function buildTrees(road) {
  const rnd = mulberry32(77);
  const trees = [];
  const add = (x, z, s) => {
    const R = (7 + rnd() * 4) * s;
    trees.push({ x, z, y: groundHeight(x, z), R, trunk: (3.2 + rnd() * 1.6) * s, seed: rnd() });
  };
  // Свободные от деревьев зоны: главный холм с лугом (композиция обоев), виноградник, дорога.
  const free = (x, z) =>
    (x > -900 && x < 1000 && z > -950 && z < 300) || vineyardMask(x, z, 40) > 0.01 ||
    distToPolyline(road, x, z) < 14 || Math.hypot(x, z) > 2450;
  add(WORLD.oak[0], WORLD.oak[1], 1.35);                       // одинокий дуб
  for (let k = 0; k < 22; k++) {                                // роща на северо-западе
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 330;
    const x = -1380 + Math.cos(a) * r * 1.2, z = -1120 + Math.sin(a) * r;
    if (!free(x, z)) add(x, z, 0.8 + rnd() * 0.45);
  }
  const V = WORLD.vineyard;                                     // деревья по краю виноградника
  for (let k = 0; k < 7; k++) {
    const a = -V.halfLen + (k / 6) * V.halfLen * 2, b = V.halfWid + 40 + rnd() * 20;
    const x = V.c[0] + V.u[0] * a + V.v[0] * b, z = V.c[1] + V.u[1] * a + V.v[1] * b;
    if (!free(x, z)) add(x, z, 0.75 + rnd() * 0.3);
  }
  for (let tries = 0, placed = 0; placed < 26 && tries < 2000; tries++) { // одиночные дубы по долине
    const x = (rnd() * 2 - 1) * 2300, z = (rnd() * 2 - 1) * 2300;
    if (free(x, z) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 160)) continue;
    add(x, z, 0.7 + rnd() * 0.5); placed++;
  }
  // Кроны: 7–12 «облачков» листвы вокруг центра кроны.
  for (const t of trees) {
    const r2 = mulberry32(Math.floor(t.seed * 1e6));
    // Калифорнийский дуб: широкая приплюснутая крона.
    t.cy = t.y + t.trunk + t.R * 0.35;
    t.blobs = [];
    const n = 10 + Math.floor(r2() * 6);
    for (let i = 0; i < n; i++) {
      const a = r2() * Math.PI * 2, rr = Math.sqrt(r2()) * t.R * 0.85;
      const lift = (1 - rr / t.R) * t.R * 0.35;
      t.blobs.push([t.x + Math.cos(a) * rr, t.cy + lift + (r2() - 0.5) * t.R * 0.3, t.z + Math.sin(a) * rr, t.R * (0.34 + r2() * 0.2)]);
    }
    t.blobs.push([t.x, t.cy + t.R * 0.15, t.z, t.R * 0.5]);
  }
  return trees;
}

// ---------- облака, термики, кадры ----------
function makeCloud(rnd, x, base, z, size, drift) {
  const puffs = [], n = Math.round(10 + size / 7), height = size * (0.55 + rnd() * 0.3);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()), central = 1 - rr;
    const r = size * (0.22 + rnd() * 0.17) * (0.75 + central * 0.55);
    const dy = r * 0.55 + central * height * (0.3 + rnd() * 0.55);
    puffs.push({ dx: Math.cos(a) * rr * size * 0.85, dy, dz: Math.sin(a) * rr * size * 0.6, r, shade: clamp(dy / (height + r * 0.4), 0, 1) });
  }
  return { x, y: base, z, x0: x, size, puffs, drift, fade: 1 };
}

// Облако-арка с «окном» (секретный кадр). Кольцо клубов в вертикальной плоскости.
function makeArch(c, yaw) {
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)], fwd = [-Math.sin(yaw), 0, -Math.cos(yaw)];
  const rnd = mulberry32(4242), puffs = [], Ra = 80;
  const put = (ox, oy, off, r) => puffs.push({ dx: right[0] * ox + fwd[0] * off, dy: oy, dz: right[2] * ox + fwd[2] * off, r,
    shade: clamp((oy + Ra) / (2.3 * Ra), 0, 1) });
  // Неровное кольцо вокруг окна.
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 + (rnd() - 0.5) * 0.15, rr = Ra + (rnd() - 0.5) * 14;
    const oy = Math.sin(a) * rr * 0.85;
    put(Math.cos(a) * rr * 1.12, oy, (rnd() - 0.5) * 30, 24 + rnd() * 16 + (oy < 0 ? 6 : 0));
  }
  // Внешняя масса: окно должно выглядеть дырой в обычном кучевом облаке, а не бубликом.
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2, rr = Ra + 28 + rnd() * 55;
    const oy = Math.sin(a) * rr * 0.75 + 12;
    if (oy < -Ra * 0.75) continue;
    put(Math.cos(a) * rr * 1.2, oy, (rnd() - 0.5) * 55, 26 + rnd() * 22);
  }
  return { x: c[0], y: c[1], z: c[2], x0: c[0], size: 160, puffs, drift: false, fade: 1, arch: true };
}

function buildSky() {
  const rnd = mulberry32(9001), clouds = [];
  // Композиция титульного кадра: облака в верхней левой части, как на обоях.
  for (const [x, y, z, s] of [[-560, 360, -620, 150], [-260, 390, -1150, 120], [170, 420, -900, 70],
    [430, 380, -1350, 95], [760, 440, -760, 80], [-120, 470, -520, 60]]) clouds.push(makeCloud(rnd, x, y, z, s, true));
  const thermals = [
    { x: 260, z: -200, top: 470 },     // над солнечным южным склоном холма
    { x: -700, z: 900, top: 450 },
    { x: 950, z: 650, top: 460 },
  ];
  for (const t of thermals) {
    t.cloud = makeCloud(rnd, t.x, 335, t.z, 120, false);
    clouds.push(t.cloud);
  }
  const archPos = [-950, 400, -1350];
  const archYaw = Math.atan2(-(0 - archPos[0]), -(140 - archPos[2])) + Math.PI; // плоскость арки смотрит на долину
  const arch = makeArch(archPos, archYaw);
  clouds.push(arch);
  for (let tries = 0, placed = 0; placed < 30 && tries < 3000; tries++) {
    const x = (rnd() * 2 - 1) * 4000, z = (rnd() * 2 - 1) * 4000;
    if (x > -900 && x < 900 && z > -1500 && z < 400) continue;     // не ломать титульную композицию
    if (clouds.some((c) => Math.hypot(c.x - x, c.z - z) < 420)) continue;
    clouds.push(makeCloud(rnd, x, 300 + rnd() * 70, z, 60 + rnd() * 110, true));
    placed++;
  }
  return { clouds, thermals, arch, archPos, archYaw };
}

// Видоискатели. Поза кадра = поза съёмки обоев.
function buildFrames(sky) {
  const g = groundHeight;
  const look = (from, to) => {
    const d = v3.sub(to, from), l = v3.len(d);
    return { yaw: Math.atan2(-d[0], -d[2]), pitch: Math.asin(d[1] / l) };
  };
  const frames = [];
  frames.push({ id: 'bliss', name: 'Безмятежность', clue: 'Там, где всё началось.',
    pos: [0, g(0, 60) + 6, 60], yaw: 0, pitch: 0.2, fov: 50, w: 16, h: 9 });
  const oakTop = [WORLD.oak[0], g(...WORLD.oak) + 15, WORLD.oak[1]];
  const p2 = [1185, g(1185, -118) + 4, -118];
  frames.push({ id: 'oak', name: 'Одинокий дуб', clue: 'Старое дерево на восточном пригорке.', pos: p2, ...look(p2, oakTop), fov: 50, w: 16, h: 9 });
  const V = WORLD.vineyard;
  const vx = V.c[0] - V.u[0] * 190 + V.v[0] * 1.5, vz = V.c[1] - V.u[1] * 190 + V.v[1] * 1.5;
  frames.push({ id: 'vine', name: 'Виноградники', clue: 'Где ряды сходятся к холму.',
    pos: [vx, g(vx, vz) + 3.8, vz], yaw: Math.atan2(-V.u[0], -V.u[1]), pitch: 0.04, fov: 55, w: 12, h: 6.75 });
  const t1 = sky.thermals[0];
  const p4 = [t1.x, 520, t1.z + 80];
  frames.push({ id: 'above', name: 'Над облаками', clue: 'Выше облаков, где кружат ястребы.', pos: p4, ...look(p4, sky.archPos), fov: 60, w: 16, h: 9 });
  frames.push({ id: 'window', name: 'Облачное окно', clue: 'Облако, в котором есть окно.',
    pos: sky.archPos.slice(), yaw: sky.archYaw + Math.PI, pitch: -0.12, fov: 60, w: 16, h: 9 });
  for (const f of frames) f.found = false;
  return frames;
}

// Птицы: ястребы кружат в термиках, стайки летают над долиной.
function buildBirds(thermals) {
  const rnd = mulberry32(31), hawks = [], flocks = [];
  for (const t of thermals) {
    for (let i = 0; i < 6; i++) {
      hawks.push({ t, r: 25 + rnd() * 35, h0: 60 + rnd() * 260, phase: rnd() * 6.28, climb: 0.6 + rnd() * 0.8, flap: rnd() * 6.28 });
    }
  }
  for (const [cx, cz, alt] of [[-400, 420, 45], [700, -700, 80], [-1500, -600, 60]]) {
    const birds = [];
    for (let i = 0; i < 14; i++) birds.push({ o: [(rnd() - 0.5) * 18, (rnd() - 0.5) * 6, (rnd() - 0.5) * 18], flap: rnd() * 6.28, w: 0.8 + rnd() * 0.4 });
    flocks.push({ cx, cz, alt, birds, speed: 0.045 + rnd() * 0.02, phase: rnd() * 6.28 });
  }
  return { hawks, flocks };
}
