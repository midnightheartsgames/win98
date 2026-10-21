(function () {
  const { M4, V3, rgb, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D_TOHRU = {
    hipX: 0.082, hipY: -0.04, thigh: 0.35, shin: 0.34,
    chestY: 0.105, neckY: 0.235, shX: 0.142, shY: 0.168,
    upper: 0.215, fore: 0.195, headY: 0.125, head: 0.124
  };

  const D_ROMAN = {
    hipX: 0.15, hipY: -0.05, thigh: 0.42, shin: 0.41,
    chestY: 0.12, neckY: 0.27, shX: 0.26, shY: 0.21,
    upper: 0.28, fore: 0.24, headY: 0.11, head: 0.116
  };

  const D_NIKO = {
    hipX: 0.135, hipY: -0.05, thigh: 0.43, shin: 0.42,
    chestY: 0.12, neckY: 0.275, shX: 0.245, shY: 0.215,
    upper: 0.29, fore: 0.25, headY: 0.11, head: 0.114
  };

  const DIMS = { tohru: D_TOHRU, roman: D_ROMAN, niko: D_NIKO };

  const COL_T = {
    skin: 0xf6dfd2,
    skinShade: 0xdcb4a2,
    blonde: 0xf4ce58,
    blondeHi: 0xfce484,
    blondeShade: 0xd2a83c,
    coral: 0xe66858,
    coralDark: 0xc2483c,
    horn: 0xd8c8a8,
    hornRing: 0xa69274,
    navy: 0x26293a,
    navyDark: 0x181a26,
    white: 0xf4f4f8,
    frill: 0xe4e4ee,
    ribbon: 0x483878,
    glassRim: 0x2a2428
  };

  const COL_R = {
    skin: 0xb88a6c,
    skinShade: 0x96684e,
    hair: 0x221b16,
    shirt: 0x1e1a16,
    shirtCollar: 0x2a241e,
    undershirt: 0x3a352e,
    pants: 0x282624,
    shoe: 0x1c1816
  };

  const COL_N = {
    skin: 0xc8a288,
    skinShade: 0xa68068,
    hair: 0x2e2822,
    jacket: 0x4a3828,
    jacketStripe: 0x8a7458,
    hoodie: 0x2a2c24,
    pants: 0x2a3228,
    shoe: 0x1c1a18
  };

  const EYE_PATCH = [-0.95, 0.95, -0.42, 0.22];
  const MOUTH_PATCH = [-0.88, 0.88, -0.92, -0.38];

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function sphereAt(b, pos, r, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(r, r, r, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function cylBetween(b, p0, p1, r0, r1, sides, col) {
    K.tube(b, [p0, p1], [r0, r1], sides, col);
  }

  function patchMap(patch, w, h) {
    const [y0, y1, p0, p1] = patch;
    return {
      x: (yaw) => ((yaw - y0) / (y1 - y0)) * w,
      y: (pit) => (1 - (pit - p0) / (p1 - p0)) * h,
      kx: w / (y1 - y0),
      ky: h / (p1 - p0)
    };
  }

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function rgba(c, a) {
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
  }

  function soft(ctx, x, y, rx, ry, c, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(c, a));
    gr.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function headPoint(R, yaw, pit) {
    const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
    const low = clamp((-pit - 0.05) / 1.25, 0, 1);
    const front = clamp(C(yaw), 0, 1);
    const back = clamp(-C(yaw), 0, 1);
    const f4 = front * front * front * front;
    const cheek = 0.065 * front * Math.exp(-((pit + 0.25) ** 2) / 0.06);
    const sx = R * 0.95 * (1 - 0.42 * Math.pow(low, 1.5) + cheek);
    const sy = R * 0.92 * (1 - 0.06 * low);
    const sz = R * 0.92 * (1 + 0.06 * f4 * low * (1 - low) * 2 - 0.1 * (1 - front) * low + 0.05 * back * (1 - low));
    return [n[0] * sx, n[1] * sy, n[2] * sz];
  }

  function headGrid(b, R, y0, y1, p0, p1, nu, nv, colAt, scale, uv) {
    const sc = scale || 1;
    const P = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const p = headPoint(R, yaw, pit);
      return [p[0] * sc, p[1] * sc, p[2] * sc];
    };
    const N = (u, v) => {
      const e = 0.01;
      const a = P(u + e, v), bq = P(u - e, v), c = P(u, v + e), d = P(u, v - e);
      let n = V3.cross(V3.sub(a, bq), V3.sub(c, d));
      if (V3.len(n) < 1e-9) n = V3.norm(P(u, v));
      return V3.norm(n);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const pts = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        const ps = pts.map(([u, v]) => P(u, v));
        const ns = pts.map(([u, v]) => N(u, v));
        const cols = pts.map(([u, v]) => {
          const c = rgb(colAt ? colAt(y0 + (y1 - y0) * u, p0 + (p1 - p0) * v) : COL_T.skin);
          return uv ? [1, 1, 1, 0] : c;
        });
        b.quad(ps[0], ps[1], ps[2], ps[3], cols, uv ? pts : null, ns);
      }
    }
  }

  function drawTohruEyes(state) {
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      ctx.fillStyle = hex(COL_T.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const ey = m.y(-0.12);
      const rw = 0.25 * m.kx;
      const openMap = { wide: 0.195, open: 0.18, half: 0.1, happy: 0, shut: 0 };
      const openK = openMap[state] !== undefined ? openMap[state] : 0.18;
      const rh = openK * m.ky;

      [-1, 1].forEach(sd => {
        const cx = m.x(sd * 0.35);
        soft(ctx, cx, ey + m.ky * 0.11, rw * 1.35, rw * 0.55, 0xf28c82, 0.36);

        const browLift = state === 'wide' || state === 'happy' ? 0.025 : 0;
        const by = m.y(0.11 + browLift);
        ctx.strokeStyle = '#9e7430';
        ctx.lineWidth = Math.max(3, 0.018 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - sd * rw * 0.85, by + 0.015 * m.ky);
        ctx.quadraticCurveTo(cx, by - 0.038 * m.ky, cx + sd * rw * 0.92, by + 0.02 * m.ky);
        ctx.stroke();

        if (state === 'shut' || state === 'happy') {
          ctx.strokeStyle = '#3a221c';
          ctx.lineWidth = Math.max(4.5, 0.032 * m.ky);
          ctx.beginPath();
          if (state === 'happy') {
            ctx.moveTo(cx - sd * rw * 0.92, ey + 0.02 * m.ky);
            ctx.quadraticCurveTo(cx, ey - 0.09 * m.ky, cx + sd * rw * 0.96, ey + 0.02 * m.ky);
          } else {
            ctx.moveTo(cx - sd * rw * 0.92, ey + 0.01 * m.ky);
            ctx.quadraticCurveTo(cx, ey + 0.065 * m.ky, cx + sd * rw * 0.96, ey - 0.005 * m.ky);
          }
          ctx.stroke();
          return;
        }

        const inner = cx - sd * rw * 0.92;
        const outer = cx + sd * rw * 0.98;
        const topY = state === 'half' ? ey - rh * 0.52 : ey - rh * 0.98;
        const botY = ey + rh * 0.88;

        const eyeShape = () => {
          ctx.beginPath();
          ctx.moveTo(inner, ey + rh * 0.08);
          ctx.bezierCurveTo(cx - sd * rw * 0.55, topY, cx + sd * rw * 0.55, topY, outer, ey - rh * 0.08);
          ctx.bezierCurveTo(cx + sd * rw * 0.5, botY, cx - sd * rw * 0.5, botY, inner, ey + rh * 0.08);
          ctx.closePath();
        };

        eyeShape();
        ctx.fillStyle = '#fffaf6';
        ctx.fill();

        ctx.save();
        eyeShape();
        ctx.clip();

        const irx = rw * 0.64;
        const iry = m.ky * 0.168;
        const ix = cx - sd * rw * 0.05;
        const iy = ey + m.ky * 0.005;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.scale(irx, iry);
        const ig = ctx.createLinearGradient(0, -1, 0, 1);
        ig.addColorStop(0, '#8e1e18');
        ig.addColorStop(0.38, '#d84220');
        ig.addColorStop(0.72, '#f48e24');
        ig.addColorStop(1, '#ffe448');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(78,18,12,0.82)';
        ctx.lineWidth = 0.09;
        ctx.beginPath();
        ctx.arc(0, 0, 0.96, 0, PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#240c0a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 0.19, 0.66, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.4, iy - iry * 0.36, irx * 0.25, iry * 0.18, -0.35, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + irx * 0.32, iy + iry * 0.38, irx * 0.14, iry * 0.1, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#261816';
        ctx.beginPath();
        ctx.moveTo(inner - sd * rw * 0.05, ey + rh * 0.12);
        ctx.bezierCurveTo(cx - sd * rw * 0.55, topY - 0.032 * m.ky, cx + sd * rw * 0.58, topY - 0.035 * m.ky, outer + sd * rw * 0.14, ey - rh * 0.12);
        ctx.lineTo(outer + sd * rw * 0.02, ey + rh * 0.12);
        ctx.bezierCurveTo(cx + sd * rw * 0.48, topY + 0.018 * m.ky, cx - sd * rw * 0.5, topY + 0.018 * m.ky, inner, ey + rh * 0.18);
        ctx.closePath();
        ctx.fill();
      });
    };
  }

  function drawTohruMouth(state) {
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      ctx.fillStyle = hex(COL_T.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = m.x(0);
      const my = m.y(-0.62);
      const hw = 0.14 * m.kx;

      [-1, 1].forEach(sd => {
        soft(ctx, cx + sd * 0.36 * m.kx, m.y(-0.44), 0.19 * m.kx, 0.095 * m.ky, 0xf2887e, 0.32);
      });

      ctx.fillStyle = 'rgba(176,118,98,0.75)';
      ctx.beginPath();
      ctx.moveTo(cx, m.y(-0.41));
      ctx.lineTo(cx + 0.016 * m.kx, m.y(-0.45));
      ctx.lineTo(cx - 0.008 * m.kx, m.y(-0.46));
      ctx.closePath();
      ctx.fill();

      if (state === 'open' || state === 'wide' || state === 'smileOpen') {
        const openH = (state === 'wide' ? 0.078 : 0.058) * m.ky;
        const mw = hw * (state === 'wide' ? 1.08 : 0.92);
        const shape = () => {
          ctx.beginPath();
          ctx.moveTo(cx - mw, my - openH * 0.22);
          ctx.quadraticCurveTo(cx, my - openH * 0.45, cx + mw, my - openH * 0.22);
          ctx.bezierCurveTo(cx + mw * 0.85, my + openH * 1.12, cx - mw * 0.85, my + openH * 1.12, cx - mw, my - openH * 0.22);
          ctx.closePath();
        };
        shape();
        ctx.fillStyle = '#9e383a';
        ctx.fill();
        ctx.save();
        shape();
        ctx.clip();
        ctx.fillStyle = '#e47274';
        ctx.beginPath();
        ctx.ellipse(cx, my + openH * 0.56, mw * 0.8, openH * 0.65, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        [-1, 1].forEach(sd => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * mw * 0.32, my - openH * 0.3);
          ctx.lineTo(cx + sd * mw * 0.46, my + openH * 0.2);
          ctx.lineTo(cx + sd * mw * 0.6, my - openH * 0.26);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
        ctx.strokeStyle = '#6e282a';
        ctx.lineWidth = 2.2;
        shape();
        ctx.stroke();
        return;
      }

      const curve = state === 'smile' ? 0.032 * m.ky : 0.012 * m.ky;
      ctx.strokeStyle = '#7c3234';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.78, my - curve * 0.28);
      ctx.quadraticCurveTo(cx, my + curve, cx + hw * 0.78, my - curve * 0.28);
      ctx.stroke();
    };
  }

  function buildTohruHead(R) {
    return (b) => {
      const colAt = (yaw, pit) => (pit > 0.34 || Math.abs(yaw) > 1.38 ? COL_T.blonde : COL_T.skin);
      headGrid(b, R, -PI, PI, -PI / 2, PI / 2, 24, 16, colAt);
      [-1, 1].forEach(s => {
        sphereAt(b, [s * R * 0.9, -R * 0.08, -R * 0.03], R * 0.12, 6, 5, COL_T.skin);
      });
    };
  }

  function buildTohruHair(R) {
    return (b) => {
      headGrid(b, R, -PI, PI, 0.16, PI / 2, 22, 10, (y, p) => ((Math.floor(y * 5) + Math.floor(p * 4)) % 3 === 0 ? COL_T.blondeHi : COL_T.blonde), 1.07);
      headGrid(b, R, -PI, -1.1, -0.45, 0.22, 8, 7, () => COL_T.blonde, 1.075);
      headGrid(b, R, 1.1, PI, -0.45, 0.22, 8, 7, () => COL_T.blonde, 1.075);

      const bangs = [
        [-0.76, -0.42, -0.05, COL_T.blonde, 1.082],
        [-0.42, -0.14, -0.08, COL_T.blondeHi, 1.088],
        [-0.14, 0.14, -0.04, COL_T.blonde, 1.092],
        [0.14, 0.42, -0.08, COL_T.blondeHi, 1.088],
        [0.42, 0.76, -0.05, COL_T.blonde, 1.082]
      ];
      bangs.forEach(([y0, y1, pBot, col, sc]) => {
        headGrid(b, R, y0, y1, pBot, 0.5, 4, 5, () => col, sc);
      });

      [-1, 1].forEach(s => {
        const sideTop = [
          [s * R * 0.84, R * 0.2, R * 0.36],
          [s * R * 0.92, -R * 0.12, R * 0.42],
          [s * R * 0.84, -R * 0.46, R * 0.38]
        ];
        K.tube(b, sideTop, [0.028, 0.028, 0.022], 7, COL_T.blonde);
        const sideTip = [
          [s * R * 0.84, -R * 0.46, R * 0.38],
          [s * R * 0.76, -R * 0.78, R * 0.34],
          [s * R * 0.68, -R * 1.04, R * 0.28]
        ];
        K.tube(b, sideTip, [0.022, 0.016, 0.007], 7, COL_T.coral);

        const hornPts = [
          [s * R * 0.46, R * 0.78, R * 0.18],
          [s * R * 0.68, R * 1.12, R * 0.14],
          [s * R * 0.82, R * 1.44, R * 0.1],
          [s * R * 0.72, R * 1.68, R * 0.08]
        ];
        K.tube(b, hornPts, [0.032, 0.027, 0.02, 0.008], 8, COL_T.horn);
        const branchPts = [
          [s * R * 0.66, R * 1.1, R * 0.14],
          [s * R * 0.92, R * 1.24, R * 0.12],
          [s * R * 1.04, R * 1.38, R * 0.1]
        ];
        K.tube(b, branchPts, [0.018, 0.013, 0.006], 7, COL_T.hornRing);

        const tx = s * 0.145;
        sphereAt(b, [tx, 0.02, -0.05], 0.026, 7, 5, COL_T.ribbon);
        const tailTop = [
          [tx, 0.02, -0.05],
          [s * 0.175, -0.14, -0.04],
          [s * 0.188, -0.34, -0.02]
        ];
        K.tube(b, tailTop, [0.028, 0.036, 0.034], 8, COL_T.blonde);
        const tailBot = [
          [s * 0.188, -0.34, -0.02],
          [s * 0.192, -0.52, -0.01],
          [s * 0.18, -0.68, 0.0]
        ];
        K.tube(b, tailBot, [0.034, 0.028, 0.01], 8, COL_T.coral);
      });

      const frillSteps = 12;
      for (let i = 0; i < frillSteps; i++) {
        const a0 = lerp(-0.85, 0.85, i / frillSteps);
        const a1 = lerp(-0.85, 0.85, (i + 1) / frillSteps);
        const p0 = [S(a0) * R * 1.02, R * 0.96, C(a0) * R * 0.35 - 0.01];
        const p1 = [S(a1) * R * 1.02, R * 0.96, C(a1) * R * 0.35 - 0.01];
        const q0 = [S(a0) * R * 1.12, R * 1.14, C(a0) * R * 0.38 - 0.02];
        const q1 = [S(a1) * R * 1.12, R * 1.14, C(a1) * R * 0.38 - 0.02];
        b.quad(p0, p1, q1, q0, i % 2 ? COL_T.white : COL_T.frill);
      }
    };
  }

  function buildTohruTorso(b) {
    loft(b, [
      ring(-0.12, 0.115, 0.088, 0, COL_T.navy),
      ring(-0.03, 0.095, 0.074, 0.004, COL_T.navy),
      ring(0.06, 0.112, 0.092, 0.014, COL_T.navy),
      ring(0.14, 0.114, 0.094, 0.016, COL_T.navy),
      ring(0.21, 0.104, 0.078, 0.008, COL_T.white),
      ring(0.245, 0.052, 0.046, 0.005, COL_T.skin),
      ring(0.29, 0.046, 0.042, 0.008, COL_T.skin)
    ], 16, { hard: true, capTop: true, capBottom: true });

    b.quad([-0.055, 0.14, 0.094], [0.055, 0.14, 0.094], [0.042, 0.235, 0.068], [-0.042, 0.235, 0.068], COL_T.white);
    boxAt(b, [-0.032, 0.228, 0.072], [0.042, 0.022, 0.02], COL_T.frill, M4.rotZ(0.32));
    boxAt(b, [0.032, 0.228, 0.072], [0.042, 0.022, 0.02], COL_T.frill, M4.rotZ(-0.32));

    boxAt(b, [0, 0.21, 0.082], [0.032, 0.024, 0.018], COL_T.coral);
    b.quad([-0.024, 0.04, 0.104], [0.024, 0.04, 0.104], [0.016, 0.205, 0.086], [-0.016, 0.205, 0.086], COL_T.coral);
    b.tri([-0.024, 0.04, 0.104], [0, 0.005, 0.102], [0.024, 0.04, 0.104], COL_T.coralDark);

    [-1, 1].forEach(s => {
      boxAt(b, [s * 0.072, 0.12, 0.086], [0.02, 0.19, 0.022], COL_T.frill, M4.rotZ(s * -0.08));
    });
  }

  function buildTohruPelvis(b) {
    loft(b, [
      ring(-0.22, 0.175, 0.145, 0, COL_T.navy),
      ring(-0.1, 0.142, 0.118, 0, COL_T.navy),
      ring(0.02, 0.11, 0.088, 0, COL_T.navy)
    ], 16, { hard: true, capTop: true, capBottom: true });
    b.quad([-0.11, -0.21, 0.135], [0.11, -0.21, 0.135], [0.085, 0.01, 0.092], [-0.085, 0.01, 0.092], COL_T.white);
  }

  function buildTohruUpperArm(b) {
    const len = D_TOHRU.upper;
    loft(b, [
      ring(-len, 0.034, 0.034, 0, COL_T.navy),
      ring(-len * 0.45, 0.042, 0.042, 0, COL_T.navy),
      ring(-len * 0.42, 0.056, 0.054, 0, COL_T.white),
      ring(-len * 0.1, 0.062, 0.058, 0, COL_T.white),
      ring(0, 0.046, 0.044, 0, COL_T.white)
    ], 10, { hard: true, capTop: true, capBottom: true });
  }

  function buildTohruForearm(b) {
    const len = D_TOHRU.fore;
    loft(b, [
      ring(-len, 0.028, 0.026, 0, COL_T.white),
      ring(-len * 0.82, 0.036, 0.034, 0, COL_T.frill),
      ring(-len * 0.78, 0.034, 0.032, 0, COL_T.navy),
      ring(0, 0.038, 0.036, 0, COL_T.navy)
    ], 10, { hard: true, capTop: true, capBottom: true });
  }

  function buildTohruHand(side, mode) {
    return (b) => {
      const s = side;
      boxAt(b, [0, -0.024, 0], [0.038, 0.046, 0.022], COL_T.skin);
      [-0.014, -0.005, 0.005, 0.014].forEach((ox, idx) => {
        const curl = mode === 'clasp' || mode === 'glasses' ? -0.018 : -0.004;
        const fy = mode === 'clasp' || mode === 'glasses' ? -0.068 : -0.084;
        cylBetween(b, [ox * s, -0.042, 0.002], [ox * s, fy, curl], 0.0058, 0.0048, 6, COL_T.skin);
      });
      cylBetween(b, [-0.018 * s, -0.022, 0.005], [-0.032 * s, -0.048, 0.016], 0.0062, 0.005, 6, COL_T.skin);
    };
  }

  function buildGlasses(b) {
    const rim = COL_T.glassRim;
    const glass = [0.78, 0.9, 0.98, 0.38];
    [-1, 1].forEach(s => {
      const cx = s * 0.036;
      boxAt(b, [cx, 0.014, 0], [0.052, 0.0045, 0.0045], rim);
      boxAt(b, [cx, -0.014, 0], [0.052, 0.0038, 0.004], rim);
      boxAt(b, [cx - 0.025, 0, 0], [0.004, 0.03, 0.004], rim);
      boxAt(b, [cx + 0.025, 0, 0], [0.004, 0.03, 0.004], rim);
      b.quad([cx - 0.023, -0.012, 0.001], [cx + 0.023, -0.012, 0.001], [cx + 0.023, 0.012, 0.001], [cx - 0.023, 0.012, 0.001], glass);
      cylBetween(b, [s * 0.062, 0.01, 0], [s * 0.066, 0.006, -0.11], 0.0026, 0.0022, 5, rim);
    });
    boxAt(b, [0, 0.008, 0.002], [0.022, 0.004, 0.004], rim);
  }

  function drawRomanShirtTex(ctx, w, h) {
    ctx.fillStyle = '#16120f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8d0b4';
    [[0.2, 0.2, 13], [0.7, 0.12, 10], [0.45, 0.5, 14], [0.9, 0.55, 11], [0.12, 0.78, 12], [0.62, 0.86, 13]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x * w, y * h, r, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#c4bc9c';
    ctx.lineWidth = 3;
    [[0.3, 0.68], [0.82, 0.3]].forEach(([x, y]) => {
      const cx = x * w, cy = y * h;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx, cy + 15);
      ctx.lineTo(cx - 10, cy);
      ctx.closePath();
      ctx.stroke();
    });
  }

  function drawManFace(kind, eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const isRoman = kind === 'roman';
      ctx.fillStyle = isRoman ? 'rgba(62, 44, 34, 0.46)' : 'rgba(58, 46, 36, 0.38)';
      ctx.beginPath();
      ctx.ellipse(128, 224, isRoman ? 66 : 58, 26, 0, 0, PI * 2);
      ctx.fill();

      ctx.fillStyle = isRoman ? 'rgba(48, 32, 24, 0.52)' : 'rgba(54, 42, 32, 0.44)';
      ctx.beginPath();
      ctx.ellipse(128, 174, isRoman ? 34 : 28, 8, 0, 0, PI * 2);
      ctx.fill();

      const ey = 94;
      ctx.strokeStyle = '#241a14';
      ctx.lineWidth = isRoman ? 8.5 : 8;
      [[80, -1], [176, 1]].forEach(([x, s]) => {
        const frown = !isRoman ? 5 : (eyes === 'wide' ? -5 : 0);
        ctx.beginPath();
        ctx.moveTo(x - s * 25, ey - 16 + frown);
        ctx.quadraticCurveTo(x, ey - 24 - (eyes === 'wide' ? 4 : 0), x + s * 24, ey - 18 - frown * 0.5);
        ctx.stroke();
      });

      [80, 176].forEach(x => {
        if (eyes === 'shut') {
          ctx.strokeStyle = '#261a14';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(x - 18, ey + 2);
          ctx.quadraticCurveTo(x, ey + 7, x + 18, ey + 2);
          ctx.stroke();
          return;
        }
        const tall = eyes === 'wide' ? 9.5 : eyes === 'half' ? 5.2 : 7.6;
        ctx.fillStyle = '#ece4dc';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 17.5, tall, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3c2c22';
        ctx.beginPath();
        ctx.arc(x, ey + 2, Math.min(7, tall + 0.4), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#120e0c';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 3.2, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#241812';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 17, ey + 2 - tall * 0.55);
        ctx.quadraticCurveTo(x, ey - tall - 2, x + 17, ey + 2 - tall * 0.55);
        ctx.stroke();
      });

      ctx.fillStyle = 'rgba(112, 68, 52, 0.45)';
      ctx.beginPath();
      ctx.ellipse(128, 144, isRoman ? 19 : 16, 7.5, 0, 0, PI * 2);
      ctx.fill();

      const my = 196;
      ctx.fillStyle = '#261012';
      ctx.strokeStyle = '#5e342e';
      ctx.lineWidth = 4.2;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(102, my + 2);
        ctx.quadraticCurveTo(128, my - 1, 154, my + 2);
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 14 : 8;
        const ww = mouth === 'wide' ? 23 : 17;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, ww, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e4dcd2';
        ctx.fillRect(114, my - hh + 3.5, 28, mouth === 'wide' ? 4 : 2.5);
      }
      ctx.restore();
    };
  }

  function buildRomanTorso(b) {
    loft(b, [
      ring(-0.28, 0.24, 0.18, 0.01, COL_R.shirt),
      ring(-0.14, 0.275, 0.215, 0.035, COL_R.shirt),
      ring(0.02, 0.285, 0.22, 0.04, COL_R.shirt),
      ring(0.16, 0.27, 0.195, 0.02, COL_R.shirt),
      ring(0.26, 0.21, 0.145, 0.0, COL_R.shirt),
      ring(0.31, 0.12, 0.095, 0.0, COL_R.skin)
    ], 16, { capBottom: true, capTop: true, uv: true });

    b.quad([-0.065, 0.14, 0.198], [0.065, 0.14, 0.198], [0.052, 0.285, 0.132], [-0.052, 0.285, 0.132], COL_R.undershirt);
    boxAt(b, [-0.078, 0.24, 0.145], [0.048, 0.095, 0.025], COL_R.shirtCollar, M4.rotZ(0.32));
    boxAt(b, [0.078, 0.24, 0.145], [0.048, 0.095, 0.025], COL_R.shirtCollar, M4.rotZ(-0.32));
  }

  function buildNikoTorso(b) {
    loft(b, [
      ring(-0.28, 0.21, 0.15, 0.0, COL_N.jacket),
      ring(-0.12, 0.23, 0.165, 0.01, COL_N.jacket),
      ring(0.04, 0.245, 0.175, 0.015, COL_N.jacket),
      ring(0.18, 0.24, 0.165, 0.01, COL_N.jacket),
      ring(0.27, 0.19, 0.13, 0.0, COL_N.hoodie),
      ring(0.32, 0.11, 0.09, 0.0, COL_N.skin)
    ], 16, { capBottom: true, capTop: true, hard: true });

    b.quad([-0.05, -0.26, 0.162], [0.05, -0.26, 0.162], [0.048, 0.25, 0.165], [-0.048, 0.25, 0.165], COL_N.hoodie);
    [-1, 1].forEach(s => {
      boxAt(b, [s * 0.14, 0.235, 0.02], [0.11, 0.022, 0.18], COL_N.jacketStripe, M4.rotZ(s * -0.18));
    });
  }

  function buildManHead(col, hairCol) {
    return (b) => {
      const R = 0.115;
      b.ellipsoid(R * 1.06, R * 1.02, R * 1.0, 14, 10, col);
      [-1, 1].forEach(s => b.at(s * R * 1.02, -R * 0.04, -R * 0.03, h => h.ellipsoid(R * 0.12, R * 0.21, R * 0.14, 6, 4, shade(col, 0.88))));
      b.at(0, -R * 0.06, R * 0.98, h => h.ellipsoid(R * 0.19, R * 0.2, R * 0.16, 6, 4, shade(col, 0.94)));
      const nu = 16, nv = 6;
      const lower = (yaw) => (Math.abs(yaw) < 0.92 ? 0.44 : Math.abs(yaw) < 1.65 ? 0.16 : -0.38);
      const pt = (i, j) => {
        const yaw = -PI + (i / nu) * 2 * PI;
        const p0 = lower(yaw);
        const pit = p0 + (PI / 2 - p0) * (j / nv);
        const k = 1.035;
        return [S(yaw) * C(pit) * R * 1.06 * k, S(pit) * R * 1.02 * k + R * 0.015, C(yaw) * C(pit) * R * k];
      };
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), hairCol);
        }
      }
    };
  }

  function buildManHand(col, side, mode) {
    return (b) => {
      const inward = side === 'L' ? -1 : 1;
      b.at(0, -0.045, 0, h => h.box(0.085, 0.082, 0.032, col));
      [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
        const len = mode === 'open' || mode === 'wave' ? 0.072 : 0.045;
        const rz = mode === 'open' || mode === 'wave' ? (x / 0.03) * 0.18 : 0;
        b.push(M4.translate(x, -0.082, 0), M4.rotZ(rz));
        b.at(0, -len * 0.5, 0, h => h.box(0.019, len, 0.022, col));
        b.pop();
      });
      b.push(M4.translate(inward * 0.048, -0.038, 0.008), M4.rotZ(inward * 0.65));
      b.at(0, -0.032, 0, h => h.box(0.022, 0.062, 0.022, col));
      b.pop();
    };
  }

  function build(r) {
    const R_T = D_TOHRU.head;
    const tohruEyes = {};
    ['wide', 'open', 'half', 'happy', 'shut'].forEach(st => {
      tohruEyes[st] = r.texture(512, drawTohruEyes(st), { height: 256, clamp: true });
    });
    const tohruMouths = {};
    ['shut', 'smile', 'open', 'wide', 'smileOpen'].forEach(st => {
      tohruMouths[st] = r.texture(256, drawTohruMouth(st), { height: 128, clamp: true });
    });

    const romanFaces = {}, nikoFaces = {};
    ['shut', 'half', 'open', 'wide'].forEach(e => {
      ['shut', 'open', 'wide'].forEach(m => {
        romanFaces[e + '-' + m] = r.texture(256, drawManFace('roman', e, m), { clamp: true });
        nikoFaces[e + '-' + m] = r.texture(256, drawManFace('niko', e, m), { clamp: true });
      });
    });

    const tohruHandsL = {}, tohruHandsR = {};
    ['relax', 'clasp', 'glasses'].forEach(st => {
      tohruHandsL[st] = mesh(r, buildTohruHand(1, st));
      tohruHandsR[st] = mesh(r, buildTohruHand(-1, st));
    });

    const romanHands = {}, nikoHands = {};
    ['L', 'R'].forEach(s => {
      ['relax', 'open', 'wave'].forEach(gr => {
        romanHands[s + gr] = mesh(r, buildManHand(COL_R.skin, s, gr));
        nikoHands[s + gr] = mesh(r, buildManHand(COL_N.skin, s, gr));
      });
    });

    return {
      tohru: {
        eyes: tohruEyes,
        mouths: tohruMouths,
        head: mesh(r, buildTohruHead(R_T)),
        eyePatch: mesh(r, b => headGrid(b, R_T, EYE_PATCH[0], EYE_PATCH[1], EYE_PATCH[2], EYE_PATCH[3], 18, 10, null, 1.006, true)),
        mouthPatch: mesh(r, b => headGrid(b, R_T, MOUTH_PATCH[0], MOUTH_PATCH[1], MOUTH_PATCH[2], MOUTH_PATCH[3], 16, 10, null, 1.006, true)),
        hair: mesh(r, buildTohruHair(R_T)),
        torso: mesh(r, buildTohruTorso),
        pelvis: mesh(r, buildTohruPelvis),
        upper: mesh(r, buildTohruUpperArm),
        fore: mesh(r, buildTohruForearm),
        handsL: tohruHandsL,
        handsR: tohruHandsR,
        thigh: mesh(r, b => loft(b, [ring(-D_TOHRU.thigh, 0.048, 0.048, 0, COL_T.white), ring(0, 0.064, 0.062, 0, COL_T.white)], 10, { capTop: true, capBottom: true })),
        shin: mesh(r, b => loft(b, [ring(-D_TOHRU.shin, 0.034, 0.034, 0, COL_T.white), ring(0, 0.046, 0.046, 0, COL_T.white)], 10, { capTop: true, capBottom: true })),
        foot: mesh(r, b => boxAt(b, [0, -0.025, 0.04], [0.066, 0.042, 0.14], COL_T.navyDark)),
        glasses: mesh(r, buildGlasses)
      },
      roman: {
        faces: romanFaces,
        shirtTex: r.texture(128, drawRomanShirtTex),
        torso: mesh(r, buildRomanTorso),
        pelvis: mesh(r, b => loft(b, [ring(-0.18, 0.22, 0.17, 0, COL_R.pants), ring(0.04, 0.24, 0.18, 0, COL_R.pants)], 12, { capTop: true, capBottom: true })),
        neck: mesh(r, b => loft(b, [ring(-0.06, 0.1, 0.09, 0, COL_R.skin), ring(0.08, 0.095, 0.085, 0, COL_R.skin)], 10)),
        head: mesh(r, buildManHead(COL_R.skin, COL_R.hair)),
        face: mesh(r, b => spherePatch(b, 0.115 * 1.066, 0.115 * 1.026, 0.115 * 1.008, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
        upper: mesh(r, b => loft(b, [ring(-D_ROMAN.upper, 0.072, 0.068, 0, COL_R.skin), ring(-0.11, 0.088, 0.084, 0, COL_R.shirt), ring(0.02, 0.095, 0.09, 0, COL_R.shirt)], 10, { capTop: true, capBottom: true, hard: true })),
        fore: mesh(r, b => loft(b, [ring(-D_ROMAN.fore, 0.056, 0.052, 0, COL_R.skin), ring(0, 0.072, 0.068, 0, COL_R.skin)], 10, { capTop: true, capBottom: true })),
        hands: romanHands,
        thigh: mesh(r, b => loft(b, [ring(-D_ROMAN.thigh, 0.095, 0.09, 0, COL_R.pants), ring(0, 0.125, 0.12, 0, COL_R.pants)], 10, { capTop: true, capBottom: true })),
        shin: mesh(r, b => loft(b, [ring(-D_ROMAN.shin, 0.075, 0.072, 0, COL_R.pants), ring(0, 0.092, 0.088, 0, COL_R.pants)], 10, { capTop: true, capBottom: true })),
        foot: mesh(r, b => boxAt(b, [0, -0.04, 0.06], [0.11, 0.06, 0.22], COL_R.shoe))
      },
      niko: {
        faces: nikoFaces,
        torso: mesh(r, buildNikoTorso),
        pelvis: mesh(r, b => loft(b, [ring(-0.18, 0.19, 0.14, 0, COL_N.pants), ring(0.04, 0.21, 0.15, 0, COL_N.pants)], 12, { capTop: true, capBottom: true })),
        neck: mesh(r, b => loft(b, [ring(-0.06, 0.09, 0.082, 0, COL_N.skin), ring(0.08, 0.085, 0.078, 0, COL_N.skin)], 10)),
        head: mesh(r, buildManHead(COL_N.skin, COL_N.hair)),
        face: mesh(r, b => spherePatch(b, 0.115 * 1.066, 0.115 * 1.026, 0.115 * 1.008, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
        upper: mesh(r, b => {
          loft(b, [ring(-D_NIKO.upper, 0.076, 0.072, 0, COL_N.jacket), ring(0.02, 0.092, 0.088, 0, COL_N.jacket)], 10, { capTop: true, capBottom: true });
          boxAt(b, [0, -D_NIKO.upper * 0.5, 0.074], [0.022, D_NIKO.upper * 0.88, 0.012], COL_N.jacketStripe);
        }),
        fore: mesh(r, b => {
          loft(b, [ring(-D_NIKO.fore, 0.06, 0.056, 0, COL_N.jacket), ring(0, 0.074, 0.07, 0, COL_N.jacket)], 10, { capTop: true, capBottom: true });
          boxAt(b, [0, -D_NIKO.fore * 0.5, 0.06], [0.02, D_NIKO.fore * 0.85, 0.012], COL_N.jacketStripe);
        }),
        hands: nikoHands,
        thigh: mesh(r, b => loft(b, [ring(-D_NIKO.thigh, 0.088, 0.084, 0, COL_N.pants), ring(0, 0.112, 0.106, 0, COL_N.pants)], 10, { capTop: true, capBottom: true })),
        shin: mesh(r, b => loft(b, [ring(-D_NIKO.shin, 0.07, 0.068, 0, COL_N.pants), ring(0, 0.086, 0.082, 0, COL_N.pants)], 10, { capTop: true, capBottom: true })),
        foot: mesh(r, b => boxAt(b, [0, -0.04, 0.06], [0.1, 0.058, 0.22], COL_N.shoe))
      }
    };
  }

  function solve(who, pose) {
    const D = DIMS[who] || D_ROMAN;
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = pose.fwd || [sy, -lean, cy];
    const up = pose.up || [S(roll) * cy, C(roll), -S(roll) * sy];
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, 0.9, 0], fwd, up }), D);
  }

  function drawTohru(r, CMesh, m, pose, pass) {
    r.draw(CMesh.pelvis, m.pelvis, pass);
    r.draw(CMesh.torso, m.chest, pass);
    r.draw(CMesh.upper, m.upperL, pass);
    r.draw(CMesh.upper, m.upperR, pass);
    r.draw(CMesh.fore, m.foreL, pass);
    r.draw(CMesh.fore, m.foreR, pass);
    r.draw(CMesh.handsL[pose.gL || 'relax'] || CMesh.handsL.relax, m.handL, pass);
    r.draw(CMesh.handsR[pose.gR || 'relax'] || CMesh.handsR.relax, m.handR, pass);
    r.draw(CMesh.thigh, m.thighL, pass);
    r.draw(CMesh.thigh, m.thighR, pass);
    r.draw(CMesh.shin, m.shinL, pass);
    r.draw(CMesh.shin, m.shinR, pass);
    r.draw(CMesh.foot, m.footL, pass);
    r.draw(CMesh.foot, m.footR, pass);

    r.draw(CMesh.head, m.head, pass);
    if (!pass.noFace) {
      r.draw(CMesh.eyePatch, m.head, Object.assign({ texture: CMesh.eyes[pose.eyes || 'open'] || CMesh.eyes.open }, pass));
      r.draw(CMesh.mouthPatch, m.head, Object.assign({ texture: CMesh.mouths[pose.mouth || 'smile'] || CMesh.mouths.smile }, pass));
    }
    r.draw(CMesh.hair, m.head, pass);

    if (pose.glasses && !pass.noFace) {
      const g = pose.glasses;
      const gm = M4.chain(
        M4.translate(g.pos[0], g.pos[1], g.pos[2]),
        M4.rotY(g.yaw || 0),
        M4.rotX(g.pitch || 0),
        M4.rotZ(g.roll || 0),
        M4.scale(g.scale || 1.2)
      );
      r.draw(CMesh.glasses, gm, { blend: true, alpha: 0.92, noFog: true });
    }
  }

  function drawMan(r, CMesh, who, m, pose, pass) {
    r.draw(CMesh.pelvis, m.pelvis, pass);
    if (who === 'roman') {
      r.draw(CMesh.torso, m.chest, Object.assign({ texture: CMesh.shirtTex }, pass));
    } else {
      r.draw(CMesh.torso, m.chest, pass);
    }
    r.draw(CMesh.neck, m.neck, pass);
    r.draw(CMesh.head, m.head, pass);
    if (!pass.noFace) {
      const e = ['shut', 'half', 'open', 'wide'].includes(pose.eyes) ? pose.eyes : 'open';
      const mo = ['shut', 'open', 'wide'].includes(pose.mouth) ? pose.mouth : 'shut';
      r.draw(CMesh.face, m.head, Object.assign({ texture: CMesh.faces[e + '-' + mo] }, pass));
    }
    ['L', 'R'].forEach(s => {
      r.draw(CMesh.upper, m['upper' + s], pass);
      r.draw(CMesh.fore, m['fore' + s], pass);
      const gr = pose['g' + s] || 'relax';
      r.draw(CMesh.hands[s + gr] || CMesh.hands[s + 'relax'], m['hand' + s], pass);
      r.draw(CMesh.thigh, m['thigh' + s], pass);
      r.draw(CMesh.shin, m['shin' + s], pass);
      r.draw(CMesh.foot, m['foot' + s], pass);
    });
  }

  function draw(r, V, who, m, pose, opts) {
    const o = opts || {};
    const pass = o.alpha ? { blend: true, alpha: o.alpha, noFace: o.noFace } : {};
    if (who === 'tohru') drawTohru(r, V.tohru, m, pose, pass);
    else if (who === 'roman') drawMan(r, V.roman, 'roman', m, pose, pass);
    else if (who === 'niko') drawMan(r, V.niko, 'niko', m, pose, pass);
  }

  window.RomanCast = { DIMS, build, solve, draw };
})();
