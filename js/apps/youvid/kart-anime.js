(function () {
  const { M4, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;

  const HAIR = 0xe24c66, HAIR_DARK = 0xb4304e, HAIR_HI = 0xf48ca0;
  const SKIN = 0xfde6da, SKIN_SH = 0xf2c4b2;
  const KIMONO = 0x5c3c3e, KIMONO_HI = 0x7e565c, KIMONO_SH = 0x40282a;
  const R = 0.082;

  const cel = (hex, k) => {
    const c = shade(hex, k === undefined ? 1 : k);
    return [c[0], c[1], c[2], 0.7];
  };

  function wallTex(ctx, w, h) {
    const g = ctx.createLinearGradient(0, h, w, 0);
    g.addColorStop(0, '#f0d6c6');
    g.addColorStop(0.5, '#faeee4');
    g.addColorStop(1, '#e6e0da');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(150,130,120,0.3)';
    ctx.save();
    ctx.translate(w * 0.05, h * 0.55);
    for (let i = 0; i < 7; i++) {
      ctx.rotate(0.55);
      ctx.beginPath();
      ctx.ellipse(18, 0, 22, 4, 0, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(120,118,120,0.5)';
    ctx.fillRect(w * 0.84, 0, w * 0.16, h * 0.16);
    ctx.fillRect(w * 0.9, h * 0.16, w * 0.03, h * 0.05);
    ctx.fillStyle = 'rgba(90,88,92,0.5)';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * (0.86 + i * 0.035), h * 0.02, w * 0.012, h * 0.11);
  }

  function boxTex(ctx, w, h) {
    ctx.fillStyle = '#d8e8f0';
    ctx.fillRect(0, 0, w, h);
    const g = rand(17);
    const cols = ['#f0a040', '#e86080', '#60b0e0', '#f0e070', '#a0d880', '#c080e0', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 3 + g() * 10, 2 + g() * 8, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function faceTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 256, h / 256);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#f8c4c0';
    [[58, 170], [198, 170]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 26, 12, 0, 0, PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#e66878';
    ctx.lineWidth = 2.5;
    [[40, 172], [180, 172]].forEach(([x, y]) => {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 9, y + 4);
        ctx.lineTo(x + i * 9 + 6, y - 6);
        ctx.stroke();
      }
    });
    const eye = (cx, cy, s) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36, 44, 0, 0, PI * 2);
      ctx.fill();
      const ig = ctx.createLinearGradient(0, cy - 34, 0, cy + 34);
      ig.addColorStop(0, '#7a4a08');
      ig.addColorStop(0.45, '#d89418');
      ig.addColorStop(1, '#fae078');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.ellipse(cx + s * 3, cy + 5, 28, 38, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3e2206';
      ctx.beginPath();
      ctx.ellipse(cx + s * 3, cy + 3, 12, 18, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 7 + s * 3, cy - 13, 8, 9, 0, 0, PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 10 + s * 3, cy + 15, 4, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2e1208';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx - 36, cy - 20);
      ctx.quadraticCurveTo(cx - 4, cy - 48, cx + 34, cy - 26);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + 34);
      ctx.quadraticCurveTo(cx, cy + 40, cx + 24, cy + 33);
      ctx.stroke();
    };
    eye(78, 112, 1);
    eye(178, 108, -1);
    ctx.strokeStyle = '#d89080';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(130, 160);
    ctx.lineTo(126, 168);
    ctx.stroke();
    ctx.fillStyle = '#7a1c24';
    ctx.beginPath();
    ctx.moveTo(106, 188);
    ctx.quadraticCurveTo(130, 184, 156, 186);
    ctx.quadraticCurveTo(150, 226, 131, 228);
    ctx.quadraticCurveTo(112, 226, 106, 188);
    ctx.fill();
    ctx.fillStyle = '#ec7884';
    ctx.beginPath();
    ctx.ellipse(131, 216, 15, 9, 0, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function buildHead(b) {
    b.ellipsoid(R, R * 1.0, R * 0.94, 16, 12, cel(SKIN));
    b.at(0, -R * 0.5, R * 0.08, h => h.ellipsoid(R * 0.74, R * 0.6, R * 0.62, 12, 8, cel(SKIN)));
    b.at(0, -R * 0.9, R * 0.3, h => h.ellipsoid(R * 0.28, R * 0.22, R * 0.2, 8, 5, cel(SKIN)));
    b.at(R * 0.95, -R * 0.05, -R * 0.12, h => h.ellipsoid(R * 0.12, R * 0.22, R * 0.14, 6, 4, cel(SKIN_SH)));
    b.at(0, -R * 1.25, -R * 0.25, h => h.prism(8, R * 0.3, R * 0.28, -R * 0.9, R * 0.34, R * 0.3, R * 0.2, cel(SKIN_SH)));
  }

  function strand(b, root, tip, wid, col, bend, thick) {
    const mid = [(root[0] + tip[0]) / 2 + bend[0], (root[1] + tip[1]) / 2 + bend[1], (root[2] + tip[2]) / 2 + bend[2]];
    const N = 6;
    const at = (k) => {
      const a = (1 - k) * (1 - k), m = 2 * k * (1 - k), c = k * k;
      return [root[0] * a + mid[0] * m + tip[0] * c, root[1] * a + mid[1] * m + tip[1] * c, root[2] * a + mid[2] * m + tip[2] * c];
    };
    const th = thick || 0.01;
    for (let i = 0; i < N; i++) {
      const k0 = i / N, k1 = (i + 1) / N;
      const p0 = at(k0), p1 = at(k1);
      const w0 = wid * (1 - k0 * k0 * 0.9), w1 = wid * (1 - k1 * k1 * 0.9);
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      b.quad([p0[0] - nx * w0, p0[1] - ny * w0, p0[2]], [p0[0] + nx * w0, p0[1] + ny * w0, p0[2]], [p1[0] + nx * w1, p1[1] + ny * w1, p1[2]], [p1[0] - nx * w1, p1[1] - ny * w1, p1[2]], col);
      b.quad([p0[0] + nx * w0, p0[1] + ny * w0, p0[2]], [p0[0], p0[1], p0[2] - th], [p1[0], p1[1], p1[2] - th], [p1[0] + nx * w1, p1[1] + ny * w1, p1[2]], cel(HAIR_DARK));
      b.quad([p0[0], p0[1], p0[2] - th], [p0[0] - nx * w0, p0[1] - ny * w0, p0[2]], [p1[0] - nx * w1, p1[1] - ny * w1, p1[2]], [p1[0], p1[1], p1[2] - th], cel(HAIR_DARK));
    }
  }

  function buildHair(b) {
    const nu = 22, nv = 8;
    const low = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.7) return 0.62;
      if (a < 1.3) return lerp(0.62, -0.95, (a - 0.7) / 0.6);
      return -0.95;
    };
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = low(yaw);
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const flare = 1.12 + clamp(-pit, 0, 1) * 0.35;
      return [S(yaw) * C(pit) * R * flare, S(pit) * R * 1.12 + R * 0.04, C(yaw) * C(pit) * R * flare * 0.98];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const shadeK = j < 2 ? 0.86 : (i + j) % 5 === 0 ? 1.12 : 1;
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), cel(HAIR, shadeK));
      }
    }
    const bangs = 10;
    for (let i = 0; i < bangs; i++) {
      const u = i / (bangs - 1);
      const x = lerp(-0.92, 0.92, u);
      const tipY = R * (0.36 - 0.12 * ((i * 7) % 3) + 0.25 * Math.abs(x) * Math.abs(x));
      const zSurf = Math.sqrt(Math.max(0.05, 1 - x * x * 0.8)) * R * 0.98;
      const root = [x * R * 0.45, R * 1.12, R * 0.35];
      const tip = [x * R * (0.95 + Math.abs(x) * 0.25) + (u - 0.5) * R * 0.25, tipY, zSurf + R * 0.08];
      strand(b, root, tip, R * 0.3, cel(i % 3 === 1 ? HAIR_HI : HAIR), [0, R * 0.15, R * 0.45], R * 0.12);
    }
    [-1, 1].forEach(s => {
      for (let i = 0; i < 3; i++) {
        const root = [s * R * (0.88 + i * 0.05), R * (0.55 - i * 0.1), R * (0.5 - i * 0.3)];
        const tip = [s * R * (1.32 + i * 0.12), -R * (1.1 + i * 0.12), R * (0.45 - i * 0.3)];
        strand(b, root, tip, R * 0.26, cel(i === 1 ? HAIR_DARK : HAIR), [s * R * 0.25, 0, R * 0.12], R * 0.1);
      }
    });
  }

  function buildRibbon(b) {
    const col = 0x2a54b0;
    b.push(M4.translate(R * 0.35, R * 1.08, -R * 0.82), M4.rotZ(-0.35));
    b.ellipsoid(R * 0.2, R * 0.16, R * 0.14, 8, 5, cel(col));
    [-1, 1].forEach(s => b.at(s * R * 0.48, R * 0.1, 0, h => h.ellipsoid(R * 0.42, R * 0.26, R * 0.1, 8, 5, cel(col, s > 0 ? 0.82 : 1))));
    b.pop();
  }

  function buildTorso(b) {
    K.tube(b, [[0.04, 0.02, -0.07], [0.12, -0.08, -0.12], [0.24, -0.26, -0.16], [0.3, -0.42, -0.16]], [0.07, 0.16, 0.2, 0.2], 14, cel(KIMONO));
    const band = (pts, w, z, col) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        b.quad([a[0], a[1], a[2] + z], [a[0] + w, a[1], a[2] + z], [c[0] + w, c[1], c[2] + z], [c[0], c[1], c[2] + z], col);
      }
    };
    const line = [[0.02, 0.03, 0.02], [0.08, -0.06, 0.04], [0.15, -0.16, 0.05], [0.22, -0.27, 0.04]];
    band(line, 0.028, 0.0, cel(0xf6f4f2));
    band(line.map(p => [p[0] + 0.028, p[1], p[2]]), 0.03, 0.002, cel(0xc8344c));
    band(line.map(p => [p[0] + 0.058, p[1], p[2]]), 0.05, 0.004, cel(KIMONO_HI));
    b.quad([0.2, -0.27, 0.05], [0.4, -0.27, 0.0], [0.4, -0.31, 0.0], [0.2, -0.31, 0.05], cel(0xc8344c));
    b.quad([0.2, -0.31, 0.05], [0.4, -0.31, 0.0], [0.4, -0.33, 0.0], [0.2, -0.33, 0.05], cel(0x8a1a2a));
  }

  function buildArm(b, from, elbow, wrist, r0) {
    K.tube(b, [from, elbow, wrist], [r0 * 0.9, r0, r0 * 1.3], 10, cel(KIMONO));
    b.at(wrist[0], wrist[1], wrist[2], h => h.ellipsoid(r0 * 1.3, r0 * 1.25, r0 * 0.5, 10, 5, cel(KIMONO_SH)));
  }

  function buildHand(b, at, ang, s) {
    b.push(M4.translate(at[0], at[1], at[2]), M4.rotZ(ang));
    b.ellipsoid(0.03, 0.026, 0.02, 10, 6, cel(SKIN));
    for (let i = 0; i < 4; i++) {
      b.push(M4.translate(s * 0.008 + (i - 1.5) * 0.013, 0.016, 0.012), M4.rotX(-1.3));
      b.prism(6, 0.0065, 0.006, 0, 0.006, 0.0055, 0.024, cel(SKIN));
      b.pop();
    }
    b.push(M4.translate(-s * 0.026, 0.008, 0.012), M4.rotZ(s * 1.1));
    b.prism(6, 0.0075, 0.007, 0, 0.0065, 0.006, 0.026, cel(SKIN_SH));
    b.pop();
    b.pop();
  }

  function buildPad(b) {
    const gr = cel(0xc8ccd4), dk = cel(0xa0a4ae);
    b.ellipsoid(0.07, 0.03, 0.022, 14, 6, gr);
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.065, -0.028, 0), M4.rotZ(s * 0.35));
      b.ellipsoid(0.026, 0.048, 0.022, 10, 6, gr);
      b.pop();
      b.at(s * 0.048, 0.006, 0.02, h => h.ellipsoid(0.022, 0.018, 0.006, 10, 4, dk));
    });
    [[-0.048, 0.016], [-0.048, -0.004], [-0.058, 0.006], [-0.038, 0.006]].forEach(([x, y]) => b.at(x, y, 0.026, h => h.box(0.008, 0.008, 0.006, cel(0x6a6e78))));
    [[0.048, 0.016, 0x40a080], [0.048, -0.004, 0x5070c0], [0.058, 0.006, 0xd05060], [0.038, 0.006, 0xc070b0]].forEach(([x, y, col]) => b.at(x, y, 0.026, h => h.ellipsoid(0.005, 0.005, 0.003, 6, 3, cel(col))));
    b.at(0, 0.0, 0.022, h => h.box(0.02, 0.006, 0.004, cel(0x6a6e78)));
  }

  function build(r) {
    const tex = { wall: r.texture(256, wallTex, { height: 192, clamp: true }), box: r.texture(128, boxTex), face: r.texture(256, faceTex, { clamp: true }) };
    const wall = mesh(r, b => b.quad([-1.6, -1.2, -1.4], [1.6, -1.2, -1.4], [1.6, 1.2, -1.4], [-1.6, 1.2, -1.4], [1, 1, 1, 1]));
    const props = mesh(r, b => {
      b.push(M4.translate(-0.36, -0.2, -0.3), M4.rotZ(0.4), M4.rotX(-0.5));
      b.ellipsoid(0.34, 0.2, 0.14, 16, 10, cel(0x1c3a92));
      b.at(0.14, 0.09, 0.06, h => h.ellipsoid(0.16, 0.08, 0.08, 10, 5, cel(0x3c66c8)));
      b.pop();
      K.tube(b, [[-0.01, -0.13, 0.12], [-0.06, -0.1, 0.11], [-0.11, -0.12, 0.08], [-0.11, -0.3, 0.06]], [0.004, 0.004, 0.004, 0.004], 5, cel(0x141418));
    });
    const box = mesh(r, b => {
      b.push(M4.translate(-0.075, -0.1, -0.1), M4.rotZ(-0.3), M4.rotY(0.35));
      b.quad([-0.07, -0.11, 0.008], [0.07, -0.11, 0.008], [0.07, 0.11, 0.008], [-0.07, 0.11, 0.008], [1, 1, 1, 0.8]);
      b.pop();
    });
    const body = mesh(r, b => {
      buildTorso(b);
      buildArm(b, [0.1, -0.08, -0.1], [0.04, -0.17, -0.03], [-0.03, -0.17, 0.05], 0.042);
      K.tube(b, [[-0.03, -0.17, 0.05], [-0.06, -0.15, 0.09]], [0.022, 0.019], 8, cel(SKIN));
      buildArm(b, [0.3, -0.08, -0.14], [0.27, -0.2, -0.03], [0.16, -0.15, 0.07], 0.05);
      K.tube(b, [[0.16, -0.15, 0.07], [0.12, -0.14, 0.1]], [0.022, 0.019], 8, cel(SKIN));
      b.push(M4.translate(0.035, -0.14, 0.12), M4.rotZ(0.1), M4.rotX(0.3));
      buildPad(b);
      b.pop();
      buildHand(b, [-0.04, -0.15, 0.135], 0.6, -1);
      buildHand(b, [0.11, -0.13, 0.14], -0.5, 1);
    });
    const headM = M4.chain(M4.translate(-0.005, 0.11, 0.0), M4.rotZ(0.42), M4.rotY(-0.28), M4.rotX(0.18));
    const head = mesh(r, b => { b.push(headM); buildHead(b); b.pop(); });
    const hair = mesh(r, b => { b.push(headM); buildHair(b); buildRibbon(b); b.pop(); });
    const face = mesh(r, b => { b.push(headM); spherePatch(b, R * 1.004, R * 1.004, R * 0.944, -0.95, 0.95, -0.95, 0.5, 14, 12, [1, 1, 1, 0.7], [1, 1]); b.pop(); });
    return {
      env: {
        sunDir: [0.4, -0.5, -0.7],
        sunColor: [0.3, 0.28, 0.26],
        ambTop: [0.95, 0.92, 0.9],
        ambBottom: [0.7, 0.66, 0.66],
        fogColor: [0.95, 0.9, 0.86],
        fogNear: 20,
        fogFar: 40
      },
      camera: { eye: [0, 0, 0.62], at: [0, 0, 0], fov: 40 },
      grade: [1.0, 1.0, 1.0, 0.0],
      draw(r2) {
        r2.draw(wall, null, { texture: tex.wall });
        r2.draw(props);
        r2.draw(box, null, { texture: tex.box });
        r2.draw(body);
        r2.draw(head);
        r2.draw(face, null, { texture: tex.face });
        r2.draw(hair);
      }
    };
  }

  window.KartAnime = { build };
})();
