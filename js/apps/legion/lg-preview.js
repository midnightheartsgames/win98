(function (L) {
  'use strict';

  const G = L.GL;
  const CYCLE = [['stand', 3.5], ['idle', 3], ['ready', 2.2], ['fight', 1.8], ['ready', 1.2], ['fight', 1.8], ['stand', 2]];

  class Preview {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
      if (!gl) throw new Error('WebGL2 недоступен');
      this.gl = gl;
      this.prog = G.program(gl, L.UNIT_SHADERS.vs, L.UNIT_SHADERS.fs);
      this.decal = G.program(gl, L.UNIT_SHADERS.decalVs, L.UNIT_SHADERS.decalFs);
      this.models = new Map();
      this.yaw = 0.5;
      this.spin = 0.25;
      this.t = 0;
      this.key = null;
      this.color = 0;
      this.quad = G.buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5]));
      this.decalBuf = gl.createBuffer();
      this.decalVao = gl.createVertexArray();
      gl.bindVertexArray(this.decalVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      const lc = gl.getAttribLocation(this.decal.p, 'aCorner');
      gl.enableVertexAttribArray(lc);
      gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 8, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.decalBuf);
      const lp = gl.getAttribLocation(this.decal.p, 'iPos'), ls = gl.getAttribLocation(this.decal.p, 'iSize');
      gl.enableVertexAttribArray(lp);
      gl.vertexAttribPointer(lp, 4, gl.FLOAT, false, 24, 0);
      gl.vertexAttribDivisor(lp, 1);
      gl.enableVertexAttribArray(ls);
      gl.vertexAttribPointer(ls, 2, gl.FLOAT, false, 24, 16);
      gl.vertexAttribDivisor(ls, 1);
      gl.bindVertexArray(null);
      this.bind();
    }

    bind() {
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => {
        this.drag = { x: e.clientX, yaw: this.yaw };
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = 'grabbing';
      });
      cv.addEventListener('pointermove', e => {
        if (!this.drag) return;
        this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * 0.012;
      });
      cv.addEventListener('pointerup', () => { this.drag = null; cv.style.cursor = ''; });
    }

    async setUnit(key, color) {
      this.key = key;
      this.color = color;
      this.t = 0;
      const want = key + ':' + color;
      this.want = want;
      let m = this.models.get(key);
      if (!m || !m.tex.has(color)) this.ready = null;
      if (!m) {
        const model = await L.loadModel(key);
        m = this.upload(model);
        this.models.set(key, m);
      }
      if (!m.tex.has(color)) {
        const img = await L.unitTexture(key, color);
        m.tex.set(color, G.textureArray(this.gl, [img], 512));
      }
      if (this.want === want) this.ready = m;
    }

    upload(model) {
      const gl = this.gl;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      const posTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, posTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16I, model.V, model.F, 0, gl.RGB_INTEGER, gl.SHORT, model.pos);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      const norTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, norTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8_SNORM, model.V, model.F, 0, gl.RGB, gl.BYTE, model.nrm);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const p = this.prog.p;
      G.buffer(gl, model.uv);
      const lu = gl.getAttribLocation(p, 'aUV');
      gl.enableVertexAttribArray(lu);
      gl.vertexAttribPointer(lu, 2, gl.SHORT, false, 0, 0);
      const inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      ['iPos', 'iAnim', 'iExtra'].forEach((n, i) => {
        const loc = gl.getAttribLocation(p, n);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 48, i * 16);
        gl.vertexAttribDivisor(loc, 1);
      });
      G.buffer(gl, model.idx, gl.ELEMENT_ARRAY_BUFFER);
      gl.bindVertexArray(null);
      const slots = {};
      for (const name in L.ANIM_SLOTS) slots[name] = L.ANIM_SLOTS[name].map(i => model.anims[i]).filter(a => a && a.count > 0);
      if (!slots.idle.length) slots.idle = slots.stand;
      if (!slots.ready.length) slots.ready = slots.stand;
      if (!slots.fight.length) slots.fight = slots.stand;
      return { model, posTex, norTex, vao, inst, slots, tex: new Map() };
    }

    frames(m, t) {
      let total = 0;
      for (const c of CYCLE) total += c[1];
      let k = t % total, name = 'stand', local = 0;
      for (const c of CYCLE) {
        if (k < c[1]) { name = c[0]; local = k; break; }
        k -= c[1];
      }
      const list = m.slots[name];
      const a = list[Math.floor(t / total) % list.length] || m.slots.stand[0];
      const fps = name === 'fight' ? 20 : 13;
      let f = local * fps;
      f = name === 'fight' ? Math.min(f, a.count - 1.001) : f % a.count;
      const i = Math.floor(f);
      return [a.start + i, a.start + (name === 'fight' ? Math.min(i + 1, a.count - 1) : (i + 1) % a.count), f - i];
    }

    render(dt) {
      const gl = this.gl, cv = this.canvas;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr)), hgt = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; }
      this.t += dt;
      if (!this.drag) this.yaw += dt * this.spin;
      gl.viewport(0, 0, w, hgt);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const m = this.ready;
      if (!m) return;
      const def = L.UNITS[this.key];
      const cav = L.CLASSES[def.type].cav;
      const H = (m.model.top || 2000) * L.MODEL_SCALE;
      const dist = H * (cav ? 2.35 : 2.2);
      const ex = Math.sin(this.yaw) * dist, ez = Math.cos(this.yaw) * dist, ey = H * 0.62;
      const proj = G.perspective(0.62, w / hgt, 0.05, 100);
      const view = G.lookAt(ex, ey, ez, 0, H * 0.48, 0, 0, 1, 0);
      const vp = G.mul(proj, view);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.decal.p);
      gl.uniformMatrix4fv(this.decal.u.uVP, false, vp);
      gl.uniform1f(this.decal.u.uAlpha, 0.55);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.decalBuf);
      const sz = cav ? H * 1.2 : H * 0.7;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0.01, 0, 0, sz, sz * (cav ? 1.6 : 1)]), gl.DYNAMIC_DRAW);
      gl.bindVertexArray(this.decalVao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1);
      gl.disable(gl.BLEND);
      const [fa, fb, bl] = this.frames(m, this.t);
      const inst = new Float32Array([0, 0, 0, 0, fa, fb, bl, 0, 0, 0, 1, 0]);
      const p = this.prog;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, vp);
      gl.uniform1f(p.u.uScale, L.MODEL_SCALE);
      gl.uniform1f(p.u.uYaw, 0);
      gl.uniform3fv(p.u.uSun, [0.35, 0.8, 0.55]);
      gl.uniform3fv(p.u.uSunCol, [0.75, 0.7, 0.62]);
      gl.uniform3fv(p.u.uAmb, [0.5, 0.5, 0.55]);
      gl.uniform3fv(p.u.uFogCol, [0, 0, 0]);
      gl.uniform1f(p.u.uFogDen, 0);
      gl.uniform3fv(p.u.uCam, [ex, ey, ez]);
      gl.uniform4fv(p.u.uLamp0, [0, 0, 0, 0]);
      gl.uniform4fv(p.u.uLamp1, [0, 0, 0, 0]);
      gl.uniform3fv(p.u.uLampCol, [0, 0, 0]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, m.posTex);
      gl.uniform1i(p.u.uPosTex, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, m.norTex);
      gl.uniform1i(p.u.uNorTex, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, m.tex.get(this.color));
      gl.uniform1i(p.u.uTex, 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.inst);
      gl.bufferData(gl.ARRAY_BUFFER, inst, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(m.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, m.model.T * 3, gl.UNSIGNED_SHORT, 0, 1);
      gl.bindVertexArray(null);
    }

    destroy() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  L.Preview = Preview;
})(globalThis.Legion = globalThis.Legion || {});
