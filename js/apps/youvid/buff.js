(function () {
  const { rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp } = K;
  const Art = window.BuffArt;
  const Hall = window.BuffHall;
  const Cast = window.BuffCast;
  const Script = window.BuffScript;

  const VS = `
attribute vec2 aPos;
uniform vec2 uCanvas;
uniform vec4 uDst;
uniform float uRot;
uniform vec4 uSrc;
varying vec2 vUv;
void main() {
  vUv = uSrc.xy + aPos * uSrc.zw;
  vec2 d = (aPos * 2.0 - 1.0) * uDst.zw;
  float c = cos(uRot), s = sin(uRot);
  vec2 p = uDst.xy + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  gl_Position = vec4(p.x / uCanvas.x * 2.0 - 1.0, 1.0 - p.y / uCanvas.y * 2.0, 0.0, 1.0);
}`;

  const FS_BLIT = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uRad;
uniform vec2 uDir;
uniform vec4 uTint;
varying vec2 vUv;
void main() {
  vec3 c = vec3(0.0);
  if (uDir.x != 0.0 || uDir.y != 0.0) {
    for (int i = 0; i < 12; i++) {
      c += texture2D(uTex, vUv + uDir * (float(i) / 11.0 - 0.5)).rgb;
    }
    c /= 12.0;
  } else if (uRad > 0.0) {
    c = texture2D(uTex, vUv).rgb * 0.2;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      vec2 o = vec2(cos(a), sin(a)) * uTexel * uRad;
      c += texture2D(uTex, vUv + o).rgb * 0.06 + texture2D(uTex, vUv + o * 0.5).rgb * 0.04;
    }
  } else {
    c = texture2D(uTex, vUv).rgb;
  }
  gl_FragColor = vec4(c * uTint.rgb, uTint.a);
}`;

  const FS_GLOW = `
precision mediump float;
uniform sampler2D uMask;
uniform sampler2D uNear;
uniform sampler2D uFar;
uniform vec2 uNearTexel;
uniform vec2 uFarTexel;
uniform float uTime;
uniform float uK;
uniform float uAsp;
varying vec2 vUv;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float blur9(sampler2D t, vec2 uv, vec2 px) {
  float s = texture2D(t, uv).r * 0.25;
  s += (texture2D(t, uv + vec2(px.x, 0.0)).r + texture2D(t, uv - vec2(px.x, 0.0)).r + texture2D(t, uv + vec2(0.0, px.y)).r + texture2D(t, uv - vec2(0.0, px.y)).r) * 0.125;
  s += (texture2D(t, uv + px).r + texture2D(t, uv - px).r + texture2D(t, uv + vec2(px.x, -px.y)).r + texture2D(t, uv + vec2(-px.x, px.y)).r) * 0.0625;
  return s;
}
void main() {
  vec2 q = vec2(vUv.x * uAsp, vUv.y) * 18.0;
  vec2 w = vec2(vnoise(q + vec2(0.0, -uTime * 2.6)), vnoise(q + vec2(4.3, -uTime * 3.1))) - 0.5;
  float m = texture2D(uMask, vUv).r;
  float n = blur9(uNear, vUv + w * uNearTexel * 1.8, uNearTexel);
  float f = blur9(uFar, vUv + w * uFarTexel * 0.9, uFarTexel);
  float outer = 1.0 - m;
  float flick = 0.82 + 0.34 * vnoise(q * 0.55 + vec2(uTime * 1.3, -uTime * 3.4));
  float core = smoothstep(0.02, 0.36, n) * outer;
  float hot = smoothstep(0.22, 0.5, n) * outer;
  float rim = m * (1.0 - smoothstep(0.5, 0.96, n));
  vec3 col = vec3(1.0, 0.86, 0.3) * core * 1.25 * flick + vec3(1.0, 1.0, 0.85) * hot * 0.7 + vec3(1.0, 0.95, 0.7) * rim * 0.7 * flick;
  col += vec3(1.0, 0.7, 0.12) * smoothstep(0.0, 0.5, f) * outer * 1.05 * flick;
  col += vec3(0.6, 0.3, 0.04) * smoothstep(0.0, 0.16, f) * outer * 0.55;
  gl_FragColor = vec4(col * uK, 1.0);
}`;

  const FS_SPRITE = `
precision mediump float;
uniform sampler2D uTex;
uniform vec4 uTint;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uTex, vUv);
  gl_FragColor = vec4(t.rgb * uTint.rgb, t.a * uTint.a);
}`;

  function makePost(r) {
    const gl = r.gl;
    const mk = (fs, names) => {
      const p = r.program(VS, fs);
      const u = {};
      ['uCanvas', 'uDst', 'uRot', 'uSrc'].concat(names).forEach(n => { u[n] = gl.getUniformLocation(p, n); });
      return { p, u, aPos: gl.getAttribLocation(p, 'aPos') };
    };
    const P = {
      blit: mk(FS_BLIT, ['uTex', 'uTexel', 'uRad', 'uDir', 'uTint']),
      glow: mk(FS_GLOW, ['uMask', 'uNear', 'uFar', 'uNearTexel', 'uFarTexel', 'uTime', 'uK', 'uAsp']),
      sprite: mk(FS_SPRITE, ['uTex', 'uTint'])
    };
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    const use = (prog, x, y, w, h, rot, src) => {
      gl.useProgram(prog.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(prog.aPos);
      gl.vertexAttribPointer(prog.aPos, 2, gl.FLOAT, false, 8, 0);
      gl.uniform2f(prog.u.uCanvas, r.canvas.width, r.canvas.height);
      gl.uniform4f(prog.u.uDst, x + w / 2, y + h / 2, w / 2, h / 2);
      gl.uniform1f(prog.u.uRot, rot || 0);
      const s = src || [0, 1, 1, -1];
      gl.uniform4f(prog.u.uSrc, s[0], s[1], s[2], s[3]);
    };
    const blend = (mode) => {
      if (!mode) {
        gl.disable(gl.BLEND);
        return;
      }
      gl.enable(gl.BLEND);
      if (mode === 'add') gl.blendFunc(gl.ONE, gl.ONE);
      else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    };
    const bind = (unit, tex, loc) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc, unit);
    };
    return {
      begin(box) {
        gl.viewport(0, 0, r.canvas.width, r.canvas.height);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(box.x, r.canvas.height - box.top - box.h, box.w, box.h);
      },
      blit(tex, x, y, w, h, o) {
        const opt = o || {};
        use(P.blit, x, y, w, h, 0, opt.src);
        bind(0, tex, P.blit.u.uTex);
        gl.uniform2f(P.blit.u.uTexel, 1 / (opt.tw || w), 1 / (opt.th || h));
        gl.uniform1f(P.blit.u.uRad, opt.rad || 0);
        gl.uniform2f(P.blit.u.uDir, opt.dir ? opt.dir[0] : 0, opt.dir ? opt.dir[1] : 0);
        const t = opt.tint || [1, 1, 1];
        gl.uniform4f(P.blit.u.uTint, t[0], t[1], t[2], opt.alpha === undefined ? 1 : opt.alpha);
        blend(opt.blend);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      glow(F, x, y, w, h, o) {
        use(P.glow, x, y, w, h, 0);
        bind(0, F.mask, P.glow.u.uMask);
        bind(1, F.m4, P.glow.u.uNear);
        bind(2, F.m16, P.glow.u.uFar);
        gl.uniform2f(P.glow.u.uNearTexel, 1 / o.near[0], 1 / o.near[1]);
        gl.uniform2f(P.glow.u.uFarTexel, 1 / o.far[0], 1 / o.far[1]);
        gl.uniform1f(P.glow.u.uTime, o.time);
        gl.uniform1f(P.glow.u.uK, o.k);
        gl.uniform1f(P.glow.u.uAsp, w / h);
        blend('add');
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      sprite(tex, cx, cy, hw, hh, rot, tint, alpha) {
        use(P.sprite, cx - hw, cy - hh, hw * 2, hh * 2, rot);
        bind(0, tex, P.sprite.u.uTex);
        gl.uniform4f(P.sprite.u.uTint, tint[0], tint[1], tint[2], alpha);
        blend('alpha');
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      end() {
        gl.disable(gl.BLEND);
        gl.disable(gl.SCISSOR_TEST);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.activeTexture(gl.TEXTURE0);
        gl.useProgram(r.prog);
      }
    };
  }

  const ENV_KNIGHT = {
    sunDir: [0.42, -0.5, -1],
    sunColor: [0.6, 0.55, 0.5],
    ambTop: [0.55, 0.5, 0.48],
    ambBottom: [0.22, 0.17, 0.17],
    fogColor: [0.05, 0.02, 0.03],
    fogNear: 14,
    fogFar: 34,
    points: [
      { pos: [-1.1, 2.3, -1.3], color: [0.62, 0.48, 0.3] },
      { pos: [1.2, 1.2, 2.2], color: [0.2, 0.17, 0.16] }
    ]
  };

  const ENV_BARD = {
    sunDir: [-0.4, -0.5, 1],
    sunColor: [0.64, 0.62, 0.6],
    ambTop: [0.6, 0.58, 0.56],
    ambBottom: [0.22, 0.17, 0.17],
    fogColor: [0.05, 0.02, 0.03],
    fogNear: 14,
    fogFar: 34,
    points: [
      { pos: [0.9, 2.4, 5.0], color: [0.3, 0.24, 0.2] },
      { pos: [-1.2, 1.3, 1.4], color: [0.22, 0.19, 0.17] }
    ]
  };

  const ENV_BOSS = {
    sunDir: [0.55, -0.6, -0.9],
    sunColor: [1.05, 0.92, 0.72],
    ambTop: [0.34, 0.3, 0.27],
    ambBottom: [0.12, 0.09, 0.08],
    fogColor: [0.05, 0.02, 0.03],
    fogNear: 14,
    fogFar: 34,
    points: [
      { pos: [-1.0, 2.6, -1.4], color: [0.9, 0.7, 0.42] },
      { pos: [1.4, 1.0, 2.6], color: [0.22, 0.2, 0.18] }
    ]
  };

  const ENV_MASK = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 100, fogFar: 200 };

  const GRADE = [1.0, 0.99, 0.97, 0.05];

  function create(r) {
    const W = Hall.build(r);
    const P = Cast.build(r);
    const post = makePost(r);
    const ov = K.overlay(r, r.canvas.width || 480, r.canvas.height || 360);
    const F = {};
    ['mask', 'm2', 'm4', 'm8', 'm16', 'bg', 'bg2', 'frame'].forEach(k => { F[k] = r.frameTexture(false); });
    const dustTex = [r.texture(128, Art.dust(3)), r.texture(128, Art.dust(8)), r.texture(128, Art.dust(14))];
    const caps = {};
    const capTex = (lines, px, w) => {
      const key = lines.join('|') + ':' + px + ':' + w;
      if (!caps[key]) {
        const lead = Math.round(px * 1.32);
        const h = Math.ceil(px * 1.5 + lead * (lines.length - 1) + px * 0.4);
        caps[key] = { tex: r.texture(w, Art.captionDrawer(lines, px, lead), { height: h, clamp: true }), w, h, lead };
      }
      return caps[key];
    };
    const g = rand(41);
    const PUFFS = [];
    for (let i = 0; i < 38; i++) {
      const a = -PI * 0.08 - g() * PI * 0.6;
      PUFFS.push({ delay: g() * 0.1, ang: a, speed: 0.4 + g() * 0.8, size: 0.15 + g() * 0.24, grow: 0.5 + g() * 0.8, rot: g() * PI * 2, spin: (g() - 0.5) * 0.8, tex: i % 3, y0: 0.62 + g() * 0.34, x0: 0.42 + g() * 0.48, shade: 0.64 + g() * 0.2, fade: 0.2 + g() * 0.45 });
    }

    function down(src, sw, sh, dst, box) {
      const w = Math.max(1, Math.floor(sw / 2)), h = Math.max(1, Math.floor(sh / 2));
      post.blit(src, box.x, box.top, w, h, { tw: sw, th: sh });
      r.grab(dst, box.x, r.canvas.height - box.top - h, w, h);
      return [w, h];
    }

    function actors(st) {
      const list = [];
      if (st.knight) list.push(['knight', st.knight]);
      if (st.bard) list.push(['bard', st.bard]);
      return list.map(([who, pose]) => ({ who, pose, m: Cast.solve(pose) }));
    }

    function drawBossAt(st, cam) {
      if (st.boss.falling) Cast.drawFallingPauldron(r, P, [0.26, st.boss.y, 0.2]);
      else Cast.drawBoss(r, P, st.bossCam || cam, { drop: st.boss.drop });
    }

    function drawDust(st, box, t) {
      const u = t - 22.772;
      if (u < 0) return;
      PUFFS.forEach(p => {
        const v = u - p.delay;
        if (v <= 0) return;
        const life = 1 - Math.exp(-v * 3.2);
        const cx = box.x + box.w * (p.x0 + C(p.ang) * p.speed * life * 0.5 + v * 0.12);
        const cy = box.top + box.h * (p.y0 + S(p.ang) * p.speed * life * 0.45 - v * 0.04);
        const size = box.h * p.size * (0.5 + p.grow * life + v * 0.25);
        const left = clamp((box.x + box.w * 0.7 - cx) / (box.w * 0.4), 0, 1);
        const a = clamp(v / 0.06, 0, 1) * st.dust * 0.92 * (1 - clamp((v - p.fade) / 0.45, 0, 1) * (0.45 + 0.55 * left));
        post.sprite(dustTex[p.tex], cx, cy, size, size, p.rot + p.spin * v, [p.shade, p.shade * 0.97, p.shade * 0.9], a);
      });
    }

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const CW = r.canvas.width, CH = r.canvas.height;
        const RH = CH, RW = Math.min(CW, Math.round(CH * 9 / 16)), RX = Math.round((CW - RW) / 2);
        const rect = { x: RX, y: 0, w: RW, h: RH };
        const box = { x: RX, top: 0, w: RW, h: RH };
        r.clear([0, 0, 0]);
        const cam = Object.assign({ near: 0.05, far: 40, grade: GRADE, fx: { grain: 0.018, vignette: 0.22, time: t } }, st.camera);
        const list = actors(st);
        const aura = st.aura;
        let near = [1, 1], far = [1, 1];
        if (aura > 0.005 && list.length) {
          r.begin(ENV_MASK, cam, rect);
          list.forEach(a => Cast.draw(r, P, a.who, a.m, a.pose, { flat: [1, 1, 1, 1] }));
          r.grab(F.mask, RX, 0, RW, RH);
          post.begin(box);
          let s = down(F.mask, RW, RH, F.m2, box);
          s = down(F.m2, s[0], s[1], F.m4, box);
          near = s;
          s = down(F.m4, s[0], s[1], F.m8, box);
          s = down(F.m8, s[0], s[1], F.m16, box);
          far = s;
          post.end();
        }
        const env = st.who === 'knight' ? ENV_KNIGHT : st.who === 'bard' ? ENV_BARD : ENV_BOSS;
        r.begin(env, cam, rect);
        Hall.draw(r, W, { flame: [1, 0.9 + 0.1 * S(t * 23), 0.8] });
        r.grab(F.bg, RX, 0, RW, RH);
        post.begin(box);
        const bs = down(F.bg, RW, RH, F.bg2, box);
        post.blit(F.bg2, RX, 0, RW, RH, { rad: 1.1, tw: bs[0], th: bs[1] });
        post.end();
        r.begin(env, cam, rect, true);
        const tintOf = (who) => who === 'bard' ? [1 + 0.42 * aura, 1 + 0.38 * aura, 1 + 0.2 * aura] : [1 + 0.3 * aura, 1 + 0.26 * aura, 1 + 0.1 * aura];
        list.forEach(a => Cast.draw(r, P, a.who, a.m, a.pose, aura > 0.005 ? { tint: tintOf(a.who) } : {}));
        if (st.boss) drawBossAt(st, cam);
        if (aura > 0.005 && list.length) {
          post.begin(box);
          post.glow(F, RX, 0, RW, RH, { near, far, time: t, k: aura });
          post.end();
        }
        if (st.boss && st.shot === 10 && st.boss.blur > 0.02) {
          r.grab(F.frame, RX, 0, RW, RH);
          post.begin(box);
          post.blit(F.frame, RX, 0, RW, RH, { dir: [0.01 * st.boss.blur, 0.09 * st.boss.blur] });
          post.end();
        }
        if (st.dust > 0) {
          post.begin(box);
          drawDust(st, box, t);
          post.end();
        }
        if (st.caption) {
          const px = Math.max(8, Math.round(RH * 0.0335));
          const c = capTex(st.caption.lines, px, RW);
          ov.begin();
          ov.rect(RX, Math.round(RH * st.caption.y - px * 1.02), c.w, c.h, { texture: c.tex });
        }
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/When you need a buff.mp3',
    duration: Script.DURATION,
    aspect: 4 / 3,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
