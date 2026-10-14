(function (T) {
  'use strict';
  const { vsub, vcross, vnorm, vdot, STRIDE } = T;

  const VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aCol; attribute vec2 aUV;',
    'uniform mat4 uVP;',
    'varying vec3 vNor; varying vec4 vCol; varying vec2 vUV; varying vec3 vPos;',
    'void main(){ vNor=aNor; vCol=aCol; vUV=aUV; vPos=aPos; gl_Position=uVP*vec4(aPos,1.0); }'
  ].join('\n');

  const FS = [
    'precision mediump float;',
    'uniform sampler2D uTex; uniform vec3 uLight; uniform vec3 uLightCol; uniform vec3 uSky; uniform vec3 uGnd;',
    'uniform vec3 uFog; uniform vec2 uFogR; uniform vec3 uCam; uniform float uUnlit; uniform float uNoFog; uniform vec3 uRim; uniform vec3 uTint; uniform float uFlash;',
    'varying vec3 vNor; varying vec4 vCol; varying vec2 vUV; varying vec3 vPos;',
    'void main(){',
    '  vec4 base=vCol*texture2D(uTex,vUV);',
    '  vec3 n=normalize(vNor+vec3(0.0,0.0001,0.0));',
    '  float d=max(dot(n,uLight),0.0);',
    '  vec3 amb=mix(uGnd,uSky,n.y*0.5+0.5);',
    '  vec3 vd=normalize(uCam-vPos);',
    '  float rim=pow(1.0-max(dot(n,vd),0.0),3.0);',
    '  vec3 lit=base.rgb*(amb+uLightCol*d)+uRim*rim;',
    '  vec3 c=mix(lit,base.rgb,uUnlit)*uTint;',
    '  c=mix(c,vec3(1.0),uFlash);',
    '  float f=clamp((length(vPos-uCam)-uFogR.x)/(uFogR.y-uFogR.x),0.0,1.0)*(1.0-uNoFog);',
    '  gl_FragColor=vec4(mix(c,uFog,f),base.a);',
    '}'
  ].join('\n');

  const m4 = {
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
    },
    look(eye, at, up) {
      const z = vnorm(vsub(eye, at));
      const x = vnorm(vcross(up, z));
      const y = vcross(z, x);
      return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -vdot(x, eye), -vdot(y, eye), -vdot(z, eye), 1];
    },
    mul(a, b) {
      const o = new Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
      return o;
    },
    project(m, p) {
      const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      return [x / w, y / w, w];
    }
  };

  class GL {
    constructor(canvas) {
      this.canvas = canvas;
      const opts = { antialias: true, alpha: false, depth: true, premultipliedAlpha: false, preserveDrawingBuffer: false };
      const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      this.gl = gl;
      if (!gl) return;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      this.prog = p;
      gl.useProgram(p);
      this.a = { pos: gl.getAttribLocation(p, 'aPos'), nor: gl.getAttribLocation(p, 'aNor'), col: gl.getAttribLocation(p, 'aCol'), uv: gl.getAttribLocation(p, 'aUV') };
      this.u = {};
      for (const n of ['uVP', 'uTex', 'uLight', 'uLightCol', 'uSky', 'uGnd', 'uFog', 'uFogR', 'uCam', 'uUnlit', 'uNoFog', 'uRim', 'uTint', 'uFlash']) this.u[n] = gl.getUniformLocation(p, n);
      this.dyn = gl.createBuffer();
      this.white = this.texture(null);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.uniform1i(this.u.uTex, 0);
      this.setTint([1, 1, 1]);
      gl.uniform1f(this.u.uFlash, 0);
    }

    ok() { return !!this.gl; }

    resize(w, h) {
      this.canvas.width = w; this.canvas.height = h;
      this.W = w; this.H = h;
      if (this.gl) this.gl.viewport(0, 0, w, h);
    }

    texture(canvas, clampUV, nearest) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (!canvas) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return t;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      const pow2 = (canvas.width & (canvas.width - 1)) === 0 && (canvas.height & (canvas.height - 1)) === 0;
      const wrap = clampUV || !pow2 ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clampUV === 'x' ? gl.REPEAT : wrap);
      if (pow2 && !nearest) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      const ext = gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext && pow2) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      return t;
    }

    freeTexture(t) { if (t && this.gl) this.gl.deleteTexture(t); }

    staticMesh(mb) {
      const gl = this.gl;
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, mb.data.subarray(0, mb.n * STRIDE), gl.STATIC_DRAW);
      return { buf: b, n: mb.n };
    }

    freeMesh(m) { if (m && m.buf && this.gl) this.gl.deleteBuffer(m.buf); }

    setEnv(env) {
      const gl = this.gl, u = this.u;
      gl.uniform3fv(u.uLight, env.light);
      gl.uniform3fv(u.uLightCol, env.lightCol);
      gl.uniform3fv(u.uSky, env.sky);
      gl.uniform3fv(u.uGnd, env.gnd);
      gl.uniform3fv(u.uFog, env.fog);
      gl.uniform2fv(u.uFogR, env.fogR);
      gl.uniform3fv(u.uRim, env.rim || [0.1, 0.1, 0.12]);
    }

    setTint(c) { this.gl.uniform3fv(this.u.uTint, c); }
    setFlash(v) { this.gl.uniform1f(this.u.uFlash, v); }

    camera(eye, at, fovy, near, far) {
      const aspect = this.W / Math.max(1, this.H);
      this.view = m4.look(eye, at, [0, 1, 0]);
      this.proj = m4.persp(fovy, aspect, near || 0.1, far || 400);
      this.vp = m4.mul(this.proj, this.view);
      this.eye = eye;
      const gl = this.gl;
      gl.uniformMatrix4fv(this.u.uVP, false, new Float32Array(this.vp));
      gl.uniform3fv(this.u.uCam, eye);
      this.camRight = [this.view[0], this.view[4], this.view[8]];
      this.camUp = [this.view[1], this.view[5], this.view[9]];
    }

    clear(c) {
      const gl = this.gl;
      gl.clearColor(c[0], c[1], c[2], 1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    bindAttrs() {
      const gl = this.gl, a = this.a, S = STRIDE * 4;
      gl.enableVertexAttribArray(a.pos); gl.vertexAttribPointer(a.pos, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(a.nor); gl.vertexAttribPointer(a.nor, 3, gl.FLOAT, false, S, 12);
      gl.enableVertexAttribArray(a.col); gl.vertexAttribPointer(a.col, 4, gl.FLOAT, false, S, 24);
      gl.enableVertexAttribArray(a.uv); gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, S, 40);
    }

    state(o) {
      const gl = this.gl;
      gl.uniform1f(this.u.uUnlit, o.unlit ? 1 : 0);
      gl.uniform1f(this.u.uNoFog, o.nofog ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, o.tex || this.white);
      if (o.blend === 'add') { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); }
      else if (o.blend) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
      else gl.disable(gl.BLEND);
      gl.depthMask(o.depthWrite !== false);
      if (o.depthTest === false) gl.disable(gl.DEPTH_TEST); else gl.enable(gl.DEPTH_TEST);
      if (o.cull === false) gl.disable(gl.CULL_FACE); else { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); }
    }

    drawStatic(m, o) {
      if (!m || !m.n) return;
      const gl = this.gl;
      this.state(o || {});
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
      this.bindAttrs();
      gl.drawArrays(gl.TRIANGLES, 0, m.n);
    }

    drawDyn(mb, o) {
      if (!mb.n) return;
      const gl = this.gl;
      this.state(o || {});
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dyn);
      gl.bufferData(gl.ARRAY_BUFFER, mb.data.subarray(0, mb.n * STRIDE), gl.DYNAMIC_DRAW);
      this.bindAttrs();
      gl.drawArrays(gl.TRIANGLES, 0, mb.n);
    }

    toScreen(p) {
      const q = m4.project(this.vp, p);
      return [(q[0] * 0.5 + 0.5) * this.W, (0.5 - q[1] * 0.5) * this.H, q[2]];
    }

    destroy() {
      const ext = this.gl && this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this.gl = null;
    }
  }

  Object.assign(T, { GL, m4 });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
