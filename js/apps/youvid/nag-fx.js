(function () {
  const VS = `
attribute vec2 aPos;
uniform vec4 uRect;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4((uRect.xy + aPos * uRect.zw) * 2.0 - 1.0, 0.0, 1.0);
}`;

  const LUT_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uFrame;
uniform sampler2D uLut;
void main() {
  vec3 c = texture2D(uFrame, vUv).rgb;
  float l = clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
  gl_FragColor = vec4(texture2D(uLut, vec2(l * 0.99 + 0.005, 0.5)).rgb, 1.0);
}`;

  const EDGE_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMask;
uniform vec2 uPx;
uniform vec4 uRim;
uniform vec4 uInk;
uniform vec2 uWob;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float cover(float r) {
  float m = texture2D(uMask, vUv).r;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 0.3926991;
    vec2 d = vec2(cos(a), sin(a)) * uPx * r;
    m = max(m, texture2D(uMask, vUv + d).r);
    m = max(m, texture2D(uMask, vUv + d * 0.55).r);
  }
  return m;
}
void main() {
  float ink = uInk.a > 0.0 ? cover(uInk.a) : 0.0;
  if (ink > 0.5) {
    gl_FragColor = vec4(uInk.rgb, 1.0);
    return;
  }
  float w = 1.0 + uWob.x * (noise(gl_FragCoord.xy * 0.05 + uWob.y) - 0.5) * 2.0;
  float rim = uRim.a > 0.0 ? cover(uRim.a * w) : 0.0;
  if (rim > 0.5) gl_FragColor = vec4(uRim.rgb, 1.0);
  else discard;
}`;

  const TEX_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAlpha;
void main() {
  gl_FragColor = texture2D(uTex, vUv) * uAlpha;
}`;

  const BLUR_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uFrame;
uniform vec2 uDir;
void main() {
  vec3 s = texture2D(uFrame, vUv).rgb * 0.18;
  s += (texture2D(uFrame, vUv + uDir).rgb + texture2D(uFrame, vUv - uDir).rgb) * 0.16;
  s += (texture2D(uFrame, vUv + uDir * 2.0).rgb + texture2D(uFrame, vUv - uDir * 2.0).rgb) * 0.13;
  s += (texture2D(uFrame, vUv + uDir * 3.0).rgb + texture2D(uFrame, vUv - uDir * 3.0).rgb) * 0.08;
  s += (texture2D(uFrame, vUv + uDir * 4.0).rgb + texture2D(uFrame, vUv - uDir * 4.0).rgb) * 0.04;
  gl_FragColor = vec4(s, 1.0);
}`;

  const FILL_FS = `
precision mediump float;
uniform vec4 uColor;
void main() {
  gl_FragColor = uColor;
}`;

  function hexRgb(c) {
    if (Array.isArray(c)) return c;
    const n = parseInt(c.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function create(r) {
    const gl = r.gl;
    const cv = r.canvas;

    function compile(fs) {
      const p = r.program(VS, fs);
      const loc = { aPos: gl.getAttribLocation(p, 'aPos') };
      ['uRect', 'uFrame', 'uLut', 'uMask', 'uPx', 'uRim', 'uInk', 'uWob', 'uTex', 'uAlpha', 'uDir', 'uColor'].forEach(u => {
        loc[u] = gl.getUniformLocation(p, u);
      });
      return { p, loc };
    }

    const P = { lut: compile(LUT_FS), edge: compile(EDGE_FS), tex: compile(TEX_FS), blur: compile(BLUR_FS), fill: compile(FILL_FS) };
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    const frame = r.frameTexture(false);
    const masks = [];
    const luts = {};

    function texture2(filter) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    function use(prog, rect) {
      gl.useProgram(prog.p);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(prog.loc.aPos);
      gl.vertexAttribPointer(prog.loc.aPos, 2, gl.FLOAT, false, 8, 0);
      gl.uniform4fv(prog.loc.uRect, rect || [0, 0, 1, 1]);
    }

    function done(prog) {
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(prog.loc.aPos);
      gl.disable(gl.BLEND);
      gl.disable(gl.STENCIL_TEST);
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, r.white);
      gl.activeTexture(gl.TEXTURE0);
    }

    function grab(tex) {
      r.grab(tex, 0, 0, cv.width, cv.height);
    }

    function lutTexture(stops) {
      const key = JSON.stringify(stops);
      if (luts[key]) return luts[key];
      const pts = stops.map(([pos, col]) => [pos, hexRgb(col)]);
      const data = new Uint8Array(256 * 4);
      for (let i = 0; i < 256; i++) {
        const x = i / 255;
        let j = 0;
        while (j < pts.length - 2 && x > pts[j + 1][0]) j++;
        const a = pts[j], b = pts[Math.min(pts.length - 1, j + 1)];
        const span = b[0] - a[0];
        const k = span > 1e-6 ? Math.max(0, Math.min(1, (x - a[0]) / span)) : 1;
        for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round((a[1][c] + (b[1][c] - a[1][c]) * k) * 255);
        data[i * 4 + 3] = 255;
      }
      const t = texture2(gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      luts[key] = t;
      return t;
    }

    function stencilWrite(ref) {
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, ref, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    }

    function stencilOff() {
      gl.disable(gl.STENCIL_TEST);
    }

    function stencilTest(ref) {
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.EQUAL, ref, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }

    function applyLut(stops, ref) {
      grab(frame);
      const prog = P.lut;
      use(prog);
      if (ref !== undefined && ref !== null) stencilTest(ref);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, lutTexture(stops));
      gl.uniform1i(prog.loc.uLut, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, frame);
      gl.uniform1i(prog.loc.uFrame, 0);
      done(prog);
    }

    function grabMask(i) {
      if (!masks[i]) masks[i] = r.frameTexture(true);
      grab(masks[i]);
      return masks[i];
    }

    function edge(mask, rim, ink, wob, seed) {
      const prog = P.edge;
      use(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.uniform1i(prog.loc.uMask, 0);
      gl.uniform2f(prog.loc.uPx, 1 / cv.width, 1 / cv.height);
      const s = cv.width / 480;
      const rc = rim ? hexRgb(rim.color || '#ffffff') : [1, 1, 1];
      const ic = ink ? hexRgb(ink.color || '#000000') : [0, 0, 0];
      gl.uniform4f(prog.loc.uRim, rc[0], rc[1], rc[2], rim ? (rim.px || 3) * s : 0);
      gl.uniform4f(prog.loc.uInk, ic[0], ic[1], ic[2], ink ? (ink.px || 1) * s : 0);
      gl.uniform2f(prog.loc.uWob, wob === undefined ? 0.35 : wob, seed || 0);
      done(prog);
    }

    function overlayTexture() {
      return { tex: texture2(gl.LINEAR), stamp: null };
    }

    function upload(o, canvas, stamp) {
      if (o.stamp === stamp) return;
      o.stamp = stamp;
      gl.bindTexture(gl.TEXTURE_2D, o.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    }

    function drawTex(tex, alpha, rect) {
      const prog = P.tex;
      use(prog, rect);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(prog.loc.uTex, 0);
      gl.uniform1f(prog.loc.uAlpha, alpha === undefined ? 1 : alpha);
      done(prog);
    }

    function blur(px) {
      const prog = P.blur;
      [[px / cv.width, 0], [0, px / cv.height]].forEach(dir => {
        grab(frame);
        use(prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, frame);
        gl.uniform1i(prog.loc.uFrame, 0);
        gl.uniform2f(prog.loc.uDir, dir[0], dir[1]);
        done(prog);
      });
    }

    function fill(color, alpha, rect) {
      if (alpha <= 0.002) return;
      const prog = P.fill;
      use(prog, rect);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const c = hexRgb(color);
      gl.uniform4f(prog.loc.uColor, c[0], c[1], c[2], alpha);
      done(prog);
    }

    return { applyLut, grabMask, edge, stencilWrite, stencilOff, overlayTexture, upload, drawTex, blur, fill, lutTexture };
  }

  window.NagFx = { create, hexRgb };
})();
