class AppOgTetris {
  constructor() {
    this.winId = 'app_og_tetris';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.cols = 10;
    this.rows = 20;
    this.cellSize = 18;
    this.boardX = 10;
    this.boardY = 5;

    this.grid = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 600;
    this.lastDropTime = 0;

    this.gameState = 'playing';
    this.bossMode = false;

    this.currentPiece = null;
    this.nextPieceType = 0;

    this.pieces = [
      { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
      { shape: [[1, 1], [1, 1]], color: '#eab308' },
      { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
      { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
      { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
      { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
      { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' }
    ];

    this.floatingTexts = [];
    this.particles = [];

    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_tetris'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_tetris', String(this.highScore));
      } catch (e) {}
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 320;
    const initialH = 465;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) + 10);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) - 20);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Офисный Тетрис 98 (Архив)',
        icon: 'game-manager',
        width: initialW,
        height: initialH,
        left,
        top,
        resizable: false,
        onClose: () => {
          this.destroy();
        }
      });
    } else {
      this.win = {
        body: document.createElement('div'),
        close: () => this.destroy()
      };
    }

    if (this.win && !this.win.body) {
      this.win.body = this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    }

    this.renderWindow();
    this.initGame();
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    this.win = null;
  }

  renderWindow() {
    if (!this.win) return;
    const body = this.win.body || this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    if (!body) return;
    this.win.body = body;

    this.win.body.innerHTML = `
      <div class="og-tetris-app">
        <div class="og-tetris-menubar">
          <div class="og-tetris-menu-btn" id="tetris-menu-new">Игра (F2)</div>
          <div class="og-tetris-menu-btn" id="tetris-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-tetris-toolbar">
          <button class="og-tetris-btn" id="tetris-btn-restart">Заново</button>
          <button class="og-tetris-btn" id="tetris-btn-boss">Шеф идет!</button>
          <div class="og-tetris-scorebox">
            <div class="og-tetris-stat">
              <span>Счет:</span>
              <span class="og-tetris-stat-val yellow" id="tetris-score">0</span>
            </div>
            <div class="og-tetris-stat">
              <span>Рекорд:</span>
              <span class="og-tetris-stat-val" id="tetris-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-tetris-viewport">
          <canvas id="og_tetris_canvas" class="og-tetris-canvas" width="280" height="370"></canvas>
          <div class="og-tetris-boss-screen" id="tetris-boss-screen">
            <div class="og-tetris-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-tetris-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Опись документов постоянного хранения за 1998 г.</span>
            </div>
            <div class="og-tetris-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=СЧЁТЕСЛИ(A2:A80; "<>Пусто")</span>
            </div>
            <div class="og-tetris-boss-grid">
              <table class="og-tetris-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Том</b></td><td><b>Заголовок дела</b></td><td><b>Листов</b></td><td><b>Срок</b></td><td><b>Короб</b></td></tr>
                <tr class="og-tetris-boss-active-cell"><th>2</th><td>Т-01</td><td>Приказы генерального директора</td><td>248</td><td>Постоянно</td><td>№12</td></tr>
                <tr><th>3</th><td>Т-02</td><td>Штатное расписание на 1998 г.</td><td>36</td><td>75 лет</td><td>№12</td></tr>
                <tr><th>4</th><td>Т-03</td><td>Планы финансовой деятельности</td><td>184</td><td>5 лет</td><td>№14</td></tr>
                <tr><th>5</th><td>Т-04</td><td>Лицевые счета сотрудников</td><td>310</td><td>75 лет</td><td>№15</td></tr>
                <tr><th>6</th><td>Т-05</td><td>Акты ревизии материальных средств</td><td>95</td><td>10 лет</td><td>№16</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-tetris-statusbar">
          <span id="tetris-status-text">Стрелки — движение, Вверх/Пробел — поворот</span>
          <span id="tetris-status-lines">Линий: 0</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_tetris_canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    const btnRestart = this.win.body.querySelector('#tetris-btn-restart');
    const btnBoss = this.win.body.querySelector('#tetris-btn-boss');
    const menuNew = this.win.body.querySelector('#tetris-menu-new');
    const menuBoss = this.win.body.querySelector('#tetris-menu-boss');

    if (btnRestart) btnRestart.onclick = () => this.restartGame();
    if (menuNew) menuNew.onclick = () => this.restartGame();
    if (btnBoss) btnBoss.onclick = () => this.toggleBossKey();
    if (menuBoss) menuBoss.onclick = () => this.toggleBossKey();

    window.addEventListener('keydown', this.handleKeyDown);
  }

  playTone(freq, dur, type = 'sine', vol = 0.1) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch (e) {}
  }

  sndMove() { this.playTone(400, 0.03, 'square', 0.05); }
  sndRotate() { this.playTone(550, 0.04, 'triangle', 0.08); }
  sndDrop() { this.playTone(220, 0.05, 'sine', 0.1); }
  sndClear() {
    this.playTone(587, 0.07, 'sine', 0.12);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.15), 60);
  }
  sndTetris() {
    this.playTone(523, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.15), 60);
    setTimeout(() => this.playTone(784, 0.08, 'sine', 0.15), 120);
    setTimeout(() => this.playTone(1046, 0.16, 'sine', 0.18), 180);
  }
  sndOver() {
    this.playTone(300, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(200, 0.25, 'sawtooth', 0.12), 140);
  }

  initGame() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 600;
    this.gameState = 'playing';
    this.floatingTexts = [];
    this.particles = [];

    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      this.grid.push(row);
    }

    this.nextPieceType = Math.floor(Math.random() * this.pieces.length);
    this.spawnPiece();
    this.updateHUD();

    this.lastDropTime = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.initGame();
  }

  spawnPiece() {
    const type = this.nextPieceType;
    this.nextPieceType = Math.floor(Math.random() * this.pieces.length);

    const proto = this.pieces[type];
    const shape = proto.shape.map(r => [...r]);

    this.currentPiece = {
      shape,
      color: proto.color,
      x: Math.floor((this.cols - shape[0].length) / 2),
      y: 0
    };

    if (this.collides(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameState = 'gameover';
      this.sndOver();
      this.saveHighScore();
    }
  }

  collides(px, py, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = px + c;
          const ny = py + r;

          if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
          if (ny >= 0 && this.grid[ny][nx] !== null) return true;
        }
      }
    }
    return false;
  }

  rotatePiece() {
    if (!this.currentPiece || this.gameState !== 'playing') return;

    const oldShape = this.currentPiece.shape;
    const H = oldShape.length;
    const W = oldShape[0].length;
    const newShape = [];

    for (let c = 0; c < W; c++) {
      const row = [];
      for (let r = H - 1; r >= 0; r--) {
        row.push(oldShape[r][c]);
      }
      newShape.push(row);
    }

    let kickX = 0;
    if (this.collides(this.currentPiece.x, this.currentPiece.y, newShape)) {
      if (!this.collides(this.currentPiece.x - 1, this.currentPiece.y, newShape)) {
        kickX = -1;
      } else if (!this.collides(this.currentPiece.x + 1, this.currentPiece.y, newShape)) {
        kickX = 1;
      } else {
        return;
      }
    }

    this.currentPiece.x += kickX;
    this.currentPiece.shape = newShape;
    this.sndRotate();
  }

  movePiece(dx) {
    if (!this.currentPiece || this.gameState !== 'playing') return;
    if (!this.collides(this.currentPiece.x + dx, this.currentPiece.y, this.currentPiece.shape)) {
      this.currentPiece.x += dx;
      this.sndMove();
    }
  }

  dropPiece() {
    if (!this.currentPiece || this.gameState !== 'playing') return;
    if (!this.collides(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (!this.currentPiece || this.gameState !== 'playing') return;
    while (!this.collides(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      this.score += 2;
    }
    this.sndDrop();
    this.lockPiece();
  }

  lockPiece() {
    const p = this.currentPiece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) {
          const gy = p.y + r;
          const gx = p.x + c;
          if (gy >= 0 && gy < this.rows && gx >= 0 && gx < this.cols) {
            this.grid[gy][gx] = p.color;
          }
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
    this.updateHUD();
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      let isFull = true;
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === null) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        cleared++;
        for (let c = 0; c < this.cols; c++) {
          this.createSparks(this.boardX + c * this.cellSize + 9, this.boardY + r * this.cellSize + 9, this.grid[r][c]);
        }
        this.grid.splice(r, 1);
        const newRow = [];
        for (let c = 0; c < this.cols; c++) newRow.push(null);
        this.grid.unshift(newRow);
        r++;
      }
    }

    if (cleared > 0) {
      this.lines += cleared;
      const pts = [0, 100, 300, 500, 800][cleared] * this.level;
      this.score += pts;

      if (cleared === 4) {
        this.sndTetris();
        this.createFloatingText('ТЕТРИС! +800', 60, 160, '#00ffff');
      } else {
        this.sndClear();
        this.createFloatingText(`+${pts}`, 70, 160, '#ffff00');
      }

      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(90, 600 - (this.level - 1) * 55);

      this.saveHighScore();
      this.updateHUD();
    }
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#tetris-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Офисный Тетрис 98 (Архив)';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
  }

  onKeyDown(e) {
    if (e.key === 'F12') {
      e.preventDefault();
      this.toggleBossKey();
      return;
    }
    if (this.bossMode) {
      if (e.key === 'Escape') this.toggleBossKey();
      return;
    }
    if (e.key === 'F2') {
      e.preventDefault();
      this.restartGame();
      return;
    }

    if (this.gameState === 'gameover') {
      if (e.key === ' ' || e.code === 'Space') {
        this.restartGame();
      }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.movePiece(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.movePiece(1);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.rotatePiece();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.dropPiece();
      this.score += 1;
      this.updateHUD();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.hardDrop();
    }
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.0 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 14,
        color: color || '#ffffff'
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffff00') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.0,
      life: 24,
      color
    });
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const scoreEl = this.win.body.querySelector('#tetris-score');
    const highEl = this.win.body.querySelector('#tetris-high');
    const linesEl = this.win.body.querySelector('#tetris-status-lines');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
    if (linesEl) linesEl.textContent = `Линий: ${this.lines}`;
  }

  drawBlock(ctx, x, y, color) {
    const s = this.cellSize;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, s, 2);
    ctx.fillRect(x, y, 2, s);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + s - 2, y, 2, s);
    ctx.fillRect(x, y + s - 2, s, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + 4, y + 4, s - 8, s - 8);
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const bx = this.boardX;
    const by = this.boardY;
    const bw = this.cols * this.cellSize;
    const bh = this.rows * this.cellSize;

    ctx.fillStyle = '#08080e';
    ctx.fillRect(bx, by, bw, bh);

    ctx.strokeStyle = '#222230';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(bx, by + r * this.cellSize);
      ctx.lineTo(bx + bw, by + r * this.cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(bx + c * this.cellSize, by);
      ctx.lineTo(bx + c * this.cellSize, by + bh);
      ctx.stroke();
    }

    ctx.strokeStyle = '#808090';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        if (val) {
          this.drawBlock(ctx, bx + c * this.cellSize, by + r * this.cellSize, val);
        }
      }
    }

    if (this.currentPiece && this.gameState === 'playing') {
      const p = this.currentPiece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c]) {
            this.drawBlock(
              ctx,
              bx + (p.x + c) * this.cellSize,
              by + (p.y + r) * this.cellSize,
              p.color
            );
          }
        }
      }
    }

    const px = 202;
    const py = 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Tahoma';
    ctx.fillText('СЛЕДУЮЩАЯ:', px, py);

    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(px, py + 6, 68, 60);
    ctx.strokeStyle = '#444455';
    ctx.strokeRect(px, py + 6, 68, 60);

    const nextProto = this.pieces[this.nextPieceType];
    const nShape = nextProto.shape;
    const offX = px + Math.floor((68 - nShape[0].length * 14) / 2);
    const offY = py + 8 + Math.floor((56 - nShape.length * 14) / 2);

    for (let r = 0; r < nShape.length; r++) {
      for (let c = 0; c < nShape[r].length; c++) {
        if (nShape[r][c]) {
          const bs = 13;
          const cellX = offX + c * bs;
          const cellY = offY + r * bs;
          ctx.fillStyle = nextProto.color;
          ctx.fillRect(cellX, cellY, bs, bs);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(cellX, cellY, bs, bs);
        }
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Tahoma';
    ctx.fillText('УРОВЕНЬ:', px, 115);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px Tahoma';
    ctx.fillText(String(this.level), px, 133);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Tahoma';
    ctx.fillText('ЛИНИЙ:', px, 160);
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 14px Tahoma';
    ctx.fillText(String(this.lines), px, 178);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life--;
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x, part.y, 2.5, 2.5);
      if (part.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px Tahoma';
      ctx.fillText(ft.text, ft.x, ft.y);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(20, 120, 160, 85);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(20, 120, 160, 85);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 13px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', 100, 145);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Tahoma';
      ctx.fillText(`Счет: ${this.score}`, 100, 165);
      ctx.fillText('ПРОБЕЛ для рестарта', 100, 185);
      ctx.textAlign = 'left';
    }
  }

  gameLoop(now) {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode) return;

    const currentTime = now || ((window.performance && window.performance.now) ? window.performance.now() : Date.now());

    if (this.gameState === 'playing' && currentTime - this.lastDropTime >= this.dropInterval) {
      this.dropPiece();
      this.lastDropTime = currentTime;
    }

    this.draw();
  }
}

window.appOgTetris = new AppOgTetris();
