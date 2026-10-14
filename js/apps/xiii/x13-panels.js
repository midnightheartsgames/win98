(function (X) {
  'use strict';
  const INK = '#120a06';
  const TINTS = {
    warm: { tint: 2, duoA: [0.3, 0.12, 0.04], duoB: [1, 0.66, 0.24] },
    sepia: { tint: 1, duoA: [0.32, 0.16, 0.12], duoB: [1, 0.86, 0.8] },
    red: { tint: 1, duoA: [0.28, 0.04, 0.02], duoB: [1, 0.72, 0.6] },
    blue: { tint: 1, duoA: [0.06, 0.1, 0.24], duoB: [0.8, 0.9, 1] },
    grey: { tint: 3, duoA: [0.15, 0.13, 0.12], duoB: [0.95, 0.92, 0.85] },
    none: { tint: 0 }
  };
  X.PANEL_TINTS = TINTS;

  class Panels {
    constructor(ui) {
      this.ui = ui;
      this.list = [];
      this.n = 0;
      this.enabled = true;
    }
    clear() {
      for (const p of this.list) if (this.ui.r) this.ui.r.freePanel(p);
      this.list = [];
    }
    add(p) {
      p.id = ++this.n;
      p.t = 0;
      p.shown = false;
      this.list.push(p);
      return p;
    }
    headshot(game, ch) {
      if (!this.enabled) return;
      if (this.list.some(p => p.kind === 'head' && p.t < 1.2)) return;
      for (const p of this.list.filter(q => q.kind === 'head')) p.dur = Math.min(p.dur, p.t + 0.3);
      const slots = [[0.05, 0.05, 0.2, 0.21], [0.265, 0.06, 0.215, 0.225], [0.495, 0.075, 0.23, 0.24]];
      const offs = [[0.85, 0.28, 0.06, 0], [0.6, -0.16, 0.02, 0], [0.46, 0.08, 0.12, 0.28]];
      slots.forEach((s, i) => {
        const o = offs[i];
        this.add({
          kind: 'head', x: s[0], y: s[1], w: s[2], h: s[3], dur: 2.9 - i * 0.12, delay: i * 0.22, captureAt: 0.03 + i * 0.22, frozen: true,
          tint: 'warm', border: '#fbf8ee', word: i === 1 ? 'AARGH' : null,
          cam: () => {
            const H = ch.headWorld || [ch.pos[0], ch.pos[1] + 1.62, ch.pos[2]];
            const f = X.fwd(ch.yaw, 0), r = X.right(ch.yaw);
            let pos = [H[0] + f[0] * o[0] + r[0] * o[1], H[1] + o[2], H[2] + f[2] * o[0] + r[2] * o[1]];
            const d = X.vsub(pos, H), l = X.vlen(d);
            const hit = game.world.ray(H, X.vscale(d, 1 / l), l, X.F.SIGHT);
            if (hit) pos = X.vma(H, Math.max(0.25, hit.t - 0.08), X.vscale(d, 1 / l));
            return { pos, look: [H[0], H[1] - 0.02, H[2]], fov: 36, roll: o[3] };
          }
        });
      });
    }
    fromEvent(e, game) {
      if (!this.enabled) return;
      if (e.kind === 'cam') {
        const cam = typeof e.cam === 'string' ? game.cams[e.cam] : null;
        if (!cam && !e.pos) return;
        const spec = cam || { pos: e.pos, look: e.look, fov: 40 };
        this.list.filter(p => p.slot === 'right').forEach(p => { p.dur = Math.min(p.dur, p.t + 0.2); });
        this.add({ kind: 'cam', slot: 'right', x: 0.74, y: 0.06, w: 0.22, h: 0.25, dur: e.dur || 2.6, delay: 0, captureAt: 0.02, frozen: !e.live, live: !!e.live, tint: e.tint || 'none', border: e.tint === 'red' ? '#b81c10' : '#fbf8ee', text: e.text, cam: () => ({ pos: spec.pos, look: spec.look, fov: spec.fov || 40 }) });
      } else if (e.kind === 'char') {
        const ch = game.char(e.id);
        if (!ch) return;
        this.list.filter(p => p.slot === 'left').forEach(p => { p.dur = Math.min(p.dur, p.t + 0.2); });
        this.add({
          kind: 'char', slot: 'left', x: 0.04, y: 0.2, w: 0.19, h: 0.44, dur: e.dur || 3, delay: 0, captureAt: 0.02, frozen: !e.live, live: !!e.live, tint: e.tint || 'sepia', border: '#a81a10', text: e.text,
          cam: () => {
            const f = X.fwd(ch.yaw + 0.6, 0);
            const c = [ch.pos[0], ch.pos[1] + 1.1, ch.pos[2]];
            let pos = [c[0] + f[0] * 3.2, c[1] + 0.4, c[2] + f[2] * 3.2];
            const d = X.vsub(pos, c), l = X.vlen(d);
            const hit = game.world.ray(c, X.vscale(d, 1 / l), l, X.F.SIGHT);
            if (hit) pos = X.vma(c, Math.max(0.6, hit.t - 0.15), X.vscale(d, 1 / l));
            return { pos, look: c, fov: 50 };
          }
        });
      } else if (e.kind === 'grenade') {
        this.grenade(game, e.id);
      } else if (e.kind === 'vehicle') {
        const v = game.vehicle(e.id);
        if (!v) return;
        this.list.filter(p => p.slot === 'right').forEach(p => { p.dur = Math.min(p.dur, p.t + 0.2); });
        this.add({
          kind: 'vehicle', slot: 'right', x: 0.7, y: 0.06, w: 0.26, h: 0.26, dur: e.dur || 3, delay: 0, live: true, tint: e.tint || 'none', border: e.tint === 'red' ? '#b81c10' : '#fbf8ee', text: e.text,
          cam: () => {
            const f = X.fwd(v.yaw || 0, 0), r = X.right(v.yaw || 0);
            return { pos: [v.pos[0] - f[0] * 9 + r[0] * 5, v.pos[1] + 1.6, v.pos[2] - f[2] * 9 + r[2] * 5], look: v.pos.slice(), fov: 46 };
          }
        });
      }
    }
    grenade(game, id) {
      if (!this.enabled || this.list.some(p => p.kind === 'grenade')) return;
      let last = null;
      const p = this.add({
        kind: 'grenade', x: 0.72, y: 0.07, w: 0.24, h: 0.24, dur: 6, delay: 0.25, live: true, tint: 'none', border: '#fbf8ee',
        cam: () => {
          const pr = game.projectiles.find(q => q.id === id);
          if (pr) {
            const v = X.vlen(pr.vel) > 0.5 ? X.vnorm([pr.vel[0], 0, pr.vel[2]]) : [0, 0, -1];
            last = { pos: [pr.pos[0] - v[0] * 2.4 + 0.6, pr.pos[1] + 1.3, pr.pos[2] - v[2] * 2.4 + 0.6], look: pr.pos.slice(), fov: 50 };
          } else if (!p.boomT) p.boomT = p.t;
          return last;
        }
      });
    }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.t += dt;
        if (p.boomT && p.t - p.boomT > 0.9) p.dur = Math.min(p.dur, p.t);
        if (p.t > p.dur + 0.3) { if (this.ui.r) this.ui.r.freePanel(p); this.list.splice(i, 1); }
      }
    }
    render(r, game) {
      if (!r || !this.list.length) return;
      let budget = 3;
      const W = r.W, H = r.H;
      for (const p of this.list) {
        if (budget <= 0) break;
        const need = p.live ? (p.t >= p.delay && p.t < p.dur) : (!p.rendered && p.t >= (p.captureAt || 0));
        if (!need) continue;
        const cam = p.cam();
        if (!cam) continue;
        p.pw = Math.max(64, Math.min(512, Math.round(p.w * W)));
        p.ph = Math.max(48, Math.min(512, Math.round(p.h * H)));
        const tint = TINTS[p.tint] || TINTS.none;
        r.renderPanel(p, cam, { post: { tint: tint.tint, duoA: tint.duoA, duoB: tint.duoB, lineW: 1.2 }, noFx: false, showPlayer: p.kind !== 'head' });
        p.rendered = true;
        budget--;
      }
    }
    draw(r) {
      if (!r || !this.list.length) return;
      r.beginOverlay();
      const W = r.W, H = r.H;
      for (const p of this.list) {
        if (!p.out || p.t < p.delay) continue;
        const a = Math.min(1, (p.t - p.delay) * 7) * Math.min(1, Math.max(0, (p.dur + 0.3 - p.t) / 0.3));
        const k = 0.92 + 0.08 * Math.min(1, (p.t - p.delay) * 7);
        const w = p.w * W * k, h = p.h * H * k;
        const x = p.x * W + (p.w * W - w) / 2, y = p.y * H + (p.h * H - h) / 2;
        const b = Math.max(3, Math.round(H * 0.008));
        const bc = hex(p.border || '#ffffff');
        r.rect(x - b - 2, y - b - 2, w + (b + 2) * 2, h + (b + 2) * 2, [0.07, 0.04, 0.02, a]);
        r.rect(x - b, y - b, w + b * 2, h + b * 2, [bc[0], bc[1], bc[2], a]);
        r.rect(x - 1.5, y - 1.5, w + 3, h + 3, [0.07, 0.04, 0.02, a]);
        r.rect(x, y, w, h, [1, 1, 1, a], p.out.tex, [0, 0, 1, 1]);
      }
      r.endOverlay();
    }
    drawCaptions(c, k) {
      const r = this.ui.r;
      if (!r) return;
      const W = r.W ? this.ui.hud.W : 0, H = this.ui.hud.H;
      for (const p of this.list) {
        if (!p.out || p.t < p.delay) continue;
        const a = Math.min(1, (p.t - p.delay) * 5) * Math.min(1, Math.max(0, (p.dur + 0.2 - p.t) / 0.3));
        const x = p.x * W, y = p.y * H, w = p.w * W, h = p.h * H;
        if (p.text) {
          c.save(); c.globalAlpha = a;
          c.font = `bold ${Math.round(12 * k)}px "Comic Sans MS", cursive`;
          const tw = c.measureText(p.text).width + 12 * k;
          c.fillStyle = '#f6e27a'; c.strokeStyle = INK; c.lineWidth = 2;
          c.fillRect(x + 6 * k, y + h - 24 * k, tw, 18 * k); c.strokeRect(x + 6 * k, y + h - 24 * k, tw, 18 * k);
          c.fillStyle = INK; c.textBaseline = 'middle'; c.fillText(p.text, x + 12 * k, y + h - 15 * k);
          c.restore();
        }
        if (p.word) X.hudWord(c, p.word, x + w * 0.62, y + h * 0.18, 64 * k, 'scream', a, p.id * 17, p.t);
      }
    }
  }
  function hex(s) { const n = parseInt(s.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  X.Panels = Panels;
})(globalThis.XIII = globalThis.XIII || {});
