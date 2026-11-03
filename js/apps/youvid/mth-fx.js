(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { clamp } = K;

  const VS = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec4 aCol;
attribute vec2 aUv;
uniform mat4 uModel;
uniform mat4 uVP;
uniform vec2 uUvScroll;
varying vec3 vW;
varying vec3 vN;
varying vec4 vCol;
varying vec2 vUv;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = mat3(uModel) * aNrm;
  vCol = aCol;
  vUv = aUv + uUvScroll;
  gl_Position = uVP * w;
}`;

  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vW;
varying vec3 vN;
varying vec4 vCol;
varying vec2 vUv;
uniform vec3 uEye;
uniform vec3 uKeyDir;
uniform vec3 uKeyCol;
uniform vec3 uAmbTop;
uniform vec3 uAmbBot;
uniform vec3 uWarp;
uniform vec3 uRimCol;
uniform float uRimPow;
uniform vec3 uP0;
uniform vec3 uP0Col;
uniform vec3 uP1;
uniform vec3 uP1Col;
uniform vec2 uPK;
uniform vec3 uFogCol;
uniform vec2 uFog;
uniform float uFogOn;
uniform sampler2D uTex;
uniform float uTexOn;
uniform vec3 uTint;
uniform float uAlpha;
uniform vec4 uFlat;
uniform vec3 uMat;
uniform vec4 uGrade;
uniform vec2 uVig;
uniform vec4 uRes;
uniform float uBackDark;
float hl(vec3 n, vec3 l) {
  float d = dot(n, l) * 0.5 + 0.5;
  return d * d;
}
vec3 warp(float h) {
  return mix(uWarp, vec3(1.0), h) * h;
}
void main() {
  if (uFlat.a > 0.0) {
    gl_FragColor = vec4(uFlat.rgb, uFlat.a * uAlpha);
    return;
  }
  vec3 base = vCol.rgb * uTint;
  if (uTexOn > 0.5) {
    vec4 t = texture2D(uTex, vUv);
    if (t.a < 0.5) discard;
    base *= t.rgb;
  }
  if (uBackDark > 0.5 && !gl_FrontFacing) {
    gl_FragColor = vec4(base * 0.12, uAlpha);
    return;
  }
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  vec3 l = -normalize(uKeyDir);
  vec3 light = mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5) + uKeyCol * warp(hl(n, l));
  vec3 d0 = uP0 - vW;
  light += uP0Col * warp(hl(n, normalize(d0))) / (1.0 + dot(d0, d0) * uPK.x);
  vec3 d1 = uP1 - vW;
  light += uP1Col * warp(hl(n, normalize(d1))) / (1.0 + dot(d1, d1) * uPK.y);
  float lit = 1.0 - vCol.a;
  vec3 col = base * mix(vec3(1.0), light, lit);
  float nv = max(dot(n, v), 0.0);
  float spec = pow(max(dot(n, normalize(l + v)), 0.0), uMat.y) * uMat.x;
  float rim = pow(1.0 - nv, uRimPow) * clamp(n.y * 0.6 + 0.55, 0.0, 1.0) * uMat.z;
  col += (uKeyCol * spec + uRimCol * rim * (0.45 + 0.55 * base)) * lit;
  float fog = clamp((length(vW - uEye) - uFog.x) / max(uFog.y - uFog.x, 0.001), 0.0, 1.0) * uFogOn;
  col = mix(col, uFogCol, fog);
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), uGrade.a) * uGrade.rgb;
  if (uVig.x > 0.0) {
    vec2 q = (gl_FragCoord.xy - uRes.xy) / uRes.zw - 0.5;
    col *= 1.0 - uVig.x * dot(q, q) * 1.6;
  }
  gl_FragColor = vec4(col, uAlpha);
}`;

  const NAMES = ['uModel', 'uVP', 'uUvScroll', 'uEye', 'uKeyDir', 'uKeyCol', 'uAmbTop', 'uAmbBot', 'uWarp', 'uRimCol', 'uRimPow', 'uP0', 'uP0Col', 'uP1', 'uP1Col', 'uPK',
    'uFogCol', 'uFog', 'uFogOn', 'uTex', 'uTexOn', 'uTint', 'uAlpha', 'uFlat', 'uMat', 'uGrade', 'uVig', 'uRes', 'uBackDark'];

  const DEFAULT_ENV = {
    key: { dir: [-0.4, -0.7, -0.6], col: [1, 0.95, 0.88] },
    ambTop: [0.4, 0.4, 0.42],
    ambBot: [0.2, 0.18, 0.17],
    warp: [0.62, 0.36, 0.3],
    rim: [0.5, 0.5, 0.55],
    rimPow: 3,
    points: [],
    fogCol: [0, 0, 0],
    fog: [500, 900],
    clear: [0, 0, 0],
    grade: [1, 1, 1, 0],
    vig: 0
  };

  function create(r) {
    const gl = r.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    ['aPos', 'aNrm', 'aCol', 'aUv'].forEach(a => { if (r.loc[a] >= 0) gl.bindAttribLocation(prog, r.loc[a], a); });
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const L = {};
    ['aPos', 'aNrm', 'aCol', 'aUv'].forEach(a => { L[a] = gl.getAttribLocation(prog, a); });
    NAMES.forEach(u => { L[u] = gl.getUniformLocation(prog, u); });
    gl.useProgram(prog);
    gl.uniform1i(L.uTex, 0);
    gl.useProgram(r.prog);
    const cw = r.canvas.width, ch = r.canvas.height;
    const px = K.overlay(r, cw, ch);
    const F = [r.frameTexture(false), r.frameTexture(false), r.frameTexture(false), r.frameTexture(false), r.frameTexture(false)];
    const state = { vp: null, cam: null, rect: null, env: DEFAULT_ENV, polys: 0 };

    function camMatrices(cam, w, h) {
      const proj = M4.perspective(cam.fov || 45, w / h, cam.near || 0.05, cam.far || 300);
      let up = cam.up || [0, 1, 0];
      if (cam.roll) {
        const view = V3.norm(V3.sub(cam.at, cam.eye));
        let right = V3.cross(view, [0, 1, 0]);
        if (V3.len(right) < 1e-4) right = [1, 0, 0];
        right = V3.norm(right);
        const u0 = V3.cross(right, view);
        up = V3.add(V3.mul(u0, Math.cos(cam.roll)), V3.mul(right, Math.sin(cam.roll)));
      }
      const view = M4.lookAt(cam.eye, cam.at, up);
      return M4.mul(proj, view);
    }

    function applyEnv(env, cam, x, y, w, h) {
      const E = Object.assign({}, DEFAULT_ENV, env);
      const key = E.key || DEFAULT_ENV.key;
      gl.uniform3fv(L.uEye, cam.eye);
      gl.uniform3fv(L.uKeyDir, V3.norm(key.dir));
      gl.uniform3fv(L.uKeyCol, key.col);
      gl.uniform3fv(L.uAmbTop, E.ambTop);
      gl.uniform3fv(L.uAmbBot, E.ambBot);
      gl.uniform3fv(L.uWarp, E.warp);
      gl.uniform3fv(L.uRimCol, E.rim);
      gl.uniform1f(L.uRimPow, E.rimPow);
      const p0 = E.points[0] || { pos: [0, -900, 0], col: [0, 0, 0], k: 1 };
      const p1 = E.points[1] || { pos: [0, -900, 0], col: [0, 0, 0], k: 1 };
      gl.uniform3fv(L.uP0, p0.pos);
      gl.uniform3fv(L.uP0Col, p0.col);
      gl.uniform3fv(L.uP1, p1.pos);
      gl.uniform3fv(L.uP1Col, p1.col);
      gl.uniform2f(L.uPK, p0.k === undefined ? 0.5 : p0.k, p1.k === undefined ? 0.5 : p1.k);
      gl.uniform3fv(L.uFogCol, E.fogCol);
      gl.uniform2fv(L.uFog, E.fog);
      gl.uniform4fv(L.uGrade, E.grade);
      gl.uniform2f(L.uVig, E.vig || 0, 0);
      gl.uniform4f(L.uRes, x, y, w, h);
      state.env = E;
    }

    function begin(env, cam, rect, keep) {
      const x = rect ? rect.x : 0, y = rect ? rect.y : 0;
      const w = rect ? rect.w : cw, h = rect ? rect.h : ch;
      gl.viewport(x, y, w, h);
      const bg = (env && env.clear) || [0, 0, 0];
      gl.clearColor(bg[0], bg[1], bg[2], 1);
      if (rect) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, w, h);
      }
      gl.clear(keep ? gl.DEPTH_BUFFER_BIT : gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(prog);
      const vp = camMatrices(cam, w, h);
      gl.uniformMatrix4fv(L.uVP, false, vp);
      applyEnv(env || {}, cam, x, y, w, h);
      state.vp = vp;
      state.cam = cam;
      state.rect = { x, y, w, h };
      state.polys = 0;
    }

    function resume() {
      const R = state.rect || { x: 0, y: 0, w: cw, h: ch };
      gl.viewport(R.x, R.y, R.w, R.h);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.useProgram(prog);
    }

    function draw(mesh, model, opts) {
      if (!mesh || !mesh.count) return;
      const o = opts || {};
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
      gl.uniform3fv(L.uTint, o.tint || [1, 1, 1]);
      gl.uniform2fv(L.uUvScroll, o.uvScroll || [0, 0]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, o.texture || r.white);
      gl.uniform1f(L.uTexOn, o.texture ? 1 : 0);
      gl.uniform4fv(L.uFlat, o.flat || [0, 0, 0, 0]);
      gl.uniform1f(L.uAlpha, o.alpha === undefined ? 1 : o.alpha);
      gl.uniform1f(L.uFogOn, o.noFog ? 0 : 1);
      gl.uniform1f(L.uBackDark, o.backDark ? 1 : 0);
      const spec = o.spec || [0.12, 14];
      gl.uniform3f(L.uMat, spec[0], spec[1], o.rim === undefined ? 1 : o.rim);
      if (o.additive) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.depthMask(false);
      } else if (o.blend || (o.alpha !== undefined && o.alpha < 1)) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      }
      if (o.noDepth) gl.disable(gl.DEPTH_TEST);
      if (mesh.indexed) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
      }
      if (o.noDepth) gl.enable(gl.DEPTH_TEST);
      if (o.additive || o.blend || (o.alpha !== undefined && o.alpha < 1)) {
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
      state.polys += mesh.count / 3;
    }

    function dyn() {
      const m = { vbo: gl.createBuffer(), ibo: gl.createBuffer(), count: 0, indexed: true };
      m.update = (verts, idx) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
        if (idx) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
          m.count = idx.length;
        }
      };
      return m;
    }

    function indexed(verts, idx) {
      const m = dyn();
      m.update(verts, idx);
      return m;
    }

    function blurBack(amount) {
      const a = clamp(amount === undefined ? 1 : amount, 0, 1);
      if (a <= 0) return;
      const sizes = [[cw, ch], [Math.round(cw / 2), Math.round(ch / 2)], [Math.round(cw / 4), Math.round(ch / 4)], [Math.round(cw / 8), Math.round(ch / 8)], [Math.round(cw / 16), Math.round(ch / 16)]];
      r.grab(F[0], 0, 0, cw, ch);
      px.begin();
      for (let i = 1; i < sizes.length; i++) {
        px.rect(0, 0, sizes[i][0], sizes[i][1], { texture: F[i - 1] });
        r.grab(F[i], 0, ch - sizes[i][1], sizes[i][0], sizes[i][1]);
      }
      px.rect(0, 0, cw, ch, { texture: F[0] });
      px.rect(0, 0, cw, ch, { texture: F[2], blend: true, alpha: clamp(a * 1.4, 0, 1) });
      px.rect(0, 0, cw, ch, { texture: F[3], blend: true, alpha: clamp(a * 1.1, 0, 1) });
      px.rect(0, 0, cw, ch, { texture: F[4], blend: true, alpha: clamp(a * a * 0.8, 0, 1) });
      gl.clear(gl.DEPTH_BUFFER_BIT);
      resume();
    }

    function glow(amount, threshold) {
      r.grab(F[0], 0, 0, cw, ch);
      px.begin();
      const sizes = [[cw, ch], [Math.round(cw / 2), Math.round(ch / 2)], [Math.round(cw / 4), Math.round(ch / 4)], [Math.round(cw / 8), Math.round(ch / 8)]];
      for (let i = 1; i < sizes.length; i++) {
        px.rect(0, 0, sizes[i][0], sizes[i][1], { texture: F[i - 1] });
        r.grab(F[i], 0, ch - sizes[i][1], sizes[i][0], sizes[i][1]);
      }
      px.rect(0, 0, cw, ch, { texture: F[0] });
      const k = amount || 0.3;
      const th = threshold === undefined ? 0.55 : threshold;
      px.rect(0, 0, cw, ch, { texture: F[2], additive: true, alpha: k, tint: [1 - th * 0.5, 1 - th * 0.5, 1 - th * 0.5] });
      px.rect(0, 0, cw, ch, { texture: F[3], additive: true, alpha: k * 0.8, tint: [1 - th * 0.5, 1 - th * 0.55, 1 - th * 0.6] });
    }

    function basis() {
      const cam = state.cam;
      const view = V3.norm(V3.sub(cam.at, cam.eye));
      let right = V3.cross(view, [0, 1, 0]);
      if (V3.len(right) < 1e-4) right = [1, 0, 0];
      right = V3.norm(right);
      const up = V3.cross(right, view);
      return { view, right, up };
    }

    function billboard(p, s, spin) {
      const B = basis();
      let right = B.right, up = B.up;
      if (spin) {
        const c = Math.cos(spin), sn = Math.sin(spin);
        const r2 = V3.add(V3.mul(right, c), V3.mul(up, sn));
        up = V3.add(V3.mul(up, c), V3.mul(right, -sn));
        right = r2;
      }
      const sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s;
      const o = V3.sub(p, V3.add(V3.mul(right, sx / 2), V3.mul(up, sy / 2)));
      return new Float32Array([right[0] * sx, right[1] * sx, right[2] * sx, 0, up[0] * sy, up[1] * sy, up[2] * sy, 0, -B.view[0], -B.view[1], -B.view[2], 0, o[0], o[1], o[2], 1]);
    }

    function streak(a, b, width) {
      const B = basis();
      const d = V3.sub(b, a);
      const len = V3.len(d) || 1e-4;
      const dir = V3.mul(d, 1 / len);
      let side = V3.cross(dir, B.view);
      if (V3.len(side) < 1e-4) side = B.right;
      side = V3.norm(side);
      const o = V3.sub(a, V3.mul(side, width / 2));
      const nrm = V3.cross(side, dir);
      return new Float32Array([side[0] * width, side[1] * width, side[2] * width, 0, d[0], d[1], d[2], 0, nrm[0], nrm[1], nrm[2], 0, o[0], o[1], o[2], 1]);
    }

    function project(p, W, H) {
      const vp = state.vp;
      const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
      const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
      const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
      if (w <= 0.01) return null;
      return [(x / w * 0.5 + 0.5) * (W || 960), (1 - (y / w * 0.5 + 0.5)) * (H || 540)];
    }

    return {
      begin, resume, draw, dyn, indexed, blurBack, glow, billboard, streak, project, basis,
      get vp() { return state.vp; },
      get cam() { return state.cam; },
      get polys() { return state.polys; },
      gl, r, cw, ch
    };
  }

  window.MeetFx = { create, DEFAULT_ENV };
})();
