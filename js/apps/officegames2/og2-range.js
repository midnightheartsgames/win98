(() => {
  const WIDTH = 640;
  const HEIGHT = 400;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';
  const SCALE = window.Og2RangeEngine.LAYER_SCALE;

  class RangeApp {
    constructor() {
      this.winId = 'og2_range';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Тир Open-space',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-range-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="time"></span>
            <span data-cell="accuracy"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2RangeEngine();
      this.mode = 'ready';
      this.aim = { x: WIDTH / 2, y: HEIGHT / 2 };
      this.floaters = [];
      this.flash = 0;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        boss: (shown) => { if (shown && this.mode === 'play') this.mode = 'paused'; }
      });
      this.canvas.addEventListener('mousemove', (e) => this.trackAim(e));
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.updateStatus();
      this.frame = requestAnimationFrame((now) => this.loop(now));
    }

    dispose() {
      if (this.stopKeys) this.stopKeys();
      cancelAnimationFrame(this.frame);
      this.stopKeys = null;
      this.frame = null;
      this.win = null;
    }

    trackAim(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.aim.x = (e.clientX - rect.left) * WIDTH / rect.width;
      this.aim.y = (e.clientY - rect.top) * HEIGHT / rect.height;
    }

    onMouseDown(e) {
      this.trackAim(e);
      if (this.mode !== 'play') {
        this.primaryAction();
        return;
      }
      if (e.button === 2) this.tryReload();
      else this.fire();
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        if (this.mode === 'play') this.tryReload();
        else this.primaryAction();
      } else if (key === 'r') {
        this.tryReload();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') this.mode = 'paused';
        else if (this.mode === 'paused') this.mode = 'play';
      }
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'over') {
        this.engine.reset();
        this.floaters = [];
        this.recordBeaten = false;
        this.mode = 'play';
        this.updateStatus();
      }
    }

    tryReload() {
      if (this.mode === 'play' && this.engine.reload()) window.Og2.beep(300, 0.05, 'square', 0.03);
    }

    fire() {
      if (window.Og2.isBossShown(this.winId)) return;
      const result = this.engine.shoot(this.aim.x, this.aim.y)[0];
      const beep = window.Og2.beep;
      if (result === 'locked') return;
      if (result === 'empty') {
        beep(200, 0.03, 'square', 0.03);
        return;
      }
      this.flash = 0.08;
      beep(170, 0.06, 'sawtooth', 0.06);
      if (result === 'hit' || result === 'clock') {
        beep(result === 'clock' ? 1200 : 800, 0.06, 'triangle');
        this.addFloater('+' + this.engine.lastHit.points, '#ffd36a');
        if (result === 'clock') this.addFloater('+4 с', '#8fe08f', 16);
      } else if (result === 'bossHit') {
        beep(90, 0.3, 'sawtooth', 0.07);
        this.addFloater('Это же шеф! −50, −3 с', '#ff7a6a');
      }
      this.updateStatus();
    }

    addFloater(text, color, shift = 0) {
      const hit = this.engine.lastHit;
      this.floaters.push({ text, color, x: hit.x, y: hit.y - 20 - shift, life: 1 });
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'play' && !window.Og2.isBossShown(this.winId)) {
        const events = this.engine.update(dt);
        events.forEach(event => this.react(event));
      }
      this.flash = Math.max(0, this.flash - dt);
      this.floaters.forEach(f => {
        f.life -= dt;
        f.y -= 30 * dt;
      });
      this.floaters = this.floaters.filter(f => f.life > 0);
      this.draw(now / 1000);
      this.updateStatus();
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    react(event) {
      if (event === 'reloaded') window.Og2.beep(520, 0.05, 'square', 0.03);
      else if (event === 'timeUp') {
        window.Og2.beep(110, 0.5, 'sawtooth', 0.07);
        this.mode = 'over';
        this.recordBeaten = window.Og2.submitScore('range', this.engine.score);
      }
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.time.textContent = 'Время: ' + Math.ceil(e.timeLeft) + ' с';
      this.cells.accuracy.textContent = 'Точность: ' + e.accuracy + '%';
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('range'), e.score);
    }

    draw(time) {
      const ctx = this.ctx;
      this.drawWall(time);
      this.drawFarDesks();
      this.drawLayer(2, time);
      this.drawDeskStrip(326, '#a88a5a', '#8a6e44', 0.72);
      this.drawLayer(1, time);
      this.drawDeskStrip(362, '#7e5f38', '#5f4527', 1);
      this.drawLayer(0, time);
      if (this.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + this.flash * 2 + ')';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      this.floaters.forEach(f => {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.font = 'bold 14px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      });
      ctx.globalAlpha = 1;
      this.drawHud();
      this.drawCrosshair();
      this.drawMessage();
    }

    drawWall(time) {
      const ctx = this.ctx;
      ctx.fillStyle = '#cfc9b6';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      [30, 250, 470].forEach((x, i) => {
        const sky = ctx.createLinearGradient(0, 36, 0, 150);
        sky.addColorStop(0, '#6fa8dc');
        sky.addColorStop(1, '#cfe6f7');
        ctx.fillStyle = '#8c8670';
        ctx.fillRect(x - 6, 30, 172, 128);
        ctx.fillStyle = sky;
        ctx.fillRect(x, 36, 160, 116);
        ctx.fillStyle = '#ffffff';
        const drift = (time * 6 + i * 50) % 200;
        ctx.fillRect(x + 20 + drift * 0.4, 70, 40, 10);
        ctx.fillRect(x + 30 + drift * 0.4, 64, 24, 8);
        ctx.fillStyle = '#8c8670';
        ctx.fillRect(x + 78, 36, 4, 116);
        ctx.fillRect(x, 92, 160, 4);
      });
      ctx.fillStyle = '#b8b29c';
      ctx.fillRect(0, 180, WIDTH, 4);
    }

    drawFarDesks() {
      const ctx = this.ctx;
      ctx.fillStyle = '#8b8470';
      ctx.fillRect(0, 296, WIDTH, 40);
      for (let x = 20; x < WIDTH; x += 110) {
        ctx.fillStyle = '#4c4f58';
        ctx.fillRect(x, 270, 26, 20);
        ctx.fillStyle = '#7da8c8';
        ctx.fillRect(x + 3, 273, 20, 13);
        ctx.fillStyle = '#4c4f58';
        ctx.fillRect(x + 10, 290, 6, 6);
        ctx.fillStyle = '#6f6a58';
        ctx.fillRect(x + 50, 286, 30, 10);
      }
    }

    drawDeskStrip(top, color, edge, scale) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      ctx.fillRect(0, top, WIDTH, HEIGHT - top);
      ctx.fillStyle = edge;
      ctx.fillRect(0, top, WIDTH, 3);
      ctx.fillRect(0, top + 8 * scale, WIDTH, 1);
      for (let x = 40 / scale; x < WIDTH; x += 170 * scale) {
        ctx.fillStyle = '#d8d8d0';
        ctx.fillRect(x, top + 6, 20 * scale, 12 * scale);
        ctx.fillStyle = '#565a66';
        ctx.fillRect(x + 4 * scale, top + 8 * scale, 12 * scale, 3 * scale);
      }
    }

    drawLayer(layer, time) {
      this.engine.entities.filter(e => e.layer === layer).forEach(e => this.drawEntity(e, time));
    }

    drawEntity(e, time) {
      const ctx = this.ctx;
      const scale = SCALE[e.layer];
      const dying = !e.alive;
      const alpha = dying ? Math.max(0, 1 - e.fade / 0.8) : 1;
      let y = e.y;
      let spin = 0;
      if (dying) {
        if (e.type === 'boss') {
          spin = Math.min(1.5, e.fade * 5) * e.dir;
        } else {
          y += e.fade * e.fade * 420;
          spin = e.fade * 7 * e.dir;
        }
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(e.x, y);
      if (e.type === 'boss') {
                ctx.rotate(spin);
        ctx.translate(0, -36 * scale);
      } else {
        ctx.rotate(spin);
      }
      ctx.scale(scale * e.dir, scale);
      if (e.type === 'plane') this.drawPlane(e);
      else if (e.type === 'pigeon') this.drawPigeon(e, time);
      else if (e.type === 'clock') this.drawClock(e, dying);
      else this.drawBoss();
      ctx.restore();
    }

    drawPlane(e) {
      const ctx = this.ctx;
      ctx.rotate(Math.cos(e.age * 3 + e.phase) * 0.2);
      ctx.fillStyle = '#f4f4ee';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-16, -9);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-16, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c9c9c0';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-16, 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a8a80';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, 0);
      ctx.stroke();
    }

    drawPigeon(e, time) {
      const ctx = this.ctx;
      const flap = Math.sin((e.alive ? e.age : time) * 16);
      ctx.fillStyle = '#7d8699';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5f6779';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-24, 5);
      ctx.fill();
      ctx.fillStyle = '#9aa3b6';
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(4, -2);
      ctx.lineTo(-2, -4 - 16 * (0.5 + flap * 0.5) - 4);
      ctx.fill();
      ctx.fillStyle = '#7d8699';
      ctx.beginPath();
      ctx.arc(14, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d98a2b';
      ctx.beginPath();
      ctx.moveTo(19, -6);
      ctx.lineTo(26, -4);
      ctx.lineTo(19, -3);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.fillRect(15, -8, 2, 2);
      ctx.fillStyle = '#4fa86a';
      ctx.fillRect(9, -2, 4, 3);
    }

    drawClock(e, dying) {
      const ctx = this.ctx;
      ctx.fillStyle = '#b8b8b0';
      ctx.fillRect(-9, 12, 3, 6);
      ctx.fillRect(6, 12, 3, 6);
      ctx.fillStyle = '#d8a82b';
      ctx.beginPath();
      ctx.arc(-9, -12, 5, Math.PI, 0);
      ctx.arc(9, -12, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6f2e6';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222222';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -8);
      ctx.moveTo(0, 0);
      ctx.lineTo(6, 2);
      ctx.stroke();
      if (dying) {
        ctx.strokeStyle = '#ffd36a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    drawBoss() {
      const ctx = this.ctx;
      ctx.fillStyle = '#6b4a24';
      ctx.fillRect(-18, 34, 36, 4);
      ctx.fillStyle = '#c9a56a';
      ctx.fillRect(-19, -34, 38, 70);
      ctx.fillStyle = '#2f3a5a';
      ctx.fillRect(-17, -10, 34, 44);
      ctx.fillStyle = '#f2f0e8';
      ctx.fillRect(-5, -10, 10, 18);
      ctx.fillStyle = '#c8322a';
      ctx.fillRect(-2, -8, 4, 22);
      ctx.fillStyle = '#e8c49a';
      ctx.beginPath();
      ctx.arc(0, -22, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(-11, -34, 22, 7);
      ctx.fillStyle = '#222222';
      ctx.fillRect(-5, -23, 3, 3);
      ctx.fillRect(3, -23, 3, 3);
      ctx.fillRect(-4, -15, 8, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-14, 14, 16, 10);
      ctx.fillStyle = '#c8322a';
      ctx.fillRect(-12, 16, 12, 3);
      ctx.fillRect(-12, 20, 8, 2);
    }

    drawHud() {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, 26);
      ctx.font = 'bold 14px ' + FONT;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('ОЧКИ ' + e.score, 10, 13);
      ctx.textAlign = 'center';
      ctx.fillStyle = e.timeLeft < 10 ? '#ff7a6a' : '#ffffff';
      ctx.fillText(Math.ceil(e.timeLeft) + ' с', WIDTH / 2, 13);
      ctx.textAlign = 'right';
      ctx.fillStyle = e.multiplier > 1 ? '#ffd36a' : '#c8c8c8';
      ctx.fillText('x' + e.multiplier + '  серия ' + e.streak, WIDTH - 10, 13);
      for (let i = 0; i < e.magazine; i++) {
        const x = 16 + i * 16;
        ctx.fillStyle = i < e.ammo ? '#e8c43a' : '#505050';
        ctx.fillRect(x, HEIGHT - 28, 8, 18);
        ctx.fillStyle = i < e.ammo ? '#b8902a' : '#383838';
        ctx.fillRect(x, HEIGHT - 28, 8, 5);
      }
      if (e.reloading > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText('Перезарядка...', 120, HEIGHT - 18);
      } else if (e.ammo <= 1 && this.mode === 'play') {
        ctx.fillStyle = '#ffd36a';
        ctx.font = '12px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText('Пробел или правая кнопка — перезарядка', 120, HEIGHT - 18);
      }
    }

    drawCrosshair() {
      const ctx = this.ctx;
      const e = this.engine;
      const { x, y } = this.aim;
      ctx.strokeStyle = e.reloading > 0 ? '#9a9a9a' : '#ff3b2f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.moveTo(x - 18, y);
      ctx.lineTo(x - 6, y);
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + 18, y);
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y - 6);
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x, y + 18);
      ctx.stroke();
      if (e.reloading > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - e.reloading / e.reloadTime));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['ТИР OPEN-SPACE', 'Мышь — прицел и выстрел, Пробел — перезарядка', 'Не стреляйте в шефа. Часы добавляют время.', 'Клик — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'over') {
        lines = ['СМЕНА ОКОНЧЕНА', 'Очки: ' + e.score + ', точность ' + e.accuracy + '%'];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Клик — ещё раз');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 110;
      ctx.fillStyle = 'rgba(10,12,18,0.85)';
      ctx.fillRect(100, top, WIDTH - 200, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(100.5, top + 0.5, WIDTH - 201, height - 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#ffd36a' : '#ffffff';
        ctx.font = (i === 0 ? 'bold 17px ' : '13px ') + FONT;
        ctx.fillText(line, WIDTH / 2, top + 24 + i * 24);
      });
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#cfc9b6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9fc9ea';
    ctx.fillRect(6, 6, 38, 22);
    ctx.fillStyle = '#7e5f38';
    ctx.fillRect(0, 46, w, h - 46);
    ctx.fillStyle = '#f4f4ee';
    ctx.beginPath();
    ctx.moveTo(34, 20);
    ctx.lineTo(16, 14);
    ctx.lineTo(20, 20);
    ctx.lineTo(16, 26);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(24, 38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff3b2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(66, 28, 14, 0, Math.PI * 2);
    ctx.moveTo(46, 28);
    ctx.lineTo(86, 28);
    ctx.moveTo(66, 8);
    ctx.lineTo(66, 48);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  const app = new RangeApp();
  window.appOg2Range = app;
  window.Og2.attach('range', { open: () => app.open(), drawIcon });
})();
