(function (A) {
  'use strict';
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const SKY = ['#1c1840', '#2e2456', '#4c2f5e', '#7a3f55', '#b8604a', '#e08e4a', '#f4bf6a'];
  const ROCK = ['#3a2a22', '#55402f', '#6e5640'];

  A.Gfx = class {
    constructor(canvas) {
      canvas.width = A.W;
      canvas.height = A.H;
      this.canvas = canvas;
      this.g = canvas.getContext('2d');
      this.low = document.createElement('canvas');
      this.low.width = A.LW;
      this.low.height = A.LH;
      this.lg = this.low.getContext('2d');
      this.g.imageSmoothingEnabled = false;
      this.lg.imageSmoothingEnabled = false;
    }

    present() {
      this.g.imageSmoothingEnabled = false;
      this.g.drawImage(this.low, 0, 0, A.LW, A.LH, 0, 0, A.W, A.H);
    }

    band(g, y0, y1, colors) {
      const n = colors.length - 1, h = y1 - y0;
      for (let y = y0; y < y1; y++) {
        const v = ((y - y0) / h) * n, i = Math.min(n - 1, Math.floor(v)), f = v - i;
        for (let x = 0; x < A.LW; x++) {
          g.fillStyle = f * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? colors[i + 1] : colors[i];
          g.fillRect(x, y, 1, 1);
        }
      }
    }

    figure(g, x, y, sway) {
      const px = (dx, dy, w, h, c) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
      px(5, 0, 6, 6, '#6fa8dc');
      px(4, 2, 1, 2, '#6fa8dc');
      px(11, 2, 1, 2, '#6fa8dc');
      px(6, 2, 1, 1, '#2a1a10');
      px(9, 2, 1, 1, '#2a1a10');
      px(5, 6, 6, 1, '#4a3020');
      px(4, 7, 8, 8, '#7b5a3a');
      px(5, 15, 6, 4, '#3a2a1e');
      px(5, 19, 2, 5, '#2a1e16');
      px(9, 19, 2, 5, '#2a1e16');
      px(3 - sway, 5, 2, 9, '#5b93c7');
      px(11 + sway, 5, 2, 10, '#5b93c7');
    }

    pattern(t, paused) {
      const g = this.lg;
      if (!this.sky) {
        this.sky = document.createElement('canvas');
        this.sky.width = A.LW;
        this.sky.height = A.LH;
        const s = this.sky.getContext('2d');
        this.band(s, 0, 168, SKY);
        this.band(s, 168, 240, ROCK);
        s.fillStyle = '#fff2c4';
        s.beginPath();
        s.arc(272, 168, 18, Math.PI, 0);
        s.fill();
      }
      g.drawImage(this.sky, 0, 0);
      for (let x = 0; x < A.LW; x += 16) {
        for (let y = 192; y < A.LH; y += 16) {
          if (((x + y) >> 4) & 1) {
            g.fillStyle = 'rgba(0,0,0,0.18)';
            g.fillRect(x, y, 16, 16);
          }
        }
      }
      const sway = Math.round(Math.sin(t * 3)) > 0 ? 1 : 0;
      this.figure(g, 152, 176, sway);
      this.present();
      const h = this.g;
      h.strokeStyle = '#f4bf6a';
      h.lineWidth = 1;
      h.strokeRect(0.5, 0.5, A.W - 1, A.H - 1);
      for (let i = 0; i < 8; i++) {
        h.fillStyle = i & 1 ? '#ffffff' : '#000000';
        h.fillRect(8 + i, 8, 1, 8);
      }
      h.fillStyle = '#ffffff';
      h.font = 'bold 12px "Courier New", monospace';
      h.textBaseline = 'top';
      h.fillText(A.TITLE, 24, 8);
      h.fillText('640×480 / 320×240 ×2', 24, 24);
      if (paused) {
        h.fillStyle = 'rgba(0,0,0,0.55)';
        h.fillRect(0, 0, A.W, A.H);
        h.fillStyle = '#ffffff';
        h.fillText('Пауза', A.W / 2 - 20, A.H / 2 - 6);
      }
    }

    destroy() {
      this.low.width = this.low.height = 0;
      if (this.sky) this.sky.width = this.sky.height = 0;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
