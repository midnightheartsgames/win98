(function (H) {
  'use strict';

  const M4 = H.M4;
  const INF = 1e9;
  const CELL = H.CELL;

  const VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol; attribute vec3 aN;
uniform mat4 uProj; uniform mat4 uView; uniform vec3 uCam; uniform vec2 uFog; uniform vec2 uScroll;
varying vec2 vUV; varying vec4 vCol; varying vec3 vPos; varying vec3 vN; varying float vFog;
void main() {
  gl_Position = uProj * uView * vec4(aPos, 1.0);
  vUV = aUV + uScroll; vCol = aCol; vPos = aPos; vN = aN;
  float d = length(aPos - uCam);
  vFog = clamp((uFog.y - d) / max(1.0, uFog.y - uFog.x), 0.0, 1.0);
}`;

  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogCol; uniform float uDither; uniform float uAlphaTest; uniform float uFull; uniform float uFlash; uniform float uBright;
uniform vec3 uFlashPos; uniform vec3 uFlashDir; uniform vec4 uDyn[4]; uniform vec3 uDynCol[4];
varying vec2 vUV; varying vec4 vCol; varying vec3 vPos; varying vec3 vN; varying float vFog;
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  vec2 a = mod(q, 2.0); vec2 b = floor(q / 2.0);
  float ba = a.x * 2.0 + a.y * 3.0 - 4.0 * a.x * a.y;
  float bb = b.x * 2.0 + b.y * 3.0 - 4.0 * b.x * b.y;
  return (ba * 4.0 + bb + 0.5) / 16.0;
}
void main() {
  vec4 t = texture2D(uTex, vUV);
  if (uAlphaTest > 0.5 && t.a < 0.5) discard;
  vec3 light = vCol.rgb;
  if (uFull < 0.5) {
    vec3 n = normalize(vN);
    if (uFlash > 0.5) {
      vec3 L = vPos - uFlashPos; float d = length(L); vec3 Ln = L / max(d, 0.001);
      float spot = smoothstep(0.86, 0.96, dot(Ln, uFlashDir));
      float att = clamp(1.0 - d / 20.0, 0.0, 1.0);
      light += vec3(1.0, 0.96, 0.86) * spot * att * (0.35 + 0.65 * max(dot(n, -Ln), 0.0)) * 1.3;
    }
    for (int i = 0; i < 4; i++) {
      float r = uDyn[i].w;
      if (r > 0.0) {
        vec3 L = uDyn[i].xyz - vPos; float d = length(L);
        float att = clamp(1.0 - d / r, 0.0, 1.0);
        light += uDynCol[i] * att * att * max(0.25, dot(n, L / max(d, 0.001)));
      }
    }
  }
  vec3 c = t.rgb * light * uBright;
  c = mix(uFogCol, c, vFog);
  if (uDither > 0.5) {
    float b = bayer(gl_FragCoord.xy);
    c = floor(c * vec3(31.0, 63.0, 31.0) + b) / vec3(31.0, 63.0, 31.0);
  }
  gl_FragColor = vec4(c, t.a * vCol.a);
}`;

  const STRIDE = 12;

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve });
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.opts = Object.assign({ dither: true, filter: 'linear', fov: 75, bright: 1.1, fogScale: 1 }, opts);
      this.prog = this.program(VS, FS);
      this.loc = {};
      for (const a of ['aPos', 'aUV', 'aCol', 'aN']) this.loc[a] = gl.getAttribLocation(this.prog, a);
      for (const u of ['uProj', 'uView', 'uCam', 'uFog', 'uScroll', 'uTex', 'uFogCol', 'uDither', 'uAlphaTest', 'uFull', 'uFlash', 'uFlashPos', 'uFlashDir', 'uBright']) this.loc[u] = gl.getUniformLocation(this.prog, u);
      this.loc.uDyn = []; this.loc.uDynCol = [];
      for (let i = 0; i < 4; i++) { this.loc.uDyn.push(gl.getUniformLocation(this.prog, `uDyn[${i}]`)); this.loc.uDynCol.push(gl.getUniformLocation(this.prog, `uDynCol[${i}]`)); }
      this.textures = new Map();
      this.static = [];
      this.dynBuf = gl.createBuffer();
      this.vmBuf = gl.createBuffer();
      this.decalBuf = gl.createBuffer();
      this.skyBuf = gl.createBuffer();
      this.batch = new H.Batch();
      this.vmBatch = new H.Batch();
      this.decalGroups = [];
      this.decalVersion = -1;
      this.world = null;
      this.stats = { tris: 0, draws: 0 };
      this.animModels = [];
    }

    program(vs, fs) {
      const gl = this.gl;
      const mk = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    setFilter(filter) {
      this.opts.filter = filter;
      const gl = this.gl;
      for (const [name, t] of this.textures) {
        gl.bindTexture(gl.TEXTURE_2D, t);
        this.applyFilter(name);
      }
    }

    applyFilter(name) {
      const gl = this.gl;
      const f = (H.Tex.flags[name] || {});
      const point = this.opts.filter === 'point';
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, point ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, point ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_NEAREST);
      const wrap = f.clamp || name.startsWith('sign:') || name.startsWith('sky:') ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    }

    tex(name) {
      let t = this.textures.get(name);
      if (t) return t;
      const gl = this.gl;
      let cv = null;
      if (name.startsWith('sign:')) { const [, text, bg, fg] = name.split('|'); cv = H.Tex.signCanvas(text, bg, fg); }
      else if (name.startsWith('sky:')) { const [, kind, face] = name.split(':'); cv = H.Tex.skyCanvas(kind, face); }
      else cv = H.Tex.paint(name) || H.Tex.paint('concrete');
      t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.applyFilter(name);
      this.textures.set(name, t);
      return t;
    }

    blendOf(tex) {
      const f = H.Tex.flags[tex] || {};
      if (f.trans) return 'alpha';
      if (f.alpha) return 'alphatest';
      return 'opaque';
    }

    loadWorld(world, progress) {
      const gl = this.gl;
      for (const g of this.static) gl.deleteBuffer(g.buf);
      this.static = [];
      this.world = world;
      const b = new H.Batch();
      const cache = new Map();
      const bake = (p, n) => {
        const key = `${Math.round(p.x * 4)},${Math.round(p.y * 4)},${Math.round(p.z * 4)},${Math.round(n.x * 2)},${Math.round(n.y * 2)},${Math.round(n.z * 2)}`;
        let c = cache.get(key);
        if (!c) { c = world.bakeLight(p, n); cache.set(key, c); }
        return c;
      };
      b.lightFn = bake;
      this.buildCells(world, b);
      if (progress) progress(0.5);
      this.buildBoxes(world, b);
      this.buildRamps(world, b);
      this.buildWater(world, b);
      this.buildSigns(world, b);
      this.animModels = [];
      for (const md of world.models) {
        if (['teleporter', 'reactor', 'thumper'].includes(md.kind)) { this.animModels.push(md); continue; }
        if (md.kind === 'citadel') { b.lightFn = null; b.tint = [0.55, 0.6, 0.66]; H.Models.drawStatic(b, md, 0); b.tint = null; b.lightFn = bake; continue; }
        H.Models.drawStatic(b, md, 0);
      }
      for (const g of b.groups.values()) {
        if (!g.data.length) continue;
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.data), gl.STATIC_DRAW);
        this.static.push({ tex: g.tex, blend: g.blend, buf, count: g.data.length / STRIDE });
        this.tex(g.tex);
      }
      const sky = world.env.sky;
      for (const f of ['north', 'south', 'east', 'west', 'top', 'bottom']) this.tex(`sky:${sky}:${f}`);
      this.decalVersion = -1;
      if (progress) progress(1);
    }

    faceQuad(b, tex, p0, p1, p2, p3, n, uvFn, blend) {
      const uv = [];
      for (const p of [p0, p1, p2, p3]) { const q = uvFn(p); uv.push(q[0], q[1]); }
      b.quad(tex, p0, p1, p2, p3, uv, n, null, { blend: blend || this.blendOf(tex) });
    }

    wallQuad(b, tex, ax, az, bx, bz, y0a, y0b, y1a, y1b, n) {
      const ws = H.Tex.worldSize[tex] || 2;
      const along = Math.abs(n.x) > 0.5 ? 'z' : 'x';
      const uvFn = p => [(along === 'x' ? p.x : p.z) / ws * (n.x > 0 || n.z < 0 ? -1 : 1), -p.y / ws];
      const top = Math.max(y1a, y1b), bot = Math.min(y0a, y0b);
      const segs = Math.max(1, Math.ceil((top - bot) / 3));
      for (let s = 0; s < segs; s++) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        const la = H.lerp(y0a, y1a, t0), lb = H.lerp(y0b, y1b, t0), ha = H.lerp(y0a, y1a, t1), hb = H.lerp(y0b, y1b, t1);
        this.faceQuad(b, tex, { x: ax, y: la, z: az }, { x: bx, y: lb, z: bz }, { x: bx, y: hb, z: bz }, { x: ax, y: ha, z: az }, n, uvFn);
      }
    }

    buildCells(w, b) {
      const up = { x: 0, y: 1, z: 0 }, down = { x: 0, y: -1, z: 0 };
      const floorAt = (e, px, pz) => (e.smooth ? w.cornerH(Math.round(px / CELL), Math.round(pz / CELL)) : e.f);
      for (let j = 0; j < w.h; j++) {
        for (let i = 0; i < w.w; i++) {
          const e = w.cell(i, j);
          if (e.solidVoid) continue;
          const x0 = i * CELL, z0 = j * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
          {
            if (e.smooth) {
              const h00 = w.cornerH(i, j), h10 = w.cornerH(i + 1, j), h01 = w.cornerH(i, j + 1), h11 = w.cornerH(i + 1, j + 1);
              const ws = H.Tex.worldSize[e.t] || 3;
              const p00 = { x: x0, y: h00, z: z0 }, p10 = { x: x1, y: h10, z: z0 }, p01 = { x: x0, y: h01, z: z1 }, p11 = { x: x1, y: h11, z: z1 };
              const nA = H.vnorm(H.vcross(H.vsub(p11, p00), H.vsub(p10, p00)));
              const nB = H.vnorm(H.vcross(H.vsub(p01, p00), H.vsub(p11, p00)));
              const uv = p => [p.x / ws, p.z / ws];
              b.tri(e.t, p00, p11, p10, [...uv(p00), ...uv(p11), ...uv(p10)], nA.y < 0 ? H.vscale(nA, -1) : nA, null, { blend: 'opaque' });
              b.tri(e.t, p00, p01, p11, [...uv(p00), ...uv(p01), ...uv(p11)], nB.y < 0 ? H.vscale(nB, -1) : nB, null, { blend: 'opaque' });
            } else if (!e.solidVoid || e.f < 59) {
              const ws = H.Tex.worldSize[e.t] || 2;
              this.faceQuad(b, e.t, { x: x0, y: e.f, z: z1 }, { x: x1, y: e.f, z: z1 }, { x: x1, y: e.f, z: z0 }, { x: x0, y: e.f, z: z0 }, up, p => [p.x / ws, p.z / ws], 'opaque');
            }
            if (e.c < INF) {
              const ws = H.Tex.worldSize[e.ct] || 2;
              this.faceQuad(b, e.ct, { x: x0, y: e.c, z: z0 }, { x: x1, y: e.c, z: z0 }, { x: x1, y: e.c, z: z1 }, { x: x0, y: e.c, z: z1 }, down, p => [p.x / ws, p.z / ws], 'opaque');
              const wr = H.Tex.worldSize[e.rt] || 2;
              this.faceQuad(b, e.rt, { x: x0, y: e.top, z: z1 }, { x: x1, y: e.top, z: z1 }, { x: x1, y: e.top, z: z0 }, { x: x0, y: e.top, z: z0 }, up, p => [p.x / wr, p.z / wr], 'opaque');
            }
          }
          const sides = [
            { di: 0, dj: -1, name: 'n', a: [x1, z0], bb: [x0, z0], n: { x: 0, y: 0, z: -1 } },
            { di: 1, dj: 0, name: 'e', a: [x1, z1], bb: [x1, z0], n: { x: 1, y: 0, z: 0 } },
            { di: 0, dj: 1, name: 's', a: [x0, z1], bb: [x1, z1], n: { x: 0, y: 0, z: 1 } },
            { di: -1, dj: 0, name: 'w', a: [x0, z0], bb: [x0, z1], n: { x: -1, y: 0, z: 0 } }
          ];
          for (const sd of sides) {
            const ni = i + sd.di, nj = j + sd.dj;
            const nb = w.cell(ni, nj);
            if (e.smooth && nb.smooth) continue;
            const nbOpen = [];
            const nbFloorA = floorAt(nb, sd.a[0], sd.a[1]), nbFloorB = floorAt(nb, sd.bb[0], sd.bb[1]);
            if (nb.c < INF) { nbOpen.push([nbFloorA, nbFloorB, nb.c, nb.c, true]); nbOpen.push([nb.top, nb.top, 1e4, 1e4, false]); }
            else nbOpen.push([nbFloorA, nbFloorB, 1e4, 1e4, false]);
            const mine = [];
            const myTopA = floorAt(e, sd.a[0], sd.a[1]), myTopB = floorAt(e, sd.bb[0], sd.bb[1]);
            mine.push({ lo: [-1e4, -1e4], hi: [myTopA, myTopB], tex: e.w, lower: true });
            if (e.c < INF) mine.push({ lo: [e.c, e.c], hi: [e.top, e.top], tex: e.w2 || e.w });
            for (const s of mine) {
              for (const o of nbOpen) {
                const la = Math.max(s.lo[0], o[0]), lb = Math.max(s.lo[1], o[1]);
                const ha = Math.min(s.hi[0], o[2]), hb = Math.min(s.hi[1], o[3]);
                if (ha - la < 0.005 && hb - lb < 0.005) continue;
                const cla = Math.min(la, ha), clb = Math.min(lb, hb);
                if (Math.max(ha, hb) > 5000) continue;
                const tex = o[4] && s.lower && !(e.c < INF) ? nb.w : s.tex;
                this.wallQuad(b, tex, sd.a[0], sd.a[1], sd.bb[0], sd.bb[1], cla, clb, Math.max(la, ha), Math.max(lb, hb), sd.n);
              }
            }
          }
        }
      }
    }

    boxFace(b, tex, pts, n, glow) {
      const ws = H.Tex.worldSize[tex] || 2;
      const ax = Math.abs(n.x) > 0.5 ? 'x' : Math.abs(n.y) > 0.5 ? 'y' : 'z';
      const uvFn = p => ax === 'y' ? [p.x / ws, p.z / ws] : ax === 'x' ? [p.z / ws * (n.x > 0 ? -1 : 1), -p.y / ws] : [p.x / ws * (n.z < 0 ? -1 : 1), -p.y / ws];
      if (glow) {
        const uv = [];
        for (const p of pts) { const q = uvFn(p); uv.push(q[0], q[1]); }
        b.quad(tex, pts[0], pts[1], pts[2], pts[3], uv, n, [1, 1, 1], { flat: true, blend: 'opaque' });
        return;
      }
      const [p0, p1, p2, p3] = pts;
      const lu = H.dist(p0, p1), lv = H.dist(p0, p3);
      const nu = Math.max(1, Math.ceil(lu / 2.5)), nv = Math.max(1, Math.ceil(lv / 2.5));
      const L = (a, c, t) => ({ x: H.lerp(a.x, c.x, t), y: H.lerp(a.y, c.y, t), z: H.lerp(a.z, c.z, t) });
      for (let v = 0; v < nv; v++) {
        for (let u = 0; u < nu; u++) {
          const P = (uu, vv) => L(L(p0, p1, uu), L(p3, p2, uu), vv);
          this.faceQuad(b, tex, P(u / nu, v / nv), P((u + 1) / nu, v / nv), P((u + 1) / nu, (v + 1) / nv), P(u / nu, (v + 1) / nv), n, uvFn);
        }
      }
    }

    buildBoxes(w, b) {
      for (const bx of w.boxes) {
        if (!bx.visible) continue;
        const { x1, y1, z1, x2, y2, z2 } = bx;
        const glow = bx.glow;
        this.boxFace(b, bx.side, [{ x: x2, y: y1, z: z1 }, { x: x1, y: y1, z: z1 }, { x: x1, y: y2, z: z1 }, { x: x2, y: y2, z: z1 }], { x: 0, y: 0, z: -1 }, glow);
        this.boxFace(b, bx.side, [{ x: x1, y: y1, z: z2 }, { x: x2, y: y1, z: z2 }, { x: x2, y: y2, z: z2 }, { x: x1, y: y2, z: z2 }], { x: 0, y: 0, z: 1 }, glow);
        this.boxFace(b, bx.side, [{ x: x2, y: y1, z: z2 }, { x: x2, y: y1, z: z1 }, { x: x2, y: y2, z: z1 }, { x: x2, y: y2, z: z2 }], { x: 1, y: 0, z: 0 }, glow);
        this.boxFace(b, bx.side, [{ x: x1, y: y1, z: z1 }, { x: x1, y: y1, z: z2 }, { x: x1, y: y2, z: z2 }, { x: x1, y: y2, z: z1 }], { x: -1, y: 0, z: 0 }, glow);
        this.boxFace(b, bx.top, [{ x: x1, y: y2, z: z2 }, { x: x2, y: y2, z: z2 }, { x: x2, y: y2, z: z1 }, { x: x1, y: y2, z: z1 }], { x: 0, y: 1, z: 0 }, glow);
        this.boxFace(b, bx.bottom, [{ x: x1, y: y1, z: z1 }, { x: x2, y: y1, z: z1 }, { x: x2, y: y1, z: z2 }, { x: x1, y: y1, z: z2 }], { x: 0, y: -1, z: 0 }, glow);
      }
    }

    buildRamps(w, b) {
      for (const r of w.ramps) {
        const h = (x, z) => w.rampH(r, x, z);
        if (r.stairs) {
          const along = r.dir[0];
          const len = along === 'x' ? r.x2 - r.x1 : r.z2 - r.z1;
          const rise = Math.abs(r.y1 - r.y0);
          const steps = Math.max(2, Math.round(rise / 0.22));
          for (let s = 0; s < steps; s++) {
            const t0 = s / steps, t1 = (s + 1) / steps;
            const inc = r.dir[1] === '+';
            const lo = inc ? t0 : 1 - t1, hi = inc ? t1 : 1 - t0;
            const top = r.y0 + (r.y1 - r.y0) * (s + 1) / steps;
            const bx = along === 'x' ? { x1: r.x1 + lo * len, x2: r.x1 + hi * len, z1: r.z1, z2: r.z2 } : { x1: r.x1, x2: r.x2, z1: r.z1 + lo * len, z2: r.z1 + hi * len };
            const tmp = { x1: bx.x1, y1: r.base, z1: bx.z1, x2: bx.x2, y2: top, z2: bx.z2, side: r.side, top: r.tex, bottom: r.side, visible: true };
            this.buildBoxes({ boxes: [tmp] }, b);
          }
          continue;
        }
        const P = (x, z) => ({ x, y: h(x, z), z });
        const pts = [P(r.x1, r.z2), P(r.x2, r.z2), P(r.x2, r.z1), P(r.x1, r.z1)];
        const n = w.rampNormal(r);
        const ws = H.Tex.worldSize[r.tex] || 2;
        this.faceQuad(b, r.tex, pts[0], pts[1], pts[2], pts[3], n, p => [p.x / ws, p.z / ws], 'opaque');
        const side = (ax, az, bx2, bz2, nn) => {
          const ya = h(ax, az), yb = h(bx2, bz2);
          if (Math.max(ya, yb) - r.base < 0.01) return;
          this.wallQuad(b, r.side, ax, az, bx2, bz2, r.base, r.base, ya, yb, nn);
        };
        side(r.x2, r.z1, r.x1, r.z1, { x: 0, y: 0, z: -1 });
        side(r.x1, r.z2, r.x2, r.z2, { x: 0, y: 0, z: 1 });
        side(r.x2, r.z2, r.x2, r.z1, { x: 1, y: 0, z: 0 });
        side(r.x1, r.z1, r.x1, r.z2, { x: -1, y: 0, z: 0 });
      }
    }

    buildWater(w, b) {
      const up = { x: 0, y: 1, z: 0 };
      for (let j = 0; j < w.h; j++) {
        for (let i = 0; i < w.w; i++) {
          const e = w.cells[j * w.w + i];
          if (!(e.wl > -INF) || e.wl <= (e.smooth ? Math.min(w.cornerH(i, j), w.cornerH(i + 1, j), w.cornerH(i, j + 1), w.cornerH(i + 1, j + 1)) : e.f)) continue;
          const x0 = i * CELL, z0 = j * CELL;
          const tex = e.wt === 'sludge' ? 'sludge' : 'water';
          const ws = 4;
          const P = (x, z) => ({ x, y: e.wl, z });
          const pts = [P(x0, z0 + CELL), P(x0 + CELL, z0 + CELL), P(x0 + CELL, z0), P(x0, z0)];
          const uv = [];
          for (const p of pts) uv.push(p.x / ws, p.z / ws);
          b.quad(tex, pts[0], pts[1], pts[2], pts[3], uv, up, null, { blend: 'water', alpha: e.wt === 'sludge' ? 0.9 : 0.72 });
        }
      }
    }

    buildSigns(w, b) {
      for (const s of w.signs) {
        const key = `sign:|${s.text}|${s.bg}|${s.fg}`;
        const f = H.forward(s.yaw), r = H.rightOf(s.yaw);
        const c = { x: s.x + f.x * 0.02, y: s.y, z: s.z + f.z * 0.02 };
        const hw = s.w / 2, hh = s.h / 2;
        const p0 = { x: c.x + r.x * hw, y: c.y - hh, z: c.z + r.z * hw };
        const p1 = { x: c.x - r.x * hw, y: c.y - hh, z: c.z - r.z * hw };
        const p2 = { x: c.x - r.x * hw, y: c.y + hh, z: c.z - r.z * hw };
        const p3 = { x: c.x + r.x * hw, y: c.y + hh, z: c.z + r.z * hw };
        if (s.glow) b.quad(key, p0, p1, p2, p3, [0, 1, 1, 1, 1, 0, 0, 0], f, [1, 1, 1], { flat: true, blend: 'opaque' });
        else b.quad(key, p0, p1, p2, p3, [0, 1, 1, 1, 1, 0, 0, 0], f, null, { blend: 'opaque' });
      }
    }

    resize(w, h) {
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    }

    useCommon(proj, view, cam, fog, fogCol) {
      const gl = this.gl, L = this.loc;
      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(L.uProj, false, proj);
      gl.uniformMatrix4fv(L.uView, false, view);
      gl.uniform3f(L.uCam, cam.x, cam.y, cam.z);
      gl.uniform2f(L.uFog, fog[0], fog[1]);
      gl.uniform3f(L.uFogCol, fogCol[0], fogCol[1], fogCol[2]);
      gl.uniform2f(L.uScroll, 0, 0);
      gl.uniform1f(L.uDither, this.opts.dither ? 1 : 0);
      gl.uniform1f(L.uBright, this.opts.bright);
      gl.uniform1i(L.uTex, 0);
    }

    bindBuf(buf) {
      const gl = this.gl, L = this.loc;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const S = STRIDE * 4;
      gl.enableVertexAttribArray(L.aPos); gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(L.aUV); gl.vertexAttribPointer(L.aUV, 2, gl.FLOAT, false, S, 12);
      gl.enableVertexAttribArray(L.aCol); gl.vertexAttribPointer(L.aCol, 4, gl.FLOAT, false, S, 20);
      gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, S, 36);
    }

    setBlend(mode) {
      const gl = this.gl, L = this.loc;
      gl.uniform1f(L.uAlphaTest, mode === 'alphatest' ? 1 : 0);
      gl.uniform1f(L.uFull, mode === 'add' ? 1 : 0);
      if (mode === 'opaque' || mode === 'alphatest') { gl.disable(gl.BLEND); gl.depthMask(true); }
      else if (mode === 'add') { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); }
      else { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
      if (mode === 'opaque') gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
    }

    uploadBatch(batch, buf) {
      const gl = this.gl;
      let total = 0;
      const groups = [];
      for (const g of batch.groups.values()) if (g.data.length) { groups.push(g); total += g.data.length; }
      const arr = new Float32Array(total);
      let off = 0;
      const ranges = [];
      for (const g of groups) { arr.set(g.data, off); ranges.push({ tex: g.tex, blend: g.blend, first: off / STRIDE, count: g.data.length / STRIDE }); off += g.data.length; }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      return ranges;
    }

    drawRanges(ranges, buf, modes, time) {
      const gl = this.gl;
      this.bindBuf(buf);
      for (const mode of modes) {
        const list = ranges.filter(r => r.blend === mode);
        if (!list.length) continue;
        this.setBlend(mode === 'water' ? 'alpha' : mode);
        for (const r of list) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.tex(r.tex));
          if (mode === 'water') gl.uniform2f(this.loc.uScroll, time * 0.03, time * 0.02);
          gl.drawArrays(gl.TRIANGLES, r.first, r.count);
          if (mode === 'water') gl.uniform2f(this.loc.uScroll, 0, 0);
          this.stats.draws++;
          this.stats.tris += r.count / 3;
        }
      }
    }

    drawStatic(modes, time) {
      const gl = this.gl;
      for (const mode of modes) {
        for (const g of this.static) {
          if (g.blend !== mode) continue;
          this.setBlend(mode === 'water' ? 'alpha' : mode);
          this.bindBuf(g.buf);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.tex(g.tex));
          gl.uniform2f(this.loc.uScroll, mode === 'water' ? time * 0.03 : 0, mode === 'water' ? time * 0.02 : 0);
          gl.drawArrays(gl.TRIANGLES, 0, g.count);
          this.stats.draws++;
          this.stats.tris += g.count / 3;
        }
      }
      gl.uniform2f(this.loc.uScroll, 0, 0);
    }

    drawSky(proj, cam, yaw, pitch, sky) {
      const gl = this.gl;
      const f = H.forward(yaw, pitch);
      const view = M4.lookAt({ x: 0, y: 0, z: 0 }, f, { x: 0, y: 1, z: 0 });
      this.useCommon(proj, view, { x: 0, y: 0, z: 0 }, [1e5, 1e6], [0, 0, 0]);
      gl.uniform1f(this.loc.uFlash, 0);
      for (let i = 0; i < 4; i++) gl.uniform4f(this.loc.uDyn[i], 0, 0, 0, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.uniform1f(this.loc.uAlphaTest, 0);
      gl.uniform1f(this.loc.uFull, 1);
      const S = 50;
      const faces = {
        north: [[-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S]],
        south: [[S, -S, S], [-S, -S, S], [-S, S, S], [S, S, S]],
        east: [[S, -S, -S], [S, -S, S], [S, S, S], [S, S, -S]],
        west: [[-S, -S, S], [-S, -S, -S], [-S, S, -S], [-S, S, S]],
        top: [[-S, S, -S], [S, S, -S], [S, S, S], [-S, S, S]],
        bottom: [[-S, -S, S], [S, -S, S], [S, -S, -S], [-S, -S, -S]]
      };
      for (const [name, q] of Object.entries(faces)) {
        const d = [];
        const uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
        for (const k of [0, 1, 2, 0, 2, 3]) d.push(q[k][0], q[k][1], q[k][2], uv[k][0], uv[k][1], 1, 1, 1, 1, 0, 1, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.DYNAMIC_DRAW);
        this.bindBuf(this.skyBuf);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex(`sky:${sky}:${name}`));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }

    render(game, view) {
      const gl = this.gl;
      const w = game.world;
      if (this.world !== w) this.loadWorld(w);
      this.stats.tris = 0;
      this.stats.draws = 0;
      const t = game.time;
      const aspect = this.canvas.width / this.canvas.height;
      const fov = (view.fov || this.opts.fov) * Math.PI / 180;
      const vfov = 2 * Math.atan(Math.tan(fov / 2) * 0.75);
      const proj = M4.perspective(Math.max(0.2, vfov), aspect, 0.05, 900);
      const eye = view.eye;
      const fwd = H.forward(view.yaw, view.pitch);
      const upv = { x: Math.sin(view.roll || 0) * Math.cos(view.yaw), y: 1, z: -Math.sin(view.roll || 0) * Math.sin(view.yaw) };
      const vm = M4.lookAt(eye, H.vadd(eye, fwd), upv);
      const right = H.vnorm(H.vcross(fwd, { x: 0, y: 1, z: 0 }));
      const up = H.vcross(right, fwd);
      const cam = { pos: eye, right, up, back: H.vscale(fwd, -1), fwd };
      const env = w.env;
      let fogCol = env.fog, fogR = [env.fogNear * this.opts.fogScale, env.fogFar * this.opts.fogScale];
      if (view.underwater) { fogCol = view.underwater === 'sludge' ? [0.25, 0.35, 0.08] : [0.12, 0.24, 0.26]; fogR = [0, 16]; }
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(fogCol[0], fogCol[1], fogCol[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      if (!view.underwater) this.drawSky(proj, eye, view.yaw, view.pitch, env.sky);
      this.useCommon(proj, vm, eye, fogR, fogCol);
      const L = this.loc;
      gl.uniform1f(L.uFlash, view.flashlight ? 1 : 0);
      gl.uniform3f(L.uFlashPos, eye.x, eye.y, eye.z);
      gl.uniform3f(L.uFlashDir, fwd.x, fwd.y, fwd.z);
      const dls = game.dynLights.slice().sort((a, b) => H.dist2(a.pos, eye) - H.dist2(b.pos, eye)).slice(0, 4);
      for (let i = 0; i < 4; i++) {
        const l = dls[i];
        if (l) { const k = l.t / l.t0; gl.uniform4f(L.uDyn[i], l.pos.x, l.pos.y, l.pos.z, l.radius); gl.uniform3f(L.uDynCol[i], l.col[0] * k, l.col[1] * k, l.col[2] * k); }
        else gl.uniform4f(L.uDyn[i], 0, 0, 0, 0);
      }
      this.drawStatic(['opaque', 'alphatest'], t);
      const b = this.batch;
      b.reset();
      this.fillDynamic(game, b, cam, view);
      const ranges = this.uploadBatch(b, this.dynBuf);
      this.drawRanges(ranges, this.dynBuf, ['opaque', 'alphatest'], t);
      this.drawDecals(game, cam);
      this.drawStatic(['water', 'alpha'], t);
      this.drawRanges(ranges, this.dynBuf, ['alpha', 'add'], t);
      if (view.viewmodel) this.drawViewModel(game, view, aspect);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    entLight(w, x, y, z) {
      const l = w.lightAt(x, y, z);
      return l;
    }

    lightFnFor(w, x, y, z) {
      const base = this.entLight(w, x, y + 1, z);
      const key = H.vnorm({ x: 0.4, y: 0.8, z: 0.3 });
      return (p, n) => {
        const d = Math.max(0, n.x * key.x + n.y * key.y + n.z * key.z);
        const k = 0.55 + 0.45 * d + 0.1 * n.y;
        return [base[0] * k * 1.1, base[1] * k * 1.1, base[2] * k * 1.1];
      };
    }

    fillDynamic(game, b, cam, view) {
      const w = game.world, t = game.time;
      const far = (w.env.fogFar || 140) * this.opts.fogScale + 10;
      const vis = p => {
        const dx = p.x - cam.pos.x, dy = p.y - cam.pos.y, dz = p.z - cam.pos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > far * far) return false;
        if (d2 < 36) return true;
        return dx * cam.fwd.x + dy * cam.fwd.y + dz * cam.fwd.z > -6;
      };
      for (const n of game.npcs) {
        if (n.removed || n.crashed) continue;
        if (!vis(n.pos) && !(n.def.height > 5)) continue;
        b.lightFn = this.lightFnFor(w, n.pos.x, n.pos.y + (n.def.flying ? 0 : 0), n.pos.z);
        H.Models.drawNpc(b, n, t);
      }
      for (const p of game.props) {
        if (p.dead || !vis(p.pos)) continue;
        b.lightFn = this.lightFnFor(w, p.pos.x, p.pos.y, p.pos.z);
        H.Models.drawProp(b, p, t);
      }
      for (const it of game.items) {
        if (!vis(it.pos)) continue;
        b.lightFn = this.lightFnFor(w, it.pos.x, it.pos.y, it.pos.z);
        H.Models.drawItem(b, it, t);
      }
      for (const d of game.doors) {
        const c = game.doorCenter(d);
        b.lightFn = this.lightFnFor(w, c.x, d.base[1], c.z);
        H.Models.drawDoor(b, d);
      }
      for (const c of game.chargers) { b.lightFn = this.lightFnFor(w, c.pos.x, c.pos.y - 1, c.pos.z); H.Models.drawCharger(b, c); }
      for (const bt of game.buttons) { b.lightFn = this.lightFnFor(w, bt.pos.x, bt.pos.y - 1, bt.pos.z); H.Models.drawButton(b, bt); }
      for (const s of game.surfaces) { b.lightFn = this.lightFnFor(w, s.x, s.yPivot || s.yEnd || 0, s.z); H.Models.drawSurface(b, s); }
      for (const h of game.hazards) { b.lightFn = this.lightFnFor(w, (h.box.x1 + h.box.x2) / 2, h.box.y1, (h.box.z1 + h.box.z2) / 2); H.Models.drawHazard(b, h, t); }
      for (const v of game.vehicles) {
        const fp = game.player.vehicle === v;
        b.lightFn = this.lightFnFor(w, v.pos.x, v.pos.y, v.pos.z);
        H.Models.drawVehicle(b, v, t, fp);
      }
      for (const md of this.animModels) {
        b.lightFn = this.lightFnFor(w, md.x, md.y, md.z);
        H.Models.drawStatic(b, md, t);
      }
      b.lightFn = null;
      for (const q of game.projectiles) H.Models.drawProjectile(b, q, t, cam);
      for (const p of game.fx.parts) {
        if (!vis(p.pos)) continue;
        const k = 1 - p.t / p.life;
        const a = p.alpha * (p.blend === 'add' ? k : Math.min(1, k * 2));
        if (p.blend === 'solid') {
          const base = w.lightAt(p.pos.x, p.pos.y, p.pos.z);
          const s = p.size;
          b.lightFn = null;
          b.box(M4.trs(p.pos.x, p.pos.y, p.pos.z, p.t * 5, p.t * 3, 0), -s, -s * 0.5, -s, s, s * 0.5, s, 'white', { col: [p.col[0] * base[0], p.col[1] * base[1], p.col[2] * base[2]], flat: true });
          continue;
        }
        const col = p.blend === 'add' ? p.col : (() => { const l = w.lightAt(p.pos.x, p.pos.y, p.pos.z); return [p.col[0] * (0.4 + l[0] * 0.7), p.col[1] * (0.4 + l[1] * 0.7), p.col[2] * (0.4 + l[2] * 0.7)]; })();
        if (p.streak) b.streak(p.pos, p.vel, p.size, 'beam', col, 'add', cam, a);
        else b.billboard(p.pos, p.size, p.blend === 'add' ? 'flare' : 'puff', col, p.blend === 'add' ? 'add' : 'alpha', cam, (p.rot || 0) + p.t * 0.5, a);
      }
      for (const bm of game.fx.beams) {
        const k = 1 - bm.t / bm.life;
        if (bm.jag) {
          let prev = bm.a;
          const n = 5;
          for (let i = 1; i <= n; i++) {
            const tt = i / n;
            const pt = i === n ? bm.b : { x: H.lerp(bm.a.x, bm.b.x, tt) + (Math.random() - 0.5) * 0.25, y: H.lerp(bm.a.y, bm.b.y, tt) + (Math.random() - 0.5) * 0.25, z: H.lerp(bm.a.z, bm.b.z, tt) + (Math.random() - 0.5) * 0.25 };
            b.beam(prev, pt, bm.width, 'beam', bm.col, 'add', cam, k);
            prev = pt;
          }
        } else {
          const d = H.vsub(bm.b, bm.a);
          const len = H.vlen(d) || 1;
          const u = H.vscale(d, 1 / len);
          const head = Math.min(len, len * (bm.t / bm.life) + 3);
          const tail = Math.max(0, head - Math.min(4, len));
          b.beam(H.vadd(bm.a, u, tail), H.vadd(bm.a, u, head), bm.width, 'beam', bm.col, 'add', cam, 0.8);
        }
      }
      const pl = game.player;
      if (pl.cur === 'rpg' && pl.laser && !pl.dead && !pl.vehicle && view.laserPoint) b.billboard(view.laserPoint, 0.12, 'flare', [1, 0.15, 0.1], 'add', cam);
      for (const hl of game.chargers) if (hl.active) b.billboard({ x: hl.pos.x, y: hl.pos.y, z: hl.pos.z }, 0.2, 'flare', hl.type === 'health' ? [0.4, 1, 0.5] : [1, 0.7, 0.3], 'add', cam);
    }

    drawDecals(game, cam) {
      const gl = this.gl;
      const fx = game.fx;
      if (fx.decalVersion !== this.decalVersion || this.decalGame !== game) {
        this.decalVersion = fx.decalVersion;
        this.decalGame = game;
        const b = new H.Batch();
        for (const d of fx.decals) {
          const n = d.n;
          const a = Math.abs(n.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
          let u = H.vnorm(H.vcross(a, n));
          let v = H.vcross(n, u);
          const cr = Math.cos(d.rot), sr = Math.sin(d.rot);
          const u2 = H.vadd(H.vscale(u, cr), v, sr), v2 = H.vadd(H.vscale(v, cr), u, -sr);
          u = H.vscale(u2, d.size); v = H.vscale(v2, d.size);
          const p = d.pos;
          const q0 = H.vsub(H.vsub(p, u), v), q1 = H.vsub(H.vadd(p, u), v), q2 = H.vadd(H.vadd(p, u), v), q3 = H.vadd(H.vsub(p, u), v);
          const l = game.world.lightAt(p.x, p.y, p.z);
          b.quad('decal_' + d.kind, q0, q1, q2, q3, [0, 1, 1, 1, 1, 0, 0, 0], n, [Math.min(1, l[0] + 0.3), Math.min(1, l[1] + 0.3), Math.min(1, l[2] + 0.3)], { flat: true, blend: 'alpha' });
        }
        this.decalRanges = this.uploadBatch(b, this.decalBuf);
      }
      if (!this.decalRanges || !this.decalRanges.length) return;
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -2);
      this.drawRanges(this.decalRanges, this.decalBuf, ['alpha'], game.time);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    drawViewModel(game, view, aspect) {
      const gl = this.gl;
      const pl = game.player;
      if (!pl.cur || pl.dead || pl.vehicle || view.zoom) return;
      const b = this.vmBatch;
      b.reset();
      const eye = view.eye;
      const l = game.world.lightAt(eye.x, eye.y - 0.3, eye.z);
      const key = H.vnorm({ x: 0.3, y: 0.8, z: 0.5 });
      b.lightFn = (p, n) => { const d = Math.max(0, n.x * key.x + n.y * key.y + n.z * key.z); const k = 0.55 + 0.5 * d; return [Math.max(0.24, l[0]) * k * 1.15, Math.max(0.24, l[1]) * k * 1.15, Math.max(0.26, l[2]) * k * 1.15]; };
      H.Models.viewModel(b, pl.cur, view.vmAnim, pl, game.time);
      const ranges = this.uploadBatch(b, this.vmBuf);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const proj = M4.perspective(54 * Math.PI / 180, aspect, 0.01, 10);
      this.useCommon(proj, M4.identity(), { x: 0, y: 0, z: 0 }, [100, 200], [0, 0, 0]);
      gl.uniform1f(this.loc.uFlash, 0);
      for (let i = 0; i < 4; i++) gl.uniform4f(this.loc.uDyn[i], 0, 0, 0, 0);
      this.drawRanges(ranges, this.vmBuf, ['opaque', 'alphatest', 'alpha', 'add'], game.time);
    }

    destroy() {
      const gl = this.gl;
      for (const t of this.textures.values()) gl.deleteTexture(t);
      for (const g of this.static) gl.deleteBuffer(g.buf);
      this.textures.clear();
      this.static = [];
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  H.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
