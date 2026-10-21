class AppOgLines {
  constructor() {
    this.winId = 'app_og_lines';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.size = 9;
    this.cellSize = 36;
    this.boardOffset = 4;

    this.board = [];
    this.selected = null;
    this.nextBalls = [];

    this.score = 0;
    this.gameState = 'playing';
    this.bossMode = false;

    this.floatingTexts = [];
    this.particles = [];
    this.animTick = 0;
    this.lastFrameTime = 0;

    this.colors = [
      '#e62e2e',
      '#2563eb',
      '#16a34a',
      '#eab308',
      '#9333ea',
      '#06b6d4',
      '#ea580c'
    ];

    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleCanvasClick = this.onCanvasClick.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_lines98'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_lines98', String(this.highScore));
      } catch (e) {}
      if (window.appOfficeLauncher && window.appOfficeLauncher.win) window.appOfficeLauncher.populateList();
      if (window.appClippy && window.appClippy.onOfficeGameEvent) {
        window.appClippy.onOfficeGameEvent('lines98', 'high_score', { score: this.highScore });
      }
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
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) - 40);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) - 30);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Цветные Линии 98',
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
      <div class="og-lines-app">
        <div class="og-lines-menubar">
          <div class="og-lines-menu-btn" id="lines-menu-new">Игра (F2)</div>
          <div class="og-lines-menu-btn" id="lines-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-lines-toolbar">
          <button class="og-lines-btn" id="lines-btn-restart">Заново</button>
          <div class="og-lines-nextbox">
            <span class="og-lines-next-label">След:</span>
            <div class="og-lines-next-preview" id="lines-preview"></div>
          </div>
          <button class="og-lines-btn" id="lines-btn-boss">Шеф идет!</button>
          <div class="og-lines-scorebox">
            <div class="og-lines-stat">
              <span>Счет:</span>
              <span class="og-lines-stat-val" id="lines-score">0</span>
            </div>
            <div class="og-lines-stat">
              <span>Рекорд:</span>
              <span class="og-lines-stat-val" id="lines-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-lines-viewport">
          <canvas id="og_lines_canvas" class="og-lines-canvas" width="332" height="332"></canvas>
          <div class="og-lines-boss-screen" id="lines-boss-screen">
            <div class="og-lines-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-lines-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Справка о доходах физических лиц (Форма 2-НДФЛ)</span>
            </div>
            <div class="og-lines-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=СУММ(D4:D16) * 0,13</span>
            </div>
            <div class="og-lines-boss-grid">
              <table class="og-lines-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Месяц</b></td><td><b>Код дохода</b></td><td><b>База</b></td><td><b>Начислено</b></td><td><b>Удержано</b></td></tr>
                <tr class="og-lines-boss-active-cell"><th>2</th><td>Январь</td><td>2000</td><td>4 500,00</td><td>4 500,00</td><td>585,00</td></tr>
                <tr><th>3</th><td>Февраль</td><td>2000</td><td>4 500,00</td><td>4 500,00</td><td>585,00</td></tr>
                <tr><th>4</th><td>Март</td><td>2000</td><td>5 200,00</td><td>5 200,00</td><td>676,00</td></tr>
                <tr><th>5</th><td>Апрель</td><td>2000</td><td>5 200,00</td><td>5 200,00</td><td>676,00</td></tr>
                <tr><th>6</th><td>Май</td><td>2000</td><td>5 200,00</td><td>5 200,00</td><td>676,00</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-lines-statusbar">
          <span id="lines-status-text">Соберите 5 шариков одного цвета в линию</span>
          <span>Линии 98</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_lines_canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.addEventListener('click', this.handleCanvasClick);
    }

    const btnRestart = this.win.body.querySelector('#lines-btn-restart');
    const btnBoss = this.win.body.querySelector('#lines-btn-boss');
    const menuNew = this.win.body.querySelector('#lines-menu-new');
    const menuBoss = this.win.body.querySelector('#lines-menu-boss');

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

  sndSelect() { this.playTone(520, 0.04, 'triangle', 0.08); }
  sndMove() { this.playTone(340, 0.06, 'sine', 0.09); }
  sndClear() {
    this.playTone(523, 0.08, 'sine', 0.12);
    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.12), 60);
    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.15), 120);
  }
  sndOver() {
    this.playTone(280, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(190, 0.3, 'sawtooth', 0.12), 150);
  }

  initGame() {
    this.score = 0;
    this.gameState = 'playing';
    this.selected = null;
    this.floatingTexts = [];
    this.particles = [];
    this.lastFrameTime = 0;

    this.board = [];
    for (let r = 0; r < this.size; r++) {
      const row = [];
      for (let c = 0; c < this.size; c++) {
        row.push(-1);
      }
      this.board.push(row);
    }

    this.generateNextBalls();
    this.spawnBalls(5);
    this.generateNextBalls();
    this.updateHUD();

    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.initGame();
  }

  generateNextBalls() {
    this.nextBalls = [
      Math.floor(Math.random() * this.colors.length),
      Math.floor(Math.random() * this.colors.length),
      Math.floor(Math.random() * this.colors.length)
    ];
  }

  getEmptyCells() {
    const empty = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === -1) {
          empty.push({ r, c });
        }
      }
    }
    return empty;
  }

  spawnBalls(count) {
    const empty = this.getEmptyCells();
    if (empty.length === 0) return;

    const toSpawn = Math.min(count, empty.length);
    for (let i = 0; i < toSpawn; i++) {
      const randIdx = Math.floor(Math.random() * empty.length);
      const cell = empty.splice(randIdx, 1)[0];
      const color = this.nextBalls[i % this.nextBalls.length];
      this.board[cell.r][cell.c] = color;
    }
  }

  findLines() {
    const matched = new Set();

    for (let r = 0; r < this.size; r++) {
      let count = 1;
      for (let c = 1; c < this.size; c++) {
        if (this.board[r][c] !== -1 && this.board[r][c] === this.board[r][c - 1]) {
          count++;
        } else {
          if (count >= 5) {
            for (let k = 0; k < count; k++) matched.add(`${r},${c - 1 - k}`);
          }
          count = 1;
        }
      }
      if (count >= 5) {
        for (let k = 0; k < count; k++) matched.add(`${r},${this.size - 1 - k}`);
      }
    }

    for (let c = 0; c < this.size; c++) {
      let count = 1;
      for (let r = 1; r < this.size; r++) {
        if (this.board[r][c] !== -1 && this.board[r][c] === this.board[r - 1][c]) {
          count++;
        } else {
          if (count >= 5) {
            for (let k = 0; k < count; k++) matched.add(`${r - 1 - k},${c}`);
          }
          count = 1;
        }
      }
      if (count >= 5) {
        for (let k = 0; k < count; k++) matched.add(`${this.size - 1 - k},${c}`);
      }
    }

    for (let d = -(this.size - 5); d <= this.size - 5; d++) {
      let r = d < 0 ? 0 : d;
      let c = d < 0 ? -d : 0;
      let count = 0;
      let prevCol = -1;
      const coords = [];

      while (r < this.size && c < this.size) {
        const val = this.board[r][c];
        if (val !== -1 && val === prevCol) {
          count++;
          coords.push({ r, c });
        } else {
          if (count >= 5) {
            coords.forEach(pt => matched.add(`${pt.r},${pt.c}`));
          }
          count = val !== -1 ? 1 : 0;
          prevCol = val;
          coords.length = 0;
          if (val !== -1) coords.push({ r, c });
        }
        r++;
        c++;
      }
      if (count >= 5) {
        coords.forEach(pt => matched.add(`${pt.r},${pt.c}`));
      }
    }

    for (let d = 4; d <= 2 * (this.size - 1) - 4; d++) {
      let r = d < this.size ? d : this.size - 1;
      let c = d < this.size ? 0 : d - (this.size - 1);
      let count = 0;
      let prevCol = -1;
      const coords = [];

      while (r >= 0 && c < this.size) {
        const val = this.board[r][c];
        if (val !== -1 && val === prevCol) {
          count++;
          coords.push({ r, c });
        } else {
          if (count >= 5) {
            coords.forEach(pt => matched.add(`${pt.r},${pt.c}`));
          }
          count = val !== -1 ? 1 : 0;
          prevCol = val;
          coords.length = 0;
          if (val !== -1) coords.push({ r, c });
        }
        r--;
        c++;
      }
      if (count >= 5) {
        coords.forEach(pt => matched.add(`${pt.r},${pt.c}`));
      }
    }

    const res = [];
    matched.forEach(str => {
      const [r, c] = str.split(',').map(Number);
      res.push({ r, c });
    });
    return res;
  }

  findPath(startR, startC, targetR, targetC) {
    if (this.board[targetR][targetC] !== -1) return false;

    const queue = [{ r: startR, c: startC }];
    const visited = new Set([`${startR},${startC}`]);

    const dirs = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 }
    ];

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.r === targetR && curr.c === targetC) return true;

      for (let i = 0; i < dirs.length; i++) {
        const nr = curr.r + dirs[i].r;
        const nc = curr.c + dirs[i].c;
        const key = `${nr},${nc}`;

        if (
          nr >= 0 && nr < this.size &&
          nc >= 0 && nc < this.size &&
          !visited.has(key) &&
          (this.board[nr][nc] === -1 || (nr === targetR && nc === targetC))
        ) {
          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      }
    }
    return false;
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#lines-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Цветные Линии 98';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
    if (window.appClippy && window.appClippy.onOfficeGameEvent) {
      window.appClippy.onOfficeGameEvent('lines98', this.bossMode ? 'boss_on' : 'boss_off');
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
    if (this.gameState !== 'playing' || this.bossMode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.boardOffset;
    const y = e.clientY - rect.top - this.boardOffset;

    if (x < 0 || y < 0) return;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row < 0 || row >= this.size || col < 0 || col >= this.size) return;

    if (this.board[row][col] !== -1) {
      this.selected = { r: row, c: col };
      this.sndSelect();
    } else if (this.selected) {
      if (this.findPath(this.selected.r, this.selected.c, row, col)) {
        this.board[row][col] = this.board[this.selected.r][this.selected.c];
        this.board[this.selected.r][this.selected.c] = -1;
        this.selected = null;
        this.sndMove();

        const lines = this.findLines();
        if (lines.length > 0) {
          this.clearLines(lines);
        } else {
          this.spawnBalls(3);
          const spawnedLines = this.findLines();
          if (spawnedLines.length > 0) {
            this.clearLines(spawnedLines);
          }
          this.generateNextBalls();
          this.updateHUD();

          if (this.getEmptyCells().length === 0) {
            this.gameState = 'gameover';
            this.sndOver();
            this.saveHighScore();
          }
        }
      }
    }
  }

  clearLines(lines) {
    this.sndClear();
    const pts = lines.length >= 5 ? (lines.length - 4) * 10 : 10;
    this.score += pts;

    const first = lines[0];
    const fx = this.boardOffset + first.c * this.cellSize + 18;
    const fy = this.boardOffset + first.r * this.cellSize + 18;
    this.createFloatingText(`+${pts}`, fx, fy);

    lines.forEach(l => {
      const cx = this.boardOffset + l.c * this.cellSize + 18;
      const cy = this.boardOffset + l.r * this.cellSize + 18;
      this.createSparks(cx, cy, this.colors[this.board[l.r][l.c]]);
      this.board[l.r][l.c] = -1;
    });

    this.saveHighScore();
    this.updateHUD();
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.7 + Math.random() * 1.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 26,
        color
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffff00') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -0.55,
      life: 40,
      color
    });
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const scoreEl = this.win.body.querySelector('#lines-score');
    const highEl = this.win.body.querySelector('#lines-high');
    const previewEl = this.win.body.querySelector('#lines-preview');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;

    if (previewEl && this.nextBalls.length > 0) {
      previewEl.innerHTML = this.nextBalls.map(c => `
        <div class="og-lines-preview-ball" style="background:${this.colors[c]}"></div>
      `).join('');
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#1c1c26';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = this.boardOffset + c * this.cellSize;
        const y = this.boardOffset + r * this.cellSize;

        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? '#2a2a38' : '#232330';
        ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);

        ctx.strokeStyle = '#38384a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.cellSize - 1, this.cellSize - 1);

        const val = this.board[r][c];
        if (val !== -1) {
          const isSel = this.selected && this.selected.r === r && this.selected.c === c;
          const bounce = isSel ? Math.sin(this.animTick * 0.1) * 2.5 : 0;

          const cx = x + this.cellSize / 2;
          const cy = y + this.cellSize / 2 + bounce;
          const radius = 13;

          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.ellipse(cx, y + this.cellSize - 4, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = this.colors[val];
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath();
          ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
          ctx.fill();

          if (isSel) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 2, y + 2, this.cellSize - 5, this.cellSize - 5);
          }
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px Tahoma';
      ctx.fillText(ft.text, ft.x, ft.y);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(40, 100, 252, 95);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(40, 100, 252, 95);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 15px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', 166, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Tahoma';
      ctx.fillText(`Набрано очков: ${this.score}`, 166, 155);
      ctx.font = '10px Tahoma';
      ctx.fillText('Нажмите кнопку «Заново» для рестарта', 166, 175);
      ctx.textAlign = 'left';
    }
  }

  gameLoop(now) {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode) return;

    const currentTime = now || ((window.performance && window.performance.now) ? window.performance.now() : Date.now());
    if (currentTime - this.lastFrameTime < 16) {
      return;
    }
    this.lastFrameTime = currentTime;

    this.animTick++;
    this.draw();
  }
}

window.appOgLines = new AppOgLines();
