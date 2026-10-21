(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = {
    hipX: 0.082, hipY: -0.04, thigh: 0.35, shin: 0.34,
    chestY: 0.105, neckY: 0.235, shX: 0.142, shY: 0.168,
    upper: 0.215, fore: 0.195, headY: 0.125, head: 0.124
  };

  const COL = {
    skin: 0xf4d4c2,
    skinShade: 0xdab29c,
    hairDark: 0x261520,
    hairBrown: 0x3b2230,
    hairTip: 0x8e1e36,
    red: 0xc81832,
    redBright: 0xe82442,
    redDark: 0x7c0c1c,
    gold: 0xe6b84c,
    goldLight: 0xffe494,
    goldDark: 0x9c7224,
    white: 0xf6f0ea,
    cream: 0xe8dfd6,
    black: 0x1c1620,
    navy: 0x1e2848,
    navyLight: 0x2e3c68,
    shadow: 0x140818,
    shadowRed: 0xff1e48
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

  function cylBetween(b, p0, p1, r0, r1, sides, col, rotM) {
    if (rotM) b.push(rotM);
    K.tube(b, [p0, p1], [r0, r1], sides, col);
    if (rotM) b.pop();
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
          const c = rgb(colAt ? colAt(y0 + (y1 - y0) * u, p0 + (p1 - p0) * v) : COL.skin);
          return uv ? [1, 1, 1, 0] : c;
        });
        b.quad(ps[0], ps[1], ps[2], ps[3], cols, uv ? pts : null, ns);
      }
    }
  }

  function drawBlossom(ctx, cx, cy, rOuter, rInner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * PI) / 5 - PI / 2;
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = cx + C(a) * r, y = cy + S(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawEyes(state) {
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      ctx.fillStyle = hex(COL.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const ey = m.y(-0.12);
      const rw = 0.245 * m.kx;
      const openMap = { wide: 0.205, crazy: 0.215, open: 0.175, half: 0.095, wink: 0.175, shut: 0 };
      const openK = openMap[state] !== undefined ? openMap[state] : 0.175;

      [-1, 1].forEach(sd => {
        const isClosed = state === 'shut' || (state === 'wink' && sd < 0);
        const rh = (isClosed ? 0 : openK) * m.ky;
        const cx = m.x(sd * 0.35);
        soft(ctx, cx, ey + m.ky * 0.11, rw * 1.35, rw * 0.55, 0xf27080, 0.35);

        const browLift = state === 'wide' || state === 'crazy' ? 0.035 : state === 'half' ? -0.018 : 0;
        const by = m.y(0.11 + browLift);
        ctx.strokeStyle = '#381824';
        ctx.lineWidth = Math.max(2.6, 0.016 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - sd * rw * 0.85, by + 0.015 * m.ky);
        ctx.quadraticCurveTo(cx, by - 0.038 * m.ky, cx + sd * rw * 0.95, by + 0.022 * m.ky);
        ctx.stroke();

        if (isClosed) {
          ctx.strokeStyle = '#24101a';
          ctx.lineWidth = Math.max(4.5, 0.032 * m.ky);
          ctx.beginPath();
          ctx.moveTo(cx - sd * rw * 0.95, ey + 0.01 * m.ky);
          ctx.quadraticCurveTo(cx, ey + (state === 'wink' ? -0.045 : 0.068) * m.ky, cx + sd * rw * 1.02, ey - 0.005 * m.ky);
          ctx.stroke();

          ctx.strokeStyle = '#e82848';
          ctx.lineWidth = Math.max(2.4, 0.016 * m.ky);
          ctx.beginPath();
          ctx.moveTo(cx + sd * rw * 0.35, ey + 0.042 * m.ky);
          ctx.lineTo(cx + sd * rw * 1.08, ey + 0.004 * m.ky);
          ctx.stroke();
          return;
        }

        const inner = cx - sd * rw * 0.92;
        const outer = cx + sd * rw * 0.98;
        const topY = state === 'half' ? ey - rh * 0.52 : ey - rh * 0.98;
        const botY = ey + rh * 0.88;

        const eyeShape = () => {
          ctx.beginPath();
          if (state === 'half') {
            ctx.moveTo(inner, ey - rh * 0.15);
            ctx.lineTo(outer, ey - rh * 0.22);
            ctx.bezierCurveTo(cx + sd * rw * 0.55, botY, cx - sd * rw * 0.5, botY, inner, ey - rh * 0.15);
          } else {
            ctx.moveTo(inner, ey + rh * 0.08);
            ctx.bezierCurveTo(cx - sd * rw * 0.55, topY, cx + sd * rw * 0.55, topY, outer, ey - rh * 0.08);
            ctx.bezierCurveTo(cx + sd * rw * 0.5, botY, cx - sd * rw * 0.5, botY, inner, ey + rh * 0.08);
          }
          ctx.closePath();
        };

        eyeShape();
        ctx.fillStyle = '#fff9fa';
        ctx.fill();

        ctx.save();
        eyeShape();
        ctx.clip();

        const irx = rw * (state === 'crazy' ? 0.56 : 0.64);
        const iry = m.ky * (state === 'crazy' ? 0.15 : 0.17);
        const ix = cx - sd * rw * 0.05;
        const iy = ey + m.ky * 0.005;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.scale(irx, iry);

        const ig = ctx.createLinearGradient(0, -1, 0, 1);
        ig.addColorStop(0, '#4a0618');
        ig.addColorStop(0.32, '#a81032');
        ig.addColorStop(0.68, '#ff2454');
        ig.addColorStop(1, '#ff98b8');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, PI * 2);
        ctx.fill();

        if (state === 'crazy') {
          ctx.strokeStyle = '#ffccd8';
          ctx.lineWidth = 0.12;
          ctx.beginPath();
          ctx.arc(0, 0, 0.72, 0, PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 0.42, 0, PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#320410';
        ctx.beginPath();
        ctx.arc(0, -0.02, state === 'crazy' ? 0.26 : 0.38, 0, PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = state === 'crazy' ? '#fff088' : '#ffb8d0';
        drawBlossom(ctx, ix, iy + iry * 0.08, irx * 0.34, irx * 0.14);

        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.42, iy - iry * 0.38, irx * 0.24, iry * 0.18, -0.35, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + irx * 0.28, iy + iry * 0.42, irx * 0.14, iry * 0.1, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#200e18';
        ctx.beginPath();
        ctx.moveTo(inner - sd * rw * 0.05, ey + rh * 0.12);
        ctx.bezierCurveTo(cx - sd * rw * 0.55, topY - 0.034 * m.ky, cx + sd * rw * 0.58, topY - 0.036 * m.ky, outer + sd * rw * 0.16, ey - rh * 0.14);
        ctx.lineTo(outer + sd * rw * 0.02, ey + rh * 0.12);
        ctx.bezierCurveTo(cx + sd * rw * 0.48, topY + 0.018 * m.ky, cx - sd * rw * 0.5, topY + 0.018 * m.ky, inner, ey + rh * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#d81c3c';
        ctx.lineWidth = Math.max(2.4, 0.014 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx + sd * rw * 0.3, botY - 0.005 * m.ky);
        ctx.quadraticCurveTo(cx + sd * rw * 0.82, botY - 0.015 * m.ky, outer + sd * rw * 0.1, ey - rh * 0.04);
        ctx.stroke();

        if (sd < 0) {
          ctx.fillStyle = '#d81c3c';
          ctx.beginPath();
          ctx.arc(outer + sd * rw * 0.05, botY + 0.032 * m.ky, 0.016 * m.kx, 0, PI * 2);
          ctx.fill();
        }
      });
    };
  }

  function drawMouth(state) {
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      ctx.fillStyle = hex(COL.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = m.x(0);
      const my = m.y(-0.62);
      const hw = 0.135 * m.kx;

      [-1, 1].forEach(sd => {
        soft(ctx, cx + sd * 0.36 * m.kx, m.y(-0.44), 0.18 * m.kx, 0.09 * m.ky, 0xf07884, 0.3);
      });

      ctx.fillStyle = 'rgba(165,105,95,0.75)';
      ctx.beginPath();
      ctx.moveTo(cx, m.y(-0.41));
      ctx.lineTo(cx + 0.018 * m.kx, m.y(-0.45));
      ctx.lineTo(cx - 0.008 * m.kx, m.y(-0.46));
      ctx.closePath();
      ctx.fill();

      if (state === 'o') {
        const rx = hw * 0.58, ry = 0.068 * m.ky;
        ctx.fillStyle = '#982032';
        ctx.beginPath();
        ctx.ellipse(cx, my, rx, ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5c101c';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(cx, my, rx, ry, 0, 0, PI * 2);
        ctx.stroke();
        return;
      }

      if (state === 'open' || state === 'talk' || state === 'wide' || state === 'laugh') {
        const openH = (state === 'laugh' ? 0.088 : state === 'wide' ? 0.075 : state === 'open' ? 0.056 : 0.038) * m.ky;
        const mw = hw * (state === 'laugh' ? 1.18 : state === 'wide' ? 1.05 : 0.86);
        const shape = () => {
          ctx.beginPath();
          ctx.moveTo(cx - mw, my - openH * 0.22);
          ctx.quadraticCurveTo(cx, my - openH * 0.52, cx + mw, my - openH * 0.22);
          ctx.bezierCurveTo(cx + mw * 0.85, my + openH * 1.15, cx - mw * 0.85, my + openH * 1.15, cx - mw, my - openH * 0.22);
          ctx.closePath();
        };
        shape();
        ctx.fillStyle = '#9c1e34';
        ctx.fill();
        ctx.save();
        shape();
        ctx.clip();
        ctx.fillStyle = '#e8586c';
        ctx.beginPath();
        ctx.ellipse(cx, my + openH * 0.55, mw * 0.78, openH * 0.65, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - mw * 0.65, my - openH * 0.45, mw * 1.3, openH * 0.32);
        ctx.restore();
        ctx.strokeStyle = '#5e1220';
        ctx.lineWidth = 2.4;
        shape();
        ctx.stroke();
        return;
      }

      if (state === 'smirk') {
        const mw = hw * 0.88;
        ctx.fillStyle = '#b82840';
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.8, my + 0.006 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.1, my - 0.012 * m.ky, cx + mw, my - 0.028 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.3, my + 0.04 * m.ky, cx - mw * 0.8, my + 0.006 * m.ky);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#681422';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.85, my + 0.006 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.1, my - 0.012 * m.ky, cx + mw * 1.04, my - 0.028 * m.ky);
        ctx.stroke();
        return;
      }

      const curve = state === 'smile' ? 0.03 * m.ky : 0.012 * m.ky;
      ctx.strokeStyle = '#781e2c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.78, my - curve * 0.25);
      ctx.quadraticCurveTo(cx, my + curve, cx + hw * 0.82, my - curve * 0.35);
      ctx.stroke();
    };
  }

  function buildKitsuneMaskMesh() {
    return (b) => {
      sphereAt(b, [0, 0, 0], 0.078, 12, 10, COL.white, M4.scale(0.95, 1.08, 0.55));
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.048, 0.068, -0.005), M4.rotZ(-s * 0.28));
        cylBetween(b, [0, 0, 0], [0, 0.055, 0], 0.028, 0.004, 6, COL.white);
        cylBetween(b, [0, 0.008, 0.008], [0, 0.046, 0.006], 0.018, 0.003, 5, COL.redBright);
        b.pop();

        boxAt(b, [s * 0.032, 0.012, 0.038], [0.032, 0.01, 0.012], COL.redBright, M4.rotZ(s * 0.25));
        boxAt(b, [s * 0.038, -0.022, 0.036], [0.026, 0.008, 0.01], COL.redBright, M4.rotZ(-s * 0.18));
        boxAt(b, [s * 0.028, 0.036, 0.036], [0.024, 0.008, 0.01], COL.gold, M4.rotZ(s * 0.32));
      });
      sphereAt(b, [0, -0.012, 0.044], 0.014, 6, 5, COL.redBright);
      boxAt(b, [0, 0.045, 0.038], [0.012, 0.028, 0.01], COL.redBright);
    };
  }

  function buildHeadBase(R) {
    return (b) => {
      const colAt = (yaw, pit) => {
        if (pit > 0.36 || Math.abs(yaw) > 1.38) return COL.hairDark;
        return COL.skin;
      };
      headGrid(b, R, -PI, PI, -PI / 2, PI / 2, 24, 16, colAt);
      [-1, 1].forEach(s => {
        const earX = s * R * 0.9;
        sphereAt(b, [earX, -R * 0.1, -R * 0.04], R * 0.12, 6, 5, COL.skin);
        sphereAt(b, [earX, -R * 0.25, -R * 0.01], 0.014, 6, 5, COL.gold);
        sphereAt(b, [earX, -R * 0.3, -R * 0.01], 0.01, 6, 5, COL.redBright);
      });
    };
  }

  function buildHair(R) {
    return (b) => {
      headGrid(b, R, -PI, PI, 0.16, PI / 2, 20, 10, () => COL.hairDark, 1.068);
      headGrid(b, R, -PI, -1.1, -0.45, 0.2, 8, 8, () => COL.hairDark, 1.075);
      headGrid(b, R, 1.1, PI, -0.45, 0.2, 8, 8, () => COL.hairDark, 1.075);

      const bangs = [
        [-0.78, -0.36, -0.04, COL.hairDark, 1.084],
        [-0.36, -0.08, -0.06, COL.hairBrown, 1.09],
        [-0.08, 0.14, -0.02, COL.hairDark, 1.088],
        [0.14, 0.44, -0.05, COL.hairBrown, 1.09],
        [0.44, 0.78, -0.04, COL.hairDark, 1.084]
      ];
      bangs.forEach(([y0, y1, pBot, col, sc]) => {
        headGrid(b, R, y0, y1, pBot, 0.52, 4, 5, () => col, sc);
      });

      [-1, 1].forEach(s => {
        const sideLock = [
          [s * R * 0.84, R * 0.2, R * 0.36],
          [s * R * 0.94, -R * 0.1, R * 0.42],
          [s * R * 0.86, -R * 0.42, R * 0.38],
          [s * R * 0.72, -R * 0.72, R * 0.34]
        ];
        K.tube(b, sideLock, [0.028, 0.03, 0.024, 0.01], 7, COL.hairDark);

        const tx = s * R * 1.02, ty = R * 0.56, tz = -R * 0.12;
        sphereAt(b, [tx, ty, tz], R * 0.34, 8, 6, COL.hairDark);
        boxAt(b, [tx + s * 0.018, ty + 0.036, tz + 0.02], [0.072, 0.028, 0.048], COL.redBright, M4.rotZ(s * 0.35));
        sphereAt(b, [tx + s * 0.025, ty + 0.018, tz + 0.035], 0.016, 6, 5, COL.gold);

        const tailPts = [
          [tx, ty - 0.02, tz],
          [tx + s * 0.08, ty - 0.18, tz - 0.02],
          [tx + s * 0.11, ty - 0.42, tz - 0.01],
          [tx + s * 0.09, ty - 0.68, tz + 0.02],
          [tx + s * 0.12, ty - 0.88, tz + 0.04]
        ];
        K.tube(b, tailPts, [0.038, 0.052, 0.056, 0.042, 0.016], 8, COL.hairDark);
        const tipPts = [
          [tx + s * 0.09, ty - 0.62, tz + 0.022],
          [tx + s * 0.12, ty - 0.89, tz + 0.042]
        ];
        K.tube(b, tipPts, [0.043, 0.018], 8, COL.hairTip);
      });
    };
  }

  function buildTorso(mode) {
    return (b) => {
      if (mode === 'school') {
        loft(b, [
          ring(-0.12, 0.102, 0.078, 0, COL.navy),
          ring(-0.02, 0.092, 0.072, 0.004, COL.white),
          ring(0.12, 0.108, 0.086, 0.01, COL.white),
          ring(0.22, 0.114, 0.074, 0, COL.navy),
          ring(0.245, 0.052, 0.046, 0.005, COL.skin),
          ring(0.29, 0.046, 0.042, 0.008, COL.skin)
        ], 16, { hard: true, capTop: true, capBottom: true });
        boxAt(b, [0, 0.18, 0.086], [0.16, 0.08, 0.03], COL.navy);
        boxAt(b, [0, 0.14, 0.095], [0.06, 0.06, 0.025], COL.redBright);
        b.tri([-0.028, 0.13, 0.098], [0.028, 0.13, 0.098], [0, 0.02, 0.102], COL.redBright, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        return;
      }

      const isShadow = mode === 'shadow';
      const cMain = isShadow ? COL.shadow : COL.red;
      const cAccent = isShadow ? COL.shadowRed : COL.white;
      const cGold = isShadow ? COL.shadowRed : COL.gold;

      loft(b, [
        ring(-0.12, 0.104, 0.08, 0, cMain),
        ring(-0.03, 0.092, 0.072, 0.004, COL.black),
        ring(0.06, 0.106, 0.086, 0.01, cMain),
        ring(0.14, 0.108, 0.086, 0.01, cAccent),
        ring(0.22, 0.114, 0.072, 0, isShadow ? COL.shadow : COL.skin),
        ring(0.245, 0.052, 0.046, 0.005, COL.black),
        ring(0.29, 0.046, 0.042, 0.008, isShadow ? COL.shadow : COL.skin)
      ], 16, { hard: true, capTop: true, capBottom: true });

      boxAt(b, [0, -0.02, 0.082], [0.19, 0.07, 0.04], cGold);
      boxAt(b, [0, 0.16, 0.094], [0.075, 0.048, 0.032], cMain);
      sphereAt(b, [0, 0.16, 0.112], 0.02, 8, 6, cGold);
      sphereAt(b, [-0.025, 0.11, 0.105], 0.012, 6, 5, cGold);
      sphereAt(b, [0.025, 0.11, 0.105], 0.012, 6, 5, cGold);

      b.push(M4.translate(0, 0.04, -0.11));
      boxAt(b, [-0.09, 0.02, 0], [0.14, 0.09, 0.04], cMain, M4.rotZ(0.28));
      boxAt(b, [0.09, 0.02, 0], [0.14, 0.09, 0.04], cMain, M4.rotZ(-0.28));
      sphereAt(b, [0, 0.02, -0.01], 0.036, 8, 6, cGold);
      cylBetween(b, [-0.04, 0, -0.01], [-0.11, -0.26, -0.04], 0.025, 0.045, 6, cMain);
      cylBetween(b, [0.04, 0, -0.01], [0.11, -0.26, -0.04], 0.025, 0.045, 6, cMain);
      b.pop();
    };
  }

  function buildPelvis(mode) {
    return (b) => {
      const cSkirt = mode === 'school' ? COL.navy : mode === 'shadow' ? COL.shadow : COL.red;
      const cTrim = mode === 'school' ? COL.white : mode === 'shadow' ? COL.shadowRed : COL.gold;
      loft(b, [
        ring(-0.16, 0.175, 0.155, 0, cTrim),
        ring(-0.13, 0.165, 0.145, 0, cSkirt),
        ring(-0.04, 0.132, 0.112, 0, cSkirt),
        ring(0.03, 0.106, 0.084, 0, COL.black)
      ], 16, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildUpperArm(mode) {
    return (b) => {
      const len = D.upper;
      const cSkin = mode === 'shadow' ? COL.shadow : COL.skin;
      const cSleeve = mode === 'school' ? COL.white : mode === 'shadow' ? COL.shadow : COL.red;
      loft(b, [
        ring(-len, 0.046, 0.046, 0, cSleeve),
        ring(-len * 0.35, 0.038, 0.038, 0, cSleeve),
        ring(0, 0.034, 0.034, 0, cSkin)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildForearm(side, mode) {
    return (b) => {
      const len = D.fore;
      const cSkin = mode === 'shadow' ? COL.shadow : COL.skin;
      const cSleeve = mode === 'school' ? COL.white : mode === 'shadow' ? COL.shadow : COL.white;
      const cTrim = mode === 'school' ? COL.navy : mode === 'shadow' ? COL.shadowRed : COL.red;
      loft(b, [
        ring(-len, 0.028, 0.026, 0, cSkin),
        ring(-len * 0.65, 0.068, 0.062, 0, cTrim),
        ring(-len * 0.55, 0.064, 0.058, 0, cSleeve),
        ring(-len * 0.15, 0.048, 0.044, 0, cSleeve),
        ring(0, 0.038, 0.036, 0, cSkin)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildHand(side) {
    return (b) => {
      const s = side;
      boxAt(b, [0, -0.022, 0], [0.038, 0.042, 0.022], COL.skin);
      boxAt(b, [0, -0.004, 0], [0.044, 0.012, 0.026], COL.red);
      [-0.014, -0.005, 0.005, 0.014].forEach(ox => {
        cylBetween(b, [ox * s, -0.04, 0.002], [ox * s, -0.076, 0.006], 0.006, 0.0048, 5, COL.skin);
        sphereAt(b, [ox * s, -0.076, 0.006], 0.005, 5, 4, COL.redBright);
      });
    };
  }

  function buildThigh() {
    return (b) => {
      const len = D.thigh;
      loft(b, [
        ring(-len, 0.048, 0.048, 0, COL.skin),
        ring(-len * 0.4, 0.058, 0.056, 0, COL.skin),
        ring(0, 0.068, 0.066, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
      boxAt(b, [0, -len * 0.55, 0], [0.115, 0.018, 0.115], COL.red);
      sphereAt(b, [0.054, -len * 0.55, 0.02], 0.012, 6, 5, COL.gold);
    };
  }

  function buildShin() {
    return (b) => {
      const len = D.shin;
      loft(b, [
        ring(-len, 0.034, 0.034, 0, COL.white),
        ring(-len * 0.35, 0.042, 0.042, 0, COL.white),
        ring(-len * 0.34, 0.044, 0.044, 0, COL.skin),
        ring(0, 0.046, 0.046, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildFoot() {
    return (b) => {
      boxAt(b, [0, -0.026, 0.042], [0.066, 0.042, 0.135], COL.red);
      boxAt(b, [0, -0.042, 0.042], [0.068, 0.016, 0.138], COL.black);
      boxAt(b, [0, -0.006, 0.035], [0.068, 0.01, 0.024], COL.gold);
      sphereAt(b, [0, -0.008, 0.085], 0.014, 6, 5, COL.gold);
    };
  }

  function buildKendamaMesh() {
    return (b) => {
      cylBetween(b, [0, -0.08, 0], [0, 0.08, 0], 0.012, 0.01, 8, COL.gold);
      cylBetween(b, [-0.048, 0.01, 0], [0.048, 0.01, 0], 0.022, 0.022, 8, COL.black);
      sphereAt(b, [0, 0.11, 0], 0.042, 10, 8, COL.redBright);
      sphereAt(b, [0, 0.11, 0.038], 0.014, 6, 5, COL.goldLight);
    };
  }

  function buildRevolverMesh() {
    return (b) => {
      boxAt(b, [0, 0.02, 0.06], [0.026, 0.038, 0.15], COL.black);
      cylBetween(b, [0, 0.02, -0.01], [0, 0.02, 0.05], 0.028, 0.028, 8, COL.gold);
      boxAt(b, [0, -0.035, -0.02], [0.024, 0.08, 0.036], COL.redDark, M4.rotX(0.32));
      sphereAt(b, [0, 0.022, 0.14], 0.014, 6, 5, COL.redBright);
    };
  }

  function buildFanMesh() {
    return (b) => {
      const ribs = 9;
      for (let i = 0; i < ribs - 1; i++) {
        const a0 = lerp(-0.85, 0.85, i / (ribs - 1));
        const a1 = lerp(-0.85, 0.85, (i + 1) / (ribs - 1));
        const rIn = 0.03, rOut = 0.22;
        const col = i % 2 === 0 ? COL.redBright : COL.gold;
        b.quad(
          [S(a0) * rIn, C(a0) * rIn, 0],
          [S(a1) * rIn, C(a1) * rIn, 0],
          [S(a1) * rOut, C(a1) * rOut, 0.01],
          [S(a0) * rOut, C(a0) * rOut, 0.01],
          col,
          null,
          [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]
        );
      }
    };
  }

  function buildGoldfishMesh() {
    return (b) => {
      sphereAt(b, [0, 0, 0], 0.24, 12, 10, COL.redBright, M4.scale(0.65, 0.82, 1.45));
      sphereAt(b, [0, 0.02, 0.12], 0.18, 10, 8, COL.goldLight, M4.scale(0.68, 0.75, 1.1));
      [-1, 1].forEach(s => {
        sphereAt(b, [s * 0.12, 0.03, 0.24], 0.038, 8, 6, COL.white);
        sphereAt(b, [s * 0.14, 0.03, 0.26], 0.02, 6, 5, COL.black);
        b.tri(
          [s * 0.12, -0.02, 0.05],
          [s * 0.36, -0.12, -0.14],
          [s * 0.14, 0.06, -0.18],
          COL.goldLight,
          null,
          [[0, 1, 0], [0, 1, 0], [0, 1, 0]]
        );
      });
      b.tri([0, 0.02, -0.3], [-0.28, 0.26, -0.68], [0, -0.04, -0.52], COL.redBright, null, [[1, 0, 0], [1, 0, 0], [1, 0, 0]]);
      b.tri([0, 0.02, -0.3], [0.28, 0.26, -0.68], [0, -0.04, -0.52], COL.goldLight, null, [[1, 0, 0], [1, 0, 0], [1, 0, 0]]);
      b.tri([0, 0.16, 0.05], [0, 0.36, -0.22], [0, 0.14, -0.24], COL.gold, null, [[1, 0, 0], [1, 0, 0], [1, 0, 0]]);
    };
  }

  function build(r) {
    const R = D.head;
    const eyes = {};
    ['wide', 'crazy', 'open', 'half', 'wink', 'shut'].forEach(st => {
      eyes[st] = r.texture(512, drawEyes(st), { height: 256, clamp: true });
    });
    const mouths = {};
    ['shut', 'smile', 'talk', 'open', 'wide', 'o', 'smirk', 'laugh'].forEach(st => {
      mouths[st] = r.texture(256, drawMouth(st), { height: 128, clamp: true });
    });

    const mHead = K.mesh(r, buildHeadBase(R));
    const mEyePatch = K.mesh(r, b => headGrid(b, R, EYE_PATCH[0], EYE_PATCH[1], EYE_PATCH[2], EYE_PATCH[3], 18, 10, null, 1.006, true));
    const mMouthPatch = K.mesh(r, b => headGrid(b, R, MOUTH_PATCH[0], MOUTH_PATCH[1], MOUTH_PATCH[2], MOUTH_PATCH[3], 16, 10, null, 1.006, true));
    const mHair = K.mesh(r, buildHair(R));
    const mMask = K.mesh(r, buildKitsuneMaskMesh());

    const outfits = {};
    ['kimono', 'school', 'shadow'].forEach(mode => {
      outfits[mode] = {
        torso: K.mesh(r, buildTorso(mode)),
        pelvis: K.mesh(r, buildPelvis(mode)),
        upper: K.mesh(r, buildUpperArm(mode)),
        foreL: K.mesh(r, buildForearm(1, mode)),
        foreR: K.mesh(r, buildForearm(-1, mode))
      };
    });

    const mHandL = K.mesh(r, buildHand(1));
    const mHandR = K.mesh(r, buildHand(-1));
    const mThigh = K.mesh(r, buildThigh());
    const mShin = K.mesh(r, buildShin());
    const mFoot = K.mesh(r, buildFoot());

    const mKendama = K.mesh(r, buildKendamaMesh());
    const mRevolver = K.mesh(r, buildRevolverMesh());
    const mFan = K.mesh(r, buildFanMesh());
    const mGoldfish = K.mesh(r, buildGoldfishMesh());

    return {
      eyes, mouths, mHead, mEyePatch, mMouthPatch, mHair, mMask,
      outfits, mHandL, mHandR, mThigh, mShin, mFoot,
      mKendama, mRevolver, mFan, mGoldfish
    };
  }

  function solve(pose) {
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = [sy, -lean, cy];
    const up = [S(roll) * cy, C(roll), -S(roll) * sy];
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, 0.9, 0], fwd, up }), D);
  }

  function drawChar(r, V, m, pose) {
    const mode = pose.outfit || 'kimono';
    const O = V.outfits[mode] || V.outfits.kimono;

    r.draw(O.pelvis, m.pelvis);
    r.draw(O.torso, m.chest);
    r.draw(O.upper, m.upperL);
    r.draw(O.upper, m.upperR);
    r.draw(O.foreL, m.foreL);
    r.draw(O.foreR, m.foreR);
    r.draw(V.mHandL, m.handL);
    r.draw(V.mHandR, m.handR);
    r.draw(V.mThigh, m.thighL);
    r.draw(V.mThigh, m.thighR);
    r.draw(V.mShin, m.shinL);
    r.draw(V.mShin, m.shinR);
    r.draw(V.mFoot, m.footL);
    r.draw(V.mFoot, m.footR);

    r.draw(V.mHead, m.head);
    r.draw(V.mEyePatch, m.head, { texture: V.eyes[pose.eyes || 'open'] || V.eyes.open });
    r.draw(V.mMouthPatch, m.head, { texture: V.mouths[pose.mouth || 'smile'] || V.mouths.smile });
    r.draw(V.mHair, m.head);

    const maskMode = pose.mask || 'side';
    if (maskMode === 'face') {
      const mm = M4.chain(m.head, M4.translate(0, -0.01, 0.115), M4.scale(1.18, 1.18, 1.18));
      r.draw(V.mMask, mm);
    } else if (maskMode === 'handR') {
      const mm = M4.chain(m.handR, M4.translate(0, -0.06, 0.04), M4.rotX(0.35), M4.rotY(0.2));
      r.draw(V.mMask, mm);
    } else if (maskMode !== 'none') {
      const mm = M4.chain(m.head, M4.translate(-0.088, 0.078, 0.045), M4.rotY(-0.55), M4.rotX(-0.28), M4.rotZ(0.22), M4.scale(0.82, 0.82, 0.82));
      r.draw(V.mMask, mm);
    }

    const prop = pose.prop || 'none';
    if (prop === 'kendama') {
      const pm = M4.chain(m.handR, M4.translate(0, -0.06, 0.03), M4.rotX(PI * 0.4));
      r.draw(V.mKendama, pm);
    } else if (prop === 'gun') {
      const pm = M4.chain(m.handR, M4.translate(0, -0.05, 0.03), M4.rotX(PI * 0.45));
      r.draw(V.mRevolver, pm);
    } else if (prop === 'fan') {
      const pm = M4.chain(m.handR, M4.translate(0, -0.05, 0.03), M4.rotX(0.25), M4.rotZ(-0.2));
      r.draw(V.mFan, pm);
    }
  }

  function drawExtras(r, V, st) {
    const t = st.t || 0;
    if (st.goldfish) {
      const fishes = [
        [-0.95, 1.55, -0.8, 0.35, 1.1],
        [1.05, 1.35, -1.1, -0.45, 0.95],
        [0.15, 2.05, -1.6, 0.15, 1.35]
      ];
      fishes.forEach(([fx, fy, fz, yaw, sc], i) => {
        const sw = S(t * 2.6 + i * 2.1) * 0.18;
        const fm = M4.chain(
          M4.translate(fx + C(t * 0.8 + i) * 0.22, fy + S(t * 1.2 + i) * 0.12, fz),
          M4.rotY(yaw + sw),
          M4.rotZ(sw * 0.4),
          M4.scale(sc, sc, sc)
        );
        r.draw(V.mGoldfish, fm);
      });
    }

    if (st.floatingMasks) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2 + t * 0.65;
        const rad = 1.15 + S(t * 1.5 + i) * 0.15;
        const mx = C(a) * rad;
        const my = 1.25 + S(a * 2 + t) * 0.32;
        const mz = S(a) * rad - 0.35;
        const mm = M4.chain(
          M4.translate(mx, my, mz),
          M4.rotY(-a + PI / 2),
          M4.rotZ(S(t * 2 + i) * 0.2),
          M4.scale(1.35, 1.35, 1.35)
        );
        r.draw(V.mMask, mm);
      }
    }
  }

  window.SparkleCast = { build, solve, drawChar, drawExtras };
})();
