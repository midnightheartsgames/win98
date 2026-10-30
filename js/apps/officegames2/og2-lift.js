(() => {
  const WIDTH = 640;
  const HEIGHT = 360;
  const FLOOR_Y = 292;
  const CAMERA_LEAD = 200;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';

  function formatTime(seconds) {
    const whole = Math.floor(seconds);
    const tenth = Math.floor((seconds - whole) * 10);
    return whole + '.' + tenth;
  }

  class LiftApp {
    constructor() {
      this.winId = 'og2_lift';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Последний лифт',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-lift-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="time"></span>
            <span data-cell="floor"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2LiftEngine();
      this.mode = 'ready';
      this.held = { left: false, right: false, jump: false };
      this.floaters = [];
      this.cameraX = 0;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        up: (e) => this.onKeyUp(e),
        boss: (shown) => {
          this.releaseKeys();
          if (shown && this.mode === 'play') this.mode = 'paused';
        }
      });
      this.canvas.addEventListener('mousedown', () => this.primaryAction());
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

    releaseKeys() {
      this.held.left = false;
      this.held.right = false;
      this.held.jump = false;
    }

    keyRole(key) {
      if (key === 'arrowleft' || key === 'a') return 'left';
      if (key === 'arrowright' || key === 'd') return 'right';
      if (key === 'arrowup' || key === 'w') return 'jump';
      return null;
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      const role = this.keyRole(key);
      if (role) {
        e.preventDefault();
        this.held[role] = true;
        return;
      }
      if (key === ' ') {
        e.preventDefault();
        if (this.mode === 'play') this.held.jump = true;
        else this.primaryAction();
      } else if (key === 'enter') {
        e.preventDefault();
        this.primaryAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') this.mode = 'paused';
        else if (this.mode === 'paused') this.mode = 'play';
      }
    }

    onKeyUp(e) {
      const key = e.key.toLowerCase();
      const role = this.keyRole(key);
      if (role) this.held[role] = false;
      else if (key === ' ') this.held.jump = false;
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'won') {
        this.engine.nextLevel();
        this.floaters = [];
        this.mode = 'play';
        this.updateStatus();
      } else if (this.mode === 'lost') {
        this.engine.restart();
        this.floaters = [];
        this.recordBeaten = false;
        this.mode = 'play';
        this.updateStatus();
      }
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.033, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'play' && !window.Og2.isBossShown(this.winId)) this.advance(dt);
      this.floaters.forEach(f => {
        f.life -= dt;
        f.y -= 28 * dt;
      });
      this.floaters = this.floaters.filter(f => f.life > 0);
      this.followCamera(dt);
      this.draw(now / 1000);
      this.updateTime();
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(dt) {
      this.engine.setControls(this.held);
      const before = this.engine.timeLeft;
      const events = this.engine.update(dt);
      events.forEach(event => this.react(event, before - this.engine.timeLeft));
      if (events.length) this.updateStatus();
    }

    say(text, color) {
      const p = this.engine.player;
      this.floaters.push({ text, color, x: p.x, y: p.y - 60, life: 1.1 });
    }

    react(event) {
      const beep = window.Og2.beep;
      if (event === 'jump') beep(420, 0.05, 'square', 0.03);
      else if (event === 'coffee') {
        beep(900, 0.05, 'triangle');
        beep(1300, 0.08, 'triangle');
        this.say('+1,5 с', '#ffd36a');
      } else if (event === 'puddle') {
        beep(180, 0.2, 'sawtooth', 0.05);
        this.say('Лужа! −2 с', '#8ec8ff');
      } else if (event === 'chairHit') {
        beep(130, 0.25, 'sawtooth', 0.06);
        this.say('Кресло! −3 с', '#ff8a7a');
      } else if (event === 'stomp') {
        beep(600, 0.06, 'square');
        this.say('+50', '#ffffff');
      } else if (event === 'win') {
        [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle'), i * 110));
        this.mode = 'won';
        this.recordBeaten = window.Og2.submitScore('lift', this.engine.score) || this.recordBeaten;
      } else if (event === 'timeUp') {
        beep(110, 0.5, 'sawtooth', 0.07);
        this.mode = 'lost';
        this.recordBeaten = window.Og2.submitScore('lift', this.engine.score) || this.recordBeaten;
      }
    }

    followCamera(dt) {
      const e = this.engine;
      const target = Math.max(0, Math.min(e.liftX + 140 - WIDTH, e.player.x - CAMERA_LEAD));
      this.cameraX += (target - this.cameraX) * Math.min(1, dt * 7);
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.floor.textContent = 'Этаж: ' + (19 - Math.min(18, e.level));
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('lift'), e.score);
    }

    updateTime() {
      if (this.cells) this.cells.time.textContent = 'Время: ' + formatTime(this.engine.remaining) + ' с';
    }

    sx(worldX) {
      return Math.round(worldX - this.cameraX);
    }

    draw(time) {
      const ctx = this.ctx;
      this.drawBackground();
      this.drawLift();
      this.engine.shelves.forEach(s => this.drawShelf(s));
      this.engine.puddles.forEach(p => this.drawPuddle(p));
      this.engine.boxes.forEach(b => this.drawBox(b));
      this.engine.coffees.forEach(c => !c.taken && this.drawCoffee(c, time));
      this.engine.chairs.forEach(c => c.alive && this.drawChair(c, time));
      this.drawPlayer(time);
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.floaters.forEach(f => {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = '#000000';
        ctx.fillText(f.text, this.sx(f.x) + 1, f.y + FLOOR_Y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, this.sx(f.x), f.y + FLOOR_Y);
      });
      ctx.globalAlpha = 1;
      this.drawTimerBar();
      this.drawMessage();
    }

    drawBackground() {
      const ctx = this.ctx;
      ctx.fillStyle = '#d9d2bd';
      ctx.fillRect(0, 0, WIDTH, FLOOR_Y);
      ctx.fillStyle = '#b9b199';
      ctx.fillRect(0, 200, WIDTH, FLOOR_Y - 200);
      ctx.fillStyle = '#a69e86';
      ctx.fillRect(0, 200, WIDTH, 3);
      const far = this.cameraX * 0.55;
      for (let i = Math.floor(far / 230) - 1; i < Math.floor((far + WIDTH) / 230) + 2; i++) {
        const x = Math.round(i * 230 + 60 - far);
        ctx.fillStyle = '#7d7a6e';
        ctx.fillRect(x, 120, 56, 172);
        ctx.fillStyle = '#9a7a52';
        ctx.fillRect(x + 4, 124, 48, 168);
        ctx.fillStyle = '#c8c4b0';
        ctx.fillRect(x + 14, 150, 28, 10);
        ctx.fillStyle = '#e8e4d2';
        ctx.fillRect(x + 36, 214, 5, 5);
        ctx.fillStyle = '#4f7a46';
        ctx.fillRect(x + 80, 252, 22, 40);
        ctx.fillStyle = '#6a9a5c';
        ctx.fillRect(x + 76, 232, 30, 24);
      }
      ctx.fillStyle = '#6f6a5a';
      ctx.fillRect(0, 0, WIDTH, 44);
      const lamp = Math.floor(this.cameraX / 170);
      for (let i = lamp - 1; i < lamp + 5; i++) {
        const x = Math.round(i * 170 + 40 - this.cameraX);
        ctx.fillStyle = '#f6f4e0';
        ctx.fillRect(x, 14, 90, 10);
        ctx.fillStyle = 'rgba(255,250,210,0.12)';
        ctx.fillRect(x - 20, 24, 130, 176);
      }
      ctx.fillStyle = '#4a5f78';
      ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#3a4c62';
      const tile = Math.floor(this.cameraX / 64);
      for (let i = tile; i < tile + 12; i++) {
        const x = Math.round(i * 64 - this.cameraX);
        ctx.fillRect(x, FLOOR_Y, 2, HEIGHT - FLOOR_Y);
      }
      ctx.fillRect(0, FLOOR_Y + 30, WIDTH, 2);
      ctx.fillStyle = '#2e3c4e';
      ctx.fillRect(0, FLOOR_Y, WIDTH, 3);
    }

    drawLift() {
      const ctx = this.ctx;
      const e = this.engine;
      const x = this.sx(e.liftX);
      if (x > WIDTH + 20) return;
      ctx.fillStyle = '#55595f';
      ctx.fillRect(x - 6, FLOOR_Y - 176, 126, 176);
      ctx.fillStyle = '#1c1e22';
      ctx.fillRect(x, FLOOR_Y - 160, 114, 160);
      const closing = Math.min(1, e.remaining / 3);
      const door = 57 * (1 - (e.state === 'lost' ? 0 : closing) * 0.85);
      ctx.fillStyle = '#e8d890';
      ctx.fillRect(x + 8, FLOOR_Y - 150, 98, 150);
      ctx.fillStyle = '#9ca3ab';
      ctx.fillRect(x, FLOOR_Y - 160, door, 160);
      ctx.fillRect(x + 114 - door, FLOOR_Y - 160, door, 160);
      ctx.fillStyle = '#7e858d';
      ctx.fillRect(x + door - 3, FLOOR_Y - 160, 3, 160);
      ctx.fillRect(x + 114 - door, FLOOR_Y - 160, 3, 160);
      ctx.fillStyle = '#101214';
      ctx.fillRect(x + 36, FLOOR_Y - 196, 42, 18);
      ctx.fillStyle = '#ff5030';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(19 - Math.min(18, e.level)) + ' ↓', x + 57, FLOOR_Y - 187);
    }

    drawBox(box) {
      const ctx = this.ctx;
      const x = this.sx(box.x);
      if (x > WIDTH || x + box.w < 0) return;
      const y = FLOOR_Y - box.h;
      ctx.fillStyle = '#9a6e3a';
      ctx.fillRect(x, y, box.w, box.h);
      ctx.fillStyle = '#b98a50';
      ctx.fillRect(x + 2, y + 2, box.w - 4, box.h - 4);
      ctx.fillStyle = '#d8c090';
      ctx.fillRect(x + box.w / 2 - 4, y, 8, box.h);
      ctx.fillStyle = '#6b4a24';
      ctx.fillRect(x, y, box.w, 2);
      ctx.fillRect(x + 6, y + box.h - 14, 12, 3);
    }

    drawPuddle(puddle) {
      const ctx = this.ctx;
      const x = this.sx(puddle.x);
      if (x > WIDTH || x + puddle.w < 0) return;
      ctx.fillStyle = puddle.hit ? '#5f8fbf' : '#6aa0d8';
      ctx.beginPath();
      ctx.ellipse(x + puddle.w / 2, FLOOR_Y + 5, puddle.w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + puddle.w * 0.3, FLOOR_Y + 3, puddle.w * 0.25, 2);
    }

    drawShelf(shelf) {
      const ctx = this.ctx;
      const x = this.sx(shelf.x);
      if (x > WIDTH || x + shelf.w < 0) return;
      const y = FLOOR_Y - shelf.top;
      ctx.fillStyle = '#8a8f96';
      ctx.fillRect(x + 8, y + 8, 4, 18);
      ctx.fillRect(x + shelf.w - 12, y + 8, 4, 18);
      ctx.fillStyle = '#a07a4a';
      ctx.fillRect(x, y, shelf.w, 9);
      ctx.fillStyle = '#c49a64';
      ctx.fillRect(x, y, shelf.w, 3);
    }

    drawCoffee(coffee, time) {
      const ctx = this.ctx;
      const x = this.sx(coffee.x);
      if (x > WIDTH + 20 || x < -20) return;
      const y = FLOOR_Y + coffee.y + Math.sin(time * 4 + coffee.x) * 2;
      ctx.fillStyle = '#f2f2ec';
      ctx.fillRect(x - 7, y - 7, 14, 14);
      ctx.fillStyle = '#6a4224';
      ctx.fillRect(x - 5, y - 5, 10, 4);
      ctx.strokeStyle = '#f2f2ec';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 9, y, 4, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 10);
      ctx.lineTo(x - 1, y - 15);
      ctx.moveTo(x + 3, y - 10);
      ctx.lineTo(x + 4, y - 14);
      ctx.stroke();
    }

    drawChair(chair, time) {
      const ctx = this.ctx;
      const x = this.sx(chair.x);
      if (x > WIDTH + 40 || x < -40) return;
      const spin = time * 12;
      ctx.fillStyle = '#2c2f36';
      ctx.fillRect(x - 15, FLOOR_Y - 18, 30, 6);
      ctx.fillRect(x + 6, FLOOR_Y - 36, 7, 20);
      ctx.fillStyle = '#4a4f5c';
      ctx.fillRect(x - 15, FLOOR_Y - 18, 30, 2);
      ctx.fillStyle = '#666b76';
      ctx.fillRect(x - 2, FLOOR_Y - 12, 4, 8);
      ctx.fillRect(x - 12, FLOOR_Y - 5, 24, 2);
      ctx.fillStyle = '#111111';
      [-11, 0, 11].forEach((dx, i) => {
        const bob = Math.sin(spin + i) > 0 ? 0 : 1;
        ctx.fillRect(x + dx - 2, FLOOR_Y - 5 - bob + 1, 5, 5);
      });
    }

    drawPlayer(time) {
      const ctx = this.ctx;
      const p = this.engine.player;
      if (p.invulnerable > 0 && Math.floor(time * 14) % 2 === 0) return;
      const x = this.sx(p.x);
      const y = FLOOR_Y + p.y;
      const swing = p.onGround ? Math.sin(p.runPhase) : 0.9;
      const airborne = !p.onGround;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(p.facing, 1);
      if (p.slip > 0 && p.onGround) ctx.rotate(-0.12);
      ctx.strokeStyle = '#2a2f55';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(-2 - swing * 9, airborne ? -4 : 0);
      ctx.moveTo(3, -14);
      ctx.lineTo(3 + swing * 9, airborne ? -8 : 0);
      ctx.stroke();
      ctx.fillStyle = '#f2f0e8';
      ctx.fillRect(-7, -32, 14, 20);
      ctx.fillStyle = '#c8322a';
      ctx.fillRect(1, -31, 3, 13);
      ctx.strokeStyle = '#f2f0e8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -29);
      ctx.lineTo(7 + swing * 6, -22);
      ctx.moveTo(0, -29);
      ctx.lineTo(-5 - swing * 6, -22);
      ctx.stroke();
      ctx.fillStyle = '#e8c49a';
      ctx.beginPath();
      ctx.arc(1, -38, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(-5, -45, 11, 4);
      ctx.fillStyle = '#222222';
      ctx.fillRect(4, -39, 2, 2);
      ctx.strokeStyle = '#6b4a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8 + swing * 6, -22);
      ctx.lineTo(13 + swing * 6, -22);
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 1;
    }

    drawTimerBar() {
      const ctx = this.ctx;
      const e = this.engine;
      const ratio = Math.max(0, Math.min(1, e.remaining / e.timeLimit));
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, WIDTH, 22);
      ctx.fillStyle = ratio > 0.3 ? '#69c46a' : '#e0503c';
      ctx.fillRect(4, 5, (WIDTH - 8) * ratio, 12);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(3.5, 4.5, WIDTH - 7, 13);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ДО КОНЦА РАБОЧЕГО ДНЯ ' + formatTime(e.remaining) + ' с', WIDTH / 2, 12);
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['ПОСЛЕДНИЙ ЛИФТ', 'Влево / Вправо — бег, Пробел — прыжок', 'Добегите до лифта, пока двери не закрылись', 'Пробел — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'won') {
        lines = ['ЛИФТ ВАШ', 'Очки: ' + e.score, 'Пробел — следующий этаж'];
      } else if (this.mode === 'lost') {
        lines = ['ДВЕРИ ЗАКРЫЛИСЬ', 'Очки: ' + e.score];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — ещё раз');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 70;
      ctx.fillStyle = 'rgba(10,12,18,0.84)';
      ctx.fillRect(110, top, WIDTH - 220, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(110.5, top + 0.5, WIDTH - 221, height - 1);
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
    ctx.fillStyle = '#d9d2bd';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a5f78';
    ctx.fillRect(0, 46, w, h - 46);
    ctx.fillStyle = '#9ca3ab';
    ctx.fillRect(68, 10, 22, 36);
    ctx.fillStyle = '#7e858d';
    ctx.fillRect(78, 10, 2, 36);
    ctx.fillStyle = '#9a6e3a';
    ctx.fillRect(40, 36, 12, 10);
    ctx.fillStyle = '#f2f0e8';
    ctx.fillRect(14, 20, 8, 12);
    ctx.fillStyle = '#c8322a';
    ctx.fillRect(18, 21, 2, 8);
    ctx.fillStyle = '#e8c49a';
    ctx.fillRect(15, 12, 7, 7);
    ctx.fillStyle = '#2a2f55';
    ctx.fillRect(14, 32, 3, 14);
    ctx.fillRect(20, 32, 3, 12);
  }

  const app = new LiftApp();
  window.appOg2Lift = app;
  window.Og2.attach('lift', { open: () => app.open(), drawIcon });
})();
