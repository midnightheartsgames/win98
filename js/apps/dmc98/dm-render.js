(function (S) {
  'use strict';
  const { M4, Mesh, clamp, rgb } = S;
  const MAXL = 8, PI = Math.PI;

  const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform vec2 uUV;
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vN = (uM * vec4(aNrm, 0.0)).xyz; vUV = aUV + uUV; vC = aCol; gl_Position = uVP * w; }`;
  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFog;
uniform vec3 uCam; uniform vec4 uTint; uniform float uAlpha; uniform float uAlphaTest; uniform vec3 uEmis;
uniform vec3 uLP[${MAXL}]; uniform vec4 uLC[${MAXL}];
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < uAlphaTest) discard;
  vec3 n = normalize(vN);
  vec3 lit;
  if (vC.a < 0.5) lit = vec3(1.25);
  else {
    lit = uAmb * (0.7 + 0.3 * n.y) + uSunCol * max(dot(n, uSun), 0.0);
    for (int i = 0; i < ${MAXL}; i++) { vec3 d = uLP[i] - vW; float l = length(d) + 0.001; float a = max(0.0, 1.0 - l / uLC[i].w); lit += uLC[i].rgb * a * a * (0.3 + 0.7 * max(dot(n, d / l), 0.0)); }
  }
  vec3 c = t.rgb * vC.rgb * lit + uEmis;
  c = mix(c, uTint.rgb, uTint.a);
  float dist = length(vW - uCam);
  float f = 1.0 - exp(-dist * uFog);
  if (vC.a >= 0.5) c = mix(c, uFogCol, clamp(f, 0.0, 1.0));
  else c = mix(c, uFogCol, clamp(f * 0.5, 0.0, 1.0));
  gl_FragColor = vec4(c, uAlpha * t.a);
}`;
  const VSP = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; varying vec2 vUV; varying vec4 vC;
void main(){ vUV = aUV; vC = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const FSP = `
precision mediump float;
uniform sampler2D uTex; varying vec2 vUV; varying vec4 vC;
void main(){ vec4 t = texture2D(uTex, vUV); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }`;

  function compile(gl, vs, fs) {
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, a = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, name); }
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const info = gl.getActiveAttrib(p, i); a[info.name] = gl.getAttribLocation(p, info.name); }
    return { p, u, a };
  }
  function lookAt(m, ex, ey, ez, lx, ly, lz) {
    let fx = lx - ex, fy = ly - ey, fz = lz - ez; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    let rx = fy * 0 - fz * 1, ry = fz * 0 - fx * 0, rz = fx * 1 - fy * 0; const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    m[0] = rx; m[4] = ry; m[8] = rz; m[12] = -(rx * ex + ry * ey + rz * ez);
    m[1] = ux; m[5] = uy; m[9] = uz; m[13] = -(ux * ex + uy * ey + uz * ez);
    m[2] = -fx; m[6] = -fy; m[10] = -fz; m[14] = fx * ex + fy * ey + fz * ez;
    m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1; return m;
  }
  const IDENT = M4.create();
  const SQUARE_COL = { start: 0xd8d8d8, white: 0xe8e8e8, red: 0xd02020, blue: 0x2050e0, yellow: 0xe0c020, goal: 0x20c040 };

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.lit = compile(gl, VS, FS); this.pp = compile(gl, VSP, FSP);
      this.tex = {}; const T = S.textures();
      for (const k in T) this.tex[k] = this.upload(T[k], !['particle', 'spark', 'swoosh', 'seal'].includes(k));
      this.rigs = {}; this.objs = {};
      this.V = M4.create(); this.P = M4.create(); this.VP = M4.create();
      this.parts = []; this.fx = []; this.lights = []; this.time = 0;
      this.dyn = { buf: gl.createBuffer(), idx: gl.createBuffer() };
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
    }
    upload(img, rep) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, rep ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, rep ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (rep) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      return t;
    }
    glMesh(m) {
      const gl = this.gl, mk = (d, T) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new T(d), gl.STATIC_DRAW); return b; };
      const g = { pos: mk(m.pos, Float32Array), nrm: mk(m.nrm, Float32Array), uv: mk(m.uv, Float32Array), col: mk(m.col, Float32Array), n: m.idx.length };
      g.idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.idx), gl.STATIC_DRAW);
      return g;
    }
    free(g) { const gl = this.gl; for (const k of ['pos', 'nrm', 'uv', 'col', 'idx']) gl.deleteBuffer(g[k]); }
    draw(g) {
      const gl = this.gl, a = this.lit.a;
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos); gl.vertexAttribPointer(a.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.nrm); gl.vertexAttribPointer(a.aNrm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.uv); gl.vertexAttribPointer(a.aUV, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.col); gl.vertexAttribPointer(a.aCol, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx); gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
    }
    split(meshes, tex, m) { let l = meshes[tex]; if (!l) meshes[tex] = l = [new Mesh()]; let cur = l[l.length - 1]; if (cur.count + m.count > 60000) l.push(cur = new Mesh()); cur.append(m); }

    setArea(game) {
      if (this.area) for (const c of this.area.chunks) this.free(c.g);
      const def = game.def, meshes = {};
      for (const b of def.boxes) if (b.render) { const out = this.boxMesh(b); for (const t in out) this.split(meshes, t, out[t]); }
      for (const p of def.props) { const ms = S.propMeshes(p); for (const t in ms) this.split(meshes, t, ms[t]); }
      for (const d of def.doors) { const ms = this.doorMesh(d); for (const t in ms) this.split(meshes, t, ms[t]); }
      if (game.board) {
        const B = game.board, m = new Mesh();
        B.kinds.forEach((k, i) => { const [x, z] = S.squarePos(B, i); m.with(M4.translate(M4.create(), x, 0, z), q => q.cbox(0, 0.15, 0, 1.45, 0.15, 1.45, rgb(SQUARE_COL[k]))); });
        m.cyl(0, 0, 0, 3, 3, 0.4, 16, rgb(0x5a3a5a), true);
        this.split(meshes, 'plain', m);
      }
      const chunks = [];
      for (const t in meshes) for (const m of meshes[t]) if (m.idx.length) chunks.push({ tex: t, g: this.glMesh(m), blend: !!S.BLEND_TEX[t], alpha: !!S.ALPHA_TEX[t] });
      chunks.sort((a, b) => (a.blend - b.blend) || (a.alpha - b.alpha));
      const env = def.env, sl = Math.hypot(...env.sun);
      this.area = { id: def.id, chunks, env, sun: env.sun.map(v => v / sl), lights: def.lights.slice(), fx: def.fx };
      this.parts.length = 0; this.fx.length = 0; this.lights.length = 0;
      this.ambient = [];
      for (const f of def.fx) this.ambient.push(Object.assign({ acc: 0 }, f));
    }
    boxMesh(b) {
      const out = {}, q = t => out[t] || (out[t] = new Mesh()), w = b.uvs || 2, c = b.glow ? [1, 1, 1, 0] : [1, 1, 1, 1];
      const { x0, y0, z0, x1, y1, z1 } = b;
      const face = (t, p, n, uv) => q(t).quad(p, n, uv.map(v => [v[0] / w, v[1] / w]), c);
      if (b.glass) { face('glass', [[x0, y0, (z0 + z1) / 2], [x1, y0, (z0 + z1) / 2], [x1, y1, (z0 + z1) / 2], [x0, y1, (z0 + z1) / 2]], [0, 0, 1], [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]); return out; }
      face(b.top, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]);
      if (!b.noBottom) face(b.side, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
      const s = b.side;
      face(s, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[x0, -y0], [x1, -y0], [x1, -y1], [x0, -y1]]);
      face(s, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [[-x1, -y0], [-x0, -y0], [-x0, -y1], [-x1, -y1]]);
      face(s, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [[-z1, -y0], [-z0, -y0], [-z0, -y1], [-z1, -y1]]);
      face(s, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[z0, -y0], [z1, -y0], [z1, -y1], [z0, -y1]]);
      return out;
    }
    doorMesh(d) {
      const out = {}, m = M4.create(); M4.translate(m, d.x, d.y, d.z); M4.rotY(m, d.face);
      const q = t => { if (!out[t]) { out[t] = new Mesh(); out[t].M = m; } return out[t]; };
      const hw = Math.min(d.w, 3.4) / 2, h = Math.min(d.h, 4.2);
      if (d.dark) { q('plain').quad([[-hw, 0, -0.35], [hw, 0, -0.35], [hw, h, -0.35], [-hw, h, -0.35]], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]], [0.12, 0.16, 0.14, 1]); }
      else {
        q('door').cbox(-hw / 2, h / 2, -0.25, hw / 2 - 0.02, h / 2, 0.08, [1, 1, 1, 1]);
        q('door').cbox(hw / 2, h / 2, -0.25, hw / 2 - 0.02, h / 2, 0.08, [1, 1, 1, 1]);
        q('gold').cbox(-0.25, h * 0.48, -0.15, 0.06, 0.12, 0.05, [1, 1, 1, 1]); q('gold').cbox(0.25, h * 0.48, -0.15, 0.06, 0.12, 0.05, [1, 1, 1, 1]);
        q('stone').cbox(0, h + 0.2, -0.2, hw + 0.3, 0.2, 0.25, [0.8, 0.8, 0.8, 1]);
      }
      for (const k in out) out[k].M = null;
      return out;
    }
    rig(key) {
      if (this.rigs[key]) return this.rigs[key];
      const model = S.model(key), parts = {};
      for (const p of model.parts) { const m = new Mesh(); p.build(m); parts[p.n] = m.count ? this.glMesh(m) : null; }
      return (this.rigs[key] = { model, parts });
    }
    obj(kind) { return this.objs[kind] || (this.objs[kind] = this.glMesh(S.objectMesh(kind))); }

    add(o) { if (this.parts.length > 1400) this.parts.shift(); this.parts.push(o); return o; }
    burst(x, y, z, n, o) {
      const r = Math.random;
      for (let i = 0; i < n; i++) {
        const a = r() * PI * 2, u = r() * 2 - 1, s = Math.sqrt(1 - u * u), sp = (o.speed || 3) * (0.3 + r());
        this.add({ x: x + (r() - 0.5) * (o.spread || 0), y: y + (r() - 0.5) * (o.spread || 0), z: z + (r() - 0.5) * (o.spread || 0), vx: Math.cos(a) * s * sp, vy: u * sp + (o.up || 0), vz: Math.sin(a) * s * sp, life: (o.life || 0.6) * (0.6 + r() * 0.7), t: 0, size: (o.size || 0.2) * (0.6 + r() * 0.8), grow: o.grow || 0, col: o.col, add: o.add !== false, grav: o.grav || 0, drag: o.drag == null ? 1 : o.drag, tex: o.tex || 'particle' });
      }
    }
    light(x, y, z, r, c, life) { this.lights.push({ x, y, z, r, c, life, max: life }); }
    events(evs, g) {
      for (const e of evs) {
        switch (e.t) {
          case 'hit': {
            const K = { slash: [1, 0.25, 0.15], fire: [1, 0.55, 0.15], gun: [1, 0.9, 0.5], metal: [1, 0.95, 0.7], ice: [0.7, 0.9, 1], block: [1, 0.95, 0.6], ghost: [0.6, 0.4, 0.9], spark: [1, 0.85, 0.4], step: [0.8, 0.8, 1] }[e.kind] || [1, 1, 1];
            this.burst(e.x, e.y, e.z, e.big ? 18 : 8, { speed: e.big ? 7 : 4.5, life: 0.35, size: 0.12, col: [...K, 1], grav: 6, tex: 'spark' });
            this.add({ x: e.x, y: e.y, z: e.z, vx: 0, vy: 0, vz: 0, life: 0.12, t: 0, size: e.big ? 1.6 : 0.9, grow: 3, col: [...K, 0.9], add: true, grav: 0, drag: 0, tex: 'spark' });
            if (e.kind === 'slash' || e.kind === 'fire') this.burst(e.x, e.y, e.z, 5, { speed: 2.5, life: 0.5, size: 0.14, col: e.kind === 'fire' ? [1, 0.4, 0.1, 1] : [0.5, 0.05, 0.05, 0.9], add: e.kind === 'fire', grav: 8 });
            if (e.ex) this.burst(e.x, e.y, e.z, 12, { speed: 4, life: 0.5, size: 0.35, grow: 0.8, col: [1, 0.45, 0.1, 1], up: 1 });
            this.light(e.x, e.y, e.z, 5, K.map(v => v * 1.2), 0.12);
            break;
          }
          case 'slam': this.burst(e.x, e.y + 0.2, e.z, 30, { speed: 7, life: 0.6, size: 0.3, grow: 1, col: e.dt ? [0.5, 0.6, 1, 1] : [0.9, 0.8, 0.6, 0.8], add: !!e.dt, drag: 3 }); this.fx.push({ k: 'ring', x: e.x, y: e.y + 0.05, z: e.z, r: 3.5, t: 0, life: 0.4, col: e.dt ? [0.5, 0.6, 1] : [1, 0.9, 0.7] }); this.light(e.x, e.y + 1, e.z, 8, [1.5, 1.2, 0.9], 0.2); break;
          case 'shock': this.fx.push({ k: 'ring', x: e.x, y: e.y + 0.05, z: e.z, r: e.r, t: 0, life: 0.45, col: e.fire ? [1, 0.5, 0.15] : e.ice ? [0.7, 0.9, 1] : [1, 1, 0.9] }); this.burst(e.x, e.y + 0.2, e.z, 20, { speed: e.r * 2, life: 0.5, size: 0.3, grow: 1, col: e.fire ? [1, 0.5, 0.1, 1] : e.ice ? [0.8, 0.95, 1, 0.8] : [0.8, 0.75, 0.65, 0.6], add: !!e.fire, drag: 3 }); break;
          case 'explode': { const c = e.kind === 'holy' ? [1, 0.95, 0.7] : e.kind === 'charge' ? [0.6, 0.75, 1] : [1, 0.55, 0.15]; this.burst(e.x, e.y, e.z, 24, { speed: 5 * Math.max(0.6, e.r / 2), life: 0.5, size: 0.5 * Math.max(0.6, e.r / 2), grow: 2, col: [...c, 1], drag: 3 }); this.burst(e.x, e.y, e.z, 10, { speed: 2, life: 1.4, size: 0.5, grow: 1.5, col: [0.2, 0.2, 0.2, 0.5], add: false, up: 1 }); this.light(e.x, e.y, e.z, e.r * 4, c.map(v => v * 2), 0.3); break; }
          case 'spawnfx': this.fx.push({ k: 'pillar', x: e.x, y: e.y, z: e.z, t: 0, life: 0.9, r: e.big ? 1.8 : 1.1 }); this.burst(e.x, e.y + 1, e.z, 16, { speed: 2, life: 0.8, size: 0.3, col: [1, 0.15, 0.1, 1], up: 2 }); break;
          case 'swoosh': this.fx.push({ k: 'arc', who: e.who, at: e.at, arc: e.arc, t: 0, life: e.at + 0.2, ex: e.ex, dt: e.dt }); break;
          case 'tracer': this.fx.push({ k: 'beam', a: [e.x0, e.y0, e.z0], b: [e.x1, e.y1, e.z1], w: 0.05, col: [1, 0.9, 0.5, 0.9], t: 0, life: 0.06 }); this.light(e.x0, e.y0, e.z0, 5, [1.6, 1.2, 0.6], 0.05); break;
          case 'muzzle': this.add({ x: e.x, y: e.y, z: e.z, vx: 0, vy: 0, vz: 0, life: 0.07, t: 0, size: e.big ? 1 : 0.5, grow: 2, col: [1, 0.8, 0.4, 1], add: true, grav: 0, drag: 0, tex: 'spark' }); this.light(e.x, e.y, e.z, 6, [1.6, 1.2, 0.6], 0.06); break;
          case 'arm': this.fx.push({ k: 'arm', who: e.who, b: [e.x, e.y, e.z], t: 0, life: e.dur || 0.3, hold: e.hold }); break;
          case 'break': this.burst(e.x, e.y + 0.5, e.z, 16, { speed: 4, life: 0.8, size: 0.14, col: e.kind === 'vase' ? [0.3, 0.4, 0.7, 1] : e.kind === 'barrel' || e.kind === 'crate' || e.kind === 'bench' ? [0.5, 0.35, 0.2, 1] : [0.55, 0.52, 0.48, 1], add: false, grav: 14, drag: 0.5 }); break;
          case 'shatter': this.burst(e.x, e.y, e.z, e.small ? 6 : 22, { speed: 5, life: 0.7, size: 0.12, col: [0.8, 0.95, 1, 1], grav: 12, tex: 'spark' }); break;
          case 'glassburst': this.burst(e.x, e.y, e.z, 40, { speed: 6, life: 1.4, size: 0.15, col: [0.8, 0.9, 1, 1], grav: 10, spread: 3, tex: 'spark' }); break;
          case 'dton': this.fx.push({ k: 'pillar', x: e.x, y: e.y, z: e.z, t: 0, life: 0.7, r: 2, blue: true }); this.burst(e.x, e.y + 1, e.z, 30, { speed: 6, life: 0.6, size: 0.35, col: [0.4, 0.55, 1, 1], drag: 2 }); break;
          case 'armglow': this.burst(e.x, e.y + 1.3, e.z, 16, { speed: 1.2, life: 0.9, size: 0.25, col: [0.3, 0.6, 1, 1], up: 0.8 }); break;
          case 'smoke': this.burst(e.x, e.y, e.z, 20, { speed: 1.5, life: 2, size: 0.8, grow: 1.5, col: [0.25, 0.22, 0.2, 0.5], add: false, up: 1.2, spread: 2 }); break;
          case 'snowburst': this.burst(e.x, e.y + 0.3, e.z, 10, { speed: 3, life: 1, size: 0.5, grow: 1, col: [0.9, 0.93, 1, 0.7], add: false, grav: 4, up: 3, spread: 1.5 }); break;
          case 'warnRing': this.fx.push({ k: 'ring', x: e.x, y: e.y + 0.06, z: e.z, r: e.r, t: 0, life: 0.1, col: [1, 0.2, 0.1], hold: true }); break;
          case 'fireTrail': this.burst(e.x, e.y + 0.3, e.z, 3, { speed: 1.5, life: 0.5, size: 0.6, grow: 1, col: [1, 0.45, 0.1, 1], up: 3, spread: 3 }); break;
          case 'firearc': this.fx.push({ k: 'arc', who: { x: e.x, y: e.y, z: e.z, face: e.face }, at: 0, arc: { tilt: 5, dir: -1, r: e.r, big: true }, t: 0, life: 0.3, ex: 1 }); break;
          case 'breath': { const w = e.who, f = w.face; for (let i = 0; i < 2; i++) { const a = f + (Math.random() - 0.5) * 0.9; this.add({ x: w.x + Math.sin(f) * 3.5, y: w.y + 2, z: w.z + Math.cos(f) * 3.5, vx: Math.sin(a) * 10, vy: -0.8, vz: Math.cos(a) * 10, life: 0.8, t: 0, size: 0.4, grow: 2, col: [0.8, 0.93, 1, 0.55], add: false, grav: 0, drag: 1, tex: 'particle' }); } break; }
          case 'tongue': this.fx.push({ k: 'tongue', who: e.who, t: 0, life: 0.35, len: e.len }); break;
          case 'hike': this.fx.push({ k: 'ring', x: e.x, y: e.y, z: e.z, r: 1.2, t: 0, life: 0.3, col: [0.5, 0.7, 1] }); break;
          case 'glass': this.burst(0, 6.5, 10, 26, { speed: 5, life: 1, size: 0.14, col: [0.8, 0.95, 1, 1], grav: 10, spread: 4, tex: 'spark' }); break;
          case 'area': this.parts.length = 0; this.fx.length = 0; break;
          default: break;
        }
      }
    }
    step(dt, g) {
      this.time += dt;
      for (const p of this.parts) { p.t += dt; const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy = p.vy * k - p.grav * dt; p.vz *= k; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.size += p.grow * dt; }
      this.parts = this.parts.filter(p => p.t < p.life && p.size > 0);
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.life);
      for (const L of this.lights) L.life -= dt;
      this.lights = this.lights.filter(L => L.life > 0);
      const cam = this.cam || [0, 0, 0];
      for (const a of this.ambient || []) {
        a.acc += dt;
        const rate = { snowfall: 0.012, embers: 0.03, fireflies: 0.12, mist: 0.08, moonbeam: 0.15 }[a.kind] || 1;
        while (a.acc > rate) {
          a.acc -= rate;
          const x = (a.kind === 'snowfall' || a.kind === 'embers' || a.kind === 'fireflies') ? cam[0] + (Math.random() - 0.5) * Math.min(a.w, 30) : a.x + (Math.random() - 0.5) * a.w;
          const z = (a.kind === 'snowfall' || a.kind === 'embers' || a.kind === 'fireflies') ? cam[2] + (Math.random() - 0.5) * Math.min(a.d, 30) : a.z + (Math.random() - 0.5) * a.d;
          if (a.kind === 'snowfall') this.add({ x, y: cam[1] + 8, z, vx: 0.6, vy: -2, vz: 0.2, life: 6, t: 0, size: 0.06, grow: 0, col: [0.95, 0.97, 1, 0.9], add: false, grav: 0, drag: 0 });
          else if (a.kind === 'embers') this.add({ x, y: 0.2, z, vx: (Math.random() - 0.5), vy: 1.5 + Math.random() * 2, vz: (Math.random() - 0.5), life: 3, t: 0, size: 0.07, grow: 0, col: [1, 0.5, 0.1, 1], add: true, grav: 0, drag: 0 });
          else if (a.kind === 'fireflies') this.add({ x, y: 0.5 + Math.random() * 2.5, z, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3, vz: (Math.random() - 0.5) * 0.4, life: 3, t: 0, size: 0.07, grow: 0, col: [0.7, 1, 0.5, 1], add: true, grav: 0, drag: 0 });
          else if (a.kind === 'mist') this.add({ x, y: -2 + Math.random() * 3, z, vx: 0, vy: 1.5, vz: 0, life: 3, t: 0, size: 1.5, grow: 1.5, col: [0.8, 0.85, 0.9, 0.12], add: false, grav: 0, drag: 0 });
          else if (a.kind === 'moonbeam') this.add({ x, y: a.y - Math.random() * a.y, z, vx: 0, vy: -0.2, vz: 0, life: 2, t: 0, size: 0.05, grow: 0, col: [0.7, 0.8, 1, 0.8], add: true, grav: 0, drag: 0 });
        }
      }
      const p = g && g.player;
      if (p && p.dtOn && Math.random() < 0.5) this.add({ x: p.x + (Math.random() - 0.5) * 0.8, y: p.y + Math.random() * 1.8, z: p.z + (Math.random() - 0.5) * 0.8, vx: 0, vy: 1.2, vz: 0, life: 0.5, t: 0, size: 0.18, grow: -0.2, col: [0.35, 0.5, 1, 0.9], add: true, grav: 0, drag: 0 });
      if (p && p.exceed >= 1 && Math.random() < 0.3 * p.exceed) { const f = p.face; this.add({ x: p.x + Math.sin(f - 1) * 0.5, y: p.y + 1.1, z: p.z + Math.cos(f - 1) * 0.5, vx: 0, vy: 1, vz: 0, life: 0.3, t: 0, size: 0.15, grow: -0.2, col: [1, 0.45, 0.1, 1], add: true, grav: 0, drag: 0 }); }
      if (g && g.boss && g.boss.type === 'berial' && !g.boss.won && g.boss.flame > 0) { const e = g.boss; for (let i = 0; i < 3; i++) this.add({ x: e.x + (Math.random() - 0.5) * 3, y: e.y + 2 + Math.random() * 4, z: e.z + (Math.random() - 0.5) * 3, vx: 0, vy: 2.5, vz: 0, life: 0.6, t: 0, size: 0.5, grow: -0.3, col: [1, 0.45, 0.1, 0.9], add: true, grav: 0, drag: 0 }); }
    }

    resize(w, h) { this.canvas.width = w; this.canvas.height = h; }
    project(x, y, z) { const m = this.VP, cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15]; if (cw <= 0.05) return null; return [cx / cw * 0.5 + 0.5, 1 - (cy / cw * 0.5 + 0.5)]; }

    drawActor(a, g, o = {}) {
      if (!a.m || a.hidden) return;
      const rg = this.rig(a.m.key), gl = this.gl, L = this.lit;
      const base = M4.create(); M4.translate(base, a.x, a.y, a.z); M4.rotY(base, a.face || 0); if (a.m.scale !== 1) M4.scale(base, a.m.scale);
      const pose = S.pose(a), mats = S.poseMatrices(a.m, base, pose);
      const flash = a.flash > 0 ? 0.7 : 0;
      gl.uniform4f(L.u.uTint, 1, 1, 1, flash);
      if (o.alpha != null) gl.uniform1f(L.u.uAlpha, o.alpha);
      gl.uniform3fv(L.u.uEmis, o.emis || [0, 0, 0]);
      gl.bindTexture(gl.TEXTURE_2D, this.tex.plain);
      const drawn = a.combat > 0 || !!a.anim || a.st === 'act' || a.team === 'foe', sh = a.m.parts.some(q => q.n === 'sheath');
      for (const part of a.m.parts) { const gm = rg.parts[part.n]; if (!gm) continue; if (sh && ((part.n === 'handR' && !drawn) || (part.n === 'sheath' && drawn))) continue; gl.uniformMatrix4fv(L.u.uM, false, mats[part.n]); this.draw(gm); }
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.uniform3fv(L.u.uEmis, [0, 0, 0]);
      a.mats = mats;
      return mats;
    }
    drawObj(kind, x, y, z, rot = 0, s = 1, o = {}) {
      const gl = this.gl, L = this.lit, m = M4.create(); M4.translate(m, x, y, z); M4.rotY(m, rot); if (o.rx) M4.rotX(m, o.rx); if (o.rz) M4.rotZ(m, o.rz); if (s !== 1) M4.scale(m, s);
      if (o.tint) gl.uniform4f(L.u.uTint, o.tint[0], o.tint[1], o.tint[2], o.tint[3]);
      if (o.alpha != null) gl.uniform1f(L.u.uAlpha, o.alpha);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[o.tex || 'plain']);
      gl.uniformMatrix4fv(L.u.uM, false, m); this.draw(this.obj(kind));
      if (o.tint) gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      if (o.alpha != null) gl.uniform1f(L.u.uAlpha, 1);
    }

    render(g, cam, opt = {}) {
      const gl = this.gl, w = this.canvas.width, h = this.canvas.height, A = this.area;
      if (!A) return;
      gl.viewport(0, 0, w, h);
      const env = A.env, t = this.time;
      let sx = 0, sy = 0; const sh = (g.shake || 0) + (opt.shake || 0);
      if (sh > 0) { sx = (Math.random() - 0.5) * sh * 0.25; sy = (Math.random() - 0.5) * sh * 0.25; }
      const ex = cam.x + sx, ey = cam.y + sy, ez = cam.z; this.cam = [ex, ey, ez];
      M4.perspective(this.P, (cam.fov || 60) * PI / 180, w / h, 0.1, 600);
      lookAt(this.V, ex, ey, ez, cam.lx + sx, cam.ly + sy, cam.lz);
      M4.mul(this.VP, this.P, this.V);
      const fog = env.fog;
      gl.clearColor(fog[0], fog[1], fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const L = this.lit; gl.useProgram(L.p);
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.enableVertexAttribArray(L.a[k]);
      gl.uniformMatrix4fv(L.u.uVP, false, this.VP); gl.uniform3fv(L.u.uCam, [ex, ey, ez]);
      gl.uniform3fv(L.u.uSun, A.sun); gl.uniform3fv(L.u.uSunCol, env.sunCol); gl.uniform3fv(L.u.uAmb, env.amb.map(v => v * (g.player && g.player.dtOn ? 0.85 : 1)));
      gl.uniform3fv(L.u.uFogCol, fog); gl.uniform1f(L.u.uFog, env.fogD); gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.uniform1f(L.u.uAlphaTest, 0); gl.uniform3fv(L.u.uEmis, [0, 0, 0]); gl.uniform2f(L.u.uUV, 0, 0);
      gl.uniform1i(L.u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
      const dl = A.lights.map(l => ({ x: l.x, y: l.y, z: l.z, r: l.r, c: l.c }));
      for (const l of this.lights) { const k = clamp(l.life / l.max, 0, 1); dl.push({ x: l.x, y: l.y, z: l.z, r: l.r, c: l.c.map(v => v * k) }); }
      const p = g.player;
      if (p && p.dtOn) dl.push({ x: p.x, y: p.y + 1.5, z: p.z, r: 5, c: [0.4, 0.55, 1.2] });
      if (p && !g.cut) dl.push({ x: p.x + Math.sin(p.face - 1.5) * 0.4, y: p.y + 1.1, z: p.z + Math.cos(p.face - 1.5) * 0.4, r: 2.6, c: [0.25, 0.35, 0.7] });
      if (g.elec === 2) dl.push({ x: 0, y: 0.5, z: -3, r: 22, c: [0.6, 0.9, 1.6].map(v => v * (0.6 + Math.random() * 0.4)) });
      const scored = dl.map(l => ({ l, s: l.r * l.r / (1 + (l.x - ex) ** 2 + (l.y - ey) ** 2 + (l.z - ez) ** 2) })).sort((a, b) => b.s - a.s).slice(0, MAXL);
      const LP = new Float32Array(MAXL * 3), LC = new Float32Array(MAXL * 4);
      scored.forEach(({ l }, i) => { LP.set([l.x, l.y, l.z], i * 3); LC.set([l.c[0], l.c[1], l.c[2], l.r], i * 4); });
      for (let i = scored.length; i < MAXL; i++) LC.set([0, 0, 0, 1], i * 4);
      gl.uniform3fv(L.u.uLP, LP); gl.uniform4fv(L.u.uLC, LC);
      gl.uniformMatrix4fv(L.u.uM, false, IDENT);
      for (const c of A.chunks) {
        if (c.blend) continue;
        gl.uniform1f(L.u.uAlphaTest, c.alpha ? 0.5 : 0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex[c.tex] || this.tex.stone);
        this.draw(c.g);
      }
      gl.uniform1f(L.u.uAlphaTest, 0);
      const cut = g.cut;
      if (cut) { for (const k in cut.actors) { const a = cut.actors[k]; if (a.hidden) continue; if (a.obj) this.drawObj(a.obj, a.x, a.y, a.z, t * 2); else this.drawActor(a, g); } }
      else {
        if (p && !p.hidden && g.state !== 'clear') {
          p.m = p.m || S.model('nero');
          this.drawActor(p, g, { emis: p.dtOn ? [0.08, 0.1, 0.25] : null });
        }
        for (const e of g.foes) {
          if (e.hidden) continue;
          if (e.type === 'gladius') { const tilt = e.st === 'dive' ? Math.atan2(-e.vy, Math.hypot(e.vx, e.vz)) : 0; this.drawRigid(e, tilt); continue; }
          const dissolve = e.dead && !e.boss ? clamp(1 - (e.stT - 0.6) / 0.7, 0, 1) : 1;
          if (dissolve <= 0) continue;
          const al = e.type === 'mephisto' && e.cloak > 0 ? 0.92 : dissolve;
          this.drawActor(e, g, { alpha: al < 1 ? al : null, emis: e.dead && !e.boss ? [0.4 * (1 - dissolve), 0.05, 0.05] : null });
          if (e.st === 'cocoon') this.drawObj('cocoon', e.x, e.y, e.z, 0, 1, { alpha: 0.7 });
        }
      }
      this.drawObjects(g);
      this.drawShadows(g);
      this.beginBlend();
      gl.uniformMatrix4fv(L.u.uM, false, IDENT);
      for (const c of A.chunks) {
        if (!c.blend) continue;
        if (c.tex === 'water') gl.uniform2f(L.u.uUV, 0, -t * 0.6);
        gl.uniform1f(L.u.uAlpha, c.tex === 'water' ? 0.8 : c.tex === 'tankglass' ? 0.35 : 0.3);
        gl.bindTexture(gl.TEXTURE_2D, this.tex[c.tex]); this.draw(c.g);
        gl.uniform2f(L.u.uUV, 0, 0);
      }
      gl.uniform1f(L.u.uAlpha, 1);
      this.drawSeals(g);
      if (p && p.dtOn && !g.cut) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); this.drawObj('devil', p.x, p.y, p.z, p.face, 0.9, { alpha: 0.2 + Math.sin(t * 8) * 0.05 }); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
      this.endBlend();
      this.drawBillboards(g);
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.disableVertexAttribArray(L.a[k]);
    }
    beginBlend() { const gl = this.gl; gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); }
    endBlend() { const gl = this.gl; gl.disable(gl.BLEND); gl.depthMask(true); }
    drawRigid(e, tilt) {
      const gl = this.gl, L = this.lit, rg = this.rig('gladius'), m = M4.create();
      M4.translate(m, e.x, e.y, e.z); M4.rotY(m, e.face); M4.rotX(m, tilt || 0); M4.rotZ(m, Math.sin(e.t * 6) * 0.3);
      gl.bindTexture(gl.TEXTURE_2D, this.tex.plain); gl.uniform4f(L.u.uTint, 1, 1, 1, e.flash > 0 ? 0.7 : 0);
      gl.uniformMatrix4fv(L.u.uM, false, m); this.draw(rg.parts.hips); gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
    }
    drawObjects(g) {
      const t = this.time;
      for (const o of g.objs || []) {
        switch (o.kind) {
          case 'statue': this.drawObj('divinity', o.x, o.y, o.z, o.face); break;
          case 'item': this.drawObj(o.id.startsWith('frag') ? 'frag' : o.id, o.x, o.y + Math.sin(t * 2) * 0.12, o.z, t * 1.5, o.id.startsWith('frag') ? 1.3 : 1.6); break;
          case 'grip': { const near = g.player && Math.hypot(g.player.x - o.x, g.player.z - o.z) < 22; this.drawObj('grip', o.x, o.y, o.z, t, 1 + (near ? Math.sin(t * 6) * 0.15 : 0)); break; }
          case 'switch': this.drawObj(o.on ? 'switch' : 'switchOff', o.x, o.y, o.z, t * (o.on ? 1 : 0)); break;
          case 'gyroMachine': this.drawObj('gyroMachine', o.x, o.y, o.z, o.face); break;
          case 'gyro': this.drawObj('gyro', o.x, 0.9, o.z, o.spin); break;
          case 'socket': this.drawObj(o.filled ? 'socketOn' : 'socket', o.x, 0.01, o.z, 0); if (o.filled) this.drawObj('gyro', o.x, 0.9, o.z, t * 4, 0.8); break;
          case 'cannon': if (!o.dead) this.drawObj('cannon', o.x, o.y, o.z, o.face, 1, { tint: o.flash > 0 ? [1, 1, 1, 0.6] : null }); break;
          case 'die': this.drawObj('die', o.x, o.y + Math.sin(t * 2) * 0.2, o.z, o.rolling > 0 ? t * 14 : t * 0.4, 1, { rx: o.rolling > 0 ? t * 11 : 0.3 }); break;
          case 'break': this.drawObjBreak(o); break;
          case 'cluster': this.drawObj('orbBig', o.x, o.y + Math.sin(t * 3) * 0.1, o.z, t, 1 + Math.sin(t * 5) * 0.06); break;
          default: break;
        }
      }
      for (const o of g.pickups || []) this.drawObj(o.kind === 'green' ? 'orbGreen' : o.kind === 'white' ? 'orbWhite' : 'orb', o.x, o.y, o.z, t * 3);
      for (const s of g.shots || []) {
        if (s.kind === 'meteor') { if (s.t >= s.delay) this.drawObj('fireball', s.x, s.y, s.z, t * 5, 1.4); }
        else if (s.kind === 'rain' || s.kind === 'spear') { if (s.kind === 'spear' || s.t >= s.delay) this.drawObj('spear', s.x, s.y, s.z, Math.atan2(s.vx, s.vz), 1.2, { rx: s.kind === 'rain' ? -PI / 2 : Math.atan2(-s.vy, Math.hypot(s.vx, s.vz)) }); }
        else if (s.kind === 'fireball') this.drawObj('fireball', s.x, s.y, s.z, t * 5, 1.2);
        else if (s.kind === 'ice') this.drawObj('iceSpike', s.x, s.y, s.z, Math.atan2(s.vx, s.vz), 1, { rx: PI / 2 });
        else if (s.kind === 'bullet') this.drawObj('bullet', s.x, s.y, s.z, Math.atan2(s.vx, s.vz));
        else if (s.kind === 'glad') this.drawObj('gladiusMesh', s.x, s.y, s.z, Math.atan2(s.vx, s.vz), 1.3);
      }
    }
    drawObjBreak(o) {
      const out = this.breakMeshes || (this.breakMeshes = {}), k = o.b.kind;
      if (!out[k]) { const ms = S.propMeshes({ kind: k, x: 0, y: 0, z: 0, rot: 0, s: 1 }); out[k] = Object.keys(ms).map(t => ({ t, g: this.glMesh(ms[t]) })); }
      const gl = this.gl, L = this.lit, m = M4.create(); M4.translate(m, o.x, o.y, o.z); M4.rotY(m, o.b.rot || 0);
      gl.uniformMatrix4fv(L.u.uM, false, m);
      for (const q of out[k]) { gl.bindTexture(gl.TEXTURE_2D, this.tex[q.t] || this.tex.plain); this.draw(q.g); }
    }
    drawShadows(g) {
      const gl = this.gl, L = this.lit;
      this.beginBlend(); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2);
      gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.uniform4f(L.u.uTint, 0, 0, 0, 1); gl.uniform1f(L.u.uAlpha, 0.5);
      const list = [];
      if (g.cut) for (const k in g.cut.actors) { const a = g.cut.actors[k]; if (!a.hidden && a.m) list.push(a); }
      else { if (g.player) list.push(g.player); for (const e of g.foes) if (!e.hidden && !e.dead) list.push(e); }
      for (const a of list) {
        const gy = g.W.groundAt(a.x, a.z, 0.2, a.y + 0.5); if (!isFinite(gy)) continue;
        const r = (a.r || 0.45) * (a.m && a.m.scale || 1) * 1.6, k = clamp(1 - (a.y - gy) / 6, 0.2, 1);
        const m = M4.create(); M4.translate(m, a.x, gy + 0.02, a.z); M4.scale(m, r * k, 1, r * k);
        gl.uniformMatrix4fv(L.u.uM, false, m); this.draw(this.obj('shadowDisc'));
      }
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.disable(gl.POLYGON_OFFSET_FILL);
      this.endBlend();
    }
    drawSeals(g) {
      const gl = this.gl, L = this.lit, t = this.time;
      for (const s of g.seals || []) {
        if (!s.on) continue; const d = s.door, m = M4.create(); M4.translate(m, d.x, d.y, d.z); M4.rotY(m, d.face);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.seal); gl.uniform1f(L.u.uAlpha, 0.65 + Math.sin(t * 6) * 0.2); gl.uniformMatrix4fv(L.u.uM, false, m);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); this.draw(this.obj('sealPlane')); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      for (const b of g.barriers || []) {
        if (!b.on) continue; const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, rot = (b.x1 - b.x0) > (b.z1 - b.z0) ? 0 : PI / 2;
        if (b.bar.kind === 'bars') { gl.uniform1f(L.u.uAlpha, 1); this.drawObj('bars', cx, 0, cz, rot); }
        else { const m = M4.create(); M4.translate(m, cx, 0, cz); M4.rotY(m, rot); gl.bindTexture(gl.TEXTURE_2D, this.tex.seal); gl.uniform1f(L.u.uAlpha, 0.7); gl.uniformMatrix4fv(L.u.uM, false, m); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); this.draw(this.obj('sealPlane')); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
      }
      gl.uniform1f(L.u.uAlpha, 1);
      if (g.elec) { const m = M4.create(); M4.translate(m, 0, 0.03, 0); gl.bindTexture(gl.TEXTURE_2D, this.tex.plain); gl.uniformMatrix4fv(L.u.uM, false, m); gl.uniform4f(L.u.uTint, 0.4, 0.8, 1, 1); gl.uniform1f(L.u.uAlpha, g.elec === 2 ? 0.25 + Math.random() * 0.25 : 0.08 + Math.sin(t * 20) * 0.06); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); this.draw(this.obj('elecPlane')); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); }
    }
    drawBillboards(g) {
      const gl = this.gl, P = this.pp, V = this.V, R = [V[0], V[4], V[8]], U = [V[1], V[5], V[9]];
      const quads = { add: {}, alpha: {} };
      const push = (tex, add, x, y, z, s, c, rot = 0) => { const k = add ? 'add' : 'alpha', L = quads[k][tex] || (quads[k][tex] = []); L.push(x, y, z, s, c[0], c[1], c[2], c[3], rot); };
      for (const p of this.parts) { const k = 1 - p.t / p.life; push(p.tex, p.add, p.x, p.y, p.z, p.size, [p.col[0], p.col[1], p.col[2], p.col[3] * (p.add ? k : Math.min(1, k * 2))]); }
      const t = this.time;
      if (this.area.env.sky === 'night' || this.area.env.sky === 'forest') { const c = this.cam; push('particle', true, c[0] - 60, c[1] + 75, c[2] + 110, 34, [0.85, 0.9, 1, 0.9]); push('particle', true, c[0] - 60, c[1] + 75, c[2] + 110, 9, [1, 1, 1, 1]); }
      for (const o of g.objs || []) {
        if (o.kind === 'grip') push('particle', true, o.x, o.y, o.z, 1.3 + Math.sin(t * 5) * 0.2, [0.3, 0.6, 1, 0.8]);
        if (o.kind === 'switch' && o.on) push('particle', true, o.x, o.y + 0.9, o.z, 1.2, [0.3, 0.6, 1, 0.8]);
        if (o.kind === 'item') push('particle', true, o.x, o.y, o.z, 1.2, o.id.startsWith('frag') ? [0.3, 0.5, 1, 0.8] : [1, 0.7, 0.3, 0.8]);
        if (o.kind === 'cluster') push('particle', true, o.x, o.y, o.z, 2, [1, 0.15, 0.1, 0.6]);
        if (o.kind === 'statue') push('particle', true, o.x, o.y + 2.2, o.z + 0.4, 0.8, [0.4, 0.9, 1, 0.8]);
      }
      for (const o of g.pickups || []) push('particle', true, o.x, o.y, o.z, 0.6, o.kind === 'green' ? [0.2, 1, 0.3, 0.8] : o.kind === 'white' ? [0.9, 0.9, 1, 0.8] : [1, 0.15, 0.1, 0.8]);
      for (const s of g.shots || []) {
        if (s.kind === 'charge') push('particle', true, s.x, s.y, s.z, 0.8 + s.lv * 0.3, [0.5, 0.7, 1, 1]);
        if (s.kind === 'fireball' || (s.kind === 'meteor' && s.t >= s.delay)) push('particle', true, s.x, s.y, s.z, 2, [1, 0.5, 0.1, 0.8]);
        if (s.kind === 'ice') push('particle', true, s.x, s.y, s.z, 0.6, [0.7, 0.9, 1, 0.7]);
        if (s.kind === 'glad') push('particle', true, s.x, s.y, s.z, 1, [0.5, 0.8, 1, 0.8]);
      }
      if (g.boss && g.boss.lures) for (const l of g.boss.lures) push('particle', true, l.x, l.y, l.z, l.on ? 1.8 + Math.sin(t * 8) * 0.3 : 0.8, l.on ? [0.9, 0.7, 1, 0.9] : [0.6, 0.5, 0.9, 0.4]);
      if (g.woodsHint && g.def.id === 'lostwoods') { const P2 = { n: [0, 13], e: [13, 0], w: [-13, 0] }[g.woodsHint]; if (P2) push('particle', true, P2[0], 1.6 + Math.sin(t * 2) * 0.3, P2[1], 1 + Math.sin(t * 3) * 0.2, [0.5, 0.9, 1, 0.7]); }
      if (g.player && g.player.chargeLv) { const p = g.player; push('particle', true, p.x + Math.sin(p.face + 0.6) * 0.45, p.y + 1.3, p.z + Math.cos(p.face + 0.6) * 0.45, 0.3 + p.chargeLv * 0.25, [0.5, 0.7, 1, 0.9]); }
      const strip = [];
      for (const f of this.fx) {
        const u = f.t / f.life;
        if (f.k === 'ring') this.ringQuads(strip, f.x, f.y, f.z, f.r * (f.hold ? 1 : 0.3 + u * 0.9), f.col, (f.hold ? 0.5 : 1 - u) * 0.9);
        else if (f.k === 'pillar') { for (let i = 0; i < 6; i++) push('particle', true, f.x + (Math.random() - 0.5) * f.r, f.y + Math.random() * 3, f.z + (Math.random() - 0.5) * f.r, 0.6, f.blue ? [0.4, 0.6, 1, 1 - u] : [1, 0.15, 0.1, 1 - u]); }
        else if (f.k === 'beam') this.beamQuad(strip, f.a, f.b, f.w, [f.col[0], f.col[1], f.col[2], f.col[3] * (1 - u)]);
        else if (f.k === 'arm') { const a = f.who, hx = a.x + Math.sin(a.face - 0.4) * 0.5, hz = a.z + Math.cos(a.face - 0.4) * 0.5, reach = f.hold ? 1 : Math.sin(Math.min(1, u * 1.4) * PI); const b = [hx + (f.b[0] - hx) * reach, a.y + 1.3 + (f.b[1] - a.y - 1.3) * reach, hz + (f.b[2] - hz) * reach]; this.beamQuad(strip, [hx, a.y + 1.3, hz], b, 0.22, [0.3, 0.55, 1, 0.8]); push('particle', true, b[0], b[1], b[2], 0.9, [0.4, 0.6, 1, 0.9]); }
        else if (f.k === 'arc') this.arcQuads(strip, f);
        else if (f.k === 'tongue') { const e = f.who, k = Math.sin(u * PI), fx = Math.sin(e.face), fz = Math.cos(e.face); this.beamQuad(strip, [e.x + fx * 3, e.y + 1.4, e.z + fz * 3], [e.x + fx * (3 + f.len * k), e.y + 0.6, e.z + fz * (3 + f.len * k)], 0.5, [0.8, 0.3, 0.4, 0.9]); }
      }
      gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, this.VP); gl.uniform1i(P.u.uTex, 0);
      gl.enable(gl.BLEND); gl.depthMask(false);
      for (const mode of ['alpha', 'add']) {
        gl.blendFunc(gl.SRC_ALPHA, mode === 'add' ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        for (const tex in quads[mode]) {
          const L = quads[mode][tex], n = L.length / 9, data = new Float32Array(n * 4 * 9);
          for (let i = 0; i < n; i++) {
            const o = i * 9, x = L[o], y = L[o + 1], z = L[o + 2], s = L[o + 3] / 2;
            const cs = [[-1, -1, 0, 1], [1, -1, 1, 1], [1, 1, 1, 0], [-1, 1, 0, 0]];
            cs.forEach(([a, b, u, v], k) => { const q = (i * 4 + k) * 9; data[q] = x + (R[0] * a + U[0] * b) * s; data[q + 1] = y + (R[1] * a + U[1] * b) * s; data[q + 2] = z + (R[2] * a + U[2] * b) * s; data[q + 3] = u; data[q + 4] = v; data[q + 5] = L[o + 4]; data[q + 6] = L[o + 5]; data[q + 7] = L[o + 6]; data[q + 8] = L[o + 7]; });
          }
          this.drawQuads(data, n, this.tex[tex] || this.tex.particle);
        }
      }
      if (strip.length) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); const n = strip.length / 36; this.drawQuads(new Float32Array(strip), n, this.tex.swoosh); }
      gl.disable(gl.BLEND); gl.depthMask(true);
    }
    drawQuads(data, n, tex) {
      const gl = this.gl, P = this.pp;
      if (n > 16000) n = 16000;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dyn.buf); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 36), gl.STREAM_DRAW);
      if (!this.qIdx || this.qCap < n) { this.qCap = Math.max(n, 2048); const idx = new Uint16Array(this.qCap * 6); for (let i = 0; i < this.qCap; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dyn.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); this.qIdx = true; }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dyn.idx);
      gl.enableVertexAttribArray(P.a.aPos); gl.enableVertexAttribArray(P.a.aUV); gl.enableVertexAttribArray(P.a.aCol);
      gl.vertexAttribPointer(P.a.aPos, 3, gl.FLOAT, false, 36, 0); gl.vertexAttribPointer(P.a.aUV, 2, gl.FLOAT, false, 36, 12); gl.vertexAttribPointer(P.a.aCol, 4, gl.FLOAT, false, 36, 20);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawElements(gl.TRIANGLES, n * 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(P.a.aPos); gl.disableVertexAttribArray(P.a.aUV); gl.disableVertexAttribArray(P.a.aCol);
    }
    quad(out, a, b, c, d, col, v0 = 0, v1 = 1) { for (const [p, u, v] of [[a, 0, v0], [b, 1, v0], [c, 1, v1], [d, 0, v1]]) out.push(p[0], p[1], p[2], u, v, col[0], col[1], col[2], col[3]); }
    beamQuad(out, a, b, w, col) {
      const cx = this.cam[0], cy = this.cam[1], cz = this.cam[2];
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], vx = (a[0] + b[0]) / 2 - cx, vy = (a[1] + b[1]) / 2 - cy, vz = (a[2] + b[2]) / 2 - cz;
      let sx = dy * vz - dz * vy, sy = dz * vx - dx * vz, sz = dx * vy - dy * vx; const l = Math.hypot(sx, sy, sz) || 1; sx *= w / l; sy *= w / l; sz *= w / l;
      this.quad(out, [a[0] - sx, a[1] - sy, a[2] - sz], [a[0] + sx, a[1] + sy, a[2] + sz], [b[0] + sx, b[1] + sy, b[2] + sz], [b[0] - sx, b[1] - sy, b[2] - sz], col, 0.5, 0.5);
    }
    ringQuads(out, x, y, z, r, col, a) { const n = 20; for (let i = 0; i < n; i++) { const a0 = i / n * PI * 2, a1 = (i + 1) / n * PI * 2, r0 = r * 0.8; this.quad(out, [x + Math.sin(a0) * r0, y, z + Math.cos(a0) * r0], [x + Math.sin(a1) * r0, y, z + Math.cos(a1) * r0], [x + Math.sin(a1) * r, y + 0.02, z + Math.cos(a1) * r], [x + Math.sin(a0) * r, y + 0.02, z + Math.cos(a0) * r], [col[0], col[1], col[2], a], 0, 1); } }
    arcQuads(out, f) {
      const a = f.who, A = f.arc, lt = f.t - f.at + 0.06; if (lt < 0) return;
      const u = clamp(lt / 0.14, 0, 1), fade = clamp(1 - (lt - 0.1) / 0.14, 0, 1); if (fade <= 0) return;
      const col = f.ex ? [1, 0.45, 0.12] : f.dt ? [0.45, 0.6, 1] : [0.85, 0.9, 1];
      if (A.thrust) { const fx = Math.sin(a.face), fz = Math.cos(a.face); this.beamQuad(out, [a.x + fx * 0.6, a.y + 1.2, a.z + fz * 0.6], [a.x + fx * 3, a.y + 1.2, a.z + fz * 3], 0.18, [...col, 0.7 * fade]); return; }
      const span = A.full ? PI * 2 : PI * 1.1, n = A.full ? 24 : 14, dir = A.dir || -1, r = A.r || 2, r0 = r * (A.big ? 0.2 : 0.35);
      const tilt = (A.tilt || 0) * PI / 180, face = a.face, cy = a.y + (A.big ? 1.5 : 1.15) + (A.rise ? u * 0.8 : 0);
      const head = span * u;
      const P = (ang, rr) => { let lx = Math.sin(ang) * rr, ly = 0, lz = Math.cos(ang) * rr; const c = Math.cos(tilt), s = Math.sin(tilt); const lx2 = lx * c - ly * s, ly2 = lx * s + ly * c; lx = lx2; ly = ly2; const cf = Math.cos(face), sf = Math.sin(face); return [a.x + lx * cf + lz * sf, cy + ly, a.z - lx * sf + lz * cf]; };
      const start = -dir * span / 2;
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = (i + 1) / n; if (k1 * span > head) break;
        const a0 = start + dir * k0 * span, a1 = start + dir * k1 * span, al = fade * (0.25 + 0.75 * (k1 * span / Math.max(0.01, head)));
        this.quad(out, P(a0, r0), P(a1, r0), P(a1, r), P(a0, r), [...col, al], 0, 1);
      }
    }
  }

  const baseObj = S.objectMesh;
  S.objectMesh = function (kind) {
    const m = new Mesh();
    switch (kind) {
      case 'shadowDisc': m.cyl(0, 0, 0, 1, 1, 0.001, 12, [1, 1, 1, 1], true); return m;
      case 'sealPlane': m.quad([[-1.7, 0, -0.1], [1.7, 0, -0.1], [1.7, 4.4, -0.1], [-1.7, 4.4, -0.1]], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]], [1, 0.3, 0.2, 0]); return m;
      case 'elecPlane': m.quad([[-14, 0, -16], [14, 0, -16], [14, 0, 10], [-14, 0, 10]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1, 0]); return m;
      case 'gladiusMesh': { const mm = new Mesh(); S.model('gladius').parts[0].build(mm); return mm; }
      default: return baseObj(kind);
    }
  };
  S.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
