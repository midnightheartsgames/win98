(function () {
  const { M4, V3, rgb, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const BODY = {
    harry: { hipX: 0.1, hipY: -0.04, thigh: 0.44, shin: 0.42, chestY: 0.2, neckY: 0.33, shX: 0.19, shY: 0.26, upper: 0.29, fore: 0.26, headY: 0.19, w: 1 },
    herm: { hipX: 0.095, hipY: -0.04, thigh: 0.42, shin: 0.4, chestY: 0.18, neckY: 0.31, shX: 0.165, shY: 0.24, upper: 0.27, fore: 0.24, headY: 0.175, w: 0.9 },
    ron: { hipX: 0.1, hipY: -0.04, thigh: 0.47, shin: 0.45, chestY: 0.22, neckY: 0.35, shX: 0.205, shY: 0.275, upper: 0.31, fore: 0.28, headY: 0.2, w: 1.04 },
    volde: { hipX: 0.1, hipY: -0.04, thigh: 0.47, shin: 0.46, chestY: 0.22, neckY: 0.3, shX: 0.205, shY: 0.27, upper: 0.31, fore: 0.28, headY: 0.175, w: 1.02 },
    reader: { hipX: 0.1, hipY: -0.04, thigh: 0.44, shin: 0.42, chestY: 0.2, neckY: 0.33, shX: 0.19, shY: 0.26, upper: 0.29, fore: 0.26, headY: 0.19, w: 1 }
  };

  const TORSO = [
    [-0.2, 0.165, 0.115, 0.0],
    [-0.1, 0.168, 0.118, 0.004],
    [0.0, 0.176, 0.122, 0.008],
    [0.1, 0.186, 0.126, 0.01],
    [0.18, 0.196, 0.124, 0.008],
    [0.25, 0.204, 0.114, 0.003],
    [0.3, 0.192, 0.1, -0.004],
    [0.335, 0.145, 0.082, -0.008],
    [0.36, 0.082, 0.066, -0.004],
    [0.38, 0.064, 0.058, 0.0]
  ];

  const HEAD_M = { rx: 0.071, ry: 0.105, rz: 0.096, jaw: 0.08, chinIn: 0.06, chinDrop: 0.09, back: 1.06, brow: 0.006, cheek: 0.03, gonion: 0.12 };
  const HEAD_W = { rx: 0.069, ry: 0.101, rz: 0.09, jaw: 0.3, chinIn: 0.1, chinDrop: 0.08, back: 1.05, brow: 0.003, cheek: 0.03, gonion: 0.0 };
  const HEAD_V = { rx: 0.077, ry: 0.106, rz: 0.099, jaw: 0.16, chinIn: 0.08, chinDrop: 0.06, back: 1.12, brow: 0.012, cheek: 0.05, gonion: 0.1 };
  const FP = [-1.2, 1.2, -1.25, 0.8];

  const LOOKS = {
    harry: {
      body: 'harry', head: HEAD_M, skin: 0xe9c4ae, face: { kind: 'harry', brow: 0x3a2618, iris: '#5a5a3a' },
      hair: { style: 'shag', col: 0x3c2a1e, hi: 0x5a4030, dk: 0x2a1c12 },
      shirt: 0x4a1820, tie: [0x8c1a22, 0xc89a34], robe: { col: 0x151517, hi: 0x222226, lining: 0xa81e26 },
      pants: 0x1a1a1e, shoe: 0x101012, glasses: 'round', hat: true
    },
    herm: {
      body: 'herm', head: HEAD_W, skin: 0xf0c8b0, face: { kind: 'herm', brow: 0x8a6a40, iris: '#6a7a7a' },
      hair: { style: 'curls', col: 0xc4a46e, hi: 0xeedcae, dk: 0x86663e },
      shirt: 0xeeece6, vest: 0x6c6e72, tie: [0x8c1a22, 0xc89a34], robe: { col: 0x141416, hi: 0x202024, lining: 0xa81e26 },
      pants: 0x232328, skirt: true, legs: 0x2a2a2e, shoe: 0x101012, glasses: 'big', earrings: 0xff4f9e
    },
    ron: {
      body: 'ron', head: HEAD_M, skin: 0xeec8b2, face: { kind: 'ron', brow: 0x9a5a32, iris: '#5a7088' },
      hair: { style: 'short', col: 0x9a5a34, hi: 0xc07a48, dk: 0x6a3a20 },
      shirt: 0x6e7076, robe: { col: 0x141416, hi: 0x212125, lining: 0x2a2a2e }, scarf: [0x5e1420, 0xd6a63a],
      pants: 0x1c1c20, shoe: 0x101012
    },
    volde: {
      body: 'volde', head: HEAD_V, skin: 0x959ca2, face: { kind: 'volde', brow: 0x6a7076, iris: '#2a2c30' },
      hair: null, shirt: 0x1b2030, buttons: true, pants: 0x17181c, shoe: 0x0c0c0e
    },
    reader: {
      body: 'reader', head: HEAD_M, skin: 0xe2b89e, face: { kind: 'reader', brow: 0x2a1c14, iris: '#3a2c22' },
      hair: { style: 'short', col: 0x2c2018, hi: 0x44342a, dk: 0x1c140e },
      shirt: 0xe8e6e0, tie: [0x8c1a22, 0xc89a34], robe: { col: 0x161618, hi: 0x232327, lining: 0xa81e26 },
      pants: 0x1c1c20, shoe: 0x101012
    }
  };

  const EYES = ['open', 'half', 'shut'];
  const MOUTHS = ['shut', 'open', 'wide', 'smile'];

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
      x *= 1 - H.jaw * q * q + H.gonion * Math.max(0, 1 - Math.abs(q - 0.55) / 0.3) * Math.max(0, Math.abs(cx) - 0.3);
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

  function voldeSkin(ctx, w, h, P, px) {
    const g = rand(77);
    for (let i = 0; i < 420; i++) {
      const x = (g() - 0.5) * 0.16, y = (g() - 0.5) * 0.24;
      const p = P(x, y);
      soft(ctx, p[0], p[1], px * (0.004 + g() * 0.016), px * (0.003 + g() * 0.012), g() < 0.6 ? 0x3c4248 : 0xd0d6dc, 0.14 + g() * 0.2);
    }
    [-1, 1].forEach(s => {
      const sock = P(s * 0.031, 0.008);
      soft(ctx, sock[0], sock[1], px * 0.026, px * 0.017, 0x23272c, 0.45);
      const cheek = P(s * 0.05, -0.035);
      soft(ctx, cheek[0], cheek[1], px * 0.018, px * 0.03, 0x2c3238, 0.45);
      const temple = P(s * 0.062, 0.03);
      soft(ctx, temple[0], temple[1], px * 0.016, px * 0.03, 0x30363c, 0.35);
    });
    const nose = P(0, -0.02);
    soft(ctx, nose[0], nose[1], px * 0.016, px * 0.03, 0x262a30, 0.45);
    const brow = P(0, 0.03);
    soft(ctx, brow[0], brow[1], px * 0.05, px * 0.012, 0xd4dadf, 0.35);
    ctx.strokeStyle = 'rgba(36,40,46,0.28)';
    ctx.lineWidth = px * 0.0018;
    [[0.064, 0.01, 0.003], [0.055, 0.02, -0.002], [0.047, 0.03, 0.004]].forEach(([y, wd, w2]) => {
      ctx.beginPath();
      curve(ctx, P, [[-wd - 0.014, y + w2], [-0.01, y + 0.003], [0.008, y - w2], [wd + 0.012, y + 0.002]]);
      ctx.stroke();
    });
    [-1, 1].forEach(s => {
      ctx.beginPath();
      curve(ctx, P, [[s * 0.022, -0.03], [s * 0.038, -0.058], [s * 0.036, -0.085]]);
      ctx.stroke();
      ctx.beginPath();
      curve(ctx, P, [[s * 0.05, -0.008], [s * 0.059, -0.04], [s * 0.054, -0.072]]);
      ctx.stroke();
      ctx.beginPath();
      curve(ctx, P, [[s * 0.016, 0.018], [s * 0.03, 0.024], [s * 0.046, 0.017]]);
      ctx.stroke();
    });
  }

  function drawFace(look, eyes, mouth) {
    const H = look.head, F = look.face, skin = look.skin;
    const kind = F.kind;
    const woman = kind === 'herm';
    const volde = kind === 'volde';
    return (ctx, w, h) => {
      const P = faceMapper(H, w, h);
      const px = w / ((FP[1] - FP[0]) * H.rx);
      ctx.fillStyle = hex(skin);
      ctx.fillRect(0, 0, w, h);
      const cx = P(0, -0.02)[0];
      if (volde) voldeSkin(ctx, w, h, P, px);
      [-1, 1].forEach(s => {
        const ck = P(s * 0.045, -0.025);
        if (!volde) soft(ctx, ck[0], ck[1], px * 0.024, px * 0.017, woman ? 0xe08070 : 0xd08070, woman ? 0.26 : 0.16);
        const sock = P(s * 0.031, 0.011);
        soft(ctx, sock[0], sock[1], px * (volde ? 0.03 : 0.025), px * (volde ? 0.02 : 0.015), volde ? 0x2a2e34 : 0x6a3a2a, volde ? 0.55 : 0.16);
        const hol = P(s * 0.05, -0.05);
        soft(ctx, hol[0], hol[1], px * 0.02, px * 0.026, volde ? 0x3a4046 : 0x8a5040, volde ? 0.5 : 0.06);
      });
      const edge = ctx.createLinearGradient(0, 0, w, 0);
      edge.addColorStop(0, rgba(volde ? 0x3a4046 : 0x7a4a3a, 0.25));
      edge.addColorStop(0.22, rgba(0x7a4a3a, 0));
      edge.addColorStop(0.78, rgba(0x7a4a3a, 0));
      edge.addColorStop(1, rgba(volde ? 0x3a4046 : 0x7a4a3a, 0.25));
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, h);
      if (kind === 'ron') {
        const g = rand(5);
        for (let i = 0; i < 40; i++) {
          const p = P((g() - 0.5) * 0.09, -0.01 - g() * 0.035);
          soft(ctx, p[0], p[1], px * 0.0025, px * 0.0025, 0xa05a30, 0.35);
        }
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (volde) {
        soft(ctx, cx, P(0, -0.02)[1], px * 0.02, px * 0.028, 0x5a6066, 0.35);
        [-1, 1].forEach(s => {
          ctx.fillStyle = '#16181c';
          const n = P(s * 0.008, -0.034);
          ctx.beginPath();
          ctx.ellipse(n[0], n[1], px * 0.0035, px * 0.009, s * 0.5, 0, PI * 2);
          ctx.fill();
        });
      } else {
        ctx.strokeStyle = rgba(0x7a4a3a, 0.2);
        ctx.lineWidth = px * 0.0035;
        [-1, 1].forEach(s => {
          ctx.beginPath();
          curve(ctx, P, [[s * 0.009, 0.006], [s * 0.011, -0.014], [s * 0.012, -0.028]]);
          ctx.stroke();
          ctx.fillStyle = rgba(0x5a2a1e, 0.65);
          const n = P(s * 0.009, -0.037);
          ctx.beginPath();
          ctx.ellipse(n[0], n[1], px * 0.0055, px * 0.0028, s * 0.3, 0, PI * 2);
          ctx.fill();
        });
        soft(ctx, cx, P(0, -0.073)[1], px * 0.018, px * 0.006, 0x7a4a3a, 0.2);
      }

      if (!volde) {
        ctx.strokeStyle = hex(F.brow);
        [-1, 1].forEach(s => {
          ctx.lineWidth = px * (woman ? 0.0042 : 0.0058);
          ctx.beginPath();
          curve(ctx, P, [[s * 0.012, 0.024], [s * 0.032, 0.03], [s * 0.052, 0.025]]);
          ctx.stroke();
        });
      } else {
        ctx.strokeStyle = 'rgba(40,44,50,0.55)';
        ctx.lineWidth = px * 0.004;
        [-1, 1].forEach(s => {
          ctx.beginPath();
          curve(ctx, P, [[s * 0.012, 0.03], [s * 0.032, 0.036], [s * 0.054, 0.028]]);
          ctx.stroke();
        });
      }

      const ey = 0.006;
      [-1, 1].forEach(s => {
        const inner = [s * 0.015, ey - 0.001], outer = [s * 0.046, ey + 0.002];
        if (eyes === 'shut') {
          ctx.strokeStyle = volde ? 'rgba(14,16,20,0.9)' : rgba(0x2a1810, 0.9);
          ctx.lineWidth = px * 0.0028;
          ctx.beginPath();
          curve(ctx, P, [inner, [s * 0.031, ey - 0.003], outer]);
          ctx.stroke();
          return;
        }
        const open = volde ? 0.0045 : woman ? 0.0064 : 0.0058;
        const k = eyes === 'half' ? 0.5 : 1;
        const top = ey + open * k, bot = ey - open * 0.75 * k;
        ctx.fillStyle = volde ? '#7c7a72' : '#ece4dc';
        ctx.beginPath();
        curve(ctx, P, [inner, [s * 0.027, top + 0.0012], [s * 0.038, top], outer]);
        curve(ctx, P, [outer, [s * 0.031, bot], inner]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        const ir = P(s * 0.03, ey);
        ctx.fillStyle = F.iris;
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * (volde ? 0.0052 : 0.006), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0c0806';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * 0.0026, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,24,16,0.3)';
        ctx.fillRect(0, P(0, top)[1] - px * 0.004, w, px * 0.0045);
        ctx.restore();
        ctx.strokeStyle = volde ? '#0e1014' : '#1e120c';
        ctx.lineWidth = px * (woman ? 0.0042 : 0.0028);
        ctx.beginPath();
        curve(ctx, P, [[s * 0.013, ey - 0.0005], [s * 0.027, top + 0.0014], [s * 0.039, top + 0.0004], [s * 0.048, ey + 0.0015]]);
        ctx.stroke();
        if (woman) {
          ctx.lineWidth = px * 0.0018;
          for (let i = 0; i < 4; i++) {
            const a = P(s * (0.03 + i * 0.005), top + 0.0005);
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(a[0] + s * px * 0.003, a[1] - px * 0.004);
            ctx.stroke();
          }
        }
      });

      const my = woman ? -0.056 : -0.059;
      const lip = volde ? '#7c7a86' : woman ? '#c0525a' : '#b26a5e';
      const half = woman ? 0.021 : 0.024;
      if (mouth === 'shut' || mouth === 'smile') {
        const curl = mouth === 'smile' ? 0.006 : 0;
        ctx.fillStyle = lip;
        ctx.beginPath();
        curve(ctx, P, [[-half, my + curl], [-0.008, my + 0.0055], [0, my + 0.0042], [0.008, my + 0.0055], [half, my + curl]]);
        curve(ctx, P, [[half, my + curl], [0, my - (woman ? 0.009 : 0.0072)], [-half, my + curl]]);
        ctx.fill();
        ctx.strokeStyle = volde ? '#3a3a44' : '#5a2a22';
        ctx.lineWidth = px * 0.0022;
        ctx.beginPath();
        curve(ctx, P, [[-half, my + 0.0004 + curl], [0, my - 0.0006 - curl * 0.4], [half, my + 0.0004 + curl]]);
        ctx.stroke();
        if (mouth === 'smile') {
          ctx.fillStyle = '#efe8de';
          ctx.beginPath();
          curve(ctx, P, [[-half * 0.8, my + curl * 0.8], [0, my - 0.0045], [half * 0.8, my + curl * 0.8]]);
          curve(ctx, P, [[half * 0.8, my + curl * 0.8], [0, my + 0.001], [-half * 0.8, my + curl * 0.8]]);
          ctx.fill();
        }
      } else {
        const open = mouth === 'wide' ? 0.017 : 0.009;
        const wd = mouth === 'wide' ? half * 0.95 : half * 0.82;
        ctx.fillStyle = lip;
        ctx.beginPath();
        curve(ctx, P, [[-wd - 0.003, my], [0, my + 0.007], [wd + 0.003, my]]);
        curve(ctx, P, [[wd + 0.003, my], [0, my - open - 0.006], [-wd - 0.003, my]]);
        ctx.fill();
        ctx.fillStyle = '#2a0e0c';
        ctx.beginPath();
        curve(ctx, P, [[-wd, my], [0, my + 0.0035], [wd, my]]);
        curve(ctx, P, [[wd, my], [0, my - open], [-wd, my]]);
        ctx.fill();
        ctx.fillStyle = '#e8e0d4';
        ctx.beginPath();
        curve(ctx, P, [[-wd * 0.8, my + 0.0015], [0, my + 0.0032], [wd * 0.8, my + 0.0015]]);
        curve(ctx, P, [[wd * 0.8, my + 0.0015], [0, my - 0.0012], [-wd * 0.8, my + 0.0015]]);
        ctx.fill();
        if (mouth === 'wide') soft(ctx, P(0, my - open * 0.6)[0], P(0, my - open * 0.6)[1], px * 0.008, px * 0.004, 0xa04a4a, 0.6);
      }
    };
  }

  function hairLower(style, yaw) {
    const a = Math.abs(yaw);
    if (style === 'shag') {
      const jag = 0.06 * S(yaw * 13) + 0.03 * S(yaw * 29);
      if (a < 0.5) return 0.5 + jag * 0.3;
      if (a < 1.25) return lerp(0.5, -0.3, (a - 0.5) / 0.75) + jag;
      return lerp(-0.3, -0.7, clamp((a - 1.25) / 1.2, 0, 1)) + jag;
    }
    if (style === 'curls') {
      if (a < 0.5) return 0.62;
      if (a < 1.0) return lerp(0.62, 0.2, (a - 0.5) / 0.5);
      if (a < 1.35) return lerp(0.2, -0.9, (a - 1.0) / 0.35);
      return lerp(-0.9, -2.05, clamp((a - 1.35) / 0.4, 0, 1));
    }
    if (a < 0.5) return 0.66 + 0.03 * S(yaw * 3);
    if (a < 1.15) return lerp(0.64, 0.3, (a - 0.5) / 0.65);
    if (a < 1.6) return lerp(0.3, 0.12, (a - 1.15) / 0.45);
    return lerp(0.1, -0.45, clamp((a - 1.6) / 1.2, 0, 1));
  }

  function hairThick(style, yaw, pit, lo) {
    const v = clamp((pit - lo) / Math.max(0.05, PI / 2 - lo), 0, 1);
    const edge = clamp(v / 0.12, 0, 1);
    const front = Math.max(0, C(yaw));
    if (style === 'shag') return 0.008 + 0.012 * edge + 0.006 * front * Math.max(0, S(PI * clamp(v / 0.5, 0, 1))) + 0.006 * Math.max(0, -C(yaw));
    if (style === 'curls') {
      const a = Math.abs(yaw);
      const bump = 0.012 * (S(yaw * 11 + pit * 7) * 0.5 + S(yaw * 17 - pit * 13) * 0.5);
      const grow = clamp((a - 0.95) / 0.9, 0, 1);
      const low = clamp((-pit - 0.2) / 1.4, 0, 1);
      const top = clamp((pit - 0.3) / 1.0, 0, 1);
      return 0.008 + 0.01 * edge + (0.07 + 0.05 * low) * grow * edge + 0.022 * top + bump * (0.3 + grow);
    }
    return 0.004 + 0.012 * edge + 0.006 * front * Math.max(0, S(PI * clamp(v / 0.6, 0, 1)));
  }

  function hairPt(H, style, yaw, pit, extra) {
    const lo = hairLower(style, yaw);
    const base = headPt(H, yaw, Math.max(pit, -1.2), 1);
    if (pit < -1.2) {
      const hang = -1.2 - pit;
      const a = Math.abs(yaw);
      base[1] -= hang * 0.42;
      base[0] *= 1 + hang * 0.55;
      base[2] += hang * (a < 2.1 ? 0.08 * clamp((a - 1.0) / 0.5, 0, 1) : -0.05);
    }
    const th = hairThick(style, yaw, pit, lo) + (extra || 0);
    if (style === 'curls') {
      const a = Math.abs(yaw), sg = yaw < 0 ? -1 : 1;
      const dy = yaw + sg * 0.75 * clamp((1.9 - a) / 0.9, 0, 1);
      const cp = C(Math.max(pit, -1.2)), sp = S(Math.max(pit, -1.2));
      return [base[0] + S(dy) * cp * th, base[1] + Math.max(0, sp) * th, base[2] + C(dy) * cp * th];
    }
    const r = Math.hypot(base[0], base[1], base[2]) || 1;
    const k = 1 + th / r;
    return [base[0] * k, base[1] * k, base[2] * k];
  }

  function hairTex(hair, curls) {
    return (ctx, w, h) => {
      const g = rand(hair.col & 0xffff);
      ctx.fillStyle = hex(hair.col);
      ctx.fillRect(0, 0, w, h);
      if (curls) {
        for (let i = 0; i < 420; i++) {
          const x = g() * w, y = g() * h, rr = 2 + g() * 6;
          ctx.strokeStyle = rgba(g() < 0.5 ? hair.hi : hair.dk, 0.35 + g() * 0.45);
          ctx.lineWidth = 0.8 + g() * 1.6;
          ctx.beginPath();
          ctx.arc(x, y, rr, g() * PI * 2, g() * PI * 2 + PI * 1.3);
          ctx.stroke();
        }
        return;
      }
      for (let i = 0; i < 260; i++) {
        const x = g() * w;
        ctx.strokeStyle = rgba(g() < 0.5 ? hair.hi : hair.dk, 0.35 + g() * 0.4);
        ctx.lineWidth = 0.6 + g() * 1.8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (g() - 0.5) * 6, h * 0.33, x + (g() - 0.5) * 6, h * 0.66, x + (g() - 0.5) * 8, h);
        ctx.stroke();
      }
    };
  }

  function buildHair(b, H, hair) {
    const st = hair.style;
    const nu = st === 'curls' ? 48 : 36, nv = st === 'curls' ? 18 : 10;
    const vert = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const lo = hairLower(st, yaw);
      const pit = lo + (PI / 2 - lo) * (j / nv);
      return { p: hairPt(H, st, yaw, pit, 0), uv: [(i / nu) * 6, (j / nv) * 3] };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const A = vert(i, j), B = vert(i + 1, j), Cc = vert(i + 1, j + 1), Dd = vert(i, j + 1);
        b.quad(A.p, B.p, Cc.p, Dd.p, [1, 1, 1, 0], [A.uv, B.uv, Cc.uv, Dd.uv]);
      }
    }
    for (let i = 0; i < nu; i++) {
      const A = vert(i, 0), B = vert(i + 1, 0);
      const inA = [A.p[0] * 0.9, A.p[1], A.p[2] * 0.9], inB = [B.p[0] * 0.9, B.p[1], B.p[2] * 0.9];
      b.quad(inA, inB, B.p, A.p, [0.8, 0.8, 0.8, 0], [[(i / nu) * 6, 0], [((i + 1) / nu) * 6, 0], B.uv, A.uv]);
    }
    if (st === 'shag') {
      const g = rand(41);
      const strand = (yaw, pit0, len, w, out) => {
        const pts = [];
        for (let k = 0; k <= 4; k++) {
          const u = k / 4;
          const pit = pit0 - len * u;
          const q = hairPt(H, st, yaw + (g() - 0.5) * 0.04, pit, out * u + 0.002);
          pts.push(q);
        }
        for (let k = 0; k < 4; k++) {
          const a = pts[k], c = pts[k + 1];
          const t0 = V3.norm(V3.cross(V3.sub(c, a), a));
          const w0 = w * (1 - k / 4), w1 = w * (1 - (k + 1) / 4) + 0.001;
          b.quad(V3.sub(a, V3.mul(t0, w0)), V3.add(a, V3.mul(t0, w0)), V3.add(c, V3.mul(t0, w1)), V3.sub(c, V3.mul(t0, w1)), [1, 1, 1, 0], [[0, k / 4], [0.3, k / 4], [0.3, (k + 1) / 4], [0, (k + 1) / 4]]);
        }
      };
      for (let i = 0; i < 30; i++) {
        const yaw = -PI + (i / 30) * 2 * PI + (g() - 0.5) * 0.1;
        if (Math.abs(yaw) < 0.55) continue;
        const lo = hairLower(st, yaw);
        strand(yaw, lo + 0.35, 0.35 + g() * 0.3, 0.012 + g() * 0.006, 0.012);
      }
      [-1, 1].forEach(sd => {
        for (let i = 0; i < 5; i++) {
          const yaw = sd * (0.06 + i * 0.11);
          strand(yaw, 1.05, 0.62 + g() * 0.12 - i * 0.03, 0.014, 0.006 + i * 0.002);
        }
      });
    }
  }

  function buildHead(b, look) {
    const H = look.head, hair = look.hair;
    const skin = rgb(look.skin);
    const dark = hair ? rgb(hair.dk) : skin;
    headPatch(b, H, 1, -PI, PI, -PI / 2, PI / 2, 26, 18, (yaw, pit) => (hair && pit > hairLower(hair.style, yaw) + 0.05 ? dark : skin));
    const volde = look.face.kind === 'volde';
    const zAt = (x, y) => { const [yaw, pit] = angOf(H, x, y); return headPt(H, yaw, pit, 1.004)[2]; };
    const pro = volde ? 0.004 : look.face.kind === 'herm' ? 0.01 : 0.013;
    const P = {
      top: [0, 0.01, zAt(0, 0.01) + 0.001],
      bl: [0.0065, 0.0, zAt(0.0065, 0.0) - 0.0005],
      br: [-0.0065, 0.0, zAt(-0.0065, 0.0) - 0.0005],
      tip: [0, -0.029, zAt(0, -0.029) + pro],
      wl: [volde ? 0.014 : 0.0115, -0.034, zAt(0.0115, -0.034) + 0.0015],
      wr: [volde ? -0.014 : -0.0115, -0.034, zAt(-0.0115, -0.034) + 0.0015],
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
      b.at(ep[0] + sd * 0.004, ep[1] - 0.004, ep[2] - 0.004, h => h.ellipsoid(0.011, 0.027, 0.018, 6, 5, shade(look.skin, 0.93)));
    });
  }

  function buildGlasses(b, H, kind) {
    const zf = headPt(H, 0, 0.06, 1)[2] + (kind === 'big' ? 0.016 : 0.012);
    const big = kind === 'big';
    const col = big ? 0x0c0c0e : 0x5a5650;
    const rad = big ? 0.0035 : 0.0013;
    [-1, 1].forEach(s => {
      const pts = [];
      const cxo = big ? 0.036 : 0.031, rx = big ? 0.03 : 0.0185, ry = big ? 0.025 : 0.0175;
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * PI * 2;
        const sq = big ? 0.82 : 1;
        const ca = C(a), sa = S(a);
        const qx = Math.sign(ca) * Math.pow(Math.abs(ca), sq), qy = Math.sign(sa) * Math.pow(Math.abs(sa), sq);
        pts.push([s * cxo + qx * rx, 0.006 + qy * ry, zf - Math.abs(s * cxo + qx * rx) * 0.16]);
      }
      K.tube(b, pts, pts.map(() => rad), big ? 6 : 4, col);
      const hinge = [s * (cxo + rx), 0.012, zf - (cxo + rx) * 0.16];
      const side = headPt(H, s * 1.4, 0.07, 1.02);
      K.tube(b, [hinge, side], [rad * (big ? 1.3 : 1), rad], 4, col);
      if (big) {
        [0.3, 0.55].forEach(k => {
          const p = V3.lerp(hinge, side, k);
          b.push(M4.translate(p[0] + s * 0.004, p[1], p[2]), M4.rotY(s * PI / 2));
          K.discXY(b, 0, 0, 0, 0.0055, 10, [0.95, 0.93, 0.85, 0.3]);
          b.pop();
        });
      }
    });
    K.tube(b, [[-0.014, big ? 0.012 : 0.009, zf], [0, big ? 0.015 : 0.011, zf + 0.002], [0.014, big ? 0.012 : 0.009, zf]], [rad, rad, rad], 4, col);
  }

  function buildEarrings(b, H, col) {
    [-1, 1].forEach(s => {
      const ep = headPt(H, s * 1.57, -0.2, 1);
      const pts = [];
      const ph = 0.9;
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * PI * 2;
        const r = 0.032;
        pts.push([ep[0] + s * (0.016 + S(a) * r * S(ph)), ep[1] - 0.026 - r + C(a) * r, ep[2] + 0.004 + S(a) * r * C(ph)]);
      }
      K.tube(b, pts, pts.map(() => 0.0048), 6, [((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255, 0.3]);
    });
  }

  function buildHat(b, H) {
    const felt = [0.52, 0.39, 0.27, 0], under = [0.36, 0.26, 0.18, 0], hi = [0.6, 0.46, 0.33, 0];
    const y0 = H.ry * 0.6;
    const N = 30;
    const brimY = (a, rr) => {
      const out = clamp((rr - 0.095) / 0.085, 0, 1);
      const wave = 0.012 * S(a * 5 + 0.7) + 0.007 * S(a * 3 + 1.3);
      const front = C(a);
      const lift = front > 0 ? 0.03 * front * front : -0.035 * front * front;
      const side = -0.02 * Math.abs(S(a));
      return y0 + (wave + lift + side) * out;
    };
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
      const pt = (a, rr) => [S(a) * rr * 1.06, brimY(a, rr), C(a) * rr * 0.98 - 0.01];
      b.quad(pt(a0, 0.092), pt(a1, 0.092), pt(a1, 0.168), pt(a0, 0.168), felt);
      const dn = (p) => [p[0], p[1] - 0.004, p[2]];
      b.quad(dn(pt(a1, 0.092)), dn(pt(a0, 0.092)), dn(pt(a0, 0.168)), dn(pt(a1, 0.168)), under);
    }
    const rings = [];
    const L = 10;
    for (let j = 0; j <= L; j++) {
      const v = j / L;
      const rr = lerp(0.096, 0.02, Math.pow(v, 0.7));
      const bend = Math.pow(v, 1.6);
      rings.push({ y: y0 - 0.004 + v * 0.16 - bend * 0.03, cx: -bend * 0.04, cz: -bend * 0.13 - 0.012, rr, v });
    }
    for (let j = 0; j < L; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * PI * 2, a1 = ((i + 1) / 16) * PI * 2;
        const crease = (a, r) => 1 + 0.16 * S(a * 3 + r.v * 5) * (r.v > 0.15 ? 1 : 0.4) + 0.08 * S(a * 2 - r.v * 3);
        const p = (r, a) => [r.cx + S(a) * r.rr * crease(a, r) * 1.04, r.y, r.cz + C(a) * r.rr * crease(a, r)];
        const k = 0.85 + 0.15 * S(i * 1.7 + j);
        const col = j % 4 === 2 ? hi : [felt[0] * k, felt[1] * k, felt[2] * k, 0];
        b.quad(p(r0, a0), p(r0, a1), p(r1, a1), p(r1, a0), col);
      }
    }
    [-1, 1].forEach(s => {
      const pts = [[s * 0.086, y0 - 0.01, 0.012], [s * 0.094, y0 - 0.11, 0.024], [s * 0.09, y0 - 0.22, 0.04], [s * 0.08, y0 - 0.33, 0.05]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        b.quad([a[0] - 0.007, a[1], a[2]], [a[0] + 0.007, a[1], a[2]], [c[0] + 0.007, c[1], c[2]], [c[0] - 0.007, c[1], c[2]], under);
      }
    });
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

  function shell(b, rows, add, openX, col, nu, yFrom, yTo, inner) {
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
        b.quad(A, B, Cc, Dd, col);
        if (inner) {
          const sh = 0.004;
          const A2 = shellPt(r0, a(o0, i / nu), add - sh), B2 = shellPt(r0, a(o0, (i + 1) / nu), add - sh);
          const C2 = shellPt(r1, a(o1, (i + 1) / nu), add - sh), D2 = shellPt(r1, a(o1, i / nu), add - sh);
          b.quad(B2, A2, D2, C2, inner);
        }
      }
    }
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

  const ROBE_OPEN = lerpKeys([[-0.2, 0.11], [0.0, 0.1], [0.16, 0.09], [0.3, 0.075], [0.37, 0.07]]);

  function robeRows(add) {
    return TORSO.map(([y, rx, rz, cz]) => {
      const sh = Math.max(0, 1 - Math.abs(y - 0.265) / 0.085);
      return [y, rx + add + 0.02 * sh, rz + add, cz];
    });
  }

  function trimStrip(b, rows, add, openX, width, col, yFrom, yTo) {
    const ys = [];
    for (let y = yFrom; y < yTo - 1e-6; y += 0.03) ys.push(y);
    ys.push(yTo);
    [-1, 1].forEach(s => {
      for (let j = 0; j < ys.length - 1; j++) {
        const y0 = ys[j], y1 = ys[j + 1];
        const r0 = rowAt(rows, y0), r1 = rowAt(rows, y1);
        const in0 = openAng(r0, openX(y0), add), in1 = openAng(r1, openX(y1), add);
        const out0 = openAng(r0, openX(y0) + width, add), out1 = openAng(r1, openX(y1) + width, add);
        const p = (r, a, l) => shellPt(r, s * a, add + l);
        const A = p(r0, in0, 0.003), B = p(r0, out0, 0.003), Cc = p(r1, out1, 0.003), Dd = p(r1, in1, 0.003);
        if (s > 0) b.quad(A, B, Cc, Dd, col); else b.quad(B, A, Dd, Cc, col);
      }
    });
  }

  function tieQuads(b, front, cols) {
    const ty = [0.345, 0.315, 0.22, 0.1, -0.02, -0.12];
    const tw = [0.018, 0.016, 0.024, 0.03, 0.035, 0.038];
    for (let i = 0; i < ty.length - 1; i++) {
      const z0 = front(ty[i]) + 0.008, z1 = front(ty[i + 1]) + 0.008;
      const steps = 4;
      for (let k = 0; k < steps; k++) {
        const ya = lerp(ty[i], ty[i + 1], k / steps), yb = lerp(ty[i], ty[i + 1], (k + 1) / steps);
        const wa = lerp(tw[i], tw[i + 1], k / steps), wb = lerp(tw[i], tw[i + 1], (k + 1) / steps);
        const za = lerp(z0, z1, k / steps), zb = lerp(z0, z1, (k + 1) / steps);
        b.quad([-wa, ya, za], [wa, ya - 0.006, za], [wb, yb - 0.006, zb], [-wb, yb, zb], (i * steps + k) % 2 ? cols[1] : cols[0]);
      }
    }
    b.at(0, 0.352, front(0.352) + 0.011, h => h.box(0.036, 0.03, 0.016, cols[0]));
  }

  function buildTorso(b, look) {
    const D = BODY[look.body];
    const woman = look.body === 'herm';
    const rows = TORSO.map(([y, rx, rz, cz]) => [y, rx * D.w * (woman ? 0.92 : 1), rz * (woman && y > 0.02 && y < 0.24 ? 1.08 : 1), cz + (woman && y > 0.04 && y < 0.22 ? 0.012 : 0)]);
    const top = look.vest || look.shirt;
    loft(b, rows.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, y > 0.355 ? look.skin : y > 0.29 && look.vest ? look.shirt : top)), 16, { capBottom: true });
    const front = (y) => { const r = rowAt(rows, y); return r[3] + r[2]; };
    if (look.vest) {
      [-1, 1].forEach(s => b.tri([0, 0.2, front(0.2) + 0.004], [s * 0.07, 0.33, front(0.33) + 0.004], [s * 0.05, 0.33, front(0.33) + 0.006], look.shirt));
    }
    if (look.tie) tieQuads(b, front, look.tie);
    if (look.buttons) {
      for (let k = 0; k < 6; k++) {
        const y = 0.31 - k * 0.075;
        b.at(0.004, y, front(y) + 0.003, h => h.box(0.009, 0.009, 0.004, 0xd8dade));
      }
      b.quad([-0.003, 0.33, front(0.33) + 0.002], [0.003, 0.33, front(0.33) + 0.002], [0.003, -0.2, front(-0.2) + 0.002], [-0.003, -0.2, front(-0.2) + 0.002], shade(look.shirt, 0.7));
    }
    const collarZ = front(0.34);
    [-1, 1].forEach(s => {
      b.tri([s * 0.018, 0.37, collarZ + 0.004], [s * 0.07, 0.352, collarZ - 0.03], [s * 0.048, 0.29, collarZ + 0.012], look.shirt);
      b.tri([s * 0.018, 0.37, collarZ + 0.004], [s * 0.048, 0.29, collarZ + 0.012], [s * 0.024, 0.315, collarZ + 0.014], shade(look.shirt, 0.9));
    });
    loft(b, [ring(0.34, 0.072, 0.064, 0.0, look.shirt), ring(0.39, 0.068, 0.06, 0.0, look.shirt)], 12);
    if (look.buttons) {
      loft(b, [ring(0.35, 0.074, 0.068, 0.004, look.shirt), ring(0.43, 0.066, 0.062, 0.006, look.shirt)], 14);
      [-1, 1].forEach(s => b.tri([s * 0.012, 0.43, 0.07], [s * 0.075, 0.42, 0.02], [s * 0.05, 0.37, 0.075], shade(look.shirt, 1.15)));
    }
    if (look.robe) {
      const rr = robeRows(0.03);
      shell(b, rr, 0, ROBE_OPEN, look.robe.col, 22, -0.2, 0.37, look.robe.lining);
      trimStrip(b, rr, 0, ROBE_OPEN, 0.026, look.robe.lining, -0.2, 0.34);
      const hood = [];
      for (let i = 0; i <= 14; i++) {
        const a = 1.2 + (PI * 2 - 2.4) * (i / 14);
        hood.push([S(a) * 0.115, 0.365 + 0.012 * Math.max(0, -C(a)), -0.012 + C(a) * 0.095]);
      }
      K.tube(b, hood, hood.map((_, i) => 0.018 + 0.016 * S((i / 14) * PI)), 8, look.robe.hi);
    }
    if (look.scarf) {
      const [c0, c1] = look.scarf;
      const pts = [];
      const NS = 30;
      for (let i = 0; i <= NS; i++) {
        const a = (i / NS) * PI * 2;
        pts.push([S(a) * 0.082, 0.382 + 0.012 * C(a), 0.004 + C(a) * 0.074]);
      }
      for (let i = 0; i < NS; i++) K.tube(b, [pts[i], pts[i + 1]], [0.026, 0.026], 8, i % 3 === 2 ? c1 : c0);
      const hang = [[0.035, 0.36, front(0.36) + 0.03], [0.045, 0.24, front(0.24) + 0.04], [0.05, 0.1, front(0.1) + 0.04], [0.052, -0.02, front(-0.02) + 0.035]];
      const hang2 = [[-0.03, 0.36, front(0.36) + 0.025], [-0.05, 0.25, front(0.25) + 0.035], [-0.06, 0.13, front(0.13) + 0.035]];
      [hang, hang2].forEach(hp => {
        for (let i = 0; i < hp.length - 1; i++) {
          const a = hp[i], c = hp[i + 1];
          for (let k = 0; k < 3; k++) {
            const pa = V3.lerp(a, c, k / 3), pb = V3.lerp(a, c, (k + 1) / 3);
            b.quad([pa[0] - 0.04, pa[1], pa[2]], [pa[0] + 0.04, pa[1], pa[2]], [pb[0] + 0.04, pb[1], pb[2]], [pb[0] - 0.04, pb[1], pb[2]], (i * 3 + k) % 3 === 2 ? c1 : c0);
          }
        }
      });
    }
  }

  function buildPelvis(b, look, long) {
    const P = look.pants;
    const D = BODY[look.body];
    const w = D.w;
    loft(b, [
      ring(-0.13, 0.15 * w, 0.11, -0.005, P),
      ring(-0.06, 0.175 * w, 0.125, -0.01, P),
      ring(0.04, 0.172 * w, 0.122, 0.0, P),
      ring(0.14, 0.168 * w, 0.118, 0.004, look.vest || look.shirt)
    ], 14, { capBottom: true });
    if (look.skirt) {
      loft(b, [ring(0.12, 0.17, 0.124, 0.004, look.pants), ring(0.0, 0.19, 0.14, 0.0, look.pants), ring(-0.16, 0.2, 0.15, 0.0, look.pants)], 16);
    }
    if (look.robe) {
      const bottom = long ? -0.62 : -0.16;
      const rows = [[-0.62, 0.25, 0.2, -0.03], [-0.35, 0.23, 0.18, -0.02], [-0.15, 0.215, 0.162, -0.012], [0.0, 0.205, 0.152, -0.006], [0.14, 0.205, 0.15, 0.0]];
      const open = lerpKeys([[-0.62, 0.17], [-0.2, 0.12], [0.14, 0.11]]);
      shell(b, rows, 0, open, look.robe.col, 22, bottom, 0.14, look.robe.lining);
      trimStrip(b, rows, 0, open, 0.024, look.robe.lining, bottom, 0.14);
    }
  }

  function buildUpper(b, look, D) {
    const col = look.robe ? look.robe.col : look.shirt;
    const k = look.robe ? 1.18 : 1;
    b.ellipsoid(0.074 * k, 0.07, 0.072 * k, 8, 5, col);
    loft(b, [ring(-D.upper - 0.01, 0.054 * k, 0.052 * k, 0, col), ring(-D.upper * 0.58, 0.058 * k, 0.056 * k, 0, col), ring(-0.04, 0.066 * k, 0.064 * k, 0, col), ring(0.03, 0.07 * k, 0.066 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFore(b, look, D) {
    if (look.robe) {
      const col = look.robe.col;
      b.ellipsoid(0.06, 0.055, 0.058, 8, 4, col);
      loft(b, [ring(-D.fore + 0.03, 0.085, 0.08, 0.01, col), ring(-D.fore * 0.5, 0.068, 0.064, 0.004, col), ring(0.0, 0.06, 0.058, 0, col)], 12, { capBottom: false });
      loft(b, [ring(-D.fore + 0.03, 0.08, 0.075, 0.01, look.robe.lining), ring(-D.fore * 0.6, 0.06, 0.057, 0.004, look.robe.lining)], 12, { capBottom: false });
      loft(b, [ring(-D.fore - 0.005, 0.036, 0.034, 0, look.shirt), ring(-D.fore + 0.06, 0.04, 0.038, 0, look.shirt)], 8, { capBottom: false });
      return;
    }
    const col = look.shirt;
    b.ellipsoid(0.052, 0.05, 0.05, 8, 4, col);
    loft(b, [ring(-D.fore + 0.02, 0.044, 0.042, 0, col), ring(-D.fore * 0.45, 0.048, 0.046, 0, col), ring(0.0, 0.052, 0.05, 0, col)], 10, { capBottom: false });
    loft(b, [ring(-D.fore - 0.005, 0.04, 0.038, 0, shade(col, 0.85)), ring(-D.fore + 0.025, 0.046, 0.044, 0, shade(col, 0.85))], 8, { capBottom: false });
  }

  const CURL = { relax: [0.35, 0.35, 0.4, 0.45], fist: [1.5, 1.5, 1.5, 1.5], grip: [1.1, 1.15, 1.2, 1.25], point: [0, 1.5, 1.5, 1.5], finger: [1.5, 0, 1.5, 1.5], open: [0.05, 0.05, 0.08, 0.1], fig: [1.5, 1.5, 1.5, 1.5] };

  function finger(b, base, inward, curl, len, rad, sk) {
    let p = base, dir = [0, -1, 0];
    const pts = [p];
    [0.45, 0.33, 0.22].forEach((part, k) => {
      const a = curl * (k === 0 ? 0.55 : 0.75);
      const c = C(a), sn = S(a);
      dir = V3.norm([dir[0] * c + inward * sn * Math.abs(dir[1]), dir[1] * c, dir[2]]);
      p = V3.add(p, V3.mul(dir, len * part));
      pts.push(p);
    });
    K.tube(b, pts, [rad, rad * 0.96, rad * 0.9, rad * 0.8], 5, sk);
    b.at(p[0], p[1], p[2], h => h.ellipsoid(rad * 0.8, rad * 0.8, rad * 0.8, 5, 3, sk));
  }

  function buildHand(b, look, side, grip) {
    const sk = look.skin;
    const inward = side === 'L' ? -1 : 1;
    const k = look.body === 'herm' ? 0.88 : 1;
    const curl = CURL[grip] || CURL.relax;
    b.at(0, -0.048 * k, 0, h => h.ellipsoid(0.017 * k, 0.05 * k, 0.04 * k, 8, 6, sk));
    const zs = [0.026, 0.009, -0.008, -0.024];
    const lens = [0.075, 0.082, 0.077, 0.062];
    zs.forEach((z, i) => finger(b, [0, -0.088 * k, z * k], inward, curl[i], lens[i] * k, 0.0085 * k, sk));
    if (grip === 'fig') {
      b.at(inward * 0.024 * k, -0.118 * k, 0.017 * k, h => h.ellipsoid(0.009 * k, 0.012 * k, 0.009 * k, 6, 4, shade(sk, 1.05)));
      K.tube(b, [[inward * 0.006, -0.05 * k, 0.034 * k], [inward * 0.02 * k, -0.09 * k, 0.026 * k], [inward * 0.024 * k, -0.114 * k, 0.018 * k]], [0.01 * k, 0.0095 * k, 0.009 * k], 5, sk);
      return;
    }
    const open = grip === 'open' || grip === 'relax';
    const tip = open ? [inward * 0.012 * k, -0.075 * k, 0.062 * k] : [inward * 0.026 * k, -0.092 * k, 0.03 * k];
    K.tube(b, [[inward * 0.006, -0.03 * k, 0.034 * k], [inward * 0.012, -0.055 * k, 0.05 * k], tip], [0.011 * k, 0.0095 * k, 0.0085 * k], 5, sk);
  }

  function buildThigh(b, look, D) {
    const P = look.skirt ? look.legs : look.pants;
    const r = look.skirt ? 0.84 : 1;
    loft(b, [ring(-D.thigh - 0.02, 0.06 * r, 0.058 * r, 0.0, P), ring(-0.3, 0.07 * r, 0.068 * r, 0.0, P), ring(-0.1, 0.082 * r, 0.08 * r, 0.006, P), ring(0.05, 0.088 * r, 0.085 * r, 0.0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, look, D) {
    const P = look.skirt ? look.legs : look.pants;
    const r = look.skirt ? 0.8 : 1;
    b.ellipsoid(0.062 * r, 0.05, 0.06 * r, 8, 4, P);
    loft(b, [ring(-D.shin + 0.02, 0.05 * r, 0.048 * r, 0.0, P), ring(-0.25, 0.054 * r, 0.056 * r, -0.006, P), ring(-0.1, 0.058 * r, 0.058 * r, 0.0, P), ring(0.0, 0.06 * r, 0.058 * r, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b, look) {
    const sh = look.shoe;
    const boot = look.body === 'volde';
    if (boot) b.at(0, -0.02, 0.0, h => h.prism(10, 0.058, 0.062, -0.04, 0.056, 0.058, 0.12, sh, { capBottom: true }));
    b.at(0, -0.035, 0.0, h => h.ellipsoid(0.05, 0.04, 0.06, 8, 4, sh));
    b.at(0, -0.052, 0.07, h => h.box(0.1, 0.055, 0.26, sh));
    b.at(0, -0.075, 0.07, h => h.box(0.104, 0.012, 0.266, 0x060606));
  }

  function build(r) {
    const out = { looks: {} };
    Object.entries(LOOKS).forEach(([key, look]) => {
      const D = BODY[look.body];
      const size = key === 'reader' || key === 'ron' ? 256 : 512;
      const faces = {};
      EYES.forEach(e => MOUTHS.forEach(m => { faces[e + ':' + m] = null; }));
      const hands = {};
      ['L', 'R'].forEach(s => ['relax', 'fist', 'grip', 'point', 'finger', 'open', 'fig'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, look, s, g)); }));
      out.looks[key] = {
        look,
        D,
        faces,
        faceSize: size,
        torso: mesh(r, b => buildTorso(b, look)),
        pelvis: mesh(r, b => buildPelvis(b, look, false)),
        pelvisLong: mesh(r, b => buildPelvis(b, look, true)),
        neck: mesh(r, b => loft(b, [ring(-0.06, 0.062, 0.058, 0.004, look.skin), ring(0.06, 0.057, 0.055, 0.012, look.skin), ring(0.17, 0.055, 0.052, 0.0, look.skin)], 10)),
        head: mesh(r, b => buildHead(b, look)),
        face: mesh(r, b => headPatch(b, look.head, 1.004, FP[0], FP[1], FP[2], FP[3], 16, 14, [1, 1, 1, 0], [1, 1])),
        hair: look.hair ? mesh(r, b => buildHair(b, look.head, look.hair)) : null,
        hairTex: look.hair ? r.texture(128, hairTex(look.hair, look.hair.style === 'curls')) : null,
        glasses: look.glasses ? mesh(r, b => buildGlasses(b, look.head, look.glasses)) : null,
        earrings: look.earrings ? mesh(r, b => buildEarrings(b, look.head, look.earrings)) : null,
        hat: look.hat ? mesh(r, b => buildHat(b, look.head)) : null,
        upper: mesh(r, b => buildUpper(b, look, D)),
        fore: mesh(r, b => buildFore(b, look, D)),
        hands,
        thigh: mesh(r, b => buildThigh(b, look, D)),
        shin: mesh(r, b => buildShin(b, look, D)),
        foot: mesh(r, b => buildFoot(b, look))
      };
    });
    out.faceOf = (key, eyes, mouth) => {
      const L = out.looks[key];
      const id = (EYES.includes(eyes) ? eyes : 'open') + ':' + (MOUTHS.includes(mouth) ? mouth : 'shut');
      if (!L.faces[id]) {
        const [e, m] = id.split(':');
        L.faces[id] = r.texture(L.faceSize, drawFace(L.look, e, m), { clamp: true });
      }
      return L.faces[id];
    };
    out.warm = () => Object.keys(out.looks).forEach(key => EYES.forEach(e => MOUTHS.forEach(m => out.faceOf(key, e, m))));
    return out;
  }

  function solve(who, pose) {
    return Rig.solve(pose, BODY[LOOKS[who].body]);
  }

  function hatMatrix(m, pose) {
    const lift = pose.hatLift || 0;
    const tilt = pose.hatTilt || [0, 0, 0];
    return M4.chain(m.head, M4.translate(0, lift, 0), M4.rotX(tilt[0]), M4.rotZ(tilt[2]), M4.rotY(tilt[1]));
  }

  function draw(r, P, who, m, pose, opts) {
    const o = opts || {};
    const L = P.looks[who];
    const look = L.look;
    const pass = {};
    if (o.tint) pass.tint = o.tint;
    if (o.alpha !== undefined && o.alpha < 1) { pass.blend = true; pass.alpha = o.alpha; }
    const long = pose.stand !== undefined ? pose.stand : true;
    r.draw(long ? L.pelvisLong : L.pelvis, m.pelvis, pass);
    r.draw(L.torso, m.chest, pass);
    r.draw(L.neck, m.neck, pass);
    r.draw(L.head, m.head, pass);
    r.draw(L.face, m.head, Object.assign({ texture: P.faceOf(who, pose.eyes || 'open', pose.mouth || 'shut') }, pass));
    if (L.hair) r.draw(L.hair, m.head, Object.assign({ texture: L.hairTex }, pass));
    if (L.glasses) r.draw(L.glasses, m.head, pass);
    if (L.earrings) r.draw(L.earrings, m.head, pass);
    if (L.hat && pose.hat !== false) r.draw(L.hat, pose.hatM || hatMatrix(m, pose), pass);
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
  }

  window.HogwCast = { BODY, LOOKS, FP, headPt, build, solve, draw, hatMatrix };
})();
