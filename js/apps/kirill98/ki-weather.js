(function (K) {
  'use strict';

  const KINDS = Object.freeze(['clear', 'cloudy', 'overcast', 'rain', 'storm']);
  const NAMES = Object.freeze({ clear: 'ясно', cloudy: 'облачно', overcast: 'пасмурно', rain: 'дождь', storm: 'гроза', fog: 'туман' });
  const LOOK = Object.freeze({
    clear: { cloud: 0.12, rain: 0, storm: 0, wind: 0.2 },
    cloudy: { cloud: 0.45, rain: 0, storm: 0, wind: 0.35 },
    overcast: { cloud: 0.82, rain: 0, storm: 0, wind: 0.5 },
    rain: { cloud: 0.95, rain: 0.65, storm: 0, wind: 0.6 },
    storm: { cloud: 1, rain: 1, storm: 1, wind: 0.95 }
  });
  const SPELL = 3, BLEND = 0.5, FIRST = Object.freeze([0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 2, 2, 1, 1]);
  const NEXT = Object.freeze([[0.62, 0.38, 0, 0, 0], [0.32, 0.4, 0.28, 0, 0], [0, 0.36, 0.34, 0.3, 0], [0, 0, 0.5, 0.3, 0.2], [0, 0, 0.35, 0.55, 0.1]]);
  const MIST_DAY = 0.4, DOUSE = 0.8, WIND_PUSH = 1.4, WIND_DROP = 0.25, BOLT_EVERY = 7;

  const hash = (...a) => {
    let h = 2166136261;
    for (const v of a) { h ^= Math.floor(v) + 0x9e3779b9; h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; }
    return (h >>> 0) / 4294967296;
  };
  const smooth = (a, b, x) => { const t = K.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const chains = new Map();
  function spell(seed, n) {
    let c = chains.get(seed);
    if (!c) { c = FIRST.slice(); chains.set(seed, c); }
    while (c.length <= n) {
      const k = c.length, row = NEXT[c[k - 1]], r = hash(seed, k, 11);
      let acc = 0, pick = row.length - 1;
      for (let i = 0; i < row.length; i++) { acc += row[i]; if (r < acc) { pick = i; break; } }
      c.push(pick);
    }
    return c[Math.max(0, n)];
  }

  function mistOf(seed, day, hour) {
    if (day <= 2 || hash(seed, day, 77) >= MIST_DAY) return 0;
    const dawn = spell(seed, ((day - 1) * 24 + 3) / SPELL);
    if (dawn >= 3) return 0;
    return (0.6 + 0.4 * hash(seed, day, 78)) * smooth(2.5, 5, hour) * (1 - smooth(7.5, 11.5, hour));
  }

  function windDir(seed, a) {
    const d = Math.floor(a / 24), f = smooth(0, 1, a / 24 - d), a0 = hash(seed, d, 31) * Math.PI * 2, a1 = hash(seed, d + 1, 31) * Math.PI * 2;
    let dA = a1 - a0;
    if (dA > Math.PI) dA -= Math.PI * 2;
    if (dA < -Math.PI) dA += Math.PI * 2;
    const ang = a0 + dA * f;
    return [Math.cos(ang), Math.sin(ang)];
  }

  function look(seed, a) {
    const n = Math.floor(a / SPELL), f = a / SPELL - n, now = LOOK[KINDS[spell(seed, n)]], was = LOOK[KINDS[spell(seed, n - 1)]];
    const early = smooth(0, BLEND * 0.7, f), late = smooth(BLEND * 0.4, BLEND, f), rising = now.rain > was.rain;
    const tCloud = rising || now.cloud > was.cloud ? early : late, tRain = rising ? late : early;
    return {
      kind: KINDS[spell(seed, f < BLEND / 2 ? n - 1 : n)],
      cloud: K.lerp(was.cloud, now.cloud, tCloud),
      rain: K.lerp(was.rain, now.rain, tRain),
      storm: K.lerp(was.storm, now.storm, tRain),
      wind: K.lerp(was.wind, now.wind, early)
    };
  }

  function sample(seed, day, hour, force) {
    const a = ((day || 1) - 1) * 24 + (hour || 0), L = force && LOOK[force] ? Object.assign({ kind: force }, LOOK[force]) : look(seed, a);
    let wet = L.rain;
    if (!force) for (let k = 1; k <= 6; k++) wet = Math.max(wet, look(seed, a - k * 0.5).rain * (1 - k / 7));
    const mist = force === 'fog' ? 1 : force ? 0 : mistOf(seed, day || 1, hour || 0);
    const dir = windDir(seed, a), kind = force === 'fog' ? 'cloudy' : L.kind;
    const base = force === 'fog' ? LOOK.cloudy : L;
    return {
      kind, name: mist > 0.35 ? NAMES.fog : NAMES[kind], cloud: base.cloud, rain: base.rain, storm: base.storm, wind: base.wind,
      windDir: dir, wet: K.clamp(wet, 0, 1), mist
    };
  }

  const cache = new WeakMap();
  function at(S) {
    const seed = S.seed || 0, day = S.day || 1, min = Math.floor((S.hour || 0) * 60), force = S.wxForce || null, c = cache.get(S);
    if (c && c.min === min && c.day === day && c.seed === seed && c.force === force) return c.wx;
    const wx = sample(seed, day, min / 60, force);
    cache.set(S, { seed, day, min, force, wx });
    return wx;
  }

  const lowCache = new WeakMap(), LOW_CELL = 16;
  function lowland(T) {
    let L = lowCache.get(T);
    if (L) return L;
    const n = Math.ceil(T.SIZE / LOW_CELL), D = new Float32Array(n * n).fill(1e9), Q = [];
    const log = K.Places.SPOTS.find(s => s.id === 'log');
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * LOW_CELL, z = (j + 0.5) * LOW_CELL;
      if (T.waterAt(x, z) > -Infinity || (log && Math.hypot(x - log.at[0], z - log.at[1]) < log.r)) { D[j * n + i] = 0; Q.push(j * n + i); }
    }
    for (let q = 0; q < Q.length; q++) {
      const k = Q[q], i = k % n, j = (k - i) / n;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= n || b >= n) continue;
        const m = b * n + a;
        if (D[m] > D[k] + LOW_CELL) { D[m] = D[k] + LOW_CELL; Q.push(m); }
      }
    }
    L = { n, D };
    lowCache.set(T, L);
    return L;
  }

  function lowAt(T, x, z) {
    const L = lowland(T), i = K.clamp(Math.floor(x / LOW_CELL), 0, L.n - 1), j = K.clamp(Math.floor(z / LOW_CELL), 0, L.n - 1);
    return 1 - smooth(20, 170, L.D[j * L.n + i]);
  }

  const mistAt = (T, wx, x, z) => wx.mist ? wx.mist * (0.35 + 0.65 * lowAt(T, x, z)) : 0;
  const sight = (wx, mist) => (1 - 0.28 * wx.rain - 0.14 * wx.storm) * (1 - 0.55 * (mist || 0));
  const hearing = wx => 1 - 0.2 * wx.rain - 0.15 * wx.storm;

  function sheltered(pos) {
    for (const B of K.Places.BUILDINGS) {
      if (B.wild) continue;
      const r = (B.rot || 0) * Math.PI / 180, dx = pos[0] - B.x, dz = pos[2] - B.z, u = dx * Math.cos(r) + dz * Math.sin(r), v = -dx * Math.sin(r) + dz * Math.cos(r);
      if (Math.abs(u) < B.w / 2 && Math.abs(v) < B.d / 2) return true;
    }
    return false;
  }

  const douses = (wx, pos) => wx.rain >= DOUSE && !sheltered(pos);
  const camps = wx => wx.storm >= 0.5;

  function arrow(wx) {
    const s = wx.wind * wx.wind * smooth(0.4, 0.8, wx.wind);
    return { push: [wx.windDir[0] * s * WIND_PUSH, wx.windDir[1] * s * WIND_PUSH], drop: 1 + WIND_DROP * smooth(0.5, 0.95, wx.wind) };
  }

  function bolt(seed, time, wx) {
    if (wx.storm < 0.3) return null;
    const n = Math.floor(time / BOLT_EVERY);
    for (const k of [n, n - 1]) {
      if (hash(seed, k, 51) > wx.storm * 0.85) continue;
      const t0 = (k + hash(seed, k, 52) * 0.8) * BOLT_EVERY, age = time - t0;
      if (age < 0 || age > BOLT_EVERY) continue;
      const ang = hash(seed, k, 53) * Math.PI * 2, dist = 250 + hash(seed, k, 54) * 2200;
      return { id: k, age, dir: [Math.cos(ang), Math.sin(ang)], dist, seed: hash(seed, k, 55) };
    }
    return null;
  }

  const flashOf = b => b && b.age < 0.6 ? Math.max(0, 1 - b.age / 0.12) * 0.8 + (b.age > 0.18 && b.age < 0.34 ? 0.55 : 0) : 0;

  function apply(D, wx, mist, flash) {
    const grey = c => { const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return [l, l * 1.01, l * 1.04]; };
    const g = K.clamp((wx.cloud - 0.45) / 0.55, 0, 1) * 0.75 + wx.rain * 0.2, dark = 1 - 0.32 * wx.rain - 0.18 * wx.storm;
    const blend = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    D.zenith = blend(D.zenith, grey(D.zenith), g).map(c => c * dark);
    D.horizon = blend(D.horizon, grey(D.horizon), g).map(c => c * (1 - 0.22 * wx.rain - 0.12 * wx.storm));
    D.light = D.light.map(c => c * (1 - 0.45 * wx.rain - 0.15 * wx.storm));
    D.ambient = D.ambient.map(c => c * (1 - 0.15 * wx.rain));
    D.sunFog = D.sunFog.map(c => c * (1 - wx.cloud * 0.8));
    D.sun = D.sun.map(c => c * (1 - smooth(0.6, 1, wx.cloud) * 0.9));
    if (mist > 0) {
      const day = 1 - D.night, white = [0.8 * day + 0.07, 0.82 * day + 0.08, 0.83 * day + 0.1];
      D.horizon = blend(D.horizon, white, mist * 0.75);
      D.sunFog = D.sunFog.map(c => c * (1 + mist));
    }
    D.fogFar *= (1 - 0.5 * wx.rain - 0.12 * wx.storm) * (1 - 0.78 * (mist || 0));
    if (flash > 0) {
      const f = flash * (0.5 + 0.5 * D.night);
      D.light = D.light.map(c => c + 0.9 * f);
      D.ambient = D.ambient.map(c => c + 0.35 * f);
      D.horizon = D.horizon.map(c => c + 0.25 * f);
      D.zenith = D.zenith.map(c => c + 0.3 * f);
    }
    D.cloud = wx.cloud;
    D.rain = wx.rain;
    D.storm = wx.storm;
    D.wet = wx.wet;
    D.wind = [wx.windDir[0], wx.windDir[1], wx.wind];
    D.flash = flash || 0;
    return D;
  }

  K.Weather = { KINDS, NAMES, LOOK, SPELL, DOUSE, spell, sample, at, lowAt, mistAt, sight, hearing, sheltered, douses, camps, arrow, bolt, flashOf, apply };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
