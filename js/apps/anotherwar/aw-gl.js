(function (AW) {
  'use strict';

  const VS = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  uniform vec4 u_rect;
  uniform vec4 u_uv;
  uniform vec2 u_cam;
  uniform vec2 u_view;
  out vec2 v_uv;
  out vec2 v_world;
  void main() {
    vec2 w = u_rect.xy + a_pos * u_rect.zw;
    v_world = w;
    v_uv = u_uv.xy + a_pos * u_uv.zw;
    vec2 s = (w - u_cam) / u_view;
    gl_Position = vec4(s.x * 2.0 - 1.0, 1.0 - s.y * 2.0, 0.0, 1.0);
  }`;

  const FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_tex;
  uniform sampler2D u_height;
  uniform int u_mode;
  uniform float u_occlude;
  uniform float u_feet;
  uniform vec2 u_bgSize;
  uniform float u_zk;
  uniform float u_band0;
  uniform float u_band;
  uniform float u_zbase;
  uniform float u_zf;
  uniform float u_ghost;
  uniform vec4 u_tint;
  uniform float u_alpha;
  in vec2 v_uv;
  in vec2 v_world;
  out vec4 o;
  void main() {
    vec4 c = texture(u_tex, v_uv);
    float depth = u_band0;
    float a = c.a;
    if (u_mode == 0) {
      if (a < 0.03) discard;
      float z = u_zbase + a * 255.0 * u_zf;
      depth = u_band0 - clamp(z / 70000.0, 0.0, 1.0) * u_band;
      a = 1.0;
    } else if (u_mode == 3) {
      c = vec4(c.rgb, 1.0);
      a = 1.0;
    } else {
      if (a < 0.01) discard;
    }
    if (u_occlude > 0.5) {
      float h = texture(u_height, v_world / u_bgSize).r * 255.0;
      if (h > 0.5 && v_world.y + h * u_zk > u_feet + 3.0) {
        if (u_ghost > 0.5) {
          if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard;
          c.rgb = mix(c.rgb, vec3(0.55, 0.62, 0.75), 0.35);
        } else discard;
      }
    }
    gl_FragDepth = depth;
    vec3 rgb = mix(c.rgb, u_tint.rgb, u_tint.a);
    o = vec4(rgb, a * u_alpha);
  }`;

  const LINE_FS = `#version 300 es
  precision highp float;
  uniform vec4 u_color;
  out vec4 o;
  void main() { o = u_color; }`;

  const LINE_VS = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  uniform vec2 u_cam;
  uniform vec2 u_view;
  void main() {
    vec2 s = (a_pos - u_cam) / u_view;
    gl_Position = vec4(s.x * 2.0 - 1.0, 1.0 - s.y * 2.0, 0.0, 1.0);
  }`;

  function compile(gl, vs, fs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'a_pos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  const FX_ANIM = { krew1: 1, krew2: 1, krew3: 1 };

  AW.GL = class {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL2 недоступен');
      this.gl = gl;
      this.prog = compile(gl, VS, FS);
      this.line = compile(gl, LINE_VS, LINE_FS);
      this.quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      this.lineBuf = gl.createBuffer();
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.lineVao = gl.createVertexArray();
      gl.bindVertexArray(this.lineVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.tex = new Map();
      this.bytes = 0;
      this.budget = 400 * 1024 * 1024;
      this.frameNo = 0;
      this.view = [AW.C.VIEW_W, AW.C.VIEW_H];
      this.bg = null;
      this.height = null;
      this.white = this.makeTex(1, 1, new Uint8Array([255, 255, 255, 255]));
      this.black = this.makeTex(1, 1, new Uint8Array([0, 0, 0, 0]));
      this.rain = [];
      this.lastParts = new WeakMap();
    }

    makeTex(w, h, data) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    upload(bmp) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    texture(rel, keep) {
      let rec = this.tex.get(rel);
      if (rec) { rec.last = this.frameNo; if (keep) rec.keep = true; return rec.ready ? rec : null; }
      rec = { ready: false, last: this.frameNo, keep: !!keep, t: null, w: 0, h: 0, size: 0 };
      this.tex.set(rel, rec);
      AW.Assets.bitmap(rel).then(bmp => {
        if (this.tex.get(rel) !== rec) return;
        rec.t = this.upload(bmp);
        rec.w = bmp.width;
        rec.h = bmp.height;
        rec.size = bmp.width * bmp.height * 4;
        this.bytes += rec.size;
        rec.ready = true;
        AW.Assets.drop(rel);
        this.evict();
      }).catch(() => { rec.failed = true; });
      return null;
    }

    preload(rel, keep) {
      this.texture(rel, keep);
      const rec = this.tex.get(rel);
      return new Promise(res => {
        const tick = () => { if (!rec || rec.ready || rec.failed) res(); else setTimeout(tick, 16); };
        tick();
      });
    }

    evict() {
      if (this.bytes <= this.budget) return;
      const list = [...this.tex.entries()].filter(([, r]) => r.ready && !r.keep).sort((a, b) => a[1].last - b[1].last);
      for (const [k, r] of list) {
        if (this.bytes <= this.budget * 0.8) break;
        if (this.frameNo - r.last < 120) break;
        this.gl.deleteTexture(r.t);
        this.bytes -= r.size;
        this.tex.delete(k);
      }
    }

    dropLevel() {
      for (const [k, r] of this.tex) {
        if (!r.keep || !k.startsWith('bg/')) continue;
        if (r.t) this.gl.deleteTexture(r.t);
        this.bytes -= r.size;
        this.tex.delete(k);
      }
    }

    async setLevel(level) {
      this.dropLevel();
      const name = level.bg;
      this.bgRel = 'bg/' + name + '.webp';
      this.hRel = 'bg/' + name + '_h.png';
      this.zk = (level.zscale || 10) * 12 / 255;
      this.bgSize = [level.bgw || 800, level.bgh || 600];
      await Promise.all([this.preload(this.bgRel, true), this.preload(this.hRel, true)]);
    }

    sheetRel(key) { return 'anim/' + key + '.webp'; }

    async preloadActor(a, anims) {
      const jobs = [];
      const l = a.lookSkins();
      const wcs = new Set([a.gfxClass(), 'empty']);
      for (const an of anims) {
        for (const wc of wcs) {
          for (const [part, skin] of [['legs', l.legs], ['torso', l.torso], ['head', l.head], ['weapon', a.weaponSkin()]]) {
            if (!skin) continue;
            const key = an + '_' + wc + '_' + part + '_' + skin;
            if (AW.Data.sheet(key)) jobs.push(this.preload(this.sheetRel(key)));
          }
        }
      }
      await Promise.all(jobs);
    }

    begin() {
      const gl = this.gl;
      this.frameNo++;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.prog.p);
      gl.bindVertexArray(this.vao);
      const u = this.prog.u;
      gl.uniform2f(u.u_view, this.view[0], this.view[1]);
      gl.uniform1i(u.u_tex, 0);
      gl.uniform1i(u.u_height, 1);
      gl.uniform1f(u.u_alpha, 1);
      gl.uniform4f(u.u_tint, 0, 0, 0, 0);
      gl.uniform1f(u.u_ghost, 0);
    }

    setCam(x, y) {
      this.cam = [Math.round(x), Math.round(y)];
      this.gl.uniform2f(this.prog.u.u_cam, this.cam[0], this.cam[1]);
    }

    bindHeight() {
      const gl = this.gl;
      const h = this.tex.get(this.hRel);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, h && h.ready ? h.t : this.black);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(this.prog.u.u_bgSize, this.bgSize ? this.bgSize[0] : 1, this.bgSize ? this.bgSize[1] : 1);
      gl.uniform1f(this.prog.u.u_zk, this.zk || 0);
    }

    quad(rec, sx, sy, sw, sh, x, y, w, h) {
      const gl = this.gl;
      const u = this.prog.u;
      gl.bindTexture(gl.TEXTURE_2D, rec.t);
      gl.uniform4f(u.u_rect, x, y, w, h);
      gl.uniform4f(u.u_uv, sx / rec.w, sy / rec.h, sw / rec.w, sh / rec.h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    mode(m, opts) {
      const gl = this.gl;
      const u = this.prog.u;
      const o = opts || {};
      gl.uniform1i(u.u_mode, m);
      gl.uniform1f(u.u_occlude, o.occlude ? 1 : 0);
      gl.uniform1f(u.u_feet, o.feet || 0);
      gl.uniform1f(u.u_band0, o.band0 === undefined ? 0.999 : o.band0);
      gl.uniform1f(u.u_band, o.band || 0);
      gl.uniform1f(u.u_ghost, o.ghost ? 1 : 0);
      gl.uniform1f(u.u_alpha, o.alpha === undefined ? 1 : o.alpha);
      const t = o.tint || [0, 0, 0, 0];
      gl.uniform4f(u.u_tint, t[0], t[1], t[2], t[3]);
    }

    gfxFrame(key, animIdx, frame) {
      const m = AW.Data.gfx && AW.Data.gfx[key];
      if (!m) return null;
      const an = m.anims[animIdx] || m.anims[0];
      if (!an || !an.f.length) return null;
      const f = an.f[((frame % an.f.length) + an.f.length) % an.f.length];
      const rec = this.texture('gfx/' + key + '.webp');
      return rec ? { rec, f, an } : null;
    }

    drawGfx(key, animIdx, frame, x, y, m, opts) {
      const g = this.gfxFrame(key, animIdx, frame);
      if (!g) return false;
      const f = g.f;
      this.mode(m, opts);
      this.quad(g.rec, f[0], f[1], f[2], f[3], x - f[4], y - f[5], f[2], f[3]);
      return true;
    }

    render(W, ui) {
      const gl = this.gl;
      this.begin();
      if (!W.level) return;
      const cam = W.cam;
      this.setCam(cam.x, cam.y);
      this.bindHeight();
      const bg = this.tex.get(this.bgRel);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.disable(gl.BLEND);
      if (bg && bg.ready) {
        this.mode(3, {});
        this.quad(bg, 0, 0, bg.w, bg.h, 0, 0, bg.w, bg.h);
      }
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const vx0 = cam.x - 200, vy0 = cam.y - 250, vx1 = cam.x + this.view[0] + 200, vy1 = cam.y + this.view[1] + 250;
      const inView = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
      for (const f of W.fx) {
        if (!f.ground || !inView(f.x, f.y)) continue;
        const fr = FX_ANIM[f.kind] ? Math.min(4, Math.floor(f.t * 15)) : Math.floor(f.t * 15);
        const fade = Math.min(1, (f.life - f.t) / 3);
        this.drawGfx('fx/' + f.kind, 0, fr, f.x, f.y, 1, { occlude: true, feet: f.y + 20, alpha: 0.85 * fade });
      }
      for (const g of W.ground) {
        if (!inView(g.x, g.y)) continue;
        const key = g.item.icon;
        const m = AW.Data.gfx && AW.Data.gfx[key];
        if (!m) continue;
        const idx = Math.max(0, m.anims.findIndex(a => /^nor$/i.test(a.name)));
        const hl = ui && ui.hoverItem === g;
        this.drawGfx(key, idx, 0, g.x, g.y, 1, { occlude: true, feet: g.y + 6, tint: hl ? [1, 1, 0.6, 0.35] : null });
      }
      if (W.hero && (W.hero.skills.spot || 0) > 0) {
        const r = 90 + (W.hero.skills.spot || 0) * 60;
        for (const mi of W.mines) {
          if (mi.dead || AW.dist(mi.x, mi.y, W.hero.x, W.hero.y) > r) continue;
          this.drawGfx('przedmioty/minappiech', 1, 0, mi.x, mi.y, 1, { occlude: true, feet: mi.y + 4 });
        }
      }
      for (const a of W.actors) {
        if (!a.visible || a.dead || a.crate || !inView(a.x, a.y)) continue;
        this.drawGfx('gui/cienhuman', 0, 0, a.x, a.y, 1, { occlude: true, feet: a.y + 10, alpha: 0.7 });
      }
      for (const p of W.projectiles) {
        if (p.kind !== 'grenade') continue;
        const k = Math.min(1, p.t / p.dur);
        const gx = AW.lerp(p.x0, p.x1, k), gy = AW.lerp(p.y0 + 60, p.y1, k);
        this.drawGfx('gui/ciengranat', 0, 0, gx, gy, 1, { alpha: 0.6 });
      }
      const items = [];
      for (const a of W.actors) {
        if (!a.visible || !inView(a.x, a.y)) continue;
        items.push({ y: a.y, a });
      }
      for (const g of W.gfx) {
        if (!g.visible || !g.meta || g.mode === 'add') continue;
        const fr = g.frames()[g.frame];
        if (!fr) continue;
        const top = g.y - fr[5];
        if (!inView(g.x, top + fr[3] * 0.5)) continue;
        items.push({ y: top + fr[3] + (g.sortBias || 0), g });
      }
      items.sort((p, q) => p.y - q.y);
      const n = items.length + 1;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      let i = 0;
      for (const it of items) {
        i++;
        const band0 = 1 - i / n, band = 0.98 / n;
        if (it.a) this.drawActor(it.a, band0, band, W, ui);
        else {
          const g = it.g;
          this.drawGfx(g.key, g.anim, g.frame, g.x, g.y, 1, { band0 });
        }
      }
      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);
      for (const p of W.projectiles) {
        if (p.kind !== 'grenade') continue;
        const k = Math.min(1, p.t / p.dur);
        const gx = AW.lerp(p.x0, p.x1, k), gy = AW.lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * 90;
        this.drawGfx('przedmioty/granat', 1, Math.floor(p.t * 20), gx, gy, 1, {});
      }
      for (const f of W.fx) {
        if (f.ground || f.kind === 'tracer' || !inView(f.x, f.y)) continue;
        const x = f.follow ? f.follow.x : f.x, y = f.follow ? f.follow.y + (f.y - f.follow.y) : f.y;
        const add = !!f.add;
        if (add) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        const m = AW.Data.gfx && AW.Data.gfx['fx/' + f.kind];
        const nFr = m && m.anims[0] ? m.anims[0].f.length : 1;
        let fr = Math.floor(Math.max(0, f.t) * 15);
        if (f.kind === 'grdym3' || f.kind === 'dymziemia') fr = Math.min(nFr - 1, fr);
        if (fr < nFr || f.loop) this.drawGfx('fx/' + f.kind, 0, fr, x, y, add ? 2 : 1, { alpha: f.kind === 'grdym3' ? Math.min(0.8, (f.life - f.t) / 2) : 1 });
        if (add) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      for (const g of W.gfx) {
        if (!g.visible || !g.meta || g.mode !== 'add') continue;
        this.drawGfx(g.key, g.anim, g.frame, g.x, g.y, 2, {});
      }
      this.drawLines(W);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (W.rain) this.drawRain(W);
    }

    drawActor(a, band0, band, W, ui) {
      if (a.crate) {
        const key = 'przedmioty/skrzynka_' + (['n', 'e', 'e', 'e', 's', 'w', 'w', 'w'][a.dir] || 'e');
        this.drawGfx(key, 0, a.boxOpened ? 0 : 1, a.x, a.y, 1, { band0, occlude: true, feet: a.y + 20 });
        return;
      }
      const fi = a.frameInfo();
      const px = a.x + fi.off[0], py = a.y + fi.off[1];
      let parts = [];
      let ok = true;
      for (const p of fi.parts) {
        const rec = this.texture(this.sheetRel(p.key));
        if (!rec) { ok = false; break; }
        parts.push({ rec, f: p.f });
      }
      if (!ok || !parts.length) {
        const last = this.lastParts.get(a);
        if (!last) return;
        parts = last.parts;
        if (parts.some(p => !p.rec.ready || !p.rec.t)) return;
      } else this.lastParts.set(a, { parts, dx: 0 });
      const isHero = a === W.hero;
      const hover = ui && ui.hoverActor === a;
      const tint = a.hitFlash > 0 ? [1, 0.2, 0.2, 0.45] : hover ? [1, 1, 0.7, 0.18] : null;
      const opts = { occlude: true, feet: a.y, ghost: isHero || a.team === 1, band0, band, tint };
      this.mode(0, opts);
      for (const p of parts) {
        const f = p.f;
        this.gl.uniform1f(this.prog.u.u_zbase, f[6]);
        this.gl.uniform1f(this.prog.u.u_zf, f[7]);
        this.quad(p.rec, f[0], f[1], f[2], f[3], px - f[4], py - f[5], f[2], f[3]);
      }
    }

    drawLines(W) {
      const gl = this.gl;
      const pts = [];
      for (const f of W.fx) {
        if (f.kind !== 'tracer') continue;
        pts.push(f.x, f.y, f.tx, f.ty);
      }
      if (!pts.length) return;
      gl.useProgram(this.line.p);
      gl.bindVertexArray(this.lineVao);
      gl.uniform2f(this.line.u.u_cam, this.cam[0], this.cam[1]);
      gl.uniform2f(this.line.u.u_view, this.view[0], this.view[1]);
      gl.uniform4f(this.line.u.u_color, 1, 0.9, 0.55, 0.55);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.LINES, 0, pts.length / 2);
      gl.useProgram(this.prog.p);
      gl.bindVertexArray(this.vao);
    }

    drawRain(W) {
      const gl = this.gl;
      if (this.rain.length < 260) for (let i = 0; i < 20; i++) this.rain.push({ x: Math.random() * 900, y: Math.random() * 600, v: 700 + Math.random() * 300 });
      const pts = [];
      const dt = 1 / 60;
      for (const r of this.rain) {
        r.y += r.v * dt;
        r.x -= r.v * dt * 0.18;
        if (r.y > 600) { r.y = -20; r.x = Math.random() * 900; }
        pts.push(this.cam[0] + r.x, this.cam[1] + r.y, this.cam[0] + r.x + 3, this.cam[1] + r.y - 16);
      }
      gl.useProgram(this.line.p);
      gl.bindVertexArray(this.lineVao);
      gl.uniform2f(this.line.u.u_cam, this.cam[0], this.cam[1]);
      gl.uniform2f(this.line.u.u_view, this.view[0], this.view[1]);
      gl.uniform4f(this.line.u.u_color, 0.7, 0.75, 0.85, 0.35);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.LINES, 0, pts.length / 2);
      gl.useProgram(this.prog.p);
      gl.bindVertexArray(this.vao);
    }

    destroy() {
      const gl = this.gl;
      for (const r of this.tex.values()) if (r.t) gl.deleteTexture(r.t);
      this.tex.clear();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  };
})(globalThis.AW = globalThis.AW || {});
