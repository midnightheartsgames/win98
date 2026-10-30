(() => {
  const WIDTH = 560;
  const HEIGHT = 432;
  const CELL = 44;
  const BOARD_X = 14;
  const BOARD_Y = 14;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';
  const BALL_COLORS = [
    ['#ff9a94', '#e53935', '#8e1a17'],
    ['#9ccbff', '#1e88e5', '#0d4a8a'],
    ['#a8e6a0', '#43a047', '#1f5a24'],
    ['#fff59a', '#fdd835', '#a88a00'],
    ['#d9a0e8', '#8e24aa', '#4a1260'],
    ['#ffcf8a', '#fb8c00', '#9a5200']
  ];

  class FiveApp {
    constructor() {
      this.winId = 'og2_five';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Пять в линию',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-five-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="turns"></span>
            <span data-cell="free"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2FiveEngine();
      this.shown = this.engine.board.map(row => row.map(ball => (ball ? { ...ball } : null)));
      this.mode = 'ready';
      this.selected = null;
      this.hover = null;
      this.steps = [];
      this.anim = null;
      this.particles = [];
      this.floaters = [];
      this.displayScore = 0;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        boss: (shown) => { if (shown && this.mode === 'play') this.mode = 'paused'; }
      });
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('mousemove', (e) => { this.hover = this.cellAt(e); });
      this.canvas.addEventListener('mouseleave', () => { this.hover = null; });
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

    cellAt(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * WIDTH / rect.width - BOARD_X;
      const y = (e.clientY - rect.top) * HEIGHT / rect.height - BOARD_Y;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (r < 0 || c < 0 || r >= 9 || c >= 9) return null;
      return { r, c };
    }

    busy() {
      return !!this.anim || this.steps.length > 0;
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        this.primaryAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') this.mode = 'paused';
        else if (this.mode === 'paused') this.mode = 'play';
      }
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'over') {
        this.engine.restart();
        this.shown = this.engine.board.map(row => row.map(ball => (ball ? { ...ball } : null)));
        this.selected = null;
        this.steps = [];
        this.anim = null;
        this.displayScore = 0;
        this.recordBeaten = false;
        this.mode = 'play';
        this.updateStatus();
      }
    }

    onMouseDown(e) {
      if (this.mode !== 'play') {
        this.primaryAction();
        return;
      }
      if (this.busy()) return;
      const cell = this.cellAt(e);
      if (!cell) return;
      if (this.shown[cell.r][cell.c]) {
        const same = this.selected && this.selected.r === cell.r && this.selected.c === cell.c;
        this.selected = same ? null : cell;
        window.Og2.beep(same ? 330 : 520, 0.03, 'square', 0.025);
        return;
      }
      if (!this.selected) return;
      const from = this.selected;
      const result = this.engine.move(from, cell);
      if (!result.valid) {
        window.Og2.beep(150, 0.1, 'sawtooth', 0.04);
        return;
      }
      this.selected = null;
      result.phases.forEach(phase => {
        if (phase.kind === 'move') this.steps.push({ kind: 'move', phase, dur: Math.max(0.16, (phase.path.length - 1) * 0.045) });
        else if (phase.kind === 'spawn') this.steps.push({ kind: 'spawn', phase, dur: 0.28 });
        else this.steps.push({ kind: 'clear', phase, dur: 0.3 });
      });
      this.updateStatus();
    }

    loop(now) {
      if (!this.win) return;
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.mode === 'play' && !window.Og2.isBossShown(this.winId)) this.advance(dt);
      this.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
        p.life -= dt;
      });
      this.particles = this.particles.filter(p => p.life > 0);
      this.floaters.forEach(f => {
        f.life -= dt;
        f.y -= 34 * dt;
      });
      this.floaters = this.floaters.filter(f => f.life > 0);
      this.displayScore += (this.engine.score - this.displayScore) * Math.min(1, dt * 7);
      if (Math.abs(this.engine.score - this.displayScore) < 1) this.displayScore = this.engine.score;
      this.draw(now / 1000);
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(dt) {
      if (!this.anim && this.steps.length) this.beginStep(this.steps.shift());
      if (this.anim) {
        this.anim.t += dt;
        if (this.anim.t >= this.anim.step.dur) this.endStep();
      } else if (this.engine.state === 'over') {
        this.mode = 'over';
        this.recordBeaten = window.Og2.submitScore('five', this.engine.score);
        window.Og2.beep(120, 0.5, 'sawtooth', 0.06);
      }
    }

    beginStep(step) {
      this.anim = { step, t: 0 };
      const phase = step.phase;
      if (step.kind === 'move') {
        this.shown[phase.from.r][phase.from.c] = null;
      } else if (step.kind === 'clear') {
        window.Og2.beep(660 + phase.cells.length * 40, 0.12, 'triangle', 0.05);
        phase.cells.forEach(cell => {
          const cx = BOARD_X + cell.c * CELL + CELL / 2;
          const cy = BOARD_Y + cell.r * CELL + CELL / 2;
          const color = cell.ball.wild ? '#ffffff' : BALL_COLORS[cell.ball.color][1];
          for (let i = 0; i < 5; i++) {
            this.particles.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 180, life: 0.55, color });
          }
        });
        const mid = phase.cells[Math.floor(phase.cells.length / 2)];
        this.floaters.push({ text: '+' + phase.gain, x: BOARD_X + mid.c * CELL + CELL / 2, y: BOARD_Y + mid.r * CELL, life: 1 });
      } else if (step.kind === 'spawn') {
        window.Og2.beep(300, 0.05, 'square', 0.03);
      }
    }

    endStep() {
      const { step } = this.anim;
      const phase = step.phase;
      if (step.kind === 'move') {
        this.shown[phase.to.r][phase.to.c] = { ...phase.ball };
      } else if (step.kind === 'spawn') {
        phase.balls.forEach(b => { this.shown[b.r][b.c] = { ...b.ball }; });
      } else {
        phase.cells.forEach(cell => { this.shown[cell.r][cell.c] = null; });
      }
      this.anim = null;
      this.updateStatus();
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.turns.textContent = 'Ходы: ' + e.turns;
      this.cells.free.textContent = 'Свободно: ' + e.emptyCells().length;
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('five'), e.score);
    }

    draw(time) {
      const ctx = this.ctx;
      ctx.fillStyle = '#4a5a6a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#808080';
      ctx.fillRect(BOARD_X - 4, BOARD_Y - 4, CELL * 9 + 8, CELL * 9 + 8);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) this.drawCell(r, c);
      }
      this.drawPath(time);
      this.drawBalls(time);
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;
      ctx.font = 'bold 15px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.floaters.forEach(f => {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = '#000000';
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = '#ffe27a';
        ctx.fillText(f.text, f.x, f.y);
      });
      ctx.globalAlpha = 1;
      this.drawPanel(time);
      this.drawMessage();
    }

    drawCell(r, c) {
      const ctx = this.ctx;
      const x = BOARD_X + c * CELL;
      const y = BOARD_Y + r * CELL;
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, CELL, 2);
      ctx.fillRect(x, y, 2, CELL);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x, y + CELL - 2, CELL, 2);
      ctx.fillRect(x + CELL - 2, y, 2, CELL);
      ctx.fillStyle = '#808080';
      ctx.fillRect(x + 2, y + CELL - 3, CELL - 4, 1);
      ctx.fillRect(x + CELL - 3, y + 2, 1, CELL - 4);
    }

    drawPath(time) {
      if (!this.selected || !this.hover || this.busy() || this.mode !== 'play') return;
      if (this.shown[this.hover.r][this.hover.c]) return;
      const ctx = this.ctx;
      const path = this.engine.findPath(this.selected, this.hover);
      if (!path) {
        const x = BOARD_X + this.hover.c * CELL + CELL / 2;
        const y = BOARD_Y + this.hover.r * CELL + CELL / 2;
        ctx.strokeStyle = '#c8322a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 7);
        ctx.lineTo(x + 7, y + 7);
        ctx.moveTo(x + 7, y - 7);
        ctx.lineTo(x - 7, y + 7);
        ctx.stroke();
        ctx.lineWidth = 1;
        return;
      }
      path.slice(1).forEach((cell, i) => {
        ctx.fillStyle = 'rgba(30,60,160,' + (0.35 + 0.25 * Math.sin(time * 8 - i)) + ')';
        ctx.beginPath();
        ctx.arc(BOARD_X + cell.c * CELL + CELL / 2, BOARD_Y + cell.r * CELL + CELL / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawBalls(time) {
      const anim = this.anim;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const ball = this.shown[r][c];
          if (!ball) continue;
          let scale = 1;
          let alpha = 1;
          let lift = 0;
          if (this.selected && this.selected.r === r && this.selected.c === c) lift = Math.abs(Math.sin(time * 7)) * 5;
          if (anim && anim.step.kind === 'clear' && anim.step.phase.cells.some(cell => cell.r === r && cell.c === c)) {
            const p = anim.t / anim.step.dur;
            scale = 1 - p;
            alpha = 1 - p;
          }
          this.drawBall(ball, BOARD_X + c * CELL + CELL / 2, BOARD_Y + r * CELL + CELL / 2 - lift, 17 * scale, alpha, time);
        }
      }
      if (!anim) return;
      const p = Math.min(1, anim.t / anim.step.dur);
      if (anim.step.kind === 'move') {
        const path = anim.step.phase.path;
        const position = p * (path.length - 1);
        const index = Math.min(path.length - 2, Math.floor(position));
        const local = position - index;
        const a = path[index];
        const b = path[index + 1];
        const x = a.c + (b.c - a.c) * local;
        const y = a.r + (b.r - a.r) * local;
        this.drawBall(anim.step.phase.ball, BOARD_X + x * CELL + CELL / 2, BOARD_Y + y * CELL + CELL / 2, 17, 1, time);
      } else if (anim.step.kind === 'spawn') {
        anim.step.phase.balls.forEach(b => {
          const grow = p < 0.7 ? p / 0.7 * 1.2 : 1.2 - (p - 0.7) / 0.3 * 0.2;
          this.drawBall(b.ball, BOARD_X + b.c * CELL + CELL / 2, BOARD_Y + b.r * CELL + CELL / 2, 17 * grow, 1, time);
        });
      }
    }

    drawBall(ball, x, y, radius, alpha, time) {
      if (radius <= 0.5) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x + 2, y + radius * 0.85, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      if (ball.wild) {
        const sweep = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 1, x, y, radius);
        sweep.addColorStop(0, '#ffffff');
        sweep.addColorStop(1, '#b8b8c8');
        ctx.fillStyle = sweep;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        const rainbow = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
        ctx.lineWidth = Math.max(1, radius * 0.22);
        rainbow.forEach((color, i) => {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.7, time * 2 + i * 1.256, time * 2 + i * 1.256 + 1.1);
          ctx.stroke();
        });
        ctx.lineWidth = 1;
      } else {
        const [light, mid, dark] = BALL_COLORS[ball.color];
        const grad = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius);
        grad.addColorStop(0, light);
        grad.addColorStop(0.55, mid);
        grad.addColorStop(1, dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(x - radius * 0.35, y - radius * 0.4, radius * 0.25, radius * 0.16, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawPanel(time) {
      const ctx = this.ctx;
      const e = this.engine;
      const x = 424;
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x, 10, 128, HEIGHT - 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 10, 128, 2);
      ctx.fillRect(x, 10, 2, HEIGHT - 20);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x, HEIGHT - 12, 128, 2);
      ctx.fillRect(x + 126, 10, 2, HEIGHT - 20);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px ' + FONT;
      ctx.fillText('СЛЕДУЮЩИЕ', x + 64, 32);
      e.upcoming.forEach((ball, i) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 12 + i * 36, 46, 32, 32);
        ctx.fillStyle = '#d8d8d8';
        ctx.fillRect(x + 13 + i * 36, 47, 30, 30);
        this.drawBall(ball, x + 28 + i * 36, 62, 11, 1, time);
      });
      ctx.fillStyle = '#000000';
      ctx.font = '11px ' + FONT;
      ctx.fillText('ОЧКИ', x + 64, 112);
      ctx.font = 'bold 24px ' + FONT;
      ctx.fillText(String(Math.round(this.displayScore)), x + 64, 136);
      ctx.font = '11px ' + FONT;
      ctx.fillText('РЕКОРД', x + 64, 168);
      ctx.font = 'bold 16px ' + FONT;
      ctx.fillText(String(Math.max(window.Og2.bestScore('five'), e.score)), x + 64, 188);
      ctx.font = '10px ' + FONT;
      ctx.fillStyle = '#303030';
      ['Соберите 5 и больше', 'шариков одного цвета', 'в линию: по строке,', 'столбцу или диагонали.', '', 'Радужный шар —', 'джокер, подходит', 'к любому цвету.'].forEach((line, i) => {
        ctx.fillText(line, x + 64, 232 + i * 15);
      });
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['ПЯТЬ В ЛИНИЮ', 'Выберите шарик, затем свободную клетку', 'Путь должен быть свободен', 'Клик — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'over') {
        lines = ['ПОЛЕ ЗАПОЛНЕНО', 'Очки: ' + e.score + ', ходов: ' + e.turns];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — заново');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 130;
      ctx.fillStyle = 'rgba(10,12,18,0.88)';
      ctx.fillRect(30, top, 360, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(30.5, top + 0.5, 359, height - 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#ffd36a' : '#ffffff';
        ctx.font = (i === 0 ? 'bold 17px ' : '13px ') + FONT;
        ctx.fillText(line, 210, top + 24 + i * 24);
      });
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c0c0c0';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) ctx.fillRect(4 + c * 17, 6 + r * 17, 15, 15);
    }
    const colors = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(11.5 + i * 17, 31, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(28, 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.arc(62, 48, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const app = new FiveApp();
  window.appOg2Five = app;
  window.Og2.attach('five', { open: () => app.open(), drawIcon });
})();
