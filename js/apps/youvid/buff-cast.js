(function () {
  const { M4, V3, rgb, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const Art = window.BuffArt;

  const D = { hipX: 0.105, hipY: -0.04, thigh: 0.45, shin: 0.43, chestY: 0.22, neckY: 0.33, shX: 0.2, shY: 0.248, upper: 0.3, fore: 0.27, headY: 0.17 };
  const H = { rx: 0.09, ry: 0.11, rz: 0.1, jaw: 0.07, chinIn: 0.14, chinDrop: 0.08, back: 1.02, brow: 0.005, cheek: 0.14, gonion: 0.24 };
  const FP = [-1.25, 1.25, -1.3, 0.85];
  const SKIN = 0xdcae98;
  const STACHE = 0xa86a40;
  const BROW = 0xa87a56;
  const MAIL = 0xe4e4e8;
  const PANTS_K = 0x111113;
  const PANTS_B = 0x161214;
  const SHIRT = 0xf2efe8;
  const STEEL = 0xb4b6bc;

  const TORSO_K = [
    [-0.22, 0.186, 0.15, 0.026],
    [-0.12, 0.198, 0.165, 0.04],
    [0.0, 0.202, 0.162, 0.036],
    [0.1, 0.205, 0.148, 0.022],
    [0.18, 0.21, 0.136, 0.012],
    [0.24, 0.208, 0.122, 0.0],
    [0.29, 0.19, 0.106, -0.006],
    [0.33, 0.15, 0.088, -0.01],
    [0.36, 0.088, 0.072, -0.005],
    [0.38, 0.07, 0.062, 0.0]
  ];

  const TORSO_B = [
    [-0.25, 0.17, 0.135, 0.02],
    [-0.19, 0.188, 0.152, 0.03],
    [-0.165, 0.222, 0.19, 0.046],
    [-0.1, 0.222, 0.192, 0.05],
    [0.0, 0.212, 0.176, 0.04],
    [0.1, 0.21, 0.158, 0.024],
    [0.18, 0.212, 0.144, 0.012],
    [0.24, 0.21, 0.128, 0.0],
    [0.29, 0.192, 0.11, -0.006],
    [0.33, 0.152, 0.09, -0.01],
    [0.36, 0.09, 0.074, -0.005],
    [0.38, 0.072, 0.064, 0.0]
  ];

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function rgba(c, a) {
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
  }

  function headPt(yaw, pit, inf) {
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
      const cheek = Math.max(0, 1 - Math.abs(cy + 0.12) / 0.34) * Math.max(0, 1 - Math.abs(Math.abs(cx) - 0.68) / 0.32);
      x *= 1 + cheek * H.cheek;
      z += cheek * 0.005;
    }
    return [x * inf, y * inf, z * inf];
  }

  function headVert(yaw, pit, inf) {
    const e = 0.002;
    const p = headPt(yaw, pit, inf);
    const dy = V3.sub(headPt(yaw + e, pit, inf), headPt(yaw - e, pit, inf));
    const dp = V3.sub(headPt(yaw, Math.min(pit + e, PI / 2), inf), headPt(yaw, Math.max(pit - e, -PI / 2), inf));
    const n = V3.cross(dy, dp);
    return { p, n: V3.len(n) > 1e-9 ? V3.norm(n) : V3.norm(p) };
  }

  function angOf(x, y) {
    let yaw = Math.asin(clamp(x / H.rx, -0.98, 0.98));
    let pit = Math.asin(clamp(y / H.ry, -0.98, 0.98));
    for (let k = 0; k < 12; k++) {
      const p = headPt(yaw, pit, 1);
      const e = 1e-4;
      const px = headPt(yaw + e, pit, 1), pp = headPt(yaw, pit + e, 1);
      const a = (px[0] - p[0]) / e, bq = (pp[0] - p[0]) / e, c = (px[1] - p[1]) / e, d = (pp[1] - p[1]) / e;
      const det = a * d - bq * c;
      if (Math.abs(det) < 1e-12) break;
      const ex = x - p[0], ey = y - p[1];
      yaw += (d * ex - bq * ey) / det;
      pit += (-c * ex + a * ey) / det;
    }
    return [yaw, pit];
  }

  function faceUV(yaw, pit) {
    return [(yaw - FP[0]) / (FP[1] - FP[0]), (pit - FP[2]) / (FP[3] - FP[2])];
  }

  function surf(x, y, lift) {
    const [yaw, pit] = angOf(x, y);
    const v = headVert(yaw, pit, 1);
    return { p: V3.add(v.p, V3.mul(v.n, lift || 0)), n: v.n, yaw, pit };
  }

  function headPatch(b, inf, y0, y1, p0, p1, nu, nv, col, uv, keep) {
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const yA = lerp(y0, y1, i / nu), yB = lerp(y0, y1, (i + 1) / nu), pA = lerp(p0, p1, j / nv), pB = lerp(p0, p1, (j + 1) / nv);
        if (keep && !keep((yA + yB) / 2, (pA + pB) / 2)) continue;
        const a = headVert(yA, pA, inf), bb = headVert(yB, pA, inf), c = headVert(yB, pB, inf), d = headVert(yA, pB, inf);
        const uvs = uv ? [uv(yA, pA), uv(yB, pA), uv(yB, pB), uv(yA, pB)] : null;
        b.quad(a.p, bb.p, c.p, d.p, col, uvs, [a.n, bb.n, c.n, d.n]);
      }
    }
  }

  function bump(b, xs, vs, at, col, uvAt) {
    const P = (x, v) => at(x, v).p;
    const ex = (xs[xs.length - 1] - xs[0]) * 0.01, ev = (vs[vs.length - 1] - vs[0]) * 0.01;
    for (let j = 0; j < vs.length - 1; j++) {
      for (let i = 0; i < xs.length - 1; i++) {
        const cs = [[xs[i], vs[j]], [xs[i + 1], vs[j]], [xs[i + 1], vs[j + 1]], [xs[i], vs[j + 1]]];
        const pts = cs.map(([x, v]) => P(x, v));
        const ns = cs.map(([x, v]) => {
          const n = V3.cross(V3.sub(P(x + ex, v), P(x - ex, v)), V3.sub(P(x, v + ev), P(x, v - ev)));
          if (V3.len(n) < 1e-14) return at(x, v).n;
          const q = V3.norm(n);
          return V3.dot(q, at(x, v).n) < 0 ? V3.mul(q, -1) : q;
        });
        const uvs = uvAt ? cs.map(([x, v]) => uvAt(x, v)) : null;
        b.quad(pts[0], pts[1], pts[2], pts[3], col, uvs, ns);
      }
    }
  }

  function steps(a, b, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(lerp(a, b, i / n));
    return out;
  }

  const NOSE_TOP = 0.01, NOSE_BOT = -0.041;

  function noseH(x, y) {
    const t = clamp((NOSE_TOP - y) / (NOSE_TOP - NOSE_BOT), 0, 1);
    const tip = 0.8;
    let f = t < tip ? 0.0025 + 0.0175 * Math.pow(t / tip, 1.5) : 0.02 * (1 - Math.pow((t - tip) / (1 - tip), 1.6));
    if (t < 0.05) f *= t / 0.05;
    const wv = 0.0078 + 0.0118 * Math.pow(t, 2.0);
    const q = Math.abs(x) / wv;
    const g = q < 1 ? Math.pow(1 - q * q, 0.9) : 0;
    const ala = Math.max(0, 1 - Math.hypot((Math.abs(x) - 0.0125) / 0.006, (t - 0.86) / 0.12)) * 0.0045;
    return f * g + ala;
  }

  const STACHE_W = 0.045;

  function stacheTop(x) {
    const q = x / STACHE_W;
    return -0.0385 - 0.006 * q * q;
  }

  function stacheBot(x) {
    const q = Math.abs(x) / STACHE_W;
    return -0.0575 - 0.0035 * q - 0.011 * q * q * q;
  }

  function stacheH(x, vv) {
    const v = clamp(vv, 0, 1);
    const q = Math.min(1, Math.abs(x) / STACHE_W);
    const mid = 1 - 0.55 * Math.max(0, 1 - Math.abs(x) / 0.005) * (v < 0.4 ? 1 - v / 0.4 : 0);
    return 0.0085 * Math.pow(Math.max(0, S(PI * Math.pow(v, 0.85))), 0.5) * (1 - 0.45 * q * q) * Math.sqrt(Math.max(0, 1 - Math.pow(q, 3))) * mid;
  }

  function faceMapper(w, h) {
    return (x, y) => {
      const [yaw, pit] = angOf(x, y);
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

  function drawFace(eyes, mouth) {
    return (ctx, w, h) => {
      const P = faceMapper(w, h);
      const px = w / ((FP[1] - FP[0]) * H.rx);
      const soft = (x, y, rx, ry, c, a) => { const q = P(x, y); Art.soft(ctx, q[0], q[1], px * rx, px * ry, c, a); };
      ctx.fillStyle = hex(SKIN);
      ctx.fillRect(0, 0, w, h);
      soft(0, 0.055, 0.055, 0.028, 0xf6dccc, 0.3);
      [-1, 1].forEach(s => {
        soft(s * 0.05, -0.03, 0.03, 0.024, 0xdc7a6e, 0.38);
        soft(s * 0.031, 0.011, 0.022, 0.012, 0x9a5444, 0.24);
        soft(s * 0.068, 0.02, 0.024, 0.05, 0x9a6050, 0.2);
        soft(s * 0.075, -0.05, 0.02, 0.05, 0xa8685a, 0.18);
        soft(s * 0.02, -0.024, 0.009, 0.016, 0x9a5a4a, 0.22);
        soft(s * 0.03, -0.004, 0.014, 0.005, 0xf6d6c6, 0.3);
        soft(s * 0.032, -0.058, 0.006, 0.014, 0x9a5a4a, 0.2);
      });
      soft(0, -0.03, 0.01, 0.009, 0xe48a80, 0.35);
      soft(0, -0.092, 0.032, 0.016, 0xf0c4b0, 0.35);
      soft(0, -0.074, 0.018, 0.005, 0x8a4a3c, 0.3);
      soft(0, -0.116, 0.06, 0.012, 0x8a5040, 0.35);
      const g = rand(77);
      for (let i = 0; i < 1400; i++) {
        const x = (g() - 0.5) * 0.13, y = -0.04 - g() * 0.09;
        const edge = Math.hypot(x / 0.07, (y + 0.06) / 0.07);
        if (edge > 1.15 || (Math.abs(x) < 0.022 && y > -0.07 && y < -0.05)) continue;
        const q = P(x, y);
        ctx.fillStyle = `rgba(150,90,60,${0.07 + 0.08 * g()})`;
        ctx.fillRect(q[0], q[1], 1.5, 1.5);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      [-1, 1].forEach(s => {
        ctx.strokeStyle = rgba(BROW, 0.85);
        ctx.lineWidth = px * 0.0042;
        ctx.beginPath();
        curve(ctx, P, [[s * 0.013, 0.0185], [s * 0.031, 0.0235], [s * 0.05, 0.02]]);
        ctx.stroke();
        ctx.lineWidth = px * 0.0022;
        ctx.strokeStyle = rgba(0x7a5034, 0.55);
        ctx.beginPath();
        curve(ctx, P, [[s * 0.015, 0.0178], [s * 0.031, 0.0225], [s * 0.046, 0.0195]]);
        ctx.stroke();
      });
      const ey = 0.006;
      [-1, 1].forEach(s => {
        const inner = [s * 0.018, ey - 0.0008], outer = [s * 0.043, ey + 0.0012];
        if (eyes === 'shut') {
          ctx.strokeStyle = 'rgba(70,36,26,0.9)';
          ctx.lineWidth = px * 0.0026;
          ctx.beginPath();
          curve(ctx, P, [inner, [s * 0.03, ey - 0.0025], outer]);
          ctx.stroke();
          return;
        }
        const open = eyes === 'half' ? 0.0025 : eyes === 'wide' ? 0.0062 : 0.0048;
        const top = ey + open, bot = ey - open * 0.7;
        ctx.fillStyle = '#ece4dc';
        ctx.beginPath();
        curve(ctx, P, [inner, [s * 0.026, top + 0.001], [s * 0.035, top], outer]);
        curve(ctx, P, [outer, [s * 0.03, bot], inner]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        const ir = P(s * 0.0295, ey + 0.0004);
        ctx.fillStyle = '#6c8ca4';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * 0.0056, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3e5a70';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * 0.0056, PI * 1.1, PI * 1.9);
        ctx.fill();
        ctx.fillStyle = '#141010';
        ctx.beginPath();
        ctx.arc(ir[0], ir[1], px * 0.0022, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(ir[0] - px * 0.0015, ir[1] - px * 0.0016, px * 0.001, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(60,30,20,0.3)';
        ctx.fillRect(0, P(0, top)[1] - px * 0.003, w, px * 0.0035);
        ctx.restore();
        ctx.strokeStyle = '#3a2016';
        ctx.lineWidth = px * 0.0026;
        ctx.beginPath();
        curve(ctx, P, [[s * 0.017, ey - 0.0003], [s * 0.026, top + 0.0012], [s * 0.036, top + 0.0004], [s * 0.044, ey + 0.0016]]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(110,60,44,0.4)';
        ctx.lineWidth = px * 0.0016;
        ctx.beginPath();
        curve(ctx, P, [outer, [s * 0.03, bot - 0.0006], inner]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(140,80,60,0.3)';
        ctx.lineWidth = px * 0.0018;
        ctx.beginPath();
        curve(ctx, P, [[s * 0.018, top + 0.0045], [s * 0.031, top + 0.0062], [s * 0.042, top + 0.004]]);
        ctx.stroke();
      });
      [-1, 1].forEach(s => {
        ctx.fillStyle = 'rgba(80,36,28,0.75)';
        const n = P(s * 0.0085, -0.0385);
        ctx.beginPath();
        ctx.ellipse(n[0], n[1], px * 0.0048, px * 0.0024, s * 0.3, 0, PI * 2);
        ctx.fill();
      });
      const my = -0.06;
      const lipCol = '#b4706a';
      if (mouth === 'open' || mouth === 'wide') {
        const hw = mouth === 'wide' ? 0.019 : 0.016, hh = mouth === 'wide' ? 0.0125 : 0.0068;
        ctx.fillStyle = '#3a1210';
        ctx.beginPath();
        curve(ctx, P, [[-hw, my + 0.002], [0, my + 0.004], [hw, my + 0.002]]);
        curve(ctx, P, [[hw, my + 0.002], [hw * 0.6, my - hh], [0, my - hh * 1.15], [-hw * 0.6, my - hh], [-hw, my + 0.002]]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#ece6dc';
        ctx.beginPath();
        curve(ctx, P, [[-hw, my + 0.004], [0, my + 0.0055], [hw, my + 0.004]]);
        curve(ctx, P, [[hw, my + 0.004], [0, my + 0.0005], [-hw, my + 0.004]]);
        ctx.fill();
        ctx.beginPath();
        curve(ctx, P, [[-hw * 0.8, my - hh * 1.2], [0, my - hh * 0.75], [hw * 0.8, my - hh * 1.2]]);
        curve(ctx, P, [[hw * 0.8, my - hh * 1.2], [0, my - hh * 1.3], [-hw * 0.8, my - hh * 1.2]]);
        ctx.fill();
        if (mouth === 'wide') {
          ctx.fillStyle = '#a04a48';
          ctx.beginPath();
          const tq = P(0, my - hh * 0.75);
          ctx.ellipse(tq[0], tq[1], px * hw * 0.6, px * hh * 0.35, 0, 0, PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = lipCol;
        ctx.beginPath();
        curve(ctx, P, [[-hw - 0.001, my + 0.001], [-hw * 0.5, my - hh - 0.001], [0, my - hh * 1.15 - 0.0015], [hw * 0.5, my - hh - 0.001], [hw + 0.001, my + 0.001]]);
        curve(ctx, P, [[hw + 0.001, my + 0.001], [hw * 0.5, my - hh - 0.0055], [0, my - hh * 1.15 - 0.0065], [-hw * 0.5, my - hh - 0.0055], [-hw - 0.001, my + 0.001]]);
        ctx.fill();
      } else {
        const smile = mouth === 'smile' ? 0.003 : 0;
        ctx.fillStyle = lipCol;
        ctx.beginPath();
        curve(ctx, P, [[-0.019, my + smile], [0, my - 0.0008], [0.019, my + smile]]);
        curve(ctx, P, [[0.019, my + smile], [0.01, my - 0.0062], [0, my - 0.0072], [-0.01, my - 0.0062], [-0.019, my + smile]]);
        ctx.fill();
        ctx.strokeStyle = '#5a2620';
        ctx.lineWidth = px * 0.0022;
        ctx.beginPath();
        curve(ctx, P, [[-0.02, my + smile + 0.0004], [0, my - 0.0006], [0.02, my + smile + 0.0004]]);
        ctx.stroke();
        soft(0, my - 0.0035, 0.008, 0.002, 0xf0c0b0, 0.4);
      }
    };
  }

  function loftUV(b, rings, sides, us, vs, opts) {
    const o = opts || {};
    const a0 = o.a0 === undefined ? 0 : o.a0, a1 = o.a1 === undefined ? PI * 2 : o.a1;
    const ang = (i) => a0 + (a1 - a0) * (i / sides);
    const pt = (r, i) => [(r.cx || 0) + S(ang(i)) * r.rx, r.y, (r.cz || 0) + C(ang(i)) * r.rz];
    const len = [0];
    for (let j = 1; j < rings.length; j++) len.push(len[j - 1] + Math.abs(rings[j].y - rings[j - 1].y) + 0.3 * Math.abs(rings[j].rx - rings[j - 1].rx));
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      const dy = r1.y - r0.y;
      const slope = Math.abs(dy) < 1e-6 ? 0 : (((r0.rx + r0.rz) - (r1.rx + r1.rz)) / 2) / dy;
      const nr = (r, i) => V3.norm([S(ang(i)) / r.rx, slope * Math.sign(dy || 1), C(ang(i)) / r.rz]);
      const c0 = rgb(r0.col === undefined ? o.col : r0.col), c1 = rgb(r1.col === undefined ? o.col : r1.col);
      for (let i = 0; i < sides; i++) {
        const uv = o.uv ? [o.uv(i / sides, j / (rings.length - 1), r0, ang(i)), o.uv((i + 1) / sides, j / (rings.length - 1), r0, ang(i + 1)), o.uv((i + 1) / sides, (j + 1) / (rings.length - 1), r1, ang(i + 1)), o.uv(i / sides, (j + 1) / (rings.length - 1), r1, ang(i))]
          : [[(i / sides) * us, len[j] * vs], [((i + 1) / sides) * us, len[j] * vs], [((i + 1) / sides) * us, len[j + 1] * vs], [(i / sides) * us, len[j + 1] * vs]];
        b.quad(pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i), [c0, c0, c1, c1], uv, [nr(r0, i), nr(r0, i + 1), nr(r1, i + 1), nr(r1, i)]);
      }
    }
    if (o.capBottom) {
      const r = rings[0];
      const c = [r.cx || 0, r.y, r.cz || 0];
      for (let i = 0; i < sides; i++) b.tri(c, pt(r, i + 1), pt(r, i), rgb(r.col === undefined ? o.col : r.col), null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    if (o.capTop) {
      const r = rings[rings.length - 1];
      const c = [r.cx || 0, r.y, r.cz || 0];
      for (let i = 0; i < sides; i++) b.tri(c, pt(r, i), pt(r, i + 1), rgb(r.col === undefined ? o.col : r.col), null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    return b;
  }

  function R(y, rx, rz, cz, col) {
    return { y, rx, rz, cz: cz || 0, col };
  }

  function rowAt(rows, y) {
    if (y <= rows[0][0]) return rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (y <= rows[i][0]) {
        const a = rows[i - 1], c = rows[i];
        const k = (y - a[0]) / (c[0] - a[0]);
        return [y, lerp(a[1], c[1], k), lerp(a[2], c[2], k), lerp(a[3], c[3], k)];
      }
    }
    return rows[rows.length - 1];
  }

  function shell(b, rows, add, y0, y1, a0, a1, nu, nv, col, uvAt) {
    const pt = (y, a) => {
      const r = rowAt(rows, y);
      return [S(a) * (r[1] + add), y, r[3] + C(a) * (r[2] + add)];
    };
    const nrm = (y, a) => {
      const e = 0.004;
      const n = V3.cross(V3.sub(pt(y, a + e), pt(y, a - e)), V3.sub(pt(y + e, a), pt(y - e, a)));
      return V3.norm(n);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const ya = lerp(y1, y0, j / nv), yb = lerp(y1, y0, (j + 1) / nv);
        const aa = lerp(a0, a1, i / nu), ab = lerp(a0, a1, (i + 1) / nu);
        const q = [pt(ya, aa), pt(ya, ab), pt(yb, ab), pt(yb, aa)];
        const n = [nrm(ya, aa), nrm(ya, ab), nrm(yb, ab), nrm(yb, aa)];
        const uv = uvAt ? [uvAt(ya, aa), uvAt(ya, ab), uvAt(yb, ab), uvAt(yb, aa)] : null;
        b.quad(q[0], q[1], q[2], q[3], col, uv, n);
      }
    }
  }

  function buildSkull(b) {
    headPatch(b, 1, -PI, PI, -PI / 2 + 0.04, PI / 2 - 0.02, 24, 14, SKIN, null, (y, p) => !(Math.abs(y) < 1.15 && p > FP[2] + 0.05 && p < FP[3] - 0.05));
  }

  function buildFace(b) {
    headPatch(b, 1.002, FP[0], FP[1], FP[2], FP[3], 26, 22, [1, 1, 1, 0], faceUV);
  }

  function buildNose(b) {
    const at = (x, y) => {
      const s = surf(x, y, 0);
      return { p: V3.add(s.p, V3.mul(s.n, noseH(x, y) + 0.0005)), n: s.n };
    };
    bump(b, steps(-0.021, 0.021, 14), steps(NOSE_TOP, NOSE_BOT, 14), at, [1, 1, 1, 0], (x, y) => { const [yw, pt] = angOf(x, y); return faceUV(yw, pt); });
  }

  function buildStache(b) {
    const at = (x, v) => {
      const y = lerp(stacheTop(x), stacheBot(x), v);
      const s = surf(x, y, 0);
      return { p: V3.add(s.p, V3.mul(s.n, stacheH(x, v) + 0.0008 + noseH(x, y) * 0.7)), n: s.n };
    };
    bump(b, steps(-STACHE_W, STACHE_W, 22), steps(0, 1, 7), at, 0xffffff, (x, v) => [x / (STACHE_W * 2) + 0.5, 1 - v]);
  }

  const OPEN = [0.95, -0.36, 0.84];

  function coifOpen(yaw, pit) {
    return Math.hypot(yaw / OPEN[0], (pit - OPEN[1]) / OPEN[2]);
  }

  function coifPt(yaw, pit, inf) {
    const p = headPt(yaw, pit, inf);
    const peak = Math.pow(Math.max(0, S(pit)), 14) * 0.012;
    const squash = 1 - 0.06 * Math.max(0, S(pit));
    return [p[0] * (1 + 0.04 * Math.max(0, -S(pit))), p[1] * squash + peak, p[2] - peak * 0.3];
  }

  function buildCoif(b) {
    const nu = 56, nv = 30;
    const y0 = -PI, y1 = PI, p0 = -1.5, p1 = PI / 2 - 0.01;
    const inf = 1.1;
    const vert = (yaw, pit) => {
      const e = coifOpen(yaw, pit);
      let yy = yaw, pp = pit;
      if (e < 1) {
        yy = yaw / e;
        pp = OPEN[1] + (pit - OPEN[1]) / e;
      }
      return { yaw: yy, pit: pp };
    };
    const P = (yaw, pit) => coifPt(yaw, pit, inf);
    const N = (yaw, pit) => {
      const e = 0.003;
      const n = V3.cross(V3.sub(P(yaw + e, pit), P(yaw - e, pit)), V3.sub(P(yaw, Math.min(pit + e, PI / 2)), P(yaw, pit - e)));
      return V3.len(n) > 1e-10 ? V3.norm(n) : V3.norm(P(yaw, pit));
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const cs = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, c]) => [lerp(y0, y1, a / nu), lerp(p0, p1, c / nv)]);
        const inside = cs.filter(([yw, pt]) => coifOpen(yw, pt) < 1).length;
        if (inside === 4) continue;
        const vs = cs.map(([yw, pt]) => vert(yw, pt));
        const pts = vs.map(v => P(v.yaw, v.pit));
        const ns = vs.map(v => N(v.yaw, v.pit));
        const uvs = vs.map(v => [v.yaw * 0.7, v.pit * 0.6]);
        b.quad(pts[0], pts[1], pts[2], pts[3], MAIL, uvs, ns);
      }
    }
    const M = 64;
    for (let i = 0; i < M; i++) {
      const t0 = (i / M) * PI * 2, t1 = ((i + 1) / M) * PI * 2;
      const e0 = { yaw: S(t0) * OPEN[0], pit: OPEN[1] + C(t0) * OPEN[2] }, e1 = { yaw: S(t1) * OPEN[0], pit: OPEN[1] + C(t1) * OPEN[2] };
      const o0 = coifPt(e0.yaw, e0.pit, inf), o1 = coifPt(e1.yaw, e1.pit, inf);
      const n0 = coifPt(e0.yaw * 0.97, OPEN[1] + (e0.pit - OPEN[1]) * 0.97, 1.012), n1 = coifPt(e1.yaw * 0.97, OPEN[1] + (e1.pit - OPEN[1]) * 0.97, 1.012);
      b.quad(o0, o1, n1, n0, shade(MAIL, 0.8), [[t0, 0], [t1, 0], [t1, 0.15], [t0, 0.15]]);
    }
  }

  function buildCowl(b) {
    const y = D.neckY;
    loftUV(b, [
      R(0.235, 0.17, 0.142, 0.03),
      R(0.27, 0.168, 0.13, 0.016),
      R(0.305, 0.142, 0.112, 0.008),
      R(y - 0.005, 0.104, 0.096, 0.014),
      R(y + 0.045, 0.088, 0.09, 0.024),
      R(y + 0.085, 0.083, 0.088, 0.03)
    ], 28, 3.5, 3, { col: MAIL });
  }

  function buildTorsoMail(b) {
    loftUV(b, TORSO_K.map(([y, rx, rz, cz]) => R(y, rx, rz, cz)), 20, 4.5, 3, { col: MAIL, capBottom: true });
  }

  function tabardV(height) {
    return (height + 0.39) / 0.93;
  }

  function buildTabardChest(b) {
    const uvF = (y, a) => [(a + 1.42) / 2.84, tabardV(D.chestY + y)];
    shell(b, TORSO_K, 0.014, -0.24, 0.33, -1.42, 1.42, 16, 14, [1, 1, 1, 0], uvF);
    const uvB = (y, a) => [(a - PI + 1.25) / 2.5 * 0.3, tabardV(D.chestY + y)];
    shell(b, TORSO_K, 0.014, -0.24, 0.33, PI - 1.3, PI + 1.3, 14, 10, [1, 1, 1, 0], uvB);
    shell(b, TORSO_K, 0.014, 0.2, 0.33, 1.42, PI - 1.3, 4, 3, [1, 1, 1, 0], (y) => [0.02, tabardV(D.chestY + y)]);
    shell(b, TORSO_K, 0.014, 0.2, 0.33, -(PI - 1.3), -1.42, 4, 3, [1, 1, 1, 0], (y) => [0.02, tabardV(D.chestY + y)]);
  }

  const LOWER_K = [[-0.42, 0.218, 0.165, 0.0], [-0.3, 0.214, 0.16, 0.004], [-0.1, 0.205, 0.155, 0.008], [0.06, 0.196, 0.152, 0.012], [0.18, 0.194, 0.15, 0.014]];

  function buildTabardLower(b) {
    const uvF = (y, a) => [(a + 1.3) / 2.6, tabardV(y)];
    shell(b, LOWER_K, 0.008, -0.39, 0.17, -1.3, 1.3, 14, 10, [1, 1, 1, 0], uvF);
    const uvB = (y, a) => [(a - PI + 1.1) / 2.2 * 0.3, tabardV(y)];
    shell(b, LOWER_K, 0.008, -0.39, 0.17, PI - 1.1, PI + 1.1, 12, 6, [1, 1, 1, 0], uvB);
  }

  function buildSkirt(b) {
    loftUV(b, [R(-0.37, 0.205, 0.15, 0.0), R(-0.2, 0.2, 0.148, 0.004), R(0.0, 0.194, 0.146, 0.008), R(0.17, 0.188, 0.144, 0.012)], 22, 4.5, 3, { col: MAIL });
  }

  function buildBelt(b) {
    loftUV(b, [R(0.122, 0.216, 0.172, 0.014), R(0.172, 0.214, 0.17, 0.014)], 24, 4, 0.5, { col: 0xffffff });
  }

  function buildBuckle(b) {
    b.at(0, 0.147, 0.19, h => h.box(0.046, 0.044, 0.01, 0x8a8a90));
    b.at(0, 0.147, 0.196, h => h.box(0.03, 0.028, 0.004, 0x3a2416));
    b.at(0.004, 0.147, 0.198, h => h.box(0.005, 0.03, 0.005, 0xc8c8ce));
  }

  function buildSword(b) {
    b.push(M4.translate(0.205, 0.0, 0.07), M4.rotZ(-0.06), M4.rotX(-0.22));
    b.at(0, -0.33, 0, h => h.box(0.03, 0.82, 0.055, 0x101012));
    b.at(0, -0.73, 0, h => h.box(0.034, 0.05, 0.06, 0xb8b8c0));
    b.at(0, 0.09, 0, h => h.box(0.036, 0.04, 0.062, 0x9a9aa2));
    b.at(0, 0.12, 0, h => h.box(0.026, 0.026, 0.19, 0xd4d4da));
    b.at(0, 0.2, 0, h => h.box(0.024, 0.13, 0.026, 0x2a1e18));
    [0.16, 0.2, 0.24].forEach(y => b.at(0, y, 0, h => h.box(0.027, 0.006, 0.029, 0x8a7a6a)));
    b.at(0, 0.285, 0, h => h.ellipsoid(0.022, 0.024, 0.022, 10, 6, 0xe0e0e6));
    b.pop();
  }

  function buildPauldron(b, k) {
    const NA = 16, NV = 9;
    const P = (a, v) => {
      const th = lerp(-0.25, 1.5, v);
      const span = lerp(1.0, 1.9, Math.min(1, v * 1.6));
      const ang = (a - 0.5) * 2 * span;
      const rad = 0.088 - 0.03 * Math.pow(Math.max(0, th - 0.9) / 0.6, 2);
      const y = -0.1 + v * 0.17 - 0.012 * Math.max(0, 1 - v * 3);
      const ridge = 0.006 * Math.max(0, S(v * PI * 3));
      return [k * C(ang) * (rad + ridge), y, S(ang) * (rad + ridge) * 0.95];
    };
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NA; i++) {
        const cs = [[i / NA, j / NV], [(i + 1) / NA, j / NV], [(i + 1) / NA, (j + 1) / NV], [i / NA, (j + 1) / NV]];
        const pts = cs.map(([a, v]) => P(a, v));
        const ns = cs.map(([a, v]) => {
          const e = 0.01;
          let n = V3.cross(V3.sub(P(a + e, v), P(a - e, v)), V3.sub(P(a, v + e), P(a, v - e)));
          n = V3.norm(n);
          const out = P(a, v);
          return V3.dot(n, [out[0], 0.3, out[2]]) < 0 ? V3.mul(n, -1) : n;
        });
        b.quad(pts[0], pts[1], pts[2], pts[3], STEEL, cs.map(([a, v]) => [a, v]), ns);
      }
    }
    const top = P(0.5, 1);
    for (let i = 0; i < NA; i++) {
      const a0 = P(i / NA, 1), a1 = P((i + 1) / NA, 1);
      b.tri([k * 0.01, top[1] + 0.008, 0], a0, a1, STEEL, [[0.5, 0.98], [i / NA, 1], [(i + 1) / NA, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
  }

  function limb(b, len, r0, r1, mid, col, us, vs) {
    loftUV(b, [R(-len - 0.01, r1, r1 * 0.96), R(-len * 0.55, mid, mid * 0.96), R(-0.04, r0, r0 * 0.97), R(0.03, r0 * 1.02, r0)], 12, us, vs, { col, capBottom: true });
  }

  function finger(b, base, lens, widths, curls, spread, k, col) {
    b.push(M4.translate(base[0], base[1], base[2]), M4.rotX(spread));
    lens.forEach((l, i) => {
      b.push(M4.rotZ(-k * curls[i]));
      b.at(0, -l / 2, 0, h => h.box(widths[i] * 0.85, l + 0.004, widths[i], col));
      b.push(M4.translate(0, -l, 0));
    });
    lens.forEach(() => { b.pop(); b.pop(); });
    b.pop();
  }

  const GRIPS = {
    relax: { f: [[0.35, 0.4, 0.3], [0.4, 0.45, 0.3], [0.45, 0.5, 0.3], [0.5, 0.5, 0.3]], th: [0.5, 0.3], ta: 0.5 },
    fist: { f: [[1.4, 1.5, 0.9], [1.45, 1.5, 0.9], [1.45, 1.5, 0.9], [1.4, 1.5, 0.9]], th: [0.9, 0.9], ta: 0.9 },
    two: { f: [[0.05, 0.05, 0.05], [0.05, 0.05, 0.05], [1.5, 1.5, 0.9], [1.5, 1.4, 0.9]], th: [1.0, 0.8], ta: 1.0, sp: [-0.06, 0.04, 0, 0] },
    open: { f: [[0.15, 0.15, 0.1], [0.12, 0.12, 0.1], [0.15, 0.15, 0.1], [0.2, 0.2, 0.12]], th: [0.2, 0.1], ta: 0.15, sp: [-0.12, -0.04, 0.04, 0.12] },
    cup: { f: [[0.45, 0.4, 0.25], [0.45, 0.4, 0.25], [0.5, 0.45, 0.25], [0.55, 0.45, 0.3]], th: [0.3, 0.2], ta: 0.35, sp: [-0.08, -0.02, 0.02, 0.08] },
    fret: { f: [[1.1, 1.2, 0.6], [1.0, 1.2, 0.6], [1.2, 1.3, 0.6], [1.3, 1.3, 0.7]], th: [0.4, 0.3], ta: 0.6 },
    strum: { f: [[0.6, 0.7, 0.4], [0.9, 1.0, 0.6], [1.1, 1.2, 0.7], [1.2, 1.2, 0.7]], th: [0.5, 0.5], ta: 0.75 }
  };

  function buildHand(b, k, grip, cuff) {
    const g = GRIPS[grip] || GRIPS.relax;
    const sk = SKIN;
    b.at(0, -0.045, 0, h => h.box(0.032, 0.085, 0.088, sk));
    b.at(-k * 0.004, -0.02, 0, h => h.box(0.036, 0.04, 0.076, shade(sk, 0.97)));
    const zs = [0.032, 0.011, -0.011, -0.031];
    const lens = [[0.042, 0.026, 0.021], [0.046, 0.029, 0.023], [0.043, 0.027, 0.022], [0.035, 0.021, 0.019]];
    zs.forEach((z, i) => finger(b, [0, -0.087, z], lens[i], [0.02, 0.018, 0.016], g.f[i], g.sp ? g.sp[i] : 0, k, sk));
    b.push(M4.translate(-k * 0.01, -0.03, 0.04), M4.rotX(-g.ta), M4.rotZ(k * 0.35));
    finger(b, [0, 0, 0], [0.034, 0.03], [0.022, 0.02], g.th, 0, k, sk);
    b.pop();
    if (cuff) loftUV(b, [R(-0.008, 0.046, 0.05), R(0.025, 0.05, 0.054)], 12, 1, 1, { col: cuff });
  }

  function buildUke(b) {
    const outline = [];
    const seg = (p0, p1, p2, p3, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / n, u = 1 - t;
        outline.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
      }
    };
    seg([0.0, 0], [0.0, -0.055], [0.03, -0.075], [0.075, -0.07], 6);
    seg([0.075, -0.07], [0.11, -0.065], [0.115, -0.045], [0.14, -0.05], 5);
    seg([0.14, -0.05], [0.175, -0.058], [0.205, -0.055], [0.215, -0.03], 5);
    seg([0.215, -0.03], [0.222, -0.012], [0.222, 0.012], [0.215, 0.03], 3);
    seg([0.215, 0.03], [0.205, 0.055], [0.175, 0.058], [0.14, 0.05], 5);
    seg([0.14, 0.05], [0.115, 0.045], [0.11, 0.065], [0.075, 0.07], 5);
    seg([0.075, 0.07], [0.03, 0.075], [0.0, 0.055], [0.0, 0], 6);
    const pts = outline.map(([x, y]) => [x, -y]);
    const uv = (x, y) => [x / 0.56, 0.5 + y / 0.18];
    const ctr = [0.11, 0];
    const zf = 0.026, zb = -0.026;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length];
      b.tri([ctr[0], ctr[1], zf], [a[0], a[1], zf], [c[0], c[1], zf], [1, 1, 1, 0], [uv(ctr[0], ctr[1]), uv(a[0], a[1]), uv(c[0], c[1])], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.tri([ctr[0], ctr[1], zb], [c[0], c[1], zb], [a[0], a[1], zb], 0x6a3418, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      const n = V3.norm([c[1] - a[1], -(c[0] - a[0]), 0]);
      b.quad([a[0], a[1], zb], [c[0], c[1], zb], [c[0], c[1], zf], [a[0], a[1], zf], 0x7a3c1c, null, [n, n, n, n]);
    }
    const neck = (x0, x1, w0, w1, z, col, tex) => {
      b.quad([x0, -w0, z], [x1, -w1, z], [x1, w1, z], [x0, w0, z], col, tex ? [uv(x0, -w0), uv(x1, -w1), uv(x1, w1), uv(x0, w0)] : null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    };
    neck(0.2, 0.465, 0.0155, 0.0145, zf + 0.006, [1, 1, 1, 0], true);
    b.quad([0.2, -0.0155, zf + 0.006], [0.465, -0.0145, zf + 0.006], [0.465, -0.0145, zf - 0.012], [0.2, -0.0155, zf - 0.012], 0x2a1a12);
    b.quad([0.465, 0.0145, zf + 0.006], [0.2, 0.0155, zf + 0.006], [0.2, 0.0155, zf - 0.012], [0.465, 0.0145, zf - 0.012], 0x2a1a12);
    b.at(0.34, 0, zf - 0.02, h => h.box(0.26, 0.026, 0.02, 0x6a3418));
    neck(0.465, 0.548, 0.017, 0.024, zf + 0.002, [1, 1, 1, 0], true);
    b.at(0.506, 0, zf - 0.006, h => h.box(0.085, 0.044, 0.014, 0x3a2416));
    [[0.49, -0.031], [0.522, -0.034], [0.49, 0.031], [0.522, 0.034]].forEach(([x, y]) => {
      b.at(x, y * 1.05, zf - 0.012, h => h.box(0.008, 0.016, 0.008, 0xd8d0c0));
      b.at(x, y * 1.35, zf - 0.012, h => h.box(0.012, 0.01, 0.014, 0xf0ece0));
    });
  }

  function spike(b, base, dir, len, w, col) {
    const d = V3.norm(dir);
    let side = V3.cross(d, [0, 1, 0]);
    if (V3.len(side) < 1e-3) side = [1, 0, 0];
    side = V3.norm(side);
    const up = V3.cross(side, d);
    const tip = V3.add(base, V3.mul(d, len));
    const c = [V3.add(base, V3.mul(side, w)), V3.add(base, V3.mul(up, w)), V3.sub(base, V3.mul(side, w)), V3.sub(base, V3.mul(up, w))];
    for (let i = 0; i < 4; i++) b.tri(c[i], c[(i + 1) % 4], tip, col, [[0, 0], [1, 0], [0.5, 1]]);
  }

  function shellAround(b, center, axis, rad, h0, h1, n, col, bulge) {
    const a = V3.norm(axis);
    let u = V3.cross(a, [0, 0, 1]);
    if (V3.len(u) < 1e-3) u = [1, 0, 0];
    u = V3.norm(u);
    const v = V3.cross(a, u);
    const P = (ang, t) => {
      const r0 = rad * (1 + (bulge || 0) * S(PI * t));
      return V3.add(V3.add(center, V3.mul(a, lerp(h0, h1, t))), V3.add(V3.mul(u, C(ang) * r0), V3.mul(v, S(ang) * r0)));
    };
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2, t0 = j / 3, t1 = (j + 1) / 3;
        const nn = (ang) => V3.add(V3.mul(u, C(ang)), V3.mul(v, S(ang)));
        b.quad(P(a0, t0), P(a1, t0), P(a1, t1), P(a0, t1), col, [[i / n, t0], [(i + 1) / n, t0], [(i + 1) / n, t1], [i / n, t1]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
      }
    }
  }

  function buildBossParts(r) {
    const goldTex = r.texture(128, Art.gold);
    const M = (fn) => mesh(r, fn);
    const W = 0x9c8462, DK = 0x3a2a16, HI = 0xffe8b8;
    const armor = M(b => {
      b.push(M4.translate(0, 1.42, 0.12), M4.rotX(0.32));
      loftUV(b, [R(-0.42, 0.28, 0.24, 0.0), R(-0.25, 0.32, 0.27, 0.04), R(0.0, 0.37, 0.3, 0.06), R(0.25, 0.4, 0.3, 0.04), R(0.42, 0.34, 0.27, 0.0), R(0.52, 0.2, 0.18, 0.0)], 22, 3, 2, { col: W, capBottom: true });
      [-0.3, -0.12, 0.08, 0.24].forEach(y => loftUV(b, [R(y - 0.02, 0.35 + y * 0.08, 0.3, 0.06), R(y + 0.025, 0.36 + y * 0.08, 0.31, 0.06)], 22, 3, 0.3, { col: DK }));
      b.at(0, 0.1, 0.4, h => h.box(0.06, 0.6, 0.06, HI));
      b.pop();
      loftUV(b, [R(0.5, 0.42, 0.34, 0.0), R(0.75, 0.47, 0.38, 0.04), R(1.0, 0.44, 0.36, 0.06), R(1.12, 0.38, 0.3, 0.04)], 20, 3, 2, { col: W });
      for (let i = 0; i < 9; i++) {
        const a = -1.6 + (i / 8) * 3.2;
        b.push(M4.translate(S(a) * 0.46, 0.62, C(a) * 0.37), M4.rotY(a), M4.rotX(0.25));
        b.box(0.2, 0.36, 0.03, i % 2 ? W : DK, { base: true });
        b.pop();
      }
    });
    const helm = M(b => {
      loftUV(b, [R(-0.2, 0.2, 0.22, 0.0), R(-0.05, 0.215, 0.235, 0.01), R(0.12, 0.2, 0.22, 0.0), R(0.26, 0.15, 0.17, -0.02), R(0.36, 0.08, 0.1, -0.04), R(0.42, 0.015, 0.02, -0.06)], 20, 2, 2, { col: W });
      b.at(0, 0.02, 0.215, h => h.box(0.035, 0.28, 0.05, 0x120a04));
      b.at(0, 0.08, 0.205, h => h.box(0.16, 0.025, 0.05, 0x120a04));
      b.at(0, 0.0, 0.226, h => h.box(0.012, 0.3, 0.02, HI));
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        spike(b, [0, lerp(0.38, -0.05, t), lerp(-0.08, -0.22, t)], [0, 0.6, -1], 0.09, 0.025, DK);
      }
      loftUV(b, [R(-0.32, 0.28, 0.26, 0.0), R(-0.18, 0.24, 0.24, 0.02)], 18, 2, 0.4, { col: DK });
    });
    const pauldron = M(b => {
      const n = 18;
      for (let j = 0; j < 5; j++) {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const p0 = (j / 5) * PI * 0.5, p1 = ((j + 1) / 5) * PI * 0.5;
          const P = (a, p) => [C(a) * S(p) * 0.36, C(p) * 0.22, S(a) * S(p) * 0.36];
          const N = (a, p) => V3.norm([C(a) * S(p), C(p) * 1.4, S(a) * S(p)]);
          b.quad(P(a0, p0), P(a1, p0), P(a1, p1), P(a0, p1), W, [[i / n, j / 5], [(i + 1) / n, j / 5], [(i + 1) / n, (j + 1) / 5], [i / n, (j + 1) / 5]], [N(a0, p0), N(a1, p0), N(a1, p1), N(a0, p1)]);
        }
      }
      loftUV(b, [R(-0.08, 0.38, 0.38, 0.0), R(0.0, 0.37, 0.37, 0.0)], 18, 3, 0.4, { col: DK });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * PI * 2;
        spike(b, [C(a) * 0.36, -0.03, S(a) * 0.36], [C(a), 0.55, S(a)], 0.16, 0.045, HI);
      }
      loftUV(b, [R(-0.22, 0.34, 0.34, 0.0), R(-0.08, 0.37, 0.37, 0.0)], 18, 3, 0.6, { col: W });
    });
    const arm = M(b => {
      shellAround(b, [0, 0, 0], [0, -1, 0], 0.15, 0, 0.55, 12, W, 0.15);
      shellAround(b, [0, -0.55, 0], [0, -1, 0], 0.13, 0, 0.5, 12, W, 0.12);
      for (let i = 0; i < 5; i++) spike(b, [0.12, -0.6 - i * 0.08, -0.05], [1, 0.5, -0.3], 0.14, 0.035, HI);
      b.at(0, -0.55, -0.12, h => h.ellipsoid(0.12, 0.12, 0.12, 8, 6, DK));
      spike(b, [0, -0.55, -0.2], [0, 0.2, -1], 0.2, 0.05, HI);
      b.at(0, -1.08, 0.0, h => h.box(0.22, 0.2, 0.24, DK));
    });
    const leg = M(b => {
      shellAround(b, [0, 0, 0], [0, -1, 0], 0.2, 0, 0.6, 12, W, 0.1);
      b.at(0, -0.62, 0.08, h => h.ellipsoid(0.17, 0.15, 0.17, 10, 6, DK));
      spike(b, [0, -0.62, 0.22], [0, 0.3, 1], 0.18, 0.05, HI);
      shellAround(b, [0, -0.66, 0], [0, -1, 0], 0.16, 0, 0.62, 12, W, 0.1);
      b.at(0, -1.32, 0.12, h => h.box(0.24, 0.16, 0.44, DK));
    });
    const spear = M(b => {
      b.prism(6, 0.035, 0.035, -2.0, 0.035, 0.035, 1.3, 0x3a2412, { capBottom: true });
      b.at(0, 1.3, 0, h => h.box(0.3, 0.06, 0.08, HI));
      b.at(0, 1.33, 0, h => h.prism(4, 0.1, 0.025, 0, 0.002, 0.002, 0.75, 0xe8e2d4));
      [-1, 1].forEach(s => spike(b, [s * 0.15, 1.32, 0], [s, 0.8, 0], 0.22, 0.03, HI));
      b.at(0, -2.0, 0, h => h.ellipsoid(0.06, 0.08, 0.06, 6, 4, HI));
    });
    const cape = M(b => {
      const g = rand(4);
      for (let i = 0; i < 8; i++) {
        const x0 = -0.6 + i * 0.15, x1 = x0 + 0.15;
        const d0 = 1.4 + g() * 0.4, d1 = 1.4 + g() * 0.4;
        b.quad([x0, 1.95, -0.35], [x1, 1.95, -0.35], [x1 * 1.3, 1.95 - d1, -0.75], [x0 * 1.3, 1.95 - d0, -0.75], i % 2 ? 0x4a1810 : 0x3a120c);
      }
    });
    return { goldTex, armor, helm, pauldron, arm, leg, spear, cape };
  }

  function build(r) {
    const mailTex = r.texture(128, Art.mail(11));
    const faces = {};
    const faceTex = (e, m) => {
      const key = e + ':' + m;
      if (!faces[key]) faces[key] = r.texture(512, drawFace(e, m), { clamp: true });
      return faces[key];
    };
    const T = {
      mail: mailTex,
      tabard: r.texture(256, Art.tabard(true), { height: 512, clamp: true }),
      tabardBack: r.texture(64, Art.tabard(false), { height: 128, clamp: true }),
      leather: r.texture(64, Art.leather, { height: 16 }),
      steel: r.texture(64, Art.steel, { height: 64, clamp: true }),
      velvet: r.texture(128, Art.velvet),
      curls: r.texture(128, Art.curls),
      linen: r.texture(128, Art.linen),
      vneck: r.texture(128, Art.vneck(SKIN), { height: 128, clamp: true }),
      uke: r.texture(512, Art.ukeTop, { height: 256, clamp: true }),
      stache: r.texture(64, Art.strands(STACHE, 0xd09868, 0x5a2e14, 13))
    };
    const M = (fn) => mesh(r, fn);
    const hands = {};
    ['L', 'R'].forEach(s => Object.keys(GRIPS).forEach(g => {
      hands['k' + s + g] = M(b => buildHand(b, s === 'L' ? 1 : -1, g, null));
      hands['b' + s + g] = M(b => buildHand(b, s === 'L' ? 1 : -1, g, SHIRT));
    }));
    const P = {
      T,
      faceTex,
      hands,
      skull: M(buildSkull),
      face: M(buildFace),
      nose: M(buildNose),
      stache: M(buildStache),
      neck: M(b => loftUV(b, [R(-0.06, 0.07, 0.066, 0.006), R(0.06, 0.066, 0.064, 0.014), R(0.16, 0.062, 0.06, 0.004)], 12, 1, 1, { col: SKIN })),
      coif: M(buildCoif),
      cowl: M(buildCowl),
      torsoMail: M(buildTorsoMail),
      tabardChest: M(buildTabardChest),
      tabardLower: M(buildTabardLower),
      skirt: M(buildSkirt),
      belt: M(buildBelt),
      buckle: M(buildBuckle),
      sword: M(buildSword),
      pauldronL: M(b => buildPauldron(b, 1)),
      pauldronR: M(b => buildPauldron(b, -1)),
      kUpper: M(b => limb(b, D.upper, 0.078, 0.066, 0.074, MAIL, 2.2, 4.5)),
      kFore: M(b => limb(b, D.fore, 0.066, 0.05, 0.062, MAIL, 2.2, 4.5)),
      kPelvis: M(b => loftUV(b, [R(-0.15, 0.16, 0.12, -0.005), R(-0.06, 0.182, 0.13, -0.01), R(0.06, 0.18, 0.128, 0.0)], 14, 1, 1, { col: PANTS_K, capBottom: true })),
      kThigh: M(b => limb(b, D.thigh, 0.092, 0.064, 0.078, PANTS_K, 1, 1)),
      kShin: M(b => { b.ellipsoid(0.066, 0.05, 0.064, 8, 4, PANTS_K); limb(b, D.shin, 0.064, 0.05, 0.058, 0x0c0c0e, 1, 1); }),
      kFoot: M(b => { b.at(0, -0.04, 0.05, h => h.box(0.105, 0.075, 0.27, 0x0c0b0b)); b.at(0, -0.075, 0.05, h => h.box(0.11, 0.014, 0.28, 0x050505)); }),
      wig: M(buildWig),
      hairCap: M(b => headPatch(b, 1.07, -PI, PI, 0.15, PI / 2 - 0.01, 24, 10, 0xffffff, (y, p) => [y * 1.2, p * 1.6], (y, p) => Math.abs(y) > 0.95 || p > 0.66)),
      beret: M(buildBeret),
      shirt: M(b => loftUV(b, TORSO_B.map(([y, rx, rz, cz]) => R(y, rx, rz, cz)), 22, 3, 2, { col: 0xffffff, capBottom: true })),
      vneck: M(b => shell(b, TORSO_B, 0.004, 0.18, 0.37, -0.42, 0.42, 6, 6, [1, 1, 1, 0], (y, a) => [(a + 0.42) / 0.84, (y - 0.18) / 0.19])),
      collar: M(buildCollar),
      bUpper: M(b => { limb(b, D.upper, 0.074, 0.068, 0.078, 0xffffff, 2, 3); b.at(0, -0.012, -0.004, h => h.ellipsoid(0.078, 0.062, 0.074, 10, 6, 0xf4f2ec)); }),
      bFore: M(b => limb(b, D.fore, 0.07, 0.046, 0.068, 0xffffff, 2, 3)),
      bPelvis: M(b => loftUV(b, [R(-0.17, 0.18, 0.15, 0.0), R(-0.08, 0.2, 0.162, 0.008), R(0.0, 0.208, 0.17, 0.02), R(0.035, 0.21, 0.174, 0.026)], 16, 1, 1, { col: PANTS_B, capBottom: true })),
      cords: M(buildCords),
      bThigh: M(b => limb(b, D.thigh, 0.108, 0.082, 0.1, PANTS_B, 1, 1)),
      bShin: M(b => { b.ellipsoid(0.085, 0.06, 0.08, 8, 4, PANTS_B); limb(b, D.shin, 0.082, 0.062, 0.078, PANTS_B, 1, 1); }),
      bFoot: M(b => { b.at(0, -0.04, 0.05, h => h.box(0.1, 0.07, 0.26, 0x141010)); }),
      uke: M(buildUke),
      boss: buildBossParts(r)
    };
    return P;
  }

  function ball(b, c, rx, ry, rz, col, uo) {
    const n = 8, m = 6;
    const pt = (i, j) => {
      const th = (j / m) * PI, ph = (i / n) * PI * 2;
      const d = [S(th) * S(ph), C(th), S(th) * C(ph)];
      return { p: [c[0] + d[0] * rx, c[1] + d[1] * ry, c[2] + d[2] * rz], n: V3.norm([d[0] / rx, d[1] / ry, d[2] / rz]), uv: [uo[0] + (i / n) * 0.45, uo[1] + (j / m) * 0.45] };
    };
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < n; i++) {
        const a = pt(i, j), bb = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
        b.quad(a.p, bb.p, cc.p, d.p, col, [a.uv, bb.uv, cc.uv, d.uv], [a.n, bb.n, cc.n, d.n]);
      }
    }
  }

  function buildWig(b) {
    const g = rand(5);
    for (let i = 0; i < 170; i++) {
      const yaw = (g() * 2 - 1) * PI;
      const pit = -0.95 + g() * 1.45;
      if (Math.abs(yaw) < 1.05 + Math.max(0, -pit) * 0.12) continue;
      const rad = 0.017 + g() * 0.015;
      const p = headPt(yaw, pit, 1.0);
      const base = V3.add(p, V3.mul(V3.norm(p), 0.008 + rad * 0.55 + g() * 0.01));
      const k = 0.75 + 0.5 * g();
      ball(b, base, rad * 1.15, rad, rad * 1.05, [k, k, k, 0], [g() * 0.55, g() * 0.55]);
    }
    for (let i = 0; i < 46; i++) {
      const yaw = (g() < 0.5 ? -1 : 1) * (1.1 + g() * 2.0);
      const rad = 0.019 + g() * 0.013;
      const y = -0.07 - g() * 0.085;
      const rr = 0.088 + g() * 0.02;
      const k = 0.7 + 0.5 * g();
      ball(b, [S(yaw) * rr, y, C(yaw) * rr * 0.95 - 0.006], rad * 1.1, rad * 1.2, rad, [k, k, k, 0], [g() * 0.55, g() * 0.55]);
    }
  }

  const BERET = [[0.0, 0.135], [0.05, 0.132], [0.095, 0.12], [0.135, 0.098], [0.165, 0.068], [0.186, 0.036], [0.195, 0.008], [0.19, -0.016], [0.172, -0.03], [0.14, -0.032], [0.108, -0.022], [0.094, -0.004]];

  function buildBeret(b) {
    const g = rand(9);
    const waves = [];
    for (let i = 0; i < 5; i++) waves.push([2 + i, g() * PI * 2, 0.025 + g() * 0.03]);
    const NA = 40, NS = BERET.length - 1;
    const P = (a, s) => {
      const i = Math.min(NS - 1, Math.floor(s)), f = s - i;
      const q0 = BERET[i], q1 = BERET[i + 1];
      let rr = lerp(q0[0], q1[0], f), y = lerp(q0[1], q1[1], f);
      const k = rr / 0.195;
      let wob = 0;
      waves.forEach(([n, ph, amp]) => { wob += amp * S(a * n + ph); });
      rr *= 1 + wob * k;
      y += (0.022 * S(a * 3 + 1.1) + 0.014 * S(a * 5 + 0.4)) * k * k - 0.03 * Math.max(0, C(a + 0.4)) * k * k * k;
      return [S(a) * rr, y, C(a) * rr * 0.94];
    };
    const N = (a, s) => {
      const e = 0.01;
      const n = V3.cross(V3.sub(P(a, Math.min(NS, s + e)), P(a, Math.max(0, s - e))), V3.sub(P(a + e, s), P(a - e, s)));
      return V3.len(n) > 1e-12 ? V3.norm(n) : [0, 1, 0];
    };
    for (let j = 0; j < NS; j++) {
      for (let i = 0; i < NA; i++) {
        const a0 = (i / NA) * PI * 2, a1 = ((i + 1) / NA) * PI * 2;
        const cs = [[a0, j], [a1, j], [a1, j + 1], [a0, j + 1]];
        const pts = cs.map(([a, sv]) => P(a, sv));
        let ns = cs.map(([a, sv]) => N(a, sv));
        const out = V3.sub(pts[0], [0, 0.03, 0]);
        if (V3.dot(ns[0], out) < 0) ns = ns.map(n => V3.mul(n, -1));
        const uv = cs.map(([a, sv]) => [(a / (PI * 2)) * 3, sv * 0.35]);
        b.quad(pts[0], pts[1], pts[2], pts[3], 0xffffff, uv, ns);
      }
    }
  }

  function buildCollar(b) {
    [-1, 1].forEach(s => {
      const pts = [
        [s * 0.05, 0.38, 0.03], [s * 0.1, 0.362, -0.015],
        [s * 0.14, 0.318, 0.05], [s * 0.035, 0.335, 0.1],
        [s * 0.15, 0.215, 0.13], [s * 0.045, 0.28, 0.13]
      ];
      const lift = (p) => { const r = rowAt(TORSO_B, p[1]); const z = r[3] + Math.sqrt(Math.max(0, 1 - (p[0] / (r[1] + 0.02)) ** 2)) * (r[2] + 0.02); return [p[0], p[1], Math.max(p[2], z + 0.006)]; };
      const q = pts.map(lift);
      const nrm = (p) => V3.norm([p[0] * 2.5, 0.8, 1]);
      const ns = q.map(nrm);
      const quad = (i0, i1, i2, i3) => b.quad(q[i0], q[i1], q[i2], q[i3], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [ns[i0], ns[i1], ns[i2], ns[i3]]);
      quad(0, 1, 2, 3);
      quad(3, 2, 4, 5);
    });
  }

  function buildCords(b) {
    [-1, 1].forEach(s => {
      const pts = [[s * 0.012, 0.025, 0.198], [s * 0.02, -0.035, 0.2], [s * 0.016, -0.095, 0.198], [s * 0.024, -0.155, 0.19]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        b.quad([a[0] - 0.003, a[1], a[2]], [a[0] + 0.003, a[1], a[2]], [c[0] + 0.003, c[1], c[2]], [c[0] - 0.003, c[1], c[2]], 0x050505);
      }
      b.at(pts[3][0], pts[3][1], pts[3][2], h => h.ellipsoid(0.007, 0.01, 0.007, 6, 4, 0x050505));
    });
    loftUV(b, [R(0.01, 0.211, 0.176, 0.026), R(0.04, 0.213, 0.178, 0.028)], 16, 1, 1, { col: 0x0a0a0a });
  }

  function solve(pose) {
    if (pose.uke && pose.play) {
      const M = ukeMatrix(Rig.solve(pose, D), pose);
      return Rig.solve(Object.assign({}, pose, { hRw: M4.point(M, pose.play.r), hLw: M4.point(M, pose.play.l) }), D);
    }
    return Rig.solve(pose, D);
  }

  function ukeMatrix(m, pose) {
    const u = pose.uke;
    if (!u) return null;
    const x = V3.norm(u.x);
    const z = V3.norm(V3.sub(u.z, V3.mul(x, V3.dot(u.z, x))));
    return M4.mul(m.chest, Rig.basisM(u.p, x, V3.cross(z, x), z));
  }

  function draw(r, P, who, m, pose, opts) {
    const o = opts || {};
    const pass = {};
    if (o.tint) pass.tint = o.tint;
    if (o.flat) pass.flat = o.flat;
    const tex = (t) => (o.flat ? pass : Object.assign({ texture: t }, pass));
    const hm = m.head;
    r.draw(P.skull, hm, pass);
    r.draw(P.face, hm, tex(P.faceTex(pose.eyes || 'open', pose.mouth || 'shut')));
    r.draw(P.nose, hm, tex(P.faceTex(pose.eyes || 'open', pose.mouth || 'shut')));
    r.draw(P.stache, hm, tex(P.T.stache));
    r.draw(P.neck, m.neck, pass);
    const knight = who === 'knight';
    if (knight) {
      r.draw(P.coif, hm, tex(P.T.mail));
      r.draw(P.cowl, m.chest, tex(P.T.mail));
      r.draw(P.torsoMail, m.chest, tex(P.T.mail));
      r.draw(P.tabardChest, m.chest, tex(P.T.tabard));
      r.draw(P.kPelvis, m.pelvis, pass);
      r.draw(P.skirt, m.pelvis, tex(P.T.mail));
      r.draw(P.tabardLower, m.pelvis, tex(P.T.tabard));
      r.draw(P.belt, m.pelvis, tex(P.T.leather));
      r.draw(P.buckle, m.pelvis, pass);
      r.draw(P.sword, m.pelvis, pass);
    } else {
      r.draw(P.hairCap, hm, tex(P.T.curls));
      r.draw(P.wig, hm, tex(P.T.curls));
      const bt = pose.beret || [-0.01, 0.2, -0.1];
      const bm = M4.chain(hm, M4.translate(bt[0], 0.104, -0.018), M4.rotZ(bt[1]), M4.rotX(bt[2]), M4.scale(0.86, 0.9, 0.86));
      r.draw(P.beret, bm, tex(P.T.velvet));
      r.draw(P.shirt, m.chest, tex(P.T.linen));
      r.draw(P.vneck, m.chest, tex(P.T.vneck));
      r.draw(P.collar, m.chest, tex(P.T.linen));
      r.draw(P.bPelvis, m.pelvis, pass);
      r.draw(P.cords, m.pelvis, pass);
    }
    ['L', 'R'].forEach(s => {
      if (knight) {
        r.draw(P.kUpper, m['upper' + s], tex(P.T.mail));
        r.draw(P['pauldron' + s], m['upper' + s], tex(P.T.steel));
        r.draw(P.kFore, m['fore' + s], tex(P.T.mail));
      } else {
        r.draw(P.bUpper, m['upper' + s], tex(P.T.linen));
        r.draw(P.bFore, m['fore' + s], tex(P.T.linen));
      }
      const g = pose['g' + s] || 'relax';
      r.draw(P.hands[(knight ? 'k' : 'b') + s + g] || P.hands[(knight ? 'k' : 'b') + s + 'relax'], m['hand' + s], pass);
      if (o.noLegs) return;
      r.draw(knight ? P.kThigh : P.bThigh, m['thigh' + s], pass);
      r.draw(knight ? P.kShin : P.bShin, m['shin' + s], pass);
      r.draw(knight ? P.kFoot : P.bFoot, m['foot' + s], pass);
    });
    const um = ukeMatrix(m, pose);
    if (um) r.draw(P.uke, um, tex(P.T.uke));
  }

  const BOSS = [
    { part: 'cape', at: [0.72, 0.62, 3.4], scale: 1.1, turn: [0, 0.2, 0] },
    { part: 'armor', at: [0.6, 0.56, 2.7], scale: 0.78, turn: [0.15, -0.35, 0.05], pivot: [0, 1.4, 0.1] },
    { part: 'pauldron', at: [0.95, 0.36, 2.5], scale: 0.72, turn: [-0.5, 0, -0.75] },
    { part: 'helm', at: [0.62, 0.31, 2.45], scale: 0.62, turn: [0.12, -0.18, -0.12], pivot: [0, 0.08, 0] },
    { part: 'leg', at: [0.52, 0.86, 2.1], scale: 0.75, turn: [-1.05, 0.2, 0.15], pivot: [0, -0.62, 0.08] },
    { part: 'arm', from: [0.3, 0.6, 2.2], to: [0.08, 0.07, 2.15], scale: 0.85 },
    { part: 'pauldron', at: [0.2, 0.77, 1.75], scale: 1.0, turn: [-0.35, 0.1, 0.55] },
    { part: 'spear', from: [0.1, 0.1, 2.1], to: [0.97, 0.63, 1.85] }
  ];

  function camPoint(cam, aspect, fx, fy, depth) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const rt = V3.norm(V3.cross(f, [0, 1, 0]));
    const up = V3.cross(rt, f);
    const th = Math.tan((cam.fov * PI) / 360);
    return V3.add(cam.eye, V3.add(V3.mul(f, depth), V3.add(V3.mul(rt, (fx - 0.5) * 2 * th * aspect * depth), V3.mul(up, (0.5 - fy) * 2 * th * depth))));
  }

  function camBasis(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const rt = V3.norm(V3.cross(f, [0, 1, 0]));
    return { x: rt, y: V3.cross(rt, f), z: V3.mul(f, -1) };
  }

  function drawBoss(r, P, cam, opts) {
    const o = opts || {};
    const B = P.boss;
    const pass = o.flat ? { flat: o.flat } : Object.assign({ texture: B.goldTex }, o.tint ? { tint: o.tint } : {});
    const plain = o.flat ? { flat: o.flat } : (o.tint ? { tint: o.tint } : {});
    const aspect = o.aspect || 9 / 16;
    const drop = o.drop || 0;
    const cb = camBasis(cam);
    const world = (q) => camPoint(cam, aspect, q[0], q[1] - drop, q[2]);
    BOSS.forEach(it => {
      const mesh = B[it.part];
      const tex = it.part === 'cape' || it.part === 'spear' ? plain : pass;
      if (it.from) {
        const a = world(it.from), c = world(it.to);
        const d = V3.norm(V3.sub(c, a));
        const x = V3.norm(V3.cross(d, cb.z));
        if (it.part === 'spear') {
          r.draw(mesh, Rig.basisM(a, x, d, V3.cross(x, d)), tex);
        } else {
          const len = V3.len(V3.sub(c, a));
          const y = V3.mul(d, -1);
          const xx = V3.norm(V3.cross(y, cb.z));
          r.draw(mesh, M4.mul(Rig.basisM(a, xx, y, V3.cross(xx, y)), M4.scale(len / 1.08)), tex);
        }
        return;
      }
      const p = world(it.at);
      const t = it.turn || [0, 0, 0];
      const pv = it.pivot || [0, 0, 0];
      const M = M4.chain(Rig.basisM(p, cb.x, cb.y, cb.z), M4.rotY(t[1]), M4.rotX(t[0]), M4.rotZ(t[2]), M4.scale(it.scale), M4.translate(-pv[0], -pv[1], -pv[2]));
      r.draw(mesh, M, tex);
    });
  }

  function drawFallingPauldron(r, P, pos) {
    r.draw(P.boss.pauldron, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotZ(0.5), M4.rotX(-0.35)), { texture: P.boss.goldTex });
  }

  window.BuffCast = { D, H, FP, BOSS, headPt, angOf, build, solve, draw, ukeMatrix, drawBoss, drawFallingPauldron, camPoint, GRIPS };
})();
