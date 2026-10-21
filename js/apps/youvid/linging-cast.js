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
    skin: 0xdcb49c,
    skinShade: 0xc2967c,
    skinDeep: 0xaa7c64,
    blackHair: 0x242830,
    blackHairHi: 0x383e4a,
    whiteHair: 0xe6e2da,
    whiteHairShade: 0xbcb7ae,
    red: 0xc82834,
    redDark: 0x8e1c24,
    gold: 0xd8b25c,
    goldLight: 0xf0d284,
    goldDark: 0x9c7a34,
    cyan: 0x32cdb8,
    cyanDark: 0x1e8e80,
    cream: 0xe2dbd0,
    creamShade: 0xc8bfb2,
    charcoal: 0x262932,
    phone: 0x3e4046,
    phoneDark: 0x282a2e
  };

  const EYE_PATCH = [-0.95, 0.95, -0.42, 0.22];
  const MOUTH_PATCH = [-0.88, 0.88, -0.92, -0.38];
  const GRIP = [-0.056, -0.018, -0.17];

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

  function drawStar4(ctx, cx, cy, rOuter, rInner, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * PI) / 4;
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
      const openMap = { wide: 0.195, open: 0.175, half: 0.095, squint: 0.065, shut: 0 };
      const openK = openMap[state] !== undefined ? openMap[state] : 0.175;
      const rh = openK * m.ky;

      [-1, 1].forEach(sd => {
        const cx = m.x(sd * 0.35);
        soft(ctx, cx, ey + rh * 0.65, rw * 1.35, rw * 0.55, 0xe87a74, 0.32);

        const browLift = state === 'wide' ? 0.03 : state === 'half' || state === 'squint' ? -0.02 : 0;
        const by = m.y(0.11 + browLift);
        ctx.strokeStyle = '#2d2528';
        ctx.lineWidth = Math.max(2.6, 0.016 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx - sd * rw * 0.85, by + 0.015 * m.ky);
        ctx.quadraticCurveTo(cx, by - 0.035 * m.ky, cx + sd * rw * 0.95, by + 0.025 * m.ky);
        ctx.stroke();

        if (state === 'shut') {
          ctx.strokeStyle = '#1f1b20';
          ctx.lineWidth = Math.max(4.5, 0.032 * m.ky);
          ctx.beginPath();
          ctx.moveTo(cx - sd * rw * 0.95, ey + 0.01 * m.ky);
          ctx.quadraticCurveTo(cx, ey + 0.068 * m.ky, cx + sd * rw * 1.02, ey - 0.005 * m.ky);
          ctx.stroke();

          ctx.strokeStyle = '#e06666';
          ctx.lineWidth = Math.max(2.2, 0.015 * m.ky);
          ctx.beginPath();
          ctx.moveTo(cx + sd * rw * 0.35, ey + 0.042 * m.ky);
          ctx.lineTo(cx + sd * rw * 1.05, ey + 0.008 * m.ky);
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
        ctx.fillStyle = '#fdf9f6';
        ctx.fill();

        ctx.save();
        eyeShape();
        ctx.clip();

        const irx = rw * 0.62;
        const iry = m.ky * 0.165;
        const ix = cx - sd * rw * 0.06;
        const iy = ey + m.ky * 0.005;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.scale(irx, iry);

        const ig = ctx.createLinearGradient(0, -1, 0, 1);
        ig.addColorStop(0, '#5c2c16');
        ig.addColorStop(0.32, '#9e4c18');
        ig.addColorStop(0.62, '#f0941e');
        ig.addColorStop(0.88, '#ffea38');
        ig.addColorStop(1, '#ffff7a');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(72,24,12,0.75)';
        ctx.lineWidth = 0.09;
        ctx.beginPath();
        ctx.arc(0, 0, 0.96, 0, PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,140,210,0.45)';
        ctx.lineWidth = 0.14;
        ctx.beginPath();
        ctx.arc(0, -0.05, 0.72, PI * 1.1, PI * 1.9);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(110,245,220,0.45)';
        ctx.lineWidth = 0.11;
        ctx.beginPath();
        ctx.arc(0, -0.02, 0.6, PI * 1.12, PI * 1.88);
        ctx.stroke();

        ctx.fillStyle = '#743818';
        ctx.beginPath();
        ctx.arc(0, -0.04, 0.42, 0, PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = '#36f5dc';
        drawStar4(ctx, ix - sd * irx * 0.12, iy + iry * 0.24, irx * 0.36, irx * 0.11, 0.12);

        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.42, iy - iry * 0.36, irx * 0.24, iry * 0.17, -0.35, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.64, iy - iry * 0.12, irx * 0.12, iry * 0.1, -0.35, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix - sd * irx * 0.08, iy + iry * 0.68, irx * 0.18, iry * 0.12, 0, 0, PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(40,18,16,0.22)';
        ctx.fillRect(inner - rw * 0.2, topY - rh * 0.4, rw * 2.4, rh * 0.55);
        ctx.restore();

        ctx.strokeStyle = '#8c6254';
        ctx.lineWidth = Math.max(1.6, 0.009 * m.ky);
        ctx.beginPath();
        ctx.moveTo(inner + sd * rw * 0.1, topY - 0.015 * m.ky);
        ctx.quadraticCurveTo(cx, topY - 0.045 * m.ky, outer - sd * rw * 0.1, topY - 0.008 * m.ky);
        ctx.stroke();

        ctx.fillStyle = '#1c1a20';
        ctx.beginPath();
        if (state === 'half') {
          ctx.moveTo(inner - sd * rw * 0.06, ey - rh * 0.08);
          ctx.lineTo(outer + sd * rw * 0.14, ey - rh * 0.18);
          ctx.lineTo(outer + sd * rw * 0.04, ey - rh * 0.42);
          ctx.lineTo(inner, ey - rh * 0.28);
        } else {
          ctx.moveTo(inner - sd * rw * 0.05, ey + rh * 0.12);
          ctx.bezierCurveTo(cx - sd * rw * 0.55, topY - 0.032 * m.ky, cx + sd * rw * 0.58, topY - 0.035 * m.ky, outer + sd * rw * 0.14, ey - rh * 0.12);
          ctx.lineTo(outer + sd * rw * 0.02, ey + rh * 0.12);
          ctx.bezierCurveTo(cx + sd * rw * 0.48, topY + 0.018 * m.ky, cx - sd * rw * 0.5, topY + 0.018 * m.ky, inner, ey + rh * 0.18);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e05a5a';
        ctx.lineWidth = Math.max(2, 0.012 * m.ky);
        ctx.beginPath();
        ctx.moveTo(cx + sd * rw * 0.35, botY - 0.005 * m.ky);
        ctx.quadraticCurveTo(cx + sd * rw * 0.78, botY - 0.015 * m.ky, outer + sd * rw * 0.04, ey + rh * 0.08);
        ctx.stroke();

        ctx.strokeStyle = '#221e24';
        ctx.lineWidth = Math.max(1.8, 0.011 * m.ky);
        ctx.beginPath();
        ctx.moveTo(inner + sd * rw * 0.25, botY - 0.012 * m.ky);
        ctx.quadraticCurveTo(cx, botY + 0.008 * m.ky, cx + sd * rw * 0.65, botY - 0.01 * m.ky);
        ctx.stroke();

        [-0.12, 0.28].forEach(u => {
          const lx = cx + sd * rw * u;
          const ly = botY - 0.004 * m.ky;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + sd * rw * 0.06, ly + 0.024 * m.ky);
          ctx.stroke();
        });
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
      const hw = 0.13 * m.kx;

      [-1, 1].forEach(sd => {
        soft(ctx, cx + sd * 0.36 * m.kx, m.y(-0.44), 0.18 * m.kx, 0.09 * m.ky, 0xeb8278, 0.28);
      });

      ctx.fillStyle = 'rgba(156,102,82,0.78)';
      ctx.beginPath();
      ctx.moveTo(cx, m.y(-0.41));
      ctx.lineTo(cx + 0.018 * m.kx, m.y(-0.45));
      ctx.lineTo(cx - 0.008 * m.kx, m.y(-0.46));
      ctx.closePath();
      ctx.fill();

      if (state === 'o') {
        const rx = hw * 0.58, ry = 0.068 * m.ky;
        ctx.fillStyle = '#9e3838';
        ctx.beginPath();
        ctx.ellipse(cx, my, rx, ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, my, rx, ry, 0, 0, PI * 2);
        ctx.clip();
        ctx.fillStyle = '#d86868';
        ctx.beginPath();
        ctx.ellipse(cx, my + ry * 0.55, rx * 0.85, ry * 0.65, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#6e2828';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(cx, my, rx, ry, 0, 0, PI * 2);
        ctx.stroke();
        return;
      }

      if (state === 'open' || state === 'talk' || state === 'wide') {
        const openH = (state === 'wide' ? 0.075 : state === 'open' ? 0.056 : 0.038) * m.ky;
        const mw = hw * (state === 'wide' ? 1.05 : 0.86);
        const shape = () => {
          ctx.beginPath();
          ctx.moveTo(cx - mw, my - openH * 0.2);
          ctx.quadraticCurveTo(cx, my - openH * 0.55, cx + mw, my - openH * 0.2);
          ctx.bezierCurveTo(cx + mw * 0.85, my + openH * 1.1, cx - mw * 0.85, my + openH * 1.1, cx - mw, my - openH * 0.2);
          ctx.closePath();
        };
        shape();
        ctx.fillStyle = '#9c3638';
        ctx.fill();
        ctx.save();
        shape();
        ctx.clip();
        ctx.fillStyle = '#dc6c6c';
        ctx.beginPath();
        ctx.ellipse(cx, my + openH * 0.55, mw * 0.78, openH * 0.65, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx + mw * 0.28, my - openH * 0.32);
        ctx.lineTo(cx + mw * 0.48, my + openH * 0.22);
        ctx.lineTo(cx + mw * 0.64, my - openH * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#6c2628';
        ctx.lineWidth = 2.2;
        shape();
        ctx.stroke();
        return;
      }

      if (state === 'smirk') {
        const mw = hw * 0.82;
        ctx.fillStyle = '#b44648';
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.8, my + 0.005 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.1, my - 0.012 * m.ky, cx + mw, my - 0.025 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.3, my + 0.038 * m.ky, cx - mw * 0.8, my + 0.005 * m.ky);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx + mw * 0.25, my - 0.012 * m.ky);
        ctx.lineTo(cx + mw * 0.45, my + 0.018 * m.ky);
        ctx.lineTo(cx + mw * 0.62, my - 0.016 * m.ky);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6c2628';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.85, my + 0.005 * m.ky);
        ctx.quadraticCurveTo(cx + mw * 0.1, my - 0.012 * m.ky, cx + mw * 1.02, my - 0.026 * m.ky);
        ctx.stroke();
        return;
      }

      const curve = state === 'smile' ? 0.028 * m.ky : 0.012 * m.ky;
      ctx.strokeStyle = '#7c3234';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.75, my - curve * 0.25);
      ctx.quadraticCurveTo(cx, my + curve, cx + hw * 0.78, my - curve * 0.35);
      ctx.stroke();
    };
  }

  function addPandaBadge(b, pos, sc, rotY) {
    b.push(M4.translate(pos[0], pos[1], pos[2]), M4.rotY(rotY || 0), M4.scale(sc, sc, sc));
    sphereAt(b, [0, 0, 0], 1, 8, 6, 0xf4f2ec);
    sphereAt(b, [-0.68, 0.68, -0.1], 0.42, 6, 5, COL.blackHair);
    sphereAt(b, [0.68, 0.68, -0.1], 0.42, 6, 5, COL.blackHair);
    sphereAt(b, [-0.34, 0.1, 0.82], 0.26, 6, 5, COL.blackHair);
    sphereAt(b, [0.34, 0.1, 0.82], 0.26, 6, 5, COL.blackHair);
    sphereAt(b, [0, -0.18, 0.92], 0.14, 5, 4, COL.blackHair);
    b.pop();
  }

  function buildHeadBase(R) {
    return (b) => {
      const colAt = (yaw, pit) => {
        if (pit > 0.36) return yaw < 0 ? COL.blackHair : COL.whiteHair;
        if (Math.abs(yaw) > 1.38) return yaw < 0 ? COL.blackHair : COL.whiteHair;
        return COL.skin;
      };
      headGrid(b, R, -PI, PI, -PI / 2, PI / 2, 26, 18, colAt);

      [-1, 1].forEach(s => {
        const earX = s * R * 0.9;
        sphereAt(b, [earX, -R * 0.1, -R * 0.04], R * 0.13, 6, 5, COL.skin);
        const ey = -R * 0.26, ez = -R * 0.01;
        cylBetween(b, [earX, ey + 0.015, ez], [earX, ey - 0.015, ez], 0.013, 0.013, 6, COL.gold);
        cylBetween(b, [earX - 0.004, ey - 0.015, ez], [earX - 0.004, ey - 0.062, ez], 0.0035, 0.0045, 5, COL.cyan);
        cylBetween(b, [earX + 0.004, ey - 0.015, ez], [earX + 0.004, ey - 0.052, ez], 0.0035, 0.0045, 5, COL.cyan);
      });
    };
  }

  function buildHair(R) {
    return (b) => {
      headGrid(b, R, -PI, 0, 0.18, PI / 2, 14, 10, () => COL.blackHair, 1.065);
      headGrid(b, R, 0, PI, 0.18, PI / 2, 14, 10, () => COL.whiteHair, 1.065);
      headGrid(b, R, -PI, -1.12, -0.46, 0.2, 10, 8, (y, p) => p < -0.36 ? COL.whiteHair : COL.blackHair, 1.075);
      headGrid(b, R, 1.12, PI, -0.46, 0.2, 10, 8, (y, p) => p < -0.34 ? COL.blackHair : COL.whiteHair, 1.075);

      const bangSpecs = [
        [-0.78, -0.38, -0.04, COL.blackHair, 1.082],
        [-0.38, -0.15, -0.02, COL.blackHair, 1.088],
        [-0.15, -0.06, -0.01, COL.whiteHair, 1.094],
        [-0.06, 0.02, -0.02, COL.blackHair, 1.09],
        [0.02, 0.28, -0.02, COL.whiteHair, 1.088],
        [0.28, 0.5, 0.0, COL.whiteHairShade, 1.085],
        [0.5, 0.78, -0.04, COL.whiteHair, 1.082]
      ];
      bangSpecs.forEach(([y0, y1, pBot, col, sc]) => {
        headGrid(b, R, y0, y1, pBot, 0.52, 4, 5, () => col, sc);
      });

      const sideR = [
        [-R * 0.82, R * 0.22, R * 0.36],
        [-R * 0.92, -R * 0.08, R * 0.42],
        [-R * 0.85, -R * 0.38, R * 0.4],
        [-R * 0.66, -R * 0.62, R * 0.36]
      ];
      K.tube(b, sideR, [0.028, 0.03, 0.022, 0.008], 7, COL.blackHair);

      const sideL = [
        [R * 0.82, R * 0.22, R * 0.36],
        [R * 0.92, -R * 0.08, R * 0.42],
        [R * 0.85, -R * 0.38, R * 0.4],
        [R * 0.66, -R * 0.62, R * 0.36]
      ];
      K.tube(b, sideL, [0.028, 0.03, 0.022, 0.008], 7, COL.whiteHair);

      boxAt(b, [R * 0.44, R * 0.28, R * 0.88], [0.03, 0.007, 0.01], COL.gold, M4.rotZ(-0.25));
      boxAt(b, [R * 0.47, R * 0.2, R * 0.9], [0.03, 0.007, 0.01], COL.gold, M4.rotZ(-0.25));

      [-1, 1].forEach(s => {
        const bx = s * R * 0.98, by = R * 0.86, bz = -R * 0.08;
        const mainCol = s < 0 ? COL.blackHair : COL.whiteHair;
        const altCol = s < 0 ? COL.whiteHair : COL.blackHair;
        sphereAt(b, [bx, by, bz], R * 0.42, 10, 8, mainCol);
        sphereAt(b, [bx - s * 0.015, by + 0.015, bz + 0.015], R * 0.3, 8, 6, altCol);
        boxAt(b, [bx, by - 0.032, bz + 0.025], [0.068, 0.024, 0.048], COL.red, M4.rotZ(s * 0.35));
        boxAt(b, [bx + s * 0.026, by + 0.022, bz + 0.01], [0.03, 0.048, 0.038], COL.red, M4.rotZ(-s * 0.25));
        sphereAt(b, [bx - s * 0.018, by - 0.02, bz + 0.042], 0.016, 7, 5, COL.whiteHair);
        sphereAt(b, [bx + s * 0.022, by - 0.015, bz + 0.04], 0.015, 7, 5, COL.blackHair);
        addPandaBadge(b, [bx - s * 0.03, by - 0.005, bz + 0.045], 0.014, s * 0.25);
      });
    };
  }

  function buildBraidL() {
    return (b) => {
      const pts = [
        [0.135, 0.08, -0.05],
        [0.168, 0.0, -0.04],
        [0.178, -0.09, -0.03],
        [0.175, -0.18, -0.02],
        [0.168, -0.25, -0.01]
      ];
      K.tube(b, pts, [0.026, 0.025, 0.023, 0.02, 0.016], 8, COL.whiteHair);
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7;
        const y = lerp(0.07, -0.23, u);
        const x = 0.172 + S(i * 1.4) * 0.005;
        const z = lerp(-0.045, -0.015, u);
        sphereAt(b, [x, y, z], 0.025 - u * 0.005, 8, 6, i % 2 ? COL.blackHair : COL.whiteHair);
      }
      const cx = 0.168, cy = -0.255, cz = -0.01;
      sphereAt(b, [cx, cy, cz], 0.02, 8, 6, COL.goldLight);
      cylBetween(b, [cx, cy + 0.018, cz], [cx, cy - 0.028, cz], 0.024, 0.013, 8, COL.gold);

      const tail = [
        [0.168, -0.28, -0.01],
        [0.185, -0.42, -0.02],
        [0.195, -0.58, -0.03],
        [0.185, -0.74, -0.03]
      ];
      K.tube(b, tail, [0.018, 0.034, 0.03, 0.01], 8, COL.whiteHair);
    };
  }

  function buildBraidRNormal() {
    return (b) => {
      const pts = [
        [-0.135, 0.08, -0.05],
        [-0.168, 0.0, -0.04],
        [-0.178, -0.09, -0.02],
        [-0.175, -0.18, -0.01],
        [-0.168, -0.25, 0.0]
      ];
      K.tube(b, pts, [0.026, 0.025, 0.023, 0.02, 0.016], 8, COL.blackHair);
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7;
        const y = lerp(0.07, -0.23, u);
        const x = -0.172 - S(i * 1.4) * 0.005;
        const z = lerp(-0.045, -0.005, u);
        sphereAt(b, [x, y, z], 0.025 - u * 0.005, 8, 6, COL.blackHair);
        if (i % 2 === 0) sphereAt(b, [x + 0.008, y, z + 0.012], 0.014, 6, 5, COL.whiteHair);
      }
      const cx = -0.168, cy = -0.255, cz = 0.0;
      sphereAt(b, [cx, cy, cz], 0.02, 8, 6, COL.goldLight);
      cylBetween(b, [cx, cy + 0.018, cz], [cx, cy - 0.028, cz], 0.024, 0.013, 8, COL.gold);

      const tail = [
        [-0.168, -0.28, 0.0],
        [-0.182, -0.42, 0.0],
        [-0.188, -0.58, -0.01],
        [-0.178, -0.72, -0.02]
      ];
      K.tube(b, tail, [0.018, 0.036, 0.032, 0.012], 8, COL.blackHair);
      K.tube(b, [[-0.16, -0.32, 0.018], [-0.168, -0.54, 0.018], [-0.162, -0.68, 0.0]], [0.006, 0.01, 0.004], 6, COL.whiteHair);
    };
  }

  function buildBraidRCord() {
    return (b) => {
      K.tube(b, [
        [-0.135, 0.08, -0.03],
        [-0.145, 0.12, 0.05],
        [-0.105, 0.1, 0.13]
      ], [0.024, 0.02, 0.012], 7, COL.blackHair);
      cylBetween(b, [-0.095, 0.21, 0.135], [-0.088, -0.03, 0.145], 0.005, 0.005, 6, COL.blackHair);
    };
  }

  function buildPhoneMesh() {
    return (b) => {
      cylBetween(b, [-0.01, 0.085, 0], [-0.01, -0.085, 0], 0.016, 0.016, 8, COL.phone);
      boxAt(b, [-0.005, 0, 0], [0.026, 0.15, 0.022], COL.phone);
      sphereAt(b, [0.022, 0.082, 0], 0.036, 9, 7, COL.phone, M4.scale(1.15, 0.85, 0.65));
      sphereAt(b, [0.022, -0.082, 0], 0.036, 9, 7, COL.phone, M4.scale(1.15, 0.85, 0.65));
      cylBetween(b, [0.005, 0.082, 0], [0.032, 0.082, 0], 0.022, 0.032, 8, COL.phoneDark);
      cylBetween(b, [0.005, -0.082, 0], [0.032, -0.082, 0], 0.022, 0.032, 8, COL.phoneDark);
    };
  }

  function buildTorso() {
    return (b) => {
      const torsoRings = [
        ring(-0.12, 0.102, 0.078, 0.0, COL.cream),
        ring(-0.04, 0.092, 0.072, 0.004, COL.cream),
        ring(0.05, 0.104, 0.084, 0.01, COL.cream),
        ring(0.118, 0.108, 0.088, 0.012, COL.cream),
        ring(0.12, 0.108, 0.086, 0.01, COL.charcoal),
        ring(0.142, 0.106, 0.082, 0.008, COL.skin),
        ring(0.225, 0.116, 0.072, 0.0, COL.skin),
        ring(0.245, 0.052, 0.046, 0.005, COL.blackHair),
        ring(0.29, 0.046, 0.042, 0.008, COL.blackHair)
      ];
      loft(b, torsoRings, 16, { hard: true, capTop: true, capBottom: true });

      const bibSteps = 8;
      for (let i = 0; i < bibSteps; i++) {
        const a0 = lerp(-0.56, 0.56, i / bibSteps);
        const a1 = lerp(-0.56, 0.56, (i + 1) / bibSteps);
        const b0 = [S(a0) * 0.088, 0.122, 0.012 + C(a0) * 0.089];
        const b1 = [S(a1) * 0.088, 0.122, 0.012 + C(a1) * 0.089];
        const m0 = [S(a0) * 0.062, 0.225, 0.003 + C(a0) * 0.076];
        const m1 = [S(a1) * 0.062, 0.225, 0.003 + C(a1) * 0.076];
        const t0 = [S(a0) * 0.048, 0.248, 0.006 + C(a0) * 0.049];
        const t1 = [S(a1) * 0.048, 0.248, 0.006 + C(a1) * 0.049];
        const n0 = [S(a0) * 0.4, 0.1, C(a0)];
        const n1 = [S(a1) * 0.4, 0.1, C(a1)];
        b.quad(b0, b1, m1, m0, COL.charcoal, null, [n0, n1, n1, n0]);
        b.quad(m0, m1, t1, t0, COL.charcoal, null, [n0, n1, n1, n0]);
      }

      [0.245, 0.205, 0.165].forEach(y => {
        const z = 0.066 + (0.25 - y) * 0.34;
        boxAt(b, [-0.022, y, z], [0.026, 0.012, 0.012], COL.red);
        boxAt(b, [0.022, y, z], [0.026, 0.012, 0.012], COL.red);
        sphereAt(b, [0, y, z + 0.005], 0.007, 5, 4, COL.gold);
      });

      const tieBotL = [-0.024, 0.02, 0.106], tieBotR = [0.024, 0.02, 0.106];
      const tieMidR = [0.016, 0.222, 0.088], tieMidL = [-0.016, 0.222, 0.088];
      b.quad(tieBotL, tieBotR, tieMidR, tieMidL, COL.gold, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.tri(tieBotL, [0, -0.018, 0.104], tieBotR, COL.goldLight, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      boxAt(b, [-0.006, 0.055, 0.107], [0.026, 0.006, 0.008], 0xd8dce2);
      addPandaBadge(b, [0, 0.205, 0.094], 0.016, 0);

      b.push(M4.translate(0.056, 0.095, 0.096), M4.rotY(0.28), M4.rotZ(-0.08));
      boxAt(b, [0, 0, 0], [0.048, 0.034, 0.005], 0xe8e6e0);
      boxAt(b, [0.004, 0.016, 0.003], [0.006, 0.014, 0.006], COL.gold);
      boxAt(b, [0.012, -0.004, 0.004], [0.016, 0.006, 0.004], COL.cyan, M4.rotZ(0.65));
      b.pop();

      cylBetween(b, [-0.01, 0.24, -0.042], [-0.045, 0.08, -0.078], 0.004, 0.004, 5, COL.gold);
      cylBetween(b, [0.01, 0.24, -0.042], [0.045, 0.08, -0.078], 0.004, 0.004, 5, COL.gold);
      cylBetween(b, [-0.05, 0.19, -0.068], [0.05, 0.19, -0.068], 0.004, 0.004, 5, COL.cream);

      boxAt(b, [0, -0.04, 0.08], [0.19, 0.022, 0.15], COL.charcoal);
      sphereAt(b, [-0.018, -0.04, 0.092], 0.016, 6, 5, COL.gold);
      sphereAt(b, [0.018, -0.04, 0.092], 0.016, 6, 5, COL.gold);
      sphereAt(b, [-0.016, -0.068, 0.094], 0.018, 7, 5, COL.blackHair);
      sphereAt(b, [0.018, -0.068, 0.094], 0.018, 7, 5, COL.whiteHair);

      for (let i = 0; i < 11; i++) {
        const u = i / 10;
        const cx = -0.075 + S(u * PI) * 0.025;
        const cy = 0.02 - u * 0.14;
        const cz = 0.088 + S(u * PI) * 0.02;
        sphereAt(b, [cx, cy, cz], 0.012, 6, 5, i % 2 ? COL.cyan : COL.cyanDark);
      }
    };
  }

  function buildPelvis() {
    return (b) => {
      const pRings = [
        ring(-0.1, 0.112, 0.092, 0, COL.cream),
        ring(-0.03, 0.118, 0.096, 0, COL.cream),
        ring(0.03, 0.106, 0.084, 0, COL.cream)
      ];
      loft(b, pRings, 14, { hard: true, capTop: true, capBottom: true });

      b.push(M4.translate(0, 0.03, -0.135));
      cylBetween(b, [0, 0, -0.035], [0, 0, 0.035], 0.095, 0.095, 14, COL.cream);
      cylBetween(b, [0, 0, -0.042], [0, 0, -0.032], 0.072, 0.078, 14, COL.gold);
      cylBetween(b, [0, 0, -0.046], [0, 0, -0.04], 0.058, 0.058, 12, 0x4a5058);
      sphereAt(b, [0, 0, -0.045], 0.026, 8, 6, COL.whiteHair);
      sphereAt(b, [-0.058, 0.078, 0], 0.028, 7, 5, 0x525862);
      sphereAt(b, [0.058, 0.078, 0], 0.028, 7, 5, 0x525862);
      cylBetween(b, [-0.092, 0.04, 0], [-0.092, -0.05, 0], 0.022, 0.022, 7, COL.phone);
      for (let i = 0; i < 5; i++) {
        sphereAt(b, [0.035 + i * 0.012, -0.085, 0.01], 0.013, 6, 5, COL.cyan);
      }
      b.pop();
    };
  }

  function buildUpperArm() {
    return (b) => {
      const len = D.upper;
      loft(b, [
        ring(-len, 0.03, 0.03, 0, COL.skin),
        ring(-len * 0.35, 0.032, 0.032, 0, COL.skin),
        ring(0, 0.034, 0.034, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });

      loft(b, [
        ring(-len * 0.95, 0.058, 0.054, 0, COL.cream),
        ring(-len * 0.55, 0.054, 0.05, 0, COL.cream),
        ring(-len * 0.35, 0.042, 0.04, 0, COL.charcoal)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildForearm(side) {
    return (b) => {
      const len = D.fore;
      loft(b, [
        ring(-len, 0.028, 0.026, 0, COL.charcoal),
        ring(-len * 0.58, 0.042, 0.04, 0, COL.charcoal),
        ring(-len * 0.56, 0.058, 0.054, 0, COL.cream),
        ring(-len * 0.2, 0.062, 0.058, 0, COL.cream),
        ring(0, 0.048, 0.044, 0, COL.cream)
      ], 10, { hard: true, capTop: true, capBottom: true });

      boxAt(b, [side * 0.032, -len * 0.58, 0.02], [0.02, 0.014, 0.014], COL.red);
      sphereAt(b, [side * 0.036, -len * 0.58, 0.026], 0.006, 5, 4, COL.gold);
    };
  }

  function buildHand(side, mode) {
    return (b) => {
      const s = side;
      boxAt(b, [0, -0.022, 0], [0.04, 0.044, 0.022], COL.charcoal);
      boxAt(b, [0, -0.004, 0], [0.048, 0.012, 0.028], COL.cream);

      if (s < 0) {
        boxAt(b, [0, -0.02, 0.012], [0.042, 0.005, 0.004], COL.cyan);
        boxAt(b, [0, -0.034, 0.012], [0.042, 0.005, 0.004], COL.cyan);
      } else {
        boxAt(b, [0, -0.012, 0.012], [0.042, 0.005, 0.004], COL.cyan);
      }

      const finger = (fx, fy, fz, tx, ty, tz, r, nailCol, hasRing) => {
        cylBetween(b, [fx, fy, fz], [tx, ty, tz], r, r * 0.82, 6, COL.skin);
        sphereAt(b, [tx, ty, tz], r * 0.82, 5, 4, nailCol || COL.red);
        if (hasRing) {
          const mx = lerp(fx, tx, 0.35), my = lerp(fy, ty, 0.35), mz = lerp(fz, tz, 0.35);
          sphereAt(b, [mx, my, mz], r * 1.25, 6, 5, COL.cyan);
        }
      };

      if (mode === 'wave') {
        finger(-0.018 * s, -0.042, 0, -0.034 * s, -0.092, 0.005, 0.0062, COL.red, false);
        finger(-0.006 * s, -0.044, 0, -0.01 * s, -0.1, 0.004, 0.0065, COL.cyan, false);
        finger(0.007 * s, -0.043, 0, 0.012 * s, -0.094, 0.003, 0.0062, COL.red, s > 0);
        finger(0.018 * s, -0.04, 0, 0.028 * s, -0.08, 0.002, 0.0055, COL.red, false);
        cylBetween(b, [-0.02 * s, -0.022, 0.004], [-0.044 * s, -0.052, 0.012], 0.007, 0.0055, 6, COL.charcoal);
        return;
      }

      if (mode === 'pointSide') {
        finger(-0.014 * s, -0.042, 0.004, -0.016 * s, -0.102, 0.006, 0.0068, COL.red, false);
        [-0.003, 0.008, 0.017].forEach((ox, idx) => {
          finger(ox * s, -0.042, 0, ox * s, -0.06, -0.015, 0.0062, COL.red, idx === 1 && s > 0);
        });
        cylBetween(b, [-0.02 * s, -0.022, 0.006], [-0.034 * s, -0.046, 0.02], 0.007, 0.0055, 6, COL.charcoal);
        return;
      }

      if (mode === 'pointFwd') {
        finger(-0.012 * s, -0.038, 0.008, -0.012 * s, -0.042, 0.072, 0.0072, COL.red, false);
        [-0.002, 0.008, 0.018].forEach((ox, idx) => {
          finger(ox * s, -0.042, 0.004, ox * s, -0.06, 0.018, 0.0065, idx === 0 ? COL.cyan : COL.red, false);
        });
        finger(-0.018 * s, -0.018, 0.008, -0.01 * s, 0.026, 0.024, 0.0075, COL.cyan, false);
        return;
      }

      if (mode === 'peace') {
        finger(-0.012 * s, -0.042, 0, -0.026 * s, -0.096, 0.006, 0.0065, COL.red, false);
        finger(0.0 * s, -0.042, 0, 0.014 * s, -0.096, 0.006, 0.0065, COL.cyan, false);
        finger(0.01 * s, -0.042, 0, 0.01 * s, -0.062, -0.014, 0.0058, COL.red, false);
        finger(0.018 * s, -0.04, 0, 0.018 * s, -0.058, -0.014, 0.0052, COL.red, false);
        return;
      }

      if (mode === 'offer') {
        [-0.015, -0.005, 0.005, 0.015].forEach((ox, idx) => {
          finger(ox * s, -0.042, 0.004, ox * s, -0.082, -0.006, 0.0065, idx % 2 ? COL.cyan : COL.red, idx === 2 && s > 0);
        });
        return;
      }

      if (mode === 'grip') {
        const gy = GRIP[0], gz = GRIP[1], gr = 0.022;
        const around = a => [gy + C(a) * gr, gz + S(a) * gr];
        [-0.015, -0.005, 0.005, 0.015].forEach((ox, idx) => {
          const x = ox * s;
          const k = [around(0.75 * PI / 2), around(1.4 * PI / 2), around(2.1 * PI / 2), around(2.75 * PI / 2)];
          const pts = [[x, -0.04, 0.004]].concat(k.map(([y, z]) => [x, y, z]));
          K.tube(b, pts, [0.0066, 0.0064, 0.0062, 0.0058, 0.0054], 6, COL.skin);
          const tip = pts[pts.length - 1];
          sphereAt(b, tip, 0.0054, 5, 4, idx % 2 ? COL.cyan : COL.red);
          if (idx === 2 && s > 0) sphereAt(b, pts[1], 0.008, 6, 5, COL.cyan);
        });
        const [ty, tz] = around(0.2);
        K.tube(b, [[-0.02 * s, -0.016, -0.004], [-0.028 * s, gy + 0.004, gz - 0.004], [-0.018 * s, ty, tz - gr * 1.6]], [0.0075, 0.007, 0.006], 6, COL.charcoal);
        return;
      }

      [-0.015, -0.005, 0.005, 0.015].forEach((ox, idx) => {
        finger(ox * s, -0.042, 0.002, ox * s, -0.068, -0.012, 0.0062, idx % 2 ? COL.cyan : COL.red, idx === 2 && s > 0);
      });
    };
  }

  function buildThigh() {
    return (b) => {
      const len = D.thigh;
      loft(b, [
        ring(-len, 0.048, 0.048, 0, COL.skin),
        ring(-len * 0.35, 0.058, 0.056, 0, COL.skin),
        ring(-len * 0.34, 0.064, 0.062, 0, COL.cream),
        ring(0, 0.068, 0.066, 0, COL.cream)
      ], 10, { hard: true, capTop: true, capBottom: true });
      sphereAt(b, [0, -len * 0.55, 0.052], 0.014, 6, 5, COL.whiteHair);
      sphereAt(b, [0.018, -len * 0.55, 0.048], 0.014, 6, 5, COL.blackHair);
    };
  }

  function buildShin() {
    return (b) => {
      const len = D.shin;
      loft(b, [
        ring(-len, 0.034, 0.034, 0, COL.cream),
        ring(-len * 0.25, 0.044, 0.044, 0, COL.cream),
        ring(-len * 0.24, 0.045, 0.045, 0, COL.skin),
        ring(0, 0.046, 0.046, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function buildFoot() {
    return (b) => {
      boxAt(b, [0, -0.025, 0.045], [0.068, 0.042, 0.14], COL.goldDark);
      boxAt(b, [0, -0.005, 0.04], [0.062, 0.022, 0.11], COL.cream);
      sphereAt(b, [0.032, -0.02, 0.04], 0.022, 7, 5, COL.gold);
    };
  }

  function buildChakram() {
    return (b) => {
      const segs = 24;
      const rIn = 0.39, rOut = 0.45, h = 0.022;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * PI * 2, a1 = ((i + 1) / segs) * PI * 2;
        const col = i % 3 === 0 ? COL.goldLight : COL.charcoal;
        const p0 = [C(a0) * rOut, h, S(a0) * rOut], p1 = [C(a1) * rOut, h, S(a1) * rOut];
        const q0 = [C(a0) * rIn, -h, S(a0) * rIn], q1 = [C(a1) * rIn, -h, S(a1) * rIn];
        b.quad(p0, p1, q1, q0, col, null, [[C(a0), 0.3, S(a0)], [C(a1), 0.3, S(a1)], [C(a1), 0.3, S(a1)], [C(a0), 0.3, S(a0)]]);
      }
      boxAt(b, [0.28, 0.015, 0.28], [0.14, 0.065, 0.09], COL.goldDark, M4.rotY(-0.78));
    };
  }

  function build(r) {
    const R = D.head;
    const eyes = {};
    ['wide', 'open', 'half', 'squint', 'shut'].forEach(st => {
      eyes[st] = r.texture(512, drawEyes(st), { height: 256, clamp: true });
    });
    const mouths = {};
    ['shut', 'smile', 'talk', 'open', 'wide', 'o', 'smirk'].forEach(st => {
      mouths[st] = r.texture(256, drawMouth(st), { height: 128, clamp: true });
    });

    const mHead = K.mesh(r, buildHeadBase(R));
    const mEyePatch = K.mesh(r, b => headGrid(b, R, EYE_PATCH[0], EYE_PATCH[1], EYE_PATCH[2], EYE_PATCH[3], 18, 10, null, 1.006, true));
    const mMouthPatch = K.mesh(r, b => headGrid(b, R, MOUTH_PATCH[0], MOUTH_PATCH[1], MOUTH_PATCH[2], MOUTH_PATCH[3], 16, 10, null, 1.006, true));
    const mHair = K.mesh(r, buildHair(R));
    const mBraidL = K.mesh(r, buildBraidL());
    const mBraidRNorm = K.mesh(r, buildBraidRNormal());
    const mBraidRCord = K.mesh(r, buildBraidRCord());
    const mPhone = K.mesh(r, buildPhoneMesh());
    const mTorso = K.mesh(r, buildTorso());
    const mPelvis = K.mesh(r, buildPelvis());
    const mUpper = K.mesh(r, buildUpperArm());
    const mForeL = K.mesh(r, buildForearm(1));
    const mForeR = K.mesh(r, buildForearm(-1));
    const handsL = {}, handsR = {};
    ['relax', 'wave', 'pointSide', 'pointFwd', 'peace', 'offer', 'grip'].forEach(st => {
      handsL[st] = K.mesh(r, buildHand(1, st));
      handsR[st] = K.mesh(r, buildHand(-1, st));
    });
    const mThigh = K.mesh(r, buildThigh());
    const mShin = K.mesh(r, buildShin());
    const mFoot = K.mesh(r, buildFoot());
    const mChakram = K.mesh(r, buildChakram());

    return {
      eyes, mouths, mHead, mEyePatch, mMouthPatch, mHair,
      mBraidL, mBraidRNorm, mBraidRCord, mPhone,
      mTorso, mPelvis, mUpper, mForeL, mForeR,
      handsL, handsR, mThigh, mShin, mFoot, mChakram
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

  function phoneInHand(hand) {
    return M4.chain(hand, M4.translate(0, GRIP[0], GRIP[1]), M4.rotZ(-PI / 2), M4.rotY(GRIP[2]));
  }

  function draw(r, V, m, pose) {
    r.draw(V.mPelvis, m.pelvis);
    r.draw(V.mTorso, m.chest);
    r.draw(V.mUpper, m.upperL);
    r.draw(V.mUpper, m.upperR);
    r.draw(V.mForeL, m.foreL);
    r.draw(V.mForeR, m.foreR);
    r.draw(pose.phoneMode === 'ear' ? V.handsL.grip : V.handsL[pose.gL || 'relax'] || V.handsL.relax, m.handL);
    r.draw(V.handsR[pose.gR || 'relax'] || V.handsR.relax, m.handR);
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
    r.draw(V.mBraidL, m.head);

    if (pose.phoneMode === 'cord') {
      r.draw(V.mBraidRCord, m.head);
      const pm = M4.chain(m.chest, M4.translate(-0.088, 0.155, 0.155), M4.rotY(0.2), M4.rotZ(0.08));
      r.draw(V.mPhone, pm);
    } else {
      r.draw(V.mBraidRNorm, m.head);
      if (pose.phoneMode === 'ear') {
        r.draw(V.mPhone, phoneInHand(m.handL));
      } else if (pose.phoneMode === 'offer') {
        const pm = M4.chain(m.chest, M4.translate(0.085, 0.19, 0.25), M4.rotZ(PI * 0.5), M4.rotY(PI * 0.5));
        r.draw(V.mPhone, pm);
      } else if (pose.phoneMode === 'drop') {
        const dy = pose.dropY || 0;
        const pm = M4.chain(m.chest, M4.translate(0.1, 0.18 - dy * 0.26, 0.24), M4.rotZ(PI * 0.5 * (1 - dy * 0.8)), M4.rotY(PI * 0.5));
        r.draw(V.mPhone, pm);
      }
    }

    if (pose.chakram) {
      const p = pose.pos || [0, 0.9, 0];
      const cm = M4.chain(M4.translate(p[0], p[1] - 0.14, p[2]), M4.rotY(pose.yaw || 0), M4.rotX(0.32), M4.rotZ(-0.18));
      r.draw(V.mChakram, cm);
    }
  }

  window.LingingCast = { build, solve, draw };
})();
