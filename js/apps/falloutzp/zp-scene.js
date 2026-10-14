(function (Z) {
  'use strict';

  const CH = 64;
  const TCH = 128;

  Z.Renderer.prototype.initScenePrograms = function () {
    if (this.prog.world) return;
    const G = Z.GLSL, gl = this.gl;
    this.prog.world = new Z.Program(gl, G.WORLD_VS, G.WORLD_FS, 'world');
    this.prog.tree = new Z.Program(gl, G.TREE_VS, G.WORLD_FS, 'tree');
    this.prog.dWorld = new Z.Program(gl, G.WORLD_VS, G.DEPTH_FS, 'dworld');
    this.prog.dTree = new Z.Program(gl, G.TREE_VS, G.DEPTH_LEAF_FS, 'dtree');
    this.prog.dTerrain = new Z.Program(gl, G.TERRAIN_VS, G.DEPTH_FS, 'dterrain');
    this.prog.skin = new Z.Program(gl, G.SKIN_VS, G.WORLD_FS, 'skin');
    this.prog.dSkin = new Z.Program(gl, G.SKIN_VS, G.DEPTH_FS, 'dskin');
    this.ident = Z.M4.ident();
  };

  Z.Renderer.prototype.meshVAO = function (packed, inst) {
    const gl = this.gl, S = Z.MeshBuilder.STRIDE;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, packed.buf, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.BYTE, true, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 16);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, S, 24);
    gl.enableVertexAttribArray(4); gl.vertexAttribIPointer(4, 4, gl.UNSIGNED_BYTE, S, 28);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, packed.idx, gl.STATIC_DRAW);
    if (inst) {
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(5, 1);
      gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(6, 1);
    }
    gl.bindVertexArray(null);
    return { vao, vb, ib, count: packed.count, type: packed.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, box: packed.box };
  };

  Z.Renderer.prototype.bindWorldTextures = function (p) {
    const gl = this.gl, u = p.u;
    if (u.uMats) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.worldMats); gl.uniform1i(u.uMats, 0); }
    if (u.uFac) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.facTex); gl.uniform1i(u.uFac, 1); }
    if (u.uLeaf) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.leafTex); gl.uniform1i(u.uLeaf, 2); }
    if (u.uFace) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.faceTex); gl.uniform1i(u.uFace, 3); }
    if (u.uGlow) gl.uniform1ui(u.uGlow, Z.MAT.glow);
  };

  class Scene {
    constructor(r, map, town) {
      this.r = r;
      this.map = map;
      this.town = town;
      r.initScenePrograms();
      r.worldMats = r.texArray(Z.Tex.materials());
      r.facTex = r.texArray(Z.Tex.facades(512));
      r.leafTex = r.texArray(Z.Tex.foliage(256), { clamp: true });
      this.initFaces();
      this.chunks = new Map();
      this.buildStatic();
      this.buildTrees();
      this.initShadows();
      this.wind = 0.4;
      this.shadowsOn = true;
    }

    chunkFor(x, z) {
      const cx = Math.floor(x / CH), cz = Math.floor(z / CH), k = cx + ',' + cz;
      let c = this.chunks.get(k);
      if (!c) { c = { cx, cz, mb: new Z.MeshBuilder() }; this.chunks.set(k, c); }
      return c;
    }

    buildStatic() {
      const t0 = performance.now();
      for (const b of this.town.buildings) Z.Build.building(this.chunkFor(b.c[0], b.c[1]).mb, b);
      Z.Build.roads(this.map, (x, z, fn) => fn(this.chunkFor(x, z).mb));
      if (this.extraStatic) this.extraStatic(this);
      this.list = [];
      let verts = 0, tris = 0;
      for (const c of this.chunks.values()) {
        if (!c.mb.n) continue;
        const packed = c.mb.pack();
        verts += packed.verts; tris += packed.count / 3;
        c.m = this.r.meshVAO(packed);
        c.mb = null;
        this.list.push(c);
      }
      this.stats = { chunks: this.list.length, verts, tris: Math.round(tris), ms: Math.round(performance.now() - t0) };
    }

    buildTrees() {
      const r = this.r, gl = r.gl;
      const T = Z.Build.treeTemplates();
      const species = Z.TREE_SPECIES;
      const groups = new Map();
      for (const t of this.town.trees) {
        const cx = Math.floor(t.x / TCH), cz = Math.floor(t.z / TCH), k = cx + ',' + cz;
        let g = groups.get(k);
        if (!g) { g = { cx, cz, by: {} }; groups.set(k, g); }
        (g.by[t.sp] = g.by[t.sp] || []).push(t);
      }
      const inst = [];
      this.tchunks = [];
      for (const g of groups.values()) {
        const ranges = {};
        let ymin = Infinity, ymax = -Infinity;
        for (const sp of species) {
          const arr = g.by[sp];
          if (!arr) continue;
          ranges[sp] = [inst.length / 8, arr.length];
          for (const t of arr) {
            inst.push(t.x, t.y, t.z, t.yaw, t.s, t.tint / 255, (t.x * 0.13 + t.z * 0.07) % 1, 0);
            ymin = Math.min(ymin, t.y); ymax = Math.max(ymax, t.y + 22 * t.s);
          }
        }
        this.tchunks.push({ cx: g.cx, cz: g.cz, ranges, y0: ymin - 1, y1: ymax });
      }
      this.instBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW);
      this.tmesh = {};
      for (const sp of species) if (T[sp]) this.tmesh[sp] = r.meshVAO(T[sp].pack(), this.instBuf);
      const leafFor = { oak: 'oak', maple: 'oak', chestnut: 'oak', acacia: 'acacia', apricot: 'acacia', poplar: 'poplar', willow: 'willow', pine: 'pine', dead: 'dry' };
      this.far = {};
      for (const sp of species) {
        const m = new Z.MeshBuilder();
        const tall = sp === 'poplar' ? 17 : sp === 'pine' ? 14 : sp === 'apricot' ? 5 : 11;
        const wide = sp === 'poplar' ? 4 : sp === 'apricot' ? 5 : 8;
        m.setMat(Z.LEAF_BASE + Z.FOLIAGE[leafFor[sp]], 0, 0);
        for (const a of [0, Math.PI / 2]) {
          const c = Math.cos(a) * wide / 2, s = Math.sin(a) * wide / 2;
          m.quad([[-c, 0.5, -s], [-c, tall, -s], [c, tall, s], [c, 0.5, s]], [-s * 0.2, 0.9, c * 0.2], [[0, 1], [0, 0], [1, 0], [1, 1]]);
          m.quad([[c, 0.5, s], [c, tall, s], [-c, tall, -s], [-c, 0.5, -s]], [s * 0.2, 0.9, -c * 0.2], [[1, 1], [1, 0], [0, 0], [0, 1]]);
        }
        this.far[sp] = r.meshVAO(m.pack(), this.instBuf);
      }
      this.treeCount = this.town.trees.length;
    }

    initShadows() {
      const r = this.r, gl = r.gl, S = 2048;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, S, S);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, t, 0);
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.shadow = { tex: t, fb, size: S, extent: 110, vp: new Float32Array(16) };
    }

    shadowPass(r, focus) {
      const gl = r.gl, sh = this.shadow, e = r.env;
      if (!this.shadowsOn || e.sunDir[1] < 0.04) { r.shadowTex = r.dummyShadow; r.shadowP = [0, 0, 0, 0]; return; }
      const ext = sh.extent, texel = ext * 2 / sh.size;
      const sd = e.sunDir;
      const up = Math.abs(sd[1]) > 0.98 ? [1, 0, 0] : [0, 1, 0];
      const view = Z.M4.lookAt(0, 0, 0, -sd[0], -sd[1], -sd[2], up[0], up[1], up[2]);
      let c = Z.M4.transform(view, focus[0], focus[1], focus[2]);
      c[0] = Math.round(c[0] / texel) * texel; c[1] = Math.round(c[1] / texel) * texel;
      const proj = Z.M4.ortho(c[0] - ext, c[0] + ext, c[1] - ext, c[1] + ext, -c[2] - 400, -c[2] + 400);
      Z.M4.mul(proj, view, sh.vp);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sh.fb);
      gl.viewport(0, 0, sh.size, sh.size);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 3.0);
      gl.disable(gl.CULL_FACE);
      const saveVP = r.vp;
      r.vp = sh.vp;
      const fx = focus[0], fz = focus[2], R2 = ext * 1.5;
      const p = r.prog.dWorld.use();
      gl.uniformMatrix4fv(p.u.uVP, false, sh.vp);
      gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
      for (const c2 of this.list) {
        const b = c2.m.box;
        if (b[3] < fx - R2 || b[0] > fx + R2 || b[5] < fz - R2 || b[2] > fz + R2) continue;
        gl.bindVertexArray(c2.m.vao);
        gl.drawElements(gl.TRIANGLES, c2.m.count, c2.m.type, 0);
      }
      const pt = r.prog.dTree.use();
      gl.uniformMatrix4fv(pt.u.uVP, false, sh.vp);
      gl.uniform1f(pt.u.uTime, r.time);
      gl.uniform1f(pt.u.uWind, this.wind);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, r.leafTex); gl.uniform1i(pt.u.uLeaf, 2);
      for (const tc of this.tchunks) {
        const x0 = tc.cx * TCH, z0 = tc.cz * TCH;
        if (x0 + TCH < fx - R2 || x0 > fx + R2 || z0 + TCH < fz - R2 || z0 > fz + R2) continue;
        this.drawTreeChunk(gl, tc, this.tmesh);
      }
      if (this.extraShadow) this.extraShadow(r, sh.vp);
      gl.bindVertexArray(null);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.enable(gl.CULL_FACE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      r.vp = saveVP;
      r.shadowTex = sh.tex;
      r.shadowVP = sh.vp;
      r.shadowP = [1, 1 / sh.size, 0.08, 0.0006];
    }

    drawTreeChunk(gl, tc, meshes) {
      for (const sp in tc.ranges) {
        const m = meshes[sp];
        if (!m) continue;
        const [start, count] = tc.ranges[sp];
        gl.bindVertexArray(m.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, start * 32);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 32, start * 32 + 16);
        gl.drawElementsInstanced(gl.TRIANGLES, m.count, m.type, 0, count);
        this.r.stats.draws++;
      }
    }

    drawStatic(r) {
      const gl = r.gl, p = r.prog.world.use();
      r.setEnvUniforms(p);
      r.bindWorldTextures(p);
      gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
      gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
      const far = (r.cam.far || 3000) * 0.95, ex = r.eye[0], ez = r.eye[2];
      let n = 0;
      for (const c of this.list) {
        const b = c.m.box;
        const dx = Math.max(b[0] - ex, 0, ex - b[3]), dz = Math.max(b[2] - ez, 0, ez - b[5]);
        if (Math.hypot(dx, dz) > far) continue;
        if (!r.boxVisible(b[0], b[1], b[2], b[3], b[4], b[5])) continue;
        gl.bindVertexArray(c.m.vao);
        gl.drawElements(gl.TRIANGLES, c.m.count, c.m.type, 0);
        n++;
      }
      r.stats.draws += n;
      r.stats.chunks = n;
      gl.bindVertexArray(null);
    }

    drawTrees(r) {
      const gl = r.gl, p = r.prog.tree.use();
      r.setEnvUniforms(p);
      r.bindWorldTextures(p);
      gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
      gl.uniform1f(p.u.uWind, this.wind);
      gl.disable(gl.CULL_FACE);
      const ex = r.eye[0], ez = r.eye[2];
      const nearD = this.treeNear || 170, farD = this.treeFar || 1300;
      let n = 0;
      for (const tc of this.tchunks) {
        const x0 = tc.cx * TCH, z0 = tc.cz * TCH;
        const dx = Math.max(x0 - ex, 0, ex - (x0 + TCH)), dz = Math.max(z0 - ez, 0, ez - (z0 + TCH));
        const d = Math.hypot(dx, dz);
        if (d > farD) continue;
        if (!r.boxVisible(x0, tc.y0, z0, x0 + TCH, tc.y1, z0 + TCH)) continue;
        this.drawTreeChunk(gl, tc, d < nearD ? this.tmesh : this.far);
        n++;
      }
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(null);
      r.stats.treeChunks = n;
    }
  }

  Z.Scene = Scene;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
