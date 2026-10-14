(function (S) {
  'use strict';
  const { Geo, OBJECTS, footprint, GEO_STRIDE } = S;

  const VS = `
attribute vec3 aP; attribute vec3 aN; attribute vec4 aC; attribute vec2 aT;
uniform mat4 uVP; uniform vec3 uSun;
varying vec3 vA; varying float vL; varying vec2 vT; varying float vE;
void main() {
  vec3 n = normalize(aN + vec3(0.0, 0.0, 0.0001));
  vL = 0.55 + 0.55 * max(dot(n, uSun), 0.0) + 0.08 * n.z;
  vA = aC.rgb; vE = aC.a; vT = aT;
  gl_Position = uVP * vec4(aP, 1.0);
}`;
  const FS = `
precision mediump float;
uniform sampler2D uTex;
varying vec3 vA; varying float vL; varying vec2 vT; varying float vE;
void main() {
  vec4 t = texture2D(uTex, vT);
  if (t.a < 0.35) discard;
  vec3 b = t.rgb * vA;
  gl_FragColor = vec4(mix(b * vL, b * 1.05, clamp(vE, 0.0, 1.0)), 1.0);
}`;

  function ortho(center, F, R, U, s, w, h) {
    const D = 60;
    const dR = center[0] * R[0] + center[1] * R[1] + center[2] * R[2];
    const dU = center[0] * U[0] + center[1] * U[1] + center[2] * U[2];
    const dF = center[0] * F[0] + center[1] * F[1] + center[2] * F[2];
    const ax = 2 * s / w, ay = 2 * s / h;
    return new Float32Array([R[0] * ax, U[0] * ay, F[0] / D, 0, R[1] * ax, U[1] * ay, F[1] / D, 0, R[2] * ax, U[2] * ay, F[2] / D, 0, -dR * ax, -dU * ay, -dF / D, 1]);
  }
  function basis(yaw, pitch) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const F = [-cp * Math.cos(yaw), -cp * Math.sin(yaw), -sp];
    let R = [-F[1], F[0], 0];
    const l = Math.hypot(R[0], R[1]) || 1; R = [R[0] / l, R[1] / l, 0];
    let U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
    if (U[2] < 0) U = U.map(v => -v);
    return { F, R, U };
  }

  class Stage {
    constructor(atlas, w, h, opt) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = w; this.canvas.height = h;
      const gl = this.canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.atlas = atlas;
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      ['aP', 'aN', 'aC', 'aT'].forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      this.p = p;
      this.u = { vp: gl.getUniformLocation(p, 'uVP'), sun: gl.getUniformLocation(p, 'uSun'), tex: gl.getUniformLocation(p, 'uTex') };
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.buf = gl.createBuffer();
      this.cache = new Map();
      this.bg = (opt && opt.bg) || [0, 0, 0, 0];
    }
    resize(w, h) { if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; } }
    render(geo, vp, sun, bg) {
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      const c = bg || this.bg;
      gl.clearColor(c[0], c[1], c[2], c[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(this.p);
      gl.uniformMatrix4fv(this.u.vp, false, vp);
      gl.uniform3fv(this.u.sun, sun || [0.4, 0.55, 0.73]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(this.u.tex, 0);
      const arr = new Float32Array(geo.data);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      const st = GEO_STRIDE * 4;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, st, 24);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, st, 40);
      gl.drawArrays(gl.TRIANGLES, 0, arr.length / GEO_STRIDE);
    }
    simGeo(sim, opt) {
      const g = new Geo(this.atlas);
      const pose = S.poseOf(Object.assign(Object.create(Object.getPrototypeOf(sim)), sim, { anim: opt && opt.anim || 'idle', engage: null, carriedBy: null, seatOf: null, lieH: 0, sitH: 0, prop: null }), opt && opt.t || 0, null);
      const r = S.emitSim(g, sim, opt && opt.t || 0, this.atlas, { x: 0, y: 0, z: 0, yaw: Math.PI / 2 + (opt && opt.turn || 0), pose });
      return { g, r };
    }
    portrait(sim, size) {
      size = size || 96;
      const key = 'p' + size + ':' + (sim._body ? sim._body.key : '') + sim.age + sim.gender + sim.outfit + JSON.stringify(sim.look);
      if (this.cache.has(key)) return this.cache.get(key);
      this.resize(size, size);
      const { g, r } = this.simGeo(sim, {});
      const b = basis(Math.PI / 2 + 0.25, 0.12);
      const head = r.head;
      const center = [head[0], head[1], head[2] - 0.12 * (sim.isKid ? 0.8 : 1)];
      const s = size / (0.62 * Math.max(0.55, r.k * (sim.isBaby || sim.isToddler ? 0.8 : 1)));
      this.render(g, ortho(center, b.F, b.R, b.U, s, size, size), [0.3, 0.7, 0.65]);
      const url = this.canvas.toDataURL();
      this.cache.set(key, url);
      if (this.cache.size > 300) this.cache.delete(this.cache.keys().next().value);
      return url;
    }
    fullBody(sim, w, h, turn, t, anim) {
      this.resize(w, h);
      const { g, r } = this.simGeo(sim, { turn, t, anim });
      const b = basis(Math.PI / 2 + 0.05, 0.1);
      const H = 1.9 * r.k * (sim.isToddler ? 1.2 : 1);
      g.cyl(0, 0, -0.08, 0.0, 0.62, 0.62, 24, [0.86, 0.92, 0.98], { e: 0.2 });
      g.cyl(0, 0, -0.14, -0.08, 0.66, 0.66, 24, [0.62, 0.74, 0.9]);
      const s = Math.min(w / 1.6, h / (H + 0.5));
      this.render(g, ortho([0, 0, H / 2 + 0.05], b.F, b.R, b.U, s, w, h), [0.35, 0.75, 0.55]);
      return this.canvas;
    }
    thumb(type, colors, size) {
      size = size || 64;
      const key = 't' + size + ':' + type + ':' + (colors || []).join(',');
      if (this.cache.has(key)) return this.cache.get(key);
      this.resize(size, size);
      const def = OBJECTS[type];
      const g = new Geo(this.atlas);
      const f = footprint(def, 2);
      const ob = { t: type, col: colors || def.col, st: {}, id: 7, r: 2, layer: 'occ' };
      g.setTransform(0, 0, def.place === 'surface' ? 0 : 0, -1, 0, 0, 1, 1);
      S.buildObject(g, ob, def, { lampOn: false, night: false });
      g.clearTransform();
      const b = basis(Math.PI / 4, Math.PI / 6);
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (let i = 0; i < g.data.length; i += GEO_STRIDE) {
        const x = g.data[i], y = g.data[i + 1], z = g.data[i + 2];
        const sx = x * b.R[0] + y * b.R[1] + z * b.R[2], sy = x * b.U[0] + y * b.U[1] + z * b.U[2];
        minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
      }
      if (!g.data.length) { minX = -0.5; maxX = 0.5; minY = -0.5; maxY = 0.5; }
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const span = Math.max(maxX - minX, maxY - minY, 0.4) * 1.12;
      const s = size / span;
      const center = [b.R[0] * cx + b.U[0] * cy, b.R[1] * cx + b.U[1] * cy, b.R[2] * cx + b.U[2] * cy];
      this.render(g, ortho(center, b.F, b.R, b.U, s, size, size), [0.4, 0.55, 0.73]);
      const url = this.canvas.toDataURL();
      this.cache.set(key, url);
      return url;
    }
  }

  class Overlay {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.fxT = new WeakMap(); this.rt = 0; }
    resize(w, h) { if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; } }
    clear() {
      const g = this.ctx;
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      g.fillStyle = 'rgba(0,0,0,0.004)';
      g.fillRect(0, 0, 1, 1);
    }
    bubble(g, x, y, icon, kind) {
      const r = 17;
      g.save();
      g.fillStyle = kind === 'bad' ? '#fff0f0' : '#ffffff';
      g.strokeStyle = kind === 'bad' ? '#c0282a' : 'rgba(40,60,90,0.8)';
      g.lineWidth = 1.5;
      if (kind === 'think') {
        g.beginPath(); g.arc(x - 6, y + 26, 3, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.arc(x - 2, y + 19, 4.5, 0, 7); g.fill(); g.stroke();
        g.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.arc(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 6), 8, 0, 7); }
        g.fill();
        g.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.moveTo(x + Math.cos(a) * (r - 4) + 8, y + Math.sin(a) * (r - 6)); g.arc(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 6), 8, 0, 7); }
        g.stroke();
        g.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.arc(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 6), 7, 0, 7); }
        g.fill();
      } else {
        g.beginPath();
        g.moveTo(x - r, y - r + 6); g.quadraticCurveTo(x - r, y - r, x - r + 6, y - r); g.lineTo(x + r - 6, y - r); g.quadraticCurveTo(x + r, y - r, x + r, y - r + 6);
        g.lineTo(x + r, y + r - 10); g.quadraticCurveTo(x + r, y + r - 4, x + r - 6, y + r - 4); g.lineTo(x + 2, y + r - 4); g.lineTo(x - 4, y + r + 6); g.lineTo(x - 4, y + r - 4); g.lineTo(x - r + 6, y + r - 4); g.quadraticCurveTo(x - r, y + r - 4, x - r, y + r - 10); g.closePath();
        g.fill(); g.stroke();
      }
      const p = S.iconPath2D(icon);
      if (p) {
        g.translate(x - 11, y - 13 + (kind === 'think' ? 1 : -1));
        g.scale(22 / 24, 22 / 24);
        const col = { m_heart: '#e03a5a', m_kiss: '#e03a5a', m_angry: '#c02a20', m_no: '#c02a20', m_money: '#2a9a3a', m_zzz: '#3a5ab8', m_fire: '#e8781a', n_hunger: '#b87a2a', n_bladder: '#e0a820', n_hygiene: '#2a8ae0', m_laugh: '#e0a020', m_food: '#c86a2a', m_broken: '#8a2a3a' }[icon] || '#2a4a7a';
        g.fillStyle = col;
        g.fill(p);
      }
      g.restore();
    }
    draw(ui, heads, rtDt) {
      const g = this.ctx, game = ui.game, r = ui.r, cam = r.cam;
      this.rt += rtDt;
      this.clear();
      for (const sim of game.sims.values()) {
        const h = heads.get(sim.id);
        if (!h) continue;
        const hp = cam.toScreen(h.head[0], h.head[1], h.head[2]);
        if (sim.censor) {
          const fp = cam.toScreen(sim.x, sim.y, (sim.lieH || sim.sitH || 0) + 0.1);
          const top = Math.min(hp[1] + 4, fp[1] - 6);
          const bw = Math.max(12, cam.s * 0.55 * sim.scale);
          const x0 = (hp[0] + fp[0]) / 2 - bw / 2;
          const bh = Math.max(10, fp[1] - top - (sim.lieH ? -cam.s * 0.3 : 0));
          const cell = Math.max(3, Math.round(cam.s / 9));
          const skin = S.SKIN_TONES[sim.look.skin] || '#e0b090';
          for (let yy = 0; yy < bh; yy += cell) for (let xx = 0; xx < bw; xx += cell) {
            const n = S.hash2(Math.floor((x0 + xx) / cell), Math.floor((top + yy) / cell), Math.floor(this.rt * 6));
            g.fillStyle = n < 0.55 ? skin : n < 0.75 ? '#c89878' : n < 0.9 ? '#a87858' : '#f0d8c0';
            g.fillRect(Math.round(x0 + xx), Math.round(top + yy), cell, cell);
          }
        }
        if (sim.bubble && !sim.hidden) this.bubble(g, hp[0] + 14, hp[1] - 42, sim.bubble.icon, 'think');
        else if (sim.balloon && !sim.hidden) this.bubble(g, hp[0] + 16, hp[1] - 36, sim.balloon.icon, sim.balloon.bad ? 'bad' : 'speak');
        if (ui.hoverSim === sim.id && !sim.hidden) {
          const a = sim.queue[0];
          const txt = sim.first + ' ' + sim.last + (a && !a.def.hidden ? ' · ' + a.name : '');
          g.font = 'bold 11px Tahoma, Verdana, sans-serif';
          const w = g.measureText(txt).width + 12;
          g.fillStyle = 'rgba(230,242,252,0.95)'; g.strokeStyle = '#2b5c98';
          const x = Math.round(hp[0] - w / 2), y = Math.round(hp[1] - 62);
          g.beginPath(); g.roundRect ? g.roundRect(x, y, w, 18, 8) : g.rect(x, y, w, 18); g.fill(); g.stroke();
          g.fillStyle = '#173a6b'; g.fillText(txt, x + 6, y + 13);
        }
      }
      for (const fx of game.fxList) {
        let t0 = this.fxT.get(fx);
        if (t0 === undefined) { t0 = this.rt; this.fxT.set(fx, t0); }
        const age = this.rt - t0;
        const life = fx.type === 'money' || fx.type === 'text' || fx.type === 'rel' || fx.type === 'wish' ? 2.4 : 1.6;
        if (age > life) continue;
        const k = age / life;
        let pos;
        const hs = fx.sim ? heads.get(fx.sim) : null;
        if (hs) pos = cam.toScreen(hs.head[0], hs.head[1], hs.head[2]);
        else pos = cam.toScreen(fx.x, fx.y, 1.8);
        const x = pos[0], y = pos[1] - 30 - k * 36;
        g.globalAlpha = Math.min(1, (1 - k) * 2);
        if (fx.type === 'money') {
          const v = fx.data;
          const txt = (v >= 0 ? '+' : '−') + '§' + S.fmtNum(Math.abs(v));
          g.font = 'bold 14px Tahoma, Verdana, sans-serif';
          g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(txt, x - g.measureText(txt).width / 2, y);
          g.fillStyle = v >= 0 ? '#7cff6a' : '#ff7a6a'; g.fillText(txt, x - g.measureText(txt).width / 2, y);
        } else if (fx.type === 'text' || fx.type === 'wish') {
          const txt = fx.type === 'wish' ? '+' + S.fmtNum(fx.data) + ' очков счастья' : String(fx.data);
          g.font = 'bold 12px Tahoma, Verdana, sans-serif';
          g.lineWidth = 3; g.strokeStyle = 'rgba(0,30,60,0.7)'; g.strokeText(txt, x - g.measureText(txt).width / 2, y);
          g.fillStyle = fx.type === 'wish' ? '#fff27a' : '#ffffff'; g.fillText(txt, x - g.measureText(txt).width / 2, y);
        } else if (fx.type === 'rel') {
          const good = fx.data >= 0;
          g.fillStyle = good ? '#3ad84a' : '#e83a2a';
          g.font = 'bold 20px Arial';
          g.fillText(good ? '+' : '−', x - 6, y);
        } else if (fx.type === 'heart') {
          const p = S.iconPath2D('m_heart');
          g.save(); g.translate(x - 8 + Math.sin(age * 5) * 6, y); g.scale(0.7, 0.7); g.fillStyle = '#ff4a7a'; g.fill(p); g.restore();
        } else if (fx.type === 'skill') {
          const p = S.iconPath2D('m_star');
          g.save(); g.translate(x - 12, y - 6); g.fillStyle = '#ffe34a'; g.strokeStyle = '#8a6a00'; g.fill(p); g.stroke(p); g.restore();
          g.font = 'bold 12px Tahoma'; g.fillStyle = '#fff'; g.fillText(String(fx.data), x - 3, y + 10);
        } else if (fx.type === 'sparkle') {
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + age * 3; const rr = 10 + k * 26; g.fillStyle = i % 2 ? '#ffffff' : '#9ae8ff'; g.fillRect(x + Math.cos(a) * rr - 2, y + 20 + Math.sin(a) * rr * 0.6 - 2, 4, 4); }
        } else if (fx.type === 'dust') {
          for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + age * 4; g.fillStyle = 'rgba(210,200,180,0.85)'; g.beginPath(); g.arc(x + Math.cos(a) * 18, y + 40 + Math.sin(a) * 10, 11 + Math.sin(age * 9 + i) * 3, 0, 7); g.fill(); }
          g.fillStyle = '#ffe34a'; g.font = 'bold 14px Arial'; g.fillText('✶', x - 18 + Math.sin(age * 7) * 8, y + 30); g.fillText('✶', x + 10, y + 44 + Math.cos(age * 6) * 6);
        } else if (fx.type === 'snore') {
          g.font = 'bold 13px Arial'; g.fillStyle = '#e8f0ff'; g.strokeStyle = '#2a4a8a'; g.lineWidth = 2;
          g.strokeText('z', x + k * 14, y); g.fillText('z', x + k * 14, y);
        } else if (fx.type === 'spark') {
          g.strokeStyle = '#fff27a'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i + age * 20; g.moveTo(x, y + 30); g.lineTo(x + Math.cos(a) * 18, y + 30 + Math.sin(a) * 18); } g.stroke();
        }
        g.globalAlpha = 1;
      }
      if (ui.drawExtra) ui.drawExtra(g);
    }
  }

  Object.assign(S, { Stage, Overlay, stageBasis: basis, stageOrtho: ortho });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
