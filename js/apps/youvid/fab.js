(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac, mesh } = K;
  const Cast = window.FabCast;
  const World = window.FabWorld;
  const Art = window.FabArt;
  const Script = window.FabScript;

  const ENVS = {
    kart: { sunDir: [-0.35, -0.8, -0.45], sunColor: [0.5, 0.48, 0.42], ambTop: [0.86, 0.88, 0.94], ambBottom: [0.52, 0.5, 0.46], fogColor: [0.53, 0.74, 0.92], fogNear: 80, fogFar: 220 },
    red: { sunDir: [-0.2, -0.9, -0.3], sunColor: [0.3, 0.26, 0.24], ambTop: [0.95, 0.86, 0.82], ambBottom: [0.58, 0.4, 0.36], fogColor: [0.25, 0.08, 0.06], fogNear: 30, fogFar: 60, points: [{ pos: [0, 3.6, 0], color: [0.4, 0.3, 0.26] }] },
    blu: { sunDir: [-0.2, -0.9, -0.3], sunColor: [0.28, 0.28, 0.3], ambTop: [0.86, 0.9, 1.0], ambBottom: [0.45, 0.5, 0.62], fogColor: [0.1, 0.15, 0.3], fogNear: 30, fogFar: 60, points: [{ pos: [0, 3.6, 0], color: [0.3, 0.32, 0.36] }] },
    dust: { sunDir: [-0.5, -0.6, -0.4], sunColor: [0.55, 0.48, 0.38], ambTop: [0.7, 0.72, 0.78], ambBottom: [0.45, 0.4, 0.34], fogColor: [0.62, 0.64, 0.68], fogNear: 30, fogFar: 150 },
    dark: { sunDir: [0.2, -0.9, -0.3], sunColor: [0.22, 0.2, 0.15], ambTop: [0.2, 0.18, 0.15], ambBottom: [0.05, 0.05, 0.045], fogColor: [0.035, 0.032, 0.028], fogNear: 7, fogFar: 26, points: [{ pos: [0, 3.0, 1.6], color: [1.7, 1.5, 1.05] }] },
    board: { sunDir: [-0.3, -0.6, -0.7], sunColor: [0.42, 0.38, 0.34], ambTop: [0.86, 0.82, 0.8], ambBottom: [0.5, 0.42, 0.4], fogColor: [0.36, 0.2, 0.18], fogNear: 40, fogFar: 80 },
    night: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.2, 0.22, 0.32], ambTop: [0.36, 0.4, 0.55], ambBottom: [0.16, 0.16, 0.22], fogColor: [0.08, 0.09, 0.16], fogNear: 40, fogFar: 140 },
    burn: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.5, 0.3, 0.1], ambTop: [0.5, 0.32, 0.2], ambBottom: [0.3, 0.1, 0.05], fogColor: [0.18, 0.06, 0.04], fogNear: 20, fogFar: 90 },
    void: { sunDir: [-0.4, -0.8, -0.4], sunColor: [0.5, 0.48, 0.42], ambTop: [0.8, 0.84, 0.88], ambBottom: [0.4, 0.44, 0.46], fogColor: [0.235, 0.33, 0.345], fogNear: 200, fogFar: 400 },
    lair: { sunDir: [-0.2, -0.9, -0.3], sunColor: [0.16, 0.2, 0.34], ambTop: [0.5, 0.6, 1.0], ambBottom: [0.32, 0.4, 0.82], fogColor: [0.05, 0.08, 0.24], fogNear: 30, fogFar: 70, points: [{ pos: [0, 5, 0], color: [0.3, 0.42, 1.0] }] },
    game: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.35, 0.36, 0.36], ambTop: [0.72, 0.74, 0.74], ambBottom: [0.42, 0.44, 0.44], fogColor: [0.3, 0.32, 0.33], fogNear: 30, fogFar: 90 },
    gameNight: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.22, 0.23, 0.27], ambTop: [0.5, 0.53, 0.6], ambBottom: [0.22, 0.23, 0.27], fogColor: [0.14, 0.15, 0.18], fogNear: 40, fogFar: 120 },
    recap: { sunDir: [-0.3, -0.7, -0.6], sunColor: [0.6, 0.5, 0.3], ambTop: [0.9, 0.85, 0.7], ambBottom: [0.5, 0.6, 0.9], fogColor: [0.72, 0.78, 0.92], fogNear: 40, fogFar: 140 },
    bluLock: { sunDir: [-0.2, -0.9, -0.3], sunColor: [0.28, 0.28, 0.3], ambTop: [0.86, 0.9, 1.0], ambBottom: [0.45, 0.5, 0.62], fogColor: [0.1, 0.15, 0.3], fogNear: 30, fogFar: 60, points: [{ pos: [0, 3.6, 0], color: [0.3, 0.32, 0.36] }] },
    redNight: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.2, 0.22, 0.32], ambTop: [0.4, 0.42, 0.56], ambBottom: [0.18, 0.18, 0.24], fogColor: [0.08, 0.09, 0.16], fogNear: 40, fogFar: 140, points: [{ pos: [120, 3.2, 116], color: [1.4, 0.7, 0.6] }] }
  };

  const FX_TEX = {
    flame(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h * 0.58, 0, w / 2, h * 0.52, w * 0.5);
      g.addColorStop(0, 'rgb(255,246,200)');
      g.addColorStop(0.25, 'rgb(255,190,70)');
      g.addColorStop(0.55, 'rgb(200,80,20)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    glow(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      g.addColorStop(0, 'rgb(255,255,255)');
      g.addColorStop(0.35, 'rgb(150,150,150)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    puff(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    spark(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      g.addColorStop(0, 'rgb(255,255,235)');
      g.addColorStop(0.2, 'rgb(255,215,110)');
      g.addColorStop(0.5, 'rgb(120,60,10)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    blood(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const g = rand(4);
      ctx.fillStyle = '#7a0806';
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.ellipse(w / 2 + (g() - 0.5) * w * 0.6, h / 2 + (g() - 0.5) * h * 0.6, w * (0.05 + g() * 0.14), h * (0.05 + g() * 0.12), g() * PI, 0, PI * 2);
        ctx.fill();
      }
    }
  };

  function billboard(p, s, cam, spin) {
    const view = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(view, [0, 1, 0]);
    if (V3.len(right) < 1e-4) right = [1, 0, 0];
    right = V3.norm(right);
    let up = V3.cross(right, view);
    if (spin) {
      const c = C(spin), sn = S(spin);
      const r2 = V3.add(V3.mul(right, c), V3.mul(up, sn));
      up = V3.add(V3.mul(up, c), V3.mul(right, -sn));
      right = r2;
    }
    const sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s;
    const o = V3.sub(p, V3.add(V3.mul(right, sx / 2), V3.mul(up, sy / 2)));
    return new Float32Array([right[0] * sx, right[1] * sx, right[2] * sx, 0, up[0] * sy, up[1] * sy, up[2] * sy, 0, -view[0], -view[1], -view[2], 0, o[0], o[1], o[2], 1]);
  }

  function project(vp, p, W, H) {
    const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
    const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
    const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    if (w <= 0.01) return null;
    return [(x / w * 0.5 + 0.5) * W, (1 - (y / w * 0.5 + 0.5)) * H];
  }

  function cameraOf(c) {
    const cam = Object.assign({ near: 0.05, far: 400, fov: 50 }, c);
    if (c.shake) {
      const w = K.wobble(c.shakeT || 0, c.shake, 3);
      cam.eye = V3.add(c.eye, w);
      cam.at = V3.add(c.at, V3.mul(w, 0.6));
    }
    if (c.roll) {
      const view = V3.norm(V3.sub(cam.at, cam.eye));
      let right = V3.cross(view, [0, 1, 0]);
      if (V3.len(right) < 1e-4) right = [1, 0, 0];
      right = V3.norm(right);
      const up = V3.cross(right, view);
      cam.up = V3.add(V3.mul(up, C(c.roll)), V3.mul(right, S(c.roll)));
    }
    return cam;
  }

  function create(r) {
    const P = Cast.build(r);
    const W = World.build(r);
    const tex = {};
    const fxTex = {};
    const ov = K.overlay(r, 960, 540);
    const quad = ov.quad;
    const ball = mesh(r, b => b.ellipsoid(1, 1, 1, 12, 8, rgb(0xffffff, 1)));
    const frame = r.frameTexture();
    const cw = r.canvas.width, ch = r.canvas.height;
    const live = {};
    const liveTex = (key, u) => {
      const gl = r.gl;
      let L = live[key];
      if (!L) {
        const cv = document.createElement('canvas');
        const sz = Art.LIVE_SIZE[key] || [512, 288];
        cv.width = sz[0];
        cv.height = sz[1];
        L = live[key] = { cv, ctx: cv.getContext('2d'), tex: gl.createTexture(), u: null };
        gl.bindTexture(gl.TEXTURE_2D, L.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      if (L.u !== u) {
        L.u = u;
        Art.LIVE[key](L.ctx, L.cv.width, L.cv.height, u);
        gl.bindTexture(gl.TEXTURE_2D, L.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L.cv);
      }
      return L.tex;
    };
    const ft = (k) => {
      if (!fxTex[k]) fxTex[k] = r.texture(64, FX_TEX[k], { clamp: true });
      return fxTex[k];
    };
    const card = (texture, x, y, w, h, o) => {
      const opts = Object.assign({ texture, noFog: true }, o || {});
      if (opts.alpha !== undefined && opts.alpha < 1) opts.blend = true;
      if (o && o.rot) {
        const M = M4.chain(M4.translate(x + w / 2, y + h / 2, 0), M4.rotZ(-o.rot), M4.translate(-w / 2, h / 2, 0), M4.scale(w, -h, 1));
        r.draw(quad, M, opts);
      } else ov.rect(x, y, w, h, opts);
    };

    function drawFx(list, cam) {
      list.forEach(f => {
        const u = f.u || 0;
        const g = rand(f.seed || 7);
        if (f.kind === 'fire') {
          const n = f.n || 14;
          for (let i = 0; i < n; i++) {
            const ph = frac(u * (f.rate || 1.6) + i / n + g() * 0.3);
            const ox = (g() - 0.5) * (f.w || 0.6), oz = (g() - 0.5) * (f.d || 0.6);
            const dir = f.dir || [0, 1, 0];
            const len = f.h || 1.2;
            const p = V3.add(V3.add(f.p, [ox, 0, oz]), V3.mul(dir, ph * len));
            const s = (f.s || 0.5) * (0.6 + S(ph * PI) * 0.8) * (1 - ph * 0.3);
            r.draw(quad, billboard(V3.add(p, [0, 0, 0]), s, cam, g() * 6), { texture: ft('flame'), additive: true, alpha: (f.alpha || 0.9) * (1 - ph * 0.6), noFog: true });
          }
        } else if (f.kind === 'boom') {
          const k = clamp(u / (f.dur || 0.8), 0, 1);
          const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
          r.draw(ball, M4.chain(M4.translate(f.p[0], f.p[1], f.p[2]), M4.scale(R * 0.55, R * 0.55, R * 0.55)), { tint: [1, lerp(0.75, 0.35, k), lerp(0.3, 0.08, k)], additive: true, alpha: 0.45 * (1 - k), noFog: true });
          for (let i = 0; i < 26; i++) {
            const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
            const d = [C(a) * C(e), S(e) + 0.25, S(a) * C(e)];
            const p = V3.add(f.p, V3.mul(d, R * (0.15 + g() * 0.6)));
            r.draw(quad, billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), cam, g() * 6), { texture: ft('flame'), additive: true, alpha: (0.3 + g() * 0.35) * (1 - k), noFog: true });
          }
          for (let i = 0; i < 12; i++) {
            const a = g() * PI * 2;
            const p = V3.add(f.p, [C(a) * R * 0.7, R * 0.3 + k * R * 1.2, S(a) * R * 0.7]);
            r.draw(quad, billboard(p, R * (0.8 + k * 0.8), cam, g() * 6), { texture: ft('puff'), tint: [0.32, 0.29, 0.26], blend: true, alpha: 0.65 * Math.min(1, k * 3) * (1 - k), noFog: true });
          }
          for (let i = 0; i < 22; i++) {
            const a = g() * PI * 2, e = g() * 1.2;
            const d = [C(a) * C(e), S(e), S(a) * C(e)];
            const p = V3.add(f.p, V3.add(V3.mul(d, k * (f.s || 1.5) * 3 * (0.5 + g())), [0, -k * k * 2, 0]));
            r.draw(quad, billboard(p, 0.09, cam), { texture: ft('spark'), additive: true, alpha: 1 - k, noFog: true });
          }
        } else if (f.kind === 'smoke') {
          const n = f.n || 12;
          for (let i = 0; i < n; i++) {
            const a = g() * PI * 2;
            const k = clamp(u / (f.dur || 2), 0, 1);
            const rr = (f.s || 1) * (0.3 + g() * 0.7) * (0.4 + k);
            const p = V3.add(f.p, [C(a) * rr * 0.6, rr * 0.5 + g() * (f.s || 1) * 0.6, S(a) * rr * 0.6]);
            r.draw(quad, billboard(p, (f.s || 1) * (0.5 + g() * 0.5) * (0.6 + k), cam, g() * 6), { texture: ft('puff'), tint: f.col || [0.95, 0.95, 0.95], blend: true, alpha: (f.alpha || 0.9) * (1 - k * 0.7), noFog: true });
          }
        } else if (f.kind === 'blood') {
          const k = clamp(u / (f.dur || 0.6), 0, 1);
          for (let i = 0; i < (f.n || 12); i++) {
            const a = g() * PI * 2, e = (g() - 0.2) * 1.2;
            const d = V3.norm(V3.add([C(a) * C(e), S(e), S(a) * C(e)], f.dir || [0, 0, 0]));
            const p = V3.add(f.p, V3.add(V3.mul(d, k * (f.s || 0.6) * (0.4 + g())), [0, -k * k * 0.8, 0]));
            r.draw(quad, billboard(p, (f.size || 0.12) * (0.6 + g()), cam, g() * 6), { texture: ft('blood'), blend: true, alpha: 1 - k * 0.6, noFog: true });
          }
        } else if (f.kind === 'shards') {
          for (let i = 0; i < (f.n || 30); i++) {
            const a = g() * PI * 2, e = (g() - 0.3) * 1.4;
            const d = [C(a) * C(e), S(e), S(a) * C(e)];
            const sp = (f.s || 3) * (0.4 + g());
            const p = V3.add(f.p, [d[0] * sp * u, d[1] * sp * u - 4.9 * u * u, d[2] * sp * u]);
            r.draw(quad, billboard(p, [0.12 + g() * 0.2, 0.08 + g() * 0.15], cam, g() * 6 + u * 8), { tint: [0.6, 0.8, 0.9], blend: true, alpha: 0.7, noFog: true });
          }
        } else if (f.kind === 'spray') {
          for (let i = 0; i < 14; i++) {
            const ph = frac(u * 2 + i / 14);
            const p = V3.add(f.p, [(g() - 0.5) * 0.2, (g() - 0.3) * 0.15 - ph * 0.1, (g() - 0.5) * 0.2]);
            r.draw(quad, billboard(p, 0.025 + g() * 0.03, cam), { texture: ft('puff'), tint: f.col || [0.75, 0.85, 0.7], blend: true, alpha: 0.85 * (1 - ph), noFog: true });
          }
        } else if (f.kind === 'sparks') {
          for (let i = 0; i < (f.n || 10); i++) {
            const ph = frac(u * 3 + i / (f.n || 10));
            const a = g() * PI - PI / 2;
            const p = V3.add(f.p, [S(a) * ph * 0.8, ph * 0.5 - ph * ph * 0.6, -C(a) * ph * 0.8]);
            r.draw(quad, billboard(p, [0.12, 0.03], cam, a), { texture: ft('spark'), additive: true, alpha: 1 - ph, noFog: true });
          }
        } else if (f.kind === 'sprite') {
          const o = { texture: Art.tex(r, tex, f.tex), noFog: true };
          if (f.alpha !== undefined && f.alpha < 1) { o.blend = true; o.alpha = f.alpha; }
          if (f.additive) { o.additive = true; o.alpha = f.alpha === undefined ? 1 : f.alpha; delete o.blend; }
          if (f.tint) o.tint = f.tint;
          r.draw(quad, billboard(f.p, f.s || 1, cam, f.spin || 0), o);
        } else if (f.kind === 'glow') {
          r.draw(quad, billboard(f.p, f.s || 2, cam), { texture: ft('glow'), tint: f.col || [1, 0.9, 0.7], additive: true, alpha: f.alpha || 0.4, noFog: true });
        } else if (f.kind === 'muzzle') {
          r.draw(quad, billboard(f.p, (f.s || 0.3) * (0.7 + g() * 0.6), cam, u * 40), { texture: ft('spark'), additive: true, alpha: 1, noFog: true });
        } else if (f.kind === 'tracer') {
          const d = V3.sub(f.b, f.a);
          const len = V3.len(d);
          const steps = Math.ceil(len / 0.4);
          for (let i = 0; i < steps; i++) {
            const p = V3.add(f.a, V3.mul(d, (i + frac(u * 9)) / steps));
            r.draw(quad, billboard(p, 0.06, cam), { texture: ft('spark'), additive: true, alpha: 0.8, noFog: true });
          }
        }
      });
    }

    function drawActors(list, cam) {
      list.forEach(a => {
        const m = Cast.solve(a.cls, a.pose);
        Cast.draw(r, P, a, m, a.drawOpts);
        if (a.shadow !== false && a.pose.p[1] < 2.5) {
          const sh = M4.chain(M4.translate(a.pose.p[0], 0.02, a.pose.p[2]), M4.rotX(-PI / 2), M4.scale(0.45, 0.45, 1));
          r.draw(quad, M4.chain(sh, M4.translate(-0.5, -0.5, 0)), { texture: ft('puff'), tint: [0, 0, 0], blend: true, alpha: 0.28, noFog: true });
        }
      });
    }

    function drawProps(list) {
      list.forEach(pr => {
        const sc = pr.sc || [pr.s || 1, pr.s || 1, pr.s || 1];
        const M = pr.M || M4.chain(M4.translate(pr.at[0], pr.at[1], pr.at[2]), M4.rotY(pr.yaw || 0), M4.rotX(pr.pitch || 0), M4.rotZ(pr.roll || 0), M4.scale(sc[0], sc[1], sc[2]));
        const ms = Cast.PROPS[pr.kind] ? Cast.propMesh(P, pr.kind) : Cast.GUNS[pr.kind] ? Cast.gunMesh(P, pr.kind) : null;
        if (!ms) return;
        if (pr.tex) {
          const parts = Cast.propParts(P, pr.kind);
          r.draw(parts.body, M, pr.opts || {});
          r.draw(parts.label, M, Object.assign({ texture: Art.tex(r, tex, pr.tex) }, pr.opts || {}));
        } else r.draw(ms, M, pr.opts || {});
      });
    }

    function drawHud(st, vp) {
      const h = st.hud;
      if (!h) return;
      if (h.timer) card(Art.hud(r, tex, h.timer, h.team || 'red'), 420, 6, 160, 40);
      (h.chat || []).forEach((line, i) => card(Art.chat(r, tex, line), 280, 330 + i * 18, 400, 24));
      (h.bubbles || []).forEach(bb => {
        const q = bb.screen || (vp && project(vp, bb.at, 960, 540));
        if (q) card(Art.tex(r, tex, bb.kind || 'medic'), q[0] - (bb.size || 34) / 2, q[1] - (bb.size || 34), bb.size || 34, bb.size || 34);
      });
    }

    return {
      warm() {
        World.warm(r, W, ['kart', 'red', 'blu']);
      },
      render(t) {
        const st = Script.stage(t);
        let vp = null;
        let polys = 0;
        if (st.set) {
          const env = Object.assign({}, ENVS[st.env || st.set] || ENVS.kart, st.envOver || {});
          const cam = cameraOf(st.camera);
          cam.grade = st.grade || [1, 1, 1, 0];
          cam.colorM = st.colorM;
          cam.colorAdd = st.colorAdd;
          cam.fx = { grain: st.grain || 0.012, vignette: st.vignette === undefined ? 0.2 : st.vignette, time: t };
          r.begin(env, cam);
          vp = r.viewProj;
          World.draw(r, W, st.set, st.worldOpts);
          drawProps(st.props || []);
          drawActors(st.actors || [], cam);
          drawFx(st.fx || [], cam);
          polys = r.polys;
        } else {
          r.clear(st.bg || [0, 0, 0]);
        }
        const post = st.post || {};
        if (post.zoom) {
          r.grab(frame, 0, 0, cw, ch);
          ov.begin();
          for (let i = 1; i <= 4; i++) {
            const k = 1 + post.zoom * i * 0.06;
            const cx = (post.zx === undefined ? 0.5 : post.zx) * 960, cy = (post.zy === undefined ? 0.5 : post.zy) * 540;
            r.draw(quad, M4.chain(M4.translate(cx - cx * k, cy - cy * k + 540 * k, 0), M4.scale(960 * k, -540 * k, 1)), { texture: frame, blend: true, alpha: 0.35, noFog: true });
          }
        }
        ov.begin();
        const drawCard = c => {
          const tx = c.texture || (c.live ? liveTex(c.live, c.u || 0) : c.tex ? Art.tex(r, tex, c.tex) : null);
          card(tx, c.x === undefined ? 0 : c.x, c.y === undefined ? 0 : c.y, c.w === undefined ? 960 : c.w, c.h === undefined ? 540 : c.h, { alpha: c.alpha, rot: c.rot, tint: c.tint, uvScroll: c.uvScroll, flat: c.flat, additive: c.additive });
        };
        (st.cards || []).filter(c => !c.top).forEach(drawCard);
        if (post.tv) {
          for (let i = 0; i < 9; i++) {
            const d = i * 9, o = { flat: [0, 0, 0, 1], alpha: post.tv * Math.pow(1 - i / 9, 1.6) * 0.85, blend: true };
            ov.rect(d, d, 960 - 2 * d, 9, o);
            ov.rect(d, 540 - d - 9, 960 - 2 * d, 9, o);
            ov.rect(d, d + 9, 9, 540 - 2 * d - 18, o);
            ov.rect(960 - d - 9, d + 9, 9, 540 - 2 * d - 18, o);
          }
          card(Art.tex(r, tex, 'tvScan'), 0, 0, 960, 540, { alpha: 0.14 * post.tv });
        }
        (st.cards || []).filter(c => c.top).forEach(drawCard);
        drawHud(st, vp);
        if (post.flash) ov.rect(0, 0, 960, 540, { flat: [1, 1, 1, 1], alpha: clamp(post.flash, 0, 1), blend: true });
        if (post.black) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(post.black, 0, 1), blend: true });
        if (post.tint) ov.rect(0, 0, 960, 540, { flat: [post.tint[0], post.tint[1], post.tint[2], 1], alpha: post.tint[3], blend: true });
        return { polys: Math.round(polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Team Fabulous 2.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.voiceAt,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
