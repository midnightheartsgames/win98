(function (Q) {
  'use strict';
  const M4 = Q.M4;
  const NDL = 8;
  const GRADE = `
uniform float uGamma; uniform float uContrast;
vec3 grade(vec3 c) {
  c = pow(max(c, vec3(0.0)), vec3(1.0 / uGamma));
  return clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
}`;

  const WORLD_VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec2 aLM; attribute vec3 aN;
uniform mat4 uVP;
varying vec2 vUV; varying vec2 vLM; varying vec3 vPos; varying vec3 vN;
void main() { vUV = aUV; vLM = aLM; vPos = aPos; vN = aN; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const WORLD_FS = `
precision highp float;
uniform sampler2D uTex; uniform sampler2D uLm;
uniform float uMode; uniform float uTime; uniform float uBright;
uniform vec4 uDL[${NDL}]; uniform vec3 uDLC[${NDL}];
varying vec2 vUV; varying vec2 vLM; varying vec3 vPos; varying vec3 vN;${GRADE}
void main() {
  vec2 uv = vUV;
  if (uMode > 0.5 && uMode < 1.5) uv += vec2(sin(vUV.y * 6.2831 + uTime * 0.9), cos(vUV.x * 6.2831 + uTime * 0.8)) * 0.05 + vec2(uTime * 0.015, uTime * 0.01);
  vec4 t = texture2D(uTex, uv);
  vec3 c;
  if (uMode > 0.5 && uMode < 1.5) c = t.rgb * (1.05 + 0.2 * sin(uTime * 2.0 + vUV.x * 5.0));
  else if (uMode > 1.5) c = t.rgb * 1.3;
  else {
    vec3 lm = texture2D(uLm, vLM).rgb * 2.0;
    vec3 dl = vec3(0.0);
    vec3 n = normalize(vN);
    for (int i = 0; i < ${NDL}; i++) {
      vec3 L = uDL[i].xyz - vPos; float r = uDL[i].w; float d = length(L);
      if (r > 0.0 && d < r) { float a = 1.0 - d / r; dl += uDLC[i] * a * a * max(0.2, dot(n, L / max(d, 0.001))); }
    }
    c = t.rgb * (lm + dl);
  }
  gl_FragColor = vec4(grade(c * uBright), 1.0);
}`;

  const SKY_VS = `
attribute vec3 aPos; uniform mat4 uVP; varying vec3 vPos;
void main() { vPos = aPos; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const SKY_FS = `
precision highp float;
uniform vec3 uCam; uniform sampler2D uSky; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uCloud; uniform float uTime; uniform float uSpeed; uniform float uBright;
varying vec3 vPos;${GRADE}
void main() {
  vec3 d = normalize(vPos - uCam);
  float h = clamp(d.z, 0.0, 1.0);
  vec2 st = d.xy / (max(d.z, 0.0) + 0.3) * 0.32;
  float c1 = texture2D(uSky, st + vec2(uTime * uSpeed, uTime * uSpeed * 0.4)).r;
  float c2 = texture2D(uSky, st * 1.9 + vec2(-uTime * uSpeed * 0.6, uTime * uSpeed * 0.9)).r;
  float cl = clamp(c1 * 0.75 + c2 * 0.55 - 0.3, 0.0, 1.0);
  vec3 base = mix(uHor, uTop, pow(h, 0.55));
  vec3 col = mix(base, uCloud, cl * (0.25 + 0.75 * h));
  gl_FragColor = vec4(grade(col * uBright), 1.0);
}`;

  const MODEL_VS = `
attribute vec3 aPos; attribute vec3 aN; attribute vec3 aCol; attribute float aGlow;
uniform mat4 uVP; uniform mat4 uM; uniform float uInflate;
varying vec3 vN; varying vec3 vCol; varying float vGlow; varying vec3 vPos;
void main() {
  vec4 wp = uM * vec4(aPos + aN * uInflate, 1.0);
  vPos = wp.xyz; vN = (uM * vec4(aN, 0.0)).xyz; vCol = aCol; vGlow = aGlow;
  gl_Position = uVP * wp;
}`;

  const MODEL_FS = `
precision highp float;
uniform vec3 uAmb; uniform vec3 uDCol; uniform vec3 uDir; uniform vec4 uShell; uniform float uAlpha; uniform float uBright; uniform float uSpec; uniform vec3 uEye; uniform float uTwo;
uniform vec4 uDL[${NDL}]; uniform vec3 uDLC[${NDL}];
varying vec3 vN; varying vec3 vCol; varying float vGlow; varying vec3 vPos;${GRADE}
void main() {
  vec3 n = normalize(vN);
  if (uShell.a > 0.0) { gl_FragColor = vec4(uShell.rgb * (0.45 + 0.55 * abs(n.z)), uShell.a); return; }
  if (uTwo > 0.5 && !gl_FrontFacing) n = -n;
  vec3 light = uAmb + uDCol * max(0.0, dot(n, uDir));
  for (int i = 0; i < ${NDL}; i++) {
    vec3 L = uDL[i].xyz - vPos; float r = uDL[i].w; float d = length(L);
    if (r > 0.0 && d < r) { float a = 1.0 - d / r; light += uDLC[i] * a * a * max(0.0, dot(n, L / max(d, 0.001))); }
  }
  vec3 c = vCol * light + vCol * vGlow * 1.3;
  if (uSpec > 0.0) {
    vec3 v = normalize(uEye - vPos);
    vec3 h = normalize(v + uDir);
    c += vec3(1.0, 0.85, 0.8) * pow(max(0.0, dot(n, h)), 24.0) * uSpec;
  }
  gl_FragColor = vec4(grade(c * uBright), uAlpha);
}`;

  const SPR_VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; varying vec2 vUV; varying vec4 vCol;
void main() { vUV = aUV; vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const SPR_FS = `
precision mediump float;
uniform sampler2D uTex; uniform float uAdd; varying vec2 vUV; varying vec4 vCol;${GRADE}
void main() {
  vec4 t = texture2D(uTex, vUV) * vCol;
  vec3 g = pow(max(t.rgb, vec3(0.0)), vec3(1.0 / uGamma));
  if (uAdd < 0.5) g = clamp((g - 0.5) * uContrast + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(g, t.a);
}`;

  function compile(gl, vs, fs) {
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
    const u = {}, a = {};
    const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nu; i++) { const inf = gl.getActiveUniform(p, i); const name = inf.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, inf.name); }
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) { const inf = gl.getActiveAttrib(p, i); a[inf.name] = gl.getAttribLocation(p, inf.name); }
    return { p, u, a };
  }

  class Renderer {
    constructor(canvas) {
      this.cv = canvas;
      const opts = { antialias: false, alpha: false, depth: true, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' };
      const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      if (!gl) throw new Error('WebGL is not available');
      this.gl = gl;
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      this.pw = compile(gl, WORLD_VS, WORLD_FS);
      this.ps = compile(gl, SKY_VS, SKY_FS);
      this.pm = compile(gl, MODEL_VS, MODEL_FS);
      this.pp = compile(gl, SPR_VS, SPR_FS);
      this.tex = {};
      this.meshes = new Map();
      this.sprBuf = gl.createBuffer();
      this.sprData = new Float32Array(9 * 6 * 4096);
      this.bright = 1;
      this.gamma = 1;
      this.contrast = 1;
      this.filter = 'trilinear';
      this.white = this.makeTex('white', 2, 2, new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]));
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
      this.dl = new Float32Array(NDL * 4);
      this.dlc = new Float32Array(NDL * 3);
      this.world = null;
    }

    makeTex(key, w, h, data, o) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      this.params(t, o || {}, w, h);
      this.tex[key] = t;
      return t;
    }

    params(t, o, w, h) {
      const gl = this.gl;
      const pot = (w & (w - 1)) === 0 && (h & (h - 1)) === 0;
      const clamp = o.clamp || !pot;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      const near = this.filter === 'nearest' && !o.lin;
      if (pot && !o.noMip) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, near ? gl.NEAREST_MIPMAP_NEAREST : this.filter === 'bilinear' ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
        if (this.aniso && !near) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, near ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, near ? gl.NEAREST : gl.LINEAR);
    }

    getTex(key) {
      if (this.tex[key]) return this.tex[key];
      const t = Q.genTexture(key);
      const img = t.toImage();
      const gl = this.gl;
      const tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      const decal = !!Q.DECALGEN[key];
      this.params(tx, { clamp: decal && key !== 'beam' && key !== 'bolt' }, t.w, t.h);
      if (key === 'beam' || key === 'bolt') {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      this.tex[key] = tx;
      return tx;
    }

    setFilter(f) {
      if (f === this.filter) return;
      this.filter = f;
      const keep = { white: this.tex.white };
      if (this.lmKey) keep[this.lmKey] = this.tex[this.lmKey];
      for (const k of Object.keys(this.tex)) if (!keep[k]) this.gl.deleteTexture(this.tex[k]);
      this.tex = keep;
    }

    resize(w, h) {
      if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    }

    loadWorld(world, baker) {
      const gl = this.gl;
      this.freeWorld();
      const groups = new Map();
      const sky = [];
      for (const f of world.faces) {
        const info = Q.matInfo(f.mat);
        if (info.sky) {
          for (let i = 1; i + 1 < f.verts.length; i++) for (const v of [f.verts[0], f.verts[i], f.verts[i + 1]]) sky.push(v[0], v[1], v[2]);
          continue;
        }
        const mt = Q.MAT_TEX[f.mat] || { tex: 'stone', size: 128 };
        const key = f.mat;
        if (!groups.has(key)) groups.set(key, { mat: f.mat, mt, data: [] });
        const g = groups.get(key);
        const ax = Q.lmAxes(f.n);
        const uvOf = v => {
          let u, vv;
          if (ax[2] === 2) { u = v[0]; vv = -v[1]; }
          else { u = ax[0] === 0 ? v[0] : v[1]; vv = -v[2]; }
          return [(u + (f.uv[0] || 0)) / (mt.sx || mt.size), (vv + (f.uv[1] || 0)) / (mt.sy || mt.size)];
        };
        const vs = f.verts;
        for (let i = 1; i + 1 < vs.length; i++) {
          for (const v of [vs[0], vs[i], vs[i + 1]]) {
            const uv = uvOf(v), lm = baker ? baker.faceUV(f, v) : [0, 0];
            g.data.push(v[0], v[1], v[2], uv[0], uv[1], lm[0], lm[1], f.n[0], f.n[1], f.n[2]);
          }
        }
      }
      this.wgroups = [];
      for (const g of groups.values()) {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.data), gl.STATIC_DRAW);
        const info = Q.matInfo(g.mat);
        this.wgroups.push({ buf, count: g.data.length / 10, tex: g.mt.tex, mode: g.mt.lava || info.liquid ? 1 : g.mt.glow || info.fullbright ? 2 : 0 });
      }
      this.skyBuf = null;
      if (sky.length) {
        this.skyBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sky), gl.STATIC_DRAW);
        this.skyCount = sky.length / 3;
      }
      this.lmKey = 'lm_' + world.id;
      if (baker) this.makeTex(this.lmKey, baker.W, baker.H, baker.bytes, { clamp: true, noMip: true, lin: true });
      else this.makeTex(this.lmKey, 2, 2, new Uint8Array(16).fill(160), { clamp: true, noMip: true });
      this.world = world;
      this.grid = baker ? baker.grid : null;
      this.skyDef = world.def.sky || null;
      this.decals = world.decals.map(d => this.decalQuad(d));
    }

    freeWorld() {
      const gl = this.gl;
      if (this.wgroups) for (const g of this.wgroups) gl.deleteBuffer(g.buf);
      if (this.skyBuf) gl.deleteBuffer(this.skyBuf);
      if (this.lmKey && this.tex[this.lmKey]) { gl.deleteTexture(this.tex[this.lmKey]); delete this.tex[this.lmKey]; }
      this.wgroups = [];
      this.skyBuf = null;
      this.world = null;
    }

    decalQuad(d) {
      const n = Q.vnorm(d.n);
      let u = Math.abs(n[2]) > 0.9 ? [1, 0, 0] : Q.vnorm(Q.vcross([0, 0, 1], n));
      let v = Q.vcross(n, u);
      if (d.rot) {
        const c = Math.cos(d.rot), s = Math.sin(d.rot);
        const u2 = Q.vadd(Q.vscale(u, c), Q.vscale(v, s)), v2 = Q.vsub(Q.vscale(v, c), Q.vscale(u, s));
        u = u2; v = v2;
      }
      const h = d.size / 2;
      const p = d.pos;
      const P = (a, b) => Q.vadd(Q.vadd(p, Q.vscale(u, a * h)), Q.vscale(v, b * h));
      return { tex: d.tex, pts: [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)], glow: d.glow, n };
    }

    getMesh(m) {
      let e = this.meshes.get(m);
      if (e) return e;
      const gl = this.gl;
      const data = new Float32Array(m.count * 10);
      for (let i = 0; i < m.count; i++) {
        data.set(m.pos.subarray(i * 3, i * 3 + 3), i * 10);
        data.set(m.nrm.subarray(i * 3, i * 3 + 3), i * 10 + 3);
        data.set(m.col.subarray(i * 3, i * 3 + 3), i * 10 + 6);
        data[i * 10 + 9] = m.glow[i];
      }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      e = { buf, count: m.count };
      this.meshes.set(m, e);
      return e;
    }

    grading(p) {
      const gl = this.gl;
      gl.uniform1f(p.u.uGamma, Math.max(0.2, this.gamma));
      gl.uniform1f(p.u.uContrast, this.contrast);
    }

    setDynLights(prog, lights) {
      const gl = this.gl;
      this.dl.fill(0); this.dlc.fill(0);
      for (let i = 0; i < Math.min(NDL, lights.length); i++) {
        const l = lights[i];
        this.dl[i * 4] = l.pos[0]; this.dl[i * 4 + 1] = l.pos[1]; this.dl[i * 4 + 2] = l.pos[2]; this.dl[i * 4 + 3] = l.r;
        this.dlc[i * 3] = l.col[0]; this.dlc[i * 3 + 1] = l.col[1]; this.dlc[i * 3 + 2] = l.col[2];
      }
      gl.uniform4fv(prog.u.uDL, this.dl);
      gl.uniform3fv(prog.u.uDLC, this.dlc);
    }

    camera(view) {
      const aspect = view.w / view.h;
      const fovx = (view.fov || 90) * Q.DEG;
      const fovy = 2 * Math.atan(Math.tan(fovx / 2) / (4 / 3)) ;
      const fy = aspect >= 4 / 3 ? fovy : 2 * Math.atan(Math.tan(fovx / 2) / aspect);
      const proj = M4.persp(fy, aspect, 4, 12000);
      const vm = M4.view(view.pos, view.yaw, view.pitch, view.roll || 0);
      return { proj, vm, vp: M4.mul(proj, vm), fovy: fy };
    }

    begin(view) {
      const gl = this.gl;
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    drawWorld(cam, view, time, dlights) {
      const gl = this.gl;
      if (!this.world) return;
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
      if (this.skyBuf && this.skyDef) {
        const p = this.ps;
        gl.useProgram(p.p);
        gl.uniformMatrix4fv(p.u.uVP, false, cam.vp);
        gl.uniform3fv(p.u.uCam, view.pos);
        gl.uniform3fv(p.u.uTop, this.skyDef.top);
        gl.uniform3fv(p.u.uHor, this.skyDef.horizon);
        gl.uniform3fv(p.u.uCloud, this.skyDef.cloud);
        gl.uniform1f(p.u.uTime, time);
        gl.uniform1f(p.u.uSpeed, this.skyDef.speed || 0.01);
        gl.uniform1f(p.u.uBright, this.bright);
        this.grading(p);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.getTex('sky'));
        gl.uniform1i(p.u.uSky, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
        gl.enableVertexAttribArray(p.a.aPos);
        gl.vertexAttribPointer(p.a.aPos, 3, gl.FLOAT, false, 12, 0);
        gl.drawArrays(gl.TRIANGLES, 0, this.skyCount);
        gl.disableVertexAttribArray(p.a.aPos);
      }
      const p = this.pw;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, cam.vp);
      gl.uniform1f(p.u.uTime, time);
      gl.uniform1f(p.u.uBright, this.bright);
      this.grading(p);
      this.setDynLights(p, dlights);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[this.lmKey]);
      gl.uniform1i(p.u.uLm, 1);
      gl.uniform1i(p.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      for (const k of ['aPos', 'aUV', 'aLM', 'aN']) gl.enableVertexAttribArray(p.a[k]);
      for (const g of this.wgroups) {
        gl.bindTexture(gl.TEXTURE_2D, this.getTex(g.tex));
        gl.uniform1f(p.u.uMode, g.mode);
        gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
        gl.vertexAttribPointer(p.a.aPos, 3, gl.FLOAT, false, 40, 0);
        gl.vertexAttribPointer(p.a.aUV, 2, gl.FLOAT, false, 40, 12);
        gl.vertexAttribPointer(p.a.aLM, 2, gl.FLOAT, false, 40, 20);
        gl.vertexAttribPointer(p.a.aN, 3, gl.FLOAT, false, 40, 28);
        gl.drawArrays(gl.TRIANGLES, 0, g.count);
      }
      for (const k of ['aPos', 'aUV', 'aLM', 'aN']) gl.disableVertexAttribArray(p.a[k]);
    }

    lightAt(pos) {
      const o = {};
      if (this.grid) Q.sampleGrid(this.grid, pos, o);
      else { o.amb = [0.55, 0.52, 0.5]; o.dcol = [0.5, 0.48, 0.45]; o.dir = Q.vnorm([0.3, 0.2, 1]); }
      return o;
    }

    beginModels(cam, dlights, eye) {
      const gl = this.gl, p = this.pm;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, cam.vp);
      gl.uniform1f(p.u.uBright, this.bright);
      this.grading(p);
      gl.uniform3fv(p.u.uEye, eye || [0, 0, 0]);
      this.setDynLights(p, dlights || []);
      for (const k of ['aPos', 'aN', 'aCol', 'aGlow']) gl.enableVertexAttribArray(p.a[k]);
    }

    endModels() {
      const gl = this.gl, p = this.pm;
      for (const k of ['aPos', 'aN', 'aCol', 'aGlow']) gl.disableVertexAttribArray(p.a[k]);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    drawMesh(mesh, m, lit, o) {
      const gl = this.gl, p = this.pm;
      o = o || {};
      const e = this.getMesh(mesh);
      gl.uniformMatrix4fv(p.u.uM, false, m);
      gl.uniform3fv(p.u.uAmb, lit.amb);
      gl.uniform3fv(p.u.uDCol, lit.dcol);
      gl.uniform3fv(p.u.uDir, lit.dir);
      gl.uniform1f(p.u.uSpec, o.spec || 0);
      gl.uniform1f(p.u.uTwo, o.twoSided ? 1 : 0);
      if (o.twoSided) gl.disable(gl.CULL_FACE);
      gl.bindBuffer(gl.ARRAY_BUFFER, e.buf);
      gl.vertexAttribPointer(p.a.aPos, 3, gl.FLOAT, false, 40, 0);
      gl.vertexAttribPointer(p.a.aN, 3, gl.FLOAT, false, 40, 12);
      gl.vertexAttribPointer(p.a.aCol, 3, gl.FLOAT, false, 40, 24);
      gl.vertexAttribPointer(p.a.aGlow, 1, gl.FLOAT, false, 40, 36);
      if (o.alpha !== undefined && o.alpha < 1) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      }
      gl.uniform1f(p.u.uAlpha, o.alpha === undefined ? 1 : o.alpha);
      gl.uniform4f(p.u.uShell, 0, 0, 0, 0);
      gl.uniform1f(p.u.uInflate, 0);
      gl.drawArrays(gl.TRIANGLES, 0, e.count);
      if (o.shell) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
        gl.uniform4f(p.u.uShell, o.shell[0], o.shell[1], o.shell[2], o.shell[3]);
        gl.uniform1f(p.u.uInflate, o.inflate || 0.9);
        gl.drawArrays(gl.TRIANGLES, 0, e.count);
      }
      if (o.shell || (o.alpha !== undefined && o.alpha < 1)) { gl.disable(gl.BLEND); gl.depthMask(true); }
      if (o.twoSided) gl.enable(gl.CULL_FACE);
    }

    drawSprites(cam, batches) {
      const gl = this.gl, p = this.pp;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, cam.vp);
      gl.uniform1i(p.u.uTex, 0);
      this.grading(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sprBuf);
      for (const k of ['aPos', 'aUV', 'aCol']) gl.enableVertexAttribArray(p.a[k]);
      for (const b of batches) {
        if (!b.n) continue;
        const floats = b.n * 9;
        if (this.sprData.length < floats) this.sprData = new Float32Array(floats * 2);
        this.sprData.set(b.v.subarray ? b.v.subarray(0, floats) : b.v.slice(0, floats));
        gl.bufferData(gl.ARRAY_BUFFER, this.sprData.subarray(0, floats), gl.STREAM_DRAW);
        gl.vertexAttribPointer(p.a.aPos, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(p.a.aUV, 2, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(p.a.aCol, 4, gl.FLOAT, false, 36, 20);
        gl.bindTexture(gl.TEXTURE_2D, b.tex === 'white' ? this.white : this.getTex(b.tex));
        gl.uniform1f(p.u.uAdd, b.blend === 'add' ? 1 : 0);
        if (b.blend === 'add') gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        else if (b.blend === 'mul') gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
        else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        if (b.offset) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); }
        gl.drawArrays(gl.TRIANGLES, 0, b.n);
        if (b.offset) gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      for (const k of ['aPos', 'aUV', 'aCol']) gl.disableVertexAttribArray(p.a[k]);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
    }

    clearDepth() { const gl = this.gl; gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); }

    viewportRect(x, y, w, h) {
      const gl = this.gl;
      gl.viewport(x, this.cv.height - y - h, w, h);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, this.cv.height - y - h, w, h);
    }

    resetViewport() {
      const gl = this.gl;
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.disable(gl.SCISSOR_TEST);
    }
  }
  Q.Renderer = Renderer;

  class SpriteBatch {
    constructor(tex, blend, offset) { this.tex = tex; this.blend = blend; this.offset = !!offset; this.v = new Float32Array(9 * 6 * 64); this.n = 0; }
    grow(extra) {
      if ((this.n + extra) * 9 <= this.v.length) return;
      const nv = new Float32Array(Math.max(this.v.length * 2, (this.n + extra) * 9));
      nv.set(this.v);
      this.v = nv;
    }
    vert(p, u, v, c) {
      const o = this.n * 9, d = this.v;
      d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = u; d[o + 4] = v; d[o + 5] = c[0]; d[o + 6] = c[1]; d[o + 7] = c[2]; d[o + 8] = c[3];
      this.n++;
    }
    quad(a, b, c, d, col, uv) {
      this.grow(6);
      uv = uv || [0, 0, 1, 1];
      this.vert(a, uv[0], uv[3], col); this.vert(b, uv[2], uv[3], col); this.vert(c, uv[2], uv[1], col);
      this.vert(a, uv[0], uv[3], col); this.vert(c, uv[2], uv[1], col); this.vert(d, uv[0], uv[1], col);
    }
    billboard(pos, size, col, right, up, rot) {
      let r = right, u = up;
      if (rot) {
        const c = Math.cos(rot), s = Math.sin(rot);
        r = [right[0] * c + up[0] * s, right[1] * c + up[1] * s, right[2] * c + up[2] * s];
        u = [up[0] * c - right[0] * s, up[1] * c - right[1] * s, up[2] * c - right[2] * s];
      }
      const h = size / 2;
      const a = [pos[0] - r[0] * h - u[0] * h, pos[1] - r[1] * h - u[1] * h, pos[2] - r[2] * h - u[2] * h];
      const b = [pos[0] + r[0] * h - u[0] * h, pos[1] + r[1] * h - u[1] * h, pos[2] + r[2] * h - u[2] * h];
      const c = [pos[0] + r[0] * h + u[0] * h, pos[1] + r[1] * h + u[1] * h, pos[2] + r[2] * h + u[2] * h];
      const d = [pos[0] - r[0] * h + u[0] * h, pos[1] - r[1] * h + u[1] * h, pos[2] - r[2] * h + u[2] * h];
      this.quad(a, b, c, d, col);
    }
    beam(p0, p1, width, col, eye, uvLen, uvOff) {
      const dir = Q.vsub(p1, p0);
      const mid = Q.vlerp(p0, p1, 0.5);
      let side = Q.vcross(dir, Q.vsub(mid, eye));
      const l = Q.vlen(side);
      if (l < 1e-6) return;
      side = Q.vscale(side, width / 2 / l);
      const L = uvLen === undefined ? 1 : uvLen, o = uvOff || 0;
      this.quad(Q.vsub(p0, side), Q.vsub(p1, side), Q.vadd(p1, side), Q.vadd(p0, side), col, [o, 0, o + L, 1]);
    }
    reset() { this.n = 0; }
  }
  Q.SpriteBatch = SpriteBatch;
})(globalThis.Quake3 = globalThis.Quake3 || {});
