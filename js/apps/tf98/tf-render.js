(function (T) {
  'use strict';
  const FOV_H = Math.PI / 2;
  const NEAR = 0.05, FAR = 260;
  const STRIDE = 10;

  const COLORS = {
    ground: [0.5, 0.5, 0.5],
    plate: [0.56, 0.56, 0.56],
    block: [0.68, 0.68, 0.68],
    wall: [0.6, 0.6, 0.6],
    roof: [0.44, 0.44, 0.44],
    mark: [0.88, 0.88, 0.88],
    dark: [0.12, 0.12, 0.12],
    ladder: [0.42, 0.34, 0.24],
    hazard: [0.86, 0.72, 0.12],
    locker: [0.36, 0.42, 0.38],
    grate: [0.3, 0.3, 0.33],
    brass: [0.72, 0.58, 0.26],
    hot: T.TEAMS.hot.rgb,
    cold: T.TEAMS.cold.rgb
  };
  const SHADE = { top: 1, bottom: 0.55, x: 0.86, z: 0.74 };
  const WATER = [0.16, 0.42, 0.6];

  const VERTEX = `
    attribute vec3 aPos;
    attribute vec3 aColor;
    attribute vec3 aNormal;
    attribute float aGrid;
    uniform mat4 uViewProj;
    uniform mat4 uModel;
    uniform vec3 uEye;
    varying vec3 vPos;
    varying vec3 vColor;
    varying vec3 vNormal;
    varying float vGrid;
    varying float vDist;
    void main() {
      vec4 world = uModel * vec4(aPos, 1.0);
      vPos = world.xyz;
      vColor = aColor;
      vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
      vGrid = aGrid;
      vDist = distance(world.xyz, uEye);
      gl_Position = uViewProj * world;
    }`;

  const FRAGMENT = `
    precision mediump float;
    uniform vec3 uColor;
    uniform float uLit;
    uniform float uAlpha;
    varying vec3 vPos;
    varying vec3 vColor;
    varying vec3 vNormal;
    varying float vGrid;
    varying float vDist;
    void main() {
      vec3 c = vColor * uColor;
      if (uLit > 0.5) {
        vec3 n = normalize(vNormal);
        c *= 0.62 + 0.38 * max(dot(n, normalize(vec3(0.4, 0.8, 0.3))), 0.0);
      } else if (vGrid > 0.5) {
        vec3 d = abs(fract(vPos + 0.5) - 0.5);
        vec3 a = abs(vNormal);
        float best = 1.0;
        if (a.x < 0.9) best = min(best, d.x);
        if (a.y < 0.9) best = min(best, d.y);
        if (a.z < 0.9) best = min(best, d.z);
        float width = 0.012 + vDist * 0.0012;
        float fade = 1.0 - clamp(vDist / 70.0, 0.0, 1.0);
        if (best < width) c *= 1.0 - 0.28 * fade;
      }
      gl_FragColor = vec4(c, uAlpha);
    }`;

  function pushQuad(out, a, b, c, d, color, shade, n, grid) {
    const r = color[0] * shade, g = color[1] * shade, bl = color[2] * shade;
    for (const p of [a, b, c, a, c, d]) out.push(p[0], p[1], p[2], r, g, bl, n[0], n[1], n[2], grid);
  }

  function pushBox(out, b, color, grid) {
    const { x0, y0, z0, x1, y1, z1 } = b;
    pushQuad(out, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], color, SHADE.top, [0, 1, 0], grid);
    pushQuad(out, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], color, SHADE.bottom, [0, -1, 0], grid);
    pushQuad(out, [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], color, SHADE.x, [-1, 0, 0], grid);
    pushQuad(out, [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], color, SHADE.x, [1, 0, 0], grid);
    pushQuad(out, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], color, SHADE.z, [0, 0, -1], grid);
    pushQuad(out, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color, SHADE.z, [0, 0, 1], grid);
  }

  function pushRamp(out, r, color) {
    const top = (x, z) => T.topAt({ ramp: r.dir, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, lo: r.lo, hi: r.hi }, x, z);
    const { x0, z0, x1, z1, base } = r;
    const a = [x0, top(x0, z0), z0], b = [x1, top(x1, z0), z0], c = [x1, top(x1, z1), z1], d = [x0, top(x0, z1), z1];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    pushQuad(out, a, b, c, d, color, 0.96, [nx, ny, nz], 1);
    pushQuad(out, [x0, base, z0], [x1, base, z0], b, a, color, SHADE.z, [0, 0, -1], 1);
    pushQuad(out, [x0, base, z1], [x1, base, z1], c, d, color, SHADE.z, [0, 0, 1], 1);
    pushQuad(out, [x0, base, z0], [x0, base, z1], d, a, color, SHADE.x, [-1, 0, 0], 1);
    pushQuad(out, [x1, base, z0], [x1, base, z1], c, b, color, SHADE.x, [1, 0, 0], 1);
  }

  function pushSteps(out, s, color) {
    const rising = s.dir === 1 ? [1, 0] : s.dir === 2 ? [-1, 0] : s.dir === 3 ? [0, 1] : [0, -1];
    for (let i = 0; i < s.n; i++) {
      const y = s.lo + (s.hi - s.lo) * (i + 1) / s.n;
      const f0 = i / s.n, f1 = (i + 1) / s.n;
      let bx0 = s.x0, bx1 = s.x1, bz0 = s.z0, bz1 = s.z1;
      if (rising[0] > 0) { bx0 = s.x0 + (s.x1 - s.x0) * f0; bx1 = s.x0 + (s.x1 - s.x0) * f1; }
      if (rising[0] < 0) { bx1 = s.x1 - (s.x1 - s.x0) * f0; bx0 = s.x1 - (s.x1 - s.x0) * f1; }
      if (rising[1] > 0) { bz0 = s.z0 + (s.z1 - s.z0) * f0; bz1 = s.z0 + (s.z1 - s.z0) * f1; }
      if (rising[1] < 0) { bz1 = s.z1 - (s.z1 - s.z0) * f0; bz0 = s.z1 - (s.z1 - s.z0) * f1; }
      pushBox(out, { x0: bx0, y0: s.base, z0: bz0, x1: bx1, y1: y, z1: bz1 }, color, 1);
    }
  }

  function worldMesh(map) {
    const out = [];
    const color = m => COLORS[m] || COLORS.block;
    for (const b of map.vis.boxes) pushBox(out, b, color(b.mat), b.grid ? 1 : 0);
    for (const r of map.vis.ramps) pushRamp(out, r, color(r.mat));
    for (const s of map.vis.steps) pushSteps(out, s, color(s.mat));
    return new Float32Array(out);
  }

  function waterMesh(map) {
    const out = [];
    for (const w of map.vis.water) {
      pushQuad(out, [w.x0, w.y, w.z0], [w.x1, w.y, w.z0], [w.x1, w.y, w.z1], [w.x0, w.y, w.z1], WATER, 1, [0, 1, 0], 0);
    }
    return new Float32Array(out);
  }

  function lathe(rings, seg) {
    const out = [];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      for (let j = 0; j < rings.length - 1; j++) {
        const p = rings[j], q = rings[j + 1];
        const vert = (c, s, ring) => out.push(ring[0] * c, ring[1], ring[0] * s, 1, 1, 1, ring[2] * c, ring[3], ring[2] * s, 0);
        vert(c0, s0, p); vert(c1, s1, p); vert(c1, s1, q);
        vert(c0, s0, p); vert(c1, s1, q); vert(c0, s0, q);
      }
    }
    return new Float32Array(out);
  }

  function capsuleRings(r, h) {
    const rings = [];
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI / 2;
      rings.push([Math.cos(a) * r, r + Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
    for (let i = 0; i <= 5; i++) {
      const a = (i / 5) * Math.PI / 2;
      rings.push([Math.cos(a) * r, h - r + Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
    return rings;
  }

  function ballRings() {
    const rings = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI;
      rings.push([Math.cos(a), Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    return rings;
  }

  function unitBox() {
    const out = [];
    pushBox(out, { x0: -0.5, y0: -0.5, z0: -0.5, x1: 0.5, y1: 0.5, z1: 0.5 }, [1, 1, 1], 0);
    return new Float32Array(out);
  }

  function basisAlong(dx, dy, dz) {
    const f = { x: dx, y: dy, z: dz };
    const sideX = Math.abs(dy) > 0.9 ? 1 : 0, sideY = Math.abs(dy) > 0.9 ? 0 : 1;
    let rx = sideY * dz, ry = -sideX * dz, rz = sideX * dy - sideY * dx;
    const l = Math.hypot(rx, ry, rz) || 1;
    rx /= l; ry /= l; rz /= l;
    return { f, r: { x: rx, y: ry, z: rz }, u: { x: ry * dz - rz * dy, y: rz * dx - rx * dz, z: rx * dy - ry * dx } };
  }

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: !!opts.preserve });
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      const vs = this.compile(gl.VERTEX_SHADER, VERTEX), fs = this.compile(gl.FRAGMENT_SHADER, FRAGMENT);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      this.program = program;
      gl.useProgram(program);
      this.a = { pos: gl.getAttribLocation(program, 'aPos'), color: gl.getAttribLocation(program, 'aColor'), normal: gl.getAttribLocation(program, 'aNormal'), grid: gl.getAttribLocation(program, 'aGrid') };
      for (const k in this.a) gl.enableVertexAttribArray(this.a[k]);
      this.u = {
        viewProj: gl.getUniformLocation(program, 'uViewProj'), model: gl.getUniformLocation(program, 'uModel'), eye: gl.getUniformLocation(program, 'uEye'),
        color: gl.getUniformLocation(program, 'uColor'), lit: gl.getUniformLocation(program, 'uLit'), alpha: gl.getUniformLocation(program, 'uAlpha')
      };
      this.identity = T.M4.place(0, 0, 0, 0, 1);
      this.world = null;
      this.water = null;
      this.shapes = {
        capsule: this.mesh(lathe(capsuleRings(T.RULES.hullR, T.RULES.standH), 14)),
        band: this.mesh(lathe([[T.RULES.hullR + 0.015, 0.72, 1, 0], [T.RULES.hullR + 0.015, 1.02, 1, 0]], 14)),
        ball: this.mesh(lathe(ballRings(), 14)),
        box: this.mesh(unitBox())
      };
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.66, 0.74, 0.8, 1);
      this.viewProj = null;
      this.width = 1; this.height = 1;
    }

    compile(type, source) {
      const gl = this.gl, shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }

    mesh(data) {
      const gl = this.gl, buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { buffer, count: data.length / STRIDE };
    }

    freeMesh(m) { if (m) this.gl.deleteBuffer(m.buffer); }

    resize(w, h) {
      this.width = w; this.height = h;
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }

    setMap(map) {
      this.freeMesh(this.world);
      this.freeMesh(this.water);
      this.world = this.mesh(worldMesh(map));
      this.water = map.vis.water.length ? this.mesh(waterMesh(map)) : null;
    }

    drawMesh(m, model, color, lit, alpha) {
      const gl = this.gl, s = STRIDE * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buffer);
      gl.vertexAttribPointer(this.a.pos, 3, gl.FLOAT, false, s, 0);
      gl.vertexAttribPointer(this.a.color, 3, gl.FLOAT, false, s, 12);
      gl.vertexAttribPointer(this.a.normal, 3, gl.FLOAT, false, s, 24);
      gl.vertexAttribPointer(this.a.grid, 1, gl.FLOAT, false, s, 36);
      gl.uniformMatrix4fv(this.u.model, false, model);
      gl.uniform3f(this.u.color, color[0], color[1], color[2]);
      gl.uniform1f(this.u.lit, lit);
      gl.uniform1f(this.u.alpha, alpha);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    }

    drawBody(b) {
      const sy = b.h / T.RULES.standH;
      const place = T.M4.place(b.x, b.y, b.z, b.yaw, sy);
      const skin = b.uber ? [0.95, 0.97, 1] : b.burning ? [0.95, 0.5, 0.18] : [0.62, 0.62, 0.6];
      this.drawMesh(this.shapes.capsule, place, skin, 1, 1);
      this.drawMesh(this.shapes.band, place, T.TEAMS[b.team].rgb, 1, 1);
      const visor = T.M4.mul(place, T.M4.mul(T.M4.place(0, 1.34, 0.36, 0, 1), new Float32Array([0.5, 0, 0, 0, 0, 0.14, 0, 0, 0, 0, 0.24, 0, 0, 0, 0, 1])));
      this.drawMesh(this.shapes.box, visor, [0.14, 0.14, 0.16], 1, 1);
    }

    drawBeam(b) {
      const dx = b.bx - b.ax, dy = b.by - b.ay, dz = b.bz - b.az, len = Math.hypot(dx, dy, dz);
      if (len < 1e-4) return;
      const basis = basisAlong(dx / len, dy / len, dz / len);
      const model = T.M4.basis(basis, (b.ax + b.bx) / 2, (b.ay + b.by) / 2, (b.az + b.bz) / 2, b.w, b.w, len);
      this.drawMesh(this.shapes.box, model, b.color, 0, b.alpha === undefined ? 1 : b.alpha);
    }

    drawProp(p, alpha = 1) {
      const b = { r: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, f: { x: 0, y: 0, z: 1 } };
      this.drawMesh(this.shapes.box, T.M4.basis(b, p.x, p.y, p.z, p.w, p.h, p.d), p.color, 1, alpha);
    }

    drawHands(cam, hands) {
      const gl = this.gl, b = T.aimBasis(cam.yaw, cam.pitch);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const ox = 0.26 + hands.side, oy = -0.2 - hands.dip, oz = 0.55 - hands.kick;
      for (const p of hands.parts) {
        const rx = ox + p[3], uy = oy + p[4], fz = oz + p[5];
        const x = cam.x + b.r.x * rx + b.u.x * uy + b.f.x * fz;
        const y = cam.y + b.r.y * rx + b.u.y * uy + b.f.y * fz;
        const z = cam.z + b.r.z * rx + b.u.z * uy + b.f.z * fz;
        this.drawMesh(this.shapes.box, T.M4.basis(b, x, y, z, p[0], p[1], p[2]), [p[6], p[6], p[6]], 1, 1);
      }
    }

    render(view) {
      const gl = this.gl;
      if (gl.isContextLost()) return;
      const cam = view.cam;
      const d = T.dir(cam.yaw, cam.pitch);
      const aspect = this.width / this.height;
      const fovH = view.zoom ? FOV_H * view.zoom : FOV_H;
      const fovy = 2 * Math.atan(Math.tan(fovH / 2) / Math.max(aspect, 1));
      const proj = T.M4.perspective(fovy, aspect, NEAR, FAR);
      const lookAt = T.M4.lookAt(cam.x, cam.y, cam.z, cam.x + d.x, cam.y + d.y, cam.z + d.z);
      this.viewProj = T.M4.mul(proj, lookAt);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(this.u.viewProj, false, this.viewProj);
      gl.uniform3f(this.u.eye, cam.x, cam.y, cam.z);
      if (this.world) this.drawMesh(this.world, this.identity, [1, 1, 1], 0, 1);
      for (const b of view.bodies || []) this.drawBody(b);
      for (const r of view.rockets || []) this.drawBeam(r);
      for (const p of view.props || []) this.drawProp(p);
      for (const m of view.balls || []) this.drawMesh(this.shapes.ball, T.M4.scaleAt(m.x, m.y, m.z, m.r), m.color, 1, 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      if (this.water) this.drawMesh(this.water, this.identity, [1, 1, 1], 0, 0.55);
      for (const b of view.beams || []) this.drawBeam(b);
      for (const p of view.ghosts || []) this.drawProp(p, 0.5);
      for (const b of view.booms || []) this.drawMesh(this.shapes.ball, T.M4.scaleAt(b.x, b.y, b.z, b.r), [1, 0.56, 0.16], 0, b.alpha);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      if (view.hands) this.drawHands(cam, view.hands);
    }

    project(x, y, z) {
      const m = this.viewProj;
      if (!m) return null;
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (w < NEAR) return null;
      return {
        x: ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) / 2 * this.width,
        y: (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w) / 2 * this.height
      };
    }

    destroy() {
      const gl = this.gl;
      if (!gl) return;
      this.freeMesh(this.world);
      this.freeMesh(this.water);
      for (const k in this.shapes) this.freeMesh(this.shapes[k]);
      gl.deleteProgram(this.program);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this.gl = null;
    }
  }

  T.Renderer = Renderer;
})(globalThis.Tf98 = globalThis.Tf98 || {});
