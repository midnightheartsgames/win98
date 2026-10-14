(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh, spherePatch, tube } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.11, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.36, shX: 0.21, shY: 0.25, upper: 0.3, fore: 0.27, headY: 0.15, head: 0.105 };

  const LOOK = {
    skin: 0xe8bdac,
    hair: 0x7a5c40,
    hairHi: 0x947254,
    beard: 0x4a3426,
    tee: 0x121215,
    pants: 0x16161a,
    shoes: 0x1c1c20,
    cord: 0x0c0c0e,
    mic: 0x18181b,
    grille: 0x5a5c62,
    cable: 0x101012
  };

  const CHEST_RINGS = [
    [-0.27, 0.175, 0.13, 0.02],
    [-0.17, 0.2, 0.145, 0.03],
    [-0.06, 0.21, 0.15, 0.035],
    [0.05, 0.215, 0.155, 0.035],
    [0.15, 0.235, 0.145, 0.02],
    [0.24, 0.245, 0.135, 0.005],
    [0.3, 0.225, 0.118, 0.0],
    [0.345, 0.17, 0.095, -0.005],
    [0.375, 0.09, 0.07, 0.0]
  ];

  function chestAt(y) {
    for (let i = 0; i < CHEST_RINGS.length - 1; i++) {
      const a = CHEST_RINGS[i], b = CHEST_RINGS[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: a[1] + (b[1] - a[1]) * k, rz: a[2] + (b[2] - a[2]) * k, cz: a[3] + (b[3] - a[3]) * k };
      }
    }
    const l = CHEST_RINGS[CHEST_RINGS.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function buildChest(b) {
    loft(b, CHEST_RINGS.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, LOOK.tee)), 16, { capBottom: true });
  }

  function buildPrint(b) {
    const y0 = 0.07, y1 = 0.25, a0 = -0.72, a1 = 0.72, nu = 10, nv = 6;
    const pt = (u, v) => {
      const y = y0 + (y1 - y0) * v;
      const c = chestAt(y);
      const a = a0 + (a1 - a0) * u;
      return [S(a) * c.rx * 1.012, y, c.cz + C(a) * c.rz * 1.012];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const n = V3.norm([S(a0 + (a1 - a0) * (u0 + u1) / 2), 0, C(a0 + (a1 - a0) * (u0 + u1) / 2)]);
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), [1, 1, 1, 0.2], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [n, n, n, n]);
      }
    }
  }

  function printTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2f2f2';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(h * 0.3)}px Arial, sans-serif`;
    ctx.save();
    ctx.translate(w / 2, h * 0.36);
    ctx.scale(1, 1.25);
    ctx.fillText('GOODNICE', 0, 0);
    ctx.restore();
    for (let i = 0; i < 5; i++) {
      const y = h * (0.48 + i * 0.065);
      const half = w * (0.2 - i * 0.032);
      ctx.fillRect(w / 2 - half, y, half * 0.88, h * 0.035);
      ctx.fillRect(w / 2 + half * 0.12, y, half * 0.88, h * 0.035);
    }
    ctx.font = `bold ${Math.round(h * 0.085)}px Arial, sans-serif`;
    ctx.fillText('VERY NICE  ·  GOOD NICE', w / 2, h * 0.93);
  }

  function buildCord(b) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -PI * 0.75 + (i / 16) * PI * 1.5;
      pts.push([S(a) * 0.085, 0.35 - (1 + C(a)) * 0.045, C(a) * 0.078 + 0.012]);
    }
    tube(b, pts, pts.map(() => 0.004), 4, LOOK.cord);
    b.at(0, 0.262, 0.1, h => h.box(0.014, 0.022, 0.006, [0.55, 0.55, 0.58, 0.3]));
  }

  function buildPelvis(b) {
    const P = LOOK.pants;
    loft(b, [ring(-0.17, 0.14, 0.115, -0.01, P), ring(-0.09, 0.19, 0.15, -0.02, P), ring(-0.01, 0.2, 0.16, -0.01, P), ring(0.07, 0.19, 0.155, 0.01, P)], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b) {
    const P = LOOK.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.07, 0.074, 0, P), ring(-0.3, 0.09, 0.094, 0, P), ring(-0.12, 0.108, 0.112, 0.005, P), ring(0.05, 0.115, 0.115, 0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.072, 0.068, 0.076, 8, 5, P);
    loft(b, [ring(-D.shin + 0.02, 0.056, 0.058, 0, P), ring(-0.3, 0.064, 0.068, 0, P), ring(-0.12, 0.07, 0.074, 0.005, P), ring(0, 0.072, 0.076, 0, P)], 10, { capBottom: true });
  }

  function buildFoot(b) {
    const F = LOOK.shoes;
    b.at(0, -0.04, 0, h => h.ellipsoid(0.05, 0.045, 0.055, 7, 4, F));
    b.push(M4.translate(0, -0.065, 0.06));
    b.box(0.095, 0.06, 0.2, F, { faces: { bottom: [0.82, 0.82, 0.84, 0] } });
    b.at(0, 0.0, 0.11, h => h.ellipsoid(0.048, 0.03, 0.045, 7, 3, F));
    b.pop();
  }

  function buildUpper(b) {
    const T = LOOK.tee, Sk = LOOK.skin;
    b.ellipsoid(0.072, 0.07, 0.072, 8, 5, T);
    loft(b, [ring(-D.upper - 0.01, 0.047, 0.05, 0, Sk), ring(-0.2, 0.056, 0.059, 0, Sk), ring(-0.13, 0.058, 0.061, 0, Sk), ring(-0.13, 0.066, 0.068, 0, T), ring(-0.04, 0.071, 0.073, 0, T), ring(0.03, 0.068, 0.07, 0, T)], 10, { capBottom: true });
  }

  function buildFore(b) {
    const Sk = LOOK.skin;
    b.ellipsoid(0.05, 0.05, 0.05, 8, 5, Sk);
    loft(b, [ring(-D.fore + 0.005, 0.034, 0.037, 0, Sk), ring(-0.17, 0.043, 0.046, 0, Sk), ring(0, 0.048, 0.05, 0, Sk)], 10, { capBottom: true });
  }

  function buildHand(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.04, 0, h => h.box(0.026, 0.078, 0.072, sk));
    if (grip === 'fist' || grip === 'mic') {
      b.at(inward * 0.012, -0.088, 0.0, h => h.box(0.044, 0.042, 0.07, sk));
    } else {
      b.at(0, -0.098, 0, h => h.box(0.022, 0.05, 0.068, sk));
      b.at(inward * 0.007, -0.126, 0, h => h.box(0.019, 0.021, 0.062, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.009, -0.026, 0.043), M4.rotX(-0.5));
    b.at(0, -0.022, 0, h => h.box(0.019, 0.044, 0.019, sk));
    b.pop();
  }

  function buildHead(b) {
    const sk = LOOK.skin, R = D.head;
    b.ellipsoid(R * 0.95, R * 1.08, R * 1.0, 14, 10, sk);
    b.at(0, -R * 0.68, R * 0.3, h => h.ellipsoid(R * 0.74, R * 0.42, R * 0.66, 12, 6, sk));
    [-1, 1].forEach(s => b.at(s * R * 0.94, -R * 0.06, -R * 0.04, h => h.ellipsoid(R * 0.12, R * 0.24, R * 0.17, 6, 4, shade(sk, 0.9))));
    b.at(0, -R * 0.1, R * 0.98, h => h.ellipsoid(R * 0.16, R * 0.2, R * 0.16, 6, 4, shade(sk, 0.96)));
  }

  function buildHair(b) {
    const R = D.head, H = LOOK.hair, Hi = LOOK.hairHi;
    const side = shade(H, 0.78);
    const nu = 18, nv = 5;
    const pt = (i, j, top) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const front = C(yaw);
      const p0 = top ? 0.32 + 0.3 * Math.max(0, front) : -0.15 + 0.3 * Math.max(0, front);
      const p1 = top ? PI / 2 : 0.4 + 0.25 * Math.max(0, front);
      const pit = p0 + (p1 - p0) * (j / nv);
      const k = top ? 1.07 + 0.025 * Math.max(0, front) * (1 - j / nv) : 1.025;
      return [S(yaw) * C(pit) * R * 0.95 * k, S(pit) * R * 1.08 * k + (top ? R * 0.04 : 0), C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        if (Math.abs(-PI + ((i + 0.5) / nu) * 2 * PI) < 1.0) continue;
        b.quad(pt(i, j, false), pt(i + 1, j, false), pt(i + 1, j + 1, false), pt(i, j + 1, false), side);
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(pt(i, j, true), pt(i + 1, j, true), pt(i + 1, j + 1, true), pt(i, j + 1, true), (i + j) % 3 === 0 ? Hi : H);
    const g = rand(29);
    for (let i = 0; i < 10; i++) {
      const yaw = -0.7 + g() * 1.4;
      const pit = 0.95 + g() * 0.35;
      b.push(M4.translate(S(yaw) * C(pit) * R * 1.0, S(pit) * R * 1.15, C(yaw) * C(pit) * R * 1.02), M4.rotY(yaw), M4.rotX(-0.9 - g() * 0.4));
      b.prism(4, 0.018 + g() * 0.01, 0.01, 0, 0.003, 0.003, 0.03 + g() * 0.02, g() < 0.5 ? Hi : H);
      b.pop();
    }
  }

  const EYES = ['open', 'shut', 'squeeze'];
  const MOUTHS = ['shut', 'open', 'wide', 'grin'];

  function drawFace(eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#a07a68';
      ctx.beginPath();
      ctx.moveTo(10, 196);
      ctx.quadraticCurveTo(50, 246, 128, 250);
      ctx.quadraticCurveTo(206, 246, 246, 196);
      ctx.lineTo(248, 214);
      ctx.quadraticCurveTo(214, 256, 128, 256);
      ctx.quadraticCurveTo(42, 256, 8, 214);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7d5a4a';
      ctx.beginPath();
      ctx.moveTo(100, 188);
      ctx.quadraticCurveTo(128, 180, 156, 188);
      ctx.lineTo(152, 193);
      ctx.quadraticCurveTo(128, 187, 104, 193);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(116, 226, 24, 30);
      const ey = 112;
      ctx.strokeStyle = '#5a4030';
      ctx.lineWidth = 7;
      [[86, -1], [170, 1]].forEach(([x, s]) => {
        const lift = eyes === 'squeeze' ? 6 : 0;
        ctx.beginPath();
        ctx.moveTo(x - s * 22, ey - 22 + lift);
        ctx.quadraticCurveTo(x, ey - 31 + lift * 0.5, x + s * 22, ey - 26);
        ctx.stroke();
      });
      [86, 170].forEach(x => {
        if (eyes !== 'open') {
          ctx.strokeStyle = '#3a2620';
          ctx.lineWidth = eyes === 'squeeze' ? 5 : 4;
          ctx.beginPath();
          ctx.moveTo(x - 15, ey + 2);
          ctx.quadraticCurveTo(x, eyes === 'squeeze' ? ey - 3 : ey + 6, x + 15, ey + 2);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = '#efe6e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 14, 6.5, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5b6b78';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 6, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111014';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 2.6, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a2620';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 15, ey - 1);
        ctx.quadraticCurveTo(x, ey - 9, x + 15, ey - 1);
        ctx.stroke();
      });
      const my = 200;
      ctx.fillStyle = '#3a1616';
      ctx.strokeStyle = '#8a4a46';
      ctx.lineWidth = 4;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(110, my);
        ctx.quadraticCurveTo(128, my + 3, 146, my);
        ctx.stroke();
      } else if (mouth === 'grin') {
        ctx.beginPath();
        ctx.moveTo(106, my - 2);
        ctx.quadraticCurveTo(130, my + 10, 152, my - 8);
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 20 : 9;
        ctx.beginPath();
        ctx.ellipse(128, my + (mouth === 'wide' ? 8 : 2), mouth === 'wide' ? 19 : 15, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e8ded6';
        ctx.fillRect(116, my - hh + (mouth === 'wide' ? 11 : 4), 24, 4);
      }
      ctx.restore();
    };
  }

  function buildMic(b) {
    b.prism(12, 0.016, 0.016, -0.17, 0.022, 0.022, 0.0, LOOK.mic, { capBottom: true });
    b.at(0, 0.0, 0, h => h.prism(12, 0.025, 0.025, 0, 0.028, 0.028, 0.03, shade(LOOK.mic, 1.3)));
    b.at(0, 0.058, 0, h => h.ellipsoid(0.031, 0.034, 0.031, 10, 6, LOOK.grille));
  }

  function buildSegment(b) {
    b.prism(5, 0.0045, 0.0045, -1, 0.0045, 0.0045, 0, LOOK.cable);
  }

  function build(r) {
    const faces = {};
    EYES.forEach(e => MOUTHS.forEach(m => { faces[e + '-' + m] = r.texture(256, drawFace(e, m), { clamp: true }); }));
    const R = D.head;
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'fist', 'mic'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, s, g)); }));
    return {
      faces,
      print: r.texture(256, printTex, { clamp: true, height: 128 }),
      chest: mesh(r, buildChest),
      printMesh: mesh(r, buildPrint),
      cord: mesh(r, buildCord),
      pelvis: mesh(r, buildPelvis),
      neck: mesh(r, b => loft(b, [ring(-0.08, 0.085, 0.082, 0.01, LOOK.skin), ring(0.11, 0.075, 0.072, 0.02, LOOK.skin)], 10)),
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => spherePatch(b, R * 0.955, R * 1.085, R * 1.006, -0.98, 0.98, -0.8, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      upper: mesh(r, buildUpper),
      fore: mesh(r, buildFore),
      hands,
      thigh: mesh(r, buildThigh),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot),
      mic: mesh(r, buildMic),
      segment: mesh(r, buildSegment)
    };
  }

  function faceKey(eyes, mouth) {
    return (EYES.includes(eyes) ? eyes : 'open') + '-' + (MOUTHS.includes(mouth) ? mouth : 'shut');
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  function micFrame(m, p) {
    const hand = m.handR;
    const wrist = m.pts.wristR;
    const grip = M4.point(hand, [0.012, -0.095, 0.0]);
    const head = m.head;
    const mouth = M4.point(head, [0, -D.head * 0.55, D.head * 1.25]);
    const toMouth = V3.sub(mouth, grip);
    const near = clamp(1.6 - V3.len(toMouth) * 4, 0, 1) * (p.micUp === undefined ? 1 : p.micUp);
    const rest = V3.norm(V3.add(V3.mul(V3.norm(V3.sub(grip, wrist)), 0.4), [hand[8], hand[9], hand[10]]));
    const dir = V3.norm(V3.add(V3.mul(rest, 1 - near), V3.mul(V3.norm(toMouth), near)));
    const base = V3.add(grip, V3.mul(dir, 0.08));
    let x = V3.cross(dir, [0, 0, 1]);
    x = V3.len(x) < 1e-3 ? [1, 0, 0] : V3.norm(x);
    const z = V3.cross(x, dir);
    return { base, dir, m: Rig.basisM(base, x, dir, z) };
  }

  function cablePoints(mic, floor) {
    const start = V3.add(mic.base, V3.mul(mic.dir, -0.17));
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const sag = S(k * PI) * 0.18;
      pts.push([start[0] + (floor[0] - start[0]) * k, start[1] + (floor[1] - start[1]) * Math.pow(k, 0.7) - sag * (1 - k), start[2] + (floor[2] - start[2]) * k]);
    }
    return pts;
  }

  function draw(r, V, m, p, opts) {
    const o = opts || {};
    const pass = o.tint ? { tint: o.tint } : {};
    r.draw(V.pelvis, m.pelvis, pass);
    r.draw(V.chest, m.chest, pass);
    r.draw(V.printMesh, m.chest, Object.assign({ texture: V.print }, pass));
    r.draw(V.cord, m.chest, pass);
    r.draw(V.neck, m.neck, pass);
    r.draw(V.head, m.head, pass);
    r.draw(V.hair, m.head, pass);
    r.draw(V.face, m.head, Object.assign({ texture: V.faces[faceKey(p.eyes, p.mouth)] }, pass));
    ['L', 'R'].forEach(s => {
      r.draw(V.upper, m['upper' + s], pass);
      r.draw(V.fore, m['fore' + s], pass);
      r.draw(V.hands[s + (p['g' + s] || 'open')], m['hand' + s], pass);
      r.draw(V.thigh, m['thigh' + s], pass);
      r.draw(V.shin, m['shin' + s], pass);
      r.draw(V.foot, m['foot' + s], pass);
    });
    const mic = micFrame(m, p);
    r.draw(V.mic, mic.m, pass);
    const pts = cablePoints(mic, p.cableEnd || [0.4, 0.02, -0.6]);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = V3.len(V3.sub(b, a));
      if (len < 1e-4) continue;
      r.draw(V.segment, M4.mul(Rig.boneM(a, b, [0, 0, 1]), M4.scale(1, len, 1)), pass);
    }
  }

  window.NiceCast = { D, LOOK, solve, build, draw, micFrame };
})();
