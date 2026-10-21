(function () {
  const { M4, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.18, hipY: -0.05, thigh: 0.44, shin: 0.43, chestY: 0.12, neckY: 0.27, shX: 0.33, shY: 0.21, upper: 0.29, fore: 0.25, headY: 0.11, head: 0.115 };

  const LOOK = {
    skin: 0xe2baa8,
    skinShade: 0xc69884,
    hair: 0x32241c,
    hairHi: 0x46342a,
    beard: 0x4a382c,
    tee: 0x111215,
    leather: 0x1c2028,
    leatherLapel: 0x272d38,
    leatherIn: 0x121418,
    zipLine: 0x4c525c,
    zip: 0xa4aab4,
    pants: 0x111216,
    shoe: 0x15161a,
    sole: 0xeaece8
  };

  const CHEST_RINGS = [
    [-0.3, 0.24, 0.16, 0.0],
    [-0.22, 0.28, 0.195, 0.02],
    [-0.12, 0.305, 0.22, 0.035],
    [0.0, 0.32, 0.225, 0.04],
    [0.12, 0.325, 0.215, 0.025],
    [0.22, 0.31, 0.195, 0.01],
    [0.28, 0.24, 0.155, -0.005],
    [0.32, 0.13, 0.1, 0.0]
  ];

  function chestAt(y) {
    for (let i = 0; i < CHEST_RINGS.length - 1; i++) {
      const a = CHEST_RINGS[i], b = CHEST_RINGS[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: lerp(a[1], b[1], k), rz: lerp(a[2], b[2], k), cz: lerp(a[3], b[3], k) };
      }
    }
    const l = CHEST_RINGS[CHEST_RINGS.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function teeTex(ctx, w, h) {
    ctx.fillStyle = '#111215';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    const cx = w * 0.5, cy = h * 0.42, R = w * 0.36;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.clip();
    for (let y = cy - R; y <= cy + R; y += 5) {
      ctx.fillStyle = (Math.floor(y / 5) % 2 === 0) ? '#b6906c' : '#26201a';
      ctx.fillRect(cx - R, y, R * 2, 3.2);
    }
    ctx.fillStyle = '#d4b292';
    ctx.fillRect(cx - w * 0.08, cy - R * 0.48, w * 0.16, R * 0.85);
    ctx.fillStyle = '#6e4c36';
    ctx.fillRect(cx - w * 0.016, cy - R * 0.38, w * 0.032, R * 0.65);
    ctx.restore();

    ctx.strokeStyle = '#9c7c5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -PI * 0.85, -PI * 0.15);
    ctx.stroke();

    ctx.fillStyle = '#111215';
    ctx.fillRect(w * 0.06, h * 0.62, w * 0.88, h * 0.24);
    ctx.strokeStyle = '#8e745c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.63);
    ctx.quadraticCurveTo(cx, h * 0.59, w * 0.9, h * 0.63);
    ctx.moveTo(w * 0.12, h * 0.82);
    ctx.quadraticCurveTo(cx, h * 0.78, w * 0.88, h * 0.82);
    ctx.stroke();

    ctx.fillStyle = '#dedad2';
    ctx.font = `bold ${Math.round(h * 0.155)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('D E N I M', cx, h * 0.765);
  }

  function buildChest(b) {
    const rings = CHEST_RINGS.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, y > 0.275 ? LOOK.skin : LOOK.tee));
    loft(b, rings, 16, { capBottom: true, hard: true });
  }

  function buildTeeLogo(b) {
    const nu = 10, nv = 8;
    const x0 = -0.15, x1 = 0.15, y0 = -0.06, y1 = 0.24;
    const pt = (u, v) => {
      const x = lerp(x0, x1, u), y = lerp(y1, y0, v);
      const c = chestAt(y);
      const k = clamp(x / c.rx, -0.95, 0.95);
      const z = c.cz + c.rz * Math.sqrt(1 - k * k) + 0.005;
      return [x, y, z];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), [1, 1, 1, 0], [[u0, 1 - v0], [u1, 1 - v0], [u1, 1 - v1], [u0, 1 - v1]]);
      }
    }
  }

  const JACKET = [
    [-0.25, 0.34, 0.23, 0.02],
    [-0.16, 0.36, 0.25, 0.035],
    [-0.05, 0.38, 0.26, 0.04],
    [0.06, 0.39, 0.255, 0.035],
    [0.16, 0.385, 0.235, 0.015],
    [0.23, 0.355, 0.21, 0.0],
    [0.28, 0.28, 0.17, -0.008],
    [0.315, 0.175, 0.12, -0.006]
  ];

  function jacketOpen(y) {
    return lerp(0.44, 0.34, clamp((y + 0.25) / 0.56, 0, 1));
  }

  function jacketPt(r, ang, add) {
    return [S(ang) * (r[1] + add), r[0], r[3] + C(ang) * (r[2] + add)];
  }

  function buildJacket(b) {
    const NU = 18;
    const shell = (add, col, inner) => {
      for (let j = 0; j < JACKET.length - 1; j++) {
        const r0 = JACKET[j], r1 = JACKET[j + 1];
        const o0 = jacketOpen(r0[0]), o1 = jacketOpen(r1[0]);
        for (let i = 0; i < NU; i++) {
          const a = (o, u) => o + (PI * 2 - 2 * o) * u;
          const A = jacketPt(r0, a(o0, i / NU), add), B = jacketPt(r0, a(o0, (i + 1) / NU), add);
          const Cc = jacketPt(r1, a(o1, (i + 1) / NU), add), Dd = jacketPt(r1, a(o1, i / NU), add);
          const c = (!inner && (i < 4 || i >= NU - 4)) ? LOOK.leatherLapel : col;
          if (inner) b.quad(B, A, Dd, Cc, c); else b.quad(A, B, Cc, Dd, c);
        }
      }
    };
    shell(0, LOOK.leather, false);
    shell(-0.01, LOOK.leatherIn, true);

    for (let j = 0; j < JACKET.length - 1; j++) {
      const r0 = JACKET[j], r1 = JACKET[j + 1];
      [-1, 1].forEach(s => {
        const e0 = jacketPt(r0, s * jacketOpen(r0[0]), 0.002), e1 = jacketPt(r1, s * jacketOpen(r1[0]), 0.002);
        const w0 = jacketPt(r0, s * (jacketOpen(r0[0]) + 0.018), 0.004), w1 = jacketPt(r1, s * (jacketOpen(r1[0]) + 0.018), 0.004);
        if (s > 0) b.quad(e0, w0, w1, e1, LOOK.zipLine); else b.quad(w0, e0, e1, w1, LOOK.zipLine);
      });
    }

    const rBot = JACKET[0];
    [-1, 1].forEach(s => {
      const pZip = jacketPt(rBot, s * jacketOpen(rBot[0]), 0.006);
      b.at(pZip[0], pZip[1] - 0.012, pZip[2], h => h.box(0.02, 0.026, 0.01, LOOK.zip));
    });

    const N = 14;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const span = (u) => 0.38 + (PI * 2 - 0.76) * u;
      const a0 = span(u0), a1 = span(u1);
      const bot = (a) => [S(a) * 0.17, 0.305, -0.006 + C(a) * 0.12];
      const top = (a) => [S(a) * 0.18, 0.355, -0.006 + C(a) * 0.125];
      b.quad(bot(a0), bot(a1), top(a1), top(a0), LOOK.leatherLapel);
      b.quad(top(a0), top(a1), bot(a1), bot(a0), LOOK.leatherIn);
    }
  }

  function buildPelvis(b) {
    const P = LOOK.pants;
    loft(b, [
      ring(-0.18, 0.22, 0.15, -0.01, P),
      ring(-0.09, 0.305, 0.21, -0.02, P),
      ring(-0.01, 0.325, 0.225, -0.01, P),
      ring(0.06, 0.32, 0.22, 0.0, LOOK.tee)
    ], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b) {
    const P = LOOK.pants;
    loft(b, [
      ring(-D.thigh - 0.02, 0.11, 0.102, 0.0, P),
      ring(-0.28, 0.138, 0.125, 0.0, P),
      ring(-0.1, 0.16, 0.148, 0.01, P),
      ring(0.05, 0.165, 0.152, 0.0, P)
    ], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.11, 0.08, 0.1, 8, 5, P);
    loft(b, [
      ring(-D.shin + 0.03, 0.096, 0.09, 0.0, P),
      ring(-0.28, 0.102, 0.096, 0.0, P),
      ring(-0.12, 0.108, 0.1, 0.01, P),
      ring(0.0, 0.11, 0.102, 0.0, P)
    ], 10, { capBottom: true });
  }

  function buildFoot(b) {
    b.at(0, -0.04, 0.02, h => h.ellipsoid(0.07, 0.05, 0.082, 8, 4, LOOK.shoe));
    b.push(M4.translate(0, -0.05, 0.075));
    b.box(0.13, 0.068, 0.25, LOOK.shoe);
    b.at(0, -0.038, 0.004, h => h.box(0.138, 0.028, 0.262, LOOK.sole));
    b.at(0, 0.0, 0.105, h => h.ellipsoid(0.064, 0.036, 0.055, 7, 3, LOOK.shoe));
    b.pop();
  }

  function buildUpper(b) {
    const L = LOOK.leather;
    b.ellipsoid(0.13, 0.105, 0.118, 8, 5, L);
    loft(b, [
      ring(-D.upper - 0.01, 0.092, 0.086, 0, L),
      ring(-0.18, 0.108, 0.098, 0, L),
      ring(-0.04, 0.12, 0.11, 0, L),
      ring(0.03, 0.115, 0.105, 0, L)
    ], 10, { capBottom: true });
  }

  function buildFore(b) {
    const L = LOOK.leather;
    b.ellipsoid(0.094, 0.08, 0.088, 8, 5, L);
    loft(b, [
      ring(-D.fore + 0.02, 0.072, 0.068, 0, L),
      ring(-0.15, 0.084, 0.078, 0, L),
      ring(0.0, 0.09, 0.084, 0, L)
    ], 10, { capBottom: true });
    b.at(0, -D.fore + 0.028, 0, h => h.prism(10, 0.074, 0.07, -0.02, 0.072, 0.068, 0.02, LOOK.leatherLapel));
  }

  function buildHand(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    if (grip === 'pocket') {
      b.at(inward * 0.015, -0.04, 0.02, h => h.box(0.075, 0.065, 0.075, sk));
      [-0.022, 0, 0.022].forEach(x => b.at(inward * 0.028 + x * 0.5, -0.075, 0.025, h => h.box(0.022, 0.032, 0.04, shade(sk, 0.92))));
      return;
    }
    if (grip === 'wave') {
      b.at(0, -0.055, 0, h => h.box(0.11, 0.095, 0.03, sk));
      [-0.042, -0.014, 0.014, 0.042].forEach((x, i) => {
        const len = i === 1 || i === 2 ? 0.088 : 0.076;
        b.push(M4.translate(x, -0.098, 0), M4.rotZ((x / 0.042) * 0.16));
        b.at(0, -len * 0.5, 0, h => h.box(0.023, len, 0.024, sk));
        b.pop();
      });
      b.push(M4.translate(inward * 0.06, -0.042, 0.006), M4.rotZ(inward * 0.72));
      b.at(0, -0.038, 0, h => h.box(0.026, 0.075, 0.024, sk));
      b.pop();
      return;
    }
    b.at(0, -0.045, 0, h => h.box(0.04, 0.09, 0.088, sk));
    b.at(0, -0.115, 0, h => h.box(0.032, 0.058, 0.082, sk));
    b.push(M4.translate(inward * 0.01, -0.03, 0.05), M4.rotX(-0.5));
    b.at(0, -0.025, 0, h => h.box(0.024, 0.05, 0.024, sk));
    b.pop();
  }

  function buildHead(b) {
    const sk = LOOK.skin, R = D.head;
    b.ellipsoid(R * 1.06, R * 1.0, R * 1.0, 14, 10, sk);
    [-1, 1].forEach(s => b.at(s * R * 1.02, -R * 0.05, -R * 0.04, h => h.ellipsoid(R * 0.12, R * 0.22, R * 0.15, 6, 4, shade(sk, 0.88))));
    b.at(0, -R * 0.08, R * 0.98, h => h.ellipsoid(R * 0.18, R * 0.19, R * 0.15, 6, 4, shade(sk, 0.95)));
  }

  function buildHair(b) {
    const R = D.head, H = LOOK.hair, Hi = LOOK.hairHi;
    const nu = 18, nv = 6;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.95) return 0.48 - 0.05 * C(yaw * 2);
      if (a < 1.7) return 0.2;
      return -0.38;
    };
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const k = 1.032;
      return [S(yaw) * C(pit) * R * 1.06 * k, S(pit) * R * 1.01 * k + R * 0.015, C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), (i + j) % 3 === 0 ? Hi : H);
      }
    }
  }

  const EYES = ['open', 'half', 'shut', 'side'];
  const MOUTHS = ['shut', 'open', 'wide', 'smirk'];

  function drawFace(eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.fillStyle = 'rgba(195, 110, 96, 0.14)';
      [64, 192].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 134, 26, 15, 0, 0, PI * 2); ctx.fill(); });

      ctx.fillStyle = 'rgba(68, 50, 38, 0.34)';
      ctx.beginPath();
      ctx.ellipse(128, 232, 68, 22, 0, 0, PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(72, 52, 40, 0.28)';
      ctx.beginPath();
      ctx.ellipse(128, 178, 30, 6, 0, 0, PI * 2);
      ctx.fill();

      const ey = 92;
      ctx.strokeStyle = '#36261c';
      ctx.lineWidth = 7.5;
      [[80, -1], [176, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        ctx.moveTo(x - s * 25, ey - 17);
        ctx.quadraticCurveTo(x, ey - 23, x + s * 23, ey - 18);
        ctx.stroke();
      });

      [80, 176].forEach(x => {
        if (eyes === 'shut') {
          ctx.strokeStyle = '#34241c';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - 17, ey + 2);
          ctx.quadraticCurveTo(x, ey + 6, x + 17, ey + 2);
          ctx.stroke();
          return;
        }
        const tall = eyes === 'half' ? 4.8 : 7.8;
        const px = eyes === 'side' ? x - 5 : x;
        ctx.fillStyle = '#f0e8e2';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 17.5, tall, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#48382e';
        ctx.beginPath();
        ctx.arc(px, ey + 2, Math.min(7.2, tall + 0.6), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#121012';
        ctx.beginPath();
        ctx.arc(px, ey + 2, 3.1, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#32221a';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 17, ey + 2 - tall * 0.55);
        ctx.quadraticCurveTo(x, ey - tall - 2, x + 17, ey + 2 - tall * 0.55);
        ctx.stroke();
      });

      ctx.fillStyle = 'rgba(145, 92, 78, 0.42)';
      ctx.beginPath();
      ctx.ellipse(128, 144, 16, 6.5, 0, 0, PI * 2);
      ctx.fill();

      const my = 198;
      ctx.fillStyle = '#2e1416';
      ctx.strokeStyle = '#744642';
      ctx.lineWidth = 4.2;
      if (mouth === 'shut' || mouth === 'smirk') {
        ctx.beginPath();
        ctx.moveTo(102, my);
        ctx.quadraticCurveTo(128, mouth === 'smirk' ? my + 4 : my + 1.5, 154, mouth === 'smirk' ? my - 2 : my);
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 13 : 7;
        const ww = mouth === 'wide' ? 22 : 16;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, ww, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e6ded6';
        ctx.fillRect(114, my - hh + 3.5, 28, mouth === 'wide' ? 4 : 2.5);
      }
      ctx.restore();
    };
  }

  function build(r) {
    const faces = {};
    EYES.forEach(e => MOUTHS.forEach(m => { faces[e + '-' + m] = r.texture(256, drawFace(e, m), { clamp: true }); }));
    const R = D.head;
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'pocket', 'wave'].forEach(gr => { hands[s + gr] = mesh(r, b => buildHand(b, s, gr)); }));
    return {
      faces,
      teeTex: r.texture(256, teeTex, { clamp: true }),
      chest: mesh(r, buildChest),
      teeLogo: mesh(r, buildTeeLogo),
      jacket: mesh(r, buildJacket),
      pelvis: mesh(r, buildPelvis),
      neck: mesh(r, b => loft(b, [ring(-0.08, 0.12, 0.1, 0.01, LOOK.skin), ring(0.08, 0.11, 0.09, 0.02, LOOK.skin)], 10)),
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => spherePatch(b, R * 1.066, R * 1.006, R * 1.008, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      upper: mesh(r, buildUpper),
      fore: mesh(r, buildFore),
      hands,
      thigh: mesh(r, buildThigh),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot)
    };
  }

  function faceKey(p) {
    const e = EYES.includes(p.eyes) ? p.eyes : 'open';
    const m = MOUTHS.includes(p.mouth) ? p.mouth : 'shut';
    return e + '-' + m;
  }

  function draw(r, V, m, p, opts) {
    const o = opts || {};
    const pass = o.alpha ? { blend: true, alpha: o.alpha, tint: o.tint || [0.65, 0.67, 0.72] } : (o.tint ? { tint: o.tint } : {});
    const wideBody = M4.scale(1.22, 1, 1.04);
    r.draw(V.pelvis, M4.mul(m.pelvis, wideBody), pass);
    r.draw(V.chest, M4.mul(m.chest, wideBody), pass);
    if (!o.noFace) r.draw(V.teeLogo, M4.mul(m.chest, wideBody), Object.assign({ texture: V.teeTex }, pass));
    r.draw(V.jacket, M4.mul(m.chest, wideBody), pass);
    r.draw(V.neck, M4.mul(m.neck, M4.scale(1.3, 1, 1.08)), pass);
    const hm = M4.chain(m.head, M4.translate(0, 0.005, 0.008), M4.scale(1.56, 1.02, 1.18));
    r.draw(V.head, hm, pass);
    r.draw(V.hair, hm, pass);
    if (!o.noFace) r.draw(V.face, hm, Object.assign({ texture: V.faces[faceKey(p)] }, pass));
    ['L', 'R'].forEach(s => {
      r.draw(V.upper, m['upper' + s], pass);
      r.draw(V.fore, m['fore' + s], pass);
      const grip = p['g' + s] || 'pocket';
      r.draw(V.hands[s + grip] || V.hands[s + 'pocket'], m['hand' + s], pass);
      r.draw(V.thigh, m['thigh' + s], pass);
      r.draw(V.shin, m['shin' + s], pass);
      r.draw(V.foot, m['foot' + s], pass);
    });
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  window.PamparamCast = { D, LOOK, solve, build, draw, chestAt };
})();
