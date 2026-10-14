(function (FO) {
  'use strict';

  FO.hexRing = function (center, r, fn) {
    if (r === 0) {
      fn(center);
      return;
    }
    let t = FO.hexStep(center, 4, r);
    if (t < 0) return;
    for (let side = 0; side < 6; side++) {
      for (let i = 0; i < r; i++) {
        fn(t);
        const n = FO.hexStep(t, side, 1);
        if (n < 0) return;
        t = n;
      }
    }
  };

  FO.hexLine = function (a, b) {
    const out = [];
    const n = FO.hexDist(a, b);
    if (!n) return [a];
    const [ax, ay] = FO.hexCenter(a);
    const [bx, by] = FO.hexCenter(b);
    let prev = -1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const h = FO.worldHex(ax + (bx - ax) * t + 0.01, ay + (by - ay) * t + 0.01);
      if (h !== prev && h >= 0) out.push(h);
      prev = h;
    }
    return out;
  };

  FO.lightBlockers = function (list) {
    const blocks = new Uint8Array(FO.HEXES);
    for (const o of list) {
      if (o.flags & FO.FLAG.HIDDEN || o.tile < 0) continue;
      const type = FO.pidType(o.pid);
      if ((type === FO.PID.WALL || type === FO.PID.SCENERY) && !(o.flags & FO.FLAG.LIGHT_THRU)) blocks[o.tile] = 1;
    }
    return blocks;
  };

  FO.addLight = function (light, blocks, center, radius, intensity) {
    for (let r = 0; r <= radius; r++) {
      const amount = intensity - Math.floor(intensity * r / (radius + 1));
      if (amount <= 0) break;
      FO.hexRing(center, r, t => {
        if (r > 1) {
          const line = FO.hexLine(center, t);
          for (let i = 1; i < line.length - 1; i++) if (blocks[line[i]]) return;
        }
        light[t] += amount;
      });
    }
  };

  FO.computeLight = function (list, ambient) {
    const light = new Int32Array(FO.HEXES).fill(ambient);
    const blocks = FO.lightBlockers(list);
    for (const o of list) {
      if (o.flags & FO.FLAG.HIDDEN || o.tile < 0 || o.lightRadius <= 0 || o.lightIntensity <= 0) continue;
      FO.addLight(light, blocks, o.tile, Math.min(o.lightRadius, 8), Math.min(o.lightIntensity, FO.LIGHT_FULL));
    }
    return light;
  };
})(globalThis.FO = globalThis.FO || {});
