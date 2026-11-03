(function () {
  const { M4, V3, rgb, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const Art = window.VazArt;

  const KID_D = { chestY: 0.06, neckY: 0.22, headY: 0.15, shX: 0.1, shY: 0.19, upper: 0.155, fore: 0.145, hipX: 0.06, hipY: -0.04, thigh: 0.22, shin: 0.22 };
  const KID_HEAD = { rx: 0.152, ry: 0.15, rz: 0.146, chin: 0.03, chinFwd: 0.015, jowl: 0, crown: 0 };

  const LOOKS = {
    hugh: {
      D: { chestY: 0.11, neckY: 0.48, headY: 0.27, shX: 0.16, shY: 0.43, upper: 0.33, fore: 0.31, hipX: 0.08, hipY: -0.06, thigh: 0.46, shin: 0.45 },
      head: { rx: 0.124, ry: 0.16, rz: 0.135, chin: 0.072, chinFwd: 0.03, jowl: 0.05, crown: 0 },
      skin: 0xf3cba8, lid: '#eec29e', hand: 1.18,
      eyes: { yaw: 0.42, pit: 0.2, p0: -0.25, p1: 0.7, rx: 0.05, ry: 0.075, pupil: 0.45, line: '#5a3222', iris: '#4a3020', brow: '#4a2c18', browW: 0.05 },
      mouth: { pit: -0.82, p0: -1.35, p1: -0.3, w: 0.2, h: 0.13, inside: '#5a1818', tongue: '#c25560', line: '#8a4632' },
      hair: 0x6e4526, nose: 'long', glasses: true
    },
    sam: {
      D: { chestY: 0.12, neckY: 0.34, headY: 0.25, shX: 0.27, shY: 0.3, upper: 0.28, fore: 0.26, hipX: 0.13, hipY: -0.06, thigh: 0.34, shin: 0.34 },
      head: { rx: 0.25, ry: 0.24, rz: 0.225, chin: 0.03, chinFwd: 0.01, jowl: 0.16, crown: 0 },
      skin: 0xe2b384, lid: '#d9a978', hand: 1.25,
      eyes: { yaw: 0.34, pit: 0.2, p0: -0.2, p1: 0.65, rx: 0.085, ry: 0.13, pupil: 0.36, line: '#5a3a22', iris: '#3a72c8', brow: '#5a3a26', browW: 0.075 },
      mouth: { pit: -0.45, p0: -1.1, p1: 0.0, w: 0.22, h: 0.16, inside: '#4a1414', tongue: '#c8606a', line: '#6a4a3a' },
      nose: 'ball'
    },
    cindy: {
      D: KID_D,
      head: KID_HEAD,
      skin: 0xf7d7c2, lid: '#f0cbb4', hand: 0.82,
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#5a3a30', iris: '#3f8f52', brow: '#c9a45a', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.17, h: 0.12, inside: '#6a1e24', tongue: '#e0707a', line: '#a0524a' },
      nose: 'small'
    },
    libby: {
      D: KID_D,
      head: Object.assign({}, KID_HEAD, { rx: 0.155 }),
      skin: 0x7a4a2c, lid: '#6c4026', hand: 0.82,
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#2a160c', iris: '#5a3418', brow: '#1a0e0a', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.18, h: 0.13, inside: '#3a0e10', tongue: '#c05a60', line: '#3a1e14' },
      nose: 'small'
    },
    nick: {
      D: Object.assign({}, KID_D, { neckY: 0.25, thigh: 0.25, shin: 0.25, shX: 0.11, upper: 0.17, fore: 0.16 }),
      head: Object.assign({}, KID_HEAD, { rx: 0.14, ry: 0.15, rz: 0.14, chin: 0.04 }),
      skin: 0xe9bb94, lid: '#ddae86', hand: 0.85,
      eyes: { yaw: 0.31, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.085, ry: 0.13, pupil: 0.4, line: '#4a2a1c', iris: '#6a4426', brow: '#1a1416', browW: 0.05 },
      mouth: { pit: -0.52, p0: -1.15, p1: -0.1, w: 0.15, h: 0.11, inside: '#5a1a1c', tongue: '#c86a70', line: '#8a5040' },
      nose: 'small'
    },
    carl: {
      D: Object.assign({}, KID_D, { shX: 0.12, hipX: 0.075 }),
      head: Object.assign({}, KID_HEAD, { rx: 0.162, ry: 0.148, rz: 0.15, chin: 0.02, jowl: 0.12 }),
      skin: 0xf6cdb0, lid: '#eebfa0', hand: 0.85,
      eyes: { yaw: 0.36, pit: 0.13, p0: -0.3, p1: 0.62, rx: 0.085, ry: 0.13, pupil: 0.4, line: '#6a4030', iris: '#4a7ab0', brow: '#b8582c', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.17, h: 0.12, inside: '#6a1e24', tongue: '#e0707a', line: '#a0524a' },
      nose: 'button'
    },
    betty: {
      D: KID_D,
      head: KID_HEAD,
      skin: 0xf6d8c4, lid: '#efcab2', hand: 0.82,
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#5a3a30', iris: '#3d78c0', brow: '#c8a058', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.17, h: 0.12, inside: '#6a1e24', tongue: '#e0707a', line: '#a0524a' },
      nose: 'small'
    },
    kidA: { D: KID_D, head: KID_HEAD, skin: 0xf0c8a8, lid: '#e8bc9a', hand: 0.82, kid: 0x5a3a24, shirt: 0x3a4a7a, nose: 'small',
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#4a2a20', iris: '#5a4030', brow: '#4a2a18', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.16, h: 0.11, inside: '#5a1a1c', tongue: '#c86a70', line: '#8a5040' } },
    kidB: { D: KID_D, head: KID_HEAD, skin: 0xf5d2b6, lid: '#ecc6a8', hand: 0.82, kid: 0xd8b060, shirt: 0x8a3a3a, nose: 'small',
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#4a2a20', iris: '#3a6aa0', brow: '#b08a40', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.16, h: 0.11, inside: '#5a1a1c', tongue: '#c86a70', line: '#8a5040' } },
    kidC: { D: KID_D, head: KID_HEAD, skin: 0xa8704a, lid: '#9a6440', hand: 0.82, kid: 0x221814, shirt: 0x2f6a4a, nose: 'small',
      eyes: { yaw: 0.33, pit: 0.12, p0: -0.3, p1: 0.62, rx: 0.1, ry: 0.17, pupil: 0.36, line: '#2a160c', iris: '#4a2a14', brow: '#1a0e0a', browW: 0.04 },
      mouth: { pit: -0.5, p0: -1.15, p1: -0.1, w: 0.16, h: 0.11, inside: '#3a0e10', tongue: '#c05a60', line: '#3a1e14' } }
  };

  const HUGH = { jacket: 0x1d1b20, jacketHi: 0x2e2c33, pants: 0x19181c, shirt: 0xf2f0ec, tie: 0x141216, shoe: 0xeeece6, sole: 0x2a2626 };

  function headPt(H, yaw, pit) {
    const cp = C(pit), sp = S(pit);
    const n = [S(yaw) * cp, sp, C(yaw) * cp];
    let x = n[0] * H.rx, y = n[1] * H.ry, z = n[2] * H.rz;
    if (n[1] < 0) {
      const d = -n[1];
      const front = clamp(n[2] * 0.6 + 0.4, 0, 1);
      y -= H.chin * d * d * front;
      z += H.chinFwd * d * front * front;
      x *= 1 + H.jowl * d * (1 - d * 0.5);
    }
    return [x, y, z];
  }

  function headNrm(H, yaw, pit) {
    const e = 0.01;
    const a = headPt(H, yaw - e, pit), b = headPt(H, yaw + e, pit);
    const c = headPt(H, yaw, pit - e), d = headPt(H, yaw, Math.min(PI / 2, pit + e));
    let n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, c)));
    const p = headPt(H, yaw, pit);
    if (V3.dot(n, p) < 0) n = V3.mul(n, -1);
    return V3.len(n) > 0.5 ? n : V3.norm(p);
  }

  function surf(b, H, y0, y1, p0, p1, nu, nv, col, lift, uv, pitchAt) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u;
      const lo = pitchAt ? pitchAt(yaw) : p0;
      const pit = lo + (p1 - lo) * v;
      const p = headPt(H, yaw, pit), n = headNrm(H, yaw, pit);
      const l = typeof lift === 'function' ? lift(yaw, pit) : lift;
      return { p: V3.add(p, V3.mul(n, l)), n };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        const cols = typeof col === 'function' ? [col(u0, v0), col(u1, v0), col(u1, v1), col(u0, v1)].map(x => rgb(x)) : col;
        b.quad(a.p, bb.p, c.p, d.p, cols, uv ? [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  function buildHead(b, L) {
    const H = L.head;
    const base = rgb(L.skin);
    surf(b, H, -PI, PI, -PI / 2 + 0.001, PI / 2 - 0.001, 20, 14, (u, v) => {
      const k = 0.86 + 0.16 * v;
      return [base[0] * k, base[1] * k, base[2] * k, 0];
    }, 0, false);
    [-1, 1].forEach(s => {
      const p = headPt(H, s * PI / 2, 0.02);
      b.at(p[0] + s * 0.008, p[1], p[2] - 0.005, h => h.ellipsoid(0.016, 0.03, 0.022, 7, 5, shade(L.skin, 0.92)));
    });
    const nose = L.nose;
    if (nose === 'long') {
      const q = H.rx / 0.1;
      const root = headPt(H, 0, 0.06);
      const tip = V3.add(root, [0, -0.045 * q, 0.12 * q]);
      K.tube(b, [V3.add(root, [0, 0.01 * q, -0.03 * q]), V3.lerp(root, tip, 0.45), tip], [0.03 * q, 0.034 * q, 0.042 * q], 10, shade(L.skin, 0.98));
      b.at(tip[0], tip[1], tip[2], h => h.ellipsoid(0.056 * q, 0.05 * q, 0.054 * q, 12, 8, shade(L.skin, 1.03)));
    } else if (nose === 'ball') {
      const p = headPt(H, 0, -0.08);
      const rr = H.rx * 0.3;
      b.at(p[0], p[1] - 0.005, p[2] + rr * 0.6, h => h.ellipsoid(rr, rr * 0.9, rr * 0.9, 10, 7, shade(L.skin, 0.98)));
    } else if (nose === 'button') {
      const p = headPt(H, 0, -0.14);
      b.at(p[0], p[1], p[2] + 0.012, h => h.ellipsoid(0.026, 0.02, 0.022, 8, 5, shade(L.skin, 1.02)));
    } else {
      const p = headPt(H, 0, -0.14);
      b.at(p[0], p[1], p[2] + 0.008, h => h.ellipsoid(0.018, 0.016, 0.018, 7, 5, shade(L.skin, 1.0)));
    }
  }

  function buildFace(b, L, which) {
    const H = L.head;
    const F = Art.FACE;
    const R = which === 'eyes' ? L.eyes : L.mouth;
    surf(b, H, F.y0, F.y1, R.p0, R.p1, 12, 8, [1, 1, 1, 0], 0.0025, true);
  }

  function hairline(front, side, back) {
    return (yaw) => {
      const a = Math.abs(yaw);
      if (a < PI / 2) return lerp(front, side, Math.pow(a / (PI / 2), 1.6));
      return lerp(side, back, (a - PI / 2) / (PI / 2));
    };
  }

  function hairShell(b, H, col, front, side, back, lift, top) {
    const L = typeof lift === 'number' ? lift : 0.012;
    surf(b, H, -PI, PI, 0, (top || PI / 2) - 0.001, 22, 8, (u, v) => {
      const c = rgb(col);
      const k = 0.82 + 0.3 * v;
      return [c[0] * k, c[1] * k, c[2] * k, 0];
    }, (yaw, pit) => L * (0.6 + 0.4 * S(Math.max(0, pit))), false, hairline(front, side, back));
  }

  function quiff(b, sections, col, sides) {
    const n = sides || 14;
    const pts = sections.map(([z, cy, rx, ry]) => {
      const ringPts = [];
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * PI * 2;
        ringPts.push([C(a) * rx, cy + S(a) * ry, z]);
      }
      return ringPts;
    });
    const tone = (p, y0, y1) => {
      const c = rgb(col);
      const k = 0.72 + 0.55 * clamp((p[1] - y0) / (y1 - y0), 0, 1);
      return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k), 0];
    };
    const ys = sections.map(s0 => s0[1] + s0[3]);
    const y0 = Math.min(...sections.map(s0 => s0[1] - s0[3])), y1 = Math.max(...ys);
    for (let j = 0; j < sections.length - 1; j++) {
      for (let i = 0; i < n; i++) {
        const a = pts[j][i], bq = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
        const nr = (p, sec) => V3.norm([p[0] / sec[2], (p[1] - sec[1]) / sec[3], 0.15]);
        const s0 = sections[j], s1 = sections[j + 1];
        b.quad(a, bq, c, d, [tone(a, y0, y1), tone(bq, y0, y1), tone(c, y0, y1), tone(d, y0, y1)], null, [nr(a, s0), nr(bq, s0), nr(c, s1), nr(d, s1)]);
      }
    }
    const last = sections[sections.length - 1];
    const tip = [0, last[1], last[0] + 0.012];
    for (let i = 0; i < n; i++) b.tri(pts[pts.length - 1][i], pts[pts.length - 1][i + 1], tip, tone(tip, y0, y1));
    const first = sections[0];
    const back = [0, first[1], first[0] - 0.01];
    for (let i = 0; i < n; i++) b.tri(pts[0][i + 1], pts[0][i], back, tone(back, y0, y1));
  }

  function buildHughHair(b, L) {
    const H = L.head;
    const col = L.hair;
    hairShell(b, H, col, 0.5, -0.05, -0.75, 0.014);
    const q = H.ry / 0.13;
    quiff(b, [
      [-0.115, 0.06, 0.07, 0.05],
      [-0.08, 0.095, 0.092, 0.075],
      [-0.03, 0.125, 0.1, 0.095],
      [0.02, 0.15, 0.098, 0.105],
      [0.065, 0.168, 0.09, 0.1],
      [0.1, 0.18, 0.074, 0.08],
      [0.125, 0.182, 0.05, 0.05],
      [0.136, 0.176, 0.022, 0.022]
    ].map(a => a.map(v => v * q)), col, 16);
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 1.34, -0.12);
      b.at(p[0] + s * 0.003, p[1], p[2], h => h.box(0.008, 0.06, 0.016, shade(col, 0.85)));
    });
  }

  function buildSamHair(b, L) {
    const H = L.head;
    const grey = 0xa8a6a2;
    const top = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.3) return -0.66;
      return lerp(-0.66, -0.5, clamp((a - 0.3) / 0.6, 0, 1));
    };
    const n = 18, m = 6, y0 = -1.15, y1 = 1.15, lo = -PI / 2 + 0.04;
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u;
      const pit = lo + (top(yaw) - lo) * v;
      const p = headPt(H, yaw, pit), nn = headNrm(H, yaw, pit);
      const thick = (0.006 + 0.012 * (1 - v) * (1 - Math.abs(yaw) / 1.3)) * H.rx / 0.17;
      return { p: V3.add(p, V3.mul(nn, thick)), n: nn };
    };
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < n; i++) {
        const a = pt(i / n, j / m), c = pt((i + 1) / n, j / m), d = pt((i + 1) / n, (j + 1) / m), e = pt(i / n, (j + 1) / m);
        const k = 0.86 + 0.18 * (j / m) + 0.05 * ((i + j) % 2);
        const cc = rgb(grey);
        b.quad(a.p, c.p, d.p, e.p, [cc[0] * k, cc[1] * k, cc[2] * k, 0], null, [a.n, c.n, d.n, e.n]);
      }
    }
    const chin = headPt(H, 0, -1.2);
    b.at(chin[0], chin[1] + 0.01, chin[2] - 0.02, h => h.ellipsoid(H.rx * 0.42, H.ry * 0.2, H.rz * 0.36, 10, 6, shade(grey, 0.95)));
    const mo = [];
    for (let i = 0; i <= 8; i++) {
      const a = -1 + (i / 8) * 2;
      const p = headPt(H, a * 0.62, -0.3 - Math.abs(a) * 0.22);
      mo.push(V3.add(p, [0, 0, 0.014]));
    }
    K.tube(b, mo, mo.map((_, i) => (0.012 + 0.018 * S((i / 8) * PI)) * H.rx / 0.17), 7, 0xa8a49c);
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 1.5, 0.28);
      b.at(p[0], p[1], p[2], h => h.ellipsoid(0.03, 0.035, 0.035, 6, 4, grey));
    });
    [-0.25, 0.05, 0.3].forEach((yaw, i) => {
      const pts = [0.95, 1.2, 1.42].map(pit => {
        const p = headPt(H, yaw + i * 0.05, pit);
        return V3.add(p, V3.mul(headNrm(H, yaw, pit), 0.008));
      });
      K.tube(b, pts, [0.006, 0.007, 0.004], 4, 0x6a625c);
    });
  }

  function buildCindyHair(b, L) {
    const H = L.head, col = 0xf0d68c;
    hairShell(b, H, col, 0.5, -0.05, -0.6, 0.016);
    b.at(0, H.ry * 0.82, -H.rz * 0.5, h => h.ellipsoid(0.085, 0.07, 0.085, 10, 7, shade(col, 1.04)));
    b.at(0, H.ry * 0.86, -H.rz * 0.5, h => h.prism(10, 0.05, 0.05, 0.01, 0.05, 0.05, 0.05, 0xf4f4f0));
    const tail = [[0, H.ry * 0.95, -H.rz * 0.55], [0, H.ry * 1.15, -H.rz * 0.85], [0, H.ry * 1.0, -H.rz * 1.25], [0, H.ry * 0.6, -H.rz * 1.45]];
    K.tube(b, tail, [0.055, 0.075, 0.065, 0.02], 9, col);
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 0.75, 0.55);
      b.at(p[0], p[1], p[2], h => h.ellipsoid(0.055, 0.04, 0.045, 8, 5, shade(col, 1.05)));
    });
  }

  function buildLibbyHair(b, L) {
    const H = L.head, col = 0x1c1412;
    hairShell(b, H, col, 0.5, -0.1, -0.5, 0.016);
    b.at(0, H.ry * 0.55, -H.rz * 0.85, h => h.ellipsoid(0.12, 0.1, 0.1, 12, 8, col));
    const band = [];
    for (let i = 0; i <= 12; i++) {
      const pit = 0.1 + (i / 12) * (PI - 0.2);
      const yaw = pit < PI / 2 ? PI / 2 : -PI / 2;
      const pp = pit < PI / 2 ? pit : PI - pit;
      const p = headPt(H, yaw, pp);
      const q = [p[0] * 1.13, p[1] * 1.13 + 0.005, p[2] * 1.13 + 0.035];
      band.push(q);
    }
    K.tube(b, band, band.map(() => 0.011), 5, 0x2a8a80);
  }

  function buildNickHair(b, L) {
    const H = L.head, col = 0x17131a;
    hairShell(b, H, col, 0.42, -0.1, -0.7, 0.018);
    b.push(M4.translate(-0.02, H.ry * 0.78, H.rz * 0.45), M4.rotZ(0.35), M4.rotX(-0.5));
    b.ellipsoid(0.1, 0.045, 0.075, 10, 6, shade(col, 1.25));
    b.pop();
    b.push(M4.translate(0.05, H.ry * 0.62, H.rz * 0.72), M4.rotZ(-0.8));
    b.ellipsoid(0.07, 0.03, 0.04, 8, 5, shade(col, 1.2));
    b.pop();
  }

  function buildCarlHair(b, L) {
    const H = L.head, col = 0xc5582c;
    hairShell(b, H, col, 0.55, 0.0, -0.55, 0.014);
    for (let i = 0; i < 26; i++) {
      const yaw = -PI + (i / 26) * PI * 2 + (i % 2) * 0.12;
      const pit = 0.25 + (i % 3) * 0.32;
      if (Math.abs(yaw) < 0.45 && pit < 0.5) continue;
      const p = headPt(H, yaw, pit);
      const n = headNrm(H, yaw, pit);
      const q = V3.add(p, V3.mul(n, 0.018));
      b.at(q[0], q[1], q[2], h => h.ellipsoid(0.035, 0.03, 0.035, 6, 4, i % 2 ? col : shade(col, 1.12)));
    }
  }

  function buildBettyHair(b, L) {
    const H = L.head, col = 0xdcb452;
    surf(b, H, -PI, PI, 0, PI / 2 - 0.001, 22, 9, (u, v) => {
      const c = rgb(col);
      const k = 0.8 + 0.32 * v;
      return [c[0] * k, c[1] * k, c[2] * k, 0];
    }, (yaw, pit) => 0.018 + 0.03 * Math.max(0, -pit) * (Math.abs(yaw) > 0.9 ? 1 : 0), false, (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.75) return 0.32;
      if (a < 1.2) return lerp(0.32, -0.75, (a - 0.75) / 0.45);
      return -0.75;
    });
  }

  function buildKidHair(b, L) {
    hairShell(b, L.head, L.kid, 0.5, -0.05, -0.6, 0.018);
  }

  function buildGlasses(b, L, kind) {
    const H = L.head;
    const E = L.eyes;
    const frame = kind === 'sam' ? 0xb8342c : kind === 'carl' ? 0x6a4a3a : 0x2a2224;
    const rw = kind === 'hugh' ? 0.045 : kind === 'sam' ? 0.042 : 0.05;
    const rh = kind === 'hugh' ? 0.03 : kind === 'sam' ? 0.036 : 0.048;
    const centers = [-1, 1].map(s => {
      const p = headPt(H, s * E.yaw, E.pit);
      return V3.add(p, [0, 0, kind === 'hugh' ? 0.03 : 0.022]);
    });
    centers.forEach((c, i) => {
      const s = i ? 1 : -1;
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const a = (k / 16) * PI * 2;
        pts.push([c[0] + C(a) * rw, c[1] + S(a) * rh, c[2] - Math.abs(C(a)) * 0.006 * s * s]);
      }
      K.tube(b, pts, pts.map(() => 0.0045), 4, frame);
      const ear = headPt(H, s * 1.5, 0.08);
      K.tube(b, [[c[0] + s * rw, c[1] + 0.005, c[2] - 0.004], [ear[0] + s * 0.006, ear[1] + 0.01, ear[2] + 0.01]], [0.004, 0.004], 4, frame);
    });
    K.tube(b, [[centers[0][0] + rw * 0.9, centers[0][1] + 0.006, centers[0][2] + 0.003], [0, centers[0][1] + 0.014, centers[0][2] + 0.012], [centers[1][0] - rw * 0.9, centers[1][1] + 0.006, centers[1][2] + 0.003]], [0.004, 0.004, 0.004], 4, frame);
    return centers.map(c => ({ c, rw, rh }));
  }

  function buildLenses(b, lens, col) {
    lens.forEach(({ c, rw, rh }) => {
      for (let k = 0; k < 16; k++) {
        const a0 = (k / 16) * PI * 2, a1 = ((k + 1) / 16) * PI * 2;
        b.tri([c[0], c[1], c[2] + 0.002], [c[0] + C(a0) * rw, c[1] + S(a0) * rh, c[2]], [c[0] + C(a1) * rw, c[1] + S(a1) * rh, c[2]], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
  }

  function buildGlints(b, lens) {
    lens.forEach(({ c, rw, rh }) => {
      b.quad([c[0] - rw * 0.55, c[1] + rh * 0.1, c[2] + 0.004], [c[0] - rw * 0.2, c[1] + rh * 0.55, c[2] + 0.004], [c[0] - rw * 0.05, c[1] + rh * 0.45, c[2] + 0.004], [c[0] - rw * 0.42, c[1] - rh * 0.05, c[2] + 0.004], [1, 1, 1, 1]);
    });
  }

  function torso(b, rings, sides) {
    loft(b, rings, sides || 14, { capBottom: true, capTop: true });
  }

  function frontZ(rings, y) {
    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i], c = rings[i + 1];
      if (y >= a.y && y <= c.y) {
        const k = (y - a.y) / (c.y - a.y);
        return lerp(a.rz + (a.cz || 0), c.rz + (c.cz || 0), k);
      }
    }
    return rings[rings.length - 1].rz;
  }

  function vee(b, rings, yTop, yBot, wTop, col, lift) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const y0 = lerp(yTop, yBot, i / n), y1 = lerp(yTop, yBot, (i + 1) / n);
      const w0 = wTop * (1 - i / n), w1 = wTop * (1 - (i + 1) / n);
      const z0 = frontZ(rings, y0) + lift, z1 = frontZ(rings, y1) + lift;
      b.quad([-w1, y1, z1], [w1, y1, z1], [w0, y0, z0], [-w0, y0, z0], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
  }

  const CHEST = {
    hugh: [ring(-0.02, 0.122, 0.088, 0, HUGH.jacket), ring(0.12, 0.128, 0.092, 0.004, HUGH.jacket), ring(0.27, 0.142, 0.098, 0.006, HUGH.jacketHi), ring(0.37, 0.158, 0.098, 0.002, HUGH.jacketHi), ring(0.43, 0.12, 0.085, 0, HUGH.jacket), ring(0.475, 0.05, 0.05, 0.01, HUGH.shirt)],
    sam: [ring(-0.02, 0.23, 0.2, 0.02, 0xc4ced6), ring(0.1, 0.27, 0.25, 0.04, 0xc4ced6), ring(0.22, 0.28, 0.23, 0.03, 0xd2dae0), ring(0.31, 0.26, 0.18, 0.01, 0xd2dae0), ring(0.36, 0.15, 0.12, 0, 0xc4ced6), ring(0.38, 0.1, 0.1, 0.01, 0xc4ced6)],
    cindy: [ring(-0.02, 0.098, 0.072, 0, 0x7d8f3c), ring(0.12, 0.1, 0.074, 0.004, 0x8a9c46), ring(0.2, 0.108, 0.072, 0.002, 0x8a9c46), ring(0.24, 0.07, 0.06, 0, 0x7d8f3c), ring(0.26, 0.04, 0.04, 0.005, 0xf7d7c2)],
    libby: [ring(-0.02, 0.098, 0.072, 0, 0x2a9a90), ring(0.12, 0.1, 0.074, 0.004, 0x33aca0), ring(0.2, 0.108, 0.072, 0.002, 0x33aca0), ring(0.24, 0.07, 0.06, 0, 0x2a9a90), ring(0.26, 0.04, 0.04, 0.005, 0x7a4a2c)],
    nick: [ring(-0.02, 0.1, 0.074, 0, 0x2c4f8e), ring(0.14, 0.108, 0.078, 0.004, 0x35609e), ring(0.23, 0.12, 0.078, 0.002, 0x35609e), ring(0.27, 0.075, 0.064, 0, 0x2c4f8e), ring(0.29, 0.042, 0.042, 0.005, 0xf2f2f2)],
    carl: [ring(-0.02, 0.128, 0.105, 0.01, 0x9a3c2c), ring(0.1, 0.135, 0.112, 0.016, 0xa8442f), ring(0.2, 0.128, 0.095, 0.008, 0xa8442f), ring(0.24, 0.08, 0.07, 0, 0x9a3c2c), ring(0.26, 0.045, 0.045, 0.005, 0xf6cdb0)],
    betty: [ring(-0.02, 0.098, 0.072, 0, 0x86c8e2), ring(0.12, 0.1, 0.074, 0.004, 0x92d2ea), ring(0.2, 0.108, 0.072, 0.002, 0x92d2ea), ring(0.24, 0.07, 0.06, 0, 0x86c8e2), ring(0.26, 0.05, 0.05, 0.005, 0xf6f4f0)]
  };
  ['kidA', 'kidB', 'kidC'].forEach(k => {
    const c = LOOKS[k].shirt;
    CHEST[k] = [ring(-0.02, 0.1, 0.074, 0, c), ring(0.12, 0.104, 0.076, 0.004, c), ring(0.2, 0.11, 0.074, 0.002, c), ring(0.24, 0.07, 0.06, 0, c), ring(0.26, 0.04, 0.04, 0.005, LOOKS[k].skin)];
  });

  const PELVIS = {
    hugh: [ring(-0.13, 0.105, 0.078, 0, HUGH.pants), ring(-0.07, 0.122, 0.088, 0, HUGH.pants), ring(-0.069, 0.136, 0.098, 0, HUGH.jacket), ring(0.04, 0.13, 0.094, 0, HUGH.jacket), ring(0.12, 0.124, 0.09, 0, HUGH.jacket)],
    sam: [ring(-0.13, 0.19, 0.16, 0, 0x4a4a52), ring(-0.02, 0.22, 0.18, 0.01, 0x4a4a52), ring(0.04, 0.23, 0.19, 0.015, 0x3a2e28), ring(0.07, 0.23, 0.2, 0.02, 0xc4ced6), ring(0.13, 0.23, 0.2, 0.02, 0xc4ced6)],
    cindy: [ring(-0.09, 0.085, 0.066, 0, 0xe0dcd2), ring(0.0, 0.095, 0.07, 0, 0xe0dcd2), ring(0.05, 0.098, 0.072, 0, 0xf7d7c2), ring(0.08, 0.098, 0.072, 0, 0x7d8f3c)],
    libby: [ring(-0.16, 0.15, 0.12, 0.01, 0x2a9a90), ring(-0.05, 0.11, 0.085, 0, 0x33aca0), ring(0.08, 0.098, 0.072, 0, 0x2a9a90)],
    nick: [ring(-0.09, 0.088, 0.068, 0, 0x262c3e), ring(0.0, 0.098, 0.074, 0, 0x262c3e), ring(0.03, 0.1, 0.075, 0, 0xf2f2f2), ring(0.08, 0.1, 0.074, 0, 0x2c4f8e)],
    carl: [ring(-0.09, 0.11, 0.09, 0, 0x6a5440), ring(0.0, 0.124, 0.1, 0.008, 0x6a5440), ring(0.03, 0.128, 0.104, 0.01, 0x9a3c2c), ring(0.08, 0.128, 0.105, 0.01, 0x9a3c2c)],
    betty: [ring(-0.14, 0.14, 0.11, 0.01, 0x7ab8d4), ring(-0.03, 0.105, 0.08, 0, 0x86c8e2), ring(0.08, 0.098, 0.072, 0, 0x86c8e2)]
  };
  ['kidA', 'kidB', 'kidC'].forEach(k => {
    PELVIS[k] = [ring(-0.09, 0.088, 0.068, 0, 0x2e3446), ring(0.0, 0.098, 0.074, 0, 0x2e3446), ring(0.08, 0.1, 0.074, 0, LOOKS[k].shirt)];
  });

  const LIMBS = {
    hugh: { up: [0.042, 0.036, HUGH.jacket], fore: [0.036, 0.03, HUGH.jacket], cuff: HUGH.shirt, thigh: [0.06, 0.047, HUGH.pants], shin: [0.044, 0.04, HUGH.pants], shoe: HUGH.shoe, sole: HUGH.sole, foot: [0.07, 0.065, 0.2] },
    sam: { up: [0.085, 0.07, 0xc4ced6], sleeve: 0.13, upSkin: 0xe2b384, fore: [0.066, 0.052, 0xe2b384], thigh: [0.09, 0.075, 0x4a4a52], shin: [0.07, 0.06, 0x4a4a52], shoe: 0x2a2220, sole: 0x161212, foot: [0.1, 0.08, 0.24] },
    cindy: { up: [0.032, 0.027, 0xf7d7c2], fore: [0.027, 0.023, 0xf7d7c2], thigh: [0.042, 0.035, 0xe0dcd2], shin: [0.032, 0.027, 0xe0dcd2], shinSkin: 0xf7d7c2, shoe: 0xf2f2f2, sole: 0x9a9a9a, foot: [0.06, 0.05, 0.13] },
    libby: { up: [0.032, 0.027, 0x7a4a2c], fore: [0.027, 0.023, 0x7a4a2c], thigh: [0.042, 0.035, 0x7a4a2c], shin: [0.032, 0.027, 0x7a4a2c], shoe: 0xf2f2f2, sole: 0x9a9a9a, foot: [0.06, 0.05, 0.13] },
    nick: { up: [0.04, 0.034, 0x2c4f8e], fore: [0.034, 0.03, 0x2c4f8e], cuff: 0x35609e, thigh: [0.046, 0.038, 0x262c3e], shin: [0.038, 0.034, 0x262c3e], shoe: 0x1c1c22, sole: 0xe8e8e8, foot: [0.065, 0.055, 0.15] },
    carl: { up: [0.045, 0.038, 0x9a3c2c], fore: [0.038, 0.032, 0x9a3c2c], cuff: 0xf6cdb0, thigh: [0.055, 0.045, 0x6a5440], shin: [0.042, 0.036, 0x6a5440], shoe: 0x4a3426, sole: 0x2a1c14, foot: [0.07, 0.055, 0.14] },
    betty: { up: [0.032, 0.027, 0xf6d8c4], fore: [0.027, 0.023, 0xf6d8c4], thigh: [0.042, 0.035, 0xf6d8c4], shin: [0.032, 0.027, 0xf6d8c4], shoe: 0x2a3a6a, sole: 0x1a1a1a, foot: [0.06, 0.05, 0.13] }
  };
  ['kidA', 'kidB', 'kidC'].forEach(k => {
    LIMBS[k] = { up: [0.034, 0.029, LOOKS[k].shirt], fore: [0.028, 0.024, LOOKS[k].skin], thigh: [0.044, 0.036, 0x2e3446], shin: [0.034, 0.03, 0x2e3446], shoe: 0x222226, sole: 0xe0e0e0, foot: [0.06, 0.05, 0.13] };
  });

  function buildChest(b, who) {
    const rings = CHEST[who];
    torso(b, rings, 16);
    const D = LOOKS[who].D;
    if (who === 'hugh') {
      vee(b, rings, 0.47, 0.2, 0.062, HUGH.shirt, 0.003);
      vee(b, rings, 0.45, 0.16, 0.014, HUGH.tie, 0.006);
      b.at(0, 0.445, frontZ(rings, 0.445) + 0.008, h => h.box(0.03, 0.022, 0.012, HUGH.tie));
      [-1, 1].forEach(s => {
        const pts = [[s * 0.065, 0.47, frontZ(rings, 0.47) + 0.004], [s * 0.035, 0.32, frontZ(rings, 0.32) + 0.008], [s * 0.005, 0.18, frontZ(rings, 0.18) + 0.006]];
        K.tube(b, pts, [0.012, 0.016, 0.008], 5, HUGH.jacketHi);
      });
      b.at(0, 0.075, frontZ(rings, 0.075) + 0.004, h => h.ellipsoid(0.012, 0.012, 0.006, 6, 4, 0x3a3a40));
    } else if (who === 'sam') {
      vee(b, rings, 0.38, 0.08, 0.12, 0xf2f0ea, 0.004);
      [-1, 1].forEach(s => b.at(s * 0.09, 0.36, frontZ(rings, 0.36) + 0.004, h => h.box(0.008, 0.06, 0.02, 0xe6ecf2)));
    } else if (who === 'nick') {
      vee(b, rings, 0.29, 0.0, 0.05, 0xf2f2f2, 0.003);
      b.at(0, 0.17, frontZ(rings, 0.17) + 0.012, h => h.ellipsoid(0.012, 0.016, 0.006, 6, 4, 0xd8b040));
      K.tube(b, [[-0.035, 0.29, frontZ(rings, 0.29) + 0.004], [0, 0.18, frontZ(rings, 0.18) + 0.01], [0.035, 0.29, frontZ(rings, 0.29) + 0.004]], [0.003, 0.003, 0.003], 4, 0xd8b040);
    } else if (who === 'betty') {
      [-1, 1].forEach(s => b.at(s * 0.03, 0.245, frontZ(rings, 0.245) + 0.006, h => {
        h.push(M4.rotZ(s * 0.5));
        h.box(0.05, 0.035, 0.01, 0xf8f8f4);
        h.pop();
      }));
    }
    const sr = who === 'hugh' ? 0.046 : D.shX * 0.36;
    [-1, 1].forEach(s => b.at(s * D.shX, D.shY, -0.01, h => h.ellipsoid(sr, sr * 0.92, sr, 9, 6, rings[3].col)));
  }

  function buildPelvis(b, who) {
    torso(b, PELVIS[who], 16);
    if (who === 'hugh') b.at(0, 0.0, 0.096, h => h.box(0.03, 0.05, 0.006, HUGH.jacketHi));
  }

  function buildNeck(b, who) {
    const L = LOOKS[who];
    const r = who === 'hugh' ? 0.034 : who === 'sam' ? 0.09 : 0.035;
    loft(b, [ring(-0.02, r, r, 0, shade(L.skin, 0.85)), ring(1, r * 0.95, r * 0.95, 0, L.skin)], 10, { capTop: true, capBottom: true });
    if (who === 'hugh') loft(b, [ring(-0.02, 0.05, 0.046, 0.006, HUGH.shirt), ring(0.3, 0.044, 0.041, 0.006, HUGH.shirt)], 10, { capTop: false });
  }

  function buildArm(b, who, part) {
    const Lm = LIMBS[who];
    const D = LOOKS[who].D;
    if (part === 'up') {
      if (Lm.sleeve) {
        loft(b, [ring(0.02, Lm.up[0] * 1.05, Lm.up[0] * 1.05, 0, Lm.up[2]), ring(-Lm.sleeve, Lm.up[0], Lm.up[0], 0, Lm.up[2]), ring(-Lm.sleeve - 0.005, Lm.up[1], Lm.up[1], 0, Lm.upSkin), ring(-D.upper, Lm.up[1] * 0.9, Lm.up[1] * 0.9, 0, Lm.upSkin)], 10, { capTop: true, capBottom: true });
        return;
      }
      loft(b, [ring(0.02, Lm.up[0], Lm.up[0], 0, Lm.up[2]), ring(-D.upper, Lm.up[1], Lm.up[1], 0, Lm.up[2])], 10, { capTop: true, capBottom: true });
      return;
    }
    const rings = [ring(0.01, Lm.fore[0], Lm.fore[0], 0, Lm.fore[2]), ring(-D.fore + 0.03, Lm.fore[1], Lm.fore[1], 0, Lm.fore[2])];
    if (Lm.cuff) rings.push(ring(-D.fore + 0.029, Lm.fore[1] * 1.1, Lm.fore[1] * 1.1, 0, Lm.cuff), ring(-D.fore, Lm.fore[1] * 1.05, Lm.fore[1] * 1.05, 0, Lm.cuff));
    else rings.push(ring(-D.fore, Lm.fore[1] * 0.95, Lm.fore[1] * 0.95, 0, Lm.fore[2]));
    loft(b, rings, 10, { capTop: true, capBottom: true });
  }

  function buildLeg(b, who, part) {
    const Lm = LIMBS[who];
    const D = LOOKS[who].D;
    if (part === 'thigh') {
      loft(b, [ring(0.03, Lm.thigh[0], Lm.thigh[0], 0, Lm.thigh[2]), ring(-D.thigh, Lm.thigh[1], Lm.thigh[1], 0, Lm.thigh[2])], 10, { capTop: true, capBottom: true });
      return;
    }
    if (part === 'shin') {
      const rings = [ring(0.02, Lm.shin[0], Lm.shin[0], 0, Lm.shin[2])];
      if (Lm.shinSkin) rings.push(ring(-D.shin * 0.45, Lm.shin[0] * 0.98, Lm.shin[0] * 0.98, 0, Lm.shin[2]), ring(-D.shin * 0.45 - 0.004, Lm.shin[1], Lm.shin[1], 0, Lm.shinSkin), ring(-D.shin, Lm.shin[1] * 0.9, Lm.shin[1] * 0.9, 0, Lm.shinSkin));
      else if (who === 'hugh') rings.push(ring(-D.shin + 0.02, Lm.shin[1] * 1.12, Lm.shin[1] * 1.12, 0, Lm.shin[2]), ring(-D.shin, Lm.shin[1] * 1.14, Lm.shin[1] * 1.14, 0, Lm.shin[2]));
      else rings.push(ring(-D.shin, Lm.shin[1], Lm.shin[1], 0, Lm.shin[2]));
      loft(b, rings, 10, { capTop: true, capBottom: true });
      return;
    }
    const [fw, fh, fl] = Lm.foot;
    b.at(0, -0.035, fl * 0.3, h => {
      h.ellipsoid(fw * 0.5, fh * 0.5, fl * 0.5, 10, 6, Lm.shoe);
      h.at(0, -fh * 0.42, 0, k => k.box(fw * 0.9, fh * 0.2, fl * 0.92, Lm.sole));
      if (who === 'hugh') h.at(0, -fh * 0.55, -fl * 0.36, k => k.box(fw * 0.7, fh * 0.45, fl * 0.2, Lm.sole));
    });
  }

  const SHAPES = {
    open: { f: [[0, 0], [0, 0], [0, 0]], spread: 0.12, thumb: [0.2, 0.1], tDir: 0.6 },
    relax: { f: [[0.45, 0.4], [0.55, 0.45], [0.65, 0.5]], spread: 0.06, thumb: [0.35, 0.2], tDir: 0.5 },
    fist: { f: [[1.55, 1.5], [1.6, 1.5], [1.6, 1.5]], spread: 0.0, thumb: [1.1, 0.5], tDir: 0.3 },
    point: { f: [[0.05, 0.0], [1.6, 1.5], [1.6, 1.5]], spread: 0.0, thumb: [1.0, 0.5], tDir: 0.3 },
    thumb: { f: [[1.55, 1.5], [1.6, 1.5], [1.6, 1.5]], spread: 0.0, thumb: [-0.2, 0.0], tDir: 1.35 },
    gun: { f: [[0.05, 0.0], [1.6, 1.5], [1.6, 1.5]], spread: 0.0, thumb: [-0.25, 0.0], tDir: 1.35 },
    grip: { f: [[1.05, 0.9], [1.1, 0.95], [1.15, 1.0]], spread: 0.0, thumb: [0.7, 0.4], tDir: 0.7 },
    spread: { f: [[-0.1, 0], [-0.1, 0], [-0.1, 0]], spread: 0.28, thumb: [-0.1, 0], tDir: 0.9 },
    snap: { f: [[0.7, 0.6], [0.95, 0.4], [1.4, 1.3]], spread: 0.02, thumb: [0.8, 0.3], tDir: 0.6 },
    flat: { f: [[0.02, 0], [0.02, 0], [0.02, 0]], spread: 0.02, thumb: [0.05, 0], tDir: 0.25 }
  };

  function buildHand(b, who, side, shape) {
    const L = LOOKS[who];
    const sc = L.hand;
    const k = side === 'L' ? 1 : -1;
    const n = [-k, 0, 0];
    const skin = L.skin;
    const SH = SHAPES[shape] || SHAPES.relax;
    b.at(0, -0.045 * sc, 0, h => h.ellipsoid(0.02 * sc, 0.042 * sc, 0.04 * sc, 9, 6, skin));
    const curl = (a) => [n[0] * S(a), -C(a), n[2] * S(a)];
    const seg = 0.036 * sc, rad = 0.0115 * sc;
    SH.f.forEach(([a1, a2], i) => {
      const zo = (0.024 - i * 0.024) * sc;
      const spread = (1 - i) * SH.spread;
      const base = [0, -0.078 * sc, zo];
      const d1 = curl(a1);
      const sp = (v) => V3.norm([v[0], v[1] * C(spread) , v[2] + (-v[1]) * S(spread)]);
      const dd1 = sp(d1);
      const m = V3.add(base, V3.mul(dd1, seg * (i === 1 ? 1.1 : 1)));
      const dd2 = sp(curl(a1 + a2));
      const e = V3.add(m, V3.mul(dd2, seg * 0.9));
      K.tube(b, [base, m, e], [rad, rad * 0.95, rad * 0.85], 6, skin);
      b.at(e[0], e[1], e[2], hh => hh.ellipsoid(rad * 0.85, rad * 0.85, rad * 0.85, 6, 4, skin));
    });
    const tb = [k * -0.004, -0.03 * sc, 0.034 * sc];
    const [t1, t2] = SH.thumb;
    const td = V3.norm([n[0] * S(t1) * 0.6, -C(SH.tDir), S(SH.tDir)]);
    const tm = V3.add(tb, V3.mul(td, 0.032 * sc));
    const td2 = V3.norm(V3.add(td, [n[0] * S(t1 + t2), 0, -S(t2) * 0.3]));
    const te = V3.add(tm, V3.mul(td2, 0.028 * sc));
    K.tube(b, [tb, tm, te], [rad * 1.1, rad * 1.0, rad * 0.9], 6, skin);
    b.at(te[0], te[1], te[2], hh => hh.ellipsoid(rad * 0.9, rad * 0.9, rad * 0.9, 6, 4, skin));
  }

  function buildBook(b) {
    b.box(0.17, 0.23, 0.04, 0xd8b98a, { faces: { front: false } });
  }

  function buildBookCover(b) {
    b.quad([-0.085, -0.115, 0.0205], [0.085, -0.115, 0.0205], [0.085, 0.115, 0.0205], [-0.085, 0.115, 0.0205], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function buildCoin(b) {
    K.discXY(b, 0, 0, 0.0012, 0.0125, 16, 0xffffff);
    b.push(M4.rotY(PI));
    K.discXY(b, 0, 0, 0.0012, 0.0125, 16, 0xffffff);
    b.pop();
  }

  function buildCoinEdge(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(16, 0.0125, 0.0125, -0.0012, 0.0125, 0.0125, 0.0012, 0x9a9ea6, { capTop: false });
    b.pop();
  }

  function buildGuitar(b) {
    const body = 0xc3202a;
    const pts = [[0, 0], [-0.24, -0.42], [-0.17, -0.46], [0, -0.16], [0.17, -0.46], [0.24, -0.42]];
    const tri = (a, c, d) => {
      b.tri([a[0], a[1], 0.025], [c[0], c[1], 0.025], [d[0], d[1], 0.025], body, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.tri([a[0], a[1], -0.025], [d[0], d[1], -0.025], [c[0], c[1], -0.025], shade(body, 0.85), null, [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    };
    tri(pts[0], pts[1], pts[2]);
    tri(pts[0], pts[2], pts[3]);
    tri(pts[0], pts[3], pts[4]);
    tri(pts[0], pts[4], pts[5]);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length];
      const nn = V3.norm([c[1] - a[1], -(c[0] - a[0]), 0]);
      b.quad([a[0], a[1], -0.025], [c[0], c[1], -0.025], [c[0], c[1], 0.025], [a[0], a[1], 0.025], shade(body, 0.7), null, [nn, nn, nn, nn]);
    }
    b.tri([0, -0.03, 0.027], [-0.1, -0.24, 0.027], [0.06, -0.2, 0.027], 0xf2f0ea);
    b.at(0, -0.22, 0.03, h => h.box(0.07, 0.025, 0.012, 0xd8d8dc));
    b.at(0, -0.3, 0.03, h => h.box(0.07, 0.025, 0.012, 0xd8d8dc));
    b.at(0, 0.27, 0.0, h => h.box(0.05, 0.62, 0.03, 0x4a2e1c));
    b.at(0, 0.27, 0.016, h => h.box(0.042, 0.62, 0.004, 0x221a16));
    b.push(M4.translate(0, 0.62, 0), M4.rotZ(0.45));
    b.box(0.07, 0.15, 0.025, 0xc3202a);
    b.pop();
  }

  function buildTube(b) {
    b.prism(10, 0.02, 0.02, -0.06, 0.02, 0.02, 0.05, 0x9aa0a8, { capBottom: true, capTop: false });
    b.prism(10, 0.02, 0.02, 0.05, 0.012, 0.012, 0.07, 0xb8bec6, { capTop: false });
    b.prism(8, 0.007, 0.007, 0.07, 0.004, 0.004, 0.11, 0xd8dce2, { capTop: true });
    b.at(0, -0.06, 0, h => h.box(0.045, 0.01, 0.012, 0x7a8088));
  }

  function buildDict(b) {
    [-1, 1].forEach(sd => {
      b.push(M4.rotY(sd * 0.62));
      b.at(sd * 0.085, 0, -0.012, h => h.box(0.16, 0.225, 0.022, 0xf2efe6, { faces: { front: 0xf6f3ea } }));
      b.at(sd * 0.087, 0, 0.002, h => h.box(0.172, 0.236, 0.008, 0x1f3b2a));
      b.pop();
    });
    b.at(0, 0, 0.004, h => h.prism(8, 0.012, 0.012, -0.118, 0.012, 0.012, 0.118, 0x1a3324));
  }

  function buildDictCover(b) {
    b.push(M4.rotY(-0.62));
    b.quad([-0.17, -0.115, 0.0065], [0.0, -0.115, 0.0065], [0.0, 0.115, 0.0065], [-0.17, 0.115, 0.0065], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.pop();
  }

  function buildCast(r) {
    const P = { meshes: {}, faces: {}, tex: {}, r };
    Object.keys(LOOKS).forEach(who => {
      const L = LOOKS[who];
      const M = {};
      M.head = mesh(r, b => buildHead(b, L));
      M.eyes = mesh(r, b => buildFace(b, L, 'eyes'));
      M.mouth = mesh(r, b => buildFace(b, L, 'mouth'));
      M.hair = mesh(r, b => {
        if (who === 'hugh') buildHughHair(b, L);
        else if (who === 'sam') buildSamHair(b, L);
        else if (who === 'cindy') buildCindyHair(b, L);
        else if (who === 'libby') buildLibbyHair(b, L);
        else if (who === 'nick') buildNickHair(b, L);
        else if (who === 'carl') buildCarlHair(b, L);
        else if (who === 'betty') buildBettyHair(b, L);
        else buildKidHair(b, L);
      });
      const gk = who === 'hugh' ? 'hugh' : who === 'sam' ? 'sam' : who === 'carl' ? 'carl' : null;
      if (gk) {
        let lens = null;
        M.frames = mesh(r, b => { lens = buildGlasses(b, L, gk); });
        M.lensDark = mesh(r, b => buildLenses(b, lens, [0.1, 0.13, 0.2, 0.0]));
        M.lensClear = mesh(r, b => buildLenses(b, lens, [0.85, 0.92, 1.0, 0.0]));
        M.glints = mesh(r, b => buildGlints(b, lens));
      }
      M.chest = mesh(r, b => buildChest(b, who));
      M.pelvis = mesh(r, b => buildPelvis(b, who));
      M.neck = mesh(r, b => buildNeck(b, who));
      M.upper = mesh(r, b => buildArm(b, who, 'up'));
      M.fore = mesh(r, b => buildArm(b, who, 'fore'));
      M.thigh = mesh(r, b => buildLeg(b, who, 'thigh'));
      M.shin = mesh(r, b => buildLeg(b, who, 'shin'));
      M.foot = mesh(r, b => buildLeg(b, who, 'foot'));
      M.hands = {};
      Object.keys(SHAPES).forEach(sh => {
        M.hands['L' + sh] = mesh(r, b => buildHand(b, who, 'L', sh));
        M.hands['R' + sh] = mesh(r, b => buildHand(b, who, 'R', sh));
      });
      P.meshes[who] = M;
    });
    P.meshes.sam.tag = mesh(r, b => {
      const rings = CHEST.sam;
      const z = frontZ(rings, 0.27) + 0.012;
      b.quad([-0.07, 0.25, z], [0.07, 0.25, z], [0.07, 0.3, z], [-0.07, 0.3, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });
    P.tex.tag = r.texture(128, Art.nameTag, { height: 48, clamp: true });
    P.props = {
      book: mesh(r, buildBook),
      bookCover: mesh(r, buildBookCover),
      coin: mesh(r, buildCoin),
      coinEdge: mesh(r, buildCoinEdge),
      guitar: mesh(r, buildGuitar),
      tube: mesh(r, buildTube),
      dict: mesh(r, buildDict),
      dictCover: mesh(r, buildDictCover)
    };
    P.tex.dict = r.texture(128, Art.dictCover, { height: 172, clamp: true });
    P.tex.history = r.texture(128, Art.historyCover, { height: 172, clamp: true });
    P.tex.coin = r.texture(64, Art.coinFace, { clamp: true });
    P.tex.cloth = r.texture(64, K.noiseTex('#ffffff', 19, 0.06, 0.4));
    return P;
  }

  function faceTex(P, who, kind, a, b) {
    const key = who + ':' + kind + ':' + a + ':' + (b || 0);
    if (!P.faces[key]) {
      const L = LOOKS[who];
      P.faces[key] = kind === 'eyes'
        ? P.r.texture(256, Art.eyesTex(L, a), { height: 128, clamp: true })
        : P.r.texture(256, Art.mouthTex(L, a, b), { height: 128, clamp: true });
    }
    return P.faces[key];
  }

  function solve(who, pose) {
    const L = LOOKS[who];
    const s = Rig.solve(pose, L.D);
    const nl = who === 'hugh' ? L.D.headY - 0.06 : who === 'sam' ? 0.06 : 0.1;
    s.neckM = M4.chain(s.neck, M4.translate(0, -0.03, 0), M4.scale(1, nl, 1));
    s.pts.head = M4.point(s.head, [0, 0, 0]);
    s.pts.top = M4.point(s.head, [0, L.head.ry + (who === 'hugh' ? 0.12 : 0.05), 0]);
    return s;
  }

  function mouthLevel(open) {
    return open > 0.62 ? 3 : open > 0.36 ? 2 : open > 0.14 ? 1 : 0;
  }

  function draw(r, P, who, s, pose, opts) {
    const M = P.meshes[who];
    const o = opts || {};
    const base = {};
    if (o.tint) base.tint = o.tint;
    if (o.noCookie) base.noCookie = true;
    if (o.flat) {
      base.flat = o.flat;
      base.alpha = o.alpha;
      base.blend = true;
    }
    const d = (m, mat, extra) => r.draw(m, o.pre ? M4.mul(o.pre, mat) : mat, Object.assign({}, base, extra || {}));
    const cloth = { texture: P.tex.cloth };
    d(M.pelvis, s.pelvis, cloth);
    d(M.chest, s.chest, cloth);
    if (M.tag && !o.flat) d(M.tag, s.chest, { texture: P.tex.tag });
    d(M.neck, s.neckM);
    d(M.head, s.head);
    d(M.hair, s.head);
    if (!o.flat) {
      d(M.eyes, s.head, { texture: faceTex(P, who, 'eyes', pose.eyes || 'open') });
      const open = pose.open || 0;
      const shape = pose.mouth || 'closed';
      const lvl = shape === 'closed' || shape === 'smile' || shape === 'grin' || shape === 'frown' || shape === 'smirk' ? (open > 0.14 ? mouthLevel(open) : 0) : mouthLevel(open);
      const shp = lvl > 0 && (shape === 'closed' || shape === 'frown' || shape === 'smirk') ? 'open' : shape;
      d(M.mouth, s.head, { texture: faceTex(P, who, 'mouth', shp, shp === 'grin' || shp === 'scream' || shp === 'o' ? 0 : lvl) });
    }
    ['L', 'R'].forEach(side => {
      if (pose['hide' + side]) return;
      d(M.upper, s['upper' + side], cloth);
      d(M.fore, s['fore' + side], cloth);
      const shape = (pose.hands && pose.hands[side]) || 'relax';
      d(M.hands[side + shape] || M.hands[side + 'relax'], s['hand' + side]);
    });
    ['L', 'R'].forEach(side => {
      if (pose.hideLegs) return;
      d(M.thigh, s['thigh' + side], cloth);
      d(M.shin, s['shin' + side], cloth);
      d(M.foot, s['foot' + side]);
    });
    if (M.frames && pose.glasses !== 'none') {
      d(M.frames, s.head);
      if (!o.flat) {
        const dark = pose.glasses === 'shades';
        r.draw(M[dark ? 'lensDark' : 'lensClear'], o.pre ? M4.mul(o.pre, s.head) : s.head, { blend: true, alpha: dark ? 0.86 : 0.22, noFog: true });
        r.draw(M.glints, o.pre ? M4.mul(o.pre, s.head) : s.head, { blend: true, alpha: dark ? 0.35 : 0.5, noFog: true });
      }
    }
    if (pose.prop && !o.flat) drawProp(r, P, s, pose.prop, o);
  }

  function drawProp(r, P, s, prop, o) {
    const hand = s['hand' + (prop.side || 'R')];
    const m = M4.chain(hand, M4.translate(...(prop.off || [0, -0.09, 0.02])), M4.rotX(prop.rx || 0), M4.rotY(prop.ry || 0), M4.rotZ(prop.rz || 0));
    const mm = o.pre ? M4.mul(o.pre, m) : m;
    if (prop.kind === 'history') {
      r.draw(P.props.book, mm);
      r.draw(P.props.bookCover, mm, { texture: P.tex.history });
    } else if (prop.kind === 'guitar') {
      r.draw(P.props.guitar, mm);
    } else if (prop.kind === 'coin') {
      r.draw(P.props.coin, mm, { texture: P.tex.coin });
      r.draw(P.props.coinEdge, mm);
    } else if (prop.kind === 'tube') {
      r.draw(P.props.tube, mm);
    }
  }

  function drawFree(r, P, kind, m) {
    if (kind === 'coin') {
      r.draw(P.props.coin, m, { texture: P.tex.coin });
      r.draw(P.props.coinEdge, m);
    } else if (kind === 'guitar') {
      r.draw(P.props.guitar, m);
    } else if (kind === 'history') {
      r.draw(P.props.book, m);
      r.draw(P.props.bookCover, m, { texture: P.tex.history });
    } else if (kind === 'dict') {
      r.draw(P.props.dict, m);
      r.draw(P.props.dictCover, m, { texture: P.tex.dict });
    }
  }

  window.VazCast = { LOOKS, SHAPES, HUGH, headPt, build: buildCast, solve, draw, drawFree, faceTex };
})();
