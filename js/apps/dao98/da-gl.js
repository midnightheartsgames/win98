(function (D) {
  'use strict';
  const { m4, Geo, hex, buildModel, pose, propGeo, roofGeo, BOX_KIND } = D.GFX;

  const VS = `
attribute vec3 aP; attribute vec2 aT; attribute vec3 aN; attribute vec3 aC;
uniform mat4 uVP; uniform mat4 uM; uniform vec3 uTint; uniform vec3 uAmb; uniform vec3 uSun; uniform vec3 uSunC; uniform float uLit;
uniform vec4 uDyn; uniform vec3 uDynC; uniform vec3 uEye; uniform vec2 uUV;
varying vec2 vT; varying vec3 vC; varying float vD; varying vec3 vW;
void main() {
  vec4 w = uM * vec4(aP, 1.0);
  vec3 n = normalize((uM * vec4(aN, 0.0)).xyz);
  vec3 lit = aC;
  if (uLit > 0.5) lit = aC * (uAmb + uSunC * max(dot(n, -uSun), 0.0));
  float dd = distance(w.xyz, uDyn.xyz);
  lit += uDynC * max(0.0, 1.0 - dd / max(uDyn.w, 0.01));
  vC = lit * uTint;
  vT = aT + uUV;
  vW = w.xyz;
  vD = distance(w.xyz, uEye);
  gl_Position = uVP * w;
}`;
  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogC; uniform vec2 uFog; uniform float uCut; uniform float uAlpha; uniform float uEmis; uniform vec3 uTintE; uniform float uBlood;
varying vec2 vT; varying vec3 vC; varying float vD; varying vec3 vW;
void main() {
  vec4 t = texture2D(uTex, vT);
  if (t.a < uCut) discard;
  vec3 c = mix(t.rgb * vC, t.rgb * uTintE, uEmis);
  if (uBlood > 0.01) {
    float n = fract(sin(dot(floor(vW.xz * 11.0 + vW.y * 7.0), vec2(12.9898, 78.233))) * 43758.5453);
    if (n < uBlood * 0.6) c = mix(c, vec3(0.32, 0.02, 0.02), 0.8);
  }
  float f = clamp((vD - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  c = mix(c, uFogC, f * (1.0 - uEmis * 0.6));
  gl_FragColor = vec4(c, t.a * uAlpha);
}`;
  const PVS = `
attribute vec3 aP; attribute vec2 aQ; attribute vec4 aC; attribute float aS;
uniform mat4 uVP; uniform vec3 uR; uniform vec3 uU; uniform vec3 uEye;
varying vec2 vT; varying vec4 vC; varying float vD;
void main() {
  vec3 p = aP + (uR * aQ.x + uU * aQ.y) * aS;
  vT = aQ * 0.5 + 0.5;
  vC = aC;
  vD = distance(p, uEye);
  gl_Position = uVP * vec4(p, 1.0);
}`;
  const PFS = `
precision mediump float;
uniform sampler2D uTex; uniform vec2 uFog;
varying vec2 vT; varying vec4 vC; varying float vD;
void main() {
  vec4 t = texture2D(uTex, vT);
  float f = 1.0 - clamp((vD - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  gl_FragColor = vec4(t.rgb * vC.rgb, t.a * vC.a * f);
}`;

  const FLOOR_SCALE = { flag: 0.25, cobble: 0.25, dwarf: 0.25, marble: 0.25, deeproad: 0.2, elfstone: 0.25, ruin: 0.25, carpet: 0.5, rug: 0.5 };
  const WALL_SCALE = 0.33;
  const EL_COL = { fire: [1, 0.5, 0.15], cold: [0.6, 0.85, 1], spirit: [0.75, 0.45, 1], nature: [0.5, 0.9, 0.2], phys: [0.8, 0.7, 0.5], magic: [0.7, 0.7, 1], elec: [0.8, 0.9, 1] };

  class Renderer {
    constructor(canvas, opt) {
      this.canvas = canvas;
      this.opt = opt || {};
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, premultipliedAlpha: false, preserveDrawingBuffer: !!this.opt.preserve }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.prog = this.program(VS, FS, ['aP', 'aT', 'aN', 'aC']);
      this.pprog = this.program(PVS, PFS, ['aP', 'aQ', 'aC', 'aS']);
      this.tex = {};
      this.models = new Map();
      this.world = null;
      this.particles = [];
      this.time = 0;
      this.pbuf = gl.createBuffer();
      this.dynBuf = gl.createBuffer();
      this.walkState = new Map();
      this.flash = null;
      this.fx = [];
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      this.decal = this.upload(new Geo().hplane(0, 0, 0, 1, 1));
      this.sky = this.upload(this.skyGeo());
      this.arrow = this.upload(new Geo().box(-0.015, -0.015, -0.4, 0.015, 0.015, 0.4, { col: [0.55, 0.4, 0.25] }).box(-0.03, -0.03, 0.3, 0.03, 0.03, 0.42, { col: [0.7, 0.7, 0.75] }));
      this.stone = this.upload(new Geo().sphere(0, 0, 0, 0.3, 0.26, 0.3, 3, 5, { col: [0.6, 0.5, 0.4] }));
    }
    program(vs, fs, attrs) {
      const gl = this.gl;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
      return { p, u };
    }
    texture(name) {
      if (this.tex[name]) return this.tex[name];
      const gl = this.gl;
      let src;
      if (name.startsWith('face:')) src = D.TEX.face(JSON.parse(name.slice(5)));
      else src = (D.TEX.P[name] || D.TEX.P.plain)();
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      const pow2 = (src.width & (src.width - 1)) === 0 && (src.height & (src.height - 1)) === 0;
      if (pow2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); }
      else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.tex[name] = t;
      return t;
    }
    upload(geo) {
      const gl = this.gl;
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.v), gl.STATIC_DRAW);
      return { buf: b, count: geo.v.length / 11 };
    }
    free(m) { if (m && m.buf) this.gl.deleteBuffer(m.buf); }
    skyGeo() {
      const g = new Geo();
      const lat = 8, lon = 12, R = 300;
      for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
        const t0 = (i / lat) * Math.PI * 0.62, t1 = ((i + 1) / lat) * Math.PI * 0.62;
        const p0 = (j / lon) * Math.PI * 2, p1 = ((j + 1) / lon) * Math.PI * 2;
        const P = (t, p) => [Math.sin(t) * Math.sin(p) * R, Math.cos(t) * R, Math.sin(t) * Math.cos(p) * R];
        const C = t => { const k = Math.min(1, t / (Math.PI * 0.5)); return [k, k, k]; };
        const a = P(t0, p0), b = P(t1, p0), c = P(t1, p1), d = P(t0, p1);
        const uvs = [[p0 * 2, t0 * 3], [p0 * 2, t1 * 3], [p1 * 2, t1 * 3], [p1 * 2, t0 * 3]];
        g.vert(a, uvs[0], [0, -1, 0], C(t0)); g.vert(c, uvs[2], [0, -1, 0], C(t1)); g.vert(b, uvs[1], [0, -1, 0], C(t1));
        g.vert(a, uvs[0], [0, -1, 0], C(t0)); g.vert(d, uvs[3], [0, -1, 0], C(t0)); g.vert(c, uvs[2], [0, -1, 0], C(t1));
      }
      return g;
    }

    setArea(g) {
      if (this.world) { for (const b of this.world.batches) this.free(b); for (const r of this.world.roofs) { this.free(r.roof); this.free(r.gable); } for (const p of this.world.cond) for (const b of p.batches) this.free(b); }
      this.particles = [];
      this.fx = [];
      this.walkState.clear();
      const L = g.L, theme = D.THEMES[g.theme] || D.THEMES.castle_day;
      this.theme = theme;
      this.themeId = g.theme;
      const w = L.w, h = L.h, nav = L.nav;
      const cw = w + 1;
      const amb = theme.amb, sunC = theme.sun, sd = theme.sunDir;
      const sl = Math.hypot(sd[0], sd[1], sd[2]);
      const sunDir = [sd[0] / sl, sd[1] / sl, sd[2] / sl];
      this.sunDir = sunDir;
      const lm = new Float32Array(cw * (h + 1) * 3);
      for (let i = 0; i < cw * (h + 1); i++) { lm[i * 3] = amb[0]; lm[i * 3 + 1] = amb[1]; lm[i * 3 + 2] = amb[2]; }
      const lights = L.objects.filter(o => o.t === 'light' && (!o.if || g.cond(o.if)) && (!o.unless || !g.cond(o.unless)));
      this.lights = lights;
      for (const l of lights) {
        const r = l.r, col = l.col;
        const x0 = Math.max(0, Math.floor(l.x - r)), x1 = Math.min(w, Math.ceil(l.x + r)), z0 = Math.max(0, Math.floor(l.z - r)), z1 = Math.min(h, Math.ceil(l.z + r));
        const ly = nav.heightAt(l.x, l.z) + (l.y || 2);
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
          const dy = ly - nav.corner(x, z) - 0.8;
          const d = Math.hypot(x - l.x, z - l.z, dy * 0.6);
          if (d >= r) continue;
          const dx = l.x - x, dz = l.z - z, dl = Math.hypot(dx, dz) || 1;
          const sx = x + dx / dl * 0.35, sz = z + dz / dl * 0.35;
          if (!D.sightLine(nav, l.x, l.z, sx, sz)) continue;
          const a = Math.pow(1 - d / r, 1.6) * (l.power || 1.25);
          const i = (z * cw + x) * 3;
          lm[i] += col[0] * a; lm[i + 1] += col[1] * a; lm[i + 2] += col[2] * a;
        }
      }
      this.lm = lm; this.lmW = cw;
      const outdoorAt = (x, z) => {
        const cx = Math.min(w - 1, Math.max(0, Math.floor(x))), cz = Math.min(h - 1, Math.max(0, Math.floor(z)));
        return theme.outdoor && !L.roof[cz * w + cx];
      };
      this.outdoorAt = outdoorAt;
      const lmAt = (x, z) => {
        const cx = Math.max(0, Math.min(w, Math.round(x))), cz = Math.max(0, Math.min(h, Math.round(z)));
        const i = (cz * cw + cx) * 3;
        return [lm[i], lm[i + 1], lm[i + 2]];
      };
      this.lmAt = lmAt;
      const lmBi = (x, z) => {
        x = Math.max(0, Math.min(w - 0.001, x)); z = Math.max(0, Math.min(h - 0.001, z));
        const x0 = Math.floor(x), z0 = Math.floor(z), fx = x - x0, fz = z - z0;
        const o = [0, 0, 0];
        for (const [xx, zz, k] of [[x0, z0, (1 - fx) * (1 - fz)], [x0 + 1, z0, fx * (1 - fz)], [x0, z0 + 1, (1 - fx) * fz], [x0 + 1, z0 + 1, fx * fz]]) {
          const i = (zz * cw + xx) * 3; o[0] += lm[i] * k; o[1] += lm[i + 1] * k; o[2] += lm[i + 2] * k;
        }
        return o;
      };
      this.lmBi = lmBi;
      const solidAt = (x, z) => x < 0 || z < 0 || x >= w || z >= h ? 0 : L.solid[z * w + x];
      const ao = (x, z) => {
        let n = 0;
        for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const s = solidAt(x + dx, z + dz); if (s === 1 || s === 2) n++; }
        return 1 - n * 0.12;
      };
      const sunLam = (n) => Math.max(0, -(n[0] * sunDir[0] + n[1] * sunDir[1] + n[2] * sunDir[2]));
      const batches = {};
      const B = (tex, mode) => { const k = tex + '|' + (mode || 'o'); if (!batches[k]) batches[k] = { tex, mode: mode || 'o', geo: new Geo() }; return batches[k].geo; };
      const shadeV = (x, z, n, outdoor, k) => {
        const c = lmBi(x, z);
        if (outdoor) { const s = sunLam(n) * 0.55; c[0] += sunC[0] * s; c[1] += sunC[1] * s; c[2] += sunC[2] * s; }
        return [c[0] * k, c[1] * k, c[2] * k];
      };
      for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
        const i = z * w + x;
        const f = L.floor[i];
        if (!f || L.solid[i]) continue;
        const name = D.FLOORS[f];
        const tex = D.TEX.FLOOR_TEX[name] || 'stone';
        const sc = FLOOR_SCALE[name] || 0.5;
        const hA = nav.corner(x, z), hB = nav.corner(x + 1, z), hC = nav.corner(x + 1, z + 1), hDd = nav.corner(x, z + 1);
        const n = (() => { const ux = 1, uy = hB - hA, vz = 1, vy = hDd - hA; const nx = -uy, ny = 1, nz = -vy; const l = Math.hypot(nx, ny, nz); return [nx / l, ny / l, nz / l]; })();
        const out = outdoorAt(x + 0.5, z + 0.5);
        const vr = (xx, zz) => 0.9 + D.TEX.hash(xx, zz, 5) * 0.14;
        const col = (xx, zz) => shadeV(xx, zz, n, out, ao(xx, zz) * vr(xx, zz) * (name === 'lava' ? 3 : 1));
        const geo = B(tex, name === 'lava' ? 'e' : 'o');
        const pA = [x, hDd, z + 1], pB = [x + 1, hC, z + 1], pC = [x + 1, hB, z], pDd = [x, hA, z];
        const uv = (xx, zz) => [xx * sc, zz * sc];
        geo.vert(pA, uv(x, z + 1), n, col(x, z + 1)); geo.vert(pB, uv(x + 1, z + 1), n, col(x + 1, z + 1)); geo.vert(pC, uv(x + 1, z), n, col(x + 1, z));
        geo.vert(pA, uv(x, z + 1), n, col(x, z + 1)); geo.vert(pC, uv(x + 1, z), n, col(x + 1, z)); geo.vert(pDd, uv(x, z), n, col(x, z));
        const roofH = L.roof[i];
        if (roofH > 0) {
          const y = Math.max(hA, hB, hC, hDd) + roofH;
          const cg = B(theme.ceil || (name === 'wood' || name === 'straw' ? 'wood' : 'w_dark'));
          const cc = k => { const c = lmBi(k[0], k[1]); return [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6]; };
          cg.vert([x, y, z], [x * 0.5, z * 0.5], [0, -1, 0], cc([x, z])); cg.vert([x + 1, y, z], [(x + 1) * 0.5, z * 0.5], [0, -1, 0], cc([x + 1, z])); cg.vert([x + 1, y, z + 1], [(x + 1) * 0.5, (z + 1) * 0.5], [0, -1, 0], cc([x + 1, z + 1]));
          cg.vert([x, y, z], [x * 0.5, z * 0.5], [0, -1, 0], cc([x, z])); cg.vert([x + 1, y, z + 1], [(x + 1) * 0.5, (z + 1) * 0.5], [0, -1, 0], cc([x + 1, z + 1])); cg.vert([x, y, z + 1], [x * 0.5, (z + 1) * 0.5], [0, -1, 0], cc([x, z + 1]));
        }
        const wl = L.water[i];
        if (!isNaN(wl)) {
          const wg = B('water', 'w');
          const y = wl;
          const c = shadeV(x + 0.5, z + 0.5, [0, 1, 0], out, 1);
          wg.quad([x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [x, y, z], [[x * 0.3, (z + 1) * 0.3], [(x + 1) * 0.3, (z + 1) * 0.3], [(x + 1) * 0.3, z * 0.3], [x * 0.3, z * 0.3]], [0, 1, 0], c);
        }
      }
      const rockTop = (x, z, base) => base + 1.5 + D.TEX.hash(x, z, 9) * 2.5;
      for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
        const i = z * w + x;
        const s = L.solid[i];
        if (s !== 1 && s !== 2) continue;
        const wm = D.WALLS[L.wallMat[i]] || 'stone';
        const tex = D.TEX.WALL_TEX[wm] || 'w_stone';
        const base = Math.max(nav.corner(x, z), nav.corner(x + 1, z), nav.corner(x, z + 1), nav.corner(x + 1, z + 1));
        const H = L.wallH[i] || 4;
        const top = (cx, cz) => (s === 2 ? rockTop(cx, cz, base + H - 1.5) : base + H);
        const geo = B(tex);
        const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dz] of sides) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
          const ns = L.solid[nz * w + nx];
          if (ns === 1 || ns === 2) continue;
          let a, bb;
          if (dx === 1) { a = [x + 1, z + 1]; bb = [x + 1, z]; }
          else if (dx === -1) { a = [x, z]; bb = [x, z + 1]; }
          else if (dz === 1) { a = [x, z + 1]; bb = [x + 1, z + 1]; }
          else { a = [x + 1, z]; bb = [x, z]; }
          const ya = ns === 3 ? -8 : nav.corner(a[0], a[1]), yb = ns === 3 ? -8 : nav.corner(bb[0], bb[1]);
          const ta = top(a[0], a[1]), tb = top(bb[0], bb[1]);
          const n = [dx, 0, dz];
          const sx = x + 0.5 + dx * 0.9, sz = z + 0.5 + dz * 0.9;
          const out = outdoorAt(sx, sz) && !L.roof[nz * w + nx];
          const lc = shadeV(sx, sz, n, out, 1);
          const cB = [lc[0] * 0.7, lc[1] * 0.7, lc[2] * 0.7], cT = [lc[0] * 0.95, lc[1] * 0.95, lc[2] * 0.95];
          const u0 = (dx !== 0 ? a[1] : a[0]) * WALL_SCALE, u1 = (dx !== 0 ? bb[1] : bb[0]) * WALL_SCALE;
          geo.vert([a[0], ya, a[1]], [u0, -ya * WALL_SCALE], n, cB); geo.vert([bb[0], yb, bb[1]], [u1, -yb * WALL_SCALE], n, cB); geo.vert([bb[0], tb, bb[1]], [u1, -tb * WALL_SCALE], n, cT);
          geo.vert([a[0], ya, a[1]], [u0, -ya * WALL_SCALE], n, cB); geo.vert([bb[0], tb, bb[1]], [u1, -tb * WALL_SCALE], n, cT); geo.vert([a[0], ta, a[1]], [u0, -ta * WALL_SCALE], n, cT);
        }
        const tg = s === 2 ? geo : B('w_dark');
        const k = s === 2 ? 0.8 : 0.45;
        const tc = (cx, cz) => { const c = lmBi(cx, cz); if (s === 2 && theme.outdoor) { c[0] += sunC[0] * 0.4; c[1] += sunC[1] * 0.4; c[2] += sunC[2] * 0.4; } return [c[0] * k, c[1] * k, c[2] * k]; };
        const p00 = [x, top(x, z), z], p10 = [x + 1, top(x + 1, z), z], p11 = [x + 1, top(x + 1, z + 1), z + 1], p01 = [x, top(x, z + 1), z + 1];
        tg.vert(p01, [x * 0.33, (z + 1) * 0.33], [0, 1, 0], tc(x, z + 1)); tg.vert(p11, [(x + 1) * 0.33, (z + 1) * 0.33], [0, 1, 0], tc(x + 1, z + 1)); tg.vert(p10, [(x + 1) * 0.33, z * 0.33], [0, 1, 0], tc(x + 1, z));
        tg.vert(p01, [x * 0.33, (z + 1) * 0.33], [0, 1, 0], tc(x, z + 1)); tg.vert(p10, [(x + 1) * 0.33, z * 0.33], [0, 1, 0], tc(x + 1, z)); tg.vert(p00, [x * 0.33, z * 0.33], [0, 1, 0], tc(x, z));
      }
      for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
        if (L.solid[z * w + x] !== 3) continue;
        const geo = B('w_cave');
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
          const ns = L.solid[nz * w + nx];
          if (ns !== 0) continue;
          let a, bb;
          if (dx === 1) { a = [x + 1, z]; bb = [x + 1, z + 1]; }
          else if (dx === -1) { a = [x, z + 1]; bb = [x, z]; }
          else if (dz === 1) { a = [x + 1, z + 1]; bb = [x, z + 1]; }
          else { a = [x, z]; bb = [x + 1, z]; }
          const ta = nav.corner(a[0], a[1]), tb = nav.corner(bb[0], bb[1]);
          const n = [-dx, 0, -dz];
          const c1 = [0.35, 0.33, 0.32], c0 = [0.02, 0.02, 0.02];
          geo.vert([a[0], -8, a[1]], [0, 3], n, c0); geo.vert([bb[0], -8, bb[1]], [0.33, 3], n, c0); geo.vert([bb[0], tb, bb[1]], [0.33, 0], n, c1);
          geo.vert([a[0], -8, a[1]], [0, 3], n, c0); geo.vert([bb[0], tb, bb[1]], [0.33, 0], n, c1); geo.vert([a[0], ta, a[1]], [0, 0], n, c1);
        }
        B('plain').quad([x, -8, z + 1], [x + 1, -8, z + 1], [x + 1, -8, z], [x, -8, z], null, [0, 1, 0], [0, 0, 0]);
      }
      const cond = [];
      this.emitters = [];
      for (const o of L.objects) {
        if (o.t === 'light') {
          if ((o.if && !g.cond(o.if)) || (o.unless && g.cond(o.unless))) continue;
          const y = nav.heightAt(o.x, o.z) + (o.y || 2.2);
          if (o.kind === 'torch') {
            const dir = this.wallDir(L, o.x, o.z);
            const px = o.x + dir[0] * 0.42, pz = o.z + dir[1] * 0.42;
            if (dir[0] || dir[1]) {
              const tg = new Geo().box(-0.04, -0.3, -0.04, 0.04, 0, 0.04, { col: [0.4, 0.3, 0.2] }).cyl(0, 0, 0, 0.05, 0.08, 0.14, 5, { col: [0.25, 0.22, 0.2] });
              this.bake(tg, m4.mul(m4.trans(px, y, pz), m4.rx(0)), B('wood'), outdoorAt(px, pz));
              this.emitters.push({ kind: 'torch', x: px, y: y + 0.18, z: pz });
            }
          } else if (o.kind !== 'none' && o.kind !== 'magic') this.emitters.push({ kind: o.kind, x: o.x, y: o.kind === 'fire' ? nav.heightAt(o.x, o.z) + 0.25 : y, z: o.z });
          else if (o.kind === 'magic') this.emitters.push({ kind: 'magic', x: o.x, y, z: o.z, col: o.col });
          continue;
        }
        if (o.t !== 'prop') continue;
        const def = D.PROPS[o.kind];
        let hOverride = null;
        if ((o.kind === 'pillar' || o.kind === 'dpillar') && !o.h) {
          const r = L.roof[Math.floor(o.z) * w + Math.floor(o.x)];
          if (r) hOverride = r;
        }
        const parts = propGeo(o.kind, Object.assign({}, o, hOverride ? { h: hOverride } : {}));
        const y0 = nav.heightAt(o.x, o.z) + (o.y || 0);
        const mat = m4.mul(m4.trans(o.x, y0, o.z), m4.mul(m4.ry((o.rot || 0) * Math.PI / 2 + (o.kind === 'tree' || o.kind === 'pine' || o.kind === 'bush' || o.kind === 'rock' ? (o.spin || 0) : 0)), m4.scale(o.scale || 1)));
        const out = outdoorAt(o.x, o.z);
        if (o.fire || o.kind === 'brazier' || o.kind === 'campfire' || o.kind === 'forge') this.emitters.push({ kind: o.kind === 'campfire' || o.fire ? 'fire' : 'brazier', x: o.x, y: y0 + (o.kind === 'brazier' ? 1.0 : o.kind === 'forge' ? 1.0 : 0.15), z: o.z, cond: o.if || o.unless ? o : null });
        if (o.kind === 'crystal') this.emitters.push({ kind: 'magic', x: o.x, y: y0 + 0.6, z: o.z, col: [0.4, 0.7, 1] });
        if (o.kind === 'lavafall') this.emitters.push({ kind: 'lava', x: o.x, y: y0 + 2.5, z: o.z });
        if (o.if || o.unless) {
          const batchesC = parts.map(p => { const gg = new Geo(); this.bake(p.geo, mat, gg, out, p.emissive); return Object.assign(this.upload(gg), { tex: p.tex, mode: p.cut ? 'c' : p.emissive ? 'e' : 'o' }); });
          cond.push({ o, batches: batchesC });
          continue;
        }
        for (const p of parts) this.bake(p.geo, mat, B(p.tex, p.cut ? 'c' : p.emissive ? 'e' : 'o'), out, p.emissive);
      }
      const roofs = [];
      for (const r of L.roofs) {
        const base = nav.corner(r.x, r.z);
        const rg = roofGeo(Object.assign({}, r, { base }));
        const gR = new Geo(), gG = new Geo();
        this.bake(rg.roof, null, gR, theme.outdoor, 0, 0.9);
        this.bake(rg.gable, null, gG, theme.outdoor, 0, 0.8);
        roofs.push({ r, roof: Object.assign(this.upload(gR), { tex: r.mat === 'slate' ? 'slate' : r.mat === 'wood' ? 'wood' : 'thatch' }), gable: Object.assign(this.upload(gG), { tex: r.wallTex || 'w_timber' }) });
      }
      const list = [];
      for (const k of Object.keys(batches)) { const bb = batches[k]; if (!bb.geo.v.length) continue; list.push(Object.assign(this.upload(bb.geo), { tex: bb.tex, mode: bb.mode })); }
      this.world = { batches: list, roofs, cond, L, w, h };
      this.fog = [theme.fogNear, theme.fogFar];
      this.fogC = hex(theme.fog);
      this.skyC = [hex(theme.sky[0]), hex(theme.sky[1])];
      for (const t of new Set(list.map(b => b.tex))) this.texture(t);
    }
    wallDir(L, x, z) {
      const cx = Math.floor(x), cz = Math.floor(z);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= L.w || nz >= L.h) continue;
        const s = L.solid[nz * L.w + nx];
        if (s === 1 || s === 2) return [dx, dz];
      }
      return [0, 0];
    }
    bake(src, mat, dst, outdoor, emissive, k) {
      const v = src.v;
      const sunC = this.theme.sun, sd = this.sunDir;
      k = k || 1;
      for (let i = 0; i < v.length; i += 11) {
        let p = [v[i], v[i + 1], v[i + 2]], n = [v[i + 5], v[i + 6], v[i + 7]];
        if (mat) { p = m4.tp(mat, p[0], p[1], p[2]); n = m4.tn(mat, n[0], n[1], n[2]); const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l]; }
        let c;
        if (emissive) c = [v[i + 8], v[i + 9], v[i + 10]];
        else {
          c = this.lmBi(p[0], p[2]);
          const up = Math.max(0.55, Math.min(1.1, 0.75 + n[1] * 0.3));
          c[0] *= up; c[1] *= up; c[2] *= up;
          if (outdoor) { const s = Math.max(0, -(n[0] * sd[0] + n[1] * sd[1] + n[2] * sd[2])) * 0.55; c[0] += sunC[0] * s; c[1] += sunC[1] * s; c[2] += sunC[2] * s; }
          c = [c[0] * v[i + 8] * k, c[1] * v[i + 9] * k, c[2] * v[i + 10] * k];
        }
        dst.v.push(p[0], p[1], p[2], v[i + 3], v[i + 4], n[0], n[1], n[2], c[0], c[1], c[2]);
      }
    }

    modelFor(e) {
      const look = e.mouse ? { kind: 'mouse', col: '#8a7a6a' } : e.look;
      const eq = e.look.kind === 'humanoid' || !e.look.kind ? e.equip : null;
      const key = JSON.stringify([look, eq && [eq.main, eq.off, eq.chest, eq.head, eq.gloves, eq.boots]]);
      let m = this.models.get(key);
      if (m) return m;
      const M = buildModel(look, eq);
      for (const p of M.parts) for (const b of p.batches) { const u = this.upload(b.geo); b.buf = u.buf; b.count = u.count; b.geo = null; this.texture(b.tex); }
      this.models.set(key, M);
      if (this.models.size > 160) { const first = this.models.keys().next().value; const old = this.models.get(first); for (const p of old.parts) for (const b of p.batches) this.gl.deleteBuffer(b.buf); this.models.delete(first); }
      return M;
    }

    bind(prog) {
      const gl = this.gl;
      gl.useProgram(prog.p);
    }
    attribs(stride) {
      const gl = this.gl;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 44, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 44, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 44, 32);
    }
    drawMesh(mesh, tex, M, o) {
      if (!mesh || !mesh.count) return;
      const gl = this.gl, u = this.prog.u;
      o = o || {};
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
      this.attribs();
      gl.uniformMatrix4fv(u.uM, false, M || this.I);
      gl.uniform3fv(u.uTint, o.tint || [1, 1, 1]);
      gl.uniform3fv(u.uTintE, o.tint || [1, 1, 1]);
      gl.uniform1f(u.uLit, o.lit ? 1 : 0);
      if (o.lit) { gl.uniform3fv(u.uAmb, o.amb || [1, 1, 1]); gl.uniform3fv(u.uSunC, o.sunC || [0, 0, 0]); }
      gl.uniform1f(u.uCut, o.cut ? 0.5 : 0.02);
      gl.uniform1f(u.uAlpha, o.alpha === undefined ? 1 : o.alpha);
      gl.uniform1f(u.uEmis, o.emis ? 1 : 0);
      gl.uniform1f(u.uBlood, o.blood || 0);
      gl.uniform2fv(u.uUV, o.uv || [0, 0]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture(tex));
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    }

    camera(cam, aspect) {
      const eye = [cam.tx - Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, cam.ty + Math.sin(cam.pitch) * cam.dist, cam.tz - Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist];
      const V = m4.lookAt(eye, [cam.tx, cam.ty, cam.tz], [0, 1, 0]);
      const P = m4.persp(cam.fov || 0.95, aspect, 0.15, 400);
      this.V = V; this.P = P; this.VP = m4.mul(P, V); this.eye = eye;
      this.invVP = m4.invert(this.VP);
      this.camR = [V[0], V[4], V[8]]; this.camU = [V[1], V[5], V[9]];
      return eye;
    }
    project(x, y, z) {
      const m = this.VP;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.01) return null;
      return [(cx / cw * 0.5 + 0.5) * this.canvas.clientWidth, (1 - (cy / cw * 0.5 + 0.5)) * this.canvas.clientHeight, cw];
    }
    ray(px, py) {
      const nx = px / this.canvas.clientWidth * 2 - 1, ny = 1 - py / this.canvas.clientHeight * 2;
      const I = this.invVP;
      const un = (x, y, z) => { const w = I[3] * x + I[7] * y + I[11] * z + I[15]; return [(I[0] * x + I[4] * y + I[8] * z + I[12]) / w, (I[1] * x + I[5] * y + I[9] * z + I[13]) / w, (I[2] * x + I[6] * y + I[10] * z + I[14]) / w]; };
      const a = un(nx, ny, -1), b = un(nx, ny, 1);
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const l = Math.hypot(d[0], d[1], d[2]);
      return { o: a, d: [d[0] / l, d[1] / l, d[2] / l] };
    }

    emit(p) { if (this.particles.length < 1800) this.particles.push(p); }
    burst(x, y, z, n, o) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = (o.speed || 2) * (0.4 + Math.random() * 0.8), up = (o.up || 0.5) + Math.random() * (o.upR || 1);
        this.emit({ x: x + (Math.random() - 0.5) * (o.spread || 0.2), y: y + (Math.random() - 0.5) * (o.spread || 0.2), z: z + (Math.random() - 0.5) * (o.spread || 0.2), vx: Math.sin(a) * s, vy: up * (o.speed || 2) * 0.6, vz: Math.cos(a) * s, life: 0, max: (o.life || 0.8) * (0.6 + Math.random() * 0.6), size: o.size || 0.2, grow: o.grow || 0, col: o.col, tex: o.tex || 'glow', add: o.add !== false, grav: o.grav || 0, drag: o.drag || 0 });
      }
    }
    onFx(ev, g) {
      const ent = ev.uid ? g.ents.find(e => e.uid === ev.uid) : null;
      const ex = ent ? ent.x : ev.x, ez = ent ? ent.z : ev.z, ey = ent ? ent.y : (g.L ? g.L.nav.heightAt(ev.x, ev.z) : 0);
      const H = ent ? (ent.look.kind === 'ogre' ? 3 : ent.look.kind === 'humanoid' ? 1.2 : 0.6) : 0.6;
      switch (ev.fx) {
        case 'blood': this.burst(ex, ey + H, ez, ev.n || 8, { col: [0.55, 0.02, 0.02, 1], tex: 'blood', add: false, speed: 2.2, grav: 9, life: 0.7, size: 0.09, up: 0.6 }); break;
        case 'heal': this.burst(ex, ey + 0.2, ez, 24, { col: [0.3, 1, 0.4, 0.8], speed: 0.6, grav: -2.5, life: 1.2, size: 0.18, spread: 0.8 }); this.flashAt(ex, ey + 1, ez, [0.2, 0.8, 0.3], 5, 0.4); break;
        case 'mana': this.burst(ex, ey + 0.2, ez, 18, { col: [0.3, 0.5, 1, 0.8], speed: 0.6, grav: -2.5, life: 1.2, size: 0.18, spread: 0.8 }); break;
        case 'buff': this.burst(ex, ey + 0.2, ez, 18, { col: [1, 0.85, 0.3, 0.8], speed: 0.8, grav: -2, life: 1, size: 0.16, spread: 0.8 }); break;
        case 'sustain': this.burst(ex, ey + 0.1, ez, 14, { col: [0.5, 0.8, 1, 0.7], speed: 1.2, grav: -1.5, life: 0.9, size: 0.2 }); break;
        case 'taunt': this.fx.push({ kind: 'ring', x: ex, z: ez, y: ey, t: 0, max: 0.6, r0: 0.5, r1: 7, col: [1, 0.3, 0.2, 0.8] }); break;
        case 'cast': {
          const ab = D.AB[ev.ab];
          const col = ab && ab.ic ? hex(ab.ic[1]) : [0.7, 0.7, 1];
          this.burst(ex, ey + 1.3, ez, 10, { col: [col[0], col[1], col[2], 0.9], speed: 1.2, life: 0.5, size: 0.15 });
          break;
        }
        case 'cone': {
          const c = EL_COL[ev.el] || EL_COL.magic;
          for (let i = 0; i < 70; i++) {
            const a = ev.dir + (Math.random() - 0.5) * ev.deg * Math.PI / 180, s = 4 + Math.random() * 7;
            this.emit({ x: ex + Math.sin(ev.dir) * 0.5, y: ey + 1.2, z: ez + Math.cos(ev.dir) * 0.5, vx: Math.sin(a) * s, vy: (Math.random() - 0.3) * 1.5, vz: Math.cos(a) * s, life: 0, max: ev.len / 9 * (0.6 + Math.random() * 0.5), size: 0.3, grow: 1.4, col: [c[0], c[1], c[2], 0.85], tex: ev.el === 'fire' ? 'fire' : 'glow', add: true, grav: 0, drag: 0 });
          }
          this.flashAt(ex, ey + 1, ez, c, 7, 0.4);
          break;
        }
        case 'aoe': {
          const c = EL_COL[ev.el] || EL_COL.magic;
          this.fx.push({ kind: 'ring', x: ex, z: ez, y: ey, t: 0, max: 0.5, r0: 0.3, r1: ev.r, col: [c[0], c[1], c[2], 0.9] });
          this.burst(ex, ey + 0.4, ez, Math.min(80, 16 + ev.r * 10), { col: [c[0], c[1], c[2], 0.8], speed: ev.r * 1.3, life: 0.6, size: 0.3, grow: 0.8, up: 0.2, upR: 0.6 });
          if (ev.el === 'phys') this.burst(ex, ey + 0.2, ez, 30, { col: [0.5, 0.45, 0.4, 0.6], tex: 'smoke', add: false, speed: ev.r, life: 1.1, size: 0.5, grow: 1.5 });
          this.flashAt(ex, ey + 1, ez, c, ev.r * 2.5, 0.35);
          break;
        }
        case 'field': this.fx.push({ kind: 'field', x: ev.x, z: ev.z, y: ey, t: 0, max: ev.dur, r: ev.r, el: ev.el }); break;
        case 'impact': {
          const kind = ev.kind;
          const y = ev.y || ey + 1;
          if (kind === 'fireball') { this.burst(ex, y, ez, 70, { col: [1, 0.55, 0.15, 1], tex: 'fire', speed: 5, life: 0.7, size: 0.45, grow: 1.5 }); this.burst(ex, y, ez, 30, { col: [0.3, 0.28, 0.26, 0.6], tex: 'smoke', add: false, speed: 2, life: 1.6, size: 0.7, grow: 2, grav: -1 }); this.flashAt(ex, y, ez, [1, 0.6, 0.25], 10, 0.5); }
          else if (kind === 'frost') { this.burst(ex, y, ez, 30, { col: [0.7, 0.9, 1, 1], tex: 'spark', speed: 3, life: 0.6, size: 0.18, grav: 3 }); }
          else if (kind === 'stone') { this.burst(ex, y, ez, 20, { col: [0.55, 0.48, 0.4, 1], tex: 'blood', add: false, speed: 3.5, life: 0.8, size: 0.12, grav: 12 }); this.burst(ex, y, ez, 12, { col: [0.5, 0.45, 0.4, 0.5], tex: 'smoke', add: false, speed: 1.2, life: 1.2, size: 0.5, grow: 1.2 }); }
          else if (kind === 'web') this.burst(ex, y, ez, 16, { col: [0.9, 0.9, 0.9, 0.9], tex: 'spark', add: false, speed: 1.5, life: 0.8, size: 0.2 });
          else if (kind === 'bomb') this.burst(ex, y, ez, 40, { col: [0.9, 0.7, 0.3, 1], tex: 'fire', speed: 4, life: 0.6, size: 0.35, grow: 1 });
          else if (kind === 'trap') this.burst(ex, y, ez, 12, { col: [0.8, 0.8, 0.8, 1], tex: 'spark', speed: 2, life: 0.4, size: 0.12 });
          else { const c = kind.startsWith('staff_fire') || kind === 'firebolt' ? EL_COL.fire : kind.includes('cold') ? EL_COL.cold : kind.includes('nature') ? EL_COL.nature : EL_COL.spirit; this.burst(ex, y, ez, 18, { col: [c[0], c[1], c[2], 1], tex: 'spark', speed: 2.5, life: 0.4, size: 0.16 }); this.flashAt(ex, y, ez, c, 4, 0.2); }
          break;
        }
        case 'trap': this.fx.push({ kind: 'trapmark', x: ev.x, z: ev.z, y: ey, t: 0, max: 9999 }); break;
        default: break;
      }
    }
    flashAt(x, y, z, col, r, t) { this.flash = { x, y, z, col, r, t, max: t }; }

    updateParticles(dt, g) {
      const P = this.particles;
      for (const p of P) {
        p.life += dt;
        p.vy -= p.grav * dt;
        if (p.drag) { p.vx *= 1 - p.drag * dt; p.vz *= 1 - p.drag * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.size += p.grow * dt;
        if (p.floor !== undefined && p.y < p.floor) { p.y = p.floor; p.vy = 0; p.vx *= 0.5; p.vz *= 0.5; }
      }
      this.particles = P.filter(p => p.life < p.max);
      this.emitAcc = (this.emitAcc || 0) + dt;
      if (this.emitAcc < 0.05) return;
      const k = this.emitAcc;
      this.emitAcc = 0;
      const eye = this.eye || [0, 0, 0];
      for (const em of this.emitters || []) {
        if (em.cond && ((em.cond.if && !g.cond(em.cond.if)) || (em.cond.unless && g.cond(em.cond.unless)))) continue;
        if (Math.abs(em.x - eye[0]) > 45 || Math.abs(em.z - eye[2]) > 45) continue;
        const n = em.kind === 'fire' ? 3 : em.kind === 'brazier' ? 2 : em.kind === 'candle' ? 0.4 : 1.2;
        for (let i = 0; i < n * k * 20; i += 1) {
          if (em.kind === 'magic') { const c = em.col || [0.4, 0.8, 1]; this.emit({ x: em.x + (Math.random() - 0.5) * 0.6, y: em.y, z: em.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0.4, vz: 0, life: 0, max: 1.2, size: 0.12, grow: -0.05, col: [c[0], c[1], c[2], 0.8], tex: 'glow', add: true, grav: 0 }); continue; }
          if (em.kind === 'lava') { this.emit({ x: em.x + (Math.random() - 0.5), y: em.y + (Math.random() - 0.5) * 3, z: em.z + (Math.random() - 0.5), vx: 0, vy: 1.2, vz: 0, life: 0, max: 1.4, size: 0.1, grow: 0, col: [1, 0.5, 0.1, 1], tex: 'spark', add: true, grav: 0 }); continue; }
          const sz = em.kind === 'candle' ? 0.06 : em.kind === 'torch' ? 0.16 : em.kind === 'fire' ? 0.32 : 0.24;
          this.emit({ x: em.x + (Math.random() - 0.5) * sz, y: em.y, z: em.z + (Math.random() - 0.5) * sz, vx: (Math.random() - 0.5) * 0.2, vy: 0.7 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.2, life: 0, max: 0.35 + Math.random() * 0.3, size: sz, grow: -sz * 1.2, col: [1, 0.55 + Math.random() * 0.25, 0.2, 0.9], tex: 'fire', add: true, grav: 0 });
          if (em.kind === 'fire' && Math.random() < 0.3) this.emit({ x: em.x, y: em.y + 0.6, z: em.z, vx: (Math.random() - 0.5) * 0.3, vy: 0.8, vz: (Math.random() - 0.5) * 0.3, life: 0, max: 2, size: 0.3, grow: 0.5, col: [0.25, 0.23, 0.22, 0.35], tex: 'smoke', add: false, grav: 0 });
          if (Math.random() < 0.08) this.emit({ x: em.x, y: em.y + 0.2, z: em.z, vx: (Math.random() - 0.5), vy: 2, vz: (Math.random() - 0.5), life: 0, max: 0.9, size: 0.04, grow: 0, col: [1, 0.7, 0.3, 1], tex: 'spark', add: true, grav: 0.5 });
        }
      }
      const wth = this.theme && this.theme.weather;
      const l = g.leader;
      if (wth && l) {
        const cnt = wth === 'rain' ? 26 : wth === 'embers' ? 3 : wth === 'ash' ? 5 : 2;
        for (let i = 0; i < cnt * k * 20; i++) {
          const x = l.x + (Math.random() - 0.5) * 30, z = l.z + (Math.random() - 0.5) * 30;
          if (!this.outdoorAt(x, z)) continue;
          const gy = g.L.nav.heightAt(x, z);
          if (wth === 'rain') this.emit({ x, y: gy + 10, z, vx: 0.8, vy: -18, vz: 0.3, life: 0, max: 0.6, size: 0.05, grow: 0, col: [0.7, 0.75, 0.85, 0.45], tex: 'spark', add: false, grav: 0, floor: gy });
          else if (wth === 'embers') this.emit({ x, y: gy + Math.random() * 2, z, vx: (Math.random() - 0.5), vy: 1 + Math.random(), vz: (Math.random() - 0.5), life: 0, max: 3, size: 0.05, grow: 0, col: [1, 0.5, 0.15, 1], tex: 'spark', add: true, grav: -0.1 });
          else if (wth === 'ash') this.emit({ x, y: gy + 6, z, vx: 0.2, vy: -0.6, vz: 0.1, life: 0, max: 8, size: 0.06, grow: 0, col: [0.5, 0.48, 0.45, 0.8], tex: 'spark', add: false, grav: 0, floor: gy });
          else if (wth === 'motes') this.emit({ x, y: gy + 0.5 + Math.random() * 2.5, z, vx: (Math.random() - 0.5) * 0.3, vy: 0.1, vz: (Math.random() - 0.5) * 0.3, life: 0, max: 3, size: 0.06, grow: 0, col: [0.8, 1, 0.6, 0.8], tex: 'glow', add: true, grav: 0 });
        }
      }
      for (const f of g.fields || []) {
        const c = EL_COL[f.el] || EL_COL.magic;
        for (let i = 0; i < 12 * k * 20; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * f.r;
          const x = f.x + Math.sin(a) * r, z = f.z + Math.cos(a) * r;
          this.emit({ x, y: g.L.nav.heightAt(x, z) + (f.el === 'cold' ? 3 : 0.2), z, vx: 0, vy: f.el === 'cold' ? -3 : 1.5, vz: 0, life: 0, max: 0.8, size: 0.25, grow: 0.3, col: [c[0], c[1], c[2], 0.7], tex: f.el === 'fire' ? 'fire' : 'spark', add: true, grav: 0 });
        }
      }
      for (const e of g.ents) {
        if (e.dead) continue;
        if (e.look.kind === 'wisp') this.emit({ x: e.x + (Math.random() - 0.5) * 0.2, y: e.y + 1.3, z: e.z + (Math.random() - 0.5) * 0.2, vx: 0, vy: 0.2, vz: 0, life: 0, max: 0.5, size: 0.4, grow: -0.4, col: [0.6, 0.85, 1, 0.8], tex: 'glow', add: true, grav: 0 });
        if (e.look.kind === 'rage') this.emit({ x: e.x + (Math.random() - 0.5) * 0.6, y: e.y + 0.5 + Math.random() * 1.2, z: e.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 1.2, vz: 0, life: 0, max: 0.6, size: 0.25, grow: -0.3, col: [1, 0.5, 0.1, 0.9], tex: 'fire', add: true, grav: 0 });
        if (e.effects && e.effects.some(x => x.dot && x.dot.el === 'fire')) this.emit({ x: e.x + (Math.random() - 0.5) * 0.4, y: e.y + Math.random() * 1.5, z: e.z + (Math.random() - 0.5) * 0.4, vx: 0, vy: 1, vz: 0, life: 0, max: 0.5, size: 0.2, grow: -0.2, col: [1, 0.5, 0.1, 0.9], tex: 'fire', add: true, grav: 0 });
      }
      for (const p of g.projectiles || []) {
        const c = p.kind === 'fireball' || p.kind === 'firebolt' || p.kind === 'staff_fire' ? [1, 0.55, 0.15] : p.kind === 'frost' || p.kind === 'staff_cold' ? [0.6, 0.85, 1] : p.kind === 'drain' ? [0.8, 0.2, 0.8] : p.kind === 'web' ? [0.9, 0.9, 0.9] : p.kind === 'stone' || p.kind === 'arrow' || p.kind === 'bomb' ? null : [0.7, 0.5, 1];
        if (!c) continue;
        for (let i = 0; i < 3; i++) this.emit({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.4, life: 0, max: 0.35, size: p.kind === 'fireball' ? 0.45 : 0.22, grow: -0.4, col: [c[0], c[1], c[2], 0.9], tex: p.kind === 'fireball' ? 'fire' : 'glow', add: true, grav: 0 });
      }
    }

    drawParticles() {
      const gl = this.gl;
      const P = this.particles;
      if (!P.length) return;
      const groups = {};
      for (const p of P) {
        const k = p.tex + (p.add ? '+' : '-');
        (groups[k] || (groups[k] = [])).push(p);
      }
      gl.useProgram(this.pprog.p);
      const u = this.pprog.u;
      gl.uniformMatrix4fv(u.uVP, false, this.VP);
      gl.uniform3fv(u.uR, this.camR); gl.uniform3fv(u.uU, this.camU); gl.uniform3fv(u.uEye, this.eye);
      gl.uniform2fv(u.uFog, [this.fog[0], this.fog[1] * 1.2]);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pbuf);
      for (let a = 0; a < 2; a++) for (const k of Object.keys(groups)) {
        const add = k.endsWith('+');
        if ((a === 0) === add) continue;
        const list = groups[k];
        const data = new Float32Array(list.length * 6 * 10);
        let o = 0;
        for (const p of list) {
          const t = p.life / p.max;
          const al = p.col[3] * (t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.5) / 0.5));
          const s = Math.max(0.01, p.size);
          for (const [qx, qy] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
            data[o++] = p.x; data[o++] = p.y; data[o++] = p.z; data[o++] = qx; data[o++] = qy; data[o++] = p.col[0]; data[o++] = p.col[1]; data[o++] = p.col[2]; data[o++] = al; data[o++] = s;
          }
        }
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 40, 12);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 20);
        gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 40, 36);
        if (add) gl.blendFunc(gl.SRC_ALPHA, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture(k.slice(0, -1)));
        gl.drawArrays(gl.TRIANGLES, 0, list.length * 6);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.useProgram(this.prog.p);
    }

    entMatrices(e, M, t, ctx) {
      const ps = pose(M, e, t, ctx);
      const root = m4.mul(m4.trans(e.x, e.y + ps.rootY, e.z), m4.mul(m4.ry(e.face || 0), m4.mul(m4.rx(ps.rootRx), m4.mul(m4.rz(ps.rootRz), m4.trans(0, 0, ps.rootZ || 0)))));
      const mats = [];
      for (let i = 0; i < M.parts.length; i++) {
        const p = M.parts[i];
        let parent = p.parent >= 0 ? mats[p.parent] : root;
        let pivot = p.pivot;
        let extra = null;
        const a = ps.P[p.name] || [0, 0, 0];
        if (p.name === 'weapon' || p.name === 'offhand') {
          if (ctx.sheathed) {
            const ti = M.parts.findIndex(q => q.name === 'torso');
            parent = mats[ti];
            const S = M.S || 1;
            if (p.name === 'weapon') {
              if (M.bow) { pivot = [0.05, 0.3 * S, -0.16]; extra = m4.rz(0.35); }
              else if (M.staff) { pivot = [0, 0.25 * S, -0.16]; extra = m4.rz(0.5); }
              else if (M.mainLook === 'dagger') { pivot = [0.14, 0.02, -0.12]; extra = m4.rz(Math.PI); }
              else { pivot = [0.02, 0.4 * S, -0.17]; extra = m4.rz(Math.PI - 0.55); }
            } else {
              if (M.shield) { pivot = [0, 0.3 * S, -0.2]; extra = m4.ry(-Math.PI / 2); }
              else { pivot = [-0.14, 0.02, -0.12]; extra = m4.rz(Math.PI); }
            }
          } else if (p.name === 'weapon') {
            if (M.bow) { const li = M.parts.findIndex(q => q.name === 'handL'); parent = mats[li]; pivot = [0, -0.05, 0.02]; extra = m4.rx(-Math.PI / 2); }
            else if (M.staff) extra = null;
            else extra = m4.rx(Math.PI / 2);
          } else if (!M.shield) extra = m4.rx(Math.PI / 2);
        }
        let m = m4.mul(parent, m4.trans(pivot[0], pivot[1], pivot[2]));
        if (a[2]) m = m4.mul(m, m4.rz(a[2]));
        if (a[1]) m = m4.mul(m, m4.ry(a[1]));
        if (a[0]) m = m4.mul(m, m4.rx(a[0]));
        if (extra) m = m4.mul(m, extra);
        mats.push(m);
      }
      return mats;
    }

    drawEnt(e, g, t, hl) {
      const M = this.modelFor(e);
      let ws = this.walkState.get(e.uid);
      if (!ws) { ws = { x: e.x, z: e.z, ph: Math.random() * 6, mv: 0 }; this.walkState.set(e.uid, ws); }
      const d = Math.hypot(e.x - ws.x, e.z - ws.z);
      ws.x = e.x; ws.z = e.z;
      const dt = this.dt || 0.016;
      const speed = d / Math.max(0.001, dt);
      ws.mv = ws.mv * 0.8 + (speed > 0.3 && d < 2 ? 1 : 0) * 0.2;
      ws.ph += d * (M.kind === 'quad' ? 3.2 : M.kind === 'spider' ? 5 : 2.6) / (M.S || 1);
      const st = e.effects && e.effects.find(x => D.INCAP.has(x.st));
      const ctx = { moving: ws.mv > 0.4 && !e.dead && !e.down, run: speed > 3, walkPhase: ws.ph, combat: g.combat && (e.faction === 'party' || e.faction === 'hostile' || e.faction === 'ally') || e.faction === 'hostile' && e.aware, st: st && st.st, talking: g.dialog && g.dialog.talkUid === e.uid };
      ctx.sheathed = !ctx.combat && (e.faction === 'party' || e.kind === 'npc');
      if (e.look.kind === 'humanoid' && e.kind === 'npc' && !e.equip.main) ctx.sheathed = true;
      const mats = this.entMatrices(e, M, t + (e.uid || 0) * 0.37, ctx);
      const nav = g.L.nav;
      const lm = this.lmBi(e.x, e.z);
      const out = this.outdoorAt(e.x, e.z);
      const sunC = out ? [this.theme.sun[0] * 0.6, this.theme.sun[1] * 0.6, this.theme.sun[2] * 0.6] : [0.05, 0.05, 0.06];
      const amb = [lm[0] * 0.95, lm[1] * 0.95, lm[2] * 0.95];
      let tint = [1, 1, 1];
      if (hl) tint = [1.35, 1.35, 1.2];
      if (e.hurtT > 0.2) tint = [1.6, 0.8, 0.8];
      if (st && st.st === 'freeze') tint = [0.7, 0.9, 1.5];
      if (st && st.st === 'para') tint = [0.8, 0.8, 0.8];
      if (e.effects && e.effects.some(x => x.st === 'field')) tint = [0.7, 1.1, 1.5];
      const stealth = e.sustained && e.sustained.includes('stealth');
      const ghost = e.look.ghost || stealth;
      const alpha = e.dead && e.deadT > 6 ? Math.max(0, 1 - (e.deadT - 6) / 3) : 1;
      if (ghost || alpha < 1) { this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); }
      for (let i = 0; i < M.parts.length; i++) {
        const p = M.parts[i];
        for (const b of p.batches) {
          const col = b.col || [1, 1, 1];
          this.drawMesh(b, b.tex, mats[i], { lit: !b.emissive, amb, sunC, tint: [col[0] * tint[0], col[1] * tint[1], col[2] * tint[2]], emis: b.emissive, blood: e.blood || 0, alpha: (ghost ? 0.45 : 1) * alpha });
        }
      }
      if (ghost || alpha < 1) this.gl.disable(this.gl.BLEND);
      return M;
    }

    drawDecal(x, y, z, r, tex, col, alpha, rot) {
      const m = m4.mul(m4.trans(x, y, z), m4.mul(m4.ry(rot || 0), m4.scale(r * 2, 1, r * 2)));
      this.drawMesh(this.decal, tex, m, { tint: col, emis: 1, alpha });
    }

    render(g, cam, ui) {
      const gl = this.gl;
      const now = performance.now() / 1000;
      this.dt = this.lastT ? Math.min(0.1, now - this.lastT) : 0.016;
      this.lastT = now;
      this.time += this.dt;
      const t = this.time;
      const W = this.canvas.width, H = this.canvas.height;
      gl.viewport(0, 0, W, H);
      const theme = this.theme;
      gl.clearColor(this.fogC[0], this.fogC[1], this.fogC[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.camera(cam, W / H);
      this.I = m4.id();
      gl.useProgram(this.prog.p);
      const u = this.prog.u;
      gl.uniformMatrix4fv(u.uVP, false, this.VP);
      gl.uniform3fv(u.uEye, this.eye);
      gl.uniform3fv(u.uSun, this.sunDir);
      gl.uniform3fv(u.uFogC, this.fogC);
      const fl = this.flash;
      if (fl && fl.t > 0) { fl.t -= this.dt; const k = Math.max(0, fl.t / fl.max); gl.uniform4fv(u.uDyn, [fl.x, fl.y, fl.z, fl.r]); gl.uniform3fv(u.uDynC, [fl.col[0] * k, fl.col[1] * k, fl.col[2] * k]); }
      else gl.uniform3fv(u.uDynC, [0, 0, 0]);
      gl.uniform2fv(u.uFog, [9000, 10000]);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      const skyM = m4.mul(m4.trans(this.eye[0], this.eye[1] - 30, this.eye[2]), m4.id());
      const s0 = this.skyC[0], s1 = this.skyC[1];
      if (!theme.cave && !(theme.sky[0] === '#000' && theme.sky[1] === '#000')) {
        this.drawSkyGradient(skyM, s0, s1);
        if (theme.clouds) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); this.drawMesh(this.sky, 'cloud', m4.mul(m4.trans(this.eye[0], this.eye[1] - 40, this.eye[2]), m4.scale(0.9, 0.35, 0.9)), { tint: [1, 1, 1], emis: 1, alpha: 0.7, uv: [t * 0.004, 0] }); gl.disable(gl.BLEND); }
        if (theme.fadeSky) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); this.drawMesh(this.sky, 'fade', m4.mul(m4.trans(this.eye[0], this.eye[1] - 40, this.eye[2]), m4.scale(0.8, 0.4, 0.8)), { tint: [0.6, 0.8, 0.7], emis: 1, alpha: 0.4, uv: [t * 0.01, t * 0.005] }); gl.disable(gl.BLEND); }
      }
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
      gl.uniform2fv(u.uFog, this.fog);
      const W0 = this.world;
      const leader = g.leader;
      for (const b of W0.batches) if (b.mode === 'o' || b.mode === 'e') this.drawMesh(b, b.tex, null, { emis: b.mode === 'e' ? 0 : 0, tint: b.mode === 'e' ? [1.4, 1.2, 1] : [1, 1, 1] });
      gl.disable(gl.CULL_FACE);
      for (const b of W0.batches) if (b.mode === 'c') this.drawMesh(b, b.tex, null, { cut: 1 });
      gl.enable(gl.CULL_FACE);
      for (const c of W0.cond) {
        const o = c.o;
        if ((o.if && !g.cond(o.if)) || (o.unless && g.cond(o.unless))) continue;
        for (const b of c.batches) { if (b.mode === 'c') gl.disable(gl.CULL_FACE); this.drawMesh(b, b.tex, null, { cut: b.mode === 'c' }); gl.enable(gl.CULL_FACE); }
      }
      for (const r of W0.roofs) {
        if (r.r.hideInside && leader && leader.x >= r.r.x && leader.x <= r.r.x + r.r.w && leader.z >= r.r.z && leader.z <= r.r.z + r.r.d) continue;
        if (cam.pitch > 1.1 && r.r.hideInside && leader && Math.hypot(leader.x - (r.r.x + r.r.w / 2), leader.z - (r.r.z + r.r.d / 2)) < 10) continue;
        gl.disable(gl.CULL_FACE);
        this.drawMesh(r.roof, r.roof.tex, null, {});
        this.drawMesh(r.gable, r.gable.tex, null, {});
        gl.enable(gl.CULL_FACE);
      }
      const hover = ui && ui.hover;
      for (const o of g.activeObjs()) this.drawObj(o, g, t, hover && hover.obj === o);
      const visible = [];
      const eye = this.eye;
      for (const e of g.ents) {
        if (e.gone) continue;
        if (Math.hypot(e.x - eye[0], e.z - eye[2]) > this.fog[1] + 8) continue;
        const hl = hover && hover.ent === e;
        const hostileStealth = e.faction === 'hostile' && e.sustained && e.sustained.includes('stealth');
        if (hostileStealth) continue;
        this.drawEnt(e, g, t, hl);
        visible.push(e);
      }
      for (const p of g.projectiles) {
        if (p.kind === 'arrow') { const dx = p.tx - p.x, dz = p.tz - p.z; const m = m4.mul(m4.trans(p.x, p.y, p.z), m4.ry(Math.atan2(dx, dz))); this.drawMesh(this.arrow, 'plain', m, { lit: true, amb: [0.9, 0.9, 0.9], sunC: [0, 0, 0] }); }
        else if (p.kind === 'stone' || p.kind === 'bomb') { const m = m4.mul(m4.trans(p.x, p.y, p.z), m4.mul(m4.rx(p.t * 8), m4.scale(p.kind === 'bomb' ? 0.4 : 1))); this.drawMesh(this.stone, p.kind === 'bomb' ? 'plain' : 'w_rock', m, { lit: true, amb: [0.8, 0.8, 0.8], sunC: [0, 0, 0] }); }
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-2, -2);
      const nav = g.L.nav;
      for (const e of visible) {
        if (e.gone || (e.dead && e.deadT > 8)) continue;
        const r = e.radius * (e.look.kind === 'spider' ? 2.4 : 1.8);
        this.drawDecal(e.x, nav.heightAt(e.x, e.z) + 0.02, e.z, r, 'shadow', [1, 1, 1], 0.9);
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      for (const e of visible) {
        if (e.dead || e.gone) continue;
        const y = nav.heightAt(e.x, e.z) + 0.04;
        const sel = g.selected && g.selected.includes(e);
        const isTarget = g.leader && g.leader.target === e.uid && e.faction === 'hostile';
        const hl = hover && hover.ent === e;
        const pulse = 0.75 + Math.sin(t * 5) * 0.2;
        if (e === g.leader) this.drawDecal(e.x, y, e.z, e.radius * 1.9, 'ring', [0.3, 1, 0.4], 0.95);
        else if (sel) this.drawDecal(e.x, y, e.z, e.radius * 1.8, 'ring', [0.3, 0.9, 0.4], 0.7);
        else if (e.faction === 'party' && g.combat) this.drawDecal(e.x, y, e.z, e.radius * 1.6, 'ring', [0.2, 0.6, 0.3], 0.35);
        if (isTarget) this.drawDecal(e.x, y, e.z, e.radius * 2.0, 'ring', [1, 0.2, 0.15], pulse);
        else if (hl) this.drawDecal(e.x, y, e.z, e.radius * 2.0, 'ring', e.faction === 'hostile' ? [1, 0.35, 0.2] : [1, 0.9, 0.4], 0.8);
        if (e.cast) this.drawDecal(e.x, y + 0.01, e.z, 1.1 + Math.sin(t * 8) * 0.1, 'ring', [0.6, 0.6, 1], 0.8, t * 2);
      }
      for (const f of this.fx) {
        f.t += this.dt;
        if (f.kind === 'ring') { const k = f.t / f.max; this.drawDecal(f.x, f.y + 0.1, f.z, f.r0 + (f.r1 - f.r0) * k, 'ring', [f.col[0], f.col[1], f.col[2]], f.col[3] * (1 - k)); }
        else if (f.kind === 'field') { const c = EL_COL[f.el] || EL_COL.magic; this.drawDecal(f.x, f.y + 0.06, f.z, f.r, 'glow', c, 0.35 * Math.min(1, (f.max - f.t) / 1)); this.drawDecal(f.x, f.y + 0.07, f.z, f.r, 'ring', c, 0.6); }
      }
      this.fx = this.fx.filter(f => f.t < f.max);
      for (const tr of g.traps || []) this.drawDecal(tr.x, nav.heightAt(tr.x, tr.z) + 0.05, tr.z, 0.45, 'ring', [0.9, 0.7, 0.3], 0.8);
      if (ui && ui.aim) this.drawDecal(ui.aim.x, nav.heightAt(ui.aim.x, ui.aim.z) + 0.08, ui.aim.z, ui.aim.r, 'ring', ui.aim.ok ? [0.4, 0.8, 1] : [1, 0.3, 0.3], 0.9, t);
      if (ui && ui.moveMark && ui.moveMark.t > 0) { const mm = ui.moveMark; this.drawDecal(mm.x, nav.heightAt(mm.x, mm.z) + 0.06, mm.z, 0.3 + (1 - mm.t) * 0.4, 'ring', [0.4, 1, 0.5], mm.t); }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      for (const b of W0.batches) if (b.mode === 'w') this.drawMesh(b, b.tex, null, { alpha: 0.8, uv: [t * 0.02, t * 0.013] });
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      this.updateParticles(this.dt, g);
      this.drawParticles();
      return visible;
    }
    drawSkyGradient(M, top, hor) {
      const gl = this.gl;
      const g = this.skyGradGeo || (this.skyGradGeo = { top: null, hor: null, mesh: null });
      const key = top.join() + hor.join();
      if (g.key !== key) {
        if (g.mesh) this.free(g.mesh);
        const geo = this.skyGeo();
        const v = geo.v;
        for (let i = 0; i < v.length; i += 11) { const k = v[i + 8]; v[i + 8] = top[0] + (hor[0] - top[0]) * k; v[i + 9] = top[1] + (hor[1] - top[1]) * k; v[i + 10] = top[2] + (hor[2] - top[2]) * k; }
        g.mesh = this.upload(geo); g.key = key;
      }
      this.drawMesh(g.mesh, 'plain', M, { lit: false });
    }
    drawObj(o, g, t, hl) {
      const nav = g.L.nav;
      const y = nav.heightAt(o.x, o.z);
      const cache = this.objCache || (this.objCache = {});
      const get = (k, fn) => { if (!cache[k]) cache[k] = fn().map(p => Object.assign(this.upload(p.geo), { tex: p.tex, cut: p.cut, emissive: p.emissive })); return cache[k]; };
      const lm = this.lmBi(o.x, o.z);
      const out = this.outdoorAt(o.x, o.z);
      const sunC = out ? [this.theme.sun[0] * 0.55, this.theme.sun[1] * 0.55, this.theme.sun[2] * 0.55] : [0, 0, 0];
      const tint = hl ? [1.5, 1.4, 1.1] : g.showAll && (o.t === 'box' && !o.empty || o.t === 'use') ? [1.3, 1.25, 1.0] : [1, 1, 1];
      let parts = null, M = null;
      if (o.t === 'box') {
        if (o.kind === 'corpse' || o.kind === 'web' || o.kind === 'bones' || o.kind === 'rubble') parts = get('box_' + o.kind, () => propGeo(o.kind, {}));
        else parts = get('box_' + o.kind, () => propGeo(BOX_KIND[o.kind] || 'chest', {}));
        M = m4.mul(m4.trans(o.x, y, o.z), m4.ry(o.face || 0));
        if (o.empty && o.kind === 'pouch') return;
      } else if (o.t === 'door') {
        parts = get('door', () => propGeo('door', { h: 3 }));
        const ax = o.axis === 'z';
        let rot = ax ? Math.PI / 2 : 0;
        let px = o.x, pz = o.z;
        if (o.open) { rot += Math.PI / 2; if (ax) pz -= 0.5; else px -= 0.5; if (ax) px += 0.5; else pz += 0.5; }
        M = m4.mul(m4.trans(px, y, pz), m4.ry(rot));
      } else if (o.t === 'use' && o.kind) {
        const lit = o.kind === 'beacon' && o.litFlag && g.flag(o.litFlag);
        parts = get('use_' + o.kind + (o.col || ''), () => propGeo(o.kind, { col: o.col, flame: o.flame }));
        M = m4.mul(m4.trans(o.x, y, o.z), m4.ry((o.rot || 0) * Math.PI / 2));
        if (lit && Math.random() < 0.6) this.emit({ x: o.x + (Math.random() - 0.5), y: y + 1.2, z: o.z + (Math.random() - 0.5), vx: 0, vy: 2.5, vz: 0, life: 0, max: 0.8, size: 0.8, grow: -0.6, col: [1, 0.55, 0.15, 0.9], tex: 'fire', add: true, grav: 0 });
        if (o.kind === 'mirror' && Math.random() < 0.3) this.emit({ x: o.x + (Math.random() - 0.5) * 0.8, y: y + 0.5 + Math.random() * 2, z: o.z + 0.1, vx: 0, vy: 0.3, vz: 0.3, life: 0, max: 1, size: 0.08, grow: 0, col: [0.5, 1, 0.9, 0.8], tex: 'glow', add: true, grav: 0 });
      } else if (o.t === 'exit' && !o.hidden) {
        if (!o.marker) return;
        this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.drawDecal(o.x, y + 0.05, o.z, 0.8, 'glow', [0.4, 0.6, 1], 0.4 + Math.sin(t * 3) * 0.15);
        this.gl.disable(this.gl.BLEND);
        return;
      }
      if (!parts) return;
      for (const p of parts) {
        if (p.cut) this.gl.disable(this.gl.CULL_FACE);
        this.drawMesh(p, p.tex, M, { lit: !p.emissive, amb: lm, sunC, tint, cut: p.cut, emis: p.emissive });
        if (p.cut) this.gl.enable(this.gl.CULL_FACE);
      }
    }

    renderPreview(e, opt) {
      const gl = this.gl;
      opt = opt || {};
      const W = this.canvas.width, H = this.canvas.height;
      gl.viewport(0, 0, W, H);
      const bg = opt.bg || [0, 0, 0];
      gl.clearColor(bg[0], bg[1], bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const M = this.modelFor(e);
      const h = M.height || 1.8;
      const cam = opt.head ? { tx: 0, ty: h - 0.2 * (M.S || 1), tz: 0, yaw: Math.PI + (opt.yaw || 0), pitch: 0.05, dist: 0.9 * (M.S || 1), fov: 0.6 } : { tx: 0, ty: h * 0.52, tz: 0, yaw: Math.PI + (opt.yaw || 0), pitch: 0.12, dist: h * 1.55 + 0.6, fov: 0.75 };
      this.camera(cam, W / H);
      gl.useProgram(this.prog.p);
      const u = this.prog.u;
      gl.uniformMatrix4fv(u.uVP, false, this.VP);
      gl.uniform3fv(u.uEye, this.eye);
      gl.uniform3fv(u.uSun, [-0.4, -0.6, -0.7]);
      gl.uniform3fv(u.uFogC, bg);
      gl.uniform2fv(u.uFog, [100, 200]);
      gl.uniform3fv(u.uDynC, [0, 0, 0]);
      const fake = Object.assign({}, e, { x: 0, z: 0, y: 0, face: 0, anim: opt.anim || 'idle', animT: this.time, dead: false, down: false, effects: [], hurtT: 0 });
      this.time += 0.016;
      const mats = this.entMatrices(fake, M, this.time, { moving: false, combat: !!opt.armed, sheathed: !opt.armed, st: null });
      for (let i = 0; i < M.parts.length; i++) for (const b of M.parts[i].batches) {
        const col = b.col || [1, 1, 1];
        this.drawMesh(b, b.tex, mats[i], { lit: !b.emissive, amb: [0.55, 0.52, 0.5], sunC: [0.75, 0.7, 0.62], tint: col, emis: b.emissive });
      }
    }
  }

  D.Renderer = Renderer;
})(globalThis.Dao98 = globalThis.Dao98 || {});
