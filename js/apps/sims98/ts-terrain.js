(function (S) {
  'use strict';
  const M = S.METRICS;
  const SIDE = M.town + 1;
  const ROAD_HALF = 2;

  const mix = (x, z, seed) => {
    let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 1013904223);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const noise = (x, z, seed) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = mix(ix, iz, seed), b = mix(ix + 1, iz, seed), c = mix(ix, iz + 1, seed), d = mix(ix + 1, iz + 1, seed);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  };

  const fbm = (x, z, seed, octaves) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      sum += noise(x * f, z * f, seed + i * 17) * amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  };

  const shoreAt = (x, z, seed) => {
    const south = 556 + (noise(x / 64, 3.5, seed + 3) - 0.5) * 60 - z;
    const east = 604 + (noise(z / 48, 9.5, seed + 5) - 0.5) * 40 - x;
    const edge = Math.min(x, z);
    return Math.min(south, east, edge - 8);
  };

  const heightOf = (x, z, seed) => {
    const shore = shoreAt(x, z, seed);
    if (shore <= 0) return Math.max(-6, shore * 0.12);
    const north = S.smooth(190, 40, z) * (10 + fbm(x / 40, z / 40, seed + 7, 4) * 26);
    const dx = x - 130, dz = z - 330;
    const hill = Math.exp(-(dx * dx + dz * dz) / (2 * 62 * 62)) * 15;
    const land = 0.7 + (fbm(x / 36, z / 36, seed + 11, 3) - 0.45) * 1.6 + north + hill;
    return shore * 0.08 + (land - shore * 0.08) * S.smooth(6, 30, shore);
  };

  const ROADS = [
    [60, 170, 600, 170], [80, 290, 570, 290], [60, 440, 590, 440],
    [320, 170, 320, 530], [180, 170, 180, 440], [470, 170, 470, 510],
    [180, 440, 100, 360], [470, 510, 540, 440]
  ];

  const paintRoad = (paint, r) => {
    const [x0, z0, x1, z1] = r;
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
    const horizontal = z0 === z1;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + Math.sign(x1 - x0) * i, z = z0 + Math.sign(z1 - z0) * i;
      for (let o = -ROAD_HALF - 1; o <= ROAD_HALF; o++) {
        const kind = o === -ROAD_HALF - 1 || o === ROAD_HALF ? S.PAINT.walk : S.PAINT.road;
        const px = horizontal ? x : x + o, pz = horizontal ? z + o : z;
        if (px < 0 || pz < 0 || px >= M.town || pz >= M.town) continue;
        const at = px + pz * M.town;
        if (kind === S.PAINT.road || paint[at] !== S.PAINT.road) paint[at] = kind;
      }
    }
  };

  S.Terrain = {
    ROADS,
    create(seed) {
      const heights = new Float32Array(SIDE * SIDE);
      for (let z = 0; z < SIDE; z++) {
        for (let x = 0; x < SIDE; x++) heights[x + z * SIDE] = heightOf(x, z, seed);
      }
      const paint = new Uint8Array(M.town * M.town);
      for (let z = 0; z < M.town; z++) {
        for (let x = 0; x < M.town; x++) {
          const h = heights[x + z * SIDE], e = heights[x + 1 + z * SIDE], s = heights[x + (z + 1) * SIDE];
          const slope = Math.max(Math.abs(e - h), Math.abs(s - h));
          let kind = S.PAINT.grass;
          if (h < 0) kind = S.PAINT.seabed;
          else if (h < 0.55) kind = S.PAINT.sand;
          else if (slope > 0.9) kind = S.PAINT.rock;
          else if (z < 190 && noise(x / 18, z / 18, seed + 13) > 0.42) kind = S.PAINT.forest;
          else if (noise(x / 24, z / 24, seed + 19) > 0.6) kind = S.PAINT.meadow;
          paint[x + z * M.town] = kind;
        }
      }
      for (const r of ROADS) paintRoad(paint, r);
      const n = M.town / M.chunk;
      const chunks = new Float32Array(n * n * 2);
      for (let cz = 0; cz < n; cz++) {
        for (let cx = 0; cx < n; cx++) {
          let low = Infinity, high = -Infinity;
          for (let z = cz * M.chunk; z <= (cz + 1) * M.chunk; z++) {
            for (let x = cx * M.chunk; x <= (cx + 1) * M.chunk; x++) {
              const h = heights[x + z * SIDE];
              if (h < low) low = h;
              if (h > high) high = h;
            }
          }
          chunks[(cx + cz * n) * 2] = low;
          chunks[(cx + cz * n) * 2 + 1] = high;
        }
      }
      return { size: M.town, side: SIDE, seed, heights, paint, chunks };
    },

    heightAt(t, x, z) {
      const fx = S.clamp(x, 0, M.town - 0.001), fz = S.clamp(z, 0, M.town - 0.001);
      const ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
      const a = t.heights[ix + iz * SIDE], b = t.heights[ix + 1 + iz * SIDE];
      const c = t.heights[ix + (iz + 1) * SIDE], d = t.heights[ix + 1 + (iz + 1) * SIDE];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    },

    paintAt(t, x, z) {
      const ix = Math.floor(x), iz = Math.floor(z);
      if (ix < 0 || iz < 0 || ix >= M.town || iz >= M.town) return S.PAINT.seabed;
      return t.paint[ix + iz * M.town];
    },

    isOpenLand(t, x, z) {
      const p = S.Terrain.paintAt(t, x, z);
      return p !== S.PAINT.seabed && p !== S.PAINT.road && p !== S.PAINT.walk && p !== S.PAINT.sand;
    },

    colors(t) {
      const data = new Uint8Array(M.town * M.town * 4);
      for (let i = 0; i < t.paint.length; i++) {
        const c = S.PAINT_COLORS[t.paint[i]];
        data[i * 4] = c[0] * 255;
        data[i * 4 + 1] = c[1] * 255;
        data[i * 4 + 2] = c[2] * 255;
        data[i * 4 + 3] = 255;
      }
      return data;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
