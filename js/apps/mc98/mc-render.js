(function (M) {
  'use strict';
  const B = M.BLOCKS, I = M.ITEMS;
  const VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute float aSky; attribute float aBlk; attribute float aShade;
uniform mat4 uMVP; uniform float uDay; uniform vec3 uCam; uniform float uFogNear; uniform float uFogFar;
varying vec2 vUV; varying vec3 vLight; varying float vFog;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  vUV = aUV;
  float s = aSky / 15.0 * (0.2 + 0.8 * uDay);
  float b = aBlk / 15.0;
  vec3 sky = vec3(s) * mix(vec3(0.75, 0.8, 1.0), vec3(1.0), uDay);
  vec3 blk = vec3(b) * vec3(1.0, 0.9, 0.7);
  vec3 l = max(sky, blk);
  l = 0.05 + l * l * 0.95;
  vLight = l * aShade;
  float d = distance(aPos, uCam);
  vFog = clamp((d - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
}`;
  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogColor; uniform vec3 uTint; uniform float uAlpha; uniform float uDither; uniform float uCutoff;
varying vec2 vUV; varying vec3 vLight; varying float vFog;
void main() {
  vec4 c = texture2D(uTex, vUV);
  if (c.a < uCutoff) discard;
  vec3 col = c.rgb * vLight * uTint;
  col = mix(col, uFogColor, vFog);
  if (uDither > 0.5) {
    vec2 p = floor(mod(gl_FragCoord.xy, 2.0));
    float bay = (p.x * 2.0 + p.y + (p.x * p.y) * 0.5) / 4.0 - 0.375;
    col = floor((col + bay / 24.0) * 31.0 + 0.5) / 31.0;
  }
  gl_FragColor = vec4(col, c.a * uAlpha);
}`;
  const FLAT_VS = 'attribute vec3 aPos; uniform mat4 uMVP; void main(){ gl_Position = uMVP * vec4(aPos, 1.0); }';
  const FLAT_FS = 'precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }';

  class Renderer {
    constructor(canvas, atlas) {
      this.canvas = canvas; this.atlas = atlas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      this.prog = this.program(VS, FS);
      this.flat = this.program(FLAT_VS, FLAT_FS);
      this.a = {}; for (const n of ['aPos', 'aUV', 'aSky', 'aBlk', 'aShade']) this.a[n] = gl.getAttribLocation(this.prog, n);
      this.u = {}; for (const n of ['uMVP', 'uDay', 'uCam', 'uFogNear', 'uFogFar', 'uTex', 'uFogColor', 'uTint', 'uAlpha', 'uDither', 'uCutoff']) this.u[n] = gl.getUniformLocation(this.prog, n);
      this.fu = { uMVP: gl.getUniformLocation(this.flat, 'uMVP'), uColor: gl.getUniformLocation(this.flat, 'uColor') };
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.size, atlas.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.opaqueB = new M.MeshBuilder(atlas); this.waterB = new M.MeshBuilder(atlas); this.entB = new M.MeshBuilder(atlas); this.hurtB = new M.MeshBuilder(atlas); this.miscB = new M.MeshBuilder(atlas);
      this.dyn = gl.createBuffer(); this.dyn2 = gl.createBuffer(); this.dyn3 = gl.createBuffer(); this.lineBuf = gl.createBuffer();
      this.dither = true; this.fov = 70; this.width = 320; this.height = 240; this.stats = { chunks: 0, verts: 0, built: 0 };
      this.cloudMesh = null; this.viewBob = true;
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
    }
    program(vs, fs) {
      const gl = this.gl, p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    resize(w, h) { this.width = w; this.height = h; this.canvas.width = w; this.canvas.height = h; this.gl.viewport(0, 0, w, h); }
    bindAttribs() {
      const gl = this.gl, S = M.STRIDE * 4;
      gl.enableVertexAttribArray(this.a.aPos); gl.vertexAttribPointer(this.a.aPos, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(this.a.aUV); gl.vertexAttribPointer(this.a.aUV, 2, gl.FLOAT, false, S, 12);
      gl.enableVertexAttribArray(this.a.aSky); gl.vertexAttribPointer(this.a.aSky, 1, gl.FLOAT, false, S, 20);
      gl.enableVertexAttribArray(this.a.aBlk); gl.vertexAttribPointer(this.a.aBlk, 1, gl.FLOAT, false, S, 24);
      gl.enableVertexAttribArray(this.a.aShade); gl.vertexAttribPointer(this.a.aShade, 1, gl.FLOAT, false, S, 28);
    }
    drawDynamic(buf, data, mode) {
      if (!data.length) return;
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      this.bindAttribs();
      gl.drawArrays(mode || gl.TRIANGLES, 0, data.length / M.STRIDE);
    }
    freeChunk(c) { if (!c.mesh) return; const gl = this.gl; if (c.mesh.vo) gl.deleteBuffer(c.mesh.vo); if (c.mesh.vw) gl.deleteBuffer(c.mesh.vw); c.mesh = null; }
    buildChunk(world, c) {
      const gl = this.gl;
      const m = M.buildChunkMesh(world, c, this.opaqueB, this.waterB);
      if (!c.mesh) c.mesh = { vo: gl.createBuffer(), vw: gl.createBuffer(), no: 0, nw: 0 };
      gl.bindBuffer(gl.ARRAY_BUFFER, c.mesh.vo); gl.bufferData(gl.ARRAY_BUFFER, m.opaque, gl.STATIC_DRAW); c.mesh.no = m.opaque.length / M.STRIDE;
      gl.bindBuffer(gl.ARRAY_BUFFER, c.mesh.vw); gl.bufferData(gl.ARRAY_BUFFER, m.water, gl.STATIC_DRAW); c.mesh.nw = m.water.length / M.STRIDE;
      c.dirty = false; world.dirtyCount = Math.max(0, world.dirtyCount - 1);
      this.stats.built++;
    }
    neighborsReady(world, c) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = world.chunks.get(M.ckey(c.cx + dx, c.cz + dz)); if (!n || n.stage < 2) return false; }
      return true;
    }
    skyColor(game, p, underwater, inLava) {
      const d = game.dayFactor(), t = game.time % M.DAY;
      const day = [0.53, 0.7, 1.0], night = [0.01, 0.01, 0.04], dusk = [0.9, 0.45, 0.2];
      let c = M.mix(night, day, d);
      const sunset = (t > 11500 && t < 14000) ? 1 - Math.abs(t - 12750) / 1250 : (t > 22000 && t < 24000) ? 1 - Math.abs(t - 23000) / 1000 : 0;
      if (sunset > 0) c = M.mix(c, dusk, sunset * 0.5);
      if (underwater) c = M.mix([0.02, 0.1, 0.4], [0.1, 0.3, 0.7], d);
      if (inLava) c = [0.6, 0.15, 0.0];
      const under = p.y < 24 ? M.smoothstep(24, 8, p.y) : 0;
      if (under > 0 && !underwater) c = M.mix(c, [0.02, 0.02, 0.03], under * 0.85);
      return c;
    }
    render(game, opts = {}) {
      const gl = this.gl, p = game.player, world = game.world;
      const dist = game.renderDistance, far = dist * 16;
      const t0 = performance.now();
      let built = 0;
      for (const c of world.readyChunks(Math.floor(p.x), Math.floor(p.z), dist)) {
        if (!c.dirty || !this.neighborsReady(world, c)) continue;
        const d = Math.hypot(c.cx * 16 + 8 - p.x, c.cz * 16 + 8 - p.z);
        if (c.mesh && d > 24 && performance.now() - t0 > 4) continue;
        this.buildChunk(world, c); built++;
        if (performance.now() - t0 > 7) break;
      }
      const headBlock = world.liquidAt(p.x, p.y + p.eye, p.z);
      const underwater = headBlock === 8, inLava = headBlock === 9;
      const sky = this.skyColor(game, p, underwater, inLava);
      gl.clearColor(sky[0], sky[1], sky[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const aspect = this.width / this.height;
      const bob = this.viewBob && p.onGround && !p.flying ? Math.sin(game.tickCount * 0.6 + (opts.alpha || 0) * 0.6) * Math.min(1, Math.hypot(p.vx, p.vz) / 4) * 0.05 : 0;
      const eye = game.eyePos();
      const cam = [eye[0], eye[1] + bob, eye[2]];
      const proj = M.Mat4.perspective(this.fov * Math.PI / 180 * (underwater ? 0.9 : 1), aspect, 0.05, Math.max(far + 32, 400));
      const view = M.Mat4.view(cam[0], cam[1], cam[2], p.yaw, p.pitch);
      const vp = M.Mat4.multiply(proj, view);
      const day = game.dayFactor();
      gl.useProgram(this.prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(this.u.uTex, 0);
      gl.uniformMatrix4fv(this.u.uMVP, false, vp);
      gl.uniform1f(this.u.uDay, day);
      gl.uniform3f(this.u.uCam, cam[0], cam[1], cam[2]);
      gl.uniform3f(this.u.uFogColor, sky[0], sky[1], sky[2]);
      gl.uniform3f(this.u.uTint, 1, 1, 1); gl.uniform1f(this.u.uAlpha, 1); gl.uniform1f(this.u.uDither, this.dither ? 1 : 0); gl.uniform1f(this.u.uCutoff, 0.5);
      if (underwater) { gl.uniform1f(this.u.uFogNear, 1); gl.uniform1f(this.u.uFogFar, 14); }
      else if (inLava) { gl.uniform1f(this.u.uFogNear, 0); gl.uniform1f(this.u.uFogFar, 2.5); }
      else { gl.uniform1f(this.u.uFogNear, far * 0.55); gl.uniform1f(this.u.uFogFar, far - 4); }
      this.drawSky(game, cam, vp, day);
      const fwd = game.forward();
      const visible = [];
      for (const c of world.chunks.values()) {
        if (!c.mesh) continue;
        const cx = c.cx * 16 + 8 - cam[0], cz = c.cz * 16 + 8 - cam[2], d = Math.hypot(cx, cz);
        if (d > far + 12) continue;
        if (d > 22 && (cx * fwd[0] + cz * fwd[2]) / d < -0.35) continue;
        visible.push([d, c]);
      }
      visible.sort((a, b) => a[0] - b[0]);
      let verts = 0;
      for (const [, c] of visible) { if (!c.mesh.no) continue; gl.bindBuffer(gl.ARRAY_BUFFER, c.mesh.vo); this.bindAttribs(); gl.drawArrays(gl.TRIANGLES, 0, c.mesh.no); verts += c.mesh.no; }
      this.drawEntities(game, cam, opts.alpha || 0);
      this.drawClouds(game, cam, vp, day);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.uniform1f(this.u.uCutoff, 0.01);
      for (let i = visible.length - 1; i >= 0; i--) { const c = visible[i][1]; if (!c.mesh.nw) continue; gl.bindBuffer(gl.ARRAY_BUFFER, c.mesh.vw); this.bindAttribs(); gl.drawArrays(gl.TRIANGLES, 0, c.mesh.nw); verts += c.mesh.nw; }
      this.drawBreaking(game);
      gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
      this.drawSelection(game, vp);
      this.drawHand(game, aspect);
      this.stats.chunks = visible.length; this.stats.verts = verts; this.stats.built = built;
    }
    drawSky(game, cam, vp, day) {
      const gl = this.gl, t = game.time % M.DAY;
      const ang = ((t - 6000) / M.DAY) * M.TAU;
      const b = this.miscB; b.reset();
      const add = (a, tex, size, uvs) => {
        const cx = cam[0] + Math.cos(a) * 80, cy = cam[1] + Math.sin(a) * 80, cz = cam[2];
        const ux = -Math.sin(a) * size, uy = Math.cos(a) * size;
        const tt = b.uv(tex);
        b.quad([[cx - ux, cy - uy, cz - size], [cx + ux, cy + uy, cz - size], [cx + ux, cy + uy, cz + size], [cx - ux, cy - uy, cz + size]], [[tt[0], tt[3]], [tt[0], tt[1]], [tt[2], tt[1]], [tt[2], tt[3]]], 15, 15, 1);
      };
      add(ang, 'sun', 6); add(ang + Math.PI, 'moon', 4);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.uniform1f(this.u.uFogFar, 10000); gl.uniform1f(this.u.uFogNear, 9999);
      this.drawDynamic(this.dyn3, b.slice());
      if (day < 0.6) this.drawStars(game, cam, day);
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
      const far = game.renderDistance * 16;
      const head = game.world.liquidAt(cam[0], cam[1], cam[2]);
      if (head === 8) { gl.uniform1f(this.u.uFogNear, 1); gl.uniform1f(this.u.uFogFar, 14); } else if (head === 9) { gl.uniform1f(this.u.uFogNear, 0); gl.uniform1f(this.u.uFogFar, 2.5); } else { gl.uniform1f(this.u.uFogNear, far * 0.55); gl.uniform1f(this.u.uFogFar, far - 4); }
    }
    drawStars(game, cam, day) {
      if (!this.stars) {
        const rnd = M.makeRandom(42), arr = [];
        for (let i = 0; i < 220; i++) { const a = rnd() * M.TAU, e = Math.asin(rnd() * 2 - 1); arr.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), 0.25 + rnd() * 0.45]); }
        this.stars = arr;
      }
      const b = this.miscB; b.reset();
      const tw = b.uv('white'), tt = [(tw[0] + tw[2]) / 2, (tw[1] + tw[3]) / 2], br = Math.round(15 * (1 - day / 0.6));
      for (const s of this.stars) {
        const x = cam[0] + s[0] * 90, y = cam[1] + s[1] * 90, z = cam[2] + s[2] * 90, r = s[3];
        b.quad([[x - r, y - r, z], [x - r, y + r, z], [x + r, y + r, z], [x + r, y - r, z]], [[tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]]], br, 0, 1);
        b.quad([[x, y - r, z - r], [x, y + r, z - r], [x, y + r, z + r], [x, y - r, z + r]], [[tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]]], br, 0, 1);
      }
      this.drawDynamic(this.dyn3, b.slice());
    }
    drawClouds(game, cam, vp, day) {
      const gl = this.gl;
      if (!this.cloudMesh) {
        const b = new M.MeshBuilder(this.atlas), rnd = new M.Perlin(7), tc = b.uv('cloud'), tt = [(tc[0] + tc[2]) / 2, (tc[1] + tc[3]) / 2];
        for (let x = 0; x < 24; x++) for (let z = 0; z < 24; z++) {
          if (rnd.fbm2(x / 6, z / 6, 3) < 0.12) continue;
          const px = x * 12, pz = z * 12;
          b.quad([[px, 0, pz + 12], [px + 12, 0, pz + 12], [px + 12, 0, pz], [px, 0, pz]], [[tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]], [tt[0], tt[1]]], 15, 0, 1);
        }
        this.cloudMesh = b.slice();
      }
      if (cam[1] < 20) return;
      const off = (game.tickCount + (game.time % 1)) * 0.01;
      const ox = Math.floor((cam[0] + off) / 288) * 288 - off, oz = Math.floor(cam[2] / 288) * 288;
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.uniform1f(this.u.uCutoff, 0.01); gl.uniform1f(this.u.uAlpha, 0.8); gl.uniform1f(this.u.uDither, 0);
      gl.uniform1f(this.u.uFogNear, 60); gl.uniform1f(this.u.uFogFar, 260);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const mvp = M.Mat4.multiply(vp, M.Mat4.translate(ox + dx * 288, 72, oz + dz * 288));
        gl.uniformMatrix4fv(this.u.uMVP, false, mvp);
        this.drawDynamic(this.dyn3, this.cloudMesh);
      }
      gl.uniformMatrix4fv(this.u.uMVP, false, vp); gl.uniform1f(this.u.uAlpha, 1); gl.uniform1f(this.u.uCutoff, 0.5); gl.uniform1f(this.u.uDither, this.dither ? 1 : 0);
      const far = game.renderDistance * 16;
      gl.uniform1f(this.u.uFogNear, far * 0.55); gl.uniform1f(this.u.uFogFar, far - 4);
      gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
    }
    drawEntities(game, cam, alpha) {
      const gl = this.gl, w = game.world, b = this.entB, hb = this.hurtB;
      b.reset(); hb.reset();
      for (const e of game.entities) {
        const lx = Math.floor(e.x), ly = Math.floor(e.y + 0.5), lz = Math.floor(e.z);
        const sky = w.getSky(lx, ly, lz), blk = w.getBlockLight(lx, ly, lz);
        if (e instanceof M.Mob) this.mobModel(e.hurtT > 0 ? hb : b, e, sky, blk, alpha);
        else if (e instanceof M.ItemEntity) this.itemModel(b, e, sky, blk, cam);
        else if (e instanceof M.Arrow) { const mat = M.Mat4.multiply(M.Mat4.multiply(M.Mat4.translate(e.x, e.y, e.z), M.Mat4.rotY(e.yaw)), M.Mat4.multiply(M.Mat4.rotX(e.pitch), M.Mat4.scale(1 / 16, 1 / 16, 1 / 16))); b.transformedBox(-0.5, -0.5, -4, 0.5, 0.5, 4, { side: 'arrow', top: 'stick', bottom: 'stick' }, sky, blk, mat); }
        else if (e instanceof M.FallingBlock || e instanceof M.PrimedTnt) {
          const id = e.block || M.ITEM_BY_KEY.tnt.id, bd = B[id];
          const mat = M.Mat4.translate(e.x - 0.5, e.y, e.z - 0.5);
          const flash = e instanceof M.PrimedTnt && Math.floor(e.fuse * 8) % 2 === 0;
          (flash ? hb : b).transformedBox(0, 0, 0, 1, 1, 1, { side: M.faceTexture(bd, 'side'), top: M.faceTexture(bd, 'top'), bottom: M.faceTexture(bd, 'bottom') }, sky, blk, mat);
        }
      }
      gl.disable(gl.CULL_FACE);
      this.drawDynamic(this.dyn, b.slice());
      if (hb.n) { gl.uniform3f(this.u.uTint, 1.6, 0.6, 0.6); this.drawDynamic(this.dyn2, hb.slice()); gl.uniform3f(this.u.uTint, 1, 1, 1); }
      gl.enable(gl.CULL_FACE);
    }
    mobModel(b, e, sky, blk, alpha) {
      const def = e.def, model = def.model;
      const dying = e.hp <= 0 ? Math.min(1, e.deathT / 0.8) : 0;
      const base = M.Mat4.multiply(M.Mat4.translate(e.x, e.y, e.z), M.Mat4.multiply(M.Mat4.rotY(e.yaw), dying ? M.Mat4.multiply(M.Mat4.translate(0, 0, 0), M.Mat4.rotZ(dying * Math.PI / 2)) : M.Mat4.identity()));
      const swing = Math.sin(e.walk) * 0.7 * Math.min(1, Math.hypot(e.vx, e.vz) * 2);
      const scaleM = M.Mat4.scale(1 / 16, 1 / 16, 1 / 16);
      for (const part of model.parts) {
        let local = M.Mat4.identity();
        if (part.pivot && part.swing) {
          let ang = 0, axis = 'x';
          if (part.swing === 'legR' || part.swing === 'armL') ang = swing;
          else if (part.swing === 'legL' || part.swing === 'armR') ang = -swing;
          if ((part.swing === 'armL' || part.swing === 'armR') && def.zombieArms) ang = -Math.PI / 2 + swing * 0.2;
          if (part.swing === 'wingL' || part.swing === 'wingR') { ang = e.onGround ? 0 : Math.sin(e.age * 30) * 0.8 * (part.swing === 'wingL' ? 1 : -1); axis = 'z'; }
          const pv = M.Mat4.translate(part.pivot[0], part.pivot[1], part.pivot[2]), npv = M.Mat4.translate(-part.pivot[0], -part.pivot[1], -part.pivot[2]);
          local = M.Mat4.multiply(pv, M.Mat4.multiply(axis === 'x' ? M.Mat4.rotX(ang) : M.Mat4.rotZ(ang), npv));
        }
        if (part.swing === 'head' && def.explodes && e.fuse > 0) { const s = 1 + e.fuse * 0.3; local = M.Mat4.multiply(local, M.Mat4.multiply(M.Mat4.translate(0, part.box[1], 0), M.Mat4.multiply(M.Mat4.scale(s, s, s), M.Mat4.translate(0, -part.box[1], 0)))); }
        const mat = M.Mat4.multiply(base, M.Mat4.multiply(scaleM, local));
        const tex = part.tex.face ? { side: part.tex.side, top: part.tex.top, bottom: part.tex.bottom } : part.tex;
        if (part.tex.face) this.boxWithFace(b, part.box, part.tex, sky, blk, mat); else b.transformedBox(part.box[0], part.box[1], part.box[2], part.box[3], part.box[4], part.box[5], tex, sky, blk, mat);
      }
    }
    boxWithFace(b, box, tex, sky, blk, mat) {
      const faces = M.FACES;
      for (let fi = 0; fi < 6; fi++) {
        const f = faces[fi], tname = fi === 5 ? tex.face : (tex[f.name] || tex.side), t = b.uv(tname), tw = t[2] - t[0], th = t[3] - t[1];
        const pts = [], uvs = [];
        for (const c of f.c) {
          const px = c[0] ? box[3] : box[0], py = c[1] ? box[4] : box[1], pz = c[2] ? box[5] : box[2];
          pts.push([mat[0] * px + mat[4] * py + mat[8] * pz + mat[12], mat[1] * px + mat[5] * py + mat[9] * pz + mat[13], mat[2] * px + mat[6] * py + mat[10] * pz + mat[14]]);
          let u = c[0] ? 1 : 0, v = c[1] ? 0 : 1;
          if (fi < 2) u = c[2] ? 1 : 0; if (fi === 2 || fi === 3) v = c[2] ? 1 : 0;
          if (fi === 5) u = 1 - u;
          uvs.push([t[0] + u * tw, t[1] + v * th]);
        }
        b.quad(pts, uvs, sky, blk, f.shade);
      }
    }
    itemModel(b, e, sky, blk, cam) {
      const st = e.stack, it = I[st.id], bob = Math.sin(e.spin * 1.5) * 0.06 + 0.1;
      const isCube = st.id < 256 && (B[st.id].model === 'cube' || B[st.id].model === 'half' || B[st.id].model === 'cactus');
      if (isCube) {
        const bd = B[st.id], s = 0.25;
        const mat = M.Mat4.multiply(M.Mat4.translate(e.x, e.y + bob, e.z), M.Mat4.multiply(M.Mat4.rotY(e.spin), M.Mat4.translate(-s / 2, 0, -s / 2)));
        b.transformedBox(0, 0, 0, s, s * (bd.model === 'half' ? 0.5 : 1), s, { side: M.faceTexture(bd, 'side'), top: M.faceTexture(bd, 'top'), bottom: M.faceTexture(bd, 'bottom') }, sky, blk, mat);
        if (st.count > 1) b.transformedBox(0, 0, 0, s, s, s, { side: M.faceTexture(bd, 'side'), top: M.faceTexture(bd, 'top'), bottom: M.faceTexture(bd, 'bottom') }, sky, blk, M.Mat4.multiply(mat, M.Mat4.translate(0.08, 0.02, 0.08)));
      } else {
        const tex = st.id < 256 ? B[st.id].tex : it.tex, tname = typeof tex === 'string' ? tex : tex.side;
        const yaw = Math.atan2(-(e.x - cam[0]), -(e.z - cam[2])) + Math.PI, s = 0.2, t = b.uv(tname);
        const c = Math.cos(yaw), sn = Math.sin(yaw);
        const px = (dx) => e.x + c * dx, pz = (dx) => e.z - sn * dx, y0 = e.y + bob, y1 = y0 + s * 2;
        b.quad([[px(-s), y0, pz(-s)], [px(-s), y1, pz(-s)], [px(s), y1, pz(s)], [px(s), y0, pz(s)]], [[t[0], t[3]], [t[0], t[1]], [t[2], t[1]], [t[2], t[3]]], sky, blk, 1);
        b.quad([[px(s), y0, pz(s)], [px(s), y1, pz(s)], [px(-s), y1, pz(-s)], [px(-s), y0, pz(-s)]], [[t[2], t[3]], [t[2], t[1]], [t[0], t[1]], [t[0], t[3]]], sky, blk, 1);
      }
    }
    drawSelection(game, vp) {
      const t = game.target;
      if (!t || t.entity) return;
      const gl = this.gl, box = game.world.blockBox(t.x, t.y, t.z);
      if (!box) return;
      const e = 0.003, x0 = t.x + box[0] - e, y0 = t.y + box[1] - e, z0 = t.z + box[2] - e, x1 = t.x + box[3] + e, y1 = t.y + box[4] + e, z1 = t.z + box[5] + e;
      const pts = [x0, y0, z0, x1, y0, z0, x1, y0, z0, x1, y0, z1, x1, y0, z1, x0, y0, z1, x0, y0, z1, x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y1, z0, x1, y1, z1, x1, y1, z1, x0, y1, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0, x0, y1, z0, x1, y0, z0, x1, y1, z0, x1, y0, z1, x1, y1, z1, x0, y0, z1, x0, y1, z1];
      gl.useProgram(this.flat);
      gl.uniformMatrix4fv(this.fu.uMVP, false, vp); gl.uniform4f(this.fu.uColor, 0, 0, 0, 0.6);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(this.flat, 'aPos');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
      for (const n of ['aUV', 'aSky', 'aBlk', 'aShade']) gl.disableVertexAttribArray(this.a[n]);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.LINES, 0, 24);
      gl.disable(gl.BLEND);
      gl.useProgram(this.prog);
    }
    drawBreaking(game) {
      const br = game.breaking;
      if (!br || br.progress <= 0) return;
      const stage = Math.min(9, Math.floor(br.progress * 10)), b = this.miscB;
      b.reset();
      const box = game.world.blockBox(br.x, br.y, br.z) || [0, 0, 0, 1, 1, 1], e = 0.004;
      const w = game.world, lx = br.x, ly = br.y, lz = br.z;
      b.box(box[0] - e, box[1] - e, box[2] - e, box[3] + e, box[4] + e, box[5] + e, { side: 'crack' + stage, top: 'crack' + stage, bottom: 'crack' + stage }, Math.max(w.getSky(lx, ly + 1, lz), 6), w.getBlockLight(lx, ly + 1, lz), lx, ly, lz);
      this.drawDynamic(this.dyn3, b.slice());
    }
    drawHand(game, aspect) {
      const gl = this.gl, p = game.player, held = game.held(), b = this.miscB;
      if (p.dead) return;
      b.reset();
      const w = game.world, lx = Math.floor(p.x), ly = Math.floor(p.y + 1), lz = Math.floor(p.z);
      const sky = w.getSky(lx, ly, lz), blk = w.getBlockLight(lx, ly, lz);
      const sw = p.swing > 0 ? Math.sin((0.35 - p.swing) / 0.35 * Math.PI) : 0;
      const proj = M.Mat4.perspective(this.fov * Math.PI / 180, aspect, 0.05, 10);
      const base = M.Mat4.multiply(M.Mat4.translate(0.5 - sw * 0.25, -0.55 - sw * 0.4, -0.8 + sw * 0.05), M.Mat4.multiply(M.Mat4.rotY(-0.35 + sw * 0.4), M.Mat4.rotX(-0.1 - sw * 0.7)));
      if (held && held.id < 256 && B[held.id].model !== 'cross' && B[held.id].model !== 'torch' && B[held.id].model !== 'ladder') {
        const bd = B[held.id], s = 0.3;
        const mat = M.Mat4.multiply(base, M.Mat4.multiply(M.Mat4.rotY(0.2), M.Mat4.scale(s, s * (bd.model === 'half' ? 0.5 : 1), s)));
        b.transformedBox(0, 0, 0, 1, 1, 1, { side: M.faceTexture(bd, 'side'), top: M.faceTexture(bd, 'top'), bottom: M.faceTexture(bd, 'bottom') }, sky, blk, mat);
      } else if (held) {
        const tex = held.id < 256 ? B[held.id].tex : I[held.id].tex, tname = typeof tex === 'string' ? tex : tex.side, t = b.uv(tname);
        const mat = M.Mat4.multiply(base, M.Mat4.multiply(M.Mat4.translate(-0.05, -0.05, 0.05), M.Mat4.multiply(M.Mat4.rotY(0.25), M.Mat4.rotZ(0.5))));
        const q = (x, y, z) => [mat[0] * x + mat[4] * y + mat[8] * z + mat[12], mat[1] * x + mat[5] * y + mat[9] * z + mat[13], mat[2] * x + mat[6] * y + mat[10] * z + mat[14]];
        const s = 0.42;
        b.quad([q(0, 0, 0), q(0, s, 0), q(s, s, 0), q(s, 0, 0)], [[t[0], t[3]], [t[0], t[1]], [t[2], t[1]], [t[2], t[3]]], sky, blk, 1);
        b.quad([q(s, 0, 0), q(s, s, 0), q(0, s, 0), q(0, 0, 0)], [[t[2], t[3]], [t[2], t[1]], [t[0], t[1]], [t[0], t[3]]], sky, blk, 1);
      } else {
        const mat = M.Mat4.multiply(base, M.Mat4.multiply(M.Mat4.translate(0.05, -0.25, 0.1), M.Mat4.multiply(M.Mat4.rotX(0.9), M.Mat4.rotZ(-0.35))));
        b.transformedBox(0, 0, 0, 0.22, 0.7, 0.22, { side: 'player_arm', top: 'player_arm', bottom: 'player_arm' }, sky, blk, mat);
      }
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(this.u.uMVP, false, proj);
      gl.uniform3f(this.u.uCam, 0, 0, 0); gl.uniform1f(this.u.uFogNear, 50); gl.uniform1f(this.u.uFogFar, 100);
      gl.disable(gl.CULL_FACE);
      this.drawDynamic(this.dyn3, b.slice());
      gl.enable(gl.CULL_FACE);
    }
  }
  Object.assign(M, { Renderer });
})(globalThis.Mc98 = globalThis.Mc98 || {});
