(function (B) {
  'use strict';
  const V = B.V, M = B.M, Q = B.Q, rgb = B.rgb;

  const C = {
    BACK: rgb(115, 115, 115),
    GRID: rgb(72, 72, 72),
    AXX: rgb(208, 160, 160),
    AXY: rgb(160, 208, 160),
    AXZ: rgb(160, 160, 208),
    WIRE: rgb(0, 0, 0),
    SELECT: rgb(255, 136, 255),
    ACTIVE: rgb(255, 187, 255),
    VERT: rgb(255, 112, 255),
    VERTSEL: rgb(255, 255, 112),
    EDGE: rgb(0, 0, 0),
    EMPTYWIRE: rgb(0, 0, 0),
    LAMP: rgb(0, 0, 0),
    CAMBORDER: rgb(0, 0, 0),
    CAMDASH: rgb(255, 255, 255),
    NORMAL: rgb(34, 221, 221),
    FACESEL: rgb(160, 120, 200)
  };

  const VIEWS = {
    7: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    '-7': [[1, 0, 0], [0, -1, 0], [0, 0, -1]],
    1: [[1, 0, 0], [0, 0, 1], [0, -1, 0]],
    '-1': [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    3: [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    '-3': [[0, -1, 0], [0, 0, 1], [-1, 0, 0]]
  };

  function rowsToMat(rows) {
    return [rows[0][0], rows[1][0], rows[2][0], 0, rows[0][1], rows[1][1], rows[2][1], 0, rows[0][2], rows[1][2], rows[2][2], 0, 0, 0, 0, 1];
  }

  function matToQuat(m) {
    const t = m[0] + m[5] + m[10];
    let w, x, y, z;
    if (t > 0) {
      const s = Math.sqrt(t + 1) * 2;
      w = 0.25 * s; x = (m[6] - m[9]) / s; y = (m[8] - m[2]) / s; z = (m[1] - m[4]) / s;
    } else if (m[0] > m[5] && m[0] > m[10]) {
      const s = Math.sqrt(1 + m[0] - m[5] - m[10]) * 2;
      w = (m[6] - m[9]) / s; x = 0.25 * s; y = (m[4] + m[1]) / s; z = (m[8] + m[2]) / s;
    } else if (m[5] > m[10]) {
      const s = Math.sqrt(1 + m[5] - m[0] - m[10]) * 2;
      w = (m[8] - m[2]) / s; x = (m[4] + m[1]) / s; y = 0.25 * s; z = (m[9] + m[6]) / s;
    } else {
      const s = Math.sqrt(1 + m[10] - m[0] - m[5]) * 2;
      w = (m[1] - m[4]) / s; x = (m[8] + m[2]) / s; y = (m[9] + m[6]) / s; z = 0.25 * s;
    }
    return Q.norm([w, x, y, z]);
  }

  function viewQuat(n) { return matToQuat(rowsToMat(VIEWS[n])); }

  function init() {
    return { persp: 0, view: 7, quat: viewQuat(7), ofs: [0, 0, 0], dist: 20.67, lens: 35, near: 0.1, far: 500, grid: 1, gridlines: 16, drawtype: 'wire', lay: 1, layact: 1, scenelock: true, around: 'bbox', localview: null, bgpic: null, camzoom: 0, flag: {} };
  }

  function camData(ctx) {
    const sce = ctx.scene;
    const cam = sce.camera;
    return cam && cam.type === 'camera' ? cam : null;
  }

  function setMatrices(ctx, area) {
    const sv = area.space;
    const winx = area.winx, winy = area.winy;
    let viewmat, winmat;
    sv.ortho = sv.persp === 0;
    if (sv.persp === 2 && camData(ctx)) {
      const camob = camData(ctx);
      B.Data.whereIs(camob);
      viewmat = M.invert(M.normalized3(camob.obmat).map((v, i) => (i >= 12 && i < 15 ? camob.obmat[i] : v)));
      const cam = camob.data;
      const r = ctx.scene.r;
      const rx = r.xsch * r.xasp, ry = r.ysch * r.yasp;
      const aspect = rx / ry;
      let bw, bh;
      if (winx / winy > aspect) { bh = winy; bw = winy * aspect; } else { bw = winx; bh = winx / aspect; }
      sv.viewborder = { x1: area.win.x1 + (winx - bw) / 2, y1: area.win.y1 + (winy - bh) / 2, w: bw, h: bh };
      const n = cam.clipsta;
      const half = (rx >= ry ? 16 / cam.lens : 16 / cam.lens * aspect) * 1.28;
      const hx = n * half * (winx / bw), hy = n * half / aspect * (winy / bh);
      winmat = cam.ortho ? M.ortho(-half * 8 * winx / bw, half * 8 * winx / bw, -half * 8 / aspect * winy / bh, half * 8 / aspect * winy / bh, -cam.clipend, cam.clipend) : M.frustum(-hx, hx, -hy, hy, n, cam.clipend);
      sv.camFrame = { x1: sv.viewborder.x1 + bw * (1 - 1 / 1.28) / 2, y1: sv.viewborder.y1 + bh * (1 - 1 / 1.28) / 2, w: bw / 1.28, h: bh / 1.28 };
      sv.pixsize = (2 * hx / n) / winx;
      sv.ortho = !!cam.ortho;
    } else {
      if (sv.persp === 2) sv.persp = 1;
      const rot = M.fromQuat(sv.quat);
      viewmat = M.mul(M.translate([0, 0, -sv.dist]), M.mul(rot, M.translate(V.neg(sv.ofs))));
      if (sv.persp === 0) {
        let x1, y1;
        if (winx > winy) { x1 = -sv.dist; y1 = -winy * sv.dist / winx; } else { x1 = -winx * sv.dist / winy; y1 = -sv.dist; }
        winmat = M.ortho(x1, -x1, y1, -y1, -sv.far * 0.5, sv.far * 0.5);
        sv.pixsize = (-2 * x1) / winx;
      } else {
        const fac = 32 / sv.lens;
        const n = sv.near;
        let hx, hy;
        if (winx > winy) { hx = n * fac; hy = hx * winy / winx; } else { hy = n * fac; hx = hy * winx / winy; }
        winmat = M.frustum(-hx, hx, -hy, hy, n, sv.far);
        sv.pixsize = (2 * hx / n) / winx;
      }
      sv.viewborder = null;
    }
    sv.viewmat = viewmat;
    sv.winmat = winmat;
    sv.persmat = M.mul(winmat, viewmat);
    sv.viewinv = M.invert(viewmat);
    sv.persinv = M.invert(sv.persmat);
    sv.win = area.win;
    sv.winx = winx; sv.winy = winy;
    return sv;
  }

  function project(sv, p) {
    const v = M.proj(sv.persmat, p);
    if (v[3] <= 1e-6) return null;
    return [sv.win.x1 + (v[0] / v[3] * 0.5 + 0.5) * sv.winx, sv.win.y1 + (v[1] / v[3] * 0.5 + 0.5) * sv.winy, v[2] / v[3], v[3]];
  }

  function unproject(sv, x, y, z) {
    const nx = ((x - sv.win.x1) / sv.winx) * 2 - 1, ny = ((y - sv.win.y1) / sv.winy) * 2 - 1;
    const p = M.proj(sv.persinv, [nx, ny, z]);
    return [p[0] / p[3], p[1] / p[3], p[2] / p[3]];
  }

  function depthOf(sv, p) {
    const v = M.proj(sv.persmat, p);
    return v[2] / v[3];
  }

  function screenToWorld(sv, x, y, refPoint) {
    const z = depthOf(sv, refPoint);
    return unproject(sv, x, y, z);
  }

  function viewDelta(sv, dx, dy, refPoint) {
    const p = project(sv, refPoint);
    if (!p) return [0, 0, 0];
    const a = unproject(sv, p[0], p[1], p[2]), b = unproject(sv, p[0] + dx, p[1] + dy, p[2]);
    return V.sub(b, a);
  }

  function viewVector(sv) { return V.norm(M.dir(sv.viewinv, [0, 0, 1])); }

  function areaLayers(ctx, sv) {
    if (sv.localview) return sv.localview.lay;
    return sv.scenelock ? ctx.scene.lay : sv.lay;
  }

  function visibleBases(ctx, sv) {
    const lay = areaLayers(ctx, sv);
    return ctx.scene.bases.filter(b => (b.object.lay & lay) && (!sv.localview || sv.localview.obs.includes(b.object)));
  }

  function drawGrid(r, sv) {
    const w = sv.win;
    const aligned = sv.persp === 0 && sv.view;
    if (aligned) {
      const rows = VIEWS[sv.view];
      const axH = rows[0].findIndex(v => Math.abs(v) > 0.5), axV = rows[1].findIndex(v => Math.abs(v) > 0.5);
      const pix = 1 / sv.pixsize;
      let step = sv.grid;
      while (step * pix < 6) step *= 10;
      while (step * pix > 600 && step > 1e-4) step /= 10;
      const o = project(sv, [0, 0, 0]);
      const sp = step * pix;
      const colH = [C.AXX, C.AXY, C.AXZ][axH], colV = [C.AXX, C.AXY, C.AXZ][axV];
      const kmin = Math.floor((w.x1 - o[0]) / sp) - 1, kmax = Math.ceil((w.x2 - o[0]) / sp) + 1;
      for (let k = kmin; k <= kmax; k++) {
        const x = Math.round(o[0] + k * sp);
        if (k !== 0) r.vline(x, w.y1, w.y2, C.GRID);
      }
      const jmin = Math.floor((w.y1 - o[1]) / sp) - 1, jmax = Math.ceil((w.y2 - o[1]) / sp) + 1;
      for (let j = jmin; j <= jmax; j++) {
        const y = Math.round(o[1] + j * sp);
        if (j !== 0) r.hline(w.x1, w.x2, y, C.GRID);
      }
      r.hline(w.x1, w.x2, Math.round(o[1]), colH);
      r.vline(Math.round(o[0]), w.y1, w.y2, colV);
      return;
    }
    const n = sv.gridlines, g = sv.grid;
    r.mvp = sv.persmat;
    for (let k = -n; k <= n; k++) {
      if (k === 0) continue;
      r.line3([k * g, -n * g, 0], [k * g, n * g, 0], C.GRID);
      r.line3([-n * g, k * g, 0], [n * g, k * g, 0], C.GRID);
    }
    r.line3([-n * g, 0, 0], [n * g, 0, 0], C.AXX);
    r.line3([0, -n * g, 0], [0, n * g, 0], C.AXY);
  }

  function wireColor(ctx, base) {
    const isAct = ctx.scene.basact === base;
    if (base.sel) return isAct ? C.ACTIVE : C.SELECT;
    return C.WIRE;
  }

  function meshEdges(me) {
    if (me._edgeCache && me._edgeCache.faces === me.faces && me._edgeCache.n === me.faces.length && me._edgeCache.stamp === me.stamp) return me._edgeCache.edges;
    const seen = new Set(), edges = [];
    for (const f of me.faces) {
      const v = f.v;
      if (v.length === 2) {
        const k = v[0] < v[1] ? v[0] * 1e6 + v[1] : v[1] * 1e6 + v[0];
        if (!seen.has(k)) { seen.add(k); edges.push([v[0], v[1]]); }
        continue;
      }
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length];
        const k = a < b ? a * 1e6 + b : b * 1e6 + a;
        if (!seen.has(k)) { seen.add(k); edges.push([a, b]); }
      }
    }
    me._edgeCache = { faces: me.faces, n: me.faces.length, edges, stamp: me.stamp };
    return edges;
  }

  function faceNormal(verts, f) {
    const v = f.v;
    if (v.length === 4) return V.normalQuad(verts[v[0]].co, verts[v[1]].co, verts[v[2]].co, verts[v[3]].co);
    return V.normal(verts[v[0]].co, verts[v[1]].co, verts[v[2]].co);
  }

  function matColor(ob, idx) {
    const me = ob.data;
    const ma = (ob.mats && ob.mats[idx] && ob.colbits & (1 << idx)) ? ob.mats[idx] : (me && me.mats && me.mats[idx]) || null;
    if (ma) return [ma.r, ma.g, ma.b];
    return [0.8, 0.8, 0.8];
  }

  function obMaterial(ob, idx) {
    const d = ob.data;
    if (ob.mats && ob.mats[idx] && (ob.colbits & (1 << idx))) return ob.mats[idx];
    return (d && d.mats && d.mats[idx]) || null;
  }

  function drawSolidMesh(ctx, r, sv, ob, me, shaded) {
    const mat = ob.obmat;
    const nmat = M.transpose3(M.invert(mat));
    const viewv = viewVector(sv);
    const verts = me.verts;
    const camPos = M.loc(sv.viewinv, [0, 0, 0]);
    const lamps = shaded ? ctx.scene.bases.filter(b => b.object.type === 'lamp' && (b.object.lay & ctx.scene.lay)).map(b => b.object) : [];
    const world = verts.map(v => M.loc(mat, v.co));
    const vpaintOb = ctx.G.f.vertexpaint && ctx.scene.basact && ctx.scene.basact.object === ob;
    const useVcol = !!(me.vcols && (vpaintOb || (me.mats || []).some(m => m && m.mode && (m.mode.vcolPaint || m.mode.vcolLight)))) || (me.faces.some(f => f.col) && vpaintOb);
    for (const f of me.faces) {
      if (f.v.length < 3) continue;
      if (f.v.some(i => verts[i].hide) || f.hideFace) continue;
      let n = V.norm(M.dir(nmat, faceNormal(verts, f)));
      const col = matColor(ob, f.mat || 0);
      let c;
      const centre = V.mul(f.v.reduce((s, i) => V.add(s, world[i]), [0, 0, 0]), 1 / f.v.length);
      const toEye = sv.persp === 0 ? viewv : V.norm(V.sub(camPos, centre));
      if (shaded && lamps.length) {
        let li = 0;
        if (V.dot(n, toEye) < 0) n = V.neg(n);
        lamps.forEach(l => {
          const la = l.data;
          const lp = [l.obmat[12], l.obmat[13], l.obmat[14]];
          let ld = la.type === 'sun' || la.type === 'hemi' ? V.norm(M.dir(l.obmat, [0, 0, 1])) : V.norm(V.sub(lp, centre));
          let i = V.dot(n, ld);
          if (la.type === 'hemi') i = 0.5 + 0.5 * i;
          if (i > 0) {
            let att = 1;
            if (la.type === 'lamp' || la.type === 'spot') { const d = V.dist(lp, centre); att = la.dist / (la.dist + d); }
            li += i * la.energy * att;
          }
        });
        const ma = obMaterial(ob, f.mat || 0);
        const ref = ma ? ma.ref : 0.8, emit = ma ? ma.emit : 0;
        const k = Math.min(1.2, li * ref + emit);
        c = rgb(B.clampByte(col[0] * k * 255), B.clampByte(col[1] * k * 255), B.clampByte(col[2] * k * 255));
      } else {
        const d = Math.abs(V.dot(n, toEye));
        const k = shaded ? d : 0.25 + 0.75 * d;
        c = rgb(B.clampByte(col[0] * k * 255), B.clampByte(col[1] * k * 255), B.clampByte(col[2] * k * 255));
      }
      r.mvp = sv.persmat;
      if (useVcol) {
        const lit = shaded ? 1 : 0.25 + 0.75 * Math.abs(V.dot(n, toEye));
        const cols = f.v.map((vi, k) => { const vc = f.col ? f.col[k] : me.vcols[vi]; return vc ? [vc[0] * 255 * lit, vc[1] * 255 * lit, vc[2] * 255 * lit] : [col[0] * 255 * lit, col[1] * 255 * lit, col[2] * 255 * lit]; });
        r.polyClip(f.v.map(i => world[i]), c, cols);
      } else r.polyClip(f.v.map(i => world[i]), c);
    }
  }

  function drawMeshWire(ctx, r, sv, ob, me, col, stipple) {
    r.mvp = M.mul(sv.persmat, ob.obmat);
    const verts = me.verts;
    for (const [a, b] of meshEdges(me)) {
      if (verts[a].hide || verts[b].hide) continue;
      r.line3(verts[a].co, verts[b].co, col, stipple || 0);
    }
  }

  function boundBox(points) {
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    points.forEach(p => { for (let i = 0; i < 3; i++) { if (p[i] < mn[i]) mn[i] = p[i]; if (p[i] > mx[i]) mx[i] = p[i]; } });
    if (!points.length) return [[-1, -1, -1], [1, 1, 1]];
    return [mn, mx];
  }

  function drawBox(r, mn, mx, col) {
    const c = [[mn[0], mn[1], mn[2]], [mx[0], mn[1], mn[2]], [mx[0], mx[1], mn[2]], [mn[0], mx[1], mn[2]], [mn[0], mn[1], mx[2]], [mx[0], mn[1], mx[2]], [mx[0], mx[1], mx[2]], [mn[0], mx[1], mx[2]]];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => r.line3(c[a], c[b], col));
  }

  function cameraLines(cam, inCamView) {
    let fac = cam.drawsize;
    if (inCamView) fac = cam.clipsta + 0.1;
    const depth = -fac * cam.lens / 16;
    const facx = fac * 1.28, facy = fac * 1.024;
    const p = [[0, 0, 0], [-facx, -facy, depth], [facx, -facy, depth], [facx, facy, depth], [-facx, facy, depth]];
    const tri = [[-0.7 * facx, facy * 1.1, depth], [0, facy * 1.7, depth], [0.7 * facx, facy * 1.1, depth]];
    return { p, tri };
  }

  function drawCamera(ctx, r, sv, ob, col) {
    const { p, tri } = cameraLines(ob.data, false);
    r.mvp = M.mul(sv.persmat, ob.obmat);
    r.line3(p[1], p[2], col); r.line3(p[2], p[3], col); r.line3(p[3], p[4], col); r.line3(p[4], p[1], col);
    for (let i = 1; i < 5; i++) r.line3(p[0], p[i], col);
    r.line3(tri[0], tri[1], col); r.line3(tri[1], tri[2], col); r.line3(tri[2], tri[0], col);
    if (ctx.scene.camera === ob) r.polyClip(tri, col);
    const cam = ob.data;
    if (cam.showlimits) {
      r.line3([0, 0, -cam.clipsta], [0, 0, -cam.clipend], rgb(0, 0, 0));
      r.point3([0, 0, -cam.clipsta], rgb(255, 255, 255), 3);
      r.point3([0, 0, -cam.clipend], rgb(255, 255, 255), 3);
    }
  }

  function circlePix(r, cx, cy, rad, col) {
    const steps = Math.max(16, Math.round(rad * 6));
    let prev = null;
    for (let i = 0; i <= steps; i++) {
      const a = i / steps * Math.PI * 2;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      if (prev) r.line(prev[0], prev[1], x, y, col);
      prev = [x, y];
    }
  }

  function drawLamp(ctx, r, sv, ob, col, sel) {
    const la = ob.data;
    const mat = ob.obmat;
    const c = [mat[12], mat[13], mat[14]];
    const s = project(sv, c);
    if (!s) return;
    r.mvp = sv.persmat;
    const vec = [c[0], c[1], 0];
    r.line3(c, vec, rgb(0, 0, 0), 0xCCCC);
    r.line3([c[0] - 0.1, c[1], 0], [c[0] + 0.1, c[1], 0], rgb(0, 0, 0));
    circlePix(r, s[0], s[1], 7, col);
    circlePix(r, s[0], s[1], 3.5, col);
    if (sel) r.rect(Math.round(s[0]) - 1, Math.round(s[1]) - 1, Math.round(s[0]) + 2, Math.round(s[1]) + 2, col);
    const dir = V.norm(M.dir(mat, [0, 0, -1]));
    if (la.type === 'sun') {
      r.line3(c, V.add(c, V.mul(dir, 2)), col);
    } else if (la.type === 'spot') {
      const ang = la.spotsize * B.DEG / 2;
      const len = la.dist;
      r.mvp = M.mul(sv.persmat, M.normalized3(mat).map((v, i) => (i >= 12 && i < 15 ? mat[i] : v)));
      const rr = Math.tan(ang) * len;
      const pts = [];
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([Math.cos(a) * rr, Math.sin(a) * rr, -len]); }
      for (let i = 0; i < 16; i++) r.line3(pts[i], pts[(i + 1) % 16], col);
      [0, 4, 8, 12].forEach(i => r.line3([0, 0, 0], pts[i], col));
      r.mvp = sv.persmat;
    } else if (la.type === 'hemi') {
      r.line3(c, V.add(c, V.mul(dir, 1.5)), col);
      const p = project(sv, V.add(c, V.mul(dir, 1.5)));
      if (p) circlePix(r, p[0], p[1], 4, col);
    }
  }

  function drawEmpty(ctx, r, sv, ob, col) {
    r.mvp = M.mul(sv.persmat, ob.obmat);
    r.line3([-1, 0, 0], [1, 0, 0], col);
    r.line3([0, -1, 0], [0, 1, 0], col);
    r.line3([0, 0, -1], [0, 0, 1], col);
  }

  function drawObCenter(r, sv, ob, sel, active) {
    const s = project(sv, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
    if (!s) return;
    const x = Math.round(s[0]) - 1, y = Math.round(s[1]) + 1;
    if (sel) {
      const pat = [
        [rgb(204, 80, 204), rgb(255, 128, 255), rgb(112, 32, 112), null],
        [rgb(255, 128, 255), rgb(255, 255, 255), rgb(204, 80, 204), rgb(0, 0, 0)],
        [rgb(112, 32, 112), rgb(204, 80, 204), rgb(112, 32, 112), rgb(0, 0, 0)],
        [null, rgb(0, 0, 0), rgb(0, 0, 0), null]
      ];
      if (!active) pat.forEach(row => row.forEach((c, i) => { if (c && c !== rgb(0, 0, 0) && c !== rgb(255, 255, 255)) row[i] = B.shade(c, -30); }));
      pat.forEach((row, j) => row.forEach((c, i) => { if (c) r.px(x + i, y - j, c); }));
    } else {
      r.px(x + 1, y - 1, rgb(32, 48, 160)); r.px(x + 2, y - 1, rgb(32, 48, 160));
      r.px(x + 1, y - 2, rgb(32, 48, 160)); r.px(x + 2, y - 2, rgb(32, 48, 160));
    }
  }

  function drawObject(ctx, r, sv, base) {
    const ob = base.object;
    const G = ctx.G;
    const col = wireColor(ctx, base);
    const dt = minDrawtype(sv.drawtype, ob.dt);
    const editing = G.obedit === ob;
    r.depthTest = dt !== 'wire' && dt !== 'bounds';
    r.depthOffset = 0;
    if (ob.type === 'mesh') {
      const me = editing ? G.editMesh : (B.displayMesh ? B.displayMesh(ob, ctx) : ob.data);
      if (!me) return;
      if (dt === 'bounds') {
        const bb = boundBox(me.verts.map(v => v.co));
        r.mvp = M.mul(sv.persmat, ob.obmat);
        drawBox(r, bb[0], bb[1], col);
      } else {
        if (dt === 'solid' || dt === 'shaded') {
          drawSolidMesh(ctx, r, sv, ob, me, dt === 'shaded');
          r.depthOffset = 0.0004;
        }
        if (editing) B.Edit && B.Edit.drawEdit ? B.Edit.drawEdit(ctx, r, sv, ob, me, dt) : drawMeshWire(ctx, r, sv, ob, me, C.EDGE);
        else if (G.f.faceselect && ctx.scene.basact === base && B.Paint) { r.depthTest = false; B.Paint.drawFaceSel(ctx, r, sv, ob); }
        else if (dt === 'wire' || base.sel || ob.dtx.wire) drawMeshWire(ctx, r, sv, ob, me, dt === 'wire' ? col : (base.sel ? col : C.WIRE));
        if (ob.dtx.bounds) {
          const bb = boundBox(me.verts.map(v => v.co));
          r.mvp = M.mul(sv.persmat, ob.obmat);
          drawBox(r, bb[0], bb[1], col);
        }
      }
    } else if (ob.type === 'camera') {
      if (!(sv.persp === 2 && ctx.scene.camera === ob)) drawCamera(ctx, r, sv, ob, col);
    } else if (ob.type === 'lamp') {
      r.depthTest = false;
      drawLamp(ctx, r, sv, ob, col, base.sel);
    } else if (ob.type === 'empty') {
      drawEmpty(ctx, r, sv, ob, col);
    } else if (B.DrawExtra && B.DrawExtra[ob.type]) {
      B.DrawExtra[ob.type](ctx, r, sv, base, col, dt, editing);
    }
    r.depthTest = false;
    r.depthOffset = 0;
    if (ob.dtx.axis) {
      r.mvp = M.mul(sv.persmat, M.normalized3(ob.obmat).map((v, i) => (i >= 12 && i < 15 ? ob.obmat[i] : v)));
      const sc = M.colScale(ob.obmat);
      [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, 'z']].forEach(a => {
        const tip = [a[0] * sc[0] * 1.2, a[1] * sc[1] * 1.2, a[2] * sc[2] * 1.2];
        r.line3([0, 0, 0], tip, col);
        const s = r.toScreen(tip);
        if (s) r.text('helv8', a[3], s[0] + 2, s[1] - 2, col);
      });
    }
    if (ob.dtx.name) {
      const s = project(sv, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
      if (s) r.text('helv8', ob.name, s[0] + 6, s[1] + 4, col);
    }
    if (ob.parent && (ob.lay & areaLayers(ctx, sv))) {
      const a = project(sv, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
      const pm = ob.parent.obmat;
      const b = project(sv, [pm[12], pm[13], pm[14]]);
      if (a && b && !editing) r.line(a[0], a[1], b[0], b[1], rgb(0, 0, 0), 0xF0F0);
    }
    if (!editing && ob.type !== 'lamp') drawObCenter(r, sv, ob, base.sel, ctx.scene.basact === base);
  }

  function drawGameObject(ctx, r, sv, base) {
    const ob = base.object;
    if (ob.type === 'mesh') {
      const me = B.displayMesh ? B.displayMesh(ob, ctx) : ob.data;
      r.depthTest = true;
      drawSolidMesh(ctx, r, sv, ob, me, true);
      r.depthTest = false;
    } else if (B.DrawExtra && B.DrawExtra[ob.type]) B.DrawExtra[ob.type](ctx, r, sv, base, B.rgb(0, 0, 0), 'shaded', false);
  }

  function minDrawtype(a, b) {
    const order = { bounds: 0, wire: 1, solid: 2, shaded: 3 };
    return order[a] <= order[b] ? a : b;
  }

  function drawCursor(r, sv, p) {
    const s = project(sv, p);
    if (!s) return;
    const x = Math.round(s[0]), y = Math.round(s[1]);
    const red = rgb(255, 0, 0), white = rgb(255, 255, 255), black = rgb(0, 0, 0);
    r.hline(x - 20, x - 6, y, black); r.hline(x + 6, x + 20, y, black);
    r.vline(x, y - 20, y - 6, black); r.vline(x, y + 6, y + 20, black);
    const pts = [];
    let px = 0, py = 10, d = 1 - 10;
    while (px <= py) {
      pts.push([px, py], [py, px], [-px, py], [-py, px], [px, -py], [py, -px], [-px, -py], [-py, -px]);
      px++;
      if (d < 0) d += 2 * px + 1; else { py--; d += 2 * (px - py) + 1; }
    }
    pts.forEach(([dx, dy]) => {
      const a = Math.atan2(dy, dx);
      const seg = Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 8));
      r.px(x + dx, y + dy, seg % 2 ? white : red);
    });
  }

  function drawGizmo(r, sv) {
    const w = sv.win;
    const ox = w.x1 + 6, oy = w.y1 + 6;
    const rot = sv.viewmat;
    const ax = [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, 'z']];
    ax.forEach(a => {
      const d = M.dir(rot, [a[0], a[1], a[2]]);
      const ex = d[0] * 8, ey = d[1] * 8;
      if (Math.hypot(ex, ey) < 1.5) return;
      r.line(ox, oy, ox + ex, oy + ey, rgb(0, 0, 0));
      r.text('helv8', a[3], ox + ex + (ex >= 0 ? 1 : -5), oy + ey + (ey >= 0 ? 1 : -6), rgb(0, 0, 0));
    });
  }

  function drawCamView(ctx, r, sv) {
    if (!sv.viewborder) return;
    const b = sv.viewborder, f = sv.camFrame;
    r.frame(Math.round(b.x1), Math.round(b.y1), Math.round(b.x1 + b.w), Math.round(b.y1 + b.h), C.CAMBORDER);
    const dash = (x1, y1, x2, y2) => {
      r.line(x1, y1, x2, y1, rgb(0, 0, 0), 0x3333); r.line(x1, y1, x2, y1, C.CAMDASH, 0xCCCC);
      r.line(x2, y1, x2, y2, rgb(0, 0, 0), 0x3333); r.line(x2, y1, x2, y2, C.CAMDASH, 0xCCCC);
      r.line(x2, y2, x1, y2, rgb(0, 0, 0), 0x3333); r.line(x2, y2, x1, y2, C.CAMDASH, 0xCCCC);
      r.line(x1, y2, x1, y1, rgb(0, 0, 0), 0x3333); r.line(x1, y2, x1, y1, C.CAMDASH, 0xCCCC);
    };
    dash(Math.round(f.x1), Math.round(f.y1), Math.round(f.x1 + f.w), Math.round(f.y1 + f.h));
    const sx = f.w * 0.1, sy = f.h * 0.1;
    dash(Math.round(f.x1 + sx), Math.round(f.y1 + sy), Math.round(f.x1 + f.w - sx), Math.round(f.y1 + f.h - sy));
    const rr = ctx.scene.r;
    if (rr.mode.border) {
      const bd = rr.border;
      r.frame(Math.round(f.x1 + bd[0] * f.w), Math.round(f.y1 + bd[1] * f.h), Math.round(f.x1 + bd[2] * f.w), Math.round(f.y1 + bd[3] * f.h), rgb(255, 64, 64));
    }
  }

  function draw(ctx, area, r) {
    const sv = setMatrices(ctx, area);
    const w = area.win;
    r.rect(w.x1, w.y1, w.x2 + 1, w.y2 + 1, C.BACK);
    r.viewport(w.x1, w.y1, area.winx, area.winy);
    if (sv.bgpic && sv.bgpic.image && B.drawBgPic) B.drawBgPic(ctx, r, sv);
    if (ctx.G.playing && ctx.G.playing.game && ctx.G.playing.area === area && B.Game) { B.Game.drawView(ctx, area, r, sv); return; }
    if (sv.persp !== 2) drawGrid(r, sv);
    r.clearDepth();
    const bases = visibleBases(ctx, sv);
    const order = bases.filter(b => !b.sel).concat(bases.filter(b => b.sel && ctx.scene.basact !== b)).concat(bases.filter(b => b.sel && ctx.scene.basact === b));
    if (ctx.G.obedit) {
      const eb = order.find(b => b.object === ctx.G.obedit);
      if (eb) { order.splice(order.indexOf(eb), 1); order.push(eb); }
    }
    order.forEach(b => { B.Data.whereIs(b.object); });
    order.forEach(b => { try { drawObject(ctx, r, sv, b); } catch (err) { console.error(err); } });
    r.depthTest = false;
    if (ctx.G.radio && B.Radio) B.Radio.draw(ctx, r, sv);
    if (sv.persp === 2) drawCamView(ctx, r, sv);
    if (ctx.G.f.proportional && ctx.G.obedit && ctx.propCircle) {
      const pc = ctx.propCircle;
      circlePix(r, pc.x, pc.y, pc.r, rgb(255, 255, 255));
    }
    drawCursor(r, sv, sv.localview ? sv.localview.cursor : ctx.scene.cursor);
    drawGizmo(r, sv);
    if (area.border) {
      const bd = area.border;
      r.frame(Math.min(bd.x1, bd.x2), Math.min(bd.y1, bd.y2), Math.max(bd.x1, bd.x2), Math.max(bd.y1, bd.y2), rgb(255, 255, 255));
      r.line(bd.x1, bd.y1, bd.x2, bd.y1, rgb(0, 0, 0), 0xAAAA); r.line(bd.x1, bd.y2, bd.x2, bd.y2, rgb(0, 0, 0), 0xAAAA);
      r.line(bd.x1, bd.y1, bd.x1, bd.y2, rgb(0, 0, 0), 0xAAAA); r.line(bd.x2, bd.y1, bd.x2, bd.y2, rgb(0, 0, 0), 0xAAAA);
    }
    [area.crossLine, area.crossLine2].forEach(cl => {
      if (!cl) return;
      r.line(cl[0], cl[1], cl[2], cl[3], rgb(255, 255, 255), 0xF0F0);
      r.line(cl[0], cl[1], cl[2], cl[3], rgb(0, 0, 0), 0x0F0F);
    });
    if (ctx.G.playing && ctx.G.playing.area === area && !ctx.G.playing.game) {
      r.text('helv12', String(ctx.scene.cfra), w.x1 + 6, w.y2 - 14, rgb(255, 255, 255));
    }
    if (ctx.transformInfo && ctx.transformInfo.area === area) {
      void 0;
    }
  }

  function header(ctx, area, blk) {
    const sv = area.space;
    let x = B.ScreenDraw.stdHeaderButtons(blk, area, ctx);
    blk.icon([15, 0], 65, 0, 21, 22, () => viewAll(ctx, area), 'Home (HOMEKEY)');
    x = 93;
    if (!sv.localview) {
      for (let i = 0; i < 20; i++) {
        const col = i % 10, rowTop = i < 10;
        const bx = x + (col % 5) * 10 + (col >= 5 ? 55 : 0);
        const by = rowTop ? 11 : 0;
        const bit = 1 << i;
        const b = blk.tog('', bx, by, 11, 11, () => !!(layersOf(ctx, sv) & bit), () => {}, 'Layers');
        b.func = ev => toggleLayer(ctx, area, i, ev && ev.shift);
        b.flat = false;
      }
    }
    x = 203;
    blk.icontog([3, 4], x, 0, 21, 22, () => sv.scenelock, v => { sv.scenelock = !!v; if (v) { sv.lay = ctx.scene.lay; } ctx.redrawAll(); }, 'Lock layers and used Camera to Scene');
    x = 243;
    blk.icontog([10, 1], x, 0, 21, 22, () => !!sv.localview, () => toggleLocal(ctx, area), 'Local View (NumPad /)');
    x += 30;
    const pb = blk.iconrow([0, 1], 3, x, 0, 21, 22, () => sv.persp, v => { sv.persp = v; if (v === 2 && !ctx.scene.camera) sv.persp = 1; ctx.redrawAll(); }, 'Perspective mode (NumPad 5, Numpad 0)');
    pb.icons = [[0, 1], [1, 1], [2, 1]];
    x += 30;
    const vb = blk.iconrow([0, 2], 3, x, 0, 21, 22, () => ({ 7: 0, 1: 1, 3: 2 })[Math.abs(sv.view)] || 0, v => setView(ctx, area, [7, 1, 3][v]), 'Top/Front or Side views (Numpad 7, 1, 3)');
    vb.icons = [[3, 2], [4, 2], [5, 2]];
    x += 30;
    const db = blk.iconrow([4, 1], 4, x, 0, 21, 22, () => ['bounds', 'wire', 'solid', 'shaded'].indexOf(sv.drawtype), v => { sv.drawtype = ['bounds', 'wire', 'solid', 'shaded'][v]; ctx.redrawAll(); }, 'Drawtype: boundbox/wire/solid/shaded (ZKEY, SHIFT+Z)');
    db.icons = [[4, 1], [5, 1], [6, 1], [7, 1]];
    x += 30;
    blk.icon([14, 0], x, 0, 21, 22, null, 'Translate view (SHIFT+MiddleMouse)').drag = 'pan';
    blk.icon([13, 0], x + 21, 0, 20, 22, null, 'Zoom view (CTRL+MiddleMouse)').drag = 'zoom';
    x = 414;
    const pivots = [['bbox', [11, 2], 'Rotation/Scaling around boundbox center (COMMAKEY)'], ['median', [14, 2], 'Rotation/Scaling around median point'], ['cursor', [12, 2], 'Rotation/Scaling around cursor (DOTKEY)'], ['individual', [13, 2], 'Rotation/Scaling around individual centers']];
    pivots.forEach((p, i) => blk.add('ROW', { icon: p[1], x: x + i * 20, y: 0, w: 20 + (i === 0 ? 0 : 0), h: 22, get: () => sv.around, set: v => { sv.around = v; }, rowValue: p[0], tip: p[2] }));
    x = 504;
    blk.icontog([14, 4], x, 0, 20, 22, () => !!ctx.G.obedit, () => B.Edit && B.Edit.toggle(ctx), 'EditMode (TAB)');
    blk.icontog([16, 4], x + 20, 0, 20, 22, () => ctx.G.f.vertexpaint, () => B.Paint && B.Paint.toggleVertexPaint(ctx), 'VertexPaint Mode (VKEY)');
    blk.icontog([18, 4], x + 40, 0, 20, 22, () => ctx.G.f.faceselect, () => B.Paint && B.Paint.toggleFaceSelect(ctx), 'FaceSelect Mode');
    x = 584;
    if (ctx.G.obedit) {
      blk.icontog([10, 4], x, 0, 20, 22, () => ctx.G.f.proportional, v => { ctx.G.f.proportional = !!v; ctx.redrawAll(); }, 'Proportional vertex editing');
      if (ctx.G.f.proportional) {
        blk.add('ROW', { icon: [11, 5], x: x + 20, y: 0, w: 20, h: 22, get: () => ctx.G.f.propSmooth, set: v => { ctx.G.f.propSmooth = v; }, rowValue: false, tip: 'Sharp falloff' });
        blk.add('ROW', { icon: [12, 5], x: x + 40, y: 0, w: 20, h: 22, get: () => ctx.G.f.propSmooth, set: v => { ctx.G.f.propSmooth = v; }, rowValue: true, tip: 'Smooth falloff' });
      }
      x += 70;
    }
    blk.icon([5, 8], x, 0, 20, 22, ev => B.Render && B.Render.renderView(ctx, area, ev && ev.shift), 'Render this view. (Hold SHIFT for Anim render)');
    blk.icon([8, 7], x + 40, 0, 21, 22, () => B.Game && B.Game.start(ctx, area), 'Start game');
  }

  function layersOf(ctx, sv) { return sv.scenelock ? ctx.scene.lay : sv.lay; }

  function toggleLayer(ctx, area, i, shift) {
    const sv = area.space;
    const bit = 1 << i;
    let lay = layersOf(ctx, sv);
    if (shift) { lay ^= bit; if (!lay) lay = bit; } else lay = bit;
    if (sv.scenelock) { ctx.scene.lay = lay; ctx.scene.layact = bit; }
    sv.lay = lay;
    sv.layact = bit;
    ctx.redrawAll();
  }

  function setView(ctx, area, n) {
    const sv = area.space;
    sv.view = n;
    sv.quat = viewQuat(n);
    if (sv.persp === 2) sv.persp = sv.perspSaved != null ? sv.perspSaved : 0;
    ctx.redrawAll();
  }

  function viewAll(ctx, area, onlySelected) {
    const sv = area.space;
    const pts = [];
    if (ctx.G.obedit && B.Edit) {
      const ob = ctx.G.obedit;
      B.Edit.editPoints(ctx).forEach(p => { if (!onlySelected || p.sel) pts.push(M.loc(ob.obmat, p.co)); });
    } else {
      visibleBases(ctx, sv).forEach(b => {
        if (onlySelected && !b.sel) return;
        const ob = b.object;
        B.Data.whereIs(ob);
        if (ob.type === 'mesh') ob.data.verts.forEach(v => pts.push(M.loc(ob.obmat, v.co)));
        else pts.push([ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
      });
    }
    if (!pts.length) return;
    const [mn, mx] = boundBox(pts);
    sv.ofs = V.mid(mn, mx);
    const size = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2], 0.5);
    sv.dist = size * 0.75 + 1;
    if (sv.persp === 2) sv.persp = 1;
    ctx.redrawAll();
  }

  function toggleLocal(ctx, area) {
    const sv = area.space;
    if (sv.localview) {
      Object.assign(sv, sv.localview.saved);
      sv.localview = null;
    } else {
      const obs = ctx.scene.bases.filter(b => b.sel && (b.object.lay & layersOf(ctx, sv))).map(b => b.object);
      if (!obs.length) return;
      sv.localview = { obs, lay: 0xFFFFFFFF, cursor: V.copy(ctx.scene.cursor), saved: { ofs: V.copy(sv.ofs), dist: sv.dist, quat: sv.quat.slice(), persp: sv.persp, view: sv.view } };
      viewAll(ctx, area, false);
    }
    ctx.redrawAll();
  }

  function rotateView(sv, axisWorld, angle) {
    const q = Q.axisAngle(axisWorld, angle);
    sv.quat = Q.norm(Q.mul(sv.quat, q));
    sv.view = 0;
  }

  function navModal(ctx, area, ev, mode) {
    const sv = area.space;
    let last = [ev.x, ev.y];
    const start = [ev.x, ev.y];
    const startDist = sv.dist;
    if (sv.persp === 2) { sv.persp = 1; sv.view = 0; }
    const center = [(area.win.x1 + area.win.x2) / 2, (area.win.y1 + area.win.y2) / 2];
    const rad = Math.min(area.winx, area.winy) * 0.6;
    const sphere = (x, y) => {
      let px = (x - center[0]) / rad, py = (y - center[1]) / rad;
      const d = px * px + py * py;
      let pz;
      if (d < 0.5) pz = Math.sqrt(1 - d); else pz = 0.5 / Math.sqrt(d);
      return V.norm([px, py, pz]);
    };
    return {
      move(e) {
        const dx = e.x - last[0], dy = e.y - last[1];
        if (mode === 'rotate') {
          if (ctx.prefs.trackball) {
            const a = sphere(last[0], last[1]), b = sphere(e.x, e.y);
            const axis = V.cross(b, a);
            const ang = Math.acos(B.clamp(V.dot(a, b), -1, 1)) * 2;
            if (V.len(axis) > 1e-6) {
              const rot = M.fromQuat(sv.quat);
              const inv = M.transpose3(rot);
              const wa = M.dir(inv, axis);
              rotateView(sv, wa, -ang);
            }
          } else {
            rotateView(sv, [0, 0, 1], dx * 0.007);
            const rot = M.fromQuat(sv.quat);
            const xa = M.dir(M.transpose3(rot), [1, 0, 0]);
            rotateView(sv, xa, -dy * 0.007);
          }
        } else if (mode === 'pan') {
          const d = viewDelta(sv, dx, dy, sv.ofs);
          sv.ofs = V.sub(sv.ofs, d);
        } else if (mode === 'zoom') {
          sv.dist = B.clamp(startDist * Math.exp((e.y - start[1]) * -0.01), 0.05, 2000);
        }
        last = [e.x, e.y];
        area.redraw(); ctx.schedule();
      },
      up() { return true; },
      key(e) { if (e.key === 'ESC') return true; return false; }
    };
  }

  function numpad(ctx, area, ev) {
    const sv = area.space;
    const k = ev.key;
    if (k === 'PAD7' || k === 'PAD1' || k === 'PAD3') {
      const n = +k.slice(3);
      setView(ctx, area, ev.ctrl ? -n : n);
      return true;
    }
    if (k === 'PAD0') {
      if (ev.ctrl) {
        const base = ctx.scene.basact;
        if (base && base.object.type !== 'lamp') { ctx.scene.camera = base.object; sv.persp = 2; }
      } else if (ctx.scene.camera) {
        if (sv.persp === 2) sv.persp = sv.perspSaved != null ? sv.perspSaved : 1;
        else { sv.perspSaved = sv.persp; sv.persp = 2; }
      }
      sv.view = 0;
      ctx.redrawAll();
      return true;
    }
    if (k === 'PAD5') { sv.persp = sv.persp === 0 ? 1 : 0; ctx.redrawAll(); return true; }
    if (k === 'PAD2' || k === 'PAD8') {
      if (sv.persp === 2) sv.persp = 1;
      const rot = M.fromQuat(sv.quat);
      rotateView(sv, M.dir(M.transpose3(rot), [1, 0, 0]), (k === 'PAD2' ? 1 : -1) * Math.PI / 12);
      ctx.redrawAll();
      return true;
    }
    if (k === 'PAD4' || k === 'PAD6') {
      if (sv.persp === 2) sv.persp = 1;
      rotateView(sv, [0, 0, 1], (k === 'PAD4' ? 1 : -1) * Math.PI / 12);
      ctx.redrawAll();
      return true;
    }
    if (k === 'PADPLUS' || k === 'PADMINUS') {
      sv.dist = B.clamp(sv.dist * (k === 'PADPLUS' ? 1 / 1.2 : 1.2), 0.05, 2000);
      ctx.redrawAll();
      return true;
    }
    if (k === 'PADSLASH') { toggleLocal(ctx, area); return true; }
    if (k === 'PADPERIOD') { viewAll(ctx, area, true); return true; }
    return false;
  }

  function wireDistance(ctx, sv, base, mx, my) {
    const ob = base.object;
    B.Data.whereIs(ob);
    let best = Infinity;
    const seg = (a, b) => {
      if (!a || !b) return;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = B.clamp(((mx - a[0]) * dx + (my - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const d = Math.hypot(mx - a[0] - t * dx, my - a[1] - t * dy);
      if (d < best) best = d;
    };
    const P = p => project(sv, M.loc(ob.obmat, p));
    const c = project(sv, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]);
    if (c) best = Math.min(best, Math.hypot(mx - c[0], my - c[1]));
    const dt = minDrawtype(sv.drawtype, ob.dt);
    if (ob.type === 'mesh') {
      const me = ob.data;
      const pts = me.verts.map(v => P(v.co));
      meshEdges(me).forEach(([a, b]) => seg(pts[a], pts[b]));
      if (dt === 'solid' || dt === 'shaded') {
        for (const f of me.faces) {
          if (f.v.length < 3) continue;
          const poly = f.v.map(i => pts[i]);
          if (poly.some(p => !p)) continue;
          if (pointInPoly(mx, my, poly)) { best = 0; break; }
        }
      }
    } else if (ob.type === 'camera') {
      const { p, tri } = cameraLines(ob.data, false);
      const s = p.map(P);
      [[1, 2], [2, 3], [3, 4], [4, 1], [0, 1], [0, 2], [0, 3], [0, 4]].forEach(([a, b]) => seg(s[a], s[b]));
      const t = tri.map(P); seg(t[0], t[1]); seg(t[1], t[2]);
    } else if (ob.type === 'empty') {
      [[[-1, 0, 0], [1, 0, 0]], [[0, -1, 0], [0, 1, 0]], [[0, 0, -1], [0, 0, 1]]].forEach(([a, b]) => seg(P(a), P(b)));
    } else if (ob.type === 'lamp') {
      if (c) best = Math.min(best, Math.max(0, Math.hypot(mx - c[0], my - c[1]) - 7));
    } else if (B.DrawExtra && B.DrawExtra.pickPoints && B.DrawExtra.pickPoints[ob.type]) {
      const segs = B.DrawExtra.pickPoints[ob.type](ob);
      segs.forEach(([a, b]) => seg(P(a), P(b)));
    }
    return best;
  }

  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function pickObject(ctx, area, ev) {
    const sv = setMatrices(ctx, area);
    const sce = ctx.scene;
    const cands = visibleBases(ctx, sv).map(b => ({ b, d: wireDistance(ctx, sv, b, ev.x, ev.y) })).filter(c => c.d <= 10).sort((a, b) => a.d - b.d);
    let pick = null;
    if (cands.length) {
      const ai = cands.findIndex(c => c.b === sce.basact);
      pick = ai >= 0 && cands.length > 1 ? cands[(ai + 1) % cands.length].b : cands[0].b;
    }
    if (ev.shift) {
      if (pick) {
        if (pick.sel && sce.basact === pick) pick.sel = false;
        else { pick.sel = true; sce.basact = pick; }
      }
    } else {
      sce.bases.forEach(b => { b.sel = false; });
      if (pick) { pick.sel = true; sce.basact = pick; }
    }
    if (B.Buts) B.Buts.activeChanged(ctx);
    ctx.redrawAll();
  }

  function borderSelect(ctx, area) {
    area.border = null;
    let phase = 0;
    let p0 = null;
    let deselect = false;
    const clear = () => { area.border = null; area.crossLine = null; area.crossLine2 = null; };
    return {
      move(e) {
        if (phase === 0) {
          area.crossLine = [area.win.x1, e.y, area.win.x2, e.y];
          area.crossLine2 = [e.x, area.win.y1, e.x, area.win.y2];
        } else area.border = { x1: p0[0], y1: p0[1], x2: e.x, y2: e.y };
        area.redraw(); ctx.schedule();
      },
      down(e) {
        if (phase === 0) {
          if (e.button === 0 || e.button === 1) {
            phase = 1; p0 = [e.x, e.y];
            area.crossLine = null; area.crossLine2 = null;
            area.border = { x1: e.x, y1: e.y, x2: e.x, y2: e.y };
            deselect = e.button === 1;
            area.redraw(); ctx.schedule();
          } else { clear(); area.redraw(); ctx.schedule(); return true; }
        }
        return false;
      },
      up(e) {
        if (phase !== 1) return false;
        const bd = { x1: Math.min(p0[0], e.x), x2: Math.max(p0[0], e.x), y1: Math.min(p0[1], e.y), y2: Math.max(p0[1], e.y) };
        clear();
        applyBorder(ctx, area, bd, !deselect);
        return true;
      },
      key(e) { if (e.key === 'ESC') { clear(); ctx.redrawAll(); return true; } return false; },
      cancel() { clear(); }
    };
  }

  function applyBorder(ctx, area, bd, select) {
    const sv = setMatrices(ctx, area);
    const inside = s => s && s[0] >= bd.x1 && s[0] <= bd.x2 && s[1] >= bd.y1 && s[1] <= bd.y2;
    if (ctx.G.obedit && B.Edit) {
      B.Edit.borderSelect(ctx, sv, inside, select);
    } else {
      visibleBases(ctx, sv).forEach(b => {
        const ob = b.object;
        B.Data.whereIs(ob);
        let hit = inside(project(sv, [ob.obmat[12], ob.obmat[13], ob.obmat[14]]));
        if (!hit && ob.type === 'mesh') hit = ob.data.verts.some(v => inside(project(sv, M.loc(ob.obmat, v.co))));
        if (hit) {
          b.sel = select;
          if (select && !ctx.scene.basact) ctx.scene.basact = b;
        }
      });
    }
    if (B.Buts) B.Buts.activeChanged(ctx);
    ctx.redrawAll();
  }

  function setCursor(ctx, area, ev) {
    const sv = setMatrices(ctx, area);
    const target = sv.localview ? sv.localview : ctx.scene;
    const p = screenToWorld(sv, ev.x, ev.y, target.cursor);
    if (ctx.G.f.gridSnapCursor) p.forEach((v, i) => { p[i] = Math.round(v / sv.grid) * sv.grid; });
    target.cursor = p;
    ctx.redrawType('view3d');
  }

  function event(ctx, area, ev) {
    const sv = area.space;
    if (ev.type === 'down') {
      if (!area.inWin(ev.x, ev.y)) return false;
      if (ev.button === 1) {
        const mode = ev.shift ? 'pan' : ev.ctrl ? 'zoom' : 'rotate';
        ctx.modal = navModal(ctx, area, ev, mode);
        return true;
      }
      if (ev.button === 0) {
        if (ctx.G.f.vertexpaint && B.Paint) { ctx.modal = B.Paint.paintModal(ctx, area, ev); return true; }
        setCursor(ctx, area, ev);
        return true;
      }
      if (ev.button === 2) {
        if (ctx.G.obedit && B.Edit) B.Edit.pick(ctx, area, ev);
        else if (ctx.G.f.faceselect && B.Paint) B.Paint.pickFace(ctx, area, ev);
        else pickObject(ctx, area, ev);
        if (B.Transform) ctx.modal = B.Transform.dragAfterSelect(ctx, area, ev);
        return true;
      }
    }
    if (ev.type === 'wheel') {
      if (!area.inWin(ev.x, ev.y)) return false;
      if (ev.ctrl) { rotateView(sv, [0, 0, 1], ev.delta * Math.PI / 24); }
      else if (ev.shift) { const rot = M.fromQuat(sv.quat); rotateView(sv, M.dir(M.transpose3(rot), [1, 0, 0]), ev.delta * Math.PI / 24); }
      else sv.dist = B.clamp(sv.dist * (ev.delta > 0 ? 1.2 : 1 / 1.2), 0.05, 2000);
      if (sv.persp === 2 && (ev.ctrl || ev.shift)) sv.persp = 1;
      area.redraw(); ctx.schedule();
      return true;
    }
    if (ev.type !== 'key') return false;
    if (numpad(ctx, area, ev)) return true;
    const k = ev.key;
    if (k === 'HOME') { viewAll(ctx, area, false); return true; }
    if (k === 'C' && !ev.ctrl && !ev.alt && !ev.shift && !ctx.G.obedit) { sv.ofs = V.copy(sv.localview ? sv.localview.cursor : ctx.scene.cursor); if (sv.persp === 2) sv.persp = 1; ctx.redrawAll(); return true; }
    if (k === 'C' && !ev.ctrl && !ev.alt && !ev.shift && ctx.G.obedit) { sv.ofs = V.copy(ctx.scene.cursor); ctx.redrawAll(); return true; }
    if (k === 'Z' && !ev.ctrl && !ev.alt) {
      if (ev.shift) sv.drawtype = sv.drawtype === 'shaded' ? 'wire' : 'shaded';
      else sv.drawtype = sv.drawtype === 'wire' || sv.drawtype === 'bounds' ? 'solid' : 'wire';
      ctx.redrawAll();
      return true;
    }
    if (k === 'COMMA' && !ev.shift) { sv.around = 'bbox'; ctx.redrawAll(); return true; }
    if (k === 'PERIOD' && !ev.shift) { sv.around = 'cursor'; ctx.redrawAll(); return true; }
    if (k === 'COMMA' && ev.shift) { sv.around = 'median'; ctx.redrawAll(); return true; }
    if (k === 'PERIOD' && ev.shift) { sv.around = 'individual'; ctx.redrawAll(); return true; }
    if (/^[0-9]$/.test(k) && !ev.ctrl && !ctx.G.obedit && !ev.alt) {
      const i = k === '0' ? 9 : +k - 1;
      toggleLayer(ctx, area, ev.alt ? i + 10 : i, ev.shift);
      return true;
    }
    if (/^[0-9]$/.test(k) && ev.alt && !ctx.G.obedit) {
      const i = k === '0' ? 19 : +k + 9;
      toggleLayer(ctx, area, i, ev.shift);
      return true;
    }
    if (k === 'B' && !ev.ctrl && !ev.alt && !ev.shift) { ctx.modal = borderSelect(ctx, area, ev); ctx.modal.move(ev); return true; }
    if (k === 'P' && ev.shift && false) return true;
    if (ctx.G.obedit && B.Edit && B.Edit.key(ctx, area, ev)) return true;
    if (!ctx.G.obedit && ctx.G.f.vertexpaint && B.Paint && B.Paint.key(ctx, area, ev)) return true;
    if (!ctx.G.obedit && ctx.G.f.faceselect && B.Paint && B.Paint.faceKey(ctx, area, ev)) return true;
    if (!ctx.G.obedit && k === 'V' && !ev.ctrl && !ev.shift && !ev.alt && B.Paint) { B.Paint.toggleVertexPaint(ctx); return true; }
    if (!ctx.G.obedit && B.ObjectOps && B.ObjectOps.key(ctx, area, ev)) return true;
    if (B.Transform && B.Transform.key(ctx, area, ev)) return true;
    if (B.Toolbox && k === 'SPACE' && !ev.ctrl && !ev.alt && !ev.shift) { B.Toolbox.open(ctx, area); return true; }
    if (k === 'TAB' && !ev.ctrl && !ev.alt && B.Edit) { B.Edit.toggle(ctx); return true; }
    if (k === 'A' && ev.alt && !ev.ctrl && B.Anim) { B.Anim.play(ctx, ev.shift ? null : area); return true; }
    if (k === 'P' && !ev.ctrl && !ev.alt && !ev.shift && !ctx.G.obedit && B.Game) { B.Game.start(ctx, area); return true; }
    if (k === 'N' && !ev.ctrl && !ev.alt && !ev.shift && B.ObjectOps) { B.ObjectOps.numbuts(ctx); return true; }
    return false;
  }

  B.View3D = {
    C, VIEWS, viewQuat, setMatrices, project, unproject, screenToWorld, viewDelta, viewVector, visibleBases, areaLayers,
    meshEdges, faceNormal, boundBox, drawBox, pickObject, drawGameObject, borderSelect, applyBorder, viewAll, setView, toggleLocal, layersOf,
    wireDistance, pointInPoly, obMaterial, matColor, circlePix, drawMeshWire, minDrawtype, cameraLines
  };

  B.SPACES.view3d = { name: '3D View', init, draw, header, event };
})(globalThis.B204 = globalThis.B204 || {});
