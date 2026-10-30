(function (H) {
  'use strict';
  const T = H.TERRAIN;

  const create = (w, h, fills) => ({
    v: 1, w, h, levels: fills.length, next: 1, objs: [],
    ter: fills.map(id => new Array(w * h).fill(H.TERRAIN_INDEX[id])),
    road: fills.map(() => new Array(w * h).fill(0))
  });
  const inside = (M, c, r) => c >= 0 && r >= 0 && c < M.w && r < M.h;
  const idx = (M, c, r) => r * M.w + c;
  const terrainAt = (M, l, c, r) => T[M.ter[l][idx(M, c, r)]];
  const roadAt = (M, l, c, r) => M.road[l][idx(M, c, r)];
  const groundCost = (M, l, c, r) => {
    const road = roadAt(M, l, c, r);
    return road ? H.ROADS[road].cost : terrainAt(M, l, c, r).cost;
  };
  const paint = (M, l, id, test) => {
    const v = H.TERRAIN_INDEX[id];
    for (let r = 0; r < M.h; r++) for (let c = 0; c < M.w; c++) if (test(c, r)) M.ter[l][idx(M, c, r)] = v;
  };
  const line = (pts, fn) => {
    for (let i = 1; i < pts.length; i++) {
      let [c, r] = pts[i - 1];
      const [c1, r1] = pts[i];
      fn(c, r);
      while (c !== c1 || r !== r1) {
        c += Math.sign(c1 - c);
        r += Math.sign(r1 - r);
        fn(c, r);
      }
    }
  };
  const road = (M, l, kind, pts) => line(pts, (c, r) => { if (inside(M, c, r)) M.road[l][idx(M, c, r)] = kind; });

  const add = (M, o) => {
    const obj = Object.assign({ id: M.next++, l: 0 }, o);
    M.objs.push(obj);
    return obj;
  };
  const type = o => H.OBJ[o.t];
  const cells = o => {
    const f = type(o).foot, out = [];
    for (let r = 0; r < f[1]; r++) for (let c = 0; c < f[0]; c++) out.push([o.c + c, o.r + r]);
    return out;
  };
  const entry = o => {
    const e = type(o).entry;
    return e ? [o.c + e[0], o.r + e[1]] : null;
  };

  H.MapData = { create, inside, idx, terrainAt, roadAt, groundCost, paint, line, road, add, type, cells, entry };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
