(function (X) {
  'use strict';
  const MD = X.Models;
  const INK = '#120a06';
  const COMIC = '"Comic Sans MS", "Comic Neue", cursive';
  const TARGETS = { head: [2, [0, 0.15, -0.01]], neck: [1, [0.06, 0.38, -0.1]], chest: [1, [0, 0.28, 0]], body: [0, [0, 0.1, 0]], feet: [0, [0, -0.85, 0]] };

  class Comic {
    constructor(ui, pages, o) {
      this.ui = ui;
      this.pages = pages || [];
      this.o = o || {};
      this.page = -1;
      this.t = 0;
      this.panels = [];
      this.done = false;
      this.fade = 0;
      this.next();
    }
    layout(spec, W, H) {
      const aspect = spec.aspect || 1.42;
      let pw = W * 0.94, ph = pw / aspect;
      if (ph > H * 0.92) { ph = H * 0.92; pw = ph * aspect; }
      const px = (W - pw) / 2, py = (H - ph) / 2;
      const g = Math.max(6, pw * 0.012);
      const rows = spec.rows || [{ h: 1, w: [1] }];
      const rects = [];
      const tH = rows.reduce((a, r) => a + r.h, 0);
      let y = py + g;
      const innerH = ph - g * (rows.length + 1);
      for (const r of rows) {
        const h = innerH * r.h / tH;
        const tw = r.w.reduce((a, b) => a + b, 0);
        const innerW = pw - g * (r.w.length + 1);
        let x = px + g;
        for (const w of r.w) {
          const ww = innerW * w / tw;
          rects.push([x, y, ww, h]);
          x += ww + g;
        }
        y += h + g;
      }
      return { page: [px, py, pw, ph], rects };
    }
    next() {
      this.page++;
      this.t = 0;
      this.freePanels();
      if (this.page >= this.pages.length) { this.finish(); return; }
      this.build();
    }
    finish() {
      if (this.done) return;
      this.done = true;
      this.freePanels();
      if (this.o.onDone) this.o.onDone();
    }
    freePanels() {
      if (this.ui.r) for (const p of this.panels) {
        if (p.out && p.out.art) { this.ui.r.gl.deleteTexture(p.out.tex); p.out = null; }
        else this.ui.r.freePanel(p);
      }
      this.panels = [];
    }
    puppet(a, i, t, hideWorld) {
      const def = X.CHARS[a.type] || X.CHARS.xiii;
      const aimPose = a.pose === 'aim' || a.pose === 'aim_rifle';
      const pos = a.pos.slice();
      const g = this.ui.game;
      if (g && !hideWorld && !a.float) {
        const y = g.world.groundY(pos[0], pos[2], pos[1] === null ? 1e6 : pos[1] + 1.2);
        if (y > -1e8 && Math.abs(y - pos[1]) < 2.5) pos[1] = y;
        const wy = g.world.waterAt(pos[0], pos[2]);
        if (wy !== null && pos[1] < wy - 0.3 && a.pose !== 'lie') pos[1] = wy - 0.3;
      }
      const pp = {
        id: 'pp' + this.page + '_' + i + '_' + a.type, type: a.type, pos, yaw: a.yaw || 0, state: 'alive', weapon: a.gun !== undefined ? a.gun : (aimPose ? (def.weapon || 'beretta') : null),
        speed: 0, crouch: 0, face: a.face || (a.pose === 'fall' ? 'pain' : null), forcePose: MD.pose(a.pose || 'stand', t || 0)
      };
      if (a.pose === 'dead' || a.pose === 'deadf') { pp.state = 'dead'; pp.deathKind = a.pose === 'deadf' ? 'front' : 'back'; pp.weapon = null; }
      const tpl = MD.template(def.look, pp.weapon, pp.type);
      const buf = new Float32Array(tpl.mesh.n * 11);
      const pose = pp.forcePose;
      const mats = MD.skin(tpl, pose, MD.rootMatrix(pp.pos, pp.yaw, pose.pitch || 0, pose.roll || 0), buf, false);
      pp.bones = {};
      for (const k in TARGETS) pp.bones[k] = MD.boneWorld(mats, TARGETS[k][0], TARGETS[k][1]);
      pp.headWorld = pp.bones.head;
      return pp;
    }
    camFor(spec, pups) {
      if (spec.cam) return { pos: spec.cam.pos, look: spec.cam.look, fov: spec.cam.fov || 45, roll: spec.cam.roll || 0 };
      const s = spec.shot || {};
      const a = pups[s.on || 0];
      if (!a) return { pos: [0, 1.6, 3], look: [0, 1.4, 0], fov: 45 };
      const tgt = a.bones[s.target || 'head'] || a.bones.head;
      const ang = a.yaw + (s.angle || 0) * X.DEG;
      const f = X.fwd(ang, 0);
      const d = s.dist || 1.2;
      if (s.from === 'above') return { pos: [tgt[0] + f[0] * d * 0.25, tgt[1] + d, tgt[2] + f[2] * d * 0.25], look: tgt, up: X.fwd(ang + Math.PI, 0), fov: s.fov || 40 };
      return { pos: [tgt[0] + f[0] * d, tgt[1] + (s.height || 0), tgt[2] + f[2] * d], look: tgt, fov: s.fov || 40, roll: s.roll || 0 };
    }
    build() {
      const ui = this.ui, r = ui.r;
      const spec = this.pages[this.page];
      const W = r ? r.W : 800, H = r ? r.H : 600;
      const L = this.layout(spec, W, H);
      this.L = L;
      this.panels = spec.panels.map((ps, i) => {
        const rect = L.rects[i] || L.rects[L.rects.length - 1];
        const pups = ps.art ? [] : (ps.actors || []).map((a, j) => this.puppet(a, j, i * 0.7, ps.hideWorld));
        const cam = ps.art ? null : this.camFor(ps, pups);
        const p = { spec: ps, rect, pups, cam, pw: Math.max(64, Math.min(1024, Math.round(rect[2]))), ph: Math.max(48, Math.min(1024, Math.round(rect[3]))) };
        if (r && ps.art) {
          const cv = document.createElement('canvas');
          cv.width = p.pw; cv.height = p.ph;
          X.comicArt(cv.getContext('2d'), ps.art, p.pw, p.ph, ps.artOpt || {});
          p.out = { tex: X.GL.texture(r.gl, cv, { mip: false, clamp: true }), w: p.pw, h: p.ph, art: true };
        } else if (r) {
          const tint = X.PANEL_TINTS[ps.tint] || (ps.tint === 'flash' ? X.PANEL_TINTS.grey : X.PANEL_TINTS.none);
          const extra = [];
          for (const pr of ps.props || []) {
            let pos = pr.pos, yaw = pr.yaw || 0.3, pitch = pr.pitch || 0;
            if (pr.kind === 'tattoo' && pups[0]) { pos = pups[0].bones.neck; yaw = pups[0].yaw; }
            const g = r.cached('cprop:' + pr.kind, () => MD.comicProp(pr.kind));
            extra.push({ g, m: X.M4.trs((pos || [0, 0, -0.1])[0], (pos || [0, 0, -0.1])[1], (pos || [0, 0, -0.1])[2], yaw, pitch, pr.roll || 0, pr.scale || 1) });
          }
          const view = r.renderPanel(p, cam, { puppets: pups, hideWorld: !!ps.hideWorld, bg: ps.bg || null, extra, time: i, post: { tint: tint.tint, duoA: tint.duoA, duoB: tint.duoB, vig: 0.25, grain: 0.18, lineW: 1.3 } });
          p.view = view;
        }
        return p;
      });
    }
    key(e) {
      if (e === 'skip') { this.finish(); return; }
      const all = this.revealT();
      if (this.t < all) { this.t = all + 0.01; return; }
      this.next();
    }
    revealT() { return this.panels.length * 0.55 + 0.4; }
    update(dt) { this.t += dt; }
    draw() {
      const r = this.ui.r;
      if (!r || this.done) return;
      const gl = r.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, r.W, r.H);
      gl.clearColor(0.08, 0.06, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      r.beginOverlay();
      const [px, py, pw, ph] = this.L.page;
      r.rect(px + 6, py + 8, pw, ph, [0, 0, 0, 0.5]);
      r.rect(px, py, pw, ph, [0.95, 0.92, 0.84, 1]);
      this.panels.forEach((p, i) => {
        const t0 = i * 0.55;
        if (this.t < t0) return;
        const a = Math.min(1, (this.t - t0) * 5);
        const [x, y, w, h] = p.rect;
        const b = 3;
        r.rect(x - b, y - b, w + b * 2, h + b * 2, [0.07, 0.04, 0.02, a]);
        if (p.out) r.rect(x, y, w, h, [1, 1, 1, a], p.out.tex, [0, 0, 1, 1]);
      });
      r.endOverlay();
    }
    drawText(c, k) {
      if (this.done) return;
      const W = this.ui.hud.W, H = this.ui.hud.H;
      const rw = this.ui.r ? this.ui.r.W : W;
      const sx = W / rw;
      c.save();
      c.scale(sx, sx);
      this.panels.forEach((p, i) => {
        const t0 = i * 0.55 + 0.25;
        if (this.t < t0) return;
        const a = Math.min(1, (this.t - t0) * 5);
        const [x, y, w, h] = p.rect;
        c.save(); c.globalAlpha = a;
        c.beginPath(); c.rect(x - 2, y - 2, w + 4, h + 4); c.clip();
        for (const tx of p.spec.text || []) this.drawElem(c, tx, p, x, y, w, h, k);
        c.restore();
      });
      if (this.t > this.revealT()) {
        const [px, py, pw, ph] = this.L.page;
        const blink = 0.6 + 0.4 * Math.sin(this.t * 5);
        c.globalAlpha = blink;
        c.fillStyle = '#c82818'; c.font = `${Math.round(18 * k)}px Impact, "Arial Black", sans-serif`; c.textAlign = 'right'; c.textBaseline = 'bottom';
        c.fillText(this.page < this.pages.length - 1 ? 'ДАЛЕЕ ▶' : 'КОНЕЦ СЦЕНЫ ▶', px + pw - 10, py + ph - 4);
        c.globalAlpha = 0.7; c.fillStyle = '#3a2a1a'; c.font = `${Math.round(11 * k)}px ${COMIC}`; c.textAlign = 'left';
        c.fillText((this.page + 1) + ' / ' + this.pages.length + '   [Esc] — пропустить', px + 10, py + ph - 6);
      }
      c.restore();
    }
    drawElem(c, e, p, x, y, w, h, k) {
      const fs = Math.max(11, Math.min(17, h * 0.055)) * (e.size || 1) * (k > 1.2 ? 1.1 : 1);
      const bx = x + (e.x || 0) * w, by = y + (e.y || 0) * h;
      if (e.k === 'sfx') {
        const size = Math.min(w * 0.12, h * 0.18) * (e.size || 1);
        c.save();
        c.font = `${Math.round(size)}px Impact, sans-serif`;
        const tw = c.measureText(e.t).width;
        c.restore();
        X.hudWord(c, e.t, Math.min(bx + tw / 2, x + w - tw / 2 - 6), by + size * 0.7, size, e.style === 'explode' ? 'explode' : 'hit', 1, X.hash(e.t), 0);
        return;
      }
      const maxW = (e.w || 0.5) * w;
      c.font = `bold ${Math.round(fs)}px ${COMIC}`;
      const lines = X.hudWrap(c, e.k === 'cap' ? e.t : e.t.toUpperCase(), maxW - 14);
      const lw = Math.max(...lines.map(l => c.measureText(l).width));
      const bw = lw + 20, bh = lines.length * (fs + 3) + 12;
      if (e.k === 'cap') {
        c.fillStyle = e.bg || '#f6e27a'; c.strokeStyle = INK; c.lineWidth = 2.5;
        c.fillRect(bx, by, bw, bh); c.strokeRect(bx, by, bw, bh);
        c.fillStyle = INK; c.textBaseline = 'top'; c.textAlign = 'left';
        lines.forEach((l, i) => c.fillText(l, bx + 10, by + 6 + i * (fs + 3)));
        return;
      }
      let tx, ty;
      if (e.who !== undefined && p.pups[e.who] && p.view) {
        const head = p.pups[e.who].bones.head;
        const q = X.M4.project(p.view.VP, [head[0], head[1] + 0.05, head[2]]);
        if (q) { tx = x + (q[0] * 0.5 + 0.5) * w; ty = y + (1 - (q[1] * 0.5 + 0.5)) * h; }
      } else if (e.tail) { tx = x + e.tail[0] * w; ty = y + e.tail[1] * h; }
      if (ty !== undefined) ty = Math.max(by + bh + 12, Math.min(ty - 14, by + bh + h * 0.4));
      X.hudBalloon(c, bx, by, bw, bh, tx, ty, e.k === 'say' ? 'speech' : e.k);
      c.fillStyle = INK; c.textBaseline = 'top'; c.textAlign = 'center';
      lines.forEach((l, i) => c.fillText(l, bx + bw / 2, by + 6 + i * (fs + 3)));
    }
  }
  X.Comic = Comic;

  const SKIN = '#e8c29e';
  X.comicArt = function (c, kind, W, H, o) {
    const T = X.Tex, r = X.rng(X.hash(kind));
    const dots = (col, alpha, step) => {
      c.save(); c.fillStyle = col; c.globalAlpha = alpha;
      const st = step || Math.max(6, W / 50);
      for (let y = 0; y < H + st; y += st) for (let x = 0; x < W + st; x += st) { const k = (x / W + y / H) * 0.5; c.beginPath(); c.arc(x + (Math.floor(y / st) % 2) * st / 2, y, st * 0.42 * k, 0, 7); c.fill(); }
      c.restore();
    };
    const bg = (a, b) => { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    switch (kind) {
      case 'tattoo': {
        bg('#f0c8a0', '#c89068');
        c.fillStyle = '#d8a882';
        c.beginPath(); c.moveTo(0, H * 0.18); c.quadraticCurveTo(W * 0.3, H * 0.05, W * 0.55, 0); c.lineTo(W, 0); c.lineTo(W, H * 0.25); c.quadraticCurveTo(W * 0.6, H * 0.35, 0, H * 0.4); c.fill();
        T.ink(c, [[0, H * 0.4], [W * 0.35, H * 0.34], [W * 0.7, H * 0.3], [W, H * 0.24]], Math.max(3, W * 0.008), '#3a1c0c', 0.9);
        T.ink(c, [[W * 0.1, H * 0.62], [W * 0.4, H * 0.55], [W * 0.75, H * 0.58]], Math.max(3, W * 0.01), '#6a3a1c', 0.8);
        T.hatch(c, 0, H * 0.6, W, H * 0.4, 0.6, 8, '#6a3a1c', 0.25, 1.5, r);
        c.save(); c.translate(W * 0.46, H * 0.46); c.rotate(-0.12);
        c.font = `bold ${Math.round(H * 0.24)}px Georgia, "Times New Roman", serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(20,34,74,0.92)'; c.fillText('XIII', 0, 0);
        c.globalAlpha = 0.25; c.fillText('XIII', 2, 3);
        c.restore();
        dots('#7a3a18', 0.18);
        break;
      }
      case 'key': {
        bg('#6a4428', '#3a2414');
        for (let i = 0; i < 16; i++) T.wobbleLine(c, 0, r() * H, W, r() * H, 1.5, '#2a160a', 0.4, r, 6, 6);
        c.save(); c.translate(W * 0.42, H * 0.55); c.rotate(-0.35);
        c.fillStyle = '#e0b040'; c.strokeStyle = '#2a1a08'; c.lineWidth = Math.max(3, W * 0.008);
        c.beginPath(); c.arc(-W * 0.18, 0, H * 0.13, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#6a4428'; c.beginPath(); c.arc(-W * 0.18, 0, H * 0.05, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#e0b040'; c.fillRect(-W * 0.08, -H * 0.03, W * 0.3, H * 0.06); c.strokeRect(-W * 0.08, -H * 0.03, W * 0.3, H * 0.06);
        c.fillRect(W * 0.14, H * 0.02, W * 0.03, H * 0.07); c.strokeRect(W * 0.14, H * 0.02, W * 0.03, H * 0.07);
        c.fillRect(W * 0.19, H * 0.02, W * 0.025, H * 0.05); c.strokeRect(W * 0.19, H * 0.02, W * 0.025, H * 0.05);
        c.restore();
        c.save(); c.translate(W * 0.7, H * 0.4); c.rotate(0.18);
        c.fillStyle = '#f2e6c0'; c.strokeStyle = '#2a1a08'; c.lineWidth = 3;
        c.fillRect(-W * 0.14, -H * 0.12, W * 0.28, H * 0.24); c.strokeRect(-W * 0.14, -H * 0.12, W * 0.28, H * 0.24);
        c.fillStyle = '#2a1a08'; c.textAlign = 'center';
        c.font = `bold ${Math.round(H * 0.05)}px Georgia, serif`; c.fillText('WINSLOW BANK', 0, -H * 0.03);
        c.font = `bold ${Math.round(H * 0.1)}px Georgia, serif`; c.fillText('1313', 0, H * 0.09);
        c.restore();
        dots('#1a0a04', 0.25);
        break;
      }
      case 'photo': {
        bg('#8a6a44', '#5a3c22');
        c.save(); c.translate(W / 2, H / 2); c.rotate(-0.06);
        const pw = W * 0.62, ph = H * 0.78;
        c.fillStyle = '#f4efe2'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
        c.fillStyle = '#7a90a0'; c.fillRect(-pw / 2 + 10, -ph / 2 + 10, pw - 20, ph * 0.72);
        c.fillStyle = '#e8c8a0';
        for (const [x, hc] of [[-pw * 0.16, '#e8c470'], [pw * 0.16, '#f0d890']]) {
          c.fillStyle = '#2a3a5a'; c.fillRect(x - pw * 0.12, -ph * 0.02, pw * 0.24, ph * 0.3);
          c.fillStyle = SKIN; c.beginPath(); c.arc(x, -ph * 0.14, ph * 0.1, 0, 7); c.fill();
          c.fillStyle = hc; c.beginPath(); c.arc(x, -ph * 0.18, ph * 0.1, Math.PI, 0); c.fill();
        }
        c.fillStyle = '#2a1a0c'; c.font = `italic ${Math.round(ph * 0.07)}px Georgia, serif`; c.textAlign = 'center';
        c.fillText(o.caption || 'Стив и Ким, Келлоуни, 1986', 0, ph * 0.43);
        c.strokeStyle = '#2a1a0c'; c.lineWidth = 3; c.strokeRect(-pw / 2, -ph / 2, pw, ph);
        c.restore();
        dots('#1a0a04', 0.2);
        break;
      }
      case 'newspaper': {
        bg('#ece4cc', '#cfc3a4');
        c.fillStyle = '#1a1a1a'; c.textAlign = 'center';
        c.font = `bold ${Math.round(H * 0.1)}px Georgia, serif`; c.fillText('THE NEW YORK DAILY', W / 2, H * 0.14);
        c.fillRect(W * 0.05, H * 0.17, W * 0.9, 3);
        c.font = `${Math.round(H * 0.13)}px Impact, sans-serif`; c.fillText(o.head || 'ПРЕЗИДЕНТ ШЕРИДАН УБИТ!', W / 2, H * 0.34);
        c.fillStyle = '#9aa2a8'; c.fillRect(W * 0.08, H * 0.42, W * 0.36, H * 0.46);
        c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(W * 0.26, H * 0.58, H * 0.1, 0, 7); c.fill(); c.fillRect(W * 0.14, H * 0.66, W * 0.24, H * 0.22);
        c.fillStyle = '#1a1a1a'; c.font = `bold ${Math.round(H * 0.045)}px Georgia, serif`; c.textAlign = 'left';
        const lines = X.hudWrap(c, o.text || 'Подозреваемый — бывший капитан Стив Роуланд. ФБР объявило розыск по всей стране. Мотивы убийцы остаются загадкой.', W * 0.44);
        lines.slice(0, 8).forEach((l, i) => c.fillText(l, W * 0.5, H * 0.47 + i * H * 0.055));
        dots('#000', 0.08);
        break;
      }
      case 'dossier': {
        bg('#5a3a20', '#2a1a0c');
        c.save(); c.translate(W / 2, H / 2); c.rotate(0.05);
        c.fillStyle = '#c8a870'; c.fillRect(-W * 0.36, -H * 0.42, W * 0.72, H * 0.84);
        c.fillStyle = '#e8dcc0'; c.fillRect(-W * 0.32, -H * 0.36, W * 0.64, H * 0.72);
        c.fillStyle = '#b01a10'; c.font = `${Math.round(H * 0.16)}px Impact, sans-serif`; c.textAlign = 'center'; c.fillText('XX', 0, -H * 0.14);
        c.font = `bold ${Math.round(H * 0.05)}px "Courier New", monospace`; c.fillStyle = '#1a1a1a';
        const names = o.names || ['I — ???', 'II — генерал Кэррингтон?', 'XIII — Стив Роуланд', 'XX — ...'];
        names.forEach((n, i) => c.fillText(n, 0, H * (0.0 + i * 0.07)));
        c.strokeStyle = '#b01a10'; c.lineWidth = 4; c.save(); c.rotate(-0.25); c.strokeRect(-W * 0.2, H * 0.22, W * 0.4, H * 0.1); c.fillStyle = '#b01a10'; c.font = `${Math.round(H * 0.06)}px Impact, sans-serif`; c.fillText('СОВ. СЕКРЕТНО', 0, H * 0.295); c.restore();
        c.restore();
        dots('#000', 0.15);
        break;
      }
      case 'silhouette': {
        bg(o.a || '#c83018', o.b || '#4a0a04');
        c.fillStyle = 'rgba(255,220,160,0.25)';
        for (let i = 0; i < 5; i++) c.fillRect(W * (0.1 + i * 0.18), H * 0.08, W * 0.12, H * 0.6);
        c.fillStyle = '#0e0604';
        c.beginPath(); c.arc(W * 0.5, H * 0.38, H * 0.14, 0, 7); c.fill();
        c.beginPath(); c.moveTo(W * 0.2, H); c.quadraticCurveTo(W * 0.24, H * 0.56, W * 0.5, H * 0.52); c.quadraticCurveTo(W * 0.76, H * 0.56, W * 0.8, H); c.fill();
        c.fillRect(W * 0.1, H * 0.78, W * 0.8, H * 0.05);
        if (o.glint) { c.fillStyle = '#ffe8a0'; c.fillRect(W * 0.45, H * 0.36, W * 0.035, H * 0.02); c.fillRect(W * 0.52, H * 0.36, W * 0.035, H * 0.02); }
        dots('#000', 0.3);
        break;
      }
      case 'phone': {
        bg('#e8b050', '#a8541c');
        c.save(); c.translate(W * 0.5, H * 0.55); c.rotate(-0.5);
        c.fillStyle = '#1a1a1a'; c.strokeStyle = '#000'; c.lineWidth = 4;
        c.beginPath(); c.ellipse(-W * 0.18, 0, W * 0.08, H * 0.12, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(W * 0.18, 0, W * 0.08, H * 0.12, 0, 0, 7); c.fill();
        c.fillRect(-W * 0.2, -H * 0.05, W * 0.4, H * 0.08);
        c.restore();
        c.strokeStyle = '#1a1a1a'; c.lineWidth = 3;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(W * 0.3, H * 0.3, 20 + i * 14, -1.2, -0.3); c.stroke(); }
        dots('#5a1a04', 0.25);
        break;
      }
      case 'eye': {
        bg('#f0c8a0', '#b88058');
        c.fillStyle = '#f6f2ea'; c.beginPath(); c.moveTo(W * 0.1, H * 0.5); c.quadraticCurveTo(W * 0.5, H * 0.08, W * 0.9, H * 0.5); c.quadraticCurveTo(W * 0.5, H * 0.82, W * 0.1, H * 0.5); c.fill();
        c.fillStyle = o.iris || '#3a5a7a'; c.beginPath(); c.arc(W * 0.5, H * 0.48, H * 0.2, 0, 7); c.fill();
        c.fillStyle = '#080404'; c.beginPath(); c.arc(W * 0.5, H * 0.48, H * 0.09, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(W * 0.46, H * 0.42, H * 0.035, 0, 7); c.fill();
        T.ink(c, [[W * 0.08, H * 0.52], [W * 0.3, H * 0.2], [W * 0.7, H * 0.18], [W * 0.92, H * 0.48]], Math.max(4, H * 0.03), '#1a0a04', 1);
        T.hatch(c, 0, 0, W, H * 0.2, 0.3, 7, '#5a2a10', 0.35, 1.5, r);
        dots('#6a2a10', 0.2);
        break;
      }
      case 'map': {
        bg('#e8dcb8', '#c8b488');
        c.strokeStyle = 'rgba(90,60,30,0.35)'; c.lineWidth = 1;
        for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(W * i / 8, 0); c.lineTo(W * i / 8, H); c.stroke(); c.beginPath(); c.moveTo(0, H * i / 8); c.lineTo(W, H * i / 8); c.stroke(); }
        for (let i = 0; i < 9; i++) {
          const cx = W * (0.08 + r() * 0.84), cy = H * (0.08 + r() * 0.5), s = W * (0.03 + r() * 0.03);
          c.fillStyle = '#b8a47a'; c.strokeStyle = '#5a4020'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx - s, cy + s * 0.8); c.lineTo(cx, cy - s); c.lineTo(cx + s, cy + s * 0.8); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#f4f0e4'; c.beginPath(); c.moveTo(cx - s * 0.35, cy - s * 0.3); c.lineTo(cx, cy - s); c.lineTo(cx + s * 0.35, cy - s * 0.3); c.closePath(); c.fill();
        }
        c.fillStyle = '#6a9ab8'; c.strokeStyle = '#2a4a6a'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(W * 0.72, H * 0.74, W * 0.16, H * 0.1, -0.2, 0, 7); c.fill(); c.stroke();
        const route = o.route || [[0.14, 0.2], [0.3, 0.42], [0.46, 0.5], [0.58, 0.66], [0.66, 0.72]];
        c.setLineDash([W * 0.02, W * 0.014]); c.strokeStyle = '#b01a10'; c.lineWidth = Math.max(3, W * 0.009);
        c.beginPath(); route.forEach((q, i) => { if (i) c.lineTo(W * q[0], H * q[1]); else c.moveTo(W * q[0], H * q[1]); }); c.stroke(); c.setLineDash([]);
        const end = route[route.length - 1];
        c.lineWidth = Math.max(3, W * 0.008);
        c.beginPath(); c.moveTo(W * end[0] - 12, H * end[1] - 12); c.lineTo(W * end[0] + 12, H * end[1] + 12); c.moveTo(W * end[0] + 12, H * end[1] - 12); c.lineTo(W * end[0] - 12, H * end[1] + 12); c.stroke();
        c.fillStyle = '#1a1a1a'; c.font = `bold ${Math.round(H * 0.06)}px Georgia, serif`; c.textAlign = 'center';
        c.fillText(o.label || 'ОЗ. КЕЛЛОУНИ', W * 0.72, H * 0.93);
        c.font = `italic ${Math.round(H * 0.045)}px Georgia, serif`; c.fillText(o.from || '«Эмеральд»', W * route[0][0], H * route[0][1] - H * 0.05);
        dots('#3a2a10', 0.12);
        break;
      }
      case 'boom': {
        bg('#ffd040', '#e05010');
        c.fillStyle = '#fff4c0'; c.strokeStyle = '#1a0a04'; c.lineWidth = 5;
        c.beginPath();
        for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, k = i % 2 ? 0.55 : 1; const x = W / 2 + Math.cos(a) * W * 0.42 * k, y = H / 2 + Math.sin(a) * H * 0.42 * k; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
        c.fill(); c.stroke();
        dots('#8a1a04', 0.25);
        break;
      }
      default: bg('#f0e0c0', '#c0a080');
    }
  };
})(globalThis.XIII = globalThis.XIII || {});
