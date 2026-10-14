(function () {
  const M4 = {
    ident() {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return o;
    },
    chain(...ms) {
      return ms.reduce((acc, m) => M4.mul(acc, m));
    },
    translate(x, y, z) {
      const m = M4.ident();
      m[12] = x; m[13] = y; m[14] = z;
      return m;
    },
    scale(x, y, z) {
      const m = M4.ident();
      m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z;
      return m;
    },
    rotX(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    },
    rotY(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    },
    rotZ(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
    perspective(fovDeg, aspect, near, far) {
      const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
      const m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f;
      m[10] = (far + near) / (near - far); m[11] = -1;
      m[14] = (2 * far * near) / (near - far);
      return m;
    },
    ortho(half, depth) {
      const m = M4.ident();
      m[0] = 1 / half; m[5] = 1 / half; m[10] = -1 / depth;
      return m;
    },
    lookAt(eye, at, up = [0, 1, 0]) {
      const z = V3.norm(V3.sub(eye, at));
      let x = V3.cross(up, z);
      if (V3.len(x) < 1e-5) x = [1, 0, 0];
      x = V3.norm(x);
      const y = V3.cross(z, x);
      return new Float32Array([
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -V3.dot(x, eye), -V3.dot(y, eye), -V3.dot(z, eye), 1
      ]);
    },
    point(m, p) {
      return [
        m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
        m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
        m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]
      ];
    },
    dir(m, v) {
      return [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2]
      ];
    },
    planarShadow(lightDir, h) {
      const k = lightDir[1] === 0 ? 0 : 1 / lightDir[1];
      return new Float32Array([
        1, 0, 0, 0,
        -lightDir[0] * k, 0, -lightDir[2] * k, 0,
        0, 0, 1, 0,
        lightDir[0] * k * h, h, lightDir[2] * k * h, 1
      ]);
    }
  };

  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm(a) {
      const l = V3.len(a) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  };

  function rgb(hex, emissive = 0) {
    if (Array.isArray(hex)) return hex.length === 4 ? hex : [hex[0], hex[1], hex[2], emissive];
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, emissive];
  }

  function shade(hex, k) {
    const c = rgb(hex);
    return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k), c[3]];
  }

  class Builder {
    constructor() {
      this.data = [];
      this.m = M4.ident();
      this.stack = [];
    }

    push(...ms) {
      this.stack.push(this.m);
      this.m = M4.chain(this.m, ...ms);
      return this;
    }

    pop() {
      this.m = this.stack.pop();
      return this;
    }

    at(x, y, z, fn) {
      this.push(M4.translate(x, y, z));
      fn(this);
      return this.pop();
    }

    vert(p, n, col, uv) {
      const wp = M4.point(this.m, p);
      const wn = V3.norm(M4.dir(this.m, n));
      const c = rgb(col);
      this.data.push(wp[0], wp[1], wp[2], wn[0], wn[1], wn[2], c[0], c[1], c[2], c[3], uv ? uv[0] : 0, uv ? uv[1] : 0);
    }

    tri(a, b, c, col, uvs, normals) {
      const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(c, a)));
      const cols = Array.isArray(col) && Array.isArray(col[0]) ? col : [col, col, col];
      const ns = normals || [n, n, n];
      this.vert(a, ns[0], cols[0], uvs && uvs[0]);
      this.vert(b, ns[1], cols[1], uvs && uvs[1]);
      this.vert(c, ns[2], cols[2], uvs && uvs[2]);
      return this;
    }

    quad(a, b, c, d, col, uvs, normals) {
      const one = Array.isArray(col) && Array.isArray(col[0]) ? null : rgb(col);
      const cols = one ? [one, one, one, one] : col.map(c => rgb(c));
      const u = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
      const ns = normals || null;
      this.tri(a, b, c, [cols[0], cols[1], cols[2]], [u[0], u[1], u[2]], ns && [ns[0], ns[1], ns[2]]);
      this.tri(a, c, d, [cols[0], cols[2], cols[3]], [u[0], u[2], u[3]], ns && [ns[0], ns[2], ns[3]]);
      return this;
    }

    box(sx, sy, sz, col, opts = {}) {
      const x = sx / 2, z = sz / 2;
      const y0 = opts.base ? 0 : -sy / 2;
      const y1 = y0 + sy;
      const t = opts.uvScale || 0;
      const uv = (w, h) => t ? [[0, 0], [w * t, 0], [w * t, h * t], [0, h * t]] : null;
      const cs = opts.faces || {};
      const f = (k) => cs[k] !== undefined ? cs[k] : col;
      if (f('front')) this.quad([-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z], f('front'), uv(sx, sy));
      if (f('back')) this.quad([x, y0, -z], [-x, y0, -z], [-x, y1, -z], [x, y1, -z], f('back'), uv(sx, sy));
      if (f('right')) this.quad([x, y0, z], [x, y0, -z], [x, y1, -z], [x, y1, z], f('right'), uv(sz, sy));
      if (f('left')) this.quad([-x, y0, -z], [-x, y0, z], [-x, y1, z], [-x, y1, -z], f('left'), uv(sz, sy));
      if (f('top')) this.quad([-x, y1, z], [x, y1, z], [x, y1, -z], [-x, y1, -z], f('top'), uv(sx, sz));
      if (f('bottom')) this.quad([-x, y0, -z], [x, y0, -z], [x, y0, z], [-x, y0, z], f('bottom'), uv(sx, sz));
      return this;
    }

    prism(sides, r0x, r0z, y0, r1x, r1z, y1, color, opts = {}) {
      const col = rgb(color);
      const col1 = rgb(opts.topColor || color);
      const ring = (rx, rz, y, i) => {
        const a = (i / sides) * Math.PI * 2 + (opts.phase || 0);
        return [Math.sin(a) * rx, y, Math.cos(a) * rz];
      };
      const slope = (r0x - r1x) / Math.max(1e-4, Math.abs(y1 - y0));
      for (let i = 0; i < sides; i++) {
        if (opts.skip && opts.skip.includes(i)) continue;
        const a0 = ring(r0x, r0z, y0, i), a1 = ring(r0x, r0z, y0, i + 1);
        const b0 = ring(r1x, r1z, y1, i), b1 = ring(r1x, r1z, y1, i + 1);
        const n = (p) => V3.norm([p[0] / Math.max(r0x, 1e-4), slope * Math.sign(y1 - y0), p[2] / Math.max(r0z, 1e-4)]);
        const ns = opts.flat ? null : [n(a0), n(a1), n(b1), n(b0)];
        this.quad(a0, a1, b1, b0, [col, col, col1, col1], null, ns);
      }
      if (opts.capTop !== false) {
        const top = [0, y1, 0];
        for (let i = 0; i < sides; i++) this.tri(top, ring(r1x, r1z, y1, i), ring(r1x, r1z, y1, i + 1), col1);
      }
      if (opts.capBottom) {
        const bot = [0, y0, 0];
        for (let i = 0; i < sides; i++) this.tri(bot, ring(r0x, r0z, y0, i + 1), ring(r0x, r0z, y0, i), col);
      }
      return this;
    }

    ellipsoid(rx, ry, rz, seg, rings, col, opts = {}) {
      const pt = (i, j) => {
        const th = (j / rings) * Math.PI;
        const ph = (i / seg) * Math.PI * 2;
        const n = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)];
        return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
      };
      const baseCol = rgb(col);
      const colAt = opts.colorAt ? (p) => rgb(opts.colorAt(p)) : () => baseCol;
      for (let j = 0; j < rings; j++) {
        for (let i = 0; i < seg; i++) {
          const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
          const cols = [colAt(a.p), colAt(b.p), colAt(c.p), colAt(d.p)];
          this.tri(a.p, d.p, c.p, [cols[0], cols[3], cols[2]], null, opts.flat ? null : [a.n, d.n, c.n]);
          this.tri(a.p, c.p, b.p, [cols[0], cols[2], cols[1]], null, opts.flat ? null : [a.n, c.n, b.n]);
        }
      }
      return this;
    }

    disc(r, sides, color, y = 0) {
      const col = rgb(color);
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2;
        this.tri([0, y, 0], [Math.sin(a0) * r, y, Math.cos(a0) * r], [Math.sin(a1) * r, y, Math.cos(a1) * r], col);
      }
      return this;
    }

    get count() {
      return this.data.length / 12;
    }
  }

  const VS = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec4 aCol;
attribute vec2 aUv;
uniform mat4 uModel;
uniform mat4 uVP;
uniform vec3 uEye;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmbTop;
uniform vec3 uAmbBot;
uniform vec3 uP0;
uniform vec3 uP0Col;
uniform vec3 uP1;
uniform vec3 uP1Col;
uniform vec2 uFog;
uniform vec3 uTint;
uniform vec2 uUvScroll;
varying vec4 vCol;
varying vec2 vUv;
varying vec3 vAmb;
varying vec3 vDir;
varying vec3 vWorld;
varying float vFog;
vec3 pointLight(vec3 pos, vec3 col, vec3 w, vec3 n) {
  vec3 d = pos - w;
  float dist = length(d);
  float fall = 1.0 / (1.0 + dist * dist * 0.35);
  return col * max(dot(n, d / max(dist, 0.001)), 0.0) * fall;
}
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vec3 n = normalize(mat3(uModel) * aNrm);
  vAmb = mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5) + pointLight(uP0, uP0Col, w.xyz, n) + pointLight(uP1, uP1Col, w.xyz, n);
  vDir = uSunCol * max(dot(n, -uSunDir), 0.0);
  vCol = vec4(aCol.rgb * uTint, aCol.a);
  vUv = aUv + uUvScroll;
  vWorld = w.xyz;
  vFog = clamp((length(w.xyz - uEye) - uFog.x) / max(uFog.y - uFog.x, 0.001), 0.0, 1.0);
  gl_Position = uVP * w;
}`;

  const FS = `
precision mediump float;
varying vec4 vCol;
varying vec2 vUv;
varying vec3 vAmb;
varying vec3 vDir;
varying vec3 vWorld;
varying float vFog;
uniform sampler2D uTex;
uniform float uTexOn;
uniform sampler2D uCookie;
uniform mat4 uCookieM;
uniform float uCookieOn;
uniform vec3 uFogCol;
uniform vec4 uFlat;
uniform float uAlpha;
uniform float uFogOn;
uniform vec4 uGrade;
uniform mat3 uColorM;
uniform vec3 uColorAdd;
uniform vec3 uFx;
uniform vec4 uRes;
float grainHash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
  if (uFlat.a > 0.0) {
    gl_FragColor = vec4(uFlat.rgb, uFlat.a * uAlpha);
    return;
  }
  vec3 base = vCol.rgb;
  if (uTexOn > 0.5) {
    vec4 t = texture2D(uTex, vUv);
    if (t.a < 0.5) discard;
    base *= t.rgb;
  }
  float cookie = 1.0;
  if (uCookieOn > 0.0) {
    vec4 cp = uCookieM * vec4(vWorld, 1.0);
    cookie = mix(1.0, texture2D(uCookie, cp.xy * 0.5 + 0.5).r, uCookieOn);
  }
  vec3 light = vAmb + vDir * cookie;
  vec3 col = base * mix(light, vec3(1.0), vCol.a);
  col = mix(col, uFogCol, vFog * uFogOn);
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), uGrade.a) * uGrade.rgb;
  col = uColorM * col + uColorAdd;
  if (uFx.x > 0.0) col += (grainHash(floor(gl_FragCoord.xy) + uFx.z * 61.0) - 0.5) * uFx.x;
  if (uFx.y > 0.0) {
    vec2 q = (gl_FragCoord.xy - uRes.xy) / uRes.zw - 0.5;
    col *= 1.0 - uFx.y * dot(q, q) * 1.6;
  }
  gl_FragColor = vec4(col, uAlpha);
}`;

  class Renderer {
    constructor(canvas) {
      const opts = { antialias: false, stencil: true, alpha: false, preserveDrawingBuffer: true };
      const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      if (!gl) throw new Error('webgl');
      this.gl = gl;
      this.canvas = canvas;
      this.prog = this.program(VS, FS);
      gl.useProgram(this.prog);
      this.loc = {};
      ['aPos', 'aNrm', 'aCol', 'aUv'].forEach(a => { this.loc[a] = gl.getAttribLocation(this.prog, a); });
      ['uModel', 'uVP', 'uEye', 'uSunDir', 'uSunCol', 'uAmbTop', 'uAmbBot', 'uP0', 'uP0Col', 'uP1', 'uP1Col', 'uFog', 'uTint', 'uUvScroll',
        'uTex', 'uTexOn', 'uCookie', 'uCookieM', 'uCookieOn', 'uFogCol', 'uFlat', 'uAlpha', 'uFogOn', 'uGrade', 'uColorM', 'uColorAdd', 'uFx', 'uRes'].forEach(u => {
        this.loc[u] = gl.getUniformLocation(this.prog, u);
      });
      gl.uniform1i(this.loc.uTex, 0);
      gl.uniform1i(this.loc.uCookie, 1);
      this.white = this.texture(4, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 4, 4); });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.white);
      gl.activeTexture(gl.TEXTURE0);
      this.polys = 0;
      this.env = null;
    }

    program(vs, fs) {
      const gl = this.gl;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    mesh(builder) {
      const gl = this.gl;
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(builder.data), gl.STATIC_DRAW);
      return { vbo, count: builder.count };
    }

    texture(size, draw, opts = {}) {
      const gl = this.gl;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = opts.height || size;
      draw(c.getContext('2d'), c.width, c.height);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      const filter = opts.nearest ? gl.NEAREST : gl.LINEAR;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      const wrap = opts.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      return t;
    }

    begin(env, camera, rect, keep) {
      const gl = this.gl;
      const x = rect ? rect.x : 0, y = rect ? rect.y : 0;
      const w = rect ? rect.w : this.canvas.width, h = rect ? rect.h : this.canvas.height;
      gl.viewport(x, y, w, h);
      const fc = env.fogColor;
      gl.clearColor(fc[0], fc[1], fc[2], 1);
      gl.clearStencil(0);
      if (rect) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, w, h);
      }
      gl.clear(keep ? gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT : gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(this.prog);
      const proj = camera.proj || M4.perspective(camera.fov || 45, w / h, camera.near || 0.05, camera.far || 80);
      const view = camera.view || M4.lookAt(camera.eye, camera.at, camera.up || [0, 1, 0]);
      gl.uniformMatrix4fv(this.loc.uVP, false, M4.mul(proj, view));
      gl.uniform3fv(this.loc.uEye, camera.eye || [0, 0, 0]);
      gl.uniform3fv(this.loc.uSunDir, V3.norm(env.sunDir));
      gl.uniform3fv(this.loc.uSunCol, env.sunColor);
      gl.uniform3fv(this.loc.uAmbTop, env.ambTop);
      gl.uniform3fv(this.loc.uAmbBot, env.ambBottom);
      const pts = env.points || [];
      const p0 = pts[0] || { pos: [0, -100, 0], color: [0, 0, 0] };
      const p1 = pts[1] || { pos: [0, -100, 0], color: [0, 0, 0] };
      gl.uniform3fv(this.loc.uP0, p0.pos);
      gl.uniform3fv(this.loc.uP0Col, p0.color);
      gl.uniform3fv(this.loc.uP1, p1.pos);
      gl.uniform3fv(this.loc.uP1Col, p1.color);
      gl.uniform2f(this.loc.uFog, env.fogNear, env.fogFar);
      gl.uniform4fv(this.loc.uGrade, camera.grade || env.grade || [1, 1, 1, 0]);
      gl.uniformMatrix3fv(this.loc.uColorM, false, camera.colorM || IDENT3);
      gl.uniform3fv(this.loc.uColorAdd, camera.colorAdd || [0, 0, 0]);
      const fx = camera.fx || {};
      gl.uniform3f(this.loc.uFx, fx.grain || 0, fx.vignette || 0, fx.time || 0);
      gl.uniform4f(this.loc.uRes, x, y, w, h);
      gl.uniform3fv(this.loc.uFogCol, env.fogColor.slice(0, 3));
      if (env.cookie) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, env.cookie.texture);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniformMatrix4fv(this.loc.uCookieM, false, env.cookie.matrix);
        gl.uniform1f(this.loc.uCookieOn, env.cookie.strength);
      } else {
        gl.uniform1f(this.loc.uCookieOn, 0);
      }
      this.env = env;
      this.polys = 0;
      this.viewProj = M4.mul(proj, view);
    }

    draw(mesh, model, opts = {}) {
      if (!mesh || !mesh.count) return;
      const gl = this.gl;
      const L = this.loc;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      const stride = 48;
      gl.enableVertexAttribArray(L.aPos);
      gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(L.aNrm);
      gl.vertexAttribPointer(L.aNrm, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(L.aCol);
      gl.vertexAttribPointer(L.aCol, 4, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(L.aUv);
      gl.vertexAttribPointer(L.aUv, 2, gl.FLOAT, false, stride, 40);
      gl.uniformMatrix4fv(L.uModel, false, model || M4.ident());
      gl.uniform3fv(L.uTint, opts.tint || [1, 1, 1]);
      gl.uniform2fv(L.uUvScroll, opts.uvScroll || [0, 0]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, opts.texture || this.white);
      gl.uniform1f(L.uTexOn, opts.texture ? 1 : 0);
      gl.uniform4fv(L.uFlat, opts.flat || [0, 0, 0, 0]);
      gl.uniform1f(L.uAlpha, opts.alpha === undefined ? 1 : opts.alpha);
      gl.uniform1f(L.uFogOn, opts.noFog ? 0 : 1);
      if (opts.noCookie && this.env && this.env.cookie) gl.uniform1f(L.uCookieOn, 0);
      if (opts.additive) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.depthMask(false);
      } else if (opts.blend) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      }
      if (opts.shadow) {
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.EQUAL, 0, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(-2, -2);
      }
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      if (opts.shadow) {
        gl.disable(gl.STENCIL_TEST);
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      if (opts.additive || opts.blend) {
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
      if (opts.noCookie && this.env && this.env.cookie) gl.uniform1f(L.uCookieOn, this.env.cookie.strength);
      this.polys += mesh.count / 3;
    }

    clear(color) {
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(color[0], color[1], color[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }

    frameTexture(nearest) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      const filter = nearest ? gl.NEAREST : gl.LINEAR;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    grab(tex, x, y, w, h) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, x, y, w, h, 0);
    }

    dispose() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  const IDENT3 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  function cookieMatrix(dir, center, half) {
    const d = V3.norm(dir);
    const eye = V3.sub(center, V3.mul(d, 30));
    const up = Math.abs(d[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
    return M4.mul(M4.ortho(half, 60), M4.lookAt(eye, center, up));
  }

  function rand(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  window.P3D = { M4, V3, rgb, shade, Builder, Renderer, cookieMatrix, rand };
})();
