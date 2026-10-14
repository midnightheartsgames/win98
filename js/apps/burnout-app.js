/**
 * Burnout: Championship Drag Racing - Win 98 Application Wrapper
 * Connects canvas renderer, audio synthesis, physics engine, garage, and WindowManager.
 */

class AppBurnout {
  constructor() {
    this.winId = 'app_burnout';
    this.win = null;
    this.animId = null;
    this.lastTime = 0;

    // Subsystems
    this.audio = null;
    this.physics = null;
    this.renderer = null;
    this.garage = null;
    this.ui = null;

    // Current view: 'title', 'race', 'garage', 'timeslip'
    this.currentView = 'title';

    // Keyboard state
    this.keys = {};
    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleKeyUp = this.onKeyUp.bind(this);
  }

  open(initialView = 'title') {
    // If window already open, bring to top
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      if (initialView === 'race') this.startRace('race');
      return;
    }

    this.currentView = initialView;

    // Create Retro Window
    this.win = window.winManager.createWindow({
      id: this.winId,
      title: 'Burnout: Championship Drag Racing (1998 Demo)',
      icon: 'burnout',
      width: 780,
      height: 560,
      resizable: true,
      content: this.buildWindowHTML(),
      onClose: () => this.destroy()
    });

    this.initGame();
  }

  buildWindowHTML() {
    return `
      <div class="burnout-app-wrapper" style="width:100%; height:100%; display:flex; flex-direction:column; background:#000; overflow:hidden;">
        <!-- Win 98 Menu Bar -->
        <div class="win-menubar burnout-menubar">
          <div class="win-menu-item">
            Игра
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" id="menu_new_race">Быстрая гонка <span>F2</span></div>
              <div class="win-dropdown-option" id="menu_new_test">Тестовый заезд (Solo)</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" id="menu_title_screen">Главное меню</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" id="menu_exit_game">Выход <span>Alt+F4</span></div>
            </div>
          </div>
          <div class="win-menu-item">
            Гараж
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" id="menu_open_garage">Настройка драгстера... <span>F4</span></div>
              <div class="win-dropdown-option" id="menu_reset_tuning">Сбросить настройки</div>
            </div>
          </div>
          <div class="win-menu-item">
            Вид
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" id="menu_cam_cockpit">Кабина и приборы <span>F1 / C</span></div>
              <div class="win-dropdown-option" id="menu_cam_chase">Вид от 3-го лица</div>
            </div>
          </div>
          <div class="win-menu-item">
            Справка
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" id="menu_open_help">Как играть (Управление)...</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" id="menu_about_burnout">О Burnout Demo...</div>
            </div>
          </div>
        </div>

        <!-- Main Viewport Container -->
        <div class="burnout-viewport-container" id="burnout_viewport" style="flex:1; position:relative; overflow:hidden; min-height:0;">
          <!-- 3D Race Canvas -->
          <canvas id="burnout_canvas" style="width:100%; height:100%; display:block;"></canvas>

          <!-- HTML UI Overlays (Title screen, Garage, Time Slip, Help) -->
          <div id="burnout_overlay_root" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:auto;"></div>
        </div>
      </div>
    `;
  }

  initGame(containerRoot = null) {
    const root = containerRoot || (this.win ? this.win.element : document.getElementById('burnout_viewport'));
    if (!root) return;

    const canvas = root.querySelector('#burnout_canvas');
    const overlayRoot = root.querySelector('#burnout_overlay_root');

    // Initialize subsystems
    this.audio = new BurnoutAudio();
    this.physics = new BurnoutPhysics(this.audio);
    this.renderer = new BurnoutRenderer(canvas);
    this.garage = new BurnoutGarage(this.physics);
    this.ui = new BurnoutUI(this, this.physics, this.audio);

    // Initial resize
    this.onResize();

    // Attach listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Attach menu clicks
    this.attachMenuEvents(root);

    // Window resize observer
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(root);
    }

    // Switch to initial view
    if (this.currentView === 'race') {
      this.startRace('race');
    } else {
      this.showTitleScreen();
    }

    // Start Game Loop
    this.lastTime = performance.now();
    this.gameLoop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.gameLoop);
  }

  attachMenuEvents(root) {
    const bindBtn = (id, action) => {
      const el = root.querySelector(id);
      if (el) el.addEventListener('click', action);
    };

    bindBtn('#menu_new_race', () => this.startRace('race'));
    bindBtn('#menu_new_test', () => this.startRace('test'));
    bindBtn('#menu_title_screen', () => this.showTitleScreen());
    bindBtn('#menu_open_garage', () => this.showGarage());
    bindBtn('#menu_open_help', () => this.showHelp());
    bindBtn('#menu_cam_cockpit', () => this.renderer.setCameraMode('cockpit'));
    bindBtn('#menu_cam_chase', () => this.renderer.setCameraMode('chase'));

    bindBtn('#menu_reset_tuning', () => {
      this.garage.resetToDefault();
      if (window.soundSys) window.soundSys.playDing();
    });

    bindBtn('#menu_exit_game', () => {
      if (this.win) window.winManager.closeWindow(this.winId);
    });

    bindBtn('#menu_about_burnout', () => {
      window.winManager.openDialog({
        title: 'О Burnout Demo',
        icon: 'burnout',
        message: '<b>Burnout: Championship Drag Racing</b><br>Версия: 1.0 (Player\'s Choice Demo, 1998)<br>Разработчик: MediaTech West<br>Издатель: Bethesda Softworks / Hot Rod Magazine<br><br>Воссоздано для виртуальной Win 98 и диска журнала «Игромания».'
      });
    });
  }

  onResize() {
    if (!this.win && !document.getElementById('standalone-root')) return;
    const root = this.win ? this.win.element.querySelector('#burnout_viewport') : document.getElementById('burnout_viewport');
    if (!root) return;
    const canvas = root.querySelector('#burnout_canvas');
    if (!canvas) return;

    const w = root.clientWidth;
    const h = root.clientHeight;
    if (w > 0 && h > 0) {
      this.renderer.resize(w, h);
    }
  }

  showTitleScreen() {
    this.currentView = 'title';
    this.physics.state = 'PAUSED';
    if (this.audio) this.audio.stopEngine();

    const overlay = (this.win ? this.win.element : document).querySelector('#burnout_overlay_root');
    if (!overlay) return;

    overlay.style.display = 'block';
    overlay.innerHTML = this.ui.renderTitleScreenHTML();

    const btnRace = overlay.querySelector('#btn_menu_race');
    const btnTest = overlay.querySelector('#btn_menu_test');
    const btnGarage = overlay.querySelector('#btn_menu_garage');
    const btnHelp = overlay.querySelector('#btn_menu_help');

    if (btnRace) btnRace.addEventListener('click', () => this.startRace('race'));
    if (btnTest) btnTest.addEventListener('click', () => this.startRace('test'));
    if (btnGarage) btnGarage.addEventListener('click', () => this.showGarage());
    if (btnHelp) btnHelp.addEventListener('click', () => this.showHelp());
  }

  startRace(mode = 'race') {
    this.currentView = 'race';
    const overlay = (this.win ? this.win.element : document).querySelector('#burnout_overlay_root');
    if (overlay) {
      overlay.innerHTML = '';
      overlay.style.display = 'none';
    }

    this.physics.resetRace(mode);
    if (this.audio) {
      this.audio.ensureContext();
      this.audio.startEngine();
    }
  }

  showGarage() {
    this.currentView = 'garage';
    if (this.audio) this.audio.stopEngine();

    const overlay = (this.win ? this.win.element : document).querySelector('#burnout_overlay_root');
    if (!overlay) return;

    overlay.style.display = 'block';
    overlay.innerHTML = this.garage.renderGarageHTML();
    this.garage.bindEvents(overlay, () => {});
  }

  showHelp() {
    const overlay = (this.win ? this.win.element : document).querySelector('#burnout_overlay_root');
    if (!overlay) return;

    overlay.style.display = 'block';
    overlay.innerHTML = this.ui.renderHelpHTML();

    const btnClose = overlay.querySelector('#btn_close_help');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (this.currentView === 'title') this.showTitleScreen();
        else if (this.currentView === 'garage') this.showGarage();
        else {
          overlay.innerHTML = '';
          overlay.style.display = 'none';
        }
      });
    }
  }

  showTimeSlip() {
    this.currentView = 'timeslip';
    const overlay = (this.win ? this.win.element : document).querySelector('#burnout_overlay_root');
    if (!overlay) return;

    overlay.style.display = 'block';
    overlay.innerHTML = this.ui.renderTimeSlipHTML(this.physics.timeSlip);

    const btnReplay = overlay.querySelector('#btn_slip_replay');
    const btnGarage = overlay.querySelector('#btn_slip_garage');
    const btnMenu = overlay.querySelector('#btn_slip_menu');

    if (btnReplay) btnReplay.addEventListener('click', () => this.startRace(this.physics.gameMode));
    if (btnGarage) btnGarage.addEventListener('click', () => this.showGarage());
    if (btnMenu) btnMenu.addEventListener('click', () => this.showTitleScreen());
  }

  onKeyDown(e) {
    if (this.win && !this.win.element.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') {
      return;
    }

    this.keys[e.code] = true;

    // Global in-game hotkeys
    if (e.code === 'KeyC') {
      // Toggle camera
      this.renderer.setCameraMode(this.renderer.cameraMode === 'cockpit' ? 'chase' : 'cockpit');
    }
    if (e.code === 'KeyB') {
      // Line lock for burnout
      this.physics.setPlayerLineLock(true);
    }
    if (e.code === 'KeyN') {
      // Nitrous boost
      this.physics.setPlayerNitrous(true);
    }
    if (e.code === 'KeyP') {
      // Deploy parachute
      this.physics.deployPlayerParachute();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyZ') {
      this.physics.shiftUp();
    }
    if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyX') {
      this.physics.shiftDown();
    }
    if (e.code === 'F2') {
      this.startRace('race');
      e.preventDefault();
    }
    if (e.code === 'F4') {
      this.showGarage();
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      this.showTitleScreen();
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;

    if (e.code === 'KeyB') {
      this.physics.setPlayerLineLock(false);
    }
    if (e.code === 'KeyN') {
      this.physics.setPlayerNitrous(false);
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.06, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.currentView === 'race') {
      // Process throttle and brake inputs
      const isGas = (this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp']);
      const isBrake = (this.keys['KeyS'] || this.keys['ArrowDown']);

      this.physics.setPlayerThrottle(isGas ? 1.0 : 0);
      this.physics.setPlayerBrake(isBrake ? 1.0 : 0);

      // Update physics
      this.physics.update(dt);

      // Render track and cars
      this.renderer.render(this.physics, dt);

      // Trigger time slip display when race completes and car slows down
      if (this.physics.state === 'FINISHED' && this.physics.timeSlip && !this.isShowingSlip) {
        if (this.physics.player.speedMph < 40 || this.physics.player.pos > 2200) {
          this.isShowingSlip = true;
          setTimeout(() => {
            this.showTimeSlip();
            this.isShowingSlip = false;
          }, 800);
        }
      }
    } else {
      // In menus or garage: still render track background slowly
      if (this.physics) {
        this.renderer.render(this.physics, dt);
      }
    }

    this.animId = requestAnimationFrame(this.gameLoop);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.audio) this.audio.stopEngine();
    this.win = null;
  }
}

window.AppBurnout = AppBurnout;
window.appBurnout = new AppBurnout();

