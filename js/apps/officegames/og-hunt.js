class AppOgHunt {
  constructor() {
    this.winId = 'app_og_hunt';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.ammo = 6;
    this.maxAmmo = 6;
    this.score = 0;
    this.timeLeft = 90;
    this.gameState = 'ready';
    this.bossMode = false;

    this.targets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.crosshair = { x: 230, y: 150 };
    this.muzzleFlash = 0;

    this.lastSecondTime = 0;
    this.lastFrameTime = 0;
    this.targetSpawnTimer = 0;
    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseDown = this.onMouseDown.bind(this);
    this.handleContextMenu = this.onContextMenu.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_hunt'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_hunt', String(this.highScore));
      } catch (e) {}
      if (window.appOfficeLauncher && window.appOfficeLauncher.win) window.appOfficeLauncher.populateList();
      if (window.appClippy && window.appClippy.onOfficeGameEvent) {
        window.appClippy.onOfficeGameEvent('hunt', 'high_score', { score: this.highScore });
      }
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 580;
    const initialH = 440;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) + 20);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) - 20);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Офисный Тир 98 (Охота на скрепки)',
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
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    }
    this.win = null;
  }

  renderWindow() {
    if (!this.win) return;
    const body = this.win.body || this.win.bodyElement || (this.win.element ? this.win.element.querySelector('.win-window-body') : null);
    if (!body) return;
    this.win.body = body;

    this.win.body.innerHTML = `
      <div class="og-hunt-app">
        <div class="og-hunt-menubar">
          <div class="og-hunt-menu-btn" id="hunt-menu-new">Игра (F2)</div>
          <div class="og-hunt-menu-btn" id="hunt-menu-reload">Зарядить (Пробел)</div>
          <div class="og-hunt-menu-btn" id="hunt-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-hunt-toolbar">
          <button class="og-hunt-btn" id="hunt-btn-restart">Заново</button>
          <button class="og-hunt-btn" id="hunt-btn-reload">Зарядить (ПРОБЕЛ)</button>
          <button class="og-hunt-btn" id="hunt-btn-boss">Шеф идет!</button>
          <div class="og-hunt-scorebox">
            <div class="og-hunt-stat">
              <span>Патроны:</span>
              <span class="og-hunt-stat-val green" id="hunt-ammo">6/6</span>
            </div>
            <div class="og-hunt-stat">
              <span>Время:</span>
              <span class="og-hunt-stat-val" id="hunt-time">90</span>
            </div>
            <div class="og-hunt-stat">
              <span>Счет:</span>
              <span class="og-hunt-stat-val green" id="hunt-score">0</span>
            </div>
            <div class="og-hunt-stat">
              <span>Рекорд:</span>
              <span class="og-hunt-stat-val green" id="hunt-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-hunt-viewport">
          <canvas id="og_hunt_canvas" class="og-hunt-canvas" width="460" height="300"></canvas>
          <div class="og-hunt-boss-screen" id="hunt-boss-screen">
            <div class="og-hunt-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-hunt-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>Сводная таблица: Инвентаризация 1998</span>
            </div>
            <div class="og-hunt-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=ИНДЕКС(Материалы!$A$2:$E$250; ПОИСКПОЗ(D2; Материалы!$A$2:$A$250; 0); 4)</span>
            </div>
            <div class="og-hunt-boss-grid">
              <table class="og-hunt-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Артикул</b></td><td><b>Наименование</b></td><td><b>Количество</b></td><td><b>Ед. изм.</b></td><td><b>Примечание</b></td></tr>
                <tr class="og-hunt-boss-active-cell"><th>2</th><td>SKR-004</td><td>Скрепки канцелярские 28мм</td><td>4 500</td><td>шт</td><td>На складе</td></tr>
                <tr><th>3</th><td>PPR-102</td><td>Бумага SvetoCopy A4 80г/м2</td><td>120</td><td>пачек</td><td>Выдано в бухгалтерию</td></tr>
                <tr><th>4</th><td>STP-012</td><td>Степлеры металлические №10</td><td>18</td><td>шт</td><td>В эксплуатации</td></tr>
                <tr><th>5</th><td>KOF-055</td><td>Кофе молотый Жокей 250г</td><td>35</td><td>пачек</td><td>Офисный резерв</td></tr>
                <tr><th>6</th><td>FL-350</td><td>Дискеты 3.5" Verbatim 1.44M</td><td>200</td><td>шт</td><td>Архив баз 1C</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-hunt-statusbar">
          <span id="hunt-status-text">ЛКМ — Выстрел, ПКМ / Пробел — Перезарядка, F12 — Экран шефа</span>
          <span>Охота 98 v1.0</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_hunt_canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.canvas.addEventListener('mousemove', this.handleMouseMove);
      this.canvas.addEventListener('mousedown', this.handleMouseDown);
      this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    }

    const btnRestart = this.win.body.querySelector('#hunt-btn-restart');
    const btnReload = this.win.body.querySelector('#hunt-btn-reload');
    const btnBoss = this.win.body.querySelector('#hunt-btn-boss');
    const menuNew = this.win.body.querySelector('#hunt-menu-new');
    const menuReload = this.win.body.querySelector('#hunt-menu-reload');
    const menuBoss = this.win.body.querySelector('#hunt-menu-boss');

    if (btnRestart) btnRestart.onclick = () => this.restartGame();
    if (menuNew) menuNew.onclick = () => this.restartGame();
    if (btnReload) btnReload.onclick = () => this.reloadAmmo();
    if (menuReload) menuReload.onclick = () => this.reloadAmmo();
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

  sndShot() {
    this.playTone(150, 0.08, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(80, 0.12, 'square', 0.18), 20);
  }
  sndEmpty() { this.playTone(600, 0.04, 'triangle', 0.08); }
  sndReload() {
    this.playTone(400, 0.06, 'sine', 0.1);
    setTimeout(() => this.playTone(550, 0.07, 'sine', 0.12), 100);
  }
  sndHit() {
    this.playTone(700, 0.06, 'triangle', 0.15);
    setTimeout(() => this.playTone(950, 0.09, 'sine', 0.18), 50);
  }
  sndBonus() {
    this.playTone(880, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(1100, 0.12, 'sine', 0.15), 80);
  }

  initGame() {
    this.ammo = 6;
    this.score = 0;
    this.timeLeft = 90;
    this.gameState = 'ready';
    this.targets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.muzzleFlash = 0;

    this.spawnClockTarget();
    for (let i = 0; i < 4; i++) {
      this.spawnTarget();
    }

    this.lastSecondTime = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    this.lastFrameTime = 0;
    this.updateHUD();

    this.loop = this.gameLoop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  restartGame() {
    this.saveHighScore();
    this.initGame();
    this.gameState = 'playing';
  }

  reloadAmmo() {
    if (this.ammo < this.maxAmmo) {
      this.ammo = this.maxAmmo;
      this.sndReload();
      this.updateHUD();
    }
  }

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#hunt-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Офисный Тир 98 (Охота на скрепки)';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
    if (window.appClippy && window.appClippy.onOfficeGameEvent) {
      window.appClippy.onOfficeGameEvent('hunt', this.bossMode ? 'boss_on' : 'boss_off');
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
      } else if (this.gameState === 'playing') {
        this.reloadAmmo();
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
  }

  onMouseMove(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.crosshair.x = e.clientX - rect.left;
    this.crosshair.y = e.clientY - rect.top;
  }

  onContextMenu(e) {
    e.preventDefault();
    if (this.gameState === 'playing') {
      this.reloadAmmo();
    }
  }

  onMouseDown(e) {
    if (e.button === 2) return;
    if (this.gameState === 'ready') {
      this.gameState = 'playing';
      this.shoot();
      return;
    }
    if (this.gameState === 'gameover') {
      this.restartGame();
      return;
    }
    if (this.gameState === 'playing') {
      this.shoot();
    }
  }

  shoot() {
    if (this.ammo <= 0) {
      this.sndEmpty();
      this.createFloatingText('НЕТ ПАТРОНОВ!', this.crosshair.x, this.crosshair.y - 10, '#ff3333');
      return;
    }

    this.ammo--;
    this.muzzleFlash = 4;
    this.sndShot();
    this.updateHUD();

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.dead) continue;

      const hitBoxPadding = 4;
      if (
        this.crosshair.x >= t.x - hitBoxPadding &&
        this.crosshair.x <= t.x + t.w + hitBoxPadding &&
        this.crosshair.y >= t.y - hitBoxPadding &&
        this.crosshair.y <= t.y + t.h + hitBoxPadding
      ) {
        hit = true;
        t.dead = true;
        this.score += t.points;
        this.sndHit();

        if (t.type === 'clock') {
          this.timeLeft += 5;
          this.sndBonus();
          this.createFloatingText('+5 СЕК!', t.x, t.y - 12, '#00ffff');
        } else {
          this.createFloatingText(`+${t.points}`, t.x + t.w / 2, t.y - 10, '#ffff00');
        }

        this.createSparks(t.x + t.w / 2, t.y + t.h / 2, t.color);
        if ((t.type === 'clippy' || t.type === 'paperclip') && window.appClippy && window.appClippy.onOfficeGameEvent) {
          window.appClippy.onOfficeGameEvent('hunt', t.type === 'clippy' ? 'shot_clippy' : 'shot_paperclip', { points: t.points, score: this.score });
        }
        break;
      }
    }

    if (!hit) {
      this.createSparks(this.crosshair.x, this.crosshair.y, '#ffffff');
    }
  }

  spawnClockTarget() {
    this.targets.push({
      x: 370,
      y: 40,
      w: 24,
      h: 24,
      vx: 0,
      vy: 0,
      type: 'clock',
      points: 50,
      color: '#ffcc00',
      dead: false
    });
  }

  spawnTarget() {
    const types = ['paperclip', 'paperclip', 'airplane', 'coffee', 'duck', 'clippy'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const fromLeft = Math.random() > 0.5;

    let w = 26;
    let h = 24;
    let speed = 0.9 + Math.random() * 0.9;
    let points = 25;
    let color = '#4090ff';
    let y = 30 + Math.random() * 160;

    if (chosenType === 'paperclip') {
      w = 28;
      h = 24;
      speed = 0.85 + Math.random() * 0.75;
      points = 50;
      color = '#aaaaaa';
    } else if (chosenType === 'airplane') {
      w = 32;
      h = 16;
      speed = 1.4 + Math.random() * 0.9;
      points = 35;
      color = '#ffffff';
      y = 20 + Math.random() * 110;
    } else if (chosenType === 'coffee') {
      w = 20;
      h = 20;
      speed = 0.75 + Math.random() * 0.65;
      points = 30;
      color = '#b08050';
      y = 70 + Math.random() * 120;
    } else if (chosenType === 'duck') {
      w = 24;
      h = 22;
      speed = 0.65 + Math.random() * 0.55;
      points = 20;
      color = '#ffdd00';
      y = 190 + Math.random() * 40;
    } else if (chosenType === 'clippy') {
      w = 26;
      h = 32;
      speed = 1.15 + Math.random() * 0.85;
      points = 100;
      color = '#ffd700';
      y = 30 + Math.random() * 90;
    }

    const x = fromLeft ? -w - 10 : 470;
    const vx = fromLeft ? speed : -speed;

    this.targets.push({
      x,
      y,
      w,
      h,
      vx,
      vy: (Math.random() - 0.5) * 0.35,
      type: chosenType,
      points,
      color,
      dead: false,
      fallSpeed: 0,
      flap: 0
    });
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.9 + Math.random() * 1.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 24,
        color
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffff00') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -0.65,
      life: 40,
      color
    });
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const ammoEl = this.win.body.querySelector('#hunt-ammo');
    const timeEl = this.win.body.querySelector('#hunt-time');
    const scoreEl = this.win.body.querySelector('#hunt-score');
    const highEl = this.win.body.querySelector('#hunt-high');

    if (ammoEl) ammoEl.textContent = `${this.ammo}/${this.maxAmmo}`;
    if (timeEl) timeEl.textContent = this.timeLeft;
    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
  }

  drawOfficeBackground(ctx) {
    ctx.fillStyle = '#6b93b8';
    ctx.fillRect(0, 0, 460, 160);

    ctx.fillStyle = '#8ab4db';
    ctx.fillRect(40, 20, 80, 75);
    ctx.fillRect(150, 20, 80, 75);
    ctx.fillRect(260, 20, 80, 75);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 20, 80, 75);
    ctx.strokeRect(150, 20, 80, 75);
    ctx.strokeRect(260, 20, 80, 75);

    ctx.beginPath();
    ctx.moveTo(80, 20); ctx.lineTo(80, 95);
    ctx.moveTo(40, 57); ctx.lineTo(120, 57);
    ctx.moveTo(190, 20); ctx.lineTo(190, 95);
    ctx.moveTo(150, 57); ctx.lineTo(230, 57);
    ctx.moveTo(300, 20); ctx.lineTo(300, 95);
    ctx.moveTo(260, 57); ctx.lineTo(340, 57);
    ctx.stroke();

    ctx.fillStyle = '#4c647d';
    ctx.fillRect(0, 160, 460, 140);

    ctx.fillStyle = '#5c7996';
    ctx.fillRect(0, 158, 460, 4);

    ctx.fillStyle = '#9cb3c9';
    ctx.fillRect(30, 180, 110, 100);
    ctx.fillRect(170, 180, 110, 100);
    ctx.fillRect(310, 180, 110, 100);

    ctx.fillStyle = '#6d8196';
    ctx.fillRect(25, 230, 120, 10);
    ctx.fillRect(165, 230, 120, 10);
    ctx.fillRect(305, 230, 120, 10);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(60, 200, 36, 28);
    ctx.fillStyle = '#000080';
    ctx.fillRect(64, 204, 28, 20);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(200, 200, 36, 28);
    ctx.fillStyle = '#008080';
    ctx.fillRect(204, 204, 28, 20);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(340, 200, 36, 28);
    ctx.fillStyle = '#800080';
    ctx.fillRect(344, 204, 28, 20);

    ctx.fillStyle = '#d0d8e0';
    ctx.fillRect(410, 160, 30, 80);
    ctx.fillStyle = '#4080ff';
    ctx.beginPath();
    ctx.arc(425, 155, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTarget(ctx, t) {
    ctx.save();
    ctx.translate(t.x, t.y);

    if (t.type === 'clock') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 12); ctx.lineTo(12, 4);
      ctx.moveTo(12, 12); ctx.lineTo(18, 12);
      ctx.stroke();
    } else if (t.type === 'airplane') {
      ctx.fillStyle = '#f8f8f8';
      ctx.beginPath();
      if (t.vx > 0) {
        ctx.moveTo(t.w, t.h / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(6, t.h / 2);
        ctx.lineTo(0, t.h);
      } else {
        ctx.moveTo(0, t.h / 2);
        ctx.lineTo(t.w, 0);
        ctx.lineTo(t.w - 6, t.h / 2);
        ctx.lineTo(t.w, t.h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else if (t.type === 'paperclip') {
      t.flap = (t.flap + 0.14) % (Math.PI * 2);
      const wingY = Math.sin(t.flap) * 6;

      ctx.strokeStyle = '#d0d0d8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 12, 8, Math.PI, 0);
      ctx.lineTo(20, 20);
      ctx.arc(14, 20, 6, 0, Math.PI);
      ctx.lineTo(8, 14);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(17, 8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(20, 8);
      ctx.lineTo(26, 10);
      ctx.lineTo(20, 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 12);
      ctx.lineTo(0, 12 + wingY);
      ctx.stroke();
    } else if (t.type === 'coffee') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 4, 14, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 7, 5, 8);
      ctx.fillStyle = '#6b3e18';
      ctx.fillRect(4, 5, 10, 4);
    } else if (t.type === 'duck') {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.ellipse(12, 14, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(18, 9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(23, 8); ctx.lineTo(27, 9); ctx.lineTo(23, 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(20, 7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.type === 'clippy') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(13, 12, 8, Math.PI, 0);
      ctx.lineTo(21, 24);
      ctx.arc(15, 24, 6, 0, Math.PI);
      ctx.lineTo(9, 16);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(11, 10, 3.5, 0, Math.PI * 2);
      ctx.arc(17, 10, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(11, 10, 1.8, 0, Math.PI * 2);
      ctx.arc(17, 10, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(14, 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCrosshair(ctx) {
    const cx = this.crosshair.x;
    const cy = this.crosshair.y;

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 7, cy);
    ctx.moveTo(cx + 7, cy); ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx, cy + 7); ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    if (this.muzzleFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      this.muzzleFlash--;
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawOfficeBackground(ctx);

    for (let i = 0; i < this.targets.length; i++) {
      this.drawTarget(ctx, this.targets[i]);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life--;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2.5, 2.5);

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

    this.drawCrosshair(ctx);

    if (this.gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.75)';
      ctx.fillRect(80, 100, 300, 95);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(80, 100, 300, 95);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ОФИСНЫЙ ТИР 98', 230, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Стреляйте по скрепкам, самолетам и часам!', 230, 155);
      ctx.fillText('Кликните мышью или нажмите ПРОБЕЛ для старта', 230, 175);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(80, 95, 300, 105);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(80, 95, 300, 105);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ВРЕМЯ ВЫШЛО!', 230, 125);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Tahoma';
      ctx.fillText(`Ваш результат: ${this.score} очков`, 230, 150);
      ctx.font = '10px Tahoma';
      ctx.fillText('Кликните или нажмите ПРОБЕЛ для рестарта', 230, 175);
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

    if (this.gameState === 'playing') {
      if (currentTime - this.lastSecondTime >= 1000) {
        this.timeLeft--;
        this.lastSecondTime = currentTime;
        this.updateHUD();

        if (this.timeLeft <= 0) {
          this.gameState = 'gameover';
          this.saveHighScore();
          this.updateHUD();
        }
      }

      for (let i = this.targets.length - 1; i >= 0; i--) {
        const t = this.targets[i];
        if (t.dead) {
          t.fallSpeed += 0.2;
          t.y += t.fallSpeed;
          if (t.y > 320) {
            this.targets.splice(i, 1);
          }
        } else {
          t.x += t.vx;
          t.y += t.vy;

          if (t.x < -60 || t.x > 500) {
            this.targets.splice(i, 1);
          }
        }
      }

      if (this.targets.length < 5) {
        this.spawnTarget();
      }

      if (!this.targets.some(t => t.type === 'clock')) {
        this.targetSpawnTimer++;
        if (this.targetSpawnTimer > 600) {
          this.spawnClockTarget();
          this.targetSpawnTimer = 0;
        }
      }
    }

    this.draw();
  }
}

window.appOgHunt = new AppOgHunt();
