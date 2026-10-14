(function (N) {
  'use strict';

  const GT = N.GT;
  const GAZ_CREST = N.GAZ_CREST = { y: 17.0, w: 9.2, h: 2.9, d: 0.5 };

  Object.assign(N.City.prototype, {
    sites() {
      this.decks = this.decks || [];
      this.plazas = [];
      this.marks = [];
      this.namedAreas = [];
      this.siteHotel();
      this.siteFemida();
      this.siteClub();
      this.siteRiver();
      this.siteMarket();
      this.siteChop();
      this.siteZarya();
      this.siteGaz();
      this.siteStadium();
      this.sitePark();
      this.siteLandmarks();
      this.siteServices();
      this.siteStroyka();
      this.sitePort();
      this.siteBridge();
      this.siteJumps();
      this.siteSpots();
    },

    bNear(x, z, r, f) {
      let best = null, bd = r || 40;
      for (const b of this.buildings) {
        if (b.removed || f && !f(b)) continue;
        if (b.x1 < x - bd || b.x0 > x + bd || b.z1 < z - bd || b.z0 > z + bd) continue;
        const d = N.pointInPoly(b.poly, x, z) ? 0 : Math.hypot(b.cx - x, b.cz - z);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    },

    wall(b, i) {
      const p = b.poly, j = (i + 2) % p.length;
      const ex = p[j] - p[i], ez = p[j + 1] - p[i + 1], L = Math.hypot(ex, ez) || 1;
      return { i, ax: p[i], az: p[i + 1], bx: p[j], bz: p[j + 1], mx: (p[i] + p[j]) / 2, mz: (p[i + 1] + p[j + 1]) / 2, ux: ex / L, uz: ez / L, nx: ez / L, nz: -ex / L, L };
    },

    wallToward(b, x, z, minL) {
      let best = null, bs = -Infinity;
      for (let i = 0; i < b.poly.length; i += 2) {
        const w = this.wall(b, i);
        if (w.L < (minL || 5)) continue;
        const dx = x - w.mx, dz = z - w.mz, d = Math.hypot(dx, dz) || 1;
        const s = (dx * w.nx + dz * w.nz) / d * 2 - d / 200 + w.L / 100;
        if (s > bs) { bs = s; best = w; }
      }
      return best;
    },

    wallToRoad(b, f, minL) {
      let best = null, bd = Infinity;
      for (let i = 0; i < b.poly.length; i += 2) {
        const w = this.wall(b, i);
        if (w.L < (minL || 6)) continue;
        const ne = this.nearestEdge(w.mx + w.nx * 3, w.mz + w.nz * 3, f || (e => !e.plant), 90);
        if (!ne) continue;
        const toward = (ne.x - w.mx) * w.nx + (ne.z - w.mz) * w.nz;
        const d = ne.d - (toward > 0 ? 5 : 0);
        if (d < bd) { bd = d; best = w; }
      }
      return best;
    },

    at(w, u, out) { return [w.mx + w.ux * u + w.nx * out, w.mz + w.uz * u + w.nz * out]; },

    door(w, u, pref) {
      for (let o = pref; o >= 1.2; o -= 0.4) { const p = this.at(w, u, o); if (this.surfaceAt(p[0], p[1]) !== 0) return p; }
      return this.at(w, u, 1.2);
    },

    yawOut(w) { return Math.atan2(w.nx, -w.nz); },

    wallSign(w, u, y, width, h, text, style, extra) {
      const [x, z] = this.at(w, u, 0.1);
      const s = Object.assign({ x, z, y, w: width, h, nx: w.nx, nz: w.nz, text, style }, extra || {});
      this.signs.push(s);
      return s;
    },

    roofSign(b, w, text, text2) {
      const [x, z] = this.at(w, 0, -Math.min(6, b.mb.hw));
      const yaw = this.yawOut(w);
      this.signs.push({ x, z, y: b.h + 2.6, w: Math.min(26, w.L * 0.8), h: 3, nx: w.nx, nz: w.nz, text, style: 'roof', face: 'both', rx: x, rz: z });
      if (text2) this.signs.push({ x, z, y: b.h + 5.6, w: Math.min(22, w.L * 0.7), h: 2.6, nx: w.nx, nz: w.nz, text: text2, style: 'roof', face: 'both' });
      return yaw;
    },

    restyle(b, style, extra) {
      if (!b) return;
      b.style = style;
      if (extra) Object.assign(b, extra);
      if (extra && extra.name && b.res) { b.res = false; this.props = this.props.filter(p => p.b !== b.id || p.type !== 'podezd'); }
    },

    removeBuilding(b) {
      if (!b || b.removed) return;
      b.removed = true;
      this.boxes = this.boxes.filter(it => it.ref !== b.id);
      this.props = this.props.filter(p => p.b !== b.id);
    },

    clearProps(poly, keepFences) {
      this.props = this.props.filter(p => !N.pointInPoly(poly, p.x, p.z));
      this.boxes = this.boxes.filter(it => it.kind === 'building' || it.kind === 'edge' || (keepFences && it.kind === 'fence') || !N.pointInPoly(poly, (it.x0 + it.x1) / 2, (it.z0 + it.z1) / 2));
    },

    rectPoly(cx, cz, ax, az, hl, hw) {
      const p = [cx + ax * hl - az * hw, cz + az * hl + ax * hw, cx - ax * hl - az * hw, cz - az * hl + ax * hw, cx - ax * hl + az * hw, cz - az * hl - ax * hw, cx + ax * hl + az * hw, cz + az * hl - ax * hw];
      return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
    },

    fenceRing(poly, h, tex, gaps) {
      const n = poly.length;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const ax = poly[i], az = poly[i + 1], bx = poly[j], bz = poly[j + 1];
        const L = Math.hypot(bx - ax, bz - az);
        const cuts = (gaps || []).filter(g => g[0] === i / 2).map(g => [g[1] - g[2] / 2, g[1] + g[2] / 2]).sort((a, b) => a[0] - b[0]);
        let cur = 0;
        for (const [g0, g1] of cuts.concat([[L, L]])) {
          if (g0 > cur + 0.3) {
            const x0 = ax + (bx - ax) * cur / L, z0 = az + (bz - az) * cur / L, x1 = ax + (bx - ax) * g0 / L, z1 = az + (bz - az) * g0 / L;
            this.segWall(x0, z0, x1, z1, 0.2, h, 'fence', { tex });
            this.fenceSegs.push({ ax: x0, az: z0, bx: x1, bz: z1, h, t: 0.2, tex });
          }
          cur = Math.max(cur, g1);
        }
      }
    },

    customBuilding(poly, h, style, o) {
      return this.addPolyBuilding(poly, Object.assign({ k: o && o.k || 'o', lv: o && o.lv || 1, h, style }, o || {}));
    },

    siteHotel() {
      const b = this.bNear(99, -298, 30, q => q.kind === 's' || q.kind === 'o' || q.kind === 'r');
      this.hotelB = b;
      this.restyle(b, 'hotel', { name: 'Гостиница «Автозаводская»' });
      const w = this.wallToward(b, 94, -262, 8);
      this.roofSign(b, w, '«АВТОЗАВОДСКАЯ»', 'ГОСТИНИЦА');
      this.wallSign(w, 0, 4.05, Math.min(14, w.L - 2), 0.9, 'ГОСТИНИЦА «АВТОЗАВОДСКАЯ»', 'shop');
      const [dx, dz] = this.at(w, 0, 0);
      const yaw = this.yawOut(w);
      this.hotelCourt(b, w);
      const [px, pz] = this.door(w, 0, 2.6);
      this.put('hotel_door', px, pz, yaw + Math.PI, { rot: yaw + Math.PI / 2 });
      const [sx, sz] = this.door(w, -2.6, 1.8);
      this.put('hotel_save', sx, sz, yaw + Math.PI, { save: true, rot: yaw + Math.PI / 2 });
      const rs = this.roadSide(px, pz, e => e.rank >= 1);
      const [hx, hz] = this.door(w, 4.5, 3);
      this.put('hotel_spawn', hx, hz, yaw);
      if (rs) {
        const cx = rs.x + rs.nx * (rs.curb - 1.3), cz = rs.z + rs.nz * (rs.curb - 1.3);
        const ty = Math.atan2(rs.dx, -rs.dz);
        this.park(cx, cz, ty, ['volga3110'], { livery: 'taxi', curb: true });
        this.park(cx + rs.dx * 7, cz + rs.dz * 7, ty, ['volga24'], { livery: 'taxi', curb: true });
        this.put('taxi_hotel', cx, cz, ty);
      }
      this.claim(dx - 5, dz - 5, dx + 5, dz + 5);
    },

    hotelCourt(b, w) {
      const yaw = this.yawOut(w), ground = [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH, GT.CONC];
      const [dx, dz] = this.at(w, 0, 0);
      this.prop('porch', dx, dz, yaw, { w: 3 });
      const pc = this.at(w, 0, 0.9);
      for (const s of [-1, 1]) { const c = this.at(w, s * 1.95, 2.9); this.circle(c[0], c[1], 0.26, 3.2, 'column'); }
      const st = this.at(w, 0, 2.2);
      this.ramps.push(Object.assign({ cx: st[0], cz: st[1], fx: -w.nx, fz: -w.nz, l: 0.8, w: 4.6, h: 0.35, stair: true }, N.polyBounds(this.rectPoly(st[0], st[1], -w.nx, -w.nz, 0.4, 2.3))));
      this.decks.push({ poly: this.rectPoly(pc[0], pc[1], w.ux, w.uz, 2.3, 0.9), y: 0.45 });
      const sg = this.at(w, 0, 3.42);
      this.signs.push({ x: sg[0], y: 3.16, z: sg[1], w: 4.4, h: 0.26, nx: w.nx, nz: w.nz, text: 'ГОСТИНИЦА', style: 'relief', color: '#e8c87a' });
      const court = this.rectPoly(...this.at(w, 0, 6), w.ux, w.uz, 11, 6);
      const drive = this.rectPoly(...this.at(w, 0, 11.5), w.ux, w.uz, w.L / 2 + 4, 3.2);
      this.plazas.push({ poly: court, tex: 'plaza' }, { poly: drive, tex: 'asphalt2' });
      for (const q of [court, drive]) this.fillPoly(q, GT.PLAZA, ground);
      for (const s of [-1, 1]) {
        const f = this.at(w, s * 7.5, 5.5);
        this.prop('flowerbed', f[0], f[1], 0);
        this.circle(f[0], f[1], 3, 0.5, 'prop');
        const bn = this.at(w, s * 7.5, 1.2);
        this.prop('bench', bn[0], bn[1], yaw);
        for (const u of [12, 22]) {
          const l = this.at(w, s * u, 8);
          this.prop('globelamp', l[0], l[1], yaw);
          this.circle(l[0], l[1], 0.2, 4.4, 'lamp', { breakable: true, mesh: 'globelamp' });
        }
      }
      for (const k of [0, 1, 2]) {
        const f = this.at(w, 11.2 + k * 1.3, 2.4);
        this.prop('flag', f[0], f[1], yaw + Math.PI / 2);
        this.circle(f[0], f[1], 0.08, 9, 'pole');
      }
      for (const q of [court, drive]) this.claimPoly(q, 0.3);
    },

    siteFemida() {
      const b = this.bNear(185, -396, 40, q => q.kind === 's');
      this.femidaB = b;
      this.restyle(b, 'stalin', { shops: true });
      const w = this.wallToRoad(b, e => e.rank >= 2, 12);
      b.front = w.i;
      this.wallSign(w, 0, 3.8, Math.min(14, w.L * 0.45), 1.2, 'ЮРКОНСУЛЬТАЦИЯ «ФЕМИДА»', 'shop');
      this.wallSign(w, w.L * 0.32, 3.8, 7, 1.1, 'НОТАРИУС', 'shop');
      this.wallSign(w, -w.L * 0.32, 3.8, 8, 1.1, 'ОБМЕН ВАЛЮТЫ', 'shop');
      const yaw = this.yawOut(w);
      const [cx, cz] = this.at(w, 0, 0);
      this.prop('canopy', cx, cz, yaw, { w: 4, door: true });
      const [kx, kz] = this.door(w, 0, 3);
      this.put('kesha_door', kx, kz, yaw + Math.PI, { rot: yaw - Math.PI / 2 });
      const back = this.wall(b, this.oppositeWall(b, w));
      const [gx, gz] = this.at(back, 0, 9);
      const gyaw = this.yawOut(back);
      const gp = this.rectPoly(gx, gz, -back.nx, -back.nz, 3.2, 2.6);
      if (this.freeAt(gx, gz, 1)) {
        this.customBuilding(gp, 2.7, 'garage', { k: 'g', walkRoof: true });
      }
      const [ex, ez] = this.at(back, 0, 14.5);
      this.put('kesha_garage', ex, ez, gyaw + Math.PI, { garage: true, door: [gx, gz], rot: gyaw + Math.PI / 2 });
      this.claim(ex - 4, ez - 4, ex + 4, ez + 4);
    },

    oppositeWall(b, w) {
      let best = w.i, bs = 2;
      for (let i = 0; i < b.poly.length; i += 2) {
        const q = this.wall(b, i);
        if (q.L < 5) continue;
        const d = q.nx * w.nx + q.nz * w.nz;
        if (d < bs) { bs = d; best = i; }
      }
      return best;
    },

    siteClub() {
      const b = this.bNear(-729, 1007, 40, q => q.kind !== 'h' && q.area > 300);
      this.clubB = b;
      this.restyle(b, 'club', { name: 'Клуб «Мираж»' });
      const w = this.wallToRoad(b, e => e.rank >= 1, 10);
      const yaw = this.yawOut(w);
      this.wallSign(w, 0, Math.min(b.h - 1.6, 6.4), Math.min(16, w.L * 0.8), 3.2, 'МИРАЖ', 'neon');
      this.wallSign(w, 0, 3.2, Math.min(10, w.L * 0.6), 0.9, 'НОЧНОЙ КЛУБ · КАЗИНО', 'neonsmall');
      const [cx, cz] = this.at(w, 0, 0);
      this.prop('canopy', cx, cz, yaw, { w: 8, neon: true, door: true });
      const [dx, dz] = this.door(w, 0, 3.5);
      this.put('club_door', dx, dz, yaw + Math.PI, { rot: yaw + Math.PI / 2 });
      const [mx, mz] = this.door(w, -4.6, 3.5);
      this.put('club_meet', mx, mz, yaw + Math.PI, { rot: yaw + Math.PI / 2 });
      const back = this.wall(b, this.oppositeWall(b, w));
      const [bx, bz] = this.at(back, 0, 3);
      this.put('club_back', bx, bz, this.yawOut(back) + Math.PI, { rot: this.yawOut(back) + Math.PI });
      const [lx, lz] = this.at(w, 0, 16);
      this.put('club_lot', lx, lz, yaw);
      for (let i = -3; i <= 3; i++) {
        const [px, pz] = this.at(w, i * 3.1, 11);
        if (this.freeAt(px, pz, 1.2) && this.surfaceAt(px, pz) !== 0) { this.park(px, pz, yaw, ['bmw525', 'merc600', 'audi80', 'lc80', 'volga3102', 'vaz2110'], { lot: 'club' }); this.claim(px - 1.2, pz - 1.2, px + 1.2, pz + 1.2); }
      }
      this.claim(dx - 5, dz - 5, dx + 5, dz + 5);
    },

    siteRiver() {
      const shore = this.shorePoint(1330, 2170);
      const [sx, sz, nx, nz] = shore;
      const ax = -nz, az = nx;
      const cx = sx + nx * 17, cz = sz + nz * 17;
      const yaw = Math.atan2(ax, -az);
      this.prop('debarkader', cx, cz, yaw, { w: 16, l: 44 });
      const deck = this.rectPoly(cx, cz, ax, az, 22, 8);
      this.decks.push({ poly: deck, y: 0.1 });
      const cab = this.rectPoly(cx, cz, ax, az, 12, 5);
      this.poly(cab, 3.2, 'building', { cabin: true });
      const railT = 0.15;
      const c = (u, v) => [cx + ax * u - az * v, cz + az * u + ax * v];
      const rail = (u0, v0, u1, v1) => { const a = c(u0, v0), b2 = c(u1, v1); this.segWall(a[0], a[1], b2[0], b2[1], railT, 1.1, 'rail', { tex: 'metal' }); };
      rail(-22, -8, 22, -8); rail(-22, -8, -22, 8); rail(22, -8, 22, 8);
      rail(-22, 8, -3, 8); rail(3, 8, 22, 8);
      const gang = c(0, 8);
      const gpoly = this.rectPoly((gang[0] + sx) / 2, (gang[1] + sz) / 2, nx, nz, Math.hypot(gang[0] - sx, gang[1] - sz) / 2 + 1, 1.6);
      this.decks.push({ poly: gpoly, y: 0.1 });
      this.prop('gangway', (gang[0] + sx) / 2, (gang[1] + sz) / 2, Math.atan2(nx, -nz), { l: Math.hypot(gang[0] - sx, gang[1] - sz) + 2 });
      const sign = c(0, 5.2);
      this.signs.push({ x: sign[0] - nx * 0.1, y: 2.6, z: sign[1] - nz * 0.1, w: 8, h: 1.1, nx: -nx, nz: -nz, text: '«ОТСТАВНИК»', style: 'boat' });
      const col = c(-5, 6.4);
      const mk = c(2, 6.8);
      const rot = Math.atan2(nx, -nz) - Math.PI / 2;
      this.put('colonel', mk[0], mk[1], Math.atan2(-nx, nz), { rot });
      this.put('colonel_npc', col[0], col[1], Math.atan2(-nx, nz), { rot });
      const pierS = this.shorePoint(1430, 2100);
      const [qx, qz, qnx, qnz] = pierS;
      const pc = [qx + qnx * 9, qz + qnz * 9];
      this.prop('pier', pc[0], pc[1], Math.atan2(qnx, -qnz), { l: 18, w: 4 });
      this.decks.push({ poly: this.rectPoly(pc[0], pc[1], qnx, qnz, 10, 2.2), y: 0.1 });
      const pyaw = Math.atan2(qnx, -qnz);
      this.put('pier', qx - qnx * 8, qz - qnz * 8, pyaw, { rot: pyaw - Math.PI / 2 });
      this.put('pier_boat', qx + qnx * 18, qz + qnz * 18, 0);
      this.prop('boat', qx + qnx * 20 - qnz * 2, qz + qnz * 20 + qnx * 2, Math.atan2(-qnz, -qnx), { l: 18 });
      this.claim(qx - 20, qz - 20, qx + 20, qz + 20);
      this.claim(sx - 25, sz - 25, sx + 25, sz + 25);
      this.namedAreas.push({ name: 'Дебаркадер «Отставник»', poly: this.rectPoly(cx, cz, ax, az, 40, 30), box: N.polyBounds(this.rectPoly(cx, cz, ax, az, 40, 30)) });
    },

    shorePoint(x, z) {
      const W = this.water[0];
      let best = null, bd = Infinity;
      for (let i = 0; i < W.length; i += 2) {
        const j = (i + 2) % W.length;
        const [d2, t] = N.segDist2(x, z, W[i], W[i + 1], W[j], W[j + 1]);
        if (d2 < bd) { bd = d2; const ex = W[j] - W[i], ez = W[j + 1] - W[i + 1], L = Math.hypot(ex, ez) || 1; best = [W[i] + ex * t, W[i + 1] + ez * t, ez / L, -ex / L]; }
      }
      const [sx, sz] = best;
      let nx = best[2], nz = best[3];
      if (!this.inWater(sx + nx * 6, sz + nz * 6)) { nx = -nx; nz = -nz; }
      return [sx, sz, nx, nz];
    },

    siteMarket() {
      const L = this.land.find(l => l.k === 'm' && /Мончегорский/.test(l.name)) || this.land.find(l => l.k === 'm');
      const m = this.mabr(L.poly);
      this.clearProps(L.poly);
      const rng = N.rng(this.seed + 7);
      const cols = ['#c83030', '#3060c0', '#e0c030', '#30a050', '#e07020'];
      let row = 0;
      for (let v = -m.hw + 5; v < m.hw - 5; v += row % 2 ? 7 : 9, row++) {
        for (let u = -m.hl + 5; u < m.hl - 5; u += 7) {
          if (rng() < 0.12) continue;
          const x = m.cx + m.ax * u - m.az * v, z = m.cz + m.az * u + m.ax * v;
          if (!N.pointInPoly(L.poly, x, z) || !this.freeAt(x, z, 2)) continue;
          const yaw = Math.atan2(m.ax, -m.az);
          if (row % 2) { this.prop('tent', x, z, yaw, { c: rng.pick(cols) }); this.obb(x, z, yaw, 2.9, 2.9, 1.1, 'prop'); }
          else { this.customBuilding(this.rectPoly(x, z, m.ax, m.az, 3, 1.3), 2.6, 'container', { k: 'u', walkRoof: true, c: rng.pick(['#c83a2a', '#2a5aa8', '#3a8a4a', '#d8a82a']) }); }
          this.claim(x - 3, z - 3, x + 3, z + 3);
        }
      }
      const ne = this.nearestEdge(m.cx, m.cz, e => e.rank >= 2, 200);
      const tx = ne ? ne.x - m.cx : 1, tz = ne ? ne.z - m.cz : 0, tl = Math.hypot(tx, tz) || 1;
      const ex = m.cx + tx / tl * (Math.min(m.hw, m.hl) + 4), ez = m.cz + tz / tl * (Math.min(m.hw, m.hl) + 4);
      this.put('market', ex, ez, Math.atan2(-tx, tz));
      const st = this.freeSpot(m.cx + m.ax * (-m.hl + 14) - m.az * (-m.hw + 10), m.cz + m.az * (-m.hl + 14) + m.ax * (-m.hw + 10), 10);
      const srot = Math.atan2(m.ax, -m.az) - Math.PI / 2;
      this.put('market_stall', st[0], st[1], srot, { rot: srot });
      const cl = this.freeSpot(m.cx + m.ax * 12, m.cz + m.az * 12, 12);
      this.put('market_clothes', cl[0], cl[1], 0);
      this.signs.push({ x: ex - tx / tl * 2, y: 4.2, z: ez - tz / tl * 2, w: 14, h: 1.6, nx: tx / tl, nz: tz / tl, text: 'РЫНОК «МОНЧЕГОРСКИЙ»', style: 'shop', post: true });
      this.pedArea(L.box.x0, L.box.z0, L.box.x1, L.box.z1, 'market', 10, L.poly);
      this.namedAreas.push({ name: 'Рынок «Мончегорский»', poly: L.poly, box: L.box });
      this.marketPoly = L.poly;
    },

    siteChop() {
      const cx = -1870, cz = 1100;
      const ne = this.nearestEdge(cx, cz, e => /Мончегорская/.test(e.name), 400) || this.nearestEdge(cx, cz, e => e.rank >= 1, 400);
      const ax = ne.dx, az = ne.dz;
      let nx = -az, nz = ax;
      if ((cx - ne.x) * nx + (cz - ne.z) * nz < 0) { nx = -nx; nz = -nz; }
      const ox = ne.x + nx * (ne.e.hw + ne.e.swR + 34), oz = ne.z + nz * (ne.e.hw + ne.e.swR + 34);
      const poly = this.rectPoly(ox, oz, ax, az, 34, 26);
      for (const b of this.buildings) if (!b.removed && N.pointInPoly(poly, b.cx, b.cz)) this.removeBuilding(b);
      this.clearProps(poly);
      this.fenceSegs = this.fenceSegs.filter(f => !N.pointInPoly(poly, (f.ax + f.bx) / 2, (f.az + f.bz) / 2));
      this.boxes = this.boxes.filter(it => !(it.kind === 'fence' && N.pointInPoly(poly, (it.x0 + it.x1) / 2, (it.z0 + it.z1) / 2)));
      const gateI = this.closestSide(poly, ne.x, ne.z);
      this.fenceRing(poly, 2.6, 'metal', [[gateI, this.sideLen(poly, gateI) / 2, 11]]);
      const c = (u, v) => [ox + ax * u + nx * v, oz + az * u + nz * v];
      const sp = c(-18, 12);
      const svc = this.customBuilding(this.rectPoly(sp[0], sp[1], ax, az, 11, 7), 5, 'service', { k: 'o' });
      const w = this.wallToward(svc, ox, oz);
      this.wallSign(w, 0, 4.2, 9, 1, 'АВТОСЕРВИС', 'shop');
      const gp = c(14, 18);
      this.customBuilding(this.rectPoly(gp[0], gp[1], ax, az, 16, 3), 2.6, 'garage', { k: 'g', walkRoof: true });
      const cp = c(-4, 4);
      this.prop('canopy2', cp[0], cp[1], Math.atan2(ax, -az), { w: 10 });
      const gate = c(0, -26);
      this.put('chop', ox, oz, 0);
      this.put('chop_ledger', cp[0], cp[1], 0);
      this.put('chop_gate', gate[0] - nx * 9, gate[1] - nz * 9, Math.atan2(nx, -nz));
      this.chopRect = { x0: ox - 30, z0: oz - 22, x1: ox + 30, z1: oz + 22, poly, ox, oz, ax, az, nx, nz };
      for (let i = 0; i < 4; i++) { const p = c(-12 + i * 8, -6); this.prop('wreck', p[0], p[1], Math.atan2(ax, -az) + (i % 2 ? 0.3 : -0.2)); this.obb(p[0], p[1], Math.atan2(ax, -az), 2, 0.8, 1.3, 'prop'); }
      for (let i = 0; i < 3; i++) { const p = c(10 + i * 6, -6); this.park(p[0], p[1], Math.atan2(nx, -nz), ['bmw525', 'vaz2109', 'audi80'], { chop: true }); }
      this.claimPoly(poly, 1);
      this.namedAreas.push({ name: 'Автосервис Хромого', poly, box: N.polyBounds(poly) });
    },

    closestSide(poly, x, z) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < poly.length; i += 2) {
        const j = (i + 2) % poly.length;
        const [d2] = N.segDist2(x, z, poly[i], poly[i + 1], poly[j], poly[j + 1]);
        if (d2 < bd) { bd = d2; best = i / 2; }
      }
      return best;
    },

    sideLen(poly, k) { const i = k * 2, j = (i + 2) % poly.length; return Math.hypot(poly[j] - poly[i], poly[j + 1] - poly[i + 1]); },

    siteZarya() {
      const L = this.land.filter(l => l.k === 'r' && this.inPlay((l.box.x0 + l.box.x1) / 2, (l.box.z0 + l.box.z1) / 2)).sort((a, b) => Math.hypot((a.box.x0 + a.box.x1) / 2 + 1485, (a.box.z0 + a.box.z1) / 2 + 1828) - Math.hypot((b.box.x0 + b.box.x1) / 2 + 1485, (b.box.z0 + b.box.z1) / 2 + 1828))[0];
      const gar = this.buildings.filter(b => b.kind === 'g' && !b.removed && N.pointInPoly(L.poly, b.cx, b.cz));
      const ne = this.nearestEdge((L.box.x0 + L.box.x1) / 2, (L.box.z0 + L.box.z1) / 2, e => e.rank >= 1, 400);
      let gx = ne.x, gz = ne.z;
      let best = null, bd = Infinity;
      for (const s of this.surf) {
        for (let i = 0; i < s.pts.length; i += 2) {
          const x = s.pts[i], z = s.pts[i + 1];
          if (!N.pointInPoly(L.poly, x, z)) continue;
          const d = Math.hypot(x - ne.x, z - ne.z);
          if (d < bd) { bd = d; best = [x, z]; }
        }
      }
      if (best) { gx = best[0]; gz = best[1]; }
      const tx = ne.x - gx, tz = ne.z - gz, tl = Math.hypot(tx, tz) || 1;
      const zo = this.freeSpot(gx + tx / tl * 6, gz + tz / tl * 6, 10), zi = this.freeSpot(gx - tx / tl * 10, gz - tz / tl * 10, 10);
      this.put('zarya', zo[0], zo[1], Math.atan2(-tx, tz));
      this.put('zarya_in', zi[0], zi[1], Math.atan2(-tx, tz));
      this.signs.push({ x: gx + tx / tl * 2, y: 3.2, z: gz + tz / tl * 2, w: 10, h: 1.1, nx: tx / tl, nz: tz / tl, text: 'ГСК «ЗАРЯ»', style: 'shop', post: true });
      const lanes = [];
      const inside = this.surf.filter(s => { const m = N.plineAt(s.pts, N.cumLen(s.pts), 0); return N.pointInPoly(L.poly, m.x, m.z); });
      for (const s of inside) {
        const cum = N.cumLen(s.pts), len = cum[cum.length - 1];
        if (len < 40) continue;
        const a = N.plineAt(s.pts, cum, 0), b = N.plineAt(s.pts, cum, len);
        const d = Math.hypot(a.x - gx, a.z - gz) + Math.hypot(b.x - gx, b.z - gz);
        lanes.push({ s, cum, len, d });
      }
      lanes.sort((p, q) => p.d - q.d);
      this.zaryaLanes = lanes.slice(0, 3).map(q => {
        const a = N.plineAt(q.s.pts, q.cum, 0), b = N.plineAt(q.s.pts, q.cum, q.len);
        return { x0: a.x, z0: a.z, x1: b.x, z1: b.z, len: q.len, pts: q.s.pts, cum: q.cum };
      });
      this.garageCount = gar.length;
      this.namedAreas.push({ name: 'ГСК «Заря»', poly: L.poly, box: L.box });
    },

    siteGaz() {
      const lot = this.land.filter(l => (l.k === 'k' || l.k === 'n' || l.k === 'q') && l.area > 6000).sort((a, b) => Math.hypot((a.box.x0 + a.box.x1) / 2 - 1160, (a.box.z0 + a.box.z1) / 2 + 1030) - Math.hypot((b.box.x0 + b.box.x1) / 2 - 1160, (b.box.z0 + b.box.z1) / 2 + 1030))[0];
      const m = lot ? this.mabr(lot.poly) : { cx: 1160, cz: -1030, ax: 0.8, az: -0.6, hl: 70, hw: 50 };
      const poly = lot ? lot.poly : this.rectPoly(m.cx, m.cz, m.ax, m.az, m.hl, m.hw);
      this.clearProps(poly);
      this.parking = this.parking.filter(p => !N.pointInPoly(poly, p.x, p.z));
      const ne = this.nearestEdge(m.cx, m.cz, e => e.main, 400);
      const gs = this.closestSide(poly, ne.x, ne.z);
      this.fenceRing(poly, 2.4, 'concfence', [[gs, this.sideLen(poly, gs) * 0.8, 10]]);
      const i = gs * 2, j = (i + 2) % poly.length;
      const gxp = poly[i] + (poly[j] - poly[i]) * 0.8, gzp = poly[i + 1] + (poly[j + 1] - poly[i + 1]) * 0.8;
      const tx = ne.x - gxp, tz = ne.z - gzp, tl = Math.hypot(tx, tz) || 1;
      this.put('carlot_gate', gxp + tx / tl * 5, gzp + tz / tl * 5, Math.atan2(-tx, tz));
      this.prop('barrier', gxp, gzp, Math.atan2(poly[j + 1] - poly[i + 1], poly[j] - poly[i]), { w: 7, breakable: true });
      const booth = [gxp - tx / tl * 4 + (poly[j] - poly[i]) / this.sideLen(poly, gs) * 7, gzp - tz / tl * 4 + (poly[j + 1] - poly[i + 1]) / this.sideLen(poly, gs) * 7];
      this.customBuilding(this.rectPoly(booth[0], booth[1], 1, 0, 2.5, 2), 2.8, 'booth', { k: 'u' });
      const spots = [];
      for (let v = -m.hw + 6; v <= m.hw - 6; v += 7.5) {
        for (let u = -m.hl + 4; u <= m.hl - 4; u += 2.9) {
          const x = m.cx + m.ax * u - m.az * v, z = m.cz + m.az * u + m.ax * v;
          if (!N.pointInPoly(poly, x, z) || !this.freeAt(x, z, 1.6)) continue;
          spots.push([x, z, u, v]);
        }
      }
      const pyaw = Math.atan2(-m.az, -m.ax) + Math.PI / 2;
      let n = 0;
      for (const [x, z] of spots) { if (n++ > 70) break; this.park(x, z, pyaw, ['volga3110'], { lot: 'carlot', fresh: true }); }
      const far = spots.length ? spots.reduce((a, b) => (Math.hypot(b[0] - gxp, b[1] - gzp) > Math.hypot(a[0] - gxp, a[1] - gzp) ? b : a)) : [m.cx, m.cz];
      this.put('carlot', m.cx, m.cz, 0);
      this.put('carlot_target', far[0], far[1], pyaw);
      const cn = this.nearestNode(2607, -366, q => q.ends.some(en => this.edges[en.e].name === 'улица Монастырка'));
      this.put('convoy_start', cn.x, cn.z, 0);
      for (let k = -2; k <= 2; k++) { const x = m.cx + m.ax * k * m.hl * 0.4, z = m.cz + m.az * k * m.hl * 0.4; if (this.freeAt(x, z, 1)) { this.prop('lampmast', x, z, 0, { h: 16 }); this.circle(x, z, 0.3, 16, 'pole'); } }
      this.claimPoly(poly, 0);
      this.carlotPoly = poly;
      this.namedAreas.push({ name: 'Площадка готовой продукции ГАЗ', poly, box: N.polyBounds(poly) });
      this.siteGazGate();
    },

    siteGazGate() {
      const len = (this.poiBy.Y || []).find(q => Math.hypot(q.x - 1364, q.z + 957) < 60) || { x: 1364, z: -957 };
      const G = this.gaz;
      let best = null, bd = Infinity;
      for (let i = 0; i < G.length; i += 2) {
        const j = (i + 2) % G.length;
        const [d2, t] = N.segDist2(len.x, len.z, G[i], G[i + 1], G[j], G[j + 1]);
        if (d2 < bd) { bd = d2; const ex = G[j] - G[i], ez = G[j + 1] - G[i + 1], L = Math.hypot(ex, ez) || 1; best = { x: G[i] + ex * t, z: G[i + 1] + ez * t, ux: ex / L, uz: ez / L }; }
      }
      let nx = best.uz, nz = -best.ux;
      if ((len.x - best.x) * nx + (len.z - best.z) * nz < 0) { nx = -nx; nz = -nz; }
      const ux = -nz, uz = nx;
      const bx = best.x, bz = best.z, yaw = Math.atan2(nx, -nz);
      const atB = (u, v) => [bx + ux * u + nx * v, bz + uz * u + nz * v];
      const adm = this.bNear(1460, -960, 90, q => q.area > 4000);
      let back = 0, D = 7;
      if (adm) {
        const d0 = N.rayPolyDist(adm.poly, bx, bz, -nx, -nz);
        if (d0 < 20) {
          const d1 = N.rayPolyDist(adm.poly, bx - nx * (d0 + 0.2), bz - nz * (d0 + 0.2), -nx, -nz);
          back = d0 - 0.5;
          if (d1 < 40) D = Math.max(7, d1 + 1);
          const parts = this.stripCut(adm.poly, bx, bz, ux, uz, nx, nz, -14.3, 14.3);
          if (parts) {
            parts.sort((a, b) => Math.abs(N.polyArea(b)) - Math.abs(N.polyArea(a)));
            this.reshape(adm, parts[0]);
            const wing = this.customBuilding(parts[1], 11.2, 'office', { k: 'i', name: 'Заводоуправление ГАЗ', roof: 'flat' });
            wing.lm = { type: 'gazadmin', cut: -1000, nx, nz };
            this.gazWing = wing;
          }
        }
      }
      const gx = bx - nx * back, gz = bz - nz * back;
      const at = (u, v) => [gx + ux * u + nx * v, gz + uz * u + nz * v];
      const span = this.rectPoly(bx - nx * 3, bz - nz * 3, ux, uz, 22, 9);
      this.fenceSegs = this.fenceSegs.filter(f => !N.pointInPoly(span, (f.ax + f.bx) / 2, (f.az + f.bz) / 2));
      this.boxes = this.boxes.filter(it => !(it.kind === 'fence' && N.pointInPoly(span, (it.x0 + it.x1) / 2, (it.z0 + it.z1) / 2)));
      this.clearProps(span);
      this.prop('gazportal', gx, gz, yaw, { d: D });
      for (const [u0, u1] of [[-14.4, -10.4], [-5.0, -3.4], [3.4, 5.0], [10.4, 14.4]]) {
        const c = at((u0 + u1) / 2, -D / 2);
        this.obb(c[0], c[1], yaw, D / 2, (u1 - u0) / 2, 13, 'prop');
      }
      const bc = at(0, 0.4);
      this.prop('barrier', bc[0], bc[1], Math.atan2(uz, ux), { w: 6.4, breakable: true });
      for (const s of [1, -1]) {
        const f = at(0, s > 0 ? 0.07 : -D - 0.07);
        this.signs.push({ x: f[0], y: s > 0 ? 10.75 : 10.4, z: f[1], w: 17, h: 1.2, nx: nx * s, nz: nz * s, text: 'АВТОМОБИЛЬНЫЙ ЗАВОД', style: 'relief', color: '#e8c87a' });
        if (s > 0) this.signs.push({ x: f[0], y: 9.72, z: f[1], w: 7, h: 0.5, nx, nz, text: 'ОСНОВАН В 1932 ГОДУ', style: 'relief', color: '#e8c87a' });
        const l = at(0, s > 0 ? 0.04 : -GAZ_CREST.d - 0.04);
        this.signs.push({ x: l[0], y: GAZ_CREST.y, z: l[1], w: GAZ_CREST.w, h: GAZ_CREST.h, nx: nx * s, nz: nz * s, text: 'ГАЗ', style: 'gazlogo' });
      }
      for (const [s, t] of [[-1, '1'], [1, '2']]) {
        const m = atB(s * 19, 24);
        this.signs.push({ x: m[0] + nx * 0.36, y: 4.9, z: m[1] + nz * 0.36, w: 6.2, h: 7.75, nx, nz, text: t, style: 'mosaic' });
        this.prop('mosaicstand', m[0], m[1], yaw, {});
        this.obb(m[0], m[1], yaw, 3.6, 0.35, 9, 'prop');
      }
      const square = this.rectPoly(...atB(0, 26), ux, uz, 30, 25);
      const fore = this.rectPoly(...atB(0, -back / 2 - 0.25), ux, uz, 34, back / 2 + 0.25);
      const yard = this.rectPoly(...at(0, -D - 7), ux, uz, 12, 7);
      const lane = this.rectPoly(...at(0, -D / 2), ux, uz, 3.3, D / 2 + 0.3);
      this.plazas.push({ poly: square, tex: 'plaza' }, { poly: fore, tex: 'plaza' }, { poly: yard, tex: 'concrete' }, { poly: lane, tex: 'concrete' });
      for (const q of [square, fore, yard, lane]) this.fillPoly(q, GT.PLAZA, [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH, GT.CONC]);
      this.claimPoly(this.rectPoly(...at(0, -D / 2), ux, uz, 16, D / 2 + 1), 0.5);
      const o = atB(0, 14), y2 = at(0, -D - 8);
      this.put('gaz_gate', o[0], o[1], Math.atan2(-nx, nz));
      this.put('gaz_yard', y2[0], y2[1], yaw + Math.PI);
      this.claim(o[0] - 3, o[1] - 3, o[0] + 3, o[1] + 3);
      const area = this.rectPoly(...atB(0, 10), ux, uz, 60, 40);
      this.namedAreas.push({ name: 'Главная проходная ГАЗ', poly: area, box: N.polyBounds(area) });
      this.gazGate = { x: gx, z: gz, nx, nz, d: D, back };
      if (adm) {
        this.restyle(adm, 'office', { name: 'Заводоуправление ГАЗ', roof: 'flat', roofShape: null });
        this.reheight(adm, 11.2);
        const tower = N.clipHalf(adm.poly, 0, 1, -1000);
        adm.lm = { type: 'gazadmin', cut: -1000, nx, nz };
        if (tower) {
          for (const part of N.convexParts(tower)) if (Math.abs(N.polyArea(part)) > 0.5) this.poly(part, 46, 'building', { ref: adm.id });
          const tb = N.polyBounds(tower);
          adm.lm.tower = tower;
          this.signs.push({ x: (tb.x0 + tb.x1) / 2 + nx * 2, y: 48.6, z: (tb.z0 + tb.z1) / 2 + nz * 2, w: 12, h: 3.8, nx, nz, text: 'ГАЗ', style: 'gazlogo' });
        }
      }
    },

    cutFences(cx, cz, ux, uz, U, V) {
      const vx = -uz, vz = ux, keep = [], cut = [], fresh = new Set();
      for (const f of this.fenceSegs) {
        const lu = (x, z) => (x - cx) * ux + (z - cz) * uz, lv = (x, z) => (x - cx) * vx + (z - cz) * vz;
        const a0 = lu(f.ax, f.az), a1 = lu(f.bx, f.bz), b0 = lv(f.ax, f.az), b1 = lv(f.bx, f.bz);
        let t0 = 0, t1 = 1, hit = true;
        for (const [p0, p1, lim] of [[a0, a1, U], [b0, b1, V]]) {
          const d = p1 - p0;
          if (Math.abs(d) < 1e-9) { if (Math.abs(p0) > lim) hit = false; continue; }
          let ta = (-lim - p0) / d, tb = (lim - p0) / d;
          if (ta > tb) [ta, tb] = [tb, ta];
          t0 = Math.max(t0, ta);
          t1 = Math.min(t1, tb);
        }
        if (!hit || t0 >= t1) { keep.push(f); continue; }
        cut.push(f);
        const L = Math.hypot(f.bx - f.ax, f.bz - f.az), P = t => [f.ax + (f.bx - f.ax) * t, f.az + (f.bz - f.az) * t];
        for (const [s0, s1] of [[0, t0], [t1, 1]]) {
          if ((s1 - s0) * L < 0.3) continue;
          const [x0, z0] = P(s0), [x1, z1] = P(s1);
          fresh.add(this.segWall(x0, z0, x1, z1, f.t, f.h, 'fence', { tex: f.tex }));
          keep.push({ ax: x0, az: z0, bx: x1, bz: z1, h: f.h, t: f.t, tex: f.tex });
        }
      }
      if (!cut.length) return;
      const mids = cut.map(f => [(f.ax + f.bx) / 2, (f.az + f.bz) / 2]);
      this.boxes = this.boxes.filter(it => fresh.has(it) || !(it.kind === 'fence' && mids.some(([x, z]) => Math.abs((it.x0 + it.x1) / 2 - x) < 0.05 && Math.abs((it.z0 + it.z1) / 2 - z) < 0.05)));
      this.fenceSegs = keep;
    },

    stripCut(poly, ox, oz, ux, uz, nx, nz, u0, u1) {
      const n = poly.length / 2;
      const U = k => (poly[k * 2] - ox) * ux + (poly[k * 2 + 1] - oz) * uz;
      const V = k => (poly[k * 2] - ox) * nx + (poly[k * 2 + 1] - oz) * nz;
      const hits = [];
      for (const [u, tag] of [[u0, 0], [u1, 1]]) {
        const hs = [];
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, a = U(i) - u, b = U(j) - u;
          if ((a < 0) === (b < 0)) continue;
          const t = a / (a - b);
          hs.push({ i, t, tag, v: V(i) + (V(j) - V(i)) * t, x: poly[i * 2] + (poly[j * 2] - poly[i * 2]) * t, z: poly[i * 2 + 1] + (poly[j * 2 + 1] - poly[i * 2 + 1]) * t });
        }
        if (hs.length < 2) return null;
        hs.sort((a, b) => b.v - a.v);
        hits.push(Object.assign(hs[0], { front: true }), Object.assign(hs[1], { front: false }));
      }
      const seq = [];
      for (let i = 0; i < n; i++) {
        seq.push({ x: poly[i * 2], z: poly[i * 2 + 1] });
        for (const h of hits.filter(q => q.i === i).sort((a, b) => a.t - b.t)) seq.push(h);
      }
      const out = [];
      for (const h of hits) {
        let k = (seq.indexOf(h) + 1) % seq.length;
        const path = [h];
        while (!hits.includes(seq[k])) { path.push(seq[k]); k = (k + 1) % seq.length; }
        const e = seq[k];
        if (e.tag !== h.tag || e.front === h.front) continue;
        path.push(e);
        const q = [];
        for (const p of path) q.push(p.x, p.z);
        out.push(N.polyArea(q) < 0 ? N.reversePoly(q) : q);
      }
      return out.length === 2 ? out : null;
    },

    reshape(b, poly) {
      const bb = N.polyBounds(poly);
      Object.assign(b, { poly, x0: bb.x0, z0: bb.z0, x1: bb.x1, z1: bb.z1, cx: (bb.x0 + bb.x1) / 2, cz: (bb.z0 + bb.z1) / 2, area: Math.abs(N.polyArea(poly)), mb: this.mabr(poly) });
      this.boxes = this.boxes.filter(it => it.ref !== b.id);
      b.parts = N.convexParts(poly);
      for (const p of b.parts) if (p.length >= 6 && Math.abs(N.polyArea(p)) > 0.5) this.poly(p, b.h, 'building', { ref: b.id, walkRoof: b.walkRoof });
    },

    siteStadium() {
      const pitch = this.land.filter(l => (l.k === 'i' || l.k === 't') && l.area > 3000).sort((a, b) => Math.hypot((a.box.x0 + a.box.x1) / 2 + 20, (a.box.z0 + a.box.z1) / 2 + 810) - Math.hypot((b.box.x0 + b.box.x1) / 2 + 20, (b.box.z0 + b.box.z1) / 2 + 810))[0];
      const m = this.mabr(pitch.poly);
      const cx = m.cx, cz = m.cz;
      const hl = Math.max(52, m.hl), hw = Math.max(34, m.hw);
      const side = [-1, 1];
      const built = [];
      this.stadium = { cx, cz, ax: m.ax, az: m.az, hl, hw };
      for (const s of side) {
        const sx = cx - m.az * s * (hw + 9), sz = cz + m.ax * s * (hw + 9);
        const sp = this.rectPoly(sx, sz, m.ax, m.az, hl * 0.85, 7);
        let clear = true;
        for (const b of this.buildings) if (!b.removed && b.area > 3000 && N.pointInPoly(sp, b.cx, b.cz)) clear = false;
        if (!clear) continue;
        this.clearProps(sp);
        this.customBuilding(sp, 8, 'stands', { k: 'o', standsN: [m.az * s, -m.ax * s], walkRoof: false });
        built.push(s);
      }
      const vs = built.length ? built[0] : 1;
      const vx = cx - m.az * vs * (hw + 1.5), vz = cz + m.ax * vs * (hw + 1.5);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = cx + m.ax * a * (hl + 6) - m.az * b * (hw + 4), z = cz + m.az * a * (hl + 6) + m.ax * b * (hw + 4);
        if (!this.freeAt(x, z, 1)) continue;
        this.prop('floodlight', x, z, Math.atan2(cx - x, -(cz - z)), { h: 32 });
        this.circle(x, z, 0.8, 32, 'mast');
      }
      this.prop('goal', cx + m.ax * (hl - 1), cz + m.az * (hl - 1), Math.atan2(m.ax, -m.az) + Math.PI);
      this.prop('goal', cx - m.ax * (hl - 1), cz - m.az * (hl - 1), Math.atan2(m.ax, -m.az));
      this.prop('pitchlines', cx, cz, Math.atan2(m.az, -m.ax), { w: 68, l: Math.min(104, hl * 2 - 4) });
      const srot = Math.atan2(m.ax, -m.az) - Math.PI;
      this.put('stadium', cx, cz, srot, { rot: srot });
      this.put('stadium_vip', vx, vz, Math.atan2(m.az * vs, m.ax * vs));
      const ne = this.nearestEdge(cx, cz, e => e.rank >= 1, 300);
      const tx = ne.x - cx, tz = ne.z - cz, tl = Math.hypot(tx, tz) || 1;
      this.put('stadium_gate', ne.x - tx / tl * (ne.e.hw + 6), ne.z - tz / tl * (ne.e.hw + 6), Math.atan2(-tx, tz));
      const lot = this.freeSpot(cx + tx / tl * (hw + 30), cz + tz / tl * (hw + 30), 20);
      const rl = this.nearestEdge(lot[0], lot[1], e => !e.plant, 60);
      const ly = rl ? Math.atan2(rl.dx, -rl.dz) : 0;
      this.put('stadium_lot', lot[0], lot[1], ly, { rot: ly - Math.PI / 2 });
      const sw = this.wallToRoad(this.bNear(130, -798, 60) || this.buildings[0], e => e.rank >= 1);
      if (sw) this.wallSign(sw, 0, 9, 22, 2.4, 'ДВОРЕЦ СПОРТА «ТОРПЕДО»', 'gov');
      this.signs.push({ x: this.places.stadium_gate.x, y: 4.6, z: this.places.stadium_gate.z, w: 16, h: 1.8, nx: tx / tl, nz: tz / tl, text: 'СТАДИОН «ТОРПЕДО»', style: 'gov', post: true });
      this.namedAreas.push({ name: 'Стадион «Торпедо»', poly: this.rectPoly(cx, cz, m.ax, m.az, hl + 20, hw + 25), box: N.polyBounds(this.rectPoly(cx, cz, m.ax, m.az, hl + 20, hw + 25)) });
      this.pedArea(cx - 30, cz - 30, cx + 30, cz + 30, 'park', 2, this.rectPoly(cx, cz, m.ax, m.az, hl - 4, hw - 4));
    },

    addRamp(x, z, fx, fz, l, w, h, id, name, reward) {
      const r = { cx: x, cz: z, fx, fz, l, w, h };
      const p = this.rectPoly(x, z, fx, fz, l / 2, w / 2);
      const b = N.polyBounds(p);
      Object.assign(r, b);
      this.ramps.push(r);
      this.prop('ramp', x, z, Math.atan2(fx, -fz), { w, l, h });
      this.claimPoly(p, 2);
      this.jumps.push({ id, x: x + fx * l / 2, z: z + fz * l / 2, yaw: Math.atan2(fx, -fz), name, reward });
      return r;
    },

    notchFront(b, w, u0, u1, d) {
      const p = b.poly, i = w.i;
      const A = this.at(w, u0, 0), B = this.at(w, u0, -d), C = this.at(w, u1, -d), D = this.at(w, u1, 0);
      const np = p.slice(0, i + 2).concat(A, B, C, D, p.slice(i + 2));
      this.boxes = this.boxes.filter(it => it.ref !== b.id);
      for (const part of N.convexParts(np)) if (part.length >= 6 && Math.abs(N.polyArea(part)) > 0.5) this.poly(part, b.h, 'building', { ref: b.id, walkRoof: b.walkRoof });
      b.cpoly = np;
    },

    reheight(b, h) {
      b.h = h;
      for (const it of this.boxes) if (it.ref === b.id) it.y1 = h;
    },

    frontSign(w, u, v, y, width, h, text, style, extra) {
      const [x, z] = this.at(w, u, v);
      const s = Object.assign({ x, z, y, w: width, h, nx: w.nx, nz: w.nz, text, style }, extra || {});
      this.signs.push(s);
      return s;
    },

    arcRun(b) {
      const p = b.poly, n = p.length / 2;
      const short = [];
      for (let k = 0; k < n; k++) short.push(this.wall(b, k * 2).L < 5.5);
      let best = null;
      for (let s = 0; s < n; s++) {
        if (!short[s] || short[(s + n - 1) % n]) continue;
        let len = 0;
        while (len < n && short[(s + len) % n]) len++;
        if (len >= 3 && (!best || len > best.len)) best = { s, len };
      }
      if (!best) return null;
      const P = k => [p[((best.s + k) % n) * 2], p[((best.s + k) % n) * 2 + 1]];
      const a = P(0), m = P(Math.floor(best.len / 2)), c = P(best.len);
      const d = 2 * (a[0] * (m[1] - c[1]) + m[0] * (c[1] - a[1]) + c[0] * (a[1] - m[1]));
      if (Math.abs(d) < 1e-6) return null;
      const s2 = q => q[0] * q[0] + q[1] * q[1];
      const cx = (s2(a) * (m[1] - c[1]) + s2(m) * (c[1] - a[1]) + s2(c) * (a[1] - m[1])) / d;
      const cz = (s2(a) * (c[0] - m[0]) + s2(m) * (a[0] - c[0]) + s2(c) * (m[0] - a[0])) / d;
      const r = (Math.hypot(a[0] - cx, a[1] - cz) + Math.hypot(m[0] - cx, m[1] - cz) + Math.hypot(c[0] - cx, c[1] - cz)) / 3;
      const walls = [];
      for (let k = 0; k < best.len; k++) walls.push(((best.s + k) % n) * 2);
      let a0 = Math.atan2(a[1] - cz, a[0] - cx), a1 = Math.atan2(c[1] - cz, c[0] - cx);
      let span = a1 - a0;
      while (span > Math.PI) span -= Math.PI * 2;
      while (span < -Math.PI) span += Math.PI * 2;
      return { walls, cx, cz, r, a0, span, pts: Array.from({ length: best.len + 1 }, (_, k) => P(k)) };
    },

    siteDk() {
      const dk = this.bNear(89, -6, 40, q => q.area > 3000);
      if (!dk) return;
      this.restyle(dk, 'dk', { name: 'Дворец культуры ГАЗ', roof: 'flat', roofShape: null });
      this.reheight(dk, 16.3);
      const w = this.wallToward(dk, 142, -97, 40);
      const pw = Math.min(30, w.L * 0.3), pd = 4.2;
      dk.lm = { type: 'dk', wall: w.i, pw, pd };
      this.notchFront(dk, w, -pw / 2, pw / 2, pd);
      const st = this.at(w, 0, 1.75);
      const sp = this.rectPoly(st[0], st[1], -w.nx, -w.nz, 1.75, pw / 2 + 3);
      this.ramps.push(Object.assign({ cx: st[0], cz: st[1], fx: -w.nx, fz: -w.nz, l: 3.5, w: pw + 6, h: 0.9, stair: true }, N.polyBounds(sp)));
      const dc = this.at(w, 0, -pd / 2 + 0.1);
      this.decks.push({ poly: this.rectPoly(dc[0], dc[1], w.ux, w.uz, pw / 2 - 0.05, pd / 2 + 0.1), y: 1.0 });
      for (let k = 0; k < 8; k++) {
        const q = this.at(w, -pw / 2 + 1.5 + k * (pw - 3) / 7, -0.8);
        this.circle(q[0], q[1], 0.6, 15, 'column');
      }
      this.frontSign(w, 0, 0.22, 15.42, pw * 0.94, 0.95, 'ДВОРЕЦ КУЛЬТУРЫ АВТОЗАВОДА', 'relief', { color: '#6a5232' });
      this.claimPoly(sp, 0.5);
      const [px, pz] = this.at(w, 0, 16);
      this.put('dk', px, pz, this.yawOut(w) + Math.PI);
      this.claim(px - 10, pz - 10, px + 10, pz + 10);
      this.pedArea(px - 20, pz - 20, px + 20, pz + 20, 'leninsky', 6);
      this.dkB = dk;
    },

    siteMir() {
      const mir = this.bNear(-42, -128, 40, q => q.area > 1000);
      if (!mir) return;
      this.restyle(mir, 'cinema', { name: 'Кинотеатр «Мир»', roof: 'flat', roofShape: null });
      this.reheight(mir, 17.5);
      const m = mir.mb;
      let fx = m.ax, fz = m.az;
      if (fz < 0) { fx = -fx; fz = -fz; }
      let ex = -fz, ez = fx;
      if ((100 - m.cx) * ex + (-117 - m.cz) * ez < 0) { ex = -ex; ez = -ez; }
      const walls = [];
      for (let i = 0; i < mir.poly.length; i += 2) walls.push(this.wall(mir, i));
      const off = w => w.mx * ex + w.mz * ez, proj = (x, z) => x * fx + z * fz;
      const side = walls.filter(w => w.nx * ex + w.nz * ez > 0.95);
      const g = side.reduce((a, w) => (w.L > a.L ? w : a));
      const w = side.filter(q => q.L > 10 && off(q) > off(g) + 2).sort((a, b) => b.L - a.L)[0];
      if (!w) return;
      const cut = Math.min(proj(w.ax, w.az), proj(w.bx, w.bz), Math.max(proj(g.ax, g.az), proj(g.bx, g.bz))) - 0.05;
      const pts = [];
      const n = Math.max(2, Math.round(g.L / 4.2));
      for (let k = 0; k <= n; k++) {
        const u = -g.L / 2 + 0.6 + k * (g.L - 1.2) / n;
        const q = this.at(g, u, 2.85);
        if (proj(q[0], q[1]) > cut - 1) continue;
        pts.push(u);
        this.circle(q[0], q[1], 0.42, 4.6, 'column');
      }
      const galleries = [{ i: g.i, us: pts }];
      mir.lm = { type: 'mir', front: w.i, fx, fz, cut, galleries };
      const pw = 8.4;
      this.frontSign(w, 0, 1.38, 14.15, 7.2, 0.9, 'КИНОТЕАТР', 'relief', { color: '#4a3826' });
      this.frontSign(w, 0, 1.38, 12.75, 5.6, 1.9, 'МИР', 'relief', { color: '#4a3826' });
      this.frontSign(w, 0, 1.3, 8.6, 6.2, 1.4, 'БРАТ-2 · МАТРИЦА · ДМБ', 'board');
      const st = this.at(w, 0, 1.9);
      const sp = this.rectPoly(st[0], st[1], -w.nx, -w.nz, 0.6, pw / 2 + 1.1);
      this.ramps.push(Object.assign({ cx: st[0], cz: st[1], fx: -w.nx, fz: -w.nz, l: 1.2, w: pw + 2.2, h: 0.35, stair: true }, N.polyBounds(sp)));
      const dc = this.at(w, 0, 0.45);
      this.decks.push({ poly: this.rectPoly(dc[0], dc[1], w.ux, w.uz, pw / 2 - 0.05, 0.85), y: 0.45 });
      const yaw = this.yawOut(w);
      const court = this.rectPoly(...this.at(w, 0, 5.75), w.ux, w.uz, w.L / 2 + 2, 5.25);
      this.plazas.push({ poly: court, tex: 'brickpave' });
      this.fillPoly(court, GT.PLAZA, [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH, GT.CONC]);
      this.claimPoly(court, 0.5);
      for (const s of [-1, 1]) {
        const q = this.at(w, s * (pw / 2 + 2.3), 3.6);
        this.prop('globelamp', q[0], q[1], yaw);
        this.circle(q[0], q[1], 0.2, 4.4, 'lamp', { breakable: true, mesh: 'globelamp' });
        const f = this.at(w, s * (w.L / 2 - 1.2), 7.5);
        this.prop('flowerbed', f[0], f[1], 0);
        this.circle(f[0], f[1], 3, 0.5, 'prop');
        const b = this.at(w, s * (w.L / 2 - 1.2), 3.4);
        this.prop('bench', b[0], b[1], yaw + Math.PI / 2 * s);
      }
      const lane = this.rectPoly(...this.at(g, 0, 4.2), g.ux, g.uz, g.L / 2, 1.2);
      this.plazas.push({ poly: lane, tex: 'brickpave' });
      this.fillPoly(lane, GT.PLAZA, [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH, GT.CONC]);
      this.claimPoly(lane, 0.3);
      for (let u = -g.L / 2 + 4; u < g.L / 2 - 2; u += 12) {
        const q = this.at(g, u, 5.2);
        if (proj(q[0], q[1]) > cut - 2) continue;
        this.prop('globelamp', q[0], q[1], this.yawOut(g));
        this.circle(q[0], q[1], 0.2, 4.4, 'lamp', { breakable: true, mesh: 'globelamp' });
      }
      const stall = 2.7, s0 = -g.L / 2 + 3, cnt = Math.floor((g.L - 6) / stall);
      for (let k = 0; k <= cnt; k++) {
        const u = s0 + k * stall, a = this.at(g, u, 5.8), b = this.at(g, u, 10.6);
        if (proj(a[0], a[1]) > cut - 2 || this.surfaceAt(b[0], b[1]) === 0) continue;
        this.marks.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], w: 0.12 });
        if (k < cnt) {
          const c = this.at(g, u + stall / 2, 8.4);
          if (this.surfaceAt(c[0], c[1]) !== 0 && N.hash2(k, mir.id, 5) < 0.7) this.park(c[0], c[1], this.yawOut(g) + Math.PI);
        }
      }
      const [px, pz] = this.at(w, 0, 7);
      this.put('cinema', px, pz, yaw + Math.PI);
      this.claim(px - 3, pz - 3, px + 3, pz + 3);
      this.mirB = mir;
    },

    siteUnivermag() {
      const uni = this.bNear(302, -345, 40, q => q.area > 1500);
      if (!uni) return;
      this.restyle(uni, 'store', { name: 'Автозаводский универмаг', roof: 'flat', roofShape: null });
      this.reheight(uni, 14);
      const drum = this.arcRun(uni);
      uni.lm = { type: 'um', drum };
      if (!drum) return;
      const word = 'УНИВЕРМАГ', H = 1.95, R = drum.r - 0.25, Y = 17.25 + H / 2 + 0.03, step = 2.05 / R;
      drum.letters = { R, y: Y, h: H, step };
      const mid = drum.a0 + drum.span / 2, dir = drum.span > 0 ? 1 : -1;
      for (let k = 0; k < word.length; k++) {
        const a = mid - dir * (k - (word.length - 1) / 2) * step;
        const nx = Math.cos(a), nz = Math.sin(a);
        this.signs.push({ x: drum.cx + nx * R, z: drum.cz + nz * R, y: Y, w: 1.55, h: H, nx, nz, text: word[k], style: 'boxletter' });
      }
      const q = [drum.cx + Math.cos(mid) * (drum.r + 7), drum.cz + Math.sin(mid) * (drum.r + 7)];
      this.put('univermag', q[0], q[1], Math.atan2(-Math.cos(mid), Math.sin(mid)));
      this.umPlaza(uni, drum);
      this.uniB = uni;
    },

    umPlaza(uni, drum) {
      const { cx, cz, r } = drum, ground = [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH, GT.CONC];
      const A0 = Math.min(drum.a0, drum.a0 + drum.span) - 0.35, A1 = Math.max(drum.a0, drum.a0 + drum.span) + 0.35;
      const arcPt = (a, rr) => [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr];
      const fan = [];
      for (let k = 0; k <= 18; k++) fan.push(...arcPt(A0 + (A1 - A0) * k / 18, r + 26));
      for (let k = 18; k >= 0; k--) fan.push(...arcPt(A0 + (A1 - A0) * k / 18, r - 2));
      const polys = [N.polyArea(fan) < 0 ? N.reversePoly(fan) : fan];
      const drumWalls = new Set(drum.walls), fronts = [];
      for (let i = 0; i < uni.poly.length; i += 2) {
        const w = this.wall(uni, i);
        if (w.L < 10 || drumWalls.has(i)) continue;
        const o = this.at(w, 0, 6);
        if (N.pointInPoly(uni.poly, o[0], o[1])) continue;
        const ne = this.nearestEdge(w.mx + w.nx * 8, w.mz + w.nz * 8, e => e.rank >= 3, 60);
        if (!ne || (ne.x - w.mx) * w.nx + (ne.z - w.mz) * w.nz < 20) continue;
        fronts.push(w);
        polys.push(this.rectPoly(...this.at(w, 0, 5), w.ux, w.uz, w.L / 2 + 1, 5.5));
      }
      for (const p of polys) {
        this.plazas.push({ poly: p, tex: 'plaza' });
        this.fillPoly(p, GT.PLAZA, ground);
      }
      const ring = [];
      for (let k = 0; k <= 18; k++) ring.push(...arcPt(A0 + 0.2 + (A1 - A0 - 0.4) * k / 18, r + 1.4));
      for (let k = 18; k >= 0; k--) ring.push(...arcPt(A0 + 0.2 + (A1 - A0 - 0.4) * k / 18, r - 1));
      this.plazas.push({ poly: N.polyArea(ring) < 0 ? N.reversePoly(ring) : ring, tex: 'granite' });
      const free = (x, z, rad) => this.surfaceAt(x, z) !== 0 && this.freeAt(x, z, rad) && !N.pointInPoly(uni.poly, x, z);
      for (let a = A0 + 0.12; a <= A1 - 0.12; a += 0.27) {
        const [x, z] = arcPt(a, r + 8.5);
        if (!free(x, z, 0.5)) continue;
        this.prop('globelamp', x, z, Math.atan2(Math.cos(a), -Math.sin(a)));
        this.circle(x, z, 0.2, 4.4, 'lamp', { breakable: true, mesh: 'globelamp' });
      }
      const texts = ['СОЮЗПЕЧАТЬ', 'ЦВЕТЫ', 'МОРОЖЕНОЕ', 'АУДИОКАССЕТЫ', 'СИГАРЕТЫ', 'ЛОТЕРЕЯ'];
      let ki = 0;
      for (let a = A0 + 0.3; a <= A1 - 0.3 && ki < texts.length; a += 0.21) {
        const [x, z] = arcPt(a, r + 21.5);
        if (!free(x, z, 2)) continue;
        const rot = Math.atan2(Math.cos(a), -Math.sin(a));
        this.prop('kiosk', x, z, rot, { text: texts[ki++] });
        this.obb(x, z, rot, 1.5, 1.5, 2.6, 'prop');
        this.claim(x - 2, z - 2, x + 2, z + 2);
      }
      const tents = ['#c83030', '#2a6ac8', '#e8a020'];
      for (let k = 0; k < tents.length; k++) {
        const a = A0 + 0.15 + k * 0.13, [x, z] = arcPt(a, r + 15);
        if (!free(x, z, 3)) continue;
        const rot = Math.atan2(Math.cos(a), -Math.sin(a));
        this.prop('tent', x, z, rot, { c: tents[k] });
        this.obb(x, z, rot, 3, 3, 2.3, 'prop');
        this.claim(x - 3.5, z - 3.5, x + 3.5, z + 3.5);
      }
      for (const a of [A0 + 0.55, A1 - 0.55]) {
        const [x, z] = arcPt(a, r + 12);
        if (free(x, z, 1)) this.prop('bench', x, z, Math.atan2(-Math.cos(a), Math.sin(a)));
      }
      for (const w of fronts) {
        const [dx, dz] = this.at(w, 0, 0);
        this.prop('canopy', dx, dz, this.yawOut(w), { w: 4, door: true });
        for (let u = -w.L / 2 + 4; u <= w.L / 2 - 3; u += 12) {
          const [x, z] = this.at(w, u, 7.5);
          if (!free(x, z, 0.5)) continue;
          this.prop('globelamp', x, z, this.yawOut(w));
          this.circle(x, z, 0.2, 4.4, 'lamp', { breakable: true, mesh: 'globelamp' });
        }
      }
      for (const p of polys) this.claimPoly(p, 0.5);
      this.pedArea(cx - r - 26, cz - r - 26, cx + r + 26, cz + r + 26, 'leninsky', 10, polys[0]);
    },

    siteKiselev() {
      const sq = this.land.find(l => /Киселёва/.test(l.name));
      if (!sq) return;
      const cx = 100, cz = -117;
      sq.custom = true;
      const beds = [];
      const n = 8, rin = 11, path = 2.2, ring = 5.5, off = 0.49;
      const tram = this.tramCut(sq.poly);
      const cutT = poly => tram ? [N.clipHalf(poly, tram.nx, tram.nz, tram.c - 4.2), N.clipHalf(poly, -tram.nx, -tram.nz, -(tram.c + 4.2))].filter(Boolean) : [poly];
      const rOut = a => N.rayPolyDist(sq.poly, cx, cz, Math.cos(a), Math.sin(a)) - ring;
      const arc = (a0, a1, rf) => {
        const pts = [];
        for (let s = 0; s <= 8; s++) {
          const am = a0 + (a1 - a0) * s / 8;
          const r = rf(am);
          const t = a0 + path / r + (a1 - a0 - 2 * path / r) * s / 8;
          pts.push(cx + Math.cos(t) * r, cz + Math.sin(t) * r);
        }
        return pts;
      };
      const ccw = q => (N.polyArea(q) < 0 ? N.reversePoly(q) : q);
      for (let k = 0; k < n; k++) {
        const a0 = off + k / n * Math.PI * 2, a1 = off + (k + 1) / n * Math.PI * 2;
        if (!(rOut((a0 + a1) / 2) > rin + 7)) continue;
        const poly = ccw(arc(a0, a1, () => rin).concat(N.reversePoly(arc(a0, a1, a => Math.max(rin + 4, rOut(a))))));
        const flowers = ccw(arc(a0, a1, () => rin + 0.7).concat(N.reversePoly(arc(a0, a1, () => rin + 2.7))));
        for (const part of cutT(poly)) beds.push({ poly: part, flowers: N.pointInPoly(part, cx + Math.cos((a0 + a1) / 2) * (rin + 1.7), cz + Math.sin((a0 + a1) / 2) * (rin + 1.7)) ? flowers : null });
      }
      this.fillPoly(sq.poly, GT.PLAZA, [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH]);
      for (const b of beds) {
        this.fillPoly(b.poly, GT.GRASS, [GT.PLAZA]);
        const bb = N.polyBounds(b.poly);
        for (let x = bb.x0 + 3; x < bb.x1; x += 7.5) {
          for (let z = bb.z0 + 3; z < bb.z1; z += 7.5) {
            const hx = N.hash2(Math.round(x), Math.round(z), 21), hz = N.hash2(Math.round(x), Math.round(z), 22);
            const px = x + (hx - 0.5) * 3, pz = z + (hz - 0.5) * 3;
            if (!N.pointInPoly(b.poly, px, pz) || Math.hypot(px - cx, pz - cz) < rin + 3.4 || N.hash2(Math.round(px), Math.round(pz), 23) < 0.3) continue;
            let edgeD = Infinity;
            for (let i = 0; i < b.poly.length; i += 2) { const j = (i + 2) % b.poly.length; edgeD = Math.min(edgeD, N.segDist2(px, pz, b.poly[i], b.poly[i + 1], b.poly[j], b.poly[j + 1])[0]); }
            if (edgeD < 1.8 * 1.8) continue;
            this.prop('tree', px, pz, N.hash2(Math.round(px), Math.round(pz), 9) * 6.28, { kind: 'spruce', s: 0.8 + N.hash2(Math.round(px), Math.round(pz), 4) * 0.4 });
            this.circle(px, pz, 0.3, 6, 'tree');
          }
        }
      }
      for (const b of beds) this.claimPoly(b.poly, 0.6);
      this.prop('flowerbed', cx, cz, 0);
      this.circle(cx, cz, 3, 0.5, 'prop');
      this.foot = this.cutLines(this.foot, sq.poly);
      this.kiselev = { cx, cz, poly: sq.poly, beds, rin };
    },

    tramCut(poly) {
      const pts = [];
      for (const r of this.rails) {
        if (r.k !== 'T') continue;
        for (let i = 2; i < r.pts.length; i += 2) {
          const ax = r.pts[i - 2], az = r.pts[i - 1], bx = r.pts[i], bz = r.pts[i + 1];
          const m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
          for (let k = 0; k <= m; k++) { const x = ax + (bx - ax) * k / m, z = az + (bz - az) * k / m; if (N.pointInPoly(poly, x, z)) pts.push([x, z]); }
        }
      }
      if (pts.length < 2) return null;
      let a = pts[0], b = pts[1], bd = -1;
      for (const p of pts) for (const q of pts) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d > bd) { bd = d; a = p; b = q; } }
      if (bd < 10) return null;
      const ux = (b[0] - a[0]) / bd, uz = (b[1] - a[1]) / bd, nx = -uz, nz = ux;
      let c = 0;
      for (const p of pts) c += p[0] * nx + p[1] * nz;
      return { nx, nz, c: c / pts.length };
    },

    cutLines(list, poly) {
      const out = [];
      const b = N.polyBounds(poly);
      for (const f of list) {
        const p = f.pts;
        let hit = false;
        for (let i = 0; i < p.length && !hit; i += 2) if (p[i] > b.x0 && p[i] < b.x1 && p[i + 1] > b.z0 && p[i + 1] < b.z1) hit = true;
        if (!hit) { out.push(f); continue; }
        let run = [];
        const flush = () => { if (run.length >= 4) out.push(Object.assign({}, f, { pts: run })); run = []; };
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5));
          for (let k = i === 2 ? 0 : 1; k <= n; k++) {
            const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
            if (N.pointInPoly(poly, x, z)) flush(); else run.push(x, z);
          }
        }
        flush();
      }
      return out;
    },

    siteParkGate() {
      const park = this.land.find(l => /Автозаводский парк культуры/.test(l.name));
      if (!park) return;
      const P = park.poly, G = N.PARK.gate;
      let best = null, bd = Infinity;
      for (let i = 0; i < P.length; i += 2) {
        const j = (i + 2) % P.length;
        const [d2, t] = N.segDist2(G[0], G[1], P[i], P[i + 1], P[j], P[j + 1]);
        if (d2 < bd) { bd = d2; const ex = P[j] - P[i], ez = P[j + 1] - P[i + 1], L = Math.hypot(ex, ez) || 1; best = { x: P[i] + ex * t, z: P[i + 1] + ez * t, ux: ex / L, uz: ez / L }; }
      }
      const E = N.PARK.east, ax = E.from[0] - E.to[0], az = E.from[1] - E.to[1], al = Math.hypot(ax, az);
      let nx = ax / al, nz = az / al;
      if (N.pointInPoly(P, best.x + nx * 5, best.z + nz * 5)) { nx = -nx; nz = -nz; }
      const ux = -nz, uz = nx;
      const gx = best.x, gz = best.z, yaw = Math.atan2(nx, -nz);
      const area = this.rectPoly(gx + nx * 12, gz + nz * 12, nx, nz, 14, 20);
      this.clearProps(area, true);
      this.clearProps(this.rectPoly(gx, gz, nx, nz, 3, 17), true);
      this.prop('parkgate', gx, gz, yaw, {});
      for (const u of [-15.2, -9.4, -3.4, 3.4, 9.4, 15.2]) {
        const hw = Math.abs(u) === 3.4 ? 1.05 : 0.75;
        this.obb(gx + ux * u, gz + uz * u, yaw, hw, 0.75, 13, 'prop');
        this.circle(gx + ux * u + nx * 1.65, gz + uz * u + nz * 1.65, 0.4, 0.6, 'prop');
      }
      this.cutFences(gx, gz, ux, uz, 16.3, 2.6);
      for (const s of [1, -1]) {
        this.signs.push({ x: gx + nx * 0.97 * s, y: 11.95, z: gz + nz * 0.97 * s, w: 3.4, h: 1.15, nx: nx * s, nz: nz * s, text: 'ПАРК', style: 'paint', color: '#fbf8f0' });
        this.signs.push({ x: gx + nx * 0.97 * s, y: 10.95, z: gz + nz * 0.97 * s, w: 7.6, h: 0.85, nx: nx * s, nz: nz * s, text: 'КУЛЬТУРЫ И ОТДЫХА', style: 'paint', color: '#fbf8f0' });
      }
      const front = this.rectPoly(gx + nx * 13, gz + nz * 13, nx, nz, 13, 22);
      const inner = this.rectPoly(gx - nx * 5, gz - nz * 5, nx, nz, 5, 9);
      const square = [-30, -88, 5, -88, 0, -50, -24, -50];
      const east = [-21.5, -158, 3, -158, 5, -88, -23, -88, -20.5, -115, -26, -116];
      this.plazas.push({ poly: front, tex: 'brickpave' }, { poly: inner, tex: 'brickpave' }, { poly: square, tex: 'brickpave' }, { poly: east, tex: 'plaza' });
      for (const q of [square, east, front, inner]) this.fillPoly(q, GT.PLAZA, [GT.GRASS, GT.FOREST, GT.FIELD, GT.YARD, GT.DIRT, GT.PATH]);
      this.claimPoly(this.rectPoly(gx, gz, nx, nz, 3, 17), 0.5);
      this.claimPoly(inner, 0);
      this.claimPoly(front, 0);
      for (const s of [-1, 1]) {
        const bx = gx + nx * 2.6 + ux * s * 19.5, bz = gz + nz * 2.6 + uz * s * 19.5;
        this.prop('infoboard', bx, bz, yaw, { text: s < 0 ? 0 : 1 });
        this.obb(bx, bz, yaw, 0.15, 1.3, 2.4, 'prop');
        this.signs.push({ x: bx + nx * 0.03, y: 1.95, z: bz + nz * 0.03, w: 2.3, h: 0.42, nx, nz, text: 'АВТОЗАВОДСКИЙ ПАРК', style: 'board' });
        this.signs.push({ x: bx + nx * 0.03, y: 1.38, z: bz + nz * 0.03, w: 2.3, h: 0.4, nx, nz, text: s < 0 ? 'РЕЖИМ РАБОТЫ 9.00–23.00' : 'ПРАВИЛА ПОЛЬЗОВАНИЯ ПАРКОМ', style: 'board' });
      }
      this.put('park_gate', gx + nx * 9, gz + nz * 9, Math.atan2(-nx, nz));
      this.parkGate = { x: gx, z: gz, nx, nz };
    },

    siteRadius() {
      const b = this.bNear(-762, -382, 40, q => q.area > 800 && q.poly.length >= 30);
      if (!b) return;
      this.restyle(b, 'stalin', { name: 'Радиусный дом', roof: 'flat', roofShape: null });
      this.reheight(b, 22.4);
      const front = [];
      for (let i = 0; i < b.poly.length; i += 2) {
        const w = this.wall(b, i);
        if (w.L < 8) continue;
        const ne = this.nearestEdge(w.mx + w.nx * 8, w.mz + w.nz * 8, e => e.rank >= 2, 40);
        if (ne && (ne.x - w.mx) * w.nx + (ne.z - w.mz) * w.nz > 4) front.push(i);
      }
      b.lm = { type: 'radius', front };
      const w = this.wall(b, front[Math.floor(front.length / 2)] || 0);
      this.wallSign(w, -w.L * 0.2, 3.4, 4.2, 0.8, 'ПРЯЖА', 'shop');
      this.radiusB = b;
    },

    siteLandmarks() {
      this.siteRadius();
      this.siteDk();
      this.siteMir();
      this.siteUnivermag();
      this.siteKiselev();
      this.siteParkGate();
      const adm = this.bNear(-490, -619, 30);
      if (adm) {
        this.restyle(adm, 'ovd', { name: 'Администрация Автозаводского района' });
        const w = this.wallToRoad(adm, e => e.rank >= 2, 10);
        this.wallSign(w, 0, 3.6, 16, 1.2, 'АДМИНИСТРАЦИЯ АВТОЗАВОДСКОГО РАЙОНА', 'gov');
        const [fx, fz] = this.at(w, 0, 4);
        this.prop('flag', fx, fz, 0);
      }
      const tor = this.bNear(130, -798, 50);
      if (tor) this.restyle(tor, 'arena', { name: 'Дворец спорта «Торпедо»', roof: 'flat' });
      const hotelW = this.bNear(560, -470, 60, b => b.kind === 's' || b.kind === 'p' || b.kind === 'o');
      if (hotelW) { const w = this.wallToRoad(hotelW, e => e.rank >= 2, 10); this.roofSign(hotelW, w, 'ГОСТИНИЦА «ВОЛНА»'); }
      this.centerPoly = this.rectPoly(300, -400, 0.7, -0.7, 900, 350);
    },

    siteServices() {
      const svc = (id, x, z, title, style, sign, f) => {
        const b = this.bNear(x, z, 140, f || (q => q.kind !== 'h' && q.kind !== 'g' && q.kind !== 'u' && q.area > 250));
        if (!b) return null;
        if (style) this.restyle(b, style);
        const w = this.wallToRoad(b, e => e.rank >= 1, 8);
        if (sign) this.wallSign(w, 0, 3.6, Math.min(16, w.L * 0.8), 1.2, title, sign);
        const [px, pz] = this.door(w, 0, 3.6);
        this.put(id, px, pz, this.yawOut(w) + Math.PI, { title: title.charAt(0) + title.slice(1).toLowerCase() });
        this.claim(px - 3, pz - 3, px + 3, pz + 3);
        return { b, w, x: px, z: pz };
      };
      const hn = svc('hosp_n', -257, -464, 'БОЛЬНИЦА №37', 'hospital', 'gov');
      if (hn) { const [ax, az] = this.at(hn.w, 6, 7); this.park(ax, az, this.yawOut(hn.w) + Math.PI / 2, ['uaz452'], { livery: 'ambulance' }); }
      const hs = svc('hosp_s', -941, 789, 'БОЛЬНИЦА №40', 'hospital', 'gov', q => q.kind !== 'h' && q.kind !== 'g' && q.kind !== 'u' && q.area > 150);
      if (hs) { const [ax, az] = this.at(hs.w, 6, 7); this.park(ax, az, this.yawOut(hs.w) + Math.PI / 2, ['uaz452'], { livery: 'ambulance' }); }
      for (const [id, x, z, title] of [['ovd_s', -451, 704, 'ОВД АВТОЗАВОДСКОГО РАЙОНА'], ['ovd_n', 870, -2060, 'ОТДЕЛЕНИЕ МИЛИЦИИ №5']]) {
        const o = svc(id, x, z, title, 'ovd', 'gov');
        if (!o) continue;
        const [fx, fz] = this.at(o.w, 3, 2.2);
        this.prop('flag', fx, fz, 0);
        this.wallSign(o.w, 0, Math.min(o.b.h - 1.2, 9), 10, 1.4, 'МИЛИЦИЯ', 'gov');
        for (let i = -2; i <= 2; i++) {
          const [px, pz] = this.at(o.w, i * 3.4 + 2, 9);
          if (!this.freeAt(px, pz, 1.3) || this.surfaceAt(px, pz) === 0 && this.isRoadNet(px, pz)) continue;
          this.park(px, pz, this.yawOut(o.w), ['vaz2107', 'uaz469', 'volga3110'], { livery: 'militia', lot: id });
          this.claim(px - 1.2, pz - 1.2, px + 1.2, pz + 1.2);
        }
        this.put(id + '_lot', o.x + o.w.nx * 6, o.z + o.w.nz * 6, this.yawOut(o.w));
      }
      for (const [id, x, z, title] of [['respray_n', 1666, -2017, 'ЦЕНТР КУЗОВНОГО РЕМОНТА'], ['respray_s', -1762, 1166, 'АВТОСЕРВИС «ЖЕСТЯНЩИК»']]) {
        const b = this.bNear(x, z, 80, q => q.kind !== 'h' && q.area > 200);
        if (!b) continue;
        this.restyle(b, 'service');
        const w = this.wallToRoad(b, e => e.rank >= 1, 8);
        this.wallSign(w, 0, 4.4, Math.min(13, w.L - 2), 1.2, title, 'shop');
        const [gx, gz] = this.at(w, 0, 0.1);
        this.prop('gate', gx, gz, this.yawOut(w), { w: 6 });
        const [px, pz] = this.at(w, 0, 7);
        this.put(id, px, pz, this.yawOut(w) + Math.PI, { respray: true, door: [gx, gz] });
        this.claim(px - 5, pz - 5, px + 5, pz + 5);
      }
      const gun = svc('gunshop', -277, -748, 'ОХОТНИК · ОРУЖИЕ · РЫБАЛКА', null, 'shop', q => q.kind === 's');
      if (gun) { const [cx, cz] = this.at(gun.w, 0, 0); this.prop('canopy', cx, cz, this.yawOut(gun.w), { w: 4, door: true }); gun.b.shops = true; }
      const flat = this.bNear(-1994, 784, 60, q => q.kind === 'p');
      if (flat) {
        const w = this.wallToward(flat, flat.cx + flat.mb.az * 30 * (flat.yardSide || 1), flat.cz - flat.mb.ax * 30 * (flat.yardSide || 1), 10);
        const [px, pz] = this.at(w, 0, 2.5);
        this.put('flat', px, pz, this.yawOut(w) + Math.PI, { save: true, property: 'flat' });
        const [dx, dz] = this.at(w, 0, 0);
        this.prop('podezd', dx, dz, this.yawOut(w), { b: flat.id, marked: true });
      }
    },

    siteStroyka() {
      const cx = -800, cz = -185;
      const ne = this.nearestEdge(cx, cz, e => e.rank >= 3, 300);
      let ax = ne.dx, az = ne.dz;
      let nx = -az, nz = ax;
      if ((cx - ne.x) * nx + (cz - ne.z) * nz < 0) { nx = -nx; nz = -nz; }
      const ox = ne.x + nx * (ne.e.hw + 6 + 60), oz = ne.z + nz * (ne.e.hw + 6 + 60);
      const poly = this.rectPoly(ox, oz, ax, az, 70, 55);
      for (const b of this.buildings) if (!b.removed && N.pointInPoly(poly, b.cx, b.cz)) this.removeBuilding(b);
      this.clearProps(poly);
      this.fillPoly(poly, GT.DIRT);
      const gate = this.closestSide(poly, ne.x, ne.z);
      this.fenceRing(poly, 2.4, 'concfence', [[gate, this.sideLen(poly, gate) / 2, 12]]);
      const c = (u, v) => [ox + ax * u + nx * v, oz + az * u + nz * v];
      const f = c(-25, 15);
      this.customBuilding(this.rectPoly(f[0], f[1], ax, az, 24, 9), 28, 'frame', { k: 'o', lv: 10 });
      const cr = c(12, 20);
      this.prop('crane', cr[0], cr[1], Math.atan2(ax, -az), { h: 58 });
      this.circle(cr[0], cr[1], 2.2, 58, 'crane');
      const tr = c(30, -10);
      this.prop('trailer', tr[0], tr[1], Math.atan2(ax, -az));
      this.obb(tr[0], tr[1], Math.atan2(ax, -az), 3, 4, 2.8, 'prop');
      for (let i = 0; i < 5; i++) { const s = c(-40 + i * 10, -30); this.prop('slabs', s[0], s[1], Math.atan2(nx, -nz)); this.obb(s[0], s[1], Math.atan2(nx, -nz), 1.5, 3, 1.4, 'prop', { walkRoof: true }); }
      const r = c(10, -22);
      this.addRamp(r[0] - nx * 8, r[1] - nz * 8, nx, nz, 14, 6, 2.6, 'stroyka', 'Стройка «Водного мира»', 500);
      const [gx, gz] = [ne.x + nx * (ne.e.hw + 4), ne.z + nz * (ne.e.hw + 4)];
      this.put('stroyka', ox, oz, 0);
      this.put('stroyka_gate', gx, gz, Math.atan2(-nx, nz));
      this.signs.push({ x: gx + nx * 3, y: 2.8, z: gz + nz * 3, w: 10, h: 1.4, nx: -nx, nz: -nz, text: 'СТРОИТЕЛЬСТВО · ОПАСНАЯ ЗОНА', style: 'road', post: true });
      this.claimPoly(poly, 2);
      this.namedAreas.push({ name: 'Стройка', poly, box: N.polyBounds(poly) });
    },

    sitePort() {
      const [sx, sz, nx, nz] = this.shorePoint(3460, 560);
      const ax = -nz, az = nx;
      const qy = Math.atan2(nx, -nz), qrot = qy - Math.PI / 2;
      this.put('port', sx - nx * 30, sz - nz * 30, qy, { rot: qrot });
      this.put('port_quay', sx - nx * 6, sz - nz * 6, qy, { rot: qrot });
      this.put('port_crane', sx - nx * 14 + ax * 20, sz - nz * 14 + az * 20, qy, { rot: qrot });
      for (let i = -2; i <= 2; i++) {
        const x = sx - nx * 8 + ax * i * 45, z = sz - nz * 8 + az * i * 45;
        if (this.inWater(x, z) || !this.freeAt(x, z, 3)) continue;
        this.prop('crane', x, z, Math.atan2(nx, -nz), { h: 30, portal: true });
        for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) this.circle(x + ax * dx - nx * dz, z + az * dx - nz * dz, 0.5, 8, 'crane');
        this.claim(x - 7, z - 7, x + 7, z + 7);
      }
      this.prop('barge', sx + nx * 16, sz + nz * 16, Math.atan2(ax, -az), { l: 70, w: 14 });
      for (let i = 0; i < 12; i++) {
        const x = sx - nx * (30 + (i % 3) * 5) + ax * (-40 + Math.floor(i / 3) * 16), z = sz - nz * (30 + (i % 3) * 5) + az * (-40 + Math.floor(i / 3) * 16);
        if (!this.freeAt(x, z, 3) || this.surfaceAt(x, z) === 0 && this.isRoadNet(x, z)) continue;
        this.customBuilding(this.rectPoly(x, z, ax, az, 6, 1.25), (i % 4 === 0 ? 5.2 : 2.6), 'containers', { k: 'u', walkRoof: true, c: ['#b83020', '#2050a0', '#d0a020', '#308040'][i % 4] });
      }
      const ne = this.nearestEdge(sx - nx * 40, sz - nz * 40, e => e.rank >= 1 || e.plant, 400);
      if (ne) this.put('port_gate', ne.x, ne.z, Math.atan2(ne.dx, -ne.dz));
      const poly = this.rectPoly(sx - nx * 30, sz - nz * 30, ax, az, 140, 50);
      this.namedAreas.push({ name: 'Речной порт ГАЗ', poly, box: N.polyBounds(poly) });
      this.portPoly = poly;
    },

    runClear(x, z, dx, dz, k0, k1, skip) {
      for (let k = k0; k <= k1; k += 2) {
        if (skip && k > skip[0] && k < skip[1]) continue;
        const px = x + dx * k, pz = z + dz * k;
        if (!this.inPlay(px, pz) || this.inWater(px, pz) || this.surfaceAt(px, pz) === 0 || !this.freeAt(px, pz, 2.6)) return false;
        let hit = false;
        this.hash.query(px - 3, pz - 3, px + 3, pz + 3, it => { if (it.kind !== 'edge') { hit = true; return true; } });
        if (hit) return false;
      }
      return true;
    },

    jumpAt(x, z, fx, fz, id, name, reward, h) {
      const r = this.addRamp(x, z, fx, fz, 12, 6, h || 2.6, id, name, reward);
      this.claimPoly(this.rectPoly(x - fx * 22, z - fz * 22, fx, fz, 16, 4), 0);
      this.claimPoly(this.rectPoly(x + fx * 24, z + fz * 24, fx, fz, 14, 4), 0);
      return r;
    },

    siteJumps() {
      let rail = null;
      for (const r of this.rails) {
        if (r.k !== 'R' && r.k !== 'S') continue;
        const p = r.pts;
        for (let i = 2; i < p.length && !rail; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 30) continue;
          const mx = (ax + bx) / 2, mz = (az + bz) / 2;
          if (!this.inPlay(mx, mz)) continue;
          const nx = -(bz - az) / L, nz = (bx - ax) / L;
          for (const sg of [1, -1]) {
            if (!this.runClear(mx, mz, nx * sg, nz * sg, -34, 48, [-5, 5])) continue;
            const ne = this.nearestEdge(mx + nx * sg * 60, mz + nz * sg * 60, e => !e.plant, 45);
            if (!ne) continue;
            rail = { x: mx + nx * sg * 13, z: mz + nz * sg * 13, fx: -nx * sg, fz: -nz * sg };
            break;
          }
        }
        if (rail) break;
      }
      if (rail) this.jumpAt(rail.x, rail.z, rail.fx, rail.fz, 'rails', 'Над путями', 450, 2.4);
    },

    siteBridge() {
      let best = null;
      const tx = 5010, tz = -1520;
      const ne = this.nearestEdge(tx, tz, e => e.main, 250);
      if (ne) {
        let dx = ne.dx, dz = ne.dz;
        if ((tx - ne.x) * dx + (tz - ne.z) * dz < 0) { dx = -dx; dz = -dz; }
        this.put('myza_bridge', ne.x - dx * 30, ne.z - dz * 30, Math.atan2(dx, -dz));
        this.signs.push({ x: ne.x - dx * 12, y: 2.2, z: ne.z - dz * 12, w: 8, h: 1.5, nx: -dx, nz: -dz, text: 'МОСТ ЗАКРЫТ НА РЕМОНТ', style: 'road', post: true });
        best = ne;
      }
      this.bridgeDecks = best ? [{ x: best.x, z: best.z, dx: best.dx, dz: best.dz, name: 'Мызинский мост' }] : [];
    },

    siteSpots() {
      this.tributeLoop = [[384, -318], [972, -734], [559, -901], [256, -547]];
      this.stashSpots = [
        [-600, 330], [-392, -140], [60, -840], [-1470, -1820], [-1880, 1060], [3320, 700], [1850, -1440], [-560, -1300],
        [-1420, 780], [150, 60], [-2050, 2300], [640, -2500], [-120, 1600], [1150, 1380], [-980, 250], [2600, -420],
        [1250, -2860], [-300, 2250], [4450, -1900], [1330, 2120]
      ];
      this.pickupSpots = [
        ['health', -250, -470], ['health', -950, 780], ['health', 1700, -1450], ['health', 600, 1200], ['health', -1500, 1900],
        ['armor', -1860, 1150], ['armor', 3300, 600], ['armor', 100, -900],
        ['bribe', 400, -700], ['bribe', -1400, -1000], ['bribe', 900, 900], ['bribe', -300, 1800], ['bribe', 2000, -2400],
        ['weapon', -1440, 770, { weapon: 'knuckles', ammo: 1 }], ['weapon', 950, -2300, { weapon: 'knife', ammo: 1 }], ['weapon', -700, -2000, { weapon: 'pm', ammo: 24 }], ['weapon', 3250, 520, { weapon: 'shotgun', ammo: 12 }], ['weapon', -500, 350, { weapon: 'grenade', ammo: 3 }],
        ['weapon', 640, 1230, { weapon: 'toz34', ammo: 8 }], ['weapon', -980, 810, { weapon: 'molotov', ammo: 3 }], ['weapon', 130, -930, { weapon: 'sks', ammo: 20 }], ['weapon', 1880, -1400, { weapon: 'kiparis', ammo: 60 }]
      ];
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
