(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const css = (c, a) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a === undefined ? 1 : a})`;

  function cells(n, seed, lw) {
    const g = rand(seed);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([g() * lw, g() * lw, 0.85 + g() * 0.3, g()]);
    return pts;
  }

  function voronoi(lw, pts, tile) {
    const out = new Float32Array(lw * lw * 3);
    for (let y = 0; y < lw; y++) {
      for (let x = 0; x < lw; x++) {
        let d1 = 1e9, d2 = 1e9, id = 0;
        for (let i = 0; i < pts.length; i++) {
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (!tile && (ox || oy)) continue;
              const dx = x - (pts[i][0] + ox * lw), dy = y - (pts[i][1] + oy * lw);
              const d = Math.sqrt(dx * dx + dy * dy) * pts[i][2];
              if (d < d1) { d2 = d1; d1 = d; id = i; } else if (d < d2) d2 = d;
            }
          }
        }
        const o = (y * lw + x) * 3;
        out[o] = d2 - d1;
        out[o + 1] = id;
        out[o + 2] = d1;
      }
    }
    return out;
  }

  function slabTexture(ctx, w, h) {
    const lw = 160;
    const pts = cells(26, 11, lw);
    const vor = voronoi(lw, pts, true);
    const img = ctx.createImageData(lw, lw);
    const g = rand(13);
    for (let i = 0; i < lw * lw; i++) {
      const edge = vor[i * 3], id = vor[i * 3 + 1];
      const p = pts[id];
      const gap = clamp((edge - 0.4) / 5, 0, 1);
      const base = 0.55 + p[3] * 0.12;
      const warm = p[3] > 0.7 ? 0.035 : 0;
      const v = lerp(0.36, base, Math.sqrt(gap)) + (g() - 0.5) * 0.05;
      img.data[i * 4] = Math.round(clamp(v + warm, 0, 1) * 255);
      img.data[i * 4 + 1] = Math.round(clamp(v * 0.99 + warm * 0.7, 0, 1) * 255);
      img.data[i * 4 + 2] = Math.round(clamp(v * 0.97, 0, 1) * 255);
      img.data[i * 4 + 3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = lw;
    tmp.height = lw;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const x = g() * w, y = g() * h, r0 = 0.6 + g() * 1.6;
      ctx.fillStyle = g() < 0.5 ? `rgba(40,34,28,${0.12 + g() * 0.15})` : `rgba(235,228,214,${0.1 + g() * 0.12})`;
      ctx.beginPath();
      ctx.arc(x, y, r0, 0, PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(40,32,26,0.35)';
    for (let i = 0; i < 40; i++) {
      let x = g() * w, y = g() * h;
      ctx.lineWidth = 0.8 + g();
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (g() - 0.5) * 22;
        y += (g() - 0.5) * 22;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function grassTexture(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(29);
    for (let i = 0; i < 70; i++) {
      const x0 = w * (0.3 + g() * 0.4);
      const len = h * (0.45 + g() * 0.55);
      const lean = (g() - 0.5) * w * 0.9;
      const v = 0.72 + g() * 0.25;
      ctx.strokeStyle = css([v, v * 0.88, v * 0.6]);
      ctx.lineWidth = 0.8 + g() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x0, h);
      ctx.quadraticCurveTo(x0 + lean * 0.3, h - len * 0.6, x0 + lean, h - len);
      ctx.stroke();
    }
  }

  function grassTuft(b, x, z, size, seed) {
    const g = rand(seed);
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * PI + g() * 0.4;
      const dx = C(an) * size * 0.6, dz = S(an) * size * 0.6;
      const hgt = size * (0.8 + g() * 0.3);
      const n = [0, 1, 0];
      b.quad([x - dx, 0, z - dz], [x + dx, 0, z + dz], [x + dx * 1.3, hgt, z + dz * 1.3], [x - dx * 1.3, hgt, z - dz * 1.3], [0.62, 0.58, 0.48, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    }
  }

  const NUTS = { center: [-1.45, -0.35], spread: [0.45, 0.6], n: 34 };

  function buildYard(r) {
    const slab = r.texture(512, slabTexture);
    const grassTex = r.texture(128, grassTexture, { clamp: true });
    const ground = K.mesh(r, b => {
      const E = 24, T = 1.5;
      const n = [0, 1, 0];
      for (let i = -6; i < 6; i++) {
        for (let j = -6; j < 6; j++) {
          const x0 = i * (E / 6), z0 = j * (E / 6), x1 = x0 + E / 6, z1 = z0 + E / 6;
          b.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [0.68, 0.67, 0.65, 0], [[x0 / T, -z1 / T], [x1 / T, -z1 / T], [x1 / T, -z0 / T], [x0 / T, -z0 / T]], [n, n, n, n]);
        }
      }
    });
    const nuts = K.mesh(r, b => {
      const g = rand(41);
      for (let i = 0; i < NUTS.n; i++) {
        const a = g() * PI * 2, d = Math.sqrt(g());
        const x = NUTS.center[0] + C(a) * d * NUTS.spread[0], z = NUTS.center[1] + S(a) * d * NUTS.spread[1];
        const sz = 0.022 + g() * 0.014;
        const col = [0.46 + g() * 0.1, 0.34 + g() * 0.06, 0.16, 0];
        b.push(M4.translate(x, sz * 0.7, z), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.8));
        b.ellipsoid(sz, sz * 0.75, sz * 1.15, 8, 6, col);
        b.at(0, sz * 0.62, 0, h => h.ellipsoid(sz * 0.95, sz * 0.35, sz * 1.05, 8, 4, [col[0] * 0.75, col[1] * 0.72, col[2] * 0.8, 0]));
        b.pop();
      }
    });
    const grass = K.mesh(r, b => {
      grassTuft(b, -0.62, -0.3, 0.17, 3);
      grassTuft(b, 0.82, -0.55, 0.2, 5);
      grassTuft(b, -1.5, -0.95, 0.14, 7);
      grassTuft(b, 1.6, -1.5, 0.18, 9);
      grassTuft(b, -0.2, -1.9, 0.12, 11);
    });
    return { slab, grassTex, ground, nuts, grass };
  }

  function drawYard(r, Y) {
    r.draw(Y.ground, null, { texture: Y.slab });
    r.draw(Y.nuts, null);
    r.draw(Y.grass, null, { texture: Y.grassTex });
  }

  function cobbleTexture(ctx, w, h) {
    const lw = 128;
    const pts = cells(70, 23, lw);
    const vor = voronoi(lw, pts, true);
    const img = ctx.createImageData(lw, lw);
    const g = rand(19);
    for (let i = 0; i < lw * lw; i++) {
      const edge = vor[i * 3], id = vor[i * 3 + 1];
      const p = pts[id];
      const gap = clamp((edge - 0.6) / 2.4, 0, 1);
      const base = 0.46 + p[3] * 0.16;
      const v = lerp(0.2, base, gap) + (g() - 0.5) * 0.04;
      img.data[i * 4] = Math.round(clamp(v * 0.95, 0, 1) * 255);
      img.data[i * 4 + 1] = Math.round(clamp(v * 1.0, 0, 1) * 255);
      img.data[i * 4 + 2] = Math.round(clamp(v * 1.04, 0, 1) * 255);
      img.data[i * 4 + 3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = lw;
    tmp.height = lw;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, w, h);
  }

  function groundTexture(ctx, w, h) {
    const g = rand(37);
    ctx.fillStyle = '#5b5a3c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = g();
      ctx.fillStyle = v < 0.4 ? `rgba(70,96,40,${0.4 + g() * 0.4})` : v < 0.7 ? `rgba(118,104,72,${0.3 + g() * 0.4})` : `rgba(40,52,26,${0.3 + g() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 2 + g() * 6, 1 + g() * 3, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  const CAMP = {
    trees: [[-6.8, -1.6, 2.4, 0x2e5222], [-8.2, 2.3, 2.0, 0x385c26], [-3.2, -7.4, 2.2, 0x2c4e20], [-9.5, -5.0, 2.8, 0x2a4a20], [9.4, -5.6, 2.6, 0x26481e], [9.8, 3.8, 2.4, 0x2e5222], [6.6, -7.8, 2.2, 0x2c4e20], [-0.6, -8.6, 1.8, 0x36582c], [10.6, -0.8, 1.8, 0x2a4a20]],
    bushes: [[-5.4, 0.6, 1.0], [-4.6, 2.8, 0.9], [7.2, 3.2, 1.1], [8.4, 1.4, 0.9], [-7.2, -3.6, 1.1], [3.4, -6.6, 0.8], [-1.4, 3.4, 0.6], [5.2, 4.2, 0.8]],
    tents: [[-3.6, -2.7, 0.55, 3.2, 2.2, 0xa8423a], [-5.6, -1.4, 0.95, 2.2, 1.6, 0x9a3a32], [6.9, -2.6, -0.5, 3.0, 2.5, 0x3f5a3a], [8.1, 0.3, -0.2, 2.2, 1.8, 0x48624a]],
    torches: [[-4.0, -4.6], [-6.1, 1.1], [5.4, -2.7]],
    crates: [[-2.6, -5.2, 0.4], [-1.9, -5.6, 0.2], [-3.1, -5.9, 0.8], [3.9, -5.4, 0.1], [4.4, -5.0, 0.5], [-0.1, -6.8, 0.3]],
    carts: [[-0.85, -0.95, 0.6, true], [-5.3, 1.4, -0.3, false], [-2.2, -4.6, 0.2, false]],
    brazier: [7.7, 0.55],
    rug: [5.6, -0.85],
    people: [
      { p: [0.62, 1.15], yaw: -2.4, look: 'hero' },
      { p: [4.0, -5.2], yaw: 0.4, look: 'robe' },
      { p: [4.5, -5.5], yaw: 0.7, look: 'robe' },
      { p: [6.4, -0.6], yaw: -1.2, look: 'sit' },
      { p: [2.6, -7.8], yaw: 0.2, look: 'robe' },
      { p: [7.6, -6.8], yaw: 1.4, look: 'dark' }
    ]
  };

  function tree(b, x, z, s, col) {
    const g = rand(Math.round((x + 20) * 13 + (z + 20) * 7));
    b.push(M4.translate(x, 0, z));
    b.prism(6, 0.16 * s, 0.16 * s, 0, 0.1 * s, 0.1 * s, 1.6 * s, 0x4a3524, { capTop: false });
    for (let i = 0; i < 6; i++) {
      const a = g() * PI * 2, d = g() * 0.7 * s;
      const c = K.lerp(0.85, 1.15, g());
      const base = col;
      b.at(C(a) * d, (1.7 + g() * 0.9) * s, S(a) * d, h => h.ellipsoid((0.7 + g() * 0.4) * s, (0.55 + g() * 0.3) * s, (0.7 + g() * 0.4) * s, 8, 6, [((base >> 16) & 255) / 255 * c, ((base >> 8) & 255) / 255 * c, (base & 255) / 255 * c, 0]));
    }
    b.pop();
  }

  function tent(b, x, z, yaw, len, wid, col) {
    const hgt = wid * 0.62;
    const c = [((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255, 0];
    const dk = [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7, 0];
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    const L = len / 2, W = wid / 2;
    b.quad([-W, 0, -L], [-W, 0, L], [0, hgt, L], [0, hgt, -L], c);
    b.quad([W, 0, L], [W, 0, -L], [0, hgt, -L], [0, hgt, L], dk);
    b.tri([-W, 0, L], [W, 0, L], [0, hgt, L], [0.25, 0.18, 0.14, 0]);
    b.tri([W, 0, -L], [-W, 0, -L], [0, hgt, -L], dk);
    b.at(0, hgt, L + 0.05, h => h.box(0.06, 0.06, 0.12, 0x5a4030));
    b.pop();
  }

  function crate(b, x, z, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    b.box(0.7, 0.6, 0.6, 0x7a5a3a, { base: true });
    b.at(0, 0.6, 0, h => h.box(0.72, 0.04, 0.62, 0x5e4430));
    b.pop();
  }

  function cart(b, x, z, yaw, broken) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    if (broken) b.push(M4.rotZ(0.35));
    b.at(0, 0.45, 0, h => h.box(0.9, 0.08, 1.4, 0x6a4a30));
    b.at(0.45, 0.6, 0, h => h.box(0.05, 0.3, 1.4, 0x5a3e28));
    b.at(-0.45, 0.6, 0, h => h.box(0.05, 0.3, 1.4, 0x5a3e28));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.5, 0.32, 0), M4.rotZ(PI / 2));
      b.prism(10, 0.32, 0.32, -0.04, 0.32, 0.32, 0.04, 0x4a3422, { capBottom: true });
      b.pop();
    });
    b.at(0, 0.45, 0.95, h => h.box(0.06, 0.06, 0.8, 0x5a3e28));
    if (broken) b.pop();
    b.pop();
  }

  function figure(b, look) {
    const skin = 0xd8a080;
    if (look === 'sit') {
      b.at(0, 0.3, 0, h => h.box(0.36, 0.3, 0.5, 0x3c5a48));
      b.at(0, 0.6, 0, h => h.box(0.38, 0.45, 0.24, 0x4a6a52));
      b.at(0, 0.95, 0, h => h.ellipsoid(0.11, 0.13, 0.11, 8, 6, skin));
      b.at(0, 1.02, -0.02, h => h.ellipsoid(0.12, 0.09, 0.12, 8, 5, 0x2a1c14));
      return;
    }
    const body = look === 'hero' ? 0x6c7078 : look === 'robe' ? 0xd8d4c8 : 0x3a3036;
    const legs = look === 'hero' ? 0x4a4c52 : body;
    if (look === 'robe') {
      b.prism(8, 0.26, 0.24, 0, 0.17, 0.15, 1.2, body, { capTop: true });
    } else {
      [-1, 1].forEach(s => b.at(s * 0.1, 0, 0, h => h.prism(6, 0.075, 0.08, 0, 0.09, 0.09, 0.85, legs)));
      if (look !== 'hero') b.at(0, 1.1, 0, h => h.box(0.42, 0.55, 0.26, body));
    }
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.26, 1.3, 0), M4.rotZ(s * 0.12));
      b.prism(6, 0.06, 0.06, -0.62, 0.075, 0.075, 0, look === 'hero' ? 0x7c8088 : body);
      b.pop();
    });
    if (look === 'hero') {
      b.prism(8, 0.18, 0.12, 0.84, 0.22, 0.14, 1.4, 0x5e6672, { capTop: true });
      b.at(0, 0.86, 0, h => h.prism(8, 0.19, 0.13, 0, 0.19, 0.13, 0.08, 0x4a3020, { capTop: false }));
      [-1, 1].forEach(s => {
        b.at(s * 0.1, 0, 0.02, h => h.prism(6, 0.085, 0.1, 0, 0.08, 0.09, 0.3, 0x3a2a1e));
        b.at(s * 0.2, 1.38, 0, h => h.ellipsoid(0.14, 0.09, 0.15, 8, 5, 0x8a8e96));
      });
      const red = [0.62, 0.1, 0.1, 0], dk = [0.42, 0.06, 0.06, 0];
      const rows = [[1.38, 0.28, -0.13], [0.95, 0.36, -0.24], [0.5, 0.4, -0.3], [0.12, 0.42, -0.32]];
      for (let i = 0; i < rows.length - 1; i++) {
        const [y0, w0, z0] = rows[i], [y1, w1, z1] = rows[i + 1];
        b.quad([-w0, y0, z0], [0, y0, z0 - 0.04], [0, y1, z1 - 0.06], [-w1, y1, z1], i % 2 ? dk : red);
        b.quad([0, y0, z0 - 0.04], [w0, y0, z0], [w1, y1, z1], [0, y1, z1 - 0.06], i % 2 ? red : dk);
      }
      K.tube(b, [[-0.28, 0.7, -0.22], [-0.05, 1.05, -0.3], [0.2, 1.45, -0.24], [0.32, 1.7, -0.14]], [0.02, 0.025, 0.025, 0.02], 5, 0x4a3018);
      b.at(0, 1.6, 0, h => h.ellipsoid(0.11, 0.13, 0.12, 8, 6, skin));
      b.at(0, 1.67, -0.03, h => h.ellipsoid(0.125, 0.1, 0.14, 8, 5, 0x3a2c22));
    } else {
      b.at(0, 1.48, 0, h => h.ellipsoid(0.11, 0.13, 0.11, 8, 6, skin));
      b.at(0, 1.55, -0.02, h => h.ellipsoid(0.12, 0.09, 0.12, 8, 5, look === 'robe' ? 0xc8c0b0 : 0x2a1c14));
    }
  }

  function buildCamp(r) {
    const cobble = r.texture(256, cobbleTexture);
    const dirt = r.texture(256, groundTexture);
    const plaza = K.mesh(r, b => {
      const n = [0, 1, 0];
      const pts = [];
      const N = 28;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * PI * 2;
        const rr = 5.6 + S(a * 3) * 0.6 + C(a * 5) * 0.4;
        pts.push([1.6 + C(a) * rr * 1.25, 0.012, -1.4 + S(a) * rr]);
      }
      const T = 1.6;
      const c = [1.6, 0.012, -1.4];
      for (let i = 0; i < N; i++) {
        const p0 = pts[i], p1 = pts[(i + 1) % N];
        b.tri(c, p0, p1, [0.95, 0.95, 0.95, 0], [[c[0] / T, c[2] / T], [p0[0] / T, p0[2] / T], [p1[0] / T, p1[2] / T]], [n, n, n]);
      }
    });
    const field = K.mesh(r, b => {
      const n = [0, 1, 0], T = 4;
      b.quad([-16, 0, 10], [18, 0, 10], [18, 0, -14], [-16, 0, -14], [1, 1, 1, 0], [[-16 / T, 10 / T], [18 / T, 10 / T], [18 / T, -14 / T], [-16 / T, -14 / T]], [n, n, n, n]);
    });
    const props = K.mesh(r, b => {
      CAMP.trees.forEach(([x, z, s, col]) => tree(b, x, z, s, col));
      CAMP.bushes.forEach(([x, z, s]) => b.at(x, 0.3 * s, z, h => h.ellipsoid(0.8 * s, 0.5 * s, 0.7 * s, 8, 5, 0x3a5a26)));
      CAMP.tents.forEach(([x, z, yaw, len, wid, col]) => tent(b, x, z, yaw, len, wid, col));
      CAMP.crates.forEach(([x, z, yaw]) => crate(b, x, z, yaw));
      CAMP.carts.forEach(([x, z, yaw, broken]) => cart(b, x, z, yaw, broken));
      CAMP.torches.forEach(([x, z]) => b.at(x, 0, z, h => h.prism(5, 0.04, 0.04, 0, 0.05, 0.05, 1.5, 0x3a2a1c)));
      b.at(CAMP.brazier[0], 0, CAMP.brazier[1], h => {
        h.prism(8, 0.22, 0.22, 0, 0.45, 0.45, 0.55, 0x3a3434);
        h.at(0, 0.56, 0, q => q.ellipsoid(0.42, 0.08, 0.42, 10, 4, [0.95, 0.25, 0.1, 0.9]));
      });
      b.at(CAMP.rug[0], 0.02, CAMP.rug[1], h => {
        h.push(M4.rotY(0.3));
        h.box(2.0, 0.02, 1.3, 0x7a2a2a);
        h.at(0, 0.012, 0, q => q.box(1.6, 0.02, 0.9, 0x2c4a6a));
        h.pop();
      });
      const g = rand(51);
      for (let i = 0; i < 40; i++) {
        const a = g() * PI * 2, d = Math.sqrt(g()) * 0.45;
        b.at(0.12 + C(a) * d * 1.3, 0.04, -1.0 + S(a) * d, h => h.ellipsoid(0.08, 0.06, 0.09, 6, 4, [0.5 + g() * 0.1, 0.33, 0.12, 0]));
      }
      CAMP.people.forEach(pp => {
        b.push(M4.translate(pp.p[0], 0, pp.p[1]), M4.rotY(pp.yaw));
        figure(b, pp.look);
        b.pop();
      });
    });
    const flame = K.mesh(r, b => {
      b.prism(6, 0.09, 0.09, 0, 0, 0, 0.32, [1, 0.62, 0.18, 1]);
      b.at(0, 0.02, 0, h => h.prism(6, 0.05, 0.05, 0, 0, 0, 0.2, [1, 0.92, 0.6, 1]));
    });
    return { cobble, dirt, plaza, field, props, flame };
  }

  function drawCamp(r, Cp, t) {
    r.draw(Cp.field, null, { texture: Cp.dirt });
    r.draw(Cp.plaza, null, { texture: Cp.cobble });
    r.draw(Cp.props, null);
    CAMP.torches.forEach(([x, z], i) => {
      const f = 1 + S(t * 17 + i * 2) * 0.12 + S(t * 9.3 + i) * 0.08;
      r.draw(Cp.flame, M4.chain(M4.translate(x, 1.5, z), M4.scale(1, f, 1)), { noFog: true });
    });
  }

  window.GrubWorld = { NUTS, CAMP, buildYard, drawYard, buildCamp, drawCamp };
})();
