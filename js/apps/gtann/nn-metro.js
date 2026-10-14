(function (N) {
  'use strict';

  const OX = N.INTERIOR_X + 600, OZ = 3000;
  const P = { half: 51, end: 52, edge: 5, track: 6.5, bed: -1.25, rail: -1.1, wall: 8.4, ceil: 4.2, high: 9, s0: 40, s1: 51, top: 4.6, cab: 60, turn: 60.7, vest: 80, exitTop: 7.4, exitEnd: 87, land: 89.5, tun: 2.3, tunTop: 3.6, vestTop: 8.4, colStep: 6, colV: 2.95, colU: 36, exitW: 4.4 };
  const TR = { cars: 4, len: 19.2, pitch: 19.6, hw: 1.35, hl: 9.6, inW: 1.16, aisle: 0.7, floorW: 1.5, doors: [-6.9, -2.3, 2.3, 6.9], dw: 0.62, cab: 7.6, vmax: 21, slow: 8, acc: 1.0, dec: 1.0, stop: 25, load: 30, unload: 20, turn: 20, n: 6, dead: 250, cross: [75, 135] };
  TR.span = TR.cars * TR.pitch - (TR.pitch - TR.len);
  const LANES = [-5.4, -4.45, -3.5, -2.55, -1.6, -0.65, 0.3, 1.25];
  const EXIT_V = 2.85, BOOTH = [4.4, 6.6];

  const STATIONS = [
    { id: 'pk', name: 'Парк культуры', vault: true, plate: '#e6dcc4', light: [1.9, 1.15, 0.5], tint: [1.12, 0.94, 0.72], wall: [226, 220, 204], wallLow: [96, 92, 86], floor: [132, 128, 122], edge: [200, 196, 188], letters: '#d8b45c', panel: 'mosaic', opened: '15 ноября 1989' },
    { id: 'kir', name: 'Кировская', plate: '#463e3c', col: [240, 238, 232], colIn: [146, 146, 150], wall: [58, 52, 50], frame: [238, 234, 226], floor: [208, 188, 152], floor2: [118, 118, 120], letters: '#f4efe4', panel: 'mosaic', bust: true, light: [1.25, 1.2, 1.1], tint: [1, 1, 1], opened: '15 ноября 1989' },
    { id: 'kom', name: 'Комсомольская', plate: '#8a4e52', col: [238, 236, 232], wall: [136, 76, 80], wallLow: [62, 62, 66], floor: [72, 72, 76], web: [228, 226, 222], letters: '#ccd0d6', closed: [1], light: [1.2, 1.15, 1.1], tint: [1, 0.98, 0.98], opened: '8 августа 1987' },
    { id: 'avt', name: 'Автозаводская', plate: '#ddd4c0', col: [152, 152, 156], wall: [216, 208, 190], floor: [130, 130, 132], inlay: [28, 28, 30], letters: '#d8b670', panel: 'auto', light: [1.2, 1.18, 1.12], tint: [1, 1, 0.98], opened: '8 августа 1987' }
  ];

  N.METRO = { fare: 5, opens: 5 * 60 + 15, closes: 10, OX, OZ, P, TR, STATIONS, LANES, EXIT_V, BOOTH };
  N.metroOpen = clock => clock >= N.METRO.opens || clock < N.METRO.closes;

  const short = n => n.replace(/^проспект (.+)$/, 'пр. $1').replace(/^(.+) проспект$/, '$1 пр.').replace(/^улица (.+)$/, 'ул. $1').replace(/^(.+) улица$/, '$1 ул.').replace(/^площадь (.+)$/, 'пл. $1').replace(/^(.+) площадь$/, '$1 пл.').replace(/^(.+) шоссе$/, '$1 ш.').replace(/^(.+) переулок$/, '$1 пер.').toUpperCase();
  const acc = n => {
    const m = n.match(/^(\S+)(ая|яя) (улица|площадь)$/);
    return short(m ? m[1] + (m[2] === 'ая' ? 'ую' : 'юю') + ' ' + m[3] : n);
  };

  const LANDMARKS = [['park_gate', 'К ПАРКУ КУЛЬТУРЫ'], ['ferris', 'К ПАРКУ КУЛЬТУРЫ'], ['univermag', 'К УНИВЕРМАГУ'], ['dk', 'К ДК ГАЗ'], ['cinema', 'К КИНОТЕАТРУ «МИР»'], ['gaz_gate', 'К ПРОХОДНОЙ ГАЗ'], ['stadium_gate', 'К СТАДИОНУ «ТОРПЕДО»'], ['market', 'К РЫНКУ'], ['hotel_door', 'К ГОСТИНИЦЕ'], ['hosp_n', 'К БОЛЬНИЦЕ'], ['hosp_s', 'К БОЛЬНИЦЕ']];
  const SIDES = ['СЕВЕРНАЯ СТОРОНА', 'СЕВЕРО-ВОСТОЧНАЯ СТОРОНА', 'ВОСТОЧНАЯ СТОРОНА', 'ЮГО-ВОСТОЧНАЯ СТОРОНА', 'ЮЖНАЯ СТОРОНА', 'ЮГО-ЗАПАДНАЯ СТОРОНА', 'ЗАПАДНАЯ СТОРОНА', 'СЕВЕРО-ЗАПАДНАЯ СТОРОНА'];
  const segLen = (p, i) => Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]);

  class Poly {
    constructor(pts) {
      this.p = pts;
      this.cum = [0];
      for (let i = 0; i + 2 < pts.length; i += 2) this.cum.push(this.cum[this.cum.length - 1] + segLen(pts, i));
      this.len = this.cum[this.cum.length - 1];
    }
    at(f, o) {
      const p = this.p, c = this.cum;
      let i = 0;
      while (i < c.length - 2 && c[i + 1] < f) i++;
      const L = c[i + 1] - c[i] || 1, t = (f - c[i]) / L, k = i * 2;
      o.x = p[k] + (p[k + 2] - p[k]) * t;
      o.z = p[k + 1] + (p[k + 3] - p[k + 1]) * t;
      o.dx = (p[k + 2] - p[k]) / L;
      o.dz = (p[k + 3] - p[k + 1]) / L;
      return o;
    }
    fAtX(x) {
      for (let i = 0; i + 2 < this.p.length; i += 2) {
        const a = this.p[i], b = this.p[i + 2];
        if (a !== b && (x - a) * (x - b) <= 0) return this.cum[i / 2] + segLen(this.p, i) * (x - a) / (b - a);
      }
      return 0;
    }
  }

  const prof = (d, vmax) => {
    const a = TR.acc, b = TR.dec;
    let v = vmax, ta = v / a, tb = v / b, da = v * v / (2 * a), tc = 0;
    if (d <= 0) return { d: 0, v: 0, ta: 0, tb: 0, tc: 0, da: 0, T: 0 };
    if (da + v * v / (2 * b) > d) { v = Math.sqrt(2 * d * a * b / (a + b)); ta = v / a; tb = v / b; da = v * v / (2 * a); }
    else tc = (d - da - v * v / (2 * b)) / v;
    return { d, v, ta, tb, tc, da, T: ta + tc + tb };
  };
  const profAt = (q, t) => {
    if (t <= 0) return [0, 0];
    if (t < q.ta) return [0.5 * TR.acc * t * t, TR.acc * t];
    if (t < q.ta + q.tc) return [q.da + q.v * (t - q.ta), q.v];
    const r = Math.max(0, q.T - t);
    return [q.d - 0.5 * TR.dec * r * r, TR.dec * r];
  };

  N.metroSeats = cab => {
    const out = [];
    for (const [a, b] of [[-9.3, -7.52], [-6.28, -2.92], [-1.68, 1.68], [2.92, 6.28], [7.52, 9.3]]) {
      if (cab > 0 && b > TR.cab - 0.2) continue;
      if (cab < 0 && a < -TR.cab + 0.2) continue;
      const n = Math.round((b - a) / 0.56);
      for (let i = 0; i < n; i++) for (const s of [-1, 1]) out.push({ lu: a + (i + 0.5) * (b - a) / n, lv: s * 0.96, s });
    }
    return out;
  };

  class MetroLine {
    constructor(city, reals, gates) {
      this.city = city;
      const st = this.st = STATIONS.map((d, i) => Object.assign({ i, real: { x: reals[i].x, z: reals[i].z } }, d));
      let s = TR.dead + 170;
      st.forEach((q, i) => {
        if (i) s += Math.hypot(q.real.x - st[i - 1].real.x, q.real.z - st[i - 1].real.z);
        q.s = s;
        q.x = OX + s;
        const a = st[Math.max(0, i - 1)].real, b = st[Math.min(st.length - 1, i + 1)].real, L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        q.dir = { x: (b.x - a.x) / L, z: (b.z - a.z) / L };
        q.ends = {};
      });
      this.x0 = st[0].x - TR.dead - 60;
      this.x1 = st[st.length - 1].x + TR.dead + 60;
      this.z0 = OZ - 18;
      this.z1 = OZ + 18;
      this.gates = [];
      for (const g of gates) {
        const q = st.find(o => o.name === g.name);
        if (!q) continue;
        const dx = g.ux - q.real.x, dz = g.uz - q.real.z;
        const e = dx * q.dir.x + dz * q.dir.z >= 0 ? 1 : -1;
        const lat = dx * -q.dir.z + dz * q.dir.x;
        const rec = Object.assign({ st: q.i, e, lat, streets: this.streets(g.ux, g.uz) }, g);
        this.gates.push(rec);
        (q.ends[e] || (q.ends[e] = { e, open: true, exits: [] })).exits.push(rec);
      }
      for (const q of st) {
        for (const e of [-1, 1]) {
          if (q.ends[e]) continue;
          if (q.closed && q.closed.includes(e)) q.ends[e] = { e, open: false, exits: [] };
        }
        for (const E of Object.values(q.ends)) {
          E.exits.sort((a, b) => a.lat - b.lat);
          const used = new Set();
          for (const g of E.exits) {
            g.street = g.streets.find(n => !used.has(n)) || g.streets[0];
            used.add(g.street);
            g.sign = 'ВЫХОД НА ' + acc(g.street);
            g.sub = this.landmark(g.ux, g.uz);
          }
          const dup = E.exits.filter(g => E.exits.some(o => o !== g && o.sign === g.sign && o.sub === g.sub));
          for (const g of dup) {
            const a = Math.atan2(g.ux - q.real.x, -(g.uz - q.real.z));
            g.sub = SIDES[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
          }
          const n = E.exits.length;
          E.W = Math.max(20, n * P.exitW + 4);
          E.exits.forEach((g, k) => { g.v = (k - (n - 1) / 2) * P.exitW; g.slot = k; });
        }
      }
      const zE = OZ + P.track, zW = OZ - P.track, A = st[0].x, B = st[st.length - 1].x;
      this.zE = zE;
      this.zW = zW;
      this.deadW = A - TR.dead;
      this.deadE = B + TR.dead;
      this.legs = [
        new Poly([this.deadW, zW, A - TR.cross[1], zW, A - TR.cross[0], zE, this.deadE, zE]),
        new Poly([this.deadE, zE, B + TR.cross[1], zE, B + TR.cross[0], zW, this.deadW, zW])
      ];
      this.schedule();
      this.fh = new N.SpatialHash(32);
      this.layout();
    }

    landmark(x, z) {
      let best = null, bd = 220;
      for (const [id, text] of LANDMARKS) {
        const p = this.city.places[id];
        if (!p) continue;
        const d = Math.hypot(p.x - x, p.z - z);
        if (d < bd) { bd = d; best = text; }
      }
      return best;
    }

    streets(x, z) {
      const R = 160, best = new Map();
      this.city.roadHash.query(x - R, z - R, x + R, z + R, it => {
        if (it.t !== 0 || !it.e.name || it.e.plant) return;
        const d = Math.sqrt(N.segDist2(x, z, it.ax, it.az, it.bx, it.bz)[0]) + (it.e.name === 'проспект Ленина' ? 60 : 0);
        if (d < R && (!best.has(it.e.name) || best.get(it.e.name) > d)) best.set(it.e.name, d);
      });
      const out = [...best.entries()].sort((a, b) => a[1] - b[1]).map(q => q[0]);
      return out.length ? out : ['проспект Ленина'];
    }

    schedule() {
      const segs = [];
      let t = 0;
      const stopF = (L, si) => this.legs[L].fAtX(this.st[si].x + (L ? -1 : 1) * TR.span / 2);
      for (const L of [0, 1]) {
        const order = L ? [3, 2, 1, 0] : [0, 1, 2, 3];
        let f = TR.span;
        order.forEach((si, k) => {
          const fs = stopF(L, si);
          const q = prof(fs - f, k ? TR.vmax : TR.slow);
          segs.push({ L, type: 'move', t0: t, T: q.T, f0: f, q, to: si, last: k === 3 });
          t += q.T;
          const kind = k === 0 ? 'load' : k === 3 ? 'unload' : 'stop';
          segs.push({ L, type: 'stop', kind, t0: t, T: TR[kind], f0: fs, st: si, next: k < 3 ? order[k + 1] : -1 });
          t += TR[kind];
          f = fs;
        });
        const q = prof(this.legs[L].len - f, TR.slow);
        segs.push({ L, type: 'move', t0: t, T: q.T, f0: f, q, to: -1 });
        t += q.T;
        segs.push({ L, type: 'turn', t0: t, T: TR.turn, f0: this.legs[L].len });
        t += TR.turn;
      }
      segs.forEach((g, i) => { g.i = i; });
      this.segs = segs;
      this.cycle = t;
      this.headway = t / TR.n;
    }

    state(t, o) {
      const c = this.cycle, ph = ((t % c) + c) % c, S = this.segs;
      let lo = 0, hi = S.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m].t0 <= ph) lo = m; else hi = m - 1; }
      const s = S[lo], tau = ph - s.t0;
      o.seg = s;
      o.tau = tau;
      o.L = s.L;
      if (s.type === 'move') { const r = profAt(s.q, tau); o.f = s.f0 + r[0]; o.v = r[1]; o.braking = tau > s.q.ta + s.q.tc && s.to >= 0; }
      else { o.f = s.f0; o.v = 0; o.braking = false; }
      o.doors = s.type === 'stop' ? N.smooth(0.6, 2.0, tau) * (1 - N.smooth(s.T - 3.2, s.T - 1.8, tau)) : 0;
      return o;
    }

    has(x, z) { return x >= this.x0 && x <= this.x1 && z >= this.z0 && z <= this.z1; }

    nearest(x) {
      let best = this.st[0], bd = Infinity;
      for (const q of this.st) { const d = Math.abs(q.x - x); if (d < bd) { bd = d; best = q; } }
      return best;
    }

    light(x, z, y) {
      const q = this.nearest(x), u = Math.abs(x - q.x);
      if (u <= P.end + 1) return 1;
      if (u < P.land + 2 && (y > 3 || Math.abs(z - OZ) > 9.2)) return 1;
      return N.clamp(1 - (u - P.end - 1) / 26, 0.42, 1);
    }

    zone(x, z) {
      const q = this.nearest(x);
      if (Math.abs(x - q.x) < P.land + 4) return 'Метро «' + q.name + '»';
      if (x < this.st[0].x) return 'Оборотный тупик «' + this.st[0].name + '»';
      if (x > this.st[this.st.length - 1].x) return 'Тупик за «' + this.st[this.st.length - 1].name + '»';
      const i = this.st.findIndex(o => o.x > x);
      return 'Перегон «' + this.st[i - 1].name + '» — «' + this.st[i].name + '»';
    }

    outside(x, z) {
      const S = this.st, n = S.length;
      const sx = x - OX;
      let i = 0;
      while (i < n - 2 && S[i + 1].s < sx) i++;
      const a = S[i], b = S[i + 1], k = (sx - a.s) / (b.s - a.s);
      const lat = z - OZ;
      const dx = b.real.x - a.real.x, dz = b.real.z - a.real.z, L = Math.hypot(dx, dz) || 1;
      return { x: a.real.x + dx * k - dz / L * lat * 0.5, z: a.real.z + dz * k + dx / L * lat * 0.5 };
    }

    floorY(x, z, y) {
      let best = P.bed;
      const lim = y === undefined ? 1e9 : y + 0.8;
      this.fh.query(x, z, x, z, q => {
        if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) return;
        const fy = q.xa === undefined ? q.y : q.ya + (q.yb - q.ya) * N.clamp((x - q.xa) / (q.xb - q.xa), 0, 1);
        if (fy <= lim && fy > best) best = fy;
      });
      return best;
    }

    piece(x0, z0, x1, z1, y, ramp) {
      const q = Object.assign({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y }, ramp || {});
      this.fh.insert(q);
      return q;
    }

    wallBox(x0, z0, x1, z1, y0, y1, kind) { return this.city.box(x0, z0, x1, z1, y1, kind || 'wall', { y0, metro: true }); }

    layout() {
      const city = this.city, st = this.st;
      this.signs = [];
      const sign = (style, text, w, h, extra) => { const s = Object.assign({ style, text, w, h }, extra || {}); this.signs.push(s); return s; };
      for (const q of st) {
        const X = q.x, U = (e, u) => X + e * u;
        this.piece(X - P.end, OZ - P.edge, X + P.end, OZ + P.edge, 0);
        this.wallBox(X - P.end, OZ - P.edge, X + P.end, OZ + P.edge, P.bed, 0, 'metro');
        for (const sd of [-1, 1]) {
          this.wallBox(X - P.end, OZ + sd * P.wall, X + P.end, OZ + sd * (P.wall + 0.5), P.bed, P.high + 0.2);
          this.wallBox(X - P.end, OZ + sd * (P.track - P.tun), X + P.end, OZ + sd * (P.track + P.tun), P.bed - 0.75, P.bed, 'metro');
        }
        if (!q.vault) for (const sd of [-1, 1]) for (let u = -P.colU; u <= P.colU + 0.01; u += P.colStep) this.wallBox(X + u - 0.35, OZ + sd * P.colV - 0.35, X + u + 0.35, OZ + sd * P.colV + 0.35, 0, P.ceil, 'column');
        for (const u of [-27, -15, -3, 9, 21]) this.wallBox(X + u - 0.85, OZ - 0.5, X + u + 0.85, OZ + 0.5, 0, 0.5, 'metro');
        q.benches = [-27, -15, -3, 9, 21];
        sign('mname', q.name.toUpperCase(), 7.2, 0.75, { color: q.letters, bg: q.plate });
        for (const e of [-1, 1]) {
          const E = q.ends[e];
          const xe = U(e, P.end);
          if (!E) {
            this.wallBox(Math.min(xe, xe + e * 0.6), OZ - P.track + P.tun, Math.max(xe, xe + e * 0.6), OZ + P.track - P.tun, P.bed, P.high + 0.2);
            for (const sd of [-1, 1]) this.wallBox(Math.min(xe, xe + e * 0.6), OZ + sd * (P.track - P.tun), Math.max(xe, xe + e * 0.6), OZ + sd * (P.track + P.tun), P.tunTop, P.high + 0.2);
            continue;
          }
          const xs0 = U(e, P.s0), xs1 = U(e, P.s1);
          this.piece(xs0, OZ - 3, xs1, OZ + 3, 0, { xa: xs0, xb: xs1, ya: 0, yb: P.top });
          for (const sd of [-1, 1]) {
            this.wallBox(Math.min(U(e, P.s0 - 1.5), xs1), OZ + sd * 3 - 0.13, Math.max(U(e, P.s0 - 1.5), xs1), OZ + sd * 3 + 0.13, 0, P.top + 1.0);
            this.wallBox(Math.min(xe, xe + e * 0.6), OZ + sd * 3, Math.max(xe, xe + e * 0.6), OZ + sd * (P.track - P.tun), P.bed, P.high + 0.2);
            this.wallBox(Math.min(xe, xe + e * 0.6), OZ + sd * (P.track - P.tun), Math.max(xe, xe + e * 0.6), OZ + sd * (P.track + P.tun), P.tunTop, P.high + 0.2);
            this.wallBox(Math.min(U(e, P.half), xe), OZ + sd * (P.track - P.tun - 0.04), Math.max(U(e, P.half), xe), OZ + sd * P.edge, 0, 1.15, 'metro');
          }
          if (!E.open) {
            this.piece(xs1, OZ - 3, U(e, P.end + 2), OZ + 3, P.top);
            this.wallBox(Math.min(U(e, P.end + 1.5), U(e, P.end + 1.7)), OZ - 3, Math.max(U(e, P.end + 1.5), U(e, P.end + 1.7)), OZ + 3, P.top, P.vestTop, 'grille');
            this.wallBox(Math.min(xs1, U(e, P.end + 2)), OZ - 3.3, Math.max(xs1, U(e, P.end + 2)), OZ - 3, P.top, P.vestTop);
            this.wallBox(Math.min(xs1, U(e, P.end + 2)), OZ + 3, Math.max(xs1, U(e, P.end + 2)), OZ + 3.3, P.top, P.vestTop);
            this.wallBox(Math.min(xs1, U(e, P.end + 2)), OZ - 3, Math.max(xs1, U(e, P.end + 2)), OZ + 3, P.top - 1.0, P.top, 'metro');
            sign('msign', 'ПРОХОДА НЕТ', 2.6, 0.42);
            continue;
          }
          const W = E.W, hw = W / 2;
          const xv0 = U(e, P.s1), xv1 = U(e, P.vest);
          this.piece(xv0, OZ - hw, xv1, OZ + hw, P.top);
          this.wallBox(Math.min(xv0, xv1), OZ - hw, Math.max(xv0, xv1), OZ + hw, P.tunTop, P.top, 'metro');
          for (const sd of [-1, 1]) {
            this.wallBox(Math.min(xe, xv1), OZ + sd * hw, Math.max(xe, xv1), OZ + sd * (hw + 0.4), P.top, P.vestTop);
            this.wallBox(Math.min(xe, xe + e * 0.4), OZ + sd * 3, Math.max(xe, xe + e * 0.4), OZ + sd * hw, P.top, P.vestTop);
          }
          const xt0 = U(e, P.cab), xt1 = U(e, P.cab + 1.4);
          for (const v of LANES) this.wallBox(Math.min(xt0, xt1), OZ + v - 0.13, Math.max(xt0, xt1), OZ + v + 0.13, P.top, P.top + 1.0, 'turnstile');
          const xp0 = U(e, P.turn - 0.1), xp1 = U(e, P.turn + 0.1);
          this.wallBox(Math.min(xp0, xp1), OZ - hw, Math.max(xp0, xp1), OZ + LANES[0] - 0.13, P.top, P.top + 2.2, 'glass');
          this.wallBox(Math.min(xp0, xp1), OZ + BOOTH[1], Math.max(xp0, xp1), OZ + hw, P.top, P.top + 2.2, 'glass');
          this.wallBox(Math.min(U(e, P.cab - 1.3), U(e, P.cab + 1.4)), OZ + BOOTH[0], Math.max(U(e, P.cab - 1.3), U(e, P.cab + 1.4)), OZ + BOOTH[1], P.top, P.top + 2.4, 'booth');
          this.wallBox(Math.min(U(e, 66), U(e, 72)), OZ - hw, Math.max(U(e, 66), U(e, 72)), OZ - hw + 0.6, P.top, P.top + 1.1, 'metro');
          this.wallBox(Math.min(U(e, 70), U(e, 73)), OZ + hw - 3.2, Math.max(U(e, 70), U(e, 73)), OZ + hw - 0.2, P.top, P.top + 2.6, 'kiosk');
          E.kiosk = { x: U(e, 71.5), z: OZ + hw - 1.76, rot: e > 0 ? -Math.PI / 2 : Math.PI / 2 };
          E.militia = { x: U(e, P.cab + 2.6), z: OZ + BOOTH[1] + 0.9, yaw: N.yawOf(-e, 0) };
          if (q.bust && e < 0) { this.wallBox(Math.min(U(e, 74), U(e, 76.4)), OZ - 1.2, Math.max(U(e, 74), U(e, 76.4)), OZ + 1.2, P.top, P.top + 3.2, 'monument'); E.bust = { x: U(e, 75.2), z: OZ }; }
          let last = -hw;
          for (const g of E.exits) {
            const v0 = g.v - 1.6, v1 = g.v + 1.6;
            this.wallBox(Math.min(xv1, xv1 + e * 0.4), OZ + last, Math.max(xv1, xv1 + e * 0.4), OZ + v0, P.top, P.vestTop);
            last = v1;
            const xa = xv1, xb = U(e, P.exitEnd), xl = U(e, P.land);
            this.piece(xa, OZ + v0, xb, OZ + v1, P.top, { xa, xb, ya: P.top, yb: P.exitTop });
            this.piece(xb, OZ + v0, xl, OZ + v1, P.exitTop);
            for (const sd of [-1, 1]) this.wallBox(Math.min(xa, xl), OZ + g.v + sd * 1.6 + (sd > 0 ? 0 : -0.3), Math.max(xa, xl), OZ + g.v + sd * 1.6 + (sd > 0 ? 0.3 : 0), P.top, P.exitTop + 3.4);
            this.wallBox(Math.min(xl, xl + e * 0.4), OZ + v0, Math.max(xl, xl + e * 0.4), OZ + v1, P.top, P.exitTop + 3.4);
            g.x = U(e, P.land - 1.2);
            g.z = OZ + g.v;
            g.foot = { x: U(e, P.vest - 0.6), z: OZ + g.v };
            sign('msign', g.sign, 3.2, 0.42);
            if (g.sub) sign('msign', g.sub, 3.0, 0.3);
          }
          this.wallBox(Math.min(xv1, xv1 + e * 0.4), OZ + last, Math.max(xv1, xv1 + e * 0.4), OZ + hw, P.top, P.vestTop);
          sign('msign', 'ВЫХОД В ГОРОД', 3.0, 0.42);
          sign('msign', 'К ПОЕЗДАМ', 2.4, 0.42);
          sign('msign', 'ВХОД', 1.1, 0.3);
          sign('msign', 'ВЫХОД', 1.1, 0.3);
          sign('msign', 'КАССА', 1.4, 0.36);
          sign('msign', 'МИЛИЦИЯ', 1.8, 0.36);
          sign('msign', 'СТОИМОСТЬ ПРОЕЗДА 5 РУБ.', 3.6, 0.42);
          sign('msign', 'ПРОДАЖА ЖЕТОНОВ', 2.6, 0.36);
          sign('shop', 'СОЮЗПЕЧАТЬ', 3.0, 0.54);
          sign('board', 'НА ' + st[e > 0 ? st.length - 1 : 0].name.toUpperCase(), 3.4, 0.5);
        }
        q.place = city.put('mpl_' + q.id, X, OZ + (q.vault ? 0 : 1.5), N.yawOf(1, 0), { y: 0, metroSt: q.i, title: 'Метро «' + q.name + '»' });
      }
      for (let i = 0; i + 1 < st.length; i++) this.tunnel(st[i].x + P.end + 0.6, st[i + 1].x - P.end - 0.6, false);
      this.tunnel(this.deadW - 12, st[0].x - P.end - 0.6, true);
      this.tunnel(st[st.length - 1].x + P.end + 0.6, this.deadE + 12, true);
      this.wallBox(this.deadW - 12.6, OZ - P.wall - 0.4, this.deadW - 12, OZ + P.wall + 0.4, P.bed, P.tunTop);
      this.wallBox(this.deadE + 12, OZ - P.wall - 0.4, this.deadE + 12.6, OZ + P.wall + 0.4, P.bed, P.tunTop);
      sign('msign', 'РЕМОНТНЫЕ РАБОТЫ', 3.4, 0.42);
      sign('msign', 'ПРОХОД ЗАПРЕЩЁН', 2.6, 0.36);
      for (const t of ['ПАРК КУЛЬТУРЫ', 'АВТОЗАВОДСКАЯ']) sign('board', t, 1.6, 0.26);
      for (let d = 0; d <= 9; d++) sign('mled', String(d), 0.2, 0.32);
      sign('mled', ':', 0.2, 0.32);
      this.gates.forEach((g, i) => {
        if (g.x === undefined) return;
        const yawIn = N.yawOf(-g.e, 0);
        city.put('mgi' + i, g.x, g.z, yawIn, { y: P.exitTop, metroGate: i });
        const ox = g.px + g.tx * 2.4, oz = g.pz + g.tz * 2.4;
        city.put('mg' + i, ox, oz, N.yawOf(g.tx, g.tz), { metroGate: i });
        city.teleports.push({ id: 'metro' + i, a: 'mg' + i, b: 'mgi' + i, text: 'Спуститься в метро', back: 'Выйти на улицу', gate: 'metro' });
      });
    }

    tunnel(xa, xb, wide) {
      if (xb <= xa) return;
      for (const sd of [-1, 1]) {
        this.wallBox(xa, OZ + sd * (P.track + P.tun), xb, OZ + sd * (P.track + P.tun + 0.3), P.bed, P.tunTop + 0.1);
        if (!wide) this.wallBox(xa, OZ + sd * (P.track - P.tun - 0.3), xb, OZ + sd * (P.track - P.tun), P.bed, P.tunTop + 0.1);
        this.wallBox(xa, OZ + sd * (P.track - P.tun), xb, OZ + sd * (P.track + P.tun), P.bed - 0.75, P.bed, 'metro');
      }
      if (wide) this.wallBox(xa, OZ - P.track + P.tun, xb, OZ + P.track - P.tun, P.bed - 0.75, P.bed, 'metro');
      (this.tunnels || (this.tunnels = [])).push({ xa, xb, wide });
    }
  }

  N.MetroLine = MetroLine;

  Object.assign(N.City.prototype, {
    metroLayout() {
      const V = this.poiBy.V || [];
      const reals = STATIONS.map(d => V.find(v => v.name === d.name));
      if (reals.some(r => !r)) return;
      this.metroLine = new MetroLine(this, reals, this.metroGates || []);
    }
  });

  const KINDS = [['worker', 7], ['babushka', 3], ['student', 4], ['girl', 4], ['gopnik', 2], ['business', 1], ['pensioner', 3], ['muzhik', 2], ['woman', 5], ['chelnok', 1]];
  const HIT = { lu: 0, lv: 0, c: null };
  const ORDER = [[0, 1, 2, 3], [3, 2, 1, 0]];

  class Metro {
    constructor(w) {
      this.w = w;
      this.L = w.city.metroLine;
      this.rng = N.rng((w.seed || 1) * 13 + 5);
      this.trains = [];
      this.peds = [];
      this.wallet = null;
      this.player = { paid: false, prevU: null, aboard: null };
      this.policeT = 4;
      this.toff = 0;
      if (!this.L) return;
      this.S = this.L.st.map(() => ({ active: false, arriveT: 0, lastDep: [-120, -120], mil: {} }));
      for (let k = 0; k < TR.n; k++) {
        const tr = { id: k, off: k * this.L.cycle / TR.n + 41, s: {}, cars: [], pop: false, prevSeg: -1, prevTau: 0, doors: 0, v: 0, dir: 1, stop: -1, next: -1, kind: 'move', x: 0, z: 0, track: 0 };
        for (let c = 0; c < TR.cars; c++) {
          const cab = c === 0 ? 1 : c === TR.cars - 1 ? -1 : 0;
          tr.cars.push({ tr, i: c, cab, x: 0, z: 0, ex: 1, ez: 0, px: 0, pz: 0, pex: 1, pez: 0, yaw: 0, side: 1, lead: false, tail: false, seats: N.metroSeats(cab).map(q => Object.assign({ who: null }, q)) });
        }
        this.trains.push(tr);
      }
      this.poseAll(true);
    }

    has(x, z) { return !!this.L && this.L.has(x, z); }

    now() { return this.w.t + this.toff; }

    poseAll(init) {
      const L = this.L, t = this.now(), a = {}, b = {};
      for (const tr of this.trains) {
        const s = L.state(t + tr.off, tr.s);
        const poly = L.legs[s.L], sg = s.L === 0 ? 1 : -1;
        for (let j = 0; j < TR.cars; j++) {
          const c = s.L === 0 ? tr.cars[j] : tr.cars[TR.cars - 1 - j];
          const fc = s.f - (j * TR.pitch + TR.len / 2);
          poly.at(fc + 6.3, a);
          poly.at(fc - 6.3, b);
          const dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz) || 1;
          const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2, ex = sg * dx / l, ez = sg * dz / l;
          c.px = init ? x : c.x; c.pz = init ? z : c.z; c.pex = init ? ex : c.ex; c.pez = init ? ez : c.ez;
          c.x = x; c.z = z; c.ex = ex; c.ez = ez;
          c.yaw = N.yawOf(ex, ez) + (c.cab < 0 ? Math.PI : 0);
          c.lead = j === 0;
          c.tail = j === TR.cars - 1;
          c.side = Math.sign(OZ - z) || 1;
        }
        const seg = s.seg;
        tr.v = s.v;
        tr.dir = s.L === 0 ? 1 : -1;
        tr.doors = s.doors;
        tr.stop = seg.type === 'stop' ? seg.st : -1;
        tr.next = seg.type === 'stop' ? seg.next : seg.type === 'move' ? seg.to : -1;
        tr.kind = seg.type === 'stop' ? seg.kind : seg.type;
        tr.braking = s.braking;
        tr.leg = s.L;
        tr.x = (tr.cars[0].x + tr.cars[TR.cars - 1].x) / 2;
        tr.z = (tr.cars[0].z + tr.cars[TR.cars - 1].z) / 2;
        tr.track = Math.abs(tr.z - L.zE) < 1 ? 0 : Math.abs(tr.z - L.zW) < 1 ? 1 : -1;
        tr.lead = tr.cars.find(c => c.lead);
        if (!init) this.trainEvents(tr, s);
        tr.prevSeg = seg.i;
        tr.prevTau = s.tau;
      }
    }

    trainEvents(tr, s) {
      const seg = s.seg, L = this.L, w = this.w, pl = w.player;
      const crossed = t0 => (tr.prevSeg === seg.i ? tr.prevTau < t0 && s.tau >= t0 : s.tau >= t0 && s.tau < t0 + 0.5);
      const near = Math.abs(tr.x - pl.x) < 160 && Math.abs(tr.z - pl.z) < 30;
      const aboard = !!this.player.aboard && this.player.aboard.tr === tr;
      if (seg.type === 'stop') {
        const st = L.st[seg.st];
        if (crossed(0.6) && near) w.emit({ t: 'mdoor', open: true, x: tr.x, z: tr.z });
        if (crossed(seg.T - 3.2) && near) w.emit({ t: 'mdoor', open: false, x: tr.x, z: tr.z });
        if (crossed(seg.T - 0.05)) this.S[seg.st].lastDep[tr.track === 0 ? 0 : 1] = this.now();
        if (seg.kind === 'unload') { if (crossed(1.2) && (aboard || near)) this.say('Станция «' + st.name + '». Конечная. Поезд дальше не идёт, просьба выйти из вагонов.', aboard); }
        else if (crossed(seg.T - 6) && (aboard || near && Math.abs(st.x - pl.x) < 70)) this.say('Осторожно, двери закрываются! Следующая станция — «' + L.st[seg.next].name + '».', aboard);
      } else if (seg.type === 'move' && seg.to >= 0) {
        const st = L.st[seg.to];
        if (aboard && crossed(Math.max(0, seg.T - 9))) this.say(seg.last ? 'Станция «' + st.name + '». Конечная.' : 'Станция «' + st.name + '».', true);
        if (near && crossed(seg.q.ta + seg.q.tc)) w.emit({ t: 'mbrake', x: tr.x, z: tr.z });
      }
    }

    say(text, aboard) { this.w.emit({ t: 'mtalk', who: 'Диктор', text, aboard: !!aboard }); }

    carAt(x, z, prev, lat, lon, only) {
      for (const tr of this.trains) {
        if (only && tr !== only) continue;
        if (Math.abs(tr.x - x) > 45 || Math.abs(tr.z - z) > 4) continue;
        for (const c of tr.cars) {
          const cx = prev ? c.px : c.x, cz = prev ? c.pz : c.z, ex = prev ? c.pex : c.ex, ez = prev ? c.pez : c.ez;
          const dx = x - cx, dz = z - cz;
          const lu = dx * ex + dz * ez, lv = dx * -ez + dz * ex;
          if (Math.abs(lu) <= TR.hl + (lon || 0) && Math.abs(lv) <= lat) { HIT.lu = lu; HIT.lv = lv; HIT.c = c; return HIT; }
        }
      }
      return null;
    }

    floorY(x, z, y) {
      const base = this.L.floorY(x, z, y);
      if (base >= 0 || (Math.abs(z - this.L.zE) > 2 && Math.abs(z - this.L.zW) > 2)) return base;
      if ((y === undefined || y > -0.45) && this.carAt(x, z, false, TR.floorW)) return 0;
      return base;
    }

    open(c, lu, side) {
      if (c.tr.doors < 0.7 || side !== c.side) return false;
      for (const d of TR.doors) if (Math.abs(lu - d) < TR.dw - 0.12) return true;
      return false;
    }

    collide(p) {
      if (p.y < -0.45 || p.mseat) return;
      const r = p.r || 0.34;
      for (const tr of this.trains) {
        if (Math.abs(tr.x - p.x) > 45 || Math.abs(tr.z - p.z) > 4) continue;
        for (const c of tr.cars) {
          const dx = p.x - c.x, dz = p.z - c.z;
          let lu = dx * c.ex + dz * c.ez, lv = dx * -c.ez + dz * c.ex;
          if (Math.abs(lu) > TR.hl + r || Math.abs(lv) > TR.hw + r) continue;
          const sd = lv >= 0 ? 1 : -1;
          if (Math.abs(lv) < TR.hw - 0.02 && Math.abs(lu) < TR.hl) {
            const umax = (c.cab > 0 ? TR.cab - 0.15 : 9.3) - r, umin = -(c.cab < 0 ? TR.cab - 0.15 : 9.3) + r;
            lu = N.clamp(lu, umin, umax);
            const door = TR.doors.some(d => Math.abs(lu - d) < TR.dw);
            const vmax = door ? (this.open(c, lu, sd) ? TR.hw + 1 : TR.inW - r) : TR.aisle;
            if (Math.abs(lv) > vmax) lv = sd * vmax;
          } else {
            if (this.open(c, lu, sd)) continue;
            if (TR.hw + r - Math.abs(lv) < TR.hl + r - Math.abs(lu)) lv = sd * (TR.hw + r); else lu = (lu >= 0 ? 1 : -1) * (TR.hl + r);
            p.blocked = 0.25;
          }
          p.x = c.x + c.ex * lu - c.ez * lv;
          p.z = c.z + c.ez * lu + c.ex * lv;
        }
      }
    }

    carry() {
      const w = this.w;
      this.player.aboard = null;
      for (const p of w.peds) {
        if (p.veh || p.removed || p.y < -0.45 || !this.has(p.x, p.z)) continue;
        if (p.mseat) {
          const s = p.mseat, c = s.c;
          p.x = c.x + c.ex * s.lu - c.ez * s.lv;
          p.z = c.z + c.ez * s.lu + c.ex * s.lv;
          p.y = 0;
          p.vx = p.vz = p.vy = 0;
          p.yaw = N.yawOf(s.s * c.ez, -s.s * c.ex);
          if (p.isPlayer) this.player.aboard = { tr: c.tr, c };
          continue;
        }
        const h = this.carAt(p.x, p.z, true, TR.hw);
        if (!h) continue;
        const c = h.c, lu = h.lu, lv = h.lv;
        p.x = c.x + c.ex * lu - c.ez * lv;
        p.z = c.z + c.ez * lu + c.ex * lv;
        if (p.isPlayer) this.player.aboard = { tr: c.tr, c };
      }
    }

    hitTrack() {
      const w = this.w;
      for (const p of w.peds) {
        if (p.veh || p.removed || p.y > -0.6 || !this.has(p.x, p.z)) continue;
        for (const tr of this.trains) {
          if (Math.abs(tr.v) < 0.3 || Math.abs(tr.x - p.x) > 45 || Math.abs(tr.z - p.z) > 3) continue;
          const h = this.carAt(p.x, p.z, false, TR.hw + 0.25, 0.4, tr);
          if (!h) continue;
          const lv = h.lv, c = tr.lead, fx = tr.dir * c.ex, fz = tr.dir * c.ez, sp = Math.abs(tr.v);
          p.x = c.x + fx * (TR.hl + 0.7) - c.ez * lv;
          p.z = c.z + fz * (TR.hl + 0.7) + c.ex * lv;
          if (sp > 2.2) {
            const was = p.dead;
            w.damagePed(p, 40 + sp * 30, null, 'train', [fx, fz]);
            if (!p.dead) w.knockDown(p, 2.5, fx * sp * 0.9, fz * sp * 0.9, 2.5);
            else { p.vx = fx * sp * 0.9; p.vz = fz * sp * 0.9; p.vy = 2.5; p.onGround = false; }
            if (!was) w.emit({ t: 'runover', x: p.x, z: p.z, train: true });
          } else { p.vx = fx * (sp + 1); p.vz = fz * (sp + 1); }
          break;
        }
      }
    }

    horn() {
      const w = this.w, pl = w.player;
      if (pl.dead || pl.y > -0.6 || !this.has(pl.x, pl.z)) return;
      for (const tr of this.trains) {
        if (Math.abs(tr.v) < 3 || Math.abs(tr.z - pl.z) > 3) continue;
        const ahead = (pl.x - tr.x) * tr.dir;
        if (ahead > 40 && ahead < 170 && w.t - (tr.hornT || -9) > 2.5) { tr.hornT = w.t; w.emit({ t: 'mhorn', x: tr.x + tr.dir * TR.span / 2, z: tr.z }); }
      }
    }

    edge() {
      for (const p of this.peds) {
        if (p.dead || p.removed || p.state === 'down' || p.y < -0.3 || Math.abs(p.y) > 0.4) continue;
        const st = this.L.nearest(p.x);
        if (Math.abs(p.x - st.x) > P.end) continue;
        const v = p.z - OZ;
        if (Math.abs(v) <= P.edge - 0.3) continue;
        if (this.carAt(p.x, p.z, false, TR.hw)) continue;
        const g = p.mm && p.mm.goal;
        if ((g === 'board' || g === 'alight') && p.mm.car && p.mm.car.tr.doors > 0.3) continue;
        p.z = OZ + Math.sign(v) * (P.edge - 0.3);
      }
    }

    fare() {
      const w = this.w, pl = w.player, L = this.L, Q = this.player;
      if (!this.has(pl.x, pl.z)) { Q.prevU = null; Q.paid = false; return; }
      if (pl.veh || pl.dead) { Q.prevU = null; return; }
      const st = L.nearest(pl.x), u = pl.x - st.x, e = u >= 0 ? 1 : -1, E = st.ends[e];
      if (!E || !E.open || pl.y < P.top - 0.6) { Q.prevU = null; return; }
      const ue = u * e, v = pl.z - OZ, prev = Q.prevU;
      Q.prevU = { ue, st: st.i, e };
      if (!prev || prev.st !== st.i || prev.e !== e || Q.paid) return;
      const line = P.turn;
      if (!(prev.ue > line && ue <= line)) return;
      const air = pl.y - L.floorY(pl.x, pl.z, pl.y) > 0.35;
      if (!air && v > LANES[0] && v < LANES[LANES.length - 1]) {
        const money = this.wallet ? this.wallet.get() : N.METRO.fare;
        if (money >= N.METRO.fare) {
          if (this.wallet) this.wallet.pay(N.METRO.fare);
          Q.paid = true;
          w.emit({ t: 'mfare', x: pl.x, z: pl.z, ok: true });
        } else {
          pl.x = st.x + e * (line + 0.7);
          pl.vx = pl.vz = 0;
          w.emit({ t: 'mfare', x: pl.x, z: pl.z, ok: false });
        }
        return;
      }
      Q.paid = true;
      w.emit({ t: 'mdodge', x: pl.x, z: pl.z, jump: air });
      w.crime('fare', pl.x, pl.z);
    }

    spawn(kind, x, z, yaw, mm, y) {
      const w = this.w;
      if (this.peds.length >= 70 && mm.role === 'pax') return null;
      const p = w.spawnPed(kind, x, z, yaw, { persistent: true });
      p.y = y !== undefined ? y : this.L.floorY(x, z);
      p.mm = mm;
      p.metro = true;
      p.ai = { mode: 'metro' };
      this.peds.push(p);
      return p;
    }

    forget(p) {
      const i = this.peds.indexOf(p);
      if (i >= 0) this.peds.splice(i, 1);
      if (p.mseat) { p.mseat.seat.who = null; p.mseat = null; }
      if (!p.removed && !p.isPlayer) this.w.removePed(p);
    }

    kind() { return this.rng.weighted(KINDS); }

    crowd() {
      const h = this.w.clock / 60;
      return h < 5.3 || h >= 23.5 ? 0.15 : h < 7 ? 0.5 : h < 9.5 ? 1.2 : h < 16.5 ? 0.75 : h < 19.5 ? 1.15 : h < 22 ? 0.6 : 0.3;
    }

    waitSpot(st, dir) {
      const r = this.rng, sd = dir === 0 ? 1 : -1;
      if (st.vault) return [st.x + r.range(-34, 34), OZ + sd * r.range(1.2, 4.3), sd, dir];
      if (r() < 0.55) return [st.x + (r.int(-6, 5) * P.colStep + 3) + r.range(-1.6, 1.6), OZ + sd * r.range(3.4, 4.4), sd, dir];
      return [st.x + r.range(-34, 34), OZ + sd * r.range(0.6, 2.2), sd, dir];
    }

    toSpot(st, spot) {
      const gu = Math.round((spot[0] - st.x - 3) / P.colStep) * P.colStep + 3;
      return Math.abs(spot[1] - OZ) > 2.6 && !st.vault ? [[st.x + gu, OZ], [st.x + gu, spot[1]], [spot[0], spot[1]]] : [[spot[0], spot[1]]];
    }

    stationLife(dt) {
      const w = this.w, pl = w.player, L = this.L;
      const inM = this.has(pl.x, pl.z) && !pl.dead;
      for (const st of L.st) {
        const S = this.S[st.i], was = S.active;
        S.active = inM && Math.abs(pl.x - st.x) < 230;
        if (S.active && !was) this.fillStation(st);
        if (!S.active && was) this.clearStation(st);
        if (!S.active) continue;
        S.arriveT -= dt;
        if (S.arriveT <= 0) {
          S.arriveT = this.rng.range(5, 12) / Math.max(0.2, this.crowd());
          const waiting = this.peds.filter(p => p.mm.st === st.i && (p.mm.goal === 'wait' || p.mm.goal === 'enter')).length;
          if (waiting < Math.round(12 * this.crowd())) this.arrival(st);
        }
        for (const E of Object.values(st.ends)) {
          if (!E.open || !E.militia || S.mil[E.e]) continue;
          const m = E.militia;
          S.mil[E.e] = this.spawn('militia', m.x, m.z, m.yaw, { role: 'mil', st: st.i, goal: 'post', post: [m.x, m.z, m.yaw] }, P.top);
        }
      }
    }

    fillStation(st) {
      const n = Math.round(10 * this.crowd());
      for (let k = 0; k < n; k++) {
        const dir = this.rng() < 0.5 ? 0 : 1, spot = this.waitSpot(st, dir);
        this.spawn(this.kind(), spot[0], spot[1], N.yawOf(0, spot[2]), { role: 'pax', st: st.i, goal: 'wait', dir, spot }, 0);
      }
    }

    clearStation(st) {
      const keep = this.player.aboard ? this.player.aboard.tr : null;
      for (const p of this.peds.slice()) {
        if (p.mm.st !== st.i && p.mm.role !== 'cop') continue;
        if (p.mm.goal === 'ride' && p.mm.tr === keep) continue;
        if (p.mm.role === 'cop' && (this.w.wanted.level > 0 || p.mm.st !== st.i)) continue;
        this.forget(p);
      }
      this.S[st.i].mil = {};
    }

    arrival(st) {
      const ends = Object.values(st.ends).filter(E => E.open && E.exits.length);
      if (!ends.length) return;
      const E = this.rng.pick(ends), g = this.rng.pick(E.exits), pl = this.w.player;
      if (Math.hypot(pl.x - g.x, pl.z - g.z) < 12) return;
      const dir = this.rng() < 0.5 ? 0 : 1, spot = this.waitSpot(st, dir), e = E.e;
      const lane = LANES[this.rng.int(0, LANES.length - 2)] + 0.475;
      const path = [[g.foot.x, g.foot.z], [st.x + e * (P.cab + 2.2), OZ + lane], [st.x + e * (P.cab - 1.2), OZ + lane], [st.x + e * (P.s1 + 1.5), OZ], [st.x + e * (P.s0 - 0.5), OZ], [st.x + e * (P.colU - 1), OZ]].concat(this.toSpot(st, spot));
      this.spawn(this.kind(), g.x, g.z, N.yawOf(-e, 0), { role: 'pax', st: st.i, goal: 'enter', dir, spot, path, i: 0 }, P.exitTop);
    }

    exitPath(p, st) {
      const ends = Object.values(st.ends).filter(E => E.open && E.exits.length);
      if (!ends.length) return null;
      let E = ends[0];
      for (const q of ends) if (Math.abs(st.x + q.e * 45 - p.x) < Math.abs(st.x + E.e * 45 - p.x)) E = q;
      const g = this.rng.pick(E.exits), e = E.e, path = [];
      const onPlat = Math.abs(p.y) < 0.5 && Math.abs(p.x - st.x) < P.s0;
      if (onPlat && Math.abs(p.z - OZ) > 2.6 && !st.vault) { const gu = Math.round((p.x - st.x - 3) / P.colStep) * P.colStep + 3; path.push([st.x + gu, p.z], [st.x + gu, OZ]); }
      if (onPlat) path.push([st.x + e * (P.colU - 1), OZ], [st.x + e * (P.s0 - 0.5), OZ]);
      if (p.y < P.top - 0.5) path.push([st.x + e * (P.s1 + 1.5), OZ]);
      path.push([st.x + e * (P.cab - 1.5), OZ + EXIT_V], [st.x + e * (P.cab + 2.4), OZ + EXIT_V], [g.foot.x, g.foot.z], [g.x, g.z]);
      return path;
    }

    riders(tr) {
      const s = this.L.state(this.now() + tr.off, {}), seg = s.seg, order = ORDER[s.L];
      const nextSt = seg.type === 'stop' ? seg.st : seg.to;
      const k0 = order.indexOf(nextSt);
      tr.pop = true;
      if (k0 <= 0) return;
      const k = this.crowd();
      for (const c of tr.cars) {
        const n = Math.max(0, Math.round(k * this.rng.range(1.5, 7)));
        for (let i = 0; i < n; i++) {
          const dest = order[this.rng.int(k0, 3)];
          const free = c.seats.filter(q => !q.who);
          let lu, lv, seat = null;
          if (free.length && this.rng() < 0.7) { seat = this.rng.pick(free); lu = seat.lu; lv = seat.lv; }
          else { lu = this.rng.pick(TR.doors) + this.rng.range(-0.4, 0.4); lv = this.rng.range(-0.5, 0.5); }
          const p = this.spawn(this.kind(), c.x + c.ex * lu - c.ez * lv, c.z + c.ez * lu + c.ex * lv, N.yawOf(c.ex, c.ez) + (this.rng() < 0.5 ? Math.PI : 0), { role: 'pax', st: dest, goal: 'ride', tr, dest }, 0);
          if (!p) return;
          if (seat) this.sit(p, c, seat);
        }
      }
    }

    sit(p, c, seat) {
      seat.who = p;
      p.mseat = { c, seat, lu: seat.lu, lv: seat.lv, s: seat.s };
      p.wantVx = p.wantVz = p.vx = p.vz = 0;
    }

    stand(p) {
      const m = p.mseat;
      if (!m) return;
      m.seat.who = null;
      const c = m.c, lv = m.lv * 0.45;
      p.x = c.x + c.ex * m.lu - c.ez * lv;
      p.z = c.z + c.ez * m.lu + c.ex * lv;
      p.mseat = null;
    }

    trainLife() {
      const pl = this.w.player, inM = this.has(pl.x, pl.z) && !pl.dead;
      const mine = this.player.aboard ? this.player.aboard.tr : null;
      for (const tr of this.trains) {
        const next = tr.next >= 0 ? this.L.st[tr.next] : null;
        if (!tr.pop && inM && next && this.S[next.i].active && Math.abs(tr.x - next.x) < 420 && tr.kind !== 'turn' && (Math.abs(tr.x - pl.x) > 110 || tr === mine)) this.riders(tr);
        if (tr.pop && tr !== mine && (!inM || Math.abs(tr.x - pl.x) > 330)) {
          for (const p of this.peds.slice()) if (p.mm.tr === tr && (p.mm.goal === 'ride' || p.mm.goal === 'board')) this.forget(p);
          tr.pop = false;
        }
      }
    }

    police(dt) {
      const w = this.w, pl = w.player, lvl = w.wanted.level;
      if (!this.has(pl.x, pl.z) || pl.dead) return;
      for (const p of this.peds) {
        if (p.mm.role !== 'mil' || p.dead) continue;
        if (lvl > 0 && p.ai.mode === 'metro' && Math.hypot(pl.x - p.x, pl.z - p.z) < 40 && Math.abs(pl.y - p.y) < 6 && w.los(p.x, p.y + 1.6, p.z, pl.x, pl.y + 1.4, pl.z)) p.ai = { mode: 'cop' };
        if (lvl === 0 && p.ai.mode !== 'metro') p.ai = { mode: 'metro' };
      }
      if (lvl <= 0) return;
      this.policeT -= dt;
      if (this.policeT > 0) return;
      this.policeT = 9;
      if (this.peds.filter(p => p.mm.role === 'cop' && !p.dead).length >= lvl * 2) return;
      const st = this.L.nearest(pl.x), cand = [];
      for (const E of Object.values(st.ends)) if (E.open) for (const g of E.exits) if (Math.hypot(g.x - pl.x, g.z - pl.z) > 22) cand.push(g);
      if (!cand.length) return;
      const g = this.rng.pick(cand), kind = lvl >= 3 ? 'omon' : 'militia';
      for (let i = 0; i < (lvl >= 2 ? 2 : 1); i++) {
        const p = this.spawn(kind, g.x + i * 0.8, g.z, N.yawOf(-g.e, 0), { role: 'cop', st: st.i, goal: 'cop' }, P.exitTop);
        if (p) p.ai = { mode: 'cop', hostile: lvl >= 2 };
      }
    }

    pedStep(p, dt) {
      const m = p.mm;
      p.wantVx = p.wantVz = 0;
      if (!m) return;
      const L = this.L, st = L.st[m.st] || L.nearest(p.x);
      if (m.goal === 'post') {
        const [x, z, yaw] = m.post;
        if (Math.hypot(x - p.x, z - p.z) > 0.6) N.AI.moveTo(p, x, z, 1.4, dt); else p.yaw = N.turnTo(p.yaw, yaw, dt * 4);
        return;
      }
      if (m.goal === 'cop') { p.ai = { mode: 'cop', hostile: true }; return; }
      if (m.path) {
        const q = m.path[m.i];
        const d = N.AI.moveTo(p, q[0], q[1], m.run ? 4.2 : 1.45, dt);
        if (d < (m.i === m.path.length - 1 ? 0.35 : 0.7)) m.i++;
        if (m.i >= m.path.length) {
          m.path = null;
          p.wantVx = p.wantVz = 0;
          if (m.goal === 'leave') { this.forget(p); return; }
          if (m.goal === 'enter') m.goal = 'wait';
        }
        if (m.path && m.goal === 'enter' && m.i >= m.path.length - 3) this.boardCheck(p, m, st);
        return;
      }
      if (m.goal === 'wait') {
        p.yaw = N.turnTo(p.yaw, N.yawOf(0, m.spot[2]), dt * 3);
        this.boardCheck(p, m, st);
        return;
      }
      if (m.goal === 'board') {
        const tr = m.tr, c = m.car, sd = c.side;
        if (tr.stop !== st.i || tr.doors < 0.4) {
          if (this.carAt(p.x, p.z, false, TR.hw)) this.becomeRider(p, m, tr, st.i);
          else { m.goal = 'wait'; m.tr = m.car = null; }
          return;
        }
        const dx = c.x + c.ex * m.du, dz = c.z + c.ez * m.du;
        const steps = [[dx, OZ + Math.sign(c.z - OZ) * (P.edge - 0.7)], [dx - c.ez * sd * 0.6, dz + c.ex * sd * 0.6], [c.x + c.ex * m.lu - c.ez * m.lv, c.z + c.ez * m.lu + c.ex * m.lv]];
        const q = steps[m.k];
        if (N.AI.moveTo(p, q[0], q[1], 1.6, dt) < 0.35 && ++m.k >= steps.length) {
          this.becomeRider(p, m, tr, st.i);
          if (m.seat && !m.seat.who) this.sit(p, c, m.seat);
        }
        return;
      }
      if (m.goal === 'ride') {
        const tr = m.tr;
        if (!tr || tr.stop < 0 || tr.doors < 0.8 || !(tr.stop === m.dest || tr.kind === 'unload')) return;
        this.stand(p);
        const h = this.carAt(p.x, p.z, false, TR.hw);
        if (!h) return;
        let du = TR.doors[0];
        for (const d of TR.doors) if (Math.abs(d - h.lu) < Math.abs(du - h.lu)) du = d;
        Object.assign(m, { goal: 'alight', st: tr.stop, car: h.c, k: 0, du });
        return;
      }
      if (m.goal === 'alight') {
        const c = m.car, sd = c.side;
        const steps = [[c.x + c.ex * m.du, c.z + c.ez * m.du], [c.x + c.ex * m.du - c.ez * sd * 1.75, c.z + c.ez * m.du + c.ex * sd * 1.75], [c.x + c.ex * m.du - c.ez * sd * 2.7, c.z + c.ez * m.du + c.ex * sd * 2.7]];
        const q = steps[Math.min(m.k, steps.length - 1)];
        if (N.AI.moveTo(p, q[0], q[1], 1.6, dt) < 0.4) m.k++;
        const inCar = this.carAt(p.x, p.z, false, TR.hw);
        if (inCar && c.tr.doors < 0.3) { this.becomeRider(p, m, c.tr, c.tr.stop >= 0 ? c.tr.stop : m.st); return; }
        if (m.k >= steps.length) {
          Object.assign(m, { goal: 'leave', tr: null, car: null, i: 0 });
          m.path = this.exitPath(p, L.st[m.st]);
          if (!m.path) this.forget(p);
        }
        return;
      }
      if (m.goal === 'leave') { m.path = this.exitPath(p, st); m.i = 0; if (!m.path) this.forget(p); }
    }

    becomeRider(p, m, tr, from) {
      m.goal = 'ride';
      m.tr = tr;
      m.dest = this.destFor(tr, from);
      m.st = m.dest;
      m.path = null;
    }

    destFor(tr, from) {
      const order = ORDER[tr.dir > 0 ? 0 : 1], k = order.indexOf(from);
      return order[this.rng.int(Math.min(3, k + 1), 3)];
    }

    boardCheck(p, m, st) {
      for (const tr of this.trains) {
        if (tr.stop !== st.i || tr.doors < 0.7 || tr.kind === 'unload' || (tr.dir > 0 ? 0 : 1) !== m.dir) continue;
        let best = null, bd = 40;
        for (const c of tr.cars) for (const du of TR.doors) {
          const d = Math.hypot(c.x + c.ex * du - p.x, c.z + c.ez * du - p.z);
          if (d < bd) { bd = d; best = [c, du]; }
        }
        if (!best) continue;
        const [c, du] = best;
        const free = c.seats.filter(q => !q.who && Math.abs(q.lu - du) < 4);
        const seat = free.length && this.rng() < 0.75 ? this.rng.pick(free) : null;
        Object.assign(m, { goal: 'board', tr, car: c, du, k: 0, seat, path: null, lu: seat ? seat.lu : du + this.rng.range(-0.5, 0.5), lv: seat ? seat.lv * 0.5 : this.rng.range(-0.4, 0.4) });
        return;
      }
    }

    tidy() {
      for (const p of this.w.peds) {
        if (p.isPlayer || p.mm || p.dead || p.veh || !this.has(p.x, p.z) || !p.ai || p.ai.mode !== 'walk' && p.ai.mode !== 'leave') continue;
        p.mm = { role: 'pax', goal: 'leave', st: this.L.nearest(p.x).i };
        p.ai = { mode: 'metro' };
        p.metro = true;
        p.persistent = true;
        this.peds.push(p);
      }
      for (const p of this.peds.slice()) {
        if (p.removed) { this.forget(p); continue; }
        if (p.dead) { if (p.deadT > 60) this.forget(p); continue; }
        const a = p.ai;
        if (a && (a.mode === 'walk' || a.mode === 'leave')) {
          p.ai = { mode: 'metro' };
          if (p.mm.role === 'cop') p.mm.role = 'pax';
          if (p.mm.role === 'pax' && p.mm.goal !== 'ride') Object.assign(p.mm, { goal: 'leave', path: null, st: this.L.nearest(p.x).i });
        }
        if (p.mseat && (p.state === 'down' || a && a.mode !== 'metro')) this.stand(p);
      }
    }

    act(p) {
      if (!this.has(p.x, p.z)) return false;
      if (p.mseat) { this.stand(p); return true; }
      const h = this.carAt(p.x, p.z, false, TR.hw);
      if (!h) return false;
      let best = null, bd = 1.6;
      for (const s of h.c.seats) { if (s.who) continue; const d = Math.hypot(s.lu - h.lu, s.lv - h.lv); if (d < bd) { bd = d; best = s; } }
      if (!best) return false;
      this.sit(p, h.c, best);
      return true;
    }

    eye() {
      const pl = this.w.player, A = this.player.aboard;
      if (!A || pl.dead || pl.veh) return null;
      const tall = (pl.look && pl.look.tall) || 1;
      return { x: pl.x, y: pl.y + (pl.mseat ? 1.3 : 1.62) * tall, z: pl.z };
    }

    skipTime(tr) {
      const L = this.L, c = L.cycle, S = L.segs, ph = (((this.now() + tr.off) % c) + c) % c;
      let i = 0;
      while (i < S.length - 1 && S[i + 1].t0 <= ph) i++;
      for (let k = 1; k <= S.length; k++) {
        const g = S[(i + k) % S.length];
        if (g.type !== 'stop') continue;
        let d = g.t0 + 2.4 - ph;
        if (d <= 0) d += c;
        return { d, st: g.st };
      }
      return null;
    }

    skip() {
      const A = this.player.aboard;
      if (!A) return null;
      const tr = A.tr, nx = this.skipTime(tr);
      if (!nx) return null;
      const keep = [];
      for (const p of this.w.peds) {
        if (p.veh || p.removed || p.y < -0.45 || !this.has(p.x, p.z)) continue;
        const h = p.mseat ? null : this.carAt(p.x, p.z, false, TR.hw);
        if (h) keep.push([p, h.c, h.lu, h.lv]);
      }
      this.toff += nx.d;
      this.w.clock = (this.w.clock + nx.d) % 1440;
      this.w.wanted.unseen += nx.d;
      this.poseAll(true);
      for (const [p, c, lu, lv] of keep) {
        p.x = c.x + c.ex * lu - c.ez * lv;
        p.z = c.z + c.ez * lu + c.ex * lv;
        p.y = 0;
        p.vx = p.vz = p.vy = 0;
      }
      this.carry();
      return this.L.st[nx.st];
    }

    camRoom(x, y, z, dx, dy, dz, d) {
      const A = this.player.aboard;
      const inCar = (px, py, pz, c) => {
        const ox = px - c.x, oz = pz - c.z, lu = ox * c.ex + oz * c.ez, lv = ox * -c.ez + oz * c.ex;
        return Math.abs(lu) < TR.hl - 0.25 && Math.abs(lv) < TR.inW - 0.08 && py > 0.1 && py < 2.3;
      };
      for (let s = 0.15; s <= d; s += 0.12) {
        const px = x + dx * s, py = y + dy * s, pz = z + dz * s;
        if (A) { if (!inCar(px, py, pz, A.c)) return Math.max(0.3, s - 0.15); continue; }
        const h = this.carAt(px, pz, false, TR.hw + 0.1);
        if (h && py > -0.5 && py < 2.8) return Math.max(0.3, s - 0.2);
      }
      return d;
    }

    seatNear(p) {
      if (p.mseat) return 'встать';
      const h = this.carAt(p.x, p.z, false, TR.hw);
      if (!h) return null;
      for (const s of h.c.seats) if (!s.who && Math.hypot(s.lu - h.lu, s.lv - h.lv) < 1.6) return 'сесть';
      return null;
    }

    gate(inward) {
      if (!inward) return null;
      const w = this.w;
      if (!N.metroOpen(w.clock)) return 'Метро закрыто. Первый поезд — в 5:15.';
      if (w.wanted.level >= 4) return 'Вход в метро перекрыт милицией.';
      return null;
    }

    sound() {
      const pl = this.w.player;
      if (!this.has(pl.x, pl.z)) return null;
      const A = this.player.aboard;
      let near = null, nd = Infinity;
      for (const tr of this.trains) {
        if (A && A.tr === tr) continue;
        const d = Math.hypot(Math.max(0, Math.abs(tr.x - pl.x) - TR.span / 2), tr.z - pl.z);
        if (d < nd) { nd = d; near = tr; }
      }
      return { ride: A ? Math.abs(A.tr.v) : -1, near: near ? { d: nd, v: Math.abs(near.v) } : null, tunnel: this.L.light(pl.x, pl.z, pl.y) < 0.9 };
    }

    step(dt) {
      if (!this.L) return;
      const w = this.w;
      this.poseAll(false);
      this.carry();
      for (const p of w.peds) if (!p.veh && this.has(p.x, p.z)) this.collide(p);
      this.hitTrack();
      this.horn();
      this.fare();
      this.stationLife(dt);
      this.trainLife();
      this.police(dt);
      this.edge();
      this.tidy();
    }
  }

  N.Metro = Metro;

  if (N.AI && N.AI.pmodes) N.AI.pmodes.metro = (w, p, dt) => { if (w.metro && w.metro.L) w.metro.pedStep(p, dt); else p.wantVx = p.wantVz = 0; };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
