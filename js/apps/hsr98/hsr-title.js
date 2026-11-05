(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M;
  const LW = 320, LH = 240;
  const hx = G.hash;
  const cl = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sm = t => t * t * (3 - 2 * t);
  const SPEED = 12, DS = 0.5, AHEAD = 8, BEHIND = 360, TIE = 1.3;
  const GAUGE = 0.98, WHEEL = 0.64, ROLL = -0.25;
  const CARS = [{ s: -3.0, half: 1.6, loco: true }, { s: -8.95, half: 2.0 }, { s: -15.5, half: 2.0 }, { s: -22.05, half: 2.0 }];

  function noise3(x, y, z, seed) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const z0 = iz * 131 + seed, z1 = z0 + 131;
    const a = hx(ix, iy, z0), b = hx(ix + 1, iy, z0), c = hx(ix, iy + 1, z0), d = hx(ix + 1, iy + 1, z0);
    const e = hx(ix, iy, z1), f = hx(ix + 1, iy, z1), g = hx(ix, iy + 1, z1), k = hx(ix + 1, iy + 1, z1);
    const ab = a + (b - a) * u, cd = c + (d - c) * u, ef = e + (f - e) * u, gk = g + (k - g) * u;
    const near = ab + (cd - ab) * v, far = ef + (gk - ef) * v;
    return near + (far - near) * w;
  }

  function fbm(x, y, z, oct, seed) {
    let s = 0, a = 1, n = 0, f = 1;
    for (let i = 0; i < oct; i++, a *= 0.5, f *= 2.03) { s += noise3(x * f, y * f, z * f, seed + i * 17) * a; n += a; }
    return s / n;
  }

  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function sphereTex(w, h, fn) {
    const d = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      const lat = (0.5 - (y + 0.5) / h) * Math.PI, cy = Math.cos(lat), sy = Math.sin(lat);
      for (let x = 0; x < w; x++) {
        const lon = (x + 0.5) / w * Math.PI * 2, c = fn(cy * Math.sin(lon), sy, cy * Math.cos(lon)), o = (y * w + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c[3] == null ? 255 : c[3];
      }
    }
    return { w, h, d, wrap: true };
  }

  const SEA = [[10, 24, 58], [30, 62, 116]], ICE = [[116, 152, 198], [214, 230, 248]], ROCK = [84, 88, 108];

  function jariloSurface(x, y, z) {
    const land = fbm(x * 1.9 + 3, y * 1.9, z * 1.9, 5, 11);
    const grain = fbm(x * 9, y * 9, z * 9, 2, 23);
    const tone = fbm(x * 4.5 + 9, y * 4.5, z * 4.5, 3, 31);
    const pole = sm(cl((Math.abs(y) - 0.8 + (grain - 0.5) * 0.3) / 0.1));
    let c;
    if (land < 0.49) {
      const k = cl((land - 0.32) / 0.17);
      c = mixc(SEA[0], SEA[1], k * k);
      if (grain > 0.6 + (0.49 - land) * 1.5) c = mixc(c, ICE[0], 0.4);
    } else {
      const k = cl((land - 0.49) / 0.16);
      c = mixc(ICE[0], ICE[1], 0.3 + 0.7 * k);
      c = mixc(c, ROCK, cl((tone - 0.56) / 0.12) * 0.45 * (1 - k * 0.5));
    }
    c = mixc(c, [240, 246, 252], pole);
    const n = (grain - 0.5) * 22;
    return [c[0] + n, c[1] + n, c[2] + n];
  }

  function jariloClouds(x, y, z) {
    const n = fbm(x * 2.6 + 11, y * 6.5, z * 2.6, 5, 47), sw = fbm(x * 5, y * 5, z * 5, 3, 53);
    const a = sm(cl((n + (sw - 0.5) * 0.3 - 0.57) / 0.12));
    return [255, 255, 255, Math.round(a * 230)];
  }

  function globe(tex, su, sv) {
    const m = R3.mesh(), row = su + 1;
    for (let j = 0; j <= sv; j++) {
      const phi = -Math.PI / 2 + j / sv * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi);
      for (let i = 0; i <= su; i++) {
        const th = i / su * Math.PI * 2, x = cp * Math.sin(th), z = cp * Math.cos(th);
        R3.vert(m, x, sp, z, x, sp, z);
      }
    }
    const U = i => i / su * tex.w, V = j => 0.5 + (1 - j / sv) * (tex.h - 1);
    const fo = { sm: true, tex };
    for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) {
      const a = j * row + i, b = a + 1, c = a + row + 1, d = a + row;
      if (j > 0) R3.face(m, a, b, c, '#ffffff', fo, [U(i), V(j), U(i + 1), V(j), U(i + 1), V(j + 1)]);
      if (j < sv - 1) R3.face(m, a, c, d, '#ffffff', fo, [U(i), V(j), U(i + 1), V(j + 1), U(i), V(j + 1)]);
    }
    return m;
  }

  function rock(seed) {
    const m = R3.mesh();
    R3.ell(m, 0, 0, 0, 1, 0.78, 0.9, 7, 5, '#ffffff', { sm: false });
    for (let k = 0; k < m.v.length; k += 3) {
      const x = m.v[k], y = m.v[k + 1], z = m.v[k + 2];
      const j = 0.72 + 0.5 * hx(Math.round(x * 97) + seed * 7, Math.round(y * 89), Math.round(z * 83) + seed);
      m.v[k] = x * j; m.v[k + 1] = y * j; m.v[k + 2] = z * j;
    }
    return m;
  }

  function dirOf(yaw, pitch) { return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]; }
  const yawAt = s => (s > 0 ? 0.008 * s : -0.45 * (1 - Math.exp(s / 40)));
  const PITCH = 0.16;

  function buildPath() {
    const n = Math.round((AHEAD + BEHIND) / DS) + 1, pts = new Array(n), i0 = Math.round(BEHIND / DS);
    pts[i0] = [0, 0, 0];
    for (let i = i0 + 1; i < n; i++) {
      const s = (i - i0) * DS - DS / 2, d = dirOf(yawAt(s), PITCH), p = pts[i - 1];
      pts[i] = [p[0] + d[0] * DS, p[1] + d[1] * DS, p[2] + d[2] * DS];
    }
    for (let i = i0 - 1; i >= 0; i--) {
      const s = (i - i0) * DS + DS / 2, d = dirOf(yawAt(s), PITCH), p = pts[i + 1];
      pts[i] = [p[0] - d[0] * DS, p[1] - d[1] * DS, p[2] - d[2] * DS];
    }
    return pts;
  }

  let S = null;
  function scene() {
    if (S) return S;
    const path = buildPath();
    const at = s => {
      const f = cl((s + BEHIND) / (AHEAD + BEHIND)) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), k = f - i, a = path[i], b = path[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    };
    const frame = (s, half) => {
      const a = at(s + half), b = at(s - half);
      let f = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const fl = Math.hypot(f[0], f[1], f[2]); f = [f[0] / fl, f[1] / fl, f[2] / fl];
      let r = [f[2], 0, -f[0]];
      const rl = Math.hypot(r[0], r[1], r[2]); r = [r[0] / rl, r[1] / rl, r[2] / rl];
      const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
      return { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], f, r, u };
    };
    const rails = [];
    for (let s = AHEAD - 2; s > -BEHIND + 1; s -= s > -40 ? 1 : s > -140 ? 3 : 6) {
      const F = frame(s, 0.5);
      rails.push({ s, l: F.p.map((v, k) => v - F.r[k] * GAUGE), c: F.p, rr: F.p.map((v, k) => v + F.r[k] * GAUGE) });
    }
    const tg = at(-5), az = 0.75, el = 0.12, dist = 33, fov = 40;
    const look = [tg[0], tg[1] + 1.2, tg[2]];
    const cam = { look, az, el, dist, fov };
    const eyeOf = (a, e) => [look[0] - dist * Math.cos(e) * Math.cos(a), look[1] + dist * Math.sin(e), look[2] + dist * Math.cos(e) * Math.sin(a)];
    const ref = new R3.Raster(LW, LH);
    ref.look(eyeOf(az, el), look, fov, ROLL);
    const place = (sx, sy, depth) => {
      const vx = (sx - ref.cx) * depth / ref.fl, vy = (ref.cy - sy) * depth / ref.fl;
      return [0, 1, 2].map(k => ref.eye[k] + ref.fw[k] * depth + ref.rt[k] * vx + ref.up[k] * vy);
    };
    const PD = 900, toWorld = v => [0, 1, 2].map(k => ref.rt[k] * v[0] + ref.up[k] * v[1] + ref.fw[k] * v[2]);
    const sp = place(204, 44, 110), sx = toWorld([Math.cos(0.3), Math.sin(0.3), 0]), sy = toWorld([-Math.sin(0.3) * 0.8, Math.cos(0.3) * 0.8, -0.6]);
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const unit = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    const basis = (x, y, p) => { const z = cross(x, y); return [x[0], y[0], z[0], p[0], x[1], y[1], z[1], p[1], x[2], y[2], z[2], p[2]]; };
    const pa = unit(toWorld([-0.45, 0.45, -0.77])), px0 = unit(cross(pa, toWorld([0, 0, 1])));
    S = {
      psun: toWorld([-0.45, 0.55, -0.35]), tsun: toWorld([-0.2, 0.7, -0.6]),
      at, frame, rails, cam, eyeOf,
      planet: { p: place(40, 250, PD), r: 150 * PD / ref.fl, axis: basis(px0, pa, [0, 0, 0]) },
      station: basis(sx, sy, sp),
      comet: [[place(336, 146, 1600), place(236, 214, 1600)], [place(178, -6, 1600), place(136, 34, 1600)], [place(330, 176, 1600), place(262, 226, 1600)]],
      nebula: [[place(250, 60, 2000), 700, '#3a2470'], [place(40, 210, 2000), 620, '#14305c'], [place(300, 190, 2000), 520, '#40205a']],
      surface: sphereTex(512, 256, jariloSurface),
      clouds: sphereTex(512, 256, jariloClouds),
      rocks: [0, 1, 2, 3, 4].map(rock),
      stars: Array.from({ length: 520 }, (_, i) => {
        const z = hx(i, 1, 61) * 2 - 1, a = hx(i, 2, 61) * Math.PI * 2, q = Math.sqrt(1 - z * z);
        return [q * Math.cos(a), z, q * Math.sin(a), hx(i, 3, 61)];
      })
    };
    S.stationMesh = buildStation();
    S.globe = globe(S.surface, 36, 20);
    S.cloudGlobe = globe(S.clouds, 36, 20);
    return S;
  }

  function carMatrix(Sc, c, t, i) {
    const F = Sc.frame(c.s, c.half), bob = Math.sin(t * 5.3 + i * 1.7) * 0.025;
    const o = [0, 1, 2].map(k => F.p[k] + F.u[k] * (WHEEL + bob));
    return [F.r[0], F.u[0], F.f[0], o[0], F.r[1], F.u[1], F.f[1], o[1], F.r[2], F.u[2], F.f[2], o[2]];
  }

  function lampAt(Sc, t) { return M.pt(carMatrix(Sc, CARS[0], t, 0), 0, 1.25, 2.62); }

  function drawStars(R, Sc, t) {
    const px = R.px, w = R.w, h = R.h, Rt = R.rt, U = R.up, F = R.fw;
    for (let i = 0; i < Sc.stars.length; i++) {
      const s = Sc.stars[i], vz = s[0] * F[0] + s[1] * F[1] + s[2] * F[2];
      if (vz < 0.2) continue;
      const x = Math.floor(R.cx + R.fl * (s[0] * Rt[0] + s[1] * Rt[1] + s[2] * Rt[2]) / vz), y = Math.floor(R.cy - R.fl * (s[0] * U[0] + s[1] * U[1] + s[2] * U[2]) / vz);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + s[3] * 2.4) + i), k = (0.25 + 0.75 * s[3] * s[3]) * tw * 255, o = (y * w + x) * 4;
      px[o] += k * 0.82; px[o + 1] += k * 0.88; px[o + 2] += k;
      if (s[3] > 0.93 && x + 1 < w) { px[o + 4] += k * 0.3; px[o + 6] += k * 0.35; }
    }
  }

  function drawPlanet(R, Sc, t) {
    const P = Sc.planet, spin = t * 0.012;
    R.glow(P.p, P.r * 1.5, '#16306a', { a: 0.9, depth: false });
    R.glow(P.p, P.r * 1.16, '#5a90d8', { a: 0.55, depth: false });
    R.light({ amb: [0.03, 0.05, 0.1], dir: Sc.psun, sun: [0.92, 0.94, 0.98] });
    const base = M.of(M.t(P.p[0], P.p[1], P.p[2]), P.axis);
    R.draw(Sc.globe, M.of(base, M.ry(spin), M.s(P.r)));
    R.draw(Sc.cloudGlobe, M.of(base, M.ry(spin * 1.6 + 1.2), M.s(P.r * 1.015)), { mode: 'alpha', alpha: 0.6 });
    const v = R.view(P.p);
    if (v[2] <= 0) return;
    const k = R.fl / v[2], cx = R.cx + v[0] * k, cy = R.cy - v[1] * k, rad = P.r * k;
    const L = Sc.psun, sx = L[0] * R.rt[0] + L[1] * R.rt[1] + L[2] * R.rt[2], sy = L[0] * R.up[0] + L[1] * R.up[1] + L[2] * R.up[2], sl = Math.hypot(sx, sy) || 1;
    rim(R, cx, cy, rad, sx / sl, -sy / sl);
  }

  function rim(R, cx, cy, rad, dx, dy) {
    const px = R.px, w = R.w, h = R.h, r0 = rad - 2.5, r1 = rad + 3.5;
    const x0 = Math.max(0, Math.floor(cx - r1)), x1 = Math.min(w - 1, Math.ceil(cx + r1)), y0 = Math.max(0, Math.floor(cy - r1)), y1 = Math.min(h - 1, Math.ceil(cy + r1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ex = x + 0.5 - cx, ey = y + 0.5 - cy, d = Math.hypot(ex, ey);
      if (d < r0 || d > r1) continue;
      const lit = cl(((ex * dx + ey * dy) / d + 0.25) / 1.1), band = 1 - Math.abs(d - rad) / 3.2;
      if (band <= 0 || lit <= 0) continue;
      const k = band * band * lit, o = (y * w + x) * 4;
      px[o] += 150 * k; px[o + 1] += 205 * k; px[o + 2] += 255 * k;
    }
  }

  function buildStation() {
    const m = R3.mesh(), n = 24, ri = 5.0, ro = 6.4, hh = 0.32;
    const P = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a)];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      R3.quad(m, [...P(ri, a0, hh), ...P(ro, a0, hh), ...P(ro, a1, hh), ...P(ri, a1, hh)], '#c4c8d6');
      R3.quad(m, [...P(ri, a1, -hh), ...P(ro, a1, -hh), ...P(ro, a0, -hh), ...P(ri, a0, -hh)], '#3e4256');
      R3.quad(m, [...P(ro, a0, -hh), ...P(ro, a1, -hh), ...P(ro, a1, hh), ...P(ro, a0, hh)], '#8a90a6');
      R3.quad(m, [...P(ri, a1, -hh), ...P(ri, a0, -hh), ...P(ri, a0, hh), ...P(ri, a1, hh)], '#5a6076');
      if (i % 3 === 1) R3.quad(m, [...P(ro + 0.02, a0 + 0.06, -0.08), ...P(ro + 0.02, a1 - 0.06, -0.08), ...P(ro + 0.02, a1 - 0.06, 0.1), ...P(ro + 0.02, a0 + 0.06, 0.1)], '#ffd890', { emit: 1 });
    }
    for (let i = 0; i < 6; i++) { const sp = R3.mesh(); R3.box(sp, 3, 0, 0, 6, 0.18, 0.18, '#767c94'); R3.merge(m, sp, M.ry(i / 6 * Math.PI * 2 + 0.26)); }
    R3.cyl(m, 0, -1.4, 0, 1.0, 0.6, 9.6, 8, '#d0d4e2', { sm: false, emit: 0.18, capCol: '#8a90a4' });
    R3.cyl(m, 0, -4.2, 0, 0.2, 0.62, 2.8, 6, '#7a8098', { sm: false });
    R3.ell(m, 0, 8.4, 0, 1.3, 0.55, 1.3, 8, 4, '#e0b860', { sm: false, emit: 0.2 });
    R3.cyl(m, 0, 8.8, 0, 0.12, 0.02, 1.6, 5, '#e0b860', { sm: false });
    for (let k = 0; k < 5; k++) R3.box(m, 0, 0.4 + k * 1.5, 0.84 - k * 0.055, 0.34, 0.14, 0.05, '#ffd890', { emit: 1 });
    return m;
  }

  function drawStation(R, Sc, t) {
    R.light({ amb: [0.3, 0.3, 0.42], dir: Sc.tsun, sun: [0.9, 0.86, 0.78] });
    R.draw(Sc.stationMesh, M.of(Sc.station, M.ry(t * 0.05)));
    R.glow(M.pt(Sc.station, 0, 10.5, 0), 0.6, '#ffd890', { shape: 'star', a: 0.5 + 0.5 * Math.sin(t * 2.6), depth: false, min: 1.2 });
  }

  function drawRocks(R, Sc, t) {
    const N = Sc.at(0), L = 150;
    R.fog = { near: 60, far: 160, col: [16, 16, 44], max: 0.5 };
    for (let i = 0; i < 30; i++) {
      const far = hx(i, 1, 71);
      const x = 10 + far * 70 + hx(i, 5, 71) * 8, y = -26 + hx(i, 2, 71) * 30, z = 40 - (((hx(i, 3, 71) * L + t * SPEED) % L) + L) % L;
      const sz = 0.35 + hx(i, 4, 71) * (0.8 + far * 2.8), spin = t * (0.2 + hx(i, 6, 71) * 0.6);
      const mat = M.of(M.t(N[0] + x, N[1] + y, N[2] + z), M.ry(spin + i), M.rx(spin * 0.7 + i * 2), M.s(sz));
      R.draw(Sc.rocks[i % Sc.rocks.length], mat, { tint: i % 4 ? '#8a80a4' : '#72688e' });
    }
    R.fog = null;
  }

  function drawRails(R, Sc, t) {
    const rs = Sc.rails;
    for (let i = 0; i < rs.length - 1; i++) {
      const a = rs[i], b = rs[i + 1], fade = cl(1 - (-a.s) / BEHIND) * cl((AHEAD - 2 - a.s) / 6), glow = fade * fade;
      R.streak(a.c, b.c, 1.9, [70 * glow, 40 * glow, 150 * glow], null, { world: true, a: 0.32 });
      R.streak(a.l, b.l, 0.07, [255 * fade, 214 * fade, 140 * fade], null, { world: true });
      R.streak(a.rr, b.rr, 0.07, [255 * fade, 214 * fade, 140 * fade], null, { world: true });
    }
    const off = (t * SPEED) % TIE;
    for (let k = 0; k < 90; k++) {
      const s = AHEAD - 4 - k * TIE - off;
      const F = Sc.frame(s, 0.3), fade = cl(1 + s / 110) * cl((AHEAD - 4 - s) / 4);
      if (fade <= 0) continue;
      const l = F.p.map((v, j) => v - F.r[j] * (GAUGE + 0.2)), r = F.p.map((v, j) => v + F.r[j] * (GAUGE + 0.2));
      R.streak(l, r, 0.1, [200 * fade, 150 * fade, 255 * fade], null, { world: true, a: 0.45 });
    }
  }

  function drawDust(R, Sc, t) {
    for (let i = 0; i < 70; i++) {
      const life = 1.1 + hx(i, 1, 81) * 1.2, ph = ((t / life + hx(i, 2, 81)) % 1 + 1) % 1;
      const s0 = -hx(i, 3, 81) * 24, s = s0 - ph * SPEED * life * 0.55;
      const F = Sc.frame(s, 0.3), side = hx(i, 4, 81) < 0.5 ? -1 : 1, spread = ph * (0.6 + hx(i, 5, 81) * 1.6);
      const p = [0, 1, 2].map(k => F.p[k] + F.r[k] * side * (GAUGE + spread) + F.u[k] * (0.1 + (hx(i, 6, 81) - 0.4) * spread));
      const fade = (1 - ph) * cl(ph * 8);
      R.glow(p, 0.05, i % 3 ? '#ffe2a0' : '#c49cff', { shape: 'star', a: fade, min: 1 });
    }
  }

  function drawTrain(R, Sc, t) {
    const Mo = H.WarpKit.mod(), mid = Sc.frame(-12, 1);
    R.light({ amb: [0.26, 0.26, 0.4], dir: Sc.tsun, sun: [1.0, 0.94, 0.84], pts: [{ p: mid.p.map((v, k) => v - mid.u[k] * 0.6), c: [0.5, 0.36, 0.95], r: 16 }] });
    CARS.forEach((c, i) => R.draw(c.loco ? Mo.loco : Mo.car, carMatrix(Sc, c, t, i)));
    const L = carMatrix(Sc, CARS[0], t, 0), lamp = lampAt(Sc, t), fwd = [L[2], L[6], L[10]];
    const beam = lamp.map((v, k) => v + fwd[k] * 9);
    R.streak(lamp, beam, 0.7, [120, 170, 240], [0, 0, 0], { world: true, a: 0.4, depth: false });
    R.glow(lamp, 1.1, '#9ccfff', { a: 0.8, depth: false });
    R.glow(lamp, 0.55, '#ffffff', { shape: 'star', a: 0.9 + 0.1 * Math.sin(t * 7), depth: false, min: 2 });
  }

  function drawComet(R, Sc, t) {
    const per = 13, n = Sc.comet.length, ph = ((t % per) + per) % per / 1.4;
    if (ph >= 1) return;
    const [a, b] = Sc.comet[((Math.floor(t / per) % n) + n) % n];
    const at = k => a.map((v, i) => v + (b[i] - v) * k), f = Math.sin(ph * Math.PI);
    R.streak(at(Math.max(0, ph - 0.25)), at(ph), 1.2, [0, 0, 0], [200 * f, 220 * f, 255 * f], { depth: false });
    R.glow(at(ph), 3, '#e8f4ff', { shape: 'star', a: f, depth: false, min: 1.5 });
  }

  function render(R, t) {
    const Sc = scene();
    R.snap = false;
    const C = Sc.cam, sway = Math.sin(t * 0.19), lift = Math.sin(t * 0.13 + 1);
    R.look(Sc.eyeOf(C.az + sway * 0.06, C.el + lift * 0.025), C.look, C.fov, ROLL + 0.03 * Math.sin(t * 0.23));
    R.clear('#03040f', '#1a1440', '#0a0f2c');
    for (const [p, r, col] of Sc.nebula) R.glow(p, r, col, { shape: 'puff', a: 0.55, depth: false });
    drawStars(R, Sc, t);
    drawComet(R, Sc, t);
    drawPlanet(R, Sc, t);
    drawStation(R, Sc, t);
    R.light({ amb: [0.22, 0.2, 0.34], dir: Sc.tsun, sun: [0.95, 0.9, 0.8] });
    drawRocks(R, Sc, t);
    drawTrain(R, Sc, t);
    drawRails(R, Sc, t);
    drawDust(R, Sc, t);
  }

  let raster = null, rasterW = null;
  function draw(ctx, w, h, t, x = 0) {
    const rw = w > h * 1.5 ? 427 : LW;
    const r = rw === LW ? (raster || (raster = new R3.Raster(LW, LH))) : (rasterW || (rasterW = new R3.Raster(427, LH)));
    render(r, t);
    r.finish(ctx, x, 0, w, h);
  }

  H.TitleScene = { draw, render, scene, CARS, lamp: t => lampAt(scene(), t) };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
