class AppOgArkanoid {
  constructor() {
    this.winId = 'app_og_arkanoid';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'ready';
    this.bossMode = false;

    this.paddle = {
      x: 130,
      y: 355,
      w: 60,
      h: 10,
      laserTimer: 0,
      wideTimer: 0
    };

    this.balls = [];
    this.bricks = [];
    this.drops = [];
    this.lasers = [];
    this.particles = [];
    this.floatingTexts = [];

    this.keys = { left: false, right: false };
    this.lastFrameTime = 0;
    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_arkanoid'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_arkanoid', String(this.highScore));
      } catch (e) {}
      if (window.appOfficeLauncher && window.appOfficeLauncher.win) window.appOfficeLauncher.populateList();
      if (window.appClippy && window.appClippy.onOfficeGameEvent) {
        window.appClippy.onOfficeGameEvent('arkanoid', 'high_score', { score: this.highScore });
      }
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    if (window.soundSys && window.soundSys.playClick) {
      window.soundSys.playClick();
    }

    this.win = window.winManager.createWindow({
      id: this.winId,
      title: 'Офисный Арканоид',
      icon: 'game-manager',
      width: 340,
      height: 480,
      resizable: false,
      maximizable: false,
      onClose: () => {
        this.destroy();
      }
    });

    if (this.win && !this.win.body) {
      this.win.body = this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    }

    const closeBtn = this.win.element ? this.win.element.querySelector('.win-titlebar-btn-close') : null;
    if (closeBtn) {
      const prevAction = closeBtn.onclick;
      closeBtn.onclick = (e) => {
        this.destroy();
        if (typeof prevAction === 'function') prevAction.call(closeBtn, e);
      };
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
      <div class="arkanoid-app">
        <div class="arkanoid-menubar">
          <div class="arkanoid-menu-btn" id="ark-menu-new">Игра (F2)</div>
          <div class="arkanoid-menu-btn" id="ark-menu-pause">Пауза (P)</div>
          <div class="arkanoid-menu-btn" id="ark-menu-boss">Босс (F12)</div>
        </div>

        <div class="arkanoid-toolbar">
          <div class="arkanoid-stats">
            <div>Счет: <span class="arkanoid-stat-val" id="ark-score">0</span></div>
            <div>Рекорд: <span class="arkanoid-stat-val" id="ark-high">0</span></div>
            <div>Жизни: <span class="arkanoid-stat-lives" id="ark-lives">♥♥♥</span></div>
          </div>
          <button class="arkanoid-boss-btn" id="ark-boss-btn">💼 Boss Key (F12)</button>
        </div>

        <div class="arkanoid-canvas-wrap">
          <canvas class="arkanoid-canvas" id="ark-canvas" width="320" height="380"></canvas>
        </div>

        <div class="arkanoid-statusbar">
          <span id="ark-level-name">Уровень 1: Бухгалтерия</span>
          <span>Управление: Мышь / Стрелки, Пробел</span>
        </div>

        <div class="arkanoid-boss-overlay" id="ark-boss-screen" style="display: none;">
          <div class="excel-fake-title">
            <span>Microslop Excel - Отчёт_3_квартал_1998.xls</span>
            <span>? ✕</span>
          </div>
          <div class="excel-fake-menubar">
            <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span>
          </div>
          <div class="excel-fake-formula">
            <div class="excel-formula-name">C4</div>
            <div class="excel-formula-input">=СУММ(C2:C3)*1.18 - НАЛОГ_НДС</div>
          </div>
          <table class="excel-fake-table">
            <thead>
              <tr>
                <th style="width: 28px;"></th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>1</th>
                <td><b>Статья расходов</b></td>
                <td><b>План (руб)</b></td>
                <td><b>Факт (руб)</b></td>
                <td><b>Откл.</b></td>
              </tr>
              <tr>
                <th>2</th>
                <td>Бумага для принтера (пачки)</td>
                <td class="num">12 400.00</td>
                <td class="num">11 850.00</td>
                <td class="num">-550.00</td>
              </tr>
              <tr>
                <th>3</th>
                <td>Диспетчеры и картриджи</td>
                <td class="num">48 000.00</td>
                <td class="num">49 200.00</td>
                <td class="num">+1 200.00</td>
              </tr>
              <tr>
                <th>4</th>
                <td>Амортизация ПК Pentium-133</td>
                <td class="num">145 000.00</td>
                <td class="num">145 000.00</td>
                <td class="num">0.00</td>
              </tr>
              <tr>
                <th>5</th>
                <td>Чай, кофе для сотрудников</td>
                <td class="num">6 500.00</td>
                <td class="num">8 100.00</td>
                <td class="num">+1 600.00</td>
              </tr>
              <tr>
                <th>6</th>
                <td>Лицензии Win 98 SE</td>
                <td class="num">84 000.00</td>
                <td class="num">84 000.00</td>
                <td class="num">0.00</td>
              </tr>
              <tr>
                <th>7</th>
                <td><b>ИТОГО ПО КВАРТАЛУ:</b></td>
                <td class="num"><b>295 900.00</b></td>
                <td class="num"><b>298 150.00</b></td>
                <td class="num"><b>+2 250.00</b></td>
              </tr>
            </tbody>
          </table>
          <div class="excel-fake-tabs">
            <div class="excel-fake-tab">Квартал 3</div>
            <div>Квартал 4</div>
            <div>Сводка</div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#ark-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    const newBtn = this.win.body.querySelector('#ark-menu-new');
    if (newBtn) newBtn.addEventListener('click', () => this.restartGame());

    const pauseBtn = this.win.body.querySelector('#ark-menu-pause');
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

    const bossBtn = this.win.body.querySelector('#ark-menu-boss');
    if (bossBtn) bossBtn.addEventListener('click', () => this.toggleBossKey());

    const bossToolBtn = this.win.body.querySelector('#ark-boss-btn');
    if (bossToolBtn) bossToolBtn.addEventListener('click', () => this.toggleBossKey());

    if (this.canvas) {
      this.canvas.addEventListener('mousemove', (e) => {
        if (this.bossMode || this.gameState === 'paused') return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.w, mx - this.paddle.w / 2));
      });

      this.canvas.addEventListener('mousedown', (e) => {
        if (this.bossMode) return;
        if (e.button === 0) {
          this.triggerAction();
        }
      });
    }

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  playTone(freq, dur = 0.06, type = 'square', vol = 0.08) {
    try {
      const audioCtx = window.soundSys && window.soundSys.ctx;
      if (!audioCtx || (window.soundSys && window.soundSys.muted)) return;
      if (typeof window.soundSys.ensureContext === 'function') window.soundSys.ensureContext();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  sndHit() { this.playTone(520, 0.04, 'square', 0.07); }
  sndPaddle() { this.playTone(260, 0.06, 'triangle', 0.1); }
  sndDrop() { this.playTone(680, 0.09, 'sine', 0.09); }
  sndLaser() { this.playTone(850, 0.05, 'sawtooth', 0.06); }
  sndLose() { this.playTone(140, 0.25, 'sawtooth', 0.12); }
  sndWin() {
    this.playTone(440, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(554, 0.1, 'sine', 0.1), 100);
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.1), 200);
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
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.triggerAction();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
      this.togglePause();
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

  triggerAction() {
    if (this.gameState === 'ready') {
      this.gameState = 'playing';
      if (this.balls.length > 0) {
        this.balls[0].vx = 1.4;
        this.balls[0].vy = -2.3;
      }
      this.sndPaddle();
    } else if (this.gameState === 'playing' && this.paddle.laserTimer > 0) {
      this.fireLasers();
    } else if (this.gameState === 'levelclear') {
      this.nextLevel();
    } else if (this.gameState === 'gameover' || this.gameState === 'victory') {
      this.restartGame();
    }
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
    }
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#ark-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Офисный Арканоид';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
    if (window.appClippy && window.appClippy.onOfficeGameEvent) {
      window.appClippy.onOfficeGameEvent('arkanoid', this.bossMode ? 'boss_on' : 'boss_off');
    }
  }

  initGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.loadLevel(this.level);
    this.updateHUD();

    this.lastFrameTime = 0;
    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.loadLevel(this.level);
    this.updateHUD();
  }

  nextLevel() {
    this.level++;
    if (this.level > 3) {
      this.gameState = 'victory';
      this.sndWin();
      this.saveHighScore();
      this.updateHUD();
      return;
    }
    this.loadLevel(this.level);
    this.updateHUD();
  }

  loadLevel(lvl) {
    this.gameState = 'ready';
    this.paddle.w = 60;
    this.paddle.laserTimer = 0;
    this.paddle.wideTimer = 0;
    this.paddle.x = (320 - this.paddle.w) / 2;

    this.balls = [{
      x: this.paddle.x + this.paddle.w / 2,
      y: this.paddle.y - 6,
      vx: 0,
      vy: 0,
      r: 4
    }];

    this.drops = [];
    this.lasers = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bricks = [];

    const rows = 5;
    const cols = 9;
    const brickW = 30;
    const brickH = 13;
    const startX = 13;
    const startY = 32;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'paper';
        let hp = 1;
        let scoreVal = 10;
        let color = '#fef4a0';

        if (lvl === 1) {
          if (r === 0 || r === 1) {
            type = 'floppy';
            color = '#3366cc';
            scoreVal = 20;
          } else if (r === 2) {
            type = 'binder';
            color = '#cc3333';
            scoreVal = 30;
          }
        } else if (lvl === 2) {
          if (r === 0 || (r === 1 && c % 2 === 0)) {
            type = 'monitor';
            hp = 2;
            color = '#808080';
            scoreVal = 50;
          } else if (r <= 2) {
            type = 'binder';
            color = '#cc3333';
            scoreVal = 30;
          } else {
            type = 'floppy';
            color = '#3366cc';
            scoreVal = 20;
          }
        } else if (lvl === 3) {
          if ((r === 1 || r === 2) && (c === 2 || c === 6)) {
            type = 'gold';
            hp = Infinity;
            color = '#e6b800';
            scoreVal = 0;
          } else if (r === 0) {
            type = 'monitor';
            hp = 2;
            color = '#808080';
            scoreVal = 60;
          } else if (r === 1) {
            type = 'binder';
            color = '#cc3333';
            scoreVal = 40;
          } else {
            type = 'paper';
            color = '#fef4a0';
            scoreVal = 20;
          }
        }

        this.bricks.push({
          x: startX + c * (brickW + 4),
          y: startY + r * (brickH + 4),
          w: brickW,
          h: brickH,
          type,
          hp,
          maxHp: hp,
          color,
          score: scoreVal
        });
      }
    }

    const lvlNameEl = this.win.body.querySelector('#ark-level-name');
    if (lvlNameEl) {
      const names = [
        'Уровень 1: Бухгалтерия (Отчёты)',
        'Уровень 2: Серверная (Мониторы)',
        'Уровень 3: Кабинет Директора (Сейфы)'
      ];
      lvlNameEl.textContent = names[lvl - 1] || `Уровень ${lvl}`;
    }
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const scoreEl = this.win.body.querySelector('#ark-score');
    const highEl = this.win.body.querySelector('#ark-high');
    const livesEl = this.win.body.querySelector('#ark-lives');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = Math.max(this.score, this.highScore);
    if (livesEl) {
      livesEl.textContent = '♥'.repeat(Math.max(0, this.lives));
    }
  }

  fireLasers() {
    this.lasers.push({ x: this.paddle.x + 8, y: this.paddle.y - 4, vy: -4.5 });
    this.lasers.push({ x: this.paddle.x + this.paddle.w - 8, y: this.paddle.y - 4, vy: -4.5 });
    this.sndLaser();
  }

  createDebris(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + Math.random() * 20,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        color,
        life: 26 + Math.floor(Math.random() * 12)
      });
    }
  }

  createFloatingText(text, x, y) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -0.5,
      life: 40
    });
  }

  maybeSpawnDrop(x, y) {
    if (Math.random() > 0.28) return;
    const types = ['L', 'M', 'W', 'S', '+'];
    const weights = [0.22, 0.22, 0.25, 0.22, 0.09];
    let r = Math.random();
    let selected = 'W';
    let accum = 0;
    for (let i = 0; i < types.length; i++) {
      accum += weights[i];
      if (r <= accum) {
        selected = types[i];
        break;
      }
    }
    this.drops.push({
      x: x + 10,
      y,
      w: 16,
      h: 10,
      vy: 1.1,
      type: selected
    });
  }

  applyDrop(type) {
    this.sndDrop();
    if (type === 'L') {
      this.paddle.laserTimer = 600;
      this.createFloatingText('ЛАЗЕР!', this.paddle.x + 10, this.paddle.y - 12);
    } else if (type === 'M') {
      const newBalls = [];
      this.balls.forEach(b => {
        newBalls.push({ x: b.x, y: b.y, vx: b.vx * 0.9 - 0.7, vy: b.vy, r: b.r });
        newBalls.push({ x: b.x, y: b.y, vx: b.vx * 0.9 + 0.7, vy: b.vy, r: b.r });
      });
      this.balls.push(...newBalls);
      this.createFloatingText('МУЛЬТИБОЛ!', this.paddle.x + 10, this.paddle.y - 12);
    } else if (type === 'W') {
      this.paddle.wideTimer = 750;
      this.paddle.w = 84;
      this.createFloatingText('ШИРОКАЯ РАКЕТКА!', this.paddle.x + 5, this.paddle.y - 12);
    } else if (type === 'S') {
      this.balls.forEach(b => {
        b.vx *= 0.75;
        b.vy *= 0.75;
      });
      this.createFloatingText('ЗАМЕДЛЕНИЕ!', this.paddle.x + 10, this.paddle.y - 12);
    } else if (type === '+') {
      this.lives = Math.min(5, this.lives + 1);
      this.updateHUD();
      this.createFloatingText('+1 ЖИЗНЬ!', this.paddle.x + 10, this.paddle.y - 12);
    }
  }

  gameLoop(now) {
    if (!this.win) return;
    this.animId = requestAnimationFrame(this.loop);

    if (this.bossMode || this.gameState === 'paused') {
      return;
    }

    const currentTime = now || ((window.performance && window.performance.now) ? window.performance.now() : Date.now());
    if (currentTime - this.lastFrameTime < 16) {
      return;
    }
    this.lastFrameTime = currentTime;

    this.update();
    this.draw();
  }

  update() {
    if (this.keys.left) {
      this.paddle.x = Math.max(0, this.paddle.x - 3.6);
    }
    if (this.keys.right) {
      this.paddle.x = Math.min(320 - this.paddle.w, this.paddle.x + 3.6);
    }

    if (this.paddle.wideTimer > 0) {
      this.paddle.wideTimer--;
      if (this.paddle.wideTimer <= 0) {
        this.paddle.w = 60;
      }
    }

    if (this.paddle.laserTimer > 0) {
      this.paddle.laserTimer--;
    }

    if (this.gameState === 'ready' && this.balls.length > 0) {
      this.balls[0].x = this.paddle.x + this.paddle.w / 2;
      this.balls[0].y = this.paddle.y - 6;
      return;
    }

    if (this.gameState !== 'playing') return;

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;
      let hit = false;
      for (let bi = 0; bi < this.bricks.length; bi++) {
        const b = this.bricks[bi];
        if (l.x >= b.x && l.x <= b.x + b.w && l.y >= b.y && l.y <= b.y + b.h) {
          hit = true;
          if (b.type !== 'gold') {
            b.hp--;
            if (b.hp <= 0) {
              this.score += b.score;
              this.createDebris(b.x, b.y, b.color);
              this.maybeSpawnDrop(b.x, b.y);
              this.bricks.splice(bi, 1);
            }
            this.sndHit();
            this.updateHUD();
          }
          break;
        }
      }
      if (hit || l.y < 0) {
        this.lasers.splice(i, 1);
      }
    }

    for (let di = this.drops.length - 1; di >= 0; di--) {
      const d = this.drops[di];
      d.y += d.vy;
      if (
        d.y + d.h >= this.paddle.y &&
        d.y <= this.paddle.y + this.paddle.h &&
        d.x + d.w >= this.paddle.x &&
        d.x <= this.paddle.x + this.paddle.w
      ) {
        this.applyDrop(d.type);
        this.drops.splice(di, 1);
      } else if (d.y > 380) {
        this.drops.splice(di, 1);
      }
    }

    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const b = this.balls[bi];
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.r <= 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
        this.sndHit();
      } else if (b.x + b.r >= 320) {
        b.x = 320 - b.r;
        b.vx = -Math.abs(b.vx);
        this.sndHit();
      }

      if (b.y - b.r <= 0) {
        b.y = b.r;
        b.vy = Math.abs(b.vy);
        this.sndHit();
      }

      if (
        b.y + b.r >= this.paddle.y &&
        b.y - b.r <= this.paddle.y + this.paddle.h &&
        b.x >= this.paddle.x - 2 &&
        b.x <= this.paddle.x + this.paddle.w + 2
      ) {
        b.y = this.paddle.y - b.r;
        const hitOffset = (b.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
        b.vx = hitOffset * 2.4;
        b.vy = -Math.max(1.8, Math.sqrt(Math.max(5.0, 7.2 - b.vx * b.vx)));
        this.sndPaddle();
      }

      for (let bri = this.bricks.length - 1; bri >= 0; bri--) {
        const br = this.bricks[bri];
        if (
          b.x + b.r >= br.x &&
          b.x - b.r <= br.x + br.w &&
          b.y + b.r >= br.y &&
          b.y - b.r <= br.y + br.h
        ) {
          const prevX = b.x - b.vx;
          const prevY = b.y - b.vy;

          if (prevX + b.r <= br.x || prevX - b.r >= br.x + br.w) {
            b.vx = -b.vx;
          } else {
            b.vy = -b.vy;
          }

          if (br.type !== 'gold') {
            br.hp--;
            if (br.hp <= 0) {
              this.score += br.score;
              this.createDebris(br.x, br.y, br.color);
              this.maybeSpawnDrop(br.x, br.y);
              this.bricks.splice(bri, 1);
            }
            this.sndHit();
            this.updateHUD();
          } else {
            this.sndPaddle();
          }
          break;
        }
      }

      if (b.y > 385) {
        this.balls.splice(bi, 1);
      }
    }

    if (this.balls.length === 0) {
      this.lives--;
      this.sndLose();
      this.updateHUD();
      if (this.lives <= 0) {
        this.gameState = 'gameover';
        this.saveHighScore();
      } else {
        this.gameState = 'ready';
        this.paddle.laserTimer = 0;
        this.paddle.wideTimer = 0;
        this.paddle.w = 60;
        this.balls = [{
          x: this.paddle.x + this.paddle.w / 2,
          y: this.paddle.y - 6,
          vx: 0,
          vy: 0,
          r: 4
        }];
      }
    }

    const breakableLeft = this.bricks.some(b => b.type !== 'gold');
    if (!breakableLeft) {
      this.gameState = 'levelclear';
      this.sndWin();
      this.saveHighScore();
    }

    for (let pi = this.particles.length - 1; pi >= 0; pi--) {
      const p = this.particles[pi];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(pi, 1);
    }

    for (let ti = this.floatingTexts.length - 1; ti >= 0; ti--) {
      const ft = this.floatingTexts[ti];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(ti, 1);
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = 320;
    const h = 380;

    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#0e1830';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    this.bricks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x, b.y, b.w, 2);
      ctx.fillRect(b.x, b.y, 2, b.h);

      ctx.fillStyle = '#101010';
      ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h);
      ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2);

      if (b.type === 'floppy') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x + 6, b.y + 4, b.w - 12, 5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(b.x + 8, b.y + 6, b.w - 16, 1);
      } else if (b.type === 'monitor') {
        ctx.fillStyle = b.hp === 1 ? '#204040' : '#406080';
        ctx.fillRect(b.x + 4, b.y + 3, b.w - 8, b.h - 6);
        if (b.hp === 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.x + 6, b.y + 3);
          ctx.lineTo(b.x + 12, b.y + 7);
          ctx.lineTo(b.x + 18, b.y + 4);
          ctx.stroke();
        }
      } else if (b.type === 'binder') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x + 3, b.y + 3, 4, b.h - 6);
      } else if (b.type === 'paper') {
        ctx.fillStyle = '#a0a070';
        ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, 1);
        ctx.fillRect(b.x + 4, b.y + 7, b.w - 8, 1);
      }
    });

    this.lasers.forEach(l => {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(l.x - 1, l.y, 3, 8);
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(l.x, l.y, 1, 8);
    });

    this.drops.forEach(d => {
      const colors = {
        'L': '#cc0000',
        'M': '#0066cc',
        'W': '#009933',
        'S': '#009999',
        '+': '#cc0066'
      };
      ctx.fillStyle = colors[d.type] || '#ffffff';
      ctx.fillRect(d.x, d.y, d.w, d.h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(d.x, d.y, d.w, 1);
      ctx.fillRect(d.x, d.y, 1, d.h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Tahoma';
      ctx.fillText(d.type, d.x + 4, d.y + 8);
    });

    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    const px = this.paddle.x;
    const py = this.paddle.y;
    const pw = this.paddle.w;
    const ph = this.paddle.h;

    ctx.fillStyle = this.paddle.laserTimer > 0 ? '#cc2020' : '#008080';
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px, py, pw, 2);
    ctx.fillRect(px, py, 2, ph);

    ctx.fillStyle = '#004040';
    ctx.fillRect(px + pw - 2, py, 2, ph);
    ctx.fillRect(px, py + ph - 2, pw, 2);

    if (this.paddle.laserTimer > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(px + 4, py - 3, 3, 3);
      ctx.fillRect(px + pw - 7, py - 3, 3, 3);
    }

    this.balls.forEach(b => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff99';
      ctx.beginPath();
      ctx.arc(b.x - 1, b.y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 10px Tahoma';
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    if (this.gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(20, 190, 280, 40);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(20, 190, 280, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('НАЖМИТЕ ПРОБЕЛ ИЛИ КЛИК МЫШИ', 160, 208);
      ctx.font = '10px Tahoma';
      ctx.fillText('ДЛЯ ЗАПУСКА ШАРИКА', 160, 222);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 128, 0.7)';
      ctx.fillRect(50, 170, 220, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(50, 170, 220, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ПАУЗА', 160, 195);
      ctx.font = '10px Tahoma';
      ctx.fillText('Нажмите P для продолжения', 160, 210);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'levelclear') {
      ctx.fillStyle = 'rgba(0, 60, 0, 0.85)';
      ctx.fillRect(40, 160, 240, 65);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(40, 160, 240, 65);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 13px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ОТЧЁТ СДАН! УРОВЕНЬ ПРОЙДЕН!', 160, 185);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Нажмите ПРОБЕЛ для след. уровня', 160, 208);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(80, 0, 0, 0.85)';
      ctx.fillRect(40, 160, 240, 70);
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(40, 160, 240, 70);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 14px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', 160, 185);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Tahoma';
      ctx.fillText(`Ваш счет: ${this.score}`, 160, 203);
      ctx.fillText('Нажмите ПРОБЕЛ для перезапуска', 160, 218);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'victory') {
      ctx.fillStyle = 'rgba(0, 0, 80, 0.9)';
      ctx.fillRect(30, 150, 260, 85);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(30, 150, 260, 85);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 13px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ПОБЕДА!', 160, 175);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Все квартальные отчёты закрыты!', 160, 195);
      ctx.fillText(`Итоговый счёт: ${this.score}`, 160, 210);
      ctx.font = '9px Tahoma';
      ctx.fillText('Нажмите ПРОБЕЛ для новой игры', 160, 225);
      ctx.textAlign = 'left';
    }
  }
}

window.appOgArkanoid = new AppOgArkanoid();
