(function (S) {
  'use strict';
  const { Geo, OBJECTS, TER, footprint, DX, DY, WALL_H, CUT_H, col, mulCol, GEO_STRIDE } = S;
  const CH = 16;
  const ELEV = Math.PI / 6;
  const ZOOMS = [45.25, 22.6, 11.3, 5.2];

  const VS = `
attribute vec3 aP; attribute vec3 aN; attribute vec4 aC; attribute vec2 aT;
uniform mat4 uVP; uniform vec3 uSun; uniform vec3 uSunC; uniform vec3 uAmb; uniform vec2 uWorld;
varying vec3 vA; varying vec3 vL; varying vec2 vT; varying vec2 vM; varying float vE;
void main() {
  vec3 n = normalize(aN + vec3(0.0, 0.0, 0.0001));
  float d = max(dot(n, uSun), 0.0);
  vL = uAmb * (0.8 + 0.2 * abs(n.z)) + uSunC * d;
  vA = aC.rgb; vE = aC.a; vT = aT;
  vM = (aP.xy + n.xy * 0.45) / uWorld;
  gl_Position = uVP * vec4(aP, 1.0);
}`;
  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform sampler2D uLM; uniform float uLamp; uniform float uAlpha; uniform vec3 uTint; uniform float uMode;
varying vec3 vA; varying vec3 vL; varying vec2 vT; varying vec2 vM; varying float vE;
void main() {
  vec4 t = texture2D(uTex, vT);
  if (t.a < 0.35) discard;
  vec3 lamp = texture2D(uLM, vM).rgb * uLamp;
  vec3 base = t.rgb * vA * uTint;
  if (uMode > 1.5) { gl_FragColor = vec4(base, t.a * vE * uAlpha); return; }
  vec3 c = base * (vL + lamp);
  if (uMode > 0.5) { gl_FragColor = vec4(c, t.a * vE * uAlpha); return; }
  c = mix(c, base * (1.05 + lamp * 0.2), clamp(vE, 0.0, 1.0));
  gl_FragColor = vec4(c, uAlpha);
}`;
  const WVS = `
attribute vec3 aP; attribute float aD;
uniform mat4 uVP;
varying vec2 vW; varying float vD;
void main() { vW = aP.xy; vD = aD; gl_Position = uVP * vec4(aP, 1.0); }`;
  const WFS = `
precision mediump float;
uniform float uTime; uniform vec3 uAmb; uniform vec3 uSunC; uniform float uLamp; uniform float uPond;
varying vec2 vW; varying float vD;
void main() {
  vec3 deep = mix(vec3(0.10, 0.32, 0.52), vec3(0.18, 0.38, 0.30), clamp(uPond, 0.0, 1.0));
  vec3 shallow = mix(vec3(0.30, 0.62, 0.72), vec3(0.34, 0.55, 0.42), clamp(uPond, 0.0, 1.0));
  if (uPond > 1.5) { deep = vec3(0.10, 0.48, 0.76); shallow = vec3(0.38, 0.80, 0.94); }
  vec3 c = mix(shallow, deep, clamp(vD, 0.0, 1.0));
  float w = sin(vW.x * 2.1 + uTime * 1.3) * sin(vW.y * 1.7 - uTime * 1.1) + sin((vW.x + vW.y) * 3.3 + uTime * 2.0) * 0.5;
  c += vec3(0.12, 0.14, 0.14) * smoothstep(0.8, 1.4, w);
  float foam = (1.0 - smoothstep(0.0, 0.18, vD)) * (0.6 + 0.4 * sin(uTime * 2.0 + vW.x * 4.0 + vW.y * 3.0)) * (uPond > 1.5 ? 0.2 : 1.0);
  c = mix(c, vec3(0.92, 0.95, 0.95), foam * 0.7);
  vec3 light = uAmb + uSunC * 0.7 + vec3(0.15, 0.12, 0.08) * uLamp * 0.3;
  gl_FragColor = vec4(c * light, 1.0);
}`;

  function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  class Camera {
    constructor() { this.tx = 80; this.ty = 80; this.tz = 0; this.rot = 0; this.zoom = 0; this.s = ZOOMS[0]; this.w = 800; this.h = 600; this.update(); }
    setZoom(z) { this.zoom = Math.max(0, Math.min(ZOOMS.length - 1, z)); }
    update() {
      const th = Math.PI / 4 + this.rot * Math.PI / 2;
      const cf = Math.cos(ELEV), sf = Math.sin(ELEV);
      this.F = [-cf * Math.cos(th), -cf * Math.sin(th), -sf];
      const F = this.F;
      let R = [-F[1], F[0], 0];
      const rl = Math.hypot(R[0], R[1]);
      R = [R[0] / rl, R[1] / rl, 0];
      this.R = R;
      this.U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
      if (this.U[2] < 0) this.U = this.U.map(v => -v);
      let tx = this.tx, ty = this.ty;
      const sx0 = (tx * R[0] + ty * R[1]) * this.s, sy0 = (tx * this.U[0] + ty * this.U[1]) * this.s;
      const dx = Math.round(sx0) - sx0, dy = Math.round(sy0) - sy0;
      this.px = tx + (R[0] * dx + this.U[0] * dy) / this.s;
      this.py = ty + (R[1] * dx + this.U[1] * dy) / this.s;
      const s = this.s, w = this.w, h = this.h, U = this.U, D = 420;
      const T = [this.px, this.py, this.tz || 0];
      const dotR = T[0] * R[0] + T[1] * R[1], dotU = T[0] * U[0] + T[1] * U[1] + T[2] * U[2], dotF = T[0] * F[0] + T[1] * F[1] + T[2] * F[2];
      const ax = 2 * s / w, ay = 2 * s / h;
      this.vp = new Float32Array([
        R[0] * ax, U[0] * ay, F[0] / D, 0,
        R[1] * ax, U[1] * ay, F[1] / D, 0,
        R[2] * ax, U[2] * ay, F[2] / D, 0,
        -dotR * ax, -dotU * ay, -dotF / D, 1
      ]);
    }
    toScreen(x, y, z) {
      const dx = x - this.px, dy = y - this.py, dz = (z || 0) - (this.tz || 0);
      const R = this.R, U = this.U;
      return [this.w / 2 + (dx * R[0] + dy * R[1] + dz * R[2]) * this.s, this.h / 2 - (dx * U[0] + dy * U[1] + dz * U[2]) * this.s];
    }
    ray(mx, my) {
      const R = this.R, U = this.U, F = this.F;
      const ox = (mx - this.w / 2) / this.s, oy = (this.h / 2 - my) / this.s;
      const O = [this.px + R[0] * ox + U[0] * oy - F[0] * 300, this.py + R[1] * ox + U[1] * oy - F[1] * 300, (this.tz || 0) + R[2] * ox + U[2] * oy - F[2] * 300];
      return { o: O, d: F };
    }
    ground(mx, my, z) {
      const r = this.ray(mx, my);
      const t = ((z || 0) - r.o[2]) / r.d[2];
      return [r.o[0] + r.d[0] * t, r.o[1] + r.d[1] * t];
    }
    depth(x, y, z) { return (x - this.px) * this.F[0] + (y - this.py) * this.F[1] + ((z || 0) - (this.tz || 0)) * this.F[2]; }
  }

  class Renderer {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.cam = new Camera();
      this.prog = this.program(VS, FS, ['aP', 'aN', 'aC', 'aT']);
      this.wprog = this.program(WVS, WFS, ['aP', 'aD']);
      this.atlas = S.buildAtlas(new S.Atlas());
      this.tex = this.makeTexture(this.atlas.canvas);
      this.world = game.world;
      this.W = this.world.W; this.H = this.world.H;
      this.lm = new Uint8Array(this.W * this.H * 4);
      this.lmTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.lmTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.W, this.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.lm);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.chunks = new Map();
      this.objChunks = new Map();
      this.bigObjs = new Map();
      this.lotWalls = new Map();
      this.roofs = new Map();
      this.water = null;
      this.dyn = gl.createBuffer();
      this.dynT = gl.createBuffer();
      this.floorVer = -1; this.wallKey = ''; this.lightKey = ''; this.objVer = -1;
      this.wallMode = 'cut';
      this.viewLv = 0;
      this.showCeil = false;
      this.showRoofs = false;
      this.flash = 0;
      this.flashT = 4;
      this.flashes = 0;
      this.focusLot = -1;
      this.time = 0;
      this.heights = {};
      this.hover = null;
      this.ghost = null;
      this.extra = [];
      this.fade = new Set();
      this.stats = { tris: 0, draws: 0 };
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    program(vs, fs, attrs) {
      const gl = this.gl;
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
      return { p, u };
    }
    makeTexture(canvas) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    upload(geo, old) {
      const gl = this.gl;
      const arr = geo instanceof Float32Array ? geo : geo.toArray();
      const buf = old && old.buf ? old.buf : gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return { buf, count: arr.length / GEO_STRIDE };
    }
    free(b) { if (b && b.buf) this.gl.deleteBuffer(b.buf); }

    bindMain(buf) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const st = GEO_STRIDE * 4;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, st, 24);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, st, 40);
    }
    draw(b, alpha, mode, tint) {
      if (!b || !b.count) return;
      const gl = this.gl, u = this.prog.u;
      this.bindMain(b.buf);
      gl.uniform1f(u.uAlpha, alpha === undefined ? 1 : alpha);
      gl.uniform1f(u.uMode, mode || 0);
      gl.uniform3fv(u.uTint, tint || [1, 1, 1]);
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
      this.stats.draws++; this.stats.tris += b.count / 3;
    }
    drawArray(arr, alpha, mode, tint, buf) {
      if (!arr.length) return;
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf || this.dyn);
      gl.bufferData(gl.ARRAY_BUFFER, arr instanceof Float32Array ? arr : new Float32Array(arr), gl.DYNAMIC_DRAW);
      this.draw({ buf: buf || this.dyn, count: arr.length / GEO_STRIDE }, alpha, mode, tint);
    }

    heightOf(type) {
      if (this.heights[type] !== undefined) return this.heights[type];
      const g = new Geo(null);
      const def = OBJECTS[type];
      let h = 1;
      try { S.buildObject(g, { t: type, col: def.col, st: {}, id: 1 }, def, {}); h = g.maxZ > -1e8 ? g.maxZ : 1; } catch (e) { h = 1; }
      this.heights[type] = Math.max(0.1, h);
      return this.heights[type];
    }

    lightParams() {
      const h = S.hourOf(this.game.t);
      const day = { amb: [0.56, 0.56, 0.6], sun: [0.6, 0.58, 0.52], sky: [0.34, 0.5, 0.3] };
      const dusk = { amb: [0.44, 0.36, 0.42], sun: [0.62, 0.38, 0.26], sky: [0.3, 0.28, 0.3] };
      const night = { amb: [0.2, 0.22, 0.36], sun: [0.06, 0.07, 0.14], sky: [0.06, 0.08, 0.14] };
      const dawn = { amb: [0.4, 0.38, 0.46], sun: [0.52, 0.42, 0.36], sky: [0.24, 0.26, 0.32] };
      const K = [[0, night], [5, night], [6.5, dawn], [8, day], [17.5, day], [19.5, dusk], [21, night], [24, night]];
      let a = K[0], b = K[1];
      for (let i = 0; i < K.length - 1; i++) if (h >= K[i][0] && h <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; break; }
      const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
      const lamp = h >= 19 || h < 6 ? Math.min(1, (h >= 19 ? h - 19 : 1) * 1.2) : h < 7 ? 1 - (h - 6) : 0;
      const res = { amb: lerp3(a[1].amb, b[1].amb, t), sun: lerp3(a[1].sun, b[1].sun, t), sky: lerp3(a[1].sky, b[1].sky, t), lamp: Math.max(0, Math.min(1, lamp)), night: h >= 19.5 || h < 6.5 };
      const wv = this.weatherVis();
      res.sun = res.sun.map(v => v * wv.sun);
      res.amb = res.amb.map(v => v * wv.amb);
      const lum = (res.sky[0] + res.sky[1] + res.sky[2]) / 3 * 0.8 + 0.04;
      res.sky = lerp3(res.sky, [lum * 0.92, lum * 0.95, lum * 1.05], wv.sky);
      if (this.flash > 0) { const f = this.flash; res.amb = res.amb.map(v => v + 0.85 * f); res.sky = lerp3(res.sky, [0.86, 0.88, 0.98], f * 0.85); }
      res.wet = wv.wet; res.rain = wv.rain; res.storm = wv.storm;
      return res;
    }

    weatherVis() {
      const P = {
        clear: { sun: 1, amb: 1, sky: 0, wet: 0, rain: 0, storm: 0 },
        cloudy: { sun: 0.45, amb: 0.93, sky: 0.45, wet: 0, rain: 0, storm: 0 },
        rain: { sun: 0.28, amb: 0.82, sky: 0.65, wet: 1, rain: 0.6, storm: 0 },
        storm: { sun: 0.14, amb: 0.68, sky: 0.8, wet: 1, rain: 1, storm: 1 }
      };
      const W = this.game.weather;
      if (!W) return P.clear;
      const a = P[W.prev] || P[W.kind] || P.clear, b = P[W.kind] || P.clear;
      const k = Math.max(0, Math.min(1, (this.game.t - (W.since || 0)) / 30));
      const out = {};
      for (const key of Object.keys(b)) out[key] = a[key] + (b[key] - a[key]) * k;
      return out;
    }
    hiddenLv(lv, lot) { return lot === this.focusLot && (lv || 0) > this.viewLv && !this.fullView; }

    tileCell(x, y) {
      const w = this.world, i = w.idx(x, y);
      const f = w.floor[i];
      if (f) return 'fl_' + S.FLOOR_LIST[f];
      const t = w.terrain[i];
      const hsh = S.hash2(x, y, 5);
      switch (t) {
        case TER.grass: return 'grass' + ((hsh * 4) | 0);
        case TER.grass2: return 'grass2_' + ((hsh * 2) | 0);
        case TER.dirt: return 'dirt';
        case TER.flowers: return 'flowers';
        case TER.gravel: return 'gravel';
        case TER.sand: return 'sand';
        case TER.walk: return 'walk';
        case TER.plaza: return 'plaza';
        case TER.path: return 'path';
        case TER.rock: return 'rock';
        case TER.bridge: return w.road[i] && (w.road[i] & 3) ? this.roadCell(x, y) : 'bridge';
        case TER.road: return this.roadCell(x, y);
      }
      return 'grass0';
    }
    roadCell(x, y) {
      const w = this.world;
      const r = w.road[w.idx(x, y)];
      const dir = r & 3, lane = r >> 2;
      const isX = (xx, yy) => w.inb(xx, yy) && (w.road[w.idx(xx, yy)] & 3) === 3;
      if (dir === 1) { if (isX(x - 1, y) || isX(x + 1, y)) return 'cross_h'; return 'road_h' + Math.max(0, Math.min(3, lane)); }
      if (dir === 2) { if (isX(x, y - 1) || isX(x, y + 1)) return 'cross_v'; return 'road_v' + Math.max(0, Math.min(3, lane)); }
      return 'road';
    }
    tileZ(x, y) {
      const w = this.world;
      if (!w.inb(x, y)) return 0;
      const i = w.idx(x, y);
      if (w.floor[i]) return 0.03;
      const t = w.terrain[i];
      if (t === TER.walk) return 0.06;
      if (t === TER.plaza) return 0.03;
      if (t === TER.bridge) return 0.3;
      if (t === TER.sea || t === TER.pond || t === TER.pool) return -0.5;
      return 0;
    }

    buildChunk(cx, cy) {
      const w = this.world, A = this.atlas;
      const g = new Geo(A);
      const x0 = cx * CH, y0 = cy * CH;
      const tint = (x, y, k) => { const n = S.hash2(x, y, 9) * 0.1 - 0.05; return [k * (1 + n), k * (1 + n * 0.8), k * (1 + n * 0.6)]; };
      for (let y = y0; y < Math.min(this.H, y0 + CH); y++) for (let x = x0; x < Math.min(this.W, x0 + CH); x++) {
        const i = w.idx(x, y);
        const t = w.terrain[i];
        if (t === TER.sea || t === TER.pond || t === TER.pool) continue;
        const z = this.tileZ(x, y);
        const cell = A.get(this.tileCell(x, y));
        const grassy = !w.floor[i] && (t === TER.grass || t === TER.grass2 || t === TER.flowers);
        const vc = (vx, vy) => grassy ? tint(vx, vy, 1) : [1, 1, 1];
        g.vert(x, y, z, 0, 0, 1, vc(x, y), 0, cell.u0, cell.v0);
        g.vert(x + 1, y, z, 0, 0, 1, vc(x + 1, y), 0, cell.u1, cell.v0);
        g.vert(x + 1, y + 1, z, 0, 0, 1, vc(x + 1, y + 1), 0, cell.u1, cell.v1);
        g.vert(x, y, z, 0, 0, 1, vc(x, y), 0, cell.u0, cell.v0);
        g.vert(x + 1, y + 1, z, 0, 0, 1, vc(x + 1, y + 1), 0, cell.u1, cell.v1);
        g.vert(x, y + 1, z, 0, 0, 1, vc(x, y + 1), 0, cell.u0, cell.v1);
        for (let k = 0; k < 4; k++) {
          const nx = x + DX[k], ny = y + DY[k];
          const nz = this.tileZ(nx, ny);
          if (nz >= z - 0.001) continue;
          const nt = w.inb(nx, ny) ? w.terrain[w.idx(nx, ny)] : TER.grass;
          const water = nt === TER.sea || nt === TER.pond;
          const pool = nt === TER.pool;
          const ex = [[x, y, x + 1, y], [x + 1, y, x + 1, y + 1], [x + 1, y + 1, x, y + 1], [x, y + 1, x, y]][k];
          const c = pool ? [0.86, 0.93, 0.98] : t === TER.bridge ? [0.5, 0.4, 0.3] : t === TER.walk ? [0.62, 0.6, 0.56] : water ? [0.52, 0.42, 0.3] : [0.45, 0.36, 0.24];
          const bottom = water || pool ? -0.6 : nz;
          g.quad([ex[0], ex[1], bottom], [ex[2], ex[3], bottom], [ex[2], ex[3], z], [ex[0], ex[1], z], c, { cell: pool ? 'fl_tile_white' : t === TER.bridge ? 'bridge' : water ? 'shore' : null, n: [DX[k], DY[k], 0] });
          if (pool) {
            let rx0 = Math.min(ex[0], ex[2]), rx1 = Math.max(ex[0], ex[2]), ry0 = Math.min(ex[1], ex[3]), ry1 = Math.max(ex[1], ex[3]);
            if (DX[k] === 1) rx0 = rx1 - 0.16; else if (DX[k] === -1) rx1 = rx0 + 0.16;
            if (DY[k] === 1) ry0 = ry1 - 0.16; else if (DY[k] === -1) ry1 = ry0 + 0.16;
            g.box(rx0, ry0, z, rx1, ry1, z + 0.07, [0.94, 0.92, 0.87]);
          }
          if (t === TER.bridge && water) {
            const mx = (ex[0] + ex[2]) / 2, my = (ex[1] + ex[3]) / 2;
            g.box(Math.min(ex[0], ex[2]) - 0.02, Math.min(ex[1], ex[3]) - 0.02, z, Math.max(ex[0], ex[2]) + 0.02, Math.max(ex[1], ex[3]) + 0.02, z + 0.05, [0.35, 0.33, 0.32]);
            g.cyl(mx, my, z, z + 0.7, 0.025, 0.025, 4, [0.3, 0.3, 0.32]);
            g.beam([ex[0], ex[1], z + 0.68], [ex[2], ex[3], z + 0.68], 0.025, [0.72, 0.2, 0.18]);
          }
        }
        if (t === TER.bridge && (x % 16 === 0) && w.road[i] && ((w.road[i] >> 2) === 0 || (w.road[i] >> 2) === 3)) {
          const side = (w.road[i] >> 2) === 0 ? -0.35 : 0.35;
          g.cyl(x + 0.5, y + 0.5 + side, -0.6, 7, 0.22, 0.18, 6, [0.72, 0.22, 0.18]);
        }
      }
      return g;
    }

    buildWater() {
      const w = this.world;
      const W = this.W, H = this.H;
      const dist = new Float32Array(W * H).fill(9);
      const q = [];
      for (let i = 0; i < W * H; i++) { const t = w.terrain[i]; if (t !== TER.sea && t !== TER.pond && t !== TER.pool) { dist[i] = 0; q.push(i); } }
      for (let h = 0; h < q.length; h++) {
        const c = q[h], x = c % W, y = (c / W) | 0;
        for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const ni = ny * W + nx; if (dist[ni] > dist[c] + 1) { dist[ni] = dist[c] + 1; if (dist[ni] < 6) q.push(ni); } }
      }
      const vd = (x, y) => { let m = 9; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) m = Math.min(m, dist[yy * W + xx]); } return Math.min(1, (m - 0.5) / 4); };
      const sea = [], pond = [], pool = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const t = w.terrain[y * W + x];
        if (t !== TER.sea && t !== TER.pond && t !== TER.pool && !(t === TER.bridge && S.isSea(x, y))) continue;
        const arr = t === TER.pool ? pool : t === TER.pond ? pond : sea;
        const z = -0.2;
        const pts = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y], [x + 1, y + 1], [x, y + 1]];
        for (const [px, py] of pts) arr.push(px, py, z, vd(px, py));
      }
      const gl = this.gl;
      const mk = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); return { buf: b, count: a.length / 4 }; };
      this.water = { sea: mk(sea), pond: mk(pond), pool: mk(pool) };
    }

    resetWater() {
      if (this.water) for (const k of Object.keys(this.water)) this.gl.deleteBuffer(this.water[k].buf);
      this.water = null;
    }

    objEnv(ob, night) {
      const def = OBJECTS[ob.t];
      const on = def.light ? (def.outdoorLight ? night : night && !ob.st.off) : false;
      return { lampOn: on, night, maxLv: ob.lot === this.focusLot && !this.fullView ? this.viewLv : 99 };
    }
    placeGeo(g, ob, env) {
      const def = OBJECTS[ob.t];
      const f = footprint(def, ob.r);
      const cx = ob.x + f[0] / 2, cy = ob.y + f[1] / 2;
      const sd = S.side(ob.r), fw = S.fwd(ob.r);
      const lv = ob.lv || 0;
      let cz = 0;
      if (ob.layer === 'surf') { const base = this.world.objAt(ob.x, ob.y, 'occ', lv); cz = base ? (OBJECTS[base.t].surface || 0.75) : 0.75; }
      if (ob.layer === 'occ' || ob.layer === 'rug' || ob.layer === 'ground') cz = lv ? 0.03 : Math.max(0, this.tileZ(ob.x, ob.y));
      if (def.water) cz = -0.25;
      cz += lv * WALL_H;
      g.setTransform(cx, cy, cz, sd[0], sd[1], fw[0], fw[1], 1);
      const h = S.buildObject(g, ob, def, env);
      g.clearTransform();
      return h;
    }
    isBig(ob) { const d = OBJECTS[ob.t]; return !!(d.tree || d.rabbit || ob.t === 'lighthouse'); }

    buildObjChunks(night) {
      const w = this.world;
      const lists = new Map();
      for (const ob of w.objects.values()) {
        if (ob.t === 'fire' || ob.held) continue;
        if (this.hiddenLv(ob.lv, ob.lot)) continue;
        if (ob.layer === 'ceil' && !this.showCeil && ob.lot === this.focusLot && this.wallMode !== 'up' && (ob.lv || 0) === this.viewLv) continue;
        if (this.isBig(ob)) continue;
        const key = Math.floor(ob.x / CH) + ',' + Math.floor(ob.y / CH);
        if (!lists.has(key)) lists.set(key, []);
        lists.get(key).push(ob);
      }
      const seen = new Set();
      for (const [key, list] of lists) {
        seen.add(key);
        let sig = '';
        for (const ob of list) {
          const d = OBJECTS[ob.t];
          sig += ob.id + ':' + ob.t + ':' + ob.x + ':' + ob.y + ':' + ob.r + ':' + (ob.lv || 0) + (d.elevator ? 'e' + this.objEnv(ob, night).maxLv : '') + ':' + ob.col.join('') + ':' + (d.light ? (d.outdoorLight ? night : night && !ob.st.off) : '') + ':' + (ob.st ? JSON.stringify(ob.st).length + (ob.st.on ? 1 : 0) + (ob.st.cooking ? 2 : 0) + (ob.st.water ? 4 : 0) + (ob.st.mail ? 8 : 0) + (ob.st.woohoo ? 16 : 0) + (ob.st.play ? 32 : 0) + Math.round((ob.st.growth || 0) * 10) + (ob.st.servings || 0) + (ob.st.fill >= 4 ? 64 : 0) + (ob.st.work ? Math.round(ob.st.work.p * 10) : 0) : '') + (ob.broken ? 'b' : '') + '|';
        }
        const cur = this.objChunks.get(key);
        if (cur && cur.sig === sig) continue;
        const g = new Geo(this.atlas), sh = new Geo(this.atlas);
        for (const ob of list) {
          const env = this.objEnv(ob, night);
          this.placeGeo(g, ob, env);
          const def = OBJECTS[ob.t];
          if (ob.layer === 'occ' && !def.water) {
            const f = footprint(def, ob.r);
            this.blob(sh, ob.x + f[0] / 2, ob.y + f[1] / 2, f[0] * 0.55 + 0.15, f[1] * 0.55 + 0.15, 0.5, ob.lv ? ob.lv * WALL_H + 0.035 : this.tileZ(ob.x, ob.y));
          }
        }
        const b = this.upload(g, cur ? cur.b : null);
        const s = this.upload(sh, cur ? cur.s : null);
        this.objChunks.set(key, { sig, b, s, list });
      }
      for (const key of [...this.objChunks.keys()]) if (!seen.has(key)) { const c = this.objChunks.get(key); this.free(c.b); this.free(c.s); this.objChunks.delete(key); }
      const bigSeen = new Set();
      for (const ob of w.objects.values()) {
        if (!this.isBig(ob)) continue;
        bigSeen.add(ob.id);
        const env = this.objEnv(ob, night);
        const sig = ob.x + ',' + ob.y + ',' + ob.r + ',' + night;
        const cur = this.bigObjs.get(ob.id);
        if (cur && cur.sig === sig) continue;
        const g = new Geo(this.atlas);
        const h = this.placeGeo(g, ob, env);
        const sh = new Geo(this.atlas);
        const def = OBJECTS[ob.t];
        const f = footprint(def, ob.r);
        if (def.tree) this.blob(sh, ob.x + 0.5, ob.y + 0.5, 1.4, 1.4, 0.35, 0);
        const b = this.upload(g, cur ? cur.b : null);
        this.bigObjs.set(ob.id, { sig, b, s: this.upload(sh), h: h || 5, x0: ob.x, y0: ob.y, x1: ob.x + f[0], y1: ob.y + f[1], tree: !!def.tree, id: ob.id });
      }
      for (const id of [...this.bigObjs.keys()]) if (!bigSeen.has(id)) { const c = this.bigObjs.get(id); this.free(c.b); this.bigObjs.delete(id); }
    }

    blob(g, x, y, rx, ry, a, z) {
      const c = this.atlas.get('blob');
      const zz = (z || 0) + 0.02;
      const p = [[x - rx, y - ry], [x + rx, y - ry], [x + rx, y + ry], [x - rx, y + ry]];
      const col = [0, 0, 0];
      g.vert(p[0][0], p[0][1], zz, 0, 0, 1, col, a, c.u0, c.v0); g.vert(p[1][0], p[1][1], zz, 0, 0, 1, col, a, c.u1, c.v0); g.vert(p[2][0], p[2][1], zz, 0, 0, 1, col, a, c.u1, c.v1);
      g.vert(p[0][0], p[0][1], zz, 0, 0, 1, col, a, c.u0, c.v0); g.vert(p[2][0], p[2][1], zz, 0, 0, 1, col, a, c.u1, c.v1); g.vert(p[3][0], p[3][1], zz, 0, 0, 1, col, a, c.u0, c.v1);
    }

    wallHeight(wl, lotId) {
      if (wl.fence) return 1;
      if (lotId !== this.focusLot || this.fullView) return WALL_H;
      const lv = wl.lv || 0;
      if (lv < this.viewLv) return WALL_H;
      if (this.wallMode === 'up') return WALL_H;
      if (this.wallMode === 'down') return CUT_H;
      const F = this.cam.F;
      const w = this.world;
      let far;
      if (wl.o === 'h') far = F[1] < 0 ? [wl.x, wl.y - 1] : [wl.x, wl.y];
      else far = F[0] < 0 ? [wl.x - 1, wl.y] : [wl.x, wl.y];
      return w.inb(far[0], far[1]) && w.indoor(far[0], far[1], lv) ? CUT_H : WALL_H;
    }

    buildLotWalls(lotId, night) {
      const w = this.world, A = this.atlas;
      const g = new Geo(A), gl = new Geo(A);
      const T = 0.065;
      let lvNow = 0;
      const has = (o, x, y) => !!w.getWall(o, x, y, lvNow);
      for (const wl of w.walls) {
        if (!wl || (wl.lot === undefined ? -1 : wl.lot) !== lotId) continue;
        lvNow = wl.lv || 0;
        if (this.hiddenLv(lvNow, lotId)) continue;
        g.setTransform(0, 0, lvNow * WALL_H, 1, 0, 0, 1, 1);
        gl.setTransform(0, 0, lvNow * WALL_H, 1, 0, 0, 1, 1);
        const H = this.wallHeight(wl, lotId);
        let ax, ay, bx, by, n;
        if (wl.o === 'h') { ax = wl.x; ay = wl.y; bx = wl.x + 1; by = wl.y; n = [0, 1]; }
        else { ax = wl.x; ay = wl.y; bx = wl.x; by = wl.y + 1; n = [1, 0]; }
        const endA = wl.o === 'h' ? has('v', ax, ay - 1) || has('v', ax, ay) || has('h', ax - 1, ay) : has('h', ax - 1, ay) || has('h', ax, ay) || has('v', ax, ay - 1);
        const endB = wl.o === 'h' ? has('v', bx, by - 1) || has('v', bx, by) || has('h', bx, by) : has('h', bx - 1, by) || has('h', bx, by) || has('v', bx, by);
        const ext = wl.fence ? 0 : T;
        const t0 = endA ? -ext : 0, t1 = 1 + (endB ? ext : 0);
        const P = (t, side, z) => [ax + (bx - ax) * t + n[0] * side, ay + (by - ay) * t + n[1] * side, z];
        if (wl.fence) {
          const c = [0.95, 0.94, 0.9];
          for (let i = 0; i < 4; i++) { const t = 0.125 + i * 0.25; g.box(P(t, 0, 0)[0] - 0.035, P(t, 0, 0)[1] - 0.035, 0, P(t, 0, 0)[0] + 0.035, P(t, 0, 0)[1] + 0.035, 0.95, c); }
          g.beam(P(0, 0, 0.3), P(1, 0, 0.3), 0.02, c); g.beam(P(0, 0, 0.75), P(1, 0, 0.75), 0.02, c);
          continue;
        }
        let hole = null;
        const door = wl.door ? S.DOORS[wl.door] : null;
        const win = wl.win ? S.WINDOWS[wl.win] : null;
        if (door) hole = { u0: 0.1, u1: 0.9, z0: 0, z1: door.style === 'arch' ? 2.4 : 2.2, door };
        else if (win) { const st = win.style; hole = { u0: st === 'tall' ? 0.18 : 0.2, u1: st === 'tall' ? 0.82 : 0.8, z0: st === 'tall' ? 0.5 : 0.95, z1: st === 'tall' ? 2.5 : 2.25, win }; if (hole.z0 >= H) hole = null; }
        const faces = [[-T, wl.a, [-n[0], -n[1], 0]], [T, wl.b, [n[0], n[1], 0]]];
        for (const [side, paper, nrm] of faces) {
          const P2 = S.WALLPAPERS[paper] || S.WALLPAPERS.paint_white;
          const rects = [];
          if (hole) {
            const z1 = Math.min(hole.z1, H);
            rects.push([t0, hole.u0, 0, H], [hole.u1, t1, 0, H]);
            if (hole.z0 > 0) rects.push([hole.u0, hole.u1, 0, hole.z0]);
            if (z1 < H) rects.push([hole.u0, hole.u1, z1, H]);
          } else rects.push([t0, t1, 0, H]);
          for (const [u0, u1, z0, z1] of rects) {
            for (let zi = Math.floor(z0); zi < Math.ceil(z1); zi++) {
              const za = Math.max(z0, zi), zb = Math.min(z1, zi + 1);
              if (zb - za < 0.001) continue;
              const cellName = P2.tex === 'wp_wainscot' && zi === 0 ? 'wp_' + paper + '_low' : 'wp_' + paper;
              const c = A.get(cellName);
              const uu0 = c.u0 + (c.u1 - c.u0) * (u0 - Math.floor(u0 < 0 ? 0 : u0)), uu1 = c.u0 + (c.u1 - c.u0) * Math.min(1, u1);
              const vv0 = c.v1 - (c.v1 - c.v0) * (za - zi), vv1 = c.v1 - (c.v1 - c.v0) * (zb - zi);
              const p0 = P(u0, side, za), p1 = P(u1, side, za), p2 = P(u1, side, zb), p3 = P(u0, side, zb);
              const cc = [1, 1, 1];
              g.vert(p0[0], p0[1], p0[2], nrm[0], nrm[1], 0, cc, 0, uu0, vv0); g.vert(p1[0], p1[1], p1[2], nrm[0], nrm[1], 0, cc, 0, uu1, vv0); g.vert(p2[0], p2[1], p2[2], nrm[0], nrm[1], 0, cc, 0, uu1, vv1);
              g.vert(p0[0], p0[1], p0[2], nrm[0], nrm[1], 0, cc, 0, uu0, vv0); g.vert(p2[0], p2[1], p2[2], nrm[0], nrm[1], 0, cc, 0, uu1, vv1); g.vert(p3[0], p3[1], p3[2], nrm[0], nrm[1], 0, cc, 0, uu0, vv1);
            }
          }
        }
        const topC = H < WALL_H ? [0.86, 0.82, 0.74] : [0.55, 0.5, 0.45];
        const capRects = hole && hole.z0 === 0 && H <= hole.z1 ? [[t0, hole.u0], [hole.u1, t1]] : [[t0, t1]];
        for (const [u0, u1] of capRects) g.quad(P(u0, -T, H), P(u1, -T, H), P(u1, T, H), P(u0, T, H), topC, { n: [0, 0, 1] });
        if (!endA) g.quad(P(0, -T, 0), P(0, T, 0), P(0, T, H), P(0, -T, H), mulCol(topC, 0.85), { n: [-(bx - ax), -(by - ay), 0] });
        if (!endB) g.quad(P(1, T, 0), P(1, -T, 0), P(1, -T, H), P(1, T, H), mulCol(topC, 0.85), { n: [bx - ax, by - ay, 0] });
        if (hole) {
          const fc = col((hole.door || hole.win).c || '#f0f0ec');
          const z1 = Math.min(hole.z1, H);
          if (hole.z0 < H) {
            for (const u of [hole.u0, hole.u1]) { const a = P(u, -T - 0.015, hole.z0), b = P(u, T + 0.015, z1); g.box(Math.min(a[0], b[0]) - 0.03, Math.min(a[1], b[1]) - 0.03, hole.z0, Math.max(a[0], b[0]) + 0.03, Math.max(a[1], b[1]) + 0.03, z1, fc); }
            if (z1 < H + 0.001 && hole.z1 <= H) { const a = P(hole.u0, -T - 0.015, 0), b = P(hole.u1, T + 0.015, 0); g.box(Math.min(a[0], b[0]) - 0.03, Math.min(a[1], b[1]) - 0.03, z1 - 0.06, Math.max(a[0], b[0]) + 0.03, Math.max(a[1], b[1]) + 0.03, z1, fc); }
            if (hole.win && hole.z0 > 0) { const a = P(hole.u0, -T - 0.05, 0), b = P(hole.u1, T + 0.05, 0); g.box(Math.min(a[0], b[0]) - 0.02, Math.min(a[1], b[1]) - 0.02, hole.z0 - 0.05, Math.max(a[0], b[0]) + 0.02, Math.max(a[1], b[1]) + 0.02, hole.z0, fc); }
          }
          if (hole.win && hole.z1 <= H) {
            const mid = (hole.u0 + hole.u1) / 2;
            const a = P(mid, -0.01, 0), b = P(mid, 0.01, 0);
            g.box(Math.min(a[0], b[0]) - 0.015, Math.min(a[1], b[1]) - 0.015, hole.z0, Math.max(a[0], b[0]) + 0.015, Math.max(a[1], b[1]) + 0.015, hole.z1, fc);
            if (hole.win.style !== 'simple') { const zm = (hole.z0 + hole.z1) / 2; const c0 = P(hole.u0, -0.01, zm), c1 = P(hole.u1, 0.01, zm); g.box(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), zm - 0.015, Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), zm + 0.015, fc); }
            const inside = wl.o === 'h' ? [wl.x, wl.y - (w.indoor(wl.x, wl.y - 1, lvNow) ? 1 : 0)] : [wl.x - (w.indoor(wl.x - 1, wl.y, lvNow) ? 1 : 0), wl.y];
            const lit = night && this.lmAt(inside[0], inside[1]) > 0.25;
            const gc = lit ? [1, 0.86, 0.5] : [0.55, 0.72, 0.85];
            const q0 = P(hole.u0, 0, hole.z0), q1 = P(hole.u1, 0, hole.z0), q2 = P(hole.u1, 0, hole.z1), q3 = P(hole.u0, 0, hole.z1);
            gl.vert(q0[0], q0[1], q0[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0); gl.vert(q1[0], q1[1], q1[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0); gl.vert(q2[0], q2[1], q2[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0);
            gl.vert(q0[0], q0[1], q0[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0); gl.vert(q2[0], q2[1], q2[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0); gl.vert(q3[0], q3[1], q3[2], n[0], n[1], 0, gc, lit ? 0.85 : 0.35, 0, 0);
          }
        }
      }
      g.clearTransform(); gl.clearTransform();
      const lot = lotId >= 0 ? this.game.lots[lotId] : null;
      if (lot) this.buildUpperFloors(g, lot);
      return { g, glass: gl };
    }

    buildUpperFloors(g, lot) {
      const w = this.world, A = this.atlas;
      const ceil = [0.9, 0.88, 0.84], edge = [0.78, 0.75, 0.7];
      for (let lv = 1; lv < w.L; lv++) {
        if (this.hiddenLv(lv, lot.id)) break;
        const z = lv * WALL_H;
        for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) {
          const key = w.floorAt(x, y, lv);
          if (!key) continue;
          const c = A.get('fl_' + key);
          const zt = z + 0.03, zb = z - 0.12;
          g.vert(x, y, zt, 0, 0, 1, [1, 1, 1], 0, c.u0, c.v0); g.vert(x + 1, y, zt, 0, 0, 1, [1, 1, 1], 0, c.u1, c.v0); g.vert(x + 1, y + 1, zt, 0, 0, 1, [1, 1, 1], 0, c.u1, c.v1);
          g.vert(x, y, zt, 0, 0, 1, [1, 1, 1], 0, c.u0, c.v0); g.vert(x + 1, y + 1, zt, 0, 0, 1, [1, 1, 1], 0, c.u1, c.v1); g.vert(x, y + 1, zt, 0, 0, 1, [1, 1, 1], 0, c.u0, c.v1);
          g.quad([x, y + 1, zb], [x + 1, y + 1, zb], [x + 1, y, zb], [x, y, zb], ceil, { n: [0, 0, -1] });
          for (let k = 0; k < 4; k++) {
            if (w.hasFloor(x + DX[k], y + DY[k], lv)) continue;
            const ex = [[x, y, x + 1, y], [x + 1, y, x + 1, y + 1], [x + 1, y + 1, x, y + 1], [x, y + 1, x, y]][k];
            g.quad([ex[0], ex[1], zb], [ex[2], ex[3], zb], [ex[2], ex[3], zt], [ex[0], ex[1], zt], edge, { n: [DX[k], DY[k], 0] });
          }
        }
      }
    }

    lmAt(x, y) { if (!this.world.inb(x, y)) return 0; const i = (y * this.W + x) * 4; return this.lm[i] / 255; }

    computeRoofRects(lot) {
      const w = this.world;
      const rects = [];
      for (let lv = 0; lv < w.L; lv++) {
        const inside = new Uint8Array(lot.w * lot.h);
        let any = false;
        for (let y = 0; y < lot.h; y++) for (let x = 0; x < lot.w; x++) {
          const wx = lot.x + x, wy = lot.y + y;
          const rid = w.roomAt(wx, wy, lv);
          if (rid > 0 && w.rooms[rid] && w.rooms[rid].lot === lot.id && !(lv + 1 < w.L && w.hasFloor(wx, wy, lv + 1))) { inside[y * lot.w + x] = 1; any = true; }
        }
        if (!any) continue;
        const used = new Uint8Array(lot.w * lot.h);
        for (let y = 0; y < lot.h; y++) for (let x = 0; x < lot.w; x++) {
          const i = y * lot.w + x;
          if (!inside[i] || used[i]) continue;
          let rw = 0;
          while (x + rw < lot.w && inside[y * lot.w + x + rw] && !used[y * lot.w + x + rw]) rw++;
          let rh = 1;
          outer: while (y + rh < lot.h) { for (let k = 0; k < rw; k++) { const j = (y + rh) * lot.w + x + k; if (!inside[j] || used[j]) break outer; } rh++; }
          for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) used[yy * lot.w + xx] = 1;
          rects.push([lot.x + x, lot.y + y, rw, rh, lv]);
        }
      }
      return rects;
    }
    buildRoof(lot) {
      const g = new Geo(this.atlas);
      const rc = col(lot.roof || '#7a4a3a');
      const style = lot.roofStyle || 'hip', pitch = lot.roofPitch || 1;
      if (style !== 'none') for (const [x, y, w, h, lv] of this.computeRoofRects(lot)) this.roofShape(g, x, y, w, h, (lv + 1) * WALL_H, style, pitch, rc, lot, false);
      for (const p of lot.roofPieces || []) this.roofShape(g, p.x, p.y, p.w, p.h, ((p.lv || 0) + 1) * WALL_H, p.style || 'hip', pitch, rc, lot, true);
      return g;
    }
    roofShape(g, x, y, w, h, z, style, pitch, rc, lot, piece) {
      const ov = 0.35;
      const x0 = x - ov, x1 = x + w + ov, y0 = y - ov, y1 = y + h + ov;
      const sh = { cell: 'shingles' };
      const tuv = Object.assign({ uv: [[0, 1], [1, 1], [0.5, 0]] }, sh);
      const wallC = col((S.WALLPAPERS[lot.ext || 'siding'] || S.WALLPAPERS.siding).c);
      if (piece) {
        const pc = [0.9, 0.88, 0.84];
        for (const [px, py] of [[x + 0.12, y + 0.12], [x + w - 0.12, y + 0.12], [x + 0.12, y + h - 0.12], [x + w - 0.12, y + h - 0.12]]) g.cyl(px, py, z - WALL_H, z, 0.07, 0.07, 6, pc);
        g.box(x, y, z - 0.18, x + w, y + h, z - 0.02, pc);
      } else g.box(x - 0.05, y - 0.05, z - 0.02, x + w + 0.05, y + h + 0.05, z + 0.06, [0.5, 0.45, 0.4]);
      if (style === 'flat') {
        g.box(x0 + 0.2, y0 + 0.2, z + 0.02, x1 - 0.2, y1 - 0.2, z + 0.16, mulCol(rc, 0.75));
        const pz = z + 0.42, t = 0.12;
        g.box(x0 + 0.2, y0 + 0.2, z, x1 - 0.2, y0 + 0.2 + t, pz, wallC);
        g.box(x0 + 0.2, y1 - 0.2 - t, z, x1 - 0.2, y1 - 0.2, pz, wallC);
        g.box(x0 + 0.2, y0 + 0.2, z, x0 + 0.2 + t, y1 - 0.2, pz, wallC);
        g.box(x1 - 0.2 - t, y0 + 0.2, z, x1 - 0.2, y1 - 0.2, pz, wallC);
        return;
      }
      const rise = (Math.min(w, h) / 2 * 0.62 + 0.2) * pitch;
      if (style === 'shed') {
        const r2 = Math.min(3, (Math.min(w, h) * 0.5 + 0.3) * pitch);
        if (w >= h) {
          g.quad([x0, y1, z], [x1, y1, z], [x1, y0, z + r2], [x0, y0, z + r2], rc, sh);
          g.tri([x0, y0, z], [x0, y1, z], [x0, y0, z + r2], wallC, { n: [-1, 0, 0] });
          g.tri([x1, y1, z], [x1, y0, z], [x1, y0, z + r2], wallC, { n: [1, 0, 0] });
          g.quad([x1, y0, z], [x0, y0, z], [x0, y0, z + r2], [x1, y0, z + r2], wallC, { n: [0, -1, 0] });
        } else {
          g.quad([x1, y1, z], [x1, y0, z], [x0, y0, z + r2], [x0, y1, z + r2], rc, sh);
          g.tri([x0, y1, z], [x1, y1, z], [x0, y1, z + r2], wallC, { n: [0, 1, 0] });
          g.tri([x1, y0, z], [x0, y0, z], [x0, y0, z + r2], wallC, { n: [0, -1, 0] });
          g.quad([x0, y0, z], [x0, y1, z], [x0, y1, z + r2], [x0, y0, z + r2], wallC, { n: [-1, 0, 0] });
        }
        return;
      }
      if (style === 'gable') {
        if (w >= h) {
          const my = y + h / 2;
          g.quad([x0, y1, z], [x1, y1, z], [x1, my, z + rise], [x0, my, z + rise], rc, sh);
          g.quad([x1, y0, z], [x0, y0, z], [x0, my, z + rise], [x1, my, z + rise], rc, sh);
          g.tri([x0 + 0.02, y0, z], [x0 + 0.02, y1, z], [x0 + 0.02, my, z + rise], wallC, { n: [-1, 0, 0] });
          g.tri([x1 - 0.02, y1, z], [x1 - 0.02, y0, z], [x1 - 0.02, my, z + rise], wallC, { n: [1, 0, 0] });
        } else {
          const mx = x + w / 2;
          g.quad([x1, y1, z], [x1, y0, z], [mx, y0, z + rise], [mx, y1, z + rise], rc, sh);
          g.quad([x0, y0, z], [x0, y1, z], [mx, y1, z + rise], [mx, y0, z + rise], rc, sh);
          g.tri([x0, y1 - 0.02, z], [x1, y1 - 0.02, z], [mx, y1 - 0.02, z + rise], wallC, { n: [0, 1, 0] });
          g.tri([x1, y0 + 0.02, z], [x0, y0 + 0.02, z], [mx, y0 + 0.02, z + rise], wallC, { n: [0, -1, 0] });
        }
        return;
      }
      if (w >= h) {
        const ins = h / 2 + ov;
        g.quad([x0, y1, z], [x1, y1, z], [x1 - ins, y + h / 2, z + rise], [x0 + ins, y + h / 2, z + rise], rc, sh);
        g.quad([x1, y0, z], [x0, y0, z], [x0 + ins, y + h / 2, z + rise], [x1 - ins, y + h / 2, z + rise], rc, sh);
        g.tri([x0, y0, z], [x0, y1, z], [x0 + ins, y + h / 2, z + rise], mulCol(rc, 0.95), tuv);
        g.tri([x1, y1, z], [x1, y0, z], [x1 - ins, y + h / 2, z + rise], mulCol(rc, 0.95), tuv);
      } else {
        const ins = w / 2 + ov;
        g.quad([x1, y1, z], [x1, y0, z], [x + w / 2, y0 + ins, z + rise], [x + w / 2, y1 - ins, z + rise], rc, sh);
        g.quad([x0, y0, z], [x0, y1, z], [x + w / 2, y1 - ins, z + rise], [x + w / 2, y0 + ins, z + rise], rc, sh);
        g.tri([x0, y1, z], [x1, y1, z], [x + w / 2, y1 - ins, z + rise], mulCol(rc, 0.95), tuv);
        g.tri([x1, y0, z], [x0, y0, z], [x + w / 2, y0 + ins, z + rise], mulCol(rc, 0.95), tuv);
      }
    }

    computeLightmap(night) {
      const w = this.world, W = this.W, H = this.H;
      const acc = new Float32Array(W * H * 3);
      if (night) {
        for (const ob of w.objects.values()) {
          const d = OBJECTS[ob.t];
          if (!d.light) continue;
          if (!d.outdoorLight && ob.st.off) continue;
          const r = d.light;
          const ox = ob.x + 0.5, oy = ob.y + 0.5;
          const olv = ob.lv || 0;
          if (olv !== (ob.lot === this.focusLot ? this.viewLv : 0)) continue;
          const room = w.roomAt(ob.x, ob.y, olv);
          const warm = d.outdoorLight ? [1, 0.82, 0.52] : [1, 0.86, 0.62];
          const k = d.outdoorLight ? 0.95 : 0.85;
          const R = Math.ceil(r);
          for (let yy = ob.y - R; yy <= ob.y + R; yy++) for (let xx = ob.x - R; xx <= ob.x + R; xx++) {
            if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            if (w.roomAt(xx, yy, olv) !== room) continue;
            const dd = Math.hypot(xx + 0.5 - ox, yy + 0.5 - oy);
            if (dd > r) continue;
            const f = Math.pow(1 - dd / r, 1.2) * k;
            const i = (yy * W + xx) * 3;
            acc[i] += warm[0] * f; acc[i + 1] += warm[1] * f; acc[i + 2] += warm[2] * f;
          }
        }
      }
      for (let i = 0; i < W * H; i++) {
        this.lm[i * 4] = Math.min(255, acc[i * 3] * 200);
        this.lm[i * 4 + 1] = Math.min(255, acc[i * 3 + 1] * 200);
        this.lm[i * 4 + 2] = Math.min(255, acc[i * 3 + 2] * 200);
        this.lm[i * 4 + 3] = 255;
      }
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.lmTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, this.lm);
    }

    resize(w, h) {
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      this.cam.w = w; this.cam.h = h;
    }

    visibleChunks() {
      const cam = this.cam;
      const out = [];
      const nx = Math.ceil(this.W / CH), ny = Math.ceil(this.H / CH);
      for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const [px, py] of [[cx * CH, cy * CH], [(cx + 1) * CH, cy * CH], [cx * CH, (cy + 1) * CH], [(cx + 1) * CH, (cy + 1) * CH]]) {
          for (const z of [-1, 8]) { const p = cam.toScreen(px, py, z); x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
        }
        if (x1 < -40 || y1 < -40 || x0 > cam.w + 40 || y0 > cam.h + 40) continue;
        out.push([cx, cy]);
      }
      return out;
    }

    frame(dt, opts) {
      opts = opts || {};
      this.time += dt;
      const gl = this.gl, game = this.game, w = this.world, cam = this.cam;
      S._gameT = game.t;
      const target = ZOOMS[cam.zoom];
      cam.s += (target - cam.s) * Math.min(1, dt * 10);
      if (Math.abs(cam.s - target) < 0.01) cam.s = target;
      const focusLot = opts.focusLot !== undefined ? opts.focusLot : -1;
      this.focusLot = focusLot;
      this.viewLv = focusLot >= 0 ? Math.max(0, Math.min(w.L - 1, opts.viewLv || 0)) : 0;
      this.fullView = focusLot >= 0 && (cam.zoom >= 2 || this.showRoofs);
      const tz = this.viewLv * WALL_H;
      cam.tz += (tz - cam.tz) * Math.min(1, dt * 8);
      if (Math.abs(cam.tz - tz) < 0.01) cam.tz = tz;
      cam.update();
      const W0 = game.weather;
      if (W0 && W0.kind === 'storm' && game.t - (W0.since || 0) > 15) {
        this.flashT -= dt;
        if (this.flashT <= 0) { this.flash = 1; this.flashes++; this.flashT = 3 + Math.random() * 9; }
      }
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * (this.flash > 0.5 ? 3 : 6));
      const L = this.lightParams();
      this.stats.draws = 0; this.stats.tris = 0;
      if (w.version !== this.floorVer) { this.floorVer = w.version; for (const c of this.chunks.values()) c.stale = true; }
      const lightKey = game.lightVersion + ':' + L.night + ':' + game.objVersion + ':' + w.wallVersion + ':' + focusLot + ':' + this.viewLv;
      if (lightKey !== this.lightKey) { this.lightKey = lightKey; this.computeLightmap(L.night); }
      const objKey = game.objVersion + ':' + w.version + ':' + L.night + ':' + focusLot + ':' + this.wallMode + ':' + this.showCeil + ':' + this.viewLv + ':' + this.fullView;
      if (objKey !== this.objKey) { this.objKey = objKey; this.buildObjChunks(L.night); }
      if (!this.water) this.buildWater();
      let roofSig = '';
      for (const lot of this.game.lots) if (lot.kind === 'home') roofSig += lot.roof + (lot.roofStyle || '') + (lot.roofPitch || '') + (lot.roofPieces ? lot.roofPieces.length : '');
      const wallKey = w.wallVersion + ':' + cam.rot + ':' + focusLot + ':' + this.wallMode + ':' + L.night + ':' + w.version + ':' + roofSig + ':' + this.viewLv + ':' + this.fullView;
      if (wallKey !== this.wallKey) {
        this.wallKey = wallKey;
        this.focusLot = focusLot;
        const lots = new Set();
        for (const wl of w.walls) if (wl) lots.add(wl.lot === undefined ? -1 : wl.lot);
        for (const [k, v] of this.lotWalls) if (!lots.has(k)) { this.free(v.b); this.free(v.gl); this.lotWalls.delete(k); }
        for (const lid of lots) {
          const cur = this.lotWalls.get(lid);
          const sub = (lid === focusLot ? 'F' : 'N') + ':' + (lid === focusLot ? this.wallMode + cam.rot + 'v' + this.viewLv + (this.fullView ? 'f' : '') : '') + ':' + L.night + ':' + w.wallVersion + ':' + w.version;
          if (cur && cur.sub === sub) continue;
          const r = this.buildLotWalls(lid, L.night);
          this.lotWalls.set(lid, { sub, b: this.upload(r.g, cur ? cur.b : null), gl: this.upload(r.glass, cur ? cur.gl : null) });
        }
        for (const lot of this.game.lots) {
          if (lot.kind !== 'home' && lot.kind !== 'venue') continue;
          const key = lot.id + ':' + w.wallVersion + ':' + w.version + ':' + lot.roof + ':' + (lot.roofStyle || '') + ':' + (lot.roofPitch || '') + ':' + JSON.stringify(lot.roofPieces || []);
          const cur = this.roofs.get(lot.id);
          if (cur && cur.key === key) continue;
          if (cur) this.free(cur.b);
          this.roofs.set(lot.id, { key, b: this.upload(this.buildRoof(lot)) });
        }
      }
      gl.viewport(0, 0, cam.w, cam.h);
      gl.clearColor(L.sky[0], L.sky[1], L.sky[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.prog.p);
      const u = this.prog.u;
      gl.uniformMatrix4fv(u.uVP, false, cam.vp);
      const sun = this.sunDir();
      gl.uniform3fv(u.uSun, sun);
      gl.uniform3fv(u.uSunC, L.sun);
      gl.uniform3fv(u.uAmb, L.amb);
      gl.uniform2f(u.uWorld, this.W, this.H);
      gl.uniform1f(u.uLamp, L.lamp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(u.uTex, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.lmTex); gl.uniform1i(u.uLM, 1);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      const vis = this.visibleChunks();
      for (const [cx, cy] of vis) {
        const key = cx + ',' + cy;
        let c = this.chunks.get(key);
        if (!c || c.stale) { const b = this.upload(this.buildChunk(cx, cy), c ? c.b : null); c = { b, stale: false }; this.chunks.set(key, c); }
        this.draw(c.b, 1, 0, L.wet > 0 ? [1 - 0.16 * L.wet, 1 - 0.14 * L.wet, 1 - 0.1 * L.wet] : null);
        const oc = this.objChunks.get(key);
        if (oc) this.draw(oc.b);
      }
      for (const [lid, v] of this.lotWalls) this.draw(v.b);
      const roofOn = lid => lid !== focusLot || this.fullView;
      for (const [lid, r] of this.roofs) if (roofOn(lid)) this.draw(r.b);
      const fadeIds = opts.fadeNear ? this.fadeCandidates(opts.fadeNear) : new Set();
      for (const bo of this.bigObjs.values()) {
        if (fadeIds.has(bo.id)) continue;
        if (!this.boxVisible(bo.x0, bo.y0, bo.x1, bo.y1, bo.h)) continue;
        this.draw(bo.b);
      }
      const dyn = new Geo(this.atlas);
      const heads = new Map();
      for (const sim of game.sims.values()) {
        if (sim.hidden && !sim.ghost) continue;
        if (sim.dead && !sim.ghost && sim.anim !== 'dead') continue;
        if (sim.ghost) continue;
        if (!this.pointVisible(sim.x, sim.y, 1)) continue;
        if (this.hiddenLv(sim.lv, sim.lot)) continue;
        this.updatePhase(sim, dt);
        const opt = {};
        const sz = (sim.lv || 0) * WALL_H + (sim.zOff || 0) + (sim.swimZ || 0);
        if (sz) opt.z = sz;
        if (sim.carriedBy) {
          const c = game.sims.get(sim.carriedBy);
          if (c && c._carry) { opt.x = c._carry[0]; opt.y = c._carry[1]; opt.heldZ = c._carry[2]; opt.yaw = c.face; }
        }
        const r = S.emitSim(dyn, sim, this.time, this.atlas, opt);
        sim._carry = r.carryPos;
        heads.set(sim.id, r);
      }
      for (const car of game.vehicles) {
        if (!this.pointVisible(car.x, car.y, 1)) continue;
        const g2 = dyn;
        const off = 0.85;
        const nx = -Math.sin(car.heading), ny = Math.cos(car.heading);
        const cx = car.x + nx * off, cy = car.y + ny * off;
        const fw = [Math.cos(car.heading), Math.sin(car.heading)];
        g2.setTransform(cx, cy, 0, fw[1], -fw[0], fw[0], fw[1], 1);
        S.carModel(g2, car.color, car.kind);
        g2.clearTransform();
      }
      for (const wl of w.walls) {
        if (!wl || !wl.door || S.DOORS[wl.door].style === 'arch') continue;
        const lotId = wl.lot === undefined ? -1 : wl.lot;
        if (this.hiddenLv(wl.lv, lotId)) continue;
        const H = this.wallHeight(wl, lotId);
        if (H < 2.2) continue;
        const cx = wl.o === 'h' ? wl.x + 0.5 : wl.x, cy = wl.o === 'h' ? wl.y : wl.y + 0.5;
        if (!this.pointVisible(cx, cy, 2)) continue;
        let open = 0;
        for (const s of game.sims.values()) if (!s.hidden && (s.lv || 0) === (wl.lv || 0) && Math.abs(s.x - cx) < 1.3 && Math.abs(s.y - cy) < 1.3) open = 1;
        wl._open = (wl._open || 0) + (open - (wl._open || 0)) * Math.min(1, dt * 6);
        this.doorLeaf(dyn, wl, wl._open);
      }
      if (game.fires.length) for (const f of game.fires) this.flames(null, f, dt);
      const sel = game.selected();
      if (sel && !sel.hidden && heads.has(sel.id) && opts.plumbob !== false) this.plumbob(dyn, heads.get(sel.id).head, sel.moodLevel);
      if (this.ghost) this.ghost(dyn);
      this.drawArray(dyn.data);
      gl.useProgram(this.wprog.p);
      gl.uniformMatrix4fv(this.wprog.u.uVP, false, cam.vp);
      gl.uniform1f(this.wprog.u.uTime, this.time);
      gl.uniform3fv(this.wprog.u.uAmb, L.amb);
      gl.uniform3fv(this.wprog.u.uSunC, L.sun);
      gl.uniform1f(this.wprog.u.uLamp, L.lamp);
      for (const [wb, pond] of [[this.water.sea, 0], [this.water.pond, 1], [this.water.pool, 2]]) {
        if (!wb.count) continue;
        gl.uniform1f(this.wprog.u.uPond, pond);
        gl.bindBuffer(gl.ARRAY_BUFFER, wb.buf);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
        gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
        gl.drawArrays(gl.TRIANGLES, 0, wb.count);
      }
      gl.useProgram(this.prog.p);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -2);
      if (!this.noShadows) {
        for (const [cx, cy] of vis) { const oc = this.objChunks.get(cx + ',' + cy); if (oc) this.draw(oc.s, 1, 1); }
        for (const bo of this.bigObjs.values()) if (bo.tree && this.boxVisible(bo.x0, bo.y0, bo.x1, bo.y1, 1)) this.draw(bo.s, 1, 1);
        const sh = new Geo(this.atlas);
        for (const sim of game.sims.values()) { if (sim.hidden || sim.dead || sim.carriedBy || !heads.has(sim.id) || sim.lieH > 0.1 || sim.sitH > 0.1 || sim.swimZ) continue; const bz = sim.lv || sim.zOff ? (sim.lv || 0) * WALL_H + (sim.zOff || 0) + 0.035 : this.tileZ(Math.floor(sim.x), Math.floor(sim.y)); this.blob(sh, sim.x, sim.y, 0.32 * sim.scale + 0.06, 0.32 * sim.scale + 0.06, 0.55, bz); }
        for (const car of game.vehicles) { const nx = -Math.sin(car.heading) * 0.85, ny = Math.cos(car.heading) * 0.85; this.blob(sh, car.x + nx, car.y + ny, 1.1, 1.1, 0.45, 0); }
        this.drawArray(sh.data, 1, 1);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      for (const [lid, v] of this.lotWalls) this.draw(v.gl, 1, 1);
      if (fadeIds.size) {
        gl.depthMask(true);
        for (const id of fadeIds) { const bo = this.bigObjs.get(id); if (bo) this.draw(bo.b, 0.28); }
        gl.depthMask(false);
      }
      const tr = new Geo(this.atlas);
      for (const sim of game.sims.values()) {
        if (!sim.ghost || !this.pointVisible(sim.x, sim.y, 1)) continue;
        S.emitSim(tr, sim, this.time, this.atlas, { tint: [0.7, 1.2, 1.1], alpha: 0.45 });
      }
      for (const f of game.fires) if (!this.hiddenLv(f.lv, f.lot)) this.flames(tr, f, 0);
      for (const ob of this.waterObjs()) if (!this.hiddenLv(ob.lv, ob.lot)) this.showerWater(tr, ob);
      if (L.rain > 0.02) this.rainGeo(tr, L.rain);
      for (const e of this.extra) e(tr);
      if (tr.data.length) this.drawArray(tr.data, 1, 2);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      return heads;
    }

    rainGeo(g, k) {
      const cam = this.cam, w = this.world;
      const span = Math.min(90, Math.max(cam.w, cam.h) / cam.s * 0.75 + 4);
      const n = Math.round(Math.min(900, 120 + span * span * 0.35) * k);
      const wid = 1.3 / cam.s, len = 0.75;
      const R = cam.R, c = [0.78, 0.84, 0.96];
      const t = this.time;
      const ox = cam.px, oy = cam.py;
      for (let i = 0; i < n; i++) {
        const hx = S.hash2(i, 7, 11), hy = S.hash2(i, 13, 3), hz = S.hash2(i, 5, 29);
        let x = ox + (hx - 0.5) * span * 2, y = oy + (hy - 0.5) * span * 2;
        const top = cam.tz + 9;
        const z = top - ((t * 11 + hz * top * 2) % (top + 1));
        x += z * 0.06; y += z * 0.03;
        const tx = Math.floor(x), ty = Math.floor(y);
        if (w.indoor(tx, ty) || w.indoor(tx, ty, 1)) continue;
        const ax = x - R[0] * wid, ay = y - R[1] * wid, bx = x + R[0] * wid, by = y + R[1] * wid;
        g.vert(ax, ay, z, 0, 0, 1, c, 0.42, 0, 0); g.vert(bx, by, z, 0, 0, 1, c, 0.42, 0, 0); g.vert(bx + 0.045, by + 0.022, z + len, 0, 0, 1, c, 0.12, 0, 0);
        g.vert(ax, ay, z, 0, 0, 1, c, 0.42, 0, 0); g.vert(bx + 0.045, by + 0.022, z + len, 0, 0, 1, c, 0.12, 0, 0); g.vert(ax + 0.045, ay + 0.022, z + len, 0, 0, 1, c, 0.12, 0, 0);
      }
    }
    sunDir() {
      const th = Math.PI / 4 + this.cam.rot * Math.PI / 2 + 0.55;
      const v = [Math.cos(th) * 0.55, Math.sin(th) * 0.55, 0.74];
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    }
    updatePhase(sim, dt) {
      const px = sim._px === undefined ? sim.x : sim._px, py = sim._py === undefined ? sim.y : sim._py;
      const d = Math.hypot(sim.x - px, sim.y - py);
      if (d < 2) sim._ph = (sim._ph || 0) + d / (0.62 * Math.max(0.4, sim.scale)) * Math.PI;
      sim._px = sim.x; sim._py = sim.y;
    }
    pointVisible(x, y, m) { const p = this.cam.toScreen(x, y, 0.8); return p[0] > -80 && p[1] > -120 && p[0] < this.cam.w + 80 && p[1] < this.cam.h + 120; }
    boxVisible(x0, y0, x1, y1, h) {
      const cam = this.cam;
      let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
      for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) for (const z of [0, h]) { const p = cam.toScreen(x, y, z); a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); }
      return !(c < 0 || d < 0 || a > cam.w || b > cam.h);
    }
    fadeCandidates(pts) {
      const out = new Set();
      const cam = this.cam;
      for (const p of pts) {
        const sp = cam.toScreen(p[0], p[1], 0.9);
        const dp = cam.depth(p[0], p[1], 0.9);
        for (const bo of this.bigObjs.values()) {
          const cx = (bo.x0 + bo.x1) / 2, cy = (bo.y0 + bo.y1) / 2;
          if (cam.depth(cx, cy, 0) > dp) continue;
          let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
          for (const [x, y] of [[bo.x0, bo.y0], [bo.x1, bo.y0], [bo.x0, bo.y1], [bo.x1, bo.y1]]) for (const z of [0, bo.h]) { const q = cam.toScreen(x, y, z); a = Math.min(a, q[0]); b = Math.min(b, q[1]); c = Math.max(c, q[0]); d = Math.max(d, q[1]); }
          if (bo.tree) { const q = cam.toScreen(cx, cy, 0); a = q[0] - 1.6 * cam.s; c = q[0] + 1.6 * cam.s; }
          if (sp[0] > a && sp[0] < c && sp[1] > b && sp[1] < d) out.add(bo.id);
        }
      }
      return out;
    }
    doorLeaf(g, wl, open) {
      const d = S.DOORS[wl.door];
      const c = col(d.c);
      const hinge = wl.o === 'h' ? [wl.x + 0.1, wl.y] : [wl.x, wl.y + 0.1];
      const ang = open * 1.35;
      const dir = wl.o === 'h' ? [1, 0] : [0, 1];
      const perp = wl.o === 'h' ? [0, 1] : [1, 0];
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ax = [dir[0] * ca + perp[0] * sa, dir[1] * ca + perp[1] * sa];
      const nx = [-ax[1], ax[0]];
      g.setTransform(hinge[0], hinge[1], (wl.lv || 0) * WALL_H, ax[0], ax[1], nx[0], nx[1], 1);
      g.box(0, -0.035, 0.01, 0.8, 0.035, 2.18, c, { cell: 'wood' });
      if (d.style === 'glass') g.box(0.15, -0.04, 1.0, 0.65, 0.04, 1.9, [0.6, 0.75, 0.85], { e: 0.2 });
      if (d.style === 'fancy') { g.box(0.12, -0.045, 0.3, 0.68, 0.045, 1.0, mulCol(c, 1.15)); g.box(0.12, -0.045, 1.2, 0.68, 0.045, 1.95, mulCol(c, 1.15)); }
      g.sphere(0.7, 0.05, 1.05, 0.035, 0.035, 0.035, 5, 3, [0.85, 0.7, 0.35]);
      g.sphere(0.7, -0.05, 1.05, 0.035, 0.035, 0.035, 5, 3, [0.85, 0.7, 0.35]);
      g.clearTransform();
    }
    plumbob(g, head, lvl) {
      const colors = [[0.9, 0.15, 0.1], [0.95, 0.55, 0.1], [0.85, 0.85, 0.15], [0.35, 0.9, 0.25], [0.15, 0.95, 0.3]];
      const c = colors[Math.max(0, Math.min(4, lvl))];
      const z = head[2] + 0.35 + 0.04 * Math.sin(this.time * 2.5);
      const a = this.time * 1.8;
      const R = 0.1, Hh = 0.19;
      const pts = [];
      for (let i = 0; i < 4; i++) pts.push([head[0] + Math.cos(a + i * Math.PI / 2) * R, head[1] + Math.sin(a + i * Math.PI / 2) * R, z]);
      const top = [head[0], head[1], z + Hh], bot = [head[0], head[1], z - Hh * 1.2];
      for (let i = 0; i < 4; i++) {
        const p = pts[i], q = pts[(i + 1) % 4];
        const shade = 0.8 + 0.2 * Math.cos(a + i * Math.PI / 2 + 1);
        g.tri(p, q, top, [c[0] * shade, c[1] * shade, c[2] * shade], { e: 0.55 });
        g.tri(q, p, bot, [c[0] * shade * 0.8, c[1] * shade * 0.8, c[2] * shade * 0.8], { e: 0.45 });
      }
    }
    flames(g, f, dt) {
      if (!g) return;
      const cam = this.cam;
      const c = this.atlas.get('flame');
      const fz = (f.lv || 0) * WALL_H + 0.05;
      for (let i = 0; i < 4; i++) {
        const ph = this.time * (3 + i) + f.id * 1.7 + i;
        const x = f.x + 0.25 + (i % 2) * 0.5, y = f.y + 0.25 + Math.floor(i / 2) * 0.5;
        const s = 0.45 + 0.12 * Math.sin(ph);
        const h = 1.1 + 0.3 * Math.sin(ph * 1.3);
        const R = cam.R;
        const p0 = [x - R[0] * s, y - R[1] * s, fz], p1 = [x + R[0] * s, y + R[1] * s, fz];
        const p2 = [x + R[0] * s, y + R[1] * s, fz + h], p3 = [x - R[0] * s, y - R[1] * s, fz + h];
        const col = [1, 1, 1];
        g.vert(p0[0], p0[1], p0[2], 0, 0, 1, col, 0.9, c.u0, c.v1); g.vert(p1[0], p1[1], p1[2], 0, 0, 1, col, 0.9, c.u1, c.v1); g.vert(p2[0], p2[1], p2[2], 0, 0, 1, col, 0.9, c.u1, c.v0);
        g.vert(p0[0], p0[1], p0[2], 0, 0, 1, col, 0.9, c.u0, c.v1); g.vert(p2[0], p2[1], p2[2], 0, 0, 1, col, 0.9, c.u1, c.v0); g.vert(p3[0], p3[1], p3[2], 0, 0, 1, col, 0.9, c.u0, c.v0);
      }
    }
    waterObjs() { const out = []; for (const ob of this.world.objects.values()) if (ob.st && ob.st.water && (ob.t === 'shower' || ob.t === 'bathtub')) out.push(ob); return out; }
    showerWater(g, ob) {
      const f = footprint(OBJECTS[ob.t], ob.r);
      const cx = ob.x + (ob.t === 'bathtub' ? f[0] / 2 : 0.5), cy = ob.y + (ob.t === 'bathtub' ? f[1] / 2 : 0.5);
      for (let i = 0; i < 14; i++) {
        const a = i * 2.39 + this.time * 7;
        const r = 0.08 + (i % 4) * 0.05;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        const z0 = (ob.lv || 0) * WALL_H + 0.4 + ((this.time * 3 + i * 0.37) % 1) * 1.3;
        g.beam([x, y, z0], [x, y, z0 + 0.18], 0.006, [0.7, 0.85, 1], { e: 0.6 });
      }
    }

    pick(mx, my, opt) {
      opt = opt || {};
      const cam = this.cam, game = this.game, w = this.world;
      const ray = cam.ray(mx, my);
      const g0 = cam.ground(mx, my, 0);
      let best = null, bt = 1e9, tCut = 1e9;
      if (this.viewLv > 0 && this.focusLot >= 0 && !this.fullView && Math.abs(ray.d[2]) > 1e-6) {
        const tp = (this.viewLv * WALL_H + 0.03 - ray.o[2]) / ray.d[2];
        const px = Math.floor(ray.o[0] + ray.d[0] * tp), py = Math.floor(ray.o[1] + ray.d[1] * tp);
        if (tp > 0 && w.lotAt(px, py) === this.focusLot && w.hasFloor(px, py, this.viewLv)) tCut = tp + 0.02;
      }
      const test = (x0, y0, z0, x1, y1, z1) => {
        let tmin = -1e9, tmax = 1e9;
        const o = ray.o, d = ray.d;
        const lo = [x0, y0, z0], hi = [x1, y1, z1];
        for (let k = 0; k < 3; k++) {
          if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo[k] || o[k] > hi[k]) return null; continue; }
          let t1 = (lo[k] - o[k]) / d[k], t2 = (hi[k] - o[k]) / d[k];
          if (t1 > t2) { const q = t1; t1 = t2; t2 = q; }
          tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
          if (tmin > tmax) return null;
        }
        return tmin;
      };
      if (opt.sims !== false) for (const s of game.sims.values()) {
        if ((s.hidden && !s.ghost) || s.svc === 'reaper' && s.dead) continue;
        if (s.dead && !s.ghost) continue;
        if (this.hiddenLv(s.lv, s.lot)) continue;
        if (Math.abs(s.x - g0[0]) > 14 || Math.abs(s.y - g0[1]) > 14) continue;
        const k = s.scale, lie = s.lieH > 0.05;
        const bz = (s.lv || 0) * WALL_H + (s.zOff || 0) + (s.swimZ || 0);
        const t = test(s.x - 0.28, s.y - 0.28, bz, s.x + 0.28, s.y + 0.28, bz + (lie ? s.lieH + 0.4 : 1.85 * k + (s.sitH ? -0.3 : 0)));
        if (t !== null && t < bt && t < tCut) { bt = t; best = { kind: 'sim', sim: s }; }
      }
      if (opt.objs !== false) for (const ob of w.objects.values()) {
        if (Math.abs(ob.x - g0[0]) > 26 || Math.abs(ob.y - g0[1]) > 26) continue;
        const def = OBJECTS[ob.t];
        if (opt.filter && !opt.filter(ob)) continue;
        if (def.tree && !opt.trees) continue;
        if (this.hiddenLv(ob.lv, ob.lot)) continue;
        const f = footprint(def, ob.r);
        let z0 = 0, z1 = this.heightOf(ob.t);
        let x0 = ob.x, y0 = ob.y, x1 = ob.x + f[0], y1 = ob.y + f[1];
        if (ob.layer === 'surf') { const base = w.objAt(ob.x, ob.y, 'occ', ob.lv); const bh = base ? OBJECTS[base.t].surface || 0.75 : 0.75; z0 = bh; z1 = bh + Math.min(0.6, z1); x0 += 0.2; y0 += 0.2; x1 -= 0.2; y1 -= 0.2; }
        if (ob.layer === 'wall') { const back = (ob.r + 2) % 4; x0 = ob.x + (back === 3 ? 0 : back === 1 ? 0.85 : 0.1); x1 = ob.x + (back === 1 ? 1 : back === 3 ? 0.15 : 0.9); y0 = ob.y + (back === 0 ? 0 : back === 2 ? 0.85 : 0.1); y1 = ob.y + (back === 2 ? 1 : back === 0 ? 0.15 : 0.9); z0 = 1.0; z1 = 2.3; if (ob.t === 'alarm_smoke') { z0 = 2.3; z1 = 2.6; } }
        if (ob.layer === 'rug' || ob.layer === 'ground') { z1 = Math.max(0.12, z1); }
        if (ob.layer === 'ceil') { if (!opt.ceil) continue; x0 = ob.x + 0.2; y0 = ob.y + 0.2; x1 = ob.x + 0.8; y1 = ob.y + 0.8; z0 = 2.4; z1 = 2.98; }
        if (def.rabbit) z1 = Math.min(z1, 6);
        if (def.elevator) z1 = Math.min(z1, 2.4);
        if (ob.lv) { z0 += ob.lv * WALL_H; z1 += ob.lv * WALL_H; }
        const t = test(x0, y0, z0, x1, y1, z1);
        if (t !== null && t < tCut && (t < bt - 0.001 || (best && best.kind === 'obj' && ob.layer === 'surf' && Math.abs(t - bt) < 0.5))) { bt = t; best = { kind: 'obj', ob }; }
      }
      let tile = [Math.floor(g0[0]), Math.floor(g0[1])], gr = g0;
      if (this.viewLv > 0 && this.focusLot >= 0) {
        const gu = cam.ground(mx, my, this.viewLv * WALL_H);
        const tx = Math.floor(gu[0]), ty = Math.floor(gu[1]);
        if (w.lotAt(tx, ty) === this.focusLot) { tile = [tx, ty, this.viewLv]; gr = gu; }
      }
      return { hit: best, tile, ground: gr };
    }
  }

  Object.assign(S, { Renderer, Camera, ZOOMS, CHUNK: CH });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
