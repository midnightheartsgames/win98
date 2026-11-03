(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, frac } = K;
  const Rig = window.YouVidRig;
  const A = window.KafkaArt;

  function build(r) {
    const tex = (w, h, fn) => r.texture(w, fn, { height: h, clamp: true });
    return {
      strip: K.mesh(r, b => b.quad([-1, 0, 0], [1, 0, 0], [1, 1, 0], [-1, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      sprite: K.mesh(r, b => b.quad([-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      cone: K.mesh(r, b => {
        b.quad([-1, 0, 0], [1, 0, 0], [0.22, 1, 0], [-0.22, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [0.61, 1], [0.39, 1]]);
        b.quad([0, 0, -1], [0, 0, 1], [0, 1, 0.22], [0, 1, -0.22], [1, 1, 1, 1], [[0, 0], [1, 0], [0.61, 1], [0.39, 1]]);
      }),
      petal: K.mesh(r, b => {
        b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 0.5, 0.12], [-0.5, 0.5, 0.12], [1, 1, 1, 0.3], [[0, 0], [1, 0], [1, 0.5], [0, 0.5]]);
        b.quad([-0.5, 0.5, 0.12], [0.5, 0.5, 0.12], [0.5, 1, 0.05], [-0.5, 1, 0.05], [1, 1, 1, 0.3], [[0, 0.5], [1, 0.5], [1, 1], [0, 1]]);
      }),
      shard: K.mesh(r, b => {
        const base = [[0.06, 0, 0], [0, 0, 0.05], [-0.06, 0, 0], [0, 0, -0.05]];
        for (let i = 0; i < 4; i++) {
          const a = base[i], c = base[(i + 1) % 4];
          b.tri(a, c, [0, 1, 0], i % 2 ? [1, 0.35, 0.65, 1] : [0.85, 0.12, 0.42, 1]);
          b.tri(c, a, [0, -0.12, 0], [0.6, 0.06, 0.26, 1]);
        }
      }),
      beamTex: tex(64, 8, A.beam),
      starTex: tex(128, 128, A.star),
      haloTex: tex(128, 128, A.halo),
      smokeTex: tex(128, 128, A.smoke),
      coneTex: tex(64, 128, A.cone),
      petalTex: tex(64, 64, A.petal),
      spiderTex: tex(128, 128, A.spiderGlow)
    };
  }

  function camBasis(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(f, cam.up || [0, 1, 0]);
    right = V3.len(right) < 1e-5 ? [1, 0, 0] : V3.norm(right);
    const up = V3.cross(right, f);
    return { f, right, up };
  }

  function billboard(pos, cam, sx, sy, roll) {
    const B = camBasis(cam);
    const c = C(roll || 0), s = S(roll || 0);
    const x = V3.add(V3.mul(B.right, c), V3.mul(B.up, s));
    const y = V3.sub(V3.mul(B.up, c), V3.mul(B.right, s));
    return Rig.basisM(pos, V3.mul(x, sx), V3.mul(y, sy), V3.mul(B.f, -1));
  }

  function line(r, X, cam, a, b, width, color, alpha, flat) {
    const dir = V3.sub(b, a);
    if (V3.len(dir) < 1e-5) return;
    const mid = V3.mul(V3.add(a, b), 0.5);
    const view = V3.sub(cam.eye, mid);
    let side = V3.cross(dir, view);
    if (V3.len(side) < 1e-6) side = [1, 0, 0];
    side = V3.mul(V3.norm(side), width / 2);
    const n = V3.norm(V3.cross(side, dir));
    const a0 = alpha === undefined ? 1 : alpha;
    const opts = flat ? { flat: [flat[0], flat[1], flat[2], a0], additive: true } : { texture: X.beamTex, additive: true, tint: color, alpha: a0, noFog: true };
    r.draw(X.strip, Rig.basisM(a, side, dir, n), opts);
  }

  function lines(r, X, cam, list) {
    list.forEach(l => line(r, X, cam, l.a, l.b, l.w || 0.03, l.color || [1, 0.25, 0.7], l.alpha, l.flat));
  }

  function sprite(r, X, cam, pos, size, kind, color, alpha, roll) {
    const tex = kind === 'star' ? X.starTex : kind === 'smoke' ? X.smokeTex : kind === 'spider' ? X.spiderTex : X.haloTex;
    r.draw(X.sprite, billboard(pos, cam, size, size, roll || 0), { texture: tex, additive: true, tint: color || [1, 1, 1], alpha: alpha === undefined ? 1 : alpha, noFog: true });
  }

  function sprites(r, X, cam, list) {
    list.forEach(s => sprite(r, X, cam, s.p, s.size, s.kind || 'halo', s.color, s.alpha, s.roll));
  }

  function cones(r, X, list) {
    list.forEach(c => {
      const m = M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.yaw || 0), M4.rotZ(c.tilt || 0), M4.scale(c.r, c.h, c.r));
      const a0 = c.alpha === undefined ? 0.5 : c.alpha;
      r.draw(X.cone, m, c.flat ? { flat: [c.flat[0], c.flat[1], c.flat[2], a0 * 0.4], additive: true } : { texture: X.coneTex, additive: true, tint: c.color || [1, 1, 1], alpha: a0, noFog: true });
    });
  }

  function petals(r, X, list, flat) {
    list.forEach(p => {
      const m = M4.chain(M4.translate(p.p[0], p.p[1], p.p[2]), M4.rotY(p.ry), M4.rotX(p.rx), M4.rotZ(p.rz), M4.scale(p.s, p.s, p.s));
      r.draw(X.petal, m, flat ? { texture: X.petalTex, flat: [0.82, 0.05, 0.14, 1] } : { texture: X.petalTex, tint: p.tint || [0.86, 0.08, 0.16] });
    });
  }

  function petalField(seed, n, center, size, t, o) {
    const opt = o || {};
    const g = rand(seed);
    const out = [];
    const fall = opt.fall === undefined ? 0.35 : opt.fall;
    for (let i = 0; i < n; i++) {
      const bx = (g() - 0.5) * size[0], by = g() * size[1], bz = (g() - 0.5) * size[2];
      const sp = 0.6 + g() * 0.8, ph = g() * PI * 2;
      const y = size[1] * frac((by - fall * sp * t) / size[1] + 1);
      const drift = opt.drift || [0, 0, 0];
      out.push({
        p: [center[0] + bx + S(t * sp + ph) * 0.15 + drift[0] * t, center[1] + y, center[2] + bz + C(t * sp * 0.8 + ph) * 0.12 + drift[2] * t],
        rx: t * 2.1 * sp + ph,
        ry: ph * 2,
        rz: t * 1.3 + ph,
        s: (opt.scale || 0.05) * (0.7 + g() * 0.6)
      });
    }
    return out;
  }

  function burst(seed, n, center, radius, t, o) {
    const opt = o || {};
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, e = (g() - 0.3) * 1.2, sp = 0.5 + g();
      const d = radius * Math.min(1, t * sp * (opt.speed || 1.5));
      out.push({
        p: [center[0] + C(a) * C(e) * d, center[1] + S(e) * d - 0.4 * t * t, center[2] + S(a) * C(e) * d],
        rx: t * 5 * sp + a,
        ry: a,
        rz: t * 3 + e,
        s: (opt.scale || 0.05) * (0.7 + g() * 0.6)
      });
    }
    return out;
  }

  function web(center, u, v, radius, spokes, rings, width, color, grow) {
    const out = [];
    const k = grow === undefined ? 1 : grow;
    const pt = (a, rad) => V3.add(center, V3.add(V3.mul(u, C(a) * rad), V3.mul(v, S(a) * rad)));
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * PI * 2 + 0.2;
      out.push({ a: center, b: pt(a, radius * k), w: width, color });
    }
    for (let j = 1; j <= rings; j++) {
      const rad = (j / rings) * radius;
      if (rad > radius * k) break;
      for (let i = 0; i < spokes; i++) {
        const a0 = (i / spokes) * PI * 2 + 0.2, a1 = ((i + 1) / spokes) * PI * 2 + 0.2;
        out.push({ a: pt(a0, rad), b: pt(a1, rad * 0.97), w: width * 0.8, color });
      }
    }
    return out;
  }

  function lightning(seed, a, b, segs, jitter, width, color) {
    const g = rand(seed);
    const pts = [a];
    for (let i = 1; i < segs; i++) {
      const k = i / segs;
      const p = V3.lerp(a, b, k);
      pts.push([p[0] + (g() - 0.5) * jitter, p[1] + (g() - 0.5) * jitter, p[2] + (g() - 0.5) * jitter]);
    }
    pts.push(b);
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) out.push({ a: pts[i], b: pts[i + 1], w: width, color });
    return out;
  }

  function laserGrid(seed, n, box, t, color, width) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const y0 = box[1][0] + g() * (box[1][1] - box[1][0]);
      const y1 = box[1][0] + g() * (box[1][1] - box[1][0]);
      const sw = S(t * (0.3 + g() * 0.5) + g() * 6) * 0.6;
      if (g() < 0.5) out.push({ a: [box[0][0], y0, lerp(box[2][0], box[2][1], g()) + sw], b: [box[0][1], y1, lerp(box[2][0], box[2][1], g()) - sw], w: width, color });
      else out.push({ a: [lerp(box[0][0], box[0][1], g()) + sw, y0, box[2][0]], b: [lerp(box[0][0], box[0][1], g()) - sw, y1, box[2][1]], w: width, color });
    }
    return out;
  }

  function shards(r, X, list, flat) {
    list.forEach(s => {
      const dir = V3.norm(s.dir);
      let x = V3.cross(dir, [0, 0, 1]);
      if (V3.len(x) < 1e-4) x = [1, 0, 0];
      x = V3.norm(x);
      const z = V3.cross(x, dir);
      const m = Rig.basisM(s.p, V3.mul(x, s.w || 1), V3.mul(dir, s.len), V3.mul(z, s.w || 1));
      r.draw(X.shard, m, flat ? { flat: s.flat || [0.95, 0.22, 0.55, 1] } : { noFog: true });
    });
  }

  function crystalBurst(seed, n, center, radius, grow, spread) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const a = (g() - 0.5) * (spread || 1.6);
      const e = (g() - 0.4) * 1.2;
      const dir = [side * C(a) * C(e), S(e) + 0.1, S(a) * 0.4];
      const len = radius * (0.35 + g() * 0.75) * grow;
      const off = 0.1 + g() * 0.3;
      out.push({ p: V3.add(center, V3.mul(dir, off)), dir, len, w: 0.8 + g() * 1.6, flat: g() < 0.5 ? [1, 0.3, 0.62, 1] : [0.78, 0.1, 0.38, 1] });
    }
    return out;
  }

  window.KafkaFx = { build, camBasis, billboard, line, lines, sprite, sprites, cones, petals, petalField, burst, web, lightning, laserGrid, shards, crystalBurst };
})();
