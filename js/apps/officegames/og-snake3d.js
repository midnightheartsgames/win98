class AppOgSnake3d {
  constructor() {
    this.winId = 'app_og_snake3d';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.gridSize = 14;
    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.foods = [];
    this.obstacles = [];

    this.score = 0;
    this.level = 1;
    this.speed = 280;
    this.lastStepTime = 0;
    this.gameState = 'ready';
    this.bossMode = false;

    this.tileW = 22;
    this.tileH = 12;
    this.originX = 180;
    this.originY = 85;

    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_snake3d'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_snake3d', String(this.highScore));
      } catch (e) {}
      if (window.appOfficeLauncher && window.appOfficeLauncher.win) window.appOfficeLauncher.populateList();
      if (window.appClippy && window.appClippy.onOfficeGameEvent) {
        window.appClippy.onOfficeGameEvent('snake3d', 'high_score', { score: this.highScore });
      }
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 400;
    const initialH = 460;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(30, Math.floor((screenW - initialW) / 2) - 40);
    const top = Math.max(30, Math.floor((screenH - initialH) / 2) - 30);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: '3D Змейка 98',
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
      <div class="og-snake3d-app">
        <div class="og-snake3d-menubar">
          <div class="og-snake3d-menu-btn" id="s3d-menu-new">Игра (F2)</div>
          <div class="og-snake3d-menu-btn" id="s3d-menu-pause">Пауза (Пробел)</div>
          <div class="og-snake3d-menu-btn" id="s3d-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-snake3d-toolbar">
          <button class="og-snake3d-btn" id="s3d-btn-restart">Заново</button>
          <button class="og-snake3d-btn" id="s3d-btn-pause">Пауза</button>
          <button class="og-snake3d-btn" id="s3d-btn-boss">Шеф идет!</button>
          <div class="og-snake3d-scorebox">
            <div class="og-snake3d-stat">
              <span>Счет:</span>
              <span class="og-snake3d-stat-val" id="s3d-score">0</span>
            </div>
            <div class="og-snake3d-stat">
              <span>Рекорд:</span>
              <span class="og-snake3d-stat-val" id="s3d-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-snake3d-viewport">
          <canvas id="og_snake3d_canvas" class="og-snake3d-canvas" width="370" height="340"></canvas>
          <div class="og-snake3d-boss-screen" id="s3d-boss-screen">
            <div class="og-snake3d-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-snake3d-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Сумма: =СУММ(C2:C14)</span>
            </div>
            <div class="og-snake3d-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=ВПР(A4; 'Кадры_1998'!$A$1:$F$100; 3; ЛОЖЬ)</span>
            </div>
            <div class="og-snake3d-boss-grid">
              <table class="og-snake3d-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Код</b></td><td><b>Отдел</b></td><td><b>Расход, руб</b></td><td><b>Остаток</b></td><td><b>Статус</b></td></tr>
                <tr class="og-snake3d-boss-active-cell"><th>2</th><td>104-B</td><td>Бухгалтерия</td><td>14 820,50</td><td>1 200,00</td><td>Проведено</td></tr>
                <tr><th>3</th><td>108-A</td><td>ИТ-отдел</td><td>32 900,00</td><td>4 500,00</td><td>В обработке</td></tr>
                <tr><th>4</th><td>112-C</td><td>Логистика</td><td>9 430,00</td><td>250,00</td><td>Утверждено</td></tr>
                <tr><th>5</th><td>201-D</td><td>Склад №2</td><td>48 100,00</td><td>11 200,00</td><td>Сверка</td></tr>
                <tr><th>6</th><td>205-A</td><td>Канцелярия</td><td>3 150,00</td><td>80,00</td><td>Оплачено</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-snake3d-statusbar">
          <span id="s3d-status-text">Стрелки / WASD — движение, F12 — Экран шефа</span>
          <span id="s3d-status-level">Уровень: 1</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_snake3d_canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    const btnRestart = this.win.body.querySelector('#s3d-btn-restart');
    const btnPause = this.win.body.querySelector('#s3d-btn-pause');
    const btnBoss = this.win.body.querySelector('#s3d-btn-boss');
    const menuNew = this.win.body.querySelector('#s3d-menu-new');
    const menuPause = this.win.body.querySelector('#s3d-menu-pause');
    const menuBoss = this.win.body.querySelector('#s3d-menu-boss');

    if (btnRestart) btnRestart.onclick = () => this.restartGame();
    if (menuNew) menuNew.onclick = () => this.restartGame();
    if (btnPause) btnPause.onclick = () => this.togglePause();
    if (menuPause) menuPause.onclick = () => this.togglePause();
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

  sndTurn() { this.playTone(320, 0.04, 'square', 0.05); }
  sndEat() {
    this.playTone(520, 0.06, 'sine', 0.12);
    setTimeout(() => this.playTone(780, 0.08, 'sine', 0.12), 60);
  }
  sndBonus() {
    this.playTone(600, 0.06, 'triangle', 0.12);
    setTimeout(() => this.playTone(900, 0.1, 'triangle', 0.12), 70);
  }
  sndCrash() {
    this.playTone(180, 0.25, 'sawtooth', 0.18);
  }

  initGame() {
    this.score = 0;
    this.level = 1;
    this.speed = 280;
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };

    this.snake = [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 }
    ];

    this.foods = [];
    this.obstacles = [];
    this.spawnFood('floppy');
    this.gameState = 'ready';
    this.updateHUD();

    this.lastStepTime = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.initGame();
    this.gameState = 'playing';
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
    }
    this.updateHUD();
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#s3d-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = '3D Змейка 98';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
    if (window.appClippy && window.appClippy.onOfficeGameEvent) {
      window.appClippy.onOfficeGameEvent('snake3d', this.bossMode ? 'boss_on' : 'boss_off');
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

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (this.gameState === 'ready') {
        this.gameState = 'playing';
      } else if (this.gameState === 'playing' || this.gameState === 'paused') {
        this.togglePause();
      } else if (this.gameState === 'gameover') {
        this.restartGame();
      }
      return;
    }

    if (e.key === 'F2') {
      e.preventDefault();
      this.restartGame();
      return;
    }

    const isA = e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф';
    const isD = e.code === 'KeyD' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В';
    if (isA || isD) {
      e.preventDefault();
      if (this.gameState === 'ready') {
        this.gameState = 'playing';
      }
      if (this.gameState === 'playing') {
        const cur = this.nextDir || this.dir;
        const turnDir = isA
          ? { x: (cur.y === 0 ? 0 : cur.y), y: (cur.x === 0 ? 0 : -cur.x) }
          : { x: (cur.y === 0 ? 0 : -cur.y), y: (cur.x === 0 ? 0 : cur.x) };
        this.nextDir = turnDir;
        this.sndTurn();
      }
      return;
    }

    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц' || e.code === 'KeyW') {
      dx = 0; dy = -1;
    } else if (e.key === 'ArrowDown' || e.code === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы' || e.code === 'KeyS') {
      dx = 0; dy = 1;
    } else if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
      dx = -1; dy = 0;
    } else if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
      dx = 1; dy = 0;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      if (this.gameState === 'ready') {
        this.gameState = 'playing';
      }
      if (this.gameState === 'playing') {
        if (dx !== -this.dir.x || dy !== -this.dir.y) {
          this.nextDir = { x: dx, y: dy };
          this.sndTurn();
        }
      }
    }
  }

  spawnFood(preferredType) {
    const types = ['floppy', 'floppy', 'coffee', 'binder'];
    const chosenType = preferredType || types[Math.floor(Math.random() * types.length)];
    const occupied = new Set();
    this.snake.forEach(seg => occupied.add(`${seg.x},${seg.y}`));
    this.obstacles.forEach(obs => occupied.add(`${obs.x},${obs.y}`));
    this.foods.forEach(f => occupied.add(`${f.x},${f.y}`));

    const available = [];
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (!occupied.has(`${x},${y}`)) available.push({ x, y });
      }
    }

    if (available.length > 0) {
      const spot = available[Math.floor(Math.random() * available.length)];
      this.foods.push({
        x: spot.x,
        y: spot.y,
        type: chosenType,
        points: chosenType === 'binder' ? 300 : (chosenType === 'coffee' ? 200 : 100)
      });
    }
  }

  step() {
    this.dir = { ...this.nextDir };
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    if (newHead.x < 0 || newHead.x >= this.gridSize || newHead.y < 0 || newHead.y >= this.gridSize) {
      this.gameOver();
      return;
    }

    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.gameOver();
        return;
      }
    }

    for (let i = 0; i < this.obstacles.length; i++) {
      if (this.obstacles[i].x === newHead.x && this.obstacles[i].y === newHead.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(newHead);

    let ateFood = false;
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (f.x === newHead.x && f.y === newHead.y) {
        ateFood = true;
        this.score += f.points;
        if (f.type === 'coffee') {
          this.sndBonus();
          this.speed = Math.max(160, this.speed - 5);
        } else {
          this.sndEat();
          this.speed = Math.max(170, this.speed - 3);
        }
        this.foods.splice(i, 1);
        break;
      }
    }

    if (!ateFood) {
      this.snake.pop();
    } else {
      this.spawnFood();
      if (this.score >= this.level * 1000) {
        this.levelUp();
      }
    }

    this.updateHUD();
  }

  levelUp() {
    this.level++;
    this.spawnFood('binder');
    const obsX = (this.snake[0].x + 4) % this.gridSize;
    const obsY = (this.snake[0].y + 4) % this.gridSize;
    this.obstacles.push({ x: obsX, y: obsY });
    this.sndBonus();
  }

  gameOver() {
    this.gameState = 'gameover';
    this.sndCrash();
    this.saveHighScore();
    this.updateHUD();
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const scoreEl = this.win.body.querySelector('#s3d-score');
    const highEl = this.win.body.querySelector('#s3d-high');
    const levelEl = this.win.body.querySelector('#s3d-status-level');
    const statusTextEl = this.win.body.querySelector('#s3d-status-text');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
    if (levelEl) levelEl.textContent = `Уровень: ${this.level}`;

    if (statusTextEl) {
      if (this.gameState === 'ready') {
        statusTextEl.textContent = 'Нажмите Пробел или клавиши стрелок для старта';
      } else if (this.gameState === 'playing') {
        statusTextEl.textContent = `Змейка растет! Длина: ${this.snake.length} блоков`;
      } else if (this.gameState === 'paused') {
        statusTextEl.textContent = 'ПАУЗА (Нажмите Пробел для продолжения)';
      } else if (this.gameState === 'gameover') {
        statusTextEl.textContent = 'СТОЛКНОВЕНИЕ! Нажмите Пробел для новой игры';
      }
    }
  }

  isoProject(gx, gy, h = 0) {
    const sx = this.originX + (gx - gy) * (this.tileW / 2);
    const sy = this.originY + (gx + gy) * (this.tileH / 2) - h;
    return { x: sx, y: sy };
  }

  drawVoxelCube(gx, gy, h, heightZ, topCol, leftCol, rightCol) {
    const ctx = this.ctx;
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    const p = this.isoProject(gx, gy, h);
    const px = p.x;
    const py = p.y;

    ctx.fillStyle = leftCol;
    ctx.beginPath();
    ctx.moveTo(px - hw, py);
    ctx.lineTo(px, py + hh);
    ctx.lineTo(px, py + hh + heightZ);
    ctx.lineTo(px - hw, py + heightZ);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rightCol;
    ctx.beginPath();
    ctx.moveTo(px, py + hh);
    ctx.lineTo(px + hw, py);
    ctx.lineTo(px + hw, py + heightZ);
    ctx.lineTo(px, py + hh + heightZ);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = topCol;
    ctx.beginPath();
    ctx.moveTo(px, py - hh);
    ctx.lineTo(px + hw, py);
    ctx.lineTo(px, py + hh);
    ctx.lineTo(px - hw, py);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px, py - hh);
    ctx.lineTo(px + hw, py);
    ctx.lineTo(px, py + hh);
    ctx.lineTo(px - hw, py);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px - hw, py);
    ctx.lineTo(px - hw, py + heightZ);
    ctx.lineTo(px, py + hh + heightZ);
    ctx.lineTo(px + hw, py + heightZ);
    ctx.lineTo(px + hw, py);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px, py + hh);
    ctx.lineTo(px, py + hh + heightZ);
    ctx.stroke();
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const p = this.isoProject(x, y, 0);
        const hw = this.tileW / 2;
        const hh = this.tileH / 2;

        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#1c2230' : '#171d2a';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - hh);
        ctx.lineTo(p.x + hw, p.y);
        ctx.lineTo(p.x, p.y + hh);
        ctx.lineTo(p.x - hw, p.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#28344c';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    const renderables = [];

    this.obstacles.forEach(o => {
      renderables.push({
        gx: o.x,
        gy: o.y,
        depth: o.x + o.y,
        type: 'obstacle'
      });
    });

    this.foods.forEach(f => {
      renderables.push({
        gx: f.x,
        gy: f.y,
        depth: f.x + f.y,
        type: 'food',
        foodType: f.type
      });
    });

    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      renderables.push({
        gx: seg.x,
        gy: seg.y,
        depth: seg.x + seg.y,
        type: i === 0 ? 'head' : 'body',
        index: i
      });
    }

    renderables.sort((a, b) => a.depth - b.depth);

    renderables.forEach(r => {
      if (r.type === 'obstacle') {
        this.drawVoxelCube(r.gx, r.gy, 0, 16, '#707080', '#4a4a55', '#33333d');
      } else if (r.type === 'food') {
        if (r.foodType === 'floppy') {
          this.drawVoxelCube(r.gx, r.gy, 2, 8, '#2060cc', '#143c80', '#0a2048');
        } else if (r.foodType === 'coffee') {
          this.drawVoxelCube(r.gx, r.gy, 3, 10, '#f0f0e0', '#b09060', '#604020');
        } else {
          this.drawVoxelCube(r.gx, r.gy, 2, 8, '#ffcc00', '#c89e00', '#806400');
        }
      } else if (r.type === 'body') {
        const shade = Math.max(40, 180 - r.index * 6);
        const topCol = `rgb(40, ${shade}, 80)`;
        const leftCol = `rgb(25, ${Math.floor(shade * 0.7)}, 50)`;
        const rightCol = `rgb(15, ${Math.floor(shade * 0.5)}, 30)`;
        this.drawVoxelCube(r.gx, r.gy, 0, 10, topCol, leftCol, rightCol);
      } else if (r.type === 'head') {
        this.drawVoxelCube(r.gx, r.gy, 0, 12, '#33ff77', '#22bb55', '#117733');
      }
    });

    if (this.gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.75)';
      ctx.fillRect(45, 120, 280, 80);
      ctx.strokeStyle = '#00ff88';
      ctx.strokeRect(45, 120, 280, 80);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 15px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('3D ЗМЕЙКА 98', 185, 150);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Нажмите ПРОБЕЛ для старта', 185, 175);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(45, 115, 280, 95);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(45, 115, 280, 95);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 15px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', 185, 142);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText(`Набрано очков: ${this.score}`, 185, 165);
      ctx.fillText('Нажмите ПРОБЕЛ для рестарта', 185, 185);
      ctx.textAlign = 'left';
    }
  }

  gameLoop(now) {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode || this.gameState === 'paused') {
      return;
    }

    const currentTime = now || ((window.performance && window.performance.now) ? window.performance.now() : Date.now());
    if (this.gameState === 'playing' && currentTime - this.lastStepTime >= this.speed) {
      this.step();
      this.lastStepTime = currentTime;
    }

    this.draw();
  }
}

window.appOgSnake3d = new AppOgSnake3d();
