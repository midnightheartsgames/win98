(() => {
  const WIDTH = 480;
  const HEIGHT = 420;
  const ROW_COLORS = ['#c8423c', '#d98a2b', '#d8c03a', '#4f9a52', '#3b7bc2', '#7a52a8'];
  const BONUS_LOOK = {
    wide: { color: '#2f8fd8', glyph: 'Ш' },
    multi: { color: '#d8672b', glyph: 'М' },
    slow: { color: '#4f9a52', glyph: 'З' },
    life: { color: '#c8423c', glyph: '+' }
  };

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const channel = (shift) => Math.max(0, Math.min(255, ((n >> shift) & 255) + amount));
    return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
  }

  class ArchiveApp {
    constructor() {
      this.winId = 'og2_archive';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Разгром архива',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-archive-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="lives"></span>
            <span data-cell="level"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2ArchiveEngine();
      this.mode = 'play';
      this.held = { left: false, right: false };
      this.particles = [];
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        up: (e) => this.onKeyUp(e),
        boss: (shown) => {
          this.held.left = false;
          this.held.right = false;
          if (shown && this.mode === 'play') this.mode = 'paused';
        }
      });
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
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

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        this.held.left = true;
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        this.held.right = true;
      } else if (key === ' ' || key === 'enter') {
        e.preventDefault();
        this.primaryAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') this.mode = 'paused';
        else if (this.mode === 'paused') this.mode = 'play';
      }
    }

    onKeyUp(e) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') this.held.left = false;
      else if (key === 'arrowright' || key === 'd') this.held.right = false;
    }

    onMouseMove(e) {
      if (this.mode !== 'play') return;
      const rect = this.canvas.getBoundingClientRect();
      this.engine.setPaddleX((e.clientX - rect.left) * WIDTH / rect.width);
    }

    primaryAction() {
      if (this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'play') {
        if (this.engine.launch()) window.Og2.beep(520, 0.05, 'square');
      } else if (this.mode === 'cleared') {
        this.engine.nextLevel();
        this.mode = 'play';
        this.updateStatus();
      } else if (this.mode === 'over') {
        this.engine.reset();
        this.recordBeaten = false;
        this.mode = 'play';
        this.updateStatus();
      }
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'play' && !window.Og2.isBossShown(this.winId)) this.advance(dt);
      this.stepParticles(dt);
      this.draw(now / 1000);
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(dt) {
      const direction = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
      if (direction) this.engine.setPaddleX(this.engine.paddle.x + direction * 440 * dt);
      const events = this.engine.update(dt);
      events.forEach(event => this.react(event));
      if (events.length) this.updateStatus();
    }

    react(event) {
      if (event === 'wall') window.Og2.beep(240, 0.03, 'square', 0.03);
      else if (event === 'paddle') window.Og2.beep(330, 0.04, 'square');
      else if (event === 'brick') window.Og2.beep(480, 0.04, 'square');
      else if (event === 'break') {
        window.Og2.beep(700, 0.06, 'square');
        this.spawnPaper();
      } else if (event === 'bonus') {
        window.Og2.beep(900, 0.05, 'triangle');
        window.Og2.beep(1200, 0.08, 'triangle');
      } else if (event === 'lifeLost') {
        window.Og2.beep(140, 0.3, 'sawtooth', 0.06);
      } else if (event === 'levelClear') {
        [660, 880, 1100].forEach((f, i) => setTimeout(() => window.Og2.beep(f, 0.12, 'triangle'), i * 110));
        this.mode = 'cleared';
      } else if (event === 'gameOver') {
        window.Og2.beep(100, 0.5, 'sawtooth', 0.07);
        this.mode = 'over';
        this.recordBeaten = window.Og2.submitScore('archive', this.engine.score);
      }
    }

    spawnPaper() {
      const broken = this.engine.lastBroken;
      if (!broken) return;
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: broken.x + Math.random() * 44,
          y: broken.y + 9,
          vx: (Math.random() - 0.5) * 120,
          vy: -Math.random() * 80,
          life: 0.7,
          color: ROW_COLORS[broken.row % ROW_COLORS.length]
        });
      }
    }

    stepParticles(dt) {
      this.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 380 * dt;
        p.life -= dt;
      });
      this.particles = this.particles.filter(p => p.life > 0);
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.lives.textContent = 'Попытки: ' + Math.max(0, e.lives);
      this.cells.level.textContent = 'Стеллаж: ' + e.level;
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('archive'), e.score);
    }

    draw(time) {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.fillStyle = '#2b2f3a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#343946';
      for (let y = 0; y < HEIGHT; y += 38) ctx.fillRect(0, y, WIDTH, 2);
      e.bricks.forEach(b => b.alive && this.drawFolder(b));
      e.bonuses.forEach(b => this.drawBonus(b, time));
      this.drawPaddle();
      e.balls.forEach(b => this.drawBall(b));
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / 0.7);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;
      this.drawTimers();
      this.drawMessage();
    }

    drawFolder(b) {
      const ctx = this.ctx;
      const color = b.maxHp > 1 ? '#8c93a0' : ROW_COLORS[b.row % ROW_COLORS.length];
      ctx.fillStyle = shade(color, -50);
      ctx.fillRect(b.x, b.y, 44, 18);
      ctx.fillStyle = color;
      ctx.fillRect(b.x + 1, b.y + 3, 42, 14);
      ctx.fillRect(b.x + 3, b.y, 16, 4);
      ctx.fillStyle = shade(color, 45);
      ctx.fillRect(b.x + 1, b.y + 3, 42, 2);
      if (b.maxHp > 1) {
        ctx.fillStyle = b.hp > 1 ? '#5c6270' : '#3c404a';
        ctx.fillRect(b.x + 4, b.y + 9, 36, 3);
        if (b.hp === 1) {
          ctx.strokeStyle = '#1c1e24';
          ctx.beginPath();
          ctx.moveTo(b.x + 12, b.y + 3);
          ctx.lineTo(b.x + 18, b.y + 10);
          ctx.lineTo(b.x + 15, b.y + 17);
          ctx.stroke();
        }
      }
    }

    drawPaddle() {
      const ctx = this.ctx;
      const p = this.engine.paddle;
      const left = p.x - p.w / 2;
      ctx.fillStyle = '#4b5060';
      ctx.fillRect(left, p.y, p.w, p.h);
      ctx.fillStyle = '#c0c4cc';
      ctx.fillRect(left + 1, p.y + 1, p.w - 2, 4);
      ctx.fillStyle = '#2f8fd8';
      ctx.fillRect(left + 6, p.y + 7, p.w - 12, 3);
    }

    drawBall(ball) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f2e8';
      ctx.fill();
      ctx.strokeStyle = '#9a978a';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ball.x - 3, ball.y - 1);
      ctx.lineTo(ball.x + 1, ball.y + 3);
      ctx.strokeStyle = '#b9b6a8';
      ctx.stroke();
    }

    drawBonus(bonus, time) {
      const ctx = this.ctx;
      const look = BONUS_LOOK[bonus.type];
      const wobble = Math.sin(time * 8 + bonus.x) * 2;
      ctx.fillStyle = look.color;
      ctx.fillRect(bonus.x - 12 + wobble, bonus.y - 8, 24, 16);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(bonus.x - 11.5 + wobble, bonus.y - 7.5, 23, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Microsoft Sans Serif", Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(look.glyph, bonus.x + wobble, bonus.y + 1);
    }

    drawTimers() {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.font = '11px "Microsoft Sans Serif", Tahoma, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      let y = 14;
      if (e.wideTimer > 0) {
        ctx.fillStyle = '#7fc4f4';
        ctx.fillText('Широкий лоток ' + Math.ceil(e.wideTimer) + ' с', 8, y);
        y += 14;
      }
      if (e.slowTimer > 0) {
        ctx.fillStyle = '#8fd08f';
        ctx.fillText('Замедление ' + Math.ceil(e.slowTimer) + ' с', 8, y);
      }
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'paused') lines = ['ПАУЗА', 'Пробел — продолжить'];
      else if (this.mode === 'cleared') lines = ['СТЕЛЛАЖ РАЗГРОМЛЕН', 'Очки: ' + e.score, 'Пробел — следующий стеллаж'];
      else if (this.mode === 'over') {
        lines = ['АРХИВ ОТСТОЯЛ', 'Очки: ' + e.score];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — ещё раз');
      } else if (e.hasStuckBall) {
        lines = ['Мышь или стрелки — лоток', 'Пробел или клик — бросок'];
      }
      if (!lines) return;
      const ctx = this.ctx;
      const top = this.mode === 'play' ? 250 : 150;
      const height = 24 + lines.length * 24;
      ctx.fillStyle = 'rgba(10,12,18,0.82)';
      ctx.fillRect(100, top, WIDTH - 200, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(100.5, top + 0.5, WIDTH - 201, height - 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        const heading = i === 0 && this.mode !== 'play';
        ctx.fillStyle = heading ? '#ffd36a' : '#ffffff';
        ctx.font = (heading ? 'bold 17px' : '13px') + ' "Microsoft Sans Serif", Tahoma, sans-serif';
        ctx.fillText(line, WIDTH / 2, top + 24 + i * 24);
      });
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#2b2f3a';
    ctx.fillRect(0, 0, w, h);
    const colors = ['#c8423c', '#d98a2b', '#d8c03a', '#4f9a52'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = colors[r];
        ctx.fillRect(4 + c * 15, 5 + r * 8, 13, 6);
      }
    }
    ctx.beginPath();
    ctx.arc(58, 40, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f2e8';
    ctx.fill();
    ctx.fillStyle = '#c0c4cc';
    ctx.fillRect(36, 52, 34, 5);
    ctx.fillStyle = '#2f8fd8';
    ctx.fillRect(40, 55, 26, 2);
  }

  const app = new ArchiveApp();
  window.appOg2Archive = app;
  window.Og2.attach('archive', { open: () => app.open(), drawIcon });
})();
