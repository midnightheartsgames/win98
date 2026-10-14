(function (S) {
  'use strict';
  const { W, H, C, Buf, blit, font, INV, PANEL, BAR } = S;
  const CLOSEUPS = S.CLOSEUPS = S.CLOSEUPS || {};

  function rectFill(f, x, y, w, h, c) {
    for (let yy = Math.max(0, y); yy < Math.min(f.h, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(f.w, x + w); xx++) f.px[yy * f.w + xx] = c;
  }
  function frameRect(f, x, y, w, h, c) {
    for (let xx = x; xx < x + w; xx++) { f.set(xx, y, c); f.set(xx, y + h - 1, c); }
    for (let yy = y; yy < y + h; yy++) { f.set(x, yy, c); f.set(x + w - 1, yy, c); }
  }
  function panel(f, x, y, w, h, ramp) {
    rectFill(f, x, y, w, h, ramp[2]);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (S.hash(xx, yy, 5) < 0.08) f.px[yy * f.w + xx] = ramp[1];
    for (let xx = x; xx < x + w; xx++) { f.set(xx, y, C.black); f.set(xx, y + 1, ramp[4]); f.set(xx, y + h - 1, C.black); f.set(xx, y + h - 2, ramp[0]); }
    for (let yy = y; yy < y + h; yy++) { f.set(x, yy, C.black); f.set(x + 1, yy, ramp[4]); f.set(x + w - 1, yy, C.black); f.set(x + w - 2, yy, ramp[0]); }
  }

  class Renderer {
    constructor(o) {
      o = o || {};
      this.W = o.w || W; this.H = o.h || H;
      this.pal = o.pal || S.PAL0;
      this.font = o.font || font;
      this.wrapW = o.wrap || 196;
      this.frame = new Buf(this.W, this.H);
      this.tmp = new Buf(this.W, this.H);
      this.bgCache = new Map();
      this.layerCache = new Map();
      this.lut = new Uint8Array(256 * 3);
    }

    roomBg(g) {
      const room = g.room;
      const key = g.roomId + '|' + (room.bgKey ? room.bgKey(g) : '');
      let b = this.bgCache.get(key);
      if (!b) {
        b = new Buf(room.w, this.H, 1);
        room.paint(b, g);
        if (this.bgCache.size > 10) this.bgCache.delete(this.bgCache.keys().next().value);
        this.bgCache.set(key, b);
      }
      return b;
    }

    layer(g, L) {
      const key = g.roomId + '.' + L.id + '|' + (L.key ? L.key(g) : '');
      let b = this.layerCache.get(key);
      if (!b) {
        const art = g.ep.LAYERS[L.src || g.roomId][L.art || L.id];
        b = art(g);
        if (this.layerCache.size > 200) this.layerCache.clear();
        this.layerCache.set(key, b);
      }
      return b;
    }

    render(g) {
      const prev = S.pal;
      S.pal = this.pal;
      try {
        const f = this.frame;
        if (g.mode !== 'room' && g.drive) g.drive.render(f, g, this);
        else if (g.closeup && CLOSEUPS[g.closeup.kind]) CLOSEUPS[g.closeup.kind](f, g, g.closeup, this);
        else if (g.room) this.renderRoom(g);
        else f.px.fill(C.black);
        if (g.fx.flip > 0.001) this.flip(g.fx.flip);
        this.renderSpeech(g);
        this.renderUI(g);
        if (g.fx.shake > 0) this.shake(g);
        return f;
      } finally { S.pal = prev; }
    }

    renderRoom(g) {
      const f = this.frame, room = g.room, W = this.W, H = this.H;
      const bg = this.roomBg(g);
      const cx = Math.round(g.camX);
      for (let y = 0; y < H; y++) f.px.set(bg.px.subarray(y * bg.w + cx, y * bg.w + cx + W), y * W);
      if (room.drawBack) room.drawBack(f, g, cx, this);
      const items = [];
      for (const L of room.layers || []) {
        if (L.when && !L.when(g)) continue;
        const spr = this.layer(g, L);
        items.push({ y: L.base === undefined ? -1000 : L.base, draw: () => blit(f, spr, L.x - cx, L.y) });
      }
      for (const a of g.visibleActors()) {
        const { spr } = g.spriteFor(a);
        if (!spr) continue;
        items.push({ y: a.y + a.z, draw: () => blit(f, spr.buf, Math.round(a.x - spr.ox) - cx, Math.round(a.y - spr.oy), false, a.solid) });
      }
      if (room.sprites) for (const s of room.sprites(g)) items.push({ y: s.y, draw: () => s.draw(f, cx) });
      items.sort((p, q) => p.y - q.y);
      for (const it of items) it.draw();
      if (room.drawFront) room.drawFront(f, g, cx, this);
    }

    flip(t) {
      const f = this.frame, tmp = this.tmp, W = this.W, H = this.H;
      tmp.px.set(f.px);
      const sy = Math.cos(Math.PI * Math.min(1, t));
      const cy = H / 2;
      for (let y = 0; y < H; y++) {
        const rel = (y + 0.5 - cy);
        if (Math.abs(sy) < 0.04) { f.px.fill(C.black, y * W, y * W + W); continue; }
        const sy2 = cy + rel / sy;
        const src = Math.floor(sy2);
        if (src < 0 || src >= H) f.px.fill(C.black, y * W, y * W + W);
        else f.px.set(tmp.px.subarray(src * W, src * W + W), y * W);
      }
    }

    shake(g) {
      const f = this.frame, tmp = this.tmp;
      const dx = Math.round(Math.sin(g.time * 70) * 3 * g.fx.shake), dy = Math.round(Math.cos(g.time * 53) * 2 * g.fx.shake);
      if (!dx && !dy) return;
      tmp.px.set(f.px);
      f.px.fill(C.black);
      blit(f, tmp, dx, dy);
    }

    speechPos(g, sp) {
      if (sp.x !== undefined) return [sp.x, sp.y];
      const a = g.actors[sp.who];
      if (a && a.room === g.roomId && g.mode === 'room' && !g.closeup && a.visible) {
        const sc = g.actorScale(a);
        const cos = S.COSTUMES[a.costume];
        let top = a.y - (a.talkH || (cos ? cos.h : 60)) * sc - 4;
        if (g.fx.flip > 0.5) top = Math.min(this.H - 20, this.H - a.y + 30);
        return [a.x - g.camX, top];
      }
      return [this.W / 2, 60];
    }

    renderSpeech(g) {
      const f = this.frame, fn = this.font;
      for (const sp of g.speech) {
        if (sp.t < 0) continue;
        const [x, y] = this.speechPos(g, sp);
        const lines = fn.wrap(sp.text, sp.width || this.wrapW);
        fn.block(f, lines, x, Math.max(y, 4 + lines.length * fn.LINE_H), sp.color);
      }
    }

    renderUI(g) {
      const f = this.frame;
      if (g.mode !== 'room' || g.ended || g.hideUI) return;
      if (g.dialog) {
        if (!g.busy) this.dialogBar(g);
        this.pointer(g, !g.busy);
        return;
      }
      if (g.cutscene) return;
      const box = S.icon(g.invOpen ? 'boxOpen' : 'box');
      if (g.invOpen) this.inventory(g);
      if (!g.closeup) blit(f, box, INV.x, INV.y);
      const label = g.hoverLabel();
      if (label) {
        const w = font.measure(label);
        let lx = Math.round(g.mx - w / 2), ly = g.my - 16;
        if (ly < 2) ly = g.my + 12;
        lx = Math.max(2, Math.min(W - 2 - w, lx));
        font.draw(f, label, lx, ly, g.hover && g.hover.kind === 'hot' && g.hover.h.exit ? C.yellow[4] : C.grey[5]);
      }
      this.pointer(g, true);
    }

    pointer(g, active) {
      const f = this.frame;
      if (!active) return;
      if (g.held && !g.dialog) {
        const ic = S.icon(g.itemIcon(g.held));
        blit(f, ic, Math.round(g.mx - ic.w / 2), Math.round(g.my - ic.h / 2));
        return;
      }
      const verb = g.dialog ? 'use' : g.verb;
      const hot = !!(g.hover && (g.hover.kind === 'hot' || g.hover.kind === 'actor' || g.hover.kind === 'inv' || g.hover.kind === 'opt'));
      const cur = S.cursor(verb, hot && Math.floor(g.time * 4) % 2 === 0 ? true : hot);
      blit(f, cur.buf, Math.round(g.mx - cur.hx), Math.round(g.my - cur.hy));
    }

    inventory(g) {
      const f = this.frame;
      panel(f, 0, PANEL.y, W, PANEL.h, C.oak);
      for (let i = 0; i < PANEL.cols * 2; i++) {
        const col = i % PANEL.cols, row = Math.floor(i / PANEL.cols);
        const x = PANEL.x0 + col * PANEL.cw, y = PANEL.y + 3 + row * PANEL.ch;
        rectFill(f, x + 1, y + 1, PANEL.cw - 3, PANEL.ch - 3, C.oak[1]);
        frameRect(f, x, y, PANEL.cw - 1, PANEL.ch - 1, C.oak[0]);
        const id = g.inv[i];
        if (!id) continue;
        const hov = g.hover && g.hover.kind === 'inv' && g.hover.id === id;
        if (hov) frameRect(f, x, y, PANEL.cw - 1, PANEL.ch - 1, C.yellow[4]);
        if (g.held === id) frameRect(f, x + 1, y + 1, PANEL.cw - 3, PANEL.ch - 3, C.orange[4]);
        const ic = S.icon(g.itemIcon(id));
        blit(f, ic, x + Math.floor((PANEL.cw - 1 - ic.w) / 2), y + Math.floor((PANEL.ch - 1 - ic.h) / 2));
      }
    }

    dialogBar(g) {
      const f = this.frame;
      const opts = g.dialogOptions();
      rectFill(f, 0, BAR.y, W, BAR.h, C.night[0]);
      for (let x = 0; x < W; x++) f.set(x, BAR.y, C.orange[2]);
      const x0 = Math.max(BAR.x0, Math.floor((W - opts.length * BAR.cw) / 2));
      opts.forEach((o, i) => {
        const x = x0 + i * BAR.cw, y = BAR.y + 2;
        const hov = g.hover && g.hover.kind === 'opt' && g.hover.i === i;
        rectFill(f, x + 1, y + 1, BAR.cw - 4, BAR.h - 6, C.black);
        frameRect(f, x, y, BAR.cw - 2, BAR.h - 4, hov ? C.yellow[4] : C.orange[2]);
        frameRect(f, x + 1, y + 1, BAR.cw - 4, BAR.h - 6, hov ? C.orange[4] : C.orange[1]);
        const ic = S.icon(o.icon || 'q');
        blit(f, ic, x + Math.floor((BAR.cw - 2 - ic.w) / 2), y + Math.floor((BAR.h - 4 - ic.h) / 2));
      });
      const h = g.hover && g.hover.kind === 'opt' ? g.hover.opt : null;
      if (h && h.text) {
        const lines = font.wrap(h.text, 300);
        font.block(f, lines, W / 2, BAR.y - 2, S.COLORS.sam, 4, W - 4);
      }
    }

    buildLut(g) {
      const lut = this.lut, pal = this.pal;
      const PALETTE = pal.PALETTE, CYCLE = pal.CYCLE, EMISSIVE = pal.EMISSIVE;
      const CYCLE_RGB = pal.CYCLE_RGB || (pal.CYCLE_RGB = CYCLE.map(i => PALETTE[i].slice()));
      const off = Math.floor(g.time * (g.fx.hypno ? 14 : 5)) % 8;
      const fade = g.fade, flash = g.fx.flash;
      const dark = g.fx.dark, dream = g.fx.dream;
      for (let i = 0; i < 256; i++) {
        let rgb = PALETTE[i];
        const ci = CYCLE.indexOf(i);
        if (ci >= 0) rgb = CYCLE_RGB[(ci + off) % CYCLE.length];
        let r = rgb[0], gg = rgb[1], b = rgb[2];
        if (dark && !EMISSIVE[i]) { r = r * 0.1 + 2; gg = gg * 0.1 + 3; b = b * 0.16 + 12; }
        if (dream) { r = r * 0.82 + 34; gg = gg * 0.7 + 8; b = b * 0.85 + 46; }
        if (g.fx.tint) { const t = g.fx.tint; r = r * (1 - t[3]) + t[0] * t[3]; gg = gg * (1 - t[3]) + t[1] * t[3]; b = b * (1 - t[3]) + t[2] * t[3]; }
        r *= 1 - fade; gg *= 1 - fade; b *= 1 - fade;
        if (flash > 0) { r += (255 - r) * flash; gg += (255 - gg) * flash; b += (255 - b) * flash; }
        lut[i * 3] = r; lut[i * 3 + 1] = gg; lut[i * 3 + 2] = b;
      }
      return lut;
    }

    toRGBA(g, out) {
      const lut = this.buildLut(g);
      const px = this.frame.px;
      for (let i = 0, j = 0; i < px.length; i++, j += 4) {
        const c = px[i] * 3;
        out[j] = lut[c]; out[j + 1] = lut[c + 1]; out[j + 2] = lut[c + 2]; out[j + 3] = 255;
      }
      return out;
    }
  }

  Object.assign(S, { Renderer, rectFill, frameRect, panel });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
