(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, mesh } = K;
  const Art = window.KalamArt;
  const Sets = window.KalamSets;
  const Cast = window.KalamCast;
  const Script = window.KalamScript;

  const TW = 640;
  const TH = 480;
  const BLACK = { flat: [0, 0, 0, 1] };
  const FULL_BG = { adek: true, amp: true, amp2: true, or: true, chizh: true, calamburg: true, privet: true, cal: true, cum: true, cumBig: true, blank: true };

  function buildSmiley(b, grow) {
    const g = grow || 0;
    const T = (hex) => { const c = rgb(hex); return [c[0], c[1], c[2], 0.25]; };
    b.ellipsoid(0.5 + g, 0.5 + g, 0.5 + g, 20, 14, T(0xf0c020));
    if (g) return;
    [-1, 1].forEach(s => {
      b.at(s * 0.17, 0.08, 0.44, q => q.ellipsoid(0.07, 0.035, 0.03, 8, 4, T(0x2a1a0a)));
      const pts = [];
      for (let i = 0; i <= 14; i++) pts.push([s * 0.18 + C((i / 14) * 2 * PI) * 0.13, 0.08 + S((i / 14) * 2 * PI) * 0.08, 0.47]);
      K.tube(b, pts, pts.map(() => 0.012), 4, T(0x8a8a8a));
    });
    K.tube(b, [[-0.05, 0.1, 0.5], [0.05, 0.1, 0.5]], [0.01, 0.01], 4, T(0x8a8a8a));
    K.tube(b, [[-0.12, -0.2, 0.45], [0, -0.23, 0.47], [0.12, -0.2, 0.45]], [0.014, 0.016, 0.014], 4, T(0x6a3a0a));
    b.at(0, -0.05, 0.5, q => q.ellipsoid(0.05, 0.07, 0.04, 6, 4, T(0xd8a018)));
  }

  function buildGlove(b, thumb) {
    const W = [0.96, 0.96, 0.96, 0.25];
    b.ellipsoid(0.11, 0.13, 0.07, 10, 6, W);
    b.at(0, -0.15, 0, q => q.prism(10, 0.06, 0.05, -0.04, 0.08, 0.06, 0.04, W));
    if (thumb) {
      K.tube(b, [[0.02, 0.08, 0.02], [0.03, 0.26, 0.02]], [0.035, 0.03], 6, W);
      [-0.06, -0.02, 0.02].forEach((y, i) => K.tube(b, [[0.06, y, 0.0], [0.13, y - 0.01, 0.04 - i * 0.01]], [0.03, 0.026], 5, W));
    } else {
      K.tube(b, [[-0.04, 0.1, 0.02], [-0.06, 0.24, 0.05]], [0.03, 0.026], 5, W);
      K.tube(b, [[0.06, 0.06, 0.02], [0.12, 0.18, 0.06]], [0.03, 0.026], 5, W);
      [0.0, 0.04].forEach(x => K.tube(b, [[x, 0.1, 0], [x + 0.02, 0.2, -0.06]], [0.028, 0.024], 5, W));
    }
    [-0.05, 0, 0.05].forEach(x => b.at(x, 0.0, -0.07, q => q.box(0.01, 0.08, 0.004, [0.2, 0.2, 0.2, 0.25])));
  }

  function buildPirate(b, k) {
    const skin = 0x8a7a70, dark = 0x1a1a1c;
    b.ellipsoid(0.2, 0.24, 0.2, 14, 10, skin);
    b.at(0, -0.12, 0.08, q => q.ellipsoid(0.17, 0.16, 0.14, 10, 6, 0x3a3634));
    b.at(0, 0.0, 0.19, q => q.ellipsoid(0.05, 0.08, 0.06, 6, 4, 0x9a8a80));
    [-1, 1].forEach(s => b.at(s * 0.08, 0.07, 0.17, q => q.ellipsoid(0.03, 0.02, 0.02, 6, 3, 0xd8d8d8)));
    b.at(0, 0.18, 0, q => q.prism(3, 0.36, 0.36, 0, 0.32, 0.32, 0.1, dark, { capBottom: true, phase: PI / 3 * k }));
    b.at(0, 0.25, 0, q => q.prism(10, 0.17, 0.17, 0, 0.14, 0.14, 0.12, dark));
    if (k) {
      K.tube(b, [[0.05, -0.08, 0.2], [0.18, -0.14, 0.3], [0.26, -0.12, 0.32]], [0.015, 0.015, 0.015], 4, 0x2a1a10);
      b.at(0.28, -0.08, 0.32, q => q.prism(8, 0.04, 0.04, -0.03, 0.045, 0.045, 0.04, 0x3a2414, { capBottom: true }));
    }
    b.at(0, -0.38, 0, q => q.ellipsoid(0.36, 0.16, 0.24, 12, 6, 0x2a2a2c));
  }

  function camMatrices(cam, w, h, extra) {
    const e = extra || {};
    let proj = M4.perspective(cam.fov, w / h, cam.near || 0.04, cam.far || 60);
    if (e.stretch) proj = M4.mul(M4.scale(1, 1 + e.stretch * 0.35, 1), proj);
    if (cam.mirror) proj = M4.mul(M4.scale(-1, 1, 1), proj);
    const fwd = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(fwd, [0, 1, 0]);
    right = V3.len(right) < 1e-4 ? [1, 0, 0] : V3.norm(right);
    const up0 = V3.cross(right, fwd);
    const roll = (cam.roll || 0) + (e.flip ? PI : 0);
    const up = V3.add(V3.mul(up0, C(roll)), V3.mul(right, S(roll)));
    return { proj, view: M4.lookAt(cam.eye, cam.at, up), eye: cam.eye, at: cam.at };
  }

  function clipPoly(poly, n, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = a[0] * n[0] + a[1] * n[1] - c, db = b[0] * n[0] + b[1] * n[1] - c;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const k = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      }
    }
    return out;
  }

  function create(r) {
    const SET = Sets.build(r);
    const CST = Cast.build(r);
    const ov = K.overlay(r, TW, TH);
    const titles = {};
    const titleTex = (kind) => {
      if (!titles[kind]) titles[kind] = r.texture(1024, Art.title(kind, FULL_BG[kind]), { height: 768, clamp: true });
      return titles[kind];
    };
    const bugTex = { normal: r.texture(160, Art.bug(false), { height: 80, clamp: true }), mirror: r.texture(160, Art.bug(true), { height: 80, clamp: true }) };
    const markTex = r.texture(200, Art.watermark, { height: 60, clamp: true });
    const rimsTex = r.texture(256, Art.rims, { height: 192, clamp: true });
    const cracksTex = r.texture(256, Art.cracks, { clamp: true });
    const confettiTex = titleTex('confetti');
    const actorBgTex = titleTex('actorBg');
    const tex = { a: r.frameTexture(), b: r.frameTexture(), c: r.frameTexture(), last: r.frameTexture(), px: r.frameTexture(true), inset: r.frameTexture() };
    const smiley = mesh(r, b => buildSmiley(b, 0));
    const smileyLine = mesh(r, b => buildSmiley(b, 0.025));
    const gloveOk = mesh(r, b => buildGlove(b, false));
    const gloveUp = mesh(r, b => buildGlove(b, true));
    const pirates = [mesh(r, b => buildPirate(b, 0)), mesh(r, b => buildPirate(b, 1))];
    const slit = mesh(r, b => b.box(1, 1, 0.01, 0x241a18));
    const roll = mesh(r, b => {
      b.push(M4.rotX(PI / 2));
      b.prism(10, 0.025, 0.025, -0.13, 0.025, 0.025, 0.13, 0xf2f2ee, { capBottom: true });
      b.pop();
    });

    const W = () => r.canvas.width || 480;
    const H = () => r.canvas.height || 360;

    function pxRect(nx, ny, nw, nh) {
      const w = W(), h = H();
      return { x: Math.round(nx * w), y: Math.round((1 - ny - nh) * h), w: Math.max(1, Math.round(nw * w)), h: Math.max(1, Math.round(nh * h)) };
    }

    function begin3d(st, cam, rect, keep, extra) {
      const w = rect ? rect.w : W(), h = rect ? rect.h : H();
      const m = camMatrices(cam, w, h, extra);
      const look = st.look;
      const k = st.lookK === undefined ? 1 : st.lookK;
      const add = look ? look.colorAdd.map(v => v * k) : [0, 0, 0];
      const g = st.white ? [1 + st.white * 2, 1 + st.white * 2, 1 + st.white * 2, 0] : [1, 1, 1, 0];
      r.begin(st.env, { proj: m.proj, view: m.view, eye: m.eye, grade: g, colorM: look && look.colorM && k > 0.5 ? look.colorM : undefined, colorAdd: add, fx: { grain: 0.035, vignette: 0.18, time: (st.t * 7.3) % 100 } }, rect, keep);
      return m;
    }

    function ovBegin(st, rect) {
      const look = st && st.look;
      ov.begin(rect, look && look.colorM ? look.colorM : undefined, look ? look.colorAdd : undefined);
    }

    function propOn(m, side, M) {
      return M4.chain(m['hand' + side], M);
    }

    function drawCast(st, opts) {
      (st.cast || []).forEach(c => {
        const V = c.who === 'lady' ? CST.ladies[c.look] : CST[c.who];
        const m = Cast.solve(c.who, c.pose);
        const o = Object.assign({}, opts || {});
        if (c.flat) o.flat = c.flat;
        if (st.melt !== undefined && c.who === 'host') o.alpha = 1 - st.melt;
        Cast.draw(r, V, m, c.pose, o);
        const pass = o.flat ? { flat: o.flat } : {};
        if (c.prop === 'pizza') r.draw(CST.pizza, propOn(m, 'R', M4.chain(M4.translate(0.0, -0.11, 0.05), M4.rotZ(0.4))), pass);
        if (c.prop === 'tape') r.draw(SET.office.vhs, propOn(m, 'R', M4.chain(M4.translate(-0.09, -0.12, 0.0), M4.rotY(PI / 2))), Object.assign({ texture: SET.office.vhsTex }, pass));
        if (c.who === 'waiter') {
          if (c.pose.prop === 'pad') {
            r.draw(CST.pad, propOn(m, 'L', M4.chain(M4.translate(-0.04, -0.12, 0.06), M4.rotX(-PI / 2 + 0.5), M4.rotZ(0.3))), pass);
            r.draw(CST.pen, propOn(m, 'R', M4.chain(M4.translate(0.0, -0.1, 0.03), M4.rotX(-0.6))), pass);
          } else r.draw(roll, propOn(m, 'R', M4.chain(M4.translate(0, -0.1, 0.06), M4.rotY(0.4))), pass);
        }
        if (c.who === 'radar' && c.pose.bun) r.draw(CST.bun, propOn(m, 'R', M4.translate(0, -0.13, 0.06)), pass);
      });
    }

    function drawOffice(st, rect, keep) {
      const m = begin3d(st, st.camera, rect, keep, { flip: st.flip, stretch: st.stretch });
      Sets.drawOffice(r, SET.office, Object.assign({}, st.set));
      if (st.set && st.set.gap) {
        const g = st.set.gap;
        r.draw(slit, M4.chain(M4.translate(-0.05, 1.48, -1.55), M4.scale(0.36, 0.035 * g, 1)), {});
        [-1, 1].forEach(s => r.draw(slit, M4.chain(M4.translate(-0.05 + s * 0.05, 1.48, -1.54), M4.scale(0.025, 0.012 * g, 1)), { flat: [0.95, 0.92, 0.88, 1] }));
      }
      drawCast(st);
      if (st.can !== undefined) {
        const k = st.can;
        const cm = M4.chain(M4.translate(-0.15, 1.08, 0.66), M4.rotY(0.2), M4.scale(3.2 * k, 3.2 * k, 3.2 * k));
        r.draw(SET.office.can, cm, { texture: SET.office.labelTex });
        r.draw(SET.office.canLabel, cm, { texture: SET.office.labelTex });
        r.draw(SET.office.canTop, cm, {});
      }
      if (st.thrown !== undefined) {
        const k = st.thrown;
        const p = [lerp(0.0, -0.9, k), 1.75 + S(k * PI) * 0.6, lerp(-0.85, 0.3, k)];
        r.draw(SET.office.vhs, M4.chain(M4.translate(...p), M4.rotZ(k * 9), M4.rotX(k * 5)), { texture: SET.office.vhsTex });
      }
      if (st.rain !== undefined) {
        for (let i = 0; i < 9; i++) {
          const y = 2.02 - st.rain * 0.3 + (i % 2) * 0.04;
          r.draw(SET.office.vhs, M4.chain(M4.translate(-1.0 + i * 0.26, y, -0.2), M4.rotZ(-0.9), M4.rotY(PI / 2)), { texture: SET.office.vhsTex });
        }
      }
      return m;
    }

    function drawDiner(st, rect, keep) {
      begin3d(st, st.camera, rect, keep);
      Sets.drawDiner(r, SET.diner, st, () => drawCast(st));
    }

    function drawStudio(st, rect, keep) {
      const cam = st.camera;
      begin3d(st, cam, rect, keep);
      Sets.drawStudio(r, SET.studio, st, cam);
    }

    function drawHut(st, rect, keep) {
      begin3d(st, st.camera, rect, keep);
      const p = st.cast[0].pose;
      const m = Cast.solve('nose', p);
      const set = Object.assign({}, st.set);
      if (p.sheet === 'hand') {
        set.tear = 0;
        const hm = M4.chain(m.handL, M4.translate(0, -0.12, 0.05), M4.rotX(-0.2));
        const pos = M4.point(hm, [0, 0, 0]);
        set.sheetPos = [pos[0] - 0.25, pos[1] - 1.82, pos[2] + 0.95];
        set.sheetRot = 0.3;
        set.sheetTilt = 0;
      }
      Sets.drawHut(r, SET.hut, set);
      drawCast(st);
    }

    function drawTruck(st, rect, keep) {
      begin3d(st, st.camera, rect, keep);
      Sets.drawTruck(r, SET.truck, st.set);
      drawCast(st);
    }

    function screenInset(kind, u) {
      const s = Math.min(256, W(), H());
      const rect = { x: 0, y: 0, w: s, h: s };
      if (kind === 'feedback') return tex.last;
      if (kind === 'guy' || kind === 'scared') {
        const who = kind === 'guy' ? 'guy' : 'radar';
        const env = Script.ENVS.radar;
        const head = kind === 'guy' ? [0, 1.5, 0] : [0, 1.5, 0];
        const pose = { pos: [0, 0.98 + (kind === 'guy' ? S(u * 3) * 0.01 : 0), 0], yaw: kind === 'guy' ? S(u * 2) * 0.15 : PI * 0.04, nk: [0.05, 0, 0], eyes: kind === 'scared' ? 'wide' : 'open', mouth: kind === 'scared' ? 'o' : u > 1.75 ? 'wide' : 'shut', noLegs: true };
        const m = Cast.solve(who, pose);
        const hp = M4.point(m.head, [0, 0, 0]);
        r.begin(Object.assign({}, env, { fogColor: kind === 'guy' ? [0.86, 0.82, 0.76] : [0.4, 0.7, 0.75] }), { eye: [hp[0], hp[1] + 0.02, hp[2] + 0.42], at: hp, fov: 40 }, rect);
        Cast.draw(r, CST[who], m, pose);
        r.grab(tex.inset, 0, 0, s, s);
        return tex.inset;
      }
      return null;
    }

    function drawRadar(st, rect, keep) {
      let screenTex = null;
      if (st.screen) screenTex = screenInset(st.screen.kind, st.screen.u || st.screen.k || 0);
      begin3d(st, st.camera, rect, keep);
      Sets.drawRadar(r, SET.radar, Object.assign({}, st.set, { screenTex }));
      if (st.screen && st.screen.kind === 'shatter') {
        r.draw(SET.radar.screen, Sets.RADAR_SCREEN, { texture: SET.radar.radarTex, noFog: true });
        r.draw(SET.radar.screen, M4.chain(Sets.RADAR_SCREEN, M4.translate(0, 0, 0.006)), { texture: cracksTex, additive: true, alpha: 0.9, noFog: true });
      }
      if (st.screen && (st.screen.kind === 'guy' || st.screen.kind === 'scared')) {
        r.draw(SET.radar.screen, M4.chain(Sets.RADAR_SCREEN, M4.translate(0, 0, 0.005)), { texture: SET.radar.radarTex, blend: true, alpha: 0.28, noFog: true });
      }
      drawCast(st);
    }

    function drawSky(st, rect, keep) {
      const w = rect ? rect.w : W(), h = rect ? rect.h : H();
      if (!keep) r.clear([0.5, 0.75, 0.95]);
      ovBegin(st, rect);
      ov.rect(0, 0, TW, TH, { texture: SET.sky.skyTex, uvScroll: [st.t * 0.05, 0] });
      const cam = st.camera;
      const m = begin3d(st, cam, rect, true, { flip: st.flip });
      const SK = SET.sky;
      if (st.clouds || st.mode === 'cockpit' || st.mode === 'hull') {
        for (let i = 0; i < 8; i++) {
          const x = ((i * 3.7 + st.t * (st.mode === 'cockpit' ? 6 : 1.5)) % 24) - 12;
          const p = [-x, -1.2 + (i % 3) * 1.1, -4 - (i % 4) * 2.5];
          if (st.mode === 'cockpit') { p[0] = -2.5 - ((i * 3.7 + st.t * 6) % 12); p[2] = 4 - ((i * 2.3 + st.t * 9) % 10); p[1] = -0.8 + (i % 3) * 0.9; }
          const yaw = Math.atan2(cam.eye[0] - p[0], cam.eye[2] - p[2]);
          r.draw(SK.cloud, M4.chain(M4.translate(...p), M4.rotY(yaw), M4.scale(1.2, 1.2, 1)), { texture: SK.cloudTex, noFog: true });
        }
      }
      if (st.trail) Sets.drawTrail(r, SK, st.trail, 0.085);
      if (st.plane) {
        const pl = st.plane;
        const pm = M4.chain(M4.translate(...pl.pos), M4.rotY(pl.yaw), M4.rotX(-(pl.pitch || 0)), M4.rotZ(pl.roll || 0), M4.scale(pl.scale, pl.scale, pl.scale));
        Sets.drawPlane(r, SK, pm, st.t, true, st.wild);
      }
      if (st.face) {
        const fm = M4.translate(0, 0.38, 0);
        Sets.toon(r, SK, 'pilot', M4.chain(fm, M4.scale(1.0, 1.0, 1.0)));
        const k = st.handsK;
        [-1, 1].forEach(s => {
          let hm;
          if (st.hands === 'ok') hm = M4.chain(M4.translate(s * 0.24, lerp(0.15, 0.48, k), 0.44), M4.rotZ(s * 0.3), M4.scale(0.75, 0.75, 0.75));
          else if (st.hands === 'ears') hm = M4.chain(M4.translate(s * 0.14, 1.12, 0.1), M4.rotZ(-s * 0.25), M4.scale(0.9, 1.3, 0.9));
          else hm = M4.chain(M4.translate(s * 0.1, 0.93, 0.38), M4.rotZ(s * 0.5), M4.scale(0.8, 0.8, 0.8));
          Sets.toon(r, SK, st.hands === 'ok' ? 'okHand' : 'hand', hm);
        });
      }
      return m;
    }

    function drawTitle(st, rect) {
      if (st.mix !== undefined) {
        drawStage(Script.stage(22.4), rect);
        ovBegin(st, rect);
        ov.rect(0, 0, TW, TH, Object.assign({ blend: true, alpha: 1 - st.mix }, BLACK));
        return;
      }
      r.clear([0.024, 0.016, 0.024]);
      ovBegin(st, rect);
      const kind = st.title;
      if (st.big !== undefined) {
        const s = lerp(0.35, 1.0, st.big);
        ov.rect(TW / 2 - TW * s / 2, TH * 0.45 - TH * s / 2, TW * s, TH * s, { texture: titleTex('cumBig'), blend: true, alpha: st.alpha });
        return;
      }
      if (st.box !== undefined) {
        const s = st.box;
        if (s <= 0.01) return;
        ov.rect(TW / 2 - TW * s / 2, TH / 2 - TH * s / 2, TW * s, TH * s, { texture: titleTex(kind) });
        return;
      }
      ov.rect(0, 0, TW, TH, { texture: titleTex(kind), blend: st.alpha < 1, alpha: st.alpha });
    }

    function drawBobs(st) {
      r.clear([0.95, 0.94, 0.92]);
      ovBegin(st);
      ov.rect(0, 0, TW, TH, { texture: titleTex(st.gum ? 'bobs' : 'bobsOld') });
      if (st.gum) ov.rect(0, 0, 300, 196, { texture: titleTex('gum') });
      else {
        const rect = pxRect(0, 0, 300 / TW, 196 / TH);
        r.begin(Script.ENVS.card, { eye: [0.1, 0.05, 1.6], at: [0, -0.05, 0], fov: 40, grade: [1, 1, 1, 1] }, rect, true);
        r.draw(pirates[0], M4.chain(M4.translate(-0.33, 0, 0), M4.rotY(0.4)), {});
        r.draw(pirates[1], M4.chain(M4.translate(0.33, 0, 0.1), M4.rotY(-0.3)), {});
        ovBegin(st);
      }
      if (st.wipe < 1) {
        const k = st.wipe;
        for (let i = 0; i < 8; i++) {
          const wdt = 46 * (1 - k) * (1 + (i % 3) * 0.3);
          ov.rect(i * 82 + 20, 0, wdt, TH, BLACK);
        }
      }
    }

    function drawActor(st) {
      r.clear([0.8, 0.8, 0.8]);
      ovBegin(st);
      ov.rect(0, 0, TW, TH, { texture: actorBgTex });
      const nx = 214 / TW, ny = 80 / TH, nw = 296 / TW, nh = 328 / TH;
      const full = pxRect(nx, ny, nw, nh);
      const div = st.pixel ? 14 : 1;
      const rect = st.pixel ? { x: 0, y: 0, w: Math.max(2, Math.round(full.w / div)), h: Math.max(2, Math.round(full.h / div)) } : full;
      const turn = clamp((st.t - 10.75) / 0.3, 0, 1);
      const pose = { pos: [0, 0.95, 0], yaw: 0.15 + turn * 0.35, nk: [0.04, turn * 0.3, 0], hL: [0.3, -0.3, 0.05], hR: [-0.3, -0.3, 0.05], eyes: turn > 0.5 ? 'side' : 'open', mouth: 'shut', noLegs: true };
      const m = Cast.solve('actor', pose);
      const hp = M4.point(m.head, [0, 0, 0]);
      r.begin(Script.ENVS.card, { eye: [hp[0] + 0.04, hp[1] - 0.05, hp[2] + 0.95], at: [hp[0], hp[1] - 0.17, hp[2]], fov: 33, grade: [1, 1, 1, 1] }, rect, !st.pixel);
      Cast.draw(r, CST.actor, m, pose);
      if (st.pixel) {
        r.grab(tex.px, 0, 0, rect.w, rect.h);
        ovBegin(st);
        ov.rect(0, 0, TW, TH, { texture: actorBgTex });
        ov.rect(214, 80, 296, 328, { texture: tex.px });
      }
    }

    function drawDtb(st) {
      r.clear([0.16, 0.02, 0.04]);
      ovBegin(st);
      const s = lerp(1.0, 1.12, st.zoom);
      const big = titleTex('dtbBig');
      for (let i = 0; i < 4; i++) {
        const o = (i - 1.5) * 5;
        ov.rect(TW / 2 - (TW * s) / 2 + o, TH / 2 - (TH * s) / 2 + o * 0.5, TW * s, TH * s, { texture: big, blend: i > 0, alpha: i ? 0.3 : 1 });
      }
    }

    function drawRzhu(st, rect) {
      const off = st.slide * TH;
      if (st.slide > 0) drawStage(Script.stage(77.0), rect);
      else r.clear([1, 1, 1]);
      ovBegin(st, rect);
      ov.rect(0, -off, TW, TH, { texture: titleTex('rzhu') });
      const box = rect || { x: 0, y: 0, w: W(), h: H() };
      const sub = { x: box.x, y: box.y + Math.round((off / TH) * box.h), w: box.w, h: box.h };
      r.begin(Script.ENVS.smiley, { eye: [0, 0, 5.2], at: [0, 0, 0], fov: 40 }, sub, true);
      const t = st.t;
      const sm = M4.chain(M4.translate(-0.85, -0.62, 0), M4.rotY(0.25 + S(t * 2) * 0.05), M4.rotZ(S(t * 1.5) * 0.05), M4.scale(1.35, 1.35, 1.35));
      r.draw(smileyLine, sm, { blend: true, alpha: 1, flat: [0.2, 0.15, 0.05, 1] });
      r.draw(smiley, sm, {});
      r.draw(gloveOk, M4.chain(M4.translate(-1.62, -0.32 + S(t * 3) * 0.03, 0.55), M4.rotZ(0.5), M4.scale(1.7, 1.7, 1.7)), {});
      r.draw(gloveUp, M4.chain(M4.translate(0.05, -1.0, 0.3), M4.rotZ(-0.1), M4.scale(1.3, 1.3, 1.3)), {});
    }

    function drawKras(st) {
      r.clear([0.03, 0.02, 0.025]);
      ovBegin(st);
      if (st.confetti > 0) ov.rect(-40 + st.t * 6 % 40, 0, TW + 40, TH, { texture: confettiTex, blend: true, alpha: st.confetti });
      const d = st.drop;
      const bounce = d < 1 ? (1 - ease(d)) * -300 + S(d * PI * 3) * 20 * (1 - d) : S(st.t * 3) * 4;
      const kt = titleTex('kras');
      if (st.smear > 0) {
        for (let i = 0; i < 7; i++) ov.rect((i - 3) * 40 * st.smear, bounce, TW, TH, { texture: kt, blend: true, alpha: 0.35 });
      } else ov.rect(0, bounce, TW, TH, { texture: kt });
      if (st.swirl > 0) {
        r.grab(tex.a, 0, 0, W(), H());
        ovBegin(st);
        ov.rect(0, 0, TW, TH, { flat: [0.75, 0.84, 0.92, 1] });
        const k = st.swirl;
        for (let i = 0; i < 10; i++) {
          const a = k * (2 + i * 0.6);
          const s = 1 + k * i * 0.08;
          const mm = M4.chain(M4.translate(TW / 2, TH / 2, 0), M4.rotZ(a), M4.scale(TW * s, -TH * s, 1), M4.translate(-0.5, -0.5, 0));
          r.draw(ov.quad, mm, { texture: tex.a, blend: true, alpha: (1 - k) * 0.3 + 0.08 });
        }
        if (k > 0.7) ov.rect(0, 0, TW, TH, { blend: true, alpha: (k - 0.7) / 0.3 * 0.9, flat: [0.88, 0.94, 0.98, 1] });
      }
    }

    function drawStage(st, rect, keep) {
      switch (st.kind) {
        case 'office': drawOffice(st, rect, keep); break;
        case 'diner': drawDiner(st, rect, keep); break;
        case 'studio': drawStudio(st, rect, keep); break;
        case 'hut': drawHut(st, rect, keep); break;
        case 'truck': drawTruck(st, rect, keep); break;
        case 'sky': drawSky(st, rect, keep); break;
        case 'radar': drawRadar(st, rect, keep); break;
        case 'title': drawTitle(st, rect); break;
        case 'bobs': drawBobs(st); break;
        case 'actor': drawActor(st); break;
        case 'dtb': drawDtb(st); break;
        case 'rzhu': drawRzhu(st, rect); break;
        case 'kras': drawKras(st); break;
        default: r.clear([0, 0, 0]);
      }
    }

    function drawMarks(st, only) {
      ov.begin();
      if (st.bug && only !== 'mark') ov.rect(532, 44, 76, 38, { texture: bugTex[st.bug], blend: true, alpha: 0.88 });
      if (st.mark && only !== 'bug') ov.rect(500, 436, 136, 41, { texture: markTex, blend: true, alpha: 0.8 });
    }

    function stageWithCam(at, cam) {
      const s = Script.stage(at);
      if (cam) s.camera = Object.assign({}, Script.CAMS[cam], { mirror: false, roll: 0 });
      s.look = null;
      return s;
    }

    function drawCurl(st) {
      const w = W(), h = H();
      drawStage(Script.stage(75.0));
      r.grab(tex.b, 0, 0, w, h);
      drawStage(Object.assign({}, st, { curl: undefined }));
      r.grab(tex.a, 0, 0, w, h);
      r.clear([1, 1, 1]);
      ov.begin();
      const k = ease(st.curl);
      const corner = [0, TH];
      const d = V3.norm([TW, -TH, 0]);
      const n = [d[0], d[1]];
      const reach = (TW * 0.8 + TH * 0.6) * 1.25 * k;
      const c = corner[0] * n[0] + corner[1] * n[1] + reach;
      const screen = [[0, 0], [TW, 0], [TW, TH], [0, TH]];
      const kept = clipPoly(screen, n, c);
      const peeled = clipPoly(screen, [-n[0], -n[1]], -c);
      const flap = clipPoly(peeled.map(p => {
        const dd = p[0] * n[0] + p[1] * n[1] - c;
        return [p[0] - 2 * dd * n[0], p[1] - 2 * dd * n[1]];
      }), n, c);
      const poly = (pts, texture, extra) => {
        if (pts.length < 3) return;
        const b = new Builder();
        const v = (p) => [p[0], p[1], 0];
        const uv = (p) => [p[0] / TW, 1 - p[1] / TH];
        for (let i = 1; i < pts.length - 1; i++) b.tri(v(pts[0]), v(pts[i]), v(pts[i + 1]), [1, 1, 1, 1], [uv(pts[0]), uv(pts[i]), uv(pts[i + 1])], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        const ms = r.mesh(b);
        r.draw(ms, M4.ident(), Object.assign({ noFog: true }, texture ? { texture } : {}, extra || {}));
        r.gl.deleteBuffer(ms.vbo);
      };
      poly(kept, tex.a);
      poly(peeled, tex.b);
      poly(flap, null, { flat: [0.9, 0.9, 0.88, 1] });
      poly(clipPoly(flap, [-n[0], -n[1]], -(c + 40)), null, { blend: true, alpha: 0.25, flat: [0.2, 0.2, 0.22, 1] });
    }

    function drawTiltIn(st) {
      const w = W(), h = H();
      drawStage(Object.assign({}, st, { tiltIn: undefined }));
      r.grab(tex.a, 0, 0, w, h);
      drawStage(Script.stage(83.98));
      ov.begin();
      const k = ease(st.tiltIn);
      const s = lerp(0.62, 1.0, k);
      const mm = M4.chain(M4.translate(TW * lerp(0.62, 0.5, k), TH * lerp(0.4, 0.5, k), 0), M4.rotZ(lerp(-0.35, 0, k)), M4.scale(TW * s, -TH * s, 1), M4.translate(-0.5, -0.5, 0));
      r.draw(ov.quad, mm, { texture: tex.a });
    }

    function postSym(side) {
      const w = W(), h = H();
      const half = Math.floor(w / 2);
      r.grab(tex.c, side === 'L' ? 0 : w - half, 0, half, h);
      ov.begin();
      if (side === 'L') ov.rect(TW, 0, -TW / 2, TH, { texture: tex.c });
      else ov.rect(TW / 2, 0, -TW / 2, TH, { texture: tex.c });
    }

    function postBlurry() {
      const w = W(), h = H();
      const sw = Math.max(2, Math.round(w / 5)), sh = Math.max(2, Math.round(h / 5));
      r.grab(tex.a, 0, 0, w, h);
      ov.begin({ x: 0, y: 0, w: sw, h: sh });
      ov.rect(-TW * 0.15, -TH * 0.15, TW * 1.3, TH * 1.3, { texture: tex.a });
      r.grab(tex.b, 0, 0, sw, sh);
      ov.begin();
      ov.rect(0, 0, TW, TH, { texture: tex.b });
    }

    function postGhost(g) {
      const w = W(), h = H();
      r.grab(tex.a, 0, 0, w, h);
      drawStage(stageWithCam(g.at, g.cam));
      ov.begin();
      ov.rect(0, 0, TW, TH, { texture: tex.a, blend: true, alpha: 1 - g.alpha });
    }

    function waving(c, t) {
      if (c.who !== 'host') return c;
      const lift = S(t * 9) * 0.06;
      const pose = Object.assign({}, c.pose, { hR: [-0.38, 0.22 + lift, 0.28], gR: 'spread', hL: [0.38, 0.26 - lift, 0.28], gL: 'spread', mouth: 'smile' });
      delete pose.hRw;
      delete pose.hLw;
      return Object.assign({}, c, { pose });
    }

    function pipStage(st, p) {
      if (p.mode) {
        const s = Script.stage(104.0);
        s.look = null;
        return s;
      }
      const s = stageWithCam(st.t, p.cam);
      s.cast = s.cast.map(c => waving(c, st.t));
      return s;
    }

    function postPip(st, p) {
      const [x, y, ww, hh] = p.rect;
      drawStage(pipStage(st, p), pxRect(x, y, ww, hh), true);
    }

    return {
      warm() {
        ['adek', 'amp', 'or', 'calamburg', 'cal', 'rzhu', 'kras', 'bobs', 'gum', 'news', 'privet', 'chizh', 'cum', 'cumBig', 'vas', 'caption', 'krutoe', 'amp2'].forEach(titleTex);
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'radar' && st.screen && st.screen.kind === 'feedback') r.grab(tex.last, 0, 0, W(), H());
        if (st.curl !== undefined) drawCurl(st);
        else if (st.tiltIn !== undefined) drawTiltIn(st);
        else drawStage(st);
        if (st.ghost) postGhost(st.ghost);
        if (st.sym) {
          if (st.symBug) drawMarks(st, 'bug');
          postSym(st.sym);
        }
        if (st.blurry) postBlurry();
        if (st.pip) postPip(st, st.pip);
        if (st.vasPov) {
          ov.begin();
          ov.rect(0, 0, TW, TH, { texture: rimsTex });
        }
        ov.begin();
        if (st.flash) ov.rect(0, 0, TW, TH, { blend: true, alpha: clamp(st.flash, 0, 1), flat: [1, 0.98, 0.94, 1] });
        if (st.motionBlur) ov.rect(0, 0, TW, TH, { blend: true, alpha: 0.18, flat: [0.95, 0.88, 0.85, 1] });
        (st.overlays || []).forEach(k => ov.rect(0, 0, TW, TH, { texture: titleTex(k) }));
        drawMarks(st, st.symBug ? 'mark' : undefined);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/каламбург.mp3',
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
