(function (A) {
  'use strict';
  const SUNSET = ['#140e24', '#2a1c3c', '#5a2a48', '#9a4a42', '#d8783a', '#f4b45a'];

  const big = (g, font, text, cx, y, scale, color) => {
    const F = A.Font, w = F.measure(font, text) + 2, c = document.createElement('canvas');
    c.width = w;
    c.height = 18;
    F.draw(c.getContext('2d'), font, text, 1, 1, color, '#05030a');
    g.imageSmoothingEnabled = false;
    g.drawImage(c, Math.round(cx - w * scale / 2), y, w * scale, 18 * scale);
  };

  A.ForgetScreen = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.names = opts.lost.map(id => A.SKILLS[id].name);
      this.level = opts.level;
      this.done = opts.done;
      this.t = 0;
      this.gone = 0;
      this.step = 0.6;
      this.fadeAt = 1.6;
      this.titleAt = this.fadeAt + this.names.length * this.step + 1.4;
    }

    shownLevel() {
      const k = Math.min(1, Math.max(0, (this.t - this.fadeAt) / (this.names.length * this.step)));
      return Math.max(1, Math.round(this.level - (this.level - 1) * k));
    }

    update(dt) {
      this.t += dt;
      const gone = Math.max(0, Math.min(this.names.length, Math.floor((this.t - this.fadeAt) / this.step) + 1));
      if (this.t >= this.fadeAt && gone > this.gone) {
        this.gone = gone;
        this.sound.sfx('fade');
      }
    }

    key(code) {
      if (code !== 'Enter' && code !== 'Space') return code !== 'Escape';
      if (this.t < this.titleAt) this.t = this.titleAt;
      else if (this.t > this.titleAt + 1.5) this.done();
      return true;
    }

    draw(gfx) {
      const g = gfx.g, F = A.Font, K = A.UIKit;
      g.fillStyle = '#05030a';
      g.fillRect(0, 0, A.W, A.H);
      if (this.t < this.titleAt) {
        const head = 'Эйла Секура', lv = 'Уровень ' + this.shownLevel();
        F.draw(g, 'bold', head, Math.round(320 - F.measure('bold', head) / 2), 70, K.GOLD, K.SHADOW);
        F.draw(g, 'text', lv, Math.round(320 - F.measure('text', lv) / 2), 92, K.INK, K.SHADOW);
        const rows = Math.ceil(this.names.length / 2);
        this.names.forEach((name, i) => {
          const col = i < rows ? 0 : 1, row = i % rows, x = col ? 352 : 128, y = 140 + row * 26;
          const fadeStart = this.fadeAt + i * this.step, a = this.t < fadeStart ? Math.min(1, this.t / 0.8) : Math.max(0, 1 - (this.t - fadeStart) / 0.45);
          if (a <= 0) return;
          g.globalAlpha = a;
          F.draw(g, 'text', name, x, y, '#e8d8b0', K.SHADOW);
          g.fillStyle = '#e83a2a';
          g.fillRect(x - 14, y + 6, 8, 2);
          g.globalAlpha = 1;
        });
        return;
      }
      const k = Math.min(1, (this.t - this.titleAt) / 1.5);
      if (!this.sky) {
        this.sky = document.createElement('canvas');
        this.sky.width = A.LW;
        this.sky.height = A.LH;
        const s = this.sky.getContext('2d');
        this.ui.gfx.band(s, 0, 170, SUNSET);
        this.ui.gfx.band(s, 170, 240, ['#2a1a18', '#140c0c']);
        s.fillStyle = '#ffe2a0';
        s.beginPath();
        s.arc(232, 170, 14, Math.PI, 0);
        s.fill();
      }
      g.globalAlpha = k;
      g.imageSmoothingEnabled = false;
      g.drawImage(this.sky, 0, 0, A.LW, A.LH, 0, 0, A.W, A.H);
      big(g, 'bold', 'STAR WARS', 320, 110, 2, '#f4bf6a');
      big(g, 'bold', 'Aayla Secura', 320, 156, 3, '#ffffff');
      big(g, 'text', 'Twilight', 320, 226, 2, '#f4dca0');
      g.globalAlpha = 1;
      if (this.t > this.titleAt + 1.5) {
        const hint = A.Input.label('ok', this.ui.device) + ': дальше';
        F.draw(g, 'text', hint, Math.round(320 - F.measure('text', hint) / 2), 430, K.INK, K.SHADOW);
      }
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
