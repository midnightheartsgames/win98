(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;
  const P3 = window.SairaProps;
  const Hands = window.SairaHands;
  const SC = window.StsCast;

  if (SC && !SC.PEOPLE.streamer) {
    SC.PEOPLE.streamer = Object.assign({}, SC.PEOPLE.yellow, { lipstick: false, hair: 0x8e7e6c, hairHi: 0xa09080, outfits: { grey: { top: 'tee', col: 0x8c8e92, sleeve: 'long', legs: 0x2a2a30, foot: 'shoe' } } });
  }

  const ENVS = {
    stove: { sunDir: [0.15, -0.9, -0.35], sunColor: [0.42, 0.4, 0.38], ambTop: [0.64, 0.62, 0.6], ambBottom: [0.22, 0.21, 0.2], fogColor: [0.05, 0.05, 0.05], fogNear: 30, fogFar: 60, points: [{ pos: [0.3, 1.0, 0.5], color: [0.3, 0.28, 0.26] }] },
    table: { sunDir: [0.2, -0.85, -0.45], sunColor: [0.5, 0.48, 0.46], ambTop: [0.8, 0.79, 0.78], ambBottom: [0.32, 0.32, 0.32], fogColor: [0.1, 0.1, 0.1], fogNear: 30, fogFar: 60 },
    sunny: { sunDir: [-0.55, -0.62, 0.56], sunColor: [0.62, 0.6, 0.55], ambTop: [0.62, 0.63, 0.66], ambBottom: [0.3, 0.3, 0.32], fogColor: [0.1, 0.1, 0.1], fogNear: 30, fogFar: 60 },
    micro: { sunDir: [0.1, -0.8, -0.5], sunColor: [0.42, 0.4, 0.36], ambTop: [0.8, 0.76, 0.7], ambBottom: [0.5, 0.48, 0.45], fogColor: [0.9, 0.9, 0.88], fogNear: 30, fogFar: 60 },
    phone: { sunDir: [0.2, -0.8, -0.5], sunColor: [0.5, 0.46, 0.42], ambTop: [0.66, 0.62, 0.58], ambBottom: [0.26, 0.24, 0.22], fogColor: [0.2, 0.2, 0.2], fogNear: 30, fogFar: 60 },
    stream: { sunDir: [0.6, -0.4, -0.6], sunColor: [0.5, 0.5, 0.52], ambTop: [0.9, 0.9, 0.92], ambBottom: [0.5, 0.5, 0.5], fogColor: [0.85, 0.85, 0.85], fogNear: 30, fogFar: 60, points: [{ pos: [-1.5, 1.6, 1.2], color: [0.5, 0.5, 0.52] }] },
    room: { sunDir: [0.3, -0.5, -0.8], sunColor: [0.32, 0.3, 0.26], ambTop: [0.9, 0.86, 0.76], ambBottom: [0.42, 0.38, 0.32], fogColor: [0.06, 0.05, 0.04], fogNear: 12, fogFar: 30, points: [{ pos: [0.4, 1.6, 2.4], color: [0.36, 0.34, 0.3] }] }
  };

  function sunCookie(r) {
    const tex = r.texture(256, (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(w * 0.38, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.92);
      ctx.lineTo(w * 0.86, h);
      ctx.closePath();
      ctx.filter = 'blur(3px)';
      ctx.fill();
    }, { clamp: true });
    return tex;
  }

  function build(r, P) {
    const ground = (size, rep) => mesh(r, b => {
      const n = [0, 1, 0];
      const steps = 6;
      for (let i = 0; i < steps; i++) for (let j = 0; j < steps; j++) {
        const x0 = -size + (2 * size * i) / steps, x1 = -size + (2 * size * (i + 1)) / steps;
        const z0 = -size + (2 * size * j) / steps, z1 = -size + (2 * size * (j + 1)) / steps;
        const uv = (x, z) => [(x + size) * rep, (z + size) * rep];
        b.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [1, 1, 1, 0], [uv(x0, z1), uv(x1, z1), uv(x1, z0), uv(x0, z0)], [n, n, n, n]);
      }
    });
    const W = {
      felt: ground(1.2, 2.2),
      pot: mesh(r, b => {
        P3.lathe(b, [[0.095, 0], [0.1, 0.004], [0.1, 0.13], [0.104, 0.134], [0.1, 0.136]], 32, [0.74, 0.75, 0.78, 0.05]);
        P3.lathe(b, [[0, 0.008], [0.096, 0.008], [0.096, 0.134]], 32, [0.6, 0.61, 0.64, 0.05], null, { inside: true });
        [-1, 1].forEach(s => b.at(s * 0.112, 0.11, 0, k => k.box(0.03, 0.012, 0.05, 0x9a9ca0)));
      }),
      mug: mesh(r, b => P3.lathe(b, [[0.035, 0], [0.04, 0.09], [0.036, 0.092]], 18, [0.7, 0.72, 0.74, 0.05])),
      bottle: mesh(r, b => {
        P3.lathe(b, [[0.03, 0], [0.032, 0.01], [0.032, 0.12], [0.02, 0.14], [0.014, 0.16]], 16, 0x2a6ad8);
        b.at(0, 0.16, 0, k => k.prism(10, 0.016, 0.016, 0, 0.016, 0.016, 0.02, 0xe8e8ec));
      }),
      spice: mesh(r, b => {
        P3.lathe(b, [[0.022, 0], [0.024, 0.005], [0.024, 0.07]], 14, [0.9, 0.9, 0.86, 0.05]);
        b.at(0, 0.07, 0, k => k.prism(12, 0.024, 0.024, 0, 0.024, 0.024, 0.02, 0xe87a1a));
      }),
      packet: mesh(r, b => b.at(0, 0.0, 0, k => k.box(0.1, 0.16, 0.02, [0.86, 0.4, 0.6, 0]))),
      phoneStove: mesh(r, b => b.quad([-0.5, 0, 0.4], [0.5, 0, 0.4], [0.5, 0, -0.4], [-0.5, 0, -0.4], [0.07, 0.07, 0.08, 0.05])),
      tileWall: mesh(r, b => b.quad([-0.6, 0, -0.32], [0.6, 0, -0.32], [0.6, 0.8, -0.32], [-0.6, 0.8, -0.32], [1, 1, 1, 0], [[0, 0], [5, 0], [5, 3.3], [0, 3.3]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      room: mesh(r, b => {
        const n = [0, 0, 1];
        b.quad([-3, 0, -1.6], [3, 0, -1.6], [3, 2.7, -1.6], [-3, 2.7, -1.6], [1, 1, 1, 0], [[0, 0], [3, 0], [3, 1.4], [0, 1.4]], [n, n, n, n]);
        b.quad([-2.2, 0, 2], [-2.2, 0, -1.6], [-2.2, 2.7, -1.6], [-2.2, 2.7, 2], [1, 1, 1, 0], [[0, 0], [2, 0], [2, 1.4], [0, 1.4]], [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
        b.quad([-3, 0, 2], [3, 0, 2], [3, 0, -1.6], [-3, 0, -1.6], [0.5, 0.46, 0.42, 0]);
      }),
      bed: mesh(r, b => {
        b.at(1.0, 0.25, -0.9, k => k.box(1.6, 0.5, 1.3, [1, 1, 1, 0], { uvScale: 1.2 }));
        b.at(1.0, 0.55, -1.45, k => k.box(1.5, 0.16, 0.3, 0xe8e8ec));
      }),
      window: mesh(r, b => {
        b.quad([-2.19, 0.9, 0.4], [-2.19, 0.9, -1.0], [-2.19, 2.3, -1.0], [-2.19, 2.3, 0.4], [1, 1, 1, 1]);
      }),
      vroom: buildVladRoom(r, P),
      hat: buildHat(r),
      cookie: sunCookie(r)
    };
    return W;
  }

  function bump(hs, x, z) {
    let h = 0;
    hs.forEach(([cx, cz, rx, rz, a]) => { h += a * Math.exp(-((x - cx) * (x - cx)) / (rx * rx) - ((z - cz) * (z - cz)) / (rz * rz)); });
    return h;
  }

  function buildVladRoom(r, P) {
    const BED = { x0: -0.35, x1: 1.55, z0: 0.06, z1: 1.02, top: 0.5 };
    const folds = [[0.1, 0.5, 0.35, 0.18, 0.08], [0.6, 0.3, 0.28, 0.2, 0.1], [1.05, 0.62, 0.3, 0.25, 0.12], [0.35, 0.82, 0.4, 0.12, 0.06], [1.3, 0.3, 0.2, 0.18, 0.09], [0.85, 0.85, 0.22, 0.12, 0.07], [-0.1, 0.25, 0.2, 0.15, 0.1]];
    const blanket = mesh(r, b => {
      const nu = 34, nv = 16;
      const pt = (i, j) => {
        const x = BED.x0 + (BED.x1 - BED.x0) * (i / nu), z = BED.z0 + (BED.z1 - BED.z0) * (j / nv);
        const edge = Math.min(1, Math.min(i, nu - i, j, nv - j) / 2.5);
        return [x, BED.top + bump(folds, x, z) * edge - (1 - edge) * 0.06, z];
      };
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = pt(i, j), bb = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
        const n = V3.norm(V3.cross(V3.sub(d, a), V3.sub(bb, a)));
        const sh = 0.86 + 0.14 * n[1];
        const col = [0.86 * sh, 0.96 * sh, 0.82 * sh, 0];
        b.quad(a, d, c, bb, [col, col, col, col], [[i / nu * 3, j / nv * 1.5], [i / nu * 3, (j + 1) / nv * 1.5], [(i + 1) / nu * 3, (j + 1) / nv * 1.5], [(i + 1) / nu * 3, j / nv * 1.5]], [n, n, n, n]);
      }
      b.at((BED.x0 + BED.x1) / 2, BED.top / 2 - 0.04, (BED.z0 + BED.z1) / 2, k => k.box(BED.x1 - BED.x0 + 0.02, BED.top - 0.08, BED.z1 - BED.z0, [0.36, 0.42, 0.3, 0]));
    });
    return {
      BED,
      walls: mesh(r, b => {
        const n = [0, 0, 1];
        b.quad([-2.6, 0, 0], [2.2, 0, 0], [2.2, 2.7, 0], [-2.6, 2.7, 0], [1, 1, 1, 0], [[0, 0], [3, 0], [3, 1.6], [0, 1.6]], [n, n, n, n]);
        b.quad([-2.6, 0, 3.2], [2.2, 0, 3.2], [2.2, 0, 0], [-2.6, 0, 0], [0.32, 0.22, 0.14, 0]);
      }),
      blanket,
      bundle: mesh(r, b => {
        b.at(-0.15, 0.6, 0.22, k => k.ellipsoid(0.22, 0.13, 0.16, 10, 7, [0.82, 0.76, 0.66, 0]));
        b.at(0.05, 0.62, 0.18, k => k.ellipsoid(0.14, 0.1, 0.12, 9, 6, [0.86, 0.8, 0.7, 0]));
      }),
      wardrobe: mesh(r, b => {
        b.at(-1.55, 1.1, 0.35, k => k.box(0.7, 2.2, 0.6, [0.2, 0.13, 0.08, 0]));
        b.at(-1.22, 1.1, 0.66, k => k.box(0.03, 2.1, 0.03, [0.12, 0.08, 0.05, 0]));
        b.at(-1.55, 1.1, 0.66, k => k.box(0.02, 2.0, 0.01, [0.14, 0.09, 0.06, 0]));
        b.at(1.75, 1.1, 0.4, k => k.box(0.12, 2.2, 0.12, [0.36, 0.22, 0.12, 0]));
        b.at(1.75, 1.1, 1.3, k => k.box(0.12, 2.2, 0.12, [0.36, 0.22, 0.12, 0]));
      }),
      floorBits: mesh(r, b => {
        b.at(-0.55, 0.06, 1.25, k => k.box(0.3, 0.12, 0.22, [0.62, 0.52, 0.36, 0]));
        b.at(0.9, 0.04, 1.6, k => k.box(0.4, 0.08, 0.3, [0.4, 0.3, 0.2, 0]));
      })
    };
  }

  function drawVladRoom(r, P, W, st, t) {
    const R = W.vroom;
    r.draw(R.walls, null, { texture: P.T.wallYellow });
    r.draw(R.blanket, null, { texture: P.T.blanketGreen });
    r.draw(R.bundle);
    r.draw(R.wardrobe);
    r.draw(R.floorBits);
    drawRoomExtras(r, P, W, st, t);
  }

  function buildHat(r) {
    const SC = window.StsCast;
    const R = SC.DIMS.heavy.head;
    const jaw = SC.PEOPLE.vlad.jaw;
    const red = [0.78, 0.07, 0.08, 0], dark = [0.62, 0.05, 0.06, 0], fur = [0.95, 0.94, 0.92, 0.15];
    const band = (b, p0, p1, k, col, nu, nv) => {
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const ya = -PI + (2 * PI * i) / nu, yb = -PI + (2 * PI * (i + 1)) / nu;
        const pa = p0 + ((p1 - p0) * j) / nv, pb = p0 + ((p1 - p0) * (j + 1)) / nv;
        const kk = (y, p) => k * (1 + 0.025 * S(y * 9 + p * 13));
        const q = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]].map(([y, p]) => SC.headPt(R, jaw, y, p, kk(y, p)));
        const ns = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]].map(([y, p]) => V3.norm(SC.headPt(R, jaw, y, p, 1)));
        b.quad(q[0], q[1], q[2], q[3], col, null, ns);
      }
    };
    return mesh(r, b => {
      band(b, 0.18, 0.5, 1.24, fur, 26, 3);
      band(b, 0.5, 1.5, 1.16, red, 20, 4);
      const pts = [[0, R * 0.95, -R * 0.05], [R * 0.25, R * 1.35, -R * 0.15], [R * 0.75, R * 1.48, -R * 0.25], [R * 1.18, R * 1.12, -R * 0.3], [R * 1.34, R * 0.62, -R * 0.24], [R * 1.32, R * 0.3, -R * 0.18]];
      tube(b, pts, [R * 0.92, R * 0.66, R * 0.46, R * 0.3, R * 0.17, R * 0.1], 12, red);
      tube(b, pts.slice(1, 4).map(p => V3.add(p, [0, -0.004, 0.0])), [R * 0.5, R * 0.36, R * 0.22], 10, dark);
      b.at(R * 1.32, R * 0.24, -R * 0.17, k => k.ellipsoid(R * 0.24, R * 0.24, R * 0.24, 10, 7, fur));
    });
  }

  function drawVesselContent(r, P, kind, M, layers) {
    if (!layers) return;
    layers.forEach(L => {
      if (!L || L.alpha <= 0.001) return;
      const tex = P.T[L.tex];
      const opts = { texture: tex, uvScroll: L.scroll || [0, 0] };
      if (L.add) Object.assign(opts, { additive: true, alpha: L.alpha, noFog: true });
      else if (L.alpha < 0.999) Object.assign(opts, { blend: true, alpha: L.alpha });
      if (L.tint) opts.tint = L.tint;
      if (kind === 'box') {
        const s = L.scale || 1;
        r.draw(P.box.content, M4.chain(M, M4.translate(L.dx || 0, L.y, L.dz || 0), M4.scale(s, 1, s)), opts);
      } else {
        const rad = L.r;
        r.draw(P.disc, M4.chain(M, M4.translate(L.dx || 0, L.y, L.dz || 0), M4.scale(rad * (L.sx || 1), 1, rad * (L.sz || 1))), opts);
      }
    });
  }

  function drawChunks(r, P, M, list) {
    (list || []).forEach(c => {
      const m = M4.chain(M, M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.yaw || 0), M4.rotZ(c.tilt || 0), M4.scale(c.s || 1, c.s || 1, c.s || 1));
      const kind = c.kind || 'chunk';
      if (kind === 'chunk') r.draw(P.chunks[(c.i || 0) % P.chunks.length], m, c.tint ? { tint: c.tint } : {});
      else if (kind === 'wedge') r.draw(P.wedges[(c.i || 0) % P.wedges.length], m);
      else if (kind === 'tomato') r.draw(P.tomato.whole, m);
      else if (kind === 'half') {
        r.draw(P.tomato.half, m, { texture: P.cutTex });
      } else if (kind === 'lump') r.draw(P.chunks[(c.i || 0) % P.chunks.length], m, { tint: [1.6, 0.42, 0.26] });
    });
  }

  function drawFry(r, P, f) {
    if (!f || f.hide) return;
    const M = P3.panMatrix(f.M || M4.ident(), P3.FRY.handle);
    r.draw(P.fry.outer, M, { texture: P.fry.tex });
    r.draw(P.fry.inner, M, { texture: P.fry.texIn });
    r.draw(P.fry.handle, M4.chain(M, M4.translate(0, 0.04, P3.FRY.rim - 0.006)));
    drawVesselContent(r, P, 'round', M, f.layers);
    drawChunks(r, P, M, f.chunks);
  }

  function drawSauce(r, P, s) {
    if (!s || s.hide) return;
    const M = P3.panMatrix(s.M || M4.translate(0.32, 0, 0.014), P3.SAUCE.handle);
    r.draw(P.sauce.outer, M, { texture: P.sauce.tex });
    r.draw(P.sauce.inner, M, { texture: P.sauce.texIn });
    r.draw(P.sauce.handle, M4.chain(M, M4.translate(0, 0.085, P3.SAUCE.rim - 0.004)));
    drawVesselContent(r, P, 'round', M, s.layers);
    drawChunks(r, P, M, s.chunks);
  }

  function drawBox(r, P, b) {
    if (!b || b.hide) return;
    const M = b.M || M4.ident();
    drawVesselContent(r, P, 'box', M, b.layers);
    drawChunks(r, P, M, b.chunks);
    if (b.squiggle) r.draw(P.squiggle, M4.chain(M, M4.translate(0, b.squiggle.y, 0), M4.scale(b.squiggle.s || 1, 1, b.squiggle.s || 1)));
    r.draw(P.box.walls, M, { blend: true, alpha: 0.22 });
    r.draw(P.box.lip, M, { blend: true, alpha: 0.7 });
  }

  function drawBowl(r, P, b) {
    if (!b || b.hide) return;
    const M = b.M || M4.ident();
    r.draw(P.bowl.outer, M);
    r.draw(P.bowl.inner, M);
    r.draw(P.bowl.rim, M);
    if (b.brick) {
      r.draw(P.brick, M4.chain(M, M4.translate(0, P3.BOWL.floor + 0.002, 0), M4.rotY(b.brick.yaw || 0.1)), { texture: P.T.noodles });
      if (b.brick.seasoning) r.draw(P.unitQuad, M4.chain(M, M4.translate(0, P3.BOWL.floor + 0.028, 0), M4.rotY(0.1), M4.scale(0.08, 1, 0.08)), { texture: P.T.seasoning });
    }
    drawChunks(r, P, M, b.chunks);
    drawVesselContent(r, P, 'round', M, b.layers);
  }

  function drawCan(r, P, c) {
    const can = c.tall ? P.canTall : P.can;
    const M = c.M;
    r.draw(can.body, M, { texture: P.T[c.label || 'canNatural'] });
    r.draw(can.rims, M);
    if (c.open) {
      r.draw(can.inside, M);
      const hinge = M4.chain(M, M4.translate(0, can.h, -can.R + 0.004), M4.rotX(-(c.lidOpen === undefined ? 2.2 : c.lidOpen)), M4.translate(0, 0, can.R - 0.004));
      r.draw(can.lid, hinge, { texture: P.T.lid });
      r.draw(can.pull, M4.chain(hinge, M4.translate(-0.006, 0.002, -0.02)));
      if (c.fill) {
        r.draw(P.disc, M4.chain(M, M4.translate(0, can.h * c.fill, 0), M4.scale(can.R - 0.004, 1, can.R - 0.004)), { texture: P.T[c.fillTex || 'oil'] });
        (c.pieces || []).forEach((q, i) => r.draw(P.chunks[i % P.chunks.length], M4.chain(M, M4.translate(q[0], can.h * c.fill - 0.006, q[1]), M4.rotY(q[2] || 0), M4.scale(0.8, 0.8, 0.8))));
      }
    } else {
      r.draw(can.lid, M4.chain(M, M4.translate(0, can.h, 0)), { texture: P.T.lid });
      r.draw(can.pull, M4.chain(M, M4.translate(-0.006, can.h + 0.002, -0.02)));
    }
  }

  function drawJar(r, P, j) {
    const kind = j.jarKind || j.kind || 'jar';
    const J = P[kind];
    const M = j.M;
    if (J.fill && j.fill !== 0) {
      const k = j.fill === undefined ? 1 : j.fill;
      r.draw(J.fill, M4.chain(M, M4.scale(1, k, 1)));
    }
    if (kind === 'pickles') PICKLES.forEach(q => r.draw(P.tomato.whole, M4.chain(M, M4.translate(q[0], q[1], q[2]), M4.scale(0.72, 0.72, 0.72))));
    if (j.label) r.draw(J.label, M, { texture: P.T[j.label] });
    r.draw(J.glass, M, { blend: true, alpha: kind === 'jarPaste' ? 0.9 : 0.35 });
    if (j.lid !== false) r.draw(J.lid, M4.chain(M, M4.translate(0, J.h, 0)));
  }

  const PICKLES = [[0.018, 0.03, 0.01], [-0.02, 0.035, -0.012], [0.0, 0.075, 0.018], [0.015, 0.11, -0.01], [-0.018, 0.1, 0.01]];

  function drawTub(r, P, p, M) {
    const T = P.tub;
    if (p.fill) r.draw(T.content, M4.chain(M, M4.translate(0, T.h * 0.55, 0)), { texture: P.T.broth, tint: [0.62, 0.42, 0.3] });
    r.draw(T.walls, M, { blend: true, alpha: 0.55 });
    r.draw(T.label, M, { texture: P.T.tub });
    r.draw(T.rim, M);
  }

  function drawHeld(r, P, H, h) {
    if (!h || !h.rig) return;
    Hands.draw(r, H, h.rig);
    (h.props || []).forEach(p => drawProp(r, P, p, h.rig));
  }

  function propSize(P, p) {
    if (p.kind === 'can') return p.tall ? { R: P.canTall.R, h: P.canTall.h } : { R: P.can.R, h: P.can.h };
    if (p.kind === 'jar') { const J = P[p.jarKind || 'jar']; return { R: J.R, h: J.h }; }
    if (p.kind === 'soda') return { R: 0.033, h: 0.122 };
    return {};
  }

  function drawProp(r, P, p, rig) {
    const M = p.M || Hands.holdMatrix(rig, p.hold || p.kind, Object.assign(propSize(P, p), p));
    const at = p.local ? M4.chain(M, p.local) : M;
    switch (p.kind) {
      case 'spoon': r.draw(P.spoon, at); break;
      case 'fork': r.draw(P.fork, at); break;
      case 'spatula': r.draw(P.spatula, at); break;
      case 'can': drawCan(r, P, Object.assign({}, p, { M: at })); break;
      case 'jar': drawJar(r, P, Object.assign({}, p, { M: at })); break;
      case 'plate': {
        r.draw(P.plate, at);
        drawChunks(r, P, at, p.chunks);
        if (p.onion) r.draw(P.unitQuad, M4.chain(at, M4.translate(0.02, 0.012, 0.02), M4.scale(0.09, 1, 0.09)), { texture: P.T.onion });
        break;
      }
      case 'pouch': r.draw(P.pouch, at, { texture: P.T.mayo }); break;
      case 'soda': r.draw(P.soda, at, { texture: P.T.soda }); break;
      case 'tomato': r.draw(P.tomato.whole, at); break;
      case 'half': r.draw(P.tomato.half, at, { texture: P.cutTex }); break;
      case 'tub': drawTub(r, P, p, at); break;
      case 'salad': r.draw(P.salad, at); break;
      default: break;
    }
  }

  function drawSteam(r, P, cam, list, t) {
    if (!list) return;
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const rt = V3.norm(V3.cross(f, cam.up || [0, 1, 0]));
    const up = V3.cross(rt, f);
    list.forEach(s => {
      const k = s.k;
      const m = new Float32Array([rt[0] * k, rt[1] * k, rt[2] * k, 0, up[0] * k, up[1] * k, up[2] * k, 0, -f[0], -f[1], -f[2], 0, s.p[0], s.p[1], s.p[2], 1]);
      r.draw(P.quad, m, { texture: P.T.steam, additive: true, alpha: s.a, noFog: true });
    });
  }

  function drawStove(r, P, W, st) {
    const ct = P.cooktop;
    r.draw(ct.counter, null, { texture: ct.woodTex });
    r.draw(ct.frame);
    r.draw(ct.glass, null, { texture: ct.tex });
    (st.refl || []).forEach(q => r.draw(P.unitQuad, M4.chain(M4.translate(q[0], 0.0015, q[1]), M4.scale(q[2], 1, q[2] * (q[4] || 1))), { texture: P.T.reflection, additive: true, alpha: q[3], noFog: true }));
    drawFry(r, P, st.fry);
    drawSauce(r, P, st.sauce);
  }

  function drawTable(r, P, W, st) {
    r.draw(W.felt, null, { texture: P.T[st.feltTex || 'felt'] });
    (st.stains || []).forEach(q => r.draw(P.unitQuad, M4.chain(M4.translate(q[0], 0.0008, q[1]), M4.rotY(q[3] || 0), M4.scale(q[2], 1, q[2])), { texture: P.T.spill }));
    if (st.board) {
      r.draw(P.board, st.board.M, { texture: P.T.board });
      drawChunks(r, P, st.board.M, st.board.chunks);
      if (st.board.onion) r.draw(P.unitQuad, M4.chain(st.board.M, M4.translate(st.board.onion[0], 0.0195, st.board.onion[1]), M4.scale(st.board.onion[2], 1, st.board.onion[2])), { texture: P.T.onion });
    }
    if (st.sauce) drawSauce(r, P, st.sauce);
    if (st.bowl) drawBowl(r, P, st.bowl);
    (st.cans || []).forEach(c => drawCan(r, P, c));
    (st.jars || []).forEach(j => drawJar(r, P, j));
    if (st.noodleBox) {
      r.draw(P.noodleBox, st.noodleBox, { texture: P.T.noodleLid });
    }
    if (st.box) drawBox(r, P, st.box);
  }

  function drawMicro(r, P, W, st) {
    r.draw(P.microwave, null, { texture: P.T.splatter });
    r.draw(P.turntable, M4.rotY(st.spin || 0), { blend: true, alpha: 0.55 });
    if (st.bowl) drawBowl(r, P, Object.assign({}, st.bowl, { M: M4.chain(M4.translate(0, 0.016, 0), M4.rotY(st.spin || 0), st.bowl.M || M4.ident()) }));
  }

  function drawPhone(r, P, W, st) {
    r.draw(W.tileWall, null, { texture: P.T.tiles });
    r.draw(W.phoneStove);
    r.draw(W.pot, st.potM || M4.ident());
    if (st.potLayers) drawVesselContent(r, P, 'round', st.potM || M4.ident(), st.potLayers);
    (st.jars || []).forEach(j => drawJar(r, P, j));
    if (st.mug) r.draw(W.mug, st.mug);
  }

  function drawStream(r, P, W, st) {
    r.draw(W.room, null, { texture: P.T.wallWhite });
    r.draw(W.bed, null, { texture: P.T.floral });
    r.draw(W.window, null, { flat: [0.96, 0.97, 1.0, 1] });
    r.draw(P.chair, M4.chain(M4.translate(0.05, 0, -0.35), M4.rotY(0.1)));
    r.draw(P.mic, M4.translate(-0.9, 0, -0.5));
  }

  function drawRoomExtras(r, P, W, st, t) {
    if (st.tree !== false) {
      const tm = st.treeM || M4.translate(-1.45, 0, 0.6);
      r.draw(P.tree, tm, { texture: P.T.needles });
      P.lights.forEach((L, i) => {
        const on = 0.55 + 0.45 * S(t * 2.3 + L.ph);
        const p = M4.point(tm, L.p);
        r.draw(P.quad, new Float32Array([0.035, 0, 0, 0, 0, 0.035, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1]), { texture: P.T.glow, additive: true, alpha: on, tint: L.col, noFog: true });
      });
    }
    if (st.chair !== false) r.draw(P.chair, st.chairM || M4.translate(0.1, 0, 1.75));
    if (st.potOnBed) r.draw(W.pot, st.potOnBed);
    if (st.cat) drawCat(r, P, st.cat);
  }

  function drawCat(r, P, c) {
    const M = c.M;
    const ph = c.phase || 0;
    r.draw(P.cat.body, M4.chain(M, M4.translate(0, 0.205, 0), M4.rotX(0.04)), { texture: P.T.tabby });
    r.draw(P.cat.head, M4.chain(M, M4.translate(0, 0.225 + 0.008 * S(ph * 2), 0.27), M4.rotY(c.look || 0), M4.rotX(0.25 + (c.nod || 0))));
    [[0.045, 0.16, 0], [-0.045, 0.16, PI], [0.045, -0.17, PI], [-0.045, -0.17, 0]].forEach(([x, z, o]) => {
      const sw = S(ph + o) * 0.4;
      r.draw(P.cat.leg, M4.chain(M, M4.translate(x, 0.18, z), M4.rotX(sw), M4.scale(1, 0.85, 1)));
    });
    let tm = M4.chain(M, M4.translate(0, 0.24, -0.24), M4.rotX(-1.1));
    for (let i = 0; i < 7; i++) {
      r.draw(P.cat.tailSeg, tm);
      tm = M4.chain(tm, M4.translate(0, 0, -0.055), M4.rotX(0.32 + 0.12 * S(ph * 0.5 + i)), M4.rotY(0.15 * S(ph * 0.7 + i)));
    }
  }

  window.SairaSets = { ENVS, build, drawVladRoom, drawStove, drawTable, drawMicro, drawPhone, drawStream, drawRoomExtras, drawHeld, drawProp, drawCan, drawJar, drawBox, drawBowl, drawFry, drawSauce, drawSteam, drawVesselContent, drawChunks, drawCat };
})();
