(function (Z) {
  'use strict';

  const CV = Z.COVER;
  const MAT = { grass: 0, steppe: 1, dirt: 2, forest: 3, sand: 4, rock: 5, mud: 6, rubble: 7 };

  Z.buildSplat = map => {
    const cols = map.cols, rows = map.rows, N = cols * rows;
    const w = new Float32Array(N * 8);
    const add = (i, m, v) => { w[i * 8 + m] += v; };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = map.x0 + (c + 0.5) * map.cell, z = map.z0 + (r + 0.5) * map.cell;
      const n = Z.noise2(x * 0.045, z * 0.045, 91), n2 = Z.noise2(x * 0.13, z * 0.13, 92);
      const k = map.cover[i], rm = map.roadMask[i];
      if (rm === 1) { add(i, MAT.rubble, 0.75); add(i, MAT.dirt, 0.25); continue; }
      if (rm === 2) { add(i, MAT.dirt, 0.8); add(i, MAT.steppe, 0.2); continue; }
      switch (k) {
        case CV.water: add(i, MAT.mud, 0.6); add(i, MAT.sand, 0.4); break;
        case CV.grass: add(i, MAT.grass, 0.35 + n * 0.4); add(i, MAT.steppe, 0.65 - n * 0.4); break;
        case CV.field: add(i, MAT.steppe, 0.4 + n * 0.3); add(i, MAT.dirt, 0.6 - n * 0.3); break;
        case CV.scrub: add(i, MAT.steppe, 0.5); add(i, MAT.grass, 0.3 * n2); add(i, MAT.dirt, 0.2 + 0.3 * (1 - n2)); break;
        case CV.park: add(i, MAT.grass, 0.65 + n * 0.2); add(i, MAT.forest, 0.15); add(i, MAT.dirt, 0.2 - n * 0.2 + 0.05); break;
        case CV.wood: add(i, MAT.forest, 0.6 + n * 0.3); add(i, MAT.grass, 0.4 - n * 0.3); break;
        case CV.wetland: add(i, MAT.mud, 0.5 + n * 0.3); add(i, MAT.grass, 0.5 - n * 0.3); break;
        case CV.sand: add(i, MAT.sand, 0.9); add(i, MAT.dirt, 0.1 * n); break;
        case CV.rock: add(i, MAT.rock, 0.8); add(i, MAT.steppe, 0.2); break;
        case CV.urban: add(i, MAT.rubble, 0.25 + n2 * 0.25); add(i, MAT.dirt, 0.3); add(i, MAT.grass, 0.15 + n * 0.25); add(i, MAT.steppe, 0.1); break;
        case CV.industrial: add(i, MAT.rubble, 0.55 + n * 0.2); add(i, MAT.dirt, 0.45 - n * 0.2); break;
        case CV.landfill: add(i, MAT.mud, 0.7); add(i, MAT.dirt, 0.3); break;
        case CV.cemetery: add(i, MAT.grass, 0.5); add(i, MAT.dirt, 0.3); add(i, MAT.forest, 0.2); break;
        case CV.pitch: add(i, MAT.grass, 0.55); add(i, MAT.dirt, 0.45); break;
        case CV.garden: add(i, MAT.grass, 0.4); add(i, MAT.dirt, 0.6); break;
        default: add(i, MAT.steppe, 0.45 + n * 0.3); add(i, MAT.grass, 0.25 * n2); add(i, MAT.dirt, 0.3 - n * 0.2 + 0.05);
      }
    }
    const b = new Float32Array(N * 8);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = Z.clamp(r + dr, 0, rows - 1), cc = Z.clamp(c + dc, 0, cols - 1), j = rr * cols + cc, k = dr === 0 && dc === 0 ? 4 : 1;
        for (let m = 0; m < 8; m++) b[i * 8 + m] += w[j * 8 + m] * k;
      }
    }
    const s0 = new Uint8Array(N * 4), s1 = new Uint8Array(N * 4), tint = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) {
      let t = 0;
      for (let m = 0; m < 8; m++) t += b[i * 8 + m];
      t = t || 1;
      for (let m = 0; m < 4; m++) { s0[i * 4 + m] = Math.round(b[i * 8 + m] / t * 255); s1[i * 4 + m] = Math.round(b[i * 8 + 4 + m] / t * 255); }
      const k = map.cover[i];
      tint[i * 4] = 128; tint[i * 4 + 1] = 128; tint[i * 4 + 2] = 128; tint[i * 4 + 3] = 0;
      if (k === CV.landfill) { tint[i * 4] = 190; tint[i * 4 + 1] = 92; tint[i * 4 + 2] = 70; tint[i * 4 + 3] = 220; }
    }
    return { s0, s1, tint };
  };

  Z.envAt = (minutes, wx) => {
    const hour = (minutes / 60) % 24;
    const rise = 6.2, set = 19.3;
    const dayT = (hour - rise) / (set - rise);
    let el, az;
    if (dayT >= 0 && dayT <= 1) { el = Math.sin(dayT * Math.PI) * 0.86; az = Z.lerp(-1.75, 1.75, dayT); }
    else {
      const nt = dayT > 1 ? (hour - set) / (24 - set + rise) : (hour + 24 - set) / (24 - set + rise);
      el = -Math.sin(Z.clamp(nt, 0, 1) * Math.PI) * 0.6;
      az = Z.lerp(1.75, 4.53, Z.clamp(nt, 0, 1));
    }
    const sunDir = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    const moonDir = [-sunDir[0] * 0.8 + 0.2, Math.max(0.25, -sunDir[1]), -sunDir[2]];
    const ml = Math.hypot(...moonDir); moonDir[0] /= ml; moonDir[1] /= ml; moonDir[2] /= ml;
    const day = Z.smooth(-0.12, 0.18, el), gold = Z.smooth(0.42, 0.04, el) * Z.smooth(-0.14, 0.02, el);
    const cover = wx ? wx.cloud : 0.3, dark = wx ? wx.dark : 0;
    const L = (a, b, t) => [Z.lerp(a[0], b[0], t), Z.lerp(a[1], b[1], t), Z.lerp(a[2], b[2], t)];
    let sunCol = L([1.02, 0.98, 0.88], [1.15, 0.62, 0.32], gold);
    sunCol = sunCol.map(v => v * day * (1 - cover * 0.55) * (1 - dark * 0.6) * 1.15);
    const nightTop = [0.02, 0.03, 0.07], nightHor = [0.05, 0.06, 0.1];
    let skyTop = L(nightTop, L([0.30, 0.48, 0.74], [0.32, 0.36, 0.55], gold), day);
    let skyHor = L(nightHor, L([0.70, 0.74, 0.76], [0.95, 0.62, 0.42], gold), day);
    const grey = [0.5, 0.52, 0.55].map(v => v * (0.25 + day * 0.75));
    skyTop = L(skyTop, grey, cover * 0.7);
    skyHor = L(skyHor, grey.map(v => v * 1.15), cover * 0.6);
    const ambTop = L([0.05, 0.06, 0.11], L([0.42, 0.46, 0.52], [0.42, 0.36, 0.38], gold), day).map(v => v * (1 - dark * 0.4));
    const ambBot = L([0.03, 0.03, 0.04], [0.26, 0.23, 0.18], day).map(v => v * (1 - dark * 0.4));
    const fogCol = L(skyHor, [0.6, 0.6, 0.6].map(v => v * (0.2 + day * 0.8)), (wx ? wx.fog : 0) * 0.6);
    const fogD = 0.00042 + (wx ? wx.fog * 0.0026 + wx.haze * 0.0007 : 0) + cover * 0.00012;
    return {
      hour, el, sunDir, moonDir, sunCol, skyTop, skyHor, ambTop, ambBot, fogCol,
      fog: [fogD, (wx ? wx.fog * 0.5 : 0.05) + 0.04, 4, 0],
      sky: [cover, dark, Z.smooth(0.05, -0.2, el) * (1 - cover), Z.smooth(0.0, -0.15, el) * (1 - cover * 0.8)],
      waterDeep: L([0.02, 0.03, 0.04], [0.07, 0.15, 0.15], day),
      waterShallow: L([0.03, 0.04, 0.05], [0.2, 0.27, 0.22], day),
      night: 1 - day
    };
  };

  class Program {
    constructor(gl, vs, fs, name) {
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(s);
          const lines = src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n');
          throw new Error('shader ' + name + ': ' + log + '\n' + lines.slice(0, 200));
        }
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link ' + name + ': ' + gl.getProgramInfoLog(p));
      this.gl = gl;
      this.p = p;
      this.u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        const nm = info.name.replace(/\[0\]$/, '');
        this.u[nm] = gl.getUniformLocation(p, info.name);
      }
    }
    use() { this.gl.useProgram(this.p); return this; }
  }
  Z.Program = Program;

  class Renderer {
    constructor(canvas) {
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL2 недоступен');
      this.gl = gl;
      this.canvas = canvas;
      this.extFloat = gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      this.prog = {};
      this.stats = { draws: 0, tris: 0 };
      this.time = 0;
      this.view = new Float32Array(16);
      this.proj = new Float32Array(16);
      this.vp = new Float32Array(16);
      this.invVP = new Float32Array(16);
      this.frustum = new Float32Array(24);
      this.points = [];
      this.initPrograms();
      this.initDummyShadow();
    }

    initPrograms() {
      const G = Z.GLSL, gl = this.gl;
      this.prog.terrain = new Program(gl, G.TERRAIN_VS, G.TERRAIN_FS, 'terrain');
      this.prog.water = new Program(gl, G.WATER_VS, G.WATER_FS, 'water');
      this.prog.sky = new Program(gl, G.SKY_VS, G.SKY_FS, 'sky');
    }

    initDummyShadow() {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, 1, 1, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, new Uint32Array([0xffffffff]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.dummyShadow = t;
      this.shadowTex = t;
      this.shadowVP = Z.M4.ident();
      this.shadowP = [0, 0, 0, 0];
    }

    texArray(canvases, opts = {}) {
      const gl = this.gl, S = canvases[0].width, H = canvases[0].height;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
      gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, S, H, canvases.length, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      canvases.forEach((c, i) => gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, S, H, 1, gl.RGBA, gl.UNSIGNED_BYTE, c));
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, opts.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, opts.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      if (this.aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      return t;
    }

    tex2D(w, h, data, opts = {}) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (opts.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, data);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      const f = opts.nearest ? gl.NEAREST : gl.LINEAR;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    initWorld(map) {
      const gl = this.gl;
      this.map = map;
      this.hTex = this.tex2D(map.vcols, map.vrows, map.h, { float: true, nearest: true });
      const sp = Z.buildSplat(map);
      this.splat0 = this.tex2D(map.cols, map.rows, sp.s0);
      this.splat1 = this.tex2D(map.cols, map.rows, sp.s1);
      this.tintTex = this.tex2D(map.cols, map.rows, sp.tint);
      this.matTex = this.texArray(Z.Tex.terrain(256));
      this.buildTerrainTemplate();
      this.buildMinMax();
      this.buildWaterMesh();
      this.skyVao = gl.createVertexArray();
    }

    buildTerrainTemplate() {
      const gl = this.gl, N = 32, verts = [], idx = [];
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) verts.push(i, 0, j);
      const base = (N + 1) * (N + 1);
      const edges = [];
      for (let i = 0; i <= N; i++) edges.push([i, 0]);
      for (let j = 0; j <= N; j++) edges.push([N, j]);
      for (let i = N; i >= 0; i--) edges.push([i, N]);
      for (let j = N; j >= 0; j--) edges.push([0, j]);
      for (const [i, j] of edges) verts.push(i, 1, j);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      for (let e = 0; e + 1 < edges.length; e++) {
        const [i0, j0] = edges[e], [i1, j1] = edges[e + 1];
        if (i0 === i1 && j0 === j1) continue;
        const t0 = j0 * (N + 1) + i0, t1 = j1 * (N + 1) + i1, b0 = base + e, b1 = base + e + 1;
        idx.push(t0, b0, t1, t1, b0, b1, t0, t1, b0, t1, b1, b0);
      }
      this.tvao = gl.createVertexArray();
      gl.bindVertexArray(this.tvao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      this.tCount = idx.length;
      this.tN = N;
    }

    buildMinMax() {
      const m = this.map, T = 64;
      const cx = (m.x0 + m.x1) / 2, cz = (m.z0 + m.z1) / 2;
      this.rootSize = 8192;
      this.rootX = Math.floor((cx - this.rootSize / 2) / T) * T;
      this.rootZ = Math.floor((cz - this.rootSize / 2) / T) * T;
      const n = this.rootSize / T;
      const mn = new Float32Array(n * n), mx = new Float32Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const x0 = this.rootX + i * T, z0 = this.rootZ + j * T;
        let a = Infinity, b = -Infinity;
        for (let s = 0; s <= 4; s++) for (let t = 0; t <= 4; t++) {
          const h = m.groundH(Z.clamp(x0 + s * 16, m.x0, m.x1 - 0.01), Z.clamp(z0 + t * 16, m.z0, m.z1 - 0.01));
          if (h < a) a = h; if (h > b) b = h;
        }
        mn[j * n + i] = a - 3; mx[j * n + i] = b + 3;
      }
      this.mmLevels = [{ n, mn, mx }];
      let lv = this.mmLevels[0];
      while (lv.n > 1) {
        const n2 = lv.n / 2, a = new Float32Array(n2 * n2), b = new Float32Array(n2 * n2);
        for (let j = 0; j < n2; j++) for (let i = 0; i < n2; i++) {
          let p = Infinity, q = -Infinity;
          for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) { const k = (j * 2 + dj) * lv.n + i * 2 + di; p = Math.min(p, lv.mn[k]); q = Math.max(q, lv.mx[k]); }
          a[j * n2 + i] = p; b[j * n2 + i] = q;
        }
        lv = { n: n2, mn: a, mx: b };
        this.mmLevels.push(lv);
      }
    }

    nodeRange(x, z, size) {
      const lvl = Math.round(Math.log2(size / 64));
      const L = this.mmLevels[Math.min(lvl, this.mmLevels.length - 1)];
      const s = 64 * Math.pow(2, lvl);
      const i = Math.floor((x - this.rootX) / s), j = Math.floor((z - this.rootZ) / s);
      if (i < 0 || j < 0 || i >= L.n || j >= L.n) return [-8, 60];
      return [L.mn[j * L.n + i], L.mx[j * L.n + i]];
    }

    buildWaterMesh() {
      const gl = this.gl, R = 6000, n = 24, v = [], idx = [];
      const cx = (this.map.x0 + this.map.x1) / 2, cz = (this.map.z0 + this.map.z1) / 2;
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) v.push(cx - R + (2 * R) * i / n, 0, cz - R + (2 * R) * j / n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      this.wvao = gl.createVertexArray();
      gl.bindVertexArray(this.wvao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      this.wCount = idx.length;
    }

    resize() {
      const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2) * (this.scale || 1);
      const w = Math.max(2, Math.round(c.clientWidth * dpr)), h = Math.max(2, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      return [w, h];
    }

    setCamera(cam) {
      const M = Z.M4;
      const cy = Math.cos(cam.pitch), fx = Math.sin(cam.yaw) * cy, fy = Math.sin(cam.pitch), fz = -Math.cos(cam.yaw) * cy;
      M.lookAt(cam.x, cam.y, cam.z, cam.x + fx, cam.y + fy, cam.z + fz, 0, 1, 0, this.view);
      const [w, h] = [this.canvas.width, this.canvas.height];
      M.persp(cam.fov, w / h, cam.near || 0.1, cam.far || 4000, this.proj);
      M.mul(this.proj, this.view, this.vp);
      M.invert(this.vp, this.invVP);
      this.eye = [cam.x, cam.y, cam.z];
      this.cam = cam;
      const m = this.vp, f = this.frustum;
      const planes = [[3, 0], [3, 0, -1], [3, 1], [3, 1, -1], [3, 2], [3, 2, -1]];
      planes.forEach((p, k) => {
        const s = p[2] === -1 ? -1 : 1;
        let a = m[3] + s * m[p[1]], b = m[7] + s * m[4 + p[1]], c = m[11] + s * m[8 + p[1]], d = m[15] + s * m[12 + p[1]];
        const L = Math.hypot(a, b, c) || 1;
        f[k * 4] = a / L; f[k * 4 + 1] = b / L; f[k * 4 + 2] = c / L; f[k * 4 + 3] = d / L;
      });
    }

    boxVisible(x0, y0, z0, x1, y1, z1) {
      const f = this.frustum;
      for (let k = 0; k < 6; k++) {
        const a = f[k * 4], b = f[k * 4 + 1], c = f[k * 4 + 2], d = f[k * 4 + 3];
        if (a * (a > 0 ? x1 : x0) + b * (b > 0 ? y1 : y0) + c * (c > 0 ? z1 : z0) + d < 0) return false;
      }
      return true;
    }

    setEnvUniforms(p) {
      const gl = this.gl, e = this.env, u = p.u;
      if (u.uEye) gl.uniform3fv(u.uEye, this.eye);
      if (u.uSunDir) gl.uniform3fv(u.uSunDir, e.sunDir);
      if (u.uSunCol) gl.uniform3fv(u.uSunCol, e.sunCol);
      if (u.uSkyTop) gl.uniform3fv(u.uSkyTop, e.skyTop);
      if (u.uSkyHor) gl.uniform3fv(u.uSkyHor, e.skyHor);
      if (u.uAmbTop) gl.uniform3fv(u.uAmbTop, e.ambTop);
      if (u.uAmbBot) gl.uniform3fv(u.uAmbBot, e.ambBot);
      if (u.uFogCol) gl.uniform3fv(u.uFogCol, e.fogCol);
      if (u.uFog) gl.uniform4fv(u.uFog, e.fog);
      if (u.uTime) gl.uniform1f(u.uTime, this.time);
      if (u.uNumPoints) {
        const pts = this.points, n = Math.min(8, pts.length);
        gl.uniform1i(u.uNumPoints, n);
        if (n) {
          const a = new Float32Array(32), b = new Float32Array(32);
          for (let i = 0; i < n; i++) { a.set([pts[i].x, pts[i].y, pts[i].z, pts[i].r], i * 4); b.set([pts[i].c[0], pts[i].c[1], pts[i].c[2], 1], i * 4); }
          gl.uniform4fv(u.uPoint, a);
          gl.uniform4fv(u.uPointCol, b);
        }
      }
      if (u.uShadow) {
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
        gl.uniform1i(u.uShadow, 7);
        gl.uniformMatrix4fv(u.uShadowVP, false, this.shadowVP);
        gl.uniform4fv(u.uShadowP, this.shadowP);
      }
    }

    drawTerrain() {
      const gl = this.gl, p = this.prog.terrain.use(), u = p.u, m = this.map;
      this.setEnvUniforms(p);
      gl.uniformMatrix4fv(u.uVP, false, this.vp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.hTex); gl.uniform1i(u.uHeight, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.splat0); gl.uniform1i(u.uSplat0, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.splat1); gl.uniform1i(u.uSplat1, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.matTex); gl.uniform1i(u.uMat, 3);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.tintTex); gl.uniform1i(u.uTint, 4);
      gl.uniform4f(u.uMap, m.x0, m.z0, m.cell, 0);
      gl.uniform2i(u.uHSize, m.vcols, m.vrows);
      gl.uniform2f(u.uCov, m.cols, m.rows);
      gl.bindVertexArray(this.tvao);
      const ex = this.eye[0], ez = this.eye[2], ey = this.eye[1];
      const farD = (this.cam.far || 4000) * 0.9;
      const nodes = [];
      const visit = (x, z, size) => {
        const [y0, y1] = this.nodeRange(x, z, size);
        const dx = Math.max(x - ex, 0, ex - (x + size)), dz = Math.max(z - ez, 0, ez - (z + size)), dy = Math.max(y0 - ey, 0, ey - y1);
        const d = Math.hypot(dx, dz, dy);
        if (d > farD) return;
        if (!this.boxVisible(x, y0, z, x + size, y1, z + size)) return;
        if (size > 64 && d < size * 1.35) {
          const h = size / 2;
          visit(x, z, h); visit(x + h, z, h); visit(x, z + h, h); visit(x + h, z + h, h);
          return;
        }
        nodes.push([x, z, size]);
      };
      visit(this.rootX, this.rootZ, this.rootSize);
      for (const [x, z, size] of nodes) {
        gl.uniform4f(u.uNode, x, z, size / this.tN, 0);
        gl.drawElements(gl.TRIANGLES, this.tCount, gl.UNSIGNED_SHORT, 0);
      }
      this.stats.draws += nodes.length;
      this.stats.terrainNodes = nodes.length;
      gl.bindVertexArray(null);
    }

    drawSky() {
      const gl = this.gl, p = this.prog.sky.use(), u = p.u, e = this.env;
      this.setEnvUniforms(p);
      gl.uniformMatrix4fv(u.uInvVP, false, this.invVP);
      gl.uniform4fv(u.uSky, e.sky);
      gl.uniform3fv(u.uMoonDir, e.moonDir);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.bindVertexArray(this.skyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.depthMask(true);
      gl.depthFunc(gl.LESS);
    }

    drawWater() {
      const gl = this.gl, p = this.prog.water.use(), u = p.u, m = this.map, e = this.env;
      this.setEnvUniforms(p);
      gl.uniformMatrix4fv(u.uVP, false, this.vp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.hTex); gl.uniform1i(u.uHeight, 0);
      gl.uniform4f(u.uMap, m.x0, m.z0, m.cell, 0);
      gl.uniform2i(u.uHSize, m.vcols, m.vrows);
      gl.uniform1f(u.uLevel, Z.WATER_Y);
      gl.uniform3fv(u.uWaterDeep, e.waterDeep);
      gl.uniform3fv(u.uWaterShallow, e.waterShallow);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.bindVertexArray(this.wvao);
      gl.drawElements(gl.TRIANGLES, this.wCount, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    }

    frame(cam, env, dt, hooks = {}) {
      const gl = this.gl;
      this.time += dt;
      this.env = env;
      const [w, h] = this.resize();
      this.setCamera(cam);
      this.stats.draws = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.clearColor(env.fogCol[0], env.fogCol[1], env.fogCol[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      if (hooks.shadow) hooks.shadow(this);
      gl.viewport(0, 0, w, h);
      if (!hooks.interior) this.drawTerrain();
      if (hooks.opaque) hooks.opaque(this);
      if (!hooks.interior) { this.drawSky(); this.drawWater(); }
      if (hooks.transparent) hooks.transparent(this);
      if (hooks.overlay) hooks.overlay(this);
    }
  }

  Z.Renderer = Renderer;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
