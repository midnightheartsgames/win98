(function (H) {
  'use strict';
  const { W, HGT, TS, C } = H.UI_CONST;
  const G = H.Gfx;
  const JADE = '#7fffd4', JADE_DK = '#2a8a78';
  const UI = H.UI.prototype;
  const base = { applyEvent: UI.applyEvent, drawEnt: UI.drawEnt, drawWorld: UI.drawWorld, fieldKey: UI.fieldKey, battleKey: UI.battleKey, drawDamageBoard: UI.drawDamageBoard };
  const ARROW = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const BAYER = [[0, 0.5, 0.125, 0.625], [0.75, 0.25, 0.875, 0.375], [0.1875, 0.6875, 0.0625, 0.5625], [0.9375, 0.4375, 0.8125, 0.3125]];

  Object.assign(UI, {
    applyEvent(e) {
      if (e.t === 'lfmusic') { this.audio.music(e.id); return; }
      return base.applyEvent.call(this, e);
    },

    lfBlink() { return Math.floor(this.t * 3) % 2 === 0; },

    lfArrow(c, x, y, dir, col) {
      const [dx, dy] = ARROW[dir], cx = x + 16, cy = y + 16, px = -dy, py = dx;
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(cx + dx * 12, cy + dy * 12);
      c.lineTo(cx - dx * 6 + px * 8, cy - dy * 6 + py * 8);
      c.lineTo(cx - dx * 6 - px * 8, cy - dy * 6 - py * 8);
      c.closePath();
      c.fill();
    },

    lfDrawCargo(c, e) {
      const g = this.game, [cx, cy] = this.camera(), l = g.map.def.lanes[e.lane], [dx, dy] = ARROW[l.dir];
      e.ax += (e.x - e.ax) * 0.22;
      e.ay += (e.y - e.ay) * 0.22;
      const wide = l.wide || 1, x = Math.round(e.ax * TS - cx), y = Math.round(e.ay * TS - cy), w = (dx ? l.box : wide) * TS, h = (dy ? l.box : wide) * TS;
      const flat = g.laneBox(e.lane).every(([bx, by]) => g.trenchAt(bx, by));
      if (flat) {
        c.fillStyle = '#3e4a5c'; c.fillRect(x, y, w, h);
        c.fillStyle = '#c8552e'; c.fillRect(x + 4, y + 4, w - 8, h - 8);
        c.fillStyle = '#e07a4a'; c.fillRect(x + 4, y + 4, w - 8, 3);
        c.fillStyle = '#a03e20'; for (let i = 14; i < h - 8; i += 12) c.fillRect(x + 4, y + i, w - 8, 2);
        c.fillStyle = '#f0c040'; for (const [ax, ay] of [[x + 1, y + 1], [x + w - 4, y + 1], [x + 1, y + h - 4], [x + w - 4, y + h - 4]]) c.fillRect(ax, ay, 3, 3);
        return;
      }
      const lift = 16, top = y - lift, frontY = y + h - lift;
      c.fillStyle = 'rgba(8,12,24,0.28)'; c.fillRect(x + 2, y + h - 2, w - 2, 5);
      c.fillStyle = '#c8552e'; c.fillRect(x, top, w, h);
      c.fillStyle = '#e07a4a'; c.fillRect(x, top, w, 3);
      c.fillStyle = '#a03e20'; c.fillRect(x + 6, top + 8, w - 12, h - 16);
      c.fillStyle = '#b84a26'; c.fillRect(x + 8, top + 10, w - 16, h - 20);
      c.fillStyle = '#2e3a4c'; c.fillRect(x, frontY, w, lift);
      c.fillStyle = '#48586c'; c.fillRect(x, frontY, w, 2);
      c.fillStyle = '#1e2836'; c.fillRect(x + 4, frontY + 5, w - 8, lift - 8);
      c.fillStyle = '#f0c040'; for (let i = 8; i < w - 6; i += 14) c.fillRect(x + i, frontY + 8, 6, 2);
      c.fillStyle = '#4ad8c0'; c.fillRect(x + 2, frontY + 3, 2, lift - 5); c.fillRect(x + w - 4, frontY + 3, 2, lift - 5);
    },

    lfDrawDog(c, x, y, dir, f) {
      const flip = dir === 'left', bx = x + 16, by = y + 26;
      c.save();
      c.translate(bx, by);
      if (flip) c.scale(-1, 1);
      c.fillStyle = 'rgba(8,12,24,0.3)'; c.fillRect(-9, 3, 18, 3);
      c.fillStyle = '#d8dee8'; c.fillRect(-8, -8, 14, 7);
      c.fillStyle = '#3e4a5c'; for (const [lx, ly] of [[-7, f ? -1 : 0], [-2, f ? 0 : -1], [1, f ? -1 : 0], [4, f ? 0 : -1]]) c.fillRect(lx, ly, 2, 4);
      c.fillStyle = '#f4f8fa'; c.fillRect(3, -14, 8, 7);
      c.fillStyle = '#46a8a0'; c.fillRect(-8, -6, 11, 2);
      c.fillStyle = '#c8452a'; c.fillRect(1, -9, 3, 2);
      c.fillStyle = '#2e3a4c'; c.fillRect(4, -18, 2, 4); c.fillRect(8, -18, 2, 4); c.fillRect(11, -11, 2, 2);
      c.fillStyle = '#7fffd4'; c.fillRect(8, -12, 2, 2);
      c.fillStyle = '#3e4a5c'; c.fillRect(-11, -10 - f, 3, 2);
      c.restore();
    },

    drawEnt(c, e, x, y) {
      const g = this.game, on = this.lfBlink();
      switch (e.kind) {
        case 'cargo': return this.lfDrawCargo(c, e);
        case 'dispatch': {
          c.fillStyle = '#1e2836'; c.fillRect(x + 3, y - 2, 26, 32);
          c.fillStyle = '#48586c'; c.fillRect(x + 3, y - 2, 26, 2);
          c.fillStyle = on ? JADE : JADE_DK; c.fillRect(x + 7, y + 3, 18, 10);
          c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 8, y + 4, 8, 1);
          const l = g.map.def.lanes[e.def.lane], at = g.laneAt(e.def.lane);
          for (let i = l.min; i <= l.max; i++) { c.fillStyle = i === at ? '#ffd040' : '#55606e'; c.fillRect(x + 7 + (i - l.min) * 5, y + 19, 3, 5); }
          return;
        }
        case 'screen': {
          const live = g.screenOn(e);
          c.fillStyle = '#26303c'; c.fillRect(x + 3, y - 14, 26, 44);
          c.fillStyle = live ? (on ? JADE : JADE_DK) : '#44505c'; c.fillRect(x + 7, y - 10, 18, 36);
          c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 9, y - 8, 3, 32);
          return;
        }
        case 'pyxis': {
          const role = e.def.role;
          if (role === 'c') {
            const k = Math.floor(this.t * 2) % 2;
            c.fillStyle = '#1a1420'; c.fillRect(x + 2, y + 2, 28, 28);
            c.fillStyle = k ? '#c8d870' : '#7a9a3a'; c.fillRect(x + 8, y + 5, 3, 22); c.fillRect(x + 20, y + 5, 3, 22); c.fillRect(x + 5, y + 14, 22, 3);
            return;
          }
          c.fillStyle = '#26303c'; c.fillRect(x + 3, y + 3, 26, 26);
          c.strokeStyle = role === 'f' ? '#667' : on ? JADE : JADE_DK; c.lineWidth = 2; c.strokeRect(x + 4, y + 4, 24, 24);
          if (role === 't') { c.fillStyle = '#ffd040'; c.fillRect(x + 11, y + 11, 10, 10); }
          this.lfArrow(c, x, y, g.pyxisDir(e), role === 'f' ? '#99a' : role === 't' ? '#ffd040' : JADE);
          return;
        }
        case 'sconce': {
          const lit = g.sconceLit(e);
          c.fillStyle = 'rgba(8,12,24,0.3)'; c.fillRect(x + 3, y + 28, 26, 3);
          c.fillStyle = '#2a3640'; c.fillRect(x + 2, y + 18, 28, 11);
          c.fillStyle = '#6e7e88'; c.fillRect(x + 2, y + 18, 28, 2);
          if (e.def.plate) { c.fillStyle = JADE; for (let i = 0; i < e.def.n; i++) c.fillRect(x + 6 + i * 5, y + 22, 3, 5); }
          c.fillStyle = '#3a4650'; c.fillRect(x + 11, y + 2, 10, 16);
          c.fillStyle = '#6e7e88'; c.fillRect(x + 11, y + 2, 2, 16);
          c.fillStyle = '#2a3640'; c.fillRect(x + 5, y - 12, 22, 15);
          c.fillStyle = lit ? '#fff4b8' : on ? JADE : JADE_DK; c.fillRect(x + 9, y - 9, 14, 9);
          c.fillStyle = '#2a3640'; c.fillRect(x + 15, y - 9, 2, 9);
          c.fillStyle = '#56646e'; c.fillRect(x + 2, y - 16, 28, 4);
          c.fillStyle = '#7e8e98'; c.fillRect(x + 8, y - 20, 16, 4);
          c.fillStyle = '#56646e'; c.fillRect(x + 14, y - 24, 4, 4);
          if (lit) { c.fillStyle = 'rgba(255,230,140,0.12)'; c.fillRect(x - 4, y - 18, 40, 22); c.fillRect(x + 4, y - 26, 24, 38); c.fillStyle = 'rgba(255,230,140,0.2)'; c.fillRect(x + 2, y - 14, 28, 16); c.fillStyle = '#ffb040'; c.fillRect(x + 12, y - 8, 8, 7); c.fillStyle = '#fff4b8'; c.fillRect(x + 14, y - 6, 4, 4); }
          return;
        }
        case 'pit': return;
        case 'foeactor': { const d = H.ENEMIES[e.def.foe]; G.fieldEnemy(c, d, x, y, this.t, !!(d.elite || d.boss)); return; }
        case 'lfdog': return this.lfDrawDog(c, x, y, e.dir || 'down', Math.floor(this.t * 2) % 2);
        case 'lfmate': case 'lflead': {
          const [cx, cy] = this.camera(), px = e.fx * TS - cx, py = e.fy * TS - cy, f = e.prog < 1 ? (Math.floor(e.prog * 2) + 1) % 4 : 0;
          if (e.def.who === 'diting') return this.lfDrawDog(c, px, py, e.dir || 'down', f % 2);
          G.drawSprite(c, G.lookOf(e.def.who, g), e.dir || 'down', f, px, py);
          return;
        }
      }
      base.drawEnt.call(this, c, e, x, y);
      if (e.kind === 'exit' && e.def.label) {
        const w = this.measure(e.def.label, 10, true) + 10, ly = y - 30;
        c.fillStyle = 'rgba(8,12,28,0.72)'; c.fillRect(x + 16 - w / 2, ly - 2, w, 15);
        this.text(e.def.label, x + 16, ly + 1, { align: 'center', size: 10, bold: true, col: C.cyan });
      }
    },

    drawWorld(c) {
      base.drawWorld.call(this, c);
      const g = this.game, [cx, cy] = this.camera(), s = g.ditingCells ? g.ditingCells() : null;
      if (g.map.def.fog) this.lfDrawFog(c, g.map.def.fog, cx, cy);
      if (s) {
        c.fillStyle = s.col;
        s.cells.forEach(([x, y], i) => {
          const px = x * TS - cx, py = y * TS - cy, k = (i + 1) % 2 ? 6 : 18;
          c.globalAlpha = 0.9 - i * 0.05;
          c.fillRect(px + k, py + 12, 8, 8); c.fillRect(px + k + 1, py + 8, 2, 3); c.fillRect(px + k + 5, py + 8, 2, 3);
        });
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(20,12,24,0.82)'; c.fillRect(W / 2 - 86, 8, 172, 16);
        this.text(s.cells.length ? 'Дитин чует запах: ' + Math.ceil(s.left) + ' с' : 'Дитин: запах далеко, вернитесь к следу', W / 2, 10, { align: 'center', size: 10, bold: true, col: s.col });
      }
      const b = g.beam;
      if (b && g.state.time < b.until) {
        const left = (b.until - g.state.time) / 0.9;
        c.save();
        c.lineWidth = 6; c.strokeStyle = 'rgba(180,255,120,' + (0.3 + 0.5 * left) + ')';
        c.beginPath();
        for (const [x0, y0, x1, y1] of b.segs) { c.moveTo(x0 * TS - cx + 16, y0 * TS - cy + 16); c.lineTo(x1 * TS - cx + 16, y1 * TS - cy + 16); }
        c.stroke();
        c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,' + left + ')'; c.stroke();
        c.restore();
        for (const [x, y] of b.hit) { c.fillStyle = b.ok ? 'rgba(255,255,200,0.8)' : 'rgba(255,60,60,0.7)'; c.fillRect(x * TS - cx, y * TS - cy, TS, TS); }
      }
    },

    lfFogSheet() {
      if (this.lfFogCv) return this.lfFogCv;
      const cv = G.mkCanvas(160, 120), f = cv.getContext('2d'), TAU = Math.PI * 2;
      for (let y = 0; y < 120; y++) for (let x = 0; x < 160; x++) {
        const u = x / 160 * TAU, v = y / 120 * TAU, n = Math.sin(u * 2 + Math.sin(v) * 1.6) + Math.sin(v * 3 + Math.sin(u * 2) * 1.2) + Math.sin(u + v * 2) * 0.8;
        const a = Math.floor(Math.max(0, (n + 1.4) / 3.6) * 4 + BAYER[y & 3][x & 3]) / 4;
        if (a > 0) { f.fillStyle = 'rgba(112,214,150,' + Math.min(0.9, a) + ')'; f.fillRect(x, y, 1, 1); }
      }
      return (this.lfFogCv = cv);
    },

    lfDrawFog(c, fog, cx, cy) {
      const g = this.game, level = g.lfFogLevel(), sheet = this.lfFogSheet(), SW = 640, SH = 480;
      c.save();
      c.imageSmoothingEnabled = false;
      if (level > 0) for (const [sx, sy, k] of [[9, 3, 0.62], [-6, 5, 0.38]]) {
        const ox = (((this.t * sx + cx * 0.5) % SW) + SW) % SW, oy = (((this.t * sy + cy * 0.5) % SH) + SH) % SH;
        c.globalAlpha = level * k;
        for (const [ax, ay] of [[-ox, -oy], [SW - ox, -oy], [-ox, SH - oy], [SW - ox, SH - oy]]) c.drawImage(sheet, ax, ay, SW, SH);
      }
      c.globalAlpha = 1;
      for (const [x, y, flag] of fog.smoke || []) {
        if (g.state.flags[flag]) continue;
        const bx = x * TS - cx + 16, by = y * TS - cy;
        if (bx < -60 || bx > W + 60 || by < -40 || by > HGT + 160) continue;
        for (let i = 0; i < 8; i++) {
          const k = ((this.t * 0.35 + i / 8) % 1), sz = Math.round(8 + k * 20);
          c.globalAlpha = 0.5 * (1 - k);
          c.fillStyle = i % 2 ? '#c8ffd8' : '#70d696';
          c.fillRect(Math.round(bx + Math.sin(this.t + i * 2) * (4 + k * 14) - sz / 2), Math.round(by - k * 120), sz, Math.round(sz * 0.7));
        }
      }
      c.globalAlpha = 1;
      if (fog.fire) {
        const [x, y] = fog.fire, bx = x * TS - cx + 16, by = y * TS - cy;
        for (let i = 0; i < 12; i++) {
          const k = (this.t * 0.9 + i / 12) % 1, w = Math.round(22 * (1 - k) + 6);
          c.fillStyle = k < 0.3 ? '#fff4b8' : k < 0.6 ? '#ffd060' : '#ff8a30';
          c.globalAlpha = 0.85 * (1 - k * 0.8);
          c.fillRect(Math.round(bx + Math.sin(this.t * 3 + i * 1.7) * 16 * k - w / 2), Math.round(by - k * 150), w, 10);
        }
      }
      c.restore();
    },

    fieldKey(k, code) {
      const g = this.game;
      if (code === 'KeyG' && g.map && !g.busy() && g.map.def.trails && g.state.flags.lf_diting) { g.ditingScan(); return; }
      return base.fieldKey.call(this, k, code);
    },

    openUi_abacus(p) {
      const ui = this, F = H.LF_FIELD, d = F.ABACUS[p.id], cx = W / 2 + 70, cy = HGT / 2 - 10, R = 34, H3 = Math.sqrt(3);
      const pos = ([q, r]) => [cx + (q - 0.6) * R * 1.5, cy + (r + q / 2 - 0.4) * R * H3];
      const hex = (c, x, y, r, fill, line) => {
        c.beginPath();
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
        c.closePath();
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (line) { c.strokeStyle = line; c.lineWidth = 2; c.stroke(); }
      };
      const glyph = (c, x, y, k, col, r) => {
        c.strokeStyle = col; c.lineWidth = 3;
        c.beginPath();
        if (k === 'a') { c.moveTo(x - r, y - r); c.lineTo(x + r, y - r); c.lineTo(x + r, y); c.lineTo(x - r, y); c.lineTo(x - r, y + r); c.lineTo(x + r, y + r); }
        else { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.moveTo(x, y - r / 2); c.lineTo(x, y + r / 2); }
        c.stroke();
      };
      this.push({
        mods: Object.assign({}, d.modules), sel: 0, moves: 0, anim: null, solved: 0,
        tick(dt) {
          if (this.anim) { this.anim.t += dt * 4; if (this.anim.t >= 1) this.anim = null; }
          if (this.solved) { this.solved += dt; if (this.solved > 1.1) this.finish(true); }
        },
        finish(ok) {
          if (this.closed) return;
          this.closed = true;
          ui.screens.pop();
          ui.sfx(ok ? 'confirm' : 'cancel');
          ui.finishPending(ok);
        },
        turn(i) {
          if (this.solved || this.anim) return;
          const before = this.mods;
          this.mods = F.abacusTurn(d, before, i);
          this.anim = { t: 0, from: before, ax: i };
          this.sel = i;
          this.moves++;
          ui.sfx('select');
          if (F.abacusDone(d, this.mods)) { this.solved = 0.001; ui.sfx('star4'); }
        },
        draw(c) {
          c.fillStyle = '#080c1c'; c.fillRect(0, 0, W, HGT);
          for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(70,200,216,' + (0.04 + (i % 4) * 0.015) + ')'; c.fillRect(i * 26 % W, 0, 1, HGT); }
          ui.text(d.title, 24, 22, { size: 15, bold: true, serif: true, col: C.gold });
          let tipY = 58;
          for (const t of d.tips) {
            for (const line of ui.wrap(t, 200, 11)) { ui.text(line, 24, tipY, { size: 11, col: '#c8d8e8' }); tipY += 15; }
            tipY += 12;
          }
          ui.text('Ходов: ' + this.moves, 24, HGT - 96, { size: 12, col: C.cream });
          ui.hints([['←→', 'ось'], ['Enter', 'повернуть'], ['R', 'сначала'], ['Esc', 'выйти']], 24, HGT - 22);
          for (const b of F.abacusCells(d)) { const [x, y] = pos(b); hex(c, x, y, R - 2, '#1a2238', '#566478'); c.strokeStyle = '#34405c'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R * 0.42, 0, Math.PI * 2); c.stroke(); }
          for (const [k, v] of Object.entries(d.bases)) { const [x, y] = pos(k.split(',').map(Number)); hex(c, x, y, R - 6, this.mods[k] === v ? '#3a6a30' : '#28303e', this.mods[k] === v ? '#ffe080' : '#8a94a8'); glyph(c, x, y, v, '#8a94a8', 9); }
          d.axes.forEach((a, i) => {
            const [x, y] = pos(a), on = i === this.sel;
            hex(c, x, y, R - 2, on ? '#2ea898' : '#1e6a70', on ? '#c8fff0' : '#58d8c0');
            c.strokeStyle = on ? '#e8fff8' : '#7ae8d8'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R * 0.42, 0, Math.PI * 2); c.stroke();
            ui.hit(x - R, y - R, R * 2, R * 2, () => this.turn(i));
          });
          const a = this.anim, keys = a ? Object.keys(a.from) : Object.keys(this.mods);
          for (const k of keys) {
            const v = (a ? a.from : this.mods)[k];
            let [x, y] = pos(k.split(',').map(Number));
            if (a) {
              const ring = F.abacusRing(d, d.axes[a.ax]).map(o => o.join()), at = ring.indexOf(k);
              if (at >= 0) { const [tx, ty] = pos(ring[(at + 1) % ring.length].split(',').map(Number)), t = Math.min(1, a.t); x += (tx - x) * t; y += (ty - y) * t; }
            }
            c.fillStyle = '#0e3a34'; c.beginPath(); c.arc(x, y, R * 0.52, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#7fffd4'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R * 0.52, 0, Math.PI * 2); c.stroke();
            glyph(c, x, y, v, '#7fffd4', 9);
          }
          if (this.solved) ui.text('Подложка работает', cx, HGT - 44, { align: 'center', size: 14, bold: true, col: '#ffe080' });
          ui.closeBtn(W - 32, 10, () => this.key('back'));
        },
        key(k, code) {
          if (k === 'back') { this.finish(false); return; }
          if (this.solved) return;
          if (code === 'KeyR') { this.mods = Object.assign({}, d.modules); this.moves = 0; this.anim = null; ui.sfx('select'); return; }
          if (k === 'left' || k === 'up') { this.sel = (this.sel + d.axes.length - 1) % d.axes.length; ui.sfx('select'); return; }
          if (k === 'right' || k === 'down') { this.sel = (this.sel + 1) % d.axes.length; ui.sfx('select'); return; }
          if (k === 'ok') this.turn(this.sel);
        }
      });
    },

    openUi_mutare(p) {
      const ui = this, F = H.LF_FIELD, d = F.MUTARE[p.id], n = d.start.length, cx = W / 2 + 80, cy = HGT / 2 + 6, RAD = [52, 92, 132];
      const spoke = (c, r0, r1, a, col, w) => {
        c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
      };
      const sign = (c, x, y, s, col) => {
        c.strokeStyle = col; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.stroke(); }
        c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.stroke();
      };
      this.push({
        pos: d.start.slice(), view: d.start.slice(), sel: 0, moves: 0, solved: 0,
        tick(dt) {
          for (let i = 0; i < n; i++) {
            let diff = ((this.pos[i] - this.view[i]) % d.steps + d.steps * 1.5) % d.steps - d.steps / 2;
            const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 6);
            this.view[i] = (this.view[i] + step + d.steps) % d.steps;
          }
          if (this.solved) { this.solved += dt; if (this.solved > 1.4) this.finish(true); }
        },
        finish(ok) {
          if (this.closed) return;
          this.closed = true;
          ui.screens.pop();
          ui.sfx(ok ? 'confirm' : 'cancel');
          ui.finishPending(ok);
        },
        turn(i, dir) {
          if (this.solved) return;
          this.sel = i;
          this.pos = F.mutareTurn(d, this.pos, i, dir);
          this.moves++;
          ui.sfx('select');
          if (F.mutareDone(this.pos)) { this.solved = 0.001; ui.sfx('star4'); }
        },
        draw(c) {
          c.fillStyle = '#0a0e24'; c.fillRect(0, 0, W, HGT);
          ui.text(d.title, 24, 22, { size: 15, bold: true, serif: true, col: C.gold });
          ui.wrap(d.tip, W - 90, 11).forEach((line, i) => ui.text(line, 24, 50 + i * 15, { size: 11, col: '#c8d8e8' }));
          c.fillStyle = '#10183a'; c.fillRect(24, 118, 110, 110); c.strokeStyle = '#58d8c0'; c.lineWidth = 1; c.strokeRect(24.5, 118.5, 109, 109);
          sign(c, 79, 173, 40, '#7fffd4');
          ui.text('Образец на стеле', 79, 234, { align: 'center', size: 10, col: C.sub });
          c.fillStyle = '#c8d8e0'; c.beginPath(); c.arc(cx, cy, RAD[n - 1] + 34, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#1a2a50'; c.beginPath(); c.arc(cx, cy, RAD[n - 1] + 28, 0, Math.PI * 2); c.fill();
          const all = this.pos.every(v => v === 0);
          for (let i = n - 1; i >= 0; i--) {
            const r1 = RAD[i] + 24, r0 = i ? RAD[i - 1] + 28 : 8, a0 = this.view[i] * Math.PI * 2 / d.steps - Math.PI / 2, on = this.pos[i] === 0;
            c.strokeStyle = i === this.sel ? '#ffe080' : '#3e5a86'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r1, 0, Math.PI * 2); c.stroke();
            for (let k = 0; k < 3; k++) spoke(c, r0, r1, a0 + k * Math.PI * 2 / 3, all ? '#c8fff0' : on ? '#58f0c8' : '#7a8ac8', 5);
          }
          if (this.solved) { const g = c.createRadialGradient(cx, cy, 8, cx, cy, 170); g.addColorStop(0, 'rgba(180,255,230,' + Math.min(0.75, this.solved) + ')'); g.addColorStop(1, 'rgba(180,255,230,0)'); c.fillStyle = g; c.fillRect(cx - 170, 0, 340, HGT); }
          d.handles.forEach((h, i) => {
            const y = 262 + i * 46, on = i === this.sel;
            ui.text(d.names[i], 24, y, { size: 11, col: on ? C.gold : C.cream });
            ui.button(24, y + 16, 54, 22, '◄', () => this.turn(i, -1), { active: on, size: 12 });
            ui.button(84, y + 16, 54, 22, '►', () => this.turn(i, 1), { active: on, size: 12 });
          });
          ui.hints([['↑↓', 'ручка'], ['←→', 'вращать'], ['Esc', 'выйти']], 24, HGT - 22);
          ui.closeBtn(W - 32, 10, () => this.key('back'));
        },
        key(k) {
          if (k === 'back') { this.finish(false); return; }
          if (this.solved) return;
          if (k === 'up') { this.sel = (this.sel + d.handles.length - 1) % d.handles.length; ui.sfx('select'); return; }
          if (k === 'down') { this.sel = (this.sel + 1) % d.handles.length; ui.sfx('select'); return; }
          if (k === 'left') this.turn(this.sel, -1);
          if (k === 'right' || k === 'ok') this.turn(this.sel, 1);
        }
      });
    },

    openUi_lfchat(p) {
      this.openChats(p.who).onClose = () => this.finishPending();
    },

    openUi_lfdispatch(p) {
      const ui = this, g = this.game, l = g.map.def.lanes[p.lane], mark = Object.values(g.map.def.marks).find(m => m.type === 'dispatch' && m.lane === p.lane);
      const say = { limit: 'Огоньки пульта кончились: дальше контейнер не сдвинуть.', cargo: 'Путь занят другим контейнером.', player: 'На пути стоит отряд.', foe: 'На пути стоит враг.' };
      this.push({
        note: '',
        draw(c) {
          const w = 340, h = 62, x = W / 2 - w / 2, y = HGT - h - 16;
          ui.win(x, y, w, h, { title: mark && mark.title ? mark.title : 'Пульт' });
          const at = g.laneAt(p.lane), n = l.max - l.min + 1;
          for (let i = 0; i < n; i++) { c.fillStyle = l.min + i === at ? JADE : '#3a4450'; c.fillRect(x + 16 + i * 16, y + 24, 12, 10); }
          ui.text(this.note || 'Стрелки двигают контейнер. Enter или Esc: выйти.', x + 16 + n * 16 + 4, y + 22, { size: 10, col: '#e8e4d0' });
          ui.hit(x, y, w, h, () => {});
        },
        key(k) {
          if (k === 'ok' || k === 'back') { ui.screens.pop(); ui.sfx('confirm'); ui.finishPending(); return; }
          const d = k === 'up' || k === 'left' ? -1 : k === 'down' || k === 'right' ? 1 : 0;
          if (!d) return;
          const r = g.moveCargo(p.lane, d);
          this.note = r === true ? '' : say[r] || '';
          if (r !== true) ui.sfx('deny');
        }
      });
    },

    battleKey(k, code) {
      const bt = this.bt, b = this.game.battle;
      if (code === 'KeyG' && b && b.lf && b.lf.assist) {
        if (bt.result || bt.ult || bt.sub || bt.queue.length || bt.cur) return;
        if (b.assistReady()) { b.assistUse(); this.pullEvents(); this.sfx('ult'); } else this.sfx('deny');
        return;
      }
      return base.battleKey.call(this, k, code);
    },

    drawDamageBoard(c, b) {
      base.drawDamageBoard.call(this, c, b);
      const a = b.lf && b.lf.assist;
      if (!a) return;
      const v = b.lfGauge || 0, x = 8, y = 334, w = 176, full = v >= a.max, on = full && this.lfBlink();
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(x, y, w, 30);
      c.strokeStyle = on ? JADE : 'rgba(242,220,154,0.5)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 29);
      this.text('G  ' + a.name, x + 6, y + 3, { size: 10, bold: true, col: full ? JADE : '#f2dc9a' });
      c.fillStyle = '#141626'; c.fillRect(x + 6, y + 18, w - 12, 6);
      c.fillStyle = full ? JADE : '#6aa8c8'; c.fillRect(x + 6, y + 18, Math.round((w - 12) * v / a.max), 6);
      this.hit(x, y, w, 30, () => this.battleKey(null, 'KeyG'));
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
