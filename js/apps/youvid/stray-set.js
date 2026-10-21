(function () {
  const { M4, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh, spherePatch, tube } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const R = 0.1;
  const LOOK = {
    skin: 0xcba08c,
    hair: 0x241c18,
    hairHi: 0x362a24,
    tee: 0x0b0b0d,
    set: 0x121214,
    cup: 0x1d1d21,
    wall: 0x5a3426,
    chair: 0x0d0d0f,
    chairWhite: 0xe6e6e8
  };

  const FACE_YAW = 1.05;
  const FACE_TOP = 0.42;
  const FACE_BOTTOM = -1.0;

  const EYE_DX = 70;
  const EYE_Y = 68;
  const BROW_Y = 32;
  const MOUTH_Y = 160;

  function drawBrow(ctx, side, kind) {
    const x = 128 + side * EYE_DX;
    let outer = BROW_Y, inner = BROW_Y, arch = -6;
    if (kind === 'up') { outer = BROW_Y - 6; inner = BROW_Y - 8; arch = -10; }
    if (kind === 'furrow') { outer = BROW_Y - 8; inner = BROW_Y + 10; arch = -3; }
    if (kind === 'lift') { outer = BROW_Y - 4; inner = BROW_Y - 10; arch = -11; }
    if (kind === 'high') { outer = BROW_Y - 11; inner = BROW_Y - 15; arch = -15; }
    ctx.strokeStyle = '#17110e';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(x - side * 40, outer + 5);
    ctx.quadraticCurveTo(x - side * 4, Math.min(outer, inner) + arch, x + side * 36, inner);
    ctx.stroke();
  }

  function drawEye(ctx, side, state, gaze) {
    const x = 128 + side * EYE_DX;
    const y = EYE_Y;
    if (state === 'shut') {
      ctx.strokeStyle = '#2a1a16';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 27, y);
      ctx.quadraticCurveTo(x, y + 9, x + 27, y);
      ctx.stroke();
      return;
    }
    const ry = { pop: 19, wide: 16, open: 11, half: 7, squint: 5 }[state] || 11;
    const iris = state === 'pop' ? 9.5 : 12;
    const pupil = state === 'pop' ? 4.5 : 5.5;
    ctx.fillStyle = 'rgba(90,56,50,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 30, 9, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eee4dc';
    ctx.beginPath();
    ctx.ellipse(x, y, 27, ry, 0, 0, PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, 27, ry, 0, 0, PI * 2);
    ctx.clip();
    const ix = x + gaze * 9;
    const iy = state === 'half' ? y - 2 : y;
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.arc(ix, iy, iris, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c0807';
    ctx.beginPath();
    ctx.arc(ix, iy, pupil, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(ix + 2, iy - 6, 3.5, 3.5);
    ctx.restore();
    ctx.strokeStyle = '#1a100d';
    ctx.lineWidth = state === 'half' ? 8 : 5.5;
    ctx.beginPath();
    ctx.moveTo(x - 29, y + 2);
    ctx.quadraticCurveTo(x, y - ry - 4, x + 29, y + 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70,40,34,0.6)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 24, y + ry * 0.9);
    ctx.quadraticCurveTo(x, y + ry + 2.5, x + 24, y + ry * 0.9);
    ctx.stroke();
  }

  function drawBeard(ctx) {
    ctx.fillStyle = 'rgba(38,28,24,0.36)';
    ctx.beginPath();
    ctx.moveTo(16, 92);
    ctx.quadraticCurveTo(14, 200, 70, 244);
    ctx.quadraticCurveTo(128, 266, 186, 244);
    ctx.quadraticCurveTo(242, 200, 240, 92);
    ctx.quadraticCurveTo(200, 128, 128, 122);
    ctx.quadraticCurveTo(56, 128, 16, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(24,17,14,0.72)';
    ctx.beginPath();
    ctx.moveTo(78, 134);
    ctx.quadraticCurveTo(128, 122, 178, 134);
    ctx.quadraticCurveTo(170, 146, 128, 143);
    ctx.quadraticCurveTo(86, 146, 78, 134);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(90, 184);
    ctx.quadraticCurveTo(128, 176, 166, 184);
    ctx.quadraticCurveTo(162, 222, 128, 230);
    ctx.quadraticCurveTo(94, 222, 90, 184);
    ctx.closePath();
    ctx.fill();
    const g = rand(11);
    for (let i = 0; i < 900; i++) {
      const x = 14 + g() * 228, y = 92 + g() * 160;
      const dx = (x - 128) / 114, dy = (y - 172) / 82;
      if (dx * dx + dy * dy > 1) continue;
      ctx.fillStyle = `rgba(20,14,12,${0.25 + g() * 0.4})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  function drawMouth(ctx, shape, spread) {
    const x = 128, y = MOUTH_Y;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const lips = '#8e5c54';
    if (shape === 'shut' || shape === 'smirk') {
      ctx.strokeStyle = lips;
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (shape === 'smirk') {
        ctx.moveTo(x - 50, y + 6);
        ctx.quadraticCurveTo(x, y + 8, x + 54, y - 10);
      } else {
        ctx.moveTo(x - 50, y + 1);
        ctx.quadraticCurveTo(x, y + 8, x + 50, y + 1);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,74,68,0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 36, 7, 0, 0, PI);
      ctx.fill();
      return;
    }
    if (shape === 'pout') {
      ctx.fillStyle = '#9a645c';
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 30, 11, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a2e2c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 24, y + 4);
      ctx.quadraticCurveTo(x, y + 7, x + 24, y + 4);
      ctx.stroke();
      return;
    }
    if (shape === 'gasp') {
      const cy = y + 26, rx = 31, ry = 40;
      const hole = () => {
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, PI * 2);
      };
      ctx.fillStyle = '#2a0c0e';
      hole();
      ctx.fill();
      ctx.save();
      hole();
      ctx.clip();
      ctx.fillStyle = '#e9e0d6';
      ctx.fillRect(x - rx, cy - ry, rx * 2, 9);
      ctx.fillStyle = '#a4504c';
      ctx.beginPath();
      ctx.ellipse(x, cy + ry * 0.7, rx * 0.72, ry * 0.42, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#9a625a';
      ctx.lineWidth = 11;
      hole();
      ctx.stroke();
      return;
    }
    if (shape === 'teeth') {
      const half = 52 + spread * 12;
      const hh = 18 + spread * 12;
      const outline = () => {
        ctx.beginPath();
        ctx.moveTo(x - half, y - 4);
        ctx.quadraticCurveTo(x, y - 16, x + half, y - 4);
        ctx.quadraticCurveTo(x + half - 6, y + hh, x, y + hh + 6);
        ctx.quadraticCurveTo(x - half + 6, y + hh, x - half, y - 4);
        ctx.closePath();
      };
      ctx.fillStyle = '#4a1c1c';
      outline();
      ctx.fill();
      ctx.save();
      outline();
      ctx.clip();
      ctx.fillStyle = '#eee6dc';
      ctx.fillRect(x - half, y - 12, half * 2, hh * 0.55 + 8);
      ctx.fillRect(x - half + 10, y + hh * 0.5, half * 2 - 20, hh * 0.45);
      ctx.strokeStyle = 'rgba(120,100,90,0.8)';
      ctx.lineWidth = 2;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * (half / 4.6), y - 12);
        ctx.lineTo(x + i * (half / 4.6), y + hh * 0.5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = lips;
      ctx.lineWidth = 7;
      outline();
      ctx.stroke();
      return;
    }
    const dims = { a1: [46, 8], a2: [50, 16], a3: [54, 28], round: [24, 26] }[shape] || [46, 8];
    const cy = y + dims[1] * 0.55;
    ctx.fillStyle = '#2c0f10';
    ctx.strokeStyle = lips;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(x, cy, dims[0], dims[1], 0, 0, PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, cy, dims[0], dims[1], 0, 0, PI * 2);
    ctx.clip();
    if (shape !== 'round') {
      ctx.fillStyle = '#e9e0d6';
      ctx.fillRect(x - dims[0], cy - dims[1], dims[0] * 2, Math.min(10, dims[1] * 0.7));
    }
    if (shape === 'a3' || shape === 'round') {
      ctx.fillStyle = '#a4504c';
      ctx.beginPath();
      ctx.ellipse(x, cy + dims[1] * 0.85, dims[0] * 0.6, dims[1] * 0.5, 0, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(x, cy, dims[0], dims[1], 0, 0, PI * 2);
    ctx.stroke();
  }

  function drawFace(key) {
    const [eyes, brows, mouth, gaze, spread] = key.split('|');
    const [browL, browR] = brows.split('/');
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.fillStyle = 'rgba(120,80,70,0.2)';
      ctx.beginPath();
      ctx.ellipse(128, 94, 15, 26, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,34,30,0.8)';
      ctx.beginPath();
      ctx.ellipse(116, 112, 5, 3, 0, 0, PI * 2);
      ctx.ellipse(140, 112, 5, 3, 0, 0, PI * 2);
      ctx.fill();
      drawBeard(ctx);
      drawBrow(ctx, -1, browL);
      drawBrow(ctx, 1, browR || browL);
      drawEye(ctx, -1, eyes, +gaze);
      drawEye(ctx, 1, eyes, +gaze);
      drawMouth(ctx, mouth, +spread);
      ctx.restore();
    };
  }


  function buildHead(b) {
    const sk = LOOK.skin;
    b.ellipsoid(R * 0.95, R * 1.08, R * 1.0, 16, 12, sk);
    b.at(0, -R * 0.6, R * 0.14, h => h.ellipsoid(R * 0.84, R * 0.46, R * 0.58, 12, 7, sk));
    [-1, 1].forEach(s => b.at(s * R * 0.95, -R * 0.06, -R * 0.02, h => h.ellipsoid(R * 0.12, R * 0.26, R * 0.18, 6, 4, shade(sk, 0.88))));
    b.at(0, -R * 0.16, R * 0.99, h => h.ellipsoid(R * 0.13, R * 0.17, R * 0.12, 8, 5, shade(sk, 0.97)));
  }

  function buildHair(b) {
    const H = LOOK.hair, Hi = LOOK.hairHi;
    const nu = 20, nv = 6;
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const front = Math.max(0, C(yaw));
      const p0 = 0.08 + 0.62 * front;
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const k = 1.05 + 0.03 * front * (1 - j / nv);
      return [S(yaw) * C(pit) * R * 0.95 * k, S(pit) * R * 1.08 * k + R * 0.02, C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), j % 2 === 0 ? Hi : H);
    }
    const sideCol = shade(H, 0.85);
    for (let i = 0; i < nu; i++) {
      const yaw0 = -PI + (i / nu) * 2 * PI, yaw1 = -PI + ((i + 1) / nu) * 2 * PI;
      if (Math.abs(yaw0 + (yaw1 - yaw0) / 2) < 1.35) continue;
      const p = (yaw, pit) => [S(yaw) * C(pit) * R * 0.97, S(pit) * R * 1.1, C(yaw) * C(pit) * R * 1.03];
      b.quad(p(yaw0, -0.1), p(yaw1, -0.1), p(yaw1, 0.5), p(yaw0, 0.5), sideCol);
    }
  }

  function buildHeadset(b) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = -PI * 0.5 + (i / 18) * PI;
      pts.push([S(a) * R * 1.2, C(a) * R * 1.34 - R * 0.02, -R * 0.1]);
    }
    tube(b, pts, pts.map(() => 0.012), 6, LOOK.set);
    [-1, 1].forEach(s => {
      b.at(s * R * 1.12, -R * 0.1, -R * 0.02, h => {
        h.ellipsoid(0.026, R * 0.62, R * 0.52, 10, 8, LOOK.cup);
        h.at(s * 0.014, 0, 0, hh => hh.ellipsoid(0.018, R * 0.5, R * 0.42, 8, 6, shade(LOOK.cup, 1.5)));
      });
      b.at(s * R * 1.04, -R * 0.1, -R * 0.02, h => h.ellipsoid(0.012, R * 0.56, R * 0.46, 8, 6, 0x08080a));
    });
    b.at(R * 1.15, -R * 0.25, R * 0.28, h => h.ellipsoid(0.005, 0.005, 0.005, 5, 3, [1, 0.1, 0.1, 1]));
  }

  function buildNeck(b) {
    loft(b, [ring(-0.2, 0.082, 0.078, 0, LOOK.skin), ring(0, 0.074, 0.07, 0.01, LOOK.skin)], 10);
  }

  function buildTorso(b) {
    const T = LOOK.tee;
    loft(b, [
      ring(-0.62, 0.3, 0.17, 0, T),
      ring(-0.4, 0.34, 0.19, 0, T),
      ring(-0.2, 0.34, 0.18, -0.01, T),
      ring(-0.1, 0.28, 0.15, -0.02, T),
      ring(-0.04, 0.17, 0.115, -0.01, T),
      ring(-0.01, 0.1, 0.09, -0.01, T)
    ], 16, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.31, -0.26, -0.02, h => h.ellipsoid(0.1, 0.13, 0.12, 10, 6, T)));
  }

  function printTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#b02828';
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.96);
    ctx.lineTo(w * 0.34, h * 0.28);
    ctx.lineTo(w * 0.5, h * 0.5);
    ctx.lineTo(w * 0.66, h * 0.28);
    ctx.lineTo(w * 0.88, h * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#16171c';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.96);
    ctx.lineTo(w * 0.4, h * 0.58);
    ctx.lineTo(w * 0.5, h * 0.7);
    ctx.lineTo(w * 0.6, h * 0.58);
    ctx.lineTo(w * 0.7, h * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2e7fa8';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.2, w * 0.2, h * 0.16, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ec4d8';
    ctx.fillRect(w * 0.38, h * 0.1, w * 0.06, h * 0.06);
    ctx.fillRect(w * 0.56, h * 0.1, w * 0.06, h * 0.06);
  }

  function buildPrint(b) {
    b.quad([-0.17, -0.8, 0.168], [0.17, -0.8, 0.168], [0.17, -0.5, 0.168], [-0.17, -0.5, 0.168], [1, 1, 1, 0]);
  }

  function buildHand(b) {
    const sk = LOOK.skin;
    b.at(0, 0, 0, h => h.box(0.1, 0.11, 0.035, sk));
    [-0.036, -0.012, 0.012, 0.036].forEach((x, i) => {
      b.push(M4.translate(x, 0.055, 0), M4.rotX(0.35));
      b.box(0.022, 0.05, 0.026, shade(sk, 0.98), { base: true });
      b.push(M4.translate(0, 0.05 + (i === 1 || i === 2 ? 0.006 : 0), 0), M4.rotX(0.7));
      b.box(0.02, 0.04, 0.024, shade(sk, 0.96), { base: true });
      b.pop();
      b.pop();
    });
    b.push(M4.translate(-0.05, -0.02, 0.01), M4.rotZ(0.9));
    b.box(0.024, 0.06, 0.026, sk, { base: true });
    b.pop();
  }

  function buildGripHand(b) {
    const sk = LOOK.skin;
    b.box(0.085, 0.095, 0.032, sk);
    [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
      const len = i === 0 ? 0.034 : i === 3 ? 0.04 : 0.045;
      b.push(M4.translate(x, 0.046, 0), M4.rotX(0.55));
      b.box(0.019, len, 0.024, shade(sk, 0.98), { base: true });
      b.push(M4.translate(0, len, 0), M4.rotX(1.0));
      b.box(0.017, len * 0.8, 0.022, shade(sk, 0.95), { base: true });
      b.pop();
      b.pop();
    });
    b.push(M4.translate(-0.04, -0.012, 0.012), M4.rotZ(0.35), M4.rotX(0.4));
    b.box(0.02, 0.045, 0.022, sk, { base: true });
    b.pop();
    b.at(0, -0.21, -0.004, h => h.box(0.07, 0.33, 0.058, shade(sk, 0.94)));
  }

  function buildMug(b) {
    const w = 0xf2f0ee;
    b.prism(10, 0.044, 0.044, -0.06, 0.048, 0.048, 0.06, w, { capBottom: true, capTop: true });
    b.at(0, 0.058, 0, h => h.ellipsoid(0.041, 0.004, 0.041, 8, 3, 0x261a14));
    const handle = [];
    for (let i = 0; i <= 8; i++) {
      const a = -PI * 0.5 + (i / 8) * PI;
      handle.push([0.046 + C(a) * 0.024, S(a) * 0.036, 0]);
    }
    tube(b, handle, handle.map(() => 0.007), 5, shade(w, 0.92));
  }

  function buildChair(b) {
    const black = LOOK.chair, white = LOOK.chairWhite;
    b.at(0, -0.4, -0.5, h => h.box(0.86, 1.4, 0.12, black));
    b.at(0, 0.3, -0.46, h => h.ellipsoid(0.34, 0.12, 0.1, 14, 6, black));
    [-1, 1].forEach(s => {
      const wing = [
        [s * 0.2, 0.3, -0.4],
        [s * 0.32, 0.26, -0.32],
        [s * 0.44, 0.12, -0.22],
        [s * 0.52, -0.1, -0.14],
        [s * 0.56, -0.34, -0.08],
        [s * 0.58, -0.6, -0.04]
      ];
      tube(b, wing, wing.map(() => 0.085), 8, black);
      const rim = wing.map(p => [p[0] + s * 0.05, p[1] + 0.02, p[2] + 0.07]);
      tube(b, rim, rim.map(() => 0.034), 6, white);
      const loop = [];
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * PI;
        loop.push([s * (0.3 + 0.08 * S(a)), -0.32 + 0.1 * C(a), -0.12 + 0.02 * S(a)]);
      }
      tube(b, loop, loop.map(() => 0.016), 5, white);
    });
  }

  function buildWall(b) {
    b.at(0, 0, -1.9, h => h.box(5.2, 3.2, 0.1, LOOK.wall));
    b.at(1.22, 0.62, -1.84, h => h.box(0.9, 0.9, 0.04, 0xb9b6b0));
    b.at(1.1, 0.0, -1.84, h => h.box(0.7, 1.2, 0.04, 0x2a2018));
    b.at(-1.15, 0, -1.84, h => h.box(0.9, 3.0, 0.06, 0x14101a));
    b.at(-0.76, 0, -1.8, h => h.box(0.045, 3.0, 0.05, 0x8c8e94));
    b.at(-0.5, 0, -1.8, h => h.box(0.05, 3.0, 0.05, 0x707278));
    b.at(-0.28, 0, -1.8, h => h.box(0.18, 3.0, 0.04, 0x37202a));
    b.at(0.7, 0.2, -1.8, h => h.box(0.04, 3.0, 0.04, 0xa8286a));
    b.at(-0.3, 0.2, -1.82, h => h.box(0.03, 3.0, 0.03, 0xa8286a));
  }

  function hexes(b, cells, size, col) {
    cells.forEach(([x, y]) => {
      b.push(M4.translate(x, y, 0), M4.rotX(PI / 2));
      b.prism(6, size, size, 0, size, size, 0.02, col, { capBottom: true });
      b.pop();
    });
  }

  function buildPink(b) {
    const s = 0.11;
    hexes(b, [[0, 0], [-0.19, 0.115], [0.19, 0.115], [0, 0.23], [-0.19, 0.345], [0.19, 0.345], [0, 0.46]], s, [1, 0.78, 0.98, 1]);
  }

  function buildPurple(b) {
    const s = 0.1;
    hexes(b, [[0, 0], [0.17, 0.1], [0, 0.2], [0.17, 0.3], [0, 0.4], [0.17, 0.5]], s, [0.7, 0.2, 0.85, 1]);
  }

  function build(r) {
    const faces = {};
    const faceTex = (key) => {
      if (!faces[key]) faces[key] = r.texture(256, drawFace(key), { clamp: true });
      return faces[key];
    };
    return {
      faceTex,
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => spherePatch(b, R * 0.955, R * 1.085, R * 1.006, -FACE_YAW, FACE_YAW, FACE_BOTTOM, FACE_TOP, 14, 14, [1, 1, 1, 0], [1, 1])),
      headset: mesh(r, buildHeadset),
      neck: mesh(r, buildNeck),
      torso: mesh(r, buildTorso),
      print: r.texture(128, printTex, { clamp: true }),
      printMesh: mesh(r, buildPrint),
      hand: mesh(r, buildHand),
      grip: mesh(r, buildGripHand),
      mug: mesh(r, buildMug),
      chair: mesh(r, buildChair),
      wall: mesh(r, buildWall),
      pink: mesh(r, buildPink),
      purple: mesh(r, buildPurple)
    };
  }

  function draw(r, V, pose) {
    const hm = M4.chain(M4.translate(pose.p[0], pose.p[1], pose.p[2]), M4.rotY(-pose.yaw), M4.rotX(-pose.pitch), M4.rotZ(pose.roll));
    const tx = pose.p[0] * 0.55, tz = pose.p[2] * 0.5;
    const body = M4.chain(M4.translate(tx, pose.p[1] - 0.115 - pose.lean * 0.03, tz), M4.rotZ(pose.roll * 0.4), M4.rotY(-pose.yaw * 0.25));
    r.draw(V.wall, null);
    r.draw(V.pink, M4.translate(0.12, 0.22, -1.82), { flat: [1, 0.78, 0.98, 1], noFog: true });
    r.draw(V.purple, M4.translate(-1.05, 0.5, -1.82), { flat: [0.72, 0.22, 0.86, 1], noFog: true });
    r.draw(V.purple, M4.translate(-1.05, -0.4, -1.82), { flat: [0.55, 0.16, 0.7, 1], noFog: true });
    r.draw(V.chair, M4.translate(0.1, 0, 0));
    r.draw(V.torso, body);
    r.draw(V.printMesh, body, { texture: V.print, blend: true });
    r.draw(V.neck, M4.chain(M4.translate(pose.p[0], pose.p[1], pose.p[2]), M4.rotY(-pose.yaw * 0.7), M4.rotZ(pose.roll * 0.6), M4.translate(0, -0.06, -0.01)));
    r.draw(V.head, hm);
    r.draw(V.hair, hm);
    r.draw(V.headset, hm);
    r.draw(V.face, hm, { texture: V.faceTex(pose.face), blend: true, alpha: 1 });
    if (pose.hand) {
      const h = pose.hand;
      r.draw(h.grip ? V.grip : V.hand, M4.chain(hm, M4.translate(h.p[0], h.p[1], h.p[2]), M4.rotZ(h.rz), M4.rotX(h.rx), M4.rotY(h.ry)));
    }
    if (pose.mug) {
      const m = pose.mug;
      r.draw(V.mug, M4.chain(hm, M4.translate(m.p[0], m.p[1], m.p[2]), M4.rotZ(m.rz), M4.rotX(m.rx), M4.rotY(m.ry)));
    }
  }

  const CHAT = [
    ['BaNaNcHiK1', '#b0a0a0', '\u0422\u043e\u043a\u0441\u0438\u0447\u043d\u044b\u0439 \u0443*\u043e\u043a \u043d\u0430 \u0441\u0442\u0440\u0438\u043c\u0435\u0440\u0435'],
    ['Daaar_33', '#3a9a6a', '\u0417\u043d\u0430\u0435\u0442 \u043a\u0442\u043e?'],
    ['Slav9ini', '#9ab0e0', '\u0442\u044b \u043a\u0438\u0443\u0430\u0435\u0448\u044c'],
    ['Theria_v', '#d0603a', '@doringod2 \u043b\u0443\u0447\u0448\u0438\u0439, \u043d\u0443'],
    ['Wpbloger', '#3acf7a', '\u0441\u043d\u043e\u0432\u0430 \u043e\u043d \u0441 \u0430\u043a\u0442\u0435\u0440\u0430\u043c\u0438 \u0438\u0433\u0440\u0430\u0435\u0442'],
    ['Procureur1', '#d04a4a', '@BaNaNcHiK1 \u0410\u0421\u0423\u0416\u0414\u0410\u042e \u0411\u042b\u0414\u041b\u0410'],
    ['Artemgggaaaa', '#a070e0', '\u043f\u0435\u0440\u0435\u043e\u0431\u0443\u043b\u0441\u044f'],
    ['Ricekicee', '#c8885a', '\u044d\u0445...'],
    ['Phonkkker', '#d04a4a', '\u0442\u043e\u043a\u0441\u0438\u0447\u043d\u044b\u0439 \u0443*\u043e\u043a'],
    ['N1Y4H', '#4a9ae0', '\u043d\u0443 \u0434\u0430 \u0438 \u0447\u0435'],
    ['Stepanidzee220', '#9aa0a8', '@destrodoto \u0441\u0435\u043b\u0435\u0434\u043a\u0430'],
    ['Ricardo_project_streya', '#c8885a', '\u0442\u0430\u043a \u0442\u044b 1\u043a \u043f\u043e\u0434\u043f\u0438\u0432\u0430\u0441\u043e\u0432 \u0431\u0435\u0440\u0435\u0448\u044c \u0432 \u043b\u043e\u0431\u0431\u0438)))'],
    ['Kashevar04', '#d04a4a', '@Rentaro001 \u041d\u0443 \u0441\u043f\u043e\u0440 \u0430\u0434\u0435\u043a\u0432\u0430\u0442\u043d\u043e\u0433\u043e \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0430 \u0441 \u0433\u0432\u043e\u043d\u043e\u0435\u0434\u043e\u043c-\u0430\u043d\u0438\u043c\u0435\u0448\u043d\u0438\u043a\u043e\u043c)'],
    ['Amidomaru2007', '#4a9a6a', '\u043f\u043e\u0438\u043c\u0435\u0439 \u0438\u0445\u0433\u043e'],
    ['Roudi23', '#c8c8c8', '\u043a\u0430\u043a\u0430\u044f \u0441\u0442\u0430\u0432\u043a\u0430 \u0437\u0430\u0448\u043b\u0430?'],
    ['Procureur1', '#d04a4a', '\u041f\u041c\u041a'],
    ['Destrodoto', '#a0b84a', '\u0431\u0445\u0441'],
    ['Procureur1', '#d04a4a', '\u0410\u0421\u0443'],
    ['Elforetiik', '#a070e0', '\u0433\u044b \u0433\u044b'],
    ['R_way9120', '#d05a5a', '\u0448\u0443\u0442\u043a\u0438 \u0432\u0441\u0435\u0433\u0434\u0430 \u0441\u043c\u0435\u0448\u043d\u044b'],
    ['Biliboba032', '#c8885a', '\u0433\u044b \u0433\u044b'],
    ['Pan1x_', '#9aa0a8', '\u0442\u044b \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0439 \u0432 \u043b\u043e\u0431\u0431\u0438 \u0447\u0435\u043b\u043e\u0432 \u0443 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0431\u043e\u043b\u044c\u0448\u0435 \u0447\u0435\u043c 500-4\u043a \u043f\u0442\u0441, \u0431\u0443\u0434\u0435\u0442 \u0442\u0435\u0431\u0435 \u0441\u043a\u0438\u043b\u043b \u0443\u0441\u0430\u0442\u0430\u044f'],
    ['Zyzlo', '#a0b84a', '\u0443\u0441\u0430\u0442\u044b\u0439'],
    ['Ricekicee', '#c8885a', '\u041e\u043b\u0435\u0436\u0430 \u043d\u0435 \u043f\u043e\u043c\u043d\u0438\u0442 \u043c\u0435\u043d\u044f....((('],
    ['Rentaro001', '#8a6ae0', '@amidomaru2007 \u0432 \u0447\u0451\u043c \u0441\u043f\u043e\u0440 \u0434\u0430\u043b\u0431\u0430\u0435\u0431 \u043e\u0431\u044a\u044f\u0441\u043d\u0438'],
    ['Ciller2', '#d04a4a', '\u043c\u0430\u043b\u044c\u0447\u0438\u043a'],
    ['Theria_v', '#d0603a', '\u0430\u0445\u0430\u0445\u0430\u0445\u0430\u0445\u0430\u0445\u0430'],
    ['Procureur1', '#d04a4a', '\u0410\u0421\u0423'],
    ['Amidomaru2007', '#4a9a6a', '\u0438\u043c\u0445\u043e'],
    ['Goodman_afk', '#b04ae0', '\u0414\u0415\u0412\u041e\u0427\u041a\u0418 \u0421 \u0423\u0421\u0410\u041c\u0418, \u041a\u0418\u0414\u0410\u0419\u0422\u0415 \u0412\u0410\u0428\u0418 \u0423\u0421\u042b \u0412 \u041b\u0421, \u041f\u041e\u0414\u0410\u0420\u042e \u0412\u0410\u041c \u0421\u0410\u0411\u041a\u0423'],
    ['Unikorn0_0_', '#4a6ae0', ''],
    ['EnvoyHell', '#3acf7a', '\u0420\u0435\u043a\u043b\u0430\u043c\u0430 \u043f\u043e\u0448\u043b\u0430'],
    ['Acidraspi', '#3acf7a', '\u0430\u0445\u0430\u0445\u0430\u0445\u0430\u0445'],
    ['Cr1sp7fn', '#d05a5a', 'AXA0A0AA0'],
    ['Kheetabtw', '#4a9a9a', '@BaNaNcHiK1 blasphemous \u0435\u0441\u0442\u044c \u0438\u0433\u0440\u0430 \u044d\u0442\u043e \u0441\u043e\u0443\u043b\u0441-\u043b\u0430\u0439\u043a \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435\u0440. \u0445\u0430\u0434\u043a\u043e\u0440\u043d\u044b\u0439 \u043f*\u0437\u0434\u0435\u0446, \u0432\u043e\u0442 \u043d\u0430\u043f\u043e\u043b\u043e\u0432\u0438\u043d\u0443 \u0435\u0433\u043e \u043f\u0440\u043e\u0448\u0451\u043b. \u0447\u0435\u043a\u043d\u0438 \u0435\u0441\u043b\u0438 \u043d\u0440\u0430\u0432\u044f\u0442\u0441\u044f \u0441\u043e\u0443\u043b\u043b\u0430\u0439\u043a'],
    ['R_way9120', '#d05a5a', '\u0430\u0437\u0430\u0437\u0430\u0437\u043f'],
    ['W0rldL0ne', '#4ad04a', '\u0441\u0442\u0440\u0438\u043c\u0435\u0440 \u0443*\u0438\u0449\u0435 \u0438 \u041b\u0421\u0438\u043d\u0430 \u0442\u0443\u043f\u0430'],
    ['Kouzi822', '#6ab04a', '\u0432\u0441\u044e \u0441\u0432\u043e\u044e \u0436\u0438\u0437\u043d\u044c \u043f\u0435\u0440\u0435\u0441\u043a\u0430\u0437\u0430\u043b'],
    ['Bayrasha', '#d0603a', '\u044d\u0442\u043e \u0441\u0435\u0439\u0447\u0430\u0441 \u0440\u0435\u043a\u043b\u0430\u043c\u0430 \u0442\u0433 \u043a\u0430\u043d\u0430\u043b\u0430 \u0431\u044b\u043b\u0430?'],
    ['SanceZ1812', '#8a6ae0', '\u041f\u043e\u0440\u0448 \u0437\u0430\u0431\u044b\u043b'],
    ['OnlyPapich', '#4a9a6a', '\u0440\u0435\u043a\u043b\u0430\u043c\u0430 \u0442\u0433'],
    ['Del_ta13', '#9aa0a8', '\u041d\u0430\u043a\u043e\u043d\u0435\u0446-\u0442\u043e \u0441\u0442\u0440\u0435\u0439 \u043f\u0435\u0440\u0435\u0447\u0438\u0441\u043b\u0438\u043b \u0432\u0435\u0441\u044c \u043f\u0440\u0430\u0439\u0441 \u043b\u0438\u0441\u0442'],
    ['Theria_v', '#d0603a', '\u0431\u0430\u0439\u0442\u0438\u0442'],
    ['Amidomaru2007', '#4a9a6a', '\u0433\u043e'],
    ['Procureur1', '#d04a4a', '\u0414\u0410\u0420\u042e \u0421\u0410\u0411\u041a\u0423 \u0417\u0410 \u0410\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u042f'],
    ['Yourhorrors', '#c8785a', '\u0441\u043a\u043e\u0440\u043e\u0433\u043e\u0432\u043e\u0440\u043a\u0430'],
    ['Rentaro001', '#8a6ae0', '@Kashevar04 \u0442\u044b \u043e\u0432\u043e\u0449 \u043a\u0430\u043a\u0443\u044e-\u0442\u043e \u0445*\u0439\u043d\u044e \u043d\u0435\u0441\u0435\u0448\u044c \u0438 \u043d\u0430\u0437\u044b\u0432\u0430\u0435\u0448\u044c \u044d\u0442\u043e \u0441\u043f\u043e\u0440\u043e\u043c?'],
    ['Flametmb', '#d04ab0', '\u0443\u0441\u0430\u0442\u044b\u0439 \u043c\u0430\u043b\u044c\u0447\u0438\u043a))']
  ];

  const CHAT_W = 256;
  const CHAT_FONT = '11px Arial, sans-serif';

  function wrap(ctx, text, firstWidth, width) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    let limit = firstWidth;
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > limit && line) {
        lines.push(line);
        line = w;
        limit = width;
      } else {
        line = test;
      }
    });
    lines.push(line);
    return lines;
  }

  function layoutChat(ctx, chatList) {
    ctx.font = CHAT_FONT;
    let y = 4;
    const rows = (chatList || CHAT).map(([name, color, text]) => {
      ctx.font = 'bold 11px Arial, sans-serif';
      const nameW = ctx.measureText(name + ': ').width;
      ctx.font = CHAT_FONT;
      const parts = wrap(ctx, text, CHAT_W - 10 - nameW, CHAT_W - 10);
      const row = { name, color, parts, y, nameW };
      y += parts.length * 14 + 3;
      return row;
    });
    return { rows, height: y };
  }

  function drawChat(ctx, w, h, anchorRow, visible, chatList) {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / CHAT_W, w / CHAT_W);
    ctx.textBaseline = 'top';
    const lay = layoutChat(ctx, chatList);
    const anchor = lay.rows[anchorRow];
    const pad = Math.max(0, visible - (anchor.y + anchor.parts.length * 14 + 3));
    lay.rows.forEach(row => { row.y += pad; });
    lay.height += pad;
    lay.rows.forEach(row => {
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillStyle = row.color;
      ctx.fillText(row.name + ':', 5, row.y);
      ctx.font = CHAT_FONT;
      ctx.fillStyle = '#f2f2f2';
      row.parts.forEach((p, i) => ctx.fillText(p, i === 0 ? 5 + row.nameW : 5, row.y + i * 14));
    });
    ctx.restore();
    return lay;
  }

  window.StraySet = { R, LOOK, CHAT, CHAT_W, build, draw, drawChat, drawFace };
})();
