(function (F) {
  'use strict';

  const { Batch, C } = F.Models;
  const STRIDE = F.STRIDE, FL = STRIDE / 4;
  const BONES = ['pelvis', 'abd', 'chest', 'neck', 'head', 'uarmL', 'uarmR', 'farmL', 'farmR', 'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR'];
  const B = {};
  BONES.forEach((n, i) => { B[n] = i; });
  const NB = BONES.length, MS = 13;
  const MAT = F.MAT, SKIN_MAT = F.MAT.SKIN = 21;

  const FIG = {
    m: { s: 1, hip: 0.09, pel: [0.165, 0.112], abd: [0.2, 0.148, 0.1], chest: [0.3, 0.178, 0.116], sw: 0.19, neck: [0.09, 0.052], head: [0.079, 0.108, 0.1], arm: [0.31, 0.047, 0.27, 0.037], thigh: [0.44, 0.08], shin: [0.44, 0.053], foot: 0.25, bust: 0 },
    f: { s: 0.94, hip: 0.095, pel: [0.178, 0.114], abd: [0.2, 0.126, 0.092], chest: [0.29, 0.158, 0.104], sw: 0.165, neck: [0.088, 0.045], head: [0.075, 0.104, 0.096], arm: [0.295, 0.04, 0.255, 0.032], thigh: [0.43, 0.081], shin: [0.42, 0.048], foot: 0.23, bust: 0.034 }
  };
  const TORSO = 0.58, LEAN = 0.1, NECK_DIR = [0, 0.985, -0.17];
  const HEAD_C = [0, 0.082, -0.012];

  const SKINS = [['Фарфоровая', '#f2d5c0'], ['Светлая', '#e9c2a2'], ['Тёплая', '#dcab86'], ['Оливковая', '#c99a6e'], ['Смуглая', '#ae7a52'], ['Загорелая', '#8f5f3e'], ['Тёмная', '#6c4430'], ['Глубокая', '#4b2f21']];
  const EYE_COLS = [['Карие', '#5a3418'], ['Тёмно-карие', '#2e1a0e'], ['Ореховые', '#7a5a2a'], ['Зелёные', '#4f7a3a'], ['Голубые', '#4f86b8'], ['Серые', '#7a8790'], ['Янтарные', '#b07a20']];
  const EYES = ['Миндалевидные', 'Круглые', 'Узкие', 'Опущенные уголки'];
  const BROWS = ['Тонкие', 'Обычные', 'Густые', 'Дугой'];
  const MAKEUP = [['none', 'Без макияжа'], ['light', 'Лёгкий'], ['bold', 'Яркий'], ['y2k', 'Тени 1999']];
  const BEARDS = [['none', 'Нет'], ['stubble', 'Щетина'], ['moustache', 'Усы'], ['goatee', 'Эспаньолка'], ['full', 'Борода']];
  const HAIR_COLS = [['Чёрный', '#1c1714'], ['Тёмно-каштановый', '#3a2418'], ['Каштановый', '#6a3e22'], ['Русый', '#8a6a48'], ['Пшеничный', '#c8a468'], ['Платиновый блонд', '#e6dcc0'], ['Рыжий', '#a8461e'], ['Седой', '#a8a8a4'], ['Малиновый Horizon', '#e6146e'], ['Синий', '#2a4ab0']];
  const HAIRS = [['crew', 'Ёжик'], ['short', 'Коротко'], ['boxfringe', 'Бокс с чёлкой'], ['slick', 'Зачёс назад'], ['side', 'Пробор'], ['mullet', 'Маллет'], ['kare', 'Каре'], ['bob', 'Боб'], ['pony', 'Хвост'], ['highpony', 'Высокий хвост'], ['braid', 'Коса'], ['bun', 'Пучок'], ['long', 'Длинные прямые'], ['curly', 'Кудри'], ['dreads', 'Дреды'], ['bald', 'Бритая голова']];
  const FACES = {
    m: [
      { len: 1, jaw: 1, chin: 0.5, cheek: 0.3, brow: 0.6, fore: 1, nose: 1, noseW: 1, lips: 1 },
      { len: 1.06, jaw: 0.92, chin: 0.7, cheek: 0.5, brow: 0.8, fore: 1.03, nose: 1.15, noseW: 0.9, lips: 0.9 },
      { len: 0.95, jaw: 1.1, chin: 0.3, cheek: 0.2, brow: 0.9, fore: 0.97, nose: 0.95, noseW: 1.15, lips: 1.05 },
      { len: 1, jaw: 0.96, chin: 0.9, cheek: 0.7, brow: 0.4, fore: 1, nose: 1.25, noseW: 0.95, lips: 0.85 },
      { len: 0.97, jaw: 1.02, chin: 0.4, cheek: 0.1, brow: 0.5, fore: 1.02, nose: 0.85, noseW: 1.05, lips: 1.1 },
      { len: 1.04, jaw: 1.06, chin: 0.6, cheek: 0.6, brow: 1, fore: 0.98, nose: 1.1, noseW: 1.1, lips: 0.95 }
    ],
    f: [
      { len: 0.98, jaw: 0.9, chin: 0.5, cheek: 0.4, brow: 0.2, fore: 1.02, nose: 0.85, noseW: 0.9, lips: 1.1 },
      { len: 1.03, jaw: 0.86, chin: 0.7, cheek: 0.6, brow: 0.25, fore: 1.03, nose: 0.9, noseW: 0.85, lips: 1 },
      { len: 0.95, jaw: 0.94, chin: 0.35, cheek: 0.3, brow: 0.2, fore: 1, nose: 0.8, noseW: 0.95, lips: 1.15 },
      { len: 1, jaw: 0.88, chin: 0.8, cheek: 0.8, brow: 0.3, fore: 1, nose: 0.95, noseW: 0.9, lips: 1 },
      { len: 0.96, jaw: 0.97, chin: 0.4, cheek: 0.2, brow: 0.15, fore: 1.01, nose: 0.78, noseW: 1, lips: 1.2 },
      { len: 1.02, jaw: 0.92, chin: 0.6, cheek: 0.7, brow: 0.35, fore: 0.99, nose: 1, noseW: 0.95, lips: 0.95 }
    ]
  };
  const { SLOTS, BAND_COLS, ITEMS, ITEM, STARTER, DEFAULT_FIT, normFit, fitList, fitKey } = F.Wear;
  const LONG_TOPS = new Set(['plaid', 'turtle', 'deer', 'hoodie', 'suit']);
  const BULK = { olymp: 1.05, denim: 1.07, windbreaker: 1.08, leather: 1.07, bomber: 1.09, blazer: 1.05, racing: 1.07, vest: 1.04, hoodie: 1.05, deer: 1.03, suit: 1.03 };
  const HEAD_COVER = { cap: 'cap', beanie: 'cap', bandana: 'cap', panama: 'cap', leatherCap: 'helmet', helmetOpen: 'helmet', helmetFull: 'helmet' };



  const HAIRLINE = [[0, 0.92], [0.5, 1], [0.75, 1.2], [1.2, 1.32], [1.75, 1.32], [2.2, 1.85], [Math.PI, 2.1]];
  const STYLE = {
    crew: { t: 0.005 },
    short: { t: 0.011, top: 0.006 },
    boxfringe: { t: 0.004, top: 0.016, fringe: 0.3 },
    slick: { t: 0.009, top: 0.01, lift: 0.018, line: 0.06 },
    side: { t: 0.011, top: 0.008, part: 0.007 },
    mullet: { t: 0.011, top: 0.006, drop: [0, 0, 0.13], dropFrom: 1.9 },
    kare: { t: 0.016, fringe: 0.38, drop: [0, 0.085, 0.075] },
    bob: { t: 0.018, part: 0.006, drop: [0, 0.07, 0.06] },
    pony: { t: 0.008, tail: 'low' },
    highpony: { t: 0.008, tail: 'high' },
    braid: { t: 0.008, tail: 'braid' },
    bun: { t: 0.008, bun: true },
    long: { t: 0.016, drop: [0, 0.2, 0.27] },
    curly: { t: 0.016, curl: 0.012, drop: [0, 0, 0.03], dropFrom: 1.7 },
    dreads: { t: 0.012, dreads: true },
    bald: null
  };
  const HAT_LINE = 1.25, SKULL_END = 1.75;

  const TEX = 256, REG = { head: [0, 0, 256, 128], hair: [0, 128, 128, 64], torso: [128, 128, 128, 64], sleeve: [0, 192, 64, 64], legs: [64, 192, 64, 64], cap: [128, 192, 64, 32], white: [248, 248, 8, 8] };
  const regUV = (r, u, v) => [(r[0] + 1 + F.clamp(u, 0, 1) * (r[2] - 2)) / TEX, (r[1] + 1 + F.clamp(v, 0, 1) * (r[3] - 2)) / TEX];
  const WHITE = regUV(REG.white, 0.5, 0.5);
  const headUV = (th, ph) => regUV(REG.head, 0.5 - ph / (Math.PI * 2), th / Math.PI);

  const v3 = {
    add: (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
    sub: (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2],
    cross: (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    unit: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  };
  const ramp = (a, b, v) => { const t = F.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const table = (tab, a) => {
    for (let i = 1; i < tab.length; i++) if (a <= tab[i][0]) return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * (a - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
    return tab[tab.length - 1][1];
  };
  const valueAt = (v, i, j) => (typeof v === 'function' ? v(i, j) : v);

  function grid(b, P, axis, o) {
    const rows = P.length, n = P[0].length, ids = [], NS = [], open = !!o.open, w = open ? n - 1 : n;
    const left = j => (open ? (j === 0 ? n - 2 : j - 1) : (j + n - 1) % n), right = j => (open ? (j === n - 1 ? 1 : j + 1) : (j + 1) % n);
    for (let i = 0; i < rows; i++) {
      const row = [], nrow = [];
      for (let j = 0; j < n; j++) {
        const p = P[i][j];
        const du = v3.sub(P[i][right(j)], P[i][left(j)]);
        const dv = v3.sub(P[Math.min(rows - 1, i + 1)][j], P[Math.max(0, i - 1)][j]);
        let nr = v3.cross(dv, du);
        if (v3.len(nr) < 1e-9) nr = v3.sub(p, axis(i));
        nr = v3.unit(nr);
        if (v3.dot(nr, v3.sub(p, axis(i))) < 0) nr = v3.mul(nr, -1);
        const uv = o.uv ? o.uv(i, j) : WHITE;
        nrow.push(nr);
        b.need(1, 0);
        row.push(b.v(p[0], p[1], p[2], uv[0], uv[1], nr[0], nr[1], nr[2], valueAt(o.col, i, j), valueAt(o.mat || 0, i, j)));
      }
      ids.push(row);
      NS.push(nrow);
    }
    for (let i = 0; i + 1 < rows; i++) {
      for (let j = 0; j < w; j++) {
        const j1 = open ? j + 1 : (j + 1) % n;
        const a = ids[i][j], c = ids[i][j1], d = ids[i + 1][j1], e = ids[i + 1][j];
        const p0 = P[i][j], p1 = P[i][j1], p2 = P[i + 1][j1], p3 = P[i + 1][j];
        const g = v3.add(v3.cross(v3.sub(p1, p0), v3.sub(p3, p0)), v3.cross(v3.sub(p3, p2), v3.sub(p1, p2)));
        const out = v3.add(v3.add(NS[i][j], NS[i][j1]), v3.add(NS[i + 1][j1], NS[i + 1][j]));
        b.need(0, 6);
        if (v3.dot(g, out) >= 0) b.quadIdx(a, c, d, e); else b.quadIdx(a, e, d, c);
      }
    }
  }

  function tube(b, rings, n, col, mat = 0) {
    const P = rings.map(([y, rx, rz, cz = 0, cx = 0]) => {
      const row = [];
      for (let j = 0; j < n; j++) {
        const t = j / n * Math.PI * 2;
        row.push([cx + Math.cos(t) * rx, y, cz + Math.sin(t) * rz]);
      }
      return row;
    });
    grid(b, P, i => [rings[i][4] || 0, rings[i][0], rings[i][3] || 0], { col: i => rings[i][5] || col, mat: i => (rings[i][6] !== undefined ? rings[i][6] : mat) });
  }

  function blob(b, c, r, nu, nv, col, mat = 0, uv = null) {
    const P = [];
    for (let i = 0; i <= nv; i++) {
      const th = i / nv * Math.PI, row = [];
      for (let j = 0; j < nu; j++) {
        const ph = j / nu * Math.PI * 2;
        const k = Math.max(Math.sin(th), 0.02);
        row.push([c[0] + Math.cos(ph) * r[0] * k, c[1] - Math.cos(th) * r[1], c[2] + Math.sin(ph) * r[2] * k]);
      }
      P.push(row);
    }
    grid(b, P, () => c, { col, mat, uv: uv && (() => uv) });
  }

  function strand(b, pts, radii, n, col, uv, mat = 0) {
    const P = pts.map((p, i) => {
      const t = v3.unit(v3.sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
      let s = v3.cross(t, [0, 0, 1]);
      if (v3.len(s) < 0.2) s = v3.cross(t, [1, 0, 0]);
      s = v3.unit(s);
      const q = v3.cross(s, t), row = [];
      for (let j = 0; j < n; j++) {
        const a = j / n * Math.PI * 2;
        row.push(v3.add(p, v3.add(v3.mul(s, Math.cos(a) * radii[i]), v3.mul(q, Math.sin(a) * radii[i]))));
      }
      return row;
    });
    grid(b, P, i => pts[i], { col, mat, uv: (i, j) => uv(i / (pts.length - 1), j / n) });
  }

  function limb(b, len, r0, r1, n, col, mat = 0) {
    tube(b, [[0, r0 * 0.96, r0 * 0.96], [len * 0.12, r0, r0 * 0.98], [len * 0.55, (r0 + r1) / 2 * 1.02, (r0 + r1) / 2], [len * 0.92, r1, r1 * 0.97], [len, r1 * 0.92, r1 * 0.9]], n, col, mat);
  }

  function normLook(l) {
    l = l || {};
    const body = l.body === 'f' ? 'f' : 'm';
    const pick = (v, n, d) => (Number.isInteger(v) && v >= 0 && v < n ? v : d);
    const has = (list, v) => list.some(e => e[0] === v), fit = fitList(l.fit);
    return {
      body, face: pick(l.face, 6, 0), skin: pick(l.skin, SKINS.length, 1), eyes: pick(l.eyes, EYES.length, 0), eyeCol: pick(l.eyeCol, EYE_COLS.length, 0),
      brows: pick(l.brows, BROWS.length, 1), freckles: !!l.freckles, makeup: has(MAKEUP, l.makeup) ? l.makeup : 'none',
      hair: has(HAIRS, l.hair) ? l.hair : body === 'f' ? 'bob' : 'short', hairCol: pick(l.hairCol, HAIR_COLS.length, 1),
      beard: has(BEARDS, l.beard) ? l.beard : 'none', cover: l.cover === 'cap' || l.cover === 'helmet' ? l.cover : (fit.head && HEAD_COVER[ITEM[fit.head[0]].kind]) || null,
      fit, bandCol: pick(l.bandCol, BAND_COLS.length, 0)
    };
  }
  const rigKey = L => [L.body, L.face, L.skin, L.hair, L.hairCol, L.beard, L.cover, L.bandCol, fitKey(L.fit)].join('|');
  const texKey = L => [L.skin, L.eyes, L.eyeCol, L.brows, L.freckles ? 1 : 0, L.makeup, L.hair, L.hairCol, L.beard, L.cover, L.body, fitKey(L.fit)].join('|');

  function headPt(fig, f, th, ph) {
    const [rx, ry, rz] = fig.head;
    const dx = Math.sin(th) * Math.sin(ph), dy = Math.cos(th), dz = -Math.sin(th) * Math.cos(ph);
    const front = Math.max(0, -dz), low = ramp(-0.05, -0.75, dy);
    const back = Math.max(0, dz);
    let x = rx * dx * (1 - 0.06 * front * front), z = rz * dz * (dz < 0 ? 0.9 : 1.02 + 0.06 * ramp(-0.3, 0.3, dy));
    const y = ry * dy * (dy < 0 ? f.len * 1.06 : (1 + (f.fore - 1) * front) * (1 - 0.05 * ramp(0.6, 1, dy)));
    x *= (1 - 0.2 * low * (0.4 + 0.6 * front) + (f.jaw - 1) * low) * (1 + f.cheek * 0.07 * front * ramp(-0.5, -0.1, dy) * ramp(0.35, 0.05, dy));
    z *= 1 - 0.08 * back * ramp(-0.35, -0.85, dy);
    z -= (0.3 + f.chin) * 0.016 * front * front * front * ramp(-0.55, -0.88, dy);
    z -= f.brow * 0.008 * Math.pow(front, 4) * ramp(0.05, 0.2, dy) * ramp(0.42, 0.25, dy);
    const neck = 1 - 0.42 * ramp(-0.78, -1, dy);
    return [HEAD_C[0] + x * neck, HEAD_C[1] + y, HEAD_C[2] + z * neck];
  }

  function onHead(fig, f, th, ph, out) {
    const p = headPt(fig, f, th, ph), n = v3.unit(v3.sub(p, HEAD_C));
    return v3.add(p, v3.mul(n, out));
  }

  function hairPlan(L, a) {
    const st = STYLE[L.hair];
    if (!st) return { cover: 0, drop: 0 };
    let cover = table(HAIRLINE, a) - (st.line || 0) * ramp(1, 0, a), drop = 0;
    if (st.fringe && a < 0.8) cover = Math.max(cover, 0.92 + st.fringe * (1 - Math.pow(a / 0.8, 6)));
    if (st.drop) {
      const from = st.dropFrom || 0.75;
      drop = a < from ? 0 : a < 1.2 ? st.drop[1] * ramp(from, 1.2, a) : a < 2.2 ? st.drop[1] + (st.drop[2] - st.drop[1]) * ramp(Math.max(1.2, from), 2.2, a) : st.drop[2];
      if (drop > 0.002) cover += (Math.max(cover, SKULL_END) - cover) * ramp(from, from + 0.45, a);
    }
    if (L.cover === 'cap') cover = Math.max(cover, HAT_LINE + 0.05);
    return { cover, drop };
  }

  function hairShell(b, fig, f, L, hc) {
    const st = STYLE[L.hair], NU = 16, R = 10, P = [], UV = [];
    for (let r = 0; r < R; r++) { P.push([]); UV.push([]); }
    for (let j = 0; j <= NU; j++) {
      const ph = -Math.PI + Math.PI * 2 * j / NU, a = Math.abs(ph), plan = hairPlan(L, a);
      const dropping = plan.drop > 0.002, end = dropping ? Math.min(plan.cover, SKULL_END) : plan.cover;
      const arc = end * 0.1, total = arc + (dropping ? plan.drop : 0);
      const thick = th => {
        let t = st.t + (st.top || 0) * ramp(1.2, 0, th) + (st.lift || 0) * ramp(0.7, 0, a) * ramp(1.1, 0.5, th) + (st.part || 0) * Math.sin(ph) * ramp(1.3, 0.2, th);
        if (st.curl) t += st.curl * (0.5 + 0.5 * Math.sin(th * 11 + ph * 7) * Math.sin(ph * 9 - th * 5));
        if (L.cover === 'cap' && th < HAT_LINE) t = Math.min(t, 0.004);
        if (!dropping) t *= Math.max(0.15, ramp(end, end - 0.22, th));
        return Math.max(t, 0.0025);
      };
      for (let r = 0; r < R; r++) {
        const s = r / (R - 1) * total;
        let p;
        if (s <= arc || !dropping) {
          const th = Math.max(0.0001, Math.min(end, s / arc * end));
          p = onHead(fig, f, th, ph, thick(th));
        } else {
          const base = onHead(fig, f, end, ph, thick(end)), d = s - arc, out = v3.unit([base[0] - HEAD_C[0], 0, base[2] - HEAD_C[2]]);
          p = v3.add(base, [out[0] * d * 0.16, -d, out[2] * d * 0.16]);
        }
        P[r].push(p);
        UV[r].push(regUV(REG.hair, j / NU, r / (R - 1)));
      }
    }
    grid(b, P, () => HEAD_C, { open: true, col: hc, uv: (i, j) => UV[i][j] });
  }

  function hairExtras(b, fig, f, L, hc) {
    const st = STYLE[L.hair], hair = (u, v) => regUV(REG.hair, v, u);
    let tail = st.tail;
    if (L.cover === 'helmet' && tail === 'high') tail = 'low';
    if (tail) {
      const high = tail === 'high', root = onHead(fig, f, high ? 0.75 : 1.85, Math.PI, 0.006);
      const len = tail === 'braid' ? 0.3 : 0.24, back = high ? 0.06 : 0.035, pts = [root], radii = [0.02];
      const n = tail === 'braid' ? 9 : 6;
      for (let k = 1; k <= n; k++) {
        const t = k / n, y = high ? -0.02 - len * Math.pow(t, 1.3) : -len * t;
        pts.push(v3.add(root, [0, y + (high ? 0.025 * Math.sin(t * Math.PI) : 0), back * Math.sin(Math.min(1, t * 2) * Math.PI / 2) + 0.012 * t]));
        radii.push(tail === 'braid' ? (k % 2 ? 0.024 : 0.017) * (1 - 0.45 * t) : (0.026 - 0.018 * t) * (k === 1 ? 0.75 : 1));
      }
      strand(b, pts, radii, 6, hc, hair);
      blob(b, v3.add(root, [0, high ? -0.004 : -0.006, 0.006]), [0.014, 0.012, 0.012], 6, 3, C('#1a1a1c'), 0, WHITE);
    }
    if (st.bun && L.cover !== 'helmet') blob(b, onHead(fig, f, L.cover === 'cap' ? 1.6 : 1.1, Math.PI, 0.03), [0.04, 0.036, 0.035], 8, 5, hc, 0, hair(0.3, 0.5));
    if (st.dreads && L.cover !== 'helmet') {
      for (let k = 0; k < 14; k++) {
        const ph = (k % 2 ? 1 : -1) * (0.95 + (Math.PI - 0.95) * Math.floor(k / 2) / 6), a = Math.abs(ph), th = Math.min(table(HAIRLINE, a), SKULL_END) - 0.05;
        const root = onHead(fig, f, th, ph, 0.01), out = v3.unit([root[0] - HEAD_C[0], 0, root[2] - HEAD_C[2]]), len = 0.13 + 0.07 * ((k * 7) % 5) / 4;
        strand(b, [root, v3.add(root, [out[0] * 0.015, -len * 0.5, out[2] * 0.015]), v3.add(root, [out[0] * 0.03, -len, out[2] * 0.03])], [0.011, 0.01, 0.007], 4, hc, hair);
      }
    }
  }

  function patch(b, fig, f, cols, rows, ph0, ph1, thA, thB, t, col) {
    const P = [];
    for (let i = 0; i <= rows; i++) {
      const row = [];
      for (let j = 0; j <= cols; j++) {
        const ph = ph0 + (ph1 - ph0) * j / cols, a = thA(ph), z = thB(ph), th = a + (z - a) * i / rows;
        row.push(onHead(fig, f, th, ph, t(i / rows, j / cols)));
      }
      P.push(row);
    }
    grid(b, P, () => HEAD_C, { open: true, col, uv: (i, j) => regUV(REG.hair, j / cols, i / rows) });
  }

  function beard(b, fig, f, L, hc) {
    const edge = (v, u) => Math.min(1, Math.min(u, 1 - u) * 6) * Math.min(1, Math.min(v, 1 - v) * 5);
    if (L.beard === 'moustache' || L.beard === 'goatee' || L.beard === 'full') patch(b, fig, f, 6, 2, -0.42, 0.42, () => 1.93, ph => 2.03 + 0.08 * ramp(0.2, 0.42, Math.abs(ph)), (v, u) => 0.002 + 0.006 * edge(v, u), hc);
    if (L.beard === 'goatee') patch(b, fig, f, 4, 3, -0.3, 0.3, () => 2.24, () => 2.68, (v, u) => 0.002 + 0.008 * edge(v, u), hc);
    if (L.beard === 'full') patch(b, fig, f, 12, 4, -1.5, 1.5, ph => (Math.abs(ph) < 0.32 ? 2.22 : 1.72 + 0.3 * ramp(1.1, 0.4, Math.abs(ph))), () => 2.78, (v, u) => 0.002 + 0.011 * Math.min(1, Math.min(u, 1 - u) * 8) * Math.min(1, v * 4 + 0.2), hc);
  }

  function face(b, fig, f) {
    const NU = 16, NV = 12, P = [], UV = [];
    for (let i = 0; i <= NV; i++) {
      const th = i / NV * Math.PI, row = [], uv = [];
      for (let j = 0; j <= NU; j++) {
        const ph = -Math.PI + Math.PI * 2 * j / NU;
        row.push(headPt(fig, f, th, ph));
        uv.push(headUV(th, ph));
      }
      P.push(row); UV.push(uv);
    }
    const white = C('#ffffff');
    grid(b, P, () => HEAD_C, { open: true, col: white, mat: SKIN_MAT, uv: (i, j) => UV[i][j] });
    const tri = (p, q, r) => {
      const n = v3.unit(v3.cross(v3.sub(q[0], p[0]), v3.sub(r[0], p[0])));
      const flip = v3.dot(n, v3.sub(p[0], HEAD_C)) < 0, list = flip ? [p, r, q] : [p, q, r], nn = flip ? v3.mul(n, -1) : n;
      b.need(3, 3);
      const ids = list.map(([x, uv]) => { const k = v3.unit(v3.add(nn, v3.mul(v3.unit(v3.sub(x, HEAD_C)), 2.4))); return b.v(x[0], x[1], x[2], uv[0], uv[1], k[0], k[1], k[2], white, SKIN_MAT); });
      b.tri(ids[0], ids[1], ids[2]);
    };
    const pt = (th, ph, out) => [onHead(fig, f, th, ph, out), headUV(th, ph)];
    const nw = 0.12 * f.noseW, tip = 0.02 * f.nose;
    const Bt = pt(1.5, 0, 0.002), T = pt(1.84, 0, tip), Lb = pt(1.9, -nw, 0.002), Rb = pt(1.9, nw, 0.002), U = pt(1.96, 0, tip * 0.35);
    const Lm = pt(1.72, -nw * 0.7, tip * 0.35), Rm = pt(1.72, nw * 0.7, tip * 0.35);
    tri(Bt, Lm, T); tri(Bt, T, Rm); tri(Lm, Lb, T); tri(Rm, T, Rb); tri(Lb, U, T); tri(T, U, Rb);
    for (const s of [-1, 1]) blob(b, onHead(fig, f, 1.62, s * Math.PI / 2, -0.002), [0.009, 0.026, 0.015], 6, 3, white, SKIN_MAT, headUV(1.95, s * 0.6));
  }

  function wrap(b, rings, n, reg) {
    const P = [], UV = [];
    for (const r of rings) {
      const [y, rx, rz, cz = 0, cx = 0] = r, row = [], uv = [];
      for (let j = 0; j <= n; j++) {
        const u = j / n, t = Math.PI / 2 - Math.PI * 2 * u;
        row.push([cx + Math.cos(t) * rx, y, cz + Math.sin(t) * rz]);
        uv.push(r[7] === undefined || r[7] === null || !reg ? WHITE : regUV(reg, u, r[7]));
      }
      P.push(row); UV.push(uv);
    }
    grid(b, P, i => [rings[i][4] || 0, rings[i][0], rings[i][3] || 0], { open: true, col: i => rings[i][5], mat: i => rings[i][6] || 0, uv: (i, j) => UV[i][j] });
  }

  function loop(b, pts, r, col, mat = 0) {
    strand(b, pts.concat([pts[0], pts[1]]), pts.concat([pts[0], pts[1]]).map(() => r), 4, col, () => WHITE, mat);
  }

  function headPatch(b, fig, f, cols, rows, ph0, ph1, thA, thB, out, col, mat, uv) {
    const P = [];
    for (let i = 0; i <= rows; i++) {
      const row = [];
      for (let j = 0; j <= cols; j++) {
        const ph = ph0 + (ph1 - ph0) * j / cols, a = thA(ph), z = thB(ph), th = a + (z - a) * i / rows;
        row.push(onHead(fig, f, th, ph, typeof out === 'function' ? out(th, ph) : out));
      }
      P.push(row);
    }
    grid(b, P, () => HEAD_C, { open: true, col, mat: mat || 0, uv: uv ? (i, j) => uv(j / cols, i / rows) : () => WHITE });
  }

  function hat(b, fig, f, slot) {
    const k = slot.item.kind, col = C(slot.col), white = C('#ffffff'), cap = (u, v) => regUV(REG.cap, 1 - u, v), all = [-Math.PI, Math.PI];
    if (k === 'cap') {
      headPatch(b, fig, f, 16, 5, all[0], all[1], () => 0, () => 1.24, 0.013, white, 0, cap);
      const vis = [];
      for (let i = 0; i <= 6; i++) {
        const ph = -0.78 + 1.56 * i / 6, base = onHead(fig, f, 1.22, ph, 0.013), fw = [Math.sin(ph) * 0.5, 0, -Math.cos(ph)];
        vis.push([base, v3.add(base, [fw[0] * 0.085, -0.02, fw[2] * 0.085 - 0.012])]);
      }
      const P = [vis.map(q => q[0]), vis.map(q => v3.add(q[0], v3.mul(v3.sub(q[1], q[0]), 0.5))), vis.map(q => q[1])];
      grid(b, P, () => v3.add(HEAD_C, [0, -0.2, 0]), { open: true, col, uv: () => WHITE });
      blob(b, onHead(fig, f, 0.02, 0, 0.016), [0.007, 0.004, 0.007], 5, 2, col);
    } else if (k === 'beanie') {
      headPatch(b, fig, f, 16, 5, all[0], all[1], () => 0, () => 1.3, th => 0.018 + 0.006 * ramp(0.4, 0, th), col, 0);
      headPatch(b, fig, f, 16, 1, all[0], all[1], () => 1.22, () => 1.4, 0.023, [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85, 255].map(Math.round), 0);
    } else if (k === 'bandana') {
      headPatch(b, fig, f, 16, 4, all[0], all[1], () => 0, () => 1.24, 0.009, white, 0, (u, v) => regUV(REG.cap, u, v));
      const knot = onHead(fig, f, 1.45, Math.PI, 0.012);
      blob(b, knot, [0.015, 0.012, 0.012], 5, 3, col);
      for (const s of [-1, 1]) strand(b, [knot, v3.add(knot, [s * 0.02, -0.04, 0.012]), v3.add(knot, [s * 0.03, -0.08, 0.016])], [0.01, 0.008, 0.003], 3, col, () => WHITE);
    } else if (k === 'panama') {
      headPatch(b, fig, f, 16, 4, all[0], all[1], () => 0, () => 1.16, 0.016, col, 0);
      const P = [[], []];
      for (let j = 0; j <= 16; j++) {
        const ph = -Math.PI + Math.PI * 2 * j / 16, base = onHead(fig, f, 1.16, ph, 0.016), out = v3.unit([base[0] - HEAD_C[0], 0, base[2] - HEAD_C[2]]);
        P[0].push(base); P[1].push(v3.add(base, [out[0] * 0.055, -0.025, out[2] * 0.055]));
      }
      grid(b, P, () => v3.add(HEAD_C, [0, -0.3, 0]), { open: true, col, uv: () => WHITE });
    } else if (k === 'leatherCap') {
      headPatch(b, fig, f, 16, 6, all[0], all[1], () => 0, ph => (Math.abs(ph) < 0.7 ? 1.15 : Math.abs(ph) < 1.2 ? 1.95 : 1.8), 0.012, col, MAT.TRIM);
      for (const s of [-1, 1]) strand(b, [onHead(fig, f, 1.95, s * 1.1, 0.012), onHead(fig, f, 2.35, s * 0.9, 0.008), onHead(fig, f, 2.5, s * 0.3, 0.006)], [0.004, 0.004, 0.003], 3, col, () => WHITE);
    } else if (k === 'helmetOpen') {
      headPatch(b, fig, f, 18, 8, all[0], all[1], () => 0, ph => (Math.abs(ph) < 0.95 ? 1.28 : Math.abs(ph) < 1.4 ? 1.28 + 0.77 * ramp(0.95, 1.4, Math.abs(ph)) : 2.05), 0.034, white, MAT.TRIM, cap);
      for (const s of [-1, 1]) strand(b, [onHead(fig, f, 2.0, s * 1.35, 0.03), onHead(fig, f, 2.45, s * 0.7, 0.01), onHead(fig, f, 2.6, 0, 0.012)], [0.004, 0.004, 0.004], 3, C('#1a1a1e'), () => WHITE);
    } else if (k === 'helmetFull') {
      headPatch(b, fig, f, 18, 9, all[0], all[1], () => 0, () => 2.72, 0.035, white, MAT.TRIM, cap);
      headPatch(b, fig, f, 8, 2, -0.85, 0.85, () => 1.28, () => 1.78, 0.038, C('#202830'), MAT.LENS);
    }
  }

  function glasses(b, fig, f, slot) {
    const k = slot.item.kind, fr = C(slot.col), metal = /^#[bcd]/.test(slot.col) && k !== 'yellow' ? MAT.CHROME : 0;
    const lensCol = { aviator: '#1e2a22', mirror: '#c8ccd2', yellow: '#e8c020', goggles: '#9ab0a8' }[k];
    const lensMat = k === 'mirror' ? MAT.CHROME : MAT.LENS;
    if (k === 'sport') {
      headPatch(b, fig, f, 8, 2, -0.8, 0.8, ph => 1.34 + 0.06 * Math.abs(ph), ph => 1.6 - 0.02 * Math.abs(ph), 0.022, C('#3a6ad0'), MAT.CHROME);
      headPatch(b, fig, f, 8, 1, -0.82, 0.82, ph => 1.31 + 0.06 * Math.abs(ph), ph => 1.35 + 0.06 * Math.abs(ph), 0.024, fr, 0);
      for (const s of [-1, 1]) strand(b, [onHead(fig, f, 1.38, s * 0.85, 0.02), onHead(fig, f, 1.42, s * 1.35, 0.01)], [0.004, 0.003], 3, fr, () => WHITE);
      return;
    }
    const shape = { aviator: [0.022, 0.018, 0.004], mirror: [0.022, 0.018, 0.004], round: [0.016, 0.016, 0], horn: [0.021, 0.014, 0], yellow: [0.022, 0.015, 0], goggles: [0.019, 0.019, 0] }[k];
    const thick = k === 'horn' ? 0.003 : k === 'goggles' ? 0.005 : 0.0016, out = k === 'goggles' ? 0.022 : 0.016;
    const inner = [];
    for (const s of [-1, 1]) {
      const c = onHead(fig, f, 1.47, s * 0.36, out), pts = [];
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, lowK = Math.sin(a) < 0 ? 1 + shape[2] * 40 : 1;
        pts.push(v3.add(c, [Math.cos(a) * shape[0], Math.sin(a) * shape[1] * lowK, Math.abs(Math.cos(a)) * 0.004 * s * Math.sign(Math.cos(a))]));
      }
      loop(b, pts, thick, fr, metal);
      if (lensCol) {
        b.need(13, 36);
        const cid = b.v(c[0], c[1], c[2], WHITE[0], WHITE[1], 0, 0, -1, C(lensCol), lensMat);
        const ids = pts.map(p => b.v(p[0], p[1], p[2], WHITE[0], WHITE[1], 0, 0, -1, C(lensCol), lensMat));
        for (let i = 0; i < 12; i++) b.tri(cid, ids[(i + 1) % 12], ids[i]);
      }
      inner.push(pts[s < 0 ? 0 : 6]);
      const temple = pts[s < 0 ? 6 : 0];
      if (k !== 'goggles') strand(b, [temple, onHead(fig, f, 1.5, s * 1.1, 0.01), onHead(fig, f, 1.56, s * 1.5, 0.008)], [thick, thick, thick], 3, fr, () => WHITE, metal);
    }
    strand(b, [inner[0], v3.add(v3.mul(v3.add(inner[0], inner[1]), 0.5), [0, 0.006, -0.004]), inner[1]], [thick, thick, thick], 3, fr, () => WHITE, metal);
    if (k === 'goggles') headPatch(b, fig, f, 16, 1, -Math.PI, Math.PI, () => 1.43, () => 1.53, 0.016, fr, MAT.TRIM);
  }

  function neckwear(b, fig, slot, bk) {
    const k = slot.item.kind, col = C(slot.col), [cL, , cz] = fig.chest, nr = fig.neck[1];
    const path = (dip, n) => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, fr = Math.max(0, Math.cos(a)), d = fr * fr;
        const r = nr * 1.3 + (cz * 1.02 * bk + fig.bust * 0.8 + 0.006 - nr * 1.3) * d;
        pts.push([Math.sin(a) * (nr * 1.32 + 0.012 * d), cL - 0.008 - dip * d, -Math.cos(a) * r - 0.004]);
      }
      return pts;
    };
    if (k === 'chain' || k === 'tag') loop(b, path(0.075, 14), 0.0034, col, MAT.CHROME);
    if (k === 'tag') b.box(0, cL - 0.093, -cz * 1.02 * bk - fig.bust * 0.8 - 0.009, 0.014, 0.02, 0.003, col, MAT.CHROME);
    if (k === 'beads') for (const p of path(0.065, 12)) blob(b, p, [0.011, 0.011, 0.011], 4, 2, col, MAT.LENS);
    if (k === 'scarf') {
      loop(b, path(0.015, 10).map(p => [p[0] * 1.05, p[1] + 0.012, p[2] * 1.05]), 0.02, col);
      strand(b, [[-0.045, cL, -nr * 1.2 - 0.02], [-0.06, cL - 0.12, -cz * 0.95 - 0.02], [-0.065, cL - 0.24, -cz - 0.02]], [0.02, 0.018, 0.016], 4, col, () => WHITE);
    }
    if (k === 'phones') {
      const arc = [];
      for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + Math.PI * i / 8; arc.push([Math.sin(a) * nr * 1.5, cL + 0.004, Math.cos(a) * nr * 1.4]); }
      strand(b, arc, arc.map(() => 0.004), 4, col, () => WHITE);
      for (const s of [-1, 1]) blob(b, [s * nr * 1.4, cL + 0.016, -0.03], [0.016, 0.028, 0.028], 6, 3, C(slot.item.cols[1] === slot.col ? '#1a1a1e' : '#c8ccd0'));
    }
  }

  function wristwear(b, len, r, slot, bandCol) {
    if (slot && slot.item.kind === 'watch') {
      const col = C(slot.col), dark = C('#101012');
      loop(b, Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return [Math.cos(a) * (r + 0.003), len * 0.9, Math.sin(a) * (r + 0.003)]; }), 0.0035, dark, MAT.TRIM);
      b.box(0, len * 0.9, r + 0.007, 0.011, 0.011, 0.004, col, slot.col === '#1a1a1e' ? MAT.TRIM : MAT.CHROME);
    } else if (slot && slot.item.kind === 'bracelet') {
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; blob(b, [Math.cos(a) * (r + 0.004), len * 0.88, Math.sin(a) * (r + 0.004)], [0.0055, 0.0055, 0.0055], 4, 2, C(slot.col), MAT.LENS); }
    } else if (bandCol) loop(b, Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return [Math.cos(a) * (r + 0.002), len * 0.9, Math.sin(a) * (r + 0.002)]; }), 0.004, bandCol);
  }

  function rig(look) {
    const L = normLook(look), key = rigKey(L);
    const cached = rig.cache.get(key);
    if (cached) return cached;
    const fig = FIG[L.body], f = FACES[L.body][L.face], fit = normFit(L.fit);
    const sk = C(SKINS[L.skin][1]), hc = C(HAIR_COLS[L.hairCol][1]), white = C('#ffffff');
    const b = new Batch(8192), bones = [];
    b.uvw = WHITE;
    const mark = (k, fn) => { const v0 = b.n; fn(); for (let i = v0; i < b.n; i++) bones[i] = k; };
    const n = 9;
    const top = fit.top.item, outer = fit.outer && fit.outer.item, suit = top.kind === 'suit', legsIt = fit.legs && fit.legs.item;
    const bulk = Math.max(BULK[top.kind] || 1, outer ? BULK[outer.kind] || 1.06 : 1);
    const longSleeve = suit || LONG_TOPS.has(top.kind) || (outer && outer.kind !== 'vest');
    const bare = top.kind === 'tank' && !outer;
    const legMat = (legsIt && (legsIt.kind === 'leatherPants')) ? MAT.TRIM : 0, topMat = outer && outer.kind === 'leather' ? MAT.TRIM : 0;
    const [pr, pz] = fig.pel, [aL, ar, az] = fig.abd, [cL, cr, cz] = fig.chest, sw = fig.sw, bk = bulk;
    const T = (y, rx, rz, cz0, v, mat = topMat) => [y, rx * bk, rz * bk, cz0 || 0, 0, white, mat, v];
    mark(B.pelvis, () => {
      wrap(b, [[-0.1, pr * 0.82, pz * 0.86, 0.01, 0, white, legMat, 0], [-0.05, pr, pz, 0.012, 0, white, legMat, 0.06], [0.04, pr * 0.98, pz * 0.98, 0, 0, white, legMat, 0.14], T(0.1, ar * 1.02, az * 1.02, 0, 0.2)], n, REG.torso);
      if (legsIt && legsIt.kind === 'skirt') wrap(b, [[0.06, pr * 1.03, pz * 1.04, 0.01, 0, white, 0, 0.1], [-0.12, pr * 1.18, pz * 1.2, 0.01, 0, white, 0, 0.3], [-0.3, pr * 1.42, pz * 1.45, 0.01, 0, white, 0, 0.5]], n, REG.legs);
    });
    mark(B.abd, () => wrap(b, [T(0, ar * 1.02, az * 1.02, 0, 0.2), T(aL * 0.5, ar, az, 0, 0.35), T(aL, cr * 0.92, cz * 0.94, 0, 0.5)], n, REG.torso));
    mark(B.chest, () => {
      const bu = fig.bust;
      wrap(b, [T(0, cr * 0.92, cz * 0.94, 0, 0.5), T(cL * 0.35, cr, cz + bu * 0.6, -bu * 0.5, 0.62), T(cL * 0.62, cr * 1.04, cz + bu, -bu * 0.8, 0.74), T(cL * 0.86, cr * 0.98, cz * 0.92, 0, 0.86), T(cL * 0.97, sw * 0.62, cz * 0.62, 0, 0.95), [cL, fig.neck[1] * 1.15 * (top.kind === 'turtle' ? 1.12 : 1), fig.neck[1] * 1.1 * (top.kind === 'turtle' ? 1.12 : 1), 0.012, 0, white, topMat, 1]], n, REG.torso);
      const shoulderUV = bare ? null : regUV(REG.sleeve, 0.5, 0.04);
      for (const s of [-1, 1]) blob(b, [s * (sw - 0.012), cL - 0.045, 0], [fig.arm[1] * 1.22 * bk, fig.arm[1] * 1.15 * bk, fig.arm[1] * 1.2 * bk], 8, 4, bare ? sk : white, bare ? SKIN_MAT : topMat, shoulderUV);
      if (top.kind === 'turtle' && !outer) wrap(b, [[cL - 0.01, fig.neck[1] * 1.3, fig.neck[1] * 1.26, 0.008, 0, white, 0, 0.97], [cL + 0.032, fig.neck[1] * 1.22, fig.neck[1] * 1.18, 0.008, 0, white, 0, 1]], 8, REG.torso);
      if (top.kind === 'hoodie') blob(b, [0, cL - 0.03, cz * 0.95], [0.09, 0.05, 0.04], 7, 3, white, 0, regUV(REG.sleeve, 0.5, 0.3));
      if (outer && (outer.kind === 'leather' || outer.kind === 'blazer' || outer.kind === 'denim')) {
        for (const s of [-1, 1]) {
          const a = [s * fig.neck[1] * 1.25, cL + 0.005, -fig.neck[1] * 0.6], c = [s * 0.035, cL - 0.12, -cz * 1.02 * bk - 0.008], d = [s * 0.1, cL - 0.06, -cz * 0.9 * bk - 0.01];
          b.need(3, 6);
          const nrm = v3.unit(v3.cross(v3.sub(c, a), v3.sub(d, a))), nn = nrm[2] > 0 ? v3.mul(nrm, -1) : nrm, uv = regUV(REG.sleeve, 0.5, 0.5);
          const i0 = b.v(a[0], a[1], a[2], uv[0], uv[1], nn[0], nn[1], nn[2], white, topMat), i1 = b.v(c[0], c[1], c[2], uv[0], uv[1], nn[0], nn[1], nn[2], white, topMat), i2 = b.v(d[0], d[1], d[2], uv[0], uv[1], nn[0], nn[1], nn[2], white, topMat);
          b.tri(i0, i1, i2);
        }
      }
      if (outer && (outer.kind === 'olymp' || outer.kind === 'racing' || outer.kind === 'bomber' || outer.kind === 'windbreaker') || suit) wrap(b, [[cL - 0.012, fig.neck[1] * 1.45, fig.neck[1] * 1.4, 0.01, 0, white, topMat, 0.97], [cL + 0.022, fig.neck[1] * 1.36, fig.neck[1] * 1.3, 0.012, 0, white, topMat, 1]], 8, REG.torso);
      if (fit.neck) neckwear(b, fig, fit.neck, bk);
    });
    for (const [s, ua, fa, hd, th, shn] of [[-1, B.uarmL, B.farmL, B.handL, B.thighL, B.shinL], [1, B.uarmR, B.farmR, B.handR, B.thighR, B.shinR]]) {
      const [uL, ur, fL, fr] = fig.arm, sb = longSleeve ? bk : 1;
      const S = (y, r, rz, v, cover) => (cover ? [y, r * sb, rz * sb, 0, 0, white, topMat, v] : [y, r, rz, 0, 0, sk, SKIN_MAT, null]);
      const shortEnd = bare ? 0 : 0.42;
      mark(ua, () => {
        if (longSleeve) wrap(b, [S(0, ur * 1.1, ur * 1.08, 0, 1), S(uL * 0.12, ur * 1.1, ur * 1.06, 0.06, 1), S(uL * 0.6, ur * 1.04, ur * 1.02, 0.3, 1), S(uL, ur * 0.95, ur * 0.93, 0.5, 1)], 8, REG.sleeve);
        else if (bare) wrap(b, [S(0, ur * 1.05, ur * 1.03, 0, 0), S(uL * 0.5, ur * 0.96, ur * 0.94, 0, 0), S(uL, ur * 0.8, ur * 0.78, 0, 0)], 8, REG.sleeve);
        else wrap(b, [S(0, ur * 1.1, ur * 1.08, 0, 1), S(uL * 0.12, ur * 1.1, ur * 1.06, 0.06, 1), S(uL * shortEnd, ur * 1.06, ur * 1.04, 0.2, 1), S(uL * shortEnd, ur * 0.94, ur * 0.92, 0, 0), S(uL * 0.7, ur * 0.9, ur * 0.88, 0, 0), S(uL, ur * 0.8, ur * 0.78, 0, 0)], 8, REG.sleeve);
      });
      mark(fa, () => {
        if (longSleeve) {
          blob(b, [0, 0, 0], [ur * 0.95 * sb, ur * 0.95 * sb, ur * 0.95 * sb], 7, 3, white, topMat, regUV(REG.sleeve, 0.5, 0.5));
          wrap(b, [S(0, fr * 1.15, fr * 1.13, 0.5, 1), S(fL * 0.55, fr * 1.05, fr * 1.03, 0.75, 1), S(fL * 0.94, fr * 1.0, fr * 0.98, 0.98, 1), S(fL * 0.94, fr * 0.78, fr * 0.76, 0, 0), S(fL, fr * 0.76, fr * 0.74, 0, 0)], 7, REG.sleeve);
        } else {
          blob(b, [0, 0, 0], [ur * 0.82, ur * 0.82, ur * 0.82], 7, 3, sk, SKIN_MAT);
          limb(b, fL, fr * 1.08, fr * 0.78, 7, sk, SKIN_MAT);
        }
        wristwear(b, fL, longSleeve ? fr * 1.0 * sb : fr * 0.78, s < 0 ? fit.wrist : null, s > 0 && fit.band ? C(BAND_COLS[L.bandCol]) : null);
      });
      mark(hd, () => {
        const g = fit.hands && fit.hands.item, gc = g ? C(fit.hands.col) : sk, gm = g ? (g.kind === 'race' ? MAT.TRIM : 0) : SKIN_MAT;
        const fingers = !g || g.kind === 'cut' || g.kind === 'mitts' ? sk : gc, fm = fingers === sk ? SKIN_MAT : gm;
        tube(b, [[0, fr * 0.8 * (g && g.kind === 'race' ? 1.35 : 1), fr * 0.6 * (g && g.kind === 'race' ? 1.35 : 1), 0, 0, gc, gm], [0.025, 0.04, 0.024, 0, 0, gc, gm], [0.06, 0.047, 0.032, 0.004, 0, gc, gm], [0.09, 0.044, 0.03, 0.004, 0, fingers, fm], [0.105, 0.03, 0.022, 0.004, 0, fingers, fm]], 7, sk, SKIN_MAT);
        b.beam([s * -0.03, 0.03, -0.012], [s * -0.035, 0.07, -0.03], 0.012, fingers, fm);
      });
      const [tL, tr] = fig.thigh, [sL, sr] = fig.shin, skirt = legsIt && legsIt.kind === 'skirt', shorts = legsIt && legsIt.kind === 'shorts';
      const LG = (y, r, rz, v, cover) => (cover ? [y, r, rz, 0, 0, white, legMat, v] : [y, r, rz, 0, 0, sk, SKIN_MAT, null]);
      mark(th, () => {
        if (skirt) limb(b, tL, tr, tr * 0.72, 7, sk, SKIN_MAT);
        else if (shorts) wrap(b, [LG(0, tr * 0.96, tr * 0.96, 0, 1), LG(tL * 0.55, tr * 0.92, tr * 0.9, 0.3, 1), LG(tL * 0.55, tr * 0.8, tr * 0.78, 0, 0), LG(tL, tr * 0.72, tr * 0.7, 0, 0)], 7, REG.legs);
        else wrap(b, [LG(0, tr * 0.96, tr * 0.96, 0, 1), LG(tL * 0.12, tr, tr * 0.98, 0.06, 1), LG(tL * 0.55, tr * 0.88, tr * 0.86, 0.27, 1), LG(tL, tr * 0.72, tr * 0.7, 0.5, 1)], 7, REG.legs);
      });
      mark(shn, () => {
        const bare2 = skirt || shorts, sh = fit.feet.item, fc = C(fit.feet.col);
        blob(b, [0, 0, 0], [tr * 0.74, tr * 0.74, tr * 0.74], 7, 3, bare2 ? sk : white, bare2 ? SKIN_MAT : legMat, bare2 ? null : regUV(REG.legs, 0.5, 0.5));
        wrap(b, [LG(0, sr * 1.05, sr * 1.05, 0.5, !bare2), LG(sL * 0.55, sr * 0.9, sr * 0.88, 0.75, !bare2), LG(sL * 0.92, sr * 0.75, sr * 0.72, 1, !bare2), LG(sL, sr * 0.72, sr * 0.7, 1, !bare2)], 7, REG.legs);
        const cuff = sh.kind === 'boots' || sh.kind === 'raceBoots' ? 0.1 : 0.03, sole = sh.kind === 'kedy' || sh.kind === 'sneakers' ? C('#f0eee8') : C('#1a1a1c');
        tube(b, [[sL - cuff, 0.042, 0.047, 0.03, 0, fc], [sL + 0.01, 0.045, 0.06, 0.07, 0, fc], [sL + 0.03, 0.043, fig.foot * 0.42, fig.foot * 0.36, 0, fc], [sL + 0.04, 0.042, fig.foot * 0.42, fig.foot * 0.36, 0, sole], [sL + 0.05, 0.03, fig.foot * 0.3, fig.foot * 0.4, 0, sole]], 7, fc, sh.kind === 'moccasins' || sh.kind === 'boots' ? MAT.TRIM : 0);
      });
    }
    const head = b.ni;
    mark(B.neck, () => {
      const turtle = top.kind === 'turtle' && !outer;
      tube(b, [[-0.02, fig.neck[1] * 1.12, fig.neck[1] * 1.08, 0, 0, turtle ? C(fit.top.col) : sk, turtle ? 0 : SKIN_MAT], [fig.neck[0] * 0.5, fig.neck[1], fig.neck[1] * 0.98, 0, 0, turtle ? C(fit.top.col) : sk, turtle ? 0 : SKIN_MAT], [fig.neck[0] + 0.02, fig.neck[1] * 0.96, fig.neck[1] * 0.94]], 8, sk, SKIN_MAT);
    });
    mark(B.head, () => {
      face(b, fig, f);
      if (L.cover !== 'helmet' || !fit.head || fit.head.item.kind !== 'helmetFull') beard(b, fig, f, L, hc);
      if (STYLE[L.hair] && L.cover !== 'helmet') hairShell(b, fig, f, L, hc);
      if (STYLE[L.hair]) hairExtras(b, fig, f, L, hc);
      if (fit.head) hat(b, fig, f, fit.head);
      if (fit.eyes) glasses(b, fig, f, fit.eyes);
    });
    let crown = 0;
    for (let i = 0; i < b.n; i++) if (bones[i] === B.head) crown = Math.max(crown, b.f[i * FL + 1]);
    const out = {
      key, look: L, body: L.body, fig, nv: b.n, ni: b.ni, head, crown,
      rest: b.u8.slice(0, b.n * STRIDE).buffer,
      idx: b.idx.slice(0, b.ni),
      bones: Uint8Array.from(bones)
    };
    rig.cache.set(key, out);
    return out;
  }
  rig.cache = new Map();

  function frame(m, k, o, y, xHint, s, sy = s) {
    const yu = v3.unit(y);
    let x = v3.sub(xHint, v3.mul(yu, v3.dot(xHint, yu)));
    x = v3.len(x) < 1e-6 ? [1, 0, 0] : v3.unit(x);
    const z = v3.cross(x, yu), b = k * MS;
    m[b] = x[0] * s; m[b + 1] = x[1] * s; m[b + 2] = x[2] * s;
    m[b + 3] = yu[0] * sy; m[b + 4] = yu[1] * sy; m[b + 5] = yu[2] * sy;
    m[b + 6] = z[0] * s; m[b + 7] = z[1] * s; m[b + 8] = z[2] * s;
    m[b + 9] = o[0]; m[b + 10] = o[1]; m[b + 11] = o[2];
    m[b + 12] = (s / sy) * (s / sy);
  }

  function at(m, k, p) {
    const b = k * MS;
    return [m[b] * p[0] + m[b + 3] * p[1] + m[b + 6] * p[2] + m[b + 9], m[b + 1] * p[0] + m[b + 4] * p[1] + m[b + 7] * p[2] + m[b + 10], m[b + 2] * p[0] + m[b + 5] * p[1] + m[b + 8] * p[2] + m[b + 11]];
  }

  function ik(a, t, la, lb, pole) {
    let d = v3.sub(t, a), dl = v3.len(d);
    const reach = (la + lb) * 0.999;
    if (dl > reach) { d = v3.mul(d, reach / dl); dl = reach; t = v3.add(a, d); }
    dl = Math.max(dl, Math.abs(la - lb) + 1e-3);
    const dir = v3.mul(d, 1 / dl);
    const ca = F.clamp((la * la + dl * dl - lb * lb) / (2 * la * dl), -1, 1), sa = Math.sqrt(1 - ca * ca);
    let p = v3.sub(pole, v3.mul(dir, v3.dot(pole, dir)));
    p = v3.len(p) < 1e-6 ? [0, -1, 0] : v3.unit(p);
    return { mid: v3.add(a, v3.add(v3.mul(dir, la * ca), v3.mul(p, la * sa))), end: t };
  }

  const seats = new Map();
  function seatOf(geo, fig, key, crownAt = 0.2) {
    const ck = key + '|' + crownAt.toFixed(3) + '|' + geo.len + '|' + geo.eye.join(',');
    let st = seats.get(ck);
    if (st) return st;
    const eye = geo.eye, cp = geo.cockpit, L = geo.len, yF = geo.yb + 0.06;
    const roof = z => geo.shape.topAt(F.clamp((z + L / 2) / L, 0, 1)) - 0.045;
    const place = s => {
      const head = [eye[0], eye[1] + 0.015 * s, eye[2] + 0.085 * s];
      const crown = head[1] + (crownAt - HEAD_C[1]) * s + 0.008;
      const lim = Math.min(roof(head[2] - 0.08 * s), roof(head[2]), roof(head[2] + 0.1 * s));
      if (crown > lim) head[1] -= crown - lim;
      const neckTop = [head[0], head[1] - 0.082 * s, head[2] + 0.012 * s];
      const neckBase = v3.sub(neckTop, v3.mul(NECK_DIR, fig.neck[0] * s));
      const hip = [eye[0], Math.max(yF + 0.14 * s, neckBase[1] - TORSO * s), neckBase[2] + LEAN * s];
      return { s, head, neckTop, neckBase, hip, room: neckBase[1] - hip[1] };
    };
    let p = place(fig.s);
    if (p.room < TORSO * fig.s * 0.86) p = place(Math.max(fig.s * 0.84, fig.s * p.room / (TORSO * fig.s * 0.86)));
    const alpha = -cp.tilt;
    st = Object.assign(p, {
      yF, wc: cp.wheelPos, R: cp.wheelR, X: [1, 0, 0], Y: [0, Math.cos(alpha), -Math.sin(alpha)], Z: [0, Math.sin(alpha), Math.cos(alpha)],
      pedal: cp.wheelPos[2] - 0.17 - 0.3
    });
    seats.set(ck, st);
    return st;
  }

  const GRIP = 0.3, TURN = 1.05, SLIDE = 1.05, HAND = 0.07, X = [1, 0, 0];
  const REGRIP = 1.15, REGRIP_T = 0.18, REGRIP_TO = 0.45, GEAR_T = 0.38, HORN_T = 0.45, FIST_T = 1.7, LOOK_T = 0.9, IDLE_AFTER = 20;

  function newAnim() {
    const sp = () => ({ x: 0, v: 0 });
    return {
      yaw: sp(), pitch: sp(), roll: sp(), side: sp(), fwd: sp(), bob: sp(), twist: sp(),
      hands: [{ ang: 0, rot0: 0, held: true, t: 1, from: 0, to: 0 }, { ang: 0, rot0: 0, held: true, t: 1, from: 0, to: 0 }],
      rot: null, heave: null, gear: 1, horn: 1, fist: 1, look: 1, lookSide: 0, idle: 0, time: 0, key: 0
    };
  }

  function spring(o, target, dt, w, z) {
    const a = w * w * (target - o.x) - 2 * z * w * o.v;
    o.v += a * dt;
    o.x += o.v * dt;
  }

  function cue(inst, kind, d = {}) {
    const a = inst.anim || (inst.anim = newAnim());
    if (kind === 'shift') a.gear = 0;
    else if (kind === 'horn') a.horn = 0;
    else if (kind === 'win') a.fist = 0;
    else if (kind === 'near') { a.look = 0; a.lookSide = d.side < 0 ? -1 : 1; }
    else if (kind === 'land') { a.bob.v -= F.clamp(d.power || 0, 0, 12) * 0.05; a.pitch.v += F.clamp(d.power || 0, 0, 12) * 0.25; }
    else if (kind === 'hit') {
      const p = F.clamp(d.power || 0, 0, 30), dx = d.dx || 0, dz = d.dz === undefined ? 1 : d.dz;
      a.side.v += dx * p * 0.05; a.fwd.v += dz * p * 0.05;
      a.pitch.v += dz * p * 0.18; a.roll.v += dx * p * 0.16; a.yaw.v -= dx * p * 0.08;
    }
  }

  function animate(inst, dt, s) {
    const a = inst.anim || (inst.anim = newAnim());
    dt = Math.min(dt, 0.05);
    a.time += dt;
    const rot = -(s.steer || 0) * 7.5;
    if (a.rot === null) { a.rot = rot; for (const h of a.hands) h.rot0 = rot; }
    a.rot = rot;
    const hs = a.hands;
    for (let k = 0; k < 2; k++) {
      const h = hs[k], o = hs[1 - k];
      if (h.held) {
        h.ang = rot - h.rot0;
        if (Math.abs(h.ang) > REGRIP && o.held && Math.abs(o.ang) <= Math.abs(h.ang)) { h.held = false; h.t = 0; h.from = h.ang; h.to = -Math.sign(h.ang) * REGRIP_TO; }
      } else {
        h.t = Math.min(1, h.t + dt / REGRIP_T);
        const e = h.t * h.t * (3 - 2 * h.t);
        h.ang = h.from + (h.to - h.from) * e;
        if (h.t >= 1) { h.held = true; h.rot0 = rot - h.to; }
      }
    }
    if (s.simple) {
      for (const h of hs) if (h.held) h.ang = F.clamp(h.ang, -REGRIP - 0.4, REGRIP + 0.4);
    }
    a.gear = Math.min(1, a.gear + dt / GEAR_T);
    a.horn = Math.min(1, a.horn + dt / HORN_T);
    a.fist = Math.min(1, a.fist + dt / FIST_T);
    a.look = Math.min(1, a.look + dt / LOOK_T);
    a.idle = (s.speed || 0) < 0.5 ? a.idle + dt : 0;
    const lat = s.latG || 0, lon = s.lonG || 0;
    let yawT = F.clamp((s.steer || 0) * 2.4 + (s.yawRate || 0) * 0.12, -0.55, 0.55);
    if (a.look < 1) yawT = a.lookSide * 0.85 * Math.sin(Math.min(1, a.look * 3) * Math.PI / 2);
    if (s.back) yawT = 1.45;
    const heave = s.heave || 0;
    if (a.heave !== null) a.bob.v -= F.clamp((heave - a.heave) / Math.max(dt, 1e-3), -60, 60) * dt * 0.012;
    a.heave = heave;
    spring(a.yaw, yawT, dt, 9, 0.9);
    spring(a.twist, s.back ? 0.38 : 0, dt, 6, 1);
    spring(a.pitch, (s.back ? 0.05 : 0) - (a.fist < 1 ? 0.15 * Math.sin(a.fist * Math.PI) : 0), dt, 10, 0.55);
    spring(a.roll, F.clamp(-lat * 0.006, -0.12, 0.12), dt, 8, 0.6);
    spring(a.side, F.clamp(-lat * 0.009, -0.14, 0.14), dt, 6, 0.7);
    spring(a.fwd, F.clamp(-lon * 0.007, -0.08, 0.12), dt, 6, 0.7);
    spring(a.bob, 0, dt, 13, 0.35);
    a.bob.x = F.clamp(a.bob.x, -0.05, 0.05);
    a.key = Math.round(a.side.x * 200) + Math.round(a.fwd.x * 200) * 97 + Math.round(a.twist.x * 100) * 7919 + Math.round((hs[0].ang + hs[1].ang * 3) * 20) * 104729 + (a.gear < 1 || a.horn < 1 || a.fist < 1 ? Math.round(a.time * 20) : 0);
  }

  function torso(m, st, fig, lean, an) {
    const s = st.s, v = v3.sub(st.neckBase, st.hip), lz = lean + (an ? an.fwd.x : 0), lx = an ? an.side.x : 0, tw = an ? an.twist.x : 0;
    const rot = p => {
      const c = Math.cos(lz), sn = Math.sin(lz), y1 = p[1] * c + p[2] * sn, z1 = -p[1] * sn + p[2] * c;
      const cx = Math.cos(lx), sx = Math.sin(lx);
      return [p[0] * cx + y1 * sx, -p[0] * sx + y1 * cx, z1];
    };
    const top = v3.add(st.hip, rot(v));
    const up = v3.unit(v3.sub(top, st.hip));
    const pelTop = v3.add(st.hip, v3.mul(up, 0.1 * s));
    const chestO = v3.sub(top, v3.mul(up, fig.chest[0] * s));
    const abdLen = Math.max(0.05, v3.len(v3.sub(chestO, pelTop)));
    let neckTop = st.neckTop;
    if (an) neckTop = v3.add(v3.add(top, rot(v3.sub(st.neckTop, st.neckBase))), [0, an.bob.x, 0]);
    const neck = v3.sub(neckTop, top), chestX = [Math.cos(tw), 0, Math.sin(tw)];
    frame(m, B.pelvis, st.hip, up, X, s);
    frame(m, B.abd, pelTop, v3.sub(chestO, pelTop), X, s, abdLen / fig.abd[0]);
    frame(m, B.chest, chestO, up, chestX, s);
    frame(m, B.neck, top, neck, chestX, s, F.clamp(v3.len(neck) / fig.neck[0], 0.6 * s, 1.7 * s));
    if (!an) { frame(m, B.head, neckTop, [0, 1, 0], X, s); return; }
    const yw = an.yaw.x + tw * 0.4, p = an.pitch.x, r = an.roll.x + lx * 0.5;
    const fw = [Math.sin(yw), 0, -Math.cos(yw)], xr = [Math.cos(yw), 0, Math.sin(yw)];
    const u1 = v3.add(v3.mul([0, 1, 0], Math.cos(p)), v3.mul(fw, Math.sin(p)));
    const u2 = v3.add(v3.mul(u1, Math.cos(r)), v3.mul(xr, Math.sin(r)));
    frame(m, B.head, neckTop, u2, xr, s);
  }

  function shoulder(m, fig, side) { return at(m, B.chest, [side * (fig.sw - 0.012), fig.chest[0] - 0.045, -0.025]); }

  function grip(st, side, turn, lift = 0) {
    const th = (side > 0 ? GRIP : Math.PI - GRIP) + turn;
    const rad = v3.add(v3.mul(st.X, Math.cos(th)), v3.mul(st.Y, Math.sin(th)));
    const p = v3.add(v3.add(st.wc, v3.mul(rad, st.R)), v3.mul(st.Z, lift * 0.07));
    const hand = v3.unit(v3.add(v3.mul(st.Z, -0.8), v3.mul(rad, 0.42)));
    return { rad, hand, wrist: v3.sub(p, v3.mul(hand, HAND * st.s)) };
  }

  function leanFor(st, fig) {
    const m = new Float32Array(NB * MS), reach = (fig.arm[0] + fig.arm[2]) * st.s;
    let lean = 0;
    for (; lean < 0.45; lean += 0.03) {
      torso(m, st, fig, lean, null);
      let far = 0;
      for (const side of [-1, 1]) for (const [turn, k] of [[0, 0.93], [TURN, 0.985], [-TURN, 0.985]]) far = Math.max(far, v3.len(v3.sub(grip(st, side, turn).wrist, shoulder(m, fig, side))) / k);
      if (far <= reach) break;
    }
    return lean;
  }

  function override(st, sh, g, an) {
    const env = t => (t < 1 ? Math.sin(t * Math.PI) : 0);
    const gear = env(an.gear), horn = env(an.horn), fist = an.fist < 1 ? Math.min(1, Math.sin(an.fist * Math.PI) * 1.6) : 0;
    let wrist = g.wrist, hand = g.hand, w = 0;
    const blend = (k, wr, hd) => {
      if (k <= w) return;
      const t = k;
      wrist = v3.add(v3.mul(g.wrist, 1 - t), v3.mul(wr, t));
      hand = v3.unit(v3.add(v3.mul(g.hand, 1 - t), v3.mul(hd, t)));
      w = k;
    };
    if (gear > 0) blend(gear, [st.hip[0] + 0.32 * st.s, st.yF + 0.36, st.wc[2] + 0.24], [0.15, -0.75, -0.5]);
    if (horn > 0) blend(horn, v3.add(st.wc, v3.add(v3.mul(st.Z, 0.06), v3.mul(st.X, 0.03))), v3.unit(v3.add(v3.mul(st.Z, -1), [0, -0.3, 0])));
    if (fist > 0) blend(fist, v3.add(sh, [0.06, 0.3, -0.2 + 0.04 * Math.sin(an.fist * 40)]), [0, 1, -0.2]);
    if (w === 0 && an.idle > IDLE_AFTER && (an.idle - IDLE_AFTER) % 9 < 3) wrist = v3.add(wrist, v3.mul(st.Z, 0.012 * Math.max(0, Math.sin(an.time * 42))));
    return { wrist, hand };
  }

  function pose(inst, geo, steer, cockpit) {
    const r = inst.rig, fig = r.fig, st = seatOf(geo, fig, r.body, r.crown), m = inst.mats, s = st.s;
    let an = inst.anim || null;
    if (st.lean === undefined) st.lean = leanFor(st, fig);
    if (inst.gaze) {
      const d = v3.sub(inst.gaze, st.head), yaw = F.clamp(Math.atan2(d[0], -d[2]), -1.35, 1.35), pitch = F.clamp(-Math.atan2(d[1], Math.hypot(d[0], d[2])), -0.45, 0.45);
      const still = { x: 0, v: 0 }, base = an || { fwd: still, side: still, twist: still, roll: still, bob: still };
      an = Object.assign({}, base, { yaw: { x: yaw * 0.85 }, pitch: { x: pitch }, twist: { x: yaw * 0.12 } });
    }
    torso(m, st, fig, st.lean, an);
    const rot = -steer * 7.5, turn = cockpit ? F.clamp(rot, -TURN, TURN) : F.clamp(rot, -SLIDE, SLIDE);
    for (const [side, ua, fa, hd, k] of [[-1, B.uarmL, B.farmL, B.handL, 0], [1, B.uarmR, B.farmR, B.handR, 1]]) {
      const sh = shoulder(m, fig, side), h = an && an.hands && an.hands[k];
      let g = h ? grip(st, side, h.ang, h.held ? 0 : Math.sin(h.t * Math.PI)) : grip(st, side, turn);
      if (an && an.hands && side > 0) g = Object.assign({}, g, override(st, sh, g, an));
      const arm = ik(sh, g.wrist, fig.arm[0] * s, fig.arm[2] * s, [side * 0.7, -1, 0.3]);
      frame(m, ua, sh, v3.sub(arm.mid, sh), X, s);
      frame(m, fa, arm.mid, v3.sub(arm.end, arm.mid), X, s);
      frame(m, hd, arm.end, g.hand, v3.cross(g.rad, st.Z), s);
    }
    for (const [side, th, sn] of [[-1, B.thighL, B.shinL], [1, B.thighR, B.shinR]]) {
      const hj = at(m, B.pelvis, [side * fig.hip, 0, 0]);
      const foot = [hj[0] + side * 0.03, st.yF + 0.1 * s, st.pedal];
      const leg = ik(hj, foot, fig.thigh[0] * s, fig.shin[0] * s, [0, 1, -0.5]);
      frame(m, th, hj, v3.sub(leg.mid, hj), X, s);
      frame(m, sn, leg.mid, v3.sub(leg.end, leg.mid), X, s);
    }
    skin(inst);
  }

  function stand(inst, t) {
    const r = inst.rig, fig = r.fig, m = inst.mats, s = fig.s;
    const sway = Math.sin(t * 0.55) * 0.012 * s, breath = Math.sin(t * 1.7) * 0.004 * s;
    const hipY = (fig.thigh[0] + fig.shin[0]) * s + 0.075 * s;
    const hip = [sway, hipY - Math.abs(sway) * 0.3, 0.01];
    const neckBase = v3.add(hip, [sway * 0.4, (TORSO + 0.02) * s + breath, -0.01]);
    const neckTop = v3.add(neckBase, v3.mul(NECK_DIR, fig.neck[0] * s));
    const look = Math.sin(t * 0.21) * Math.sin(t * 0.13 + 1) * 0.35;
    const an = { fwd: { x: 0 }, side: { x: -sway * 1.5 }, twist: { x: 0 }, yaw: { x: look }, pitch: { x: 0.04 + 0.03 * Math.sin(t * 0.37) }, roll: { x: sway * 2 }, bob: { x: 0 } };
    torso(m, { s, hip, neckBase, neckTop }, fig, 0, an);
    for (const [side, ua, fa, hd] of [[-1, B.uarmL, B.farmL, B.handL], [1, B.uarmR, B.farmR, B.handR]]) {
      const sh = shoulder(m, fig, side), reach = (fig.arm[0] + fig.arm[2]) * s;
      const wrist = v3.add(sh, [side * (0.06 + 0.01 * Math.sin(t * 0.9 + side)), -reach * 0.95, -0.04 + 0.02 * Math.sin(t * 0.8 + side)]);
      const arm = ik(sh, wrist, fig.arm[0] * s, fig.arm[2] * s, [side * 0.2, 0, 1]);
      frame(m, ua, sh, v3.sub(arm.mid, sh), X, s);
      frame(m, fa, arm.mid, v3.sub(arm.end, arm.mid), X, s);
      frame(m, hd, arm.end, [side * 0.1, -1, -0.15], [0, 0, side], s);
    }
    for (const [side, th, sn] of [[-1, B.thighL, B.shinL], [1, B.thighR, B.shinR]]) {
      const hj = at(m, B.pelvis, [side * fig.hip, 0, 0]);
      const foot = [side * (fig.hip + 0.02) * s, 0.075 * s, -0.01];
      const leg = ik(hj, foot, fig.thigh[0] * s, fig.shin[0] * s, [0, 0, -1]);
      frame(m, th, hj, v3.sub(leg.mid, hj), X, s);
      frame(m, sn, leg.mid, v3.sub(leg.end, leg.mid), X, s);
    }
    skin(inst);
    return { head: at(m, B.head, HEAD_C), chest: at(m, B.chest, [0, fig.chest[0] * 0.5, 0]), hip };
  }

  function skin(inst) {
    const r = inst.rig, m = inst.mats, src = r.rest, dst = inst.data;
    const sf = inst.srcF || (inst.srcF = new Float32Array(src)), si = inst.srcI || (inst.srcI = new Int8Array(src));
    const df = inst.dstF || (inst.dstF = new Float32Array(dst)), di = inst.dstI || (inst.dstI = new Int8Array(dst));
    const bones = r.bones;
    for (let i = 0; i < r.nv; i++) {
      const b = bones[i] * MS, o = i * FL, x = sf[o], y = sf[o + 1], z = sf[o + 2];
      df[o] = m[b] * x + m[b + 3] * y + m[b + 6] * z + m[b + 9];
      df[o + 1] = m[b + 1] * x + m[b + 4] * y + m[b + 7] * z + m[b + 10];
      df[o + 2] = m[b + 2] * x + m[b + 5] * y + m[b + 8] * z + m[b + 11];
      const ni = (o + 5) * 4, nx = si[ni], ny = si[ni + 1] * m[b + 12], nz = si[ni + 2];
      const ox = m[b] * nx + m[b + 3] * ny + m[b + 6] * nz, oy = m[b + 1] * nx + m[b + 4] * ny + m[b + 7] * nz, oz = m[b + 2] * nx + m[b + 5] * ny + m[b + 8] * nz;
      const l = 127 / (Math.hypot(ox, oy, oz) || 1);
      di[ni] = ox * l; di[ni + 1] = oy * l; di[ni + 2] = oz * l;
    }
  }

  function make(look) {
    const r = rig(look);
    return { look: r.look, rig: r, tex: texKey(r.look), mats: new Float32Array(NB * MS), data: r.rest.slice(0) };
  }

  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const css = (c, a = 1) => `rgba(${c.map(v => Math.round(F.clamp(v, 0, 255))).join(',')},${a})`;
  const mixC = (a, c, t) => a.map((v, i) => v + (c[i] - v) * t);

  function paintClothes(x, L, rnd) {
    const fit = normFit(L.fit), T = REG.torso, SL = REG.sleeve, LG = REG.legs, CP = REG.cap;
    const top = fit.top, outer = fit.outer, suit = top.item.kind === 'suit';
    const fill = (r, u0, v0, u1, v1, c) => { x.fillStyle = c; x.fillRect(r[0] + u0 * r[2], r[1] + v0 * r[3], (u1 - u0) * r[2], (v1 - v0) * r[3]); };
    const k = (hex, m) => css(rgb(hex).map(v => v * m));
    const contrast = hex => (rgb(hex).reduce((a, v) => a + v, 0) > 380 ? '#1a1a1e' : '#f4f2ec');
    const text = (r, u, v, str, h, col, maxW, back) => {
      x.save();
      x.font = `bold ${h}px Arial`;
      const w = x.measureText(str).width, s = Math.min(1, maxW / Math.max(w, 1));
      x.translate(r[0] + u * r[2], r[1] + v * r[3]);
      x.scale(back ? -s : s, 1);
      x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(str, 0, 0);
      x.restore();
    };
    const garment = (r, kind, col, v0, v1, sleeve) => {
      fill(r, 0, v0, 1, v1, col);
      const W = r[2], H = r[3], y0 = r[1] + v0 * H, y1 = r[1] + v1 * H;
      if (kind === 'plaid') {
        x.fillStyle = k(col, 0.55);
        for (let i = 0; i < W; i += 8) { x.fillRect(r[0] + i, y0, 2, y1 - y0); }
        x.fillStyle = css(rgb(col).map(v => v * 0.6), 0.6);
        for (let j = y0; j < y1; j += 8) x.fillRect(r[0], j, W, 2);
        x.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 4; i < W; i += 8) x.fillRect(r[0] + i, y0, 1, y1 - y0);
      } else if (kind === 'palms') {
        for (let i = 0; i < 26; i++) {
          const px = r[0] + rnd() * W, py = y0 + rnd() * (y1 - y0);
          x.fillStyle = i % 3 ? '#2a7a3a' : '#f4f2ec';
          for (let a = 0; a < 5; a++) { x.beginPath(); x.ellipse(px + Math.cos(a * 1.26) * 3, py + Math.sin(a * 1.26) * 3, 3.2, 1.2, a * 1.26, 0, Math.PI * 2); x.fill(); }
        }
      } else if (kind === 'deer') {
        const band = y0 + (y1 - y0) * (sleeve ? 0.6 : 0.62);
        fill(r, 0, (band - r[1]) / H - 0.04, 1, (band - r[1]) / H + 0.1, '#f0ead8');
        x.fillStyle = col;
        for (let i = 0; i < W; i += 12) { x.fillRect(r[0] + i + 2, band + 1, 6, 3); x.fillRect(r[0] + i + 6, band - 2, 1, 3); x.fillRect(r[0] + i + 3, band + 4, 1, 3); x.fillRect(r[0] + i + 7, band + 4, 1, 3); }
        x.fillStyle = '#f0ead8';
        for (let i = 0; i < W; i += 4) x.fillRect(r[0] + i, band - 7, 2, 2);
      } else if (kind === 'denim' || kind === 'jeans') {
        for (let i = 0; i < 500; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; x.fillRect(r[0] + rnd() * W, y0 + rnd() * (y1 - y0), 1, 2); }
        x.fillStyle = 'rgba(232,180,80,0.7)';
        for (const u of [0.25, 0.75]) x.fillRect(r[0] + u * W, y0, 1, y1 - y0);
      } else if (kind === 'olymp' || kind === 'track') {
        for (const u of [0.25, 0.75]) { fill(r, u - 0.035, v0, u - 0.015, v1, '#f4f2ec'); fill(r, u + 0.015, v0, u + 0.035, v1, '#f4f2ec'); }
      } else if (kind === 'racing') {
        const c2 = col === '#f4f4f0' ? '#e6146e' : '#e6146e';
        for (const u of [0.25, 0.75]) fill(r, u - 0.04, v0, u + 0.04, v1, c2);
      } else if (kind === 'cargo') {
        for (const u of [0.25, 0.75]) { x.fillStyle = k(col, 0.8); x.fillRect(r[0] + (u - 0.08) * W, y0 + (y1 - y0) * 0.35, 0.16 * W, (y1 - y0) * 0.18); }
      } else if (kind === 'leather' || kind === 'leatherPants') {
        const g = x.createLinearGradient(r[0], 0, r[0] + W, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(r[0], y0, W, y1 - y0);
      } else if (kind === 'windbreaker') {
        fill(r, 0, v0 + (v1 - v0) * 0.55, 1, v0 + (v1 - v0) * 0.7, k(col, 0.6));
      } else if (kind === 'trousers' || kind === 'suit') {
        x.fillStyle = k(col, 0.8);
        for (const u of [0.5, 0]) x.fillRect(r[0] + u * W, y0, 1, y1 - y0);
      }
    };
    const legs = suit ? { item: top.item, col: top.col } : fit.legs;
    garment(LG, legs.item.kind, legs.col, 0, 1, false);
    if (legs.item.kind === 'skirt') { x.fillStyle = k(legs.col, 0.75); for (let i = 0; i < LG[2]; i += 6) x.fillRect(LG[0] + i, LG[1] + LG[3] * 0.1, 1, LG[3] * 0.4); }
    garment(T, legs.item.kind, legs.col, 0, 0.2, false);
    garment(T, suit ? 'suit' : top.item.kind, top.col, 0.2, 1, false);
    if (!suit) fill(T, 0, 0.17, 1, 0.205, legs.item.kind === 'skirt' ? k(legs.col, 0.7) : '#2a1e16');
    if (!suit && legs.item.kind !== 'skirt' && legs.item.kind !== 'track') fill(T, 0.48, 0.17, 0.52, 0.205, '#c8ccd0');
    if (top.item.kind === 'polo') { fill(T, 0.48, 0.82, 0.52, 1, k(top.col, 0.85)); for (const v of [0.86, 0.93]) fill(T, 0.494, v, 0.506, v + 0.02, '#f4f2ec'); }
    if (top.item.kind === 'hoodie') { fill(T, 0.38, 0.32, 0.62, 0.5, k(top.col, 0.85)); fill(T, 0.47, 0.6, 0.48, 0.9, '#f4f2ec'); fill(T, 0.52, 0.6, 0.53, 0.9, '#f4f2ec'); }
    if (suit) { fill(T, 0.495, 0.2, 0.505, 1, k(top.col, 0.6)); fill(T, 0, 0.17, 1, 0.2, k(top.col, 0.8)); }
    const printTop = top.item.print && (!outer || outer.item.kind === 'vest');
    if (printTop) text(T, 0.5, suit ? 0.74 : 0.7, top.item.print, suit ? 6 : 8, contrast(top.col), suit ? 22 : 34);
    if (top.item.id === 'tee_band') text(T, 0.5, 0.58, 'RĪGA 2001', 5, contrast(top.col), 26);
    if (outer) {
      const ok = outer.item.kind, open = ok === 'leather' || ok === 'denim' || ok === 'blazer' || ok === 'vest' || ok === 'bomber' ? (ok === 'blazer' ? 0.07 : 0.05) : 0;
      x.save();
      x.beginPath();
      x.rect(T[0], T[1] + 0.17 * T[3], T[2], 0.83 * T[3]);
      if (open) { x.rect(T[0] + (0.5 + open) * T[2], T[1] + 0.17 * T[3], -2 * open * T[2], 0.83 * T[3]); }
      x.clip('evenodd');
      garment(T, ok, outer.col, 0.17, 1, false);
      x.restore();
      if (!open) fill(T, 0.497, 0.17, 0.503, 1, k(outer.col, 0.55));
      else for (const s of [-1, 1]) fill(T, 0.5 + s * open - (s > 0 ? 0 : 0.01), 0.17, 0.5 + s * open + (s > 0 ? 0.01 : 0), 1, k(outer.col, 0.6));
      if (ok === 'bomber' || ok === 'olymp' || ok === 'racing') fill(T, 0, 0.17, 1, 0.22, k(outer.col, 0.7));
      if (ok === 'vest') for (const u of [0.38, 0.62]) for (const v of [0.35, 0.6]) fill(T, u - 0.05, v, u + 0.05, v + 0.1, k(outer.col, 0.8));
      if (outer.item.print) { text(T, 0.42, 0.72, outer.item.print, 4, contrast(outer.col), 12); text(T, 0, 0.66, outer.item.print, 8, contrast(outer.col), 30, true); text(T, 1, 0.66, outer.item.print, 8, contrast(outer.col), 30, true); }
    }
    const sleeveIt = outer && outer.item.kind !== 'vest' ? outer : top;
    garment(SL, suit ? 'suit' : sleeveIt.item.kind, sleeveIt.col, 0, 1, true);
    fill(SL, 0, 0.94, 1, 1, k(sleeveIt.col, 0.75));
    const hat = fit.head;
    fill(CP, 0, 0, 1, 1, hat ? hat.col : '#ffffff');
    if (hat) {
      if (hat.item.kind === 'bandana') { x.fillStyle = '#f4f2ec'; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc(CP[0] + rnd() * CP[2], CP[1] + rnd() * CP[3], 1, 0, Math.PI * 2); x.fill(); } }
      if (hat.item.kind === 'helmetOpen' || hat.item.kind === 'helmetFull') { fill(CP, 0, 0.36, 1, 0.46, '#e6146e'); fill(CP, 0.47, 0, 0.53, 0.5, '#e6146e'); }
      if (hat.item.print) text(CP, 0.5, hat.item.kind === 'cap' ? 0.78 : 0.6, hat.item.print, hat.item.kind === 'cap' ? 6 : 5, contrast(hat.col), 14);
    }
  }

  function paintLook(look, cv) {
    const L = normLook(look), x = cv.getContext('2d'), rnd = F.rng(hashOf(texKey(L)));
    const sk = rgb(SKINS[L.skin][1]), hc = rgb(HAIR_COLS[L.hairCol][1]), dark = L.skin >= 5;
    const H = REG.head, px = ph => H[0] + (0.5 - ph / (Math.PI * 2)) * H[2], py = th => H[1] + th / Math.PI * H[3];
    const fe = L.body === 'f';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, TEX, TEX);
    x.fillStyle = css(sk);
    x.fillRect(H[0], H[1], H[2], H[3]);
    const blot = (cx, cy, rx, ry, c, a) => {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, css(c, a)); g.addColorStop(1, css(c, 0));
      x.save(); x.translate(cx, cy); x.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); x.translate(-cx, -cy);
      x.fillStyle = g; x.fillRect(cx - Math.max(rx, ry), cy - Math.max(rx, ry), Math.max(rx, ry) * 2, Math.max(rx, ry) * 2);
      x.restore();
    };
    const shadow = mixC(sk, [60, 30, 20], 0.35), blush = mixC(sk, [210, 90, 90], 0.5);
    x.fillStyle = css(shadow, 0.6);
    x.fillRect(H[0], py(2.75), H[2], H[3] - py(2.75));
    for (const s of [-1, 1]) {
      blot(px(s * Math.PI / 2), py(1.65), 9, 11, shadow, 0.6);
      blot(px(s * 0.55), py(1.95), 13, 9, blush, fe || L.makeup !== 'none' ? 0.45 : 0.18);
      blot(px(s * 0.36), py(1.54), 9, 4, shadow, 0.35);
    }
    blot(px(0), py(2.42), 10, 5, shadow, 0.3);
    const st = STYLE[L.hair];
    if (L.beard === 'stubble' || L.beard === 'full' || L.beard === 'goatee' || L.beard === 'moustache') {
      const sh = mixC(sk, mixC(hc, [70, 80, 90], 0.4), dark ? 0.35 : 0.42);
      for (let i = 0; i < 900; i++) {
        const ph = (rnd() - 0.5) * 3, th = 1.95 + rnd() * 0.85;
        if (Math.abs(ph) > 1.45 || (th < 2.2 && Math.abs(ph) < 0.3 && th > 2.03) || th < 1.72 + 0.3 * ramp(1.1, 0.4, Math.abs(ph)) || (Math.abs(ph) < 0.32 && th > 2.03 && th < 2.2)) continue;
        x.fillStyle = css(sh, 0.5);
        x.fillRect(px(ph), py(th), 1, 1);
      }
    }
    if (st) {
      x.fillStyle = css(hc);
      for (let i = 0; i < H[2]; i++) {
        const ph = (0.5 - (i + 0.5) / H[2]) * Math.PI * 2, plan = hairPlan(L, Math.abs(ph));
        const line = Math.min(plan.cover, SKULL_END + 0.35) + (rnd() - 0.5) * 0.03;
        x.fillRect(H[0] + i, H[1], 1, py(line) - H[1]);
      }
      x.fillStyle = css(mixC(hc, [0, 0, 0], 0.3), 0.5);
      for (let i = 0; i < 400; i++) {
        const u = rnd(), ph = (0.5 - u) * Math.PI * 2, lim = hairPlan(L, Math.abs(ph)).cover - 0.06;
        x.fillRect(H[0] + u * H[2], H[1] + rnd() * (py(Math.min(lim, 1.2)) - H[1]), 1, 2);
      }
    } else {
      x.fillStyle = css(mixC(sk, [90, 70, 60], 0.12));
      x.fillRect(H[0], H[1], H[2], py(0.9) - H[1]);
    }
    const browC = mixC(hc, [0, 0, 0], 0.25), browW = [1, 1.6, 2.4, 1.4][L.brows] * (fe ? 0.8 : 1);
    x.strokeStyle = css(L.hairCol === 5 || L.hairCol === 7 ? mixC(browC, [80, 60, 40], 0.4) : browC);
    x.lineCap = 'round';
    for (const s of [-1, 1]) {
      const cx = px(s * 0.36), cy = py(1.3), arch = L.brows === 3 ? 2.2 : 1.1;
      x.lineWidth = browW;
      x.beginPath();
      x.moveTo(cx - s * 7, cy + 1);
      x.quadraticCurveTo(cx, cy - arch, cx + s * 7.5, cy + 1.6);
      x.stroke();
    }
    const shape = [[6, 2.8, 0], [5.4, 3.4, 0], [6.2, 1.9, 0], [5.8, 2.6, 1]][L.eyes], eyeC = rgb(EYE_COLS[L.eyeCol][1]);
    const shadowEye = L.makeup === 'y2k' ? [90, 140, 210] : L.makeup === 'bold' ? [70, 40, 60] : null;
    for (const s of [-1, 1]) {
      const cx = px(s * 0.36), cy = py(1.47), [w, h, droop] = shape;
      if (shadowEye) blot(cx, cy - 2.5, w + 2, 3.5, shadowEye, 0.75);
      x.fillStyle = '#f2eee6';
      x.beginPath();
      x.moveTo(cx - w, cy + (droop && s < 0 ? 0.8 : 0));
      x.quadraticCurveTo(cx, cy - h * 1.2, cx + w, cy + (droop && s > 0 ? 0.8 : 0));
      x.quadraticCurveTo(cx, cy + h * 0.9, cx - w, cy + (droop && s < 0 ? 0.8 : 0));
      x.fill();
      x.fillStyle = css(eyeC);
      x.beginPath(); x.arc(cx + s * 0.4, cy, Math.min(2.6, h * 0.95), 0, Math.PI * 2); x.fill();
      x.fillStyle = '#0c0a08';
      x.beginPath(); x.arc(cx + s * 0.4, cy, 1.1, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff';
      x.fillRect(cx + s * 0.4 - 1, cy - 1.4, 1, 1);
      x.strokeStyle = css(fe || L.makeup === 'bold' ? [20, 14, 12] : mixC(sk, [30, 15, 10], 0.7));
      x.lineWidth = fe || L.makeup === 'bold' ? 1.3 : 0.8;
      x.beginPath();
      x.moveTo(cx - w - 0.5, cy + 0.3);
      x.quadraticCurveTo(cx, cy - h * 1.25, cx + w + (fe ? 1.2 * s : 0.5 * s), cy - (fe ? 0.8 : 0));
      x.stroke();
    }
    const lipsW = 9.5 * FACES[L.body][L.face].lips, my = py(2.16);
    const lipC = L.makeup === 'bold' ? [170, 30, 50] : L.makeup === 'y2k' ? [150, 80, 70] : fe || L.makeup === 'light' ? mixC(sk, [190, 80, 90], 0.45) : mixC(sk, [150, 70, 70], 0.3);
    x.fillStyle = css(lipC);
    x.beginPath();
    x.moveTo(px(0) - lipsW, my);
    x.quadraticCurveTo(px(0), my - 3.4, px(0) + lipsW, my);
    x.quadraticCurveTo(px(0), my + 4.4, px(0) - lipsW, my);
    x.fill();
    x.strokeStyle = css(mixC(lipC, [30, 10, 10], 0.5));
    x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(px(0) - lipsW, my); x.quadraticCurveTo(px(0), my + 0.6, px(0) + lipsW, my); x.stroke();
    if (L.makeup === 'y2k') { x.strokeStyle = css([110, 60, 50]); x.beginPath(); x.moveTo(px(0) - lipsW, my); x.quadraticCurveTo(px(0), my - 2.8, px(0) + lipsW, my); x.stroke(); }
    for (const s of [-1, 1]) {
      blot(px(s * 0.08), py(1.96), 1.2, 0.9, mixC(sk, [40, 20, 15], 0.5), 0.4);
      blot(px(s * 0.15), py(1.74), 1.8, 6, shadow, 0.16);
    }
    if (L.freckles) {
      x.fillStyle = css(mixC(sk, [150, 80, 45], 0.3), 0.7);
      for (let i = 0; i < 38; i++) {
        const ph = (rnd() - 0.5) * 1.3, th = 1.62 + rnd() * 0.35;
        x.fillRect(px(ph), py(th), 1, 1);
      }
    }
    const R = REG.hair, base = mixC(hc, [0, 0, 0], 0.08);
    x.fillStyle = css(base);
    x.fillRect(R[0], R[1], R[2], R[3]);
    for (let i = 0; i < R[2]; i++) {
      const k = (rnd() - 0.5) * 0.5;
      x.fillStyle = css(k > 0 ? mixC(base, [255, 245, 225], k * 0.45) : mixC(base, [0, 0, 0], -k * 0.7), 0.85);
      x.fillRect(R[0] + i, R[1], 1, R[3]);
    }
    const g = x.createLinearGradient(0, R[1], 0, R[1] + R[3]);
    g.addColorStop(0, css([255, 255, 255], 0.12)); g.addColorStop(0.35, css([255, 255, 255], 0)); g.addColorStop(1, css([0, 0, 0], 0.18));
    x.fillStyle = g;
    x.fillRect(R[0], R[1], R[2], R[3]);
    if (L.hair === 'side' || L.hair === 'bob') {
      x.fillStyle = css(mixC(sk, base, 0.5));
      x.fillRect(R[0] + Math.round((0.6 + Math.PI) / (Math.PI * 2) * R[2]), R[1], 1, R[3] * 0.35);
    }
    paintClothes(x, L, rnd);
    x.fillStyle = '#ffffff';
    x.fillRect(REG.white[0], REG.white[1], REG.white[2], REG.white[3]);
    return cv;
  }

  function hashOf(s) {
    let h = 2166136261;
    for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h;
  }

  const W = (rnd, list) => {
    let t = rnd() * list.reduce((a, e) => a + e[1], 0);
    for (const e of list) { t -= e[1]; if (t <= 0) return e[0]; }
    return list[list.length - 1][0];
  };
  function randomFit(rnd, fe) {
    const pickIt = (list, p = 1) => {
      if (rnd() > p) return null;
      const x = ITEM[W(rnd, list)];
      return [x.id, Math.floor(rnd() * x.cols.length)];
    };
    return {
      top: pickIt([['tee', 6], ['tank', 1], ['polo', 2], ['plaid', 2], ['turtle', 1.5], ['deer', 0.6], ['hoodie', 1.5], ['tee_cola', 0.5], ['tee_rigafm', 0.4], ['jurmala', 0.4]]),
      outer: pickIt([['denim', 3], ['leather', 3], ['windbreaker', 2], ['bomber', 1.5], ['olymp', 1.5], ['blazer', 0.2]], 0.45),
      legs: pickIt(fe ? [['jeans', 5], ['skirt', 2], ['trousers', 2], ['track', 1], ['shorts', 0.6]] : [['jeans', 6], ['trousers', 2], ['track', 2], ['cargo', 1.5], ['shorts', 0.6]]),
      feet: pickIt([['kedy', 2], ['sneakers', 3], ['boots', 2], ['moccasins', 0.6]]),
      eyes: pickIt([['drops', 3], ['round', 1], ['horn', 1.5], ['sport_zibens', 0.5], ['mirror', 0.6]], 0.22),
      head: pickIt([['cap_horizon', 1], ['beanie', 1.5], ['cap_riga800', 0.5], ['bandana', 0.4], ['panama', 0.5]], 0.12),
      neck: pickIt([['chain', 2], ['amber', fe ? 2 : 0.2], ['scarf', 0.6], ['phones', 0.6]], 0.15),
      wrist: pickIt([['digital', 2], ['steel', 1.5], ['amber_bracelet', fe ? 1 : 0.1]], 0.35),
      hands: pickIt([['gloves_cut', 2], ['mitts', 1]], 0.06),
      band: false
    };
  }

  function randomLook(seed, body) {
    const rnd = F.rng(seed >>> 0);
    const fe = body ? body === 'f' : rnd() < 0.42;
    const skin = W(rnd, [[0, 3], [1, 6], [2, 4], [3, 2], [4, 1.2], [5, 0.8], [6, 0.5], [7, 0.4]]);
    const hairCol = W(rnd, [[0, 3], [1, 4], [2, 3], [3, 4], [4, 3], [5, fe ? 2 : 0.6], [6, 1], [7, fe ? 0.3 : 1.2], [8, 0.25], [9, 0.15]]);
    const hair = fe ? W(rnd, [['bob', 3], ['kare', 3], ['pony', 3], ['highpony', 1.5], ['braid', 1.5], ['bun', 1.5], ['long', 4], ['curly', 1.5], ['short', 0.6], ['dreads', 0.3]])
      : W(rnd, [['crew', 3], ['short', 5], ['boxfringe', 3], ['slick', 2], ['side', 3], ['mullet', 2], ['long', 0.5], ['curly', 0.8], ['pony', 0.4], ['dreads', 0.3], ['bald', 1.2]]);
    return normLook({
      body: fe ? 'f' : 'm', face: Math.floor(rnd() * 6), skin, eyes: Math.floor(rnd() * EYES.length), eyeCol: W(rnd, [[0, 4], [1, 2], [2, 2], [3, 1.5], [4, 3], [5, 2], [6, 0.4]]),
      brows: Math.floor(rnd() * BROWS.length), freckles: rnd() < (skin < 2 ? 0.2 : 0.04), makeup: fe ? W(rnd, [['none', 3], ['light', 4], ['bold', 1.5], ['y2k', 1.5]]) : 'none',
      hair, hairCol, beard: fe ? 'none' : W(rnd, [['none', 6], ['stubble', 3], ['moustache', 1.5], ['goatee', 1], ['full', 1]]),
      fit: randomFit(rnd, fe)
    });
  }

  const R = (body, face, skin, hair, hairCol, extra, fit) => normLook(Object.assign({ body, face, skin, hair, hairCol, fit: Object.assign({ legs: ['jeans', 0], feet: ['sneakers', 0], band: false }, fit) }, extra));
  const RIVAL_LOOKS = {
    'Jānis_B': R('m', 0, 1, 'short', 4, { eyeCol: 4 }, { top: ['tee', 2], outer: ['olymp', 0], legs: ['track', 0], eyes: ['drops', 0] }),
    'Kolya_ER2': R('m', 2, 2, 'crew', 0, { beard: 'stubble', eyeCol: 1 }, { top: ['tank', 1], outer: ['leather', 0], neck: ['chain', 0], feet: ['boots', 1] }),
    'Mārtiņš': R('m', 1, 0, 'side', 3, { eyeCol: 5, brows: 2 }, { top: ['plaid', 0], feet: ['boots', 0], wrist: ['digital', 0] }),
    'Liene': R('f', 0, 0, 'long', 5, { eyeCol: 4, makeup: 'light' }, { top: ['tee', 0], outer: ['denim', 0], eyes: ['drops', 0], neck: ['amber', 0] }),
    'Andris_BMW': R('m', 5, 1, 'slick', 1, { eyeCol: 2 }, { top: ['turtle', 0], outer: ['leather', 0], legs: ['trousers', 0], wrist: ['steel', 0], eyes: ['mirror', 0] }),
    'Oksana_R': R('f', 3, 1, 'highpony', 6, { eyeCol: 3, makeup: 'bold' }, { top: ['tee', 1], outer: ['bomber', 1], legs: ['skirt', 0], wrist: ['amber_bracelet', 0] }),
    'Dmitrijs': R('m', 2, 1, 'boxfringe', 0, { eyeCol: 0 }, { top: ['tee', 1], outer: ['olymp', 2], legs: ['track', 1], neck: ['chain', 0] }),
    'Raimonds': R('m', 5, 2, 'bald', 7, { beard: 'full', eyeCol: 5 }, { top: ['plaid', 2], outer: ['windbreaker', 1], legs: ['cargo', 0], feet: ['boots', 0] }),
    'Ilze': R('f', 1, 0, 'bob', 2, { eyeCol: 3 }, { top: ['turtle', 0], eyes: ['round', 0], legs: ['trousers', 0] }),
    'Edgars_Turbo': R('m', 4, 1, 'mullet', 4, { eyeCol: 4 }, { top: ['tee_rigafm', 0], outer: ['denim', 1], eyes: ['sport_zibens', 0] }),
    'Sergejs': R('m', 3, 2, 'short', 1, { beard: 'moustache', eyeCol: 0 }, { top: ['polo', 1], outer: ['leather', 1], legs: ['trousers', 1] }),
    'Laura': R('f', 4, 1, 'braid', 4, { eyeCol: 4, freckles: true }, { top: ['polo', 3], hands: ['gloves_cut', 0], legs: ['jeans', 2] }),
    'Artūrs': R('m', 0, 3, 'curly', 2, { eyeCol: 2 }, { top: ['hoodie', 0], neck: ['phones', 0], legs: ['cargo', 1] }),
    'Kristaps': R('m', 4, 0, 'crew', 3, { eyeCol: 4 }, { top: ['tee_cola', 0], head: ['cap_horizon', 0], wrist: ['digital', 1] }),
    'Vika_Riga': R('f', 2, 1, 'kare', 8, { eyeCol: 1, makeup: 'y2k' }, { top: ['tee', 1], outer: ['leather', 0], eyes: ['mirror', 0], legs: ['leather_pants', 0] }),
    'Gatis': R('m', 1, 0, 'short', 6, { freckles: true, eyeCol: 5 }, { top: ['tee', 4], outer: ['windbreaker', 2] }),
    'Valdis': R('m', 3, 1, 'side', 7, { beard: 'goatee', eyeCol: 5 }, { top: ['tee', 1], outer: ['blazer', 0], legs: ['trousers', 0], wrist: ['steel', 1], feet: ['moccasins', 1] }),
    'Inese': R('f', 5, 2, 'bun', 3, { eyeCol: 2, makeup: 'light' }, { top: ['turtle', 1], neck: ['scarf', 0] }),
    'Aleksandrs': R('m', 5, 1, 'slick', 0, { beard: 'stubble', eyeCol: 1 }, { top: ['tee', 0], outer: ['bomber', 1], hands: ['race_gloves', 0] }),
    'Toms': R('m', 0, 5, 'dreads', 1, { eyeCol: 0 }, { top: ['tee', 1], head: ['beanie', 1], neck: ['phones', 1] }),
    'Zane': R('f', 0, 1, 'pony', 2, { eyeCol: 4 }, { top: ['tee_ambernet', 0], eyes: ['sport_zibens', 0], legs: ['shorts', 1] }),
    'Roberts': R('m', 2, 1, 'boxfringe', 2, { eyeCol: 3 }, { top: ['deer', 1], legs: ['jeans', 1], wrist: ['digital', 0], head: ['beanie', 3] })
  };
  const VILKS = R('m', 5, 1, 'slick', 0, { eyes: 2, eyeCol: 5, brows: 2, beard: 'stubble' }, { top: ['turtle', 0], outer: ['leather', 0], legs: ['leather_pants', 0], feet: ['boots', 1], eyes: ['mirror', 0], hands: ['race_gloves', 0], wrist: ['steel', 0] });
  const PLAYER = { m: normLook({ body: 'm', face: 0, skin: 1, eyeCol: 0, brows: 1, hair: 'short', hairCol: 2 }), f: normLook({ body: 'f', face: 0, skin: 1, eyeCol: 4, brows: 1, hair: 'bob', hairCol: 3, makeup: 'light' }) };
  const POOL = Array.from({ length: 32 }, (_, k) => randomLook(7001 + k * 131));
  const TAXI = [0, 1, 2, 3].map(k => {
    const r = randomLook(9100 + k * 37, 'm');
    return normLook(Object.assign({}, r, { hair: k % 2 ? 'short' : 'crew', beard: ['moustache', 'stubble', 'none', 'moustache'][k], fit: { top: ['tee', [0, 2, 1, 0][k]], outer: ['leather', k % 2], head: ['cap_riga800', k % 2 ? 0 : 1], legs: ['trousers', 0], feet: ['boots', 1], band: false } }));
  });
  function rivalLook(name) {
    if (name === 'Вилкс') return VILKS;
    return RIVAL_LOOKS[name] || randomLook(hashOf('rival:' + name), /a$|e$/.test(name) ? 'f' : 'm');
  }
  function trafficLook(uid, id) {
    if (id === 'gaz24') return TAXI[hashOf('taxi' + uid) % TAXI.length];
    return POOL[hashOf('t' + uid) % POOL.length];
  }
  const crowdLooks = () => POOL.concat(TAXI);
  function adopt(p) {
    if (p.driver) return false;
    const r = randomLook(hashOf('player:' + p.name)), d = {};
    for (const k of F.Profile.LOOK_KEYS) d[k] = r[k];
    d.fit = JSON.parse(JSON.stringify(DEFAULT_FIT));
    p.driver = d;
    p.driverNews = true;
    return true;
  }

  function playerLook(p) {
    const d = (p && p.driver) || {}, band = p && Number.isInteger(p.band) ? p.band : 0;
    return normLook(Object.assign({}, PLAYER[d.body === 'f' ? 'f' : 'm'], { fit: DEFAULT_FIT }, d, { bandCol: band }));
  }

  F.Driver = {
    BONES, B, FIG, MS, TEX, REG, SLOTS, ITEMS, ITEM, STARTER, DEFAULT_FIT, normFit, fitList, fitKey, SKINS, EYE_COLS, EYES, BROWS, MAKEUP, BEARDS, HAIR_COLS, HAIRS, FACES, STYLE, POOL,
    rig, make, pose, stand, animate, cue, seatOf, skin, normLook, texKey, rigKey, paintLook, headPt, hairPlan, randomLook, rivalLook, trafficLook, crowdLooks, playerLook, adopt, hashOf, RIVAL_LOOKS, VILKS, TAXI
  };
})(globalThis.Forza = globalThis.Forza || {});
