(function (HO) {
  'use strict';

  const VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol; attribute vec2 aUv;',
    'uniform mat4 uView; uniform mat4 uModel; uniform vec3 uLight; uniform vec3 uAmb; uniform vec3 uSun; uniform vec3 uEye;',
    'uniform float uFogNear; uniform float uFogFar; uniform vec3 uTint; uniform float uEmit;',
    'varying vec3 vCol; varying vec2 vUv; varying float vFog;',
    'void main() {',
    '  vec4 wp = uModel * vec4(aPos, 1.0);',
    '  vec3 n = normalize((uModel * vec4(aNor, 0.0)).xyz);',
    '  float d = max(dot(n, -uLight), 0.0);',
    '  vCol = aCol * uTint * mix(uAmb + uSun * d, vec3(1.0), uEmit);',
    '  vUv = aUv;',
    '  vFog = clamp((length(wp.xyz - uEye) - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);',
    '  gl_Position = uView * wp;',
    '}'
  ].join('\n');

  const FS = [
    'precision mediump float;',
    'uniform sampler2D uTex; uniform float uUseTex; uniform float uAlpha; uniform vec3 uFog; uniform float uDither; uniform float uGray;',
    'varying vec3 vCol; varying vec2 vUv; varying float vFog;',
    'void main() {',
    '  vec4 t = texture2D(uTex, vUv);',
    '  vec3 c = vCol * mix(vec3(1.0), t.rgb, uUseTex);',
    '  float a = mix(1.0, t.a, uUseTex) * uAlpha;',
    '  vec3 o = mix(c, uFog, vFog);',
    '  o = mix(o, vec3(dot(o, vec3(0.3, 0.59, 0.11))), uGray);',
    '  if (uDither > 0.5) {',
    '    vec2 p = mod(floor(gl_FragCoord.xy), 2.0);',
    '    float b = mod(p.x * 2.0 + p.y * 3.0, 4.0) / 4.0;',
    '    o = floor(o * vec3(31.0, 63.0, 31.0) + b) / vec3(31.0, 63.0, 31.0);',
    '  }',
    '  gl_FragColor = vec4(o, a);',
    '}'
  ].join('\n');

  const SKIN_VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv; attribute vec2 aJoint; attribute vec2 aWeight;',
    'uniform vec4 uBones[48]; uniform float uSkin;',
    'uniform mat4 uView; uniform mat4 uModel; uniform vec3 uLight; uniform vec3 uAmb; uniform vec3 uSun; uniform vec3 uEye;',
    'uniform float uFogNear; uniform float uFogFar; uniform vec3 uTint; uniform float uEmit;',
    'varying vec3 vCol; varying vec2 vUv; varying float vFog;',
    'vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }',
    'void main() {',
    '  vec3 p = aPos; vec3 n = aNor;',
    '  if (uSkin > 0.5) {',
    '    int j0 = int(aJoint.x + 0.5); int j1 = int(aJoint.y + 0.5);',
    '    vec4 q0 = uBones[j0 * 2]; vec4 t0 = uBones[j0 * 2 + 1]; vec4 q1 = uBones[j1 * 2]; vec4 t1 = uBones[j1 * 2 + 1];',
    '    p = (qrot(q0, aPos) + t0.xyz) * aWeight.x + (qrot(q1, aPos) + t1.xyz) * aWeight.y;',
    '    n = qrot(q0, aNor) * aWeight.x + qrot(q1, aNor) * aWeight.y;',
    '  }',
    '  vec4 wp = uModel * vec4(p, 1.0);',
    '  vec3 wn = normalize((uModel * vec4(n, 0.0)).xyz);',
    '  float d = max(dot(wn, -uLight), 0.0);',
    '  vCol = uTint * mix(uAmb + uSun * d, vec3(1.0), uEmit);',
    '  vUv = aUv;',
    '  vFog = clamp((length(wp.xyz - uEye) - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);',
    '  gl_Position = uView * wp;',
    '}'
  ].join('\n');

  const rgb = hex => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  const M4 = {
    id: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      return o;
    },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2), m = new Float32Array(16);
      m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f);
      return m;
    },
    lookAt(e, c) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = zz, xy = 0, xz = -zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
        -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    },
    scale(k) {
      const m = M4.id();
      m[0] = k; m[5] = k; m[10] = k;
      return m;
    },
    tilt(a) {
      const c = Math.cos(a), s = Math.sin(a), m = M4.id();
      m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
      return m;
    },
    place(x, y, z, yaw) {
      const c = Math.cos(yaw), s = Math.sin(yaw), m = M4.id();
      m[0] = c; m[2] = s; m[8] = -s; m[10] = c; m[12] = x; m[13] = y; m[14] = z;
      return m;
    }
  };
  HO.M4 = M4;
  const scaleXYZ = (x, y, z) => { const m = M4.id(); m[0] = x; m[5] = y; m[10] = z; return m; };

  class Mesh {
    constructor() { this.pos = []; this.nor = []; this.col = []; this.uv = []; this.idx = []; }

    quad(p, n, col, uv) {
      const base = this.pos.length / 3;
      for (let i = 0; i < 4; i++) {
        this.pos.push(p[i][0], p[i][1], p[i][2]);
        this.nor.push(n[0], n[1], n[2]);
        this.col.push(col[0], col[1], col[2]);
        this.uv.push(uv[i][0], uv[i][1]);
      }
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    box(x0, y0, z0, x1, y1, z1, col, tile) {
      const u = tile || 0;
      const uv = (a, b, c, d) => [[a * u, b * u], [c * u, b * u], [c * u, d * u], [a * u, d * u]];
      const shade = k => [col[0] * k, col[1] * k, col[2] * k];
      this.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], col, uv(x0, z1, x1, z0));
      this.quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], shade(0.7), uv(x0, z0, x1, z1));
      this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], shade(0.95), uv(x0, y0, x1, y1));
      this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], shade(0.95), uv(x1, y0, x0, y1));
      this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], shade(0.9), uv(z1, y0, z0, y1));
      this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], shade(0.9), uv(z0, y0, z1, y1));
    }
  }
  HO.Mesh = Mesh;

  const KIND_COLOR = { floor: '#9aa0aa', wall: '#c9cdd4', pillar: '#d8bf72', step: '#a8b0c0', block: '#8a96b4', crate: '#b08a5a', portrait: '#d8bf72', bed: '#7a8aa8', desk: '#8a7a6a', machine: '#5a6a80', ship: '#3a5a8a', ramp: '#8a96b4', core: '#5a4a8a', shelf: '#7a6a5a', rail: '#1c2240', void: '#05060c', tank: '#3a8a6a', planter: '#5a4a32', cabinet: '#c8ccd8' };

  function heroMesh(path, race, look) {
    const m = new Mesh(), body = rgb(HO.pathColor(path)), dark = rgb(HO.pathDark(path));
    const lk = look || {};
    const skin = rgb(HO.LOOK ? HO.LOOK.skins[lk.skin | 0] : '#f0d6c0'), hair = rgb(HO.LOOK ? HO.LOOK.hairColors[lk.hairColor | 0] : '#5c3a46'), gold = rgb('#d8bf72');
    m.box(-0.22, 0, -0.12, -0.04, 0.85, 0.12, dark);
    m.box(0.04, 0, -0.12, 0.22, 0.85, 0.12, dark);
    m.box(-0.28, 0.85, -0.16, 0.28, 1.45, 0.16, body);
    m.box(-0.4, 0.9, -0.1, -0.28, 1.42, 0.1, body);
    m.box(0.28, 0.9, -0.1, 0.4, 1.42, 0.1, body);
    m.box(-0.28, 1.36, -0.17, 0.28, 1.42, 0.17, gold);
    m.box(-0.15, 1.45, -0.15, 0.15, 1.78, 0.15, skin);
    m.box(-0.16, 1.68, -0.16, 0.16, 1.82, 0.17, hair);
    m.box(-0.05, 1.56, -0.2, 0.05, 1.62, -0.15, gold);
    if (race === 'foxian') {
      m.box(-0.15, 1.82, -0.04, -0.06, 1.96, 0.06, hair);
      m.box(0.06, 1.82, -0.04, 0.15, 1.96, 0.06, hair);
      m.box(-0.07, 0.75, 0.12, 0.07, 0.9, 0.55, hair);
    }
    return m;
  }

  const FLOATERS = new Set(['orb', 'orb2', 'weaver', 'sting', 'sting2']);

  function foeMesh(id) {
    const d = HO.FOES[id], m = new Mesh(), a = rgb(d.col[0]), b = rgb(d.col[1]);
    const dark = [a[0] * 0.6, a[1] * 0.6, a[2] * 0.6];
    if (d.shape === 'trotter') {
      m.box(-0.35, 0.25, -0.5, 0.35, 0.8, 0.45, a);
      m.box(-0.18, 0.4, -0.7, 0.18, 0.66, -0.5, b);
      for (const [x, z] of [[-0.28, -0.35], [0.12, -0.35], [-0.28, 0.2], [0.12, 0.2]]) m.box(x, 0, z, x + 0.16, 0.28, z + 0.16, dark);
      m.box(-0.12, 0.8, -0.1, 0.12, 0.86, 0.1, b);
    } else if (d.shape === 'orb' || d.shape === 'orb2') {
      m.box(-0.38, 0.55, -0.38, 0.38, 1.31, 0.38, a);
      m.box(-0.18, 0.75, -0.46, 0.18, 1.11, -0.38, b);
      m.box(-0.55, 0.85, -0.08, -0.38, 1.0, 0.08, b);
      m.box(0.38, 0.85, -0.08, 0.55, 1.0, 0.08, b);
      m.box(-0.08, 1.31, -0.08, 0.08, 1.5, 0.08, b);
      if (d.shape === 'orb2') m.box(-0.08, 0.36, -0.08, 0.08, 0.55, 0.08, b);
    } else if (d.shape === 'weaver') {
      m.box(-0.3, 0.6, -0.3, 0.3, 1.6, 0.3, a);
      m.box(-1.1, 1.2, -0.06, -0.3, 1.32, 0.06, b);
      m.box(0.3, 1.2, -0.06, 1.1, 1.32, 0.06, b);
      m.box(-0.2, 1.6, -0.2, 0.2, 1.9, 0.2, b);
    } else if (d.shape === 'beast') {
      m.box(-0.75, 0.9, -1.3, 0.75, 2.1, 1.1, a);
      for (const [x, z] of [[-0.55, -0.9], [0.25, -0.9], [-0.55, 0.6], [0.25, 0.6]]) m.box(x, 0, z, x + 0.3, 0.95, z + 0.3, dark);
      m.box(-0.45, 1.3, -1.9, 0.45, 2.0, -1.3, a);
      m.box(-0.1, 1.8, -2.6, 0.1, 2.0, -1.9, b);
      m.box(-0.6, 2.1, -0.6, 0.6, 2.3, 0.6, b);
    } else if (d.shape === 'sting' || d.shape === 'sting2') {
      const big = d.shape === 'sting2' ? 1.25 : 1;
      m.box(-0.22 * big, 0.7, -0.45 * big, 0.22 * big, 1.05 * big, 0.25 * big, a);
      m.box(-0.16 * big, 0.78, 0.25 * big, 0.16 * big, 1.0 * big, 0.75 * big, b);
      m.box(-0.04, 0.82, 0.75 * big, 0.04, 0.9, 1.0 * big, dark);
      m.box(-0.14, 0.82, -0.62 * big, 0.14, 1.0, -0.45 * big, b);
      m.box(-0.75 * big, 1.02 * big, -0.2, -0.22 * big, 1.06 * big, 0.2, b);
      m.box(0.22 * big, 1.02 * big, -0.2, 0.75 * big, 1.06 * big, 0.2, b);
      if (d.shape === 'sting2') m.box(-0.1, 1.05 * big, -0.3, 0.1, 1.25 * big, 0.1, b);
    } else if (d.shape === 'warden') {
      m.box(-0.9, 0, -0.7, 0.9, 1.6, 0.7, a);
      m.box(-0.7, 1.6, -0.6, 0.7, 2.6, 0.6, a);
      m.box(-0.35, 2.6, -0.4, 0.35, 3.0, 0.3, dark);
      m.box(-0.25, 2.7, -0.46, 0.25, 2.85, -0.4, b);
      m.box(-1.6, 1.8, -0.2, -0.7, 2.1, 0.2, dark); m.box(-1.7, 0.9, -1.4, -1.4, 2.0, -0.2, b);
      m.box(0.7, 1.8, -0.2, 1.6, 2.1, 0.2, dark); m.box(1.4, 0.9, -1.4, 1.7, 2.0, -0.2, b);
    } else if (d.shape === 'culture') {
      m.box(-2.2, 0, -2.2, 2.2, 1.2, 2.2, a);
      m.box(-1.6, 1.2, -1.6, 1.6, 2.2, 1.6, a);
      m.box(-0.8, 2.2, -0.8, 0.8, 2.8, 0.8, b);
      for (const [x, z] of [[-1.9, -1.2], [1.6, -1.6], [-1.4, 1.7], [1.8, 1.3]]) m.box(x - 0.15, 1.0, z - 0.15, x + 0.15, 2.6, z + 0.15, b);
    } else if (d.shape === 'doomsday') {
      m.box(-1.6, 1.6, -2.2, 1.6, 4.0, 1.8, a);
      m.box(-1.0, 2.6, -3.4, 1.0, 4.2, -2.2, a);
      m.box(-0.6, 3.2, -3.9, 0.6, 3.7, -3.4, b);
      m.box(-0.9, 4.2, -3.0, -0.6, 5.4, -2.6, b); m.box(0.6, 4.2, -3.0, 0.9, 5.4, -2.6, b);
      for (const [x, z] of [[-1.5, -1.6], [1.0, -1.6], [-1.5, 1.0], [1.0, 1.0]]) m.box(x, 0, z, x + 0.5, 1.7, z + 0.5, dark);
      m.box(-0.4, 2.2, 1.8, 0.4, 2.8, 4.4, a);
      m.box(-0.2, 2.4, 4.4, 0.2, 2.6, 5.6, b);
      m.box(-2.6, 3.0, -1.0, -1.6, 3.4, 0.8, b); m.box(1.6, 3.0, -1.0, 2.6, 3.4, 0.8, b);
    } else if (d.shape === 'swarmking') {
      m.box(-1.2, 0.8, -1.8, 1.2, 2.2, 1.4, a);
      m.box(-0.8, 1.2, -2.6, 0.8, 2.0, -1.8, dark);
      m.box(-0.5, 1.5, -2.9, 0.5, 1.8, -2.6, b);
      m.box(-0.5, 1.0, 1.4, 0.5, 1.8, 3.0, a);
      m.box(-0.15, 1.2, 3.0, 0.15, 1.5, 3.8, b);
      m.box(-3.4, 2.0, -1.0, -1.2, 2.1, 1.0, b); m.box(1.2, 2.0, -1.0, 3.4, 2.1, 1.0, b);
      for (const [x, z] of [[-1.0, -1.2], [0.8, -1.2], [-1.0, 0.8], [0.8, 0.8]]) m.box(x, 0, z, x + 0.2, 0.9, z + 0.2, dark);
    } else if (d.shape === 'spawn') {
      m.box(-0.45, 0, -0.45, 0.45, 0.9, 0.45, a);
      m.box(-0.3, 0.9, -0.3, 0.3, 1.35, 0.3, b);
      m.box(-0.12, 1.35, -0.12, 0.12, 1.6, 0.12, b);
    } else {
      m.box(-0.24, 0, -0.14, -0.06, 0.95, 0.14, dark);
      m.box(0.06, 0, -0.14, 0.24, 0.95, 0.14, dark);
      m.box(-0.34, 0.95, -0.2, 0.34, 1.7, 0.2, a);
      m.box(-0.18, 1.7, -0.18, 0.18, 2.05, 0.18, a);
      m.box(-0.12, 1.82, -0.22, 0.12, 1.9, -0.18, b);
      if (d.shape === 'ranger') { m.box(0.34, 1.0, -0.9, 0.44, 1.12, 0.1, b); m.box(-0.06, 2.05, -0.06, 0.06, 2.3, 0.06, b); }
      else if (d.shape === 'ranger2') m.box(0.3, 1.25, -0.8, 0.5, 1.45, 0.1, b);
      else { m.box(-0.4, 0.9, 0.2, 0.4, 1.7, 0.3, b); m.box(-0.3, 2.05, -0.1, 0.3, 2.15, 0.1, b); }
      if (d.shape !== 'ranger') m.box(-0.46, 1.0, -0.1, -0.34, 1.65, 0.1, a);
    }
    return m;
  }

  function ringTexture(fill) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.strokeStyle = 'rgba(255,255,255,1)';
    x.lineWidth = 5;
    x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.stroke();
    if (fill) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.fill(); }
    return c;
  }

  function gridTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#d4d4d4'; x.fillRect(0, 0, 32, 32); x.fillRect(32, 32, 32, 32);
    x.fillStyle = '#a8a8a8'; x.fillRect(0, 0, 64, 2); x.fillRect(0, 0, 2, 64);
    return c;
  }

  function blobTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 2, 16, 16, 16);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return c;
  }

  class Renderer {
    constructor(canvas) {
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL недоступен');
      this.canvas = canvas;
      this.gl = gl;
      this.mem = { tex: 0, buf: 0 };
      this.stats = { draws: 0, tris: 0 };
      this.prog = this.program(VS, FS);
      this.loc = {};
      for (const k of ['aPos', 'aNor', 'aCol', 'aUv']) this.loc[k] = gl.getAttribLocation(this.prog, k);
      for (const k of ['uView', 'uModel', 'uLight', 'uAmb', 'uSun', 'uEye', 'uFogNear', 'uFogFar', 'uTex', 'uUseTex', 'uAlpha', 'uFog', 'uTint', 'uEmit', 'uDither', 'uGray']) this.loc[k] = gl.getUniformLocation(this.prog, k);
      this.grid = this.texture(gridTexture(), true);
      this.blob = this.texture(blobTexture(), false);
      this.ring = this.texture(ringTexture(false), false);
      this.disc = this.texture(ringTexture(true), false);
      const cube = new Mesh();
      cube.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, [1, 1, 1]);
      this.cube = this.upload(cube);
      this.foeModels = {};
      this.skinProg = this.program(SKIN_VS, FS);
      this.sloc = {};
      for (const k of ['aPos', 'aNor', 'aUv', 'aJoint', 'aWeight']) this.sloc[k] = gl.getAttribLocation(this.skinProg, k);
      for (const k of ['uView', 'uModel', 'uLight', 'uAmb', 'uSun', 'uEye', 'uFogNear', 'uFogFar', 'uTex', 'uUseTex', 'uAlpha', 'uFog', 'uTint', 'uEmit', 'uBones', 'uSkin', 'uDither', 'uGray']) this.sloc[k] = gl.getUniformLocation(this.skinProg, k);
      this.models = {};
      this.textures = {};
      const shadow = new Mesh();
      shadow.quad([[-0.55, 0.035, 0.55], [0.55, 0.035, 0.55], [0.55, 0.035, -0.55], [-0.55, 0.035, -0.55]], [0, 1, 0], [0, 0, 0], [[0, 1], [1, 1], [1, 0], [0, 0]]);
      this.shadow = this.upload(shadow);
      const mark = new Mesh();
      mark.quad([[-0.55, 0.02, 0.55], [0.55, 0.02, 0.55], [0.55, 0.02, -0.55], [-0.55, 0.02, -0.55]], [0, 1, 0], [1, 1, 1], [[0, 1], [1, 1], [1, 0], [0, 0]]);
      this.mark = this.upload(mark);
      this.heroes = {};
      this.zoneMesh = null;
    }

    program(vs, fs) {
      const gl = this.gl, p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    texture(img, repeat) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.mem.tex += Math.round((img.width || 0) * (img.height || 0) * 4 * 4 / 3);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      return t;
    }

    upload(mesh) {
      const gl = this.gl, bytes = (mesh.pos.length * 3 + mesh.uv.length) * 4 + mesh.idx.length * 2, buf = (data, Type, target) => {
        const b = gl.createBuffer();
        gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
        gl.bufferData(target || gl.ARRAY_BUFFER, new Type(data), gl.STATIC_DRAW);
        return b;
      };
      this.mem.buf += bytes;
      return {
        pos: buf(mesh.pos, Float32Array), nor: buf(mesh.nor, Float32Array), col: buf(mesh.col, Float32Array), uv: buf(mesh.uv, Float32Array),
        idx: buf(mesh.idx, Uint16Array, gl.ELEMENT_ARRAY_BUFFER), count: mesh.idx.length, bytes
      };
    }

    free(g) {
      if (!g) return;
      const gl = this.gl;
      for (const b of [g.pos, g.nor, g.col, g.uv, g.idx]) if (b) gl.deleteBuffer(b);
      this.mem.buf -= g.bytes || 0;
    }

    addModel(id, model) {
      const gl = this.gl, buf = (data, target) => {
        const b = gl.createBuffer();
        gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
        gl.bufferData(target || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        this.mem.buf += data.byteLength;
        return b;
      };
      const key = model.meta.tex;
      if (key && !this.textures[key]) this.textures[key] = this.texture(model.image, true);
      this.models[id] = {
        pos: buf(model.pos), nor: buf(model.nor), uv: buf(model.uv),
        joints: model.joints ? buf(model.joints) : null, weights: model.weights ? buf(model.weights) : null,
        idx: buf(model.idx, gl.ELEMENT_ARRAY_BUFFER), count: model.idx.length, tex: key ? this.textures[key] : this.grid, skinned: !!model.joints, bones: model.bones
      };
    }

    addTexture(key, img) {
      if (!this.textures[key]) this.textures[key] = this.texture(img, true);
    }

    hasModel(id) {
      return !!this.models[id];
    }

    fogUniforms(L) {
      const gl = this.gl, k = this.viewScale || 1, on = this.fogOn !== false;
      gl.uniform1f(L.uFogNear, on ? this.fogNear * k : 9000);
      gl.uniform1f(L.uFogFar, on ? this.fogFar * k : 10000);
      gl.uniform3fv(L.uFog, this.fog);
      gl.uniform1f(L.uDither, this.dither ? 1 : 0);
      gl.uniform1f(L.uGray, this.gray || 0);
    }

    renderInset(view, r) {
      const gl = this.gl;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(r.x, r.y, r.w, r.h);
      gl.viewport(r.x, r.y, r.w, r.h);
      gl.clearColor(0.05, 0.07, 0.15, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      const keep = { viewProj: this.viewProj, fogOn: this.fogOn, gray: this.gray, light: this.light };
      this.viewProj = M4.mul(M4.persp(0.7, r.w / r.h, 0.1, 50), M4.lookAt(view.eye, view.target));
      this.light = { dir: [-0.35, -0.6, -0.7], amb: [0.55, 0.57, 0.65], sun: [0.6, 0.58, 0.55], eye: view.eye };
      this.fogOn = false;
      this.gray = 0;
      const items = [];
      for (const a of view.actors) {
        if (!a.model || !this.models[a.model]) continue;
        const matrix = M4.place(a.x, a.y, a.z, a.yaw);
        items.push({ model: a.model, matrix, pose: a.pose, tex: a.tex });
        for (const p of a.parts || []) items.push({ model: p.model, matrix, pose: a.pose, tint: p.tint });
      }
      this.drawModels(items);
      Object.assign(this, keep);
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    drawModels(list) {
      const gl = this.gl, L = this.sloc;
      gl.useProgram(this.skinProg);
      gl.uniformMatrix4fv(L.uView, false, this.viewProj);
      gl.uniform3fv(L.uLight, this.light.dir);
      gl.uniform3fv(L.uAmb, this.light.amb);
      gl.uniform3fv(L.uSun, this.light.sun);
      gl.uniform3fv(L.uEye, this.light.eye);
      this.fogUniforms(L);
      gl.uniform1i(L.uTex, 0);
      gl.uniform1f(L.uUseTex, 1);
      gl.uniform1f(L.uAlpha, 1);
      for (const it of list) {
        const g = this.models[it.model];
        if (!g) continue;
        gl.uniformMatrix4fv(L.uModel, false, it.matrix);
        gl.uniform3fv(L.uTint, it.tint || [1, 1, 1]);
        gl.uniform1f(L.uEmit, it.emit || 0);
        gl.uniform1f(L.uSkin, g.skinned && it.pose ? 1 : 0);
        if (g.skinned && it.pose) gl.uniform4fv(L.uBones, it.pose);
        gl.bindTexture(gl.TEXTURE_2D, (it.tex && this.textures[it.tex]) || g.tex);
        for (const [a, b, n] of [['aPos', g.pos, 3], ['aNor', g.nor, 3], ['aUv', g.uv, 2]]) {
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.enableVertexAttribArray(L[a]);
          gl.vertexAttribPointer(L[a], n, gl.FLOAT, false, 0, 0);
        }
        if (g.skinned) {
          gl.bindBuffer(gl.ARRAY_BUFFER, g.joints);
          gl.enableVertexAttribArray(L.aJoint);
          gl.vertexAttribPointer(L.aJoint, 2, gl.UNSIGNED_BYTE, false, 4, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, g.weights);
          gl.enableVertexAttribArray(L.aWeight);
          gl.vertexAttribPointer(L.aWeight, 2, gl.FLOAT, false, 0, 0);
        } else {
          if (L.aJoint >= 0) { gl.disableVertexAttribArray(L.aJoint); gl.vertexAttrib2f(L.aJoint, 0, 0); }
          if (L.aWeight >= 0) { gl.disableVertexAttribArray(L.aWeight); gl.vertexAttrib2f(L.aWeight, 1, 0); }
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx);
        gl.drawElements(gl.TRIANGLES, g.count, gl.UNSIGNED_SHORT, 0);
        this.stats.draws++;
        this.stats.tris += g.count / 3;
      }
      if (L.aJoint >= 0) gl.disableVertexAttribArray(L.aJoint);
      if (L.aWeight >= 0) gl.disableVertexAttribArray(L.aWeight);
      gl.useProgram(this.prog);
    }

    setFx(img, cells) {
      this.fxTex = {};
      for (const [name, [x, y, w, h]] of Object.entries(cells)) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
        this.fxTex[name] = this.texture(c, false);
      }
      if (!this.spriteQuad) {
        const q = new Mesh();
        q.quad([[-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0]], [0, 0, 1], [1, 1, 1], [[0, 1], [1, 1], [1, 0], [0, 0]]);
        this.spriteQuad = this.upload(q);
        const f = new Mesh();
        f.box(0, 0, 0, 1, 1, 1, [1, 1, 1], 1);
        this.fieldCube = this.upload(f);
      }
    }

    drawSprites(view) {
      const e = view.eye, c = view.target;
      let fx = c[0] - e[0], fy = c[1] - e[1], fz = c[2] - e[2];
      const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
      let rx = -fz, rz = fx;
      const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
      const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
      const gl = this.gl, additive = new Set(['glow', 'beam', 'sparkle']);
      const vp = this.viewProj;
      for (const s of view.sprites) {
        const tex = this.fxTex[s.cell];
        if (!tex || !HO.sphereVisible(vp, s.x, s.y, s.z, s.s * (s.stretch || 1))) continue;
        if (additive.has(s.cell)) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        if (s.ground) {
          this.draw(this.mark, M4.mul(M4.place(s.x, s.y + 0.04, s.z, s.rot), M4.scale(s.s / 1.1)), true, tex, s.alpha, s.col, 1);
          continue;
        }
        const cs = Math.cos(s.rot), sn = Math.sin(s.rot), w = s.s, hh = s.s * (s.stretch || 1);
        const ax = rx * cs + ux * sn, ay = uy * sn, az = rz * cs + uz * sn;
        const bx = -rx * sn + ux * cs, by = uy * cs, bz = -rz * sn + uz * cs;
        const m = new Float32Array([ax * w, ay * w, az * w, 0, bx * hh, by * hh, bz * hh, 0, -fx, -fy, -fz, 0, s.x, s.y, s.z, 1]);
        this.draw(this.spriteQuad, m, true, tex, s.alpha, s.col, 1);
      }
    }

    setSurfaces(img, cells) {
      this.surfaceTex = {};
      for (const [name, [x, y, w, h]] of Object.entries(cells)) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
        this.surfaceTex[name] = this.texture(c, true);
      }
      if (this.zoneDef) this.setZone(this.zoneDef);
    }

    surfaceParts(zone) {
      const meshes = {};
      for (const b of zone.boxes) {
        if (b[6] === 'hidden' || b[6] === 'gate') continue;
        for (const f of HO.surfaceFaces(b)) (meshes[f.mat] || (meshes[f.mat] = new Mesh())).quad(f.p, f.n, [f.k, f.k, f.k], f.uv);
      }
      return Object.entries(meshes).filter(([mat]) => this.surfaceTex[mat]).map(([mat, m]) => ({ mesh: this.upload(m), tex: this.surfaceTex[mat] }));
    }

    setZone(zone) {
      this.zoneDef = zone;
      for (const p of this.zoneParts || []) this.free(p.mesh);
      this.free(this.zoneMesh);
      this.zoneParts = this.surfaceTex ? this.surfaceParts(zone) : null;
      const m = new Mesh();
      for (const b of zone.boxes) if (b[6] !== 'hidden') m.box(b[0], b[1], b[2], b[3], b[4], b[5], rgb(KIND_COLOR[b[6]] || '#a0a0a0'), 0.5);
      this.zoneMesh = this.upload(m);
      this.fog = rgb(zone.fog.color);
      this.fogNear = zone.fog.near;
      this.fogFar = zone.fog.far;
    }

    heroModel(path, race, look) {
      const lk = look || {};
      const key = path + ':' + race + ':' + (lk.skin | 0) + ':' + (lk.hairColor | 0);
      if (!this.heroes[key]) this.heroes[key] = this.upload(heroMesh(path, race, lk));
      return this.heroes[key];
    }

    objModel(look) {
      const key = 'obj:' + look;
      if (!this.foeModels[key]) {
        const m = new Mesh(), gold = rgb('#d8bf72'), dark = rgb('#3a4060'), white = rgb('#e8ecf4'), cyan = rgb('#7ad8ff');
        if (look === 'capsule') { m.box(-0.5, 0, -1.1, 0.5, 0.5, 1.1, white); m.box(-0.45, 0.5, -1.0, 0.45, 0.8, 1.0, cyan); m.box(-0.52, 0, -1.12, 0.52, 0.12, 1.12, gold); }
        else if (look === 'curio') { m.box(-0.35, 0, -0.35, 0.35, 0.9, 0.35, dark); m.box(-0.2, 0.9, -0.2, 0.2, 1.3, 0.2, rgb('#c060ff')); }
        else if (look === 'crate') { m.box(-0.55, 0, -0.55, 0.55, 0.9, 0.55, rgb('#3a5a9a')); m.box(-0.57, 0.4, -0.57, 0.57, 0.5, 0.57, gold); }
        else if (look === 'creature') { const body = rgb('#3a2a24'), leaf = rgb('#60c050'); m.box(-0.3, 0, -0.3, 0.3, 0.5, 0.3, body); m.box(-0.2, 0.5, -0.2, 0.2, 0.62, 0.2, body); m.box(-0.04, 0.62, -0.04, 0.04, 0.78, 0.04, leaf); m.box(-0.04, 0.72, -0.18, 0.04, 0.76, 0.04, leaf); m.box(-0.18, 0.3, -0.32, -0.06, 0.38, -0.3, white); m.box(0.06, 0.3, -0.32, 0.18, 0.38, -0.3, white); }
        else if (look === 'nest') { const shell = rgb('#4a5a2a'), glow = rgb('#a8ff50'); m.box(-0.8, 0, -0.8, 0.8, 0.5, 0.8, shell); m.box(-0.6, 0.5, -0.6, 0.6, 0.9, 0.6, shell); m.box(-0.3, 0.9, -0.3, 0.3, 1.0, 0.3, glow); }
        else if (look === 'beacon') { m.box(-0.5, 0, -0.5, 0.5, 0.3, 0.5, dark); m.box(-0.1, 0.3, -0.1, 0.1, 2.0, 0.1, white); m.box(-0.3, 2.0, -0.3, 0.3, 2.4, 0.3, rgb('#a0ffb0')); }
        else if (look === 'chest') { m.box(-0.8, 0, -0.5, 0.8, 0.7, 0.5, rgb('#6a4a2a')); m.box(-0.85, 0.7, -0.55, 0.85, 0.95, 0.55, gold); m.box(-0.12, 0.45, -0.58, 0.12, 0.75, -0.5, gold); }
        else if (look === 'anchor') { m.box(-0.6, 0, -0.6, 0.6, 0.2, 0.6, dark); m.box(-0.12, 0.2, -0.12, 0.12, 1.6, 0.12, gold); m.box(-0.5, 1.6, -0.08, 0.5, 1.72, 0.08, gold); m.box(-0.08, 1.6, -0.5, 0.08, 1.72, 0.5, gold); m.box(-0.22, 1.9, -0.22, 0.22, 2.34, 0.22, cyan); }
        else if (look === 'rift') { const glow = rgb('#ff4ad8'); m.box(-0.9, 0.2, -0.12, 0.9, 2.8, 0.12, rgb('#140a24')); m.box(-0.7, 0.4, -0.16, 0.7, 2.6, -0.12, glow); m.box(-0.7, 0.4, 0.12, 0.7, 2.6, 0.16, glow); m.box(-1.0, 0, -0.3, 1.0, 0.2, 0.3, dark); }
        else if (look === 'lift') { m.box(-1.5, 0, -1.5, 1.5, 0.1, 1.5, gold); m.box(-1.4, 0, -1.4, -1.2, 3.5, -1.2, white); m.box(1.2, 0, -1.4, 1.4, 3.5, -1.2, white); m.box(-1.4, 0, 1.2, -1.2, 3.5, 1.4, white); m.box(1.2, 0, 1.2, 1.4, 3.5, 1.4, white); m.box(-1.0, 0.1, -1.0, 1.0, 0.16, 1.0, cyan); }
        else { m.box(-0.35, 0.5, -0.12, 0.35, 1.6, 0.12, dark); m.box(-0.28, 0.75, -0.16, 0.28, 1.4, -0.12, cyan); m.box(-0.38, 1.6, -0.15, 0.38, 1.66, 0.15, gold); }
        this.foeModels[key] = this.upload(m);
      }
      return this.foeModels[key];
    }

    personModel(look) {
      const key = 'person:' + JSON.stringify(look);
      if (!this.foeModels[key]) {
        const m = new Mesh(), coat = rgb(look.coat), hair = rgb(look.hair), skin = rgb(look.skin), dark = [coat[0] * 0.35, coat[1] * 0.35, coat[2] * 0.4];
        m.box(-0.2, 0, -0.11, -0.04, 0.82, 0.11, dark);
        m.box(0.04, 0, -0.11, 0.2, 0.82, 0.11, dark);
        m.box(-0.27, 0.8, -0.15, 0.27, 1.42, 0.15, coat);
        m.box(-0.38, 0.86, -0.09, -0.27, 1.4, 0.09, coat);
        m.box(0.27, 0.86, -0.09, 0.38, 1.4, 0.09, coat);
        m.box(-0.14, 1.42, -0.14, 0.14, 1.74, 0.14, skin);
        m.box(-0.15, 1.64, -0.15, 0.15, 1.78, 0.16, hair);
        if (look.race === 'foxian') { m.box(-0.14, 1.78, -0.04, -0.05, 1.92, 0.06, hair); m.box(0.05, 1.78, -0.04, 0.14, 1.92, 0.06, hair); m.box(-0.06, 0.72, 0.12, 0.06, 0.86, 0.5, hair); }
        this.foeModels[key] = this.upload(m);
      }
      return this.foeModels[key];
    }

    npcModel(look) {
      if (look && typeof look === 'object') return this.personModel(look);
      if (look === 'creature') return this.objModel('creature');
      if (look === 'dog') {
        if (!this.foeModels['npc:dog']) {
          const m = new Mesh(), fur = rgb('#f2efe8'), shade = rgb('#c8c0b4'), nose = rgb('#2a2026');
          m.box(-0.16, 0.18, -0.3, 0.16, 0.42, 0.26, fur);
          m.box(-0.14, 0, -0.26, -0.06, 0.2, -0.18, shade); m.box(0.06, 0, -0.26, 0.14, 0.2, -0.18, shade);
          m.box(-0.14, 0, 0.16, -0.06, 0.2, 0.24, shade); m.box(0.06, 0, 0.16, 0.14, 0.2, 0.24, shade);
          m.box(-0.13, 0.34, -0.5, 0.13, 0.58, -0.26, fur);
          m.box(-0.05, 0.38, -0.58, 0.05, 0.46, -0.5, nose);
          m.box(-0.13, 0.58, -0.4, -0.05, 0.7, -0.32, shade); m.box(0.05, 0.58, -0.4, 0.13, 0.7, -0.32, shade);
          m.box(-0.06, 0.38, 0.26, 0.06, 0.5, 0.42, fur);
          this.foeModels['npc:dog'] = this.upload(m);
        }
        return this.foeModels['npc:dog'];
      }
      if (look === 'robot') {
        if (!this.foeModels['npc:robot']) {
          const m = new Mesh(), white = rgb('#e8ecf4'), cyan = rgb('#7ad8ff'), dark = rgb('#3a4060');
          m.box(-0.25, 0.1, -0.25, 0.25, 0.55, 0.25, white);
          m.box(-0.18, 0.55, -0.18, 0.18, 0.8, 0.18, white);
          m.box(-0.12, 0.62, -0.2, 0.12, 0.72, -0.18, cyan);
          m.box(-0.28, 0, -0.2, 0.28, 0.1, 0.2, dark);
          this.foeModels['npc:robot'] = this.upload(m);
        }
        return this.foeModels['npc:robot'];
      }
      const key = 'npc:' + look;
      if (!this.foeModels[key]) {
        const m = new Mesh(), dark = rgb('#3a4060'), gold = rgb('#d8bf72'), screen = rgb('#7ad8ff');
        m.box(-0.45, 0, -0.35, 0.45, 0.9, 0.35, dark);
        m.box(-0.5, 0.88, -0.4, 0.5, 0.96, 0.4, gold);
        m.box(-0.4, 0.96, -0.12, 0.4, 1.6, 0.0, dark);
        m.box(-0.34, 1.02, -0.16, 0.34, 1.54, -0.12, screen);
        m.box(-0.08, 1.6, -0.08, 0.08, 1.8, 0.08, gold);
        this.foeModels[key] = this.upload(m);
      }
      return this.foeModels[key];
    }

    foeModel(id) {
      if (!this.foeModels[id]) this.foeModels[id] = this.upload(foeMesh(id));
      return this.foeModels[id];
    }

    draw(g, model, useTex, tex, alpha, tint, emit) {
      const gl = this.gl, L = this.loc;
      gl.uniformMatrix4fv(L.uModel, false, model);
      gl.uniform3fv(L.uTint, tint || [1, 1, 1]);
      gl.uniform1f(L.uEmit, emit || 0);
      gl.uniform1f(L.uUseTex, useTex ? 1 : 0);
      gl.uniform1f(L.uAlpha, alpha);
      gl.bindTexture(gl.TEXTURE_2D, tex || this.grid);
      for (const [a, b, n] of [['aPos', g.pos, 3], ['aNor', g.nor, 3], ['aCol', g.col, 3], ['aUv', g.uv, 2]]) {
        if (L[a] < 0) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.enableVertexAttribArray(L[a]);
        gl.vertexAttribPointer(L[a], n, gl.FLOAT, false, 0, 0);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx);
      gl.drawElements(gl.TRIANGLES, g.count, gl.UNSIGNED_SHORT, 0);
      this.stats.draws++;
      this.stats.tris += g.count / 3;
    }

    render(view) {
      const gl = this.gl, L = this.loc, w = this.canvas.width, h = this.canvas.height;
      this.stats = { draws: 0, tris: 0 };
      gl.viewport(0, 0, w, h);
      gl.clearColor(this.fog[0], this.fog[1], this.fog[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.useProgram(this.prog);
      const proj = M4.persp(1.05, w / h, 0.1, 200 * (this.viewScale || 1)), cam = M4.lookAt(view.eye, view.target);
      this.viewProj = M4.mul(proj, cam);
      gl.uniformMatrix4fv(L.uView, false, this.viewProj);
      this.light = { dir: [-0.35, -0.85, -0.4], amb: [0.45, 0.47, 0.55], sun: [0.62, 0.6, 0.55], eye: view.eye };
      gl.uniform3fv(L.uLight, this.light.dir);
      gl.uniform3fv(L.uAmb, this.light.amb);
      gl.uniform3fv(L.uSun, this.light.sun);
      gl.uniform3fv(L.uEye, view.eye);
      this.fogUniforms(L);
      gl.uniform1i(L.uTex, 0);
      gl.disable(gl.BLEND);
      if (this.zoneParts) for (const p of this.zoneParts) this.draw(p.mesh, M4.id(), true, p.tex, 1);
      else if (this.zoneMesh) this.draw(this.zoneMesh, M4.id(), true, this.grid, 1);
      const time = view.time || 0;
      const items = [];
      const far = this.fogOn !== false ? this.fogFar * (this.viewScale || 1) : 200 * (this.viewScale || 1), vp = this.viewProj, eye = view.eye;
      const seen = a => HO.sphereVisible(vp, a.x, a.y + (a.h || 1.6) * 0.5, a.z, Math.max(1.2, (a.r || 0.5) * 3) * (a.scale || 1), far, eye);
      const shown = view.actors.filter(seen);
      for (const d of view.decor || []) if (this.models[d.model] && HO.sphereVisible(vp, d.x, d.y + 1.5, d.z, 3, far, eye)) items.push({ model: d.model, matrix: M4.place(d.x, d.y, d.z, d.yaw) });
      for (const a of shown) {
        if (a.model && this.models[a.model]) {
          const matrix = a.scale && a.scale !== 1 ? M4.mul(M4.place(a.x, a.y, a.z, a.yaw), M4.scale(a.scale)) : M4.place(a.x, a.y, a.z, a.yaw);
          items.push({ model: a.model, matrix, pose: a.pose, tint: a.tint, emit: a.flash, tex: a.tex });
          for (const p of a.parts || []) items.push({ model: p.model, matrix, pose: a.pose, tint: p.tint && a.tint ? p.tint.map((v, i) => v * a.tint[i]) : p.tint || a.tint, emit: a.flash });
          continue;
        }
        const g = a.kind === 'foe' ? this.foeModel(a.id) : a.kind === 'npc' ? this.npcModel(a.look) : a.kind === 'obj' ? this.objModel(a.look) : this.heroModel(a.path, a.race, a.look);
        const bob = a.kind === 'foe' && !a.dead && !a.still && FLOATERS.has(HO.FOES[a.id].shape) ? 0.15 * Math.sin(time * 2.4 + a.uid) : 0;
        let model = M4.place(a.x, a.y + bob, a.z, a.yaw);
        if (a.dead) model = M4.mul(model, M4.tilt(a.kind === 'foe' ? 1.2 : 1.45));
        this.draw(g, model, false, null, 1, a.tint, a.flash || 0);
      }
      this.drawModels(items);
      for (const b of this.fxTex ? [] : view.gates || []) {
        const pulse = 0.75 + 0.25 * Math.sin(time * 4);
        this.draw(this.cube, M4.mul(M4.mul(M4.place((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2, 0), M4.id()), scaleXYZ(b[3] - b[0], b[4] - b[1], b[5] - b[2])), false, null, 1, [0.3 * pulse, 0.75 * pulse, 1 * pulse], 1);
      }
      for (const e of view.effects || []) this.draw(this.cube, M4.mul(M4.place(e.x, e.y, e.z, e.spin || 0), M4.scale(e.s)), false, null, 1, e.col, 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      if (this.shadowsOn !== false) for (const a of shown) if (!a.dead) this.draw(this.shadow, M4.mul(M4.place(a.x, a.floor, a.z, 0), M4.scale(a.r ? a.r / 0.45 : 1)), true, this.blob, 1);
      const ringTex = this.fxTex ? this.fxTex.ring : this.ring, discTex = this.fxTex ? this.fxTex.disc : this.disc;
      for (const m of view.marks || []) this.draw(this.mark, M4.mul(M4.place(m.x, m.y + 0.03, m.z, 0), M4.scale(m.r / 0.55)), true, m.fill ? discTex : ringTex, m.alpha, m.col, 1);
      if (this.fxTex) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.CULL_FACE);
        const pulse = 0.7 + 0.3 * Math.sin(time * 4);
        for (const b of view.gates || []) this.draw(this.fieldCube, M4.mul(M4.place(b[0], b[1], b[2], 0), scaleXYZ(b[3] - b[0], b[4] - b[1], b[5] - b[2])), true, this.fxTex.field, 0.55 * pulse, [0.35, 0.8, 1], 1);
        if (view.sprites) this.drawSprites(view);
        gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    dispose() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  HO.Renderer = Renderer;
})(globalThis.HO = globalThis.HO || {});
