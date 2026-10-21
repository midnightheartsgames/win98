(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const TAD = {
    body: 0x50516a,
    belly: 0x3c3c50,
    top: 0x6c6c88,
    shine: 0xf0e2f4,
    finTop: 0xcdb6dc,
    finEdge: 0xe8d8f0,
    finLow: 0x6c6a86,
    ink: 0x15141c
  };

  const CAT = {
    fur: 0x3a282a,
    furLight: 0x4e3638,
    ear: 0x5c3a3c,
    eye: 0xf6d63a,
    mark: 0xd02c38,
    wing: 0x1e181c,
    wingBone: 0x2c2226
  };

  const FROGS = {
    pink: { body: 0xe07478, shade: 0xc25a62, belly: 0xf8e4e2, iris: 0xf2b050, lid: 0xc8606a, tongue: 0xf08890 },
    green: { body: 0x9ed4b0, shade: 0x78b494, belly: 0xf4f2e6, iris: 0xeef2a4, lid: 0x84bc9c, tongue: 0xec8088 }
  };

  function sphereAt(b, pos, r, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(r, r, r, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function surfGrid(b, P, a0, a1, p0, p1, nu, nv, colAt) {
    const N = (a, p) => {
      const e = 0.004;
      let n = V3.cross(V3.sub(P(a + e, p), P(a - e, p)), V3.sub(P(a, p + e), P(a, p - e)));
      if (V3.len(n) < 1e-9) n = V3.norm(V3.sub(P(a, p), P(0, 0)));
      return V3.norm(n);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([u, v]) => [a0 + (a1 - a0) * u / nu, p0 + (p1 - p0) * v / nv]);
        b.quad(P(...pts[0]), P(...pts[1]), P(...pts[2]), P(...pts[3]), pts.map(q => rgb(colAt(q[0], q[1]))), null, pts.map(q => N(q[0], q[1])));
      }
    }
  }

  function surfFrame(P, a, p) {
    const e = 0.004;
    const o = P(a, p);
    const ta = V3.norm(V3.sub(P(a + e, p), P(a - e, p)));
    const tp = V3.norm(V3.sub(P(a, p + e), P(a, p - e)));
    const n = V3.norm(V3.cross(ta, tp));
    return Rig.basisM(o, V3.norm(V3.cross(tp, n)), tp, n);
  }

  function tadPoint(a, p) {
    const n = [S(a) * C(p), S(p), C(a) * C(p)];
    const back = clamp(-n[2], 0, 1);
    const pinch = Math.pow(back, 1.6);
    const x = n[0] * 0.122 * (1 - 0.36 * pinch);
    let y = n[1] * 0.104 * (1 - 0.3 * pinch);
    const z = n[2] * (n[2] > 0 ? 0.128 : 0.16);
    if (y < -0.072) y = -0.072 + (y + 0.072) * 0.28;
    return [x, y + 0.084, z];
  }

  function tadColor(a, p) {
    const n = [S(a) * C(p), S(p), C(a) * C(p)];
    const shine = Math.exp(-(((n[0] + 0.28) ** 2) / 0.02 + ((n[1] - 0.72) ** 2) / 0.012 + ((n[2] - 0.55) ** 2) / 0.05));
    if (shine > 0.45) return rgb(TAD.shine, 0.75);
    const k = clamp(n[1] * 0.5 + 0.5, 0, 1);
    const base = rgb(k > 0.62 ? TAD.top : k < 0.3 ? TAD.belly : TAD.body);
    return [base[0], base[1], base[2], 0.12];
  }

  function buildTadBody(r) {
    return K.mesh(r, b => {
      surfGrid(b, tadPoint, -PI, PI, -PI / 2 + 0.02, PI / 2 - 0.02, 26, 14, tadColor);
      [-1, 1].forEach(s => {
        b.push(surfFrame(tadPoint, s * 0.66, 0.14));
        ellAt(b, [0, 0, 0.002], 0.0105, 0.017, 0.006, 8, 5, TAD.ink);
        b.pop();
        b.push(surfFrame(tadPoint, 0, -0.3), M4.rotZ(s * 0.78));
        boxAt(b, [0, 0, 0.001], [0.03, 0.006, 0.004], TAD.ink);
        b.pop();
      });
    });
  }

  function tailCurve(s, wag, lift) {
    const bend = wag * 0.16 * Math.pow(s, 1.5) + wag * 0.03 * S(s * PI);
    return [bend, 0.092 + lift * 0.15 * s * s + 0.025 * S(s * PI), -0.1 - 0.31 * s];
  }

  function buildTail(r, wag, lift, swim) {
    return K.mesh(r, b => {
      const n = 14;
      const row = [];
      for (let i = 0; i <= n; i++) {
        const s = i / n;
        const c = tailCurve(s, wag, lift);
        const ahead = tailCurve(Math.min(1, s + 0.02), wag, lift), behind = tailCurve(Math.max(0, s - 0.02), wag, lift);
        const tan = V3.norm(V3.sub(ahead, behind));
        const side = V3.norm(V3.cross([0, 1, 0], tan));
        const upv = V3.norm(V3.cross(tan, side));
        const tw = (0.15 + 0.85 * s) * (0.75 + lift * 0.2);
        const wd = V3.norm(V3.add(V3.mul(upv, C(tw)), V3.mul(side, S(tw) * (wag >= 0 ? -1 : 1) * 0.6 + S(tw) * 0.4)));
        const width = (swim ? 1.15 : 1) * (0.034 + 0.042 * S(PI * Math.pow(s, 0.8))) * (1 - Math.pow(s, 3));
        const nrm = V3.norm(V3.cross(tan, wd));
        row.push({ c, wd, width, nrm, s });
      }
      for (let i = 0; i < n; i++) {
        const A = row[i], B = row[i + 1];
        const at = (q, k) => V3.add(q.c, V3.mul(q.wd, q.width * k));
        const ce = (q) => rgb(q.s > 0.25 ? TAD.finEdge : TAD.finTop, 0.3);
        const ct = rgb(TAD.finTop, 0.22);
        const cl = rgb(TAD.finLow, 0.1);
        b.quad(at(A, 0), at(B, 0), at(B, 0.62), at(A, 0.62), [ct, ct, ct, ct], null, [A.nrm, B.nrm, B.nrm, A.nrm]);
        b.quad(at(A, 0.62), at(B, 0.62), at(B, 1), at(A, 1), [ct, ct, ce(B), ce(A)], null, [A.nrm, B.nrm, B.nrm, A.nrm]);
        b.quad(at(A, -0.75), at(B, -0.75), at(B, 0), at(A, 0), [cl, cl, cl, cl], null, [A.nrm, B.nrm, B.nrm, A.nrm]);
      }
    });
  }

  function buildSheath(r) {
    return K.mesh(r, b => {
      const P = (a, p) => {
        const q = tadPoint(a, p);
        const back = clamp(-C(a) * C(p), 0, 1);
        return [q[0] * 1.08, (q[1] - 0.084) * 1.15 + 0.07 - back * 0.03, q[2] * 1.05 - back * 0.16];
      };
      surfGrid(b, P, -PI, PI, -PI / 2 + 0.02, 0.15, 18, 7, () => [0.86, 0.88, 0.8, 0.4]);
    });
  }

  function buildCat(r) {
    const body = K.mesh(r, b => {
      b.push(M4.translate(0, -0.012, 0));
      ellAt(b, [0, 0.095, -0.035], 0.052, 0.048, 0.078, 12, 8, CAT.fur);
      ellAt(b, [0, 0.112, 0.012], 0.046, 0.046, 0.05, 10, 7, CAT.fur);
      [-1, 1].forEach(s => {
        const base = [s * 0.032, 0.132, -0.008];
        const pts = [
          [s * 0.05, 0.2, -0.03],
          [s * 0.09, 0.19, -0.05],
          [s * 0.1, 0.15, -0.06],
          [s * 0.085, 0.13, -0.045]
        ];
        for (let i = 0; i < pts.length - 1; i++) b.tri(base, pts[i], pts[i + 1], [0.12, 0.09, 0.1, 0]);
        K.tube(b, [base, pts[0], pts[1]], [0.006, 0.005, 0.003], 4, CAT.wingBone);
      });
      K.tube(b, [
        [0, 0.12, -0.105],
        [0, 0.15, -0.145],
        [0, 0.2, -0.16],
        [0.006, 0.245, -0.145],
        [0.012, 0.262, -0.118]
      ], [0.013, 0.012, 0.011, 0.01, 0.006], 6, CAT.fur);
      b.pop();
    });
    const head = K.mesh(r, b => {
      b.push(M4.scale(1.12));
      ellAt(b, [0, 0, 0], 0.076, 0.066, 0.068, 14, 10, CAT.fur);
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.046, 0.044, -0.004), M4.rotZ(-s * 0.32), M4.rotX(-0.08));
        b.prism(4, 0.032, 0.022, 0, 0, 0, 0.062, CAT.fur, { phase: PI / 4, capBottom: false });
        b.pop();
        b.push(M4.translate(s * 0.046, 0.05, 0.012), M4.rotZ(-s * 0.32), M4.rotX(-0.08));
        b.prism(3, 0.016, 0.004, 0, 0, 0, 0.04, CAT.ear, { capBottom: false });
        b.pop();
        ellAt(b, [s * 0.031, -0.008, 0.06], 0.014, 0.023, 0.009, 8, 6, rgb(CAT.eye, 0.55), M4.rotY(s * 0.42));
      });
      boxAt(b, [-0.024, 0.04, 0.054], [0.024, 0.0055, 0.004], rgb(CAT.mark, 0.4), M4.chain(M4.rotX(-0.62), M4.rotY(-0.3), M4.rotZ(0.75)));
      boxAt(b, [-0.024, 0.04, 0.054], [0.024, 0.0055, 0.004], rgb(CAT.mark, 0.4), M4.chain(M4.rotX(-0.62), M4.rotY(-0.3), M4.rotZ(-0.75)));
      b.pop();
    });
    const leg = K.mesh(r, b => {
      K.tube(b, [[0, 0.008, 0], [0, -0.038, 0.004], [0, -0.054, 0.01]], [0.018, 0.016, 0.015], 6, CAT.fur);
      ellAt(b, [0, -0.056, 0.014], 0.017, 0.009, 0.02, 6, 4, CAT.fur);
    });
    return { body, head, leg };
  }

  function catLegs(o) {
    const ph = o.walk ? o.phase || 0 : 0;
    const amp = o.walk ? 0.55 : 0;
    const sit = o.sit || 0;
    return [
      { at: [0.026, 0.068, 0.03], sw: S(ph) * amp, sit: 0 },
      { at: [-0.026, 0.068, 0.03], sw: S(ph + PI) * amp, sit: 0 },
      { at: [0.028, 0.068, -0.075], sw: S(ph + PI) * amp, sit },
      { at: [-0.028, 0.068, -0.075], sw: S(ph) * amp, sit }
    ];
  }

  function frogMeshes(r, F, open) {
    const body = K.mesh(r, b => {
      ellAt(b, [0, 0.33, -0.02], 0.36, 0.33, 0.3, 18, 12, F.body);
      ellAt(b, [0, 0.68, 0.02], 0.3, 0.27, 0.27, 18, 12, F.body);
      b.push(M4.translate(0, 0.48, 0.1));
      b.ellipsoid(0.27, 0.34, 0.2, 16, 12, F.belly, { colorAt: (p) => (p[2] > -0.02 ? F.belly : F.body) });
      b.pop();
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.33, 0.17, -0.04], 0.16, 0.17, 0.27, 12, 8, F.body, M4.rotY(s * 0.25));
        ellAt(b, [s * 0.38, 0.03, 0.15], 0.11, 0.035, 0.16, 10, 5, F.shade, M4.rotY(s * 0.4));
        ellAt(b, [s * 0.17, 0.88, 0.08], 0.105, 0.1, 0.1, 12, 9, F.body);
        ellAt(b, [s * 0.18, 0.885, 0.135], 0.07, 0.066, 0.05, 12, 8, rgb(F.iris, 0.35));
        boxAt(b, [s * 0.18, 0.878, 0.183], [0.075, 0.014, 0.01], 0x2a1c1c);
        b.push(M4.translate(s * 0.18, 0.885, 0.135));
        K.spherePatch(b, 0.076, 0.072, 0.056, -PI, PI, 0.12, PI / 2, 14, 4, F.lid);
        b.pop();
        K.tube(b, [[s * 0.18 - 0.074, 0.895, 0.14], [s * 0.18, 0.895, 0.19], [s * 0.18 + 0.074, 0.895, 0.14]], [0.007, 0.008, 0.007], 5, 0x3a2224);
        boxAt(b, [s * 0.065, 0.81, 0.27], [0.032, 0.012, 0.01], 0x5a2a2c, M4.rotZ(s * 0.35));
      });
      if (open) {
        ellAt(b, [0, 0.7, 0.24], 0.19, 0.075, 0.06, 14, 8, 0x5c2232);
        ellAt(b, [0, 0.64, 0.27], 0.11, 0.09, 0.05, 12, 8, F.tongue);
      } else {
        K.tube(b, [[-0.24, 0.74, 0.17], [-0.1, 0.7, 0.265], [0.1, 0.7, 0.265], [0.24, 0.74, 0.17]], [0.008, 0.009, 0.009, 0.008], 5, 0x5a2a30);
      }
    });
    const seg = K.mesh(r, b => {
      b.prism(10, 1, 1, -1, 1, 1, 0, F.body, { capTop: true, capBottom: true });
    });
    const hand = K.mesh(r, b => {
      [-0.5, 0, 0.5].forEach(a => {
        b.push(M4.rotY(a));
        K.tube(b, [[0, 0, 0], [0, -0.02, 0.09], [0, -0.03, 0.16]], [0.032, 0.026, 0.022], 6, F.body);
        sphereAt(b, [0, -0.03, 0.17], 0.036, 7, 5, F.shade);
        b.pop();
      });
    });
    const tongue = K.mesh(r, b => {
      b.prism(8, 1, 1, -1, 1, 1, 0, F.tongue, { capTop: false, capBottom: false });
    });
    return { body, seg, hand, tongue };
  }

  function build(r) {
    const tails = new Map();
    return {
      r,
      tadBody: buildTadBody(r),
      sheath: buildSheath(r),
      tail(wag, lift, swim) {
        const qw = Math.round(clamp(wag, -1, 1) * 10), ql = Math.round(clamp(lift, -1, 1.5) * 8);
        const key = qw + ':' + ql + ':' + (swim ? 1 : 0);
        if (!tails.has(key)) tails.set(key, buildTail(r, qw / 10, ql / 8, swim));
        return tails.get(key);
      },
      cat: buildCat(r),
      frogs: {
        pink: frogMeshes(r, FROGS.pink, false),
        green: frogMeshes(r, FROGS.green, true)
      },
      shadow: K.mesh(r, b => b.disc(1, 18, [0.1, 0.16, 0.08, 0], 0)),
      foam: K.mesh(r, b => {
        [[-0.16, 0.03, 0.08, 0.06], [-0.1, 0.07, 0.12, 0.045], [0.13, 0.04, 0.06, 0.055], [0.18, 0.03, -0.04, 0.04], [-0.05, 0.03, -0.13, 0.05], [0.07, 0.03, 0.15, 0.038], [-0.2, 0.02, -0.06, 0.035]].forEach(([x, y, z, rad]) => sphereAt(b, [x, y, z], rad, 8, 6, rgb(0xfafcfc, 0.55)));
      })
    };
  }

  function drawShadow(r, V, x, y, z, rx, rz, alpha) {
    r.draw(V.shadow, M4.chain(M4.translate(x, y + 0.004, z), M4.scale(rx, 1, rz)), { blend: true, alpha: alpha === undefined ? 0.32 : alpha });
  }

  function tadMatrix(td) {
    const p = td.pos || [0, 0, 0];
    const sc = td.scale || 1;
    const sq = td.squash || 1;
    if (td.matrix) return M4.chain(td.matrix, M4.scale(sc / Math.sqrt(sq), sc * sq, sc / Math.sqrt(sq)));
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(td.yaw || 0), M4.rotX(td.pitch || 0), M4.rotZ(td.roll || 0), M4.scale(sc / Math.sqrt(sq), sc * sq, sc / Math.sqrt(sq)));
  }

  function drawTadpole(r, V, td, t) {
    if (!td) return;
    const p = td.pos || [0, 0, 0];
    const sc = td.scale || 1;
    if (td.ground !== undefined && !td.matrix) {
      const h = Math.max(0, p[1] - td.ground);
      const k = 1 / (1 + h * 3);
      drawShadow(r, V, p[0], td.ground, p[2], 0.17 * sc * k, 0.2 * sc * k, (td.shadowAlpha || 0.34) * k);
    }
    const base = tadMatrix(td);
    const wag = td.wag !== undefined ? td.wag : S(t * (td.wagSpeed || 9)) * (td.wagAmp === undefined ? 0.45 : td.wagAmp);
    const tint = td.tint ? { tint: td.tint } : {};
    if (td.swim) r.draw(V.sheath, base, { blend: true, alpha: 0.42 });
    r.draw(V.tadBody, base, tint);
    const tailM = td.stretch ? M4.chain(base, M4.translate(0, 0, -0.1), M4.scale(1, 1, td.stretch), M4.translate(0, 0, 0.1)) : base;
    r.draw(V.tail(wag, td.lift === undefined ? 0.8 : td.lift, td.swim), tailM, tint);
    if (td.foam) r.draw(V.foam, M4.chain(M4.translate(p[0], td.foamY === undefined ? p[1] : td.foamY, p[2]), M4.scale(sc * 1.1)));
  }

  function catMatrix(o) {
    if (o.matrix) return o.matrix;
    const p = o.pos || [0, 0, 0];
    const sc = o.scale || 1;
    const bob = o.walk ? Math.abs(S(o.phase || 0)) * 0.008 : 0;
    return M4.chain(M4.translate(p[0], p[1] + bob * sc, p[2]), M4.rotY(o.yaw || 0), M4.rotX(o.pitch || 0), M4.rotZ(o.roll || 0), M4.scale(sc));
  }

  function drawCat(r, V, o) {
    if (!o) return;
    const base = catMatrix(o);
    const p = o.pos || [0, 0, 0];
    if (o.ground !== undefined && !o.matrix) drawShadow(r, V, p[0], o.ground, p[2], 0.09 * (o.scale || 1), 0.12 * (o.scale || 1), 0.3);
    const sitTilt = (o.sit || 0) * 0.5;
    const bodyM = M4.chain(base, M4.translate(0, 0.074, -0.075), M4.rotX(-sitTilt), M4.translate(0, -0.074, 0.075));
    r.draw(V.cat.body, bodyM);
    const hd = o.head || [0, 0, 0];
    r.draw(V.cat.head, M4.chain(bodyM, M4.translate(0, 0.152, 0.062), M4.rotX(sitTilt * 0.8), M4.rotY(hd[1]), M4.rotX(hd[0]), M4.rotZ(hd[2])));
    catLegs(o).forEach((L, i) => {
      const hang = o.held ? 0.35 : 0;
      const m = i < 2 ? bodyM : base;
      const sitLeg = i >= 2 ? (o.sit || 0) : 0;
      r.draw(V.cat.leg, M4.chain(m, M4.translate(L.at[0], L.at[1] - sitLeg * 0.03, L.at[2] + sitLeg * 0.02), M4.rotX(L.sw + hang - sitLeg * 1.2)));
    });
  }

  function limb(r, mesh, a, b, rad, zHint) {
    const len = V3.len(V3.sub(b, a));
    r.draw(mesh, M4.mul(Rig.boneM(a, b, zHint || [0, 0, 1]), M4.scale(rad, len, rad)));
  }

  function frogPoint(base, p) {
    return M4.point(base, p);
  }

  function drawFrog(r, V, fr) {
    if (!fr) return;
    const M = V.frogs[fr.kind === 'green' ? 'green' : 'pink'];
    const p = fr.pos || [0, 0, 0];
    const sc = fr.scale || 1;
    const base = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(fr.yaw || 0), M4.rotX(fr.pitch || 0), M4.rotZ(fr.roll || 0), M4.scale(sc));
    if (fr.ground !== undefined) drawShadow(r, V, p[0], fr.ground, p[2], 0.5 * sc, 0.45 * sc, 0.3);
    r.draw(M.body, base);
    const arms = fr.arms || [[0.27, 0.0, 0.3], [-0.27, 0.0, 0.3]];
    [1, -1].forEach((s, i) => {
      const sh = frogPoint(base, [s * 0.2, 0.52, 0.15]);
      const hd = fr.armsW ? fr.armsW[i] : frogPoint(base, arms[i]);
      const mid = V3.add(V3.lerp(sh, hd, 0.5), V3.mul(M4.dir(base, [s * 0.12, 0, -0.04]), 1));
      limb(r, M.seg, sh, mid, 0.07 * sc);
      limb(r, M.seg, mid, hd, 0.055 * sc);
      const dir = V3.norm(V3.sub(hd, mid));
      r.draw(M.hand, M4.mul(Rig.boneM(hd, V3.add(hd, dir), M4.dir(base, [0, 0, 1])), M4.chain(M4.rotX(fr.handTilt || 0), M4.scale(sc))));
    });
    if (fr.legs) {
      fr.legs.forEach((L, i) => {
        const s = i === 0 ? 1 : -1;
        const hip = frogPoint(base, [s * 0.26, 0.2, -0.12]);
        const knee = frogPoint(base, L[0]);
        const foot = frogPoint(base, L[1]);
        limb(r, M.seg, hip, knee, 0.11 * sc);
        limb(r, M.seg, knee, foot, 0.07 * sc);
        r.draw(M.hand, M4.mul(Rig.boneM(foot, V3.add(foot, V3.norm(V3.sub(foot, knee))), M4.dir(base, [0, 0, 1])), M4.scale(sc * 1.3)));
      });
    }
    if (fr.tongueTo) {
      const mouth = frogPoint(base, [0, 0.66, 0.3]);
      const end = fr.tongueTo;
      const ctrl = V3.add(V3.lerp(mouth, end, 0.5), fr.tongueBow || [0, 0.4 * sc, 0]);
      const n = 10;
      let prev = mouth;
      for (let i = 1; i <= n; i++) {
        const u = i / n;
        const q = V3.add(V3.add(V3.mul(mouth, (1 - u) * (1 - u)), V3.mul(ctrl, 2 * u * (1 - u))), V3.mul(end, u * u));
        limb(r, M.tongue, prev, q, (0.07 - 0.02 * u) * sc * (fr.tongueWidth || 1));
        prev = q;
      }
    }
  }

  window.KonosubaCritters = { TAD, CAT, FROGS, build, drawTadpole, drawCat, drawFrog, drawShadow, tadMatrix, catMatrix };
})();
