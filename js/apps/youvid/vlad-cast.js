(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.24, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.155, head: 0.11 };

  const LOOK = {
    skin: 0xd9ae9e,
    belly: 0xe6c8bc,
    skinShade: 0xc08a78,
    hair: 0x5e4632,
    hairHi: 0x7a5c42,
    beard: 0x4f392a,
    hoodie: 0x1d1c21,
    hood: 0x16151a,
    tee: 0x161619,
    pants: 0x3a3b41,
    waist: 0x2a2b30,
    logo: 0x8d9097,
    zip: 0xa9aab0,
    phone: 0x111114,
    screen: [0.86, 0.92, 1.0, 1]
  };

  const CHEST_RINGS = [
    [-0.33, 0.12, 0.1, 0.0],
    [-0.3, 0.2, 0.17, 0.02],
    [-0.25, 0.265, 0.215, 0.04],
    [-0.17, 0.32, 0.26, 0.07],
    [-0.06, 0.35, 0.29, 0.09],
    [0.05, 0.35, 0.28, 0.07],
    [0.14, 0.335, 0.25, 0.03],
    [0.22, 0.31, 0.22, 0.0],
    [0.28, 0.27, 0.19, -0.015],
    [0.33, 0.21, 0.155, -0.02],
    [0.36, 0.14, 0.115, -0.012],
    [0.38, 0.1, 0.09, 0.0]
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

  const HEM = -0.06;
  const WAIST = -0.15;

  function buildChest(b, top, hem) {
    const colorAt = (y) => (y < WAIST ? LOOK.pants : hem !== undefined && y < hem ? LOOK.belly : top);
    const cuts = [WAIST].concat(hem !== undefined ? [hem] : []);
    const rings = [];
    let next = 0;
    CHEST_RINGS.forEach(([y, rx, rz, cz]) => {
      while (next < cuts.length && y > cuts[next]) {
        const cy = cuts[next];
        const c = chestAt(cy);
        rings.push(ring(cy, c.rx, c.rz, c.cz, colorAt(cy - 0.001)), ring(cy, c.rx * 1.015, c.rz * 1.015, c.cz, colorAt(cy + 0.001)));
        next++;
      }
      rings.push(ring(y, rx, rz, cz, colorAt(y)));
    });
    loft(b, rings, 14, { capBottom: true, hard: true });
  }

  function surfaceZ(y, x) {
    const r = chestAt(y);
    const k = clamp(x / r.rx, -0.98, 0.98);
    return r.cz + r.rz * Math.sqrt(1 - k * k);
  }

  function buildHoodieDetails(b, from) {
    const zip = LOOK.zip;
    const start = from === undefined ? 0.02 : from + 0.02;
    const step = (0.35 - start) / 6;
    for (let i = 0; i < 6; i++) {
      const y0 = start + i * step, y1 = y0 + step;
      const z0 = surfaceZ(y0, 0) + 0.004, z1 = surfaceZ(y1, 0) + 0.004;
      b.quad([-0.006, y0, z0], [0.006, y0, z0], [0.006, y1, z1], [-0.006, y1, z1], zip);
    }
    const ly = 0.2, lx = 0.14;
    const lz = surfaceZ(ly, lx) + 0.005;
    const tilt = -Math.atan2(lx, 0.22);
    b.push(M4.translate(lx, ly, lz), M4.rotY(-tilt * 0.6));
    K.discXY(b, 0, 0, 0, 0.024, 8, LOOK.logo);
    b.pop();
  }

  function buildHood(b) {
    const H = LOOK.hood;
    b.at(0, 0.33, -0.14, h => h.ellipsoid(0.16, 0.08, 0.1, 10, 5, H));
    [-1, 1].forEach(s => b.at(s * 0.115, 0.36, -0.03, h => h.ellipsoid(0.06, 0.05, 0.105, 8, 4, H)));
  }

  function buildPelvis(b) {
    const P = LOOK.pants, W = LOOK.waist;
    const rings = [
      ring(-0.17, 0.17, 0.14, -0.01, P),
      ring(-0.09, 0.275, 0.215, -0.03, P),
      ring(-0.01, 0.3, 0.235, -0.02, P),
      ring(0.04, 0.3, 0.235, 0.0, P),
      ring(0.04, 0.303, 0.238, 0.0, W),
      ring(0.08, 0.295, 0.232, 0.01, W)
    ];
    loft(b, rings, 14, { capBottom: true, capTop: true });
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.15, -0.02, -0.235), M4.rotY(PI));
      K.discXY(b, 0, 0, 0, 0.035, 8, shade(P, 0.55));
      b.pop();
    });
  }

  function buildThigh(b) {
    const P = LOOK.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.082, 0.086, 0.0, P), ring(-0.3, 0.108, 0.112, 0.0, P), ring(-0.12, 0.132, 0.138, 0.01, P), ring(0.05, 0.14, 0.14, 0.0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.08, 0.075, 0.084, 8, 5, P);
    loft(b, [ring(-D.shin + 0.02, 0.058, 0.06, 0.0, shade(P, 0.92)), ring(-D.shin + 0.06, 0.06, 0.062, 0.0, P), ring(-0.3, 0.068, 0.072, 0.0, P), ring(-0.12, 0.076, 0.08, 0.01, P), ring(0.0, 0.078, 0.082, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b) {
    const F = LOOK.skin;
    b.at(0, -0.035, 0.0, h => h.ellipsoid(0.047, 0.045, 0.05, 7, 4, F));
    b.push(M4.translate(0, -0.06, 0.06));
    b.box(0.085, 0.05, 0.17, F, { faces: { bottom: shade(F, 0.8) } });
    b.at(0, 0.0, 0.1, h => h.ellipsoid(0.046, 0.026, 0.04, 7, 3, shade(F, 0.96)));
    b.pop();
  }

  function buildUpper(b, kind) {
    const top = kind === 'tee' ? LOOK.tee : LOOK.hoodie;
    const lower = kind === 'tee' ? LOOK.skin : LOOK.hoodie;
    b.ellipsoid(0.095, 0.085, 0.095, 8, 5, top);
    const rings = [ring(-D.upper - 0.01, 0.063, 0.066, 0, lower), ring(-0.18, 0.074, 0.077, 0, lower)];
    if (kind === 'tee') rings.push(ring(-0.13, 0.075, 0.078, 0, lower), ring(-0.13, 0.083, 0.085, 0, top));
    rings.push(ring(-0.04, 0.084, 0.086, 0, top), ring(0.03, 0.08, 0.082, 0, top));
    loft(b, rings, 10, { capBottom: true });
  }

  function buildFore(b, kind) {
    const col = kind === 'tee' ? [1, 1, 1, 0] : LOOK.hoodie;
    b.ellipsoid(0.066, 0.066, 0.066, 8, 5, kind === 'tee' ? LOOK.skin : col);
    loft(b, [ring(-D.fore + 0.005, 0.047, 0.05, 0, col), ring(-0.16, 0.058, 0.061, 0, col), ring(0.0, 0.063, 0.065, 0, col)], 10, { capBottom: true, uv: kind === 'tee' });
    if (kind !== 'tee') b.at(0, -D.fore + 0.02, 0, h => h.prism(10, 0.052, 0.055, -0.02, 0.05, 0.053, 0.02, shade(LOOK.hoodie, 0.75)));
  }

  function buildHand(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.045, 0, h => h.box(0.03, 0.09, 0.085, sk));
    if (grip === 'fist') {
      b.at(inward * 0.012, -0.1, 0.0, h => h.box(0.05, 0.045, 0.08, sk));
    } else if (grip === 'phone') {
      b.at(inward * 0.018, -0.1, 0.0, h => h.box(0.03, 0.05, 0.075, sk));
      b.at(inward * 0.012, -0.05, 0.045, h => h.box(0.028, 0.05, 0.022, sk));
    } else if (grip === 'point') {
      b.at(inward * 0.012, -0.095, -0.012, h => h.box(0.045, 0.04, 0.06, sk));
      b.at(0, -0.12, 0.03, h => h.box(0.022, 0.075, 0.022, sk));
    } else {
      b.at(0, -0.115, 0, h => h.box(0.026, 0.06, 0.08, sk));
      b.at(inward * 0.008, -0.15, 0, h => h.box(0.022, 0.025, 0.072, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.01, -0.03, 0.05), M4.rotX(-0.5));
    b.at(0, -0.025, 0, h => h.box(0.022, 0.05, 0.022, sk));
    b.pop();
  }

  function buildHead(b) {
    const sk = LOOK.skin, R = D.head;
    b.ellipsoid(R * 0.98, R * 1.06, R * 1.0, 14, 10, sk);
    b.at(0, -R * 0.62, R * 0.28, h => h.ellipsoid(R * 0.86, R * 0.52, R * 0.72, 12, 6, LOOK.beard));
    b.at(0, -R * 0.86, R * 0.02, h => h.ellipsoid(R * 0.7, R * 0.4, R * 0.62, 10, 5, shade(LOOK.beard, 0.92)));
    [-1, 1].forEach(s => b.at(s * R * 0.96, -R * 0.06, -R * 0.04, h => h.ellipsoid(R * 0.12, R * 0.24, R * 0.17, 6, 4, shade(sk, 0.86))));
    b.at(0, -R * 0.12, R * 0.97, h => h.ellipsoid(R * 0.17, R * 0.2, R * 0.16, 6, 4, shade(sk, 0.95)));
  }

  function buildHair(b) {
    const R = D.head, H = LOOK.hair, Hi = LOOK.hairHi;
    const g = rand(17);
    const nu = 18, nv = 6;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.9) return 0.62 - 0.1 * C(yaw * 2);
      if (a < 1.7) return 0.3;
      return -0.35;
    };
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const k = 1.05 + (j > 0 && j < nv ? 0.03 * S(i * 2.3 + j * 1.7) : 0.0);
      return [S(yaw) * C(pit) * R * 0.98 * k, S(pit) * R * 1.06 * k + R * 0.02, C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), (i + j) % 4 === 0 ? Hi : H);
    for (let i = 0; i < 16; i++) {
      const yaw = -1.6 + g() * 3.2;
      const pit = 0.55 + g() * 0.5;
      const at = [S(yaw) * C(pit) * R * 1.02, S(pit) * R * 1.08, C(yaw) * C(pit) * R * 1.02 - 0.01];
      b.push(M4.translate(at[0], at[1], at[2]), M4.rotY(yaw), M4.rotX(-(PI / 2 - pit) * 0.7 - 0.3 - g() * 0.5), M4.rotZ((g() - 0.5) * 0.9));
      b.prism(4, 0.022 + g() * 0.012, 0.012, 0, 0.003, 0.003, 0.02 + g() * 0.025, g() < 0.4 ? Hi : H);
      b.pop();
    }
  }

  const FACE_EYES = ['open', 'half', 'shut'];
  const FACE_MOUTHS = ['shut', 'open', 'wide'];

  function drawFace(eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(200, 96, 86, 0.18)';
      [62, 194].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 126, 26, 16, 0, 0, PI * 2); ctx.fill(); });
      const beard = 'rgba(104, 76, 54, 0.92)';
      ctx.fillStyle = beard;
      ctx.beginPath();
      ctx.moveTo(4, 118);
      ctx.quadraticCurveTo(26, 168, 72, 176);
      ctx.quadraticCurveTo(104, 168, 128, 172);
      ctx.quadraticCurveTo(152, 168, 184, 176);
      ctx.quadraticCurveTo(230, 168, 252, 118);
      ctx.lineTo(256, 256);
      ctx.lineTo(0, 256);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(92, 66, 46, 0.9)';
      ctx.beginPath();
      ctx.moveTo(92, 186);
      ctx.quadraticCurveTo(128, 172, 164, 186);
      ctx.quadraticCurveTo(128, 182, 92, 186);
      ctx.fill();
      const ey = 70;
      ctx.strokeStyle = '#4e3a2a';
      ctx.lineWidth = 7;
      [[82, -1], [174, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        ctx.moveTo(x - s * 22, ey - 22);
        ctx.quadraticCurveTo(x, ey - 30, x + s * 22, ey - 24);
        ctx.stroke();
      });
      [82, 174].forEach(x => {
        if (eyes === 'shut') {
          ctx.strokeStyle = '#3c2a24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - 15, ey + 1);
          ctx.quadraticCurveTo(x, ey + 6, x + 15, ey + 1);
          ctx.stroke();
          return;
        }
        const tall = eyes === 'half' ? 3.5 : 6.5;
        ctx.fillStyle = '#efe6e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 14, tall, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5d6a74';
        ctx.beginPath();
        ctx.arc(x, ey + 2 + (eyes === 'half' ? 1 : 0), Math.min(6, tall + 1), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#121012';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 2.6, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a2620';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 15, ey + 2 - tall * 0.6);
        ctx.quadraticCurveTo(x, ey - tall - 2, x + 15, ey + 2 - tall * 0.6);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(150, 92, 80, 0.4)';
      ctx.beginPath();
      ctx.ellipse(128, 132, 14, 6, 0, 0, PI * 2);
      ctx.fill();
      const my = 202;
      ctx.fillStyle = '#3a1a1a';
      ctx.strokeStyle = '#7a4440';
      ctx.lineWidth = 4;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(108, my);
        ctx.quadraticCurveTo(128, my + 4, 148, my);
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 15 : 8;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, mouth === 'wide' ? 20 : 16, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        if (mouth === 'wide') {
          ctx.fillStyle = '#e4dcd2';
          ctx.fillRect(115, my - hh + 4, 26, 4);
        }
      }
      ctx.restore();
    };
  }

  function tattooTex(ctx, w, h) {
    const sk = '#d9a892';
    ctx.fillStyle = sk;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2c2a30';
    ctx.fillStyle = '#2c2a30';
    ctx.lineCap = 'round';
    const g = rand(5);
    for (let k = 0; k < 2; k++) {
      const cx = w * (0.25 + k * 0.5);
      ctx.lineWidth = w * 0.03;
      for (let i = 0; i < 5; i++) {
        const y = h * (0.12 + i * 0.17);
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.16, y);
        ctx.quadraticCurveTo(cx + w * (g() - 0.5) * 0.2, y + h * 0.1, cx + w * 0.16, y + h * 0.02);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, y - h * 0.04);
        ctx.lineTo(cx - w * 0.05, y + h * 0.08);
        ctx.lineTo(cx + w * 0.05, y + h * 0.08);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function buildPhone(b) {
    b.box(0.07, 0.145, 0.011, LOOK.phone);
    b.quad([-0.031, -0.066, 0.0062], [0.031, -0.066, 0.0062], [0.031, 0.066, 0.0062], [-0.031, 0.066, 0.0062], LOOK.screen);
  }

  function buildCape(b) {
    const H = LOOK.hoodie;
    const sides = 14;
    const rings = [[-0.3, 0.36, 0.3, 0.08], [-0.08, 0.375, 0.32, 0.1], [0.1, 0.355, 0.285, 0.05], [0.24, 0.32, 0.23, 0.0], [0.33, 0.25, 0.18, -0.02]];
    for (let j = 0; j < rings.length - 1; j++) {
      const a = rings[j], c = rings[j + 1];
      for (let i = 0; i < sides; i++) {
        const u0 = PI * 0.42 + (i / sides) * PI * 1.16, u1 = PI * 0.42 + ((i + 1) / sides) * PI * 1.16;
        const p = (r, u) => [S(u) * r[1], r[0], r[3] + C(u) * r[2]];
        const n = (u) => V3.norm([S(u), 0, C(u)]);
        b.quad(p(a, u0), p(a, u1), p(c, u1), p(c, u0), H, null, [n(u0), n(u1), n(u1), n(u0)]);
      }
    }
    buildHood(b);
  }

  function buildHeap(b, seed) {
    const H = LOOK.hoodie;
    const g = rand(seed || 3);
    for (let i = 0; i < 7; i++) {
      b.push(M4.translate((g() - 0.5) * 0.4, 0.03 + g() * 0.05, (g() - 0.5) * 0.25), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.5));
      b.ellipsoid(0.12 + g() * 0.1, 0.035 + g() * 0.03, 0.08 + g() * 0.06, 8, 4, i % 3 ? H : LOOK.hood);
      b.pop();
    }
    b.push(M4.translate(0.25, 0.03, 0.12), M4.rotY(-0.5));
    b.prism(8, 0.05, 0.035, 0, 0.045, 0.03, 0.42, H);
    b.pop();
  }

  function build(r) {
    const faces = {};
    FACE_EYES.forEach(e => FACE_MOUTHS.forEach(m => { faces[e + '-' + m] = r.texture(256, drawFace(e, m), { clamp: true }); }));
    const R = D.head;
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'fist', 'phone', 'point'].forEach(gr => { hands[s + gr] = mesh(r, b => buildHand(b, s, gr)); }));
    return {
      faces,
      tattoo: r.texture(64, tattooTex),
      chest: {
        hoodie: mesh(r, b => { buildChest(b, LOOK.hoodie); buildHoodieDetails(b); }),
        hoodieUp: mesh(r, b => { buildChest(b, LOOK.hoodie, HEM); buildHoodieDetails(b, HEM); }),
        tee: mesh(r, b => buildChest(b, LOOK.tee)),
        teeUp: mesh(r, b => buildChest(b, LOOK.tee, HEM))
      },
      hood: mesh(r, buildHood),
      cape: mesh(r, buildCape),
      heap: mesh(r, b => buildHeap(b, 3)),
      pelvis: mesh(r, buildPelvis),
      neck: mesh(r, b => loft(b, [ring(-0.08, 0.1, 0.095, 0.01, LOOK.skin), ring(0.1, 0.09, 0.085, 0.02, LOOK.skin)], 10)),
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => spherePatch(b, R * 0.985, R * 1.065, R * 1.006, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      upper: { hoodie: mesh(r, b => buildUpper(b, 'hoodie')), tee: mesh(r, b => buildUpper(b, 'tee')) },
      fore: { hoodie: mesh(r, b => buildFore(b, 'hoodie')), tee: mesh(r, b => buildFore(b, 'tee')) },
      sleeve: mesh(r, b => loft(b, [ring(-0.3, 0.07, 0.072, 0, LOOK.hoodie), ring(0, 0.075, 0.078, 0, LOOK.hoodie)], 10)),
      hands,
      thigh: mesh(r, buildThigh),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot),
      phone: mesh(r, buildPhone)
    };
  }

  function faceKey(eyes, mouth) {
    return (FACE_EYES.includes(eyes) ? eyes : 'open') + '-' + (FACE_MOUTHS.includes(mouth) ? mouth : 'shut');
  }

  function spreadOf(m) {
    const fz = clamp((Math.abs(m.chest[9]) - 0.35) / 0.5, 0, 1);
    const fx = clamp((Math.abs(m.chest[1]) - 0.35) / 0.5, 0, 1);
    return [1 + 0.15 * fz - 0.35 * fx, 1 - 0.4 * fz + 0.12 * fx];
  }

  function draw(r, V, m, p, opts) {
    const o = opts || {};
    const pass = o.tint ? { tint: o.tint } : {};
    const wear = p.wear || 'hoodie';
    const top = wear === 'hoodie' ? 'hoodie' : 'tee';
    const sq = spreadOf(m);
    const spread = M4.scale(sq[0], 1, sq[1]);
    r.draw(V.pelvis, M4.mul(m.pelvis, spread), pass);
    r.draw(V.chest[top + (p.belly ? 'Up' : '')], M4.mul(m.chest, spread), pass);
    if (wear === 'hoodie') r.draw(V.hood, m.chest, pass);
    if (wear === 'cape') r.draw(V.cape, M4.chain(m.chest, M4.translate(0, -0.12 * (p.capeDrop || 0), -0.05 - 0.08 * (p.capeDrop || 0)), M4.rotX(-0.35 * (p.capeDrop || 0))), pass);
    r.draw(V.neck, m.neck, pass);
    const hm = m.head;
    r.draw(V.head, hm, pass);
    r.draw(V.hair, hm, pass);
    if (!o.noFace) r.draw(V.face, hm, Object.assign({ texture: V.faces[faceKey(p.eyes, p.mouth)] }, pass));
    ['L', 'R'].forEach(s => {
      const sleeve = wear === 'hoodie' ? 'hoodie' : 'tee';
      const hidden = p['hide' + s];
      if (!hidden) r.draw(V.upper[sleeve], m['upper' + s], pass);
      if (!hidden) r.draw(V.fore[sleeve], m['fore' + s], sleeve === 'tee' ? Object.assign({ texture: V.tattoo }, pass) : pass);
      if (wear === 'cape' && (p['sleeve' + s] || 0) < 1) {
        const k = p['sleeve' + s] || 0;
        r.draw(V.sleeve, M4.mul(m['upper' + s], M4.translate(0, -0.05 - k * 0.5, 0)), pass);
        r.draw(V.sleeve, M4.mul(m['fore' + s], M4.translate(0, -k * 0.45, 0)), pass);
      }
      const grip = p['g' + s] || 'open';
      if (!hidden) r.draw(V.hands[s + grip], m['hand' + s], pass);
      r.draw(V.thigh, m['thigh' + s], pass);
      r.draw(V.shin, m['shin' + s], pass);
      r.draw(V.foot, m['foot' + s], pass);
    });
    if (p.phone) {
      const s = p.phone;
      const k = s === 'L' ? 1 : -1;
      const off = p.phoneM || M4.chain(M4.translate(-k * 0.035, -0.1, 0.03), M4.rotY(-k * PI / 2), M4.rotX(0.1));
      r.draw(V.phone, M4.mul(m['hand' + s], off), pass);
    }
  }

  const SURFACE = (() => {
    const chest = [], pelvis = [];
    [2, 4, 5, 7, 9].forEach(i => {
      const [y, rx, rz, cz] = CHEST_RINGS[i];
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * PI * 2;
        chest.push([S(a) * rx, y, cz + C(a) * rz]);
      }
    });
    [[-0.09, 0.275, 0.215, -0.03], [-0.01, 0.3, 0.235, -0.02]].forEach(([y, rx, rz, cz]) => {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * PI * 2;
        pelvis.push([S(a) * rx, y, cz + C(a) * rz]);
      }
    });
    return { chest, pelvis };
  })();

  function capsules(m, p) {
    const out = [];
    const seg = (a, b, r0, r1, n) => {
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        out.push([V3.lerp(a, b, k), lerp(r0, r1, k)]);
      }
    };
    const [sx, sz] = spreadOf(m);
    out.push([M4.point(m.head, [0, 0, 0]), 0.14]);
    SURFACE.chest.forEach(q => out.push([M4.point(m.chest, [q[0] * sx, q[1], q[2] * sz]), 0.05]));
    SURFACE.pelvis.forEach(q => out.push([M4.point(m.pelvis, [q[0] * sx, q[1], q[2] * sz]), 0.05]));
    ['L', 'R'].forEach(s => {
      seg(m.pts['hip' + s], m.pts['knee' + s], 0.14, 0.11, 4);
      seg(m.pts['knee' + s], m.pts['ankle' + s], 0.1, 0.07, 4);
    });
    if (p && p.armsUnder) ['L', 'R'].forEach(s => {
      seg(m.pts['shoulder' + s], m.pts['elbow' + s], 0.1, 0.09, 3);
      seg(m.pts['elbow' + s], m.pts['wrist' + s], 0.09, 0.08, 3);
      out.push([M4.point(m['hand' + s], [0, -0.06, 0]), 0.09]);
    });
    return out;
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  window.VladCast = { D, LOOK, solve, build, draw, capsules, spreadOf };
})();
