(function () {
  const { M4, V3, rgb, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const BODY = {
    tall: { hipX: 0.1, hipY: -0.04, thigh: 0.46, shin: 0.43, chestY: 0.22, neckY: 0.34, shX: 0.2, shY: 0.27, upper: 0.31, fore: 0.27, headY: 0.2, k: 1 },
    man: { hipX: 0.1, hipY: -0.04, thigh: 0.44, shin: 0.42, chestY: 0.21, neckY: 0.33, shX: 0.195, shY: 0.26, upper: 0.3, fore: 0.26, headY: 0.19, k: 0.965 },
    woman: { hipX: 0.095, hipY: -0.04, thigh: 0.42, shin: 0.4, chestY: 0.19, neckY: 0.31, shX: 0.165, shY: 0.24, upper: 0.27, fore: 0.24, headY: 0.175, k: 0.9 }
  };

  const TORSO = [
    [-0.2, 0.165, 0.115, 0.0],
    [-0.1, 0.17, 0.12, 0.005],
    [0.0, 0.18, 0.125, 0.01],
    [0.1, 0.19, 0.13, 0.012],
    [0.18, 0.2, 0.128, 0.01],
    [0.25, 0.21, 0.118, 0.004],
    [0.3, 0.2, 0.105, -0.004],
    [0.335, 0.15, 0.085, -0.008],
    [0.36, 0.085, 0.068, -0.004],
    [0.38, 0.066, 0.06, 0.0]
  ];

  const HEAD_M = { rx: 0.071, ry: 0.106, rz: 0.097, jaw: 0.06, chinIn: 0.05, chinDrop: 0.1, back: 1.07, brow: 0.007, cheek: 0.03, gonion: 0.2 };
  const HEAD_W = { rx: 0.071, ry: 0.104, rz: 0.091, jaw: 0.34, chinIn: 0.1, chinDrop: 0.08, back: 1.05, brow: 0.003, cheek: 0.03, gonion: 0.0 };
  const FP = [-1.2, 1.2, -1.25, 0.74];

  const LOOKS = {
    bateman: {
      body: 'tall', head: HEAD_M, skin: 0xc4917a, face: { kind: 'bateman', brow: 0x33200f },
      hair: { style: 'slick', col: 0x5c3e27, hi: 0x7a5636, dk: 0x3e2818 },
      shirt: 0xd2d8e2, tie: 0xb02a2c, tieDk: 0x8a1c20, suit: 0x20232b, suitHi: 0x2c3039,
      coat: { col: 0x171a22, hi: 0x232733, long: true }, pants: 0x1c1d22, shoe: 0x0e0e10, phones: true, prop: 'briefcase'
    },
    greySuit: {
      body: 'man', head: HEAD_M, skin: 0xd8a890, face: { kind: 'man', brow: 0x4a3424 },
      hair: { style: 'short', col: 0x6a4a30, hi: 0x86603e, dk: 0x4a3220 },
      shirt: 0xe6e8ec, tie: 0x2a2e44, tieDk: 0x1c1e2c, suit: 0x5c6068, suitHi: 0x70747c, pants: 0x55585f, shoe: 0x141416
    },
    navySuit: {
      body: 'man', head: HEAD_M, skin: 0xd4a08a, face: { kind: 'man', brow: 0x2c2018 },
      hair: { style: 'part', col: 0x2c2018, hi: 0x44342a, dk: 0x1c140e },
      shirt: 0xf0f0f0, tie: 0x6a1c22, tieDk: 0x441216, suit: 0x1e2230, suitHi: 0x2c3242, pants: 0x1c2030, shoe: 0x101012
    },
    charcoal: {
      body: 'man', head: HEAD_M, skin: 0xdcae96, face: { kind: 'man', brow: 0x3a2a1c },
      hair: { style: 'short', col: 0x3a2a1c, hi: 0x54402e, dk: 0x261a12 },
      shirt: 0xdde4ee, tie: 0x30343c, tieDk: 0x202228, suit: 0x2a2c32, suitHi: 0x3a3c44, pants: 0x27292e, shoe: 0x101012
    },
    greyPart: {
      body: 'man', head: HEAD_M, skin: 0xd6a68e, face: { kind: 'man', brow: 0x5a4430 },
      hair: { style: 'part', col: 0x8a6a48, hi: 0xa88660, dk: 0x6a4e34 },
      shirt: 0xe8eaee, tie: 0x5a2a30, tieDk: 0x3a1a1e, suit: 0x686c72, suitHi: 0x7c8086, pants: 0x62666c, shoe: 0x161618
    },
    redhead: {
      body: 'woman', head: HEAD_W, skin: 0xe6bca8, face: { kind: 'woman', brow: 0x8a4a2a },
      hair: { style: 'bob', col: 0xb0552a, hi: 0xd07440, dk: 0x803818 },
      shirt: 0xe8e4e0, tie: null, suit: 0x6a6c70, suitHi: 0x7e8084, pants: 0x6a6c70, skirt: true, legs: 0xd8b0a0, shoe: 0x1a1414
    },
    shirtGlasses: {
      body: 'man', head: HEAD_M, skin: 0xd8aa94, face: { kind: 'man', brow: 0x3a2a20, glasses: true },
      hair: { style: 'short', col: 0x4a3a2c, hi: 0x62503e, dk: 0x30261c },
      shirt: 0xf2f2f0, tie: 0x3a3a50, tieDk: 0x26263a, suit: null, pants: 0x3a3c44, shoe: 0x141416
    },
    reader: {
      body: 'man', head: HEAD_M, skin: 0xd2a088, face: { kind: 'man', brow: 0x22180e, down: true },
      hair: { style: 'slick', col: 0x22180e, hi: 0x3a2a1c, dk: 0x140e08 },
      shirt: 0xeef0f2, tie: 0x2a2a30, tieDk: 0x1a1a1e, suit: 0x1c1e26, suitHi: 0x2a2c36, pants: 0x1c1e26, shoe: 0x0e0e10, prop: 'folder'
    },
    overcoat: {
      body: 'man', head: HEAD_M, skin: 0xd8a890, face: { kind: 'man', brow: 0x5a4028 },
      hair: { style: 'part', col: 0x7a5a3a, hi: 0x967452, dk: 0x5a3e26 },
      shirt: 0xe4e8ee, tie: 0x7a2a2a, tieDk: 0x501a1a, suit: 0x3a3c44, suitHi: 0x4a4c54,
      coat: { col: 0x8a8a88, hi: 0x9e9e9a, long: true }, pants: 0x3a3c44, shoe: 0x141416, prop: 'briefcase'
    },
    blackSuit: {
      body: 'man', head: HEAD_M, skin: 0xd4a68e, face: { kind: 'man', brow: 0x221810 },
      hair: { style: 'short', col: 0x261c14, hi: 0x3a2c20, dk: 0x18100a },
      shirt: 0xf0f0ee, tie: 0x18181c, tieDk: 0x0c0c10, suit: 0x141518, suitHi: 0x222328, pants: 0x141518, shoe: 0x0c0c0e
    },
    grinner: {
      body: 'man', head: HEAD_M, skin: 0xdaa88e, face: { kind: 'grin', brow: 0x6a4a2c },
      hair: { style: 'short', col: 0x7a5434, hi: 0x946a46, dk: 0x5a3c24 },
      shirt: 0x9eb2c8, tie: 0x1c2232, tieDk: 0x121620, suit: 0x26282e, suitHi: 0x36383f, pants: 0x26282e, shoe: 0x101012
    },
    secretary: {
      body: 'woman', head: HEAD_W, skin: 0xe8c0aa, face: { kind: 'woman', brow: 0x9a7a52 },
      hair: { style: 'bob', col: 0xd8b878, hi: 0xeed49a, dk: 0xb09050 },
      shirt: 0xf2eee8, tie: null, suit: 0x8a7a6e, suitHi: 0x9a8a7e, pants: 0x4a4440, skirt: true, legs: 0xdcb4a4, shoe: 0x1a1414
    },
    seated: {
      body: 'man', head: HEAD_M, skin: 0xd8a890, face: { kind: 'man', brow: 0x4a3a2c, down: true },
      hair: { style: 'part', col: 0x9a8a78, hi: 0xb4a490, dk: 0x7a6a58 },
      shirt: 0xe8ecf0, tie: 0x2a3050, tieDk: 0x1a2038, suit: 0x30343e, suitHi: 0x40444e, pants: 0x30343e, shoe: 0x141416, prop: 'folder'
    }
  };

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

  function headPt(H, yaw, pit, inf) {
    const cx = S(yaw) * C(pit), cy = S(pit), cz = C(yaw) * C(pit);
    let x = cx * H.rx, y = cy * H.ry, z = cz * H.rz;
    if (cy < 0) {
      const q = -cy;
      x *= 1 - H.jaw * q * q + (H.gonion || 0) * Math.max(0, 1 - Math.abs(q - 0.55) / 0.3) * Math.max(0, Math.abs(cx) - 0.3);
      if (z > 0) z *= 1 - H.chinIn * q * q * (1 - 0.6 * Math.abs(S(yaw)));
      else z *= 1 - 0.35 * q * q;
      y *= 1 + H.chinDrop * q;
    }
    if (z < 0) z *= H.back;
    if (z > 0) {
      const brow = Math.max(0, 1 - Math.abs(cy - 0.27) / 0.16) * Math.max(0, 1 - Math.abs(cx) / 0.62);
      z += brow * H.brow;
      const cheek = Math.max(0, 1 - Math.abs(cy + 0.06) / 0.26) * Math.max(0, 1 - Math.abs(Math.abs(cx) - 0.74) / 0.24);
      x *= 1 + cheek * H.cheek;
    }
    return [x * inf, y * inf, z * inf];
  }

  function headVert(H, yaw, pit, inf) {
    const e = 0.002;
    const p = headPt(H, yaw, pit, inf);
    const dy = V3.sub(headPt(H, yaw + e, pit, inf), headPt(H, yaw - e, pit, inf));
    const dp = V3.sub(headPt(H, yaw, Math.min(pit + e, PI / 2), inf), headPt(H, yaw, Math.max(pit - e, -PI / 2), inf));
    const n = V3.cross(dy, dp);
    return { p, n: V3.len(n) > 1e-9 ? V3.norm(n) : V3.norm(p) };
  }

  function headPatch(b, H, inf, y0, y1, p0, p1, nu, nv, colAt, uvs) {
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yA = lerp(y0, y1, u0), yB = lerp(y0, y1, u1), pA = lerp(p0, p1, v0), pB = lerp(p0, p1, v1);
        const a = headVert(H, yA, pA, inf), bb = headVert(H, yB, pA, inf), c = headVert(H, yB, pB, inf), d = headVert(H, yA, pB, inf);
        const col = typeof colAt === 'function' ? [colAt(yA, pA), colAt(yB, pA), colAt(yB, pB), colAt(yA, pB)] : colAt;
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [[u0 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v1 * uvs[1]], [u0 * uvs[0], v1 * uvs[1]]] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
  }

  function angOf(H, x, y) {
    let yaw = Math.asin(clamp(x / H.rx, -0.98, 0.98));
    let pit = Math.asin(clamp(y / H.ry, -0.98, 0.98));
    for (let k = 0; k < 10; k++) {
      const p = headPt(H, yaw, pit, 1);
      const e = 1e-4;
      const px = headPt(H, yaw + e, pit, 1), pp = headPt(H, yaw, pit + e, 1);
      const a = (px[0] - p[0]) / e, bq = (pp[0] - p[0]) / e, c = (px[1] - p[1]) / e, d = (pp[1] - p[1]) / e;
      const det = a * d - bq * c;
      if (Math.abs(det) < 1e-12) break;
      const ex = x - p[0], ey = y - p[1];
      yaw += (d * ex - bq * ey) / det;
      pit += (-c * ex + a * ey) / det;
    }
    return [yaw, pit];
  }

  function faceMapper(H, w, h) {
    return (x, y) => {
      const [yaw, pit] = angOf(H, x, y);
      return [((yaw - FP[0]) / (FP[1] - FP[0])) * w, ((FP[3] - pit) / (FP[3] - FP[2])) * h];
    };
  }

  function curve(ctx, P, pts) {
    const q = pts.map(p => P(p[0], p[1]));
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length - 1; i++) {
      const mx = (q[i][0] + q[i + 1][0]) / 2, my = (q[i][1] + q[i + 1][1]) / 2;
      ctx.quadraticCurveTo(q[i][0], q[i][1], i === q.length - 2 ? q[i + 1][0] : mx, i === q.length - 2 ? q[i + 1][1] : my);
    }
    if (q.length === 2) ctx.lineTo(q[1][0], q[1][1]);
  }

  function drawFace(look, eyes) {
    const H = look.head, F = look.face, skin = look.skin;
    const bat = F.kind === 'bateman';
    const woman = F.kind === 'woman';
    return (ctx, w, h) => {
      const P = faceMapper(H, w, h);
      const px = w / ((FP[1] - FP[0]) * H.rx);
      ctx.fillStyle = hex(skin);
      ctx.fillRect(0, 0, w, h);
      const cx = P(0, -0.02)[0];
      soft(ctx, cx, P(0, 0.06)[1], px * 0.05, px * 0.03, 0xffffff, 0.08);
      [-1, 1].forEach(s => {
        const ck = P(s * 0.045, -0.025);
        soft(ctx, ck[0], ck[1], px * 0.022, px * 0.016, woman ? 0xd07a6a : 0xb86a58, woman ? 0.22 : 0.12);
        const hol = P(s * 0.052, -0.055);
        soft(ctx, hol[0], hol[1], px * 0.02, px * 0.024, 0x6a3a2c, bat ? 0.09 : 0.05);
        const sock = P(s * 0.031, 0.011);
        soft(ctx, sock[0], sock[1], px * 0.025, px * 0.015, 0x4a2418, bat ? 0.46 : 0.2);
        const temple = P(s * 0.062, 0.02);
        soft(ctx, temple[0], temple[1], px * 0.02, px * 0.03, 0x6a4030, 0.1);
      });
      const jawSh = P(0, -0.11);
      soft(ctx, jawSh[0], jawSh[1], px * 0.07, px * 0.02, 0x5a3428, bat ? 0.2 : 0.1);
      const edge = ctx.createLinearGradient(0, 0, w, 0);
      edge.addColorStop(0, rgba(0x4a2a20, bat ? 0.4 : 0.25));
      edge.addColorStop(0.22, rgba(0x4a2a20, 0));
      edge.addColorStop(0.78, rgba(0x4a2a20, 0));
      edge.addColorStop(1, rgba(0x4a2a20, bat ? 0.4 : 0.25));
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, h);
      if (bat) {
        [-1, 1].forEach(s => {
          const cb = P(s * 0.05, -0.012);
          soft(ctx, cb[0], cb[1], px * 0.016, px * 0.01, 0xe8b89c, 0.18);
          const hol2 = P(s * 0.047, -0.072);
          soft(ctx, hol2[0], hol2[1], px * 0.018, px * 0.03, 0x5a3024, 0.12);
        });
        const nb = P(0, -0.004);
        soft(ctx, nb[0], nb[1], px * 0.006, px * 0.02, 0xf0c8b0, 0.2);
      }
      soft(ctx, cx, P(0, -0.073)[1], px * 0.018, px * 0.006, 0x5a3028, 0.25);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(0x6a3a2c, bat ? 0.22 : 0.16);
      ctx.lineWidth = px * 0.0035;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        curve(ctx, P, [[s * 0.009, 0.006], [s * 0.011, -0.014], [s * 0.012, -0.028]]);
        ctx.stroke();
      });
      [-1, 1].forEach(s => {
        ctx.fillStyle = rgba(0x4a2018, 0.7);
        const n = P(s * 0.009, -0.037);
        ctx.beginPath();
        ctx.ellipse(n[0], n[1], px * 0.0055, px * 0.0028, s * 0.3, 0, PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = rgba(0x6a3a2c, bat ? 0.12 : 0.08);
      ctx.lineWidth = px * 0.0024;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        curve(ctx, P, [[s * 0.016, -0.034], [s * 0.026, -0.048], [s * 0.029, -0.064]]);
        ctx.stroke();
      });

      const browY = bat ? 0.021 : 0.024;
      ctx.strokeStyle = hex(F.brow);
      [-1, 1].forEach(s => {
        ctx.lineWidth = px * (woman ? 0.0035 : bat ? 0.0063 : 0.0055);
        ctx.beginPath();
        if (bat) curve(ctx, P, [[s * 0.011, browY - 0.002], [s * 0.03, browY + 0.003], [s * 0.054, browY - 0.002]]);
        else if (F.kind === 'grin') curve(ctx, P, [[s * 0.012, browY + 0.002], [s * 0.032, browY + 0.007], [s * 0.052, browY + 0.002]]);
        else curve(ctx, P, [[s * 0.012, browY], [s * 0.032, browY + 0.005], [s * 0.052, browY + 0.001]]);
        ctx.stroke();
      });

      const ey = 0.006;
      [-1, 1].forEach(s => {
        const inner = [s * 0.015, ey - 0.001], outer = [s * 0.046, ey + 0.002];
        if (eyes === 'shut' || (F.kind === 'grin' && eyes !== 'open')) {
          ctx.strokeStyle = rgba(0x2a1810, 0.9);
          ctx.lineWidth = px * 0.0026;
          ctx.beginPath();
          curve(ctx, P, [inner, [s * 0.031, ey - 0.003], outer]);
          ctx.stroke();
          return;
        }
        const open = F.down ? 0.0035 : F.kind === 'grin' ? 0.004 : bat ? 0.0053 : 0.0058;
        const openK = eyes === 'half' ? 0.55 : 1;
        const top = ey + open * openK, bot = ey - open * 0.75 * openK;
        ctx.fillStyle = '#e6ddd4';
        ctx.beginPath();
        curve(ctx, P, [inner, [s * 0.027, top + 0.0012], [s * 0.038, top], outer]);
        curve(ctx, P, [outer, [s * 0.031, bot], inner]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        const ir = P(s * 0.03, ey + (F.down ? -0.002 : 0));
        ctx.fillStyle = bat ? '#4c3a2c' : woman ? '#5a7a8a' : '#4a3a30';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * (bat ? 0.0063 : 0.0058), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#100a08';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * 0.0026, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,24,16,0.35)';
        ctx.fillRect(0, P(0, top)[1] - px * 0.004, w, px * 0.0045);
        ctx.restore();
        ctx.strokeStyle = '#1e120c';
        ctx.lineWidth = px * (bat ? 0.0034 : woman ? 0.003 : 0.0026);
        ctx.beginPath();
        curve(ctx, P, [[s * 0.013, ey - 0.0005], [s * 0.027, top + 0.0014], [s * 0.039, top + 0.0004], [s * 0.048, ey + 0.0015]]);
        ctx.stroke();
        ctx.strokeStyle = rgba(0x3a2218, 0.55);
        ctx.lineWidth = px * 0.0016;
        ctx.beginPath();
        curve(ctx, P, [outer, [s * 0.031, bot - 0.0006], inner]);
        ctx.stroke();
        if (bat) {
          ctx.strokeStyle = rgba(0x6a3a2a, 0.35);
          ctx.lineWidth = px * 0.0022;
          ctx.beginPath();
          curve(ctx, P, [[s * 0.016, top + 0.0045], [s * 0.031, top + 0.006], [s * 0.044, top + 0.004]]);
          ctx.stroke();
        }
      });

      const my = woman ? -0.056 : -0.059;
      if (F.kind === 'grin') {
        ctx.fillStyle = '#3a1612';
        ctx.beginPath();
        curve(ctx, P, [[-0.027, my + 0.004], [0, my + 0.002], [0.027, my + 0.004]]);
        curve(ctx, P, [[0.027, my + 0.004], [0, my - 0.012], [-0.027, my + 0.004]]);
        ctx.fill();
        ctx.fillStyle = '#ece6de';
        ctx.beginPath();
        curve(ctx, P, [[-0.022, my + 0.003], [0, my + 0.0015], [0.022, my + 0.003]]);
        curve(ctx, P, [[0.022, my + 0.003], [0, my - 0.004], [-0.022, my + 0.003]]);
        ctx.fill();
        ctx.strokeStyle = rgba(0x7a3a30, 0.6);
        ctx.lineWidth = px * 0.0025;
        [-1, 1].forEach(s => {
          ctx.beginPath();
          curve(ctx, P, [[s * 0.027, my + 0.005], [s * 0.031, my + 0.002]]);
          ctx.stroke();
        });
      } else {
        const half = woman ? 0.021 : 0.024;
        ctx.fillStyle = woman ? '#b4544e' : bat ? '#a3604f' : '#a46658';
        ctx.beginPath();
        curve(ctx, P, [[-half, my], [-0.008, my + 0.0055], [0, my + 0.0042], [0.008, my + 0.0055], [half, my]]);
        curve(ctx, P, [[half, my], [0, my - (bat ? 0.0095 : 0.0075)], [-half, my]]);
        ctx.fill();
        ctx.strokeStyle = bat ? '#4a221c' : '#5a2a22';
        ctx.lineWidth = px * (bat ? 0.0026 : 0.002);
        ctx.beginPath();
        curve(ctx, P, [[-half, my + 0.0004], [0, my - 0.0004], [half, my + 0.0004]]);
        ctx.stroke();
        soft(ctx, P(0, my - 0.011)[0], P(0, my - 0.011)[1], px * 0.014, px * 0.004, 0x5a3028, 0.25);
      }
      if (bat) {
        const ch = P(0, -0.106);
        soft(ctx, ch[0], ch[1], px * 0.012, px * 0.009, 0xffffff, 0.08);
      }
    };
  }

  function hairLower(style, yaw) {
    const a = Math.abs(yaw);
    if (style === 'bob') {
      if (a < 0.5) return 0.58;
      if (a < 1.1) return lerp(0.58, -0.3, (a - 0.5) / 0.6);
      return lerp(-0.3, -0.95, clamp((a - 1.1) / 1.2, 0, 1));
    }
    const slick = style === 'slick';
    const front = slick ? 0.74 : 0.64;
    if (a < 0.5) return front + (style === 'part' ? 0.03 * S(yaw * 3) : 0) - 0.03 * a;
    if (a < 1.15) return lerp(front - 0.015, slick ? 0.34 : 0.32, (a - 0.5) / 0.65);
    if (a < 1.4) return lerp(slick ? 0.34 : 0.32, slick ? 0.1 : 0.22, (a - 1.15) / 0.25);
    if (a < 1.85) return lerp(slick ? 0.1 : 0.22, -0.04, (a - 1.4) / 0.45);
    return lerp(-0.02, slick ? -0.78 : -0.55, clamp((a - 1.85) / 1.0, 0, 1));
  }

  function hairThick(style, yaw, pit, lo) {
    const a = Math.abs(yaw);
    const v = clamp((pit - lo) / Math.max(0.05, PI / 2 - lo), 0, 1);
    const front = Math.max(0, C(yaw));
    const side = Math.max(0, 1 - Math.abs(a - 1.55) / 0.5) * (pit < 0.75 ? 1 : 0);
    const edge = clamp(v / 0.12, 0, 1);
    if (style === 'bob') return 0.006 + 0.012 * edge + 0.004 * Math.max(0, S(pit));
    if (style === 'slick') {
      const part = 1 - 0.35 * Math.max(0, 1 - Math.abs(yaw - 0.12) / 0.1) * (v < 0.7 ? 1 : 0);
      const lift = 0.016 * front * front * Math.max(0, S(PI * clamp(v / 0.55, 0, 1))) * part;
      const back = a > 2.0 ? 0.012 + 0.008 * clamp((-pit) / 0.7, 0, 1) : 0;
      return (0.004 + 0.013 * edge + lift + back) * (1 - 0.2 * side);
    }
    return (0.004 + 0.01 * edge + 0.008 * front * Math.max(0, S(PI * clamp(v / 0.6, 0, 1)))) * (1 - 0.3 * side);
  }

  function hairPt(H, style, yaw, pit, extra) {
    const lo = hairLower(style, yaw);
    const base = headPt(H, yaw, pit, 1);
    const r = Math.hypot(base[0], base[1], base[2]) || 1;
    const k = 1 + (hairThick(style, yaw, pit, lo) + (extra || 0)) / r;
    return [base[0] * k, base[1] * k, base[2] * k];
  }

  function hairTex(hair) {
    return (ctx, w, h) => {
      const g = rand(hair.col & 0xffff);
      ctx.fillStyle = hex(hair.col);
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = g() * w;
        const lw = 0.6 + g() * 1.8;
        const c = g() < 0.5 ? hair.hi : hair.dk;
        ctx.strokeStyle = rgba(c, 0.35 + g() * 0.4);
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (g() - 0.5) * 6, h * 0.33, x + (g() - 0.5) * 6, h * 0.66, x + (g() - 0.5) * 8, h);
        ctx.stroke();
      }
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(255,255,255,0.05)');
      gr.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    };
  }

  function buildHair(b, H, hair) {
    const nu = 36, nv = 10;
    const st = hair.style;
    const vert = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const lo = hairLower(st, yaw);
      const pit = lo + (PI / 2 - lo) * (j / nv);
      const flick = j === 0 && Math.abs(yaw) > 2.1 && st !== 'bob' ? 0.008 : 0;
      return { p: hairPt(H, st, yaw, pit, flick), uv: [(i / nu) * 6, j / nv] };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const A = vert(i, j), B = vert(i + 1, j), Cc = vert(i + 1, j + 1), Dd = vert(i, j + 1);
        b.quad(A.p, B.p, Cc.p, Dd.p, [1, 1, 1, 0], [A.uv, B.uv, Cc.uv, Dd.uv]);
      }
    }
    for (let i = 0; i < nu; i++) {
      const yaw0 = -PI + (i / nu) * 2 * PI, yaw1 = -PI + ((i + 1) / nu) * 2 * PI;
      const lo0 = hairLower(st, yaw0), lo1 = hairLower(st, yaw1);
      const A = vert(i, 0), B = vert(i + 1, 0);
      b.quad(headPt(H, yaw0, lo0, 0.995), headPt(H, yaw1, lo1, 0.995), B.p, A.p, [0.85, 0.85, 0.85, 0], [[(i / nu) * 6, 0], [((i + 1) / nu) * 6, 0], B.uv, A.uv]);
    }
  }

  function buildHead(b, look) {
    const H = look.head, hair = look.hair;
    const skin = rgb(look.skin);
    const dark = rgb(hair.dk);
    headPatch(b, H, 1, -PI, PI, -PI / 2, PI / 2, 26, 18, (yaw, pit) => (pit > hairLower(hair.style, yaw) + 0.05 ? dark : skin));
    const woman = look.face.kind === 'woman';
    const zAt = (x, y) => { const [yaw, pit] = angOf(H, x, y); return headPt(H, yaw, pit, 1.004)[2]; };
    const pro = woman ? 0.01 : 0.012;
    const P = {
      top: [0, 0.01, zAt(0, 0.01) + 0.001],
      bl: [0.0065, 0.0, zAt(0.0065, 0.0) - 0.0005],
      br: [-0.0065, 0.0, zAt(-0.0065, 0.0) - 0.0005],
      tip: [0, -0.029, zAt(0, -0.029) + pro],
      wl: [0.0115, -0.034, zAt(0.0115, -0.034) + 0.0015],
      wr: [-0.0115, -0.034, zAt(-0.0115, -0.034) + 0.0015],
      col: [0, -0.038, zAt(0, -0.038) + pro * 0.45]
    };
    const n = {
      top: V3.norm([0, 0.3, 1]), tip: V3.norm([0, -0.2, 1]), col: V3.norm([0, -0.8, 0.6]),
      bl: V3.norm([0.7, 0.1, 0.7]), br: V3.norm([-0.7, 0.1, 0.7]), wl: V3.norm([0.6, -0.4, 0.7]), wr: V3.norm([-0.6, -0.4, 0.7])
    };
    const c0 = shade(look.skin, 1.02), c1 = shade(look.skin, 1.0);
    const tri = (a, c, d) => b.tri(P[a], P[c], P[d], [c0, c1, c1], null, [n[a], n[c], n[d]]);
    tri('top', 'br', 'tip');
    tri('top', 'tip', 'bl');
    tri('br', 'wr', 'tip');
    tri('bl', 'tip', 'wl');
    tri('tip', 'wr', 'col');
    tri('tip', 'col', 'wl');
    [-1, 1].forEach(sd => {
      const ep = headPt(H, sd * 1.57, 0.0, 1);
      b.at(ep[0] + sd * 0.004, ep[1] - 0.004, ep[2] - 0.004, h => h.ellipsoid(0.011, 0.027, 0.018, 6, 5, shade(look.skin, 0.94)));
    });
  }

  function buildPhones(b, look) {
    const H = look.head, st = look.hair.style;
    const band = [];
    const N = 16;
    for (let i = 0; i <= N; i++) {
      const th = -PI / 2 + (i / N) * PI;
      const yaw = th < 0 ? -PI / 2 : PI / 2;
      const pit = PI / 2 - Math.abs(th);
      const q = hairPt(H, st, yaw === -PI / 2 ? -1.62 : 1.62, Math.min(pit, 1.5), 0.0035);
      band.push([q[0], q[1], q[2] - 0.006]);
    }
    band[0] = [-(H.rx + 0.026), 0.012, -0.008];
    band[N] = [H.rx + 0.026, 0.012, -0.008];
    K.tube(b, band, band.map(() => 0.0034), 5, 0x3a3c40);
    [-1, 1].forEach(sd => {
      const x = sd * (H.rx + 0.018);
      b.push(M4.translate(x, -0.008, -0.004), M4.rotZ(PI / 2));
      b.prism(12, 0.027, 0.027, -0.011, 0.027, 0.027, 0.011, 0x141416, { capBottom: true });
      b.at(0, sd * 0.012, 0, h => h.prism(12, 0.016, 0.016, -0.002, 0.016, 0.016, 0.002, 0x2c2e32, { capBottom: true }));
      b.pop();
      b.at(sd * (H.rx + 0.024), 0.016, -0.008, h => h.box(0.007, 0.02, 0.009, 0x5a5c62));
    });
  }

  function buildGlasses(b, H) {
    const zf = headPt(H, 0, 0.06, 1)[2] + 0.012;
    [-1, 1].forEach(s => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * PI * 2;
        pts.push([s * 0.031 + C(a) * 0.017, 0.006 + S(a) * 0.012, zf - Math.abs(s * 0.031 + C(a) * 0.017) * 0.18]);
      }
      K.tube(b, pts, pts.map(() => 0.0016), 4, 0x2a2420);
      const side = headPt(H, s * 1.35, 0.06, 1.02);
      K.tube(b, [[s * 0.048, 0.008, zf - 0.009], side], [0.0016, 0.0016], 4, 0x2a2420);
    });
    K.tube(b, [[-0.014, 0.008, zf], [0.014, 0.008, zf]], [0.0016, 0.0016], 4, 0x2a2420);
  }

  function rowAt(rows, y) {
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i], c = rows[i + 1];
      if (y <= c[0]) {
        const k = clamp((y - a[0]) / (c[0] - a[0]), 0, 1);
        return [y, lerp(a[1], c[1], k), lerp(a[2], c[2], k), lerp(a[3], c[3], k)];
      }
    }
    return rows[rows.length - 1].slice();
  }

  function shellPt(r, a, add) {
    return [S(a) * (r[1] + add), r[0], r[3] + C(a) * (r[2] + add)];
  }

  function openAng(r, ox, add) {
    return Math.asin(clamp(ox / (r[1] + add), 0, 0.995));
  }

  function shell(b, rows, add, openX, col, nu, yFrom, yTo) {
    const ys = [];
    for (let y = yFrom; y < yTo - 1e-6; y += 0.04) ys.push(y);
    ys.push(yTo);
    for (let j = 0; j < ys.length - 1; j++) {
      const r0 = rowAt(rows, ys[j]), r1 = rowAt(rows, ys[j + 1]);
      const o0 = openAng(r0, openX(ys[j]), add), o1 = openAng(r1, openX(ys[j + 1]), add);
      for (let i = 0; i < nu; i++) {
        const a = (o, u) => o + (PI * 2 - 2 * o) * u;
        const A = shellPt(r0, a(o0, i / nu), add), B = shellPt(r0, a(o0, (i + 1) / nu), add);
        const Cc = shellPt(r1, a(o1, (i + 1) / nu), add), Dd = shellPt(r1, a(o1, i / nu), add);
        b.quad(A, B, Cc, Dd, typeof col === 'function' ? col(i, j) : col);
      }
    }
  }

  function lapel(b, rows, add, openX, width, col, yFrom, yTo, lift) {
    const ys = [];
    for (let y = yFrom; y < yTo - 1e-6; y += 0.03) ys.push(y);
    ys.push(yTo);
    [-1, 1].forEach(s => {
      for (let j = 0; j < ys.length - 1; j++) {
        const y0 = ys[j], y1 = ys[j + 1];
        const r0 = rowAt(rows, y0), r1 = rowAt(rows, y1);
        const in0 = openAng(r0, openX(y0), add), in1 = openAng(r1, openX(y1), add);
        const out0 = openAng(r0, openX(y0) + width(y0), add), out1 = openAng(r1, openX(y1) + width(y1), add);
        const p = (r, a, l) => { const q = shellPt(r, s * a, add + l); return q; };
        const A = p(r0, in0, lift * 1.6), B = p(r0, out0, lift), Cc = p(r1, out1, lift), Dd = p(r1, in1, lift * 1.6);
        if (s > 0) b.quad(A, B, Cc, Dd, col); else b.quad(B, A, Dd, Cc, col);
      }
    });
  }

  function lerpKeys(keys) {
    return (y) => {
      if (y <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        if (y <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (y - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
      }
      return keys[keys.length - 1][1];
    };
  }

  const COAT_OPEN = lerpKeys([[-0.2, 0.09], [0.0, 0.075], [0.16, 0.072], [0.3, 0.078], [0.37, 0.072]]);
  const COAT_LAPEL = lerpKeys([[-0.08, 0.0], [0.04, 0.045], [0.17, 0.088], [0.23, 0.074], [0.25, 0.04], [0.27, 0.066], [0.31, 0.05], [0.34, 0.0]]);
  const JACKET_OPEN = lerpKeys([[-0.2, 0.0], [-0.09, 0.0], [0.02, 0.03], [0.2, 0.042], [0.34, 0.048], [0.37, 0.05]]);
  const JACKET_LAPEL = lerpKeys([[-0.09, 0.0], [0.08, 0.036], [0.22, 0.05], [0.25, 0.028], [0.27, 0.042], [0.33, 0.0]]);
  const WOMAN_OPEN = lerpKeys([[-0.2, 0.0], [-0.05, 0.0], [0.12, 0.04], [0.3, 0.055], [0.37, 0.055]]);

  function coatRows(look, add) {
    const pad = look.coat ? 0.05 : 0.016;
    return TORSO.map(([y, rx, rz, cz]) => {
      const sh = Math.max(0, 1 - Math.abs(y - 0.265) / 0.085);
      return [y, rx + add + pad * sh, rz + add, cz];
    });
  }

  function collarBand(b, from, lo, hi, col) {
    const N = 12;
    for (let i = 0; i < N; i++) {
      const a0 = from + (PI * 2 - 2 * from) * (i / N), a1 = from + (PI * 2 - 2 * from) * ((i + 1) / N);
      const p = (q, a) => [S(a) * q[0], q[3], q[2] + C(a) * q[1]];
      b.quad(p(lo, a0), p(lo, a1), p(hi, a1), p(hi, a0), col);
    }
  }

  function buildTorso(b, look) {
    const woman = BODY[look.body] === BODY.woman;
    const rows = woman ? TORSO.map(([y, rx, rz, cz]) => [y, rx * 0.9, rz * (y > 0 && y < 0.22 ? 1.06 : 0.92), cz + (y > 0.02 && y < 0.2 ? 0.01 : 0)]) : TORSO;
    loft(b, rows.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, y > 0.355 ? look.skin : look.shirt)), 16, { capBottom: true });
    const front = (y) => { const r = rowAt(rows, y); return r[3] + r[2]; };
    if (look.tie) {
      const ty = [0.345, 0.315, 0.22, 0.1, -0.02, -0.14];
      const tw = [0.02, 0.017, 0.026, 0.033, 0.039, 0.042];
      for (let i = 0; i < ty.length - 1; i++) {
        const z0 = front(ty[i]) + 0.007, z1 = front(ty[i + 1]) + 0.007;
        const c = i === 0 ? look.tieDk : look.tie;
        b.quad([-tw[i], ty[i], z0], [tw[i], ty[i], z0], [tw[i + 1], ty[i + 1], z1], [-tw[i + 1], ty[i + 1], z1], c);
      }
      for (let k = 0; k < 7; k++) {
        const y = 0.27 - k * 0.055, z = front(y) + 0.0085, x = ((k % 2) ? 0.008 : -0.008);
        b.quad([x - 0.007, y, z], [x + 0.007, y, z], [x + 0.007, y - 0.012, z], [x - 0.007, y - 0.012, z], look.tieDk);
      }
      b.at(0, 0.35, front(0.35) + 0.01, h => h.box(0.04, 0.034, 0.018, look.tie));
    }
    const collarZ = front(0.34);
    [-1, 1].forEach(s => {
      b.tri([s * 0.018, 0.365, collarZ + 0.004], [s * 0.066, 0.352, collarZ - 0.03], [s * 0.046, 0.29, collarZ + 0.012], look.shirt);
      b.tri([s * 0.018, 0.365, collarZ + 0.004], [s * 0.046, 0.29, collarZ + 0.012], [s * 0.024, 0.315, collarZ + 0.014], shade(look.shirt, 0.92));
    });
    loft(b, [ring(0.34, 0.072, 0.064, 0.0, look.shirt), ring(0.39, 0.068, 0.06, 0.0, look.shirt)], 12);
    if (look.suit) {
      const jr = coatRows(look, 0.014);
      const open = woman ? WOMAN_OPEN : JACKET_OPEN;
      shell(b, jr, 0, open, look.suit, 20, -0.2, 0.36);
      lapel(b, jr, 0, open, woman ? lerpKeys([[-0.05, 0], [0.12, 0.03], [0.3, 0.035], [0.34, 0]]) : JACKET_LAPEL, look.suitHi, -0.09, 0.335, 0.004);
      collarBand(b, 1.0, [0.098, 0.08, -0.012, 0.33], [0.088, 0.072, -0.02, 0.4], look.suitHi);
    }
    if (look.coat) {
      const cr = coatRows(look, 0.058);
      shell(b, cr, 0, COAT_OPEN, look.coat.col, 22, -0.2, 0.37);
      lapel(b, cr, 0, COAT_OPEN, COAT_LAPEL, look.coat.hi, -0.08, 0.34, 0.006);
      collarBand(b, 0.95, [0.114, 0.092, -0.012, 0.33], [0.108, 0.088, -0.03, 0.405], look.coat.hi);
    }
  }

  function buildPelvis(b, look) {
    const P = look.pants;
    loft(b, [
      ring(-0.13, 0.15, 0.11, -0.005, P),
      ring(-0.06, 0.175, 0.125, -0.01, P),
      ring(0.04, 0.172, 0.122, 0.0, P),
      ring(0.14, 0.168, 0.118, 0.004, look.shirt)
    ], 14, { capBottom: true });
    const woman = BODY[look.body] === BODY.woman;
    if (look.skirt) {
      loft(b, [
        ring(0.14, 0.17, 0.122, 0.004, look.suit),
        ring(0.0, 0.19, 0.135, 0.0, look.suit),
        ring(-0.2, 0.19, 0.14, 0.0, look.suit),
        ring(-0.42, 0.17, 0.13, 0.0, look.suit)
      ], 16, { capBottom: false });
    } else if (look.suit && !look.coat) {
      const rows = [[-0.2, 0.19, 0.135, 0.0], [0.0, 0.188, 0.134, 0.0], [0.14, 0.184, 0.132, 0.004]];
      shell(b, rows, 0, lerpKeys([[-0.2, 0.06], [-0.08, 0.02], [0.14, 0.0]]), look.suit, 18, -0.2, 0.14);
    }
    if (look.coat && look.coat.long) {
      const rows = [[-0.56, 0.235, 0.18, -0.025], [-0.35, 0.22, 0.17, -0.02], [-0.15, 0.21, 0.158, -0.012], [0.0, 0.2, 0.15, -0.006], [0.14, 0.2, 0.15, 0.0]];
      shell(b, rows, 0, lerpKeys([[-0.56, 0.16], [-0.2, 0.1], [0.14, 0.085]]), look.coat.col, 22, -0.56, 0.14);
    }
  }

  function buildUpper(b, look, D) {
    const col = look.coat ? look.coat.col : look.suit || look.shirt;
    const k = look.body === 'woman' ? 0.85 : look.coat ? 1.2 : 1;
    b.ellipsoid(0.075 * k, 0.07, 0.072 * k, 8, 5, col);
    loft(b, [ring(-D.upper - 0.01, 0.052 * k, 0.05 * k, 0, col), ring(-D.upper * 0.58, 0.058 * k, 0.056 * k, 0, col), ring(-0.04, 0.066 * k, 0.064 * k, 0, col), ring(0.03, 0.07 * k, 0.066 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFore(b, look, D) {
    const col = look.coat ? look.coat.col : look.suit || look.shirt;
    const k = look.body === 'woman' ? 0.85 : look.coat ? 1.1 : 1;
    b.ellipsoid(0.054 * k, 0.05, 0.052 * k, 8, 4, col);
    loft(b, [ring(-D.fore + 0.02, 0.046 * k, 0.044 * k, 0, col), ring(-D.fore * 0.45, 0.05 * k, 0.048 * k, 0, col), ring(0.0, 0.054 * k, 0.052 * k, 0, col)], 10, { capBottom: false });
    loft(b, [ring(-D.fore - 0.005, 0.036 * k, 0.034 * k, 0, look.shirt), ring(-D.fore + 0.03, 0.038 * k, 0.036 * k, 0, look.shirt)], 8, { capBottom: false });
  }

  function buildHand(b, look, side, grip) {
    const sk = look.skin;
    const inward = side === 'L' ? -1 : 1;
    if (grip === 'fist') {
      b.at(0, -0.05, 0.004, h => h.box(0.036, 0.08, 0.075, sk));
      b.at(inward * 0.008, -0.095, 0.012, h => h.box(0.03, 0.03, 0.068, shade(sk, 0.94)));
      b.at(inward * 0.02, -0.06, 0.04, h => h.box(0.018, 0.04, 0.02, shade(sk, 0.96)));
      return;
    }
    if (grip === 'folder') {
      b.at(0, -0.05, 0, h => h.box(0.03, 0.085, 0.078, sk));
      b.at(inward * -0.004, -0.11, 0.0, h => h.box(0.022, 0.05, 0.07, shade(sk, 0.95)));
      return;
    }
    b.at(0, -0.05, 0, h => h.box(0.032, 0.088, 0.08, sk));
    b.at(0, -0.115, 0.004, h => h.box(0.026, 0.05, 0.072, shade(sk, 0.95)));
    b.push(M4.translate(inward * 0.01, -0.035, 0.045), M4.rotX(-0.45));
    b.at(0, -0.022, 0, h => h.box(0.02, 0.046, 0.02, sk));
    b.pop();
  }

  function buildThigh(b, look, D) {
    const P = look.skirt ? look.legs : look.pants;
    const r = look.skirt ? 0.82 : 1;
    loft(b, [ring(-D.thigh - 0.02, 0.06 * r, 0.058 * r, 0.0, P), ring(-0.3, 0.07 * r, 0.068 * r, 0.0, P), ring(-0.1, 0.082 * r, 0.08 * r, 0.006, P), ring(0.05, 0.088 * r, 0.085 * r, 0.0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, look, D) {
    const P = look.skirt ? look.legs : look.pants;
    const r = look.skirt ? 0.78 : 1;
    b.ellipsoid(0.062 * r, 0.05, 0.06 * r, 8, 4, P);
    loft(b, [ring(-D.shin + 0.02, 0.05 * r, 0.048 * r, 0.0, P), ring(-0.25, 0.054 * r, 0.056 * r, -0.006, P), ring(-0.1, 0.058 * r, 0.058 * r, 0.0, P), ring(0.0, 0.06 * r, 0.058 * r, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b, look) {
    const sh = look.shoe;
    if (look.skirt) {
      b.at(0, -0.035, 0.05, h => h.box(0.07, 0.04, 0.2, sh));
      b.at(0, -0.06, -0.035, h => h.box(0.02, 0.05, 0.02, sh));
      return;
    }
    b.at(0, -0.035, 0.0, h => h.ellipsoid(0.05, 0.04, 0.06, 8, 4, sh));
    b.at(0, -0.052, 0.07, h => h.box(0.1, 0.055, 0.27, sh));
    b.at(0, -0.075, 0.07, h => h.box(0.104, 0.012, 0.275, 0x060606));
    b.at(0, -0.035, 0.17, h => h.ellipsoid(0.05, 0.03, 0.05, 7, 3, shade(sh, 1.4)));
  }

  function buildBriefcase(b) {
    b.box(0.09, 0.31, 0.43, 0x2a1c14, { base: false });
    b.at(0, 0.0, 0, h => h.box(0.094, 0.012, 0.434, 0x1c120c));
    b.at(0, 0.158, 0, h => h.box(0.03, 0.012, 0.13, 0x18100a));
    [-0.075, 0.075].forEach(z => {
      b.at(0, 0.17, z, h => h.box(0.02, 0.03, 0.02, 0x18100a));
      b.at(0.048, 0.12, z * 1.6, h => h.box(0.006, 0.02, 0.03, 0xb8a060));
    });
    b.at(0, 0.19, 0, h => h.box(0.024, 0.02, 0.16, 0x1c120c));
  }

  function buildFolder(b) {
    b.box(0.24, 0.31, 0.012, 0x16161a);
    b.at(0, 0, 0.007, h => h.box(0.22, 0.29, 0.004, 0xeceae2));
  }

  function build(r) {
    const unitCyl = mesh(r, b => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.quad([C(a0), 0, S(a0)], [C(a1), 0, S(a1)], [C(a1), 1, S(a1)], [C(a0), 1, S(a0)], 0x9a9a94, null, [[C(a0), 0, S(a0)], [C(a1), 0, S(a1)], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)]]);
      }
    });
    const out = { unitCyl, looks: {} };
    Object.entries(LOOKS).forEach(([key, look]) => {
      const D = BODY[look.body];
      const faces = {};
      const size = key === 'bateman' ? 512 : 256;
      ['open', 'half', 'shut'].forEach(e => { faces[e] = r.texture(size, drawFace(look, e), { clamp: true }); });
      const hands = {};
      ['L', 'R'].forEach(s => ['relax', 'fist', 'folder'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, look, s, g)); }));
      out.looks[key] = {
        look,
        D,
        faces,
        torso: mesh(r, b => buildTorso(b, look)),
        pelvis: mesh(r, b => buildPelvis(b, look)),
        neck: mesh(r, b => loft(b, [ring(-0.06, 0.062, 0.058, 0.004, look.skin), ring(0.06, 0.057, 0.055, 0.012, look.skin), ring(0.17, 0.055, 0.052, 0.0, look.skin)], 10)),
        head: mesh(r, b => buildHead(b, look)),
        face: mesh(r, b => headPatch(b, look.head, 1.004, FP[0], FP[1], FP[2], FP[3], 16, 14, [1, 1, 1, 0], [1, 1])),
        hair: mesh(r, b => buildHair(b, look.head, look.hair)),
        phones: look.phones ? mesh(r, b => buildPhones(b, look)) : null,
        hairTex: r.texture(128, hairTex(look.hair)),
        glasses: look.face.glasses ? mesh(r, b => buildGlasses(b, look.head)) : null,
        upper: mesh(r, b => buildUpper(b, look, D)),
        fore: mesh(r, b => buildFore(b, look, D)),
        hands,
        thigh: mesh(r, b => buildThigh(b, look, D)),
        shin: mesh(r, b => buildShin(b, look, D)),
        foot: mesh(r, b => buildFoot(b, look)),
        briefcase: look.prop === 'briefcase' ? mesh(r, buildBriefcase) : null,
        folder: look.prop === 'folder' ? mesh(r, buildFolder) : null
      };
    });
    return out;
  }

  function solve(who, pose) {
    return Rig.solve(pose, BODY[LOOKS[who].body]);
  }

  function segment(r, unitCyl, a, c, rad, pass) {
    const d = V3.sub(c, a);
    const len = V3.len(d);
    if (len < 1e-5) return;
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, [0, 0, 1]);
    if (V3.len(x) < 1e-3) x = V3.cross(y, [1, 0, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const m = new Float32Array([x[0] * rad, x[1] * rad, x[2] * rad, 0, d[0], d[1], d[2], 0, z[0] * rad, z[1] * rad, z[2] * rad, 0, a[0], a[1], a[2], 1]);
    r.draw(unitCyl, m, pass);
  }

  function bez(a, b, c, d, t) {
    const u = 1 - t;
    return [0, 1, 2].map(i => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]);
  }

  function drawWires(r, P, m, look, pass) {
    const H = look.head;
    const pts = [];
    [-1, 1].forEach(s => {
      const top = M4.point(m.head, [s * (H.rx * 1.2), -0.04, -0.004]);
      const mid = M4.point(m.head, [s * 0.05, -0.16, 0.03]);
      const collar = M4.point(m.chest, [s * 0.035, 0.33, 0.08]);
      const join = M4.point(m.chest, [s * 0.004, 0.25, 0.128]);
      const N = 7;
      let prev = top;
      for (let i = 1; i <= N; i++) {
        const q = bez(top, mid, collar, join, i / N);
        segment(r, P.unitCyl, prev, q, 0.0012, pass);
        prev = q;
      }
      pts.push(join);
    });
    const low = M4.point(m.chest, [0.006, 0.12, 0.138]);
    segment(r, P.unitCyl, pts[0], low, 0.0016, pass);
    segment(r, P.unitCyl, pts[1], low, 0.0016, pass);
  }

  function draw(r0, P, who, m, pose, opts) {
    const o = opts || {};
    const r = o.pre ? { draw: (mesh, M, ps) => r0.draw(mesh, M4.mul(o.pre, M), ps) } : r0;
    const L = P.looks[who];
    const look = L.look;
    const pass = {};
    if (o.alpha !== undefined && o.alpha < 1) { pass.blend = true; pass.alpha = o.alpha; }
    if (o.tint) pass.tint = o.tint;
    if (o.noCookie) pass.noCookie = true;
    if (o.flat) { pass.flat = o.flat; pass.shadow = true; }
    const sc = BODY[look.body].k;
    const body = M4.scale(look.body === 'woman' ? 0.95 : 1, 1, 1);
    r.draw(L.pelvis, M4.mul(m.pelvis, body), pass);
    r.draw(L.torso, M4.mul(m.chest, body), pass);
    r.draw(L.neck, m.neck, pass);
    const hm = M4.chain(m.head, M4.scale(sc > 0.95 ? 1 : 0.97));
    r.draw(L.head, hm, pass);
    r.draw(L.face, hm, Object.assign({ texture: L.faces[pose.eyes || 'open'] || L.faces.open }, pass));
    r.draw(L.hair, hm, Object.assign({ texture: L.hairTex }, pass));
    if (L.phones) r.draw(L.phones, hm, pass);
    if (L.glasses) r.draw(L.glasses, hm, pass);
    if (look.phones && !o.noWires) drawWires(r, P, m, look, pass);
    ['L', 'R'].forEach(s => {
      r.draw(L.upper, m['upper' + s], pass);
      r.draw(L.fore, m['fore' + s], pass);
      const g = pose['g' + s] || 'relax';
      r.draw(L.hands[s + g] || L.hands[s + 'relax'], m['hand' + s], pass);
      if (!o.noLegs) {
        r.draw(L.thigh, m['thigh' + s], pass);
        r.draw(L.shin, m['shin' + s], pass);
        r.draw(L.foot, m['foot' + s], pass);
      }
    });
    const f = V3.norm([m.pelvis[8], 0, m.pelvis[10]]);
    const x = [f[2], 0, -f[0]];
    if (L.briefcase && pose.case) {
      const w = m.pts['wrist' + pose.case];
      const swing = pose.caseSwing || 0;
      const M = M4.chain(new Float32Array([x[0], 0, x[2], 0, 0, 1, 0, 0, f[0], 0, f[2], 0, w[0], w[1] - 0.29, w[2], 1]), M4.rotX(swing));
      r.draw(L.briefcase, M, pass);
    }
    if (L.folder && pose.folder) {
      const a = m.pts.wristL, c = m.pts.wristR;
      const mid = V3.lerp(a, c, 0.5);
      const M = M4.chain(new Float32Array([x[0], 0, x[2], 0, 0, 1, 0, 0, f[0], 0, f[2], 0, mid[0], mid[1], mid[2], 1]), M4.translate(0, 0.02, 0.06), M4.rotX(-(pose.folderTilt === undefined ? 1.0 : pose.folderTilt)));
      r.draw(L.folder, M, pass);
    }
  }

  window.YegudCast = { BODY, LOOKS, FP, headPt, angOf, build, solve, draw };
})();
