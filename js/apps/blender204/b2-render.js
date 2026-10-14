(function (B) {
  'use strict';
  const V = B.V, M = B.M;

  const OSA_TABLES = {};
  function osaOffsets(n) {
    if (OSA_TABLES[n]) return OSA_TABLES[n];
    const pts = [];
    if (n <= 1) pts.push([0.5, 0.5]);
    else {
      let s = 9973;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const g = Math.ceil(Math.sqrt(n));
      for (let i = 0; i < n; i++) {
        const gx = i % g, gy = Math.floor(i / g);
        pts.push([(gx + 0.25 + rnd() * 0.5) / g, (gy + 0.25 + rnd() * 0.5) / Math.ceil(n / g)]);
      }
    }
    OSA_TABLES[n] = pts;
    return pts;
  }

  function resolveMat(ob, idx) {
    const d = ob.data;
    if (ob.mats && ob.mats[idx] && (ob.colbits & (1 << idx))) return ob.mats[idx];
    return (d && d.mats && d.mats[idx]) || null;
  }

  const DEFMAT = (() => {
    const m = { r: 0.8, g: 0.8, b: 0.8, specr: 1, specg: 1, specb: 1, mirr: 1, mirg: 1, mirb: 1, ref: 0.8, alpha: 1, emit: 0, amb: 0.5, spec: 0.5, hard: 50, spectra: 0, add: 0, zoffs: 0, mode: { shadow: true, traceable: true }, halo: { size: 0.5, hard: 50, add: 0, flags: {} }, mtex: [] };
    return m;
  })();

  function meshForRender(ob, ctx) {
    if (ob.type === 'mesh') return B.displayMesh ? B.displayMesh(ob, ctx) : ob.data;
    if (B.ObTypes && B.ObTypes[ob.type] && B.ObTypes[ob.type].dispMesh) return B.ObTypes[ob.type].dispMesh(ob, ctx);
    return null;
  }

  function texSpace(me) {
    if (me.texspace) return me.texspace;
    const pts = me.verts.map(v => v.co);
    if (!pts.length) return { loc: [0, 0, 0], size: [1, 1, 1] };
    const [mn, mx] = B.View3D.boundBox(pts);
    const size = [0, 1, 2].map(i => Math.max((mx[i] - mn[i]) / 2, 1e-4));
    return { loc: V.mid(mn, mx), size };
  }

  function buildDB(ctx, sce, opts) {
    const cam = opts.camera;
    const camMat = M.normalized3(cam.obmat);
    camMat[12] = cam.obmat[12]; camMat[13] = cam.obmat[13]; camMat[14] = cam.obmat[14];
    const view = M.invert(camMat);
    const db = { verts: [], tris: [], halos: [], wires: [], lamps: [], view, camPos: [cam.obmat[12], cam.obmat[13], cam.obmat[14]] };
    const lay = sce.lay;
    const bases = allBases(sce).filter(b => b.object.lay & lay);
    bases.forEach(b => B.Data.whereIs(b.object));
    bases.forEach(b => {
      const ob = b.object;
      if (ob.type === 'lamp') {
        const la = ob.data;
        const pos = M.loc(view, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
        const dirW = V.norm(M.dir(ob.obmat, [0, 0, -1]));
        const dir = V.norm(M.dir(view, dirW));
        db.lamps.push({ ob, la, pos, dir, posW: [ob.obmat[12], ob.obmat[13], ob.obmat[14]], dirW, lay: ob.lay, col: [la.r, la.g, la.b], spotcos: Math.cos(la.spotsize * B.DEG / 2), spotbl: (1 - Math.cos(la.spotsize * B.DEG / 2)) * la.spotblend });
        return;
      }
      if (ob.type === 'camera' || ob.type === 'empty' || ob.type === 'lattice' || ob.type === 'ika') return;
      if (ob.transflag && ob.transflag.dupliverts && ob.type === 'mesh') {
        const kids = allBases(sce).filter(k => k.object.parent === ob);
        kids.forEach(k => {
          ob.data.verts.forEach(v => {
            const p = M.loc(ob.obmat, v.co);
            const kobm = k.object.obmat.slice();
            const pm = ob.obmat;
            const rel = M.mul(M.invert(pm), kobm);
            const m = M.mul(M.translate(p), M.mul(M.normalized3(pm).map((x, i) => (i >= 12 && i < 15 ? 0 : x)), rel));
            m[12] = p[0] + rel[12]; m[13] = p[1] + rel[13]; m[14] = p[2] + rel[14];
            addMesh(ctx, db, k.object, m, view);
          });
        });
        return;
      }
      if (ob.parent && ob.parent.transflag && ob.parent.transflag.dupliverts && ob.parent.type === 'mesh' && (ob.parent.lay & lay)) return;
      addMesh(ctx, db, ob, ob.obmat, view);
    });
    return db;
  }

  function allBases(sce) {
    const out = sce.bases.slice();
    let s = sce.set, guard = 0;
    while (s && guard++ < 8) { s.bases.forEach(b => out.push(b)); s = s.set; }
    return out;
  }

  function addMesh(ctx, db, ob, obmat, view) {
    const me = meshForRender(ob, ctx);
    if (!me || !me.verts.length) return;
    const mv = M.mul(view, obmat);
    const nmat = M.transpose3(M.invert(mv));
    const base = db.verts.length;
    const ts = texSpace(ob.type === 'mesh' ? ob.data : me);
    const fnorms = me.faces.map(f => (f.v.length > 2 ? V.norm(M.dir(nmat, B.MeshOps.faceNormal(me, f))) : [0, 0, 1]));
    const vn = me.verts.map(() => [0, 0, 0]);
    me.faces.forEach((f, i) => { if (f.v.length > 2) f.v.forEach(k => { vn[k] = V.add(vn[k], fnorms[i]); }); });
    me.verts.forEach((v, i) => {
      const co = M.loc(mv, v.co);
      db.verts.push({ co, no: V.len(vn[i]) ? V.norm(vn[i]) : [0, 0, 1], orco: [(v.co[0] - ts.loc[0]) / ts.size[0], (v.co[1] - ts.loc[1]) / ts.size[1], (v.co[2] - ts.loc[2]) / ts.size[2]], glob: M.loc(obmat, v.co), local: v.co, ob, sticky: me.sticky ? me.sticky[i] : null, vcol: me.vcols ? me.vcols[i] : null });
    });
    const autosmooth = ob.type === 'mesh' && me.flag && me.flag.autosmooth ? Math.cos((me.smoothresh || 30) * B.DEG) : null;
    me.faces.forEach((f, fi) => {
      const ma = resolveMat(ob, f.mat || 0) || DEFMAT;
      if (ma.mode && ma.mode.halo) {
        f.v.forEach(k => { if (!db.halos.some(h => h.v === base + k)) db.halos.push({ v: base + k, ma }); });
        return;
      }
      if (f.v.length === 2 || (ma.mode && ma.mode.wire)) {
        for (let i = 0; i < f.v.length; i++) {
          const a = f.v[i], b = f.v[(i + 1) % f.v.length];
          if (f.v.length === 2 && i === 1) break;
          db.wires.push({ a: base + a, b: base + b, ma, ob });
        }
        if (f.v.length === 2) return;
        if (ma.mode && ma.mode.wire) return;
      }
      const smooth = f.smooth || (autosmooth != null);
      const tri = (i0, i1, i2, uvIdx) => {
        db.tris.push({
          v: [base + f.v[i0], base + f.v[i1], base + f.v[i2]], n: fnorms[fi], ma, ob, smooth, autosmooth,
          uv: f.uv ? [f.uv[uvIdx[0]], f.uv[uvIdx[1]], f.uv[uvIdx[2]]] : null,
          col: f.col ? [f.col[uvIdx[0]], f.col[uvIdx[1]], f.col[uvIdx[2]]] : null,
          tf: f.tf || null
        });
      };
      if (f.v.length === 3) tri(0, 1, 2, [0, 1, 2]);
      else { tri(0, 1, 2, [0, 1, 2]); tri(0, 2, 3, [0, 2, 3]); }
    });
  }

  function makeShadowBuffers(db, opts) {
    db.lamps.forEach(L => {
      const la = L.la;
      if (la.type !== 'spot' || !la.mode.shadow || !opts.shadows) return;
      const size = Math.min(la.bufsize || 512, opts.preview ? 256 : 2560);
      const lmat = M.mul(M.translate(L.posW), M.normalized3(L.ob.obmat).map((v, i) => (i >= 12 && i < 15 ? 0 : v)));
      lmat[12] = L.posW[0]; lmat[13] = L.posW[1]; lmat[14] = L.posW[2];
      const lview = M.invert(lmat);
      const half = Math.tan(la.spotsize * B.DEG / 2);
      const n = la.clipsta || 0.5, f = la.clipend || 40;
      const proj = M.frustum(-half * n, half * n, -half * n, half * n, n, f);
      const pm = M.mul(proj, lview);
      const z = new Float32Array(size * size).fill(Infinity);
      const toW = M.invert(db.view);
      const pv = db.verts.map(v => { const w = M.loc(toW, v.co); const c = M.proj(pm, w); return c; });
      db.tris.forEach(t => {
        if (t.ma.mode && t.ma.mode.shadow === false) return;
        const cs = t.v.map(i => pv[i]);
        if (cs.some(c => c[3] <= n * 0.5)) return;
        const s = cs.map(c => [(c[0] / c[3] * 0.5 + 0.5) * size, (c[1] / c[3] * 0.5 + 0.5) * size, c[3]]);
        rasterTri(s, size, size, (x, y, w0, w1, w2) => {
          const d = w0 * s[0][2] + w1 * s[1][2] + w2 * s[2][2];
          const i = y * size + x;
          if (d < z[i]) z[i] = d;
        });
      });
      L.shadow = { z, size, pm, bias: (la.bias || 1) * 0.02, soft: la.soft || 3, samp: Math.max(1, Math.min(16, la.samp || 3)) };
    });
  }

  function rasterTri(s, W, H, cb) {
    const minX = Math.max(0, Math.floor(Math.min(s[0][0], s[1][0], s[2][0])));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(s[0][0], s[1][0], s[2][0])));
    const minY = Math.max(0, Math.floor(Math.min(s[0][1], s[1][1], s[2][1])));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(s[0][1], s[1][1], s[2][1])));
    const a = s[0], b = s[1], c = s[2];
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) < 1e-12) return;
    const inv = 1 / area;
    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) * inv;
        const w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        cb(x, y, w0, w1, w2);
      }
    }
  }

  function shadowFactor(L, pw) {
    const sb = L.shadow;
    if (!sb) return 1;
    const c = M.proj(sb.pm, pw);
    if (c[3] <= 0) return 1;
    const x = (c[0] / c[3] * 0.5 + 0.5) * sb.size, y = (c[1] / c[3] * 0.5 + 0.5) * sb.size;
    if (x < 0 || y < 0 || x >= sb.size || y >= sb.size) return 1;
    const depth = c[3] - sb.bias;
    const r = sb.soft * 0.5;
    let lit = 0, tot = 0;
    const n = sb.samp;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const sx = Math.floor(x + (n > 1 ? (i / (n - 1) - 0.5) * r : 0)), sy = Math.floor(y + (n > 1 ? (j / (n - 1) - 0.5) * r : 0));
      tot++;
      if (sx < 0 || sy < 0 || sx >= sb.size || sy >= sb.size) { lit++; continue; }
      if (depth <= sb.z[sy * sb.size + sx]) lit++;
    }
    return lit / tot;
  }

  function texChannels(ma, sp, ctx) {
    if (!ma.mtex) return;
    for (let k = 0; k < ma.mtex.length; k++) {
      const mt = ma.mtex[k];
      if (!mt || !mt.tex || mt.tex.type === 'none') continue;
      if (ma.septex && k !== ma.texact) continue;
      let co;
      switch (mt.texco) {
        case 'glob': co = sp.glob; break;
        case 'object': co = mt.object ? M.loc(M.invert(mt.object.obmat), sp.glob) : sp.glob; break;
        case 'uv': co = sp.uv ? [sp.uv[0] * 2 - 1, sp.uv[1] * 2 - 1, 0] : sp.orco; break;
        case 'win': co = [sp.win[0] * 2 - 1, sp.win[1] * 2 - 1, 0]; break;
        case 'nor': co = sp.nor; break;
        case 'refl': co = sp.refl; break;
        case 'stick': co = sp.sticky ? [sp.sticky[0], sp.sticky[1], 0] : sp.orco; break;
        default: co = sp.orco;
      }
      const tc = B.Tex.texmap(mt, co);
      const s = B.Tex.sample(mt.tex, tc);
      let tin = s.tin;
      if (mt.neg) tin = 1 - tin;
      const m = mt.mapto;
      if (m.col || m.csp || m.cmir) {
        let tcol, fac = mt.colfac;
        if (s.rgb && !mt.noRGB) { tcol = s.rgb; fac *= s.ta; } else { tcol = [mt.r, mt.g, mt.b]; fac *= tin; }
        if (m.col) sp.col = B.Tex.blendCol(mt.blendtype, sp.col, tcol, fac);
        if (m.csp) sp.spec_col = B.Tex.blendCol(mt.blendtype, sp.spec_col, tcol, fac);
        if (m.cmir) sp.mir = B.Tex.blendCol(mt.blendtype, sp.mir, tcol, fac);
      }
      if (m.nor) {
        if (s.nor) sp.nor = V.norm(V.add(sp.nor, V.mul(s.nor, mt.norfac * 2)));
        else {
          const e = 0.02;
          const dx = B.Tex.sample(mt.tex, V.add(tc, [e, 0, 0])).tin - s.tin, dy = B.Tex.sample(mt.tex, V.add(tc, [0, e, 0])).tin - s.tin;
          sp.nor = V.norm(V.add(sp.nor, [-dx * mt.norfac * 4, -dy * mt.norfac * 4, 0]));
        }
      }
      const fv = mt.varfac * (s.rgb ? s.ta * ((s.rgb[0] + s.rgb[1] + s.rgb[2]) / 3) : tin);
      if (m.ref) sp.ref = B.Tex.blendVal(mt.blendtype, sp.ref, mt.def_var, fv);
      if (m.spec) sp.spec = B.Tex.blendVal(mt.blendtype, sp.spec, mt.def_var, fv);
      if (m.hard) sp.hard = Math.max(1, B.Tex.blendVal(mt.blendtype, sp.hard, mt.def_var * 128, fv));
      if (m.alpha) sp.alpha = B.Tex.blendVal(mt.blendtype, sp.alpha, mt.def_var, fv);
      if (m.emit) sp.emit = B.Tex.blendVal(mt.blendtype, sp.emit, mt.def_var, fv);
      if (mt.stencil) break;
    }
  }

  function shade(ctx, db, world, sp, lamps) {
    const ma = sp.ma;
    sp.col = sp.vcolPaint ? sp.vcolPaint.slice() : [ma.r, ma.g, ma.b];
    sp.spec_col = [ma.specr, ma.specg, ma.specb];
    sp.mir = [ma.mirr, ma.mirg, ma.mirb];
    sp.ref = ma.ref; sp.spec = ma.spec; sp.hard = ma.hard; sp.alpha = ma.alpha; sp.emit = ma.emit;
    texChannels(ma, sp, ctx);
    if (ma.mode.shadeless) return [sp.col[0], sp.col[1], sp.col[2], sp.alpha];
    let n = sp.nor;
    const view = sp.view;
    if (V.dot(n, view) > 0 && !(ma.mode.onlyshadow)) n = V.neg(n);
    const P = sp.co;
    let dr = 0, dg = 0, db2 = 0, sr = 0, sg = 0, sb = 0;
    let shadowAcc = 0, shadowN = 0;
    for (const L of lamps) {
      const la = L.la;
      if (la.mode.layer && !(L.lay & sp.ob.lay)) continue;
      let lv, att = 1, d = 1;
      if (la.type === 'sun' || la.type === 'hemi') lv = V.neg(L.dir);
      else {
        const dv = V.sub(L.pos, P);
        d = V.len(dv) || 1e-6;
        lv = V.mul(dv, 1 / d);
        if (la.mode.quad) att = la.dist / (la.dist + la.quad1 * d + la.quad2 * d * d / la.dist);
        else att = la.dist / (la.dist + d);
        if (la.mode.sphere) att *= Math.max(0, (la.dist - d) / la.dist);
      }
      if (la.type === 'spot') {
        const c = V.dot(V.neg(lv), L.dir);
        if (c <= L.spotcos) continue;
        if (L.spotbl > 0) {
          const t = (c - L.spotcos) / L.spotbl;
          if (t < 1) att *= t * t * (3 - 2 * t);
        }
        if (la.mode.square) void 0;
      }
      let inp = V.dot(n, lv);
      if (la.type === 'hemi') inp = 0.5 * inp + 0.5;
      if (inp <= 0) continue;
      let shad = 1;
      if (L.shadow && ma.mode.shadow !== false && (ma.mode.shadow || true)) shad = shadowFactor(L, sp.glob);
      const e = la.energy * att * (la.mode.negative ? -1 : 1);
      if (la.mode.onlyshadow) { shadowAcc += (1 - shad) * Math.min(1, inp * att); shadowN++; continue; }
      const k = inp * e * shad;
      dr += k * L.col[0]; dg += k * L.col[1]; db2 += k * L.col[2];
      if (la.type !== 'hemi' && sp.spec > 0) {
        const h = V.norm(V.sub(lv, view));
        const nh = V.dot(n, h);
        if (nh > 0) {
          const s = Math.pow(nh, sp.hard) * sp.spec * e * shad;
          sr += s * L.col[0]; sg += s * L.col[1]; sb += s * L.col[2];
        }
      }
    }
    const amb = world ? [world.ambr, world.ambg, world.ambb] : [0, 0, 0];
    const ref = sp.ref;
    let r = sp.col[0] * (dr * ref + ma.amb * amb[0] + sp.emit);
    let g = sp.col[1] * (dg * ref + ma.amb * amb[1] + sp.emit);
    let b = sp.col[2] * (db2 * ref + ma.amb * amb[2] + sp.emit);
    if (sp.vcolLight) { r += sp.vcolLight[0] * sp.col[0]; g += sp.vcolLight[1] * sp.col[1]; b += sp.vcolLight[2] * sp.col[2]; }
    r += sr * sp.spec_col[0]; g += sg * sp.spec_col[1]; b += sb * sp.spec_col[2];
    let alpha = sp.alpha;
    if (ma.mode.onlyshadow) { alpha = shadowN ? shadowAcc / shadowN : 0; return [0, 0, 0, alpha]; }
    if (ma.spectra && alpha < 1) alpha = Math.min(1, alpha + ma.spectra * Math.max(sr, sg, sb));
    return [r, g, b, alpha];
  }

  function skyColor(world, dirView, winx, winy, viewInv) {
    if (!world) return [0, 0, 0];
    const hor = [world.horr, world.horg, world.horb], zen = [world.zenr, world.zeng, world.zenb];
    if (!world.skytype.blend) return hor.map(v => v * (world.exposure || 1));
    let t;
    if (world.skytype.paper) t = winy;
    else {
      const d = V.norm(M.dir(viewInv, dirView));
      t = world.skytype.real ? Math.abs(d[2]) : (d[2] * 0.5 + 0.5);
      if (world.skytype.real && d[2] < 0) t = Math.abs(d[2]);
    }
    t = Math.max(0, Math.min(1, t));
    return hor.map((h, i) => (h * (1 - t) + zen[i] * t) * (world.exposure || 1));
  }

  function mistFactor(world, dist, worldZ) {
    if (!world || !world.mist.on) return 0;
    const m = world.mist;
    let f = m.dist > 0 ? (dist - m.sta) / m.dist : (dist > m.sta ? 1 : 0);
    f = Math.max(0, Math.min(1, f));
    if (m.type === 'quad') f = f * f; else if (m.type === 'sqr') f = Math.sqrt(f);
    if (m.height > 0 && worldZ > 0) f *= Math.max(0, 1 - worldZ / m.height);
    if (m.intensity) f = m.intensity + (1 - m.intensity) * f;
    return Math.max(0, Math.min(1, f));
  }

  function* renderJob(ctx, sce, opts) {
    const r = sce.r;
    const pct = (opts.size || r.size) / 100;
    const W = Math.max(1, Math.round(r.xsch * pct)), H = Math.max(1, Math.round(r.ysch * pct));
    const camob = opts.camera;
    B.Data.whereIs(camob);
    const cam = camob.data && camob.type === 'camera' ? camob.data : { lens: 35, clipsta: 0.1, clipend: 100, ortho: false };
    const world = sce.world;
    const db = buildDB(ctx, sce, { camera: camob });
    const shadows = r.mode.shadow && !opts.noShadows;
    makeShadowBuffers(db, { shadows, preview: opts.preview });
    const aspx = r.xasp / r.yasp;
    const fac = 16 / (cam.lens || 35);
    const rw = W * aspx, rh = H;
    let hx, hy;
    if (rw >= rh) { hx = fac; hy = fac * rh / rw; } else { hy = fac; hx = fac * rw / rh; }
    if (opts.viewWin) { hx = opts.viewWin.hx; hy = opts.viewWin.hy; }
    const ortho = !!cam.ortho || opts.ortho;
    const orthoScale = opts.orthoScale || (cam.lens ? 32 / cam.lens * 4 : 4);
    const near = cam.clipsta || 0.1, far = cam.clipend || 100;
    const proj = co => {
      const z = -co[2];
      if (ortho) return [(co[0] / (hx * orthoScale) * 0.5 + 0.5) * W, (co[1] / (hy * orthoScale) * 0.5 + 0.5) * H, z];
      if (z <= 1e-6) return null;
      return [(co[0] / (z * hx) * 0.5 + 0.5) * W, (co[1] / (z * hy) * 0.5 + 0.5) * H, z];
    };
    const sv = db.verts.map(v => proj(v.co));
    const osaN = r.mode.osa && !opts.noOsa ? (r.osa || 8) : 1;
    const offs = osaOffsets(osaN);
    const img = new Float32Array(W * H * 4);
    const zimg = new Float32Array(W * H).fill(Infinity);
    const viewInv = M.invert(db.view);
    const bd = r.mode.border && !opts.preview ? r.border : [0, 0, 1, 1];
    const bx1 = Math.floor(bd[0] * W), by1 = Math.floor(bd[1] * H), bx2 = Math.ceil(bd[2] * W), by2 = Math.ceil(bd[3] * H);
    const tris = db.tris.map((t, i) => {
      const s = t.v.map(k => sv[k]);
      if (s.some(p => !p)) return null;
      const zs = s.map(p => p[2]);
      if (Math.max(...zs) < near || Math.min(...zs) > far) return null;
      return { t, s, i, transp: !!(t.ma.mode && t.ma.mode.ztransp) && (t.ma.alpha < 1 || (t.ma.mtex || []).some(m => m && m.mapto && m.mapto.alpha)) };
    }).filter(Boolean);
    const clipNear = db.tris.filter((t, i) => t.v.some(k => !sv[k])).map(t => clipTriNear(t, db, near)).flat();
    clipNear.forEach(ct => {
      const s = ct.co.map(c => proj(c));
      if (s.some(p => !p)) return;
      tris.push({ t: ct.t, s, clip: ct, transp: !!(ct.t.ma.mode && ct.t.ma.mode.ztransp) && ct.t.ma.alpha < 1 });
    });
    const TILE = 64;
    const lamps = db.lamps;
    for (let ty = by1; ty < by2; ty += TILE) {
      for (let tx = bx1; tx < bx2; tx += TILE) {
        if (opts.cancelled && opts.cancelled()) return null;
        const tw = Math.min(TILE, bx2 - tx), th = Math.min(TILE, by2 - ty);
        const n = tw * th;
        const zb = new Float32Array(n * osaN).fill(Infinity);
        const fb = new Int32Array(n * osaN).fill(-1);
        const tlist = [];
        tris.forEach((tr, ti) => {
          const s = tr.s;
          const mnx = Math.min(s[0][0], s[1][0], s[2][0]), mxx = Math.max(s[0][0], s[1][0], s[2][0]);
          const mny = Math.min(s[0][1], s[1][1], s[2][1]), mxy = Math.max(s[0][1], s[1][1], s[2][1]);
          if (mxx < tx || mnx > tx + tw || mxy < ty || mny > ty + th) return;
          if (tr.transp) { tlist.push(ti); return; }
          const zoff = tr.t.ma.zoffs || 0;
          for (let si = 0; si < osaN; si++) {
            const o = offs[si];
            const ss = s.map(p => [p[0] - tx - o[0] + 0.5, p[1] - ty - o[1] + 0.5, p[2]]);
            rasterTri(ss, tw, th, (x, y, w0, w1, w2) => {
              const iz = w0 / ss[0][2] + w1 / ss[1][2] + w2 / ss[2][2];
              const z = 1 / iz - zoff;
              const idx = (y * tw + x) * osaN + si;
              if (z < zb[idx] && z >= near) { zb[idx] = z; fb[idx] = ti; }
            });
          }
        });
        for (let y = 0; y < th; y++) {
          for (let x = 0; x < tw; x++) {
            const p = y * tw + x;
            const gx = tx + x, gy = ty + y;
            const counts = new Map();
            let zmin = Infinity;
            for (let si = 0; si < osaN; si++) {
              const f = fb[p * osaN + si];
              if (f >= 0) { counts.set(f, (counts.get(f) || 0) + 1); zmin = Math.min(zmin, zb[p * osaN + si]); }
            }
            const dirView = viewDir(gx + 0.5, gy + 0.5, W, H, hx, hy, ortho);
            const sky = skyColor(world, dirView, gx / W, gy / H, viewInv);
            let cr = 0, cg = 0, cb = 0, ca = 0, cov = 0;
            counts.forEach((cnt, ti) => {
              const tr = tris[ti];
              const res = shadeTri(ctx, db, world, tr, gx + 0.5, gy + 0.5, W, H, hx, hy, ortho, lamps, sky);
              if (!res) return;
              const w = cnt / osaN;
              cr += res[0] * w; cg += res[1] * w; cb += res[2] * w; ca += res[3] * w; cov += w;
            });
            let outc = [cr, cg, cb], outa = ca;
            if (cov < 1) {
              const rest = 1 - cov;
              if (r.alphamode === 'key') { void 0; }
              else if (r.alphamode !== 'premul') { outc = [outc[0] + sky[0] * rest, outc[1] + sky[1] * rest, outc[2] + sky[2] * rest]; }
            }
            if (tlist.length) {
              const zlimit = cov >= 1 ? zmin : Infinity;
              const layers = [];
              tlist.forEach(ti => {
                const tr = tris[ti];
                const bc = baryAt(tr.s, gx + 0.5, gy + 0.5);
                if (!bc) return;
                const z = 1 / (bc[0] / tr.s[0][2] + bc[1] / tr.s[1][2] + bc[2] / tr.s[2][2]);
                if (z < near || z > zlimit) return;
                layers.push({ tr, z });
              });
              layers.sort((a, b) => b.z - a.z).forEach(Lr => {
                const res = shadeTri(ctx, db, world, Lr.tr, gx + 0.5, gy + 0.5, W, H, hx, hy, ortho, lamps, sky);
                if (!res) return;
                const a = Math.max(0, Math.min(1, res[3]));
                outc = [outc[0] * (1 - a) + res[0] * a, outc[1] * (1 - a) + res[1] * a, outc[2] * (1 - a) + res[2] * a];
                outa = outa + a * (1 - outa);
              });
            }
            const o = (gy * W + gx) * 4;
            img[o] = outc[0]; img[o + 1] = outc[1]; img[o + 2] = outc[2];
            img[o + 3] = r.alphamode === 'sky' ? 1 : Math.min(1, outa + (cov >= 1 ? 0 : 0));
            zimg[gy * W + gx] = zmin;
          }
        }
        yield { W, H, img, progress: ((ty - by1) * (bx2 - bx1) + (tx - bx1 + tw) * th) / Math.max(1, (by2 - by1) * (bx2 - bx1)) };
      }
    }
    if (db.wires.length) drawWires(db, sv, img, zimg, W, H);
    if (db.halos.length) drawHalos(db, sv, img, zimg, W, H, hx, hy);
    if (world && world.stars.on) drawStars(world, img, zimg, W, H);
    if (world && world.mist.on) applyMist(world, img, zimg, W, H, db, hx, hy, viewInv, tris);
    if (r.mode.edge && !opts.preview) applyEdges(r, img, zimg, W, H);
    return { W, H, img, z: zimg };
  }

  function viewDir(px, py, W, H, hx, hy, ortho) {
    if (ortho) return [0, 0, -1];
    return V.norm([(px / W * 2 - 1) * hx, (py / H * 2 - 1) * hy, -1]);
  }

  function baryAt(s, px, py) {
    const a = s[0], b = s[1], c = s[2];
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) < 1e-12) return null;
    const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
    const w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
    const w2 = 1 - w0 - w1;
    if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) return null;
    return [w0, w1, w2];
  }

  function shadeTri(ctx, db, world, tr, px, py, W, H, hx, hy, ortho, lamps, sky) {
    const s = tr.s;
    let bc = baryAt(s, px, py);
    if (!bc) {
      const a = s[0], b = s[1], c = s[2];
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.abs(area) < 1e-12) return null;
      let w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
      let w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
      w0 = Math.max(0, w0); w1 = Math.max(0, w1);
      const sum = Math.max(1e-6, w0 + w1);
      if (w0 + w1 > 1) { w0 /= sum; w1 /= sum; }
      bc = [w0, w1, 1 - w0 - w1];
    }
    const q = ortho ? bc : [bc[0] / s[0][2], bc[1] / s[1][2], bc[2] / s[2][2]];
    const qs = q[0] + q[1] + q[2];
    const w = [q[0] / qs, q[1] / qs, q[2] / qs];
    const t = tr.t;
    const vs = tr.clip ? tr.clip.verts : t.v.map(i => db.verts[i]);
    const ip = key => [0, 1, 2].map(k => vs[0][key][k] * w[0] + vs[1][key][k] * w[1] + vs[2][key][k] * w[2]);
    const co = ip('co');
    let nor;
    if (t.smooth) {
      nor = V.norm(ip('no'));
      if (t.autosmooth != null) {
        const fn = t.n;
        const nn = vs.map(v => (V.dot(v.no, fn) >= t.autosmooth ? v.no : fn));
        nor = V.norm([0, 1, 2].map(k => nn[0][k] * w[0] + nn[1][k] * w[1] + nn[2][k] * w[2]));
      }
    } else nor = t.n;
    const view = ortho ? [0, 0, -1] : V.norm(co);
    const sp = {
      ma: t.ma, ob: t.ob, co, nor, view, orco: ip('orco'), glob: ip('glob'),
      win: [px / W, py / H], refl: V.sub(view, V.mul(nor, 2 * V.dot(nor, view)))
    };
    if (t.uv) sp.uv = [0, 1].map(k => t.uv[0][k] * w[0] + t.uv[1][k] * w[1] + t.uv[2][k] * w[2]);
    if (vs[0].sticky && vs[1].sticky && vs[2].sticky) sp.sticky = [0, 1].map(k => vs[0].sticky[k] * w[0] + vs[1].sticky[k] * w[1] + vs[2].sticky[k] * w[2]);
    const vcol = t.col || (vs[0].vcol && vs[1].vcol && vs[2].vcol ? vs.map(v => v.vcol) : null);
    if (vcol && t.ma.mode) {
      const c = [0, 1, 2].map(k => vcol[0][k] * w[0] + vcol[1][k] * w[1] + vcol[2][k] * w[2]);
      if (t.ma.mode.vcolPaint) sp.vcolPaint = c;
      if (t.ma.mode.vcolLight) sp.vcolLight = c;
    }
    if (t.tf && t.tf.image && t.ma.mode && t.ma.mode.texface && sp.uv) {
      const tex = { image: t.tf.image, imaflag: { interpol: true }, crop: [0, 0, 1, 1], xrepeat: 1, yrepeat: 1, extend: 'repeat' };
      const c = B.Tex.imageSample(tex, sp.uv[0] * 2 - 1, sp.uv[1] * 2 - 1);
      if (c) sp.vcolPaint = [c[0], c[1], c[2]];
    }
    if (t.ma.mode && t.ma.mode.env) return [sky[0], sky[1], sky[2], 1];
    return shade(ctx, db, world, sp, lamps);
  }

  function clipTriNear(t, db, near) {
    const vs = t.v.map(i => db.verts[i]);
    const inside = v => -v.co[2] >= near;
    let poly = vs.map(v => v);
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ai = inside(a), bi = inside(b);
      if (ai) out.push(a);
      if (ai !== bi) {
        const ta = (-a.co[2] - near) / ((-a.co[2]) - (-b.co[2]));
        const lerp = (x, y) => x && y ? x.map((v, k) => v + (y[k] - v) * ta) : x;
        out.push({ co: lerp(a.co, b.co), no: lerp(a.no, b.no), orco: lerp(a.orco, b.orco), glob: lerp(a.glob, b.glob), sticky: lerp(a.sticky, b.sticky), vcol: lerp(a.vcol, b.vcol), ob: a.ob });
      }
    }
    if (out.length < 3) return [];
    const res = [];
    for (let k = 1; k < out.length - 1; k++) res.push({ t, verts: [out[0], out[k], out[k + 1]], co: [out[0].co, out[k].co, out[k + 1].co] });
    return res;
  }

  function drawWires(db, sv, img, zimg, W, H) {
    db.wires.forEach(wr => {
      const a = sv[wr.a], b = sv[wr.b];
      if (!a || !b) return;
      const ma = wr.ma;
      const col = [ma.r, ma.g, ma.b];
      const steps = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) + 1;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.floor(a[0] + (b[0] - a[0]) * t), y = Math.floor(a[1] + (b[1] - a[1]) * t), z = a[2] + (b[2] - a[2]) * t;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (z > zimg[y * W + x] + 0.01) continue;
        const o = (y * W + x) * 4;
        img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; img[o + 3] = 1;
      }
    });
  }

  function drawHalos(db, sv, img, zimg, W, H, hx) {
    db.halos.forEach(h => {
      const s = sv[h.v];
      if (!s) return;
      const ma = h.ma, hs = ma.halo || DEFMAT.halo;
      const rad = Math.max(1, hs.size / (s[2] * hx) * W * 0.5);
      const col = [ma.r, ma.g, ma.b];
      const hard = Math.max(1, hs.hard || 50);
      const x1 = Math.max(0, Math.floor(s[0] - rad)), x2 = Math.min(W - 1, Math.ceil(s[0] + rad));
      const y1 = Math.max(0, Math.floor(s[1] - rad)), y2 = Math.min(H - 1, Math.ceil(s[1] + rad));
      const fl = hs.flags || {};
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
        const dx = x + 0.5 - s[0], dy = y + 0.5 - s[1];
        const d = Math.hypot(dx, dy) / rad;
        if (d >= 1) continue;
        if (s[2] > zimg[y * W + x] && !fl.xalpha) continue;
        let a = Math.pow(1 - d, hard / 16 + 0.5) * ma.alpha;
        if (fl.rings) { const rn = Math.abs(Math.sin(d * Math.PI * (hs.rings || 4))); a += 0.25 * Math.pow(rn, 8) * (1 - d); }
        if (fl.lines) { const ang = Math.atan2(dy, dx); const ln = Math.abs(Math.sin(ang * (hs.lines || 12) / 2)); a += 0.3 * Math.pow(1 - ln, 30) * (1 - d); }
        if (fl.star) { const ang = Math.atan2(dy, dx); const st = Math.abs(Math.cos(ang * (hs.star || 4) / 2)); a += 0.5 * Math.pow(st, 40) * (1 - d); }
        const o = (y * W + x) * 4;
        const add = hs.add || 0;
        img[o] = img[o] * (1 - a * (1 - add)) + col[0] * a;
        img[o + 1] = img[o + 1] * (1 - a * (1 - add)) + col[1] * a;
        img[o + 2] = img[o + 2] * (1 - a * (1 - add)) + col[2] * a;
        img[o + 3] = Math.min(1, img[o + 3] + a);
      }
    });
  }

  function drawStars(world, img, zimg, W, H) {
    const st = world.stars;
    const count = Math.round((W * H) / Math.max(50, st.dist * st.dist * 2));
    let s = 777;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
      if (zimg[y * W + x] !== Infinity) continue;
      const br = 0.5 + rnd() * 0.5;
      const cn = st.colnoise || 0;
      const c = [br * (1 - cn * rnd()), br * (1 - cn * rnd()), br * (1 - cn * rnd())];
      const size = st.size > 1.5 ? 1 : 0;
      for (let dy = 0; dy <= size; dy++) for (let dx = 0; dx <= size; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= W || yy >= H) continue;
        const o = (yy * W + xx) * 4;
        img[o] = Math.max(img[o], c[0]); img[o + 1] = Math.max(img[o + 1], c[1]); img[o + 2] = Math.max(img[o + 2], c[2]);
      }
    }
  }

  function applyMist(world, img, zimg, W, H, db, hx, hy, viewInv) {
    const hor = [world.horr, world.horg, world.horb];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const z = zimg[y * W + x];
      if (z === Infinity) continue;
      const dirV = [(x / W * 2 - 1) * hx * z, (y / H * 2 - 1) * hy * z, -z];
      const wpos = M.loc(viewInv, dirV);
      const f = mistFactor(world, V.len(dirV), wpos[2]);
      if (!f) continue;
      const o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) img[o + k] = img[o + k] * (1 - f) + hor[k] * f;
    }
  }

  function applyEdges(r, img, zimg, W, H) {
    const amt = (r.edgeint || 0) / 255;
    if (!amt) return;
    const out = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const z = zimg[y * W + x];
      const zz = [zimg[y * W + x - 1], zimg[y * W + x + 1], zimg[(y - 1) * W + x], zimg[(y + 1) * W + x]];
      let e = 0;
      zz.forEach(q => {
        if (z === Infinity && q === Infinity) return;
        if (z === Infinity || q === Infinity) { e = 1; return; }
        const d = Math.abs(q - z) / Math.min(q, z);
        if (d > 0.1) e = Math.max(e, Math.min(1, d * 2));
      });
      out[y * W + x] = e;
    }
    for (let i = 0; i < W * H; i++) {
      const e = out[i] * amt;
      if (!e) continue;
      img[i * 4] = img[i * 4] * (1 - e) + r.edgeR / 255 * e;
      img[i * 4 + 1] = img[i * 4 + 1] * (1 - e) + r.edgeG / 255 * e;
      img[i * 4 + 2] = img[i * 4 + 2] * (1 - e) + r.edgeB / 255 * e;
    }
  }

  function runSync(gen) {
    let res;
    for (;;) { const n = gen.next(); if (n.done) { res = n.value; break; } }
    return res;
  }

  function toImage(res) {
    const { W, H, img } = res;
    const buf = new Uint32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      buf[(H - 1 - y) * W + x] = B.rgbf(img[o], img[o + 1], img[o + 2]) & (((B.clampByte(img[o + 3] * 255)) << 24) | 0xffffff);
    }
    return { w: W, h: H, buf, flipY: false };
  }

  function sceneCamera(ctx) {
    const sce = ctx.scene;
    if (sce.camera) return sce.camera;
    return sce.bases.map(b => b.object).find(o => o.type === 'camera') || null;
  }

  const Render = {
    osaOffsets, buildDB, renderJob, runSync, toImage, shade, skyColor, texChannels, resolveMat, DEFMAT, sceneCamera, meshForRender,
    job: null
  };

  Render.render = function (ctx, opts = {}) {
    const camob = opts.camera || sceneCamera(ctx);
    if (!camob) { B.UI.error(ctx, 'no camera'); return null; }
    if (Render.job) Render.job.cancel = true;
    if (B.Anim) B.Anim.setFrame(ctx, ctx.scene.cfra, true);
    if (ctx.G.obedit && B.Edit) {
      const ob = ctx.G.obedit;
      if (ob.type === 'mesh') { ob.data.verts = ctx.G.editMesh.verts.map(v => ({ co: v.co.slice(), sel: v.sel, hide: v.hide })); ob.data.faces = ctx.G.editMesh.faces.map(f => Object.assign({}, f, { v: f.v.slice() })); }
    }
    const sce = ctx.scene;
    const job = { cancel: false, start: performance.now() };
    Render.job = job;
    const win = Render.openWindow(ctx);
    if (sce.r.doSequence && sce.ed && sce.ed.seqs.length && B.Seq) {
      const im = toImage(B.Seq.render(ctx, sce.cfra));
      ctx.G.rendered = im;
      Render.showFinal(ctx, im, (performance.now() - job.start) / 1000);
      Render.job = null;
      return job;
    }
    const mblur = sce.r.mode.mblur && !opts.preview;
    const passes = mblur ? Math.max(2, Math.min(16, sce.r.osa || 8)) : 1;
    let acc = null, pass = 0;
    const runPass = () => {
      if (mblur && B.Anim) B.Anim.setFrame(ctx, sce.cfra - sce.r.blurfac * (pass / (passes - 1) - 0.5) * 1, true);
      const gen = renderJob(ctx, sce, { camera: camob, cancelled: () => job.cancel || ctx.destroyed });
      const step = () => {
        if (job.cancel || ctx.destroyed) { Render.statusText(ctx, 'Render aborted'); return; }
        const t0 = performance.now();
        let n;
        do { n = gen.next(); } while (!n.done && n.value && performance.now() - t0 < 30);
        if (!n.done && n.value) {
          Render.showPartial(ctx, n.value, acc, pass);
          setTimeout(step, 0);
          return;
        }
        const res = n.value;
        if (!res) return;
        if (!acc) acc = { W: res.W, H: res.H, img: new Float32Array(res.img.length), z: res.z };
        for (let i = 0; i < res.img.length; i++) acc.img[i] += res.img[i] / passes;
        pass++;
        if (pass < passes) { runPass(); return; }
        if (mblur && B.Anim) B.Anim.setFrame(ctx, sce.cfra, true);
        const im = toImage(acc);
        ctx.G.rendered = im;
        ctx.G.renderedFloat = acc;
        Render.showFinal(ctx, im, (performance.now() - job.start) / 1000);
        Render.job = null;
        if (opts.onDone) opts.onDone(im);
      };
      step();
    };
    runPass();
    return job;
  };

  Render.renderView = function (ctx, area, anim) {
    const sv = B.View3D.setMatrices(ctx, area);
    if (sv.persp === 2 && ctx.scene.camera) { if (anim) Render.renderAnim(ctx); else Render.render(ctx); return; }
    const fake = B.Data.newObject(new B.Main(), 'camera', 'view', { lens: sv.lens, clipsta: 0.1, clipend: 500, ortho: sv.persp === 0 });
    fake.obmat = sv.viewinv.slice();
    fake.loc = [sv.viewinv[12], sv.viewinv[13], sv.viewinv[14]];
    const orig = B.Data.whereIs;
    const camMat = sv.viewinv.slice();
    const r = ctx.scene.r;
    const saved = { xsch: r.xsch, ysch: r.ysch, size: r.size };
    r.xsch = Math.min(640, area.winx); r.ysch = Math.round(r.xsch * area.winy / area.winx); r.size = 100;
    const fac = 32 / sv.lens;
    let hx, hy;
    if (area.winx > area.winy) { hx = fac; hy = fac * area.winy / area.winx; } else { hy = fac; hx = fac * area.winx / area.winy; }
    B.Data.whereIs = ob => (ob === fake ? (fake.obmat = camMat) : orig(ob));
    try {
      Render.renderWithWin(ctx, fake, { hx, hy, ortho: sv.persp === 0, orthoScale: sv.dist / hx });
    } finally {
      B.Data.whereIs = orig;
      Object.assign(r, saved);
    }
  };

  Render.renderWithWin = function (ctx, camob, win) {
    const sce = ctx.scene;
    const gen = renderJob(ctx, sce, { camera: camob, viewWin: win.ortho ? null : win, ortho: win.ortho, orthoScale: win.orthoScale });
    const res = runSync(gen);
    const im = toImage(res);
    ctx.G.rendered = im;
    Render.openWindow(ctx);
    Render.showFinal(ctx, im, 0);
  };

  Render.renderAnim = function (ctx) {
    const sce = ctx.scene;
    const r = sce.r;
    const camob = sceneCamera(ctx);
    if (!camob) { B.UI.error(ctx, 'no camera'); return; }
    if (Render.job) Render.job.cancel = true;
    const job = { cancel: false, start: performance.now() };
    Render.job = job;
    Render.openWindow(ctx);
    const frames = [];
    ctx.G.animFrames = frames;
    const saveCfra = sce.cfra;
    let f = r.sfra;
    const next = () => {
      if (job.cancel || ctx.destroyed || f > r.efra) {
        sce.cfra = saveCfra;
        if (B.Anim) B.Anim.setFrame(ctx, saveCfra, true);
        Render.job = null;
        Render.statusText(ctx, `Rendered ${frames.length} frames`);
        ctx.redrawAll();
        return;
      }
      sce.cfra = f;
      if (B.Anim) B.Anim.setFrame(ctx, f, true);
      const res = sce.r.doSequence && sce.ed && sce.ed.seqs.length && B.Seq ? B.Seq.render(ctx, f) : runSync(renderJob(ctx, sce, { camera: camob, cancelled: () => job.cancel }));
      if (!res) return;
      const im = toImage(res);
      frames.push(im);
      ctx.G.rendered = im;
      Render.showFinal(ctx, im, 0, `Frame ${f}  (${frames.length}/${r.efra - r.sfra + 1})`);
      if (B.FileOps && B.FileOps.writeAnimFrame) B.FileOps.writeAnimFrame(ctx, im, f);
      f++;
      setTimeout(next, 0);
    };
    next();
  };

  Render.imageToCanvas = function (im) {
    const c = document.createElement('canvas');
    c.width = im.w; c.height = im.h;
    const g = c.getContext('2d');
    const d = g.createImageData(im.w, im.h);
    const u = new Uint32Array(d.data.buffer);
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) u[y * im.w + x] = im.buf[(im.flipY ? im.h - 1 - y : y) * im.w + x] | 0xff000000;
    g.putImageData(d, 0, 0);
    return c;
  };

  Render.openWindow = function (ctx) {
    const sce = ctx.scene;
    const r = sce.r;
    const W = Math.max(1, Math.round(r.xsch * r.size / 100)), H = Math.max(1, Math.round(r.ysch * r.size / 100));
    if (typeof window === 'undefined' || !window.winManager) return null;
    const wm = window.winManager;
    const id = 'app_blender204_render';
    let st = ctx.renderWin;
    if (st && wm.windows.has(id)) {
      if (st.canvas.width !== W || st.canvas.height !== H) { st.canvas.width = W; st.canvas.height = H; st.clear(); }
      wm.restoreWindow(id);
      if (wm.bringToTop) wm.bringToTop(id);
      return st;
    }
    const root = document.createElement('div');
    root.className = 'b204-render';
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.tabIndex = 0;
    root.appendChild(canvas);
    const ww = Math.min(window.innerWidth - 20, W + 8), wh = Math.min(window.innerHeight - 40, H + 30);
    const pos = r.winpos != null ? r.winpos : 4;
    const px = [0.02, 0.5, 0.98][pos % 3], py = [0.02, 0.5, 0.98][Math.floor(pos / 3)];
    wm.createWindow({
      id, title: 'Render', icon: 'blender204', width: ww, height: wh,
      x: Math.max(0, Math.round((window.innerWidth - ww) * px)), y: Math.max(0, Math.round((window.innerHeight - 40 - wh) * py)),
      content: root, onClose: () => { if (Render.job) Render.job.cancel = true; ctx.renderWin = null; }
    });
    const g = canvas.getContext('2d');
    st = {
      root, canvas, g, zoom: 1,
      clear() { g.fillStyle = '#000'; g.fillRect(0, 0, canvas.width, canvas.height); }
    };
    st.clear();
    canvas.addEventListener('pointerdown', e => {
      if (e.button === 0) { st.zoom = st.zoom >= 4 ? 1 : st.zoom * 2; canvas.style.width = canvas.width * st.zoom + 'px'; canvas.style.height = canvas.height * st.zoom + 'px'; root.style.overflow = 'auto'; }
    });
    canvas.addEventListener('keydown', e => {
      if (e.key === 'Escape' && Render.job) Render.job.cancel = true;
      if (e.key === 'F11') { e.preventDefault(); wm.minimizeWindow ? wm.minimizeWindow(id) : null; }
    });
    ctx.renderWin = st;
    return st;
  };

  Render.showPartial = function (ctx, part, acc) {
    const st = ctx.renderWin;
    if (!st) return;
    const { W, H, img } = part;
    const d = st.g.createImageData(W, H);
    const u = new Uint32Array(d.data.buffer);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const a = acc ? acc.img : null;
      const f = a ? 1 : 1;
      u[(H - 1 - y) * W + x] = B.rgbf((a ? a[o] : 0) + img[o] * f, (a ? a[o + 1] : 0) + img[o + 1] * f, (a ? a[o + 2] : 0) + img[o + 2] * f);
    }
    st.g.putImageData(d, 0, 0);
  };

  Render.showFinal = function (ctx, im, secs, label) {
    const st = ctx.renderWin;
    if (!st) return;
    if (st.canvas.width !== im.w || st.canvas.height !== im.h) { st.canvas.width = im.w; st.canvas.height = im.h; }
    const d = st.g.createImageData(im.w, im.h);
    const u = new Uint32Array(d.data.buffer);
    for (let i = 0; i < im.w * im.h; i++) u[i] = im.buf[i] | 0xff000000;
    st.g.putImageData(d, 0, 0);
    if (window.winManager && window.winManager.setTitle) window.winManager.setTitle('app_blender204_render', label ? 'Render  ' + label : secs ? `Render  (${secs.toFixed(2)} sec)` : 'Render');
  };

  Render.statusText = function (ctx, text) {
    if (window.winManager && window.winManager.setTitle && window.winManager.windows.has('app_blender204_render')) window.winManager.setTitle('app_blender204_render', 'Render  ' + text);
  };

  Render.toggleWindow = function (ctx) {
    const wm = window.winManager;
    const id = 'app_blender204_render';
    if (!wm) return;
    if (wm.windows.has(id)) {
      const w = wm.windows.get(id);
      if (w.isMinimized) wm.restoreWindow(id); else if (wm.isTopWindow(id)) { if (wm.minimizeWindow) wm.minimizeWindow(id); } else if (wm.bringToTop) wm.bringToTop(id);
      return;
    }
    if (ctx.G.rendered) { Render.openWindow(ctx); Render.showFinal(ctx, ctx.G.rendered, 0); }
  };

  Render.closeWindow = function (ctx) {
    if (Render.job) Render.job.cancel = true;
    const wm = typeof window !== 'undefined' ? window.winManager : null;
    if (wm && wm.windows.has('app_blender204_render')) wm.closeWindow('app_blender204_render');
    if (wm && wm.windows.has('app_blender204_play')) wm.closeWindow('app_blender204_play');
    ctx.renderWin = null;
  };

  Render.playAnim = function (ctx) {
    const frames = ctx.G.animFrames;
    if (!frames || !frames.length) { B.UI.error(ctx, "couldn't find pictures"); return; }
    const wm = window.winManager;
    const id = 'app_blender204_play';
    if (wm.windows.has(id)) wm.closeWindow(id);
    const root = document.createElement('div');
    root.className = 'b204-render';
    const canvas = document.createElement('canvas');
    canvas.width = frames[0].w; canvas.height = frames[0].h;
    root.appendChild(canvas);
    let i = 0, timer = null;
    wm.createWindow({ id, title: 'Play', icon: 'blender204', width: canvas.width + 8, height: canvas.height + 30, content: root, onClose: () => clearInterval(timer) });
    const g = canvas.getContext('2d');
    const fps = ctx.scene.r.frs_sec || 25;
    timer = setInterval(() => {
      const im = frames[i % frames.length];
      const d = g.createImageData(im.w, im.h);
      const u = new Uint32Array(d.data.buffer);
      for (let k = 0; k < im.w * im.h; k++) u[k] = im.buf[k] | 0xff000000;
      g.putImageData(d, 0, 0);
      i++;
    }, 1000 / fps);
  };

  B.Render = Render;
})(globalThis.B204 = globalThis.B204 || {});
