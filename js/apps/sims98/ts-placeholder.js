(function (S) {
  'use strict';
  const { K, N } = S.DEPTH;
  const FACE_NONE = 0, FACE_TOP = 1, FACE_LEFT = 2, FACE_RIGHT = 3;
  const SHADE = [0, 1.12, 0.92, 0.66];
  const OUTLINE_FROM = 32;
  const OUTLINE = 0.6;

  S.KINDS = [
    { id: 'chair', w: 1, d: 1, h: 0.9, tone: [0.62, 0.55, 0.47] },
    { id: 'table', w: 2, d: 1, h: 0.8, tone: [0.66, 0.52, 0.38] },
    { id: 'sofa', w: 3, d: 1, h: 0.9, tone: [0.52, 0.56, 0.68] },
    { id: 'bed', w: 2, d: 3, h: 0.7, tone: [0.7, 0.62, 0.66] },
    { id: 'fridge', w: 1, d: 1, h: 2, tone: [0.82, 0.84, 0.86] },
    { id: 'counter', w: 1, d: 1, h: 0.9, tone: [0.72, 0.7, 0.62] },
    { id: 'shelf', w: 2, d: 1, h: 2.1, tone: [0.56, 0.46, 0.36] },
    { id: 'lamp', w: 1, d: 1, h: 1.7, tone: [0.86, 0.8, 0.56] },
    { id: 'bench', w: 2, d: 1, h: 0.6, tone: [0.6, 0.52, 0.44] },
    { id: 'car', w: 2, d: 4, h: 1.4, tone: [0.62, 0.3, 0.28] },
    { id: 'bush', w: 1, d: 1, h: 0.8, tone: [0.3, 0.5, 0.26] },
    { id: 'hedge', w: 1, d: 1, h: 1.2, tone: [0.26, 0.45, 0.24] },
    { id: 'pine', w: 1, d: 1, h: 5, tone: [0.2, 0.38, 0.24] },
    { id: 'tree', w: 2, d: 2, h: 6, tone: [0.28, 0.48, 0.24] },
    { id: 'fence', w: 1, d: 0.1, h: 1, tone: [0.76, 0.76, 0.72] },
    { id: 'wall', w: 1, d: 0.2, h: 2.75, tone: [0.78, 0.74, 0.66] }
  ];
  S.KIND_ID = {};
  S.KINDS.forEach((k, i) => { S.KIND_ID[k.id] = i; });
  S.SHADOW_ROW = S.ZOOMS.length * 4;
  S.SPRITE_ROWS = S.SHADOW_ROW * 2;
  S.spriteRow = (kind, zoom, turn, shadow) => kind * S.SPRITE_ROWS + (shadow ? S.SHADOW_ROW : 0) + zoom * 4 + turn;

  const halves = (kind, turn) => (turn % 2 ? [kind.d / 2, kind.w / 2] : [kind.w / 2, kind.d / 2]);

  S.Placeholder = {
    size(kind, zoom, turn) {
      const T = S.ZOOMS[zoom].tile, H = S.heightPx(zoom, 1), [hx, hz] = halves(kind, turn), reach = hx + hz;
      const left = Math.floor(-reach * T / 2), right = Math.ceil(reach * T / 2);
      const top = Math.floor(-reach * T / 4 - kind.h * H), bottom = Math.ceil(reach * T / 4);
      const dMin = -K * reach - N * kind.h, dMax = K * reach;
      return { w: right - left, h: bottom - top, ox: left, oy: top, dMin, dMax };
    },

    box(kind, zoom, turn) {
      const T = S.ZOOMS[zoom].tile, s = S.Placeholder.size(kind, zoom, turn), [hx, hz] = halves(kind, turn);
      const [, b, , d] = S.TURNS[turn];
      const color = new Uint8Array(s.w * s.h * 4), data = new Uint8Array(s.w * s.h * 4), faces = new Uint8Array(s.w * s.h);
      const strip = -kind.d / 2 + Math.min(0.25, kind.d * 0.25), range = s.dMax - s.dMin;
      const tmaxY = 0, tminY = -kind.h / N;
      for (let py = 0; py < s.h; py++) {
        const sum = 4 * (s.oy + py + 0.5) / T;
        for (let px = 0; px < s.w; px++) {
          const diff = 2 * (s.ox + px + 0.5) / T;
          const rx0 = (sum + diff) / 2, rz0 = (sum - diff) / 2;
          const inX = (rx0 - hx) / K, outX = (rx0 + hx) / K, inZ = (rz0 - hz) / K, outZ = (rz0 + hz) / K;
          let t = tminY, face = FACE_TOP;
          if (inX > t) { t = inX; face = FACE_RIGHT; }
          if (inZ > t) { t = inZ; face = FACE_LEFT; }
          if (t > Math.min(outX, outZ, tmaxY)) continue;
          const at = px + py * s.w, D = -K * sum + t;
          faces[at] = face;
          const depth = Math.round((D - s.dMin) / range * 255);
          let shade = SHADE[face];
          if (face === FACE_TOP) {
            const rx = rx0 - K * t, rz = rz0 - K * t, lz = b * rx + d * rz;
            if (lz < strip) shade *= 1.14;
          }
          const q = at * 4;
          color[q] = Math.min(255, kind.tone[0] * shade * 255);
          color[q + 1] = Math.min(255, kind.tone[1] * shade * 255);
          color[q + 2] = Math.min(255, kind.tone[2] * shade * 255);
          color[q + 3] = 255;
          data[q + 2] = Math.min(63, Math.round(shade * 40)) << 2;
          data[q + 3] = depth;
        }
      }
      if (T >= OUTLINE_FROM) {
        for (let py = 0; py < s.h; py++) {
          for (let px = 0; px < s.w; px++) {
            const at = px + py * s.w, f = faces[at];
            if (f === FACE_NONE) continue;
            const edge = px === 0 || py === 0 || px === s.w - 1 || py === s.h - 1 || faces[at - 1] !== f || faces[at + 1] !== f || faces[at - s.w] !== f || faces[at + s.w] !== f;
            if (!edge) continue;
            const q = at * 4;
            color[q] *= OUTLINE;
            color[q + 1] *= OUTLINE;
            color[q + 2] *= OUTLINE;
          }
        }
      }
      return { w: s.w, h: s.h, ox: s.ox, oy: s.oy, dMin: s.dMin, dMax: s.dMax, color, data };
    },

    rows(only) {
      const list = [];
      S.KINDS.forEach((kind, k) => {
        if (kind.model || (only && !only.includes(kind.id))) return;
        for (let zoom = S.ZOOMS.length - 1; zoom >= 0; zoom--) {
          for (let turn = 0; turn < 4; turn++) list.push({ row: S.spriteRow(k, zoom, turn, false), kind, zoom, turn });
        }
      });
      return list;
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
