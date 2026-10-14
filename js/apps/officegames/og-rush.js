class AppOgRush {
  constructor() {
    this.winId = 'app_og_rush';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'ready';
    this.bossMode = false;

    this.player = {
      x: 30,
      y: 190,
      w: 18,
      h: 28,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      frame: 0,
      boostTimer: 0
    };

    this.cameraX = 0;
    this.levelWidth = 800;

    this.platforms = [];
    this.obstacles = [];
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.exitDoor = { x: 740, y: 160, w: 32, h: 58 };

    this.keys = { left: false, right: false, jump: false };
    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_rush'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_rush', String(this.highScore));
      } catch (e) {}
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 500;
    const initialH = 400;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) - 50);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) + 20);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Побег в 18:00 (Офисный платформер)',
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
    window.removeEventListener('keyup', this.handleKeyUp);
    this.win = null;
  }

  renderWindow() {
    if (!this.win) return;
    const body = this.win.body || this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    if (!body) return;
    this.win.body = body;

    this.win.body.innerHTML = `
      <div class="og-rush-app">
        <div class="og-rush-menubar">
          <div class="og-rush-menu-btn" id="rush-menu-new">Игра (F2)</div>
          <div class="og-rush-menu-btn" id="rush-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-rush-toolbar">
          <button class="og-rush-btn" id="rush-btn-restart">Заново</button>
          <button class="og-rush-btn" id="rush-btn-boss">Шеф идет!</button>
          <div class="og-rush-scorebox">
            <div class="og-rush-stat">
              <span>Жизни:</span>
              <span class="og-rush-stat-val red" id="rush-lives">3</span>
            </div>
            <div class="og-rush-stat">
              <span>Этаж:</span>
              <span class="og-rush-stat-val" id="rush-floor">3</span>
            </div>
            <div class="og-rush-stat">
              <span>Счет:</span>
              <span class="og-rush-stat-val" id="rush-score">0</span>
            </div>
            <div class="og-rush-stat">
              <span>Рекорд:</span>
              <span class="og-rush-stat-val" id="rush-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-rush-viewport">
          <canvas id="og_rush_canvas" class="og-rush-canvas" width="420" height="260"></canvas>
          <div class="og-rush-boss-screen" id="rush-boss-screen">
            <div class="og-rush-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-rush-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Табель учета рабочего времени: Сентябрь 1998</span>
            </div>
            <div class="og-rush-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=ЕСЛИ(C2>=18; "Своевременный уход"; "Переработка")</span>
            </div>
            <div class="og-rush-boss-grid">
              <table class="og-rush-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Сотрудник</b></td><td><b>Должность</b></td><td><b>Приход</b></td><td><b>Уход</b></td><td><b>Статус</b></td></tr>
                <tr class="og-rush-boss-active-cell"><th>2</th><td>Иванов А.С.</td><td>Ведущий спец.</td><td>08:55</td><td>18:00</td><td>В графике</td></tr>
                <tr><th>3</th><td>Петрова М.В.</td><td>Главный бухгалтер</td><td>08:40</td><td>19:30</td><td>Сверхурочно</td></tr>
                <tr><th>4</th><td>Сидоров Д.А.</td><td>Системный админ</td><td>10:15</td><td>22:00</td><td>Ночная смена</td></tr>
                <tr><th>5</th><td>Кузнецов О.И.</td><td>Менеджер продаж</td><td>08:58</td><td>18:01</td><td>В графике</td></tr>
                <tr><th>6</th><td>Смирнова Е.К.</td><td>Секретарь-референт</td><td>08:50</td><td>18:00</td><td>В графике</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-rush-statusbar">
          <span id="rush-status-text">Стрелки влево/вправо — бег, Вверх / Пробел — прыжок, F12 — Экран шефа</span>
          <span id="rush-status-time">18:00:00</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_rush_canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    const btnRestart = this.win.body.querySelector('#rush-btn-restart');
    const btnBoss = this.win.body.querySelector('#rush-btn-boss');
    const menuNew = this.win.body.querySelector('#rush-menu-new');
    const menuBoss = this.win.body.querySelector('#rush-menu-boss');

    if (btnRestart) btnRestart.onclick = () => this.restartGame();
    if (menuNew) menuNew.onclick = () => this.restartGame();
    if (btnBoss) btnBoss.onclick = () => this.toggleBossKey();
    if (menuBoss) menuBoss.onclick = () => this.toggleBossKey();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
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

  sndJump() { this.playTone(320, 0.08, 'triangle', 0.12); }
  sndCoin() {
    this.playTone(660, 0.06, 'sine', 0.12);
    setTimeout(() => this.playTone(990, 0.08, 'sine', 0.12), 40);
  }
  sndHurt() { this.playTone(180, 0.2, 'sawtooth', 0.18); }
  sndWin() {
    this.playTone(520, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(650, 0.1, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(780, 0.1, 'sine', 0.15), 200);
    setTimeout(() => this.playTone(1040, 0.25, 'sine', 0.2), 300);
  }

  initGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.loadLevel(this.level);
    this.gameState = 'ready';
    this.updateHUD();

    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.loadLevel(this.level);
    this.gameState = 'playing';
    this.updateHUD();
  }

  loadLevel(lvl) {
    this.player.x = 30;
    this.player.y = 190;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = true;
    this.cameraX = 0;

    this.platforms = [];
    this.obstacles = [];
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];

    this.levelWidth = 800 + (lvl - 1) * 150;
    this.exitDoor = { x: this.levelWidth - 60, y: 160, w: 32, h: 58 };

    this.platforms.push({ x: 0, y: 218, w: this.levelWidth, h: 42 });

    if (lvl === 1) {
      this.platforms.push({ x: 120, y: 175, w: 90, h: 14 });
      this.platforms.push({ x: 260, y: 140, w: 80, h: 14 });
      this.platforms.push({ x: 390, y: 165, w: 90, h: 14 });
      this.platforms.push({ x: 530, y: 135, w: 100, h: 14 });

      this.obstacles.push({ x: 220, y: 202, w: 24, h: 16, type: 'puddle' });
      this.obstacles.push({ x: 490, y: 198, w: 22, h: 20, type: 'papers' });
      this.obstacles.push({ x: 330, y: 198, w: 22, h: 20, type: 'chair', vx: 1.2, minX: 290, maxX: 380 });

      this.items.push({ x: 150, y: 150, w: 14, h: 14, type: 'envelope', points: 100 });
      this.items.push({ x: 295, y: 115, w: 14, h: 14, type: 'coffee', points: 150 });
      this.items.push({ x: 430, y: 140, w: 14, h: 14, type: 'envelope', points: 100 });
      this.items.push({ x: 575, y: 110, w: 14, h: 14, type: 'floppy', points: 250 });
    } else if (lvl === 2) {
      this.platforms.push({ x: 100, y: 170, w: 70, h: 14 });
      this.platforms.push({ x: 210, y: 135, w: 80, h: 14 });
      this.platforms.push({ x: 340, y: 165, w: 90, h: 14 });
      this.platforms.push({ x: 480, y: 130, w: 90, h: 14 });
      this.platforms.push({ x: 620, y: 160, w: 80, h: 14 });

      this.obstacles.push({ x: 180, y: 202, w: 24, h: 16, type: 'puddle' });
      this.obstacles.push({ x: 310, y: 198, w: 22, h: 20, type: 'papers' });
      this.obstacles.push({ x: 440, y: 198, w: 22, h: 20, type: 'chair', vx: 1.5, minX: 410, maxX: 500 });
      this.obstacles.push({ x: 590, y: 202, w: 24, h: 16, type: 'puddle' });

      this.items.push({ x: 130, y: 145, w: 14, h: 14, type: 'envelope', points: 100 });
      this.items.push({ x: 245, y: 110, w: 14, h: 14, type: 'floppy', points: 250 });
      this.items.push({ x: 380, y: 140, w: 14, h: 14, type: 'coffee', points: 150 });
      this.items.push({ x: 520, y: 105, w: 14, h: 14, type: 'envelope', points: 100 });
      this.items.push({ x: 655, y: 135, w: 14, h: 14, type: 'floppy', points: 250 });
    } else {
      this.platforms.push({ x: 90, y: 170, w: 70, h: 14 });
      this.platforms.push({ x: 190, y: 130, w: 80, h: 14 });
      this.platforms.push({ x: 310, y: 160, w: 70, h: 14 });
      this.platforms.push({ x: 420, y: 125, w: 90, h: 14 });
      this.platforms.push({ x: 560, y: 155, w: 80, h: 14 });
      this.platforms.push({ x: 690, y: 130, w: 90, h: 14 });

      this.obstacles.push({ x: 160, y: 202, w: 24, h: 16, type: 'puddle' });
      this.obstacles.push({ x: 280, y: 198, w: 22, h: 20, type: 'chair', vx: 1.8, minX: 250, maxX: 340 });
      this.obstacles.push({ x: 400, y: 198, w: 22, h: 20, type: 'papers' });
      this.obstacles.push({ x: 530, y: 202, w: 24, h: 16, type: 'puddle' });
      this.obstacles.push({ x: 660, y: 198, w: 22, h: 20, type: 'chair', vx: 2.0, minX: 630, maxX: 720 });

      this.items.push({ x: 120, y: 145, w: 14, h: 14, type: 'coffee', points: 150 });
      this.items.push({ x: 225, y: 105, w: 14, h: 14, type: 'floppy', points: 250 });
      this.items.push({ x: 340, y: 135, w: 14, h: 14, type: 'envelope', points: 100 });
      this.items.push({ x: 460, y: 100, w: 14, h: 14, type: 'floppy', points: 250 });
      this.items.push({ x: 595, y: 130, w: 14, h: 14, type: 'coffee', points: 150 });
      this.items.push({ x: 730, y: 105, w: 14, h: 14, type: 'envelope', points: 100 });
    }
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#rush-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Побег в 18:00 (Офисный платформер)';
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

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = true;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (this.gameState === 'ready') {
        this.gameState = 'playing';
      } else if (this.gameState === 'playing') {
        if (this.player.onGround) {
          this.player.vy = -7.6;
          this.player.onGround = false;
          this.sndJump();
        }
      } else if (this.gameState === 'levelclear') {
        this.nextLevel();
      } else if (this.gameState === 'gameover' || this.gameState === 'victory') {
        this.restartGame();
      }
    } else if (e.key === 'F2') {
      e.preventDefault();
      this.restartGame();
    }
  }

  onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = false;
    }
  }

  updatePlayer() {
    const p = this.player;
    const baseSpeed = p.boostTimer > 0 ? 4.2 : 2.8;

    if (p.boostTimer > 0) p.boostTimer--;

    if (this.keys.left) {
      p.vx = -baseSpeed;
      p.facing = -1;
      p.frame += 0.2;
    } else if (this.keys.right) {
      p.vx = baseSpeed;
      p.facing = 1;
      p.frame += 0.2;
    } else {
      p.vx = 0;
    }

    p.vy += 0.38;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = 0;
    if (p.x > this.levelWidth - p.w) p.x = this.levelWidth - p.w;

    p.onGround = false;
    for (let i = 0; i < this.platforms.length; i++) {
      const plat = this.platforms[i];
      if (
        p.x + p.w > plat.x &&
        p.x < plat.x + plat.w &&
        p.y + p.h >= plat.y &&
        p.y + p.h <= plat.y + 12 &&
        p.vy >= 0
      ) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        break;
      }
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.type === 'chair' && obs.vx) {
        obs.x += obs.vx;
        if (obs.x < obs.minX || obs.x > obs.maxX) obs.vx = -obs.vx;
      }

      if (
        p.x + p.w > obs.x + 3 &&
        p.x < obs.x + obs.w - 3 &&
        p.y + p.h > obs.y + 4 &&
        p.y < obs.y + obs.h
      ) {
        this.hitObstacle();
        break;
      }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (
        p.x + p.w > it.x &&
        p.x < it.x + it.w &&
        p.y + p.h > it.y &&
        p.y < it.y + it.h
      ) {
        this.collectItem(it, i);
      }
    }

    if (
      p.x + p.w > this.exitDoor.x + 4 &&
      p.x < this.exitDoor.x + this.exitDoor.w - 4 &&
      p.y + p.h > this.exitDoor.y
    ) {
      this.clearLevel();
    }

    const targetCamX = p.x - 160;
    this.cameraX = Math.max(0, Math.min(this.levelWidth - 420, targetCamX));
  }

  hitObstacle() {
    this.sndHurt();
    this.lives--;
    this.createSparks(this.player.x + 9, this.player.y + 14, '#ff3333');
    this.createFloatingText('-1 ЖИЗНЬ!', this.player.x, this.player.y - 12, '#ff3333');
    this.updateHUD();

    if (this.lives <= 0) {
      this.gameState = 'gameover';
      this.saveHighScore();
      this.updateHUD();
    } else {
      this.player.x = Math.max(20, this.player.x - 60);
      this.player.y = 180;
      this.player.vy = -3;
    }
  }

  collectItem(it, index) {
    this.items.splice(index, 1);
    this.score += it.points;
    this.sndCoin();
    this.createSparks(it.x + 7, it.y + 7, '#ffff00');

    if (it.type === 'coffee') {
      this.player.boostTimer = 220;
      this.createFloatingText('ТУРБО-КОФЕ!', it.x, it.y - 10, '#00ffff');
    } else {
      this.createFloatingText(`+${it.points}`, it.x, it.y - 10, '#ffff00');
    }

    this.saveHighScore();
    this.updateHUD();
  }

  clearLevel() {
    this.sndWin();
    this.score += 500;
    this.saveHighScore();
    this.updateHUD();

    if (this.level >= 3) {
      this.gameState = 'victory';
    } else {
      this.gameState = 'levelclear';
    }
  }

  nextLevel() {
    this.level++;
    this.loadLevel(this.level);
    this.gameState = 'playing';
    this.updateHUD();
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 14,
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
      life: 22,
      color
    });
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const livesEl = this.win.body.querySelector('#rush-lives');
    const floorEl = this.win.body.querySelector('#rush-floor');
    const scoreEl = this.win.body.querySelector('#rush-score');
    const highEl = this.win.body.querySelector('#rush-high');

    if (livesEl) livesEl.textContent = this.lives;
    if (floorEl) floorEl.textContent = 4 - this.level;
    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#1c2438';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    for (let x = 60; x < this.levelWidth; x += 140) {
      ctx.fillStyle = '#2d3b59';
      ctx.fillRect(x, 40, 60, 80);
      ctx.strokeStyle = '#435782';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 40, 60, 80);
      ctx.beginPath();
      ctx.moveTo(x + 30, 40); ctx.lineTo(x + 30, 120);
      ctx.moveTo(x, 80); ctx.lineTo(x + 60, 80);
      ctx.stroke();
    }

    this.platforms.forEach(plat => {
      ctx.fillStyle = '#3a4b63';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#5c7294';
      ctx.fillRect(plat.x, plat.y, plat.w, 3);
      ctx.strokeStyle = '#1d2633';
      ctx.lineWidth = 1;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    });

    const ed = this.exitDoor;
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(ed.x, ed.y, ed.w, ed.h);
    ctx.strokeStyle = '#fff8b0';
    ctx.lineWidth = 2;
    ctx.strokeRect(ed.x, ed.y, ed.w, ed.h);
    ctx.beginPath();
    ctx.moveTo(ed.x + ed.w / 2, ed.y);
    ctx.lineTo(ed.x + ed.w / 2, ed.y + ed.h);
    ctx.stroke();
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 9px Tahoma';
    ctx.fillText('ЛИФТ', ed.x + 4, ed.y - 4);

    this.obstacles.forEach(obs => {
      if (obs.type === 'puddle') {
        ctx.fillStyle = '#4090ff';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'papers') {
        ctx.fillStyle = '#f0f0f8';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#888899';
        ctx.lineWidth = 1;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'chair') {
        ctx.fillStyle = '#222222';
        ctx.fillRect(obs.x + 3, obs.y, obs.w - 6, obs.h - 6);
        ctx.fillStyle = '#888888';
        ctx.fillRect(obs.x + obs.w / 2 - 2, obs.y + obs.h - 6, 4, 6);
      }
    });

    this.items.forEach(it => {
      if (it.type === 'envelope') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.strokeRect(it.x, it.y, it.w, it.h);
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y);
        ctx.lineTo(it.x + it.w / 2, it.y + 7);
        ctx.lineTo(it.x + it.w, it.y);
        ctx.stroke();
      } else if (it.type === 'coffee') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x, it.y + 2, it.w - 3, it.h - 2);
        ctx.fillStyle = '#6b3e18';
        ctx.fillRect(it.x + 2, it.y + 3, it.w - 7, 3);
      } else if (it.type === 'floppy') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x + 2, it.y + it.h - 6, it.w - 4, 4);
      }
    });

    const p = this.player;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    if (p.facing === -1) ctx.scale(-1, 1);

    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-5, -14, 10, 10);
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(-6, -15, 12, 4);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -4, 12, 14);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-1, -4, 2, 10);

    ctx.fillStyle = '#223355';
    const legOffset = Math.sin(p.frame) * 4;
    ctx.fillRect(-5, 10, 4, 8 + legOffset);
    ctx.fillRect(1, 10, 4, 8 - legOffset);

    ctx.restore();

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

    ctx.restore();

    if (this.gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.75)';
      ctx.fillRect(60, 80, 300, 95);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(60, 80, 300, 95);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ПОБЕГ В 18:00', 210, 110);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Бегите к лифту, собирайте премии и кофе!', 210, 135);
      ctx.fillText('Нажмите ПРОБЕЛ для старта', 210, 155);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'levelclear') {
      ctx.fillStyle = 'rgba(0, 50, 0, 0.85)';
      ctx.fillRect(60, 80, 300, 95);
      ctx.strokeStyle = '#00ff88';
      ctx.strokeRect(60, 80, 300, 95);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 15px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ЭТАЖ ПРОЙДЕН!', 210, 110);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Лифт спускается на следующий этаж...', 210, 135);
      ctx.fillText('Нажмите ПРОБЕЛ для продолжения', 210, 155);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(60, 80, 300, 95);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(60, 80, 300, 95);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ОПОЗДАЛИ НА ЛИФТ!', 210, 110);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText(`Набрано очков: ${this.score}`, 210, 135);
      ctx.fillText('Нажмите ПРОБЕЛ для рестарта', 210, 155);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'victory') {
      ctx.fillStyle = 'rgba(0, 0, 70, 0.9)';
      ctx.fillRect(50, 75, 320, 105);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(50, 75, 320, 105);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('СВОБОДА! 18:00!', 210, 105);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Вы успешно покинули здание офиса вовремя!', 210, 128);
      ctx.fillText(`Итоговый результат: ${this.score} очков`, 210, 146);
      ctx.font = '10px Tahoma';
      ctx.fillText('Нажмите ПРОБЕЛ для новой игры', 210, 164);
      ctx.textAlign = 'left';
    }
  }

  gameLoop() {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode) return;

    if (this.gameState === 'playing') {
      this.updatePlayer();
    }

    this.draw();
  }
}

window.appOgRush = new AppOgRush();
