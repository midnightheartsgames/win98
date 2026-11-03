(function () {
  const { M4, V3, shade, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;

  const LOOK = {
    floor: 0xb68755,
    floorHi: 0xf0e8e4,
    wall: 0xb89a7c,
    wood: 0x3e2720,
    woodHi: 0x5a3a2c,
    woodDk: 0x24140f,
    brass: 0xb08a50,
    table: 0x3a2724,
    tableHi: 0x4a3330,
    chair: 0x5c382c,
    chairHi: 0x6c4434,
    seat: 0x4d3227,
    curtain: 0xf4ecee,
    porcelain: 0xd8d0cc,
    silver: 0xa8a4a2,
    platePurple: 0x8e4448,
    plateOrange: 0x9a5420,
    plateRed: 0x823644,
    sausage: 0xc5663a,
    potato: 0xbe8e41,
    bread: 0xd1a369,
    crust: 0x844a1e,
    tomato: 0x8a3924,
    cucumber: 0x332c1e,
    onion: 0x4a6a2a,
    bowl: 0xb89468,
    bowlIn: 0xc8a882,
    soup: 0x3a2018,
    soupBit: 0x8a5a24,
    spoon: 0xb0aeb0,
    cable: 0xd8ccc6,
    jacket: 0x1c1a20,
    lightWood: 0x8a5a34
  };

  const SET = {
    table: { c: [-0.055, 0.763, -0.642], r: 0.33, h: 0.035 },
    chair: { at: [-0.03, 0, -1.27], yaw: 0.09, seatY: 0.49, front: 0.25, back: -0.26, half: 0.3, arm: 0.43, armFront: 0.2, armY: 0.65, armRise: 0.17, top: 1.13, finial: 1.22, recline: 0.07 },
    plates: [
      { kind: 'purple', c: [-0.233, -0.689], r: 0.113, col: 'platePurple' },
      { kind: 'orange', c: [-0.013, -0.669], r: 0.113, col: 'plateOrange' },
      { kind: 'red', c: [-0.163, -0.888], r: 0.1, col: 'plateRed' }
    ],
    bowl: { c: [0.086, -0.913], rim: 0.091, base: 0.046, h: 0.076 },
    bread: { c: [0.176, -0.675], w: 0.128, d: 0.1, n: 5, yaw: -0.12 },
    sausages: { c: [-0.212, -0.64], yaw: -0.45, len: 0.18, gap: 0.031, n: 4 },
    tomatoes: [[-0.231, -0.881], [-0.138, -0.834]],
    cucumber: [[-0.175, -0.938], [-0.018, -0.915]],
    spoon: [[0.07, 0.812, -0.92], [0.028, 0.965, -0.88]],
    sideboard: { a: [-3.71, -3.58], b: [-2.215, -5.26], h: 0.99, d: 0.5 },
    wardrobe: { a: [-2.215, -5.26], b: [2.073, -8.969], h: 2.5, d: 0.6 },
    window: { a: [2.073, -8.969], b: [4.6, -10.4], h: 2.7 },
    sideChair: { at: [2.42, 0, -4.02], yaw: -1.45, scale: 1.12 },
    lightChair: { at: [2.25, 0, -3.15], yaw: -2.2 },
    cable: [[0.35, -1.6], [0.6, -2.35], [0.903, -2.73], [1.3, -2.8], [1.619, -2.849], [1.902, -2.978], [2.14, -3.069]]
  };

  function flatN(b, a, c, d) {
    return V3.norm(V3.cross(V3.sub(c, a), V3.sub(d, a)));
  }

  function wallQuad(b, a, c, y0, y1, col, uvs) {
    const p0 = [a[0], y0, a[1]], p1 = [c[0], y0, c[1]], p2 = [c[0], y1, c[1]], p3 = [a[0], y1, a[1]];
    const n = flatN(b, p0, p1, p3);
    b.quad(p0, p1, p2, p3, col, uvs || null, [n, n, n, n]);
  }

  function glareAt(x, z) {
    const wx = 3.2, wz = -9.6;
    const dx = x - wx, dz = z - wz;
    const along = dx * -0.2 + dz * 0.98;
    const across = dx * 0.98 + dz * 0.2;
    const streak = Math.exp(-(across * across) / (2 * Math.pow(0.55 + along * 0.16, 2))) * clamp(1 - along / 9, 0, 1);
    const pool = Math.exp(-((x - 2.1) * (x - 2.1) / 2.4 + (z + 5.2) * (z + 5.2) / 9));
    return clamp(streak * 0.95 + pool * 0.45, 0, 1);
  }

  function buildFloor(b) {
    const x0 = -7, x1 = 8, z0 = 1.5, z1 = -15, nx = 30, nz = 40;
    const base = rgb(LOOK.floor), hi = rgb(LOOK.floorHi);
    const colAt = (x, z) => {
      const g = glareAt(x, z);
      return [lerp(base[0], hi[0], g), lerp(base[1], hi[1], g), lerp(base[2], hi[2], g), g * 0.55];
    };
    const n = [0, 1, 0];
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const xa = x0 + (x1 - x0) * i / nx, xb = x0 + (x1 - x0) * (i + 1) / nx;
        const za = z0 + (z1 - z0) * j / nz, zb = z0 + (z1 - z0) * (j + 1) / nz;
        b.quad([xa, 0, za], [xb, 0, za], [xb, 0, zb], [xa, 0, zb], [colAt(xa, za), colAt(xb, za), colAt(xb, zb), colAt(xa, zb)], null, [n, n, n, n]);
      }
    }
  }

  function along(a, c, k) {
    return [lerp(a[0], c[0], k), lerp(a[1], c[1], k)];
  }

  function behind(a, c, d) {
    const dx = c[0] - a[0], dz = c[1] - a[1];
    const l = Math.hypot(dx, dz);
    const n = [dz / l, -dx / l];
    const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
    const k = n[0] * mid[0] + n[1] * mid[1] > 0 ? d : -d;
    return [n[0] * k, n[1] * k];
  }

  function shifted(p, n) {
    return [p[0] + n[0], p[1] + n[1]];
  }

  function drawerTex(ctx, w, h) {
    ctx.fillStyle = '#46302a';
    ctx.fillRect(0, 0, w, h);
    const g = rand(4);
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = `rgba(${g() < 0.5 ? '20,8,4' : '110,64,44'},${0.12 + g() * 0.14})`;
      ctx.lineWidth = 1 + g() * 2;
      const y = g() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (g() - 0.5) * 8, w * 0.7, y + (g() - 0.5) * 8, w, y + (g() - 0.5) * 6);
      ctx.stroke();
    }
    const rows = [0.04, 0.34, 0.64, 0.94];
    for (let r = 0; r < 3; r++) {
      const y0 = rows[r] * h + 3, y1 = rows[r + 1] * h - 3;
      ctx.strokeStyle = 'rgba(16,6,4,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, y0, w - 20, y1 - y0);
      ctx.fillStyle = '#c8a05a';
      ctx.fillRect(w * 0.06, (y0 + y1) / 2 - 3, w * 0.88, 5);
      ctx.fillStyle = 'rgba(255,236,190,0.6)';
      ctx.fillRect(w * 0.06, (y0 + y1) / 2 - 3, w * 0.88, 1.5);
    }
    ctx.fillStyle = '#22100c';
    ctx.fillRect(0, h * 0.95, w, h * 0.05);
  }

  function doorTex(ctx, w, h) {
    ctx.fillStyle = '#5a3c33';
    ctx.fillRect(0, 0, w, h);
    const g = rand(8);
    for (let i = 0; i < 200; i++) {
      ctx.strokeStyle = `rgba(${g() < 0.5 ? '24,10,6' : '120,72,52'},${0.1 + g() * 0.12})`;
      ctx.lineWidth = 1 + g() * 2;
      const x = g() * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (g() - 0.5) * 6, h * 0.4, x + (g() - 0.5) * 6, h * 0.6, x + (g() - 0.5) * 4, h);
      ctx.stroke();
    }
    const cols = 2;
    for (let i = 0; i < cols; i++) {
      const x0 = (i / cols) * w, x1 = ((i + 1) / cols) * w;
      ctx.strokeStyle = 'rgba(14,6,4,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 2, 4, x1 - x0 - 4, h - 8);
      ctx.strokeStyle = 'rgba(30,14,10,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 + 10, h * 0.06, x1 - x0 - 20, h * 0.38);
      ctx.strokeRect(x0 + 10, h * 0.5, x1 - x0 - 20, h * 0.42);
      ctx.fillStyle = 'rgba(150,100,70,0.35)';
      ctx.fillRect(x0 + 12, h * 0.06 + 2, 2, h * 0.38 - 4);
      ctx.fillStyle = '#b08848';
      ctx.fillRect(i % 2 ? x0 + 6 : x1 - 9, h * 0.46, 3, h * 0.08);
    }
    ctx.fillStyle = '#1c0c08';
    ctx.fillRect(0, h * 0.96, w, h * 0.04);
  }

  function weaveTex(ctx, w, h) {
    ctx.fillStyle = '#21170f';
    ctx.fillRect(0, 0, w, h);
    const cols = 4, rows = 6;
    const cw = w / cols, rh = h / rows;
    for (let c = -1; c <= cols; c++) {
      const dir = c % 2 === 0 ? 1 : -1;
      for (let r = -2; r <= rows + 1; r++) {
        const cx = (c + 0.5) * cw, cy = (r + (c % 2 ? 0.5 : 0)) * rh;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(dir * PI / 4);
        const len = cw * 1.5, wid = rh * 0.92;
        const gr = ctx.createLinearGradient(0, -wid / 2, 0, wid / 2);
        gr.addColorStop(0, '#2a1f14');
        gr.addColorStop(0.3, '#5c4a33');
        gr.addColorStop(0.55, '#6a573c');
        gr.addColorStop(1, '#2c2116');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(-len / 2, -wid / 2);
        ctx.quadraticCurveTo(0, -wid * 0.62, len / 2, -wid / 2);
        ctx.lineTo(len / 2, wid / 2);
        ctx.quadraticCurveTo(0, wid * 0.62, -len / 2, wid / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(14,9,5,0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function upholsteryTex(ctx, w, h) {
    ctx.fillStyle = '#8a6a50';
    ctx.fillRect(0, 0, w, h);
    const g = rand(12);
    for (let i = 0; i < 40; i++) {
      const x = g() * w, y = g() * h, r = 4 + g() * 6;
      ctx.fillStyle = g() < 0.5 ? '#5a3a2a' : '#b08a64';
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + C(a) * r, y + S(a) * r, r * 0.6, r * 0.35, a, 0, PI * 2);
        ctx.fill();
      }
    }
  }

  function seatTex(ctx, w, h) {
    ctx.fillStyle = '#2e1e16';
    ctx.fillRect(0, 0, w, h);
    const g = rand(21);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(20,12,8,0.5)' : 'rgba(96,72,52,0.5)';
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y + 6);
      ctx.lineTo(x + 3, y + 14);
      ctx.closePath();
      ctx.fill();
    }
  }

  function windowTex(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#ece4e6');
    gr.addColorStop(0.3, '#ffffff');
    gr.addColorStop(1, '#fbf8fa');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  function buildSideboard(b) {
    const s = SET.sideboard;
    const n = behind(s.a, s.b, s.d);
    const back = [shifted(s.a, n), shifted(s.b, n)];
    wallQuad(b, s.a, s.b, 0, s.h, [1, 1, 1, 0], [[0, 0], [3, 0], [3, 1], [0, 1]]);
    const top = [[s.a[0], s.h, s.a[1]], [s.b[0], s.h, s.b[1]], [back[1][0], s.h, back[1][1]], [back[0][0], s.h, back[0][1]]];
    b.quad(top[0], top[1], top[2], top[3], [1, 1, 1, 0], [[0, 0.5], [0.02, 0.5], [0.02, 0.52], [0, 0.52]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    wallQuad(b, s.b, back[1], 0, s.h, [1, 1, 1, 0], [[0, 0.5], [0.05, 0.5], [0.05, 0.6], [0, 0.6]]);
  }

  function buildSideboardTop(b) {
    const s = SET.sideboard;
    const n = behind(s.a, s.b, 0.22);
    const spot = (k) => { const p = shifted(along(s.a, s.b, k), n); return [p[0], s.h, p[1]]; };
    const bird = (p, yaw) => {
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.scale(1.9, 1.9, 1.9));
      b.at(0, 0.08, 0, h => h.ellipsoid(0.07, 0.065, 0.11, 9, 6, LOOK.porcelain));
      b.at(0, 0.16, 0.08, h => h.ellipsoid(0.035, 0.04, 0.035, 7, 5, LOOK.porcelain));
      b.at(0, 0.15, 0.115, h => h.prism(5, 0.012, 0.012, 0, 0.002, 0.002, 0.03, 0xd8a050));
      b.at(0, 0.1, -0.12, h => h.ellipsoid(0.03, 0.06, 0.05, 6, 4, LOOK.porcelain));
      b.at(0, 0.01, 0, h => h.prism(10, 0.06, 0.06, 0, 0.05, 0.05, 0.02, LOOK.porcelain));
      b.pop();
    };
    bird(spot(0.18), 0.9);
    bird(spot(0.66), -0.6);
    const t = spot(0.42);
    b.push(M4.translate(t[0], t[1], t[2]), M4.rotY(0.6));
    b.box(0.42, 0.012, 0.26, LOOK.silver, { base: true });
    b.at(-0.1, 0.012, 0, h => h.prism(10, 0.06, 0.06, 0, 0.07, 0.07, 0.11, LOOK.silver));
    b.at(-0.1, 0.13, 0, h => h.ellipsoid(0.04, 0.03, 0.04, 8, 4, LOOK.silver));
    b.at(0.02, 0.07, 0, h => h.prism(6, 0.012, 0.012, 0, 0.006, 0.006, 0.07, LOOK.silver));
    b.at(0.12, 0.012, 0.02, h => h.prism(10, 0.045, 0.045, 0, 0.05, 0.05, 0.08, LOOK.silver));
    b.pop();
  }

  function buildWardrobe(b) {
    const s = SET.wardrobe;
    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const a = along(s.a, s.b, i / segs), c = along(s.a, s.b, (i + 1) / segs);
      wallQuad(b, a, c, 0, s.h, [1, 1, 1, 0]);
    }
    const n = behind(s.a, s.b, -0.06);
    wallQuad(b, shifted(s.a, n), shifted(s.b, n), s.h - 0.06, s.h + 0.04, LOOK.woodDk);
    const wallN = behind(s.a, s.b, s.d);
    wallQuad(b, shifted(s.a, wallN), shifted(s.b, wallN), s.h, 3.0, LOOK.wall);
    const sb = SET.sideboard;
    const sn = behind(sb.a, sb.b, sb.d);
    wallQuad(b, shifted(sb.a, sn), shifted(sb.b, sn), sb.h, 3.0, LOOK.wall);
  }

  function buildWindow(b) {
    const s = SET.window;
    const folds = 26;
    for (let i = 0; i < folds; i++) {
      const a = along(s.a, s.b, i / folds), c = along(s.a, s.b, (i + 1) / folds);
      const k = i % 2 ? 0.94 : 1;
      wallQuad(b, a, c, 0, s.h, [k, k * 0.98, k * 0.99, 1]);
    }
  }

  function buildTable(b) {
    const t = SET.table;
    const [cx, cy, cz] = t.c;
    b.push(M4.translate(cx, cy, cz));
    b.prism(40, t.r, t.r, -t.h, t.r, t.r, 0, LOOK.table, { topColor: LOOK.tableHi });
    b.prism(40, t.r * 0.97, t.r * 0.97, -t.h - 0.04, t.r * 0.97, t.r * 0.97, -t.h, LOOK.woodDk, { capTop: false });
    b.prism(12, 0.05, 0.05, -cy, 0.045, 0.045, -t.h - 0.04, LOOK.table);
    [0, 1, 2].forEach(i => {
      const a = (i / 3) * PI * 2 + 0.3;
      b.push(M4.rotY(a));
      b.at(0, -cy + 0.04, 0.16, h => h.box(0.05, 0.06, 0.34, LOOK.woodDk));
      b.pop();
    });
    b.pop();
  }

  function plateMesh(b, p) {
    const y = SET.table.c[1];
    const col = LOOK[p.col];
    b.push(M4.translate(p.c[0], y, p.c[1]));
    b.prism(28, p.r * 0.62, p.r * 0.62, 0, p.r, p.r, 0.016, col, { capBottom: false, capTop: false });
    b.prism(28, p.r * 0.62, p.r * 0.62, 0.0, p.r * 0.62, p.r * 0.62, 0.006, shade(col, 0.92));
    b.prism(28, p.r, p.r, 0.014, p.r * 1.01, p.r * 1.01, 0.018, shade(col, 1.12), { capTop: false });
    b.pop();
  }

  function buildFood(b) {
    SET.plates.forEach(p => plateMesh(b, p));
    const y = SET.table.c[1];
    const g = rand(31);
    const op = SET.plates[1];
    const potatoSpots = [[-0.05, -0.03, 0.04], [0.035, -0.045, 0.042], [0.06, 0.03, 0.038], [-0.02, 0.05, 0.036], [0.0, 0.0, 0.05], [-0.065, 0.03, 0.035], [0.03, 0.07, 0.03], [0.07, -0.01, 0.03]];
    potatoSpots.forEach(([dx, dz, r], i) => {
      b.push(M4.translate(op.c[0] + dx, y + 0.012 + r * 0.6 + (i === 4 ? 0.03 : 0), op.c[1] + dz), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.6));
      b.ellipsoid(r * 1.15, r * 0.78, r, 8, 5, shade(LOOK.potato, 0.92 + g() * 0.12), { flat: true });
      b.pop();
    });
    const s = SET.sausages;
    for (let i = 0; i < s.n; i++) {
      const off = (i - (s.n - 1) / 2) * s.gap;
      const dir = [C(s.yaw), 0, S(s.yaw)];
      const side = [-dir[2], 0, dir[0]];
      const c = [s.c[0] + side[0] * off, y + 0.026, s.c[1] + side[2] * off];
      const a = V3.sub(c, V3.mul(dir, s.len / 2)), e = V3.add(c, V3.mul(dir, s.len / 2));
      const pts = [], radii = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        const p = V3.lerp(a, e, u);
        p[1] += S(u * PI) * 0.004;
        pts.push(p);
        radii.push(0.0135 * Math.sqrt(Math.max(0.05, S(u * PI))) + 0.002);
      }
      tube(b, pts, radii, 8, shade(LOOK.sausage, 0.95 + (i % 2) * 0.08));
    }
    SET.tomatoes.forEach(([x, z], i) => {
      b.at(x, y + 0.045, z, h => h.ellipsoid(0.038, 0.034, 0.038, 12, 8, LOOK.tomato));
      b.at(x, y + 0.079, z, h => h.prism(5, 0.012, 0.012, 0, 0.004, 0.004, 0.006, 0x3a5a20));
    });
    const [ca, cb] = SET.cucumber;
    const cpts = [[ca[0], y + 0.03, ca[1]], [lerp(ca[0], cb[0], 0.5), y + 0.034, lerp(ca[1], cb[1], 0.5)], [cb[0], y + 0.028, cb[1]]];
    tube(b, cpts, [0.012, 0.018, 0.011], 8, LOOK.cucumber);
    for (let i = 0; i < 4; i++) {
      const p0 = [ca[0] + 0.02 + i * 0.012, y + 0.04, ca[1] + 0.02], p1 = [cb[0] + 0.06, y + 0.045 + i * 0.004, cb[1] + 0.03 - i * 0.01];
      tube(b, [p0, p1], [0.003, 0.002], 4, LOOK.onion);
    }
    const bw = SET.bowl;
    b.push(M4.translate(bw.c[0], y, bw.c[1]));
    b.prism(24, bw.base, bw.base, 0, bw.rim * 0.86, bw.rim * 0.86, bw.h * 0.6, LOOK.bowl, { capBottom: true, capTop: false });
    b.prism(24, bw.rim * 0.86, bw.rim * 0.86, bw.h * 0.6, bw.rim, bw.rim, bw.h, LOOK.bowl, { capTop: false });
    b.prism(24, bw.rim * 0.96, bw.rim * 0.96, bw.h * 0.7, bw.rim * 0.985, bw.rim * 0.985, bw.h * 0.99, LOOK.bowlIn, { capTop: false });
    b.at(0, bw.h * 0.72, 0, h => h.disc(bw.rim * 0.93, 24, LOOK.soup));
    const bits = [[0.02, 0.01, 0.022], [-0.025, 0.02, 0.016], [0.03, -0.03, 0.018], [-0.01, -0.035, 0.014], [0.005, 0.04, 0.012]];
    bits.forEach(([dx, dz, r]) => b.at(dx, bw.h * 0.74, dz, h => h.ellipsoid(r, r * 0.45, r * 0.8, 6, 3, LOOK.soupBit)));
    b.pop();
    const br = SET.bread;
    b.push(M4.translate(br.c[0], y, br.c[1]), M4.rotY(br.yaw));
    for (let i = 0; i < br.n; i++) {
      const sy = i * 0.0135, jitter = (g() - 0.5) * 0.006;
      b.at(jitter, sy, -jitter, h => h.box(br.w, 0.0125, br.d, LOOK.bread, { base: true, faces: { front: LOOK.crust, back: LOOK.crust, left: LOOK.crust, right: LOOK.crust } }));
    }
    b.pop();
    const [sa, se] = SET.spoon;
    tube(b, [sa, se], [0.006, 0.005], 6, LOOK.spoon);
    b.at(sa[0], sa[1], sa[2], h => h.ellipsoid(0.02, 0.006, 0.03, 8, 3, LOOK.spoon));
  }

  function turned(b, h0, h1, r, col) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = h0 + (h1 - h0) * (i / n), c = h0 + (h1 - h0) * ((i + 1) / n);
      b.prism(8, r * (i % 2 ? 0.75 : 1.0), r * (i % 2 ? 0.75 : 1.0), a, r * (i % 2 ? 1.0 : 0.75), r * (i % 2 ? 1.0 : 0.75), c, col, { capTop: false });
    }
  }

  function buildChairFrame(b) {
    const ch = SET.chair;
    const W = LOOK.chair, Hi = LOOK.chairHi;
    const backZ = ch.back - 0.02;
    [-1, 1].forEach(s => {
      const x = s * ch.half;
      b.push(M4.translate(x, 0, backZ), M4.rotX(-ch.recline));
      b.prism(8, 0.03, 0.03, 0, 0.03, 0.03, ch.top - 0.02, W);
      turned(b, ch.seatY + 0.12, ch.top - 0.05, 0.034, Hi);
      b.at(0, ch.top - 0.02, 0, h => h.prism(8, 0.032, 0.032, 0, 0.022, 0.022, 0.04, W));
      b.at(0, ch.finial - 0.045, 0, h => h.ellipsoid(0.032, 0.04, 0.032, 8, 6, Hi));
      b.pop();
      b.at(s * ch.arm, 0, ch.front - 0.06, h => turned(h, 0, ch.armY, 0.028, W));
      b.push(M4.translate(s * ch.arm, ch.armY, 0));
      const back = [x - s * ch.arm, ch.armRise, backZ + 0.02];
      const front = [0, 0, ch.armFront];
      const mid = [(back[0] + front[0]) / 2 - s * 0.015, (back[1] + front[1]) / 2 + 0.03, (back[2] + front[2]) / 2];
      tube(b, [back, mid, front], [0.03, 0.034, 0.036], 8, Hi);
      b.at(0, -0.01, ch.armFront + 0.02, h => h.ellipsoid(0.045, 0.04, 0.05, 8, 5, Hi));
      b.pop();
      for (let i = 0; i < 4; i++) {
        const z = lerp(ch.front - 0.1, backZ + 0.08, (i + 0.5) / 4);
        b.at(s * (ch.arm - 0.02 - (i / 4) * (ch.arm - ch.half) * 0.8), ch.seatY + 0.02, z, h => turned(h, 0, ch.armY - ch.seatY + 0.02 + i * 0.03, 0.012, W));
      }
    });
    b.at(0, ch.seatY - 0.06, (ch.front + ch.back) / 2, h => h.box(ch.arm * 2 - 0.02, 0.1, ch.front - ch.back, W));
    b.push(M4.translate(0, 0, backZ), M4.rotX(-ch.recline));
    b.at(0, ch.top - 0.03, 0, h => h.box(ch.half * 2, 0.06, 0.05, Hi));
    b.at(0, ch.seatY + 0.08, -0.01, h => h.box(ch.half * 2, 0.05, 0.04, W));
    b.pop();
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      b.at(sx * (ch.arm - 0.02), 0, sz > 0 ? ch.front - 0.06 : backZ, h => h.box(0.05, ch.seatY - 0.08, 0.05, W, { base: true }));
    });
  }

  function buildChairWeave(b) {
    const ch = SET.chair;
    b.push(M4.translate(0, 0, ch.back - 0.02), M4.rotX(-ch.recline));
    const y0 = ch.seatY + 0.1, y1 = ch.top - 0.06, x0 = -ch.half + 0.02, x1 = ch.half - 0.02;
    const nu = 8, nv = 10;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const z = (u, v) => 0.012 + 0.03 * S(u * PI) * (0.6 + 0.4 * S(v * PI));
        const p = (u, v) => [lerp(x0, x1, u), lerp(y0, y1, v), z(u, v)];
        b.quad(p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1), [1, 1, 1, 0], [[u0 * 1.25, v0 * 1.15], [u1 * 1.25, v0 * 1.15], [u1 * 1.25, v1 * 1.15], [u0 * 1.25, v1 * 1.15]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    }
    b.pop();
  }

  function buildChairSeat(b) {
    const ch = SET.chair;
    const y = ch.seatY;
    const x0 = -ch.arm + 0.06, x1 = ch.arm - 0.06, z0 = ch.back + 0.02, z1 = ch.front;
    const nu = 6, nv = 5;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const hgt = (u, v) => y + 0.04 * S(u * PI) * S(v * PI) + 0.02;
        const p = (u, v) => [lerp(x0, x1, u), hgt(u, v), lerp(z0, z1, v)];
        b.quad(p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1), [1, 1, 1, 0], [[u0 * 2, v0 * 2], [u1 * 2, v0 * 2], [u1 * 2, v1 * 2], [u0 * 2, v1 * 2]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    }
    b.at(0, y - 0.005, (z0 + z1) / 2, h => h.box(x1 - x0, 0.05, z1 - z0, shade(LOOK.seat, 0.8)));
  }

  function buildSideChair(b) {
    const W = LOOK.wood, Hi = LOOK.woodHi;
    [[-0.22, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]].forEach(([x, z]) => b.at(x, 0, z, h => turned(h, 0, 0.46, 0.025, W)));
    b.at(0, 0.48, 0, h => h.box(0.5, 0.06, 0.46, W));
    b.at(0, 0.53, 0, h => h.box(0.46, 0.04, 0.42, 0x6a4a3a));
    [-1, 1].forEach(s => b.at(s * 0.22, 0.5, -0.21, h => turned(h, 0, 0.62, 0.028, Hi)));
    b.at(0, 1.1, -0.21, h => h.box(0.5, 0.08, 0.05, Hi));
  }

  function buildSideChairBack(b) {
    b.quad([-0.19, 0.58, -0.2], [0.19, 0.58, -0.2], [0.19, 1.05, -0.2], [-0.19, 1.05, -0.2], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1.3], [0, 1.3]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function buildLightChair(b) {
    const W = LOOK.lightWood;
    [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].forEach(([x, z]) => b.at(x, 0, z, h => h.box(0.035, 0.45, 0.035, W, { base: true })));
    b.at(0, 0.45, 0, h => h.box(0.46, 0.04, 0.44, W, { base: true }));
    [-1, 1].forEach(s => b.at(s * 0.2, 0.45, -0.2, h => h.box(0.035, 0.5, 0.035, W, { base: true })));
    b.at(0, 0.88, -0.2, h => h.box(0.44, 0.08, 0.025, W));
    b.push(M4.translate(0, 0.95, -0.24));
    b.box(0.5, 0.05, 0.1, LOOK.jacket);
    b.at(0, -0.35, 0.02, h => h.box(0.52, 0.7, 0.07, LOOK.jacket));
    b.at(0.05, -0.62, 0.06, h => h.box(0.44, 0.3, 0.06, shade(LOOK.jacket, 1.2)));
    b.pop();
  }

  function buildCable(b) {
    const pts = SET.cable.map(([x, z]) => [x, 0.006, z]);
    tube(b, pts, pts.map(() => 0.005), 5, LOOK.cable);
    const coil = SET.cable[4];
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * PI * 2, a1 = ((i + 1) / 10) * PI * 2;
      const c = [coil[0], 0.008, coil[1]];
      tube(b, [[c[0] + C(a0) * 0.07, c[1], c[2] + S(a0) * 0.05], [c[0] + C(a1) * 0.07, c[1], c[2] + S(a1) * 0.05]], [0.005, 0.005], 5, LOOK.cable);
    }
  }

  function build(r) {
    return {
      tex: {
        drawers: r.texture(256, drawerTex),
        doors: r.texture(256, doorTex, { height: 512 }),
        weave: r.texture(256, weaveTex),
        upholstery: r.texture(128, upholsteryTex),
        seat: r.texture(128, seatTex),
        window: r.texture(64, windowTex)
      },
      floor: mesh(r, buildFloor),
      sideboard: mesh(r, buildSideboard),
      sideboardTop: mesh(r, buildSideboardTop),
      wardrobe: mesh(r, buildWardrobe),
      window: mesh(r, buildWindow),
      table: mesh(r, buildTable),
      food: mesh(r, buildFood),
      chairFrame: mesh(r, buildChairFrame),
      chairWeave: mesh(r, buildChairWeave),
      chairSeat: mesh(r, buildChairSeat),
      sideChair: mesh(r, buildSideChair),
      sideChairBack: mesh(r, buildSideChairBack),
      lightChair: mesh(r, buildLightChair),
      cable: mesh(r, buildCable)
    };
  }

  function placeM(p) {
    return M4.chain(M4.translate(p.at[0], p.at[1], p.at[2]), M4.rotY(p.yaw || 0), M4.scale(p.scale || 1, p.scale || 1, p.scale || 1));
  }

  function draw(r, W) {
    r.draw(W.floor, null);
    r.draw(W.sideboard, null, { texture: W.tex.drawers });
    r.draw(W.sideboardTop, null);
    r.draw(W.wardrobe, null, { texture: W.tex.doors });
    r.draw(W.window, null, { texture: W.tex.window });
    r.draw(W.cable, null);
    const sc = placeM(SET.sideChair);
    r.draw(W.sideChair, sc);
    r.draw(W.sideChairBack, sc, { texture: W.tex.upholstery });
    r.draw(W.lightChair, placeM(SET.lightChair));
    const cm = placeM(SET.chair);
    r.draw(W.chairFrame, cm);
    r.draw(W.chairWeave, cm, { texture: W.tex.weave });
    r.draw(W.chairSeat, cm, { texture: W.tex.seat });
    r.draw(W.table, null);
    r.draw(W.food, null);
  }

  window.MukbangRoom = { LOOK, SET, build, draw, placeM, glareAt };
})();
