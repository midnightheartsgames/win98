(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const H = (a, b, s) => N.hash2(a, b, s);

  N.CITY_DETAIL = {
    high: { name: 'высокая', r: 230 },
    mid: { name: 'средняя', r: 150 },
    low: { name: 'низкая', r: 0 }
  };

  const BAL = {
    panel5: { every: 4, pair: true, depth: 0.95, rail: 'panel', glazed: 0.32, side: 'away' },
    brick5: { every: 3, depth: 0.85, rail: 'bars', glazed: 0.3, side: 'away' },
    panel9: { every: 3, depth: 1.05, rail: 'panel', glazed: 0.42, side: 'away', loggia: true },
    panel9b: { every: 3, depth: 1.05, rail: 'panel', glazed: 0.42, side: 'away', loggia: true },
    panel16: { every: 3, depth: 1.1, rail: 'bars', glazed: 0.38, side: 'all' },
    panel16b: { every: 3, depth: 1.1, rail: 'bars', glazed: 0.38, side: 'all' },
    stalin: { every: 0, depth: 0.8, rail: 'balustrade', glazed: 0.08, side: 'street' },
    stalinb: { every: 0, depth: 0.8, rail: 'balustrade', glazed: 0.08, side: 'street' },
    soc: { every: 5, depth: 0.75, rail: 'bars', glazed: 0.12, side: 'all' }
  };

  const STAIR = {
    panel5: { win: [58, 70, 140, 128], band: [6, 62] },
    brick5: { win: [60, 70, 136, 130], band: [2, 56] },
    panel9: { win: [40, 50, 176, 118], band: [4, 44] },
    panel9b: { win: [48, 56, 160, 124], band: [4, 50] },
    panel16: { win: [44, 46, 168, 130], band: [4, 40] },
    panel16b: { win: [44, 46, 168, 130], band: [4, 40] }
  };

  const CONC = [196, 194, 188, 255];
  const METAL = [118, 120, 122, 255];
  const LAUNDRY = [[230, 60, 50, 255], [240, 240, 236, 255], [60, 110, 200, 255], [240, 200, 60, 255], [90, 160, 90, 255], [200, 120, 180, 255]];

  class Detail {
    constructor(geo) {
      this.geo = geo;
      this.city = geo.city;
    }

    chunk(ch) {
      if (!ch.blds || !ch.blds.length) return null;
      const mb = new N.MB(2048);
      for (const id of ch.blds) {
        const b = this.city.buildings[id];
        if (!b || b.removed || b.lm) continue;
        this.building(mb, b);
      }
      return mb.ni ? mb : null;
    }

    building(mb, b) {
      const st = N.STYLE[b.style];
      if (!st || b.y0) return;
      const res = b.kind === 'k' || b.kind === 'p' || b.kind === 't' || b.kind === 's' || b.kind === 'c';
      if (!res) return;
      const kit = N.Landmarks.kit;
      const bal = BAL[b.style];
      const doors = this.geo.doorsOf(b);
      const m = b.mb;
      const flat = !(b.roof === 'gable' || b.roof === 'hip') && !b.roofShape;
      const tint = this.tint(b, st), par = flat && b.h > 6 ? (st.cornice ? 0.9 : 0.6) : 0;
      const stairs = new Map();
      for (const e of kit.edges(b.poly)) {
        if (e.L < 6) continue;
        const along = Math.abs(e.ux * m.ax + e.uz * m.az) > 0.85;
        const grid = this.geo.facadeGrid(b, st, e);
        const sm = this.stairMods(e, grid, doors);
        stairs.set(e.i, sm);
        if (STAIR[b.style] && !grid.shop) for (const k of sm) this.stairwell(mb, b, st, e, grid, k, tint);
        if (bal && along && grid.mods >= 2 && this.wantsBalconies(b, bal, e, doors)) this.balconies(mb, b, st, bal, e, grid, sm);
        if (b.kind !== 't' && b.kind !== 'p' && e.L > 10 && H(b.id, e.i, 31) < 0.55) this.pipe(mb, e, e.L - 0.35, b.h);
        if (b.style === 'soc' && along && e.L > 40) this.passage(mb, b, e, grid);
        if (!grid.shop) this.plinth(mb, b, e, grid, sm);
        if (b.kind === 'k' && STAIR[b.style] && !grid.shop) this.grilles(mb, b, e, grid, sm);
        if (par) kit.ebox(mb, e, -0.03, e.L + 0.03, -0.34, 0.05, b.h + par, b.h + par + 0.05, { layer: T('metal'), us: 2, vs: 1, c: [150, 152, 154, 255] });
      }
      if (flat) this.antennas(mb, b);
      if (flat && b.kind === 'k') this.roofVents(mb, b, doors);
      if (b.kind === 'p' || b.kind === 't') this.acUnits(mb, b, st, stairs);
    }

    tint(b, st) {
      const r = N.rng(b.id * 7919 + 13);
      return N.rgb(b.c || st.tints[Math.floor(r() * st.tints.length)]);
    }

    stairMods(e, g, doors) {
      const out = new Set();
      for (const d of doors) {
        const v = (d.x - e.ax) * e.nx + (d.z - e.az) * e.nz, s = (d.x - e.ax) * e.ux + (d.z - e.az) * e.uz;
        if (Math.abs(v) > 0.3 || s < 0 || s > e.L) continue;
        const k = Math.min(g.mods - 1, Math.floor(s / g.us));
        if (Math.abs(s - (k + 0.5) * g.us) < 0.15) out.add(k);
      }
      return out;
    }

    stairwell(mb, b, st, e, g, k, tint) {
      const kit = N.Landmarks.kit, S = STAIR[b.style], lay = T(st.wall);
      const s0 = k * g.us, s1 = s0 + g.us;
      const P = (s, v) => kit.ep(e, s, v);
      const split = Math.min(b.h, g.yb + 3), lo = [tint[0] * 0.62 | 0, tint[1] * 0.62 | 0, tint[2] * 0.62 | 0, 255];
      const col = y => { if (y >= split) return tint; const t = (y - g.yb) / (split - g.yb); return [lo[0] + (tint[0] - lo[0]) * t | 0, lo[1] + (tint[1] - lo[1]) * t | 0, lo[2] + (tint[2] - lo[2]) * t | 0, 255]; };
      const quad = (a0, a1, y0, y1, v, u0, u1, t0, t1, kind) => {
        const A = P(a0, v), B = P(a1, v);
        mb.quad([B[0], y0, B[1], A[0], y0, A[1], A[0], y1, A[1], B[0], y1, B[1]], [e.nx, 0, e.nz], [u0, t1, u1, t1, u1, t0, u0, t0], col(y0), lay, kind, col(y1));
      };
      const bh = (S.band[1] - S.band[0]) / 256 * g.fh, t0 = S.band[0] / 256;
      for (let y = g.yb; y < b.h - 1e-3; y += bh) {
        const y1 = Math.min(b.h, y + bh);
        quad(s0, s1, y, y1, 0.018, 0, 1, t0, t0 + (y1 - y) / g.fh, K.FACADE);
      }
      const [wx, wy, ww, wh] = S.win, w = ww / 256 * g.us * 0.62, h = wh / 256 * g.fh * 0.72, c = (s0 + s1) / 2;
      const mid = 1 - (wy + wh / 2) / 256;
      for (let j = 0; j < g.floors; j++) {
        const yc = g.base + (j + mid) * g.fh + g.fh / 2;
        if (yc - h / 2 < g.yb + 2.75 || yc + h / 2 > b.h - 0.25) continue;
        quad(c - w / 2, c + w / 2, yc - h / 2, yc + h / 2, 0.03, wx / 256 + j, (wx + ww) / 256 + j, wy / 256 + k, (wy + wh) / 256 + k, K.FACADE);
      }
    }

    plinth(mb, b, e, g, sm) {
      if (!(b.h > 4) || b.y0) return;
      const kit = N.Landmarks.kit;
      for (let k = 0; k < g.mods; k += 2) {
        if (sm.has(k)) continue;
        const c = (k + 0.5) * g.us;
        kit.face(mb, e, c - 0.18, c + 0.18, 0.012, 0.12, 0.34, { layer: T('darkmetal'), c: [34, 34, 36, 255] });
      }
    }

    grilles(mb, b, e, g, sm) {
      const kit = N.Landmarks.kit, S = STAIR[b.style], [wx, wy, ww, wh] = S.win;
      for (let k = 0; k < g.mods; k++) {
        if (sm.has(k) || H(b.id * 7 + e.i, k, 77) > 0.22) continue;
        const s = k * g.us, x0 = s + wx / 256 * g.us, x1 = s + (wx + ww) / 256 * g.us;
        const y1 = g.base + (1 - wy / 256) * g.fh, y0 = g.base + (1 - (wy + wh) / 256) * g.fh;
        if (y0 < g.yb - 0.05) continue;
        kit.face(mb, e, x0 - 0.03, x1 + 0.03, 0.07, y0 - 0.03, y1 + 0.03, { layer: T('railing'), kind: K.DECAL, us: 1.4, vs: y1 - y0 + 0.06, v0: 0, c: [60, 62, 64, 255] });
      }
    }

    roofVents(mb, b, doors) {
      const m = b.mb, y = b.h, brick = { side: { layer: T('brick5'), us: 3, vs: 3, c: [200, 150, 130, 255] }, top: { layer: T('concrete'), us: 1, c: [150, 148, 144, 255] } };
      for (const d of doors) {
        const fx = Math.sin(d.rot), fz = -Math.cos(d.rot);
        const x = d.x - fx * Math.min(3.4, m.hw), z = d.z - fz * Math.min(3.4, m.hw);
        if (!N.pointInPoly(b.poly, x - 0.9, z - 0.9) || !N.pointInPoly(b.poly, x + 0.9, z + 0.9) || !N.pointInPoly(b.poly, x - 0.9, z + 0.9) || !N.pointInPoly(b.poly, x + 0.9, z - 0.9)) continue;
        mb.obox(this.geo.orect(x, z, -fz, fx, 0.6, 0.55), y, y + 0.75, { side: { layer: T('concrete'), us: 2, vs: 1, c: [176, 174, 168, 255] }, top: { layer: T('roofmetal'), us: 1 } });
        const ux = -fz, uz = fx, cx = x + fx * 0.565, cz = z + fz * 0.565;
        mb.quad([cx - ux * 0.3, y + 0.05, cz - uz * 0.3, cx + ux * 0.3, y + 0.05, cz + uz * 0.3, cx + ux * 0.3, y + 0.62, cz + uz * 0.3, cx - ux * 0.3, y + 0.62, cz - uz * 0.3], [fx, 0, fz], [0, 0, 1, 0, 1, 1, 0, 1], [70, 72, 74, 255], T('darkmetal'), 0);
      }
      const n = Math.max(1, Math.round(m.hl * 2 / 14));
      for (let k = 0; k < n; k++) {
        const t = ((k + 0.5) / n * 2 - 1) * (m.hl - 3), off = (H(b.id, k, 81) - 0.5) * m.hw * 0.6;
        const x = m.cx + m.ax * t - m.az * off, z = m.cz + m.az * t + m.ax * off;
        if (!N.pointInPoly(b.poly, x, z)) continue;
        mb.box(x - 0.35, y, z - 0.35, x + 0.35, y + 0.95, z + 0.35, brick);
        mb.box(x - 0.42, y + 0.95, z - 0.42, x + 0.42, y + 1.02, z + 0.42, { layer: T('concrete'), us: 1, vs: 1, c: [140, 138, 134, 255] });
      }
    }

    wantsBalconies(b, bal, e, doors) {
      if (bal.side === 'street') return e.L > 18 && this.geo.streetFacing(e.ax, e.az, e.bx, e.bz);
      if (bal.side === 'all') return true;
      if (!doors.length) return H(b.id, e.i, 7) < 0.6;
      for (const d of doors) {
        const v = (d.x - e.ax) * e.nx + (d.z - e.az) * e.nz;
        const s = (d.x - e.ax) * e.ux + (d.z - e.az) * e.uz;
        if (Math.abs(v) < 2.5 && s > -1 && s < e.L + 1) return false;
      }
      return true;
    }

    balconies(mb, b, st, bal, e, g, sm) {
      const picks = [];
      const stair = m => sm && sm.has(m);
      if (bal.every) {
        for (let m = 0; m < g.mods; m++) {
          const k = (m + (b.id % bal.every)) % bal.every;
          if (stair(m) || bal.pair && stair(m + 1)) continue;
          if (bal.pair ? k === 1 && m + 1 < g.mods : k === 1) picks.push(bal.pair ? [m, 2] : [m, 1]);
        }
      } else {
        const off = Math.max(1, Math.round(g.mods * 0.28));
        picks.push([off, 1]);
        if (g.mods - 1 - off > off + 1) picks.push([g.mods - 1 - off, 1]);
      }
      for (let j = 1; j < g.floors; j++) {
        const y = g.base + j * g.fh;
        if (y < g.yb + 1 || y + g.fh * 0.7 > b.h) continue;
        if (bal.rail === 'balustrade' && j > g.floors - 2) break;
        for (const [m, n] of picks) {
          const s0 = m * g.us + g.us * 0.06, s1 = (m + n) * g.us - g.us * 0.06;
          const h = H(b.id * 31 + e.i, m * 17 + j, 41);
          const glazed = h < bal.glazed;
          const top = j === g.floors - 1 || y + g.fh * 1.7 > b.h;
          this.balcony(mb, e, s0, s1, y, bal, glazed, top, g.fh, h);
        }
      }
    }

    balcony(mb, e, s0, s1, y, bal, glazed, top, fh, h) {
      const kit = N.Landmarks.kit;
      const d = bal.depth;
      kit.ebox(mb, e, s0 - 0.05, s1 + 0.05, -0.05, d, y - 0.16, y, { side: { layer: T('concrete'), us: 2, vs: 2, c: CONC }, top: { layer: T('concrete'), us: 2, c: CONC }, under: { c: [170, 168, 162, 255] } });
      if (glazed) {
        const gh = Math.min(fh - 0.3, 2.45);
        const o = { layer: T('glazedbalc'), kind: K.FACADE, us: s1 - s0, vs: gh, v0: 0 };
        kit.face(mb, e, s0, s1, d, y, y + gh, o);
        const a0 = kit.ep(e, s0, 0), a1 = kit.ep(e, s0, d), b0 = kit.ep(e, s1, 0), b1 = kit.ep(e, s1, d);
        const so = { layer: T('glazedbalc'), kind: K.FACADE, us: d * 2, vs: gh, v0: 0 };
        mb.wall(a1[0], a1[1], a0[0], a0[1], y, y + gh, so);
        mb.wall(b0[0], b0[1], b1[0], b1[1], y, y + gh, so);
        if (top) kit.ebox(mb, e, s0 - 0.08, s1 + 0.08, -0.05, d + 0.08, y + gh, y + gh + 0.08, { layer: T('metal'), us: 2, vs: 1, c: [150, 150, 146, 255], under: { c: [120, 120, 118, 255] } });
        return;
      }
      const rh = 1.05;
      if (bal.rail === 'panel') {
        kit.ebox(mb, e, s0, s1, d - 0.06, d, y, y + rh, { side: { layer: T('balcpanel'), us: 1.2, vs: rh, c: [255, 255, 255, 255] }, top: { layer: T('concrete'), c: CONC } });
        const a0 = kit.ep(e, s0, 0), a1 = kit.ep(e, s0, d - 0.06), b0 = kit.ep(e, s1, 0), b1 = kit.ep(e, s1, d - 0.06);
        const ro = { layer: T('railing'), kind: K.DECAL, us: 0.7, vs: rh, v0: 0, c: METAL };
        mb.wall(a1[0], a1[1], a0[0], a0[1], y, y + rh, ro);
        mb.wall(b0[0], b0[1], b1[0], b1[1], y, y + rh, ro);
      } else {
        const tex = bal.rail === 'balustrade' ? 'balustrade' : 'railing';
        const ro = { layer: T(tex), kind: K.DECAL, us: tex === 'balustrade' ? 2.2 : 0.7, vs: rh, v0: 0, c: tex === 'balustrade' ? [244, 236, 220, 255] : METAL };
        kit.face(mb, e, s0, s1, d - 0.03, y, y + rh, ro);
        const f0 = kit.ep(e, s0, d - 0.06), f1 = kit.ep(e, s1, d - 0.06);
        mb.wall(f0[0], f0[1], f1[0], f1[1], y, y + rh, ro);
        const a0 = kit.ep(e, s0, 0), a1 = kit.ep(e, s0, d), b0 = kit.ep(e, s1, 0), b1 = kit.ep(e, s1, d);
        mb.wall(a1[0], a1[1], a0[0], a0[1], y, y + rh, ro);
        mb.wall(a0[0], a0[1], a1[0], a1[1], y, y + rh, ro);
        mb.wall(b0[0], b0[1], b1[0], b1[1], y, y + rh, ro);
        mb.wall(b1[0], b1[1], b0[0], b0[1], y, y + rh, ro);
        kit.ebox(mb, e, s0, s1, d - 0.07, d + 0.02, y + rh, y + rh + 0.06, { layer: T('metal'), us: 2, vs: 1, c: METAL });
      }
      if (h > 0.86) this.laundry(mb, e, s0, s1, d, y, h);
      else if (h < 0.04 + (bal.glazed > 0.4 ? 0.02 : 0)) this.dish(mb, e, (s0 + s1) / 2, d, y + 1.2);
    }

    laundry(mb, e, s0, s1, d, y, h) {
      const kit = N.Landmarks.kit;
      const v = d * 0.55, yl = y + 1.95;
      const n = 3 + Math.floor(h * 10) % 3;
      for (let k = 0; k < n; k++) {
        const t0 = s0 + 0.15 + (s1 - s0 - 0.3) * k / n, t1 = t0 + (s1 - s0 - 0.3) / n * 0.8;
        const c = LAUNDRY[(Math.floor(h * 97) + k) % LAUNDRY.length];
        const hh = 0.45 + ((k * 7 + Math.floor(h * 53)) % 4) * 0.12;
        kit.face(mb, e, t0, t1, v, yl - hh, yl, { layer: T('cloth'), us: 0.6, vs: 0.6, c });
        const a = kit.ep(e, t0, v - 0.01), b = kit.ep(e, t1, v - 0.01);
        mb.wall(a[0], a[1], b[0], b[1], yl - hh, yl, { layer: T('cloth'), us: 0.6, vs: 0.6, c });
      }
    }

    dish(mb, e, s, d, y) {
      const kit = N.Landmarks.kit;
      const p = kit.ep(e, s, d + 0.25);
      const seg = 10, r = 0.32;
      mb.ensure(seg + 2, seg * 3);
      const base = mb.v(p[0] + e.nx * 0.12, y, p[1] + e.nz * 0.12, e.nx, 0.3, e.nz, 0.5, 0.5, [226, 226, 222, 255], T('white'), 0);
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        mb.v(p[0] + e.ux * ca, y + sa, p[1] + e.uz * ca, e.nx, 0.3, e.nz, 0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5, [214, 214, 210, 255], T('white'), 0);
      }
      for (let i = 0; i < seg; i++) mb.tri(base, base + i + 1, base + i + 2);
      kit.limb(mb, [p[0], y, p[1]], [p[0] - e.nx * 0.25, y - 0.1, p[1] - e.nz * 0.25], 0.025, 0.025, METAL, T('metal'), 4);
    }

    passage(mb, b, e, g) {
      const kit = N.Landmarks.kit;
      const m = Math.floor(g.mods / 2), s0 = m * g.us - 0.2, s1 = (m + 1) * g.us + 0.2;
      const h = Math.min(4.6, b.h - 1);
      kit.face(mb, e, s0, s1, 0.04, 0, h, { layer: T('darkmetal'), us: 2, vs: 2, c: [34, 32, 30, 255] });
      kit.ebox(mb, e, s0 - 0.45, s0, -0.05, 0.3, 0, h + 0.4, { layer: T('stucco'), us: 1, vs: 2, c: [226, 220, 206, 255] });
      kit.ebox(mb, e, s1, s1 + 0.45, -0.05, 0.3, 0, h + 0.4, { layer: T('stucco'), us: 1, vs: 2, c: [226, 220, 206, 255] });
      kit.ebox(mb, e, s0 - 0.45, s1 + 0.45, -0.05, 0.3, h, h + 0.4, { layer: T('stucco'), us: 2, vs: 1, c: [226, 220, 206, 255], under: { c: [200, 194, 182, 255] } });
    }

    pipe(mb, e, s, h) {
      const kit = N.Landmarks.kit;
      const p = kit.ep(e, s, 0.16);
      mb.cyl(p[0], p[1], 0.15, h - 0.4, 0.07, 0.07, 6, { layer: T('metal'), us: 0.5, vs: 2, c: [128, 130, 132, 255] });
      mb.box(p[0] - 0.16, h - 0.45, p[1] - 0.16, p[0] + 0.16, h - 0.1, p[1] + 0.16, { layer: T('metal'), us: 1, vs: 1, c: [120, 122, 124, 255] });
      const q = kit.ep(e, s, 0.32);
      mb.box(Math.min(p[0], q[0]) - 0.07, 0.1, Math.min(p[1], q[1]) - 0.07, Math.max(p[0], q[0]) + 0.07, 0.24, Math.max(p[1], q[1]) + 0.07, { layer: T('metal'), us: 1, vs: 1, c: [128, 130, 132, 255] });
    }

    antennas(mb, b) {
      const m = b.mb, y = b.h;
      const boxes = N.STYLE[b.style].roofBox && b.h > 20 ? this.geo.roofBoxSpots(b) : [];
      const n = Math.max(2, Math.min(9, Math.round(m.hl * 2 / 9)));
      for (let k = 0; k < n; k++) {
        const hu = H(b.id, k, 51), hv = H(b.id, k, 52), hh = H(b.id, k, 53);
        const u = (hu * 2 - 1) * Math.max(0, m.hl - 1.5), v = (hv * 2 - 1) * Math.max(0, m.hw - 1.5);
        const x = m.cx + m.ax * u - m.az * v, z = m.cz + m.az * u + m.ax * v;
        if (!N.pointInPoly(b.poly, x, z) || boxes.some(s => Math.hypot(s.cx - x, s.cz - z) < 3.4)) continue;
        const top = 2.2 + hh * 2.4;
        mb.box(x - 0.025, y, z - 0.025, x + 0.025, y + top, z + 0.025, { layer: T('metal'), us: 1, vs: 1, c: METAL, noTop: true });
        const bars = 1 + Math.floor(hh * 3);
        const alongX = H(b.id, k, 54) < 0.5;
        for (let i = 0; i < bars; i++) {
          const yy = y + top - 0.15 - i * 0.55, half = 0.45 + (bars - i) * 0.18;
          if (alongX) mb.box(x - half, yy, z - 0.015, x + half, yy + 0.03, z + 0.015, { layer: T('metal'), us: 1, vs: 1, c: METAL, noTop: true });
          else mb.box(x - 0.015, yy, z - half, x + 0.015, yy + 0.03, z + half, { layer: T('metal'), us: 1, vs: 1, c: METAL, noTop: true });
        }
        if (hh > 0.6) {
          const gx = x + (alongX ? 0 : 1.8), gz = z + (alongX ? 1.8 : 0);
          if (N.pointInPoly(b.poly, gx, gz)) N.Landmarks.kit.limb(mb, [x, y + top * 0.7, z], [gx, y + 0.03, gz], 0.008, 0.008, [70, 70, 72, 255], T('metal'), 3);
        }
      }
    }

    acUnits(mb, b, st, stairs) {
      const kit = N.Landmarks.kit;
      for (const e of kit.edges(b.poly)) {
        if (e.L < 8) continue;
        const g = this.geo.facadeGrid(b, st, e), sm = stairs && stairs.get(e.i);
        for (let m = 0; m < g.mods; m++) {
          if (sm && sm.has(m)) continue;
          for (let j = 1; j < g.floors; j++) {
            if (H(b.id * 13 + e.i, m * 31 + j, 61) > 0.035) continue;
            const s = (m + 0.5) * g.us, y = g.base + j * g.fh + 0.25;
            kit.ebox(mb, e, s - 0.42, s + 0.42, 0, 0.32, y, y + 0.55, { layer: T('white'), us: 1, vs: 1, c: [222, 224, 220, 255] });
          }
        }
      }
    }
  }

  N.Detail = Detail;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
