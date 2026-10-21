class AppOgChairs {
  constructor() {
    this.winId = 'app_og_chairs';
    this.win = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.roadLeft = 40;
    this.roadRight = 320;
    this.scrollY = 0;

    this.player = {
      x: 180,
      y: 290,
      w: 24,
      h: 28,
      vx: 0,
      speed: 2.0,
      maxSpeed: 4.0,
      boostTimer: 0,
      spinTimer: 0
    };

    this.lives = 3;
    this.score = 0;
    this.distance = 0;
    this.gameState = 'ready';
    this.bossMode = false;

    this.obstacles = [];
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.keys = { left: false, right: false, up: false, down: false };

    this.spawnTimer = 0;
    this.lastFrameTime = 0;
    this.highScore = this.loadHighScore();

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
  }

  loadHighScore() {
    try {
      const val = parseInt(localStorage.getItem('office_games_scores_chairs'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('office_games_scores_chairs', String(this.highScore));
      } catch (e) {}
      if (window.appOfficeLauncher && window.appOfficeLauncher.win) window.appOfficeLauncher.populateList();
      if (window.appClippy && window.appClippy.onOfficeGameEvent) {
        window.appClippy.onOfficeGameEvent('chairs', 'high_score', { score: this.highScore });
      }
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const initialW = 460;
    const initialH = 490;
    const screenW = window.innerWidth || 800;
    const screenH = window.innerHeight || 600;
    const left = Math.max(20, Math.floor((screenW - initialW) / 2) - 30);
    const top = Math.max(20, Math.floor((screenH - initialH) / 2) + 10);

    if (window.winManager) {
      this.win = window.winManager.createWindow({
        id: this.winId,
        title: 'Гонки на креслах 98 (Chair GP)',
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
      <div class="og-chairs-app">
        <div class="og-chairs-menubar">
          <div class="og-chairs-menu-btn" id="chairs-menu-new">Игра (F2)</div>
          <div class="og-chairs-menu-btn" id="chairs-menu-boss">Босс (F12)</div>
        </div>
        <div class="og-chairs-toolbar">
          <button class="og-chairs-btn" id="chairs-btn-restart">Заново</button>
          <button class="og-chairs-btn" id="chairs-btn-boss">Шеф идет!</button>
          <div class="og-chairs-scorebox">
            <div class="og-chairs-stat">
              <span>Жизни:</span>
              <span class="og-chairs-stat-val red" id="chairs-lives">3</span>
            </div>
            <div class="og-chairs-stat">
              <span>Счет:</span>
              <span class="og-chairs-stat-val" id="chairs-score">0</span>
            </div>
            <div class="og-chairs-stat">
              <span>Рекорд:</span>
              <span class="og-chairs-stat-val" id="chairs-high">${this.highScore}</span>
            </div>
          </div>
        </div>
        <div class="og-chairs-viewport">
          <canvas id="og_chairs_canvas" class="og-chairs-canvas" width="360" height="360"></canvas>
          <div class="og-chairs-boss-screen" id="chairs-boss-screen">
            <div class="og-chairs-boss-menubar">
              <span>Файл</span><span>Правка</span><span>Вид</span><span>Вставка</span><span>Формат</span><span>Сервис</span><span>Данные</span><span>Окно</span><span>Справка</span>
            </div>
            <div class="og-chairs-boss-toolbar">
              <span><b>Ж</b></span><span><i>К</i></span><span><u>Ч</u></span> | <span>План командировочных расходов на 4 квартал 1998</span>
            </div>
            <div class="og-chairs-boss-formula">
              <span style="font-weight:bold;margin-right:8px;">fx</span>
              <span style="border:1px solid #7f9db9;padding:1px 6px;flex:1;background:#fff;">=СУММ(D2:D12) + СУММ(E2:E12)</span>
            </div>
            <div class="og-chairs-boss-grid">
              <table class="og-chairs-boss-table">
                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>
                <tr><th>1</th><td><b>Город</b></td><td><b>Сотрудник</b></td><td><b>Дней</b></td><td><b>Суточные</b></td><td><b>Проезд</b></td></tr>
                <tr class="og-chairs-boss-active-cell"><th>2</th><td>Санкт-Петербург</td><td>Морозов В.П.</td><td>5</td><td>1 250,00</td><td>1 800,00</td></tr>
                <tr><th>3</th><td>Нижний Новгород</td><td>Климов А.С.</td><td>3</td><td>750,00</td><td>940,00</td></tr>
                <tr><th>4</th><td>Екатеринбург</td><td>Федорова С.И.</td><td>6</td><td>1 500,00</td><td>3 200,00</td></tr>
                <tr><th>5</th><td>Новосибирск</td><td>Белов К.В.</td><td>7</td><td>1 750,00</td><td>4 100,00</td></tr>
                <tr><th>6</th><td>Самара</td><td>Григорьев П.М.</td><td>4</td><td>1 000,00</td><td>1 150,00</td></tr>
              </table>
            </div>
          </div>
        </div>
        <div class="og-chairs-statusbar">
          <span id="chairs-status-text">Стрелки — руление и толчки ногами, F12 — Экран шефа</span>
          <span id="chairs-status-speed">35 км/ч</span>
        </div>
      </div>
    `;

    this.canvas = this.win.body.querySelector('#og_chairs_canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    const btnRestart = this.win.body.querySelector('#chairs-btn-restart');
    const btnBoss = this.win.body.querySelector('#chairs-btn-boss');
    const menuNew = this.win.body.querySelector('#chairs-menu-new');
    const menuBoss = this.win.body.querySelector('#chairs-menu-boss');

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

  sndPush() { this.playTone(280, 0.05, 'triangle', 0.1); }
  sndBonus() {
    this.playTone(660, 0.06, 'sine', 0.12);
    setTimeout(() => this.playTone(990, 0.08, 'sine', 0.15), 50);
  }
  sndCrash() { this.playTone(140, 0.25, 'sawtooth', 0.2); }
  sndOver() {
    this.playTone(240, 0.2, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(160, 0.35, 'sawtooth', 0.15), 180);
  }

  initGame() {
    this.player.x = 180;
    this.player.vx = 0;
    this.player.speed = 2.0;
    this.player.boostTimer = 0;
    this.player.spinTimer = 0;

    this.lives = 3;
    this.score = 0;
    this.distance = 0;
    this.gameState = 'ready';
    this.obstacles = [];
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnTimer = 0;
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

  toggleBossKey() {
    this.bossMode = !this.bossMode;
    const overlay = this.win.body.querySelector('#chairs-boss-screen');
    if (overlay) overlay.style.display = this.bossMode ? 'flex' : 'none';

    if (this.win && this.win.element) {
      const titleTextEl = this.win.element.querySelector('.win-titlebar-title');
      const iconEl = this.win.element.querySelector('.win-titlebar-icon');
      if (this.bossMode) {
        if (titleTextEl) titleTextEl.textContent = 'Microslop Excel - Отчёт_3_квартал_1998.xls';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['excel'] || '';
      } else {
        if (titleTextEl) titleTextEl.textContent = 'Гонки на креслах 98 (Chair GP)';
        if (iconEl && window.Icons) iconEl.innerHTML = window.Icons['game-manager'] || '';
      }
    }
    if (window.appClippy && window.appClippy.onOfficeGameEvent) {
      window.appClippy.onOfficeGameEvent('chairs', this.bossMode ? 'boss_on' : 'boss_off');
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

    if (this.gameState === 'ready') {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        this.gameState = 'playing';
      }
      return;
    }

    if (this.gameState === 'gameover') {
      if (e.key === ' ' || e.code === 'Space') {
        this.restartGame();
      }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = true;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.keys.up = true;
      if (this.player.speed < this.player.maxSpeed) {
        this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 0.45);
        this.sndPush();
      }
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.keys.down = true;
    }
  }

  onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = false;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ' || e.code === 'Space') {
      this.keys.up = false;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.keys.down = false;
    }
  }

  spawnEntity() {
    const isPickup = Math.random() < 0.35;
    const x = this.roadLeft + 15 + Math.random() * (this.roadRight - this.roadLeft - 30);

    if (isPickup) {
      const types = ['coffee', 'binder', 'floppy'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.items.push({
        x,
        y: -30,
        w: 16,
        h: 16,
        type: chosen,
        points: chosen === 'binder' ? 250 : (chosen === 'coffee' ? 150 : 100)
      });
    } else {
      const types = ['cart', 'cone', 'puddle', 'papers'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      let w = 22;
      let h = 22;
      if (chosen === 'cart') { w = 26; h = 32; }
      if (chosen === 'puddle') { w = 32; h = 18; }
      if (chosen === 'papers') { w = 24; h = 20; }
      this.obstacles.push({
        x,
        y: -40,
        w,
        h,
        type: chosen
      });
    }
  }

  updateSimulation() {
    const p = this.player;

    if (p.boostTimer > 0) {
      p.boostTimer--;
      p.speed = 5.0;
    } else {
      if (this.keys.down) {
        p.speed = Math.max(1.2, p.speed - 0.1);
      } else if (!this.keys.up && p.speed > 2.0) {
        p.speed = Math.max(2.0, p.speed - 0.02);
      }
    }

    if (p.spinTimer > 0) {
      p.spinTimer--;
      p.vx = Math.sin(p.spinTimer * 0.25) * 2.4;
    } else {
      if (this.keys.left) p.vx = -2.5;
      else if (this.keys.right) p.vx = 2.5;
      else p.vx *= 0.6;
    }

    p.x += p.vx;

    if (p.x < this.roadLeft + 12) {
      p.x = this.roadLeft + 12;
      p.vx = 0;
    }
    if (p.x > this.roadRight - 12) {
      p.x = this.roadRight - 12;
      p.vx = 0;
    }

    this.scrollY = (this.scrollY + p.speed) % 40;
    this.distance += p.speed * 0.05;
    this.score += Math.floor(p.speed * 0.2);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += p.speed;

      if (
        p.x + p.w / 2 > obs.x &&
        p.x - p.w / 2 < obs.x + obs.w &&
        p.y + p.h / 2 > obs.y &&
        p.y - p.h / 2 < obs.y + obs.h
      ) {
        this.hitObstacle(obs, i);
      } else if (obs.y > 380) {
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += p.speed;

      if (
        p.x + p.w / 2 > it.x &&
        p.x - p.w / 2 < it.x + it.w &&
        p.y + p.h / 2 > it.y &&
        p.y - p.h / 2 < it.y + it.h
      ) {
        this.collectItem(it, i);
      } else if (it.y > 380) {
        this.items.splice(i, 1);
      }
    }

    this.spawnTimer++;
    if (this.spawnTimer >= 78) {
      this.spawnEntity();
      this.spawnTimer = 0;
    }

    this.updateHUD();
  }

  hitObstacle(obs, index) {
    if (obs.type === 'puddle' || obs.type === 'papers') {
      this.player.spinTimer = 32;
      this.player.speed = Math.max(1.5, this.player.speed - 1.2);
      this.createFloatingText('ЗАНОС!', this.player.x, this.player.y - 14, '#00ffff');
      this.createSparks(this.player.x, this.player.y, '#ffffff');
      this.obstacles.splice(index, 1);
    } else {
      this.sndCrash();
      this.lives--;
      this.player.speed = 1.8;
      this.player.boostTimer = 0;
      this.createSparks(this.player.x, this.player.y, '#ff3333');
      this.createFloatingText('-1 ЖИЗНЬ!', this.player.x, this.player.y - 14, '#ff3333');
      this.obstacles.splice(index, 1);

      if (this.lives <= 0) {
        this.gameState = 'gameover';
        this.sndOver();
        this.saveHighScore();
      }
    }
  }

  collectItem(it, index) {
    this.sndBonus();
    this.score += it.points;
    this.createSparks(it.x + 8, it.y + 8, '#ffff00');

    if (it.type === 'coffee') {
      this.player.boostTimer = 210;
      this.createFloatingText('ТУРБО-КОФЕ!', this.player.x, this.player.y - 14, '#00ff88');
    } else {
      this.createFloatingText(`+${it.points}`, this.player.x, this.player.y - 14, '#ffff00');
    }

    this.items.splice(index, 1);
    this.saveHighScore();
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.8 + Math.random() * 1.5;
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
      life: 38,
      color
    });
  }

  updateHUD() {
    if (!this.win || !this.win.body) return;
    const livesEl = this.win.body.querySelector('#chairs-lives');
    const scoreEl = this.win.body.querySelector('#chairs-score');
    const highEl = this.win.body.querySelector('#chairs-high');
    const speedEl = this.win.body.querySelector('#chairs-status-speed');

    if (livesEl) livesEl.textContent = this.lives;
    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;

    const kmh = Math.floor(this.player.speed * 7);
    if (speedEl) speedEl.textContent = `${kmh} км/ч (${Math.floor(this.distance)}м)`;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#404a58';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#2c3340';
    ctx.fillRect(0, 0, this.roadLeft, 360);
    ctx.fillRect(this.roadRight, 0, 360 - this.roadRight, 360);

    ctx.fillStyle = '#222832';
    for (let y = -40 + this.scrollY; y < 360; y += 70) {
      ctx.fillRect(4, y, 32, 45);
      ctx.fillRect(this.roadRight + 4, y, 32, 45);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.roadLeft, 0); ctx.lineTo(this.roadLeft, 360);
    ctx.moveTo(this.roadRight, 0); ctx.lineTo(this.roadRight, 360);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let y = -40 + this.scrollY; y < 360; y += 30) {
      ctx.beginPath();
      ctx.moveTo(this.roadLeft, y);
      ctx.lineTo(this.roadRight, y);
      ctx.stroke();
    }

    this.obstacles.forEach(obs => {
      if (obs.type === 'cone') {
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + 4, obs.y + obs.h - 6, obs.w - 8, 3);
      } else if (obs.type === 'puddle') {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'cart') {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#374151';
        ctx.fillRect(obs.x + 2, obs.y + 4, obs.w - 4, obs.h - 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(obs.x + 4, obs.y + 6, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + obs.w - 6, obs.y - 4, 3, 20);
      } else if (obs.type === 'papers') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    this.items.forEach(it => {
      if (it.type === 'coffee') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x, it.y + 2, 12, 12);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(it.x + 2, it.y + 3, 8, 3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(it.x + 12, it.y + 4, 3, 6);
      } else if (it.type === 'binder') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(it.x, it.y, 14, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x + 2, it.y + 4, 10, 4);
      } else if (it.type === 'floppy') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(it.x, it.y, 14, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x + 2, it.y + 2, 10, 5);
      }
    });

    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.spinTimer > 0) {
      ctx.rotate(p.spinTimer * 0.25);
    }

    ctx.fillStyle = '#111827';
    ctx.fillRect(-12, -14, 24, 6);
    ctx.fillRect(-10, -8, 20, 16);

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 8); ctx.lineTo(-14, 14);
    ctx.moveTo(10, 8); ctx.lineTo(14, 14);
    ctx.moveTo(0, 8); ctx.lineTo(0, 16);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-1, 0); ctx.lineTo(1, 0); ctx.lineTo(2, 8); ctx.lineTo(-2, 8);
    ctx.closePath();
    ctx.fill();

    if (p.boostTimer > 0) {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

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

    if (this.gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.75)';
      ctx.fillRect(50, 110, 260, 95);
      ctx.strokeStyle = '#ffff00';
      ctx.strokeRect(50, 110, 260, 95);

      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('ГОНКИ НА КРЕСЛАХ 98', 180, 140);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText('Стрелки — руление и толчки ногами', 180, 165);
      ctx.fillText('Нажмите ПРОБЕЛ для старта', 180, 185);
      ctx.textAlign = 'left';
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(60, 0, 0, 0.85)';
      ctx.fillRect(50, 110, 260, 95);
      ctx.strokeStyle = '#ff3333';
      ctx.strokeRect(50, 110, 260, 95);

      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 16px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('АВАРИЯ В КОРИДОРЕ!', 180, 140);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Tahoma';
      ctx.fillText(`Дистанция: ${Math.floor(this.distance)}м, Счет: ${this.score}`, 180, 165);
      ctx.fillText('Нажмите ПРОБЕЛ для рестарта', 180, 185);
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
      this.updateSimulation();
    }

    this.draw();
  }
}

window.appOgChairs = new AppOgChairs();
