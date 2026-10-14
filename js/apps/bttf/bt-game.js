(function (S, B) {
  'use strict';
  const { blit, rectFill, frameRect } = S;
  const C = B.C;
  const POCKET = { h: 64, x0: 12, cw: 54, slot: 50, sh: 44, cols: 9, btn: [{ id: 'hint', x: 520, w: 50, label: 'Думай, Макфлай!' }, { id: 'menu', x: 576, w: 54, label: 'Меню' }] };
  const PANEL = { h: 136, px: 10, pw: 104, ph: 116, ox: 126, row: 18, rows: 6 };

  function exitDir(g, h) {
    if (h.exitDir) return h.exitDir;
    const r = h.rect || [h.poly[0], h.poly[1], 0, 0];
    const cx = r[0] + r[2] / 2 - g.camX;
    if (cx < g.W * 0.25) return 'w';
    if (cx > g.W * 0.75) return 'e';
    return r[1] + r[3] > g.H * 0.8 ? 's' : 'n';
  }

  class Game extends S.Game {
    genericItem(item, p) { return B.wrongItem(this, p) || super.genericItem(item, p); }

    constructor(o) {
      super(o);
      this.pocketT = 0;
      this.pocketAuto = false;
      this.rushing = false;
      this.ui = [];
    }

    get pocketY() { return this.H - POCKET.h * this.pocketT; }

    boxHit() { return false; }

    primary(p) {
      const h = p.h || {};
      if (h.act) return typeof h.act === 'function' ? h.act(this) : h.act;
      if (h.exit) return 'exit';
      if (p.kind === 'actor') return h.talk || h.talkTo ? 'talk' : h.use ? 'use' : 'look';
      if (h.use) return 'use';
      if (h.talk) return 'talk';
      return 'look';
    }

    invSlot(x, y) {
      if (!this.invOpen || y < this.pocketY + 8 || y > this.pocketY + 8 + POCKET.sh) return -1;
      const col = Math.floor((x - POCKET.x0) / POCKET.cw);
      if (col < 0 || col >= POCKET.cols || x - POCKET.x0 - col * POCKET.cw > POCKET.slot) return -1;
      return col < this.inv.length ? col : -1;
    }

    pocketBtn(x, y) {
      if (!this.invOpen || y < this.pocketY + 8 || y > this.pocketY + 8 + POCKET.sh) return null;
      return POCKET.btn.find(b => x >= b.x && x < b.x + b.w) || null;
    }

    dialogTop() { return this.H - PANEL.h; }

    dialogSlot(x, y) {
      if (!this.dialog || this.busy) return -1;
      const top = this.dialogTop() + 10;
      if (x < PANEL.ox - 4 || y < top) return -1;
      const i = Math.floor((y - top) / PANEL.row);
      return i >= 0 && i < Math.min(PANEL.rows, this.dialogOptions().length) ? i : -1;
    }

    pointer(x, y) {
      this.mx = x; this.my = y;
      this.hover = null;
      if (this.mode !== 'room') { if (this.drive && this.drive.pointer) this.drive.pointer(x, y); return; }
      if (this.dialog) {
        const i = this.dialogSlot(x, y);
        if (i >= 0) this.hover = { kind: 'opt', i, opt: this.dialogOptions()[i] };
        return;
      }
      if (this.cutscene) return;
      if (!this.invOpen && y >= this.H - 4) { this.invOpen = true; this.pocketAuto = true; }
      if (this.invOpen && this.pocketAuto && y < this.H - POCKET.h - 16) { this.invOpen = false; this.pocketAuto = false; }
      if (this.invOpen && y >= this.pocketY) {
        const i = this.invSlot(x, y);
        if (i >= 0) { this.hover = { kind: 'inv', id: this.inv[i] }; return; }
        const b = this.pocketBtn(x, y);
        if (b) this.hover = { kind: 'btn', id: b.id, label: b.label };
        return;
      }
      const p = this.pick(x, y);
      if (p) this.hover = p;
    }

    hoverLabel() {
      const h = this.hover;
      if (h && h.kind === 'btn') return h.label;
      return super.hoverLabel();
    }

    cursorKind() {
      if (this.cutscene && !this.dialog) return 'wait';
      const h = this.hover;
      if (!h || h.kind === 'opt' || h.kind === 'btn' || h.kind === 'inv') return 'arrow';
      const v = this.primary(h);
      if (v === 'exit') return exitDir(this, h.h);
      return v === 'talk' ? 'talk' : v === 'look' ? 'look' : 'use';
    }

    togglePockets() {
      if (this.busy || this.dialog || this.mode !== 'room') return;
      this.invOpen = !this.invOpen;
      this.pocketAuto = false;
      this.pointer(this.mx, this.my);
    }

    walkTo(id, x, y, o) {
      const r = super.walkTo(id, x, y, o);
      const a = this.actors[id];
      if (id === this.player && this.rushing && a && a.path) a.speedMul = 2.1;
      return r;
    }

    update(dt) {
      super.update(dt);
      const want = this.invOpen && this.mode === 'room' && !this.dialog ? 1 : 0;
      this.pocketT = S.approach(this.pocketT, want, Math.min(dt, 0.1) * 7);
      const p = this.actors[this.player];
      if (this.rushing && p && !p.path && !this.busy) this.rushing = false;
    }

    click(x, y, btn, dbl) {
      this.pointer(x, y);
      if (this.mode !== 'room') { if (this.drive && this.drive.click) this.drive.click(x, y, btn); return; }
      if (this.dialog) {
        if (this.busy) { this.skipLine(); return; }
        const i = this.dialogSlot(x, y);
        if (i >= 0) this.choose(this.dialogOptions()[i].id);
        return;
      }
      if (this.cutscene) { this.skipLine(); return; }
      if (this.speech.length) this.skipLine();
      if (this.invOpen && y >= this.pocketY) {
        const i = this.invSlot(x, y);
        if (i >= 0) {
          const id = this.inv[i];
          if (btn === 2) { this.perform('look', { kind: 'item', id }); return; }
          if (this.held && this.held !== id) { const it = this.held; this.held = null; this.perform('use', { kind: 'item', id }, it); return; }
          this.held = this.held === id ? null : id;
          if (this.held) { this.invOpen = false; this.pocketAuto = false; }
          return;
        }
        const b = this.pocketBtn(x, y);
        if (b) { this.ui.push(b.id); this.invOpen = false; this.pocketAuto = false; }
        return;
      }
      if (this.invOpen && !this.pocketAuto) { this.invOpen = false; return; }
      const p = this.pick(x, y);
      if (p && p.kind === 'actor' && p.h && p.h.hold) { p.a.path = null; this.vt = this.vt || {}; this.vt.hold = this.time + 10; }
      if (btn === 2) {
        if (this.held) { this.held = null; return; }
        if (p) this.perform('look', p);
        return;
      }
      this.rushing = !!dbl;
      if (this.held) {
        if (p) { const it = this.held; this.held = null; this.perform('use', p, it); }
        else this.held = null;
        return;
      }
      if (p) {
        const v = this.primary(p);
        if (v === 'exit' && dbl) {
          const info = this.targetInfo(p);
          if (info.walk) { const a = this.actors[this.player]; const q = this.snap(info.walk[0], info.walk[1]); a.x = q[0]; a.y = q[1]; a.path = null; }
        }
        this.perform(v, p);
        return;
      }
      this.walkPlayer(x + this.camX, y);
    }
  }

  B.wrongItem = function (g, p) {
    const lines = p.kind === 'actor' && g.ep.WRONG && g.ep.WRONG[p.id];
    if (!lines) return null;
    const line = lines[g.rng.int(lines.length)], id = p.id;
    return function* (gg) { yield gg.say(id, line); };
  };

  class Renderer extends S.Renderer {
    constructor(o) {
      o = o || {};
      super({ w: o.w || 640, h: o.h || 480, pal: B.PAL, font: B.font, wrap: o.wrap || 300 });
      this.ep = o.ep;
    }

    render(g) {
      const fl = g.fx && g.fx.flash;
      if (g.softFlash && fl > 0.25) g.fx.flash = 0.25;
      try { return super.render(g); } finally { if (g.fx) g.fx.flash = fl; }
    }

    renderUI(g) {
      if (g.mode !== 'room' || g.ended || g.hideUI) return;
      if (g.dialog) {
        if (!g.busy) this.dialogPanel(g);
        this.pointer(g);
        return;
      }
      if (g.cutscene) { this.pointer(g); return; }
      if (g.pocketT > 0.01) this.pockets(g);
      else if (!g.held) this.pocketTab(g);
      const label = g.hoverLabel();
      if (label) this.label(g, label);
      this.pointer(g);
    }

    label(g, text) {
      const f = this.frame, fn = this.font;
      const w = fn.measure(text);
      let lx = Math.round(g.mx - w / 2), ly = g.my - 22;
      if (g.hover && (g.hover.kind === 'inv' || g.hover.kind === 'btn')) ly = Math.round(g.pocketY) - 16;
      if (ly < 4) ly = g.my + 22;
      lx = Math.max(4, Math.min(this.W - 4 - w, lx));
      const exit = g.hover && g.hover.h && g.hover.h.exit;
      fn.draw(f, text, lx, ly, exit ? C.gold[4] : C.snow[4]);
    }

    pointer(g) {
      const f = this.frame;
      if (g.held && !g.dialog) {
        const ic = S.icon(g.itemIcon(g.held));
        blit(f, ic, Math.round(g.mx - ic.w / 2), Math.round(g.my - ic.h / 2));
        return;
      }
      const kind = g.cursorKind();
      const hot = kind !== 'arrow' && kind !== 'wait' && Math.floor(g.time * 3) % 2 === 0;
      const cur = B.cursor(kind, hot || (g.hover && g.hover.kind === 'opt'));
      blit(f, cur.buf, Math.round(g.mx - cur.hx), Math.round(g.my - cur.hy));
    }

    bevel(x, y, w, h, ramp) {
      const f = this.frame;
      rectFill(f, x, y, w, h, ramp[1]);
      for (let xx = x; xx < x + w; xx++) { f.set(xx, y, ramp[3]); f.set(xx, y + h - 1, ramp[0]); }
      for (let yy = y; yy < y + h; yy++) { f.set(x, yy, ramp[3]); f.set(x + w - 1, yy, ramp[0]); }
      frameRect(f, x - 1, y - 1, w + 2, h + 2, C.black);
    }

    pocketTab(g) {
      const f = this.frame, y = this.H - 5;
      rectFill(f, 280, y, 80, 5, C.denim[1]);
      for (let x = 280; x < 360; x++) f.set(x, y, C.denim[3]);
      for (let x = 312; x < 328; x += 3) f.set(x, y + 2, C.vest[3]);
    }

    pockets(g) {
      const f = this.frame, fn = this.font;
      const y0 = Math.round(g.pocketY);
      this.bevel(0, y0, this.W, 64, C.denim);
      for (let x = 0; x < this.W; x += 4) f.set(x, y0 + 3, C.denim[2]);
      for (let i = 0; i < 9; i++) {
        const x = POCKET.x0 + i * POCKET.cw, y = y0 + 8;
        rectFill(f, x, y, POCKET.slot, POCKET.sh, C.denim[0]);
        frameRect(f, x, y, POCKET.slot, POCKET.sh, C.denim[2]);
        const id = g.inv[i];
        if (!id) continue;
        const hov = g.hover && g.hover.kind === 'inv' && g.hover.id === id;
        if (hov) frameRect(f, x, y, POCKET.slot, POCKET.sh, C.gold[4]);
        if (g.held === id) frameRect(f, x + 1, y + 1, POCKET.slot - 2, POCKET.sh - 2, C.vest[4]);
        const ic = S.icon(g.itemIcon(id));
        blit(f, ic, x + Math.floor((POCKET.slot - ic.w) / 2), y + Math.floor((POCKET.sh - ic.h) / 2));
      }
      for (const b of POCKET.btn) {
        const hov = g.hover && g.hover.kind === 'btn' && g.hover.id === b.id;
        this.bevel(b.x, y0 + 8, b.w, POCKET.sh, hov ? C.vest : C.steel);
        fn.drawCentered(f, b.id === 'hint' ? '?' : 'МЕНЮ', b.x + b.w / 2, y0 + 26, C.snow[4]);
      }
    }

    dialogPanel(g) {
      const f = this.frame, fn = this.font;
      const top = g.dialogTop();
      this.bevel(0, top, this.W, PANEL.h, C.navy);
      const conv = g.ep.TALK[g.dialog.id];
      const who = conv.portrait || g.dialog.id;
      this.bevel(PANEL.px, top + 10, PANEL.pw, PANEL.ph, C.slate);
      const draw = g.ep.PORTRAITS && g.ep.PORTRAITS[who];
      if (draw) draw(f, PANEL.px + 2, top + 12, PANEL.pw - 4, PANEL.ph - 4, g);
      else fn.drawCentered(f, (g.actors[who] && g.actors[who].name) || who, PANEL.px + PANEL.pw / 2, top + 60, C.snow[3]);
      const opts = g.dialogOptions().slice(0, PANEL.rows);
      opts.forEach((o, i) => {
        const hov = g.hover && g.hover.kind === 'opt' && g.hover.i === i;
        const used = g.used[g.dialog.id + '.' + o.id];
        const col = hov ? C.gold[4] : used ? C.vest[2] : C.vest[4];
        const y = top + 12 + i * PANEL.row;
        fn.draw(f, (i + 1) + '.', PANEL.ox, y, col);
        const lines = fn.wrap(o.text, this.W - PANEL.ox - 34);
        fn.draw(f, lines[0] + (lines.length > 1 ? '...' : ''), PANEL.ox + 16, y, col);
      });
    }
  }

  Object.assign(B, { Game, Renderer, POCKET, PANEL, exitDir });
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
