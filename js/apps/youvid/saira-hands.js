(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh, tube } = K;
  const Rig = window.YouVidRig;

  const SKIN = [0.93, 0.74, 0.66, 0];
  const SLEEVE = { navy: [0.1, 0.11, 0.16, 0], black: [0.07, 0.07, 0.08, 0] };

  const FINGERS = [
    { x: -0.027, y: 0.088, len: [0.037, 0.022, 0.018], r: 0.0088, spread: -0.06 },
    { x: -0.009, y: 0.092, len: [0.041, 0.025, 0.019], r: 0.009, spread: 0.0 },
    { x: 0.009, y: 0.089, len: [0.039, 0.024, 0.018], r: 0.0086, spread: 0.05 },
    { x: 0.026, y: 0.081, len: [0.03, 0.018, 0.016], r: 0.0076, spread: 0.12 }
  ];
  const THUMB = { base: [-0.025, 0.032, -0.008], len: [0.028, 0.025, 0.021], r: 0.0102 };

  const GRIPS = {
    flat: { f: [[0.12, 0.12, 0.08], [0.1, 0.12, 0.08], [0.1, 0.12, 0.08], [0.14, 0.14, 0.1]], th: [0.7, 0.15, 0.1], reach: 0.165 },
    open: { f: [[0.3, 0.4, 0.25], [0.32, 0.45, 0.28], [0.36, 0.5, 0.3], [0.42, 0.55, 0.32]], th: [0.6, 0.3, 0.2], reach: 0.15 },
    pinch: { f: [[0.45, 0.55, 0.3], [0.75, 1.0, 0.5], [1.1, 1.35, 0.7], [1.2, 1.4, 0.7]], th: [0.95, 0.35, 0.25], reach: 0.14 },
    hold: { f: [[1.0, 1.45, 0.85], [1.05, 1.5, 0.85], [1.1, 1.5, 0.85], [1.15, 1.5, 0.85]], th: [1.15, 0.5, 0.35], reach: 0.105 },
    cup: { f: [[0.55, 0.85, 0.5], [0.6, 0.9, 0.5], [0.65, 0.95, 0.5], [0.7, 1.0, 0.55]], th: [1.05, 0.25, 0.15], reach: 0.13 },
    point: { f: [[0.08, 0.1, 0.06], [1.1, 1.5, 0.8], [1.15, 1.5, 0.8], [1.2, 1.5, 0.8]], th: [1.1, 0.5, 0.3], reach: 0.16 }
  };

  function rotAround(v, axis, a) {
    const c = C(a), s = S(a);
    const d = V3.dot(axis, v);
    const cr = V3.cross(axis, v);
    return [v[0] * c + cr[0] * s + axis[0] * d * (1 - c), v[1] * c + cr[1] * s + axis[1] * d * (1 - c), v[2] * c + cr[2] * s + axis[2] * d * (1 - c)];
  }

  function capsule(b, col) {
    tube(b, [[0, 0, 0], [0, -0.5, 0], [0, -1, 0]], [1, 0.96, 0.9], 7, col);
    b.push(M4.scale(1, 0.18, 1));
    K.spherePatch(b, 1, 1, 1, 0, PI * 2, 0, PI / 2, 7, 3, col);
    b.pop();
    b.push(M4.translate(0, -1, 0), M4.scale(0.9, 0.18, 0.9));
    K.spherePatch(b, 1, 1, 1, 0, PI * 2, -PI / 2, 0, 7, 3, col);
    b.pop();
    return b;
  }

  function palmMesh(b, col) {
    const rings = [
      [-0.004, 0.026, 0.017],
      [0.025, 0.035, 0.014],
      [0.055, 0.04, 0.0125],
      [0.082, 0.04, 0.011],
      [0.094, 0.035, 0.0095]
    ];
    const sides = 12;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    for (let j = 0; j < rings.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rings[j], i), bb = pt(rings[j], i + 1), c = pt(rings[j + 1], i + 1), d = pt(rings[j + 1], i);
        const n = (p) => V3.norm([p[0] / 0.04, 0, p[2] / 0.012]);
        b.quad(a, bb, c, d, col, null, [n(a), n(bb), n(c), n(d)]);
      }
    }
    const top = rings[rings.length - 1];
    for (let i = 0; i < sides; i++) b.tri([0, top[0] + 0.004, 0], pt(top, i), pt(top, i + 1), col);
    return b;
  }

  function build(r) {
    return {
      seg: mesh(r, b => capsule(b, SKIN)),
      palm: mesh(r, b => palmMesh(b, SKIN)),
      fore: mesh(r, b => tube(b, [[0, 0.01, 0], [0, -0.12, 0], [0, -0.5, 0], [0, -1, 0]], [0.78, 0.8, 0.95, 1.05], 10, SKIN)),
      sleeveN: mesh(r, b => tube(b, [[0, 0.04, 0], [0, -0.5, 0], [0, -1, 0]], [1.08, 1.0, 1.0], 10, SLEEVE.navy)),
      sleeveB: mesh(r, b => tube(b, [[0, 0.04, 0], [0, -0.5, 0], [0, -1, 0]], [1.08, 1.0, 1.0], 10, SLEEVE.black)),
      foreUv: mesh(r, b => {
        const rings = [[0.01, 0.78], [-0.12, 0.8], [-0.5, 0.95], [-1, 1.05]];
        const n = 12;
        for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const p = (k, a) => [S(a) * rings[k][1], rings[k][0], C(a) * rings[k][1]];
          const nn = (a) => [S(a), 0, C(a)];
          b.quad(p(j, a0), p(j, a1), p(j + 1, a1), p(j + 1, a0), [1, 1, 1, 0], [[i / n, -rings[j][0]], [(i + 1) / n, -rings[j][0]], [(i + 1) / n, -rings[j + 1][0]], [i / n, -rings[j + 1][0]]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
        }
      })
    };
  }

  function basis(o, x, y, z) {
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  function solve(spec) {
    const side = spec.side === 'L' ? -1 : 1;
    const G = GRIPS[spec.grip] || GRIPS.open;
    const fwd = V3.norm(spec.dir);
    let back = spec.back ? V3.norm(spec.back) : [0, 1, 0];
    back = V3.sub(back, V3.mul(fwd, V3.dot(back, fwd)));
    back = V3.len(back) < 1e-4 ? V3.norm(V3.cross(fwd, [1, 0, 0])) : V3.norm(back);
    if (spec.roll) back = rotAround(back, fwd, spec.roll * side);
    const x = V3.mul(V3.cross(fwd, back), side);
    const wrist = spec.wrist || V3.sub(spec.tip, V3.mul(fwd, G.reach));
    const hand = basis(wrist, x, fwd, back);
    const at = (p) => M4.point(hand, [p[0], p[1], p[2]]);
    const bones = [];
    const tips = [];
    FINGERS.forEach((f, i) => {
      const curls = G.f[i];
      let p = at([f.x, f.y, -0.004]);
      let d = rotAround(fwd, back, -f.spread * side * 0.6);
      const axis = V3.norm(V3.cross(d, back));
      let rad = f.r;
      f.len.forEach((len, k) => {
        d = rotAround(d, axis, -curls[k]);
        const q = V3.add(p, V3.mul(d, len));
        bones.push({ a: p, b: q, r: rad, back });
        p = q;
        rad *= 0.9;
      });
      tips.push(p);
    });
    let tp = at(THUMB.base);
    const tg = G.th;
    let td = V3.norm(V3.add(V3.add(V3.mul(fwd, 0.78), V3.mul(x, -0.45)), V3.mul(back, -0.38)));
    td = rotAround(td, fwd, tg[0] * 0.4 * side);
    const tAxis = V3.norm(V3.cross(td, V3.add(back, V3.mul(x, -0.4))));
    let tr = THUMB.r;
    THUMB.len.forEach((len, k) => {
      if (k > 0) td = rotAround(td, tAxis, tg[k] * side);
      else td = V3.norm(V3.add(td, V3.mul(fwd, tg[0] * 0.25)));
      const q = V3.add(tp, V3.mul(td, len));
      bones.push({ a: tp, b: q, r: tr, back });
      tp = q;
      tr *= 0.88;
    });
    tips.push(tp);
    const armDir = V3.norm(spec.arm || V3.mul(fwd, -1));
    const elbow = V3.add(wrist, V3.mul(armDir, 0.27));
    const shoulderDir = V3.norm(V3.add(V3.mul(armDir, 0.8), [0, 0.6, 0]));
    const shoulder = V3.add(elbow, V3.mul(shoulderDir, 0.3));
    return { side, hand, wrist, x, fwd, back, bones, tips, elbow, shoulder, sleeve: spec.sleeve || 'black', cuff: spec.cuff === undefined ? 0.06 : spec.cuff, grip: spec.grip, tint: spec.tint, tattoo: spec.tattoo, tattooTex: spec.tattooTex, big: spec.big };
  }

  function seg(a, b, zHint) {
    return Rig.boneM(a, b, zHint);
  }

  function draw(r, H, rig, opts) {
    const o = opts || {};
    const pass = Object.assign(rig.tint ? { tint: rig.tint } : {}, o);
    r.draw(H.palm, rig.hand, pass);
    rig.bones.forEach((bn, i) => {
      const len = V3.len(V3.sub(bn.b, bn.a));
      r.draw(H.seg, M4.chain(seg(bn.a, bn.b, bn.back), M4.scale(bn.r, len, bn.r)), pass);
    });
    const cuffAt = V3.add(rig.wrist, V3.mul(V3.norm(V3.sub(rig.elbow, rig.wrist)), rig.cuff));
    const foreLen = V3.len(V3.sub(rig.elbow, rig.wrist));
    const foreM = M4.chain(seg(rig.wrist, rig.elbow, rig.back), M4.scale(rig.big ? 0.036 : 0.03, foreLen, rig.big ? 0.03 : 0.024));
    if (rig.tattooTex) r.draw(H.foreUv, foreM, Object.assign({}, pass, { texture: rig.tattooTex }));
    else r.draw(H.fore, foreM, pass);
    if (rig.upper) {
      const upLen = V3.len(V3.sub(rig.shoulder, rig.elbow));
      const upM = M4.chain(seg(rig.elbow, rig.shoulder, rig.back), M4.scale(0.05, upLen, 0.046));
      if (rig.tattooTex) r.draw(H.foreUv, upM, Object.assign({}, pass, { texture: rig.tattooTex }));
      else r.draw(H.fore, upM, pass);
      const sl = V3.lerp(rig.shoulder, rig.elbow, 0.42);
      r.draw(H.sleeveB, M4.chain(seg(sl, rig.shoulder, rig.back), M4.scale(0.066, V3.len(V3.sub(rig.shoulder, sl)) + 0.02, 0.062)), o);
      return;
    }
    if (rig.sleeve === 'none') return;
    const sleeve = rig.sleeve === 'navy' ? H.sleeveN : H.sleeveB;
    r.draw(sleeve, M4.chain(seg(cuffAt, rig.elbow, rig.back), M4.scale(0.042, V3.len(V3.sub(rig.elbow, cuffAt)), 0.036)), pass);
    r.draw(sleeve, M4.chain(seg(rig.elbow, rig.shoulder, rig.back), M4.scale(0.05, 0.3, 0.045)), pass);
  }

  const HOLDS = {
    spoon: { o: [-0.012, 0.075, -0.02], d: [0.05, 0.94, -0.33] },
    fork: { o: [-0.012, 0.075, -0.02], d: [0.05, 0.94, -0.33] },
    spatula: { o: [-0.006, 0.06, -0.022], d: [0.08, 0.95, -0.3] },
    tomato: { o: [-0.008, 0.112, -0.03] },
    pouch: { o: [-0.006, 0.1, -0.022] }
  };

  function frameFrom(o, y, z) {
    const zz = V3.norm(V3.sub(z, V3.mul(y, V3.dot(z, y))));
    const x = V3.norm(V3.cross(y, zz));
    return basis(o, x, y, zz);
  }

  function holdMatrix(rig, kind, extra) {
    const e = extra || {};
    const side = rig.side;
    const palm = (l) => M4.point(rig.hand, [l[0] * side, l[1], l[2]]);
    const out = V3.mul(rig.back, -1);
    if (e.top) {
      return frameFrom(V3.add(palm([0.0, 0.07, -0.012]), V3.mul(out, 0.006)), out, rig.fwd);
    }
    if (kind === 'can' || kind === 'jar' || kind === 'soda') {
      const R = e.R || 0.042, h = e.h || 0.05;
      const axis = V3.mul(rig.x, e.flip ? -1 : 1);
      const c = V3.add(palm([0.004, 0.066, -0.012]), V3.mul(out, R + 0.003));
      return frameFrom(V3.sub(c, V3.mul(axis, h * (e.grab === undefined ? 0.5 : e.grab))), axis, out);
    }
    if (kind === 'base' || kind === 'plate') {
      const c = V3.add(palm([0, kind === 'plate' ? 0.085 : 0.07, -0.012]), V3.mul(out, 0.004));
      return frameFrom(c, out, rig.fwd);
    }
    if (kind === 'tomato' || kind === 'half' || kind === 'pouch') {
      const h = HOLDS[kind === 'half' ? 'tomato' : kind];
      return frameFrom(palm(h.o), out, rig.fwd);
    }
    const h = HOLDS[kind] || HOLDS.spoon;
    const o = palm(h.o);
    const d = V3.norm(M4.dir(rig.hand, [h.d[0] * side, h.d[1], h.d[2]]));
    let up = V3.norm(V3.sub(rig.back, V3.mul(d, V3.dot(rig.back, d))));
    if (V3.len(up) < 1e-4) up = [0, 1, 0];
    const z = V3.mul(d, -1);
    const x = V3.norm(V3.cross(up, z));
    return basis(o, x, V3.cross(z, x), z);
  }

  window.SairaHands = { GRIPS, HOLDS, SLEEVE, SKIN, build, solve, draw, holdMatrix, rotAround };
})();
