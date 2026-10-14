(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;

  const BED = { x0: -1.0, x1: 1.0, z0: 0.02, z1: 0.9, top: 0.47 };

  function texSheet(ctx, w, h) {
    const g = rand(9);
    ctx.fillStyle = '#e092a4';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(150, 60, 80, 0.12)' : 'rgba(255, 190, 200, 0.12)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 10 + g() * 30, 3 + g() * 6, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    const flower = (x, y, s, col, kind) => {
      ctx.fillStyle = col;
      if (kind === 0) {
        ctx.beginPath();
        ctx.moveTo(x - s, y - s * 0.6);
        ctx.lineTo(x - s * 0.5, y - s * 1.1);
        ctx.lineTo(x, y - s * 0.5);
        ctx.lineTo(x + s * 0.5, y - s * 1.1);
        ctx.lineTo(x + s, y - s * 0.6);
        ctx.quadraticCurveTo(x + s, y + s * 0.6, x, y + s * 0.7);
        ctx.quadraticCurveTo(x - s, y + s * 0.6, x - s, y - s * 0.6);
        ctx.fill();
      } else {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * PI * 2;
          ctx.beginPath();
          ctx.ellipse(x + C(a) * s * 0.55, y + S(a) * s * 0.55, s * 0.45, s * 0.3, a, 0, PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#e8c86a';
        ctx.beginPath();
        ctx.arc(x, y, s * 0.25, 0, PI * 2);
        ctx.fill();
      }
    };
    for (let i = 0; i < 22; i++) {
      const x = g() * w, y = g() * h;
      const r0 = g();
      const col = r0 < 0.45 ? '#e6c45a' : r0 < 0.7 ? '#8f86c2' : r0 < 0.85 ? '#f0a9b6' : '#7fa6c8';
      flower(x, y, 7 + g() * 6, col, r0 < 0.45 ? 0 : 1);
      ctx.strokeStyle = 'rgba(96, 140, 90, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.quadraticCurveTo(x + 6, y + 14, x + 3, y + 20);
      ctx.stroke();
    }
  }

  const PATCH = ['#7a4c2c', '#b99263', '#e8d6b4', '#c2853f', '#4e3020', '#a8743f', '#dcc192', '#8e603a', '#efe2c6'];

  function texBlanket(ctx, w, h) {
    const g = rand(23);
    ctx.fillStyle = '#c0976a';
    ctx.fillRect(0, 0, w, h);
    const cols = 4, rows = 4;
    const cw = w / cols, rh = h / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const split = g() < 0.5;
        const parts = split ? [[0, 0, 0.55, 1], [0.55, 0, 0.45, 0.5], [0.55, 0.5, 0.45, 0.5]] : [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]];
        parts.forEach(([px, py, pw, ph], k) => {
          const x = i * cw + px * cw, y = j * rh + py * rh, ww = pw * cw, hh = ph * rh;
          const col = PATCH[Math.floor(g() * PATCH.length)];
          ctx.fillStyle = col;
          ctx.fillRect(x, y, ww, hh);
          const motif = g();
          if (motif < 0.35) {
            ctx.strokeStyle = 'rgba(60, 30, 14, 0.55)';
            ctx.lineWidth = 1;
            for (let s = 3; s < hh - 2; s += 4) {
              ctx.beginPath();
              ctx.moveTo(x + 3, y + s);
              ctx.lineTo(x + ww * (0.4 + g() * 0.5), y + s);
              ctx.stroke();
            }
          } else if (motif < 0.55) {
            ctx.strokeStyle = 'rgba(250, 236, 200, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(x + ww / 2, y + hh / 2, ww * 0.3, hh * 0.3, 0, 0, PI * 2);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(70, 40, 20, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1);
          if (k === 0 && g() < 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(x, y, ww, hh * 0.3);
          }
        });
      }
    }
    ctx.strokeStyle = 'rgba(80, 50, 30, 0.22)';
    ctx.lineWidth = 1;
    for (let s = -h; s < w; s += 16) {
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(s + h, h);
      ctx.stroke();
    }
  }

  function texWall(ctx, w, h) {
    const g = rand(4);
    ctx.fillStyle = '#f0e4bc';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(170, 150, 100, 0.07)' : 'rgba(255, 250, 230, 0.08)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 4 + g() * 22, 3 + g() * 14, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function texWood(ctx, w, h) {
    const g = rand(31);
    ctx.fillStyle = '#3a2416';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = g() < 0.5 ? 'rgba(20, 10, 6, 0.4)' : 'rgba(120, 76, 44, 0.25)';
      ctx.lineWidth = 1 + g() * 2;
      ctx.beginPath();
      const x = g() * w;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (g() - 0.5) * 10, h * 0.3, x + (g() - 0.5) * 10, h * 0.7, x + (g() - 0.5) * 6, h);
      ctx.stroke();
    }
  }

  function texCloth(base, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.strokeStyle = g() < 0.5 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1 + g() * 3;
        ctx.beginPath();
        const x = g() * w, y = g() * h;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (g() - 0.5) * 40, y + (g() - 0.5) * 20, x + (g() - 0.5) * 60, y + (g() - 0.5) * 30);
        ctx.stroke();
      }
    };
  }

  function blob(b, cx, cy, cz, rx, ry, rz, seed, uvs, col, rot) {
    const g = rand(seed);
    const nu = 12, nv = 7;
    const bumps = [];
    for (let i = 0; i < 6; i++) bumps.push([g() * PI * 2, g() * PI, 0.06 + g() * 0.1, g() * 3]);
    const pt = (u, v) => {
      const yaw = u * PI * 2, pit = -PI / 2 + v * PI;
      let k = 1;
      bumps.forEach(([a, p, amp, f]) => { k += amp * S(yaw * (1 + f) + a) * C(pit * 2 + p); });
      const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
      return { p: [n[0] * rx * k, n[1] * ry * k, n[2] * rz * k], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    b.push(M4.translate(cx, cy, cz), M4.rotY(rot || 0));
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        b.quad(a.p, bb.p, c.p, d.p, col || [1, 1, 1, 0], [[u0 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v1 * uvs[1]], [u0 * uvs[0], v1 * uvs[1]]], [a.n, bb.n, c.n, d.n]);
      }
    }
    b.pop();
  }

  const HEAPS = {
    wall: { x0: -0.98, x1: 1.04, z0: 0.03, z1: 0.62, nu: 30, nv: 9, seed: 3, ridges: [[-0.6, 0.16, 0.1, 0.7, 0.16, 0.1], [-0.05, 0.14, -0.08, 0.8, 0.2, 0.12], [0.55, 0.18, 0.15, 0.7, 0.18, 0.11], [0.2, 0.36, 0.3, 0.5, 0.09, 0.07], [-0.35, 0.4, -0.2, 0.45, 0.07, 0.06], [0.85, 0.42, 1.2, 0.5, 0.14, 0.09]] },
    foot: { x0: 0.28, x1: 1.06, z0: 0.03, z1: 0.86, nu: 16, nv: 14, seed: 5, ridges: [[0.55, 0.16, 0.05, 0.6, 0.2, 0.11], [0.86, 0.3, 1.3, 0.5, 0.26, 0.13], [0.62, 0.5, 0.6, 0.45, 0.17, 0.09], [0.9, 0.68, 1.5, 0.4, 0.19, 0.1], [0.45, 0.7, -0.4, 0.3, 0.08, 0.06], [0.72, 0.36, -0.9, 0.35, 0.12, 0.07]] },
    back: { x0: -0.55, x1: 1.06, z0: 0.03, z1: 0.6, nu: 26, nv: 9, seed: 7, ridges: [[-0.25, 0.14, 0.05, 0.6, 0.12, 0.09], [0.3, 0.15, -0.1, 0.7, 0.17, 0.11], [0.8, 0.2, 0.3, 0.55, 0.24, 0.13], [0.95, 0.42, 1.4, 0.4, 0.17, 0.1], [0.55, 0.4, 0.5, 0.35, 0.09, 0.07]] }
  };

  function heapHeight(hp, x, z) {
    let h = 0;
    hp.ridges.forEach(([cx, cz, a, len, height, width], i) => {
      const dx = x - cx, dz = z - cz;
      const along = dx * C(a) + dz * S(a);
      const across = -dx * S(a) + dz * C(a);
      const w = 1 - clamp((Math.abs(along) - len / 2 + 0.1) / 0.18, 0, 1);
      const ripple = 1 + 0.18 * S(along * 15 + i * 2.1 + hp.seed);
      h = Math.max(h, height * Math.exp(-(across / width) * (across / width)) * w * w * ripple);
    });
    return h;
  }

  function buildBed(b) {
    const metal = [0.08, 0.08, 0.09, 0];
    b.at(0, 0.12, (BED.z0 + BED.z1) / 2, h => h.box(BED.x1 - BED.x0, 0.16, BED.z1 - BED.z0 - 0.04, metal, { base: true }));
    const white = [0.92, 0.91, 0.88, 0];
    for (let i = 0; i < 3; i++) {
      const y0 = 0.28 + i * 0.062;
      b.at((BED.x0 + BED.x1) / 2, y0, (BED.z0 + BED.z1) / 2, h => h.box(BED.x1 - BED.x0 - 0.01 * i, 0.058, BED.z1 - BED.z0 - 0.01 * i, i % 2 ? shade(white, 0.96) : white, { base: true }));
    }
    [[BED.x0 - 0.02, 0.05], [BED.x0 - 0.02, 0.87]].forEach(([x, z]) => {
      b.at(x, 0, z, h => h.prism(8, 0.018, 0.018, 0, 0.018, 0.018, 0.98, metal));
      b.at(x, 0.99, z, h => h.ellipsoid(0.03, 0.03, 0.03, 8, 4, [0.55, 0.42, 0.18, 0.15]));
    });
    for (let i = 1; i < 7; i++) {
      const z = 0.05 + (0.82 * i) / 7;
      b.at(BED.x0 - 0.02, 0.45, z, h => h.prism(6, 0.009, 0.009, 0, 0.009, 0.009, 0.42, metal));
    }
    [0.45, 0.66, 0.87].forEach(y => {
      b.push(M4.translate(BED.x0 - 0.02, y, 0.05), M4.rotX(PI / 2));
      b.prism(6, 0.012, 0.012, 0, 0.012, 0.012, 0.82, metal);
      b.pop();
    });
    tube(b, [[BED.x0 - 0.02, 0.92, 0.87], [BED.x0 - 0.12, 0.84, 0.92], [BED.x0 - 0.24, 0.7, 0.96], [BED.x0 - 0.34, 0.58, 0.99]], [0.009, 0.009, 0.009, 0.009], 5, [0.62, 0.48, 0.22, 0.1]);
  }

  function buildSheet(b) {
    const g = rand(12);
    const nx = 16, nz = 6;
    const top = (x, z) => BED.top + 0.012 * S(x * 9 + z * 4) * S(z * 7 + x * 2) + 0.006 * g();
    const grid = [];
    for (let j = 0; j <= nz; j++) {
      const row = [];
      for (let i = 0; i <= nx; i++) {
        const x = BED.x0 - 0.01 + ((BED.x1 - BED.x0 + 0.02) * i) / nx;
        const z = BED.z0 + ((BED.z1 - BED.z0 + 0.02) * j) / nz;
        row.push([x, top(x, z), z]);
      }
      grid.push(row);
    }
    const uv = (p) => [p[0] * 1.4, p[2] * 1.4];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
      b.quad(a, c, d, e, [1, 1, 1, 0], [uv(a), uv(c), uv(d), uv(e)]);
    }
    const front = BED.z1 + 0.02;
    for (let i = 0; i < nx; i++) {
      const xa = grid[nz][i][0], xb = grid[nz][i + 1][0];
      const da = 0.2 + 0.05 * S(xa * 7), db = 0.2 + 0.05 * S(xb * 7);
      const n = [0, 0, 1];
      b.quad([xa, grid[nz][i][1], front], [xb, grid[nz][i + 1][1], front], [xb, BED.top - db, front + 0.02], [xa, BED.top - da, front + 0.02], [1, 1, 1, 0], [[xa * 1.4, 0], [xb * 1.4, 0], [xb * 1.4, -db * 1.4], [xa * 1.4, -da * 1.4]], [n, n, n, n]);
    }
    const nl = [-1, 0, 0];
    b.quad([BED.x0 - 0.01, BED.top, BED.z0], [BED.x0 - 0.01, BED.top, front], [BED.x0 - 0.012, BED.top - 0.06, front], [BED.x0 - 0.012, BED.top - 0.06, BED.z0], [1, 1, 1, 0], [[0, 0], [1.2, 0], [1.2, 0.1], [0, 0.1]], [nl, nl, nl, nl]);
  }

  function buildPillow(b) {
    const col = [1, 1, 1, 0];
    b.push(M4.translate(-0.93, 0.62, 0.3), M4.rotZ(-1.25), M4.rotY(0.04));
    blob(b, 0, 0, 0, 0.14, 0.065, 0.25, 41, [1, 1], col);
    b.pop();
    blob(b, -0.88, 0.53, 0.72, 0.15, 0.065, 0.22, 43, [1, 1], [0.92, 0.88, 0.8, 0]);
  }

  function buildSideTable(b) {
    const wood = [0.42, 0.3, 0.22, 0];
    b.at(-1.25, 0, 0.62, h => h.prism(10, 0.05, 0.05, 0, 0.05, 0.05, 0.58, wood));
    b.at(-1.25, 0.58, 0.62, h => h.prism(14, 0.2, 0.2, 0, 0.2, 0.2, 0.04, wood));
  }

  function buildBottle(b) {
    const clear = [0.78, 0.86, 0.92, 0.25];
    b.at(0, 0, 0, h => h.prism(10, 0.045, 0.045, 0, 0.045, 0.045, 0.24, clear));
    b.at(0, 0.24, 0, h => h.prism(10, 0.045, 0.045, 0, 0.016, 0.016, 0.07, clear));
    b.at(0, 0.31, 0, h => h.prism(8, 0.017, 0.017, 0, 0.017, 0.017, 0.025, [0.2, 0.36, 0.8, 0.2]));
    b.at(0, 0.09, 0, h => h.prism(10, 0.047, 0.047, 0, 0.047, 0.047, 0.07, [0.26, 0.48, 0.86, 0.2]));
  }

  function buildWardrobe(b) {
    const wood = [1, 1, 1, 0];
    b.at(-1.82, 0, 0.32, h => h.box(0.6, 2.1, 0.6, wood, { base: true, uvScale: 1.5 }));
    b.at(-1.52, 1.75, 0.63, h => h.box(0.06, 0.14, 0.01, [0.9, 0.88, 0.84, 0.3]));
  }

  function buildChair(b) {
    const wood = [1, 1, 1, 0];
    const x = 1.38, z = 0.52;
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([dx, dz]) => b.at(x + dx, 0, z + dz, h => h.box(0.04, 0.45, 0.04, wood, { base: true })));
    b.at(x, 0.45, z, h => h.box(0.46, 0.04, 0.46, wood, { base: true }));
    [-0.2, 0.2].forEach(dz => b.at(x - 0.2, 0.45, z + dz, h => h.box(0.04, 0.55, 0.04, wood, { base: true })));
    b.at(x - 0.2, 0.86, z, h => h.box(0.04, 0.12, 0.44, wood, { base: true }));
  }

  function buildCabinet(b) {
    const wood = [1, 1, 1, 0];
    b.at(1.95, 0, 0.22, h => h.box(0.8, 1.95, 0.44, wood, { base: true, uvScale: 1.5 }));
    const inner = [0.12, 0.08, 0.06, 0];
    [0.9, 1.3].forEach(y => b.at(1.95, y, 0.45, h => h.box(0.72, 0.32, 0.01, inner, { base: true })));
    b.at(1.75, 1.32, 0.38, h => h.prism(10, 0.035, 0.035, 0, 0.035, 0.035, 0.12, [0.75, 0.12, 0.1, 0.1]));
    b.at(2.05, 1.32, 0.38, h => h.prism(8, 0.05, 0.05, 0, 0.04, 0.04, 0.16, [0.3, 0.3, 0.32, 0.1]));
    b.at(1.9, 0.92, 0.38, h => h.box(0.3, 0.06, 0.14, [0.55, 0.55, 0.58, 0.1], { base: true }));
  }

  function buildClothes(b) {
    blob(b, 1.17, 0.88, 0.52, 0.06, 0.14, 0.24, 61, [1, 1], [0.12, 0.13, 0.17, 0]);
    blob(b, 1.24, 0.62, 0.54, 0.08, 0.24, 0.22, 63, [1, 1], [0.1, 0.11, 0.15, 0]);
  }

  function buildArmchair(b) {
    const lt = [0.32, 0.2, 0.15, 0.04];
    b.at(0, 0.2, 0, h => h.box(0.8, 0.4, 0.8, shade(lt, 0.8), { base: true }));
    b.at(0, 0.45, -0.32, h => h.box(0.8, 0.55, 0.2, lt, { base: true }));
    [-0.38, 0.38].forEach(x => b.at(x, 0.4, 0.02, h => h.box(0.16, 0.32, 0.8, lt, { base: true })));
    b.at(0, 0.5, 0.05, h => h.box(0.6, 0.12, 0.6, shade(lt, 1.15), { base: true }));
  }

  function buildFloorPhone(b) {
    b.box(0.075, 0.012, 0.15, [0.06, 0.06, 0.07, 0], { base: true });
    b.quad([-0.033, 0.0125, 0.068], [0.033, 0.0125, 0.068], [0.033, 0.0125, -0.068], [-0.033, 0.0125, -0.068], [0.8, 0.88, 1, 1]);
  }

  function buildHeap(b, key) {
    const hp = HEAPS[key];
    const g = rand(hp.seed);
    const grid = [];
    for (let j = 0; j <= hp.nv; j++) {
      const row = [];
      for (let i = 0; i <= hp.nu; i++) {
        const x = lerp(hp.x0, hp.x1, i / hp.nu);
        const z = lerp(hp.z0, hp.z1, j / hp.nv);
        const edge = Math.min(i, j, hp.nu - i, hp.nv - j) === 0;
        let y = BED.top + 0.012 + (edge ? 0 : heapHeight(hp, x, z) + 0.008 * g());
        if (x > BED.x1) y -= (x - BED.x1) * 2.5;
        row.push([x + (edge ? 0 : (g() - 0.5) * 0.02), y, z + (edge ? 0 : (g() - 0.5) * 0.02)]);
      }
      grid.push(row);
    }
    const nrm = (i, j) => {
      const l = grid[j][Math.max(0, i - 1)], r = grid[j][Math.min(hp.nu, i + 1)];
      const d = grid[Math.max(0, j - 1)][i], u = grid[Math.min(hp.nv, j + 1)][i];
      const n = V3.norm(V3.cross(V3.sub(u, d), V3.sub(r, l)));
      return n[1] < 0 ? V3.mul(n, -1) : n;
    };
    const uv = (p) => [p[0] * 1.15, p[2] * 1.15];
    for (let j = 0; j < hp.nv; j++) for (let i = 0; i < hp.nu; i++) {
      const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
      b.quad(a, c, d, e, [1, 1, 1, 0], [uv(a), uv(c), uv(d), uv(e)], [nrm(i, j), nrm(i + 1, j), nrm(i + 1, j + 1), nrm(i, j + 1)]);
    }
  }

  function makeCloth(r, nu, nv) {
    const gl = r.gl;
    const vbo = gl.createBuffer();
    const count = nu * nv * 6;
    const data = new Float32Array(count * 12);
    const obj = { vbo, count, nu, nv, data };
    obj.update = (pos) => {
      const at = (i, j) => pos[j * (nu + 1) + i];
      const nrm = (i, j) => {
        const l = at(Math.max(0, i - 1), j), rr = at(Math.min(nu, i + 1), j);
        const d = at(i, Math.max(0, j - 1)), u = at(i, Math.min(nv, j + 1));
        const n = V3.cross(V3.sub(u, d), V3.sub(rr, l));
        return n[1] < 0 ? V3.norm(V3.mul(n, -1)) : V3.norm(n);
      };
      let o = 0;
      const put = (i, j) => {
        const p = at(i, j), n = nrm(i, j);
        data[o++] = p[0]; data[o++] = p[1]; data[o++] = p[2];
        data[o++] = n[0]; data[o++] = n[1]; data[o++] = n[2];
        data[o++] = 1; data[o++] = 1; data[o++] = 1; data[o++] = 0;
        data[o++] = (i / nu) * 2.2; data[o++] = (j / nv) * 1.5;
      };
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          put(i, j); put(i + 1, j); put(i + 1, j + 1);
          put(i, j); put(i + 1, j + 1); put(i, j + 1);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    };
    return obj;
  }

  function bodyTop(spheres, x, z, pad, reachPad) {
    let best = -1;
    for (let k = 0; k < spheres.length; k++) {
      const c = spheres[k][0], rr = spheres[k][1] + pad;
      const dx = x - c[0], dz = z - c[2];
      const reach = rr + (reachPad === undefined ? 0.26 : reachPad);
      const d2 = dx * dx + dz * dz;
      if (d2 >= reach * reach) continue;
      const q = 1 - d2 / (reach * reach);
      best = Math.max(best, c[1] + rr * Math.pow(q, 0.75));
    }
    return best;
  }

  function drape(spheres, o, t) {
    const nu = o.nu, nv = o.nv;
    const H = [];
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const x = lerp(o.x0, o.x1, i / nu);
        const z = lerp(o.z0, o.z1, j / nv);
        let y = Math.max(BED.top + 0.04, bodyTop(spheres, x, z, 0.035, o.reach));
        if (z > BED.z1 + 0.02) y = Math.max(BED.top - 0.16, Math.min(y, BED.top + 0.04) - (z - BED.z1) * 1.2);
        if (x > BED.x1 + 0.02) y = Math.min(y, BED.top + 0.04) - (x - BED.x1) * 1.4;
        H.push(y);
      }
    }
    const idx = (i, j) => j * (nu + 1) + i;
    for (let it = 0; it < 4; it++) {
      const copy = H.slice();
      for (let j = 1; j < nv; j++) for (let i = 1; i < nu; i++) {
        const avg = (copy[idx(i - 1, j)] + copy[idx(i + 1, j)] + copy[idx(i, j - 1)] + copy[idx(i, j + 1)]) / 4;
        H[idx(i, j)] = Math.max(copy[idx(i, j)] - 0.03, lerp(copy[idx(i, j)], avg, 0.5));
      }
    }
    const pos = [];
    const lift = o.lift || 0;
    const bunch = o.bunch || 0;
    const air = o.air || 0;
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv;
        const x = lerp(o.x0, o.x1, u);
        const z = lerp(o.z0, o.z1, v);
        const puff = 0.022 * Math.sqrt(Math.abs(S(u * PI * 8.8) * S(v * PI * 6)));
        const folds = bunch * Math.max(0, 0.07 * S(u * 9.1 + 1.3) * C(v * 5.3 - 0.7) + 0.035 * S(u * 23 + v * 7));
        const wob = 0.012 * S(i * 0.9 + j * 0.35 + (o.seed || 0)) * C(j * 1.1 - i * 0.2) + 0.004 * S(t * 2 + u * 9 + v * 5);
        const dl = lift ? lift * Math.exp(-((x - o.liftX) * (x - o.liftX) + (z - 0.5) * (z - 0.5)) / 0.12) : 0;
        const fly = air ? air * (0.2 + 0.8 * S(PI * v)) * (0.5 + 0.5 * S(PI * u)) + air * 0.08 * S(t * 11 + u * 6 + v * 4) : 0;
        pos.push([x + 0.01 * S(j * 1.6 + i * 0.5), H[idx(i, j)] + puff + folds + wob + dl + fly, z]);
      }
    }
    return pos;
  }

  function buildStatic(r) {
    const T = {
      sheet: r.texture(256, texSheet),
      blanket: r.texture(256, texBlanket),
      wall: r.texture(256, texWall),
      wood: r.texture(128, texWood),
      pillow: r.texture(64, texCloth('#cfc3ad', 3)),
      leather: r.texture(64, texCloth('#4a2c20', 5))
    };
    const M = {
      wall: mesh(r, b => {
        const n = [0, 0, 1];
        b.quad([-3.5, 0, 0], [3.5, 0, 0], [3.5, 2.8, 0], [-3.5, 2.8, 0], [1, 1, 1, 0], [[0, 0], [3.2, 0], [3.2, 1.3], [0, 1.3]], [n, n, n, n]);
      }),
      floor: mesh(r, b => b.quad([-3.5, 0, 0], [-3.5, 0, 6], [3.5, 0, 6], [3.5, 0, 0], [0.24, 0.17, 0.13, 0])),
      bed: mesh(r, buildBed),
      sheet: mesh(r, buildSheet),
      pillow: mesh(r, buildPillow),
      table: mesh(r, buildSideTable),
      bottle: mesh(r, buildBottle),
      wardrobe: mesh(r, buildWardrobe),
      chair: mesh(r, buildChair),
      cabinet: mesh(r, buildCabinet),
      clothes: mesh(r, buildClothes),
      armchair: mesh(r, buildArmchair),
      floorPhone: mesh(r, buildFloorPhone),
      heaps: {}
    };
    Object.keys(HEAPS).forEach(k => { M.heaps[k] = mesh(r, b => buildHeap(b, k)); });
    return { T, M };
  }

  function drawRoom(r, R, props) {
    const { T, M } = R;
    r.draw(M.wall, null, { texture: T.wall });
    r.draw(M.floor);
    r.draw(M.bed);
    r.draw(M.sheet, null, { texture: T.sheet });
    r.draw(M.pillow, null, { texture: T.pillow });
    r.draw(M.table);
    r.draw(M.bottle, M4.translate(-1.15, 0.62, 0.68));
    r.draw(M.wardrobe, null, { texture: T.wood });
    const moved = (key, cx, cz) => {
      const o = props[key];
      return o ? M4.chain(M4.translate(o[0], 0, o[1]), M4.rotY(o[2] || 0), M4.translate(-cx, 0, -cz)) : null;
    };
    r.draw(M.chair, moved('chair', 1.38, 0.52), { texture: T.wood });
    if (props.clothes) r.draw(M.clothes, moved('chair', 1.38, 0.52));
    r.draw(M.cabinet, moved('cabinet', 1.95, 0.22), { texture: T.wood });
    if (props.armchair) r.draw(M.armchair, M4.chain(M4.translate(props.armchair[0], 0, props.armchair[1]), M4.rotY(props.armchair[2] || 0)), { texture: T.leather });
    if (props.floorPhone) r.draw(M.floorPhone, M4.chain(M4.translate(props.floorPhone[0], 0.002, props.floorPhone[1]), M4.rotY(props.floorPhone[2] || 0)));
    if (props.heap) r.draw(M.heaps[props.heap], props.heapM || null, { texture: T.blanket, tint: [0.92, 0.88, 0.84] });
  }

  window.VladRoom = { BED, HEAPS, buildStatic, drawRoom, makeCloth, drape, bodyTop, blob };
})();
