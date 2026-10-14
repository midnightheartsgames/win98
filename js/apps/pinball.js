/**
 * 3D Pinball for Win - Space Cadet (Win 98)
 * Table is simulated in flat table space (420x720) and rendered with a
 * perspective warp to mimic the angled pre-rendered look of the original.
 * Features: plunger lane with one-way gate, orbit loop, launch ramp,
 * attack bumpers, re-entry lanes, drop & mission targets, missions and
 * ranks, hyperspace lights, ball save (Re-Deploy), table nudge and tilt.
 */
(() => {
  const W = 420;
  const H = 720;
  const R = 8;
  const STEP = 1 / 480;
  const GRAVITY = 760;
  const MAX_SPEED = 2000;

  // Screen projection (canvas 400x470)
  const SW = 400;
  const SH = 470;
  const PERSP = 0.32;
  const SX = 392 / W;
  const HS = 462;
  const OY = 4;
  const SCX = SW / 2;

  const LEFT_PIVOT = { x: 136, y: 628 };
  const RIGHT_PIVOT = { x: 264, y: 628 };
  const FLIPPER_LEN = 55;
  const FLIP_REST = 0.52;
  const FLIP_UP = -0.42;

  const PLUNGER_REST = { x: 397, y: 668 };
  const RING = { x: 200, y: 432, r: 44, lights: 16 };
  const LANE_X = [160, 200, 240];

  const RANKS = ['Cadet', 'Ensign', 'Lieutenant', 'Captain', 'Lt Commander',
    'Commander', 'Commodore', 'Admiral', 'Fleet Admiral'];

  const MISSIONS = [
    { name: 'Target Practice', goal: 'Hit Attack Bumpers', need: 8, ev: 'bumper' },
    { name: 'Launch Training', goal: 'Shoot Launch Ramp', need: 3, ev: 'ramp' },
    { name: 'Re-Entry Training', goal: 'Pass Re-Entry Lanes', need: 3, ev: 'lane' },
    { name: 'Science', goal: 'Hit Drop Targets', need: 6, ev: 'drop' },
    { name: 'Orbit Recon', goal: 'Make Orbit Shots', need: 2, ev: 'orbit' }
  ];

  // Launch ramp path (elevated), from the mouth to the left inlane
  const RAMP_PATH = [
    [118, 372], [118, 300], [112, 240], [98, 200], [76, 176], [50, 174],
    [34, 196], [30, 250], [30, 330], [34, 400], [46, 450], [58, 486]
  ];

  const SCORES_KEY = 'win98_pinball_scores';
  const LEGACY_KEY = 'win98_pinball_highscore';

  const proj = (x, y) => {
    const t = y / H;
    const d = 1 + PERSP * (1 - t);
    const s = SX / d;
    return { x: SCX + (x - W / 2) * s, y: OY + (t / d) * HS, s };
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const mulberry = (seed) => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  class AppPinball {
    constructor() {
      this.win = null;
      this.animId = null;
      this.soundOn = true;
      this.scores = this.loadScores();
      this.buildTable();
      this.resetGameState();
    }

    // ---------------------------------------------------------------- table

    buildTable() {
      this.walls = [];
      const seg = (ax, ay, bx, by, o = {}) => {
        const s = { ax, ay, bx, by, e: 0.45, kick: 0, active: true, ...o };
        this.walls.push(s);
        return s;
      };
      const poly = (pts, o) => {
        for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o);
      };
      const unit = (x, y) => { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; };

      // Outer top arc
      const arc = [];
      for (let i = 0; i <= 56; i++) {
        const a = Math.PI + (i / 56) * Math.PI;
        arc.push([215 + Math.cos(a) * 197, 200 + Math.sin(a) * 197]);
      }
      poly(arc, { e: 0.25, rail: true, drag: 0.9993 });
      seg(18, 200, 18, 760, { rail: true });
      seg(412, 200, 412, 760, { rail: true });
      seg(382, 252, 382, 760);
      // One-way gate at the top of the plunger lane
      seg(382, 252, 412, 224, { oneWay: unit(-28, -30), gate: true });

      // Orbit lane inner walls
      seg(62, 185, 62, 202);
      this.missionTargets = [204, 234, 264].map((y, i) =>
        seg(62, y, 62, y + 24, { e: 0.35, target: 'mission', idx: i, lit: false, side: 1 }));
      seg(62, 290, 62, 300);
      seg(338, 185, 338, 395);
      this.dropTargets = [300, 328, 356].map((y, i) =>
        seg(331, y, 331, y + 22, { e: 0.35, target: 'drop', idx: i }));

      // One-way deflectors guiding balls falling out of the orbit lanes
      seg(18, 330, 60, 380, { oneWay: unit(50, -42), deflector: true });
      seg(382, 330, 360, 356, { oneWay: unit(-26, -22), deflector: true });

      // Re-entry lane posts
      [140, 180, 220, 260].forEach(x => seg(x, 78, x, 116, { post: true }));

      // Launch ramp mouth
      seg(92, 340, 92, 395, { ramp: true });
      seg(144, 340, 144, 395, { ramp: true });
      seg(92, 340, 144, 340, { ramp: true });

      // Slingshots
      this.slings = [
        { pts: [[72, 490], [72, 562], [112, 588]], hit: 0 },
        { pts: [[328, 490], [328, 562], [288, 588]], hit: 0 }
      ];
      this.slings.forEach((sl, i) => {
        const [a, b, c] = sl.pts;
        seg(a[0], a[1], b[0], b[1], { e: 0.4 });
        seg(b[0], b[1], c[0], c[1], { e: 0.4 });
        seg(a[0], a[1], c[0], c[1], { e: 0.3, kick: 430, sling: i });
      });

      // Inlane / outlane guides
      poly([[44, 430], [44, 575], [124, 621]], { e: 0.3 });
      poly([[368, 398], [356, 430], [356, 575], [276, 621]], { e: 0.3 });

      this.bumpers = [
        { x: 160, y: 190, r: 20, hit: 0 },
        { x: 240, y: 190, r: 20, hit: 0 },
        { x: 200, y: 246, r: 20, hit: 0 }
      ];

      this.flippers = [
        { p: LEFT_PIVOT, left: true, angle: FLIP_REST, omega: 0, active: false },
        { p: RIGHT_PIVOT, left: false, angle: Math.PI - FLIP_REST, omega: 0, active: false }
      ];

      // Ramp path cumulative lengths
      this.rampLen = [0];
      for (let i = 1; i < RAMP_PATH.length; i++) {
        const [ax, ay] = RAMP_PATH[i - 1];
        const [bx, by] = RAMP_PATH[i];
        this.rampLen.push(this.rampLen[i - 1] + Math.hypot(bx - ax, by - ay));
      }
    }

    resetGameState() {
      this.state = 'ready';
      this.paused = false;
      this.score = 0;
      this.ballNumber = 1;
      this.maxBalls = 3;
      this.extraBalls = 0;
      this.rank = 0;
      this.mission = null;
      this.missionIndex = 0;
      this.lanes = [false, false, false];
      this.bumperLevel = 1;
      this.ringLights = 0;
      this.tiltMeter = 0;
      this.tilted = false;
      this.redeployArmed = false;
      this.ballSaveUntil = 0;
      this.bonusEvents = 0;
      this.time = 0;
      this.plungerPower = 0;
      this.charging = false;
      this.stuckTime = 0;
      this.msgQueue = [];
      this.msg = null;
      this.flash = {};
      this.missionTargets.forEach(t => { t.lit = false; });
      this.dropTargets.forEach(t => { t.active = true; });
      this.flippers.forEach(f => { f.active = false; f.omega = 0; f.angle = f.left ? FLIP_REST : Math.PI - FLIP_REST; });
      this.ball = { x: PLUNGER_REST.x, y: PLUNGER_REST.y, vx: 0, vy: 0, inPlunger: true, ramp: null, px: 0, py: 0 };
    }

    // ------------------------------------------------------------ window/UI

    open() {
      const winId = 'app_pinball';
      if (window.winManager && window.winManager.windows.has(winId)) {
        window.winManager.bringToTop(winId);
        return;
      }

      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

      const content = document.createElement('div');
      content.className = 'pinball-window';
      content.innerHTML = `
        <div class="win-menubar pinball-menubar">
          <div class="win-menu-item">
            ${t('pinball.menuGame')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-new-pinball">${t('pinball.menuNew')} <span>F2</span></div>
              <div class="win-dropdown-option opt-launch-pinball">${t('pinball.menuLaunch')}</div>
              <div class="win-dropdown-option opt-pause-pinball">${t('pinball.menuPause')} <span>F3</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option opt-high-scores">${t('pinball.menuHighScores')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option opt-exit-pinball">${t('pinball.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('pinball.menuOptions')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-sound-pinball">${t('pinball.menuSounds')}</div>
              <div class="win-dropdown-option opt-controls-pinball">${t('pinball.menuControls')} <span>F8</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('pinball.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-howto-pinball">${t('pinball.menuHowTo')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option opt-pinball-about">${t('pinball.menuAbout')}</div>
            </div>
          </div>
        </div>

        <div class="pinball-container">
          <canvas class="pinball-canvas" id="pinball-canvas" width="${SW}" height="${SH}"></canvas>
          <div class="sc-panel">
            <div class="sc-frame sc-logo-frame">
              <canvas class="sc-logo" width="222" height="176"></canvas>
              <div class="sc-ball-row"><span>BALL</span><span class="sc-ball-num" id="pin-balls">1</span></div>
            </div>
            <div class="sc-score-row">
              <div class="sc-frame sc-player-num">1</div>
              <div class="sc-frame sc-score" id="pin-score">0</div>
            </div>
            <div class="sc-frame sc-player" id="pin-player">Player 1</div>
            <div class="sc-frame sc-message" id="pin-message">Awaiting<br>Deployment</div>
          </div>
        </div>
      `;

      const win = window.winManager.createWindow({
        id: winId,
        title: t('pinball.title'),
        icon: 'pinball',
        width: 664,
        height: 540,
        resizable: false,
        maximizable: false,
        content,
        onClose: () => this.destroy()
      });

      this.win = win;
      this.content = content;
      this.canvas = content.querySelector('#pinball-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.el = {
        score: content.querySelector('#pin-score'),
        balls: content.querySelector('#pin-balls'),
        player: content.querySelector('#pin-player'),
        message: content.querySelector('#pin-message')
      };
      this.lastPanel = {};

      this.buildBackground();
      this.field = document.createElement('canvas');
      this.field.width = W;
      this.field.height = H;
      this.fctx = this.field.getContext('2d');
      this.drawLogo(content.querySelector('.sc-logo'));

      this.initEvents(content);
      this.startNewGame();
    }

    destroy() {
      if (this.animId) cancelAnimationFrame(this.animId);
      this.animId = null;
      if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
      if (this.keyupHandler) window.removeEventListener('keyup', this.keyupHandler);
      this.keydownHandler = this.keyupHandler = null;
      this.win = null;
    }

    isActiveWindow() {
      const wm = window.winManager;
      if (!wm) return true;
      const w = wm.windows.get('app_pinball');
      if (w && w.isMinimized) return false;
      return wm.isTopWindow('app_pinball') || wm.windows.size <= 1;
    }

    keyAction(e) {
      switch (e.code) {
        case 'KeyZ': case 'ShiftLeft': case 'ArrowLeft': case 'KeyA': return 'left';
        case 'Slash': case 'ShiftRight': case 'ArrowRight': case 'KeyD': case 'KeyM': return 'right';
        case 'Space': case 'Enter': case 'NumpadEnter': case 'ArrowDown': case 'KeyS': return 'plunger';
        case 'KeyX': return 'nudgeLeft';
        case 'Period': return 'nudgeRight';
        case 'ArrowUp': return 'nudgeUp';
        default: break;
      }
      if (e.key === '/' || e.key === '?') return 'right';
      if (e.key === ' ' || e.key === 'Spacebar') return 'plunger';
      return null;
    }

    initEvents(content) {
      const on = (sel, fn) => content.querySelector(sel).addEventListener('click', fn);
      on('.opt-new-pinball', () => this.startNewGame());
      on('.opt-launch-pinball', () => { this.charging = false; this.plungerPower = 0.75; this.releasePlunger(); });
      on('.opt-pause-pinball', () => this.togglePause());
      on('.opt-high-scores', () => this.showHighScores());
      on('.opt-exit-pinball', () => window.winManager.closeWindow('app_pinball'));
      on('.opt-sound-pinball', (e) => {
        this.soundOn = !this.soundOn;
        const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
        e.currentTarget.textContent = (this.soundOn ? '✓ ' : '    ') + (isRu ? 'Звуки' : 'Sounds');
      });
      on('.opt-controls-pinball', () => this.showControls());
      on('.opt-howto-pinball', () => this.showHowTo());
      on('.opt-pinball-about', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        window.winManager.openDialog({
          title: t('pinball.aboutTitle'),
          icon: 'pinball',
          message: t('pinball.aboutText')
        });
      });

      this.keydownHandler = (e) => {
        if (!this.win || !this.isActiveWindow()) return;
        if (e.key === 'F2') { e.preventDefault(); this.startNewGame(); return; }
        if (e.key === 'F3') { e.preventDefault(); this.togglePause(); return; }
        if (e.key === 'F8') { e.preventDefault(); this.showControls(); return; }
        const act = this.keyAction(e);
        if (!act) return;
        e.preventDefault();
        if (e.repeat) return;
        if (this.paused && act !== 'plunger') return;
        if (act === 'left') this.setFlipper(0, true);
        else if (act === 'right') this.setFlipper(1, true);
        else if (act === 'plunger') {
          if (this.paused) { this.togglePause(); return; }
          if (this.state === 'over') { this.startNewGame(); return; }
          this.charging = true;
        } else if (act === 'nudgeLeft') this.nudge(1, 0);
        else if (act === 'nudgeRight') this.nudge(-1, 0);
        else if (act === 'nudgeUp') this.nudge(0, -1);
      };

      this.keyupHandler = (e) => {
        if (!this.win) return;
        const act = this.keyAction(e);
        if (act === 'left') this.setFlipper(0, false);
        else if (act === 'right') this.setFlipper(1, false);
        else if (act === 'plunger' && this.charging) {
          this.charging = false;
          this.releasePlunger();
        }
      };

      window.addEventListener('keydown', this.keydownHandler);
      window.addEventListener('keyup', this.keyupHandler);

      // Mouse / touch: left half = left flipper, right half = right flipper,
      // plunger lane (or any click while the ball waits) = plunger.
      let pointerAct = null;
      this.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (window.winManager) window.winManager.bringToTop('app_pinball');
        if (this.state === 'over') { this.startNewGame(); return; }
        if (this.paused) { this.togglePause(); return; }
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (SW / rect.width);
        if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(e.pointerId);
        if (this.ball.inPlunger && (x > SW * 0.78 || this.state === 'ready')) {
          pointerAct = 'plunger';
          this.charging = true;
        } else if (x < SW / 2) {
          pointerAct = 'left';
          this.setFlipper(0, true);
        } else {
          pointerAct = 'right';
          this.setFlipper(1, true);
        }
      });
      const release = () => {
        if (pointerAct === 'plunger' && this.charging) {
          this.charging = false;
          this.plungerPower = Math.max(this.plungerPower, 0.55);
          this.releasePlunger();
        } else if (pointerAct === 'left') this.setFlipper(0, false);
        else if (pointerAct === 'right') this.setFlipper(1, false);
        pointerAct = null;
      };
      this.canvas.addEventListener('pointerup', release);
      this.canvas.addEventListener('pointercancel', release);
    }

    showControls() {
      const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
      window.winManager.openDialog({
        title: isRu ? 'Управление игроком' : 'Player Controls',
        icon: 'pinball',
        message: isRu ? `<table style="font-size:12px;border-spacing:10px 2px;">
          <tr><td>Левый флиппер</td><td><b>Z</b>, Left Shift, ←</td></tr>
          <tr><td>Правый флиппер</td><td><b>/</b>, Right Shift, →</td></tr>
          <tr><td>Толкнуть стол влево</td><td><b>X</b></td></tr>
          <tr><td>Толкнуть стол вправо</td><td><b>.</b></td></tr>
          <tr><td>Толкнуть стол вверх</td><td><b>↑</b></td></tr>
          <tr><td>Пружина (удерживать)</td><td><b>Пробел</b>, Enter, ↓</td></tr>
          <tr><td>Новая игра / Пауза</td><td><b>F2</b> / <b>F3</b></td></tr>
        </table>Мышь: левая/правая половина стола — флипперы.` : `<table style="font-size:12px;border-spacing:10px 2px;">
          <tr><td>Left Flipper</td><td><b>Z</b>, Left Shift, ←</td></tr>
          <tr><td>Right Flipper</td><td><b>/</b>, Right Shift, →</td></tr>
          <tr><td>Nudge Left</td><td><b>X</b></td></tr>
          <tr><td>Nudge Right</td><td><b>.</b></td></tr>
          <tr><td>Nudge Up</td><td><b>↑</b></td></tr>
          <tr><td>Plunger (hold)</td><td><b>Space</b>, Enter, ↓</td></tr>
          <tr><td>New Game / Pause</td><td><b>F2</b> / <b>F3</b></td></tr>
        </table>Mouse: left/right half of table — flippers.`
      });
    }

    showHowTo() {
      const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
      window.winManager.openDialog({
        title: isRu ? 'Как играть' : 'How to Play',
        icon: 'pinball',
        message: isRu ? `Попадите во все три <b>мишени миссий</b> (слева), чтобы принять миссию.<br>
          Выполненная миссия приносит очки и повышение в звании.<br><br>
          • Три дорожки <b>Re-Entry</b> наверху усиливают бамперы атаки.<br>
          • <b>Launch Ramp</b> зажигает огни гиперпространства — полный круг даёт Extra Ball.<br>
          • Сбейте все <b>Drop Targets</b>, чтобы включить Re-Deploy (спасение шара).<br>
          • Не трясите стол слишком сильно — <b>TILT</b>!` : `Hit all three <b>Mission Targets</b> (on the left) to accept a mission.<br>
          Completing a mission awards points and increases your rank.<br><br>
          • Three <b>Re-Entry Lanes</b> at the top power up the Attack Bumpers.<br>
          • <b>Launch Ramp</b> advances Hyperspace lights — a full circle awards Extra Ball.<br>
          • Drop all <b>Drop Targets</b> to activate Re-Deploy (Ball Save).<br>
          • Don't nudge the table too hard — <b>TILT</b>!`
      });
    }

    showHighScores() {
      const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
      const rows = this.scores.length
        ? this.scores.map((s, i) => `<tr><td>${i + 1}.</td><td style="text-align:right;"><b>${s.score}</b></td><td>${s.rank || ''}</td></tr>`).join('')
        : (isRu ? '<tr><td>Рекордов пока нет</td></tr>' : '<tr><td>No high scores yet</td></tr>');
      window.winManager.openDialog({
        title: isRu ? 'Рекорды' : 'High Scores',
        icon: 'pinball',
        message: `<table style="font-size:12px;border-spacing:12px 2px;">${rows}</table>`
      });
    }

    loadScores() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]'); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      if (!list.length) {
        const legacy = parseInt(localStorage.getItem(LEGACY_KEY) || '0', 10);
        if (legacy > 0) list.push({ score: legacy, rank: 'Cadet' });
      }
      return list.slice(0, 5);
    }

    saveScore() {
      if (this.score <= 0) return false;
      const entry = { score: this.score, rank: RANKS[this.rank] };
      this.scores.push(entry);
      this.scores.sort((a, b) => b.score - a.score);
      this.scores = this.scores.slice(0, 5);
      try {
        localStorage.setItem(SCORES_KEY, JSON.stringify(this.scores));
        localStorage.setItem(LEGACY_KEY, String(this.scores[0].score));
      } catch (e) { /* storage unavailable */ }
      return this.scores.includes(entry);
    }

    // ----------------------------------------------------------- game flow

    startNewGame() {
      this.resetGameState();
      this.sfx('start');
      this.updatePanel(true);
      if (this.animId) cancelAnimationFrame(this.animId);
      this.lastFrame = performance.now();
      this.loop();
    }

    togglePause() {
      if (this.state === 'over') return;
      this.paused = !this.paused;
      this.flippers.forEach(f => { f.active = false; });
      this.charging = false;
      this.updatePanel(true);
    }

    setFlipper(i, active) {
      const f = this.flippers[i];
      if (active && (this.tilted || this.state === 'over' || this.paused)) return;
      if (active && !f.active) {
        this.sfx('flipper');
        // Lane change: flippers rotate the re-entry lane lights
        if (i === 0) this.lanes.push(this.lanes.shift());
        else this.lanes.unshift(this.lanes.pop());
      }
      f.active = active;
    }

    releasePlunger() {
      const b = this.ball;
      if (b.inPlunger && this.state !== 'over' && !this.paused) {
        const power = clamp(this.plungerPower, 0, 1);
        b.vy = -(960 + power * 360);
        b.vx = 0;
        b.inPlunger = false;
        if (this.state === 'ready') {
          this.state = 'play';
          this.ballSaveUntil = this.time + 8;
          this.showMessage('Launch', 1.2);
        }
        this.sfx('plunger');
      }
      this.plungerPower = 0;
    }

    nudge(dx, dy) {
      if (this.state !== 'play' || this.tilted || this.paused) return;
      const b = this.ball;
      if (!b.inPlunger && !b.ramp) {
        b.vx += dx * 110 + (Math.random() - 0.5) * 30;
        b.vy += dy * 140;
      }
      this.shake = { x: -dx * 3, y: -dy * 3, t: 0.12 };
      this.tiltMeter += 1;
      this.sfx('nudge');
      if (this.tiltMeter > 3.2) {
        this.tilted = true;
        this.flippers.forEach(f => { f.active = false; });
        this.showMessage('TILT!', 3);
        this.sfx('tilt');
      } else if (this.tiltMeter > 2.2) {
        this.showMessage('Danger', 1.2);
      }
    }

    addScore(pts) {
      if (this.tilted) return;
      this.score += pts;
    }

    showMessage(text, dur = 2.2) {
      this.msgQueue.push({ text, dur });
      if (this.msgQueue.length > 4) this.msgQueue.shift();
    }

    missionEvent(ev, n = 1) {
      this.bonusEvents += n;
      const m = this.mission;
      if (!m || m.def.ev !== ev || this.tilted) return;
      m.count += n;
      if (m.count >= m.def.need) {
        const pts = 20000 * (this.rank + 1);
        this.addScore(pts);
        this.showMessage('Mission Completed\n' + pts, 2.5);
        this.mission = null;
        this.missionIndex = (this.missionIndex + 1) % MISSIONS.length;
        if (this.rank < RANKS.length - 1) {
          this.rank++;
          this.showMessage('Promotion to\n' + RANKS[this.rank], 2.5);
        }
        this.sfx('mission');
      }
    }

    loseBall() {
      const b = this.ball;
      if (this.time < this.ballSaveUntil && !this.tilted) {
        this.ballSaveUntil = 0;
        this.showMessage('Re-Deploy', 2);
        this.sfx('redeploy');
        this.resetBallToPlunger(true);
        return;
      }
      if (this.redeployArmed && !this.tilted) {
        this.redeployArmed = false;
        this.showMessage('Re-Deploy', 2);
        this.sfx('redeploy');
        this.resetBallToPlunger(true);
        return;
      }
      b.lost = true;
      this.state = 'drain';
      this.drainTimer = 1.8;
      const bonus = this.tilted ? 0 : this.bonusEvents * 250 * (this.rank + 1);
      if (bonus) {
        this.addScore(bonus);
        this.showMessage('Bonus\n' + bonus, 1.8);
      }
      this.sfx('drain');
    }

    resetBallToPlunger(saved) {
      const b = this.ball;
      Object.assign(b, { x: PLUNGER_REST.x, y: PLUNGER_REST.y, vx: 0, vy: 0, inPlunger: true, ramp: null, lost: false });
      this.stuckTime = 0;
      if (saved) {
        // Saved ball is re-launched automatically
        this.plungerPower = 0.7;
        setTimeout(() => { if (this.ball.inPlunger && this.state === 'play') this.releasePlunger(); }, 700);
      }
    }

    nextBall() {
      this.tilted = false;
      this.tiltMeter = 0;
      this.bonusEvents = 0;
      if (this.extraBalls > 0) {
        this.extraBalls--;
        this.showMessage('Shoot Again', 2);
      } else {
        this.ballNumber++;
      }
      if (this.ballNumber > this.maxBalls) {
        this.ballNumber = this.maxBalls;
        this.state = 'over';
        this.flippers.forEach(f => { f.active = false; });
        const high = this.saveScore();
        this.msgQueue = [];
        this.showMessage('Game Over', 3);
        if (high) this.showMessage('New High Score\n' + this.score, 3.5);
        this.sfx('gameover');
      } else {
        this.state = 'ready';
        this.resetBallToPlunger(false);
      }
    }

    // ---------------------------------------------------------------- loop

    loop() {
      if (!this.win) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;

      if (!this.paused && this.isActiveWindow()) {
        this.update(dt);
      } else if (!this.isActiveWindow()) {
        this.flippers.forEach(f => { f.active = false; });
        this.charging = false;
      }
      this.draw();
      this.updatePanel();
      this.animId = requestAnimationFrame(() => this.loop());
    }

    update(dt) {
      this.time += dt;
      this.tiltMeter = Math.max(0, this.tiltMeter - dt * 0.7);
      if (this.shake) {
        this.shake.t -= dt;
        if (this.shake.t <= 0) this.shake = null;
      }

      // Message queue
      if (this.msg) {
        this.msg.left -= dt;
        if (this.msg.left <= 0) this.msg = null;
      }
      if (!this.msg && this.msgQueue.length) {
        const m = this.msgQueue.shift();
        this.msg = { text: m.text, left: m.dur };
      }

      if (this.charging && this.ball.inPlunger) {
        this.plungerPower = Math.min(1, this.plungerPower + dt * 1.1);
      }

      if (this.state === 'drain') {
        this.drainTimer -= dt;
        this.updateFlippers(dt);
        if (this.drainTimer <= 0) this.nextBall();
        return;
      }

      const steps = Math.max(1, Math.round(dt / STEP));
      for (let i = 0; i < steps && this.state !== 'drain'; i++) this.step(STEP);
    }

    updateFlippers(dt) {
      this.flippers.forEach(f => {
        const rest = f.left ? FLIP_REST : Math.PI - FLIP_REST;
        const up = f.left ? FLIP_UP : Math.PI - FLIP_UP;
        const target = f.active ? up : rest;
        const speed = f.active ? 26 : 14;
        const diff = target - f.angle;
        const move = clamp(diff, -speed * dt, speed * dt);
        f.angle += move;
        f.omega = move / dt;
      });
    }

    step(dt) {
      this.updateFlippers(dt);
      const b = this.ball;
      if (b.inPlunger || b.lost) return;

      if (b.ramp) {
        this.stepRamp(dt);
        return;
      }

      b.px = b.x;
      b.py = b.y;
      b.vy += GRAVITY * dt;
      const damp = 1 - 0.12 * dt;
      b.vx *= damp;
      b.vy *= damp;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPEED) {
        b.vx *= MAX_SPEED / sp;
        b.vy *= MAX_SPEED / sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Plunger lane floor
      if (b.x > 382 && b.y > PLUNGER_REST.y) {
        b.y = PLUNGER_REST.y;
        if (Math.abs(b.vy) < 90) {
          b.vy = 0;
          b.vx = 0;
          b.x = PLUNGER_REST.x;
          b.inPlunger = true;
          return;
        }
        b.vy = -Math.abs(b.vy) * 0.3;
      }

      // Launch ramp mouth
      if (b.x > 98 && b.x < 138 && b.y < 372 && b.y > 340 && b.vy < -220) {
        b.ramp = { dist: 0, speed: clamp(-b.vy, 500, 800) };
        this.addScore(5000 * Math.max(1, Math.floor(this.ringLights / 4) + 1));
        this.ringLights = Math.min(RING.lights, this.ringLights + 4);
        this.flash.ramp = this.time;
        this.showMessage('Launch Ramp', 1.4);
        this.sfx('ramp');
        this.missionEvent('ramp');
        if (this.ringLights >= RING.lights) {
          this.ringLights = 0;
          this.extraBalls++;
          this.addScore(50000);
          this.showMessage('Hyperspace Bonus\nExtra Ball', 2.5);
          this.sfx('mission');
        }
        return;
      }

      for (const w of this.walls) if (w.active) this.collideSegment(w);
      for (const bump of this.bumpers) this.collideBumper(bump);
      this.flippers.forEach(f => this.collideFlipper(f));
      this.checkSensors();

      // Stuck ball rescue
      if (Math.hypot(b.vx, b.vy) < 12) {
        this.stuckTime += dt;
        if (this.stuckTime > 3) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
          b.vx = Math.cos(a) * 520;
          b.vy = Math.sin(a) * 520;
          this.stuckTime = 0;
        }
      } else {
        this.stuckTime = 0;
      }

      if (b.y > H + 20 || b.x < -10 || b.x > W + 10 || b.y < -30) {
        if (b.y > H + 20 && b.x < 382) this.loseBall();
        else this.resetBallToPlunger(false);
      }
    }

    stepRamp(dt) {
      const b = this.ball;
      const r = b.ramp;
      r.dist += r.speed * dt;
      const total = this.rampLen[this.rampLen.length - 1];
      if (r.dist >= total) {
        const [ax, ay] = RAMP_PATH[RAMP_PATH.length - 2];
        const [bx, by] = RAMP_PATH[RAMP_PATH.length - 1];
        const l = Math.hypot(bx - ax, by - ay);
        b.x = bx;
        b.y = by;
        b.vx = (bx - ax) / l * 260;
        b.vy = (by - ay) / l * 260;
        b.ramp = null;
        return;
      }
      let i = 1;
      while (this.rampLen[i] < r.dist) i++;
      const t = (r.dist - this.rampLen[i - 1]) / (this.rampLen[i] - this.rampLen[i - 1]);
      b.x = RAMP_PATH[i - 1][0] + (RAMP_PATH[i][0] - RAMP_PATH[i - 1][0]) * t;
      b.y = RAMP_PATH[i - 1][1] + (RAMP_PATH[i][1] - RAMP_PATH[i - 1][1]) * t;
    }

    collideSegment(w) {
      const b = this.ball;
      const dx = w.bx - w.ax;
      const dy = w.by - w.ay;
      const l2 = dx * dx + dy * dy;
      const t = clamp(((b.x - w.ax) * dx + (b.y - w.ay) * dy) / l2, 0, 1);
      const cx = w.ax + dx * t;
      const cy = w.ay + dy * t;
      let nx = b.x - cx;
      let ny = b.y - cy;
      const dist = Math.hypot(nx, ny);
      const rad = R + 2;
      if (dist >= rad || dist === 0) return;
      if (w.oneWay && nx * w.oneWay.x + ny * w.oneWay.y <= 0) return;
      nx /= dist;
      ny /= dist;
      b.x = cx + nx * rad;
      b.y = cy + ny * rad;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= (1 + w.e) * vn * nx;
        b.vy -= (1 + w.e) * vn * ny;
        if (w.drag) {
          const vt = b.vx * -ny + b.vy * nx;
          const loss = vt * (1 - w.drag);
          b.vx -= loss * -ny;
          b.vy -= loss * nx;
        }
        if (w.kick && -vn > 60) this.hitSling(w, nx, ny);
        if (w.target && -vn > 80) this.hitTarget(w, nx);
      }
    }

    hitSling(w, nx, ny) {
      const sl = this.slings[w.sling];
      if (this.time - sl.hit < 0.08) return;
      sl.hit = this.time;
      this.ball.vx += nx * w.kick;
      this.ball.vy += ny * w.kick;
      this.addScore(100);
      this.sfx('sling');
    }

    hitTarget(w, nx) {
      if (w.target === 'drop') {
        if (nx > 0) return;
        w.active = false;
        this.addScore(750);
        this.sfx('target');
        this.missionEvent('drop');
        if (this.dropTargets.every(t => !t.active)) {
          this.addScore(5000);
          this.redeployArmed = true;
          this.showMessage('Re-Deploy\nLit', 2);
          setTimeout(() => this.dropTargets.forEach(t => { t.active = true; }), 1500);
        }
      } else if (w.target === 'mission') {
        if (nx < 0) return;
        this.addScore(1000);
        this.sfx('target');
        this.flash['m' + w.idx] = this.time;
        if (this.mission) {
          this.bonusEvents++;
          return;
        }
        w.lit = true;
        if (this.missionTargets.every(t => t.lit)) {
          const def = MISSIONS[this.missionIndex];
          this.mission = { def, count: 0 };
          this.missionTargets.forEach(t => { t.lit = false; });
          this.showMessage('Mission Accepted\n' + def.name, 2.5);
          this.showMessage(def.goal + '\n' + def.need + ' times', 2.5);
          this.sfx('accept');
        }
      }
    }

    collideBumper(bump) {
      const b = this.ball;
      let nx = b.x - bump.x;
      let ny = b.y - bump.y;
      const dist = Math.hypot(nx, ny);
      const rad = bump.r + R;
      if (dist >= rad || dist === 0) return;
      nx /= dist;
      ny /= dist;
      b.x = bump.x + nx * rad;
      b.y = bump.y + ny * rad;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 1.5 * vn * nx;
        b.vy -= 1.5 * vn * ny;
      }
      b.vx += nx * 380;
      b.vy += ny * 380;
      bump.hit = this.time;
      this.addScore(500 * this.bumperLevel);
      this.sfx('bumper');
      this.missionEvent('bumper');
    }

    collideFlipper(f) {
      const b = this.ball;
      const dirx = Math.cos(f.angle);
      const diry = Math.sin(f.angle);
      const t = clamp(((b.x - f.p.x) * dirx + (b.y - f.p.y) * diry) / FLIPPER_LEN, 0, 1);
      const cx = f.p.x + dirx * FLIPPER_LEN * t;
      const cy = f.p.y + diry * FLIPPER_LEN * t;
      let nx = b.x - cx;
      let ny = b.y - cy;
      const dist = Math.hypot(nx, ny);
      const rad = R + 9 - 4 * t;
      if (dist >= rad || dist === 0) return;
      nx /= dist;
      ny /= dist;
      b.x = cx + nx * rad;
      b.y = cy + ny * rad;
      const rx = cx - f.p.x;
      const ry = cy - f.p.y;
      const svx = -f.omega * ry;
      const svy = f.omega * rx;
      const vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
      if (vn < 0) {
        b.vx -= 1.3 * vn * nx;
        b.vy -= 1.3 * vn * ny;
      }
    }

    checkSensors() {
      const b = this.ball;
      const crossed = (y) => (b.py < y && b.y >= y) || (b.py >= y && b.y < y);

      // Re-entry lanes (top)
      if (crossed(98) && b.vy > 0) {
        LANE_X.forEach((x, i) => {
          if (Math.abs(b.x - x) < 20 && !this.lanes[i]) {
            this.lanes[i] = true;
            this.addScore(1000);
            this.sfx('lane');
            this.missionEvent('lane');
          }
        });
        if (this.lanes.every(Boolean)) {
          this.lanes = [false, false, false];
          this.addScore(5000);
          if (this.bumperLevel < 4) {
            this.bumperLevel++;
            this.showMessage('Attack Bumpers\nUpgraded', 2);
          } else {
            this.showMessage('Re-Entry\nComplete', 2);
          }
        }
      }

      // Orbit lanes (ball travelling up)
      if (crossed(262) && b.vy < 0 && ((b.x > 18 && b.x < 62) || (b.x > 338 && b.x < 382))) {
        this.addScore(2500);
        this.flash.orbit = this.time;
        this.showMessage('Orbit', 1.2);
        this.sfx('orbit');
        this.missionEvent('orbit');
      }

      // Inlanes / outlanes
      if (crossed(520) && b.vy > 0) {
        if (b.x < 44 || b.x > 356) {
          this.addScore(2000);
          this.flash.outlane = this.time;
        } else if (b.x < 72 || b.x > 328) {
          this.addScore(500);
          this.flash[b.x < 200 ? 'inL' : 'inR'] = this.time;
          this.sfx('lane');
        }
      }
    }

    // --------------------------------------------------------------- sound

    sfx(name) {
      const s = window.soundSys;
      if (!this.soundOn || !s) return;
      const tones = (notes, type, vol) => s.playPinballTones && s.playPinballTones(notes, type, vol);
      switch (name) {
        case 'flipper': if (s.playPinballFlipper) s.playPinballFlipper(); break;
        case 'bumper': if (s.playPinballBumper) s.playPinballBumper(); break;
        case 'plunger': if (s.playPinballPlunger) s.playPinballPlunger(); break;
        case 'sling': tones([{ f: 220, t: 0, d: 0.06, to: 110 }], 'square', 0.08); break;
        case 'target': tones([{ f: 1200, t: 0, d: 0.05 }, { f: 1600, t: 0.05, d: 0.07 }], 'square', 0.05); break;
        case 'lane': tones([{ f: 988, t: 0, d: 0.08 }], 'triangle', 0.1); break;
        case 'orbit': tones([{ f: 400, t: 0, d: 0.3, to: 1600 }], 'sawtooth', 0.05); break;
        case 'ramp': tones([{ f: 300, t: 0, d: 0.35, to: 1200 }, { f: 1200, t: 0.3, d: 0.2, to: 1800 }], 'square', 0.05); break;
        case 'accept': tones([{ f: 660, t: 0, d: 0.1 }, { f: 880, t: 0.1, d: 0.1 }, { f: 1320, t: 0.2, d: 0.2 }], 'square', 0.06); break;
        case 'mission': tones([{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.12, d: 0.12 }, { f: 784, t: 0.24, d: 0.12 }, { f: 1047, t: 0.36, d: 0.4 }], 'square', 0.06); break;
        case 'redeploy': tones([{ f: 880, t: 0, d: 0.15 }, { f: 660, t: 0.15, d: 0.15 }, { f: 880, t: 0.3, d: 0.2 }], 'triangle', 0.1); break;
        case 'drain': tones([{ f: 440, t: 0, d: 0.6, to: 80 }], 'sawtooth', 0.07); break;
        case 'nudge': tones([{ f: 90, t: 0, d: 0.08, to: 50 }], 'square', 0.1); break;
        case 'tilt': tones([{ f: 150, t: 0, d: 0.8 }], 'sawtooth', 0.08); break;
        case 'start': tones([{ f: 392, t: 0, d: 0.1 }, { f: 523, t: 0.1, d: 0.1 }, { f: 784, t: 0.2, d: 0.25 }], 'triangle', 0.08); break;
        case 'gameover': tones([{ f: 392, t: 0, d: 0.25 }, { f: 330, t: 0.25, d: 0.25 }, { f: 262, t: 0.5, d: 0.6 }], 'triangle', 0.1); break;
        default: break;
      }
    }

    // --------------------------------------------------------------- panel

    panelMessage() {
      if (this.paused) return 'Game Paused\nF3 to Resume';
      if (this.msg) return this.msg.text;
      if (this.state === 'over') return 'Game Over\nF2 New Game';
      if (this.state === 'ready') return 'Awaiting\nDeployment';
      if (this.tilted) return 'TILT!';
      if (this.mission) {
        const left = this.mission.def.need - this.mission.count;
        return this.mission.def.name + '\n' + left + ' remaining';
      }
      return 'Select Mission\nHit Mission Targets';
    }

    updatePanel(force) {
      if (!this.el) return;
      const set = (key, el, html) => {
        if (force || this.lastPanel[key] !== html) {
          this.lastPanel[key] = html;
          el.innerHTML = html;
        }
      };
      set('score', this.el.score, String(this.score));
      set('balls', this.el.balls, String(this.ballNumber));
      set('player', this.el.player, 'Player 1<br><span class="sc-rank">' + RANKS[this.rank] + '</span>');
      set('message', this.el.message, this.panelMessage().split('\n').join('<br>'));
    }

    // ------------------------------------------------------------- drawing

    tablePath(ctx) {
      ctx.beginPath();
      ctx.moveTo(18, H + 40);
      ctx.lineTo(18, 200);
      ctx.arc(215, 200, 197, Math.PI, Math.PI * 2);
      ctx.lineTo(412, H + 40);
      ctx.closePath();
    }

    buildBackground() {
      const bg = document.createElement('canvas');
      bg.width = W;
      bg.height = H;
      const c = bg.getContext('2d');
      const rnd = mulberry(1998);

      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);

      // Playfield base
      c.save();
      this.tablePath(c);
      c.clip();
      const g = c.createRadialGradient(200, 380, 40, 200, 380, 420);
      g.addColorStop(0, '#1f2a78');
      g.addColorStop(0.55, '#141a55');
      g.addColorStop(1, '#070a26');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);

      // Planet glows
      [[330, 120, 60, 'rgba(255,170,120,0.35)'], [360, 260, 36, 'rgba(255,140,110,0.25)'], [70, 90, 40, 'rgba(160,120,255,0.25)']]
        .forEach(([x, y, r, col]) => {
          const pg = c.createRadialGradient(x, y, 2, x, y, r);
          pg.addColorStop(0, col);
          pg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = pg;
          c.fillRect(x - r, y - r, r * 2, r * 2);
        });

      // Cracked surface lines
      c.lineCap = 'round';
      for (let k = 0; k < 46; k++) {
        let x = 20 + rnd() * 380;
        let y = 60 + rnd() * 640;
        let a = rnd() * Math.PI * 2;
        c.strokeStyle = `rgba(${90 + rnd() * 60 | 0},${120 + rnd() * 80 | 0},255,${0.18 + rnd() * 0.25})`;
        c.lineWidth = 0.6 + rnd() * 1.2;
        c.beginPath();
        c.moveTo(x, y);
        const n = 4 + (rnd() * 8 | 0);
        for (let i = 0; i < n; i++) {
          a += (rnd() - 0.5) * 1.4;
          x += Math.cos(a) * (8 + rnd() * 18);
          y += Math.sin(a) * (8 + rnd() * 18);
          c.lineTo(x, y);
        }
        c.stroke();
      }

      // Stars
      for (let i = 0; i < 140; i++) {
        c.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
        const s = rnd() < 0.1 ? 2 : 1;
        c.fillRect(20 + rnd() * 390, 10 + rnd() * 700, s, s);
      }

      // Orbit lane band along the top arc
      c.beginPath();
      c.arc(215, 200, 196, Math.PI, Math.PI * 2);
      c.arc(215, 200, 150, Math.PI * 2, Math.PI, true);
      c.closePath();
      c.fillStyle = 'rgba(120,70,40,0.35)';
      c.fill();
      c.strokeStyle = 'rgba(210,120,60,0.6)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(215, 200, 150, Math.PI * 1.08, Math.PI * 1.92);
      c.stroke();

      // Plunger lane track
      const lg = c.createLinearGradient(382, 0, 412, 0);
      lg.addColorStop(0, '#3a2412');
      lg.addColorStop(0.5, '#7a4d24');
      lg.addColorStop(1, '#3a2412');
      c.fillStyle = lg;
      c.fillRect(382, 236, 30, H);
      c.fillStyle = 'rgba(255,220,120,0.35)';
      for (let y = 300; y < 640; y += 36) {
        c.beginPath();
        c.moveTo(397, y);
        c.lineTo(390, y + 12);
        c.lineTo(404, y + 12);
        c.closePath();
        c.fill();
      }

      // Bottom purple starburst
      c.save();
      c.translate(200, 720);
      const sg = c.createRadialGradient(0, 0, 10, 0, 0, 230);
      sg.addColorStop(0, '#c070ff');
      sg.addColorStop(0.5, '#6a2cb0');
      sg.addColorStop(1, 'rgba(60,20,110,0)');
      c.fillStyle = sg;
      c.beginPath();
      const spikes = 11;
      for (let i = 0; i <= spikes * 2; i++) {
        const a = Math.PI + (i / (spikes * 2)) * Math.PI;
        const rr = i % 2 ? 70 : (i % 4 ? 170 : 230);
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
      c.restore();

      // Hyperspace ring base
      const hg = c.createRadialGradient(RING.x, RING.y, 4, RING.x, RING.y, RING.r + 14);
      hg.addColorStop(0, '#9ff4ff');
      hg.addColorStop(0.25, '#1ba6d8');
      hg.addColorStop(0.7, '#0b3a7a');
      hg.addColorStop(1, 'rgba(10,20,80,0)');
      c.fillStyle = hg;
      c.beginPath();
      c.arc(RING.x, RING.y, RING.r + 14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(160,230,255,0.4)';
      c.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        c.beginPath();
        c.moveTo(RING.x + Math.cos(a) * 14, RING.y + Math.sin(a) * 14);
        c.lineTo(RING.x + Math.cos(a) * (RING.r + 16), RING.y + Math.sin(a) * (RING.r + 16));
        c.stroke();
      }

      // Rocket decal (right side)
      c.save();
      c.translate(292, 440);
      c.rotate(-0.45);
      c.fillStyle = '#b3202a';
      c.beginPath();
      c.moveTo(0, -48); c.lineTo(14, -18); c.lineTo(14, 26); c.lineTo(-14, 26); c.lineTo(-14, -18);
      c.closePath();
      c.fill();
      c.fillStyle = '#2a3fb8';
      c.beginPath(); c.moveTo(14, 6); c.lineTo(28, 34); c.lineTo(14, 26); c.fill();
      c.beginPath(); c.moveTo(-14, 6); c.lineTo(-28, 34); c.lineTo(-14, 26); c.fill();
      c.fillStyle = '#ffd24a';
      c.beginPath(); c.moveTo(-8, 26); c.lineTo(0, 46); c.lineTo(8, 26); c.fill();
      c.fillStyle = '#9fd8ff';
      c.beginPath(); c.arc(0, -10, 6, 0, Math.PI * 2); c.fill();
      c.restore();

      // Launch ramp (purple, elevated)
      c.lineJoin = 'round';
      c.lineCap = 'round';
      const rampStroke = (w, col) => {
        c.strokeStyle = col;
        c.lineWidth = w;
        c.beginPath();
        RAMP_PATH.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
      };
      c.save();
      c.translate(4, 6);
      rampStroke(36, 'rgba(0,0,0,0.45)');
      c.restore();
      rampStroke(36, '#2a1250');
      rampStroke(30, '#8a4fd6');
      rampStroke(18, '#b27af0');
      c.setLineDash([6, 8]);
      rampStroke(12, '#6a2fb5');
      c.setLineDash([]);
      rampStroke(2, '#f0d8ff');
      // Ramp entrance with yellow chevrons
      c.fillStyle = '#ffd84a';
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(118, 352 - i * 16);
        c.lineTo(106, 362 - i * 16);
        c.lineTo(130, 362 - i * 16);
        c.closePath();
        c.fill();
      }

      // Slingshot art
      this.slings.forEach(sl => {
        const [a, bb, cc] = sl.pts;
        c.fillStyle = '#6b1216';
        c.beginPath(); c.moveTo(...a); c.lineTo(...bb); c.lineTo(...cc); c.closePath(); c.fill();
        c.strokeStyle = '#5fb8ff';
        c.lineWidth = 1.5;
        c.beginPath();
        const mx = (a[0] + bb[0] + cc[0]) / 3;
        const my = (a[1] + bb[1] + cc[1]) / 3;
        c.moveTo(mx - 3, my - 22); c.lineTo(mx + 4, my - 6); c.lineTo(mx - 4, my + 2); c.lineTo(mx + 3, my + 18);
        c.stroke();
      });

      c.restore(); // end clip

      // Walls and rails
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const drawWalls = (filter, widths) => {
        widths.forEach(([w, col]) => {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.beginPath();
          this.walls.filter(filter).forEach(s => { c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); });
          c.stroke();
        });
      };
      drawWalls(s => s.rail, [[14, '#1a1a1a'], [10, '#7d7f88'], [6, '#b9bcc7'], [2, '#e8eaf2']]);
      drawWalls(s => !s.rail && !s.target && !s.kick && !s.gate && !s.ramp,
        [[7, '#15151c'], [4, '#9aa0b4'], [1.5, '#eef0ff']]);
      drawWalls(s => s.ramp, [[6, '#2a1250'], [3, '#d4a8ff']]);
      drawWalls(s => s.gate, [[4, '#222'], [2, '#ffd84a']]);
      // Rubber on slings
      drawWalls(s => s.kick, [[6, '#e8e8e8'], [2, '#ffffff']]);
      // Red trim along the outer rail
      c.strokeStyle = '#b3202a';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(215, 200, 190, Math.PI, Math.PI * 2);
      c.stroke();

      this.bg = bg;
    }

    lamp(c, x, y, r, on, col) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      if (on) {
        const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.35, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
      } else {
        c.fillStyle = 'rgba(40,40,70,0.9)';
        c.fill();
        c.strokeStyle = 'rgba(140,140,200,0.5)';
        c.lineWidth = 1;
        c.stroke();
      }
    }

    drawField() {
      const c = this.fctx;
      const t = this.time;
      const blink = Math.floor(t * 4) % 2 === 0;
      c.drawImage(this.bg, 0, 0);

      // Re-entry lane lights
      LANE_X.forEach((x, i) => this.lamp(c, x, 64, 6, this.lanes[i], '#ffe14a'));
      // Bumper level lights
      for (let i = 0; i < 4; i++) this.lamp(c, 170 + i * 20, 136, 3.5, i < this.bumperLevel, '#ff6a3a');

      // Hyperspace ring lights
      for (let i = 0; i < RING.lights; i++) {
        const a = -Math.PI / 2 + (i / RING.lights) * Math.PI * 2;
        const on = i < this.ringLights || (this.flash.ramp && t - this.flash.ramp < 1 && blink);
        this.lamp(c, RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r, 4.5, on,
          i % 2 ? '#ff9a3a' : '#4ad8ff');
      }
      this.lamp(c, RING.x, RING.y, 5, this.mission && blink, '#ff3a3a');

      // Orbit arrows
      const orbitOn = this.flash.orbit && t - this.flash.orbit < 1.2 && blink;
      this.lamp(c, 40, 300, 4, orbitOn, '#ffe14a');
      this.lamp(c, 360, 300, 4, orbitOn, '#ffe14a');

      // Mission target lamps + targets
      this.missionTargets.forEach((m, i) => {
        const flash = this.flash['m' + i] && t - this.flash['m' + i] < 0.3;
        c.fillStyle = flash ? '#fff' : (m.lit ? '#3aff6a' : '#2fae55');
        c.fillRect(63, m.ay + 2, 8, m.by - m.ay - 4);
        c.fillStyle = 'rgba(255,255,255,0.6)';
        c.fillRect(63, m.ay + 2, 2, m.by - m.ay - 4);
        this.lamp(c, 82, (m.ay + m.by) / 2, 3.5, m.lit || (this.mission && blink), '#3aff6a');
      });

      // Drop targets
      this.dropTargets.forEach((d) => {
        if (d.active) {
          c.fillStyle = '#ffcc2a';
          c.fillRect(d.ax - 5, d.ay, 6, d.by - d.ay);
          c.fillStyle = '#fff5b0';
          c.fillRect(d.ax - 5, d.ay, 2, d.by - d.ay);
        } else {
          c.fillStyle = '#222';
          c.fillRect(d.ax - 3, d.ay + 2, 4, d.by - d.ay - 4);
        }
      });
      this.lamp(c, 314, 386, 3.5, this.redeployArmed, '#3aff6a');

      // Inlane / outlane lights
      const lit = (k, d = 0.8) => this.flash[k] && t - this.flash[k] < d;
      this.lamp(c, 58, 530, 4, lit('inL'), '#ffe14a');
      this.lamp(c, 342, 530, 4, lit('inR'), '#ffe14a');
      this.lamp(c, 31, 530, 4, lit('outlane'), '#ff3a3a');
      this.lamp(c, 369, 530, 4, lit('outlane'), '#ff3a3a');

      // Re-Deploy (ball save) lamp between flippers
      const saveOn = (this.time < this.ballSaveUntil && blink) || this.redeployArmed;
      this.lamp(c, 200, 668, 6, saveOn, '#3aff6a');

      // Bumpers
      this.bumpers.forEach(bm => {
        const lit2 = t - bm.hit < 0.12;
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.beginPath(); c.arc(bm.x + 3, bm.y + 6, bm.r + 2, 0, Math.PI * 2); c.fill();
        // Skirt / body
        c.fillStyle = '#3a3a48';
        c.beginPath(); c.arc(bm.x, bm.y + 4, bm.r, 0, Math.PI * 2); c.fill();
        // Cap with red and white segments
        for (let i = 0; i < 8; i++) {
          c.fillStyle = i % 2 ? (lit2 ? '#ffe0e0' : '#ffffff') : (lit2 ? '#ff6060' : '#d21e2a');
          c.beginPath();
          c.moveTo(bm.x, bm.y);
          c.arc(bm.x, bm.y, bm.r, (i / 8) * Math.PI * 2, ((i + 1) / 8) * Math.PI * 2);
          c.closePath();
          c.fill();
        }
        const cg = c.createRadialGradient(bm.x - 3, bm.y - 3, 1, bm.x, bm.y, bm.r * 0.55);
        cg.addColorStop(0, lit2 ? '#ffffff' : '#9ad0ff');
        cg.addColorStop(1, lit2 ? '#6ad8ff' : '#1a3f9a');
        c.fillStyle = cg;
        c.beginPath(); c.arc(bm.x, bm.y, bm.r * 0.55, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#111';
        c.lineWidth = 1;
        c.beginPath(); c.arc(bm.x, bm.y, bm.r, 0, Math.PI * 2); c.stroke();
        if (lit2) {
          const glow = c.createRadialGradient(bm.x, bm.y, bm.r, bm.x, bm.y, bm.r + 14);
          glow.addColorStop(0, 'rgba(255,240,180,0.7)');
          glow.addColorStop(1, 'rgba(255,240,180,0)');
          c.fillStyle = glow;
          c.beginPath(); c.arc(bm.x, bm.y, bm.r + 14, 0, Math.PI * 2); c.fill();
        }
      });

      // Sling flash
      this.slings.forEach(sl => {
        if (t - sl.hit < 0.1) {
          const [a, , cc] = sl.pts;
          c.strokeStyle = '#ffffa0';
          c.lineWidth = 5;
          c.beginPath(); c.moveTo(...a); c.lineTo(...cc); c.stroke();
        }
      });

      // Flippers
      this.flippers.forEach(f => this.drawFlipper(c, f));

      // Plunger
      const comp = (this.ball.inPlunger ? this.plungerPower : 0) * 34;
      const top = 678 + comp;
      c.strokeStyle = '#c9ccd6';
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i <= 10; i++) {
        const y = top + 8 + (i / 10) * (H - top - 8);
        c.lineTo(i % 2 ? 404 : 390, y);
      }
      c.stroke();
      const pg = c.createLinearGradient(386, 0, 408, 0);
      pg.addColorStop(0, '#7a1a1a');
      pg.addColorStop(0.5, '#e84040');
      pg.addColorStop(1, '#7a1a1a');
      c.fillStyle = pg;
      c.fillRect(386, top, 22, 9);
    }

    drawFlipper(c, f) {
      c.save();
      c.translate(f.p.x, f.p.y);
      c.rotate(f.angle);
      const shape = () => {
        c.beginPath();
        c.arc(0, 0, 9, Math.PI / 2, Math.PI * 1.5);
        c.lineTo(FLIPPER_LEN, -5);
        c.arc(FLIPPER_LEN, 0, 5, -Math.PI / 2, Math.PI / 2);
        c.closePath();
      };
      c.translate(2, 4);
      shape();
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fill();
      c.translate(-2, -4);
      shape();
      const g = c.createLinearGradient(0, -9, 0, 9);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#c8ccd8');
      g.addColorStop(1, '#7c8090');
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = '#d0242e';
      c.lineWidth = 2.5;
      c.stroke();
      c.fillStyle = '#555';
      c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    draw() {
      const ctx = this.ctx;
      this.drawField();

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, SW, SH);
      ctx.save();
      if (this.shake) ctx.translate(this.shake.x, this.shake.y);
      ctx.imageSmoothingEnabled = true;

      // Perspective warp: one source strip per screen row
      for (let sy = 0; sy < HS; sy++) {
        const g0 = sy / HS;
        const g1 = (sy + 1) / HS;
        const t0 = g0 * (1 + PERSP) / (1 + PERSP * g0);
        const t1 = g1 * (1 + PERSP) / (1 + PERSP * g1);
        const s = SX / (1 + PERSP * (1 - t0));
        const srcY = t0 * H;
        const srcH = Math.max(0.5, (t1 - t0) * H);
        ctx.drawImage(this.field, 0, srcY, W, srcH, SCX - (W / 2) * s, OY + sy, W * s, 1.2);
      }

      // Ball
      const b = this.ball;
      if (!b.lost) {
        const p = proj(b.x, b.y);
        const lift = b.ramp ? 7 : 0;
        const r = R * p.s * (b.ramp ? 1.12 : 1);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(p.x + 2 + lift * 0.3, p.y + 3, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        const by = p.y - lift;
        const bg = ctx.createRadialGradient(p.x - r * 0.4, by - r * 0.45, r * 0.1, p.x, by, r);
        bg.addColorStop(0, '#ffffff');
        bg.addColorStop(0.35, '#d8dce6');
        bg.addColorStop(0.8, '#6b7080');
        bg.addColorStop(1, '#2a2d38');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(p.x, by, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (this.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, SW, SH);
      }
    }

    drawLogo(cv) {
      const c = cv.getContext('2d');
      const w = cv.width;
      const h = cv.height;
      const rnd = mulberry(42);
      const ell = (x, y, rx, ry, fill, stroke, rot = 0) => {
        c.beginPath();
        c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.4; c.stroke(); }
      };

      c.fillStyle = '#000';
      c.fillRect(0, 0, w, h);
      // Twinkling cross-shaped stars
      for (let i = 0; i < 55; i++) {
        const x = rnd() * w | 0;
        const y = rnd() * h | 0;
        c.fillStyle = rnd() < 0.5 ? '#bfe8ff' : '#ffffff';
        c.fillRect(x, y, 1, 1);
        if (rnd() < 0.35) {
          c.globalAlpha = 0.5;
          c.fillRect(x - 1, y, 3, 1);
          c.fillRect(x, y - 1, 1, 3);
          c.globalAlpha = 1;
        }
      }

      // Green planet peeking from the bottom-left corner
      const pg = c.createRadialGradient(20, 150, 3, 26, 160, 28);
      pg.addColorStop(0, '#c6e86a');
      pg.addColorStop(0.55, '#6f9a2c');
      pg.addColorStop(1, '#2c4a12');
      c.fillStyle = pg;
      c.beginPath(); c.arc(26, 162, 26, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(40,70,15,0.6)';
      [[18, 152, 4], [32, 158, 3], [22, 168, 5], [38, 147, 2]].forEach(([x, y, r]) => {
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      });

      // Titles in the rounded lavender lettering
      const font = '"Arial Rounded MT Bold", "Trebuchet MS", "Verdana", sans-serif';
      c.lineJoin = 'round';
      c.font = `bold 15px ${font}`;
      c.fillStyle = '#6d58f0';
      c.fillText('3D Pinball', 60, 20);

      c.font = `bold 46px ${font}`;
      const spaceW = c.measureText('Space').width;
      c.lineWidth = 3;
      c.strokeStyle = '#5a46a8';
      c.strokeText('Space', 4, 64);
      c.fillStyle = '#b8a4ec';
      c.fillText('Space', 4, 64);

      c.save();
      c.font = `bold 24px ${font}`;
      c.translate(Math.min(spaceW + 6, 222 - c.measureText('Cadet').width - 2), 46);
      c.rotate(0.06);
      c.strokeText('Cadet', 0, 0);
      c.fillStyle = '#9d88e0';
      c.fillText('Cadet', 0, 0);
      c.restore();

      // ---- Hover car with the cadet (drawn around a local origin)
      c.save();
      c.translate(150, 106);
      c.scale(0.8, 0.8);

      // Engine flame at the back
      const fl = c.createRadialGradient(94, 2, 2, 94, 2, 22);
      fl.addColorStop(0, '#fff6a0');
      fl.addColorStop(0.4, '#ff9a1a');
      fl.addColorStop(1, 'rgba(200,30,10,0)');
      c.fillStyle = fl;
      c.beginPath();
      c.moveTo(78, -10); c.lineTo(104, -18); c.lineTo(98, -4); c.lineTo(114, 0);
      c.lineTo(98, 8); c.lineTo(106, 20); c.lineTo(78, 14);
      c.closePath();
      c.fill();
      ell(82, 2, 9, 12, '#c0301a', '#5a1208');
      ell(80, 0, 4, 5, '#ffcf40');

      // Hull pods (grey, chunky)
      const hull = c.createLinearGradient(0, -10, 0, 50);
      hull.addColorStop(0, '#e2e3ea');
      hull.addColorStop(0.5, '#a3a5b2');
      hull.addColorStop(1, '#55586a');
      ell(56, 10, 30, 22, hull, '#2e2f3a');
      ell(-58, 22, 28, 20, hull, '#2e2f3a');
      ell(-18, 36, 34, 15, '#7c7f8e', '#2e2f3a');
      ell(34, 36, 32, 14, '#7c7f8e', '#2e2f3a');
      ell(0, 18, 74, 22, hull, '#2e2f3a');
      // Panel seams and highlight
      c.strokeStyle = 'rgba(40,40,55,0.55)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(-40, 12); c.quadraticCurveTo(-30, 30, -10, 36); c.stroke();
      c.beginPath(); c.moveTo(40, 12); c.quadraticCurveTo(34, 30, 20, 38); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.ellipse(-30, 8, 22, 4, -0.1, 0, Math.PI * 2); c.fill();

      // Headlight and "2001" plate
      ell(-80, 24, 6, 7, '#ffe25a', '#6a5a10');
      ell(-80, 23, 2.5, 3, '#fffbd0');
      c.save();
      c.translate(-56, 40);
      c.rotate(0.28);
      c.fillStyle = '#f4f4f4';
      c.fillRect(-11, -5, 22, 10);
      c.strokeStyle = '#222';
      c.lineWidth = 1;
      c.strokeRect(-11, -5, 22, 10);
      c.fillStyle = '#c01818';
      c.font = 'bold 8px Arial, sans-serif';
      c.textAlign = 'center';
      c.fillText('2001', 0, 3);
      c.restore();

      // Cockpit tub
      ell(2, 6, 54, 13, '#355f22', '#1c2e12');
      ell(2, 4, 48, 9, '#6f9e3c');

      // Cadet is drawn oversized, cartoon style
      c.save();
      c.translate(4, 2);
      c.scale(1.4, 1.4);
      c.translate(-4, -2);
      // Cadet: purple suit body
      ell(8, -4, 20, 13, '#7b48c8', '#2c1a4e');
      c.fillStyle = '#9a6ae0';
      c.beginPath(); c.ellipse(4, -9, 10, 5, -0.3, 0, Math.PI * 2); c.fill();

      // Arm on the steering wheel
      c.strokeStyle = '#7b48c8';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(-2, -6); c.lineTo(-16, -2); c.stroke();
      c.strokeStyle = '#2a2a30';
      c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-22, -12); c.lineTo(-14, 6); c.stroke();
      ell(-22, -12, 7, 3, null, '#2a2a30', -0.4);
      ell(-18, -3, 3.5, 3.5, '#f0c090', '#7a4a20');

      // Thumbs-up arm
      c.strokeStyle = '#7b48c8';
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(20, -8); c.lineTo(30, -20); c.stroke();
      ell(31, -23, 5, 4.5, '#f0c090', '#7a4a20');
      c.fillStyle = '#f0c090';
      c.strokeStyle = '#7a4a20';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(29, -26); c.lineTo(29, -34); c.quadraticCurveTo(31.5, -37, 33, -33); c.lineTo(33, -26);
      c.closePath();
      c.fill();
      c.stroke();

      // Head
      ell(0, -26, 12, 13, '#f2c294', '#7a4a20');
      // Blue helmet with crest and ear piece
      c.fillStyle = '#3f86e8';
      c.strokeStyle = '#173a80';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(1, -28, 14, Math.PI * 1.02, Math.PI * 1.98);
      c.quadraticCurveTo(14, -26, 12, -22);
      c.lineTo(9, -28);
      c.quadraticCurveTo(0, -35, -9, -30);
      c.lineTo(-13, -26);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#9fd0ff';
      c.beginPath();
      c.moveTo(-6, -41); c.quadraticCurveTo(2, -48, 8, -41); c.lineTo(4, -40); c.quadraticCurveTo(1, -44, -2, -40);
      c.closePath();
      c.fill();
      ell(12, -23, 4, 5, '#9aa0b8', '#2e2f3a');

      // Face: eyes, nose and big grin
      ell(-6, -27, 3, 3.6, '#fff', '#333');
      ell(1, -27, 3, 3.6, '#fff', '#333');
      ell(-6.5, -26.5, 1.2, 1.5, '#111');
      ell(0.5, -26.5, 1.2, 1.5, '#111');
      c.strokeStyle = '#5a3010';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(-9, -32); c.lineTo(-4, -31.5); c.moveTo(-1, -31.5); c.lineTo(4, -32); c.stroke();
      ell(-3, -22.5, 2.6, 2, '#e0a070');
      c.fillStyle = '#fff';
      c.strokeStyle = '#4a1a10';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(-10, -19);
      c.quadraticCurveTo(-2, -18, 5, -20);
      c.quadraticCurveTo(0, -11, -10, -19);
      c.closePath();
      c.fill();
      c.stroke();

      c.restore();

      // Glass windshield bubble
      c.fillStyle = 'rgba(170,215,255,0.16)';
      c.strokeStyle = 'rgba(200,230,255,0.75)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, 6, 62, 72, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.fill();
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 6, 56, 66, 0, Math.PI * 1.15, Math.PI * 1.3);
      c.stroke();

      c.restore();
    }
  }

  window.appPinball = new AppPinball();
})();
