'use strict';
// Рендерер: все GPU-ресурсы и отрисовка сцены с произвольной камеры.

class Renderer {
  constructor(gl, world) {
    this.gl = gl;
    this.w = world;           // { chunks, trees, sky, frames, birds, road }
    this.time = 0;
    this.golden = 0;
    this.pal = mixPalette(0);
    this.quality = { grassNear: 320, grassFar: 100 };
    this.hiddenFrames = true;
    const P = (vs, fs, name) => new Program(gl, GLSL_HEAD + COMMON + vs, GLSL_HEAD + COMMON + fs, name);
    this.prog = {
      sky: P(SH.skyVS, SH.skyFS, 'sky'),
      terrain: P(SH.terrainVS, SH.terrainFS, 'terrain'),
      grass: P(SH.grassVS, SH.grassFS, 'grass'),
      tree: P(SH.treeVS, SH.treeFS, 'tree'),
      trunk: P(SH.trunkVS, SH.trunkFS, 'trunk'),
      cloud: P(SH.cloudVS, SH.cloudFS, 'cloud'),
      shadow: P(SH.shadowVS, SH.shadowFS, 'shadow'),
      bird: P(SH.birdVS, SH.birdFS, 'bird'),
      frame: P(SH.frameVS, SH.frameFS, 'frame'),
      glow: P(SH.glowVS, SH.glowFS, 'glow'),
      mote: P(SH.moteVS, SH.moteFS, 'mote'),
    };
    this.emptyVAO = gl.createVertexArray();
    this.initTextures();
    this.initTerrain();
    this.initGrass();
    this.initTrees();
    this.initClouds();
    this.initBirds();
    this.initFrames();
    this.initMotes();
  }

  // ---------- текстуры ----------
  initTextures() {
    const gl = this.gl;
    this.noiseTex = makeTexture(gl, { w: 256, h: 256, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE,
      data: makeNoiseData(256), wrap: gl.REPEAT, mips: true });
    const N = WORLD.hmN;
    this.heightTex = makeTexture(gl, { w: N, h: N, internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: HM, filter: gl.NEAREST });
    this.groundTex = makeTexture(gl, { w: WORLD.gmSize, h: WORLD.gmSize, internal: gl.RGBA8, format: gl.RGBA,
      type: gl.UNSIGNED_BYTE, data: makeGroundMap(this.w.trees, this.w.road), mips: true });
    // Карта теней облаков: вид сверху на всю долину.
    this.shadowSize = 512;
    this.shadowTex = makeTexture(gl, { w: 512, h: 512, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE });
    this.shadowFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowMap = [0, 0, 4200, 370];
  }

  initTerrain() {
    const gl = this.gl;
    this.chunks = this.w.chunks.map((c) => {
      const vbo = makeBuffer(gl, c.data), ibo = makeBuffer(gl, c.idx, gl.ELEMENT_ARRAY_BUFFER);
      const vao = makeVAO(gl, [{ buf: vbo, loc: 0, size: 3, stride: 24 }, { buf: vbo, loc: 1, size: 3, stride: 24, offset: 12 }], ibo);
      return { vao, count: c.idx.length, center: c.center, radius: c.radius };
    });
  }

  initGrass() {
    const gl = this.gl, B = 320;
    const idx = new Uint16Array(B * 15);
    const tri = [0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6];
    for (let b = 0; b < B; b++) for (let k = 0; k < 15; k++) idx[b * 15 + k] = b * 7 + tri[k];
    this.grassIBO = makeBuffer(gl, idx, gl.ELEMENT_ARRAY_BUFFER);
    this.grassSets = ['near', 'far'].map(() => {
      const data = new Float32Array(2400 * 2);
      const buf = makeBuffer(gl, data, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      const vao = makeVAO(gl, [{ buf, loc: 0, size: 2, divisor: 1 }], this.grassIBO);
      return { data, buf, vao, n: 0 };
    });
  }

  initTrees() {
    const gl = this.gl, trees = this.w.trees;
    const ico = icosphere(2);
    const blobs = [];
    for (const t of trees) for (const b of t.blobs) blobs.push(b[0], b[1], b[2], b[3], t.x, t.cy, t.z, t.R);
    const meshBuf = makeBuffer(gl, ico.pos), ibo = makeBuffer(gl, ico.idx, gl.ELEMENT_ARRAY_BUFFER);
    const inst = makeBuffer(gl, new Float32Array(blobs));
    this.treeVAO = makeVAO(gl, [{ buf: meshBuf, loc: 0, size: 3 },
      { buf: inst, loc: 1, size: 4, stride: 32, divisor: 1 }, { buf: inst, loc: 2, size: 4, stride: 32, offset: 16, divisor: 1 }], ibo);
    this.treeCount = ico.idx.length;
    this.blobCount = blobs.length / 8;
    // Ствол: шестигранный цилиндр.
    const cyl = [], S = 6;
    for (let i = 0; i < S; i++) {
      const a0 = (i / S) * Math.PI * 2, a1 = ((i + 1) / S) * Math.PI * 2;
      const p = (a, y) => [Math.cos(a), y, Math.sin(a)];
      cyl.push(...p(a0, 0), ...p(a1, 0), ...p(a1, 1), ...p(a0, 0), ...p(a1, 1), ...p(a0, 1));
    }
    const trunks = trees.flatMap((t) => [t.x, t.y, t.z, t.trunk]);
    this.trunkVAO = makeVAO(gl, [{ buf: makeBuffer(gl, new Float32Array(cyl)), loc: 0, size: 3 },
      { buf: makeBuffer(gl, new Float32Array(trunks)), loc: 1, size: 4, divisor: 1 }]);
    this.trunkVerts = cyl.length / 3;
    this.trunkCount = trees.length;
  }

  initClouds() {
    const gl = this.gl;
    this.quadBuf = makeBuffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    this.puffs = [];
    for (const c of this.w.sky.clouds) for (const p of c.puffs) this.puffs.push({ c, p });
    const n = this.puffs.length;
    this.puffData = new Float32Array(n * 6);
    this.puffDist = new Float32Array(n);
    this.puffOrder = new Uint32Array(n);
    this.puffBuf = makeBuffer(gl, this.puffData, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.cloudVAO = makeVAO(gl, [{ buf: this.quadBuf, loc: 0, size: 2 },
      { buf: this.puffBuf, loc: 1, size: 4, stride: 24, divisor: 1 }, { buf: this.puffBuf, loc: 2, size: 2, stride: 24, offset: 16, divisor: 1 }]);
    this.quadVAO = makeVAO(gl, [{ buf: this.quadBuf, loc: 0, size: 2 }]);
  }

  initBirds() {
    const gl = this.gl;
    // Силуэт птицы: тело, хвост, два крыла (w — вес взмаха).
    const v = [
      0, 0, -0.55, 0, -0.1, 0, 0, 0, 0.1, 0, 0, 0,
      -0.1, 0, 0, 0, 0.1, 0, 0, 0, 0, 0, 0.35, 0,
      0, 0, 0.3, 0, -0.16, 0, 0.62, 0, 0.16, 0, 0.62, 0,
      -0.08, 0, -0.16, 0.2, -0.08, 0, 0.18, 0.2, -1, 0.24, 0.12, 1,
      0.08, 0, -0.16, 0.2, 0.08, 0, 0.18, 0.2, 1, 0.24, 0.12, 1,
      0, 0.07, -0.4, 0, 0, -0.09, 0.05, 0, 0, 0.05, 0.45, 0,   // киль: птицу видно и сбоку
    ];
    this.birdVerts = v.length / 4;
    const hawks = this.w.birds.hawks.length, flock = this.w.birds.flocks.reduce((s, f) => s + f.birds.length, 0);
    this.birdMax = hawks + flock;
    this.birdData = new Float32Array(this.birdMax * 8);
    this.birdBuf = makeBuffer(gl, this.birdData, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.birdVAO = makeVAO(gl, [{ buf: makeBuffer(gl, new Float32Array(v)), loc: 0, size: 4 },
      { buf: this.birdBuf, loc: 1, size: 4, stride: 32, divisor: 1 }, { buf: this.birdBuf, loc: 2, size: 4, stride: 32, offset: 16, divisor: 1 }]);
  }

  initFrames() {
    const gl = this.gl, d = [];
    const quad = (c, a0, a1, t0, t1) => {
      // a0/a1 — концы плеча, t0/t1 — смещение толщины
      const pts = [[a0, t0], [a1, t0], [a1, t1], [a0, t0], [a1, t1], [a0, t1]];
      for (const [a, t] of pts) d.push(c[0], c[1], a[0], a[1], t[0], t[1]);
    };
    const L = 0.3;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const c = [sx, sy];
      quad(c, [0, 0], [-sx * L, 0], [0, 0], [-sx, -sy].map((v, i) => (i === 1 ? v : 0)));
      quad(c, [0, 0], [0, -sy * L], [0, 0], [-sx, 0]);
    }
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) d.push(x, y, 0, 0, 0, 0);
    const buf = makeBuffer(gl, new Float32Array(d));
    this.frameVAO = makeVAO(gl, [{ buf, loc: 0, size: 2, stride: 24 }, { buf, loc: 1, size: 2, stride: 24, offset: 8 },
      { buf, loc: 2, size: 2, stride: 24, offset: 16 }]);
    this.frameVerts = d.length / 6 - 6;
  }

  initMotes() {
    const gl = this.gl, rnd = mulberry32(5);
    const mk = (n) => {
      const a = new Float32Array(n * 4);
      for (let i = 0; i < a.length; i++) a[i] = rnd();
      return { vao: makeVAO(gl, [{ buf: makeBuffer(gl, a), loc: 0, size: 4 }]), n };
    };
    this.motesAmbient = mk(700);
    this.motesThermal = mk(600);
  }

  // ---------- обновление мира ----------
  update(dt, golden) {
    this.time += dt;
    this.golden = golden;
    this.pal = mixPalette(golden);
    const t = this.time;
    for (const c of this.w.sky.clouds) {
      if (!c.drift) continue;
      let x = c.x0 + t * WORLD.cloudDrift;
      x = ((((x + 4200) % 8400) + 8400) % 8400) - 4200;
      c.x = x;
      c.fade = smoothstep(4200, 3500, Math.abs(x));
    }
    this.updateBirds(t);
  }

  updateBirds(t) {
    const d = this.birdData;
    let k = 0;
    const put = (x, y, z, yaw, bank, phase, scale, amp) => {
      d.set([x, y, z, yaw, bank, phase, scale, amp], k * 8);
      k++;
    };
    for (const h of this.w.birds.hawks) {
      const w = 10 / h.r, a = h.phase + t * w;
      const x = h.t.x + Math.cos(a) * h.r, z = h.t.z + Math.sin(a) * h.r;
      const g = groundHeight(h.t.x, h.t.z);
      const y = g + 40 + ((h.h0 + t * h.climb) % 300);
      const flapping = Math.sin(t * 0.37 + h.phase * 3) > 0.8;
      put(x, y, z, Math.atan2(Math.sin(a), -Math.cos(a)), -0.35, t * 7 + h.flap, 2.0, flapping ? 0.55 : 0.06);
    }
    for (const f of this.w.birds.flocks) {
      const s = t * f.speed + f.phase;
      const cx = f.cx + Math.cos(s) * 300, cz = f.cz + Math.sin(s * 1.3) * 220;
      const vx = -Math.sin(s) * 300, vz = Math.cos(s * 1.3) * 1.3 * 220;
      const yaw = Math.atan2(-vx, -vz);
      const cy = groundHeight(cx, cz) + f.alt + Math.sin(t * 0.2 + f.phase) * 10;
      for (const b of f.birds) {
        const wob = Math.sin(t * 1.3 + b.flap) * 1.2;
        put(cx + b.o[0] + wob, cy + b.o[1] + Math.cos(t * 1.7 + b.flap) * 0.6, cz + b.o[2], yaw, 0, t * 15 * b.w + b.flap, 0.36, 0.75);
      }
    }
    this.birdCount = k;
  }

  // Клубы облаков: позиции и сортировка от дальних к ближним для этой камеры.
  prepareClouds(cam) {
    const n = this.puffs.length, d = this.puffData, dist = this.puffDist, ord = this.puffOrder;
    const cp = cam.pos;
    for (let i = 0; i < n; i++) {
      const { c, p } = this.puffs[i];
      const x = c.x + p.dx, y = c.y + p.dy, z = c.z + p.dz;
      dist[i] = (x - cp[0]) ** 2 + (y - cp[1]) ** 2 + (z - cp[2]) ** 2;
      ord[i] = i;
    }
    ord.sort((a, b) => dist[b] - dist[a]);
    for (let j = 0; j < n; j++) {
      const { c, p } = this.puffs[ord[j]], o = j * 6;
      d[o] = c.x + p.dx; d[o + 1] = c.y + p.dy; d[o + 2] = c.z + p.dz; d[o + 3] = p.r; d[o + 4] = p.shade; d[o + 5] = c.fade;
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.puffBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, d);
  }

  // Плотность облака в точке: для белой пелены и глухого звука.
  cloudDensity(p) {
    let best = 0;
    for (const { c, p: q } of this.puffs) {
      const dx = p[0] - c.x - q.dx, dy = p[1] - c.y - q.dy, dz = p[2] - c.z - q.dz;
      const r = q.r * 0.95, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < r * r) best = Math.max(best, (1 - Math.sqrt(d2) / r) * c.fade);
    }
    return clamp(best * 2.2, 0, 1);
  }

  renderCloudShadows() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
    gl.viewport(0, 0, this.shadowSize, this.shadowSize);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.prog.shadow.use().set('uMap', this.shadowMap);
    gl.bindVertexArray(this.cloudVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.puffs.length);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  commonUniforms(cam) {
    const p = this.pal;
    return {
      uCamPos: cam.pos, uTime: this.time, uSunDir: p.sunDir, uSunCol: p.sunCol, uZenith: p.zenith, uHorizon: p.horizon, uSkyMid: p.skyMid,
      uHaze: p.haze, uAmbSky: p.ambSky, uAmbGround: p.ambGround, uCloudLit: p.cloudLit, uCloudShade: p.cloudShade,
      uExposure: p.exposure, uWind: [WORLD.wind[0], WORLD.wind[2]], uNoise: 0, uCloudShadow: 1,
      uCloudShadowMap: this.shadowMap, uViewProj: cam.viewProj,
      uVine: [WORLD.vineyard.c[0], WORLD.vineyard.c[1], WORLD.vineyard.halfLen, WORLD.vineyard.halfWid],
      uVineAxes: [WORLD.vineyard.u[0], WORLD.vineyard.u[1], WORLD.vineyard.v[0], WORLD.vineyard.v[1]],
      uGround: 2, uGroundHalf: WORLD.gmHalf, uGolden: this.golden, uHeight: 3, uHmHalf: WORLD.hmHalf, uHmStep: WORLD.hmStep,
      uCamR: cam.r, uCamU: cam.u, uCamF: cam.f, uTan: [cam.tanX, cam.tanY],
    };
  }

  // Выбор плиток травы вокруг камеры: ближние плотные, дальние редкие.
  prepareGrass(cam) {
    const T = 4, RN = 30, RF = 72, cp = cam.pos;
    const [near, far] = this.grassSets;
    near.n = far.n = 0;
    const agl = cp[1] - groundHeight(cp[0], cp[2]);
    this.camAGL = agl;
    if (agl > RF || Math.abs(cp[0]) > 2500 || Math.abs(cp[2]) > 2500) return;
    const cx = Math.floor(cp[0] / T), cz = Math.floor(cp[2] / T), n = Math.ceil(RF / T);
    for (let dz = -n; dz <= n; dz++) {
      for (let dx = -n; dx <= n; dx++) {
        const x0 = (cx + dx) * T, z0 = (cz + dz) * T, mx = x0 + T / 2, mz = z0 + T / 2;
        const h2 = (mx - cp[0]) ** 2 + (mz - cp[2]) ** 2;
        if (h2 > (RF + 3) ** 2) continue;
        const gy = groundHeight(mx, mz);
        const d = Math.sqrt(h2 + (gy - cp[1]) ** 2);
        if (d > RF + 3 || !sphereVisible(cam.planes, mx, gy + 0.6, mz, T * 0.75 + 1.5)) continue;
        const set = d < RN ? near : far;
        if (set.n >= 2400) continue;
        set.data[set.n * 2] = x0;
        set.data[set.n * 2 + 1] = z0;
        set.n++;
      }
    }
    const gl = this.gl;
    for (const s of this.grassSets) {
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, s.data, 0, s.n * 2);
    }
  }

  bindTextures() {
    const gl = this.gl;
    const tex = [this.noiseTex, this.shadowTex, this.groundTex, this.heightTex];
    tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
  }

  // Отрисовка всей сцены с камеры cam в текущий framebuffer.
  renderScene(cam, vw, vh, frames) {
    const gl = this.gl, P = this.prog, U = this.commonUniforms(cam);
    this.prepareClouds(cam);
    this.prepareGrass(cam);
    this.bindTextures();
    gl.viewport(0, 0, vw, vh);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    P.sky.use().setAll(U);
    gl.bindVertexArray(this.emptyVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    P.terrain.use().setAll(U);
    for (const c of this.chunks) {
      if (!sphereVisible(cam.planes, c.center[0], c.center[1], c.center[2], c.radius)) continue;
      gl.bindVertexArray(c.vao);
      gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_SHORT, 0);
    }

    P.tree.use().setAll(U);
    gl.bindVertexArray(this.treeVAO);
    gl.drawElementsInstanced(gl.TRIANGLES, this.treeCount, gl.UNSIGNED_SHORT, 0, this.blobCount);
    P.trunk.use().setAll(U);
    gl.bindVertexArray(this.trunkVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.trunkVerts, this.trunkCount);

    const [near, far] = this.grassSets;
    P.grass.use().setAll(U).set('uCamAGL', this.camAGL).set('uTile', 4).set('uFadeNear', 52).set('uFadeFar', 70);
    if (near.n) {
      P.grass.set('uWidthMul', 1);
      gl.bindVertexArray(near.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.quality.grassNear * 15, gl.UNSIGNED_SHORT, 0, near.n);
    }
    if (far.n) {
      P.grass.set('uWidthMul', 1.9);
      gl.bindVertexArray(far.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.quality.grassFar * 15, gl.UNSIGNED_SHORT, 0, far.n);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.birdBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.birdData, 0, this.birdCount * 8);
    P.bird.use().setAll(U);
    gl.bindVertexArray(this.birdVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.birdVerts, this.birdCount);

    // Полупрозрачное: облака (сортированы), затем светящиеся видоискатели и пыльца.
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    P.cloud.use().setAll(U);
    gl.bindVertexArray(this.cloudVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.puffs.length);

    gl.blendFunc(gl.ONE, gl.ONE);
    if (frames) this.drawFrames(cam, U, frames);
    P.mote.use().setAll(U).set('uPx', vh / (2 * cam.tanY)).set('uMode', 0);
    gl.bindVertexArray(this.motesAmbient.vao);
    gl.drawArrays(gl.POINTS, 0, this.motesAmbient.n);
    P.mote.set('uMode', 1);
    gl.bindVertexArray(this.motesThermal.vao);
    for (const t of this.w.sky.thermals) {
      P.mote.set('uThermal', [t.x, t.z, groundHeight(t.x, t.z) + 5, t.top]);
      gl.drawArrays(gl.POINTS, 0, this.motesThermal.n);
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.bindVertexArray(null);
  }

  drawFrames(cam, U, frames) {
    const gl = this.gl, P = this.prog;
    for (const f of frames) {
      if (f.alpha <= 0.001) continue;
      const b = cameraBasis(f.yaw, f.pitch, 0);
      const dist = v3.len(v3.sub(f.pos, cam.pos));
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 2.2 + f.pos[0]);
      P.frame.use().setAll(U).setAll({ uC: f.pos, uR: b.r, uU: b.u, uSize: [f.w, f.h], uAlpha: f.alpha * pulse, uFill: 0 });
      gl.bindVertexArray(this.frameVAO);
      gl.drawArrays(gl.TRIANGLES, 0, this.frameVerts);
      P.frame.set('uFill', 1);
      gl.drawArrays(gl.TRIANGLES, this.frameVerts, 6);
      // Далёкая «звёздочка», чтобы видоискатель был виден через всю долину.
      const far = smoothstep(90, 260, dist) * f.alpha * pulse;
      if (far > 0.01) {
        P.glow.use().setAll(U).setAll({ uC: f.pos, uScale: dist * 0.022, uAlpha: far * 0.85 });
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }

  // Снимок с позы кадра во внеэкранный буфер (с MSAA). Возвращает canvas.
  renderShot(pose, w, h) {
    const gl = this.gl;
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const msFBO = gl.createFramebuffer(), color = gl.createRenderbuffer(), depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, msFBO);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    const cam = makeCamera(pose.pos, pose.yaw, pose.pitch, 0, (pose.fov * Math.PI) / 180, w / h);
    this.renderScene(cam, w, h, null);
    const resFBO = gl.createFramebuffer(), tex = makeTexture(gl, { w, h, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE });
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFBO);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFBO);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, resFBO);
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    [msFBO, resFBO].forEach((f) => gl.deleteFramebuffer(f));
    [color, depth].forEach((r) => gl.deleteRenderbuffer(r));
    gl.deleteTexture(tex);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// Тайлящаяся текстура шума: R — шум с ячейкой 16 px, G — 8 px, B — fbm, A — белый шум.
function makeNoiseData(S) {
  const rnd = mulberry32(2024), out = new Uint8Array(S * S * 4);
  const lattice = (cells) => {
    const g = new Float32Array(cells * cells);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return (x, y) => {
      const fx = (x / S) * cells, fy = (y / S) * cells;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const at = (i, j) => g[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    };
  };
  const n16 = lattice(16), n32 = lattice(32), oct = [4, 8, 16, 32, 64].map(lattice);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let f = 0, amp = 0.5, norm = 0;
      for (const o of oct) { f += o(x, y) * amp; norm += amp; amp *= 0.5; }
      f = clamp((f / norm - 0.5) * 1.8 + 0.5, 0, 1);
      const i = (y * S + x) * 4;
      out[i] = n16(x, y) * 255; out[i + 1] = n32(x, y) * 255; out[i + 2] = f * 255; out[i + 3] = rnd() * 255;
    }
  }
  return out;
}

// Карта земли: тени деревьев днём (R) и на закате (B), дорога (G).
function makeGroundMap(trees, road) {
  const S = WORLD.gmSize, half = WORLD.gmHalf, k = S / (2 * half);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const channel = (draw) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, S, S);
    draw();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return ctx.getImageData(0, 0, S, S).data;
  };
  const shadows = (sun) => channel(() => {
    const ratio = Math.hypot(sun[0], sun[2]) / Math.max(sun[1], 0.12);
    const ang = Math.atan2(-sun[2], -sun[0]);
    for (const t of trees) {
      const h = t.cy - t.y, len = h * ratio;
      const cx = (t.x - (sun[0] / Math.hypot(sun[0], sun[2])) * len * 0.75 + half) * k;
      const cz = (t.z - (sun[2] / Math.hypot(sun[0], sun[2])) * len * 0.75 + half) * k;
      ctx.setTransform(1, 0, 0, 1, cx, cz);
      ctx.rotate(ang);
      ctx.scale(1 + len / (t.R * 2.2), 1);
      const r = t.R * 1.15 * k;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,0.75)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const day = shadows(PALETTES.day.sunDir), gold = shadows(PALETTES.golden.sunDir);
  const roadPx = channel(() => {
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const [wd, a] of [[10, 0.35], [6, 1]]) {
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = wd * k;
      ctx.beginPath();
      road.forEach(([x, z], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, (x + half) * k, (z + half) * k));
      ctx.stroke();
    }
  });
  const out = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    out[i * 4] = 255 - day[i * 4] * 0.7;
    out[i * 4 + 1] = roadPx[i * 4];
    out[i * 4 + 2] = 255 - gold[i * 4] * 0.7;
    out[i * 4 + 3] = 255;
  }
  return out;
}
