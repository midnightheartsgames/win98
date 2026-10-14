class AppOgGems {
  constructor() {
    this.winId = 'app_og_gems';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.rows = 8;
    this.cols = 8;
    this.tileSize = 38;
    this.boardOffset = 8;

    this.grid = [];
    this.selected = null;
    this.isAnimating = false;

    this.score = 0;
    this.movesLeft = 30;
    this.level = 1;
    this.combo = 1;

    this.gameState = 'playing';
    this.bossMode = false;

    this.floatingTexts = [];
    this.particles = [];

    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleCanvasClick = this.onCanvasClick.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_gems'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_gems', String(this.highScore));
      } catch (e) {}
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 440;
    const initialH = 480;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) + 50);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) - 40);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Офисные Самоцветы 98 (Три в ряд)',
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
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
    }
    this.win = null;
  }

  renderWindow() {
    if (!this.win) return;
    const body = this.win.body || this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    if (!body) return;
    this.win.body = body;

    this.win.body.innerHTML = `
      <div class="og-gems-app">
        <div class="og-gems-menubar">
          <div class="og-gems-menu-btn" id="gems-menu-new">Игра (F2)</div>
          <div class="og-gems-menu-btn" id="gems-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-gems-toolbar">
          <button class="og-gems-btn" id="gems-btn-restart">Заново</button>
          <button class="og-gems-btn" id="gems-btn-boss">Шеф идет!</button>
          <div class="og-gems-scorebox">
            <div class="og-gems-stat">
              <span>Ходы:</span>
              <span class="og-gems-stat-val green" id="gems-moves">30</span>
            </div>
            <div class="og-gems-stat">
              <span>Счет:</span>
              <span class="og-gems-stat-val" id="gems-score">0</span>
            </div>
            <div class="og-gems-stat">
              <span>Рекорд:</span>
              <span class="og-gems-stat-val" id="gems-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-gems-viewport">
          <canvas id="og_gems_canvas" class="og-gems-canvas" width="320" height="320"></canvas>
          <div class="og-gems-boss-screen" id="gems-boss-screen">
            <div class="og-gems-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-gems-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Смета расходов: 3 квартал 1998</span>
            </div>
            <div class="og-gems-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=ОКРУГЛ(СУММПРОИЗВ($B$2:$B$15; $C$2:$C$15); 2)</span>
            </div>
            <div class="og-gems-boss-grid">
              <table class="og-gems-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Статья затрат</b></td><td><b>Кол-во</b></td><td><b>Цена, руб</b></td><td><b>Итого, руб</b></td><td><b>Статус</b></td></tr>
                <tr class="og-gems-boss-active-cell"><th>2</th><td>Мониторы 15" ViewSonic</td><td>12</td><td>1 850,00</td><td>22 200,00</td><td>Счет оплачен</td></tr>
                <tr><th>3</th><td>Сетевой кабель UTP 5e</td><td>305</td><td>3,50</td><td>1 067,50</td><td>На складе</td></tr>
                <tr><th>4</th><td>Картриджи HP LaserJet 6L</td><td>6</td><td>420,00</td><td>2 520,00</td><td>Выдано</td></tr>
                <tr><th>5</th><td>Кофеварка рожковая DeLonghi</td><td>2</td><td>2 100,00</td><td>4 200,00</td><td>В бухгалтерии</td></tr>
                <tr><th>6</th><td>Коврики для мыши с гелем</td><td>20</td><td>45,00</td><td>900,00</td><td>В наличии</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-gems-statusbar">
          <span id="gems-status-text">Кликните на две соседние фишки для обмена</span>
          <span id="gems-status-level">Уровень 1</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_gems_canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.addEventListener('click', this.handleCanvasClick);
    }

    const btnRestart = this.win.body.querySelector('#gems-btn-restart');
    const btnBoss = this.win.body.querySelector('#gems-btn-boss');
    const menuNew = this.win.body.querySelector('#gems-menu-new');
    const menuBoss = this.win.body.querySelector('#gems-menu-boss');

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

  sndSelect() { this.playTone(480, 0.04, 'triangle', 0.08); }
  sndSwap() { this.playTone(350, 0.05, 'sine', 0.08); }
  sndMatch() {
    this.playTone(550, 0.06, 'sine', 0.12);
    setTimeout(() => this.playTone(750, 0.08, 'sine', 0.12), 40);
  }
  sndCombo() {
    this.playTone(660, 0.08, 'triangle', 0.15);
    setTimeout(() => this.playTone(990, 0.12, 'sine', 0.18), 60);
  }
  sndInvalid() { this.playTone(200, 0.08, 'sawtooth', 0.1); }

  initGame() {
    this.score = 0;
    this.movesLeft = 30;
    this.level = 1;
    this.combo = 1;
    this.gameState = 'playing';
    this.selected = null;
    this.isAnimating = false;
    this.floatingTexts = [];
    this.particles = [];

    this.createBoard();
    this.updateHUD();

    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.initGame();
  }

  createBoard() {
    let attempts = 0;
    do {
      this.grid = [];
      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          row.push(Math.floor(Math.random() * 6));
        }
        this.grid.push(row);
      }
      this.clearInitialMatches();
      attempts++;
    } while (attempts < 10 && !this.hasPossibleMoves());
  }

  clearInitialMatches() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        while (
          (c >= 2 && this.grid[r][c] === this.grid[r][c - 1] && this.grid[r][c] === this.grid[r][c - 2]) ||
          (r >= 2 && this.grid[r][c] === this.grid[r - 1][c] && this.grid[r][c] === this.grid[r - 2][c])
        ) {
          this.grid[r][c] = (this.grid[r][c] + 1) % 6;
        }
      }
    }
  }

  hasPossibleMoves() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols) {
          this.swapInGrid(r, c, r, c + 1);
          const hasM = this.findMatches().length > 0;
          this.swapInGrid(r, c, r, c + 1);
          if (hasM) return true;
        }
        if (r + 1 < this.rows) {
          this.swapInGrid(r, c, r + 1, c);
          const hasM = this.findMatches().length > 0;
          this.swapInGrid(r, c, r + 1, c);
          if (hasM) return true;
        }
      }
    }
    return false;
  }

  swapInGrid(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#gems-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Офисные Самоцветы 98 (Три в ряд)';
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
  }

  onCanvasClick(e) {
    if (this.gameState !== 'playing' || this.isAnimating || this.bossMode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.boardOffset;
    const y = e.clientY - rect.top - this.boardOffset;

    if (x < 0 || y < 0) return;
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);

    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

    if (!this.selected) {
      this.selected = { r: row, c: col };
      this.sndSelect();
    } else {
      const dr = Math.abs(this.selected.r - row);
      const dc = Math.abs(this.selected.c - col);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        this.attemptSwap(this.selected.r, this.selected.c, row, col);
        this.selected = null;
      } else {
        this.selected = { r: row, c: col };
        this.sndSelect();
      }
    }
  }

  attemptSwap(r1, c1, r2, c2) {
    this.isAnimating = true;
    this.sndSwap();
    this.swapInGrid(r1, c1, r2, c2);

    const matches = this.findMatches();
    if (matches.length > 0) {
      this.movesLeft--;
      this.combo = 1;
      this.updateHUD();
      this.processMatches(matches);
    } else {
      this.sndInvalid();
      setTimeout(() => {
        this.swapInGrid(r1, c1, r2, c2);
        this.isAnimating = false;
      }, 200);
    }
  }

  findMatches() {
    const matchedCoords = new Set();

    for (let r = 0; r < this.rows; r++) {
      let count = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r][c - 1]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) {
              matchedCoords.add(`${r},${c - 1 - k}`);
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let k = 0; k < count; k++) {
          matchedCoords.add(`${r},${this.cols - 1 - k}`);
        }
      }
    }

    for (let c = 0; c < this.cols; c++) {
      let count = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r - 1][c]) {
          count++;
        } else {
          if (count >= 3) {
            for (let k = 0; k < count; k++) {
              matchedCoords.add(`${r - 1 - k},${c}`);
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let k = 0; k < count; k++) {
          matchedCoords.add(`${this.rows - 1 - k},${c}`);
        }
      }
    }

    const result = [];
    matchedCoords.forEach(str => {
      const [r, c] = str.split(',').map(Number);
      result.push({ r, c });
    });
    return result;
  }

  processMatches(matches) {
    if (this.combo > 1) {
      this.sndCombo();
    } else {
      this.sndMatch();
    }

    const earnedPoints = matches.length * 30 * this.combo;
    this.score += earnedPoints;

    const centerMatch = matches[Math.floor(matches.length / 2)];
    const textX = this.boardOffset + centerMatch.c * this.tileSize + 10;
    const textY = this.boardOffset + centerMatch.r * this.tileSize + 10;
    this.createFloatingText(`+${earnedPoints}`, textX, textY, this.combo > 1 ? '#00ffff' : '#ffff00');

    matches.forEach(m => {
      const colX = this.boardOffset + m.c * this.tileSize + this.tileSize / 2;
      const colY = this.boardOffset + m.r * this.tileSize + this.tileSize / 2;
      this.createSparks(colX, colY, this.getGemColor(this.grid[m.r][m.c]));
      this.grid[m.r][m.c] = -1;
    });

    this.saveHighScore();
    this.updateHUD();

    setTimeout(() => {
      this.dropGems();
    }, 180);
  }

  dropGems() {
    for (let c = 0; c < this.cols; c++) {
      let emptyRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== -1) {
          if (r !== emptyRow) {
            this.grid[emptyRow][c] = this.grid[r][c];
            this.grid[r][c] = -1;
          }
          emptyRow--;
        }
      }

      for (let r = emptyRow; r >= 0; r--) {
        this.grid[r][c] = Math.floor(Math.random() * 6);
      }
    }

    const nextMatches = this.findMatches();
    if (nextMatches.length > 0) {
      this.combo++;
      setTimeout(() => {
        this.processMatches(nextMatches);
      }, 160);
    } else {
      this.isAnimating = false;
      if (this.movesLeft <= 0) {
        this.gameState = 'gameover';
        this.saveHighScore();
        this.updateHUD();
      } else if (!this.hasPossibleMoves()) {
        this.createBoard();
      }
    }
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 12,
        color
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
    const movesEl = this.win.body.querySelector('#gems-moves');
    const scoreEl = this.win.body.querySelector('#gems-score');
    const highEl = this.win.body.querySelector('#gems-high');

    if (movesEl) movesEl.textContent = this.movesLeft;
    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
  }

  getGemColor(type) {
    const colors = ['#3070ff', '#8b5a2b', '#e62e2e', '#9ca3af', '#eab308', '#06b6d4'];
    return colors[type] || '#ffffff';
  }

  drawGem(ctx, r, c, type) {
    const x = this.boardOffset + c * this.tileSize;
    const y = this.boardOffset + r * this.tileSize;
    const size = this.tileSize - 4;
    const pad = 2;

    const gx = x + pad;
    const gy = y + pad;

    ctx.fillStyle = '#222238';
    ctx.fillRect(gx, gy, size, size);

    if (type === -1) return;

    if (type === 0) {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(gx + 4, gy + 4, size - 8, size - 8);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(gx + 8, gy + 4, size - 16, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx + 8, gy + size - 14, size - 16, 8);
    } else if (type === 1) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx + 6, gy + 7, size - 14, size - 13);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx + size - 8, gy + 10, 4, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(gx + 8, gy + 8, size - 18, 5);
    } else if (type === 2) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(gx + size / 2, gy + size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Tahoma';
      ctx.fillText('1C', gx + 11, gy + 21);
    } else if (type === 3) {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(gx + 4, gy + 12, size - 8, 10);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(gx + 8, gy + 8, size - 14, 5);
      ctx.fillStyle = '#111827';
      ctx.fillRect(gx + 6, gy + 18, size - 12, 3);
    } else if (type === 4) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(gx + size / 2, gy + 10, 5, Math.PI, 0);
      ctx.lineTo(gx + size / 2 + 5, gy + size - 8);
      ctx.arc(gx + size / 2 + 1, gy + size - 8, 4, 0, Math.PI);
      ctx.lineTo(gx + size / 2 - 3, gy + 14);
      ctx.stroke();
    } else if (type === 5) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(gx + 5, gy + 5, size - 10, size - 14);
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(gx + 7, gy + 7, size - 14, size - 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(gx + 12, gy + size - 9, size - 24, 5);
    }

    if (this.selected && this.selected.r === r && this.selected.c === c) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx, gy, size, size);
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#181828';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.drawGem(ctx, r, c, this.grid[r] ? this.grid[r][c] : -1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;

      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px Tahoma';
      ctx.fillText(ft.text, ft.x, ft.y);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(40, 100, 240, 95);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(40, 100, 240, 95);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 15px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ХОДЫ ЗАКОНЧИЛИСЬ!', 160, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Tahoma';
      ctx.fillText(`Набрано: ${this.score} очков`, 160, 155);
      ctx.font = '10px Tahoma';
      ctx.fillText('Нажмите кнопку «Заново» для рестарта', 160, 175);
      ctx.textAlign = 'left';
    }
  }

  gameLoop() {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode) return;

    this.draw();
  }
}

window.appOgGems = new AppOgGems();
