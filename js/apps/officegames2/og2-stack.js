(() => {
  const WIDTH = 480;
  const HEIGHT = 440;
  const CELL = 21;
  const BOARD_X = 130;
  const BOARD_Y = 10;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';
  const COLORS = ['#4fc3d9', '#e8c93a', '#a05ad0', '#58b858', '#e04a3c', '#3c6ae0', '#e8903a'];
  const REPEAT_DELAY = 0.17;
  const REPEAT_RATE = 0.05;
  const SOFT_RATE = 0.04;

  class StackApp {
    constructor() {
      this.winId = 'og2_stack';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Стопка',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-stack-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="lines"></span>
            <span data-cell="level"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2StackEngine();
      this.mode = 'ready';
      this.held = { left: false, right: false, down: false };
      this.repeat = { left: 0, right: 0, down: 0 };
      this.clearAnim = null;
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
      this.held.down = false;
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      const playing = this.mode === 'play' && !this.clearAnim;
      if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowdown' || key === 'arrowup' || key === ' ') e.preventDefault();
      if (e.repeat) return;
      if (key === 'arrowleft') this.pressDirection('left', playing);
      else if (key === 'arrowright') this.pressDirection('right', playing);
      else if (key === 'arrowdown') {
        this.held.down = true;
        this.repeat.down = 0;
      } else if ((key === 'arrowup' || key === 'x') && playing) {
        if (this.engine.rotate(1)) window.Og2.beep(520, 0.02, 'square', 0.025);
      } else if (key === 'z' && playing) {
        if (this.engine.rotate(-1)) window.Og2.beep(480, 0.02, 'square', 0.025);
      } else if ((key === 'c' || key === 'shift') && playing) {
        if (this.engine.swapHold()) window.Og2.beep(360, 0.04, 'triangle', 0.03);
      } else if (key === ' ') {
        if (playing) this.afterEvents(this.engine.hardDrop());
        else this.primaryAction();
      } else if (key === 'enter') {
        this.primaryAction();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') {
          this.mode = 'paused';
          this.releaseKeys();
        } else if (this.mode === 'paused') {
          this.mode = 'play';
        }
      }
    }

    pressDirection(side, playing) {
      this.held[side] = true;
      this.repeat[side] = -REPEAT_DELAY;
      if (playing && this.engine.move(side === 'left' ? -1 : 1)) window.Og2.beep(260, 0.015, 'square', 0.02);
    }

    onKeyUp(e) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft') this.held.left = false;
      else if (key === 'arrowright') this.held.right = false;
      else if (key === 'arrowdown') this.held.down = false;
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'over') {
        this.engine.restart();
        this.clearAnim = null;
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
      this.draw(now / 1000);
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(dt) {
      if (this.clearAnim) {
        this.clearAnim.t += dt;
        if (this.clearAnim.t >= 0.28) this.clearAnim = null;
        return;
      }
      this.handleRepeats(dt);
      this.afterEvents(this.engine.update(dt));
    }

    handleRepeats(dt) {
      ['left', 'right'].forEach(side => {
        if (!this.held[side]) return;
        this.repeat[side] += dt;
        while (this.repeat[side] >= REPEAT_RATE) {
          this.repeat[side] -= REPEAT_RATE;
          this.engine.move(side === 'left' ? -1 : 1);
        }
      });
      if (this.held.down) {
        this.repeat.down += dt;
        while (this.repeat.down >= SOFT_RATE) {
          this.repeat.down -= SOFT_RATE;
          this.engine.softDrop();
        }
      }
    }

    afterEvents(events) {
      if (!events.length) return;
      const beep = window.Og2.beep;
      if (events.includes('lock')) beep(200, 0.04, 'square', 0.04);
      if (events.includes('clear')) {
        this.clearAnim = { t: 0, info: this.engine.clearInfo };
        const count = this.engine.clearInfo.rows.length;
        beep(500 + count * 120, 0.12, 'triangle', 0.06);
        if (count === 4) beep(1200, 0.2, 'triangle', 0.06);
      }
      if (events.includes('levelUp')) [700, 900].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle'), 120 + i * 100));
      if (events.includes('over') || this.engine.state === 'over') {
        this.mode = 'over';
        beep(110, 0.5, 'sawtooth', 0.07);
        this.recordBeaten = window.Og2.submitScore('stack', this.engine.score);
      }
      this.updateStatus();
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.lines.textContent = 'Ряды: ' + e.lines;
      this.cells.level.textContent = 'Уровень: ' + e.level;
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('stack'), e.score);
    }

    drawBlock(x, y, type, size, alpha = 1) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[type];
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x, y, size, 2);
      ctx.fillRect(x, y, 2, size);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y + size - 2, size, 2);
      ctx.fillRect(x + size - 2, y, 2, size);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 4, y + 4, size - 8, 2);
      ctx.globalAlpha = 1;
    }

    draw(time) {
      const ctx = this.ctx;
      const e = this.engine;
      ctx.fillStyle = '#2a3140';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#10141c';
      ctx.fillRect(BOARD_X - 3, BOARD_Y - 3, CELL * 10 + 6, CELL * 20 + 6);
      ctx.fillStyle = '#171c27';
      ctx.fillRect(BOARD_X, BOARD_Y, CELL * 10, CELL * 20);
      ctx.fillStyle = '#1e2432';
      for (let c = 1; c < 10; c++) ctx.fillRect(BOARD_X + c * CELL, BOARD_Y, 1, CELL * 20);
      for (let r = 1; r < 20; r++) ctx.fillRect(BOARD_X, BOARD_Y + r * CELL, CELL * 10, 1);
      const info = this.clearAnim && this.clearAnim.info;
      const board = info ? info.snapshot : e.board;
      board.forEach((row, r) => row.forEach((value, c) => {
        if (value) this.drawBlock(BOARD_X + c * CELL, BOARD_Y + r * CELL, value - 1, CELL);
      }));
      if (info) {
        const flash = Math.min(1, this.clearAnim.t / 0.28);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.9 - flash * 0.5) + ')';
        info.rows.forEach(r => {
          const width = CELL * 10 * (1 - flash);
          ctx.fillRect(BOARD_X + (CELL * 10 - width) / 2, BOARD_Y + r * CELL, width, CELL);
        });
      } else if (e.state === 'playing' || this.mode === 'over') {
        this.drawActive();
      }
      this.drawSide();
      this.drawMessage(time);
    }

    drawActive() {
      const e = this.engine;
      if (this.mode === 'over') return;
      const ghost = { ...e.piece, y: e.ghostY() };
      e.cellsOf(ghost).forEach(cell => {
        if (cell.r >= 0) this.drawBlock(BOARD_X + cell.c * CELL, BOARD_Y + cell.r * CELL, e.piece.type, CELL, 0.22);
      });
      e.cellsOf(e.piece).forEach(cell => {
        if (cell.r >= 0) this.drawBlock(BOARD_X + cell.c * CELL, BOARD_Y + cell.r * CELL, e.piece.type, CELL);
      });
    }

    drawMini(type, x, y, size, alpha = 1) {
      const matrix = window.Og2StackEngine.matrixFor(type, 0);
      const filled = [];
      matrix.forEach((row, r) => row.forEach((v, c) => { if (v) filled.push({ r, c }); }));
      const minR = Math.min(...filled.map(f => f.r));
      const maxR = Math.max(...filled.map(f => f.r));
      const minC = Math.min(...filled.map(f => f.c));
      const maxC = Math.max(...filled.map(f => f.c));
      const offsetX = x - (maxC - minC + 1) * size / 2;
      const offsetY = y - (maxR - minR + 1) * size / 2;
      filled.forEach(f => this.drawBlock(offsetX + (f.c - minC) * size, offsetY + (f.r - minR) * size, type, size, alpha));
    }

    panel(x, y, w, h, title) {
      const ctx = this.ctx;
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y, 2, h);
      ctx.fillStyle = '#404040';
      ctx.fillRect(x, y + h - 2, w, 2);
      ctx.fillRect(x + w - 2, y, 2, h);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, x + w / 2, y + 14);
    }

    drawSide() {
      const ctx = this.ctx;
      const e = this.engine;
      this.panel(10, 10, 110, 90, 'ОТЛОЖЕНО');
      ctx.fillStyle = '#808080';
      ctx.fillRect(22, 34, 86, 54);
      if (e.hold !== null) this.drawMini(e.hold, 65, 61, 14, e.holdUsed ? 0.4 : 1);
      this.panel(10, 110, 110, 150, 'СТАТИСТИКА');
      ctx.font = '11px ' + FONT;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ['Очки', 'Ряды', 'Уровень'].forEach((label, i) => {
        ctx.fillText(label, 20, 148 + i * 38);
      });
      ctx.font = 'bold 15px ' + FONT;
      ctx.textAlign = 'right';
      [e.score, e.lines, e.level].forEach((value, i) => {
        ctx.fillText(String(value), 110, 164 + i * 38);
      });
      this.panel(350, 10, 120, 190, 'ДАЛЕЕ');
      e.upcoming(3).forEach((type, i) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(362, 34 + i * 54, 96, 48);
        this.drawMini(type, 410, 58 + i * 54, i === 0 ? 14 : 11);
      });
      this.panel(350, 210, 120, 150, 'КЛАВИШИ');
      ctx.font = '10px ' + FONT;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ['← → — сдвиг', '↑ / X — поворот', 'Z — назад', '↓ — ускорить', 'Пробел — сброс', 'C — отложить', 'P — пауза'].forEach((line, i) => {
        ctx.fillText(line, 360, 238 + i * 16);
      });
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['СТОПКА', 'Укладывайте папки без пустот', 'Полные ряды уходят в шредер', 'Пробел — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'over') {
        lines = ['СТОПКА РАЗВАЛИЛАСЬ', 'Очки: ' + e.score + ', ряды: ' + e.lines];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — заново');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 130;
      ctx.fillStyle = 'rgba(10,12,18,0.9)';
      ctx.fillRect(BOARD_X - 2, top, CELL * 10 + 4, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(BOARD_X - 1.5, top + 0.5, CELL * 10 + 3, height - 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#ffd36a' : '#ffffff';
        ctx.font = (i === 0 ? 'bold 15px ' : '11px ') + FONT;
        ctx.fillText(line, BOARD_X + CELL * 5, top + 24 + i * 24);
      });
    }
  }

  function drawIcon(ctx, w, h) {
    ctx.fillStyle = '#171c27';
    ctx.fillRect(0, 0, w, h);
    const blocks = [
      [2, 3, 0], [3, 3, 0], [4, 3, 0], [5, 3, 0],
      [0, 2, 5], [0, 3, 5], [1, 3, 5], [6, 2, 4], [6, 3, 4], [7, 3, 4],
      [3, 2, 2], [4, 2, 2], [4, 1, 2], [5, 2, 6], [5, 1, 6], [5, 0, 6]
    ];
    blocks.forEach(([c, r, t]) => {
      const x = 8 + c * 10;
      const y = 6 + r * 12;
      ctx.fillStyle = COLORS[t];
      ctx.fillRect(x, y, 10, 11);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, y, 10, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y + 9, 10, 2);
    });
  }

  const app = new StackApp();
  window.appOg2Stack = app;
  window.Og2.attach('stack', { open: () => app.open(), drawIcon });
})();
