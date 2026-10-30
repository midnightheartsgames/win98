(() => {
  const WIDTH = 560;
  const HEIGHT = 432;
  const CELL = 51;
  const BOARD_X = 12;
  const BOARD_Y = 12;
  const FONT = '"Microsoft Sans Serif", Tahoma, sans-serif';
  const TILE_BACK = ['#c9d8f0', '#f6e6a0', '#f6c6d0', '#f2b0a8', '#f6d0a0', '#b8e6b8'];
  const TILE_EDGE = ['#8fa8cf', '#c9b25a', '#cf8a9a', '#c9766c', '#cf9f60', '#7fbf7f'];
  const STEP_SOUND = [523, 587, 659, 740, 831, 932, 1047];

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  class MixApp {
    constructor() {
      this.winId = 'og2_mix';
      this.win = null;
    }

    open() {
      if (window.winManager.windows.has(this.winId)) {
        window.winManager.bringToTop(this.winId);
        return;
      }
      this.win = window.Og2.createWindow({
        id: this.winId,
        title: 'Канцелярский микс',
        width: WIDTH + 8,
        height: HEIGHT + 56,
        onClose: () => this.dispose(),
        content: `
          <canvas class="og2-mix-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="og2-status">
            <span data-cell="score"></span>
            <span data-cell="moves"></span>
            <span data-cell="level"></span>
            <span data-cell="best"></span>
          </div>
        `
      });
      this.canvas = this.win.body.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.cells = {};
      this.win.body.querySelectorAll('[data-cell]').forEach(el => { this.cells[el.dataset.cell] = el; });
      this.engine = new window.Og2MixEngine();
      this.shown = this.engine.cloneBoard();
      this.mode = 'ready';
      this.selected = null;
      this.dragFrom = null;
      this.steps = [];
      this.anim = null;
      this.particles = [];
      this.floaters = [];
      this.displayScore = 0;
      this.idle = 0;
      this.hint = null;
      this.notice = null;
      this.recordBeaten = false;
      this.lastFrame = performance.now();
      this.stopKeys = window.Og2.listenKeys(this.winId, {
        down: (e) => this.onKeyDown(e),
        boss: (shown) => { if (shown && this.mode === 'play') this.mode = 'paused'; }
      });
      this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('mouseup', this.onMouseUp = () => { this.dragFrom = null; });
      this.updateStatus();
      this.frame = requestAnimationFrame((now) => this.loop(now));
    }

    dispose() {
      if (this.stopKeys) this.stopKeys();
      window.removeEventListener('mouseup', this.onMouseUp);
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
      if (r < 0 || c < 0 || r >= this.engine.size || c >= this.engine.size) return null;
      return { r, c };
    }

    busy() {
      return !!this.anim || this.steps.length > 0;
    }

    onMouseDown(e) {
      if (this.mode !== 'play') {
        this.primaryAction();
        return;
      }
      if (this.busy()) return;
      const cell = this.cellAt(e);
      if (!cell) return;
      this.idle = 0;
      this.hint = null;
      const sel = this.selected;
      if (sel && Math.abs(sel.r - cell.r) + Math.abs(sel.c - cell.c) === 1) {
        this.selected = null;
        this.attemptSwap(sel, cell);
        return;
      }
      this.selected = sel && sel.r === cell.r && sel.c === cell.c ? null : cell;
      this.dragFrom = cell;
      window.Og2.beep(440, 0.03, 'square', 0.025);
    }

    onMouseMove(e) {
      if (!this.dragFrom || this.mode !== 'play' || this.busy()) return;
      const cell = this.cellAt(e);
      if (!cell) return;
      const from = this.dragFrom;
      if (Math.abs(from.r - cell.r) + Math.abs(from.c - cell.c) === 1) {
        this.dragFrom = null;
        this.selected = null;
        this.attemptSwap(from, cell);
      }
    }

    onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        this.primaryAction();
      } else if (key === 'h' && this.mode === 'play' && !this.busy()) {
        this.hint = this.engine.findMove();
      } else if (key === 'p' || key === 'escape') {
        if (this.mode === 'play') this.mode = 'paused';
        else if (this.mode === 'paused') this.mode = 'play';
      }
    }

    primaryAction() {
      if (this.mode === 'ready' || this.mode === 'paused') {
        this.mode = 'play';
      } else if (this.mode === 'levelClear') {
        this.engine.nextLevel();
        this.resetBoardView();
        this.mode = 'play';
      } else if (this.mode === 'over') {
        this.engine.restart();
        this.displayScore = 0;
        this.recordBeaten = false;
        this.resetBoardView();
        this.mode = 'play';
      }
    }

    resetBoardView() {
      this.shown = this.engine.cloneBoard();
      this.selected = null;
      this.hint = null;
      this.steps = [];
      this.anim = null;
      this.particles = [];
      this.floaters = [];
      this.idle = 0;
      this.updateStatus();
    }

    attemptSwap(a, b) {
      const result = this.engine.trySwap(a.r, a.c, b.r, b.c);
      if (!result.valid) {
        if (this.engine.state === 'playing') {
          this.steps.push({ kind: 'swap', a, b, dur: 0.14 }, { kind: 'swap', a, b, dur: 0.14, undo: true });
          window.Og2.beep(160, 0.08, 'sawtooth', 0.04);
        }
        return;
      }
      this.steps.push({ kind: 'swap', a, b, dur: 0.14, commit: true });
      result.phases.forEach(phase => {
        if (phase.shuffle) {
          this.steps.push({ kind: 'shuffle', phase, dur: 0.7 });
        } else {
          this.steps.push({ kind: 'clear', phase, dur: 0.22 }, { kind: 'fall', phase, dur: 0.3 });
        }
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
        p.vy += 500 * dt;
        p.life -= dt;
      });
      this.particles = this.particles.filter(p => p.life > 0);
      this.floaters.forEach(f => {
        f.life -= dt;
        f.y -= 34 * dt;
      });
      this.floaters = this.floaters.filter(f => f.life > 0);
      this.displayScore += (this.engine.score - this.displayScore) * Math.min(1, dt * 6);
      if (Math.abs(this.engine.score - this.displayScore) < 1) this.displayScore = this.engine.score;
      this.draw(now / 1000);
      this.frame = requestAnimationFrame((t) => this.loop(t));
    }

    advance(dt) {
      if (!this.anim && this.steps.length) this.beginStep(this.steps.shift());
      if (this.anim) {
        this.anim.t += dt;
        if (this.anim.t >= this.anim.step.dur) this.endStep();
      } else {
        this.idle += dt;
        if (this.idle > 6 && !this.hint && this.engine.state === 'playing') this.hint = this.engine.findMove();
        this.settle();
      }
    }

    settle() {
      if (this.mode !== 'play') return;
      if (this.engine.state === 'levelClear') {
        this.mode = 'levelClear';
        this.recordBeaten = window.Og2.submitScore('mix', this.engine.score) || this.recordBeaten;
        [660, 880, 1100].forEach((f, i) => setTimeout(() => window.Og2.beep(f, 0.12, 'triangle'), i * 110));
      } else if (this.engine.state === 'over') {
        this.mode = 'over';
        this.recordBeaten = window.Og2.submitScore('mix', this.engine.score);
        window.Og2.beep(120, 0.5, 'sawtooth', 0.06);
      }
    }

    beginStep(step) {
      this.anim = { step, t: 0 };
      if (step.kind === 'clear') {
        const phase = step.phase;
        window.Og2.beep(STEP_SOUND[Math.min(phase.cascade - 1, STEP_SOUND.length - 1)], 0.1, 'triangle', 0.05);
        phase.cleared.forEach(cell => {
          const cx = BOARD_X + cell.c * CELL + CELL / 2;
          const cy = BOARD_Y + cell.r * CELL + CELL / 2;
          for (let i = 0; i < 4; i++) {
            this.particles.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 160, life: 0.5, color: TILE_EDGE[cell.type] });
          }
        });
        const mid = phase.cleared[Math.floor(phase.cleared.length / 2)];
        if (mid) {
          const text = '+' + phase.gain + (phase.cascade > 1 ? '  x' + phase.cascade : '');
          this.floaters.push({ text, x: BOARD_X + mid.c * CELL + CELL / 2, y: BOARD_Y + mid.r * CELL, life: 1 });
        }
      } else if (step.kind === 'shuffle') {
        this.notice = 'Ходов нет — фишки перемешаны';
      }
    }

    endStep() {
      const { step } = this.anim;
      if (step.kind === 'swap' && step.commit) {
        const { a, b } = step;
        const tmp = this.shown[a.r][a.c];
        this.shown[a.r][a.c] = this.shown[b.r][b.c];
        this.shown[b.r][b.c] = tmp;
      } else if (step.kind === 'clear') {
        step.phase.cleared.forEach(cell => { this.shown[cell.r][cell.c] = null; });
        step.phase.created.forEach(s => { this.shown[s.r][s.c] = { type: s.type, special: s.special }; });
      } else if (step.kind === 'fall') {
        this.shown = step.phase.board.map(row => row.map(tile => ({ ...tile })));
      } else if (step.kind === 'shuffle') {
        this.shown = step.phase.board.map(row => row.map(tile => ({ ...tile })));
        this.notice = null;
      }
      this.anim = null;
    }

    updateStatus() {
      if (!this.cells) return;
      const e = this.engine;
      this.cells.score.textContent = 'Очки: ' + e.score;
      this.cells.moves.textContent = 'Ходы: ' + e.moves;
      this.cells.level.textContent = 'Уровень: ' + e.level;
      this.cells.best.textContent = 'Рекорд: ' + Math.max(window.Og2.bestScore('mix'), e.score);
    }

    draw(time) {
      const ctx = this.ctx;
      ctx.fillStyle = '#35523f';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e8e2cc';
      ctx.fillRect(BOARD_X - 4, BOARD_Y - 4, CELL * 8 + 8, CELL * 8 + 8);
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = (r + c) % 2 ? '#dcd5bb' : '#e6e0c8';
          ctx.fillRect(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, CELL);
        }
      }
      this.drawTiles(time);
      this.drawSelection(time);
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
      this.drawPanel();
      if (this.notice) this.drawBanner(this.notice);
      this.drawMessage();
    }

    tileOffsets() {
      const anim = this.anim;
      const offsets = new Map();
      if (!anim) return offsets;
      const progress = Math.min(1, anim.t / anim.step.dur);
      const step = anim.step;
      if (step.kind === 'swap') {
        const p = step.undo ? 1 - ease(progress) : ease(progress);
        const dx = (step.b.c - step.a.c) * CELL * p;
        const dy = (step.b.r - step.a.r) * CELL * p;
        offsets.set(step.a.r + ',' + step.a.c, { x: dx, y: dy });
        offsets.set(step.b.r + ',' + step.b.c, { x: -dx, y: -dy });
      } else if (step.kind === 'clear') {
        step.phase.cleared.forEach(cell => offsets.set(cell.r + ',' + cell.c, { scale: 1 - progress, alpha: 1 - progress }));
      }
      return offsets;
    }

    drawTiles(time) {
      const anim = this.anim;
      if (anim && anim.step.kind === 'fall') {
        this.drawFalling(anim.step.phase, ease(Math.min(1, anim.t / anim.step.dur)), time);
        return;
      }
      const shuffleFade = anim && anim.step.kind === 'shuffle' ? Math.abs(Math.cos(Math.min(1, anim.t / anim.step.dur) * Math.PI)) : 1;
      const offsets = this.tileOffsets();
      const source = anim && anim.step.kind === 'shuffle' && anim.t > anim.step.dur / 2 ? anim.step.phase.board : this.shown;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const tile = source[r][c];
          if (!tile) continue;
          const o = offsets.get(r + ',' + c) || {};
          this.drawTile(tile, BOARD_X + c * CELL + CELL / 2 + (o.x || 0), BOARD_Y + r * CELL + CELL / 2 + (o.y || 0), o.scale === undefined ? 1 : o.scale, (o.alpha === undefined ? 1 : o.alpha) * shuffleFade, time);
        }
      }
    }

    drawFalling(phase, p, time) {
      const fromRow = new Map();
      phase.falls.forEach(f => fromRow.set(f.c + ',' + f.toR, f.fromR));
      phase.spawns.forEach(s => fromRow.set(s.c + ',' + s.toR, s.fromR));
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const tile = phase.board[r][c];
          const from = fromRow.has(c + ',' + r) ? fromRow.get(c + ',' + r) : r;
          const row = from + (r - from) * p;
          const y = BOARD_Y + row * CELL + CELL / 2;
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.rect(BOARD_X, BOARD_Y, CELL * 8, CELL * 8);
          this.ctx.clip();
          this.drawTile(tile, BOARD_X + c * CELL + CELL / 2, y, 1, 1, time);
          this.ctx.restore();
        }
      }
    }

    drawTile(tile, cx, cy, scale, alpha, time) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      const half = (CELL - 6) / 2;
      ctx.fillStyle = TILE_EDGE[tile.type];
      ctx.fillRect(-half, -half, half * 2, half * 2);
      ctx.fillStyle = TILE_BACK[tile.type];
      ctx.fillRect(-half + 2, -half + 2, half * 2 - 4, half * 2 - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-half + 2, -half + 2, half * 2 - 4, 4);
      this.drawIcon(tile.type);
      if (tile.special) this.drawSpecial(tile.special, time);
      ctx.restore();
    }

    drawIcon(type) {
      const ctx = this.ctx;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (type === 0) {
        ctx.strokeStyle = '#6a7386';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(-8, -9);
        ctx.arc(-3, -9, 5, Math.PI, 0);
        ctx.lineTo(2, 12);
        ctx.arc(7, 12, 5, Math.PI, 0, true);
        ctx.lineTo(12, -4);
        ctx.stroke();
      } else if (type === 1) {
        ctx.save();
        ctx.rotate(-0.8);
        ctx.fillStyle = '#e2b020';
        ctx.fillRect(-4, -14, 8, 22);
        ctx.fillStyle = '#c28c10';
        ctx.fillRect(-4, -14, 3, 22);
        ctx.fillStyle = '#e8c9a0';
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        ctx.lineTo(4, 8);
        ctx.lineTo(0, 15);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillRect(-1, 13, 2, 2);
        ctx.fillStyle = '#d9788a';
        ctx.fillRect(-4, -19, 8, 5);
        ctx.fillStyle = '#9a9a9a';
        ctx.fillRect(-4, -15, 8, 2);
        ctx.restore();
      } else if (type === 2) {
        ctx.fillStyle = '#f8f8f4';
        ctx.fillRect(-13, -7, 26, 14);
        ctx.fillStyle = '#3a6fc0';
        ctx.fillRect(-4, -7, 12, 14);
        ctx.fillStyle = '#e8a0b0';
        ctx.fillRect(-13, -7, 9, 14);
        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-12.5, -6.5, 25, 13);
      } else if (type === 3) {
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(-1, 2, 2, 12);
        ctx.fillStyle = '#c8322a';
        ctx.beginPath();
        ctx.arc(0, -4, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8665a';
        ctx.beginPath();
        ctx.arc(-3, -7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9a2018';
        ctx.fillRect(-9, 3, 18, 3);
      } else if (type === 4) {
        ctx.fillStyle = '#e07a20';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0d8a8';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a85a10';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f6a850';
        ctx.fillRect(9, 8, 8, 4);
      } else {
        ctx.save();
        ctx.rotate(0.7);
        ctx.fillStyle = '#2e8a46';
        ctx.fillRect(-5, -12, 10, 20);
        ctx.fillStyle = '#f6f6ee';
        ctx.fillRect(-5, -6, 10, 8);
        ctx.fillStyle = '#1e6a32';
        ctx.fillRect(-5, -16, 10, 5);
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(3, 8);
        ctx.lineTo(0, 15);
        ctx.fill();
        ctx.restore();
      }
      ctx.lineWidth = 1;
    }

    drawSpecial(special, time) {
      const ctx = this.ctx;
      const pulse = 0.55 + Math.sin(time * 6) * 0.25;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + pulse + ')';
      ctx.lineWidth = 3;
      ctx.strokeRect(-21, -21, 42, 42);
      ctx.fillStyle = 'rgba(30,30,60,0.78)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      if (special === 'row') {
        ctx.fillRect(-20, 13, 40, 8);
        ctx.beginPath();
        ctx.moveTo(-14, 17);
        ctx.lineTo(14, 17);
        ctx.moveTo(9, 14);
        ctx.lineTo(14, 17);
        ctx.lineTo(9, 20);
        ctx.moveTo(-9, 14);
        ctx.lineTo(-14, 17);
        ctx.lineTo(-9, 20);
        ctx.stroke();
      } else if (special === 'col') {
        ctx.fillRect(13, -20, 8, 40);
        ctx.beginPath();
        ctx.moveTo(17, -14);
        ctx.lineTo(17, 14);
        ctx.moveTo(14, -9);
        ctx.lineTo(17, -14);
        ctx.lineTo(20, -9);
        ctx.moveTo(14, 9);
        ctx.lineTo(17, 14);
        ctx.lineTo(20, 9);
        ctx.stroke();
      } else if (special === 'blast') {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4 + time;
          ctx.moveTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
          ctx.lineTo(Math.cos(angle) * 21, Math.sin(angle) * 21);
        }
        ctx.stroke();
      } else {
        const colors = ['#e84a3c', '#f2b630', '#58b858', '#3c8ae0', '#a05ad0'];
        colors.forEach((color, i) => {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, 19, time * 2 + i * 1.256, time * 2 + i * 1.256 + 1.1);
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    drawSelection(time) {
      const ctx = this.ctx;
      const mark = (cell, color, width) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.strokeRect(BOARD_X + cell.c * CELL + 1, BOARD_Y + cell.r * CELL + 1, CELL - 2, CELL - 2);
      };
      if (this.selected) mark(this.selected, '#ffffff', 3);
      if (this.hint && !this.busy()) {
        const alpha = 0.5 + Math.sin(time * 8) * 0.5;
        const color = 'rgba(255,235,80,' + alpha + ')';
        mark({ r: this.hint.r1, c: this.hint.c1 }, color, 3);
        mark({ r: this.hint.r2, c: this.hint.c2 }, color, 3);
      }
      ctx.lineWidth = 1;
    }

    drawPanel() {
      const ctx = this.ctx;
      const e = this.engine;
      const x = 440;
      ctx.fillStyle = '#e8e2cc';
      ctx.fillRect(x, 8, 112, HEIGHT - 16);
      ctx.strokeStyle = '#9a947c';
      ctx.strokeRect(x + 0.5, 8.5, 111, HEIGHT - 17);
      ctx.fillStyle = '#2b2b2b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px ' + FONT;
      ctx.fillText('УРОВЕНЬ ' + e.level, x + 56, 28);
      ctx.font = '11px ' + FONT;
      ctx.fillText('ЦЕЛЬ', x + 56, 56);
      ctx.fillStyle = '#c8c2aa';
      ctx.fillRect(x + 10, 68, 92, 14);
      ctx.fillStyle = '#58a85a';
      ctx.fillRect(x + 10, 68, 92 * Math.min(1, this.displayScore / e.target), 14);
      ctx.strokeStyle = '#6a6652';
      ctx.strokeRect(x + 9.5, 67.5, 93, 15);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillText(Math.round(this.displayScore) + ' / ' + e.target, x + 56, 96);
      ctx.fillText('ХОДЫ', x + 56, 140);
      ctx.font = 'bold 40px ' + FONT;
      ctx.fillStyle = e.moves <= 5 ? '#c8322a' : '#2b2b2b';
      ctx.fillText(String(e.moves), x + 56, 174);
      ctx.font = '11px ' + FONT;
      ctx.fillStyle = '#2b2b2b';
      ctx.fillText('ОЧКИ', x + 56, 222);
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText(String(Math.round(this.displayScore)), x + 56, 244);
      ctx.font = '10px ' + FONT;
      ctx.fillStyle = '#4a4a4a';
      ['4 в ряд — линия', '5 в ряд — радуга', 'Г и Т — взрыв', 'H — подсказка'].forEach((line, i) => {
        ctx.fillText(line, x + 56, 300 + i * 16);
      });
    }

    drawBanner(text) {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(10,12,18,0.82)';
      ctx.fillRect(BOARD_X + 40, BOARD_Y + 170, CELL * 8 - 80, 36);
      ctx.fillStyle = '#ffd36a';
      ctx.font = 'bold 14px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, BOARD_X + CELL * 4, BOARD_Y + 188);
    }

    drawMessage() {
      const e = this.engine;
      let lines = null;
      if (this.mode === 'ready') {
        lines = ['КАНЦЕЛЯРСКИЙ МИКС', 'Меняйте соседние предметы местами', 'Соберите три и больше в ряд', 'Клик — начать'];
      } else if (this.mode === 'paused') {
        lines = ['ПАУЗА', 'Пробел — продолжить'];
      } else if (this.mode === 'levelClear') {
        lines = ['УРОВЕНЬ ПРОЙДЕН', 'Очки: ' + e.score + ' (бонус за ходы ' + e.levelBonus + ')'];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — следующий уровень');
      } else if (this.mode === 'over') {
        lines = ['ХОДЫ КОНЧИЛИСЬ', 'Очки: ' + e.score];
        if (this.recordBeaten) lines.push('Новый рекорд!');
        lines.push('Пробел — заново');
      }
      if (!lines) return;
      const ctx = this.ctx;
      const height = 24 + lines.length * 24;
      const top = 120;
      ctx.fillStyle = 'rgba(10,12,18,0.88)';
      ctx.fillRect(40, top, 340, height);
      ctx.strokeStyle = '#c0c0c0';
      ctx.strokeRect(40.5, top + 0.5, 339, height - 1);
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
    ctx.fillStyle = '#35523f';
    ctx.fillRect(0, 0, w, h);
    const sample = [['#c9d8f0', '#f6e6a0', '#f6c6d0'], ['#f2b0a8', '#f6d0a0', '#b8e6b8']];
    sample.forEach((row, r) => row.forEach((color, c) => {
      ctx.fillStyle = color;
      ctx.fillRect(6 + c * 29, 4 + r * 27, 26, 24);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(6 + c * 29, 26 + r * 27, 26, 2);
    }));
    ctx.fillStyle = '#c8322a';
    ctx.beginPath();
    ctx.arc(19, 17, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2b020';
    ctx.fillRect(40, 10, 5, 14);
    ctx.fillStyle = '#e8a0b0';
    ctx.fillRect(65, 14, 14, 8);
    ctx.fillStyle = '#e07a20';
    ctx.beginPath();
    ctx.arc(19, 44, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e8a46';
    ctx.fillRect(66, 36, 6, 14);
  }

  const app = new MixApp();
  window.appOg2Mix = app;
  window.Og2.attach('mix', { open: () => app.open(), drawIcon });
})();
