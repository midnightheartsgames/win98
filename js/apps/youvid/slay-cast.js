(function () {
  const { M4, V3, rgb, shade, rand, Builder } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = {
    boy: { hipX: 0.085, hipY: -0.045, thigh: 0.41, shin: 0.4, chestY: 0.11, neckY: 0.29, shX: 0.175, shY: 0.2, upper: 0.265, fore: 0.225, headY: 0.135, head: 0.105 },
    dad: { hipX: 0.1, hipY: -0.05, thigh: 0.5, shin: 0.49, chestY: 0.13, neckY: 0.34, shX: 0.215, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.16, head: 0.113 },
    girl: { hipX: 0.075, hipY: -0.04, thigh: 0.37, shin: 0.36, chestY: 0.1, neckY: 0.25, shX: 0.15, shY: 0.175, upper: 0.235, fore: 0.205, headY: 0.125, head: 0.096 },
    woman: { hipX: 0.095, hipY: -0.05, thigh: 0.44, shin: 0.43, chestY: 0.12, neckY: 0.3, shX: 0.175, shY: 0.215, upper: 0.28, fore: 0.24, headY: 0.145, head: 0.098 }
  };

  const LOOK = {
    boy: {
      skin: 0xf0b8a8, skinShade: 0xd99484, lip: 0xc0505a, brow: 0x7a5a40, iris: '#5d7287',
      top: 0xf6f8fb, topShade: 0xdfe5ee, bottom: 0x0b4ef0, sock: 0xf4f4f2, shoe: 0x4c9a62, sole: 0xf2f2ee,
      hair: 0x8c6a4c, hairHi: 0xc8a676, hairDark: 0x5e4636,
      torso: [0.9, 0.85, 0.98], pelvis: [0.92, 0.95], shorts: 0.9, sleeve: 0.46, hand: 0.9, limb: 1.07, head: [0.8, 1.07, 0.98], cheek: 0.025,
      eyeY: 0.06, eyeX: 0.31, eyeW: 0.23, mouthY: -0.5, mouthW: 0.34, nose: 0.75, blush: 0xe87878, blushA: 0.3
    },
    dad: {
      skin: 0xe0a990, skinShade: 0xbf8068, lip: 0xb0605c, brow: 0x7a5a40, iris: '#4f6a78', jaw: 0.16,
      top: 0x6fd8cd, topShade: 0x58b8b0, bottom: 0xf1d23e, sock: 0xf2f2f2, shoe: 0xeeeeea, sole: 0xdadada,
      scalp: 0xd59d86,
      torso: [1.0, 1.0, 0.95], pelvis: [0.98, 0.95], hem: -0.29, shorts: 0.88, sleeve: 0.52, hand: 1.0, limb: 0.98, head: [0.8, 1.1, 1.03], cheek: 0,
      eyeY: 0.07, eyeX: 0.31, eyeW: 0.24, mouthY: -0.52, mouthW: 0.38, nose: 1.05, blush: 0xd08070, blushA: 0.25
    },
    girl: {
      skin: 0xeab49e, skinShade: 0xcf9480, lip: 0xc0606a, brow: 0x5a3e2c, iris: '#6a5240',
      top: 0xe8eef0, bottom: 0xf4f4f6, sock: 0xf2f2f2, shoe: 0xf0f0ee, sole: 0xdadada,
      hair: 0x6a5242, hairHi: 0x9c8064, hairDark: 0x463628,
      torso: [0.8, 0.735, 0.82], pelvis: [0.84, 0.84], shorts: 0.3, sleeve: 0, hand: 0.8, limb: 1.1, head: [0.82, 1.05, 0.98], cheek: 0.03,
      eyeY: 0.07, eyeX: 0.31, eyeW: 0.26, mouthY: -0.5, mouthW: 0.31, nose: 0.78, blush: 0xe88a8a, blushA: 0.35
    },
    woman: {
      skin: 0xd9a088, skinShade: 0xbd8270, lip: 0xb04a52, brow: 0x4a3226, iris: '#4a3a2a',
      top: 0xd6142e, bottom: 0x16191c, sock: 0xd9a088, shoe: 0x1a1a1c, sole: 0xe8e8e8,
      hair: 0x6a4a36, hairHi: 0x9a7356, hairDark: 0x3e2a20,
      torso: [0.86, 0.88, 0.85], pelvis: [0.92, 0.9], shorts: 0.22, sleeve: 0.3, hand: 0.85, limb: 1.05, head: [0.8, 1.07, 0.98], cheek: 0,
      eyeY: 0.07, eyeX: 0.31, eyeW: 0.23, mouthY: -0.52, mouthW: 0.33, nose: 0.9
    }
  };

  const TORSO = [
    [-0.3, 0.165, 0.115, -0.005],
    [-0.18, 0.152, 0.108, 0.0],
    [-0.06, 0.158, 0.114, 0.01],
    [0.06, 0.174, 0.124, 0.02],
    [0.16, 0.184, 0.124, 0.015],
    [0.24, 0.188, 0.115, 0.0],
    [0.3, 0.163, 0.1, -0.01],
    [0.34, 0.095, 0.074, -0.005]
  ];

  const PELVIS = [[-0.16, 0.12, 0.1, 0.0], [-0.1, 0.162, 0.112, 0.0], [-0.03, 0.158, 0.11, 0.0], [0.02, 0.145, 0.102, 0.0], [0.05, 0.13, 0.092, 0.0]];

  function headPoint(L, R, yaw, pit) {
    const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
    const low = clamp((-pit - 0.15) / 1.2, 0, 1);
    const front = clamp(C(yaw), 0, 1);
    const back = clamp(-C(yaw), 0, 1);
    const f4 = front * front * front * front;
    const cheek = L.cheek * front * Math.exp(-((pit + 0.38) ** 2) / 0.05);
    const sx = R * L.head[0] * (1 - (L.jaw === undefined ? 0.3 : L.jaw) * Math.pow(low, 1.5) + cheek);
    const sy = R * L.head[1] * (1 + 0.07 * low);
    const brow = 0.03 * f4 * Math.exp(-((pit - 0.24) ** 2) / 0.012);
    const socket = 0.03 * Math.exp(-((pit - 0.07) ** 2) / 0.008) * Math.exp(-((Math.abs(yaw) - 0.33) ** 2) / 0.02);
    const sz = R * L.head[2] * (1 + 0.1 * f4 * low * (1 - low) * 2 - 0.13 * (1 - front) * low * (1 - back * 0.5) + 0.08 * back * (1 - low) - 0.05 * front * front * (1 - low) + brow - socket);
    return [n[0] * sx, n[1] * sy, n[2] * sz];
  }

  function headGrid(b, L, R, y0, y1, p0, p1, nu, nv, colAt, scale, uv) {
    const sc = scale || 1;
    const P = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const p = headPoint(L, R, yaw, pit);
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
          const c = rgb(colAt ? colAt(y0 + (y1 - y0) * u, p0 + (p1 - p0) * v) : 0xffffff);
          return uv ? [c[0], c[1], c[2], 0] : c;
        });
        b.quad(ps[0], ps[1], ps[2], ps[3], cols, uv ? pts : null, ns);
      }
    }
  }

  const EYE_PATCH = [-0.95, 0.95, -0.24, 0.5];
  const MOUTH_PATCH = [-0.95, 0.95, -0.92, -0.2];

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

  function drawEyes(L, state) {
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      ctx.fillStyle = hex(L.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ey = m.y(L.eyeY);
      const rw = L.eyeW * 0.5 * m.kx;
      const openK = { wide: 0.07, open: 0.052, half: 0.03, squint: 0.022, shut: 0 }[state];
      const rh = (openK === undefined ? 0.05 : openK) * m.ky;
      const g = rand(91);
      [-1, 1].forEach(sd => {
        const cx = m.x(sd * L.eyeX);
        soft(ctx, cx, ey - rh * 0.3, rw * 1.7, rw * 0.95, L.skinShade, 0.45);
        soft(ctx, cx + sd * rw * 0.2, ey + rw * 1.1, rw * 1.6, rw * 0.7, L.skin, 0.8);
        if (state === 'squint') soft(ctx, cx, ey + rw * 0.85, rw * 1.3, rw * 0.45, L.skinShade, 0.35);
        const lift = state === 'wide' ? 0.05 : state === 'squint' ? -0.015 : 0;
        const by = m.y(L.eyeY + 0.14 + lift);
        ctx.strokeStyle = rgba(L.brow, 0.8);
        ctx.lineWidth = 0.014 * m.ky + 1;
        for (let i = 0; i < 46; i++) {
          const u = i / 45;
          const x = cx - sd * rw * 1.05 + sd * u * rw * 2.3;
          const arch = Math.sin(u * PI * 0.85) * 0.03 * m.ky;
          const y = by + 0.012 * m.ky - arch + (g() - 0.5) * 0.02 * m.ky * (1 - u * 0.5);
          const len = (0.04 - u * 0.02) * m.kx;
          ctx.beginPath();
          ctx.moveTo(x, y + 0.012 * m.ky * (1 - u));
          ctx.lineTo(x + sd * len, y - 0.008 * m.ky);
          ctx.stroke();
        }
        ctx.strokeStyle = rgba(L.skinShade, 0.7);
        ctx.lineWidth = 0.008 * m.ky + 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - rw * 0.9, ey - rh - 0.02 * m.ky);
        ctx.quadraticCurveTo(cx, ey - rh * 1.6 - 0.045 * m.ky, cx + rw * 0.95, ey - rh - 0.015 * m.ky);
        ctx.stroke();
        if (state === 'shut') {
          ctx.strokeStyle = '#4a2a22';
          ctx.lineWidth = 0.012 * m.ky + 1.4;
          ctx.beginPath();
          ctx.moveTo(cx - sd * rw * 1.0, ey - 0.004 * m.ky);
          ctx.quadraticCurveTo(cx, ey + 0.02 * m.ky, cx + sd * rw * 1.05, ey - 0.01 * m.ky);
          ctx.stroke();
          return;
        }
        const inner = cx - sd * rw, outer = cx + sd * rw;
        const almond = () => {
          ctx.beginPath();
          ctx.moveTo(inner, ey + rh * 0.1);
          ctx.bezierCurveTo(cx - sd * rw * 0.5, ey - rh * 1.35, cx + sd * rw * 0.45, ey - rh * 1.25, outer, ey - rh * 0.15);
          if (state === 'squint') ctx.bezierCurveTo(cx + sd * rw * 0.4, ey + rh * 0.2, cx - sd * rw * 0.4, ey + rh * 0.25, inner, ey + rh * 0.1);
          else ctx.bezierCurveTo(cx + sd * rw * 0.4, ey + rh * 1.05, cx - sd * rw * 0.45, ey + rh * 1.0, inner, ey + rh * 0.1);
          ctx.closePath();
        };
        almond();
        ctx.fillStyle = '#efe7e2';
        ctx.fill();
        ctx.save();
        almond();
        ctx.clip();
        const ir = Math.max(0.03 * m.ky, rw * 0.42);
        const ix = cx + sd * rw * 0.03, iy = ey - rh * 0.12;
        const ig = ctx.createRadialGradient(ix, iy, ir * 0.2, ix, iy, ir);
        ig.addColorStop(0, L.iris);
        ig.addColorStop(0.75, L.iris);
        ig.addColorStop(1, '#2a2a30');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ix, iy, ir, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#100c0c';
        ctx.beginPath();
        ctx.arc(ix, iy, ir * 0.42, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(ix + ir * 0.3, iy - ir * 0.32, ir * 0.18, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(80,40,30,0.35)';
        ctx.fillRect(inner - rw, ey - rh * 2, rw * 4, rh * 0.75);
        ctx.restore();
        ctx.strokeStyle = '#3a221c';
        ctx.lineWidth = 0.014 * m.ky + 1.6;
        ctx.beginPath();
        ctx.moveTo(inner, ey + rh * 0.1);
        ctx.bezierCurveTo(cx - sd * rw * 0.5, ey - rh * 1.35, cx + sd * rw * 0.45, ey - rh * 1.25, outer + sd * 0.012 * m.kx, ey - rh * 0.25);
        ctx.stroke();
        ctx.strokeStyle = rgba(L.skinShade, 0.8);
        ctx.lineWidth = 0.006 * m.ky + 0.8;
        ctx.beginPath();
        ctx.moveTo(inner + sd * rw * 0.2, ey + rh * 0.55);
        ctx.quadraticCurveTo(cx, ey + rh * 1.15, outer, ey + rh * 0.1);
        ctx.stroke();
      });
    };
  }

  function drawMouth(L, state) {
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      ctx.fillStyle = hex(L.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const cx = m.x(0), my = m.y(L.mouthY);
      const hw = L.mouthW * 0.5 * m.kx;
      soft(ctx, cx, m.y(-0.8), 0.45 * m.kx, 0.08 * m.ky, L.skinShade, 0.5);
      soft(ctx, cx, m.y(-0.7), 0.13 * m.kx, 0.06 * m.ky, L.skin, 0.6);
      [-1, 1].forEach(sd => soft(ctx, cx + sd * 0.4 * m.kx, m.y(-0.36), 0.2 * m.kx, 0.12 * m.ky, L.blush || 0xe08a8a, L.blushA || 0.32));
      soft(ctx, cx, m.y(-0.31), 0.13 * m.kx, 0.05 * m.ky, L.skinShade, 0.6);
      ctx.fillStyle = rgba(0x6a3028, 0.75);
      [-1, 1].forEach(sd => {
        ctx.beginPath();
        ctx.ellipse(cx + sd * 0.045 * m.kx, m.y(-0.285), 0.022 * m.kx, 0.012 * m.ky, sd * 0.4, 0, PI * 2);
        ctx.fill();
      });
      soft(ctx, cx, m.y((L.mouthY - 0.3) / 2), 0.035 * m.kx, 0.06 * m.ky, L.skinShade, 0.35);
      const smiley = state === 'grin' || state === 'wide' || state === 'smile';
      if (smiley) {
        ctx.strokeStyle = rgba(L.skinShade, 0.75);
        ctx.lineWidth = 0.012 * m.ky + 1;
        [-1, 1].forEach(sd => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * 0.15 * m.kx, m.y(-0.3));
          ctx.quadraticCurveTo(cx + sd * (hw + 0.08 * m.kx), my - 0.03 * m.ky, cx + sd * (hw + 0.04 * m.kx), my + 0.08 * m.ky);
          ctx.stroke();
        });
      }
      const open = { shut: 0, smile: 0, open: 0.05, talk: 0.032, wide: 0.12, o: 0.085, grin: 0.065 }[state] || 0;
      const width = { shut: 0.82, smile: 1.06, open: 0.86, talk: 0.9, wide: 1.12, o: 0.5, grin: 1.16 }[state] || 0.86;
      const ww = hw * width;
      const oh = open * m.ky;
      const up = smiley ? 0.035 * m.ky : 0;
      const lipT = 0.028 * m.ky, lipB = 0.04 * m.ky;
      if (!open) {
        ctx.beginPath();
        ctx.moveTo(cx - ww - 1, my - up);
        ctx.bezierCurveTo(cx - ww * 0.5, my - lipT * 1.2 - up * 0.3, cx - ww * 0.15, my - lipT * 1.1, cx, my - lipT * 0.7);
        ctx.bezierCurveTo(cx + ww * 0.15, my - lipT * 1.1, cx + ww * 0.5, my - lipT * 1.2 - up * 0.3, cx + ww + 1, my - up);
        ctx.quadraticCurveTo(cx, my + up * 0.4, cx - ww - 1, my - up);
        ctx.fillStyle = hex(L.lip);
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - ww * 0.95, my - up);
        ctx.quadraticCurveTo(cx, my + lipB * 2 + up * 0.4, cx + ww * 0.95, my - up);
        ctx.quadraticCurveTo(cx, my + up * 0.4, cx - ww * 0.95, my - up);
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        soft(ctx, cx, my + lipB * 0.9, ww * 0.35, lipB * 0.35, 0xffffff, 0.25);
        ctx.strokeStyle = '#5a2224';
        ctx.lineWidth = 0.01 * m.ky + 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - ww, my - up);
        ctx.quadraticCurveTo(cx, my + up * 0.5 + 1, cx + ww, my - up);
        ctx.stroke();
        return;
      }
      const shape = () => {
        ctx.beginPath();
        if (state === 'o') ctx.ellipse(cx, my + oh * 0.35, ww, oh, 0, 0, PI * 2);
        else {
          ctx.moveTo(cx - ww, my - up);
          ctx.quadraticCurveTo(cx, my - up * 0.2 - oh * 0.3, cx + ww, my - up);
          ctx.quadraticCurveTo(cx, my + oh * 1.7, cx - ww, my - up);
        }
      };
      shape();
      ctx.lineWidth = lipB * 1.6;
      ctx.strokeStyle = hex(L.lip);
      ctx.stroke();
      shape();
      ctx.fillStyle = '#3a1418';
      ctx.fill();
      ctx.save();
      shape();
      ctx.clip();
      if (state !== 'o') {
        ctx.fillStyle = '#f1ebe2';
        ctx.fillRect(cx - ww, my - up - oh * 0.6, ww * 2, Math.max(3, oh * (state === 'talk' ? 0.45 : 0.58)));
        ctx.strokeStyle = 'rgba(160,150,140,0.6)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * ww * 0.18, my - up - oh * 0.6);
          ctx.lineTo(cx + i * ww * 0.18, my - up - oh * 0.6 + oh * 0.5);
          ctx.stroke();
        }
        if (state === 'wide' || state === 'grin') {
          ctx.fillStyle = '#e2dace';
          ctx.fillRect(cx - ww * 0.65, my + oh * 1.0, ww * 1.3, oh * 0.4);
        }
      }
      ctx.fillStyle = '#b5444e';
      ctx.beginPath();
      ctx.ellipse(cx, my + oh * (state === 'o' ? 1.0 : 1.3), ww * 0.55, oh * 0.45, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      soft(ctx, cx, my + oh * 1.6 + lipB, ww * 0.4, lipB * 0.4, 0xffffff, 0.2);
    };
  }

  const EYES = ['open', 'wide', 'half', 'squint', 'shut'];
  const MOUTHS = ['shut', 'smile', 'talk', 'open', 'wide', 'o', 'grin'];

  function texFloral(ctx, w, h) {
    ctx.fillStyle = '#eef3ef';
    ctx.fillRect(0, 0, w, h);
    const g = rand(77);
    const cols = ['rgba(232,120,170,0.75)', 'rgba(120,200,140,0.75)', 'rgba(110,160,230,0.75)', 'rgba(250,215,90,0.75)', 'rgba(170,120,220,0.7)', 'rgba(90,190,200,0.7)'];
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 4 + g() * 14, 3 + g() * 8, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = 'rgba(60,140,90,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (g() - 0.5) * 30, y + 10, x + (g() - 0.5) * 20, y + 24);
      ctx.stroke();
    }
  }

  function texDadTee(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1f3a40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.09, h * 0.27, 9, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1f3a40';
    ctx.fillRect(w * 0.09 - 5, h * 0.27 - 1, 10, 3);
    ctx.font = 'bold 7px Arial, sans-serif';
    ctx.textAlign = 'left';
    ['ACTIVE  SUMMER  CLUB', 'beach  ·  sport  ·  fun', 'est. 1998'].forEach((s, i) => ctx.fillText(s, w * 0.84, h * (0.6 + i * 0.035)));
  }

  function texPolo(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d2c56';
    const x = w * 0.095, y = h * 0.33;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.6, 2.4, 0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(x - 2.5, y + 1.5, 5, 1);
  }

  function texWomanTop(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  function torsoRings(L, d, colAt) {
    const [sx, sy, sz] = L.torso;
    return TORSO.map(([y, rx, rz, cz]) => ring(y * sy, rx * sx, rz * sz, cz * sz, colAt(y * sy)));
  }

  function buildTorso(b, who, L, d) {
    const waist = (L.hem || -0.24) * L.torso[1];
    const colAt = (y) => (y < waist ? L.bottom : L.top);
    const rings = [];
    const base = torsoRings(L, d, colAt);
    base.forEach((r0, i) => {
      if (i > 0 && base[i - 1].y < waist && r0.y >= waist) {
        const k = (waist - base[i - 1].y) / (r0.y - base[i - 1].y);
        const rx = lerp(base[i - 1].rx, r0.rx, k), rz = lerp(base[i - 1].rz, r0.rz, k);
        rings.push(ring(waist, rx * 1.03, rz * 1.03, 0, L.bottom), ring(waist + 0.001, rx * 1.05, rz * 1.05, 0, L.top));
      }
      rings.push(r0);
    });
    if (who === 'woman') {
      rings.forEach(r0 => { if (r0.y > 0.0 && r0.y < 0.2) r0.rz *= 1.12; });
      rings.forEach(r0 => { if (r0.y < waist + 0.06 && r0.y > waist - 0.01) r0.col = L.skin; });
    }
    if (who === 'girl') rings.forEach(r0 => { r0.rx *= 1.06; r0.rz *= 1.06; });
    if (who === 'dad') rings.forEach(r0 => { if (r0.y > waist) { r0.rx *= 1.06; r0.rz *= 1.08; } });
    loft(b, rings, 16, { capBottom: true, hard: true, uv: true });
    const top = rings[rings.length - 1];
    const neckR = top.rx;
    if (who === 'boy') {
      const cy = top.y - 0.012;
      for (let i = 0; i < 12; i++) {
        const a0 = PI * 0.12 + (i / 12) * PI * 1.76, a1 = PI * 0.12 + ((i + 1) / 12) * PI * 1.76;
        const p = (a, r, y, out) => [S(a) * r, y, top.cz + C(a) * r * 0.8 + out];
        b.quad(p(a0, neckR * 1.05, cy, 0), p(a1, neckR * 1.05, cy, 0), p(a1, neckR * 1.18, cy + 0.035, 0.004), p(a0, neckR * 1.18, cy + 0.035, 0.004), [0.97, 0.98, 1.0, 0]);
      }
      [-1, 1].forEach(sd => {
        const ax = sd * neckR * 0.55;
        b.tri([sd * 0.006, cy - 0.005, top.cz + neckR * 0.72], [ax + sd * 0.035, cy - 0.01, top.cz + neckR * 0.45], [sd * 0.012, cy - 0.065, top.cz + neckR * 0.95], [0.95, 0.96, 0.99, 0]);
        b.tri([sd * 0.006, cy - 0.005, top.cz + neckR * 0.72], [sd * neckR * 0.95, cy + 0.02, top.cz + neckR * 0.2], [ax + sd * 0.035, cy - 0.01, top.cz + neckR * 0.45], [0.95, 0.96, 0.99, 0]);
      });
      const zf = (y) => {
        let best = TORSO[0];
        for (const t of TORSO) if (t[0] * L.torso[1] <= y) best = t;
        return best[3] * L.torso[2] + best[2] * L.torso[2];
      };
      const py0 = cy - 0.15, py1 = cy - 0.06;
      b.quad([-0.012, py0, zf(py0) + 0.003], [0.012, py0, zf(py0) + 0.003], [0.012, py1, zf(py1) + 0.004], [-0.012, py1, zf(py1) + 0.004], [0.9, 0.92, 0.96, 0]);
      [py0 + 0.02, py0 + 0.06].forEach(y => b.at(0, y, zf(y) + 0.006, q => q.ellipsoid(0.0045, 0.0045, 0.002, 6, 3, [0.92, 0.9, 0.82, 0])));
    } else if (who === 'dad') {
      b.at(0, top.y - 0.01, top.cz, q => q.prism(14, neckR * 1.06, neckR * 0.86, -0.012, neckR * 1.02, neckR * 0.82, 0.012, shade(L.top, 0.94)));
    } else if (who === 'girl') {
      b.at(0, top.y - 0.005, top.cz, q => q.prism(14, neckR * 1.04, neckR * 0.84, -0.01, neckR * 0.98, neckR * 0.8, 0.008, 0xf2f6f2));
      const at = (y) => {
        for (let i = 0; i < rings.length - 1; i++) {
          const a = rings[i], c = rings[i + 1];
          if (y <= c.y && c.y > a.y) {
            const k = clamp((y - a.y) / (c.y - a.y), 0, 1);
            return { rx: lerp(a.rx, c.rx, k), rz: lerp(a.rz, c.rz, k), cz: lerp(a.cz || 0, c.cz || 0, k) };
          }
        }
        return rings[rings.length - 1];
      };
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const y = lerp(top.y - 0.03, waist - 0.04, t);
        const r0 = at(y);
        const x = lerp(r0.rx * 0.62, -r0.rx * 0.9, t);
        const z = r0.cz + r0.rz * Math.sqrt(Math.max(0, 1 - (x / r0.rx) ** 2)) + 0.006;
        pts.push([x, y, z]);
      }
      for (let i = 0; i < 12; i++) {
        const a = pts[i], c = pts[i + 1];
        const dir = V3.norm(V3.sub(c, a));
        const side = V3.norm(V3.cross(dir, [0, 0, 1]));
        const w0 = 0.007;
        b.quad(V3.add(a, V3.mul(side, w0)), V3.sub(a, V3.mul(side, w0)), V3.sub(c, V3.mul(side, w0)), V3.add(c, V3.mul(side, w0)), [0.97, 0.97, 0.96, 0]);
      }
    }
  }

  function buildPelvis(b, L) {
    const [sx, sz] = L.pelvis;
    loft(b, PELVIS.map(([y, rx, rz, cz]) => ring(y, rx * sx, rz * sz, cz, L.bottom)), 14, { capBottom: true, capTop: true });
    if (L === LOOK.dad) {
      [-1, 1].forEach(sd => {
        b.quad([sd * 0.02, 0.045, 0.095 * sz + 0.004], [sd * 0.027, 0.045, 0.095 * sz + 0.004], [sd * 0.03, -0.02, 0.112 * sz + 0.004], [sd * 0.023, -0.02, 0.112 * sz + 0.004], 0xf6f6f2);
      });
    }
  }

  function buildThigh(b, L, d) {
    const s = (d.thigh / 0.46) * (L.limb || 1);
    const len = d.thigh;
    const sh = clamp(L.shorts, 0, 1);
    const rings = [ring(0.05, 0.088 * s, 0.09 * s, 0, L.bottom)];
    const flare = L === LOOK.girl || L === LOOK.woman ? 0.006 : 0.01;
    if (sh > 0.05) {
      const ys = -len * sh;
      rings.push(ring(-len * sh * 0.5, (0.082 + flare * 0.6) * s, (0.085 + flare * 0.6) * s, 0, L.bottom));
      rings.push(ring(ys, (0.072 + flare) * s, (0.075 + flare) * s, 0, L.bottom));
      rings.push(ring(ys - 0.001, 0.064 * s, 0.067 * s, 0, L.skin));
    } else rings.push(ring(-0.06, 0.084 * s, 0.087 * s, 0, L.skin));
    if (-len * 0.75 < -len * sh - 0.02) rings.push(ring(-len * 0.75, 0.06 * s, 0.063 * s, 0, L.skin));
    rings.push(ring(-len - 0.02, 0.052 * s, 0.055 * s, 0, L.skin));
    rings.sort((a, b2) => a.y - b2.y);
    loft(b, rings, 10, { capBottom: true, capTop: true, hard: true });
  }

  function buildShin(b, L, d) {
    const s = (d.shin / 0.45) * (L.limb || 1);
    const len = d.shin;
    b.ellipsoid(0.056 * s, 0.054 * s, 0.058 * s, 8, 5, L.skin);
    const sockTop = L === LOOK.woman ? -len + 0.01 : -len + 0.07;
    loft(b, [
      ring(-len + 0.0, 0.036 * s, 0.038 * s, 0, L.sock),
      ring(sockTop, 0.039 * s, 0.041 * s, 0, L.sock),
      ring(sockTop + 0.001, 0.04 * s, 0.042 * s, 0, L.skin),
      ring(-len * 0.55, 0.05 * s, 0.056 * s, -0.006, L.skin),
      ring(-len * 0.25, 0.054 * s, 0.06 * s, -0.008, L.skin),
      ring(0.0, 0.052 * s, 0.055 * s, 0, L.skin)
    ], 10, { capBottom: true, hard: true });
  }

  function buildFoot(b, L, d) {
    const s = d.shin / 0.45;
    const len = 0.24 * s;
    b.at(0, -0.03 * s, 0.0, q => q.ellipsoid(0.045 * s, 0.045 * s, 0.05 * s, 7, 4, L.shoe));
    b.push(M4.translate(0, -0.06 * s, len * 0.28));
    b.box(0.09 * s, 0.065 * s, len, L.shoe, { faces: { bottom: L.sole } });
    b.at(0, -0.035 * s, 0, q => q.box(0.094 * s, 0.022 * s, len + 0.01, L.sole));
    b.at(0, -0.005 * s, len * 0.48, q => q.ellipsoid(0.045 * s, 0.034 * s, 0.04 * s, 7, 3, L.shoe));
    b.pop();
  }

  function buildUpper(b, L, d) {
    const s = (d.upper / 0.31) * (L.limb || 1);
    const len = d.upper;
    const sleeve = L.sleeve;
    const top = L.top;
    b.ellipsoid(0.054 * s, 0.05 * s, 0.054 * s, 10, 6, sleeve > 0 ? top : L.skin);
    const rings = [ring(-len - 0.01, 0.042 * s, 0.044 * s, 0, L.skin), ring(-len * 0.6, 0.05 * s, 0.052 * s, 0, L.skin)];
    if (sleeve > 0) {
      const ys = -len * sleeve;
      rings.push(ring(ys, 0.053 * s, 0.055 * s, 0, L.skin), ring(ys + 0.001, 0.066 * s, 0.068 * s, 0, top), ring(-0.03, 0.07 * s, 0.072 * s, 0, top), ring(0.03, 0.066 * s, 0.068 * s, 0, top));
    } else rings.push(ring(-0.04, 0.056 * s, 0.058 * s, 0, L.skin), ring(0.03, 0.052 * s, 0.054 * s, 0, L.skin));
    rings.sort((a, b2) => a.y - b2.y);
    loft(b, rings, 10, { capBottom: true, hard: true });
  }

  function buildFore(b, L, d, watch) {
    const s = (d.fore / 0.27) * (L.limb || 1);
    const len = d.fore;
    b.ellipsoid(0.05 * s, 0.05 * s, 0.05 * s, 10, 6, L.skin);
    loft(b, [ring(-len + 0.005, 0.03 * s, 0.037 * s, 0, L.skin), ring(-len * 0.6, 0.042 * s, 0.047 * s, 0, L.skin), ring(-len * 0.2, 0.048 * s, 0.05 * s, 0, L.skin), ring(0.0, 0.048 * s, 0.05 * s, 0, L.skin)], 12, { capBottom: true });
    if (watch) {
      b.at(0, -len + 0.035, 0, q => q.prism(10, 0.036 * s, 0.041 * s, -0.012, 0.036 * s, 0.041 * s, 0.012, 0x2a2c30));
      b.push(M4.translate(0, -len + 0.035, 0.04 * s), M4.rotX(PI / 2));
      b.box(0.03, 0.008, 0.036, 0x1a1c20);
      b.pop();
    }
  }

  const GRIPS = {
    relax: { curl: [0.5, 0.55, 0.6, 0.7], spread: 0.08, thumb: 0.5 },
    open: { curl: [0.08, 0.06, 0.08, 0.12], spread: 0.18, thumb: 0.9 },
    flat: { curl: [0.02, 0.02, 0.02, 0.04], spread: 0.06, thumb: 0.5 },
    comb: { curl: [0.55, 0.5, 0.55, 0.65], spread: 0.22, thumb: 0.8 },
    lolli: { curl: [1.25, 1.4, 1.5, 1.5], spread: 0.02, thumb: 0.15 },
    fist: { curl: [1.5, 1.6, 1.6, 1.6], spread: 0.0, thumb: 0.2 }
  };

  function buildFinger(b, sk, len, r, curl, k) {
    const parts = [0.46, 0.31, 0.23];
    parts.forEach((f, j) => {
      const l = len * f;
      const rr = r * (1 - 0.1 * j);
      b.push(M4.rotZ(k * -curl * (j === 0 ? 0.6 : 0.8)));
      b.ellipsoid(rr * 1.02, rr * 1.02, rr * 0.95, 6, 4, sk);
      b.prism(6, rr, rr * 0.88, 0, rr * 0.9, rr * 0.8, -l, sk, { capTop: false });
      b.push(M4.translate(0, -l, 0));
    });
    b.ellipsoid(r * 0.8, r * 0.85, r * 0.72, 6, 4, sk);
    for (let j = 0; j < parts.length * 2; j++) b.pop();
  }

  function buildHand(b, L, side, grip) {
    const s = L.hand;
    const sk = L.skin;
    const k = side === 'L' ? 1 : -1;
    const g = GRIPS[grip] || GRIPS.relax;
    b.push(M4.scale(s, s, s));
    b.at(0, -0.045, 0, q => q.box(0.024, 0.075, 0.07, sk));
    b.at(0, -0.045, 0, q => q.ellipsoid(0.017, 0.045, 0.04, 8, 5, sk));
    b.at(0, -0.006, 0, q => q.ellipsoid(0.02, 0.016, 0.03, 7, 4, sk));
    const lens = [0.07, 0.078, 0.074, 0.058];
    [-1.5, -0.5, 0.5, 1.5].forEach((p, i) => {
      b.push(M4.translate(0, -0.08 + Math.abs(p) * 0.003, -p * 0.0175), M4.rotX(-p * g.spread * k));
      buildFinger(b, sk, lens[i], 0.0092 - Math.abs(p) * 0.0006, g.curl[i], k);
      b.pop();
    });
    b.push(M4.translate(-k * 0.006, -0.02, 0.03), M4.rotX(-0.7 - g.thumb * 0.5), M4.rotZ(k * 0.45));
    b.ellipsoid(0.014, 0.022, 0.014, 6, 4, sk);
    b.push(M4.translate(0, -0.022, 0), M4.rotZ(k * -0.3 - k * (1 - g.thumb) * 0.4));
    b.prism(6, 0.01, 0.009, 0, 0.009, 0.008, -0.03, sk, { capTop: false });
    b.at(0, -0.032, 0, q => q.ellipsoid(0.009, 0.011, 0.008, 6, 4, sk));
    b.pop();
    b.pop();
    b.pop();
  }

  function buildNeck(b, L, d) {
    const r0 = d.head * 0.56;
    loft(b, [ring(-0.06, r0 * 1.05, r0 * 0.98, 0.0, L.skin), ring(d.headY * 0.6, r0, r0 * 0.95, 0.008, L.skin)], 10);
  }

  function buildNose(b, L, R, k) {
    const sk = shade(L.skin, 0.99);
    const rows = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const pit = lerp(0.1, -0.27, t);
      const c = headPoint(L, R, 0, pit);
      rows.push({ y: c[1], z: c[2] - R * 0.01, out: R * k * lerp(0.02, 0.15, Math.pow(t, 1.3)), w: R * k * lerp(0.06, 0.1, t) });
    }
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i], c = rows[i + 1];
      const ap = (r) => [0, r.y, r.z + r.out];
      const lt = (r) => [-r.w, r.y, r.z];
      const rt = (r) => [r.w, r.y, r.z];
      b.quad(lt(a), ap(a), ap(c), lt(c), sk);
      b.quad(ap(a), rt(a), rt(c), ap(c), sk);
    }
    const tip = rows[rows.length - 1];
    b.at(0, tip.y + R * 0.005, tip.z + tip.out - R * 0.045, q => q.ellipsoid(R * 0.07 * k, R * 0.06 * k, R * 0.065 * k, 8, 5, sk));
    [-1, 1].forEach(sd => b.at(sd * R * 0.075 * k, tip.y - R * 0.005, tip.z + tip.out * 0.45, q => q.ellipsoid(R * 0.05 * k, R * 0.045 * k, R * 0.055 * k, 7, 4, shade(L.skin, 0.97))));
  }

  function buildHead(b, who, L, d) {
    const R = d.head;
    const colAt = who === 'dad' ? (yaw, pit) => {
      const backTop = clamp((pit - 0.15) / 0.8, 0, 1) * clamp((-C(yaw) + 0.6) / 1.2, 0, 1) + clamp((pit - 0.9) / 0.5, 0, 1);
      const c0 = rgb(L.skin), c1 = rgb(L.scalp);
      const t = clamp(backTop, 0, 0.9);
      return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t), 0];
    } : () => L.skin;
    headGrid(b, L, R, -PI, PI, -PI / 2 + 0.02, PI / 2 - 0.02, 30, 18, colAt);
    [-1, 1].forEach(sd => {
      const p = headPoint(L, R, sd * PI / 2, -0.05);
      const big = who === 'dad' ? 1.18 : 1;
      b.push(M4.translate(p[0] * 0.97, p[1], p[2] - R * 0.06), M4.rotY(sd * 0.3));
      b.ellipsoid(R * 0.08, R * 0.24 * big, R * 0.15 * big, 8, 6, shade(L.skin, 0.94));
      b.at(sd * R * 0.035, 0, R * 0.02, q => q.ellipsoid(R * 0.04, R * 0.13 * big, R * 0.07 * big, 6, 4, shade(L.skin, 0.8)));
      b.pop();
    });
    buildNose(b, L, R, L.nose || 1);
  }

  function buildFacePatch(b, L, d, patch) {
    headGrid(b, L, d.head, patch[0], patch[1], patch[2], patch[3], 14, 8, () => 0xffffff, 1.012, true);
  }

  function boyTop(yaw, pit) {
    return clamp((pit - 0.62) / 0.5, 0, 1) * clamp(1.4 - Math.abs(yaw) * 0.55, 0, 1);
  }

  function boyThick(yaw, pit) {
    return 1.018 + 0.085 * Math.pow(boyTop(yaw, pit), 0.8);
  }

  function boyHairCap(b, L, R) {
    const H = rgb(L.hair), Hi = rgb(L.hairHi), Dk = rgb(L.hairDark);
    const nu = 32, nv = 10;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.7) return 0.6 + 0.04 * (a / 0.7);
      if (a < 1.2) return lerp(0.64, 0.16, (a - 0.7) / 0.5);
      if (a < 1.75) return lerp(0.16, 0.02, (a - 1.2) / 0.55);
      return lerp(0.02, -0.6, clamp((a - 1.75) / 0.9, 0, 1));
    };
    const top = boyTop;
    const thick = boyThick;
    const colAt = (yaw, pit) => {
      const t = top(yaw, pit);
      const hi = t * clamp(C(yaw) * 1.3, 0, 1);
      const c = [lerp(Dk[0], H[0], t), lerp(Dk[1], H[1], t), lerp(Dk[2], H[2], t)];
      return [lerp(c[0], Hi[0], hi * 0.7), lerp(c[1], Hi[1], hi * 0.7), lerp(c[2], Hi[2], hi * 0.7), 0];
    };
    const P = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - 0.02 - p0) * Math.pow(j / nv, 0.8);
      const p = headPoint(L, R, yaw, pit);
      const k = thick(yaw, pit);
      return { p: [p[0] * k, p[1] * k, p[2] * k], c: colAt(yaw, pit) };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = P(i, j), c = P(i + 1, j), e = P(i + 1, j + 1), f = P(i, j + 1);
        b.quad(a.p, c.p, e.p, f.p, [a.c, c.c, e.c, f.c]);
      }
    }
    const g = rand(19);
    for (let i = 0; i < 60; i++) {
      const yaw = -PI + g() * 2 * PI;
      if (Math.abs(yaw) < 1.0) continue;
      const pit = lower(yaw) + 0.05 + g() * 0.5;
      const p = headPoint(L, R, yaw, pit);
      const k = thick(yaw, pit);
      b.push(M4.translate(p[0] * k, p[1] * k, p[2] * k), M4.rotY(yaw), M4.rotX(-(PI / 2 - pit) - 0.6));
      b.prism(3, 0.009, 0.004, 0, 0.0015, 0.0015, 0.011 + g() * 0.008, colAt(yaw, pit + 0.1));
      b.pop();
    }
  }

  function boyFringe(b, L, R) {
    const H = rgb(L.hair), Hi = rgb(L.hairHi);
    const g = rand(29);
    const strands = [];
    for (let i = 0; i < 46; i++) {
      const u = g();
      const yaw0 = lerp(0.62, -0.5, u) + (g() - 0.5) * 0.12;
      const pit0 = 1.28 - 0.25 * g();
      const sweep = 0.45 + 0.35 * g();
      const yaw1 = yaw0 - sweep - 0.15 * clamp(-yaw0, 0, 1);
      const reach = yaw1 < -0.2 ? 0.48 + 0.08 * g() : 0.6 + 0.08 * g();
      strands.push({ yaw0, pit0, yaw1, pit1: reach, lift: 0.07 + 0.045 * g() + 0.03 * clamp(yaw0, 0, 1), w: 0.018 + 0.012 * g(), hi: g() });
    }
    strands.sort((a, c) => a.lift - c.lift);
    strands.forEach(st => {
      const pts = [];
      const N = 6;
      for (let s = 0; s <= N; s++) {
        const u = s / N;
        const yaw = lerp(st.yaw0, st.yaw1, Math.pow(u, 1.25));
        const pit = lerp(st.pit0, st.pit1, u);
        const p = headPoint(L, R, yaw, pit);
        const k = Math.max(boyThick(yaw, pit), 1.03) + 0.006 + st.lift * S(Math.min(1, u * 1.15) * PI * 0.9) * (1 - 0.35 * u) * 0.6;
        pts.push({ p: [p[0] * k, p[1] * k, p[2] * k], n: V3.norm(p), w: R * lerp(st.w * 10, st.w * 3, u) });
      }
      const col = (u) => {
        const h = clamp(0.35 + 0.45 * u + (st.hi - 0.5) * 0.12, 0, 1);
        return [lerp(H[0], Hi[0], h), lerp(H[1], Hi[1], h), lerp(H[2], Hi[2], h), 0];
      };
      for (let s = 0; s < N; s++) {
        const a = pts[s], c = pts[s + 1];
        const dir = V3.norm(V3.sub(c.p, a.p));
        const sa = V3.norm(V3.cross(dir, a.n)), sc = V3.norm(V3.cross(dir, c.n));
        const ca = col(s / N), cc = col((s + 1) / N);
        const da = V3.mul(a.n, -R * 0.03), dc = V3.mul(c.n, -R * 0.03);
        const A0 = V3.add(a.p, V3.mul(sa, a.w)), A1 = V3.sub(a.p, V3.mul(sa, a.w));
        const C0 = V3.add(c.p, V3.mul(sc, c.w)), C1 = V3.sub(c.p, V3.mul(sc, c.w));
        b.quad(A0, A1, C1, C0, [ca, ca, cc, cc], null, [a.n, a.n, c.n, c.n]);
        b.quad(V3.add(A1, da), V3.add(A0, da), V3.add(C0, dc), V3.add(C1, dc), [ca, ca, cc, cc].map(q => [q[0] * 0.82, q[1] * 0.82, q[2] * 0.82, 0]));
        b.quad(A0, V3.add(A0, da), V3.add(C0, dc), C0, [ca, ca, cc, cc].map(q => [q[0] * 0.9, q[1] * 0.9, q[2] * 0.9, 0]));
        b.quad(V3.add(A1, da), A1, C1, V3.add(C1, dc), [ca, ca, cc, cc].map(q => [q[0] * 0.9, q[1] * 0.9, q[2] * 0.9, 0]));
      }
    });
  }

  function girlHair(b, L, R) {
    const H = rgb(L.hair), Hi = rgb(L.hairHi);
    const nu = 22, nv = 8;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.8) return 0.5;
      if (a < 1.6) return lerp(0.5, 0.0, (a - 0.8) / 0.8);
      return lerp(0.0, -0.75, clamp((a - 1.6) / 1.0, 0, 1));
    };
    const P = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - 0.02 - p0) * (j / nv);
      const p = headPoint(L, R, yaw, pit);
      const t = 1.035;
      const stripe = 0.5 + 0.5 * S(yaw * 9);
      const c = [lerp(H[0], Hi[0], stripe * 0.6), lerp(H[1], Hi[1], stripe * 0.6), lerp(H[2], Hi[2], stripe * 0.6), 0];
      return { p: [p[0] * t, p[1] * t, p[2] * t], c };
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = P(i, j), c = P(i + 1, j), e = P(i + 1, j + 1), f = P(i, j + 1);
      b.quad(a.p, c.p, e.p, f.p, [a.c, c.c, e.c, f.c]);
    }
    [-1, 1].forEach(sd => {
      const p = headPoint(L, R, sd * 0.75, 1.0);
      b.at(p[0] * 1.1, p[1] * 1.12, p[2] * 1.02 - 0.012, q => q.ellipsoid(R * 0.36, R * 0.33, R * 0.35, 10, 7, L.hair));
      b.at(p[0] * 1.1 + sd * 0.003, p[1] * 1.12 + R * 0.08, p[2] * 1.02 - 0.01, q => q.ellipsoid(R * 0.22, R * 0.16, R * 0.22, 7, 4, L.hairHi));
    });
    const g = rand(37);
    for (let i = 0; i < 14; i++) {
      const sd = i % 2 ? 1 : -1;
      const yaw = sd * (0.85 + g() * 0.6);
      const pit = 0.35 + g() * 0.3;
      const p = headPoint(L, R, yaw, pit);
      const len = 0.08 + g() * 0.08;
      b.push(M4.translate(p[0] * 1.04, p[1] * 1.04, p[2] * 1.04), M4.rotY(yaw), M4.rotZ(sd * (0.05 + g() * 0.15)));
      b.quad([-0.003, 0, 0], [0.003, 0, 0], [0.001 + sd * 0.01, -len, 0.01], [-0.001 + sd * 0.01, -len, 0.01], g() < 0.5 ? L.hairHi : L.hair);
      b.pop();
    }
  }

  function womanHair(b, L, R) {
    const H = rgb(L.hair), Hi = rgb(L.hairHi);
    const nu = 20, nv = 7;
    const lower = (yaw) => (Math.abs(yaw) < 0.8 ? 0.55 : Math.abs(yaw) < 1.5 ? lerp(0.55, -0.1, (Math.abs(yaw) - 0.8) / 0.7) : -0.4);
    const P = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - 0.02 - p0) * (j / nv);
      const p = headPoint(L, R, yaw, pit);
      const t = 1.06;
      return [p[0] * t, p[1] * t, p[2] * t];
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), (i + j) % 3 ? L.hair : L.hairHi);
    const back = [];
    for (let i = 0; i <= 10; i++) {
      const a = -PI / 2 - 0.3 + (i / 10) * (PI + 0.6);
      back.push(a);
    }
    for (let i = 0; i < 10; i++) {
      const a0 = back[i], a1 = back[i + 1];
      const p = (a, y, r) => [C(a) * r, y, -Math.abs(S(a)) * r * 0.9 + (S(a) > 0 ? 0 : 0) - 0.01];
      const top0 = p(a0, -R * 0.2, R * 1.08), top1 = p(a1, -R * 0.2, R * 1.08);
      const bot0 = p(a0, -R * 3.6, R * 1.25), bot1 = p(a1, -R * 3.6, R * 1.25);
      b.quad(top0, top1, bot1, bot0, [[H[0], H[1], H[2], 0], [H[0], H[1], H[2], 0], [Hi[0], Hi[1], Hi[2], 0], [Hi[0], Hi[1], Hi[2], 0]]);
    }
  }

  function buildLolli(b) {
    b.at(0, 0, 0, q => q.prism(5, 0.0025, 0.0025, 0, 0.0025, 0.0025, 0.095, 0xf6f6f2));
    b.at(0, -0.004, 0, q => q.ellipsoid(0.017, 0.016, 0.017, 9, 6, [0.95, 0.42, 0.12, 0.2]));
    b.at(0.005, 0.002, 0.009, q => q.ellipsoid(0.006, 0.006, 0.006, 5, 3, [1, 0.8, 0.6, 0.6]));
  }

  function build(r) {
    const V = {};
    const mk = (fn) => {
      const b = new Builder();
      fn(b);
      return r.mesh(b);
    };
    const tex = {
      floral: r.texture(256, texFloral),
      dadTee: r.texture(256, texDadTee),
      polo: r.texture(256, texPolo),
      plain: r.texture(16, texWomanTop)
    };
    Object.keys(D).forEach(who => {
      const L = LOOK[who], d = D[who];
      const P = {
        torso: mk(b => buildTorso(b, who, L, d)),
        pelvis: mk(b => buildPelvis(b, L)),
        thigh: mk(b => buildThigh(b, L, d)),
        shin: mk(b => buildShin(b, L, d)),
        foot: mk(b => buildFoot(b, L, d)),
        upper: mk(b => buildUpper(b, L, d)),
        foreL: mk(b => buildFore(b, L, d, who === 'dad')),
        foreR: mk(b => buildFore(b, L, d, false)),
        neck: mk(b => buildNeck(b, L, d)),
        head: mk(b => buildHead(b, who, L, d)),
        eyePatch: mk(b => buildFacePatch(b, L, d, EYE_PATCH)),
        mouthPatch: mk(b => buildFacePatch(b, L, d, MOUTH_PATCH)),
        hands: {},
        eyes: {},
        mouths: {},
        torsoTex: who === 'girl' ? tex.floral : who === 'dad' ? tex.dadTee : who === 'boy' ? tex.polo : tex.plain
      };
      Object.keys(GRIPS).forEach(gr => ['L', 'R'].forEach(s => { P.hands[s + gr] = mk(b => buildHand(b, L, s, gr)); }));
      const eyeSet = who === 'woman' ? ['open', 'shut'] : EYES;
      const mouthSet = who === 'woman' ? ['smile'] : MOUTHS;
      const tw = who === 'boy' ? 512 : 256;
      eyeSet.forEach(e => { P.eyes[e] = r.texture(tw, drawEyes(L, e), { height: tw / 2, clamp: true }); });
      mouthSet.forEach(m => { P.mouths[m] = r.texture(tw, drawMouth(L, m), { height: tw / 2, clamp: true }); });
      if (who === 'boy') {
        P.hair = mk(b => boyHairCap(b, L, d.head));
        P.fringe = mk(b => boyFringe(b, L, d.head));
      } else if (who === 'girl') P.hair = mk(b => girlHair(b, L, d.head));
      else if (who === 'woman') P.hair = mk(b => womanHair(b, L, d.head));
      V[who] = P;
    });
    V.lolli = mk(buildLolli);
    V.bag = mk(b => {
      b.box(0.32, 0.36, 0.12, 0xc8a070, { base: true });
      b.at(0, 0.36, 0, q => q.box(0.33, 0.012, 0.125, 0xb08a5c));
      [-0.07, 0.07].forEach(x => b.quad([x - 0.008, 0.36, 0.0], [x + 0.008, 0.36, 0.0], [x + 0.008, 0.46, 0.0], [x - 0.008, 0.46, 0.0], 0xa07a50));
    });
    return V;
  }

  function solve(who, pose) {
    return Rig.solve(pose, D[who]);
  }

  function draw(r, V, who, m, p, opts) {
    const o = opts || {};
    const P = V[who];
    const base = o.base || null;
    const at = (mat) => (base ? M4.mul(base, mat) : mat);
    const pass = Object.assign({}, o.pass || {});
    const flat = !!pass.flat;
    r.draw(P.pelvis, at(m.pelvis), pass);
    r.draw(P.torso, at(m.chest), flat ? pass : Object.assign({ texture: P.torsoTex }, pass));
    r.draw(P.neck, at(m.neck), pass);
    const hm = m.head;
    r.draw(P.head, at(hm), pass);
    if (!flat) {
      const eyes = P.eyes[p.eyes] || P.eyes.open || Object.values(P.eyes)[0];
      const mouth = P.mouths[p.mouth] || P.mouths.shut || Object.values(P.mouths)[0];
      r.draw(P.eyePatch, at(hm), Object.assign({ texture: eyes }, pass));
      r.draw(P.mouthPatch, at(hm), Object.assign({ texture: mouth }, pass));
    }
    if (P.hair) r.draw(P.hair, at(hm), pass);
    if (P.fringe) {
      const lift = p.hairLift || 0;
      const R = D[who].head;
      const fm = M4.chain(hm, M4.translate(0, R * 1.0, -R * 0.15), M4.rotX(-lift * 0.22), M4.rotZ((p.hairSwing || 0) * 0.2), M4.translate(0, -R * 1.0, R * 0.15));
      r.draw(P.fringe, at(fm), pass);
    }
    ['L', 'R'].forEach(s => {
      r.draw(P.upper, at(m['upper' + s]), pass);
      r.draw(s === 'L' ? P.foreL : P.foreR, at(m['fore' + s]), pass);
      const grip = p['g' + s] || 'relax';
      r.draw(P.hands[s + grip] || P.hands[s + 'relax'], at(m['hand' + s]), pass);
      r.draw(P.thigh, at(m['thigh' + s]), pass);
      r.draw(P.shin, at(m['shin' + s]), pass);
      r.draw(P.foot, at(m['foot' + s]), pass);
    });
    if (p.lolli) {
      const s = p.lolli;
      const k = s === 'L' ? 1 : -1;
      const sc = LOOK[who].hand;
      const dir = V3.norm(p.lolliDir || [-k * 0.45, -0.75, 0.5]);
      const side = V3.norm(V3.cross(dir, [0, 0, 1]));
      const fz = V3.cross(side, dir);
      const lm = M4.chain(m['hand' + s], M4.translate(0, -0.105 * sc, 0.03 * sc), Rig.basisM([0, 0, 0], side, dir, fz));
      r.draw(V.lolli, at(lm), pass);
    }
    if (who === 'woman' && p.bag) {
      r.draw(V.bag, at(M4.chain(m.handR, M4.translate(0, -0.1, 0), M4.rotZ(PI), M4.translate(0, -0.46, 0))), pass);
    }
  }

  function drawShadow(r, V, who, m, p, sunDir, opts) {
    const sh = M4.planarShadow(V3.norm(sunDir), 0.006);
    draw(r, V, who, m, p, { base: opts && opts.base ? M4.mul(opts.base, sh) : sh, pass: { flat: [0.18, 0.17, 0.2, (opts && opts.alpha) || 0.38], blend: true, shadow: true } });
  }

  window.SlayCast = { D, LOOK, EYES, MOUTHS, GRIPS, build, solve, draw, drawShadow, headPoint };
})();
