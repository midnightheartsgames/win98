(function (H) {
  'use strict';
  const { W, HGT, C } = H.UI_CONST;
  const DISCS = [
    { n: 1, title: 'Станция «Герта»', maps: ['hs_'], col: '#7ac8ff', ring: '#2a4a8a' },
    { n: 2, title: 'Ярило-VI', maps: ['j_', 'u_'], col: '#bfe4ff', ring: '#4a5a8a' },
    { n: 3, title: 'Лофу Сяньчжоу', maps: ['lf_'], col: '#9af0c8', ring: '#2a6a5a' }
  ];
  const READ_T = 1.8;

  const discOfMap = id => { const d = DISCS.find(x => x.maps.some(p => String(id).startsWith(p))); return d ? d.n : 0; };

  Object.assign(H.Game.prototype, {
    discOf(id) { return discOfMap(id); },

    discReached() {
      const f = this.state.flags;
      if (Object.keys(f).some(k => k.startsWith('lf_') && f[k])) return 3;
      return f.jarilo_arrive ? 2 : 1;
    },

    discAdvance(mapId) {
      const s = this.state;
      if (this.guest || this.replay) return 0;
      const d = discOfMap(mapId);
      if (s.disc == null) { s.disc = Math.max(this.discReached(), d); return 0; }
      if (d <= s.disc) return 0;
      const from = s.disc;
      s.disc = d;
      return from;
    }
  });

  Object.assign(H.UI.prototype, {
    discCheck(mapId) {
      const g = this.game;
      if (!g || !g.discAdvance) return;
      const from = g.discAdvance(mapId);
      if (from) this.openDiscSwap(from, g.state.disc);
    },

    drawDisc(c, cx, cy, r, disc, spin) {
      c.save();
      c.translate(cx, cy);
      c.rotate(spin);
      const gr = c.createLinearGradient(-r, -r, r, r);
      gr.addColorStop(0, '#d8dce8'); gr.addColorStop(0.35, disc.col); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.65, '#c8b8f0'); gr.addColorStop(1, '#9aa6c8');
      c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = disc.ring; c.beginPath(); c.arc(0, 0, r * 0.62, Math.PI * 1.08, Math.PI * 1.92); c.arc(0, 0, r * 0.3, Math.PI * 1.92, Math.PI * 1.08, true); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(0, 0, r * 0.34, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#05060e'; c.beginPath(); c.arc(0, 0, r * 0.1, 0, Math.PI * 2); c.fill();
      c.restore();
      this.text(String(disc.n), cx, cy - r * 0.52 - 8, { align: 'center', size: 15, bold: true, serif: true, col: '#ffffff' });
    },

    openDiscSwap(from, to) {
      const ui = this, A = DISCS[from - 1], B = DISCS[to - 1];
      if (!A || !B) return null;
      return this.push({
        full: true, pause: true, t: 0, phase: 'eject', rt: 0,
        insert() { if (this.phase !== 'wait') return; this.phase = 'read'; this.rt = 0; ui.sfx('rumble'); },
        tick(dt) {
          this.t += dt;
          if (this.phase === 'eject' && this.t > 1.1) { this.phase = 'wait'; ui.sfx('select'); }
          if (this.phase === 'read') { this.rt += dt; if (this.rt >= READ_T) { ui.screens.splice(ui.screens.indexOf(this), 1); ui.sfx('confirm'); } }
        },
        draw(c) {
          c.fillStyle = '#04050c'; c.fillRect(ui.left, 0, ui.vw, HGT);
          const bx = W / 2 - 210, by = 92, bw = 420, bh = 240;
          ui.win(bx, by, bw, bh, { title: 'Star Rail 98 · CD-ROM' });
          const out = Math.min(1, this.t / 1.1), tray = by + 112;
          c.fillStyle = '#1a1c2c'; c.fillRect(bx + 24, tray - 6, 170, 12);
          c.fillStyle = '#2e3248'; c.fillRect(bx + 24, tray - 6, 170, 2);
          if (this.phase === 'eject') ui.drawDisc(c, bx + 108 - out * 10, tray - out * 40, 52, A, this.t * (1 - out) * 9);
          else ui.drawDisc(c, bx + 108, tray - (this.phase === 'read' ? 0 : 40), 52, this.phase === 'read' ? B : A, this.phase === 'read' ? this.rt * 14 : 0);
          const tx = bx + 214, tw = bw - 234;
          if (this.phase === 'read') {
            ui.text('Чтение диска ' + B.n, tx, by + 52, { size: 13, bold: true, col: C.gold });
            ui.text(B.title, tx, by + 74, { size: 15, bold: true, serif: true, col: B.col });
            c.fillStyle = '#05060e'; c.fillRect(tx, by + 104, tw, 12);
            const k = Math.min(1, this.rt / READ_T), cells = Math.floor(k * 14);
            for (let i = 0; i < cells; i++) { c.fillStyle = '#000080'; c.fillRect(tx + 2 + i * ((tw - 4) / 14), by + 106, (tw - 4) / 14 - 2, 8); }
          } else {
            ui.text('Конец диска ' + A.n, tx, by + 40, { size: 11, col: C.sub });
            ui.text(A.title, tx, by + 56, { size: 13, bold: true, serif: true, col: A.col });
            ui.wrap('Вставьте Диск ' + B.n + ' и нажмите Enter, чтобы продолжить.', tw, 11).forEach((l, i) => ui.text(l, tx, by + 86 + i * 14, { size: 11, col: C.cream }));
            if (this.phase === 'wait') ui.button(tx, by + bh - 52, tw, 26, 'Диск вставлен', () => this.insert(), { active: true, bold: true, size: 11 });
          }
          ui.text('Диск ' + B.n + ' из ' + DISCS.length, W / 2, by + bh + 18, { align: 'center', size: 10, col: C.dim });
          if (this.phase === 'wait') ui.hints([['Enter', 'Диск вставлен']], W / 2, HGT - 22, { align: 'center' });
        },
        key(k) { if (k === 'ok') this.insert(); }
      });
    }
  });

  H.DISCS = DISCS;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
